"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const Coach=require("../src/domain/coach-career.js");
const save={mode:"coach",day:100};
const small={id:"a",leagueId:"brasileirao",strength:75,budget:100000000,roster:Array(24).fill({})};
const big={id:"b",leagueId:"laliga",strength:96,roster:Array(24).fill({})};
test("elite player has very low interest in weaker destination",()=>{
 const x=Coach.inquiryAssessment(save,small,big,{age:28,overall:86,salary:3000000,contractEndDay:1000});
 assert.ok(x.playerScore<=12,JSON.stringify(x));
});
test("age, short contract and similar leagues improve interest",()=>{
 const x=Coach.inquiryAssessment(save,small,big,{age:28,overall:86,contractEndDay:1000});
 const y=Coach.inquiryAssessment(save,{...small,leagueId:"laliga",strength:90},{...big,strength:85},{age:34,overall:75,contractEndDay:140});
 assert.ok(y.playerScore>x.playerScore);
});
