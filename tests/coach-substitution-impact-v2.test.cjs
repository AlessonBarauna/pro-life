const test=require("node:test"),assert=require("node:assert/strict");
const Engine=require("../src/domain/coach-incremental-match-v2.js");
const Lab=require("../src/ui/coach-match-lab-v2.js");
const squad=Array.from({length:13},(_,i)=>({id:"p"+i,position:i===0?"GOL":i>8?"ATA":"MC",ovr:i===11?95:70}));
test("named swap changes future team strength by exact rating difference over eleven",()=>{
 const p=Lab.createPreview({roster:squad},{},13);
 const before=p.match.home.strength;
 const out=p.lineups[0].starters.find(id=>id!=="p11");
 const old=squad.find(x=>x.id===out);
 const result=Lab.swapPlayer(p,0,out,"p11",squad);
 assert.equal(result.ok,true);
 assert.ok(Math.abs(p.match.home.strength-(before+(95-old.ovr)/11))<.01);
 assert.equal(p.actions[0].minute,0);
});
test("two identical matches only diverge in strength after substitution",()=>{
 const a=Engine.create({seed:42}),b=Engine.create({seed:42});
 Engine.advance(a,30);Engine.advance(b,30);
 const previous=JSON.stringify(a.events);
 assert.equal(Engine.substitute(a,0,{incomingStrength:90,outgoingStrength:50}),true);
 assert.ok(a.home.strength>b.home.strength);
 Engine.advance(a,90);Engine.advance(b,90);
 assert.equal(JSON.stringify(a.events.filter(x=>x.minute<=30)),previous);
 assert.equal(b.home.subs,0);
});
test("invalid substitute cannot spend a substitution or alter roster",()=>{
 const p=Lab.createPreview({roster:squad},{},4);
 const saved=JSON.stringify(p);
 assert.equal(Lab.swapPlayer(p,0,"unknown","p11",squad).ok,false);
 assert.equal(JSON.stringify(p),saved);
});
