const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");

test("18C2: existe painel de perks",()=>{
  assert.match(app,/function archetypePerkPanel\(\)/);
});

test("18C2: identityPanel inclui painel de perks",()=>{
  assert.match(app,/\$\{archetypePerkPanel\(\)\}/);
});

test("18C2: UI mostra nivel XP e slots",()=>{
  assert.match(app,/Nível de arquétipo/);
  assert.match(app,/XP:/);
  assert.match(app,/Slots:/);
});

test("18C2: UI mostra estados dos perks",()=>{
  assert.match(app,/BLOQUEADO/);
  assert.match(app,/DISPONÍVEL/);
  assert.match(app,/DESBLOQUEADO/);
  assert.match(app,/ATIVO/);
});

test("18C2: existe botao desbloquear",()=>{
  assert.match(app,/data-unlock-archetype-perk/);
});

test("18C2: existe botao ativar",()=>{
  assert.match(app,/data-activate-archetype-perk/);
});

test("18C2: existe botao desativar",()=>{
  assert.match(app,/data-deactivate-archetype-perk/);
});

test("18C2: desbloqueio usa application",()=>{
  assert.match(app,/command\("unlockArchetypePerk"/);
});

test("18C2: ativacao usa application",()=>{
  assert.match(app,/command\("activateArchetypePerk"/);
});

test("18C2: desativacao usa application",()=>{
  assert.match(app,/command\("deactivateArchetypePerk"/);
});

test("18C2: UI nao altera perks diretamente",()=>{
  assert.doesNotMatch(app,/D\.Training\.unlockArchetypePerk\s*\(/);
  assert.doesNotMatch(app,/D\.Training\.activateArchetypePerk\s*\(/);
  assert.doesNotMatch(app,/D\.Training\.deactivateArchetypePerk\s*\(/);
});

test("18C2: painel explica regra de overall",()=>{
  assert.match(app,/Não aumentam o overall diretamente/);
});
