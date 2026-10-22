"use strict";
// Stage 34F.16 - carreiras FC 27 em IndexedDB (backend falso em memoria; a camada real e exercitada por navegador no fim da etapa).
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("fs"), path = require("path"), { JSDOM } = require("jsdom");
const base = path.join(__dirname, "..") + path.sep;
const html = fs.readFileSync(base + "index.html", "utf8");
const order = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1].split("?")[0]).filter((f) => !/update\.js|avatar/.test(f));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (w, s) => w.document.querySelector(s);
const click = (w, s) => { const el = q(w, s); assert.ok(el, s); el.click(); };
// Backend IndexedDB falso: persiste entre "recarregamentos" (janelas) e pode falhar sob demanda.
class FakeBackend {
  constructor() { this.rows = new Map(); this.failPut = null; this.puts = 0; }
  async getAll() { return [...this.rows.values()].map((r) => JSON.parse(JSON.stringify(r))); }
  async put(rec) { this.puts++; if (this.failPut) { const e = new Error(this.failPut.msg); e.name = this.failPut.name; throw e; } this.rows.set(rec.id, JSON.parse(JSON.stringify(rec))); }
  async del(id) { this.rows.delete(id); }
}
// "Navegador": localStorage persistente (Map) + IndexedDB falso, reaproveitados por varias janelas (recarregamentos).
function browser() { return { backend: new FakeBackend(), ls: new Map() }; }
function openPage(br, { lsQuota } = {}) {
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://offline-test.invalid" }), w = dom.window;
  w.confirm = () => true; w.scrollTo = () => {}; w.URL.createObjectURL = () => "blob:t"; w.URL.revokeObjectURL = () => {};
  for (const [k, v] of br.ls) w.localStorage.setItem(k, v);
  for (const f of order.slice(0, -1)) w.eval(fs.readFileSync(base + f, "utf8"));
  w.ProLifeSave.useIdbBackend(br.backend);
  w.eval(fs.readFileSync(base + order[order.length - 1], "utf8"));
  br.sync = () => { br.ls.clear(); for (let i = 0; i < w.localStorage.length; i++) { const k = w.localStorage.key(i); br.ls.set(k, w.localStorage.getItem(k)); } };
  return w;
}
async function hubReady(w) { for (let i = 0; i < 100 && !q(w, ".career-hub"); i++) await sleep(50); assert.ok(q(w, ".career-hub"), "Central carregada"); }
async function settle(w) { await sleep(150); for (let i = 0; i < 900 && (q(w, "#wiz-busy")); i++) await sleep(100); }
const fill = (w, mode) => {
  // 34F.16 audit: coach now has a dedicated six-stage form; persistence tests should use it
  // instead of assuming the retired shared #creator form still handles new-coach.
  const coach = q(w, "#coach-creation-form");
  if (coach) {
    coach.elements.name.value = "Teste FC27";
    coach.elements.city.value = "Mogi das Cruzes";
    coach.elements.age.value = "35";
    coach.elements.seed.value = "44";
    click(w, '[data-coach-step="5"]');
    return coach;
  }
  const f = q(w, "#creator");
  assert.ok(f, "formulário de criação disponível");
  f.elements.mode.value = mode;
  f.elements.age.value = mode === "coach" ? "35" : "16";
  f.elements.seed.value = "44";
  return f;
};
const submit = (w) => {
  const form = q(w, "#coach-creation-form") || q(w, "#creator");
  assert.ok(form, "formulário de criação para enviar");
  return form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
};
const counts = (s) => [s.globalFootball.leagues.length, s.globalFootball.clubs.length, s.internationalPlayers.length];
async function createFc27(w, mode) {
  click(w, mode === "coach" ? '[data-action="new-coach"]' : '[data-action="new-player"]');
  if (mode === "player") click(w, "[data-w-coach]");
  fill(w, mode); submit(w); await settle(w);
  return w.ProLifeSave.activeId();
}
const toHub = (w) => { if (q(w, ".career-hub")) return; if (!q(w, '[data-action="careers"]')) click(w, '[data-page="save"]'); click(w, '[data-action="careers"]'); };
// 3,7 MB de dados antigos no localStorage (save legado completo real + enchimento) preservados.
function seedLegacy(br) {
  const w = openPage(br);
  const id = w.ProLifeSave.saveAsNew(w.ProLife.create({ mode: "player", age: 16 }, 44));
  assert.ok(id);
  const have = w.ProLifeSave.storageUsage().used, target = 3.7 * 1024 * 1024;
  if (have < target) w.localStorage.setItem("prolife.legacy.fill", "x".repeat(Math.floor(target - have)));
  br.sync();
  return { id, text: br.ls.get("prolife.v1.slot." + id), total: [...br.ls].reduce((n, [k, v]) => n + k.length + v.length, 0) };
}

test("34F.16 (1) com ~3,7 MB antigos no localStorage: cria, salva e reabre carreira FC 27 (IndexedDB) sem tocar nos dados antigos", async () => {
  const br = browser(), legacy = seedLegacy(br);
  assert.ok(legacy.total > 3.6 * 1024 * 1024, "dados antigos ocupam ~3,7 MB");
  const lsBefore = new Map(br.ls);
  let w = openPage(br); await hubReady(w);
  const id = await createFc27(w, "coach");
  assert.ok(id, "carreira criada"); assert.equal(q(w, "#save-fail"), null, "sem diálogo de falha");
  assert.ok(q(w, ".game-shell"));
  assert.ok(br.backend.rows.has(id), "gravada no IndexedDB");
  br.sync();
  assert.equal(br.ls.has("prolife.v1.slot." + id), false, "nenhum save completo duplicado no localStorage");
  for (const [k, v] of lsBefore) if (k !== "prolife.v1.active" && k !== w.ProLifeSave.ACTIVE_KEY && !k.startsWith("prolife.ui.")) assert.equal(br.ls.get(k), v, "dado antigo intacto: " + k);
  assert.equal(br.ls.get("prolife.v1.slot." + legacy.id), legacy.text, "save legado byte a byte");
  // recarrega a página
  w = openPage(br); await hubReady(w);
  const slots = w.ProLifeSave.listSlots(); assert.equal(slots.length, 2);
  const badges = [...w.document.querySelectorAll(".career-slots .catalog-badge")].map((x) => x.textContent).sort();
  assert.deepEqual(badges, ["CLÁSSICA", "FC 27"]);
  click(w, `.career-slots [data-load-slot="${id}"]`); await sleep(100);
  assert.ok(q(w, ".game-shell"), "reaberta após recarregar");
  const s = w.ProLifeSave.loadSlot(id);
  assert.equal(s.catalogVersion, "fc27_v1"); assert.deepEqual(counts(s), [49, 687, 18379]); assert.equal(s.mode, "coach");
  // save clássico continua abrindo
  toHub(w); click(w, `.career-slots [data-load-slot="${legacy.id}"]`); assert.ok(q(w, ".game-shell"));
});

test("34F.16 (2) cinco carreiras FC 27 simultâneas: criadas, recarregadas e íntegras; autosave persiste só na carreira certa", async () => {
  const br = browser();
  let w = openPage(br); await hubReady(w);
  const ids = [];
  for (let i = 0; i < 5; i++) {
    if (i) toHub(w);
    ids.push(await createFc27(w, i % 2 ? "player" : "coach"));
  }
  assert.equal(new Set(ids).size, 5);
  await w.ProLifeSave.idbFlush();
  assert.equal(br.backend.rows.size, 5);
  br.sync(); for (const id of ids) assert.equal(br.ls.has("prolife.v1.slot." + id), false);
  const used = w.ProLifeSave.storageUsage(); assert.ok(used.used < 50000, "localStorage praticamente vazio: " + used.used);
  // autosave na 3ª carreira
  toHub(w); click(w, `.career-slots [data-load-slot="${ids[2]}"]`);
  const st = w.ProLifeSave.loadSlot(ids[2]); const before = br.backend.rows.get(ids[0]).text, before3 = br.backend.rows.get(ids[2]).text;
  st.day += 0; st.news = st.news || []; st.news.unshift({ id: "marca", title: "m", body: "b", day: st.day, season: st.season });
  assert.equal(w.ProLifeSave.save(st), true); await w.ProLifeSave.idbFlush();
  assert.notEqual(br.backend.rows.get(ids[2]).text, before3, "autosave gravado");
  assert.equal(br.backend.rows.get(ids[0]).text, before, "outras carreiras intactas");
  // recarrega e confere as cinco
  w = openPage(br); await hubReady(w);
  assert.equal(w.ProLifeSave.listSlots().length, 5);
  for (const id of ids) { const s = w.ProLifeSave.loadSlot(id); assert.ok(s, id); assert.equal(s.catalogVersion, "fc27_v1"); assert.deepEqual(counts(s), [49, 687, 18379]); }
  assert.ok(w.ProLifeSave.loadSlot(ids[2]).news.some((n) => n.id === "marca"), "autosave sobreviveu ao recarregar");
  assert.equal([...w.document.querySelectorAll(".career-slots .catalog-badge")].filter((x) => x.textContent === "FC 27").length, 5);
});

test("34F.16 (3) falha de gravação no IndexedDB preserva o último save válido (autosave e nova carreira)", async () => {
  const br = browser();
  let w = openPage(br); await hubReady(w);
  const id = await createFc27(w, "coach"); await w.ProLifeSave.idbFlush();
  const good = br.backend.rows.get(id).text;
  const fails = []; w.ProLifeSave.onSaveFailure((e) => fails.push(e));
  br.backend.failPut = { name: "QuotaExceededError", msg: "disco cheio" };
  const st = w.ProLifeSave.loadSlot(id); st.news = st.news || []; st.news.unshift({ id: "x", title: "x", body: "x", day: st.day, season: st.season });
  assert.equal(w.ProLifeSave.save(st), true); await w.ProLifeSave.idbFlush();
  assert.equal(fails.length, 1); assert.equal(fails[0].reason, "quota");
  assert.equal(br.backend.rows.get(id).text, good, "registro anterior intacto");
  assert.equal(w.ProLifeSave.listSlots().length, 1);
  // nova carreira com falha: diálogo, nada criado, anterior intacto
  toHub(w); click(w, '[data-action="new-coach"]'); fill(w, "coach"); submit(w); await settle(w);
  assert.ok(q(w, "#save-fail")); assert.match(q(w, "#save-fail").textContent, /não tem mais espaço/);
  assert.equal(br.backend.rows.size, 1); assert.equal(br.backend.rows.get(id).text, good);
  click(w, "#save-fail [data-save-fail-close]");
  // volta ao normal
  br.backend.failPut = null; submit(w); await settle(w);
  assert.equal(br.backend.rows.size, 2);
  w = openPage(br); await hubReady(w);
  assert.equal(w.ProLifeSave.listSlots().length, 2); assert.ok(w.ProLifeSave.loadSlot(id));
});

test("34F.16 (4) renomear e excluir carreiras do IndexedDB; sem IndexedDB mantém o comportamento anterior", async () => {
  const br = browser();
  const w = openPage(br); await hubReady(w);
  const a = await createFc27(w, "coach"); toHub(w); const b = await createFc27(w, "player");
  const S = w.ProLifeSave;
  assert.equal(S.renameSlot(a, "Minha FC27"), true); await S.idbFlush();
  assert.equal(br.backend.rows.get(a).summary.label, "Minha FC27");
  assert.equal(S.removeSlot(b), true); await S.idbFlush();
  assert.equal(br.backend.rows.has(b), false); assert.equal(S.listSlots().length, 1);
  assert.equal(S.loadSlot(b), null);
  // sem backend: saveAsNewAsync cai no caminho sincrono anterior
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://offline-test.invalid" });
  for (const f of order.slice(0, -1)) dom.window.eval(fs.readFileSync(base + f, "utf8"));
  assert.equal(dom.window.ProLifeSave.ready(), null); assert.equal(dom.window.ProLifeSave.storageMode(), "localStorage");
});

// Camada real (makeIdbBackend) contra uma implementação mínima da API de eventos do IndexedDB.
function fakeIndexedDB() {
  const stores = {};
  const req = (run) => { const r = { result: undefined, error: null }; setTimeout(() => { try { r.result = run(); r.onsuccess && r.onsuccess(); } catch (e) { r.error = e; r.onerror && r.onerror(); } }, 0); return r; };
  return {
    open(name) {
      const r = { result: null, error: null };
      setTimeout(() => {
        const db = {
          objectStoreNames: { contains: (n) => !!stores[n] },
          createObjectStore: (n) => { stores[n] = new Map(); },
          transaction(n) {
            const t = { error: null }, st = stores[n]; let pending = 0;
            const wrap = (fn) => { pending++; const rq = {}; setTimeout(() => { rq.result = fn(); pending--; if (!pending) setTimeout(() => t.oncomplete && t.oncomplete(), 0); }, 0); return rq; };
            t.objectStore = () => ({ getAll: () => wrap(() => [...st.values()]), put: (rec) => wrap(() => { st.set(rec.id, JSON.parse(JSON.stringify(rec))); return rec.id; }), delete: (id) => wrap(() => { st.delete(id); }) });
            return t;
          },
        };
        r.result = db; r.onupgradeneeded && r.onupgradeneeded(); r.onsuccess && r.onsuccess();
      }, 0);
      return r;
    },
  };
}
test("34F.16 (5) backend IndexedDB real: abre, grava, lista, apaga e reidrata após recarregar", async () => {
  const idb = fakeIndexedDB();
  const load = () => {
    const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://offline-test.invalid" }), w = dom.window;
    w.indexedDB = idb;
    for (const f of order.slice(0, -1)) w.eval(fs.readFileSync(base + f, "utf8"));
    return w;
  };
  let w = load(); const S = w.ProLifeSave;
  const ready = S.ready(); assert.ok(ready && typeof ready.then === "function");
  assert.equal(JSON.stringify(await ready), '{"ok":true,"count":0}'); assert.equal(S.storageMode(), "indexeddb");
  const id = await S.saveAsNewAsync(w.ProLife.create({ mode: "coach", age: 35, catalogVersion: "fc27_v1" }, 44));
  assert.ok(id); await S.idbFlush();
  assert.equal(w.localStorage.getItem("prolife.v1.slot." + id), null, "nada no localStorage");
  w = load(); assert.equal(JSON.stringify(await w.ProLifeSave.ready()), '{"ok":true,"count":1}');
  const s = w.ProLifeSave.loadSlot(id); assert.equal(s.catalogVersion, "fc27_v1"); assert.deepEqual(counts(s), [49, 687, 18379]);
  w.ProLifeSave.removeSlot(id); await w.ProLifeSave.idbFlush();
  w = load(); assert.equal(JSON.stringify(await w.ProLifeSave.ready()), '{"ok":true,"count":0}');
});
