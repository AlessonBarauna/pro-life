const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("05A loads the centralized design system after the approved 04J layers", () => {
  const html = read("index.html");
  const approved = html.indexOf("fc27-04j-approved.css");
  const cinematic = html.indexOf("fc27-cinematic.css");
  const system = html.indexOf("fc27-05a-design-system.css");
  assert.ok(approved >= 0 && cinematic > approved && system > cinematic);
  const assets = read("tools/assets.cjs");
  for (const file of ["fc27-04j-approved.css", "fc27-cinematic.css", "fc27-05a-design-system.css", "fc27-stadium-04j.svg", "fc27-stadium-original.svg"])
    assert.ok(assets.includes(file), `asset de publicação ausente: ${file}`);
});

test("05A exposes every requested global career shortcut without changing routes", () => {
  const app = read("src/ui/app.js");
  for (const label of ["Central", "Meu Jogador", "Elenco", "Calendário", "Competições", "Mercado", "Treinamento", "Vida", "Caixa"])
    assert.ok(app.includes(`\"${label}\"`), `atalho global ausente: ${label}`);
  for (const route of ["home", "profile", "squad", "calendar", "competitions", "market", "training", "life", "inbox"])
    assert.match(app, new RegExp(`\\[\\\"${route}\\\",`));
  assert.match(app, /aria-label=\"Navegação principal\"/);
  assert.match(app, /aria-current=\"page\"/);
});

test("05A defines reusable visual states and responsive, reduced-motion behavior", () => {
  const css = read("src/ui/fc27-05a-design-system.css");
  for (const token of ["--pl-accent", "--pl-panel", "--pl-line", "--pl-focus", "--pl-nav-height"])
    assert.ok(css.includes(token), `token ausente: ${token}`);
  for (const selector of [".pl-status--success", ".pl-status--warning", ".pl-status--danger", ".pl-skeleton", ".pl-tooltip", ".pl-empty"])
    assert.ok(css.includes(selector), `componente ausente: ${selector}`);
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.doesNotMatch(css, /transform:\s*scale\(/);
});
