const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs");

const src=
  fs.readFileSync(
    "src/ui/app.js",
    "utf8"
  );

test("national competition details are initialized after World Cup HTML",()=>{
  const wc=
    src.indexOf(
      "const worldCupHtml="
    );

  const details=
    src.indexOf(
      "const nationalCompetitionDetailsHtml="
    );

  const ret=
    src.indexOf(
      'return \`<nav class="subnav national-tabs"'
    );

  assert.ok(
    wc>=0,
    "worldCupHtml ausente"
  );

  assert.ok(
    details>wc,
    "nationalCompetitionDetailsHtml ainda esta antes de worldCupHtml"
  );

  assert.ok(
    ret>details,
    "detalhes devem ser calculados antes do return"
  );
});

test("World Cup remains the default national competition",()=>{
  assert.ok(
    src.includes(
      'let nationalCompetitionId="WORLD_CUP";'
    )
  );

  assert.ok(
    src.includes(
      'nationalCompetitionId==="WORLD_CUP"'
    )
  );
});

test("Selecao remains a direct navigation destination",()=>{
  assert.ok(
    src.includes(
      '["national", "Seleção", []]'
    )
  );
});
