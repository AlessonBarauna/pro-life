# AUDITORIA GLOBAL — PRO-LIFE

## Controle
Projeto: PRO-LIFE
Branch de referência: feature/world-club-competitions-stage28
Checkpoint base: ef3af3e
Última etapa implementada: Stage 31.3.1
Etapa em análise: Stage 31.3

## Regras de manutenção
- Preservar descobertas anteriores.
- Registrar toda auditoria nova.
- Registrar toda implementação concluída.
- Documentar arquivos e funções envolvidos.
- Documentar testes, problemas e correções.
- Não declarar funcionalidades aprovadas sem validação.
- Consultar este documento antes de novas auditorias.
- Não fazer commit ou push sem autorização.

## Histórico das etapas
### Stages 28–30
- Mundo mundial de clubes e competições.
- Transferências e mercado mundial.
- Central do Mercado e histórico do jogador.
- Otimização dos saves.
- Preferências nacionais e internacionais.
- Otimização das validações de longa duração.
- Checkpoint: ef3af3e.

### Stage 31.1
- Refinamento visual da Central.
- Validação técnica e visual aprovada.
- Corrigida referência worldLeagueName em app.js.
- Teste ui.test.cjs atualizado para carregar componentes mundiais.

### Stage 31.2
- Campo tático visual.
- Formações 4-3-3, 4-4-2 e 4-2-3-1.
- Titulares, reservas, capitães e destaque do jogador.
- Testes e avaliação visual aprovados.

## Stage 31.3 — Treinamento e evolução

### Arquitetura identificada
- src/domain/training.js: progressão e treinamento.
- src/domain/engine.js: cálculo do GER e integração.
- src/ui/app.js: interface de treinamento.

### Funções relevantes
- progressAttribute: training.js, linha aproximada 815.
- trainingAvailable: training.js, linha aproximada 849.
- performTraining: training.js, linha aproximada 850.
- daily: training.js, linha aproximada 885.
- matchDevelopment: training.js, linha aproximada 899.
- overall: engine.js, linha aproximada 136.
- autoTrainingPlan: engine.js, linha aproximada 1696.

### Regras identificadas
- Evolução considera idade, arquétipo, estilo e especialização.
- Treino manual e automático utilizam progressAttribute.
- Treino automático tem ganho de atributo inferior ao manual.
- Treinamento diário considera lesões e intensidade.
- Jogos concedem XP e progressão relacionada ao desempenho.
- GER utiliza pesos diferentes para cada posição.
- Partidas possuem controle contra desenvolvimento duplicado.

### Pendências de auditoria
- Validar evolução real de atributos após vários dias.
- Verificar persistência do planejamento de treino.
- Verificar coerência entre atributos e GER.
- Testar limites de evolução e potencial.
- Confirmar comportamento de treino manual e automático no mesmo dia.

## Próximas etapas
Atualizar este documento após cada diagnóstico e implementação.

## Stage 31.3.1 - Imprensa contextual

Status: implementacao e validacao direcionada concluidas.

### Causa confirmada
- engine.js:1624-1627 cria decisao generica a cada 21 dias.
- life.js:135-139 sorteia eventos sem filtrar elegibilidade.
- life.js:9 inclui criticism no sorteio incondicional.
- engine.js:1926 limpa a decisao apos resposta.
- unexpected-events.js possui sistema independente; preservar.

### Dados disponiveis
- Career.init(s).playerCareer.lastMatchReport.
- day, season, status, minutes, rating, competition.
- engine.js:1266-1274 registra partidas de clubes.
- national-team.js:8327 registra partidas da Selecao.

### Regras de implementacao
- Critica apenas no modo jogador.
- Participacao real: TITULAR ou ENTROU_DO_BANCO.
- Exigir minutos positivos e nota numerica menor que 6.
- Exigir 0 a 5 dias desde a atuacao.
- Impedir repeticao por chave de partida.
- Excluir NAO_UTILIZADO, NAO_RELACIONADO e INDISPONIVEL.
- Descartar critica antiga invalida antes de interromper a simulacao.
- Preservar demais decisoes e comportamento deterministico.
- Considerar saves antigos sem novos campos.
- Nao modificar partidas, XP, GER ou calendario.

### Testes necessarios
- Ausencia de jogos.
- Copa do Mundo sem convocacao.
- Banco sem participacao.
- Atuacao ruim por clube e Selecao.
- Atuacao boa.
- Relatorio com mais de cinco dias.
- Repeticao da mesma partida.
- Save antigo com critica pendente.
- Regressao das demais decisoes.

### Resultado
- `src/domain/life.js`: `next()` agora filtra `criticism` por modo, idade do relatório, participação, minutos e nota; `criticismReportId()`, `validCriticismReport()`, `criticismCandidate()` e `sanitizeDecision()` registram a partida e impedem repetição.
- `src/domain/engine.js`: geração mantém uma única chamada ao RNG; críticas inválidas são descartadas antes de pendências, resolução automática ou resposta. Decisões legítimas já pendentes voltam a interromper simulações longas.
- `tests/criticism-stage31.test.cjs`: cobre ausência de jogos, atuação ruim/boa, banco sem entrar, fora da relação, Seleção/Copa do Mundo, relatório antigo, duplicidade, save antigo e determinismo.
- Nenhuma regra de calendário, partida, transferência, atributos, GER ou `unexpected-events.js` foi alterada.
- Testes novos: 8/8 aprovados.
- Regressões de vida, comunicações, pós-jogo, decisões urgentes, motor e eventos inesperados: 50/50 verificações aprovadas após a correção pontual.
- `node --check` e `git diff --check`: aprovados.

## Stage 31.3.2 - Forma recente unificada

Status: implementada e validada.

### Arquitetura
- src/ui/home-dashboard.js: sortedOwnMatches() filtra jogos do clube.
- snapshot() monta recent com cinco partidas do clube.
- src/domain/national-team.js: n.matches armazena atuacoes na Selecao.
- src/ui/app.js: Central V3 renderiza H.recent.
- app.js: data-recent-match abre detalhes da partida.

### Dados da Selecao
- n.matches: day, season, competition, opponent.
- Placar: brazil, other.
- Desempenho: starter, entryMinute, minutes, rating, goals, assists.
- O historico n.matches inclui apenas partidas com participacao.

### Arquivos e funcoes modificados
- `src/ui/home-dashboard.js`: `recentEntries()`, `validRating()` e `snapshot()` unificam e formatam os historicos sem alterar o estado da carreira.
- `src/ui/app.js`: o card Forma Recente identifica a Selecao e o handler `data-recent-match` apresenta os dados individuais internacionais.
- `tests/recent-form-national-stage31.test.cjs`: cobertura direcionada dos oito cenarios da Stage.
- `docs/AUDITORIA_GLOBAL_PRO_LIFE.md`: registro desta implementacao e da validacao.

### Regras implementadas
- No modo jogador, partidas do clube e da Selecao sao ordenadas pelo dia e limitadas aos cinco registros mais recentes.
- Registros internacionais repetidos sao descartados por identidade estavel da partida; saves sem o historico internacional continuam exibindo apenas o clube.
- Vitoria, empate e derrota usam o placar do Brasil; competicao, adversario, titularidade, entrada, minutos, gols, assistencias e nota usam somente dados persistidos.
- A Central identifica visualmente a Selecao Brasileira e nao cria autores de gols nem melhor jogador quando esses dados nao existem.
- O indicador FASE considera somente notas numericas entre 1 e 10.
- No modo treinador, `recent` permanece restrito aos jogos do clube.
- Nenhum motor de partidas, calendario, resultado ou convocacao foi modificado.

### Testes e resultados
- Teste direcionado `recent-form-national-stage31.test.cjs`: 8/8 aprovados, sem ignorados ou falhas.
- Regressões `home-dashboard`, `matchday-stage25` e `matchday-ui-stage25`: 12/12 aprovadas.
- `node --check` dos arquivos modificados e `git diff --check`: aprovados.

## Stage 31.3.3 - Relatorios completos da Selecao

Status: implementado e validado.

### Origem dos problemas
- national-team.js: nationalLiveMatch() gera eventos de gols.
- national-team.js: play() calcula gols e assistencias individuais.
- national-team.js: n.matches preserva estatisticas resumidas.
- home-dashboard.js: apresenta gols e MOTM indisponiveis.
- O historico nao preserva os eventos detalhados.
- A associacao de assistencias nos eventos requer correcao.

### Regras de implementacao
- Corrigir coerencia entre gols, assistencias e eventos.
- Persistir eventos reais das partidas internacionais.
- Preservar ordem, minuto, autor e assistencia quando conhecidos.
- Nao inventar atletas ou premios individuais.
- Exibir MOTM somente com dados verificaveis.
- Preservar compatibilidade com saves antigos.
- Evitar duplicacao de eventos apos reload.
- Manter limite atual de historico.
- Nao alterar resultados ja disputados.
- Investigar textos com problemas de codificacao.

### Testes necessarios
- Jogador com gol e assistencia na mesma partida.
- Gols sem assistencia.
- Assistencias sem gols.
- Nenhuma participacao.
- Persistencia apos save/reload.
- Historico antigo sem eventos.
- Detalhes da Central V3.
- Coerencia dos eventos internacionais.

### Resultado
Implementado.

### Implementacao
- national-team.js, nationalLiveMatch(): gols e assistencias do heroi vem das mesmas contagens usadas em play(); eventos do heroi (gol/assistencia) caem dentro dos minutos em campo (entrada ate saida); minutos nao colidem; autores nao identificados usam "Autor nao identificado" com playerId null (antes "Brasil 1"/"bra_goal_0").
- national-team.js, play(): cada partida em n.matches passa a guardar events (minuto, lado, scorerId/scorer e assistId/assist so quando o heroi participou) via matchEventRecords(). Placar, RNG e resultados nao mudaram.
- home-dashboard.js: nationalGoals() preenche goals da Selecao a partir de events; saves antigos (sem events) continuam com goals null.
- app.js: painel de detalhes lista gols/assistencias da Selecao quando ha eventos; sem eventos mantem "nao disponiveis neste registro".
- Melhor da partida (motm) permanece indisponivel para a Selecao: o motor so avalia o heroi, sem notas dos demais jogadores para determinar o melhor de forma verificavel.
- Codificacao: 2 literais "Eliminat?rias" em national-team.js (rotulo de fase e "Ciclo de Eliminatorias") corrigidos para "Eliminatórias". Origem: caractere ja corrompido no codigo-fonte desde commits antigos; sem troca em massa. Fora do escopo e nao alterado: save.js (mensagens "inv?lido/incompat?vel").

### Arquivos afetados
- src/domain/national-team.js
- src/ui/home-dashboard.js
- src/ui/app.js
- tests/national-match-details-stage31.test.cjs (novo)
- docs/AUDITORIA_GLOBAL_PRO_LIFE.md

### Testes
- national-match-details-stage31: 11/11.
- Regressoes (recent-form-national-stage31, matchday-stage25, matchday-ui-stage25, national-team-stage10, home-dashboard): 34/34; world-cup-stage24e3a e 25e: 13/13.
- node --check dos arquivos alterados e git diff --check: aprovados.

### Limitacoes
- Saves antigos nao tem eventos; seus detalhes continuam indisponiveis (nao reconstruidos).
- Partidas sem participacao do heroi nao entram em n.matches (comportamento anterior preservado).

## Stage 31.3.4 - Jogadores e destaques internacionais

Status: implementado e validado.

### Arquitetura confirmada
- buildSquad(): seleciona jogadores brasileiros existentes.
- matchLineup(): define titulares e reservas brasileiros.
- internationalPool(): fornece jogadores internacionais.
- worldCupAvailablePlayers(): seleciona atletas por nacionalidade.
- worldCupDynamicSquad(): monta elencos da Copa.
- worldCupLineup(): define titulares da Copa.
- nationalLiveMatch(): gera gols sem consultar os jogadores escalados.
- matchEventRecords(): persiste eventos internacionais.
- home-dashboard.js: apresenta detalhes das partidas.

### Problemas
- Autores dos gols internacionais nao sao identificados.
- Assistencias dos demais atletas nao sao registradas.
- Nao existem avaliacoes individuais completas.
- Melhor da partida permanece indisponivel.
- Participacao do heroi e calculada separadamente de matchLineup().

### Regras planejadas
- Reaproveitar jogadores e elencos existentes.
- Resolver adversarios por nacionalidade e competicao.
- Nao reutilizar indevidamente elencos congelados da Copa.
- Definir participantes elegiveis para cada partida.
- Respeitar substituicoes e minutos em campo.
- Atribuir gols e assistencias a participantes elegiveis.
- Preservar gols e assistencias ja calculados para o heroi.
- Gerar avaliacoes coerentes para os participantes.
- Definir melhor da partida com base nas avaliacoes.
- Persistir IDs, nomes, eventos e destaque.
- Preservar compatibilidade com saves antigos.
- Nao modificar resultados ou sorteios desnecessariamente.
- Manter comportamento deterministico com seed fixa.

### Testes necessarios
- Brasil contra Argentina nas Eliminatorias.
- Brasil contra adversarios da Copa.
- Identificacao correta dos jogadores.
- Gols de titulares e reservas efetivamente utilizados.
- Assistencias de jogadores identificados.
- Minutos validos para participacao.
- Melhor da partida verificavel.
- Consistencia entre placar e eventos.
- Save e reload sem duplicacoes.
- Saves antigos sem dados detalhados.
- Determinismo e regressao das competicoes.

### Resultado
Implementado.

### Arquitetura final (national-team.js)
- identifyMatchPlayers() e chamada por nationalLiveMatch() depois de gerar os eventos; usa somente hash deterministico (worldCupUnit), nunca o RNG da simulacao: placares, sorteios e participacao do heroi permanecem identicos.
- Brasil: matchLineup() (elenco convocado/congelado da Copa). Adversario: opponentLineup() - em fixture WORLD_CUP usa tournament.squads (elenco oficial congelado); nas demais competicoes seleciona jogadores existentes por nacionalidade via worldCupAvailablePlayers (GOL 2, DEF 7, MEI 7, ATA 6) e worldCupLineup(). Nenhuma escalacao congelada e reutilizada fora da Copa; nenhum nome e inventado.
- liveSideRows(): 11 titulares + 1 a 3 substituicoes por lado (minutos 55-87); lesionados/suspensos (injury/suspension no objeto vivo) sao excluidos; o heroi e sincronizado com a participacao ja calculada (titular sai aos `minutes`; reserva entra em entryMinute e substitui titular da mesma posicao).
- Gols: autor entre os participantes em campo no minuto do evento (peso por posicao e GER); assistencia (55% em gols do heroi, 70% nos demais) de outro participante do mesmo lado, nunca o autor; assistencias/gols do heroi ja calculados sao preservados. Sem participante identificavel o evento fica neutro ("Autor nao identificado").
- Notas (1-10, finitas): GER, posicao, gols, assistencias, minutos, resultado, jogo sem sofrer gols e importancia; a nota do heroi e a ja calculada. Melhor da partida = maior nota entre quem jogou; desempate por gols+assistencias e depois id.
- Persistencia compacta em n.matches[i]: events (autor/assistente com id e nome), players [[id,nome,lado,pos,minutos,nota]] e motm {id,nome,nota,lado}. players e removido das partidas alem das 20 mais recentes para limitar o save (~1,9 KB por partida).
- home-dashboard.js: nationalMotm() so aceita o premio se verificavel (nota finita, jogador presente com a maior nota quando players existe). app.js: painel mostra o melhor da partida e a selecao dele; "Informacao nao disponivel" somente sem dados.

### Compatibilidade
- Saves antigos (sem events/players/motm) continuam validos: gols/melhor da partida indisponiveis; nada e reconstruido retroativamente.
- Eventos da 31.3.3 (autor nulo) continuam exibidos como "Autor nao identificado".

### Arquivos afetados
- src/domain/national-team.js, src/ui/home-dashboard.js, src/ui/app.js
- tests/national-players-motm-stage31.test.cjs (novo)
- tests/national-match-details-stage31.test.cjs (3 asserções da 31.3.3 atualizadas: autores neutros e melhor da partida sempre indisponivel eram o comportamento superado por esta Stage)
- docs/AUDITORIA_GLOBAL_PRO_LIFE.md

### Testes
- national-players-motm-stage31: 12/12 (Eliminatorias, Copa, selecao correta, assistencias, reservas, lesionado/suspenso, heroi, melhor da partida, placar, save/reload, historico antigo, determinismo).
- Regressoes: national-match-details-stage31 11/11, recent-form-national-stage31 8/8, matchday-stage25 6/6, matchday-ui-stage25 3/3, national-team-stage10 14/14, home-dashboard + world-cup-stage24e3a + world-cup-stage25e 16/16.
- node --check dos arquivos alterados e git diff --check: aprovados.

### Limitacoes
- Apenas a partida do heroi e registrada; jogos da Selecao sem participacao dele nao entram em n.matches.
- Notas dos demais jogadores sao estimativas deterministicas, nao resultado de simulacao lance a lance.
- Em adversarios com menos de 11 jogadores identificaveis no banco, os gols restantes ficam neutros.
- Detalhes de jogadores (players) so permanecem nas 20 partidas mais recentes.

## Stage 31.4.1 - Correcao do fluxo de propostas

Status: corrigido e validado.

### Evidencias
- Simulacao de 365 dias para GER 65, 78 e 86.
- Cada perfil apresentou 3 rumores, 3 sondagens e 3 negociacoes.
- Nenhum dos tres perfis recebeu oferta oficial.
- Clube gf_fc27_1948: negociacao dia 196, expiracao dia 232.
- Clube c48: negociacao dia 252, expiracao dia 288.
- FC Midtjylland: negociacao iniciada no dia 336.
- Todos estavam elegiveis nos momentos observados.

### Causas identificadas
- career.js: progressInterest() converte negociacao usando
  weightedCareerOffers(s,rng,8).find() para o clube interessado.
- O sorteio pode excluir um clube que ja esta negociando.
- canTransfer() exige janela aberta e bloqueia a formalizacao.
- Interesses continuam sujeitos a expiracao fora da janela.
- Simulacao de temporada pode resolver ofertas automaticamente.

### Regras para correcao
- Avaliar diretamente o clube interessado.
- Preservar elegibilidade, filtros e realismo.
- Permitir negociacoes fora da janela.
- Respeitar a janela na efetivacao da transferencia.
- Entregar propostas oficiais ao jogador.
- Preservar recusas, cooldowns e prazos.
- Evitar duplicacao de ofertas.
- Manter determinismo e saves antigos.
- Nao alterar o mercado de outros jogadores indevidamente.

### Validacao planejada
- Simular 365 dias com GER 65, 78 e 86.
- Contar rumores, sondagens, negociacoes e ofertas.
- Verificar propostas na caixa de entrada.
- Testar janelas abertas e fechadas.
- Testar recusas e expiracao.
- Testar save/reload e determinismo.
- Executar regressoes das Stages 28-30.

### Resultado
Corrigido.

### Correcao aplicada
- engine.js, weightedCareerOffers(s,rng,count,options): novo parametro opcional options.clubId restringe o conjunto ao clube indicado ANTES da avaliacao; todos os filtros (ligas, mercado internacional, nivel do clube, cooldown de recusa, elegibilidade esportiva) e a formula de condicoes contratuais continuam os mesmos. Sem options o comportamento e identico.
- career.js, progressInterest(): negociacao e convertida avaliando diretamente o clube interessado (createOffers(s,rng,1,{clubId})), sem sorteio entre 8 candidatos. Evita duplicidade (mesmo clube ja com proposta valida, maximo de 3 propostas pendentes, acordo ja assinado).
- Janela: rumores, sondagens, negociacoes e propostas passam a ser processados tambem com a janela fechada (offerPipelineOpen: apenas o bloqueio pos-assinatura careerTransferAvailableDay vale). A efetivacao segue a janela: D.join() fora dela usa signAgreement()/marketTick() (transferencia futura), sem antecipar a mudanca.
- Realismo: novos rumores respeitam intervalo de 90 dias (marketState.lastInterestTick, campo ja existente) para nao encadear ciclos sem pausa; a conversao continua exigindo elegibilidade, necessidade/peso e filtros. Nao ha aumento de probabilidade; a simulacao normal nao aceita nem recusa propostas.
- Entrega: mensagem "Oferta oficial" na caixa de entrada com clube, salario, duracao, papel, tipo (emprestimo) e prazo, e aviso quando a janela esta fechada. app.js: o contador de propostas da navegacao passou a contar propostas validas mesmo com janela fechada.

### Arquivos modificados
- src/domain/career.js, src/domain/engine.js, src/ui/app.js
- tests/career-offers-stage31.test.cjs (novo)
- docs/AUDITORIA_GLOBAL_PRO_LIFE.md

### Resultados
- Simulacao de 365 dias (D.advance, jogador com clube e contrato longo, seeds fixas): GER 65 -> 4 rumores/4 sondagens/4 negociacoes/4 propostas; GER 78 -> 4/4/4/4; GER 86 -> 4/4/4/4 (antes: 3 negociacoes e 0 propostas).
- career-offers-stage31: 14/14 (3 perfis de GER, conversao direta, clube incompativel e cooldown, preferencias, janela aberta e fechada, acordo futuro, acesso, aceitar/recusar/negociar, expiracao, save/reload, determinismo, simulacao sem decisao automatica).
- Regressoes Stages 28-30: career (todos, exceto a temporada completa de 38 rodadas, que excede o tempo disponivel no ambiente), offer-preferences-stage30, target-club-selector-stage28f, world-career-market-stage28c/28d, world-global-offer-save-stage29, world-live-market-stage29/29c/29d/29e (ui e view), player-transfer-history-stage30, global-football-save-compact-stage30, world-central-navigation-stage28: aprovadas.
- world-central-compat-stage28, caso "28E.3: propostas internacionais continuam usando o mercado real": falha ja existente, sem relacao com esta correcao. O teste procura o texto worldLeagueName(c.leagueId) em app.js, mas o working tree usa leagueName(c.leagueId) na lista de propostas (alteracao anterior nao commitada; o indice ainda tem worldLeagueName). Nao alterado.
- node --check e git diff --check: aprovados.

### Limitacoes
- A frequencia (cerca de 4 propostas/ano nos tres perfis) varia pouco com o GER; o nivel apenas muda quais clubes sao elegiveis.
- Ciclos novos so iniciam com 90 dias de intervalo; propostas recusadas entram em cooldown de 60 dias.
- Propostas fora da janela duram 14-22 dias; se a janela abrir depois do prazo, a proposta expira.

## Stage 31.5 / 31.5.1 - Nacionalidade e escolha do clube inicial

Status: implementacao concluida e integrada ao motor apos a conclusao da Stage 31.4.2.

### Arquivos modificados
- `src/domain/global-football.js`: catalogo canonico, aliases e normalizacao de nacionalidades em portugues brasileiro.
- `src/domain/engine.js`: `D.create()` utiliza a nacionalidade validada do criador, com Brasil como fallback para configuracoes antigas ou invalidas.
- `src/ui/creator.js`: nacionalidade no passo Jogador, catalogo mundial canonico e dois caminhos na etapa Oportunidades.
- `src/domain/creation.js`: propostas mundiais, concorrencia em elencos globais e assinatura por escolha direta.
- `tests/player-nationality-start-stage31.test.cjs`: cobertura direcionada da criacao, persistencia e inicio internacional.

### Decisoes arquiteturais
- O catalogo e derivado do universo mundial, converte aliases em portugues/ingles e codigos para uma identidade unica e exibe nomes em portugues brasileiro.
- A lista bruta tinha 252 rotulos distintos; apos normalizacao ha 162 nacionalidades unicas, ordenadas ignorando acentos e sem codigos internos visiveis.
- `Brasil`/`Brazil`, `Belgica`/`Belgium` e `Belarus`/`BLR`, entre outros, resolvem para a mesma identidade canonica.
- Paises, ligas e clubes sao derivados de `GlobalFootball` e `D.careerClubPool(s)`; IDs repetidos, clubes gerados e inativos sao descartados.
- Propostas priorizam clubes do pais da nacionalidade quando ha opcoes elegiveis e usam as demais ligas como fallback.
- `competitionAt()` resolve elencos embutidos ou `GlobalFootball.playersByClub()`, sem presumir `roster` local.
- A escolha direta nao bloqueia clubes por GER; contrato, concorrencia, expectativa, objetivos e primeira passagem reutilizam `Creation.accept()` e a integracao internacional da Stage 31.4.2.
- A normalizacao e aplicada na criacao e nas consultas, sem reescrever automaticamente personagens existentes.

### Validacao executada
- `node --check`: `global-football.js`, `engine.js`, `creator.js`, `creation.js` e o teste direcionado aprovados.
- `tests/player-nationality-start-stage31.test.cjs`: 8/8 aprovados, incluindo catalogo sem duplicidade, aliases, save/reload, propostas por pais, fallback, escolha livre nacional/internacional, determinismo e avancos de calendario.
- Regressoes direcionadas das Stages 31.4.1, 31.4.2 e do criador 28F.1: 30/30 aprovadas, sem falhas, ignorados ou TODOs.
- Catalogo verificado: 162 entradas, 162 identidades unicas e zero codigos internos expostos.

### Limite conhecido
- Selecoes estrangeiras continuam fora do escopo; o jogador estrangeiro nao e atribuido automaticamente a Selecao Brasileira.

## Stage 31.4.2 - Integracao completa da carreira em todos os campeonatos

### Problema
Com o protagonista em clube de liga internacional (ex.: `gf_real_madrid`), a liga corria em segundo plano (`WorldClubCompetitions`, Poisson) e o heroi nao jogava: sem estatisticas, XP, confianca, relatorio, mensagens, torcida ou reputacao; clube global nao tinha elenco, escalacao nem `attrs`.

### Solucao (mecanismos existentes reutilizados, sem versao simplificada)
- `engine.js`: adaptador de clube jogavel (`buildWorldClub`/`worldMatchClub`) com elenco derivado dos jogadores reais da base (attrs coerentes com o OVR, condicao, moral, lesao, suspensao, escalacao 4-3-3, reservas deterministicas se faltar posicao). So o clube do protagonista e persistido em `s.worldMatchClubs` (heroi religado a `s.person`); adversarios sao reconstruidos so durante a partida. `club()` passa a enxergar o adaptador.
- `world-club-competitions.js`: `daily(s, hooks)` aceita `heroFixture`; a partida do heroi e jogada por `registerMatch` completo (disciplina, escalacao, simulacao, estatisticas, desenvolvimento, moral, confianca, relatorio, inbox, reputacao, torcida, diretoria) e o placar oficial entra na tabela. Um unico resultado por partida; jogos anteriores a entrada do heroi seguem automaticos.
- Fisico diario e financeiro mensal cobrem o elenco internacional; `nextCommitment` expoe o proximo jogo da liga estrangeira; historico da temporada registra a liga internacional (campeao e posicao); `worldMatchClubs` e recriado a cada temporada e descartado em transferencia/fim de contrato.
- `save.js`: partidas marcadas `worldMatch` aceitam clubes globais e rodadas > 38.

### Testes - `tests/career-international-integration-stage31.test.cjs` (12/12)
A oficialidade/tabela; B XP, evolucao, stats e relatorio (mesmas chaves do fluxo brasileiro); C confianca e condicao fisica; D mensagens/noticias sem duplicidade; E reputacao e torcida; F salario e ciclo mensal; G save/reload identico; H determinismo; I efeitos uma vez por partida; J transferencias sucessivas (Madrid -> Bayern -> Brasil); K save antigo reconstruido; L calendario, fim de temporada e historico.

### Regressoes executadas (todas OK)
28b, 28c, 28d, 29, 29c, 29d, 30 (save compacto, historico de transferencias), 31.3.3, 31.3.4, 31.4.1, statistics-stage5, squad, training, matchday, live-match, physical, calendar-stage4, discipline-brazil, life-stage11. Falha ja existente e alheia: `world-central-compat-stage28` 28E.3.

### Pendencias / limites
- `engine.test.cjs` (5 testes longos) e `career.test.cjs` excederam o tempo do ambiente de revisao e devem ser rodados no PowerShell.
- Adversarios nao mantem fadiga/lesoes entre rodadas; so o clube do heroi e persistente. Ligas fora do `WorldClubCompetitions` nao tem partidas do heroi.
- Premiacoes individuais da liga internacional dependem do `Statistics.closeSeason` e nao foram auditadas nesta etapa.

## Stage 31.5.2 - Nacionalidade e propostas iniciais

### Diagnostico
Relato: jogador criado como espanhol saia registrado como Brasil e recebia so clubes brasileiros (Corinthians, Agua Santa, Nautico). Ao iniciar esta Stage a arvore de trabalho ja continha as correcoes do Codex (nao editadas por mim, pois `engine.js`, `creator.js` e `global-football.js` estavam sendo alterados em paralelo):
- `engine.js`: `nationality: GlobalFootball.resolveNationality(config.nationality,"Brasil") || "Brasil"` (padrao Brasil para ausente/invalida; escolha valida nao e sobrescrita).
- `creation.js`: `opportunities()` marca `preferred` por pais da nacionalidade, sorteia primeiro entre clubes do pais e so completa com outros paises quando faltam clubes.
- `creator.js`: `config()` envia `W.cfg.nationality` ao `D.create`; seletor do Codex preservado.

### Arquivos desta Stage
- Criado: `tests/nationality-offers-stage31.test.cjs` (9 testes). Nenhum arquivo de `src/` foi modificado por esta Stage.

### Resultados (9/9)
Espanha, Brasil, Portugal, Inglaterra e Argentina: nacionalidade registrada e 3 propostas, todas do proprio pais (seeds 777 e 11); padrao Brasil sem valor/invalido; fallback internacional (Albania, 0 clubes): 3 propostas de outros paises mantendo a nacionalidade; mesma seed repete; escolha livre de clube (espanhol em clube brasileiro, brasileiro no Real Madrid) mantem nacionalidade; save/reload preserva nacionalidade e propostas, save antigo sem campo segue Brasil; criador envia a nacionalidade; carreira espanhola joga 60 dias com partidas (regressao 31.4.2; testes 31.4.2 A/G/L e B tambem OK).
Propostas espanholas geradas: Villarreal CF (11.100/mes, 730d), Burgos CF (9.300/mes, 730d), RCD Espanyol (8.700/mes, 1095d).

## Stage 31.5.3 - Simulacao inteligente de decisoes

### Comportamento implementado
- `+1 dia` e `Ate o proximo jogo` preservam o fluxo manual anterior.
- `+30 dias` e `Ate o fim da temporada` resolvem decisoes cotidianas, entrevistas e compromissos comerciais pelos handlers existentes.
- A escolha automatica pondera personalidade criada e evoluida, estilo, moral, condicao, fadiga, estresse, familia, reputacao e confianca do treinador. Um desempate estavel derivado da seed preserva determinismo sem consumir o RNG global.
- Transferencias definitivas, emprestimos e renovacoes nunca sao aceitos, recusados ou negociados automaticamente. Propostas oficiais pausam imediatamente; rumores e sondagens nao pausam.
- O plano de simulacao persiste `startDay` e `targetDay`: depois da resposta contratual, repetir o mesmo comando continua apenas os dias restantes. Ofertas adiadas voltam a bloquear perto do vencimento.
- Cada decisao automatica reutiliza `decide`, `Career.respondInterview` ou os handlers de `Commercial`, preservando efeitos, historico, caixa de entrada e protecoes contra duplicidade.

### Arquivos modificados
- `src/domain/engine.js`: bloqueios contratuais, escolha contextual, automacao cotidiana e continuidade de simulacoes longas.
- `src/ui/app.js`: confirmacao do fim de temporada informa corretamente quais decisoes sao automaticas e quais exigem autorizacao.
- `tests/simulation-auto-decisions-stage31.test.cjs`: 12 cenarios direcionados.
- `tests/engine.test.cjs`, `tests/unexpected-events-stage20.test.cjs` e `tests/urgent-decisions-stage16.test.cjs`: expectativas antigas atualizadas para a nova regra autorizada.

### Validacao
- Stage 31.5.3: 12/12 testes aprovados.
- Regressoes de simulacao, decisoes urgentes e eventos inesperados: 7/7 aprovadas.
- Personalidade Stage 22: 33/33 aprovadas.
- Calendario brasileiro e carreira internacional Stage 31.4.2: 5/5 aprovadas.
- Total direcionado: 57/57 testes aprovados, sem falhas, ignorados ou TODOs.

### Limites
- A continuacao exige que o jogador responda ou adie a proposta e acione novamente o mesmo botao de simulacao; o alvo original e recuperado automaticamente.
- Rumores e sondagens seguem apenas informativos ate se transformarem em proposta oficial.

## Stage 31.6 - Padronizacao visual e UX

- Alterado: `src/ui/style.css` (bloco final "Stage 31.6", so CSS). Criado: `tests/visual-system-stage31.test.cjs` (7/7). `app.js`/`creator.js` nao tocados (edicao paralela do Codex).
- Sistema: tokens `--pl-*` (superficies, linhas, ciano/dourado, raios, sombra, foco); hierarquia (titulo de tela, titulo de card com marcador, tag ciano, texto/auxiliar); cards padronizados + variantes `pl-card--primary|secondary|info|action|status|alert`; KPIs (`.stat`, `.metric-row`, `.central-kpis`) uniformes; pills; botoes primario (dourado) > secundario > perigo, foco visivel; navegacao com ativo evidente, contador dourado e subnavegacao ativa em ciano; tabelas/listas/inbox; estados vazios com icone; criador (chips, inputs, formgrid); anti-overflow e breakpoints 1180/900/760/420.
- Regras genericas de elemento usam `:where()` (especificidade zero) para nao sobrescrever componentes existentes.
- Testes: ui direcionados OK (lineup-visual, creator-birthdate-guided, matchday-ui, world-central-navigation, world-live-market-ui, world-competitions-view, target-club-selector, club-browser, story-hub-ui). `ui.test.cjs` falha em "convite pendente na Central" (nao le CSS; ligado a estado/JS, nao verificado se preexistente).
- Limite: sem navegador na sessao, nao houve captura de tela; validacao visual manual pendente.

## Stage 31.7B - Motor de competicoes e avanço ate uma data

### APIs e arquivos
- `src/domain/season-competition-center.js`: consultas somente leitura `catalog`, `overview` e `calendarEvents`, expostas pelo motor como `D.seasonCompetitionCatalog(s)`, `D.seasonCompetitionOverview(s, competitionId)` e `D.seasonCalendarEvents(s, fromDay, toDay, filters)`.
- `src/domain/engine.js`: `D.advanceToDay(s, targetDay, options)` reutiliza `advance(s, 1)`, as auto-decisoes da Stage 31.5.3 e os bloqueios contratuais existentes; o plano pendente persiste em `advanceToDayPlan`.
- `index.html` e `tools/assets.cjs`: registro do modulo de consulta antes de `engine.js`.
- `tests/season-competition-center-stage31.test.cjs`: cobertura direcionada de catalogo, tabelas, calendarios, eliminatorias e avanço por data.

### Cobertura real do catalogo
- Estado inicial verificado: 25 competicoes brasileiras (Series A/B/C/D, Copa do Brasil e 20 estaduais), 34 ligas mundiais e 2 entradas de Selecao com dados existentes (Eliminatorias agendadas e Copa Mundial), total de 61 entradas unicas.
- Ligas mundiais reutilizam exclusivamente `WorldClubCompetitions.standings()`, `results()` e `calendar()`. Tabelas uniformes preservam `J=V+E+D`, `SG=GP-GC` e `P=3V+E`; mata-matas nao recebem tabela ficticia.
- O calendario unifica partidas e eventos pessoais, comerciais, de carreira e mercado ja registrados, deduplica por identidade estavel e nao altera save nem RNG.

### Avanço e limites
- O alvo deve ser inteiro, futuro, no maximo 3.660 dias a frente e dentro do limite absoluto de segurança. O retorno informa `requestedDay`, `reachedDay`, `daysAdvanced`, `completed`, `paused`, `pauseReason` e `pendingTargetDay`.
- Propostas oficiais, emprestimos e renovacoes pausam sem resposta automatica; rumores nao bloqueiam. `simulateMatches:false` ou `stopBeforeNextMatch:true` pausa no dia anterior ao proximo compromisso do personagem.
- A retomada apos resposta e save/reload conserva o alvo e nao repete dias, partidas ou efeitos.

### Validacao
- `node --check`: modulo, motor e teste direcionado aprovados.
- Teste Stage 31.7B: 10 cenarios direcionados, cobrindo Brasil, carreira internacional, save/reload e determinismo.
- Limite real: o catalogo expõe somente competicoes materializadas no estado; entradas sem calendario processado permanecem identificadas como indisponiveis/sem dados, sem criar confrontos ou resultados.

## Stage 31.7C - Integracao final: Temporada e Calendario V2

### Integracao
- A interface (`src/ui/app.js`, `src/ui/style.css`) consome `seasonCompetitionCatalog`, `seasonCompetitionOverview`, `seasonCalendarEvents` e `advanceToDay`. Motor, dominio, calendario mundial e saves nao foram alterados.
- Navegador: catalogo e um array; `region`/`current` nao sao exigidos. Agrupamento (Brasil, Europa, Americas, Selecoes, Demais regioes) derivado de `country`, `type` e do continente da liga mundial; busca, pais e tipo cobrem as 61 competicoes.
- Visao geral: usa `competition.{name,country,season,type,format}`, `currentRound`, `recentResults`, `nextFixtures`, `rounds`, `fixtures` e `standings`.
- Classificacao: `rank, clubName, points, played, wins, draws, losses, goalsFor, goalsAgainst, goalDifference, recentForm` -> #, Clube, PTS, J, V, E, D, GP, GC, SG, Forma. Dado ausente aparece como "—", sem zero artificial e sem zonas de promocao/rebaixamento sem base. Competicoes sem `standings` nao recebem tabela.
- Calendario: eventos reais agregados por dia (jogos do clube em destaque, "N jogos" para o mundo, mercado e eventos), detalhes expansiveis, filtros por categoria. Selecionar data nunca avanca.
- Avancar ate a data: `D.advanceToDay(state, alvo, {simulateMatches:true | stopBeforeNextMatch:true})`; a UI usa `completed`, `reachedDay`, `pendingTargetDay` e `pauseReason` (nao pressupoe `stop.type`). Pausa mostra motivo, dia alcancado e destino pendente; retomar continua apos a decisao (pausa de partida retoma simulando o jogo). Nenhuma segunda simulacao na UI.

### Diferencas de contrato corrigidas
`overview.name/round/results` -> `competition.*`/`currentRound`/`recentResults`; `pos/gf/ga/form` -> `rank/goalsFor/goalsAgainst/recentForm`; `region/current` opcionais; `stop.type` -> `pauseReason`; `completed:false` + `pendingTargetDay`.

### Validacao
- `tests/season-calendar-ui-stage31.test.cjs` reescrito com o dominio REAL (sem stubs de dominio): 61 competicoes navegaveis, busca/filtros, tabelas do Brasileirao e LaLiga com GP/GC/SG conferidos contra o dominio, competicoes sem tabela, visao geral sem `undefined`, calendario agregado, selecao sem avancar, avanco confirmado, pausa contratual real e retomada, carreira internacional (Real Madrid), sem resultados duplicados. 10/10 + `visual-system-stage31` 7/7; `node --check` e `git diff --check` limpos.
- O teste carrega os scripts a partir do `index.html` para refletir o app real.
- Nao executados aqui: `npm test`/`npm run test:ui` completos (rodar no PowerShell).
- Limitacao: a decisao do jogador sobre a proposta e simulada no teste limpando `offers` (o estado do app e privado); a pausa em si vem do motor real. Validacao visual e manual.
