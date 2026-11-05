"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const E=require("../src/domain/engine.js");
const A=require("../src/application/game.js");
const CN=E.CoachNational;

function coach(rep=58){
  const s=E.create({mode:"coach",catalogVersion:"fc27_v1"},4242);
  s.clubId=null;E.join(s,"gf_fc27_5",90000);
  s.reputation=rep;
  return s;
}

test("treinador: candidatura exige reputação mínima", {timeout:0},()=>{
  const s=coach(35);
  assert.throws(()=>CN.apply(s,E,"BRA"),/exige reputação/);
  const ov=CN.overview(s,E);
  assert.ok(ov.nations.length>=30);
  assert.equal(ov.team,null);
  const ok=ov.nations.find(n=>n.eligible);
  assert.ok(ok,"deve haver ao menos uma seleção acessível");
  CN.apply(s,E,ok.code);
  assert.equal(s.coachNational.teamId,ok.code);
  assert.equal(s.coach.nationalTeamId,ok.code,"NationalIdentity.coachTeam passa a enxergar o vínculo");
  assert.throws(()=>CN.apply(s,E,ok.code),/já comanda/);
});

test("treinador: convocação automática e manual respeitam limites", {timeout:0},()=>{
  const s=coach();
  const code=CN.overview(s,E).nations.find(n=>n.eligible).code;
  CN.apply(s,E,code);
  let ov=CN.overview(s,E);
  assert.equal(ov.called,26);
  assert.equal(ov.players.filter(p=>p.starter).length,11);
  const gks=ov.players.filter(p=>p.pos==="GOL"&&p.called);
  assert.ok(gks.length>=2);
  while(ov.players.filter(p=>p.pos==="GOL"&&p.called).length>2){CN.toggleCall(s,E,ov.players.filter(p=>p.pos==="GOL"&&p.called).at(-1).id);ov=CN.overview(s,E);}
  assert.throws(()=>CN.toggleCall(s,E,ov.players.find(p=>p.pos==="GOL"&&p.called).id),/2 goleiros/);
  assert.equal(ov.manual,true);
  const out=ov.players.find(p=>p.pos==="ATA"&&!p.called&&p.available);
  CN.toggleCall(s,E,out.id);
  assert.throws(()=>CN.toggleCall(s,E,ov.players.find(p=>!p.called&&p.available&&p.pos==="DEF").id),/já tem 26|26 jogadores/);
  CN.autoCallup(s,E);
  assert.equal(CN.overview(s,E).manual,false);
  CN.setFormation(s,E,"4-4-2");
  assert.equal(CN.overview(s,E).formation,"4-4-2");
  assert.throws(()=>CN.setFormation(s,E,"9-9-9"),/inválida/);
});

test("treinador: jogos nas datas FIFA entram em resultados e na reputação, sem erros", {timeout:0},()=>{
  const s=coach();
  const code=CN.overview(s,E).nations.find(n=>n.eligible).code;
  CN.apply(s,E,code);
  for(let i=0;i<14;i++){s.board=100;E.advance(s,30);}
  assert.equal(s.coachNationalError,undefined);
  const ov=CN.overview(s,E);
  assert.ok(ov.results.length>=6,"pelo menos 6 jogos em ~1 ano");
  assert.ok(ov.results.every(m=>/^[VED]$/.test(m.result)&&Number.isInteger(m.gf)&&Number.isInteger(m.ga)));
  assert.equal(new Set(ov.results.map(m=>m.id)).size,ov.results.length,"sem jogos duplicados");
  const msgs=(E.Career.init(s).inbox||s.inbox||[]);
  assert.ok(ov.record.p===ov.results.length);
});

test("treinador: deixar o cargo aplica quarentena e permite convites depois", {timeout:0},()=>{
  const s=coach();
  const code=CN.overview(s,E).nations.find(n=>n.eligible).code;
  CN.apply(s,E,code);
  CN.leave(s,E,"pedido");
  assert.equal(s.coachNational.teamId,null);
  assert.equal(s.coach.nationalTeamId,null);
  assert.throws(()=>CN.apply(s,E,code),/a partir do dia/);
  s.day+=61;
  CN.apply(s,E,code);
  assert.equal(s.coachNational.teamId,code);
});

test("treinador: convites chegam, podem ser aceitos ou recusados", {timeout:0},()=>{
  const s=coach(60);
  for(let i=0;i<3;i++){s.board=100;E.advance(s,30);}
  const cn=CN.init(s);
  assert.ok(cn.offers.length>=1,"reputação 60 deve gerar convite em 90 dias");
  const first=cn.offers[0].code;
  CN.declineOffer(s,E,first);
  assert.ok(!cn.offers.some(o=>o.code===first));
  if(cn.offers.length){const c=cn.offers[0].code;CN.acceptOffer(s,E,c);assert.equal(cn.teamId,c);}
});

test("treinador: comandos da aplicação chegam ao módulo", {timeout:0},()=>{
  const s=coach();
  const code=CN.overview(s,E).nations.find(n=>n.eligible).code;
  A.execute(s,"cnApply",{code});
  A.execute(s,"cnFormation",{formation:"3-5-2"});
  assert.equal(s.coachNational.formation,"3-5-2");
  A.execute(s,"cnResign",{});
  assert.equal(s.coachNational.teamId,null);
  const p=E.create({mode:"player",catalogVersion:"fc27_v1",name:"T",age:21,pos:"ATA",points:{}},1);
  assert.throws(()=>A.execute(p,"cnApply",{code}),/treinadores/);
});

test("treinador: o mesmo estado dá o mesmo resultado (determinismo)", {timeout:0},()=>{
  const run=()=>{const s=coach();const code="URU";CN.apply(s,E,code);for(let i=0;i<8;i++){s.board=100;E.advance(s,30);}return CN.overview(s,E).results.map(m=>`${m.id}:${m.gf}-${m.ga}`).join("|");};
  assert.equal(run(),run());
});

test("treinador: a seleção comandada disputa a Copa do Mundo 2026 com a convocação dele", {timeout:0},()=>{
  const s=coach(60);
  CN.apply(s,E,"URU");
  const n=E.NationalTeam.init(s),cup=n.tournaments.find(t=>t.type==="WORLD_CUP"&&t.year===2026);
  assert.equal(cup.trackedTeamId,"URU","a seleção acompanhada passa a ser a do treinador");
  assert.equal(n.schedule.filter(f=>f.tournamentType==="WORLD_CUP"&&!f.played).length,3);
  for(let i=0;i<9;i++){s.board=100;E.advance(s,30);}
  assert.equal(s.coachNationalError,undefined);
  const ov=CN.overview(s,E),games=ov.results.filter(m=>/Copa do Mundo 2026/.test(m.competition));
  assert.ok(games.length>=3,"pelo menos os 3 jogos da fase de grupos");
  assert.equal(new Set(games.map(m=>m.id)).size,games.length);
  assert.ok(ov.cup&&ov.cup.qualified&&ov.cup.table.length===4&&ov.cup.matches.length===3);
  assert.equal(cup.status,"COMPLETED");
});

test("treinador: seleção fora da Copa não gera jogos de Copa; sair devolve a seleção acompanhada ao padrão", {timeout:0},()=>{
  const s=coach(60);
  CN.apply(s,E,"PER");
  const cup=E.NationalTeam.init(s).tournaments.find(t=>t.type==="WORLD_CUP");
  assert.equal(cup.trackedTeamId,"","Peru não está na Copa 2026");
  CN.leave(s,E,"pedido");
  assert.equal(cup.trackedTeamId,"BRA","volta ao padrão (nacionalidade do treinador)");
  s.day+=61;
  CN.apply(s,E,"URU");
  assert.equal(cup.trackedTeamId,"URU");
});
