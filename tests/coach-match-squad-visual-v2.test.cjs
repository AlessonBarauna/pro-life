const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const L=require("../src/ui/coach-match-lab-v2.js");
const roster=Array.from({length:14},(_,i)=>({id:"p"+i,name:"Atleta "+i,ovr:70+i}));
test("named laboratory replacement swaps real squad ids only in experimental preview",()=>{
 const home={roster},original=JSON.stringify(home),p=L.createPreview(home,{roster:[]},31);
 assert.equal(L.swapPlayer(p,0,"p1","p12",roster).ok,true);
 assert.equal(p.lineups[0].starters.includes("p12"),true);
 assert.equal(p.lineups[0].bench.includes("p12"),false);
 assert.equal(p.actions[0].outId,"p1");
 assert.equal(JSON.stringify(home),original);
});
test("named substitutions reject duplicates, invalid players and exhausted slots",()=>{
 const p=L.createPreview({roster},{},1);
 assert.equal(L.swapPlayer(p,0,"p2","p2",roster).ok,false);
 assert.equal(L.swapPlayer(p,0,"missing","p13",roster).ok,false);
 for(let i=0;i<3;i++)assert.equal(L.swapPlayer(p,0,"p"+i,"p"+(11+i),roster).ok,true);
 assert.equal(L.swapPlayer(p,0,"p4","p11",roster).ok,false);
});
test("new animated match pitch and named substitution controls are shipped",()=>{
 const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
 const html=read("index.html"),assets=read("tools/assets.cjs"),live=read("src/ui/live-match.js");
 assert.match(html,/match-pitch-v2\.js/);assert.match(assets,/match-pitch-v2\.js/);
 assert.match(live,/data-live-lab-swap/);assert.match(live,/coachPitch\(min,home,away\)/);
});
