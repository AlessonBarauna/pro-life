"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");

const C=D.Career;
const BASE=D.create(
  {mode:"player",clubId:"c0"},
  28300
);

function state(){
  const s=structuredClone(BASE);
  D.GlobalFootball.init(s);
  C.init(s);
  return s;
}

function profile({ger,age,potential,reputation,rating}){
  const s=state();
  for(const key of Object.keys(s.person.attrs))
    s.person.attrs[key]=ger;
  s.person.age=age;
  s.person.potential=potential;
  s.reputation=reputation;
  C.init(s).playerCareer.lastEvaluation={
    day:s.day,
    rating
  };
  assert.equal(D.overall(s.person),ger);
  return s;
}

function offers(s,seed=28301){
  return D.weightedCareerOffers(
    s,
    new D.Random(seed),
    9999
  );
}

function clubLevel(club){
  return Number(
    club?.structure ??
    club?.strength ??
    club?.reputation ??
    0
  );
}

test("28D.3: GER 65 jovem com potencial não recebe proposta oficial incompatível",()=>{
  const s=profile({
    ger:65,
    age:19,
    potential:85,
    reputation:25,
    rating:6.5
  });
  const pool=D.careerClubPool(s);
  const elite=pool.filter(club=>clubLevel(club)>=85);
  const result=offers(s,28310);
  const offered=new Set(result.map(offer=>offer.clubId));

  assert.ok(elite.length>0);
  assert.equal(C.interestAssessment(s,"gf_real_madrid").eligible,false);
  assert.equal(C.interestAssessment(s,"gf_man_city").eligible,false);
  assert.equal(elite.some(club=>offered.has(club.id)),false);
  assert.equal(result.every(offer=>C.interestAssessment(s,offer.clubId)?.eligible===true),true);
});

test("28D.3: GER 78 com desempenho e reputação intermediários alcança clubes fortes",()=>{
  const s=profile({
    ger:78,
    age:22,
    potential:88,
    reputation:55,
    rating:7.4
  });
  const pool=new Map(D.careerClubPool(s).map(club=>[club.id,club]));
  const result=offers(s,28320);
  const compatible=result.filter(offer=>{
    const level=clubLevel(pool.get(offer.clubId));
    return level>=75&&level<85;
  });

  assert.ok(compatible.length>0);
  assert.equal(compatible.every(offer=>C.interestAssessment(s,offer.clubId).eligible),true);
});

test("28D.3: GER 86 consolidado pode receber interesse e oferta de elite",()=>{
  const s=profile({
    ger:86,
    age:27,
    potential:90,
    reputation:90,
    rating:8.2
  });
  const pool=new Map(D.careerClubPool(s).map(club=>[club.id,club]));
  const result=offers(s,28330);
  const elite=result.filter(offer=>clubLevel(pool.get(offer.clubId))>=85);

  assert.equal(C.interestAssessment(s,"gf_real_madrid").eligible,true);
  assert.equal(C.interestAssessment(s,"gf_man_city").eligible,true);
  assert.ok(elite.length>0);
});

test("28D.3: idade, potencial e avaliação recente alteram a elegibilidade real",()=>{
  const low=profile({
    ger:70,
    age:30,
    potential:70,
    reputation:40,
    rating:5.5
  });
  const high=profile({
    ger:70,
    age:19,
    potential:90,
    reputation:40,
    rating:8.2
  });
  const target=D.careerClubPool(low).find(club=>{
    const a=C.interestAssessment(low,club.id);
    const b=C.interestAssessment(high,club.id);
    return a&&!a.eligible&&b?.eligible;
  });

  assert.ok(target,"deve existir clube na faixa afetada pelo perfil");
  const before=C.interestAssessment(low,target.id);
  const after=C.interestAssessment(high,target.id);
  assert.ok(after.marketScore>before.marketScore);
  assert.equal(before.eligible,false);
  assert.equal(after.eligible,true);
});

test("28D.3: propostas possuem contratos e pontuações finitos e não negativos",()=>{
  const s=profile({
    ger:86,
    age:27,
    potential:90,
    reputation:90,
    rating:8.2
  });
  const result=offers(s,28340);
  assert.ok(result.length>0);

  for(const offer of result){
    for(const key of [
      "salary",
      "signingBonus",
      "durationDays",
      "interestScore",
      "expires",
      "responseDeadline"
    ]){
      assert.equal(Number.isFinite(offer[key]),true,`${offer.clubId}:${key}`);
      assert.ok(offer[key]>=0,`${offer.clubId}:${key}`);
    }
    assert.ok(offer.salary>0);
    assert.ok(offer.durationDays>=365);
  }
});

test("28D.3: recusa cria cooldown e impede nova proposta do mesmo clube",()=>{
  const s=profile({
    ger:78,
    age:22,
    potential:88,
    reputation:55,
    rating:7.4
  });
  const initial=offers(s,28350);
  assert.ok(initial.length>0);
  const rejected=initial[0];
  s.offers=[rejected];

  C.rejectOffer(s,rejected.clubId);
  const pc=C.init(s).playerCareer;
  assert.ok(pc.marketState.rejectionCooldowns[rejected.clubId]>s.day);
  assert.equal(offers(s,28350).some(offer=>offer.clubId===rejected.clubId),false);
});

test("28D.3: rumor incompatível não progride para oferta oficial",()=>{
  const s=profile({
    ger:65,
    age:19,
    potential:85,
    reputation:25,
    rating:6.5
  });
  const pc=C.init(s).playerCareer;
  pc.interests=[];
  s.offers=[];
  s.careerTransferAvailableDay=0;
  C.registerInterest(s,"gf_real_madrid","Rumor");
  const rng=new D.Random(28360);

  for(let step=0;step<5;step++)
    C.progressInterest(s,rng,D.weightedCareerOffers);

  const interest=pc.interests.find(item=>item.clubId==="gf_real_madrid");
  assert.ok(interest);
  assert.notEqual(interest.stage,"Oferta oficial");
  assert.equal(s.offers.some(offer=>offer.clubId==="gf_real_madrid"),false);
});

test("28D.3: IDs globais são válidos e transferências não duplicam o jogador",()=>{
  const s=profile({
    ger:86,
    age:27,
    potential:90,
    reputation:90,
    rating:8.2
  });
  for(const id of ["gf_man_city","gf_real_madrid"]){
    const club=D.club(s,id);
    assert.ok(club,id);
    assert.equal(club.id,id);
    D.movePlayerToClub(s,id);
  }

  const heroes=D.GlobalFootball.allPlayers(s).filter(player=>player.id==="hero");
  assert.equal(heroes.length,1);
  assert.equal(heroes[0].clubId,"gf_real_madrid");
  assert.equal(s.clubs.flatMap(club=>club.roster||[]).filter(player=>player.id==="hero").length,0);
});

test("28D.3: mercado é determinístico com estado e seed fixos",()=>{
  const config={
    ger:78,
    age:22,
    potential:88,
    reputation:55,
    rating:7.4
  };
  const a=offers(profile(config),28370);
  const b=offers(profile(config),28370);

  assert.deepEqual(a,b);
});

test("28D.3: avaliações de mercado não alteram elencos, propostas ou save",()=>{
  const s=profile({
    ger:78,
    age:22,
    potential:88,
    reputation:55,
    rating:7.4
  });
  const targets=[
    "gf_real_madrid",
    "gf_man_city",
    D.careerClubPool(s).find(club=>club.id!==s.clubId)?.id
  ].filter(Boolean);
  const before=JSON.stringify(s);

  for(const id of targets){
    assert.ok(C.interestAssessment(s,id));
    assert.ok(D.club(s,id));
  }

  assert.equal(JSON.stringify(s),before);
});
