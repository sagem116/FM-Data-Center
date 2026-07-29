import { normalizeKey } from '../../imports/core/normalizers'
import type {
  EnrichedTransfer, MarketCorrelation, MarketCoverageIssue, MarketEntityRow, MarketFilters, MarketFlowRow, MarketInsight, MarketSummary, MarketTrendRow, PlayerMarketRow, PositionMarketRow,
} from '../types'

const mean = (values: Array<number | undefined>): number | undefined => {
  const valid = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : undefined
}
const sum = (values: Array<number | undefined>): number => values.reduce<number>((total, value) => total + (value ?? 0), 0)
const median = (values: Array<number | undefined>): number => {
  const valid = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value)).sort((a, b) => a - b)
  if (!valid.length) return 0
  const middle = Math.floor(valid.length / 2)
  return valid.length % 2 ? valid[middle] : (valid[middle - 1] + valid[middle]) / 2
}
const share = (value: number, total: number): number => total ? value / total * 100 : 0
const inAgeBand = (age: number | undefined, band: MarketFilters['ageBand']): boolean => {
  if (band === 'all') return true
  if (age === undefined) return false
  if (band === 'u21') return age <= 20
  if (band === '21-25') return age >= 21 && age <= 25
  if (band === '26-30') return age >= 26 && age <= 30
  return age >= 31
}
function sideMatches(transfer: EnrichedTransfer, side: 'from' | 'to', filters: MarketFilters): boolean {
  const context = transfer[side]
  if (filters.clubId && context.club?.id !== filters.clubId) return false
  if (filters.coachId && !context.coaches.some((coach) => coach.id === filters.coachId)) return false
  if (filters.competitionId && !context.competitions.some((competition) => competition.id === filters.competitionId)) return false
  if (filters.country && context.club?.country !== filters.country && !context.competitions.some((competition) => competition.country === filters.country)) return false
  if (filters.continent && context.club?.continent !== filters.continent && !context.competitions.some((competition) => competition.continent === filters.continent)) return false
  return true
}
export function filterMarketTransfers(transfers: EnrichedTransfer[], filters: MarketFilters): EnrichedTransfer[] {
  const fromYear = filters.seasonFrom ? Number(filters.seasonFrom) : -Infinity
  const toYear = filters.seasonTo ? Number(filters.seasonTo) : Infinity
  const query = normalizeKey(filters.query)
  const hasSideFilter = Boolean(filters.clubId || filters.coachId || filters.competitionId || filters.country || filters.continent)
  return transfers.filter((transfer) => {
    const year = transfer.season?.startYear ?? 0
    if (year < fromYear || year > toYear) return false
    if (filters.position && transfer.snapshot.positionGroup !== filters.position) return false
    if (!inAgeBand(transfer.snapshot.age, filters.ageBand)) return false
    if (filters.minFee !== null && transfer.effectiveFee < filters.minFee) return false
    if (filters.maxFee !== null && transfer.effectiveFee > filters.maxFee) return false
    if (query && ![transfer.playerName, transfer.from.club?.name, transfer.fromClubName, transfer.to.club?.name, transfer.toClubName, transfer.snapshot.nationality, transfer.snapshot.position].some((value) => normalizeKey(value).includes(query))) return false
    if (!hasSideFilter) return true
    const from = sideMatches(transfer, 'from', filters)
    const to = sideMatches(transfer, 'to', filters)
    if (filters.direction === 'arrivals') return to
    if (filters.direction === 'departures') return from
    return from || to
  })
}

export function computeMarketSummary(transfers: EnrichedTransfer[]): MarketSummary {
  const known = transfers.filter((item) => item.feeKnown)
  const linked = transfers.filter((item) => item.linkedPlayer)
  const profiled = transfers.filter((item) => item.snapshot.age !== undefined || item.snapshot.currentAbility !== undefined || item.snapshot.potentialAbility !== undefined)
  return {
    transfers: transfers.length,
    knownFees: known.length,
    totalValue: sum(known.map((item) => item.effectiveFee)),
    averageFee: mean(known.map((item) => item.effectiveFee)) ?? 0,
    medianFee: median(known.map((item) => item.effectiveFee)),
    maxFee: Math.max(0, ...known.map((item) => item.effectiveFee)),
    averageAge: mean(transfers.map((item) => item.snapshot.age)),
    under21Share: share(transfers.filter((item) => (item.snapshot.age ?? 99) <= 20).length, transfers.filter((item) => item.snapshot.age !== undefined).length),
    averageCA: mean(transfers.map((item) => item.snapshot.currentAbility)),
    averagePA: mean(transfers.map((item) => item.snapshot.potentialAbility)),
    averagePotentialGap: mean(transfers.map((item) => item.potentialGap)),
    averageWage: mean(transfers.map((item) => item.snapshot.wageAnnual)),
    averageMarketValue: mean(transfers.map((item) => item.snapshot.marketValue)),
    freeShare: share(transfers.filter((item) => item.transferType === 'free').length, transfers.length),
    loanShare: share(transfers.filter((item) => item.transferType === 'loan').length, transfers.length),
    playerCoverage: share(linked.length, transfers.length),
    profileCoverage: share(profiled.length, transfers.length),
  }
}

interface EntityBucket {
  id: string
  name: string
  kind: MarketEntityRow['kind']
  country?: string
  continent?: string
  competitionType?: import('../../../shared/types/entities').Competition['type']
  arrivals: EnrichedTransfer[]
  departures: EnrichedTransfer[]
  coachAttributed: number
}
function topLabel(values: Array<string | undefined>): string | undefined {
  const counts = new Map<string, number>()
  for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt'))[0]?.[0]
}
function entityNarrative(row: Omit<MarketEntityRow, 'summary'>): string {
  const parts: string[] = []
  if ((row.under21Share ?? 0) >= 35) parts.push('forte aposta em jovens')
  else if ((row.averageBuyAge ?? 0) >= 28) parts.push('recrutamento experiente')
  if ((row.averagePotentialGap ?? 0) >= 18) parts.push('foco elevado em potencial')
  if ((row.feeToValueRatio ?? 1) > 1.25) parts.push('paga prémio acima do valor de mercado')
  else if (row.feeToValueRatio !== undefined && row.feeToValueRatio < .8) parts.push('compra abaixo do valor estimado')
  if ((row.foreignShare ?? 0) >= 65) parts.push('mercado internacional')
  else if ((row.internalShare ?? 0) >= 55) parts.push('preferência pelo mercado interno')
  if (row.income > row.spend * 1.2) parts.push('perfil vendedor')
  else if (row.spend > row.income * 1.5) parts.push('perfil investidor')
  return parts.length ? parts.join(' · ') : 'perfil equilibrado ou amostra insuficiente'
}
function rowFromBucket(bucket: EntityBucket): MarketEntityRow {
  const buys = bucket.arrivals
  const sales = bucket.departures
  const buyKnown = buys.filter((item) => item.feeKnown)
  const saleKnown = sales.filter((item) => item.feeKnown)
  const spend = sum(buyKnown.map((item) => item.effectiveFee))
  const income = sum(saleKnown.map((item) => item.effectiveFee))
  const buyWithAge = buys.filter((item) => item.snapshot.age !== undefined)
  const buyProfiles = buys.filter((item) => item.linkedPlayer)
  const raw: Omit<MarketEntityRow, 'summary'> = {
    id: bucket.id, name: bucket.name, kind: bucket.kind, country: bucket.country, continent: bucket.continent, competitionType: bucket.competitionType,
    transfers: buys.length + sales.length, arrivals: buys.length, departures: sales.length,
    spend, income, netSpend: spend - income,
    averageBuyFee: mean(buyKnown.map((item) => item.effectiveFee)) ?? 0,
    averageSaleFee: mean(saleKnown.map((item) => item.effectiveFee)) ?? 0,
    medianBuyFee: median(buyKnown.map((item) => item.effectiveFee)),
    maxBuyFee: Math.max(0, ...buyKnown.map((item) => item.effectiveFee)),
    averageBuyAge: mean(buys.map((item) => item.snapshot.age)), averageSaleAge: mean(sales.map((item) => item.snapshot.age)),
    under21Share: share(buyWithAge.filter((item) => (item.snapshot.age ?? 99) <= 20).length, buyWithAge.length),
    over30Share: share(buyWithAge.filter((item) => (item.snapshot.age ?? 0) >= 31).length, buyWithAge.length),
    averageBuyCA: mean(buys.map((item) => item.snapshot.currentAbility)), averageBuyPA: mean(buys.map((item) => item.snapshot.potentialAbility)),
    averagePotentialGap: mean(buys.map((item) => item.potentialGap)), averageBuyReputation: mean(buys.map((item) => item.snapshot.reputation)),
    averageBuyMarketValue: mean(buys.map((item) => item.snapshot.marketValue)), averageBuyWage: mean(buys.map((item) => item.snapshot.wageAnnual)),
    feeToValueRatio: mean(buys.map((item) => item.feeToMarketValue)),
    foreignShare: share(buys.filter((item) => item.snapshot.nationality && bucket.country && item.snapshot.nationality !== bucket.country).length, buys.filter((item) => item.snapshot.nationality && bucket.country).length),
    internalShare: share(buys.filter((item) => item.sameCompetition === true).length, buys.filter((item) => item.sameCompetition !== null).length),
    freeShare: share(buys.filter((item) => item.transferType === 'free').length, buys.length), loanShare: share(buys.filter((item) => item.transferType === 'loan').length, buys.length),
    profileCoverage: share(buyProfiles.length, buys.length), coachAttributionCoverage: bucket.kind === 'coach' ? undefined : share(bucket.coachAttributed, buys.length + sales.length),
    topPosition: topLabel(buys.map((item) => item.snapshot.positionGroup)), topSource: topLabel(buys.map((item) => item.from.club?.name ?? item.fromClubName)), topDestination: topLabel(sales.map((item) => item.to.club?.name ?? item.toClubName)),
  }
  return { ...raw, summary: entityNarrative(raw) }
}
export function computeEntityRows(transfers: EnrichedTransfer[], kind: MarketEntityRow['kind']): MarketEntityRow[] {
  const buckets = new Map<string, EntityBucket>()
  const get = (id: string, name: string, country: string | undefined, continent: string | undefined, competitionType?: import('../../../shared/types/entities').Competition['type']): EntityBucket => {
    const current = buckets.get(id) ?? { id, name, kind, country, continent, competitionType, arrivals: [], departures: [], coachAttributed: 0 }
    buckets.set(id, current)
    return current
  }
  for (const transfer of transfers) {
    if (kind === 'club') {
      if (transfer.to.club) { const bucket = get(transfer.to.club.id, transfer.to.club.name, transfer.to.club.country, transfer.to.club.continent); bucket.arrivals.push(transfer); if (transfer.to.coaches.length) bucket.coachAttributed++ }
      if (transfer.from.club) { const bucket = get(transfer.from.club.id, transfer.from.club.name, transfer.from.club.country, transfer.from.club.continent); bucket.departures.push(transfer); if (transfer.from.coaches.length) bucket.coachAttributed++ }
    } else if (kind === 'competition') {
      for (const competition of transfer.to.competitions) get(competition.id, competition.name, competition.country, competition.continent, competition.type).arrivals.push(transfer)
      for (const competition of transfer.from.competitions) get(competition.id, competition.name, competition.country, competition.continent, competition.type).departures.push(transfer)
    } else {
      for (const coach of transfer.to.coaches) get(coach.id, coach.name, coach.nationality, undefined).arrivals.push(transfer)
      for (const coach of transfer.from.coaches) get(coach.id, coach.name, coach.nationality, undefined).departures.push(transfer)
    }
  }
  return [...buckets.values()].map(rowFromBucket).sort((a, b) => b.transfers - a.transfers || b.spend - a.spend)
}

export function computePositionRows(transfers: EnrichedTransfer[]): PositionMarketRow[] {
  const groups = new Map<string, EnrichedTransfer[]>()
  for (const transfer of transfers) {
    const key = transfer.snapshot.positionGroup
    const list = groups.get(key) ?? []
    list.push(transfer)
    groups.set(key, list)
  }
  return [...groups.entries()].map(([position, rows]) => {
    const known = rows.filter((item) => item.feeKnown)
    return {
      position: position as PositionMarketRow['position'], transfers: rows.length, totalValue: sum(known.map((item) => item.effectiveFee)), averageFee: mean(known.map((item) => item.effectiveFee)) ?? 0,
      medianFee: median(known.map((item) => item.effectiveFee)), share: share(rows.length, transfers.length), averageAge: mean(rows.map((item) => item.snapshot.age)), averageCA: mean(rows.map((item) => item.snapshot.currentAbility)),
      averagePA: mean(rows.map((item) => item.snapshot.potentialAbility)), averagePotentialGap: mean(rows.map((item) => item.potentialGap)), averageWage: mean(rows.map((item) => item.snapshot.wageAnnual)),
      averageMarketValue: mean(rows.map((item) => item.snapshot.marketValue)), feeToValueRatio: mean(rows.map((item) => item.feeToMarketValue)),
    }
  }).sort((a, b) => b.totalValue - a.totalValue)
}

export function computePlayerRows(transfers: EnrichedTransfer[]): PlayerMarketRow[] {
  const groups = new Map<string, EnrichedTransfer[]>()
  for (const transfer of transfers) {
    const key = transfer.snapshot.player?.id ?? normalizeKey(transfer.playerName)
    const list = groups.get(key) ?? []
    list.push(transfer)
    groups.set(key, list)
  }
  return [...groups.entries()].map(([id, rows]) => {
    rows.sort((a, b) => (a.transferDate ?? a.season?.label ?? '').localeCompare(b.transferDate ?? b.season?.label ?? ''))
    let profit = 0, profitSample = 0
    for (let index = 0; index < rows.length; index++) {
      const sale = rows[index]
      if (!sale.from.club || !sale.feeKnown) continue
      for (let previous = index - 1; previous >= 0; previous--) {
        const buy = rows[previous]
        if (buy.to.club?.id === sale.from.club.id && buy.feeKnown) { profit += sale.effectiveFee - buy.effectiveFee; profitSample++; break }
      }
    }
    const latest = rows.at(-1)!
    return {
      id, name: latest.playerName, nationality: latest.snapshot.nationality, position: latest.snapshot.positionGroup, moves: rows.length,
      totalFees: sum(rows.filter((item) => item.feeKnown).map((item) => item.effectiveFee)), maxFee: Math.max(0, ...rows.filter((item) => item.feeKnown).map((item) => item.effectiveFee)),
      latestAge: latest.snapshot.age, latestCA: latest.snapshot.currentAbility, latestPA: latest.snapshot.potentialAbility, latestMarketValue: latest.snapshot.marketValue, latestWage: latest.snapshot.wageAnnual,
      clubs: [...new Set(rows.flatMap((item) => [item.from.club?.name ?? item.fromClubName, item.to.club?.name ?? item.toClubName]).filter((value): value is string => Boolean(value)))],
      estimatedTradingProfit: profitSample ? profit : undefined, profitSample,
    }
  }).sort((a, b) => b.totalFees - a.totalFees)
}

export function computeFlowRows(transfers: EnrichedTransfer[], level: MarketFlowRow['level']): MarketFlowRow[] {
  const map = new Map<string, EnrichedTransfer[]>()
  const label = (transfer: EnrichedTransfer, side: 'from' | 'to'): string | undefined => {
    if (level === 'club') return transfer[side].club?.name ?? (side === 'from' ? transfer.fromClubName : transfer.toClubName)
    if (level === 'country') return transfer[side].club?.country
    return transfer[side].club?.continent
  }
  for (const transfer of transfers) {
    const from = label(transfer, 'from'), to = label(transfer, 'to')
    if (!from || !to || from === to) continue
    const key = `${from}→${to}`
    const list = map.get(key) ?? []
    list.push(transfer)
    map.set(key, list)
  }
  return [...map.entries()].map(([id, rows]) => {
    const [from, to] = id.split('→')
    const known = rows.filter((item) => item.feeKnown)
    return { id, from, to, level, transfers: rows.length, totalValue: sum(known.map((item) => item.effectiveFee)), averageFee: mean(known.map((item) => item.effectiveFee)) ?? 0, averageAge: mean(rows.map((item) => item.snapshot.age)), averageCA: mean(rows.map((item) => item.snapshot.currentAbility)) }
  }).sort((a, b) => b.totalValue - a.totalValue || b.transfers - a.transfers)
}

export function computeTrends(transfers: EnrichedTransfer[]): MarketTrendRow[] {
  const map = new Map<string, EnrichedTransfer[]>()
  for (const transfer of transfers) {
    const key = transfer.seasonId
    const list = map.get(key) ?? []
    list.push(transfer)
    map.set(key, list)
  }
  return [...map.entries()].map(([seasonId, rows]) => {
    const known = rows.filter((item) => item.feeKnown)
    const ageRows = rows.filter((item) => item.snapshot.age !== undefined)
    const foreignKnown = rows.filter((item) => item.snapshot.nationality && item.to.club?.country)
    return {
      seasonId, season: rows[0]?.season?.label ?? seasonId, transfers: rows.length, totalValue: sum(known.map((item) => item.effectiveFee)), averageFee: mean(known.map((item) => item.effectiveFee)) ?? 0,
      medianFee: median(known.map((item) => item.effectiveFee)), averageAge: mean(rows.map((item) => item.snapshot.age)), averageCA: mean(rows.map((item) => item.snapshot.currentAbility)), averagePA: mean(rows.map((item) => item.snapshot.potentialAbility)),
      under21Share: share(ageRows.filter((item) => (item.snapshot.age ?? 99) <= 20).length, ageRows.length), foreignShare: share(foreignKnown.filter((item) => item.snapshot.nationality !== item.to.club?.country).length, foreignKnown.length),
    }
  }).sort((a, b) => (a.season > b.season ? 1 : -1))
}

function pearson(pairs: Array<[number | undefined, number | undefined]>): { value: number | null; sample: number } {
  const valid = pairs.filter((pair): pair is [number, number] => pair[0] !== undefined && pair[1] !== undefined && Number.isFinite(pair[0]) && Number.isFinite(pair[1]))
  if (valid.length < 3) return { value: null, sample: valid.length }
  const xs = valid.map(([x]) => x), ys = valid.map(([, y]) => y)
  const mx = mean(xs) ?? 0, my = mean(ys) ?? 0
  let numerator = 0, dx = 0, dy = 0
  for (let i = 0; i < valid.length; i++) { const a = xs[i] - mx, b = ys[i] - my; numerator += a * b; dx += a * a; dy += b * b }
  const denominator = Math.sqrt(dx * dy)
  return { value: denominator ? numerator / denominator : null, sample: valid.length }
}
function interpretation(value: number | null): string {
  if (value === null) return 'Amostra insuficiente'
  const strength = Math.abs(value) >= .7 ? 'forte' : Math.abs(value) >= .4 ? 'moderada' : Math.abs(value) >= .2 ? 'fraca' : 'muito fraca'
  return `${strength} associação ${value >= 0 ? 'positiva' : 'negativa'}`
}
export function computeCorrelations(transfers: EnrichedTransfer[]): MarketCorrelation[] {
  const definitions: Array<[string, string, (item: EnrichedTransfer) => number | undefined]> = [
    ['fee-ca', 'Valor da transferência × CA', (item) => item.snapshot.currentAbility],
    ['fee-pa', 'Valor da transferência × PA', (item) => item.snapshot.potentialAbility],
    ['fee-age', 'Valor da transferência × idade', (item) => item.snapshot.age],
    ['fee-reputation', 'Valor da transferência × reputação', (item) => item.snapshot.reputation],
    ['fee-wage', 'Valor da transferência × salário', (item) => item.snapshot.wageAnnual],
    ['fee-market-value', 'Valor da transferência × valor de mercado', (item) => item.snapshot.marketValue],
    ['fee-potential-gap', 'Valor da transferência × margem de potencial', (item) => item.potentialGap],
  ]
  return definitions.map(([id, label, getter]) => {
    const result = pearson(transfers.map((item) => [item.feeKnown ? item.effectiveFee : undefined, getter(item)]))
    return { id, label, value: result.value, sample: result.sample, interpretation: interpretation(result.value) }
  })
}

export function computeCoverage(transfers: EnrichedTransfer[]): MarketCoverageIssue[] {
  const defs: Array<[string, string, (item: EnrichedTransfer) => boolean, string]> = [
    ['player', 'Jogador identificado', (item) => item.linkedPlayer, 'Reimporta Jogadores antes das Transferências para maximizar a associação por IDU.'],
    ['fee', 'Valor da transferência', (item) => item.feeKnown, 'Valores livres ou não divulgados podem ficar sem montante.'],
    ['age', 'Idade', (item) => item.snapshot.age !== undefined, 'Depende do perfil de Jogadores na mesma época.'],
    ['ca', 'Capacidade Atual', (item) => item.snapshot.currentAbility !== undefined, 'Depende de C.A. no ficheiro Jogadores ou Estatísticas.'],
    ['pa', 'Capacidade Potencial', (item) => item.snapshot.potentialAbility !== undefined, 'Depende de C.P. no ficheiro Jogadores ou Estatísticas.'],
    ['market-value', 'Valor de mercado', (item) => item.snapshot.marketValue !== undefined, 'Depende de VP no perfil ou nas Estatísticas.'],
    ['wage', 'Salário', (item) => item.snapshot.wageAnnual !== undefined, 'Depende de Salário no perfil ou nas Estatísticas.'],
    ['reputation', 'Reputação do jogador', (item) => item.snapshot.reputation !== undefined, 'Depende de R.A., RM ou RC no perfil de Jogadores.'],
    ['buyer-context', 'Contexto do comprador', (item) => Boolean(item.to.club && item.to.competitions.length), 'Depende de Clubes e Classificações/Estatísticas da mesma época.'],
    ['seller-context', 'Contexto do vendedor', (item) => Boolean(item.from.club && item.from.competitions.length), 'Depende de Clubes e Classificações/Estatísticas da mesma época.'],
    ['coach', 'Treinador atribuído', (item) => Boolean(item.to.coaches.length || item.from.coaches.length), 'Atribuição é feita por clube e época; requer Treinadores importados.'],
  ]
  return defs.map(([key, label, test, guidance]) => {
    const available = transfers.filter(test).length
    const coverage = share(available, transfers.length)
    return { key, label, available, total: transfers.length, coverage, severity: coverage >= 90 ? 'ok' : coverage >= 50 ? 'warning' : 'error', guidance }
  })
}

export function computeInsights(transfers: EnrichedTransfer[], clubs: MarketEntityRow[], competitions: MarketEntityRow[], coaches: MarketEntityRow[], positions: PositionMarketRow[], correlations: MarketCorrelation[]): MarketInsight[] {
  const insights: MarketInsight[] = []
  const add = (id: string, title: string, text: string, evidence: string, sample: number) => insights.push({ id, title, text, evidence, confidence: sample >= 50 ? 'alta' : sample >= 15 ? 'moderada' : 'baixa' })
  const spender = [...clubs].sort((a, b) => b.spend - a.spend)[0]
  if (spender) add('top-spender', 'Maior investidor', `${spender.name} lidera o investimento, com perfil ${spender.summary}.`, `${spender.arrivals} entradas analisadas`, spender.arrivals)
  const seller = [...clubs].sort((a, b) => b.income - a.income)[0]
  if (seller) add('top-seller', 'Maior vendedor', `${seller.name} gerou a maior receita de saídas no período analisado.`, `${seller.departures} saídas analisadas`, seller.departures)
  const youth = clubs.filter((row) => row.arrivals >= 3).sort((a, b) => (b.under21Share ?? 0) - (a.under21Share ?? 0))[0]
  if (youth) add('youth', 'Recrutamento jovem', `${youth.name} apresenta a maior proporção de contratações Sub-21 (${(youth.under21Share ?? 0).toFixed(1)}%).`, `Idade disponível em ${youth.profileCoverage.toFixed(0)}% das entradas`, youth.arrivals)
  const potential = clubs.filter((row) => row.averagePotentialGap !== undefined && row.arrivals >= 3).sort((a, b) => (b.averagePotentialGap ?? 0) - (a.averagePotentialGap ?? 0))[0]
  if (potential) add('potential', 'Aposta em valorização', `${potential.name} contrata a maior margem média entre PA e CA (${potential.averagePotentialGap?.toFixed(1)}).`, `${potential.arrivals} entradas; depende da cobertura de CA/PA`, potential.arrivals)
  const exporter = [...competitions].sort((a, b) => (b.income - b.spend) - (a.income - a.spend))[0]
  if (exporter) add('exporter', 'Competição exportadora', `${exporter.name} apresenta o saldo comercial mais favorável entre as competições mapeadas.`, `${exporter.transfers} contribuições de mercado`, exporter.transfers)
  const coach = coaches.filter((row) => row.arrivals >= 2).sort((a, b) => b.spend - a.spend)[0]
  if (coach) add('coach', 'Treinador com maior investimento associado', `${coach.name} está associado ao maior volume de compras. A atribuição é por clube e época, não pela data exata da transferência.`, `${coach.arrivals} entradas atribuídas`, coach.arrivals)
  const premium = positions.filter((row) => row.transfers >= 3).sort((a, b) => b.averageFee - a.averageFee)[0]
  if (premium) add('position-premium', 'Posição mais valorizada', `${premium.position} apresenta o maior valor médio de transferência no período.`, `${premium.transfers} movimentos`, premium.transfers)
  const caCorrelation = correlations.find((item) => item.id === 'fee-ca')
  if (caCorrelation?.value !== null && caCorrelation) add('correlation-ca', 'Preço e qualidade atual', `A relação entre valor pago e CA é ${caCorrelation.interpretation}.`, `r=${caCorrelation.value.toFixed(2)} · n=${caCorrelation.sample}`, caCorrelation.sample)
  const foreign = transfers.filter((item) => item.snapshot.nationality && item.to.club?.country)
  if (foreign.length) {
    const foreignShare = share(foreign.filter((item) => item.snapshot.nationality !== item.to.club?.country).length, foreign.length)
    add('internationalization', 'Internacionalização do mercado', `${foreignShare.toFixed(1)}% das entradas com nacionalidade e país conhecidos são estrangeiras.`, `${foreign.length} transferências comparáveis`, foreign.length)
  }
  return insights
}
