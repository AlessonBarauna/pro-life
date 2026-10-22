# PRO-LIFE — AUDITORIA GLOBAL FC 27

## A01 — Inventário estrutural (22/10/2026)

**Branch auditada:** `feature/fc27-career-global-audit`, derivada de `feature/fc27-next-development`.
**Escopo:** leitura de código remoto; nenhum teste executado nesta rodada. Não confundir presença de módulo com funcionalidade validada.

### 1. Carregamento e arquitetura

No `index.html` foram identificadas **154 referências a scripts**:

| Grupo | Scripts |
|---|---:|
| `src/domain` | 86 |
| `src/data` | 23 |
| `src/ui` | 40 |
| `src/application` | 1 |
| `src/infrastructure` | 4 |

Contagens referentes às tags script da página, não ao número total de arquivos existentes. Há scripts com parâmetros de cache `?v=...`.

### 2. Responsabilidades e evidências iniciais

| Camada | Arquivo | Evidência observada | Grau de validação |
|---|---|---|---|
| Coordenação | `src/domain/engine.js` | Importa sistemas de partidas, competições, treinadores, economia e mercado | Integração ainda não testada |
| Comandos | `src/application/game.js` | Camada de aplicação carregada entre domínio e interface | Fluxos não testados |
| Jogador | `src/domain/career.js` | Módulo de estado de carreira com inicialização | Fluxos não testados |
| Treinador | `src/domain/coach-career.js` | Diretoria, demissão, moral, treinamento coletivo, posição secundária e contratos | Fluxos não testados |
| Mercado | `src/domain/world-live-market.js` | Estados `rumor` → `scouting` → `negotiating` → `offer`; resultados finalizados e rejeitados | Integração não testada |
| Finanças | `src/domain/club-economy.js` | Estimativa econômica, cenários e contratos de patrocínio | Integração não testada |
| Partida | `src/ui/live-match.js` | Interface ao vivo; prévia tática experimental expressamente isolada do placar oficial e save | Validar comandos oficiais |
| Seleções | `src/domain/national-callups.js` | Convocações e janela própria de referência, não calendário oficial FIFA | Calendário/partidas não testados |
| Salvamento | `src/infrastructure/save.js` | Validação rígida e suporte a estruturas legadas | Compatibilidade não testada |
| Interface | `src/ui/app.js` | Navegação, notificações e modais | Fluxos não testados |
| UI regressão | `tests/ui.test.cjs` | Teste com JSDOM; há `return dom` seguido de código inalcançável em `make()` | Corrigir cobertura após aprovação |

### 3. Achados / hipóteses rastreáveis

- **A01-R01 — cobertura do criador FC 27:** `tests/ui.test.cjs`, função `make`, tem um `return dom;` antes de um trecho de teste de criação. Trecho posterior não executa nesse caminho. Investigar testes alternativos antes de classificar a cobertura.
- **A01-R02 — rivalidades:** `src/domain/player-rivalries.js` não foi encontrado no ref auditado. Buscar implementações equivalentes; não concluir ausência funcional ainda.
- **A01-R03 — simulador:** `src/ui/live-match.js` rotula o laboratório tático como experimental e sem efeito sobre placar oficial ou save; averiguar se mudanças oficiais no jogo usam outro controlador.
- **A01-R04 — calendários:** `fix/english-cups-calendar-2026` estava 75 commits à frente de `feature/fc27-next-development`. Não fundir nem tomar alterações não aprovadas como presente na branch auditada.
- **A01-R05 — tempo e datas:** `src/domain/national-callups.js` usa ano com 365 dias e regra interna de janelas; conferir interoperabilidade com temporadas europeias agosto–maio, anos bissextos e ordenação de eventos.
- **A01-R06 — origem de posições:** `src/domain/coach-career.js` distingue `ea_fc27`, `verified` e `suggested`; verificar que a UI não apresente posições sugeridas como oficiais.

### 4. Próxima etapa de diagnóstico (A01 complementar)

1. Mapear rotas `ProLifeApp.execute` → mutações `engine` → UI → persistência para os dois modos.
2. Localizar testes por componente (transferência, elenco, GER, temporada, contratações, rivalidades e lesões); confirmar quais estão realmente no `npm test` e no `npm run test:ui`.
3. Testar criação de carreira em FC 27, avançar dia, simular jogo, salvar, recarregar, mudar temporada e comparar estado.
4. Inspecionar códigos e testes de outros módulos não listados e registrar lacunas com linha/trecho.
5. Validar visuais por capturas reais do projeto e referências oficiais, distinguindo FC 27 de FC 26.

### 5. Regras de continuidade

**Sem alterações de gameplay nesta fase.** Não alterar `main` ou `fix/english-cups-calendar-2026`; não fazer merges automáticos ou force push. Toda classificação **Completa** exige código, fluxo real, teste e validação manual quando necessária.

**Estado:** A01 inventário inicial registrado; auditoria funcional e testes ainda pendentes. Próxima etapa: aprofundar rastreamento e cobertura.


## A01.2 — Fluxos de execução e cobertura (22/10/2026)

**Método:** inspeção direta de trechos e pontos de entrada no GitHub. **Não foram executados testes locais/remotos.** Referências abaixo são números de linha do ref auditado nesta rodada.

### Cadeia principal observada

`src/ui/app.js` → `src/application/game.js:execute` → `src/domain/engine.js` e módulos especializados → `src/ui/app.js:persist` → `src/infrastructure/save.js:save`.

| Operação | Evidência | Conclusão limitada |
|---|---|---|
| Avançar dias | `game.js:58-63` delega a `D.advance`; `engine.js:2628` | Encaminhamento confirmado, efeitos não testados |
| Simular próxima partida/30 dias/temporada | `game.js:65-66` delega a `D.simulateAdvance`; `engine.js:3005-3069` | Estados de parada, modo retomável e resultado explícitos no código |
| Avançar até data | `app.js:1319-1330` usa `D.advanceToDay`; `engine.js:3073` | Caminho alternativo que requer teste próprio |
| Salvar após simulação | `app.js:9592-9596` chama `A.execute`, `persist`, `render`; `app.js:8622` usa `S.save` | Encaminhamento confirmado, não prova integridade |
| Validação do save | `save.js:867-891` valida e compara carreira/slot anterior | Bloqueios protetivos podem rejeitar gravações; testar cenários reais |
| Transferência do jogador | `game.js:69-82` identifica oferta válida antes de `D.join` | Fluxo condicionado à disponibilidade da proposta |
| Apresentação do treinador | `game.js:7-26` registra e reconhece apresentação | Investigar disparadores e duplicação |
| Criação via teste de UI | `tests/ui.test.cjs:44-79` | `return dom` na linha 60 torna bloco posterior inalcançável |

### Testes: limitação importante

`package.json`: `npm run test:ui` chama exclusivamente `node tests/ui.test.cjs`. `npm test` usa uma cadeia longa de comandos `node --test`, sem coleta automática de todos os arquivos do diretório `tests/`. A presença de um arquivo `*.test.cjs` no repositório, isoladamente, **não garante** que integre a execução de `npm test`.

**A01-R07 — risco de cobertura:** comparar todos os testes existentes com o conjunto referenciado em `package.json`; validar aqueles omitidos explicitamente e exigir logs TAP com saída real.

**A01-R08 — inconsistência potencial do fluxo de salvamento:** operações do aplicativo com mutação de estado e retornos antecipados precisam ser auditadas em conjunto com os gatilhos de persistência. Verificar save → reload → mesmo estado para jogador e treinador.

**A01-R09 — avanço temporal concorrente:** há rotas distintas para `advance`, `simulateAdvance` e `advanceToDay`. Verificar se eventos de mercado, convocações, calendário e contratos se comportam identicamente quando atingidos por cada rota.

### Critérios de saída da A01

- [x] Criar branch isolada e documento central.
- [x] Inventariar scripts carregados pelo index.
- [x] Identificar pontos de entrada, comandos, avanço e save.
- [ ] Completar inventário dos casos de teste incluídos e omitidos dos scripts npm.
- [ ] Localizar rivalidades e comprovar a interação com a carreira do jogador.
- [ ] Executar testes de integração e testes manuais sem alterar saves do usuário.
- [ ] Validar navegação e imagens reais em desktop e iPhone.

**Próximo diagnóstico:** rastrear cobertura de mercado, GER, partidas e salvamento; registrar matriz de testes antes de qualquer patch.


## A01.3 — Matriz de cobertura dos testes (22/10/2026)

**Método:** leitura de `package.json`, `index.html` e confirmação de existência de arquivos nomeados no GitHub. Os testes não foram executados; este inventário não equivale ao catálogo completo de `tests/`.

### Cobertura configurada

- `npm test`: referência explícita a **55 arquivos de teste distintos** em comandos encadeados `node --test` (mais etapa de pré-teste `coach:avatar`).
- `npm run test:ui`: executa apenas **`tests/ui.test.cjs`**.
- `npm run check`: valida sintaxe de uma lista de arquivos; não substitui testes de regressão.
- Presença de `*.test.cjs` não garante inclusão no `npm test`.

| Arquivo comprovadamente existente | Chamado por `npm test` | Área / hipótese de cobertura |
|---|---|---|
| `tests/market-stage7.test.cjs` | Sim | Interesse/negociação modo jogador |
| `tests/world-career-market-stage28c.test.cjs` | Sim | Pool global de clubes do jogador |
| `tests/player-profile.test.cjs` | Sim | Dados canônicos no perfil |
| `tests/live-match.test.cjs` | Sim | Exibição incremental do placar; primeiro teste examinado valida apenas `scoreAt` |
| `tests/coach-player-roles-31011.test.cjs` | **Não** | Substituição no modo treinador |
| `tests/coach-match-lab-v2.test.cjs` | **Não** | Prévia tática independente |
| `tests/coach-sponsorship-complete.test.cjs` | **Não** | Patrocínios e persistência |
| `tests/central-official-competition-context.test.cjs` | **Não** | Contexto das competições na central |
| `tests/coach-2029-central-integration.test.cjs` | **Não** | Integração da central em temporadas futuras |
| `tests/english-cups-engine-integration.test.cjs` | **Não** | Copas inglesas, protegidas por branch paralela |

**Importante:** os testes classificados 'Não' estão fora do script principal, mas podem fazer parte de outros comandos ou da CI. Ainda falta auditar os workflows e descobrir todos os testes existentes.

### Novos achados

- **A01-R10 — regressão parcial:** os testes de integração do treinador observados não são executados por `npm test`; executar isoladamente antes de julgar sua situação e avaliar inclusão futura com aprovação.
- **A01-R11 — placar versus partida:** `tests/live-match.test.cjs` inspecionado contém teste de placar progressivo; não prova substituições, efeitos das táticas ou sincronização com o save.
- **A01-R12 — rivalidades sem arquivos esperados:** `src/domain/player-rivalries.js` e `src/ui/player-j13-rivalries.js` retornaram ausência na branch. O `index.html` não referencia script com 'rival' no caminho. Ainda é necessário pesquisar implementação embutida, testes e outras branches.
- **A01-R13 — testes e ramificações:** `tests/english-cups-engine-integration.test.cjs` existe na branch auditada, mas o desenvolvimento mais recente dos calendários está isolado; não misturar os resultados de branches diferentes.

### Sequência de verificação, sem mudanças em gameplay

1. Inventariar os arquivos sob `tests/` e os workflows de CI para contar testes omitidos de forma exaustiva.
2. Executar separadamente os testes específicos do treinador, saves, partidas e mercado; capturar stdout/stderr e código de saída real em TAP, sem alegar aprovação antecipada.
3. Testar pelo fluxo real: criação FC27 → transferência → jogo com substituição → avanço → autosave/reload → nova temporada.
4. Testar jogador e treinador em separado, inclusive modo desktop e iPhone.
5. Somente após os resultados, reclassificar os sistemas de 'Não verificada' para 'Completa', 'Parcial' ou 'Com problema'.

**Situação da A01.3:** identificação da cobertura declarada concluída; execução e inventário exaustivo pendentes.
