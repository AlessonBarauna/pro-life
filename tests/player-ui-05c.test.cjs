const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const assets = fs.readFileSync(path.join(root, "tools/assets.cjs"), "utf8");
const app = fs.readFileSync(path.join(root, "src/ui/app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "src/ui/fc27-05c-player.css"), "utf8");

assert.match(html, /fc27-05c-player\.css/, "A folha da etapa 05C deve ser carregada");
assert.match(assets, /src\/ui\/fc27-05c-player\.css/, "A folha da etapa 05C deve entrar no pacote offline");
for (const contract of ["pl-player-screen", "pl-player-showcase", "pl-player-rating", "pl-player-summary", "pl-player-trophies", "pl-player-actions"])
  assert.match(app, new RegExp(contract), `Contrato visual ausente: ${contract}`);
for (const preserved of ["appearance-editor", "player-development", "player-career", "contract-agent", "player-transfers"])
  assert.match(app, new RegExp(preserved), `Funcionalidade existente não preservada: ${preserved}`);
assert.doesNotMatch(css, /transform\s*:\s*scale/i, "A responsividade não deve depender de scale");
assert.match(css, /@media\s*\(max-width:\s*820px\)/, "A composição deve possuir breakpoint para telas estreitas");

console.log("player-ui-05c.test.cjs: ok");
