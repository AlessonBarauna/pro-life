"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");
const Character=require("../src/domain/character.js");

require("../src/ui/creator.js");
const Creator=globalThis.ProLifeCreator;

function context(){
  const app={
    innerHTML:"",
    addEventListener(_type,handler){
      if(_type==="click") this._click=handler;
      if(_type==="change") this._change=handler;
    },
    removeEventListener(){}
  };
  const ctx={
    D,
    C:Character,
    $:selector=>selector==="#app"||selector===".wizard"?app:null,
    esc:value=>String(value??""),
    opt:()=>"",
    appearanceFields:()=>"",
    Charts:{radar:()=>""},
    avatar:()=>"",
    hasSaved:()=>false,
    classic:()=>{},
    confirmReplace:()=>true,
    onStart:()=>{},
    toast:message=>{throw Error(message)}
  };
  Creator.reset();
  Creator.mount(ctx);
  return {app,ctx};
}

function chooseStory(app,id){
  const previous=globalThis.window;
  globalThis.window={scrollTo(){}};
  try{
    app._click({
      target:{
        closest:()=>({dataset:{wStory:id}})
      }
    });
  }finally{
    if(previous===undefined) delete globalThis.window;
    else globalThis.window=previous;
  }
}

test("28F.1: criador inicia com os dados pessoais e visuais solicitados",()=>{
  context();
  const cfg=Creator.state().cfg;

  assert.deepEqual(
    {
      name:cfg.name,
      city:cfg.city,
      foot:cfg.foot,
      height:cfg.height,
      weight:cfg.weight
    },
    {
      name:"Alesson Baraúna",
      city:"Mogi das Cruzes",
      foot:"right",
      height:185,
      weight:72
    }
  );
  assert.deepEqual(cfg.appearance,{
    skin:"#bc8660",
    hairColor:"#241e1a",
    eyeColor:"#4a3524",
    hair:"highfade",
    beard:"goatee",
    body:"normal",
    accessory:"none",
    tattoo:"both"
  });
});

test("28F.1: história define idade e nascimento coerentes com 1/1/2026",()=>{
  const {app}=context();

  for(const id of ["academy","regional","comeback","hardRoad"]){
    chooseStory(app,id);
    const cfg=Creator.state().cfg;
    const expected=D.Training.origins[id].story.age;
    assert.equal(cfg.age,expected,id);
    assert.equal(cfg.birthDate,`${2026-expected}-01-01`,id);
  }
});

test("28F.1: trocar história preserva campos pessoais e aparência editados",()=>{
  const {app}=context();
  const cfg=Creator.state().cfg;
  cfg.name="Nome Manual";
  cfg.city="Cidade Manual";
  cfg.foot="left";
  cfg.height=191;
  cfg.weight=84;
  cfg.appearance={
    ...cfg.appearance,
    hair:"crew",
    beard:"full",
    tattoo:"left"
  };

  chooseStory(app,"comeback");
  const after=Creator.state().cfg;
  assert.equal(after.name,"Nome Manual");
  assert.equal(after.city,"Cidade Manual");
  assert.equal(after.foot,"left");
  assert.equal(after.height,191);
  assert.equal(after.weight,84);
  assert.equal(after.appearance.hair,"crew");
  assert.equal(after.appearance.beard,"full");
  assert.equal(after.appearance.tattoo,"left");
  assert.equal(after.age,D.Training.origins.comeback.story.age);
});

test("28F.1: novos padrões não alteram GER, potencial, reputação ou dificuldade da história",()=>{
  const {app}=context();
  chooseStory(app,"regional");
  const config=Creator.config();
  const seed=28401;
  const actual=D.create(config,seed);
  const baseline=D.create({
    mode:"player",
    origin:"regional",
    age:D.Training.origins.regional.story.age,
    pos:"ATA",
    points:{},
    creation:{difficulty:"normal",personality:"balanced"}
  },seed);

  assert.equal(D.overall(actual.person),D.overall(baseline.person));
  assert.equal(actual.person.potential,baseline.person.potential);
  assert.equal(actual.reputation,baseline.reputation);
  assert.equal(actual.creation.difficulty,baseline.creation.difficulty);
  assert.deepEqual(actual.person.attrs,baseline.person.attrs);
});
