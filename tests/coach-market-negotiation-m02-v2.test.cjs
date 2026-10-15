"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const view=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
test("M02 negotiation feedback follows saved club response and window state",()=>{
  assert.match(view,/const sellerFeedback=selected\?/);
  assert.match(view,/selected\.response==="accepted"/);
  assert.match(view,/selected\.status==="awaiting_window"/);
});
test("M02 quick offers fill existing input and do not submit automatically",()=>{
  assert.match(view,/data-coach-deal-preset/);
  assert.match(view,/data-coach-preset-value/);
  assert.match(app,/el\.hasAttribute\("data-coach-deal-preset"\)/);
  assert.match(app,/input\.value=String\(offer\)/);
  assert.match(app,/command\("reviseCoachDeal"/);
});
test("M02 presets avoid expired and settled negotiations",()=>{
  assert.match(view,/selected\?\.status==="pending"/);
  assert.match(view,/Number\(s\.day\)<=Number\(selected\.expiresDay\)/);
  assert.match(view,/Number\(selected\.round\|\|1\)<3/);
});
