const test=require("node:test");
const assert=require("node:assert/strict");

const D=require("../src/domain/engine.js");
const Save=require("../src/infrastructure/save.js");

function hero(pos="ATA",seed=1801){
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

test("18A: catalogo possui exatamente 13 arquetipos unicos",()=>{
  const list=Object.values(
    D.Training.archetypeCatalog
  );

  assert.equal(list.length,13);

  assert.equal(
    new Set(list.map(x=>x.id)).size,
    13
  );

  for(const a of list){
    assert(a.id);
    assert(a.name);
    assert(a.description);
    assert(Array.isArray(a.positions));
    assert(a.positions.length>0);
    assert(Array.isArray(a.focus));
    assert(a.focus.length>=4);
    assert(Array.isArray(a.weak));
    assert(Array.isArray(a.xpActions));
  }
});

test("18A: dez arquetipos anteriores continuam existentes",()=>{
  const ids=[
    "guardian",
    "wall",
    "builder",
    "engine",
    "maestro",
    "dribbler",
    "finisher",
    "nine",
    "winger",
    "fullback"
  ];

  for(const id of ids){
    assert(
      D.Training.archetypeCatalog[id],
      id
    );
  }
});

test("18A: defaults antigos permanecem inalterados",()=>{
  assert.deepEqual(
    D.Training.defaultArchetypeId,
    {
      GOL:"guardian",
      DEF:"wall",
      MEI:"maestro",
      ATA:"finisher"
    }
  );
});

test("18A: novos arquetipos respeitam posicoes",()=>{
  assert.deepEqual(
    D.Training.archetypeCatalog.sweeper.positions,
    ["GOL"]
  );

  assert.deepEqual(
    D.Training.archetypeCatalog.anchor.positions,
    ["DEF","MEI"]
  );

  assert.deepEqual(
    D.Training.archetypeCatalog.shadow.positions,
    ["ATA","MEI"]
  );

  assert(
    D.Identity.compatible("GOL").includes("sweeper")
  );

  assert(
    D.Identity.compatible("DEF").includes("anchor")
  );

  assert(
    D.Identity.compatible("MEI").includes("anchor")
  );

  assert(
    D.Identity.compatible("ATA").includes("shadow")
  );
});

test("18A: cada novo arquetipo possui tres especializacoes",()=>{
  const specs=Object.values(
    D.Training.archetypeSpecializations
  );

  for(const id of [
    "sweeper",
    "anchor",
    "shadow"
  ]){
    assert.equal(
      specs.filter(x=>x.archetype===id).length,
      3,
      id
    );
  }
});

test("18A: identidade antiga migra para versao 2 sem apagar historico",()=>{
  const s=hero("ATA",1802);

  const id=D.Identity.init(s);

  id.version=1;
  id.matches=37;
  id.sessions=12;
  id.history=[
    {
      season:s.season,
      day:s.day,
      match:20,
      from:"finisher",
      to:"nine"
    }
  ];

  delete id.behavior.shadow;

  const restored=Save.parse(
    JSON.stringify(s)
  );

  const migrated=
    D.Identity.init(restored);

  assert.equal(
    migrated.version,
    2
  );

  assert.equal(
    migrated.matches,
    37
  );

  assert.equal(
    migrated.sessions,
    12
  );

  assert.equal(
    migrated.history.length,
    1
  );

  assert(
    Number.isFinite(
      migrated.behavior.shadow
    )
  );
});

test("18A: migracao nao inventa afinidade fora da posicao rastreada",()=>{
  const s=hero("GOL",1803);

  const id=D.Identity.init(s);

  assert(
    Number.isFinite(
      id.behavior.guardian
    )
  );

  assert(
    Number.isFinite(
      id.behavior.sweeper
    )
  );

  assert.equal(
    id.behavior.shadow,
    undefined
  );

  assert.equal(
    id.behavior.anchor,
    undefined
  );
});

test("18A: novo arquetipo pode ser principal sem alterar atributos sozinho",()=>{
  const s=hero("ATA",1804);

  const before=
    JSON.parse(
      JSON.stringify(s.person.attrs)
    );

  s.person.archetypeId="shadow";

  D.Training.init(s);

  s.trainingPlan.identity=null;

  const profile=
    D.Identity.profile(s);

  assert.equal(
    profile.primary,
    "shadow"
  );

  assert.deepEqual(
    s.person.attrs,
    before
  );
});

test("18A: arquetipo incompat?vel e normalizado pelo dominio",()=>{
  const s=hero("GOL",1805);

  s.person.archetypeId="shadow";

  D.Training.init(s);

  assert.equal(
    s.person.archetypeId,
    "guardian"
  );
});

test("18A: novos sinais sao deterministas",()=>{
  const a=hero("ATA",1806);
  const b=hero("ATA",1806);

  a.person.archetypeId="shadow";
  b.person.archetypeId="shadow";

  a.trainingPlan.identity=null;
  b.trainingPlan.identity=null;

  D.Identity.init(a);
  D.Identity.init(b);

  const metrics={
    goals:1,
    assists:1,
    minutes:90,
    tackles:0,
    saves:0,
    cleanSheet:0,
    rating:8,
    shots:4,
    onTarget:2,
    xg:0.8
  };

  D.Identity.onMatch(a,metrics);
  D.Identity.onMatch(b,metrics);

  assert.deepEqual(
    D.Identity.profile(a),
    D.Identity.profile(b)
  );
});

test("18A: novas especializacoes nao ignoram requisitos",()=>{
  const s=hero("ATA",1807);

  s.person.archetypeId="shadow";
  s.trainingPlan.identity=null;

  D.Identity.init(s);

  s.trainingPlan.specializationPoints=10;

  assert.throws(
    ()=>
      D.Training.unlockSpecialization(
        s,
        "supportStriker"
      ),
    /Requisito/
  );
});

test("18A: save reload preserva novo arquetipo e identidade",()=>{
  const s=hero("MEI",1808);

  s.person.archetypeId="anchor";
  D.Training.init(s);

  s.trainingPlan.identity=null;
  D.Identity.init(s);

  const loaded=Save.parse(
    JSON.stringify(s)
  );

  assert.equal(
    loaded.person.archetypeId,
    "anchor"
  );

  assert.equal(
    D.Training.init(loaded)
      .archetype.id,
    "anchor"
  );

  assert.equal(
    D.Identity.init(loaded).version,
    2
  );
});
