import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, Link2, RefreshCw, Trash2, Wrench } from 'lucide-react'
import { Panel } from '../../../shared/components/Panel'
import { IMPORT_COMPLETED_EVENT } from '../../imports/services/import-events'
import { collectRelationDebug, createClubSeasonFromRelation, createPlayerSeasonFromStats, deleteRelationRecord, exportRelationDebug, syncRelationName, type RelationDebugSnapshot } from '../services/relation-debug-service'

const labels = { error: 'Erro', warning: 'Aviso', info: 'Informação' } as const
function downloadJson(name: string, content: string) { const url = URL.createObjectURL(new Blob([content], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url) }

export function DebugRelationsPage() {
  const [snapshot, setSnapshot] = useState<RelationDebugSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [severity, setSeverity] = useState('all')
  const [code, setCode] = useState('all')
  const [table, setTable] = useState('all')

  const refresh = useCallback(async () => { setLoading(true); try { setSnapshot(await collectRelationDebug()); setError(null) } catch (caught) { setError(caught instanceof Error ? caught.message : 'Erro no Debug Relações') } finally { setLoading(false) } }, [])
  useEffect(() => { void refresh(); const listener = () => void refresh(); window.addEventListener(IMPORT_COMPLETED_EVENT, listener); return () => window.removeEventListener(IMPORT_COMPLETED_EVENT, listener) }, [refresh])
  const codes = useMemo(() => [...new Set(snapshot?.issues.map((item) => item.code) ?? [])].sort(), [snapshot])
  const filtered = useMemo(() => snapshot?.issues.filter((item) => {
    if (severity !== 'all' && item.severity !== severity) return false
    if (code !== 'all' && item.code !== code) return false
    if (table !== 'all' && item.table !== table) return false
    return !query || `${item.title} ${item.detail} ${item.code} ${item.table ?? ''}`.toLowerCase().includes(query.toLowerCase())
  }) ?? [], [snapshot, query, severity, code, table])

  const apply = async (action: () => Promise<void>) => { await action(); await refresh() }

  return <div className="page-stack">
    <Panel title="Debug Relações" description="Auditoria transversal das ligações entre jogadores, clubes, treinadores, competições, épocas, classificações, estatísticas, transferências e importações.">
      <div className="diagnostic-toolbar"><button className="primary-button" onClick={() => void refresh()}><RefreshCw size={15} /> Atualizar diagnóstico</button><button className="secondary-button" disabled={!snapshot} onClick={() => snapshot && downloadJson(`debug-relacoes-${new Date().toISOString().slice(0, 10)}.json`, exportRelationDebug(snapshot))}><Download size={15} /> Exportar diagnóstico</button></div>
      {error && <div className="import-message status-error">{error}</div>}
      <div className="debug-summary-grid"><article><span>Total de problemas</span><strong>{snapshot?.summary.issues ?? '—'}</strong></article><article className="is-error"><span>Erros</span><strong>{snapshot?.summary.errors ?? '—'}</strong></article><article className="is-warning"><span>Avisos</span><strong>{snapshot?.summary.warnings ?? '—'}</strong></article><article><span>Registos órfãos</span><strong>{snapshot?.summary.orphanRecords ?? '—'}</strong></article><article><span>Nomes divergentes</span><strong>{snapshot?.summary.nameConflicts ?? '—'}</strong></article><article><span>Ligações de época em falta</span><strong>{snapshot?.summary.missingSeasonLinks ?? '—'}</strong></article><article><span>Conflitos de identidade</span><strong>{snapshot?.summary.identityConflicts ?? '—'}</strong></article><article><span>Valores inválidos</span><strong>{snapshot?.summary.invalidValues ?? '—'}</strong></article></div>
      <div className="score-method-note"><strong>Objetivo</strong><p>Esta página procura problemas que não pertencem apenas a uma entidade: IDs que deixaram de existir, nomes que não coincidem, estatísticas sem perfil de época e referências quebradas após reimportações.</p></div>
    </Panel>

    <div className="debug-two-columns"><Panel title="Cobertura por tabela" description="Quantidade de registos e problemas encontrados em cada relação."><div className="table-scroll"><table className="preview-table"><thead><tr><th>Tabela</th><th>Registos</th><th>Problemas</th></tr></thead><tbody>{snapshot?.tableCounts.map((item) => <tr key={item.table}><td><code>{item.table}</code></td><td>{item.records.toLocaleString('pt-PT')}</td><td className={item.issues ? 'status-error' : 'status-ok'}>{item.issues}</td></tr>)}</tbody></table></div></Panel><Panel title="Correções disponíveis" description="Apenas são apresentados botões automáticos quando a ação é inequívoca."><div className="debug-guidance-list"><article><Link2 size={18} /><div><strong>Sincronizar nomes</strong><p>Atualiza o texto apresentado a partir do ID canónico já associado.</p></div></article><article><Wrench size={18} /><div><strong>Criar ligação de época</strong><p>Reconstrói player-season ou club-season usando dados existentes.</p></div></article><article><Trash2 size={18} /><div><strong>Eliminar órfão</strong><p>Remove apenas o registo isolado. Não elimina a entidade principal.</p></div></article></div></Panel></div>

    <Panel title="Problemas de integridade" description="Pesquisa e filtra por tabela, severidade e código. Revê sempre o detalhe antes de eliminar um órfão.">
      <div className="filter-grid"><input placeholder="Pesquisar entidade, ID, tabela ou problema" value={query} onChange={(event) => setQuery(event.target.value)} /><select value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="all">Todas as severidades</option><option value="error">Erros</option><option value="warning">Avisos</option><option value="info">Informação</option></select><select value={table} onChange={(event) => setTable(event.target.value)}><option value="all">Todas as tabelas</option>{snapshot?.tableCounts.map((item) => <option key={item.table} value={item.table}>{item.table}</option>)}</select><select value={code} onChange={(event) => setCode(event.target.value)}><option value="all">Todos os tipos</option>{codes.map((item) => <option key={item}>{item}</option>)}</select></div>
      <div className="debug-issue-list">{loading ? <p>A auditar relações…</p> : filtered.map((issue) => <article key={issue.id} className={`debug-issue debug-issue--${issue.severity}`}><div className="debug-issue__icon">{issue.severity === 'error' ? <AlertTriangle /> : issue.severity === 'warning' ? <Wrench /> : <CheckCircle2 />}</div><div className="debug-issue__body"><div className="debug-issue__title"><strong>{issue.title}</strong><span>{labels[issue.severity]} · {issue.code}</span></div><p>{issue.detail}</p>{issue.table && <small>Tabela: <code>{issue.table}</code>{issue.recordId ? ` · Registo ${issue.recordId}` : ''}</small>}<div className="debug-fix-row">
        {issue.action === 'sync-name' && issue.table && issue.recordId && <button className="primary-button" onClick={() => void apply(() => syncRelationName(issue.table!, issue.recordId!))}><Link2 size={14} /> Sincronizar nome</button>}
        {issue.action === 'create-player-season' && issue.recordId && <button className="primary-button" onClick={() => void apply(() => createPlayerSeasonFromStats(issue.recordId!))}>Criar perfil de época</button>}
        {issue.action === 'create-club-season' && issue.relatedId && <button className="primary-button" onClick={() => void apply(() => createClubSeasonFromRelation(issue.relatedId!))}>Criar registo clube–época</button>}
        {issue.action === 'delete' && issue.table && issue.recordId && <button className="danger-button" onClick={() => void apply(() => deleteRelationRecord(issue.table!, issue.recordId!))}><Trash2 size={14} /> Eliminar registo órfão</button>}
      </div></div></article>)}{!loading && !filtered.length && <div className="debug-empty"><CheckCircle2 size={28} /><strong>Sem problemas para estes filtros</strong></div>}</div>
    </Panel>
  </div>
}
