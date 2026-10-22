"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const view=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
const V=require("../src/ui/coach-career-view.js");
test("advanced scouting filters preserve club country GER age and category",()=>{
 V.setScoutFilters("Pedro","ATA",{club:"gf_a",country:"Brasil",age:"under21",ageMin:"18",ageMax:"21",overallMin:"70",overallMax:"85",potentialMin:"80",potentialMax:"95",sort:"potential",sortDirection:"desc",category:"promises"});
 assert.equal(V.state.scoutClub,"gf_a");assert.equal(V.state.scoutCountry,"Brasil");
 assert.equal(V.state.scoutAge,"under21");assert.equal(V.state.scoutAgeMin,"18");assert.equal(V.state.scoutAgeMax,"21");
 assert.equal(V.state.scoutOverallMin,"70");assert.equal(V.state.scoutOverallMax,"85");assert.equal(V.state.scoutPotentialMin,"80");assert.equal(V.state.scoutPotentialMax,"95");assert.equal(V.state.scoutSort,"potential");assert.equal(V.state.scoutSortDirection,"desc");assert.equal(V.state.scoutCategory,"promises");
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
 for(const key of ["club","country","age-min","age-max","overall-min","overall-max","potential-min","potential-max","sort","sort-direction","category"]){
   assert.ok(view.includes("data-coach-scout-"+key));
   assert.ok(app.includes('data-coach-scout-'+key));
 }
});
