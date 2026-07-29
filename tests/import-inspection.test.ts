import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../src/database/db'
import { inspectImportedData } from '../src/modules/imports/services/import-inspection-service'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('inspeção dos dados importados', () => {
  it('lê jogadores sem depender de um índice updatedAt', async () => {
    await db.players.bulkPut([
      { id: 'p1', uid: '1', name: 'Antigo', normalizedName: 'antigo', identityConfidence: 'high', identityKey: 'uid:1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: 'p2', uid: '2', name: 'Recente', normalizedName: 'recente', identityConfidence: 'high', identityKey: 'uid:2', createdAt: '2024-01-02', updatedAt: '2024-01-02' },
    ])
    const snapshot = await inspectImportedData()
    expect(snapshot.recentPlayers.map((player) => player.name)).toEqual(['Recente', 'Antigo'])
    expect(snapshot.partialErrors).toEqual([])
  })
})
