# Perfis de Entidades — metodologia v0.10.0

## Entidades

- Competições
- Clubes
- Jogadores
- Treinadores

## Mercado

Cruza transferências com idade, posição, C.A., C.P., reputação, valor de mercado, salário, clube, competição e treinador na mesma época. Mostra investimento, receita, balanço e perfil por época. No perfil de jogador, os valores representam o montante movimentado pela carreira e não um saldo financeiro do jogador.

## Histórico

- Super League: só existe campeão quando `Inf = C`.
- Ligas: posição 1 ou código de campeão.
- Eliminatórias: fase Vencedor/Winner.
- O treinador campeão é associado pelo clube ou seleção e pela época.

## Hall of Fame

Os números são limitados ao contexto do perfil:

- numa competição, apenas estatísticas nessa competição;
- num clube, apenas estatísticas ao serviço desse clube;
- num treinador, apenas jogadores e resultados nas épocas dos clubes associados;
- num jogador, apenas os seus registos de carreira importados.

## Estilo de jogo

Índice relativo com base 100 igual à média global da base. Combina métricas individuais e atributos dos jogadores ligados à entidade. As dimensões iniciais são produção ofensiva, criação, controlo técnico, defesa, pressão, verticalidade, poder físico e disciplina. Cada dimensão mostra cobertura e os indicadores reconhecidos.

## Evolução

Séries por época de reputação, idade, valor, salários, C.A., C.P., produção, avaliação e mercado, consoante a entidade e a disponibilidade dos dados.
