import { describe, expect, it } from 'vitest'
import { DEFAULT_SCORE_CONFIG } from '../src/modules/scores/config/default-score-config'
import { analyzeFeatureAvailability, computeRoleScores, buildStyleProfiles } from '../src/modules/scores/engine/score-engine'
import type { ScorePlayerData } from '../src/modules/scores/config/types'

const rows:ScorePlayerData[]=[
 {playerId:'1',playerName:'A',seasonId:'2024-25',clubId:'c1',clubName:'Clube A',competitionId:'l1',competitionName:'Liga A',position:'PL (C)',appearances:30,minutes:2400,attributes:{finalizacao:18,'sem-bola':17,antecipacao:16,compostura:17,aceleracao:15,'primeiro-toque':16,decisoes:15,velocidade:15,agilidade:14,tecnica:15,concentracao:14,equilibrio:14,forca:13},metrics:{'xg-sp-90':0.7,'glse-90':0.65,remates:4,'toques-na-area':7,'valor-de-mercado':50000000,'salario-anual':5000000},context:{competitionReputation:180}},
 {playerId:'2',playerName:'B',seasonId:'2024-25',clubId:'c2',clubName:'Clube B',competitionId:'l1',competitionName:'Liga A',position:'PL (C)',appearances:28,minutes:2100,attributes:{finalizacao:11,'sem-bola':11,antecipacao:10,compostura:10,aceleracao:10,'primeiro-toque':10,decisoes:10,velocidade:10,agilidade:10,tecnica:10,concentracao:10,equilibrio:10,forca:10},metrics:{'xg-sp-90':0.25,'glse-90':0.2,remates:1.8,'toques-na-area':3,'valor-de-mercado':10000000,'salario-anual':1000000},context:{competitionReputation:180}},
]

describe('motor de Scores',()=>{
  it('inclui as 32 roles e novas dimensões configuráveis',()=>{expect(DEFAULT_SCORE_CONFIG.roles).toHaveLength(32);expect(DEFAULT_SCORE_CONFIG.inferenceDimensions.length).toBeGreaterThanOrEqual(14)})
  it('distingue jogadores e apresenta cobertura/confiança',()=>{
    const role=DEFAULT_SCORE_CONFIG.roles.find(item=>item.name==='Ponta de Lança')!
    const scores=computeRoleScores(rows,role,DEFAULT_SCORE_CONFIG)
    expect(scores[0].playerName).toBe('A')
    expect(scores[0].confidence).toBe(100)
    expect(scores[0].coverage).toBeGreaterThan(50)
  })
  it('infere um perfil agregado da competição',()=>{
    const role=DEFAULT_SCORE_CONFIG.roles.find(item=>item.name==='Ponta de Lança')!
    const scores=computeRoleScores(rows,role,DEFAULT_SCORE_CONFIG)
    const profiles=buildStyleProfiles(rows,DEFAULT_SCORE_CONFIG,'competition',scores)
    expect(profiles[0].entityName).toBe('Liga A')
    expect(profiles[0].summary.length).toBeGreaterThan(10)
    expect(profiles[0].averages.marketValue).toBe(30000000)
    expect(profiles[0].averages.wageAnnual).toBe(3000000)
    expect(profiles[0].dimensionContributions).toBeDefined()
  })
  it('avisa quando uma métrica configurada não existe',()=>{
    const role=DEFAULT_SCORE_CONFIG.roles.find(item=>item.name==='Ponta de Lança')!
    const availability=analyzeFeatureAvailability(rows,role)
    expect(availability.some(item=>item.status==='missing')).toBe(true)
  })
})
