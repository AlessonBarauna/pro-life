(function(root){
"use strict";
// 33D: pure qualifying tie reducer. Not an official UEFA access-list generator.
const STAGES=Object.freeze({main:["q1","q2","q3","playoff"],champions:["q2","q3","playoff"]});
function assert(condition,message){if(!condition)throw Error(message);}
function create(input){
 assert(input&&["main","champions"].includes(input.path),"Caminho invalido");
 assert(STAGES[input.path].includes(input.round),"Rodada invalida");
 assert(Number.isInteger(input.season),"Temporada invalida");
 assert(Array.isArray(input.pairs)&&input.pairs.length>0,"Pares obrigatorios");
 const seen=new Set();
 const pairs=input.pairs.map((p,i)=>{
  assert(p&&typeof p.homeId==="string"&&typeof p.awayId==="string"&&p.homeId!==p.awayId&&p.homeId&&p.awayId,"Par invalido");
  assert(!seen.has(p.homeId)&&!seen.has(p.awayId),"Clube repetido na mesma rodada");
  seen.add(p.homeId);seen.add(p.awayId);
  return {id:input.path+":"+input.round+":"+i,homeId:p.homeId,awayId:p.awayId,legs:[],winnerId:null};
 });
 return {competition:"uecl",season:input.season,path:input.path,round:input.round,pairs,status:"pending",source:input.source||"simulation",officialAccess:false};
}
function applyLeg(edition,record){
 assert(edition&&edition.competition==="uecl"&&Array.isArray(edition.pairs),"Edicao invalida");
 assert(edition.status!=="complete","Rodada concluida");
 const p=edition.pairs.find(x=>x.id===record?.pairId);
 assert(p,"Confronto inexistente");
 const leg=record.leg;
 assert(leg===1||leg===2,"Perna invalida");
 assert(!p.legs.some(x=>x.leg===leg),"Partida ja registrada");
 assert(leg===1||p.legs.some(x=>x.leg===1),"Registrar ida primeiro");
 const homeId=leg===1?p.homeId:p.awayId,awayId=leg===1?p.awayId:p.homeId;
 assert(record.homeId===homeId&&record.awayId===awayId,"Mandante/visitante incorretos");
 assert(Number.isInteger(record.hg)&&record.hg>=0&&Number.isInteger(record.ag)&&record.ag>=0,"Placar invalido");
 let winner=null;
 if(leg===2){
  const first=p.legs[0];const a=first.hg+record.ag,b=first.ag+record.hg;
  if(a!==b)winner=a>b?p.homeId:p.awayId;
  else{
   assert(record.tieBreakWinnerId===p.homeId||record.tieBreakWinnerId===p.awayId,"Empate agregado requer vencedor de desempate");
   winner=record.tieBreakWinnerId;
  }
 }
 const np={...p,legs:[...p.legs,{leg,homeId,awayId,hg:record.hg,ag:record.ag}],winnerId:winner};
 const pairs=edition.pairs.map(x=>x.id===p.id?np:x);
 return {...edition,pairs,status:pairs.every(x=>x.winnerId)?"complete":"in_progress"};
}
function summary(edition){
 assert(edition&&Array.isArray(edition.pairs),"Edicao invalida");
 const complete=edition.status==="complete";
 return {complete,winners:complete?edition.pairs.map(x=>x.winnerId):[],eliminated:complete?edition.pairs.map(x=>x.winnerId===x.homeId?x.awayId:x.homeId):[],played:edition.pairs.reduce((n,p)=>n+p.legs.length,0),expected:edition.pairs.length*2,officialAccess:false};
}
function validateTransfers(records,alreadyAllocated=[]){
 // Source elimination records must be supplied by the real UCL/UEL qualification engines.
 assert(Array.isArray(records)&&Array.isArray(alreadyAllocated),"Listas invalidas");
 const used=new Set(alreadyAllocated),out=[];
 for(const r of records){
  assert(r&&["ucl","uel"].includes(r.from)&&typeof r.clubId==="string"&&r.clubId&&typeof r.stage==="string"&&r.stage,"Transferencia invalida");
  assert(r.verified===true,"Eliminacao nao confirmada pelo motor de origem");
  assert(!used.has(r.clubId),"Clube duplicado em competicoes UEFA");
  assert(["main","champions","league"].includes(r.targetPath),"Caminho de destino invalido");
  used.add(r.clubId);out.push({clubId:r.clubId,from:r.from,fromStage:r.stage,targetPath:r.targetPath,provenance:"verified_elimination"});
 }
 return out;
}
const api={STAGES,create,applyLeg,summary,validateTransfers};
root.ProLifeConferenceQualifyingTies=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
