import { describe, expect, it } from 'vitest'
import { createPreview } from '../src/modules/imports/parsers'

describe('validação detalhada', () => {
  it('rejeita linha inválida e preserva folha e linha', () => {
    const preview = createPreview({ fileName: '05 competições.xlsx', sheets: [{ name: 'Reputação Competições', headers: ['competicao', 'reputacao'], rows: [{ competicao: null, reputacao: 100 }] }] }, 'competitions')
    // Linhas totalmente sem identidade são ignoradas pelo parser, sem criar entidade fantasma.
    expect(preview.rows).toHaveLength(0)
    expect(preview.totalSourceRows).toBe(1)
  })

  it('expõe as folhas encontradas no preview', () => {
    const preview = createPreview({ fileName: '05 competições.xlsx', sheets: [{ name: 'Reputação Competições', headers: ['competicao', 'reputacao'], rows: [{ competicao: 'Premier League', reputacao: 187 }] }] }, 'competitions')
    expect(preview.sourceSheets).toEqual(['Reputação Competições'])
  })
})
