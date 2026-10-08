(function(root){
  "use strict";

  const conmebol=[
    {id:"ARG",name:"Argentina",reputation:93},
    {id:"BOL",name:"Bolivia",reputation:70},
    {id:"BRA",name:"Brasil",reputation:92},
    {id:"CHI",name:"Chile",reputation:77},
    {id:"COL",name:"Colombia",reputation:84},
    {id:"ECU",name:"Equador",reputation:80},
    {id:"PAR",name:"Paraguai",reputation:76},
    {id:"PER",name:"Peru",reputation:75},
    {id:"URU",name:"Uruguai",reputation:86},
    {id:"VEN",name:"Venezuela",reputation:75}
  ];

  const guestPool=[
    {id:"USA",name:"Estados Unidos",reputation:81},
    {id:"MEX",name:"Mexico",reputation:81},
    {id:"CAN",name:"Canada",reputation:78},
    {id:"CRC",name:"Costa Rica",reputation:75},
    {id:"PAN",name:"Panama",reputation:73},
    {id:"JAM",name:"Jamaica",reputation:73},
    {id:"HON",name:"Honduras",reputation:71},
    {id:"GUA",name:"Guatemala",reputation:70}
  ];

  const groupNames=["A","B","C","D"];

  function cloneTeam(team){
    return {
      id:String(team.id),
      name:String(team.name),
      reputation:Number(team.reputation||70)
    };
  }

  function hash(value){
    let h=2166136261;

    for(const ch of String(value)){
      h^=ch.charCodeAt(0);
      h=Math.imul(h,16777619);
    }

    return h>>>0;
  }

  function deterministicGuests(year,count=6){
    return guestPool
      .slice()
      .sort(
        (a,b)=>{
          const ah=hash(
            year+":"+a.id
          );

          const bh=hash(
            year+":"+b.id
          );

          return (
            b.reputation-a.reputation ||
            ah-bh
          );
        }
      )
      .slice(0,count)
      .map(cloneTeam);
  }

  function defaultParticipants(year){
    return [
      ...conmebol.map(cloneTeam),
      ...deterministicGuests(year,6)
    ];
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
            a.name.localeCompare(
              b.name
            )
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
          (team,i)=>{
            const target=
              potIndex%2===0
                ? i
                : 3-i;

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
        for(const [home,away] of rounds[round]){
          group.matches.push({
            id:
              "CA:"+group.name+":"+
              index,
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
        ? participants.map(
            cloneTeam
          )
        : defaultParticipants(
            year
          );

    if(selected.length!==16)
      throw new Error(
        "Copa America requires exactly 16 teams."
      );

    if(
      new Set(
        selected.map(
          t=>t.id
        )
      ).size!==16
    )
      throw new Error(
        "Copa America teams must be unique."
      );

    if(
      !selected.some(
        t=>t.id==="BRA"
      )
    )
      throw new Error(
        "Brazil must participate in Copa America."
      );

    return {
      version:1,
      type:"COPA_AMERICA",
      name:"CONMEBOL Copa America",
      year:Number(year),
      status:"GROUP_STAGE",
      champion:null,
      runnerUp:null,
      thirdPlace:null,
      participants:selected,
      groups:seedGroups(
        selected
      ),
      qualified8:[],
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
      a.name.localeCompare(
        b.name
      )
    );
  }

  function group(
    tournament,
    name
  ){
    return (
      tournament.groups.find(
        g=>g.name===name
      )||
      null
    );
  }

  function standings(
    tournament,
    name
  ){
    const g=
      group(
        tournament,
        name
      );

    return g
      ? g.table
          .slice()
          .sort(
            compareRows
          )
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

  function findGroupMatch(
    tournament,
    matchId
  ){
    for(const g of tournament.groups){
      const match=
        g.matches.find(
          m=>m.id===matchId
        );

      if(match)
        return {
          group:g,
          match
        };
    }

    return null;
  }

  function recordGroupResult(
    tournament,
    matchId,
    hg,
    ag
  ){
    const found=
      findGroupMatch(
        tournament,
        matchId
      );

    if(!found)
      throw new Error(
        "Partida da Copa America nao encontrada."
      );

    if(found.match.played)
      throw new Error(
        "Partida ja disputada."
      );

    hg=
      Math.max(
        0,
        Math.floor(
          Number(hg)||0
        )
      );

    ag=
      Math.max(
        0,
        Math.floor(
          Number(ag)||0
        )
      );

    found.match.played=true;
    found.match.hg=hg;
    found.match.ag=ag;

    const home=
      found.group.table.find(
        x=>
          x.id===
          found.match.homeId
      );

    const away=
      found.group.table.find(
        x=>
          x.id===
          found.match.awayId
      );

    updateRow(
      home,
      hg,
      ag
    );

    updateRow(
      away,
      ag,
      hg
    );

    return found.match;
  }

  function allGroupMatchesPlayed(
    tournament
  ){
    return tournament.groups.every(
      g=>
        g.matches.every(
          m=>m.played
        )
    );
  }

  function buildQuarterfinals(
    tournament
  ){
    if(
      !allGroupMatchesPlayed(
        tournament
      )
    )
      throw new Error(
        "A fase de grupos ainda nao terminou."
      );

    const ranked=
      Object.fromEntries(
        groupNames.map(
          name=>[
            name,
            standings(
              tournament,
              name
            )
          ]
        )
      );

    tournament.qualified8=[
      ranked.A[0],
      ranked.A[1],
      ranked.B[0],
      ranked.B[1],
      ranked.C[0],
      ranked.C[1],
      ranked.D[0],
      ranked.D[1]
    ].map(cloneTeam);

    const fixtures=[
      [ranked.A[0],ranked.B[1]],
      [ranked.B[0],ranked.A[1]],
      [ranked.C[0],ranked.D[1]],
      [ranked.D[0],ranked.C[1]]
    ];

    tournament.knockout=
      fixtures.map(
        ([home,away],index)=>({
          id:
            "CA:QF:"+
            index,
          phase:"QUARTERFINAL",
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
        })
      );

    tournament.status=
      "QUARTERFINAL";

    return tournament.knockout;
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
      "Empate no mata-mata exige vencedor nos penaltis."
    );
  }

  function findParticipant(
    tournament,
    id
  ){
    return tournament.participants.find(
      t=>t.id===id
    );
  }

  function createKnockoutMatch(
    phase,
    index,
    home,
    away
  ){
    return {
      id:
        "CA:"+
        phase+":"+
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

  function advanceKnockout(
    tournament
  ){
    if(
      tournament.status===
      "FINALS"
    ){
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
        findParticipant(
          tournament,
          final.winnerId
        );

      tournament.runnerUp=
        findParticipant(
          tournament,
          final.winnerId===
            final.homeId
            ? final.awayId
            : final.homeId
        );

      tournament.thirdPlace=
        findParticipant(
          tournament,
          third.winnerId
        );

      tournament.status=
        "COMPLETED";

      return;
    }

    const current=
      tournament.knockout.filter(
        m=>
          m.phase===
          tournament.status
      );

    if(
      !current.length ||
      current.some(
        m=>!m.played
      )
    )
      return;

    if(
      tournament.status===
      "QUARTERFINAL"
    ){
      const winners=
        current.map(
          m=>
            findParticipant(
              tournament,
              m.winnerId
            )
        );

      tournament.knockout.push(
        createKnockoutMatch(
          "SEMIFINAL",
          0,
          winners[0],
          winners[1]
        ),
        createKnockoutMatch(
          "SEMIFINAL",
          1,
          winners[2],
          winners[3]
        )
      );

      tournament.status=
        "SEMIFINAL";

      return;
    }

    if(
      tournament.status===
      "SEMIFINAL"
    ){
      const winners=
        current.map(
          m=>
            findParticipant(
              tournament,
              m.winnerId
            )
        );

      const losers=
        current.map(
          m=>
            findParticipant(
              tournament,
              m.winnerId===
                m.homeId
                ? m.awayId
                : m.homeId
            )
        );

      tournament.knockout.push(
        createKnockoutMatch(
          "THIRD_PLACE",
          0,
          losers[0],
          losers[1]
        ),
        createKnockoutMatch(
          "FINAL",
          0,
          winners[0],
          winners[1]
        )
      );

      tournament.status=
        "FINALS";

      return;
    }

    if(
      tournament.status===
      "FINALS"
    ){
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
        findParticipant(
          tournament,
          final.winnerId
        );

      tournament.runnerUp=
        findParticipant(
          tournament,
          final.winnerId===
            final.homeId
            ? final.awayId
            : final.homeId
        );

      tournament.thirdPlace=
        findParticipant(
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
        "Partida de mata-mata nao encontrada."
      );

    if(match.played)
      throw new Error(
        "Partida ja disputada."
      );

    hg=
      Math.max(
        0,
        Math.floor(
          Number(hg)||0
        )
      );

    ag=
      Math.max(
        0,
        Math.floor(
          Number(ag)||0
        )
      );

    if(hg===ag){
      hp=
        Math.max(
          0,
          Math.floor(
            Number(hp)||0
          )
        );

      ap=
        Math.max(
          0,
          Math.floor(
            Number(ap)||0
          )
        );
    }

    match.played=true;
    match.hg=hg;
    match.ag=ag;
    match.hp=
      hg===ag
        ? hp
        : null;
    match.ap=
      hg===ag
        ? ap
        : null;

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

  function brazilGroup(
    tournament
  ){
    return (
      tournament.groups.find(
        g=>
          g.teams.some(
            t=>t.id==="BRA"
          )
      )||
      null
    );
  }

  function phaseLabel(
    phase
  ){
    return ({
      GROUP_STAGE:
        "Fase de grupos",
      QUARTERFINAL:
        "Quartas de final",
      SEMIFINAL:
        "Semifinal",
      FINALS:
        "Finais",
      THIRD_PLACE:
        "Disputa de terceiro lugar",
      FINAL:
        "Final",
      COMPLETED:
        "Encerrada"
    })[phase]||
      phase||
      "";
  }

  function totalMatches(){
    return 32;
  }

  const api={
    conmebol,
    guestPool,
    defaultParticipants,
    seedGroups,
    createTournament,
    standings,
    recordGroupResult,
    buildQuarterfinals,
    recordKnockoutResult,
    brazilGroup,
    phaseLabel,
    totalMatches
  };

  root.ProLifeCopaAmerica=
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
