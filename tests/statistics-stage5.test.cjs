const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../src/domain/engine.js'),Save=require('../src/infrastructure/save.js');
function match(s, extra={}){return {season:s.season,date:s.day,home:s.clubId,away:s.clubs.find(c=>c.id!==s.clubId).id,competitionId:D.club(s).leagueId,round:s.round,participants:[["hero"],[]],ratings:{hero:8.5},playerStats:{hero:{tackles:2,saves:0}},offensiveStats:{hero:{shots:4,onTarget:3,xg:1.2}},events:[{type:'goal',playerId:'hero'},{type:'goal',playerId:'hero'},{type:'goal',playerId:'hero'},{type:'goal',playerId:'x',assistPlayerId:'hero'}],hg:3,ag:1,...extra};}
test('Etapa 5: uma partida real só é registrada uma vez e gera marco/hat-trick',()=>{const s=D.create({clubId:'c0'},5501),m=match(s);assert.equal(D.Statistics.recordMatch(s,m),true);assert.equal(D.Statistics.recordMatch(s,m),false);const d=D.Statistics.careerInsights(s);assert.equal(d.career.appearances,1);assert.equal(d.career.goals,3);assert.equal(d.career.assists,1);assert.equal(d.records.hatTricks,1);assert.ok(d.milestones.some(x=>x.id==='first-game'));assert.ok(d.milestones.some(x=>x.id==='first-goal'));});
test('Etapa 5: temporada fecha matematicamente com competições',()=>{const s=D.create({clubId:'c0'},5502);D.Statistics.recordMatch(s,match(s));const a=D.Statistics.consistencyAudit(s);assert.equal(a.ok,true,a.issues.join('; '));});
test('Etapa 5: reload preserva recordes, marcos e fonte canônica',()=>{const s=D.create({clubId:'c0'},5503);D.Statistics.recordMatch(s,match(s));const restored=Save.parse(JSON.stringify(s)),d=D.Statistics.careerInsights(restored);assert.equal(d.career.goals,3);assert.equal(d.records.mostGoalsMatch,3);assert.equal(d.milestones.filter(x=>x.id==='first-goal').length,1);});
test('Etapa 5: Seleção fica separada e total profissional soma clubes + Seleção',()=>{const s=D.create({clubId:'c0'},5504);D.Statistics.recordMatch(s,match(s));s.nationalTeam.caps=4;s.nationalTeam.goals=2;s.nationalTeam.assists=1;const d=D.Statistics.careerInsights(s);assert.equal(d.professional.appearances,d.career.appearances+4);assert.equal(d.professional.goals,d.career.goals+2);assert.equal(d.professional.assists,d.career.assists+1);});


test("save local usa apenas o slot como copia completa e migra legado", () => {
  const storage = new Map();

  global.localStorage = {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
      storage.set(key, String(value));
    },
    removeItem(key) {
      storage.delete(key);
    }
  };

  delete require.cache[require.resolve("../src/infrastructure/save.js")];
  const SaveLocal = require("../src/infrastructure/save.js");

  const s = D.create({ clubId: "c0" }, 8821);

  const id = SaveLocal.saveAsNew(s);

  assert.ok(id, "saveAsNew deve criar um slot");
  assert.ok(
    storage.get("prolife.v1.slot." + id),
    "carreira deve existir no slot"
  );

  assert.equal(
    storage.has("prolife.v1.save"),
    false,
    "novo save nao deve manter segunda copia completa no KEY legado"
  );

  s.person.goals = Number(s.person.goals || 0) + 1;

  assert.equal(SaveLocal.save(s), true);

  const restored = SaveLocal.loadSlot(id);

  assert.ok(restored);
  assert.equal(restored.person.goals, s.person.goals);

  assert.equal(
    storage.has("prolife.v1.save"),
    false,
    "autosave nao deve recriar a copia legada"
  );

  delete global.localStorage;
});

test("save legado migra para slot e remove copia antiga somente apos sucesso", () => {
  const storage = new Map();

  global.localStorage = {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
      storage.set(key, String(value));
    },
    removeItem(key) {
      storage.delete(key);
    }
  };

  delete require.cache[require.resolve("../src/infrastructure/save.js")];
  const SaveLocal = require("../src/infrastructure/save.js");

  const legacy = D.create({ clubId: "c0" }, 8822);

  storage.set(
    "prolife.v1.save",
    JSON.stringify(legacy)
  );

  const slots = SaveLocal.listSlots();

  assert.equal(slots.length, 1);
  assert.equal(slots[0].id, "career_legacy");

  assert.ok(
    storage.get("prolife.v1.slot.career_legacy"),
    "save legado deve existir no novo slot"
  );

  assert.equal(
    storage.has("prolife.v1.save"),
    false,
    "copia legada deve ser removida depois da migracao"
  );

  const restored = SaveLocal.loadSlot("career_legacy");

  assert.ok(restored);
  assert.equal(restored.person.name, legacy.person.name);

  delete global.localStorage;
});
