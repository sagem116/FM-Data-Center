import { describe, expect, it } from 'vitest'
import { createPreview } from '../src/modules/imports/parsers'
import type { WorkbookSnapshot } from '../src/modules/imports/core/types'

function workbook(fileName: string, name: string, rows: Array<Record<string, unknown>>): WorkbookSnapshot {
  return { fileName, sheets: [{ name, headers: Object.keys(rows[0] ?? {}), rows }] }
}

describe('parsers dos formatos reais FM', () => {
  it('reconhece cabeçalhos reais de estatísticas', () => {
    const preview = createPreview(workbook('07 Estatísticas.xlsx', 'Superliga ', [{
      competicao: 'Super League', nome: 'Jogador A', jogos: '8 (3)', gls: 4, ast: 2, xg: 3.4,
      passe: '87%', 'des_90': 2.1, 'cl_med': 7.2, clube: 'Clube A', 'c_a': 145, 'c_p': 160, idu: '123', idade: 22, nac: 'Portugal',
    }]), 'statistics')
    expect(preview.validRows).toBe(1)
    expect(preview.rows[0].values.appearances).toBe(11)
    expect(preview.rows[0].values.passCompletion).toBe(0.87)
  })

  it('lê Função No Clube nos treinadores', () => {
    const preview = createPreview(workbook('02 Treinadores.xlsx', 'Dados Treinadores', [{ idu: '77', nome: 'Treinador A', 'funcao_no_clube': 'Treinador', clube: 'Clube A', vitorias: '55%' }]), 'coaches')
    expect(preview.rows[0].values.role).toBe('Treinador')
    expect(preview.rows[0].values.winRate).toBe(0.55)
  })

  it('lê Posição Sec. no perfil dos jogadores', () => {
    const preview = createPreview(workbook('03 Jogadores.xlsx', ' Perfil dos Jogadores ', [{ idu: '9', nome: 'Jogador B', posicao: 'DC', 'posicao_sec': 'DD', idade: 20 }]), 'players')
    expect(preview.rows[0].values.secondaryPosition).toBe('DD')
  })
})
