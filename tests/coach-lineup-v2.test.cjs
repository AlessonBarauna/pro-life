const test=require("node:test");
const assert=require("node:assert/strict");
const rating=require("../src/domain/coach-match-rating.js");

test("T1 lineup recommendation picks best eligible player by slot",()=>{
  const players=[{id:"a",position:"ATA",overall:70},{id:"b",position:"ATA",overall:83},{id:"c",position:"GOL",overall:78}];
  const rows=rating.recommendLineup(players,["GOL","ATA"]);
  assert.deepEqual(rows.map(x=>x.playerId),["c","b"]);
});
test("T1 lineup recommendation never selects injured player",()=>{
  const rows=rating.recommendLineup([{id:"inj",position:"ATA",overall:99,injured:true},{id:"ok",position:"ATA",overall:72}],["ATA"]);
  assert.equal(rows[0].playerId,"ok");
});
test("T1 lineup recommendation never duplicates selection",()=>{
  const rows=rating.recommendLineup([{id:"x",position:"MEI",overall:90}],["MEI","MEI"]);
  assert.deepEqual(rows.map(x=>x.playerId),["x",null]);
});
test("T1 lineup recommendation is advisory and deterministic",()=>{
  const players=[{id:"x",position:"DEF",overall:70},{id:"y",position:"DEF",overall:70}];
  const original=JSON.stringify(players);
  const first=rating.recommendLineup(players,["DEF"]);
  assert.deepEqual(rating.recommendLineup(players,["DEF"]),first);
  assert.equal(first[0].playerId,"x");
  assert.equal(JSON.stringify(players),original);
});
test("T1 per-player contextual fit changes recommendation",()=>{
  const players=[{id:"a",position:"ATA",overall:82},{id:"b",position:"ATA",overall:80}];
  const selected=rating.recommendLineup(players,["ATA"],{contextForPlayer:p=>({tacticalFit:p.id==="a"?0:100})});
  assert.equal(selected[0].playerId,"b");
});
