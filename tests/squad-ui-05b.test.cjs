const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const assets = fs.readFileSync(path.join(root, "tools/assets.cjs"), "utf8");
const app = fs.readFileSync(path.join(root, "src/ui/app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "src/ui/fc27-05b-squad.css"), "utf8");

assert.match(html, /fc27-05b-squad\.css/, "A folha da etapa 05B deve ser carregada");
assert.match(assets, /src\/ui\/fc27-05b-squad\.css/, "A folha da etapa 05B deve entrar no pacote offline");
for (const contract of ["pl-squad-screen", "pl-squad-pitch", "pl-squad-bench", "pl-squad-detail", "data-squad-tab", "data-squad-player"])
  assert.match(app, new RegExp(contract), `Contrato visual ausente: ${contract}`);
assert.match(app, /data-action="lineup"/, "O salvamento existente da escalação deve ser preservado");
assert.doesNotMatch(css, /transform\s*:\s*scale/i, "A responsividade não deve depender de scale");
assert.match(css, /@media\s*\(max-width:\s*900px\)/, "A composição deve possuir breakpoint para telas estreitas");

console.log("squad-ui-05b.test.cjs: ok");
