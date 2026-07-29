const ATTRIBUTE_HEADERS:Record<string,string>={
  'jg_maos':'agarrar-a-bola','com':'comunicacao','cmd':'comando-da-area','aer':'jogo-aereo','tsb':'tendencia-para-socar-a-bola','soc':'saidas','exc':'excentricidade',
  'acl':'aceleracao','agi':'agilidade','agr':'agressividade','ant':'antecipacao','af':'aptidao-fisica','bra':'bravura','cab':'cabeceamento','cnt':'cantos','cmp':'compostura','cnc':'concentracao','cruz':'cruzamentos','decis':'decisoes','des':'desarme','det':'determinacao','eql':'equilibrio','fnl':'finalizacao','fnt':'conducao','for':'forca',
  'in_tr':'indice-de-trabalho','lan':'lancamentos','lncl':'lancamentos-longos','lid':'lideranca','liv':'livres','mar':'marcacao','pen':'penaltis','pas':'passe','pont':'pontapes','pos':'posicionamento','pri':'primeiro-toque','ref':'reflexos','rem_lo':'remates-de-longe','res':'resistencia','sb':'sem-bola','tec':'tecnica','tr_eq':'trabalho-de-equipa','1x1':'um-para-um','vel':'velocidade','vis':'visao-de-jogo',
  'ada':'adaptabilidade','amb':'ambicao','cons':'consistencia','cont':'controversia','desp':'desportivismo','j_imp':'jogos-importantes','lea':'lealdade','pres':'pressao','prof':'profissionalismo','prob_les':'propensao-para-lesoes','temp':'temperamento'
}

export function canonicalAttributeId(header:string):string|null{
  if(header==='imp')return'impulsao'
  if(header==='imp_2')return'imprevisibilidade'
  return ATTRIBUTE_HEADERS[header.replace(/_\d+$/,'')]??null
}
export function canonicalMetricId(header:string):string{return header.replace(/_\d+$/,'').replace(/_/g,'-')}
