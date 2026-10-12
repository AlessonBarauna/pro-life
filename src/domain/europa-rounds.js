(function(root){
"use strict";
// 34F.32B.3 - Rodadas deterministicas da Europa.
// Nao modifica edicoes, partidas originais ou saves.

const Fixtures=typeof require==="function"
  ?require("./europa-fixtures.js")
  :root.ProLifeEuropaFixtures;

function hash(s){
  let h=2166136261;
  for(const c of String(s))
    h=Math.imul(h^c.charCodeAt(0),16777619);
  return h>>>0;
}

function random(seed){
  let x=hash(seed)||1;
  return ()=>{
    x^=x<<13;x^=x>>>17;x^=x<<5;
    return (x>>>0)/4294967296;
  };
}

function shuffle(items,rng){
  const a=items.slice();
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(rng()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function perfectRound(matches,clubs,seed){
  const adj=new Map(clubs.map(id=>[id,[]]));
  for(const m of matches){
    adj.get(m.homeId).push(m);
    adj.get(m.awayId).push(m);
  }

  const rng=random(seed);
  const priorities=new Map(
    matches.map(m=>[m.id,rng()])
  );
  const occupied=new Set();
  const chosen=[];
  let visits=0;

  function search(){
    if(++visits>15000)return false;
    if(occupied.size===clubs.length)return true;

    let options=null;
    let selected=null;

    for(const id of clubs){
      if(occupied.has(id))continue;

      const available=adj.get(id).filter(m=>
        !occupied.has(m.homeId===id?m.awayId:m.homeId)
      );

      if(!available.length)return false;

      if(!options||available.length<options.length){
        options=available;
        selected=id;
      }
    }

    options.sort((a,b)=>
      priorities.get(a.id)-priorities.get(b.id)
    );

    for(const m of options){
      const other=m.homeId===selected
        ?m.awayId:m.homeId;

      occupied.add(selected);
      occupied.add(other);
      chosen.push(m);

      if(search())return true;

      chosen.pop();
      occupied.delete(selected);
      occupied.delete(other);
    }
    return false;
  }

  return search()?chosen.slice():null;
}

function streakScore(rounds,clubs){
  let worst=0,penalty=0;

  for(const id of clubs){
    let last="",run=0;

    for(const round of rounds){
      const match=round.find(m=>
        m.homeId===id||m.awayId===id
      );
      const side=match.homeId===id?"H":"A";

      run=side===last?run+1:1;
      last=side;
      worst=Math.max(worst,run);
      penalty+=run*run;
    }
  }
  return {worst,penalty};
}

function schedule(edition,windows){
  const draw=Fixtures.generate(edition);
  const clubs=edition.entrants.map(x=>x[0]);

  if(!Array.isArray(windows)||windows.length<8)
    throw Error("Faltam janelas continentais.");

  let rounds=null;
  let attemptUsed=-1;

  for(let attempt=0;attempt<80;attempt++){
    let remaining=draw.matches.slice();
    const result=[];

    for(let round=1;round<=8;round++){
      const found=perfectRound(
        remaining,clubs,
        edition.drawSeed+"|round|"+attempt+"|"+round
      );

      if(!found||found.length!==18)break;

      result.push(found);
      const ids=new Set(found.map(m=>m.id));
      remaining=remaining.filter(m=>!ids.has(m.id));
    }

    if(result.length===8&&remaining.length===0){
      rounds=result;
      attemptUsed=attempt;
      break;
    }
  }

  if(!rounds)
    throw Error("Nao foi possivel distribuir as oito rodadas.");

  // Reordena rodadas inteiras: confrontos e mandos permanecem.
  // Escolhe a melhor sequencia para evitar longas series casa/fora.
  let best=rounds;
  let bestScore=streakScore(best,clubs);
  const rng=random(edition.drawSeed+"|balance");

  for(let i=0;i<6000;i++){
    const candidate=shuffle(rounds,rng);
    const score=streakScore(candidate,clubs);

    if(score.worst<bestScore.worst||
       (score.worst===bestScore.worst&&
        score.penalty<bestScore.penalty)){
      best=candidate;
      bestScore=score;
    }
    if(bestScore.worst<=2)break;
  }

  const matches=best.flatMap((round,index)=>
    round.map(m=>({
      ...m,
      round:index+1,
      day:windows[index]
    }))
  );

  return {
    comp:"uel",
    season:edition.season,
    attempt:attemptUsed,
    maximumVenueStreak:bestScore.worst,
    matches
  };
}

const api={schedule};
root.ProLifeEuropaRounds=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);