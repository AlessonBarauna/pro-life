(function(root){
"use strict";
// 33C: integrated, strictly read-only preflight. This is not the UEFA access list.
const Q=typeof require==="function"?require("./conference-qualification.js"):root.ProLifeConferenceQualification;
const F=typeof require==="function"?require("./conference-fixtures.js"):root.ProLifeConferenceFixtures;
const Cal=typeof require==="function"?require("./conference-calendar.js"):root.ProLifeConferenceCalendar;
function check(s,C,options={}){
 if(!s||!C)throw Error("Estado e Continental obrigatorios");
 const qualification=Q.inspect(s,C), blockers=[];
 if(!qualification.ready)blockers.push("inscricoes_incompletas_ou_duplicadas");
 const ed=C.edition(s,"uecl");
 if(!ed)return {ready:false,qualification,blockers:["edicao_ausente"],official:false};
 if(ed.leagueSchedule?.matches?.length)blockers.push("calendario_ja_existente_nao_sobrescrever");
 if(!qualification.ready)return {ready:false,qualification,blockers,official:false};
 let draw;
 try{draw=F.generate(ed);}catch(e){blockers.push("sorteio_impossivel: "+e.message);return {ready:false,qualification,blockers,official:false};}
 // Existing continental fixtures must not be silently moved. Also accept all known
 // domestic matches supplied by the caller (no speculative domestic dates).
 const reserved=[];
 for(const id of ["ucl","uel"]){
   const other=C.edition(s,id);
   for(const m of other?.leagueSchedule?.matches||[]){
     if(Number.isInteger(m.day)&&m.homeId&&m.awayId)reserved.push({day:m.day,homeId:m.homeId,awayId:m.awayId});
   }
   for(const stage of other?.knockout?.stages||[])
     for(const m of stage.matches||[])
       if(Number.isInteger(m.day)&&m.homeId&&m.awayId)reserved.push({day:m.day,homeId:m.homeId,awayId:m.awayId});
 }
 if(Array.isArray(options.domesticFixtures)){
   for(const m of options.domesticFixtures){if(Number.isInteger(m.day)&&m.homeId&&m.awayId)reserved.push({day:m.day,homeId:m.homeId,awayId:m.awayId});}
 }else blockers.push("calendario_domestico_nao_fornecido");
 const startDay=options.startDay;
 if(!Number.isInteger(startDay)){blockers.push("inicio_de_calendario_nao_definido");return {ready:false,qualification,drawCount:draw.matches.length,reservedCount:reserved.length,blockers,official:false};}
 let calendar;
 try{calendar=Cal.preview(ed,draw.matches,{startDay,stepDays:options.stepDays||21,maxOffset:options.maxOffset??6,reserved});}
 catch(e){blockers.push("calendario_invalido: "+e.message);return {ready:false,qualification,drawCount:draw.matches.length,reservedCount:reserved.length,blockers,official:false};}
 if(!calendar.ready)blockers.push("conflitos_de_data");
 if(calendar.matches.some(m=>m.day<=s.day))blockers.push("partidas_no_passado_ou_hoje");
 // Official 2026/27 qualification brackets, coefficients, dates and cross-competition
 // transfers are not modelled. Never promote this preview to automatic scheduling.
 blockers.push("qualificatorias_oficiais_ainda_nao_implementadas");
 return {ready:false,qualification,drawCount:draw.matches.length,reservedCount:reserved.length,scheduled:calendar.scheduled,conflicts:calendar.conflicts.length,preview:calendar.matches,blockers,official:false,mutated:false};
}
const api={check};root.ProLifeConferencePreflight=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
