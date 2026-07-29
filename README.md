# FM Data Center v0.14.0

## v0.14.0 — Barra lateral altamente configurável

A navegação passa a ser organizada por categorias e subcategorias totalmente persistentes. O utilizador pode reordenar categorias e páginas por drag-and-drop, mover páginas entre categorias, criar e renomear categorias, personalizar os nomes e descrições das páginas, ocultar elementos e escolher entre os modos expandido, compacto ou oculto.

Também estão disponíveis pesquisa local da navegação, categorias colapsáveis, modo acordeão, largura e densidade ajustáveis, controlo individual dos campos visíveis, reposição do layout original e importação/exportação da configuração em JSON. Quando a barra é ocultada, o botão **Menu** permanece no topo para a recuperar.

## v0.11.0 — Navegação e Intelligence histórica

Esta versão acrescenta pesquisa global por todas as entidades, links diretos para os perfis, corrige o bloqueio do Debug Scores e recupera as páginas analíticas da aplicação anterior com uma arquitetura única sobre os dados atuais.

### Novas áreas

- **Pesquisa global:** autofill de jogadores, clubes, competições, treinadores e países, com sugestões relacionadas e navegação direta para o perfil.
- **Explorador Estatístico:** filtros por época, universo competitivo, continente, país, competição e posição; agregações por jogadores, clubes, competições, países e posições.
- **Intelligence Estatística:** evolução, recordes, correlações e leituras automáticas.
- **Recomendador de Pesos:** fórmula configurável com 12 métricas, normalização, perfis, importação/exportação JSON e aplicação seletiva.
- **Escolas de Treinadores:** pontos, títulos, profundidade e evolução dos treinadores agrupados por país.
- **Era de Domínio:** janelas móveis, quota de pontos, dinastias e principais rivais.
- **Evolução dos Rankings:** matriz por época para clubes, treinadores e países.
- **Painel de Desafios:** conclusões, bónus, evolução temporal, filtros e impacto nos Rankings.
- **Mercado por universo:** subtabs de Super Leagues, Ligas Nacionais, Continentais e Internacionais.

### Navegação por entidades

Os nomes das entidades nas tabelas principais funcionam como ligações para os respetivos perfis. O componente é partilhado por Rankings, Scores, Mercado, Estatísticas, Histórico, Hall of Fame, Desafios e páginas analíticas.

### Debug Scores

A auditoria deixou de recalcular cada role separadamente sobre toda a base. Os atributos e métricas são indexados numa passagem única, o trabalho é cedido periodicamente ao navegador, os problemas são paginados e a seleção inicial de época já não provoca um segundo cálculo completo.

## v0.8.4 — Auditoria pelos ficheiros reais

Esta versão foi confrontada com os sete ficheiros de exemplo fornecidos. Corrige aliases e mapeamentos de clubes, competições e países, ignora cabeçalhos repetidos, normaliza valores monetários e reduz falsos positivos nos Debugs. Os diagnósticos por entidade só exigem campos quando o respetivo bloco de origem foi realmente importado. Os casos ambíguos ou sem informação suficiente continuam visíveis e podem ser corrigidos manualmente.
Reconstrução modular da FM Rankings, com importação transacional, Rankings auditáveis, Desafios e uma primeira camada completa de Scores e Intelligence.

## Estado atual

- Importação dos sete blocos Excel com deteção automática, preview e validação.
- Identidade canónica de jogadores por IDU, nome + data de nascimento ou fallback controlado.
- Modelo por época em IndexedDB através de Dexie.
- Reimportação transacional por bloco e época.
- Rankings das cinco entidades, filtros, Desafios e configuração de pesos.
- Scores configuráveis por role, atributos, métricas e contexto.
- Perfis inferidos de jogadores, clubes e competições.
- Debug Scores, Debug Rankings, Debug Países, Debug Clubes e Debug Relações com correções manuais persistentes.
- Normalização central de países em português, inglês, ISO-2, ISO-3 e aliases futebolísticos.

## Ficheiros suportados

| Bloco | Conteúdo esperado |
|---|---|
| Clubes | Reputação, assistência, país e continente |
| Treinadores | IDU, clube, função, contrato, resultados e perfil |
| Jogadores | IDU, perfil, atributos, métricas, contrato e situação |
| Competições | `Competition`, `Reputação`, `Pais` e `Contintente`/`Continente` |
| Classificações | Super League, ligas nacionais, continentais e seleções internacionais |
| Estatísticas | Estatísticas individuais por competição |
| Transferências | Data, jogador, origem, destino e valor |

O importador normaliza acentos, espaços, grafias alternativas e o erro `Contintente` presente no ficheiro de reputação das competições.

## Instalação e validação

```bash
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

A aplicação fica disponível em `http://localhost:5173/`.

## Scores

A configuração inicial contém 32 roles. Cada role separa:

- Role Attribute Score: capacidade indicada pelos atributos;
- Role Performance Score: produção estatística;
- contexto competitivo;
- cobertura dos dados;
- confiança da amostra;
- score ajustado pela confiança.

A página **Configuração Scores** permite:

- criar, duplicar, desativar ou apagar roles;
- adicionar e retirar atributos ou métricas;
- editar pesos e direção de cada variável;
- editar a proporção atributos/métricas/contexto;
- escolher o universo de normalização;
- configurar amostras e dados em falta;
- criar e editar dimensões de inferência;
- importar e exportar toda a configuração em JSON.

A página **Scores** apresenta Rankings por role e perfis agregados de clubes e competições, incluindo ataque, defesa, técnica, física, criatividade, intensidade, valores médios e correlações explicáveis.

Mais detalhes em `docs/SCORES.md`.

## Centros de Debug

- **Debug Scores:** métricas e atributos ausentes, cobertura parcial, conflitos de pesos, IDs duplicados, aliases manuais e desativação de componentes.
- **Debug Rankings:** tipos de competição, divisões, reputação, localização, classificações órfãs, ligações de entidades e conflitos da regra `Inf = C`.
- **Debug Países:** países desconhecidos ou ambíguos, entidades sem país, conflitos de continente, seleções sem treinador, aliases manuais e normalização de toda a base.
- **Debug Clubes:** reputação, localização, ligas nacionais, treinadores por época, jogadores, estatísticas, classificações, duplicados e nomes divergentes.
- **Debug Relações:** registos órfãos, IDs quebrados, nomes incompatíveis, identidades duplicadas, ligações de época em falta e transferências incoerentes.

As correções possíveis são aplicadas diretamente ao IndexedDB ou às configurações locais e persistem entre sessões.

## Reimportação após atualizar para v0.8.0

Para preencher os novos campos canónicos, reimporte nesta ordem:

1. Competições;
2. Jogadores;
3. Estatísticas.

## Dívida técnica conhecida

O bundle principal continua acima de 500 kB. O code splitting será tratado sem alterar as regras de dados ou cálculo.
