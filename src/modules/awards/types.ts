import type { Competition, Season } from '../../shared/types/entities'

export type AwardEntityKind = 'player' | 'club' | 'coach' | 'competition'
export type AwardGroup = 'players' | 'clubs' | 'coaches' | 'competitions' | 'market'
export type AwardModule = 'all' | 'superleague' | 'national' | 'continental' | 'international'
export type AwardConfidence = 'alta' | 'moderada' | 'baixa'

export interface AwardComponent {
  label: string
  raw?: number
  normalized?: number
  weight: number
  contribution: number
  available: boolean
  direction?: 'higher' | 'lower'
  format?: 'number' | 'percent' | 'money' | 'score'
}

export interface AwardCandidate {
  entityId?: string
  name: string
  kind: AwardEntityKind
  score: number
  confidence: AwardConfidence
  coverage: number
  subtitle?: string
  details: Record<string, string | number | undefined>
  components: AwardComponent[]
  evidence: string[]
}

export interface AwardResult {
  id: string
  name: string
  shortName: string
  description: string
  group: AwardGroup
  subject: AwardEntityKind
  winner?: AwardCandidate
  podium: AwardCandidate[]
  formula: string
  eligibility: string
  sample: number
  status: 'awarded' | 'insufficient-data'
}

export interface AwardsOptions {
  seasonId: string
  module: AwardModule
  competitionId?: string
  minimumMinutes: number
}

export interface AwardsSummary {
  awarded: number
  total: number
  averageCoverage: number
  highConfidence: number
  entitiesAnalyzed: number
}

export interface AwardsBundle {
  season?: Season
  seasons: Season[]
  competitions: Competition[]
  scopedCompetitions: Competition[]
  awards: AwardResult[]
  summary: AwardsSummary
  warnings: string[]
}

export interface AwardHistoryRow {
  seasonId: string
  season: string
  awardId: string
  awardName: string
  winner?: AwardCandidate
  status: AwardResult['status']
}
