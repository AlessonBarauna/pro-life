const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../src/ui/live-match.js"),"utf8");

function harness(){
  const overlay={innerHTML:"",remove(){},id:"live-match-overlay"};
  const body={appendChild(){}};
  const handlers={};
  const document={
    body,
    createElement(){return overlay;},
    getElementById(id){return id==="live-match-overlay"?overlay:null;},
    addEventListener(type,handler){handlers[type]=handler;}
  };
  const sandbox={document,setInterval(fn){sandbox.tick=fn;return 1;},clearInterval(){},window:null,globalThis:null};
  sandbox.globalThis=sandbox;
  sandbox.ProLifeCoachMatchCenterV2=require("../src/ui/coach-match-center-v2.js");
  vm.runInNewContext(source,sandbox,{filename:"live-match.js"});
  const click=(dataset,attributes=[])=>handlers.click({target:{closest:()=>({dataset,hasAttribute:name=>attributes.includes(name)})}});
  return {overlay,sandbox,click,api:sandbox.ProLifeLiveMatch};
}
const match={competitionName:"Liga",events:[{type:"goal",minute:5,side:0,text:"Gol!"}],shots:[9,4],xg:[1.8,.7]};
const team={name:"Time"};
test("T match playback hides final score statistics until 94 minutes",()=>{
 const h=harness();h.api.start({match,home:team,away:team,mode:"coach"});
 assert.match(h.overlay.innerHTML,/Estatísticas completas após o apito final/);
 assert.doesNotMatch(h.overlay.innerHTML,/Finalizações 9 - 4/);
 h.click({},["data-live-finish"]);
 assert.match(h.overlay.innerHTML,/Finalizações 9 - 4/);
 h.api.close();
});
test("T match pause blocks clock until resumed",()=>{
 const h=harness();h.api.start({match,home:team,away:team,mode:"coach"});
 h.click({},["data-live-pause"]);
 assert.match(h.overlay.innerHTML,/Retomar/);
 h.sandbox.tick();
 assert.match(h.overlay.innerHTML,/0&#39;|0'/);
 h.click({},["data-live-pause"]);
 h.sandbox.tick();
 assert.match(h.overlay.innerHTML,/1&#39;|1'/);
 h.api.close();
});
test("T player match keeps original controls without coach pause",()=>{
 const h=harness();h.api.start({match,home:team,away:team,mode:"player"});
 assert.doesNotMatch(h.overlay.innerHTML,/data-live-pause/);
 assert.doesNotMatch(h.overlay.innerHTML,/data-live-tab/);
 h.api.close();
});
