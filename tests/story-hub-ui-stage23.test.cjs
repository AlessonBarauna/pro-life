const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");

const app=fs.readFileSync("src/ui/app.js","utf8");
const index=fs.readFileSync("index.html","utf8");
const assets=fs.readFileSync("tools/assets.cjs","utf8");

test("story hub domain is loaded by the browser",()=>{
  assert.match(index,/src\/domain\/story-hub\.js/);
});

test("story hub is included in build assets",()=>{
  assert.match(assets,/src\/domain\/story-hub\.js/);
});

test("player navigation exposes Objetivos e Historia",()=>{
  assert.match(app,/\["story",\s*"Objetivos e Hist\u00f3ria"\]/);
});

test("story page exists",()=>{
  assert.match(app,/story\(\)\s*\{/);
  assert.match(app,/story-hub-stage23/);
});

test("story page exposes priorities objectives milestones and timeline",()=>{
  assert.match(app,/story-priorities/);
  assert.match(app,/story-objectives/);
  assert.match(app,/story-milestones/);
  assert.match(app,/story-timeline/);
});

test("story page consumes domain snapshot instead of duplicating state",()=>{
  assert.match(app,/ProLifeStoryHub\?\.snapshot/);
});

test("urgent objectives can navigate to canonical destination",()=>{
  assert.match(app,/data-page=/);
  assert.match(app,/data-target=/);
});

test("coach mode does not expose player story content",()=>{
  assert.match(app,/if\(state\.mode!==["']player["']\)/);
});
