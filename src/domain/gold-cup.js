(function(root){
  "use strict";

  const teams=[
    {id:"MEX",name:"Mexico",reputation:84},
    {id:"USA",name:"Estados Unidos",reputation:83},
    {id:"CAN",name:"Canada",reputation:81},
    {id:"CRC",name:"Costa Rica",reputation:78},

    {id:"PAN",name:"Panama",reputation:79},
    {id:"JAM",name:"Jamaica",reputation:76},
    {id:"HON",name:"Honduras",reputation:75},
    {id:"SLV",name:"El Salvador",reputation:72},

    {id:"HAI",name:"Haiti",reputation:72},
    {id:"CUW",name:"Curacao",reputation:74},
    {id:"GUA",name:"Guatemala",reputation:73},
    {id:"TRI",name:"Trinidad e Tobago",reputation:71},

    {id:"SUR",name:"Suriname",reputation:70},
    {id:"DOM",name:"Republica Dominicana",reputation:69},
    {id:"GLP",name:"Guadalupe",reputation:69},
    {id:"MTQ",name:"Martinica",reputation:68}
  ];

  const groupNames=["A","B","C","D"];

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
      ranked.slice(0,4),
      ranked.slice(4,8),
      ranked.slice(8,12),
      ranked.slice(12,16)
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
                : 3-index;

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
        round<3;
        round++
      ){
        for(
          const [home,away]
          of rounds[round]
        ){
          group.matches.push({
            id:
              "GOLD_CUP:"+
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
        ? participants.map(cloneTeam)
        : teams.map(cloneTeam);

    if(selected.length!==16)
      throw new Error(
        "Gold Cup requires exactly 16 teams."
      );

    if(
      new Set(
        selected.map(
          x=>x.id
        )
      ).size!==16
    )
      throw new Error(
        "Gold Cup teams must be unique."
      );

    return {
      version:1,
      type:"GOLD_CUP",
      name:"CONCACAF Gold Cup",
      year:Number(year),
      status:"GROUP_STAGE",
      participants:selected,
      groups:seedGroups(selected),
      qualified8:[],
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
        g=>g.name===groupName
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
          m=>m.id===matchId
        );

      if(found){
        match=found;
        group=candidate;
        break;
      }
    }

    if(!match)
      throw new Error(
        "Gold Cup group match not found."
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
        "GOLD_CUP:"+
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

  function buildQuarterfinals(
    tournament
  ){
    if(
      !groupStageComplete(
        tournament
      )
    )
      throw new Error(
        "Gold Cup group stage is not complete."
      );

    const table={};

    for(const name of groupNames){
      table[name]=
        standings(
          tournament,
          name
        );
    }

    tournament.qualified8=
      groupNames.flatMap(
        name=>[
          cloneTeam(
            table[name][0]
          ),
          cloneTeam(
            table[name][1]
          )
        ]
      );

    // Current Gold Cup bracket:
    // QF1 1D v 2A
    // QF2 1A v 2D
    // QF3 1C v 2B
    // QF4 1B v 2C
    const pairs=[
      [table.D[0],table.A[1]],
      [table.A[0],table.D[1]],
      [table.C[0],table.B[1]],
      [table.B[0],table.C[1]]
    ];

    tournament.knockout=
      pairs.map(
        ([home,away],index)=>
          createMatch(
            "QUARTERFINAL",
            index,
            home,
            away
          )
      );

    tournament.status=
      "QUARTERFINAL";

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
            match.phase==="FINAL"
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
      "QUARTERFINAL"
    ){
      // WQF1 x WQF4
      // WQF2 x WQF3
      tournament.knockout.push(
        createMatch(
          "SEMIFINAL",
          0,
          winners[0],
          winners[3]
        )
      );

      tournament.knockout.push(
        createMatch(
          "SEMIFINAL",
          1,
          winners[1],
          winners[2]
        )
      );

      tournament.status=
        "SEMIFINAL";

      return;
    }

    if(
      phase===
      "SEMIFINAL"
    ){
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
        "Gold Cup knockout match not found."
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

    advance(
      tournament
    );

    return match;
  }

  function phaseLabel(phase){
    return ({
      GROUP_STAGE:"Fase de grupos",
      QUARTERFINAL:"Quartas de final",
      SEMIFINAL:"Semifinal",
      FINAL:"Final",
      COMPLETED:"Encerrada"
    })[phase]||phase||"";
  }

  function totalMatches(){
    return 31;
  }

  const api={
    teams,
    createTournament,
    seedGroups,
    standings,
    recordGroupResult,
    buildQuarterfinals,
    recordKnockoutResult,
    phaseLabel,
    totalMatches
  };

  root.ProLifeGoldCup=api;

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
