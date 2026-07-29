import { describe, expect, it } from 'vitest'
import { computeCorrelations, computeEntityRows, computeMarketSummary, computePositionRows, filterMarketTransfers } from '../src/modules/market/engine/market-engine'
import type { EnrichedTransfer, MarketFilters } from '../src/modules/market/types'

const base = (id:string, fee:number, age:number, ca:number, pa:number, from:string, to:string):EnrichedTransfer => ({
  id, seasonId:'season:2024', playerName:`Player ${id}`, transferDate:'2024-07-01', fee, possibleFee:fee, currency:'EUR', transferType:'permanent',
  fromClubId:`club:${from}`,fromClubName:from,toClubId:`club:${to}`,toClubName:to,season:{id:'season:2024',label:'2024/25',startYear:2024,endYear:2025,createdAt:''},
  snapshot:{age,currentAbility:ca,potentialAbility:pa,marketValue:fee*.8,wageAnnual:1_000_000,position:'PL (C)',positionGroup:'Avançados',nationality:'Portugal'},
  from:{club:{id:`club:${from}`,name:from,normalizedName:from.toLowerCase(),country:'Portugal',continent:'Europa'},competitions:[],coaches:[]},
  to:{club:{id:`club:${to}`,name:to,normalizedName:to.toLowerCase(),country:'Inglaterra',continent:'Europa'},competitions:[],coaches:[]},
  effectiveFee:fee,feeKnown:true,feeToMarketValue:1.25,potentialGap:pa-ca,domestic:false,sameCompetition:false,linkedPlayer:true,
})
const transfers=[base('1',10_000_000,20,120,155,'A','B'),base('2',20_000_000,24,140,160,'C','B'),base('3',30_000_000,28,160,165,'B','D')]
const filters:MarketFilters={seasonFrom:'2024',seasonTo:'2024',continent:'',country:'',competitionId:'',clubId:'',coachId:'',position:'',ageBand:'all',direction:'all',minFee:null,maxFee:null,query:''}

describe('market engine',()=>{
  it('calcula resumo e perfis de clube',()=>{
    const filtered=filterMarketTransfers(transfers,filters)
    const summary=computeMarketSummary(filtered)
    expect(summary.transfers).toBe(3)
    expect(summary.totalValue).toBe(60_000_000)
    expect(summary.averageAge).toBe(24)
    const clubs=computeEntityRows(filtered,'club')
    const b=clubs.find(item=>item.name==='B')
    expect(b?.arrivals).toBe(2)
    expect(b?.departures).toBe(1)
    expect(b?.spend).toBe(30_000_000)
  })
  it('agrega posições e calcula correlações',()=>{
    const positions=computePositionRows(transfers)
    expect(positions[0].position).toBe('Avançados')
    expect(positions[0].transfers).toBe(3)
    const feeCa=computeCorrelations(transfers).find(item=>item.id==='fee-ca')
    expect(feeCa?.sample).toBe(3)
    expect((feeCa?.value??0)).toBeGreaterThan(.99)
  })
})
