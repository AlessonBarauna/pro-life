# PRO LIFE 0.4 — expansão da carreira brasileira

## Entrega

- Séries A, B, C e D com 20 clubes por liga e 38 rodadas independentes.
- Séries A/B preservam a base de referência da v0.3. Séries C/D têm cobertura
  parcial de nomes e elencos; jogadores de reposição, atributos e resultados são
  gerados pelo simulador e identificados como tal.
- Tela de Competições com as quatro divisões, ranking e mata-mata da Copa do
  Brasil, além do estadual correspondente ao clube da carreira.
- Telas de Estatísticas e Prêmios, com gols, assistências, melhores em campo e
  consolidação por Série A/B/C/D ao fim da temporada. Cada prêmio registra atleta,
  clube e divisão.
- Quatro clubes sobem e quatro descem entre A/B, B/C e C/D na virada. A Série D
  não tem descenso porque não há divisão inferior simulada.
- A Copa do Brasil do jogo usa 32 clubes: os quatro melhores de cada divisão e
  outros 16 por ranking/sorteio. É uma adaptação ao universo de 80 clubes. O
  formato oficial da CBF em 2026 possui 126 participantes e nove fases.
- Treinamento ampliado de 6 para 27 atributos técnicos/físicos. Especialidade,
  estilo, disciplina, idade e carga influenciam o desenvolvimento. O ciclo de
  progresso foi reduzido de 14 para 10 pontos.
- Agência de carreira persistente, com contratação única, custo mensal e efeito
  contínuo em seguidores. Novas decisões incluem projeto social e campanha.
- Tema escuro preservado em todas as telas antigas e novas.

## Saves

O schema externo continua na versão 1. Saves v0.3 são aceitos e recebem campos
novos por inicialização compatível. Autosave, exportação JSON, importação, save
manual e reabertura preservam modo, clube, ligas, treinamento, estatísticas,
competições e agência. O limite de importação permanece em 3 MB.

## Limites

Os estaduais não são simulados integralmente: somente os compromissos do clube da
carreira são processados no início do ano. Séries C/D não pretendem ser cadastro
oficial completo. A Copa do Brasil de 32 clubes é uma regra do simulador, não a
reprodução do regulamento oficial. Ratings, valores, técnicos, resultados,
premiações e evolução são valores do simulador, não avaliações oficiais.

Referência do formato oficial: https://www.cbf.com.br/a-cbf/noticias/informes-cbf/a/cbf-anuncia-novo-calendario-do-futebol-profissional-masculino

## Validação

A suíte terminou com 40 testes aprovados, sem falhas ou testes ignorados, e
cobre inicialização, quatro ligas, temporada completa, dois modos,
transferências, treinamento, agência, estatísticas, competições, migração antiga,
autosave, exportação/importação, reabertura e rejeição de saves corrompidos.
O teste DOM navega por todas as telas e executa ações de jogador e treinador.
O build de produção e a conferência visual local em 390 px também passaram, com
tema escuro preservado, sem overflow horizontal e sem erros no console.
