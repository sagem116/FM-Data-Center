import { db } from '../../../database/db'
export interface DiagnosticsSnapshot { players:number; clubs:number; competitions:number; seasons:number; lowConfidencePlayers:number; duplicateUids:number; orphanPlayerSeasons:number; orphanStats:number; warnings:number; errors:number; lastImport?:string }
export async function collectDiagnostics():Promise<DiagnosticsSnapshot>{
  const [players,clubs,competitions,seasons,playerSeasons,stats,issues,sessions]=await Promise.all([db.players.toArray(),db.clubs.count(),db.competitions.count(),db.seasons.count(),db.playerSeasons.toArray(),db.playerCompetitionStats.toArray(),db.importIssues.toArray(),db.importSessions.orderBy('startedAt').reverse().toArray()])
  const uidCounts=new Map<string,number>();for(const p of players)if(p.uid)uidCounts.set(p.uid,(uidCounts.get(p.uid)??0)+1)
  const playerIds=new Set(players.map(p=>p.id)); const competitionIds=new Set((await db.competitions.toArray()).map(c=>c.id))
  return {players:players.length,clubs,competitions,seasons,lowConfidencePlayers:players.filter(p=>p.identityConfidence==='low').length,duplicateUids:[...uidCounts.values()].filter(v=>v>1).length,orphanPlayerSeasons:playerSeasons.filter(r=>!playerIds.has(r.playerId)).length,orphanStats:stats.filter(r=>!playerIds.has(r.playerId)||!competitionIds.has(r.competitionId)).length,warnings:issues.filter(i=>i.severity==='warning').length,errors:issues.filter(i=>i.severity==='error').length,lastImport:sessions[0]?.completedAt}
}
