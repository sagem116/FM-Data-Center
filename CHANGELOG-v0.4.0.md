# FM Data Center v0.4.0

## Importação real
- Preview ampliado para 50 linhas.
- Alternância entre dados normalizados e `raw`.
- Indicador de progresso por fase.
- Comparação de registos antes/depois de cada reimportação.
- Histórico de sessões de importação.
- Página de inspeção de jogadores, clubes e competições persistidos.
- Aliases corrigidos para os cabeçalhos reais dos ficheiros de exemplo.
- Testes específicos para Estatísticas, Treinadores e Jogadores.

## Garantias mantidas
- Escrita transacional por bloco e época.
- Dados anteriores preservados quando a transação falha.
- IDU prioritário e identidades de baixa confiança diagnosticadas.
