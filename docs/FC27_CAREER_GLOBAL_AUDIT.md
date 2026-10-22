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
