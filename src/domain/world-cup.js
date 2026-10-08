(function(root){
  "use strict";

  const squadDb=
    root.ProLifeWorldCupSquads2026 ||
    (
      typeof require==="function"
        ? require("./world-cup-squads-2026.js")
        : null
    );

  const fallbackTeams2026=[
    {id:"CZE",name:"Republica Tcheca",reputation:80},
    {id:"MEX",name:"Mexico",reputation:81},
    {id:"RSA",name:"Africa do Sul",reputation:74},
    {id:"KOR",name:"Coreia do Sul",reputation:80},
    {id:"BIH",name:"Bosnia e Herzegovina",reputation:77},
    {id:"CAN",name:"Canada",reputation:78},
    {id:"QAT",name:"Catar",reputation:72},
    {id:"SUI",name:"Suica",reputation:83},
    {id:"BRA",name:"Brasil",reputation:92},
    {id:"HAI",name:"Haiti",reputation:69},
    {id:"MAR",name:"Marrocos",reputation:84},
    {id:"SCO",name:"Escocia",reputation:77},
    {id:"AUS",name:"Australia",reputation:76},
    {id:"PAR",name:"Paraguai",reputation:76},
    {id:"TUR",name:"Turquia",reputation:80},
    {id:"USA",name:"Estados Unidos",reputation:81},
    {id:"CUW",name:"Curacao",reputation:70},
    {id:"ECU",name:"Equador",reputation:80},
    {id:"GER",name:"Alemanha",reputation:90},
    {id:"CIV",name:"Costa do Marfim",reputation:80},
    {id:"JPN",name:"Japao",reputation:82},
    {id:"NED",name:"Holanda",reputation:89},
    {id:"SWE",name:"Suecia",reputation:79},
    {id:"TUN",name:"Tunisia",reputation:74},
    {id:"BEL",name:"Belgica",reputation:87},
    {id:"EGY",name:"Egito",reputation:78},
    {id:"IRN",name:"Ira",reputation:78},
    {id:"NZL",name:"Nova Zelandia",reputation:70},
    {id:"CPV",name:"Cabo Verde",reputation:73},
    {id:"KSA",name:"Arabia Saudita",reputation:74},
    {id:"ESP",name:"Espanha",reputation:94},
    {id:"URU",name:"Uruguai",reputation:86},
    {id:"FRA",name:"Franca",reputation:94},
    {id:"IRQ",name:"Iraque",reputation:72},
    {id:"NOR",name:"Noruega",reputation:82},
    {id:"SEN",name:"Senegal",reputation:82},
    {id:"ALG",name:"Argelia",reputation:77},
    {id:"ARG",name:"Argentina",reputation:93},
    {id:"AUT",name:"Austria",reputation:81},
    {id:"JOR",name:"Jordania",reputation:71},
    {id:"COL",name:"Colombia",reputation:84},
    {id:"COD",name:"RD Congo",reputation:75},
    {id:"POR",name:"Portugal",reputation:90},
    {id:"UZB",name:"Uzbequistao",reputation:74},
    {id:"CRO",name:"Croacia",reputation:85},
    {id:"ENG",name:"Inglaterra",reputation:91},
    {id:"GHA",name:"Gana",reputation:76},
    {id:"PAN",name:"Panama",reputation:73}
  ];

  const teams=
    squadDb?.teams?.length===48
      ? squadDb.teams.map(
          t=>({
            id:t.id,
            name:t.name,
            reputation:t.reputation
          })
        )
      : fallbackTeams2026.map(
          t=>({...t})
        );


  const groupNames=[
    "A","B","C","D","E","F",
    "G","H","I","J","K","L"
  ];

  function cloneTeam(team){
    return {
      id:team.id,
      name:team.name,
      reputation:team.reputation
    };
  }

  function emptyRow(team){
    return {
      id:team.id,
      name:team.name,
      reputation:team.reputation,
      played:0,
      w:0,
      d:0,
      l:0,
      gf:0,
      ga:0,
      gd:0,
      points:0
    };
  }

  function seedGroups(participants=teams){
    const ordered=participants
      .slice()
      .sort((a,b)=>
        b.reputation-a.reputation ||
        a.name.localeCompare(b.name)
      );

    const pots=[
      ordered.slice(0,12),
      ordered.slice(12,24),
      ordered.slice(24,36),
      ordered.slice(36,48)
    ];

    const groups=groupNames.map(name=>({
      name,
      teams:[],
      table:[],
      matches:[]
    }));

    for(let potIndex=0;potIndex<pots.length;potIndex++){
      const pot=pots[potIndex];

      for(let i=0;i<12;i++){
        const target=
          potIndex%2===0
            ? i
            : 11-i;

        groups[target].teams.push(
          cloneTeam(pot[i])
        );
      }
    }

    for(const group of groups){
      group.table=
        group.teams.map(emptyRow);

      const [a,b,c,d]=group.teams;

      const rounds=[
        [[a,b],[c,d]],
        [[a,c],[b,d]],
        [[a,d],[b,c]]
      ];

      let matchIndex=0;

      for(let round=0;round<rounds.length;round++){
        for(const pair of rounds[round]){
          const home=pair[0];
          const away=pair[1];

          group.matches.push({
            id:
              "group:"+group.name+":"+
              matchIndex,
            group:group.name,
            round:round+1,
            phase:"group",
            homeId:home.id,
            awayId:away.id,
            home:home.name,
            away:away.name,
            played:false,
            hg:null,
            ag:null
          });

          matchIndex++;
        }
      }
    }

    return groups;
  }

  function createTournament(year,participants=null){
    const selected=
      Array.isArray(participants)
        ? participants.map(cloneTeam)
        : teams.map(cloneTeam);

    if(selected.length!==48)
      throw new Error(
        "World Cup requires exactly 48 qualified teams."
      );

    const ids=
      new Set(
        selected.map(t=>t.id)
      );

    if(ids.size!==48)
      throw new Error(
        "World Cup qualified teams must be unique."
      );

    return {
      version:2,
      type:"WORLD_CUP",
      name:"Copa Mundial",
      year:Number(year),
      status:"GROUP_STAGE",
      champion:null,
      runnerUp:null,
      participants:selected,
      groups:seedGroups(selected),
      qualified32:[],
      knockout:[],
      history:[]
    };
  }

  function compareRows(a,b){
    return (
      b.points-a.points ||
      b.gd-a.gd ||
      b.gf-a.gf ||
      b.w-a.w ||
      b.reputation-a.reputation ||
      a.name.localeCompare(b.name)
    );
  }

  function group(tournament,name){
    return tournament.groups.find(
      g=>g.name===name
    )||null;
  }

  function updateRow(row,gf,ga){
    row.played++;
    row.gf+=gf;
    row.ga+=ga;
    row.gd=row.gf-row.ga;

    if(gf>ga){
      row.w++;
      row.points+=3;
    }
    else if(gf<ga){
      row.l++;
    }
    else{
      row.d++;
      row.points++;
    }
  }

  function standings(tournament,groupName){
    const g=group(tournament,groupName);

    if(!g)
      return [];

    return g.table
      .slice()
      .sort(compareRows);
  }

  function recordGroupResult(
    tournament,
    matchId,
    hg,
    ag
  ){
    let selected=null;
    let selectedGroup=null;

    for(const g of tournament.groups){
      const match=g.matches.find(
        m=>m.id===matchId
      );

      if(match){
        selected=match;
        selectedGroup=g;
        break;
      }
    }

    if(!selected || !selectedGroup)
      throw new Error(
        "Partida da fase de grupos nao encontrada."
      );

    if(selected.played)
      throw new Error(
        "Partida ja disputada."
      );

    hg=Math.max(0,Math.floor(Number(hg)||0));
    ag=Math.max(0,Math.floor(Number(ag)||0));

    selected.played=true;
    selected.hg=hg;
    selected.ag=ag;

    const homeRow=selectedGroup.table.find(
      x=>x.id===selected.homeId
    );

    const awayRow=selectedGroup.table.find(
      x=>x.id===selected.awayId
    );

    updateRow(homeRow,hg,ag);
    updateRow(awayRow,ag,hg);

    selectedGroup.table=
      selectedGroup.table.sort(compareRows);

    return selected;
  }

  function groupStageComplete(tournament){
    return tournament.groups.every(
      g=>g.matches.every(m=>m.played)
    );
  }

  function qualifyRoundOf32(tournament){
    if(!groupStageComplete(tournament))
      return [];

    const direct=[];
    const third=[];

    for(const g of tournament.groups){
      const table=standings(
        tournament,
        g.name
      );

      direct.push({
        ...table[0],
        group:g.name,
        groupPosition:1
      });

      direct.push({
        ...table[1],
        group:g.name,
        groupPosition:2
      });

      third.push({
        ...table[2],
        group:g.name,
        groupPosition:3
      });
    }

    third.sort(compareRows);

    const bestThird=
      third.slice(0,8);

    tournament.qualified32=[
      ...direct,
      ...bestThird
    ];

    tournament.status="ROUND_OF_32";

    return tournament.qualified32;
  }

  function simulateGroupMatch(match,rng,tournament){
    const getTeam=id=>
      (tournament.participants||teams)
        .find(t=>t.id===id);

    const home=getTeam(match.homeId);
    const away=getTeam(match.awayId);

    const random=()=>
      rng && typeof rng.next==="function"
        ? rng.next()
        : Math.random();

    const homeGoals=Math.max(
      0,
      Math.round(
        1.25+
        (home.reputation-away.reputation)/18+
        (random()-.5)*2.4
      )
    );

    const awayGoals=Math.max(
      0,
      Math.round(
        1.10+
        (away.reputation-home.reputation)/18+
        (random()-.5)*2.4
      )
    );

    return recordGroupResult(
      tournament,
      match.id,
      homeGoals,
      awayGoals
    );
  }

  function simulateGroupStage(tournament,rng){
    for(let round=1;round<=3;round++){
      for(const g of tournament.groups){
        for(const match of g.matches){
          if(
            match.round===round &&
            !match.played
          )
            simulateGroupMatch(
              match,
              rng,
              tournament
            );
        }
      }
    }

    return qualifyRoundOf32(tournament);
  }

  function brazilGroup(tournament){
    return tournament.groups.find(
      g=>g.teams.some(t=>t.id==="BRA")
    )||null;
  }

  function knockoutTeam(entry){
    return {
      id:entry.id,
      name:entry.name,
      reputation:Number(entry.reputation||70)
    };
  }

  function createKnockoutMatch(
    phase,
    index,
    home,
    away
  ){
    return {
      id:
        phase+":"+index,
      phase,
      index,
      homeId:home.id,
      awayId:away.id,
      home:home.name,
      away:away.name,
      played:false,
      hg:null,
      ag:null,
      penalties:null,
      winnerId:null,
      loserId:null
    };
  }

  function buildRoundOf32(tournament){
    if(
      !Array.isArray(tournament.qualified32) ||
      tournament.qualified32.length!==32
    )
      throw new Error(
        "A Copa precisa ter 32 classificados."
      );

    const first=tournament.qualified32
      .filter(x=>x.groupPosition===1)
      .sort((a,b)=>a.group.localeCompare(b.group));

    const second=tournament.qualified32
      .filter(x=>x.groupPosition===2)
      .sort((a,b)=>a.group.localeCompare(b.group));

    const third=tournament.qualified32
      .filter(x=>x.groupPosition===3)
      .sort(compareRows);

    const seeded=[
      ...first,
      ...second.slice(0,4)
    ];

    const unseeded=[
      ...second.slice(4),
      ...third
    ];

    if(
      seeded.length!==16 ||
      unseeded.length!==16
    )
      throw new Error(
        "Distribuicao invalida para fase de 32."
      );

    const matches=[];

    for(let i=0;i<16;i++){
      const home=knockoutTeam(
        seeded[i]
      );

      const away=knockoutTeam(
        unseeded[15-i]
      );

      matches.push(
        createKnockoutMatch(
          "ROUND_OF_32",
          i,
          home,
          away
        )
      );
    }

    tournament.knockout=
      tournament.knockout.filter(
        m=>m.phase!=="ROUND_OF_32"
      );

    tournament.knockout.push(
      ...matches
    );

    tournament.status="ROUND_OF_32";

    return matches;
  }

  function phaseMatches(
    tournament,
    phase
  ){
    return tournament.knockout
      .filter(m=>m.phase===phase)
      .sort((a,b)=>a.index-b.index);
  }

  function getTeamById(tournament,id){
    return (
      (tournament?.participants||teams)
        .find(t=>t.id===id) ||
      null
    );
  }

  function knockoutWinner(
    tournament,
    matchId
  ){
    const match=tournament.knockout.find(
      m=>m.id===matchId
    );

    if(!match || !match.played)
      return null;

    return getTeamById(tournament,match.winnerId);
  }

  function recordKnockoutResult(
    tournament,
    matchId,
    hg,
    ag,
    penaltyWinnerId=null
  ){
    const match=tournament.knockout.find(
      m=>m.id===matchId
    );

    if(!match)
      throw new Error(
        "Partida de mata-mata nao encontrada."
      );

    if(match.played)
      throw new Error(
        "Partida ja disputada."
      );

    hg=Math.max(
      0,
      Math.floor(Number(hg)||0)
    );

    ag=Math.max(
      0,
      Math.floor(Number(ag)||0)
    );

    let winnerId;
    let loserId;

    if(hg>ag){
      winnerId=match.homeId;
      loserId=match.awayId;
    }
    else if(ag>hg){
      winnerId=match.awayId;
      loserId=match.homeId;
    }
    else{
      if(
        penaltyWinnerId!==match.homeId &&
        penaltyWinnerId!==match.awayId
      )
        throw new Error(
          "Empate no mata-mata exige vencedor nos penaltis."
        );

      winnerId=penaltyWinnerId;
      loserId=
        winnerId===match.homeId
          ? match.awayId
          : match.homeId;

      match.penalties={
        winnerId
      };
    }

    match.played=true;
    match.hg=hg;
    match.ag=ag;
    match.winnerId=winnerId;
    match.loserId=loserId;

    return match;
  }

  function phaseComplete(
    tournament,
    phase
  ){
    const matches=phaseMatches(
      tournament,
      phase
    );

    return (
      matches.length>0 &&
      matches.every(m=>m.played)
    );
  }

  function createNextPhase(
    tournament,
    currentPhase,
    nextPhase
  ){
    if(
      !phaseComplete(
        tournament,
        currentPhase
      )
    )
      return [];

    const current=phaseMatches(
      tournament,
      currentPhase
    );

    const winners=current.map(
      match=>{
        const team=getTeamById(tournament,match.winnerId);

        if(!team)
          throw new Error(
            "Vencedor de mata-mata invalido."
          );

        return knockoutTeam(team);
      }
    );

    const expected={
      ROUND_OF_32:16,
      ROUND_OF_16:8,
      QUARTERFINAL:4,
      SEMIFINAL:2
    }[currentPhase];

    if(
      !expected ||
      winners.length!==expected
    )
      throw new Error(
        "Quantidade invalida de vencedores."
      );

    const matches=[];

    for(let i=0;i<winners.length;i+=2){
      matches.push(
        createKnockoutMatch(
          nextPhase,
          i/2,
          winners[i],
          winners[i+1]
        )
      );
    }

    tournament.knockout=
      tournament.knockout.filter(
        m=>m.phase!==nextPhase
      );

    tournament.knockout.push(
      ...matches
    );

    tournament.status=nextPhase;

    return matches;
  }

  function createFinals(
    tournament
  ){
    if(
      !phaseComplete(
        tournament,
        "SEMIFINAL"
      )
    )
      return [];

    const semis=phaseMatches(
      tournament,
      "SEMIFINAL"
    );

    const finalists=semis.map(
      m=>getTeamById(tournament,m.winnerId)
    );

    const losers=semis.map(
      m=>getTeamById(tournament,m.loserId)
    );

    const finalMatch=
      createKnockoutMatch(
        "FINAL",
        0,
        finalists[0],
        finalists[1]
      );

    const thirdPlace=
      createKnockoutMatch(
        "THIRD_PLACE",
        0,
        losers[0],
        losers[1]
      );

    tournament.knockout=
      tournament.knockout.filter(
        m=>
          m.phase!=="FINAL" &&
          m.phase!=="THIRD_PLACE"
      );

    tournament.knockout.push(
      thirdPlace,
      finalMatch
    );

    tournament.status="FINAL";

    return [
      thirdPlace,
      finalMatch
    ];
  }

  function finalizeTournament(
    tournament
  ){
    const finalMatch=
      phaseMatches(
        tournament,
        "FINAL"
      )[0];

    if(
      !finalMatch ||
      !finalMatch.played
    )
      return null;

    const champion=
      getTeamById(tournament,finalMatch.winnerId);

    const runnerUp=
      getTeamById(tournament,finalMatch.loserId);

    tournament.champion=
      champion
        ? cloneTeam(champion)
        : null;

    tournament.runnerUp=
      runnerUp
        ? cloneTeam(runnerUp)
        : null;

    tournament.status="COMPLETED";

    tournament.history.push({
      type:"champion",
      year:tournament.year,
      champion:
        tournament.champion?.name||null,
      runnerUp:
        tournament.runnerUp?.name||null
    });

    return tournament.champion;
  }

  function simulateKnockoutMatch(
    tournament,
    match,
    rng
  ){
    const home=getTeamById(tournament,match.homeId);

    const away=getTeamById(tournament,match.awayId);

    const random=()=>
      rng &&
      typeof rng.next==="function"
        ? rng.next()
        : Math.random();

    let hg=Math.max(
      0,
      Math.round(
        1.2+
        (home.reputation-away.reputation)/20+
        (random()-.5)*2.2
      )
    );

    let ag=Math.max(
      0,
      Math.round(
        1.1+
        (away.reputation-home.reputation)/20+
        (random()-.5)*2.2
      )
    );

    let penaltyWinnerId=null;

    if(hg===ag){
      penaltyWinnerId=
        random()<.5
          ? home.id
          : away.id;
    }

    return recordKnockoutResult(
      tournament,
      match.id,
      hg,
      ag,
      penaltyWinnerId
    );
  }

  function simulatePhase(
    tournament,
    phase,
    rng
  ){
    const matches=phaseMatches(
      tournament,
      phase
    );

    for(const match of matches){
      if(!match.played)
        simulateKnockoutMatch(
          tournament,
          match,
          rng
        );
    }

    return matches;
  }

  function simulateTournament(
    tournament,
    rng
  ){
    if(
      !groupStageComplete(tournament)
    )
      simulateGroupStage(
        tournament,
        rng
      );

    if(
      !phaseMatches(
        tournament,
        "ROUND_OF_32"
      ).length
    )
      buildRoundOf32(
        tournament
      );

    simulatePhase(
      tournament,
      "ROUND_OF_32",
      rng
    );

    createNextPhase(
      tournament,
      "ROUND_OF_32",
      "ROUND_OF_16"
    );

    simulatePhase(
      tournament,
      "ROUND_OF_16",
      rng
    );

    createNextPhase(
      tournament,
      "ROUND_OF_16",
      "QUARTERFINAL"
    );

    simulatePhase(
      tournament,
      "QUARTERFINAL",
      rng
    );

    createNextPhase(
      tournament,
      "QUARTERFINAL",
      "SEMIFINAL"
    );

    simulatePhase(
      tournament,
      "SEMIFINAL",
      rng
    );

    createFinals(
      tournament
    );

    simulatePhase(
      tournament,
      "THIRD_PLACE",
      rng
    );

    simulatePhase(
      tournament,
      "FINAL",
      rng
    );

    finalizeTournament(
      tournament
    );

    return tournament;
  }

  const api={
    teams,
    groupNames,
    createTournament,
    standings,
    recordGroupResult,
    groupStageComplete,
    qualifyRoundOf32,
    simulateGroupMatch,
    simulateGroupStage,
    brazilGroup,
    buildRoundOf32,
    phaseMatches,
    knockoutWinner,
    recordKnockoutResult,
    phaseComplete,
    createNextPhase,
    createFinals,
    finalizeTournament,
    simulateKnockoutMatch,
    simulatePhase,
    simulateTournament
  };

  root.ProLifeWorldCup=api;

  if(
    typeof module!=="undefined" &&
    module.exports
  )
    module.exports=api;

})(
  typeof globalThis!=="undefined"
    ? globalThis
    : this
);
