(function(root){
"use strict";
// Conference 33A: isolated, deterministic 6-round draw; does not mutate editions/saves.
const Draw=typeof require==="function"?require("./conference-draw.js"):root.ProLifeConferenceDraw;
function hash(s){let h=2166136261;for(const ch of String(s))h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0;}
function random(seed){let x=hash(seed)||1;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};}
function shuffled(a,r){const out=a.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
// Round-robin matching between six pots over five matchdays (one other pot each round).
function potPairs(){const arr=[0,1,2,3,4,5],rounds=[];for(let i=0;i<5;i++){
 rounds.push([[arr[0],arr[5]],[arr[1],arr[4]],[arr[2],arr[3]]]);
 arr.splice(1,0,arr.pop());
}return rounds;}
function generate(ed){
 const pots=Draw.pots(ed),all=pots.flatMap(p=>p.clubs),countries=new Map(all.map(c=>[c.id,c.country]));
 const potDays=potPairs();
 for(let attempt=0;attempt<250;attempt++){
  const rng=random((ed.drawSeed||ed.key||"uecl")+"|conf|"+attempt);
  const countryCounts=new Map(all.map(c=>[c.id,new Map()]));
  const rounds=[];let valid=true;
  const can=(a,b)=>a!==b&&countries.get(a)!==countries.get(b)&&
    (countryCounts.get(a).get(countries.get(b))||0)<2&&
    (countryCounts.get(b).get(countries.get(a))||0)<2;
  function assign(a,b){
    const ca=countries.get(a),cb=countries.get(b);
    countryCounts.get(a).set(cb,(countryCounts.get(a).get(cb)||0)+1);
    countryCounts.get(b).set(ca,(countryCounts.get(b).get(ca)||0)+1);
  }
  // For each pot, match its six clubs within itself exactly once (round 6).
  const intra=[];
  for(const p of pots){
    let result=null;
    for(let t=0;t<300&&!result;t++){
      const ids=shuffled(p.clubs.map(c=>c.id),rng);
      if([0,2,4].every(i=>can(ids[i],ids[i+1])))result=[[ids[0],ids[1]],[ids[2],ids[3]],[ids[4],ids[5]]];
    }
    if(!result){valid=false;break;}
    for(const [a,b] of result){assign(a,b);intra.push([a,b]);}
  }
  if(!valid)continue;
  const order=shuffled([0,1,2,3,4],rng);
  for(const day of order){
    const fixtures=[];
    for(const [left,right] of potDays[day]){
      const aa=shuffled(pots[left].clubs.map(c=>c.id),rng),bb=pots[right].clubs.map(c=>c.id);
      // Backtracking for valid one-to-one pairings.
      const used=new Set(),pairs=[];
      function dfs(i){
        if(i===aa.length)return true;
        for(const b of shuffled(bb,rng)){
          if(used.has(b)||!can(aa[i],b))continue;
          used.add(b);pairs.push([aa[i],b]);
          // Reservation is not needed: within this matching countries are independent per club.
          if(dfs(i+1))return true;
          pairs.pop();used.delete(b);
        }return false;
      }
      if(!dfs(0)){valid=false;break;}
      for(const [a,b] of pairs){assign(a,b);fixtures.push([a,b]);}
    }
    if(!valid)break;
    rounds.push(fixtures);
  }
  if(!valid)continue;
  rounds.push(intra);
  if(rounds.length!==6||rounds.some(x=>x.length!==18))continue;
  // Orient a degree-6 undirected graph via Euler tours => exactly 3H/3A each club.
  const edges=rounds.flatMap((r,i)=>r.map(([a,b])=>({a,b,round:i+1})));
  const adj=new Map(all.map(c=>[c.id,[]]));edges.forEach((e,i)=>{adj.get(e.a).push(i);adj.get(e.b).push(i);});
  const consumed=new Set(),homeAway=new Map();
  for(const club of adj.keys()){
    while(adj.get(club).some(i=>!consumed.has(i))){
      const stack=[{v:club,edge:null}],circuit=[];
      while(stack.length){const v=stack[stack.length-1].v;
        const id=adj.get(v).find(i=>!consumed.has(i));
        if(id===undefined){circuit.push(stack.pop());continue;}
        consumed.add(id);stack.push({v:edges[id].a===v?edges[id].b:edges[id].a,edge:id});
      }
      for(let i=circuit.length-1;i>0;i--){const from=circuit[i].v,to=circuit[i-1].v;homeAway.set(circuit[i-1].edge,[from,to]);}
    }
  }
  if(homeAway.size!==108)continue;
  const matches=edges.map((e,i)=>({id:`uecl:${ed.season}:league:${i}`,homeId:homeAway.get(i)[0],awayId:homeAway.get(i)[1],round:e.round,phase:"league",played:false}));
  const totals=new Map(all.map(c=>[c.id,{h:0,a:0,pots:new Set(),opp:new Set()}]));
  const potOf=new Map(pots.flatMap(p=>p.clubs.map(c=>[c.id,p.number])));
  for(const m of matches){const a=totals.get(m.homeId),b=totals.get(m.awayId);a.h++;b.a++;a.pots.add(potOf.get(m.awayId));b.pots.add(potOf.get(m.homeId));a.opp.add(m.awayId);b.opp.add(m.homeId);}
  if([...totals.values()].some(x=>x.h!==3||x.a!==3||x.pots.size!==6||x.opp.size!==6))continue;
  return {comp:"uecl",season:ed.season,seed:ed.drawSeed,attempt,matches,source:"adapted-catalog-seeding"};
 }
 throw Error("Nao foi possivel sortear Conference com as restricoes do elenco; nenhum save alterado.");
}
const api={generate,potPairs};root.ProLifeConferenceFixtures=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
