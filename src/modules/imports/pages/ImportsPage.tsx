import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Upload } from 'lucide-react'
import { Panel } from '../../../shared/components/Panel'
import { parseSeasonLabel } from '../../../core/season/season'
import { detectImportKind } from '../core/detect-import-kind'
import { readWorkbook } from '../core/workbook-reader'
import type { ImportKind, ImportPreview } from '../core/types'
import { createPreview } from '../parsers'
import { inspectBlockAfterImport, inspectBlockBeforeImport, type ImportBlockSnapshot } from '../services/import-inspection-service'
import { persistPreview } from '../services/import-service'

const labels: Record<ImportKind, string> = {
  clubs: 'Clubes', coaches: 'Treinadores', players: 'Jogadores', competitions: 'Competições', standings: 'Classificações', statistics: 'Estatísticas', transfers: 'Transferências',
}

type ProgressStage = 'idle' | 'reading' | 'normalizing' | 'ready' | 'saving' | 'done'
const stageLabel: Record<ProgressStage, string> = { idle: '', reading: 'A ler o Excel…', normalizing: 'A normalizar e validar…', ready: 'Preview pronto', saving: 'A guardar numa transação…', done: 'Importação concluída' }

export function ImportsPage() {
  const [season, setSeason] = useState('2024/25')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState<ProgressStage>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [comparison, setComparison] = useState<ImportBlockSnapshot | null>(null)
  const [showRaw, setShowRaw] = useState(false)
  const visibleRows = useMemo(() => preview?.rows.slice(0, 50) ?? [], [preview])

  async function handleFile(file: File) {
    setBusy(true); setMessage(null); setComparison(null); setStage('reading')
    try {
      const snapshot = await readWorkbook(file)
      const kind = detectImportKind(snapshot)
      if (!kind) throw new Error('Não foi possível reconhecer o tipo de ficheiro.')
      setStage('normalizing')
      await new Promise((resolve) => window.setTimeout(resolve, 0))
      setPreview(createPreview(snapshot, kind)); setStage('ready')
    } catch (error) {
      setPreview(null); setStage('idle'); setMessage(error instanceof Error ? error.message : 'Erro inesperado ao ler o ficheiro.')
    } finally { setBusy(false) }
  }

  async function importData() {
    if (!preview) return
    setBusy(true); setStage('saving'); setComparison(null)
    try {
      const seasonEntity = parseSeasonLabel(season)
      const previousRecords = await inspectBlockBeforeImport(preview.kind, seasonEntity.id)
      const result = await persistPreview(preview, season)
      const nextComparison = await inspectBlockAfterImport(preview.kind, seasonEntity.id, previousRecords)
      setComparison(nextComparison); setStage('done')
      setMessage(`Importação concluída: ${result.created} criados, ${result.updated} atualizados, ${result.skipped} ignorados e ${result.warnings} avisos.`)
    } catch (error) {
      setStage('ready'); setMessage(error instanceof Error ? error.message : 'Erro ao guardar a importação.')
    } finally { setBusy(false) }
  }

  return (
    <div className="page-stack">
      <Panel title="Importação real" description="Leitura, deteção automática, normalização, validação, preview e persistência local.">
        <div className="import-toolbar">
          <label className="field-label">Época<input value={season} onChange={(event) => setSeason(event.target.value)} pattern="\d{4}/\d{2,4}" /></label>
          <label className="upload-button"><Upload size={18} />{busy ? 'A processar…' : 'Selecionar Excel'}<input hidden type="file" accept=".xlsx,.xls" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleFile(file) }} /></label>
          {stage !== 'idle' && <span className="progress-chip">{stageLabel[stage]}</span>}
        </div>
        {message && <div className="import-message">{message}</div>}
        {comparison && <div className="comparison-banner"><strong>Comparação da época:</strong><span>Antes: {comparison.previousRecords}</span><span>Depois: {comparison.records}</span><span>Diferença: {comparison.difference > 0 ? '+' : ''}{comparison.difference}</span></div>}
      </Panel>

      {preview && <>
        <Panel title={`${labels[preview.kind]} — ${preview.fileName}`} description={`${preview.totalSourceRows} linhas de origem analisadas`}>
          <div className="import-summary">
            <div><FileSpreadsheet /><strong>{preview.rows.length}</strong><span>Registos detetados</span></div>
            <div><CheckCircle2 /><strong>{preview.validRows}</strong><span>Válidos</span></div>
            <div><AlertTriangle /><strong>{preview.warningRows}</strong><span>Com avisos</span></div>
            <div><AlertTriangle /><strong>{preview.errorRows}</strong><span>Com erros</span></div>
          </div>
          <div className="action-row">
            <button className="primary-button" disabled={busy || preview.validRows === 0 || preview.errorRows > 0} onClick={() => void importData()}>Importar dados válidos</button>
            <button className="secondary-button" type="button" onClick={() => setShowRaw((value) => !value)}>{showRaw ? 'Ocultar dados raw' : 'Mostrar dados raw'}</button>
          </div>
        </Panel>
        <Panel title="Preview normalizado" description="Primeiros 50 registos, com origem exata e estado de validação.">
          <div className="table-scroll"><table className="preview-table"><thead><tr><th>Folha</th><th>Linha</th><th>Chave</th><th>Dados normalizados</th><th>Avisos</th><th>Estado</th></tr></thead><tbody>
            {visibleRows.map((row) => {
              const data = showRaw ? row.values : Object.fromEntries(Object.entries(row.values).filter(([key]) => key !== 'raw'))
              return <tr key={`${row.sourceSheet}-${row.sourceRow}-${row.entityKey}`}><td>{row.sourceSheet}</td><td>{row.sourceRow}</td><td>{row.entityKey}</td><td><pre>{JSON.stringify(data, null, 2)}</pre></td><td>{row.warnings.length ? row.warnings.join('; ') : '—'}</td><td className={row.errors.length ? 'status-error' : 'status-ok'}>{row.errors.length ? row.errors.join('; ') : 'Válido'}</td></tr>
            })}
          </tbody></table></div>
        </Panel>
      </>}
    </div>
  )
}
