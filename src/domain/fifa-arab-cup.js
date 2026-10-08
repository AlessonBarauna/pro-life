(function(root){
  "use strict";

  const teams=[
    {id:"MAR",name:"Marrocos",reputation:84},
    {id:"EGY",name:"Egito",reputation:78},
    {id:"ALG",name:"Argelia",reputation:77},
    {id:"TUN",name:"Tunisia",reputation:74},

    {id:"QAT",name:"Catar",reputation:79},
    {id:"KSA",name:"Arabia Saudita",reputation:79},
    {id:"IRQ",name:"Iraque",reputation:76},
    {id:"UAE",name:"Emirados Arabes",reputation:75},

    {id:"JOR",name:"Jordania",reputation:75},
    {id:"OMA",name:"Oma",reputation:73},
    {id:"SYR",name:"Siria",reputation:72},
    {id:"BHR",name:"Bahrein",reputation:72},

    {id:"PLE",name:"Palestina",reputation:69},
    {id:"LBN",name:"Libano",reputation:68},
    {id:"KUW",name:"Kuwait",reputation:69},
    {id:"SDN",name:"Sudao",reputation:67}
  ];

  const groupNames=[
    "A","B","C","D"
  ];

  function cloneTeam(team){
    return {
      id:String(team.id),
      name:String(team.name),
      reputation:Number(
        team.reputation||65
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
              "FIFA_ARAB_CUP:"+
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
            ag:null
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

    if(selected.length!==16)
      throw new Error(
        "FIFA Arab Cup requires exactly 16 teams."
      );

    if(
      new Set(
        selected.map(
          team=>team.id
        )
      ).size!==16
    )
      throw new Error(
        "FIFA Arab Cup teams must be unique."
      );

    return {
      version:1,
      type:"FIFA_ARAB_CUP",
      name:"FIFA Arab Cup",
      year:Number(year),
      status:"GROUP_STAGE",
      participants:selected,
      groups:seedGroups(selected),
      qualified8:[],
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
        "FIFA Arab Cup group match not found."
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
        "FIFA_ARAB_CUP:"+
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
        "FIFA Arab Cup group stage is not complete."
      );

    const A=standings(tournament,"A");
    const B=standings(tournament,"B");
    const C=standings(tournament,"C");
    const D=standings(tournament,"D");

    tournament.qualified8=[
      cloneTeam(A[0]),
      cloneTeam(A[1]),
      cloneTeam(B[0]),
      cloneTeam(B[1]),
      cloneTeam(C[0]),
      cloneTeam(C[1]),
      cloneTeam(D[0]),
      cloneTeam(D[1])
    ];

    tournament.knockout=[
      createMatch(
        "QUARTERFINAL",
        0,
        A[0],
        B[1]
      ),
      createMatch(
        "QUARTERFINAL",
        1,
        B[0],
        A[1]
      ),
      createMatch(
        "QUARTERFINAL",
        2,
        C[0],
        D[1]
      ),
      createMatch(
        "QUARTERFINAL",
        3,
        D[0],
        C[1]
      )
    ];

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
    const phase=
      tournament.status;

    if(phase==="QUARTERFINAL"){
      const qf=
        tournament.knockout.filter(
          m=>m.phase==="QUARTERFINAL"
        );

      if(
        qf.length!==4 ||
        qf.some(
          m=>!m.played
        )
      )
        return;

      const winners=
        qf.map(
          m=>
            participant(
              tournament,
              m.winnerId
            )
        );

      tournament.knockout.push(
        createMatch(
          "SEMIFINAL",
          0,
          winners[0],
          winners[2]
        )
      );

      tournament.knockout.push(
        createMatch(
          "SEMIFINAL",
          1,
          winners[1],
          winners[3]
        )
      );

      tournament.status=
        "SEMIFINAL";

      return;
    }

    if(phase==="SEMIFINAL"){
      const semifinals=
        tournament.knockout.filter(
          m=>m.phase==="SEMIFINAL"
        );

      if(
        semifinals.length!==2 ||
        semifinals.some(
          m=>!m.played
        )
      )
        return;

      const winners=
        semifinals.map(
          m=>
            participant(
              tournament,
              m.winnerId
            )
        );

      const losers=
        semifinals.map(
          m=>
            participant(
              tournament,
              m.winnerId===m.homeId
                ? m.awayId
                : m.homeId
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

      return;
    }

    if(phase==="FINAL"){
      const final=
        tournament.knockout.find(
          m=>m.phase==="FINAL"
        );

      const third=
        tournament.knockout.find(
          m=>m.phase==="THIRD_PLACE"
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
          final.winnerId===final.homeId
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
        "FIFA Arab Cup knockout match not found."
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
      QUARTERFINAL:"Quartas de final",
      SEMIFINAL:"Semifinais",
      FINAL:"Final",
      COMPLETED:"Encerrada"
    })[phase]||phase||"";
  }

  function totalMatches(){
    return 32;
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

  root.ProLifeFifaArabCup=
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
