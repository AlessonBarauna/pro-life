const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function load(rel, key){ const code=fs.readFileSync(path.join(process.cwd(),rel),'utf8'); const ctx={console,structuredClone}; ctx.globalThis=ctx; vm.runInNewContext(code,ctx,{filename:rel}); return ctx[key]; }
const D=load('src/domain/data.js','ProLifeData');
const Career=load('src/domain/career.js','ProLifeCareer');

test('jogador sem atuar nao recebe repercussao individual negativa por resultado do clube',()=>{
  const s=D.newState ? D.newState('player') : null;
  if(!s) return;
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
