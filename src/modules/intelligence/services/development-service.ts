import { db } from '../../../database/db'
import { normalizeKey } from '../../imports/core/normalizers'

export type DevelopmentStatus='explosao'|'crescimento-rapido'|'progressao'|'estagnacao'|'regressao'|'tardio'|'subutilizado'
export interface DevelopmentPoint{seasonId:string;season:string;age?:number;ca?:number;pa?:number;attributeAverage?:number;rating?:number;minutes:number;marketValue?:number;wageAnnual?:number;goals:number;assists:number}
export interface DevelopmentRow{id:string;name:string;nationality?:string;position?:string;club?:string;age?:number;ca?:number;pa?:number;potentialGap?:number;caTrend:number;attributeTrend:number;minutesTrend:number;projectionCA?:number;improveProbability:number;stableProbability:number;declineProbability:number;confidence:number;status:DevelopmentStatus;statusLabel:string;summary:string;history:DevelopmentPoint[]}

const key=(value:string)=>normalizeKey(value).replace(/\s+/g,'-')
const valueFrom=(record:Record<string,number|null>|undefined,aliases:string[])=>{const wanted=new Set(aliases.map(key));for(const [raw,v] of Object.entries(record??{}))if(typeof v==='number'&&Number.isFinite(v)&&wanted.has(key(raw)))return v;return undefined}
const average=(values:number[])=>values.length?values.reduce((a,b)=>a+b,0)/values.length:undefined
const slope=(values:Array<number|undefined>)=>{const points=values.map((v,i)=>({v,i})).filter((p):p is {v:number;i:number}=>typeof p.v==='number'&&Number.isFinite(p.v));if(points.length<2)return 0;const mx=points.reduce((s,p)=>s+p.i,0)/points.length,my=points.reduce((s,p)=>s+p.v,0)/points.length;const den=points.reduce((s,p)=>s+(p.i-mx)**2,0)||1;return points.reduce((s,p)=>s+(p.i-mx)*(p.v-my),0)/den}
const clamp=(v:number,min=0,max=100)=>Math.max(min,Math.min(max,v))
const round=(v:number,d=1)=>Number(v.toFixed(d))
let cache:Promise<{rows:DevelopmentRow[];seasons:Array<{id:string;label:string}>}>|null=null
export function clearDevelopmentCache(){cache=null}
export async function loadDevelopmentData(force=false){
  if(force)cache=null;if(cache)return cache
  cache=(async()=>{
    const [seasons,players,playerSeasons,attributes,general,stats]=await Promise.all([db.seasons.orderBy('startYear').toArray(),db.players.toArray(),db.playerSeasons.toArray(),db.playerAttributes.toArray(),db.playerGeneralMetrics.toArray(),db.playerCompetitionStats.toArray()])
    const seasonMap=new Map(seasons.map(s=>[s.id,s]));const order=new Map(seasons.map((s,i)=>[s.id,i]))
    const psByPlayer=new Map<string,typeof playerSeasons>();for(const row of playerSeasons){const list=psByPlayer.get(row.playerId)??[];list.push(row);psByPlayer.set(row.playerId,list)}
    const attrMap=new Map(attributes.map(row=>[`${row.playerId}:${row.seasonId}`,row.attributes]));const genMap=new Map(general.map(row=>[`${row.playerId}:${row.seasonId}`,row.metrics]))
    const statsMap=new Map<string,typeof stats>();for(const row of stats){const k=`${row.playerId}:${row.seasonId}`;const list=statsMap.get(k)??[];list.push(row);statsMap.set(k,list)}
    const rows:DevelopmentRow[]=players.map(player=>{
      const seasonsFor=[...(psByPlayer.get(player.id)??[])].sort((a,b)=>(order.get(a.seasonId)??0)-(order.get(b.seasonId)??0))
      const history=seasonsFor.map(ps=>{const gm=genMap.get(`${player.id}:${ps.seasonId}`);const attrs=Object.values(attrMap.get(`${player.id}:${ps.seasonId}`)??{}).filter(Number.isFinite);const st=statsMap.get(`${player.id}:${ps.seasonId}`)??[];return{seasonId:ps.seasonId,season:seasonMap.get(ps.seasonId)?.label??ps.seasonId,age:ps.age,ca:valueFrom(gm,['ca','c.a.','current ability','capacidade atual']),pa:valueFrom(gm,['pa','c.p.','potential ability','capacidade potencial']),attributeAverage:average(attrs),rating:valueFrom(gm,['avaliacao media','rating','av r','classificacao media'])??average(st.map(x=>valueFrom(x.metrics,['avaliacao media','rating','av r'])).filter((v):v is number=>v!==undefined)),minutes:st.reduce((s,x)=>s+x.minutes,0)||valueFrom(gm,['mins','minutos'])||0,marketValue:ps.marketValue,wageAnnual:ps.wageAnnual,goals:st.reduce((s,x)=>s+x.goals,0),assists:st.reduce((s,x)=>s+x.assists,0)} satisfies DevelopmentPoint})
      const latest=history.at(-1);const caTrend=slope(history.map(h=>h.ca));const attributeTrend=slope(history.map(h=>h.attributeAverage));const minutesTrend=slope(history.map(h=>h.minutes));const age=latest?.age;const gap=latest?.ca!==undefined&&latest.pa!==undefined?latest.pa-latest.ca:undefined
      const ageFactor=age===undefined?0:age<=21?10:age<=24?6:age<=28?1:age<=31?-6:-12
      const trendSignal=caTrend*7+attributeTrend*8+Math.max(-8,Math.min(8,minutesTrend/300))+ageFactor+(gap??0)*.12
      const improve=clamp(50+trendSignal);const decline=clamp(35-trendSignal+((age??25)>30?8:0));const stable=Math.max(0,100-improve-decline);const total=improve+stable+decline||1
      const improveP=round(improve/total*100),stableP=round(stable/total*100),declineP=round(decline/total*100)
      let status:DevelopmentStatus='estagnacao';if(caTrend>=5||attributeTrend>=1.2)status='explosao';else if(caTrend>=2||attributeTrend>=.5)status='crescimento-rapido';else if(caTrend>.3||attributeTrend>.15)status='progressao';else if(caTrend<=-2||attributeTrend<=-.5)status='regressao';else if((age??0)>=25&&caTrend>1)status='tardio';else if((latest?.minutes??0)<600&&(gap??0)>10)status='subutilizado'
      const labels:Record<DevelopmentStatus,string>={explosao:'Explosão', 'crescimento-rapido':'Crescimento rápido',progressao:'Progressão',estagnacao:'Estagnação',regressao:'Regressão',tardio:'Desenvolvimento tardio',subutilizado:'Potencial subutilizado'}
      const projection=latest?.ca===undefined?undefined:round(Math.min(latest.pa??200,Math.max(0,latest.ca+caTrend+(ageFactor/10))))
      const confidence=clamp(history.length*18+Math.min(35,(history.reduce((s,h)=>s+h.minutes,0)/3000)*35))
      const summary=status==='subutilizado'?`Margem potencial de ${round(gap??0)} pontos, mas com poucos minutos recentes.`:status==='regressao'?'Tendência descendente em capacidade e/ou atributos; deve ser monitorizado o impacto da idade e utilização.':`${labels[status]} sustentado por ${history.length} época(s) de dados e tendência de C.A. de ${round(caTrend)} por época.`
      return{id:player.id,name:player.name,nationality:player.nationality,position:seasonsFor.at(-1)?.position,club:seasonsFor.at(-1)?.clubName,age,ca:latest?.ca,pa:latest?.pa,potentialGap:gap,caTrend:round(caTrend),attributeTrend:round(attributeTrend,2),minutesTrend:round(minutesTrend),projectionCA:projection,improveProbability:improveP,stableProbability:stableP,declineProbability:declineP,confidence:round(confidence),status,statusLabel:labels[status],summary,history}
    }).filter(row=>row.history.length>0).sort((a,b)=>b.improveProbability-a.improveProbability)
    return{rows,seasons:seasons.map(s=>({id:s.id,label:s.label}))}
  })().catch(e=>{cache=null;throw e});return cache
}
