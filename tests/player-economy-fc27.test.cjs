"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");

const Economy=require("../src/domain/player-economy.js");
const Career=require("../src/domain/coach-career.js");

const eliteClub={id:"elite",name:"Clube de elite",reputation:90,roster:[]};

test("FC27 economy scales market value and salary by sporting level",()=>{
  const elite={id:"elite-player",ovr:88,overall:88,age:25,potential:91,pos:"ATA"};
  const rotation={id:"rotation-player",ovr:70,overall:70,age:25,potential:73,pos:"ATA"};
  const eliteValue=Economy.estimateMarketValue(elite,eliteClub);
  const rotationValue=Economy.estimateMarketValue(rotation,eliteClub);
  assert.ok(eliteValue>200000000);
  assert.ok(eliteValue>rotationValue*4);
  assert.ok(Economy.expectedSalary(elite,eliteClub)>Economy.expectedSalary(rotation,eliteClub));
  assert.equal(Economy.expectedSalary(elite,eliteClub)%1000,0);
});

test("FC27 economy values young high-potential players above equivalent veterans",()=>{
  const prospect={id:"prospect",ovr:80,age:20,potential:91,pos:"MEI"};
  const veteran={id:"veteran",ovr:80,age:34,potential:80,pos:"MEI"};
  assert.ok(Economy.estimateMarketValue(prospect,eliteClub)>Economy.estimateMarketValue(veteran,eliteClub)*2);
});

test("contract initialization persists coherent salary, value and expiry",()=>{
  const state={day:42};
  const player={id:"new-contract",ovr:84,age:27,potential:86,pos:"MEI"};
  Economy.ensurePlayer(state,player,eliteClub);
  assert.ok(player.salary>=100000);
  assert.ok(player.marketValue>=100000000);
  assert.ok(player.contractEndDay>state.day);
  assert.equal(player.contract.salary,player.salary);
  assert.equal(player.contract.endDay,player.contractEndDay);
  assert.equal(player.contract.clubId,eliteClub.id);
});

test("negotiated values already stored in the save are preserved",()=>{
  const player={id:"negotiated",ovr:86,age:26,potential:87,pos:"ATA",salary:987654,marketValue:345678901,contractEndDay:800,contract:{salary:987654,endDay:800,source:"negotiated"}};
  Economy.ensurePlayer({day:100},player,eliteClub);
  assert.equal(player.salary,987654);
  assert.equal(player.marketValue,345678901);
  assert.equal(player.contractEndDay,800);
  assert.equal(player.contract.source,"negotiated");
});

test("legacy coach saves receive contracts for every current squad player",()=>{
  const club={id:"milan",name:"AC Milan",reputation:88,roster:[
    {id:"maignan",name:"Mike Maignan",ovr:87,age:31,potential:87,pos:"GOL"},
    {id:"pulisic",name:"Christian Pulisic",ovr:83,age:27,potential:83,pos:"MEI"}
  ]};
  const state={mode:"coach",day:20,clubId:club.id,clubs:[club],coachCareer:{version:1,stints:[],board:{history:[]},locker:{cooldowns:{},log:[]},focus:"equilibrado",playerDataVersion:3}};
  Career.init(state,{club:()=>club});
  assert.equal(state.coachCareer.playerDataVersion,4);
  for(const player of club.roster){
    assert.ok(player.salary>0,player.name+" needs a salary");
    assert.ok(player.marketValue>0,player.name+" needs a market value");
    assert.ok(player.contractEndDay>state.day,player.name+" needs an active contract");
  }
});
