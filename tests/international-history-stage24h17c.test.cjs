const test=require("node:test");
const assert=require("node:assert/strict");

const H=
  require("../src/domain/international-history.js");

global.ProLifeInternationalHistory=H;

const NT=
  require("../src/domain/national-team.js");

function completed(
  type,
  year,
  championId,
  championName
){
  return {
    type,
    name:type,
    year,
    status:"COMPLETED",
    champion:
      championId
        ? {
            id:championId,
            name:championName
          }
        : null,
    runnerUp:null,
    thirdPlace:null
  };
}

test("international history archives completed tournaments",()=>{
  const n={
    tournaments:[
      completed(
        "WORLD_CUP",
        2026,
        "BRA",
        "Brasil"
      ),
      completed(
        "COPA_AMERICA",
        2028,
        "ARG",
        "Argentina"
      )
    ]
  };

  const archive=
    H.archiveFromNationalState(n);

  assert.equal(
    archive.length,
    2
  );

  assert.equal(
    archive[0].year,
    2026
  );

  assert.equal(
    archive[1].year,
    2028
  );
});

test("archive is idempotent",()=>{
  const n={
    tournaments:[
      completed(
        "WORLD_CUP",
        2026,
        "BRA",
        "Brasil"
      )
    ]
  };

  H.archiveFromNationalState(n);
  H.archiveFromNationalState(n);
  H.archiveFromNationalState(n);

  assert.equal(
    n.internationalArchive.length,
    1
  );
});

test("archive survives removal of heavy tournament objects",()=>{
  const n={
    tournaments:[
      completed(
        "EURO",
        2028,
        "ESP",
        "Espanha"
      )
    ]
  };

  H.archiveFromNationalState(n);

  n.tournaments=[];

  const timeline=
    H.timeline(n);

  assert.equal(
    timeline.length,
    1
  );

  assert.equal(
    timeline[0].type,
    "EURO"
  );

  assert.equal(
    timeline[0].champion,
    "Espanha"
  );
});

test("World Cup ranking includes historical baseline and simulated champions",()=>{
  const n={
    tournaments:[
      completed(
        "WORLD_CUP",
        2026,
        "BRA",
        "Brasil"
      ),
      completed(
        "WORLD_CUP",
        2030,
        "FRA",
        "Franca"
      )
    ]
  };

  const ranking=
    H.worldCupTitleTable(n);

  const bra=
    ranking.find(
      x=>x.id==="BRA"
    );

  const fra=
    ranking.find(
      x=>x.id==="FRA"
    );

  assert.equal(
    bra.titles,
    6
  );

  assert.equal(
    fra.titles,
    3
  );
});

test("normal competition title table counts simulated champions",()=>{
  const n={
    tournaments:[
      completed(
        "COPA_AMERICA",
        2028,
        "BRA",
        "Brasil"
      ),
      completed(
        "COPA_AMERICA",
        2032,
        "BRA",
        "Brasil"
      ),
      completed(
        "COPA_AMERICA",
        2036,
        "ARG",
        "Argentina"
      )
    ]
  };

  const table=
    H.titleTable(
      n,
      "COPA_AMERICA"
    );

  assert.equal(
    table[0].name,
    "Brasil"
  );

  assert.equal(
    table[0].titles,
    2
  );
});

test("FIFA Series stores winners by venue without global champion",()=>{
  const n={
    tournaments:[
      {
        type:"FIFA_SERIES",
        name:"FIFA Series",
        year:2026,
        status:"COMPLETED",
        series:[
          {
            id:"AUSTRALIA",
            host:"Australia",
            status:"COMPLETED",
            victor:{
              id:"AUS",
              name:"Australia"
            },
            runnerUp:{
              id:"CMR",
              name:"Camaroes"
            }
          },
          {
            id:"UZBEKISTAN",
            host:"Uzbequistao",
            status:"COMPLETED",
            victor:{
              id:"UZB",
              name:"Uzbequistao"
            },
            runnerUp:{
              id:"VEN",
              name:"Venezuela"
            }
          }
        ]
      }
    ]
  };

  const victors=
    H.fifaSeriesVictors(n);

  assert.equal(
    victors.length,
    2
  );

  assert.equal(
    victors[0].year,
    2026
  );

  assert.ok(
    victors.some(
      x=>
        x.seriesId==="AUSTRALIA" &&
        x.victor==="Australia"
    )
  );
});

test("national team exposes persistent international history summary",()=>{
  const s={
    day:0,
    season:1,
    mode:"player",

    person:{
      name:"Teste",
      age:22,
      pos:"ATA",
      nationality:"Brasil"
    },

    nationalTeam:{
      tournaments:[
        completed(
          "WORLD_CUP",
          2026,
          "BRA",
          "Brasil"
        )
      ],
      history:[],
      schedule:[],
      matches:[],
      titles:[],
      squad:[],
      positionCompetition:[],
      qualifiers:{
        season:null,
        table:[]
      },
      milestones:[],
      callupDecisions:{}
    },

    calendarDays:[],

    competitionSchedule:{
      cup:{
        rounds:[]
      }
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
    summary.worldCupTitles
      .find(
        x=>x.id==="BRA"
      )
      .titles,
    6
  );

  assert.equal(
    s.nationalTeam
      .internationalArchive
      .length,
    1
  );
});
