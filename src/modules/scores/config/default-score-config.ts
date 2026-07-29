import type { ScoreConfig } from './types'

const BASE_SCORE_CONFIG: ScoreConfig = {
  "version": 1,
  "normalizationScope": "position",
  "minimumMinutes": 300,
  "provisionalMinutes": 1200,
  "contextEnabled": true,
  "missingFeatureStrategy": "renormalize",
  "roles": [
    {
      "id": "guarda-redes-defesa",
      "name": "Guarda-Redes — Defesa",
      "category": "goalkeeper",
      "positionGroups": [
        "GK"
      ],
      "enabled": true,
      "components": {
        "attributes": 65,
        "metrics": 30,
        "context": 5
      },
      "attributes": [
        {
          "id": "reflexos",
          "label": "Reflexos",
          "weight": 15.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "um-para-um",
          "label": "Um para Um",
          "weight": 13.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "agarrar-a-bola",
          "label": "Agarrar a Bola",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "posicionamento",
          "label": "Posicionamento",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "concentracao",
          "label": "Concentração",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "jogo-aereo",
          "label": "Jogo Aéreo",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "comunicacao",
          "label": "Comunicação",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "agilidade",
          "label": "Agilidade",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "comando-da-area",
          "label": "Comando da Área",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "golos-evitados-face-ao-xg-sofrido",
          "label": "Golos evitados face ao xG sofrido",
          "weight": 24.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "percentagem-de-defesas",
          "label": "Percentagem de defesas",
          "weight": 18.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "defesas-por-90",
          "label": "Defesas por 90",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "percentagem-de-remates-defendidos-dentro-da-area",
          "label": "Percentagem de remates defendidos dentro da área",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "clean-sheets-ajustadas",
          "label": "Clean sheets ajustadas",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "sucesso-em-situacoes-de-um-para-um",
          "label": "Sucesso em situações de um para um",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "erros-que-originam-remate-golo",
          "label": "Erros que originam remate/golo",
          "weight": 8.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "saidas-aereas-bem-sucedidas",
          "label": "Saídas aéreas bem-sucedidas",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "notes": "Penalizações importantes: erros, ressaltos concedidos, má taxa em remates próximos e golos sofridos acima do xG."
    },
    {
      "id": "guarda-redes-libero-apoio",
      "name": "Guarda-Redes Líbero — Apoio",
      "category": "goalkeeper",
      "positionGroups": [
        "GK"
      ],
      "enabled": true,
      "components": {
        "attributes": 65,
        "metrics": 30,
        "context": 5
      },
      "attributes": [
        {
          "id": "reflexos",
          "label": "Reflexos",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "um-para-um",
          "label": "Um para Um",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "posicionamento",
          "label": "Posicionamento",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "saidas",
          "label": "Saídas",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "aceleracao",
          "label": "Aceleração",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passe",
          "label": "Passe",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "primeiro-toque",
          "label": "Primeiro Toque",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "pontapes",
          "label": "Pontapés",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "lancamentos",
          "label": "Lançamentos",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "visao-de-jogo",
          "label": "Visão de Jogo",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "golos-evitados",
          "label": "Golos evitados",
          "weight": 18.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "percentagem-de-defesas",
          "label": "Percentagem de defesas",
          "weight": 13.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "acoes-defensivas-fora-da-area",
          "label": "Ações defensivas fora da área",
          "weight": 13.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "sucesso-nas-saidas",
          "label": "Sucesso nas saídas",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-completos",
          "label": "Passes completos",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-progressivos",
          "label": "Passes progressivos",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "precisao-em-passes-longos",
          "label": "Precisão em passes longos",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "perdas-de-bola-perigosas",
          "label": "Perdas de bola perigosas",
          "weight": 8.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "envolvimento-na-construcao",
          "label": "Envolvimento na construção",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "acoes-como-ultimo-defensor",
          "label": "Ações como último defensor",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "notes": "Para Ataque, aumentar Passe, Primeiro Toque, Compostura, Visão de Jogo, Aceleração e ações fora da área; reduzir ligeiramente Agarrar a Bola e Jogo Aéreo."
    },
    {
      "id": "defesa-central-defesa",
      "name": "Defesa Central — Defesa",
      "category": "outfield",
      "positionGroups": [
        "DC"
      ],
      "enabled": true,
      "components": {
        "attributes": 60,
        "metrics": 35,
        "context": 5
      },
      "attributes": [
        {
          "id": "posicionamento",
          "label": "Posicionamento",
          "weight": 13.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "marcacao",
          "label": "Marcação",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "desarme",
          "label": "Desarme",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "concentracao",
          "label": "Concentração",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "impulsao",
          "label": "Impulsão",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "cabeceamento",
          "label": "Cabeceamento",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "forca",
          "label": "Força",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "velocidade",
          "label": "Velocidade",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "aceleracao",
          "label": "Aceleração",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "duelos-defensivos-ganhos",
          "label": "Duelos defensivos ganhos",
          "weight": 15.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "duelos-aereos-ganhos",
          "label": "Duelos aéreos ganhos",
          "weight": 14.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "intercecoes",
          "label": "Interceções",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "cortes",
          "label": "Cortes",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "desarmes-ganhos",
          "label": "Desarmes ganhos",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "remates-bloqueados",
          "label": "Remates bloqueados",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "erros-defensivos",
          "label": "Erros defensivos",
          "weight": 12.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "dribles-sofridos",
          "label": "Dribles sofridos",
          "weight": 7.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "perdas-perigosas",
          "label": "Perdas perigosas",
          "weight": 6.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "disciplina-defensiva",
          "label": "Disciplina defensiva",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "notes": "Não atribuir demasiado valor ao número bruto de cortes: um central numa equipa dominante terá menos oportunidades defensivas."
    },
    {
      "id": "defesa-com-bola-defesa",
      "name": "Defesa com Bola — Defesa",
      "category": "outfield",
      "positionGroups": [
        "DC"
      ],
      "enabled": true,
      "components": {
        "attributes": 60,
        "metrics": 35,
        "context": 5
      },
      "attributes": [
        {
          "id": "posicionamento",
          "label": "Posicionamento",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "marcacao",
          "label": "Marcação",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "desarme",
          "label": "Desarme",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "concentracao",
          "label": "Concentração",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passe",
          "label": "Passe",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "visao-de-jogo",
          "label": "Visão de Jogo",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "primeiro-toque",
          "label": "Primeiro Toque",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "tecnica",
          "label": "Técnica",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "impulsao",
          "label": "Impulsão",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "velocidade",
          "label": "Velocidade",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "passes-progressivos",
          "label": "Passes progressivos",
          "weight": 15.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "quebras-de-linha-atraves-de-passe",
          "label": "Quebras de linha através de passe",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "precisao-de-passe-ajustada-a-dificuldade",
          "label": "Precisão de passe ajustada à dificuldade",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "precisao-em-passes-longos",
          "label": "Precisão em passes longos",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducoes-progressivas",
          "label": "Conduções progressivas",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "perdas-no-primeiro-terco",
          "label": "Perdas no primeiro terço",
          "weight": 9.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "duelos-defensivos-ganhos",
          "label": "Duelos defensivos ganhos",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "duelos-aereos-ganhos",
          "label": "Duelos aéreos ganhos",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "intercecoes",
          "label": "Interceções",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "erros-defensivos",
          "label": "Erros defensivos",
          "weight": 8.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "participacao-na-construcao",
          "label": "Participação na construção",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "notes": "Para função de Cobertura, aumentar Velocidade, Aceleração, Antecipação, Posicionamento e ações defensivas em profundidade."
    },
    {
      "id": "defesa-sem-nonsense",
      "name": "Defesa Sem-Nonsense",
      "category": "outfield",
      "positionGroups": [
        "DC"
      ],
      "enabled": true,
      "components": {
        "attributes": 60,
        "metrics": 35,
        "context": 5
      },
      "attributes": [
        {
          "id": "posicionamento",
          "label": "Posicionamento",
          "weight": 14.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "marcacao",
          "label": "Marcação",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "desarme",
          "label": "Desarme",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "concentracao",
          "label": "Concentração",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "impulsao",
          "label": "Impulsão",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "cabeceamento",
          "label": "Cabeceamento",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "forca",
          "label": "Força",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "bravura",
          "label": "Bravura",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "duelos-aereos-ganhos",
          "label": "Duelos aéreos ganhos",
          "weight": 20.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "cortes",
          "label": "Cortes",
          "weight": 16.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "duelos-defensivos-ganhos",
          "label": "Duelos defensivos ganhos",
          "weight": 15.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "bloqueios",
          "label": "Bloqueios",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "intercecoes",
          "label": "Interceções",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "erros",
          "label": "Erros",
          "weight": 12.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "dribles-sofridos",
          "label": "Dribles sofridos",
          "weight": 8.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "disciplina",
          "label": "Disciplina",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "notes": "O passe deve ter pouco peso, mas as perdas perigosas continuam a ser penalizadas."
    },
    {
      "id": "defesa-central-aberto",
      "name": "Defesa Central Aberto",
      "category": "outfield",
      "positionGroups": [
        "DC"
      ],
      "enabled": true,
      "components": {
        "attributes": 60,
        "metrics": 35,
        "context": 5
      },
      "attributes": [
        {
          "id": "velocidade",
          "label": "Velocidade",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "aceleracao",
          "label": "Aceleração",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "posicionamento",
          "label": "Posicionamento",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "desarme",
          "label": "Desarme",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "marcacao",
          "label": "Marcação",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "concentracao",
          "label": "Concentração",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passe",
          "label": "Passe",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducao",
          "label": "Condução",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "tecnica",
          "label": "Técnica",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "resistencia",
          "label": "Resistência",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "duelos-defensivos-em-zonas-laterais",
          "label": "Duelos defensivos em zonas laterais",
          "weight": 13.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "desarmes",
          "label": "Desarmes",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "intercecoes",
          "label": "Interceções",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "duelos-aereos",
          "label": "Duelos aéreos",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducoes-progressivas",
          "label": "Conduções progressivas",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-progressivos",
          "label": "Passes progressivos",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "entradas-no-meio-campo-adversario",
          "label": "Entradas no meio-campo adversário",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "perdas-de-bola",
          "label": "Perdas de bola",
          "weight": 8.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "dribles-sofridos",
          "label": "Dribles sofridos",
          "weight": 8.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "criacao-ofensiva",
          "label": "Criação ofensiva",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "erros-defensivos",
          "label": "Erros defensivos",
          "weight": 5.0,
          "enabled": true,
          "direction": "lower"
        }
      ],
      "notes": ""
    },
    {
      "id": "lateral-defesa",
      "name": "Lateral — Defesa",
      "category": "outfield",
      "positionGroups": [
        "DL",
        "DR",
        "WBL",
        "WBR"
      ],
      "enabled": true,
      "components": {
        "attributes": 60,
        "metrics": 35,
        "context": 5
      },
      "attributes": [
        {
          "id": "posicionamento",
          "label": "Posicionamento",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "marcacao",
          "label": "Marcação",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "desarme",
          "label": "Desarme",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "concentracao",
          "label": "Concentração",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "aceleracao",
          "label": "Aceleração",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "velocidade",
          "label": "Velocidade",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "resistencia",
          "label": "Resistência",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "trabalho-de-equipa",
          "label": "Trabalho de Equipa",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passe",
          "label": "Passe",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "cruzamentos",
          "label": "Cruzamentos",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "duelos-defensivos-ganhos",
          "label": "Duelos defensivos ganhos",
          "weight": 17.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "desarmes-ganhos",
          "label": "Desarmes ganhos",
          "weight": 14.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "dribles-sofridos",
          "label": "Dribles sofridos",
          "weight": 13.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "intercecoes",
          "label": "Interceções",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "cruzamentos-bloqueados",
          "label": "Cruzamentos bloqueados",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "recuperacoes",
          "label": "Recuperações",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "erros-defensivos",
          "label": "Erros defensivos",
          "weight": 9.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "passes-completos",
          "label": "Passes completos",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "perdas-perigosas",
          "label": "Perdas perigosas",
          "weight": 7.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "disciplina",
          "label": "Disciplina",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "notes": ""
    },
    {
      "id": "lateral-apoio",
      "name": "Lateral — Apoio",
      "category": "outfield",
      "positionGroups": [
        "DL",
        "DR",
        "WBL",
        "WBR"
      ],
      "enabled": true,
      "components": {
        "attributes": 60,
        "metrics": 35,
        "context": 5
      },
      "attributes": [
        {
          "id": "resistencia",
          "label": "Resistência",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "aceleracao",
          "label": "Aceleração",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "velocidade",
          "label": "Velocidade",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "posicionamento",
          "label": "Posicionamento",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "desarme",
          "label": "Desarme",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "marcacao",
          "label": "Marcação",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "trabalho-de-equipa",
          "label": "Trabalho de Equipa",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passe",
          "label": "Passe",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "cruzamentos",
          "label": "Cruzamentos",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "tecnica",
          "label": "Técnica",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "primeiro-toque",
          "label": "Primeiro Toque",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "sem-bola",
          "label": "Sem Bola",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "passes-progressivos",
          "label": "Passes progressivos",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducoes-progressivas",
          "label": "Conduções progressivas",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "cruzamentos-completos",
          "label": "Cruzamentos completos",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "xa",
          "label": "xA",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-para-finalizacao",
          "label": "Passes para finalização",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "entradas-no-ultimo-terco",
          "label": "Entradas no último terço",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "duelos-defensivos-ganhos",
          "label": "Duelos defensivos ganhos",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "desarmes",
          "label": "Desarmes",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "intercecoes",
          "label": "Interceções",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "dribles-sofridos",
          "label": "Dribles sofridos",
          "weight": 8.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "perdas-de-bola",
          "label": "Perdas de bola",
          "weight": 6.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "recuperacoes",
          "label": "Recuperações",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "notes": ""
    },
    {
      "id": "ala-ataque",
      "name": "Ala — Ataque",
      "category": "outfield",
      "positionGroups": [
        "DL",
        "DR",
        "WBL",
        "WBR"
      ],
      "enabled": true,
      "components": {
        "attributes": 60,
        "metrics": 35,
        "context": 5
      },
      "attributes": [
        {
          "id": "aceleracao",
          "label": "Aceleração",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "velocidade",
          "label": "Velocidade",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "resistencia",
          "label": "Resistência",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "cruzamentos",
          "label": "Cruzamentos",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducao",
          "label": "Condução",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "tecnica",
          "label": "Técnica",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "sem-bola",
          "label": "Sem Bola",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "trabalho-de-equipa",
          "label": "Trabalho de Equipa",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "primeiro-toque",
          "label": "Primeiro Toque",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "agilidade",
          "label": "Agilidade",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passe",
          "label": "Passe",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "xa",
          "label": "xA",
          "weight": 13.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "assistencias-esperadas-sem-bola-parada",
          "label": "Assistências esperadas sem bola parada",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "cruzamentos-completos",
          "label": "Cruzamentos completos",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-para-finalizacao",
          "label": "Passes para finalização",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducoes-progressivas",
          "label": "Conduções progressivas",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "entradas-na-area",
          "label": "Entradas na área",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "toques-na-area-adversaria",
          "label": "Toques na área adversária",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "dribles-bem-sucedidos",
          "label": "Dribles bem-sucedidos",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "perdas-de-bola",
          "label": "Perdas de bola",
          "weight": 6.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "recuperacoes-em-zonas-altas",
          "label": "Recuperações em zonas altas",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "duelos-defensivos",
          "label": "Duelos defensivos",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "golos-e-xg",
          "label": "Golos e xG",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "notes": ""
    },
    {
      "id": "lateral-invertido-apoio",
      "name": "Lateral Invertido — Apoio",
      "category": "outfield",
      "positionGroups": [
        "DL",
        "DR",
        "WBL",
        "WBR"
      ],
      "enabled": true,
      "components": {
        "attributes": 60,
        "metrics": 35,
        "context": 5
      },
      "attributes": [
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "posicionamento",
          "label": "Posicionamento",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passe",
          "label": "Passe",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "primeiro-toque",
          "label": "Primeiro Toque",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "tecnica",
          "label": "Técnica",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "visao-de-jogo",
          "label": "Visão de Jogo",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "trabalho-de-equipa",
          "label": "Trabalho de Equipa",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "desarme",
          "label": "Desarme",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "concentracao",
          "label": "Concentração",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "aceleracao",
          "label": "Aceleração",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "resistencia",
          "label": "Resistência",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "sem-bola",
          "label": "Sem Bola",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "passes-progressivos",
          "label": "Passes progressivos",
          "weight": 15.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "rececoes-entre-linhas",
          "label": "Receções entre linhas",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-para-o-ultimo-terco",
          "label": "Passes para o último terço",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "precisao-sob-pressao",
          "label": "Precisão sob pressão",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "participacao-na-construcao",
          "label": "Participação na construção",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducoes-progressivas",
          "label": "Conduções progressivas",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "perdas-no-corredor-central",
          "label": "Perdas no corredor central",
          "weight": 10.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "intercecoes",
          "label": "Interceções",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "recuperacoes",
          "label": "Recuperações",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "duelos-defensivos-ganhos",
          "label": "Duelos defensivos ganhos",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "xa-e-passes-chave",
          "label": "xA e passes-chave",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "erros-defensivos",
          "label": "Erros defensivos",
          "weight": 3.0,
          "enabled": true,
          "direction": "lower"
        }
      ],
      "notes": ""
    },
    {
      "id": "medio-recuperador-de-bolas",
      "name": "Médio Recuperador de Bolas",
      "category": "outfield",
      "positionGroups": [
        "DM"
      ],
      "enabled": true,
      "components": {
        "attributes": 60,
        "metrics": 35,
        "context": 5
      },
      "attributes": [
        {
          "id": "desarme",
          "label": "Desarme",
          "weight": 13.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "agressividade",
          "label": "Agressividade",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "indice-de-trabalho",
          "label": "Índice de Trabalho",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "resistencia",
          "label": "Resistência",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "posicionamento",
          "label": "Posicionamento",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "concentracao",
          "label": "Concentração",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "bravura",
          "label": "Bravura",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "trabalho-de-equipa",
          "label": "Trabalho de Equipa",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "forca",
          "label": "Força",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "aceleracao",
          "label": "Aceleração",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "desarmes-ganhos",
          "label": "Desarmes ganhos",
          "weight": 17.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "pressoes-eficazes",
          "label": "Pressões eficazes",
          "weight": 13.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "recuperacoes",
          "label": "Recuperações",
          "weight": 13.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "intercecoes",
          "label": "Interceções",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "duelos-defensivos-ganhos",
          "label": "Duelos defensivos ganhos",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "recuperacoes-no-meio-campo-adversario",
          "label": "Recuperações no meio-campo adversário",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "faltas-cometidas",
          "label": "Faltas cometidas",
          "weight": 8.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "cartoes",
          "label": "Cartões",
          "weight": 5.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "dribles-sofridos",
          "label": "Dribles sofridos",
          "weight": 6.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "perdas-perigosas",
          "label": "Perdas perigosas",
          "weight": 5.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "coberturas-defensivas",
          "label": "Coberturas defensivas",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "notes": "Não premiar cegamente agressividade: muitas faltas, cartões ou saídas de posição devem reduzir o score."
    },
    {
      "id": "trinco-medio-defensivo-defesa",
      "name": "Trinco / Médio Defensivo — Defesa",
      "category": "outfield",
      "positionGroups": [
        "DM"
      ],
      "enabled": true,
      "components": {
        "attributes": 60,
        "metrics": 35,
        "context": 5
      },
      "attributes": [
        {
          "id": "posicionamento",
          "label": "Posicionamento",
          "weight": 13.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "concentracao",
          "label": "Concentração",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "desarme",
          "label": "Desarme",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "marcacao",
          "label": "Marcação",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "trabalho-de-equipa",
          "label": "Trabalho de Equipa",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passe",
          "label": "Passe",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "forca",
          "label": "Força",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "indice-de-trabalho",
          "label": "Índice de Trabalho",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "primeiro-toque",
          "label": "Primeiro Toque",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "impulsao",
          "label": "Impulsão",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "intercecoes",
          "label": "Interceções",
          "weight": 15.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "recuperacoes",
          "label": "Recuperações",
          "weight": 13.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "duelos-defensivos-ganhos",
          "label": "Duelos defensivos ganhos",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "desarmes-ganhos",
          "label": "Desarmes ganhos",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "bloqueio-de-linhas-de-passe",
          "label": "Bloqueio de linhas de passe",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "perdas-perigosas",
          "label": "Perdas perigosas",
          "weight": 10.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "precisao-de-passe",
          "label": "Precisão de passe",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-progressivos",
          "label": "Passes progressivos",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "disciplina-posicional",
          "label": "Disciplina posicional",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "duelos-aereos",
          "label": "Duelos aéreos",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "erros",
          "label": "Erros",
          "weight": 4.0,
          "enabled": true,
          "direction": "lower"
        }
      ],
      "notes": ""
    },
    {
      "id": "organizador-movel-regista",
      "name": "Organizador Móvel / Regista",
      "category": "outfield",
      "positionGroups": [
        "DM"
      ],
      "enabled": true,
      "components": {
        "attributes": 60,
        "metrics": 35,
        "context": 5
      },
      "attributes": [
        {
          "id": "passe",
          "label": "Passe",
          "weight": 13.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "visao-de-jogo",
          "label": "Visão de Jogo",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "tecnica",
          "label": "Técnica",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "primeiro-toque",
          "label": "Primeiro Toque",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "posicionamento",
          "label": "Posicionamento",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "trabalho-de-equipa",
          "label": "Trabalho de Equipa",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "sem-bola",
          "label": "Sem Bola",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "agilidade",
          "label": "Agilidade",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "equilibrio",
          "label": "Equilíbrio",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "desarme",
          "label": "Desarme",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "resistencia",
          "label": "Resistência",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "passes-progressivos",
          "label": "Passes progressivos",
          "weight": 17.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-para-o-ultimo-terco",
          "label": "Passes para o último terço",
          "weight": 13.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "quebras-de-linha",
          "label": "Quebras de linha",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-chave",
          "label": "Passes-chave",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "xa",
          "label": "xA",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "rececoes-sob-pressao",
          "label": "Receções sob pressão",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "precisao-de-passe-ajustada",
          "label": "Precisão de passe ajustada",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "mudancas-de-flanco",
          "label": "Mudanças de flanco",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "perdas-perigosas",
          "label": "Perdas perigosas",
          "weight": 10.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "participacao-na-construcao",
          "label": "Participação na construção",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "recuperacoes",
          "label": "Recuperações",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "notes": ""
    },
    {
      "id": "meio-centro-entre-centrais",
      "name": "Meio-Centro Entre Centrais",
      "category": "outfield",
      "positionGroups": [
        "DM"
      ],
      "enabled": true,
      "components": {
        "attributes": 60,
        "metrics": 35,
        "context": 5
      },
      "attributes": [
        {
          "id": "posicionamento",
          "label": "Posicionamento",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "concentracao",
          "label": "Concentração",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passe",
          "label": "Passe",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "primeiro-toque",
          "label": "Primeiro Toque",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "desarme",
          "label": "Desarme",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "marcacao",
          "label": "Marcação",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "trabalho-de-equipa",
          "label": "Trabalho de Equipa",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "visao-de-jogo",
          "label": "Visão de Jogo",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "forca",
          "label": "Força",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "impulsao",
          "label": "Impulsão",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "resistencia",
          "label": "Resistência",
          "weight": 2.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "participacao-na-primeira-fase",
          "label": "Participação na primeira fase",
          "weight": 15.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-progressivos",
          "label": "Passes progressivos",
          "weight": 13.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "precisao-sob-pressao",
          "label": "Precisão sob pressão",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "perdas-no-primeiro-terco",
          "label": "Perdas no primeiro terço",
          "weight": 12.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "intercecoes",
          "label": "Interceções",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "coberturas-aos-centrais",
          "label": "Coberturas aos centrais",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "duelos-defensivos",
          "label": "Duelos defensivos",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-longos",
          "label": "Passes longos",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "rececoes-dos-defesas",
          "label": "Receções dos defesas",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "erros-defensivos",
          "label": "Erros defensivos",
          "weight": 7.0,
          "enabled": true,
          "direction": "lower"
        }
      ],
      "notes": ""
    },
    {
      "id": "medio-centro-apoio",
      "name": "Médio Centro — Apoio",
      "category": "outfield",
      "positionGroups": [
        "MC"
      ],
      "enabled": true,
      "components": {
        "attributes": 60,
        "metrics": 35,
        "context": 5
      },
      "attributes": [
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passe",
          "label": "Passe",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "primeiro-toque",
          "label": "Primeiro Toque",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "tecnica",
          "label": "Técnica",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "trabalho-de-equipa",
          "label": "Trabalho de Equipa",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "indice-de-trabalho",
          "label": "Índice de Trabalho",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "sem-bola",
          "label": "Sem Bola",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "posicionamento",
          "label": "Posicionamento",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "resistencia",
          "label": "Resistência",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "visao-de-jogo",
          "label": "Visão de Jogo",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "desarme",
          "label": "Desarme",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "aceleracao",
          "label": "Aceleração",
          "weight": 2.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "passes-progressivos",
          "label": "Passes progressivos",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-para-o-ultimo-terco",
          "label": "Passes para o último terço",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "rececoes-progressivas",
          "label": "Receções progressivas",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-chave",
          "label": "Passes-chave",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "xa",
          "label": "xA",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "recuperacoes",
          "label": "Recuperações",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "intercecoes",
          "label": "Interceções",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "duelos-ganhos",
          "label": "Duelos ganhos",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducoes-progressivas",
          "label": "Conduções progressivas",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "perdas",
          "label": "Perdas",
          "weight": 9.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "envolvimento-nas-sequencias-ofensivas",
          "label": "Envolvimento nas sequências ofensivas",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "entradas-na-area",
          "label": "Entradas na área",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "golos-e-xg",
          "label": "Golos e xG",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "notes": ""
    },
    {
      "id": "box-to-box",
      "name": "Box-to-Box",
      "category": "outfield",
      "positionGroups": [
        "MC"
      ],
      "enabled": true,
      "components": {
        "attributes": 60,
        "metrics": 35,
        "context": 5
      },
      "attributes": [
        {
          "id": "resistencia",
          "label": "Resistência",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "indice-de-trabalho",
          "label": "Índice de Trabalho",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "sem-bola",
          "label": "Sem Bola",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "trabalho-de-equipa",
          "label": "Trabalho de Equipa",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "aceleracao",
          "label": "Aceleração",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "velocidade",
          "label": "Velocidade",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passe",
          "label": "Passe",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "primeiro-toque",
          "label": "Primeiro Toque",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "desarme",
          "label": "Desarme",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "finalizacao",
          "label": "Finalização",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "forca",
          "label": "Força",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "remates-de-longe",
          "label": "Remates de Longe",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "acoes-progressivas-totais",
          "label": "Ações progressivas totais",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "recuperacoes",
          "label": "Recuperações",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "pressoes-eficazes",
          "label": "Pressões eficazes",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "duelos-ganhos",
          "label": "Duelos ganhos",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "entradas-no-ultimo-terco",
          "label": "Entradas no último terço",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "entradas-na-area",
          "label": "Entradas na área",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "toques-na-area",
          "label": "Toques na área",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "xg-sem-penaltis",
          "label": "xG sem penáltis",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "xa",
          "label": "xA",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-chave",
          "label": "Passes-chave",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducoes-progressivas",
          "label": "Conduções progressivas",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "perdas",
          "label": "Perdas",
          "weight": 6.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "distancia-percorrida-intensidade",
          "label": "Distância percorrida/intensidade",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "notes": ""
    },
    {
      "id": "carrilero",
      "name": "Carrilero",
      "category": "outfield",
      "positionGroups": [
        "MC"
      ],
      "enabled": true,
      "components": {
        "attributes": 60,
        "metrics": 35,
        "context": 5
      },
      "attributes": [
        {
          "id": "resistencia",
          "label": "Resistência",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "indice-de-trabalho",
          "label": "Índice de Trabalho",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "trabalho-de-equipa",
          "label": "Trabalho de Equipa",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "posicionamento",
          "label": "Posicionamento",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "sem-bola",
          "label": "Sem Bola",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passe",
          "label": "Passe",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "primeiro-toque",
          "label": "Primeiro Toque",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "desarme",
          "label": "Desarme",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "aceleracao",
          "label": "Aceleração",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "tecnica",
          "label": "Técnica",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "concentracao",
          "label": "Concentração",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducao",
          "label": "Condução",
          "weight": 2.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "coberturas-laterais",
          "label": "Coberturas laterais",
          "weight": 14.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "recuperacoes",
          "label": "Recuperações",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "intercecoes",
          "label": "Interceções",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "duelos-defensivos",
          "label": "Duelos defensivos",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-progressivos",
          "label": "Passes progressivos",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "rececoes-em-meio-espacos",
          "label": "Receções em meio-espaços",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducoes-progressivas",
          "label": "Conduções progressivas",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-para-o-ultimo-terco",
          "label": "Passes para o último terço",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "perdas",
          "label": "Perdas",
          "weight": 7.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "apoios-ao-lateral-ala",
          "label": "Apoios ao lateral/ala",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "pressoes-eficazes",
          "label": "Pressões eficazes",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "notes": ""
    },
    {
      "id": "mezzala-ataque",
      "name": "Mezzala — Ataque",
      "category": "outfield",
      "positionGroups": [
        "MC"
      ],
      "enabled": true,
      "components": {
        "attributes": 55,
        "metrics": 40,
        "context": 5
      },
      "attributes": [
        {
          "id": "sem-bola",
          "label": "Sem Bola",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "tecnica",
          "label": "Técnica",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "primeiro-toque",
          "label": "Primeiro Toque",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passe",
          "label": "Passe",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "visao-de-jogo",
          "label": "Visão de Jogo",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducao",
          "label": "Condução",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "aceleracao",
          "label": "Aceleração",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "agilidade",
          "label": "Agilidade",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "finalizacao",
          "label": "Finalização",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "remates-de-longe",
          "label": "Remates de Longe",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "criatividade-imprevisibilidade",
          "label": "Criatividade/Imprevisibilidade",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "rececoes-entre-linhas",
          "label": "Receções entre linhas",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "entradas-no-ultimo-terco",
          "label": "Entradas no último terço",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "entradas-na-area",
          "label": "Entradas na área",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducoes-progressivas",
          "label": "Conduções progressivas",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-chave",
          "label": "Passes-chave",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "xa",
          "label": "xA",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "xg-sem-penaltis",
          "label": "xG sem penáltis",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "golos",
          "label": "Golos",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "dribles-bem-sucedidos",
          "label": "Dribles bem-sucedidos",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "toques-na-area",
          "label": "Toques na área",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "perdas",
          "label": "Perdas",
          "weight": 6.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "pressoes-altas",
          "label": "Pressões altas",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "notes": ""
    },
    {
      "id": "construtor-de-jogo-recuado",
      "name": "Construtor de Jogo Recuado",
      "category": "outfield",
      "positionGroups": [
        "MC"
      ],
      "enabled": true,
      "components": {
        "attributes": 60,
        "metrics": 35,
        "context": 5
      },
      "attributes": [
        {
          "id": "passe",
          "label": "Passe",
          "weight": 14.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "visao-de-jogo",
          "label": "Visão de Jogo",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "primeiro-toque",
          "label": "Primeiro Toque",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "tecnica",
          "label": "Técnica",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "posicionamento",
          "label": "Posicionamento",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "trabalho-de-equipa",
          "label": "Trabalho de Equipa",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "equilibrio",
          "label": "Equilíbrio",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "sem-bola",
          "label": "Sem Bola",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "desarme",
          "label": "Desarme",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "resistencia",
          "label": "Resistência",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "agilidade",
          "label": "Agilidade",
          "weight": 2.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "passes-progressivos",
          "label": "Passes progressivos",
          "weight": 18.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-para-o-ultimo-terco",
          "label": "Passes para o último terço",
          "weight": 14.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "quebras-de-linha",
          "label": "Quebras de linha",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "precisao-ajustada-a-dificuldade",
          "label": "Precisão ajustada à dificuldade",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "mudancas-de-flanco",
          "label": "Mudanças de flanco",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-chave",
          "label": "Passes-chave",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "xa",
          "label": "xA",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "rececoes-sob-pressao",
          "label": "Receções sob pressão",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "perdas-perigosas",
          "label": "Perdas perigosas",
          "weight": 10.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "participacao-na-construcao",
          "label": "Participação na construção",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "recuperacoes",
          "label": "Recuperações",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "notes": ""
    },
    {
      "id": "medio-ofensivo-apoio",
      "name": "Médio Ofensivo — Apoio",
      "category": "outfield",
      "positionGroups": [
        "AMC"
      ],
      "enabled": true,
      "components": {
        "attributes": 55,
        "metrics": 40,
        "context": 5
      },
      "attributes": [
        {
          "id": "visao-de-jogo",
          "label": "Visão de Jogo",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passe",
          "label": "Passe",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "primeiro-toque",
          "label": "Primeiro Toque",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "tecnica",
          "label": "Técnica",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "sem-bola",
          "label": "Sem Bola",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducao",
          "label": "Condução",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "agilidade",
          "label": "Agilidade",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "criatividade-imprevisibilidade",
          "label": "Criatividade/Imprevisibilidade",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "aceleracao",
          "label": "Aceleração",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "finalizacao",
          "label": "Finalização",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "trabalho-de-equipa",
          "label": "Trabalho de Equipa",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "passes-chave",
          "label": "Passes-chave",
          "weight": 15.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "xa",
          "label": "xA",
          "weight": 14.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-para-finalizacao-dentro-da-area",
          "label": "Passes para finalização dentro da área",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "rececoes-entre-linhas",
          "label": "Receções entre linhas",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "acoes-que-originam-remate",
          "label": "Ações que originam remate",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducoes-progressivas",
          "label": "Conduções progressivas",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "dribles-bem-sucedidos",
          "label": "Dribles bem-sucedidos",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "entradas-na-area",
          "label": "Entradas na área",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "xg-sem-penaltis",
          "label": "xG sem penáltis",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "golos",
          "label": "Golos",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "perdas",
          "label": "Perdas",
          "weight": 7.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "pressoes-altas",
          "label": "Pressões altas",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "notes": ""
    },
    {
      "id": "organizador-avancado",
      "name": "Organizador Avançado",
      "category": "outfield",
      "positionGroups": [
        "AMC"
      ],
      "enabled": true,
      "components": {
        "attributes": 55,
        "metrics": 40,
        "context": 5
      },
      "attributes": [
        {
          "id": "visao-de-jogo",
          "label": "Visão de Jogo",
          "weight": 14.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passe",
          "label": "Passe",
          "weight": 13.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "tecnica",
          "label": "Técnica",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "primeiro-toque",
          "label": "Primeiro Toque",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "criatividade-imprevisibilidade",
          "label": "Criatividade/Imprevisibilidade",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "agilidade",
          "label": "Agilidade",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "sem-bola",
          "label": "Sem Bola",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducao",
          "label": "Condução",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "equilibrio",
          "label": "Equilíbrio",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "aceleracao",
          "label": "Aceleração",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "passes-chave",
          "label": "Passes-chave",
          "weight": 17.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "xa",
          "label": "xA",
          "weight": 15.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-de-rutura",
          "label": "Passes de rutura",
          "weight": 13.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "acoes-que-originam-remate",
          "label": "Ações que originam remate",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "rececoes-entre-linhas",
          "label": "Receções entre linhas",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-progressivos",
          "label": "Passes progressivos",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducoes-progressivas",
          "label": "Conduções progressivas",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "precisao-sob-pressao",
          "label": "Precisão sob pressão",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "perdas-perigosas",
          "label": "Perdas perigosas",
          "weight": 9.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "assistencias-ajustadas-ao-xa",
          "label": "Assistências ajustadas ao xA",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "pressoes",
          "label": "Pressões",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "notes": ""
    },
    {
      "id": "segundo-avancado-shadow-striker",
      "name": "Segundo Avançado / Shadow Striker",
      "category": "outfield",
      "positionGroups": [
        "AMC"
      ],
      "enabled": true,
      "components": {
        "attributes": 55,
        "metrics": 40,
        "context": 5
      },
      "attributes": [
        {
          "id": "sem-bola",
          "label": "Sem Bola",
          "weight": 13.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "aceleracao",
          "label": "Aceleração",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "finalizacao",
          "label": "Finalização",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "primeiro-toque",
          "label": "Primeiro Toque",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "tecnica",
          "label": "Técnica",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "agilidade",
          "label": "Agilidade",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "velocidade",
          "label": "Velocidade",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducao",
          "label": "Condução",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "indice-de-trabalho",
          "label": "Índice de Trabalho",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passe",
          "label": "Passe",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "resistencia",
          "label": "Resistência",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "xg-sem-penaltis",
          "label": "xG sem penáltis",
          "weight": 17.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "golos-sem-penaltis",
          "label": "Golos sem penáltis",
          "weight": 15.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "toques-na-area",
          "label": "Toques na área",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "remates-dentro-da-area",
          "label": "Remates dentro da área",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "entradas-na-area-sem-bola",
          "label": "Entradas na área sem bola",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "qualidade-media-dos-remates",
          "label": "Qualidade média dos remates",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "pressoes-no-ultimo-terco",
          "label": "Pressões no último terço",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "recuperacoes-altas",
          "label": "Recuperações altas",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducoes-para-a-area",
          "label": "Conduções para a área",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "xa",
          "label": "xA",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "perdas",
          "label": "Perdas",
          "weight": 4.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "conversao-ajustada-ao-xg",
          "label": "Conversão ajustada ao xG",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "notes": ""
    },
    {
      "id": "extremo-ataque",
      "name": "Extremo — Ataque",
      "category": "outfield",
      "positionGroups": [
        "AML",
        "AMR",
        "ML",
        "MR"
      ],
      "enabled": true,
      "components": {
        "attributes": 55,
        "metrics": 40,
        "context": 5
      },
      "attributes": [
        {
          "id": "aceleracao",
          "label": "Aceleração",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "velocidade",
          "label": "Velocidade",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducao",
          "label": "Condução",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "cruzamentos",
          "label": "Cruzamentos",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "tecnica",
          "label": "Técnica",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "agilidade",
          "label": "Agilidade",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "sem-bola",
          "label": "Sem Bola",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "primeiro-toque",
          "label": "Primeiro Toque",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "criatividade-imprevisibilidade",
          "label": "Criatividade/Imprevisibilidade",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passe",
          "label": "Passe",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "resistencia",
          "label": "Resistência",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "dribles-bem-sucedidos",
          "label": "Dribles bem-sucedidos",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducoes-progressivas",
          "label": "Conduções progressivas",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "cruzamentos-eficazes",
          "label": "Cruzamentos eficazes",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "xa",
          "label": "xA",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-chave",
          "label": "Passes-chave",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "entradas-na-area-por-conducao",
          "label": "Entradas na área por condução",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "toques-na-area",
          "label": "Toques na área",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "acoes-que-originam-remate",
          "label": "Ações que originam remate",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "perdas-de-bola",
          "label": "Perdas de bola",
          "weight": 8.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "xg-sem-penaltis",
          "label": "xG sem penáltis",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "recuperacoes-altas",
          "label": "Recuperações altas",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "faltas-sofridas",
          "label": "Faltas sofridas",
          "weight": 4.0,
          "enabled": true,
          "direction": "lower"
        }
      ],
      "notes": ""
    },
    {
      "id": "avancado-interior-ataque",
      "name": "Avançado Interior — Ataque",
      "category": "outfield",
      "positionGroups": [
        "AML",
        "AMR",
        "ML",
        "MR"
      ],
      "enabled": true,
      "components": {
        "attributes": 55,
        "metrics": 40,
        "context": 5
      },
      "attributes": [
        {
          "id": "aceleracao",
          "label": "Aceleração",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "velocidade",
          "label": "Velocidade",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducao",
          "label": "Condução",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "finalizacao",
          "label": "Finalização",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "sem-bola",
          "label": "Sem Bola",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "tecnica",
          "label": "Técnica",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "primeiro-toque",
          "label": "Primeiro Toque",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "agilidade",
          "label": "Agilidade",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "criatividade-imprevisibilidade",
          "label": "Criatividade/Imprevisibilidade",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passe",
          "label": "Passe",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "remates-de-longe",
          "label": "Remates de Longe",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "xg-sem-penaltis",
          "label": "xG sem penáltis",
          "weight": 16.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "golos-sem-penaltis",
          "label": "Golos sem penáltis",
          "weight": 14.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "toques-na-area",
          "label": "Toques na área",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "remates-dentro-da-area",
          "label": "Remates dentro da área",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducoes-para-a-area",
          "label": "Conduções para a área",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "dribles-bem-sucedidos",
          "label": "Dribles bem-sucedidos",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "entradas-na-area-sem-bola",
          "label": "Entradas na área sem bola",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "xa",
          "label": "xA",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-chave",
          "label": "Passes-chave",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conversao-ajustada",
          "label": "Conversão ajustada",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "perdas",
          "label": "Perdas",
          "weight": 5.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "pressoes-altas",
          "label": "Pressões altas",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "notes": ""
    },
    {
      "id": "extremo-invertido-apoio",
      "name": "Extremo Invertido — Apoio",
      "category": "outfield",
      "positionGroups": [
        "AML",
        "AMR",
        "ML",
        "MR"
      ],
      "enabled": true,
      "components": {
        "attributes": 55,
        "metrics": 40,
        "context": 5
      },
      "attributes": [
        {
          "id": "conducao",
          "label": "Condução",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "tecnica",
          "label": "Técnica",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passe",
          "label": "Passe",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "visao-de-jogo",
          "label": "Visão de Jogo",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "primeiro-toque",
          "label": "Primeiro Toque",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "aceleracao",
          "label": "Aceleração",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "agilidade",
          "label": "Agilidade",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "criatividade-imprevisibilidade",
          "label": "Criatividade/Imprevisibilidade",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "sem-bola",
          "label": "Sem Bola",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "cruzamentos",
          "label": "Cruzamentos",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "resistencia",
          "label": "Resistência",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "conducoes-progressivas",
          "label": "Conduções progressivas",
          "weight": 13.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-chave",
          "label": "Passes-chave",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "xa",
          "label": "xA",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "rececoes-entre-linhas",
          "label": "Receções entre linhas",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "entradas-interiores-com-bola",
          "label": "Entradas interiores com bola",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "dribles-bem-sucedidos",
          "label": "Dribles bem-sucedidos",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-progressivos",
          "label": "Passes progressivos",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "acoes-que-originam-remate",
          "label": "Ações que originam remate",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "perdas",
          "label": "Perdas",
          "weight": 8.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "toques-na-area",
          "label": "Toques na área",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "xg",
          "label": "xG",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "pressoes",
          "label": "Pressões",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "notes": ""
    },
    {
      "id": "raumdeuter",
      "name": "Raumdeuter",
      "category": "outfield",
      "positionGroups": [
        "AML",
        "AMR",
        "ML",
        "MR"
      ],
      "enabled": true,
      "components": {
        "attributes": 55,
        "metrics": 40,
        "context": 5
      },
      "attributes": [
        {
          "id": "sem-bola",
          "label": "Sem Bola",
          "weight": 16.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 13.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "finalizacao",
          "label": "Finalização",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "aceleracao",
          "label": "Aceleração",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "velocidade",
          "label": "Velocidade",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "primeiro-toque",
          "label": "Primeiro Toque",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "concentracao",
          "label": "Concentração",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "tecnica",
          "label": "Técnica",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "agilidade",
          "label": "Agilidade",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "trabalho-de-equipa",
          "label": "Trabalho de Equipa",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "resistencia",
          "label": "Resistência",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passe",
          "label": "Passe",
          "weight": 2.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "entradas-na-area-sem-bola",
          "label": "Entradas na área sem bola",
          "weight": 16.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "toques-na-area",
          "label": "Toques na área",
          "weight": 14.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "xg-sem-penaltis",
          "label": "xG sem penáltis",
          "weight": 15.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "golos-sem-penaltis",
          "label": "Golos sem penáltis",
          "weight": 13.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "remates-dentro-da-area",
          "label": "Remates dentro da área",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "qualidade-media-do-remate",
          "label": "Qualidade média do remate",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "rececoes-atras-da-defesa",
          "label": "Receções atrás da defesa",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conversao-ajustada",
          "label": "Conversão ajustada",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "pressoes",
          "label": "Pressões",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "xa",
          "label": "xA",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "perdas",
          "label": "Perdas",
          "weight": 4.0,
          "enabled": true,
          "direction": "lower"
        }
      ],
      "notes": ""
    },
    {
      "id": "avancado-pressionante",
      "name": "Avançado Pressionante",
      "category": "outfield",
      "positionGroups": [
        "ST"
      ],
      "enabled": true,
      "components": {
        "attributes": 60,
        "metrics": 35,
        "context": 5
      },
      "attributes": [
        {
          "id": "indice-de-trabalho",
          "label": "Índice de Trabalho",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "resistencia",
          "label": "Resistência",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "agressividade",
          "label": "Agressividade",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "aceleracao",
          "label": "Aceleração",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "velocidade",
          "label": "Velocidade",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "sem-bola",
          "label": "Sem Bola",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "trabalho-de-equipa",
          "label": "Trabalho de Equipa",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "finalizacao",
          "label": "Finalização",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "primeiro-toque",
          "label": "Primeiro Toque",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "forca",
          "label": "Força",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "concentracao",
          "label": "Concentração",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "pressoes-no-ultimo-terco",
          "label": "Pressões no último terço",
          "weight": 15.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "pressoes-eficazes",
          "label": "Pressões eficazes",
          "weight": 14.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "recuperacoes-altas",
          "label": "Recuperações altas",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "erros-adversarios-provocados",
          "label": "Erros adversários provocados",
          "weight": 8.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "corridas-de-pressao",
          "label": "Corridas de pressão",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "xg-sem-penaltis",
          "label": "xG sem penáltis",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "golos-sem-penaltis",
          "label": "Golos sem penáltis",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "toques-na-area",
          "label": "Toques na área",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "duelos-ofensivos",
          "label": "Duelos ofensivos",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "perdas",
          "label": "Perdas",
          "weight": 5.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "assistencias-xa",
          "label": "Assistências/xA",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "faltas-cometidas",
          "label": "Faltas cometidas",
          "weight": 3.0,
          "enabled": true,
          "direction": "lower"
        }
      ],
      "notes": ""
    },
    {
      "id": "avancado",
      "name": "Avançado",
      "category": "outfield",
      "positionGroups": [
        "ST"
      ],
      "enabled": true,
      "components": {
        "attributes": 60,
        "metrics": 35,
        "context": 5
      },
      "attributes": [
        {
          "id": "sem-bola",
          "label": "Sem Bola",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "aceleracao",
          "label": "Aceleração",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "velocidade",
          "label": "Velocidade",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "finalizacao",
          "label": "Finalização",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "primeiro-toque",
          "label": "Primeiro Toque",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "tecnica",
          "label": "Técnica",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducao",
          "label": "Condução",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "agilidade",
          "label": "Agilidade",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "forca",
          "label": "Força",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passe",
          "label": "Passe",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "impulsao",
          "label": "Impulsão",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "xg-sem-penaltis",
          "label": "xG sem penáltis",
          "weight": 17.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "golos-sem-penaltis",
          "label": "Golos sem penáltis",
          "weight": 15.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "toques-na-area",
          "label": "Toques na área",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "remates-dentro-da-area",
          "label": "Remates dentro da área",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "corridas-em-profundidade",
          "label": "Corridas em profundidade",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "rececoes-atras-da-defesa",
          "label": "Receções atrás da defesa",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "qualidade-media-dos-remates",
          "label": "Qualidade média dos remates",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conversao-ajustada-ao-xg",
          "label": "Conversão ajustada ao xG",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducoes-para-a-area",
          "label": "Conduções para a área",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "xa",
          "label": "xA",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "pressoes",
          "label": "Pressões",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "perdas",
          "label": "Perdas",
          "weight": 4.0,
          "enabled": true,
          "direction": "lower"
        }
      ],
      "notes": ""
    },
    {
      "id": "ponta-de-lanca",
      "name": "Ponta de Lança",
      "category": "outfield",
      "positionGroups": [
        "ST"
      ],
      "enabled": true,
      "components": {
        "attributes": 55,
        "metrics": 40,
        "context": 5
      },
      "attributes": [
        {
          "id": "finalizacao",
          "label": "Finalização",
          "weight": 15.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "sem-bola",
          "label": "Sem Bola",
          "weight": 14.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "aceleracao",
          "label": "Aceleração",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "primeiro-toque",
          "label": "Primeiro Toque",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "velocidade",
          "label": "Velocidade",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "agilidade",
          "label": "Agilidade",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "tecnica",
          "label": "Técnica",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "concentracao",
          "label": "Concentração",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "equilibrio",
          "label": "Equilíbrio",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "forca",
          "label": "Força",
          "weight": 2.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "xg-sem-penaltis-por-90",
          "label": "xG sem penáltis por 90",
          "weight": 20.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "golos-sem-penaltis-por-90",
          "label": "Golos sem penáltis por 90",
          "weight": 18.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "remates-dentro-da-area",
          "label": "Remates dentro da área",
          "weight": 13.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "toques-na-area",
          "label": "Toques na área",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "grandes-oportunidades-recebidas",
          "label": "Grandes oportunidades recebidas",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "qualidade-media-dos-remates",
          "label": "Qualidade média dos remates",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conversao-ajustada-ao-xg",
          "label": "Conversão ajustada ao xG",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "remates-enquadrados",
          "label": "Remates enquadrados",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "foras-de-jogo",
          "label": "Foras de jogo",
          "weight": 3.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "perdas-de-oportunidades-claras",
          "label": "Perdas de oportunidades claras",
          "weight": 3.0,
          "enabled": true,
          "direction": "lower"
        }
      ],
      "notes": ""
    },
    {
      "id": "avancado-recuado-apoio",
      "name": "Avançado Recuado — Apoio",
      "category": "outfield",
      "positionGroups": [
        "ST"
      ],
      "enabled": true,
      "components": {
        "attributes": 60,
        "metrics": 35,
        "context": 5
      },
      "attributes": [
        {
          "id": "primeiro-toque",
          "label": "Primeiro Toque",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passe",
          "label": "Passe",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "tecnica",
          "label": "Técnica",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "visao-de-jogo",
          "label": "Visão de Jogo",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "forca",
          "label": "Força",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "equilibrio",
          "label": "Equilíbrio",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "sem-bola",
          "label": "Sem Bola",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "trabalho-de-equipa",
          "label": "Trabalho de Equipa",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "criatividade-imprevisibilidade",
          "label": "Criatividade/Imprevisibilidade",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "finalizacao",
          "label": "Finalização",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "agilidade",
          "label": "Agilidade",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "rececoes-entre-linhas",
          "label": "Receções entre linhas",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-chave",
          "label": "Passes-chave",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "xa",
          "label": "xA",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "ligacoes-com-terceiros",
          "label": "Ligações com terceiros",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-progressivos",
          "label": "Passes progressivos",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "retencoes-de-bola-sob-pressao",
          "label": "Retenções de bola sob pressão",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "acoes-que-originam-remate",
          "label": "Ações que originam remate",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "toques-na-area",
          "label": "Toques na área",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "xg-sem-penaltis",
          "label": "xG sem penáltis",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "golos",
          "label": "Golos",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "perdas",
          "label": "Perdas",
          "weight": 7.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "duelos-ofensivos-ganhos",
          "label": "Duelos ofensivos ganhos",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "notes": "Força, Equilíbrio, Compostura e Passe são especialmente importantes para receber de costas e ligar o ataque. Essa combinação também é destacada na explicação oficial do papel de avançado recuado."
    },
    {
      "id": "avancado-alvo-apoio",
      "name": "Avançado Alvo — Apoio",
      "category": "outfield",
      "positionGroups": [
        "ST"
      ],
      "enabled": true,
      "components": {
        "attributes": 60,
        "metrics": 35,
        "context": 5
      },
      "attributes": [
        {
          "id": "impulsao",
          "label": "Impulsão",
          "weight": 15.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "forca",
          "label": "Força",
          "weight": 14.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "cabeceamento",
          "label": "Cabeceamento",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "equilibrio",
          "label": "Equilíbrio",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "bravura",
          "label": "Bravura",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "primeiro-toque",
          "label": "Primeiro Toque",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "trabalho-de-equipa",
          "label": "Trabalho de Equipa",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passe",
          "label": "Passe",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "agressividade",
          "label": "Agressividade",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "sem-bola",
          "label": "Sem Bola",
          "weight": 2.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "duelos-aereos-ganhos",
          "label": "Duelos aéreos ganhos",
          "weight": 20.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "bolas-longas-recebidas-com-sucesso",
          "label": "Bolas longas recebidas com sucesso",
          "weight": 13.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "retencoes-de-bola",
          "label": "Retenções de bola",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "segundas-bolas-geradas",
          "label": "Segundas bolas geradas",
          "weight": 10.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "assistencias-de-cabeca-toques-de-apoio",
          "label": "Assistências de cabeça/toques de apoio",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "duelos-ofensivos-ganhos",
          "label": "Duelos ofensivos ganhos",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-para-finalizacao",
          "label": "Passes para finalização",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "xa",
          "label": "xA",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "toques-na-area",
          "label": "Toques na área",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "xg",
          "label": "xG",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "perdas-sob-pressao",
          "label": "Perdas sob pressão",
          "weight": 4.0,
          "enabled": true,
          "direction": "lower"
        },
        {
          "id": "faltas-sofridas",
          "label": "Faltas sofridas",
          "weight": 2.0,
          "enabled": true,
          "direction": "lower"
        }
      ],
      "notes": "A altura não deve ser usada diretamente como atributo principal. No motor do jogo, o indicador funcional mais relevante para alcançar bolas aéreas é a Impulsão, combinada com Cabeceamento, Força, Bravura e Antecipação."
    },
    {
      "id": "avancado-completo",
      "name": "Avançado Completo",
      "category": "outfield",
      "positionGroups": [
        "ST"
      ],
      "enabled": true,
      "components": {
        "attributes": 60,
        "metrics": 35,
        "context": 5
      },
      "attributes": [
        {
          "id": "primeiro-toque",
          "label": "Primeiro Toque",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "tecnica",
          "label": "Técnica",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "finalizacao",
          "label": "Finalização",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "compostura",
          "label": "Compostura",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "sem-bola",
          "label": "Sem Bola",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "antecipacao",
          "label": "Antecipação",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "decisoes",
          "label": "Decisões",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passe",
          "label": "Passe",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "visao-de-jogo",
          "label": "Visão de Jogo",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducao",
          "label": "Condução",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "aceleracao",
          "label": "Aceleração",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "velocidade",
          "label": "Velocidade",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "forca",
          "label": "Força",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "equilibrio",
          "label": "Equilíbrio",
          "weight": 5.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "impulsao",
          "label": "Impulsão",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "trabalho-de-equipa",
          "label": "Trabalho de Equipa",
          "weight": 3.0,
          "enabled": true,
          "direction": "higher"
        }
      ],
      "metrics": [
        {
          "id": "xg-sem-penaltis",
          "label": "xG sem penáltis",
          "weight": 12.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "golos-sem-penaltis",
          "label": "Golos sem penáltis",
          "weight": 11.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "xa",
          "label": "xA",
          "weight": 9.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "passes-chave",
          "label": "Passes-chave",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "toques-na-area",
          "label": "Toques na área",
          "weight": 8.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "remates-dentro-da-area",
          "label": "Remates dentro da área",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "conducoes-progressivas",
          "label": "Conduções progressivas",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "dribles-bem-sucedidos",
          "label": "Dribles bem-sucedidos",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "duelos-aereos",
          "label": "Duelos aéreos",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "retencao-de-bola",
          "label": "Retenção de bola",
          "weight": 7.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "rececoes-entre-linhas",
          "label": "Receções entre linhas",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "corridas-em-profundidade",
          "label": "Corridas em profundidade",
          "weight": 6.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "pressoes",
          "label": "Pressões",
          "weight": 4.0,
          "enabled": true,
          "direction": "higher"
        },
        {
          "id": "perdas",
          "label": "Perdas",
          "weight": 3.0,
          "enabled": true,
          "direction": "lower"
        }
      ],
      "notes": "Esta role deve premiar ausência de fraquezas, não apenas uma média elevada. Um jogador com 18 em Finalização mas 8 em Primeiro Toque, Passe e Força não deve ter um grande score como Avançado Completo."
    }
  ],
  "inferenceDimensions": [
    {
      "id": "attack",
      "name": "Ataque",
      "description": "Produção ofensiva, criação e presença em zonas de finalização.",
      "features": [
        {
          "id": "golos-sem-penaltis",
          "kind": "metric",
          "weight": 20,
          "direction": "higher"
        },
        {
          "id": "xg-sem-penaltis",
          "kind": "metric",
          "weight": 20,
          "direction": "higher"
        },
        {
          "id": "remates-dentro-da-area",
          "kind": "metric",
          "weight": 15,
          "direction": "higher"
        },
        {
          "id": "assistencias",
          "kind": "metric",
          "weight": 15,
          "direction": "higher"
        },
        {
          "id": "xa",
          "kind": "metric",
          "weight": 15,
          "direction": "higher"
        },
        {
          "id": "toques-na-area",
          "kind": "metric",
          "weight": 15,
          "direction": "higher"
        }
      ]
    },
    {
      "id": "defense",
      "name": "Defesa",
      "description": "Volume e eficácia defensiva agregada.",
      "features": [
        {
          "id": "desarmes-ganhos",
          "kind": "metric",
          "weight": 20,
          "direction": "higher"
        },
        {
          "id": "intercecoes",
          "kind": "metric",
          "weight": 20,
          "direction": "higher"
        },
        {
          "id": "cortes",
          "kind": "metric",
          "weight": 15,
          "direction": "higher"
        },
        {
          "id": "remates-bloqueados",
          "kind": "metric",
          "weight": 15,
          "direction": "higher"
        },
        {
          "id": "duelos-defensivos-ganhos",
          "kind": "metric",
          "weight": 20,
          "direction": "higher"
        },
        {
          "id": "erros-defensivos",
          "kind": "metric",
          "weight": 10,
          "direction": "lower"
        }
      ]
    },
    {
      "id": "technical",
      "name": "Técnica",
      "description": "Qualidade de passe, receção, condução e execução.",
      "features": [
        {
          "id": "percentagem-de-passe",
          "kind": "metric",
          "weight": 20,
          "direction": "higher"
        },
        {
          "id": "passes-progressivos",
          "kind": "metric",
          "weight": 20,
          "direction": "higher"
        },
        {
          "id": "passes-chave",
          "kind": "metric",
          "weight": 15,
          "direction": "higher"
        },
        {
          "id": "dribles-bem-sucedidos",
          "kind": "metric",
          "weight": 15,
          "direction": "higher"
        },
        {
          "id": "tecnica",
          "kind": "attribute",
          "weight": 15,
          "direction": "higher"
        },
        {
          "id": "primeiro-toque",
          "kind": "attribute",
          "weight": 15,
          "direction": "higher"
        }
      ]
    },
    {
      "id": "physical",
      "name": "Física",
      "description": "Intensidade, velocidade, resistência e capacidade de duelo.",
      "features": [
        {
          "id": "sprints-90",
          "kind": "metric",
          "weight": 20,
          "direction": "higher"
        },
        {
          "id": "distancia",
          "kind": "metric",
          "weight": 15,
          "direction": "higher"
        },
        {
          "id": "duelos-ganhos",
          "kind": "metric",
          "weight": 15,
          "direction": "higher"
        },
        {
          "id": "velocidade",
          "kind": "attribute",
          "weight": 15,
          "direction": "higher"
        },
        {
          "id": "aceleracao",
          "kind": "attribute",
          "weight": 15,
          "direction": "higher"
        },
        {
          "id": "resistencia",
          "kind": "attribute",
          "weight": 10,
          "direction": "higher"
        },
        {
          "id": "forca",
          "kind": "attribute",
          "weight": 10,
          "direction": "higher"
        }
      ]
    },
    {
      "id": "creativity",
      "name": "Criatividade",
      "description": "Capacidade para progredir, criar ocasiões e quebrar linhas.",
      "features": [
        {
          "id": "xa",
          "kind": "metric",
          "weight": 25,
          "direction": "higher"
        },
        {
          "id": "passes-chave",
          "kind": "metric",
          "weight": 25,
          "direction": "higher"
        },
        {
          "id": "passes-progressivos",
          "kind": "metric",
          "weight": 20,
          "direction": "higher"
        },
        {
          "id": "visao-de-jogo",
          "kind": "attribute",
          "weight": 15,
          "direction": "higher"
        },
        {
          "id": "passe",
          "kind": "attribute",
          "weight": 15,
          "direction": "higher"
        }
      ]
    },
    {
      "id": "intensity",
      "name": "Intensidade",
      "description": "Pressão, recuperação, transições e ritmo sem bola.",
      "features": [
        {
          "id": "pressoes-eficazes",
          "kind": "metric",
          "weight": 25,
          "direction": "higher"
        },
        {
          "id": "recuperacoes",
          "kind": "metric",
          "weight": 25,
          "direction": "higher"
        },
        {
          "id": "indice-de-trabalho",
          "kind": "attribute",
          "weight": 20,
          "direction": "higher"
        },
        {
          "id": "resistencia",
          "kind": "attribute",
          "weight": 15,
          "direction": "higher"
        },
        {
          "id": "agressividade",
          "kind": "attribute",
          "weight": 15,
          "direction": "higher"
        }
      ]
    }
  ]
} as ScoreConfig

const EXTRA_INFERENCE_DIMENSIONS: ScoreConfig['inferenceDimensions'] = [
  {id:'efficiency',name:'Eficiência ofensiva',description:'Capacidade para transformar volume ofensivo em golos, assistências e remates de qualidade.',features:[
    {id:'conversao-ajustada-ao-xg',kind:'metric',weight:25,direction:'higher'},
    {id:'golos-sem-penaltis',kind:'metric',weight:20,direction:'higher'},
    {id:'xg-sem-penaltis',kind:'metric',weight:15,direction:'higher'},
    {id:'qualidade-media-dos-remates',kind:'metric',weight:15,direction:'higher'},
    {id:'remates-enquadrados',kind:'metric',weight:15,direction:'higher'},
    {id:'compostura',kind:'attribute',weight:10,direction:'higher'}]},
  {id:'verticality',name:'Verticalidade',description:'Progressão rápida e direta através de passes, conduções e entradas em zonas avançadas.',features:[
    {id:'passes-progressivos',kind:'metric',weight:25,direction:'higher'},
    {id:'conducoes-progressivas',kind:'metric',weight:25,direction:'higher'},
    {id:'passes-para-o-ultimo-terco',kind:'metric',weight:20,direction:'higher'},
    {id:'entradas-na-area',kind:'metric',weight:15,direction:'higher'},
    {id:'visao-de-jogo',kind:'attribute',weight:15,direction:'higher'}]},
  {id:'ball-security',name:'Segurança com bola',description:'Qualidade de circulação e retenção, penalizando perdas perigosas.',features:[
    {id:'percentagem-de-passe',kind:'metric',weight:30,direction:'higher'},
    {id:'passes-completos',kind:'metric',weight:20,direction:'higher'},
    {id:'perdas-perigosas',kind:'metric',weight:25,direction:'lower'},
    {id:'primeiro-toque',kind:'attribute',weight:15,direction:'higher'},
    {id:'compostura',kind:'attribute',weight:10,direction:'higher'}]},
  {id:'aerial',name:'Jogo aéreo',description:'Domínio aéreo defensivo e ofensivo.',features:[
    {id:'duelos-aereos-ganhos',kind:'metric',weight:40,direction:'higher'},
    {id:'cortes',kind:'metric',weight:15,direction:'higher'},
    {id:'impulsao',kind:'attribute',weight:20,direction:'higher'},
    {id:'cabeceamento',kind:'attribute',weight:15,direction:'higher'},
    {id:'forca',kind:'attribute',weight:10,direction:'higher'}]},
  {id:'pressing',name:'Pressão alta',description:'Intensidade e eficácia na recuperação da bola em zonas avançadas.',features:[
    {id:'pressoes-no-ultimo-terco',kind:'metric',weight:30,direction:'higher'},
    {id:'pressoes-eficazes',kind:'metric',weight:30,direction:'higher'},
    {id:'recuperacoes',kind:'metric',weight:15,direction:'higher'},
    {id:'indice-de-trabalho',kind:'attribute',weight:15,direction:'higher'},
    {id:'agressividade',kind:'attribute',weight:10,direction:'higher'}]},
  {id:'discipline',name:'Disciplina',description:'Controlo defensivo e comportamental, penalizando cartões, faltas e erros.',features:[
    {id:'cartoes',kind:'metric',weight:30,direction:'lower'},
    {id:'faltas-cometidas',kind:'metric',weight:25,direction:'lower'},
    {id:'erros-defensivos',kind:'metric',weight:25,direction:'lower'},
    {id:'concentracao',kind:'attribute',weight:10,direction:'higher'},
    {id:'decisoes',kind:'attribute',weight:10,direction:'higher'}]},
  {id:'transition',name:'Transição',description:'Capacidade para recuperar, acelerar e progredir durante mudanças de posse.',features:[
    {id:'recuperacoes',kind:'metric',weight:20,direction:'higher'},
    {id:'conducoes-progressivas',kind:'metric',weight:20,direction:'higher'},
    {id:'acoes-progressivas-totais',kind:'metric',weight:20,direction:'higher'},
    {id:'aceleracao',kind:'attribute',weight:15,direction:'higher'},
    {id:'velocidade',kind:'attribute',weight:15,direction:'higher'},
    {id:'decisoes',kind:'attribute',weight:10,direction:'higher'}]},
  {id:'chance-creation',name:'Criação de ocasiões',description:'Produção de passes e ações que criam oportunidades de finalização.',features:[
    {id:'xa',kind:'metric',weight:25,direction:'higher'},
    {id:'passes-chave',kind:'metric',weight:25,direction:'higher'},
    {id:'passes-para-finalizacao',kind:'metric',weight:20,direction:'higher'},
    {id:'assistencias',kind:'metric',weight:15,direction:'higher'},
    {id:'visao-de-jogo',kind:'attribute',weight:15,direction:'higher'}]}
]

export const DEFAULT_SCORE_CONFIG: ScoreConfig = {
  ...BASE_SCORE_CONFIG,
  version: 2,
  inferenceDimensions: [...BASE_SCORE_CONFIG.inferenceDimensions, ...EXTRA_INFERENCE_DIMENSIONS],
}

export function cloneScoreConfig(config: ScoreConfig = DEFAULT_SCORE_CONFIG): ScoreConfig { return JSON.parse(JSON.stringify(config)) as ScoreConfig }
