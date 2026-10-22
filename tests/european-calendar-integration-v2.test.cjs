"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const Dates=require("../src/domain/european-calendar.js");
const Cups=require("../src/domain/english-cups.js");
test("English cup seasons cross January using real-year dates",()=>{
  const a=Cups.state({});assert.ok(a.editions);
  const august=Dates.dateDay("2026-08-01");
  const january=Dates.dateDay("2027-01-09");
  assert.ok(january>august);
  assert.equal(Dates.toDate(january),"2027-01-09");
});
test("Leap year is a 366-day civil year",()=>{
  const a=Dates.dateDay("2028-01-01"),b=Dates.dateDay("2029-01-01");
  assert.equal(b-a,366);
});
test("Transfer windows are distinct in calendar-year and cross-year countries",()=>{
  const eng=Dates.transferWindows("ENG",2027);
  const swe=Dates.transferWindows("SWE",2027);
  assert.equal(eng.length,2);assert.equal(swe.length,2);
  assert.notEqual(eng[0].end,swe[0].end);
  assert.ok(eng.every(w=>w.source==="planning_window"));
});
