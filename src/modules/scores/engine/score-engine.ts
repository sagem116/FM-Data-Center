import type { EntityDimensionContribution, EntityStyleProfile, PlayerRoleScore, ScoreConfig, ScoreFeatureAvailability, ScoreFeatureContribution, ScoreFeatureKind, ScoreFeatureWeight, ScorePlayerData, ScoreRoleDefinition } from '../config/types'
import { aliasesFor, normalizeFeatureRecord } from './feature-aliases'

const round=(value:number,digits=1)=>Number(value.toFixed(digits))
const clamp=(value:number,min=0,max=100)=>Math.max(min,Math.min(max,value))
type PreparedRow=ScorePlayerData&{_na:Record<string,number>;_nm:Record<string,number>}

export function scorePositionGroup(position?:string):string{
  const value=(position??'').toUpperCase()
  if(value.includes('GR')||value.includes('GK'))return'GK'
  if(value.includes('MDC')||value.includes('MD (C)')||value.includes('DM'))return'DM'
  if(value.includes('MO (C)')||value.includes('AMC'))return'AMC'
  if(value.includes('MO (D)')||value.includes('AMR'))return'AMR'
  if(value.includes('MO (E)')||value.includes('AML'))return'AML'
  if(value.includes('M (C)')||value.includes('MC'))return'MC'
  if(value.includes('DC'))return'DC'
  if(value.includes('DD')||value.includes('DR'))return'DR'
  if(value.includes('DE')||value.includes('DL'))return'DL'
  if(value.includes('AD')||value.includes('WBR'))return'WBR'
  if(value.includes('AE')||value.includes('WBL'))return'WBL'
  if(value.includes('MD')||value.includes('MR'))return'MR'
  if(value.includes('ME')||value.includes('ML'))return'ML'
  if(value.includes('PL')||value.includes('ST'))return'ST'
  return'OTHER'
}
export function isRoleCompatible(row:ScorePlayerData,role:ScoreRoleDefinition):boolean{
  const group=scorePositionGroup(row.position)
  return group==='OTHER'||role.positionGroups.includes(group)
}
function prepareRows(rows:ScorePlayerData[]):PreparedRow[]{return rows.map(row=>({...row,_na:normalizeFeatureRecord(row.attributes),_nm:normalizeFeatureRecord(row.metrics)}))}

function confidenceFromSample(minutes:number,appearances:number,config:ScoreConfig):number{
  const estimated=minutes>0?minutes:appearances*75
  const minimum=Math.max(1,config.minimumMinutes)
  const moderate=Math.max(minimum+1,config.provisionalMinutes)
  const lowUpper=minimum+(moderate-minimum)/2
  const highUpper=Math.max(2000,moderate*1.67)
  if(estimated<minimum)return 20
  if(estimated<lowUpper)return 40
  if(estimated<moderate)return 60
  if(estimated<highUpper)return 80
  return 100
}
function lowerBound(sorted:number[],value:number):number{let low=0,high=sorted.length;while(low<high){const middle=(low+high)>>>1;if(sorted[middle]<value)low=middle+1;else high=middle}return low}
function upperBound(sorted:number[],value:number):number{let low=0,high=sorted.length;while(low<high){const middle=(low+high)>>>1;if(sorted[middle]<=value)low=middle+1;else high=middle}return low}
function percentile(value:number,sorted:number[],direction:'higher'|'lower'):number{
  if(sorted.length<2)return 50
  const lower=lowerBound(sorted,value),equal=upperBound(sorted,value)-lower
  const pct=((lower+equal/2)/sorted.length)*100
  return direction==='lower'?100-pct:pct
}
function rawValue(kind:ScoreFeatureKind,featureId:string,row:PreparedRow|ScorePlayerData):number|null{
  const record=kind==='attribute'?(('_na'in row&&row._na)||normalizeFeatureRecord(row.attributes)):(('_nm'in row&&row._nm)||normalizeFeatureRecord(row.metrics))
  for(const alias of aliasesFor(kind,featureId))if(alias in record&&Number.isFinite(record[alias]))return record[alias]
  return null
}
function component(features:ScoreFeatureWeight[],kind:ScoreFeatureKind,row:PreparedRow,distribution:(featureId:string)=>number[],strategy:'renormalize'|'zero'):{score:number;coverage:number;contributions:ScoreFeatureContribution[]}{
  const enabled=features.filter(feature=>feature.enabled&&feature.weight>0)
  const totalWeight=enabled.reduce((sum,feature)=>sum+feature.weight,0)||1
  let availableWeight=0
  const contributions=enabled.map(feature=>{
    const value=rawValue(kind,feature.id,row)
    if(value===null)return{id:feature.id,label:feature.label,kind,rawValue:null,normalizedValue:null,weight:feature.weight,contribution:0,direction:feature.direction,available:false} satisfies ScoreFeatureContribution
    availableWeight+=feature.weight
    const normalizedValue=kind==='attribute'?clamp(((value-1)/19)*100):percentile(value,distribution(feature.id),feature.direction)
    return{id:feature.id,label:feature.label,kind,rawValue:value,normalizedValue:round(normalizedValue),weight:feature.weight,contribution:normalizedValue*feature.weight,direction:feature.direction,available:true} satisfies ScoreFeatureContribution
  })
  const divisor=strategy==='renormalize'?(availableWeight||1):totalWeight
  const score=contributions.reduce((sum,item)=>sum+item.contribution,0)/divisor
  return{score:round(score),coverage:round((availableWeight/totalWeight)*100),contributions}
}
function contextScore(row:PreparedRow,role:ScoreRoleDefinition,enabled:boolean):number{
  if(!enabled)return 50
  const group=scorePositionGroup(row.position)
  const positionFit=role.positionGroups.includes(group)?100:group==='OTHER'?55:35
  const reputation=row.context.competitionReputation
  const competition=reputation===undefined?50:clamp((reputation/200)*100)
  return round(positionFit*.7+competition*.3)
}

export function analyzeFeatureAvailability(rows:ScorePlayerData[],role:ScoreRoleDefinition):ScoreFeatureAvailability[]{
  const prepared=prepareRows(rows)
  const features=[...role.attributes.filter(item=>item.enabled).map(item=>({...item,kind:'attribute' as const})),...role.metrics.filter(item=>item.enabled).map(item=>({...item,kind:'metric' as const}))]
  return features.map(feature=>{
    const availableRows=prepared.reduce((sum,row)=>sum+(rawValue(feature.kind,feature.id,row)!==null?1:0),0)
    const coverage=prepared.length?round(availableRows/prepared.length*100):0
    const status:ScoreFeatureAvailability['status']=availableRows===0?'missing':coverage<80?'partial':'available'
    return{id:feature.id,label:feature.label,kind:feature.kind,availableRows,totalRows:prepared.length,coverage,status}
  }).sort((a,b)=>a.status===b.status?a.coverage-b.coverage:a.status==='missing'?-1:b.status==='missing'?1:a.status==='partial'?-1:1)
}

export function computeRoleScores(rows:ScorePlayerData[],role:ScoreRoleDefinition,config:ScoreConfig):PlayerRoleScore[]{
  const prepared=prepareRows(rows)
  const cohorts=new Map<string,PreparedRow[]>()
  const cohortKey=(row:ScorePlayerData)=>config.normalizationScope==='global'?'all':config.normalizationScope==='competition'?(row.competitionId??'none'):config.normalizationScope==='position-competition'?`${scorePositionGroup(row.position)}:${row.competitionId??'none'}`:scorePositionGroup(row.position)
  for(const row of prepared){const key=cohortKey(row);const list=cohorts.get(key)??[];list.push(row);cohorts.set(key,list)}
  const distributions=new Map<string,number[]>()
  for(const [key,cohort] of cohorts)for(const [kind,features] of [['attribute',role.attributes],['metric',role.metrics]] as const)for(const feature of features){
    if(!feature.enabled)continue
    distributions.set(`${key}:${kind}:${feature.id}`,cohort.map(item=>rawValue(kind,feature.id,item)).filter((item):item is number=>item!==null).sort((a,b)=>a-b))
  }
  return prepared.map(row=>{
    const key=cohortKey(row)
    const distribution=(kind:ScoreFeatureKind)=>(featureId:string)=>distributions.get(`${key}:${kind}:${featureId}`)??[]
    const attributes=component(role.attributes,'attribute',row,distribution('attribute'),config.missingFeatureStrategy)
    const metrics=component(role.metrics,'metric',row,distribution('metric'),config.missingFeatureStrategy)
    const context=contextScore(row,role,config.contextEnabled)
    const componentTotal=role.components.attributes+role.components.metrics+role.components.context||100
    const score=(attributes.score*role.components.attributes+metrics.score*role.components.metrics+context*role.components.context)/componentTotal
    const coverage=(attributes.coverage*role.components.attributes+metrics.coverage*role.components.metrics+100*role.components.context)/componentTotal
    const confidence=confidenceFromSample(row.minutes,row.appearances,config)
    const adjusted=score*(.7+.3*confidence/100)
    const contributions=[...attributes.contributions,...metrics.contributions]
    const available=contributions.filter(item=>item.available&&item.normalizedValue!==null)
    const strengths=[...available].sort((a,b)=>(b.normalizedValue??0)-(a.normalizedValue??0)).slice(0,3).map(item=>item.label)
    const limitations=[...available].sort((a,b)=>(a.normalizedValue??0)-(b.normalizedValue??0)).slice(0,3).map(item=>item.label)
    return{playerId:row.playerId,playerName:row.playerName,seasonId:row.seasonId,clubId:row.clubId,clubName:row.clubName,competitionId:row.competitionId,competitionName:row.competitionName,position:row.position,age:row.age,nationality:row.nationality,roleId:role.id,roleName:role.name,score:round(score),attributeScore:attributes.score,performanceScore:metrics.score,contextScore:context,confidence,coverage:round(coverage),adjustedScore:round(adjusted),minutes:row.minutes,appearances:row.appearances,strengths,limitations,contributions}
  }).sort((a,b)=>b.score-a.score)
}

function inferenceDistributions(rows:PreparedRow[],config:ScoreConfig):Map<string,number[]>{
  const map=new Map<string,number[]>()
  for(const dimension of config.inferenceDimensions)for(const feature of dimension.features){
    const key=`${feature.kind}:${feature.id}`
    if(!map.has(key))map.set(key,rows.map(row=>rawValue(feature.kind,feature.id,row)).filter((value):value is number=>value!==null).sort((a,b)=>a-b))
  }
  return map
}
function dimensionContribution(items:PreparedRow[],feature:ScoreConfig['inferenceDimensions'][number]['features'][number],distributions:Map<string,number[]>):EntityDimensionContribution{
  const values=items.map(row=>rawValue(feature.kind,feature.id,row)).filter((value):value is number=>value!==null)
  const normalized=values.map(value=>feature.kind==='attribute'?clamp(((value-1)/19)*100):percentile(value,distributions.get(`${feature.kind}:${feature.id}`)??[],feature.direction))
  return{id:feature.id,label:feature.id.replace(/-/g,' '),kind:feature.kind,weight:feature.weight,direction:feature.direction,averageRawValue:values.length?round(values.reduce((a,b)=>a+b,0)/values.length,2):undefined,normalizedValue:normalized.length?round(normalized.reduce((a,b)=>a+b,0)/normalized.length):undefined,availablePlayers:values.length,totalPlayers:items.length}
}

export function buildStyleProfiles(rows:ScorePlayerData[],config:ScoreConfig,entity:'competition'|'club',scores?:PlayerRoleScore[]):EntityStyleProfile[]{
  const prepared=prepareRows(rows)
  const distributions=inferenceDistributions(prepared,config)
  const groups=new Map<string,PreparedRow[]>()
  for(const row of prepared){const id=entity==='competition'?row.competitionId:row.clubId;if(!id)continue;const list=groups.get(id)??[];list.push(row);groups.set(id,list)}
  const scoreByPlayer=new Map(scores?.map(score=>[score.playerId,score])??[])
  const scoreByClub=new Map<string,PlayerRoleScore[]>()
  for(const score of scores??[]){if(!score.clubId)continue;const list=scoreByClub.get(score.clubId)??[];list.push(score);scoreByClub.set(score.clubId,list)}
  return [...groups.entries()].map(([id,rawItems])=>{
    const uniqueByPlayer=new Map<string,PreparedRow>()
    for(const item of rawItems)if(!uniqueByPlayer.has(item.playerId))uniqueByPlayer.set(item.playerId,item)
    const items=[...uniqueByPlayer.values()]
    const name=entity==='competition'?(rawItems[0].competitionName??id):(rawItems[0].clubName??id)
    const dimensions:Record<string,number>={},dimensionCoverage:Record<string,number>={},dimensionContributions:Record<string,EntityDimensionContribution[]>={}
    const missingFeatures=new Set<string>()
    for(const dimension of config.inferenceDimensions){
      const details=dimension.features.map(feature=>dimensionContribution(items,feature,distributions))
      dimensionContributions[dimension.id]=details
      const totalWeight=details.reduce((sum,item)=>sum+item.weight,0)||1
      const available=details.filter(item=>item.normalizedValue!==undefined)
      const availableWeight=available.reduce((sum,item)=>sum+item.weight,0)
      dimensions[dimension.id]=availableWeight?round(available.reduce((sum,item)=>sum+(item.normalizedValue??0)*item.weight,0)/availableWeight):0
      dimensionCoverage[dimension.id]=round(availableWeight/totalWeight*100)
      for(const item of details)if(item.availablePlayers===0)missingFeatures.add(item.label)
    }
    const ordered=config.inferenceDimensions.map(item=>({id:item.id,name:item.name,value:dimensions[item.id]??0})).sort((a,b)=>b.value-a.value)
    const strongest=ordered[0],weakest=ordered[ordered.length-1]
    const prefix=strongest&&strongest.value>=60?`Perfil de ${strongest.name.toLowerCase()}`:'Perfil equilibrado'
    const contrast=strongest&&weakest&&strongest.value-weakest.value>=12?`, claramente mais ${strongest.name.toLowerCase()} do que ${weakest.name.toLowerCase()}`:''
    const related=entity==='competition'?items.map(item=>scoreByPlayer.get(item.playerId)).filter((item):item is PlayerRoleScore=>Boolean(item)):scoreByClub.get(id)??[]
    const averageFeature=(featureId:string)=>{const values=items.map(item=>rawValue('metric',featureId,item)).filter((value):value is number=>value!==null);return values.length?values.reduce((sum,value)=>sum+value,0)/values.length:undefined}
    return{entityId:id,entityName:name,seasonId:rawItems[0].seasonId,playerCount:items.length,dimensions,dimensionCoverage,dimensionContributions,missingFeatures:[...missingFeatures],summary:`${prefix}${contrast}.`,strongestDimension:strongest?.name,weakestDimension:weakest?.name,averageRoleScore:related.length?round(related.reduce((sum,item)=>sum+item.score,0)/related.length):undefined,averages:{marketValue:averageFeature('valor-de-mercado'),wageAnnual:averageFeature('salario-anual'),currentAbility:averageFeature('ca'),potentialAbility:averageFeature('pa'),rating:averageFeature('avaliacao-media')}}
  }).sort((a,b)=>(b.averageRoleScore??0)-(a.averageRoleScore??0))
}
