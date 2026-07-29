# FM Data Center v0.8.4

## Mapeamentos validados
- Deteção e leitura confirmadas para os sete ficheiros reais: Clubes, Competições, Jogadores, Treinadores, Estatísticas, Classificações e Transferências.
- Aliases de clubes e competições corrigidos a partir dos exemplos.
- Países e códigos FIFA/ISO normalizados; códigos realmente ambíguos permanecem no Debug Países.
- Cabeçalhos repetidos e linhas-placeholder deixam de criar entidades falsas.
- Valores monetários com separadores de milhares são importados corretamente.
- `Imp` e `Imp_2` são mapeados respetivamente para Impulsão e Imprevisibilidade.

## Debugs
- Alertas de campos em falta só são criados quando o ficheiro de origem correspondente foi importado.
- Clubes sem liga nacional só são assinalados quando existem classificações importadas para o país desse clube.
- Formatos Apertura/Clausura e fases nacionais múltiplas deixam de aparecer como conflito crítico.
- Campos opcionais, como assistência média, deixam de gerar falsos avisos.
- Funções internacionais sem seleção identificável aparecem individualmente e podem ser resolvidas manualmente.

## Reconciliação
- Competições antigas com grafias divergentes são reconciliadas pelo nome canónico durante a reimportação.
- País e continente dos clubes são inferidos das respetivas ligas nacionais quando a ligação é inequívoca.
- A associação manual de um selecionador limpa o aviso internacional pendente.
