import { describe, expect, it } from 'vitest'
import { detectImportKind } from '../src/modules/imports/core/detect-import-kind'
import { createPreview } from '../src/modules/imports/parsers'
import type { WorkbookSnapshot } from '../src/modules/imports/core/types'

const workbook:WorkbookSnapshot={fileName:'Competições Rep.xlsx',sheets:[{name:'Reputação Competições',headers:['competition','reputacao','pais','contintente'],rows:[{competition:'Premier League',reputacao:185,pais:'Inglaterra',contintente:'Europa'}]}]}

describe('reputação de competições com localização',()=>{
  it('deteta o tipo correto e preserva país e continente',()=>{
    expect(detectImportKind(workbook)).toBe('competitions')
    const preview=createPreview(workbook,'competitions')
    expect(preview.rows[0].values).toMatchObject({name:'Premier League',reputation:185,country:'Inglaterra',continent:'Europa',competitionType:'national'})
  })
})
