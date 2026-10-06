# Etapa 18 - Arqu?tipos 3.0

## Objetivo

Evoluir o sistema existente de identidade e arqu?tipos sem criar uma arquitetura paralela.

Os m?dulos can?nicos continuam sendo:

- `src/domain/training.js`
- `src/domain/identity.js`
- `src/application/game.js`
- `src/ui/app.js`

## Arqu?tipos

A Etapa 18 expande o cat?logo para 13 arqu?tipos.

Os 10 arqu?tipos anteriores continuam preservados.

Novos arqu?tipos:

- Goleiro L?bero (`sweeper`)
- Sentinela (`anchor`)
- Atacante M?vel (`shadow`)

Os arqu?tipos padr?o por posi??o permanecem inalterados para compatibilidade com saves existentes.

## Identidade

A identidade continua sendo constru?da progressivamente a partir de:

- posi??o;
- atributos;
- partidas;
- treinos;
- afinidade comportamental.

A vers?o interna de identidade foi atualizada e saves anteriores s?o migrados sem apagar hist?rico.

Mudan?as de arqu?tipo continuam graduais.

## XP de arqu?tipo

O sistema passa a utilizar de forma efetiva:

- `archetypeXp`
- `archetypeLevel`

Partidas continuam gerando XP de arqu?tipo.

Treinos alinhados ao foco do arqu?tipo tamb?m geram XP de arqu?tipo.

Treinos incompat?veis com o foco n?o inventam XP de arqu?tipo.

## Perks

Existem 26 perks:

- 2 por arqu?tipo;
- efeitos contextuais;
- sem aumento instant?neo de atributo;
- sem aumento direto de GER/overall.

Cada perk possui:

- arqu?tipo associado;
- n?vel m?nimo;
- tipo de efeito;
- valor limitado.

## Slots

N?mero de perks ativos:

- n?vel 1 a 9: 1 slot;
- n?vel 10 a 19: 2 slots;
- n?vel 20 ou superior: 3 slots.

O dom?nio ? respons?vel por aplicar esse limite.

A interface apenas apresenta o estado.

## Estados de perk

Um perk pode estar:

- BLOQUEADO
- DISPON?VEL
- DESBLOQUEADO
- ATIVO

Desbloquear e ativar s?o opera??es diferentes.

Um perk desbloqueado permanece no hist?rico do jogador mesmo se o arqu?tipo mudar.

Se o perk deixar de ser compat?vel com o perfil atual, ele n?o permanece ativo e n?o produz efeito.

## Efeitos

Os efeitos s?o limitados e contextuais.

Um perk individual usa b?nus de at? 5%.

A combina??o de perks possui teto de 10% no c?lculo contextual.

Os efeitos podem atuar em:

- treino compat?vel;
- gols;
- assist?ncias;
- desarmes;
- defesas;
- clean sheets;
- nota m?nima;
- minutos jogados.

Perks inativos n?o produzem efeito.

Perks incompat?veis n?o produzem efeito.

## Arquitetura

Fluxo obrigat?rio:

`UI -> Application -> Domain -> State -> Save`

A UI n?o chama diretamente:

- `unlockArchetypePerk`
- `activateArchetypePerk`
- `deactivateArchetypePerk`

As opera??es passam por comandos em `src/application/game.js`.

## Carreira de treinador

Perks de arqu?tipo s?o exclusivos da carreira de jogador.

Treinadores:

- possuem 0 slots;
- n?o desbloqueiam perks;
- n?o ativam perks;
- n?o recebem efeitos de perks.

## Persist?ncia

Saves antigos recebem estado vazio de perks sem cria??o autom?tica de progress?o.

Saves novos preservam:

- XP de arqu?tipo;
- n?vel;
- perks desbloqueados;
- perks ativos.

Dados inv?lidos ou duplicados s?o normalizados.

## Regras de consist?ncia

A reconcilia??o:

- remove IDs inv?lidos;
- remove duplicatas;
- mant?m desbloqueios v?lidos;
- remove ativos incompat?veis;
- limita ativos ao n?mero atual de slots;
- ? idempotente.

## Interface

O painel de identidade apresenta:

- arqu?tipo principal;
- perfil secund?rio;
- n?vel de arqu?tipo;
- XP de arqu?tipo;
- slots ocupados;
- perks dispon?veis;
- requisitos;
- estado;
- a??o de desbloquear;
- a??o de ativar;
- a??o de desativar.

## Testes

Arquivos espec?ficos da Etapa 18:

- `tests/archetypes-stage18.test.cjs`
- `tests/archetype-perks-stage18.test.cjs`
- `tests/archetype-perk-effects-stage18.test.cjs`
- `tests/archetype-perk-consistency-stage18.test.cjs`
- `tests/archetype-perk-application-stage18.test.cjs`
- `tests/archetype-perk-ui-stage18.test.cjs`
- `tests/archetype-perk-ui-flow-stage18.test.cjs`

Cobertura inclui:

- cat?logo;
- compatibilidade por posi??o;
- migra??o;
- XP;
- perks;
- slots;
- efeitos;
- idempot?ncia;
- mudan?a de perfil;
- application commands;
- UI;
- save/reload;
- regress?es das etapas anteriores.

## Regra de qualidade

Nenhum bug corrigido na Etapa 18 deve retornar sem um teste de regress?o correspondente.
