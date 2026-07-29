import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../src/database/db'
import { collectClubDebug } from '../src/modules/diagnostics/services/club-debug-service'

beforeEach(async () => { await db.delete(); await db.open() })

describe('Debug Clubes', () => {
  it('deteta clube ativo sem reputação e sem treinador', async () => {
    await db.seasons.put({ id: 's1', label: '2024/25', startYear: 2024, endYear: 2025, createdAt: new Date().toISOString() })
    await db.clubs.put({ id: 'club:a', name: 'Clube A', normalizedName: 'clube a', country: 'Portugal', continent: 'Europa' })
    await db.clubSeasons.put({ id: 'club-season:club:a:s1', clubId: 'club:a', seasonId: 's1' })
    const debug = await collectClubDebug()
    expect(debug.issues.some((row) => row.code === 'CLUB_REPUTATION_MISSING')).toBe(true)
    expect(debug.issues.some((row) => row.code === 'CLUB_WITHOUT_HEAD_COACH')).toBe(true)
  })
})
