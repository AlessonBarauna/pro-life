"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const {revenueProjection}=require("../src/domain/club-economy.js");
test("M04.7 sponsor and broadcasting forecasts scale across divisions",()=>{
 const a=revenueProjection({id:"a",leagueId:"serieA",structure:70});
 const b=revenueProjection({id:"b",leagueId:"serieB",structure:70});
 const c=revenueProjection({id:"c",leagueId:"serieC",structure:70});
 assert.ok(a.totalAnnual>b.totalAnnual&&b.totalAnnual>c.totalAnnual);
 assert.equal(a.totalAnnual,a.sponsorshipAnnual+a.broadcastAnnual);
});
test("M04.7 projection never mutates club or records income",()=>{
 const club={id:"sp",leagueId:"serieA",structure:80,budget:120000000};
 const original=JSON.stringify(club);
 const result=revenueProjection(club);
 assert.equal(JSON.stringify(club),original);
 assert.equal(result.status,"simulation_only");
 assert.equal(result.recognizedRevenue,0);
 assert.equal(result.readOnly,true);
});
test("M04.7 estimates are visually distinct from recognized revenue",()=>{
 const code=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
 new vm.Script(code);
 assert.match(code,/ProLifeClubEconomy\?\.revenueProjection/);
 assert.match(code,/Total anual hipotético/);
 assert.match(code,/Não são contratos firmados, receitas recebidas/);
});
