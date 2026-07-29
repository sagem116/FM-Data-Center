import { describe, expect, it } from 'vitest'
import { detectImportKind } from '../src/modules/imports/core/detect-import-kind'
import { createPreview } from '../src/modules/imports/parsers'
import type { WorkbookSnapshot } from '../src/modules/imports/core/types'

describe('ficheiro de reputação das competições', () => {
  const snapshot: WorkbookSnapshot = {
    fileName: '05 competições.xlsx',
    sheets: [{
      name: 'Reputação Competições',
      headers: ['competicao', 'reputacao'],
      rows: [{ competicao: 'Premier League', reputacao: 187 }],
    }],
  }

  it('é detetado como Competições', () => {
    expect(detectImportKind(snapshot)).toBe('competitions')
  })

  it('lê o nome e a reputação', () => {
    const preview = createPreview(snapshot, 'competitions')
    expect(preview.validRows).toBe(1)
    expect(preview.rows[0].values).toMatchObject({ name: 'Premier League', reputation: 187 })
  })
})
