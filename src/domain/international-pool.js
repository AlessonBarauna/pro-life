(function(root){
  const players=[
    {id:"intl_vini_jr",name:"Vini Jr.",age:26,pos:"ATA",nationality:"Brazil",ovr:89,external:true,marketStatus:"free_agent",externalClub:"Real Madrid"},
    {id:"intl_raphinha",name:"Raphinha",age:29,pos:"ATA",nationality:"Brazil",ovr:89,external:true,marketStatus:"free_agent",externalClub:"Barcelona"},
    {id:"intl_alisson",name:"Alisson",age:33,pos:"GOL",nationality:"Brazil",ovr:89,external:true,marketStatus:"free_agent",externalClub:"Liverpool"},
    {id:"intl_gabriel_magalhaes",name:"Gabriel Magalhaes",age:28,pos:"DEF",nationality:"Brazil",ovr:88,external:true,marketStatus:"free_agent",externalClub:"Arsenal"},
    {id:"intl_marquinhos",name:"Marquinhos",age:32,pos:"DEF",nationality:"Brazil",ovr:87,external:true,marketStatus:"free_agent",externalClub:"Paris Saint-Germain"},
    {id:"intl_bruno_guimaraes",name:"Bruno Guimaraes",age:28,pos:"MEI",nationality:"Brazil",ovr:86,external:true,marketStatus:"free_agent",externalClub:"Newcastle United"},
    {id:"intl_ederson",name:"Ederson",age:33,pos:"GOL",nationality:"Brazil",ovr:86,external:true,marketStatus:"free_agent",externalClub:"Fenerbahce"},
    {id:"intl_eder_militao",name:"Eder Militao",age:28,pos:"DEF",nationality:"Brazil",ovr:85,external:true,marketStatus:"free_agent",externalClub:"Real Madrid"},
    {id:"intl_rodrygo",name:"Rodrygo",age:25,pos:"ATA",nationality:"Brazil",ovr:85,external:true,marketStatus:"free_agent",externalClub:"Real Madrid"},
    {id:"intl_gabriel_martinelli",name:"Gabriel Martinelli",age:25,pos:"ATA",nationality:"Brazil",ovr:83,external:true,marketStatus:"free_agent",externalClub:"Al-Hilal"},
    {id:"intl_savinho",name:"Savinho",age:22,pos:"ATA",nationality:"Brazil",ovr:82,external:true,marketStatus:"free_agent",externalClub:"Tottenham"},
    {id:"intl_matheus_cunha",name:"Matheus Cunha",age:27,pos:"ATA",nationality:"Brazil",ovr:82,external:true,marketStatus:"free_agent",externalClub:"Manchester United"},
    {id:"intl_joao_pedro",name:"Joao Pedro",age:25,pos:"ATA",nationality:"Brazil",ovr:82,external:true,marketStatus:"free_agent",externalClub:"Chelsea"},
    {id:"intl_andre",name:"Andre",age:25,pos:"MEI",nationality:"Brazil",ovr:78,external:true,marketStatus:"free_agent",externalClub:"Wolverhampton"},
    {id:"intl_endrick",name:"Endrick",age:20,pos:"ATA",nationality:"Brazil",ovr:77,external:true,marketStatus:"free_agent",externalClub:"Real Madrid"}
  ];

  function canonicalAttrs(p){
    const o=Math.max(
      20,
      Math.min(
        100,
        Number(p?.ovr||p?.overall||70)
      )
    );

    // Jogadores internacionais precisam usar o mesmo formato
    // canonico dos jogadores de clubes.
    // O overall-base continua sendo o rating definido no pool.
    return {
      pace:o,
      finish:o,
      pass:o,
      defense:o,
      strength:o,
      stamina:o
    };
  }

  function normalizePlayer(p){
    if(!p || typeof p!=="object")
      return p;

    const overall=Math.max(
      20,
      Math.min(
        100,
        Number(p.ovr||p.overall||70)
      )
    );

    if(
      !p.attrs ||
      typeof p.attrs!=="object"
    )
      p.attrs=canonicalAttrs(p);

    for(const key of [
      "pace",
      "finish",
      "pass",
      "defense",
      "strength",
      "stamina"
    ]){
      if(!Number.isFinite(p.attrs[key]))
        p.attrs[key]=overall;

      p.attrs[key]=Math.max(
        0,
        Math.min(100,p.attrs[key])
      );
    }

    if(!Number.isFinite(p.condition))
      p.condition=100;

    if(!Number.isFinite(p.morale))
      p.morale=50;

    if(!Number.isFinite(p.injury))
      p.injury=0;

    if(!Number.isFinite(p.suspension))
      p.suspension=0;

    if(!Number.isFinite(p.discipline))
      p.discipline=70;

    if(!Number.isFinite(p.goals))
      p.goals=0;

    if(!Number.isFinite(p.minutes))
      p.minutes=0;

    if(!Number.isFinite(p.appearances))
      p.appearances=0;

    if(!Number.isFinite(p.potential)){
      const age=Number(p.age||25);

      const bonus=
        age<=21 ? 5 :
        age<=24 ? 3 :
        age<=27 ? 2 :
        1;

      p.potential=Math.max(
        overall,
        Math.min(
          100,
          overall+bonus
        )
      );
    }

    return p;
  }

  function clonePlayer(p){
    return normalizePlayer({
      ...p,
      attrs:canonicalAttrs(p),
      condition:100,
      morale:50,
      appearances:0,
      injury:0,
      suspension:0,
      discipline:70,
      goals:0,
      minutes:0
    });
  }

  function defaults(){
    return players.map(clonePlayer);
  }

  function init(s){
    const globalFootball=root.ProLifeGlobalFootball||(typeof require==="function"?require("./global-football.js"):null);
    if(!s.globalFootball)globalFootball?.init?.(s);
    if(!Array.isArray(s.internationalPlayers)){
      s.internationalPlayers=defaults();
    }

    for(const p of s.internationalPlayers)
      normalizePlayer(p);

    const known=new Set(
      s.internationalPlayers
        .filter(Boolean)
        .map(p=>p.id)
    );

    for(const p of players){
      if(!known.has(p.id))
        s.internationalPlayers.push(
          clonePlayer(p)
        );
    }

    // Compatibilidade com estados em memoria nos quais um
    // internacional ja foi colocado em um elenco.
    for(const club of s.clubs||[]){
      for(const p of club.roster||[]){
        if(
          p &&
          (
            String(p.id||"").startsWith("intl_") ||
            known.has(p.id)
          )
        )
          normalizePlayer(p);
      }
    }

    return s.internationalPlayers;
  }

  function byNationality(s,nationality){
    const wanted=String(nationality||"").toLowerCase();

    return init(s).filter(p=>
      String(p.nationality||"").toLowerCase()===wanted
    );
  }

  function freeAgents(s){
    return init(s).filter(p=>
      p.marketStatus==="free_agent" &&
      !p.clubId
    );
  }

  function find(s,id){
    return init(s).find(p=>p.id===id)||null;
  }

  function clubStrength(club){
    return Number(
      club?.level ??
      club?.structure ??
      50
    );
  }

  function marketValue(player){
    const overall=Number(player?.ovr||player?.overall||70);
    const age=Number(player?.age||25);

    const ageFactor=
      age<=21 ? 1.22 :
      age<=24 ? 1.15 :
      age<=28 ? 1.08 :
      age<=31 ? .96 :
      age<=34 ? .78 :
      .58;

    const base=
      850000*Math.pow(1.145,overall-60);

    return Math.max(
      300000,
      Math.round(base*ageFactor/100000)*100000
    );
  }

  function salary(player){
    const overall=Number(player?.ovr||player?.overall||70);

    const base=
      4500*Math.pow(1.115,overall-60);

    return Math.max(
      3000,
      Math.round(base/1000)*1000
    );
  }

  function minimumClubLevel(player){
    const overall=Number(player?.ovr||player?.overall||70);

    if(overall>=88) return 84;
    if(overall>=85) return 80;
    if(overall>=82) return 76;
    if(overall>=79) return 72;
    if(overall>=76) return 67;
    return 60;
  }

  function canJoinClub(player,club){
    if(!player || !club) return false;
    if(player.clubId) return false;
    if(player.marketStatus!=="free_agent") return false;

    return clubStrength(club)>=minimumClubLevel(player);
  }

  function marketEntry(player){
    return {
      id:player.id,
      name:player.name,
      age:player.age,
      pos:player.pos,
      nationality:player.nationality,
      overall:Number(player.ovr||player.overall||70),
      value:marketValue(player),
      salary:salary(player),
      minimumClubLevel:minimumClubLevel(player),
      marketStatus:player.marketStatus,
      external:Boolean(player.external)
    };
  }

  function market(s){
    return freeAgents(s)
      .map(marketEntry)
      .sort((a,b)=>
        b.overall-a.overall ||
        b.value-a.value ||
        a.name.localeCompare(b.name)
      );
  }

  function signForClub(s,playerId,club){
    const player=find(s,playerId);

    if(!player)
      throw new Error("Jogador internacional nao encontrado.");

    if(!canJoinClub(player,club))
      throw new Error("Clube incompativel com o nivel do jogador.");

    player.clubId=club.id;
    player.external=false;
    player.marketStatus="signed";

    if(!Array.isArray(club.roster))
      club.roster=[];

    if(!club.roster.some(p=>p.id===player.id))
      club.roster.push(player);

    return {
      player,
      club,
      value:0,
      salary:salary(player),
      transferType:"free"
    };
  }

  function playerOverall(p){
    return Number(p?.ovr||p?.overall||60);
  }

  function positionalProfile(club){
    const positions=["GOL","DEF","MEI","ATA"];
    const profile={};

    for(const pos of positions){
      const group=(club?.roster||[])
        .filter(p=>p.pos===pos);

      const ratings=group
        .map(playerOverall)
        .sort((a,b)=>b-a);

      profile[pos]={
        count:group.length,
        best:ratings[0]||0,
        average:ratings.length
          ? ratings.reduce((a,b)=>a+b,0)/ratings.length
          : 0
      };
    }

    return profile;
  }

  function positionalNeed(club,pos){
    const profile=positionalProfile(club);
    const row=profile[pos]||{
      count:0,
      best:0,
      average:0
    };

    const ideal={
      GOL:2,
      DEF:7,
      MEI:6,
      ATA:5
    }[pos]||4;

    const depthGap=Math.max(0,ideal-row.count);
    const qualityGap=Math.max(
      0,
      clubStrength(club)-row.best
    );

    return depthGap*8+qualityGap*.7;
  }

  function fitScore(player,club){
    if(!canJoinClub(player,club))
      return -Infinity;

    const overall=playerOverall(player);
    const profile=positionalProfile(club);
    const current=profile[player.pos]||{
      count:0,
      best:0,
      average:0
    };

    const improvement=
      overall-current.best;

    const need=
      positionalNeed(club,player.pos);

    const levelGap=Math.abs(
      clubStrength(club)-overall
    );

    const ageBonus=
      Number(player.age||25)<=23 ? 2 :
      Number(player.age||25)>=32 ? -1 :
      0;

    return (
      need*2 +
      improvement*3 -
      levelGap*.35 +
      ageBonus
    );
  }

  function candidatesForClub(s,club){
    return freeAgents(s)
      .filter(p=>canJoinClub(p,club))
      .map(p=>({
        player:p,
        score:fitScore(p,club)
      }))
      .filter(x=>Number.isFinite(x.score))
      .filter(x=>x.score>0)
      .sort((a,b)=>
        b.score-a.score ||
        playerOverall(b.player)-playerOverall(a.player) ||
        a.player.name.localeCompare(b.player.name)
      );
  }

  function chooseSigning(s,club){
    return candidatesForClub(s,club)[0]||null;
  }

  function bestClubOpportunity(s){
    const options=[];

    for(const club of s.clubs||[]){
      const choice=chooseSigning(s,club);

      if(!choice)
        continue;

      options.push({
        club,
        player:choice.player,
        score:choice.score
      });
    }

    return options.sort((a,b)=>
      b.score-a.score ||
      clubStrength(b.club)-clubStrength(a.club) ||
      a.club.name.localeCompare(b.club.name)
    )[0]||null;
  }

  function executeBestSigning(s){
    const choice=bestClubOpportunity(s);

    if(!choice)
      return null;

    const deal=signForClub(
      s,
      choice.player.id,
      choice.club
    );

    return {
      ...deal,
      fitScore:choice.score
    };
  }

  function processTransferWindow(s,options={}){
    const open=Boolean(options.open);
    const windowKey=String(options.windowKey||"");

    if(!open || !windowKey)
      return null;

    if(
      !s.internationalMarketState ||
      typeof s.internationalMarketState!=="object"
    ){
      s.internationalMarketState={
        processedWindows:{},
        history:[]
      };
    }

    const state=s.internationalMarketState;

    if(
      !state.processedWindows ||
      typeof state.processedWindows!=="object"
    )
      state.processedWindows={};

    if(!Array.isArray(state.history))
      state.history=[];

    if(state.processedWindows[windowKey])
      return null;

    // One international-market decision per transfer window.
    state.processedWindows[windowKey]=true;

    const deal=executeBestSigning(s);

    if(!deal)
      return null;

    state.history.unshift({
      windowKey,
      playerId:deal.player.id,
      player:deal.player.name,
      clubId:deal.club.id,
      club:deal.club.name,
      salary:deal.salary,
      day:Number(s.day||0),
      season:Number(s.season||0)
    });

    state.history=state.history.slice(0,40);

    return deal;
  }

  const api={
    players,
    init,
    byNationality,
    freeAgents,
    find,
    marketValue,
    salary,
    minimumClubLevel,
    canJoinClub,
    marketEntry,
    market,
    signForClub,
    positionalProfile,
    positionalNeed,
    fitScore,
    candidatesForClub,
    chooseSigning,
    bestClubOpportunity,
    executeBestSigning,
    processTransferWindow
  ,normalizePlayer};

  root.ProLifeInternationalPool=api;

  if(typeof module!=="undefined"&&module.exports)
    module.exports=api;

})(typeof globalThis!=="undefined"?globalThis:this);
