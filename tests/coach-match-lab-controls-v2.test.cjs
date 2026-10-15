const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"../src/ui/live-match.js"),"utf8");
function harness(){
 let active={innerHTML:"",remove(){}},handlers={};
 const document={body:{appendChild(){}},createElement:()=>active,getElementById:()=>active,addEventListener:(n,cb)=>{handlers[n]=cb;}};
 const context={document,setInterval:()=>1,clearInterval:()=>{},ProLifeCoachMatchLabV2:require("../src/ui/coach-match-lab-v2.js"),ProLifeCoachMatchCenterV2:require("../src/ui/coach-match-center-v2.js")};
 context.globalThis=context;vm.runInNewContext(source,context);
 function click(dataset={},attributes=[]){handlers.click({target:{closest:()=>({dataset,hasAttribute:n=>attributes.includes(n)})}});}
 return {view:()=>active.innerHTML,click,context};
}
const fixture={match:{events:[],shots:[2,4],xg:[.4,.8]},home:{name:"Casa",roster:[{ovr:80}]},away:{name:"Fora",roster:[{ovr:68}]}};
test("coach-only tactical lab is explicitly labelled independent",()=>{
 const h=harness();h.context.ProLifeLiveMatch.start({...fixture,mode:"coach"});h.click({liveTab:"taticas"});
 assert.match(h.view(),/LABORATORIO TATICO/);assert.match(h.view(),/Nenhuma decisao altera esta partida oficial/);
});
test("experimental tactics and substitutions change only lab, not official match",()=>{
 const h=harness();let original=JSON.stringify(fixture.match);
 h.context.ProLifeLiveMatch.start({...fixture,mode:"coach"});h.click({liveTab:"taticas"});h.click({},["data-live-lab-start"]);
 assert.match(h.view(),/Placar hipotetico/);
 h.click({liveLabTactic:"ofensivo"});h.click({},["data-live-lab-sub"]);h.click({},["data-live-lab-next"]);
 assert.match(h.view(),/Minuto 10/);assert.match(h.view(),/Substituicoes 1\/5/);assert.equal(JSON.stringify(fixture.match),original);
});
test("player mode does not show experimental tactical controls",()=>{
 const h=harness();h.context.ProLifeLiveMatch.start({...fixture,mode:"player"});assert.doesNotMatch(h.view(),/LABORATORIO TATICO/);
});
