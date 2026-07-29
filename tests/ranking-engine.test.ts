import { describe,expect,it } from 'vitest'
import { computeClubRankings } from '../src/modules/rankings/engine/ranking-engine'
import { OLD_APP_DEFAULT_CONFIG } from '../src/modules/rankings/config/default-ranking-config'
const seasons=[{id:'s1',label:'2024/25',startYear:2024,endYear:2025,createdAt:''}]
const competitions=[{id:'c1',name:'Super League 1',normalizedName:'super league 1',type:'super-league' as const}]
const standings=[{id:'x',seasonId:'s1',competitionId:'c1',competitionName:'Super League 1',format:'league' as const,entityName:'Clube A',position:1,stage:'league',info:'C'}]
describe('motor canónico',()=>{it('calcula bruto e ponderado com breakdown',()=>{const out=computeClubRankings({standings,competitions,seasons,config:OLD_APP_DEFAULT_CONFIG,module:'all',withDecay:true,mode:'weighted'});expect(out.entries[0].raw).toBe(1400);expect(out.entries[0].weighted).toBe(1400*2*2.3);expect(out.entries[0].contributions[0]).toMatchObject({competitionWeight:2,divisionWeight:2.3,decay:1})});it('bruto não muda com pesos',()=>{const out=computeClubRankings({standings,competitions,seasons,config:{...OLD_APP_DEFAULT_CONFIG,competitionWeights:{...OLD_APP_DEFAULT_CONFIG.competitionWeights,superleague:9}},module:'all',withDecay:true,mode:'raw'});expect(out.entries[0].raw).toBe(1400)})})
