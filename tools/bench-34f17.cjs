"use strict";
// Etapa 34F.17 - medicao de desempenho (somente leitura; nao toca em saves reais). Uso: node tools/bench-34f17.cjs [--json]
const fs = require("fs"), path = require("path"), { JSDOM } = require("jsdom");
const base = path.join(__dirname, "..") + path.sep;
const html = fs.readFileSync(base + "index.html", "utf8");
const order = html.match(/src="(src\/[^"]+\.js)"/g).map((x) => x.slice(5, -1)).filter((f) => !/update\.js|avatar/.test(f));
const upto = order.indexOf("src/infrastructure/save.js");
const now = () => Number(process.hrtime.bigint()) / 1e6;
const out = {};
function time(name, fn) { const t = now(); const r = fn(); out[name] = Math.round((now() - t) * 10) / 10; return r; }
async function timeA(name, fn) { const t = now(); const r = await fn(); out[name] = Math.round((now() - t) * 10) / 10; return r; }

const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://offline-test.invalid" }), w = dom.window;
const tLoad = now();
for (const f of order.slice(0, upto + 1)) w.eval(fs.readFileSync(base + f, "utf8"));
out.loadScripts_ms = Math.round(now() - tLoad);

class Fake { constructor() { this.rows = new Map(); } async getAll() { return []; } async put(r) { this.rows.set(r.id, r); } async del(id) { this.rows.delete(id); } }
const fake = new Fake();
w.ProLifeSave.useIdbBackend(fake);

(async () => {
  await w.ProLifeSave.ready();
  const opts = { world: "global", mode: "player", name: "Bench", age: 17, pos: "ATA", clubId: "c0", catalogVersion: "fc27_v1" };
  const s1 = time("create_cold_ms", () => w.ProLife.create(opts, 44));
  const s2 = time("create_warm_ms", () => w.ProLife.create(opts, 45));
  out.players = s1.internationalPlayers.length;
  time("validate_ms", () => w.ProLifeSave.validate(s1));
  const id = await timeA("saveAsNewAsync_cold_ms", () => w.ProLifeSave.saveAsNewAsync(s1));
  time("encode_sparse_warm_ms", () => w.ProLifeSave.encodeHybridSave(s1, { sparseStats: true }));
  time("autosave_sync_part_ms", () => w.ProLifeSave.save(s1));
  time("autosave_sync_part_2_ms", () => w.ProLifeSave.save(s1));
  await w.ProLifeSave.idbFlush();
  const rec = fake.rows.get(id);
  out.save_text_MB = Math.round(rec.text.length / 1048576 * 100) / 100;
  const parsed = time("json_parse_ms", () => JSON.parse(rec.text));
  time("decode_warm_ms", () => w.ProLifeSave.decodeHybridSave(parsed));
  time("loadSlot_ms", () => w.ProLifeSave.loadSlot(id));
  const mem = process.memoryUsage(); out.heapMB = Math.round(mem.heapUsed / 1048576);
  console.log(process.argv.includes("--json") ? JSON.stringify(out) : JSON.stringify(out, null, 1));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
