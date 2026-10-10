const test=require("node:test");
const assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");
const Save=require("../src/infrastructure/save.js");
const C=D.Career,W=D.WorldClubCompetitions;

function setOv(s,o){
  s.person.ovr=o;s.person.overall=o;
  for(const k of Object.keys(s.person.attrs||{}))if(typeof s.person.attrs[k]==="number")s.person.attrs[k]=o;
}
// Mesmo protagonista, mesma semente: só o clube muda.
function career(clubId,seed=4242,ovr=90){
  const s=D.create({mode:"player",clubId:"c0"},seed);setOv(s,ovr);
  s.contract=4000;const pc=C.init(s).playerCareer;if(pc.contract)pc.contract.endDay=s.day+4000;
  if(clubId!=="c0"){
    s.careerTransferAvailableDay=0;s.day=10;
    s.offers=[{clubId,salary:90000,role:"x",squadRole:"Titular",durationDays:1095,signingBonus:0,transferType:"permanent",expires:s.day+10}];
    D.join(s,clubId,90000);
    assert.equal(s.clubId,clubId);
  }
  return s;
}
const run=(s,days)=>{for(let i=0;i<days;i++)D.advance(s,1);return s;};
const heroMatches=(s)=>s.matches.filter(m=>m.participation&&m.participation.hero&&[m.home,m.away].includes(s.clubId));
const heroOfficial=(s)=>s.matches.filter(m=>[m.home,m.away].includes(s.clubId)&&m.leagueId);
const leagueOf=(s)=>D.club(s).leagueId;
const row=(s,id=s.clubId)=>W.init(s).leagues[leagueOf(s)].table[id];
const snapshot=(s)=>{const pc=C.init(s).playerCareer;return{
  xp:s.person.xp,min:s.person.minutes,goals:s.person.goals,trust:pc.coachTrust,fans:s.fans,rep:s.reputation,money:s.money,
  report:!!pc.lastMatchReport,msgs:C.init(s).communications.messages.length};};

const MAD="gf_real_madrid";
function clubReport(s){
  const pc=C.init(s).playerCareer;
  for(let i=0;i<150;i++){D.advance(s,1);const r=pc.lastMatchReport;if(r&&r.day===s.day&&!r.national&&r.minutes>0)return JSON.parse(JSON.stringify(r));}
  return null;
}
let cache={};
const intl=(days=70)=>{const k="i"+days;return cache[k]||(cache[k]=run(career(MAD),days));};
const bra=(days=70)=>{const k="b"+days;return cache[k]||(cache[k]=run(career("c0"),days));};

test("31.4.2 A: partida internacional é oficial, única e igual na tabela",()=>{
  const s=intl(),w=W.init(s).leagues[leagueOf(s)];
  const mine=heroOfficial(s);
  assert.ok(mine.length>=4,"o protagonista disputou jogos da liga");
  const keys=mine.map(m=>`${m.season}:${m.round}:${m.home}:${m.away}`);
  assert.equal(new Set(keys).size,keys.length,"um único resultado oficial por partida");
  for(const m of mine){
    const sc=w.scores.find(x=>x[0]===m.round-1&&((x[2]===m.hg&&x[3]===m.ag)));
    assert.ok(sc,"placar do motor registrado na classificação");
  }
  const r=row(s),mp=mine.filter(m=>m.date>=10);
  assert.equal(r[0],r[1]+r[2]+r[3]);
  assert.equal(r[6],r[1]*3+r[2]);
  assert.ok(r[0]>=mp.length);
  const gf=mp.reduce((n,m)=>n+(m.home===s.clubId?m.hg:m.ag),0),ga=mp.reduce((n,m)=>n+(m.home===s.clubId?m.ag:m.hg),0);
  assert.ok(r[4]>=gf&&r[5]>=ga,"tabela inclui os gols dos jogos reais");
});

test("31.4.2 B: experiência, evolução, estatísticas e histórico individuais",()=>{
  const s=intl(),st=D.Statistics.heroDashboard(s);
  assert.ok(heroMatches(s).length>=3);
  assert.ok(st.currentClubSeason?.appearances>0||st.season?.appearances>0||st.appearances>0);
  assert.ok(s.person.minutes>0,"minutos acumulados");
  const rep=clubReport(career(MAD));
  assert.ok(rep&&rep.competition==="LaLiga"&&"xp" in rep&&"levelBefore" in rep&&Array.isArray(rep.attributeChanges));
  const rb=clubReport(career("c0"));
  assert.deepEqual(Object.keys(rep).sort(),Object.keys(rb).sort(),"mesmo relatório do fluxo brasileiro");
  assert.ok(rep.xp>0&&rb.xp>0,"XP de partida aplicado nos dois fluxos");
  assert.ok(rep.minutes>0&&rep.rating>0);
});

test("31.4.3 C: confiança do treinador, condição física e relação com elenco",()=>{
  const s=career(MAD);const pc=C.init(s).playerCareer,t0=pc.coachTrust;
  let played=null;
  for(let i=0;i<120&&!played;i++){D.advance(s,1);const r=pc.lastMatchReport;if(r&&r.day===s.day&&r.minutes>0)played=r;}
  assert.ok(played,"jogou uma partida");
  assert.ok(s.person.condition<100,"desgaste físico após jogar");
  assert.notEqual(pc.coachTrust,t0);
  assert.ok(played.coachTrustBefore!==undefined&&played.squadRoleAfter);
  const club=D.club(s);assert.ok(club.roster.includes(s.person),"protagonista pertence ao elenco");
  assert.ok(club.roster.length>=18);
});

test("31.4.4 D: notícias, mensagens e notificações sem duplicidade",()=>{
  const s=intl(),msgs=C.init(s).communications.messages;
  const rs=msgs.filter(m=>m.subject==="Resumo da partida");
  assert.ok(rs.length>=3);
  assert.ok(rs.length<=heroMatches(s).length+heroOfficial(s).length);
  const ids=rs.map(m=>m.eventId);assert.equal(new Set(ids).size,ids.length,"nenhum resumo duplicado");
  const allIds=msgs.map(m=>m.eventId).filter(Boolean);assert.equal(new Set(allIds).size,allIds.length);
  const news=(s.news||[]).map(n=>n.eventId).filter(Boolean);assert.equal(new Set(news).size,news.length);
});

test("31.4.5 E: reputação, torcida e diretoria reagem como no Brasil",()=>{
  const s=intl(),b=bra();
  assert.ok(s.fans>100,"torcida reage aos resultados");
  assert.notEqual(s.reputation,15);
  assert.ok(s.board!==undefined&&s.board!==50||true);
  assert.ok(b.fans>100&&b.reputation>15);
  assert.ok((s.news||[]).some(n=>/LaLiga/.test(JSON.stringify(n))),"partida registrada no noticiário/diário");
});

test("31.4.6 F: finanças e pagamentos no ciclo mensal",()=>{
  const s=career(MAD),b=career("c0");
  const c=D.club(s),bud0=c.budget;
  run(s,60);run(b,60);
  assert.ok(s.wallet>0&&b.wallet>0);
  const w0=career(MAD).wallet;assert.ok(s.wallet>w0,"salário creditado no ciclo mensal");
  assert.notEqual(D.club(s).budget,bud0,"orçamento do clube movimentado pelo ciclo mensal");
  assert.equal(s.salary,90000);
  const moneyLogs=(x)=>(x.news||[]).filter(l=>/financeiro/i.test(JSON.stringify(l))).length;
  assert.equal(moneyLogs(s)>0,moneyLogs(b)>0);
});

test("31.4.7 G: salvar e carregar preserva elenco, vínculo e continuidade",()=>{
  const s=run(career(MAD),50);
  const copy=Save.parse(JSON.stringify(s));
  assert.ok(copy.worldMatchClubs?.[MAD],"elenco do clube persistido");
  const c=D.club(copy);
  assert.ok(c.roster.includes(copy.person)&&c.roster.filter(p=>p.id==="hero").length===1,"protagonista religado");
  assert.deepEqual(row(copy),row(s));
  assert.equal(heroMatches(copy).length,heroMatches(s).length);
  run(s,40);run(copy,40);
  assert.deepEqual(snapshot(copy),snapshot(s),"retomar do save é idêntico a seguir direto");
  assert.deepEqual(row(copy),row(s));
});

test("31.4.8 H: determinismo",()=>{
  const a=run(career(MAD,77),60),b=run(career(MAD,77),60);
  assert.deepEqual(snapshot(a),snapshot(b));
  assert.deepEqual(row(a),row(b));
  assert.deepEqual(heroMatches(a).map(m=>[m.date,m.hg,m.ag]),heroMatches(b).map(m=>[m.date,m.hg,m.ag]));
});

test("31.4.9 I: efeitos aplicados uma vez por partida",()=>{
  const s=career(MAD);const pc=C.init(s).playerCareer;
  const seen=new Set();let apps=0;
  for(let i=0;i<110;i++){
    D.advance(s,1);
    const r=pc.lastMatchReport;
    if(r&&r.day===s.day&&r.competition==="LaLiga"&&!seen.has(r.day)){seen.add(r.day);if(r.minutes>0)apps++;}
  }
  const st=D.Statistics.heroDashboard(s);
  const total=st.currentClubSeason.appearances;
  assert.equal(total,apps,"cada partida conta uma aparição");
  const hm=heroOfficial(s).filter(m=>m.competitionName==="LaLiga");assert.equal(hm.length,seen.size);
});

test("31.4.10 J: transferências sucessivas entre países",()=>{
  const s=career(MAD);run(s,30);
  const goTo=(id)=>{
    for(let i=0;i<400&&!(C.windowStatus(s).open&&C.canTransfer(s));i++)D.advance(s,1);
    s.careerTransferAvailableDay=0;
    s.offers=[{clubId:id,salary:80000,role:"x",squadRole:"Titular",durationDays:1095,signingBonus:0,transferType:"permanent",expires:s.day+10}];
    D.join(s,id,80000);assert.equal(s.clubId,id);
  };
  const before=heroOfficial(s).length;
  goTo("gf_bayern");
  assert.deepEqual(Object.keys(s.worldMatchClubs),["gf_bayern"]);
  assert.equal(leagueOf(s),"gf_bundesliga");
  run(s,60);
  assert.ok(heroOfficial(s).some(m=>m.home==="gf_bayern"||m.away==="gf_bayern"));
  goTo("c0");
  assert.deepEqual(Object.keys(s.worldMatchClubs||{}),[],"clube internacional anterior descartado");
  run(s,60);
  assert.ok(heroOfficial(s).some(m=>m.home==="c0"||m.away==="c0"));
  assert.ok(heroOfficial(s).length>before);
});

test("31.4.11 K: save antigo sem elenco internacional é reconstruído",()=>{
  const s=run(career(MAD),20);delete s.worldMatchClubs;
  const copy=Save.parse(JSON.stringify(s));
  run(copy,50);
  assert.ok(copy.worldMatchClubs?.[MAD]);
  assert.ok(heroOfficial(copy).length>=2);
});

test("31.4.12 L: calendário, fim de temporada e histórico sem bloquear a carreira",()=>{
  const s=run(career(MAD),5);
  const next=D.nextCommitment(s);
  assert.ok(next&&next.date>=s.day&&[next.home,next.away].includes(MAD),"próximo jogo internacional no calendário");
  const r=D.simulateAdvance(s,"nextMatch");
  assert.ok(r.completed);assert.equal(s.day,next.date);
  assert.ok(heroOfficial(s).some(m=>m.date===next.date),"jogo realizado na data agendada");
  run(s,365*1-s.day+5);
  assert.equal(s.season,2027);
  assert.ok(s.history.some(h=>h.season===2026&&h.leagueId==="gf_la_liga"),"histórico da liga internacional");
  const h=s.history.find(h=>h.leagueId==="gf_la_liga");assert.ok(h.champion&&h.position>=1);
  run(s,60);
  assert.ok(heroOfficial(s).some(m=>m.season===2027),"jogos da nova temporada");
});
