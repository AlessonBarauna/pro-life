"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const J=require("../src/ui/player-j11-coach.js");
const career={init:()=>({playerCareer:{coachTrust:61,squadRole:"Rotação",lastMatchReport:{rating:7.1}}})};
function squad(role){
 return {init:()=>({trainingTrend:1}),trustSummary:()=>({trend:1,history:[]}),managerProfile:()=>({name:"Treinador",preferredFormation:"4-3-3"}),
 competition:()=>({heroRole:role,rivals:[{id:"r1",name:"Rival",overall:77,score:81,status:"Titular"},{id:"hero",name:"Herói",overall:73,score:76,status:role}]}),
 coachConversationStatus:()=>({available:true}),coachPromiseStatus:()=>null,
 substitutePlan:()=>({minute:68,chance:0.45})};
}
const state={mode:"player",clubId:"club",person:{condition:80,injury:0,suspension:0}};
test("J11.2 shows positional score and bench substitution forecast",()=>{
 const out=J.render(state,squad("Banco"),career);
 assert.match(out,/Situação projetada:<\/b> Banco/);
 assert.match(out,/Sua pontuação na disputa: 76/);
 assert.match(out,/68&#39;/);
 assert.match(out,/45%/);
 assert.match(out,/Não há entrada garantida/);
});
test("J11.2 does not promise substitute minutes for a starter",()=>{
 const out=J.render(state,squad("Titular"),career);
 assert.match(out,/entre os titulares/);
 assert.doesNotMatch(out,/chance contextual inicial/);
});
test("J11.2 shows unavailability",()=>{
 const out=J.render({...state,person:{...state.person,injury:4}},squad("Fora da relação"),career);
 assert.match(out,/Lesão ou suspensão limita/);
});
test("J11.2 does not change coach confidence or current squad selection",()=>{
 const src=fs.readFileSync("src/ui/player-j11-coach.js","utf8");
 assert.doesNotMatch(src,/coachTrust\s*=|A\.execute|persist\(|D\.advance/);
 assert.equal(J.render({...state,mode:"coach"},squad("Banco"),career),"");
});
