import { db } from '../../../database/db'
import type {
  Club, ClubSeason, Coach, CoachSeason, Competition, CompetitionSeason, Player, PlayerAttributes, PlayerCompetitionStats,
  PlayerGeneralMetrics, PlayerSeason, Season, Standing,
} from '../../../shared/types/entities'
import { normalizeKey } from '../../imports/core/normalizers'
import {
  computeEntityRows, computeInsights, computeMarketSummary, computePlayerRows, computePositionRows, computeTrends,
} from '../../market/engine/market-engine'
import { loadMarketData } from '../../market/services/market-service'
import type { EnrichedTransfer, MarketCorrelation, MarketEntityRow } from '../../market/types'
import type {
  ClubRecordRow, CoachRecordRow, CompetitionRecordRow, EntityProfile, EvolutionSeries, PlayerRecordRow, ProfileAchievement,
  ProfileHallOfFame, ProfileHistoryRow, ProfileKind, ProfileMarket, ProfileMarketSeason, ProfileOption, ProfileStyle, StyleDimension,
  StyleFeatureDetail,
} from '../types'

interface ProfileDataBundle {
  seasons: Season[]
  clubs: Club[]
  clubSeasons: ClubSeason[]
  competitions: Competition[]
  competitionSeasons: CompetitionSeason[]
  coaches: Coach[]
  coachSeasons: CoachSeason[]
  players: Player[]
  playerSeasons: PlayerSeason[]
  playerAttributes: PlayerAttributes[]
  playerGeneralMetrics: PlayerGeneralMetrics[]
  stats: PlayerCompetitionStats[]
  standings: Standing[]
  marketTransfers: EnrichedTransfer[]
}

let bundlePromise: Promise<ProfileDataBundle> | null = null
const styleBaselineCache = new Map<string, number | undefined>()
const average = (values: Array<number | undefined>): number | undefined => {
  const valid = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : undefined
}
const sum = (values: Array<number | undefined>): number => values.reduce<number>((total, value) => total + (value ?? 0), 0)
const pct = (value: number, total: number): number => total ? value / total * 100 : 0
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value))
const metricKey = (value: string): string => normalizeKey(value).replace(/\s+/g, '-')
const metricValue = (record: Record<string, number | null>, aliases: string[]): number | undefined => {
  const wanted = new Set(aliases.map(metricKey))
  for (const [key, value] of Object.entries(record)) {
    if (typeof value !== 'number' || !Number.isFinite(value)) continue
    if (wanted.has(metricKey(key))) return value
  }
  return undefined
}
const money = (value?: number): string => value === undefined ? '—' : new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(value)
const number = (value?: number, digits = 1): string => value === undefined ? '—' : value.toLocaleString('pt-PT', { maximumFractionDigits: digits })
const isHeadCoach = (role?: string): boolean => {
  const key = normalizeKey(role)
  if (!key || /adjunto|assistente|sub 18|sub 19|sub 20|sub 21|sub 23|reservas|preparador/.test(key)) return false
  return /treinador|manager|head coach|selecionador/.test(key)
}
const isChampion = (standing: Standing, competition?: Competition): boolean => {
  if (standing.format === 'knockout') return /winner|vencedor|campeao/.test(normalizeKey(standing.stage))
  if (competition?.type === 'super-league') return normalizeKey(standing.info) === 'c'
  return standing.position === 1 || normalizeKey(standing.info) === 'c'
}
const isPromoted = (standing: Standing, competition?: Competition): boolean => {
  if (competition?.type !== 'super-league') return normalizeKey(standing.info).includes('prom')
  const match = normalizeKey(standing.competitionName).match(/(?:super league|superliga|divisao)[^0-9]{0,12}(\d{1,2})/)
  const division = match ? Number(match[1]) : competition.level ?? 1
  return (division > 1 && standing.position === 1) || normalizeKey(standing.info) === 'p' || normalizeKey(standing.info).includes('prom')
}

async function loadBundleUncached(): Promise<ProfileDataBundle> {
  const market = await loadMarketData()
  const [clubSeasons, competitionSeasons, coachSeasons, players, playerSeasons, playerAttributes, playerGeneralMetrics, stats, standings] = await Promise.all([
    db.clubSeasons.toArray(), db.competitionSeasons.toArray(), db.coachSeasons.toArray(), db.players.toArray(), db.playerSeasons.toArray(),
    db.playerAttributes.toArray(), db.playerGeneralMetrics.toArray(), db.playerCompetitionStats.toArray(), db.standings.toArray(),
  ])
  return {
    seasons: market.seasons,
    clubs: market.clubs,
    clubSeasons,
    competitions: market.competitions,
    competitionSeasons,
    coaches: market.coaches,
    coachSeasons,
    players,
    playerSeasons,
    playerAttributes,
    playerGeneralMetrics,
    stats,
    standings,
    marketTransfers: market.transfers,
  }
}
export function clearProfileCache(): void { bundlePromise = null; styleBaselineCache.clear() }
async function loadBundle(): Promise<ProfileDataBundle> {
  bundlePromise ??= loadBundleUncached().catch((error) => { bundlePromise = null; throw error })
  return bundlePromise
}

export async function loadProfileOptions(kind: ProfileKind): Promise<ProfileOption[]> {
  const data = await loadBundle()
  if (kind === 'competition') return data.competitions.map((item) => ({ id: item.id, name: item.name, subtitle: [item.country, item.type].filter(Boolean).join(' · ') })).sort((a, b) => a.name.localeCompare(b.name, 'pt'))
  if (kind === 'club') return data.clubs.map((item) => ({ id: item.id, name: item.name, subtitle: [item.country, item.continent].filter(Boolean).join(' · ') })).sort((a, b) => a.name.localeCompare(b.name, 'pt'))
  if (kind === 'player') {
    const latestByPlayer = new Map<string, PlayerSeason>()
    for (const row of data.playerSeasons) {
      const current = latestByPlayer.get(row.playerId)
      if (!current || seasonYear(data, row.seasonId) > seasonYear(data, current.seasonId)) latestByPlayer.set(row.playerId, row)
    }
    return data.players.map((item) => {
      const latest = latestByPlayer.get(item.id)
      return { id: item.id, name: item.name, subtitle: [latest?.position, latest?.clubName, item.nationality].filter(Boolean).join(' · ') }
    }).sort((a, b) => a.name.localeCompare(b.name, 'pt'))
  }
  const latestByCoach = new Map<string, CoachSeason>()
  for (const row of data.coachSeasons) {
    const current = latestByCoach.get(row.coachId)
    if (!current || seasonYear(data, row.seasonId) > seasonYear(data, current.seasonId)) latestByCoach.set(row.coachId, row)
  }
  return data.coaches.map((item) => {
    const latest = latestByCoach.get(item.id)
    return { id: item.id, name: item.name, subtitle: [latest?.currentClubName, item.nationality].filter(Boolean).join(' · ') }
  }).sort((a, b) => a.name.localeCompare(b.name, 'pt'))
}

function seasonYear(data: ProfileDataBundle, seasonId: string): number { return data.seasons.find((item) => item.id === seasonId)?.endYear ?? 0 }
function seasonLabel(data: ProfileDataBundle, seasonId: string): string { return data.seasons.find((item) => item.id === seasonId)?.label ?? seasonId }
function coachNames(data: ProfileDataBundle, entityId: string | undefined, seasonId: string): string[] {
  if (!entityId) return []
  const rows = data.coachSeasons.filter((row) => row.seasonId === seasonId && row.currentClubId === entityId && isHeadCoach(row.role))
  return rows.map((row) => data.coaches.find((coach) => coach.id === row.coachId)?.name).filter((name): name is string => Boolean(name))
}
function entityTransferSide(transfer: EnrichedTransfer, kind: ProfileKind, id: string, side: 'from' | 'to'): boolean {
  if (kind === 'club') return transfer[side].club?.id === id
  if (kind === 'competition') return transfer[side].competitions.some((item) => item.id === id)
  if (kind === 'coach') return transfer[side].coaches.some((item) => item.id === id)
  return transfer.snapshot.player?.id === id
}
function entityTransfers(data: ProfileDataBundle, kind: ProfileKind, id: string): EnrichedTransfer[] {
  return data.marketTransfers.filter((transfer) => kind === 'player' ? transfer.snapshot.player?.id === id : entityTransferSide(transfer, kind, id, 'from') || entityTransferSide(transfer, kind, id, 'to'))
}
function marketEntityRow(transfers: EnrichedTransfer[], kind: ProfileKind, id: string): MarketEntityRow | undefined {
  if (kind === 'player') return undefined
  return computeEntityRows(transfers, kind).find((row) => row.id === id)
}
function marketSeasonRows(data: ProfileDataBundle, transfers: EnrichedTransfer[], kind: ProfileKind, id: string): ProfileMarketSeason[] {
  const groups = new Map<string, EnrichedTransfer[]>()
  for (const transfer of transfers) {
    const rows = groups.get(transfer.seasonId) ?? []
    rows.push(transfer)
    groups.set(transfer.seasonId, rows)
  }
  return [...groups.entries()].map(([seasonId, rows]) => {
    const arrivals = rows.filter((row) => kind === 'player' ? true : entityTransferSide(row, kind, id, 'to'))
    const departures = kind === 'player' ? [] : rows.filter((row) => entityTransferSide(row, kind, id, 'from'))
    const spend = kind === 'player' ? sum(rows.map((row) => row.feeKnown ? row.effectiveFee : undefined)) : sum(arrivals.map((row) => row.feeKnown ? row.effectiveFee : undefined))
    const income = kind === 'player' ? 0 : sum(departures.map((row) => row.feeKnown ? row.effectiveFee : undefined))
    const knownAge = arrivals.filter((row) => row.snapshot.age !== undefined)
    return {
      seasonId,
      season: seasonLabel(data, seasonId),
      arrivals: arrivals.length,
      departures: departures.length,
      spend,
      income,
      balance: kind === 'player' ? 0 : income - spend,
      averageBuyAge: average(arrivals.map((row) => row.snapshot.age)),
      under21Share: pct(knownAge.filter((row) => (row.snapshot.age ?? 99) <= 20).length, knownAge.length),
      averageBuyCA: average(arrivals.map((row) => row.snapshot.currentAbility)),
      averageBuyPA: average(arrivals.map((row) => row.snapshot.potentialAbility)),
    }
  }).sort((a, b) => seasonYear(data, a.seasonId) - seasonYear(data, b.seasonId))
}
function buildMarket(data: ProfileDataBundle, kind: ProfileKind, id: string): ProfileMarket {
  const transfers = entityTransfers(data, kind, id)
  const clubs = computeEntityRows(transfers, 'club')
  const competitions = computeEntityRows(transfers, 'competition')
  const coaches = computeEntityRows(transfers, 'coach')
  const positions = computePositionRows(transfers)
  const correlations: MarketCorrelation[] = []
  const row = marketEntityRow(transfers, kind, id)
  const playerRow = kind === 'player' ? computePlayerRows(transfers).find((item) => item.id === id) : undefined
  const narrative = row?.summary ?? (playerRow ? `${playerRow.moves} movimentos · ${money(playerRow.totalFees)} em valores acumulados · ${playerRow.clubs.length} clubes identificados` : 'Amostra de mercado insuficiente.')
  return {
    summary: computeMarketSummary(transfers),
    narrative,
    transfers,
    trends: computeTrends(transfers),
    positions,
    insights: computeInsights(transfers, clubs, competitions, coaches, positions, correlations),
    seasons: marketSeasonRows(data, transfers, kind, id),
  }
}

function historyForCompetition(data: ProfileDataBundle, id: string): ProfileHistoryRow[] {
  const competition = data.competitions.find((item) => item.id === id)
  const rows = data.standings.filter((row) => row.competitionId === id)
  const bySeason = new Map<string, Standing[]>()
  for (const row of rows) { const list = bySeason.get(row.seasonId) ?? []; list.push(row); bySeason.set(row.seasonId, list) }
  return [...bySeason.entries()].map(([seasonId, entries]) => {
    const champion = entries.find((row) => isChampion(row, competition))
    const runner = entries.find((row) => row.position === 2 || /finalist|finalista/.test(normalizeKey(row.stage)))
    return {
      id: `${id}:${seasonId}`,
      season: seasonLabel(data, seasonId),
      competition: competition?.name ?? entries[0]?.competitionName ?? id,
      champion: champion?.entityName ?? 'Não identificado',
      coach: coachNames(data, champion?.entityId, seasonId).join(', ') || undefined,
      runnerUp: runner?.entityName,
      detail: champion?.format === 'league' ? [champion.points !== undefined ? `${champion.points} pontos` : undefined, champion.goalsFor !== undefined ? `${champion.goalsFor} golos` : undefined].filter(Boolean).join(' · ') : champion?.stage,
    }
  }).sort((a, b) => b.season.localeCompare(a.season))
}
function achievementsForClub(data: ProfileDataBundle, id: string): ProfileAchievement[] {
  return data.standings.filter((row) => row.entityId === id).flatMap((row) => {
    const competition = data.competitions.find((item) => item.id === row.competitionId)
    const result: ProfileAchievement[] = []
    if (isChampion(row, competition)) result.push({ id: `${row.id}:title`, season: seasonLabel(data, row.seasonId), competition: row.competitionName, achievement: 'Campeão', coach: coachNames(data, id, row.seasonId).join(', ') || undefined, detail: competition?.type === 'super-league' ? 'Confirmado por Inf=C' : row.stage ?? (row.position ? `${row.position}.º lugar` : undefined) })
    if (isPromoted(row, competition)) result.push({ id: `${row.id}:promotion`, season: seasonLabel(data, row.seasonId), competition: row.competitionName, achievement: 'Promoção', coach: coachNames(data, id, row.seasonId).join(', ') || undefined, detail: row.position ? `${row.position}.º lugar` : row.info })
    if (/finalist|finalista/.test(normalizeKey(row.stage))) result.push({ id: `${row.id}:final`, season: seasonLabel(data, row.seasonId), competition: row.competitionName, achievement: 'Finalista', coach: coachNames(data, id, row.seasonId).join(', ') || undefined })
    return result
  }).sort((a, b) => b.season.localeCompare(a.season))
}
function historyForClub(data: ProfileDataBundle, id: string): ProfileHistoryRow[] {
  const competitionIds = new Set(data.standings.filter((row) => row.entityId === id).map((row) => row.competitionId))
  return [...competitionIds].flatMap((competitionId) => historyForCompetition(data, competitionId).map((row) => ({ ...row, wonByEntity: data.standings.some((standing) => standing.competitionId === competitionId && seasonLabel(data, standing.seasonId) === row.season && standing.entityId === id && isChampion(standing, data.competitions.find((item) => item.id === competitionId))) }))).sort((a, b) => b.season.localeCompare(a.season))
}
function achievementsForCoach(data: ProfileDataBundle, id: string): ProfileAchievement[] {
  const assignments = data.coachSeasons.filter((row) => row.coachId === id && row.currentClubId && isHeadCoach(row.role))
  return assignments.flatMap((assignment) => data.standings.filter((standing) => standing.seasonId === assignment.seasonId && standing.entityId === assignment.currentClubId).flatMap((standing) => {
    const competition = data.competitions.find((item) => item.id === standing.competitionId)
    const result: ProfileAchievement[] = []
    if (isChampion(standing, competition)) result.push({ id: `${id}:${standing.id}:title`, season: seasonLabel(data, standing.seasonId), competition: standing.competitionName, achievement: 'Campeão', detail: assignment.currentClubName })
    if (isPromoted(standing, competition)) result.push({ id: `${id}:${standing.id}:promotion`, season: seasonLabel(data, standing.seasonId), competition: standing.competitionName, achievement: 'Promoção', detail: assignment.currentClubName })
    return result
  })).sort((a, b) => b.season.localeCompare(a.season))
}
function achievementsForPlayer(data: ProfileDataBundle, id: string): ProfileAchievement[] {
  const relations = new Set(data.stats.filter((row) => row.playerId === id && row.clubId).map((row) => `${row.clubId}|${row.seasonId}`))
  const result: ProfileAchievement[] = []
  for (const relation of relations) {
    const [clubId, seasonId] = relation.split('|')
    for (const standing of data.standings.filter((row) => row.entityId === clubId && row.seasonId === seasonId)) {
      const competition = data.competitions.find((item) => item.id === standing.competitionId)
      if (isChampion(standing, competition)) result.push({ id: `${id}:${standing.id}:title`, season: seasonLabel(data, seasonId), competition: standing.competitionName, achievement: 'Campeão', detail: standing.entityName })
      if (isPromoted(standing, competition)) result.push({ id: `${id}:${standing.id}:promotion`, season: seasonLabel(data, seasonId), competition: standing.competitionName, achievement: 'Promoção', detail: standing.entityName })
    }
  }
  return [...new Map(result.map((item) => [item.id, item])).values()].sort((a, b) => b.season.localeCompare(a.season))
}

function playerRecords(data: ProfileDataBundle, stats: PlayerCompetitionStats[]): PlayerRecordRow[] {
  const groups = new Map<string, PlayerCompetitionStats[]>()
  for (const row of stats) { const list = groups.get(row.playerId) ?? []; list.push(row); groups.set(row.playerId, list) }
  return [...groups.entries()].map(([playerId, rows]) => {
    const player = data.players.find((item) => item.id === playerId)
    const minutes = sum(rows.map((row) => row.minutes))
    const ratingRows = rows.map((row) => ({ rating: metricValue(row.metrics, ['averageRating', 'avaliação', 'classificacao']), weight: row.minutes || row.appearances || 1 })).filter((item): item is { rating: number; weight: number } => item.rating !== undefined)
    const goals = sum(rows.map((row) => row.goals)), assists = sum(rows.map((row) => row.assists))
    return {
      id: playerId, name: player?.name ?? rows[0]?.playerId ?? playerId, nationality: player?.nationality,
      seasons: new Set(rows.map((row) => row.seasonId)).size,
      appearances: sum(rows.map((row) => row.appearances)), minutes, goals, assists,
      goalsPer90: minutes ? goals * 90 / minutes : 0, assistsPer90: minutes ? assists * 90 / minutes : 0,
      averageRating: ratingRows.length ? ratingRows.reduce((total, item) => total + item.rating * item.weight, 0) / ratingRows.reduce((total, item) => total + item.weight, 0) : undefined,
    }
  }).sort((a, b) => b.goals - a.goals || b.assists - a.assists || (b.averageRating ?? 0) - (a.averageRating ?? 0))
}
function clubRecords(data: ProfileDataBundle, standings: Standing[]): ClubRecordRow[] {
  const groups = new Map<string, Standing[]>()
  for (const row of standings) { const key = row.entityId ?? normalizeKey(row.entityName); const list = groups.get(key) ?? []; list.push(row); groups.set(key, list) }
  return [...groups.entries()].map(([id, rows]) => ({
    id, name: rows[0]?.entityName ?? id, seasons: new Set(rows.map((row) => row.seasonId)).size,
    titles: rows.filter((row) => isChampion(row, data.competitions.find((item) => item.id === row.competitionId))).length,
    promotions: rows.filter((row) => isPromoted(row, data.competitions.find((item) => item.id === row.competitionId))).length,
    played: sum(rows.map((row) => row.played)), wins: sum(rows.map((row) => row.wins)), goalsFor: sum(rows.map((row) => row.goalsFor)), goalsAgainst: sum(rows.map((row) => row.goalsAgainst)), points: sum(rows.map((row) => row.points)),
  })).sort((a, b) => b.titles - a.titles || b.points - a.points || b.wins - a.wins)
}
function coachRecords(data: ProfileDataBundle, entityRelations: Array<{ entityId?: string; seasonId: string }>): CoachRecordRow[] {
  const relationKeys = new Set(entityRelations.filter((item) => item.entityId).map((item) => `${item.entityId}|${item.seasonId}`))
  const groups = new Map<string, CoachSeason[]>()
  for (const row of data.coachSeasons) {
    if (!row.currentClubId || !relationKeys.has(`${row.currentClubId}|${row.seasonId}`) || !isHeadCoach(row.role)) continue
    const list = groups.get(row.coachId) ?? []; list.push(row); groups.set(row.coachId, list)
  }
  return [...groups.entries()].map(([id, rows]) => {
    const coach = data.coaches.find((item) => item.id === id)
    let titles = 0
    for (const row of rows) titles += data.standings.filter((standing) => standing.entityId === row.currentClubId && standing.seasonId === row.seasonId && isChampion(standing, data.competitions.find((item) => item.id === standing.competitionId))).length
    return { id, name: coach?.name ?? id, seasons: new Set(rows.map((row) => row.seasonId)).size, titles, clubs: [...new Set(rows.map((row) => row.currentClubName).filter((name): name is string => Boolean(name)))], averageWinRate: average(rows.map((row) => row.winRate)) }
  }).sort((a, b) => b.titles - a.titles || b.seasons - a.seasons)
}
function competitionRecords(data: ProfileDataBundle, standings: Standing[]): CompetitionRecordRow[] {
  const groups = new Map<string, Standing[]>()
  for (const row of standings) { const list = groups.get(row.competitionId) ?? []; list.push(row); groups.set(row.competitionId, list) }
  return [...groups.entries()].map(([id, rows]) => ({
    id, name: data.competitions.find((item) => item.id === id)?.name ?? rows[0]?.competitionName ?? id,
    seasons: new Set(rows.map((row) => row.seasonId)).size,
    titles: rows.filter((row) => isChampion(row, data.competitions.find((item) => item.id === id))).length,
    bestPosition: Math.min(...rows.map((row) => row.position ?? 999).filter((value) => value < 999)),
    points: sum(rows.map((row) => row.points)), goalsFor: sum(rows.map((row) => row.goalsFor)),
  })).sort((a, b) => b.titles - a.titles || b.points - a.points)
}
function buildHall(data: ProfileDataBundle, kind: ProfileKind, id: string): ProfileHallOfFame {
  let stats: PlayerCompetitionStats[] = []
  let standings: Standing[] = []
  let relations: Array<{ entityId?: string; seasonId: string }> = []
  if (kind === 'competition') {
    stats = data.stats.filter((row) => row.competitionId === id)
    standings = data.standings.filter((row) => row.competitionId === id)
    relations = standings.map((row) => ({ entityId: row.entityId, seasonId: row.seasonId }))
  } else if (kind === 'club') {
    stats = data.stats.filter((row) => row.clubId === id)
    standings = data.standings.filter((row) => row.entityId === id)
    relations = [...new Set([...stats.map((row) => row.seasonId), ...standings.map((row) => row.seasonId)])].map((seasonId) => ({ entityId: id, seasonId }))
  } else if (kind === 'player') {
    stats = data.stats.filter((row) => row.playerId === id)
    standings = data.standings.filter((row) => stats.some((stat) => stat.clubId === row.entityId && stat.seasonId === row.seasonId))
    relations = stats.map((row) => ({ entityId: row.clubId, seasonId: row.seasonId }))
  } else {
    const assignments = data.coachSeasons.filter((row) => row.coachId === id)
    relations = assignments.map((row) => ({ entityId: row.currentClubId, seasonId: row.seasonId }))
    stats = data.stats.filter((row) => relations.some((relation) => relation.entityId === row.clubId && relation.seasonId === row.seasonId))
    standings = data.standings.filter((row) => relations.some((relation) => relation.entityId === row.entityId && relation.seasonId === row.seasonId))
  }
  return { players: playerRecords(data, stats), clubs: clubRecords(data, standings), coaches: coachRecords(data, relations), competitions: competitionRecords(data, standings) }
}

interface FeatureDefinition { label: string; aliases: string[]; source: 'metric' | 'attribute' | 'derived'; inverse?: boolean; derived?: (row: PlayerCompetitionStats) => number | undefined }
interface DimensionDefinition { id: string; label: string; features: FeatureDefinition[] }
const dimensions: DimensionDefinition[] = [
  { id: 'attack', label: 'Produção ofensiva', features: [
    { label: 'Golos por 90', aliases: [], source: 'derived', derived: (row) => row.minutes ? row.goals * 90 / row.minutes : undefined },
    { label: 'xG', aliases: ['xg', 'xg por 90', 'golos esperados'], source: 'metric' },
    { label: 'Remates', aliases: ['remates por 90', 'remates', 'shots'], source: 'metric' },
    { label: 'Toques na área', aliases: ['toques na area', 'toques area adversaria'], source: 'metric' },
  ] },
  { id: 'creation', label: 'Criação', features: [
    { label: 'Assistências por 90', aliases: [], source: 'derived', derived: (row) => row.minutes ? row.assists * 90 / row.minutes : undefined },
    { label: 'xA', aliases: ['xa', 'assistencias esperadas'], source: 'metric' },
    { label: 'Passes-chave', aliases: ['passes chave', 'passes-chave', 'key passes'], source: 'metric' },
    { label: 'Passes progressivos', aliases: ['passes progressivos'], source: 'metric' },
  ] },
  { id: 'possession', label: 'Controlo e técnica', features: [
    { label: 'Passe completo', aliases: ['% passe', 'percentagem de passe', 'passes completos %'], source: 'metric' },
    { label: 'Dribles eficazes', aliases: ['dribles completos %', 'dribles bem sucedidos', 'dribles completos'], source: 'metric' },
    { label: 'Primeiro toque', aliases: ['primeiro toque'], source: 'attribute' },
    { label: 'Técnica', aliases: ['tecnica'], source: 'attribute' },
  ] },
  { id: 'defence', label: 'Agressividade defensiva', features: [
    { label: 'Desarmes', aliases: ['desarmes por 90', 'desarmes', 'tackles'], source: 'metric' },
    { label: 'Interceções', aliases: ['intercecoes por 90', 'intercecoes'], source: 'metric' },
    { label: 'Duelos defensivos', aliases: ['duelos defensivos ganhos', 'duelos ganhos'], source: 'metric' },
    { label: 'Posicionamento', aliases: ['posicionamento'], source: 'attribute' },
  ] },
  { id: 'pressing', label: 'Pressão e intensidade', features: [
    { label: 'Pressões eficazes', aliases: ['pressoes eficazes', 'pressoes'], source: 'metric' },
    { label: 'Recuperações altas', aliases: ['recuperacoes altas', 'recuperacoes em zonas altas'], source: 'metric' },
    { label: 'Índice de trabalho', aliases: ['indice de trabalho', 'work rate'], source: 'attribute' },
    { label: 'Resistência', aliases: ['resistencia'], source: 'attribute' },
  ] },
  { id: 'directness', label: 'Verticalidade', features: [
    { label: 'Passes progressivos', aliases: ['passes progressivos'], source: 'metric' },
    { label: 'Passes longos', aliases: ['passes longos', 'precisao passes longos'], source: 'metric' },
    { label: 'Conduções progressivas', aliases: ['conducoes progressivas'], source: 'metric' },
    { label: 'Cruzamentos', aliases: ['cruzamentos completos', 'cruzamentos'], source: 'metric' },
  ] },
  { id: 'physical', label: 'Poder físico', features: [
    { label: 'Duelos aéreos', aliases: ['duelos aereos ganhos', 'duelos aereos'], source: 'metric' },
    { label: 'Força', aliases: ['forca'], source: 'attribute' },
    { label: 'Velocidade', aliases: ['velocidade'], source: 'attribute' },
    { label: 'Aceleração', aliases: ['aceleracao'], source: 'attribute' },
  ] },
  { id: 'discipline', label: 'Disciplina', features: [
    { label: 'Faltas', aliases: ['faltas cometidas', 'faltas'], source: 'metric', inverse: true },
    { label: 'Cartões', aliases: ['cartoes', 'cartoes amarelos'], source: 'metric', inverse: true },
    { label: 'Concentração', aliases: ['concentracao'], source: 'attribute' },
    { label: 'Decisões', aliases: ['decisoes'], source: 'attribute' },
  ] },
]
function relevantStats(data: ProfileDataBundle, kind: ProfileKind, id: string): PlayerCompetitionStats[] {
  if (kind === 'competition') return data.stats.filter((row) => row.competitionId === id)
  if (kind === 'club') return data.stats.filter((row) => row.clubId === id)
  if (kind === 'player') return data.stats.filter((row) => row.playerId === id)
  const assignments = new Set(data.coachSeasons.filter((row) => row.coachId === id && row.currentClubId).map((row) => `${row.currentClubId}|${row.seasonId}`))
  return data.stats.filter((row) => row.clubId && assignments.has(`${row.clubId}|${row.seasonId}`))
}
function featureValues(data: ProfileDataBundle, rows: PlayerCompetitionStats[], feature: FeatureDefinition): number[] {
  if (feature.source === 'derived') return rows.map((row) => feature.derived?.(row)).filter((value): value is number => value !== undefined && Number.isFinite(value))
  if (feature.source === 'metric') return rows.map((row) => metricValue(row.metrics, feature.aliases)).filter((value): value is number => value !== undefined)
  const keys = new Set(rows.map((row) => `${row.playerId}|${row.seasonId}`))
  return data.playerAttributes.filter((row) => keys.has(`${row.playerId}|${row.seasonId}`)).map((row) => metricValue(Object.fromEntries(Object.entries(row.attributes)), feature.aliases)).filter((value): value is number => value !== undefined)
}
function buildStyle(data: ProfileDataBundle, kind: ProfileKind, id: string): ProfileStyle | undefined {
  if (kind === 'player') return undefined
  const rows = relevantStats(data, kind, id)
  if (!rows.length) return { dimensions: [], identity: 'Sem estatísticas suficientes para inferir o estilo de jogo.', strengths: [], limitations: ['Importa Estatísticas para esta entidade e época.'], samplePlayers: 0, sampleRows: 0 }
  const allRows = data.stats
  const styleDimensions: StyleDimension[] = dimensions.map((dimension) => {
    const details: StyleFeatureDetail[] = dimension.features.map((feature) => {
      const values = featureValues(data, rows, feature)
      const baselineKey = `${feature.source}:${feature.label}:${feature.aliases.join('|')}`
      let baseline = styleBaselineCache.get(baselineKey)
      if (!styleBaselineCache.has(baselineKey)) {
        baseline = average(featureValues(data, allRows, feature))
        styleBaselineCache.set(baselineKey, baseline)
      }
      const value = average(values)
      let index: number | undefined
      if (value !== undefined && baseline !== undefined && baseline !== 0) index = feature.inverse ? clamp(baseline / Math.max(value, .0001) * 100, 45, 160) : clamp(value / baseline * 100, 45, 160)
      return { label: feature.label, value, baseline, index, coverage: pct(values.length, feature.source === 'attribute' ? new Set(rows.map((row) => `${row.playerId}|${row.seasonId}`)).size : rows.length), source: feature.source }
    })
    const valid = details.filter((detail) => detail.index !== undefined)
    const score = average(valid.map((detail) => detail.index))
    const coverage = average(details.map((detail) => detail.coverage)) ?? 0
    const interpretation = score === undefined ? 'Sem dados' : score >= 120 ? 'muito acima da média' : score >= 108 ? 'acima da média' : score <= 80 ? 'muito abaixo da média' : score <= 92 ? 'abaixo da média' : 'próximo da média'
    return { id: dimension.id, label: dimension.label, score, coverage, interpretation, details }
  })
  const ranked = styleDimensions.filter((item) => item.score !== undefined).sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  const strengths = ranked.slice(0, 3).map((item) => `${item.label}: ${item.interpretation} (${number(item.score, 0)})`)
  const limitations = [...styleDimensions].sort((a, b) => a.coverage - b.coverage).filter((item) => item.coverage < 50).slice(0, 3).map((item) => `Cobertura limitada em ${item.label} (${number(item.coverage, 0)}%).`)
  const identity = ranked.length ? `Identidade marcada por ${ranked.slice(0, 2).map((item) => item.label.toLowerCase()).join(' e ')}. ${ranked[0].label} surge ${ranked[0].interpretation}; ${ranked.at(-1)?.label.toLowerCase()} é a dimensão menos dominante.` : 'Não foi possível inferir uma identidade estatística consistente.'
  return { dimensions: styleDimensions, identity, strengths, limitations, samplePlayers: new Set(rows.map((row) => row.playerId)).size, sampleRows: rows.length }
}

function seasonStats(data: ProfileDataBundle, kind: ProfileKind, id: string, seasonId: string): PlayerCompetitionStats[] {
  if (kind === 'competition') return data.stats.filter((row) => row.competitionId === id && row.seasonId === seasonId)
  if (kind === 'club') return data.stats.filter((row) => row.clubId === id && row.seasonId === seasonId)
  if (kind === 'player') return data.stats.filter((row) => row.playerId === id && row.seasonId === seasonId)
  const clubs = new Set(data.coachSeasons.filter((row) => row.coachId === id && row.seasonId === seasonId && row.currentClubId).map((row) => row.currentClubId as string))
  return data.stats.filter((row) => row.seasonId === seasonId && row.clubId && clubs.has(row.clubId))
}
function seasonPlayerIds(rows: PlayerCompetitionStats[]): string[] { return [...new Set(rows.map((row) => row.playerId))] }
function metricAverage(rows: PlayerCompetitionStats[], aliases: string[]): number | undefined { return average(rows.map((row) => metricValue(row.metrics, aliases))) }
function evolutionSeries(data: ProfileDataBundle, kind: ProfileKind, id: string, market: ProfileMarket): EvolutionSeries[] {
  const seasons = data.seasons.slice().sort((a, b) => a.startYear - b.startYear)
  const metric = (seriesId: string, label: string, unit: EvolutionSeries['unit'], description: string, getter: (season: Season, rows: PlayerCompetitionStats[]) => number | undefined): EvolutionSeries => ({ id: seriesId, label, unit, description, points: seasons.map((season) => ({ seasonId: season.id, season: season.label, value: getter(season, seasonStats(data, kind, id, season.id)) })) })
  if (kind === 'player') return [
    metric('age', 'Idade', 'number', 'Evolução da idade registada no perfil da época.', (season) => data.playerSeasons.find((row) => row.playerId === id && row.seasonId === season.id)?.age),
    metric('value', 'Valor de mercado', 'money', 'Valor de mercado importado em cada época.', (season) => data.playerSeasons.find((row) => row.playerId === id && row.seasonId === season.id)?.marketValue),
    metric('wage', 'Salário anual', 'money', 'Salário anual importado em cada época.', (season) => data.playerSeasons.find((row) => row.playerId === id && row.seasonId === season.id)?.wageAnnual),
    metric('ca', 'Capacidade atual', 'rating', 'C.A. média reconhecida nos dados da época.', (_season, rows) => metricAverage(rows, ['ca', 'c.a.', 'currentAbility'])),
    metric('pa', 'Capacidade potencial', 'rating', 'C.P. média reconhecida nos dados da época.', (_season, rows) => metricAverage(rows, ['pa', 'c.p.', 'potentialAbility'])),
    metric('reputation', 'Reputação', 'rating', 'Reputação reconhecida nos dados do jogador.', (_season, rows) => metricAverage(rows, ['reputacao', 'reputation', 'ra', 'r.a.'])),
    metric('goals', 'Golos', 'number', 'Golos em todas as competições da época.', (_season, rows) => sum(rows.map((row) => row.goals))),
    metric('assists', 'Assistências', 'number', 'Assistências em todas as competições da época.', (_season, rows) => sum(rows.map((row) => row.assists))),
    metric('rating', 'Avaliação média', 'rating', 'Avaliação média ponderada pelos minutos.', (_season, rows) => metricAverage(rows, ['averageRating', 'avaliacao', 'classificacao'])),
  ]
  const marketSeason = new Map(market.seasons.map((row) => [row.seasonId, row]))
  const reputation = metric('reputation', 'Reputação', 'rating', 'Reputação da entidade ao longo das épocas.', (season) => {
    if (kind === 'competition') return data.competitionSeasons.find((row) => row.competitionId === id && row.seasonId === season.id)?.reputation ?? data.competitions.find((row) => row.id === id)?.reputation
    if (kind === 'club') return data.clubSeasons.find((row) => row.clubId === id && row.seasonId === season.id)?.reputation ?? data.clubs.find((row) => row.id === id)?.reputation
    return undefined
  })
  return [
    reputation,
    metric('players', 'Jogadores utilizados', 'number', 'Número de jogadores únicos com estatísticas.', (_season, rows) => seasonPlayerIds(rows).length || undefined),
    metric('age', 'Idade média', 'number', 'Idade média dos jogadores da entidade.', (season, rows) => average(seasonPlayerIds(rows).map((playerId) => data.playerSeasons.find((item) => item.playerId === playerId && item.seasonId === season.id)?.age))),
    metric('value', 'Valor médio de mercado', 'money', 'Valor médio dos jogadores utilizados.', (season, rows) => average(seasonPlayerIds(rows).map((playerId) => data.playerSeasons.find((item) => item.playerId === playerId && item.seasonId === season.id)?.marketValue))),
    metric('wage', 'Salário médio', 'money', 'Salário anual médio dos jogadores utilizados.', (season, rows) => average(seasonPlayerIds(rows).map((playerId) => data.playerSeasons.find((item) => item.playerId === playerId && item.seasonId === season.id)?.wageAnnual))),
    metric('ca', 'C.A. média', 'rating', 'Capacidade atual média reconhecida.', (_season, rows) => metricAverage(rows, ['ca', 'c.a.', 'currentAbility'])),
    metric('pa', 'C.P. média', 'rating', 'Capacidade potencial média reconhecida.', (_season, rows) => metricAverage(rows, ['pa', 'c.p.', 'potentialAbility'])),
    metric('goals90', 'Golos por 90', 'number', 'Produção ofensiva agregada por 90 minutos de jogador.', (_season, rows) => { const minutes = sum(rows.map((row) => row.minutes)); return minutes ? sum(rows.map((row) => row.goals)) * 90 / minutes : undefined }),
    metric('rating', 'Avaliação média', 'rating', 'Avaliação média dos jogadores.', (_season, rows) => metricAverage(rows, ['averageRating', 'avaliacao', 'classificacao'])),
    metric('spend', 'Investimento', 'money', 'Valor gasto em contratações na época.', (season) => marketSeason.get(season.id)?.spend),
    metric('income', 'Receita de vendas', 'money', 'Valor recebido em vendas na época.', (season) => marketSeason.get(season.id)?.income),
  ].filter((series) => series.points.some((point) => point.value !== undefined))
}

function profileWarnings(data: ProfileDataBundle, kind: ProfileKind, id: string): string[] {
  const warnings: string[] = []
  const stats = relevantStats(data, kind, id)
  const market = entityTransfers(data, kind, id)
  if (!stats.length) warnings.push('Não existem estatísticas individuais ligadas a esta entidade.')
  if (!market.length) warnings.push('Não existem transferências reconhecidas para esta entidade.')
  if (kind === 'competition' && !data.standings.some((row) => row.competitionId === id)) warnings.push('Não existem classificações ou fases históricas para esta competição.')
  if (kind === 'club' && !data.coachSeasons.some((row) => row.currentClubId === id)) warnings.push('Não existe treinador associado ao clube em nenhuma época.')
  if (kind === 'player' && !data.playerSeasons.some((row) => row.playerId === id)) warnings.push('Não existem perfis de época para este jogador.')
  if (kind === 'coach' && !data.coachSeasons.some((row) => row.coachId === id)) warnings.push('Não existem registos de época para este treinador.')
  return warnings
}

export async function loadEntityProfile(kind: ProfileKind, id: string): Promise<EntityProfile | null> {
  const data = await loadBundle()
  const market = buildMarket(data, kind, id)
  const hall = buildHall(data, kind, id)
  const style = buildStyle(data, kind, id)
  const evolution = evolutionSeries(data, kind, id, market)
  const warnings = profileWarnings(data, kind, id)
  if (kind === 'competition') {
    const entity = data.competitions.find((item) => item.id === id); if (!entity) return null
    const history = historyForCompetition(data, id)
    const latest = data.competitionSeasons.filter((row) => row.competitionId === id).sort((a, b) => seasonYear(data, b.seasonId) - seasonYear(data, a.seasonId))[0]
    return {
      kind, id, name: entity.name, subtitle: [entity.country, entity.continent, entity.type].filter(Boolean).join(' · '), badge: entity.type,
      facts: [{ label: 'País', value: entity.country ?? '—' }, { label: 'Continente', value: entity.continent ?? '—' }, { label: 'Tipo', value: entity.type }, { label: 'Nível', value: number(latest?.level ?? entity.level, 0) }],
      kpis: [
        { label: 'Reputação', value: number(latest?.reputation ?? entity.reputation, 0), detail: 'valor mais recente' },
        { label: 'Épocas', value: new Set(data.standings.filter((row) => row.competitionId === id).map((row) => row.seasonId)).size, detail: 'com histórico' },
        { label: 'Clubes/seleções', value: new Set(data.standings.filter((row) => row.competitionId === id).map((row) => row.entityId ?? row.entityName)).size, detail: 'participantes únicos' },
        { label: 'Jogadores', value: new Set(data.stats.filter((row) => row.competitionId === id).map((row) => row.playerId)).size, detail: 'com estatísticas' },
      ], market, history, achievements: [], hall, style, evolution, dataWarnings: warnings,
    }
  }
  if (kind === 'club') {
    const entity = data.clubs.find((item) => item.id === id); if (!entity) return null
    const latest = data.clubSeasons.filter((row) => row.clubId === id).sort((a, b) => seasonYear(data, b.seasonId) - seasonYear(data, a.seasonId))[0]
    const achievements = achievementsForClub(data, id)
    return {
      kind, id, name: entity.name, subtitle: [entity.country, entity.continent].filter(Boolean).join(' · '), badge: 'Clube',
      facts: [{ label: 'País', value: entity.country ?? '—' }, { label: 'Continente', value: entity.continent ?? '—' }, { label: 'Assistência média', value: number(latest?.averageAttendance ?? entity.averageAttendance, 0) }, { label: 'Bilhetes de época', value: number(latest?.seasonTickets ?? entity.seasonTickets, 0) }],
      kpis: [
        { label: 'Reputação', value: number(latest?.reputation ?? entity.reputation, 0), detail: 'valor mais recente' },
        { label: 'Títulos', value: achievements.filter((item) => item.achievement === 'Campeão').length, detail: 'histórico reconhecido' },
        { label: 'Jogadores', value: new Set(data.stats.filter((row) => row.clubId === id).map((row) => row.playerId)).size, detail: 'utilizados' },
        { label: 'Saldo de mercado', value: money(market.seasons.reduce((total, row) => total + row.balance, 0)), detail: 'receitas − investimento' },
      ], market, history: historyForClub(data, id), achievements, hall, style, evolution, dataWarnings: warnings,
    }
  }
  if (kind === 'player') {
    const entity = data.players.find((item) => item.id === id); if (!entity) return null
    const seasons = data.playerSeasons.filter((row) => row.playerId === id).sort((a, b) => seasonYear(data, b.seasonId) - seasonYear(data, a.seasonId))
    const latest = seasons[0]
    const stats = data.stats.filter((row) => row.playerId === id)
    const minutes = sum(stats.map((row) => row.minutes))
    return {
      kind, id, name: entity.name, subtitle: [latest?.position, latest?.clubName, entity.nationality].filter(Boolean).join(' · '), badge: latest?.position,
      facts: [{ label: 'Nacionalidade', value: entity.nationality ?? '—' }, { label: 'Clube atual', value: latest?.clubName ?? '—' }, { label: 'Posição', value: latest?.position ?? '—' }, { label: 'Contrato', value: latest?.contractExpiry ?? '—' }],
      kpis: [
        { label: 'Valor', value: money(latest?.marketValue), detail: seasonLabel(data, latest?.seasonId ?? '') },
        { label: 'Salário anual', value: money(latest?.wageAnnual), detail: 'último registo' },
        { label: 'Golos', value: sum(stats.map((row) => row.goals)), detail: `${number(minutes ? sum(stats.map((row) => row.goals)) * 90 / minutes : 0, 2)} por 90` },
        { label: 'Assistências', value: sum(stats.map((row) => row.assists)), detail: `${number(minutes ? sum(stats.map((row) => row.assists)) * 90 / minutes : 0, 2)} por 90` },
      ], market, history: [], achievements: achievementsForPlayer(data, id), hall, evolution, dataWarnings: warnings,
    }
  }
  const entity = data.coaches.find((item) => item.id === id); if (!entity) return null
  const assignments = data.coachSeasons.filter((row) => row.coachId === id).sort((a, b) => seasonYear(data, b.seasonId) - seasonYear(data, a.seasonId))
  const latest = assignments[0]
  const achievements = achievementsForCoach(data, id)
  return {
    kind, id, name: entity.name, subtitle: [latest?.currentClubName, latest?.role, entity.nationality].filter(Boolean).join(' · '), badge: latest?.role,
    facts: [{ label: 'Nacionalidade', value: entity.nationality ?? '—' }, { label: 'Clube/seleção', value: latest?.currentClubName ?? '—' }, { label: 'Função', value: latest?.role ?? '—' }, { label: 'Contrato', value: latest?.contractExpiry ?? '—' }],
    kpis: [
      { label: 'Épocas', value: new Set(assignments.map((row) => row.seasonId)).size, detail: 'registos encontrados' },
      { label: 'Títulos', value: achievements.filter((item) => item.achievement === 'Campeão').length, detail: 'associados ao cargo' },
      { label: 'Vitórias', value: `${number(average(assignments.map((row) => row.winRate)), 1)}%`, detail: 'taxa média importada' },
      { label: 'Saldo de mercado', value: money(market.seasons.reduce((total, row) => total + row.balance, 0)), detail: 'durante épocas associadas' },
    ], market, history: [], achievements, hall, style, evolution, dataWarnings: warnings,
  }
}
