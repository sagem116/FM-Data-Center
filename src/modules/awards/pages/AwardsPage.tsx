import { useEffect, useMemo, useState } from 'react'
import { Award as AwardIcon, BarChart3, Download, Info, Medal, RefreshCw, Sparkles, Trophy, UsersRound } from 'lucide-react'
import { Panel } from '../../../shared/components/Panel'
import { db } from '../../../database/db'
import { StatCard } from '../../../shared/components/StatCard'
import { EntityLink } from '../../../shared/components/EntityLink'
import { ReorderableScoreTable, type ScoreTableColumn } from '../../scores/components/ReorderableScoreTable'
import { clearAwardsCache, loadAwardHistory, loadAwards } from '../services/awards-service'
import type { AwardCandidate, AwardGroup, AwardHistoryRow, AwardModule, AwardResult, AwardsBundle } from '../types'

const EMPTY: AwardsBundle = { seasons: [], competitions: [], scopedCompetitions: [], awards: [], summary: { awarded: 0, total: 0, averageCoverage: 0, highConfidence: 0, entitiesAnalyzed: 0 }, warnings: [] }
const moduleLabels: Record<AwardModule, string> = { all: 'Todas as competições', superleague: 'Super Leagues', national: 'Ligas Nacionais', continental: 'Continentais', international: 'Internacionais' }
const groupLabels: Record<AwardGroup, string> = { players: 'Prémios de Jogadores', clubs: 'Prémios de Clubes', coaches: 'Prémios de Treinadores', competitions: 'Prémios de Competições', market: 'Prémios de Mercado' }
const groupDescriptions: Record<AwardGroup, string> = {
  players: 'Rendimento individual, produção, especialização por posição, juventude e eficiência.',
  clubs: 'Resultados, domínio, qualidade do plantel, ataque, defesa e política de juventude.',
  coaches: 'Desempenho competitivo, desenvolvimento de jogadores e decisões de recrutamento.',
  competitions: 'Qualidade, equilíbrio, intensidade ofensiva e capacidade de revelar talento.',
  market: 'Eficiência das contratações, trading, circulação de talento e poder financeiro.',
}
const confidenceClass = (value?: AwardCandidate['confidence']) => value === 'alta' ? 'is-high' : value === 'moderada' ? 'is-medium' : 'is-low'
const number = (value?: number, digits = 1) => value === undefined ? '—' : new Intl.NumberFormat('pt-PT', { maximumFractionDigits: digits }).format(value)
const money = (value?: number) => value === undefined ? '—' : new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(value)

function detailValue(key: string, value: string | number | undefined) {
  if (value === undefined || value === '') return '—'
  if (typeof value === 'string') return value
  const normalized = key.toLowerCase()
  if (/spend|income|value|wage|salario|valor/.test(normalized)) return money(value)
  if (/rate|share|coverage/.test(normalized)) return `${number(value)}%`
  return number(value, 2)
}

function entityKindLabel(kind: AwardCandidate['kind']) {
  return kind === 'player' ? 'Jogador' : kind === 'club' ? 'Clube' : kind === 'coach' ? 'Treinador' : 'Competição'
}

function AwardCard({ award, onHistory }: { award: AwardResult; onHistory: (award: AwardResult) => void }) {
  const winner = award.winner
  return <article className={`award-card ${winner ? '' : 'is-empty'}`}>
    <header>
      <span className="award-card__icon"><Medal size={20} /></span>
      <div><small>{groupLabels[award.group]}</small><h3>{award.name}</h3></div>
      {winner && <span className={`award-confidence ${confidenceClass(winner.confidence)}`}>{winner.confidence}</span>}
    </header>
    <p>{award.description}</p>
    {winner ? <>
      <div className="award-winner">
        <span>Vencedor</span>
        <EntityLink kind={winner.kind} id={winner.entityId} name={winner.name} />
        {winner.subtitle && <small>{winner.subtitle}</small>}
        <strong>{number(winner.score)}</strong>
      </div>
      <div className="award-evidence">{winner.evidence.slice(0, 3).map((item) => <span key={item}>{item}</span>)}</div>
      <div className="award-podium">
        {award.podium.map((candidate, index) => <div key={`${candidate.entityId ?? candidate.name}-${index}`}>
          <b>{index + 1}</b><EntityLink kind={candidate.kind} id={candidate.entityId} name={candidate.name} /><strong>{number(candidate.score)}</strong>
        </div>)}
      </div>
    </> : <div className="empty-state award-empty"><strong>Dados insuficientes</strong><span>{award.eligibility}</span></div>}
    <footer>
      <button className="secondary-button" type="button" onClick={() => onHistory(award)}><BarChart3 size={15} />Histórico</button>
      <details>
        <summary><Info size={15} />Critérios</summary>
        <div className="award-method">
          <p><strong>Fórmula:</strong> {award.formula}</p>
          <p><strong>Elegibilidade:</strong> {award.eligibility}</p>
          <p><strong>Amostra:</strong> {award.sample} candidatos</p>
          {winner && <>
            <p><strong>Cobertura do vencedor:</strong> {number(winner.coverage)}%</p>
            <div className="award-components">{winner.components.map((component) => <div key={component.label} className={component.available ? '' : 'is-missing'} title={component.available ? `Valor bruto: ${component.format === 'money' ? money(component.raw) : number(component.raw, 2)} · Peso ${component.weight}%` : 'Dado não disponível'}><span>{component.label}</span><i><b style={{ width: `${component.normalized ?? 0}%` }} /></i><strong>{component.available ? number(component.normalized) : 'N/D'}</strong></div>)}</div>
            <div className="award-details-grid">{Object.entries(winner.details).map(([key, value]) => <span key={key}><small>{key}</small><strong>{detailValue(key, value)}</strong></span>)}</div>
          </>}
        </div>
      </details>
    </footer>
  </article>
}

export function AwardsPage() {
  const [bundle, setBundle] = useState<AwardsBundle>(EMPTY)
  const [seasonId, setSeasonId] = useState('')
  const [module, setModule] = useState<AwardModule>('all')
  const [competitionId, setCompetitionId] = useState('')
  const [minimumMinutes, setMinimumMinutes] = useState(600)
  const [activeTab, setActiveTab] = useState<'awards' | 'history' | 'methodology'>('awards')
  const [group, setGroup] = useState<AwardGroup | 'all'>('all')
  const [query, setQuery] = useState('')
  const [historyAward, setHistoryAward] = useState<AwardResult | null>(null)
  const [history, setHistory] = useState<AwardHistoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const requestedSeason = seasonId || undefined
    void (async () => {
      const provisional = requestedSeason ?? (await db.seasons.orderBy('startYear').reverse().first())?.id
      if (!provisional) { if (!cancelled) { setBundle(EMPTY); setLoading(false) }; return }
      const result = await loadAwards({ seasonId: provisional, module, competitionId: competitionId || undefined, minimumMinutes })
      if (cancelled) return
      setBundle(result)
      if (!seasonId) setSeasonId(provisional)
      setLoading(false)
    })().catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [seasonId, module, competitionId, minimumMinutes])

  useEffect(() => {
    if (competitionId && !bundle.competitions.some((competition) => competition.id === competitionId && (module === 'all' || competition.type === (module === 'superleague' ? 'super-league' : module)))) setCompetitionId('')
  }, [module, competitionId, bundle.competitions])

  const competitionOptions = useMemo(() => bundle.competitions.filter((competition) => module === 'all' || competition.type === (module === 'superleague' ? 'super-league' : module)).sort((a, b) => a.name.localeCompare(b.name, 'pt')), [bundle.competitions, module])
  const filteredAwards = useMemo(() => bundle.awards.filter((award) => (group === 'all' || award.group === group) && (!query || `${award.name} ${award.description} ${award.winner?.name ?? ''}`.toLowerCase().includes(query.toLowerCase()))), [bundle.awards, group, query])
  const groups = useMemo(() => [...new Set(filteredAwards.map((award) => award.group))] as AwardGroup[], [filteredAwards])

  const openHistory = (award: AwardResult) => {
    setHistoryAward(award)
    setActiveTab('history')
    setHistoryLoading(true)
    void loadAwardHistory({ module, competitionId: competitionId || undefined, minimumMinutes }, award.id).then((rows) => { setHistory(rows); setHistoryLoading(false) }).catch(() => setHistoryLoading(false))
  }
  const refresh = () => {
    clearAwardsCache()
    setLoading(true)
    void loadAwards({ seasonId, module, competitionId: competitionId || undefined, minimumMinutes }, true).then((result) => { setBundle(result); setLoading(false) }).catch(() => setLoading(false))
  }
  const exportAwards = () => {
    const blob = new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), scope: { season: bundle.season?.label, module, competitionId, minimumMinutes }, awards: bundle.awards }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `premios-${bundle.season?.label ?? 'epoca'}-${module}.json`
    link.click()
    URL.revokeObjectURL(url)
  }
  const historyColumns: ScoreTableColumn<AwardHistoryRow>[] = [
    { key: 'season', label: 'Época', value: (row) => row.season },
    { key: 'winner', label: 'Vencedor', value: (row) => row.winner?.name ?? '', render: (row) => row.winner ? <EntityLink kind={row.winner.kind} id={row.winner.entityId} name={row.winner.name} /> : '—' },
    { key: 'type', label: 'Entidade', value: (row) => row.winner ? entityKindLabel(row.winner.kind) : '—' },
    { key: 'score', label: 'Score', value: (row) => row.winner?.score ?? 0, render: (row) => row.winner ? number(row.winner.score) : '—' },
    { key: 'confidence', label: 'Confiança', value: (row) => row.winner?.confidence ?? '', render: (row) => row.winner ? <span className={`award-confidence ${confidenceClass(row.winner.confidence)}`}>{row.winner.confidence}</span> : '—' },
    { key: 'coverage', label: 'Cobertura', value: (row) => row.winner?.coverage ?? 0, render: (row) => row.winner ? `${number(row.winner.coverage)}%` : '—' },
  ]

  return <div className="page-stack awards-page">
    <Panel title="Prémios Anuais" description="Avaliação automática e explicável dos melhores jogadores, clubes, treinadores, competições e políticas de mercado.">
      <div className="awards-toolbar">
        <label>Época<select value={seasonId} onChange={(event) => setSeasonId(event.target.value)}>{bundle.seasons.map((season) => <option key={season.id} value={season.id}>{season.label}</option>)}</select></label>
        <label>Universo<select value={module} onChange={(event) => { setModule(event.target.value as AwardModule); setCompetitionId('') }}>{Object.entries(moduleLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <label>Competição<select value={competitionId} onChange={(event) => setCompetitionId(event.target.value)}><option value="">Todas no universo</option>{competitionOptions.map((competition) => <option key={competition.id} value={competition.id}>{competition.name}</option>)}</select></label>
        <label>Minutos mínimos<input type="number" min="0" step="100" value={minimumMinutes} onChange={(event) => setMinimumMinutes(Math.max(0, Number(event.target.value)))} /></label>
        <button className="secondary-button" onClick={refresh}><RefreshCw size={16} />Recalcular</button>
        <button className="secondary-button" onClick={exportAwards}><Download size={16} />Exportar JSON</button>
      </div>
      <div className="subtabs awards-tabs">
        <button className={activeTab === 'awards' ? 'is-active' : ''} onClick={() => setActiveTab('awards')}><Trophy size={16} />Gala da Época</button>
        <button className={activeTab === 'history' ? 'is-active' : ''} onClick={() => setActiveTab('history')}><BarChart3 size={16} />Histórico</button>
        <button className={activeTab === 'methodology' ? 'is-active' : ''} onClick={() => setActiveTab('methodology')}><Info size={16} />Metodologia</button>
      </div>
    </Panel>

    {loading ? <Panel title="A calcular os prémios"><div className="empty-state"><Sparkles size={28} /><strong>A avaliar rendimento, títulos, mercado e contexto…</strong></div></Panel> : <>
      <div className="stats-grid"><StatCard label="Prémios atribuídos" value={`${bundle.summary.awarded}/${bundle.summary.total}`} /><StatCard label="Alta confiança" value={bundle.summary.highConfidence} /><StatCard label="Cobertura média" value={`${number(bundle.summary.averageCoverage)}%`} /><StatCard label="Entidades avaliadas" value={bundle.summary.entitiesAnalyzed} /></div>
      {bundle.warnings.length > 0 && <Panel title="Cobertura e limitações" description="Estes avisos explicam prémios sem vencedor ou com confiança reduzida."><div className="award-warning-list">{bundle.warnings.map((warning) => <span key={warning}>{warning}</span>)}</div></Panel>}

      {activeTab === 'awards' && <>
        <Panel title={`${moduleLabels[module]} · ${bundle.season?.label ?? 'Época'}`} description={competitionId ? `Prémios exclusivos de ${bundle.competitions.find((competition) => competition.id === competitionId)?.name ?? 'competição selecionada'}.` : `${bundle.scopedCompetitions.length} competições incluídas no universo.`}>
          <div className="awards-filter-row"><select value={group} onChange={(event) => setGroup(event.target.value as AwardGroup | 'all')}><option value="all">Todas as categorias</option>{Object.entries(groupLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar prémio ou vencedor…" /></div>
        </Panel>
        {groups.map((groupId) => <section className="award-group" key={groupId}><header><div><span className="eyebrow">{groupLabels[groupId]}</span><h2>{groupLabels[groupId]}</h2><p>{groupDescriptions[groupId]}</p></div><strong>{filteredAwards.filter((award) => award.group === groupId).length}</strong></header><div className="awards-grid">{filteredAwards.filter((award) => award.group === groupId).map((award) => <AwardCard key={award.id} award={award} onHistory={openHistory} />)}</div></section>)}
      </>}

      {activeTab === 'history' && <Panel title={historyAward ? `Histórico · ${historyAward.name}` : 'Histórico dos Prémios'} description="Seleciona um prémio na Gala da Época para consultar todos os vencedores por época.">
        {historyAward && <div className="history-award-selector"><label>Prémio<select value={historyAward.id} onChange={(event) => { const selected = bundle.awards.find((award) => award.id === event.target.value); if (selected) openHistory(selected) }}>{bundle.awards.map((award) => <option key={award.id} value={award.id}>{award.name}</option>)}</select></label><span>{moduleLabels[module]}{competitionId ? ` · ${bundle.competitions.find((competition) => competition.id === competitionId)?.name}` : ''}</span></div>}
        {historyLoading ? <div className="empty-state"><strong>A reconstruir os vencedores por época…</strong></div> : historyAward ? <ReorderableScoreTable tableKey={`awards-history-${historyAward.id}-${module}-${competitionId || 'all'}`} columns={historyColumns} rows={history} rowKey={(row) => `${row.seasonId}-${row.awardId}`} /> : <div className="empty-state"><AwardIcon size={28} /><strong>Ainda não selecionaste um prémio.</strong><span>Abre a Gala da Época e carrega em Histórico num dos cartões.</span></div>}
      </Panel>}

      {activeTab === 'methodology' && <div className="awards-methodology-grid">
        <Panel title="Princípios do modelo" description="Os prémios são comparativos dentro da época e do universo selecionado."><div className="methodology-list"><article><b>1</b><div><strong>Percentis relativos</strong><p>Cada métrica é normalizada face aos candidatos elegíveis, evitando misturar escalas diferentes.</p></div></article><article><b>2</b><div><strong>Pesos por prémio</strong><p>Um avançado é avaliado de forma diferente de um guarda-redes, clube ou treinador.</p></div></article><article><b>3</b><div><strong>Dados em falta</strong><p>Componentes ausentes não recebem valores inventados; os pesos disponíveis são renormalizados e a cobertura baixa.</p></div></article><article><b>4</b><div><strong>Confiança</strong><p>Depende da cobertura dos componentes e do tamanho da amostra de candidatos.</p></div></article></div></Panel>
        <Panel title="Regras competitivas" description="Os resultados respeitam as regras já definidas na aplicação."><div className="methodology-list"><article><b>C</b><div><strong>Campeão da Super League</strong><p>Só recebe título quando a coluna Inf contém C. O primeiro lugar sem C não é tratado como campeão.</p></div></article><article><b>90</b><div><strong>Métricas por 90</strong><p>Produção individual de volume é ajustada aos minutos sempre que aplicável.</p></div></article><article><b>€</b><div><strong>Mercado</strong><p>Eficiência de recrutamento cruza idade, C.A., C.P., valor de mercado e preço efetivamente conhecido.</p></div></article><article><b>!</b><div><strong>Atribuição a treinadores</strong><p>É feita por clube e época; não garante que o treinador estivesse no cargo na data exata de cada transferência.</p></div></article></div></Panel>
      </div>}
    </>}
  </div>
}
