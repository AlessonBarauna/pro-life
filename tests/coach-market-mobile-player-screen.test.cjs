"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const root=path.join(__dirname,"..");
const viewSource=fs.readFileSync(path.join(root,"src/ui/coach-career-view.js"),"utf8");
const appSource=fs.readFileSync(path.join(root,"src/ui/app.js"),"utf8");
const cssSource=fs.readFileSync(path.join(root,"src/ui/fc27-mobile-landscape.css"),"utf8");
const view=require(path.join(root,"src/ui/coach-career-view.js"));

test("scouting opens a dedicated mobile player screen and returns to its source",()=>{
  view.setMarketArea("observacao");
  view.setScoutScreen("busca");
  view.selectScoutPlayer("mobile-player",true);
  assert.equal(view.state.selectedScoutPlayer,"mobile-player");
  assert.equal(view.state.scoutScreen,"perfil");
  assert.equal(view.state.scoutReturnScreen,"busca");
  view.closeScoutPlayer();
  assert.equal(view.state.scoutScreen,"busca");
});

test("profile screen exposes a back action and preserves every existing scouting route",()=>{
  assert.match(viewSource,/data-coach-scout-back/);
  assert.match(viewSource,/cc-market-profile-screen/);
  for(const screen of ["busca","alvos","sondagens","olheiros","recomendacoes"]){
    assert.ok(viewSource.includes('"'+screen+'"'));
  }
});

test("desktop selection restores the game stage and mobile selection restores the result position",()=>{
  assert.match(appSource,/scoutReturnPosition=/);
  assert.match(appSource,/function captureScoutPosition/);
  assert.match(appSource,/function restoreScoutPosition/);
  assert.match(appSource,/stage\.scrollTop = position\.stageY/);
  assert.match(appSource,/screen\.scrollTop = position\.screenY/);
  assert.match(appSource,/setTimeout\(apply, 220\)/);
  assert.match(appSource,/results\.scrollTop = position\.resultsY/);
  assert.match(appSource,/\(pointer: coarse\) and \(max-width: 1180px\)/);
});

test("desktop swaps only the player detail instead of rebuilding the whole game",()=>{
  assert.match(appSource,/function updateDesktopScoutDetail/);
  assert.match(appSource,/currentDetail\.replaceChildren/);
  assert.match(appSource,/if\(dedicatedProfile\)render\(\)/);
  assert.match(appSource,/else if\(!updateDesktopScoutDetail\(V,playerId\)\)/);
});

test("mobile landscape displays the player data as a dedicated game screen",()=>{
  assert.match(cssSource,/\.cc-market-search-layout > \.cc-market-player-detail\s*\{\s*display:none/);
  assert.match(cssSource,/\.cc-mobile-scout-profile > \.cc-market-player-detail/);
  assert.match(cssSource,/\.cc-mobile-scout-profile \{[\s\S]*?min-width:0/);
  assert.match(cssSource,/grid-template-columns:minmax\(150px,\.8fr\) minmax\(140px,\.72fr\) minmax\(190px,1\.15fr\) minmax\(190px,1\.15fr\)/);
  assert.match(cssSource,/\.cc-mobile-scout-profile > \.cc-market-player-detail > \* \{ min-width:0; \}/);
  assert.match(cssSource,/\.cc-mobile-scout-profile \.cc-market-profile-scout \{ grid-column:3; \}/);
  assert.match(cssSource,/\.cc-mobile-scout-profile \.cc-market-profile-decision \{ grid-column:4; \}/);
  assert.match(viewSource,/cc-market-profile-basics/);
  assert.match(viewSource,/cc-market-profile-scout/);
  assert.match(viewSource,/cc-market-profile-decision/);
});

test("scouting actions rerender without returning the mobile screen to the top",()=>{
  assert.match(appSource,/data-coach-start-scout[\s\S]*?const position=captureScoutPosition\(\)/);
  assert.match(appSource,/persist\(\);render\(\);restoreScoutPosition\(position,true\);toast\("Observação iniciada\."\)/);
  assert.match(appSource,/data-coach-inquire[\s\S]*?const position=captureScoutPosition\(\)[\s\S]*?restoreScoutPosition\(position,true\)/);
});
