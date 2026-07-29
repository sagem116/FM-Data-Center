import { describe, expect, it } from 'vitest'
import { computeRankings } from '../src/modules/rankings/engine/ranking-engine'
import { defaultRankingConfig } from '../src/modules/rankings/config/default-ranking-config'

describe('seleções internacionais', () => {
  it('entram no ranking de países sem serem criadas como clubes', () => {
    const season = { id: 'season:2024-25', label: '2024/25', startYear: 2024, endYear: 2025, createdAt: '' }
    const competition = { id: 'competition:euro', name: 'UEFA European Championship', normalizedName: 'uefa european championship', type: 'international' as const }
    const result = computeRankings({
      data: {
        standings: [{ id: 'standing:france', seasonId: season.id, competitionId: competition.id, competitionName: competition.name, format: 'knockout', stage: 'winner', entityId: 'country:franca', entityName: 'França' }],
        competitions: [competition], seasons: [season], clubs: [], coaches: [], coachSeasons: [], players: [], playerStats: [],
      },
      config: defaultRankingConfig,
      entity: 'countries', module: 'international', withDecay: false, mode: 'weighted', challenges: [],
    })
    expect(result.entries[0]).toMatchObject({ name: 'França', titles: 1 })
  })
})
