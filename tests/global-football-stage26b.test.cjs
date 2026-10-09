"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const D=require("../src/domain/engine.js"),Save=require("../src/infrastructure/save.js"),WC=require("../src/domain/world-cup.js");
const GF=D.GlobalFootball;
const LEAGUES={gf_premier_league:["Inglaterra",20],gf_la_liga:["Espanha",20],gf_serie_a_italy:["Italia",20],gf_bundesliga:["Alemanha",18],gf_ligue_1:["Franca",18],gf_liga_portugal:["Portugal",18],gf_eredivisie:["Holanda",18]};
const YAMAL="gf_p_lamine_yamal_2007",isPack=player=>String(player.id).startsWith("gf_p_");
function state(seed=2701){return D.create({mode:"player",clubId:"c0"},seed);}
function officialCup(s,year=2030){const n=D.NationalTeam.init(s),t=WC.createTournament(year);s.day=(year-2026)*365+154;s.season=year;n.tournaments.push(t);D.NationalTeam.ensureWorldCupOfficialSquads(s,n,D,()=>{});return {n,t};}
const imported=s=>GF.allPlayers(s).filter(isPack);

test("26B: as sete ligas existem com país, divisão e quantidade de clubes do FC 26",()=>{
  const s=state();
  for(const [id,[country,count]] of Object.entries(LEAGUES)){
    const league=GF.leagueById(s,id);
    assert.ok(league,id);assert.equal(league.country,country);assert.equal(league.level,1);assert.equal(league.confederation,"UEFA");assert.equal(league.active,true);
    assert.equal(league.clubCount,count);assert.equal(s.globalFootball.clubs.filter(club=>club.leagueId===id).length,count,id);
  }
  assert.equal(Object.keys(LEAGUES).filter(id=>s.globalFootball.leagues.some(league=>league.id===id)).length,7);
});

test("26B: clubes são consultáveis, sem duplicar nomes nem colidir com clubes do projeto",()=>{
  const s=state(),clubs=s.globalFootball.clubs.filter(club=>!club.generated&&Object.keys(LEAGUES).includes(club.leagueId));
  assert.equal(clubs.length,132);
  const arsenal=GF.clubById(s,"gf_arsenal");assert.equal(arsenal.name,"Arsenal");assert.equal(arsenal.leagueId,"gf_premier_league");assert.equal(arsenal.division,1);assert.equal(arsenal.country,"Inglaterra");
  for(const club of clubs){assert.ok(club.id.startsWith("gf_"));assert.ok(club.shortName);assert.ok(club.reputation>0&&club.strength>0);assert.equal(club.active,true);assert.ok(GF.leagueById(s,club.leagueId),club.id);}
  const key=value=>String(value).normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"");
  const names=clubs.map(club=>key(club.name));assert.equal(new Set(names).size,names.length);
  const local=new Set(s.clubs.map(club=>key(club.name)));assert.equal(clubs.filter(club=>local.has(key(club.name))).length,0);
  assert.equal(new Set(clubs.map(club=>club.id)).size,clubs.length);
});

test("26B: jogadores são consultáveis com IDs únicos e modelo completo",()=>{
  const s=state(),players=imported(s);
  assert.ok(players.length>=1200);
  for(const id of [YAMAL,"gf_p_erling_haaland_2000","gf_p_rodri_1996","gf_p_jude_bellingham_2003","gf_p_kylian_mbappe_1998"])assert.ok(GF.playerById(s,id),id);
  const yamal=GF.playerById(s,YAMAL);
  assert.equal(yamal.name,"Lamine Yamal");assert.equal(yamal.shortName,"L. Yamal");assert.equal(yamal.nationality,"Espanha");assert.equal(yamal.pos,"ATA");assert.equal(yamal.birthYear,2007);assert.equal(yamal.external,true);
  assert.equal(yamal.clubId,"gf_barcelona");assert.equal(yamal.leagueId,"gf_la_liga");assert.ok(yamal.potential>yamal.ovr);
  const ids=GF.allPlayers(s).map(player=>player.id);assert.equal(new Set(ids).size,ids.length);
  for(const player of players){assert.ok(["GOL","DEF","MEI","ATA"].includes(player.pos));assert.ok(player.ovr<=100&&player.potential<=100&&player.potential>=player.ovr);assert.ok(player.attrs&&Object.values(player.attrs).every(value=>value<=100));if(player.nationality==="Brasil")assert.ok(player.ovr<=72,"brasileiros importados só com GER baixo (não afetam a seleção do Brasil)");}
});

test("26B: jogador mantém clube e liga coerentes e nada duplica após reload",()=>{
  const s=state(2702),before=imported(s),ids=before.map(player=>player.id);
  for(const player of before){const club=GF.clubById(s,player.clubId);assert.ok(club,player.id);assert.equal(player.leagueId,club.leagueId);assert.equal(player.externalClub,club.name);}
  const restored=Save.parse(JSON.stringify(s)),after=imported(restored);
  assert.equal(after.length,before.length);assert.deepEqual(after.map(player=>player.id).sort(),ids.slice().sort());
  assert.equal(new Set(GF.allPlayers(restored).map(player=>player.id)).size,GF.allPlayers(restored).length);
  const again=Save.parse(JSON.stringify(restored));assert.equal(imported(again).length,before.length);
  assert.equal(GF.playerById(restored,YAMAL).clubId,"gf_barcelona");
});

test("26B: nacionalidades funcionam com aliases e sem depender de acentuação",()=>{
  const s=state(),count=name=>GF.playersByNationality(s,name).length;
  for(const group of [["Espanha","Spain","España","espanha"],["Inglaterra","England"],["Italia","Itália","Italy"],["Alemanha","Germany"],["Franca","França","France"],["Portugal"],["Holanda","Netherlands","Países Baixos"]]){
    const first=count(group[0]);assert.ok(first>=15,group[0]);for(const alias of group)assert.equal(count(alias),first,alias);
  }
  assert.equal(GF.normalizedNationality("Côte d'Ivoire"),GF.normalizedNationality("Costa do Marfim"));assert.equal(GF.normalizedNationality("Brazil"),"brasil");
  assert.equal(GF.nationName("ESP"),"Espanha");
});

test("26B: jovens envelhecem pela data de nascimento e mantêm o ID",()=>{
  const s=state(2703);assert.equal(GF.playerById(s,YAMAL).age,19);
  const cubarsi=GF.playerById(s,"gf_p_pau_cubarsi_2007");assert.ok(cubarsi);
  for(const [year,age] of [[2030,23],[2034,27]]){s.season=year;GF.init(s);const yamal=GF.playerById(s,YAMAL);assert.equal(yamal.age,age);assert.equal(yamal.id,YAMAL);assert.equal(GF.playerById(s,cubarsi.id).age,year-2007);}
  assert.equal(imported(s).filter(player=>player.id===YAMAL).length,1);
});

test("26B: jogador pode mudar de clube e se aposentar mantendo o ID",()=>{
  const s=state(2704),before=imported(s).length;
  const moved=GF.transferPlayer(s,YAMAL,"gf_real_madrid");assert.equal(moved.id,YAMAL);assert.equal(moved.clubId,"gf_real_madrid");assert.equal(moved.leagueId,"gf_la_liga");assert.equal(moved.clubHistory.at(-1).fromClubId,"gf_barcelona");
  const cross=GF.transferPlayer(s,YAMAL,"gf_psg");assert.equal(cross.leagueId,"gf_ligue_1");
  assert.equal(imported(s).length,before);
  const restored=Save.parse(JSON.stringify(s));assert.equal(GF.playerById(restored,YAMAL).clubId,"gf_psg");assert.equal(imported(restored).length,before);
  const veteran=GF.playerById(restored,"gf_p_manuel_neuer_1986");veteran.birthYear=1980;
  const retired=GF.rollSeason(restored);assert.ok(retired.includes(veteran.id));assert.equal(GF.eligibleNationalTeamPlayers(restored,"Alemanha").some(player=>player.id===veteran.id),false);
  assert.equal(GF.playerById(restored,veteran.id).status,"retired");
});

test("26B: jogadores importados aparecem na seleção por mérito e nunca como placeholder",()=>{
  const s=state(2705),spain=GF.eligibleNationalTeamPlayers(s,"Spain");
  assert.ok(spain.some(player=>player.id===YAMAL));assert.ok(spain.length>=100);
  const {t}=officialCup(s,2030);
  for(const code of ["ESP","ENG","FRA","GER","POR","NED"]){
    const squad=t.squads.find(entry=>entry.id===code).squad;
    assert.equal(squad.length,26,code);assert.equal(squad.filter(player=>String(player.id).startsWith("intlgen_")).length,0,`${code} usou placeholder`);
    assert.ok(squad.filter(player=>isPack(player)).length>=22,code);
  }
});

test("26B: jogador persistente continua em Copas futuras sem ser recriado",()=>{
  for(const year of [2030,2034]){
    const s=state(2706),poolBefore=imported(s).length,{t}=officialCup(s,year),spain=t.squads.find(entry=>entry.id==="ESP").squad;
    assert.ok(spain.some(player=>player.id===YAMAL),`Yamal fora da Copa ${year}`);
    assert.equal(imported(s).length,poolBefore);
    const ids=s.internationalPlayers.map(player=>player.id);assert.equal(new Set(ids).size,ids.length);
    for(const player of spain)assert.ok(GF.playerById(s,player.id),player.id);
  }
});

test("26B: nenhum clube ou jogador importado aparece como Universo internacional",()=>{
  const s=state(2707),{t}=officialCup(s,2030);
  assert.equal(s.globalFootball.clubs.some(club=>/universo internacional/i.test(club.name)),false);
  assert.equal(imported(s).some(player=>/universo internacional/i.test(`${player.externalClub} ${player.club||""}`)),false);
  for(const code of ["ESP","ENG","FRA","GER","POR","NED"])assert.equal(t.squads.find(entry=>entry.id===code).squad.some(player=>/universo internacional/i.test(player.club)),false,code);
});

test("26B: importação é idempotente e roda uma vez por estado",()=>{
  const s=state(2708),before=imported(s).length,passes=GF.diagnostics().initFullPasses;
  for(let i=0;i<200;i++){GF.init(s);GF.allPlayers(s);}
  assert.equal(GF.diagnostics().initFullPasses,passes);
  assert.deepEqual(s.globalFootball.packs,Object.fromEntries(GF.packInfo().map(pack=>[pack.id,pack.version])));
  s.globalFootball.packs={};s.season=2027;GF.init(s);
  assert.equal(imported(s).length,before);assert.equal(Object.keys(s.globalFootball.packs).length,GF.packInfo().length);
  assert.equal(s.globalFootball.leagues.filter(league=>league.id==="gf_la_liga").length,1);assert.equal(s.globalFootball.clubs.filter(club=>club.id==="gf_arsenal").length,1);
  const info=GF.packInfo().filter(pack=>/^eur26b_/.test(pack.id));assert.equal(info.length,7);assert.equal(info.reduce((sum,pack)=>sum+pack.clubs,0),132);const leagueIds=new Set(Object.keys(LEAGUES));assert.equal(info.reduce((sum,pack)=>sum+pack.players,0),imported(s).filter(player=>leagueIds.has(player.leagueId)).length);
});

test("26B: performance — criação e geração da Copa sem normalização repetida",()=>{
  const startedAt=Date.now(),s=state(2709),createMs=Date.now()-startedAt;
  assert.ok(createMs<4000,`create ${createMs}ms`);
  const passes=GF.diagnostics().initFullPasses,cupStart=Date.now();officialCup(s,2030);
  assert.ok(GF.diagnostics().initFullPasses-passes<=3,"normalização completa repetida");assert.ok(Date.now()-cupStart<8000);
});

test("26B: saves antigos migram sem perder dados (pré-26B e da 26A)",()=>{
  const s=state(2710);s.clubs[0].roster[0].legacyMarker="preservar";
  const identity=player=>String(player?.name||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()+"|"+player?.birthYear;
  const expectedIdentities=new Set(imported(s).map(identity));
  const assertPackIdentitiesRepresented=state=>{
    const represented=new Set(GF.allPlayers(state).map(identity));
    for(const key of expectedIdentities)assert.ok(represented.has(key),"identidade perdida na migracao: "+key);
  };
  const pre=JSON.parse(JSON.stringify(s));delete pre.globalFootball;pre.internationalPlayers=pre.internationalPlayers.filter(player=>!isPack(player));
  const migrated=Save.parse(JSON.stringify(pre));
  assertPackIdentitiesRepresented(migrated);assert.equal(migrated.clubs[0].roster[0].legacyMarker,"preservar");assert.ok(migrated.globalFootball.packs.eur26b_esp>=1);
  const era26a=JSON.parse(JSON.stringify(s));delete era26a.globalFootball.packs;
  era26a.internationalPlayers=era26a.internationalPlayers.filter(player=>!isPack(player));
  era26a.internationalPlayers.push({id:"gf_esp_1",name:"Iker Salas",shortName:"I. Salas",nationality:"Espanha",birthYear:2003,pos:"GOL",ovr:82,overall:82,potential:87,clubId:"gf_madrid_capital",leagueId:"gf_la_liga",external:true,status:"active",active:true});
  const migrated26a=Save.parse(JSON.stringify(era26a));
  assertPackIdentitiesRepresented(migrated26a);assert.ok(GF.playerById(migrated26a,"gf_esp_1"));
  const ids=GF.allPlayers(migrated26a).map(player=>player.id);assert.equal(new Set(ids).size,ids.length);
});

test("26B: brasileiros do pool legado são ligados aos clubes reais sem duplicar clubes",()=>{
  const s=state(2711);
  const expected={intl_vini_jr:"gf_real_madrid",intl_raphinha:"gf_barcelona",intl_alisson:"gf_liverpool",intl_gabriel_magalhaes:"gf_arsenal",intl_marquinhos:"gf_psg",intl_bruno_guimaraes:"gf_newcastle",intl_savinho:"gf_tottenham",intl_matheus_cunha:"gf_man_united",intl_joao_pedro:"gf_chelsea",intl_andre:"gf_wolves"};
  for(const [id,clubId] of Object.entries(expected)){const player=GF.playerById(s,id);assert.ok(player,id);assert.equal(player.clubId,clubId,id);assert.ok(player.leagueId);}
  assert.ok(imported(s).filter(player=>GF.normalizedNationality(player.nationality)==="brasil").every(player=>player.ovr<=72));
  const key=club=>club.name.toLowerCase();const names=s.globalFootball.clubs.filter(club=>!club.generated).map(key);assert.equal(new Set(names).size,names.length);
});

test("26B: Copa Mundial e Brasil continuam funcionando com a base real",()=>{
  const s=state(2712);for(const key of Object.keys(s.person.attrs))s.person.attrs[key]=100;s.reputation=100;
  const brazil=D.NationalTeam.buildSquad(s,D);assert.ok(brazil.some(player=>player.id==="hero"));assert.equal(brazil.some(player=>isPack(player)),false);
  const {t}=officialCup(state(2713),2030);
  assert.equal(t.squads.length,48);for(const entry of t.squads){assert.equal(entry.squad.length,26,entry.id);assert.equal(new Set(entry.squad.map(player=>player.id)).size,26,entry.id);}
});

test("26B: qualidade dos dados — GER variado, sem duplicatas de pessoa e posições cobertas",()=>{
  const s=state(2714),players=imported(s),byOvr={};
  for(const player of players)byOvr[player.ovr]=(byOvr[player.ovr]||0)+1;
  assert.ok(Math.max(...Object.values(byOvr))<players.length*0.15,"GER concentrado demais");assert.ok(Object.keys(byOvr).length>=20);
  const people=players.map(player=>`${player.name}|${player.birthYear}`);assert.equal(new Set(people).size,people.length);
  for(const [nation,min] of [["Espanha",{GOL:3,DEF:8,MEI:8,ATA:7}],["Inglaterra",{GOL:3,DEF:8,MEI:8,ATA:7}],["Franca",{GOL:3,DEF:8,MEI:8,ATA:7}],["Alemanha",{GOL:3,DEF:8,MEI:8,ATA:7}],["Italia",{GOL:3,DEF:8,MEI:8,ATA:7}],["Portugal",{GOL:3,DEF:8,MEI:8,ATA:7}],["Holanda",{GOL:3,DEF:8,MEI:8,ATA:7}]])
    for(const [pos,count] of Object.entries(min))assert.ok(GF.playersByNationality(s,nation).filter(player=>player.pos===pos).length>=count,`${nation} ${pos}`);
  const young=players.filter(player=>player.birthYear>=2004);assert.ok(young.length>=60);assert.ok(young.every(player=>player.potential>=player.ovr));
});

test("26B.1: todos os 132 clubes têm elenco completo, sem placeholders e import idempotente",()=>{
  const s=state(2720),clubs=s.globalFootball.clubs.filter(club=>!club.generated&&Object.keys(LEAGUES).includes(club.leagueId));
  assert.equal(clubs.length,132);
  const ids=GF.allPlayers(s).map(player=>player.id);assert.equal(new Set(ids).size,ids.length);
  const clubIds=new Set(s.globalFootball.clubs.map(club=>club.id)),leagueIds=new Set(s.globalFootball.leagues.map(league=>league.id));
  for(const club of clubs){
    assert.equal(club.active,true,club.id);
    const roster=GF.playersByClub(s,club.id);
    assert.ok(roster.length>0,`${club.id} vazio`);assert.ok(roster.length>=18,`${club.id} tem ${roster.length}`);
    assert.ok(roster.filter(player=>player.pos==="GOL").length>=1,`${club.id} sem goleiro`);
    for(const player of roster){assert.equal(player.clubId,club.id);assert.ok(clubIds.has(player.clubId));assert.ok(leagueIds.has(player.leagueId),player.id);}
  }
  for(const club of s.globalFootball.clubs)assert.doesNotMatch(String(club.name),/Universo internacional/i);
  for(const player of imported(s)){
    assert.doesNotMatch(player.name,/\b(GOL|DEF|MEI|ATA)\s*\d+\b|\d/);
    assert.doesNotMatch(String(player.name),/placeholder|Universo/i);
  }
  const before=GF.allPlayers(s).length;GF.init(s);GF.init(s);assert.equal(GF.allPlayers(s).length,before);
  const reload=Save.parse(JSON.stringify(s));assert.equal(GF.allPlayers(reload).length,before);
});

test("26B.2/26B.3: auditoria das 7 ligas — sem duplicatas de pessoa, transferências corrigidas e elencos válidos",()=>{
  const s=state(2730),plain=value=>String(value).normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z ]/g," ").replace(/\s+/g," ").trim();
  const leagues=Object.keys(LEAGUES),clubs=s.globalFootball.clubs.filter(club=>leagues.includes(club.leagueId)&&!club.generated);
  assert.equal(clubs.length,132);
  const players=clubs.flatMap(club=>GF.playersByClub(s,club.id));
  const ids=players.map(player=>player.id);assert.equal(new Set(ids).size,ids.length,"IDs únicos");
  const clubIds=new Set(s.globalFootball.clubs.map(club=>club.id)),leagueIds=new Set(s.globalFootball.leagues.map(league=>league.id));
  for(const club of clubs){
    const roster=GF.playersByClub(s,club.id),names=roster.map(player=>plain(player.name));
    assert.ok(roster.length>=18,`${club.id} ${roster.length}`);assert.ok(roster.some(player=>player.pos==="GOL"),`${club.id} sem goleiro`);
    assert.equal(new Set(names).size,names.length,`${club.id}: mesmo nome duas vezes`);
    for(const player of roster){assert.ok(clubIds.has(player.clubId)&&leagueIds.has(player.leagueId),player.id);assert.equal(player.leagueId,club.leagueId);assert.doesNotMatch(String(player.name),/\d|placeholder|Universo/i);}
  }
  const byNameNat={};for(const player of players)(byNameNat[`${plain(player.name)}|${GF.normalizedNationality(player.nationality)}`]??=new Set()).add(player.birthYear);
  for(const [key,years] of Object.entries(byNameNat))assert.equal(years.size,1,`${key} com mais de um ano de nascimento`);
  const byName={};for(const player of players)(byName[plain(player.name)]??=[]).push(player.clubId);
  for(const [name,list] of Object.entries(byName))assert.equal(list.length,1,`${name} em mais de um clube`);
  const at=(club,name)=>GF.playersByClub(s,club).filter(player=>plain(player.name)===plain(name));
  for(const [club,name] of [["gf_benfica","Kerem Akturkoglu"],["gf_benfica","Angel Di Maria"],["gf_benfica","Orkun Kokcu"],["gf_benfica","Florentino Luis"],["gf_ajax","Jorrel Hato"],["gf_psv","Walter Benitez"],["gf_psv","Olivier Boscagli"],["gf_psv","Luuk de Jong"],["gf_sevilla","Dodi Lukebakio"],["gf_wolves","Jorgen Strand Larsen"],["gf_brighton","Pervis Estupinan"],["gf_man_city","Manuel Akanji"],["gf_lille","Gabriel Gudmundsson"],["gf_bayern","Kingsley Coman"],["gf_udinese","Idrissa Gueye"]])assert.equal(at(club,name).length,0,`${name} não pertence a ${club}`);
  for(const [club,name] of [["gf_ajax","Jorthy Mokio"],["gf_ajax","Wout Weghorst"],["gf_ajax","Ko Itakura"],["gf_sporting_cp","Maxi Araujo"],["gf_benfica","Anatoliy Trubin"],["gf_psv","Nick Olij"],["gf_psv","Paul Wanner"],["gf_psv","Alassane Plea"],["gf_benfica","Dodi Lukebakio"],["gf_newcastle","Jorgen Strand Larsen"],["gf_milan","Pervis Estupinan"],["gf_inter","Manuel Akanji"],["gf_leeds","Gabriel Gudmundsson"],["gf_sunderland","Robin Roefs"],["gf_everton","Idrissa Gueye"],["gf_mallorca","Jan Virgili"]])assert.equal(at(club,name).length,1,`${name} deve estar em ${club}`);
  const goes=at("gf_az_alkmaar","Wouter Goes")[0],pene=at("gf_az_alkmaar","Alexandre Penetra")[0];assert.equal(goes.pos,"DEF");assert.equal(pene.pos,"DEF");
  const before=GF.allPlayers(s).length;GF.init(s);GF.init(s);assert.equal(GF.allPlayers(s).length,before);
  const reload=Save.parse(JSON.stringify(s)),reloadIds=GF.allPlayers(reload).map(player=>player.id);
  assert.equal(reloadIds.length,before);assert.equal(new Set(reloadIds).size,reloadIds.length);
  const dup=new Set();for(const player of players){assert.ok(!dup.has(player.id),player.id);dup.add(player.id);}
});


test("26C: elenco 2030 antigo gerado migra para jogadores reais antes da Copa",()=>{
  const s=state(2798),{t}=officialCup(s,2030);

  for(const code of ["ENG","FRA"]){
    const team=t.squads.find(entry=>entry.id===code);
    assert.ok(team);

    team.squad=team.squad.map((player,index)=>({
      ...player,
      id:"legacy_generated_"+code+"_"+index,
      name:"Legacy Generated "+code+" "+index,
      club:code==="ENG"?"Manchester Union":"Paris Etoile",
      source:"generated-persistent"
    }));

    team.lineup={
      formation:"4-3-3",
      starters:team.squad.slice(0,11),
      bench:team.squad.slice(11)
    };
  }

  t.realUniversePackRevision=0;

  D.NationalTeam.ensureWorldCupOfficialSquads(
    s,
    s.nationalTeam,
    D,
    ()=>{}
  );

  for(const code of ["ENG","FRA"]){
    const squad=
      t.squads.find(entry=>entry.id===code).squad;

    assert.equal(squad.length,26,code);

    assert.ok(
      squad.filter(
        player=>String(player.id).startsWith("gf_p_")
      ).length>=22,
      code+" nao recuperou jogadores reais"
    );

    assert.equal(
      squad.some(
        player=>
          player.club==="Manchester Union" ||
          player.club==="Paris Etoile"
      ),
      false,
      code+" manteve clube ficticio"
    );

    assert.equal(
      squad.some(
        player=>
          player.source==="generated-persistent"
      ),
      false,
      code+" ainda usa jogador gerado apesar de possuir base real"
    );
  }
});


test("26C: save legado com Copa 2030 em andamento migra ficticios uma unica vez",()=>{
  const s=state(2799),{t}=officialCup(s,2030);

  const france=
    t.squads.find(entry=>entry.id==="FRA");

  assert.ok(france);

  france.squad=
    france.squad.map((player,index)=>({
      ...player,
      id:"legacy_france_"+index,
      name:"Legacy France "+index,
      club:"Paris Etoile",
      source:"generated-persistent"
    }));

  france.lineup={
    formation:"4-3-3",
    starters:france.squad.slice(0,11),
    bench:france.squad.slice(11)
  };

  t.realUniversePackRevision=0;
  delete t.realUniverseMigrationVersion;

  const played=
    t.groups
      .flatMap(group=>group.matches||[])
      .find(match=>match);

  assert.ok(played);

  played.played=true;
  played.hg=2;
  played.ag=1;

  const beforeResult={
    id:played.id,
    hg:played.hg,
    ag:played.ag,
    played:played.played
  };

  D.NationalTeam.ensureWorldCupOfficialSquads(
    s,
    s.nationalTeam,
    D,
    ()=>{}
  );

  const migrated=
    t.squads.find(entry=>entry.id==="FRA").squad;

  assert.equal(migrated.length,26);

  assert.equal(
    migrated.filter(
      player=>
        String(player.id).startsWith("gf_p_")
    ).length,
    26
  );

  assert.equal(
    migrated.some(
      player=>
        player.source==="generated-persistent"
    ),
    false
  );

  assert.deepEqual(
    {
      id:played.id,
      hg:played.hg,
      ag:played.ag,
      played:played.played
    },
    beforeResult
  );

  const ids=
    migrated.map(player=>player.id);

  D.NationalTeam.ensureWorldCupOfficialSquads(
    s,
    s.nationalTeam,
    D,
    ()=>{}
  );

  assert.deepEqual(
    t.squads
      .find(entry=>entry.id==="FRA")
      .squad
      .map(player=>player.id),
    ids
  );
});


test("26C: Copa iniciada com packRevision antigo ainda migra elenco ficticio",()=>{
  const s=state(2800),{t}=officialCup(s,2030);

  const france=
    t.squads.find(entry=>entry.id==="FRA");

  assert.ok(france);

  france.squad=
    france.squad.map((player,index)=>({
      ...player,
      id:"old_generated_fra_"+index,
      name:"Generated France "+index,
      club:
        index%2
          ?"Paris ?toile"
          :"Monaco Sporting",
      source:"generated-persistent"
    }));

  france.lineup={
    formation:"4-3-3",
    starters:france.squad.slice(0,11),
    bench:france.squad.slice(11)
  };

  // Simula exatamente o bug anterior:
  // revisao ja marcada mesmo sem migracao real.
  t.realUniversePackRevision=
    D.GlobalFootball.packInfo().length;

  delete t.realUniverseMigrationVersion;

  const match=
    t.groups
      .flatMap(group=>group.matches||[])
      .find(Boolean);

  assert.ok(match);

  match.played=true;
  match.hg=2;
  match.ag=1;

  const resultBefore=[
    match.id,
    match.played,
    match.hg,
    match.ag
  ];

  D.NationalTeam.ensureWorldCupOfficialSquads(
    s,
    s.nationalTeam,
    D,
    ()=>{}
  );

  const migrated=
    t.squads.find(entry=>entry.id==="FRA").squad;

  assert.equal(migrated.length,26);

  assert.equal(
    migrated.filter(
      player=>
        String(player.id).startsWith("gf_p_")
    ).length,
    26
  );

  assert.equal(
    migrated.some(
      player=>
        player.source==="generated-persistent"
    ),
    false
  );

  assert.equal(
    migrated.some(
      player=>
        player.club==="Paris ?toile" ||
        player.club==="Monaco Sporting"
    ),
    false
  );

  assert.equal(
    t.realUniverseMigrationVersion,
    4
  );

  assert.deepEqual(
    [
      match.id,
      match.played,
      match.hg,
      match.ag
    ],
    resultBefore
  );

  const ids=
    migrated.map(player=>player.id);

  D.NationalTeam.ensureWorldCupOfficialSquads(
    s,
    s.nationalTeam,
    D,
    ()=>{}
  );

  assert.deepEqual(
    t.squads
      .find(entry=>entry.id==="FRA")
      .squad
      .map(player=>player.id),
    ids
  );
});
