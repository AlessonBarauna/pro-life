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
    {id:"ITA",name:"Italia",reputation:85},
    {id:"CRO",name:"Croacia",reputation:85},
    {id:"SUI",name:"Suica",reputation:83},
    {id:"DEN",name:"Dinamarca",reputation:82},
    {id:"NOR",name:"Noruega",reputation:82},
    {id:"AUT",name:"Austria",reputation:81},
    {id:"UKR",name:"Ucrania",reputation:80},
    {id:"TUR",name:"Turquia",reputation:80},
    {id:"CZE",name:"Republica Tcheca",reputation:80},

    {id:"POL",name:"Polonia",reputation:79},
    {id:"SRB",name:"Servia",reputation:79},
    {id:"SWE",name:"Suecia",reputation:79},
    {id:"HUN",name:"Hungria",reputation:78},
    {id:"SCO",name:"Escocia",reputation:77},
    {id:"GRE",name:"Grecia",reputation:77},
    {id:"ROU",name:"Romenia",reputation:76},
    {id:"SVN",name:"Eslovenia",reputation:76},
    {id:"SVK",name:"Eslovaquia",reputation:76},
    {id:"IRL",name:"Irlanda",reputation:75},
    {id:"FIN",name:"Finlandia",reputation:75},
    {id:"GEO",name:"Georgia",reputation:75},
    {id:"ALB",name:"Albania",reputation:74},
    {id:"ISL",name:"Islandia",reputation:74},
    {id:"BIH",name:"Bosnia e Herzegovina",reputation:77},
    {id:"MNE",name:"Montenegro",reputation:73},

    {id:"NIR",name:"Irlanda do Norte",reputation:72},
    {id:"WAL",name:"Pais de Gales",reputation:77},
    {id:"ARM",name:"Armenia",reputation:71},
    {id:"BLR",name:"Belarus",reputation:70},
    {id:"BUL",name:"Bulgaria",reputation:72},
    {id:"KAZ",name:"Cazaquistao",reputation:71},
    {id:"LUX",name:"Luxemburgo",reputation:70},
    {id:"MKD",name:"Macedonia do Norte",reputation:73},
    {id:"KOS",name:"Kosovo",reputation:72},
    {id:"AZE",name:"Azerbaijao",reputation:69},
    {id:"CYP",name:"Chipre",reputation:69},
    {id:"EST",name:"Estonia",reputation:68},
    {id:"LAT",name:"Letonia",reputation:68},
    {id:"LTU",name:"Lituania",reputation:68},
    {id:"MDA",name:"Moldavia",reputation:67},

    {id:"GIB",name:"Gibraltar",reputation:63},
    {id:"MLT",name:"Malta",reputation:66},
    {id:"AND",name:"Andorra",reputation:62},
    {id:"SMR",name:"San Marino",reputation:60},
    {id:"LIE",name:"Liechtenstein",reputation:61},
    {id:"FRO",name:"Ilhas Faroé",reputation:67}
  ];

  function cloneTeam(t){
    return {
      id:String(t.id),
      name:String(t.name),
      reputation:Number(t.reputation||65)
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

  function makeGroups(list,count){
    const ranked=
      list.slice().sort(
        (a,b)=>
          b.reputation-a.reputation
      );

    const groups=
      Array.from(
        {length:count},
        (_,i)=>({
          name:String(i+1),
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

      let id=0;

      for(let i=0;i<group.teams.length;i++){
        for(let j=i+1;j<group.teams.length;j++){
          const a=group.teams[i];
          const b=group.teams[j];

          group.matches.push({
            id:
              "UNL:"+
              group.name+
              ":"+
              id+++
              ":1",
            homeId:a.id,
            awayId:b.id,
            home:a.name,
            away:b.name,
            played:false,
            hg:null,
            ag:null
          });

          group.matches.push({
            id:
              "UNL:"+
              group.name+
              ":"+
              id+++
              ":2",
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

    return groups;
  }

  function createLeague(
    id,
    name,
    teams,
    groupCount
  ){
    const groups=
      makeGroups(
        teams,
        groupCount
      );

    for(const group of groups){
      for(const match of group.matches){
        match.id=
          "UNL:"+
          id+
          ":"+
          match.id.slice(4);
      }
    }

    return {
      id,
      name,
      groups
    };
  }

  function createTournament(year){
    const ranked=
      teams.slice().sort(
        (a,b)=>
          b.reputation-a.reputation
      );

    const leagueA=
      ranked.slice(0,16);

    const leagueB=
      ranked.slice(16,32);

    const leagueC=
      ranked.slice(32,48);

    const leagueD=
      ranked.slice(48);

    return {
      version:1,
      type:"UEFA_NATIONS_LEAGUE",
      name:"UEFA Nations League",
      year:Number(year),
      status:"LEAGUE_PHASE",

      leagues:{
        A:createLeague(
          "A",
          "Liga A",
          leagueA,
          4
        ),

        B:createLeague(
          "B",
          "Liga B",
          leagueB,
          4
        ),

        C:createLeague(
          "C",
          "Liga C",
          leagueC,
          4
        ),

        D:createLeague(
          "D",
          "Liga D",
          leagueD,
          2
        )
      },

      finals:[],
      promotion:[],
      relegation:[],
      champion:null,
      runnerUp:null,
      thirdPlace:null
    };
  }

  function findGroup(
    tournament,
    matchId
  ){
    for(
      const league of
      Object.values(
        tournament.leagues
      )
    ){
      for(const group of league.groups){
        if(
          group.matches.some(
            m=>m.id===matchId
          )
        )
          return group;
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
    const group=
      findGroup(
        tournament,
        matchId
      );

    if(!group)
      throw new Error(
        "Nations League match not found."
      );

    const match=
      group.matches.find(
        m=>m.id===matchId
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

  function standings(group){
    return group.table
      .slice()
      .sort(compareRows);
  }

  function leaguePhaseComplete(
    tournament
  ){
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

  function calculateMovement(
    tournament
  ){
    if(
      !leaguePhaseComplete(
        tournament
      )
    )
      throw new Error(
        "League phase is not complete."
      );

    const promotion=[];
    const relegation=[];

    for(const id of ["B","C","D"]){
      const league=
        tournament.leagues[id];

      for(const group of league.groups){
        const table=
          standings(group);

        promotion.push({
          team:{
            ...table[0]
          },
          from:id,
          to:
            id==="B"
              ? "A"
              : id==="C"
                ? "B"
                : "C"
        });
      }
    }

    for(const id of ["A","B","C"]){
      const league=
        tournament.leagues[id];

      for(const group of league.groups){
        const table=
          standings(group);

        relegation.push({
          team:{
            ...table[
              table.length-1
            ]
          },
          from:id,
          to:
            id==="A"
              ? "B"
              : id==="B"
                ? "C"
                : "D"
        });
      }
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

  function createFinals(
    tournament
  ){
    if(
      !leaguePhaseComplete(
        tournament
      )
    )
      throw new Error(
        "League phase is not complete."
      );

    if(
      !tournament.promotion.length &&
      !tournament.relegation.length
    )
      calculateMovement(
        tournament
      );

    const winners=
      tournament.leagues.A.groups
        .map(
          group=>
            standings(group)[0]
        )
        .sort(
          (a,b)=>
            b.reputation-a.reputation
        );

    tournament.finals=[
      {
        id:"UNL:SF:1",
        phase:"SEMIFINAL",
        homeId:winners[0].id,
        awayId:winners[3].id,
        home:winners[0].name,
        away:winners[3].name,
        played:false,
        hg:null,
        ag:null,
        hp:null,
        ap:null,
        winnerId:null
      },
      {
        id:"UNL:SF:2",
        phase:"SEMIFINAL",
        homeId:winners[1].id,
        awayId:winners[2].id,
        home:winners[1].name,
        away:winners[2].name,
        played:false,
        hg:null,
        ag:null,
        hp:null,
        ap:null,
        winnerId:null
      }
    ];

    tournament.status=
      "SEMIFINAL";

    return tournament.finals;
  }

  function team(
    tournament,
    id
  ){
    return teams.find(
      t=>t.id===id
    )||null;
  }

  function knockoutWinner(
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
      "Draw requires penalty winner."
    );
  }

  function advanceFinals(
    tournament
  ){
    const semifinals=
      tournament.finals.filter(
        m=>
          m.phase===
          "SEMIFINAL"
      );

    if(
      tournament.status===
        "SEMIFINAL" &&
      semifinals.length===2 &&
      semifinals.every(
        m=>m.played
      )
    ){
      const winners=
        semifinals.map(
          m=>
            team(
              tournament,
              m.winnerId
            )
        );

      const losers=
        semifinals.map(
          m=>
            team(
              tournament,
              m.winnerId===m.homeId
                ? m.awayId
                : m.homeId
            )
        );

      tournament.finals.push({
        id:"UNL:FINAL",
        phase:"FINAL",
        homeId:winners[0].id,
        awayId:winners[1].id,
        home:winners[0].name,
        away:winners[1].name,
        played:false,
        hg:null,
        ag:null,
        hp:null,
        ap:null,
        winnerId:null
      });

      tournament.finals.push({
        id:"UNL:THIRD",
        phase:"THIRD_PLACE",
        homeId:losers[0].id,
        awayId:losers[1].id,
        home:losers[0].name,
        away:losers[1].name,
        played:false,
        hg:null,
        ag:null,
        hp:null,
        ap:null,
        winnerId:null
      });

      tournament.status=
        "FINALS";

      return;
    }

    if(
      tournament.status===
        "FINALS"
    ){
      const final=
        tournament.finals.find(
          m=>m.phase==="FINAL"
        );

      const third=
        tournament.finals.find(
          m=>
            m.phase===
            "THIRD_PLACE"
        );

      if(
        !final?.played ||
        !third?.played
      )
        return;

      tournament.champion=
        team(
          tournament,
          final.winnerId
        );

      tournament.runnerUp=
        team(
          tournament,
          final.winnerId===final.homeId
            ? final.awayId
            : final.homeId
        );

      tournament.thirdPlace=
        team(
          tournament,
          third.winnerId
        );

      tournament.status=
        "COMPLETED";
    }
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
      knockoutWinner(
        match,
        hg,
        ag,
        hp,
        ap
      );

    advanceFinals(
      tournament
    );

    return match;
  }

  function phaseLabel(phase){
    return ({
      LEAGUE_PHASE:"Fase de ligas",
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
    createFinals,
    recordFinalResult,
    phaseLabel
  };

  root.ProLifeUefaNationsLeague=
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
