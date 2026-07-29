import { loadEntityProfile, loadProfileOptions } from '../../profiles/services/profile-service'
import type { EntityProfile, ProfileKind, ProfileOption } from '../../profiles/types'

export interface CompareMetric{id:string;label:string;unit:'number'|'money'|'percent'|'rating';values:Record<string,number|undefined>;description:string}
export interface CompareBundle{kind:ProfileKind;profiles:EntityProfile[];metrics:CompareMetric[];styleDimensions:Array<{id:string;label:string;values:Record<string,number|undefined>}>;evolution:Array<{id:string;label:string;unit:string;series:Array<{entityId:string;name:string;points:Array<{season:string;value?:number}>}>}>;highlights:string[]}
const latest=(profile:EntityProfile,id:string)=>profile.evolution.find(s=>s.id===id)?.points.filter(p=>p.value!==undefined).at(-1)?.value
const sumAchievements=(profile:EntityProfile)=>profile.achievements.length
export async function loadComparatorOptions(kind:ProfileKind):Promise<ProfileOption[]>{return loadProfileOptions(kind)}
export async function compareEntities(kind:ProfileKind,ids:string[]):Promise<CompareBundle>{
  const profiles=(await Promise.all(ids.map(id=>loadEntityProfile(kind,id)))).filter((x):x is EntityProfile=>Boolean(x))
  const metricDefs:Array<[string,string,CompareMetric['unit'],(p:EntityProfile)=>number|undefined,string]>=[
    ['reputation','Reputação','rating',p=>latest(p,'reputation'),'Reputação na época mais recente disponível.'],
    ['market-value','Valor de mercado','money',p=>latest(p,'market-value')??latest(p,'squad-value'),'Valor mais recente reconhecido.'],
    ['wage','Salário / massa salarial','money',p=>latest(p,'wage')??latest(p,'wage-bill'),'Valor salarial mais recente.'],
    ['ca','C.A. média','rating',p=>latest(p,'ca')??latest(p,'average-ca'),'Capacidade atual média ou individual.'],
    ['pa','C.P. média','rating',p=>latest(p,'pa')??latest(p,'average-pa'),'Capacidade potencial média ou individual.'],
    ['goals','Golos','number',p=>latest(p,'goals'),'Produção ofensiva na época mais recente.'],
    ['assists','Assistências','number',p=>latest(p,'assists'),'Criação direta na época mais recente.'],
    ['transfers','Movimentos de mercado','number',p=>p.market.summary.transfers,'Transferências reconhecidas no período total.'],
    ['market-balance','Balanço de mercado','money',p=>p.market.seasons.reduce((s,x)=>s+x.balance,0),'Receita menos investimento no período.'],
    ['achievements','Conquistas','number',p=>sumAchievements(p),'Títulos, promoções e finais registados.'],
  ]
  const metrics=metricDefs.map(([id,label,unit,get,description])=>({id,label,unit,description,values:Object.fromEntries(profiles.map(p=>[p.id,get(p)]))}))
  const styleIds=[...new Set(profiles.flatMap(p=>p.style?.dimensions.map(d=>d.id)??[]))]
  const styleDimensions=styleIds.map(id=>({id,label:profiles.flatMap(p=>p.style?.dimensions??[]).find(d=>d.id===id)?.label??id,values:Object.fromEntries(profiles.map(p=>[p.id,p.style?.dimensions.find(d=>d.id===id)?.score]))}))
  const evolutionIds=[...new Set(profiles.flatMap(p=>p.evolution.map(s=>s.id)))].slice(0,12)
  const evolution=evolutionIds.map(id=>{const source=profiles.flatMap(p=>p.evolution).find(s=>s.id===id);return{id,label:source?.label??id,unit:source?.unit??'number',series:profiles.map(p=>({entityId:p.id,name:p.name,points:(p.evolution.find(s=>s.id===id)?.points??[]).map(point=>({season:point.season,value:point.value}))}))}})
  const highlights:string[]=[]
  for(const metric of metrics){const available=profiles.map(p=>({p,v:metric.values[p.id]})).filter((x):x is {p:EntityProfile;v:number}=>typeof x.v==='number');if(available.length>1){available.sort((a,b)=>b.v-a.v);highlights.push(`${available[0].p.name} lidera em ${metric.label.toLowerCase()} (${available[0].v.toLocaleString('pt-PT',{maximumFractionDigits:1})}).`)}}
  return{kind,profiles,metrics,styleDimensions,evolution,highlights:highlights.slice(0,8)}
}
