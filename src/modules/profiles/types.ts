import type { EnrichedTransfer, MarketInsight, MarketSummary, MarketTrendRow, PositionMarketRow } from '../market/types'

export type ProfileKind = 'competition' | 'club' | 'player' | 'coach'
export type ProfileTab = 'overview' | 'market' | 'history' | 'hall' | 'style' | 'evolution'

export interface ProfileOption { id: string; name: string; subtitle?: string }
export interface ProfileKpi { label: string; value: string | number; detail: string }
export interface ProfileFact { label: string; value: string }

export interface ProfileMarketSeason {
  seasonId: string
  season: string
  arrivals: number
  departures: number
  spend: number
  income: number
  balance: number
  averageBuyAge?: number
  under21Share?: number
  averageBuyCA?: number
  averageBuyPA?: number
}
export interface ProfileMarket {
  summary: MarketSummary
  narrative: string
  transfers: EnrichedTransfer[]
  trends: MarketTrendRow[]
  positions: PositionMarketRow[]
  insights: MarketInsight[]
  seasons: ProfileMarketSeason[]
}

export interface ProfileHistoryRow {
  id: string
  season: string
  competition: string
  champion: string
  coach?: string
  runnerUp?: string
  detail?: string
  wonByEntity?: boolean
}
export interface ProfileAchievement {
  id: string
  season: string
  competition: string
  achievement: string
  coach?: string
  detail?: string
}

export interface PlayerRecordRow {
  id: string
  name: string
  nationality?: string
  seasons: number
  appearances: number
  minutes: number
  goals: number
  assists: number
  goalsPer90: number
  assistsPer90: number
  averageRating?: number
}
export interface ClubRecordRow {
  id: string
  name: string
  seasons: number
  titles: number
  promotions: number
  played: number
  wins: number
  goalsFor: number
  goalsAgainst: number
  points: number
}
export interface CoachRecordRow {
  id: string
  name: string
  seasons: number
  titles: number
  clubs: string[]
  averageWinRate?: number
}
export interface CompetitionRecordRow {
  id: string
  name: string
  seasons: number
  titles: number
  bestPosition?: number
  points: number
  goalsFor: number
}
export interface ProfileHallOfFame {
  players: PlayerRecordRow[]
  clubs: ClubRecordRow[]
  coaches: CoachRecordRow[]
  competitions: CompetitionRecordRow[]
}

export interface StyleFeatureDetail {
  label: string
  value?: number
  baseline?: number
  index?: number
  coverage: number
  source: 'metric' | 'attribute' | 'derived'
}
export interface StyleDimension {
  id: string
  label: string
  score?: number
  coverage: number
  interpretation: string
  details: StyleFeatureDetail[]
}
export interface ProfileStyle {
  dimensions: StyleDimension[]
  identity: string
  strengths: string[]
  limitations: string[]
  samplePlayers: number
  sampleRows: number
}

export interface EvolutionPoint { seasonId: string; season: string; value?: number }
export interface EvolutionSeries {
  id: string
  label: string
  unit: 'number' | 'money' | 'percent' | 'rating'
  points: EvolutionPoint[]
  description: string
}

export interface EntityProfile {
  kind: ProfileKind
  id: string
  name: string
  subtitle: string
  badge?: string
  facts: ProfileFact[]
  kpis: ProfileKpi[]
  market: ProfileMarket
  history: ProfileHistoryRow[]
  achievements: ProfileAchievement[]
  hall: ProfileHallOfFame
  style?: ProfileStyle
  evolution: EvolutionSeries[]
  dataWarnings: string[]
}
