# FM Data Center v0.8.2

## Debug Scores

- Auditoria por época das roles, atributos, métricas e cobertura.
- Deteção de componentes totalmente ausentes ou parcialmente reconhecidos.
- Deteção de pesos que não somam 100%, roles duplicadas e roles sem posições.
- Mapeamento manual de uma métrica/atributo canónico para uma chave real importada.
- Desativação manual de componentes e normalização automática de pesos.
- Exportação do diagnóstico em JSON.

## Debug Rankings

- Auditoria de competições, classificações, épocas e ligações de entidades.
- Deteção de tipo desconhecido, divisão em falta, reputação e localização incompletas.
- Deteção de classificações órfãs, nomes divergentes e clubes/seleções não ligados.
- Verificação explícita da regra de campeão da Super League por `Inf = C`.
- Edição manual de competição, divisão, tipo, país, continente e reputação.
- Relink manual de classificações e correção do nome da competição.

## Debug Países

- Catálogo central com 255 países e entidades futebolísticas.
- Resolução sem distinguir caixa, acentos ou pontuação.
- Suporte para português, inglês, ISO-2, ISO-3 e aliases/abreviaturas.
- Deteção de países desconhecidos, ambíguos, ausentes e conflitos de continente.
- Overrides manuais persistentes e normalização de toda a base.
- Importadores passam a usar o normalizador central para clubes, competições, jogadores, treinadores e seleções.

## Qualidade

- TypeScript verificado sem erros.
- Testes adicionados para normalização de países e aliases manuais dos Scores.
