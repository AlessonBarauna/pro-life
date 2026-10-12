(function(root){
"use strict";
// 34F.32B.2 - Sorteio isolado da fase de liga UEFA.
// Sem mutacao do save ou integracao com o calendario.
const Draw=typeof require==="function"
  ?require("./champions-draw.js")
  :root.ProLifeChampionsDraw;

function hash(s){
  let h=2166136261;
  for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);
  return h>>>0;
}
function rng(seed){
  let x=hash(seed)||1;
  return ()=>{
    x^=x<<13;x^=x>>>17;x^=x<<5;
    return (x>>>0)/4294967296;
  };
}
function shuffle(a,r){
  a=a.slice();
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(r()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
function generate(edition){
  const pots=Draw.pots(edition);
  const clubs=pots.flatMap(p=>p.clubs);
  const lookup=new Map(clubs.map(c=>[c.id,c]));
  const byPot=pots.map(p=>p.clubs.map(c=>c.id));

  for(let attempt=0;attempt<250;attempt++){
    const rand=rng(edition.drawSeed+"|fixtures|"+attempt);
    const edges=[];
    const opponents=new Map(clubs.map(c=>[c.id,new Set()]));
    const counts=new Map(clubs.map(c=>[c.id,new Map()]));

    function can(a,b){
      if(a===b||opponents.get(a).has(b))return false;
      const ca=lookup.get(a).country,cb=lookup.get(b).country;
      if(ca===cb)return false;
      return (counts.get(a).get(cb)||0)<2 &&
             (counts.get(b).get(ca)||0)<2;
    }
    function add(a,b,home){
      opponents.get(a).add(b);
      opponents.get(b).add(a);
      const ca=lookup.get(a).country,cb=lookup.get(b).country;
      counts.get(a).set(cb,(counts.get(a).get(cb)||0)+1);
      counts.get(b).set(ca,(counts.get(b).get(ca)||0)+1);
      edges.push({home:home?a:b,away:home?b:a});
    }

    // Cada pote interno forma um ciclo: um jogo em casa
    // e outro fora contra dois clubes diferentes.
    function cycle(ids){
      for(let tries=0;tries<600;tries++){
        const a=shuffle(ids,rand);
        let valid=true;
        for(let j=0;j<a.length;j++){
          if(!can(a[j],a[(j+1)%a.length])){
            valid=false;break;
          }
        }
        if(!valid)continue;
        for(let j=0;j<a.length;j++){
          add(a[j],a[(j+1)%a.length],true);
        }
        return true;
      }
      return false;
    }

    // Para dois potes distintos, duas correspondencias
    // perfeitas: uma com mando A, outra com mando B.
    function matching(left,right,homeLeft){
      const order=shuffle(left,rand);
      const choices=new Map(order.map(a=>[
        a,shuffle(right,rand)
      ]));
      const assigned=new Set();
      const pairs=[];

      function dfs(index){
        if(index===order.length)return true;
        const a=order[index];
        for(const b of choices.get(a)){
          if(assigned.has(b)||!can(a,b))continue;

          // Reserva temporaria da aresta durante a busca.
          assigned.add(b);
          opponents.get(a).add(b);
          opponents.get(b).add(a);
          const ca=lookup.get(a).country,cb=lookup.get(b).country;
          counts.get(a).set(cb,(counts.get(a).get(cb)||0)+1);
          counts.get(b).set(ca,(counts.get(b).get(ca)||0)+1);
          pairs.push([a,b]);

          if(dfs(index+1))return true;

          pairs.pop();
          assigned.delete(b);
          opponents.get(a).delete(b);
          opponents.get(b).delete(a);
          counts.get(a).set(cb,counts.get(a).get(cb)-1);
          counts.get(b).set(ca,counts.get(b).get(ca)-1);
        }
        return false;
      }

      if(!dfs(0))return false;

      // As reservas ja foram feitas pelo DFS.
      for(const [a,b] of pairs){
        edges.push({
          home:homeLeft?a:b,
          away:homeLeft?b:a
        });
      }
      return true;
    }

    let success=true;
    for(let p=0;p<4;p++){
      if(!cycle(byPot[p])){success=false;break;}
    }
    if(!success)continue;

    for(let p=0;p<4&&success;p++){
      for(let q=p+1;q<4;q++){
        if(!matching(byPot[p],byPot[q],true)||
           !matching(byPot[p],byPot[q],false)){
          success=false;break;
        }
      }
    }
    if(!success)continue;
    if(edges.length!==144)continue;

    const games=clubs.map(c=>({
      clubId:c.id,
      home:edges.filter(e=>e.home===c.id).length,
      away:edges.filter(e=>e.away===c.id).length,
      opponents:[...opponents.get(c.id)]
    }));
    if(!games.every(g=>g.home===4&&g.away===4&&
                        g.opponents.length===8))continue;

    return {
      comp:"ucl",season:edition.season,
      seed:edition.drawSeed,attempt,
      matches:edges.map((e,i)=>({
        id:"ucl:"+edition.season+":league:"+i,
        homeId:e.home,awayId:e.away,
        phase:"league",played:false
      }))
    };
  }
  throw Error("Sorteio impossivel com as restricoes atuais; nenhuma inscricao alterada.");
}
const api={generate};
root.ProLifeChampionsFixtures=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);