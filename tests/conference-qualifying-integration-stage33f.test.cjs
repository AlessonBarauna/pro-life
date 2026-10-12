"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const I=require("../src/domain/conference-qualifying-integration.js");
const T=require("../src/domain/conference-qualifying-ties.js");
function fixture(){
 const clubs=Array.from({length:72},(_,i)=>({id:"c"+i,country:["ENG","ESP","ITA","GER","FRA","POR"][i%6]}));
 const mk=(path,offset)=>{
  let q=T.create({season:2027,path,round:"playoff",pairs:Array.from({length:18},(_,i)=>({homeId:"c"+(offset+i*2),awayId:"c"+(offset+i*2+1)}))});
  for(const p of q.pairs){q=T.applyLeg(q,{pairId:p.id,leg:1,homeId:p.homeId,awayId:p.awayId,hg:2,ag:0});q=T.applyLeg(q,{pairId:p.id,leg:2,homeId:p.awayId,awayId:p.homeId,hg:0,ag:1});}
  return q;
 };
 return {season:2027,clubs,higherEntries:{ucl:[],uel:[]},playoffs:[mk("main",0),mk("champions",36)],accessAudit:{ready:true,official:true}};
}
test("33F: 36 verified winners, unique, two paths",()=>{const x=I.assemble(fixture());assert.equal(x.count,36);assert.equal(new Set(x.entrants.map(r=>r[0])).size,36);assert.equal(x.ready,true)});
test("33F: incomplete playoff cannot qualify",()=>{const f=fixture();f.playoffs[0].status="pending";const x=I.assemble(f);assert.equal(x.ready,false);assert.ok(x.issues.some(v=>v.startsWith("playoff_incomplete")))});
test("33F: active Europa entry cannot double qualify",()=>{const f=fixture();f.higherEntries.uel=["c0"];assert.equal(I.assemble(f).ready,false)});
test("33F: unverified UEFA access blocks activation",()=>{const f=fixture();f.accessAudit={ready:false,official:false};const x=I.assemble(f);assert.equal(x.ready,false);assert.ok(x.issues.includes("official_access_and_ucl_uel_qualifiers_unverified"))});
test("33F: no saved state mutation",()=>{const f=fixture(),before=JSON.stringify(f);I.assemble(f);assert.equal(JSON.stringify(f),before)});
test("33F: knockout aggregate cannot be falsified",()=>{const f=fixture();f.playoffs[0].pairs[0].winnerId=f.playoffs[0].pairs[0].awayId;assert.ok(I.assemble(f).issues.some(v=>v.startsWith("aggregate_winner_mismatch")))});
test("33F: ties without provenance of tiebreak are blocked",()=>{const f=fixture(),p=f.playoffs[0].pairs[0];p.legs[1].hg=2;p.legs[1].ag=0;assert.ok(I.assemble(f).issues.some(v=>v.startsWith("tiebreak_method_not_recorded")))});
test("33F: refuses fictional noncatalogued winners",()=>{const f=fixture();f.clubs=f.clubs.filter(c=>c.id!=="c0");assert.ok(I.assemble(f).issues.includes("winner_not_in_catalog:c0"))});
