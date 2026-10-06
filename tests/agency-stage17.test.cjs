const test=require("node:test");
const assert=require("node:assert/strict");

const E=require("../src/domain/engine.js");
const A=require("../src/application/game.js");
const fs=require("node:fs");

function state(seed=1701){
  const s=E.create({
    mode:"player",
    world:"legacy",
    name:"Stage 17",
    age:20,
    pos:"ATA",
    points:{}
  },seed);

  E.movePlayerToClub(s,s.clubs[0].id);

  const pc=E.Career.init(s).playerCareer;

  s.salary=10000;
  s.contract=730;

  pc.contract={
    clubId:s.clubId,
    signedDay:s.day,
    endDay:s.day+730,
    durationDays:730,
    salary:10000,
    signingBonus:0,
    role:"Titular",
    type:"permanent"
  };

  return s;
}

function star(seed=1750){
  const s=state(seed);
  const pc=E.Career.init(s).playerCareer;

  s.reputation=95;
  pc.marketValue=50000000;

  for(const key of Object.keys(s.person.attrs||{}))
    s.person.attrs[key]=92;

  return s;
}

test("17A: catalogo possui quatro niveis",()=>{
  const levels=new Set(
    E.Career.agencies.map(a=>a.level)
  );

  assert.equal(levels.has("LOCAL"),true);
  assert.equal(levels.has("NATIONAL"),true);
  assert.equal(levels.has("ELITE"),true);
  assert.equal(levels.has("GLOBAL"),true);
});

test("17A: iniciante nao acessa agencia global",()=>{
  const s=state();

  const result=E.Career.agencyEligibility(
    s,
    "apex"
  );

  assert.equal(result.eligible,false);

  assert.throws(
    ()=>E.Career.hireAgency(s,"apex"),
    /Requisitos/
  );
});

test("17A: estrela acessa agencia global",()=>{
  const s=star();

  const result=E.Career.agencyEligibility(
    s,
    "apex"
  );

  assert.equal(result.eligible,true);

  E.Career.hireAgency(s,"apex");

  assert.equal(
    E.Career.init(s).playerCareer.agent.id,
    "apex"
  );
});

test("17A: nao permite segunda agencia durante periodo minimo",()=>{
  const s=star();

  E.Career.hireAgency(s,"atlas");

  assert.throws(
    ()=>E.Career.hireAgency(s,"vanguard"),
    /per\u00edodo m\u00ednimo/
  );

  assert.equal(
    E.Career.init(s).playerCareer.agent.id,
    "atlas"
  );
});

test("17A: troca apos prazo registra historico",()=>{
  const s=star();

  E.Career.hireAgency(s,"atlas");

  s.day+=300;

  E.Career.hireAgency(s,"vanguard");

  const pc=E.Career.init(s).playerCareer;
  const st=E.Career.agencyState(s);

  assert.equal(pc.agent.id,"vanguard");

  assert.equal(
    st.history.some(x=>x.agencyId==="atlas"),
    true
  );
});

test("17A: estrategia gera objetivo de desenvolvimento",()=>{
  const s=state();

  E.Career.setAgentStrategy(s,{
    priority:"development",
    stance:"stay"
  });

  const list=E.Career.buildAgencyObjectives(s);

  assert.equal(
    list.some(x=>x.kind==="OVERALL"),
    true
  );
});

test("17A: objetivo concluido melhora relacionamento",()=>{
  const s=state();

  const st=E.Career.agencyState(s);

  st.objectives=[{
    id:"test-ok",
    kind:"REPUTATION",
    title:"Teste",
    baseline:10,
    target:20,
    deadline:s.day+30,
    status:"ATIVO"
  }];

  s.reputation=25;

  const before=st.relationship;

  E.Career.processAgencyObjectives(s);

  assert.equal(
    st.objectives[0].status,
    "CONCLU\u00cdDO"
  );

  assert(st.relationship>before);
});

test("17A: objetivo vencido reduz relacionamento",()=>{
  const s=state();

  const st=E.Career.agencyState(s);

  st.objectives=[{
    id:"test-fail",
    kind:"REPUTATION",
    title:"Teste",
    baseline:10,
    target:90,
    deadline:s.day,
    status:"ATIVO"
  }];

  const before=st.relationship;

  s.day++;

  E.Career.processAgencyObjectives(s);

  assert.equal(
    st.objectives[0].status,
    "N\u00c3O CUMPRIDO"
  );

  assert(st.relationship<before);
});

test("17A: save antigo recebe agencyState sem destruir agente",()=>{
  const s=state();

  const pc=E.Career.init(s).playerCareer;
  const original=pc.agent.id;

  delete pc.agencyState;

  E.Career.init(s);

  assert.equal(pc.agent.id,original);
  assert(Array.isArray(pc.agencyState.history));
  assert(Array.isArray(pc.agencyState.objectives));
});

test("17A: null intencional de agente permanece null",()=>{
  const s=state();

  const pc=E.Career.init(s).playerCareer;
  pc.agent=null;

  E.Career.init(s);

  assert.equal(pc.agent,null);
});


test("17B: demissao antes do prazo minimo e bloqueada",()=>{
  const s=star(1760);

  E.Career.hireAgency(s,"atlas");

  assert.throws(
    ()=>E.Career.dismissAgency(s),
    /per\u00edodo m\u00ednimo/
  );

  assert.equal(
    E.Career.init(s).playerCareer.agent.id,
    "atlas"
  );
});

test("17B: demissao depois do prazo encerra representacao",()=>{
  const s=star(1761);

  E.Career.hireAgency(s,"atlas");

  s.day+=300;

  const result=E.Career.dismissAgency(s);

  const pc=E.Career.init(s).playerCareer;
  const st=E.Career.agencyState(s);

  assert.equal(result.dismissed,true);
  assert.equal(pc.agent,null);
  assert.equal(st.dismissedDay,s.day);

  assert.equal(
    st.history.some(x=>
      x.agencyId==="atlas" &&
      x.status==="ENCERRADO"
    ),
    true
  );
});

test("17B: rescisao cobra taxa calculada pelo salario",()=>{
  const s=star(1762);

  E.Career.hireAgency(s,"atlas");

  s.day+=300;

  const before=s.wallet;
  const expected=E.Career.agencyExitFee(
    s,
    E.Career.init(s).playerCareer.agent
  );

  const result=E.Career.dismissAgency(s);

  assert.equal(result.fee,expected);
  assert.equal(s.wallet,before-expected);

  assert.equal(
    E.Career.init(s).ledger.some(x=>
      x.label.includes("Rescis")
    ),
    true
  );
});

test("17B: carencia impede nova agencia por 30 dias",()=>{
  const s=star(1763);

  E.Career.hireAgency(s,"atlas");

  s.day+=300;

  E.Career.dismissAgency(s);

  assert.throws(
    ()=>E.Career.hireAgency(s,"vanguard"),
    /30 dias/
  );

  s.day+=30;

  E.Career.hireAgency(s,"vanguard");

  assert.equal(
    E.Career.init(s).playerCareer.agent.id,
    "vanguard"
  );
});

test("17B: troca direta apos prazo cobra rescisao e registra historico",()=>{
  const s=star(1764);

  E.Career.hireAgency(s,"atlas");

  s.day+=300;

  const before=s.wallet;

  const expected=E.Career.agencyExitFee(
    s,
    E.Career.init(s).playerCareer.agent
  );

  E.Career.hireAgency(s,"vanguard");

  const pc=E.Career.init(s).playerCareer;
  const st=E.Career.agencyState(s);

  assert.equal(pc.agent.id,"vanguard");
  assert.equal(s.wallet,before-expected);

  assert.equal(
    st.history.some(x=>
      x.agencyId==="atlas" &&
      x.exitFee===expected
    ),
    true
  );
});

test("17B: jogador elegivel recebe propostas de representacao",()=>{
  const s=star(1765);

  const offers=E.Career.checkAgencyOffers(s);

  assert(offers.length>0);

  assert.equal(
    offers.every(x=>
      x.status==="ABERTA" &&
      x.expires>s.day
    ),
    true
  );
});

test("17B: proposta da mesma agencia nao duplica",()=>{
  const s=star(1766);

  const first=E.Career.checkAgencyOffers(s);

  const ids1=first.map(x=>x.agencyId);

  const second=E.Career.checkAgencyOffers(s);

  const ids2=second.map(x=>x.agencyId);

  assert.deepEqual(ids2,ids1);

  assert.equal(
    new Set(ids2).size,
    ids2.length
  );
});

test("17B: agencia atual nao envia proposta para o proprio jogador",()=>{
  const s=star(1767);

  E.Career.hireAgency(s,"atlas");

  const offers=E.Career.checkAgencyOffers(s);

  assert.equal(
    offers.some(x=>x.agencyId==="atlas"),
    false
  );
});

test("17B: proposta pode ser recusada",()=>{
  const s=star(1768);

  const offer=E.Career.checkAgencyOffers(s)[0];

  assert(offer);

  E.Career.rejectAgencyOffer(s,offer.id);

  assert.equal(offer.status,"RECUSADA");

  assert.equal(
    E.Career.checkAgencyOffers(s)
      .some(x=>x.id===offer.id),
    false
  );
});

test("17B: proposta expirada fecha no ciclo diario",()=>{
  const s=star(1769);

  const offer=E.Career.checkAgencyOffers(s)[0];

  assert(offer);

  s.day=offer.expires+1;

  E.Career.agencyDaily(s);

  assert.equal(offer.status,"EXPIRADA");
});

test("17B: daily processa objetivo ativo",()=>{
  const s=state(1770);

  const st=E.Career.agencyState(s);

  st.objectives=[{
    id:"daily-objective",
    kind:"REPUTATION",
    title:"Teste daily",
    baseline:10,
    target:20,
    deadline:s.day+30,
    status:"ATIVO"
  }];

  s.reputation=30;

  E.Career.agencyDaily(s);

  assert.equal(
    st.objectives[0].status,
    "CONCLU\u00cdDO"
  );
});

test("17B: modo treinador nao recebe propostas de agencia",()=>{
  const s=E.create({
    mode:"coach",
    world:"legacy",
    name:"Coach"
  },1771);

  assert.deepEqual(
    E.Career.checkAgencyOffers(s),
    []
  );
});


test("17C: agente melhor consegue contraproposta melhor",()=>{
  const weak=star(1780);
  const strong=star(1780);

  weak.day=400;
  strong.day=400;

  E.Career.hireAgency(weak,"nunes");
  E.Career.hireAgency(strong,"apex");

  const cw=weak.clubs.find(c=>c.id!==weak.clubId);
  const cs=strong.clubs.find(c=>c.id!==strong.clubId);

  weak.offers=[{
    clubId:cw.id,
    salary:20000,
    signingBonus:30000,
    durationDays:730,
    expires:weak.day+20
  }];

  strong.offers=[{
    clubId:cs.id,
    salary:20000,
    signingBonus:30000,
    durationDays:730,
    expires:strong.day+20
  }];

  const w=E.Career.counterOffer(
    weak,
    cw.id
  );

  const g=E.Career.counterOffer(
    strong,
    cs.id
  );

  assert(g.salary>w.salary);
  assert(g.signingBonus>w.signingBonus);

  assert(
    g.agentNegotiationScore >
    w.agentNegotiationScore
  );
});

test("17C: contraproposta so pode ocorrer uma vez",()=>{
  const s=star(1781);

  s.day=400;

  E.Career.hireAgency(s,"atlas");

  const c=s.clubs.find(x=>x.id!==s.clubId);

  s.offers=[{
    clubId:c.id,
    salary:15000,
    signingBonus:20000,
    expires:s.day+20
  }];

  E.Career.counterOffer(s,c.id);

  assert.throws(
    ()=>E.Career.counterOffer(s,c.id),
    /contraproposta/
  );
});

test("17C: salario cobra comissao uma unica vez por mes",()=>{
  const s=star(1782);

  s.day=420;

  E.Career.hireAgency(s,"atlas");

  s.salary=20000;

  const pc=E.Career.init(s).playerCareer;

  pc.contract.salary=20000;

  const before=s.wallet;

  E.Life.monthlyFinance(
    s,
    E.Career
  );

  const terms=
    E.Career.agencyCommissionTerms(
      pc.agent
    );

  const commission=Math.round(
    20000*terms.salary/100
  );

  assert.equal(
    s.wallet,
    before+20000-commission-650
  );

  assert.equal(
    E.Career.init(s).ledger.filter(x=>
      x.label==="Comiss\u00e3o da ag\u00eancia"
    ).length,
    1
  );

  const after=s.wallet;

  E.Life.monthlyFinance(
    s,
    E.Career
  );

  assert.equal(
    s.wallet,
    after
  );
});

test("17C: total financeiro registra comissao salarial",()=>{
  const s=star(1783);

  s.day=420;

  E.Career.hireAgency(s,"atlas");

  s.salary=10000;

  const pc=E.Career.init(s).playerCareer;
  pc.contract.salary=10000;

  const before=
    E.Career.agencyState(s).totalCommission;

  E.Life.monthlyFinance(
    s,
    E.Career
  );

  assert(
    E.Career.agencyState(s).totalCommission >
    before
  );
});

test("17C: luvas de assinatura cobram comissao",()=>{
  const s=star(1784);

  s.day=400;

  E.Career.hireAgency(s,"atlas");

  const pc=E.Career.init(s).playerCareer;
  const before=s.wallet;

  E.Career.signContract(s,{
    clubId:s.clubId,
    salary:30000,
    signingBonus:100000,
    durationDays:730,
    squadRole:"Titular",
    transferType:"permanent"
  });

  const terms=
    E.Career.agencyCommissionTerms(
      pc.agent
    );

  const fee=Math.round(
    100000*
    terms.signingBonus/
    100
  );

  assert.equal(
    s.wallet,
    before+100000-fee
  );

  assert.equal(
    E.Career.init(s).ledger.filter(x=>
      x.label===
      "Comiss\u00e3o da ag\u00eancia - luvas de assinatura"
    ).length,
    1
  );
});

test("17C: renovacao cobra comissao sobre luvas",()=>{
  const s=star(1785);

  s.day=400;

  E.Career.hireAgency(s,"atlas");

  const pc=E.Career.init(s).playerCareer;

  pc.renewalOffer={
    clubId:s.clubId,
    salary:35000,
    durationDays:1095,
    signingBonus:80000,
    performanceBonus:10000,
    role:"Importante",
    expires:s.day+20
  };

  const before=s.wallet;

  E.Career.acceptRenewal(s);

  const terms=
    E.Career.agencyCommissionTerms(
      pc.agent
    );

  const fee=Math.round(
    80000*
    terms.signingBonus/
    100
  );

  assert.equal(
    s.wallet,
    before+80000-fee
  );

  assert.equal(
    E.Career.init(s).ledger.filter(x=>
      x.label===
      "Comiss\u00e3o da ag\u00eancia - luvas de renova\u00e7\u00e3o"
    ).length,
    1
  );
});

test("17C: pagamento comercial cobra comissao da agencia",()=>{
  const s=star(1786);

  s.day=400;

  E.Career.hireAgency(s,"atlas");

  const c=E.Commercial.init(s,E);
  const brand=E.Commercial.brands[0];

  c.contracts.unshift({
    id:"stage17c-commercial",
    brandId:brand.id,
    brand:brand.name,
    category:brand.category,
    tier:brand.tier,
    amount:100000,
    durationDays:365,
    startDay:s.day,
    endDay:s.day+365,
    nextPaymentDay:s.day,
    status:"ATIVO",
    relationship:70,
    warnings:0,
    paidBonuses:[],
    bonus:{
      kind:"none",
      amount:0,
      label:"Sem bonus"
    }
  });

  const before=s.wallet;

  E.Commercial.processContracts(
    s,
    E.Career,
    E
  );

  const terms=
    E.Career.agencyCommissionTerms(
      E.Career.init(s).playerCareer.agent
    );

  const fee=Math.round(
    100000*
    terms.commercial/
    100
  );

  assert.equal(
    s.wallet,
    before+100000-fee
  );

  assert.equal(
    E.Career.init(s).ledger.filter(x=>
      x.label===
      "Comiss\u00e3o da ag\u00eancia - patroc\u00ednio"
    ).length,
    1
  );
});

test("17C: pagamento comercial nao duplica no mesmo ciclo",()=>{
  const s=star(1787);

  s.day=400;

  E.Career.hireAgency(s,"atlas");

  const c=E.Commercial.init(s,E);
  const brand=E.Commercial.brands[0];

  c.contracts.unshift({
    id:"stage17c-duplicate",
    brandId:brand.id,
    brand:brand.name,
    category:brand.category,
    tier:brand.tier,
    amount:50000,
    durationDays:365,
    startDay:s.day,
    endDay:s.day+365,
    nextPaymentDay:s.day,
    status:"ATIVO",
    relationship:70,
    warnings:0,
    paidBonuses:[],
    bonus:{
      kind:"none",
      amount:0,
      label:"Sem bonus"
    }
  });

  E.Commercial.processContracts(
    s,
    E.Career,
    E
  );

  const wallet=s.wallet;

  E.Commercial.processContracts(
    s,
    E.Career,
    E
  );

  assert.equal(
    s.wallet,
    wallet
  );
});

test("17C: sem agente nao existe comissao",()=>{
  const s=star(1788);

  const pc=E.Career.init(s).playerCareer;

  pc.agent=null;

  const before=s.wallet;

  const fee=
    E.Career.chargeAgentCommission(
      s,
      100000,
      "signing"
    );

  assert.equal(fee,0);
  assert.equal(s.wallet,before);
});


test("17D: application permite encerrar representacao",()=>{
  const s=star(1790);

  s.day=400;

  E.Career.hireAgency(
    s,
    "atlas"
  );

  s.day+=300;

  A.execute(
    s,
    "dismissAgency",
    {}
  );

  assert.equal(
    E.Career.init(s).playerCareer.agent,
    null
  );
});

test("17D: application permite recusar proposta de agencia",()=>{
  const s=star(1791);

  const offer=
    E.Career.checkAgencyOffers(s)[0];

  assert(offer);

  A.execute(
    s,
    "rejectAgencyOffer",
    {id:offer.id}
  );

  assert.equal(
    offer.status,
    "RECUSADA"
  );
});

test("17D: interface contem painel completo de agencia",()=>{
  const html=fs.readFileSync(
    require("node:path").join(
      __dirname,
      "../src/ui/app.js"
    ),
    "utf8"
  );

  assert(
    html.includes(
      "function agencyManagementPanel()"
    )
  );

  assert(
    html.includes(
      'id="agency-management"'
    )
  );

  assert(
    html.includes(
      "Mercado de agencias"
    )
  );

  assert(
    html.includes(
      "Propostas de representacao"
    )
  );

  assert(
    html.includes(
      "data-dismiss-agency"
    )
  );

  assert(
    html.includes(
      "data-reject-agency-offer"
    )
  );
});


test("17D: navegacao Meu jogador possui aba Empresario e Agencia",()=>{
  const html=fs.readFileSync(
    require("node:path").join(
      __dirname,
      "../src/ui/app.js"
    ),
    "utf8"
  );

  assert(
    /\["agency",\s*"Empres\u00e1rio e Ag\u00eancia"\]/.test(html)
  );

  assert(
    /agency\s*\(\s*\)\s*\{/.test(html)
  );

  assert(
    /return\s+agencyManagementPanel\s*\(\s*\)\s*;/.test(html)
  );

  const playerNav=
    html.match(
      /\["profile",\s*"Meu jogador",[\s\S]*?\]\],/
    );

  assert(playerNav);

  assert(
    playerNav[0].includes(
      '["agency", "Empres\u00e1rio e Ag\u00eancia"]'
    )
  );
});
