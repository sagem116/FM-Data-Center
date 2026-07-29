import { describe, expect, it } from 'vitest'
import { mergeColumnOrder, moveColumn } from '../src/modules/rankings/utils/column-order'

describe('ordem das colunas dos rankings', () => {
  it('preserva a ordem guardada e acrescenta colunas novas', () => {
    expect(mergeColumnOrder(['name', 'rank'], ['rank', 'name', 'total'])).toEqual(['name', 'rank', 'total'])
  })

  it('move uma coluna antes da coluna de destino', () => {
    expect(moveColumn(['rank', 'name', 'total'], 'total', 'name')).toEqual(['rank', 'total', 'name'])
  })
})
