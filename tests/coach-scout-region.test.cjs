"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");

function fixture(){
 const root={};root.globalThis=root;vm.runInNewContext(source,root,{filename:"coach-career-view.js"});
 const player=(id,name,clubId,age,overall,potential)=>({id,name,clubId,age,overall,potential,primaryPosition:"ATA"});
 const clubs=[
  {id:"own",name:"São Paulo",country:"Brasil",leagueId:"serieA",budget:1000000,roster:[]},
  {id:"br",name:"Bahia",country:"Brasil",leagueId:"serieA",roster:[player("p-br","Atleta Brasil","br",19,70,91)]},
  {id:"ar",name:"River Plate",country:"Argentina",leagueId:"arg1",roster:[player("p-ar","Atleta Argentina","ar",30,82,83)]}
 ];
 const globalClubs=[
  {id:"es",name:"Real Madrid",country:"Espanha",leagueId:"laliga",roster:[player("p-es","Atleta Europa","es",21,88,95)]},
  {id:"us",name:"Inter Miami",country:"Estados Unidos",leagueId:"mls",roster:[player("p-us","Atleta América Norte","us",35,75,75)]},
  {id:"sa",name:"Al Hilal",country:"Arábia Saudita",leagueId:"saudi",roster:[player("p-sa","Atleta Ásia","sa",18,65,88)]}
 ];
 const state={mode:"coach",clubId:"own",season:2028,day:1,clubs,leagues:[{id:"serieA",name:"Brasileirão",country:"Brasil"},{id:"arg1",name:"Liga Argentina",country:"Argentina"}],globalFootball:{clubs:globalClubs,leagues:[{id:"laliga",name:"LaLiga",country:"Espanha"},{id:"mls",name:"MLS",country:"Estados Unidos"},{id:"saudi",name:"Saudi Pro League",country:"Arábia Saudita"}]},coachCareer:{}};
 const D={club:(s,id)=>[...s.clubs,...s.globalFootball.clubs].find(club=>club.id===id)};
 root.ProLifeCoachCareerView.setMarketArea("observacao");
 return {V:root.ProLifeCoachCareerView,state,D};
}

test("club region participates in scouting search and remains selected",()=>{
 const {V,state,D}=fixture();
 V.setScoutFilters("","all",{region:"Europa"});
 let html=V.renderMarket(state,D);
 assert.match(html,/Atleta Europa/);assert.doesNotMatch(html,/Atleta Brasil|Atleta Argentina|Atleta América Norte|Atleta Ásia/);
 assert.match(html,/<option value="Europa" selected>Europa<\/option>/);
 V.setScoutFilters("","all",{region:"América do Sul"});
 html=V.renderMarket(state,D);
 assert.match(html,/Atleta Brasil/);assert.match(html,/Atleta Argentina/);assert.doesNotMatch(html,/Atleta Europa|Atleta América Norte/);
 V.setScoutFilters("","all",{region:"Brasil"});
 html=V.renderMarket(state,D);
 assert.match(html,/Atleta Brasil/);assert.doesNotMatch(html,/Atleta Argentina|Atleta Europa/);
});

test("invalid club region safely returns to all regions",()=>{
 const {V,state,D}=fixture();
 V.setScoutFilters("","all",{region:"região-inexistente"});
 const html=V.renderMarket(state,D);
 for(const name of ["Atleta Brasil","Atleta Argentina","Atleta Europa","Atleta América Norte","Atleta Ásia"])assert.match(html,new RegExp(name));
 assert.match(html,/<option value="all" selected>Todas as regiões<\/option>/);
});

test("search action forwards the selected club region to the view",()=>{
 const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
 const handler=app.slice(app.indexOf('if(el.hasAttribute("data-coach-scout-apply"))'),app.indexOf('if(el.hasAttribute("data-coach-start-scout"))'));
 assert.match(handler,/region:document\.querySelector\("\[data-coach-scout-region\]"\)\?\.value/);
 assert.match(handler,/V\?\.setScoutFilters/);
});

test("GER and age ranges filter real player values and persist in the form",()=>{
 const {V,state,D}=fixture();
 V.setScoutFilters("","all",{overallMin:"80",overallMax:"90"});
 let html=V.renderMarket(state,D);
 assert.match(html,/Atleta Argentina/);assert.match(html,/Atleta Europa/);assert.doesNotMatch(html,/Atleta Brasil|Atleta América Norte|Atleta Ásia/);
 assert.match(html,/<option value="80" selected>80<\/option>/);assert.match(html,/<option value="90" selected>90<\/option>/);
 V.setScoutFilters("","all",{overallMin:"85",ageMin:"20",ageMax:"23"});
 html=V.renderMarket(state,D);
 assert.match(html,/Atleta Europa/);assert.doesNotMatch(html,/Atleta Argentina|Atleta Brasil|Atleta América Norte|Atleta Ásia/);
 assert.equal(V.state.scoutAgeMin,"20");assert.equal(V.state.scoutAgeMax,"23");assert.equal(V.state.scoutOverallMin,"85");
});

test("inverted GER and age limits are normalized before filtering",()=>{
 const {V}=fixture();
 V.setScoutFilters("","all",{overallMin:"90",overallMax:"70",ageMin:"30",ageMax:"18"});
 assert.equal(V.state.scoutOverallMin,"70");assert.equal(V.state.scoutOverallMax,"90");
 assert.equal(V.state.scoutAgeMin,"18");assert.equal(V.state.scoutAgeMax,"30");
});

test("results sort by GER or age in both directions before pagination",()=>{
 const {V,state,D}=fixture();
 V.setScoutFilters("","all",{sort:"overall",sortDirection:"desc"});
 let html=V.renderMarket(state,D);
 assert.ok(html.indexOf("Atleta Europa")<html.indexOf("Atleta Argentina"));
 assert.ok(html.indexOf("Atleta Argentina")<html.indexOf("Atleta Ásia"));
 V.setScoutFilters("","all",{sort:"overall",sortDirection:"asc"});
 html=V.renderMarket(state,D);
 assert.ok(html.indexOf("Atleta Ásia")<html.indexOf("Atleta Argentina"));
 assert.ok(html.indexOf("Atleta Argentina")<html.indexOf("Atleta Europa"));
 V.setScoutFilters("","all",{sort:"age",sortDirection:"asc"});
 html=V.renderMarket(state,D);
 assert.ok(html.indexOf("Atleta Ásia")<html.indexOf("Atleta Brasil"));
 assert.ok(html.indexOf("Atleta Brasil")<html.indexOf("Atleta América Norte"));
 V.setScoutFilters("","all",{sort:"age",sortDirection:"desc"});
 html=V.renderMarket(state,D);
 assert.ok(html.indexOf("Atleta América Norte")<html.indexOf("Atleta Brasil"));
 assert.match(html,/<option value="age" selected>Idade<\/option>/);
 assert.match(html,/<option value="desc" selected>Maior para menor<\/option>/);
});

test("potential can be filtered, displayed and sorted in both directions",()=>{
 const {V,state,D}=fixture();
 V.setScoutFilters("","all",{potentialMin:"88",potentialMax:"99",sort:"potential",sortDirection:"desc"});
 let html=V.renderMarket(state,D);
 assert.match(html,/Atleta Europa/);assert.match(html,/Atleta Brasil/);assert.match(html,/Atleta Ásia/);assert.doesNotMatch(html,/Atleta Argentina|Atleta América Norte/);
 assert.ok(html.indexOf("Atleta Europa")<html.indexOf("Atleta Brasil"));
 assert.ok(html.indexOf("Atleta Brasil")<html.indexOf("Atleta Ásia"));
 assert.match(html,/POT 95/);assert.match(html,/<option value="potential" selected>Potencial<\/option>/);
 V.setScoutFilters("","all",{potentialMin:"88",sort:"potential",sortDirection:"asc"});
 html=V.renderMarket(state,D);
 assert.ok(html.indexOf("Atleta Ásia")<html.indexOf("Atleta Brasil"));
 assert.ok(html.indexOf("Atleta Brasil")<html.indexOf("Atleta Europa"));
});

test("the FC27 catalog exposes a real potential from current GER up to 99 for every player",()=>{
 const Engine=require("../src/domain/engine.js");
 const state=Engine.create({mode:"coach",catalogVersion:"fc27_v1"},314159);
 const players=[...state.clubs.flatMap(club=>club.roster||[]),...(state.internationalPlayers||[])];
 assert.ok(players.length>20000);
 assert.ok(players.every(player=>Number.isFinite(Number(player.potential))&&Number(player.potential)>=Number(player.overall??player.ovr)&&Number(player.potential)<=99));
 assert.equal(Math.max(...players.map(player=>Number(player.potential))),99);
});
