"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const E=require("../src/domain/engine.js");
const A=require("../src/application/game.js");
const CN=E.CoachNational;
const take=(s,code)=>{CN.overview(s,E);s.coachNational.offers.push({code,name:code,received:s.day,expires:s.day+45});return CN.acceptOffer(s,E,code);};

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
  take(s,ok.code);
  assert.equal(s.coachNational.teamId,ok.code);
  assert.equal(s.coach.nationalTeamId,ok.code,"NationalIdentity.coachTeam passa a enxergar o vínculo");
  assert.throws(()=>CN.apply(s,E,ok.code),/já comanda/);
});

test("treinador: convocação automática e manual respeitam limites", {timeout:0},()=>{
  const s=coach();
  const code=CN.overview(s,E).nations.find(n=>n.eligible).code;
  take(s,code);
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
  take(s,code);
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
  take(s,code);
  CN.leave(s,E,"pedido");
  assert.equal(s.coachNational.teamId,null);
  assert.equal(s.coach.nationalTeamId,null);
  assert.throws(()=>CN.apply(s,E,code),/a partir do dia/);
  s.day+=61;
  take(s,code);
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
  assert.equal(s.coachNational.teamId,null,"candidatura não assume o cargo na hora");
  assert.equal(s.coachNational.applications.length,1);
  assert.throws(()=>A.execute(s,"cnApply",{code}),/em análise/);
  assert.throws(()=>A.execute(s,"cnResign",{}),/não comanda/);
  take(s,code);
  A.execute(s,"cnFormation",{formation:"3-5-2"});
  assert.equal(s.coachNational.formation,"3-5-2");
  A.execute(s,"cnResign",{});
  assert.equal(s.coachNational.teamId,null);
  const p=E.create({mode:"player",catalogVersion:"fc27_v1",name:"T",age:21,pos:"ATA",points:{}},1);
  assert.throws(()=>A.execute(p,"cnApply",{code}),/treinadores/);
});

test("treinador: o mesmo estado dá o mesmo resultado (determinismo)", {timeout:0},()=>{
  const run=()=>{const s=coach();const code="URU";take(s,code);for(let i=0;i<8;i++){s.board=100;E.advance(s,30);}return CN.overview(s,E).results.map(m=>`${m.id}:${m.gf}-${m.ga}`).join("|");};
  assert.equal(run(),run());
});

test("treinador: a seleção comandada disputa a Copa do Mundo 2026 com a convocação dele", {timeout:0},()=>{
  const s=coach(60);
  take(s,"URU");
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
  take(s,"PER");
  const cup=E.NationalTeam.init(s).tournaments.find(t=>t.type==="WORLD_CUP");
  assert.equal(cup.trackedTeamId,"","Peru não está na Copa 2026");
  CN.leave(s,E,"pedido");
  assert.equal(cup.trackedTeamId,"BRA","volta ao padrão (nacionalidade do treinador)");
  s.day+=61;
  take(s,"URU");
  assert.equal(cup.trackedTeamId,"URU");
});

test("treinador: seleção sul-americana joga as eliminatórias e a tabela reflete os jogos", {timeout:0},()=>{
  const s=coach(60);
  take(s,"URU");
  while(s.day<700){s.board=100;E.advance(s,Math.min(30,700-s.day));}
  assert.equal(s.coachNationalError,undefined);
  const ov=CN.overview(s,E);
  assert.equal(ov.qual.kind,"conmebol");
  const games=ov.results.filter(m=>/Eliminatórias/.test(m.competition));
  assert.ok(games.length>=2,"rodadas 1 e 2 já disputadas");
  const row=ov.qual.table.find(r=>r.id==="URU");
  assert.equal(row.j,games.length,"a tabela conta exatamente os jogos que o treinador disputou");
  assert.equal(ov.qual.fixtures.filter(f=>f.played).length,games.length);
  assert.equal(ov.qual.table.length,10);
});

test("treinador: seleção europeia joga um grupo de eliminatórias e o resultado decide a vaga na Copa 2030", {timeout:0},()=>{
  const s=coach(95);
  take(s,"ESP");
  while(s.day<1700){s.board=100;E.advance(s,Math.min(60,1700-s.day));}
  assert.equal(s.coachNationalError,undefined);
  const ov=CN.overview(s,E);
  assert.equal(ov.qual.kind,"conmebol");
  assert.equal(ov.qual.groupMode,true);
  assert.equal(ov.qual.table.length,5);
  const games=s.coachNational.matches.filter(m=>/Eliminatórias/.test(m.competition));
  assert.equal(ov.qual.table.find(r=>r.id==="ESP").j,games.length);
  assert.equal(typeof ov.qual.qualified,"boolean");
  const cup=(s.nationalTeam.tournaments||[]).find(t=>t.type==="WORLD_CUP"&&t.year===2030);
  const inCup=cup.groups.some(g=>g.teams.some(x=>x.id==="ESP"));
  assert.equal(inCup,ov.qual.qualified,"a Copa reflete exatamente o resultado do treinador");
});

test("candidatura: a confederação responde depois, com oferta ou recusa", {timeout:0},()=>{
  const s=coach();
  const code=CN.overview(s,E).nations.find(n=>n.eligible).code;
  A.execute(s,"cnApply",{code});
  const a=s.coachNational.applications[0];
  assert.ok(a.decideDay>=s.day+7&&a.decideDay<=s.day+14);
  s.day=a.decideDay;CN.daily(s,E);
  const cn=s.coachNational;
  assert.equal(cn.applications.length,0);
  assert.equal(cn.teamId,null,"mesmo aprovada, vira oferta a aceitar");
  assert.ok(cn.offers.some(o=>o.code===code)||cn.rejected[code]>s.day);
});

test("ficha da seleção traz títulos, história, escalação e competições do ano", {timeout:0},()=>{
  const s=coach();
  const f=CN.nationProfile(s,E,"BRA");
  assert.equal(f.code,"BRA");
  assert.ok(f.titles.some(t=>t.name==="Copa do Mundo"&&t.count>=5));
  assert.equal(f.starters.length,11);
  assert.ok(f.years.includes(f.year));
  assert.ok(Array.isArray(f.comps)&&Array.isArray(f.history));
  assert.equal(CN.nationProfile(s,E,"XXX"),null);
});
