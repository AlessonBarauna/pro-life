"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const Live=require("../src/ui/live-match.js");
test("placar ao vivo revela somente gols ocorridos ate o minuto atual",()=>{const m={events:[{minute:12,type:"goal",side:0},{minute:67,type:"goal",side:1},{minute:88,type:"goal",side:0}]};assert.deepEqual(Live.scoreAt(m,11),[0,0]);assert.deepEqual(Live.scoreAt(m,12),[1,0]);assert.deepEqual(Live.scoreAt(m,70),[1,1]);assert.deepEqual(Live.scoreAt(m,94),[2,1]);});
