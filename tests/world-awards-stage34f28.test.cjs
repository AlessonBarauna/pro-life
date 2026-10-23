"use strict";
// Stage 34F.28 - estatisticas, rankings e premiacoes das ligas mundiais FC 27 + Central mundial.
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"); global.ProLife = D;
global.ProLifeNames = require("../src/domain/display-names.js"); global.ProLifeWorldStats = D.WorldStats;
global.ProLifeStatistics = D.Statistics; global.ProLifeCompetitions = D.Competitions;
const WS = D.WorldStats, V = require("../src/ui/world-awards-view.js");
const LALIGA = "gf_fc27_laliga_ea_sports", PREMIER = "gf_fc27_premier_league";
const BAD = /null|undefined|NaN|registro\(s\)|gf_fc27|\[object/;
const visible = (html) => html.replace(/<style>[\s\S]*?<\/style>/g, "").replace(/value="[^"]*"/g, "");
const make = (seed = 5, days = 0) => { const s = D.create({ mode: "player", clubId: "c0", catalogVersion: "fc27_v1" }, seed); for (let i = 0; i < days; i++) D.advance(s, 1); return s; };
// As ligas europeias FC27 seguem o calendário real e começam em julho/agosto.
// Dia 300 garante partidas registradas sem fabricar rodadas antes da data.
let shared = null; const mid = () => shared || (shared = make(5, 300));
const goalsOfScores = (s, id) => (s.globalFootball.worldCompetitions.leagues[id].scores || []).reduce((n, x) => n + x[2] + x[3], 0);
const totals = (s, id) => { const L = s.globalFootball.worldStats.leagues[id]; let g = 0, a = 0, apps = 0; for (let i = 0; i < L.ids.length; i++) { g += L.v[i * 9 + 1]; a += L.v[i * 9 + 2]; apps += L.v[i * 9]; } return { g, a, apps, matches: L.n }; };

test("34F.28 (1) LaLiga: ranking com atletas do catalogo e totais iguais aos gols dos placares", () => {
  const s = mid(); const t = totals(s, LALIGA);
  assert.equal(t.g, goalsOfScores(s, LALIGA), "gols individuais = gols dos placares (sem dupla contagem)");
  assert.ok(t.a <= t.g && t.a > 0); assert.ok(t.apps <= t.matches * 22 && t.apps >= t.matches * 20, `${t.apps} vs ${t.matches * 22}`);
  const top = WS.leaders(s, { leagueId: LALIGA, stat: "goals", limit: 5 });
  assert.equal(top.length, 5); assert.ok(top.every((r) => String(r.id).startsWith("fc27_p_") && r.club && !/^gf_/.test(r.club)));
  assert.ok(top[0].goals >= top[4].goals);
});

test("34F.28 (2) Premier League e todas as ligas simuladas entram sem lista fixa", () => {
  const s = mid(), comps = WS.competitions(s);
  assert.ok(comps.some((c) => c.id === PREMIER) && comps.length >= 30);
  for (const c of comps) assert.equal(totals(s, c.id).g, goalsOfScores(s, c.id), c.id);
  assert.ok(WS.leaders(s, { leagueId: PREMIER, stat: "assists", limit: 3 }).length === 3);
});

test("34F.28 (3) rankings brasileiros preservados (Statistics e tela)", () => {
  const s = mid(); const r = D.Statistics.rankingDashboard(s, "serieA", 10);
  assert.ok(r && Array.isArray(r.goals)); V.setTab("competicoes"); V.setLeague("serieA");
  const html = V.render(s, D); assert.ok(html.includes("ARTILHARIA")); assert.ok(!BAD.test(visible(html)));
});

test("34F.28 (4) premiacao mundial considera varias competicoes", () => {
  const s = mid(), w = WS.worldAwards(s), cats = w.awards.map((a) => a.cat);
  for (const c of ["melhorMundo", "jovemMundo", "goleiroMundo", "artilheiroMundo", "assistenciasMundo"]) assert.ok(cats.includes(c), c);
  const topScorer = WS.leaders(s, { stat: "goals", limit: 1 })[0];
  assert.equal(w.awards.find((a) => a.cat === "artilheiroMundo").value, topScorer.goals);
  const star = w.awards.find((a) => a.cat === "melhorMundo"); assert.ok(star.leagueId && star.value >= 5.5 && star.value <= 10);
  assert.ok(w.awards.find((a) => a.cat === "jovemMundo").playerId); const y = WS.youngLeaders(s, 20); assert.ok(y.every((r) => r.age <= 21));
  assert.equal(w.awards.find((a) => a.cat === "goleiroMundo").pos, "GOL");
});

test("34F.28 (5) jogador transferido entre clubes e ligas acumula nas duas ligas e mantem o clube da epoca", () => {
  const s = make(9, 300); const top = WS.leaders(s, { leagueId: LALIGA, stat: "goals", limit: 1 })[0];
  const p = s.internationalPlayers.find((x) => x.id === top.id), oldClub = p.clubId;
  // O destino precisa ser um clube onde o atleta realmente entra no time titular (menos concorrentes mais fortes na posicao);
  // transferir um 75 para um elenco de 91/86/85 na mesma posicao e um cenario em que ele corretamente nao joga.
  const stronger = (c) => s.internationalPlayers.filter((x) => x.clubId === c.id && x.pos === p.pos && (x.ovr ?? x.overall) > (p.ovr ?? p.overall)).length;
  const pl = s.globalFootball.clubs.filter((c) => c.leagueId === PREMIER && c.id !== oldClub).sort((a, b) => stronger(a) - stronger(b) || (a.id < b.id ? -1 : 1))[0];
  assert.ok(stronger(pl) <= 1, "cenario valido: o atleta e titular provavel no destino"); p.clubId = pl.id; p.leagueId = PREMIER;
  for (let i = 0; i < 60; i++) D.advance(s, 1);
  const inLa = WS.rowsOf(s, LALIGA).find((r) => r.id === top.id), inPl = WS.rowsOf(s, PREMIER).find((r) => r.id === top.id);
  assert.ok(inLa && inLa.apps >= top.apps && inPl && inPl.apps > 0, "estatisticas nas duas ligas");
  assert.equal(inLa.clubId, oldClub, "na LaLiga permanece o clube da epoca"); assert.equal(inPl.clubId, pl.id);
  // sem duplicacao: gols individuais = gols dos placares em ambas as ligas
  assert.equal(totals(s, LALIGA).g, goalsOfScores(s, LALIGA)); assert.equal(totals(s, PREMIER).g, goalsOfScores(s, PREMIER));
});

test("34F.28 (6) criterios minimos: 1 jogo perfeito nao vence craque, revelacao ou melhor jogador do mundo", () => {
  const s = mid(), ws = s.globalFootball.worldStats, L = ws.leagues[LALIGA], min = WS.minApps(s, LALIGA);
  assert.ok(min >= 2);
  const pick = WS.leaders(s, { leagueId: LALIGA, stat: "rating", limit: 12 }).find((r) => r.age <= 21) || WS.leaders(s, { leagueId: LALIGA, stat: "rating", limit: 1 })[0];
  const o = L.ids.indexOf(pick.id.slice(7)) * 9, saved = L.v.slice(o, o + 9);
  L.v[o] = 1; L.v[o + 1] = 3; L.v[o + 3] = 100; ws.matches++; // 1 jogo, nota 10
  const a = WS.leagueAwards(s, LALIGA), w = WS.worldAwards(s);
  for (const cat of ["craque", "revelacao"]) assert.ok(!a.awards.some((x) => x.cat === cat && x.playerId === pick.id), cat);
  assert.ok(!w.awards.some((x) => ["melhorMundo", "jovemMundo"].includes(x.cat) && x.playerId === pick.id));
  for (let k = 0; k < 9; k++) L.v[o + k] = saved[k]; ws.matches++;
  const rev = WS.leagueAwards(s, LALIGA).awards.find((x) => x.cat === "revelacao");
  if (rev) assert.ok(s.season - s.internationalPlayers.find((p) => p.id === rev.playerId).birthYear <= 21);
});

test("34F.28 (7) melhor goleiro e treinador so com dados suficientes", () => {
  const s = mid(), a = WS.leagueAwards(s, LALIGA);
  const gk = a.awards.find((x) => x.cat === "goleiro"); assert.ok(gk && gk.pos === "GOL" && gk.value > 0);
  const co = a.awards.find((x) => x.cat === "treinador"); assert.ok(co && co.value > 0 && co.name.split(" ").length >= 2);
  const saved = s.globalFootball.intel; s.globalFootball.intel = null;
  const b = WS.leagueAwards(s, LALIGA); assert.ok(!b.awards.some((x) => x.cat === "treinador")); assert.ok(b.insufficient.some((x) => x.cat === "treinador"));
  s.globalFootball.intel = saved;
  const fresh = make(3, 3); assert.equal(WS.leagueAwards(fresh, LALIGA).awards.length, 0, "inicio de temporada: sem vencedores inventados");
});

test("34F.28 (8) selecao da temporada 4-3-3 sem jogadores repetidos", () => {
  const s = mid(); for (const id of [LALIGA, PREMIER]) {
    const { xi } = WS.leagueAwards(s, id), ids = xi.map((x) => x.playerId);
    assert.equal(new Set(ids).size, ids.length); const c = (p) => xi.filter((x) => x.pos === p).length;
    assert.ok(c("GOL") <= 1 && c("DEF") <= 4 && c("MEI") <= 3 && c("ATA") <= 3); assert.equal(xi.length, 11, id);
  }
});

test("34F.28 (9) duas temporadas: historico, idempotencia e persistencia do arquivo", () => {
  const s = make(11); const ws = () => s.globalFootball.worldStats;
  let guard=0;while(!(WS.history(s,{leagueId:LALIGA,season:2026}).length&&WS.history(s,{leagueId:LALIGA,season:2027}).length)&&guard++<1100)D.advance(s,1);
  assert.ok(guard<1100,"duas edições europeias encerraram nas datas do calendário");
  const arch = ws().archive, keys = arch.map((a) => `${a.season}|${a.leagueId}`);
  assert.equal(new Set(keys).size, keys.length, "um registro por temporada e competicao");
  assert.ok(arch.some((a) => a.season === 2026 && a.leagueId === LALIGA) && arch.some((a) => a.season === 2027 && a.leagueId === LALIGA));
  assert.ok(arch.some((a) => a.season === 2026 && a.leagueId === "world"));
  const la = arch.find((a) => a.season === 2026 && a.leagueId === LALIGA); assert.ok(la.champion && !/^gf_/.test(la.champion)); assert.ok(la.awards.every((w) => w.club && !/^gf_/.test(w.club)));
  const n = arch.length; assert.equal(WS.closeLeague(s,LALIGA,2026,la.championId), 0, "fechar de novo nao duplica"); assert.equal(ws().archive.length, n);
  const back = JSON.parse(JSON.stringify(ws())); assert.equal(back.archive.length, n); assert.equal(JSON.stringify(back.archive[0]), JSON.stringify(arch[0]));
  const frozen = JSON.stringify(la);
  const p = s.internationalPlayers.find((x) => x.id === la.awards[0].playerId); if (p) p.clubId = s.globalFootball.clubs[0].id;
  assert.equal(JSON.stringify(WS.history(s, { leagueId: LALIGA, season: 2026 })[0]), frozen, "transferencia nao reescreve premio antigo");
});

test("34F.28 (10) carreira antiga sem worldStats abre e classico mostra aviso", () => {
  const s = make(5, 2); delete s.globalFootball.worldStats; assert.ok(WS.init(s) && WS.init(s).archive.length === 0);
  V.setTab("geral"); assert.ok(!BAD.test(visible(V.render(s, D))));
  const classic = D.create({ mode: "player", clubId: "c0" }, 5); V.setTab("mundo"); const h = V.render(classic, D); assert.ok(h.includes("Nenhuma liga mundial")); assert.ok(!BAD.test(visible(h)));
  const coach = D.create({ mode: "coach", clubId: "c0" }, 5); V.setTab("geral"); assert.ok(V.render(coach, D).includes("Central mundial"));
});

test("34F.28 (11) interface: unidades corretas, sem null/ID interno, formatacao em portugues", () => {
  const s = mid();
  assert.equal(WS.format("gols", 15), "15 gols"); assert.equal(WS.format("gols", 1), "1 gol"); assert.equal(WS.format("assistencias", 10), "10 assistências");
  assert.equal(WS.format("nota", 7.47), "Nota 7,47"); assert.equal(WS.format("jogos", 28), "28 jogos"); assert.equal(WS.format("defesas", 80), "80 defesas");
  assert.equal(WS.format("motm", 6), "6 prêmios de melhor em campo"); assert.equal(WS.format("gols", null), "Dados insuficientes"); assert.equal(WS.format("nota", NaN), "Dados insuficientes");
  assert.equal(WS.formatByName("Artilheiro", 15), "15 gols"); assert.equal(WS.formatByName("Craque da competição", 7.47), "Nota 7,47");
  for (const tab of ["geral", "competicoes", "mundo", "carreira"]) { V.setTab(tab); const h = V.render(s, D); assert.ok(!BAD.test(visible(h)), tab + ": " + (visible(h).match(/.{25}(null|undefined|NaN|registro\(s\)|gf_fc27).{15}/) || [""])[0]); }
  V.setTab("competicoes"); V.setLeague(LALIGA); const la = V.render(s, D); assert.ok(/\d+ gols?/.test(la)); assert.ok(/Nota \d,\d\d/.test(la));
});

test("34F.28 (12) desempenho: renderizacao com o catalogo completo e cache de linhas", () => {
  const s = mid(); V.setTab("mundo"); V.render(s, D);
  const t0 = process.hrtime.bigint(); for (const tab of ["geral", "competicoes", "mundo", "carreira"]) { V.setTab(tab); V.render(s, D); }
  const ms = Number(process.hrtime.bigint() - t0) / 1e6; assert.ok(ms < 1500, `${ms}ms`);
  const t1 = process.hrtime.bigint(); for (let i = 0; i < 30; i++) WS.leaders(s, { leagueId: LALIGA, stat: "goals" }); assert.ok(Number(process.hrtime.bigint() - t1) / 1e6 < 300);
  assert.ok(JSON.stringify(s.globalFootball.worldStats).length < 2.5e6, "acumuladores compactos");
});

test("34F.28 (13) visual: premiacoes e rankings exibem retratos, escudos e fallback", () => {
  const previous = {
    stats: global.ProLifeWorldStats,
    cards: global.ProLifePlayerCard,
    crests: global.ProLifeClubCrests,
  };
  const row = { id: "p1", playerId: "p1", clubId: "club1", name: "Atleta Teste", club: "Newell's", pos: "ATA", age: 20, apps: 4, goals: 6, assists: 3, avg: 7.8, saves: 0 };
  try {
    global.ProLifePlayerCard = { portrait: () => "data:image/svg+xml,portrait" };
    global.ProLifeClubCrests = { inline: () => '<img class="pl-club-crest" src="src/assets/club-crests/test.png" alt="Escudo: Newell&#39;s">' };
    global.ProLifeWorldStats = {
      format: (unit, value) => `${unit}:${value}`,
      competitions: () => [{ id: "league1", name: "Liga Teste" }],
      worldAwards: () => ({ awards: [{ ...row, cat: "melhorMundo", label: "Melhor jogador", unit: "nota", value: 7.8 }], insufficient: [] }),
      leaders: () => [row], youngLeaders: () => [row], keepersTop: () => [], coachesTop: () => [],
    };
    const state = { season: 2027, clubs: [], internationalPlayers: [row], globalFootball: { clubs: [{ id: "club1", name: "Newell's" }] } };
    V.setTab("mundo");
    const html = V.render(state, D);
    assert.match(html, /class="wa-face wa-face-(?:lg|sm)"/);
    assert.match(html, /data:image\/svg\+xml,portrait/);
    assert.match(html, /class="wa-crest has-image"/);
    assert.match(html, /src="src\/assets\/club-crests\/test\.png"/);
    assert.doesNotMatch(html, /<img[^>]+src=""/);

    global.ProLifeClubCrests = { inline: () => '<span class="pl-club-crest">NT</span>' };
    const fallback = V.render(state, D);
    assert.match(fallback, /class="wa-crest" aria-label="Clube Newell&#39;s">N</);
  } finally {
    global.ProLifeWorldStats = previous.stats;
    global.ProLifePlayerCard = previous.cards;
    global.ProLifeClubCrests = previous.crests;
  }
});

test("34F.28 (14) escudo: nomes com apostrofo permanecem acessiveis", () => {
  const oldData = global.ProLifeCrestData;
  global.ProLifeCrestData = [{ id: "club_apostrophe", name: "Newell's", verified: false }];
  const modulePath = require.resolve("../src/ui/club-crests.js");
  delete require.cache[modulePath];
  try {
    const html = require(modulePath).render("club_apostrophe", { size: "sm" });
    assert.match(html, /Newell&#39;s/);
    assert.doesNotMatch(html, /undefined/);
  } finally {
    global.ProLifeCrestData = oldData;
    delete require.cache[modulePath];
  }
});

test("34F.28 (15) ranking global soma os registros do jogador em todas as competicoes sem alterar cada torneio", () => {
  const s = make(17), ws = WS.init(s), [player, rival] = s.internationalPlayers;
  const sid = (p) => String(p.id).replace(/^fc27_p_/, ""), club = (p) => {
    const value = Number(String(p.clubId).replace("gf_fc27_", ""));
    return Number.isFinite(value) ? value : -1;
  };
  ws.leagues[LALIGA] = { ids: [sid(player), sid(rival)], v: [6, 4, 2, 438, 0, 0, 1, 540, club(player), 6, 9, 1, 420, 0, 0, 1, 540, club(rival)], n: 6, r: 2, pr: 0 };
  ws.leagues[PREMIER] = { ids: [sid(player)], v: [4, 7, 3, 302, 0, 0, 1, 360, club(player)], n: 4, r: 1, pr: 0 };
  ws.matches = 10;

  const perLeague = WS.rowsOf(s, LALIGA).find((r) => r.id === player.id);
  const global = WS.leaders(s, { stat: "goals", limit: 99999 }).find((r) => r.id === player.id);
  assert.equal(perLeague.goals, 4, "ranking da liga continua isolado");
  assert.equal(global.goals, 11, "gols globais consolidados");
  assert.equal(global.apps, 10, "jogos globais consolidados");
  assert.equal(global.assists, 5, "assistencias globais consolidadas");
  assert.equal(global.competitionCount, 2);
  const award = WS.worldAwards(s).awards.find((a) => a.cat === "artilheiroMundo");
  const top = WS.leaders(s, { stat: "goals", limit: 1 })[0];
  assert.equal(top.id, player.id, "a soma supera o maior total isolado");
  assert.equal(award.value, top.goals, "premio usa o mesmo total global consolidado");
  const loaded = JSON.parse(JSON.stringify(s));
  const afterLoad = WS.leaders(loaded, { stat: "goals", limit: 99999 }).find((r) => r.id === player.id);
  assert.equal(afterLoad.goals, 11, "save/reload nao duplica a consolidacao");
  V.setTab("mundo");
  assert.match(V.render(s, D), /Total consolidado por jogador em todas as competições registradas/);
});

test("34F.28 (16) artilheiro do Brasileirao entra no ranking global sem duplicar outra fonte", () => {
  const s = make(23), club = s.clubs[0];
  const lamine = { id: "br_lamine_global", name: "Lamine Yamal", pos: "ATA", age: 21, overall: 91 };
  club.roster.push(lamine);
  D.Statistics.init(s).root.players[lamine.id] = {
    appearances: 30, goals: 26, assists: 8, ratingTotal: 231, cleanSheets: 0, saves: 0, motm: 7,
    byCompetition: { serieA: { appearances: 30, goals: 26, assists: 8, ratingTotal: 231, cleanSheets: 0, saves: 0, motm: 7 } },
    byClub: {},
  };
  const row = WS.leaders(s, { stat: "goals", limit: 99999 }).find((r) => r.id === lamine.id);
  assert.ok(row, "artilheiro brasileiro aparece na lista mundial");
  assert.equal(row.goals, 26); assert.equal(row.apps, 30); assert.equal(row.assists, 8);
  assert.deepEqual(row.competitionIds, ["serieA"]); assert.equal(row.clubId, club.id);
  assert.ok(WS.youngLeaders(s, 20).some((r) => r.id === lamine.id), "jovem brasileiro entra nos destaques globais");
  assert.equal(WS.worldAwards(s).awards.find((a) => a.cat === "melhorMundo").playerId, lamine.id, "premio mundial usa a consolidacao brasileira");
  const loaded = JSON.parse(JSON.stringify(s));
  assert.equal(WS.leaders(loaded, { stat: "goals", limit: 99999 }).find((r) => r.id === lamine.id).goals, 26);
});

test("34F.28 (17) goleiros e tecnicos brasileiros usam numeros de todas as competicoes", () => {
  const s = make(29), club = s.clubs[0];s.mode = "coach";s.clubId = club.id;s.person.name = "Treinador Global";
  const keeper = { id: "br_keeper_global", name: "Goleiro Global", pos: "GOL", age: 27, overall: 82 };club.roster.push(keeper);
  D.Statistics.init(s).root.players[keeper.id] = { appearances: 18, goals: 0, assists: 0, ratingTotal: 133.2, cleanSheets: 8, saves: 74, motm: 3,
    byCompetition: { serieA: { appearances: 12, ratingTotal: 88.8, cleanSheets: 5, saves: 48, motm: 2 }, copaBrasil: { appearances: 6, ratingTotal: 44.4, cleanSheets: 3, saves: 26, motm: 1 } }, byClub: {} };
  for(const c of s.clubs)c.stats.points=0;
  const rival=s.clubs.find(c=>c.id!==club.id);s.matches=[
    {season:s.season,date:1,competitionId:"serieA",home:club.id,away:rival.id,hg:2,ag:0},
    {season:s.season,date:2,competitionId:"copaBrasil",home:rival.id,away:club.id,hg:1,ag:1},
    {season:s.season,date:3,competitionId:"lib",home:club.id,away:rival.id,hg:0,ag:1},
  ];
  const gk=WS.keepersTop(s,50).find((r)=>r.id===keeper.id);assert.ok(gk);assert.equal(gk.apps,18);assert.equal(gk.saves,74);assert.equal(gk.competitionCount,2);
  const coach=WS.coachesTop(s,50).find((c)=>c.clubId===club.id);assert.ok(coach);assert.equal(coach.name,"Treinador Global");assert.equal(coach.competitionCount,3);
  assert.deepEqual({games:coach.games,wins:coach.wins,draws:coach.draws,losses:coach.losses,points:coach.points,value:coach.value},{games:3,wins:1,draws:1,losses:1,points:4,value:4});
  const worldCoach=WS.worldAwards(s).awards.find((a)=>a.cat==="treinadorMundo");assert.ok(worldCoach?.clubId);assert.equal(worldCoach.unit,"pontos");assert.ok(worldCoach.competitionCount>=1);
});
