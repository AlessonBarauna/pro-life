(function(root){
  "use strict";
  const seed=root.ProLifeGlobalFootballSeed||(typeof require==="function"?require("../data/global-football-seed.js"):null)||{version:1,baseYear:2026,leagues:[],clubs:[],players:[]};
  const CORE=["pace","finish","pass","defense","strength","stamina"],clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const initCache=new WeakMap(),clubIndexCache=new WeakMap(),diagnosticsCounters={initFullPasses:0};
  function hash(value){let h=2166136261;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function seasonOf(s){const value=Number(s?.season);return Number.isFinite(value)&&value>=1900?value:Number(seed.baseYear||2026);}
  function slug(value){return String(value||"club").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"").slice(0,60)||"club";}
  function normalizedNationality(value){const key=String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();return ({brazil:"brasil",brasil:"brasil",france:"franca",franca:"franca",spain:"espanha",espanha:"espanha",germany:"alemanha",alemanha:"alemanha",netherlands:"holanda",holanda:"holanda",italy:"italia",italia:"italia",portugal:"portugal"})[key]||key;}
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function state(s){
    if(!s.globalFootball||typeof s.globalFootball!=="object")s.globalFootball={version:1,baseYear:Number(seed.baseYear||2026),leagues:[],clubs:[],retirements:[],processedSeasons:{}};
    const g=s.globalFootball;g.version=1;g.baseYear=Number(g.baseYear||seed.baseYear||2026);
    if(!Array.isArray(g.leagues))g.leagues=[];if(!Array.isArray(g.clubs))g.clubs=[];if(!Array.isArray(g.retirements))g.retirements=[];if(!g.processedSeasons||typeof g.processedSeasons!=="object")g.processedSeasons={};
    return g;
  }
  function addUnique(target,items){const ids=new Set(target.map(item=>item?.id));for(const item of items||[])if(item?.id&&!ids.has(item.id)){target.push(clone(item));ids.add(item.id);}}
  function cacheKey(s,delta=0){const g=s.globalFootball;return `${seasonOf(s)}|${(s.internationalPlayers||[]).length+delta}|${(s.clubs||[]).length}|${(s.clubs||[]).reduce((sum,club)=>sum+(club.roster?.length||0),0)}|${s.clubId||""}|${g?.clubs?.length||0}|${g?.leagues?.length||0}`;}
  function isFresh(s,delta=0){const cached=initCache.get(s);return !!cached&&cached.g===s.globalFootball&&cached.key===cacheKey(s,delta);}
  function markFresh(s){initCache.set(s,{g:s.globalFootball,key:cacheKey(s)});}
  function catalogClub(s,id){
    const g=state(s),local=s.clubs||[];let entry=clubIndexCache.get(s);
    if(!entry||entry.g!==g||entry.local!==local||entry.localLength!==local.length||entry.globalLength!==g.clubs.length){
      entry={g,local,localLength:local.length,globalLength:g.clubs.length,map:new Map()};
      for(const club of local)if(club?.id&&!entry.map.has(club.id))entry.map.set(club.id,club);
      for(const club of g.clubs)if(club?.id&&!entry.map.has(club.id))entry.map.set(club.id,club);
      clubIndexCache.set(s,entry);
    }
    return entry.map.get(id)||null;
  }
  function ensureExternalClub(s,player){
    if(player.clubId&&catalogClub(s,player.clubId))return catalogClub(s,player.clubId);
    const name=String(player.externalClub||player.club||"").trim();if(!name)return null;
    const g=state(s),id=player.clubId||`gf_ext_${hash(name).toString(36)}_${slug(name)}`,found=g.clubs.find(club=>club.id===id);
    if(found){player.clubId=id;return found;}
    const club={id,name,shortName:name.slice(0,24),country:player.nationality||"Exterior",leagueId:player.leagueId||null,division:1,reputation:clamp(Number(player.ovr||player.overall||70),20,100),strength:clamp(Number(player.ovr||player.overall||70),20,100),budget:0,active:true,generated:true};
    g.clubs.push(club);player.clubId=id;return club;
  }
  function normalizePlayer(s,player,context={}){
    if(!player||typeof player!=="object")return player;
    const season=seasonOf(s),attributeValues=CORE.map(key=>Number(player.attrs?.[key])).filter(Number.isFinite),derivedOverall=attributeValues.length?attributeValues.reduce((sum,value)=>sum+value,0)/attributeValues.length:70,overall=clamp(Number(player.ovr??player.overall??derivedOverall),20,100);
    player.id=String(player.id||context.id||"");player.name=String(player.name||"Jogador sem nome");player.shortName=String(player.shortName||player.name);
    player.nationality=String(player.nationality||"Brasil");player.pos=["GOL","DEF","MEI","ATA"].includes(player.pos)?player.pos:"MEI";
    if(!Array.isArray(player.secondaryPositions))player.secondaryPositions=[];
    if(!Number.isFinite(Number(player.birthYear)))player.birthYear=Number(player.birthDate?.year)||season-Math.max(14,Number(player.age||25));
    player.age=context.preserveAge?Math.max(14,Number(player.age||season-Number(player.birthYear))):Math.max(15,season-Number(player.birthYear));player.ovr=overall;player.overall=overall;player.potential=clamp(Number(player.potential??overall+2),overall,100);
    player.status=player.status==="retired"||player.retired?"retired":"active";player.active=player.status==="active";player.reputation=clamp(Number(player.reputation??overall-15),0,100);
    if(!player.attrs||typeof player.attrs!=="object")player.attrs={};for(const key of CORE)player.attrs[key]=clamp(Number(player.attrs[key]??overall),0,100);
    if(context.club){player.clubId=context.club.id;player.leagueId=context.club.leagueId||null;}
    const club=catalogClub(s,player.clubId)||ensureExternalClub(s,player);if(club){player.clubId=club.id;player.leagueId=club.leagueId||player.leagueId||null;player.externalClub=club.name;}
    if(!Array.isArray(player.clubHistory))player.clubHistory=[];player.peakOvr=Math.max(Number(player.peakOvr||0),overall);return player;
  }
  function init(s){
    const g=state(s),cached=initCache.get(s);
    if(cached&&cached.g===g&&cached.key===cacheKey(s))return g;
    diagnosticsCounters.initFullPasses++;
    addUnique(g.leagues,seed.leagues);addUnique(g.clubs,seed.clubs);
    if(!Array.isArray(s.internationalPlayers))s.internationalPlayers=[];
    const known=new Set();for(const club of s.clubs||[])for(const player of club.roster||[])if(player?.id)known.add(player.id);for(const player of s.internationalPlayers)if(player?.id)known.add(player.id);
    for(const player of seed.players||[])if(!known.has(player.id)){s.internationalPlayers.push(clone(player));known.add(player.id);}
    const legacyPool=root.ProLifeInternationalPool||(typeof require==="function"?require("./international-pool.js"):null);
    if(legacyPool?.init)legacyPool.init(s);
    for(const club of s.clubs||[]){club.shortName??=club.name;club.country??="Brasil";club.division??=Number(String(club.leagueId||"").match(/\d+/)?.[0]||1);club.reputation??=Number(club.structure||club.level||50);club.strength??=Number(club.structure||club.level||50);club.active??=true;for(const player of club.roster||[])normalizePlayer(s,player,{club,preserveAge:true});}
    for(const player of s.internationalPlayers)normalizePlayer(s,player);
    if(s.person){s.person.id="hero";normalizePlayer(s,s.person,{club:(s.clubs||[]).find(club=>club.id===s.clubId)||null,preserveAge:true});}
    markFresh(s);
    return g;
  }
  function allPlayers(s){init(s);const out=[],seen=new Set(),add=player=>{if(player?.id&&!seen.has(player.id)){seen.add(player.id);out.push(player);}};for(const club of s.clubs||[])for(const player of club.roster||[])add(player);for(const player of s.internationalPlayers||[])add(player);if(s.person)add(s.person);return out;}
  function playerById(s,id){return allPlayers(s).find(player=>player.id===id)||null;}
  function clubById(s,id){init(s);return catalogClub(s,id);}
  function leagueById(s,id){init(s);const local=(s.leagues||[]).find(league=>league.id===id);if(local)return {...local,country:local.country||"Brasil",level:local.level||Number(String(local.id||"").match(/\d+/)?.[0]||1),clubCount:(s.clubs||[]).filter(club=>club.leagueId===id).length,reputation:local.reputation||75,continent:local.continent||"America do Sul",confederation:local.confederation||"CONMEBOL",active:local.active!==false};return state(s).leagues.find(league=>league.id===id)||null;}
  function activePlayers(s){return allPlayers(s).filter(player=>player.status!=="retired"&&player.active!==false);}
  function playersByNationality(s,nationality){const wanted=normalizedNationality(nationality);return allPlayers(s).filter(player=>normalizedNationality(player.nationality)===wanted);}
  function playersByClub(s,clubId){return allPlayers(s).filter(player=>player.clubId===clubId);}
  function playersByLeague(s,leagueId){return allPlayers(s).filter(player=>player.leagueId===leagueId);}
  function eligibleNationalTeamPlayers(s,nationality){return playersByNationality(s,nationality).filter(player=>player.status!=="retired"&&player.active!==false&&Number(player.age||0)<=45&&!player.injury&&Number(player.suspension||0)<=0);}
  function registerPlayer(s,player){
    if(!s.globalFootball)init(s);if(!Array.isArray(s.internationalPlayers))s.internationalPlayers=[];
    for(const club of s.clubs||[]){const existing=(club.roster||[]).find(candidate=>candidate.id===player?.id);if(existing)return normalizePlayer(s,existing,{club,preserveAge:true});}
    const pool=s.internationalPlayers,existing=pool.find(candidate=>candidate.id===player?.id);
    // O chamador pode ter acabado de inserir o jogador no fim do pool: nesse caso o cache estava fresco antes dele.
    const wasFresh=isFresh(s,existing&&existing===pool.at(-1)?-1:0);
    if(!existing)pool.push(player);
    const normalized=normalizePlayer(s,existing||player);
    if(wasFresh)markFresh(s);
    return normalized;
  }
  function transferPlayer(s,playerId,clubId){
    init(s);const player=playerById(s,playerId),club=clubById(s,clubId);if(!player||!club||player.status==="retired")return null;
    const fromId=player.clubId||null;if(fromId===clubId)return player;
    player.clubHistory.push({season:seasonOf(s),fromClubId:fromId,toClubId:clubId});player.clubHistory=player.clubHistory.slice(-30);player.clubId=clubId;player.leagueId=club.leagueId||null;player.externalClub=club.name;player.club=club.name;
    for(const local of s.clubs||[])local.roster=local.roster?.filter(candidate=>candidate.id!==playerId)||[];
    const localTarget=(s.clubs||[]).find(candidate=>candidate.id===clubId);if(localTarget&&!localTarget.roster.some(candidate=>candidate.id===playerId))localTarget.roster.push(player);
    return player;
  }
  function retirePlayer(s,playerId,season=seasonOf(s),reason="idade"){
    init(s);const player=playerById(s,playerId);if(!player||player.id==="hero"||player.status==="retired")return false;
    player.status="retired";player.active=false;player.retired=true;player.retiredSeason=season;
    const g=state(s);if(!g.retirements.some(item=>item.playerId===player.id))g.retirements.unshift({playerId:player.id,name:player.name,season,age:player.age,clubId:player.clubId||null,reason});g.retirements=g.retirements.slice(0,500);return true;
  }
  function rollSeason(s){
    init(s);const season=seasonOf(s),g=state(s);if(g.processedSeasons[String(season)])return [];
    g.processedSeasons[String(season)]=true;const retired=[];
    for(const player of s.internationalPlayers||[]){normalizePlayer(s,player);if(player.status==="retired")continue;const threshold=player.pos==="GOL"?39:36,hardCap=player.pos==="GOL"?45:42;if(player.age>=hardCap||(player.age>=threshold&&hash(`${player.id}|retire|${season}`)/4294967296<Math.min(.75,.08+(player.age-threshold)*.13))){if(retirePlayer(s,player.id,season,"idade"))retired.push(player.id);}}
    return retired;
  }
  function importData(s,data){init(s);if(!data||typeof data!=="object")throw Error("Dataset global invalido.");addUnique(state(s).leagues,data.leagues||[]);addUnique(state(s).clubs,data.clubs||[]);const added=[];for(const player of data.players||[]){if(!player?.id||playerById(s,player.id))continue;s.internationalPlayers.push(clone(player));normalizePlayer(s,s.internationalPlayers.at(-1));added.push(player.id);}return {players:added.length,clubs:(data.clubs||[]).length,leagues:(data.leagues||[]).length};}
  function diagnostics(){return {...diagnosticsCounters};}
  const api={VERSION:1,diagnostics,init,allPlayers,playerById,clubById,leagueById,playersByNationality,playersByClub,playersByLeague,activePlayers,eligibleNationalTeamPlayers,registerPlayer,transferPlayer,retirePlayer,rollSeason,importData,normalizedNationality,seasonOf};
  root.ProLifeGlobalFootball=api;if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
