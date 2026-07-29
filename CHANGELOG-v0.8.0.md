# FM Data Center v0.8.0

## Competições
- Suporte ao formato `Competition | Reputação | Pais | Contintente`.
- País, continente e tipo competitivo são guardados na entidade competição.

## Scores
- 32 roles iniciais baseadas no documento fornecido.
- Role Attribute Score, Role Performance Score, contexto, cobertura e confiança.
- Normalização configurável por global, posição, competição ou posição + competição.
- Editor completo de roles, atributos, métricas e pesos.
- Criar, duplicar e apagar roles.
- Importar/exportar configuração JSON.
- Perfis inferidos de competições e clubes: ataque, defesa, técnica, física, criatividade e intensidade.
- Insights determinísticos e explicáveis.
- Importação passa a guardar todos os atributos e métricas numéricas disponíveis.

Após atualizar, reimporte Competições, Jogadores e Estatísticas para preencher os novos campos canónicos.
