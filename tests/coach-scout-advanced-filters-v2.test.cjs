"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const view=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
const V=require("../src/ui/coach-career-view.js");
test("advanced scouting filters preserve club country age and category",()=>{
 V.setScoutFilters("Pedro","ATA",{club:"gf_a",country:"Brasil",age:"under21",category:"promises"});
 assert.equal(V.state.scoutClub,"gf_a");assert.equal(V.state.scoutCountry,"Brasil");
 assert.equal(V.state.scoutAge,"under21");assert.equal(V.state.scoutCategory,"promises");
 V.setScoutFilters("","all",{});
});
test("filters only use explicit transfer-list flags and real potential",()=>{
 assert.match(view,/p\.transferListed===true/);
 assert.match(view,/p\.marketStatus==="transfer_listed"/);
 assert.match(view,/Number\(p\.potential\)>=80/);
 assert.match(view,/ui\.scoutCategory==="free"/);
 assert.match(view,/contratação direta ainda não disponível/);
});
test("all advanced controls are connected to search dispatcher",()=>{
 for(const key of ["club","country","age","category"]){
   assert.ok(view.includes("data-coach-scout-"+key));
   assert.ok(app.includes('data-coach-scout-'+key));
 }
});
