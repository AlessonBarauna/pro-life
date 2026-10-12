(function(root){
"use strict";
// 34F.32B.4A - Calendario continental independente.
// Nao altera edicoes, saves ou calendario domestico.
const R=typeof require==="function"
  ?require("./champions-rounds.js")
  :root.ProLifeChampionsRounds;

function create(s,C,W){
  const ed=C.edition(s,"ucl");
  if(!ed||ed.entrants.length!==36)
    throw Error("Champions sem 36 inscritos.");

  const windows=C.windows(ed.season,"ucl");
  const base=R.schedule(ed,windows);
  const associations=C.associations(s).uefa;
  const leagues=new Map();

  for(const a of associations){
    const clubs=a.mode==="pool"
      ?a.ids
      :a.mode==="local"
        ?(s.clubs||[]).filter(c=>c.leagueId===a.leagueId).map(c=>c.id)
        :(s.globalFootball?.clubs||[]).filter(c=>c.leagueId===a.leagueId).map(c=>c.id);

    for(const id of clubs)leagues.set(id,a.leagueId);
  }

  const busy=new Map();
  for(const [clubId,leagueId] of leagues){
    const coverage=W.coverage(s).find(c=>c.leagueId===leagueId);
    const days=new Set();
    if(coverage?.rounds){
      for(let i=0;i<coverage.rounds;i++)
        days.add(W.roundDate(ed.season,i,coverage.rounds));
    }
    busy.set(clubId,days);
  }

  const matches=[];
  const conflicts=[];

  for(const m of base.matches){
    const win=windows[m.round-1];
    const home=busy.get(m.homeId)||new Set();
    const away=busy.get(m.awayId)||new Set();

    // Preferir pelo menos um dia de descanso.
    const candidates=[win,win+1,win+2];
    let chosen=candidates.find(d=>
      !home.has(d)&&!away.has(d)&&
      !home.has(d-1)&&!away.has(d-1)&&
      !home.has(d+1)&&!away.has(d+1)
    );

    if(chosen===undefined){
      chosen=candidates.find(d=>!home.has(d)&&!away.has(d));
    }

    if(chosen===undefined){
      conflicts.push({
        matchId:m.id,
        round:m.round,
        homeId:m.homeId,
        awayId:m.awayId,
        window:win,
        reason:"Sem data comum livre na janela."
      });
      continue;
    }

    matches.push({...m,day:chosen});
  }

  return {
    comp:"ucl",
    season:ed.season,
    total:base.matches.length,
    matches,
    conflicts,
    complete:matches.length===144&&conflicts.length===0
  };
}

const api={create};
root.ProLifeChampionsCalendar=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);