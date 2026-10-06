# Etapa 21 — Treinadores dinâmicos

## Visão geral

A Etapa 21 acrescenta identidade, personalidade e critérios táticos ao treinador da carreira de jogador. Ela estende os sistemas canônicos de disputa por posição, confiança, conversas, promessas, escalação e troca de comando das Etapas 6 e 19.

O modo treinador não recebe um técnico NPC nem os fluxos de relacionamento exclusivos do jogador.

## Estado persistido

O treinador fica em `extras.playerCareer.squadCompetition.manager`. O objeto contém:

- identidade estável (`id`, `name`, `clubId`, `generation`);
- chegada (`createdSeason`, `createdDay`);
- `archetype`, `personality` e `mediaStyle`;
- `tacticalStyle` e `preferredFormation`;
- atributos de 0 a 100 para risco, jovens, estrelas, rotação, disciplina, paciência, volatilidade de confiança e desenvolvimento;
- `selectionWeights` para qualidade geral, forma, treinamento, condição, confiança, potencial e experiência;
- seed própria.

`managerHistory` mantém até 24 treinadores anteriores com identidade, perfil, chegada, saída e motivo.

## Geração determinística e RNG

Nome, arquétipo, estilo, formação, atributos e pesos são derivados de uma seed estável baseada em mundo, clube, geração, temporada e dia da nomeação. A geração usa um fluxo local e não lê nem altera `state.rng`. Não é usado `Math.random()`.

Assim, inicializações repetidas e save/reload preservam exatamente o mesmo treinador, enquanto uma troca válida produz uma nova identidade.

## Nomes

O pool combina 24 nomes e 24 sobrenomes brasileiros, portugueses, espanhóis, argentinos e italianos, oferecendo centenas de combinações sem depender de nomes reais de técnicos famosos.

## Arquétipos

Existem dez perfis:

1. Desenvolvedor
2. Disciplinador
3. Gestor de estrelas
4. Conservador
5. Ofensivo
6. Pragmático
7. Rotacionador
8. Meritocrático
9. Protetor
10. Exigente

Cada perfil possui parâmetros e pesos próprios. A variação individual é pequena e determinística, preservando a identidade do arquétipo.

## Estilos e formações

Os estilos suportados são Posse, Transição, Pressão Alta, Bloco Baixo, Equilibrado e Jogo Direto.

A formação preferida usa apenas a lista já simulada por `Squad.slots`: `4-3-3`, `4-4-2` e `4-2-3-1`. Uma formação atual válida do clube tem precedência; caso não exista, usa-se a preferência do treinador e depois `4-3-3`.

## Escalação e disputa

`Squad.score` continua sendo o cálculo competitivo. O perfil modula os pesos existentes sem substituir o sistema e sem permitir que jogador lesionado, suspenso ou indisponível seja relacionado.

Qualidade geral continua sendo relevante. Preferência por jovens, potencial e experiência geram bônus pequenos para evitar que um atleta muito inferior domine a hierarquia.

A divergência anterior foi corrigida: o Engine e o preview inicial não reescrevem mais a escalação com uma segunda regra baseada apenas em `squadRole`. `Squad.choose` é a fonte final usada na partida e na interface.

## Confiança

Não existe uma nova confiança. `playerCareer.coachTrust`, limitada entre 0 e 100, continua canônica.

`adjustTrustDeltaForManager` altera somente a sensibilidade contextual. Exemplos:

- Protetor reduz penalidades;
- Exigente amplia quedas e modera bônus;
- Meritocrático valoriza treino e forma;
- Desenvolvedor oferece tolerância adicional a jovens;
- Gestor de estrelas protege atletas importantes;
- Disciplinador reage mais a conflito e cobrança.

`recordTrustChange` continua sendo o único histórico e agora inclui ID, geração e arquétipo do treinador nos detalhes.

## Objetivos

`Career.matchObjectives` continua criando metas válidas por posição. Exigente pode elevar levemente a nota mínima; Protetor pode moderá-la quando a forma está baixa; Ofensivo adapta a contribuição ofensiva. As notas permanecem entre 6,5 e 7,3.

## Conversas e promessas

As conversas da Etapa 19 continuam com o mesmo cooldown e comandos. Elas registram o treinador responsável e aplicam pequenas diferenças de reação.

As promessas preservam tipo, progresso, jogos elegíveis, resolução, cancelamento e reload. Rotacionador tende a aceitar pedidos com confiança menor, Conservador exige mais segurança, Meritocrático considera treino positivo e Protetor pode conceder prazo adicional.

## Mudança de treinador

`handleManagerChange` permanece idempotente. Uma troca válida:

1. cancela promessa e conversa ativas;
2. arquiva o treinador anterior;
3. incrementa `managerGeneration`;
4. cria um novo perfil determinístico;
5. recalibra confiança conforme a regra da Etapa 19;
6. recalcula o papel canônico;
7. registra metadata no histórico de confiança;
8. envia mensagem com o nome e perfil do novo treinador.

O mundo vivo continua sendo o único responsável pelo gatilho de demissão e preserva a proteção do próprio usuário no modo treinador.

## Transferências

Ao trocar de clube, o treinador anterior é arquivado e um novo perfil é associado ao novo `clubId`. A confiança de chegada continua sendo calculada pelo fluxo existente do contrato. A transição é registrada no histórico canônico e permanece estável após reload.

## Interface

O painel existente de elenco exibe:

- nome, arquétipo, estilo e formação preferida;
- níveis Baixa/Média/Alta para disciplina, rotação, jovens e paciência;
- os três maiores critérios de seleção;
- até cinco treinadores anteriores.

A UI apenas lê snapshots do domínio e continua usando os comandos existentes para conversas.

## Validação e migração

Saves antigos sem `manager` são migrados no primeiro `Squad.init()` sem consumir RNG global. A migração é idempotente. A validação de expansão verifica identidade, geração, arquétipo, estilo, formação, atributos, pesos e limite do histórico quando o novo formato está presente.

## Testes

- `tests/dynamic-managers-stage21.test.cjs`: migração, identidade, arquétipos, RNG, confiança, objetivos, seleção, indisponibilidade, troca, histórico, transferência, save/reload, conversas, promessas e modo treinador.
- `tests/dynamic-managers-ui-stage21.test.cjs`: identidade, perfil, critérios, histórico, isolamento do modo treinador e ausência de mutação direta na UI.
- Regressões das Etapas 6, 19 e 20 permanecem obrigatórias.

## Limitações

- O jogo não simula uma carreira completa independente para cada treinador de todos os clubes.
- A formação preferida não força mudança quando o clube já possui uma formação atual válida.
- Personalidades modulam decisões existentes; não há árvore narrativa extensa nem mercado próprio de técnicos.
