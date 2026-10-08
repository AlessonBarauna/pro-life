const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs");

const src=
  fs.readFileSync(
    "src/ui/creator.js",
    "utf8"
  );

test("opportunity validation remains only on step 4",()=>{
  assert.ok(
    src.includes(
      'if (W.step === 4 && !W.clubId)'
    )
  );
});

test("wizard next transition restores previous step if render fails",()=>{
  assert.ok(
    src.includes(
      "const previousStep="
    )
  );

  assert.ok(
    src.includes(
      "W.step=\n          previousStep"
    )
  );

  assert.ok(
    src.includes(
      "Falha ao abrir etapa do criador:"
    )
  );
});

test("offer rendering tolerates missing club or competition data",()=>{
  assert.ok(
    src.includes(
      'name:"Clube indisponivel"'
    )
  );

  assert.ok(
    src.includes(
      "o.competition ||"
    )
  );
});
