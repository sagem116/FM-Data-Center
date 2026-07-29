import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Building2, CheckCircle2, Download, RefreshCw, UserRoundPlus, Wrench } from 'lucide-react'
import { Panel } from '../../../shared/components/Panel'
import { IMPORT_COMPLETED_EVENT } from '../../imports/services/import-events'
import { assignCoachToClub, collectClubDebug, ensureClubSeasonRecord, exportClubDebug, syncClubReferences, unlinkCoachSeason, updateClubDebug, type ClubDebugIssue, type ClubDebugSnapshot } from '../services/club-debug-service'
import type { Club } from '../../../shared/types/entities'

const labels = { error: 'Erro', warning: 'Aviso', info: 'Informação' } as const
function downloadJson(name: string, content: string) { const url = URL.createObjectURL(new Blob([content], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url) }

export function DebugClubsPage() {
  const [snapshot, setSnapshot] = useState<ClubDebugSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [severity, setSeverity] = useState('all')
  const [code, setCode] = useState('all')
  const [seasonId, setSeasonId] = useState('all')
  const [tab, setTab] = useState<'issues' | 'overview'>('issues')
  const [editing, setEditing] = useState<Club | null>(null)
  const [assigning, setAssigning] = useState<ClubDebugIssue | null>(null)
  const [coachId, setCoachId] = useState('')
  const [coachRole, setCoachRole] = useState('Treinador principal')

  const refresh = useCallback(async () => { setLoading(true); try { setSnapshot(await collectClubDebug()); setError(null) } catch (caught) { setError(caught instanceof Error ? caught.message : 'Erro no Debug Clubes') } finally { setLoading(false) } }, [])
  useEffect(() => { void refresh(); const listener = () => void refresh(); window.addEventListener(IMPORT_COMPLETED_EVENT, listener); return () => window.removeEventListener(IMPORT_COMPLETED_EVENT, listener) }, [refresh])

  const codes = useMemo(() => [...new Set(snapshot?.issues.map((item) => item.code) ?? [])].sort(), [snapshot])
  const filteredIssues = useMemo(() => snapshot?.issues.filter((item) => {
    if (severity !== 'all' && item.severity !== severity) return false
    if (code !== 'all' && item.code !== code) return false
    if (seasonId !== 'all' && item.seasonId !== seasonId) return false
    const hay = `${item.title} ${item.detail} ${item.code}`.toLowerCase()
    return !query || hay.includes(query.toLowerCase())
  }) ?? [], [snapshot, query, severity, code, seasonId])
  const filteredRows = useMemo(() => snapshot?.rows.filter((item) => {
    if (seasonId !== 'all' && item.seasonId !== seasonId) return false
    const hay = `${item.clubName} ${item.country ?? ''} ${item.continent ?? ''} ${item.nationalCompetitions.join(' ')} ${item.coaches.map((row) => row.name).join(' ')}`.toLowerCase()
    return !query || hay.includes(query.toLowerCase())
  }) ?? [], [snapshot, query, seasonId])

  const editClub = (clubId?: string) => { const club = snapshot?.clubs.find((row) => row.id === clubId); if (club) setEditing({ ...club }) }
  const saveClub = async () => { if (!editing) return; await updateClubDebug(editing.id, editing); setEditing(null); await refresh() }
  const assignCoach = async () => { if (!assigning?.clubId || !assigning.seasonId || !coachId) return; await assignCoachToClub({ coachId, clubId: assigning.clubId, seasonId: assigning.seasonId, role: coachRole }); setAssigning(null); setCoachId(''); await refresh() }

  return <div className="page-stack">
    <Panel title="Debug Clubes" description="Auditoria por clube e época: identidade, país, continente, reputação, liga nacional, treinador, jogadores, estatísticas, classificações e ligações internas.">
      <div className="diagnostic-toolbar"><button className="primary-button" onClick={() => void refresh()}><RefreshCw size={15} /> Atualizar diagnóstico</button><button className="secondary-button" disabled={!snapshot} onClick={() => snapshot && downloadJson(`debug-clubes-${new Date().toISOString().slice(0, 10)}.json`, exportClubDebug(snapshot))}><Download size={15} /> Exportar diagnóstico</button></div>
      {error && <div className="import-message status-error">{error}</div>}
      <div className="debug-summary-grid">
        <article><span>Clubes</span><strong>{snapshot?.summary.clubs ?? '—'}</strong></article><article><span>Clube–época ativos</span><strong>{snapshot?.summary.activeClubSeasons ?? '—'}</strong></article><article className="is-error"><span>Erros</span><strong>{snapshot?.summary.errors ?? '—'}</strong></article><article className="is-warning"><span>Avisos</span><strong>{snapshot?.summary.warnings ?? '—'}</strong></article><article><span>Sem reputação</span><strong>{snapshot?.summary.missingReputation ?? '—'}</strong></article><article><span>Sem país/continente</span><strong>{snapshot ? snapshot.summary.missingCountry + snapshot.summary.missingContinent : '—'}</strong></article><article><span>Sem treinador</span><strong>{snapshot?.summary.withoutCoach ?? '—'}</strong></article><article className="is-error"><span>Vários treinadores</span><strong>{snapshot?.summary.multipleCoaches ?? '—'}</strong></article><article><span>Sem liga nacional</span><strong>{snapshot?.summary.withoutNationalLeague ?? '—'}</strong></article><article><span>Duplicados</span><strong>{snapshot?.summary.duplicates ?? '—'}</strong></article><article><span>Ligações divergentes</span><strong>{snapshot?.summary.brokenLinks ?? '—'}</strong></article>
      </div>
      <div className="score-method-note"><strong>Critério de atividade</strong><p>Um clube–época é analisado quando surge em Clubes, Jogadores, Treinadores, Estatísticas ou Classificações. Assim, um ficheiro em falta não esconde os restantes conflitos.</p></div>
    </Panel>

    <Panel title="Explorar diagnóstico" description="Filtra por época, severidade e tipo de problema. As correções seguras podem ser feitas diretamente.">
      <div className="ranking-tabs ranking-tabs--secondary"><button className={tab === 'issues' ? 'is-active' : ''} onClick={() => setTab('issues')}>Problemas</button><button className={tab === 'overview' ? 'is-active' : ''} onClick={() => setTab('overview')}>Mapa clube–época</button></div>
      <div className="filter-grid"><input placeholder="Pesquisar clube, treinador, liga ou problema" value={query} onChange={(event) => setQuery(event.target.value)} /><select value={seasonId} onChange={(event) => setSeasonId(event.target.value)}><option value="all">Todas as épocas</option>{snapshot?.seasons.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>{tab === 'issues' && <><select value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="all">Todas as severidades</option><option value="error">Erros</option><option value="warning">Avisos</option><option value="info">Informação</option></select><select value={code} onChange={(event) => setCode(event.target.value)}><option value="all">Todos os tipos</option>{codes.map((item) => <option key={item}>{item}</option>)}</select></>}</div>

      {tab === 'issues' ? <div className="debug-issue-list">{loading ? <p>A auditar clubes…</p> : filteredIssues.map((issue) => <article key={issue.id} className={`debug-issue debug-issue--${issue.severity}`}><div className="debug-issue__icon">{issue.severity === 'error' ? <AlertTriangle /> : issue.severity === 'warning' ? <Wrench /> : <CheckCircle2 />}</div><div className="debug-issue__body"><div className="debug-issue__title"><strong>{issue.title}</strong><span>{labels[issue.severity]} · {issue.code}</span></div><p>{issue.detail}</p><div className="debug-fix-row">
        {issue.clubId && issue.editable && <button className="secondary-button" onClick={() => editClub(issue.clubId)}><Building2 size={14} /> Editar clube</button>}
        {issue.code === 'CLUB_WITHOUT_HEAD_COACH' && <button className="primary-button" onClick={() => setAssigning(issue)}><UserRoundPlus size={14} /> Associar treinador</button>}
        {issue.code === 'CLUB_MULTIPLE_HEAD_COACHES' && issue.relatedIds?.map((id) => <button key={id} className="danger-button" onClick={async () => { await unlinkCoachSeason(id); await refresh() }}>Remover ligação {snapshot?.rows.flatMap((row) => row.coaches).find((row) => row.coachSeasonId === id)?.name ?? ''}</button>)}
        {issue.code === 'CLUB_SEASON_RECORD_MISSING' && issue.clubId && issue.seasonId && <button className="primary-button" onClick={async () => { await ensureClubSeasonRecord(issue.clubId!, issue.seasonId!); await refresh() }}>Criar registo de época</button>}
        {issue.code.includes('NAME_CONFLICT') && issue.clubId && <button className="primary-button" onClick={async () => { await syncClubReferences(issue.clubId!); await refresh() }}>Sincronizar nomes ligados</button>}
      </div></div></article>)}{!loading && !filteredIssues.length && <div className="debug-empty"><CheckCircle2 size={28} /><strong>Sem problemas para estes filtros</strong></div>}</div> : <div className="table-scroll"><table className="preview-table"><thead><tr><th>Clube</th><th>Época</th><th>País</th><th>Continente</th><th>Reputação</th><th>Liga nacional</th><th>Treinador(es)</th><th>Jogadores</th><th>Estatísticas</th><th>Classificações</th><th>Problemas</th><th>Ação</th></tr></thead><tbody>{filteredRows.map((row) => <tr key={row.id}><td><strong>{row.clubName}</strong></td><td>{row.seasonLabel}</td><td>{row.country ?? '—'}</td><td>{row.continent ?? '—'}</td><td>{row.reputation ?? '—'}</td><td>{row.nationalCompetitions.join(', ') || '—'}</td><td>{row.coaches.map((item) => `${item.name}${item.role ? ` (${item.role})` : ''}`).join(', ') || '—'}</td><td>{row.playerCount}</td><td>{row.statisticsCount}</td><td>{row.standingsCount}</td><td className={row.issueCount ? 'status-error' : 'status-ok'}>{row.issueCount}</td><td><button className="secondary-button" onClick={() => editClub(row.clubId)}>Editar</button></td></tr>)}</tbody></table></div>}
    </Panel>

    {editing && <div className="modal-backdrop" onClick={() => setEditing(null)}><div className="editor-modal" onClick={(event) => event.stopPropagation()}><div className="ranking-explain__header"><div><span className="eyebrow">Correção manual</span><h2>{editing.name}</h2></div><button className="secondary-button" onClick={() => setEditing(null)}>Fechar</button></div><div className="form-grid"><label>Nome<input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></label><label>UID<input value={editing.uid ?? ''} disabled /></label><label>País<input value={editing.country ?? ''} onChange={(event) => setEditing({ ...editing, country: event.target.value || undefined })} /></label><label>Continente<input value={editing.continent ?? ''} onChange={(event) => setEditing({ ...editing, continent: event.target.value || undefined })} /></label><label>Reputação<input type="number" value={editing.reputation ?? ''} onChange={(event) => setEditing({ ...editing, reputation: event.target.value ? Number(event.target.value) : undefined })} /></label><label>Assistência média<input type="number" value={editing.averageAttendance ?? ''} onChange={(event) => setEditing({ ...editing, averageAttendance: event.target.value ? Number(event.target.value) : undefined })} /></label><label>Bilhetes de época<input type="number" value={editing.seasonTickets ?? ''} onChange={(event) => setEditing({ ...editing, seasonTickets: event.target.value ? Number(event.target.value) : undefined })} /></label></div><div className="debug-fix-row"><button className="primary-button" onClick={() => void saveClub()}>Guardar correção</button><button className="secondary-button" onClick={async () => { await syncClubReferences(editing.id); await refresh() }}>Sincronizar referências</button></div></div></div>}

    {assigning && <div className="modal-backdrop" onClick={() => setAssigning(null)}><div className="editor-modal debug-editor-modal--compact" onClick={(event) => event.stopPropagation()}><div className="ranking-explain__header"><div><span className="eyebrow">Treinador principal</span><h2>{assigning.title}</h2></div><button className="secondary-button" onClick={() => setAssigning(null)}>Fechar</button></div><div className="form-grid"><label className="span-2">Treinador<select value={coachId} onChange={(event) => setCoachId(event.target.value)}><option value="">Selecionar treinador</option>{snapshot?.coaches.map((item) => <option key={item.id} value={item.id}>{item.name}{item.nationality ? ` · ${item.nationality}` : ''}</option>)}</select></label><label className="span-2">Função<input value={coachRole} onChange={(event) => setCoachRole(event.target.value)} /></label></div><p className="muted-copy">Se o treinador já tiver outro clube nesta época, esta associação substitui a ligação anterior.</p><button className="primary-button" disabled={!coachId} onClick={() => void assignCoach()}>Associar treinador</button></div></div>}
  </div>
}
