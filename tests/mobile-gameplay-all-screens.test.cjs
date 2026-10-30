const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const sm27 = read("src/ui/fc27-mobile-sm27.css");
const screens = read("src/ui/fc27-mobile-screens.css");
const landscape = read("src/ui/fc27-mobile-landscape.css");
const all = sm27 + screens + landscape;

test("celular deitado usa tamanho real: só o corpo da tela rola na vertical, sem escala global", () => {
  assert.doesNotMatch(all, /transform:\s*scale\(var\(--sm27-screen-scale|--sm27-page-fit|--pl-mobile-fit/);
  assert.doesNotMatch(all, /(^|[;{\s])zoom\s*:/m);
  assert.match(sm27, /\.sm27-screen-body[^{]*{[^}]*overflow-y:\s*auto/);
  assert.match(sm27, /\.sm27-screen-body[^{]*{[^}]*overflow-x:\s*hidden/);
  assert.match(sm27, /\.game-stage \{[^}]*overflow:hidden/);
});

test("o shell mobile envolve cada visão não central em um corpo de tela independente", () => {
  const app = read("src/ui/app.js");
  assert.match(app, /const mobileLandscape = window\.matchMedia/);
  assert.match(app, /mobileLandscape \? `<div class="sm27-screen-body">\$\{stageView\}<\/div>` : stageView/);
  assert.match(app, /\$\{stageContent\}<\/div><div class="footer">/);
});

test("não existe paginação por deslocamento em pixels nem blocos escondidos", () => {
  const viewport = read("src/ui/mobile-game-viewport.js");
  assert.doesNotMatch(all, /data-sm27-page|sm27-screen-pager|sm27-page-offset|sm27-unscroll/);
  assert.doesNotMatch(viewport, /paginate|groupWholeBlocks|releaseNestedScroll/);
});

test("telas densas viram abas/seletores em vez de recortes", () => {
  assert.match(screens, /\.pl-squad-tabs|data-m-squad-view/);
  assert.match(screens, /\.cc-fc27-result/);
  assert.match(screens, /\.season-table/);
  assert.match(screens, /\.cc-mobile-scout-profile/);
  const mobile = read("src/ui/mobile-sm27.js");
  assert.match(mobile, /function enhance\(/);
  assert.match(mobile, /lifeSections/);
});

test("a tabela de classificação sempre cabe e o painel de competições não é espremido", () => {
  assert.match(screens, /\.season-table \{[^}]*width:100% !important/);
  assert.doesNotMatch(screens, /\.wa-tabs, \.season-nav/);
  assert.match(screens, /\.season-nav \{[^}]*flex-direction:column/);
});

test("há ferramenta de auditoria para as 6 resoluções exigidas", () => {
  const audit = read("tools/mobile-audit.cjs");
  for (const size of ["667, 375", "740, 360", "780, 360", "844, 390", "896, 414", "932, 430"]) assert.ok(audit.includes(size), size);
});
