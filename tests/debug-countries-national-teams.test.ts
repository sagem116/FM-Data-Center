import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../src/database/db'
import { collectCountryDebug } from '../src/modules/diagnostics/services/country-debug-service'

beforeEach(async () => { await db.delete(); await db.open() })

describe('Debug Países - seleções', () => {
  it('deteta seleção internacional sem treinador', async () => {
    await db.seasons.put({ id: 's1', label: '2024/25', startYear: 2024, endYear: 2025, createdAt: new Date().toISOString() })
    await db.competitions.put({ id: 'comp:world', name: 'World Cup', normalizedName: 'world cup', type: 'international' })
    await db.standings.put({ id: 'st1', seasonId: 's1', competitionId: 'comp:world', competitionName: 'World Cup', format: 'knockout', stage: 'winner', entityId: 'country:portugal', entityName: 'Portugal', position: 1 })
    const debug = await collectCountryDebug()
    expect(debug.issues.some((row) => row.code === 'NATIONAL_TEAM_WITHOUT_COACH')).toBe(true)
  })
})
