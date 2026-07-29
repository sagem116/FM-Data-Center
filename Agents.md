# FM Data Center — Instruções para agentes

## Objetivo

Construir uma aplicação local, modular e auditável para importar e analisar dados exportados do Football Manager.

## Domínios

1. Importação
2. Rankings
3. Scores
4. Análise
5. Mercado
6. Diagnóstico

## Regras técnicas

- Usar React, Vite e TypeScript estrito.
- Não usar `any`, `ts-ignore` ou fallbacks silenciosos.
- IndexedDB/Dexie é a fonte principal de dados locais.
- Não guardar dados principais em `localStorage`.
- Manter lógica de negócio fora dos componentes React.
- IDU é a identidade principal de jogadores e treinadores.
- Separar identidade permanente dos dados por época.
- Reimportações não podem alterar outras épocas.
- Importações devem ser transacionais.
- Nunca apagar dados antigos antes de validar e iniciar a escrita dos novos.
- Rankings e Scores terão um único motor canónico cada.
- Erros devem indicar, quando possível, ficheiro, folha, linha, coluna e motivo.

## Validação obrigatória

Antes de concluir uma tarefa, executar:

```bash
npm run typecheck
npm test
npm run build
```

Não considerar a tarefa concluída enquanto algum comando falhar.

## Git

- Não incluir `node_modules`, `dist`, `coverage` ou ficheiros temporários.
- Preferir branches por fase e commits pequenos e descritivos.
