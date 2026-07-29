const A: Record<string, string[]> = {
  'reflexos':['ref'], 'um-para-um':['1x1'], 'agarrar-a-bola':['jg_maos'], 'jogo-aereo':['aer'], 'comunicacao':['com'], 'comando-da-area':['cmd'], 'saidas':['exc','acl'],
  'aceleracao':['acl'], 'agilidade':['agi'], 'agressividade':['agr'], 'antecipacao':['ant'], 'bravura':['bra'], 'cabeceamento':['cab'], 'concentracao':['cnc'], 'compostura':['cmp'], 'cruzamentos':['cruz'],
  'decisoes':['decis'], 'desarme':['des'], 'determinacao':['det'], 'equilibrio':['eql'], 'finalizacao':['fnl'], 'conducao':['fnt'], 'drible':['fnt'], 'forca':['for'], 'impulsao':['imp'],
  'imprevisibilidade':['imp2'], 'criatividade-imprevisibilidade':['imp2'], 'indice-de-trabalho':['in_tr'], 'lancamentos':['lan'], 'lancamentos-longos':['lncl'], 'lideranca':['lid'], 'livres':['liv'], 'marcacao':['mar'],
  'passe':['pas'], 'penaltis':['pen'], 'pontapes':['pont'], 'posicionamento':['pos'], 'primeiro-toque':['pri'], 'remates-de-longe':['rem_lo'], 'resistencia':['res'], 'sem-bola':['sb'], 'tecnica':['tec'],
  'trabalho-de-equipa':['tr_eq'], 'velocidade':['vel'], 'visao-de-jogo':['vis'], 'adaptabilidade':['ada'], 'ambicao':['amb'], 'consistencia':['cons'], 'controversia':['cont'], 'desportivismo':['desp'],
  'jogos-importantes':['j_imp'], 'lealdade':['lea'], 'pressao':['pres'], 'profissionalismo':['prof'], 'propensao-para-lesoes':['prob_les'], 'temperamento':['temp'], 'altura':['altura'],
}

const M: Record<string, string[]> = {
  'golos':['goals','gls','gls_90'], 'golos-sem-penaltis':['goals','gls','glse_90','glse'], 'golos-sem-penaltis-por-90':['glse_90','gls_90'], 'assistencias':['assists','ast','assis_90'], 'xa':['xa','xa_90'],
  'xg':['xg'], 'xg-sem-penaltis':['xg_sp','xg_sp_90','xg'], 'xg-sem-penaltis-por-90':['xg_sp_90','xg_90'], 'percentagem-de-passe':['passCompletion','passe','_passe','percent_passe'],
  'passes-completos':['ps_c','passes','passCompletion'], 'passes-progressivos':['passes_prog','passes_pr_90','pass_progressivos'], 'passes-chave':['ps_a_90','passes_chave','pd_ja','pd_jc_90'],
  'passes-para-finalizacao':['pd_ja','pd_jc_90','passes_chave'], 'passes-para-o-ultimo-terco':['passes_pr_90','passes_prog'], 'precisao-em-passes-longos':['pass_d','ps_c_90'],
  'desarmes':['tacklesPer90','des_90','des'], 'desarmes-ganhos':['des_g','des_90'], 'duelos-defensivos-ganhos':['m_des','des_g'], 'duelos-ganhos':['m_des','cab_g_90'],
  'duelos-aereos-ganhos':['cab_g_90','cab'], 'intercecoes':['int_90','int'], 'cortes':['ali_90','alivios'], 'remates-bloqueados':['blq_90','blq'], 'bloqueios':['blq_90','blq'],
  'dribles-sofridos':['ds','dft'], 'erros-defensivos':['gl_err','erros'], 'perdas-perigosas':['poss_perd_90','perdas'], 'perdas-de-bola':['poss_perd_90','perdas'], 'perdas':['poss_perd_90','perdas'],
  'recuperacoes':['poss_con_90','recuperacoes'], 'pressoes-eficazes':['press_conc','press_conc_90'], 'pressoes-no-ultimo-terco':['press_tent','press_conc'], 'pressoes-altas':['press_conc'],
  'dribles-bem-sucedidos':['fnt_90','cr_t','cr_t_90'], 'conducoes-progressivas':['cr_t_90','conducoes_progressivas'], 'cruzamentos-completos':['crz_con_90','cr_c'], 'cruzamentos-eficazes':['crz_con_90','cr_c'],
  'remates':['remates','remt_90'], 'remates-dentro-da-area':['remates','rem_90'], 'remates-enquadrados':['rem_remates','rem_percent'], 'toques-na-area':['ata','toques_area'], 'entradas-na-area':['ata','entradas_area'],
  'sprints-90':['sprints_90'], 'distancia':['distancia','dist_90'], 'avaliacao-media':['averageRating','cl_med'], 'ca':['currentAbility','c_a'], 'pa':['potentialAbility','c_p'],
  'percentagem-de-defesas':['percent_df','percent_pen_def'], 'defesas-por-90':['defesas_90'], 'clean-sheets-ajustadas':['sem_golos_sofridos'], 'golos-evitados':['xg_ac_e','gsfe'],
  'golos-evitados-face-ao-xg-sofrido':['xg_ac_e','gsfe'], 'faltas-cometidas':['fls','fnt_90'], 'cartoes':['amr','vermelhos'], 'disciplina':['amr','vermelhos'], 'disciplina-defensiva':['amr','vermelhos'],
  'xg-remate':['xg_remate'], 'qualidade-media-dos-remates':['xg_remate'], 'conversao-ajustada':['conv_percent'], 'conversao-ajustada-ao-xg':['conv_percent'],
  'participacao-na-construcao':['passes','ps_c'], 'envolvimento-na-construcao':['passes','ps_c'], 'acoes-progressivas-totais':['passes_prog','cr_t_90'],
}

const FEATURE_ALIAS_OVERRIDE_KEY='fm-data-center.score-feature-alias-overrides.v1'
export const SCORE_FEATURE_ALIASES_EVENT='fm-data-center:score-feature-aliases-changed'
type FeatureAliasOverrides=Record<string,string[]>

export function normalizedFeatureKey(value:string):string{return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function overrideKey(kind:'attribute'|'metric',id:string){return `${kind}:${normalizedFeatureKey(id)}`}
let overrideCache:FeatureAliasOverrides|undefined
function readOverrides():FeatureAliasOverrides{
  if(overrideCache)return overrideCache
  if(typeof window==='undefined')return{}
  try{overrideCache=JSON.parse(window.localStorage.getItem(FEATURE_ALIAS_OVERRIDE_KEY)??'{}') as FeatureAliasOverrides;return overrideCache}catch{overrideCache={};return overrideCache}
}
function writeOverrides(value:FeatureAliasOverrides){
  if(typeof window==='undefined')return
  overrideCache=value
  window.localStorage.setItem(FEATURE_ALIAS_OVERRIDE_KEY,JSON.stringify(value))
  window.dispatchEvent(new CustomEvent(SCORE_FEATURE_ALIASES_EVENT))
}
export function getFeatureAliasOverrides():FeatureAliasOverrides{return readOverrides()}
export function setFeatureAliasOverride(kind:'attribute'|'metric',id:string,alias:string):void{
  const key=overrideKey(kind,id), normalized=normalizedFeatureKey(alias)
  if(!normalized)return
  const overrides=readOverrides(), list=new Set(overrides[key]??[]);list.add(normalized);overrides[key]=[...list];writeOverrides(overrides)
}
export function removeFeatureAliasOverride(kind:'attribute'|'metric',id:string,alias?:string):void{
  const key=overrideKey(kind,id),overrides=readOverrides()
  if(!alias){delete overrides[key];writeOverrides(overrides);return}
  const normalized=normalizedFeatureKey(alias);overrides[key]=(overrides[key]??[]).filter(item=>item!==normalized)
  if(!overrides[key].length)delete overrides[key]
  writeOverrides(overrides)
}

export function aliasesFor(kind:'attribute'|'metric', id:string):string[]{
  const map=kind==='attribute'?A:M
  const manual=readOverrides()[overrideKey(kind,id)]??[]
  return [...new Set([id,...manual,...(map[id]??[])].map(normalizedFeatureKey))]
}

export function normalizeFeatureRecord(input:Record<string,number>):Record<string,number>{
  const out:Record<string,number>={}
  for(const [key,value] of Object.entries(input)){out[normalizedFeatureKey(key)]=value}
  return out
}

export function resolveFeatureValue(kind:'attribute'|'metric', id:string, input:Record<string,number>):number|null{
  const normalized=normalizeFeatureRecord(input)
  for(const alias of aliasesFor(kind,id)){if(alias in normalized&&Number.isFinite(normalized[alias]))return normalized[alias]}
  return null
}
