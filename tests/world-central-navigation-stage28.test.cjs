"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const base=path.resolve(__dirname,"..");
const app=fs.readFileSync(path.join(base,"src/ui/app.js"),"utf8");
const view=fs.readFileSync(
  path.join(base,"src/ui/world-competitions-view.js"),
  "utf8"
);

function between(source,start,end){
  const from=source.indexOf(start);
  const to=source.indexOf(end,from+start.length);
  assert.ok(from>=0,`marcador ausente: ${start}`);
  assert.ok(to>from,`fim ausente: ${end}`);
  return source.slice(from,to);
}

test("28E.4: jogador e treinador acessam a rota mundial pelo grupo Mundo",()=>{
  const menus=[...app.matchAll(/\["history", "Mundo", \[(.*?)\]\]/g)]
    .map(match=>match[1]);

  assert.equal(menus.length,2);
  assert.ok(menus[0].includes('["worldCompetitions", "Competições Mundiais"]'));
  assert.ok(menus[0].includes('["life", "Perfil e Vida"]'));
  assert.ok(menus[1].includes('["worldCompetitions", "Competições Mundiais"]'));
  assert.ok(menus[1].includes('["life", "Decisões"'));
});

test("28E.4: controles mundiais expõem identificadores seguros para eventos",()=>{
  assert.ok(view.includes("data-world-competitions-view"));
  assert.ok(view.includes('type="button" data-world-league="${esc(league.id)}"'));
  assert.ok(view.includes('type="button" data-world-round="${safeInt(item.round)}"'));
  assert.equal((view.match(/data-world-league=/g)||[]).length,1);
  assert.equal((view.match(/data-world-round=/g)||[]).length,1);
});

test("28E.4: seleção de liga e rodada altera somente memória transitória da UI",()=>{
  const league=between(
    app,
    "if (b.dataset.worldLeague !== undefined)",
    "if (b.dataset.worldRound !== undefined)"
  );
  const round=between(
    app,
    "if (b.dataset.worldRound !== undefined)",
    "if (b.dataset.nationalCompetition)"
  );

  assert.match(league,/worldCompetitionLeagueId=b\.dataset\.worldLeague/);
  assert.match(league,/worldCompetitionRound=null/);
  assert.match(round,/worldCompetitionRound=Number\(b\.dataset\.worldRound\)/);
  for(const block of [league,round]){
    assert.match(block,/render\(\)/);
    assert.doesNotMatch(block,/persist\(|command\(|state\s*[.=\[]/);
  }
});

test("28E.4: rota repassa estado somente para leitura e mantém seleção fora do save",()=>{
  const route=between(app,"worldCompetitions() {","clubs() {");
  assert.ok(route.includes("window.ProLifeWorldCompetitionsView.render("));
  assert.ok(route.includes("state,"));
  assert.ok(route.includes("D,"));
  assert.ok(route.includes("leagueId:worldCompetitionLeagueId"));
  assert.ok(route.includes("round:worldCompetitionRound"));
  assert.doesNotMatch(route,/state\s*[.=\[]|persist\(|command\(/);
});

test("28E.4: retorno para a Central usa navegação genérica sem salvar ou mutar carreira",()=>{
  const pageHandler=between(
    app,
    "if (b.dataset.page)",
    "if (b.dataset.advance)"
  );

  assert.ok(app.includes('["home", "Início", [["home", "Central"]'));
  assert.match(pageHandler,/page = b\.dataset\.page/);
  assert.match(pageHandler,/render\(\)/);
  assert.doesNotMatch(pageHandler,/persist\(|command\(|state\s*[.=\[]/);
});

test.todo(
  "28E.4: validar foco, rolagem e aparência em DOM/browser real"
);
