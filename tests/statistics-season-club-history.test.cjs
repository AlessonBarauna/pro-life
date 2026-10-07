const test=require("node:test");
const assert=require("node:assert/strict");

global.ProLife={
  overall:()=>83
};

const Statistics=require("../src/domain/statistics.js");

function stint(season,clubId,club,startDay,endDay,apps,goals,ratingTotal){
  return {
    season,
    clubId,
    club,
    startDay,
    endDay,
    transferType:endDay==null?"current":"transfer",
    appearances:apps,
    starts:apps,
    minutes:apps*80,
    goals,
    assists:0,
    motm:0,
    ratingTotal,
    saves:0,
    tackles:0,
    shots:0,
    onTarget:0,
    xg:0,
    yellowCards:0,
    redCards:0,
    wins:0,
    draws:0,
    losses:0,
    hatTricks:0,
    cleanSheets:0
  };
}

function state(){
  return {
    mode:"player",
    season:2027,
    day:440,
    clubId:"sp",
    person:{
      name:"Hero",
      age:18,
      pos:"ATA",
      attrs:{}
    },
    clubs:[
      {id:"flu",name:"Fluminense",roster:[],stats:{}},
      {id:"sp",name:"S\u00e3o Paulo",roster:[{id:"hero"}],stats:{}}
    ],
    leagues:[],
    matches:[],
    history:[],
    development:[],
    nationalTeam:{
      caps:0,
      goals:0,
      assists:0
    },
    extras:{
      transfers:[],
      playerCareer:{
        marketValue:10000000
      }
    },
    statistics:{
      players:{
        hero:{
          appearances:28,
          starts:28,
          minutes:2240,
          goals:16,
          assists:0,
          ratingTotal:198,
          byCompetition:{},
          byClub:{}
        }
      },
      awards:[],
      milestones:[],
      records:{},
      processedMatches:[],
      heroStints:[
        stint(2026,"flu","Fluminense",0,180,8,4,56),
        stint(2026,"sp","S\u00e3o Paulo",180,364,9,6,64),
        stint(2027,"sp","S\u00e3o Paulo",365,null,11,6,78)
      ],
      seasons:[
        {
          season:2026,
          player:{
            club:"S\u00e3o Paulo",
            appearances:17,
            goals:10,
            assists:0,
            averageRating:7.06,
            overallEnd:82,
            marketValueEnd:9000000
          }
        }
      ]
    }
  };
}

test("mid-season transfer keeps both club links in season history",()=>{
  const insight=Statistics.careerInsights(state());

  const rows=insight.seasons.filter(x=>x.season===2026);

  assert.equal(rows.length,2);
  assert.deepEqual(
    rows.map(x=>x.club),
    ["Fluminense","S\u00e3o Paulo"]
  );

  assert.equal(rows[0].appearances,8);
  assert.equal(rows[0].goals,4);

  assert.equal(rows[1].appearances,9);
  assert.equal(rows[1].goals,6);
});

test("current season keeps current club link",()=>{
  const insight=Statistics.careerInsights(state());

  const row=insight.seasons.find(
    x=>x.season===2027 && x.clubId==="sp"
  );

  assert.ok(row);
  assert.equal(row.club,"S\u00e3o Paulo");
  assert.equal(row.appearances,11);
  assert.equal(row.goals,6);
});

test("best season still uses full season totals instead of one club stint",()=>{
  const insight=Statistics.careerInsights(state());

  assert.ok(insight.bestSeason);
  assert.equal(insight.bestSeason.season,2026);
  assert.equal(insight.bestSeason.appearances,17);
  assert.equal(insight.bestSeason.goals,10);
});
