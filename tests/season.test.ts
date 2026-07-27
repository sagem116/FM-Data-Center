import { describe, expect, it } from 'vitest'
import { parseSeasonLabel } from '../src/core/season/season'
describe('época',()=>{it('normaliza 2024/25',()=>expect(parseSeasonLabel('2024/25')).toMatchObject({startYear:2024,endYear:2025,label:'2024/25'}));it('rejeita anos não consecutivos',()=>expect(()=>parseSeasonLabel('2024/26')).toThrow())})
