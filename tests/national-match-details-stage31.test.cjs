const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const D=require("../src/domain/engine.js");
const Home=require("../src/ui/home-dashboard.js");
const Save=require("../src/infrastructure/save.js");

const Calendar={events:()=>[]};
const NEUTRAL="Autor não identificado";

const cache={};
function base(seed,status="Titular"){
  const key=status;
  if(!cache[key])cache[key]=build(31330,status);
  const s=structuredClone(cache[key]);s.rng=seed;return s;
}
function build(seed,status){
  const s=D.create({mode:"player",clubId:"c0"},seed);
  s.person.attrs=Object.fromEntries(Object.keys(s.person.attrs).map(k=>[k,99]));
  s.reputation=99;
  const n=D.NationalTeam.init(s);n.calledUp=true;n.status=status;n.matches=[];
  return s;
}
// Procura determinísticamente uma partida que satisfaça o predicado (sem alterar o motor).
function find(pred,status="Titular",withFixture=true){
  for(let seed=1;seed<=150;seed++){
    const s=base(7000+seed,status),fixture={id:"t",day:s.day,opponent:"Argentina",competition:"Eliminatórias",stage:"Rodada 1",played:false};
    const live=D.NationalTeam.play(s,new D.Random(seed),D,()=>{},withFixture?fixture:null);
    const m=s.nationalTeam.matches[0];
    if(live&&m&&pred(m,live))return {s,live,m,seed};
  }
  throw new Error("cenário não encontrado");
}
const heroGoalEvents=(live)=>live.events.filter(e=>e.playerId==="hero");
const heroAssistEvents=(live)=>live.events.filter(e=>e.assistPlayerId==="hero");

test("Stage 31.3.3 gol e assistência na mesma partida batem com os eventos",()=>{
  const {live,m}=find((m)=>m.goals===1&&m.assists===1);
  assert.equal(heroGoalEvents(live).length,1);
  assert.equal(heroAssistEvents(live).length,1);
  assert.notEqual(heroGoalEvents(live)[0],heroAssistEvents(live)[0]);
  assert.ok(m.brazil>=2);
  assert.equal(m.events.filter(e=>e.side===0).length,m.brazil);
  assert.equal(m.events.filter(e=>e.scorerId==="hero").length,m.goals);
  assert.equal(m.events.filter(e=>e.assistId==="hero").length,m.assists);
});

test("Stage 31.3.3 eventos do herói ficam dentro dos minutos em campo",()=>{
  const {live,m}=find((m)=>m.starter===false&&(m.goals||m.assists),"Rotação",false);
  for(const e of live.events.filter(x=>x.playerId==="hero"||x.assistPlayerId==="hero")){
    assert.ok(e.minute>=m.entryMinute&&e.minute<=90,`minuto ${e.minute} fora da participação`);
  }
});

test("Stage 31.3.3 múltiplos gols do Brasil e do adversário mantêm placar e ordem",()=>{
  const {live,m}=find((m)=>m.brazil>=3&&m.other>=1);
  assert.equal(live.hg,m.brazil);assert.equal(live.ag,m.other);
  assert.equal(m.events.length,m.brazil+m.other);
  const minutes=m.events.map(e=>e.minute);
  assert.deepEqual(minutes,[...minutes].sort((a,b)=>a-b));
  assert.equal(new Set(minutes).size,minutes.length);
  assert.equal(m.events.filter(e=>e.side===1).length,m.other);
});

test("Stage 31.3.3 gols sem assistência do herói e sem autores inventados",()=>{
  const {live,m}=find((m)=>m.goals===1&&m.assists===0);
  assert.equal(heroAssistEvents(live).length,0);
  assert.ok(m.events.every(e=>e.assistId!=="hero"));
  const known=new Set(m.players.map(r=>r[0]));
  for(const e of live.events){
    if(e.playerId==="hero")continue;
    // Stage 31.3.4: autor identificado entre os participantes; neutro somente sem jogador identificável.
    if(e.playerId===null)assert.equal(e.player,NEUTRAL);else assert.ok(known.has(e.playerId));
  }
  assert.ok(m.events.filter(e=>e.scorerId!=="hero").every(e=>e.scorerId===null?e.scorer===null:known.has(e.scorerId)));
});

test("Stage 31.3.3 assistência sem gol próprio",()=>{
  const {live,m}=find((m)=>m.goals===0&&m.assists===1);
  assert.equal(heroGoalEvents(live).length,0);
  assert.equal(heroAssistEvents(live).length,1);
  assert.notEqual(heroAssistEvents(live)[0].playerId,"hero");
  assert.equal(m.events.filter(e=>e.assistId==="hero").length,1);
});

test("Stage 31.3.3 ausência de participação não grava partida nem estatística",()=>{
  let found=null;
  for(let seed=1;seed<=150&&!found;seed++){
    const s=base(9000+seed,"Reserva"),n=s.nationalTeam,before={caps:n.caps,goals:n.goals,assists:n.assists};
    const live=D.NationalTeam.play(s,new D.Random(seed),D,()=>{});
    if(live&&n.caps===before.caps)found={s,live,n,before};
  }
  assert.ok(found);
  assert.equal(found.n.matches.length,0);
  assert.equal(found.n.goals,found.before.goals);assert.equal(found.n.assists,found.before.assists);
  assert.equal(heroGoalEvents(found.live).length,0);assert.equal(heroAssistEvents(found.live).length,0);
  assert.equal(Home.snapshot(found.s,D,Calendar).recent.filter(x=>x.national).length,0);
});

test("Stage 31.3.3 placar e estatísticas acumuladas seguem consistentes",()=>{
  const {s,live,m}=find((m)=>m.goals===1);
  const n=s.nationalTeam;
  assert.equal(n.goals,m.goals);assert.equal(n.assists,m.assists);
  assert.equal(`${live.hg}-${live.ag}`,`${m.brazil}-${m.other}`);
});

test("Stage 31.3.3 salvar e carregar não duplica nem altera eventos",()=>{
  const {s,m}=find((m)=>m.goals===1&&m.assists===1);
  const copy=Save.parse(JSON.stringify(s)),again=Save.parse(JSON.stringify(copy));
  assert.deepEqual(copy.nationalTeam.matches[0].events,m.events);
  assert.deepEqual(again.nationalTeam.matches,s.nationalTeam.matches);
  assert.equal(copy.nationalTeam.matches.length,1);
  assert.equal(copy.nationalTeam.goals,s.nationalTeam.goals);
  assert.equal(Home.snapshot(copy,D,Calendar).recent.filter(x=>x.national).length,1);
});

test("Stage 31.3.3 save antigo sem eventos continua legível e sem detalhes inventados",()=>{
  const s=base(31330);
  s.nationalTeam.matches=[{season:s.season,day:s.day,competition:"Eliminatórias",opponent:"Chile",brazil:2,other:1,rating:7.5,starter:true,entryMinute:null,minutes:90,goals:1,assists:0}];
  const copy=Save.parse(JSON.stringify(s));
  const row=Home.snapshot(copy,D,Calendar).recent.find(x=>x.national);
  assert.equal(row.goals,null);assert.equal(row.motm,null);
  assert.equal(row.hero.goals,1);assert.equal(row.score,"2–1");
});

test("Stage 31.3.3 detalhes da Central V3 recebem gols, minutos e assistência do herói",()=>{
  const {s,m}=find((m)=>m.goals===1&&m.assists===1);
  const row=Home.snapshot(s,D,Calendar).recent.find(x=>x.national);
  assert.ok(Array.isArray(row.goals));
  assert.equal(row.goals.length,m.brazil+m.other);
  assert.equal(row.goals.filter(g=>g.scorer===s.person.name).length,1);
  assert.equal(row.goals.filter(g=>g.assist===s.person.name).length,1);
  assert.ok(row.goals.every(g=>Number.isFinite(g.minute)));
  assert.ok(row.motm===null||Number.isFinite(row.motm.rating));
  const app=fs.readFileSync(path.join(__dirname,"..","src","ui","app.js"),"utf8");
  assert.match(app,/x\.national&&!Array\.isArray\(x\.goals\)/);
  assert.match(app,/Autor não identificado/);
  assert.match(app,/Informação não disponível neste registro/);
});

test("Stage 31.3.3 rótulos de Eliminatórias sem caractere corrompido",()=>{
  const src=fs.readFileSync(path.join(__dirname,"..","src","domain","national-team.js"),"utf8");
  assert.doesNotMatch(src,/Eliminat\?rias/);
  assert.match(src,/"Ciclo de Eliminatórias"/);
});
