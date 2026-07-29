import { describe, expect, it } from 'vitest'
import { canonicalAttributeId } from '../src/core/football-data/feature-map'
import { normalizeCountryName } from '../src/core/countries'
import { createPreview } from '../src/modules/imports/parsers'
import { clubMatchKey, isPlaceholderEntityValue, normalizeCompetitionName, normalizeFootballName, parseMoney } from '../src/modules/imports/core/normalizers'
import type { WorkbookSnapshot } from '../src/modules/imports/core/types'

describe('mapeamentos dos ficheiros reais v0.8.4', () => {
  it('corrige aliases conhecidos sem fundir clubes diferentes', () => {
    expect(normalizeFootballName('Eintracht FranKurt')).toBe('Eintracht Frankfurt')
    expect(clubMatchKey('Barcelona')).not.toBe(clubMatchKey('Barcelona S.C.'))
    expect(clubMatchKey('Suwon')).not.toBe(clubMatchKey('Suwon FC'))
  })

  it('corrige competições e valores monetários dos exemplos', () => {
    expect(normalizeCompetitionName('ABC Asian cup')).toBe('AFC Asian Cup')
    expect(normalizeCompetitionName('FIFA Nike Super League 2')).toBe('Super League 2')
    expect(normalizeCompetitionName('UEFA Conference League')).toBe('UEFA Europa Conference League')
    expect(parseMoney('2,513,000 € p/a').guaranteed).toBe(2_513_000)
    expect(parseMoney('375m €').guaranteed).toBe(375_000)
    expect(parseMoney('42M €').guaranteed).toBe(42_000_000)
  })

  it('normaliza códigos e variantes de países confirmados pelos exemplos', () => {
    expect(normalizeCountryName('PLE')).toBe('Territórios palestinianos')
    expect(normalizeCountryName('LIB')).toBe('Líbano')
    expect(normalizeCountryName('PUR')).toBe('Porto Rico')
    expect(normalizeCountryName('CLF')).toBe('Maurícia')
    expect(normalizeCountryName('IJruguai')).toBe('Uruguai')
  })

  it('não importa cabeçalhos internos como entidades', () => {
    expect(isPlaceholderEntityValue('Equipa')).toBe(true)
    const snapshot: WorkbookSnapshot = {
      fileName: 'clubes.xlsx',
      sheets: [{ name: 'pais clubes', headers: ['club_name', 'pais', 'continente'], rows: [
        { club_name: 'Equipa', pais: 'Pais', continente: 'Continente' },
        { club_name: 'FC Porto', pais: 'Portugal', continente: 'Europa' },
      ] }],
    }
    const preview = createPreview(snapshot, 'clubs')
    expect(preview.rows).toHaveLength(1)
    expect(preview.rows[0].values.name).toBe('FC Porto')
  })

  it('mantém a ordem correta dos dois atributos Imp', () => {
    expect(canonicalAttributeId('imp')).toBe('impulsao')
    expect(canonicalAttributeId('imp_2')).toBe('imprevisibilidade')
  })
})
