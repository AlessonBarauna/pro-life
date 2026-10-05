const test=require("node:test"),assert=require("node:assert/strict"),D=require("../src/domain/engine.js"),Codec=require("../src/infrastructure/codec.js"),Save=require("../src/infrastructure/save.js");
function make(seed=1010){return D.create({mode:"player",clubId:"c0"},seed)}
test("Etapa 10: nacionalidade define elegibilidade",()=>{const s=make();s.person.nationality="Argentina";assert.equal(D.NationalTeam.callup(s,D,()=>{}),false);assert.equal(s.nationalTeam.calledUp,false)});
test("Etapa 10: convocação depende de mérito e concorrência",()=>{const s=make();s.person.attrs=Object.fromEntries(Object.keys(s.person.attrs).map(k=>[k,35]));D.NationalTeam.callup(s,D,()=>{});assert.equal(s.nationalTeam.calledUp,false);s.person.attrs=Object.fromEntries(Object.keys(s.person.attrs).map(k=>[k,95]));s.reputation=95;D.NationalTeam.callup(s,D,()=>{});assert.equal(s.nationalTeam.calledUp,true);assert.ok(s.nationalTeam.positionCompetition.length)});
test("Etapa 10: convocação não garante titularidade",()=>{const s=make();s.person.attrs=Object.fromEntries(Object.keys(s.person.attrs).map(k=>[k,72]));s.reputation=90;D.NationalTeam.callup(s,D,()=>{});if(s.nationalTeam.calledUp)assert.ok(["Reserva","Rotação","Titular"].includes(s.nationalTeam.status))});
test("Etapa 10: estreia, primeiro gol, minutos e fadiga persistem",()=>{const s=make(33);s.person.attrs=Object.fromEntries(Object.keys(s.person.attrs).map(k=>[k,99]));s.reputation=99;D.NationalTeam.callup(s,D,()=>{});const before=s.person.condition;for(let i=0;i<8&&!s.nationalTeam.caps;i++)D.NationalTeam.play(s,new D.Random(s.rng),D,()=>{});assert.ok(s.nationalTeam.caps>=1);assert.ok(s.nationalTeam.minutes>0);assert.ok(s.person.condition<before);assert.ok(s.nationalTeam.debutDay!==null)});
test("Etapa 10: eliminatórias têm tabela de IA e classificação não é garantida",()=>{const s=make(44),r=new D.Random(s.rng);D.NationalTeam.ensureQualifiers(s,D.NationalTeam.init(s),r);const q=s.nationalTeam.qualifiers;assert.ok(q.table.length>=8);assert.ok(q.table.every(x=>x.played>0));assert.equal(new Set(q.table.map(x=>x.id)).size,q.table.length)});
test("Etapa 10: ciclo internacional não cria Copa Mundial anual",()=>{const s=make();const names=new Set();for(let y=0;y<8;y++){s.day=y*365+220;names.add(D.NationalTeam.competition(s,s.day))}assert.ok(names.has("Copa Mundial"));assert.ok(names.has("Copa Continental"));assert.ok(names.has("Eliminatórias"))});
test("Etapa 10: save/load preserva estado internacional",()=>{const s=make();s.person.attrs=Object.fromEntries(Object.keys(s.person.attrs).map(k=>[k,99]));s.reputation=99;D.NationalTeam.callup(s,D,()=>{});const raw=Codec.encode(s),r=Save.parse(raw);assert.deepEqual(r.nationalTeam,s.nationalTeam)});
test("Etapa 10: mesma seed produz mesma convocação e tabela",()=>{const a=make(777),b=make(777);for(const s of [a,b]){s.person.attrs=Object.fromEntries(Object.keys(s.person.attrs).map(k=>[k,85]));s.reputation=80;D.NationalTeam.callup(s,D,()=>{});D.NationalTeam.ensureQualifiers(s,s.nationalTeam,new D.Random(s.rng))}assert.deepEqual(a.nationalTeam,b.nationalTeam)});
test("Etapa 10 V2: convocação pertence somente à janela avaliada",()=>{const s=make(909);s.person.attrs=Object.fromEntries(Object.keys(s.person.attrs).map(k=>[k,99]));s.reputation=99;s.day=142;D.NationalTeam.init(s);assert.equal(D.NationalTeam.callup(s,D,()=>{}),true);const u=D.NationalTeam.upcoming(s);assert.equal(u[0].callupStatus,"Convocado");assert.equal(u[1].callupStatus,"Convocado");assert.equal(u[2].callupStatus,"Convocação ainda não definida")});
test("Etapa 10 V2: agenda sul-americana futura não usa México",()=>{const s=make(910);s.day=0;const n=D.NationalTeam.init(s);assert.equal(n.schedule.filter(m=>!m.played).some(m=>m.opponent==="México"),false);assert.ok(n.schedule.some(m=>m.opponent==="Bolívia"))});
test("Etapa 10 V2: papel internacional acompanha posição na concorrência",()=>{const s=make(911);s.person.attrs=Object.fromEntries(Object.keys(s.person.attrs).map(k=>[k,99]));s.reputation=99;D.NationalTeam.callup(s,D,()=>{});const c=s.nationalTeam.positionCompetition.find(x=>x.id==="hero");assert.ok(c);assert.equal(s.nationalTeam.status,c.rank<=2?"Titular":c.rank<=4?"Rotação":"Reserva")});


test("Etapa 10 V3: migração recompõe minutos internacionais pelo histórico", () => {
  const s=make();
  s.nationalTeam={matches:[{minutes:79},{minutes:86}],history:[],schedule:[],minutes:0};
  D.NationalTeam.init(s);
  assert.equal(s.nationalTeam.minutes,165);
});

test("Etapa 10 V3: fixture legado herda a decisão da janela correta", () => {
  const s=make();
  s.day=140;
  s.nationalTeam={matches:[],history:[],schedule:[{id:"149:Argentina",day:149,opponent:"Argentina",played:false}],callupDecisions:{"149":{calledUp:true,status:"Titular"}}};
  const n=D.NationalTeam.init(s);
  const fixture=n.schedule.find(x=>x.day===149&&x.opponent==="Argentina");
  assert.equal(fixture.windowDay,149);
  assert.equal(D.NationalTeam.fixtureCallupStatus(n,fixture),"Convocado");
});

test("Etapa 10 V3: concorrentes usam GER real no índice e não valor genérico 70", () => {
  const s=make();
  s.clubs[0].roster.push({id:"ata90",name:"Atacante 90",pos:"ATA",age:25,nationality:"Brasil",condition:100,morale:60,attrs:Object.fromEntries(Object.keys(s.person.attrs).map(k=>[k,90]))});
  const squad=D.NationalTeam.buildSquad(s,D);
  const rival=squad.find(x=>x.id==="ata90");
  assert.ok(rival);
  assert.ok(rival.overall>=85);
  assert.ok(rival.score>70);
});
