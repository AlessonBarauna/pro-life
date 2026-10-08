const test=require("node:test");
const assert=require("node:assert/strict");

const H=
  require("../src/domain/international-history.js");

global.ProLifeInternationalHistory=H;

const NT=
  require("../src/domain/national-team.js");

test("history summary does not require full tournament simulation state",()=>{
  const s={
    day:0,

    nationalTeam:{
      tournaments:[
        {
          type:"WORLD_CUP",
          name:"Copa do Mundo",
          year:2026,
          status:"COMPLETED",

          champion:{
            id:"BRA",
            name:"Brasil"
          },

          runnerUp:{
            id:"FRA",
            name:"Franca"
          }
        }
      ]
    }
  };

  const summary=
    NT.internationalHistorySummary(
      s
    );

  assert.equal(
    summary.editions,
    1
  );

  assert.equal(
    summary.timeline[0].type,
    "WORLD_CUP"
  );

  assert.equal(
    summary.timeline[0].champion,
    "Brasil"
  );

  assert.equal(
    summary.worldCupTitles
      .find(
        x=>x.id==="BRA"
      )
      .titles,
    6
  );
});

test("history summary archives without creating schedule data",()=>{
  const s={
    nationalTeam:{
      tournaments:[
        {
          type:"EURO",
          name:"EURO",
          year:2028,
          status:"COMPLETED",

          champion:{
            id:"ESP",
            name:"Espanha"
          }
        }
      ]
    }
  };

  NT.internationalHistorySummary(
    s
  );

  assert.equal(
    Array.isArray(
      s.nationalTeam.internationalArchive
    ),
    true
  );

  assert.equal(
    s.nationalTeam.internationalArchive.length,
    1
  );

  assert.equal(
    Object.prototype.hasOwnProperty.call(
      s.nationalTeam,
      "schedule"
    ),
    false
  );
});
