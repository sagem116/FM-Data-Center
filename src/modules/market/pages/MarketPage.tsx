import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, BarChart3, Info, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import { Panel } from '../../../shared/components/Panel'
import { StatCard } from '../../../shared/components/StatCard'
import { EntityLink } from '../../../shared/components/EntityLink'
import { IMPORT_COMPLETED_EVENT } from '../../imports/services/import-events'
import { ReorderableScoreTable, type ScoreTableColumn } from '../../scores/components/ReorderableScoreTable'
import {
  computeCorrelations, computeCoverage, computeEntityRows, computeFlowRows, computeInsights, computeMarketSummary, computePlayerRows, computePositionRows, computeTrends, filterMarketTransfers,
} from '../engine/market-engine'
import { clearMarketDataCache, loadMarketData } from '../services/market-service'
import type { EnrichedTransfer, MarketDataBundle, MarketEntityRow, MarketFilters, MarketFlowRow, MarketTab, PlayerMarketRow, PositionMarketRow } from '../types'

const EMPTY: MarketDataBundle = { seasons: [], clubs: [], competitions: [], coaches: [], transfers: [] }
const DEFAULT_FILTERS: MarketFilters = { seasonFrom: '', seasonTo: '', continent: '', country: '', competitionId: '', clubId: '', coachId: '', position: '', ageBand: 'all', direction: 'all', minFee: null, maxFee: null, query: '' }
const money = (value?: number) => value === undefined ? '—' : new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(value)
const number = (value?: number, digits = 1) => value === undefined ? '—' : new Intl.NumberFormat('pt-PT', { maximumFractionDigits: digits }).format(value)
const percent = (value?: number) => value === undefined ? '—' : `${number(value, 1)}%`
const signedMoney = (value: number) => `${value > 0 ? '+' : ''}${money(value)}`
const typeLabel: Record<EnrichedTransfer['transferType'], string> = { permanent: 'Definitiva', loan: 'Empréstimo', free: 'Livre', unknown: 'Desconhecido' }
const confidenceLabel = (coverage: number) => coverage >= 85 ? 'Alta' : coverage >= 55 ? 'Moderada' : 'Baixa'

type FlowLevel = MarketFlowRow['level']

function EntityExplain({ row, onClose }: { row: MarketEntityRow; onClose: () => void }) {
  return <div className="modal-backdrop" onClick={onClose}><div className="editor-modal market-explain-modal" onClick={(event) => event.stopPropagation()}>
    <header className="ranking-explain__header"><div><span className="eyebrow">Explain Mode · Mercado</span><h2>{row.name}</h2><p>{row.summary}</p></div><button className="secondary-button" onClick={onClose}>Fechar</button></header>
    <div className="score-kpis market-kpis"><span><small>Investimento</small><strong>{money(row.spend)}</strong><small>Soma das entradas com valor conhecido.</small></span><span><small>Receita</small><strong>{money(row.income)}</strong><small>Soma das saídas com valor conhecido.</small></span><span><small>Saldo</small><strong>{signedMoney(row.income - row.spend)}</strong><small>Receita menos investimento.</small></span><span><small>Idade de compra</small><strong>{number(row.averageBuyAge)}</strong><small>Média apenas das entradas com idade disponível.</small></span><span><small>CA / PA</small><strong>{number(row.averageBuyCA)} / {number(row.averageBuyPA)}</strong><small>Qualidade atual e potencial médio.</small></span><span><small>Cobertura</small><strong>{percent(row.profileCoverage)}</strong><small>Entradas ligadas a um perfil de jogador.</small></span></div>
    <div className="score-detail-grid"><section><h3>Estratégia de recrutamento</h3><div className="market-formula-list"><p><b>Sub-21:</b> {percent(row.under21Share)}</p><p><b>31+:</b> {percent(row.over30Share)}</p><p><b>Margem PA–CA:</b> {number(row.averagePotentialGap)}</p><p><b>Posição dominante:</b> {row.topPosition ?? '—'}</p><p><b>Mercado estrangeiro:</b> {percent(row.foreignShare)}</p><p><b>Mercado interno:</b> {percent(row.internalShare)}</p></div></section><section><h3>Eficiência financeira</h3><div className="market-formula-list"><p><b>Preço médio de compra:</b> {money(row.averageBuyFee)}</p><p><b>Mediana de compra:</b> {money(row.medianBuyFee)}</p><p><b>Compra máxima:</b> {money(row.maxBuyFee)}</p><p><b>Preço / valor de mercado:</b> {row.feeToValueRatio === undefined ? '—' : `${number(row.feeToValueRatio, 2)}×`}</p><p><b>Salário médio contratado:</b> {money(row.averageBuyWage)}</p><p><b>Reputação média:</b> {number(row.averageBuyReputation)}</p></div></section></div>
    <div className="score-method-note"><strong>Limites da inferência</strong><p>O treinador é associado por clube e época, porque o ficheiro não contém a data exata de início e fim do cargo. As competições de um clube são determinadas através das Classificações e Estatísticas da mesma época. Valores ausentes não são estimados.</p></div>
  </div></div>
}

function CoveragePanel({ issues }: { issues: ReturnType<typeof computeCoverage> }) {
  const problematic = issues.filter((item) => item.severity !== 'ok')
  return <details className={problematic.length ? 'market-coverage market-coverage--warning' : 'market-coverage'} open={problematic.length > 0}><summary>Qualidade e cobertura dos dados · {problematic.length ? `${problematic.length} áreas incompletas` : 'sem problemas relevantes'}</summary><div className="market-coverage-grid">{issues.map((item) => <article key={item.key} className={`is-${item.severity}`}><div><strong>{item.label}</strong><span>{percent(item.coverage)}</span></div><div className="market-progress"><i style={{ width: `${Math.min(100, item.coverage)}%` }} /></div><small>{item.available.toLocaleString('pt-PT')} de {item.total.toLocaleString('pt-PT')} · {item.guidance}</small></article>)}</div></details>
}

function MarketBar({ value, max, label }: { value: number; max: number; label: string }) {
  return <div className="market-bar" title={`${label}: ${money(value)}`}><i style={{ width: `${max ? Math.max(2, value / max * 100) : 0}%` }} /><span>{money(value)}</span></div>
}

export function MarketPage() {
  const [data, setData] = useState<MarketDataBundle>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<MarketTab>('overview')
  const [filters, setFilters] = useState<MarketFilters>(DEFAULT_FILTERS)
  const [selected, setSelected] = useState<MarketEntityRow | null>(null)
  const [flowLevel, setFlowLevel] = useState<FlowLevel>('club')
  const [competitionScope, setCompetitionScope] = useState<'all'|'super-league'|'national'|'continental'|'international'>('all')
  const deferredQuery = useDeferredValue(filters.query)

  const refresh = async (force = false) => {
    setLoading(true); setError('')
    try {
      if (force) clearMarketDataCache()
      const result = await loadMarketData(force)
      setData(result)
      setFilters((current) => ({ ...current, seasonFrom: current.seasonFrom || String(result.seasons[0]?.startYear ?? ''), seasonTo: current.seasonTo || String(result.seasons.at(-1)?.startYear ?? '') }))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os dados de mercado.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void refresh(); const handler = () => void refresh(true); window.addEventListener(IMPORT_COMPLETED_EVENT, handler); return () => window.removeEventListener(IMPORT_COMPLETED_EVENT, handler) }, [])

  const effectiveFilters = useMemo(() => ({ ...filters, query: deferredQuery }), [filters, deferredQuery])
  const filtered = useMemo(() => filterMarketTransfers(data.transfers, effectiveFilters), [data.transfers, effectiveFilters])
  const summary = useMemo(() => computeMarketSummary(filtered), [filtered])
  const trends = useMemo(() => computeTrends(filtered), [filtered])
  const coverage = useMemo(() => computeCoverage(filtered), [filtered])
  const clubs = useMemo(() => tab === 'clubs' || tab === 'overview' || tab === 'insights' ? computeEntityRows(filtered, 'club') : [], [filtered, tab])
  const competitions = useMemo(() => tab === 'competitions' || tab === 'overview' || tab === 'insights' ? computeEntityRows(filtered, 'competition') : [], [filtered, tab])
  const visibleCompetitions = useMemo(() => competitionScope === 'all' ? competitions : competitions.filter((item) => item.competitionType === competitionScope), [competitions, competitionScope])
  const coaches = useMemo(() => tab === 'coaches' || tab === 'overview' || tab === 'insights' ? computeEntityRows(filtered, 'coach') : [], [filtered, tab])
  const positions = useMemo(() => tab === 'positions' || tab === 'overview' || tab === 'insights' ? computePositionRows(filtered) : [], [filtered, tab])
  const players = useMemo(() => tab === 'players' ? computePlayerRows(filtered) : [], [filtered, tab])
  const flows = useMemo(() => tab === 'flows' ? computeFlowRows(filtered, flowLevel) : [], [filtered, tab, flowLevel])
  const correlations = useMemo(() => tab === 'insights' || tab === 'overview' ? computeCorrelations(filtered) : [], [filtered, tab])
  const insights = useMemo(() => tab === 'insights' || tab === 'overview' ? computeInsights(filtered, clubs, competitions, coaches, positions, correlations) : [], [filtered, clubs, competitions, coaches, positions, correlations, tab])

  const countries = useMemo(() => [...new Set(data.clubs.map((item) => item.country).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, 'pt')), [data.clubs])
  const continents = useMemo(() => [...new Set(data.clubs.map((item) => item.continent).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, 'pt')), [data.clubs])
  const availableCompetitions = useMemo(() => data.competitions.filter((item) => (!filters.country || item.country === filters.country) && (!filters.continent || item.continent === filters.continent)).sort((a, b) => a.name.localeCompare(b.name, 'pt')), [data.competitions, filters.country, filters.continent])
  const availableClubs = useMemo(() => data.clubs.filter((item) => (!filters.country || item.country === filters.country) && (!filters.continent || item.continent === filters.continent)).sort((a, b) => a.name.localeCompare(b.name, 'pt')), [data.clubs, filters.country, filters.continent])

  const patch = (next: Partial<MarketFilters>) => setFilters((current) => ({ ...current, ...next }))
  const reset = () => setFilters({ ...DEFAULT_FILTERS, seasonFrom: String(data.seasons[0]?.startYear ?? ''), seasonTo: String(data.seasons.at(-1)?.startYear ?? '') })

  const transferColumns = useMemo<ScoreTableColumn<EnrichedTransfer>[]>(() => [
    { key: 'date', label: 'Data', help: 'Data da transferência importada.', value: (item) => item.transferDate ?? '', render: (item) => item.transferDate ?? item.season?.label ?? '—' },
    { key: 'season', label: 'Época', help: 'Época usada para cruzar o perfil do jogador e o contexto dos clubes.', value: (item) => item.season?.startYear ?? 0, render: (item) => item.season?.label ?? '—' },
    { key: 'player', label: 'Jogador', help: 'Jogador transferido.', value: (item) => item.playerName, render: (item) => <><EntityLink kind="player" id={item.snapshot.player?.id} name={item.playerName}/><small className="score-subline">{item.snapshot.nationality ?? 'Nacionalidade desconhecida'}</small></> },
    { key: 'age', label: 'Idade', help: 'Idade no perfil da mesma época.', value: (item) => item.snapshot.age ?? -1 },
    { key: 'position', label: 'Posição', help: 'Grupo posicional inferido da posição principal.', value: (item) => item.snapshot.positionGroup, render: (item) => <><strong>{item.snapshot.positionGroup}</strong><small className="score-subline">{item.snapshot.position ?? ''}</small></> },
    { key: 'from', label: 'De', help: 'Clube vendedor.', value: (item) => item.from.club?.name ?? item.fromClubName ?? '', render: (item) => <>{(item.from.club?.name ?? item.fromClubName) ? <EntityLink kind="club" id={item.from.club?.id} name={item.from.club?.name ?? item.fromClubName ?? ''}/> : '—'}<small className="score-subline">{item.from.primaryCompetition?.name ?? item.from.club?.country ?? ''}</small></> },
    { key: 'to', label: 'Para', help: 'Clube comprador.', value: (item) => item.to.club?.name ?? item.toClubName ?? '', render: (item) => <>{(item.to.club?.name ?? item.toClubName) ? <EntityLink kind="club" id={item.to.club?.id} name={item.to.club?.name ?? item.toClubName ?? ''}/> : '—'}<small className="score-subline">{item.to.primaryCompetition?.name ?? item.to.club?.country ?? ''}</small></> },
    { key: 'fee', label: 'Valor', help: 'Montante garantido. Não inclui automaticamente os possíveis bónus.', value: (item) => item.feeKnown ? item.effectiveFee : -1, render: (item) => item.feeKnown ? money(item.effectiveFee) : 'Não divulgado' },
    { key: 'possibleFee', label: 'Possível', help: 'Valor total possível indicado entre parênteses no ficheiro.', value: (item) => item.possibleFee ?? -1, render: (item) => money(item.possibleFee) },
    { key: 'type', label: 'Tipo', help: 'Definitiva, empréstimo, livre ou desconhecido.', value: (item) => item.transferType, render: (item) => typeLabel[item.transferType] },
    { key: 'ca', label: 'CA', help: 'Capacidade Atual do jogador na mesma época.', value: (item) => item.snapshot.currentAbility ?? -1 },
    { key: 'pa', label: 'PA', help: 'Capacidade Potencial do jogador na mesma época.', value: (item) => item.snapshot.potentialAbility ?? -1 },
    { key: 'gap', label: 'PA–CA', help: 'Margem potencial disponível.', value: (item) => item.potentialGap ?? -999 },
    { key: 'marketValue', label: 'Valor mercado', help: 'Valor estimado do jogador na mesma época.', value: (item) => item.snapshot.marketValue ?? -1, render: (item) => money(item.snapshot.marketValue) },
    { key: 'ratio', label: 'Preço/VP', help: 'Valor pago dividido pelo valor de mercado. Acima de 1 significa prémio.', value: (item) => item.feeToMarketValue ?? -1, render: (item) => item.feeToMarketValue === undefined ? '—' : `${number(item.feeToMarketValue, 2)}×` },
    { key: 'wage', label: 'Salário', help: 'Salário anual do perfil da mesma época.', value: (item) => item.snapshot.wageAnnual ?? -1, render: (item) => money(item.snapshot.wageAnnual) },
    { key: 'reputation', label: 'Reputação', help: 'Reputação disponível em R.A., RM, RC ou campo equivalente.', value: (item) => item.snapshot.reputation ?? -1 },
    { key: 'coach', label: 'Treinador comprador', help: 'Treinador principal associado ao clube comprador na época.', value: (item) => item.to.coaches.map((coach) => coach.name).join(', '), render: (item) => item.to.coaches.length ? <span className="entity-links-inline">{item.to.coaches.map((coach, index) => <span key={coach.id}>{index > 0 ? ' · ' : ''}<EntityLink kind="coach" id={coach.id} name={coach.name}/></span>)}</span> : '—' },
    { key: 'domestic', label: 'Origem', help: 'Compara o país do vendedor e do comprador.', value: (item) => item.domestic === null ? '' : item.domestic ? 'Nacional' : 'Internacional' },
  ], [])

  const entityColumns = useMemo<ScoreTableColumn<MarketEntityRow>[]>(() => [
    { key: 'name', label: 'Entidade', help: 'Clube, competição ou treinador.', value: (item) => item.name, render: (item) => <><EntityLink kind={item.kind==='club'?'club':item.kind==='competition'?'competition':'coach'} id={item.id} name={item.name}/><small className="score-subline">{[item.country, item.continent].filter(Boolean).join(' · ')}</small></> },
    { key: 'transfers', label: 'Movimentos', help: 'Entradas mais saídas associadas.', value: (item) => item.transfers },
    { key: 'arrivals', label: 'Entradas', help: 'Número de contratações.', value: (item) => item.arrivals },
    { key: 'departures', label: 'Saídas', help: 'Número de vendas/saídas.', value: (item) => item.departures },
    { key: 'spend', label: 'Investimento', help: 'Soma das entradas com valor conhecido.', value: (item) => item.spend, render: (item) => money(item.spend) },
    { key: 'income', label: 'Receita', help: 'Soma das saídas com valor conhecido.', value: (item) => item.income, render: (item) => money(item.income) },
    { key: 'balance', label: 'Saldo', help: 'Receita menos investimento. Positivo significa saldo vendedor.', value: (item) => item.income - item.spend, render: (item) => <span className={item.income - item.spend >= 0 ? 'market-positive' : 'market-negative'}>{signedMoney(item.income - item.spend)}</span> },
    { key: 'avgBuyFee', label: 'Compra média', help: 'Média dos valores conhecidos das entradas.', value: (item) => item.averageBuyFee, render: (item) => money(item.averageBuyFee) },
    { key: 'medianBuyFee', label: 'Mediana', help: 'Mediana das entradas, menos sensível a transferências extremas.', value: (item) => item.medianBuyFee, render: (item) => money(item.medianBuyFee) },
    { key: 'maxBuyFee', label: 'Maior compra', help: 'Maior investimento individual.', value: (item) => item.maxBuyFee, render: (item) => money(item.maxBuyFee) },
    { key: 'buyAge', label: 'Idade compra', help: 'Idade média das entradas.', value: (item) => item.averageBuyAge ?? -1 },
    { key: 'sellAge', label: 'Idade venda', help: 'Idade média das saídas.', value: (item) => item.averageSaleAge ?? -1 },
    { key: 'u21', label: 'Sub-21', help: 'Proporção de entradas com 20 anos ou menos.', value: (item) => item.under21Share ?? -1, render: (item) => percent(item.under21Share) },
    { key: 'ca', label: 'CA compra', help: 'CA médio das entradas.', value: (item) => item.averageBuyCA ?? -1 },
    { key: 'pa', label: 'PA compra', help: 'PA médio das entradas.', value: (item) => item.averageBuyPA ?? -1 },
    { key: 'gap', label: 'Margem', help: 'PA menos CA médio das entradas.', value: (item) => item.averagePotentialGap ?? -1 },
    { key: 'rep', label: 'Reputação', help: 'Reputação média das entradas.', value: (item) => item.averageBuyReputation ?? -1 },
    { key: 'wage', label: 'Salário médio', help: 'Salário anual médio das entradas.', value: (item) => item.averageBuyWage ?? -1, render: (item) => money(item.averageBuyWage) },
    { key: 'ratio', label: 'Preço/VP', help: 'Prémio médio pago face ao valor de mercado.', value: (item) => item.feeToValueRatio ?? -1, render: (item) => item.feeToValueRatio === undefined ? '—' : `${number(item.feeToValueRatio, 2)}×` },
    { key: 'foreign', label: 'Estrangeiros', help: 'Entradas cuja nacionalidade difere do país da entidade.', value: (item) => item.foreignShare ?? -1, render: (item) => percent(item.foreignShare) },
    { key: 'internal', label: 'Mercado interno', help: 'Entradas provenientes da mesma competição principal.', value: (item) => item.internalShare ?? -1, render: (item) => percent(item.internalShare) },
    { key: 'position', label: 'Posição favorita', help: 'Grupo posicional mais contratado.', value: (item) => item.topPosition ?? '' },
    { key: 'source', label: 'Origem favorita', help: 'Clube de origem mais frequente.', value: (item) => item.topSource ?? '' },
    { key: 'coverage', label: 'Cobertura', help: 'Percentagem de entradas ligadas a perfis de jogador.', value: (item) => item.profileCoverage, render: (item) => `${percent(item.profileCoverage)} · ${confidenceLabel(item.profileCoverage)}` },
    { key: 'summary', label: 'Perfil inferido', help: 'Síntese determinística baseada nas métricas visíveis.', value: (item) => item.summary },
    { key: 'explain', label: 'Explicação', help: 'Abre o detalhe da fórmula, amostras e limitações.', value: (item) => item.transfers, render: (item) => <button className="secondary-button" onClick={() => setSelected(item)}>Explicar</button> },
  ], [])

  const positionColumns = useMemo<ScoreTableColumn<PositionMarketRow>[]>(() => [
    { key: 'position', label: 'Posição', help: 'Grupo posicional inferido.', value: (item) => item.position, render: (item) => <strong>{item.position}</strong> },
    { key: 'transfers', label: 'Movimentos', help: 'Número de transferências no grupo.', value: (item) => item.transfers },
    { key: 'share', label: 'Peso', help: 'Percentagem do mercado analisado.', value: (item) => item.share, render: (item) => percent(item.share) },
    { key: 'value', label: 'Volume', help: 'Soma dos valores conhecidos.', value: (item) => item.totalValue, render: (item) => money(item.totalValue) },
    { key: 'avgFee', label: 'Valor médio', help: 'Preço médio por movimento.', value: (item) => item.averageFee, render: (item) => money(item.averageFee) },
    { key: 'median', label: 'Mediana', help: 'Preço mediano.', value: (item) => item.medianFee, render: (item) => money(item.medianFee) },
    { key: 'age', label: 'Idade', help: 'Idade média.', value: (item) => item.averageAge ?? -1 },
    { key: 'ca', label: 'CA', help: 'CA médio.', value: (item) => item.averageCA ?? -1 },
    { key: 'pa', label: 'PA', help: 'PA médio.', value: (item) => item.averagePA ?? -1 },
    { key: 'gap', label: 'Margem', help: 'PA menos CA médio.', value: (item) => item.averagePotentialGap ?? -1 },
    { key: 'wage', label: 'Salário', help: 'Salário anual médio.', value: (item) => item.averageWage ?? -1, render: (item) => money(item.averageWage) },
    { key: 'ratio', label: 'Preço/VP', help: 'Prémio médio face ao valor de mercado.', value: (item) => item.feeToValueRatio ?? -1, render: (item) => item.feeToValueRatio === undefined ? '—' : `${number(item.feeToValueRatio, 2)}×` },
  ], [])

  const playerColumns = useMemo<ScoreTableColumn<PlayerMarketRow>[]>(() => [
    { key: 'name', label: 'Jogador', help: 'Jogador identificado no histórico.', value: (item) => item.name, render: (item) => <><EntityLink kind="player" id={item.id} name={item.name}/><small className="score-subline">{item.nationality ? <EntityLink kind="country" name={item.nationality}/> : '—'} · {item.position}</small></> },
    { key: 'moves', label: 'Movimentos', help: 'Número de transferências encontradas.', value: (item) => item.moves },
    { key: 'total', label: 'Volume acumulado', help: 'Soma dos valores conhecidos em todas as transferências.', value: (item) => item.totalFees, render: (item) => money(item.totalFees) },
    { key: 'max', label: 'Maior valor', help: 'Maior transferência individual.', value: (item) => item.maxFee, render: (item) => money(item.maxFee) },
    { key: 'age', label: 'Idade atual', help: 'Idade no perfil mais recente dentro do filtro.', value: (item) => item.latestAge ?? -1 },
    { key: 'ca', label: 'CA', help: 'CA mais recente.', value: (item) => item.latestCA ?? -1 },
    { key: 'pa', label: 'PA', help: 'PA mais recente.', value: (item) => item.latestPA ?? -1 },
    { key: 'value', label: 'Valor mercado', help: 'Valor de mercado mais recente.', value: (item) => item.latestMarketValue ?? -1, render: (item) => money(item.latestMarketValue) },
    { key: 'wage', label: 'Salário', help: 'Salário anual mais recente.', value: (item) => item.latestWage ?? -1, render: (item) => money(item.latestWage) },
    { key: 'profit', label: 'Lucro estimado', help: 'Venda menos compra anterior identificada no mesmo clube. Não inclui salários, prémios ou comissões.', value: (item) => item.estimatedTradingProfit ?? -Infinity, render: (item) => item.estimatedTradingProfit === undefined ? '—' : <span className={item.estimatedTradingProfit >= 0 ? 'market-positive' : 'market-negative'}>{signedMoney(item.estimatedTradingProfit)}</span> },
    { key: 'sample', label: 'Operações ligadas', help: 'Número de pares compra-venda usados no lucro estimado.', value: (item) => item.profitSample },
    { key: 'clubs', label: 'Clubes', help: 'Clubes encontrados no percurso de mercado.', value: (item) => item.clubs.join(', '), render: (item) => item.clubs.join(' → ') },
  ], [])

  const flowColumns = useMemo<ScoreTableColumn<MarketFlowRow>[]>(() => [
    { key: 'from', label: 'Origem', help: 'Origem do fluxo.', value: (item) => item.from, render: (item) => <strong>{item.from}</strong> },
    { key: 'arrow', label: '', help: 'Direção do fluxo.', value: () => '', render: () => <ArrowRight size={16} /> },
    { key: 'to', label: 'Destino', help: 'Destino do fluxo.', value: (item) => item.to, render: (item) => <strong>{item.to}</strong> },
    { key: 'moves', label: 'Movimentos', help: 'Número de transferências nesta direção.', value: (item) => item.transfers },
    { key: 'value', label: 'Volume', help: 'Valor total conhecido.', value: (item) => item.totalValue, render: (item) => money(item.totalValue) },
    { key: 'avg', label: 'Valor médio', help: 'Valor médio conhecido.', value: (item) => item.averageFee, render: (item) => money(item.averageFee) },
    { key: 'age', label: 'Idade', help: 'Idade média dos jogadores.', value: (item) => item.averageAge ?? -1 },
    { key: 'ca', label: 'CA', help: 'CA médio.', value: (item) => item.averageCA ?? -1 },
  ], [])

  const maxTrend = Math.max(0, ...trends.map((item) => item.totalValue))
  const topClubs = clubs.slice(0, 5)
  const segments = useMemo(() => {
    const total = filtered.length || 1
    const definitions = [
      ['Promessas', filtered.filter((item) => (item.snapshot.age ?? 99) <= 21 && (item.potentialGap ?? 0) >= 15).length, '≤21 anos e PA–CA ≥15'],
      ['Titulares imediatos', filtered.filter((item) => (item.snapshot.age ?? 0) >= 22 && (item.snapshot.age ?? 99) <= 28 && (item.snapshot.currentAbility ?? 0) >= 135).length, '22–28 anos e CA ≥135'],
      ['Estrelas', filtered.filter((item) => (item.snapshot.currentAbility ?? 0) >= 155 || (item.snapshot.reputation ?? 0) >= 7500).length, 'CA ≥155 ou reputação elevada'],
      ['Experiência', filtered.filter((item) => (item.snapshot.age ?? 0) >= 29).length, '29 anos ou mais'],
    ] as const
    return definitions.map(([label, count, rule]) => ({ label, count, rule, pct: count / total * 100 }))
  }, [filtered])

  return <div className="page-stack">
    <Panel title="Mercado Intelligence" description="Avaliação cruzada das transferências, perfis dos jogadores, clubes, competições e treinadores.">
      <div className="ranking-tabs market-tabs">{([['overview', 'Visão geral'], ['transfers', 'Transferências'], ['clubs', 'Clubes'], ['competitions', 'Competições'], ['coaches', 'Treinadores'], ['positions', 'Posições'], ['players', 'Jogadores'], ['flows', 'Fluxos'], ['insights', 'Insights']] as [MarketTab, string][]).map(([id, label]) => <button key={id} className={tab === id ? 'is-active' : ''} onClick={() => setTab(id)}>{label}</button>)}</div>
      <div className="market-filter-grid">
        <label><span>De época</span><select value={filters.seasonFrom} onChange={(event) => patch({ seasonFrom: event.target.value })}>{data.seasons.map((item) => <option key={item.id} value={item.startYear}>{item.label}</option>)}</select></label>
        <label><span>Até época</span><select value={filters.seasonTo} onChange={(event) => patch({ seasonTo: event.target.value })}>{data.seasons.map((item) => <option key={item.id} value={item.startYear}>{item.label}</option>)}</select></label>
        <label><span>Continente</span><select value={filters.continent} onChange={(event) => patch({ continent: event.target.value, country: '', competitionId: '', clubId: '' })}><option value="">Todos</option>{continents.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>País</span><select value={filters.country} onChange={(event) => patch({ country: event.target.value, competitionId: '', clubId: '' })}><option value="">Todos</option>{countries.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Competição</span><select value={filters.competitionId} onChange={(event) => patch({ competitionId: event.target.value })}><option value="">Todas</option>{availableCompetitions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label><span>Clube</span><select value={filters.clubId} onChange={(event) => patch({ clubId: event.target.value })}><option value="">Todos</option>{availableClubs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label><span>Treinador</span><select value={filters.coachId} onChange={(event) => patch({ coachId: event.target.value })}><option value="">Todos</option>{data.coaches.slice().sort((a, b) => a.name.localeCompare(b.name, 'pt')).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label><span>Posição</span><select value={filters.position} onChange={(event) => patch({ position: event.target.value as MarketFilters['position'] })}><option value="">Todas</option>{['Guarda-redes', 'Defesas', 'Médios', 'Extremos', 'Avançados', 'Desconhecida'].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Idade</span><select value={filters.ageBand} onChange={(event) => patch({ ageBand: event.target.value as MarketFilters['ageBand'] })}><option value="all">Todas</option><option value="u21">Sub-21</option><option value="21-25">21–25</option><option value="26-30">26–30</option><option value="31+">31+</option></select></label>
        <label><span>Direção</span><select value={filters.direction} onChange={(event) => patch({ direction: event.target.value as MarketFilters['direction'] })}><option value="all">Entradas e saídas</option><option value="arrivals">Entradas</option><option value="departures">Saídas</option></select></label>
        <label><span>Valor mínimo (€)</span><input type="number" min={0} value={filters.minFee ?? ''} onChange={(event) => patch({ minFee: event.target.value ? Number(event.target.value) : null })} /></label>
        <label><span>Valor máximo (€)</span><input type="number" min={0} value={filters.maxFee ?? ''} onChange={(event) => patch({ maxFee: event.target.value ? Number(event.target.value) : null })} /></label>
        <label className="market-search"><span>Pesquisa</span><input placeholder="Jogador, clube, posição…" value={filters.query} onChange={(event) => patch({ query: event.target.value })} /></label>
      </div>
      <div className="action-row"><button className="secondary-button" onClick={reset}>Limpar filtros</button><button className="secondary-button" onClick={() => void refresh(true)}><RefreshCw size={15} /> Atualizar dados</button><span className="progress-chip">{loading ? 'A analisar o mercado…' : `${filtered.length.toLocaleString('pt-PT')} de ${data.transfers.length.toLocaleString('pt-PT')} transferências`}</span></div>
      {error && <div className="import-message status-error">{error}</div>}
    </Panel>

    {!loading && data.transfers.length === 0 && <Panel title="Sem transferências" description="O módulo necessita do bloco Transferências."><div className="empty-state"><strong>Importa o ficheiro de Transferências</strong><p>Para cruzamentos completos, importa também Jogadores, Estatísticas, Clubes, Treinadores e Classificações na mesma época.</p></div></Panel>}

    {data.transfers.length > 0 && <>
      {tab === 'overview' && <>
        <div className="stats-grid market-stats"><StatCard label="Movimentos" value={summary.transfers.toLocaleString('pt-PT')} detail={`${summary.knownFees.toLocaleString('pt-PT')} com valor conhecido`} /><StatCard label="Volume financeiro" value={money(summary.totalValue)} detail={`Média ${money(summary.averageFee)} · mediana ${money(summary.medianFee)}`} /><StatCard label="Idade média" value={number(summary.averageAge)} detail={`${percent(summary.under21Share)} Sub-21`} /><StatCard label="Qualidade média" value={`${number(summary.averageCA)} / ${number(summary.averagePA)}`} detail={`CA / PA · margem ${number(summary.averagePotentialGap)}`} /></div>
        <CoveragePanel issues={coverage} />
        <Panel title="Evolução por época" description="Volume, preço, idade e qualidade do mercado em cada época."><div className="market-trend-list">{trends.map((item) => <article key={item.seasonId}><div><strong>{item.season}</strong><small>{item.transfers} movimentos · idade {number(item.averageAge)} · CA {number(item.averageCA)} · PA {number(item.averagePA)}</small></div><MarketBar value={item.totalValue} max={maxTrend} label={item.season} /><span>{percent(item.under21Share)} jovens</span></article>)}</div></Panel>
        <div className="market-two-columns"><Panel title="Segmentos de investimento" description="Classificação explicável através de idade, CA, PA e reputação."><div className="market-segment-grid">{segments.map((item) => <article key={item.label}><strong>{item.label}</strong><span>{item.count.toLocaleString('pt-PT')} · {percent(item.pct)}</span><small>{item.rule}</small></article>)}</div></Panel><Panel title="Clubes com maior atividade" description="Top 5 pelo número total de entradas e saídas."><div className="market-leader-list">{topClubs.map((item, index) => <article key={item.id}><span>{index + 1}</span><div><strong>{item.name}</strong><small>{item.summary}</small></div><b>{item.transfers}</b></article>)}</div></Panel></div>
        <Panel title="Principais conclusões" description="Inferências determinísticas; não representam causalidade."><div className="score-insight-grid">{insights.slice(0, 8).map((item, index) => <article key={item.id}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item.title}</strong><p>{item.text}</p><small>Confiança {item.confidence} · {item.evidence}</small></div></article>)}</div></Panel>
      </>}

      {tab === 'transfers' && <Panel title="Todas as transferências" description="Tabela detalhada, ordenável e reorganizável. Os dados técnicos são cruzados pela época."><ReorderableScoreTable tableKey="market:transfers" columns={transferColumns} rows={filtered} rowKey={(item) => item.id} /></Panel>}
      {tab === 'clubs' && <Panel title="Estratégias de mercado dos clubes" description="Investimento, vendas, idade, qualidade, potencial, posições e orientação geográfica."><ReorderableScoreTable tableKey="market:clubs" columns={entityColumns} rows={clubs} rowKey={(item) => item.id} /></Panel>}
      {tab === 'competitions' && <Panel title="Perfil de mercado das competições" description="Agrega as transferências dos clubes participantes. Usa as subtabs para separar os quatro universos competitivos."><div className="ranking-tabs ranking-tabs--secondary">{([['all','Todas'],['super-league','Super Leagues'],['national','Ligas Nacionais'],['continental','Continentais'],['international','Internacionais']] as const).map(([id,label])=><button key={id} className={competitionScope===id?'is-active':''} onClick={()=>setCompetitionScope(id)}>{label}</button>)}</div><ReorderableScoreTable tableKey={`market:competitions:${competitionScope}`} columns={entityColumns} rows={visibleCompetitions} rowKey={(item) => item.id} /></Panel>}
      {tab === 'coaches' && <Panel title="Tendências de mercado dos treinadores" description="Transferências associadas ao clube treinado na época. Atribuição aproximada quando o cargo mudou durante a época."><ReorderableScoreTable tableKey="market:coaches" columns={entityColumns} rows={coaches} rowKey={(item) => item.id} /></Panel>}
      {tab === 'positions' && <Panel title="Mercado por posição" description="Procura, preço, idade, qualidade, potencial e salários por grupo posicional."><ReorderableScoreTable tableKey="market:positions" columns={positionColumns} rows={positions} rowKey={(item) => item.position} /></Panel>}
      {tab === 'players' && <Panel title="Histórico de mercado dos jogadores" description="Volume acumulado e lucro de trading estimado quando existe uma compra anterior identificável."><ReorderableScoreTable tableKey="market:players" columns={playerColumns} rows={players} rowKey={(item) => item.id} /></Panel>}
      {tab === 'flows' && <Panel title="Fluxos de mercado" description="Rotas mais frequentes e valiosas entre clubes, países ou continentes."><div className="ranking-tabs ranking-tabs--secondary"><button className={flowLevel === 'club' ? 'is-active' : ''} onClick={() => setFlowLevel('club')}>Clubes</button><button className={flowLevel === 'country' ? 'is-active' : ''} onClick={() => setFlowLevel('country')}>Países</button><button className={flowLevel === 'continent' ? 'is-active' : ''} onClick={() => setFlowLevel('continent')}>Continentes</button></div><ReorderableScoreTable tableKey={`market:flows:${flowLevel}`} columns={flowColumns} rows={flows} rowKey={(item) => item.id} /></Panel>}
      {tab === 'insights' && <>
        <CoveragePanel issues={coverage} />
        <Panel title="Insights automáticos" description="Padrões inferidos dos dados filtrados, com amostra e confiança explícitas."><div className="market-insight-grid">{insights.map((item) => <article key={item.id}><header><Info size={18} /><div><strong>{item.title}</strong><span className={`market-confidence is-${item.confidence}`}>{item.confidence}</span></div></header><p>{item.text}</p><small>{item.evidence}</small></article>)}</div></Panel>
        <Panel title="Correlações de mercado" description="Coeficiente de Pearson. Correlação não implica causalidade."><div className="market-correlation-grid">{correlations.map((item) => <article key={item.id}><div>{item.value === null ? <AlertTriangle size={20} /> : item.value >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}<strong>{item.label}</strong></div><b>{item.value === null ? '—' : item.value.toFixed(2)}</b><span>{item.interpretation}</span><small>Amostra: {item.sample.toLocaleString('pt-PT')}</small></article>)}</div></Panel>
        <Panel title="Metodologia" description="Como as inferências são construídas."><div className="market-method-grid"><article><BarChart3 size={20} /><strong>Perfis na mesma época</strong><p>Idade, CA, PA, valor, salário, reputação e posição são procurados no perfil do jogador da época da transferência.</p></article><article><Info size={20} /><strong>Contexto competitivo</strong><p>O clube é ligado às competições através de Classificações e Estatísticas. O país e continente vêm do cadastro de Clubes e Competições.</p></article><article><TrendingUp size={20} /><strong>Eficiência</strong><p>Preço/VP compara o valor pago com o valor de mercado. Lucro estimado liga uma venda à compra anterior reconhecida no mesmo clube.</p></article><article><AlertTriangle size={20} /><strong>Sem dados inventados</strong><p>Campos ausentes permanecem vazios e reduzem a cobertura. O painel de qualidade indica exatamente o que falta.</p></article></div></Panel>
      </>}
    </>}
    {selected && <EntityExplain row={selected} onClose={() => setSelected(null)} />}
  </div>
}
