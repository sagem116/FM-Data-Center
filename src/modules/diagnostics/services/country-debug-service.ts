import { db } from '../../../database/db'
import { normalizeCountryToken, resolveCountry, resolveContinent, setCountryAliasOverride, setCountryContinentOverride, type CountryResolution } from '../../../core/countries'
import { normalizeKey } from '../../imports/core/normalizers'
import type { Club, Coach, Competition, Player } from '../../../shared/types/entities'

export type DebugSeverity = 'error' | 'warning' | 'info'
export interface CountryUsage { raw: string; normalized: string; count: number; sources: string[]; resolution: CountryResolution; explicitContinents: string[] }
export interface CountryDebugIssue {
  id: string
  severity: DebugSeverity
  code: string
  title: string
  detail: string
  raw?: string
  entityType?: 'club' | 'competition' | 'player' | 'coach'
  entityId?: string
  seasonId?: string
  coachSeasonId?: string
  relatedIds?: string[]
  currentCountry?: string
  currentContinent?: string
  expectedContinent?: string
  editable: boolean
}
export interface NationalTeamAuditRow {
  id: string
  country: string
  seasonId: string
  seasonLabel: string
  competitions: string[]
  coaches: Array<{ coachId: string; coachSeasonId: string; name: string; role?: string }>
  issueCount: number
}
export interface CountryDebugSnapshot {
  generatedAt: string
  summary: {
    countries: number
    resolved: number
    overrides: number
    unknown: number
    ambiguous: number
    missingCountries: number
    continentConflicts: number
    nationalTeams: number
    nationalTeamsWithoutCoach: number
    nationalTeamsMultipleCoaches: number
  }
  usages: CountryUsage[]
  issues: CountryDebugIssue[]
  nationalTeams: NationalTeamAuditRow[]
  seasons: Array<{ id: string; label: string }>
  coaches: Array<{ id: string; name: string; nationality?: string }>
}

type SourceRow = { raw?: string; continent?: string; source: string }
const isPrimaryNationalCoach = (role?: string): boolean => {
  const key = normalizeKey(role ?? '')
  if (!key) return true
  if (/(adjunto|assistant|preparador|analista|observador|scout|fisio|medico)/.test(key)) return false
  return /(selecionador|treinador principal|manager|head coach|treinador|coach)/.test(key)
}

export async function collectCountryDebug(): Promise<CountryDebugSnapshot> {
  const [clubs, competitions, players, coaches, standings, coachSeasons, seasons, sessions] = await Promise.all([
    db.clubs.toArray(), db.competitions.toArray(), db.players.toArray(), db.coaches.toArray(), db.standings.toArray(), db.coachSeasons.toArray(), db.seasons.toArray(), db.importSessions.toArray(),
  ])
  const sourceRows: SourceRow[] = [
    ...clubs.map((row) => ({ raw: row.country, continent: row.continent, source: 'Clubes' })),
    ...competitions.map((row) => ({ raw: row.country, continent: row.continent, source: 'Competições' })),
    ...players.map((row) => ({ raw: row.nationality, source: 'Jogadores' })),
    ...coaches.map((row) => ({ raw: row.nationality, source: 'Treinadores' })),
  ]
  const usageMap = new Map<string, { raw: string; count: number; sources: Set<string>; continents: Set<string> }>()
  for (const row of sourceRows) {
    const raw = String(row.raw ?? '').trim(); if (!raw) continue
    const key = normalizeCountryToken(raw); const current = usageMap.get(key) ?? { raw, count: 0, sources: new Set<string>(), continents: new Set<string>() }
    current.count++; current.sources.add(row.source); if (row.continent) current.continents.add(row.continent); usageMap.set(key, current)
  }
  const usages = [...usageMap.entries()].map(([normalized, item]) => ({ raw: item.raw, normalized, count: item.count, sources: [...item.sources].sort(), resolution: resolveCountry(item.raw), explicitContinents: [...item.continents].sort() })).sort((a, b) => b.count - a.count || a.raw.localeCompare(b.raw, 'pt-PT'))
  const issues: CountryDebugIssue[] = []
  for (const usage of usages) {
    if (usage.resolution.status === 'unknown') issues.push({ id: `unknown:${usage.normalized}`, severity: 'error', code: 'COUNTRY_UNKNOWN', title: `País não reconhecido: ${usage.raw}`, detail: `Aparece ${usage.count} vezes em ${usage.sources.join(', ')}. Cria um alias manual para o ligar a um país canónico.`, raw: usage.raw, editable: true })
    if (usage.resolution.status === 'ambiguous') issues.push({ id: `ambiguous:${usage.normalized}`, severity: 'error', code: 'COUNTRY_AMBIGUOUS', title: `País ambíguo: ${usage.raw}`, detail: `Candidatos: ${usage.resolution.candidates?.join(', ') ?? '—'}.`, raw: usage.raw, editable: true })
    if (usage.resolution.canonical && usage.explicitContinents.some((value) => normalizeCountryToken(value) !== normalizeCountryToken(usage.resolution.continent))) {
      issues.push({ id: `continent:${usage.normalized}`, severity: 'warning', code: 'CONTINENT_CONFLICT', title: `Conflito de continente: ${usage.raw}`, detail: `Catálogo: ${usage.resolution.continent ?? 'sem continente'}; dados: ${usage.explicitContinents.join(', ')}.`, raw: usage.raw, currentContinent: usage.explicitContinents.join(', '), expectedContinent: usage.resolution.continent, editable: true })
    }
  }
  const completedTypes = new Set(sessions.filter((row) => row.status === 'completed').map((row) => row.importType))
  const missing = (type: CountryDebugIssue['entityType'], rows: Array<Club | Competition | Player | Coach>, field: 'country' | 'nationality', sourceAvailable: boolean) => {
    if (!sourceAvailable) return
    for (const row of rows) {
      const country = (row as unknown as Record<string, unknown>)[field]
      if (!String(country ?? '').trim()) issues.push({ id: `missing:${type}:${row.id}`, severity: 'warning', code: 'COUNTRY_MISSING', title: `${type === 'club' ? 'Clube' : type === 'competition' ? 'Competição' : type === 'player' ? 'Jogador' : 'Treinador'} sem país`, detail: `${row.name} não tem país/nacionalidade associado no respetivo ficheiro importado.`, entityType: type, entityId: row.id, editable: true })
    }
  }
  missing('club', clubs, 'country', completedTypes.has('clubs'))
  missing('competition', competitions.filter((row) => row.type === 'national'), 'country', completedTypes.has('competitions'))
  missing('player', players, 'nationality', completedTypes.has('players') || completedTypes.has('statistics'))
  missing('coach', coaches, 'nationality', completedTypes.has('coaches'))

  const seasonMap = new Map(seasons.map((row) => [row.id, row]))
  const competitionMap = new Map(competitions.map((row) => [row.id, row]))
  const coachMap = new Map(coaches.map((row) => [row.id, row]))
  const completedCoachSeasons = new Set(sessions.filter((row) => row.status === 'completed' && row.importType === 'coaches').map((row) => row.seasonId))
  const selectionMap = new Map<string, { country: string; seasonId: string; competitions: Set<string> }>()
  for (const standing of standings) {
    const competition = competitionMap.get(standing.competitionId)
    const isSelection = standing.entityId?.startsWith('country:') || competition?.type === 'international'
    if (!isSelection) continue
    const resolution = resolveCountry(standing.entityName)
    const country = resolution.canonical ?? standing.entityName
    const key = `${normalizeCountryToken(country)}::${standing.seasonId}`
    const current = selectionMap.get(key) ?? { country, seasonId: standing.seasonId, competitions: new Set<string>() }
    current.competitions.add(standing.competitionName)
    selectionMap.set(key, current)
  }
  const nationalTeams: NationalTeamAuditRow[] = []
  for (const [key, team] of selectionMap) {
    const countryKey = normalizeCountryToken(team.country)
    const linked = coachSeasons.filter((row) => row.seasonId === team.seasonId && (
      row.currentClubId === `country:${countryKey}` || normalizeCountryToken(row.currentClubName) === countryKey
    )).filter((row) => isPrimaryNationalCoach(row.role))
    const issueStart = issues.length
    if (completedCoachSeasons.has(team.seasonId) && linked.length === 0) issues.push({ id: `selection-no-coach:${key}`, severity: 'warning', code: 'NATIONAL_TEAM_WITHOUT_COACH', title: `Seleção de ${team.country} sem treinador`, detail: `Não existe selecionador ligado em ${seasonMap.get(team.seasonId)?.label ?? team.seasonId}. Competições: ${[...team.competitions].join(', ')}.`, raw: team.country, seasonId: team.seasonId, editable: true })
    if (linked.length > 1) issues.push({ id: `selection-many-coaches:${key}`, severity: 'error', code: 'NATIONAL_TEAM_MULTIPLE_COACHES', title: `Seleção de ${team.country} com vários treinadores`, detail: linked.map((row) => coachMap.get(row.coachId)?.name ?? row.coachId).join(', '), raw: team.country, seasonId: team.seasonId, relatedIds: linked.map((row) => row.id), editable: true })
    nationalTeams.push({ id: key, country: team.country, seasonId: team.seasonId, seasonLabel: seasonMap.get(team.seasonId)?.label ?? team.seasonId, competitions: [...team.competitions].sort(), coaches: linked.map((row) => ({ coachId: row.coachId, coachSeasonId: row.id, name: coachMap.get(row.coachId)?.name ?? row.coachId, role: row.role })), issueCount: issues.length - issueStart })
  }
  const unresolvedInternationalAssignments = coachSeasons.filter((row) => row.unresolvedInternationalRole && !row.currentClubId?.startsWith('country:'))
  for (const row of unresolvedInternationalAssignments) {
    const coachName = coachMap.get(row.coachId)?.name ?? row.coachId
    issues.push({
      id: `unresolved-international:${row.id}`,
      severity: 'info',
      code: 'INTERNATIONAL_TEAM_NOT_IDENTIFIED',
      title: `${coachName}: seleção internacional não identificada`,
      detail: `Função encontrada em ${seasonMap.get(row.seasonId)?.label ?? row.seasonId}: ${row.unresolvedInternationalRole}. O ficheiro não contém o nome da seleção; esta associação exige escolha manual.`,
      entityType: 'coach',
      entityId: row.coachId,
      seasonId: row.seasonId,
      coachSeasonId: row.id,
      editable: true,
    })
  }
  nationalTeams.sort((a, b) => b.seasonLabel.localeCompare(a.seasonLabel) || a.country.localeCompare(b.country, 'pt-PT'))
  const severityOrder = { error: 0, warning: 1, info: 2 } as const
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || a.title.localeCompare(b.title, 'pt-PT'))
  const continentConflicts = issues.filter((issue) => issue.code === 'CONTINENT_CONFLICT').length
  return {
    generatedAt: new Date().toISOString(),
    summary: {
      countries: usages.length,
      resolved: usages.filter((item) => item.resolution.status === 'resolved').length,
      overrides: usages.filter((item) => item.resolution.status === 'override').length,
      unknown: usages.filter((item) => item.resolution.status === 'unknown').length,
      ambiguous: usages.filter((item) => item.resolution.status === 'ambiguous').length,
      missingCountries: issues.filter((issue) => issue.code === 'COUNTRY_MISSING').length,
      continentConflicts,
      nationalTeams: nationalTeams.length,
      nationalTeamsWithoutCoach: issues.filter((issue) => issue.code === 'NATIONAL_TEAM_WITHOUT_COACH').length,
      nationalTeamsMultipleCoaches: issues.filter((issue) => issue.code === 'NATIONAL_TEAM_MULTIPLE_COACHES').length,
    },
    usages,
    issues,
    nationalTeams,
    seasons: seasons.sort((a, b) => b.startYear - a.startYear).map(({ id, label }) => ({ id, label })),
    coaches: coaches.sort((a, b) => a.name.localeCompare(b.name, 'pt-PT')).map(({ id, name, nationality }) => ({ id, name, nationality })),
  }
}

export async function applyCountryAliasFix(raw: string, canonical: string, continent?: string): Promise<void> {
  setCountryAliasOverride(raw, canonical, continent)
  await normalizeCountryAcrossDatabase(raw)
}
export async function normalizeCountryAcrossDatabase(raw?: string): Promise<void> {
  const target = raw ? normalizeCountryToken(raw) : undefined
  const [clubs, competitions, players, coaches, standings, coachSeasons] = await Promise.all([db.clubs.toArray(), db.competitions.toArray(), db.players.toArray(), db.coaches.toArray(), db.standings.toArray(), db.coachSeasons.toArray()])
  const clubsNext = clubs.map((row) => { if (!row.country || (target && normalizeCountryToken(row.country) !== target)) return row; const resolution = resolveCountry(row.country); return resolution.canonical ? { ...row, country: resolution.canonical, continent: resolveContinent(resolution.canonical, row.continent) } : row })
  const competitionsNext = competitions.map((row) => { if (!row.country || (target && normalizeCountryToken(row.country) !== target)) return row; const resolution = resolveCountry(row.country); return resolution.canonical ? { ...row, country: resolution.canonical, continent: resolveContinent(resolution.canonical, row.continent) } : row })
  const playersNext = players.map((row) => { if (!row.nationality || (target && normalizeCountryToken(row.nationality) !== target)) return row; const resolution = resolveCountry(row.nationality); return resolution.canonical ? { ...row, nationality: resolution.canonical, updatedAt: new Date().toISOString() } : row })
  const coachesNext = coaches.map((row) => { if (!row.nationality || (target && normalizeCountryToken(row.nationality) !== target)) return row; const resolution = resolveCountry(row.nationality); return resolution.canonical ? { ...row, nationality: resolution.canonical } : row })
  const standingsNext = standings.map((row) => { if (!row.entityId?.startsWith('country:') || (target && normalizeCountryToken(row.entityName) !== target)) return row; const resolution = resolveCountry(row.entityName); return resolution.canonical ? { ...row, entityId: `country:${normalizeCountryToken(resolution.canonical)}`, entityName: resolution.canonical } : row })
  const coachSeasonsNext = coachSeasons.map((row) => { if (!row.currentClubId?.startsWith('country:') || !row.currentClubName || (target && normalizeCountryToken(row.currentClubName) !== target)) return row; const resolution = resolveCountry(row.currentClubName); return resolution.canonical ? { ...row, currentClubId: `country:${normalizeCountryToken(resolution.canonical)}`, currentClubName: resolution.canonical } : row })
  await db.transaction('rw', [db.clubs, db.competitions, db.players, db.coaches, db.standings, db.coachSeasons], async () => { await db.clubs.bulkPut(clubsNext); await db.competitions.bulkPut(competitionsNext); await db.players.bulkPut(playersNext); await db.coaches.bulkPut(coachesNext); await db.standings.bulkPut(standingsNext); await db.coachSeasons.bulkPut(coachSeasonsNext) })
}
export async function setEntityCountry(input: { entityType: 'club' | 'competition' | 'player' | 'coach'; entityId: string; country: string; continent?: string }): Promise<void> {
  const resolution = resolveCountry(input.country); const country = resolution.canonical ?? input.country.trim(); const continent = input.continent?.trim() || resolution.continent
  if (input.entityType === 'club') { const row = await db.clubs.get(input.entityId); if (row) await db.clubs.put({ ...row, country, continent }) }
  if (input.entityType === 'competition') { const row = await db.competitions.get(input.entityId); if (row) await db.competitions.put({ ...row, country, continent }) }
  if (input.entityType === 'player') { const row = await db.players.get(input.entityId); if (row) await db.players.put({ ...row, nationality: country, updatedAt: new Date().toISOString() }) }
  if (input.entityType === 'coach') { const row = await db.coaches.get(input.entityId); if (row) await db.coaches.put({ ...row, nationality: country }) }
}
export async function applyContinentFix(country: string, continent: string): Promise<void> { setCountryContinentOverride(country, continent); await normalizeCountryAcrossDatabase(country) }

export async function assignCoachToNationalTeam(input: { coachId: string; seasonId: string; country: string; role?: string }): Promise<void> {
  const coach = await db.coaches.get(input.coachId)
  if (!coach) return
  const resolution = resolveCountry(input.country)
  const country = resolution.canonical ?? input.country.trim()
  const id = `coach-season:${coach.id}:${input.seasonId}:country:${normalizeCountryToken(country)}`
  const existing = await db.coachSeasons.get(id)
  await db.transaction('rw', db.coachSeasons, async () => {
    await db.coachSeasons.put({ id, coachId: coach.id, seasonId: input.seasonId, currentClubId: `country:${normalizeCountryToken(country)}`, currentClubName: country, role: input.role?.trim() || 'Selecionador', contractExpiry: existing?.contractExpiry, winRate: existing?.winRate, titles: existing?.titles, metrics: existing?.metrics ?? {} })
    const unresolved = await db.coachSeasons.where('[coachId+seasonId]').equals([coach.id, input.seasonId]).toArray()
    await db.coachSeasons.bulkPut(unresolved.map((row) => row.unresolvedInternationalRole ? { ...row, unresolvedInternationalRole: undefined } : row))
  })
}

export async function unlinkNationalCoach(coachSeasonId: string): Promise<void> {
  await db.coachSeasons.delete(coachSeasonId)
}
