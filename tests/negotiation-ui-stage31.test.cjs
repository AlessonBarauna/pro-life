const { JSDOM } = require("jsdom"),
  fs = require("fs"),
  assert = require("node:assert/strict");
const test = require("node:test");
const base = require("node:path").resolve(__dirname, "..") + "/";
const files = [...fs.readFileSync(base + "index.html", "utf8").matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
function make(mode) {
  const dom = new JSDOM(fs.readFileSync(base + "index.html", "utf8"), {
      runScripts: "outside-only",
      url: "https://offline-test.invalid",
    }),
    w = dom.window;
  w.confirm = () => true;
  w.scrollTo = () => {};
  w.URL.createObjectURL = () => "blob:test";
  w.URL.revokeObjectURL = () => {};
  files.forEach((f) => w.eval(fs.readFileSync(base + f, "utf8")));
  const newCareer = w.document.querySelector(mode === "coach" ? '[data-action="new-coach"]' : '[data-action="new-player"]');
  assert.ok(newCareer, "Central de Carreiras deve oferecer nova carreira");
  newCareer.click();
  if (mode === "player") {
    const classic = w.document.querySelector("[data-w-coach]");
    assert.ok(classic, "Criador de jogador deve permitir abrir o formulário clássico");
    classic.click();
  }
  const form = w.document.querySelector("#creator");
  assert.ok(form, "Formulário de criação deve abrir");
  form.elements.mode.value = mode;
  form.elements.age.value = mode === "coach" ? "35" : "16";
  form.elements.seed.value = "44";
  form.dispatchEvent(
    new w.Event("submit", { bubbles: true, cancelable: true }),
  );
  return dom;
}
function click(w, sel) {
  let el = w.document.querySelector(sel);
  if (!el) {
    const match = sel.match(/^\[data-page="([^"]+)"\]$/);
    const page = match?.[1];
    const groups = {
      training:"profile", statistics:"profile", awards:"profile", legacy:"profile", proposals:"market",
      calendar:"league", matches:"league", competitions:"league", panorama:"league", squad:"league",
      life:"history", finance:"history", sponsorships:"history"
    };
    if (page && groups[page]) {
      const group = w.document.querySelector(`.game-nav [data-page="${groups[page]}"]`);
      if (group) group.click();
      el = w.document.querySelector(sel);
    }
  }
  assert.ok(el, sel);
  el.click();
}
function get(w) {
  const id = w.ProLifeSave.activeId();
  assert.ok(id, "deve existir um slot de carreira ativo");
  return w.ProLifeSave.loadSlot(id);
}

const q = (w, s) => w.document.querySelector(s), qa = (w, s) => [...w.document.querySelectorAll(s)];
function toLeague(w) { const g = q(w, '.game-nav [data-page="league"]'); assert.ok(g); g.click(); }
function toPage(w, p) { click(w, `[data-page="${p}"]`); }
const MINE = (w) => get(w).clubId;


function makeIntl() {
  const dom = new JSDOM(fs.readFileSync(base + "index.html", "utf8"), { runScripts: "outside-only", url: "https://offline-test.invalid" }), w = dom.window;
  w.confirm = () => true; w.scrollTo = () => {}; w.URL.createObjectURL = () => "blob:test"; w.URL.revokeObjectURL = () => {};
  files.slice(0, -1).forEach((f) => w.eval(fs.readFileSync(base + f, "utf8")));
  const D = w.ProLife, s = D.create({ mode: "player", clubId: "c0" }, 4242);
  s.careerTransferAvailableDay = 0; s.day = 10; s.contract = 4000;
  s.offers = [{ clubId: "gf_real_madrid", salary: 90000, role: "x", squadRole: "Titular", durationDays: 1095, signingBonus: 0, transferType: "permanent", expires: s.day + 10 }];
  D.join(s, "gf_real_madrid", 90000);
  assert.equal(s.clubId, "gf_real_madrid");
  assert.ok(w.ProLifeSave.saveAsNew(s), "save internacional criado no storage do teste");
  w.eval(fs.readFileSync(base + "src/ui/app.js", "utf8"));
  const load = w.document.querySelector("[data-load-slot]"); assert.ok(load, "slot internacional listado"); load.click();
  return dom;
}
const NIF = "Não informado";
const offersOf = (w) => get(w).offers.filter((o) => o.expires >= get(w).day);
const idOf = (w, id) => w.ProLife.GlobalFootball.clubIdentity(get(w), id);
const fresh = () => { const w = make("player").window; toPage(w, "proposals"); return w; };
const clean = (el) => assert.ok(!/undefined|NaN|\[object/.test(el.textContent), "texto inválido: " + (el.textContent.match(/.{25}(undefined|NaN|\[object|null).{25}/) || [""])[0]);
const openOf = (w, id) => { click(w, `[data-neg-open="${id}"]`); };

test("31.8B (1) cards de proposta: identidade, local, liga real, reputação, sem undefined/NaN", () => {
  const w = fresh(), offers = offersOf(w);
  assert.ok(offers.length > 0, "o domínio real gera propostas iniciais");
  const cards = qa(w, ".neg-card"); assert.equal(cards.length, offers.length);
  for (const o of offers) {
    const card = q(w, `#transfer-offer-${o.clubId}`), id = idOf(w, o.clubId); assert.ok(card, o.clubId); clean(card);
    assert.ok(card.querySelector(".neg-crest"));
    assert.ok(card.textContent.includes(id.name), "nome");
    if (id.league) assert.ok(card.textContent.includes(id.league.name), "liga real: " + id.league.name);
    assert.ok(!/Liga Horizonte/.test(card.textContent), "sem associação inventada");
    if (id.country) assert.ok(card.textContent.includes(id.country));
    assert.ok(card.textContent.includes(String(id.reputation)) || id.reputation === null);
    for (const k of ["Estado:", "Competição", "Salário", "Luvas", "Duração", "Papel", "Reputação", "expira em"]) assert.ok(card.textContent.includes(k), k);
    for (const b of ["data-neg-open", "data-club-profile"]) assert.ok(card.querySelector(`[${b}]`));
  }
  assert.ok(offers.some((o) => String(o.clubId).startsWith("gf_")), "há proposta internacional real");
});

test("31.8B (2) Conhecer clube: localização, liga, reputação e campos ausentes como 'Não informado'", () => {
  const w = fresh(), o = offersOf(w).find((x) => String(x.clubId).startsWith("gf_")) || offersOf(w)[0], id = idOf(w, o.clubId);
  click(w, `[data-club-profile="${o.clubId}"]`);
  const p = q(w, ".neg-profile"); assert.ok(p); clean(p);
  for (const k of ["Localização", "País", "Cidade", "Região/estado", "Liga", "Classificação atual", "Reputação", "Força", "Estrutura", "Estádio", "Histórico e objetivos"]) assert.ok(p.textContent.includes(k), k);
  assert.ok(p.textContent.includes(id.name));
  if (!id.stadium) assert.ok(/Estádio\s*Não informado/.test(p.textContent));
  assert.ok(/Histórico e objetivos\s*Não informado/.test(p.textContent));
  click(w, "[data-club-profile-close]"); assert.ok(!q(w, ".neg-profile"));
});

test("31.8B (3) central de negociação: seções, comparação lado a lado e sem tensão inventada", () => {
  const w = fresh(), o = offersOf(w)[0];
  openOf(w, o.clubId);
  const c = q(w, ".neg-center"); assert.ok(c); clean(c);
  for (const k of ["CENTRAL DE NEGOCIAÇÃO", "PERFIL ESPORTIVO", "OFERTA FINANCEIRA", "PAPEL E MINUTOS", "ETAPA E INTERESSE", "HISTÓRICO DE CONTRAPROPOSTAS", "Prazo para decidir", "CLUBE ATUAL | CLUBE INTERESSADO"]) assert.ok(c.textContent.includes(k), k);
  assert.ok(!/tensão/i.test(c.textContent), "tensão só se o motor calcular");
  const heads = qa(w, ".neg-compare thead th").map((x) => x.textContent); assert.match(heads[1], /atual/); assert.match(heads[2], /interessado/);
  const labels = qa(w, ".neg-compare tbody th").map((x) => x.textContent);
  for (const k of ["Salário", "Luvas", "Duração", "Papel", "Reputação do clube", "Nível da liga", "Expectativa de minutos", "Objetivos esportivos"]) assert.ok(labels.includes(k), k);
  assert.ok(qa(w, ".neg-compare td.ni").length >= 2, "ausentes = Não informado");
  for (const b of ["data-neg-sign", "data-neg-terms", "data-hold-offer", "data-neg-reject"]) assert.ok(c.querySelector(`[${b}]`), b);
  assert.ok(!c.querySelector("[data-join]") && !c.querySelector("[data-reject]"), "ações finais só após confirmar");
  click(w, "[data-neg-close]"); assert.ok(!q(w, ".neg-center"));
});

test("31.8B (4) assinatura exige confirmação e usa o motor", () => {
  const w = fresh(), before = get(w), o = offersOf(w).find((x) => x.transferType !== "loan") || offersOf(w)[0];
  openOf(w, o.clubId); click(w, "[data-neg-sign]");
  assert.ok(q(w, ".cine [data-cine-next]"), "Stage 33A: reunião com o clube antes do contrato"); assert.equal(get(w).clubId, before.clubId, "nada muda antes de confirmar");
  click(w, "[data-cine-close]"); assert.ok(!q(w, ".cine")); assert.equal(get(w).clubId, before.clubId);
  click(w, "[data-neg-sign]"); click(w, "[data-cine-next]"); assert.equal(get(w).clubId, before.clubId, "revisão ainda não assina"); click(w, "[data-cine-sign]");
  const s = get(w);
  assert.equal(s.clubId, o.clubId, "assinatura efetivada pelo motor (janela aberta em 01/01)");
  assert.ok(!q(w, "[data-join]"), "proposta resolvida");
});

test("31.8B (5) recusa exige confirmação definitiva", () => {
  const w = fresh(), o = offersOf(w)[0], n = offersOf(w).length;
  openOf(w, o.clubId); click(w, "[data-neg-reject]");
  assert.ok(q(w, ".neg-confirm.danger [data-reject]")); assert.equal(offersOf(w).length, n);
  click(w, "[data-neg-cancel]"); assert.equal(offersOf(w).length, n);
  click(w, "[data-neg-reject]"); click(w, ".neg-confirm [data-reject]");
  assert.ok(!offersOf(w).some((x) => x.clubId === o.clubId), "proposta removida pelo motor");
  assert.ok(!q(w, `#transfer-offer-${o.clubId}`));
});

test("31.8B (6) contraproposta: só o termo suportado, histórico e botão bloqueado depois", () => {
  const w = fresh(), o0 = offersOf(w).find((x) => !x.negotiated), before = { salary: o0.salary, bonus: o0.signingBonus };
  openOf(w, o0.clubId); click(w, "[data-neg-terms]");
  assert.ok(q(w, ".neg-terms")); assert.equal(qa(w, ".neg-terms input").length, 0, "sem campos livres que o domínio não suporta");
  click(w, ".neg-terms [data-counter]");
  const o1 = get(w).offers.find((x) => x.clubId === o0.clubId);
  assert.equal(o1.negotiated, true); assert.ok(o1.salary >= before.salary);
  const hist = q(w, ".neg-hist"); assert.ok(hist && hist.textContent.includes("Antes") && hist.textContent.includes("Depois"));
  clean(q(w, ".neg-center"));
  assert.ok(q(w, ".neg-terms [data-counter]").disabled);
});

test("31.8B (7) pedir tempo estende o prazo pelo motor", () => {
  const w = fresh(), o0 = offersOf(w)[0];
  openOf(w, o0.clubId); click(w, "[data-hold-offer]");
  const o1 = get(w).offers.find((x) => x.clubId === o0.clubId); assert.ok(o1.onHold); assert.ok(o1.expires >= o0.expires);
});

test("31.8B (8) Caixa de Entrada resume propostas sem gerenciá-las; Mercado/Calendário/Central intactos", () => {
  const w = fresh();
  click(w, '[data-page="inbox"]');
  assert.ok(q(w, ".neg-note")); assert.equal(qa(w, ".offer").length, 0); clean(q(w, ".neg-note"));
  q(w, '.game-nav [data-page="home"]').click(); assert.ok(q(w, ".career-central-v3"));
  toPage(w, "calendar"); assert.ok(qa(w, ".calendar-day").length >= 28);
  q(w, '.game-nav [data-page="market"]').click(); assert.ok(q(w, "main").textContent.length > 200);
});

test("31.8B (9) proposta internacional após carreira internacional não exibe NaN/undefined", () => {
  const w = (makeIntl()).window;
  toPage(w, "proposals");
  assert.ok(q(w, "main")); clean(q(w, "main"));
  assert.ok(!/Liga Horizonte/.test(q(w, "main").textContent));
});

test("31.8B (10) CSS responsivo e hierarquia (ciano informativo, dourado nas ações)", () => {
  const css = fs.readFileSync(base + "src/ui/style.css", "utf8"), layer = css.slice(css.indexOf("Stage 31.8B"));
  for (const c of [".neg-card", ".neg-center", ".neg-compare", ".neg-confirm", ".neg-crest", "var(--pl-gold)", "var(--pl-cyan)"]) assert.ok(layer.includes(c), c);
  assert.match(layer, /@media\(max-width:760px\)/);
});
