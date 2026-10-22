"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("../src/domain/engine.js");
const CC = D.CoachCareer;

function career() {
  const s = D.create({
    mode:"coach",
    clubId:"c0",
    catalogVersion:"fc27_v1"
  },5);
  CC.init(s,D);
  return {
    s,
    club:s.clubs.find(c=>c.id===s.clubId)
  };
}

function edition(s,club,comp,editionYear,finalDay) {
  const key=`${comp}:${editionYear}`;
  s.continental||={editions:{},finals:{}};
  s.continental.editions||={};

  s.continental.editions[key]={
    comp,
    season:editionYear,
    status:"completed",
    championId:club.id,
    knockout:{
      status:"completed",
      championId:club.id,
      stages:[{
        key:"final",
        matches:[{
          id:`${key}:final`,
          homeId:club.id,
          awayId:"adversario",
          played:true,
          day:finalDay,
          playedDay:finalDay,
          hg:2,
          ag:0,
          winnerId:club.id
        }],
        winners:[club.id]
      }]
    }
  };
}

for(const comp of ["ucl","uel","uecl","lib","sud"]) {
  test(`titulo internacional confirmado: ${comp}`,()=>{
    const {s,club}=career();
    const finalDay=Number(s.day)+100;
    s.day=finalDay;
    edition(s,club,comp,s.season,finalDay);

    const result=CC.closeSeason(s,D,null);
    assert.ok(result);

    assert.ok(
      result.row.trophies.some(t=>
        t.key===`continental:${comp}:${s.season}`
      ),
      `Titulo ${comp} nao contabilizado`
    );
  });
}

test("Champions 2026/27 conta no ano da conquista",()=>{
  const {s,club}=career();
  const firstYear=s.season;

  // Simula o fechamento do primeiro ano.
  const previous=CC.closeSeason(s,D,null);
  assert.ok(previous);

  s.season=firstYear+1;
  s.day=Number(s.day)+365;

  const finalDay=Number(s.day);
  edition(s,club,"ucl",firstYear,finalDay);

  const result=CC.closeSeason(s,D,null);

  assert.ok(result);
  assert.ok(result.row.trophies.some(t=>
    t.key===`continental:ucl:${firstYear}`
  ));

  const prior=s.coachCareer.stints
    .flatMap(st=>st.rows)
    .find(r=>r.season===firstYear);

  assert.ok(prior);
  assert.equal(
    (prior.trophies||[]).some(t=>
      t.key===`continental:ucl:${firstYear}`
    ),
    false
  );
});

test("final anterior a contratacao nao gera titulo",()=>{
  const {s,club}=career();
  const st=s.coachCareer.stints[0];
  const day=Number(s.day)+100;
  st.fromDay=day+5;
  s.day=day+10;

  edition(s,club,"lib",s.season,day);
  const result=CC.closeSeason(s,D,null);

  assert.equal(
    result.row.trophies.some(t=>
      t.key===`continental:lib:${s.season}`
    ),
    false
  );
});

test("vice-campeao nunca recebe trofeu",()=>{
  const {s,club}=career();
  const day=Number(s.day)+100;
  s.day=day;

  edition(s,club,"sud",s.season,day);
  const ed=s.continental.editions[`sud:${s.season}`];
  ed.championId="adversario";
  ed.knockout.championId="adversario";
  ed.knockout.stages[0].winners=["adversario"];
  ed.knockout.stages[0].matches[0].winnerId="adversario";

  const result=CC.closeSeason(s,D,null);

  assert.equal(
    result.row.trophies.some(t=>
      t.key===`continental:sud:${s.season}`
    ),
    false
  );
});