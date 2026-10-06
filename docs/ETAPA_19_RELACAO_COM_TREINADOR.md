# Etapa 19 - Relacao com o treinador e disputa por posicao

## Status

Concluida e validada em 06/10/2026.

Validacoes realizadas:

- testes unitarios e de regressao;
- testes de UI;
- validacao de sintaxe;
- validacao completa com `npm run check`;
- suite completa com `npm test`;
- `npm run test:ui`;
- `npm run build`;
- `git diff --check`;
- teste manual no navegador.

Todos os comandos de fechamento retornaram codigo 0.

---

## Objetivo

Transformar a relacao com o treinador em um sistema persistente e conectado as regras reais da carreira.

A confianca do treinador agora possui historico explicavel, conversas interativas, compromissos de minutos, impacto de mudancas de comando tecnico e integracao com a disputa real por posicao.

A Etapa 19 nao cria personalidade completa para treinadores. Esse escopo permanece reservado para uma etapa futura.

---

## 19A - Historico de confianca

Foi criada uma trilha persistente para explicar alteracoes na confianca do treinador.

O estado da disputa do elenco passou a registrar:

- `trustHistory`;
- `lastTrustEvent`;
- origem da alteracao;
- delta da confianca;
- dia;
- motivo;
- dados contextuais de treino e partida.

O sistema possui deduplicacao por `eventId` para impedir que o mesmo acontecimento seja aplicado duas vezes.

A consulta canonica e feita por `Squad.trustSummary()`.

---

## 19B - Painel de relacao com o treinador

A tela de elenco passou a exibir um painel especifico da relacao com o treinador.

O painel apresenta:

- confianca atual;
- papel atual no elenco;
- tendencia recente;
- objetivos da proxima partida;
- feedback recente;
- historico de alteracoes.

A interface utiliza os dados do dominio e nao replica as regras de negocio.

---

## 19C - Conversas individuais

Foi implementado um sistema persistente de conversa individual com o treinador.

Principais regras:

- disponivel apenas na carreira de jogador;
- uma conversa ativa por vez;
- cooldown de 14 dias;
- respostas diferentes conforme a situacao do atleta;
- pequenas consequencias em confianca e moral;
- historico persistente;
- integracao com a caixa de entrada;
- protecao contra resposta duplicada;
- suporte a save/reload.

As conversas sao iniciadas e respondidas atraves da camada Application.

---

## 19D - Interface funcional das conversas

O painel da relacao passou a permitir iniciar e responder conversas diretamente pela interface.

Fluxo:

1. jogador abre a tela de elenco;
2. seleciona Conversar com o treinador;
3. recebe uma pergunta contextual;
4. escolhe uma resposta;
5. a Application executa a acao;
6. o save e atualizado;
7. a interface e renderizada novamente.

A UI nao altera `coachTrust` diretamente.

O fluxo foi validado manualmente no navegador.

---

## 19E - Compromissos do treinador

Pedidos por mais minutos podem gerar um compromisso real do treinador.

Existem tres formatos conforme o papel atual do jogador.

### Reserva / Fora dos planos

Objetivo:

- receber pelo menos uma oportunidade em ate 3 jogos elegiveis.

### Rotacao

Objetivo:

- acumular pelo menos 30 minutos em ate 3 jogos elegiveis.

### Titular / Importante / Estrela

Objetivo:

- iniciar como titular em pelo menos 2 dos proximos 3 jogos elegiveis.

---

## Regras dos compromissos

Os compromissos possuem:

- identificador unico;
- clube;
- dia e temporada de criacao;
- papel do jogador quando o compromisso foi criado;
- tipo;
- metrica;
- alvo;
- numero maximo de jogos;
- progresso;
- historico;
- status.

Status utilizados:

- `ATIVA`;
- `CUMPRIDA`;
- `QUEBRADA`;
- `CANCELADA`.

Lesao ou suspensao nao consome jogo elegivel.

A mesma partida nao pode ser contabilizada duas vezes.

O compromisso nao concede titularidade artificialmente e nao altera diretamente `squadRole`.

O sistema acompanha o resultado real produzido pelo motor de partidas.

---

## Consequencias dos compromissos

Quando cumprido:

- o compromisso e movido para o historico;
- o jogador recebe pequeno ganho de moral;
- uma mensagem e registrada.

Quando quebrado:

- o compromisso e movido para o historico;
- o jogador sofre pequena queda de moral;
- uma mensagem e registrada.

O cumprimento ou quebra de promessa nao altera artificialmente a confianca do treinador.

---

## Interface dos compromissos

A tela de relacao com o treinador exibe:

- compromisso ativo;
- objetivo;
- progresso atual;
- jogos elegiveis usados;
- limite de jogos;
- historico;
- status de compromissos anteriores.

Exemplos de progresso:

- `12/30 minutos`;
- `1/2 titularidades`;
- `1/1 oportunidade`;
- `2/3 jogos elegiveis`.

---

## 19F - Mudanca de treinador

O Mundo Vivo ja possuia mudancas de comando tecnico, mas anteriormente o clube atual do jogador era excluido dessas mudancas.

A Etapa 19 passou a permitir que o clube atual de uma carreira de jogador tambem troque de treinador quando estiver em crise.

Carreiras no modo treinador continuam protegidas para impedir que o proprio usuario seja substituido automaticamente por essa rotina.

---

## Recalibracao da relacao

Quando ocorre uma troca real de treinador no clube atual:

- a confianca e aproximada de uma base neutra;
- a hierarquia e recalculada pelas regras normais;
- nenhum papel e concedido diretamente;
- o evento entra no historico de confianca;
- uma mensagem importante e enviada ao jogador;
- a geracao do treinador e incrementada.

O processamento e idempotente: uma mesma troca nao pode ser processada duas vezes.

---

## Conversas e promessas apos troca de treinador

Uma troca de comando invalida compromissos pessoais feitos pela comissao anterior.

Portanto:

- promessa ativa e marcada como `CANCELADA`;
- conversa ainda aberta e encerrada;
- o historico e preservado;
- a nova comissao inicia uma nova relacao com o jogador.

---

## Correcao de indisponibilidade

Foi corrigida uma regra antiga da carreira.

Anteriormente, qualquer partida sem participacao do jogador removia 1 ponto de confianca.

Isso tambem atingia indevidamente jogadores:

- lesionados;
- suspensos;
- suspensos especificamente na competicao.

Agora:

- jogador indisponivel nao perde confianca por nao atuar;
- jogador disponivel e preterido por decisao tecnica continua sujeito a queda de confianca.

Essa regra possui testes permanentes de regressao.

---

## Integracao com a disputa por posicao

A Etapa 19 preserva o motor de meritocracia existente.

A escala??o continua considerando fatores como:

- overall;
- posicao;
- forma recente;
- condicao fisica;
- moral;
- confianca do treinador;
- concorrencia interna.

Uma promessa nao transforma automaticamente um jogador em titular.

O motor real de escala??o continua sendo a autoridade sobre quem joga.

---

## Persistencia

Os novos estados sobrevivem ao ciclo de save/reload:

- historico de confianca;
- conversas;
- cooldown;
- compromissos;
- progresso das promessas;
- historico das promessas;
- geracao do treinador;
- ultima troca de treinador processada.

A migracao preserva compatibilidade com saves anteriores.

---

## Cobertura automatizada

Foram adicionados testes especificos para:

- historico de confianca;
- UI da relacao;
- conversas;
- UI das conversas;
- compromissos;
- UI dos compromissos;
- mudanca de treinador;
- indisponibilidade por lesao/suspensao.

Arquivos:

- `tests/coach-relationship-stage19.test.cjs`;
- `tests/coach-relationship-ui-stage19.test.cjs`;
- `tests/coach-conversations-stage19.test.cjs`;
- `tests/coach-conversation-ui-stage19.test.cjs`;
- `tests/coach-promises-stage19.test.cjs`;
- `tests/coach-promises-ui-stage19.test.cjs`;
- `tests/coach-manager-change-stage19.test.cjs`;
- `tests/coach-unavailability-stage19.test.cjs`.

Tambem foram executadas suites anteriores para impedir regressao em Career, Engine, Squad e UI.

---

## Validacao manual

O fluxo de conversa foi testado manualmente no navegador.

Foram validados:

- abertura da conversa;
- exibicao das respostas;
- resposta funcional;
- atualizacao da confianca;
- atualizacao do historico;
- cooldown;
- mensagens;
- painel de relacao.

A Etapa 19 foi aprovada manualmente pelo usuario em 06/10/2026.

---

## Arquitetura

Responsabilidades mantidas:

### Domain

`src/domain/squad.js`

Responsavel por:

- disputa por posicao;
- historico de confianca;
- conversa com treinador;
- compromissos;
- resposta a troca de treinador.

`src/domain/career.js`

Responsavel por:

- eventos da carreira;
- mundo vivo;
- avaliacao de partidas;
- comunicacoes.

`src/domain/engine.js`

Responsavel por:

- integracao das partidas;
- relatorio do jogador;
- envio do resultado da partida para os sistemas da carreira.

### Application

`src/application/game.js`

Responsavel pelos comandos utilizados pela interface para iniciar e responder conversas.

### UI

`src/ui/app.js`

Responsavel apenas por apresentar o estado e disparar comandos da Application.

---

## Resultado

A Etapa 19 adiciona uma relacao treinador-jogador persistente, explicavel e conectada ao gameplay real.

O jogador agora consegue entender:

- por que sua confianca mudou;
- qual e seu papel;
- o que o treinador espera;
- quando uma oportunidade foi prometida;
- se a promessa foi cumprida;
- como uma mudanca de treinador afeta sua carreira.

Tudo isso sem substituir o motor de meritocracia e sem forcar resultados esportivos.
