import { useCallback, useEffect, useState } from 'react'
import { Panel } from '../../../shared/components/Panel'
import { collectDiagnostics, type DiagnosticsSnapshot } from '../services/diagnostics-service'
import { inspectImportedData, type DataInspectionSnapshot } from '../../imports/services/import-inspection-service'
import { IMPORT_COMPLETED_EVENT } from '../../imports/services/import-events'

export function DiagnosticsPage() {
  const [data, setData] = useState<DiagnosticsSnapshot | null>(null)
  const [inspection, setInspection] = useState<DataInspectionSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [nextData, nextInspection] = await Promise.all([collectDiagnostics(), inspectImportedData()])
      setData(nextData); setInspection(nextInspection); setError(null)
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Erro no diagnóstico') }
  }, [])

  useEffect(() => {
    void refresh()
    const handleImport = () => void refresh()
    window.addEventListener(IMPORT_COMPLETED_EVENT, handleImport)
    window.addEventListener('focus', handleImport)
    return () => {
      window.removeEventListener(IMPORT_COMPLETED_EVENT, handleImport)
      window.removeEventListener('focus', handleImport)
    }
  }, [refresh])
  const rows = data ? [['Duplicados por IDU', data.duplicateUids], ['Jogadores com identidade fraca', data.lowConfidencePlayers], ['Épocas de jogador órfãs', data.orphanPlayerSeasons], ['Estatísticas órfãs', data.orphanStats], ['Avisos registados', data.warnings], ['Erros registados', data.errors]] : []

  return <div className="page-stack">
    <Panel title="Centro de diagnóstico" description="Integridade real da base de dados e das importações.">
      <button className="primary-button" onClick={() => void refresh()}>Atualizar diagnóstico</button>
      {error && <div className="import-message">{error}</div>}
      {!!inspection?.partialErrors.length && <div className="import-message">Algumas amostras não puderam ser carregadas: {inspection.partialErrors.join(' | ')}</div>}
      <div className="diagnostic-counters"><span>Jogadores <strong>{data?.players ?? '—'}</strong></span><span>Clubes <strong>{data?.clubs ?? '—'}</strong></span><span>Competições <strong>{data?.competitions ?? '—'}</strong></span><span>Épocas <strong>{data?.seasons ?? '—'}</strong></span></div>
      <div className="diagnostic-table" role="table"><div className="diagnostic-table__row diagnostic-table__head"><span>Verificação</span><span>Estado</span><span>Resultado</span></div>{rows.map(([label, value]) => <div className="diagnostic-table__row" key={String(label)}><span>{label}</span><span className={Number(value) === 0 ? 'status-ok' : 'status-error'}>{Number(value) === 0 ? 'OK' : 'Atenção'}</span><span>{value}</span></div>)}</div>
    </Panel>

    <Panel title="Histórico de importações" description="Últimas sessões, com contagens persistidas e estado final.">
      <div className="table-scroll compact-table"><table className="preview-table"><thead><tr><th>Ficheiro</th><th>Bloco</th><th>Estado</th><th>Criados</th><th>Atualizados</th><th>Ignorados</th><th>Avisos</th><th>Erros</th></tr></thead><tbody>
        {inspection?.recentSessions.map((session) => <tr key={session.id}><td>{session.fileName}</td><td>{session.importType}</td><td className={session.status === 'completed' ? 'status-ok' : 'status-error'}>{session.status}</td><td>{session.created}</td><td>{session.updated}</td><td>{session.skipped}</td><td>{session.warnings}</td><td>{session.errors}</td></tr>)}
        {!inspection?.recentSessions.length && <tr><td colSpan={8}>Ainda não existem importações.</td></tr>}
      </tbody></table></div>
    </Panel>

    <Panel title="Inspeção dos dados" description="Amostra das entidades efetivamente guardadas no IndexedDB.">
      <div className="inspection-grid">
        <section><h3>Jogadores</h3>{inspection?.recentPlayers.map((player) => <div className="inspection-row" key={player.id}><span>{player.name}</span><small>{player.uid ?? 'sem IDU'} · {player.confidence}</small></div>)}</section>
        <section><h3>Clubes</h3>{inspection?.recentClubs.map((club) => <div className="inspection-row" key={club.id}><span>{club.name}</span><small>{[club.country, club.continent].filter(Boolean).join(' · ') || 'sem localização'}</small></div>)}</section>
        <section><h3>Competições</h3>{inspection?.recentCompetitions.map((competition) => <div className="inspection-row" key={competition.id}><span>{competition.name}</span><small>{competition.type} · reputação {competition.reputation ?? '—'}</small></div>)}</section>
      </div>
    </Panel>
  </div>
}
