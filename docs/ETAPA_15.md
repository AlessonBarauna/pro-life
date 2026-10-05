# Etapa 15 — Mundo vivo

Módulo único: `src/domain/universe.js` (`ProLifeUniverse`, exposto como `D.World2`). Estado em `s.universe`; nada paralelo aos clubes/elencos/janelas existentes.

- **Idade canônica**: `player.age`, avançada uma vez por virada de temporada (`engine.newSeason` → `rollSeason`). O protagonista continua no fluxo próprio e nunca é alterado/aposentado aqui.
- **Evolução/declínio** (fim de temporada, sem treino diário da IA): jovens fecham parte da distância até o potencial (minutos, nota média, nível do clube); auge estabiliza; veteranos perdem principalmente ritmo/resistência/força (goleiros começam 3,5 anos depois). Potencial é elástico (±), determinístico. Só os 6 atributos principais existem para a IA (o overall continua sendo consequência).
- **Necessidade de elenco**: `squadNeeds(s, club)` — contagem por posição, qualidade dos titulares vs. nível do clube, idade e contratos.
- **Mercado da IA**: `daily` roda no máximo duas passagens por janela (abertura e +21 dias, marcadores em `universe.done`). Livres primeiro (paciência crescente), depois necessidade → shortlist por posição/overall → compatibilidade (prestígio, titularidade, valor, orçamento) → negociação. Um jogador se move no máximo uma vez por janela. A antiga troca aleatória de `Career.world` foi removida.
- **Contratos**: `player.contract {end, salary}` (temporada final). No fim do contrato o clube renova, libera (vira livre) ou o atleta se aposenta.
- **Aposentadoria**: probabilidade logística por idade/posição/papel/declínio/tempo sem clube + motivação determinística; teto duro 42 anos (goleiro 45). Notícia só para estrelas.
- **Novos talentos**: `buildYouth` (IDs `gAAAA_NNNNN`, 16–20 anos, nacionalidade, pé, arquétipo). Tiers: comum > bom > grande > geracional (raríssimo, nunca OVR alto aos 16). Reposição por posição e manutenção do tamanho do plantel; parte vai ao mercado jovem (livres).
- **Prestígio**: `club.structure` muda no máximo ±1 por temporada e fica a ±8 da base.
- **Histórico**: `universe.transfers` (400), `retirements` (400), `free` (≤160), `seasons` (resumo por temporada); `player.history` guarda passagens por clube (inclui parciais em transferência no meio do ano).
- **RNG**: sempre derivado de `universe.seed` + temporada + fase (independente do RNG das partidas). Sem `Math.random()`/`Date.now()`.
- **Saves antigos**: `universe` é criado em memória na primeira necessidade; janelas do ano corrente ficam marcadas como feitas; ninguém envelhece retroativamente; sub-atributos de jogadores da IA são removidos (save ~45% menor).
- **Performance**: `Statistics.init` não normaliza tudo a cada chamada (virada de temporada de ~15 s para <1 s).
- **UI**: seção "Movimentações do mundo" na tela Mercado; notícias via Etapa 8.
- **Script**: `node tools/sim-universe.cjs --seasons 20 --seed 7` (modo `coach` por padrão, rápido; `--mode player` inclui o treino do protagonista). Testes: `tests/universe-stage15.test.cjs`.
- **Pendências**: sem transferências internacionais (só existe a liga brasileira); níveis de liga fixos; sem finanças detalhadas; aposentadoria obrigatória do protagonista fica para outra etapa.
