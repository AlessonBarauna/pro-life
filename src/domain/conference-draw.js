(function(root){
"use strict";
// Conference 33A: validated 36 real entries, six pots (adapted coefficient ordering).
function pots(edition){
 if(!edition||edition.comp!=="uecl"||!Array.isArray(edition.entrants)||edition.entrants.length!==36)throw Error("Conference exige 36 participantes reais.");
 const ids=new Set();
 const clubs=edition.entrants.map((row,index)=>{
  const [id,country]=row;
  if(typeof id!=="string"||!id||typeof country!=="string"||!country||ids.has(id))throw Error("Inscricoes invalidas ou duplicadas.");
  ids.add(id);return {id,country,rank:index};
 });
 // The catalog has no official UEFA coefficients: do not claim this is official seeding.
 return Array.from({length:6},(_,i)=>({number:i+1,clubs:clubs.slice(i*6,i*6+6).map(({id,country})=>({id,country}))}));
}
const api={pots};root.ProLifeConferenceDraw=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
