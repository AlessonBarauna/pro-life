'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const M=require('../src/domain/match-position-effects.js');
const mk=(id,pos,primaryPosition)=>({id,pos,primaryPosition});
const starters=[mk('gk','GOL','GOL'),mk('ld','DEF','LD'),mk('z1','DEF','ZAG'),mk('z2','DEF','ZAG'),mk('le','DEF','LE'),mk('vol','MEI','VOL'),mk('mc1','MEI','MC'),mk('mc2','MEI','MC'),mk('pd','ATA','PD'),mk('ca','ATA','CA'),mk('pe','ATA','PE')];
test('05A4: legacy does not get a positional penalty',()=>{
 const legacy=starters.map(({id,pos})=>({id,pos}));const before=JSON.stringify(legacy);
 const roles=M.create({formation:'4-3-3',roster:legacy},legacy);
 assert.equal(roles.size,0);assert.equal(M.factor(legacy[3],roles),1);assert.equal(JSON.stringify(legacy),before);
});
test('05A4: identifies roles and penalizes improvised players',()=>{
 const list=starters.map(p=>({...p}));const roles=M.create({formation:'4-3-3',roster:list},list);
 assert.equal(roles.size,11);assert.equal(roles.get('ld'),'LD');assert.equal(M.factor(list[1],roles),1);
 const outsider=mk('other','ATA','CA');roles.set('other','ZAG');assert.equal(M.factor(outsider,roles),.85);
});
test('05A4: replacement respects role and is read-only',()=>{
 const candidates=[mk('left','DEF','LE'),mk('right','DEF','LD')];const before=JSON.stringify(candidates);
 assert.equal(M.bestReplacement(candidates,'LD',()=>80).id,'right');
 assert.equal(JSON.stringify(candidates),before);
});
test('05A4: entry chooses compatible outfield role',()=>{
 const roles=M.create({formation:'4-3-3',roster:starters},starters);
 assert.equal(M.bestExit(starters,mk('bench','DEF','LD'),roles),1);
 assert.equal(M.bestExit(starters,mk('bench','ATA','CA'),new Map()),-1);
});
test('05A4: incomplete lineups safely disable effects',()=>{
 assert.equal(M.create({formation:'4-3-3',roster:starters},starters.slice(0,8)).size,0);
});
