# Rankings — motor canónico

## Configuração original preservada

- Pontos por posição: 1.º = 1000, 2.º = 800, 3.º = 650 ... 20.º = 16, com cauda até 100.º.
- Divisões Super League: 1 = 2.30; 2 = 1.55; 3 = 1.10; 4 = 0.87; 5 = 0.75; 6 = 0.58; 7 = 0.44; 8 = 0.32; 9 = 0.22; 10 = 0.14; 11 = 0.08.
- Tipos de competição: Nacional = 1.00; Continental = 1.50; Super League = 2.00; Internacional = 1.50.
- Bónus: campeão nacional = 300; campeão Super League = 400; promoção Super League = 200.
- Decaimento: 1.00, 0.85, 0.70, 0.55 e 0.40.
- Fases eliminatórias: finalista = 0.30; meia-final = 0.15; quartos = 0.075.

## Regra arquitetural

Todas as páginas e perfis devem consumir `ranking-engine.ts`. Não podem recalcular pontos dentro de componentes React.

## Estado da Fase 1

- Clubes: funcional a partir das classificações importadas.
- Treinadores, países, jogadores e competições: tabs e filtros preparados; ligação ao motor pendente.
