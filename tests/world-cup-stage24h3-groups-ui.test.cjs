const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");

const src=fs.readFileSync("src/ui/app.js","utf8");

test("World Cup UI shows Brazil group label",()=>{
  assert.match(src,/wcBrazilGroupTitle/);
  assert.match(src,/Grupo do Brasil/);
});

test("World Cup UI exposes carousel arrows for groups",()=>{
  assert.match(src,/data-wc-groups-track/);
  assert.match(src,/wc-groups-nav/);
});

test("World Cup UI highlights direct and third-place rows",()=>{
  assert.match(src,/wc-row-qualified/);
  assert.match(src,/wc-row-third/);
});
