import type { AnalyticsBundle } from './analytics-service'
import { computeRankings, type RankingEntry } from '../../rankings/engine/ranking-engine'
import { loadRankingConfig } from '../../rankings/config/ranking-config-store'
import type { RankingEntity, RankingMode, RankingModule } from '../../rankings/config/default-ranking-config'
import { loadActiveChallenges } from '../../challenges/challenges'

export interface HistoricalRankingSeason {
  seasonId: string
  season: string
  startYear: number
  endYear: number
  entries: RankingEntry[]
}

export function buildHistoricalRankings(
  data: AnalyticsBundle,
  entity: RankingEntity,
  module: RankingModule,
  mode: RankingMode,
): HistoricalRankingSeason[] {
  const config = loadRankingConfig()
  const challenges = loadActiveChallenges()
  return data.seasons.map((season) => ({
    seasonId: season.id,
    season: season.label,
    startYear: season.startYear,
    endYear: season.endYear,
    entries: computeRankings({
      data: {
        standings: data.standings,
        competitions: data.competitions,
        seasons: data.seasons,
        clubs: data.clubs,
        coaches: data.coaches,
        coachSeasons: data.coachSeasons,
        players: data.players,
        playerStats: data.stats,
      },
      config,
      entity,
      module,
      withDecay: false,
      mode,
      seasonId: season.id,
      challenges,
    }).entries,
  }))
}

export function rankingValue(entry: RankingEntry | undefined, mode: RankingMode): number {
  if (!entry) return 0
  return mode === 'raw' ? entry.raw : entry.weighted
}
