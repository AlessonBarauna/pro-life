"use strict";
// Stage 33B - termos do acordo assinado são a fonte de verdade na chegada; luvas e transferência uma única vez.
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"); global.ProLife = D;
const Career = D.Career, clone = (o) => JSON.parse(JSON.stringify(o));
const TERMS = { clubId: "c5", salary: 7300, role: "projeto", squadRole: "Titular", durationDays: 1095, signingBonus: 40000, transferType: "permanent" };
const pcOf = (s) => Career.init(s).playerCareer;
const bonusEntries = (s) => (Career.init(s).ledger || []).filter((e) => e.label === "Luvas de assinatura");
const transfersTo = (s, name) => (Career.init(s).transfers || []).filter((t) => t.player === s.person.name && t.to === name);
const Career0 = (s) => D.Career.init(s).playerCareer;
function mk(day, seed = 4242) {
  const s = D.create({ mode: "player", clubId: "c0" }, seed);
  s.careerTransferAvailableDay = 0;
  for (let i = 0; s.day < day && i < 30; i++) { s.offers = []; D.advanceToDay(s, day, { stopBeforeMatches: false }); s.decision = null; }
  return s;
}
const give = (s, over = {}, ttl = 20) => { s.offers = [{ ...TERMS, ...over, expires: s.day + ttl }]; };

test("33B (1) assinatura imediata aplica exatamente os termos negociados e as luvas uma vez", () => {
  const s = mk(10); give(s);
  const w0 = s.wallet, n0 = bonusEntries(s).length;
  D.join(s, TERMS.clubId, TERMS.salary);
  const ct = pcOf(s).contract;
  assert.equal(s.clubId, TERMS.clubId);
  assert.deepEqual([ct.clubId, ct.salary, ct.signingBonus, ct.durationDays, ct.role, ct.signedDay], [TERMS.clubId, TERMS.salary, TERMS.signingBonus, TERMS.durationDays, "Titular", s.day]);
  assert.equal(bonusEntries(s).length, n0 + 1); assert.ok(s.wallet > w0);
  const w1 = s.wallet;
  assert.throws(() => D.join(s, TERMS.clubId, TERMS.salary)); // reexecução não repete
  const r = clone(s); assert.throws(() => D.join(r, TERMS.clubId, TERMS.salary));
  assert.equal(r.wallet, w1); assert.equal(transfersTo(s, D.club(s).name).length, 1);
});

test("33B (2) acordo futuro com proposta original expirada: termos preservados, chegada exata, luvas só na chegada e uma vez", () => {
  const s = mk(62); give(s, {}, 20);
  assert.equal(Career.windowStatus(s).open, false);
  const fromClub = s.clubId, w0 = s.wallet, n0 = bonusEntries(s).length;
  const r = D.join(s, TERMS.clubId, TERMS.salary);
  assert.equal(r.scheduled, true);
  const ag = pcOf(s).marketState.signedAgreement, start = ag.startDay;
  assert.ok(start > s.day && ag.signingBonus === TERMS.signingBonus && ag.durationDays === TERMS.durationDays && ag.squadRole === "Titular");
  assert.equal(s.clubId, fromClub); assert.equal(s.wallet, w0); assert.equal(bonusEntries(s).length, n0, "sem pagamento antecipado");
  // a proposta original expira (marketTick) antes da janela; o acordo permanece
  for (let i = 0; s.day < start - 5 && i < 40; i++) { s.offers = []; D.advanceToDay(s, start - 5, { stopBeforeMatches: false }); s.decision = null; }
  assert.ok(!s.offers.some((o) => o.clubId === TERMS.clubId), "oferta original já não existe");
  assert.equal(s.clubId, fromClub, "não antecipa a janela"); assert.equal(bonusEntries(s).length, n0);
  assert.ok(pcOf(s).marketState.signedAgreement, "acordo ainda pendente");
  const mid = clone(s); // recarregar no meio do caminho não altera nada
  assert.equal(mid.clubId, fromClub);
  for (let i = 0; s.day < start && i < 40; i++) { s.offers = []; D.advanceToDay(s, start, { stopBeforeMatches: false }); s.decision = null; }
  const ct = pcOf(s).contract, arr = pcOf(s).clubArrival;
  assert.equal(s.clubId, TERMS.clubId);
  assert.deepEqual([ct.clubId, ct.salary, ct.signingBonus, ct.durationDays, ct.role, ct.type], [TERMS.clubId, TERMS.salary, TERMS.signingBonus, TERMS.durationDays, "Titular", "permanent"], "termos exatos aplicados pelo motor");
  assert.equal(ct.signedDay, start, "data de efetivação"); assert.equal(arr.promisedRole, "Titular");
  assert.equal(pcOf(s).marketState.signedAgreement, null, "acordo consumido"); assert.equal(pcOf(s).marketState.futureTransfer, null);
  assert.equal(bonusEntries(s).length, n0 + 1, "luvas creditadas uma única vez"); assert.ok(s.wallet > w0);
  const name = D.club(s).name, w1 = s.wallet, tr1 = transfersTo(s, name).length;
  assert.equal(tr1, 1);
  // reexecução + recarregamento + dias seguintes: nada duplica
  const r2 = clone(s); assert.throws(() => D.join(r2, TERMS.clubId, TERMS.salary));
  D.advanceToDay(r2, r2.day + 3, { stopBeforeMatches: false });
  assert.equal(bonusEntries(r2).length, n0 + 1); assert.equal(transfersTo(r2, name).length, 1); assert.equal(pcOf(r2).contract.signingBonus, TERMS.signingBonus);
  assert.equal(s.wallet, w1);
});

test("33B (3) recusa, expiração de proposta não assinada e acordo de outro clube continuam respeitados", () => {
  const s = mk(62); give(s, {}, 5);
  // proposta não assinada expira e não vira acordo nem transferência
  s.day += 8; Career.marketTick(s); // mesma rotina diária que expira propostas
  assert.ok(!(s.offers || []).some((o) => o.clubId === TERMS.clubId));
  assert.throws(() => D.join(s, TERMS.clubId, TERMS.salary), /dispon/i);
  assert.equal(pcOf(s).marketState.signedAgreement, null);
  // recusa
  give(s); D.reject ? D.reject(s, TERMS.clubId) : Career.rejectOffer(s, TERMS.clubId);
  assert.ok(!s.offers.some((o) => o.clubId === TERMS.clubId));
  // acordo com um clube não permite entrar em outro
  s.offers = [{ ...TERMS, expires: s.day + 20 }, { ...TERMS, clubId: "c6", expires: s.day + 20 }];
  D.join(s, TERMS.clubId, TERMS.salary);
  assert.throws(() => D.join(s, "c6", TERMS.salary), /acordo|dispon/i);
  assert.equal(pcOf(s).marketState.signedAgreement.clubId, TERMS.clubId);
});

test("33B (4) modo treinador: join sem acordo continua usando a oferta/padrões existentes", () => {
  const s = D.create({ mode: "coach", clubId: "c0" }, 77);
  assert.equal(s.mode, "coach");
  const before = s.clubId;
  assert.throws(() => D.join(s, "c9", 1000), /dispon|janela|assinou/i);
  assert.equal(s.clubId, before);
});

// ===== UI: apresentação oficial no primeiro contrato (somente na chegada efetiva) =====
const { JSDOM } = require("jsdom"), fs = require("fs");
const base = require("node:path").resolve(__dirname, "..") + "/";
const html = fs.readFileSync(base + "index.html", "utf8");
const files = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
const q = (w, s) => w.document.querySelector(s);
function click(w, sel) {
  let el = q(w, sel);
  if (!el) { const m = sel.match(/^\[data-page="([^"]+)"\]$/), g = m && { proposals: "market", contract: "profile" }[m[1]]; if (g) { q(w, `.game-nav [data-page="${g}"]`).click(); el = q(w, sel); } }
  assert.ok(el, sel); el.click();
}
test("33B (5) primeiro contrato: sem apresentação antes da assinatura; com apresentação única na chegada efetiva", () => {
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://offline-test.invalid" }), w = dom.window;
  w.confirm = () => true; w.scrollTo = () => {}; w.URL.createObjectURL = () => "blob:t"; w.URL.revokeObjectURL = () => {};
  files.forEach((f) => w.eval(fs.readFileSync(base + f, "utf8")));
  q(w, '[data-action="new-player"]').click(); q(w, "[data-w-coach]").click();
  const form = q(w, "#creator"); form.elements.mode.value = "player"; form.elements.age.value = "16"; form.elements.seed.value = "44";
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  const get = () => w.ProLifeSave.loadSlot(w.ProLifeSave.activeId());
  assert.equal(get().clubId, null, "primeiro contrato ainda não assinado");
  assert.ok(!q(w, ".cine"), "nada de apresentação antes da chegada");
  click(w, '[data-page="contract"]'); assert.equal(q(w, '[data-cine-open="present"]'), null);
  click(w, '[data-page="proposals"]'); click(w, "[data-neg-open]"); click(w, "[data-neg-sign]"); click(w, "[data-cine-next]");
  assert.equal(get().clubId, null, "revisar não assina"); click(w, "[data-cine-sign]");
  assert.ok(get().clubId, "chegada efetiva"); assert.ok(Career0(get()).firstClubArrival, "rastro de chegada do primeiro contrato");
  assert.ok(q(w, '.cine[data-step="3"] [data-cine-present]'), "apresentação oferecida no primeiro contrato");
  click(w, "[data-cine-present]"); assert.equal(w.document.querySelectorAll('.cine[data-kind="present"]').length, 1);
  click(w, "[data-cine-close]"); assert.ok(!q(w, ".cine"));
  click(w, '[data-page="home"]'); assert.ok(!q(w, ".cine"), "não reabre sozinha (sem duplicidade)");
  click(w, '[data-page="contract"]'); click(w, '[data-cine-open="present"]'); assert.equal(w.document.querySelectorAll(".cine").length, 1, "reabrir manualmente: uma única instância");
  click(w, "[data-cine-close]");
});
