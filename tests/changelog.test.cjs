const test=require("node:test");const assert=require("node:assert/strict");
const C=require("../src/data/changelog.js");
globalThis.ProLifeChangelog=C;
const V=require("../src/ui/changelog-view.js");
test("novidades: entradas válidas, ids únicos e mais recente primeiro",()=>{
  const ids=C.ENTRIES.map(e=>e.id);assert.equal(new Set(ids).size,ids.length);
  for(const e of C.ENTRIES){assert.match(e.date,/^\d{4}-\d{2}-\d{2}$/);assert.ok(e.title&&e.items.length);
    for(const i of e.items){assert.ok(["novo","ajuste","correcao"].includes(i.t));assert.ok(i.x.length>10);}}
  const dates=C.ENTRIES.map(e=>e.date);assert.deepEqual(dates,[...dates].sort().reverse());
});
test("novidades: mostra só o que o jogador ainda não viu",()=>{
  const all=C.ENTRIES;
  assert.equal(V.unseen(all,all[0].id).length,0);
  assert.equal(V.unseen(all,all[2].id).length,2);
  assert.equal(V.unseen(all,null).length,Math.min(3,all.length));
});
