"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("../src/domain/engine.js");

test("3.10.11: coach substitution registers reserve at minute 60", () => {
  const state = D.create({mode:"coach",clubId:"c0"},31011);
  const home = structuredClone(D.club(state));
  const away = structuredClone(
    state.clubs.find(c=>c.id!==home.id&&c.leagueId===home.leagueId)
  );

  const starters = D.selected(home);
  const isForward = p =>
    ["CA","ATA"].includes(p.primaryPosition||p.specificPosition||p.pos);

  const outgoing = starters.find(isForward);
  const incoming = home.roster.find(p =>
    !starters.some(x=>x.id===p.id) &&
    isForward(p) &&
    !p.injury &&
    !(p.suspension>0) &&
    !p._competitionSuspended &&
    p.condition>35
  );

  assert.ok(outgoing,"Forward starter must exist");
  assert.ok(incoming,"Eligible reserve must exist");

  home.coachPlayerRoles = {
    [incoming.id]:{position:"CA",role:"poacher"}
  };

  const match = D.simulate(
    home,
    away,
    new D.Random(31011),
    {mode:"coach"},
    [{
      type:"substitution",
      minute:60,
      side:0,
      outId:outgoing.id,
      inId:incoming.id
    }]
  );

  const substitution = match.events.find(e =>
    e.type==="substitution" &&
    e.playerId===incoming.id
  );

  assert.ok(substitution,"Substitution event must exist");
  assert.equal(substitution.minute,60);
  assert.equal(match.participation[incoming.id].entryMinute,60);
  assert.equal(match.participation[incoming.id].starter,false);
  assert.equal(match.participation[outgoing.id].exitMinute,60);
});
test("3.10.11: tactical roles affect shot distribution", () => {
  const state = D.create({mode:"coach",clubId:"c0"},31011);
  const home = D.club(state);
  const away = state.clubs.find(
    c=>c.id!==home.id&&c.leagueId===home.leagueId
  );

  const player = home.roster.find(p =>
    home.lineup.includes(p.id) &&
    ["CA","ATA"].includes(p.primaryPosition||p.specificPosition||p.pos)
  );

  assert.ok(player,"Forward must exist");

  const scenarios = {
    baseline:null,
    poacher:"poacher",
    false_nine:"false_nine",
    target:"target"
  };

  const totals = {};

  for(const [name,role] of Object.entries(scenarios)){
    let shots=0;

    for(let seed=1;seed<=30;seed++){
      const h=structuredClone(home);
      const a=structuredClone(away);

      if(role){
        h.coachPlayerRoles={
          [player.id]:{position:"CA",role}
        };
      }else{
        delete h.coachPlayerRoles;
      }

      const match=D.simulate(h,a,new D.Random(seed));
      shots+=match.offensiveStats?.[player.id]?.shots||0;
    }

    totals[name]=shots;
  }

  assert.ok(
    totals.poacher>totals.baseline,
    `Poacher must increase shots: ${JSON.stringify(totals)}`
  );

  assert.ok(
    totals.false_nine<totals.baseline,
    `False nine must reduce shots: ${JSON.stringify(totals)}`
  );

  assert.ok(
    totals.target>totals.baseline,
    `Target must increase shots: ${JSON.stringify(totals)}`
  );
});
test("3.10.11: injury substitution preserves occupied position", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const engine = fs.readFileSync(
    path.join(__dirname,"../src/domain/engine.js"),"utf8"
  );

  const pattern = /ps\[ps\.indexOf\(p\)\] = sub;[\s\S]*?if\(positionRoles\[i\]\?\.has\(p\.id\)\)\{[\s\S]*?positionRoles\[i\]\.set\(sub\.id,occupiedRole\);[\s\S]*?\}/;

  const match = engine.match(pattern);
  assert.ok(match,"Injury substitution position transfer must exist");

  const positionRoles = [new Map([["starter","CA"]])];
  const p = {id:"starter"};
  const sub = {id:"reserve"};
  const ps = [p];

  const transfer = new Function(
    "ps","p","sub","positionRoles","i",
    match[0]
  );

  transfer(ps,p,sub,positionRoles,0);

  assert.equal(ps[0].id,"reserve");
  assert.equal(positionRoles[0].has("starter"),false);
  assert.equal(positionRoles[0].get("reserve"),"CA");
});
test("3.10.11: assist attribution remains valid across roles", () => {
  const state=D.create({mode:"coach",clubId:"c0"},31011);
  const home=D.club(state);
  const away=state.clubs.find(c=>c.id!==home.id&&c.leagueId===home.leagueId);

  const player=home.roster.find(p=>
    home.lineup.includes(p.id)&&
    ["CA","ATA"].includes(p.primaryPosition||p.specificPosition||p.pos)
  );

  assert.ok(player);

  for(const role of [null,"false_nine","target"]){
    let goals=0;
    let assisted=0;
    let playerAssists=0;

    for(let seed=1;seed<=60;seed++){
      const h=structuredClone(home);
      const a=structuredClone(away);

      if(role){
        h.coachPlayerRoles={
          [player.id]:{position:"CA",role}
        };
      }else{
        delete h.coachPlayerRoles;
      }

      const match=D.simulate(h,a,new D.Random(seed));
      const participants=new Set([
        ...match.participants[0],
        ...match.participants[1]
      ]);

      for(const event of match.events.filter(e=>e.type==="goal")){
        goals++;
        if(!event.assistPlayerId)continue;

        assisted++;
        assert.notEqual(event.assistPlayerId,event.playerId);
        assert.ok(
          participants.has(event.assistPlayerId),
          "Assistant must be a match participant"
        );

        if(event.assistPlayerId===player.id)playerAssists++;
      }
    }

    assert.ok(goals>0);
    assert.ok(assisted>0);

    console.log(JSON.stringify({
      role:role||"baseline",
      goals,
      assisted,
      playerAssists
    }));
  }
});
test("3.10.11: reserve role activates only after entry", () => {
  const state=D.create({mode:"coach",clubId:"c0"},31011);
  const home=D.club(state);
  const away=state.clubs.find(c=>c.id!==home.id&&c.leagueId===home.leagueId);
  const starters=D.selected(home);
  const forward=p=>["CA","ATA"].includes(
    p.primaryPosition||p.specificPosition||p.pos
  );
  const out=starters.find(forward);
  const sub=home.roster.find(p=>
    !starters.some(x=>x.id===p.id)&&forward(p)&&
    !p.injury&&!(p.suspension>0)&&
    !p._competitionSuspended&&p.condition>35
  );
  assert.ok(out&&sub&&away);

  const run=(seed,role)=>{
    const h=structuredClone(home);
    const a=structuredClone(away);
    delete h.coachPlayerRoles;
    if(role)h.coachPlayerRoles={
      [sub.id]:{position:"CA",role}
    };
    const runner=D.simulateSteps(
      h,a,new D.Random(seed),{mode:"coach"},[{
        type:"substitution",minute:60,side:0,
        outId:out.id,inId:sub.id
      }]
    );
    let before=0,after=0,previous=0;
    for(let step=runner.next();!step.done;step=runner.next()){
      const minute=step.value.minute;
      const current=step.value.match.possessions[0];
      const delta=current-previous;
      if(minute<60)before+=delta;
      else after+=delta;
      previous=current;
    }
    return {before,after};
  };

  let baselineAfter=0,roleAfter=0;
  for(let seed=1;seed<=30;seed++){
    const baseline=run(seed,null);
    const falseNine=run(seed,"false_nine");
    assert.equal(
      falseNine.before,baseline.before,
      `Reserve role affected possession before minute 60, seed ${seed}`
    );
    baselineAfter+=baseline.after;
    roleAfter+=falseNine.after;
  }
  console.log(JSON.stringify({baselineAfter,roleAfter}));
});