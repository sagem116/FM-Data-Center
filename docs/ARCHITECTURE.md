# Arquitetura inicial

## Princípio central

Os dados importados, os cálculos e a apresentação ficam separados.

## Módulos

- `imports`: leitura, normalização, validação, resolução e persistência.
- `rankings`: pontos, pesos, fases, bónus, decaimento e histórico.
- `scores`: atributos, métricas, funções e normalização.
- `analysis`: scouting, comparações, insights e narrativa.
- `market`: transferências, tendências e eficiência.
- `diagnostics`: integridade, erros, auditoria e ferramentas de recuperação.

## Regras

1. Componentes React não devem conter fórmulas de negócio.
2. Todas as importações devem produzir relatório.
3. A época é obrigatória para dados sazonais.
4. Reimportações devem ser idempotentes.
5. Rankings e Scores são motores independentes.
6. Toda a conclusão importante deve poder ser explicada através dos dados de origem.
