import { useEffect, useMemo, useRef, useState } from 'react'
import { Panel } from '../../../shared/components/Panel'
import { db } from '../../../database/db'
import { activeProfileId, activateProfile, createProfile, deleteProfile, loadProfiles, loadRankingConfig, resetRankingConfig, saveProfiles, saveRankingConfig, type RankingProfile } from '../config/ranking-config-store'
import type { NamedWeight, RankingConfig } from '../config/default-ranking-config'

type Tab='general'|'positions'|'superleague'|'national'|'continental'|'international'|'stages'|'decay'|'profiles'
type WeightGroup='nationalLeagueWeights'|'titleWeights'|'internationalWeights'
const tabs:[Tab,string][]=[['general','Geral'],['positions','Posições'],['superleague','Super League'],['national','Ligas Nacionais'],['continental','Continentais'],['international','Internacionais'],['stages','Fases e Bónus'],['decay','Decaimento'],['profiles','Perfis']]
const norm=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()
const groupFor=(name:string):WeightGroup|null=>{const n=norm(name);if(n.includes('super league')||n.includes('superleague'))return null;if(n.includes('champions')||n.includes('libertadores')||n.includes('confederation')||n.includes('continental'))return'titleWeights';if(n.includes('euro')||n.includes('world cup')||n.includes('copa america')||n.includes('internacional'))return'internationalWeights';return'nationalLeagueWeights'}

export function RankingWeightsPage(){
  const[cfg,setCfg]=useState<RankingConfig>(loadRankingConfig)
  const[tab,setTab]=useState<Tab>('general')
  const[competitions,setCompetitions]=useState<string[]>([])
  const[query,setQuery]=useState('')
  const[sort,setSort]=useState<'original'|'name'|'weight'>('original')
  const[manualName,setManualName]=useState('')
  const[manualWeight,setManualWeight]=useState(1)
  const[editing,setEditing]=useState<string|null>(null)
  const[editName,setEditName]=useState('')
  const[profiles,setProfiles]=useState<RankingProfile[]>(loadProfiles)
  const[profileName,setProfileName]=useState('')
  const fileRef=useRef<HTMLInputElement>(null)

  useEffect(()=>{void db.competitions.toArray().then(a=>setCompetitions(a.map(c=>c.name)))},[])
  useEffect(()=>saveRankingConfig(cfg),[cfg])

  const resolveDisplayName=(name:string)=>cfg.competitionAliases[norm(name)]??name
  const findItem=(name:string,key:WeightGroup)=>cfg[key].find(x=>norm(name).includes(norm(x.match))||norm(x.label)===norm(name))
  const fallbackFor=(key:WeightGroup|null)=>key==='titleWeights'||key==='internationalWeights'?150:key==='nationalLeagueWeights'?1:cfg.competitionWeights.superleague
  const namedRows=useMemo(()=>competitions
    .filter(name=>!cfg.hiddenCompetitions.includes(norm(name)))
    .map((name,index)=>{const displayName=resolveDisplayName(name);const key=groupFor(displayName);const item=key?findItem(displayName,key):undefined;return{sourceName:name,name:displayName,index,key,weight:item?.weight??fallbackFor(key),configured:!!item}})
    .filter(r=>!query||norm(r.name).includes(norm(query)))
    .sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):sort==='weight'?b.weight-a.weight:a.index-b.index),[competitions,cfg,query,sort])

  const setNamed=(name:string,key:WeightGroup,weight:number,label=name)=>{const list=[...cfg[key]];const i=list.findIndex(x=>norm(name).includes(norm(x.match))||norm(x.label)===norm(name));const item:NamedWeight={match:norm(name),label,weight};if(i>=0)list.splice(i,1,item);else list.push(item);setCfg({...cfg,[key]:list})}
  const addManual=()=>{const name=manualName.trim();if(!name)return;const key=groupFor(name)||'nationalLeagueWeights';setNamed(name,key,manualWeight);if(!competitions.some(x=>norm(x)===norm(name)))setCompetitions([...competitions,name]);setManualName('')}
  const startEdit=(sourceName:string,currentName:string)=>{setEditing(sourceName);setEditName(currentName)}
  const saveEdit=(sourceName:string,currentName:string,key:WeightGroup,weight:number)=>{const next=editName.trim();if(!next)return;const list=[...cfg[key]];const index=list.findIndex(item=>norm(currentName).includes(norm(item.match))||norm(item.label)===norm(currentName));const item:NamedWeight={match:norm(currentName),label:next,weight};if(index>=0)list.splice(index,1,item);else list.push(item);setCfg({...cfg,competitionAliases:{...cfg.competitionAliases,[norm(sourceName)]:next},[key]:list});setEditing(null)}
  const removeCompetition=(sourceName:string,currentName:string,key:WeightGroup|null)=>{if(!confirm(`Remover “${currentName}” da configuração de pesos?`))return;const hidden=[...new Set([...cfg.hiddenCompetitions,norm(sourceName)])];const next={...cfg,hiddenCompetitions:hidden};if(key)next[key]=cfg[key].filter(item=>norm(item.label)!==norm(currentName)&&norm(item.match)!==norm(currentName));setCfg(next)}
  const exportCfg=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(cfg,null,2)],{type:'application/json'}));a.download='fm-ranking-config.json';a.click()}
  const importCfg=async(file:File)=>{const parsed=JSON.parse(await file.text()) as Partial<RankingConfig>;setCfg({...cfg,...parsed,competitionAliases:parsed.competitionAliases??{},hiddenCompetitions:parsed.hiddenCompetitions??[]})}

  const tableFor=(kind:WeightGroup)=>{const rows=namedRows.filter(r=>r.key===kind);return <>
    <div className="ranking-toolbar"><input placeholder="Pesquisar competição" value={query} onChange={e=>setQuery(e.target.value)}/><select value={sort} onChange={e=>setSort(e.target.value as typeof sort)}><option value="original">Ordem original</option><option value="name">Nome</option><option value="weight">Peso</option></select><input placeholder="Nova competição" value={manualName} onChange={e=>setManualName(e.target.value)}/><input className="weight-input" type="number" step=".01" value={manualWeight} onChange={e=>setManualWeight(Number(e.target.value))}/><button className="secondary-button" onClick={addManual}>Adicionar</button></div>
    <div className="table-scroll"><table className="preview-table"><thead><tr><th>Competição</th><th>Estado</th><th>Peso</th><th>Ações</th></tr></thead><tbody>{rows.map(r=><tr key={r.sourceName}><td>{editing===r.sourceName?<input value={editName} onChange={e=>setEditName(e.target.value)}/>:<strong>{r.name}</strong>}</td><td className={r.configured?'status-ok':''}>{r.configured?'Configurado':'Padrão'}</td><td><input className="weight-input" type="number" step=".01" value={r.weight} onChange={e=>setNamed(r.name,kind,Number(e.target.value))}/></td><td><div className="weight-row-actions">{editing===r.sourceName?<><button className="secondary-button" onClick={()=>saveEdit(r.sourceName,r.name,kind,r.weight)}>Guardar</button><button className="secondary-button" onClick={()=>setEditing(null)}>Cancelar</button></>:<button className="secondary-button" onClick={()=>startEdit(r.sourceName,r.name)}>Editar</button>}<button className="danger-button" onClick={()=>removeCompetition(r.sourceName,r.name,kind)}>Apagar</button></div></td></tr>)}</tbody></table></div>
  </>}

  return <div className="page-stack"><Panel title="Configuração de Pesos" description="Pesos, competições editáveis, fases, bónus, decaimento e perfis."><div className="ranking-tabs config-tabs">{tabs.map(([id,label])=><button className={tab===id?'is-active':''} key={id} onClick={()=>setTab(id)}>{label}</button>)}</div><div className="action-row"><button className="secondary-button" onClick={()=>setCfg(resetRankingConfig())}>Repor originais</button><button className="secondary-button" onClick={exportCfg}>Exportar</button><button className="secondary-button" onClick={()=>fileRef.current?.click()}>Importar</button><input hidden ref={fileRef} type="file" accept="application/json" onChange={e=>{const f=e.target.files?.[0];if(f)void importCfg(f)}}/></div></Panel>
  {tab==='general'&&<Panel title="Pesos gerais"><div className="form-grid">{Object.entries(cfg.competitionWeights).map(([k,v])=><label key={k}>{k}<input type="number" step=".01" value={v} onChange={e=>setCfg({...cfg,competitionWeights:{...cfg.competitionWeights,[k]:Number(e.target.value)}})}/></label>)}</div></Panel>}
  {tab==='positions'&&<Panel title="Pontos por posição"><div className="weights-grid">{Object.entries(cfg.positionPoints).slice(0,100).map(([k,v])=><label key={k}>{k}.º<input type="number" value={v} onChange={e=>setCfg({...cfg,positionPoints:{...cfg.positionPoints,[k]:Number(e.target.value)}})}/></label>)}</div></Panel>}
  {tab==='superleague'&&<Panel title="Super League"><div className="weights-grid">{Object.entries(cfg.divisionWeights).map(([k,v])=><label key={k}>Divisão {k}<input type="number" step=".01" value={v} onChange={e=>setCfg({...cfg,divisionWeights:{...cfg.divisionWeights,[k]:Number(e.target.value)}})}/></label>)}</div></Panel>}
  {tab==='national'&&<Panel title="Ligas Nacionais">{tableFor('nationalLeagueWeights')}</Panel>}
  {tab==='continental'&&<Panel title="Continentais">{tableFor('titleWeights')}</Panel>}
  {tab==='international'&&<Panel title="Internacionais">{tableFor('internationalWeights')}</Panel>}
  {tab==='stages'&&<Panel title="Fases e Bónus"><div className="form-grid"><label>Campeão nacional<input type="number" value={cfg.nationalChampionBonus} onChange={e=>setCfg({...cfg,nationalChampionBonus:Number(e.target.value)})}/></label><label>Campeão Super League<input type="number" value={cfg.superleagueChampionBonus} onChange={e=>setCfg({...cfg,superleagueChampionBonus:Number(e.target.value)})}/></label><label>Promoção Super League<input type="number" value={cfg.superleaguePromotionBonus} onChange={e=>setCfg({...cfg,superleaguePromotionBonus:Number(e.target.value)})}/></label>{Object.entries(cfg.stageMultipliers).map(([k,v])=><label key={k}>{k}<input type="number" step=".001" value={v} onChange={e=>setCfg({...cfg,stageMultipliers:{...cfg.stageMultipliers,[k]:Number(e.target.value)}})}/></label>)}</div></Panel>}
  {tab==='decay'&&<Panel title="Decaimento"><div className="form-grid">{Object.entries(cfg.decayMultipliers).map(([k,v])=><label key={k}>{k}<input type="number" step=".01" value={v} onChange={e=>setCfg({...cfg,decayMultipliers:{...cfg.decayMultipliers,[k]:Number(e.target.value)}})}/></label>)}</div></Panel>}
  {tab==='profiles'&&<Panel title="Perfis"><div className="ranking-toolbar"><input placeholder="Nome do perfil" value={profileName} onChange={e=>setProfileName(e.target.value)}/><button className="primary-button" onClick={()=>{if(!profileName.trim())return;const p=createProfile(profileName,cfg);setProfiles([...profiles,p]);setProfileName('')}}>Guardar perfil atual</button></div><div className="profile-list">{profiles.map(p=><div className="profile-row" key={p.id}><div><strong>{p.name}</strong><small>{new Date(p.updatedAt).toLocaleString('pt-PT')}</small></div><span>{activeProfileId()===p.id?'Ativo':'Inativo'}</span><button className="secondary-button" onClick={()=>{activateProfile(p.id);setCfg(loadRankingConfig())}}>Ativar</button><button className="secondary-button" onClick={()=>{const copy={...p,name:`${p.name} — cópia`,id:`profile-${crypto.randomUUID()}`,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};const next=[...profiles,copy];saveProfiles(next);setProfiles(next)}}>Duplicar</button><button className="danger-button" onClick={()=>{deleteProfile(p.id);setProfiles(loadProfiles())}}>Eliminar</button></div>)}</div></Panel>}
  </div>
}
