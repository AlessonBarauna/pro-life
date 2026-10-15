(function(root){
"use strict";
// Guardrail for transitioning coach matches to true minute-by-minute execution.
// Never accept a match already present in state.matches: it has already affected
// the league table, disciplinary records, statistics and career progression.
function isCommitted(state,match){
 if(!state||!match||!Array.isArray(state.matches))return false;
 return state.matches.some(m=>m===match||(m&&m.home===match.home&&m.away===match.away&&
  m.date===match.date&&m.season===match.season&&
  (m.competitionId||m.leagueId)===(match.competitionId||match.leagueId)));
}
function canBegin(state,fixture){
 if(state?.mode!=="coach")return {ok:false,reason:"Disponível somente na carreira de treinador."};
 if(!fixture?.home||!fixture?.away)return {ok:false,reason:"Confronto incompleto."};
 if(isCommitted(state,fixture))return {ok:false,reason:"O confronto já foi finalizado e contabilizado."};
 if(!Number.isInteger(fixture.date)||fixture.date<state.day)return {ok:false,reason:"Data do confronto inválida."};
 return {ok:true};
}
function begin(state,fixture){
 const valid=canBegin(state,fixture);
 if(!valid.ok)return valid;
 return {ok:true,session:{version:1,kind:"coach-official-pending",fixture:{home:fixture.home,away:fixture.away,date:fixture.date,season:fixture.season,competitionId:fixture.competitionId||null},minute:0,actions:[],status:"pending"}};
}
function record(session,action){
 if(!session||session.kind!=="coach-official-pending"||session.status!=="pending")return false;
 if(!action||!["substitution","tactic"].includes(action.type)||!Number.isInteger(action.minute)||action.minute<session.minute||action.minute>90)return false;
 if(action.type==="substitution"){
  if(typeof action.outId!=="string"||!action.outId||typeof action.inId!=="string"||!action.inId||action.outId===action.inId)return false;
  if(![0,1].includes(action.side??0))return false;
  if(session.actions.filter(a=>a.type==="substitution"&&(a.side??0)===(action.side??0)).length>=5)return false;
  if(session.actions.some(a=>a.type==="substitution"&&a.side===action.side&&(a.outId===action.outId||a.inId===action.inId||a.outId===action.inId)))return false;
 }
 session.minute=action.minute;session.actions.push({...action,side:action.side??0});return true;
}
function complete(session){
 if(!session||session.kind!=="coach-official-pending"||session.status!=="pending")return false;
 session.status="simulation_complete";return true;
}
// Called only after the official result has actually been saved and the table updated.
// This function does not alter standings: it marks the external commit as observed.
function acknowledgeCommit(state,session){
 if(!session||session.status!=="simulation_complete"||!isCommitted(state,session.fixture))return false;
 session.status="committed";return true;
}
const API=Object.freeze({isCommitted,canBegin,begin,record,complete,acknowledgeCommit});
root.ProLifeCoachOfficialSessionV2=API;
if(typeof module!=="undefined"&&module.exports)module.exports=API;
})(typeof globalThis!=="undefined"?globalThis:this);
