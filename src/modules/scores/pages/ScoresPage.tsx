import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Panel } from '../../../shared/components/Panel'
import { loadScoreConfig } from '../config/score-config-store'
import type { EntityStyleProfile, PlayerRoleScore, ScoreConfig, ScoreFeatureAvailability } from '../config/types'
import { analyzeFeatureAvailability, buildStyleProfiles, computeRoleScores, isRoleCompatible } from '../engine/score-engine'
import { clearScoreDataCache, loadScoreData, type ScoreDataBundle } from '../services/scores-service'
import { IMPORT_COMPLETED_EVENT } from '../../imports/services/import-events'
import { ReorderableScoreTable, type ScoreTableColumn } from '../components/ReorderableScoreTable'
import { EntityLink } from '../../../shared/components/EntityLink'

type Tab='players'|'competitions'|'clubs'|'insights'
const empty:ScoreDataBundle={playerRows:[],competitionRows:[],seasons:[]}
const scoreClass=(value:number)=>value>=80?'score-elite':value>=65?'score-good':value>=50?'score-average':'score-low'
const money=(value?:number)=>value===undefined?'—':new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR',notation:'compact',maximumFractionDigits:1}).format(value)
const number=(value?:number,digits=1)=>value===undefined?'—':new Intl.NumberFormat('pt-PT',{maximumFractionDigits:digits}).format(value)
const help={
  score:'Combinação ponderada do score de atributos, desempenho estatístico e contexto da role.',
  attributes:'Capacidade teórica para a role, calculada a partir dos atributos disponíveis.',
  performance:'Produção observada nas métricas da role, normalizada por percentis.',
  context:'Adequação posicional e qualidade relativa da competição.',
  confidence:'Robustez da amostra. Aumenta com os minutos e jogos disponíveis.',
  coverage:'Percentagem do peso da role para a qual existem dados reconhecidos.',
  adjusted:'Score suavizado pela confiança da amostra. Não substitui o score principal.',
}

function AvailabilityAlert({items}:{items:ScoreFeatureAvailability[]}){
  const missing=items.filter(item=>item.status==='missing'),partial=items.filter(item=>item.status==='partial')
  if(!missing.length&&!partial.length)return null
  return <details className="score-data-alert" open><summary>Dados incompletos: {missing.length} componentes não reconhecidos e {partial.length} com cobertura parcial</summary><div className="score-availability-grid">{missing.map(item=><span key={`${item.kind}:${item.id}`} className="is-missing"><strong>{item.label}</strong><small>{item.kind==='metric'?'Métrica':'Atributo'} não encontrado em nenhum jogador</small></span>)}{partial.map(item=><span key={`${item.kind}:${item.id}`} className="is-partial"><strong>{item.label}</strong><small>Reconhecido em {item.coverage}% dos jogadores</small></span>)}</div></details>
}

function ScoreDetail({score,onClose}:{score:PlayerRoleScore;onClose:()=>void}){
  return <div className="modal-backdrop" onClick={onClose}><div className="editor-modal score-detail-modal" onClick={event=>event.stopPropagation()}><div className="ranking-explain__header"><div><span className="eyebrow">Explain Mode · {score.roleName}</span><h2>{score.playerName}</h2><p>{score.clubName??'Sem clube'} · {score.position??'Sem posição'}</p></div><button className="secondary-button" onClick={onClose}>Fechar</button></div><div className="score-formula"><strong>{score.score}</strong><span>= {score.attributeScore} × atributos + {score.performanceScore} × métricas + {score.contextScore} × contexto, segundo os pesos configurados da role.</span></div><div className="score-kpis"><span title={help.score}>Score<strong>{score.score}</strong><small>{help.score}</small></span><span title={help.attributes}>Atributos<strong>{score.attributeScore}</strong><small>{help.attributes}</small></span><span title={help.performance}>Desempenho<strong>{score.performanceScore}</strong><small>{help.performance}</small></span><span title={help.context}>Contexto<strong>{score.contextScore}</strong><small>{help.context}</small></span><span title={help.confidence}>Confiança<strong>{score.confidence}%</strong><small>{help.confidence}</small></span><span title={help.coverage}>Cobertura<strong>{score.coverage}%</strong><small>{help.coverage}</small></span></div><div className="score-detail-grid"><section><h3>Pontos fortes</h3>{score.strengths.map(item=><p key={item}>+ {item}</p>)}</section><section><h3>Limitações</h3>{score.limitations.map(item=><p key={item}>− {item}</p>)}</section></div><div className="table-scroll"><table className="preview-table"><thead><tr><th title="Nome do atributo ou métrica configurada">Componente</th><th title="Origem do dado">Tipo</th><th title="Valor original importado">Valor</th><th title="Percentil ou conversão do atributo para uma escala 0–100">Normalizado</th><th title="Importância configurada dentro do componente">Peso</th><th title="Indica se o importador reconheceu dados para este componente">Estado</th></tr></thead><tbody>{score.contributions.map(item=><tr key={`${item.kind}:${item.id}`}><td>{item.label}</td><td>{item.kind==='attribute'?'Atributo':'Métrica'}</td><td>{item.rawValue?.toFixed(2)??'—'}</td><td>{item.normalizedValue?.toFixed(1)??'—'}</td><td>{item.weight}%</td><td className={item.available?'status-ok':'status-error'}>{item.available?'Disponível':'Sem dados / não reconhecido'}</td></tr>)}</tbody></table></div></div></div>
}

function ProfileDetail({profile,config,onClose}:{profile:EntityStyleProfile;config:ScoreConfig;onClose:()=>void}){
  return <div className="modal-backdrop" onClick={onClose}><div className="editor-modal score-detail-modal" onClick={event=>event.stopPropagation()}><div className="ranking-explain__header"><div><span className="eyebrow">Explain Mode · Perfil agregado</span><h2>{profile.entityName}</h2><p>{profile.playerCount} jogadores analisados · {profile.summary}</p></div><button className="secondary-button" onClick={onClose}>Fechar</button></div><div className="score-profile-explain-grid">{config.inferenceDimensions.map(dimension=><section key={dimension.id}><div><h3>{dimension.name}</h3><span className={`score-pill ${scoreClass(profile.dimensions[dimension.id]??0)}`}>{number(profile.dimensions[dimension.id])}</span></div><p>{dimension.description}</p><small>Cobertura do modelo: {profile.dimensionCoverage[dimension.id]??0}%</small><div className="table-scroll compact-table"><table className="preview-table"><thead><tr><th>Componente</th><th>Tipo</th><th>Média</th><th>Normalizado</th><th>Peso</th><th>Cobertura</th></tr></thead><tbody>{(profile.dimensionContributions[dimension.id]??[]).map(item=><tr key={`${item.kind}:${item.id}`}><td>{item.label}</td><td>{item.kind==='metric'?'Métrica':'Atributo'}</td><td>{number(item.averageRawValue,2)}</td><td>{number(item.normalizedValue)}</td><td>{item.weight}%</td><td className={item.availablePlayers?'status-ok':'status-error'}>{item.availablePlayers}/{item.totalPlayers}</td></tr>)}</tbody></table></div></section>)}</div>{profile.missingFeatures.length>0&&<div className="score-method-note"><strong>Componentes sem dados reconhecidos</strong><p>{profile.missingFeatures.join(', ')}. Estes componentes não são inventados e reduzem a cobertura da respetiva dimensão.</p></div>}</div></div>
}

function correlation(xs:number[],ys:number[]):number|null{if(xs.length!==ys.length||xs.length<3)return null;const ax=xs.reduce((a,b)=>a+b,0)/xs.length,ay=ys.reduce((a,b)=>a+b,0)/ys.length;let num=0,dx=0,dy=0;for(let i=0;i<xs.length;i++){const x=xs[i]-ax,y=ys[i]-ay;num+=x*y;dx+=x*x;dy+=y*y}return dx&&dy?num/Math.sqrt(dx*dy):null}

export function ScoresPage(){
  const[tab,setTab]=useState<Tab>('players')
  const[config,setConfig]=useState<ScoreConfig>(loadScoreConfig)
  const[data,setData]=useState<ScoreDataBundle>(empty)
  const[seasonId,setSeasonId]=useState('')
  const[roleId,setRoleId]=useState(config.roles.find(item=>item.enabled)?.id??config.roles[0]?.id??'')
  const[query,setQuery]=useState('')
  const[club,setClub]=useState('')
  const[competition,setCompetition]=useState('')
  const[minConfidence,setMinConfidence]=useState(0)
  const[limit,setLimit]=useState(100)
  const[loading,setLoading]=useState(true)
  const[selected,setSelected]=useState<PlayerRoleScore|null>(null)
  const[selectedProfile,setSelectedProfile]=useState<EntityStyleProfile|null>(null)
  const deferredQuery=useDeferredValue(query)
  const refresh=async(nextSeason?:string,force=false)=>{setLoading(true);if(force)clearScoreDataCache();const bundle=await loadScoreData(nextSeason||seasonId||undefined,force);setData(bundle);const selectedSeason=nextSeason||seasonId||bundle.seasons[0]?.id||'';setSeasonId(selectedSeason);setLoading(false)}
  useEffect(()=>{void refresh();const handler=()=>void refresh(undefined,true);window.addEventListener(IMPORT_COMPLETED_EVENT,handler);return()=>window.removeEventListener(IMPORT_COMPLETED_EVENT,handler)},[])
  useEffect(()=>{const handler=()=>setConfig(loadScoreConfig());window.addEventListener('fm-score-config-changed',handler);return()=>window.removeEventListener('fm-score-config-changed',handler)},[])
  const role=config.roles.find(item=>item.id===roleId)??config.roles[0]
  const compatibleRows=useMemo(()=>role?data.playerRows.filter(row=>isRoleCompatible(row,role)):[],[data.playerRows,role])
  const scores=useMemo(()=>role?computeRoleScores(compatibleRows,role,config):[],[compatibleRows,role,config])
  const availability=useMemo(()=>role?analyzeFeatureAvailability(compatibleRows,role):[],[compatibleRows,role])
  const inferenceAvailability=useMemo(()=>{
    const unique=new Map<string,{id:string;label:string;weight:number;enabled:true;direction:'higher'|'lower';kind:'attribute'|'metric'}>()
    for(const dimension of config.inferenceDimensions)for(const feature of dimension.features){const key=`${feature.kind}:${feature.id}`;if(!unique.has(key))unique.set(key,{...feature,label:feature.id.replace(/-/g,' '),enabled:true})}
    const values=[...unique.values()]
    const diagnosticRole={id:'inference-diagnostic',name:'Inferências',category:'outfield' as const,positionGroups:[],enabled:true,components:{attributes:50,metrics:50,context:0},attributes:values.filter(item=>item.kind==='attribute').map(({kind:_,...item})=>item),metrics:values.filter(item=>item.kind==='metric').map(({kind:_,...item})=>item)}
    return analyzeFeatureAvailability(data.competitionRows,diagnosticRole)
  },[data.competitionRows,config.inferenceDimensions])
  const playerCompetitions=useMemo(()=>{const map=new Map<string,Set<string>>();for(const row of data.competitionRows){if(!row.competitionName)continue;const set=map.get(row.playerId)??new Set<string>();set.add(row.competitionName);map.set(row.playerId,set)}return map},[data.competitionRows])
  const filtered=useMemo(()=>scores.filter(item=>(!deferredQuery||item.playerName.toLowerCase().includes(deferredQuery.toLowerCase()))&&(!club||item.clubName===club)&&(!competition||playerCompetitions.get(item.playerId)?.has(competition))&&item.confidence>=minConfidence),[scores,deferredQuery,club,competition,minConfidence,playerCompetitions])
  const competitionProfiles=useMemo(()=>(tab==='competitions'||tab==='insights')?buildStyleProfiles(data.competitionRows,config,'competition',scores):[],[tab,data.competitionRows,config,scores])
  const clubProfiles=useMemo(()=>tab==='clubs'?buildStyleProfiles(data.competitionRows,config,'club',scores):[],[tab,data.competitionRows,config,scores])
  const clubs=useMemo(()=>[...new Set(data.playerRows.map(item=>item.clubName).filter((item):item is string=>Boolean(item)))].sort(),[data.playerRows])
  const competitions=useMemo(()=>[...new Set(data.competitionRows.map(item=>item.competitionName).filter((item):item is string=>Boolean(item)))].sort(),[data.competitionRows])
  const insights=useMemo(()=>{if(tab!=='insights')return[];const profiles=competitionProfiles,result:string[]=[];for(const dimension of config.inferenceDimensions){const top=[...profiles].sort((a,b)=>(b.dimensions[dimension.id]??0)-(a.dimensions[dimension.id]??0))[0];if(top)result.push(`${top.entityName} apresenta o índice mais elevado de ${dimension.name.toLowerCase()} (${(top.dimensions[dimension.id]??0).toFixed(1)}).`);const valid=profiles.filter(item=>item.averageRoleScore!==undefined);const corr=correlation(valid.map(item=>item.dimensions[dimension.id]??0),valid.map(item=>item.averageRoleScore??0));if(corr!==null&&Math.abs(corr)>=.45)result.push(`Existe uma correlação ${corr>0?'positiva':'negativa'} (${corr.toFixed(2)}) entre ${dimension.name.toLowerCase()} e o score médio da role nas competições analisadas.`)}const best=scores[0];if(best)result.unshift(`${best.playerName} é a melhor adequação atual a ${best.roleName}, com score ${best.score}.`);return result},[tab,competitionProfiles,config.inferenceDimensions,scores])

  const playerColumns=useMemo<ScoreTableColumn<PlayerRoleScore>[]>(()=>[
    {key:'rank',label:'#',help:'Posição na ordenação atual.',value:(_,index)=>index+1,render:(_,index)=>index+1},
    {key:'name',label:'Jogador',help:'Nome, nacionalidade e idade do jogador.',value:item=>item.playerName,render:item=><><EntityLink kind="player" id={item.playerId} name={item.playerName}/><small className="score-subline">{item.nationality?<EntityLink kind="country" name={item.nationality}/>:''} {item.age?`· ${item.age} anos`:''}</small></>},
    {key:'club',label:'Clube',help:'Clube do jogador na época selecionada.',value:item=>item.clubName??'',render:item=>item.clubName?<EntityLink kind="club" id={item.clubId} name={item.clubName}/>:'—'},
    {key:'position',label:'Posição',help:'Posição importada e usada para validar a compatibilidade com a role.',value:item=>item.position??'',render:item=>item.position??'—'},
    {key:'score',label:'Score',help:help.score,value:item=>item.score,render:item=><span className={`score-pill ${scoreClass(item.score)}`} title={help.score}>{item.score}</span>},
    {key:'attributes',label:'Atributos',help:help.attributes,value:item=>item.attributeScore},
    {key:'performance',label:'Desempenho',help:help.performance,value:item=>item.performanceScore},
    {key:'context',label:'Contexto',help:help.context,value:item=>item.contextScore},
    {key:'adjusted',label:'Ajustado',help:help.adjusted,value:item=>item.adjustedScore},
    {key:'confidence',label:'Confiança',help:help.confidence,value:item=>item.confidence,render:item=>`${item.confidence}%`},
    {key:'coverage',label:'Cobertura',help:help.coverage,value:item=>item.coverage,render:item=>`${item.coverage}%`},
    {key:'minutes',label:'Minutos',help:'Minutos usados para calcular a confiança da amostra.',value:item=>item.minutes,render:item=>item.minutes.toLocaleString('pt-PT')},
    {key:'explain',label:'Explicação',help:'Abre o Explain Mode com fórmula, componentes, pesos e dados em falta.',value:item=>item.score,render:item=><button className="secondary-button" onClick={()=>setSelected(item)}>Explicar</button>},
  ],[])
  const profileColumns=useMemo<ScoreTableColumn<EntityStyleProfile>[]>(()=>[
    {key:'rank',label:'#',help:'Posição na ordenação atual.',value:(_,index)=>index+1,render:(_,index)=>index+1},
    {key:'entity',label:'Entidade',help:'Clube ou competição analisada.',value:item=>item.entityName,render:item=><EntityLink kind={tab==='competitions'?'competition':'club'} id={item.entityId} name={item.entityName}/>},
    {key:'players',label:'Jogadores',help:'Número de jogadores únicos com dados usados no perfil.',value:item=>item.playerCount},
    ...config.inferenceDimensions.map<ScoreTableColumn<EntityStyleProfile>>(dimension=>({key:`dimension:${dimension.id}`,label:dimension.name,help:dimension.description,value:item=>item.dimensions[dimension.id]??0,render:item=><span className={`score-pill ${scoreClass(item.dimensions[dimension.id]??0)}`} title={`${dimension.description} Cobertura: ${item.dimensionCoverage[dimension.id]??0}%`}>{number(item.dimensions[dimension.id])}</span>})),
    {key:'marketValue',label:'Valor médio',help:'Média do valor de mercado dos jogadores únicos da entidade.',value:item=>item.averages.marketValue??-1,render:item=>money(item.averages.marketValue)},
    {key:'wage',label:'Salário médio',help:'Média do salário anual dos jogadores únicos da entidade.',value:item=>item.averages.wageAnnual??-1,render:item=>money(item.averages.wageAnnual)},
    {key:'ca',label:'CA',help:'Capacidade Atual média dos jogadores com este dado disponível.',value:item=>item.averages.currentAbility??-1,render:item=>number(item.averages.currentAbility)},
    {key:'pa',label:'PA',help:'Capacidade Potencial média dos jogadores com este dado disponível.',value:item=>item.averages.potentialAbility??-1,render:item=>number(item.averages.potentialAbility)},
    {key:'roleScore',label:'Score médio',help:'Média do Score da role selecionada entre os jogadores compatíveis.',value:item=>item.averageRoleScore??-1,render:item=>number(item.averageRoleScore)},
    {key:'summary',label:'Perfil inferido',help:'Resumo determinístico baseado nas dimensões mais fortes e mais fracas.',value:item=>item.summary},
    {key:'explain',label:'Explicação',help:'Abre o Explain Mode com todos os componentes e coberturas.',value:item=>item.averageRoleScore??0,render:item=><button className="secondary-button" onClick={()=>setSelectedProfile(item)}>Explicar</button>},
  ],[config.inferenceDimensions])

  return <div className="page-stack"><Panel title="Scores e Intelligence" description="Capacidade, produção, contexto, confiança e inferências agregadas — todos os valores são explicáveis."><div className="ranking-tabs">{([['players','Jogadores'],['competitions','Competições'],['clubs','Clubes'],['insights','Insights']] as [Tab,string][]).map(([id,label])=><button key={id} className={tab===id?'is-active':''} onClick={()=>setTab(id)}>{label}</button>)}</div><div className="ranking-toolbar"><select value={seasonId} onChange={event=>{setSeasonId(event.target.value);void refresh(event.target.value)}}>{data.seasons.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select><select value={roleId} onChange={event=>setRoleId(event.target.value)}>{config.roles.filter(item=>item.enabled).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select><span className="progress-chip">{loading?'A carregar dados…':`${compatibleRows.length.toLocaleString('pt-PT')} jogadores compatíveis de ${data.playerRows.length.toLocaleString('pt-PT')}`}</span><button className="secondary-button" onClick={()=>void refresh(undefined,true)}>Atualizar</button></div><div className="score-method-note"><strong>Como ler os valores</strong><p><b>Score</b> combina atributos, desempenho e contexto. <b>Cobertura</b> indica quanto do modelo tem dados reconhecidos. <b>Confiança</b> mede o tamanho da amostra. Nos clubes e competições, cada dimensão é a média normalizada dos jogadores, com detalhe disponível em “Explicar”.</p></div><AvailabilityAlert items={availability}/></Panel>
  {tab==='players'&&<Panel title={role?.name??'Role'} description="Todas as colunas podem ser ordenadas e reorganizadas. O Explain Mode mostra a origem de cada valor."><div className="filter-grid"><input placeholder="Pesquisar jogador" value={query} onChange={event=>setQuery(event.target.value)}/><select value={club} onChange={event=>setClub(event.target.value)}><option value="">Todos os clubes</option>{clubs.map(item=><option key={item}>{item}</option>)}</select><select value={competition} onChange={event=>setCompetition(event.target.value)}><option value="">Todas as competições</option>{competitions.map(item=><option key={item}>{item}</option>)}</select><select value={minConfidence} onChange={event=>setMinConfidence(Number(event.target.value))}><option value={0}>Toda a confiança</option><option value={40}>Confiança baixa+</option><option value={60}>Confiança moderada+</option><option value={80}>Confiança boa+</option></select><select value={limit} onChange={event=>setLimit(Number(event.target.value))}><option value={25}>Top 25</option><option value={50}>Top 50</option><option value={100}>Top 100</option><option value={500}>Top 500</option></select></div><ReorderableScoreTable tableKey={`players:${roleId}`} columns={playerColumns} rows={filtered} maxRows={limit} rowKey={item=>item.playerId}/></Panel>}
  {tab==='competitions'&&<Panel title="Perfis das competições" description="Scores inferidos a partir das métricas e atributos dos jogadores utilizados em cada competição."><AvailabilityAlert items={inferenceAvailability}/><ReorderableScoreTable tableKey="profiles:competitions" columns={profileColumns} rows={competitionProfiles} rowKey={item=>item.entityId}/></Panel>}
  {tab==='clubs'&&<Panel title="Perfis dos clubes" description="Identidade estatística dos plantéis e do rendimento produzido."><AvailabilityAlert items={inferenceAvailability}/><ReorderableScoreTable tableKey="profiles:clubs" columns={profileColumns} rows={clubProfiles} rowKey={item=>item.entityId}/></Panel>}
  {tab==='insights'&&<Panel title="Insights automáticos" description="Conclusões determinísticas e explicáveis, recalculadas quando os dados ou pesos mudam."><div className="score-insight-grid">{insights.map((item,index)=><article key={`${index}:${item}`}><span>{String(index+1).padStart(2,'0')}</span><p>{item}</p></article>)}</div><div className="score-method-note"><strong>Novos exemplos de análise</strong><p>Além de Ataque, Defesa, Técnica, Física, Criatividade e Intensidade, foram adicionados: Eficiência ofensiva, Verticalidade, Segurança com bola, Jogo aéreo, Pressão alta, Disciplina, Transição e Criação de ocasiões. Todos são editáveis na Configuração de Scores.</p></div></Panel>}
  {selected&&<ScoreDetail score={selected} onClose={()=>setSelected(null)}/>} {selectedProfile&&<ProfileDetail profile={selectedProfile} config={config} onClose={()=>setSelectedProfile(null)}/>}</div>
}
