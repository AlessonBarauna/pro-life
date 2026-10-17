(function(root){
"use strict";
const norm=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
function homeCountry(cat,club,leagueId){
 const own=cat.find(c=>c.id===leagueId);
 if(own?.country)return own.country;
 if(club?.country)return club.country;
 const countries=cat.filter(c=>c.country).map(c=>c.country);
 return countries[0]||"";
}
function prioritized(cat,country){
 if(!country)return cat.slice();
 return cat.slice().sort((a,b)=>Number(b.country===country)-Number(a.country===country));
}
function zones(comp,count){
 const country=norm(comp?.country),name=norm(comp?.name);
 const topBrazil=country==="brasil"&&(/serie a/.test(name)||/brasileirao/.test(name)&&!/serie [b-d]/.test(name));
 const brazilB=country==="brasil"&&/serie b/.test(name);
 const out=[];
 function add(from,to,key,label){if(count>=from&&to>=from)out.push({from,to:Math.min(count,to),key,label});}
 if(topBrazil&&count>=16){
   add(1,4,"libertadores","Libertadores - fase de grupos");
   add(5,5,"libertadores-playoff","Pre-Libertadores");
   add(6,11,"sulamericana","Sul-Americana (projecao, sujeita a remanejamento)");
   add(count-3,count,"rebaixamento","Rebaixamento - Serie B");
 }else if(brazilB&&count>=16){
   add(1,4,"acesso","Acesso - Serie A (sujeito ao regulamento vigente)");
   add(count-3,count,"rebaixamento","Rebaixamento - Serie C");
 }
 // No unsupported assumptions about league qualification in other countries or formats.
 return out;
}
function forPosition(zones,position){return zones.find(z=>position>=z.from&&position<=z.to)||null;}
const api=Object.freeze({homeCountry,prioritized,zones,forPosition});
root.ProLifeCompetitionZonesV2=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
