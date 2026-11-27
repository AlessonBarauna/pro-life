"use strict";
const test = require("node:test"), assert = require("node:assert");
const F = require("../src/ui/face-photo.js");
const ok = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
test("só aceita JPEG em base64 e com tamanho limitado", () => {
  assert.ok(F.valid(ok));
  assert.ok(!F.valid("data:image/png;base64,AAAA"));
  assert.ok(!F.valid("javascript:alert(1)"));
  assert.ok(!F.valid(ok + "A".repeat(F.MAX)));
  assert.ok(!F.valid(null));
});
test("cartão mostra remover só quando há foto", () => {
  assert.ok(!/data-fp-remove/.test(F.card({ name: "A" })));
  assert.ok(/data-fp-remove/.test(F.card({ name: "A", photo: ok })));
  assert.equal(F.img({ name: "A" }), "");
  assert.match(F.stage({ name: "A", photo: ok }), /fp-hero/);
});
