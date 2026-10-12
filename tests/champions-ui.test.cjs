'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const UI=require('../src/ui/champions-league-view.js');
function fixture(){return {season:2026,clubId:'a',continental:{editions:{'ucl:2026':{season:2026,entrants:[['a','ESP'],['b','ENG'],['c','ITA']],leagueSchedule:{matches:[{homeId:'a',awayId:'b',hg:2,ag:1,played:true,day:40},{homeId:'b',awayId:'c',played:false,day:61}]}}}}};}
test('view does not mutate state',()=>{const s=fixture(),before=JSON.stringify(s);const m=UI.model(s);assert.equal(m.played,1);assert.equal(m.rankings.length,3);assert.equal(JSON.stringify(s),before)});
test('rankings calculate points goals and draws',()=>{const s=fixture();const [a,b,c]=UI.model(s).rankings;assert.equal(a.id,'a');assert.equal(a.p,3);assert.equal(a.gd,1);assert.equal(UI.model(s).rankings.find(r=>r.id==='b').l,1);assert.equal(UI.model(s).rankings.find(r=>r.id==='c').p,0)});
test('empty save is handled',()=>{assert.equal(UI.model({season:2030}).available,false)});
test('knockout data is read',()=>{const s=fixture();s.continental.editions['ucl:2026'].knockout={status:'completed',championId:'a',stages:[],ranking:[]};const m=UI.model(s);assert.equal(m.completed,true);assert.equal(m.knockout.championId,'a')});
