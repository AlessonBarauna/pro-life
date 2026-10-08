(function(root){
  "use strict";

  const teams=[
    {id:"NZL",name:"Nova Zelandia",reputation:80},
    {id:"NCL",name:"Nova Caledonia",reputation:69},
    {id:"SOL",name:"Ilhas Salomao",reputation:70},
    {id:"FIJ",name:"Fiji",reputation:69},
    {id:"VAN",name:"Vanuatu",reputation:68},
    {id:"TAH",name:"Taiti",reputation:68},
    {id:"PNG",name:"Papua-Nova Guine",reputation:66},
    {id:"SAM",name:"Samoa",reputation:62}
  ];

  const groupNames=[
    "A",
    "B"
  ];

  function cloneTeam(team){
    return {
      id:String(team.id),
      name:String(team.name),
      reputation:Number(
        team.reputation||60
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

    const groups=
      groupNames.map(
        name=>({
          name,
          teams:[],
          table:[],
          matches:[]
        })
      );

    ranked.forEach(
      (team,index)=>{
        const pot=
          Math.floor(index/2);

        const within=
          index%2;

        const target=
          pot%2===0
            ? within
            : 1-within;

        groups[target]
          .teams.push(
            cloneTeam(team)
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
        round<3;
        round++
      ){
        for(
          const [home,away]
          of rounds[round]
        ){
          group.matches.push({
            id:
              "OFC_NATIONS_CUP:"+
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

    if(selected.length!==8)
      throw new Error(
        "OFC Nations Cup requires exactly 8 teams."
      );

    if(
      new Set(
        selected.map(
          team=>team.id
        )
      ).size!==8
    )
      throw new Error(
        "OFC Nations Cup teams must be unique."
      );

    return {
      version:1,
      type:"OFC_NATIONS_CUP",
      name:"OFC Nations Cup",
      year:Number(year),
      status:"GROUP_STAGE",
      participants:selected,
      groups:seedGroups(selected),
      qualified4:[],
      knockout:[],
      champion:null,
      runnerUp:null
    };
  }

  function standings(
    tournament,
    groupName
  ){
    const group=
      tournament.groups.find(
        item=>
          item.name===groupName
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
    let match=null;
    let group=null;

    for(
      const candidate
      of tournament.groups
    ){
      const found=
        candidate.matches.find(
          item=>
            item.id===matchId
        );

      if(found){
        match=found;
        group=candidate;
        break;
      }
    }

    if(!match)
      throw new Error(
        "OFC Nations Cup group match not found."
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

    match.played=true;
    match.hg=hg;
    match.ag=ag;

    updateRow(
      group.table.find(
        row=>
          row.id===match.homeId
      ),
      hg,
      ag
    );

    updateRow(
      group.table.find(
        row=>
          row.id===match.awayId
      ),
      ag,
      hg
    );

    return match;
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

  function createMatch(
    phase,
    index,
    home,
    away
  ){
    return {
      id:
        "OFC_NATIONS_CUP:"+
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

  function buildSemifinals(
    tournament
  ){
    if(
      !groupStageComplete(
        tournament
      )
    )
      throw new Error(
        "OFC Nations Cup group stage is not complete."
      );

    const A=
      standings(
        tournament,
        "A"
      );

    const B=
      standings(
        tournament,
        "B"
      );

    tournament.qualified4=[
      cloneTeam(A[0]),
      cloneTeam(A[1]),
      cloneTeam(B[0]),
      cloneTeam(B[1])
    ];

    tournament.knockout=[
      createMatch(
        "SEMIFINAL",
        0,
        A[0],
        B[1]
      ),
      createMatch(
        "SEMIFINAL",
        1,
        B[0],
        A[1]
      )
    ];

    tournament.status=
      "SEMIFINAL";

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

  function resolveWinner(
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
    if(
      tournament.status===
      "SEMIFINAL"
    ){
      const semifinals=
        tournament.knockout.filter(
          match=>
            match.phase===
            "SEMIFINAL"
        );

      if(
        semifinals.length!==2 ||
        semifinals.some(
          match=>!match.played
        )
      )
        return;

      const winners=
        semifinals.map(
          match=>
            participant(
              tournament,
              match.winnerId
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

      tournament.status=
        "FINAL";

      return;
    }

    if(
      tournament.status===
      "FINAL"
    ){
      const final=
        tournament.knockout.find(
          match=>
            match.phase===
            "FINAL"
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
          final.winnerId===
          final.homeId
            ? final.awayId
            : final.homeId
        );

      tournament.status=
        "COMPLETED";
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
        "OFC Nations Cup knockout match not found."
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
      resolveWinner(
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
      SEMIFINAL:"Semifinais",
      FINAL:"Final",
      COMPLETED:"Encerrada"
    })[phase]||phase||"";
  }

  function totalMatches(){
    return 15;
  }

  const api={
    teams,
    createTournament,
    seedGroups,
    standings,
    recordGroupResult,
    buildSemifinals,
    recordKnockoutResult,
    phaseLabel,
    totalMatches
  };

  root.ProLifeOfcNationsCup=
    api;

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
