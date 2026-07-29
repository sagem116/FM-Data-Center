# Changelog v0.11.0

## Pesquisa e navegação

- Barra de pesquisa global no topo.
- Autofill para jogadores, clubes, competições, treinadores e países.
- Sugestões relacionadas: clube, competição, treinador, nacionalidade, participantes e entidades do país.
- Navegação por teclado e abertura direta do perfil.
- Cache curto do índice de países e invalidação após novas importações.
- Componente único `EntityLink` aplicado às tabelas principais.

## Debug Scores

- Construção do índice de cobertura numa única passagem pelos jogadores.
- Eliminação do recálculo inicial duplicado ao selecionar automaticamente a época.
- Cedência periódica do processamento ao navegador.
- Paginação de 100 problemas.
- Renderização progressiva das listas extensas.
- Mantidas as correções manuais de aliases, componentes e pesos.

## Estatísticas e Intelligence

- `Explorador Estatístico`, sucessor da página Estatísticas.
- `Intelligence Estatística`, sucessora da página Análise Estatística.
- Filtros temporais, competitivos, geográficos e posicionais.
- Rankings estatísticos, evolução, recordes e correlações.

## Rankings históricos

- `Evolução dos Rankings` para clubes, treinadores e países.
- `Era de Domínio` com janelas móveis e deteção de dinastias.
- `Escolas de Treinadores` com agregação por nacionalidade e normalização por treinador.

## Recomendador de Pesos

- 12 métricas configuráveis.
- Ativação/desativação e peso individual.
- Normalização por percentis ou mínimo–máximo.
- Escala configurável.
- Perfis locais de fórmula.
- Importação/exportação JSON.
- Seleção e aplicação direta às competições.

## Desafios

- Novo Painel de Desafios.
- Filtros por entidade, categoria, desafio, período e país.
- Evolução temporal, atividade recente, top entidades e regras mais alcançadas.
- Utiliza o mesmo motor de Desafios dos Rankings.

## Mercado

- Subtabs de competições: Todas, Super Leagues, Ligas Nacionais, Continentais e Internacionais.
