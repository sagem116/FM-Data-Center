# FM Data Center v0.3.0

Reconstrução limpa da FM Rankings.

## Estado atual

- Importação dos sete ficheiros Excel com preview e validação.
- Identidade canónica de jogadores por IDU, nome+data de nascimento ou fallback nome+clube+idade.
- Modelo de dados por época em IndexedDB/Dexie.
- Reimportação transacional por bloco: os dados antigos só são substituídos dentro da mesma transação.
- Registo persistente de sessões, avisos, erros e identidades de baixa confiança.
- Centro de diagnóstico para duplicados e associações órfãs.

## Executar

```bash
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

## Próxima fase

Validar os sete importadores com os ficheiros reais e fechar os mapeamentos completos de atributos e métricas antes de iniciar Rankings.
