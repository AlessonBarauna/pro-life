"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const D=require("../src/domain/engine.js");
const Save=require("../src/infrastructure/save.js");
const Character=require("../src/domain/character.js");
require("../src/ui/creator.js");
const Creator=globalThis.ProLifeCreator;

function config(nationality="Brasil",startMode="offers",clubId=null){
  return {mode:"player",name:"Jogador Teste",city:"Mogi das Cruzes",nationality,origin:"blank",pos:"ATA",points:{},creation:{difficulty:"normal",personality:"balanced",startMode},...(clubId?{clubId}:{})};
}
function creatorContext(){
  const app={innerHTML:"",addEventListener(type,handler){this[type]=handler;},removeEventListener(){}};
  const ctx={D,C:Character,$:selector=>selector==="#app"||selector===".wizard"?app:null,esc:value=>String(value??""),opt:()=>"",appearanceFields:()=>"",Charts:{radar:()=>""},avatar:()=>"",hasSaved:()=>false,classic(){},confirmReplace:()=>true,onStart(){},toast(message){throw Error(message);}};
  Creator.reset();Creator.mount(ctx);return {app,ctx};
}
const countryKey=(s,value)=>D.GlobalFootball.normalizedNationality(value||"");

test("31.5.1: catálogo canônico remove aliases, traduções e códigos duplicados",()=>{
  const s=D.create(config("Brasil"),31500),catalog=D.GlobalFootball.nationalityCatalog(s),names=catalog.map(item=>item.name),ids=catalog.map(item=>item.id);
  assert.equal(D.GlobalFootball.resolveNationality("Brazil"),"Brasil");
  assert.equal(D.GlobalFootball.resolveNationality("Belgium"),"Bélgica");
  assert.equal(D.GlobalFootball.resolveNationality("Belgica"),"Bélgica");
  assert.equal(D.GlobalFootball.resolveNationality("BLR"),"Belarus");
  assert.equal(D.GlobalFootball.resolveNationality("Bosnia and Herzegovina"),"Bósnia e Herzegovina");
  assert.equal(new Set(ids).size,ids.length);
  assert.ok(!names.some(name=>/^[A-Z]{2,4}$/.test(name)));
  assert.ok(names.includes("Brasil")&&names.includes("Bélgica")&&names.includes("Bósnia e Herzegovina"));
  const plain=value=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  assert.deepEqual(names,names.slice().sort((a,b)=>plain(a).localeCompare(plain(b),"pt-BR")));
});

test("31.5: criador oferece nacionalidade brasileira e estrangeira sem confundir cidade",()=>{
  creatorContext();
  assert.equal(Creator.state().cfg.nationality,"Brasil");
  Creator.state().cfg.nationality="Inglaterra";
  assert.equal(Creator.config().nationality,"Inglaterra");
  assert.equal(Creator.config().city,"Mogi das Cruzes");
  const source=fs.readFileSync(path.join(__dirname,"../src/ui/creator.js"),"utf8");
  assert.match(source,/name="nationality"/);
  assert.match(source,/Receber propostas/);
  assert.match(source,/Escolher meu clube/);
});

test("31.5: concorrência aceita clube global sem roster embutido",()=>{
  const players=[{id:"g1",pos:"ATA",ovr:72},{id:"g2",pos:"ATA",overall:66},{id:"g3",pos:"MEI",ovr:80}];
  const api={GlobalFootball:{playersByClub:()=>players},overall:p=>Number(p.ovr??p.overall),positionNeed:()=>2};
  const competition=D.Creation.competitionAt(api,{id:"global-1"},"ATA",68,{});
  assert.deepEqual({rank:competition.rank,count:competition.count,topOvr:competition.topOvr,need:competition.need},{rank:2,count:3,topOvr:72,need:2});
});

test("31.5: engine valida e persiste nacionalidade após save e reload",()=>{
  const brazil=D.create(config("Brasil"),31501),foreign=D.create(config("Inglaterra"),31502);
  assert.equal(brazil.person.nationality,"Brasil");
  assert.equal(foreign.person.nationality,"Inglaterra");
  assert.equal(Save.parse(JSON.stringify(foreign)).person.nationality,"Inglaterra");
  assert.equal(D.create(config("Nacionalidade inexistente"),31503).person.nationality,"Brasil");
});

test("31.5: propostas priorizam o país e ampliam a busca quando necessário",()=>{
  const s=D.create(config("Brasil"),31504),plan=D.Creation.resolve(D,config("Inglaterra"),31504);
  s.person.nationality="Inglaterra";
  const offers=D.Creation.opportunities(s,new D.Random(7001),D,plan);
  assert.ok(offers.length>0&&offers.length<=3);
  assert.ok(offers.every(o=>countryKey(s,D.club(s,o.clubId)?.country)==="inglaterra"));
  const clubCountries=new Set(D.careerClubPool(s).map(c=>countryKey(s,c.country)));
  const fallbackNationality=D.GlobalFootball.allPlayers(s).map(p=>p.nationality).find(n=>n&&!clubCountries.has(countryKey(s,n)));
  assert.ok(fallbackNationality,"fixture deve possuir nacionalidade sem liga própria");
  s.person.nationality=fallbackNationality;
  const fallback=D.Creation.opportunities(s,new D.Random(7002),D,{...plan});
  assert.ok(fallback.length>0&&fallback.length<=3);
  assert.ok(fallback.every(o=>D.club(s,o.clubId)));
});

test("31.5: escolha livre inicia em clube brasileiro ou internacional com contrato e objetivos",()=>{
  const catalog=D.create(config("Brasil"),31505),pool=D.careerClubPool(catalog),local=pool.find(c=>/^c\d+$/.test(c.id)),global=pool.find(c=>!/^c\d+$/.test(c.id)&&c.country!=="Brasil");
  assert.ok(local&&global);
  for(const [club,nationality] of [[local,"Brasil"],[global,global.country]]){
    const s=D.create(config(nationality,"club",club.id),31505);
    assert.equal(s.clubId,club.id);
    assert.equal(s.creation.started,true);
    assert.equal(s.creation.contract.clubId,club.id);
    assert.ok(Number.isFinite(s.creation.contract.salary)&&s.creation.contract.salary>0);
    assert.ok(s.creation.expectation&&s.creation.objectives.length>=2);
    assert.ok(D.Career.init(s).playerCareer.contract);
    assert.ok(D.Statistics.heroStintHistory(s).some(stint=>stint.clubId===club.id));
    if(club===global)assert.ok(Array.isArray(D.club(s,club.id).roster));
    const before=s.day;D.advance(s,2);assert.equal(s.day,before+2);
  }
});

test("31.5: estrangeiro não é tratado como brasileiro e catálogo não duplica clubes",()=>{
  const s=D.create(config("Inglaterra"),31506),ids=D.careerClubPool(s).map(c=>c.id);
  assert.equal(new Set(ids).size,ids.length);
  assert.equal(D.NationalTeam.callup(s,D,()=>{}),false);
  assert.equal(D.NationalTeam.init(s).calledUp,false);
});

test("31.5: oportunidades são determinísticas com seed fixa",()=>{
  const a=D.create(config("Inglaterra"),31507),b=D.create(config("Inglaterra"),31507);
  const project=state=>state.offers.map(o=>({clubId:o.clubId,salary:o.salary,durationDays:o.durationDays,squadRole:o.squadRole}));
  assert.deepEqual(project(a),project(b));
});
