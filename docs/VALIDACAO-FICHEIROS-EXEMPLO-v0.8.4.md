# Validação dos ficheiros de exemplo — v0.8.4

Os parsers foram executados diretamente sobre os sete ficheiros fornecidos pelo utilizador.

| Bloco | Tipo detetado | Linhas de origem | Entidades/registos válidos | Erros de parsing |
|---|---:|---:|---:|---:|
| Clubes | Clubes | 1 357 | 893 entidades normalizadas | 0 |
| Competições | Competições | 179 | 179 | 0 |
| Jogadores | Jogadores | 6 857 | 6 854 | 0 |
| Treinadores | Treinadores | 1 209 | 1 209 | 0 |
| Estatísticas | Estatísticas | 34 785 | 34 785 | 0 |
| Classificações | Classificações | 1 234 | 1 234 | 0 |
| Transferências | Transferências | 653 | 652 | 0 |

As diferenças entre linhas de origem e registos válidos correspondem a cabeçalhos repetidos ou linhas-placeholder existentes dentro dos ficheiros. Estes registos são agora ignorados deliberadamente.

## Regras verificadas

- Nomes equivalentes conhecidos são reconciliados por aliases explícitos.
- Clubes diferentes com nomes semelhantes não são fundidos automaticamente.
- A reputação mais alta é preservada quando duas variantes inequívocas do mesmo clube aparecem no ficheiro.
- Competições usam o mesmo nome canónico em reputação, estatísticas e classificações.
- Países são normalizados a partir de português, inglês e códigos futebolísticos encontrados nos exemplos.
- Valores como `2,513,000 € p/a` são guardados como `2513000`.
- `Imp` corresponde a Impulsão e `Imp_2` a Imprevisibilidade.
