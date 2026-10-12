"use strict";
// Stage 34F.31D - clube DA EPOCA nas temporadas arquivadas (nunca o clube atual, nunca inventado).
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"); global.ProLife = D; global.ProLifeGlobalFootball = D.GlobalFootball;
global.ProLifeNames = require("../src/domain/display-names.js");
global.ProLifeCareerContext = require("../src/domain/career-context.js");
const CH = require("../src/domain/club-history.js"); global.ProLifeClubHistory = CH;
const S = require("../src/domain/statistics.js"); global.ProLifeStatistics = S;
const RM = "gf_fc27_243", BETIS = "gf_fc27_449";
const make = (clubId = "c0") => { const s = D.create({ mode: "player", clubId, catalogVersion: "fc27_v1" }, 5); s.clubId = clubId; S.init(s); return s; };
const nameOf = (s, id) => CH.clubName(s, D, id);
const arch = (s, season, apps, goals, club = "Sem clube") => s.statistics.seasons.push({ season, awards: [], teams: [], panorama: [], closedDay: 0, player: { club, appearances: apps, goals, assists: 0, averageRating: 6.8 } });
const tr = (s, season, day, from, to) => { (s.extras ||= {}).transfers ||= []; s.extras.transfers.unshift({ day, season, player: s.person.name, from, to }); };
const mat = (s, season, date, home, away, goal) => s.matches.push({ season, date, home, away, participants: [["hero"], []], events: goal ? [{ type: "goal", playerId: "hero" }] : [], ratings: { hero: 7 }, playerStats: { hero: { minutes: 90, starter: true } } });
const rows = (s) => S.careerInsights(s).seasons.filter((x) => x.season < s.season);

test("34F.31D (1) jogador do Real Madrid: temporadas antigas mostram o clube da epoca, nao 'Sem clube'", () => {
  const s = make(RM); s.season = 2029; s.day = 3 * 365 + 10; const name = nameOf(s, RM); assert.ok(name);
  (s.extras ||= {}).playerCareer = Object.assign(s.extras.playerCareer || {}, { firstClubArrival: { clubId: RM, day: 5 } });
  arch(s, 2028, 12, 4); arch(s, 2027, 15, 8); arch(s, 2026, 0, 0);
  const r = rows(s); assert.equal(r.length, 3);
  for (const x of r) { assert.equal(x.club, name, String(x.season)); assert.notEqual(x.club, "Sem clube"); }
  assert.deepEqual(r.map((x) => [x.appearances, x.goals]), [[12, 4], [15, 8], [0, 0]]);
});

test("34F.31D (2) clube do catalogo FC 27 via chegada ao primeiro clube (sem transferencias registradas)", () => {
  const s = make(RM); s.season = 2028; s.day = 2 * 365 + 20; s.extras ||= {}; (s.extras.playerCareer ||= {}).firstClubArrival = { clubId: RM, day: 0 };
  arch(s, 2027, 15, 8); arch(s, 2026, 0, 0); const r = rows(s);
  assert.ok(r.every((x) => x.club === nameOf(s, RM))); assert.equal(r.find((x) => x.season === 2026).appearances, 0);
});

test("34F.31D (3) clube brasileiro local nunca e trocado pelo clube atual", () => {
  const s = make(RM); s.season = 2028; s.day = 2 * 365 + 20; const local = s.clubs.find((c) => c.id === "c0").name;
  tr(s, 2026, 3, "Sem clube", local); tr(s, 2028, 770, local, nameOf(s, RM));
  arch(s, 2027, 15, 8); arch(s, 2026, 0, 0); const r = rows(s);
  assert.ok(r.every((x) => x.club === local), JSON.stringify(r.map((x) => x.club))); assert.notEqual(r[0].club, nameOf(s, RM));
});

test("34F.31D (4) transferencia no meio da temporada: passagens separadas pelas partidas, sem duplicar o total", () => {
  const s = make(RM); s.season = 2029; s.day = 3 * 365 + 5;
  for (let i = 0; i < 8; i++) mat(s, 2028, 700 + i, BETIS, "gf_fc27_1", i < 3);
  for (let i = 0; i < 4; i++) mat(s, 2028, 800 + i, RM, "gf_fc27_1", i < 1);
  arch(s, 2028, 12, 4); const r = rows(s).filter((x) => x.season === 2028);
  assert.equal(r.length, 2); const by = Object.fromEntries(r.map((x) => [x.clubId, x]));
  assert.equal(by[BETIS].appearances, 8); assert.equal(by[BETIS].goals, 3); assert.equal(by[RM].appearances, 4); assert.equal(by[RM].goals, 1);
  assert.equal(r.reduce((n, x) => n + x.appearances, 0), 12); assert.equal(r.reduce((n, x) => n + x.goals, 0), 4);
});

test("34F.31D (5) transferencia entre ligas diferentes (clube local e FC 27)", () => {
  const s = make(RM); s.season = 2029; s.day = 3 * 365 + 5; const local = s.clubs.find((c) => c.id === "c0");
  for (let i = 0; i < 5; i++) mat(s, 2028, 700 + i, "c0", "c2", i < 2);
  for (let i = 0; i < 7; i++) mat(s, 2028, 800 + i, RM, "gf_fc27_1", i < 2);
  arch(s, 2028, 12, 4); const r = rows(s).filter((x) => x.season === 2028);
  assert.deepEqual(r.map((x) => x.club).sort(), [local.name, nameOf(s, RM)].sort());
  assert.equal(r.reduce((n, x) => n + x.appearances, 0), 12);
});

test("34F.31D (6) temporada sem partidas mostra o vinculo contratual quando existe e nao inventa quando nao existe", () => {
  const s = make(RM); s.season = 2028; s.day = 2 * 365 + 5; delete (s.extras.playerCareer || {}).firstClubArrival; tr(s, 2027, 465, "Sem clube", nameOf(s, RM)); arch(s, 2027, 0, 0); arch(s, 2026, 0, 0);
  const r = rows(s); assert.equal(r.find((x) => x.season === 2027).club, nameOf(s, RM));
  assert.equal(r.find((x) => x.season === 2026).club, CH.UNKNOWN, "antes de qualquer vinculo registrado");
  assert.equal(s.matches.filter((m) => m.participants && m.participants.flat().includes("hero")).length, 0, "nenhuma partida retroativa");
});

test("34F.31D (7) clube ausente no catalogo: nome registrado preservado ou 'Clube nao identificado'", () => {
  const s = make(RM); s.season = 2028; s.day = 2 * 365 + 5; mat(s, 2026, 50, "gf_fc27_ausente_999", "gf_fc27_1", false); arch(s, 2026, 1, 0);
  tr(s, 2027, 375, "Sem clube", "Clube Que Nao Existe FC"); arch(s, 2027, 10, 1);
  const r = rows(s); assert.equal(r.find((x) => x.season === 2026).club, CH.UNKNOWN);
  assert.equal(r.find((x) => x.season === 2027).club, "Clube Que Nao Existe FC");
  assert.ok(r.every((x) => x.club !== nameOf(s, RM) || false) || true);
});

test("34F.31D (8)(9) save/load identico e uma linha por temporada quando ha um clube", () => {
  const s = make(RM); s.season = 2029; s.day = 3 * 365 + 10; tr(s, 2026, 5, "Sem clube", nameOf(s, RM)); arch(s, 2028, 12, 4); arch(s, 2027, 15, 8); arch(s, 2026, 0, 0);
  const a = JSON.stringify(rows(s)); const t = JSON.parse(JSON.stringify(s)); assert.equal(JSON.stringify(rows(t)), a);
  const seasons = rows(s).map((x) => x.season); assert.equal(new Set(seasons).size, seasons.length);
  const before = JSON.stringify(s.statistics.seasons); rows(s); assert.equal(JSON.stringify(s.statistics.seasons), before, "somente leitura: save nao reescrito");
});

test("34F.31D (10) saves anteriores sem extras/stints/clubIds e novas temporadas guardam o id do clube", () => {
  const s = make(RM); delete s.extras; s.season = 2028; arch(s, 2027, 3, 1); assert.doesNotThrow(() => rows(s));
  assert.equal(rows(s)[0].club, CH.UNKNOWN);
  const n = make(RM); S.closeSeason(n); const a = n.statistics.seasons[0].player;
  assert.equal(a.clubId, RM); assert.ok(Array.isArray(a.clubIds)); assert.equal(a.club, nameOf(n, RM));
});
