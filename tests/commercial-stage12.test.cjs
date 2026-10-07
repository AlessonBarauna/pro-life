const test=require("node:test"),assert=require("node:assert/strict");
const E=require("../src/domain/engine.js"),A=require("../src/application/game.js"),Save=require("../src/infrastructure/save.js");
function career(seed=1200){const s=E.create({mode:"player",world:"legacy",name:"Alesson",age:22,pos:"ATA",points:{}},seed);E.movePlayerToClub(s,s.clubs[0].id);const pc=E.Career.init(s).playerCareer;s.salary=20000;s.contract=1500;pc.contract={clubId:s.clubId,signedDay:0,endDay:1500,durationDays:1500,salary:20000,signingBonus:0,role:"Titular",type:"permanent"};return s;}
function elevate(s,pop=75,rep=80){s.reputation=rep;const c=E.Commercial.init(s,E);c.popularity=pop;c.followers=Math.round(1000*Math.pow(1.09,pop));c.lastFansSnapshot=s.fans;E.Commercial.updateValue(s,E);return c;}
function proposal(s,brandId="vertex"){const c=elevate(s),b=E.Commercial.brands.find(x=>x.id===brandId);c.interests.push({brandId:b.id,stage:"NEGOCIAÇÃO",score:90,startedDay:s.day,updatedDay:s.day,ticks:4});for(let i=0;i<2;i++){s.day+=14;E.Commercial.progressInterests(s,new E.Random(s.rng),E.Career,E);}return c.proposals.find(p=>p.brandId===brandId);}
test("Etapa 12: reputação, popularidade, valor esportivo e comercial permanecem separados",()=>{const s=career();const c=E.Commercial.init(s,E),market=E.Career.init(s).playerCareer.marketValue;c.popularity=85;const high=E.Commercial.updateValue(s,E);c.popularity=25;const low=E.Commercial.updateValue(s,E);assert(high>low);assert.equal(s.reputation,15);assert.equal(E.Career.init(s).playerCareer.marketValue,market);});
test("Etapa 12: marcas possuem categorias e critérios próprios",()=>{assert(E.Commercial.brands.length>=8);assert(new Set(E.Commercial.brands.map(x=>x.category)).size>=7);assert(E.Commercial.brands.every(x=>x.minPopularity>=0&&x.minReputation>=0&&x.budget>0&&x.age.length===2));});
test("Etapa 12: perfis A-D destravam marcas em patamares coerentes",()=>{const a=career(3),b=career(4),c=career(5),d=career(6);elevate(a,10,12);elevate(b,38,38);elevate(c,72,76);elevate(d,92,92);c.nationalTeam.caps=5;d.nationalTeam.caps=25;const eligible=s=>E.Commercial.brands.filter(x=>E.Commercial.eligible(s,x,E)).map(x=>x.id);assert.equal(eligible(a).length,0);assert(eligible(b).includes("vertex"));assert(eligible(c).includes("nova"));assert(eligible(d).some(id=>["aureo","orbe","pulse","visa","mastercard"].includes(id)));});
test("Etapa 12: perfis comerciais evoluem sem depender somente do overall",()=>{const low=career(1),popular=career(2);low.reputation=75;elevate(low,25,75);popular.reputation=65;elevate(popular,85,65);for(const k of Object.keys(low.person.attrs))low.person.attrs[k]=90;for(const k of Object.keys(popular.person.attrs))popular.person.attrs[k]=82;assert(E.overall(low.person)>E.overall(popular.person));assert(E.Commercial.updateValue(popular,E)>E.Commercial.updateValue(low,E));assert(E.Commercial.scoreBrand(popular,E.Commercial.brands[2],E)>E.Commercial.scoreBrand(low,E.Commercial.brands[2],E));});
test("Etapa 12: interesse segue pipeline determinístico até proposta real",()=>{const a=career(10),b=JSON.parse(JSON.stringify(a));elevate(a,80,85);elevate(b,80,85);for(let i=0;i<6;i++){a.day+=14;b.day+=14;E.Commercial.progressInterests(a,new E.Random(99+i),E.Career,E);E.Commercial.progressInterests(b,new E.Random(99+i),E.Career,E);}assert(a.commercial.proposals.length>0);assert.deepEqual(a.commercial.interests,b.commercial.interests);assert.deepEqual(a.commercial.proposals,b.commercial.proposals);});
test("Etapa 12: proposta permite pedir tempo, negociar, recusar e aceitar",()=>{const s=career(20),p=proposal(s);assert(p);const old=p.expires;A.execute(s,"commercialHold",{id:p.id});assert(p.expires>old);const result=A.execute(s,"commercialNegotiate",{id:p.id,amount:p.amount,durationDays:p.durationDays,bonus:p.bonus.amount});assert(["ACEITA","CONTRAPROPOSTA"].includes(result));A.execute(s,"commercialAccept",{id:p.id});assert.equal(E.Commercial.active(s).length,1);const other=career(21),p2=proposal(other);A.execute(other,"commercialReject",{id:p2.id});assert.equal(p2.status,"RECUSADA");});
test("Etapa 12: novo patrocinador exclusivo substitui o anterior da mesma categoria",()=>{const s=career(30),a=proposal(s,"vertex");A.execute(s,"commercialAccept",{id:a.id});const c=E.Commercial.init(s,E),old=E.Commercial.active(s)[0],nova=E.Commercial.brands.find(x=>x.id==="nova");c.proposals.unshift({ ...a,id:"manual-nova",brandId:nova.id,brand:nova.name,status:"PROPOSTA",startDay:s.day+1,endDay:s.day+365,expires:s.day+10,round:0 });A.execute(s,"commercialAccept",{id:"manual-nova"});const active=E.Commercial.active(s);assert.equal(active.length,1);assert.equal(active[0].brandId,"nova");assert.equal(old.status,"ENCERRADO");assert.equal(old.replacedBy,"nova");assert.equal(old.endDay,s.day);const history=c.history.find(h=>h.brandId==="vertex");assert.equal(history.status,"SUBSTITUÍDO");assert.equal(history.replacedBy,nova.name);});
test("Etapa 12: pagamento usa wallet e ledger uma \u00fanica vez ap\u00f3s reload",()=>{
  const s=career(40);
  const p=proposal(s);

  A.execute(
    s,
    "commercialAccept",
    {id:p.id}
  );

  const contract=
    E.Commercial.active(s)[0];

  const before=s.wallet;

  s.day=contract.startDay;

  const agent=
    E.Career.init(s).playerCareer.agent;

  const terms=
    E.Career.agencyCommissionTerms(agent);

  const commission=Math.round(
    contract.amount*
    terms.commercial/
    100
  );

  E.Commercial.processContracts(
    s,
    E.Career,
    E
  );

  assert.equal(
    s.wallet,
    before+
    contract.amount-
    commission
  );

  assert.equal(
    E.Career.init(s).ledger.filter(x=>
      x.label===
      "Patroc\u00ednio \u2014 "+contract.brand
    ).length,
    1
  );

  if(commission>0){
    assert.equal(
      E.Career.init(s).ledger.filter(x=>
        x.label===
        "Comiss\u00e3o da ag\u00eancia - patroc\u00ednio"
      ).length,
      1
    );
  }

  const loaded=
    Save.parse(JSON.stringify(s));

  E.Commercial.processContracts(
    loaded,
    E.Career,
    E
  );

  assert.equal(
    loaded.wallet,
    s.wallet
  );

  assert.equal(
    E.Career.init(loaded).ledger.filter(x=>
      x.label===
      "Patroc\u00ednio \u2014 "+contract.brand
    ).length,
    1
  );

  if(commission>0){
    assert.equal(
      E.Career.init(loaded).ledger.filter(x=>
        x.label===
        "Comiss\u00e3o da ag\u00eancia - patroc\u00ednio"
      ).length,
      1
    );
  }
});
test("Etapa 12: 30 dias em massa equivalem a 30 avanços diários",()=>{const a=career(50),p=proposal(a);A.execute(a,"commercialAccept",{id:p.id});const b=Save.parse(JSON.stringify(a));E.advance(a,30);for(let i=0;i<30;i++)E.advance(b,1);assert.equal(a.wallet,b.wallet);assert.deepEqual(a.commercial,b.commercial);assert.deepEqual(E.Career.init(a).ledger,E.Career.init(b).ledger);});
test("Etapa 12: evento comercial não ocupa o dia de partida",()=>{const s=career(60),p=proposal(s);A.execute(s,"commercialAccept",{id:p.id});const x=E.Commercial.active(s)[0],event=s.commercial.events[0];event.day=s.calendarDays[0];event.status="CONFIRMADO";s.day=event.day;E.Commercial.processContracts(s,E.Career,E);assert.equal(event.status,"CONFIRMADO");assert.equal(event.day,s.day+1);assert.equal(x.relationship,70);});
test("Etapa 12: evento concluído afeta exposição sem comprar atributos",()=>{const s=career(70),p=proposal(s);A.execute(s,"commercialAccept",{id:p.id});const event=s.commercial.events[0],attrs=JSON.stringify(s.person.attrs),followers=s.commercial.followers;event.day=++s.day;event.status="CONFIRMADO";E.Commercial.processContracts(s,E.Career,E);assert.equal(event.status,"CONCLUÍDO");assert(s.commercial.followers>followers);assert.equal(JSON.stringify(s.person.attrs),attrs);});
test("Etapa 12: save antigo inicia estado seguro sem inventar contratos",()=>{const s=career(80);delete s.commercial;const loaded=Save.parse(JSON.stringify(s));const c=E.Commercial.init(loaded,E);assert.equal(c.contracts.length,0);assert.equal(c.proposals.length,0);assert(c.followers>=100);});
test("Etapa 12: contratos expiram e renovação depende de relação",()=>{const s=career(90),p=proposal(s);A.execute(s,"commercialAccept",{id:p.id});const x=E.Commercial.active(s)[0];x.endDay=s.day+30;E.Commercial.processContracts(s,E.Career,E);assert(s.commercial.proposals.some(p=>p.renewalOf===x.id));s.day=x.endDay+1;E.Commercial.processContracts(s,E.Career,E);assert.equal(x.status,"ENCERRADO");});
test("Etapa 12: campanha pontual e decisões de evento funcionam",()=>{const s=career(95),p=proposal(s,"linha");assert.equal(p.type,"CAMPANHA PONTUAL");A.execute(s,"commercialAccept",{id:p.id});let e=s.commercial.events[0];const original=e.day;A.execute(s,"commercialEvent",{id:e.id,choice:"reschedule"});assert(e.day>original);A.execute(s,"commercialEvent",{id:e.id,choice:"participate"});assert.equal(e.status,"CONFIRMADO");s.day=e.day;E.Commercial.processContracts(s,E.Career,E);assert.equal(e.status,"CONCLUÍDO");});
test("Etapa 12: recusas importantes repetidas podem encerrar contrato",()=>{const s=career(96),p=proposal(s);A.execute(s,"commercialAccept",{id:p.id});const x=E.Commercial.active(s)[0],c=s.commercial;x.relationship=45;for(let i=0;i<3;i++){const e={id:`manual-event-${i}`,contractId:x.id,brandId:x.brandId,brand:x.brand,day:s.day+i+1,type:"CAMPANHA",status:"AGENDADO",mandatory:true,reschedules:0};c.events.push(e);A.execute(s,"commercialEvent",{id:e.id,choice:"decline"});}assert.equal(x.status,"ENCERRADO");assert.equal(x.warnings,3);});
test("Etapa 12: atuação real aumenta público sem alterar overall",()=>{const s=career(100),c=E.Commercial.init(s,E),before=c.followers,ovr=E.overall(s.person);E.Commercial.onMatch(s,{ratings:{hero:8.7},events:[{type:"goal",playerId:"hero"},{type:"goal",playerId:"hero"}]},E.Career,E);assert(c.followers>before);assert.equal(E.overall(s.person),ovr);});
test("Etapa 12: arquivo longo compacta NPCs sem perder o histórico do jogador",()=>{const s=career(110);for(let year=2026;year<=2028;year++){s.season=year;const stats=E.Statistics.init(s).root,league=E.club(s).leagueId;stats.players.hero.appearances=year-2000;stats.players.hero.byCompetition[league]={appearances:10,starts:10,minutes:900,goals:4,assists:2,motm:1,ratingTotal:72,saves:0,tackles:5,shots:20,onTarget:10,xg:4,yellowCards:0,redCards:0};const npc=s.clubs[0].roster.find(x=>x.id!=="hero");stats.players[npc.id]={appearances:10,starts:10,minutes:900,goals:2,assists:1,motm:0,ratingTotal:68,saves:0,tackles:4,shots:10,onTarget:4,xg:2,yellowCards:0,redCards:0,byCompetition:{[league]:{appearances:10,starts:10,minutes:900,goals:2,assists:1,motm:0,ratingTotal:68,saves:0,tackles:4,shots:10,onTarget:4,xg:2,yellowCards:0,redCards:0}},byClub:{}};E.Statistics.closeSeason(s);}assert.equal(Object.keys(s.statistics.players).length,1);assert(s.statistics.players.hero);assert.equal(s.statistics.seasons[2].compact,true);assert.equal(s.statistics.seasons[2].teams.length,0);assert(s.statistics.seasons[2].panorama.every(x=>Array.isArray(x.team)&&x.team.length===0));assert(s.statistics.seasons[2].player);assert.equal(s.statistics.seasons[0].compact,undefined);});
test("Etapa 12: retenção comercial preserva pendências e limita históricos encerrados",()=>{const s=career(120),c=E.Commercial.init(s,E);c.proposals=Array.from({length:140},(_,i)=>({id:`p${i}`,status:i<3?"PROPOSTA":"EXPIRADA"}));c.events=Array.from({length:140},(_,i)=>({id:`e${i}`,status:i<2?"AGENDADO":"CONCLUÍDO"}));c.history=Array.from({length:140},(_,i)=>({id:i}));E.Commercial.init(s,E);assert.equal(c.proposals.filter(x=>x.status==="PROPOSTA").length,3);assert(c.proposals.length<=100);assert.equal(c.events.filter(x=>x.status==="AGENDADO").length,2);assert(c.events.length<=100);assert.equal(c.history.length,80);});

test("Ajuste: confirmar presença agenda a atividade e conclusão gera resultado persistido",()=>{const s=career(171),p=proposal(s,"vertex");A.execute(s,"commercialAccept",{id:p.id});const e=s.commercial.events[0],beforeFollowers=s.commercial.followers,beforeDay=s.day;A.execute(s,"commercialEvent",{id:e.id,choice:"participate"});assert.equal(e.status,"CONFIRMADO");assert.equal(e.completedDay,undefined);assert.equal(s.day,beforeDay);s.day=e.day;E.Commercial.processContracts(s,E.Career,E);assert.equal(e.status,"CONCLUÍDO");assert(e.result);assert(["NORMAL","POSITIVO","EXCELENTE"].includes(e.result.tier));assert(s.commercial.followers>beforeFollowers);const messages=E.Career.init(s).communications.messages||[];assert(messages.some(m=>m.subject==="Resultado do compromisso comercial"));});
test("Ajuste: atividade não confirmada não é concluída automaticamente",()=>{const s=career(172),p=proposal(s,"vertex");A.execute(s,"commercialAccept",{id:p.id});const e=s.commercial.events[0];s.day=e.day;E.Commercial.processContracts(s,E.Career,E);assert.equal(e.status,"AGENDADO");assert.equal(e.completedDay,undefined);});

test("Ajuste: evento confirmado não aceita segunda decisão antes da realização",()=>{const s=career(173),p=proposal(s,"vertex");A.execute(s,"commercialAccept",{id:p.id});const e=s.commercial.events[0];A.execute(s,"commercialEvent",{id:e.id,choice:"participate"});assert.equal(e.status,"CONFIRMADO");assert.throws(()=>A.execute(s,"commercialEvent",{id:e.id,choice:"participate"}),/já confirmado/);assert.throws(()=>A.execute(s,"commercialEvent",{id:e.id,choice:"decline"}),/já confirmado/);assert.equal(e.status,"CONFIRMADO");});


test("Ajuste: troca de patrocinador cancela compromissos pendentes do contrato anterior",()=>{const s=career(301),a=proposal(s,"vertex");A.execute(s,"commercialAccept",{id:a.id});const c=E.Commercial.init(s,E),old=E.Commercial.active(s)[0],event=c.events.find(e=>e.contractId===old.id);assert(event);const nova=E.Commercial.brands.find(x=>x.id==="nova");c.proposals.unshift({...a,id:"manual-nova-events",brandId:nova.id,brand:nova.name,status:"PROPOSTA",startDay:s.day+1,endDay:s.day+365,expires:s.day+10,round:0});A.execute(s,"commercialAccept",{id:"manual-nova-events"});assert.equal(event.status,"CANCELADO");assert.equal(event.completedDay,s.day);assert.equal(E.Commercial.active(s).filter(x=>x.category==="SPORTSWEAR").length,1);});

test("Ajuste: patrocinadores de categorias diferentes continuam simultaneamente",()=>{const s=career(302),a=proposal(s,"vertex");A.execute(s,"commercialAccept",{id:a.id});const c=E.Commercial.init(s,E),tech=E.Commercial.brands.find(x=>x.id==="orbe");c.proposals.unshift({...a,id:"manual-tech",brandId:tech.id,brand:tech.name,category:tech.category,exclusive:false,status:"PROPOSTA",startDay:s.day+1,endDay:s.day+365,expires:s.day+10,round:0});A.execute(s,"commercialAccept",{id:"manual-tech"});assert.equal(E.Commercial.active(s).length,2);assert(E.Commercial.active(s).some(x=>x.brandId==="vertex"));assert(E.Commercial.active(s).some(x=>x.brandId==="orbe"));});

// === BASE REAL DE PATROCINADORES V2 ===


test("Patrocínios V2: base possui aproximadamente 100 marcas reais e sem fictícias antigas",()=>{
  assert(E.Commercial.brands.length>=90);
  assert(E.Commercial.brands.length<=130);

  const names=E.Commercial.brands.map(b=>b.name);

  for(const expected of [
    "Nike","Adidas","Puma","Umbro","New Balance",
    "Itaú","Visa","Mastercard","Coca-Cola",
    "Red Bull","Samsung","Vivo","Fiat","Cimed","Oakley"
  ]){
    assert(names.includes(expected),expected);
  }

  for(const legacy of [
    "Vertex Sports",
    "Nova Athletics",
    "Pulse Energy",
    "Orbe Tech",
    "Voltz Motors",
    "Linha Onze",
    "Áureo Chronos",
    "Nexo Bank"
  ]){
    assert(!names.includes(legacy),legacy);
  }
});

test("Patrocínios V2: nenhuma casa de apostas pode ser nova patrocinadora",()=>{
  const names=E.Commercial.brands.map(b=>b.name.toLowerCase());

  for(const blocked of [
    "betano","bet365","sportingbet","pixbet","superbet",
    "betfair","betnacional","esportes da sorte","stake"
  ]){
    assert(!names.some(name=>name.includes(blocked)),blocked);
  }
});

test("Patrocínios V2: todas as marcas possuem configuração comercial completa",()=>{
  for(const b of E.Commercial.brands){
    assert(b.id);
    assert(b.name);
    assert(b.category);
    assert(["LOCAL","REGIONAL","NATIONAL","PREMIUM","GLOBAL"].includes(b.tier));
    assert(b.prestige>0);
    assert(b.budget>0);
    assert(b.minReputation>=0);
    assert(b.minPopularity>=0);
    assert(b.minSportingValue>=0);
    assert(b.minCommercialValue>=0);
    assert(Array.isArray(b.contractTypes)&&b.contractTypes.length);
    assert(["NONE","CATEGORY"].includes(b.exclusivity));
    assert(b.preferredPlayerProfile);
    assert(b.baseContractValue>0);
    assert(b.maxContractValue>=b.baseContractValue);
    assert(b.bonusPotential>0);
  }
});

test("Patrocínios V2: mesma marca não pode criar segundo contrato ativo",()=>{
  const s=career(501);
  const p=proposal(s,"vertex");

  A.execute(s,"commercialAccept",{id:p.id});

  const c=E.Commercial.init(s,E);
  const b=E.Commercial.brands.find(b=>b.id==="vertex");

  c.proposals.unshift({
    ...p,
    id:"duplicate-volt",
    brandId:b.id,
    brand:b.name,
    category:b.category,
    tier:b.tier,
    status:"PROPOSTA",
    expires:s.day+10
  });

  assert.throws(
    ()=>A.execute(s,"commercialAccept",{id:"duplicate-volt"}),
    /já possui contrato ativo/
  );

  assert.equal(
    E.Commercial.active(s).filter(x=>x.brandId==="vertex").length,
    1
  );
});

test("Patrocínios V2: init saneia contratos duplicados antigos sem perder o segundo acordo",()=>{
  const s=career(502);
  const p=proposal(s,"linha");

  A.execute(s,"commercialAccept",{id:p.id});

  const c=s.commercial;
  const original=c.contracts[0];

  c.contracts.unshift({
    ...original,
    id:"legacy-duplicate",
    signedDay:s.day+10,
    startDay:s.day+10,
    endDay:s.day+100,
    status:"ATIVO"
  });

  E.Commercial.init(s,E);

  const same=c.contracts.filter(x=>
    x.brandId==="linha" &&
    ["ATIVO","AGENDADO"].includes(x.status)
  );

  assert.equal(same.filter(x=>x.status==="ATIVO").length,1);
  assert.equal(same.filter(x=>x.status==="AGENDADO").length,1);
});

test("Patrocínios V2: exclusividade impede gerar concorrente da mesma categoria",()=>{
  const s=career(503);
  const p=proposal(s,"vertex");

  A.execute(s,"commercialAccept",{id:p.id});

  const c=E.Commercial.init(s,E);
  const rival=E.Commercial.brands.find(b=>b.id==="nova");

  c.interests.push({
    brandId:rival.id,
    stage:"NEGOCIAÇÃO",
    score:100,
    startedDay:s.day,
    updatedDay:s.day,
    ticks:5
  });

  s.day+=14;

  E.Commercial.progressInterests(
    s,
    new E.Random(s.rng),
    E.Career,
    E
  );

  assert(!c.proposals.some(x=>
    x.brandId==="nova" &&
    x.status==="PROPOSTA"
  ));
});

test("Patrocínios V2: categoria diferente continua disponível",()=>{
  const s=career(504);
  const p=proposal(s,"vertex");

  A.execute(s,"commercialAccept",{id:p.id});

  const c=E.Commercial.init(s,E);
  elevate(s,96,96);

  const tech=E.Commercial.brands.find(b=>b.id==="orbe");

  assert(
    E.Commercial.eligible(s,tech,E),
    "Samsung deveria estar elegível para jogador de elite"
  );

  assert(
    !E.Commercial.active(s).some(x=>x.category===tech.category),
    "Contrato esportivo não deve bloquear tecnologia"
  );
});

test("Patrocínios V2: marcas globais não aparecem para jogador iniciante",()=>{
  const s=career(505);

  elevate(s,12,14);

  const globals=E.Commercial.brands.filter(b=>b.tier==="GLOBAL");

  assert(globals.length>0);
  assert(
    globals.every(b=>!E.Commercial.eligible(s,b,E))
  );
});

test("Patrocínios V2: jogador de elite desbloqueia marcas globais",()=>{
  const s=career(506);

  elevate(s,98,98);

  for(const key of Object.keys(s.person.attrs))
    s.person.attrs[key]=95;

  s.nationalTeam.caps=30;

  const c=E.Commercial.init(s,E);
  c.popularity=98;
  E.Commercial.updateValue(s,E);

  const eliteBrands=["aureo","adidas","visa","mastercard","pulse"];

  assert(
    eliteBrands.some(id=>{
      const b=E.Commercial.brands.find(x=>x.id===id);
      return b&&E.Commercial.eligible(s,b,E);
    })
  );
});

test("Patrocínios V2: renovação fica agendada e nunca duplica contrato ativo",()=>{
  const s=career(507);
  const p=proposal(s,"vertex");

  A.execute(s,"commercialAccept",{id:p.id});

  const current=E.Commercial.active(s)[0];

  current.relationship=80;
  current.durationDays=200;
  current.endDay=s.day+25;

  E.Commercial.processContracts(s,E.Career,E);

  const renewal=s.commercial.proposals.find(p=>
    p.renewalOf===current.id &&
    p.status==="PROPOSTA"
  );

  assert(renewal);

  A.execute(s,"commercialAccept",{id:renewal.id});

  assert.equal(
    E.Commercial.active(s).filter(x=>x.brandId===current.brandId).length,
    1
  );

  const scheduled=s.commercial.contracts.find(x=>
    x.renewalOf===current.id &&
    x.status==="AGENDADO"
  );

  assert(scheduled);
  assert.equal(scheduled.startDay,current.endDay+1);
});

test("Patrocínios V2: valor das propostas respeita piso e teto de cada marca",()=>{
  const s=career(508);

  elevate(s,99,99);

  for(const key of Object.keys(s.person.attrs))
    s.person.attrs[key]=96;

  s.nationalTeam.caps=40;

  for(const b of E.Commercial.brands){
    const p=E.Commercial.eligible(s,b,E)
      ? (()=> {
          const c=E.Commercial.init(s,E);

          c.interests.push({
            brandId:b.id,
            stage:"NEGOCIAÇÃO",
            score:100,
            startedDay:s.day,
            updatedDay:s.day,
            ticks:4
          });

          s.day+=14;

          E.Commercial.progressInterests(
            s,
            new E.Random(s.rng),
            E.Career,
            E
          );

          return c.proposals.find(x=>
            x.brandId===b.id &&
            x.status==="PROPOSTA"
          );
        })()
      : null;

    if(!p)continue;

    assert(p.amount>=b.baseContractValue);
    assert(p.amount<=b.maxContractValue);
  }
});

test("Patrocínios V2: tiers possuem faixas coerentes",()=>{
  const ranges={
    LOCAL:[2000,15000*1.1],
    REGIONAL:[10000,40000*1.1],
    NATIONAL:[25000,120000*1.1],
    PREMIUM:[70000,300000*1.1],
    GLOBAL:[150000,1150000*1.1]
  };

  for(const b of E.Commercial.brands){
    const [min,max]=ranges[b.tier];
    assert(b.baseContractValue>=min);
    assert(b.maxContractValue<=max);
  }
});


// === REGRESSAO MIDIA E FREQUENCIA COMERCIAL ===

test("Patrocinios: no maximo uma nova proposta formal nasce por ciclo",()=>{
  const s=career(801);
  s.reputation=98;
  s.nationalTeam.caps=30;

  const c=elevate(s,98,98);

  const candidates=E.Commercial.brands.filter(b=>
    E.Commercial.eligible(s,b,E) &&
    !c.contracts.some(x=>
      x.status==="ATIVO" &&
      x.category===b.category &&
      (x.exclusive||b.exclusivity==="CATEGORY")
    )
  );

  const chosen=[];
  const categories=new Set();

  for(const b of candidates){
    if(categories.has(b.category))continue;
    categories.add(b.category);
    chosen.push(b);
    if(chosen.length===3)break;
  }

  assert(chosen.length>=3,"cenario precisa de ao menos 3 marcas elegiveis");

  for(const b of chosen){
    c.interests.push({
      brandId:b.id,
      stage:"NEGOCIA\u00c7\u00c3O",
      score:100,
      startedDay:s.day,
      updatedDay:s.day,
      ticks:4
    });
  }

  s.day+=14;

  E.Commercial.progressInterests(
    s,
    new E.Random(801),
    E.Career,
    E
  );

  assert.equal(
    c.proposals.filter(p=>p.status==="PROPOSTA").length,
    1
  );

  s.day+=14;

  E.Commercial.progressInterests(
    s,
    new E.Random(802),
    E.Career,
    E
  );

  assert.equal(
    c.proposals.filter(p=>p.status==="PROPOSTA").length,
    1,
    "cooldown de 28 dias deve impedir nova proposta apos apenas 14 dias"
  );

  s.day+=14;

  E.Commercial.progressInterests(
    s,
    new E.Random(803),
    E.Career,
    E
  );

  assert.equal(
    c.proposals.filter(p=>p.status==="PROPOSTA").length,
    2,
    "segunda proposta pode surgir apos completar o cooldown"
  );

  s.day+=28;

  E.Commercial.progressInterests(
    s,
    new E.Random(804),
    E.Career,
    E
  );

  assert.equal(
    c.proposals.filter(p=>p.status==="PROPOSTA").length,
    2,
    "nunca deve ultrapassar duas propostas formais abertas"
  );
});

test("Patrocinios: contrato assinado repercute nas noticias",()=>{
  const s=career(802);
  const p=proposal(s,"vertex");

  assert(p);

  A.execute(s,"commercialAccept",{id:p.id});

  const articles=E.Career.init(s).communications.articles||[];

  const news=articles.find(a=>
    String(a.eventId||"").startsWith("commercial:contract:article:") &&
    (
      String(a.title||"").includes(p.brand) ||
      String(a.body||"").includes(p.brand)
    )
  );

  assert(news,"contrato comercial assinado deve gerar noticia");
  assert(
    String(news.body||"").includes(
      Number(p.amount||0).toLocaleString("pt-BR")
    ),
    "noticia deve refletir o valor do acordo"
  );
});

test("Patrocinios: renovacao assinada repercute nas noticias",()=>{
  const s=career(803);
  const p=proposal(s,"vertex");

  assert(p);

  A.execute(s,"commercialAccept",{id:p.id});

  const current=E.Commercial.active(s)[0];

  current.relationship=85;
  current.durationDays=200;
  current.endDay=s.day+20;

  E.Commercial.processContracts(s,E.Career,E);

  const renewal=s.commercial.proposals.find(x=>
    x.renewalOf===current.id &&
    x.status==="PROPOSTA"
  );

  assert(renewal,"renovacao deveria ser criada");

  A.execute(s,"commercialAccept",{id:renewal.id});

  const articles=E.Career.init(s).communications.articles||[];

  assert(
    articles.some(a=>
      String(a.eventId||"").startsWith(
        "commercial:renewal:article:"
      ) &&
      (
        String(a.title||"").includes(renewal.brand) ||
        String(a.body||"").includes(renewal.brand)
      )
    ),
    "renovacao assinada deve gerar noticia"
  );
});
