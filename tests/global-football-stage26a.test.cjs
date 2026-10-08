"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const D=require("../src/domain/engine.js"),Save=require("../src/infrastructure/save.js"),WC=require("../src/domain/world-cup.js");
const GF=D.GlobalFootball;
function state(seed=2601){return D.create({mode:"player",clubId:"c0"},seed);}
function officialCup(s,year=2030){const n=D.NationalTeam.init(s),t=WC.createTournament(year);s.day=(year-2026)*365+154;s.season=year;n.tournaments.push(t);D.NationalTeam.ensureWorldCupOfficialSquads(s,n,D,()=>{});return {n,t};}

test("26A: jogador global persiste com ID e modelo completo após reload",()=>{
  const s=state(),player=GF.playerById(s,"gf_p_lamine_yamal_2007");
  assert.ok(player);assert.equal(player.shortName,"L. Yamal");assert.equal(player.birthYear,2007);assert.equal(player.clubId,"gf_barcelona");assert.equal(player.leagueId,"gf_la_liga");assert.equal(player.status,"active");
  const restored=Save.parse(JSON.stringify(s)),same=GF.playerById(restored,player.id);
  assert.equal(same.id,player.id);assert.equal(same.name,player.name);assert.equal(same.clubId,player.clubId);
});

test("26A: idade global deriva da temporada sem incremento inconsistente",()=>{
  const s=state(2602),player=GF.playerById(s,"gf_p_lamine_yamal_2007");assert.equal(player.age,19);
  s.season=2030;GF.init(s);assert.equal(GF.playerById(s,player.id).age,23);
  GF.init(s);assert.equal(GF.playerById(s,player.id).age,23);
});

test("26A: transferência muda clube e liga sem duplicar jogador",()=>{
  const s=state(2603),id="gf_p_rui_silva_1994",before=GF.allPlayers(s).filter(player=>player.id===id).length;
  const moved=GF.transferPlayer(s,id,"gf_psg");
  assert.equal(moved.clubId,"gf_psg");assert.equal(moved.leagueId,"gf_ligue_1");assert.equal(moved.clubHistory.length,1);
  assert.equal(GF.allPlayers(s).filter(player=>player.id===id).length,before);assert.ok(GF.playersByClub(s,"gf_psg").some(player=>player.id===id));
  const restored=Save.parse(JSON.stringify(s));assert.equal(GF.playerById(restored,id).clubId,"gf_psg");
});

test("26A: clubes, ligas e filtros globais usam a API única",()=>{
  const s=state(2604);
  assert.equal(GF.clubById(s,"gf_bayern").country,"Alemanha");assert.equal(GF.leagueById(s,"gf_bundesliga").confederation,"UEFA");
  assert.ok(GF.playersByNationality(s,"França").length>50);assert.ok(GF.playersByClub(s,"gf_psg").length>=15);assert.ok(GF.playersByLeague(s,"gf_eredivisie").length>=40);
  assert.equal(GF.playerById(s,"hero"),s.person);assert.equal(new Set(GF.allPlayers(s).map(player=>player.id)).size,GF.allPlayers(s).length);
});

test("26A: aposentadoria determinística retira jogador da elegibilidade e preserva histórico",()=>{
  const s=state(2605),player=GF.playerById(s,"gf_p_lucas_chevalier_2001");player.birthYear=1980;s.season=2026;
  const retired=GF.rollSeason(s);assert.ok(retired.includes(player.id));assert.equal(player.status,"retired");assert.ok(s.globalFootball.retirements.some(item=>item.playerId===player.id));
  assert.equal(GF.eligibleNationalTeamPlayers(s,"Franca").some(candidate=>candidate.id===player.id),false);
  assert.deepEqual(GF.rollSeason(s),[]);
});

test("26A: Seleção e Copa Mundial consultam jogadores globais antes do fallback",()=>{
  const s=state(2606),{t}=officialCup(s),france=t.squads.find(team=>team.id==="FRA");
  assert.ok(france);assert.ok(france.squad.some(player=>player.id.startsWith("gf_p_")));
  assert.equal(france.squad.some(player=>player.club==="Universo internacional"),false);assert.equal(france.squad.length,26);
});

test("26A: Brasil continua usando o universo atual e o hero",()=>{
  const s=state(2607);for(const key of Object.keys(s.person.attrs))s.person.attrs[key]=100;s.reputation=100;
  const globalBrazil=GF.eligibleNationalTeamPlayers(s,"Brasil"),squad=D.NationalTeam.buildSquad(s,D);
  assert.ok(globalBrazil.some(player=>player.id.startsWith("intl_")));assert.ok(globalBrazil.some(player=>player.id==="hero"));assert.ok(squad.some(player=>player.id==="hero"));
});

test("26A: save antigo migra sem apagar dados existentes",()=>{
  const s=state(2608),oldId=s.clubs[0].roster[0].id;s.clubs[0].roster[0].legacyMarker="preservar";delete s.globalFootball;
  for(const player of s.internationalPlayers||[]){delete player.birthYear;delete player.shortName;delete player.status;delete player.active;}
  const restored=Save.parse(JSON.stringify(s));
  assert.equal(restored.clubs[0].roster.find(player=>player.id===oldId).legacyMarker,"preservar");assert.equal(restored.globalFootball.version,1);assert.ok(GF.playerById(restored,"gf_p_manuel_neuer_1986"));
});

test("26A: GER e potencial permanecem limitados a 100",()=>{
  const s=state(2609);for(const player of GF.allPlayers(s)){assert.ok(player.ovr<=100);assert.ok(player.overall<=100);assert.ok(player.potential<=100);}
});

test("26A: importação futura aceita dataset JSON-compatível e deduplica IDs",()=>{
  const s=state(2610),data={leagues:[{id:"gf_test_league",name:"Liga Teste",country:"Teste",level:1,clubCount:1,reputation:50,continent:"Teste",confederation:"TEST",active:true}],clubs:[{id:"gf_test_club",name:"Clube Teste",shortName:"Teste",country:"Teste",leagueId:"gf_test_league",division:1,reputation:50,strength:50,active:true}],players:[{id:"gf_test_player",name:"Jogador Teste",shortName:"J. Teste",nationality:"Teste",birthYear:2006,pos:"MEI",ovr:60,potential:70,clubId:"gf_test_club",leagueId:"gf_test_league"}]};
  assert.equal(GF.importData(s,data).players,1);assert.equal(GF.importData(s,data).players,0);assert.equal(GF.playersByNationality(s,"Teste").length,1);
});

test("26A: pool legado brasileiro entra na API global na criação/migração sem duplicar",()=>{
  const fresh=state(2611),legacy=player=>String(player.id).startsWith("intl_");
  const legacyIds=fresh.internationalPlayers.filter(legacy).map(player=>player.id);
  const globalIds=GF.playersByNationality(fresh,"Brasil").filter(legacy).map(player=>player.id);
  assert.ok(legacyIds.length>0);assert.ok(globalIds.length>0);
  const old=JSON.parse(JSON.stringify(fresh));delete old.globalFootball;delete old.internationalPlayers;
  const raw=JSON.parse(JSON.stringify(old));GF.init(raw);
  assert.deepEqual(GF.playersByNationality(raw,"Brasil").filter(legacy).map(player=>player.id).sort(),globalIds.slice().sort());
  const restored=Save.parse(JSON.stringify(old));
  assert.deepEqual(GF.playersByNationality(restored,"Brasil").filter(legacy).map(player=>player.id).sort(),globalIds.slice().sort());
  D.InternationalPool.init(restored);GF.init(restored);
  const all=GF.allPlayers(restored).map(player=>player.id);assert.equal(new Set(all).size,all.length);
  assert.equal(restored.internationalPlayers.filter(legacy).length,legacyIds.length);
});

test("26A: Copa gera elencos com normalização global única e resultado determinístico",()=>{
  const run=seed=>{const s=state(seed),passesBefore=GF.diagnostics().initFullPasses,poolBefore=s.internationalPlayers.length,{t}=officialCup(s);return {s,t,passes:GF.diagnostics().initFullPasses-passesBefore,generated:s.internationalPlayers.length-poolBefore};};
  const a=run(2612),b=run(2612);
  assert.ok(a.generated>500);
  assert.ok(a.passes<=3,`normalização completa repetida: ${a.passes} passes para ${a.generated} jogadores gerados`);
  assert.equal(a.t.squads.length,48);for(const entry of a.t.squads)assert.equal(entry.squad.length,26);
  assert.equal(JSON.stringify(a.t.squads),JSON.stringify(b.t.squads));
  assert.deepEqual(a.s.internationalPlayers.map(player=>player.id),b.s.internationalPlayers.map(player=>player.id));
  const ids=a.s.internationalPlayers.map(player=>player.id);assert.equal(new Set(ids).size,ids.length);
});

test("26A: índice de clubes acompanha clubes locais, importados e externos",()=>{
  const s=state(2613);
  s.clubs.push({id:"zz_local",name:"Local Novo",roster:[],leagueId:"liga1"});
  assert.equal(GF.clubById(s,"zz_local").name,"Local Novo");
  GF.importData(s,{leagues:[],clubs:[{id:"gf_imp_club",name:"Importado",shortName:"Imp",country:"Teste",leagueId:null,division:1,reputation:50,strength:50,budget:1,active:true}],players:[]});
  assert.equal(GF.clubById(s,"gf_imp_club").name,"Importado");
  const player=GF.registerPlayer(s,{id:"gf_ext_test",name:"Externo Teste",nationality:"Teste",pos:"MEI",birthYear:2000,ovr:70,potential:75,externalClub:"Clube Externo FC"});
  assert.equal(GF.clubById(s,player.clubId).name,"Clube Externo FC");
  assert.equal(GF.allPlayers(s).filter(candidate=>candidate.id==="gf_ext_test").length,1);
  assert.equal(GF.registerPlayer(s,{id:"gf_ext_test",name:"Externo Teste"}).id,"gf_ext_test");
  assert.equal(GF.allPlayers(s).filter(candidate=>candidate.id==="gf_ext_test").length,1);
});

test("26A: herói com 14 anos mantém a idade na normalização global",()=>{
  const s=state(2614);s.person.age=14;s.person.birthYear=s.season-14;delete s.globalFootball;
  GF.init(s);const hero=GF.playerById(s,"hero");
  assert.equal(hero.age,14);assert.equal(s.person.age,14);assert.equal(hero.birthYear,s.season-14);
});
