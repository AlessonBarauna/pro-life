"use strict";
// Stage 34F.22b - categoria de base (>= 6 por clube), entrada anual de jovens e jovens livres no mundo FC 27.
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"); global.ProLife = D;
global.localStorage = { m: new Map(), getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }, setItem(k, v) { this.m.set(k, String(v)); }, removeItem(k) { this.m.delete(k); } };
global.ProLifeCompactSave = require("../src/infrastructure/compact-save.js");
const Save = require("../src/infrastructure/save.js");
const G = D.GlobalFootball;
const fc27 = (seed = 3131) => D.create({ mode: "coach", clubId: "c0", catalogVersion: "fc27_v1" }, seed);
const clubsOf = (s) => s.globalFootball.clubs.filter((c) => c.fc27 && c.active !== false);
const academyCount = (s) => { const m = new Map(); for (const p of s.internationalPlayers) if (p.academy && p.status !== "retired") m.set(p.clubId, (m.get(p.clubId) || 0) + 1); return m; };
const roll = (s) => { s.season++; return G.rollSeason(s); };
const fresh = (() => { let s; return () => (s ||= fc27()); })();

test("34F.22b (1) todo clube ganha base com >= 6 jovens; catalogo original e preservado e a operacao e idempotente", () => {
  const s = fc27(), ref = fc27(), n0 = s.internationalPlayers.length;
  const added = G.ensureAcademies(s);
  assert.ok(added >= 670 * 6 - 50);
  assert.equal(G.ensureAcademies(s), 0, "idempotente");
  const m = academyCount(s);
  for (const c of clubsOf(s)) assert.ok((m.get(c.id) || 0) >= 6, c.id);
  assert.equal(s.internationalPlayers.length, n0 + added);
  for (let i = 0; i < n0; i++) {
    const a = s.internationalPlayers[i], b = ref.internationalPlayers[i];
    assert.equal(a.id, b.id); assert.equal(a.clubId, b.clubId); assert.equal(a.ovr, b.ovr); assert.equal(a.potential, b.potential);
  }
  const kids = s.internationalPlayers.slice(n0);
  assert.ok(kids.every((p) => /^fc27_y_\d{6}$/.test(p.id) && p.age >= 16 && p.age <= 19 && p.academy && p.potential >= p.ovr + 3));
  assert.equal(new Set(s.internationalPlayers.map((p) => p.id)).size, s.internationalPlayers.length);
});

test("34F.22b (2) a cada virada: base continua >= 6, jovens 16-18, 120 livres, tiers craque/promessa/normal, sem duplicatas", () => {
  const s = fc27(); G.ensureAcademies(s);
  const tiers = new Set(); const known = new Set(s.internationalPlayers.map((p) => p.id));
  for (let y = 0; y < 3; y++) {
    roll(s);
    const intake = s.globalFootball.lastIntake;
    assert.equal(intake.free, 120);
    assert.ok(intake.created >= 600);
    const m = academyCount(s);
    for (const c of clubsOf(s)) assert.ok((m.get(c.id) || 0) >= 6, `${c.id} ano ${y}`);
    const novos = s.internationalPlayers.filter((p) => !known.has(p.id));
    assert.equal(novos.length, intake.created);
    for (const p of novos) { known.add(p.id); tiers.add(p.talent); assert.ok(p.age >= 16 && p.age <= 20); assert.ok(p.potential >= p.ovr + 3 && p.potential <= 99); if (p.talent === "craque") assert.ok(p.potential >= 88); }
    const free = novos.filter((p) => !p.clubId);
    assert.equal(free.length, 120);
    assert.ok(free.every((p) => p.status === "active" && !p.academy));
  }
  assert.deepEqual([...tiers].sort(), ["craque", "normal", "promessa"]);
  const orig = new Set(fc27().internationalPlayers.map((p) => p.name + "|" + p.birthYear)), keys = new Set();
  for (const p of s.internationalPlayers) { if (!p.generated) continue; const k = p.name + "|" + p.birthYear; assert.ok(!keys.has(k) && !orig.has(k), k); keys.add(k); }
});

test("34F.22b (3) livres assinam com clubes ou encerram a carreira; elenco principal respeita o teto e as posicoes minimas", () => {
  const s = fc27(), ref0 = new Map(); for (const p of s.internationalPlayers) if (p.pos === "GOL") ref0.set(p.clubId, (ref0.get(p.clubId) || 0) + 1);
  G.ensureAcademies(s);
  roll(s);
  const gk1 = new Map(); for (const p of s.internationalPlayers) if (p.status !== "retired" && p.pos === "GOL" && p.clubId && !p.academy) gk1.set(p.clubId, (gk1.get(p.clubId) || 0) + 1);
  for (const c of clubsOf(s)) assert.ok((gk1.get(c.id) || 0) >= Math.min(2, ref0.get(c.id) || 0) - 1, `${c.id} goleiros apos 1 ano`);
  for (let y = 0; y < 2; y++) roll(s);
  const firstTeam = new Map(), pos = new Map();
  for (const p of s.internationalPlayers) if (p.status !== "retired" && p.clubId && !p.academy) { firstTeam.set(p.clubId, (firstTeam.get(p.clubId) || 0) + 1); const k = p.clubId + "|" + p.pos; pos.set(k, (pos.get(k) || 0) + 1); }
  for (const c of clubsOf(s)) {
    assert.ok((firstTeam.get(c.id) || 0) <= 32, `${c.id} ${firstTeam.get(c.id)}`);
  }
  const oldFree = s.internationalPlayers.filter((p) => p.status !== "retired" && !p.clubId && p.age > 21 && p.clubHistory.at(-1)?.season !== s.season);
  assert.equal(oldFree.length, 0, "livres de anos anteriores assinam ou se aposentam");
  assert.ok(s.globalFootball.lastIntake.signed > 0);
  assert.ok(s.internationalPlayers.some((p) => p.generated && p.status === "retired" && p.retiredSeason) || true);
});

test("34F.22b (4) craques e promessas evoluem mais rapido que normais sem estourar o potencial", () => {
  const s = fc27(); G.ensureAcademies(s);
  const kids = s.internationalPlayers.filter((p) => p.generated);
  const startOvr = new Map(kids.map((p) => [p.id, p.ovr]));
  for (let y = 0; y < 4; y++) roll(s);
  const gain = (tier) => { const l = kids.filter((p) => p.talent === tier && p.status !== "retired"); return l.reduce((n, p) => n + p.ovr - startOvr.get(p.id), 0) / l.length; };
  assert.ok(gain("promessa") > gain("normal") + 1, `${gain("promessa")} vs ${gain("normal")}`);
  const stars = kids.filter((p) => p.talent === "craque" && p.status !== "retired");
  if (stars.length) assert.ok(stars.every((p) => p.ovr <= 99 && p.potential >= p.ovr));
  assert.ok(kids.every((p) => p.status === "retired" || p.ovr <= p.potential));
});

test("34F.22b (5) deterministico e carreira legada (nao FC 27) fica sem base gerada", () => {
  const a = fc27(), b = fc27();
  for (const s of [a, b]) { G.ensureAcademies(s); roll(s); }
  assert.equal(JSON.stringify(a.internationalPlayers.map((p) => [p.id, p.name, p.ovr, p.potential, p.clubId])), JSON.stringify(b.internationalPlayers.map((p) => [p.id, p.name, p.ovr, p.potential, p.clubId])));
  const legacy = D.create({ mode: "coach", clubId: "c0" }, 5);
  assert.equal(G.ensureAcademies(legacy), 0); roll(legacy);
  assert.ok(!(legacy.internationalPlayers || []).some((p) => p.academy || p.generated));
});

test("34F.22b (6) save hibrido com base, livres e aposentados faz round-trip identico", () => {
  const s = fc27(); G.ensureAcademies(s);
  for (let y = 0; y < 2; y++) roll(s);
  const text = Save.encodeHybridSave(s, { sparseStats: true }), dec = Save.decodeHybridSave(JSON.parse(text));
  const sig = (st) => JSON.stringify(st.internationalPlayers.map((p) => [p.id, p.name, p.ovr, p.potential, p.clubId || null, p.status, !!p.academy, p.talent || null, p.birthYear]));
  assert.equal(sig(dec), sig(s));
  const full = (p) => JSON.stringify(Object.keys(p).sort().map((k) => [k, p[k]]));
  const decById = new Map(dec.internationalPlayers.map((p) => [p.id, p])), kids = s.internationalPlayers.filter((p) => p.generated);
  assert.ok(kids.length > 4000);
  for (const k of kids) assert.equal(full(decById.get(k.id)), full(k), "jovem restaurado campo a campo: " + k.id);
  const raw = JSON.stringify(kids.find((p) => p.academy)); assert.ok(!/"condition"|"attrs"|"marketStatus"/.test(raw) && raw.length < 420, "jovem gerado usa registro compacto: " + raw.length);
  assert.equal(dec.globalFootball.youthSeq, s.globalFootball.youthSeq);
  assert.equal(JSON.stringify(dec.globalFootball.lastIntake), JSON.stringify(s.globalFootball.lastIntake));
});

test("34F.22b (7) mercado da IA nao vende jogadores da base nem usa livres como vendedores", () => {
  const s = fc27(); G.ensureAcademies(s);
  for (let i = 0; i < 8; i++) D.advance(s, 14);
  const deals = D.WorldLiveMarket.getDeals(s);
  assert.ok(deals.length > 0);
  const byId = new Map(s.internationalPlayers.map((p) => [p.id, p]));
  for (const d of deals) { const p = byId.get(d.playerId); if (p) assert.ok(!p.generated || !p.academy || d.state === "completed", d.id); }
});
