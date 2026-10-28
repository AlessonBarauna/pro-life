const test=require("node:test"),assert=require("node:assert/strict");
const D=require("../src/domain/engine.js"),F=require("../src/domain/club-finance.js");
const make=()=>D.create({mode:"coach",catalogVersion:"fc27_v1",name:"T",city:"C",age:40,nationality:"Brasil",clubId:"gf_fc27_449"},3);
test("receita completa a reserva e o excedente vai para transferências",()=>{
  const s=make(),c=D.club(s,s.clubId),e=F.ensure(s,c),cap=F.reserveCap(c,s),b0=c.budget;
  const room=cap-e.reserve;
  F.income(s,c,"bilheteria",room+1000,"teste");
  assert.equal(e.reserve,cap);assert.equal(c.budget,b0+1000);
  assert.equal(e.ledger[0].category,"bilheteria");
});
test("despesa sai da reserva e depois do orçamento",()=>{
  const s=make(),c=D.club(s,s.clubId),e=F.ensure(s,c),b0=c.budget,r0=e.reserve;
  F.expense(s,c,"folha",r0+500,"teste");
  assert.equal(e.reserve,0);assert.equal(c.budget,b0-500);
});
test("moveFunds separa caixas sem criar dinheiro",()=>{
  const s=make(),c=D.club(s,s.clubId),e=F.ensure(s,c),total=c.budget+e.reserve;
  assert.equal(F.moveFunds(s,1000000).ok,true);
  assert.equal(c.budget+e.reserve,total);
  F.moveFunds(s,-999999999);assert.equal(e.reserve,0);assert.equal(c.budget+e.reserve,total);
});
test("save antigo sem clubFinance migra sem alterar o orçamento",()=>{
  const s=make(),c=D.club(s,s.clubId),b0=c.budget;delete s.clubFinance;
  const sm=F.summary(s);assert.equal(c.budget,b0);assert.ok(sm.wageReserve>0);assert.ok(sm.monthlyPayroll>0);
});
test("bilheteria por jogo em casa e fechamento mensal usa folha real",()=>{
  const s=make(),c=D.club(s,s.clubId),away=D.club(s,s.clubs.find(x=>x.id!==s.clubId).id);
  const m={hg:2,ag:0};const g=F.onMatch(s,m,c,away,{});
  assert.ok(g.attendance>0&&g.attendance<=g.capacity&&g.amount>0);assert.equal(m.gate,g.amount);
  const pay=F.payroll(c,s).players;const r=F.closeClub(s,c);
  assert.equal(r.detail.folha,-(pay+Math.round(0+(s.salary&&!F.payroll(c,s).hero?s.salary:0))));
  assert.ok(F.summary(s).months.length>=1);
});
test("clubes da IA também têm fechamento e um ano fica equilibrado",()=>{
  const s=make();const ai=s.globalFootball.clubs[7];const b0=ai.budget;
  for(let i=0;i<12;i++){s.day=(i+1)*30;F.monthlyClose(s);}
  assert.ok(ai.budget>=b0*.9&&ai.budget<=b0*1.3,`${b0} -> ${ai.budget}`);
});
test("novo patrocinador no meio da temporada só aparece com vaga e bom momento",()=>{
  const s=make();const c=D.club(s,s.clubId);c.stats={played:10,w:7,d:2,l:1,points:23,gf:20,ga:8};
  let found=null;for(let d=30;d<400&&!found;d+=30){s.day=d;found=F.maybeExtraSponsor(s);}
  if(found){assert.equal(found.role,"partner");assert.equal(found.status,"pending");}
});
test("loja do clube detalha camisas e outros produtos no mesmo caixa",()=>{
  const s=make(),c=D.club(s,s.clubId),before=F.summary(s);
  assert.equal(before.totalCash,before.transferBudget+before.wageReserve);
  assert.deepEqual(before.store.products.map(x=>x.id),["shirts","training","accessories","souvenirs"]);
  assert.equal(before.store.products.reduce((sum,x)=>sum+x.revenue,0),before.store.expectedMonthly);
  F.closeClub(s,c);
  const rows=F.summary(s).ledger.filter(x=>x.category==="camisas");
  assert.equal(rows.length,4);
  assert.ok(rows.every(x=>x.label.startsWith("Loja do clube")));
});
test("ampliar loja usa o caixa existente e aumenta a projeção sem criar dinheiro",()=>{
  const s=make(),c=D.club(s,s.clubId),entry=F.ensure(s,c),before=F.summary(s),level=before.store.level;
  c.budget=Math.max(c.budget,before.store.upgradeCost);
  const total=c.budget+entry.reserve,result=F.upgradeStore(s),after=F.summary(s);
  assert.equal(result.ok,true);assert.equal(after.store.level,level+1);
  assert.equal(c.budget+entry.reserve,total-result.cost);
  assert.ok(after.store.expectedMonthly>before.store.expectedMonthly);
});
test("movimentação externa entra no extrato sem reaplicar o valor",()=>{
  const s=make(),c=D.club(s,s.clubId),budget=c.budget;
  F.movement(s,c,"transferencia",-500000,"Contratação teste");
  assert.equal(c.budget,budget);
  assert.equal(F.summary(s).ledger[0].amount,-500000);
});
