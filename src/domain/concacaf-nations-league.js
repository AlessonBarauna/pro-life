(function(root){
  "use strict";

  const teams=[
    {id:"MEX",name:"Mexico",reputation:84},
    {id:"USA",name:"Estados Unidos",reputation:83},
    {id:"CAN",name:"Canada",reputation:81},
    {id:"PAN",name:"Panama",reputation:79},

    {id:"CRC",name:"Costa Rica",reputation:78},
    {id:"JAM",name:"Jamaica",reputation:76},
    {id:"HON",name:"Honduras",reputation:75},
    {id:"GUA",name:"Guatemala",reputation:73},
    {id:"TRI",name:"Trinidad e Tobago",reputation:72},
    {id:"CUB",name:"Cuba",reputation:70},
    {id:"NIC",name:"Nicaragua",reputation:69},
    {id:"SUR",name:"Suriname",reputation:70},
    {id:"GUY",name:"Guiana",reputation:67},
    {id:"GLP",name:"Guadalupe",reputation:69},
    {id:"MTQ",name:"Martinica",reputation:68},
    {id:"FGU",name:"Guiana Francesa",reputation:66},

    {id:"SLV",name:"El Salvador",reputation:72},
    {id:"CUW",name:"Curacao",reputation:74},
    {id:"HAI",name:"Haiti",reputation:72},
    {id:"DOM",name:"Republica Dominicana",reputation:69},
    {id:"BER",name:"Bermudas",reputation:67},
    {id:"GRN",name:"Granada",reputation:65},
    {id:"LCA",name:"Santa Lucia",reputation:65},
    {id:"SVG",name:"Sao Vicente e Granadinas",reputation:64},
    {id:"ANT",name:"Antigua e Barbuda",reputation:64},
    {id:"ARU",name:"Aruba",reputation:64},
    {id:"MSR",name:"Montserrat",reputation:62},
    {id:"BON",name:"Bonaire",reputation:62},
    {id:"SXM",name:"Sint Maarten",reputation:61},
    {id:"MAF",name:"Saint Martin",reputation:61},
    {id:"DMA",name:"Dominica",reputation:61},
    {id:"PUR",name:"Porto Rico",reputation:68},

    {id:"BRB",name:"Barbados",reputation:63},
    {id:"BAH",name:"Bahamas",reputation:60},
    {id:"BLZ",name:"Belize",reputation:64},
    {id:"SKN",name:"Sao Cristovao e Nevis",reputation:64},
    {id:"CAY",name:"Ilhas Cayman",reputation:60},
    {id:"TCA",name:"Ilhas Turcas e Caicos",reputation:58},
    {id:"AIA",name:"Anguilla",reputation:56},
    {id:"VGB",name:"Ilhas Virgens Britanicas",reputation:55},
    {id:"VIR",name:"Ilhas Virgens Americanas",reputation:55}
  ];

  function cloneTeam(t){
    return {
      id:String(t.id),
      name:String(t.name),
      reputation:Number(t.reputation||60)
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

  function roundRobinMatches(prefix,group,homeAway=true){
    const matches=[];
    let id=0;

    for(let i=0;i<group.teams.length;i++){
      for(let j=i+1;j<group.teams.length;j++){
        const a=group.teams[i];
        const b=group.teams[j];

        matches.push({
          id:prefix+":"+group.name+":"+id++,
          homeId:a.id,
          awayId:b.id,
          home:a.name,
          away:b.name,
          played:false,
          hg:null,
          ag:null
        });

        if(homeAway){
          matches.push({
            id:prefix+":"+group.name+":"+id++,
            homeId:b.id,
            awayId:a.id,
            home:b.name,
            away:a.name,
            played:false,
            hg:null,
            ag:null
          });
        }
      }
    }

    return matches;
  }

  function createGroups(list,count,prefix,homeAway=true){
    const ranked=
      list.slice().sort(
        (a,b)=>b.reputation-a.reputation
      );

    const groups=
      Array.from(
        {length:count},
        (_,i)=>({
          name:String.fromCharCode(65+i),
          teams:[],
          table:[],
          matches:[]
        })
      );

    ranked.forEach(
      (team,index)=>{
        groups[index%count]
          .teams.push(
            cloneTeam(team)
          );
      }
    );

    for(const group of groups){
      group.table=
        group.teams.map(emptyRow);

      group.matches=
        roundRobinMatches(
          prefix,
          group,
          homeAway
        );
    }

    return groups;
  }

  function createTournament(year,allocations=null){
    const ranked=
      teams.slice().sort(
        (a,b)=>b.reputation-a.reputation
      );

    const byId=
      new Map(
        teams.map(
          team=>[
            team.id,
            team
          ]
        )
      );

    function resolve(ids,fallback){
      if(
        !Array.isArray(ids)
      )
        return fallback;

      const list=
        ids
          .map(id=>byId.get(id))
          .filter(Boolean);

      return list;
    }

    const leagueATeams=
      resolve(
        allocations?.A,
        ranked.slice(0,16)
      );

    const leagueBTeams=
      resolve(
        allocations?.B,
        ranked.slice(16,32)
      );

    const leagueCTeams=
      resolve(
        allocations?.C,
        ranked.slice(32,41)
      );

    if(
      leagueATeams.length!==16 ||
      leagueBTeams.length!==16 ||
      leagueCTeams.length!==9
    )
      throw new Error(
        "Invalid Concacaf Nations League allocations."
      );

    const allAllocated=[
      ...leagueATeams,
      ...leagueBTeams,
      ...leagueCTeams
    ];

    if(
      new Set(
        allAllocated.map(
          team=>team.id
        )
      ).size!==41
    )
      throw new Error(
        "Concacaf Nations League allocations must be unique."
      );

    leagueATeams.sort(
      (a,b)=>
        b.reputation-a.reputation
    );

    leagueBTeams.sort(
      (a,b)=>
        b.reputation-a.reputation
    );

    leagueCTeams.sort(
      (a,b)=>
        b.reputation-a.reputation
    );

    const seeded=
      leagueATeams.slice(0,4);

    const leagueAGroupTeams=
      leagueATeams.slice(4);

    return {
      version:1,
      type:"CONCACAF_NATIONS_LEAGUE",
      name:"Concacaf Nations League",
      year:Number(year),
      status:"LEAGUE_PHASE",

      leagues:{
        A:{
          id:"A",
          name:"Liga A",
          seeded:
            seeded.map(cloneTeam),
          groups:
            createGroups(
              leagueAGroupTeams,
              2,
              "CNL:A",
              false
            )
        },

        B:{
          id:"B",
          name:"Liga B",
          groups:
            createGroups(
              leagueBTeams,
              4,
              "CNL:B",
              true
            )
        },

        C:{
          id:"C",
          name:"Liga C",
          groups:
            createGroups(
              leagueCTeams,
              3,
              "CNL:C",
              true
            )
        }
      },

      promotion:[],
      relegation:[],
      quarterfinals:[],
      finals:[],
      champion:null,
      runnerUp:null,
      thirdPlace:null
    };
  }

  function findMatch(tournament,matchId){
    for(
      const league of
      Object.values(tournament.leagues)
    ){
      for(const group of league.groups){
        const match=
          group.matches.find(
            m=>m.id===matchId
          );

        if(match)
          return {
            match,
            group
          };
      }
    }

    return null;
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

  function recordLeagueResult(
    tournament,
    matchId,
    hg,
    ag
  ){
    const found=
      findMatch(
        tournament,
        matchId
      );

    if(!found)
      throw new Error(
        "Concacaf Nations League match not found."
      );

    const {match,group}=found;

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

  function standings(group){
    return group.table
      .slice()
      .sort(compareRows);
  }

  function leaguePhaseComplete(tournament){
    return Object.values(
      tournament.leagues
    ).every(
      league=>
        league.groups.every(
          group=>
            group.matches.every(
              match=>match.played
            )
        )
    );
  }

  function calculateMovement(tournament){
    if(!leaguePhaseComplete(tournament))
      throw new Error(
        "League phase is not complete."
      );

    const promotion=[];
    const relegation=[];

    // League B:
    // group winners up, fourth place down.
    for(
      const group of
      tournament.leagues.B.groups
    ){
      const table=standings(group);

      promotion.push({
        team:{...table[0]},
        from:"B",
        to:"A"
      });

      relegation.push({
        team:{...table[table.length-1]},
        from:"B",
        to:"C"
      });
    }

    // League C:
    // 3 winners + best runner-up go up.
    const cTables=
      tournament.leagues.C.groups
        .map(
          group=>({
            group:group.name,
            table:standings(group)
          })
        );

    for(const item of cTables){
      promotion.push({
        team:{...item.table[0]},
        from:"C",
        to:"B"
      });
    }

    const bestRunner=
      cTables
        .map(
          item=>({
            ...item.table[1],
            group:item.group
          })
        )
        .sort(compareRows)[0];

    promotion.push({
      team:{...bestRunner},
      from:"C",
      to:"B"
    });

    // League A:
    // bottom two in each 6-team group go down.
    for(
      const group of
      tournament.leagues.A.groups
    ){
      const table=standings(group);

      relegation.push({
        team:{...table[4]},
        from:"A",
        to:"B"
      });

      relegation.push({
        team:{...table[5]},
        from:"A",
        to:"B"
      });
    }

    tournament.promotion=
      promotion;

    tournament.relegation=
      relegation;

    return {
      promotion,
      relegation
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
        "CNL:"+
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

  function buildQuarterfinals(tournament){
    if(!leaguePhaseComplete(tournament))
      throw new Error(
        "League phase is not complete."
      );

    if(
      !tournament.promotion.length &&
      !tournament.relegation.length
    )
      calculateMovement(tournament);

    const groupTables=
      tournament.leagues.A.groups.map(
        group=>standings(group)
      );

    const firsts=[
      groupTables[0][0],
      groupTables[1][0]
    ].sort(compareRows);

    const seconds=[
      groupTables[0][1],
      groupTables[1][1]
    ].sort(compareRows);

    const seeded=
      tournament.leagues.A.seeded
        .slice()
        .sort(
          (a,b)=>b.reputation-a.reputation
        );

    const pairs=[
      [seeded[0],seconds[1]],
      [seeded[1],seconds[0]],
      [seeded[2],firsts[1]],
      [seeded[3],firsts[0]]
    ];

    tournament.quarterfinals=
      pairs.map(
        ([home,away],index)=>
          createKnockoutMatch(
            "QUARTERFINAL",
            index,
            home,
            away
          )
      );

    tournament.status=
      "QUARTERFINAL";

    return tournament.quarterfinals;
  }

  function allTeams(tournament){
    return [
      ...tournament.leagues.A.seeded,
      ...Object.values(
        tournament.leagues
      ).flatMap(
        league=>
          league.groups.flatMap(
            group=>group.teams
          )
      )
    ];
  }

  function participant(tournament,id){
    return (
      allTeams(tournament).find(
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

  function recordQuarterfinalResult(
    tournament,
    matchId,
    hg,
    ag,
    hp=null,
    ap=null
  ){
    const match=
      tournament.quarterfinals.find(
        m=>m.id===matchId
      );

    if(!match)
      throw new Error(
        "Quarterfinal not found."
      );

    if(match.played)
      throw new Error(
        "Match already played."
      );

    hg=Math.max(0,Math.floor(Number(hg)||0));
    ag=Math.max(0,Math.floor(Number(ag)||0));

    if(hg===ag){
      hp=Math.max(0,Math.floor(Number(hp)||0));
      ap=Math.max(0,Math.floor(Number(ap)||0));
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

    if(
      tournament.quarterfinals.every(
        m=>m.played
      )
    ){
      const winners=
        tournament.quarterfinals.map(
          m=>
            participant(
              tournament,
              m.winnerId
            )
        );

      tournament.finals=[
        createKnockoutMatch(
          "SEMIFINAL",
          0,
          winners[0],
          winners[3]
        ),
        createKnockoutMatch(
          "SEMIFINAL",
          1,
          winners[1],
          winners[2]
        )
      ];

      tournament.status=
        "SEMIFINAL";
    }

    return match;
  }

  function recordFinalResult(
    tournament,
    matchId,
    hg,
    ag,
    hp=null,
    ap=null
  ){
    const match=
      tournament.finals.find(
        m=>m.id===matchId
      );

    if(!match)
      throw new Error(
        "Finals match not found."
      );

    if(match.played)
      throw new Error(
        "Match already played."
      );

    hg=Math.max(0,Math.floor(Number(hg)||0));
    ag=Math.max(0,Math.floor(Number(ag)||0));

    if(hg===ag){
      hp=Math.max(0,Math.floor(Number(hp)||0));
      ap=Math.max(0,Math.floor(Number(ap)||0));
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

    const semifinals=
      tournament.finals.filter(
        m=>m.phase==="SEMIFINAL"
      );

    if(
      tournament.status==="SEMIFINAL" &&
      semifinals.length===2 &&
      semifinals.every(m=>m.played)
    ){
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

      tournament.finals.push(
        createKnockoutMatch(
          "FINAL",
          0,
          winners[0],
          winners[1]
        )
      );

      tournament.finals.push(
        createKnockoutMatch(
          "THIRD_PLACE",
          0,
          losers[0],
          losers[1]
        )
      );

      tournament.status=
        "FINALS";

      return match;
    }

    if(tournament.status==="FINALS"){
      const final=
        tournament.finals.find(
          m=>m.phase==="FINAL"
        );

      const third=
        tournament.finals.find(
          m=>m.phase==="THIRD_PLACE"
        );

      if(
        final?.played &&
        third?.played
      ){
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

    return match;
  }

  function phaseLabel(phase){
    return ({
      LEAGUE_PHASE:"Fase de ligas",
      QUARTERFINAL:"Quartas de final",
      SEMIFINAL:"Semifinais",
      FINALS:"Finais",
      COMPLETED:"Encerrada"
    })[phase]||phase||"";
  }

  const api={
    teams,
    createTournament,
    standings,
    recordLeagueResult,
    leaguePhaseComplete,
    calculateMovement,
    buildQuarterfinals,
    recordQuarterfinalResult,
    recordFinalResult,
    phaseLabel
  };

  root.ProLifeConcacafNationsLeague=
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
