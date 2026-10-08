"use strict";
// Pre-etapa 26C: valida os 11 packs novos de forma isolada (ainda NAO registrados no build/loader).
const test=require("node:test");
const assert=require("node:assert/strict");
const path=require("node:path");
const fs=require("node:fs");
const CODES=["bel","aut","sui","sco","den","swe","nor","pol","rou","irl","ger3"];
const dir=path.join(__dirname,"..","src","data");
const packs=CODES.map(c=>require(path.join(dir,"global-football-eur-"+c+".js")));
// Codigos ja conhecidos pelo global-football.js (26B) + codigos novos que exigirao alias na integracao.
const KNOWN="ALB ALG ANG ARG ARM AUS AUT BEL BEN BFA BIH BOL BRA BUL CAN CHI CIV CMR COD COL CPV CRC CRO CUW CZE DEN ECU EGY ENG EQG ESP FIN FRA GAB GAM GEO GER GHA GRE GNB GUI HAI HON HUN IDN IRL IRN IRQ ISL ISR ITA JAM JOR JPN KOR KOS KSA LUX LVA LTU LBN MAR MEX MKD MLI MNE MOZ MAD MTN NED NGA NIR NOR NZL PAN PAR PER POL POR PUR QAT ROU RSA RUS SCO SEN SRB SUI SUR SVK SVN SWE TOG TRI TUN TUR UKR URU USA UZB VEN WAL ZAM ZIM CYP EST BDI FRO DOM".split(" ");
const PENDING="MDA BLR CGO COM GLP MLT MTQ PHI UGA KAZ GRN KEN GUY GRL TAN PAK SLE SSD LBY PLE SOM ERI SYR AZE RWA MWI SRI LIE".split(" ");
const norm=s=>String(s).toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g,"");
const slug=s=>norm(s);
const rows=[];
packs.forEach(p=>p.clubs.forEach(c=>c[5].forEach(r=>{const x=r.split("|");rows.push({pack:p.id,club:c[0],name:x[0],year:+x[1],cod:x[2],pos:x[3],ger:+x[4],pot:+x[5]});})));
test("26C: estrutura dos 11 packs",()=>{
  assert.equal(packs.length,11);
  assert.equal(new Set(packs.map(p=>p.id)).size,11);
  packs.forEach(p=>{assert.match(p.id,/^eur26c_/);assert.equal(p.league.length,5);assert.ok(p.league[4]>0);assert.ok(p.clubs.length>=10);});
});
test("26C: ids de clubes unicos e ligas coerentes",()=>{
  const ids=packs.flatMap(p=>p.clubs.map(c=>c[0]));
  assert.equal(new Set(ids).size,ids.length);
  assert.equal(new Set(packs.map(p=>p.league[0])).size,11);
  packs.forEach(p=>p.clubs.forEach(c=>{assert.equal(c.length,6);assert.ok(c[1]&&c[2]);assert.ok(c[3]>0&&c[4]>0);}));
});
test("26C: todo clube tem >=18 jogadores e >=1 goleiro",()=>{
  packs.forEach(p=>p.clubs.forEach(c=>{
    assert.ok(c[5].length>=18,p.id+"/"+c[0]+" tem "+c[5].length);
    assert.ok(c[5].some(r=>r.split("|")[3]==="GOL"),p.id+"/"+c[0]+" sem goleiro");
  }));
});
test("26C: linhas validas, sem placeholders e sem 'Universo internacional'",()=>{
  rows.forEach(r=>{
    assert.ok(r.name.length>=3,r.name);
    assert.ok(!/universo internacional|\b(gol|def|mei|ata)\s*\d+\b|jogador\s*\d+|clube\s/i.test(r.name),r.name);
    assert.ok(!/\d/.test(r.name),r.name);
    assert.ok(["GOL","DEF","MEI","ATA"].includes(r.pos),r.name);
    assert.ok(r.year>=1976&&r.year<=2010,r.name+" "+r.year);
    assert.ok(r.ger>=40&&r.ger<=90&&r.pot>=r.ger&&r.pot<=95,r.name);
    assert.match(r.cod,/^[A-Z]{3}$/);
    assert.ok(KNOWN.includes(r.cod)||PENDING.includes(r.cod),"codigo "+r.cod+" desconhecido");
  });
});
test("26C: nenhum jogador duplicado (nome normalizado + ano) nem id repetido",()=>{
  const k=rows.map(r=>norm(r.name)+"_"+r.year);
  assert.equal(new Set(k).size,k.length);
  const ids=rows.map(r=>"gf_p_"+slug(r.name)+"_"+r.year);
  assert.equal(new Set(ids).size,ids.length);
});
test("26C: sem sobreposicao com os packs 26B (quando presentes)",()=>{
  const b=new Set();
  ["eng","esp","ita","ger","fra","por","ned"].forEach(c=>{
    const f=path.join(dir,"global-football-eur-"+c+".js");
    if(!fs.existsSync(f))return;
    require(f).clubs.forEach(cl=>cl[5].forEach(r=>{const x=r.split("|");b.add(norm(x[0])+"_"+x[1]);}));
  });
  const clash=rows.filter(r=>b.has(norm(r.name)+"_"+r.year)).map(r=>r.name);
  assert.deepEqual(clash,[]);
});
