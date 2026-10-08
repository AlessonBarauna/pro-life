const test=require("node:test");
const assert=require("node:assert/strict");

const Pool=require("../src/domain/international-pool.js");

global.ProLifeInternationalPool=Pool;

const NationalTeam=require("../src/domain/national-team.js");

function api(){
  return {
    overall(player){
      return Number(
        player?.ovr ??
        player?.overall ??
        75
      );
    }
  };
}

function state(){
  return {
    mode:"player",
    day:100,
    season:2026,
    reputation:70,
    clubId:"club1",
    person:{
      id:"hero",
      name:"Hero",
      age:20,
      pos:"MEI",
      nationality:"Brasil",
      morale:70,
      condition:100,
      ovr:80
    },
    clubs:[
      {
        id:"club1",
        name:"Clube Teste",
        roster:[
          {
            id:"local_gk",
            name:"Goleiro Local",
            age:27,
            pos:"GOL",
            nationality:"Brazil",
            ovr:74,
            condition:100,
            morale:50
          }
        ]
      }
    ],
    career:{
      playerCareer:{
        played:10,
        ratingTotal:70
      }
    }
  };
}

test("Brazil squad includes international Brazilian players",()=>{
  const s=state();
  const squad=NationalTeam.buildSquad(s,api());

  assert.ok(
    squad.some(p=>p.id==="intl_vini_jr")
  );

  assert.ok(
    squad.some(p=>p.id==="intl_alisson")
  );
});

test("international player remains available after squad is stored",()=>{
  const s=state();

  s.nationalTeam={
    calledUp:true,
    squad:NationalTeam.buildSquad(s,api()),
    positionCompetition:[]
  };

  const competition=
    NationalTeam.positionCompetition(s,api());

  const external=competition.find(
    p=>p.id==="hero"
  );

  assert.ok(external);
});

test("same player is not duplicated between club and international pool",()=>{
  const s=state();

  s.clubs[0].roster.push({
    ...Pool.players.find(p=>p.id==="intl_vini_jr")
  });

  const squad=NationalTeam.buildSquad(s,api());

  assert.equal(
    squad.filter(p=>p.id==="intl_vini_jr").length,
    1
  );
});
