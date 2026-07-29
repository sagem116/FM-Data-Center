import { beforeEach, describe, expect, it } from 'vitest'
import { normalizeCountryToken, resolveCountry, setCountryAliasOverride } from '../src/core/countries'

describe('normalização global de países',()=>{
  beforeEach(()=>localStorage.clear())
  it.each([
    ['PORTUGAL','Portugal','PRT'],
    ['portugal','Portugal','PRT'],
    ['United States','Estados Unidos','USA'],
    ['USA','Estados Unidos','USA'],
    ['ENG','Inglaterra','ENG'],
    ['England','Inglaterra','ENG'],
    ['Germany','Alemanha','DEU'],
    ['GER','Alemanha','DEU'],
  ])('resolve %s', (input,canonical,alpha3)=>{const result=resolveCountry(input);expect(result.canonical).toBe(canonical);expect(result.alpha3).toBe(alpha3)})
  it('ignora acentos, pontuação e caixa',()=>expect(normalizeCountryToken('  ESTADOS  UNIDOS!!! ')).toBe('estados unidos'))
  it('aceita aliases manuais persistentes',()=>{setCountryAliasOverride('Rep. XPTO','Portugal');expect(resolveCountry('rep xpto').canonical).toBe('Portugal');expect(resolveCountry('Rep. XPTO').status).toBe('override')})
})
