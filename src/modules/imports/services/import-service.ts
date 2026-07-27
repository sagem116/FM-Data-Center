import { db } from '../../../database/db'
import { resolvePlayerIdentity } from '../../../core/identity'
import { parseSeasonLabel } from '../../../core/season/season'
import { normalizeKey, normalizeText, parseInteger, parseNumber } from '../core/normalizers'
import type { ImportKind, ImportPreview, ImportPreviewRow } from '../core/types'
import type { Club, Coach, Competition, ImportIssue, Player, Standing } from '../../../shared/types/entities'

const now = () => new Date().toISOString()
const entityId = (prefix: string, key: string) => `${prefix}:${normalizeKey(key)}`
const rowNumber = (row: ImportPreviewRow) => row.sourceRow

function issue(sessionId:string, row:ImportPreviewRow, severity:'warning'|'error', code:string, message:string): ImportIssue {
  return { id:`issue:${sessionId}:${row.sourceSheet}:${row.sourceRow}:${code}`, importSessionId:sessionId, severity, code, message, sheet:row.sourceSheet, row:rowNumber(row), entityKey:row.entityKey }
}
async function resolveClub(name?:string): Promise<Club | undefined> {
  if (!name) return undefined
  const normalizedName = normalizeKey(name)
  return (await db.clubs.where('normalizedName').equals(normalizedName).first()) ?? { id:entityId('club', normalizedName), name, normalizedName }
}
async function resolveCompetition(name?:string): Promise<Competition | undefined> {
  if (!name) return undefined
  const normalizedName = normalizeKey(name)
  return (await db.competitions.where('normalizedName').equals(normalizedName).first()) ?? { id:entityId('competition', normalizedName), name, normalizedName, type:'unknown' }
}
async function resolvePlayer(values:Record<string,unknown>): Promise<Player> {
  const resolved = resolvePlayerIdentity({ uid:values.uid, name:values.name ?? values.playerName, birthDate:values.birthDate, club:values.club, age:values.age })
  const existing = await db.players.where('identityKey').equals(resolved.key).first()
  const timestamp = now()
  return existing ?? { id:entityId('player', resolved.key), uid:resolved.uid, name:String(values.name ?? values.playerName ?? 'Jogador desconhecido'), normalizedName:resolved.normalizedName, birthDate:normalizeText(values.birthDate) ?? undefined, nationality:normalizeText(values.nationality) ?? undefined, identityConfidence:resolved.confidence, identityKey:resolved.key, createdAt:timestamp, updatedAt:timestamp }
}

async function clearSeasonBlock(kind:ImportKind, seasonId:string): Promise<void> {
  if (kind === 'players') { await db.playerSeasons.where('seasonId').equals(seasonId).delete(); await db.playerAttributes.where('seasonId').equals(seasonId).delete(); await db.playerGeneralMetrics.where('seasonId').equals(seasonId).delete() }
  if (kind === 'statistics') await db.playerCompetitionStats.where('seasonId').equals(seasonId).delete()
  if (kind === 'coaches') await db.coachSeasons.where('seasonId').equals(seasonId).delete()
  if (kind === 'clubs') await db.clubSeasons.where('seasonId').equals(seasonId).delete()
  if (kind === 'competitions') await db.competitionSeasons.where('seasonId').equals(seasonId).delete()
  if (kind === 'standings') await db.standings.where('seasonId').equals(seasonId).delete()
  if (kind === 'transfers') await db.transfers.where('seasonId').equals(seasonId).delete()
}

export interface PersistResult { sessionId:string; created:number; updated:number; skipped:number; warnings:number; lowConfidence:number }

export async function persistPreview(preview:ImportPreview, seasonLabel:string):Promise<PersistResult> {
  const season = parseSeasonLabel(seasonLabel)
  const sessionId = `import:${season.id}:${preview.kind}:${Date.now()}`
  const valid = preview.rows.filter(row=>row.errors.length===0)
  let created=0, updated=0, lowConfidence=0
  const issues:ImportIssue[]=[]
  const tables = [db.seasons,db.players,db.playerSeasons,db.playerAttributes,db.playerGeneralMetrics,db.playerCompetitionStats,db.clubs,db.clubSeasons,db.competitions,db.competitionSeasons,db.coaches,db.coachSeasons,db.standings,db.transfers,db.importSessions,db.importIssues]

  try {
    await db.transaction('rw', tables, async()=>{
      await db.seasons.put(season)
      await clearSeasonBlock(preview.kind,season.id)
      for(const row of preview.rows) {
        for(const message of row.errors) issues.push(issue(sessionId,row,'error','ROW_INVALID',message))
        for(const message of row.warnings) issues.push(issue(sessionId,row,'warning','ROW_WARNING',message))
      }
      for(const row of valid) {
        const v=row.values
        if(preview.kind==='clubs') {
          const normalizedName=normalizeKey(String(v.name)); const id=entityId('club',normalizedName); const exists=await db.clubs.get(id)
          await db.clubs.put({ id,name:String(v.name),normalizedName,country:normalizeText(v.country) ?? undefined,continent:normalizeText(v.continent) ?? undefined,reputation:parseInteger(v.reputation)??undefined,averageAttendance:parseInteger(v.averageAttendance)??undefined,seasonTickets:parseInteger(v.seasonTickets)??undefined })
          await db.clubSeasons.put({ id:`club-season:${id}:${season.id}`,clubId:id,seasonId:season.id,reputation:parseInteger(v.reputation)??undefined,averageAttendance:parseInteger(v.averageAttendance)??undefined,seasonTickets:parseInteger(v.seasonTickets)??undefined })
          exists?updated++:created++
        } else if(preview.kind==='competitions') {
          const normalizedName=normalizeKey(String(v.name)); const id=entityId('competition',normalizedName); const exists=await db.competitions.get(id)
          await db.competitions.put({ id,name:String(v.name),normalizedName,type:'unknown',reputation:parseInteger(v.reputation)??undefined })
          await db.competitionSeasons.put({ id:`competition-season:${id}:${season.id}`,competitionId:id,seasonId:season.id,reputation:parseInteger(v.reputation)??undefined })
          exists?updated++:created++
        } else if(preview.kind==='players') {
          const player=await resolvePlayer(v); const exists=await db.players.get(player.id); player.updatedAt=now(); await db.players.put(player); if(player.identityConfidence==='low'){lowConfidence++;issues.push(issue(sessionId,row,'warning','LOW_CONFIDENCE_IDENTITY','Jogador associado por Nome + Clube + Idade.'))}
          const club=await resolveClub(normalizeText(v.club) ?? undefined); if(club&&!await db.clubs.get(club.id)) await db.clubs.put(club)
          await db.playerSeasons.put({ id:`player-season:${player.id}:${season.id}`,playerId:player.id,seasonId:season.id,clubId:club?.id,clubName:club?.name,age:parseInteger(v.age)??undefined,marketValue:parseNumber(v.marketValue)??undefined,wageAnnual:parseNumber(v.wageAnnual)??undefined,position:normalizeText(v.position) ?? undefined,secondaryPosition:normalizeText(v.secondaryPosition) ?? undefined,personality:normalizeText(v.personality) ?? undefined,contractExpiry:normalizeText(v.contractExpiry) ?? undefined })
          const raw=(v.raw&&typeof v.raw==='object'?v.raw:{}) as Record<string,unknown>; const attributes:Record<string,number>={}; const metrics:Record<string,number|null>={}
          for(const [key,value] of Object.entries(raw)){ const parsed=parseNumber(value); if(parsed===null) continue; if(/^(ace|agi|equ|sal|vel|for|res|fin|pas|tec|dri|dec|det|ant|cmp|pos|mar|cab|cru|pri|rem|lan|liv|pen|can|cor|agr|bra|con|imp|lid|mov|sem|tra|vis|ind|exc|ada|amb|pro)$/i.test(key.replace(/_\d+$/,''))) attributes[key]=parsed; else metrics[key]=parsed }
          await db.playerAttributes.put({id:`player-attributes:${player.id}:${season.id}`,playerId:player.id,seasonId:season.id,attributes}); await db.playerGeneralMetrics.put({id:`player-metrics:${player.id}:${season.id}`,playerId:player.id,seasonId:season.id,metrics})
          exists?updated++:created++
        } else if(preview.kind==='coaches') {
          const uid=normalizeText(v.uid) ?? undefined; const name=String(v.name); const identityKey=uid?`uid:${uid}`:`name:${normalizeKey(name)}`; const id=entityId('coach',identityKey); const exists=await db.coaches.get(id); const confidence=uid?'high':'low'; if(confidence==='low'){lowConfidence++;issues.push(issue(sessionId,row,'warning','LOW_CONFIDENCE_IDENTITY','Treinador sem IDU.'))}
          const coach:Coach={id,uid,name,normalizedName:normalizeKey(name),identityConfidence:confidence,identityKey}; await db.coaches.put(coach); const club=await resolveClub(normalizeText(v.club) ?? undefined); if(club&&!await db.clubs.get(club.id)) await db.clubs.put(club)
          await db.coachSeasons.put({id:`coach-season:${id}:${season.id}`,coachId:id,seasonId:season.id,currentClubId:club?.id,currentClubName:club?.name,role:normalizeText(v.role) ?? undefined,contractExpiry:normalizeText(v.contractExpiry) ?? undefined,winRate:parseNumber(v.winRate)??undefined,titles:parseInteger(v.titles)??undefined,metrics:{}}); exists?updated++:created++
        } else if(preview.kind==='statistics') {
          const player=await resolvePlayer(v); if(!await db.players.get(player.id)) await db.players.put(player); if(player.identityConfidence==='low'){lowConfidence++;issues.push(issue(sessionId,row,'warning','LOW_CONFIDENCE_IDENTITY','Estatística associada com identidade de baixa confiança.'))}
          const competition=await resolveCompetition(normalizeText(v.competition) ?? undefined); if(!competition) continue; if(!await db.competitions.get(competition.id)) await db.competitions.put(competition); const club=await resolveClub(normalizeText(v.club) ?? undefined); if(club&&!await db.clubs.get(club.id)) await db.clubs.put(club)
          const metrics:Record<string,number|null>={xg:parseNumber(v.xg),passCompletion:parseNumber(v.passCompletion),tacklesPer90:parseNumber(v.tacklesPer90),averageRating:parseNumber(v.averageRating),currentAbility:parseNumber(v.currentAbility),potentialAbility:parseNumber(v.potentialAbility)}
          await db.playerCompetitionStats.put({id:`pcs:${player.id}:${season.id}:${competition.id}:${club?.id??'no-club'}`,playerId:player.id,seasonId:season.id,competitionId:competition.id,competitionName:competition.name,scope:normalizeText(v.scope) ?? undefined,clubId:club?.id,clubName:club?.name,appearances:parseInteger(v.appearances)??0,starts:parseInteger(v.starts)??0,substituteAppearances:parseInteger(v.substituteAppearances)??0,minutes:parseInteger(v.minutes)??0,goals:parseInteger(v.goals)??0,assists:parseInteger(v.assists)??0,metrics}); created++
        } else if(preview.kind==='standings') {
          const competition=await resolveCompetition(normalizeText(v.competition) ?? undefined); if(!competition) continue; if(!await db.competitions.get(competition.id)) await db.competitions.put(competition)
          const addStanding=async(entityName:string,stage:string,position?:number)=>{const club=await resolveClub(entityName);if(club&&!await db.clubs.get(club.id))await db.clubs.put(club);const standing:Standing={id:`standing:${season.id}:${competition.id}:${normalizeKey(entityName)}:${stage}`,seasonId:season.id,competitionId:competition.id,competitionName:competition.name,format:v.format==='league'?'league':'knockout',stage,entityId:club?.id,entityName,position,played:parseInteger(v.played)??undefined,wins:parseInteger(v.wins)??undefined,draws:parseInteger(v.draws)??undefined,losses:parseInteger(v.losses)??undefined,goalsFor:parseInteger(v.goalsFor)??undefined,goalsAgainst:parseInteger(v.goalsAgainst)??undefined,goalDifference:parseInteger(v.goalDifference)??undefined,points:parseInteger(v.points)??undefined};await db.standings.put(standing);created++}
          if(v.format==='league') await addStanding(String(v.team),'league',parseInteger(v.position)??undefined); else {await addStanding(String(v.winner),'winner',1);if(v.finalist)await addStanding(String(v.finalist),'finalist',2);for(const name of (v.semiFinalists as string[]??[]))await addStanding(name,'semi-final');for(const name of (v.quarterFinalists as string[]??[]))await addStanding(name,'quarter-final')}
        } else if(preview.kind==='transfers') {
          const player=await resolvePlayer(v); const existingPlayer=await db.players.get(player.id); if(existingPlayer) v.playerId=existingPlayer.id
          const from=await resolveClub(normalizeText(v.fromClub) ?? undefined); const to=await resolveClub(normalizeText(v.toClub) ?? undefined); if(from&&!await db.clubs.get(from.id))await db.clubs.put(from);if(to&&!await db.clubs.get(to.id))await db.clubs.put(to)
          await db.transfers.put({id:`transfer:${season.id}:${row.entityKey}`,seasonId:season.id,playerId:existingPlayer?.id,playerName:String(v.playerName),fromClubId:from?.id,fromClubName:from?.name,toClubId:to?.id,toClubName:to?.name,transferDate:normalizeText(v.transferDate) ?? undefined,fee:parseNumber(v.fee)??undefined,possibleFee:parseNumber(v.possibleFee)??undefined,currency:normalizeText(v.currency) ?? undefined,transferType:'unknown'});created++
        }
      }
      await db.importIssues.bulkPut(issues)
      await db.importSessions.put({id:sessionId,seasonId:season.id,fileName:preview.fileName,importType:preview.kind,status:'completed',startedAt:now(),completedAt:now(),createdCount:created,updatedCount:updated,skippedCount:preview.rows.length-valid.length,warningCount:issues.filter(i=>i.severity==='warning').length,errorCount:issues.filter(i=>i.severity==='error').length,lowConfidenceCount:lowConfidence})
    })
  } catch(error) {
    await db.importSessions.put({id:sessionId,seasonId:season.id,fileName:preview.fileName,importType:preview.kind,status:'failed',startedAt:now(),completedAt:now(),createdCount:0,updatedCount:0,skippedCount:preview.rows.length,warningCount:0,errorCount:1,lowConfidenceCount:0})
    throw error
  }
  return {sessionId,created,updated,skipped:preview.rows.length-valid.length,warnings:issues.filter(i=>i.severity==='warning').length,lowConfidence}
}
