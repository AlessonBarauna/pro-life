"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const v=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
test("M05.6 reinforcements have their own navigable screen",()=>{
 assert.match(v,/\["reforcos","Reforços"/);
 assert.match(v,/reforcos:reinforcementPanel/);
 assert.match(v,/data-coach-deal-tab="reforcos"/);
 assert.match(v,/data-coach-deal-tab="historico"/);
});
test("M05.6 reinforcement data is read-only and save-sourced",()=>{
 assert.match(v,/c\.presentations\|\|\[\]/);
 assert.match(v,/<strong>CONTRATADO<\/strong>/);
 assert.doesNotMatch(v,/x\.presented\?"APRESENTADO":"PENDENTE"/);
 assert.match(v,/x\.fee==null/);
 assert.match(v,/const signingCards=/);
});
test("M05.6 completed signing never blocks scouting navigation",()=>{
 assert.match(v,/data-coach-market-area="observacao">Buscar novos jogadores/);
 assert.match(v,/\+navigation\+intro\+marketContent/);
 assert.match(v,/completeDeal:\(\)=>\{ui\.draftOffer=null;ui\.selectedDeal=null;ui\.selectedSigning=null;ui\.dealTab="propostas";ui\.marketArea="overview";\}/);
});
