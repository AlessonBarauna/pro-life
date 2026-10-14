const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("05D: folha visual do calendário participa da aplicação e do build", () => {
  const index = read("index.html");
  const assets = read("tools/assets.cjs");
  assert.match(index, /fc27-05d-calendar\.css/);
  assert.match(assets, /fc27-05d-calendar\.css/);
});

test("05D: calendário aprovado mantém grade, detalhe, agenda e resultados", () => {
  const calendar = read("src/ui/calendar.js");
  const app = read("src/ui/app.js");
  const css = read("src/ui/fc27-05d-calendar.css");
  assert.match(calendar, /calendar-month-tabs/);
  assert.match(calendar, /calendar-agenda-card/);
  assert.match(calendar, /calendar-results-card/);
  assert.match(app, /pl-calendar-screen/);
  assert.match(app, /cal-selected-match/);
  assert.match(css, /grid-template-areas:"detail calendar" "agenda agenda"/);
});

test("05D: ações existentes de navegação e simulação continuam conectadas", () => {
  const calendar = read("src/ui/calendar.js");
  const app = read("src/ui/app.js");
  assert.match(calendar, /data-calendar="prev"/);
  assert.match(calendar, /data-calendar="today"/);
  assert.match(calendar, /data-calendar="next"/);
  assert.match(app, /data-cal-advance/);
  assert.match(app, /D\.advanceToDay/);
  assert.match(app, /data-cal-filter/);
});

test("05D: layout possui adaptações explícitas para tablet e celular", () => {
  const css = read("src/ui/fc27-05d-calendar.css");
  assert.match(css, /@media\(max-width:900px\)/);
  assert.match(css, /@media\(max-width:680px\)/);
  assert.doesNotMatch(css, /transform\s*:\s*scale\(/);
});
