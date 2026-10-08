(function(root){
  "use strict";

  const teams=[
    {id:"AUS",name:"Australia",reputation:80,confederation:"AFC"},
    {id:"CMR",name:"Camaroes",reputation:79,confederation:"CAF"},
    {id:"CHN",name:"China",reputation:74,confederation:"AFC"},
    {id:"CUW",name:"Curacao",reputation:74,confederation:"CONCACAF"},

    {id:"AZE",name:"Azerbaijao",reputation:70,confederation:"UEFA"},
    {id:"OMA",name:"Oma",reputation:73,confederation:"AFC"},
    {id:"SLE",name:"Serra Leoa",reputation:68,confederation:"CAF"},
    {id:"LCA",name:"Santa Lucia",reputation:65,confederation:"CONCACAF"},

    {id:"BUL",name:"Bulgaria",reputation:72,confederation:"UEFA"},
    {id:"IDN",name:"Indonesia",reputation:69,confederation:"AFC"},
    {id:"SOL",name:"Ilhas Salomao",reputation:70,confederation:"OFC"},
    {id:"SKN",name:"Sao Cristovao e Nevis",reputation:64,confederation:"CONCACAF"},

    {id:"COM",name:"Comores",reputation:71,confederation:"CAF"},
    {id:"KAZ",name:"Cazaquistao",reputation:71,confederation:"UEFA"},
    {id:"KUW",name:"Kuwait",reputation:69,confederation:"AFC"},
    {id:"NAM",name:"Namibia",reputation:69,confederation:"CAF"},

    {id:"CPV",name:"Cabo Verde",reputation:73,confederation:"CAF"},
    {id:"CHI",name:"Chile",reputation:78,confederation:"CONMEBOL"},
    {id:"FIN",name:"Finlandia",reputation:73,confederation:"UEFA"},
    {id:"NZL",name:"Nova Zelandia",reputation:80,confederation:"OFC"},

    {id:"ASA",name:"Samoa Americana",reputation:55,confederation:"OFC"},
    {id:"GUM",name:"Guam",reputation:57,confederation:"AFC"},
    {id:"PUR",name:"Porto Rico",reputation:68,confederation:"CONCACAF"},
    {id:"VIR",name:"Ilhas Virgens Americanas",reputation:55,confederation:"CONCACAF"},

    {id:"EST",name:"Estonia",reputation:69,confederation:"UEFA"},
    {id:"GRN",name:"Granada",reputation:65,confederation:"CONCACAF"},
    {id:"KEN",name:"Quenia",reputation:70,confederation:"CAF"},
    {id:"RWA",name:"Ruanda",reputation:68,confederation:"CAF"},

    {id:"ARU",name:"Aruba",reputation:64,confederation:"CONCACAF"},
    {id:"LIE",name:"Liechtenstein",reputation:58,confederation:"UEFA"},
    {id:"MAC",name:"Macau",reputation:57,confederation:"AFC"},
    {id:"TAN",name:"Tanzania",reputation:68,confederation:"CAF"},

    {id:"GAB",name:"Gabao",reputation:71,confederation:"CAF"},
    {id:"TRI",name:"Trinidad e Tobago",reputation:71,confederation:"CONCACAF"},
    {id:"UZB",name:"Uzbequistao",reputation:77,confederation:"AFC"},
    {id:"VEN",name:"Venezuela",reputation:75,confederation:"CONMEBOL"}
  ];

  const seriesDefinitions=[
    {
      id:"AUSTRALIA",
      host:"Australia",
      hostTeamId:"AUS",
      format:"KNOCKOUT",
      teams:["AUS","CMR","CHN","CUW"]
    },
    {
      id:"AZERBAIJAN",
      host:"Azerbaijao",
      hostTeamId:"AZE",
      format:"FIXTURES",
      teams:["AZE","OMA","SLE","LCA"]
    },
    {
      id:"INDONESIA",
      host:"Indonesia",
      hostTeamId:"IDN",
      format:"KNOCKOUT",
      teams:["BUL","IDN","SOL","SKN"]
    },
    {
      id:"KAZAKHSTAN",
      host:"Cazaquistao",
      hostTeamId:"KAZ",
      format:"FIXTURES",
      teams:["COM","KAZ","KUW","NAM"]
    },
    {
      id:"NEW_ZEALAND",
      host:"Nova Zelandia",
      hostTeamId:"NZL",
      format:"KNOCKOUT",
      teams:["CPV","CHI","FIN","NZL"]
    },
    {
      id:"PUERTO_RICO",
      host:"Porto Rico",
      hostTeamId:"PUR",
      format:"FIXTURES",
      teams:["ASA","GUM","PUR","VIR"]
    },
    {
      id:"RWANDA_A",
      host:"Ruanda",
      hostTeamId:"RWA",
      format:"KNOCKOUT",
      teams:["EST","GRN","KEN","RWA"]
    },
    {
      id:"RWANDA_B",
      host:"Ruanda",
      hostTeamId:"RWA",
      format:"FIXTURES",
      teams:["ARU","LIE","MAC","TAN"]
    },
    {
      id:"UZBEKISTAN",
      host:"Uzbequistao",
      hostTeamId:"UZB",
      format:"KNOCKOUT",
      teams:["GAB","TRI","UZB","VEN"]
    }
  ];

  function cloneTeam(team){
    return {
      id:String(team.id),
      name:String(team.name),
      reputation:Number(team.reputation||60),
      confederation:String(team.confederation||"")
    };
  }

  function byId(id){
    return teams.find(
      team=>team.id===id
    )||null;
  }

  function emptyRow(team){
    return {
      id:team.id,
      name:team.name,
      reputation:team.reputation,
      confederation:team.confederation,
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

  function createMatch(
    seriesId,
    phase,
    index,
    home,
    away
  ){
    return {
      id:
        "FIFA_SERIES:"+
        seriesId+
        ":"+
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

  function createKnockoutSeries(definition,list){
    return {
      id:definition.id,
      host:definition.host,
      hostTeamId:definition.hostTeamId,
      format:"KNOCKOUT",
      participants:list.map(cloneTeam),
      matches:[
        createMatch(
          definition.id,
          "SEMIFINAL",
          0,
          list[0],
          list[3]
        ),
        createMatch(
          definition.id,
          "SEMIFINAL",
          1,
          list[1],
          list[2]
        )
      ],
      table:[],
      victor:null,
      runnerUp:null,
      status:"SEMIFINAL"
    };
  }

  function createFixtureSeries(definition,list){
    return {
      id:definition.id,
      host:definition.host,
      hostTeamId:definition.hostTeamId,
      format:"FIXTURES",
      participants:list.map(cloneTeam),

      matches:[
        createMatch(
          definition.id,
          "FIXTURE",
          0,
          list[0],
          list[1]
        ),
        createMatch(
          definition.id,
          "FIXTURE",
          1,
          list[2],
          list[3]
        ),
        createMatch(
          definition.id,
          "FIXTURE",
          2,
          list[0],
          list[2]
        ),
        createMatch(
          definition.id,
          "FIXTURE",
          3,
          list[1],
          list[3]
        )
      ],

      table:list.map(emptyRow),
      victor:null,
      runnerUp:null,
      status:"FIXTURES"
    };
  }

  function createTournament(year){
    const series=
      seriesDefinitions.map(
        definition=>{
          const list=
            definition.teams.map(
              id=>byId(id)
            );

          if(
            list.some(
              team=>!team
            )
          )
            throw new Error(
              "Invalid FIFA Series team definition."
            );

          return definition.format==="KNOCKOUT"
            ? createKnockoutSeries(
                definition,
                list
              )
            : createFixtureSeries(
                definition,
                list
              );
        }
      );

    return {
      version:1,
      type:"FIFA_SERIES",
      name:"FIFA Series",
      year:Number(year),
      status:"IN_PROGRESS",
      series,
      completedSeries:0
    };
  }

  function seriesById(
    tournament,
    seriesId
  ){
    return (
      tournament.series.find(
        item=>item.id===seriesId
      )||
      null
    );
  }

  function participant(
    series,
    id
  ){
    return (
      series.participants.find(
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
      "FIFA Series draw requires penalty winner."
    );
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

  function standings(series){
    return series.table
      .slice()
      .sort(compareRows);
  }

  function refreshTournament(tournament){
    tournament.completedSeries=
      tournament.series.filter(
        item=>
          item.status==="COMPLETED"
      ).length;

    if(
      tournament.completedSeries===
      tournament.series.length
    ){
      tournament.status=
        "COMPLETED";
    }

    return tournament;
  }

  function recordFixtureResult(
    tournament,
    seriesId,
    matchId,
    hg,
    ag,
    hp=null,
    ap=null
  ){
    const series=
      seriesById(
        tournament,
        seriesId
      );

    if(!series)
      throw new Error(
        "FIFA Series group not found."
      );

    const match=
      series.matches.find(
        item=>item.id===matchId
      );

    if(!match)
      throw new Error(
        "FIFA Series match not found."
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

    match.hg=hg;
    match.ag=ag;
    match.played=true;

    if(series.format==="KNOCKOUT"){
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
        series.matches.filter(
          item=>
            item.phase==="SEMIFINAL"
        );

      if(
        series.status==="SEMIFINAL" &&
        semifinals.length===2 &&
        semifinals.every(
          item=>item.played
        )
      ){
        const winners=
          semifinals.map(
            item=>
              participant(
                series,
                item.winnerId
              )
          );

        const losers=
          semifinals.map(
            item=>
              participant(
                series,
                item.winnerId===
                item.homeId
                  ? item.awayId
                  : item.homeId
              )
          );

        series.matches.push(
          createMatch(
            series.id,
            "FINAL",
            0,
            winners[0],
            winners[1]
          )
        );

        series.matches.push(
          createMatch(
            series.id,
            "PLACEMENT",
            0,
            losers[0],
            losers[1]
          )
        );

        series.status=
          "FINAL";
      }
      else if(
        series.status==="FINAL"
      ){
        const final=
          series.matches.find(
            item=>
              item.phase==="FINAL"
          );

        const placement=
          series.matches.find(
            item=>
              item.phase==="PLACEMENT"
          );

        if(
          final?.played &&
          placement?.played
        ){
          series.victor=
            participant(
              series,
              final.winnerId
            );

          series.runnerUp=
            participant(
              series,
              final.winnerId===
              final.homeId
                ? final.awayId
                : final.homeId
            );

          series.status=
            "COMPLETED";
        }
      }
    }
    else{
      updateRow(
        series.table.find(
          row=>row.id===match.homeId
        ),
        hg,
        ag
      );

      updateRow(
        series.table.find(
          row=>row.id===match.awayId
        ),
        ag,
        hg
      );

      if(
        series.matches.every(
          item=>item.played
        )
      ){
        const table=
          standings(series);

        series.victor=
          participant(
            series,
            table[0].id
          );

        series.runnerUp=
          participant(
            series,
            table[1].id
          );

        series.status=
          "COMPLETED";
      }
    }

    refreshTournament(
      tournament
    );

    return match;
  }

  function phaseLabel(series){
    if(!series)
      return "";

    return ({
      SEMIFINAL:"Semifinais",
      FINAL:"Final",
      FIXTURES:"Partidas programadas",
      COMPLETED:"Encerrada"
    })[series.status]||
    series.status||
    "";
  }

  function totalSeries(){
    return 9;
  }

  function totalTeams(){
    return 36;
  }

  function totalMatches(tournament=null){
    if(tournament){
      return tournament.series.reduce(
        (sum,item)=>
          sum+item.matches.length,
        0
      );
    }

    return 36;
  }

  const api={
    teams,
    seriesDefinitions,
    createTournament,
    seriesById,
    standings,
    recordFixtureResult,
    phaseLabel,
    totalSeries,
    totalTeams,
    totalMatches
  };

  root.ProLifeFifaSeries=
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
