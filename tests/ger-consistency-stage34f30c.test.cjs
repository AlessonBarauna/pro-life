"use strict";
// Stage 34F.30C - GER canonico do protagonista (D.overall(person)) em todas as telas e na disputa/convocacao.
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"); global.ProLife = D; global.ProLifeGlobalFootball = D.GlobalFootball;
global.ProLifeNames = require("../src/domain/display-names.js");
const NI = require("../src/domain/national-identity.js"); global.ProLifeNationalIdentity = NI;
global.ProLifeCareerContext = require("../src/domain/career-context.js");
const H = require("../src/ui/national-hub-view.js"), GF = D.GlobalFootball;
const make = (seed = 7) => { const s = D.create({ mode: "player", clubId: "c0", catalogVersion: "fc27_v1" }, seed); s.person.nationality = "Espanha"; s.person.pos = "ATA"; return s; };
const KEYS = ["pace", "finish", "pass", "defense", "strength", "stamina"];
const setAttrs = (s, v) => { for (const k of Object.keys(s.person.attrs)) s.person.attrs[k] = v; };
const team = (s) => NI.resolve("Espanha", s, D);
const heroCount = (s) => NI.competition(s, D, team(s), 400).rows.filter((r) => r.id === "hero").length;
const visible = (h) => h.replace(/<style>[\s\S]*?<\/style>/g, "");

test("34F.30C (1) GER do perfil == GER da disputa/selecao mesmo com snapshot person.ovr antigo (62)", () => {
  const s = make(); setAttrs(s, 80); s.person.ovr = 62; s.person.overall = 62; // snapshot obsoleto
  const ger = D.overall(s.person); assert.ok(ger > 70);
  const P = NI.profile(s, D); assert.equal(P.hero.overall, ger);
  const row = NI.competition(s, D, team(s), 8).rows.find((r) => r.id === "hero") || NI.competition(s, D, team(s), 400).rows.find((r) => r.id === "hero");
  assert.equal(row.overall, ger);
  assert.equal(NI.gerOf(s.person, D), ger);
  assert.ok(visible((H.setTab("geral"), H.render(s, D))).includes(String(ger)));
});

test("34F.30C (2) elenco/mercado: demais jogadores mantem GER do catalogo; protagonista segue D.overall", () => {
  const s = make(); setAttrs(s, 80); s.person.ovr = 62;
  const other = GF.allPlayers(s).find((p) => p.id !== "hero" && p.id.startsWith("fc27_p_"));
  const before = other.ovr; assert.equal(NI.gerOf(other, D), Number(other.ovr || other.overall));
  NI.competition(s, D, team(s), 8); assert.equal(other.ovr, before, "catalogo intacto");
  assert.equal(ProLife.overall(s.person), NI.gerOf(s.person, D));
});

test("34F.30C (3)(4) treino/evolucao altera o GER e reordena o ranking; atributos nao sao forcados", () => {
  const s = make(); setAttrs(s, 40); const r0 = NI.competition(s, D, team(s), 8); const g0 = NI.gerOf(s.person, D);
  setAttrs(s, 85); const attrsAfter = JSON.stringify(s.person.attrs);
  const r1 = NI.competition(s, D, team(s), 8); const g1 = NI.gerOf(s.person, D);
  assert.ok(g1 > g0); assert.ok(r1.rank < r0.rank, `${r0.rank} -> ${r1.rank}`);
  assert.equal(JSON.stringify(s.person.attrs), attrsAfter, "atributos nao reescritos");
  assert.equal(r1.rows.concat([]).length >= 1, true);
});

test("34F.30C (5) convocacao/elenco-base usa o GER atualizado (cache invalida ao mudar GER)", () => {
  const s = make(); setAttrs(s, 30); const q0 = NI.squad(s, D, team(s)); const h0 = (q0.eligible.find((p) => p.id === "hero") || {}).overall;
  setAttrs(s, 90); const q1 = NI.squad(s, D, team(s)); const h1 = (q1.eligible.find((p) => p.id === "hero") || {}).overall;
  assert.equal(h0, Math.round(h0) && h0); assert.ok(h1 > h0, `${h0} -> ${h1}`); assert.equal(h1, D.overall(s.person));
  assert.ok(q1.eligible.filter((p) => p.id === "hero").length <= 1);
});

test("34F.30C (6) transferencia, troca de dia/temporada e lesao nao redefinem o GER", () => {
  const s = make(); setAttrs(s, 77); const g = D.overall(s.person);
  s.clubId = "gf_fc27_243"; assert.equal(NI.gerOf(s.person, D), g);
  s.day += 40; s.season += 1; assert.equal(NI.gerOf(s.person, D), g);
  s.person.injury = 5; assert.equal(NI.gerOf(s.person, D), g, "lesao nao altera GER permanente");
});

test("34F.30C (7) save/load preserva o GER", () => {
  const s = make(); setAttrs(s, 72); const g = NI.gerOf(s.person, D);
  const t = JSON.parse(JSON.stringify(s)); assert.equal(NI.gerOf(t.person, D), g);
  assert.equal(NI.competition(t, D, team(t), 8).rank, NI.competition(s, D, team(s), 8).rank);
});

test("34F.30C (8) protagonista aparece exatamente uma vez (varias posicoes/nacionalidades)", () => {
  for (const [nat, pos] of [["Espanha", "ATA"], ["Brasil", "GOL"], ["Argentina", "MEI"], ["França", "DEF"]]) {
    const s = make(); s.person.nationality = nat; s.person.pos = pos; setAttrs(s, 75);
    const t = NI.resolve(nat, s, D); const c = NI.competition(s, D, t, 5000);
    assert.equal(c.rows.filter((r) => r.id === "hero").length, 1, nat + pos);
    const ids = c.rows.map((r) => r.id); assert.equal(new Set(ids).size, ids.length);
    assert.equal(c.rank, ids.indexOf("hero") + 1);
  }
});

test("34F.30C (9) ordem estavel: GER desc, idade asc, id; repetivel", () => {
  const s = make(); setAttrs(s, 70); const a = NI.competition(s, D, team(s), 5000).rows.map((r) => r.id).join();
  const b = NI.competition(s, D, team(s), 5000).rows.map((r) => r.id).join(); assert.equal(a, b);
  const rows = NI.competition(s, D, team(s), 5000).rows;
  for (let i = 1; i < rows.length; i++) assert.ok(rows[i - 1].overall >= rows[i].overall, `ordem em ${i}`);
});

test("34F.30C (10) save antigo sem ovr/overall no protagonista continua funcionando", () => {
  const s = make(); setAttrs(s, 70); delete s.person.ovr; delete s.person.overall;
  assert.equal(NI.gerOf(s.person, D), D.overall(s.person));
  assert.equal(NI.competition(s, D, team(s), 8).rows.some((r) => r.id === "hero") || NI.competition(s, D, team(s), 5000).rank > 0, true);
});
