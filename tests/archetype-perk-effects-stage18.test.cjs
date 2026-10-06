const test=require("node:test");
const assert=require("node:assert/strict");

const D=require("../src/domain/engine.js");

function hero(pos="ATA",seed=18200){
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

function preparePerk(s,id,level=20){
  const plan=D.Training.init(s);
  plan.archetypeLevel=level;

  D.Training.unlockArchetypePerk(
    s,
    id
  );

  D.Training.activateArchetypePerk(
    s,
    id
  );

  return plan;
}

function match(s,o={}){
  const events=[];

  for(let i=0;i<(o.goals||0);i++){
    events.push({
      type:"goal",
      playerId:"hero"
    });
  }

  for(let i=0;i<(o.assists||0);i++){
    events.push({
      type:"goal",
      playerId:"mate",
      assistPlayerId:"hero"
    });
  }

  return {
    season:s.season,
    date:s.day+100,
    competitionId:"stage18b2",
    round:1,
    homeId:s.clubId,
    awayId:"rival",
    participants:[["hero"],[]],
    ratings:{
      hero:o.rating||7
    },
    playerStats:{
      hero:{
        minutes:o.minutes||90,
        tackles:o.tackles||0,
        saves:o.saves||0
      }
    },
    offensiveStats:{
      hero:{
        shots:o.shots||0,
        onTarget:o.onTarget||0,
        xg:o.xg||0
      }
    },
    events,
    hg:1,
    ag:o.conceded??1
  };
}

test("18B2: perk de treino correto concede somente o bonus configurado",()=>{
  const s=hero("ATA",18201);

  preparePerk(
    s,
    "finisherSharpness",
    10
  );

  const category={
    ...D.Training.trainingCategories.finishing,
    id:"finishing"
  };

  assert.equal(
    D.Training.archetypePerkTrainingMultiplier(
      s,
      category
    ),
    1.05
  );
});

test("18B2: perk de treino nao atua em categoria diferente",()=>{
  const s=hero("ATA",18202);

  preparePerk(
    s,
    "finisherSharpness",
    10
  );

  const category={
    ...D.Training.trainingCategories.passing,
    id:"passing"
  };

  assert.equal(
    D.Training.archetypePerkTrainingMultiplier(
      s,
      category
    ),
    1
  );
});

test("18B2: perk desbloqueado mas inativo nao produz efeito",()=>{
  const s=hero("ATA",18203);

  const p=D.Training.init(s);
  p.archetypeLevel=10;

  D.Training.unlockArchetypePerk(
    s,
    "finisherSharpness"
  );

  const category={
    ...D.Training.trainingCategories.finishing,
    id:"finishing"
  };

  assert.equal(
    D.Training.archetypePerkTrainingMultiplier(
      s,
      category
    ),
    1
  );
});

test("18B2: bonus combinado de perks possui teto de dez por cento",()=>{
  const s=hero("ATA",18204);

  const p=D.Training.init(s);

  p.archetypeLevel=50;

  p.archetypePerks=[
    "finisherInstinct",
    "ninePresence",
    "shadowCombination"
  ];

  p.activeArchetypePerks=[
    "finisherInstinct",
    "ninePresence",
    "shadowCombination"
  ];

  s.trainingPlan.identity=
    D.Identity.init(s);

  s.trainingPlan.identity.behavior.nine=100;
  s.trainingPlan.identity.behavior.shadow=100;

  const bonus=
    D.Training.archetypePerkMatchBonus(
      s,
      {
        goals:2,
        assists:1,
        rating:8,
        minutes:90
      },
      100
    );

  assert.ok(
    bonus<=10
  );
});

test("18B2: perk de gol exige pelo menos um gol",()=>{
  const s=hero("ATA",18205);

  preparePerk(
    s,
    "finisherInstinct",
    5
  );

  assert.equal(
    D.Training.archetypePerkMatchBonus(
      s,
      {
        goals:0,
        rating:8,
        minutes:90
      },
      20
    ),
    0
  );

  assert.equal(
    D.Training.archetypePerkMatchBonus(
      s,
      {
        goals:1,
        rating:8,
        minutes:90
      },
      20
    ),
    1
  );
});

test("18B2: perk de nota exige nota minima definida pelo dominio",()=>{
  const s=hero("ATA",18206);

  s.person.archetypeId="shadow";
  D.Training.init(s);
  s.trainingPlan.identity=null;
  D.Identity.init(s);

  preparePerk(
    s,
    "shadowMovement",
    5
  );

  assert.equal(
    D.Training.archetypePerkMatchBonus(
      s,
      {
        rating:7.1,
        minutes:90
      },
      20
    ),
    0
  );

  assert.equal(
    D.Training.archetypePerkMatchBonus(
      s,
      {
        rating:7.2,
        minutes:90
      },
      20
    ),
    1
  );
});

test("18B2: perk de minutos exige sessenta minutos",()=>{
  const s=hero("MEI",18207);

  s.person.archetypeId="engine";
  D.Training.init(s);
  s.trainingPlan.identity=null;
  D.Identity.init(s);

  preparePerk(
    s,
    "enginePresence",
    10
  );

  assert.equal(
    D.Training.archetypePerkMatchBonus(
      s,
      {
        minutes:59
      },
      20
    ),
    0
  );

  assert.equal(
    D.Training.archetypePerkMatchBonus(
      s,
      {
        minutes:60
      },
      20
    ),
    1
  );
});

test("18B2: perk incompat?vel armazenado nao produz efeito",()=>{
  const s=hero("ATA",18208);

  const p=D.Training.init(s);

  p.archetypePerks=[
    "wallDuel"
  ];

  p.activeArchetypePerks=[
    "wallDuel"
  ];

  assert.equal(
    D.Training.archetypePerkMatchBonus(
      s,
      {
        tackles:10,
        rating:8,
        minutes:90
      },
      100
    ),
    0
  );
});

test("18B2: treino alinhado ao arquetipo gera archetype XP",()=>{
  const s=hero("ATA",18209);

  const p=D.Training.init(s);

  p.exerciseId="boxFinish";

  const before=p.archetypeXp;

  const rng=new D.Random(s.rng);

  const result=D.Training.performTraining(
    s,
    rng,
    D
  );

  assert.equal(
    result.available,
    true
  );

  assert.ok(
    result.archetypeXp>0
  );

  assert.ok(
    p.archetypeXp>before
  );
});

test("18B2: treino fora do foco nao inventa archetype XP",()=>{
  const s=hero("ATA",18210);

  const p=D.Training.init(s);

  p.exerciseId="quickPass";

  const before=p.archetypeXp;

  const rng=new D.Random(s.rng);

  const result=D.Training.performTraining(
    s,
    rng,
    D
  );

  assert.equal(
    result.available,
    true
  );

  assert.equal(
    result.archetypeXp,
    0
  );

  assert.equal(
    p.archetypeXp,
    before
  );
});

test("18B2: perk de treino aumenta XP real da sessao sem mudar RNG",()=>{
  const a=hero("ATA",18211);
  const b=hero("ATA",18211);

  const pa=D.Training.init(a);
  const pb=D.Training.init(b);

  pa.exerciseId="boxFinish";
  pb.exerciseId="boxFinish";

  preparePerk(
    a,
    "finisherSharpness",
    10
  );

  const rngA=new D.Random(a.rng);
  const rngB=new D.Random(b.rng);

  const ra=D.Training.performTraining(
    a,
    rngA,
    D
  );

  const rb=D.Training.performTraining(
    b,
    rngB,
    D
  );

  assert.equal(
    ra.grade,
    rb.grade
  );

  assert.ok(
    Math.abs(
      ra.xp/rb.xp-1.05
    )<1e-9
  );

  assert.equal(
    rngA.state,
    rngB.state
  );
});

test("18B2: perk de partida aumenta XP somente quando gatilho ocorre",()=>{
  const a=hero("ATA",18212);
  const b=hero("ATA",18212);

  preparePerk(
    a,
    "finisherInstinct",
    5
  );

  const ra=D.Training.matchDevelopment(
    a,
    match(a,{
      goals:1,
      shots:3,
      onTarget:2,
      xg:0.7,
      rating:7.5
    }),
    D
  );

  const rb=D.Training.matchDevelopment(
    b,
    match(b,{
      goals:1,
      shots:3,
      onTarget:2,
      xg:0.7,
      rating:7.5
    }),
    D
  );

  assert.ok(
    ra.perkMatchBonus>0
  );

  assert.ok(
    ra.xp>rb.xp
  );
});

test("18B2: mesma partida sem gol nao aciona perk de finalizador",()=>{
  const a=hero("ATA",18213);
  const b=hero("ATA",18213);

  preparePerk(
    a,
    "finisherInstinct",
    5
  );

  const ra=D.Training.matchDevelopment(
    a,
    match(a,{
      goals:0,
      shots:3,
      onTarget:1,
      xg:0.4,
      rating:7.5
    }),
    D
  );

  const rb=D.Training.matchDevelopment(
    b,
    match(b,{
      goals:0,
      shots:3,
      onTarget:1,
      xg:0.4,
      rating:7.5
    }),
    D
  );

  assert.equal(
    ra.perkMatchBonus,
    0
  );

  assert.equal(
    ra.xp,
    rb.xp
  );
});

test("18B2: desbloquear e ativar perk nao altera atributos nem overall",()=>{
  const s=hero("ATA",18214);

  const attrs=JSON.stringify(
    s.person.attrs
  );

  const overall=
    D.overall(s.person);

  preparePerk(
    s,
    "finisherInstinct",
    5
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

test("18B2: treinador nunca recebe efeito de perk",()=>{
  const s=D.create(
    {mode:"coach"},
    18215
  );

  assert.equal(
    D.Training.archetypePerkTrainingMultiplier(
      s,
      {
        id:"finishing",
        attrs:["finish"]
      }
    ),
    1
  );

  assert.equal(
    D.Training.archetypePerkMatchBonus(
      s,
      {
        goals:5,
        rating:10,
        minutes:90
      },
      100
    ),
    0
  );
});
