import { beforeEach, describe, expect, it } from 'vitest'
import { aliasesFor, removeFeatureAliasOverride, setFeatureAliasOverride } from '../src/modules/scores/engine/feature-aliases'

describe('aliases manuais do Debug Scores',()=>{
  beforeEach(()=>localStorage.clear())
  it('adiciona uma chave importada a uma métrica canónica',()=>{setFeatureAliasOverride('metric','passes-progressivos','Prog Passes/90');expect(aliasesFor('metric','passes-progressivos')).toContain('prog-passes-90')})
  it('remove o mapeamento manual',()=>{setFeatureAliasOverride('attribute','passe','Passing');removeFeatureAliasOverride('attribute','passe');expect(aliasesFor('attribute','passe')).not.toContain('passing')})
})
