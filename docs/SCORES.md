# Sistema Scores

## Objetivo

Os Scores formam a primeira camada de análise do FM Data Center. Avaliam aquilo que um jogador parece ter capacidade para fazer, aquilo que efetivamente produziu e a confiança que os dados permitem atribuir à avaliação.

## Componentes

A configuração base combina atributos, métricas e contexto. Os valores são editáveis por role. Guarda-redes e funções muito dependentes de produção possuem proporções específicas.

Cada resultado apresenta:

- Score total da role;
- Atributos;
- Desempenho;
- Contexto;
- Confiança;
- Cobertura;
- Score ajustado pela confiança;
- contribuições individuais;
- pontos fortes e limitações.

## Normalização

As métricas podem ser comparadas:

- globalmente;
- por posição;
- por competição;
- por posição e competição.

Os percentis são calculados com pesquisa binária sobre distribuições ordenadas, permitindo processar universos grandes sem comparar cada jogador com todos os restantes em cada variável.

## Dados em falta

Existem duas estratégias:

- reponderar apenas os dados disponíveis;
- tratar os dados em falta como zero.

A cobertura é sempre mostrada. A aplicação não inventa métricas ausentes.

## Confiança

Os minutos determinam a confiança, separadamente do score principal. Os limites são configuráveis. Uma amostra curta reduz o score ajustado e fica claramente identificada.

## Inferências

As dimensões iniciais são:

- Ataque;
- Defesa;
- Técnica;
- Física;
- Criatividade;
- Intensidade.

Todas podem ser criadas, editadas, duplicadas ou eliminadas na Configuração Scores. Cada dimensão pode combinar atributos e métricas com pesos e direções próprias.

A aplicação agrega os jogadores para produzir perfis de clubes e competições, médias de valor, salário, CA, PA e score, tendências dominantes e correlações. Estas relações são descritivas e não são apresentadas como causalidade.

## Importação e exportação

Toda a configuração pode ser exportada para JSON e restaurada noutra instalação. O JSON inclui roles, atributos, métricas, pesos, normalização, contexto, confiança e dimensões de inferência.
