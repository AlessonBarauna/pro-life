const test=require("node:test");
const assert=require("node:assert/strict");

global.ProLifeCareer={
  init(s){
    s.extras ||= {};
    s.extras.playerCareer ||= {
      agencyState:{objectives:[]},
      marketState:{signedAgreement:null},
      contract:null
    };
    s.extras.communications ||= {events:[],articles:[]};
    s.extras.transfers ||= [];
    s.extras.legacy ||= {milestones:[]};
    return s.extras;
  },
  agencyState(s){ return this.init(s).playerCareer.agencyState; },
  matchObjectives(){ return [{id:"rating",label:"Nota m?nima 7,0",target:7}]; },
  legacySnapshot(){ return {tier:"Em constru??o",score:40,games:10,goals:3,assists:2,titles:0,awards:0,national:{caps:0,goals:0},clubs:["CRB"],biggestTransfer:null,milestones:[]}; }
};

global.ProLife={
  overall(){ return 65; },
  pendingActions(){ return []; },
  club(){ return {name:"CRB"}; }
};

global.ProLifeSquad={
  coachPromiseStatus(){ return null; },
  coachConversationStatus(){ return null; }
};

global.ProLifeUnexpectedEvents={
  recent(){ return []; }
};

const Story=require("../src/domain/story-hub.js");

function state(){
  return {
    mode:"player",
    day:100,
    season:2026,
    clubId:"crb",
    salary:10000,
    reputation:50,
    person:{name:"Jogador Teste"},
    statistics:{players:{hero:{appearances:4}}},
    extras:{
      playerCareer:{
        agencyState:{objectives:[]},
        marketState:{signedAgreement:null},
        contract:{clubId:"crb",endDay:300},
        personality:{history:[]}
      },
      communications:{events:[],articles:[]},
      transfers:[],
      legacy:{milestones:[]}
    },
    decisionConsequences:[]
  };
}

test("story hub is player-only",()=>{
  const s=state();
  s.mode="coach";
  const snap=Story.snapshot(s);
  assert.equal(snap.available,false);
  assert.deepEqual(snap.objectives,[]);
});

test("snapshot aggregates match objective",()=>{
  const snap=Story.snapshot(state());
  assert.ok(snap.objectives.some(x=>x.id==="match:rating"));
});

test("agency objective keeps canonical source",()=>{
  const s=state();
  s.extras.playerCareer.agencyState.objectives=[{
    id:"agency:test",
    kind:"PLAYTIME",
    title:"Ganhar espa?o",
    baseline:0,
    target:8,
    deadline:200,
    status:"ATIVO"
  }];
  const row=Story.agencyObjectives(s)[0];
  assert.equal(row.source,"agency");
  assert.equal(row.current,4);
  assert.equal(row.progress,50);
});

test("pending actions become urgent actionable objectives",()=>{
  const old=global.ProLife.pendingActions;
  global.ProLife.pendingActions=()=>[{
    id:"decision:x",
    type:"decision",
    title:"Responder decis?o",
    deadline:102,
    page:"life",
    anchor:"current-decision",
    priority:"URGENTE"
  }];
  const row=Story.pendingObjectives(state())[0];
  assert.equal(row.actionable,true);
  assert.equal(row.priority,"URGENTE");
  assert.equal(row.page,"life");
  global.ProLife.pendingActions=old;
});

test("contract in final year appears as career objective",()=>{
  const list=Story.careerObjectives(state());
  assert.ok(list.some(x=>x.category==="CONTRATO"));
});

test("timeline aggregates communication articles",()=>{
  const s=state();
  s.extras.communications.articles.push({
    id:"a1",
    day:90,
    season:2026,
    category:"JOGADOR",
    title:"Grande atua??o",
    body:"Jogador foi destaque."
  });
  const list=Story.timeline(s);
  assert.equal(list[0].title,"Grande atua??o");
});

test("timeline is newest first",()=>{
  const s=state();
  s.extras.communications.articles=[
    {id:"a1",day:80,season:2026,category:"JOGADOR",title:"Antigo",body:""},
    {id:"a2",day:95,season:2026,category:"JOGADOR",title:"Novo",body:""}
  ];
  const list=Story.timeline(s);
  assert.equal(list[0].title,"Novo");
});

test("milestones reuse legacy snapshot",()=>{
  const snap=Story.milestones(state());
  assert.equal(snap.tier,"Em constru??o");
  assert.ok(snap.items.some(x=>x.id==="goals"&&x.value===3));
});

test("snapshot does not create duplicate persistent objective state",()=>{
  const s=state();
  const before=JSON.stringify(s);
  Story.snapshot(s);
  assert.equal(JSON.stringify(s),before);
});

test("objectives are deduplicated by id",()=>{
  const s=state();
  const original=global.ProLifeCareer.matchObjectives;
  global.ProLifeCareer.matchObjectives=()=>[
    {id:"same",label:"A",target:1},
    {id:"same",label:"B",target:2}
  ];
  const list=Story.objectives(s).filter(x=>x.id==="match:same");
  assert.equal(list.length,1);
  global.ProLifeCareer.matchObjectives=original;
});
