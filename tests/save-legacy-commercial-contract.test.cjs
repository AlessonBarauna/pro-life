const test=require("node:test");
const assert=require("node:assert/strict");

global.ProLife={};

const Validator=require("../src/infrastructure/validate-expansion.js");

function baseState(){
  return {
    day:500,
    season:2027,
    clubs:[],
    person:{},
    extras:{},
    commercial:{
      popularity:10,
      followers:100,
      commercialValue:20000,
      exposure:10,
      interests:[],
      proposals:[],
      negotiations:[],
      contracts:[],
      payments:{},
      relations:{},
      events:[],
      history:[],
      milestones:[],
      processed:{},
      lastTick:-9999,
      lastFansSnapshot:100,
      revenue:0,
      bonusRevenue:0
    }
  };
}

test("legacy closed commercial contract with endDay before startDay is normalized",()=>{
  const s=baseState();

  s.commercial.contracts.push({
    id:"legacy:closed",
    brandId:"brand",
    brand:"Marca",
    category:"TECH",
    status:"ENCERRADO",
    amount:10000,
    startDay:300,
    endDay:250,
    relationship:60,
    replacedDay:320
  });

  assert.doesNotThrow(()=>{
    Validator.validate(s,()=>{throw new Error("INVALID");});
  });

  assert.equal(
    s.commercial.contracts[0].endDay,
    300
  );
});

test("invalid active commercial contract is still rejected",()=>{
  const s=baseState();

  s.commercial.contracts.push({
    id:"invalid:active",
    brandId:"brand",
    brand:"Marca",
    category:"TECH",
    status:"ATIVO",
    amount:10000,
    startDay:300,
    endDay:250,
    relationship:60
  });

  assert.throws(()=>{
    Validator.validate(s,()=>{throw new Error("INVALID");});
  });
});
