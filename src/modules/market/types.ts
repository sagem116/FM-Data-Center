import type { Club, Coach, Competition, Player, PlayerSeason, Season, Transfer } from '../../shared/types/entities'

export type MarketTab = 'overview' | 'transfers' | 'clubs' | 'competitions' | 'coaches' | 'positions' | 'players' | 'flows' | 'insights'
export type PositionGroup = 'Guarda-redes' | 'Defesas' | 'Médios' | 'Extremos' | 'Avançados' | 'Desconhecida'
export type AgeBand = 'all' | 'u21' | '21-25' | '26-30' | '31+'
export type MarketDirection = 'all' | 'arrivals' | 'departures'

export interface MarketFilters {
  seasonFrom: string
  seasonTo: string
  continent: string
  country: string
  competitionId: string
  clubId: string
  coachId: string
  position: PositionGroup | ''
  ageBand: AgeBand
  direction: MarketDirection
  minFee: number | null
  maxFee: number | null
  query: string
}

export interface MarketPlayerSnapshot {
  player?: Player
  season?: PlayerSeason
  age?: number
  nationality?: string
  position?: string
  positionGroup: PositionGroup
  marketValue?: number
  wageAnnual?: number
  currentAbility?: number
  potentialAbility?: number
  reputation?: number
  height?: number
  weight?: number
}

export interface ClubContext {
  club?: Club
  competitions: Competition[]
  primaryCompetition?: Competition
  coaches: Coach[]
}

export interface EnrichedTransfer extends Transfer {
  season?: Season
  snapshot: MarketPlayerSnapshot
  from: ClubContext
  to: ClubContext
  effectiveFee: number
  feeKnown: boolean
  feeToMarketValue?: number
  potentialGap?: number
  domestic: boolean | null
  sameCompetition: boolean | null
  linkedPlayer: boolean
}

export interface MarketDataBundle {
  seasons: Season[]
  clubs: Club[]
  competitions: Competition[]
  coaches: Coach[]
  transfers: EnrichedTransfer[]
}

export interface MarketSummary {
  transfers: number
  knownFees: number
  totalValue: number
  averageFee: number
  medianFee: number
  maxFee: number
  averageAge?: number
  under21Share?: number
  averageCA?: number
  averagePA?: number
  averagePotentialGap?: number
  averageWage?: number
  averageMarketValue?: number
  freeShare: number
  loanShare: number
  playerCoverage: number
  profileCoverage: number
}

export interface MarketEntityRow {
  id: string
  name: string
  kind: 'club' | 'competition' | 'coach'
  country?: string
  continent?: string
  competitionType?: Competition['type']
  transfers: number
  arrivals: number
  departures: number
  spend: number
  income: number
  netSpend: number
  averageBuyFee: number
  averageSaleFee: number
  medianBuyFee: number
  maxBuyFee: number
  averageBuyAge?: number
  averageSaleAge?: number
  under21Share?: number
  over30Share?: number
  averageBuyCA?: number
  averageBuyPA?: number
  averagePotentialGap?: number
  averageBuyReputation?: number
  averageBuyMarketValue?: number
  averageBuyWage?: number
  feeToValueRatio?: number
  foreignShare?: number
  internalShare?: number
  freeShare?: number
  loanShare?: number
  profileCoverage: number
  coachAttributionCoverage?: number
  topPosition?: string
  topSource?: string
  topDestination?: string
  summary: string
}

export interface PositionMarketRow {
  position: PositionGroup
  transfers: number
  totalValue: number
  averageFee: number
  medianFee: number
  share: number
  averageAge?: number
  averageCA?: number
  averagePA?: number
  averagePotentialGap?: number
  averageWage?: number
  averageMarketValue?: number
  feeToValueRatio?: number
}

export interface PlayerMarketRow {
  id: string
  name: string
  nationality?: string
  position: PositionGroup
  moves: number
  totalFees: number
  maxFee: number
  latestAge?: number
  latestCA?: number
  latestPA?: number
  latestMarketValue?: number
  latestWage?: number
  clubs: string[]
  estimatedTradingProfit?: number
  profitSample: number
}

export interface MarketFlowRow {
  id: string
  from: string
  to: string
  level: 'club' | 'country' | 'continent'
  transfers: number
  totalValue: number
  averageFee: number
  averageAge?: number
  averageCA?: number
}

export interface MarketTrendRow {
  seasonId: string
  season: string
  transfers: number
  totalValue: number
  averageFee: number
  medianFee: number
  averageAge?: number
  averageCA?: number
  averagePA?: number
  under21Share?: number
  foreignShare?: number
}

export interface MarketCorrelation {
  id: string
  label: string
  value: number | null
  sample: number
  interpretation: string
}

export interface MarketInsight {
  id: string
  title: string
  text: string
  confidence: 'alta' | 'moderada' | 'baixa'
  evidence: string
}

export interface MarketCoverageIssue {
  key: string
  label: string
  available: number
  total: number
  coverage: number
  severity: 'ok' | 'warning' | 'error'
  guidance: string
}
