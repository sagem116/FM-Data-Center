import { describe, expect, it } from 'vitest'
import { createPreview } from '../src/modules/imports/parsers'
import type { WorkbookSnapshot } from '../src/modules/imports/core/types'

describe('formatos continentais e internacionais', () => {
  it('lê o formato continental normal', () => {
    const snapshot: WorkbookSnapshot = { fileName: 'classificações.xlsx', sheets: [{ name: 'Continentais', headers: [], rows: [{
      competicao: 'CAF Champions League', vencedor: 'Orlando Pirates', finalista: 'Pyramids', meia_final_equipa_1: 'Al-Ahly', meia_final_equipa_2: 'Zamalek', quartos_de_final_equipa_1: 'FAR Rabat',
    }] }] }
    const row = createPreview(snapshot, 'standings').rows[0]
    expect(row.values).toMatchObject({ competitionType: 'continental', winner: 'Orlando Pirates', finalist: 'Pyramids', entityKind: 'club' })
    expect(row.values.semiFinalists).toEqual(['Al-Ahly', 'Zamalek'])
  })

  it('corrige o deslocamento das seleções internacionais', () => {
    const snapshot: WorkbookSnapshot = { fileName: 'classificações.xlsx', sheets: [{ name: 'Internacionais', headers: [], rows: [{
      competicao: 'UEFA European Championship', equipa_1: 'França', vencedor: 'Portugal', finalista: 'Alemanha', meia_final_equipa_2: 'Países Baixos', quartos_de_final_equipa_1: 'Noruega',
    }] }] }
    const row = createPreview(snapshot, 'standings').rows[0]
    expect(row.values).toMatchObject({ competitionType: 'international', winner: 'França', finalist: 'Portugal', entityKind: 'selection' })
    expect(row.values.semiFinalists).toEqual(['Alemanha', 'Países Baixos'])
  })
})
