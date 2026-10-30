"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const app = read("src/ui/app.js");
const css = read("src/ui/fc27-game-shell-desktop.css");
const mobileMenuCss = read("src/ui/fc27-mobile-menu.css");
const pwa = read("src/ui/pwa.js");
const mobileViewport = read("src/ui/mobile-game-viewport.js");
const manifest = read("manifest.webmanifest");
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

test("shell desktop: abas internas do Mercado recebem clique prioritario", () => {
  assert.match(app, /\.cc-market-main-nav \[data-coach-market-area\]/);
  assert.match(app, /coachMarketAreaButton[\s\S]*?stopImmediatePropagation\(\)/);
  assert.match(app, /coachMarketAreaButton[\s\S]*?setMarketArea/);
});

test("menu mobile: Central de Carreiras ocupa o viewport e orienta o modo horizontal", () => {
  assert.match(html, /src\/ui\/fc27-mobile-menu\.css/);
  assert.match(assets, /"src\/ui\/fc27-mobile-menu\.css"/);
  assert.match(app, /career-hub-intro/);
  assert.match(app, /career-orientation-hint/);
  assert.match(mobileMenuCss, /height:100dvh/);
  assert.match(mobileMenuCss, /grid-template-rows:auto auto auto auto minmax\(0,1fr\) auto/);
  assert.match(mobileMenuCss, /\.career-slots\s*{[\s\S]*?overflow:auto/);
});

test("PWA: instala como aplicativo e abre a carreira somente em landscape", () => {
  assert.match(html, /id="pwa-splash"/);
  assert.match(html, /src\/ui\/pwa\.js/);
  assert.match(assets, /"src\/ui\/pwa\.js"/);
  assert.match(manifest, /"display":\s*"standalone"/);
  assert.match(manifest, /"orientation":\s*"landscape"/);
  assert.match(html, /class="mobile-landscape-gate"/);
  assert.match(app, /data-enter-landscape/);
  assert.match(app, /requestFullscreen/);
  assert.match(app, /orientation\?\.lock\?\.\("landscape"\)/);
  assert.match(mobileMenuCss, /\.game-shell > \.game-nav,[\s\S]*?visibility:hidden/);
  assert.match(pwa, /beforeinstallprompt/);
  assert.match(pwa, /Adicionar à Tela de Início/);
  assert.match(pwa, /display-mode: standalone/);
});

test("mobile: criadores não herdam o bloqueio do menu e cabem no viewport horizontal", () => {
  assert.match(mobileMenuCss, /html:has\(\.career-hub\),[\s\S]*?#app:has\(\.career-hub\)[\s\S]*?overflow:hidden/);
  assert.doesNotMatch(mobileMenuCss, /@media \(max-width:767px\)[\s\S]*?\n\s*html,\s*\n\s*body,\s*\n\s*#app\s*{/);
  assert.match(read("src/ui/fc27-mobile-landscape.css"), /#app > :is\(\.landing,\.wizard,\.coach-creation,\.career-hub\)\s*{[\s\S]*?height:var\(--pl-vh,100dvh\)[\s\S]*?overflow-y:auto/);
  assert.match(read("src/ui/fc27-mobile-landscape.css"), /\.coach-creation-grid\s*{[\s\S]*?grid-template-columns:minmax\(0,1\.35fr\)/);
  assert.match(read("src/ui/fc27-mobile-landscape.css"), /\.coach-steps\s*{[\s\S]*?position:static/);
});

test("mobile: cada área usa viewport fixo e reduz o conteúdo para caber sem scroll", () => {
  const landscape = read("src/ui/fc27-mobile-landscape.css");
  assert.match(html, /src\/ui\/mobile-game-viewport\.js/);
  assert.match(assets, /"src\/ui\/mobile-game-viewport\.js"/);
  assert.match(landscape, /\.game-shell\s*{[\s\S]*?grid-template-rows:var\(--pl-nav-height\) minmax\(0,1fr\)[\s\S]*?height:100dvh/);
  assert.doesNotMatch(landscape, /transform:\s*scale\(|zoom\s*:/, "sem escala global");
  assert.doesNotMatch(mobileViewport, /Math\.max\(\.3|MutationObserver|sm27-paged/, "sem escala nem paginação");
  assert.match(mobileViewport, /--pl-vh/);
});
