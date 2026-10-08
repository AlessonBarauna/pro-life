const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs");

test("browser loads international pool and World Cup before national team",()=>{
  const html=fs.readFileSync("index.html","utf8");

  const intl=html.indexOf(
    'src/domain/international-pool.js'
  );

  const wc=html.indexOf(
    'src/domain/world-cup.js'
  );

  const national=html.indexOf(
    'src/domain/national-team.js'
  );

  assert.ok(
    intl>=0,
    "international-pool.js deve ser carregado no browser"
  );

  assert.ok(
    wc>=0,
    "world-cup.js deve ser carregado no browser"
  );

  assert.ok(
    national>=0,
    "national-team.js deve continuar carregado"
  );

  assert.ok(
    intl<national,
    "international-pool.js deve carregar antes de national-team.js"
  );

  assert.ok(
    wc<national,
    "world-cup.js deve carregar antes de national-team.js"
  );
});
