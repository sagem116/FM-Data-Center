import { loadScoreConfig } from '../../scores/config/score-config-store'
import type { PlayerRoleScore, ScorePlayerData, ScoreRoleDefinition } from '../../scores/config/types'
import { buildStyleProfiles, computeRoleScores, isRoleCompatible, scorePositionGroup } from '../../scores/engine/score-engine'
import { loadScoreData } from '../../scores/services/scores-service'

export interface TacticalSlotDefinition { id:string; label:string; line:'GK'|'DEF'|'MID'|'AM'|'ATT'; groups:string[]; roleHints?:string[] }
export interface TacticalFormation { id:string; name:string; shape:string; description:string; slots:TacticalSlotDefinition[] }
export interface TacticalAssignment { slot:TacticalSlotDefinition; playerId?:string; playerName?:string; position?:string; roleId?:string; roleName?:string; score?:number; adjustedScore?:number; confidence?:number; coverage?:number; alternatives:Array<{playerId:string;playerName:string;roleName:string;score:number}> }
export interface TacticalAnalysis { formation:TacticalFormation; clubId:string; clubName:string; seasonId:string; assignments:TacticalAssignment[]; teamScore:number; depthScore:number; coverage:number; confidence:number; style:Record<string,number>; strengths:string[]; risks:string[]; unusedPlayers:Array<{id:string;name:string;position?:string;bestScore:number}> }

const slot=(id:string,label:string,line:TacticalSlotDefinition['line'],groups:string[],roleHints:string[]=[]):TacticalSlotDefinition=>({id,label,line,groups,roleHints})
export const TACTICAL_FORMATIONS:TacticalFormation[]=[
  {id:'4231',name:'4-2-3-1',shape:'4-2-3-1',description:'Estrutura equilibrada com três criadores atrás do avançado.',slots:[slot('gk','GR','GK',['GK'],['guarda-redes']),slot('dl','DE','DEF',['DL','WBL'],['lateral']),slot('dcl','DC E','DEF',['DC'],['defesa']),slot('dcr','DC D','DEF',['DC'],['defesa']),slot('dr','DD','DEF',['DR','WBR'],['lateral']),slot('mcl','MC E','MID',['MC','DM'],['medio-centro','construtor','box-to-box']),slot('mcr','MC D','MID',['MC','DM'],['medio-centro','recuperador','organizador']),slot('aml','MO E','AM',['AML','ML'],['extremo','avancado-interior']),slot('amc','MO C','AM',['AMC','MC'],['medio-ofensivo','organizador-avancado','segundo-avancado']),slot('amr','MO D','AM',['AMR','MR'],['extremo','avancado-interior']),slot('st','PL','ATT',['ST'],['avancado','ponta-de-lanca'])]},
  {id:'433dm',name:'4-3-3 com trinco',shape:'4-1-2-3',description:'Controlo central, proteção defensiva e largura ofensiva.',slots:[slot('gk','GR','GK',['GK']),slot('dl','DE','DEF',['DL','WBL']),slot('dcl','DC E','DEF',['DC']),slot('dcr','DC D','DEF',['DC']),slot('dr','DD','DEF',['DR','WBR']),slot('dm','MDC','MID',['DM','MC'],['trinco','medio-defensivo','organizador']),slot('mcl','MC E','MID',['MC'],['medio-centro','mezzala','box-to-box']),slot('mcr','MC D','MID',['MC'],['medio-centro','construtor','carrilero']),slot('aml','MO E','AM',['AML','ML']),slot('amr','MO D','AM',['AMR','MR']),slot('st','PL','ATT',['ST'])]},
  {id:'442',name:'4-4-2',shape:'4-4-2',description:'Duas linhas compactas e dupla de avançados.',slots:[slot('gk','GR','GK',['GK']),slot('dl','DE','DEF',['DL','WBL']),slot('dcl','DC E','DEF',['DC']),slot('dcr','DC D','DEF',['DC']),slot('dr','DD','DEF',['DR','WBR']),slot('ml','ME','MID',['ML','AML']),slot('mcl','MC E','MID',['MC','DM']),slot('mcr','MC D','MID',['MC','DM']),slot('mr','MD','MID',['MR','AMR']),slot('stl','PL E','ATT',['ST']),slot('str','PL D','ATT',['ST'])]},
  {id:'3421',name:'3-4-2-1',shape:'3-4-2-1',description:'Superioridade na construção e dois jogadores entrelinhas.',slots:[slot('gk','GR','GK',['GK']),slot('dcl','DC E','DEF',['DC']),slot('dcc','DC C','DEF',['DC']),slot('dcr','DC D','DEF',['DC']),slot('wbl','ALA E','MID',['WBL','DL','ML']),slot('mcl','MC E','MID',['MC','DM']),slot('mcr','MC D','MID',['MC','DM']),slot('wbr','ALA D','MID',['WBR','DR','MR']),slot('aml','MO E','AM',['AML','AMC','ML']),slot('amr','MO D','AM',['AMR','AMC','MR']),slot('st','PL','ATT',['ST'])]},
  {id:'352',name:'3-5-2',shape:'3-5-2',description:'Densidade central, alas profundos e dois avançados.',slots:[slot('gk','GR','GK',['GK']),slot('dcl','DC E','DEF',['DC']),slot('dcc','DC C','DEF',['DC']),slot('dcr','DC D','DEF',['DC']),slot('wbl','ALA E','MID',['WBL','DL','ML']),slot('dm','MDC','MID',['DM','MC']),slot('mcl','MC E','MID',['MC']),slot('mcr','MC D','MID',['MC']),slot('wbr','ALA D','MID',['WBR','DR','MR']),slot('stl','PL E','ATT',['ST']),slot('str','PL D','ATT',['ST'])]},
  {id:'4141',name:'4-1-4-1',shape:'4-1-4-1',description:'Bloco estável, boa cobertura dos corredores e pressão coordenada.',slots:[slot('gk','GR','GK',['GK']),slot('dl','DE','DEF',['DL','WBL']),slot('dcl','DC E','DEF',['DC']),slot('dcr','DC D','DEF',['DC']),slot('dr','DD','DEF',['DR','WBR']),slot('dm','MDC','MID',['DM','MC']),slot('ml','ME','MID',['ML','AML']),slot('mcl','MC E','MID',['MC']),slot('mcr','MC D','MID',['MC']),slot('mr','MD','MID',['MR','AMR']),slot('st','PL','ATT',['ST'])]},
]

const cache=new Map<string,Promise<TacticalAnalysis>>()
const roleMatches=(role:ScoreRoleDefinition,slotDef:TacticalSlotDefinition)=>{
  if(!role.enabled||!role.positionGroups.some(group=>slotDef.groups.includes(group)))return false
  if(!slotDef.roleHints?.length)return true
  const key=`${role.id} ${role.name}`.toLowerCase()
  return slotDef.roleHints.some(hint=>key.includes(hint))||role.positionGroups.some(group=>slotDef.groups.includes(group))
}

export async function loadTacticalOptions(seasonId?:string){
  const data=await loadScoreData(seasonId)
  const clubs=new Map<string,string>()
  for(const row of data.playerRows)if(row.clubId)clubs.set(row.clubId,row.clubName??row.clubId)
  return{seasons:data.seasons,clubs:[...clubs].map(([id,name])=>({id,name})).sort((a,b)=>a.name.localeCompare(b.name,'pt'))}
}

export async function analyzeTactic(seasonId:string,clubId:string,formationId:string,force=false):Promise<TacticalAnalysis>{
  const key=`${seasonId}:${clubId}:${formationId}`
  if(force)cache.delete(key)
  const existing=cache.get(key);if(existing)return existing
  const promise=(async()=>{
    const data=await loadScoreData(seasonId)
    const config=loadScoreConfig()
    const formation=TACTICAL_FORMATIONS.find(item=>item.id===formationId)??TACTICAL_FORMATIONS[0]
    const clubRows=data.playerRows.filter(row=>row.clubId===clubId)
    const clubName=clubRows[0]?.clubName??clubId
    const relevantRoles=config.roles.filter(role=>formation.slots.some(slotDef=>roleMatches(role,slotDef)))
    const scoresByRole=new Map<string,Map<string,PlayerRoleScore>>()
    for(const role of relevantRoles){
      const compatible=data.playerRows.filter(row=>isRoleCompatible(row,role))
      const scored=computeRoleScores(compatible,role,config)
      scoresByRole.set(role.id,new Map(scored.map(item=>[item.playerId,item])))
    }
    const candidatesBySlot=new Map<string,Array<{row:ScorePlayerData;score:PlayerRoleScore;role:ScoreRoleDefinition}>>()
    for(const slotDef of formation.slots){
      const candidates:Array<{row:ScorePlayerData;score:PlayerRoleScore;role:ScoreRoleDefinition}>=[]
      for(const row of clubRows){
        const group=scorePositionGroup(row.position)
        if(group!=='OTHER'&&!slotDef.groups.includes(group))continue
        for(const role of relevantRoles.filter(item=>roleMatches(item,slotDef))){
          const score=scoresByRole.get(role.id)?.get(row.playerId)
          if(score)candidates.push({row,score,role})
        }
      }
      candidates.sort((a,b)=>b.score.adjustedScore-a.score.adjustedScore)
      const bestByPlayer=new Map<string,(typeof candidates)[number]>()
      for(const item of candidates)if(!bestByPlayer.has(item.row.playerId))bestByPlayer.set(item.row.playerId,item)
      candidatesBySlot.set(slotDef.id,[...bestByPlayer.values()].sort((a,b)=>b.score.adjustedScore-a.score.adjustedScore))
    }
    const orderedSlots=[...formation.slots].sort((a,b)=>(candidatesBySlot.get(a.id)?.length??0)-(candidatesBySlot.get(b.id)?.length??0))
    const used=new Set<string>();const assigned=new Map<string,TacticalAssignment>()
    for(const slotDef of orderedSlots){
      const candidates=candidatesBySlot.get(slotDef.id)??[]
      const chosen=candidates.find(item=>!used.has(item.row.playerId))
      if(chosen)used.add(chosen.row.playerId)
      assigned.set(slotDef.id,{slot:slotDef,playerId:chosen?.row.playerId,playerName:chosen?.row.playerName,position:chosen?.row.position,roleId:chosen?.role.id,roleName:chosen?.role.name,score:chosen?.score.score,adjustedScore:chosen?.score.adjustedScore,confidence:chosen?.score.confidence,coverage:chosen?.score.coverage,alternatives:candidates.filter(item=>item.row.playerId!==chosen?.row.playerId).slice(0,3).map(item=>({playerId:item.row.playerId,playerName:item.row.playerName,roleName:item.role.name,score:item.score.adjustedScore}))})
    }
    const assignments=formation.slots.map(item=>assigned.get(item.id)!)
    const valid=assignments.filter(item=>item.adjustedScore!==undefined)
    const teamScore=valid.length?valid.reduce((sum,item)=>sum+(item.adjustedScore??0),0)/formation.slots.length:0
    const coverage=valid.length?valid.reduce((sum,item)=>sum+(item.coverage??0),0)/valid.length:0
    const confidence=valid.length?valid.reduce((sum,item)=>sum+(item.confidence??0),0)/valid.length:0
    const depthValues=formation.slots.map(slotDef=>(candidatesBySlot.get(slotDef.id)?.[1]?.score.adjustedScore??0))
    const depthScore=depthValues.reduce((a,b)=>a+b,0)/formation.slots.length
    const profile=buildStyleProfiles(clubRows,config,'club')[0]
    const style=profile?.dimensions??{}
    const strengths:string[]=[];const risks:string[]=[]
    if(teamScore>=75)strengths.push('Onze inicial com elevada adequação média às funções.')
    if(depthScore>=65)strengths.push('Boa profundidade: existem alternativas competitivas para a maioria das posições.')
    if((style['tecnica']??0)>=65)strengths.push('Plantel tecnicamente preparado para circulação e construção apoiada.')
    if((style['intensidade']??0)>=65||(style['pressao-alta']??0)>=65)strengths.push('Capacidade acima da média para pressionar e sustentar intensidade.')
    const unfilled=assignments.filter(item=>!item.playerId)
    if(unfilled.length)risks.push(`${unfilled.length} posição(ões) sem jogador compatível reconhecido.`)
    if(depthScore<50)risks.push('Profundidade reduzida; lesões ou rotação podem degradar muito a estrutura.')
    if(coverage<60)risks.push('Parte relevante das métricas/atributos necessários está em falta.')
    if((style['defesa']??50)<45)risks.push('Indicadores defensivos abaixo da referência global.')
    const unusedPlayers=clubRows.filter(row=>!used.has(row.playerId)).map(row=>{
      let best=0;for(const map of scoresByRole.values())best=Math.max(best,map.get(row.playerId)?.adjustedScore??0)
      return{id:row.playerId,name:row.playerName,position:row.position,bestScore:best}
    }).sort((a,b)=>b.bestScore-a.bestScore)
    return{formation,clubId,clubName,seasonId,assignments,teamScore:Number(teamScore.toFixed(1)),depthScore:Number(depthScore.toFixed(1)),coverage:Number(coverage.toFixed(1)),confidence:Number(confidence.toFixed(1)),style,strengths,risks,unusedPlayers}
  })().catch(error=>{cache.delete(key);throw error})
  cache.set(key,promise);return promise
}
