"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const D=require("../src/domain/engine.js");
const App=require("../src/application/game.js");
const Save=require("../src/infrastructure/save.js");

function profile(ger,seed){
  const s=D.create({mode:"player",world:"brazil2026",clubId:"c0"},seed);
  for(const key of Object.keys(s.person.attrs)) s.person.attrs[key]=ger;
  s.person.potential=Math.max(ger,ger+2);
  s.person.age=25;
  s.reputation=ger>=80?90:ger<=45?5:55;
  D.Career.init(s).playerCareer.lastEvaluation={rating:ger>=80?8.2:ger<=45?6:7.2};
  return s;
}
const offers=(s,seed)=>D.weightedCareerOffers(s,new D.Random(seed),9999);
const local=(s,id)=>s.clubs.some(club=>club.id===id);
const level=(s,id)=>{const c=D.club(s,id);return Number(c?.structure??c?.strength??c?.reputation??0);};

test("30.3: filtros combinam Série A e mercado internacional sem vazamento",()=>{
  const s=profile(86,30301);
  App.execute(s,"offerPrefs",{leagues:["serieA"],international:false,clubLevel:"any"});
  let result=offers(s,30311);
  assert.ok(result.length>0);
  assert.ok(result.every(offer=>local(s,offer.clubId)&&D.club(s,offer.clubId).leagueId==="serieA"));

  App.execute(s,"offerPrefs",{leagues:["serieA"],international:true,clubLevel:"any"});
  result=offers(s,30312);
  assert.ok(result.some(offer=>local(s,offer.clubId)&&D.club(s,offer.clubId).leagueId==="serieA"));
  assert.ok(result.some(offer=>!local(s,offer.clubId)));

  App.execute(s,"offerPrefs",{leagues:[],international:true,clubLevel:"any"});
  result=offers(s,30313);
  assert.ok(result.length>0);
  assert.ok(result.every(offer=>!local(s,offer.clubId)));
});

test("30.3: nível do clube e elegibilidade esportiva continuam obrigatórios",()=>{
  const elite=profile(86,30302);
  App.execute(elite,"offerPrefs",{leagues:["serieA"],international:true,clubLevel:"elite"});
  const eliteOffers=offers(elite,30321);
  assert.ok(eliteOffers.length>0);
  assert.ok(eliteOffers.every(offer=>level(elite,offer.clubId)>=75));

  const beginner=profile(40,30303);
  App.execute(beginner,"offerPrefs",{leagues:[],international:true,clubLevel:"elite"});
  const unrealistic=offers(beginner,30322);
  assert.equal(unrealistic.some(offer=>level(beginner,offer.clubId)>=75),false);
});

test("30.3: novas preferências também removem propostas pendentes incompatíveis",()=>{
  const s=profile(86,30304),serieA=s.clubs.find(club=>club.leagueId==="serieA"&&club.id!==s.clubId),serieB=s.clubs.find(club=>club.leagueId==="serieB"),foreign=D.careerClubPool(s).find(club=>!local(s,club.id));
  s.careerTransferAvailableDay=0;
  s.offers=[serieA,serieB,foreign].map(club=>({clubId:club.id,expires:s.day+10,salary:10000}));
  App.execute(s,"offerPrefs",{leagues:["serieA"],international:false,clubLevel:"any"});
  assert.deepEqual(s.offers.map(offer=>offer.clubId),[serieA.id]);
  s.offers=[serieA,foreign].map(club=>({clubId:club.id,expires:s.day+10,salary:10000}));
  App.execute(s,"offerPrefs",{leagues:[],international:true,clubLevel:"any"});
  assert.deepEqual(s.offers.map(offer=>offer.clubId),[foreign.id]);
});

test("30.3: preferência internacional persiste no save e saves antigos mantêm padrão compatível",()=>{
  const s=profile(70,30305);
  delete D.Career.init(s).offerPreferences.international;
  assert.equal(D.Career.init(s).offerPreferences.international,undefined);
  assert.ok(offers(s,30331).some(offer=>!local(s,offer.clubId)));
  App.execute(s,"offerPrefs",{leagues:["serieA"],international:false,clubLevel:"competitive"});
  const restored=Save.parse(JSON.stringify(s));
  assert.deepEqual(D.Career.init(restored).offerPreferences,{leagues:["serieA"],clubLevel:"competitive",international:false});
});

test("30.3: interface expõe claramente o seletor internacional",()=>{
  const app=fs.readFileSync(require.resolve("../src/ui/app.js"),"utf8");
  assert.match(app,/id="offer-international"/);
  assert.match(app,/Clubes internacionais/);
  assert.match(app,/international: \$\("#offer-international"\)\?\.checked === true/);
});
