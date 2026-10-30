const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("fs"),path=require("path");

function setup(){
  const Engine=require("../src/domain/engine.js");
  global.ProLifeGlobalFootball=Engine.GlobalFootball;
  global.ProLifeCoachCareer=Engine.CoachCareer;
  global.ProLifeCoachScoutingV2=require("../src/domain/coach-scouting-v2.js");
  global.ProLifePlayerEconomy=require("../src/domain/player-economy.js");
  global.ProLifeCoachSquadHub=require("../src/ui/coach-squad-hub.js");
  global.matchMedia=()=>({matches:true});
  const View=require("../src/ui/coach-career-view.js");
  const state=Engine.create({mode:"coach",catalogVersion:"fc27_v1"},4242);
  state.clubId=null;Engine.join(state,"gf_fc27_5",90000);Engine.CoachCareer.init(state,Engine);
  View.closeScoutPlayer();View.setMarketArea("observacao");View.setScoutScreen("busca");View.setScoutFilterTab("rapida");
  return {Engine,View,state};
}

test("mercado mobile separa busca, resultados e perfil em telas",()=>{
  const {Engine,View,state}=setup();
  let html=View.renderMarket(state,Engine);
  assert.match(html,/cc-scout-search-screen/);
  assert.match(html,/Busca rápida/);
  assert.doesNotMatch(html,/cc-scout-results-screen/);

  View.setScoutFilters("","all",{region:"all",category:"all"});
  html=View.renderMarket(state,Engine);
  const body=html.slice(html.lastIndexOf("</style>")+8);
  assert.match(html,/cc-scout-results-screen/);
  assert.match(html,/Alterar filtros/);
  assert.doesNotMatch(body,/cc-market-search-layout/);
  assert.ok((body.match(/class="cc-deal cc-fc27-result/g)||[]).length<=4,"mobile exibe no máximo quatro atletas por página");

  const match=html.match(/data-coach-scout-select="([^"]+)"/);
  assert.ok(match,"há um atleta selecionável");
  View.selectScoutPlayer(match[1],true);
  html=View.renderMarket(state,Engine);
  assert.match(html,/cc-mobile-scout-profile/);
  assert.match(html,/Voltar aos resultados/);
  View.closeScoutPlayer();
  html=View.renderMarket(state,Engine);
  assert.match(html,/cc-scout-results-screen/);
});

test("layout mobile fixa resultados em grade 2 por 2 sem rolagem da tela",()=>{
  const css=fs.readFileSync(path.join(__dirname,"../src/ui/fc27-mobile-sm27.css"),"utf8");
  assert.match(css,/\.cc-market-flow-screen\s*\{[^}]*overflow:hidden/s);
  assert.match(css,/\.cc-scout-results-screen \.cc-market-results-grid\s*\{[^}]*grid-template-columns:1fr 1fr;[^}]*grid-template-rows:repeat\(2,minmax\(0,1fr\)\);[^}]*overflow:hidden/s);
});
