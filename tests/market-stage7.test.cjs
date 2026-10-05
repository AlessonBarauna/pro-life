const test=require("node:test"),assert=require("node:assert/strict");
const E=require("../src/domain/engine.js"),A=require("../src/application/game.js");
function state(seed=707){const s=E.create({mode:"player",world:"brazil2026",name:"Teste",pos:"ATA",age:19},seed); const o=s.offers[0]; E.join(s,o.clubId,o.salary); return s;}
test("interesse respeita concorrencia e reputacao",()=>{const s=state(); const clubs=s.clubs.filter(c=>c.id!==s.clubId); const a=E.Career.interestAssessment(s,clubs[0].id); assert.ok(a&&a.score>=0&&a.score<=100); assert.ok(a.recommendedOverall>0)});
test("recusa cria cooldown e nao duplica",()=>{const s=state(); const c=s.clubs.find(c=>c.id!==s.clubId); s.offers=[{clubId:c.id,salary:10000,expires:s.day+10}]; E.Career.rejectOffer(s,c.id); assert.equal(s.offers.length,0); assert.ok(E.Career.init(s).playerCareer.marketState.rejectionCooldowns[c.id]>s.day)});
test("pedir tempo estende prazo",()=>{const s=state();s.careerTransferAvailableDay=0;const c=s.clubs.find(c=>c.id!==s.clubId);s.offers=[{clubId:c.id,salary:10000,expires:s.day+2}];E.Career.holdOffer(s,c.id);assert.ok(s.offers[0].expires>=s.day+7)});
test("acordo fora da janela agenda transferencia e bloqueia outro",()=>{const s=state();s.day=100;const cs=s.clubs.filter(c=>c.id!==s.clubId).slice(0,2);s.offers=cs.map((c,i)=>({clubId:c.id,salary:12000+i*1000,durationDays:730,expires:s.day+20,squadRole:"Rotação"}));A.execute(s,"join",{id:cs[0].id});const pc=E.Career.init(s).playerCareer;assert.ok(s.clubId);assert.equal(pc.marketState.signedAgreement.clubId,cs[0].id);assert.throws(()=>A.execute(s,"join",{id:cs[1].id}))});
test("efetivacao em janela preserva historico e entra no novo elenco",()=>{const s=state();s.day=100;const c=s.clubs.find(c=>c.id!==s.clubId);s.offers=[{clubId:c.id,salary:15000,durationDays:730,expires:130,squadRole:"Rotação",transferType:"permanent"}];A.execute(s,"join",{id:c.id});const pc=E.Career.init(s).playerCareer;s.day=pc.marketState.signedAgreement.startDay;const due=E.Career.marketTick(s);s.offers=[due];E.join(s,due.clubId,due.salary);assert.equal(s.clubId,c.id);assert.ok(c.roster.some(p=>p.id==="hero"));assert.ok(E.Career.init(s).transfers.some(t=>t.player===s.person.name))});
test("agencia e agente persistem e possuem periodo minimo",()=>{const s=state();E.Career.hireAgency(s,"atlas");assert.equal(E.Career.init(s).playerCareer.agent.id,"atlas");assert.throws(()=>E.Career.hireAgency(s,"prime"));const copy=JSON.parse(JSON.stringify(s));assert.equal(E.Career.init(copy).playerCareer.agent.id,"atlas")});


test("mudanca estrutural preserva hero no roster e transferencia publica sem proposta e rejeitada",()=>{
 const s=E.create({mode:"player",world:"legacy",clubId:"c0"},771); const hero=s.person; const target=s.clubs.find(c=>c.id==="c3");
 E.movePlayerToClub(s,target.id); assert.equal(s.person,hero); assert.equal(target.roster.find(p=>p.id==="hero"),hero);
 const other=s.clubs.find(c=>c.id!==target.id); s.day=s.careerTransferAvailableDay; s.offers=[]; assert.throws(()=>E.join(s,other.id,9999),/proposta não está disponível/);
});

test("save load religa hero ao roster e preserva contrato e clube",()=>{
 const Save=require("../src/infrastructure/save.js"); const s=E.create({mode:"player",world:"legacy",clubId:"c0"},772); const loaded=Save.parse(JSON.stringify(s));
 assert.equal(E.club(loaded).roster.find(p=>p.id==="hero"),loaded.person); assert.equal(loaded.clubId,s.clubId); assert.equal(loaded.contract,s.contract); assert.equal(E.Career.init(loaded).playerCareer.contract.clubId,loaded.clubId);
});
