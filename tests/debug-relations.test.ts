import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../src/database/db'
import { collectRelationDebug } from '../src/modules/diagnostics/services/relation-debug-service'

beforeEach(async () => { await db.delete(); await db.open() })

describe('Debug Relações', () => {
  it('deteta estatística sem perfil de época', async () => {
    await db.seasons.put({ id: 's1', label: '2024/25', startYear: 2024, endYear: 2025, createdAt: new Date().toISOString() })
    await db.players.put({ id: 'p1', name: 'Jogador', normalizedName: 'jogador', identityConfidence: 'high', identityKey: 'uid:1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    await db.competitions.put({ id: 'c1', name: 'Liga', normalizedName: 'liga', type: 'national' })
    await db.playerCompetitionStats.put({ id: 'stat1', playerId: 'p1', seasonId: 's1', competitionId: 'c1', competitionName: 'Liga', appearances: 1, starts: 1, substituteAppearances: 0, minutes: 90, goals: 0, assists: 0, metrics: {} })
    const debug = await collectRelationDebug()
    expect(debug.issues.some((row) => row.code === 'STATS_WITHOUT_PLAYER_SEASON')).toBe(true)
  })
})
