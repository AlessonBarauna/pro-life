const test = require("node:test"), assert = require("node:assert/strict"), fs = require("fs"), path = require("path"), { JSDOM } = require("jsdom");
const base = path.join(__dirname, "..") + path.sep;
const html = fs.readFileSync(base + "index.html", "utf8");
const { scriptPathsFromHtml } = require("./helpers/html-scripts.cjs");
const order = scriptPathsFromHtml(html, { srcOnly: true }).filter((f) => !/update\.js|avatar/.test(f));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function make() {
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://offline-test.invalid" }), w = dom.window;
  w.confirm = () => true; w.scrollTo = () => {}; w.URL.createObjectURL = () => "blob:t"; w.URL.revokeObjectURL = () => {};
  for (const f of order) w.eval(fs.readFileSync(base + f, "utf8"));
  return w;
}
const q = (w, s) => w.document.querySelector(s);
const click = (w, s) => { const el = q(w, s); assert.ok(el, s); el.click(); };
async function settle(w) { await sleep(120); for (let i = 0; i < 600 && q(w, "#wiz-busy"); i++) await sleep(100); }
async function go(w, s) { click(w, s); await settle(w); }
const counts = (s) => ({ leagues: s.globalFootball.leagues.length, clubs: s.globalFootball.clubs.length, players: s.internationalPlayers.length });
const toHub = (w) => { if (q(w, ".career-hub")) return; if (!q(w, '[data-action="careers"]')) click(w, '[data-page="save"]'); click(w, '[data-action="careers"]'); };
const fillClassic = (w, mode) => {
  const { formForMode } = require("./helpers/ui-navigation.cjs");
  const form = formForMode(w, mode);
  if (mode === "coach") {
    form.elements.name.value = "Treinador FC27";
    form.elements.city.value = "Mogi das Cruzes";
    form.elements.age.value = "35";
    form.elements.seed.value = "44";
  } else {
    form.elements.mode.value = "player";
    form.elements.age.value = "16";
    form.elements.seed.value = "44";
  }
  return form;
};

// 34F.15: FC 27 é a única base para novas carreiras; saves legados continuam abrindo.
function makeWithLegacySlot() {
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://offline-test.invalid" }), w = dom.window;
  w.confirm = () => true; w.scrollTo = () => {}; w.URL.createObjectURL = () => "blob:t"; w.URL.revokeObjectURL = () => {};
  for (const f of order.slice(0, -1)) w.eval(fs.readFileSync(base + f, "utf8"));
  const id = w.ProLifeSave.saveAsNew(w.ProLife.create({ mode: "player", age: 16 }, 44));
  assert.ok(id, "slot legado criado");
  w.eval(fs.readFileSync(base + order[order.length - 1], "utf8"));
  return { w, id };
}
const submit = (w) => { const form = q(w, "#coach-creation-form") || q(w, "#creator"); assert.ok(form, "formulario para submit"); return form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true })); };
const slotText = (w, id) => w.localStorage.getItem("prolife.v1.slot." + id);

test("34F.15 (1) criação sem opção Clássica: assistente e formulário só oferecem FC 27", () => {
  const w = make();
  click(w, '[data-action="new-player"]');
  assert.equal(w.document.querySelectorAll("[data-w-catalog], .catalog-card").length, 0, "sem cartões de base");
  assert.doesNotMatch(q(w, ".wizard").textContent, /Clássica/);
  assert.equal(w.ProLifeCreator.config().catalogVersion, "fc27_v1");
  click(w, "[data-w-coach]");
  assert.equal(q(w, '#creator select[name="catalogVersion"]'), null, "sem seletor");
  assert.equal(q(w, '#creator input[name="catalogVersion"]').value, "fc27_v1");
  assert.match(q(w, "[data-base-info]").textContent, /Base de dados: FC 27/);
  assert.doesNotMatch(q(w, "#creator").textContent, /Clássica/);
});

test("34F.15 (2) jogador: História → Confirmar com 'Base de dados: FC 27'; salva, recarrega e aparece como FC 27 na Central", async () => {
  const w = make();
  click(w, '[data-action="new-player"]');
  click(w, '[data-w-story="regional"]');
  await go(w, "[data-w-next]");
  q(w, '[name="name"]').value = "Jogador FC27"; q(w, '[name="name"]').dispatchEvent(new w.Event("change", { bubbles: true }));
  await go(w, "[data-w-next]");
  click(w, '[data-w-pos="MEI"]');
  await go(w, "[data-w-next]");
  await go(w, "[data-w-next]");
  assert.ok(w.document.querySelectorAll(".offer-card").length >= 1, "oportunidades FC 27");
  await go(w, "[data-w-next]");
  const first = q(w, "[data-w-club]").dataset.wClub; click(w, `[data-w-club="${first}"]`);
  await go(w, "[data-w-next]");
  assert.match(q(w, "[data-w-base]").textContent, /Base de dados: FC 27/);
  click(w, "[data-w-next]"); assert.ok(q(w, "#wiz-busy"), "carregando durante a criação"); await settle(w);
  const slots = w.ProLifeSave.listSlots(); assert.equal(slots.length, 1);
  const s = w.ProLifeSave.loadSlot(slots[0].id);
  assert.equal(s.catalogVersion, "fc27_v1");
  assert.deepEqual(counts(s), { leagues: 49, clubs: 687, players: 18379 });
  assert.equal(s.mode, "player"); assert.equal(s.person.name, "Jogador FC27");
  assert.equal(q(w, "#wiz-busy"), null);
  toHub(w);
  assert.match(q(w, `.career-slots [data-load-slot="${slots[0].id}"]`).closest(".career-slot").querySelector(".catalog-badge").textContent, /FC 27/);
  click(w, `.career-slots [data-load-slot="${slots[0].id}"]`);
  assert.ok(q(w, ".game-shell"), "carreira reaberta pela Central");
});

test("34F.15 (3) treinador FC 27 + segunda carreira sem perder a primeira; selos e integridade", async () => {
  const w = make();
  click(w, '[data-action="new-coach"]');
  fillClassic(w, "coach"); submit(w);
  assert.ok(q(w, "#wiz-busy")); await settle(w);
  const id1 = w.ProLifeSave.activeId(), t1 = slotText(w, id1);
  const c1 = w.ProLifeSave.loadSlot(id1);
  assert.equal(c1.mode, "coach"); assert.equal(c1.catalogVersion, "fc27_v1");
  assert.deepEqual(counts(c1), { leagues: 49, clubs: 687, players: 18379 });
  toHub(w);
  click(w, '[data-action="new-player"]'); click(w, "[data-w-coach]");
  fillClassic(w, "player"); submit(w); await settle(w);
  const id2 = w.ProLifeSave.activeId();
  assert.notEqual(id2, id1, "segunda carreira em novo slot");
  assert.equal(slotText(w, id1), t1, "primeira carreira intacta byte a byte");
  const c2 = w.ProLifeSave.loadSlot(id2);
  assert.equal(c2.mode, "player"); assert.deepEqual(counts(c2), { leagues: 49, clubs: 687, players: 18379 });
  assert.equal(w.ProLifeSave.listSlots().length, 2);
  toHub(w);
  const badges = [...w.document.querySelectorAll(".career-slots .catalog-badge")].map((x) => x.textContent);
  assert.deepEqual(badges, ["FC 27", "FC 27"]);
});

test("34F.15 (4) save legado abre pela Central e é identificado como Clássica", () => {
  const { w, id } = makeWithLegacySlot();
  const card = q(w, `.career-slots [data-load-slot="${id}"]`) ;
  if (!card) { /* app abriu direto o slot ativo */ toHub(w); }
  assert.match(q(w, `.career-slots [data-load-slot="${id}"]`).closest(".career-slot").querySelector(".catalog-badge").textContent, /CLÁSSICA/);
  click(w, `.career-slots [data-load-slot="${id}"]`);
  assert.ok(q(w, ".game-shell"));
  assert.notEqual(w.ProLifeSave.loadSlot(id).catalogVersion, "fc27_v1");
});

test("34F.15 (5) armazenamento cheio: mensagem clara, exportação oferecida, save anterior intacto; falha de gravação idem", async () => {
  const { w, id } = makeWithLegacySlot();
  toHub(w);
  const before = slotText(w, id), idxBefore = w.localStorage.getItem("prolife.v1.slots") ;
  const usage = w.ProLifeSave.storageUsage();
  // enche o armazenamento deixando ~300 mil caracteres livres (menos que uma carreira FC 27)
  const room = usage.approxLimit - usage.used - 300000;
  let chunk = "x".repeat(Math.max(0, room)); try { w.localStorage.setItem("junk.fill", chunk); } catch { for (let n = room; n > 0; n = Math.floor(n * 0.9)) { try { w.localStorage.setItem("junk.fill", "x".repeat(n)); break; } catch {} } }
  click(w, '[data-action="new-coach"]'); fillClassic(w, "coach"); submit(w); await settle(w);
  const dlg = q(w, "#save-fail"); assert.ok(dlg, "diálogo de falha");
  assert.match(dlg.textContent, /armazenamento do navegador está cheio/);
  assert.match(dlg.textContent, /Nenhuma carreira existente foi substituída ou apagada/);
  assert.ok(dlg.querySelector(`[data-export-slot="${id}"]`), "oferece exportar");
  assert.equal(w.ProLifeSave.lastSaveError().reason, "quota");
  assert.equal(slotText(w, id), before, "save anterior intacto");
  assert.equal(w.localStorage.getItem("prolife.v1.slots"), idxBefore, "índice intacto");
  assert.equal(w.ProLifeSave.listSlots().length, 1);
  click(w, `#save-fail [data-export-slot="${id}"]`);
  click(w, "#save-fail [data-save-fail-close]"); assert.equal(q(w, "#save-fail"), null);
  assert.equal(slotText(w, id), before);
  // falha de gravação não relacionada à cota
  w.localStorage.removeItem("junk.fill");
  const orig = w.Storage.prototype.setItem;
  w.Storage.prototype.setItem = function (k, v) { if (String(k).startsWith("prolife.v1.slot.")) throw new w.Error("falha simulada"); return orig.call(this, k, v); };
  submit(w); await settle(w); // o formulário continua aberto
  w.Storage.prototype.setItem = orig;
  assert.ok(q(w, "#save-fail")); assert.match(q(w, "#save-fail").textContent, /recusou a gravação/);
  assert.equal(slotText(w, id), before); assert.equal(w.ProLifeSave.listSlots().length, 1);
});

test("34F.14.1 regressão: scripts do index.html em escopo global compartilhado registram o adaptador FC 27 (sem redeclaração de const)", () => {
  const vm = require("vm");
  const ctx = vm.createContext({ console, setTimeout, clearTimeout, TextEncoder, TextDecoder });
  ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
  const errors = [];
  for (const f of order) { try { new vm.Script(fs.readFileSync(base + f, "utf8"), { filename: f }).runInContext(ctx); } catch (e) { if (/already been declared/.test(e.message)) errors.push(f + ": " + e.message); } }
  assert.deepEqual(errors, [], "nenhum script pode redeclarar const/let global");
  assert.equal(typeof ctx.ProLifeFC27CatalogAdapter, "object");
  assert.doesNotThrow(() => ctx.ProLife.create({ mode: "coach", catalogVersion: "fc27_v1" }, 44));
  assert.throws(() => ctx.ProLife.create({ mode: "coach", catalogVersion: "xyz" }, 44), /catalogVersion desconhecido: xyz/);
});
