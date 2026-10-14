"use strict";
// Stage 34F.13 - salvamento seguro de carreiras FC 27 (hibrido automatico, quota e ciclos). Estados descartaveis.
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("fs"), crypto = require("crypto"), path = require("node:path");
const D = require("../src/domain/engine.js"); global.ProLife = D;
// localStorage com cota (caracteres de chave+valor), como o do navegador.
class Quota {
  constructor(cap) { this.m = new Map(); this.cap = cap; }
  used(skip) { let n = 0; for (const [k, v] of this.m) if (k !== skip) n += k.length + v.length; return n; }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { v = String(v); if (this.used(k) + k.length + v.length > this.cap) { const e = new Error("quota"); e.name = "QuotaExceededError"; throw e; } this.m.set(k, v); }
  removeItem(k) { this.m.delete(k); }
}
const BROWSER_CAP = 5 * 1024 * 1024;
global.localStorage = new Quota(BROWSER_CAP);
global.ProLifeCompactSave = require("../src/infrastructure/compact-save.js");
const S = require("../src/infrastructure/save.js");
const G = D.GlobalFootball, Career = D.Career, clone = (o) => JSON.parse(JSON.stringify(o));
const canon = (o) => JSON.stringify(o, (k, v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((x) => [x, v[x]])) : v));
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(path.resolve(__dirname, "..", f))).digest("hex");
const GUARDED = ["src/data/fc27/fc27-manifest-v1.json", "src/data/global-football-seed.js", "src/data/global-football-fc27-world.js", "src/data/global-football-eur-esp.js"];
const before = Object.fromEntries(GUARDED.map((f) => [f, sha(f)]));
const slotText = (id) => localStorage.getItem("prolife.v1.slot." + id);
const mkFc = () => D.create({ mode: "player", clubId: "c0", catalogVersion: "fc27_v1" }, 4242);
// altera a carreira de forma ampla: transferência, contrato, finanças, evolução de atletas, calendário/resultados
function play(s, tag) {
  if (tag === 1) {
    D.movePlayerToClub(s, "gf_fc27_243");
    Career.signContract(s, { clubId: "gf_fc27_243", salary: 9000, durationDays: 1095, signingBonus: 30000, squadRole: "Titular", transferType: "permanent" });
  }
  const p = G.playerById(s, "fc27_p_231747"); p.ovr += 1; p.overall += 1; p.potential = Math.min(99, p.potential + 1);
  G.transferPlayer(s, "fc27_p_" + (tag === 1 ? "192119" : "252371"), "gf_fc27_10");
  s.wallet += 1234 * tag;
  for (let i = 0, t = s.day + 4; s.day < t && i < 20; i++) { D.advanceToDay(s, t, { stopBeforeMatches: false }); s.decision = null; }
  return s;
}
// Referência: o mesmo estado gravado no formato completo e relido (a leitura recalcula derivados, p.ex. potencial dinâmico).
const viaFull = (s) => S.parse(JSON.stringify(s));
const cycle = (s) => { assert.equal(S.save(s), true); const back = S.loadSlot(S.stateSlotId(s)); assert.ok(back); return back; };

test("34F.13 (1) nova carreira FC27 salva sozinha no formato híbrido, dentro da cota, com modo padrão desligado", () => {
  localStorage = new Quota(BROWSER_CAP);
  assert.equal(S.compactWriteMode(), "off");
  const s = mkFc(), id = S.saveAsNew(s);
  assert.ok(id, "salvou sem ativar escrita compacta");
  const text = slotText(id);
  assert.equal(S.detectSaveFormat(JSON.parse(text)), "compact"); assert.ok(text.length < BROWSER_CAP / 2, "tamanho " + text.length);
  const back = S.loadSlot(id);
  assert.equal(back.catalogVersion, "fc27_v1");
  assert.deepEqual([back.globalFootball.leagues.length, back.globalFootball.clubs.length, back.internationalPlayers.length], [49, 687, 18379]);
  assert.equal(canon(back.internationalPlayers), canon(s.internationalPlayers)); assert.equal(canon(back.globalFootball), canon(s.globalFootball));
});

test("34F.13 (2) carreira FC27 modificada preserva tudo após recarregar e em dois ciclos consecutivos, sem duplicar nada", () => {
  localStorage = new Quota(BROWSER_CAP);
  const s0 = mkFc(), id = S.saveAsNew(s0), s1 = S.loadSlot(id);
  play(s1, 1);
  const w1 = s1.wallet, tr1 = Career.init(s1).transfers.length, led1 = Career.init(s1).ledger.length, day1 = s1.day;
  const l1 = cycle(s1);
  assert.equal(l1.clubId, "gf_fc27_243"); assert.equal(l1.day, day1); assert.equal(l1.wallet, w1);
  assert.equal(canon(l1), canon(viaFull(s1)), "ciclo 1: híbrido == completo (transferência, contrato, finanças, atletas, calendário)");
  assert.equal(G.playerById(l1, "fc27_p_231747").ovr, 92); assert.equal(G.playerById(l1, "fc27_p_192119").clubId, "gf_fc27_10");
  assert.equal(Career.init(l1).playerCareer.contract.signingBonus, 30000);
  play(l1, 2);
  const w2 = l1.wallet, l2 = cycle(l1);
  assert.equal(canon(l2), canon(viaFull(l1)), "ciclo 2: híbrido == completo");
  const again = cycle(l2); // salvar sem mudar nada
  assert.equal(canon(again), canon(viaFull(l2)), "salvar sem mudar nada é estável");
  assert.equal(again.wallet, w2); assert.equal(Career.init(again).transfers.length, Career.init(l2).transfers.length);
  assert.equal(Career.init(again).ledger.length, Career.init(l2).ledger.length);
  assert.ok(Career.init(again).transfers.length >= tr1 && Career.init(again).ledger.length >= led1);
  assert.equal(S.detectSaveFormat(JSON.parse(slotText(id))), "compact");
});

test("34F.13 (3) falha de quota preserva o último save válido (sem sobrescrever nem corromper)", () => {
  localStorage = new Quota(BROWSER_CAP);
  const s0 = mkFc(), id = S.saveAsNew(s0), s1 = S.loadSlot(id);
  play(s1, 1); const l1 = cycle(s1);
  const goodRef = canon(viaFull(l1)), good = slotText(id), slots = localStorage.getItem("prolife.v1.slots");
  localStorage.cap = localStorage.used() + 100; // quase cheio
  play(l1, 2); S.validate(l1); // o estado é válido: a rejeição abaixo é só por cota
  assert.equal(S.save(l1), false, "gravação rejeitada por cota");
  assert.equal(slotText(id), good, "slot anterior intacto byte a byte"); assert.equal(localStorage.getItem("prolife.v1.slots"), slots);
  const back = S.loadSlot(id); assert.ok(back); assert.equal(canon(back), goodRef, "carrega exatamente o último save válido"); assert.equal(back.clubId, "gf_fc27_243");
  assert.equal(G.playerById(back, "fc27_p_231747").ovr, 92, "estado do último save válido");
  localStorage.cap = BROWSER_CAP; assert.equal(S.save(l1), true, "volta a salvar quando há espaço");
  assert.equal(canon(S.loadSlot(id)), canon(viaFull(l1)));
});

test("34F.13 (4) save híbrido adulterado ou de catálogo errado não abre nem é sobrescrito", () => {
  localStorage = new Quota(BROWSER_CAP);
  const s0 = mkFc(), id = S.saveAsNew(s0), key = "prolife.v1.slot." + id, v = JSON.parse(slotText(id));
  const wrong = clone(v); delete wrong.state.catalogVersion; // base legada: fingerprint não confere
  localStorage.setItem(key, JSON.stringify(wrong));
  assert.equal(S.loadSlot(id), null); assert.equal(S.slotStatus(id).ok, false);
  const stored = slotText(id);
  const live = mkFc(); S.bindStateToSlot(live, id);
  assert.equal(S.save(live), false, "não sobrescreve slot incompatível"); assert.equal(slotText(id), stored);
  assert.throws(() => S.encodeHybridSave(Object.assign(clone(s0), { catalogVersion: "fc99" }), { sparseStats: true }), /Versao de catalogo/);
  localStorage.setItem(key, JSON.stringify(v)); assert.ok(S.loadSlot(id), "original volta a abrir");
});

test("34F.13 (5) exportação completa continua possível e importa para o formato híbrido", () => {
  localStorage = new Quota(BROWSER_CAP);
  const s = mkFc(), exported = JSON.stringify(s); // mesma serialização de "Exportar save"
  assert.ok(exported.length > BROWSER_CAP, "export completo é grande (" + exported.length + ")");
  const imported = JSON.parse(exported), id = S.saveAsNew(imported);
  assert.ok(id); assert.equal(canon(S.loadSlot(id).internationalPlayers), canon(s.internationalPlayers));
});

test("34F.13 (6) carreira legada: formato e comportamento de salvamento inalterados; catálogos intactos", () => {
  localStorage = new Quota(BROWSER_CAP);
  const l = D.create({ mode: "player", clubId: "c0" }, 4242), id = S.saveAsNew(l);
  assert.ok(id); assert.equal(S.detectSaveFormat(JSON.parse(slotText(id))), "legacy", "legado continua completo por padrão");
  const back = S.loadSlot(id); back.wallet += 777; back.history = back.history || [];
  assert.equal(S.save(back), true); const again = S.loadSlot(id);
  assert.equal(again.wallet, back.wallet); assert.equal(again.catalogVersion, undefined); assert.equal(canon(again), canon(viaFull(back)));
  localStorage = new Quota(BROWSER_CAP); S.setCompactWriteMode("always"); assert.ok(S.saveAsNew(l)); S.setCompactWriteMode("off"); // modo opt-in legado segue funcionando
  for (const f of GUARDED) assert.equal(sha(f), before[f], f + " não foi alterado");
});
