'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const P=require('../src/domain/player-positions.js');
test('05A2: 15 specific positions with legacy groups',()=>{
  assert.equal(P.positionList.length,15);
  assert.equal(P.group('LD'),'DEF');
  assert.equal(P.group('VOL'),'MEI');
  assert.equal(P.group('PE'),'ATA');
  assert.equal(P.group('anything'),null);
});
test('05A2: legacy saves are not guessed or mutated',()=>{
  const hero={id:'hero',pos:'DEF'};
  const before=JSON.stringify(hero);
  assert.equal(P.normalize(hero).primaryPosition,null);
  assert.equal(P.suitability(hero,'LE').multiplier,1);
  assert.equal(JSON.stringify(hero),before);
});
test('05A2: primary, secondary and improvised role',()=>{
  const hero={pos:'MEI',primaryPosition:'MEI',secondaryPositions:['MC','PD','MC','ZAG']};
  assert.deepEqual(P.eligible(hero),['MEI','MC','PD','ZAG']);
  assert.equal(P.suitability(hero,'MC').multiplier,1);
  assert.equal(P.suitability(hero,'VOL').multiplier,0.94);
  assert.equal(P.suitability(hero,'CA').multiplier,0.85);
  assert.equal(P.positionalOverall(80,hero,'CA'),68);
  assert.equal(P.positionalOverall(80,hero,'MEI'),80);
});
test('05A2: no invented position for old generic midfielders',()=>{
  const p={pos:'ATA',attrs:{finish:65}};
  assert.equal(P.normalize(p).primaryPosition,null);
  assert.equal(P.positionalOverall(75,p,'CA'),75);
  assert.equal(P.positionalOverall(75,p,'PD'),75);
});
