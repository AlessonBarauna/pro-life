(function(root){
"use strict";
// 33F: pure, read-only bridge from COMPLETED UECL playoff brackets to
// the league-phase entrant list. It does not allocate official UEFA access slots.
const id=x=>typeof x==="string"&&x.trim().length>0;
const VALID_PATHS=["main","champions"];
function assemble(input){
 if(!input||!Number.isInteger(input.season))throw Error("Temporada invalida");
 const issues=[],entries=[],seen=new Set();
 const active=new Set();
 for(const comp of ["ucl","uel"]){
  const list=input.higherEntries?.[comp];
  if(!Array.isArray(list)){issues.push("higher_entrants_missing:"+comp);continue;}
  for(const value of list){if(!id(value)||active.has(value))issues.push("higher_entrant_invalid_or_duplicate:"+comp);else active.add(value);}
 }
 const proven=new Map();
 for(const c of input.clubs||[]){
  if(!c||!id(c.id)||!id(c.country)||proven.has(c.id)){issues.push("club_catalog_invalid_or_duplicate");continue;}
  proven.set(c.id,c.country);
 }
 if(!proven.size)issues.push("club_catalog_missing");
 const brackets=input.playoffs;
 if(!Array.isArray(brackets)||brackets.length!==2)issues.push("playoff_paths_missing");
 const paths=new Set();
 for(const round of Array.isArray(brackets)?brackets:[]){
  if(!round||round.competition!=="uecl"||round.season!==input.season||round.round!=="playoff"||!VALID_PATHS.includes(round.path)||paths.has(round.path)){
   issues.push("invalid_or_duplicate_playoff_path");continue;
  }
  paths.add(round.path);
  if(round.status!=="complete"||!Array.isArray(round.pairs)||!round.pairs.length){issues.push("playoff_incomplete:"+round.path);continue;}
  for(const p of round.pairs){
   if(!p||!id(p.homeId)||!id(p.awayId)||p.homeId===p.awayId||!Array.isArray(p.legs)||p.legs.length!==2||!id(p.winnerId)||![p.homeId,p.awayId].includes(p.winnerId)){
    issues.push("unverified_playoff_result:"+round.path);continue;
   }
   // Verify leg order, scores, hosts and aggregate before accepting winner.
   const a=p.legs[0],b=p.legs[1];
   if(a.leg!==1||b.leg!==2||a.homeId!==p.homeId||a.awayId!==p.awayId||b.homeId!==p.awayId||b.awayId!==p.homeId||[a.hg,a.ag,b.hg,b.ag].some(v=>!Number.isInteger(v)||v<0)){
    issues.push("invalid_playoff_legs:"+round.path);continue;
   }
   const h=a.hg+b.ag,aw=a.ag+b.hg;
   if((h>aw&&p.winnerId!==p.homeId)||(aw>h&&p.winnerId!==p.awayId)){
    issues.push("aggregate_winner_mismatch:"+round.path);continue;
   }
   // 33D's tie reducer requires an explicit tie-break winner when aggregate ties.
   // As 33D currently does not persist the *method*, record that limitation.
   if(h===aw)issues.push("tiebreak_method_not_recorded:"+p.id);
   if(active.has(p.winnerId)||seen.has(p.winnerId)){issues.push("winner_duplicate_or_higher_competition:"+p.winnerId);continue;}
   if(!proven.has(p.winnerId)){issues.push("winner_not_in_catalog:"+p.winnerId);continue;}
   seen.add(p.winnerId);
   entries.push([p.winnerId,proven.get(p.winnerId),"uecl_playoff:"+round.path]);
  }
 }
 if(entries.length!==36)issues.push("league_phase_requires_36:"+entries.length);
 if(!input.accessAudit||input.accessAudit.official!==true||input.accessAudit.ready!==true)
  issues.push("official_access_and_ucl_uel_qualifiers_unverified");
 const blockers=[...new Set(issues)];
 return {season:input.season,comp:"uecl",ready:!blockers.length,official:!blockers.length,mutated:false,count:entries.length,entrants:entries,issues:blockers};
}
const api={assemble};root.ProLifeConferenceQualifyingIntegration=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
