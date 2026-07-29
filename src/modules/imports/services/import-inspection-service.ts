import { db } from '../../../database/db'
import type { Club, Competition, ImportSession, Player, Season } from '../../../shared/types/entities'
import type { ImportKind } from '../core/types'

export const importKinds: ImportKind[] = ['clubs','coaches','players','competitions','standings','statistics','transfers']
export const importLabels: Record<ImportKind,string> = {clubs:'Clubes',coaches:'Treinadores',players:'Jogadores',competitions:'Competições',standings:'Classificações',statistics:'Estatísticas',transfers:'Transferências'}

export interface ImportBlockSnapshot { kind: ImportKind; seasonId: string; records: number; previousRecords: number; difference: number }
export async function countBlock(kind: ImportKind, seasonId: string): Promise<number> {
  if (kind === 'players') return db.playerSeasons.where('seasonId').equals(seasonId).count()
  if (kind === 'statistics') return db.playerCompetitionStats.where('seasonId').equals(seasonId).count()
  if (kind === 'coaches') return db.coachSeasons.where('seasonId').equals(seasonId).count()
  if (kind === 'clubs') return db.clubSeasons.where('seasonId').equals(seasonId).count()
  if (kind === 'competitions') return db.competitionSeasons.where('seasonId').equals(seasonId).count()
  if (kind === 'standings') return db.standings.where('seasonId').equals(seasonId).count()
  return db.transfers.where('seasonId').equals(seasonId).count()
}
export async function inspectBlockBeforeImport(kind: ImportKind, seasonId: string) { return countBlock(kind, seasonId) }
export async function inspectBlockAfterImport(kind: ImportKind, seasonId: string, previousRecords: number): Promise<ImportBlockSnapshot> { const records=await countBlock(kind,seasonId);return{kind,seasonId,records,previousRecords,difference:records-previousRecords} }

async function clearSeasonBlock(kind: ImportKind, seasonId: string) {
  if(kind==='players'){await db.playerSeasons.where('seasonId').equals(seasonId).delete();await db.playerAttributes.where('seasonId').equals(seasonId).delete();await db.playerGeneralMetrics.where('seasonId').equals(seasonId).delete()}
  if(kind==='statistics')await db.playerCompetitionStats.where('seasonId').equals(seasonId).delete()
  if(kind==='clubs')await db.clubSeasons.where('seasonId').equals(seasonId).delete()
  if(kind==='coaches')await db.coachSeasons.where('seasonId').equals(seasonId).delete()
  if(kind==='competitions')await db.competitionSeasons.where('seasonId').equals(seasonId).delete()
  if(kind==='standings')await db.standings.where('seasonId').equals(seasonId).delete()
  if(kind==='transfers')await db.transfers.where('seasonId').equals(seasonId).delete()
}

export async function deleteImportedFile(sessionId:string){
  const session=await db.importSessions.get(sessionId);if(!session)return
  const kind=session.importType as ImportKind
  await db.transaction('rw',[db.playerSeasons,db.playerAttributes,db.playerGeneralMetrics,db.playerCompetitionStats,db.clubSeasons,db.coachSeasons,db.competitionSeasons,db.standings,db.transfers,db.importSessions,db.importIssues],async()=>{
    await clearSeasonBlock(kind,session.seasonId)
    const issueIds=(await db.importIssues.where('importSessionId').equals(sessionId).primaryKeys()) as string[]
    if(issueIds.length)await db.importIssues.bulkDelete(issueIds)
    await db.importSessions.delete(sessionId)
  })
}

export interface DataInspectionSnapshot {
  seasons:Array<{id:string;label:string}>
  recentPlayers:Array<{id:string;uid?:string;name:string;confidence:string}>
  recentClubs:Array<{id:string;name:string;country?:string;continent?:string}>
  recentCompetitions:Array<{id:string;name:string;type:string;reputation?:number}>
  recentSessions:Array<{id:string;seasonId:string;seasonLabel:string;fileName:string;importType:string;status:string;created:number;updated:number;skipped:number;warnings:number;errors:number;startedAt:string;completedAt?:string}>
  missingBySeason:Array<{seasonId:string;seasonLabel:string;missing:ImportKind[]}>
  counts:{players:number;clubs:number;competitions:number;statistics:number}
  partialErrors:string[]
}
async function safely<T>(label:string,operation:()=>Promise<T>,fallback:T,errors:string[]):Promise<T>{try{return await operation()}catch(error){errors.push(`${label}: ${error instanceof Error?error.message:String(error)}`);return fallback}}
export async function inspectImportedData():Promise<DataInspectionSnapshot>{
  const partialErrors:string[]=[]
  const [seasons,players,clubs,competitions,sessions,playerCount,clubCount,competitionCount,statisticsCount]=await Promise.all([
    safely<Season[]>('Épocas',()=>db.seasons.orderBy('startYear').reverse().toArray(),[],partialErrors),
    safely<Player[]>('Jogadores',async()=>{const all=await db.players.toArray();return all.sort((a,b)=>(b.updatedAt??'').localeCompare(a.updatedAt??'')).slice(0,20)},[],partialErrors),
    safely<Club[]>('Clubes',()=>db.clubs.limit(20).toArray(),[],partialErrors),
    safely<Competition[]>('Competições',()=>db.competitions.limit(20).toArray(),[],partialErrors),
    safely<ImportSession[]>('Sessões',()=>db.importSessions.orderBy('startedAt').reverse().toArray(),[],partialErrors),
    safely('Total jogadores',()=>db.players.count(),0,partialErrors),safely('Total clubes',()=>db.clubs.count(),0,partialErrors),safely('Total competições',()=>db.competitions.count(),0,partialErrors),safely('Total estatísticas',()=>db.playerCompetitionStats.count(),0,partialErrors),
  ])
  const seasonMap=new Map(seasons.map(s=>[s.id,s.label]))
  const completed=new Map<string,Set<ImportKind>>()
  for(const s of sessions.filter(x=>x.status==='completed')){const set=completed.get(s.seasonId)??new Set<ImportKind>();set.add(s.importType as ImportKind);completed.set(s.seasonId,set)}
  return{
    seasons:seasons.map(({id,label})=>({id,label})),
    recentPlayers:players.map(({id,uid,name,identityConfidence})=>({id,uid,name,confidence:identityConfidence})),
    recentClubs:clubs.map(({id,name,country,continent})=>({id,name,country,continent})),
    recentCompetitions:competitions.map(({id,name,type,reputation})=>({id,name,type,reputation})),
    recentSessions:sessions.map(s=>({id:s.id,seasonId:s.seasonId,seasonLabel:seasonMap.get(s.seasonId)??s.seasonId,fileName:s.fileName,importType:s.importType,status:s.status,created:s.createdCount,updated:s.updatedCount,skipped:s.skippedCount,warnings:s.warningCount,errors:s.errorCount,startedAt:s.startedAt,completedAt:s.completedAt})),
    missingBySeason:seasons.map(s=>({seasonId:s.id,seasonLabel:s.label,missing:importKinds.filter(k=>!completed.get(s.id)?.has(k))})).filter(x=>x.missing.length>0),
    counts:{players:playerCount,clubs:clubCount,competitions:competitionCount,statistics:statisticsCount},partialErrors,
  }
}
