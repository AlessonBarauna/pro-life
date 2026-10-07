const test=require("node:test");
const assert=require("node:assert/strict");

const Statistics=require("../src/domain/statistics.js");

function makeState(){
  return {
    mode:"player",
    season:2026,
    day:200,
    clubId:"mirassol",
    person:{name:"Hero",pos:"ATA",attrs:{}},
    clubs:[
      {id:"mirassol",name:"Mirassol",roster:[{id:"hero"}],stats:{}}
    ],
    matches:[],
    history:[],
    development:[],
    nationalTeam:{caps:0,goals:0,assists:0},
    extras:{playerCareer:{marketValue:0}},
    statistics:{
      players:{
        hero:{
          appearances:20,
          starts:20,
          minutes:1713,
          goals:9,
          assists:0,
          motm:0,
          ratingTotal:136,
          saves:0,
          tackles:0,
          shots:53,
          onTarget:36,
          xg:6.26,
          yellowCards:0,
          redCards:0,
          wins:9,
          draws:5,
          losses:6,
          hatTricks:0,
          cleanSheets:0,
          byCompetition:{
            paulista:{
              appearances:6,starts:6,minutes:459,goals:6,assists:0,motm:0,ratingTotal:45.6,
              saves:0,tackles:0,shots:18,onTarget:14,xg:3.1,yellowCards:0,redCards:0,
              wins:4,draws:1,losses:1,hatTricks:0,cleanSheets:0
            },
            seriea:{
              appearances:14,starts:14,minutes:1254,goals:3,assists:0,motm:0,ratingTotal:90.4,
              saves:0,tackles:0,shots:35,onTarget:22,xg:3.16,yellowCards:0,redCards:0,
              wins:5,draws:4,losses:5,hatTricks:0,cleanSheets:0
            }
          },
          byClub:{
            mirassol:{
              appearances:20,starts:20,minutes:1713,goals:9,assists:0,motm:0,ratingTotal:136,
              saves:0,tackles:0,shots:53,onTarget:36,xg:6.26,yellowCards:0,redCards:0,
              wins:9,draws:5,losses:6,hatTricks:0,cleanSheets:0
            }
          }
        }
      },
      awards:[],
      seasons:[],
      milestones:[],
      records:{},
      processedMatches:[],
      heroStints:[
        {
          season:2026,
          clubId:"mirassol",
          club:"Mirassol",
          startDay:20,
          endDay:null,
          transferType:"current",
          appearances:18,
          starts:18,
          minutes:1595,
          goals:6,
          assists:0,
          motm:0,
          ratingTotal:119.8,
          saves:0,
          tackles:0,
          shots:47,
          onTarget:32,
          xg:5.47,
          yellowCards:0,
          redCards:0,
          wins:0,
          draws:0,
          losses:0,
          hatTricks:0,
          cleanSheets:0
        }
      ]
    }
  };
}

test("single-club season uses canonical season totals instead of incomplete stint",()=>{
  const dash=Statistics.heroDashboard(makeState());

  assert.equal(dash.season.appearances,20);
  assert.equal(dash.season.goals,9);

  assert.equal(dash.currentClubSeason.appearances,20);
  assert.equal(dash.currentClubSeason.goals,9);
  assert.equal(dash.currentClubSeason.minutes,1713);

  assert.equal(dash.currentClubSeason.wins,9);
  assert.equal(dash.currentClubSeason.draws,5);
  assert.equal(dash.currentClubSeason.losses,6);
});

test("season result totals are aggregated from competitions",()=>{
  const dash=Statistics.heroDashboard(makeState());

  assert.equal(dash.season.wins,9);
  assert.equal(dash.season.draws,5);
  assert.equal(dash.season.losses,6);
});
