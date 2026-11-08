const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../src/domain/engine.js');
const Career = D.Career;

test('jogador sem atuar nao recebe repercussao individual negativa por resultado do clube',()=>{
  const s=D.create({mode:'player',clubId:'c0'},1601);
  Career.init(s);
  const before=structuredClone(Career.mediaProfile(s));
  const club=s.clubId;
  const opponent=s.clubs.find(c=>c.id!==club).id;
  const m={home:club,away:opponent,hg:0,ag:2,ratings:{},events:[],playerStats:{},date:s.day,competitionId:'test'};
  Career.match(s,m);
  const after=Career.mediaProfile(s);
  assert.equal(after.fanSentiment,before.fanSentiment);
  assert.equal(after.pressure,before.pressure);
  assert.equal(after.sponsorAppeal,before.sponsorAppeal);
});
