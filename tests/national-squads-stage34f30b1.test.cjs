"use strict";
// Stage 34F.30B.1 - elencos reais do FC27 para TODAS as selecoes (mecanismo unico) + pre-lista + escalacao.
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"); global.ProLife = D; global.ProLifeGlobalFootball = D.GlobalFootball;
global.ProLifeNames = require("../src/domain/display-names.js");
const NI = require("../src/domain/national-identity.js"); global.ProLifeNationalIdentity = NI;
global.ProLifeCareerContext = require("../src/domain/career-context.js");
const H = require("../src/ui/national-hub-view.js"), GF = D.GlobalFootball;
const make = (nat, seed = 5) => { const s = D.create({ mode: "player", clubId: "c0", catalogVersion: "fc27_v1" }, seed); s.person.nationality = nat; return s; };
const team = (s, v) => NI.resolve(v, s, D);
const visible = (h) => h.replace(/<style>[\s\S]*?<\/style>/g, "");
let shared = null; const S = () => shared || (shared = make("Espanha"));
const natOf = (s, id) => (id === "hero" ? s.person : GF.playerById(s, id)).nationality;

test("34F.30B.1 (1) Espanha usa jogadores espanhois reais do catalogo (Yamal, Pedri, Rodri), sem ficticios", () => {
  const s = S(), q = NI.squad(s, D, team(s, "Espanha")), names = q.squad.map((p) => p.name);
  for (const n of ["Lamine Yamal", "Pedri", "Rodri"]) assert.ok(names.includes(n), n);
  assert.ok(q.squad.every((p) => /^fc27_p_|^real_|^hero$/.test(p.id)), "somente atletas reais"); assert.ok(!q.squad.some((p) => /intlgen/.test(p.id)));
  const h = visible((H.setTab("convocacao"), H.render(s, D)));
  assert.ok(h.includes("Lamine Yamal") && !h.includes("Cordillera") && !/oficial da Copa/i.test(h));
  assert.ok(/não é uma convocação oficial/.test(h));
});

test("34F.30B.1 (2) todas as selecoes representadas usam o mesmo mecanismo: nacionalidade correta, ids unicos, sem ficticios", () => {
  const s = S(), codes = ["ESP", "BRA", "ARG", "FRA", "POR", "ENG", "GER", "ITA", "NED", "BEL", "URU", "COL", "JPN", "KOR", "MAR", "USA", "MEX", "CRO", "SUI", "SEN"];
  const all = new Set();
  for (const c of codes) {
    const t = NI.resolve(c, s, D); assert.ok(t.represented, c); const q = NI.squad(s, D, t);
    assert.equal(q.source, "catalogo", c); assert.ok(q.squad.length >= 11, c + " " + q.squad.length);
    const ids = q.squad.map((p) => p.id); assert.equal(new Set(ids).size, ids.length, c + " duplicado");
    for (const p of q.squad) { assert.equal(NI.codeOf(natOf(s, p.id)), c, `${c}: ${p.name}`); assert.ok(!all.has(p.id), `${p.name} em duas selecoes`); all.add(p.id); }
  }
});

test("34F.30B.1 (3) grafias diferentes da nacionalidade levam ao mesmo elenco", () => {
  const s = S(); const a = NI.squad(s, D, team(s, "Espanha")).squad.map((p) => p.id).join();
  for (const v of ["Spain", "ESP", "espanha"]) assert.equal(NI.squad(s, D, team(s, v)).squad.map((p) => p.id).join(), a, v);
  assert.equal(NI.codeOf("Brazil"), NI.codeOf("Brasil"));
});

test("34F.30B.1 (4) selecao com poucos atletas: limitacao explicita, sem inventar nem usar outra nacionalidade", () => {
  const s = make("Haiti"), t = team(s, "Haiti"), q = NI.squad(s, D, t);
  assert.ok(q.limited && q.note && /fictícios/.test(q.note));
  assert.ok(q.squad.length <= q.availableCount && q.squad.length < 26);
  for (const p of q.squad) assert.equal(NI.codeOf(natOf(s, p.id)), "HAI");
  const h = visible((H.setTab("convocacao"), H.render(s, D))); assert.ok(h.includes("não completa a lista"));
});

test("34F.30B.1 (5) lesionado fica elegivel mas fora do elenco-base e da escalacao", () => {
  const ref = make("Espanha"), starId = NI.squad(ref, D, team(ref, "Espanha")).squad[0].id;
  const s = make("Espanha"); GF.playerById(s, starId).injury = 20;
  const q = NI.squad(s, D, team(s, "Espanha"));
  assert.ok(!q.squad.some((p) => p.id === starId)); const e = q.eligible.find((p) => p.id === starId); assert.ok(e && e.available === false && e.injury);
});

test("34F.30B.1 (6) escalacao com 11 titulares (1 goleiro) e reservas, sem sobreposicao", () => {
  const s = S(), q = NI.squad(s, D, team(s, "Espanha"));
  assert.equal(q.starters.length, 11); assert.equal(q.starters.filter((p) => p.pos === "GOL").length, 1); assert.ok(q.complete);
  const st = new Set(q.starters.map((p) => p.id)); assert.ok(q.bench.every((p) => !st.has(p.id))); assert.equal(q.starters.length + q.bench.length, q.squad.length);
  assert.ok(q.preList.length >= q.squad.length - 5);
});

test("34F.30B.1 (7) protagonista entra por merito (GER alto) e fica de fora com GER baixo, sem garantia", () => {
  const strong = make("Espanha"); strong.person.pos = "ATA"; for (const k of Object.keys(strong.person.attrs)) strong.person.attrs[k] = 99; // 34F.30C: GER canonico vem dos atributos, nao do snapshot ovr
  const q1 = NI.squad(strong, D, team(strong, "Espanha")); assert.ok(q1.starters.some((p) => p.hero), "99 de GER titular");
  const weak = make("Espanha"); weak.person.pos = "ATA"; for (const k of Object.keys(weak.person.attrs)) weak.person.attrs[k] = 25; const q2 = NI.squad(weak, D, team(weak, "Espanha")); assert.ok(!q2.squad.some((p) => p.hero));
  const c = NI.competition(weak, D, team(weak, "Espanha"), 8); assert.ok(c.rank > 26);
});

test("34F.30B.1 (8) transferencia nao muda nacionalidade; selecao continua a mesma", () => {
  const s = make("Espanha"); const id = s.globalFootball.clubs.find((c) => /^Manchester City$/.test(c.name)).id; D.movePlayerToClub(s, id);
  assert.equal(s.person.nationality, "Espanha"); assert.equal(NI.heroTeam(s, D).code, "ESP");
});

test("34F.30B.1 (9) save/load: mesmo elenco; elencos historicos da Copa nao sao reescritos", () => {
  const s = make("Espanha"); D.NationalTeam.worldCupSummary(s);
  const snap = () => JSON.stringify((D.NationalTeam.worldCupSummary(s).worldCupSquads || []).map((x) => [x.id, (x.squad || []).map((p) => p.id).sort()]));
  const wc0 = snap(); const q = NI.squad(s, D, team(s, "Espanha")); const copy = JSON.parse(JSON.stringify(s));
  assert.equal(NI.squad(copy, D, team(copy, "Espanha")).squad.map((p) => p.id).join(), q.squad.map((p) => p.id).join());
  assert.equal(snap(), wc0, "elencos historicos da Copa preservados");
});

test("34F.30B.1 (10) Brasil e Argentina: jogadores reais da propria nacionalidade", () => {
  const s = make("Brasil"); for (const c of ["BRA", "ARG"]) { const q = NI.squad(s, D, NI.resolve(c, s, D)); assert.ok(q.complete && q.squad.length === 26, c); assert.ok(q.squad.every((p) => NI.codeOf(natOf(s, p.id)) === c)); }
});
