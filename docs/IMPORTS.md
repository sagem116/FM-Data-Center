# Importação v0.2

A aplicação reconhece automaticamente os sete ficheiros de exemplo:

- Clubes
- Treinadores
- Jogadores
- Competições
- Classificações
- Estatísticas por âmbito competitivo
- Transferências

## Pipeline

`XLSX → folhas → cabeçalhos únicos → deteção → parser → normalização → validação → preview → IndexedDB`

## Regras implementadas

- Cabeçalhos sem acentos e com nomes repetidos numerados.
- Valores vazios: `-`, `N/D`, vazio e equivalentes.
- Dinheiro em milhares/milhões e parcelas possíveis entre parênteses.
- Datas em número de série Excel.
- Jogos no formato `8 (3)`.
- União das folhas de clubes por nome normalizado, nunca pela posição da linha.
- IDU como chave principal de jogadores e treinadores.
- Preservação da linha original em `raw` nos ficheiros extensos.

## Limites atuais

A persistência completa de classificações e estatísticas será fechada na versão seguinte, após definição das tabelas históricas e da política de reimportação por época. Nesta versão, ambos já são lidos, normalizados, validados e apresentados no preview.
