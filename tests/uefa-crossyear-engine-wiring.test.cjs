"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const src=name=>fs.readFileSync(path.join(__dirname,"../src/domain/",name),"utf8");
test("UEFA live match processing consults active edition for all three tournaments",()=>{
  const engine=src("engine.js");
  for(const comp of ["ucl","uel","uecl"]){
    const re=new RegExp("Continental\\\\.activeEdition\\\\?\\\\.\\\\(s,\\\\s*[\\\"\']"+comp+"[\\\"\']\\\\)","g");
    assert.ok((engine.match(re)||[]).length>=2,comp+" does not resolve both schedule and daily processing");
  }
});
test("Champions and Europa season processors respect persisted prior-year editions",()=>{
  for(const [file,comp] of [["champions-season.js","ucl"],["europa-season.js","uel"]])
    assert.ok(src(file).includes('C.activeEdition?.(s,"'+comp+'")'),file);
});
test("Conference preserves eligibility validation for current and saved cross-year seasons",()=>{
  const conference=src("conference-season.js");
  assert.ok(conference.includes('ed.calendarMode==="european_v1"'));
  assert.ok(conference.includes('ed.leagueSchedule'));
  assert.ok(conference.includes('ed.season===s.season-1'));
});
