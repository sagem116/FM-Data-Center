import { describe, expect, it } from 'vitest'
import { TACTICAL_FORMATIONS } from '../src/modules/intelligence/services/tactical-lab-service'
import { DEFAULT_STRENGTH_WEIGHTS } from '../src/modules/intelligence/services/competition-strength-service'

describe('módulos de decision intelligence', () => {
  it('define formações completas de onze jogadores', () => {
    expect(TACTICAL_FORMATIONS.length).toBeGreaterThanOrEqual(6)
    for (const formation of TACTICAL_FORMATIONS) {
      expect(formation.slots).toHaveLength(11)
      expect(new Set(formation.slots.map((slot) => slot.id)).size).toBe(11)
      expect(formation.slots.some((slot) => slot.line === 'GK')).toBe(true)
      expect(formation.slots.some((slot) => slot.line === 'ATT')).toBe(true)
    }
  })

  it('mantém um índice competitivo equilibrado e completo', () => {
    expect(Object.keys(DEFAULT_STRENGTH_WEIGHTS)).toHaveLength(10)
    expect(Object.values(DEFAULT_STRENGTH_WEIGHTS).reduce((sum, value) => sum + value, 0)).toBe(100)
    expect(DEFAULT_STRENGTH_WEIGHTS.currentAbility).toBeGreaterThan(DEFAULT_STRENGTH_WEIGHTS.coachQuality)
  })
})
