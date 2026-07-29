import { db } from '../../../database/db'
import { normalizeCountryToken, resolveCountry, resolveContinent } from '../../../core/countries'
import { normalizeKey } from '../../imports/core/normalizers'
import type { Club } from '../../../shared/types/entities'

export type ClubDebugSeverity = 'error' | 'warning' | 'info'

export interface ClubDebugIssue {
  id: string
  severity: ClubDebugSeverity
  code: string
  title: string
  detail: string
  clubId?: string
  seasonId?: string
  coachSeasonId?: string
  relatedIds?: string[]
  editable: boolean
}

export interface ClubSeasonAuditRow {
  id: string
  clubId: string
  clubName: string
  seasonId: string
  seasonLabel: string
  country?: string
  continent?: string
  reputation?: number
  nationalCompetitions: string[]
  coaches: Array<{ coachId: string; coachSeasonId: string; name: string; role?: string }>
  playerCount: number
  statisticsCount: number
  standingsCount: number
  issueCount: number
}

export interface ClubDebugSnapshot {
  generatedAt: string
  summary: {
    clubs: number
    activeClubSeasons: number
    errors: number
    warnings: number
    missingReputation: number
    missingCountry: number
    missingContinent: number
    withoutCoach: number
    multipleCoaches: number
    withoutNationalLeague: number
    duplicates: number
    brokenLinks: number
  }
  issues: ClubDebugIssue[]
  rows: ClubSeasonAuditRow[]
  clubs: Club[]
  seasons: Array<{ id: string; label: string }>
  coaches: Array<{ id: string; name: string; nationality?: string }>
}

const primaryCoachRole = (role?: string): boolean => {
  const key = normalizeKey(role ?? '')
  if (!key) return true
  if (/(adjunto|assistant|preparador|analista|observador|scout|fisio|medico|guarda redes|goalkeeper)/.test(key)) return false
  return /(treinador principal|treinador|manager|head coach|selecionador|coach)/.test(key)
}

const keyOf = (clubId: string, seasonId: string) => `${clubId}::${seasonId}`

export async function collectClubDebug(): Promise<ClubDebugSnapshot> {
  const [clubs, clubSeasons, seasons, coaches, coachSeasons, players, playerSeasons, stats, standings, competitions, sessions] = await Promise.all([
    db.clubs.toArray(),
    db.clubSeasons.toArray(),
    db.seasons.toArray(),
    db.coaches.toArray(),
    db.coachSeasons.toArray(),
    db.players.toArray(),
    db.playerSeasons.toArray(),
    db.playerCompetitionStats.toArray(),
    db.standings.toArray(),
    db.competitions.toArray(),
    db.importSessions.toArray(),
  ])

  const clubMap = new Map(clubs.map((row) => [row.id, row]))
  const seasonMap = new Map(seasons.map((row) => [row.id, row]))
  const coachMap = new Map(coaches.map((row) => [row.id, row]))
  const competitionMap = new Map(competitions.map((row) => [row.id, row]))
  const playerMap = new Map(players.map((row) => [row.id, row]))
  const groupByClubSeason = <T extends { seasonId: string }>(rows: T[], clubIdOf: (row: T) => string | undefined) => {
    const grouped = new Map<string, T[]>()
    for (const row of rows) {
      const clubId = clubIdOf(row)
      if (!clubId) continue
      const key = keyOf(clubId, row.seasonId)
      const list = grouped.get(key) ?? []
      list.push(row)
      grouped.set(key, list)
    }
    return grouped
  }
  const clubSeasonByKey = new Map(clubSeasons.map((row) => [keyOf(row.clubId, row.seasonId), row]))
  const playerSeasonsByKey = groupByClubSeason(playerSeasons, (row) => row.clubId)
  const statisticsByKey = groupByClubSeason(stats, (row) => row.clubId)
  const coachSeasonsByKey = groupByClubSeason(coachSeasons, (row) => row.currentClubId && !row.currentClubId.startsWith('country:') ? row.currentClubId : undefined)
  const standingsByKey = groupByClubSeason(standings, (row) => row.entityId && clubMap.has(row.entityId) ? row.entityId : undefined)
  const activeKeys = new Set<string>()

  for (const key of clubSeasonByKey.keys()) activeKeys.add(key)
  for (const key of playerSeasonsByKey.keys()) activeKeys.add(key)
  for (const key of coachSeasonsByKey.keys()) activeKeys.add(key)
  for (const key of statisticsByKey.keys()) activeKeys.add(key)
  for (const key of standingsByKey.keys()) activeKeys.add(key)

  const completedStandingsSeasons = new Set(sessions.filter((row) => row.status === 'completed' && row.importType === 'standings').map((row) => row.seasonId))
  const completedCoachSeasons = new Set(sessions.filter((row) => row.status === 'completed' && row.importType === 'coaches').map((row) => row.seasonId))
  const completedPlayerSeasons = new Set(sessions.filter((row) => row.status === 'completed' && row.importType === 'players').map((row) => row.seasonId))
  const completedStatisticsSeasons = new Set(sessions.filter((row) => row.status === 'completed' && row.importType === 'statistics').map((row) => row.seasonId))
  const completedClubSeasons = new Set(sessions.filter((row) => row.status === 'completed' && row.importType === 'clubs').map((row) => row.seasonId))
  const nationalCompetitionsBySeason = new Map<string, Set<string>>()
  const nationalCountriesBySeason = new Map<string, Set<string>>()
  for (const row of standings) {
    const competition = competitionMap.get(row.competitionId)
    if (competition?.type !== 'national') continue
    const set = nationalCompetitionsBySeason.get(row.seasonId) ?? new Set<string>()
    set.add(row.competitionId)
    nationalCompetitionsBySeason.set(row.seasonId, set)
    if (competition.country) {
      const countries = nationalCountriesBySeason.get(row.seasonId) ?? new Set<string>()
      countries.add(normalizeCountryToken(competition.country))
      nationalCountriesBySeason.set(row.seasonId, countries)
    }
  }

  const issues: ClubDebugIssue[] = []
  const add = (issue: ClubDebugIssue) => issues.push(issue)

  const duplicateUids = new Map<string, Club[]>()
  const duplicateNames = new Map<string, Club[]>()
  for (const club of clubs) {
    if (club.uid) {
      const list = duplicateUids.get(club.uid) ?? []
      list.push(club)
      duplicateUids.set(club.uid, list)
    }
    const nameKey = `${normalizeKey(club.name)}::${normalizeCountryToken(club.country)}`
    const list = duplicateNames.get(nameKey) ?? []
    list.push(club)
    duplicateNames.set(nameKey, list)
  }
  for (const [uid, list] of duplicateUids) if (list.length > 1) add({ id: `duplicate-uid:${uid}`, severity: 'error', code: 'CLUB_DUPLICATE_UID', title: `UID de clube duplicado: ${uid}`, detail: list.map((row) => row.name).join(', '), relatedIds: list.map((row) => row.id), editable: false })
  for (const [key, list] of duplicateNames) if (list.length > 1) add({ id: `duplicate-name:${key}`, severity: 'warning', code: 'CLUB_DUPLICATE_NAME', title: `Possível clube duplicado: ${list[0].name}`, detail: `${list.length} registos com o mesmo nome normalizado e país.`, relatedIds: list.map((row) => row.id), editable: false })

  for (const row of clubSeasons) {
    if (!clubMap.has(row.clubId)) add({ id: `orphan-club-season:${row.id}`, severity: 'error', code: 'CLUB_SEASON_ORPHAN', title: 'Época de clube órfã', detail: `O registo ${row.id} aponta para um clube inexistente.`, seasonId: row.seasonId, editable: false })
    if (!seasonMap.has(row.seasonId)) add({ id: `orphan-season:${row.id}`, severity: 'error', code: 'CLUB_SEASON_UNKNOWN_SEASON', title: 'Época de clube sem época válida', detail: `O registo ${row.id} aponta para ${row.seasonId}.`, clubId: row.clubId, editable: false })
  }

  const rows: ClubSeasonAuditRow[] = []
  for (const composite of activeKeys) {
    const [clubId, seasonId] = composite.split('::')
    const club = clubMap.get(clubId)
    const season = seasonMap.get(seasonId)
    if (!club || !season) continue
    const clubSeason = clubSeasonByKey.get(composite)
    const seasonPlayers = playerSeasonsByKey.get(composite) ?? []
    const seasonStats = statisticsByKey.get(composite) ?? []
    const seasonStandings = standingsByKey.get(composite) ?? []
    const seasonCoachRows = coachSeasonsByKey.get(composite) ?? []
    const primaryCoachRows = seasonCoachRows.filter((row) => primaryCoachRole(row.role))
    const nationalStandingRows = seasonStandings.filter((row) => competitionMap.get(row.competitionId)?.type === 'national')
    const reputation = clubSeason?.reputation ?? club.reputation
    const hasCompetitiveEvidence = seasonPlayers.length > 0 || seasonStats.length > 0 || seasonStandings.length > 0
    const hasImportedClubProfile = completedClubSeasons.has(seasonId) && Boolean(clubSeason)
    const rowIssueStart = issues.length

    if (hasImportedClubProfile && !club.country?.trim()) add({ id: `country:${composite}`, severity: 'error', code: 'CLUB_COUNTRY_MISSING', title: `${club.name} sem país`, detail: `O clube não tem país associado em ${season.label}.`, clubId, seasonId, editable: true })
    if (hasImportedClubProfile && !club.continent?.trim()) add({ id: `continent:${composite}`, severity: 'warning', code: 'CLUB_CONTINENT_MISSING', title: `${club.name} sem continente`, detail: `O continente pode ser inferido a partir do país.`, clubId, seasonId, editable: true })
    if (club.country) {
      const resolution = resolveCountry(club.country)
      const expected = resolveContinent(club.country)
      if (resolution.status === 'unknown' || resolution.status === 'ambiguous') add({ id: `country-invalid:${composite}`, severity: 'error', code: 'CLUB_COUNTRY_INVALID', title: `${club.name} com país não normalizado`, detail: `Valor atual: ${club.country}. Corrige no Debug Países ou edita o clube.`, clubId, seasonId, editable: true })
      if (expected && club.continent && normalizeCountryToken(expected) !== normalizeCountryToken(club.continent)) add({ id: `continent-conflict:${composite}`, severity: 'warning', code: 'CLUB_CONTINENT_CONFLICT', title: `${club.name} com continente incompatível`, detail: `País ${club.country} aponta para ${expected}, mas o clube tem ${club.continent}.`, clubId, seasonId, editable: true })
    }
    if (completedClubSeasons.has(seasonId) && hasImportedClubProfile && (reputation === undefined || reputation === null)) add({ id: `reputation:${composite}`, severity: 'warning', code: 'CLUB_REPUTATION_MISSING', title: `${club.name} sem reputação`, detail: `Não existe reputação geral nem para ${season.label}.`, clubId, seasonId, editable: true })
    else if (reputation !== undefined && reputation !== null && (!Number.isFinite(reputation) || reputation < 0)) add({ id: `reputation-invalid:${composite}`, severity: 'error', code: 'CLUB_REPUTATION_INVALID', title: `${club.name} com reputação inválida`, detail: `Valor atual: ${String(reputation)}.`, clubId, seasonId, editable: true })
    if (completedClubSeasons.has(seasonId) && hasCompetitiveEvidence && !clubSeason) add({ id: `season-record:${composite}`, severity: 'info', code: 'CLUB_SEASON_RECORD_MISSING', title: `${club.name} sem registo próprio de época`, detail: `O clube aparece noutros dados de ${season.label}, mas não foi importado no bloco Clubes dessa época.`, clubId, seasonId, editable: true })

    if (completedCoachSeasons.has(seasonId) && hasCompetitiveEvidence && primaryCoachRows.length === 0) add({ id: `coach-missing:${composite}`, severity: 'warning', code: 'CLUB_WITHOUT_HEAD_COACH', title: `${club.name} sem treinador principal`, detail: `Não existe treinador principal ligado ao clube em ${season.label}.`, clubId, seasonId, editable: true })
    if (primaryCoachRows.length > 1) add({ id: `coach-multiple:${composite}`, severity: 'error', code: 'CLUB_MULTIPLE_HEAD_COACHES', title: `${club.name} com ${primaryCoachRows.length} treinadores principais`, detail: `${primaryCoachRows.map((row) => coachMap.get(row.coachId)?.name ?? row.coachId).join(', ')} em ${season.label}.`, clubId, seasonId, relatedIds: primaryCoachRows.map((row) => row.id), editable: true })

    const countryKey = normalizeCountryToken(club.country)
    const nationalDataExists = completedStandingsSeasons.has(seasonId)
      && Boolean(countryKey)
      && (nationalCountriesBySeason.get(seasonId)?.has(countryKey) ?? false)
      && (nationalCompetitionsBySeason.get(seasonId)?.size ?? 0) > 0
    if (nationalDataExists && hasCompetitiveEvidence && nationalStandingRows.length === 0) add({ id: `national-league:${composite}`, severity: 'warning', code: 'CLUB_WITHOUT_NATIONAL_LEAGUE', title: `${club.name} sem liga nacional`, detail: `Existem classificações nacionais importadas em ${season.label}, mas este clube não aparece em nenhuma.`, clubId, seasonId, editable: false })
    if (nationalStandingRows.length > 1) add({ id: `national-league-multiple:${composite}`, severity: 'info', code: 'CLUB_MULTIPLE_NATIONAL_COMPETITIONS', title: `${club.name} com vários registos nacionais`, detail: `Pode ser normal em formatos Apertura/Clausura ou fases distintas: ${nationalStandingRows.map((row) => row.competitionName).join(', ')}.`, clubId, seasonId, relatedIds: nationalStandingRows.map((row) => row.id), editable: false })

    for (const standing of nationalStandingRows) {
      const competition = competitionMap.get(standing.competitionId)
      if (club.country && competition?.country && normalizeCountryToken(club.country) !== normalizeCountryToken(competition.country)) add({ id: `league-country:${standing.id}`, severity: 'warning', code: 'CLUB_LEAGUE_COUNTRY_CONFLICT', title: `${club.name} ligado a liga de outro país`, detail: `Clube: ${club.country}; competição ${competition.name}: ${competition.country}.`, clubId, seasonId, editable: true })
    }

    if (completedPlayerSeasons.has(seasonId) && (seasonStats.length > 0 || seasonStandings.length > 0) && seasonPlayers.length === 0) add({ id: `players:${composite}`, severity: 'info', code: 'CLUB_WITHOUT_PLAYERS', title: `${club.name} sem jogadores`, detail: `Não existem jogadores associados ao clube em ${season.label}.`, clubId, seasonId, editable: false })
    if (completedStatisticsSeasons.has(seasonId) && (seasonPlayers.length > 0 || seasonStandings.length > 0) && seasonStats.length === 0) add({ id: `stats:${composite}`, severity: 'info', code: 'CLUB_WITHOUT_STATISTICS', title: `${club.name} sem estatísticas`, detail: `Não existem estatísticas individuais associadas em ${season.label}.`, clubId, seasonId, editable: false })
    if (completedStandingsSeasons.has(seasonId) && seasonStats.length > 0 && seasonStandings.length === 0) add({ id: `standings:${composite}`, severity: 'info', code: 'CLUB_WITHOUT_STANDINGS', title: `${club.name} sem classificações`, detail: `O clube não aparece em nenhuma classificação ou fase eliminatória em ${season.label}.`, clubId, seasonId, editable: false })

    for (const row of seasonCoachRows) if (row.currentClubName && normalizeKey(row.currentClubName) !== normalizeKey(club.name)) add({ id: `coach-name:${row.id}`, severity: 'warning', code: 'CLUB_COACH_NAME_CONFLICT', title: `Nome divergente no treinador`, detail: `${coachMap.get(row.coachId)?.name ?? row.coachId}: “${row.currentClubName}” vs “${club.name}”.`, clubId, seasonId, coachSeasonId: row.id, editable: true })
    for (const row of seasonPlayers) if (row.clubName && normalizeKey(row.clubName) !== normalizeKey(club.name)) add({ id: `player-name:${row.id}`, severity: 'warning', code: 'CLUB_PLAYER_NAME_CONFLICT', title: `Nome divergente num jogador`, detail: `${playerMap.get(row.playerId)?.name ?? row.playerId}: “${row.clubName}” vs “${club.name}”.`, clubId, seasonId, editable: true })
    for (const row of seasonStats) if (row.clubName && normalizeKey(row.clubName) !== normalizeKey(club.name)) add({ id: `stats-name:${row.id}`, severity: 'warning', code: 'CLUB_STATS_NAME_CONFLICT', title: `Nome divergente nas estatísticas`, detail: `“${row.clubName}” vs “${club.name}”.`, clubId, seasonId, editable: true })
    for (const row of seasonStandings) if (normalizeKey(row.entityName) !== normalizeKey(club.name)) add({ id: `standing-name:${row.id}`, severity: 'warning', code: 'CLUB_STANDING_NAME_CONFLICT', title: `Nome divergente na classificação`, detail: `“${row.entityName}” vs “${club.name}”.`, clubId, seasonId, editable: true })

    rows.push({
      id: composite,
      clubId,
      clubName: club.name,
      seasonId,
      seasonLabel: season.label,
      country: club.country,
      continent: club.continent,
      reputation,
      nationalCompetitions: nationalStandingRows.map((row) => row.competitionName),
      coaches: seasonCoachRows.map((row) => ({ coachId: row.coachId, coachSeasonId: row.id, name: coachMap.get(row.coachId)?.name ?? row.coachId, role: row.role })),
      playerCount: seasonPlayers.length,
      statisticsCount: seasonStats.length,
      standingsCount: seasonStandings.length,
      issueCount: issues.length - rowIssueStart,
    })
  }

  const severityOrder = { error: 0, warning: 1, info: 2 } as const
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || a.title.localeCompare(b.title, 'pt-PT'))
  rows.sort((a, b) => b.seasonLabel.localeCompare(a.seasonLabel) || a.clubName.localeCompare(b.clubName, 'pt-PT'))
  return {
    generatedAt: new Date().toISOString(),
    summary: {
      clubs: clubs.length,
      activeClubSeasons: rows.length,
      errors: issues.filter((row) => row.severity === 'error').length,
      warnings: issues.filter((row) => row.severity === 'warning').length,
      missingReputation: issues.filter((row) => row.code === 'CLUB_REPUTATION_MISSING').length,
      missingCountry: issues.filter((row) => row.code === 'CLUB_COUNTRY_MISSING').length,
      missingContinent: issues.filter((row) => row.code === 'CLUB_CONTINENT_MISSING').length,
      withoutCoach: issues.filter((row) => row.code === 'CLUB_WITHOUT_HEAD_COACH').length,
      multipleCoaches: issues.filter((row) => row.code === 'CLUB_MULTIPLE_HEAD_COACHES').length,
      withoutNationalLeague: issues.filter((row) => row.code === 'CLUB_WITHOUT_NATIONAL_LEAGUE').length,
      duplicates: issues.filter((row) => row.code === 'CLUB_DUPLICATE_UID' || row.code === 'CLUB_DUPLICATE_NAME').length,
      brokenLinks: issues.filter((row) => row.code.includes('NAME_CONFLICT') || row.code.includes('ORPHAN')).length,
    },
    issues,
    rows,
    clubs: clubs.sort((a, b) => a.name.localeCompare(b.name, 'pt-PT')),
    seasons: seasons.sort((a, b) => b.startYear - a.startYear).map(({ id, label }) => ({ id, label })),
    coaches: coaches.sort((a, b) => a.name.localeCompare(b.name, 'pt-PT')).map(({ id, name, nationality }) => ({ id, name, nationality })),
  }
}

export async function updateClubDebug(clubId: string, patch: Partial<Pick<Club, 'name' | 'country' | 'continent' | 'reputation' | 'averageAttendance' | 'seasonTickets'>>): Promise<void> {
  const club = await db.clubs.get(clubId)
  if (!club) return
  const country = patch.country?.trim() || club.country
  const resolved = country ? resolveCountry(country) : undefined
  await db.clubs.put({
    ...club,
    ...patch,
    name: patch.name?.trim() || club.name,
    normalizedName: normalizeKey(patch.name?.trim() || club.name),
    country: resolved?.canonical ?? country,
    continent: patch.continent?.trim() || (country ? resolveContinent(country, club.continent) : club.continent),
  })
}

export async function ensureClubSeasonRecord(clubId: string, seasonId: string): Promise<void> {
  const club = await db.clubs.get(clubId)
  if (!club) return
  await db.clubSeasons.put({ id: `club-season:${clubId}:${seasonId}`, clubId, seasonId, reputation: club.reputation, averageAttendance: club.averageAttendance, seasonTickets: club.seasonTickets })
}

export async function assignCoachToClub(input: { coachId: string; clubId: string; seasonId: string; role?: string }): Promise<void> {
  const [coach, club] = await Promise.all([db.coaches.get(input.coachId), db.clubs.get(input.clubId)])
  if (!coach || !club) return
  const id = `coach-season:${coach.id}:${input.seasonId}:club`
  const existing = await db.coachSeasons.get(id)
  await db.coachSeasons.put({
    id,
    coachId: coach.id,
    seasonId: input.seasonId,
    currentClubId: club.id,
    currentClubName: club.name,
    role: input.role?.trim() || 'Treinador principal',
    contractExpiry: existing?.contractExpiry,
    winRate: existing?.winRate,
    titles: existing?.titles,
    metrics: existing?.metrics ?? {},
  })
}

export async function unlinkCoachSeason(coachSeasonId: string): Promise<void> {
  await db.coachSeasons.delete(coachSeasonId)
}

export async function syncClubReferences(clubId: string): Promise<void> {
  const club = await db.clubs.get(clubId)
  if (!club) return
  const [playerRows, statRows, coachRows, standingRows] = await Promise.all([
    db.playerSeasons.where('clubId').equals(clubId).toArray(),
    db.playerCompetitionStats.where('clubId').equals(clubId).toArray(),
    db.coachSeasons.where('currentClubId').equals(clubId).toArray(),
    db.standings.where('entityId').equals(clubId).toArray(),
  ])
  await db.transaction('rw', [db.playerSeasons, db.playerCompetitionStats, db.coachSeasons, db.standings], async () => {
    await db.playerSeasons.bulkPut(playerRows.map((row) => ({ ...row, clubName: club.name })))
    await db.playerCompetitionStats.bulkPut(statRows.map((row) => ({ ...row, clubName: club.name })))
    await db.coachSeasons.bulkPut(coachRows.map((row) => ({ ...row, currentClubName: club.name })))
    await db.standings.bulkPut(standingRows.map((row) => ({ ...row, entityName: club.name })))
  })
}

export function exportClubDebug(snapshot: ClubDebugSnapshot): string {
  return JSON.stringify(snapshot, null, 2)
}
