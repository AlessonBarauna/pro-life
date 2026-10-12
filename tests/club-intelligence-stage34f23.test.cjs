"use strict";
// Stage 34F.23 - inteligencia dos clubes do mundo FC 27: tecnicos, objetivos, pressao da diretoria, demissoes, orcamento.
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"); global.ProLife = D;
global.localStorage = { m: new Map(), getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }, setItem(k, v) { this.m.set(k, String(v)); }, removeItem(k) { this.m.delete(k); } };
global.ProLifeCompactSave = require("../src/infrastructure/compact-save.js");
const Save = require("../src/infrastructure/save.js");
const CI = D.ClubIntelligence, W = D.WorldClubCompetitions, G = D.GlobalFootball;
const fc27 = (seed = 5151) => { const s = D.create({ mode: "coach", clubId: "c0", catalogVersion: "fc27_v1" }, seed); CI.init(s); return s; };
const clubs = (s) => s.globalFootball.clubs.filter((c) => c.fc27 && c.active !== false);

test("34F.23 (1) todo clube FC 27 recebe tecnico com estilo, nota e meta; resultado deterministico; mundo legado intocado", () => {
  const a = fc27(), b = fc27();
  const i = a.globalFootball.intel;
  for (const c of clubs(a)) {
    const coach = i.coaches[c.id], meta = i.clubs[c.id];
    assert.ok(coach && coach.name.split(" ").length >= 2, c.id);
    assert.ok(CI.STYLES[coach.style] && coach.rating >= 38 && coach.rating <= 92);
    assert.ok(CI.OBJECTIVES[meta.objective] && meta.board >= 55 && meta.board <= 70);
    assert.equal(c.coachStyle, coach.style);
  }
  assert.equal(JSON.stringify(a.globalFootball.intel.coaches), JSON.stringify(b.globalFootball.intel.coaches));
  assert.ok(new Set(Object.values(i.coaches).map((c) => c.style)).size >= 5, "estilos variados");
  const legacy = D.create({ mode: "coach", clubId: "c0" }, 9);
  assert.equal(CI.init(legacy), null); assert.equal(legacy.globalFootball?.intel, undefined);
});

test("34F.23 (2) metas seguem a forca na liga: favoritos brigam pelo titulo, os mais fracos pela permanencia", () => {
  const s = fc27(), i = s.globalFootball.intel, byLeague = new Map();
  for (const c of clubs(s)) { if (!byLeague.has(c.leagueId)) byLeague.set(c.leagueId, []); byLeague.get(c.leagueId).push(c); }
  let checked = 0;
  for (const list of byLeague.values()) {
    if (list.length < 10) continue;
    list.sort((x, y) => i.clubs[x.id].expectedRank - i.clubs[y.id].expectedRank);
    assert.equal(i.clubs[list[0].id].objective, "titulo");
    assert.equal(i.clubs[list.at(-1).id].objective, "permanencia");
    checked++;
  }
  assert.ok(checked >= 20);
});

test("34F.23 (3) bonus do tecnico e estilo entram na forca/gols da simulacao; sem tecnico nada muda", () => {
  const s = fc27(), club = clubs(s)[0];
  const row = () => W.standings(s, club.leagueId).find((r) => r.id === club.id).strength;
  club.coachBonus = 0; const base = row();
  club.coachBonus = 3; assert.equal(row(), Math.min(100, base + 3));
  club.coachBonus = -3; assert.equal(row(), Math.max(35, base - 3));
  const other = D.create({ mode: "coach", clubId: "c0", catalogVersion: "fc27_v1" }, 5151), oc = clubs(other)[0];
  assert.equal(oc.coachBonus, undefined, "sem init nao ha bonus");
  const style = fc27(5151).globalFootball.intel.coaches; assert.ok(Object.values(style).every((c) => typeof c.rating === "number"));
});

test("34F.23 (4) fim de temporada: metas avaliadas, diretoria reage, orcamento e reputacao evoluem dentro dos limites, demissoes geram treinador novo", () => {
  const s = fc27(), i = s.globalFootball.intel, before = new Map(clubs(s).map((c) => [c.id, { budget: c.budget, rep: c.reputation, coach: i.coaches[c.id].name }]));
  for (const m of Object.values(i.clubs)) m.board = 30;
  const summary = CI.closeSeason(s, { log() {} });
  assert.ok(summary.sacked > 20, "clubes que falham a meta com a diretoria no limite trocam de treinador");
  assert.ok(summary.achieved > 100 && summary.failed > 50);
  assert.ok(summary.champions.length >= 20);
  let changedBudget = 0;
  for (const c of clubs(s)) {
    const meta = i.clubs[c.id], b = before.get(c.id);
    if (!meta.finishes.length) continue;
    assert.equal(meta.finishes[0].season, s.season);
    if (b.budget > 0) { assert.ok(c.budget >= b.budget * 0.4 && c.budget <= b.budget * 3); if (c.budget !== b.budget) changedBudget++; }
    assert.ok(c.reputation >= 30 && c.reputation <= 96);
  }
  assert.ok(changedBudget > 300);
  const sacked = i.events.filter((e) => e.type === "sacked");
  assert.ok(sacked.length > 0);
  for (const e of sacked.slice(0, 5)) {
    const coach = i.coaches[e.clubId];
    assert.equal(coach.name, e.newCoach); assert.ok(coach.honeymoonUntil > s.day); assert.notEqual(coach.name, e.coach);
    assert.equal(i.clubs[e.clubId].board, 60);
  }
});

test("34F.23 (5) clube do tecnico (modo treinador) e protegido; mudancas acontecem sem o protagonista", () => {
  const s = fc27(), target = clubs(s)[3];
  s.clubId = target.id;
  for (const m of Object.values(s.globalFootball.intel.clubs)) m.board = 0;
  const coach = s.globalFootball.intel.coaches[target.id].name;
  CI.closeSeason(s, { log() {} });
  assert.equal(s.globalFootball.intel.coaches[target.id].name, coach, "clube do jogador nunca e demitido pela IA");
  const others = s.globalFootball.intel.events.filter((e) => e.type === "sacked");
  assert.ok(others.length > 0 && others.every((e) => e.clubId !== target.id));
});

test("34F.23 (6) hook de log so recebe eventos de clubes grandes; startSeason refaz metas; formador promove mais jovens", () => {
  const s = fc27(), logs = [];
  CI.closeSeason(s, { log: (t, b) => logs.push(t) });
  const i = s.globalFootball.intel;
  assert.ok(logs.length <= i.events.filter((e) => e.notable).length);
  s.season++; G.rollSeason(s); CI.startSeason(s);
  assert.ok(Object.values(i.clubs).every((m) => m.objectiveSeason === s.season));
  const club = clubs(s).find((c) => c.strength >= 70), coach = i.coaches[club.id];
  const kid = (id, pot) => ({ ...s.internationalPlayers.find((p) => p.academy), id, name: "K" + id, clubId: club.id, leagueId: club.leagueId, birthYear: s.season + 1 - 20, age: 20, ovr: 40, overall: 40, potential: pot, academy: true, generated: true, status: "active", active: true });
  const lvl = Math.round(club.strength), pot = lvl - 2;
  const run = (style) => { coach.style = style; const k = kid("kt_" + style, pot); s.internationalPlayers.push(k); s.season++; G.rollSeason(s); return !k.academy && k.clubId === club.id; };
  assert.equal(run("formador"), true, "formador mantem o jovem de bom potencial");
  assert.equal(run("defensivo"), false, "outro estilo dispensa o mesmo perfil");
});

test("34F.23 (7) save hibrido preserva tecnicos, metas e eventos; avancar dias roda sem erro", () => {
  const s = fc27();
  for (let k = 0; k < 4; k++) D.advance(s, 30);
  const text = Save.encodeHybridSave(s, { sparseStats: true }), dec = Save.decodeHybridSave(JSON.parse(text));
  assert.equal(JSON.stringify(dec.globalFootball.intel), JSON.stringify(s.globalFootball.intel));
  assert.equal(dec.globalFootball.clubs.find((c) => c.fc27).coachStyle, s.globalFootball.clubs.find((c) => c.fc27).coachStyle);
});

test("34F.23 (8) tela de competicoes mundiais lista tecnicos, estilo, meta e movimentacao da liga", () => {
  const V = require("../src/ui/world-competitions-view.js");
  const s = fc27(); for (const m of Object.values(s.globalFootball.intel.clubs)) m.board = 30;
  CI.closeSeason(s, { log() {} });
  const html = V.render(s, D, { leagueId: "gf_fc27_premier_league" });
  assert.ok(html.includes("data-world-coaches"));
  assert.ok((html.match(/wc-coach-row/g) || []).length >= 20);
  assert.ok(/Ofensivo|Defensivo|Posse de bola|Contra-ataque|Equilibrado|Formador/.test(html));
  const legacy = D.create({ mode: "coach", clubId: "c0" }, 3);
  assert.ok(!V.render(legacy, D, {}).includes("data-world-coaches"));
});
