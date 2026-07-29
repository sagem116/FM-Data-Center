import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { GripVertical } from 'lucide-react'
import { Panel } from '../../../shared/components/Panel'
import { EntityLink } from '../../../shared/components/EntityLink'
import { loadRankingConfig } from '../config/ranking-config-store'
import type { RankingEntity, RankingMode, RankingModule } from '../config/default-ranking-config'
import type { RankingEntry, RankingResult } from '../engine/ranking-engine'
import { loadRankings } from '../services/rankings-service'
import type { Competition, Season } from '../../../shared/types/entities'
import { loadActiveChallenges } from '../../challenges/challenges'
import { mergeColumnOrder, moveColumn } from '../utils/column-order'

const entities: { id: RankingEntity; label: string }[] = [
  { id: 'clubs', label: 'Clubes' },
  { id: 'coaches', label: 'Treinadores' },
  { id: 'countries', label: 'Países' },
  { id: 'players', label: 'Jogadores' },
  { id: 'competitions', label: 'Competições' },
]
const modules: { id: RankingModule; label: string }[] = [
  { id: 'all', label: 'Unificado' },
  { id: 'superleague', label: 'Super League' },
  { id: 'national', label: 'Ligas Nacionais' },
  { id: 'continental', label: 'Continentais' },
  { id: 'international', label: 'Internacionais' },
]
const fmt = (n: unknown, d = 2) => typeof n === 'number' ? new Intl.NumberFormat('pt-PT', { maximumFractionDigits: d }).format(n) : '—'
const money = (n: unknown) => typeof n === 'number' ? new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(n) : '—'
const tip = (entry: RankingEntry, kind?: string) => entry.achievements.filter((achievement) => !kind || achievement.kind === kind).map((achievement) => `${achievement.seasonLabel} — ${achievement.competition}: ${achievement.detail}`).join('\n') || 'Sem conquistas registadas'
type SortDirection = 'asc' | 'desc'
const compareValues = (a: unknown, b: unknown, direction: SortDirection) => {
  const factor = direction === 'asc' ? 1 : -1
  if (typeof a === 'number' && typeof b === 'number') return (a - b) * factor
  return String(a ?? '').localeCompare(String(b ?? ''), 'pt', { numeric: true, sensitivity: 'base' }) * factor
}

interface RankingColumn {
  key: string
  label: string
  sortable?: boolean
  value?: (entry: RankingEntry) => unknown
  render: (entry: RankingEntry) => ReactNode
}

type ColumnOrderMap = Record<string, string[]>
const COLUMN_ORDER_KEY = 'fm-data-center-ranking-column-orders-v1'
function loadColumnOrders(): ColumnOrderMap {
  try {
    return JSON.parse(localStorage.getItem(COLUMN_ORDER_KEY) ?? '{}') as ColumnOrderMap
  } catch {
    return {}
  }
}
function persistColumnOrders(orders: ColumnOrderMap) {
  localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(orders))
}

export function RankingsPage() {
  const [entity, setEntity] = useState<RankingEntity>('clubs')
  const [module, setModule] = useState<RankingModule>('all')
  const [mode, setMode] = useState<RankingMode>('weighted')
  const [withDecay, setWithDecay] = useState(true)
  const [seasonId, setSeasonId] = useState('all')
  const [seasonFromId, setSeasonFromId] = useState('all')
  const [seasonToId, setSeasonToId] = useState('all')
  const [competitionId, setCompetitionId] = useState('all')
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [continent, setContinent] = useState('')
  const [position, setPosition] = useState('')
  const [minAge, setMinAge] = useState('')
  const [maxAge, setMaxAge] = useState('')
  const [minMinutes, setMinMinutes] = useState('')
  const [limit, setLimit] = useState(100)
  const [clubView, setClubView] = useState<'ranking' | 'statistics'>('ranking')
  const [sortKey, setSortKey] = useState('rank')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [columnOrders, setColumnOrders] = useState<ColumnOrderMap>(loadColumnOrders)
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [result, setResult] = useState<RankingResult>({ entries: [], totalContributions: 0 })
  const [seasons, setSeasons] = useState<Season[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [selected, setSelected] = useState<RankingEntry | null>(null)
  const [loading, setLoading] = useState(false)
  const [rev, setRev] = useState(0)

  useEffect(() => {
    const handleChange = () => setRev((value) => value + 1)
    window.addEventListener('fm:challenges-changed', handleChange)
    window.addEventListener('fm-ranking-config-changed', handleChange)
    return () => {
      window.removeEventListener('fm:challenges-changed', handleChange)
      window.removeEventListener('fm-ranking-config-changed', handleChange)
    }
  }, [])

  useEffect(() => {
    let live = true
    setLoading(true)
    void loadRankings({
      config: loadRankingConfig(),
      entity,
      module,
      mode,
      withDecay,
      seasonId: seasonId === 'all' ? undefined : seasonId,
      seasonFromId: seasonFromId === 'all' ? undefined : seasonFromId,
      seasonToId: seasonToId === 'all' ? undefined : seasonToId,
      competitionId: competitionId === 'all' ? undefined : competitionId,
      challenges: loadActiveChallenges(),
    }).then((data) => {
      if (live) {
        setResult(data.result)
        setSeasons(data.seasons)
        setCompetitions(data.competitions)
      }
    }).finally(() => {
      if (live) setLoading(false)
    })
    return () => { live = false }
  }, [entity, module, mode, withDecay, seasonId, seasonFromId, seasonToId, competitionId, rev])

  const continentOptions = useMemo(() => [...new Set(result.entries.map((entry) => String(entry.meta?.continent ?? '')).filter(Boolean))].sort(), [result])
  const metaValue = (entry: RankingEntry, key: string) => {
    const meta = entry.meta ?? {}
    const values: Record<string, unknown> = {
      reputation: meta.reputation,
      clubs: meta.clubs,
      players: meta.players,
      appearances: meta.appearances,
      goals: meta.goals,
      assists: meta.assists,
      averageRating: meta.averageRating ?? meta.rating,
      rating: meta.rating,
      ca: meta.ca,
      pa: meta.pa,
      club: meta.club,
      position: meta.position,
      age: meta.age,
      nationality: meta.nationality,
      minutes: meta.minutes,
      xg: meta.xg,
      country: meta.country,
      continent: meta.continent,
      averageAge: meta.averageAge,
      totalValue: meta.totalValue,
      winRate: meta.winRate,
      careerTitles: meta.titles,
      averageMarketValue: meta.averageMarketValue,
      averageWage: meta.averageWage,
      averageClubReputation: meta.averageClubReputation,
    }
    return values[key]
  }

  const viewKey = `${entity}:${entity === 'clubs' ? clubView : 'default'}`
  const rankingColumns: RankingColumn[] = [
    { key: 'total', label: 'Total', value: (entry) => mode === 'weighted' ? entry.weighted : entry.raw, render: (entry) => fmt(mode === 'weighted' ? entry.weighted : entry.raw) },
    { key: 'raw', label: 'Bruto', value: (entry) => entry.competitiveRaw, render: (entry) => fmt(entry.competitiveRaw) },
    { key: 'challenges', label: 'Desafios', value: (entry) => entry.challengePoints, render: (entry) => <span title={entry.challengeAwards.map((award) => `${award.name}: +${award.bonus} (${award.years.join(', ')})`).join('\n') || 'Sem desafios'}>{fmt(entry.challengePoints)}</span> },
    { key: 'titles', label: 'Títulos', value: (entry) => entry.titles, render: (entry) => <span title={tip(entry, 'title')}>{entry.titles}</span> },
    { key: 'promotions', label: 'Subidas', value: (entry) => entry.promotions, render: (entry) => <span title={tip(entry, 'promotion')}>{entry.promotions}</span> },
    { key: 'nearPromotions', label: 'Quase Subida', value: (entry) => entry.nearPromotions, render: (entry) => <span title={tip(entry, 'near-promotion')}>{entry.nearPromotions}</span> },
    { key: 'nearTitles', label: 'Quase Campeão', value: (entry) => entry.nearTitles, render: (entry) => <span title={tip(entry, 'near-title')}>{entry.nearTitles}</span> },
    { key: 'actions', label: 'Ações', sortable: false, render: (entry) => <button className="secondary-button" onClick={() => setSelected(entry)}>Explicar</button> },
  ]
  const metaColumns: Record<string, RankingColumn> = {
    reputation: { key: 'reputation', label: 'Reputação', value: (entry) => metaValue(entry, 'reputation'), render: (entry) => fmt(metaValue(entry, 'reputation')) },
    clubs: { key: 'clubs', label: 'Clubes', value: (entry) => metaValue(entry, 'clubs'), render: (entry) => fmt(metaValue(entry, 'clubs')) },
    players: { key: 'players', label: 'Jogadores', value: (entry) => metaValue(entry, 'players'), render: (entry) => fmt(metaValue(entry, 'players')) },
    appearances: { key: 'appearances', label: 'Jogos', value: (entry) => metaValue(entry, 'appearances'), render: (entry) => fmt(metaValue(entry, 'appearances')) },
    goals: { key: 'goals', label: 'Golos', value: (entry) => metaValue(entry, 'goals'), render: (entry) => fmt(metaValue(entry, 'goals')) },
    assists: { key: 'assists', label: 'Assist.', value: (entry) => metaValue(entry, 'assists'), render: (entry) => fmt(metaValue(entry, 'assists')) },
    averageRating: { key: 'averageRating', label: 'Avaliação', value: (entry) => metaValue(entry, 'averageRating'), render: (entry) => fmt(metaValue(entry, 'averageRating')) },
    rating: { key: 'rating', label: 'Aval.', value: (entry) => metaValue(entry, 'rating'), render: (entry) => fmt(metaValue(entry, 'rating')) },
    ca: { key: 'ca', label: 'CA', value: (entry) => metaValue(entry, 'ca'), render: (entry) => fmt(metaValue(entry, 'ca')) },
    pa: { key: 'pa', label: 'PA', value: (entry) => metaValue(entry, 'pa'), render: (entry) => fmt(metaValue(entry, 'pa')) },
    club: { key: 'club', label: 'Clube', value: (entry) => metaValue(entry, 'club'), render: (entry) => { const name=String(metaValue(entry,'club')??''); return name?<EntityLink kind="club" name={name}/>: '—' } },
    position: { key: 'position', label: 'Posição', value: (entry) => metaValue(entry, 'position'), render: (entry) => String(metaValue(entry, 'position') ?? '—') },
    age: { key: 'age', label: 'Idade', value: (entry) => metaValue(entry, 'age'), render: (entry) => fmt(metaValue(entry, 'age')) },
    nationality: { key: 'nationality', label: 'Nac.', value: (entry) => metaValue(entry, 'nationality'), render: (entry) => { const name=String(metaValue(entry,'nationality')??''); return name?<EntityLink kind="country" name={name}/>: '—' } },
    minutes: { key: 'minutes', label: 'Minutos', value: (entry) => metaValue(entry, 'minutes'), render: (entry) => fmt(metaValue(entry, 'minutes')) },
    xg: { key: 'xg', label: 'xG', value: (entry) => metaValue(entry, 'xg'), render: (entry) => fmt(metaValue(entry, 'xg')) },
    country: { key: 'country', label: 'País', value: (entry) => metaValue(entry, 'country'), render: (entry) => { const name=String(metaValue(entry,'country')??''); return name?<EntityLink kind="country" name={name}/>: '—' } },
    continent: { key: 'continent', label: 'Continente', value: (entry) => metaValue(entry, 'continent'), render: (entry) => String(metaValue(entry, 'continent') ?? '—') },
    averageAge: { key: 'averageAge', label: 'Idade média', value: (entry) => metaValue(entry, 'averageAge'), render: (entry) => fmt(metaValue(entry, 'averageAge')) },
    totalValue: { key: 'totalValue', label: 'Valor total', value: (entry) => metaValue(entry, 'totalValue'), render: (entry) => money(metaValue(entry, 'totalValue')) },
    winRate: { key: 'winRate', label: '% Vitórias', value: (entry) => metaValue(entry, 'winRate'), render: (entry) => fmt(metaValue(entry, 'winRate')) },
    careerTitles: { key: 'careerTitles', label: 'Títulos carreira', value: (entry) => metaValue(entry, 'careerTitles'), render: (entry) => fmt(metaValue(entry, 'careerTitles')) },
    averageMarketValue: { key: 'averageMarketValue', label: 'Valor médio', value: (entry) => metaValue(entry, 'averageMarketValue'), render: (entry) => money(metaValue(entry, 'averageMarketValue')) },
    averageWage: { key: 'averageWage', label: 'Salário médio', value: (entry) => metaValue(entry, 'averageWage'), render: (entry) => money(metaValue(entry, 'averageWage')) },
    averageClubReputation: { key: 'averageClubReputation', label: 'Reputação média clubes', value: (entry) => metaValue(entry, 'averageClubReputation'), render: (entry) => fmt(metaValue(entry, 'averageClubReputation')) },
  }
  const metaKeys = entity === 'competitions'
    ? ['reputation', 'averageMarketValue', 'averageWage', 'averageClubReputation', 'clubs', 'players', 'appearances', 'goals', 'assists', 'averageRating', 'ca', 'pa']
    : entity === 'players'
      ? ['club', 'position', 'age', 'nationality', 'appearances', 'minutes', 'goals', 'assists', 'xg', 'rating', 'ca', 'pa']
      : entity === 'clubs' && clubView === 'statistics'
        ? ['country', 'continent', 'players', 'appearances', 'goals', 'assists', 'averageAge', 'totalValue', 'averageRating']
        : entity === 'coaches'
          ? ['club', 'continent', 'winRate', 'careerTitles']
          : []
  const columns = useMemo(() => {
    const base: RankingColumn[] = [
      { key: 'rank', label: '#', value: (entry) => entry.rank, render: (entry) => entry.rank },
      { key: 'name', label: 'Entidade', value: (entry) => entry.name, render: (entry) => <EntityLink kind={entity==='clubs'?'club':entity==='coaches'?'coach':entity==='countries'?'country':entity==='players'?'player':'competition'} id={entity==='countries'?undefined:entry.entityId} name={entry.name}/> },
      ...metaKeys.map((key) => metaColumns[key]),
    ]
    if (!(entity === 'clubs' && clubView === 'statistics') && entity !== 'competitions') base.push(...rankingColumns)
    const order = mergeColumnOrder(columnOrders[viewKey], base.map((column) => column.key))
    const byKey = new Map(base.map((column) => [column.key, column]))
    return order.map((key) => byKey.get(key)).filter((column): column is RankingColumn => Boolean(column))
  }, [entity, clubView, mode, columnOrders, viewKey])

  const columnMap = useMemo(() => new Map(columns.map((column) => [column.key, column])), [columns])
  const entries = useMemo(() => result.entries.filter((entry) => {
    const meta = entry.meta ?? {}
    if (search && !entry.name.toLowerCase().includes(search.toLowerCase())) return false
    if (country && !String(meta.country ?? meta.nationality ?? '').toLowerCase().includes(country.toLowerCase())) return false
    if (continent && String(meta.continent ?? '') !== continent) return false
    if (position && !String(meta.position ?? '').toLowerCase().includes(position.toLowerCase())) return false
    if (minAge && Number(meta.age ?? meta.averageAge ?? 0) < Number(minAge)) return false
    if (maxAge && Number(meta.age ?? meta.averageAge ?? 999) > Number(maxAge)) return false
    if (minMinutes && Number(meta.minutes ?? 0) < Number(minMinutes)) return false
    return true
  }).sort((a, b) => {
    const column = columnMap.get(sortKey)
    return compareValues(column?.value?.(a), column?.value?.(b), sortDirection)
  }).slice(0, limit), [result, search, country, continent, position, minAge, maxAge, minMinutes, limit, sortKey, sortDirection, columnMap])

  const toggleSort = (key: string) => {
    const column = columnMap.get(key)
    if (column?.sortable === false) return
    if (sortKey === key) setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc')
    else {
      setSortKey(key)
      setSortDirection(key === 'rank' || key === 'name' ? 'asc' : 'desc')
    }
  }
  const reorderColumn = (target: string) => {
    if (!draggedColumn) return
    const currentOrder = columns.map((column) => column.key)
    const nextOrder = moveColumn(currentOrder, draggedColumn, target)
    const next = { ...columnOrders, [viewKey]: nextOrder }
    setColumnOrders(next)
    persistColumnOrders(next)
    setDraggedColumn(null)
  }
  const resetColumnOrder = () => {
    const next = { ...columnOrders }
    delete next[viewKey]
    setColumnOrders(next)
    persistColumnOrders(next)
  }
  const clearFilters = () => {
    setSearch('')
    setCountry('')
    setContinent('')
    setPosition('')
    setMinAge('')
    setMaxAge('')
    setMinMinutes('')
    setCompetitionId('all')
    setSeasonId('all')
    setSeasonFromId('all')
    setSeasonToId('all')
  }

  return <div className="page-stack">
    <Panel title="Rankings" description="Rankings por entidade, intervalo de épocas, competição, continente, métricas, conquistas e Desafios.">
      <div className="ranking-tabs">{entities.map((item) => <button key={item.id} className={entity === item.id ? 'is-active' : ''} onClick={() => setEntity(item.id)}>{item.label}</button>)}</div>
      {entity === 'clubs' && <div className="ranking-tabs ranking-tabs--secondary"><button className={clubView === 'ranking' ? 'is-active' : ''} onClick={() => setClubView('ranking')}>Ranking</button><button className={clubView === 'statistics' ? 'is-active' : ''} onClick={() => setClubView('statistics')}>Estatísticas</button></div>}
      <div className="ranking-toolbar"><div className="ranking-tabs ranking-tabs--secondary">{modules.map((item) => <button key={item.id} className={module === item.id ? 'is-active' : ''} onClick={() => setModule(item.id)}>{item.label}</button>)}</div><select value={mode} onChange={(event) => setMode(event.target.value as RankingMode)}><option value="weighted">Ponderado</option><option value="raw">Bruto</option></select><label className="toggle-label"><input type="checkbox" checked={withDecay} onChange={(event) => setWithDecay(event.target.checked)} />Com decaimento</label><select value={limit} onChange={(event) => setLimit(Number(event.target.value))}>{[10, 25, 50, 100, 1000].map((value) => <option key={value} value={value}>{value === 1000 ? 'Todos' : `Top ${value}`}</option>)}</select><button className="secondary-button" onClick={resetColumnOrder}>Repor ordem das colunas</button></div>
      <details className="filters-panel" open><summary>Filtros</summary><div className="filter-grid">
        <input placeholder="Pesquisar entidade" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select value={seasonId} onChange={(event) => { setSeasonId(event.target.value); if (event.target.value !== 'all') { setSeasonFromId('all'); setSeasonToId('all') } }}><option value="all">Época específica: todas</option>{seasons.map((season) => <option key={season.id} value={season.id}>{season.label}</option>)}</select>
        <select value={seasonFromId} onChange={(event) => { setSeasonFromId(event.target.value); if (event.target.value !== 'all') setSeasonId('all') }}><option value="all">Desde a primeira época</option>{[...seasons].reverse().map((season) => <option key={season.id} value={season.id}>{season.label}</option>)}</select>
        <select value={seasonToId} onChange={(event) => { setSeasonToId(event.target.value); if (event.target.value !== 'all') setSeasonId('all') }}><option value="all">Até à última época</option>{[...seasons].reverse().map((season) => <option key={season.id} value={season.id}>{season.label}</option>)}</select>
        <select value={competitionId} onChange={(event) => setCompetitionId(event.target.value)}><option value="all">Todas as competições</option>{competitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.name}</option>)}</select>
        <select value={continent} onChange={(event) => setContinent(event.target.value)}><option value="">Todos os continentes</option>{continentOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <input placeholder="País / nacionalidade" value={country} onChange={(event) => setCountry(event.target.value)} />
        {entity === 'players' && <><input placeholder="Posição" value={position} onChange={(event) => setPosition(event.target.value)} /><input type="number" placeholder="Idade mínima" value={minAge} onChange={(event) => setMinAge(event.target.value)} /><input type="number" placeholder="Idade máxima" value={maxAge} onChange={(event) => setMaxAge(event.target.value)} /><input type="number" placeholder="Minutos mínimos" value={minMinutes} onChange={(event) => setMinMinutes(event.target.value)} /></>}
        <button className="secondary-button" onClick={clearFilters}>Limpar filtros</button>
      </div></details>
    </Panel>
    <Panel title={`${entities.find((item) => item.id === entity)?.label} — ${modules.find((item) => item.id === module)?.label}`} description={`${entries.length} entidades · ${result.totalContributions} contribuições · arrasta os cabeçalhos para mudar a ordem das colunas`}>
      <div className="table-scroll"><table className="preview-table ranking-table"><thead><tr>{columns.map((column) => <th key={column.key} className={`reorderable-header ${draggedColumn === column.key ? 'is-dragging' : ''}`} draggable onDragStart={() => setDraggedColumn(column.key)} onDragEnd={() => setDraggedColumn(null)} onDragOver={(event) => event.preventDefault()} onDrop={() => reorderColumn(column.key)}><span className="column-drag-handle" title="Arrastar para mudar a ordem"><GripVertical size={14} /></span><button type="button" className="column-sort-button" disabled={column.sortable === false} onClick={() => toggleSort(column.key)}>{column.label}{sortKey === column.key && column.sortable !== false && <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>}</button></th>)}</tr></thead><tbody>
        {loading ? <tr><td colSpan={columns.length}>A calcular...</td></tr> : entries.map((entry) => <tr key={entry.entityId ?? entry.name}>{columns.map((column) => <td key={column.key}>{column.render(entry)}</td>)}</tr>)}
        {!loading && !entries.length && <tr><td colSpan={columns.length}>Sem dados para estes filtros.</td></tr>}
      </tbody></table></div>
    </Panel>
    {selected && <div className="ranking-explain"><div className="ranking-explain__header"><div><span className="eyebrow">Explain Mode</span><h2>{selected.name}</h2><p>{fmt(selected.competitiveWeighted)} competitivos + {fmt(selected.challengePoints)} desafios = {fmt(selected.weighted)}</p></div><button className="secondary-button" onClick={() => setSelected(null)}>Fechar</button></div>{selected.challengeAwards.length > 0 && <div className="challenge-awards">{selected.challengeAwards.map((award) => <span key={award.name}><strong>+{award.bonus}</strong> {award.name} · {award.years.join(', ')}</span>)}</div>}<div className="table-scroll"><table className="preview-table"><thead><tr><th>Época</th><th>Competição</th><th>Resultado</th><th>Base</th><th>× Comp.</th><th>× Div.</th><th>× Decay</th><th>Total</th></tr></thead><tbody>{selected.contributions.map((contribution) => <tr key={contribution.id}><td>{contribution.seasonLabel}</td><td>{contribution.competitionName}</td><td>{contribution.stage}</td><td>{fmt(contribution.raw)}</td><td>{contribution.competitionWeight}</td><td>{contribution.divisionWeight}</td><td>{contribution.decay}</td><td>{fmt(contribution.weighted)}</td></tr>)}</tbody></table></div></div>}
  </div>
}
