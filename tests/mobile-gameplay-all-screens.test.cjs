const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const css = fs.readFileSync(path.join(__dirname, "../src/ui/fc27-mobile-sm27.css"), "utf8");

test("mobile landscape keeps every non-central screen fixed and without gesture scrolling", () => {
  assert.match(css, /\.game-stage:not\(\.game-stage-home\)[\s\S]*transform:scale\(var\(--sm27-screen-scale\)\)/);
  assert.match(css, /\.game-stage:not\(\.game-stage-home\) > \.sm27-screen-body[\s\S]*overflow-y:hidden/);
  assert.match(css, /\.game-stage \{[^}]*overflow:hidden/);
});

test("the mobile shell wraps every non-central view in one independent screen body", () => {
  const app = fs.readFileSync(path.join(__dirname, "../src/ui/app.js"), "utf8");
  assert.match(app, /const mobileLandscape = window\.matchMedia/);
  assert.match(app, /mobileLandscape \? `<div class="sm27-screen-body">\$\{stageView\}<\/div>` : stageView/);
  assert.match(app, /\$\{stageContent\}<\/div><div class="footer">/);
});

test("mobile landscape turns dense panels into pages instead of nested scrolls", () => {
  assert.match(css, /:is\(\.cc-tabs,\.cc-deal-nav,\.cc-market-screen-nav,\.pl-squad-tabs,\.life-tabs\)[\s\S]*position:sticky/);
  assert.match(css, /\.game-stage-squad \.sm27-screen-body > \.pl-squad-screen[\s\S]*\.game-stage-squad \.pl-squad-workspace[\s\S]*overflow:hidden/);
  assert.match(css, /\[data-sm27-unscroll\][\s\S]*overflow:visible !important/);
  assert.match(css, /\[data-sm27-page-content\][\s\S]*transform:scale\(var\(--sm27-page-fit/);
  assert.match(css, /\[data-sm27-page-hidden\][\s\S]*display:none !important/);
  assert.match(css, /\.sm27-screen-pager[\s\S]*position:absolute/);
  assert.match(css, /\.game-stage-season :is\([\s\S]*overflow-y:visible/);
  assert.match(css, /\.game-stage-calendar \.pl-calendar-screen > \.career-calendar[\s\S]*overflow-y:visible[\s\S]*touch-action:manipulation/);
  assert.match(css, /\.game-stage-calendar \.sm27-screen-body > \.pl-calendar-screen[\s\S]*height:auto[\s\S]*overflow:visible/);
  assert.match(css, /\.game-stage-calendar \.pl-calendar-screen > \.career-calendar[\s\S]*max-height:none[\s\S]*touch-action:auto/);
  const viewport = fs.readFileSync(path.join(__dirname, "../src/ui/mobile-game-viewport.js"), "utf8");
  assert.match(viewport, /function releaseNestedScroll\(body\)/);
  assert.match(viewport, /function paginate\(\)/);
  assert.match(viewport, /function groupWholeBlocks\(blocks, capacity\)/);
  assert.match(viewport, /data-sm27-page-status/);
  assert.match(viewport, /pageGroups = groupWholeBlocks\(pageBlocks, blockCapacity\)/);
});

test("market filters and cards are compact enough for the horizontal phone viewport", () => {
  assert.match(css, /\.cc-market-screen \.cc-fc27-filter-area[\s\S]*repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css, /\.cc-market-screen \.cc-fc27-result \{ padding:8px 10px !important; \}/);
  assert.match(css, /\.game-stage-market \.cc-market-screen-nav[\s\S]*repeat\(8,minmax\(0,1fr\)\)/);
  assert.match(css, /\.game-stage-market \.cc-market-task-panel[\s\S]*padding:9px 12px/);
});
