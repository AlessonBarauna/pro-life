"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),path=require("node:path");
require(path.join(__dirname,"../src/ui/club-crests-data.js"));
const C=require(path.join(__dirname,"../src/ui/club-crests.js"));
test("04E4: registry of 750 unique club ids",()=>{assert.equal(C.stats().total,750);assert.equal(new Set(global.ProLifeCrestData.map(x=>x.id)).size,750);});
test("04E4: verified assets only, offline fallback",()=>{const stats=C.stats();assert.equal(stats.verified+stats.pending,750);assert.ok(stats.verified>=0&&stats.verified<=750);assert.match(C.render("gf_fc27_131682"),/pl-club-crest--fallback/);assert.doesNotMatch(C.render("gf_fc27_131682"),/<img/);});
test("04E4: safely escapes labels and unknown clubs",()=>{assert.match(C.render("not-real"),/Escudo gen/);assert.equal(C.metadata("../hack"),null);assert.doesNotMatch(C.render("../hack"),/<img/);});
