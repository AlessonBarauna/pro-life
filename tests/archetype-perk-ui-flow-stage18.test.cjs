
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const D=require("../src/domain/engine.js");
const A=require("../src/application/game.js");
const S=require("../src/infrastructure/save.js");

const appSource=
  fs.readFileSync(
    path.join(
      __dirname,
      "../src/ui/app.js"
    ),
    "utf8"
  );

function hero(seed=18500){
  const s=D.create({
    mode:"player",
    pos:"ATA",
    age:20,
    points:{}
  },seed);

  D.movePlayerToClub(
    s,
    s.clubs[40].id
  );

  D.Training.init(s);

  s.person.archetypeId="finisher";
  D.Training.init(s);

  s.trainingPlan.archetypeLevel=10;

  return s;
}

function perkState(s,id){
  const plan=D.Training.init(s);

  return {
    unlocked:
      plan.archetypePerks.includes(id),

    active:
      plan.activeArchetypePerks.includes(id),

    slots:
      D.Training.archetypePerkSlots(s)
  };
}

test("18C3: fluxo desbloquear UI -> application -> domain altera estado real",()=>{
  const s=hero(18501);

  assert.deepEqual(
    perkState(
      s,
      "finisherInstinct"
    ),
    {
      unlocked:false,
      active:false,
      slots:2
    }
  );

  assert.match(
    appSource,
    /data-unlock-archetype-perk/
  );

  assert.match(
    appSource,
    /command\(\s*"unlockArchetypePerk"/
  );

  A.execute(
    s,
    "unlockArchetypePerk",
    {
      id:"finisherInstinct"
    }
  );

  assert.deepEqual(
    perkState(
      s,
      "finisherInstinct"
    ),
    {
      unlocked:true,
      active:false,
      slots:2
    }
  );
});

test("18C3: fluxo ativar ocupa exatamente um slot",()=>{
  const s=hero(18502);

  A.execute(
    s,
    "unlockArchetypePerk",
    {
      id:"finisherInstinct"
    }
  );

  assert.match(
    appSource,
    /data-activate-archetype-perk/
  );

  assert.match(
    appSource,
    /command\(\s*"activateArchetypePerk"/
  );

  A.execute(
    s,
    "activateArchetypePerk",
    {
      id:"finisherInstinct"
    }
  );

  assert.equal(
    s.trainingPlan.activeArchetypePerks.length,
    1
  );

  assert.equal(
    s.trainingPlan.activeArchetypePerks[0],
    "finisherInstinct"
  );
});

test("18C3: fluxo desativar libera slot mas preserva desbloqueio",()=>{
  const s=hero(18503);

  A.execute(
    s,
    "unlockArchetypePerk",
    {
      id:"finisherInstinct"
    }
  );

  A.execute(
    s,
    "activateArchetypePerk",
    {
      id:"finisherInstinct"
    }
  );

  assert.match(
    appSource,
    /data-deactivate-archetype-perk/
  );

  assert.match(
    appSource,
    /command\(\s*"deactivateArchetypePerk"/
  );

  A.execute(
    s,
    "deactivateArchetypePerk",
    {
      id:"finisherInstinct"
    }
  );

  assert.deepEqual(
    s.trainingPlan.activeArchetypePerks,
    []
  );

  assert.deepEqual(
    s.trainingPlan.archetypePerks,
    ["finisherInstinct"]
  );
});

test("18C3: ciclo completo desbloquear ativar desativar e reativar",()=>{
  const s=hero(18504);

  const id="finisherInstinct";

  A.execute(
    s,
    "unlockArchetypePerk",
    {id}
  );

  A.execute(
    s,
    "activateArchetypePerk",
    {id}
  );

  assert.equal(
    perkState(s,id).active,
    true
  );

  A.execute(
    s,
    "deactivateArchetypePerk",
    {id}
  );

  assert.equal(
    perkState(s,id).active,
    false
  );

  A.execute(
    s,
    "activateArchetypePerk",
    {id}
  );

  assert.equal(
    perkState(s,id).active,
    true
  );
});

test("18C3: dois perks ocupam dois slots no nivel 10",()=>{
  const s=hero(18505);

  for(const id of [
    "finisherInstinct",
    "finisherSharpness"
  ]){
    A.execute(
      s,
      "unlockArchetypePerk",
      {id}
    );

    A.execute(
      s,
      "activateArchetypePerk",
      {id}
    );
  }

  assert.equal(
    D.Training.archetypePerkSlots(s),
    2
  );

  assert.deepEqual(
    s.trainingPlan.activeArchetypePerks,
    [
      "finisherInstinct",
      "finisherSharpness"
    ]
  );
});

test("18C3: UI possui bloqueio visual quando todos os slots estao ocupados",()=>{
  assert.match(
    appSource,
    /const full = active\.length >= slots/
  );

  assert.match(
    appSource,
    /full \? "disabled" : ""/
  );
});

test("18C3: perk abaixo do nivel permanece indisponivel no dominio",()=>{
  const s=hero(18506);

  s.trainingPlan.archetypeLevel=4;

  assert.throws(
    ()=>
      A.execute(
        s,
        "unlockArchetypePerk",
        {
          id:"finisherInstinct"
        }
      ),
    /n\u00edvel de arqu\u00e9tipo 5/
  );
});

test("18C3: save reload preserva perk desbloqueado e ativo",()=>{
  const s=hero(18507);

  A.execute(
    s,
    "unlockArchetypePerk",
    {
      id:"finisherInstinct"
    }
  );

  A.execute(
    s,
    "activateArchetypePerk",
    {
      id:"finisherInstinct"
    }
  );

  const restored=
    S.parse(
      JSON.stringify(s)
    );

  D.Training.init(restored);
  D.Identity.init(restored);
  D.Training.reconcileArchetypePerks(
    restored
  );

  assert.deepEqual(
    restored.trainingPlan.archetypePerks,
    ["finisherInstinct"]
  );

  assert.deepEqual(
    restored.trainingPlan.activeArchetypePerks,
    ["finisherInstinct"]
  );
});

test("18C3: save reload continua permitindo desativar pelo command",()=>{
  const s=hero(18508);

  A.execute(
    s,
    "unlockArchetypePerk",
    {
      id:"finisherInstinct"
    }
  );

  A.execute(
    s,
    "activateArchetypePerk",
    {
      id:"finisherInstinct"
    }
  );

  const restored=
    S.parse(
      JSON.stringify(s)
    );

  A.execute(
    restored,
    "deactivateArchetypePerk",
    {
      id:"finisherInstinct"
    }
  );

  assert.deepEqual(
    restored.trainingPlan.activeArchetypePerks,
    []
  );

  assert.deepEqual(
    restored.trainingPlan.archetypePerks,
    ["finisherInstinct"]
  );
});

test("18C3: estado ativo produz efeito real de partida",()=>{
  const s=hero(18509);

  s.trainingPlan.archetypeLevel=5;

  A.execute(
    s,
    "unlockArchetypePerk",
    {
      id:"finisherInstinct"
    }
  );

  A.execute(
    s,
    "activateArchetypePerk",
    {
      id:"finisherInstinct"
    }
  );

  const bonus=
    D.Training.archetypePerkMatchBonus(
      s,
      {
        goals:1,
        assists:0,
        minutes:90,
        rating:7.5
      },
      100
    );

  assert.equal(
    bonus,
    5
  );
});

test("18C3: estado desativado deixa de produzir efeito real",()=>{
  const s=hero(18510);

  s.trainingPlan.archetypeLevel=5;

  A.execute(
    s,
    "unlockArchetypePerk",
    {
      id:"finisherInstinct"
    }
  );

  A.execute(
    s,
    "activateArchetypePerk",
    {
      id:"finisherInstinct"
    }
  );

  A.execute(
    s,
    "deactivateArchetypePerk",
    {
      id:"finisherInstinct"
    }
  );

  const bonus=
    D.Training.archetypePerkMatchBonus(
      s,
      {
        goals:1,
        minutes:90,
        rating:8
      },
      100
    );

  assert.equal(
    bonus,
    0
  );
});

test("18C3: carreira de treinador continua bloqueada na application",()=>{
  const s=D.create(
    {
      mode:"coach"
    },
    18511
  );

  assert.throws(
    ()=>
      A.execute(
        s,
        "unlockArchetypePerk",
        {
          id:"finisherInstinct"
        }
      ),
    /carreira de jogador/
  );

  assert.equal(
    D.Training.archetypePerkSlots(s),
    0
  );
});

test("18C3: UI protege arquitetura e nao chama mutacoes do dominio",()=>{
  const compact=
    appSource.replace(
      /\\s+/g,
      ""
    );

  for(const method of [
    "unlockArchetypePerk",
    "activateArchetypePerk",
    "deactivateArchetypePerk"
  ]){
    assert.equal(
      compact.includes(
        "D.Training."+
        method+
        "("
      ),
      false,
      method
    );
  }
});

test("18C3: painel possui estados necessarios para rerender",()=>{
  for(const text of [
    "BLOQUEADO",
    "DISPONÍVEL",
    "DESBLOQUEADO",
    "ATIVO"
  ]){
    assert.ok(
      appSource.includes(text),
      text
    );
  }
});

test("18C3: painel usa estado canonico do trainingPlan",()=>{
  assert.match(
    appSource,
    /plan\.archetypePerks/
  );

  assert.match(
    appSource,
    /activeArchetypePerks/
  );

  assert.match(
    appSource,
    /archetypePerkSlots/
  );

  assert.match(
    appSource,
    /availableArchetypePerks/
  );
});
