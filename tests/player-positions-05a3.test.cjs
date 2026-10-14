'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Sel=require('../src/domain/squad-position-selection.js');
const P=require('../src/domain/player-positions.js');
const make=(id,pos,primaryPosition,overall=75)=>({id,pos,primaryPosition,overall});
const roster=[make('gk','GOL','GOL',80),make('ld','DEF','LD',78),make('z1','DEF','ZAG',80),make('z2','DEF','ZAG',77),make('le','DEF','LE',78),make('vol','MEI','VOL',78),make('mc1','MEI','MC',78),make('mc2','MEI','MC',78),make('pd','ATA','PD',78),make('ca','ATA','CA',78),make('pe','ATA','PE',78),make('fake','DEF','ZAG',30)];
const select=(r=roster,formation='4-3-3')=>Sel.choose({formation,active:r,roster:r,score:p=>p.overall,overall:p=>p.overall,restsToday:()=>false});
test('05A3: 3 formations with 11 slots and 1 GK',()=>{
 for(const slots of Object.values(Sel.formationSlots)){assert.equal(slots.length,11);assert.equal(slots.filter(p=>p==='GOL').length,1);}
});
test('05A3: explicit positions choose balanced XI with no duplication',()=>{
 const selection=select();assert.equal(selection.starters.length,11);
 assert.equal(new Set(selection.starters.map(p=>p.id)).size,11);
 for(const [id,position] of Object.entries(selection.assignedPositions)){assert.equal(P.suitability(selection.starters.find(p=>p.id===id),position).multiplier,1);}
 assert.equal(selection.assignedPositions.gk,'GOL');
});
test('05A3: legacy only is not opt-in and is never mutated',()=>{
 const generic=roster.map(({id,pos,overall})=>({id,pos,overall}));const before=JSON.stringify(generic);
 assert.equal(Sel.supportsSpecific(generic),false);
 assert.equal(Sel.supportsSpecific(roster),true);
 assert.equal(JSON.stringify(generic),before);
});
test('05A3: 4-2-3-1 preserves unique players and group counts',()=>{
 const result=select(roster,'4-2-3-1');assert.equal(result.starters.length,11);
 assert.equal(result.starters.filter(p=>p.pos==='GOL').length,1);
 assert.equal(new Set(result.starters.map(p=>p.id)).size,11);
});
test('05A3: shortage never creates players or mutates roster',()=>{
 const r=roster.slice(0,8),before=JSON.stringify(r),result=select(r);
 assert.equal(result.starters.length,8);assert.equal(JSON.stringify(r),before);
});
