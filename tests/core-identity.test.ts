import { describe, expect, it } from 'vitest'
import { resolvePlayerIdentity } from '../src/core/identity'
describe('identidade canónica',()=>{it('prefere IDU',()=>expect(resolvePlayerIdentity({uid:'123',name:'Nuno'})).toMatchObject({key:'uid:123',confidence:'high'}));it('usa nome e nascimento sem IDU',()=>expect(resolvePlayerIdentity({name:'João Silva',birthDate:'2000-01-01'}).confidence).toBe('medium'));it('marca fallback como fraco',()=>expect(resolvePlayerIdentity({name:'João Silva',club:'Porto',age:22}).confidence).toBe('low'))})
