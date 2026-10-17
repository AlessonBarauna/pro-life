const test=require("node:test"),assert=require("node:assert/strict");
const Z=require("../src/domain/competition-zones-v2.js");
test("competition priorities follow coach league country",()=>{const cat=[{id:"br",country:"Brasil"},{id:"es",country:"Espanha"},{id:"fr",country:"França"}];assert.equal(Z.homeCountry(cat,{},'es'),"Espanha");assert.deepEqual(Z.prioritized(cat,"Espanha").map(x=>x.id),["es","br","fr"]);});
test("Brazilian Serie A 2026 has 4 group places, one preliminary, and bottom four",()=>{const zones=Z.zones({country:"Brasil",name:"Brasileirão Série A"},20);assert.equal(Z.forPosition(zones,4).key,"libertadores");assert.equal(Z.forPosition(zones,5).key,"libertadores-playoff");assert.equal(Z.forPosition(zones,6).key,"sulamericana");assert.equal(Z.forPosition(zones,17).key,"rebaixamento");});
test("Copa do Brasil has no fake league rank qualification",()=>{assert.deepEqual(Z.zones({country:"Brasil",name:"Copa do Brasil"},20),[]);});
test("Unconfigured foreign leagues show no invented continental qualification",()=>{assert.deepEqual(Z.zones({country:"Espanha",name:"LaLiga"},20),[]);});
