"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
function setup(){
 const root={};root.globalThis=root;
 vm.runInNewContext(source,root,{filename:"coach-career-view.js"});
 return root.ProLifeCoachCareerView;
}
const snapshot={enabled:true,hasClub:true,club:{id:"a",name:"Clube Alfa"},board:72,risk:{id:"seguro",label:"Seguro"},goals:{items:[{label:"Terminar na parte de cima",status:"em_andamento"}]},reputation:35};
test("09 central shows existing pending actions, news, fixture and real goals",()=>{
 const V=setup(),s={mode:"coach",season:2026,day:10,clubId:"a",news:[{day:9,title:"Treino coletivo concluído"}]};
 const D={CoachCareer:{snapshot:()=>snapshot},nextCommitment:()=>({home:"a",away:"b",date:12,competitionName:"Liga"}),club:(_s,id)=>({id,name:id==="b"?"Clube Beta":"Clube Alfa"}),pendingActions:()=>[{title:"Responder à diretoria",page:"inbox"}]};
 const html=V.render(s,D);
 for(const value of ["Central","Clube Beta","Dia 12","Responder à diretoria","Treino coletivo concluído","Terminar na parte de cima"])assert.ok(html.includes(value),value);
 assert.equal(V.state.tab,"central");
});
test("09 central works without club, calendar or messages",()=>{
 const V=setup(),s={mode:"coach",season:2026,day:1,news:[]};
 const D={CoachCareer:{snapshot:()=>({...snapshot,hasClub:false,club:null,goals:null})}};
 const html=V.render(s,D);
 assert.match(html,/Nenhum compromisso futuro registrado/);
 assert.match(html,/Nenhuma decisão pendente/);
});
