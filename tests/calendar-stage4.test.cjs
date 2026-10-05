const test=require("node:test"),assert=require("node:assert/strict");
const D=require("../src/domain/engine.js"),S=require("../src/infrastructure/save.js");

test("Etapa 4: classificação usa pontos, vitórias, saldo e gols",()=>{
  const s=D.create({world:"brazil2026",clubId:"c0"},4401), league=D.club(s).leagueId;
  const clubs=s.clubs.filter(c=>c.leagueId===league);
  for(const c of clubs)c.stats={points:0,played:0,w:0,d:0,l:0,gf:0,ga:0};
  clubs[0].stats={points:10,played:5,w:2,d:4,l:0,gf:9,ga:4};
  clubs[1].stats={points:10,played:5,w:3,d:1,l:1,gf:7,ga:3};
  assert.equal(D.table(s,league)[0].id,clubs[1].id);
});

test("Etapa 4: avançar até próximo jogo para antes da partida",()=>{
  const s=D.create({world:"brazil2026",clubId:"c0"},4402), next=D.nextCommitment(s);
  assert.ok(next&&next.date>s.day);
  const r=D.simulateAdvance(s,"nextCommitment");
  assert.equal(s.day,next.date-1);
  assert.equal(r.completed,true);
  assert.ok(!s.matches.some(m=>m.date===next.date&&[m.home,m.away].includes(s.clubId)));
});

test("Etapa 4: treino é bloqueado no dia de compromisso obrigatório",()=>{
  const s=D.create({world:"brazil2026",clubId:"c0"},4403), next=D.nextCommitment(s);
  s.day=next.date;
  assert.equal(D.Training.mandatoryCommitmentToday(s),true);
  assert.equal(D.Training.trainingAvailable(s),false);
});

test("Etapa 4: temporada completa preserva integridade, campeões e histórico",()=>{
  const s=D.create({world:"brazil2026",clubId:"c0"},4404), season=s.season;
  for(let i=0;i<365;i++) D.advance(s,1);
  assert.equal(s.season,season+1);
  const archived=(s.statistics?.seasons||[]).find(x=>x.season===season);
  assert.ok(archived,"temporada anterior deve estar arquivada");
  for(const league of s.leagues){
    const clubs=s.clubs.filter(c=>c.leagueId===league.id);
    assert.equal(clubs.length,20);
  }
  assert.ok((s.history||[]).some(h=>h.season===season));
  S.validate(s);
  const restored=S.parse(JSON.stringify(s));
  assert.equal(restored.season,s.season);
  assert.equal(restored.day,s.day);
  assert.deepEqual(restored.statistics?.seasons,s.statistics?.seasons);
  const audit=D.Competitions.integrity(restored);
  assert.equal(audit.issues.length,0);
});
