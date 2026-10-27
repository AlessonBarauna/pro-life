const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("fs"),path=require("path");
const view=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
const game=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
test("mercado tem aba Sondagens com a lista de interesses consultados",()=>{
  assert.match(view,/\["sondagens","Sondagens"\]/);
  assert.match(view,/ui\.scoutScreen==="sondagens"\)return scoutNav\+inquiryPanel/);
  for(const l of ["Painel","Scouting","Transferências","Listas","Elenco"])assert.ok(view.includes('"'+l+'"'));
  assert.match(view,/setListScreen:id=>/);
  assert.match(view,/setScoutScreen:id=>\{if\(\["busca","alvos","sondagens"/);
  assert.match(view,/Sondagens enviadas/);
});
test("sondagem nova guarda nome do jogador e do clube",()=>{
  assert.match(game,/playerName:p\.name,clubName:seller\.name/);
});
test("aba Sondagens renderiza as sondagens enviadas pelo clube atual",()=>{
  const Engine=require("../src/domain/engine.js");
  global.ProLifeGlobalFootball=Engine.GlobalFootball;global.ProLifeCoachCareer=Engine.CoachCareer;
  global.ProLifeCoachScoutingV2=require("../src/domain/coach-scouting-v2.js");
  global.ProLifePlayerEconomy=require("../src/domain/player-economy.js");
  global.ProLifeCoachSquadHub=require("../src/ui/coach-squad-hub.js");
  const View=require("../src/ui/coach-career-view.js");
  const s=Engine.create({mode:"coach",catalogVersion:"fc27_v1"},4242);s.clubId=null;Engine.join(s,"gf_fc27_5",90000);
  View.setListScreen("sondagens");
  let html=View.renderMarket(s,Engine);
  assert.match(html,/Nenhuma sondagem enviada ainda/);
  const other=s.globalFootball.clubs.find(c=>c.id!==s.clubId&&(c.roster||[]).length)||null;
  const seller=other||Engine.club(s,"gf_fc27_1");
  const p=(seller.roster||Engine.GlobalFootball.playersByClub(s,seller.id))[0];
  Engine.CoachCareer.init?.(s,Engine);s.coachCareer.inquiries=[
    {id:"i1",playerId:p.id,clubId:seller.id,buyerClubId:s.clubId,playerName:"Fulano Teste",clubName:"Clube Teste",startDay:3,responseDay:5,expiresDay:15,status:"pending"},
    {id:"i2",playerId:"x2",clubId:seller.id,buyerClubId:s.clubId,playerName:"Beltrano Recusado",clubName:"Clube Teste",startDay:1,responseDay:3,expiresDay:13,status:"rejected",playerDecision:"rejected"},
    {id:"i3",playerId:"x3",clubId:seller.id,buyerClubId:"outro",playerName:"De Outro Clube",startDay:2,status:"pending"}];
  html=View.renderMarket(s,Engine);
  assert.match(html,/2 SONDAGENS/);assert.match(html,/Aguardando resposta/);assert.match(html,/Recusada · jogador sem interesse/);
  assert.doesNotMatch(html,/De Outro Clube/);
  // Selecionar a sondagem abre o perfil do jogador na própria aba, sem voltar à busca mundial.
  assert.match(html,/cc-market-search-layout/);
  View.selectScoutPlayer(p.id);
  html=View.renderMarket(s,Engine);
  assert.match(html,/cc-market-player-detail/);
  assert.ok(html.includes(p.name),"perfil do jogador consultado");
  assert.match(html,/cc-inquiry-row[^"]* is-selected/);
  assert.doesNotMatch(html,/Filtros de pesquisa/);
});
test("Listas abre Alvos, Sondagens e Saídas sem passar pela busca mundial",()=>{
  const Engine=require("../src/domain/engine.js");
  global.ProLifeGlobalFootball=Engine.GlobalFootball;global.ProLifeCoachCareer=Engine.CoachCareer;
  global.ProLifeCoachScoutingV2=require("../src/domain/coach-scouting-v2.js");
  global.ProLifePlayerEconomy=require("../src/domain/player-economy.js");
  global.ProLifeCoachSquadHub=require("../src/ui/coach-squad-hub.js");
  const View=require("../src/ui/coach-career-view.js");
  const s=Engine.create({mode:"coach",catalogVersion:"fc27_v1"},4242);s.clubId=null;Engine.join(s,"gf_fc27_5",90000);
  View.setListScreen("alvos");let html=View.renderMarket(s,Engine);
  assert.match(html,/data-coach-market-area="lists" aria-pressed="true"/);assert.match(html,/Lista de alvos/);assert.match(html,/data-coach-list-screen="sondagens"/);
  View.setListScreen("saidas");html=View.renderMarket(s,Engine);assert.match(html,/data-coach-list-screen="saidas" aria-pressed="true"/);
  View.setMarketArea("observacao");html=View.renderMarket(s,Engine);
  assert.match(html,/data-coach-scout-screen="olheiros"/);assert.doesNotMatch(html,/data-coach-scout-screen="alvos"/);
});
test("perfil mostra o relatório do olheiro em 4 áreas",()=>{
  const Engine=require("../src/domain/engine.js");
  global.ProLifeGlobalFootball=Engine.GlobalFootball;global.ProLifeCoachCareer=Engine.CoachCareer;
  global.ProLifeCoachScoutingV2=require("../src/domain/coach-scouting-v2.js");
  global.ProLifePlayerEconomy=require("../src/domain/player-economy.js");
  global.ProLifeCoachSquadHub=require("../src/ui/coach-squad-hub.js");
  const View=require("../src/ui/coach-career-view.js");
  const s=Engine.create({mode:"coach",catalogVersion:"fc27_v1"},4242);s.clubId=null;Engine.join(s,"gf_fc27_5",90000);
  View.setMarketArea("observacao");View.setScoutScreen("busca");
  const html=View.renderMarket(s,Engine);
  for(const a of ["ENCAIXE TÁTICO","POTENCIAL FUTURO","AVALIAÇÃO FINANCEIRA","SITUAÇÃO DO JOGADOR"])assert.ok(html.includes(a),a);
});
test("atividades da central de transferências incluem sondagens com prazo e ação",()=>{
  const Engine=require("../src/domain/engine.js");
  global.ProLifeGlobalFootball=Engine.GlobalFootball;global.ProLifeCoachCareer=Engine.CoachCareer;
  global.ProLifeCoachScoutingV2=require("../src/domain/coach-scouting-v2.js");
  global.ProLifePlayerEconomy=require("../src/domain/player-economy.js");
  global.ProLifeCoachSquadHub=require("../src/ui/coach-squad-hub.js");
  const View=require("../src/ui/coach-career-view.js");
  const s=Engine.create({mode:"coach",catalogVersion:"fc27_v1"},4242);s.clubId=null;Engine.join(s,"gf_fc27_5",90000);
  Engine.CoachCareer.init(s,Engine);
  s.coachCareer.inquiries=[{id:"i1",playerId:"p1",clubId:"gf_fc27_1",buyerClubId:s.clubId,playerName:"Fulano Teste",startDay:s.day,responseDay:s.day+2,expiresDay:s.day+12,status:"pending"},
    {id:"i2",playerId:"p2",clubId:"gf_fc27_1",buyerClubId:s.clubId,playerName:"Ciclano Aceito",startDay:s.day,responseDay:s.day+2,expiresDay:s.day+12,status:"accepted"}];
  View.setDealTab("propostas");View.setMarketArea("transferencias");
  const html=View.renderMarket(s,Engine);
  assert.match(html,/Fulano Teste/);assert.match(html,/Sondagem enviada · aguardar resposta/);
  assert.match(html,/Sondagem aceita · abrir negociação/);assert.match(html,/data-coach-list-screen="sondagens"/);
});
