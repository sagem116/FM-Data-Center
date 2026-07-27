# FM Data Center — Instruções para agentes

## Objetivo

Construir uma aplicação local e modular para análise de dados exportados do Football Manager.

## Módulos

1. Importação
2. Rankings
3. Scores
4. Análise
5. Mercado
6. Diagnóstico

## Regras técnicas

- React, TypeScript estrito e Vite.
- IndexedDB através de Dexie.
- Zod para validação.
- Vitest para testes.
- Não utilizar `any` ou `ts-ignore`.
- Não guardar dados principais em localStorage.
- Não colocar fórmulas em componentes React.
- Cada domínio deve ter serviços e tipos próprios.
- Apenas um motor canónico de Rankings.
- Apenas um motor canónico de Scores.
- IDU é a identidade principal de jogadores e treinadores.
- Separar identidade permanente dos dados por época.
- Reimportações não podem alterar outras épocas.
- Importações devem ser transacionais.
- Nunca apagar dados antigos antes de validar os novos.

## Validação obrigatória

Antes de terminar uma tarefa executar:

npm run typecheck
npm test
npm run build

Não considerar a tarefa concluída enquanto algum destes comandos falhar.

## Git

- Não trabalhar diretamente em `main`.
- Criar uma branch por fase.
- Fazer commits pequenos e descritivos.
- Não incluir node_modules, dist ou ficheiros temporários.