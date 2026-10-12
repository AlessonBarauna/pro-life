(function(root){
"use strict";
// Stage 33B: read-only audit. The current Continental quota distribution is an
// adapted PRO-LIFE model, NOT the official UEFA qualifying rounds/access list.
function inspect(state,continental){
 if(!state||!continental||typeof continental.edition!=="function")throw Error("Estado e motor continental obrigatorios.");
 const ed=continental.edition(state,"uecl");
 if(!ed)return {ready:false,reason:"Edicao Conference ausente",participants:0,issues:["missing_edition"],official:false};
 const others=["ucl","uel"].flatMap(k=>(continental.edition(state,k)?.entrants||[]).map(row=>row[0]));
 const blocked=new Set(others),seen=new Set(),issues=[];
 const entrants=Array.isArray(ed.entrants)?ed.entrants:[];
 for(const row of entrants){
  if(!Array.isArray(row)||typeof row[0]!=="string"||!row[0]||typeof row[1]!=="string"||!row[1]){issues.push("invalid_entry");continue;}
  if(seen.has(row[0]))issues.push("duplicate_conference_club:"+row[0]);
  if(blocked.has(row[0]))issues.push("overlap_higher_competition:"+row[0]);
  seen.add(row[0]);
 }
 if(entrants.length!==36)issues.push("incomplete_league_phase:"+entrants.length+"/36");
 if(ed.source==="bootstrap")issues.push("initial_season_uses_prestige_not_domestic_results");
 if(entrants.some(row=>String(row[2]||"").startsWith("vaga-complementar")))issues.push("complementary_adapted_slots");
 issues.push("official_qualifying_access_rounds_not_simulated");
 return {ready:issues.filter(x=>x.startsWith("invalid_")||x.startsWith("duplicate_")||x.startsWith("overlap_")||x.startsWith("incomplete_")).length===0,season:ed.season,participants:entrants.length,issues,official:false,source:ed.source,entrants:entrants.map(row=>({id:row[0],country:row[1],route:row[2]||"unknown"}))};
}
const api={inspect};root.ProLifeConferenceQualification=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
