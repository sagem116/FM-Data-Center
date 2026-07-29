# FM Data Center v0.7.4

## Correções

- Deteção robusta do ficheiro de reputação das Competições.
- Tipo da competição inferido e persistido a partir das folhas Super League, Nacional, Continental e Internacional.
- Leitura do formato continental de clubes.
- Correção do formato deslocado das competições internacionais de seleções.
- Seleções internacionais deixam de ser criadas como clubes e usam identidade de país.
- Ranking de jogadores otimizado com mapas e agrupamentos, removendo pesquisas repetidas em arrays completos.
- Ranking de Competições inclui:
  - valor médio de mercado;
  - salário médio;
  - reputação média dos clubes participantes.
- Valores e salários das estatísticas passam a ser persistidos para suportar as médias quando não existe perfil de jogador.

## Nota

Reimportar Competições, Classificações e Estatísticas para preencher tipos e novas métricas em dados já existentes.
