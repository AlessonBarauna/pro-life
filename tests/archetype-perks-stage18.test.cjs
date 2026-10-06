const test=require("node:test");
const assert=require("node:assert/strict");

const D=require("../src/domain/engine.js");
const S=require("../src/infrastructure/save.js");

function hero(pos="ATA",seed=18100){
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

function level(s,n){
  const p=D.Training.init(s);
  p.archetypeLevel=n;
  return p;
}

test("18B1: existem 26 perks e todos apontam para arquetipos validos",()=>{
  const perks=Object.values(
    D.Training.archetypePerks
  );

  assert.equal(perks.length,26);

  assert.equal(
    new Set(perks.map(x=>x.id)).size,
    26
  );

  for(const perk of perks){
    assert(
      D.Training.archetypeCatalog[
        perk.archetype
      ],
      perk.id
    );

    assert.ok(
      ["match","training"].includes(
        perk.kind
      ),
      perk.id
    );

    assert.ok(
      perk.level>=1,
      perk.id
    );

    assert.ok(
      perk.value>0 &&
      perk.value<=0.10,
      perk.id
    );
  }
});

test("18B1: cada um dos 13 arquetipos possui exatamente dois perks",()=>{
  for(
    const id of Object.keys(
      D.Training.archetypeCatalog
    )
  ){
    const count=
      Object.values(
        D.Training.archetypePerks
      )
      .filter(x=>x.archetype===id)
      .length;

    assert.equal(
      count,
      2,
      id
    );
  }
});

test("18B1: save antigo recebe estado vazio sem inventar perks",()=>{
  const s=hero("ATA",18101);

  delete s.trainingPlan.archetypePerks;
  delete s.trainingPlan.activeArchetypePerks;

  const restored=S.parse(
    JSON.stringify(s)
  );

  const plan=
    D.Training.init(restored);

  assert.deepEqual(
    plan.archetypePerks,
    []
  );

  assert.deepEqual(
    plan.activeArchetypePerks,
    []
  );
});

test("18B1: slots crescem somente nos marcos definidos",()=>{
  const s=hero("ATA",18102);

  level(s,1);
  assert.equal(
    D.Training.archetypePerkSlots(s),
    1
  );

  level(s,9);
  assert.equal(
    D.Training.archetypePerkSlots(s),
    1
  );

  level(s,10);
  assert.equal(
    D.Training.archetypePerkSlots(s),
    2
  );

  level(s,19);
  assert.equal(
    D.Training.archetypePerkSlots(s),
    2
  );

  level(s,20);
  assert.equal(
    D.Training.archetypePerkSlots(s),
    3
  );

  level(s,50);
  assert.equal(
    D.Training.archetypePerkSlots(s),
    3
  );
});

test("18B1: nivel insuficiente impede desbloqueio",()=>{
  const s=hero("ATA",18103);

  s.person.archetypeId="finisher";
  D.Training.init(s);

  level(s,4);

  assert.throws(
    ()=>
      D.Training.unlockArchetypePerk(
        s,
        "finisherInstinct"
      ),
    /n\u00edvel de arqu\u00e9tipo 5/
  );
});

test("18B1: perfil incompat\u00edvel nao pode desbloquear perk",()=>{
  const s=hero("ATA",18104);

  level(s,50);

  assert.throws(
    ()=>
      D.Training.unlockArchetypePerk(
        s,
        "wallDuel"
      ),
    /n?o pertence/
  );
});

test("18B1: desbloqueio e idempotente e nao duplica",()=>{
  const s=hero("ATA",18105);

  level(s,10);

  D.Training.unlockArchetypePerk(
    s,
    "finisherInstinct"
  );

  D.Training.unlockArchetypePerk(
    s,
    "finisherInstinct"
  );

  assert.deepEqual(
    s.trainingPlan.archetypePerks,
    ["finisherInstinct"]
  );
});

test("18B1: perk bloqueado nao pode ser ativado",()=>{
  const s=hero("ATA",18106);

  level(s,20);

  assert.throws(
    ()=>
      D.Training.activateArchetypePerk(
        s,
        "finisherInstinct"
      ),
    /Desbloqueie/
  );
});

test("18B1: limite de slots e aplicado pelo dominio",()=>{
  const s=hero("ATA",18107);

  level(s,10);

  D.Training.unlockArchetypePerk(
    s,
    "finisherInstinct"
  );

  D.Training.unlockArchetypePerk(
    s,
    "finisherSharpness"
  );

  level(s,9);

  D.Training.activateArchetypePerk(
    s,
    "finisherInstinct"
  );

  assert.throws(
    ()=>
      D.Training.activateArchetypePerk(
        s,
        "finisherSharpness"
      ),
    /slots/
  );

  assert.deepEqual(
    s.trainingPlan.activeArchetypePerks,
    ["finisherInstinct"]
  );
});

test("18B1: segundo slot abre no nivel 10",()=>{
  const s=hero("ATA",18108);

  level(s,10);

  for(const id of [
    "finisherInstinct",
    "finisherSharpness"
  ]){
    D.Training.unlockArchetypePerk(
      s,
      id
    );

    D.Training.activateArchetypePerk(
      s,
      id
    );
  }

  assert.equal(
    s.trainingPlan.activeArchetypePerks.length,
    2
  );
});

test("18B1: desativar libera slot sem apagar desbloqueio",()=>{
  const s=hero("ATA",18109);

  level(s,10);

  D.Training.unlockArchetypePerk(
    s,
    "finisherInstinct"
  );

  D.Training.activateArchetypePerk(
    s,
    "finisherInstinct"
  );

  D.Training.deactivateArchetypePerk(
    s,
    "finisherInstinct"
  );

  assert(
    s.trainingPlan.archetypePerks.includes(
      "finisherInstinct"
    )
  );

  assert(
    !s.trainingPlan.activeArchetypePerks.includes(
      "finisherInstinct"
    )
  );
});

test("18B1: save reload preserva perks desbloqueados e ativos",()=>{
  const s=hero("ATA",18110);

  level(s,10);

  D.Training.unlockArchetypePerk(
    s,
    "finisherInstinct"
  );

  D.Training.activateArchetypePerk(
    s,
    "finisherInstinct"
  );

  const restored=S.parse(
    JSON.stringify(s)
  );

  D.Training.init(restored);

  assert.deepEqual(
    restored.trainingPlan.archetypePerks,
    ["finisherInstinct"]
  );

  assert.deepEqual(
    restored.trainingPlan.activeArchetypePerks,
    ["finisherInstinct"]
  );
});

test("18B1: ids invalidos de save sao descartados com seguranca",()=>{
  const s=hero("ATA",18111);

  s.trainingPlan.archetypePerks=[
    "finisherInstinct",
    "INVALIDO",
    "finisherInstinct"
  ];

  s.trainingPlan.activeArchetypePerks=[
    "INVALIDO",
    "finisherInstinct"
  ];

  D.Training.init(s);

  assert.deepEqual(
    s.trainingPlan.archetypePerks,
    ["finisherInstinct"]
  );

  assert.deepEqual(
    s.trainingPlan.activeArchetypePerks,
    ["finisherInstinct"]
  );
});

test("18B1: consultar perks disponiveis nao altera atributos nem overall",()=>{
  const s=hero("ATA",18112);

  level(s,50);

  const attrs=
    JSON.stringify(
      s.person.attrs
    );

  const overall=
    D.overall(s.person);

  const list=
    D.Training.availableArchetypePerks(s);

  assert.ok(
    list.length>=2
  );

  assert.equal(
    JSON.stringify(s.person.attrs),
    attrs
  );

  assert.equal(
    D.overall(s.person),
    overall
  );
});

test("18B1: carreira de treinador nao pode usar perks de jogador",()=>{
  const s=D.create(
    {mode:"coach"},
    18113
  );

  const plan=D.Training.init(s);

  assert.deepEqual(
    plan.archetypePerks,
    []
  );

  assert.deepEqual(
    plan.activeArchetypePerks,
    []
  );

  assert.equal(
    D.Training.archetypePerkSlots(s),
    0
  );

  assert.deepEqual(
    D.Training.availableArchetypePerks(s),
    []
  );

  assert.deepEqual(
    D.Training.activeArchetypePerks(s),
    []
  );

  assert.throws(
    ()=>
      D.Training.unlockArchetypePerk(
        s,
        "finisherInstinct"
      ),
    /carreira de jogador/
  );

  assert.throws(
    ()=>
      D.Training.activateArchetypePerk(
        s,
        "finisherInstinct"
      ),
    /carreira de jogador/
  );

  assert.throws(
    ()=>
      D.Training.deactivateArchetypePerk(
        s,
        "finisherInstinct"
      ),
    /carreira de jogador/
  );
});
