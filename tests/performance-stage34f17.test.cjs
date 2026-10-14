"use strict";
// Stage 34F.17 - desempenho e estabilidade: as otimizacoes precisam produzir exatamente os mesmos resultados de antes.
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("fs"), path = require("path"), { JSDOM } = require("jsdom");
const J = (x) => JSON.stringify(x);
const base = path.join(__dirname, "..") + path.sep;
const html = fs.readFileSync(base + "index.html", "utf8");
const order = html.match(/src="(src\/[^"]+\.js)"/g).map((x) => x.slice(5, -1)).filter((f) => !/update\.js|avatar/.test(f));
const upto = order.indexOf("src/infrastructure/save.js");
function page() {
  const w = new JSDOM(html, { runScripts: "outside-only", url: "https://offline-test.invalid" }).window;
  for (const f of order.slice(0, upto + 1)) w.eval(fs.readFileSync(base + f, "utf8"));
  return w;
}
const OPTS = { world: "global", mode: "player", name: "Teste", age: 17, pos: "ATA", clubId: "c0", catalogVersion: "fc27_v1" };
let w, s;
test.before(() => { w = page(); s = w.ProLife.create(OPTS, 44); });

// Implementacao de referencia (a anterior): deduplica todos os jogadores e filtra.
function reference(state) {
  const out = [], seen = new Set(), add = (p) => { if (p && p.id && !seen.has(p.id)) { seen.add(p.id); out.push(p); } };
  for (const c of state.clubs || []) for (const p of c.roster || []) add(p);
  for (const p of state.internationalPlayers || []) add(p);
  if (state.person) add(state.person);
  return out;
}

test("34F.17 (1) consultas por clube/liga/jogador devolvem o mesmo que a deduplicacao completa (mesma ordem)", () => {
  const G = w.ProLifeGlobalFootball, ref = reference(s);
  assert.equal(G.allPlayers(s).length, ref.length);
  assert.ok(ref.length >= 17849);
  for (const c of [...s.globalFootball.clubs, ...s.clubs].slice(0, 700)) {
    const expected = ref.filter((p) => p.clubId === c.id);
    const got = G.playersByClub(s, c.id);
    assert.equal(got.length, expected.length, c.id);
    assert.ok(got.every((p, i) => p === expected[i]), "ordem/identidade " + c.id);
  }
  for (const l of s.globalFootball.leagues) assert.equal(J(G.playersByLeague(s, l.id).map((p) => p.id)), J(ref.filter((p) => p.leagueId === l.id).map((p) => p.id)));
  assert.equal(J(G.activePlayers(s).map((p) => p.id)), J(ref.filter((p) => p.status !== "retired" && p.active !== false).map((p) => p.id)));
  assert.equal(G.playerById(s, "hero"), ref.find((p) => p.id === "hero") || null);
  for (const p of ref.slice(0, 50)) assert.equal(G.playerById(s, p.id), p);
  assert.equal(G.playerById(s, "nao-existe"), null);
  assert.equal(G.playerById(s, undefined), null);
  assert.equal(J(G.playersByNationality(s, "Brasil").map((p) => p.id)), J(ref.filter((p) => G.normalizedNationality(p.nationality) === G.normalizedNationality("Brasil")).map((p) => p.id)));
});

test("34F.17 (2) o catalogo FC 27 segue integro (18.379 jogadores, ids unicos, 687 clubes, 49 ligas)", () => {
  assert.equal(s.internationalPlayers.length, 18379);
  assert.equal(new Set(s.internationalPlayers.map((p) => p.id)).size, 18379);
  assert.equal(s.globalFootball.clubs.length, 687);
  assert.equal(s.globalFootball.leagues.length, 49);
});

test("34F.17 (3) deltaFast/restoreFast/verifyFast equivalem a delta/restore e detectam corrupcao", () => {
  const codec = w.ProLifeCompactSave, baseList = w.ProLife.create(OPTS, 44).internationalPlayers;
  const cur = JSON.parse(JSON.stringify(baseList));
  cur[3].overall += 1; cur[10].name = "Alterado"; cur.splice(20, 2); cur.push({ ...JSON.parse(JSON.stringify(cur[0])), id: "novo-1" }); const tmp = cur[5]; cur[5] = cur[6]; cur[6] = tmp;
  const prepared = codec.prepareBase(baseList);
  const slow = codec.delta(baseList, cur), fast = codec.deltaFast(prepared, baseList, cur);
  assert.equal(J(fast.patch), J(slow));
  assert.equal(J(codec.restoreFast(prepared, fast.patch)), J(codec.restore(baseList, slow)));
  assert.equal(J(codec.restoreFast(prepared, fast.patch)), J(cur));
  assert.equal(codec.verifyFast(prepared, fast.patch, fast.currentJson), true);
  const bad = JSON.parse(JSON.stringify(fast.patch)); bad.order.reverse();
  assert.equal(codec.verifyFast(prepared, bad, fast.currentJson), false);
  const bad2 = JSON.parse(JSON.stringify(fast.patch)); bad2.changes[0].overall += 5;
  assert.equal(codec.verifyFast(prepared, bad2, fast.currentJson), false);
  assert.throws(() => codec.deltaFast(prepared, baseList, [cur[0], cur[0]]), /duplicado/);
  assert.throws(() => codec.restoreFast(prepared, { changes: [], removed: [], order: ["inexistente"] }), /ausente/);
});

test("34F.17 (4) save hibrido: ida e volta identica, repetida, e fingerprint em cache nao mascara incompatibilidade", () => {
  const S = w.ProLifeSave;
  s.internationalPlayers[7].ovr = 61; s.internationalPlayers[7].overall = 61; s.internationalPlayers[9].goals = 3; s.internationalPlayers[9].minutes = 120;
  const t1 = S.encodeHybridSave(s, { sparseStats: true });
  const t2 = S.encodeHybridSave(s, { sparseStats: true });
  assert.equal(t1, t2, "gravacoes repetidas identicas");
  // Caminho rapido x caminho antigo (codec lento): gravacao e leitura precisam ser identicas byte a byte.
  const codec = w.ProLifeCompactSave, fastFns = { deltaFast: codec.deltaFast, verifyFast: codec.verifyFast, restoreFast: codec.restoreFast };
  const fastBack = J(S.decodeHybridSave(JSON.parse(t1)));
  codec.deltaFast = undefined; codec.verifyFast = undefined; codec.restoreFast = undefined;
  try {
    assert.equal(S.encodeHybridSave(s, { sparseStats: true }), t1, "envelope identico ao do caminho antigo");
    assert.equal(J(S.decodeHybridSave(JSON.parse(t1))), fastBack, "leitura identica a do caminho antigo");
  } finally { Object.assign(codec, fastFns); }
  const back = S.decodeHybridSave(JSON.parse(t1));
  assert.equal(back.internationalPlayers.length, s.internationalPlayers.length);
  assert.equal(back.internationalPlayers[9].goals, 3, "alteracao persistida");
  assert.equal(back.internationalPlayers[9].minutes, 120, "alteracao persistida");
  const v = JSON.parse(t1); v.fingerprint = "00000000";
  assert.throws(() => S.decodeHybridSave(v), /incompat/i);
  const v2 = JSON.parse(t1); v2.delta.order = v2.delta.order.slice(1);
  assert.doesNotThrow(() => S.decodeHybridSave(v2)); // ordem menor = registro removido do estado, formato continua valido
  const v3 = JSON.parse(t1); v3.delta.order.push("fantasma");
  assert.throws(() => S.decodeHybridSave(v3));
});

test("34F.17 (5) criar carreira FC 27 e autosave ficam dentro dos limites medidos", () => {
  const t0 = process.hrtime.bigint(); const st = w.ProLife.create(OPTS, 46); const create = Number(process.hrtime.bigint() - t0) / 1e6;
  w.ProLifeSave.encodeHybridSave(st, { sparseStats: true }); // aquece a base em cache (1a gravacao da sessao reconstroi a base)
  const t1 = process.hrtime.bigint(); w.ProLifeSave.encodeHybridSave(st, { sparseStats: true }); const enc = Number(process.hrtime.bigint() - t1) / 1e6;
  // Antes da 34F.17: create ~5.900 ms e encode ~360 ms (mesma maquina). Limites folgados para nao ser flaky.
  assert.ok(create < 4000, "create " + Math.round(create) + " ms");
  assert.ok(enc < 300, "encode " + Math.round(enc) + " ms");
});
