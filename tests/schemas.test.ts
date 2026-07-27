import { describe, expect, it } from 'vitest'
import { seasonSchema } from '../src/shared/types/schemas'

describe('seasonSchema', () => {
  it('accepts a valid season', () => {
    const result = seasonSchema.safeParse({
      id: 'season_2024',
      label: '2024/25',
      startYear: 2024,
      endYear: 2025,
      createdAt: new Date().toISOString(),
    })

    expect(result.success).toBe(true)
  })

  it('rejects non-consecutive years', () => {
    const result = seasonSchema.safeParse({
      id: 'season_invalid',
      label: '2024/26',
      startYear: 2024,
      endYear: 2026,
      createdAt: new Date().toISOString(),
    })

    expect(result.success).toBe(false)
  })
})
