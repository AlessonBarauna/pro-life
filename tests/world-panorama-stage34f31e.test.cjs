"use strict";
// Stage 34F.31E - Panorama mundial: todas as ligas do catalogo FC 27, competicoes do clube atual, status honestos e dados canonicos.
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"); global.ProLife = D; global.ProLifeGlobalFootball = D.GlobalFootball;
global.ProLifeNames = require("../src/domain/display-names.js");
global.ProLifeCareerContext = require("../src/domain/career-context.js");
global.ProLifeNationalIdentity = require("../src/domain/national-identity.js");
global.ProLifeContinental = D.Continental;
const WS = require("../src/domain/world-stats.js"); global.ProLifeWorldStats = WS;
const H = require("../src/ui/competitions-hub-view.js"); global.ProLifeCompetitionsHub = H;
const P = require("../src/ui/world-panorama-view.js");
const W = D.WorldClubCompetitions;
const RM = "gf_fc27_243", BETIS = "gf_fc27_449";
const vis = (h) => h.replace(/<style[\s\S]*?<\/style>/g, "");
const make = (clubId = "c0", fc27 = true) => { const s = D.create(fc27 ? { mode: "player", clubId: "c0", catalogVersion: "fc27_v1" } : { mode: "player", clubId }, 5); s.clubId = clubId; W.init(s); return s; };
const cityId = (s) => s.globalFootball.clubs.find((c) => /^Manchester City$/.test(c.name)).id;
const ctxLeague = (s) => global.ProLifeCareerContext.resolve(s, D).league.name;
const section = (id) => { H.setSection(id); H.back(); H.setFilter("continent", "ALL"); H.setFilter("query", ""); };
const play = (s, days) => { for (let d = s.day + 1; d <= days; d++) { s.day = d; W.daily(s, { heroFixture: () => null }); } };

test("34F.31E (1)(2)(3)(4) competicao principal do clube atual: Real Madrid, Betis, Manchester City e clube brasileiro", () => {
  for (const [id, re] of [[RM, /laliga|la liga/i], [BETIS, /laliga|la liga/i], [cityId(make(RM)), /premier/i]]) {
    const s = make(id); const n = ctxLeague(s); assert.match(n, re, id);
    section("minhas"); const h = vis(P.render(s, D)); assert.ok(h.indexOf("MINHAS COMPETIÇÕES") >= 0 && h.indexOf(n) >= 0, "liga em Minhas competicoes");
    assert.ok(h.indexOf(n) < h.indexOf("COMPETIÇÕES CONTINENTAIS") || !h.includes("COMPETIÇÕES CONTINENTAIS"), "liga vem antes das demais");
  }
  const b = make("c0", false); const lg = b.leagues.find((l) => l.id === b.clubs.find((c) => c.id === "c0").leagueId);
  section("minhas"); assert.ok(vis(P.render(b, D)).includes(lg.name), lg.name);
});

test("34F.31E (5)(6) as 49 ligas FC 27 estao no catalogo navegavel com status correto", () => {
  const s = make(RM); const cat = H.catalog(s, D), fc = cat.filter((c) => c.world);
  assert.equal(fc.length, 49); assert.equal(new Set(cat.map((c) => c.id)).size, cat.length, "ids unicos");
  const cov = W.coverage(s); assert.equal(cov.length, 49);
  for (const c of fc) { const src = cov.find((x) => x.leagueId === c.id); assert.ok(src, c.id); assert.equal(c.name, src.name); }
  for (const c of fc) {
    if (src(s, c).status === "catalog_only") assert.ok(c.status === "catalog_only" || (c.status === "catalog_info" && c.country === "Brasil"), c.name + " nunca vira jogavel");
    else assert.notEqual(c.status, "catalog_only", c.name);
  }
  // todas aparecem em alguma lista (ligas, continentais ou informacao do catalogo) sem filtro
  section("ligas"); const ligas = vis(H.render(s, D)); section("continentais"); const cont = vis(H.render(s, D));
  const esc = (v) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  for (const c of fc) assert.ok(ligas.includes(esc(c.name)) || cont.includes(esc(c.name)), "ausente na interface: " + c.name);
  const only = fc.filter((c) => c.status === "catalog_only" || c.status === "catalog_info"); assert.ok(only.length >= 1);
  section("ligas"); const h = vis(H.render(s, D)); assert.ok(/Somente catálogo · ainda sem integração de calendário/.test(h));
  for (const c of only) assert.ok(!new RegExp(`data-ch-open="${c.id}"`).test(h), "sem botao Abrir para " + c.name);
  assert.ok(only.every((c) => !(s.globalFootball.worldCompetitions && s.globalFootball.worldCompetitions.leagues || {})[c.id]), "nenhuma liga so-catalogo tem resultados");
});
const src = (s, c) => W.coverage(s).find((x) => x.leagueId === c.id);

test("34F.31E (7) nenhuma competicao brasileira duplicada por alias", () => {
  const s = make(RM); const cat = H.catalog(s, D);
  const br = cat.filter((c) => c.country === "Brasil"); const names = br.map((c) => c.name);
  assert.equal(new Set(names).size, names.length); assert.ok(br.filter((c) => c.status === "playable" && c.brazil).length >= 4);
  const info = br.filter((c) => c.world); for (const c of info) assert.equal(c.status, "catalog_info");
  section("ligas"); const h = vis(H.render(s, D)); for (const c of info) assert.ok(!new RegExp(`data-ch-open="${c.id}"`).test(h));
});

test("34F.31E (8) temporadas: ano civil x temporada PRO-LIFE x ultima encerrada, sem 2029/30 inventado", () => {
  const s = make(RM); s.season = 2030; s.day = 1696; s.statistics = { seasons: [{ season: 2029, player: { club: "x" } }, { season: 2028 }], players: {}, awards: [] };
  const i = P.seasonInfo(s); assert.equal(i.civilYear, 2030); assert.equal(i.seasonId, 2030); assert.equal(i.lastClosed, 2029); assert.equal(i.date, "24/08/2030");
  assert.ok(/não divide as ligas europeias em 2029\/30/.test(i.note));
  const h = vis(P.render(s, D)); assert.ok(h.includes("Última encerrada") && h.includes("2029") && /última temporada encerrada/.test(h));
  assert.ok(!/\b2029\/30\b/.test(h.replace(/não divide as ligas europeias em 2029\/30/g, "")));
});

test("34F.31E (9)(10) rankings por campeonato nao se misturam e vem de partidas realmente simuladas", () => {
  const s = make(RM); const lc = H.catalog(s, D).filter((c) => c.world && c.status === "playable").slice(0, 6);
  for (const c of lc) assert.equal(WS.leaders(s, { leagueId: c.id, stat: "goals", limit: 5 }).length, 0, "sem jogos, sem artilheiros: " + c.name);
  play(s, 120);
  const clubsOf = (id) => new Set(W.standings(s, id).map((r) => r.id)); const seen = new Map();
  for (const c of lc) {
    const L = WS.leaders(s, { leagueId: c.id, stat: "goals", limit: 20 }); assert.ok(L.length > 0, c.name);
    const cl = clubsOf(c.id); const rows = W.standings(s, c.id);
    for (const p of L) { assert.ok(cl.has(p.clubId), c.name + ": " + p.name); assert.ok(!seen.has(p.id) || seen.get(p.id) === c.id, "jogador em duas ligas"); seen.set(p.id, c.id); }
    for (const id of cl) { const gf = (rows.find((r) => r.id === id).stats || rows.find((r) => r.id === id)).gf || 0; const sum = L.filter((p) => p.clubId === id).reduce((n, p) => n + p.goals, 0); assert.ok(sum <= gf, `${c.name}: gols individuais (${sum}) <= gols do clube (${gf})`); }
  }
});

test("34F.31E (11) transferencia atualiza as competicoes atuais e preserva o historico arquivado", () => {
  const s = make(RM); s.statistics = { seasons: [{ season: 2029, player: { club: "Real Madrid" }, panorama: [{ id: "x", name: "LaLiga" }] }], players: {}, awards: [] };
  const before = JSON.stringify(s.statistics.seasons); section("minhas");
  assert.match(ctxLeague(s), /laliga|la liga/i);
  D.movePlayerToClub(s, cityId(s)); assert.match(ctxLeague(s), /premier/i);
  const h = vis(P.render(s, D)); assert.ok(/Premier/i.test(h)); assert.equal(JSON.stringify(s.statistics.seasons), before);
});

test("34F.31E (12) save/load preserva a central (mesmo catalogo e mesmo HTML)", () => {
  const s = make(RM); play(s, 60); section("ligas"); const a = vis(P.render(s, D));
  const t = JSON.parse(JSON.stringify(s)); section("ligas"); assert.equal(vis(P.render(t, D)), a);
});

test("34F.31E (13) abrir a tela e rapido e nao renderiza tabelas de todas as competicoes", () => {
  const s = make(RM); play(s, 80);
  for (const sec of ["minhas", "ligas", "copas", "continentais", "historico"]) {
    section(sec); const t0 = Date.now(); const h = P.render(s, D); const ms = Date.now() - t0;
    assert.ok(ms < 2500, `${sec} ${ms}ms`); assert.ok(!/<table[\s\S]*<table[\s\S]*<table[\s\S]*<table/.test(vis(h)), sec + ": no maximo poucas tabelas");
  }
  section("ligas"); assert.ok(vis(P.render(s, D)).length < 400000);
});

test("34F.31E (14) carreira legada (sem catalogo FC 27) e busca por nome funcionam", () => {
  const b = make("c0", false); delete b.globalFootball; section("minhas"); assert.doesNotThrow(() => P.render(b, D));
  const s = make(RM); H.setSection("ligas"); H.back(); H.setFilter("query", "premier"); let h = vis(H.render(s, D));
  assert.ok(/Premier/i.test(h) && !/LaLiga/i.test(h.replace(/<option[\s\S]*?<\/option>/g, ""))); H.setFilter("query", "");
});
