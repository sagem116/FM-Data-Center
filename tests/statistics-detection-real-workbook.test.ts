import { describe, expect, it } from 'vitest'
import { detectImportKind } from '../src/modules/imports/core/detect-import-kind'
import type { WorkbookSnapshot } from '../src/modules/imports/core/types'

describe('deteção por estrutura de colunas',()=>{
  it('classifica estatísticas mesmo com folhas chamadas Ligas Nacionais e Super Leagues',()=>{
    const snapshot:WorkbookSnapshot={fileName:'FM_Estatisticas_Divisao_Total.xlsx',sheets:[
      {name:'Ligas Nacionais',headers:['competicao','nome','jogos','gls','ast','xg','passe','des_90','cl_med','clube','c_a','c_p','idu'],rows:[]},
      {name:'Super Leagues',headers:['competicao','nome','jogos','gls','ast','xg','passe','clube','idu'],rows:[]},
    ]}
    expect(detectImportKind(snapshot)).toBe('statistics')
  })
})
