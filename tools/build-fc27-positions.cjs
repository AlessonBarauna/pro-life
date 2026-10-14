"use strict";
// 05A.8: gera src/data/fc27/fc27-positions-v1.js a partir dos dados oficiais ja presentes no projeto
// (fc27-ratings-men.json: posicao principal + posicoes alternativas da EA). Nao inventa nada.
// alt  : eaId -> posicoes alternativas especificas ("PE,MD"); a principal vem de positionFC27 do manifesto.
// local: id local (elenco brasileiro com vinculo seguro via fc27-world2026-overrides.json) -> "PRINCIPAL,ALT,..."
const fs = require("fs"), path = require("path");
const dir = path.join(__dirname, "..", "src", "data", "fc27");
const MAP = { GK: "GOL", RB: "LD", LB: "LE", CB: "ZAG", RWB: "ALD", LWB: "ALE", CDM: "VOL", CM: "MC", RM: "MD", LM: "ME", CAM: "MEI", RW: "PD", LW: "PE", CF: "SA", ST: "CA" };
const GROUP = { GOL: "GOL", LD: "DEF", LE: "DEF", ZAG: "DEF", ALD: "DEF", ALE: "DEF", VOL: "MEI", MC: "MEI", MD: "MEI", ME: "MEI", MEI: "MEI", PD: "ATA", PE: "ATA", SA: "ATA", CA: "ATA" };
const ratings = JSON.parse(fs.readFileSync(path.join(dir, "fc27-ratings-men.json"), "utf8")).players;
const alt = {}; let withAlt = 0;
const byEa = new Map();
for (const p of ratings) {
  byEa.set(p.eaId, p);
  const main = MAP[p.position && p.position.shortLabel]; if (!main) continue;
  const extra = [...new Set((p.alternatePositions || []).map((x) => MAP[x.shortLabel]).filter((c) => c && c !== main))].slice(0, 4);
  if (extra.length) { alt[p.eaId] = extra.join(","); withAlt++; }
}
const local = {};
const ov = JSON.parse(fs.readFileSync(path.join(dir, "fc27-world2026-overrides.json"), "utf8")).overrides || [];
for (const o of ov) {
  const r = byEa.get(o.eaId); if (!r) continue;
  const main = MAP[r.position && r.position.shortLabel]; if (!main) continue;
  if (GROUP[main] !== o.localPosition) continue; // divergencia de grupo: nao aplicar sem confirmacao
  const extra = [...new Set((r.alternatePositions || []).map((x) => MAP[x.shortLabel]).filter((c) => c && c !== main))].slice(0, 4);
  local[o.localId] = [main, ...extra].join(",");
}
const out = { format: "PRO_LIFE_FC27_POSITIONS_V1", source: "EA SPORTS FC 27 official ratings (posicao principal e alternativas)", alt, local };
const js = '(function(root){"use strict";\nroot.ProLifeFC27Positions=' + JSON.stringify(out) + ';\nif(typeof module!=="undefined"&&module.exports)module.exports=root.ProLifeFC27Positions;\n})(typeof globalThis!=="undefined"?globalThis:this);\n';
fs.writeFileSync(path.join(dir, "fc27-positions-v1.js"), js);
console.log("jogadores com alternativas:", withAlt, "| locais (Brasil) vinculados:", Object.keys(local).length, "| bytes:", js.length);
