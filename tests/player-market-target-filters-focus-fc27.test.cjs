"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs");
const src=fs.readFileSync("src/ui/target-club-selector.js","utf8");
const refresh=src.slice(src.indexOf("  function refresh("),src.indexOf("  function mount("));
test("atualização não substitui o formulário nem os controles",()=>{
 assert.match(refresh,/\.target-club-list/);
 assert.match(refresh,/\.target-club-count/);
 assert.doesNotMatch(refresh,/element\.outerHTML|element\.replaceWith|existingFilters\.replaceWith/);
});
test("filtros country league search mantêm escutas delegadas",()=>{
 assert.match(src,/\[data-target-club-country\]/);
 assert.match(src,/\[data-target-club-league\]/);
 assert.match(src,/\[data-target-club-search\]/);
 assert.match(src,/root\.document\.addEventListener\("input"/);
 assert.match(src,/root\.document\.addEventListener\("change"/);
});
