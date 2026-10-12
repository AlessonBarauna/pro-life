"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const S=require("../src/domain/champions-standings.js");
const D=require("../src/domain/engine.js");

test("34F.32B.5A calcula pontos e saldo",()=>{
  const edition={
    entrants:[["a","ESP"],["b","ENG"],["c","ITA"]],
    leagueSchedule:{matches:[
      {homeId:"a",awayId:"b",played:true,hg:2,ag:1},
      {homeId:"b",awayId:"c",played:true,hg:0,ag:0},
      {homeId:"c",awayId:"a",played:false}
    ]}
  };
  const rows=S.standings(edition);
  assert.deepEqual(rows.map(r=>r.id),["a","c","b"]);
  assert.equal(rows[0].points,3);
  assert.equal(rows.find(r=>r.id==="b").points,1);
  assert.equal(rows.find(r=>r.id==="a").gd,1);
  assert.equal(rows.find(r=>r.id==="c").played,1);
});

test("34F.32B.5A ordenacao e deterministica",()=>{
  const edition={
    entrants:[["z","ESP"],["a","ENG"]],
    leagueSchedule:{matches:[]}
  };
  assert.deepEqual(S.standings(edition).map(x=>x.id),["a","z"]);
});

test("34F.32B.5A classifica 36 clubes do FC27",()=>{
  const s=D.create({
    mode:"player",clubId:"c0",catalogVersion:"fc27_v1"
  },5);

  D.advance(s,1);
  const ed=D.Continental.edition(s,"ucl");
  const first=Math.min(...ed.leagueSchedule.matches.map(m=>m.day));

  while(s.day<first)D.advance(s,Math.min(30,first-s.day));

  const rows=S.standings(ed);
  const played=ed.leagueSchedule.matches.filter(m=>m.played);

  assert.equal(rows.length,36);
  assert.equal(new Set(rows.map(r=>r.id)).size,36);
  assert.equal(rows.reduce((n,r)=>n+r.played,0),played.length*2);
  assert.equal(rows.reduce((n,r)=>n+r.points,0),
    played.reduce((n,m)=>n+(m.hg===m.ag?2:3),0));

  console.log("Jogos concluidos:",played.length);
  console.log("Clubes classificados:",rows.length);
  console.log("TOP 8:",rows.slice(0,8).map(r=>
    `${r.position}. ${r.id} - ${r.points} pts`
  ).join(" | "));
});

test("34F.32B.5A diagnostica participacao individual",()=>{
  const madrid="gf_fc27_243";
  const s=D.create({
    mode:"player",clubId:madrid,catalogVersion:"fc27_v1"
  },5);

  if(s.clubId!==madrid){
    s.offers ||= [];
    s.offers.push({
      clubId:madrid,salary:90000,durationDays:730,
      signingBonus:0,squadRole:"Rotação",
      transferType:"permanent",expires:s.day+30
    });
    D.join(s,madrid,90000);
  }

  assert.equal(s.clubId,madrid);
  D.advance(s,1);

  const ed=D.Continental.edition(s,"ucl");
  const next=ed.leagueSchedule.matches
    .filter(m=>[m.homeId,m.awayId].includes(madrid))
    .sort((a,b)=>a.day-b.day)[0];

  while(s.day<next.day)
    D.advance(s,Math.min(30,next.day-s.day));

  const match=s.matches.find(m=>
    m.competitionId==="ucl" &&
    m.home===next.homeId && m.away===next.awayId
  );

  assert.ok(match,"Partida oficial do Real Madrid ausente");

  console.log("Hero na escalação:",!!match.participation?.hero);
  console.log("Hero recebeu nota:",Number.isFinite(match.ratings?.hero));
  console.log("Hero playerStats:",JSON.stringify(match.playerStats?.hero??null));
  console.log("Hero no elenco:",!!s.worldMatchClubs?.[madrid]?.roster?.some(p=>p.id==="hero"));
  console.log("Clube do protagonista:",s.clubId);

  if(!match.participation?.hero)
    console.log("PENDENCIA: verificar escalação e utilização do protagonista.");
});