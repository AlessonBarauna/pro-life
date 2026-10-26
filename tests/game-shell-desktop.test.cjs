"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const app = read("src/ui/app.js");
const css = read("src/ui/fc27-game-shell-desktop.css");
const html = read("index.html");
const assets = read("tools/assets.cjs");

test("shell desktop: folha de estilo entra na pagina e no pacote offline", () => {
  assert.match(html, /src\/ui\/fc27-game-shell-desktop\.css/);
  assert.match(assets, /"src\/ui\/fc27-game-shell-desktop\.css"/);
});

test("shell desktop: documento fica fixo e o palco recebe a rolagem", () => {
  assert.match(css, /html,\s*body,\s*#app\s*{[\s\S]*?overflow:hidden/);
  assert.match(css, /\.game-shell\s*{[\s\S]*?height:100dvh;[\s\S]*?overflow:hidden/);
  assert.match(css, /\.game-stage\s*{[\s\S]*?overflow:auto/);
  assert.match(app, /class="game-stage game-stage-\$\{esc\(page\)\}"/);
});

test("shell desktop: Central alterna entre dia de jogo e gestao", () => {
  assert.match(app, /data-desktop-home-view="match"/);
  assert.match(app, /data-desktop-home-view="management"/);
  assert.match(app, /stage\.dataset\.desktopView = next/);
  assert.match(css, /data-desktop-view="match"/);
  assert.match(css, /data-desktop-view="management"/);
});
