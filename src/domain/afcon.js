(function(root){
  "use strict";

  const teams=[
    {id:"MAR",name:"Marrocos",reputation:84},
    {id:"SEN",name:"Senegal",reputation:82},
    {id:"CIV",name:"Costa do Marfim",reputation:80},
    {id:"EGY",name:"Egito",reputation:78},
    {id:"ALG",name:"Argelia",reputation:77},
    {id:"NGA",name:"Nigeria",reputation:81},
    {id:"CMR",name:"Camaroes",reputation:79},
    {id:"GHA",name:"Gana",reputation:76},
    {id:"TUN",name:"Tunisia",reputation:74},
    {id:"MLI",name:"Mali",reputation:76},
    {id:"BFA",name:"Burkina Faso",reputation:74},
    {id:"COD",name:"RD Congo",reputation:75},
    {id:"RSA",name:"Africa do Sul",reputation:74},
    {id:"CPV",name:"Cabo Verde",reputation:73},
    {id:"GUI",name:"Guine",reputation:72},
    {id:"ZAM",name:"Zambia",reputation:72},
    {id:"ANG",name:"Angola",reputation:71},
    {id:"GAB",name:"Gabao",reputation:71},
    {id:"UGA",name:"Uganda",reputation:70},
    {id:"BEN",name:"Benin",reputation:69},
    {id:"EQG",name:"Guine Equatorial",reputation:70},
    {id:"MOZ",name:"Mocambique",reputation:68},
    {id:"TAN",name:"Tanzania",reputation:68},
    {id:"ZIM",name:"Zimbabue",reputation:68}
  ];

  const groupNames=[
    "A","B","C","D","E","F"
  ];

  function cloneTeam(team){
    return {
      id:String(team.id),
      name:String(team.name),
      reputation:Number(
        team.reputation||68
      )
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

            groups[target]
              .teams.push(
                cloneTeam(team)
              );
          }
        );
      }
    );

    for(const group of groups){
      group.table=
        group.teams.map(
          emptyRow
        );

      const [a,b,c,d]=
        group.teams;

      const rounds=[
        [[a,b],[c,d]],
        [[a,c],[b,d]],
        [[a,d],[b,c]]
      ];

      let index=0;

      for(
        let round=0;
        round<rounds.length;
        round++
      ){
        for(
          const [home,away]
          of rounds[round]
        ){
          group.matches.push({
            id:
              "AFCON:"+
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

  function createTournament(
    year,
    participants=null
  ){
    const selected=
      Array.isArray(participants)
        ? participants.map(
            cloneTeam
          )
        : teams.map(
            cloneTeam
          );

    if(selected.length!==24)
      throw new Error(
        "AFCON requires exactly 24 teams."
      );

    if(
      new Set(
        selected.map(
          team=>team.id
        )
      ).size!==24
    )
      throw new Error(
        "AFCON teams must be unique."
      );

    return {
      version:1,
      type:"AFCON",
      name:"Africa Cup of Nations",
      year:Number(year),
      status:"GROUP_STAGE",
      participants:selected,
      groups:seedGroups(selected),
      qualified16:[],
      knockout:[],
      champion:null,
      runnerUp:null,
      thirdPlace:null
    };
  }

  function standings(
    tournament,
    groupName
  ){
    const group=
      tournament.groups.find(
        group=>
          group.name===
          groupName
      );

    return group
      ? group.table
          .slice()
          .sort(compareRows)
      : [];
  }

  function updateRow(
    row,
    gf,
    ga
  ){
    row.played++;
    row.gf+=gf;
    row.ga+=ga;
    row.gd=
      row.gf-row.ga;

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

  function recordGroupResult(
    tournament,
    matchId,
    hg,
    ag
  ){
    let selected=null;
    let group=null;

    for(
      const candidate
      of tournament.groups
    ){
      const match=
        candidate.matches.find(
          item=>
            item.id===matchId
        );

      if(match){
        selected=match;
        group=candidate;
        break;
      }
    }

    if(!selected)
      throw new Error(
        "AFCON group match not found."
      );

    if(selected.played)
      throw new Error(
        "Match already played."
      );

    hg=Math.max(
      0,
      Math.floor(
        Number(hg)||0
      )
    );

    ag=Math.max(
      0,
      Math.floor(
        Number(ag)||0
      )
    );

    selected.played=true;
    selected.hg=hg;
    selected.ag=ag;

    updateRow(
      group.table.find(
        x=>x.id===selected.homeId
      ),
      hg,
      ag
    );

    updateRow(
      group.table.find(
        x=>x.id===selected.awayId
      ),
      ag,
      hg
    );

    return selected;
  }

  function groupStageComplete(
    tournament
  ){
    return tournament.groups.every(
      group=>
        group.matches.every(
          match=>match.played
        )
    );
  }

  function bestThirds(
    tournament
  ){
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

  function createMatch(
    phase,
    index,
    home,
    away
  ){
    return {
      id:
        "AFCON:"+
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

  function buildRoundOf16(
    tournament
  ){
    if(
      !groupStageComplete(
        tournament
      )
    )
      throw new Error(
        "AFCON group stage is not complete."
      );

    const direct=[];

    for(
      const name
      of groupNames
    ){
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
      bestThirds(
        tournament
      );

    tournament.qualified16=[
      ...direct.map(
        cloneTeam
      ),
      ...thirds.map(
        cloneTeam
      )
    ];

    const ranked=
      tournament.qualified16
        .slice()
        .sort(
          (a,b)=>
            b.reputation-a.reputation
        );

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

    tournament.status=
      "ROUND_OF_16";

    return tournament.knockout;
  }

  function participant(
    tournament,
    id
  ){
    return (
      tournament.participants.find(
        team=>team.id===id
      )||
      null
    );
  }

  function winner(
    match,
    hg,
    ag,
    hp,
    ap
  ){
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

  function advance(
    tournament
  ){
    const phase=
      tournament.status;

    if(phase==="FINAL"){
      const final=
        tournament.knockout.find(
          match=>
            match.phase===
            "FINAL"
        );

      const third=
        tournament.knockout.find(
          match=>
            match.phase===
            "THIRD_PLACE"
        );

      if(
        !final?.played ||
        !third?.played
      )
        return;

      tournament.champion=
        participant(
          tournament,
          final.winnerId
        );

      tournament.runnerUp=
        participant(
          tournament,
          final.winnerId===
          final.homeId
            ? final.awayId
            : final.homeId
        );

      tournament.thirdPlace=
        participant(
          tournament,
          third.winnerId
        );

      tournament.status=
        "COMPLETED";

      return;
    }

    const current=
      tournament.knockout.filter(
        match=>
          match.phase===phase
      );

    if(
      !current.length ||
      current.some(
        match=>!match.played
      )
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

    if(
      phase===
      "ROUND_OF_16"
    ){
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

      tournament.status=
        "QUARTERFINAL";

      return;
    }

    if(
      phase===
      "QUARTERFINAL"
    ){
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

      tournament.status=
        "SEMIFINAL";

      return;
    }

    if(
      phase===
      "SEMIFINAL"
    ){
      const losers=
        current.map(
          match=>
            participant(
              tournament,
              match.winnerId===
              match.homeId
                ? match.awayId
                : match.homeId
            )
        );

      tournament.knockout.push(
        createMatch(
          "FINAL",
          0,
          winners[0],
          winners[1]
        )
      );

      tournament.knockout.push(
        createMatch(
          "THIRD_PLACE",
          0,
          losers[0],
          losers[1]
        )
      );

      tournament.status=
        "FINAL";
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
        item=>
          item.id===matchId
      );

    if(!match)
      throw new Error(
        "AFCON knockout match not found."
      );

    if(match.played)
      throw new Error(
        "Match already played."
      );

    hg=Math.max(
      0,
      Math.floor(
        Number(hg)||0
      )
    );

    ag=Math.max(
      0,
      Math.floor(
        Number(ag)||0
      )
    );

    if(hg===ag){
      hp=Math.max(
        0,
        Math.floor(
          Number(hp)||0
        )
      );

      ap=Math.max(
        0,
        Math.floor(
          Number(ap)||0
        )
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

    advance(
      tournament
    );

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
    return 52;
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

  root.ProLifeAfcon=api;

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
