const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs");

const src=
  fs.readFileSync(
    "src/ui/app.js",
    "utf8"
  );

test("Selecao is a direct top navigation destination",()=>{
  assert.ok(
    src.includes(
      '["national", "Seleção", []]'
    )
  );

  assert.equal(
    src.includes(
      '["national", "Seleção", [["national", "Seleção Brasileira"]]]'
    ),
    false
  );
});

test("national page still exists",()=>{
  assert.ok(
    src.includes(
      "national() {"
    )
  );
});

test("generic data-page handler can open national page",()=>{
  assert.ok(
    src.includes(
      'if (b.dataset.page) {'
    )
  );

  assert.ok(
    src.includes(
      "page = b.dataset.page;"
    )
  );
});
