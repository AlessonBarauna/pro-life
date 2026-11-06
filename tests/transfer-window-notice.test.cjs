"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const E=require("../src/domain/engine.js");
test("avisa quando a janela de transferências fecha e quando abre de novo",()=>{
  const s=E.create({mode:"coach",catalogVersion:"fc27_v1"},4242);s.clubId=null;E.join(s,"gf_fc27_5",90000);
  const events=[];let last=E.Career.windowStatus(s).open;
  for(let i=0;i<260;i++){
    E.advance(s,1);
    const open=E.Career.windowStatus(s).open;
    if(open!==last){events.push(open?"aberta":"fechada");last=open;}
  }
  assert.ok(events.length>=2,"a janela muda de estado ao longo do ano: "+events.join());
  const titles=s.news.map(n=>n.title);
  assert.ok(titles.includes("Janela de transferências fechada"));
  assert.ok(titles.includes("Janela de transferências aberta"));
  assert.equal(s.news.filter(n=>n.title==="Janela de transferências aberta").length,events.filter(x=>x==="aberta").length);
});
