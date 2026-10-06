# Arquitetura e decisões

## Objetivo
Rodar uma primeira versão offline, pequena e auditável no i7-1165G7 / Iris Xe /
12 GB do usuário, sem runtime adicional. Desempenho nessa máquina ainda precisa
ser medido pelo usuário. Não há promessa de FPS; não existe renderização de partidas.

## Camadas
Domain (engine.js) contém Random, criação do mundo, calendário, atletas, clubes,
classificação, treino, envelhecimento, partidas e carreira. Application (game.js)
orquestra comandos: join, advance, train, tactic, lineup, recruit, decide, retire,
license. Infrastructure (save.js) valida JSON, guarda autosave e recupera identidade
do protagonista. UI (app.js/style.css) lê o estado e envia comandos.

Domain não conhece DOM, localStorage, HTTP ou arquivos. Application só depende
de Domain. Infrastructure conhece o schema de dados, não a interface. UI compõe
as três camadas. A UI não deve inventar placares ou alterar regras futebolísticas.

## Agregado World
World contém clubes, calendário, pessoa, RNG, finanças, propostas, eventos,
resultados e histórico. IDs ligam clubes, elenco, escalação e confrontos.
O protagonista é a mesma instância de objeto no perfil e no elenco; a importação
reconstitui essa ligação após validar os dados. Evita evolução divergente.

Valores no schema 1: atributos 0–100, dinheiro em reais inteiros, dia inteiro,
modo player/coach. Perfil visual é separado de atributos. Potencial oculto não
é exibido. Estado serializado inclui RNG, permitindo reprodução determinística.

## Loop
Cada avanço processa no máximo 30 dias sincronamente. Um dia recupera condição e
lesões, processa treino e datas de pagamento, mercado e decisões. Datas de rodadas
executam todos os confrontos da liga; o mundo continua sem clube do protagonista.
Cada ano simulado tem 365 dias. Ao finalizar, registra classificação e campeão,
envelhece pessoas, evolui/regrede atributos e renova atletas veteranos.

## Trade-offs
JSON/localStorage substituem SQLite nesta entrega; facilitam execução sem instalação.
UI HTML/CSS substitui Godot para reduzir tamanho e atrito. O domínio pode ser
portado posteriormente, mas não há código C# ou projeto Godot nesta entrega.
Não há container DI, repository genérico ou CQRS; acrescentariam complexidade sem
benefício ao agregado pequeno. Não é um DDD completo nem uma Clean Architecture
estrita: módulos usam namespaces globais para compatibilidade com file://.

## Segurança e privacidade
Sem servidor, telemetria, contas, links remotos ou downloads dentro do jogo.
Sem eval ou execução de código do save. Dados textuais são escapados para HTML;
cores SVG aceitam somente hexadecimal. Importação limita tamanho a 3 MB e valida
campos usados pelo domínio e UI, IDs, números finitos, enumerações e listas.
Isso reduz riscos de saves corrompidos; não é auditoria profissional de segurança.
O save não é criptografado. Não insira dados pessoais sensíveis nele.
O BAT apenas abre o arquivo HTML local; não apaga, instala ou altera configurações.
Não há anticheat: o usuário é dono do save e pode editá-lo validamente.

## Performance e observabilidade
O universo padrão tem 176 atletas NPC e até um protagonista. A cada rodada há
4 jogos de 94 passos; registros são limitados a 140 partidas e 100 notícias.
Logs de negócio são a caixa de entrada. Erros de comandos e importação aparecem
como avisos acessíveis. Sem logs externos. Testes medem propriedades do motor;
para benchmark no notebook use devtools do navegador. Não medimos RAM nele.

## Evolução
Criar novos módulos de domínio para contratos, base separada, scouting com
incerteza e vida social. Migrar saves de forma versionada; não quebrar saves
silenciosamente. Introduzir testes com seeds fixas antes de mudar probabilidades.
Para crescer a milhares de atletas, mover simulação para Web Worker e adotar
armazenamento transacional. Um wrapper desktop é possível em etapa posterior.

## Atualização de infraestrutura v0.1.1
Prévia local usa servidor Node sem dependências, limitado a 127.0.0.1, com lista
explícita de assets, verificação de host, caminhos reais e SSE para recarga.
Polling de hashes é portátil entre Windows e Linux. Localmente não serve saves,
.git, docs ou arquivos arbitrários. Polling cobre somente arquivos de execução.
Build copia assets permitidos e injeta verificador de versão. Na publicação,
a página consulta version.json no mesmo domínio, sem enviar save ou informações
pessoais. Esta consulta é exceção à execução puramente offline descrita na v0.1.
O índice offline original não carrega esse verificador. Nenhuma lógica da partida
foi modificada. GitHub Actions executa testes e só publica na main; PRs não têm
permissão de deploy. Dados do usuário permanecem no navegador, por origem.

## Atualização 0.3
`world2026.js` é um snapshot factual offline, isolado das regras. `career.js`
contém janelas, bens, extrato, imprensa, promessas e feed. `engine.js` executa
as regras nas datas do calendário. `game.js` valida comandos antes de mutações.
O novo universo tem 40 clubes, 1.280 NPCs e até um protagonista, com 20 partidas
por rodada. Retenção: 800 relatórios, 160 notícias/posts, 120 movimentos e 260
snapshots. Saves antigos são validados e adaptados sem substituir o universo
atual; a migração opcional ocorre na virada. Importação continua limitada a 3 MB.
Dados numéricos, bens permitidos, ligas, datas e vínculos são validados.
A UI não consulta dados esportivos externos nem determina efeitos de compras.
Consulte ATUALIZACAO_0.3.md para as regras e limitações vigentes.

## Atualização 0.4

A expansão foi isolada em módulos de dados (`brazil-data`), competições,
treinamento, estatísticas e vida. `engine.js` continua sendo o orquestrador puro;
`validate-expansion.js` valida os campos opcionais sem mudar o schema externo do
save. `expansion.js` renderiza as telas novas mantendo a interface escura existente.
Consulte `ATUALIZACAO_0.4.md` para cobertura e limites vigentes.

## Career 2.0 — Etapa 5

`domain/national-team.js` centraliza normalização, radar, janelas e partidas da
Seleção. `ui/calendar.js` deriva uma agenda mensal do estado canônico sem criar
um segundo calendário persistido: partidas, tabelas básicas, copas, estadual,
janelas e decisões continuam pertencendo aos seus módulos originais. O mês em
exibição é estado efêmero da interface e não altera o formato do save.

Os estaduais ficam em `competitionSchedule.state` para o campeonato do clube da
carreira e em `competitionSchedule.otherStates` para os demais. Todos usam a
mesma estrutura de grupos, tabela e rodadas eliminatórias. Saves com o formato
estadual anterior são aceitos, migrados na inicialização e preservam a chave da
Copa do Brasil já existente. `statistics.byCompetition` usa os identificadores
da liga, da copa e de cada estadual como fonte única das telas e premiações.
O módulo estatístico também consolida defesas e desarmes e monta um 4-3-3 por
competição, preservando a seleção no histórico ao encerrar a temporada.

`national-team.js` mantém uma agenda internacional persistente por temporada e
protege o intervalo entre D-7 e D+4 de cada Data FIFA. `engine.nextCommitment`
combina clube e Seleção; quando o atleta está convocado, o compromisso mais
próximo é apresentado pelo mesmo fluxo usado no painel inicial. O calendário
deriva eventos futuros e resultados internacionais da agenda persistida.


## Etapa 17 ? Empres?rio, Ag?ncia e Gest?o de Carreira

O m?dulo Career centraliza a representa??o profissional do jogador.

A ag?ncia interfere em negocia??o, objetivos e progress?o, enquanto Life processa comiss?o salarial e Commercial processa receitas e comiss?es comerciais.

A camada Application exp?e os comandos de contrata??o, demiss?o e recusa de representa??o.

Detalhes completos: `docs/ETAPA_17.md`.
