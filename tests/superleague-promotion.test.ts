import { describe,expect,it } from 'vitest'
import { computeRankings } from '../src/modules/rankings/engine/ranking-engine'
import { defaultRankingConfig } from '../src/modules/rankings/config/default-ranking-config'

describe('subidas Super League',()=>{
  it('conta o primeiro classificado abaixo da divisão 1 como promovido',()=>{
    const result=computeRankings({data:{standings:[{id:'s',seasonId:'season:2024-25',competitionId:'c',competitionName:'Super League 2',format:'league',stage:'league',entityId:'club:a',entityName:'Clube A',position:1}],competitions:[{id:'c',name:'Super League 2',normalizedName:'super league 2',type:'super-league'}],seasons:[{id:'season:2024-25',label:'2024/25',startYear:2024,endYear:2025,createdAt:''}],clubs:[],coaches:[],coachSeasons:[],players:[],playerStats:[]},config:defaultRankingConfig,entity:'clubs',module:'superleague',withDecay:false,mode:'raw',challenges:[]})
    expect(result.entries[0].promotions).toBe(1)
    expect(result.entries[0].titles).toBe(0)
  })
})
