# PRO LIFE 0.4 — expansão da carreira brasileira

## Entrega

- Séries A, B, C e D com 20 clubes por liga e 38 rodadas independentes.
- Séries A/B preservam a base de referência da v0.3. Séries C/D têm cobertura
  parcial de nomes e elencos; jogadores de reposição, atributos e resultados são
  gerados pelo simulador e identificados como tal.
- Tela de Competições com as quatro divisões, Copa do Brasil e estaduais de
  referência. Copas/estaduais são calendário complementar simulado nesta versão.
- Telas de Estatísticas e Prêmios, com gols, assistências, melhores em campo e
  consolidação de reconhecimentos ao fim da temporada.
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

Não há acesso/rebaixamento entre divisões. Copa do Brasil e estaduais aparecem
como competições complementares, sem chave completa de partidas. Séries C/D não
pretendem ser cadastro oficial completo. Ratings, valores, técnicos, resultados,
premiações e evolução são valores do simulador, não avaliações oficiais.

## Validação

A suíte terminou com 36 testes aprovados, sem falhas ou testes ignorados, e
cobre inicialização, quatro ligas, temporada completa, dois modos,
transferências, treinamento, agência, estatísticas, competições, migração antiga,
autosave, exportação/importação, reabertura e rejeição de saves corrompidos.
O teste DOM navega por todas as telas e executa ações de jogador e treinador.
O build de produção e a conferência visual local em 390 px também passaram, com
tema escuro preservado, sem overflow horizontal e sem erros no console.
