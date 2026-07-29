import { db } from '../../../database/db'
import { normalizeKey } from '../../imports/core/normalizers'
import type { Club, Coach, Competition, Player, PlayerCompetitionStats, PlayerGeneralMetrics, PlayerSeason, Season, Transfer } from '../../../shared/types/entities'
import type { ClubContext, EnrichedTransfer, MarketDataBundle, MarketPlayerSnapshot, PositionGroup } from '../types'

let cache: MarketDataBundle | null = null

const metricKey = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
function metricFrom(records: Array<Record<string, number | null> | undefined>, aliases: string[]): number | undefined {
  const wanted = new Set(aliases.map(metricKey))
  for (const record of records) {
    if (!record) continue
    for (const [key, value] of Object.entries(record)) {
      if (value == null || !Number.isFinite(value)) continue
      if (wanted.has(metricKey(key))) return value
    }
  }
  return undefined
}
function average(values: Array<number | undefined>): number | undefined {
  const valid = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : undefined
}
export function positionGroup(position?: string): PositionGroup {
  const key = normalizeKey(position)
  if (!key) return 'Desconhecida'
  if (/\bgr\b|guarda redes|goalkeeper/.test(key)) return 'Guarda-redes'
  if (/\bd\b|defesa|lateral|ala defensivo/.test(key)) return 'Defesas'
  if (/\bm\b|medio|trinco|volante|mezzala|carrilero/.test(key)) return 'Médios'
  if (/\bmo\b|extremo|ala|winger/.test(key)) return 'Extremos'
  if (/\bpl\b|avancado|ponta de lanca|striker/.test(key)) return 'Avançados'
  return 'Desconhecida'
}
function isHeadCoach(role?: string): boolean {
  const key = normalizeKey(role)
  if (!key) return false
  if (/adjunto|assistente|sub 18|sub 19|sub 20|sub 21|sub 23|reservas|preparador/.test(key)) return false
  return /treinador|manager|head coach|selecionador/.test(key)
}
function inferTransferType(transfer: Transfer): Transfer['transferType'] {
  if (transfer.transferType !== 'unknown') return transfer.transferType
  const raw = normalizeKey(transfer.rawFee)
  if (/emprest|loan/.test(raw)) return 'loan'
  if (/livre|free|sem custo|custo zero/.test(raw)) return 'free'
  if ((transfer.fee ?? 0) > 0 || (transfer.possibleFee ?? 0) > 0) return 'permanent'
  return transfer.fee === 0 && Boolean(transfer.rawFee) ? 'free' : 'unknown'
}
function choosePrimaryCompetition(competitions: Competition[]): Competition | undefined {
  return competitions.find((item) => item.type === 'national')
    ?? competitions.find((item) => item.type === 'super-league')
    ?? competitions.find((item) => item.type === 'continental')
    ?? competitions[0]
}
function buildPlayerSnapshot(
  player: Player | undefined,
  playerSeason: PlayerSeason | undefined,
  general: PlayerGeneralMetrics | undefined,
  stats: PlayerCompetitionStats[],
): MarketPlayerSnapshot {
  const statMetrics = stats.map((item) => item.metrics)
  const records = [general?.metrics, ...statMetrics]
  const ca = metricFrom(records, ['currentAbility', 'c-a', 'c_a', 'ca'])
  const pa = metricFrom(records, ['potentialAbility', 'c-p', 'c_p', 'pa'])
  const reputation = metricFrom(records, ['r-a', 'r_a', 'ra', 'reputacao', 'reputation', 'rm', 'rc'])
  const marketValue = playerSeason?.marketValue ?? metricFrom(records, ['marketValue', 'market-value', 'vp', 'valor'])
  const wageAnnual = playerSeason?.wageAnnual ?? metricFrom(records, ['wageAnnual', 'wage-annual', 'salario'])
  const position = playerSeason?.position ?? stats.find((item) => item.scope)?.scope
  return {
    player,
    season: playerSeason,
    age: playerSeason?.age,
    nationality: player?.nationality,
    position,
    positionGroup: positionGroup(position),
    marketValue,
    wageAnnual,
    currentAbility: ca,
    potentialAbility: pa,
    reputation,
    height: metricFrom(records, ['altura', 'height']),
    weight: metricFrom(records, ['peso', 'weight']),
  }
}

export function clearMarketDataCache(): void { cache = null }

export async function loadMarketData(force = false): Promise<MarketDataBundle> {
  if (cache && !force) return cache
  const [seasons, transfersRaw, players, playerSeasons, generalMetrics, stats, clubs, competitions, coaches, coachSeasons, standings] = await Promise.all([
    db.seasons.toArray(), db.transfers.toArray(), db.players.toArray(), db.playerSeasons.toArray(), db.playerGeneralMetrics.toArray(), db.playerCompetitionStats.toArray(), db.clubs.toArray(), db.competitions.toArray(), db.coaches.toArray(), db.coachSeasons.toArray(), db.standings.toArray(),
  ])
  seasons.sort((a, b) => a.startYear - b.startYear)
  const seasonMap = new Map(seasons.map((item) => [item.id, item]))
  const playerMap = new Map(players.map((item) => [item.id, item]))
  const playersByName = new Map<string, Player[]>()
  for (const player of players) {
    const key = normalizeKey(player.name)
    const list = playersByName.get(key) ?? []
    list.push(player)
    playersByName.set(key, list)
  }
  const playerSeasonMap = new Map(playerSeasons.map((item) => [`${item.playerId}:${item.seasonId}`, item]))
  const generalMap = new Map(generalMetrics.map((item) => [`${item.playerId}:${item.seasonId}`, item]))
  const statsByPlayerSeason = new Map<string, PlayerCompetitionStats[]>()
  const clubCompetitionIds = new Map<string, Set<string>>()
  for (const row of stats) {
    const pKey = `${row.playerId}:${row.seasonId}`
    const list = statsByPlayerSeason.get(pKey) ?? []
    list.push(row)
    statsByPlayerSeason.set(pKey, list)
    if (row.clubId) {
      const cKey = `${row.clubId}:${row.seasonId}`
      const set = clubCompetitionIds.get(cKey) ?? new Set<string>()
      set.add(row.competitionId)
      clubCompetitionIds.set(cKey, set)
    }
  }
  for (const standing of standings) {
    if (!standing.entityId || standing.entityId.startsWith('country:')) continue
    const key = `${standing.entityId}:${standing.seasonId}`
    const set = clubCompetitionIds.get(key) ?? new Set<string>()
    set.add(standing.competitionId)
    clubCompetitionIds.set(key, set)
  }
  const clubMap = new Map(clubs.map((item) => [item.id, item]))
  const clubsByName = new Map(clubs.map((item) => [normalizeKey(item.name), item]))
  const competitionMap = new Map(competitions.map((item) => [item.id, item]))
  const coachMap = new Map(coaches.map((item) => [item.id, item]))
  const coachesByClubSeason = new Map<string, Coach[]>()
  for (const assignment of coachSeasons) {
    if (!assignment.currentClubId || assignment.currentClubId.startsWith('country:') || !isHeadCoach(assignment.role)) continue
    const coach = coachMap.get(assignment.coachId)
    if (!coach) continue
    const key = `${assignment.currentClubId}:${assignment.seasonId}`
    const list = coachesByClubSeason.get(key) ?? []
    if (!list.some((item) => item.id === coach.id)) list.push(coach)
    coachesByClubSeason.set(key, list)
  }
  const contextFor = (clubId: string | undefined, clubName: string | undefined, seasonId: string): ClubContext => {
    const club = clubId ? clubMap.get(clubId) : clubName ? clubsByName.get(normalizeKey(clubName)) : undefined
    const ids = club ? clubCompetitionIds.get(`${club.id}:${seasonId}`) ?? new Set<string>() : new Set<string>()
    const list = [...ids].map((id) => competitionMap.get(id)).filter((item): item is Competition => Boolean(item))
    return { club, competitions: list, primaryCompetition: choosePrimaryCompetition(list), coaches: club ? coachesByClubSeason.get(`${club.id}:${seasonId}`) ?? [] : [] }
  }
  const transfers: EnrichedTransfer[] = transfersRaw.map((raw) => {
    let player = raw.playerId ? playerMap.get(raw.playerId) : undefined
    if (!player) {
      const candidates = playersByName.get(normalizeKey(raw.playerName)) ?? []
      player = candidates.length === 1 ? candidates[0] : candidates.find((candidate) => playerSeasonMap.has(`${candidate.id}:${raw.seasonId}`))
    }
    const pSeason = player ? playerSeasonMap.get(`${player.id}:${raw.seasonId}`) : undefined
    const pStats = player ? statsByPlayerSeason.get(`${player.id}:${raw.seasonId}`) ?? [] : []
    const snapshot = buildPlayerSnapshot(player, pSeason, player ? generalMap.get(`${player.id}:${raw.seasonId}`) : undefined, pStats)
    const from = contextFor(raw.fromClubId, raw.fromClubName, raw.seasonId)
    const to = contextFor(raw.toClubId, raw.toClubName, raw.seasonId)
    const effectiveFee = raw.fee ?? 0
    const fromCountry = from.club?.country
    const toCountry = to.club?.country
    const fromCompetition = from.primaryCompetition?.id
    const toCompetition = to.primaryCompetition?.id
    return {
      ...raw,
      transferType: inferTransferType(raw),
      season: seasonMap.get(raw.seasonId),
      snapshot,
      from,
      to,
      effectiveFee,
      feeKnown: raw.fee !== undefined,
      feeToMarketValue: snapshot.marketValue && snapshot.marketValue > 0 && raw.fee !== undefined ? raw.fee / snapshot.marketValue : undefined,
      potentialGap: snapshot.currentAbility !== undefined && snapshot.potentialAbility !== undefined ? snapshot.potentialAbility - snapshot.currentAbility : undefined,
      domestic: fromCountry && toCountry ? fromCountry === toCountry : null,
      sameCompetition: fromCompetition && toCompetition ? fromCompetition === toCompetition : null,
      linkedPlayer: Boolean(player),
    }
  })
  cache = { seasons, clubs, competitions, coaches, transfers }
  return cache
}
