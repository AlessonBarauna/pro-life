"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const E=require("../src/domain/engine.js");
const C=require("../src/domain/continental.js");
const D=require("../src/domain/european-calendar.js");
test("new FC27 careers opt in while legacy careers stay unchanged",()=>{
  const modern=E.create({mode:"coach",catalogVersion:"fc27_v1"},311);
  assert.equal(modern.calendarVersion,"european_v1");
  const old=E.create({mode:"coach",world:"legacy"},312);
  assert.notEqual(old.calendarVersion,"european_v1");
});
test("2027 UEFA edition windows are after August 2027",()=>{
  for(const comp of ["ucl","uel","uecl"]){
    const ed={season:2027,comp,calendarMode:"european_v1"};
    const win=C.windows(2027,comp,ed);
    assert.ok(win[0]>=D.dateDay("2027-09-01"),comp);
    assert.ok(win.at(-1)>D.dateDay("2028-05-01"),comp);
  }
});
test("2027 UEFA calendar does not create before domestic season finishes",()=>{
  const s={calendarVersion:"european_v1",season:2027,day:D.dateDay("2027-01-01"),globalFootball:{clubs:[],leagues:[]},continental:{editions:{},finals:{}}};
  C.init(s);
  assert.equal(C.edition(s,"ucl",2027),null);
  assert.equal(C.edition(s,"uel",2027),null);
  assert.equal(C.edition(s,"uecl",2027),null);
});
