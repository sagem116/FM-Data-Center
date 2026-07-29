import { loadScoreConfig, saveScoreConfig } from '../../scores/config/score-config-store'
import type { ScoreConfig, ScoreFeatureKind, ScoreRoleDefinition } from '../../scores/config/types'
import { aliasesFor, getFeatureAliasOverrides, normalizedFeatureKey, normalizeFeatureRecord, setFeatureAliasOverride } from '../../scores/engine/feature-aliases'
import { loadScoreData } from '../../scores/services/scores-service'

export type ScoreDebugSeverity='error'|'warning'|'info'
export interface ScoreDebugIssue{id:string;severity:ScoreDebugSeverity;code:string;title:string;detail:string;roleId?:string;roleName?:string;featureKind?:ScoreFeatureKind;featureId?:string;coverage?:number;availableRows?:number;totalRows?:number;suggestions?:string[];editable:boolean}
export interface ScoreDebugSnapshot{generatedAt:string;seasonId?:string;summary:{roles:number;activeRoles:number;players:number;issues:number;errors:number;warnings:number;missingFeatures:number;partialFeatures:number;configConflicts:number;manualAliases:number};availableAttributeKeys:Array<{key:string;rows:number}>;availableMetricKeys:Array<{key:string;rows:number}>;issues:ScoreDebugIssue[]}

interface CoverageIndex {
  attributeKeys:Array<{key:string;rows:number}>
  metricKeys:Array<{key:string;rows:number}>
  counts:Map<string,number>
}
const yieldToBrowser=()=>new Promise<void>(resolve=>setTimeout(resolve,0))
function requestedFeatures(config:ScoreConfig){
  const map=new Map<string,{kind:ScoreFeatureKind;id:string}>()
  for(const role of config.roles.filter(item=>item.enabled))for(const kind of ['attribute','metric'] as const){
    const list=kind==='attribute'?role.attributes:role.metrics
    for(const feature of list.filter(item=>item.enabled))map.set(`${kind}:${feature.id}`,{kind,id:feature.id})
  }
  return[...map.values()]
}
async function buildCoverageIndex(rows:Awaited<ReturnType<typeof loadScoreData>>['playerRows'],config:ScoreConfig):Promise<CoverageIndex>{
  const features=requestedFeatures(config),aliasIndex={attribute:new Map<string,string[]>(),metric:new Map<string,string[]>()}
  for(const feature of features)for(const alias of aliasesFor(feature.kind,feature.id)){
    const list=aliasIndex[feature.kind].get(alias)??[]
    list.push(feature.id);aliasIndex[feature.kind].set(alias,list)
  }
  const keyCounts={attribute:new Map<string,number>(),metric:new Map<string,number>()},counts=new Map<string,number>()
  for(let index=0;index<rows.length;index++){
    const row=rows[index]
    for(const kind of ['attribute','metric'] as const){
      const record=normalizeFeatureRecord(kind==='attribute'?row.attributes:row.metrics)
      const found=new Set<string>()
      for(const key of Object.keys(record)){
        keyCounts[kind].set(key,(keyCounts[kind].get(key)??0)+1)
        for(const featureId of aliasIndex[kind].get(key)??[])found.add(featureId)
      }
      for(const featureId of found)counts.set(`${kind}:${featureId}`,(counts.get(`${kind}:${featureId}`)??0)+1)
    }
    if(index>0&&index%2500===0)await yieldToBrowser()
  }
  const sorted=(map:Map<string,number>)=>[...map.entries()].map(([key,rows])=>({key,rows})).sort((a,b)=>b.rows-a.rows||a.key.localeCompare(b.key))
  return{attributeKeys:sorted(keyCounts.attribute),metricKeys:sorted(keyCounts.metric),counts}
}
function scoreSuggestion(id:string,key:string):number{const a=new Set(normalizedFeatureKey(id).split('-').filter(Boolean)),b=new Set(normalizedFeatureKey(key).split('-').filter(Boolean));let common=0;for(const token of a)if(b.has(token))common++;const substring=normalizedFeatureKey(key).includes(normalizedFeatureKey(id))||normalizedFeatureKey(id).includes(normalizedFeatureKey(key))?3:0;return common*4+substring-Math.abs(normalizedFeatureKey(id).length-normalizedFeatureKey(key).length)/20}
function suggestions(id:string,keys:Array<{key:string;rows:number}>){return [...keys].sort((a,b)=>scoreSuggestion(id,b.key)-scoreSuggestion(id,a.key)||b.rows-a.rows).slice(0,12).map(item=>item.key)}
function weightTotal(role:ScoreRoleDefinition,kind:ScoreFeatureKind){return (kind==='attribute'?role.attributes:role.metrics).filter(item=>item.enabled).reduce((sum,item)=>sum+item.weight,0)}

export async function collectScoreDebug(seasonId?:string):Promise<ScoreDebugSnapshot>{
  const config=loadScoreConfig(),data=await loadScoreData(seasonId),rows=data.playerRows
  const coverageIndex=await buildCoverageIndex(rows,config),attributeKeys=coverageIndex.attributeKeys,metricKeys=coverageIndex.metricKeys,issues:ScoreDebugIssue[]=[]
  const seenRoleIds=new Set<string>(),seenRoleNames=new Set<string>()
  for(const role of config.roles){
    if(seenRoleIds.has(role.id))issues.push({id:`duplicate-role-id:${role.id}`,severity:'error',code:'DUPLICATE_ROLE_ID',title:`ID de role duplicado: ${role.id}`,detail:'Dois modelos usam o mesmo identificador e podem sobrescrever resultados.',roleId:role.id,roleName:role.name,editable:true});seenRoleIds.add(role.id)
    const nameKey=normalizedFeatureKey(role.name);if(seenRoleNames.has(nameKey))issues.push({id:`duplicate-role-name:${nameKey}`,severity:'warning',code:'DUPLICATE_ROLE_NAME',title:`Nome de role repetido: ${role.name}`,detail:'Confirma se são roles distintas ou uma duplicação acidental.',roleId:role.id,roleName:role.name,editable:true});seenRoleNames.add(nameKey)
    const componentTotal=role.components.attributes+role.components.metrics+role.components.context
    if(Math.abs(componentTotal-100)>.01)issues.push({id:`components:${role.id}`,severity:'error',code:'COMPONENT_WEIGHT_CONFLICT',title:`Pesos principais não somam 100% em ${role.name}`,detail:`Total atual: ${componentTotal}%.`,roleId:role.id,roleName:role.name,editable:true})
    for(const kind of ['attribute','metric'] as const){const total=weightTotal(role,kind);if(Math.abs(total-100)>.5)issues.push({id:`weights:${role.id}:${kind}`,severity:'warning',code:'FEATURE_WEIGHT_CONFLICT',title:`Pesos de ${kind==='attribute'?'atributos':'métricas'} somam ${total}%`,detail:`Role: ${role.name}. O motor renormaliza, mas a configuração deveria aproximar-se de 100%.`,roleId:role.id,roleName:role.name,featureKind:kind,editable:true})}
    if(!role.positionGroups.length)issues.push({id:`positions:${role.id}`,severity:'warning',code:'ROLE_WITHOUT_POSITIONS',title:`Role sem posições: ${role.name}`,detail:'A role será aplicada a todos os jogadores, reduzindo a qualidade da análise.',roleId:role.id,roleName:role.name,editable:true})
    if(!role.enabled)continue
    for(const kind of ['attribute','metric'] as const){
      const keys=kind==='attribute'?attributeKeys:metricKeys,list=kind==='attribute'?role.attributes:role.metrics
      for(const feature of list.filter(item=>item.enabled)){
        const availableRows=coverageIndex.counts.get(`${kind}:${feature.id}`)??0,coverage=rows.length?Number((availableRows/rows.length*100).toFixed(1)):0
        if(availableRows>0&&coverage>=80)continue
        const missing=availableRows===0
        issues.push({id:`feature:${role.id}:${kind}:${feature.id}`,severity:missing?'error':'warning',code:missing?'FEATURE_MISSING':'FEATURE_PARTIAL',title:`${missing?'Em falta':'Cobertura parcial'}: ${feature.label}`,detail:`${role.name} · ${availableRows}/${rows.length} jogadores (${coverage}%).`,roleId:role.id,roleName:role.name,featureKind:kind,featureId:feature.id,coverage,availableRows,totalRows:rows.length,suggestions:suggestions(feature.id,keys),editable:true})
      }
    }
  }
  if(!rows.length)issues.unshift({id:'no-score-data',severity:'error',code:'NO_SCORE_DATA',title:'Sem jogadores disponíveis para Scores',detail:'Importa Jogadores e Estatísticas para a mesma época.',editable:false})
  const configConflicts=issues.filter(item=>['DUPLICATE_ROLE_ID','DUPLICATE_ROLE_NAME','COMPONENT_WEIGHT_CONFLICT','FEATURE_WEIGHT_CONFLICT','ROLE_WITHOUT_POSITIONS'].includes(item.code)).length
  const aliases=Object.values(getFeatureAliasOverrides()).reduce((sum,list)=>sum+list.length,0)
  return{generatedAt:new Date().toISOString(),seasonId:seasonId??data.seasons[0]?.id,summary:{roles:config.roles.length,activeRoles:config.roles.filter(item=>item.enabled).length,players:rows.length,issues:issues.length,errors:issues.filter(item=>item.severity==='error').length,warnings:issues.filter(item=>item.severity==='warning').length,missingFeatures:issues.filter(item=>item.code==='FEATURE_MISSING').length,partialFeatures:issues.filter(item=>item.code==='FEATURE_PARTIAL').length,configConflicts,manualAliases:aliases},availableAttributeKeys:attributeKeys,availableMetricKeys:metricKeys,issues}
}
export function mapScoreFeature(kind:ScoreFeatureKind,featureId:string,actualKey:string):void{setFeatureAliasOverride(kind,featureId,actualKey)}
export function disableScoreFeature(roleId:string,kind:ScoreFeatureKind,featureId:string):void{const config=loadScoreConfig();const role=config.roles.find(item=>item.id===roleId);if(!role)return;const list=kind==='attribute'?role.attributes:role.metrics;const feature=list.find(item=>item.id===featureId);if(feature)feature.enabled=false;saveScoreConfig(config)}
export function normalizeRoleWeights(roleId:string,kind:'components'|ScoreFeatureKind):void{const config=loadScoreConfig(),role=config.roles.find(item=>item.id===roleId);if(!role)return;if(kind==='components'){const total=role.components.attributes+role.components.metrics+role.components.context;if(total>0){role.components.attributes=Number((role.components.attributes/total*100).toFixed(2));role.components.metrics=Number((role.components.metrics/total*100).toFixed(2));role.components.context=Number((100-role.components.attributes-role.components.metrics).toFixed(2))}}else{const list=(kind==='attribute'?role.attributes:role.metrics).filter(item=>item.enabled),total=list.reduce((sum,item)=>sum+item.weight,0);if(total>0){let used=0;list.forEach((item,index)=>{item.weight=index===list.length-1?Number((100-used).toFixed(2)):Number((item.weight/total*100).toFixed(2));used+=item.weight})}}saveScoreConfig(config)}
export function exportScoreDebug(snapshot:ScoreDebugSnapshot):string{return JSON.stringify({version:1,generatedAt:snapshot.generatedAt,summary:snapshot.summary,issues:snapshot.issues,availableAttributeKeys:snapshot.availableAttributeKeys,availableMetricKeys:snapshot.availableMetricKeys},null,2)}
export function renameScoreRole(roleId:string,name:string):void{const config=loadScoreConfig();const role=config.roles.find(item=>item.id===roleId);if(role&&name.trim()){role.name=name.trim();saveScoreConfig(config)}}
export function setRoleAllPositions(roleId:string):void{const config=loadScoreConfig();const role=config.roles.find(item=>item.id===roleId);if(role){role.positionGroups=['GK','DC','DR','DL','WBR','WBL','DM','MC','MR','ML','AMC','AMR','AML','ST'];saveScoreConfig(config)}}
