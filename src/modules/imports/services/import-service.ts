import { db } from '../../../database/db'
import { resolvePlayerIdentity } from '../../../core/identity'
import { parseSeasonLabel } from '../../../core/season/season'
import { clubMatchKey, competitionMatchKey, normalizeCompetitionName, normalizeFootballName, normalizeKey, normalizeText, parseInteger, parseNumber } from '../core/normalizers'
import { canonicalAttributeId, canonicalMetricId } from '../../../core/football-data/feature-map'
import { normalizeCountryName, resolveContinent } from '../../../core/countries'
import type { ImportKind, ImportPreview, ImportPreviewRow } from '../core/types'
import type { Club, Coach, Competition, ImportIssue, Player, Standing } from '../../../shared/types/entities'

const now = () => new Date().toISOString()
const entityId = (prefix: string, key: string) => `${prefix}:${normalizeKey(key)}`
const rowNumber = (row: ImportPreviewRow) => row.sourceRow

function issue(sessionId:string, row:ImportPreviewRow, severity:'warning'|'error', code:string, message:string): ImportIssue {
  const missingField = message.match(/Campo obrigatório em falta: (.+)$/)?.[1]
  return { id:`issue:${sessionId}:${row.sourceSheet}:${row.sourceRow}:${code}:${missingField ?? 'general'}`, importSessionId:sessionId, severity, code, message, sheet:row.sourceSheet, row:rowNumber(row), column:missingField, entityKey:row.entityKey }
}
async function resolveClub(name?:string): Promise<Club | undefined> {
  if (!name) return undefined
  const normalizedName = normalizeKey(name)
  return (await db.clubs.where('normalizedName').equals(normalizedName).first()) ?? { id:entityId('club', normalizedName), name, normalizedName }
}
async function resolveCompetition(name?:string, type:Competition['type']='unknown'): Promise<Competition | undefined> {
  const canonicalName = normalizeCompetitionName(name)
  if (!canonicalName) return undefined
  const normalizedName = competitionMatchKey(canonicalName)
  const existing = await db.competitions.where('normalizedName').equals(normalizedName).first()
  if (!existing) return { id:entityId('competition', normalizedName), name:canonicalName, normalizedName, type }
  return { ...existing, name: canonicalName, normalizedName, type: existing.type === 'unknown' && type !== 'unknown' ? type : existing.type }
}
async function resolvePlayer(values:Record<string,unknown>): Promise<Player> {
  const resolved = resolvePlayerIdentity({ uid:values.uid, name:values.name ?? values.playerName, birthDate:values.birthDate, club:values.club, age:values.age })
  const existing = await db.players.where('identityKey').equals(resolved.key).first()
  const timestamp = now()
  if(existing)return {...existing,nationality:normalizeCountryName(values.nationality)??existing.nationality,birthDate:normalizeText(values.birthDate)??existing.birthDate,updatedAt:timestamp}
  return { id:entityId('player', resolved.key), uid:resolved.uid, name:String(values.name ?? values.playerName ?? 'Jogador desconhecido'), normalizedName:resolved.normalizedName, birthDate:normalizeText(values.birthDate) ?? undefined, nationality:normalizeCountryName(values.nationality), identityConfidence:resolved.confidence, identityKey:resolved.key, createdAt:timestamp, updatedAt:timestamp }
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

export interface PersistOptions { failAfterClearForTest?: boolean }

export async function persistPreview(preview:ImportPreview, seasonLabel:string, options:PersistOptions = {}):Promise<PersistResult> {
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
      const clubByExact = new Map<string, Club>()
      const clubByLoose = new Map<string, Club | null>()
      const indexClub = (club: Club) => {
        clubByExact.set(club.normalizedName, club)
        const loose = clubMatchKey(club.name)
        if (!loose) return
        const previous = clubByLoose.get(loose)
        clubByLoose.set(loose, previous && previous.id !== club.id ? null : club)
      }
      for (const club of await db.clubs.toArray()) indexClub(club)

      const competitionByKey = new Map<string, Competition>()
      const indexCompetition = (competition: Competition) => {
        competitionByKey.set(competitionMatchKey(competition.name), competition)
        competitionByKey.set(competition.normalizedName, competition)
      }
      for (const competition of await db.competitions.toArray()) indexCompetition(competition)
      const resolveCompetitionCached = async (rawName?: string, type: Competition['type'] = 'unknown'): Promise<Competition | undefined> => {
        const canonicalName = normalizeCompetitionName(rawName)
        if (!canonicalName) return undefined
        const normalizedName = competitionMatchKey(canonicalName)
        const existing = competitionByKey.get(normalizedName)
        const resolved: Competition = existing
          ? { ...existing, name: canonicalName, normalizedName, type: existing.type === 'unknown' && type !== 'unknown' ? type : existing.type }
          : { id: entityId('competition', normalizedName), name: canonicalName, normalizedName, type }
        indexCompetition(resolved)
        return resolved
      }

      const resolveClubCached = async (rawName?: string): Promise<Club | undefined> => {
        const name = normalizeFootballName(rawName)
        if (!name) return undefined
        const exact = normalizeKey(name)
        const found = clubByExact.get(exact) ?? clubByLoose.get(clubMatchKey(name)) ?? undefined
        if (found) return found
        const club: Club = { id: entityId('club', exact), name, normalizedName: exact }
        indexClub(club)
        return club
      }
      const ensureClubSeason = async (club: Club | undefined): Promise<void> => {
        if (!club) return
        const id = `club-season:${club.id}:${season.id}`
        if (await db.clubSeasons.get(id)) return
        await db.clubSeasons.put({ id, clubId: club.id, seasonId: season.id, reputation: club.reputation, averageAttendance: club.averageAttendance, seasonTickets: club.seasonTickets, finances: club.finances, wageBudget: club.wageBudget, wageUsed: club.wageUsed })
      }
      const ensureCompetitionSeason = async (competition: Competition | undefined): Promise<void> => {
        if (!competition) return
        const id = `competition-season:${competition.id}:${season.id}`
        if (await db.competitionSeasons.get(id)) return
        await db.competitionSeasons.put({ id, competitionId: competition.id, seasonId: season.id, reputation: competition.reputation, level: competition.level })
      }
      const enrichClubAndCompetition = async (club: Club | undefined, competition: Competition | undefined): Promise<{ club?: Club; competition?: Competition }> => {
        if (!club || !competition || competition.type !== 'national') return { club, competition }
        const inferredCountry = normalizeCountryName(competition.country ?? club.country)
        const inferredContinent = resolveContinent(inferredCountry, competition.continent ?? club.continent)
        let nextClub = club
        let nextCompetition = competition
        if (inferredCountry && (!club.country || !club.continent)) {
          nextClub = { ...club, country: club.country ?? inferredCountry, continent: club.continent ?? inferredContinent }
          await db.clubs.put(nextClub)
          indexClub(nextClub)
        }
        if (inferredCountry && (!competition.country || !competition.continent)) {
          nextCompetition = { ...competition, country: competition.country ?? inferredCountry, continent: competition.continent ?? inferredContinent }
          await db.competitions.put(nextCompetition)
        }
        return { club: nextClub, competition: nextCompetition }
      }
      if (options.failAfterClearForTest) throw new Error('Falha de teste após limpeza do bloco')
      for(const row of preview.rows) {
        for(const message of row.errors) issues.push(issue(sessionId,row,'error','ROW_INVALID',message))
        for(const message of row.warnings) issues.push(issue(sessionId,row,'warning','ROW_WARNING',message))
      }
      for(const row of valid) {
        const v=row.values
        if(preview.kind==='clubs') {
          const name=normalizeFootballName(v.name) ?? String(v.name)
          const matched=await resolveClubCached(name)
          const id=matched?.id ?? entityId('club',normalizeKey(name)); const exists=await db.clubs.get(id)
          const country=normalizeCountryName(v.country)??exists?.country; const continent=resolveContinent(country,v.continent)??exists?.continent
          const clubRow:Club={ ...exists, id,name,normalizedName:normalizeKey(name),country,continent,reputation:parseInteger(v.reputation)??exists?.reputation,averageAttendance:parseInteger(v.averageAttendance)??exists?.averageAttendance,seasonTickets:parseInteger(v.seasonTickets)??exists?.seasonTickets,finances:parseNumber(v.finances)??exists?.finances,wageBudget:parseNumber(v.wageBudget)??exists?.wageBudget,wageUsed:parseNumber(v.wageUsed)??exists?.wageUsed }
          await db.clubs.put(clubRow); indexClub(clubRow)
          await db.clubSeasons.put({ id:`club-season:${id}:${season.id}`,clubId:id,seasonId:season.id,reputation:parseInteger(v.reputation)??exists?.reputation,averageAttendance:parseInteger(v.averageAttendance)??exists?.averageAttendance,seasonTickets:parseInteger(v.seasonTickets)??exists?.seasonTickets,finances:parseNumber(v.finances)??exists?.finances,wageBudget:parseNumber(v.wageBudget)??exists?.wageBudget,wageUsed:parseNumber(v.wageUsed)??exists?.wageUsed })
          exists?updated++:created++
        } else if(preview.kind==='competitions') {
          const type=(v.competitionType as Competition['type'])??'unknown'
          const resolved=await resolveCompetitionCached(normalizeText(v.name) ?? undefined,type); if(!resolved) continue
          const exists=await db.competitions.get(resolved.id)
          const country=normalizeCountryName(v.country)??exists?.country; const continent=resolveContinent(country,v.continent)??exists?.continent
          const competitionRow:Competition={...resolved,country,continent,type:type!=='unknown'?type:(exists?.type??resolved.type),reputation:parseInteger(v.reputation)??exists?.reputation,level:(type==='super-league'?parseInteger(resolved.name.match(/(\d+)/)?.[1]):exists?.level)??undefined}
          await db.competitions.put(competitionRow); indexCompetition(competitionRow)
          await db.competitionSeasons.put({ id:`competition-season:${competitionRow.id}:${season.id}`,competitionId:competitionRow.id,seasonId:season.id,reputation:parseInteger(v.reputation)??exists?.reputation,level:competitionRow.level })
          exists?updated++:created++
        } else if(preview.kind==='players') {
          const player=await resolvePlayer(v); const exists=await db.players.get(player.id); player.updatedAt=now(); await db.players.put(player); if(player.identityConfidence==='low'){lowConfidence++;issues.push(issue(sessionId,row,'warning','LOW_CONFIDENCE_IDENTITY','Jogador associado por Nome + Clube + Idade.'))}
          const club=await resolveClubCached(normalizeText(v.club) ?? undefined); if(club&&!await db.clubs.get(club.id)) await db.clubs.put(club); await ensureClubSeason(club)
          await db.playerSeasons.put({ id:`player-season:${player.id}:${season.id}`,playerId:player.id,seasonId:season.id,clubId:club?.id,clubName:club?.name,age:parseInteger(v.age)??undefined,marketValue:parseNumber(v.marketValue)??undefined,wageAnnual:parseNumber(v.wageAnnual)??undefined,position:normalizeText(v.position) ?? undefined,secondaryPosition:normalizeText(v.secondaryPosition) ?? undefined,personality:normalizeText(v.personality) ?? undefined,contractExpiry:normalizeText(v.contractExpiry) ?? undefined })
          const raw=(v.raw&&typeof v.raw==='object'?v.raw:{}) as Record<string,unknown>; const attributes:Record<string,number>={}; const metrics:Record<string,number|null>={}
          for(const [key,value] of Object.entries(raw)){ const parsed=parseNumber(value); if(parsed===null) continue; const attributeId=canonicalAttributeId(key); if(attributeId) attributes[attributeId]=parsed; else metrics[canonicalMetricId(key)]=parsed }
          await db.playerAttributes.put({id:`player-attributes:${player.id}:${season.id}`,playerId:player.id,seasonId:season.id,attributes}); await db.playerGeneralMetrics.put({id:`player-metrics:${player.id}:${season.id}`,playerId:player.id,seasonId:season.id,metrics})
          exists?updated++:created++
        } else if(preview.kind==='coaches') {
          const uid=normalizeText(v.uid) ?? undefined; const name=String(v.name); const identityKey=uid?`uid:${uid}`:`name:${normalizeKey(name)}`; const id=entityId('coach',identityKey); const exists=await db.coaches.get(id); const confidence=uid?'high':'low'; if(confidence==='low'){lowConfidence++;issues.push(issue(sessionId,row,'warning','LOW_CONFIDENCE_IDENTITY','Treinador sem IDU.'))}
          const coach:Coach={id,uid,name,normalizedName:normalizeKey(name),nationality:normalizeCountryName(v.nationality),identityConfidence:confidence,identityKey}; await db.coaches.put(coach)
          const raw=(v.raw&&typeof v.raw==='object'?v.raw:{}) as Record<string,unknown>; const metrics:Record<string,number|null>={}
          for(const [key,value] of Object.entries(raw)){const parsed=parseNumber(value);if(parsed!==null)metrics[canonicalMetricId(key)]=parsed}
          const club=await resolveClubCached(normalizeText(v.club) ?? undefined)
          if(club){if(!await db.clubs.get(club.id))await db.clubs.put(club);await ensureClubSeason(club);await db.coachSeasons.put({id:`coach-season:${id}:${season.id}:club`,coachId:id,seasonId:season.id,currentClubId:club.id,currentClubName:club.name,role:normalizeText(v.clubRole)??normalizeText(v.role)??'Treinador',unresolvedInternationalRole:v.unresolvedInternationalAssignment?normalizeText(v.internationalRole)??undefined:undefined,contractExpiry:normalizeText(v.contractExpiry)??undefined,winRate:parseNumber(v.winRate)??undefined,titles:parseInteger(v.titles)??undefined,metrics})}
          const internationalRole=normalizeText(v.internationalRole); const internationalTeam=normalizeCountryName(v.internationalTeam)
          if(internationalRole&&internationalTeam){await db.coachSeasons.put({id:`coach-season:${id}:${season.id}:country:${normalizeKey(internationalTeam)}`,coachId:id,seasonId:season.id,currentClubId:`country:${normalizeKey(internationalTeam)}`,currentClubName:internationalTeam,role:internationalRole,contractExpiry:normalizeText(v.contractExpiry)??undefined,winRate:parseNumber(v.winRate)??undefined,titles:parseInteger(v.titles)??undefined,metrics})}
          if(!club&&!internationalTeam)await db.coachSeasons.put({id:`coach-season:${id}:${season.id}:profile`,coachId:id,seasonId:season.id,role:normalizeText(v.role)??internationalRole??undefined,unresolvedInternationalRole:v.unresolvedInternationalAssignment?internationalRole??undefined:undefined,contractExpiry:normalizeText(v.contractExpiry)??undefined,winRate:parseNumber(v.winRate)??undefined,titles:parseInteger(v.titles)??undefined,metrics})
          exists?updated++:created++
        } else if(preview.kind==='statistics') {
          const player=await resolvePlayer(v); if(!await db.players.get(player.id)) await db.players.put(player); if(player.identityConfidence==='low'){lowConfidence++;issues.push(issue(sessionId,row,'warning','LOW_CONFIDENCE_IDENTITY','Estatística associada com identidade de baixa confiança.'))}
          let competition=await resolveCompetitionCached(normalizeText(v.competition) ?? undefined, (v.competitionType as Competition['type']) ?? 'unknown'); if(!competition) continue; await db.competitions.put(competition); indexCompetition(competition); let club=await resolveClubCached(normalizeText(v.club) ?? undefined); if(club&&!await db.clubs.get(club.id)) await db.clubs.put(club)
          const enriched = await enrichClubAndCompetition(club, competition)
          club = enriched.club
          competition = enriched.competition ?? competition
          await ensureClubSeason(club); await ensureCompetitionSeason(competition)
          const existingSeason=await db.playerSeasons.get(`player-season:${player.id}:${season.id}`)
          await db.players.put({...player,nationality:normalizeCountryName(v.nationality)??player.nationality,updatedAt:now()})
          await db.playerSeasons.put({id:`player-season:${player.id}:${season.id}`,playerId:player.id,seasonId:season.id,clubId:club?.id??existingSeason?.clubId,clubName:club?.name??existingSeason?.clubName,age:parseInteger(v.age)??existingSeason?.age,marketValue:parseNumber(v.marketValue)??existingSeason?.marketValue,wageAnnual:parseNumber(v.wageAnnual)??existingSeason?.wageAnnual,position:normalizeText(v.position)??existingSeason?.position,secondaryPosition:existingSeason?.secondaryPosition,personality:existingSeason?.personality,status:existingSeason?.status,contractExpiry:existingSeason?.contractExpiry})
          const metrics:Record<string,number|null>={xg:parseNumber(v.xg),passCompletion:parseNumber(v.passCompletion),tacklesPer90:parseNumber(v.tacklesPer90),averageRating:parseNumber(v.averageRating),currentAbility:parseNumber(v.currentAbility),potentialAbility:parseNumber(v.potentialAbility),marketValue:parseNumber(v.marketValue),wageAnnual:parseNumber(v.wageAnnual)}
          const raw=(v.raw&&typeof v.raw==='object'?v.raw:{}) as Record<string,unknown>
          for(const [key,value] of Object.entries(raw)){const parsed=parseNumber(value);if(parsed!==null)metrics[canonicalMetricId(key)]=parsed}
          await db.playerCompetitionStats.put({id:`pcs:${player.id}:${season.id}:${competition.id}:${club?.id??'no-club'}`,playerId:player.id,seasonId:season.id,competitionId:competition.id,competitionName:competition.name,scope:normalizeText(v.scope) ?? undefined,clubId:club?.id,clubName:club?.name,appearances:parseInteger(v.appearances)??0,starts:parseInteger(v.starts)??0,substituteAppearances:parseInteger(v.substituteAppearances)??0,minutes:parseInteger(v.minutes)??0,goals:parseInteger(v.goals)??0,assists:parseInteger(v.assists)??0,metrics}); created++
        } else if(preview.kind==='standings') {
          const resolvedCompetition=await resolveCompetitionCached(normalizeText(v.competition) ?? undefined, (v.competitionType as Competition['type']) ?? 'unknown'); if(!resolvedCompetition) continue; await db.competitions.put(resolvedCompetition); indexCompetition(resolvedCompetition); await ensureCompetitionSeason(resolvedCompetition)
          const addStanding=async(entityName:string,stage:string,position?:number)=>{
            const selection = v.entityKind === 'selection'
            let competition = resolvedCompetition
            let club = selection ? undefined : await resolveClubCached(entityName)
            if(club&&!await db.clubs.get(club.id))await db.clubs.put(club)
            if(!selection){const enriched=await enrichClubAndCompetition(club,competition);club=enriched.club;competition=enriched.competition??competition;await ensureClubSeason(club);await ensureCompetitionSeason(competition)}
            const normalizedEntityName = selection ? (normalizeCountryName(entityName) ?? entityName) : entityName
            const entityIdValue = selection ? `country:${normalizeKey(normalizedEntityName)}` : club?.id
            const standing:Standing={id:`standing:${season.id}:${competition.id}:${normalizeKey(normalizedEntityName)}:${stage}`,seasonId:season.id,competitionId:competition.id,competitionName:competition.name,format:v.format==='league'?'league':'knockout',stage,info:normalizeText(v.info)??undefined,entityId:entityIdValue,entityName:normalizedEntityName,position,played:parseInteger(v.played)??undefined,wins:parseInteger(v.wins)??undefined,draws:parseInteger(v.draws)??undefined,losses:parseInteger(v.losses)??undefined,goalsFor:parseInteger(v.goalsFor)??undefined,goalsAgainst:parseInteger(v.goalsAgainst)??undefined,goalDifference:parseInteger(v.goalDifference)??undefined,points:parseInteger(v.points)??undefined}
            await db.standings.put(standing);created++
          }
          if(v.format==='league') await addStanding(String(v.team),'league',parseInteger(v.position)??undefined); else {await addStanding(String(v.winner),'winner',1);if(v.finalist)await addStanding(String(v.finalist),'finalist',2);for(const name of (v.semiFinalists as string[]??[]))await addStanding(name,'semi-final');for(const name of (v.quarterFinalists as string[]??[]))await addStanding(name,'quarter-final')}
        } else if(preview.kind==='transfers') {
          const player=await resolvePlayer(v); const existingPlayer=await db.players.get(player.id); if(existingPlayer) v.playerId=existingPlayer.id
          const from=await resolveClubCached(normalizeText(v.fromClub) ?? undefined); const to=await resolveClubCached(normalizeText(v.toClub) ?? undefined); if(from&&!await db.clubs.get(from.id))await db.clubs.put(from);if(to&&!await db.clubs.get(to.id))await db.clubs.put(to)
          await db.transfers.put({id:`transfer:${season.id}:${row.entityKey}`,seasonId:season.id,playerId:existingPlayer?.id,playerName:String(v.playerName),fromClubId:from?.id,fromClubName:from?.name,toClubId:to?.id,toClubName:to?.name,transferDate:normalizeText(v.transferDate) ?? undefined,fee:parseNumber(v.fee)??undefined,possibleFee:parseNumber(v.possibleFee)??undefined,currency:normalizeText(v.currency) ?? undefined,rawFee:normalizeText(v.rawFee) ?? undefined,transferType:(()=>{const raw=normalizeKey(v.rawFee);if(/emprest|loan/.test(raw))return'loan' as const;if(/livre|free|sem custo|custo zero/.test(raw))return'free' as const;if((parseNumber(v.fee)??0)>0||(parseNumber(v.possibleFee)??0)>0)return'permanent' as const;if(parseNumber(v.fee)===0&&raw)return'free' as const;return'unknown' as const})()});created++
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
