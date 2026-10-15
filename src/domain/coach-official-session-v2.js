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
 session.minute=action.minute;session.actions.push({...action});return true;
}
function complete(session){
 if(!session||session.kind!=="coach-official-pending"||session.status!=="pending")return false;
 session.status="simulation_complete";return true;
}
const API=Object.freeze({isCommitted,canBegin,begin,record,complete});
root.ProLifeCoachOfficialSessionV2=API;
if(typeof module!=="undefined"&&module.exports)module.exports=API;
})(typeof globalThis!=="undefined"?globalThis:this);
