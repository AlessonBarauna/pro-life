(function(root){
"use strict";

function standings(edition) {
  const entrants = edition?.entrants;
  const matches = edition?.leagueSchedule?.matches;

  if (!Array.isArray(entrants) || !Array.isArray(matches))
    throw Error("Edicao continental sem inscricoes ou calendario.");

  const rows = new Map();

  for (const entry of entrants) {
    const id = entry[0];
    if (!id || rows.has(id))
      throw Error("Inscricoes invalidas ou duplicadas.");

    rows.set(id, {
      id, country:entry[1], played:0,
      wins:0, draws:0, losses:0,
      gf:0, ga:0, gd:0, points:0
    });
  }

  for (const m of matches) {
    if (!m.played) continue;

    if (!Number.isInteger(m.hg) || !Number.isInteger(m.ag) ||
        m.hg < 0 || m.ag < 0)
      throw Error("Resultado continental invalido.");

    const home=rows.get(m.homeId), away=rows.get(m.awayId);
    if (!home || !away || home===away)
      throw Error("Partida com clube invalido.");

    home.played++;
    away.played++;
    home.gf+=m.hg;
    home.ga+=m.ag;
    away.gf+=m.ag;
    away.ga+=m.hg;

    if(m.hg>m.ag) {
      home.wins++; home.points+=3; away.losses++;
    } else if(m.hg<m.ag) {
      away.wins++; away.points+=3; home.losses++;
    } else {
      home.draws++; away.draws++;
      home.points++; away.points++;
    }
  }

  for(const row of rows.values())row.gd=row.gf-row.ga;

  return [...rows.values()].sort((a,b)=>
    b.points-a.points ||
    b.gd-a.gd ||
    b.gf-a.gf ||
    b.wins-a.wins ||
    a.id.localeCompare(b.id)
  ).map((row,index)=>({...row,position:index+1}));
}

const api={standings};
root.ProLifeChampionsStandings=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);