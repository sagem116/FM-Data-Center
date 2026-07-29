import { useCallback, useEffect, useState } from 'react'
import { Panel } from '../../../shared/components/Panel'
import { StatCard } from '../../../shared/components/StatCard'
import { collectDiagnostics, type DiagnosticsSnapshot } from '../services/diagnostics-service'
import { IMPORT_COMPLETED_EVENT } from '../../imports/services/import-events'

export function DashboardPage() {
  const [data, setData] = useState<DiagnosticsSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setData(await collectDiagnostics())
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível ler a base de dados.')
    }
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

  const problems = (data?.warnings ?? 0) + (data?.errors ?? 0) + (data?.duplicateUids ?? 0) + (data?.orphanPlayerSeasons ?? 0) + (data?.orphanStats ?? 0)

  return (
    <div className="page-stack">
      <div className="stats-grid">
        <StatCard label="Jogadores" value={String(data?.players ?? '—')} detail={data ? `${data.lowConfidencePlayers} com identidade de baixa confiança` : 'A carregar dados'} />
        <StatCard label="Clubes" value={String(data?.clubs ?? '—')} detail={data ? 'Entidades guardadas na IndexedDB' : 'A carregar dados'} />
        <StatCard label="Competições" value={String(data?.competitions ?? '—')} detail={data ? `${data.seasons} épocas disponíveis` : 'A carregar dados'} />
        <StatCard label="Problemas" value={String(data ? problems : '—')} detail={data ? `${data.errors} erros e ${data.warnings} avisos` : 'A carregar diagnóstico'} />
      </div>

      <Panel title="Estado da plataforma" description="Contagens lidas diretamente da base IndexedDB local.">
        <div className="status-list">
          <div><span className="status-dot is-ready" />Base de dados IndexedDB ligada</div>
          <div><span className="status-dot is-ready" />Importação transacional ativa</div>
          <div><span className="status-dot is-ready" />Diagnóstico de integridade disponível</div>
          <div><span className={`status-dot ${data?.lastImport ? 'is-ready' : ''}`} />{data?.lastImport ? `Última importação: ${new Date(data.lastImport).toLocaleString('pt-PT')}` : 'Sem importação concluída registada'}</div>
        </div>
        <div className="action-row">
          <button className="secondary-button" type="button" onClick={() => void refresh()}>Atualizar dados</button>
        </div>
        {error && <div className="import-message">{error}</div>}
      </Panel>
    </div>
  )
}
