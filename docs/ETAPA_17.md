# ETAPA 17 ? EMPRES?RIO, AG?NCIA E GEST?O DE CARREIRA

## Objetivo

A Etapa 17 transforma o empres?rio em um sistema permanente de gest?o de carreira.

O agente deixa de ser apenas um texto de interface e passa a interferir de forma controlada em:

- negocia??o salarial;
- luvas;
- patroc?nios;
- objetivos profissionais;
- relacionamento;
- propostas de representa??o;
- progress?o de carreira;
- hist?rico financeiro;
- decis?es sobre perman?ncia e sa?da.

O sistema segue filosofia simulation-first.

O empres?rio melhora condi??es e probabilidades, mas nunca garante transfer?ncia, contrato ou sucesso esportivo.

---

## Arquitetura

A Etapa 17 reutiliza o sistema de carreira existente.

Principais integra??es:

- src/domain/career.js
- src/domain/life.js
- src/domain/commercial.js
- src/application/game.js
- src/ui/app.js
- src/infrastructure/save.js

N?o existe um segundo mercado paralelo.

O empres?rio atua sobre:

Career -> contratos e mercado
Life -> sal?rio e comiss?o
Commercial -> patroc?nios
Application -> comandos
UI -> gest?o visual

---

## N?veis de ag?ncia

### LOCAL

Voltada para:

- in?cio de carreira;
- jogadores jovens;
- desenvolvimento;
- primeiros contratos.

Exige poucos requisitos.

Comiss?o menor.

---

### NATIONAL

Voltada para:

- atletas consolidados;
- mercado brasileiro;
- Am?rica do Sul;
- contratos maiores.

Possui rede e negocia??o superiores.

---

### ELITE

Voltada para:

- atletas de alto n?vel;
- grandes clubes;
- transfer?ncias internacionais;
- sal?rios elevados.

Exige reputa??o, overall e valor de mercado maiores.

---

### GLOBAL

Voltada para:

- superestrelas;
- atletas de elite mundial;
- grandes mercados;
- contratos premium.

? o n?vel m?ximo de representa??o.

---

## Elegibilidade

Ag?ncias superiores n?o podem ser contratadas apenas porque o jogador possui dinheiro.

O sistema verifica:

- reputa??o;
- overall;
- valor de mercado.

Ag?ncias bloqueadas continuam vis?veis na interface para demonstrar progress?o de carreira.

---

## Representa??o ?nica

Cada jogador pode possuir apenas uma ag?ncia ativa.

Uma segunda ag?ncia n?o pode assumir durante o per?odo m?nimo do contrato atual.

A ag?ncia anterior ? registrada no hist?rico quando ocorre uma troca.

---

## Per?odo m?nimo

Cada ag?ncia possui um per?odo m?nimo de representa??o.

Durante esse per?odo:

- troca ? bloqueada;
- demiss?o ? bloqueada.

Depois do per?odo m?nimo, a troca passa a ser poss?vel.

---

## Rescis?o

Algumas ag?ncias possuem custo de sa?da.

O valor ? calculado a partir do sal?rio atual do atleta e do multiplicador da ag?ncia.

A despesa entra no ledger financeiro.

---

## Car?ncia

Ap?s demitir uma ag?ncia, o atleta precisa aguardar 30 dias antes de assinar nova representa??o.

Isso evita troca repetitiva sem consequ?ncia.

---

## Propostas de representa??o

Ag?ncias podem demonstrar interesse automaticamente quando o atleta atende aos requisitos.

As propostas:

- possuem prazo;
- n?o duplicam enquanto estiverem abertas;
- podem ser aceitas;
- podem ser recusadas;
- expiram automaticamente.

A ag?ncia atual nunca envia proposta para o pr?prio jogador.

---

## Estrat?gia do empres?rio

O jogador define prioridade:

- equil?brio;
- tempo de jogo;
- sal?rio;
- prest?gio;
- desenvolvimento.

Tamb?m define postura:

- permanecer;
- aberto a propostas;
- buscar empr?stimo;
- buscar sa?da.

A estrat?gia influencia objetivos e comportamento do empres?rio.

---

## Objetivos

O empres?rio pode criar objetivos ligados a:

- reputa??o;
- overall;
- sal?rio;
- participa??o em jogos;
- transfer?ncia.

Cada objetivo possui:

- valor inicial;
- meta;
- prazo;
- status.

Estados:

ATIVO
CONCLU?DO
N?O CUMPRIDO

---

## Relacionamento

Faixas:

0?29: RUIM
30?49: FR?GIL
50?69: EST?VEL
70?84: BOA
85?100: EXCELENTE

Objetivos cumpridos melhoram a rela??o.

Objetivos fracassados reduzem a rela??o.

Negocia??es e contratos bem-sucedidos tamb?m podem melhorar o relacionamento.

---

## Negocia??o

A contraproposta passa a considerar:

- reputa??o do atleta;
- confian?a do treinador;
- capacidade de negocia??o do empres?rio;
- relacionamento atleta/ag?ncia.

Agentes melhores podem conseguir termos melhores.

N?o existe garantia autom?tica.

---

## Comiss?es

O sistema registra comiss?es reais no ledger.

### Sal?rio

Comiss?o mensal conforme contrato da ag?ncia.

### Luvas de assinatura

Comiss?o cobrada sobre luvas de um novo contrato.

### Luvas de renova??o

Comiss?o cobrada na renova??o.

### Patroc?nios

Existe comiss?o comercial conforme n?vel da ag?ncia.

As comiss?es s?o despesas do jogador.

O valor bruto do contrato comercial continua registrado no m?dulo comercial.

---

## Prote??o contra duplicidade

Pagamentos que j? possuem prote??o de idempot?ncia continuam usando essa prote??o.

Exemplos:

- sal?rio mensal;
- patroc?nio;
- save/reload;
- reprocessamento do mesmo ciclo.

Uma comiss?o nunca deve aparecer duas vezes por causa de reload.

---

## Saves antigos

A migra??o adiciona agencyState quando necess?rio.

Estruturas preservadas:

- agente atual;
- hist?rico;
- objetivos;
- relacionamento;
- propostas;
- total de comiss?es.

Se agent for explicitamente null, o sistema mant?m null.

Isso evita recriar automaticamente um empres?rio demitido.

---

## Interface

A ?rea do jogador mostra:

- ag?ncia atual;
- n?vel;
- reputa??o;
- negocia??o;
- rede;
- especialidade;
- relacionamento;
- total de comiss?es;
- objetivos;
- propostas de representa??o;
- mercado de ag?ncias;
- requisitos;
- hist?rico;
- encerramento de representa??o.

---

## Regras que n?o foram alteradas

A Etapa 17 n?o remove nem enfraquece:

- janelas de transfer?ncia;
- acordo fora da janela;
- transfer?ncia agendada;
- contrato esportivo;
- mercado por interesse;
- exclusividade comercial;
- regras de patroc?nio;
- saves antigos.

---

## Testes permanentes

Arquivo:

tests/agency-stage17.test.cjs

Cobertura:

- tiers;
- elegibilidade;
- progress?o;
- representa??o ?nica;
- per?odo m?nimo;
- hist?rico;
- demiss?o;
- rescis?o;
- car?ncia;
- propostas;
- recusa;
- expira??o;
- objetivos;
- relacionamento;
- negocia??o;
- sal?rio;
- luvas;
- renova??o;
- patroc?nio;
- idempot?ncia;
- save;
- migra??o;
- UI;
- application commands.

Regress?es atualizadas:

- market-stage7.test.cjs
- life-stage11.test.cjs
- commercial-stage12.test.cjs

---

## Crit?rio de conclus?o

A Etapa 17 s? pode ser considerada conclu?da quando:

1. npm run check passa;
2. npm test passa;
3. npm run test:ui passa;
4. npm run build passa;
5. teste manual no navegador passa;
6. usu?rio aprova explicitamente;
7. somente ent?o pode ocorrer commit/push.
