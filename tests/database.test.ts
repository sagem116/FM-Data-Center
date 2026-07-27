import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../src/database/db'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('FmDatabase', () => {
  it('writes and reads a season', async () => {
    await db.seasons.add({
      id: 'season_2024',
      label: '2024/25',
      startYear: 2024,
      endYear: 2025,
      createdAt: new Date().toISOString(),
    })

    const season = await db.seasons.get('season_2024')
    expect(season?.label).toBe('2024/25')
  })
})
