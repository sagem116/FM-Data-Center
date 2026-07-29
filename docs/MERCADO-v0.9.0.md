# Mercado Intelligence — metodologia v0.9.0

## Dados cruzados

Cada transferência é ligada, na mesma época, a:

- perfil do jogador: idade, posição, nacionalidade, valor de mercado e salário;
- qualidade: C.A., C.P., margem potencial e reputação;
- clube vendedor e comprador;
- competições disputadas por ambos os clubes;
- treinador principal associado ao clube nessa época.

## Indicadores financeiros

- **Investimento:** soma dos valores garantidos das entradas.
- **Receita:** soma dos valores garantidos das saídas.
- **Saldo:** receita menos investimento.
- **Preço/VP:** valor da transferência dividido pelo valor de mercado.
- **Lucro de trading estimado:** valor de venda menos a compra anterior identificada do mesmo jogador pelo clube vendedor.

O lucro estimado não inclui salários, comissões, prémios, percentagens de futuras vendas ou inflação.

## Perfis inferidos

- orientação jovem e peso Sub-21;
- recrutamento experiente;
- foco em potencial através de C.P. − C.A.;
- contratação de estrelas e titulares imediatos;
- preferência posicional;
- mercado interno, estrangeiro e internacional;
- perfil investidor ou vendedor;
- prémio ou desconto face ao valor de mercado;
- rotas dominantes entre clubes, países e continentes.

## Correlações

A página calcula correlações de Pearson entre o valor da transferência e:

- C.A.;
- C.P.;
- idade;
- reputação;
- salário;
- valor de mercado;
- margem C.P. − C.A.

Correlação não significa causalidade. A página apresenta sempre a amostra usada.

## Limitações

- O treinador é associado por clube e época, não pela data exata da transferência.
- Uma transferência pode contribuir para várias competições quando o clube participou em vários contextos na mesma época.
- Valores não divulgados permanecem ausentes.
- Nenhum campo técnico ou financeiro é inventado.
