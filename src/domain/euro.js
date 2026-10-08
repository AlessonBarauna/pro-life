(function(root){
  "use strict";

  const teams=[
    {id:"ESP",name:"Espanha",reputation:94},
    {id:"FRA",name:"Franca",reputation:94},
    {id:"ENG",name:"Inglaterra",reputation:91},
    {id:"GER",name:"Alemanha",reputation:90},
    {id:"POR",name:"Portugal",reputation:90},
    {id:"NED",name:"Holanda",reputation:89},
    {id:"BEL",name:"Belgica",reputation:87},
    {id:"CRO",name:"Croacia",reputation:85},
    {id:"SUI",name:"Suica",reputation:83},
    {id:"ITA",name:"Italia",reputation:85},
    {id:"DEN",name:"Dinamarca",reputation:82},
    {id:"NOR",name:"Noruega",reputation:82},
    {id:"AUT",name:"Austria",reputation:81},
    {id:"SRB",name:"Servia",reputation:79},
    {id:"SWE",name:"Suecia",reputation:79},
    {id:"TUR",name:"Turquia",reputation:80},
    {id:"CZE",name:"Republica Tcheca",reputation:80},
    {id:"POL",name:"Polonia",reputation:79},
    {id:"SCO",name:"Escocia",reputation:77},
    {id:"UKR",name:"Ucrania",reputation:80},
    {id:"HUN",name:"Hungria",reputation:78},
    {id:"ROU",name:"Romenia",reputation:76},
    {id:"GRE",name:"Grecia",reputation:77},
    {id:"SVN",name:"Eslovenia",reputation:76}
  ];

  const groupNames=["A","B","C","D","E","F"];

  function cloneTeam(team){
    return {
      id:String(team.id),
      name:String(team.name),
      reputation:Number(team.reputation||70)
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
          (team,i)=>{
            const target=
              potIndex%2===0
                ? i
                : 5-i;

            groups[target].teams.push(
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

      const [a,b,c,d]=group.teams;

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
        for(const [home,away] of rounds[round]){
          group.matches.push({
            id:
              "EURO:"+group.name+":"+index,
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

          index++;
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

    if(selected.length!==24)
      throw new Error(
        "EURO requires exactly 24 teams."
      );

    if(
      new Set(
        selected.map(t=>t.id)
      ).size!==24
    )
      throw new Error(
        "EURO teams must be unique."
      );

    return {
      version:1,
      type:"EURO",
      name:"UEFA EURO",
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

  function standings(
    tournament,
    name
  ){
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

  function updateRow(
    row,
    gf,
    ga
  ){
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

  function recordGroupResult(
    tournament,
    matchId,
    hg,
    ag
  ){
    let selected=null;
    let selectedGroup=null;

    for(const group of tournament.groups){
      const match=
        group.matches.find(
          m=>m.id===matchId
        );

      if(match){
        selected=match;
        selectedGroup=group;
        break;
      }
    }

    if(!selected)
      throw new Error(
        "EURO group match not found."
      );

    if(selected.played)
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

    selected.played=true;
    selected.hg=hg;
    selected.ag=ag;

    updateRow(
      selectedGroup.table.find(
        x=>x.id===selected.homeId
      ),
      hg,
      ag
    );

    updateRow(
      selectedGroup.table.find(
        x=>x.id===selected.awayId
      ),
      ag,
      hg
    );

    return selected;
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
    const thirds=
      groupNames.map(
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
      );

    return thirds
      .sort(compareRows)
      .slice(0,4);
  }

  function createKnockoutMatch(
    phase,
    index,
    home,
    away
  ){
    return {
      id:
        "EURO:"+
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
    if(
      !groupStageComplete(tournament)
    )
      throw new Error(
        "EURO group stage is not complete."
      );

    const direct=[];
    const thirds=bestThirds(tournament);

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

    const fixtures=[];

    for(let i=0;i<8;i++){
      fixtures.push(
        createKnockoutMatch(
          "ROUND_OF_16",
          i,
          ranked[i],
          ranked[15-i]
        )
      );
    }

    tournament.knockout=fixtures;
    tournament.status="ROUND_OF_16";

    return fixtures;
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

  function winnerFromResult(
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

  function advanceKnockout(tournament){
    if(
      tournament.status==="FINAL"
    ){
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
        m=>m.phase===tournament.status
      );

    if(
      !current.length ||
      current.some(m=>!m.played)
    )
      return;

    const winners=
      current.map(
        m=>
          participant(
            tournament,
            m.winnerId
          )
      );

    if(
      tournament.status===
      "ROUND_OF_16"
    ){
      for(let i=0;i<4;i++){
        tournament.knockout.push(
          createKnockoutMatch(
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
      tournament.status===
      "QUARTERFINAL"
    ){
      for(let i=0;i<2;i++){
        tournament.knockout.push(
          createKnockoutMatch(
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
      tournament.status===
      "SEMIFINAL"
    ){
      tournament.knockout.push(
        createKnockoutMatch(
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
        m=>m.id===matchId
      );

    if(!match)
      throw new Error(
        "EURO knockout match not found."
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
      winnerFromResult(
        match,
        hg,
        ag,
        hp,
        ap
      );

    advanceKnockout(
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
    return 51;
  }

  const api={
    teams,
    seedGroups,
    createTournament,
    standings,
    recordGroupResult,
    bestThirds,
    buildRoundOf16,
    recordKnockoutResult,
    phaseLabel,
    totalMatches
  };

  root.ProLifeEuro=api;

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
