import { describe, expect, it } from 'vitest'
import { computeAwards } from '../src/modules/awards/engine/awards-engine'
import type { AwardsEngineData } from '../src/modules/awards/engine/awards-engine'

const data: AwardsEngineData = {
  seasons: [{ id: 's1', label: '2025/26', startYear: 2025, endYear: 2026, createdAt: '' }],
  competitions: [{ id: 'c1', name: 'Super League 2', normalizedName: 'super league 2', type: 'super-league', level: 2, reputation: 150 }],
  standings: [
    { id: 'st1', seasonId: 's1', competitionId: 'c1', competitionName: 'Super League 2', format: 'league', entityId: 'club1', entityName: 'Clube A', position: 1, played: 10, wins: 8, draws: 1, losses: 1, goalsFor: 24, goalsAgainst: 8, goalDifference: 16, points: 25, info: 'P' },
    { id: 'st2', seasonId: 's1', competitionId: 'c1', competitionName: 'Super League 2', format: 'league', entityId: 'club2', entityName: 'Clube B', position: 2, played: 10, wins: 6, draws: 2, losses: 2, goalsFor: 18, goalsAgainst: 12, goalDifference: 6, points: 20 },
  ],
  players: [
    { id: 'p1', name: 'Avançado A', normalizedName: 'avancado a', nationality: 'Portugal', identityConfidence: 'high', identityKey: 'p1', createdAt: '', updatedAt: '' },
    { id: 'p2', name: 'Avançado B', normalizedName: 'avancado b', nationality: 'Portugal', identityConfidence: 'high', identityKey: 'p2', createdAt: '', updatedAt: '' },
  ],
  playerSeasons: [
    { id: 'ps1', playerId: 'p1', seasonId: 's1', clubId: 'club1', clubName: 'Clube A', age: 23, position: 'PL', wageAnnual: 1000000, marketValue: 10000000 },
    { id: 'ps2', playerId: 'p2', seasonId: 's1', clubId: 'club2', clubName: 'Clube B', age: 25, position: 'PL', wageAnnual: 1200000, marketValue: 9000000 },
  ],
  playerAttributes: [],
  playerGeneralMetrics: [
    { id: 'g1', playerId: 'p1', seasonId: 's1', metrics: { currentAbility: 150, potentialAbility: 165, reputation: 140 } },
    { id: 'g2', playerId: 'p2', seasonId: 's1', metrics: { currentAbility: 145, potentialAbility: 155, reputation: 130 } },
  ],
  playerStats: [
    { id: 'x1', playerId: 'p1', seasonId: 's1', competitionId: 'c1', competitionName: 'Super League 2', clubId: 'club1', clubName: 'Clube A', appearances: 10, starts: 10, substituteAppearances: 0, minutes: 900, goals: 12, assists: 4, metrics: { averageRating: 7.6, xg: 9 } },
    { id: 'x2', playerId: 'p2', seasonId: 's1', competitionId: 'c1', competitionName: 'Super League 2', clubId: 'club2', clubName: 'Clube B', appearances: 10, starts: 10, substituteAppearances: 0, minutes: 900, goals: 8, assists: 2, metrics: { averageRating: 7.1, xg: 8 } },
  ],
  clubs: [
    { id: 'club1', name: 'Clube A', normalizedName: 'clube a', country: 'Portugal' },
    { id: 'club2', name: 'Clube B', normalizedName: 'clube b', country: 'Portugal' },
  ],
  coaches: [{ id: 'coach1', name: 'Treinador A', normalizedName: 'treinador a', nationality: 'Portugal', identityConfidence: 'high', identityKey: 'coach1' }],
  coachSeasons: [{ id: 'cs1', coachId: 'coach1', seasonId: 's1', currentClubId: 'club1', currentClubName: 'Clube A', role: 'Treinador', metrics: {} }],
  transfers: [],
}

describe('awards engine', () => {
  it('atribui melhor marcador e clube do ano no âmbito selecionado', () => {
    const result = computeAwards(data, { seasonId: 's1', module: 'superleague', minimumMinutes: 300 })
    expect(result.awards.find((award) => award.id === 'top-scorer')?.winner?.name).toBe('Avançado A')
    expect(result.awards.find((award) => award.id === 'club-of-year')?.winner?.name).toBe('Clube A')
    expect(result.awards.find((award) => award.id === 'coach-of-year')?.winner?.name).toBe('Treinador A')
  })

  it('não trata o primeiro classificado sem Inf=C como campeão da Super League', () => {
    const result = computeAwards(data, { seasonId: 's1', module: 'superleague', minimumMinutes: 300 })
    const club = result.awards.find((award) => award.id === 'club-of-year')?.winner
    expect(club?.details.titles).toBe(0)
  })
})
