#!/usr/bin/env node
"use strict";
/* PRO-LIFE 04E5 - instalador de escudos (rode no seu PC, com internet).
   - Fonte: Wikimedia Commons (API publica). So aceita arquivo com licenca livre verificavel (PD/CC0/CC BY/CC BY-SA)
     e nome que confere com o clube; ambiguo ou duvidoso fica PENDENTE (nunca chuta).
   - Nao altera IDs, saves nem motor. Backup de club-crests-data.js fora do projeto antes de gravar.
   - Padrao = simulacao (dry-run). Use --apply para baixar e gravar.
   Uso: node tools/crests/install-crests.cjs [--apply] [--limit 40] [--offset 0] [--only gf_fc27_243] [--league serieA] [--refresh] [--upgrade (troca os recortes de mosaico por arquivos livres em alta)]
   Escudos podem ser marcas registradas mesmo com licenca autoral livre: ver trademarkNotice no manifesto. */
const fs = require("node:fs"), path = require("node:path"), os = require("node:os"), vm = require("node:vm"), crypto = require("node:crypto");
const L = require("./crest-lib.cjs");
const ROOT = path.resolve(__dirname, "../.."), DATA = path.join(ROOT, "src/ui/club-crests-data.js"), OUT = path.join(ROOT, "src/assets/club-crests");
const MANIFEST = path.join(OUT, "manifest.json"), CACHE = path.join(__dirname, ".cache"), REPORT = path.join(__dirname, "report.json");
const args = process.argv.slice(2), has = (f) => args.includes(f), val = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };
const APPLY = has("--apply"), LIMIT = Number(val("--limit", 40)), OFFSET = Number(val("--offset", 0)), ONLY = val("--only", null), LEAGUE = val("--league", null), REFRESH = has("--refresh"), UPGRADE = has("--upgrade");
const MOSAIC = path.join(OUT, "manifest-mosaic.json"), mosaic = fs.existsSync(MOSAIC) ? JSON.parse(fs.readFileSync(MOSAIC, "utf8")) : {};
const UA = "PRO-LIFE-crest-installer/1.0 (offline football career game; local dev tool)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastCall = 0;
async function get(url, asBuffer) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const wait = Math.max(0, 1100 - (Date.now() - lastCall)); if (wait) await sleep(wait); lastCall = Date.now();
    const res = await fetch(url, { headers: { "User-Agent": UA, "Accept": asBuffer ? "*/*" : "application/json" } });
    if (res.status === 429 || res.status === 503) { const ra = Number(res.headers.get("retry-after")) || 5 * (attempt + 1); console.log(`  (limite da API, aguardando ${ra}s)`); await sleep(ra * 1000); continue; }
    if (!res.ok) throw new Error("HTTP " + res.status + " " + url.slice(0, 90));
    return asBuffer ? Buffer.from(await res.arrayBuffer()) : res.json();
  }
  throw new Error("limite de tentativas: " + url.slice(0, 90));
}
const loadClubs = () => { const t = fs.readFileSync(DATA, "utf8"); return JSON.parse(t.slice(t.indexOf("=[") + 1, t.lastIndexOf("]") + 1)); };
async function search(club) {
  fs.mkdirSync(CACHE, { recursive: true }); const cf = path.join(CACHE, club.id + ".json");
  if (!REFRESH && fs.existsSync(cf)) return JSON.parse(fs.readFileSync(cf, "utf8"));
  const q = `"${club.name}" (logo OR crest OR escudo OR badge OR emblem)`;
  const url = "https://commons.wikimedia.org/w/api.php?" + new URLSearchParams({ action: "query", format: "json", generator: "search", gsrnamespace: "6", gsrlimit: "10", gsrsearch: q, prop: "imageinfo", iiprop: "url|mime|size|extmetadata", iiextmetadatafilter: "LicenseShortName|LicenseUrl|Artist|NonFree|Restrictions" });
  const json = await get(url); const pages = Object.values((json.query && json.query.pages) || {});
  fs.writeFileSync(cf, JSON.stringify(pages)); return pages;
}
async function main() {
  const clubs = loadClubs(); if (!Array.isArray(clubs) || clubs.length < 700) throw new Error("catalogo nao carregou");
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
  const prior = fs.existsSync(REPORT) ? JSON.parse(fs.readFileSync(REPORT, "utf8")) : {};
  let todo = clubs.filter((c) => (UPGRADE ? !!mosaic[c.id] : !c.verified) && !manifest[c.id] && (REFRESH || !prior[c.id]) && (!ONLY || c.id === ONLY) && (!LEAGUE || c.league === LEAGUE)).slice(OFFSET, OFFSET + LIMIT);
  console.log(`Catalogo: ${clubs.length} clubes · pendentes neste lote: ${todo.length} · modo: ${APPLY ? "APLICAR" : "simulacao (use --apply)"}`);
  const report = prior;
  const byTitle = new Map(Object.entries(manifest).map(([id, m]) => [m.sourceTitle, id]));
  fs.mkdirSync(OUT, { recursive: true }); let installed = 0;
  for (const club of todo) {
    try {
      const pages = await search(club), r = L.pickCandidate(club, pages);
      if (r.status !== "ok") { report[club.id] = { name: club.name, league: club.league, status: r.status, reason: r.reason }; console.log(`- ${club.id} ${club.name}: ${r.status} (${r.reason.slice(0, 110)})`); continue; }
      const { page, ii, lic } = r.pick; const kind = /svg/.test(ii.mime) ? "svg" : /png/.test(ii.mime) ? "png" : "webp";
      const reuse = byTitle.get(page.title);
      if (reuse && manifest[reuse].file) { console.log(`- ${club.id} ${club.name}: mesmo arquivo de ${reuse} (reuso)`); if (APPLY) { const f = club.id + path.extname(manifest[reuse].file); fs.copyFileSync(path.join(OUT, manifest[reuse].file), path.join(OUT, f)); manifest[club.id] = { ...manifest[reuse], file: f, reusedFrom: reuse }; installed++; } continue; }
      if (!APPLY) { console.log(`+ ${club.id} ${club.name}: OK ${page.title} [${lic.license}]`); continue; }
      const buf = await get(ii.url, true), real = L.bufferKind(buf);
      if (!real || real !== kind || buf.length > 400000) { report[club.id] = { name: club.name, league: club.league, status: "pending", reason: "arquivo invalido (" + real + ", " + buf.length + " bytes)" }; console.log(`- ${club.id}: arquivo invalido`); continue; }
      if (real === "svg" && !L.svgIsSafe(buf.toString("utf8"))) { report[club.id] = { name: club.name, league: club.league, status: "pending", reason: "SVG com conteudo inseguro" }; console.log(`- ${club.id}: SVG inseguro, recusado`); continue; }
      const file = `${club.id}.${real}`; fs.writeFileSync(path.join(OUT, file), buf);
      manifest[club.id] = { file, sourceTitle: page.title, sourceUrl: "https://commons.wikimedia.org/wiki/" + encodeURIComponent(page.title.replace(/ /g, "_")), license: lic.license, licenseUrl: lic.licenseUrl, author: lic.author, sha256: crypto.createHash("sha256").update(buf).digest("hex"), fetchedAt: new Date().toISOString(), identityCheck: "nome do arquivo confere com o clube; sem homonimos entre candidatos", trademarkNotice: "Escudo pode ser marca registrada do clube, independentemente da licenca do arquivo." };
      byTitle.set(page.title, club.id); delete report[club.id];
      if (mosaic[club.id]) { const old = mosaic[club.id].file; delete mosaic[club.id]; if (old !== file) { try { fs.unlinkSync(path.join(OUT, old)); } catch (e) { /* ok */ } } } installed++; console.log(`+ ${club.id} ${club.name}: instalado ${file} [${lic.license}]`);
    } catch (e) { console.log(`! ${club.id} ${club.name}: ${e.message}`); }
  }
  if (APPLY) {
    fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2)); fs.writeFileSync(MOSAIC, JSON.stringify(mosaic, null, 2)); fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
    const bk = path.join(os.tmpdir(), "club-crests-data.backup-" + Date.now() + ".js"); fs.copyFileSync(DATA, bk);
    let src = fs.readFileSync(DATA, "utf8"); const a = src.indexOf("=[") + 1, b = src.lastIndexOf("]") + 1; const list = JSON.parse(src.slice(a, b));
    for (const c of list) { const m = manifest[c.id]; if (m && fs.existsSync(path.join(OUT, m.file))) { c.asset = "src/assets/club-crests/" + m.file; c.verified = true; } }
    fs.writeFileSync(DATA, src.slice(0, a) + JSON.stringify(list) + src.slice(b));
    console.log(`Gravado. Backup do catalogo: ${bk}`);
  }
  console.log(`Lote concluido: ${installed} instalado(s). Rode de novo (sem --offset) para o proximo lote: clubes ja resolvidos ou pendentes ficam registrados; use --refresh para tentar de novo os pendentes.`);
}
main().catch((e) => { console.error("Falha:", e.message); process.exit(1); });
