# FM Data Center v0.4.2

- Corrigida a inspeção de jogadores: deixou de ordenar por um índice `updatedAt` inexistente no Dexie.
- Falhas numa amostra deixam de esconder as restantes contagens do Diagnóstico.
- Dashboard ligado às contagens reais da IndexedDB.
- Dashboard e Diagnóstico atualizam após cada importação, ao recuperar foco e manualmente.
- Adicionado teste de regressão para a leitura de jogadores importados.
