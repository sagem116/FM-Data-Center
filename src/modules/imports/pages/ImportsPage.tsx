import { useEffect, useMemo, useState, type DragEvent } from 'react'
import { AlertTriangle, CheckCircle2, FileSpreadsheet, RefreshCw, Trash2, Upload } from 'lucide-react'
import { Panel } from '../../../shared/components/Panel'
import { parseSeasonLabel } from '../../../core/season/season'
import { detectImportKind } from '../core/detect-import-kind'
import { readWorkbook } from '../core/workbook-reader'
import type { ImportKind, ImportPreview } from '../core/types'
import { createPreview } from '../parsers'
import { deleteImportedFile, importKinds as kinds, importLabels as labels, inspectBlockAfterImport, inspectBlockBeforeImport, inspectImportedData, type DataInspectionSnapshot, type ImportBlockSnapshot } from '../services/import-inspection-service'
import { persistPreview } from '../services/import-service'
import { notifyImportCompleted } from '../services/import-events'
import { db } from '../../../database/db'

type BlockState={preview?:ImportPreview;busy:boolean;message?:string;comparison?:ImportBlockSnapshot;showRaw:boolean}
const empty=():BlockState=>({busy:false,showRaw:false})

export function ImportsPage(){
  const[season,setSeason]=useState('2024/25')
  const[blocks,setBlocks]=useState<Record<ImportKind,BlockState>>(()=>Object.fromEntries(kinds.map(k=>[k,empty()])) as Record<ImportKind,BlockState>)
  const[inspection,setInspection]=useState<DataInspectionSnapshot|null>(null)
  const[historySearch,setHistorySearch]=useState('')
  const refresh=()=>void inspectImportedData().then(setInspection)
  useEffect(refresh,[])
  const patch=(kind:ImportKind,p:Partial<BlockState>)=>setBlocks(b=>({...b,[kind]:{...b[kind],...p}}))

  async function handleFile(expected:ImportKind,file:File){
    patch(expected,{busy:true,message:undefined,comparison:undefined})
    try{
      const snapshot=await readWorkbook(file);const detected=detectImportKind(snapshot)
      if(!detected)throw new Error('Tipo de ficheiro não reconhecido.')
      if(detected!==expected)throw new Error(`Este bloco espera ${labels[expected]}, mas foi detetado ${labels[detected]}.`)
      patch(expected,{preview:createPreview(snapshot,detected),message:'Ficheiro analisado. Confirma o preview e grava os dados.'})
    }catch(error){patch(expected,{preview:undefined,message:error instanceof Error?error.message:'Erro ao ler ficheiro.'})}
    finally{patch(expected,{busy:false})}
  }

  async function importData(kind:ImportKind){
    const preview=blocks[kind].preview;if(!preview)return
    patch(kind,{busy:true,message:'A guardar numa transação…'})
    try{const s=parseSeasonLabel(season);const before=await inspectBlockBeforeImport(kind,s.id);const result=await persistPreview(preview,season);const comparison=await inspectBlockAfterImport(kind,s.id,before);patch(kind,{comparison,message:`Concluído: ${result.created} criados, ${result.updated} atualizados, ${result.skipped} ignorados, ${result.warnings} avisos.`});notifyImportCompleted();refresh()}
    catch(error){patch(kind,{message:error instanceof Error?error.message:'Erro de importação.'})}
    finally{patch(kind,{busy:false})}
  }

  async function clearBlock(kind:ImportKind){
    if(!confirm(`Limpar os dados de ${labels[kind]} da época ${season}?`))return
    const id=parseSeasonLabel(season).id
    await db.transaction('rw',[db.playerSeasons,db.playerAttributes,db.playerGeneralMetrics,db.playerCompetitionStats,db.clubSeasons,db.coachSeasons,db.competitionSeasons,db.standings,db.transfers],async()=>{
      if(kind==='players'){await db.playerSeasons.where('seasonId').equals(id).delete();await db.playerAttributes.where('seasonId').equals(id).delete();await db.playerGeneralMetrics.where('seasonId').equals(id).delete()}
      if(kind==='statistics')await db.playerCompetitionStats.where('seasonId').equals(id).delete()
      if(kind==='clubs')await db.clubSeasons.where('seasonId').equals(id).delete()
      if(kind==='coaches')await db.coachSeasons.where('seasonId').equals(id).delete()
      if(kind==='competitions')await db.competitionSeasons.where('seasonId').equals(id).delete()
      if(kind==='standings')await db.standings.where('seasonId').equals(id).delete()
      if(kind==='transfers')await db.transfers.where('seasonId').equals(id).delete()
    })
    patch(kind,{message:'Dados da época removidos.',comparison:undefined});refresh()
  }

  async function removeSession(id:string,fileName:string){
    if(!confirm(`Apagar a importação “${fileName}” e os dados desse bloco/época?`))return
    await deleteImportedFile(id);notifyImportCompleted();refresh()
  }

  const filteredSessions=useMemo(()=>{
    const q=historySearch.trim().toLowerCase();if(!q)return inspection?.recentSessions??[]
    return (inspection?.recentSessions??[]).filter(s=>`${s.fileName} ${s.seasonLabel} ${s.startedAt} ${s.completedAt??''}`.toLowerCase().includes(q))
  },[inspection,historySearch])

  return <div className="page-stack">
    <Panel title="Importar Época" description="Sete blocos independentes, com deteção por colunas, preview, histórico pesquisável e isolamento por época.">
      <div className="import-toolbar"><label className="field-label">Época<input value={season} onChange={e=>setSeason(e.target.value)}/></label><button className="secondary-button" onClick={refresh}><RefreshCw size={16}/>Atualizar resumo</button></div>
      <div className="diagnostic-counters"><span>Jogadores <strong>{inspection?.counts.players??0}</strong></span><span>Clubes <strong>{inspection?.counts.clubs??0}</strong></span><span>Competições <strong>{inspection?.counts.competitions??0}</strong></span><span>Estatísticas <strong>{inspection?.counts.statistics??0}</strong></span></div>
    </Panel>

    {!!inspection?.missingBySeason.length&&<Panel title="Ficheiros em falta por época" description="A app avisa quando uma época não tem os sete blocos importados."><div className="missing-imports-list">{inspection.missingBySeason.map(item=><div className="import-message" key={item.seasonId}><strong>{item.seasonLabel}</strong>: faltam {item.missing.map(k=>labels[k]).join(', ')}</div>)}</div></Panel>}

    <div className="import-block-grid">{kinds.map(kind=><ImportBlock key={kind} kind={kind} state={blocks[kind]} onFile={f=>void handleFile(kind,f)} onImport={()=>void importData(kind)} onClear={()=>void clearBlock(kind)} onToggleRaw={()=>patch(kind,{showRaw:!blocks[kind].showRaw})}/>)}</div>

    <Panel title="Histórico de importações" description="Pesquisa por nome do ficheiro, data ou época. Cada importação pode ser eliminada individualmente.">
      <input className="history-search" placeholder="Pesquisar por ficheiro, data ou época" value={historySearch} onChange={e=>setHistorySearch(e.target.value)}/>
      <div className="table-scroll"><table className="preview-table"><thead><tr><th>Ficheiro</th><th>Época</th><th>Data de importação</th><th>Bloco</th><th>Estado</th><th>Criados</th><th>Atualizados</th><th>Ignorados</th><th>Avisos</th><th>Erros</th><th></th></tr></thead><tbody>
        {filteredSessions.map(s=><tr key={s.id}><td>{s.fileName}</td><td>{s.seasonLabel}</td><td>{new Date(s.completedAt??s.startedAt).toLocaleString('pt-PT')}</td><td>{labels[s.importType as ImportKind]??s.importType}</td><td>{s.status}</td><td>{s.created}</td><td>{s.updated}</td><td>{s.skipped}</td><td>{s.warnings}</td><td>{s.errors}</td><td><button className="icon-button" title="Apagar esta importação" onClick={()=>void removeSession(s.id,s.fileName)}><Trash2 size={16}/></button></td></tr>)}
        {!filteredSessions.length&&<tr><td colSpan={11}>Nenhuma importação encontrada.</td></tr>}
      </tbody></table></div>
    </Panel>
  </div>
}

function ImportBlock({kind,state,onFile,onImport,onClear,onToggleRaw}:{kind:ImportKind;state:BlockState;onFile:(f:File)=>void;onImport:()=>void;onClear:()=>void;onToggleRaw:()=>void}){
  const p=state.preview;const visible=useMemo(()=>p?.rows.slice(0,20)??[],[p]);const[dragging,setDragging]=useState(false)
  const acceptDrop=(event:DragEvent<HTMLElement>)=>{event.preventDefault();setDragging(false);const file=event.dataTransfer.files?.[0];if(file&&!state.busy)onFile(file)}
  return <section className={`import-block ${dragging?'is-dragging':''}`} onDragEnter={e=>{e.preventDefault();setDragging(true)}} onDragOver={e=>e.preventDefault()} onDragLeave={e=>{if(e.currentTarget===e.target)setDragging(false)}} onDrop={acceptDrop}><div className="import-block__header"><div><span className="eyebrow">Bloco independente</span><h2>{labels[kind]}</h2><p>{p?`${p.fileName} · ${p.sourceSheets.join(', ')}`:'Arrasta o ficheiro Excel para este bloco ou seleciona-o manualmente.'}</p></div><label className="upload-button"><Upload size={16}/>{state.busy?'A processar…':'Selecionar'}<input hidden type="file" accept=".xlsx,.xls" disabled={state.busy} onChange={e=>{const f=e.target.files?.[0];if(f)onFile(f);e.currentTarget.value='' }}/></label></div>
    {state.message&&<div className="import-message">{state.message}</div>}
    {p&&<><div className="import-summary import-summary--compact"><div><FileSpreadsheet/><strong>{p.totalSourceRows}</strong><span>Origem</span></div><div><CheckCircle2/><strong>{p.validRows}</strong><span>Válidos</span></div><div><AlertTriangle/><strong>{p.warningRows}</strong><span>Avisos</span></div><div><AlertTriangle/><strong>{p.errorRows}</strong><span>Erros</span></div></div>
      {state.comparison&&<div className="comparison-banner"><span>Antes: {state.comparison.previousRecords}</span><span>Depois: {state.comparison.records}</span><span>Diferença: {state.comparison.difference}</span></div>}
      <div className="action-row"><button className="primary-button" disabled={state.busy||p.validRows===0} onClick={onImport}>Importar dados válidos</button><button className="secondary-button" onClick={onToggleRaw}>{state.showRaw?'Ocultar raw':'Mostrar raw'}</button><button className="secondary-button danger-button" onClick={onClear}>Apagar bloco da época</button></div>
      <div className="table-scroll compact-table"><table className="preview-table"><thead><tr><th>Folha</th><th>Linha</th><th>Chave</th><th>Estado</th><th>Dados</th></tr></thead><tbody>{visible.map(row=><tr key={`${row.sourceSheet}:${row.sourceRow}:${row.entityKey}`}><td>{row.sourceSheet}</td><td>{row.sourceRow}</td><td>{row.entityKey}</td><td>{row.errors.length?row.errors.join('; '):row.warnings.length?row.warnings.join('; '):'OK'}</td><td><code>{JSON.stringify(state.showRaw?row.values:filterRaw(row.values))}</code></td></tr>)}</tbody></table></div>
    </>}
  </section>
}
function filterRaw(values:Record<string,unknown>){const copy={...values};delete copy.raw;return copy}
