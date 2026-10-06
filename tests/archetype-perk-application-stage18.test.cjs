const test=require("node:test");
const assert=require("node:assert/strict");

const D=require("../src/domain/engine.js");
const A=require("../src/application/game.js");
const S=require("../src/infrastructure/save.js");

function hero(seed=18400){
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

  return s;
}

test("18C1: comando unlockArchetypePerk altera estado real do dominio",()=>{
  const s=hero(18401);

  s.trainingPlan.archetypeLevel=5;

  A.execute(
    s,
    "unlockArchetypePerk",
    {id:"finisherInstinct"}
  );

  assert.deepEqual(
    s.trainingPlan.archetypePerks,
    ["finisherInstinct"]
  );
});

test("18C1: comando activateArchetypePerk ocupa slot real",()=>{
  const s=hero(18402);

  s.trainingPlan.archetypeLevel=5;

  A.execute(
    s,
    "unlockArchetypePerk",
    {id:"finisherInstinct"}
  );

  A.execute(
    s,
    "activateArchetypePerk",
    {id:"finisherInstinct"}
  );

  assert.deepEqual(
    s.trainingPlan.activeArchetypePerks,
    ["finisherInstinct"]
  );

  assert.equal(
    D.Training.activeArchetypePerks(s)[0].id,
    "finisherInstinct"
  );
});

test("18C1: comando deactivateArchetypePerk libera slot sem apagar desbloqueio",()=>{
  const s=hero(18403);

  s.trainingPlan.archetypeLevel=5;

  A.execute(
    s,
    "unlockArchetypePerk",
    {id:"finisherInstinct"}
  );

  A.execute(
    s,
    "activateArchetypePerk",
    {id:"finisherInstinct"}
  );

  A.execute(
    s,
    "deactivateArchetypePerk",
    {id:"finisherInstinct"}
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

test("18C1: application respeita nivel minimo",()=>{
  const s=hero(18404);

  s.trainingPlan.archetypeLevel=4;

  assert.throws(
    ()=>
      A.execute(
        s,
        "unlockArchetypePerk",
        {id:"finisherInstinct"}
      ),
    /nível de arquétipo 5/
  );
});

test("18C1: application respeita limite de slots",()=>{
  const s=hero(18405);

  s.trainingPlan.archetypeLevel=10;

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

  s.trainingPlan.archetypeLevel=9;

  D.Training.reconcileArchetypePerks(s);

  assert.equal(
    s.trainingPlan.activeArchetypePerks.length,
    1
  );

  assert.throws(
    ()=>
      A.execute(
        s,
        "activateArchetypePerk",
        {id:"finisherSharpness"}
      ),
    /slots/
  );
});

test("18C1: id inexistente falha na application",()=>{
  const s=hero(18406);

  s.trainingPlan.archetypeLevel=50;

  assert.throws(
    ()=>
      A.execute(
        s,
        "unlockArchetypePerk",
        {id:"PERK_INEXISTENTE"}
      ),
    /inválido/
  );
});

test("18C1: treinador nao pode usar comandos de perk",()=>{
  const s=D.create(
    {mode:"coach"},
    18407
  );

  for(const command of [
    "unlockArchetypePerk",
    "activateArchetypePerk",
    "deactivateArchetypePerk"
  ]){
    assert.throws(
      ()=>
        A.execute(
          s,
          command,
          {id:"finisherInstinct"}
        ),
      /carreira de jogador/
    );
  }
});

test("18C1: save reload preserva alteracao feita pela application",()=>{
  const s=hero(18408);

  s.trainingPlan.archetypeLevel=5;

  A.execute(
    s,
    "unlockArchetypePerk",
    {id:"finisherInstinct"}
  );

  A.execute(
    s,
    "activateArchetypePerk",
    {id:"finisherInstinct"}
  );

  const restored=S.parse(
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

test("18C1: desbloqueio repetido continua idempotente",()=>{
  const s=hero(18409);

  s.trainingPlan.archetypeLevel=5;

  A.execute(
    s,
    "unlockArchetypePerk",
    {id:"finisherInstinct"}
  );

  A.execute(
    s,
    "unlockArchetypePerk",
    {id:"finisherInstinct"}
  );

  assert.deepEqual(
    s.trainingPlan.archetypePerks,
    ["finisherInstinct"]
  );
});

test("18C1: ativacao repetida nao consome slot adicional",()=>{
  const s=hero(18410);

  s.trainingPlan.archetypeLevel=5;

  A.execute(
    s,
    "unlockArchetypePerk",
    {id:"finisherInstinct"}
  );

  A.execute(
    s,
    "activateArchetypePerk",
    {id:"finisherInstinct"}
  );

  A.execute(
    s,
    "activateArchetypePerk",
    {id:"finisherInstinct"}
  );

  assert.deepEqual(
    s.trainingPlan.activeArchetypePerks,
    ["finisherInstinct"]
  );
});
