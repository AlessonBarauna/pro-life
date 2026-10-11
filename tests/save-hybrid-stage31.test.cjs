"use strict";
// Stage 31.8C — gravação compacta híbrida, proteção de slots e falhas de armazenamento.
// Usa armazenamento simulado (nenhum save real é lido ou alterado).
const test = require("node:test");
const assert = require("node:assert/strict");

function mockStorage(limit = Infinity) {
  const m = new Map();
  const size = () => [...m].reduce((n, [k, v]) => n + k.length + v.length, 0);
  return {
    m, failKeys: new Set(),
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem(k, v) {
      v = String(v);
      if (this.failKeys.has(k)) throw new Error("QuotaExceededError");
      const next = size() - (m.has(k) ? k.length + m.get(k).length : 0) + k.length + v.length;
      if (next > limit) throw new Error("QuotaExceededError");
      m.set(k, v);
    },
    removeItem: (k) => { m.delete(k); },
    size,
  };
}
global.localStorage = mockStorage();
const D = require("../src/domain/engine.js");
global.ProLife = D;
global.ProLifeCompactSave = require("../src/infrastructure/compact-save.js");
const S = require("../src/infrastructure/save.js");

const mk = (seed, name) => D.create({ mode: "player", name, age: 22, pos: "ATA", clubId: "c0" }, seed);
const reset = (limit) => { global.localStorage = mockStorage(limit); S.setCompactWriteMode("off"); return global.localStorage; };
const slotText = (id) => localStorage.getItem("prolife.v1.slot." + id);
const fmt = (id) => S.detectSaveFormat(JSON.parse(slotText(id)));
let A, B;
const getA = () => (A ||= mk(11, "Alfa Teste"));
const getB = () => (B ||= mk(12, "Beta Teste"));
const clone = (x) => JSON.parse(JSON.stringify(x));

test("31.8C (1) initialSeed registrado e determinismo do catálogo internacional", () => {
  const a = getA();
  assert.equal(a.initialSeed, 11);
  const other = D.create({ mode: "player", name: "Outro Nome", age: 30, pos: "GOL", clubId: "c0" }, 11);
  const fp = global.ProLifeCompactSave.fingerprint;
  assert.equal(fp(other.internationalPlayers), fp(a.internationalPlayers), "catálogo independe da configuração do jogador");
  assert.ok(a.internationalPlayers.length > 14000);
});

test("31.8C (2) padrão: gravação completa; save antigo sem initialSeed continua funcionando", () => {
  reset();
  const s = clone(getA()); delete s.initialSeed;
  const id = S.saveAsNew(s); assert.ok(id);
  assert.equal(fmt(id), "legacy");
  assert.equal(S.loadSlot(id).internationalPlayers.length, s.internationalPlayers.length);
  assert.throws(() => S.encodeHybridSave(s), /Seed/, "sem seed nunca compacta");
  s.day += 1; assert.equal(S.save(S.loadSlot(id)), true);
});

test("31.8C (3) modo always: compacta, reduz o tamanho e reconstrói idêntico; autosave mantém", () => {
  reset(); S.setCompactWriteMode("always");
  const s = clone(getA());
  const id = S.saveAsNew(s); assert.ok(id); assert.equal(fmt(id), "compact");
  const full = JSON.stringify(s).length, comp = slotText(id).length;
  console.log(`# tamanho completo=${full} compacto=${comp} (${Math.round((1 - comp / full) * 100)}% menor)`);
  assert.ok(comp < full * 0.7);
  const back = S.loadSlot(id);
  assert.equal(JSON.stringify(back.internationalPlayers), JSON.stringify(s.internationalPlayers));
  assert.equal(back.day, s.day); assert.equal(back.clubs.length, s.clubs.length, "clubes brasileiros completos");
  back.internationalPlayers[3].__t = 1; D.advance(back, 2);
  assert.equal(S.save(back), true); assert.equal(fmt(id), "compact");
  const again = S.loadSlot(id);
  assert.equal(again.internationalPlayers[3].__t, 1); assert.equal(again.day, back.day);
  // referência: o mesmo estado passando pelo caminho completo (validate normaliza ao carregar)
  const ref = S.validate(clone(back));
  assert.equal(JSON.stringify(again.clubs), JSON.stringify(ref.clubs));
  assert.equal(JSON.stringify(again.internationalPlayers), JSON.stringify(ref.internationalPlayers));
});

test("31.8C (4) catálogo incompatível: save preservado, não abre e nunca é sobrescrito", () => {
  reset(); S.setCompactWriteMode("always");
  const id = S.saveAsNew(clone(getA()));
  const v = JSON.parse(slotText(id)); v.fingerprint = "deadbeef";
  localStorage.setItem("prolife.v1.slot." + id, JSON.stringify(v));
  const raw = slotText(id);
  assert.equal(S.loadSlot(id), null);
  const st = S.slotStatus(id); assert.equal(st.ok, false); assert.match(st.reason, /incompat/i);
  const live = clone(getA()); S.bindStateToSlot(live, id); localStorage.setItem("prolife.v1.activeSlot", id);
  assert.equal(S.save(live), false);
  assert.equal(slotText(id), raw, "conteúdo intacto");
});

test("31.8C (5) corrompido, sem vínculo ou identidade divergente: não sobrescreve", () => {
  reset();
  const id = S.saveAsNew(clone(getA())), raw = slotText(id);
  const unbound = clone(getA()); assert.equal(S.save(unbound), false, "sem vínculo");
  const other = clone(getB()); S.bindStateToSlot(other, id); assert.equal(S.save(other), false, "identidade divergente");
  assert.equal(slotText(id), raw);
  localStorage.setItem("prolife.v1.slot." + id, "{corrompido");
  const mine = clone(getA()); S.bindStateToSlot(mine, id);
  assert.equal(S.save(mine), false); assert.equal(slotText(id), "{corrompido");
  assert.equal(S.loadSlot(id), null);
  localStorage.setItem("prolife.v1.slot." + id, JSON.stringify({ format: "OUTRO", version: 9 }));
  assert.equal(S.save(mine), false);
});

test("31.8C (6) limite de armazenamento: nada é perdido; onQuota compacta só quando necessário", () => {
  const full = JSON.stringify(getA()).length;
  // cota maior que o compacto, menor que o completo
  let st = reset(Math.round(full * 0.8));
  assert.equal(S.saveAsNew(clone(getA())), null, "off: falha sem corromper");
  assert.equal(st.m.size, 0, "nada gravado em falha");
  S.setCompactWriteMode("onQuota");
  const id = S.saveAsNew(clone(getA())); assert.ok(id); assert.equal(fmt(id), "compact");
  // autosave que estoura a cota total: slot anterior permanece legível
  const s = S.loadSlot(id); st.failKeys.add("prolife.v1.slot." + id);
  const before = slotText(id); assert.equal(S.save(s), false); assert.equal(slotText(id), before);
  st.failKeys.clear(); assert.equal(S.save(s), true);
  // falha ao gravar o índice: reverte
  st.failKeys.add("prolife.v1.slots"); const prev = slotText(id); s.day += 1;
  assert.equal(S.save(s), false); assert.equal(slotText(id), prev, "slot restaurado");
  assert.equal(S.loadSlot(id).day, s.day - 1);
  st.failKeys.clear();
  // criação com índice falhando não deixa slot órfão
  const n = [...st.m.keys()].filter((k) => k.includes(".slot.")).length;
  st.failKeys.add("prolife.v1.slots"); assert.equal(S.saveAsNew(clone(getB())), null);
  assert.equal([...st.m.keys()].filter((k) => k.includes(".slot.")).length, n);
});

test("31.8C (7) múltiplos slots, troca, rótulo preservado e reinício da aplicação", () => {
  reset(); S.setCompactWriteMode("always");
  const ia = S.saveAsNew(clone(getA())), ib = S.saveAsNew(clone(getB()));
  assert.notEqual(ia, ib); assert.equal(S.listSlots().length, 2);
  S.renameSlot(ia, "Minha carreira");
  const a = S.loadSlot(ia); assert.equal(a.person.name, "Alfa Teste"); a.day += 1; assert.equal(S.save(a), true);
  assert.equal(S.listSlots().find((x) => x.id === ia).label, "Minha carreira");
  const b = S.loadSlot(ib); assert.equal(b.person.name, "Beta Teste"); assert.equal(S.activeId(), ib);
  // "reinício": novo módulo, mesma storage
  delete require.cache[require.resolve("../src/infrastructure/save.js")];
  const S2 = require("../src/infrastructure/save.js");
  const r = S2.load(); assert.equal(r.person.name, "Beta Teste");
  assert.equal(S2.loadSlot(ia).day, a.day);
  S2.removeSlot(ib); assert.ok(S2.loadSlot(ia));
});

test("31.8C (8) exportação/importação: JSON completo e compacto são aceitos", () => {
  reset(); S.setCompactWriteMode("always");
  const s = clone(getA()), fullText = JSON.stringify(s);
  assert.equal(S.parse(fullText).day, s.day);
  const compactText = S.encodeHybridSave(s);
  const imp = S.parse(compactText);
  assert.equal(JSON.stringify(imp.internationalPlayers), JSON.stringify(s.internationalPlayers));
  assert.throws(() => S.parse("{x"), Error); assert.throws(() => S.parse(JSON.stringify({ format: "X" })), Error);
  assert.ok(S.saveAsNew(imp));
});

test("31.8C (9) save antigo (chave única legada) é migrado sem perda", () => {
  const st = reset(); st.setItem("prolife.v1.save", JSON.stringify(clone(getA())));
  const l = S.load(); assert.ok(l); assert.equal(l.person.name, "Alfa Teste");
  assert.equal(S.listSlots().length, 1);
});
