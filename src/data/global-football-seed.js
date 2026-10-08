(function(root){
  "use strict";
  // 26B: os dados reais das ligas europeias vivem nos pacotes src/data/global-football-eur-*.js
  // (registrados em root.ProLifeGlobalFootballPacks e importados uma vez por estado por global-football.js).
  // O seed permanece como ponto de extensao para dados que nao pertencem a um pacote.
  const seed={version:2,baseYear:2026,leagues:[],clubs:[],players:[]};
  root.ProLifeGlobalFootballSeed=seed;
  if(typeof module!=="undefined"&&module.exports)module.exports=seed;
})(typeof globalThis!=="undefined"?globalThis:this);
