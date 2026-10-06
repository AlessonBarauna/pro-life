const test=require("node:test");
const assert=require("node:assert/strict");

const D=require("../src/domain/engine.js");
const S=require("../src/infrastructure/save.js");

function hero(pos="ATA",seed=18300){
  const s=D.create({
    mode:"player",
    pos,
    age:20,
    points:{}
  },seed);

  D.movePlayerToClub(
    s,
    s.clubs[40].id
  );

  D.Training.init(s);

  return s;
}

function unlockAndActivate(s,id,level=20){
  const p=D.Training.init(s);
  p.archetypeLevel=level;

  D.Training.unlockArchetypePerk(
    s,
    id
  );

  D.Training.activateArchetypePerk(
    s,
    id
  );

  return p;
}

test("18B3: mudanca para perfil incompat?vel desativa perk antigo sem apagar desbloqueio",()=>{
  const s=hero("ATA",18301);

  unlockAndActivate(
    s,
    "finisherInstinct",
    20
  );

  assert.deepEqual(
    s.trainingPlan.activeArchetypePerks,
    ["finisherInstinct"]
  );

  s.person.pos="GOL";
  s.person.archetypeId="guardian";

  D.Training.init(s);
  s.trainingPlan.identity=null;
  D.Identity.init(s);

  D.Training.reconcileArchetypePerks(s);

  assert(
    s.trainingPlan.archetypePerks.includes(
      "finisherInstinct"
    )
  );

  assert.deepEqual(
    s.trainingPlan.activeArchetypePerks,
    []
  );
});

test("18B3: perk incompat?vel armazenado nunca produz bonus de partida",()=>{
  const s=hero("ATA",18302);

  s.trainingPlan.archetypePerks=[
    "wallDuel"
  ];

  s.trainingPlan.activeArchetypePerks=[
    "wallDuel"
  ];

  const bonus=
    D.Training.archetypePerkMatchBonus(
      s,
      {
        tackles:20,
        rating:9,
        minutes:90
      },
      100
    );

  assert.equal(
    bonus,
    0
  );
});

test("18B3: queda de nivel reduz perks ativos ao numero atual de slots",()=>{
  const s=hero("ATA",18303);
  const p=D.Training.init(s);

  p.archetypeLevel=10;

  D.Training.unlockArchetypePerk(
    s,
    "finisherInstinct"
  );

  D.Training.unlockArchetypePerk(
    s,
    "finisherSharpness"
  );

  D.Training.activateArchetypePerk(
    s,
    "finisherInstinct"
  );

  D.Training.activateArchetypePerk(
    s,
    "finisherSharpness"
  );

  assert.equal(
    p.activeArchetypePerks.length,
    2
  );

  p.archetypeLevel=9;

  D.Training.reconcileArchetypePerks(s);

  assert.equal(
    p.activeArchetypePerks.length,
    1
  );

  assert.deepEqual(
    p.activeArchetypePerks,
    ["finisherInstinct"]
  );

  assert.equal(
    p.archetypePerks.length,
    2
  );
});

test("18B3: reconciliacao e idempotente",()=>{
  const s=hero("ATA",18304);
  const p=D.Training.init(s);

  p.archetypeLevel=10;

  p.archetypePerks=[
    "finisherInstinct",
    "finisherInstinct",
    "finisherSharpness"
  ];

  p.activeArchetypePerks=[
    "finisherInstinct",
    "finisherInstinct",
    "finisherSharpness"
  ];

  D.Training.reconcileArchetypePerks(s);

  const once=JSON.stringify(
    s.trainingPlan
  );

  D.Training.reconcileArchetypePerks(s);

  assert.equal(
    JSON.stringify(s.trainingPlan),
    once
  );
});

test("18B3: ids invalidos e duplicados nao sobrevivem reconciliacao",()=>{
  const s=hero("ATA",18305);
  const p=D.Training.init(s);

  p.archetypeLevel=20;

  p.archetypePerks=[
    "INVALIDO",
    "finisherInstinct",
    "finisherInstinct"
  ];

  p.activeArchetypePerks=[
    "INVALIDO",
    "finisherInstinct",
    "finisherInstinct"
  ];

  D.Training.reconcileArchetypePerks(s);

  assert.deepEqual(
    p.archetypePerks,
    ["finisherInstinct"]
  );

  assert.deepEqual(
    p.activeArchetypePerks,
    ["finisherInstinct"]
  );
});

test("18B3: save reload preserva desbloqueios e reconcilia ativos",()=>{
  const s=hero("ATA",18306);

  unlockAndActivate(
    s,
    "finisherInstinct",
    20
  );

  s.trainingPlan.archetypePerks.push(
    "wallDuel"
  );

  s.trainingPlan.activeArchetypePerks.push(
    "wallDuel"
  );

  const restored=S.parse(
    JSON.stringify(s)
  );

  D.Training.init(restored);
  D.Identity.init(restored);
  D.Training.reconcileArchetypePerks(
    restored
  );

  assert(
    restored.trainingPlan.archetypePerks.includes(
      "finisherInstinct"
    )
  );

  assert(
    restored.trainingPlan.archetypePerks.includes(
      "wallDuel"
    )
  );

  assert.deepEqual(
    restored.trainingPlan.activeArchetypePerks,
    ["finisherInstinct"]
  );
});

test("18B3: perk desbloqueado pode ser reativado ao retornar para perfil compat?vel",()=>{
  const s=hero("ATA",18307);

  unlockAndActivate(
    s,
    "finisherInstinct",
    20
  );

  s.person.pos="GOL";
  s.person.archetypeId="guardian";
  D.Training.init(s);

  s.trainingPlan.identity=null;
  D.Identity.init(s);

  D.Training.reconcileArchetypePerks(s);

  assert.deepEqual(
    s.trainingPlan.activeArchetypePerks,
    []
  );

  s.person.pos="ATA";
  s.person.archetypeId="finisher";
  D.Training.init(s);

  s.trainingPlan.identity=null;
  D.Identity.init(s);

  D.Training.activateArchetypePerk(
    s,
    "finisherInstinct"
  );

  assert.deepEqual(
    s.trainingPlan.activeArchetypePerks,
    ["finisherInstinct"]
  );
});

test("18B3: consultar ativos efetivos respeita slots mesmo antes de reconciliar estado persistido",()=>{
  const s=hero("ATA",18308);
  const p=D.Training.init(s);

  p.archetypeLevel=9;

  p.archetypePerks=[
    "finisherInstinct",
    "finisherSharpness"
  ];

  p.activeArchetypePerks=[
    "finisherInstinct",
    "finisherSharpness"
  ];

  const active=
    D.Training.compatibleActiveArchetypePerks(
      s
    );

  assert.equal(
    active.length,
    1
  );

  assert.equal(
    active[0].id,
    "finisherInstinct"
  );
});

test("18B3: reconciliacao nao altera atributos nem overall",()=>{
  const s=hero("ATA",18309);
  const p=D.Training.init(s);

  p.archetypeLevel=20;

  p.archetypePerks=[
    "finisherInstinct"
  ];

  p.activeArchetypePerks=[
    "finisherInstinct"
  ];

  const attrs=JSON.stringify(
    s.person.attrs
  );

  const overall=
    D.overall(s.person);

  D.Training.reconcileArchetypePerks(s);

  assert.equal(
    JSON.stringify(s.person.attrs),
    attrs
  );

  assert.equal(
    D.overall(s.person),
    overall
  );
});

test("18B3: treinador permanece sem perks ativos apos reconciliacao",()=>{
  const s=D.create(
    {mode:"coach"},
    18310
  );

  const p=D.Training.init(s);

  p.archetypePerks=[
    "finisherInstinct"
  ];

  p.activeArchetypePerks=[
    "finisherInstinct"
  ];

  D.Training.reconcileArchetypePerks(s);

  assert.deepEqual(
    p.activeArchetypePerks,
    []
  );

  assert.deepEqual(
    D.Training.activeArchetypePerks(s),
    []
  );
});
