import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Award, BarChart3, History, Info, LineChart, Search, ShoppingCart, Sparkles, Trophy, UserRound } from 'lucide-react'
import { Panel } from '../../../shared/components/Panel'
import { StatCard } from '../../../shared/components/StatCard'
import { ReorderableScoreTable, type ScoreTableColumn } from '../../scores/components/ReorderableScoreTable'
import { loadEntityProfile, loadProfileOptions } from '../services/profile-service'
import type { ClubRecordRow, CoachRecordRow, CompetitionRecordRow, EntityProfile, PlayerRecordRow, ProfileHistoryRow, ProfileKind, ProfileMarketSeason, ProfileOption, ProfileTab, StyleDimension } from '../types'
import { ProfileLineChart } from './ProfileCharts'
import { useAppNavigation } from '../../../app/AppNavigationContext'
import { EntityLink } from '../../../shared/components/EntityLink'

const money = (value?: number): string => value === undefined ? '—' : new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(value)
const number = (value?: number, digits = 1): string => value === undefined ? '—' : value.toLocaleString('pt-PT', { maximumFractionDigits: digits })
const percent = (value?: number): string => value === undefined ? '—' : `${number(value, 1)}%`
const labels: Record<ProfileKind, { singular: string; plural: string }> = {
  competition: { singular: 'competição', plural: 'competições' }, club: { singular: 'clube', plural: 'clubes' }, player: { singular: 'jogador', plural: 'jogadores' }, coach: { singular: 'treinador', plural: 'treinadores' },
}

function MarketTab({ profile }: { profile: EntityProfile }) {
  const market = profile.market
  const transferColumns: ScoreTableColumn<(typeof market.transfers)[number]>[] = [
    { key: 'season', label: 'Época', value: (row) => row.season?.label ?? row.seasonId },
    { key: 'player', label: 'Jogador', value: (row) => row.playerName, render: (row) => <EntityLink kind="player" id={row.playerId} name={row.playerName} /> },
    { key: 'from', label: 'Origem', value: (row) => row.from.club?.name ?? row.fromClubName, render: (row) => { const club = row.from.club; const name = club?.name ?? row.fromClubName; return name ? <EntityLink kind="club" id={club?.id} name={name} /> : '—' } },
    { key: 'to', label: 'Destino', value: (row) => row.to.club?.name ?? row.toClubName, render: (row) => { const club = row.to.club; const name = club?.name ?? row.toClubName; return name ? <EntityLink kind="club" id={club?.id} name={name} /> : '—' } },
    { key: 'fee', label: 'Valor', value: (row) => row.effectiveFee, render: (row) => row.feeKnown ? money(row.effectiveFee) : 'Não divulgado' },
    { key: 'age', label: 'Idade', value: (row) => row.snapshot.age },
    { key: 'position', label: 'Posição', value: (row) => row.snapshot.positionGroup },
    { key: 'ca', label: 'C.A.', value: (row) => row.snapshot.currentAbility, render: (row) => number(row.snapshot.currentAbility) },
    { key: 'pa', label: 'C.P.', value: (row) => row.snapshot.potentialAbility, render: (row) => number(row.snapshot.potentialAbility) },
    { key: 'marketValue', label: 'Valor mercado', value: (row) => row.snapshot.marketValue, render: (row) => money(row.snapshot.marketValue) },
  ]
  const seasonColumns: ScoreTableColumn<ProfileMarketSeason>[] = profile.kind === 'player' ? [
    { key: 'season', label: 'Época', value: (row) => row.season },
    { key: 'moves', label: 'Movimentos', value: (row) => row.arrivals },
    { key: 'value', label: 'Valor movimentado', value: (row) => row.spend, render: (row) => money(row.spend) },
    { key: 'age', label: 'Idade', value: (row) => row.averageBuyAge, render: (row) => number(row.averageBuyAge) },
    { key: 'ca', label: 'C.A.', value: (row) => row.averageBuyCA, render: (row) => number(row.averageBuyCA) },
    { key: 'pa', label: 'C.P.', value: (row) => row.averageBuyPA, render: (row) => number(row.averageBuyPA) },
  ] : [
    { key: 'season', label: 'Época', value: (row) => row.season },
    { key: 'arrivals', label: 'Entradas', value: (row) => row.arrivals },
    { key: 'departures', label: 'Saídas', value: (row) => row.departures },
    { key: 'spend', label: 'Investimento', value: (row) => row.spend, render: (row) => money(row.spend) },
    { key: 'income', label: 'Receita', value: (row) => row.income, render: (row) => money(row.income) },
    { key: 'balance', label: 'Balanço', value: (row) => row.balance, render: (row) => <span className={row.balance >= 0 ? 'market-positive' : 'market-negative'}>{money(row.balance)}</span> },
    { key: 'age', label: 'Idade compra', value: (row) => row.averageBuyAge, render: (row) => number(row.averageBuyAge) },
    { key: 'u21', label: 'Sub-21', value: (row) => row.under21Share, render: (row) => percent(row.under21Share) },
    { key: 'ca', label: 'C.A. compra', value: (row) => row.averageBuyCA, render: (row) => number(row.averageBuyCA) },
    { key: 'pa', label: 'C.P. compra', value: (row) => row.averageBuyPA, render: (row) => number(row.averageBuyPA) },
  ]
  const totalSpend = market.seasons.reduce((total, row) => total + row.spend, 0)
  const totalIncome = market.seasons.reduce((total, row) => total + row.income, 0)
  return <div className="page-stack">
    <div className="stats-grid profile-stats">
      <StatCard label="Movimentos" value={market.summary.transfers} detail={`${market.summary.knownFees} com valor conhecido`} />
      <StatCard label={profile.kind === 'player' ? 'Valor movimentado' : 'Investimento'} value={money(totalSpend)} detail={`média ${money(market.summary.averageFee)}`} />
      <StatCard label={profile.kind === 'player' ? 'Maior transferência' : 'Receita'} value={profile.kind === 'player' ? money(market.summary.maxFee) : money(totalIncome)} detail={profile.kind === 'player' ? `${market.summary.freeShare.toFixed(1)}% livres · ${market.summary.loanShare.toFixed(1)}% empréstimos` : `balanço ${money(totalIncome - totalSpend)}`} />
      <StatCard label="Idade média" value={number(market.summary.averageAge)} detail={`${percent(market.summary.under21Share)} Sub-21`} />
    </div>
    <Panel title="Perfil de mercado" description="Síntese determinística do padrão de contratações e vendas."><div className="profile-market-narrative"><ShoppingCart size={24} /><div><strong>{market.narrative}</strong><p>Cobertura de jogadores: {percent(market.summary.playerCoverage)} · perfis técnicos: {percent(market.summary.profileCoverage)} · C.A. média {number(market.summary.averageCA)} · C.P. média {number(market.summary.averagePA)}.</p></div></div></Panel>
    <Panel title="Balanço por época" description={profile.kind === 'player' ? 'Valor movimentado e perfil do jogador em cada mudança.' : 'Investimento, receita, idade e qualidade das entradas em cada temporada.'}><ReorderableScoreTable tableKey={`profile:${profile.kind}:${profile.id}:market-seasons`} columns={seasonColumns} rows={market.seasons} rowKey={(row) => row.seasonId} /></Panel>
    {!!market.positions.length && <Panel title="Preferências por posição" description="Distribuição do investimento e perfil técnico das posições contratadas."><div className="profile-position-grid">{market.positions.slice(0, 8).map((row) => <article key={row.position}><strong>{row.position}</strong><b>{money(row.totalValue)}</b><span>{row.transfers} movimentos · {number(row.share)}%</span><small>Idade {number(row.averageAge)} · C.A. {number(row.averageCA)} · C.P. {number(row.averagePA)}</small></article>)}</div></Panel>}
    {!!market.insights.length && <Panel title="Conclusões de mercado" description="Inferências com confiança dependente do tamanho e cobertura da amostra."><div className="market-insight-grid">{market.insights.slice(0, 8).map((item) => <article key={item.id}><header><Sparkles size={18} /><div><strong>{item.title}</strong><span className={`market-confidence is-${item.confidence}`}>{item.confidence}</span></div></header><p>{item.text}</p><small>{item.evidence}</small></article>)}</div></Panel>}
    <Panel title="Movimentos detalhados" description="Todas as transferências reconhecidas para esta entidade."><ReorderableScoreTable tableKey={`profile:${profile.kind}:${profile.id}:transfers`} columns={transferColumns} rows={market.transfers} rowKey={(row) => row.id} maxRows={500} /></Panel>
  </div>
}

function HistoryTab({ profile }: { profile: EntityProfile }) {
  const historyColumns: ScoreTableColumn<ProfileHistoryRow>[] = [
    { key: 'season', label: 'Época', value: (row) => row.season },
    { key: 'competition', label: 'Competição', value: (row) => row.competition, render: (row) => <EntityLink kind="competition" name={row.competition} /> },
    { key: 'champion', label: 'Campeão', value: (row) => row.champion, render: (row) => <EntityLink kind="club" name={row.champion} className={row.wonByEntity ? 'profile-winner' : ''} /> },
    { key: 'coach', label: 'Treinador campeão', value: (row) => row.coach, render: (row) => row.coach ? <EntityLink kind="coach" name={row.coach} /> : '—' },
    { key: 'runner', label: 'Finalista / 2.º', value: (row) => row.runnerUp, render: (row) => row.runnerUp ? <EntityLink kind="club" name={row.runnerUp} /> : '—' },
    { key: 'detail', label: 'Detalhe', value: (row) => row.detail },
  ]
  return <div className="page-stack">
    {!!profile.achievements.length && <Panel title="Palmarés da entidade" description="Títulos, promoções e finais reconhecidos nos dados importados."><div className="profile-timeline">{profile.achievements.map((item) => <article key={item.id}><span>{item.season}</span><div><strong>{item.achievement} · {item.competition}</strong><small>{[item.coach, item.detail].filter(Boolean).join(' · ')}</small></div><Trophy size={19} /></article>)}</div></Panel>}
    <Panel title="Campeões ao longo dos anos" description={profile.kind === 'club' ? 'Campeões das competições disputadas pelo clube; as épocas vencidas aparecem destacadas.' : 'Histórico oficial reconhecido por época, incluindo o treinador associado ao campeão.'}><ReorderableScoreTable tableKey={`profile:${profile.kind}:${profile.id}:history`} columns={historyColumns} rows={profile.history} rowKey={(row) => row.id} /></Panel>
  </div>
}

function HallTab({ profile }: { profile: EntityProfile }) {
  const playerColumns: ScoreTableColumn<PlayerRecordRow>[] = [
    { key: 'name', label: 'Jogador', value: (row) => row.name, render: (row) => <EntityLink kind="player" id={row.id} name={row.name} /> },
    { key: 'nationality', label: 'Nacionalidade', value: (row) => row.nationality, render: (row) => row.nationality ? <EntityLink kind="country" name={row.nationality} /> : '—' },
    { key: 'seasons', label: 'Épocas', value: (row) => row.seasons },
    { key: 'apps', label: 'Jogos', value: (row) => row.appearances },
    { key: 'minutes', label: 'Minutos', value: (row) => row.minutes },
    { key: 'goals', label: 'Golos', value: (row) => row.goals },
    { key: 'assists', label: 'Assistências', value: (row) => row.assists },
    { key: 'g90', label: 'Golos/90', value: (row) => row.goalsPer90, render: (row) => number(row.goalsPer90, 2) },
    { key: 'a90', label: 'Ast/90', value: (row) => row.assistsPer90, render: (row) => number(row.assistsPer90, 2) },
    { key: 'rating', label: 'Avaliação', value: (row) => row.averageRating, render: (row) => number(row.averageRating, 2) },
  ]
  const clubColumns: ScoreTableColumn<ClubRecordRow>[] = [
    { key: 'name', label: 'Clube / seleção', value: (row) => row.name, render: (row) => <EntityLink kind="club" id={row.id} name={row.name} /> }, { key: 'seasons', label: 'Épocas', value: (row) => row.seasons }, { key: 'titles', label: 'Títulos', value: (row) => row.titles }, { key: 'promotions', label: 'Subidas', value: (row) => row.promotions }, { key: 'played', label: 'Jogos', value: (row) => row.played }, { key: 'wins', label: 'Vitórias', value: (row) => row.wins }, { key: 'gf', label: 'Golos', value: (row) => row.goalsFor }, { key: 'ga', label: 'Sofridos', value: (row) => row.goalsAgainst }, { key: 'points', label: 'Pontos', value: (row) => row.points },
  ]
  const coachColumns: ScoreTableColumn<CoachRecordRow>[] = [
    { key: 'name', label: 'Treinador', value: (row) => row.name, render: (row) => <EntityLink kind="coach" id={row.id} name={row.name} /> }, { key: 'seasons', label: 'Épocas', value: (row) => row.seasons }, { key: 'titles', label: 'Títulos', value: (row) => row.titles }, { key: 'clubs', label: 'Clubes/seleções', value: (row) => row.clubs.join(', ') }, { key: 'winRate', label: '% Vitórias', value: (row) => row.averageWinRate, render: (row) => percent(row.averageWinRate) },
  ]
  const competitionColumns: ScoreTableColumn<CompetitionRecordRow>[] = [
    { key: 'name', label: 'Competição', value: (row) => row.name, render: (row) => <EntityLink kind="competition" id={row.id} name={row.name} /> }, { key: 'seasons', label: 'Épocas', value: (row) => row.seasons }, { key: 'titles', label: 'Títulos', value: (row) => row.titles }, { key: 'best', label: 'Melhor posição', value: (row) => row.bestPosition }, { key: 'points', label: 'Pontos', value: (row) => row.points }, { key: 'goals', label: 'Golos', value: (row) => row.goalsFor },
  ]
  return <div className="page-stack">
    {(profile.kind === 'player' || profile.kind === 'coach') && !!profile.achievements.length && <Panel title="Conquistas da carreira" description="Títulos e promoções associados às épocas e entidades representadas."><div className="profile-timeline">{profile.achievements.map((item) => <article key={item.id}><span>{item.season}</span><div><strong>{item.achievement} · {item.competition}</strong><small>{[item.coach, item.detail].filter(Boolean).join(' · ')}</small></div><Trophy size={19} /></article>)}</div></Panel>}
    <Panel title="Melhores jogadores" description={profile.kind === 'competition' ? 'Apenas estatísticas produzidas nesta competição.' : profile.kind === 'club' ? 'Apenas estatísticas produzidas ao serviço deste clube.' : 'Registos ligados à carreira desta entidade.'}><ReorderableScoreTable tableKey={`profile:${profile.kind}:${profile.id}:hof-players`} columns={playerColumns} rows={profile.hall.players} rowKey={(row) => row.id} maxRows={250} /></Panel>
    {!!profile.hall.clubs.length && <Panel title="Melhores clubes ou seleções" description="Classificação histórica por títulos, pontos, vitórias e produção ofensiva."><ReorderableScoreTable tableKey={`profile:${profile.kind}:${profile.id}:hof-clubs`} columns={clubColumns} rows={profile.hall.clubs} rowKey={(row) => row.id} /></Panel>}
    {!!profile.hall.coaches.length && <Panel title="Treinadores de referência" description="Títulos e épocas associados à entidade."><ReorderableScoreTable tableKey={`profile:${profile.kind}:${profile.id}:hof-coaches`} columns={coachColumns} rows={profile.hall.coaches} rowKey={(row) => row.id} /></Panel>}
    {!!profile.hall.competitions.length && <Panel title="Competições de referência" description="Desempenho histórico da entidade por competição."><ReorderableScoreTable tableKey={`profile:${profile.kind}:${profile.id}:hof-competitions`} columns={competitionColumns} rows={profile.hall.competitions} rowKey={(row) => row.id} /></Panel>}
  </div>
}

function StyleTab({ profile }: { profile: EntityProfile }) {
  const style = profile.style
  if (!style) return <Panel title="Estilo de jogo" description="Esta análise está disponível para competições, clubes e treinadores."><div className="empty-state"><strong>Não aplicável a este perfil</strong></div></Panel>
  const columns: ScoreTableColumn<StyleDimension>[] = [
    { key: 'dimension', label: 'Dimensão', value: (row) => row.label },
    { key: 'score', label: 'Índice', value: (row) => row.score, render: (row) => <strong>{number(row.score, 0)}</strong> },
    { key: 'coverage', label: 'Cobertura', value: (row) => row.coverage, render: (row) => percent(row.coverage) },
    { key: 'interpretation', label: 'Interpretação', value: (row) => row.interpretation },
    { key: 'evidence', label: 'Indicadores', value: (row) => row.details.map((item) => item.label).join(', '), render: (row) => <span title={row.details.map((item) => `${item.label}: ${number(item.index, 0)} · cobertura ${percent(item.coverage)}`).join('\n')}>{row.details.filter((item) => item.index !== undefined).map((item) => `${item.label} ${number(item.index, 0)}`).join(' · ') || 'Sem dados'}</span> },
  ]
  return <div className="page-stack">
    <Panel title="Identidade de jogo" description={`Inferência baseada em ${style.samplePlayers.toLocaleString('pt-PT')} jogadores e ${style.sampleRows.toLocaleString('pt-PT')} linhas estatísticas.`}><div className="profile-style-identity"><BarChart3 size={28} /><div><strong>{style.identity}</strong><p>Índice 100 representa a média global da base. Valores acima de 100 indicam maior presença relativa daquela característica.</p></div></div></Panel>
    <div className="profile-style-grid">{style.dimensions.map((item) => <article key={item.id}><header><strong>{item.label}</strong><b>{number(item.score, 0)}</b></header><div className="profile-style-meter"><i style={{ width: `${clampVisual(item.score)}%` }} /></div><span>{item.interpretation} · cobertura {percent(item.coverage)}</span><small>{item.details.filter((detail) => detail.index !== undefined).slice(0, 3).map((detail) => `${detail.label} ${number(detail.index, 0)}`).join(' · ') || 'Sem indicadores reconhecidos'}</small></article>)}</div>
    <div className="profile-two-columns"><Panel title="Pontos fortes" description="Dimensões mais acima da média global."><div className="profile-bullet-list">{style.strengths.map((item) => <p key={item}><Award size={17} />{item}</p>)}{!style.strengths.length && <p>Sem força estatística identificável.</p>}</div></Panel><Panel title="Limitações da análise" description="Cobertura insuficiente ou variáveis em falta."><div className="profile-bullet-list is-warning">{style.limitations.map((item) => <p key={item}><AlertTriangle size={17} />{item}</p>)}{!style.limitations.length && <p>Cobertura suficiente nas principais dimensões.</p>}</div></Panel></div>
    <Panel title="Decomposição do estilo" description="Todos os índices, coberturas e indicadores utilizados."><ReorderableScoreTable tableKey={`profile:${profile.kind}:${profile.id}:style`} columns={columns} rows={style.dimensions} rowKey={(row) => row.id} /></Panel>
  </div>
}
function clampVisual(score?: number): number { return score === undefined ? 0 : Math.max(0, Math.min(100, (score - 45) / 115 * 100)) }

function EvolutionTab({ profile }: { profile: EntityProfile }) {
  return <div className="profile-evolution-grid">{profile.evolution.map((series) => <article className="profile-evolution-card" key={series.id}><header><div><strong>{series.label}</strong><p>{series.description}</p></div><LineChart size={20} /></header><ProfileLineChart series={series} /></article>)}</div>
}

function OverviewTab({ profile }: { profile: EntityProfile }) {
  return <div className="page-stack">
    <div className="stats-grid profile-stats">{profile.kpis.map((item) => <StatCard key={item.label} label={item.label} value={item.value} detail={item.detail} />)}</div>
    <div className="profile-two-columns"><Panel title="Identificação" description="Dados canónicos e contexto mais recente."><div className="profile-facts">{profile.facts.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div></Panel><Panel title="Cobertura e alertas" description="Informação em falta que limita algumas análises."><div className="profile-warning-list">{profile.dataWarnings.map((warning) => <p key={warning}><AlertTriangle size={17} />{warning}</p>)}{!profile.dataWarnings.length && <p className="is-ok"><Info size={17} />Não foram detetadas limitações estruturais neste perfil.</p>}</div></Panel></div>
    <Panel title="Leitura rápida" description="Acesso direto às principais dimensões do perfil."><div className="profile-quick-grid"><article><ShoppingCart /><strong>{profile.market.narrative}</strong><span>{profile.market.summary.transfers} movimentos reconhecidos</span></article>{profile.style && <article><BarChart3 /><strong>{profile.style.identity}</strong><span>{profile.style.samplePlayers} jogadores na amostra</span></article>}<article><Trophy /><strong>{profile.achievements.length} conquistas registadas</strong><span>{profile.hall.players.length} jogadores no Hall of Fame</span></article><article><LineChart /><strong>{profile.evolution.length} séries de evolução</strong><span>métricas técnicas, financeiras e reputacionais</span></article></div></Panel>
  </div>
}

export function ProfileView({ kind }: { kind: ProfileKind }) {
  const { target } = useAppNavigation()
  const [options, setOptions] = useState<ProfileOption[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [query, setQuery] = useState('')
  const [profile, setProfile] = useState<EntityProfile | null>(null)
  const [tab, setTab] = useState<ProfileTab>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    setLoading(true)
    void loadProfileOptions(kind).then((rows) => {
      if (!active) return
      setOptions(rows)
      setSelectedId((current) => {
        if (target?.kind === kind) {
          const direct = target.id ? rows.find((row) => row.id === target.id) : rows.find((row) => row.name === target.name)
          if (direct) return direct.id
        }
        return current && rows.some((row) => row.id === current) ? current : rows[0]?.id ?? ''
      })
      setLoading(false)
    }).catch((reason: unknown) => { if (active) { setError(reason instanceof Error ? reason.message : String(reason)); setLoading(false) } })
    return () => { active = false }
  }, [kind, target?.nonce])
  useEffect(() => {
    if (target?.kind !== kind || !options.length) return
    const direct = target.id ? options.find((row) => row.id === target.id) : options.find((row) => row.name === target.name)
    if (direct) setSelectedId(direct.id)
  }, [target?.nonce, kind, options])
  useEffect(() => {
    if (!selectedId) { setProfile(null); return }
    let active = true
    setLoading(true); setError('')
    void loadEntityProfile(kind, selectedId).then((value) => { if (active) { setProfile(value); setLoading(false) } }).catch((reason: unknown) => { if (active) { setError(reason instanceof Error ? reason.message : String(reason)); setLoading(false) } })
    return () => { active = false }
  }, [kind, selectedId])
  const filteredOptions = useMemo(() => {
    const key = query.trim().toLocaleLowerCase('pt-PT')
    return key ? options.filter((item) => `${item.name} ${item.subtitle ?? ''}`.toLocaleLowerCase('pt-PT').includes(key)).slice(0, 250) : options.slice(0, 250)
  }, [options, query])
  const tabs: Array<{ id: ProfileTab; label: string; icon: typeof UserRound }> = [
    { id: 'overview', label: 'Visão geral', icon: UserRound }, { id: 'market', label: 'Mercado', icon: ShoppingCart },
    ...(kind === 'competition' || kind === 'club' ? [{ id: 'history' as const, label: 'Histórico', icon: History }] : []),
    { id: 'hall', label: 'Hall of Fame', icon: Trophy },
    ...(kind !== 'player' ? [{ id: 'style' as const, label: 'Estilo de jogo', icon: BarChart3 }] : []),
    { id: 'evolution', label: 'Evolução', icon: LineChart },
  ]
  return <div className="page-stack profile-page">
    <Panel title={`Selecionar ${labels[kind].singular}`} description={`Pesquisa e abre o perfil individual entre ${options.length.toLocaleString('pt-PT')} ${labels[kind].plural}.`}><div className="profile-selector"><label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Pesquisar ${labels[kind].singular}…`} /></label><select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{filteredOptions.map((item) => <option key={item.id} value={item.id}>{item.name}{item.subtitle ? ` — ${item.subtitle}` : ''}</option>)}</select><span>{filteredOptions.length.toLocaleString('pt-PT')} resultados visíveis</span></div></Panel>
    {error && <div className="import-message status-error">{error}</div>}
    {loading && <Panel title="A construir perfil" description="A cruzar histórico, mercado, estatísticas, atributos e evolução."><div className="empty-state"><strong>A analisar dados…</strong></div></Panel>}
    {!loading && !profile && <Panel title="Sem perfil" description="A entidade selecionada não foi encontrada."><div className="empty-state"><strong>Sem dados disponíveis</strong></div></Panel>}
    {!loading && profile && <>
      <section className="profile-hero"><div className="profile-hero__mark">{profile.name.slice(0, 2).toUpperCase()}</div><div><span>{profile.badge ?? labels[kind].singular}</span><h2>{profile.name}</h2><p>{profile.subtitle || 'Sem contexto adicional reconhecido'}</p></div><div className="profile-hero__facts">{profile.facts.slice(0, 3).map((item) => <div key={item.label}><small>{item.label}</small><strong>{item.value}</strong></div>)}</div></section>
      <div className="ranking-tabs profile-tabs">{tabs.map((item) => { const Icon = item.icon; return <button key={item.id} className={tab === item.id ? 'is-active' : ''} onClick={() => setTab(item.id)}><Icon size={16} />{item.label}</button> })}</div>
      {tab === 'overview' && <OverviewTab profile={profile} />}
      {tab === 'market' && <MarketTab profile={profile} />}
      {tab === 'history' && <HistoryTab profile={profile} />}
      {tab === 'hall' && <HallTab profile={profile} />}
      {tab === 'style' && <StyleTab profile={profile} />}
      {tab === 'evolution' && <EvolutionTab profile={profile} />}
    </>}
  </div>
}
