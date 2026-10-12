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
let shared = null; const mid = () => shared || (shared = make(5, 130));
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
  const s = make(9, 60); const top = WS.leaders(s, { leagueId: LALIGA, stat: "goals", limit: 1 })[0];
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
  while (s.season < 2028) D.advance(s, 1);
  const arch = ws().archive, keys = arch.map((a) => `${a.season}|${a.leagueId}`);
  assert.equal(new Set(keys).size, keys.length, "um registro por temporada e competicao");
  assert.ok(arch.some((a) => a.season === 2026 && a.leagueId === LALIGA) && arch.some((a) => a.season === 2027 && a.leagueId === LALIGA));
  assert.ok(arch.some((a) => a.season === 2026 && a.leagueId === "world"));
  const la = arch.find((a) => a.season === 2026 && a.leagueId === LALIGA); assert.ok(la.champion && !/^gf_/.test(la.champion)); assert.ok(la.awards.every((w) => w.club && !/^gf_/.test(w.club)));
  const n = arch.length; assert.equal(WS.closeSeason(s), 0, "fechar de novo nao duplica"); assert.equal(ws().archive.length, n);
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
