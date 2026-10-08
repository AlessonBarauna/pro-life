const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs");
const vm=require("vm");

const html=
  fs.readFileSync(
    "index.html",
    "utf8"
  );

const app=
  fs.readFileSync(
    "src/ui/app.js",
    "utf8"
  );

test("browser loads 2026 squads before World Cup engine",()=>{
  const squads=
    html.indexOf(
      "src/domain/world-cup-squads-2026.js"
    );

  const wc=
    html.indexOf(
      "src/domain/world-cup.js"
    );

  assert.ok(squads>=0);
  assert.ok(wc>=0);
  assert.ok(squads<wc);
});

test("squad database exposes 48 teams in browser-like context",()=>{
  const code=
    fs.readFileSync(
      "src/domain/world-cup-squads-2026.js",
      "utf8"
    );

  const context={
    globalThis:{}
  };

  context.globalThis=
    context;

  vm.runInNewContext(
    code,
    context
  );

  assert.ok(
    context.ProLifeWorldCupSquads2026
  );

  assert.equal(
    context.ProLifeWorldCupSquads2026.teams.length,
    48
  );

  assert.equal(
    context.ProLifeWorldCupSquads2026.totalPlayers,
    1248
  );
});

test("old Brazil-only World Cup squad block is no longer rendered",()=>{
  assert.equal(
    app.includes(
      "${wcBrazilSquadHtml}"
    ),
    false
  );
});

test("FC26 squad hub consumes browser squad database",()=>{
  assert.ok(
    app.includes(
      "window.ProLifeWorldCupSquads2026"
    )
  );

  assert.ok(
    app.includes(
      "fc26-squad-hub"
    )
  );
});
