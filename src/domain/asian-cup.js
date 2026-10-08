(function(root){
  "use strict";

  const teams=[
    {id:"JPN",name:"Japao",reputation:84},
    {id:"KOR",name:"Coreia do Sul",reputation:83},
    {id:"IRN",name:"Ira",reputation:81},
    {id:"AUS",name:"Australia",reputation:80},
    {id:"KSA",name:"Arabia Saudita",reputation:79},
    {id:"QAT",name:"Catar",reputation:79},
    {id:"UZB",name:"Uzbequistao",reputation:77},
    {id:"IRQ",name:"Iraque",reputation:76},
    {id:"JOR",name:"Jordania",reputation:75},
    {id:"UAE",name:"Emirados Arabes",reputation:75},
    {id:"CHN",name:"China",reputation:74},
    {id:"OMA",name:"Oma",reputation:73},
    {id:"BHR",name:"Bahrein",reputation:72},
    {id:"SYR",name:"Siria",reputation:72},
    {id:"THA",name:"Tailandia",reputation:71},
    {id:"VIE",name:"Vietna",reputation:70},
    {id:"IDN",name:"Indonesia",reputation:69},
    {id:"MAS",name:"Malasia",reputation:68},
    {id:"TJK",name:"Tajiquistao",reputation:70},
    {id:"KGZ",name:"Quirguistao",reputation:68},
    {id:"PLE",name:"Palestina",reputation:69},
    {id:"LBN",name:"Libano",reputation:68},
    {id:"IND",name:"India",reputation:67},
    {id:"PRK",name:"Coreia do Norte",reputation:69}
  ];

  const groupNames=["A","B","C","D","E","F"];

  function cloneTeam(team){
    return {
      id:String(team.id),
      name:String(team.name),
      reputation:Number(team.reputation||68)
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

  function seedGroups(participants){
    const ranked=
      participants
        .slice()
        .sort(
          (a,b)=>
            b.reputation-a.reputation ||
            a.name.localeCompare(b.name)
        );

    const pots=[
      ranked.slice(0,6),
      ranked.slice(6,12),
      ranked.slice(12,18),
      ranked.slice(18,24)
    ];

    const groups=
      groupNames.map(
        name=>({
          name,
          teams:[],
          table:[],
          matches:[]
        })
      );

    pots.forEach(
      (pot,potIndex)=>{
        pot.forEach(
          (team,index)=>{
            const target=
              potIndex%2===0
                ? index
                : 5-index;

            groups[target].teams.push(
              cloneTeam(team)
            );
          }
        );
      }
    );

    for(const group of groups){
      group.table=
        group.teams.map(emptyRow);

      const [a,b,c,d]=group.teams;

      const rounds=[
        [[a,b],[c,d]],
        [[a,c],[b,d]],
        [[a,d],[b,c]]
      ];

      let index=0;

      for(let round=0;round<3;round++){
        for(const [home,away] of rounds[round]){
          group.matches.push({
            id:
              "ASIAN_CUP:"+
              group.name+
              ":"+
              index++,
            group:group.name,
            round:round+1,
            phase:"GROUP",
            homeId:home.id,
            awayId:away.id,
            home:home.name,
            away:away.name,
            played:false,
            hg:null,
            ag:null,
            winnerId:null
          });
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

    if(selected.length!==24)
      throw new Error(
        "Asian Cup requires exactly 24 teams."
      );

    if(
      new Set(
        selected.map(x=>x.id)
      ).size!==24
    )
      throw new Error(
        "Asian Cup teams must be unique."
      );

    return {
      version:1,
      type:"ASIAN_CUP",
      name:"AFC Asian Cup",
      year:Number(year),
      status:"GROUP_STAGE",
      participants:selected,
      groups:seedGroups(selected),
      qualified16:[],
      knockout:[],
      champion:null,
      runnerUp:null
    };
  }

  function standings(tournament,name){
    const group=
      tournament.groups.find(
        g=>g.name===name
      );

    return group
      ? group.table
          .slice()
          .sort(compareRows)
      : [];
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

  function recordGroupResult(tournament,matchId,hg,ag){
    let match=null;
    let group=null;

    for(const g of tournament.groups){
      const found=
        g.matches.find(
          m=>m.id===matchId
        );

      if(found){
        match=found;
        group=g;
        break;
      }
    }

    if(!match)
      throw new Error(
        "Asian Cup group match not found."
      );

    if(match.played)
      throw new Error(
        "Match already played."
      );

    hg=Math.max(
      0,
      Math.floor(Number(hg)||0)
    );

    ag=Math.max(
      0,
      Math.floor(Number(ag)||0)
    );

    match.played=true;
    match.hg=hg;
    match.ag=ag;

    updateRow(
      group.table.find(
        x=>x.id===match.homeId
      ),
      hg,
      ag
    );

    updateRow(
      group.table.find(
        x=>x.id===match.awayId
      ),
      ag,
      hg
    );

    return match;
  }

  function groupStageComplete(tournament){
    return tournament.groups.every(
      group=>
        group.matches.every(
          match=>match.played
        )
    );
  }

  function bestThirds(tournament){
    return groupNames
      .map(
        name=>{
          const table=
            standings(
              tournament,
              name
            );

          return {
            ...table[2],
            group:name
          };
        }
      )
      .sort(compareRows)
      .slice(0,4);
  }

  function createMatch(phase,index,home,away){
    return {
      id:
        "ASIAN_CUP:"+
        phase+
        ":"+
        index,
      phase,
      index,
      homeId:home.id,
      awayId:away.id,
      home:home.name,
      away:away.name,
      played:false,
      hg:null,
      ag:null,
      hp:null,
      ap:null,
      winnerId:null
    };
  }

  function buildRoundOf16(tournament){
    if(!groupStageComplete(tournament))
      throw new Error(
        "Asian Cup group stage is not complete."
      );

    const direct=[];

    for(const name of groupNames){
      const table=
        standings(
          tournament,
          name
        );

      direct.push({
        ...table[0],
        group:name,
        groupPosition:1
      });

      direct.push({
        ...table[1],
        group:name,
        groupPosition:2
      });
    }

    const thirds=
      bestThirds(tournament);

    tournament.qualified16=[
      ...direct.map(cloneTeam),
      ...thirds.map(cloneTeam)
    ];

    const ranked=
      tournament.qualified16
        .slice()
        .sort(
          (a,b)=>
            b.reputation-a.reputation
        );

    tournament.knockout=[];

    for(let i=0;i<8;i++){
      tournament.knockout.push(
        createMatch(
          "ROUND_OF_16",
          i,
          ranked[i],
          ranked[15-i]
        )
      );
    }

    tournament.status="ROUND_OF_16";

    return tournament.knockout;
  }

  function participant(tournament,id){
    return (
      tournament.participants.find(
        team=>team.id===id
      )||
      null
    );
  }

  function winner(match,hg,ag,hp,ap){
    if(hg>ag)
      return match.homeId;

    if(ag>hg)
      return match.awayId;

    if(hp>ap)
      return match.homeId;

    if(ap>hp)
      return match.awayId;

    throw new Error(
      "Knockout draw requires penalty winner."
    );
  }

  function advance(tournament){
    const phase=
      tournament.status;

    if(phase==="FINAL"){
      const final=
        tournament.knockout.find(
          m=>m.phase==="FINAL"
        );

      if(!final?.played)
        return;

      tournament.champion=
        participant(
          tournament,
          final.winnerId
        );

      tournament.runnerUp=
        participant(
          tournament,
          final.winnerId===final.homeId
            ? final.awayId
            : final.homeId
        );

      tournament.status="COMPLETED";
      return;
    }

    const current=
      tournament.knockout.filter(
        match=>match.phase===phase
      );

    if(
      !current.length ||
      current.some(match=>!match.played)
    )
      return;

    const winners=
      current.map(
        match=>
          participant(
            tournament,
            match.winnerId
          )
      );

    if(phase==="ROUND_OF_16"){
      for(let i=0;i<4;i++){
        tournament.knockout.push(
          createMatch(
            "QUARTERFINAL",
            i,
            winners[i*2],
            winners[i*2+1]
          )
        );
      }

      tournament.status="QUARTERFINAL";
      return;
    }

    if(phase==="QUARTERFINAL"){
      for(let i=0;i<2;i++){
        tournament.knockout.push(
          createMatch(
            "SEMIFINAL",
            i,
            winners[i*2],
            winners[i*2+1]
          )
        );
      }

      tournament.status="SEMIFINAL";
      return;
    }

    if(phase==="SEMIFINAL"){
      tournament.knockout.push(
        createMatch(
          "FINAL",
          0,
          winners[0],
          winners[1]
        )
      );

      tournament.status="FINAL";
    }
  }

  function recordKnockoutResult(
    tournament,
    matchId,
    hg,
    ag,
    hp=null,
    ap=null
  ){
    const match=
      tournament.knockout.find(
        m=>m.id===matchId
      );

    if(!match)
      throw new Error(
        "Asian Cup knockout match not found."
      );

    if(match.played)
      throw new Error(
        "Match already played."
      );

    hg=Math.max(
      0,
      Math.floor(Number(hg)||0)
    );

    ag=Math.max(
      0,
      Math.floor(Number(ag)||0)
    );

    if(hg===ag){
      hp=Math.max(
        0,
        Math.floor(Number(hp)||0)
      );

      ap=Math.max(
        0,
        Math.floor(Number(ap)||0)
      );
    }
    else{
      hp=null;
      ap=null;
    }

    match.played=true;
    match.hg=hg;
    match.ag=ag;
    match.hp=hp;
    match.ap=ap;

    match.winnerId=
      winner(
        match,
        hg,
        ag,
        hp,
        ap
      );

    advance(tournament);

    return match;
  }

  function phaseLabel(phase){
    return ({
      GROUP_STAGE:"Fase de grupos",
      ROUND_OF_16:"Oitavas de final",
      QUARTERFINAL:"Quartas de final",
      SEMIFINAL:"Semifinal",
      FINAL:"Final",
      COMPLETED:"Encerrada"
    })[phase]||phase||"";
  }

  function totalMatches(){
    return 51;
  }

  const api={
    teams,
    createTournament,
    seedGroups,
    standings,
    recordGroupResult,
    bestThirds,
    buildRoundOf16,
    recordKnockoutResult,
    phaseLabel,
    totalMatches
  };

  root.ProLifeAsianCup=api;

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
