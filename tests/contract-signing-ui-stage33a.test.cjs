const { JSDOM } = require("jsdom"), fs = require("fs"), assert = require("node:assert/strict"), test = require("node:test");
const base = require("node:path").resolve(__dirname, "..") + "/";
const html = fs.readFileSync(base + "index.html", "utf8");
const files = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
const Cine = require("../src/ui/contract-signing.js");
const q = (w, s) => w.document.querySelector(s), qa = (w, s) => [...w.document.querySelectorAll(s)];
const GROUP = { proposals: "market", contract: "profile" };
function click(w, sel) {
  let el = q(w, sel);
  if (!el) { const m = sel.match(/^\[data-page="([^"]+)"\]$/); if (m && GROUP[m[1]]) { q(w, `.game-nav [data-page="${GROUP[m[1]]}"]`).click(); el = q(w, sel); } }
  assert.ok(el, sel); el.click();
}
const get = (w) => { const id = w.ProLifeSave.activeId(); assert.ok(id); return w.ProLifeSave.loadSlot(id); };
const OFFER = { clubId: "gf_real_madrid", salary: 90000, role: "projeto", squadRole: "Titular", durationDays: 1095, signingBonus: 50000, transferType: "permanent" };
function dom() {
  const d = new JSDOM(html, { runScripts: "outside-only", url: "https://offline-test.invalid" }), w = d.window;
  w.confirm = () => true; w.scrollTo = () => {}; w.URL.createObjectURL = () => "blob:t"; w.URL.revokeObjectURL = () => {};
  files.slice(0, -1).forEach((f) => w.eval(fs.readFileSync(base + f, "utf8")));
  return w;
}
function startApp(w, s) {
  assert.ok(w.ProLifeSave.setCompactWriteMode("always"), "estado avançado excede a cota do localStorage do JSDOM sem escrita compacta");
  assert.ok(w.ProLifeSave.saveAsNew(s), "save de teste criado");
  w.eval(fs.readFileSync(base + "src/ui/app.js", "utf8"));
  const load = q(w, "[data-load-slot]"); assert.ok(load); load.click();
}
function mk(w, day) {
  const s = w.ProLife.create({ mode: "player", clubId: "c0" }, 4242);
  s.careerTransferAvailableDay = 0; s.contract = 4000;
  if (day <= 10) s.day = day;
  else for (let i = 0; s.day < day && i < 30; i++) { s.offers = []; w.ProLife.advanceToDay(s, day, { stopBeforeMatches: false }); s.decision = null; }
  assert.ok(day <= 10 ? s.day === day : s.day >= day);
  s.offers = [{ ...OFFER, expires: s.day + 30 }];
  return s;
}
const pcOf = (w, s) => w.ProLife.Career.init(s).playerCareer;
const sig = (w, s) => JSON.stringify({ club: s.clubId, salary: s.salary, wallet: s.wallet, contract: pcOf(w, s).contract });

test("33A (1) assinatura imediata: 3 etapas, integridade de salário/luvas, idempotência e reabertura", () => {
  const w = dom(), s0 = mk(w, 10);
  // referência: o mesmo cenário resolvido direto pelo motor
  const wr = dom(), ref = mk(wr, 10), refWallet0 = ref.wallet; wr.ProLife.join(ref, OFFER.clubId, OFFER.salary);
  startApp(w, s0);
  const before = get(w), wallet0 = before.wallet;
  click(w, '[data-page="proposals"]'); click(w, "[data-neg-open]"); click(w, "[data-neg-sign]");
  assert.ok(q(w, '.cine[data-kind="sign"][data-step="1"]'), "etapa 1: reunião com o representante");
  assert.ok(q(w, ".cine").textContent.includes("Real Madrid"));
  assert.ok(q(w, "[data-cine-skip]") && q(w, "[data-cine-close]"), "pular e fechar disponíveis");
  assert.equal(get(w).clubId, before.clubId, "abrir não altera a carreira");
  q(w, ".cine").ownerDocument.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  assert.ok(!q(w, ".cine"), "Esc fecha"); assert.equal(sig(w, get(w)), sig(w, before), "fechar não altera nada");
  click(w, "[data-neg-sign]"); click(w, "[data-cine-skip]");
  assert.ok(q(w, '.cine[data-step="2"]'), "pular vai ao contrato"); assert.ok(q(w, ".cine.skip"));
  const doc = q(w, ".cine-doc").textContent;
  for (const k of ["Real Madrid", "Salário", "Luvas de assinatura", "Duração", "Titular", "3 ano(s)"]) assert.ok(doc.includes(k), k);
  assert.equal(get(w).clubId, before.clubId, "revisar não assina");
  click(w, "[data-cine-back]"); assert.ok(q(w, '.cine[data-step="1"]')); click(w, "[data-cine-next]");
  click(w, "[data-cine-sign]");
  assert.ok(q(w, '.cine[data-step="3"]'), "etapa 3"); assert.ok(q(w, ".cine-sig.draw") && q(w, ".cine-stamp"), "animação de assinatura");
  assert.ok(q(w, ".cine-result").textContent.includes("Bem-vindo"));
  const after = get(w);
  assert.equal(after.clubId, OFFER.clubId); assert.equal(after.wallet - wallet0, ref.wallet - refWallet0, "luvas (líquidas) iguais ao motor, uma única vez"); assert.ok(after.wallet > wallet0);
  assert.equal(sig(w, after), sig(wr, ref), "mesmo resultado do motor direto (salário, luvas, contrato)");
  const nTr = (x, ww) => (ww.ProLife.Career.init(x).transfers || []).filter((t) => t.to === "Real Madrid" && t.day === x.day).length;
  assert.equal(nTr(after, w), nTr(ref, wr), "mesmo número de transferências do motor (sem duplicar)"); assert.ok(nTr(after, w) <= 1);
  assert.equal(q(w, "[data-cine-sign]"), null, "botão de assinar some: não há segunda confirmação");
  click(w, "[data-cine-present]");
  const pres = q(w, '.cine[data-kind="present"]'); assert.ok(pres, "apresentação oficial na transferência efetiva");
  for (const k of ["Bem-vindo ao Real Madrid", "Novo desafio", "Papel de Titular"]) assert.ok(pres.textContent.includes(k), k);
  assert.ok(q(w, ".cine-shirt"));
  click(w, "[data-cine-close]"); assert.ok(!q(w, ".cine"));
  click(w, '[data-page="contract"]');
  assert.ok(q(w, ".cine-page .cine-doc.signed").textContent.includes("Real Madrid"), "contrato acessível depois");
  click(w, '[data-cine-open="present"]'); assert.ok(q(w, '.cine[data-kind="present"]')); click(w, "[data-cine-close]");
  click(w, '[data-cine-open="contract"]'); assert.ok(q(w, '.cine[data-kind="agreement"]')); click(w, "[data-cine-close]");
  assert.equal(sig(w, get(w)), sig(w, after), "abrir/fechar telas não altera dados nem repete luvas");
  // salvar/recarregar: contrato continua acessível e sem apresentação repetida em novo render
  w.ProLifeSave.save(get(w)); click(w, '[data-page="home"]'); assert.ok(!q(w, ".cine"), "sem reapresentação");
});

test("33A (2) acordo futuro: continua no clube atual, acordo pendente visualizável, sem duplicar e sem apresentação antecipada", () => {
  const w = dom(), s0 = mk(w, 62); startApp(w, s0);
  const before = get(w);
  click(w, '[data-page="proposals"]'); click(w, "[data-neg-open]"); click(w, "[data-neg-sign]"); click(w, "[data-cine-next]");
  const doc = q(w, ".cine-doc").textContent;
  assert.ok(doc.includes("Transferência prevista") && doc.includes("continua"), "deixa claro que permanece no clube atual");
  click(w, "[data-cine-sign]");
  assert.ok(q(w, '.cine[data-step="3"]')); assert.ok(q(w, ".cine-result").textContent.includes("continua"));
  assert.ok(q(w, ".cine-stamp").textContent.includes("ACORDO"));
  assert.equal(q(w, "[data-cine-present]"), null, "sem apresentação antes da data");
  const s1 = get(w), ag = pcOf(w, s1).marketState.signedAgreement;
  assert.ok(ag && ag.clubId === OFFER.clubId && ag.startDay > s1.day);
  assert.equal(s1.clubId, before.clubId, "não troca de clube antes da janela"); assert.equal(s1.wallet, before.wallet, "luvas não pagas antes da transferência");
  click(w, "[data-cine-agreement]"); assert.ok(q(w, '.cine[data-kind="agreement"]')); click(w, "[data-cine-close]");
  assert.ok(q(w, ".cine-banner [data-cine-open=\"agreement\"]"), "acordo pendente visível em Minhas propostas");
  assert.ok(q(w, ".cine-banner").textContent.includes(before.clubName || w.ProLife.club(before).name));
  if (!q(w, "[data-neg-sign]")) click(w, "[data-neg-open]");
  click(w, "[data-neg-sign]");
  assert.ok(q(w, '.cine[data-kind="agreement"]'), "com acordo pendente, abre 'Visualizar acordo' em vez de só avisar");
  click(w, "[data-cine-close]");
  assert.equal(JSON.stringify(pcOf(w, get(w)).marketState.signedAgreement), JSON.stringify(ag), "acordo intacto, sem duplicidade");
  assert.equal(get(w).wallet, s1.wallet);
  click(w, '[data-page="contract"]'); assert.ok(q(w, ".cine-banner")); assert.equal(q(w, '[data-cine-open="present"]'), null);
  // chegada efetiva pelo ciclo diário real do motor (transferência agendada concluída sozinha na janela)
  const s2 = get(w);
  for (let i = 0; s2.day < ag.startDay && i < 40; i++) { s2.offers = []; w.ProLife.advanceToDay(s2, ag.startDay, { stopBeforeMatches: false }); s2.decision = null; }
  assert.equal(s2.clubId, OFFER.clubId);
  // LIMITAÇÃO DO MOTOR (engine.js fora do escopo): join reconstrói a oferta a partir de s.offers; se ela expirou até a janela, luvas/duração/papel caem no padrão.
  // Aqui só garantimos que a UI não paga nada a mais: no máximo uma única entrada de luvas.
  assert.ok(s2.wallet >= s1.wallet - 1); assert.ok((pcOf(w, s2).ledger || []).filter((e) => Math.abs(e.amount) === OFFER.signingBonus).length <= 1);
  const w2 = dom(); startApp(w2, s2);
  const pres = q(w2, '.cine[data-kind="present"]'); assert.ok(pres, "apresentação só na transferência efetiva"); assert.ok(pres.textContent.includes("Real Madrid"));
  click(w2, "[data-cine-close]"); click(w2, '[data-page="home"]'); assert.ok(!q(w2, ".cine"), "apresentação não repete");
  assert.equal(get(w2).wallet, s2.wallet, "abrir a apresentação não altera dados");
});

test("33A (3) módulo isolado: campos ausentes omitidos, escape de HTML, estados do documento", () => {
  const html1 = Cine.documentHtml({ clubName: "<b>X</b>", salary: null, bonus: "", duration: undefined }, "draft");
  assert.ok(!html1.includes("<b>X</b>") && html1.includes("&lt;b&gt;"));
  for (const k of ["Salário", "Luvas", "Duração", "Papel"]) assert.ok(!html1.includes(k), k + " ausente não aparece");
  assert.ok(!html1.includes("cine-sig draw") && Cine.documentHtml({ clubName: "A" }, "signing").includes("draw"));
  for (const [kind, step] of [["sign", 1], ["sign", 2], ["sign", 3], ["agreement", 1], ["present", 1]]) {
    const out = Cine.render(kind, step, { clubName: "A", future: true });
    assert.ok(out.includes('role="dialog"') && out.includes("data-cine-close") && !/undefined|NaN|null/.test(out), kind + step);
  }
});

test("33A (4) CSS responsivo, movimento reduzido e script registrado antes do app", () => {
  const css = fs.readFileSync(base + "src/ui/style.css", "utf8");
  assert.match(css, /prefers-reduced-motion[^{]*\{[^}]*\.cine/); assert.match(css, /@media \(max-width: 560px\)[^{]*\{[^}]*\.cine-/);
  assert.ok(files.indexOf("src/ui/contract-signing.js") > -1 && files.indexOf("src/ui/contract-signing.js") < files.indexOf("src/ui/app.js"));
});
