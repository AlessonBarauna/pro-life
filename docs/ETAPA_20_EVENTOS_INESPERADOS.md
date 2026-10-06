# Etapa 20 — Eventos inesperados

## Arquitetura

A Etapa 20 usa o fluxo narrativo já existente. O módulo `src/domain/unexpected-events.js` concentra catálogo, elegibilidade, sorteio, cooldown, criação, resolução, expiração e histórico. Cada acontecimento com escolha ocupa `state.decision`; o comando genérico `decide` continua sendo a única porta de resolução manual.

O tick roda uma vez por dia no engine, somente para carreiras de jogador. O modo treinador não recebe estes eventos. Uma nova decisão é reconhecida por `pendingActions` e interrompe simulações não automáticas pelo mesmo mecanismo das demais decisões importantes.

## Catálogo inicial

O catálogo possui 12 acontecimentos:

1. pedido importante da família;
2. distância e saudade da família;
3. conflito com companheiro no treino;
4. apoio de companheiro após momento difícil;
5. declaração fora de contexto;
6. rumor sobre insatisfação;
7. cobrança da torcida nas redes;
8. momento viral positivo;
9. evento institucional do clube;
10. problema logístico;
11. convite para ação beneficente;
12. impacto emocional do retorno após lesão.

Os gatilhos consultam o contexto real disponível: relação familiar, estresse, moral, clube atual, concorrência por posição, confiança do treinador, papel no elenco, contrato, interesses, reputação, seguidores, perfil de mídia, notas recentes, gols e histórico físico.

## Frequência e cooldowns

Não existe dia fixo. Em cada tick elegível, um RNG determinístico e persistente exclusivo da Etapa 20 avalia uma probabilidade pequena e faz um sorteio ponderado entre os acontecimentos contextuais. Esse fluxo próprio não consome a sequência global usada por partidas, lesões, Seleção e outros subsistemas. O sistema nunca usa aleatoriedade externa.

- cooldown global: 10 dias;
- cooldown por template: 40 a 90 dias;
- o último tipo resolvido não pode se repetir imediatamente;
- uma decisão ativa, entrevista pendente, proposta de renovação, transferência ou patrocínio impede nova decisão incompatível;
- acontecimentos raros possuem peso menor.

Os testes podem consultar `isEligible`, listar `eligibleEvents`, criar com `force` e resolver com `resolve`, sem depender de sorte.

## Escolhas e consequências

Cada evento oferece três escolhas compatíveis com o formato `[id, label]`. Os efeitos são moderados e limitados aos atributos existentes: família, estresse, moral, reputação, seguidores, evolução técnica, condição física, confiança do treinador e diretoria. Alterações de confiança usam o histórico da Etapa 19; repercussões de imprensa atualizam o perfil de mídia existente.

A resolução registra o delta em `decisionConsequences`, emite um evento deduplicável e adiciona uma mensagem de resultado. Acontecimentos públicos selecionados também geram notícia. Nenhuma escolha cria transferência, lesão, patrocinador ou sistema paralelo.

## Persistência e migração

O estado fica em `extras.unexpectedEvents`:

```text
version, history, cooldowns, processed, lastEventDay, rngState, stats
```

Saves antigos são migrados na inicialização e na validação de importação. O histórico mantém no máximo 80 itens, comunicações usam `eventId` estável e `processed` impede uma segunda resolução do mesmo acontecimento. Save e reload preservam histórico, estatísticas e cooldowns.

## Prazo e expiração

As decisões possuem prazo de 3 a 8 dias. Ao ultrapassar o prazo, o domínio aplica a resposta segura definida pelo template, registra status `EXPIRED`, as consequências correspondentes e limpa `state.decision`. Normalmente a simulação manual para antes disso por causa de `pendingActions`.

## Interface

O modal de interrupção e o cartão de decisão em Vida mostram categoria, título, contexto, escolhas e dias restantes. A seção **Acontecimentos recentes** na tela Vida exibe data, categoria, título, escolha, status e resumo da consequência. A UI apenas envia o comando genérico; todas as mudanças de atributos permanecem no domínio.

## Testes

- `tests/unexpected-events-stage20.test.cjs`: migração, catálogo, RNG, contexto, cooldowns, criação, resolução, idempotência, persistência, expiração, simulação e regressões do fluxo legado.
- `tests/unexpected-events-ui-stage20.test.cjs`: renderização da decisão e do histórico, além do wiring genérico da UI.
- A suíte principal inclui novamente os oito testes dedicados da Etapa 19 e os testes da Etapa 20.

## Limitações deliberadas

- não há eventos específicos para treinador;
- não há personalidade completa do técnico, reservada para etapa futura;
- não há transferências automáticas, novas lesões, negociações comerciais ou entrevistas paralelas;
- eventos sem escolha e catálogos externos podem ser ampliados posteriormente sem alterar o contrato persistente.

O teste manual fica a cargo do usuário após a validação automatizada.
