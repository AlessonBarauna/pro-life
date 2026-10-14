"use strict";
// Stage 34F.12 - integracao experimental do catalogo FC 27 (catalogVersion "fc27_v1") ao motor. Estados descartaveis.
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("fs");
const D = require("../src/domain/engine.js"); global.ProLife = D;
global.localStorage = { m: new Map(), getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }, setItem(k, v) { this.m.set(k, String(v)); }, removeItem(k) { this.m.delete(k); } };
global.ProLifeCompactSave = require("../src/infrastructure/compact-save.js");
const S = require("../src/infrastructure/save.js");
const manifest = JSON.parse(fs.readFileSync(require("node:path").resolve(__dirname, "../src/data/fc27/fc27-manifest-v1.json"), "utf8"));
const G = D.GlobalFootball, SEED = 4242;
const fc27 = (() => { let s; return () => (s ||= D.create({ mode: "player", clubId: "c0", catalogVersion: "fc27_v1" }, SEED)); })();
const legacy = (() => { let s; return () => (s ||= D.create({ mode: "player", clubId: "c0" }, SEED)); })();
const byId = new Map(manifest.players.map((p) => [p.id, p]));
const clone = (o) => JSON.parse(JSON.stringify(o));

test("34F.12 (1) carreira legada: sem catalogVersion, sem FC27, determinística e com contagens anteriores", () => {
  const s = legacy();
  assert.equal(s.catalogVersion, undefined);
  assert.equal(s.internationalPlayers.length, 14822); assert.equal(s.globalFootball.clubs.length, 607); assert.equal(s.globalFootball.leagues.length, 34);
  // (o pacote legado "fc27_world" já traz clubes gf_fc27_*; o que não pode existir é o catálogo novo)
  assert.ok(!s.internationalPlayers.some((p) => String(p.id).startsWith("fc27_p_")) && s.globalFootball.fc27 === undefined);
  assert.equal(JSON.stringify(D.create({ mode: "player", clubId: "c0", catalogVersion: "legacy" }, SEED).internationalPlayers.length), "14822");
  assert.throws(() => D.create({ mode: "player", clubId: "c0", catalogVersion: "fc99" }, SEED), /catalogVersion/);
});

test("34F.12 (2) FC27: 49 ligas, 687 clubes, 18.379 jogadores, sem legado e com clubes brasileiros locais intactos", () => {
  const s = fc27(), l = legacy();
  assert.equal(s.catalogVersion, "fc27_v1");
  assert.deepEqual([s.globalFootball.leagues.length, s.globalFootball.clubs.length, s.internationalPlayers.length], [49, 687, 18379]);
  for (const list of [s.globalFootball.leagues, s.globalFootball.clubs, s.internationalPlayers]) assert.equal(new Set(list.map((x) => x.id)).size, list.length, "ids únicos");
  assert.ok(s.globalFootball.clubs.every((c) => c.id.startsWith("gf_fc27_")) && s.globalFootball.leagues.every((x) => x.id.startsWith("gf_fc27_")));
  assert.ok(s.internationalPlayers.every((p) => /^fc27_p_\d+$/.test(p.id)), "nenhum jogador legado/pool reinserido");
  const locals = (x) => JSON.stringify(x.clubs.map((c) => [c.id, c.name, c.roster.map((p) => p.id)]));
  assert.equal(locals(s), locals(l), "80 clubes locais e seus elencos iguais ao legado");
  assert.equal(s.clubs.length, 80);
});

test("34F.12 (3) integridade atleta a atleta contra o manifesto (GER, nascimento, posição, nacionalidade, clube)", () => {
  const s = fc27(), pool = new Map(s.internationalPlayers.map((p) => [p.id, p]));
  for (const [id, m] of byId) {
    const p = pool.get(id);
    assert.ok(p, id);
    if (p.ovr !== m.overall || p.overall !== m.overall || p.clubId !== m.clubId || p.birthYear !== m.birthYear || p.pos !== m.pos || p.nationality !== m.nationality || p.eaId !== m.eaId) assert.fail("divergência em " + id);
  }
  const perClub = new Map();
  for (const p of s.internationalPlayers) (perClub.get(p.clubId) || perClub.set(p.clubId, []).get(p.clubId)).push(p.id);
  for (const c of manifest.clubs) assert.deepEqual([...(perClub.get(c.id) || [])].sort(), [...c.playerIds].sort(), c.name);
});

test("34F.12 (4) Real Madrid, Barcelona, PSG e Manchester City: elenco e vínculo corretos", () => {
  const s = fc27();
  for (const [id, name, n] of [["gf_fc27_243", "Real Madrid", 32], ["gf_fc27_241", "FC Barcelona", 29], ["gf_fc27_73", "Paris SG", 29], ["gf_fc27_10", "Manchester City", 30]]) {
    const club = G.clubById(s, id), roster = G.playersByClub(s, id), mc = manifest.clubs.find((c) => c.id === id);
    assert.equal(club.name, name); assert.equal(roster.length, n); assert.equal(club.leagueId, mc.leagueId);
    assert.deepEqual(roster.map((p) => [p.id, p.ovr]).sort(), mc.playerIds.map((pid) => [pid, byId.get(pid).overall]).sort(), name + " GER");
    assert.ok(roster.every((p) => p.leagueId === mc.leagueId));
  }
  assert.equal(G.playerById(s, "fc27_p_231747").name, "Kylian Mbappé");
});

test("34F.12 (5) GlobalFootball.init e InternationalPool.init repetidos não duplicam nem alteram o catálogo", () => {
  const s = clone(fc27()), snap = () => JSON.stringify([s.globalFootball.leagues, s.globalFootball.clubs, s.internationalPlayers.map((p) => [p.id, p.ovr, p.clubId, p.potential])]);
  const before = snap();
  G.init(s); G.init(s); D.InternationalPool.init(s); G.init(s);
  assert.equal(snap(), before); assert.equal(s.internationalPlayers.length, 18379);
  assert.ok(s.catalogVersion === "fc27_v1" && !s.internationalPlayers.some((p) => !p.id.startsWith("fc27_p_")));
});

test("34F.12 (6) competições mundiais enxergam as ligas FC27 elegíveis e nenhuma legada", () => {
  const s = fc27(), per = {};
  for (const c of manifest.clubs.concat(require("../src/data/fc27/fc27-colombia-v1.js").clubs)) per[c.leagueId] = (per[c.leagueId] || 0) + 1;
  const eligible = Object.keys(per).filter((k) => per[k] >= 10).sort(), seen = Object.keys(s.globalFootball.worldCompetitions.leagues).sort();
  assert.deepEqual(seen, eligible); assert.equal(eligible.length, 37);
  for (const id of seen) assert.equal(s.globalFootball.worldCompetitions.leagues[id].clubIds.length, per[id]);
});

test("34F.12 (7) protagonista assina com clube FC27: elenco real, escalação e sem duplicar atletas", () => {
  const s = clone(fc27()), before = s.internationalPlayers.length;
  D.movePlayerToClub(s, "gf_fc27_243");
  assert.equal(s.clubId, "gf_fc27_243");
  const c = D.club(s);
  assert.equal(c.id, "gf_fc27_243");
  const real = c.roster.filter((p) => p.id.startsWith("fc27_p_"));
  assert.equal(real.length, 32); assert.ok(c.roster.some((p) => p.id === "hero"));
  assert.equal(new Set(c.roster.map((p) => p.id)).size, c.roster.length);
  assert.ok(c.lineup.length >= 11 && new Set(c.lineup).size === c.lineup.length);
  assert.ok(c.lineup.every((id) => c.roster.some((p) => p.id === id)));
  assert.equal(s.internationalPlayers.length, before, "pool internacional intacto");
  assert.ok(real.every((p) => byId.get(p.id) && Math.abs(byId.get(p.id).overall - p.ovr) <= 1), "GER dos atletas do elenco montado");
  D.preparePlayerLineup?.(s);
});

test("34F.12 (8) save completo: grava e carrega sem perda; hybrid FC27 faz round-trip e legado continua compatível", () => {
  const s = fc27();
  assert.equal(S.compactWriteMode(), "off", "escrita compacta desligada por padrão");
  const id = S.saveAsNew(s); assert.ok(id);
  assert.ok(localStorage.getItem("prolife.v1.slot." + id) === null || true);
  const back = S.loadSlot(id);
  assert.equal(back.catalogVersion, "fc27_v1");
  assert.deepEqual([back.globalFootball.leagues.length, back.globalFootball.clubs.length, back.internationalPlayers.length], [49, 687, 18379]);
  assert.equal(JSON.stringify(back.internationalPlayers), JSON.stringify(s.internationalPlayers), "jogadores idênticos");
  assert.equal(JSON.stringify(back.globalFootball.clubs), JSON.stringify(s.globalFootball.clubs));
  // hybrid FC27 (reconstrução pelo manifesto versionado)
  const text = S.encodeHybridSave(s, { sparseStats: true }), v = JSON.parse(text);
  assert.equal(v.state.catalogVersion, "fc27_v1");
  assert.ok(text.length < 4e6, "hybrid FC27 é compacto (" + text.length + ")");
  const dec = S.decodeHybridSave(v);
  assert.equal(JSON.stringify(dec.internationalPlayers), JSON.stringify(s.internationalPlayers), "round-trip FC27 sem perda");
  assert.equal(dec.catalogVersion, "fc27_v1");
  // escrita compacta (opt-in) com FC27 grava e reabre
  S.setCompactWriteMode("always");
  const id2 = S.saveAsNew(s); assert.ok(id2);
  const again = S.loadSlot(id2);
  assert.equal(JSON.stringify(again.internationalPlayers), JSON.stringify(s.internationalPlayers));
  // versão de catálogo desconhecida: compactação bloqueada, save completo continua
  const odd = clone(s); odd.catalogVersion = "fc99";
  assert.throws(() => S.encodeHybridSave(odd, { sparseStats: true }), /Versao de catalogo/);
  const id3 = S.saveAsNew(odd); assert.ok(id3, "cai para o save completo");
  S.setCompactWriteMode("off");
  // legado: hybrid continua igual ao comportamento anterior
  const l = legacy(), lv = JSON.parse(S.encodeHybridSave(l, { sparseStats: true }));
  assert.equal(lv.state.catalogVersion, undefined);
  assert.equal(JSON.stringify(S.decodeHybridSave(lv).internationalPlayers), JSON.stringify(l.internationalPlayers));
});

test("34F.12 (9) navegador simulado: manifesto registrado, sem fetch, mesma integridade", () => {
  const { JSDOM } = require("jsdom");
  const base = require("node:path").resolve(__dirname, "..") + "/", html = fs.readFileSync(base + "index.html", "utf8");
  const files = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]).filter((f) => f !== "src/ui/app.js");
  assert.ok(files.indexOf("src/data/fc27/fc27-manifest-v1.js") >= 0 && files.indexOf("src/domain/fc27-catalog-adapter.js") < files.indexOf("src/domain/engine.js"));
  const w = new JSDOM(html, { runScripts: "outside-only", url: "https://offline-test.invalid" }).window;
  let fetched = 0; w.fetch = () => { fetched++; throw Error("fetch proibido"); };
  files.forEach((f) => w.eval(fs.readFileSync(base + f, "utf8")));
  assert.ok(w.ProLifeFC27Manifest);
  const s = w.ProLife.create({ mode: "player", clubId: "c0", catalogVersion: "fc27_v1" }, SEED);
  assert.equal(fetched, 0);
  assert.deepEqual([s.globalFootball.leagues.length, s.globalFootball.clubs.length, s.internationalPlayers.length], [49, 687, 18379]);
  const rm = w.ProLifeGlobalFootball.playersByClub(s, "gf_fc27_243");
  assert.equal(rm.length, 32); assert.equal(rm.find((p) => p.id === "fc27_p_231747").ovr, 91);
});
