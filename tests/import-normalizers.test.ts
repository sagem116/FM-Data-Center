import { describe, expect, it } from 'vitest'
import { excelSerialToIso, parseAppearances, parseMoney, parsePercentage } from '../src/modules/imports/core/normalizers'

describe('normalizadores de importação', () => {
  it('interpreta valores monetários FM', () => {
    expect(parseMoney('42M € (55M €)')).toMatchObject({ guaranteed: 42_000_000, possible: 55_000_000, currency: 'EUR' })
    expect(parseMoney('603,000 € p/a').guaranteed).toBe(603000)
  })
  it('interpreta jogos e suplências', () => {
    expect(parseAppearances('8 (3)')).toEqual({ starts: 8, substitute: 3, total: 11 })
  })
  it('normaliza percentagens e datas Excel', () => {
    expect(parsePercentage(0.83)).toBe(0.83)
    expect(parsePercentage('83%')).toBe(0.83)
    expect(excelSerialToIso(45153)).toBe('2023-08-15')
  })
})
