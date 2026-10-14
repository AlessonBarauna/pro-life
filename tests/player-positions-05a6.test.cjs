"use strict";const test=require('node:test'),assert=require('node:assert/strict');const P=require('../src/domain/player-position-overlay.js');
test('05A6: positions for specific Man Utd athletes',()=>{assert.equal(P.normalized({pos:'ATA',name:'B. Šeško'},'Man Utd').primaryPosition,'CA');assert.equal(P.normalized({pos:'DEF',name:'Luke Shaw'},'Man Utd').primaryPosition,'LE');});
test('05A6: no guessed positions in unknown club',()=>{assert.equal(P.normalized({pos:'DEF',name:'Luke Shaw'},'Other FC').primaryPosition,null);});
test('05A6: existing positions take precedence',()=>{assert.equal(P.normalized({pos:'ATA',name:'B. Šeško',primaryPosition:'PD'},'Man Utd').primaryPosition,'PD');});
test('05A6: input remains unchanged',()=>{const p={pos:'MEI',name:'B. Fernandes',secondaryPositions:[]};const before=JSON.stringify(p);assert.equal(P.normalized(p,'Man Utd').primaryPosition,'MEI');assert.equal(JSON.stringify(p),before);});
