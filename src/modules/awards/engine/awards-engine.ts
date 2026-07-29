import type { Club, Coach, CoachSeason, Competition, Player, PlayerAttributes, PlayerCompetitionStats, PlayerGeneralMetrics, PlayerSeason, Season, Standing } from '../../../shared/types/entities'
import type { EnrichedTransfer, MarketEntityRow } from '../../market/types'
import { computeEntityRows } from '../../market/engine/market-engine'
import { competitionModule } from '../../rankings/engine/ranking-engine'
import { normalizeKey } from '../../imports/core/normalizers'
import { positionGroup } from '../../market/services/market-service'
import type { AwardCandidate, AwardComponent, AwardConfidence, AwardEntityKind, AwardGroup, AwardModule, AwardResult, AwardsBundle, AwardsOptions } from '../types'

export interface AwardsEngineData {
  seasons: Season[]
  competitions: Competition[]
  standings: Standing[]
  players: Player[]
  playerSeasons: PlayerSeason[]
  playerAttributes: PlayerAttributes[]
  playerGeneralMetrics: PlayerGeneralMetrics[]
  playerStats: PlayerCompetitionStats[]
  clubs: Club[]
  coaches: Coach[]
  coachSeasons: CoachSeason[]
  transfers: EnrichedTransfer[]
}

type NumericMap = Record<string, number | undefined>
type CandidateBase = {
  id?: string
  name: string
  subtitle?: string
  values: NumericMap
  details: Record<string, string | number | undefined>
  evidence: string[]
}

type MetricSpec = { key: string; label: string; weight: number; direction?: 'higher' | 'lower'; format?: AwardComponent['format'] }

const round = (value: number, digits = 1) => Number(value.toFixed(digits))
const sum = (values: Array<number | undefined>) => values.reduce<number>((total, value) => total + (value ?? 0), 0)
const mean = (values: Array<number | undefined>): number | undefined => {
  const valid = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  return valid.length ? valid.reduce((total, value) => total + value, 0) / valid.length : undefined
}
const weightedMean = (values: Array<{ value?: number; weight: number }>): number | undefined => {
  const valid = values.filter((item): item is { value: number; weight: number } => typeof item.value === 'number' && Number.isFinite(item.value) && item.weight > 0)
  const weight = valid.reduce((total, item) => total + item.weight, 0)
  return weight ? valid.reduce((total, item) => total + item.value * item.weight, 0) / weight : undefined
}
const per90 = (value: number | undefined, minutes: number) => minutes > 0 && value !== undefined ? value * 90 / minutes : undefined
const percentage = (value: number, total: number) => total > 0 ? value / total * 100 : undefined
const confidence = (coverage: number, sample: number): AwardConfidence => coverage >= 78 && sample >= 8 ? 'alta' : coverage >= 48 && sample >= 3 ? 'moderada' : 'baixa'
const normalizeMetricKey = (value: string) => normalizeKey(value).replace(/[^a-z0-9]/g, '')

function metric(record: Record<string, number | null> | undefined, aliases: string[]): number | undefined {
  if (!record) return undefined
  const wanted = new Set(aliases.map(normalizeMetricKey))
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === 'number' && Number.isFinite(value) && wanted.has(normalizeMetricKey(key))) return value
  }
  return undefined
}
function metricAcross(records: Array<Record<string, number | null> | undefined>, aliases: string[], mode: 'sum' | 'average' = 'sum'): number | undefined {
  const values = records.map((record) => metric(record, aliases)).filter((value): value is number => value !== undefined)
  if (!values.length) return undefined
  return mode === 'sum' ? values.reduce((total, value) => total + value, 0) : values.reduce((total, value) => total + value, 0) / values.length
}
function percentile(value: number, values: number[], direction: 'higher' | 'lower' = 'higher'): number {
  if (values.length < 2) return 50
  const sorted = [...values].sort((a, b) => a - b)
  let lower = 0, equal = 0
  for (const item of sorted) {
    if (item < value) lower++
    else if (item === value) equal++
  }
  const raw = ((lower + equal / 2) / sorted.length) * 100
  return direction === 'lower' ? 100 - raw : raw
}
function rankCandidates(kind: AwardEntityKind, candidates: CandidateBase[], specs: MetricSpec[]): AwardCandidate[] {
  const distributions = new Map<string, number[]>()
  for (const spec of specs) distributions.set(spec.key, candidates.map((candidate) => candidate.values[spec.key]).filter((value): value is number => typeof value === 'number' && Number.isFinite(value)))
  return candidates.map((candidate) => {
    const totalWeight = specs.reduce((total, spec) => total + spec.weight, 0) || 1
    let availableWeight = 0
    const components: AwardComponent[] = specs.map((spec) => {
      const raw = candidate.values[spec.key]
      if (raw === undefined || !Number.isFinite(raw)) return { label: spec.label, weight: spec.weight, contribution: 0, available: false, direction: spec.direction ?? 'higher', format: spec.format }
      availableWeight += spec.weight
      const normalized = percentile(raw, distributions.get(spec.key) ?? [], spec.direction)
      return { label: spec.label, raw: round(raw, 2), normalized: round(normalized), weight: spec.weight, contribution: normalized * spec.weight, available: true, direction: spec.direction ?? 'higher', format: spec.format }
    })
    const score = availableWeight ? components.reduce((total, component) => total + component.contribution, 0) / availableWeight : 0
    const coverage = availableWeight / totalWeight * 100
    return {
      entityId: candidate.id,
      name: candidate.name,
      kind,
      score: round(score),
      confidence: confidence(coverage, candidates.length),
      coverage: round(coverage),
      subtitle: candidate.subtitle,
      details: candidate.details,
      components,
      evidence: candidate.evidence,
    }
  }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'pt'))
}
function award(id: string, name: string, shortName: string, description: string, group: AwardGroup, subject: AwardEntityKind, candidates: AwardCandidate[], formula: string, eligibility: string): AwardResult {
  const podium = candidates.filter((candidate) => candidate.coverage > 0).slice(0, 3)
  return { id, name, shortName, description, group, subject, winner: podium[0], podium, formula, eligibility, sample: candidates.length, status: podium.length ? 'awarded' : 'insufficient-data' }
}
function moduleMatches(competition: Competition, module: AwardModule): boolean {
  if (module === 'all') return true
  return competitionModule(competition, competition.name) === module
}
function isHeadCoach(role?: string): boolean {
  const key = normalizeKey(role)
  if (!key || /adjunto|assistente|sub 18|sub 19|sub 20|sub 21|sub 23|reservas|preparador/.test(key)) return false
  return /treinador|manager|head coach|selecionador/.test(key)
}
function stageValue(standing: Standing, module: AwardModule): number {
  if (standing.format === 'league') {
    const position = standing.position ?? 99
    const ppg = standing.played ? (standing.points ?? 0) / standing.played : 0
    const winRate = standing.played ? (standing.wins ?? 0) / standing.played * 100 : 0
    const gd = standing.played ? (standing.goalDifference ?? 0) / standing.played : 0
    const champion = module === 'superleague' ? normalizeKey(standing.info) === 'c' : position === 1 || normalizeKey(standing.info) === 'c'
    return Math.max(0, 100 - (position - 1) * 5) + ppg * 12 + winRate * .3 + gd * 6 + (champion ? 25 : 0)
  }
  const stage = normalizeKey(standing.stage)
  if (stage === 'winner') return 150
  if (stage === 'finalist') return 115
  if (stage.includes('semi')) return 85
  if (stage.includes('quarter')) return 60
  return 30
}

interface PlayerAggregate extends CandidateBase {
  playerId: string
  group: ReturnType<typeof positionGroup>
  age?: number
  clubId?: string
  clubName?: string
  minutes: number
  appearances: number
  goals: number
  assists: number
}

function buildPlayers(data: AwardsEngineData, options: AwardsOptions, competitionIds: Set<string>): PlayerAggregate[] {
  const playerMap = new Map(data.players.map((player) => [player.id, player]))
  const seasonRows = data.playerSeasons.filter((row) => row.seasonId === options.seasonId)
  const seasonMap = new Map(seasonRows.map((row) => [row.playerId, row]))
  const generalMap = new Map(data.playerGeneralMetrics.filter((row) => row.seasonId === options.seasonId).map((row) => [row.playerId, row.metrics]))
  const attributesMap = new Map(data.playerAttributes.filter((row) => row.seasonId === options.seasonId).map((row) => [row.playerId, row.attributes]))
  const currentSeason = data.seasons.find((row) => row.id === options.seasonId)
  const previousSeason = currentSeason ? data.seasons.find((row) => row.endYear === currentSeason.endYear - 1) : undefined
  const previousGeneralMap = new Map(data.playerGeneralMetrics.filter((row) => row.seasonId === previousSeason?.id).map((row) => [row.playerId, row.metrics]))
  const rows = data.playerStats.filter((row) => row.seasonId === options.seasonId && competitionIds.has(row.competitionId))
  const grouped = new Map<string, PlayerCompetitionStats[]>()
  for (const row of rows) {
    const list = grouped.get(row.playerId) ?? []
    list.push(row)
    grouped.set(row.playerId, list)
  }
  return [...grouped.entries()].map(([playerId, stats]) => {
    const player = playerMap.get(playerId)
    const season = seasonMap.get(playerId)
    const general = generalMap.get(playerId)
    const attributes = attributesMap.get(playerId)
    const minutes = sum(stats.map((row) => row.minutes))
    const appearances = sum(stats.map((row) => row.appearances))
    const goals = sum(stats.map((row) => row.goals))
    const assists = sum(stats.map((row) => row.assists))
    const statRecords = stats.map((row) => row.metrics)
    const rating = weightedMean(stats.map((row) => ({ value: metric(row.metrics, ['averageRating', 'classificacao', 'rating', 'av r']), weight: row.minutes || row.appearances || 1 })))
    const xg = metricAcross(statRecords, ['xg', 'expectedGoals', 'golos esperados'])
    const xa = metricAcross(statRecords, ['xa', 'expectedAssists', 'assistencias esperadas'])
    const keyPasses = metricAcross(statRecords, ['keyPasses', 'passes chave', 'ch c'])
    const tackles = metricAcross(statRecords, ['tackles', 'desarmes', 'desarmes ganhos'])
    const interceptions = metricAcross(statRecords, ['interceptions', 'intercecoes'])
    const recoveries = metricAcross(statRecords, ['recoveries', 'recuperacoes'])
    const dribbles = metricAcross(statRecords, ['dribbles completed', 'dribles bem sucedidos', 'drb'])
    const aerial = metricAcross(statRecords, ['aerial duels won', 'duelos aereos ganhos', 'cab ganhos'])
    const saves = metricAcross(statRecords, ['saves', 'defesas', 'defesas por 90'])
    const cleanSheets = metricAcross(statRecords, ['clean sheets', 'cleanSheets', 'sem sofrer'])
    const goalsPrevented = metricAcross(statRecords, ['goals prevented', 'golos evitados', 'golos evitados face ao xg sofrido'])
    const errors = metricAcross(statRecords, ['errors', 'erros defensivos', 'erros que originam remate golo'])
    const passPct = metricAcross(statRecords, ['pass completion', 'percentagem passe', 'passe'], 'average')
    const ca = metric(general, ['currentAbility', 'ca', 'c a']) ?? metric(attributes as Record<string, number | null> | undefined, ['currentAbility', 'ca', 'c a'])
    const pa = metric(general, ['potentialAbility', 'pa', 'c p']) ?? metric(attributes as Record<string, number | null> | undefined, ['potentialAbility', 'pa', 'c p'])
    const reputation = metric(general, ['reputation', 'reputacao', 'ra', 'rm', 'rc'])
    const previousCA = metric(previousGeneralMap.get(playerId), ['currentAbility', 'ca', 'c a'])
    const group = positionGroup(season?.position)
    const output = group === 'Guarda-redes' ? sum([saves, cleanSheets, goalsPrevented]) : group === 'Defesas' ? sum([tackles, interceptions, recoveries, aerial]) : group === 'Médios' ? goals + assists * 1.4 + (xa ?? 0) + (keyPasses ?? 0) * .25 + sum([tackles, interceptions]) * .08 : goals * 1.5 + assists + (xg ?? 0) * .6 + (xa ?? 0) * .5 + (dribbles ?? 0) * .08
    const values: NumericMap = {
      rating, minutes, goals, assists, goals90: per90(goals, minutes), assists90: per90(assists, minutes), xg90: per90(xg, minutes), xa90: per90(xa, minutes), keyPasses90: per90(keyPasses, minutes), defensive90: per90(sum([tackles, interceptions, recoveries]), minutes), aerial90: per90(aerial, minutes), dribbles90: per90(dribbles, minutes), saves90: per90(saves, minutes), cleanSheets90: per90(cleanSheets, minutes), goalsPrevented90: per90(goalsPrevented, minutes), errors90: per90(errors, minutes), passPct, ca, pa, potentialGap: ca !== undefined && pa !== undefined ? pa - ca : undefined, reputation, output90: per90(output, minutes), value: season?.marketValue, wage: season?.wageAnnual, valueEfficiency: season?.wageAnnual && rating ? rating / Math.log10(Math.max(10, season.wageAnnual)) : undefined, improvement: ca !== undefined && previousCA !== undefined ? ca - previousCA : undefined,
    }
    return {
      id: playerId, playerId, name: player?.name ?? playerId, subtitle: [season?.clubName, season?.position].filter(Boolean).join(' · '), group, age: season?.age, clubId: season?.clubId, clubName: season?.clubName, minutes, appearances, goals, assists, values,
      details: { club: season?.clubName, position: season?.position, age: season?.age, minutes, appearances, goals, assists, rating: rating ? round(rating, 2) : undefined },
      evidence: [`${appearances} jogos · ${minutes.toLocaleString('pt-PT')} minutos`, `${goals} golos · ${assists} assistências`, rating ? `Avaliação média ${round(rating, 2)}` : 'Avaliação média não disponível'],
    }
  }).filter((player) => player.minutes >= Math.max(1, options.minimumMinutes))
}

function playerAward(id: string, name: string, short: string, description: string, players: PlayerAggregate[], specs: MetricSpec[], eligibility: string, formulaOverride?: string): AwardResult {
  return award(id, name, short, description, 'players', 'player', rankCandidates('player', players, specs), formulaOverride ?? specs.map((spec) => `${spec.label} ${spec.weight}%`).join(' + '), eligibility)
}

interface ClubAggregate extends CandidateBase { clubId: string; standings: Standing[]; playerCount: number }
function buildClubs(data: AwardsEngineData, options: AwardsOptions, competitionIds: Set<string>, players: PlayerAggregate[]): ClubAggregate[] {
  const clubMap = new Map(data.clubs.map((club) => [club.id, club]))
  const standings = data.standings.filter((row) => row.seasonId === options.seasonId && competitionIds.has(row.competitionId) && row.entityId && !row.entityId.startsWith('country:'))
  const byClub = new Map<string, Standing[]>()
  for (const row of standings) { const list = byClub.get(row.entityId!) ?? []; list.push(row); byClub.set(row.entityId!, list) }
  const playersByClub = new Map<string, PlayerAggregate[]>()
  for (const player of players) if (player.clubId) { const list = playersByClub.get(player.clubId) ?? []; list.push(player); playersByClub.set(player.clubId, list) }
  const allIds = new Set([...byClub.keys(), ...playersByClub.keys()])
  return [...allIds].map((clubId) => {
    const club = clubMap.get(clubId)
    const rows = byClub.get(clubId) ?? []
    const squad = playersByClub.get(clubId) ?? []
    const played = sum(rows.map((row) => row.played))
    const wins = sum(rows.map((row) => row.wins))
    const goalsFor = sum(rows.map((row) => row.goalsFor)) || sum(squad.map((player) => player.goals))
    const goalsAgainst = sum(rows.map((row) => row.goalsAgainst))
    const stage = mean(rows.map((row) => stageValue(row, options.module)))
    const titles = rows.filter((row) => options.module === 'superleague' ? normalizeKey(row.info) === 'c' : row.position === 1 || normalizeKey(row.info) === 'c' || normalizeKey(row.stage) === 'winner').length
    const ages = squad.map((player) => player.age)
    const u21 = squad.filter((player) => (player.age ?? 99) <= 21).length
    const values: NumericMap = {
      performance: stage, winRate: percentage(wins, played), attack: played ? goalsFor / played : undefined, defense: played ? goalsAgainst / played : undefined, goalDifference: played ? (goalsFor - goalsAgainst) / played : undefined, titles,
      squadRating: mean(squad.map((player) => player.values.rating)), squadCA: mean(squad.map((player) => player.values.ca)), squadPA: mean(squad.map((player) => player.values.pa)), averageAge: mean(ages), youthShare: percentage(u21, squad.length), squadValue: sum(squad.map((player) => player.values.value)), playerOutput: mean(squad.map((player) => player.values.output90)),
    }
    return { id: clubId, clubId, name: club?.name ?? rows[0]?.entityName ?? clubId, subtitle: club?.country, standings: rows, playerCount: squad.length, values, details: { country: club?.country, competitions: rows.length, players: squad.length, wins, goalsFor, goalsAgainst, titles }, evidence: [`${rows.length} competições analisadas`, `${wins} vitórias · ${goalsFor}-${goalsAgainst} em golos`, `${squad.length} jogadores com dados elegíveis`] }
  })
}

function marketScopeTransfers(transfers: EnrichedTransfer[], seasonId: string, competitionIds: Set<string>): EnrichedTransfer[] {
  return transfers.filter((transfer) => transfer.seasonId === seasonId && ([...transfer.to.competitions, ...transfer.from.competitions].some((competition) => competitionIds.has(competition.id))))
}
function marketRowsByClub(transfers: EnrichedTransfer[]) { return new Map(computeEntityRows(transfers, 'club').map((row) => [row.id, row])) }
function addMarketValues(clubs: ClubAggregate[], rows: Map<string, MarketEntityRow>): ClubAggregate[] {
  return clubs.map((club) => {
    const market = rows.get(club.clubId)
    if (!market) return club
    const recruitment = mean([
      market.under21Share,
      market.averagePotentialGap !== undefined ? Math.max(0, market.averagePotentialGap * 4) : undefined,
      market.feeToValueRatio !== undefined ? Math.max(0, 100 - Math.abs(market.feeToValueRatio - .85) * 80) : undefined,
      market.averageBuyCA !== undefined ? market.averageBuyCA / 2 : undefined,
    ])
    return { ...club, values: { ...club.values, recruitment, trading: market.income - market.spend, marketEfficiency: market.feeToValueRatio !== undefined ? 1 / Math.max(.1, market.feeToValueRatio) : undefined, marketYouth: market.under21Share, marketPotential: market.averagePotentialGap, spend: market.spend, income: market.income }, details: { ...club.details, arrivals: market.arrivals, departures: market.departures, spend: market.spend, income: market.income }, evidence: [...club.evidence, market.arrivals ? `${market.arrivals} contratações · idade média ${market.averageBuyAge?.toFixed(1) ?? '—'}` : 'Sem contratações mapeadas'] }
  })
}

interface CoachAggregate extends CandidateBase { coachId: string }
function buildCoaches(data: AwardsEngineData, options: AwardsOptions, clubs: ClubAggregate[], marketTransfers: EnrichedTransfer[]): CoachAggregate[] {
  const coachMap = new Map(data.coaches.map((coach) => [coach.id, coach]))
  const clubMap = new Map(clubs.map((club) => [club.clubId, club]))
  const marketMap = new Map(computeEntityRows(marketTransfers, 'coach').map((row) => [row.id, row]))
  const assignments = data.coachSeasons.filter((row) => row.seasonId === options.seasonId && row.currentClubId && isHeadCoach(row.role))
  return assignments.map((assignment) => {
    const coach = coachMap.get(assignment.coachId)
    const club = clubMap.get(assignment.currentClubId!)
    const market = marketMap.get(assignment.coachId)
    return { id: assignment.coachId, coachId: assignment.coachId, name: coach?.name ?? assignment.coachId, subtitle: assignment.currentClubName ?? club?.name, values: { performance: club?.values.performance, dominance: club?.values.goalDifference, titles: club?.values.titles, squadRating: club?.values.squadRating, youthShare: club?.values.youthShare, recruitment: club?.values.recruitment ?? (market ? mean([market.under21Share, market.averagePotentialGap !== undefined ? market.averagePotentialGap * 4 : undefined, market.feeToValueRatio !== undefined ? 100 / Math.max(.5, market.feeToValueRatio) : undefined]) : undefined), development: mean([club?.values.youthShare, club?.values.squadPA, club?.values.playerOutput]), winRate: club?.values.winRate, squadCA: club?.values.squadCA, spend: club?.values.spend }, details: { club: assignment.currentClubName ?? club?.name, nationality: coach?.nationality, titles: club?.values.titles, winRate: club?.values.winRate }, evidence: club ? [`Associado a ${club.name} em ${data.seasons.find((season) => season.id === options.seasonId)?.label}`, `${club.details.wins ?? 0} vitórias · ${club.details.titles ?? 0} títulos`] : ['Treinador sem clube elegível no âmbito selecionado'] }
  }).filter((coach) => coach.values.performance !== undefined)
}

interface CompetitionAggregate extends CandidateBase { competitionId: string }
function buildCompetitions(data: AwardsEngineData, options: AwardsOptions, scoped: Competition[], players: PlayerAggregate[], marketTransfers: EnrichedTransfer[]): CompetitionAggregate[] {
  const statsByCompetition = new Map<string, PlayerCompetitionStats[]>()
  for (const row of data.playerStats.filter((row) => row.seasonId === options.seasonId)) { const list = statsByCompetition.get(row.competitionId) ?? []; list.push(row); statsByCompetition.set(row.competitionId, list) }
  const standingsByCompetition = new Map<string, Standing[]>()
  for (const row of data.standings.filter((row) => row.seasonId === options.seasonId)) { const list = standingsByCompetition.get(row.competitionId) ?? []; list.push(row); standingsByCompetition.set(row.competitionId, list) }
  const competitionMarket = new Map(computeEntityRows(marketTransfers, 'competition').map((row) => [row.id, row]))
  const playerMap = new Map(players.map((player) => [player.playerId, player]))
  return scoped.map((competition) => {
    const stats = statsByCompetition.get(competition.id) ?? []
    const standings = standingsByCompetition.get(competition.id) ?? []
    const uniquePlayers = [...new Set(stats.map((row) => row.playerId))].map((id) => playerMap.get(id)).filter((player): player is PlayerAggregate => Boolean(player))
    const leagueRows = standings.filter((row) => row.format === 'league')
    const totalMatches = leagueRows.length ? sum(leagueRows.map((row) => row.played)) / 2 : sum(stats.map((row) => row.appearances)) / 22
    const totalGoals = leagueRows.length ? sum(leagueRows.map((row) => row.goalsFor)) / 2 : sum(stats.map((row) => row.goals))
    const points = leagueRows.map((row) => row.points).filter((value): value is number => value !== undefined)
    const pointSpread = points.length > 1 ? Math.max(...points) - Math.min(...points) : undefined
    const market = competitionMarket.get(competition.id)
    const values: NumericMap = { reputation: competition.reputation, attack: totalMatches ? totalGoals / totalMatches : undefined, competitiveness: pointSpread !== undefined ? 1 / Math.max(1, pointSpread) : undefined, playerRating: mean(uniquePlayers.map((player) => player.values.rating)), averageCA: mean(uniquePlayers.map((player) => player.values.ca)), averagePA: mean(uniquePlayers.map((player) => player.values.pa)), youthShare: percentage(uniquePlayers.filter((player) => (player.age ?? 99) <= 21).length, uniquePlayers.length), averageAge: mean(uniquePlayers.map((player) => player.age)), marketValue: sum(uniquePlayers.map((player) => player.values.value)), marketActivity: market?.transfers, marketVolume: (market?.spend ?? 0) + (market?.income ?? 0), potentialGap: mean(uniquePlayers.map((player) => player.values.potentialGap)) }
    return { id: competition.id, competitionId: competition.id, name: competition.name, subtitle: [competition.country, competition.type].filter(Boolean).join(' · '), values, details: { country: competition.country, continent: competition.continent, players: uniquePlayers.length, clubs: standings.length, goalsPerMatch: values.attack, reputation: competition.reputation }, evidence: [`${uniquePlayers.length} jogadores analisados`, `${standings.length} participantes/classificações`, market ? `${market.transfers} movimentos de mercado associados` : 'Sem movimentos de mercado associados'] }
  })
}

function directRank(kind: AwardEntityKind, candidates: CandidateBase[], key: string, label: string, direction: 'higher' | 'lower' = 'higher', format?: AwardComponent['format']) {
  return rankCandidates(kind, candidates, [{ key, label, weight: 100, direction, format }])
}

export function computeAwards(data: AwardsEngineData, options: AwardsOptions): AwardsBundle {
  const season = data.seasons.find((item) => item.id === options.seasonId)
  const scopedCompetitions = data.competitions.filter((competition) => moduleMatches(competition, options.module) && (!options.competitionId || competition.id === options.competitionId))
  const competitionIds = new Set(scopedCompetitions.map((competition) => competition.id))
  const players = buildPlayers(data, options, competitionIds)
  const scopedTransfers = marketScopeTransfers(data.transfers, options.seasonId, competitionIds)
  const clubs = addMarketValues(buildClubs(data, options, competitionIds, players), marketRowsByClub(scopedTransfers))
  const coaches = buildCoaches(data, options, clubs, scopedTransfers)
  const competitions = buildCompetitions(data, options, scopedCompetitions, players, scopedTransfers)
  const playerById = new Map(players.map((player) => [player.playerId, player]))
  const playerByName = new Map(players.map((player) => [normalizeKey(player.name), player]))
  const signingCandidates: CandidateBase[] = scopedTransfers.filter((transfer) => transfer.to.club).map((transfer) => {
    const player = transfer.snapshot.player?.id ? playerById.get(transfer.snapshot.player.id) : playerByName.get(normalizeKey(transfer.playerName))
    return { id: transfer.snapshot.player?.id ?? player?.playerId, name: transfer.playerName, subtitle: `para ${transfer.to.club?.name ?? transfer.toClubName ?? 'clube desconhecido'}`, values: { rating: player?.values.rating, output90: player?.values.output90, ca: transfer.snapshot.currentAbility ?? player?.values.ca, potentialGap: transfer.potentialGap ?? player?.values.potentialGap, feeToValue: transfer.feeToMarketValue, fee: transfer.feeKnown ? transfer.effectiveFee : undefined, bargain: transfer.feeToMarketValue !== undefined ? 1 / Math.max(.05, transfer.feeToMarketValue) : undefined }, details: { club: transfer.to.club?.name ?? transfer.toClubName, fee: transfer.feeKnown ? transfer.effectiveFee : undefined, marketValue: transfer.snapshot.marketValue, age: transfer.snapshot.age, ca: transfer.snapshot.currentAbility, pa: transfer.snapshot.potentialAbility }, evidence: [transfer.feeKnown ? `Transferência por ${transfer.effectiveFee.toLocaleString('pt-PT')} €` : 'Valor não divulgado', transfer.snapshot.age !== undefined ? `${transfer.snapshot.age} anos` : 'Idade não disponível', player?.values.rating ? `Avaliação na época ${round(player.values.rating, 2)}` : 'Rendimento pós-transferência não disponível'] }
  })
  const saleCandidates: CandidateBase[] = scopedTransfers.filter((transfer) => transfer.from.club && transfer.feeKnown).map((transfer) => ({ id: transfer.snapshot.player?.id, name: transfer.playerName, subtitle: `vendido por ${transfer.from.club?.name ?? transfer.fromClubName ?? 'clube desconhecido'}`, values: { fee: transfer.effectiveFee, premium: transfer.feeToMarketValue, age: transfer.snapshot.age, ca: transfer.snapshot.currentAbility }, details: { club: transfer.from.club?.name ?? transfer.fromClubName, fee: transfer.effectiveFee, marketValue: transfer.snapshot.marketValue, age: transfer.snapshot.age }, evidence: [`Venda por ${transfer.effectiveFee.toLocaleString('pt-PT')} €`, transfer.feeToMarketValue !== undefined ? `${round(transfer.feeToMarketValue * 100)}% do valor de mercado` : 'Relação com valor de mercado indisponível'] }))
  const eligible = (predicate: (player: PlayerAggregate) => boolean) => players.filter(predicate)
  const overallSpecs: MetricSpec[] = [{ key: 'rating', label: 'Avaliação média', weight: 35 }, { key: 'output90', label: 'Produção ajustada à posição', weight: 30 }, { key: 'minutes', label: 'Utilização', weight: 15 }, { key: 'ca', label: 'Qualidade atual', weight: 10 }, { key: 'reputation', label: 'Reputação', weight: 10 }]
  const awards: AwardResult[] = [
    playerAward('player-of-year', 'Jogador do Ano', 'Jogador do Ano', 'Melhor rendimento global no âmbito competitivo selecionado.', players, overallSpecs, `Mínimo de ${options.minimumMinutes} minutos.`),
    playerAward('young-player', 'Jovem do Ano', 'Jovem do Ano', 'Melhor jogador com 21 anos ou menos.', eligible((player) => (player.age ?? 99) <= 21), [{ key: 'rating', label: 'Avaliação', weight: 30 }, { key: 'output90', label: 'Produção', weight: 25 }, { key: 'minutes', label: 'Utilização', weight: 15 }, { key: 'potentialGap', label: 'Margem de potencial', weight: 20 }, { key: 'pa', label: 'C.P.', weight: 10 }], `21 anos ou menos e mínimo de ${options.minimumMinutes} minutos.`),
    playerAward('veteran-player', 'Veterano do Ano', 'Veterano do Ano', 'Melhor rendimento entre jogadores com 30 ou mais anos.', eligible((player) => (player.age ?? 0) >= 30), overallSpecs, `30 anos ou mais e mínimo de ${options.minimumMinutes} minutos.`),
    playerAward('goalkeeper', 'Guarda-Redes do Ano', 'Melhor GR', 'Guarda-redes mais determinante da época.', eligible((player) => player.group === 'Guarda-redes'), [{ key: 'rating', label: 'Avaliação', weight: 35 }, { key: 'saves90', label: 'Defesas por 90', weight: 25 }, { key: 'goalsPrevented90', label: 'Golos evitados por 90', weight: 20 }, { key: 'cleanSheets90', label: 'Clean sheets por 90', weight: 15 }, { key: 'errors90', label: 'Erros por 90', weight: 5, direction: 'lower' }], `Guarda-redes com mínimo de ${options.minimumMinutes} minutos.`),
    playerAward('defender', 'Defesa do Ano', 'Melhor Defesa', 'Defesa com maior impacto defensivo e consistência.', eligible((player) => player.group === 'Defesas'), [{ key: 'rating', label: 'Avaliação', weight: 35 }, { key: 'defensive90', label: 'Ações defensivas por 90', weight: 25 }, { key: 'aerial90', label: 'Duelos aéreos por 90', weight: 15 }, { key: 'passPct', label: 'Precisão de passe', weight: 10 }, { key: 'minutes', label: 'Utilização', weight: 15 }], `Defesas com mínimo de ${options.minimumMinutes} minutos.`),
    playerAward('midfielder', 'Médio do Ano', 'Melhor Médio', 'Médio mais completo entre criação, produção e trabalho defensivo.', eligible((player) => player.group === 'Médios'), [{ key: 'rating', label: 'Avaliação', weight: 30 }, { key: 'xa90', label: 'xA por 90', weight: 20 }, { key: 'keyPasses90', label: 'Passes-chave por 90', weight: 15 }, { key: 'defensive90', label: 'Ações defensivas por 90', weight: 15 }, { key: 'assists90', label: 'Assistências por 90', weight: 10 }, { key: 'minutes', label: 'Utilização', weight: 10 }], `Médios com mínimo de ${options.minimumMinutes} minutos.`),
    playerAward('winger', 'Extremo do Ano', 'Melhor Extremo', 'Extremo mais produtivo e desequilibrador.', eligible((player) => player.group === 'Extremos'), [{ key: 'rating', label: 'Avaliação', weight: 25 }, { key: 'goals90', label: 'Golos por 90', weight: 20 }, { key: 'assists90', label: 'Assistências por 90', weight: 20 }, { key: 'dribbles90', label: 'Dribles por 90', weight: 15 }, { key: 'xa90', label: 'xA por 90', weight: 10 }, { key: 'minutes', label: 'Utilização', weight: 10 }], `Extremos com mínimo de ${options.minimumMinutes} minutos.`),
    playerAward('forward', 'Avançado do Ano', 'Melhor Avançado', 'Avançado com maior impacto goleador e ofensivo.', eligible((player) => player.group === 'Avançados'), [{ key: 'rating', label: 'Avaliação', weight: 25 }, { key: 'goals90', label: 'Golos por 90', weight: 30 }, { key: 'xg90', label: 'xG por 90', weight: 20 }, { key: 'assists90', label: 'Assistências por 90', weight: 10 }, { key: 'output90', label: 'Produção total', weight: 10 }, { key: 'minutes', label: 'Utilização', weight: 5 }], `Avançados com mínimo de ${options.minimumMinutes} minutos.`),
    award('top-scorer', 'Melhor Marcador', 'Melhor Marcador', 'Jogador com mais golos, valorizando eficiência em caso de proximidade.', 'players', 'player', rankCandidates('player', players, [{ key: 'goals', label: 'Golos', weight: 85 }, { key: 'goals90', label: 'Golos por 90', weight: 15 }]), 'Golos 85% + golos por 90 15%', `Mínimo de ${options.minimumMinutes} minutos.`),
    award('top-assistant', 'Melhor Assistente', 'Melhor Assistente', 'Jogador com maior produção de assistências e criação.', 'players', 'player', rankCandidates('player', players, [{ key: 'assists', label: 'Assistências', weight: 75 }, { key: 'assists90', label: 'Assistências por 90', weight: 15 }, { key: 'xa90', label: 'xA por 90', weight: 10 }]), 'Assistências 75% + por 90 15% + xA 10%', `Mínimo de ${options.minimumMinutes} minutos.`),
    playerAward('creator', 'Criador do Ano', 'Criador do Ano', 'Jogador mais influente na criação de ocasiões.', players, [{ key: 'xa90', label: 'xA por 90', weight: 35 }, { key: 'keyPasses90', label: 'Passes-chave por 90', weight: 30 }, { key: 'assists90', label: 'Assistências por 90', weight: 20 }, { key: 'rating', label: 'Avaliação', weight: 15 }], `Mínimo de ${options.minimumMinutes} minutos.`),
    playerAward('ball-winner', 'Recuperador do Ano', 'Recuperador do Ano', 'Jogador com maior impacto na recuperação e interrupção do jogo adversário.', players.filter((player) => player.group !== 'Guarda-redes'), [{ key: 'defensive90', label: 'Ações defensivas por 90', weight: 55 }, { key: 'rating', label: 'Avaliação', weight: 25 }, { key: 'aerial90', label: 'Duelos aéreos por 90', weight: 10 }, { key: 'minutes', label: 'Utilização', weight: 10 }], `Jogadores de campo com mínimo de ${options.minimumMinutes} minutos.`),
    playerAward('breakthrough', 'Revelação do Ano', 'Revelação', 'Jovem que transformou potencial em produção competitiva relevante.', eligible((player) => (player.age ?? 99) <= 23), [{ key: 'output90', label: 'Produção', weight: 25 }, { key: 'rating', label: 'Avaliação', weight: 25 }, { key: 'minutes', label: 'Minutos', weight: 20 }, { key: 'potentialGap', label: 'Margem de potencial', weight: 15 }, { key: 'improvement', label: 'Evolução de C.A.', weight: 15 }], `Até 23 anos e mínimo de ${options.minimumMinutes} minutos.`),
    playerAward('most-improved', 'Jogador que Mais Evoluiu', 'Maior Evolução', 'Maior progressão de capacidade atual sem perder rendimento competitivo.', players.filter((player) => player.values.improvement !== undefined), [{ key: 'improvement', label: 'Evolução de C.A.', weight: 60 }, { key: 'rating', label: 'Avaliação', weight: 25 }, { key: 'minutes', label: 'Utilização', weight: 15 }], 'Exige C.A. na época atual e anterior.', 'Evolução de C.A. 60% + avaliação 25% + utilização 15%'),
    playerAward('value-player', 'Melhor Relação Qualidade/Salário', 'Qualidade/Salário', 'Maior rendimento relativo ao salário anual conhecido.', players.filter((player) => player.values.wage !== undefined), [{ key: 'valueEfficiency', label: 'Rendimento por salário', weight: 70 }, { key: 'rating', label: 'Avaliação', weight: 20 }, { key: 'minutes', label: 'Utilização', weight: 10 }], `Salário conhecido e mínimo de ${options.minimumMinutes} minutos.`, 'Eficiência salarial 70% + avaliação 20% + utilização 10%'),
    award('signing-of-year', 'Contratação do Ano', 'Contratação do Ano', 'Reforço que melhor combinou rendimento imediato, qualidade, potencial e custo.', 'market', 'player', rankCandidates('player', signingCandidates, [{ key: 'rating', label: 'Avaliação após contratação', weight: 30 }, { key: 'output90', label: 'Produção por 90', weight: 25 }, { key: 'ca', label: 'C.A.', weight: 15 }, { key: 'potentialGap', label: 'Margem de potencial', weight: 15 }, { key: 'bargain', label: 'Preço face ao valor', weight: 15 }]), 'Avaliação 30% + produção 25% + C.A. 15% + potencial 15% + preço/valor 15%', 'Transferência de entrada associada a jogador e clube.'),
    award('bargain-of-year', 'Pechincha do Ano', 'Pechincha do Ano', 'Contratação com melhor relação entre preço, rendimento e valor de mercado.', 'market', 'player', rankCandidates('player', signingCandidates.filter((candidate) => candidate.values.bargain !== undefined), [{ key: 'bargain', label: 'Preço abaixo do valor', weight: 50 }, { key: 'rating', label: 'Avaliação', weight: 25 }, { key: 'output90', label: 'Produção', weight: 15 }, { key: 'ca', label: 'C.A.', weight: 10 }]), 'Preço/valor 50% + avaliação 25% + produção 15% + C.A. 10%', 'Exige valor da transferência e valor de mercado.'),
    award('sale-of-year', 'Venda do Ano', 'Venda do Ano', 'Negócio de saída com maior valor e prémio sobre a avaliação de mercado.', 'market', 'player', rankCandidates('player', saleCandidates, [{ key: 'fee', label: 'Valor da venda', weight: 65, format: 'money' }, { key: 'premium', label: 'Prémio sobre valor de mercado', weight: 25 }, { key: 'age', label: 'Idade no negócio', weight: 10, direction: 'higher' }]), 'Valor 65% + prémio de mercado 25% + idade 10%', 'Exige transferência de saída com valor conhecido.'),
    award('club-of-year', 'Clube do Ano', 'Clube do Ano', 'Melhor desempenho coletivo no conjunto das competições selecionadas.', 'clubs', 'club', rankCandidates('club', clubs, [{ key: 'performance', label: 'Resultados competitivos', weight: 45 }, { key: 'winRate', label: 'Percentagem de vitórias', weight: 20 }, { key: 'goalDifference', label: 'Diferença de golos por jogo', weight: 15 }, { key: 'titles', label: 'Títulos', weight: 15 }, { key: 'squadRating', label: 'Avaliação do plantel', weight: 5 }]), 'Resultados 45% + vitórias 20% + diferença de golos 15% + títulos 15% + avaliação 5%', 'Clubes com classificações ou jogadores no âmbito selecionado.'),
    award('best-attack', 'Melhor Ataque', 'Melhor Ataque', 'Clube com maior produção ofensiva por jogo.', 'clubs', 'club', directRank('club', clubs, 'attack', 'Golos por jogo'), 'Golos marcados por jogo', 'Exige golos e jogos nas classificações.'),
    award('best-defense', 'Melhor Defesa', 'Melhor Defesa', 'Clube que menos golos sofreu por jogo.', 'clubs', 'club', directRank('club', clubs.filter((club) => (club.values.defense ?? 0) >= 0), 'defense', 'Golos sofridos por jogo', 'lower'), 'Menor média de golos sofridos por jogo', 'Exige golos sofridos e jogos nas classificações.'),
    award('dominant-club', 'Clube Mais Dominante', 'Mais Dominante', 'Maior combinação de vitórias e superioridade no marcador.', 'clubs', 'club', rankCandidates('club', clubs, [{ key: 'winRate', label: 'Vitórias', weight: 45 }, { key: 'goalDifference', label: 'Diferença de golos', weight: 40 }, { key: 'performance', label: 'Resultado competitivo', weight: 15 }]), 'Vitórias 45% + diferença de golos 40% + resultado 15%', 'Clubes com classificações completas.'),
    award('best-squad', 'Melhor Plantel', 'Melhor Plantel', 'Plantel com maior qualidade média e profundidade estatística.', 'clubs', 'club', rankCandidates('club', clubs, [{ key: 'squadCA', label: 'C.A. média', weight: 45 }, { key: 'squadPA', label: 'C.P. média', weight: 20 }, { key: 'squadRating', label: 'Avaliação média', weight: 20 }, { key: 'playerOutput', label: 'Produção média', weight: 15 }]), 'C.A. 45% + C.P. 20% + avaliação 20% + produção 15%', 'Exige perfis e estatísticas dos jogadores.'),
    award('youth-policy', 'Melhor Política de Juventude', 'Política Jovem', 'Clube que melhor combina utilização de jovens e potencial do plantel.', 'clubs', 'club', rankCandidates('club', clubs, [{ key: 'youthShare', label: 'Percentagem Sub-21', weight: 55 }, { key: 'squadPA', label: 'C.P. média', weight: 25 }, { key: 'performance', label: 'Resultados', weight: 20 }]), 'Sub-21 55% + C.P. 25% + resultados 20%', 'Exige idades e perfis de plantel.'),
    award('surprise-club', 'Clube Surpresa do Ano', 'Clube Surpresa', 'Clube que alcançou resultados elevados com um plantel de menor valor e qualidade relativa.', 'clubs', 'club', rankCandidates('club', clubs, [{ key: 'performance', label: 'Resultados', weight: 55 }, { key: 'squadValue', label: 'Valor do plantel', weight: 25, direction: 'lower', format: 'money' }, { key: 'squadCA', label: 'C.A. média', weight: 20, direction: 'lower' }]), 'Resultados 55% + menor valor 25% + menor C.A. 20%', 'Exige resultados e valor/C.A. do plantel.'),
    award('recruitment-policy', 'Melhor Política de Contratações', 'Melhor Recrutamento', 'Clube que melhor equilibra juventude, potencial, qualidade e preço pago.', 'market', 'club', rankCandidates('club', clubs.filter((club) => club.values.recruitment !== undefined), [{ key: 'recruitment', label: 'Índice de recrutamento', weight: 55 }, { key: 'marketEfficiency', label: 'Preço/valor', weight: 20 }, { key: 'marketPotential', label: 'Margem C.P.-C.A.', weight: 15 }, { key: 'marketYouth', label: 'Contratações jovens', weight: 10 }]), 'Índice de recrutamento 55% + eficiência 20% + potencial 15% + juventude 10%', 'Exige transferências de entrada e perfis dos jogadores.'),
    award('trading-club', 'Melhor Trading', 'Melhor Trading', 'Clube com maior retorno comercial líquido no mercado.', 'market', 'club', rankCandidates('club', clubs.filter((club) => club.values.trading !== undefined), [{ key: 'trading', label: 'Receita menos investimento', weight: 75 }, { key: 'income', label: 'Receita de vendas', weight: 25 }]), 'Saldo comercial 75% + receita 25%', 'Exige valores de transferências conhecidos.'),
    award('coach-of-year', 'Treinador do Ano', 'Treinador do Ano', 'Treinador associado ao melhor desempenho competitivo da época.', 'coaches', 'coach', rankCandidates('coach', coaches, [{ key: 'performance', label: 'Resultados do clube', weight: 50 }, { key: 'winRate', label: 'Percentagem de vitórias', weight: 20 }, { key: 'dominance', label: 'Domínio', weight: 15 }, { key: 'titles', label: 'Títulos', weight: 15 }]), 'Resultados 50% + vitórias 20% + domínio 15% + títulos 15%', 'Atribuição por clube e época; requer treinador principal identificado.'),
    award('development-coach', 'Treinador de Desenvolvimento do Ano', 'Desenvolvimento', 'Treinador associado ao melhor contexto de crescimento e utilização de talento.', 'coaches', 'coach', rankCandidates('coach', coaches, [{ key: 'development', label: 'Desenvolvimento do plantel', weight: 55 }, { key: 'youthShare', label: 'Utilização jovem', weight: 25 }, { key: 'performance', label: 'Resultados', weight: 20 }]), 'Desenvolvimento 55% + jovens 25% + resultados 20%', 'Exige treinador, plantel e idades na mesma época.'),
    award('recruitment-coach', 'Treinador com Melhor Recrutamento', 'Recrutamento do Treinador', 'Treinador associado à política de mercado mais eficiente.', 'coaches', 'coach', rankCandidates('coach', coaches.filter((coach) => coach.values.recruitment !== undefined), [{ key: 'recruitment', label: 'Qualidade do recrutamento', weight: 70 }, { key: 'performance', label: 'Resultados', weight: 30 }]), 'Recrutamento 70% + resultados 30%', 'Atribuição por clube e época, não pela data exata de cada negócio.'),
    award('resourceful-coach', 'Melhor Trabalho com Recursos Limitados', 'Recursos Limitados', 'Treinador que produziu resultados elevados com menor qualidade de plantel e investimento.', 'coaches', 'coach', rankCandidates('coach', coaches, [{ key: 'performance', label: 'Resultados', weight: 60 }, { key: 'squadCA', label: 'C.A. do plantel', weight: 25, direction: 'lower' }, { key: 'spend', label: 'Investimento', weight: 15, direction: 'lower', format: 'money' }]), 'Resultados 60% + menor C.A. 25% + menor investimento 15%', 'Exige treinador, resultados, plantel e mercado.'),
  ]
  if (competitions.length >= 2) {
    awards.push(
      award('competition-of-year', 'Competição do Ano', 'Competição do Ano', 'Competição com maior combinação de qualidade, reputação, mercado e rendimento.', 'competitions', 'competition', rankCandidates('competition', competitions, [{ key: 'reputation', label: 'Reputação', weight: 25 }, { key: 'averageCA', label: 'C.A. média', weight: 25 }, { key: 'playerRating', label: 'Avaliação dos jogadores', weight: 15 }, { key: 'marketVolume', label: 'Volume de mercado', weight: 15 }, { key: 'competitiveness', label: 'Equilíbrio', weight: 10 }, { key: 'attack', label: 'Golos por jogo', weight: 10 }]), 'Reputação 25% + C.A. 25% + avaliação 15% + mercado 15% + equilíbrio 10% + ataque 10%', 'Mínimo de duas competições comparáveis.'),
      award('most-competitive', 'Competição Mais Equilibrada', 'Mais Equilibrada', 'Competição com menor distância competitiva entre participantes.', 'competitions', 'competition', directRank('competition', competitions, 'competitiveness', 'Equilíbrio competitivo'), 'Inverso da dispersão pontual', 'Exige classificações de liga com pontos.'),
      award('most-attacking', 'Competição Mais Ofensiva', 'Mais Ofensiva', 'Competição com maior média de golos por jogo.', 'competitions', 'competition', directRank('competition', competitions, 'attack', 'Golos por jogo'), 'Golos totais divididos por jogos', 'Exige golos e jogos.'),
      award('talent-factory', 'Melhor Vitrine de Talento', 'Vitrine de Talento', 'Competição que combina juventude, potencial e margem de desenvolvimento.', 'competitions', 'competition', rankCandidates('competition', competitions, [{ key: 'youthShare', label: 'Jogadores Sub-21', weight: 40 }, { key: 'averagePA', label: 'C.P. média', weight: 35 }, { key: 'potentialGap', label: 'Margem de potencial', weight: 25 }]), 'Sub-21 40% + C.P. 35% + margem 25%', 'Exige idades, C.P. e C.A. dos jogadores.'),
      award('market-competition', 'Mercado Mais Poderoso', 'Mercado Mais Poderoso', 'Competição com maior volume de investimento e circulação de talento.', 'market', 'competition', rankCandidates('competition', competitions, [{ key: 'marketVolume', label: 'Volume financeiro', weight: 70 }, { key: 'marketActivity', label: 'Número de movimentos', weight: 30 }]), 'Volume 70% + movimentos 30%', 'Exige transferências associadas às competições.'),
    )
  }
  const awarded = awards.filter((item) => item.status === 'awarded')
  const warnings: string[] = []
  if (!scopedCompetitions.length) warnings.push('Não existem competições no âmbito selecionado.')
  if (!players.length) warnings.push(`Nenhum jogador atingiu o mínimo de ${options.minimumMinutes} minutos.`)
  if (!scopedTransfers.length) warnings.push('Não existem transferências associadas ao âmbito; prémios de mercado podem ficar sem vencedor.')
  if (!coaches.length) warnings.push('Não foram encontrados treinadores principais associados aos clubes elegíveis.')
  return {
    season,
    seasons: data.seasons,
    competitions: data.competitions,
    scopedCompetitions,
    awards,
    summary: { awarded: awarded.length, total: awards.length, averageCoverage: round(mean(awarded.map((item) => item.winner?.coverage)) ?? 0), highConfidence: awarded.filter((item) => item.winner?.confidence === 'alta').length, entitiesAnalyzed: players.length + clubs.length + coaches.length + competitions.length },
    warnings,
  }
}
