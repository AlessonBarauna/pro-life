"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");global.ProLife=D;
const S=require("../src/infrastructure/save.js");
const make=()=>D.create({mode:"player",clubId:"gf_fc27_449",catalogVersion:"fc27_v1",origin:"blank",creation:{difficulty:"realistic",personality:"balanced",startMode:"club"}},7);
test("carreira europeia abre direto na data, sem simular a pré-temporada",()=>{
  const s=make(),plan=D.preseasonPlan(s),before=s.globalFootball?.worldStats?.matches||0;
  const r=D.preseasonStep(s,plan.targetDay,30);
  assert.equal(r.done,true);assert.equal(s.day,plan.targetDay);assert.equal(s.careerStartDay,plan.targetDay);
  assert.equal(s.globalFootball?.worldStats?.matches||0,before,"nenhum jogo simulado");
  assert.equal((s.matches||[]).length,0);
  assert.equal(s.nationalTeam.caps||0,0);assert.equal((s.nationalTeam.matches||[]).length,0);
  assert.ok(s.nationalTeam.nextWindow>=s.day,"a próxima janela internacional acompanha a nova data inicial");
  assert.doesNotThrow(()=>S.validate(s),"a carreira saltada continua sendo um save válido");
});
test("treinador em clube europeu pode salvar depois do salto direto para a pré-temporada",()=>{
  const s=D.create({mode:"coach",name:"Treinador",city:"Mogi",age:35,clubId:"gf_fc27_449",catalogVersion:"fc27_v1"},17);
  const plan=D.preseasonPlan(s);assert.ok(plan);
  D.preseasonStep(s,plan.targetDay);
  assert.ok(s.nationalTeam.nextWindow>=s.day);
  assert.doesNotThrow(()=>S.validate(s));
});
test("sem estreia como profissional não há convocação",()=>{
  const s=make(),plan=D.preseasonPlan(s);D.preseasonStep(s,plan.targetDay);
  const NC=require("../src/domain/national-callups.js"),NI=require("../src/domain/national-identity.js");
  const team=NI.heroTeam(s,D);
  if(team&&team.represented){const ev=NC.preview(s,D);assert.equal(ev.evaluation.called,false);assert.ok(ev.evaluation.reasons.some(x=>/sem jogos oficiais/.test(x)));}
});
test("histórico recente ignora jogos anteriores ao início da carreira",()=>{
  const H=require("../src/ui/home-dashboard.js");
  const s={mode:"player",careerStartDay:211,matches:[],nationalTeam:{matches:[{day:150,opponent:"X",competition:"Copa",brazil:1,other:0}],schedule:[]}};
  assert.equal(H.recentEntries(s).length,0);
});
test("sem jogos do protagonista, 'últimas atuações' fica vazio mesmo com jogos da seleção no calendário",()=>{
  const H=require("../src/ui/home-dashboard.js");
  const s={mode:"player",careerStartDay:0,matches:[],statistics:{players:{hero:{appearances:0}}},nationalTeam:{caps:0,matches:[],schedule:[{day:200,played:true,participated:false,brazil:2,other:1,opponent:"França",competition:"Copa"}]}};
  assert.equal(H.recentEntries(s).length,0);
});
