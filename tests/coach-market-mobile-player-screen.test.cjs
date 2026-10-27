"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const viewPath=path.join(__dirname,"../src/ui/coach-career-view.js");
const appPath=path.join(__dirname,"../src/ui/app.js");
const cssPath=path.join(__dirname,"../src/ui/fc27-mobile-landscape.css");
const viewSource=fs.readFileSync(viewPath,"utf8");
const appSource=fs.readFileSync(appPath,"utf8");
const cssSource=fs.readFileSync(cssPath,"utf8");
const view=require(viewPath);

test("mobile scouting opens and closes a dedicated player screen",()=>{
  view.setScoutScreen("alvos");
  view.selectScoutPlayer("mobile-player",true);
  assert.equal(view.state.selectedScoutPlayer,"mobile-player");
  assert.equal(view.state.scoutScreen,"perfil");
  assert.equal(view.state.scoutReturnScreen,"alvos");
  view.closeScoutPlayer();
  assert.equal(view.state.scoutScreen,"alvos");
});

test("player screen has a game-style back action and reuses the full profile",()=>{
  assert.match(viewSource,/cc-mobile-scout-profile/);
  assert.match(viewSource,/data-coach-scout-back/);
  assert.ok(viewSource.includes("+sideDetail+'</section>'"));
  assert.match(viewSource,/cc-scout-technical/);
  assert.match(viewSource,/cc-scout-contract/);
});

test("app chooses the dedicated screen on touch phones and restores list position",()=>{
  assert.match(appSource,/\(pointer: coarse\) and \(max-width: 1180px\)/);
  assert.match(appSource,/scoutReturnPosition=/);
  assert.match(appSource,/data-coach-scout-back/);
  assert.match(appSource,/results\.scrollTop=position\.resultsY/);
});

test("landscape CSS removes the side panel and fits the profile as one screen",()=>{
  assert.match(cssSource,/\.cc-market-search-layout > \.cc-market-player-detail\s*\{\s*display:none/);
  assert.match(cssSource,/\.cc-mobile-scout-profile > \.cc-market-player-detail/);
  assert.match(cssSource,/grid-template-columns:210px 210px minmax\(270px,1fr\) minmax\(270px,1fr\)/);
});
