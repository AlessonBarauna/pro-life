#!/usr/bin/env node
"use strict";
// PRO-LIFE 04E: importa escudos de uma pasta LOCAL do usuario. Arquivos devem se chamar <idEA>.png|webp|svg
// (o id EA do time = sufixo de gf_fc27_<id>; ex.: 243.png -> gf_fc27_243). Sem rede. Uso:
//   node tools/crests/import-folder.cjs "C:\\pasta\\escudos"          (simulacao)
//   node tools/crests/import-folder.cjs "C:\\pasta\\escudos" --apply  (copia e atualiza o registro)
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const ROOT = path.join(__dirname, "..", ".."), L = require("./crest-lib.cjs");
const dir = process.argv[2], apply = process.argv.includes("--apply");
if (!dir || !fs.existsSync(dir)) { console.error("Informe uma pasta existente."); process.exit(2); }
const dataFile = path.join(ROOT, "src/ui/club-crests-data.js"); let src = fs.readFileSync(dataFile, "utf8");
const a = src.indexOf("root.ProLifeCrestData=") + 22, b = src.lastIndexOf(";})(");
const list = JSON.parse(src.slice(a, b)), byId = new Map(list.map((c) => [c.id, c]));
const outDir = path.join(ROOT, "src/assets/club-crests"), mfPath = path.join(outDir, "manifest-user-folder.json");
const mf = fs.existsSync(mfPath) ? JSON.parse(fs.readFileSync(mfPath, "utf8")) : {};
const r = { ok: 0, skipped: [], rejected: [] };
for (const f of fs.readdirSync(dir)) {
  const m = /^(\d+)\.(png|webp|svg)$/i.exec(f); if (!m) { r.skipped.push(f + " (nome fora do padrao <id>.ext)"); continue; }
  const id = "gf_fc27_" + m[1], c = byId.get(id); if (!c) { r.skipped.push(f + " (id fora do catalogo)"); continue; }
  const buf = fs.readFileSync(path.join(dir, f)), kind = L.bufferKind(buf);
  if (!kind || buf.length > 600000) { r.rejected.push(f + " (formato invalido ou grande demais)"); continue; }
  if (kind === "svg" && !L.svgIsSafe(buf.toString("utf8"))) { r.rejected.push(f + " (svg inseguro)"); continue; }
  const name = id + "." + kind; r.ok++;
  if (!apply) continue;
  fs.writeFileSync(path.join(outDir, name), buf); c.asset = "src/assets/club-crests/" + name; c.verified = true;
  mf[id] = { name: c.name, file: name, sha256: crypto.createHash("sha256").update(buf).digest("hex"), origin: "pasta local do usuario", licenseStatus: "responsabilidade do usuario", provisional: true };
}
if (apply) { fs.writeFileSync(dataFile, src.slice(0, a) + JSON.stringify(list) + src.slice(b)); fs.writeFileSync(mfPath, JSON.stringify(mf, null, 2)); }
console.log(JSON.stringify({ modo: apply ? "aplicado" : "simulacao", importaveis: r.ok, ignorados: r.skipped.length, rejeitados: r.rejected.length }, null, 1));
r.skipped.slice(0, 10).forEach((x) => console.log("  ignorado:", x)); r.rejected.slice(0, 10).forEach((x) => console.log("  rejeitado:", x));
