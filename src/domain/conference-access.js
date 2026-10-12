(function(root){
"use strict";
// 33E: read-only provenance/eligibility audit. NOT an official UEFA access list.
// Never promote an adapted league ranking to a confirmed qualifying entrant.
const validId=x=>typeof x==="string"&&x.length>0;
function normalizeOrders(finals,associations,year){
 const source=finals&&finals[String(year-1)];
 const rows=[],issues=[];
 for(const a of associations||[]){
  if(!a||!validId(a.code)||!validId(a.leagueId)){issues.push("invalid_association");continue;}
  const order=source&&source[a.code];
  if(!Array.isArray(order)||!order.length){issues.push("missing_previous_season_table:"+a.code);continue;}
  const seen=new Set();
  for(let i=0;i<order.length;i++){
   const id=order[i];
   if(!validId(id)||seen.has(id)){issues.push("invalid_domestic_rank:"+a.code+":"+(i+1));continue;}
   seen.add(id);
   rows.push({clubId:id,association:a.code,leagueId:a.leagueId,domesticPosition:i+1,source:"previous_season_final_table"});
  }
 }
 return {rows,issues};
}
function audit(options){
 if(!options||!Number.isInteger(options.season)||!Array.isArray(options.associations))throw Error("Temporada e associacoes obrigatorias");
 const base=normalizeOrders(options.finals,options.associations,options.season);
 const issues=[...base.issues],higher=new Set(),higherPerComp={};
 for(const comp of ["ucl","uel"]){
  const ids=(options.higherEntries&&options.higherEntries[comp]);
  if(!Array.isArray(ids)){issues.push("missing_confirmed_"+comp+"_entrants");continue;}
  const seen=new Set();
  for(const id of ids){
   if(!validId(id)||seen.has(id)||higher.has(id))issues.push("invalid_or_duplicate_higher_entrant:"+comp+":"+id);
   seen.add(id);higher.add(id);
  }
  higherPerComp[comp]=seen.size;
 }
 const cupEntries=[];
 for(const c of options.cupWinners||[]){
  if(!c||!validId(c.clubId)||!validId(c.association)||!validId(c.competitionId)||c.verified!==true){issues.push("unverified_cup_result");continue;}
  cupEntries.push({clubId:c.clubId,association:c.association,competitionId:c.competitionId,source:"verified_domestic_cup_winner"});
 }
 const transfers=[];const transferred=new Set();
 for(const r of options.transfers||[]){
  if(!r||!["ucl","uel"].includes(r.from)||!validId(r.clubId)||!validId(r.stage)||!["main","champions"].includes(r.targetPath)||r.verified!==true){issues.push("unverified_uefa_transfer");continue;}
  if(higher.has(r.clubId)||transferred.has(r.clubId)){issues.push("duplicate_or_active_uefa_transfer:"+r.clubId);continue;}
  transferred.add(r.clubId);
  transfers.push({clubId:r.clubId,from:r.from,stage:r.stage,targetPath:r.targetPath,source:"verified_qualifying_elimination"});
 }
 const byId=new Map();
 for(const row of base.rows)if(!higher.has(row.clubId)&&!byId.has(row.clubId))byId.set(row.clubId,{...row,routes:["league"]});
 for(const c of cupEntries){
  if(higher.has(c.clubId))continue;
  const prev=byId.get(c.clubId);
  if(prev){prev.routes.push("cup:"+c.competitionId);}else byId.set(c.clubId,{...c,routes:["cup"]});
 }
 // Transfers are recorded separately. Do not confuse a relegated qualifier with
 // a confirmed Conference league-phase team or direct access entitlement.
 const candidates=[...byId.values()];
 const associationIds=new Set(options.associations.map(x=>x.code));
 for(const c of candidates)if(!associationIds.has(c.association))issues.push("unknown_association:"+c.association);
 for(const t of transfers)if(byId.has(t.clubId)){
  // Same club may also have domestic merit, but must enter only once.
  issues.push("dual_route_requires_access_resolution:"+t.clubId);
 }
 const accessList=options.officialAccessList;
 if(!accessList||accessList.verified!==true||accessList.season!==options.season||!Array.isArray(accessList.slots))issues.push("official_uefa_access_list_missing");
 // No access allocation or save mutation here; qualification and league phase
 // must remain blocked until actual UCL/UEL qualification integrations exist.
 issues.push("ucl_uel_qualifying_brackets_not_integrated");
 return {season:options.season,official:false,ready:false,mutated:false,candidates,transfers,cups:cupEntries,issues:[...new Set(issues)],higherCompetitionCounts:higherPerComp};
}
const api={normalizeOrders,audit};root.ProLifeConferenceAccess=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
