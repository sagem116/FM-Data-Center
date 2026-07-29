import { db } from '../../../database/db'
import type { PlayerCompetitionStats } from '../../../shared/types/entities'
import type { ScorePlayerData } from '../config/types'

export interface ScoreDataBundle { playerRows:ScorePlayerData[]; competitionRows:ScorePlayerData[]; seasons:Array<{id:string;label:string}> }

const cache = new Map<string, Promise<ScoreDataBundle>>()

function numericRecord(input:Record<string,number|null>|undefined):Record<string,number>{
  const out:Record<string,number>={}
  for(const [key,value] of Object.entries(input??{}))if(typeof value==='number'&&Number.isFinite(value))out[key]=value
  return out
}
function withSeasonValues(metrics:Record<string,number>,season?:{marketValue?:number;wageAnnual?:number}):Record<string,number>{
  const next={...metrics}
  if(typeof season?.marketValue==='number'&&Number.isFinite(season.marketValue)){
    next['valor-de-mercado']=season.marketValue
    next.marketValue=season.marketValue
  }
  if(typeof season?.wageAnnual==='number'&&Number.isFinite(season.wageAnnual)){
    next['salario-anual']=season.wageAnnual
    next.wageAnnual=season.wageAnnual
  }
  return next
}
function statsMetrics(stat:PlayerCompetitionStats):Record<string,number>{
  return{...numericRecord(stat.metrics),goals:stat.goals,gls:stat.goals,assists:stat.assists,ast:stat.assists,appearances:stat.appearances,minutes:stat.minutes}
}

async function loadScoreDataUncached(seasonId?:string):Promise<ScoreDataBundle>{
  const seasons=await db.seasons.orderBy('startYear').reverse().toArray()
  const selected=seasonId??seasons[0]?.id
  if(!selected)return{playerRows:[],competitionRows:[],seasons:[]}
  const [playerSeasons,attributes,general,stats,competitions]=await Promise.all([
    db.playerSeasons.where('seasonId').equals(selected).toArray(),
    db.playerAttributes.where('seasonId').equals(selected).toArray(),
    db.playerGeneralMetrics.where('seasonId').equals(selected).toArray(),
    db.playerCompetitionStats.where('seasonId').equals(selected).toArray(),
    db.competitions.toArray(),
  ])
  const playerIds=[...new Set([...playerSeasons.map(item=>item.playerId),...stats.map(item=>item.playerId)])]
  const players=(await db.players.bulkGet(playerIds)).filter((item):item is NonNullable<typeof item>=>Boolean(item))
  const playerMap=new Map(players.map(item=>[item.id,item]))
  const seasonMap=new Map(playerSeasons.map(item=>[item.playerId,item]))
  const attributeMap=new Map(attributes.map(item=>[item.playerId,item.attributes]))
  const generalMap=new Map(general.map(item=>[item.playerId,numericRecord(item.metrics)]))
  const competitionMap=new Map(competitions.map(item=>[item.id,item]))

  const competitionRows:ScorePlayerData[]=stats.map(stat=>{
    const player=playerMap.get(stat.playerId);const season=seasonMap.get(stat.playerId);const competition=competitionMap.get(stat.competitionId)
    const metrics=withSeasonValues({...generalMap.get(stat.playerId),...statsMetrics(stat)},season)
    const minutes=stat.minutes||metrics.mins||0
    return{playerId:stat.playerId,playerName:player?.name??stat.playerId,seasonId:selected,clubId:stat.clubId??season?.clubId,clubName:stat.clubName??season?.clubName,competitionId:stat.competitionId,competitionName:stat.competitionName,position:season?.position,age:season?.age,nationality:player?.nationality,appearances:stat.appearances,minutes,attributes:attributeMap.get(stat.playerId)??{},metrics,context:{competitionReputation:competition?.reputation}}
  })

  const byPlayer=new Map<string,ScorePlayerData[]>()
  for(const row of competitionRows){const list=byPlayer.get(row.playerId)??[];list.push(row);byPlayer.set(row.playerId,list)}
  for(const playerId of playerIds)if(!byPlayer.has(playerId)){
    const player=playerMap.get(playerId);const season=seasonMap.get(playerId);const metrics=withSeasonValues(generalMap.get(playerId)??{},season)
    byPlayer.set(playerId,[{playerId,playerName:player?.name??playerId,seasonId:selected,clubId:season?.clubId,clubName:season?.clubName,position:season?.position,age:season?.age,nationality:player?.nationality,appearances:metrics.jogos??0,minutes:metrics.mins??0,attributes:attributeMap.get(playerId)??{},metrics,context:{}}])
  }
  const playerRows=[...byPlayer.values()].map(items=>{
    const first=items[0];const totalApps=items.reduce((sum,item)=>sum+item.appearances,0);const totalMinutes=items.reduce((sum,item)=>sum+item.minutes,0)
    const metricKeys=[...new Set(items.flatMap(item=>Object.keys(item.metrics)))]
    const metrics:Record<string,number>={}
    for(const key of metricKeys){
      if(['goals','gls','assists','ast','appearances','minutes'].includes(key)){metrics[key]=items.reduce((sum,item)=>sum+(item.metrics[key]??0),0);continue}
      if(['valor-de-mercado','marketValue','salario-anual','wageAnnual','ca','c-a','c_a','pa','c-p','c_p'].includes(key)){
        const found=items.find(item=>Number.isFinite(item.metrics[key]))?.metrics[key]
        if(typeof found==='number')metrics[key]=found
        continue
      }
      const values=items.filter(item=>Number.isFinite(item.metrics[key])).map(item=>({value:item.metrics[key],weight:item.minutes||item.appearances||1}))
      if(values.length)metrics[key]=values.reduce((sum,item)=>sum+item.value*item.weight,0)/values.reduce((sum,item)=>sum+item.weight,0)
    }
    return{...first,competitionId:undefined,competitionName:undefined,appearances:totalApps,minutes:totalMinutes,metrics}
  })
  return{playerRows,competitionRows,seasons:seasons.map(item=>({id:item.id,label:item.label}))}
}

export function clearScoreDataCache():void{cache.clear()}
export async function loadScoreData(seasonId?:string,force=false):Promise<ScoreDataBundle>{
  const key=seasonId??'latest'
  if(force)cache.delete(key)
  const existing=cache.get(key)
  if(existing)return existing
  const promise=loadScoreDataUncached(seasonId).catch(error=>{cache.delete(key);throw error})
  cache.set(key,promise)
  return promise
}
