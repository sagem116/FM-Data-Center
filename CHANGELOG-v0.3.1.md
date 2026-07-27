# FM Data Center v0.3.1

## Correções

- Vitest passa a carregar `@testing-library/jest-dom/vitest`, disponibilizando `expect` corretamente.
- Campos opcionais do modelo recebem `undefined` em vez de `null` durante a persistência.
- Argumentos opcionais de resolução de clubes e competições recebem `undefined` quando vazios.
- Versão atualizada para 0.3.1.
- `npm run typecheck` passa a usar `tsc -b`, alinhado com a validação executada pelo build.

## Validação local

Executar:

```bash
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

Não usar `npm audit fix --force` sem rever as alterações, porque pode atualizar dependências com breaking changes.
