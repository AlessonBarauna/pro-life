(function(root){
  "use strict";
  const seed=root.ProLifeGlobalFootballSeed||(typeof require==="function"?require("../data/global-football-seed.js"):null)||{version:1,baseYear:2026,leagues:[],clubs:[],players:[]};
  const CORE=["pace","finish","pass","defense","strength","stamina"],clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const initCache=new WeakMap(),clubIndexCache=new WeakMap(),prestigeCache=new WeakMap(),diagnosticsCounters={initFullPasses:0};
  const CLUB_METADATA={
    // Canonical pack id confirmed in global-football-eur-rou.js.
    gf_craiova:{city:"Craiova",region:"Dolj"}
  };
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
  Object.assign(NATIONS,{
    AFG:["Afeganistao","Afghanistan"],AND:["Andorra"],ATG:["Antigua e Barbuda","Antigua and Barbuda"],AZE:["Azerbaijao","Azerbaijan"],BAN:["Bangladesh"],BRB:["Barbados"],BER:["Bermudas","Bermuda"],BLR:["Belarus"],CAF:["Republica Centro-Africana","Central African Republic"],CHA:["Chade","Chad"],CHN:["China","China PR"],TPE:["Taiwan","Chinese Taipei"],COM:["Comores","Comoros"],CGO:["Congo","Republic of the Congo"],CUB:["Cuba"],ERI:["Eritreia","Eritrea"],ESA:["El Salvador"],GLP:["Guadalupe","Guadeloupe"],GRL:["Groenlandia","Greenland"],GRN:["Granada","Grenada"],GUA:["Guatemala"],GUY:["Guiana","Guyana"],HKG:["Hong Kong"],IND:["India"],KAZ:["Cazaquistao","Kazakhstan"],KEN:["Quenia","Kenya"],PRK:["Coreia do Norte","Korea DPR","North Korea"],LBR:["Liberia"],LBY:["Libia","Libya"],LIE:["Liechtenstein"],MDA:["Moldavia","Moldova"],MLT:["Malta"],MTQ:["Martinica","Martinique"],MWI:["Malaui","Malawi"],NAM:["Namibia"],NIG:["Niger"],OMA:["Oma","Oman"],PAK:["Paquistao","Pakistan"],PHI:["Filipinas","Philippines"],PLE:["Palestina","Palestine"],RWA:["Ruanda","Rwanda"],SKN:["Sao Cristovao e Nevis","St. Kitts and Nevis"],LCA:["Santa Lucia","St. Lucia"],SLE:["Serra Leoa","Sierra Leone"],SOM:["Somalia"],SRI:["Sri Lanka"],SSD:["Sudao do Sul","South Sudan"],SYR:["Siria","Syria"],TAN:["Tanzania"],UAE:["Emirados Arabes Unidos","United Arab Emirates"],UGA:["Uganda"],VAN:["Vanuatu"],YEM:["Iemen","Yemen"]
  });
  NATIONS.NED.push("Holland");NATIONS.CPV.push("Cape Verde Islands");NATIONS.CUW.push("Curaçao");
  const PT_BR_LABELS={
    afeganistao:"Afeganistão",africa_do_sul:"África do Sul",albania:"Albânia",alemanha:"Alemanha",argelia:"Argélia",arabia_saudita:"Arábia Saudita",armenia:"Armênia",austria:"Áustria",azerbaijao:"Azerbaijão",belgica:"Bélgica",bosnia_e_herzegovina:"Bósnia e Herzegovina",brasil:"Brasil",camaroes:"Camarões",canada:"Canadá",cazaquistao:"Cazaquistão",chade:"Chade",chipre:"Chipre",colombia:"Colômbia",coreia_do_norte:"Coreia do Norte",coreia_do_sul:"Coreia do Sul",costa_do_marfim:"Costa do Marfim",croacia:"Croácia",curacao:"Curaçao",dinamarca:"Dinamarca",egito:"Egito",emirados_arabes_unidos:"Emirados Árabes Unidos",equador:"Equador",escocia:"Escócia",eslovaquia:"Eslováquia",eslovenia:"Eslovênia",espanha:"Espanha",estonia:"Estônia",etiopia:"Etiópia",finlandia:"Finlândia",franca:"França",gabao:"Gabão",gales:"País de Gales",georgia:"Geórgia",grecia:"Grécia",groenlandia:"Groenlândia",guiana:"Guiana",guine:"Guiné",guine_bissau:"Guiné-Bissau",guine_equatorial:"Guiné Equatorial",haiti:"Haiti",holanda:"Países Baixos",hungria:"Hungria",iemen:"Iêmen",india:"Índia",indonesia:"Indonésia",ira:"Irã",iraque:"Iraque",irlanda:"Irlanda",irlanda_do_norte:"Irlanda do Norte",islandia:"Islândia",italia:"Itália",japao:"Japão",jordania:"Jordânia",letonia:"Letônia",libano:"Líbano",libia:"Líbia",lituania:"Lituânia",luxemburgo:"Luxemburgo",macedonia_do_norte:"Macedônia do Norte",malaui:"Malaui",marrocos:"Marrocos",martinica:"Martinica",mexico:"México",mocambique:"Moçambique",moldavia:"Moldávia",noruega:"Noruega",nova_zelandia:"Nova Zelândia",oma:"Omã",panama:"Panamá",paquistao:"Paquistão",paraguai:"Paraguai",paises_baixos:"Países Baixos",polonia:"Polônia",porto_rico:"Porto Rico",quenia:"Quênia",republica_centro_africana:"República Centro-Africana",republica_dominicana:"República Dominicana",republica_tcheca:"Tchéquia",romenia:"Romênia",russia:"Rússia",sao_cristovao_e_nevis:"São Cristóvão e Névis",servia:"Sérvia",siria:"Síria",sri_lanka:"Sri Lanka",sudao_do_sul:"Sudão do Sul",suecia:"Suécia",suica:"Suíça",tanzania:"Tanzânia",tchequia:"Tchéquia",tunisia:"Tunísia",turquia:"Turquia",ucrania:"Ucrânia",uzbequistao:"Uzbequistão",zimbabue:"Zimbábue"
  };
  function plain(value){return String(value||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().trim();}
  const NATION_NAMES={},NATION_ALIASES={brazil:"brasil",brasil:"brasil"};
  const nationalityIdentityKey=value=>plain(value).replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
  for(const [code,list] of Object.entries(NATIONS)){const identity=plain(list[0]);NATION_NAMES[code]=PT_BR_LABELS[nationalityIdentityKey(identity)]||list[0];NATION_ALIASES[plain(code)]=identity;for(const alias of list)NATION_ALIASES[plain(alias)]=identity;}
  function normalizedNationality(value){const key=plain(value);return NATION_ALIASES[key]||key;}
  function resolveNationality(value,fallback=null){const identity=normalizedNationality(value),code=Object.keys(NATIONS).find(key=>plain(NATIONS[key][0])===identity);if(code)return NATION_NAMES[code];return fallback===null?null:(resolveNationality(fallback,null)||"Brasil");}
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
  // Jogadores de packs globais (gf_p_*) e a base/jovens gerados do FC 27 (fc27_y_*) usam os mesmos defaults compactos.
  const compactId=id=>{const v=String(id||"");return v.startsWith("gf_p_")||v.startsWith("fc27_y_");};
  function installCompactExternalSerialization(player,s){
    if(
      !player ||
      player.external!==true ||
      !compactId(player.id)
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
        const isLocalRosterPlayer =
          /^c(?:[0-9]|[1-7][0-9])$/.test(String(out.clubId || ""));

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

        // O pool internacional restaura estes defaults no carregamento.
        // Jogadores em elencos brasileiros mantêm o formato completo exigido
        // pela validação rígida do save.
        if(!isLocalRosterPlayer){
          if(Number(out.appearances)===0) delete out.appearances;
          if(Number(out.condition)===100) delete out.condition;
          if(Number(out.suspension)===0) delete out.suspension;
          if(Number(out.injury)===0) delete out.injury;
          if(Number(out.morale)===50) delete out.morale;
          if(Number(out.discipline)===70) delete out.discipline;
          if(Number(out.goals)===0) delete out.goals;
          if(Number(out.minutes)===0) delete out.minutes;
          if(out.external===true) delete out.external;
          if(out.marketStatus==="external") delete out.marketStatus;
          if(Number(out.reputation)===Math.max(40,overall-12)) delete out.reputation;
          if(Number(out.age)===seasonOf(s)-Number(out.birthYear)) delete out.age;
          if(out.clubId&&out.leagueId) delete out.leagueId;
          if(out.shortName===shortNameOf(out.name)) delete out.shortName;
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
        // Brazilian club rosters require complete player attributes.
        if(
          !isLocalRosterPlayer &&
          out.attrs &&
          typeof out.attrs==="object" &&
          CORE.every(key => Number(out.attrs[key])===overall)
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
    player.id=String(player.id||context.id||"");player.name=String(player.name||"Jogador sem nome");player.shortName=String(player.shortName||shortNameOf(player.name));
    player.nationality=String(player.nationality||"Brasil");player.pos=["GOL","DEF","MEI","ATA"].includes(player.pos)?player.pos:"MEI";
    if(!Array.isArray(player.secondaryPositions))player.secondaryPositions=[];
    if(!Number.isFinite(Number(player.birthYear)))player.birthYear=Number(player.birthDate?.year)||season-Math.max(14,Number(player.age||25));
    player.age=context.preserveAge?Math.max(14,Number(player.age||season-Number(player.birthYear))):Math.max(15,season-Number(player.birthYear));player.ovr=overall;player.overall=overall;player.potential=clamp(Number(player.potential??overall+2),overall,100);
    player.status=player.status==="retired"||player.retired?"retired":"active";player.active=player.status==="active";player.reputation=clamp(Number(player.reputation??(compactId(player.id)?Math.max(40,overall-12):overall-15)),0,100);
    if(compactId(player.id)){if(player.external===undefined)player.external=true;if(player.marketStatus===undefined)player.marketStatus="external";}
    if(!player.attrs||typeof player.attrs!=="object")player.attrs={};for(const key of CORE)player.attrs[key]=clamp(Number(player.attrs[key]??overall),0,100);
    if(context.club){player.clubId=context.club.id;player.leagueId=context.club.leagueId||null;}
    const club=catalogClub(s,player.clubId)||ensureExternalClub(s,player);if(club){player.clubId=club.id;player.leagueId=club.leagueId||player.leagueId||null;player.externalClub=club.name;}
    if(!Array.isArray(player.clubHistory))player.clubHistory=[];player.peakOvr=Math.max(Number(player.peakOvr||0),overall);installCompactExternalSerialization(player,s);return player;
  }
  const PACK_CODES=["eng","esp","ita","ger","fra","por","ned","bel","aut","sui","sco","den","swe","nor","pol","rou","irl","ger3"],expandedPacks=new Map();
  function loadedPacks(){
    if(typeof require==="function")for(const code of PACK_CODES){try{require(`../data/global-football-eur-${code}.js`);}catch(error){if(error?.code!=="MODULE_NOT_FOUND")throw error;}}
    if(typeof require==="function"){try{require("../data/global-football-fc27-world.js");}catch(error){if(error?.code!=="MODULE_NOT_FOUND")throw error;}}
    return root.ProLifeGlobalFootballPacks||[];
  }
  function shortNameOf(name){const parts=String(name).trim().split(/\s+/);return parts.length<2?String(name).trim():`${parts[0][0]}. ${parts.slice(1).join(" ")}`;}
  // Linha de jogador: "Nome|AnoNasc|COD|POS|GER|POT[|Nome curto]"; clube: [chave,nome,curto,reputacao,forca,[linhas]]
  function expandPack(pack){
    const cacheKeyOfPack=`${pack.id}@${pack.version}`;if(expandedPacks.has(cacheKeyOfPack))return expandedPacks.get(cacheKeyOfPack);
    const [leagueKey,leagueName,leagueShort,country,leagueReputation]=pack.league,leagueId=`gf_${leagueKey}`,clubs=[],players=[],ids=new Set();
    for(const [clubKeyId,clubName,clubShort,reputation,strength,rows,clubMeta] of pack.clubs){
      const clubId=`gf_${clubKeyId}`;
      clubs.push({id:clubId,name:clubName,shortName:clubShort,country,leagueId,division:1,reputation,strength,structure:clamp(Number(strength||reputation||50),1,100),budget:Math.round(Math.pow(reputation/100,6)*400)*1000000,active:true,...(clubMeta&&typeof clubMeta==="object"?clubMeta:{})});
      for(const row of rows){
        const [name,birth,code,pos,ovr,pot,short]=row.split("|"),birthYear=Number(birth);let id=`gf_p_${slug(name)}_${birthYear}`;if(ids.has(id))id=`${id}_${clubKeyId}`;ids.add(id);
        players.push({id,name,shortName:short||shortNameOf(name),nationality:NATION_NAMES[code]||code,birthYear,pos,ovr:Number(ovr),potential:Number(pot),clubId,leagueId});
      }
    }
    const meta=pack.meta||{},expanded={id:pack.id,version:pack.version,leagues:[{id:leagueId,name:leagueName,shortName:leagueShort,country:meta.country||country,level:Number(meta.level||1),clubCount:clubs.length,reputation:leagueReputation,continent:meta.continent||"Europa",confederation:meta.confederation||"UEFA",active:meta.active!==false,competitionEligible:meta.competitionEligible!==false,source:meta.source||"PRO-LIFE"}],clubs,players};
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
    const fc27=s.catalogVersion==="fc27_v1";
    if(!fc27){addUnique(g.leagues,seed.leagues);addUnique(g.clubs,seed.clubs);}
    if(!Array.isArray(s.internationalPlayers))s.internationalPlayers=[];
    const known=new Set();for(const club of s.clubs||[])for(const player of club.roster||[])if(player?.id)known.add(player.id);for(const player of s.internationalPlayers)if(player?.id)known.add(player.id);
    if(!fc27)for(const player of seed.players||[])if(!known.has(player.id)){s.internationalPlayers.push(clone(player));known.add(player.id);}
    if(s.catalogVersion!=="fc27_v1") importPacks(s,g,known);
    for(const league of g.leagues)league.country=resolveNationality(league.country,null)||league.country;
    for(const club of g.clubs){
      club.country=resolveNationality(club.country,null)||club.country;
      if(!Number.isFinite(Number(club.structure)))club.structure=clamp(Number(club.strength??club.reputation??50),1,100);
      const metadata=CLUB_METADATA[club.id];if(metadata)for(const [key,value] of Object.entries(metadata))if(club[key]===undefined||club[key]===null||club[key]==="")club[key]=value;
    }
    const legacyPool=root.ProLifeInternationalPool||(typeof require==="function"?require("./international-pool.js"):null);
    if(legacyPool?.init) legacyPool.init(s); // em FC27 o pool só normaliza (não insere o pool legado)
    for(const club of s.clubs||[]){club.shortName??=club.name;club.country??="Brasil";club.division??=Number(String(club.leagueId||"").match(/\d+/)?.[0]||1);club.reputation??=Number(club.structure||club.level||50);club.strength??=Number(club.structure||club.level||50);club.active??=true;for(const player of club.roster||[])normalizePlayer(s,player,{club,preserveAge:true});}
    for(const player of s.internationalPlayers)normalizePlayer(s,player);
    if(s.person){s.person.id="hero";normalizePlayer(s,s.person,{club:(s.clubs||[]).find(club=>club.id===s.clubId)||null,preserveAge:true});}
    markFresh(s);
    return g;
  }
  function allPlayers(s){init(s);const out=[],seen=new Set(),add=player=>{if(player?.id&&!seen.has(player.id)){seen.add(player.id);out.push(player);}};for(const club of s.clubs||[])for(const player of club.roster||[])add(player);for(const player of s.internationalPlayers||[])add(player);if(s.person)add(s.person);return out;}
  // 34F.17: consultas filtradas sem materializar os ~17,8 mil jogadores deduplicados a cada chamada.
  // Mesma ordem de allPlayers (elencos locais, depois internationalPlayers, depois s.person); so os jogadores que passam no filtro entram no Set de ids.
  function collectPlayers(s,predicate){init(s);const out=[],seen=new Set(),take=player=>{if(player?.id&&predicate(player)&&!seen.has(player.id)){seen.add(player.id);out.push(player);}};for(const club of s.clubs||[])for(const player of club.roster||[])take(player);for(const player of s.internationalPlayers||[])take(player);if(s.person)take(s.person);return out;}
  function findPlayer(s,id){init(s);if(!id)return null;for(const club of s.clubs||[])for(const player of club.roster||[])if(player?.id===id)return player;for(const player of s.internationalPlayers||[])if(player?.id===id)return player;return s.person?.id===id?s.person:null;}
  function nationalityCatalog(s){
    init(s);
    const raw=["Brasil",...(s.globalFootball?.leagues||[]).map(item=>item?.country),...(s.globalFootball?.clubs||[]).map(item=>item?.country),...(s.clubs||[]).map(item=>item?.country),...allPlayers(s).map(player=>player?.nationality)];
    const byIdentity=new Map();
    for(const value of raw){const name=resolveNationality(value,null);if(!name)continue;const identity=normalizedNationality(name);if(!byIdentity.has(identity))byIdentity.set(identity,{id:identity,name});}
    return [...byIdentity.values()].sort((a,b)=>plain(a.name).localeCompare(plain(b.name),"pt-BR"));
  }
  function playerById(s,id){return findPlayer(s,id);}
  function clubById(s,id){init(s);return catalogClub(s,id);}
  function leagueById(s,id){init(s);const local=(s.leagues||[]).find(league=>league.id===id);if(local)return {...local,country:local.country||"Brasil",level:local.level||Number(String(local.id||"").match(/\d+/)?.[0]||1),clubCount:(s.clubs||[]).filter(club=>club.leagueId===id).length,reputation:local.reputation||75,continent:local.continent||"America do Sul",confederation:local.confederation||"CONMEBOL",active:local.active!==false};return state(s).leagues.find(league=>league.id===id)||null;}
  function standingRank(s,club){
    if((s.clubs||[]).some(item=>item.id===club.id)){
      if(!Number(club.stats?.played||0))return null;
      const rows=(s.clubs||[]).filter(item=>item.leagueId===club.leagueId).slice().sort((a,b)=>Number(b.stats?.points||0)-Number(a.stats?.points||0)||Number(b.stats?.w||0)-Number(a.stats?.w||0)||(Number(b.stats?.gf||0)-Number(b.stats?.ga||0))-(Number(a.stats?.gf||0)-Number(a.stats?.ga||0))||String(a.name).localeCompare(String(b.name),"pt-BR"));
      const rank=rows.findIndex(item=>item.id===club.id);return rank<0?null:rank+1;
    }
    const state=s.globalFootball?.worldCompetitions?.leagues?.[club.leagueId],table=state?.table;if(!table||!table[club.id]||!Number(table[club.id]?.[0]||0))return null;
    const rows=(state.clubIds||Object.keys(table)).slice().sort((a,b)=>{const x=table[a]||[],y=table[b]||[];return Number(y[6]||0)-Number(x[6]||0)||Number(y[1]||0)-Number(x[1]||0)||(Number(y[4]||0)-Number(y[5]||0))-(Number(x[4]||0)-Number(x[5]||0))||Number(y[4]||0)-Number(x[4]||0)||String(a).localeCompare(String(b));});
    const rank=rows.indexOf(club.id);return rank<0?null:rank+1;
  }
  function recentForm(s,clubId){
    return (s.matches||[]).filter(match=>match&&[match.home,match.away].includes(clubId)).sort((a,b)=>Number(b.date||b.day||0)-Number(a.date||a.day||0)).slice(0,5).map(match=>{const home=match.home===clubId,gf=Number(home?match.hg:match.ag),ga=Number(home?match.ag:match.hg);return gf>ga?"V":gf===ga?"E":"D";}).reverse();
  }
  function clubPrestige(s,id){
    const club=clubById(s,id),league=club&&leagueById(s,club.leagueId);if(!club)return null;
    const local=(s.clubs||[]).find(item=>item.id===id),stats=local?.stats,key=[club.reputation,club.strength,club.structure,league?.reputation,club.tradition,stats?.played,stats?.points].join("|");
    let cache=prestigeCache.get(s);if(!cache){cache=new Map();prestigeCache.set(s,cache);}const prior=cache.get(id);if(prior?.key===key)return prior.value;
    const components=[];const add=(value,weight)=>{const number=Number(value);if(Number.isFinite(number))components.push([clamp(number,0,100),weight]);};
    add(club.reputation,40);add(club.strength,25);add(club.structure,15);add(league?.reputation,12);
    if(Number.isFinite(Number(club.tradition)))add(club.tradition,8);
    let score=components.reduce((sum,[value,weight])=>sum+value*weight,0)/Math.max(1,components.reduce((sum,row)=>sum+row[1],0));
    if(stats&&Number(stats.played)>0)score+=clamp((Number(stats.points)/Number(stats.played)-1.35)*3,-4,4);
    const value=clamp(Math.round(score),0,100);cache.set(id,{key,value});return value;
  }
  function clubIdentity(s,id){
    const club=clubById(s,id);if(!club)return null;const league=leagueById(s,club.leagueId),local=(s.clubs||[]).some(item=>item.id===club.id),country=resolveNationality(club.country,club.country)||club.country||null;
    const region=local?(root.ProLifeCompetitions?.clubState?.(club)||club.state||club.uf||null):(club.region||club.state||club.province||null);
    const form=recentForm(s,club.id);
    return {id:club.id,name:club.name||null,shortName:club.shortName||club.name||null,country:country||null,city:club.city||null,region:region||null,stadium:club.stadium||null,league:league?{id:league.id,name:league.name||null,country:resolveNationality(league.country,league.country)||league.country||null,level:Number.isFinite(Number(league.level))?Number(league.level):null}:null,division:Number.isFinite(Number(club.division))?Number(club.division):(Number.isFinite(Number(league?.level))?Number(league.level):null),ranking:standingRank(s,club),reputation:Number.isFinite(Number(club.reputation))?clamp(Math.round(Number(club.reputation)),0,100):null,strength:Number.isFinite(Number(club.strength))?clamp(Math.round(Number(club.strength)),0,100):null,structure:Number.isFinite(Number(club.structure))?clamp(Math.round(Number(club.structure)),0,100):null,prestige:clubPrestige(s,id),recentForm:form.length?form:null,continental:club.continental||null,active:club.active!==false};
  }
  function activePlayers(s){return collectPlayers(s,player=>player.status!=="retired"&&player.active!==false);}
  function playersByNationality(s,nationality){const wanted=normalizedNationality(nationality);return collectPlayers(s,player=>normalizedNationality(player.nationality)===wanted);}
  function playersByClub(s,clubId){return collectPlayers(s,player=>player.clubId===clubId);}
  function playersByLeague(s,leagueId){return collectPlayers(s,player=>player.leagueId===leagueId);}
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
    player.status="retired";player.active=false;player.retired=true;player.retiredSeason=season;player.retiredReason=reason;
    const g=state(s);if(!g.retireStats||typeof g.retireStats!=="object")g.retireStats={};
    const st=g.retireStats[season]||(g.retireStats[season]={total:0,dismissed:0,notable:0,byAge:{}});
    if(reason==="dispensado"){st.dismissed++;return true;}   // dispensa de jovem sem clube NAO e aposentadoria
    const age=Number(player.age)||0,ovr=Number(player.ovr||player.overall)||0,peak=Math.max(ovr,Number(player.peakOvr)||0);
    st.total++;st.byAge[age]=(st.byAge[age]||0)+1;
    const notable=peak>=78||ovr>=74||!!player.honorNominee;
    if(notable&&!g.retirements.some(item=>item.playerId===player.id)){st.notable++;g.retirements.unshift({playerId:player.id,name:player.name,season,age,pos:player.pos||null,ovr,peak,nationality:player.nationality||null,clubId:player.clubId||null,club:player.externalClub||player.club||null,reason,farewell:player.farewellSeason||null});g.retirements=g.retirements.slice(0,1500);}
    const keys=Object.keys(g.retireStats).sort();while(keys.length>30)delete g.retireStats[keys.shift()];
    return true;
  }
  // Stage 34F.22 - evolucao anual dos jogadores do catalogo FC27 (so ovr/overall/potential; ids, clubes e identidade intactos).
  // Usa os perfis individuais (32B) e o teto dinamico (32C); minutos sao estimados pela posicao no elenco do clube.
  const DEV_STARTERS={GOL:1,DEF:4,MEI:3,ATA:3};
  function devModules(){
    const load=name=>{if(root[name])return root[name];if(typeof require==="function"){try{return require(name==="ProLifePlayerDevelopment"?"./player-development.js":"./dynamic-potential.js");}catch{}}return null;};
    return {Dev:load("ProLifePlayerDevelopment"),DP:load("ProLifeDynamicPotential")};
  }
  function developCatalog(s,season){
    const {Dev,DP}=devModules();if(!Dev)return null;
    const pool=(s.internationalPlayers||[]).filter(p=>p&&p.status!=="retired"&&p.active!==false&&p.id!=="hero");
    const byClub=new Map();for(const p of pool){if(!p.clubId)continue;let c=byClub.get(p.clubId);if(!c){c=[];byClub.set(p.clubId,c);}c.push(p);}
    const share=new Map();
    for(const list of byClub.values()){
      const byPos={};for(const p of list)(byPos[p.pos]||(byPos[p.pos]=[])).push(p);
      for(const pos in byPos){const slots=DEV_STARTERS[pos]||3;byPos[pos].sort((a,b)=>b.ovr-a.ovr||(a.id<b.id?-1:1)).forEach((p,i)=>share.set(p.id,i<slots?0.85:i<slots+3?0.5:0.2));}
    }
    const ctx={seed:"fc27",season};let changed=0,sum=0;const moves=[];
    for(const p of pool){
      const before=Number(p.ovr),age=Number(p.age)||season-Number(p.birthYear);
      const subject={id:p.id,name:p.name,pos:p.pos,birthYear:p.birthYear,age,overall:before,ovr:before,potential:p.potential,developmentProfile:p.developmentProfile};
      const minutesShare=p.academy?0.6:(share.get(p.id)??0.15),r=Dev.expectedAnnualChange(subject,{...ctx,factors:{minutesShare,routine:0.5}});
      const spread=Math.max(0.4,(r.max-r.min)/2),noise=(hash(`${p.id}|dev|${season}`)/4294967296-0.5)*2*spread;
      const gainScale=r.expected>0?(0.8+0.4*minutesShare)*(p.generated?0.8:1):1;let delta=Math.round(r.expected*gainScale+noise);delta=Math.max(age<30?-3:age<33?-4:-5,Math.min(p.generated?4:6,delta));
      let next=before+delta;
      if(delta>0){const ceil=DP?DP.effectiveCeiling(subject,ctx):p.potential+2;next=Math.min(next,Math.max(before,Math.floor(ceil)));}
      next=clamp(next,20,99);
      if(next!==before){p.ovr=next;p.overall=next;if(p.attrs&&CORE.every(k=>Number(p.attrs[k])===before))for(const k of CORE)p.attrs[k]=next;p.peakOvr=Math.max(Number(p.peakOvr)||0,next);changed++;sum+=next-before;moves.push({id:p.id,name:p.name,age,from:before,to:next});}
      // potencial elastico: nunca abaixo do GER; apos o auge converge para perto do GER atual.
      let pot=Math.max(next,Number(p.potential)||next);
      if(age>r.params.peakEnd)pot=Math.min(pot,next+2);
      else if(age>=24&&minutesShare<0.3&&pot>next)pot=Math.max(next,pot-1);
      pot=clamp(pot,next,99);if(pot!==p.potential)p.potential=pot;
    }
    moves.sort((a,b)=>(b.to-b.from)-(a.to-a.from)||(a.id<b.id?-1:1));
    const rising=moves.slice(0,8),falling=moves.slice(-8).reverse();
    return {season,players:pool.length,changed,avgDelta:changed?Math.round(sum/changed*100)/100:0,rising,falling};
  }
  // Stage 34F.22b - categoria de base e entrada anual de jovens (clubes FC27 e jogadores livres). So acrescenta jogadores novos
  // (ids proprios fc27_y_*); os jogadores do catalogo, seus ids e vinculos nao sao recriados nem apagados.
  const ACADEMY_MIN=6,ACADEMY_MAX=14,FIRST_TEAM_MAX=32,FREE_YOUTH=120,POS_FLOOR={GOL:2,DEF:5,MEI:5,ATA:3};
  const rngFor=key=>{let n=0;return()=>hash(`${key}|${n++}`)/4294967296;};
  const pickFrom=(list,r)=>list[Math.min(list.length-1,Math.floor(r()*list.length))];
  function youthPools(s){
    const first=new Map(),last=new Map(),nat=new Map(),leagueNat=new Map(),allFirst=new Set(),allLast=new Set();
    const add=(m,k,v)=>{let x=m.get(k);if(!x){x=new Set();m.set(k,x);}x.add(v);};
    for(const p of s.internationalPlayers||[]){
      if(!p||!p.nationality||!p.name)continue;
      nat.set(p.nationality,(nat.get(p.nationality)||0)+1);
      if(p.leagueId){let l=leagueNat.get(p.leagueId);if(!l){l=new Map();leagueNat.set(p.leagueId,l);}l.set(p.nationality,(l.get(p.nationality)||0)+1);}
      const parts=String(p.name).trim().split(/\s+/);if(parts.length<2)continue;
      const f=parts[0],l=parts.slice(1).join(" ");add(first,p.nationality,f);add(last,p.nationality,l);allFirst.add(f);allLast.add(l);
    }
    const arr=set=>[...set].sort();
    const out={first:new Map(),last:new Map(),allFirst:arr(allFirst),allLast:arr(allLast),nat:[...nat.entries()].sort((a,b)=>a[0]<b[0]?-1:1),leagueNat:new Map(),used:new Set()};
    for(const [k,v] of first)if(v.size>=8)out.first.set(k,arr(v));
    for(const [k,v] of last)if(v.size>=8)out.last.set(k,arr(v));
    for(const [k,v] of leagueNat)out.leagueNat.set(k,[...v.entries()].sort((a,b)=>a[0]<b[0]?-1:1));
    for(const p of s.internationalPlayers||[])out.used.add(identityKey(p));
    return out;
  }
  const weightedPick=(entries,r)=>{let total=0;for(const e of entries)total+=e[1];let x=r()*total;for(const e of entries){x-=e[1];if(x<=0)return e[0];}return entries[entries.length-1][0];};
  function clubLevel(club){const st=Number(club.strength),rep=Number(club.reputation);return clamp(Number.isFinite(st)?st:Number.isFinite(rep)?rep*0.9:55,40,92);}
  const TIER_PROFILES={craque:[["prodigy",5],["career_burst",2],["steady_rise",1]],promessa:[["prodigy",3],["steady_rise",3],["career_burst",2],["early_unstable",1]],normal:[["steady_rise",5],["late_bloomer",3],["longevity",2],["career_burst",1]]};
  function buildYouthPlayer(s,pools,r,{club,level,age,pos,season,boost=1,freeAgent=false}){
    const roll=r(),craque=0.004*boost,promessa=craque+0.07*boost;
    const tier=roll<craque?"craque":roll<promessa?"promessa":"normal";
    let pot=tier==="craque"?88+Math.floor(r()*8):tier==="promessa"?77+Math.floor(r()*11):clamp(Math.round(48+(level-40)*0.55+r()*14),50,76);
    const k=tier==="craque"?3.0:tier==="promessa"?2.8:2.3,ovr=clamp(Math.round(pot-Math.max(2,25-age)*k+(r()-0.5)*6),32,pot-3);
    const leagueMix=!freeAgent&&club?pools.leagueNat.get(club.leagueId):null;
    const nationality=weightedPick(leagueMix&&leagueMix.length?leagueMix:pools.nat,r);
    const fl=pools.first.get(nationality)||pools.allFirst,ll=pools.last.get(nationality)||pools.allLast;
    let name="",tries=0;
    do{name=`${pickFrom(fl,r)} ${pickFrom(ll,r)}`;tries++;}while(pools.used.has(identityKey({name,birthYear:season-age}))&&tries<12);
    if(pools.used.has(identityKey({name,birthYear:season-age})))name=`${name} ${pickFrom(pools.allLast,r)}`;
    pools.used.add(identityKey({name,birthYear:season-age}));
    const g=state(s),id=`fc27_y_${String(g.youthSeq=(Number(g.youthSeq)||0)+1).padStart(6,"0")}`;
    const profile=weightedPick(TIER_PROFILES[tier],r);
    const player={id,name,shortName:shortNameOf(name),nationality,birthYear:season-age,pos,secondaryPositions:[],ovr,overall:ovr,potential:pot,clubId:freeAgent?null:club.id,
      status:"active",active:true,reputation:Math.max(40,ovr-12),external:true,marketStatus:"external",leagueId:freeAgent?null:(club.leagueId||null),
      attrs:{pace:ovr,finish:ovr,pass:ovr,defense:ovr,strength:ovr,stamina:ovr},condition:100,morale:50,injury:0,suspension:0,discipline:70,goals:0,minutes:0,appearances:0,
      age,clubHistory:[],peakOvr:ovr,generated:true,talent:tier,developmentProfile:{id:profile,v:1}};
    if(!freeAgent){player.academy=true;player.externalClub=club.name;}
    return player;
  }
  function addYouth(s,player){s.internationalPlayers.push(player);return normalizePlayer(s,player,{preserveAge:true});}
  function academyPositions(have,need,r){
    const out=[],base={GOL:1,DEF:2,MEI:2,ATA:1};
    for(const pos of ["GOL","DEF","MEI","ATA"]){let n=(have[pos]||0);while(n<base[pos]&&out.length<need){out.push(pos);n++;}}
    while(out.length<need){const x=r();out.push(x<0.1?"GOL":x<0.45?"DEF":x<0.8?"MEI":"ATA");}
    return out;
  }
  function seedClubAcademy(s,pools,club,kids,season,ages,extra,tag){
    const r=rngFor(`fc27-academy|${tag}|${season}|${club.id}`),level=clubLevel(club),have={};
    for(const k of kids)have[k.pos]=(have[k.pos]||0)+1;
    const need=Math.min(ACADEMY_MAX-kids.length,Math.max(ACADEMY_MIN-kids.length,0)+extra);
    if(need<=0)return [];
    const created=[],boost=level>=75?2:level>=65?1.4:1;
    for(const pos of academyPositions(have,need,r))created.push(addYouth(s,buildYouthPlayer(s,pools,r,{club,level,age:pickFrom(ages,r),pos,season,boost})));
    return created;
  }
  const catalogClubs=s=>(state(s).clubs||[]).filter(c=>c&&c.fc27&&c.active!==false);
  function academyByClub(s){const m=new Map();for(const p of s.internationalPlayers||[])if(p.academy&&p.status!=="retired"&&p.clubId){let l=m.get(p.clubId);if(!l){l=[];m.set(p.clubId,l);}l.push(p);}return m;}
  // Primeira vez em uma carreira FC27: completa a base de todos os clubes ate o minimo (idempotente; nao toca em ninguem mais).
  function ensureAcademies(s){
    if(s.catalogVersion!=="fc27_v1")return 0;
    init(s);const g=state(s);if(g.academySeed)return 0;
    const season=seasonOf(s),pools=youthPools(s),by=academyByClub(s);let n=0;
    for(const club of catalogClubs(s))n+=seedClubAcademy(s,pools,club,by.get(club.id)||[],season,[16,17,17,18,18,19],0,"seed").length;
    g.academySeed=season;return n;
  }
  function pickSigningClub(s,player,clubs,firstTeam,academy,r){
    const level=(Number(player.ovr)+Number(player.potential))/2,kid=player.age<=19,sample=[];
    for(let i=0;i<60&&clubs.length;i++)sample.push(clubs[Math.floor(r()*clubs.length)]);
    const weighted=sample.filter(c=>kid?(academy.get(c.id)||0)<ACADEMY_MAX:(firstTeam.get(c.id)||0)<FIRST_TEAM_MAX)
      .map(c=>[c,Math.max(0,26-Math.abs(clubLevel(c)-level)*1.1)+0.5]);
    return weighted.length?weightedPick(weighted,r):null;
  }
  function renewYouth(s,season){
    const pools=youthPools(s),clubs=catalogClubs(s),pool=s.internationalPlayers||[],r=rngFor(`fc27-youth|${season}`);
    const summary={season,created:0,free:0,promoted:0,released:0,signed:0,retiredFree:0,trimmed:0,stars:[]};
    const g0=state(s),activeNow=pool.filter(p=>p.status!=="retired"&&p.active!==false).length;
    if(!g0.popBaseline)g0.popBaseline=activeNow;
    const over=activeNow>g0.popBaseline*1.03;   // mundo acima de +3%: base e jovens livres so repoem o que saiu
    summary.pop=activeNow;summary.popBaseline=g0.popBaseline;summary.capped=over;
    const firstTeam=new Map(),academy=new Map();
    for(const p of pool){if(p.status==="retired"||!p.clubId)continue;const m=p.academy?academy:firstTeam;m.set(p.clubId,(m.get(p.clubId)||0)+1);}
    const clubById=new Map(clubs.map(c=>[c.id,c]));
    // 1) livres da temporada anterior: assinam com um clube ou encerram a carreira
    for(const p of pool){
      if(p.status==="retired"||p.clubId||p.id==="hero")continue;
      const ok=(p.age<=21&&p.potential>=58)||(p.ovr>=55&&p.age<=34)||(p.age<=27&&p.ovr>=48),club=ok?pickSigningClub(s,p,clubs,firstTeam,academy,r):null;
      if(club){p.clubId=club.id;p.leagueId=club.leagueId||null;p.externalClub=club.name;p.clubHistory.push({season,fromClubId:null,toClubId:club.id});p.clubHistory=p.clubHistory.slice(-30);
        if(p.age<=19&&p.generated){p.academy=true;academy.set(club.id,(academy.get(club.id)||0)+1);}else firstTeam.set(club.id,(firstTeam.get(club.id)||0)+1);summary.signed++;}
      else{retirePlayer(s,p.id,season,p.age<30?"dispensado":"sem clube");summary.retiredFree++;}
    }
    // 2) base: aos 20 anos sobe para o elenco principal ou e dispensada
    for(const p of pool){
      if(!p.academy||p.status==="retired"||p.age<20)continue;
      const club=clubById.get(p.clubId),level=club?clubLevel(club):55;
      delete p.academy;academy.set(p.clubId,Math.max(0,(academy.get(p.clubId)||0)-1));
      const formador=s.globalFootball?.intel?.coaches?.[p.clubId]?.style==="formador";
      if(p.ovr>=level-14||p.potential>=level+(formador?-4:2)){firstTeam.set(p.clubId,(firstTeam.get(p.clubId)||0)+1);summary.promoted++;}
      else{p.clubHistory.push({season,fromClubId:p.clubId,toClubId:null});p.clubHistory=p.clubHistory.slice(-30);p.clubId=null;p.leagueId=null;delete p.externalClub;delete p.club;summary.released++;}
    }
    // 3) elencos principais inchados dispensam os mais fracos (respeitando o minimo por posicao)
    const byClub=new Map();for(const p of pool){if(p.status==="retired"||!p.clubId||p.academy||!clubById.has(p.clubId))continue;let l=byClub.get(p.clubId);if(!l){l=[];byClub.set(p.clubId,l);}l.push(p);}
    for(const [clubId,list] of byClub){
      let extra=list.length-FIRST_TEAM_MAX;if(extra<=0)continue;
      const cnt={};for(const p of list)cnt[p.pos]=(cnt[p.pos]||0)+1;
      for(const p of list.slice().sort((a,b)=>a.ovr-b.ovr||b.age-a.age||(a.id<b.id?-1:1))){
        if(extra<=0)break;if(p.age<23||(cnt[p.pos]||0)<=POS_FLOOR[p.pos])continue;
        p.clubHistory.push({season,fromClubId:clubId,toClubId:null});p.clubHistory=p.clubHistory.slice(-30);p.clubId=null;p.leagueId=null;delete p.externalClub;delete p.club;
        cnt[p.pos]--;extra--;summary.trimmed++;
      }
    }
    // 4) novas turmas da base (minimo 6 por clube) e jovens livres
    const by=academyByClub(s),created=[];
    for(const club of clubs){const level=clubLevel(club);created.push(...seedClubAcademy(s,pools,club,by.get(club.id)||[],season,[16,17,17,18],over?0:1+(Number(club.reputation)>=70?1:0),"yearly"));}
    const fr=rngFor(`fc27-free|${season}`);
    for(let i=0;i<(over?Math.round(FREE_YOUTH*0.25):FREE_YOUTH);i++){const x=fr(),pos=x<0.1?"GOL":x<0.45?"DEF":x<0.8?"MEI":"ATA";created.push(addYouth(s,buildYouthPlayer(s,pools,fr,{club:null,level:58,age:[17,18,18,19,19,20][Math.floor(fr()*6)],pos,season,boost:1.5,freeAgent:true})));summary.free++;}
    summary.created=created.length;
    const clubName=new Map(clubs.map(c=>[c.id,c.name]));
    summary.stars=created.slice().sort((a,b)=>b.potential-a.potential||(a.id<b.id?-1:1)).slice(0,8).map(p=>({id:p.id,name:p.name,age:p.age,pos:p.pos,ovr:p.ovr,potential:p.potential,tier:p.talent,club:clubName.get(p.clubId)||"Livre"}));
    return summary;
  }
  function rollSeason(s){
    init(s);const season=seasonOf(s),g=state(s);if(g.processedSeasons[String(season)])return [];
    g.processedSeasons[String(season)]=true;const retired=[];
    if(s.catalogVersion==="fc27_v1"){const dev=developCatalog(s,season);if(dev)g.lastDevelopment=dev;}
    const RR=root.ProLifeRetirementRules||(typeof require==="function"?require("./retirement-rules.js"):null);
    const lvl=new Map(catalogClubs(s).map(c=>[c.id,clubLevel(c)]));
    if(!Array.isArray(g.farewells))g.farewells=[];
    for(const player of s.internationalPlayers||[]){normalizePlayer(s,player);if(player.status==="retired"||player.id==="hero")continue;
      const ovr=Number(player.ovr||player.overall)||0;player.peakOvr=Math.max(Number(player.peakOvr)||0,ovr);
      const level=lvl.get(player.clubId)||55,motive=hash(`${player.id}|motive`)/4294967296*2-1;
      const c=RR.chance(player,{ovr,peak:player.peakOvr,level,starter:ovr>=level-6,freeSeasons:player.clubId?0:1,motive});
      const forced=player.farewellSeason&&Number(player.farewellSeason)<season;
      if(c>=1||forced||hash(`${player.id}|retire|${season}`)/4294967296<c){if(retirePlayer(s,player.id,season,"idade"))retired.push(player.id);continue;}
      // lendas anunciam a temporada de despedida (aposentam no fim da proxima)
      if(!player.farewellSeason&&player.peakOvr>=85&&c>=.2){player.farewellSeason=season;g.farewells.unshift({id:player.id,name:player.name,season,age:player.age,peak:player.peakOvr,club:player.externalClub||player.club||null});g.farewells=g.farewells.slice(0,60);}
    }
    if(s.catalogVersion==="fc27_v1")g.lastIntake=renewYouth(s,season);
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
  const api={VERSION:1,diagnostics,packInfo,clubByName,nationName:code=>resolveNationality(code,null),nationCode:value=>{const identity=normalizedNationality(value);if(identity==='brasil')return 'BRA';return Object.keys(NATIONS).find(key=>plain(NATIONS[key][0])===identity)||null;},nationalityCatalog,resolveNationality,init,allPlayers,playerById,clubById,leagueById,clubIdentity,clubPrestige,playersByNationality,playersByClub,playersByLeague,activePlayers,eligibleNationalTeamPlayers,registerPlayer,transferPlayer,retirePlayer,rollSeason,developCatalog,ensureAcademies,renewYouth,importData,normalizedNationality,seasonOf};
  root.ProLifeGlobalFootball=api;if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
