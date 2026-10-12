"use strict";
const test=require('node:test'),assert=require('node:assert/strict');
const K=require('../src/domain/champions-knockout.js');
function edition(){return {season:2026,comp:'ucl',entrants:Array.from({length:36},(_,i)=>['c'+i,'A'+i]),leagueSchedule:{matches:Array.from({length:144},(_,i)=>({id:'l'+i,homeId:'c'+(i%36),awayId:'c'+((i+1)%36),played:true,hg:2,ag:1}))}}}
const hooks={otherFixture:()=>({hg:1,ag:0})};
test('36 ranked, 8 direct, 16 playoff, 12 eliminated',()=>{const a=K.rank(edition());assert.equal(a.length,36);assert.equal(a.filter(x=>x.status==='round16').length,8);assert.equal(a.filter(x=>x.status==='playoffs').length,16);assert.equal(a.filter(x=>x.status==='out').length,12)});
test('45 knockout games: 16+16+8+4+1',()=>{const ed=edition(),s={day:0,mode:'coach'};K.initialize(ed,0);assert.equal(ed.knockout.stages[0].matches.length,16);for(const day of [218,225,246,253,274,281,302,309,330]){s.day=day;K.daily(s,ed,hooks)}assert.equal(ed.knockout.championId!==null,true);assert.equal(ed.knockout.status,'completed');const counts=ed.knockout.stages.map(x=>x.matches.length);assert.deepEqual(counts,[16,16,8,4,1]);assert.equal(counts.reduce((a,b)=>a+b,0),45)});
test('idempotent and persistent',()=>{const ed=edition(),s={day:218,mode:'coach'};K.daily(s,ed,hooks);const snap=JSON.stringify(ed.knockout);K.daily(s,ed,hooks);assert.equal(JSON.stringify(ed.knockout),snap);assert.equal(JSON.parse(JSON.stringify(ed)).knockout.stages[0].matches.filter(x=>x.played).length,8)});
test('no retroactive bracket',()=>{const ed=edition();assert.throws(()=>K.initialize(ed,250),/retroativo/);assert.equal(ed.knockout,undefined)});
test('no knockout until league complete',()=>{const ed=edition();ed.leagueSchedule.matches[0].played=false;assert.equal(K.daily({day:218},ed,hooks),null);assert.equal(ed.knockout,undefined)});
test('winner by aggregate, penalties when tied',()=>{const ed=edition();K.initialize(ed,0);const st=ed.knockout.stages[0];for(const m of st.matches){m.played=true;m.hg=1;m.ag=1}const winners=K.stageWinners(st);assert.equal(winners.length,8);assert.ok(st.matches.every(m=>m.decidedBy==='penalties'))});
