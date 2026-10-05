const test=require("node:test"), assert=require("node:assert/strict");
const D=require("../src/domain/engine.js"), Calendar=require("../src/ui/calendar.js"), Home=require("../src/ui/home-dashboard.js"), S=require("../src/infrastructure/save.js");

test("career central reuses canonical next commitment, table, training and statistics",()=>{
  const s=D.create({clubId:"c0",mode:"player"},771);
  const snap=Home.snapshot(s,D,Calendar), canonical=D.nextCommitment(s);
  assert.equal(snap.next.date,canonical.date);
  assert.equal(snap.next.competitionId,canonical.competitionId);
  assert.equal(snap.table.position,D.table(s).findIndex(x=>x.id===s.clubId)+1);
  assert.equal(snap.plan,s.trainingPlan);
  assert.deepEqual(snap.current,D.Statistics.heroDashboard(s).currentClubSeason);
  assert.ok(snap.events.every(e=>e.day>=s.day));
});

test("career central follows advances and save reload without parallel state",()=>{
  const s=D.create({clubId:"c0",mode:"player"},772), before=Home.snapshot(s,D,Calendar);
  D.advance(s,8);
  const after=Home.snapshot(s,D,Calendar);
  assert.ok(after.training.sessions>=before.training.sessions);
  const raw=JSON.stringify(s), loaded=S.parse(raw), reloaded=Home.snapshot(loaded,D,Calendar);
  assert.equal(reloaded.player.overall,after.player.overall);
  assert.equal(reloaded.current.appearances,after.current.appearances);
  assert.equal(reloaded.next?.date,after.next?.date);
});

test("career central recent form is derived only from played club matches",()=>{
  const s=D.create({clubId:"c0",mode:"player"},773);
  D.advance(s,30);
  const snap=Home.snapshot(s,D,Calendar);
  assert.ok(snap.recent.length<=5);
  for(const row of snap.recent){
    assert.ok(["V","E","D"].includes(row.result));
    assert.ok(row.match.home===s.clubId || row.match.away===s.clubId);
  }
});
