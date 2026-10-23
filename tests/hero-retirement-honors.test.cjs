"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const RR=require("../src/domain/retirement-rules.js");
test("limites de idade: linha 42, goleiro 45",()=>{assert.equal(RR.hardCap("ATA"),42);assert.equal(RR.hardCap("GOL"),45);});
test("chance de aposentadoria cresce com a idade",()=>{
  const c=a=>RR.chance({age:a,pos:"MEI"},{ovr:70,peak:75,level:70,starter:true,freeSeasons:0,motive:0});
  assert.ok(c(31)<c(35)&&c(35)<c(39)&&c(39)<=1);
});
