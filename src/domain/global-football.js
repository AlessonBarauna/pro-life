(function(root){
  "use strict";
  const seed=root.ProLifeGlobalFootballSeed||(typeof require==="function"?require("../data/global-football-seed.js"):null)||{version:1,baseYear:2026,leagues:[],clubs:[],players:[]};
  const CORE=["pace","finish","pass","defense","strength","stamina"],clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const initCache=new WeakMap(),clubIndexCache=new WeakMap(),diagnosticsCounters={initFullPasses:0};
  function hash(value){let h=2166136261;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function seasonOf(s){const value=Number(s?.season);return Number.isFinite(value)&&value>=1900?value:Number(seed.baseYear||2026);}
  function slug(value){return String(value||"club").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"").slice(0,60)||"club";}
  // Codigo -> [nome canonico pt-BR sem acento (igual ao usado nas Copas), ...aliases]
  const NATIONS={
    ESP:["Espanha","Spain","Espana"],ENG:["Inglaterra","England"],ITA:["Italia","Italy"],GER:["Alemanha","Germany"],FRA:["Franca","France"],POR:["Portugal"],NED:["Holanda","Netherlands","Paises Baixos"],
    BEL:["Belgica","Belgium"],CRO:["Croacia","Croatia"],SUI:["Suica","Switzerland"],AUT:["Austria"],DEN:["Dinamarca","Denmark"],NOR:["Noruega","Norway"],SWE:["Suecia","Sweden"],FIN:["Finlandia","Finland"],ISL:["Islandia","Iceland"],
    POL:["Polonia","Poland"],CZE:["Republica Tcheca","Czech Republic","Czechia","Tchequia"],SVK:["Eslovaquia","Slovakia"],SVN:["Eslovenia","Slovenia"],HUN:["Hungria","Hungary"],ROU:["Romenia","Romania"],SRB:["Servia","Serbia"],
    UKR:["Ucrania","Ukraine"],TUR:["Turquia","Turkey","Turkiye"],SCO:["Escocia","Scotland"],WAL:["Gales","Wales"],IRL:["Irlanda","Ireland"],NIR:["Irlanda do Norte","Northern Ireland"],GRE:["Grecia","Greece"],ALB:["Albania"],
    GEO:["Georgia"],BIH:["Bosnia e Herzegovina","Bosnia and Herzegovina","Bosnia"],KOS:["Kosovo"],MKD:["Macedonia do Norte","North Macedonia"],MNE:["Montenegro"],BUL:["Bulgaria"],ARM:["Armenia"],LUX:["Luxemburgo","Luxembourg"],
    ARG:["Argentina"],URU:["Uruguai","Uruguay"],COL:["Colombia"],ECU:["Equador","Ecuador"],PAR:["Paraguai","Paraguay"],CHI:["Chile"],PER:["Peru"],VEN:["Venezuela"],BOL:["Bolivia"],
    MEX:["Mexico"],USA:["Estados Unidos","United States","USA","EUA"],CAN:["Canada"],CRC:["Costa Rica"],PAN:["Panama"],JAM:["Jamaica"],HAI:["Haiti"],CUW:["Curacao"],SUR:["Suriname"],
    MAR:["Marrocos","Morocco"],SEN:["Senegal"],CIV:["Costa do Marfim","Ivory Coast","Cote d'Ivoire"],ALG:["Argelia","Algeria"],EGY:["Egito","Egypt"],TUN:["Tunisia"],GHA:["Gana","Ghana"],NGA:["Nigeria"],CMR:["Camaroes","Cameroon"],
    MLI:["Mali"],COD:["RD Congo","DR Congo","Congo DR"],GUI:["Guine","Guinea"],GAB:["Gabao","Gabon"],BFA:["Burkina Faso"],CPV:["Cabo Verde","Cape Verde"],ZAM:["Zambia"],RSA:["Africa do Sul","South Africa"],BEN:["Benin"],TOG:["Togo"],
    JPN:["Japao","Japan"],KOR:["Coreia do Sul","South Korea","Korea Republic"],AUS:["Australia"],IRN:["Ira","Iran"],KSA:["Arabia Saudita","Saudi Arabia"],NZL:["Nova Zelandia","New Zealand"],ISR:["Israel"],UZB:["Uzbequistao","Uzbekistan"],IRQ:["Iraque","Iraq"],QAT:["Catar","Qatar"],JOR:["Jordania","Jordan"],GAM:["Gambia"],ZIM:["Zimbabue","Zimbabwe"],MOZ:["Mocambique","Mozambique"],EQG:["Guine Equatorial","Equatorial Guinea"],ANG:["Angola"],
    BRA:["Brasil","Brazil"],GNB:["Guine-Bissau","Guinea-Bissau"],IDN:["Indonesia"],RUS:["Russia"],CYP:["Chipre","Cyprus"],EST:["Estonia"],BDI:["Burundi"],TRI:["Trinidad e Tobago","Trinidad and Tobago"],PUR:["Porto Rico","Puerto Rico"],MTN:["Mauritania"],MAD:["Madagascar"],LVA:["Letonia","Latvia"],LTU:["Lituania","Lithuania"],LBN:["Libano","Lebanon"],HON:["Honduras"],FRO:["Ilhas Faroe","Faroe Islands"],DOM:["Republica Dominicana","Dominican Republic"]
  };
  function plain(value){return String(value||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().trim();}
  const NATION_NAMES={},NATION_ALIASES={brazil:"brasil",brasil:"brasil"};
  for(const [code,list] of Object.entries(NATIONS)){NATION_NAMES[code]=list[0];for(const alias of list)NATION_ALIASES[plain(alias)]=plain(list[0]);}
  function normalizedNationality(value){const key=plain(value);return NATION_ALIASES[key]||key;}
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function state(s){
    if(!s.globalFootball||typeof s.globalFootball!=="object")s.globalFootball={version:1,baseYear:Number(seed.baseYear||2026),leagues:[],clubs:[],retirements:[],processedSeasons:{},packs:{}};
    const g=s.globalFootball;g.version=1;g.baseYear=Number(g.baseYear||seed.baseYear||2026);
    if(!Array.isArray(g.leagues))g.leagues=[];if(!Array.isArray(g.clubs))g.clubs=[];if(!Array.isArray(g.retirements))g.retirements=[];if(!g.processedSeasons||typeof g.processedSeasons!=="object")g.processedSeasons={};if(!g.packs||typeof g.packs!=="object"||Array.isArray(g.packs))g.packs={};
    return g;
  }
  function addUnique(target,items){const ids=new Set(target.map(item=>item?.id));for(const item of items||[])if(item?.id&&!ids.has(item.id)){target.push(clone(item));ids.add(item.id);}}
  function cacheKey(s,delta=0){const g=s.globalFootball;return `${seasonOf(s)}|${(s.internationalPlayers||[]).length+delta}|${(s.clubs||[]).length}|${(s.clubs||[]).reduce((sum,club)=>sum+(club.roster?.length||0),0)}|${s.clubId||""}|${g?.clubs?.length||0}|${g?.leagues?.length||0}`;}
  function isFresh(s,delta=0){const cached=initCache.get(s);return !!cached&&cached.g===s.globalFootball&&cached.key===cacheKey(s,delta);}
  function markFresh(s){initCache.set(s,{g:s.globalFootball,key:cacheKey(s)});}
  function catalogClub(s,id){
    const g=state(s),local=s.clubs||[];let entry=clubIndexCache.get(s);
    if(!entry||entry.g!==g||entry.local!==local||entry.localLength!==local.length||entry.globalLength!==g.clubs.length){
      entry={g,local,localLength:local.length,globalLength:g.clubs.length,map:new Map(),names:new Map()};
      for(const club of local)if(club?.id&&!entry.map.has(club.id))entry.map.set(club.id,club);
      for(const club of g.clubs)if(club?.id&&!entry.map.has(club.id))entry.map.set(club.id,club);
      for(const club of [...local,...g.clubs])if(club?.id&&!club.generated)for(const label of [club.name,club.shortName]){const key=clubKey(label);if(key&&!entry.names.has(key))entry.names.set(key,club);}
      clubIndexCache.set(s,entry);
    }
    return id===undefined?null:entry.map.get(id)||null;
  }
  function clubKey(value){return plain(value).replace(/[^a-z0-9]+/g,"");}
  function clubByName(s,name){catalogClub(s,null);return clubIndexCache.get(s)?.names.get(clubKey(name))||null;}
  function ensureExternalClub(s,player){
    if(player.clubId&&catalogClub(s,player.clubId))return catalogClub(s,player.clubId);
    const name=String(player.externalClub||player.club||"").trim();if(!name)return null;
    const known=clubByName(s,name);if(known){player.clubId=known.id;return known;}
    const g=state(s),id=player.clubId||`gf_ext_${hash(name).toString(36)}_${slug(name)}`,found=g.clubs.find(club=>club.id===id);
    if(found){player.clubId=id;return found;}
    const club={id,name,shortName:name.slice(0,24),country:player.nationality||"Exterior",leagueId:player.leagueId||null,division:1,reputation:clamp(Number(player.ovr||player.overall||70),20,100),strength:clamp(Number(player.ovr||player.overall||70),20,100),budget:0,active:true,generated:true};
    g.clubs.push(club);player.clubId=id;return club;
  }
  // Jogadores vindos dos packs globais mantem o objeto completo em runtime,
  // mas omitem do JSON somente campos default que normalizePlayer reconstr?i.
  // Campos alterados durante a carreira continuam sendo serializados normalmente.
  function installCompactExternalSerialization(player){
    if(
      !player ||
      player.external!==true ||
      !String(player.id||"").startsWith("gf_p_")
    ) return player;

    Object.defineProperty(player,"toJSON",{
      configurable:true,
      writable:true,
      enumerable:false,
      value:function(){
        const out={};

        for(const [key,value] of Object.entries(this)){
          out[key]=value;
        }

        const overall=Number(
          this.ovr ?? this.overall
        );

        // overall e apenas espelho de ovr.
        if(
          Number.isFinite(overall) &&
          Number(out.overall)===Number(out.ovr)
        ){
          delete out.overall;
        }

        // Arrays vazios sao defaults reconstruidos no load.
        if(
          Array.isArray(out.secondaryPositions) &&
          out.secondaryPositions.length===0
        ){
          delete out.secondaryPositions;
        }

        if(
          Array.isArray(out.clubHistory) &&
          out.clubHistory.length===0
        ){
          delete out.clubHistory;
        }

        // Estado ativo e o default.
        if(out.status==="active"){
          delete out.status;
        }

        if(out.active===true){
          delete out.active;
        }

        // peakOvr igual ao GER atual nao carrega informacao nova.
        if(
          Number.isFinite(overall) &&
          Number(out.peakOvr)===overall
        ){
          delete out.peakOvr;
        }

        // O nome do clube e recuperado por clubId no normalize.
        if(out.clubId && out.externalClub){
          delete out.externalClub;
        }

        // Os seis atributos criados automaticamente com o mesmo GER
        // podem ser reconstruidos. Se qualquer atributo evoluiu,
        // o objeto inteiro e preservado.
        if(
          out.attrs &&
          typeof out.attrs==="object" &&
          CORE.every(
            key =>
              Number(out.attrs[key])===overall
          )
        ){
          delete out.attrs;
        }

        return out;
      }
    });

    return player;
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
    if(!Array.isArray(player.clubHistory))player.clubHistory=[];player.peakOvr=Math.max(Number(player.peakOvr||0),overall);installCompactExternalSerialization(player);return player;
  }
  const PACK_CODES=["eng","esp","ita","ger","fra","por","ned","bel","aut","sui","sco","den","swe","nor","pol","rou","irl","ger3"],expandedPacks=new Map();
  function loadedPacks(){
    if(typeof require==="function")for(const code of PACK_CODES){try{require(`../data/global-football-eur-${code}.js`);}catch(error){if(error?.code!=="MODULE_NOT_FOUND")throw error;}}
    return root.ProLifeGlobalFootballPacks||[];
  }
  function shortNameOf(name){const parts=String(name).trim().split(/\s+/);return parts.length<2?String(name).trim():`${parts[0][0]}. ${parts.slice(1).join(" ")}`;}
  // Linha de jogador: "Nome|AnoNasc|COD|POS|GER|POT[|Nome curto]"; clube: [chave,nome,curto,reputacao,forca,[linhas]]
  function expandPack(pack){
    const cacheKeyOfPack=`${pack.id}@${pack.version}`;if(expandedPacks.has(cacheKeyOfPack))return expandedPacks.get(cacheKeyOfPack);
    const [leagueKey,leagueName,leagueShort,country,leagueReputation]=pack.league,leagueId=`gf_${leagueKey}`,clubs=[],players=[],ids=new Set();
    for(const [clubKeyId,clubName,clubShort,reputation,strength,rows] of pack.clubs){
      const clubId=`gf_${clubKeyId}`;
      clubs.push({id:clubId,name:clubName,shortName:clubShort,country,leagueId,division:1,reputation,strength,budget:Math.round(Math.pow(reputation/100,6)*400)*1000000,active:true});
      for(const row of rows){
        const [name,birth,code,pos,ovr,pot,short]=row.split("|"),birthYear=Number(birth);let id=`gf_p_${slug(name)}_${birthYear}`;if(ids.has(id))id=`${id}_${clubKeyId}`;ids.add(id);
        players.push({id,name,shortName:short||shortNameOf(name),nationality:NATION_NAMES[code]||code,birthYear,pos,ovr:Number(ovr),potential:Number(pot),clubId,leagueId});
      }
    }
    const expanded={id:pack.id,version:pack.version,leagues:[{id:leagueId,name:leagueName,shortName:leagueShort,country,level:1,clubCount:clubs.length,reputation:leagueReputation,continent:"Europa",confederation:"UEFA",active:true}],clubs,players};
    expandedPacks.set(cacheKeyOfPack,expanded);return expanded;
  }
  function packInfo(){return loadedPacks().map(expandPack).map(pack=>({id:pack.id,version:pack.version,leagues:pack.leagues.length,clubs:pack.clubs.length,players:pack.players.length}));}
  function identityKey(player){return `${plain(player?.name)}|${player?.birthYear??""}`;}
  function playerFromRow(row){return {id:row.id,name:row.name,shortName:row.shortName,nationality:row.nationality,birthYear:row.birthYear,pos:row.pos,secondaryPositions:[],ovr:row.ovr,overall:row.ovr,potential:row.potential,clubId:row.clubId,leagueId:row.leagueId,status:"active",active:true,reputation:Math.max(40,row.ovr-12),external:true,marketStatus:"external"};}
  // Importa os pacotes pendentes uma unica vez por estado (g.packs guarda a versao). Dedup por id e por nome+ano.
  function importPacks(s,g,known){
    const pending=loadedPacks().map(expandPack).filter(pack=>Number(g.packs[pack.id]||0)<pack.version);if(!pending.length)return 0;
    const keys=new Set();for(const club of s.clubs||[])for(const player of club.roster||[])keys.add(identityKey(player));for(const player of s.internationalPlayers)keys.add(identityKey(player));
    let added=0;
    for(const pack of pending){
      addUnique(g.leagues,pack.leagues);addUnique(g.clubs,pack.clubs);
      for(const row of pack.players){const key=identityKey(row);if(known.has(row.id)||keys.has(key))continue;s.internationalPlayers.push(playerFromRow(row));known.add(row.id);keys.add(key);added++;}
      g.packs[pack.id]=pack.version;
    }
    return added;
  }
  function init(s){
    const g=state(s),cached=initCache.get(s);
    if(cached&&cached.g===g&&cached.key===cacheKey(s))return g;
    diagnosticsCounters.initFullPasses++;
    addUnique(g.leagues,seed.leagues);addUnique(g.clubs,seed.clubs);
    if(!Array.isArray(s.internationalPlayers))s.internationalPlayers=[];
    const known=new Set();for(const club of s.clubs||[])for(const player of club.roster||[])if(player?.id)known.add(player.id);for(const player of s.internationalPlayers)if(player?.id)known.add(player.id);
    for(const player of seed.players||[])if(!known.has(player.id)){s.internationalPlayers.push(clone(player));known.add(player.id);}
    importPacks(s,g,known);
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
  function importData(s,data){
    init(s);if(!data||typeof data!=="object")throw Error("Dataset global invalido.");
    const g=state(s);addUnique(g.leagues,data.leagues||[]);addUnique(g.clubs,data.clubs||[]);
    const known=new Set(allPlayers(s).map(player=>player.id)),added=[];
    for(const player of data.players||[]){if(!player?.id||known.has(player.id))continue;s.internationalPlayers.push(clone(player));normalizePlayer(s,s.internationalPlayers.at(-1));known.add(player.id);added.push(player.id);}
    return {players:added.length,clubs:(data.clubs||[]).length,leagues:(data.leagues||[]).length};
  }
  function diagnostics(){return {...diagnosticsCounters};}
  const api={VERSION:1,diagnostics,packInfo,clubByName,nationName:code=>NATION_NAMES[code]||null,init,allPlayers,playerById,clubById,leagueById,playersByNationality,playersByClub,playersByLeague,activePlayers,eligibleNationalTeamPlayers,registerPlayer,transferPlayer,retirePlayer,rollSeason,importData,normalizedNationality,seasonOf};
  root.ProLifeGlobalFootball=api;if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
