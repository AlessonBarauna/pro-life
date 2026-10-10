const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const D=require("../src/domain/engine.js");
const Save=require("../src/infrastructure/save.js");

const memo=new Map();
const make=(nationality,seed=777,extra={})=>{const k=JSON.stringify([nationality,seed,extra]);if(!memo.has(k))memo.set(k,mk(nationality,seed,extra));return structuredClone(memo.get(k));};
const mk=(nationality,seed=777,extra={})=>D.create({mode:"player",name:"Teste",nationality,pos:"ATA",age:19,origin:"blank",creation:{startMode:"offers"},...extra},seed);
const offerCountries=(s)=>(s.offers||[]).map(o=>D.club(s,o.clubId)?.country);
const NATIONS=["Espanha","Brasil","Portugal","Inglaterra","Argentina"];

test("31.5.2 (1) nacionalidade escolhida é registrada; padrão Brasil",()=>{
  for(const n of NATIONS)assert.equal(make(n).person.nationality,n);
  assert.equal(make(undefined).person.nationality,"Brasil");
  assert.equal(make("").person.nationality,"Brasil");
  assert.equal(make("Narnia").person.nationality,"Brasil");
  assert.equal(make("espanha").person.nationality,"Espanha","normalização tolera caixa");
});

test("31.5.2 (2) três propostas iniciais do país da nacionalidade",()=>{
  for(const n of NATIONS)for(const seed of (n==="Espanha"?[11,777]:[777])){
    const s=make(n,seed);
    assert.equal(s.offers.length,3,`${n}/${seed}: três propostas`);
    assert.deepEqual(offerCountries(s),[n,n,n],`${n}/${seed}: clubes do próprio país`);
    assert.equal(new Set(s.offers.map(o=>o.clubId)).size,3,"sem repetição");
  }
});

test("31.5.2 (3) três propostas espanholas reais (evidência)",()=>{
  const s=make("Espanha");
  const names=s.offers.map(o=>`${D.club(s,o.clubId).name} (${D.club(s,o.clubId).country}) ${o.salary}/mês ${o.durationDays}d`);
  console.log("Propostas espanholas:",names.join(" | "));
  assert.equal(names.length,3);
  assert.ok(s.offers.every(o=>o.salary>0&&o.durationDays>=365));
});

test("31.5.2 (4) fallback internacional quando o país não tem clubes",()=>{
  const s=make("Albânia");
  assert.equal(s.person.nationality,"Albânia");
  assert.equal(s.offers.length,3,"ainda recebe três propostas");
  assert.ok(offerCountries(s).every(c=>c&&c!=="Albânia"));
});

test("31.5.2 (5) realismo: GER baixo não recebe só elite; mesma seed repete",()=>{
  const a=mk("Espanha",5),b=mk("Espanha",5);
  assert.deepEqual(a.offers.map(o=>o.clubId),b.offers.map(o=>o.clubId));
  for(const o of a.offers)assert.ok(D.club(a,o.clubId).reputation<=90);
});

test("31.5.2 (6) escolha livre de clube mantém a nacionalidade",()=>{
  const br=D.create({mode:"player",name:"T",nationality:"Espanha",pos:"ATA",age:19,origin:"blank",creation:{startMode:"club"},clubId:"c0"},3);
  assert.equal(br.person.nationality,"Espanha");assert.equal(br.clubId,"c0");
  const es=D.create({mode:"player",name:"T",nationality:"Brasil",pos:"ATA",age:19,origin:"blank",creation:{startMode:"club"},clubId:"gf_real_madrid"},3);
  assert.equal(es.person.nationality,"Brasil");assert.equal(es.clubId,"gf_real_madrid");
});

test("31.5.2 (7) save/reload preserva nacionalidade e propostas; save antigo segue Brasil",()=>{
  const s=make("Espanha");
  const copy=Save.parse(JSON.stringify(s));
  assert.equal(copy.person.nationality,"Espanha");
  assert.deepEqual(copy.offers.map(o=>o.clubId),s.offers.map(o=>o.clubId));
  const old=make("Brasil");delete old.person.nationality;
  const back=Save.parse(JSON.stringify(old));
  assert.ok(!back.person.nationality||back.person.nationality==="Brasil");
  const kept=make("Portugal");const again=Save.parse(JSON.stringify(Save.parse(JSON.stringify(kept))));
  assert.equal(again.person.nationality,"Portugal","escolha válida não é sobrescrita");
});

test("31.5.2 (8) criador envia a nacionalidade escolhida ao D.create",()=>{
  const src=fs.readFileSync(path.join(__dirname,"../src/ui/creator.js"),"utf8");
  assert.match(src,/\.\.\.W\.cfg/,"config inclui o cfg com nacionalidade");
  assert.match(src,/\["name", "city", "nationality"/,"campo altera W.cfg.nationality");
  assert.match(src,/D\.create\(config\(false\), W\.seed\)/);
});

test("31.5.2 (9) carreira espanhola joga normalmente (regressão 31.4.2)",()=>{
  const s=mk("Espanha",91);const o=s.offers[0];
  s.careerTransferAvailableDay=0;
  D.join(s,o.clubId,o.salary);
  assert.equal(s.clubId,o.clubId);
  for(let i=0;i<60;i++)D.advance(s,1);
  assert.equal(s.person.nationality,"Espanha");
  assert.ok(s.matches.some(m=>[m.home,m.away].includes(s.clubId)&&m.participation),"disputou partidas");
});
