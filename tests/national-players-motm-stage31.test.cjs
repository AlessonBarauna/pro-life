const test=require("node:test");
const assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");
const Home=require("../src/ui/home-dashboard.js");
const Save=require("../src/infrastructure/save.js");

const Calendar={events:()=>[]};
const norm=v=>String(v||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
const cache={};

function build(kind){
  const s=D.create({mode:"player",clubId:"c0"},34000);
  s.person.attrs=Object.fromEntries(Object.keys(s.person.attrs).map(k=>[k,99]));
  s.reputation=99;
  const n=D.NationalTeam.init(s);n.calledUp=true;n.status="Titular";n.matches=[];
  if(kind==="wc"){s.day=156;D.NationalTeam.ensureWorldCupOfficialSquads(s,n,D,()=>{});n.calledUp=true;n.status="Titular";}
  return s;
}
function state(kind){if(!cache[kind])cache[kind]=build(kind);return structuredClone(cache[kind]);}
function fixtureFor(s,kind){
  if(kind==="wc")return structuredClone(D.NationalTeam.init(s).schedule.find(m=>m.tournamentType==="WORLD_CUP"&&!m.played));
  return {id:"qual-1",day:s.day,opponent:"Argentina",competition:"Eliminatórias",stage:"Rodada 1",played:false};
}
function playOne(kind,seed,mutate){
  const s=state(kind);if(mutate)mutate(s);
  const fixture=fixtureFor(s,kind),live=D.NationalTeam.play(s,new D.Random(seed),D,()=>{},fixture);
  return {s,live,fixture,m:s.nationalTeam.matches[0]};
}
function findMatch(kind,pred,max=60){
  for(let seed=1;seed<=max;seed++){const r=playOne(kind,seed);if(r.m&&pred(r))return {...r,seed};}
  throw new Error("cenário não encontrado: "+kind);
}
function allObjects(s){
  const list=[...(s.internationalPlayers||[])];
  for(const c of s.clubs||[])list.push(...(c.roster||[]));
  try{list.push(...D.GlobalFootball.allPlayers(s));}catch(e){}
  return list;
}
function nationalityOf(s,id){
  const p=allObjects(s).find(x=>x.id===id);return p?norm(p.nationality):null;
}
const rowsOf=m=>m.players.map(r=>({id:r[0],name:r[1],side:r[2],pos:r[3],minutes:r[4],rating:r[5]}));

test("31.3.4 (1) Brasil × Argentina nas Eliminatórias identifica autores das duas seleções",()=>{
  const {s,m}=findMatch("qual",(r)=>r.m.brazil>=1&&r.m.other>=1);
  const rows=rowsOf(m);
  assert.ok(rows.length>=22);
  for(const r of rows.filter(x=>x.side===1))assert.equal(nationalityOf(s,r.id),"argentina",r.name);
  for(const r of rows.filter(x=>x.side===0&&x.id!=="hero"))assert.match(nationalityOf(s,r.id)||"",/^(brasil|brazil)$/,r.name);
  assert.ok(m.events.some(e=>e.side===1&&e.scorerId&&e.scorer));
  assert.ok(m.events.some(e=>e.side===0&&e.scorerId&&e.scorer));
});

test("31.3.4 (2) Copa do Mundo usa o elenco oficial congelado do adversário",()=>{
  const {s,fixture,m}=findMatch("wc",(r)=>r.m.other>=1);
  const cup=s.nationalTeam.tournaments.find(t=>t.type==="WORLD_CUP"&&Number(t.year)===Number(fixture.tournamentYear));
  const entry=cup.squads.find(x=>norm(x.name)===norm(fixture.opponent));
  assert.ok(entry,"elenco do adversário");
  const official=new Set(entry.squad.map(p=>p.id));
  const side1=rowsOf(m).filter(r=>r.side===1);
  assert.ok(side1.length>=11);
  for(const r of side1)assert.ok(official.has(r.id),r.name+" fora do elenco oficial");
  const brazil=new Set(cup.squads.find(x=>x.id==="BRA").squad.map(p=>p.id));
  for(const r of rowsOf(m).filter(x=>x.side===0))assert.ok(r.id==="hero"||brazil.has(r.id),r.name+" fora da convocação");
});

test("31.3.4 (3)(4)(5) gols e assistências só de participantes da seleção correta, sem autoassistência",()=>{
  for(const kind of ["qual","wc"]){
    const {m}=findMatch(kind,(r)=>r.m.brazil+r.m.other>=3);
    const rows=rowsOf(m),byId=new Map(rows.map(r=>[r.id,r]));
    for(const e of m.events){
      if(e.scorerId){const r=byId.get(e.scorerId);assert.ok(r,"autor fora dos participantes");assert.equal(r.side,e.side);assert.ok(r.minutes>0);}
      if(e.assistId){const r=byId.get(e.assistId);assert.ok(r,"assistente fora dos participantes");assert.equal(r.side,e.side);assert.notEqual(e.assistId,e.scorerId);assert.ok(r.minutes>0);}
    }
    const goalsById={};m.events.forEach(e=>{if(e.scorerId)goalsById[e.scorerId]=(goalsById[e.scorerId]||0)+1;});
    assert.ok(Object.keys(goalsById).every(id=>byId.has(id)));
  }
});

test("31.3.4 (5) reservas não utilizados não aparecem nem têm eventos",()=>{
  const {m}=findMatch("qual",(r)=>r.m.brazil+r.m.other>=2);
  const rows=rowsOf(m);
  assert.ok(rows.every(r=>r.minutes>0));
  assert.ok(rows.length<=11*2+6+1,"mais substitutos que o permitido");
  const ids=new Set(rows.map(r=>r.id));
  m.events.forEach(e=>{if(e.scorerId)assert.ok(ids.has(e.scorerId));if(e.assistId)assert.ok(ids.has(e.assistId));});
  for(const side of [0,1])assert.ok(rows.filter(r=>r.side===side).length<=14);
});

test("31.3.4 (5b) jogador lesionado ou suspenso não participa",()=>{
  const first=findMatch("qual",(r)=>r.m.brazil>=1);
  const victim=rowsOf(first.m).find(r=>r.side===0&&r.id!=="hero");
  const run=(patch)=>playOne("qual",first.seed,(s)=>{for(const p of allObjects(s))if(p.id===victim.id)Object.assign(p,patch);});
  const injured=run({injury:10});
  assert.ok(!rowsOf(injured.m).some(r=>r.id===victim.id),"lesionado participou");
  const suspended=run({suspension:2});
  assert.ok(!rowsOf(suspended.m).some(r=>r.id===victim.id),"suspenso participou");
});

test("31.3.4 (6) participação, minutos e nota do personagem preservados",()=>{
  for(const kind of ["qual","wc"]){
    const {s,live,m}=findMatch(kind,(r)=>r.m.minutes>0);
    const hero=rowsOf(m).find(r=>r.id==="hero");
    assert.ok(hero);
    assert.equal(hero.minutes,m.minutes);
    assert.equal(hero.rating,m.rating);
    assert.equal(hero.side,0);
    assert.equal(live.hg,m.brazil);
    assert.equal(m.events.filter(e=>e.scorerId==="hero").length,m.goals);
    assert.equal(s.nationalTeam.goals,m.goals);
    assert.equal(rowsOf(m).filter(r=>r.id==="hero").length,1);
  }
});

test("31.3.4 (7) Melhor da Partida vem da maior nota entre participantes, com notas de 1 a 10",()=>{
  const seen=new Set();
  for(let seed=1;seed<=10;seed++){
    const {m}=playOne("qual",seed);if(!m)continue;
    const rows=rowsOf(m);
    rows.forEach(r=>{assert.ok(Number.isFinite(r.rating)&&r.rating>=1&&r.rating<=10,r.name+" "+r.rating);assert.ok(r.minutes>0);});
    const best=Math.max(...rows.map(r=>r.rating));
    assert.ok(m.motm);
    assert.equal(m.motm.rating,best);
    const row=rows.find(r=>r.id===m.motm.id);
    assert.ok(row);assert.equal(row.rating,best);
    const tied=rows.filter(r=>r.rating===best).sort((a,b)=>{
      const ga=m.events.filter(e=>e.scorerId===a.id).length+m.events.filter(e=>e.assistId===a.id).length,gb=m.events.filter(e=>e.scorerId===b.id).length+m.events.filter(e=>e.assistId===b.id).length;
      return gb-ga||String(a.id).localeCompare(String(b.id));
    });
    assert.equal(m.motm.id,tied[0].id);
    seen.add(m.motm.id==="hero"?"hero":"other");
  }
  assert.ok(seen.has("other"),"melhor da partida nunca é outro jogador");
});

test("31.3.4 (8) soma dos gols dos eventos e dos jogadores é igual ao placar",()=>{
  for(const kind of ["qual","wc"]){
    for(let seed=1;seed<=6;seed++){
      const {live,m}=playOne(kind,seed);if(!m)continue;
      assert.equal(m.events.filter(e=>e.side===0).length,m.brazil);
      assert.equal(m.events.filter(e=>e.side===1).length,m.other);
      assert.equal(live.hg,m.brazil);assert.equal(live.ag,m.other);
      const minutes=m.events.map(e=>e.minute);
      assert.deepEqual(minutes,[...minutes].sort((a,b)=>a-b));
      assert.equal(new Set(minutes).size,minutes.length);
    }
  }
});

test("31.3.4 (9) save/reload preserva detalhes sem duplicar e a Central os lê",()=>{
  const {s,m}=findMatch("qual",(r)=>r.m.brazil>=1);
  const copy=Save.parse(JSON.stringify(s)),again=Save.parse(JSON.stringify(copy));
  assert.deepEqual(copy.nationalTeam.matches[0].events,m.events);
  assert.deepEqual(copy.nationalTeam.matches[0].players,m.players);
  assert.deepEqual(copy.nationalTeam.matches[0].motm,m.motm);
  assert.deepEqual(again.nationalTeam.matches,s.nationalTeam.matches);
  assert.equal(copy.nationalTeam.matches.length,1);
  const row=Home.snapshot(copy,D,Calendar).recent.find(x=>x.national);
  assert.ok(row.motm&&row.motm.name===m.motm.name&&row.motm.rating===m.motm.rating);
  assert.ok(row.goals.every(g=>Number.isFinite(g.minute)));
  assert.ok(row.goals.filter(g=>g.scorer).length>=1);
  assert.ok(JSON.stringify(m.players).length<2600,"detalhes compactos");
});

test("31.3.4 (10) histórico antigo sem detalhes continua sem autores e sem prêmio inventados",()=>{
  const s=state("qual");
  s.nationalTeam.matches=[
    {season:s.season,day:s.day,competition:"Eliminatórias",opponent:"Chile",brazil:2,other:1,rating:7.5,starter:true,entryMinute:null,minutes:90,goals:1,assists:0},
    {season:s.season,day:s.day,competition:"Eliminatórias",opponent:"Peru",brazil:1,other:0,rating:7.1,starter:true,entryMinute:null,minutes:90,goals:0,assists:0,events:[{minute:30,side:0,scorerId:null,scorer:null,assistId:null,assist:null}]}
  ];
  const rows=Home.snapshot(Save.parse(JSON.stringify(s)),D,Calendar).recent.filter(x=>x.national);
  assert.equal(rows.length,2);
  assert.ok(rows.every(r=>r.motm===null));
  assert.ok(rows.some(r=>r.goals===null));
  assert.equal(rows.find(r=>r.opponent==="Peru").goals[0].scorer,null);
});

test("31.3.4 (10b) prêmio inconsistente é descartado pela Central",()=>{
  const {s,m}=findMatch("qual",(r)=>r.m.minutes>0);
  const other=rowsOf(m).find(r=>r.rating<m.motm.rating);
  s.nationalTeam.matches[0].motm={id:other.id,name:other.name,rating:other.rating,side:other.side};
  assert.equal(Home.snapshot(s,D,Calendar).recent.find(x=>x.national).motm,null);
});

test("31.3.4 (11) mesma seed produz exatamente os mesmos detalhes",()=>{
  for(const kind of ["qual","wc"]){
    const a=playOne(kind,7),b=playOne(kind,7);
    assert.deepEqual(a.m.events,b.m.events);
    assert.deepEqual(a.m.players,b.m.players);
    assert.deepEqual(a.m.motm,b.m.motm);
    assert.deepEqual([a.m.brazil,a.m.other,a.m.rating,a.m.minutes],[b.m.brazil,b.m.other,b.m.rating,b.m.minutes]);
  }
});
