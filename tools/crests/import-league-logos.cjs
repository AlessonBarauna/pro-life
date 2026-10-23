#!/usr/bin/env node
"use strict";
// PRO-LIFE: importa logos de liga de uma pasta LOCAL do usuario. Sem rede.
// Nome do arquivo = id da liga (ex.: gf_fc27_bundesliga.svg) OU o nome da liga (ex.: Bundesliga.png, "Premier League.svg").
// Uso: node tools/crests/import-league-logos.cjs "C:\\pasta\\logos"          (simulacao)
//      node tools/crests/import-league-logos.cjs "C:\\pasta\\logos" --apply  (copia e registra)
// Lista de ligas aceitas: tools/crests/league-index.json. Logos podem ser marcas registradas: uso e responsabilidade do usuario.
const fs = require("fs"), path = require("path"), L = require("./crest-lib.cjs");
const ROOT = path.join(__dirname, "..", ".."), dir = process.argv[2], apply = process.argv.includes("--apply");
if (!dir || !fs.existsSync(dir)) { console.error("Informe uma pasta existente."); process.exit(2); }
const index = JSON.parse(fs.readFileSync(path.join(__dirname, "league-index.json"), "utf8"));
const byKey = new Map(); for (const l of index) { byKey.set(l.id.toLowerCase(), l); byKey.set(L.norm(l.name), l); }
const outDir = path.join(ROOT, "src/assets/league-logos"), dataFile = path.join(ROOT, "src/ui/league-logos-data.js");
const cur = {}; try { const t = fs.readFileSync(dataFile, "utf8"), m = /ProLifeLeagueLogoData\|\|\{\}/.test(t) && /Object\.assign\(root\.ProLifeLeagueLogoData,(\{[\s\S]*?\})\)/.exec(t); if (m) Object.assign(cur, JSON.parse(m[1])); } catch (e) { /* ok */ }
const r = { ok: 0, skipped: [], rejected: [] };
for (const f of fs.readdirSync(dir)) {
  const m = /^(.+)\.(png|webp|svg)$/i.exec(f); if (!m) { r.skipped.push(f + " (formato)"); continue; }
  const lg = byKey.get(m[1].toLowerCase()) || byKey.get(L.norm(m[1])); if (!lg) { r.skipped.push(f + " (liga nao encontrada)"); continue; }
  const buf = fs.readFileSync(path.join(dir, f)), kind = L.bufferKind(buf);
  if (!kind || buf.length > 600000) { r.rejected.push(f + " (invalido ou grande demais)"); continue; }
  if (kind === "svg" && !L.svgIsSafe(buf.toString("utf8"))) { r.rejected.push(f + " (svg inseguro)"); continue; }
  r.ok++; if (!apply) { console.log("+ " + f + " -> " + lg.name); continue; }
  fs.mkdirSync(outDir, { recursive: true }); const name = lg.id + "." + kind; fs.writeFileSync(path.join(outDir, name), buf); cur[lg.id] = "src/assets/league-logos/" + name;
}
if (apply) fs.writeFileSync(dataFile, "/* PRO-LIFE: registro de logos de liga (gerado por tools/crests/import-league-logos.cjs). Vazio = selo provisorio automatico. */\n(function(root){\"use strict\";root.ProLifeLeagueLogoData=root.ProLifeLeagueLogoData||{};Object.assign(root.ProLifeLeagueLogoData," + JSON.stringify(cur, null, 1) + ");})(typeof globalThis!==\"undefined\"?globalThis:this);\n");
console.log(JSON.stringify({ modo: apply ? "aplicado" : "simulacao", importaveis: r.ok, ignorados: r.skipped.length, rejeitados: r.rejected.length }, null, 1));
r.skipped.slice(0, 15).forEach((x) => console.log("  ignorado:", x)); r.rejected.slice(0, 10).forEach((x) => console.log("  rejeitado:", x));
