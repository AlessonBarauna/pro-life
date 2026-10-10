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
let shared, intl;
const world = () => (shared ||= make("player"));
const catalogOf = (w) => w.ProLife.seasonCompetitionCatalog(get(w));
const ovOf = (w, id) => w.ProLife.seasonCompetitionOverview(get(w), id);
const rowsOf = (w) => qa(w, ".season-table tbody tr");
const nums = (tr) => [...tr.querySelectorAll("td")].map((x) => x.textContent.trim());
function open(w, id) { toLeague(w); click(w, '[data-page="league"]'); click(w, `[data-season-comp="${id}"]`); }
// Simula a decisão do jogador sobre propostas pendentes (o app não expõe o estado); a pausa em si vem do motor real.
function decideOnResume(w) {
  const D = w.ProLife, real = D.advanceToDay; let n = 0;
  D.advanceToDay = function (s, t, o) { if (n++ > 0) { s.offers = []; try { const pc = s.playerCareer; if (pc) pc.renewalOffer = null; } catch {} } return real.call(this, s, t, o); };
  return () => { D.advanceToDay = real; };
}
function noDup(s) {
  const seen = new Set();
  for (const m of s.matches) { const k = [m.day, m.home, m.away, m.leagueId || m.competitionId || ""].join("|"); assert.ok(!seen.has(k), "resultado duplicado " + k); seen.add(k); }
}

test("31.7C (1) catálogo real: 61 competições listadas e navegáveis, sem exigir region/current", () => {
  const w = world().window, cat = catalogOf(w);
  assert.ok(Array.isArray(cat)); assert.equal(cat.length, 61);
  toLeague(w); click(w, '[data-page="league"]');
  assert.ok(q(w, ".season-center"));
  assert.equal(qa(w, ".season-comp").length, 61);
  for (const c of cat) { click(w, `[data-season-comp="${c.id}"]`); assert.ok(q(w, ".season-head h2").textContent.includes(c.name), c.name); }
});

test("31.7C (2) busca, país e tipo funcionam com os dados reais", () => {
  const w = world().window, cat = catalogOf(w);
  toLeague(w); click(w, '[data-page="league"]');
  const input = q(w, "#season-q"); input.value = "laliga"; input.dispatchEvent(new w.Event("input", { bubbles: true }));
  const found = qa(w, ".season-comp b").map((x) => x.textContent);
  assert.ok(found.includes("LaLiga") && found.length < 10);
  q(w, "#season-q").value = ""; q(w, "#season-q").dispatchEvent(new w.Event("input", { bubbles: true }));
  const country = q(w, "#season-country"); country.value = "Espanha"; country.dispatchEvent(new w.Event("change", { bubbles: true }));
  assert.equal(qa(w, ".season-comp").length, cat.filter((c) => c.country === "Espanha").length);
  q(w, "#season-country").value = ""; q(w, "#season-country").dispatchEvent(new w.Event("change", { bubbles: true }));
  assert.equal(qa(w, ".season-comp").length, 61);
});

test("31.7C (3) Brasileirão e LaLiga: tabela completa com GP, GC e SG reais", () => {
  const w = world().window, cat = catalogOf(w);
  for (const c of [cat.find((x) => /Série A|Brasileir/i.test(x.name) && x.country === "Brasil"), cat.find((x) => x.id === "gf_la_liga")]) {
    assert.ok(c, "competição existe");
    open(w, c.id);
    const ov = ovOf(w, c.id);
    assert.deepEqual(qa(w, ".season-table thead th").map((x) => x.textContent).slice(0, 10), ["#", "Clube", "PTS", "J", "V", "E", "D", "GP", "GC", "SG"]);
    const rows = rowsOf(w); assert.equal(rows.length, ov.standings.length); assert.ok(rows.length >= 16);
    rows.forEach((tr, i) => {
      const c = nums(tr), r = ov.standings[i];
      assert.equal(Number(c[0]), r.rank); assert.ok(c[1].includes(r.clubName));
      assert.equal(Number(c[2]), r.points); assert.equal(Number(c[3]), r.played);
      assert.equal(Number(c[7]), r.goalsFor); assert.equal(Number(c[8]), r.goalsAgainst);
      assert.equal(Number(c[9]), r.goalsFor - r.goalsAgainst); assert.equal(Number(c[9]), r.goalDifference);
    });
    assert.ok(!q(w, ".season-legend"), "sem zonas inventadas");
  }
});

test("31.7C (4) competições sem classificação não ganham tabela fictícia", () => {
  const w = world().window, cat = catalogOf(w);
  const ko = cat.filter((c) => !(ovOf(w, c.id).standings || []).length);
  assert.ok(ko.length > 0, "há competições sem tabela no domínio real");
  for (const c of ko.slice(0, 8)) { open(w, c.id); assert.equal(rowsOf(w).length, 0, c.name); assert.ok(!q(w, ".season-table"), c.name); assert.ok(q(w, ".season-head h2").textContent.includes(c.name)); }
});

test("31.7C (5) visão geral usa competition/currentRound/recentResults/nextFixtures sem 'undefined'", () => {
  const w = world().window;
  for (const c of catalogOf(w).slice(0, 12)) { open(w, c.id); const t = q(w, ".season-center").textContent; assert.ok(!/undefined|NaN|\[object/.test(t), c.name + ": " + t.match(/.{20}(undefined|NaN|\[object).{20}/)); }
});

test("31.7C (6) calendário com eventos reais, agregado por dia; seleção não avança", () => {
  const w = world().window, s0 = get(w), before = s0.day;
  const real = w.ProLife.seasonCalendarEvents(s0, before, before + 30, {});
  assert.ok(Array.isArray(real) && real.length > 0);
  toPage(w, "calendar");
  const cells = qa(w, ".calendar-day"); assert.ok(cells.length >= 28);
  assert.ok(qa(w, ".calendar-event").length < 400, "poucos elementos por dia");
  assert.ok(cells.every((c) => c.querySelectorAll(".calendar-event").length <= 6), "eventos agregados");
  const target = qa(w, ".calendar-day.future")[0]; const day = Number(target.dataset.calendarDay); target.click();
  assert.ok(q(w, `.calendar-day.selected[data-calendar-day="${day}"]`));
  assert.equal(get(w).day, before, "selecionar a data não avança");
  const chip = q(w, '[data-cal-filter="world"]'); chip.click();
  assert.match(q(w, ".career-calendar").dataset.calHide, /world/);
  q(w, '[data-cal-filter="world"]').click();
  assert.equal(get(w).day, before);
});

test("31.7C (7) avanço confirmado até a data usa a API real, retoma pausas e não duplica resultados", () => {
  const w = world().window, before = get(w).day;
  toPage(w, "calendar");
  const cell = qa(w, ".calendar-day.future").find((c) => Number(c.dataset.calendarDay) >= before + 5), target = Number(cell.dataset.calendarDay);
  cell.click(); click(w, "[data-cal-advance]");
  assert.ok(q(w, "#advance-date-modal")); assert.equal(get(w).day, before, "nada simulado antes de confirmar");
  click(w, "[data-adv-cancel]"); assert.equal(get(w).day, before);
  const restore = decideOnResume(w);
  click(w, "[data-cal-advance]"); click(w, "[data-adv-confirm]");
  for (let i = 0; i < 15 && q(w, ".advance-banner"); i++) {
    assert.ok(get(w).day < target);
    assert.match(q(w, ".advance-banner").textContent, /Destino pendente/);
    click(w, "[data-adv-resume]");
  }
  restore();
  assert.ok(!q(w, ".advance-banner"));
  assert.equal(get(w).day, target);
  noDup(get(w));
});

test("31.7C (8) pausa contratual real e continuação depois da decisão", () => {
  const w = world().window, D = w.ProLife, real = D.advanceToDay, st = get(w);
  const target = st.day + 6;
  let n = 0;
  D.advanceToDay = function (s, t, o) {
    n++;
    if (n === 1) s.offers = [{ clubId: s.clubs.find((c) => c.id !== s.clubId).id, salary: 90000, role: "x", squadRole: "Titular", durationDays: 1095, signingBonus: 0, transferType: "permanent", expires: s.day + 3 }];
    else s.offers = [];
    return real.call(this, s, t, o);
  };
  try {
    toPage(w, "calendar");
    const cell = qa(w, ".calendar-day").find((c) => Number(c.dataset.calendarDay) === target); assert.ok(cell);
    cell.click(); click(w, "[data-cal-advance]"); click(w, "[data-adv-confirm]");
    const banner = q(w, ".advance-banner"); assert.ok(banner, "pausa contratual exibida");
    assert.match(banner.textContent, /proposta/i);
    assert.ok(get(w).day < target, "parou antes do destino");
    click(w, "[data-adv-resume]");
    for (let i = 0; i < 15 && q(w, ".advance-banner"); i++) click(w, "[data-adv-resume]");
    assert.equal(get(w).day, target);
    noDup(get(w));
  } finally { D.advanceToDay = real; }
});

test("31.7C (9) carreira internacional: competição do clube, tabela e calendário reais", () => {
  const w = (intl ||= makeIntl()).window, s = get(w);
  assert.equal(s.clubId, "gf_real_madrid");
  toLeague(w); click(w, '[data-page="league"]');
  assert.equal(qa(w, ".season-comp").length, 61);
  click(w, "[data-season-mine]");
  assert.ok(q(w, ".season-head h2").textContent.length > 2);
  assert.ok(rowsOf(w).some((tr) => nums(tr)[1].includes("Real Madrid")), "clube do jogador na tabela");
  assert.ok(q(w, ".season-table tr.highlight"));
  toPage(w, "calendar"); assert.ok(qa(w, ".calendar-day").length >= 28);
  const before = s.day, cell = qa(w, ".calendar-day.future").find((c) => Number(c.dataset.calendarDay) >= before + 4), target = Number(cell.dataset.calendarDay);
  cell.click(); assert.equal(get(w).day, before);
  const restore = decideOnResume(w);
  click(w, "[data-cal-advance]"); click(w, "[data-adv-confirm]");
  for (let i = 0; i < 15 && q(w, ".advance-banner"); i++) click(w, "[data-adv-resume]");
  restore();
  assert.equal(get(w).day, target); noDup(get(w));
});

test("31.7C (10) CSS: agregação e filtros do calendário presentes", () => {
  const css = fs.readFileSync(base + "src/ui/style.css", "utf8"), layer = css.slice(css.indexOf("Stage 31.7C"));
  for (const c of [".calendar-event.agg", ".cal-line", ".cal-group", ".cal-chip.k-mine"]) assert.ok(layer.includes(c), c);
});
