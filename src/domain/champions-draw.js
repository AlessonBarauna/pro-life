(function(root){
"use strict";
// 34F.32B.1 - Preparacao deterministica dos potes.
// Nao altera as inscricoes ou o save.
const VERSION=1;

function hash(value){
  let h=2166136261;
  for(const ch of String(value)){
    h=Math.imul(h^ch.charCodeAt(0),16777619);
  }
  return h>>>0;
}

function pots(edition){
  if(!edition||edition.comp!=="ucl"){
    throw Error("Edicao da Champions invalida.");
  }
  if(!Array.isArray(edition.entrants)||edition.entrants.length!==36){
    throw Error("A Champions exige 36 clubes reais.");
  }

  const seen=new Set();
  const clubs=edition.entrants.map(entry=>{
    const [id,country]=entry;
    if(!id||!country||seen.has(id)){
      throw Error("Clube duplicado ou identificacao invalida.");
    }
    seen.add(id);
    return {id,country};
  });

  // A ordem das inscricoes atuais e usada como classificacao
  // preliminar. Nao confundir com coeficientes oficiais da UEFA.
  // Desempate estavel pela chave da edicao.
  const ordered=clubs.map((club,index)=>({
    ...club,
    rank:index,
    tie:hash(edition.drawSeed+"|"+club.id)
  })).sort((a,b)=>
    a.rank-b.rank || a.tie-b.tie || a.id.localeCompare(b.id)
  );

  return Array.from({length:4},(_,index)=>({
    number:index+1,
    clubs:ordered.slice(index*9,index*9+9)
      .map(({id,country})=>({id,country}))
  }));
}

const api={VERSION,pots};
root.ProLifeChampionsDraw=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);