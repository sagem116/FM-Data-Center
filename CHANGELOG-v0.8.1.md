# FM Data Center v0.8.1

## Scores — explicação e tabelas

- Explain Mode completo para jogadores, clubes e competições.
- Tooltips nos cabeçalhos com a definição de cada valor.
- Todas as colunas podem ser ordenadas e reorganizadas por drag-and-drop.
- Ordem guardada por tabela e botão para repor a ordem original.

## Performance

- Apenas a tab ativa calcula perfis agregados.
- As roles analisam primeiro apenas as posições compatíveis.
- Índice jogador-competições remove a pesquisa repetida por linha.
- Cache por época para evitar releituras desnecessárias da IndexedDB.

## Qualidade dos dados

- Alertas para métricas e atributos não reconhecidos.
- Distinção entre componente ausente e cobertura parcial.
- Cobertura detalhada por dimensão no Explain Mode.

## Médias financeiras

- Valor de mercado e salário anual passam a ser lidos diretamente de PlayerSeason.
- Médias de clubes e competições usam jogadores únicos para evitar duplicação.

## Novas dimensões configuráveis

- Eficiência ofensiva.
- Verticalidade.
- Segurança com bola.
- Jogo aéreo.
- Pressão alta.
- Disciplina.
- Transição.
- Criação de ocasiões.
