/* PRO LIFE — Brazil national team career simulation. */
(function (root) {
  "use strict";
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const windows = [74, 149, 224, 299];
  const opponents = ["Argentina", "Uruguai", "Colômbia", "Chile", "Equador", "Paraguai", "Peru", "Bolívia"];
  const nations = [{id:"BRA",name:"Brasil",reputation:92,formation:"4-3-3"},{id:"ARG",name:"Argentina",reputation:93,formation:"4-3-3"},{id:"URU",name:"Uruguai",reputation:86,formation:"4-2-3-1"},{id:"COL",name:"Colômbia",reputation:84,formation:"4-3-3"},{id:"CHI",name:"Chile",reputation:78,formation:"4-2-3-1"},{id:"ECU",name:"Equador",reputation:80,formation:"4-3-3"},{id:"PAR",name:"Paraguai",reputation:76,formation:"4-4-2"},{id:"PER",name:"Peru",reputation:74,formation:"4-2-3-1"},{id:"BOL",name:"Bolívia",reputation:70,formation:"4-4-2"},{id:"VEN",name:"Venezuela",reputation:77,formation:"4-2-3-1"},{id:"USA",name:"Estados Unidos",reputation:81,formation:"4-3-3"},{id:"ESP",name:"Espanha",reputation:94,formation:"4-3-3"},{id:"FRA",name:"França",reputation:94,formation:"4-2-3-1"}];
  const windowOpponents = [["Chile", "Paraguai"], ["Argentina", "Uruguai"], ["Colômbia", "Equador"], ["Peru", "Bolívia"]];
  const defaults = () => ({
    country: "Brasil", calledUp: false, status: "Fora da convocação", caps: 0,
    starts: 0, goals: 0, assists: 0, ratingTotal: 0, motm: 0,
    lastCallupDay: null, nextWindow: windows[0], matches: [], history: [],
    competition: "Seleção Brasileira", schedule: [], nationality: "Brasil", radarStatus:"FORA DO RADAR", shirtNumber:null, captain:false, callups:0, firstCallupDay:null, debutDay:null, firstGoalDay:null, minutes:0, cards:0, cleanSheets:0, saves:0, titles:[], squad:[], positionCompetition:[], qualifiers:{season:null,table:[]}, tournaments:[], milestones:[], currentCallupWindow:null, callupDecisions:{},
  });
  function protectedDay(day) {
    const relative=
      ((day%365)+365)%365;

    const year=
      2026+
      Math.floor(day/365);

    const fifaWindow=
      windows.some(
        value=>
          relative>=value-7 &&
          relative<=value+4
      );

    const worldCupPeriod=
      isWorldCupYear(year) &&
      relative>=154 &&
      relative<=199;

    const copaAmericaPeriod=
      isCopaAmericaYear(year) &&
      relative>=160 &&
      relative<=205;

    return (
      fifaWindow ||
      worldCupPeriod ||
      copaAmericaPeriod
    );
  }

  function protectClubCalendar(s) {
    let previous = -10;
    if (Array.isArray(s.calendarDays)) s.calendarDays = s.calendarDays.map((original) => {
      let day = Math.max(original, previous + 5);
      while (protectedDay(day)) day++;
      previous = day; return day;
    });
    for (const round of s.competitionSchedule?.cup?.rounds || []) while (protectedDay(round.date)) round.date++;
  }
  function finalissimaApi(){
    return (
      root.ProLifeFinalissima ||
      (
        typeof require==="function"
          ? require("./finalissima.js")
          : null
      )
    );
  }

  function isFinalissimaYear(year){
    return (
      year>=2029 &&
      (year-2029)%4===0
    );
  }

  function finalissimaSourceYear(year){
    return Number(year)-1;
  }

  function ensureFinalissima(s,n){
    const year=
      2026+
      Math.floor(s.day/365);

    if(!isFinalissimaYear(year))
      return null;

    if(!Array.isArray(n.tournaments))
      n.tournaments=[];

    let tournament=
      n.tournaments.find(
        t=>
          t &&
          t.type==="FINALISSIMA" &&
          Number(t.year)===year
      );

    if(tournament)
      return tournament;

    const sourceYear=
      finalissimaSourceYear(year);

    const copa=
      n.tournaments.find(
        t=>
          t?.type==="COPA_AMERICA" &&
          Number(t.year)===sourceYear &&
          t.status==="COMPLETED" &&
          t.champion
      );

    const euro=
      n.tournaments.find(
        t=>
          t?.type==="EURO" &&
          Number(t.year)===sourceYear &&
          t.status==="COMPLETED" &&
          t.champion
      );

    if(
      !copa?.champion ||
      !euro?.champion
    )
      return null;

    const F=
      finalissimaApi();

    if(!F?.createTournament)
      return null;

    tournament=
      F.createTournament(
        year,
        {
          ...copa.champion,
          source:"COPA_AMERICA"
        },
        {
          ...euro.champion,
          source:"EURO"
        }
      );

    tournament.sourceYear=
      sourceYear;

    n.tournaments.push(
      tournament
    );

    n.tournaments=
      n.tournaments
        .filter(Boolean)
        .slice(-20);

    return tournament;
  }

  function internationalHistoryApi(){
    return (
      root.ProLifeInternationalHistory ||
      (
        typeof require==="function"
          ? require("./international-history.js")
          : null
      )
    );
  }

  function archiveInternationalHistory(n){
    const history=
      internationalHistoryApi();

    if(!history?.archiveFromNationalState)
      return [];

    return history.archiveFromNationalState(
      n
    );
  }

  function internationalHistorySummary(s){
    const n=
      s?.nationalTeam &&
      typeof s.nationalTeam==="object"
        ? s.nationalTeam
        : init(s);

    archiveInternationalHistory(
      n
    );

    const history=
      internationalHistoryApi();

    return history?.summary
      ? history.summary(n)
      : {
          editions:0,
          timeline:[],
          byCompetition:{},
          worldCupTitles:[],
          fifaSeriesVictors:[]
        };
  }

  function fifaSeriesApi(){
    return (
      root.ProLifeFifaSeries ||
      (
        typeof require==="function"
          ? require("./fifa-series.js")
          : null
      )
    );
  }

  function isFifaSeriesYear(year){
    return (
      year>=2026 &&
      year%2===0
    );
  }

  function ensureFifaSeries(s,n){
    const year=
      2026+
      Math.floor(
        s.day/365
      );

    if(
      !isFifaSeriesYear(
        year
      )
    )
      return null;

    if(!Array.isArray(n.tournaments))
      n.tournaments=[];

    let tournament=
      n.tournaments.find(
        t=>
          t &&
          t.type==="FIFA_SERIES" &&
          Number(t.year)===year
      );

    if(tournament)
      return tournament;

    const SERIES=
      fifaSeriesApi();

    if(!SERIES?.createTournament)
      return null;

    tournament=
      SERIES.createTournament(
        year
      );

    n.tournaments.push(
      tournament
    );

    n.tournaments=
      n.tournaments
        .filter(Boolean)
        .slice(-52);

    return tournament;
  }

  function simulateFifaSeriesScore(
    series,
    homeId,
    awayId,
    rng,
    knockout=false
  ){
    const home=
      series.participants.find(
        team=>team.id===homeId
      );

    const away=
      series.participants.find(
        team=>team.id===awayId
      );

    const hs=
      Number(
        home?.reputation||
        60
      );

    const as=
      Number(
        away?.reputation||
        60
      );

    const hg=
      Math.max(
        0,
        Math.round(
          1.25+
          (hs-as)/24+
          (rng.next()-.5)*2.2
        )
      );

    const ag=
      Math.max(
        0,
        Math.round(
          1.05+
          (as-hs)/24+
          (rng.next()-.5)*2.2
        )
      );

    if(
      !knockout ||
      hg!==ag
    ){
      return {
        hg,
        ag,
        hp:null,
        ap:null
      };
    }

    const homeWins=
      (
        (hs-as)/100+
        rng.next()
      )>.48;

    return {
      hg,
      ag,
      hp:homeWins ? 5 : 4,
      ap:homeWins ? 4 : 5
    };
  }

  function progressFifaSeriesBackground(
    s,
    n,
    rng
  ){
    const tournament=
      ensureFifaSeries(
        s,
        n
      );

    if(
      !tournament ||
      tournament.status==="COMPLETED"
    )
      return tournament;

    const SERIES=
      fifaSeriesApi();

    if(!SERIES)
      return tournament;

    const yearStart=
      (Number(tournament.year)-2026)*
      365;

    const relative=
      s.day-yearStart;

    // Janela internacional de marco.
    // Primeiro bloco: semifinais / primeiros jogos.
    if(relative>=78){
      for(const series of tournament.series){

        if(series.status==="COMPLETED")
          continue;

        if(series.format==="KNOCKOUT"){
          const matches=
            series.matches.filter(
              match=>
                match.phase==="SEMIFINAL" &&
                !match.played
            );

          for(const match of matches){
            const result=
              simulateFifaSeriesScore(
                series,
                match.homeId,
                match.awayId,
                rng,
                true
              );

            SERIES.recordFixtureResult(
              tournament,
              series.id,
              match.id,
              result.hg,
              result.ag,
              result.hp,
              result.ap
            );
          }
        }
        else{
          const matches=
            series.matches.filter(
              match=>
                match.index<2 &&
                !match.played
            );

          for(const match of matches){
            const result=
              simulateFifaSeriesScore(
                series,
                match.homeId,
                match.awayId,
                rng,
                false
              );

            SERIES.recordFixtureResult(
              tournament,
              series.id,
              match.id,
              result.hg,
              result.ag
            );
          }
        }
      }
    }

    // Segundo bloco: finais / segundos jogos.
    if(relative>=82){
      for(const series of tournament.series){

        if(series.status==="COMPLETED")
          continue;

        if(series.format==="KNOCKOUT"){
          const matches=
            series.matches.filter(
              match=>
                (
                  match.phase==="FINAL" ||
                  match.phase==="PLACEMENT"
                ) &&
                !match.played
            );

          for(const match of matches){
            const result=
              simulateFifaSeriesScore(
                series,
                match.homeId,
                match.awayId,
                rng,
                true
              );

            SERIES.recordFixtureResult(
              tournament,
              series.id,
              match.id,
              result.hg,
              result.ag,
              result.hp,
              result.ap
            );
          }
        }
        else{
          const matches=
            series.matches.filter(
              match=>
                match.index>=2 &&
                !match.played
            );

          for(const match of matches){
            const result=
              simulateFifaSeriesScore(
                series,
                match.homeId,
                match.awayId,
                rng,
                false
              );

            SERIES.recordFixtureResult(
              tournament,
              series.id,
              match.id,
              result.hg,
              result.ag
            );
          }
        }
      }
    }

    return tournament;
  }

  function fifaSeriesSummary(s){
    const n=init(s);

    const tournament=
      (n.tournaments||[])
        .filter(
          t=>
            t?.type==="FIFA_SERIES"
        )
        .sort(
          (a,b)=>
            Number(b.year)-
            Number(a.year)
        )[0]||
        null;

    if(!tournament)
      return null;

    const SERIES=
      fifaSeriesApi();

    return {
      year:
        Number(
          tournament.year
        ),

      name:
        tournament.name,

      status:
        tournament.status,

      series:
        tournament.series||
        [],

      completedSeries:
        Number(
          tournament.completedSeries||
          0
        ),

      totalSeries:
        SERIES?.totalSeries?.()||
        tournament.series?.length||
        0,

      totalTeams:
        SERIES?.totalTeams?.()||
        0,

      totalMatches:
        SERIES?.totalMatches?.(
          tournament
        )||
        0,

      hasGlobalChampion:false
    };
  }


  function fifaArabCupApi(){
    return (
      root.ProLifeFifaArabCup ||
      (
        typeof require==="function"
          ? require("./fifa-arab-cup.js")
          : null
      )
    );
  }

  function isFifaArabCupYear(year){
    return (
      year>=2029 &&
      (year-2029)%4===0
    );
  }

  function ensureFifaArabCup(s,n){
    const year=
      2026+
      Math.floor(
        s.day/365
      );

    if(
      !isFifaArabCupYear(
        year
      )
    )
      return null;

    if(!Array.isArray(n.tournaments))
      n.tournaments=[];

    let tournament=
      n.tournaments.find(
        t=>
          t &&
          t.type==="FIFA_ARAB_CUP" &&
          Number(t.year)===year
      );

    if(tournament)
      return tournament;

    const ARAB=
      fifaArabCupApi();

    if(!ARAB?.createTournament)
      return null;

    tournament=
      ARAB.createTournament(
        year
      );

    n.tournaments.push(
      tournament
    );

    n.tournaments=
      n.tournaments
        .filter(Boolean)
        .slice(-48);

    return tournament;
  }

  function simulateFifaArabCupScore(
    tournament,
    homeId,
    awayId,
    rng,
    knockout=false
  ){
    const home=
      tournament.participants.find(
        team=>team.id===homeId
      );

    const away=
      tournament.participants.find(
        team=>team.id===awayId
      );

    const hs=
      Number(
        home?.reputation||
        65
      );

    const as=
      Number(
        away?.reputation||
        65
      );

    const hg=
      Math.max(
        0,
        Math.round(
          1.3+
          (hs-as)/24+
          (rng.next()-.5)*2.2
        )
      );

    const ag=
      Math.max(
        0,
        Math.round(
          1.05+
          (as-hs)/24+
          (rng.next()-.5)*2.2
        )
      );

    if(
      !knockout ||
      hg!==ag
    ){
      return {
        hg,
        ag,
        hp:null,
        ap:null
      };
    }

    const homeWins=
      (
        (hs-as)/100+
        rng.next()
      )>.48;

    return {
      hg,
      ag,
      hp:homeWins ? 5 : 4,
      ap:homeWins ? 4 : 5
    };
  }

  function progressFifaArabCupBackground(
    s,
    n,
    rng
  ){
    const tournament=
      ensureFifaArabCup(
        s,
        n
      );

    if(
      !tournament ||
      tournament.status==="COMPLETED"
    )
      return tournament;

    const ARAB=
      fifaArabCupApi();

    if(!ARAB)
      return tournament;

    const yearStart=
      (Number(tournament.year)-2026)*
      365;

    const relative=
      s.day-yearStart;

    // ----------------------------
    // FASE DE GRUPOS
    // ----------------------------

    if(
      tournament.status===
      "GROUP_STAGE"
    ){
      const roundDays={
        1:330,
        2:334,
        3:338
      };

      for(const round of [1,2,3]){
        if(
          relative<
          roundDays[round]
        )
          continue;

        for(
          const group of
          tournament.groups
        ){
          for(
            const match of
            group.matches
          ){
            if(
              match.round!==round ||
              match.played
            )
              continue;

            const result=
              simulateFifaArabCupScore(
                tournament,
                match.homeId,
                match.awayId,
                rng,
                false
              );

            ARAB.recordGroupResult(
              tournament,
              match.id,
              result.hg,
              result.ag
            );
          }
        }
      }

      const complete=
        tournament.groups.every(
          group=>
            group.matches.every(
              match=>match.played
            )
        );

      if(
        complete &&
        !tournament.knockout.length
      ){
        ARAB.buildQuarterfinals(
          tournament
        );
      }
    }

    // ----------------------------
    // QUARTAS
    // ----------------------------

    if(
      tournament.status===
        "QUARTERFINAL" &&
      relative>=343
    ){
      const matches=
        tournament.knockout.filter(
          match=>
            match.phase==="QUARTERFINAL" &&
            !match.played
        );

      for(const match of matches){
        const result=
          simulateFifaArabCupScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        ARAB.recordKnockoutResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }
    }

    // ----------------------------
    // SEMIFINAIS
    // ----------------------------

    if(
      tournament.status===
        "SEMIFINAL" &&
      relative>=347
    ){
      const matches=
        tournament.knockout.filter(
          match=>
            match.phase==="SEMIFINAL" &&
            !match.played
        );

      for(const match of matches){
        const result=
          simulateFifaArabCupScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        ARAB.recordKnockoutResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }
    }

    // ----------------------------
    // FINAL + 3o LUGAR
    // ----------------------------

    if(
      tournament.status===
        "FINAL" &&
      relative>=351
    ){
      const matches=
        tournament.knockout.filter(
          match=>
            (
              match.phase==="FINAL" ||
              match.phase==="THIRD_PLACE"
            ) &&
            !match.played
        );

      for(const match of matches){
        const result=
          simulateFifaArabCupScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        ARAB.recordKnockoutResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }
    }

    return tournament;
  }

  function fifaArabCupSummary(s){
    const n=init(s);

    const tournament=
      (n.tournaments||[])
        .filter(
          t=>
            t?.type==="FIFA_ARAB_CUP"
        )
        .sort(
          (a,b)=>
            Number(b.year)-
            Number(a.year)
        )[0]||
        null;

    if(!tournament)
      return null;

    const ARAB=
      fifaArabCupApi();

    return {
      year:
        Number(
          tournament.year
        ),

      name:
        tournament.name,

      status:
        tournament.status,

      phase:
        ARAB?.phaseLabel?.(
          tournament.status
        )||
        tournament.status,

      participants:
        tournament.participants||
        [],

      groups:
        tournament.groups||
        [],

      qualified8:
        tournament.qualified8||
        [],

      knockout:
        tournament.knockout||
        [],

      champion:
        tournament.champion||
        null,

      runnerUp:
        tournament.runnerUp||
        null,

      thirdPlace:
        tournament.thirdPlace||
        null,

      totalMatches:
        ARAB?.totalMatches?.()||
        32
    };
  }


  function ofcNationsCupApi(){
    return (
      root.ProLifeOfcNationsCup ||
      (
        typeof require==="function"
          ? require("./ofc-nations-cup.js")
          : null
      )
    );
  }

  function isOfcNationsCupYear(year){
    return (
      year>=2028 &&
      (year-2028)%4===0
    );
  }

  function ensureOfcNationsCup(s,n){
    const year=
      2026+
      Math.floor(
        s.day/365
      );

    if(
      !isOfcNationsCupYear(
        year
      )
    )
      return null;

    if(!Array.isArray(n.tournaments))
      n.tournaments=[];

    let tournament=
      n.tournaments.find(
        t=>
          t &&
          t.type==="OFC_NATIONS_CUP" &&
          Number(t.year)===year
      );

    if(tournament)
      return tournament;

    const OFC=
      ofcNationsCupApi();

    if(!OFC?.createTournament)
      return null;

    tournament=
      OFC.createTournament(
        year
      );

    n.tournaments.push(
      tournament
    );

    n.tournaments=
      n.tournaments
        .filter(Boolean)
        .slice(-44);

    return tournament;
  }

  function simulateOfcNationsCupScore(
    tournament,
    homeId,
    awayId,
    rng,
    knockout=false
  ){
    const home=
      tournament.participants.find(
        team=>team.id===homeId
      );

    const away=
      tournament.participants.find(
        team=>team.id===awayId
      );

    const hs=
      Number(
        home?.reputation||
        60
      );

    const as=
      Number(
        away?.reputation||
        60
      );

    const hg=
      Math.max(
        0,
        Math.round(
          1.35+
          (hs-as)/22+
          (rng.next()-.5)*2.2
        )
      );

    const ag=
      Math.max(
        0,
        Math.round(
          1.05+
          (as-hs)/22+
          (rng.next()-.5)*2.2
        )
      );

    if(
      !knockout ||
      hg!==ag
    ){
      return {
        hg,
        ag,
        hp:null,
        ap:null
      };
    }

    const homeWins=
      (
        (hs-as)/100+
        rng.next()
      )>.48;

    return {
      hg,
      ag,
      hp:homeWins ? 5 : 4,
      ap:homeWins ? 4 : 5
    };
  }

  function progressOfcNationsCupBackground(
    s,
    n,
    rng
  ){
    const tournament=
      ensureOfcNationsCup(
        s,
        n
      );

    if(
      !tournament ||
      tournament.status==="COMPLETED"
    )
      return tournament;

    const OFC=
      ofcNationsCupApi();

    if(!OFC)
      return tournament;

    const yearStart=
      (Number(tournament.year)-2026)*
      365;

    const relative=
      s.day-yearStart;

    // ----------------------------
    // FASE DE GRUPOS
    // ----------------------------

    if(
      tournament.status===
      "GROUP_STAGE"
    ){
      const roundDays={
        1:160,
        2:165,
        3:170
      };

      for(const round of [1,2,3]){
        if(
          relative<
          roundDays[round]
        )
          continue;

        for(
          const group of
          tournament.groups
        ){
          for(
            const match of
            group.matches
          ){
            if(
              match.round!==round ||
              match.played
            )
              continue;

            const result=
              simulateOfcNationsCupScore(
                tournament,
                match.homeId,
                match.awayId,
                rng,
                false
              );

            OFC.recordGroupResult(
              tournament,
              match.id,
              result.hg,
              result.ag
            );
          }
        }
      }

      const complete=
        tournament.groups.every(
          group=>
            group.matches.every(
              match=>match.played
            )
        );

      if(
        complete &&
        !tournament.knockout.length
      ){
        OFC.buildSemifinals(
          tournament
        );
      }
    }

    // ----------------------------
    // SEMIFINAIS
    // ----------------------------

    if(
      tournament.status===
        "SEMIFINAL" &&
      relative>=176
    ){
      const matches=
        tournament.knockout.filter(
          match=>
            match.phase==="SEMIFINAL" &&
            !match.played
        );

      for(const match of matches){
        const result=
          simulateOfcNationsCupScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        OFC.recordKnockoutResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }
    }

    // ----------------------------
    // FINAL
    // ----------------------------

    if(
      tournament.status===
        "FINAL" &&
      relative>=181
    ){
      const match=
        tournament.knockout.find(
          item=>
            item.phase==="FINAL" &&
            !item.played
        );

      if(match){
        const result=
          simulateOfcNationsCupScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        OFC.recordKnockoutResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }
    }

    return tournament;
  }

  function ofcNationsCupSummary(s){
    const n=init(s);

    const tournament=
      (n.tournaments||[])
        .filter(
          t=>
            t?.type===
            "OFC_NATIONS_CUP"
        )
        .sort(
          (a,b)=>
            Number(b.year)-
            Number(a.year)
        )[0]||
        null;

    if(!tournament)
      return null;

    const OFC=
      ofcNationsCupApi();

    return {
      year:
        Number(
          tournament.year
        ),

      name:
        tournament.name,

      status:
        tournament.status,

      phase:
        OFC?.phaseLabel?.(
          tournament.status
        )||
        tournament.status,

      participants:
        tournament.participants||
        [],

      groups:
        tournament.groups||
        [],

      qualified4:
        tournament.qualified4||
        [],

      knockout:
        tournament.knockout||
        [],

      champion:
        tournament.champion||
        null,

      runnerUp:
        tournament.runnerUp||
        null,

      totalMatches:
        OFC?.totalMatches?.()||
        15
    };
  }


  function concacafNationsLeagueApi(){
    return (
      root.ProLifeConcacafNationsLeague ||
      (
        typeof require==="function"
          ? require("./concacaf-nations-league.js")
          : null
      )
    );
  }

  function isConcacafNationsLeagueYear(year){
    return (
      year>=2026 &&
      (year-2026)%2===0
    );
  }

  function concacafLeagueMembers(
    tournament,
    leagueId
  ){
    const league=
      tournament?.leagues?.[
        leagueId
      ];

    if(!league)
      return [];

    return [
      ...(league.seeded||[]),
      ...league.groups.flatMap(
        group=>group.teams
      )
    ];
  }

  function concacafNextAllocations(
    previous
  ){
    if(
      !previous ||
      previous.status!=="COMPLETED"
    )
      return null;

    const A=
      concacafLeagueMembers(
        previous,
        "A"
      );

    const B=
      concacafLeagueMembers(
        previous,
        "B"
      );

    const C=
      concacafLeagueMembers(
        previous,
        "C"
      );

    const promotedBA=
      new Set(
        (previous.promotion||[])
          .filter(
            x=>
              x.from==="B" &&
              x.to==="A"
          )
          .map(
            x=>x.team.id
          )
      );

    const promotedCB=
      new Set(
        (previous.promotion||[])
          .filter(
            x=>
              x.from==="C" &&
              x.to==="B"
          )
          .map(
            x=>x.team.id
          )
      );

    const relegatedAB=
      new Set(
        (previous.relegation||[])
          .filter(
            x=>
              x.from==="A" &&
              x.to==="B"
          )
          .map(
            x=>x.team.id
          )
      );

    const relegatedBC=
      new Set(
        (previous.relegation||[])
          .filter(
            x=>
              x.from==="B" &&
              x.to==="C"
          )
          .map(
            x=>x.team.id
          )
      );

    const nextA=[
      ...A.filter(
        team=>
          !relegatedAB.has(
            team.id
          )
      ),
      ...B.filter(
        team=>
          promotedBA.has(
            team.id
          )
      )
    ];

    const nextB=[
      ...B.filter(
        team=>
          !promotedBA.has(
            team.id
          ) &&
          !relegatedBC.has(
            team.id
          )
      ),
      ...A.filter(
        team=>
          relegatedAB.has(
            team.id
          )
      ),
      ...C.filter(
        team=>
          promotedCB.has(
            team.id
          )
      )
    ];

    const nextC=[
      ...C.filter(
        team=>
          !promotedCB.has(
            team.id
          )
      ),
      ...B.filter(
        team=>
          relegatedBC.has(
            team.id
          )
      )
    ];

    if(
      nextA.length!==16 ||
      nextB.length!==16 ||
      nextC.length!==9
    )
      return null;

    return {
      A:nextA.map(x=>x.id),
      B:nextB.map(x=>x.id),
      C:nextC.map(x=>x.id)
    };
  }

  function ensureConcacafNationsLeague(
    s,
    n
  ){
    const year=
      2026+
      Math.floor(
        s.day/365
      );

    if(
      !isConcacafNationsLeagueYear(
        year
      )
    )
      return null;

    if(!Array.isArray(n.tournaments))
      n.tournaments=[];

    let tournament=
      n.tournaments.find(
        t=>
          t &&
          t.type===
            "CONCACAF_NATIONS_LEAGUE" &&
          Number(t.year)===year
      );

    if(tournament)
      return tournament;

    const CNL=
      concacafNationsLeagueApi();

    if(!CNL?.createTournament)
      return null;

    const previous=
      n.tournaments
        .filter(
          t=>
            t?.type===
              "CONCACAF_NATIONS_LEAGUE" &&
            t.status==="COMPLETED" &&
            Number(t.year)<year
        )
        .sort(
          (a,b)=>
            Number(b.year)-
            Number(a.year)
        )[0]||
        null;

    const allocations=
      concacafNextAllocations(
        previous
      );

    tournament=
      CNL.createTournament(
        year,
        allocations
      );

    if(
      previous &&
      allocations
    ){
      tournament.carriedFromYear=
        Number(previous.year);
    }

    n.tournaments.push(
      tournament
    );

    n.tournaments=
      n.tournaments
        .filter(Boolean)
        .slice(-40);

    return tournament;
  }

  function simulateConcacafNationsLeagueScore(
    tournament,
    homeId,
    awayId,
    rng,
    knockout=false
  ){
    const allTeams=[
      ...(tournament.leagues.A.seeded||[]),
      ...Object.values(
        tournament.leagues
      ).flatMap(
        league=>
          league.groups.flatMap(
            group=>group.teams
          )
      )
    ];

    const home=
      allTeams.find(
        team=>team.id===homeId
      );

    const away=
      allTeams.find(
        team=>team.id===awayId
      );

    const hs=
      Number(
        home?.reputation||
        65
      );

    const as=
      Number(
        away?.reputation||
        65
      );

    const hg=
      Math.max(
        0,
        Math.round(
          1.3+
          (hs-as)/24+
          (rng.next()-.5)*2.2
        )
      );

    const ag=
      Math.max(
        0,
        Math.round(
          1.05+
          (as-hs)/24+
          (rng.next()-.5)*2.2
        )
      );

    if(
      !knockout ||
      hg!==ag
    ){
      return {
        hg,
        ag,
        hp:null,
        ap:null
      };
    }

    const homeWins=
      (
        (hs-as)/100+
        rng.next()
      )>.48;

    return {
      hg,
      ag,
      hp:homeWins ? 5 : 4,
      ap:homeWins ? 4 : 5
    };
  }

  function progressConcacafNationsLeagueBackground(
    s,
    n,
    rng
  ){
    if(!Array.isArray(n.tournaments))
      n.tournaments=[];

    let tournament=
      n.tournaments
        .filter(
          t=>
            t?.type===
              "CONCACAF_NATIONS_LEAGUE" &&
            t.status!=="COMPLETED"
        )
        .sort(
          (a,b)=>
            Number(b.year)-
            Number(a.year)
        )[0]||
        null;

    if(!tournament){
      tournament=
        ensureConcacafNationsLeague(
          s,
          n
        );
    }

    if(
      !tournament ||
      tournament.status==="COMPLETED"
    )
      return tournament;

    const CNL=
      concacafNationsLeagueApi();

    if(!CNL)
      return tournament;

    const yearStart=
      (Number(tournament.year)-2026)*
      365;

    const relative=
      s.day-yearStart;

    // ----------------------------
    // FASE DE LIGAS
    // ----------------------------

    if(
      tournament.status===
      "LEAGUE_PHASE"
    ){
      const dates=[
        245,
        252,
        273,
        280,
        301,
        308
      ];

      for(
        let roundIndex=0;
        roundIndex<dates.length;
        roundIndex++
      ){
        if(
          relative<
          dates[roundIndex]
        )
          continue;

        for(
          const league of
          Object.values(
            tournament.leagues
          )
        ){
          for(
            const group of
            league.groups
          ){
            const matches=
              group.matches.filter(
                (_,index)=>
                  index%dates.length===
                  roundIndex
              );

            for(
              const match of
              matches
            ){
              if(match.played)
                continue;

              const result=
                simulateConcacafNationsLeagueScore(
                  tournament,
                  match.homeId,
                  match.awayId,
                  rng,
                  false
                );

              CNL.recordLeagueResult(
                tournament,
                match.id,
                result.hg,
                result.ag
              );
            }
          }
        }
      }

      if(
        CNL.leaguePhaseComplete(
          tournament
        )
      ){
        CNL.calculateMovement(
          tournament
        );

        CNL.buildQuarterfinals(
          tournament
        );
      }
    }

    // ----------------------------
    // QUARTAS
    // ----------------------------

    if(
      tournament.status===
        "QUARTERFINAL" &&
      relative>=329
    ){
      const matches=
        tournament.quarterfinals
          .filter(
            match=>!match.played
          );

      for(const match of matches){
        const result=
          simulateConcacafNationsLeagueScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        CNL.recordQuarterfinalResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }
    }

    // ----------------------------
    // FINAL FOUR NO ANO SEGUINTE
    // ----------------------------

    if(
      tournament.status===
        "SEMIFINAL" &&
      relative>=430
    ){
      const matches=
        tournament.finals.filter(
          match=>
            match.phase===
              "SEMIFINAL" &&
            !match.played
        );

      for(const match of matches){
        const result=
          simulateConcacafNationsLeagueScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        CNL.recordFinalResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }
    }

    if(
      tournament.status===
        "FINALS" &&
      relative>=434
    ){
      const matches=
        tournament.finals.filter(
          match=>
            (
              match.phase==="FINAL" ||
              match.phase==="THIRD_PLACE"
            ) &&
            !match.played
        );

      for(const match of matches){
        const result=
          simulateConcacafNationsLeagueScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        CNL.recordFinalResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }
    }

    return tournament;
  }

  function concacafNationsLeagueSummary(
    s
  ){
    const n=init(s);

    const tournament=
      (n.tournaments||[])
        .filter(
          t=>
            t?.type===
            "CONCACAF_NATIONS_LEAGUE"
        )
        .sort(
          (a,b)=>
            Number(b.year)-
            Number(a.year)
        )[0]||
        null;

    if(!tournament)
      return null;

    const CNL=
      concacafNationsLeagueApi();

    return {
      year:
        Number(
          tournament.year
        ),

      name:
        tournament.name,

      status:
        tournament.status,

      phase:
        CNL?.phaseLabel?.(
          tournament.status
        )||
        tournament.status,

      leagues:
        tournament.leagues,

      promotion:
        tournament.promotion||
        [],

      relegation:
        tournament.relegation||
        [],

      quarterfinals:
        tournament.quarterfinals||
        [],

      finals:
        tournament.finals||
        [],

      champion:
        tournament.champion||
        null,

      runnerUp:
        tournament.runnerUp||
        null,

      thirdPlace:
        tournament.thirdPlace||
        null,

      carriedFromYear:
        tournament.carriedFromYear||
        null
    };
  }


  function goldCupApi(){
    return (
      root.ProLifeGoldCup ||
      (
        typeof require==="function"
          ? require("./gold-cup.js")
          : null
      )
    );
  }

  function isGoldCupYear(year){
    return (
      year>=2027 &&
      (year-2027)%2===0
    );
  }

  function ensureGoldCup(s,n){
    const year=
      2026+
      Math.floor(s.day/365);

    if(!isGoldCupYear(year))
      return null;

    if(!Array.isArray(n.tournaments))
      n.tournaments=[];

    let tournament=
      n.tournaments.find(
        t=>
          t &&
          t.type==="GOLD_CUP" &&
          Number(t.year)===year
      );

    if(tournament)
      return tournament;

    const GC=
      goldCupApi();

    if(!GC?.createTournament)
      return null;

    tournament=
      GC.createTournament(
        year
      );

    n.tournaments.push(
      tournament
    );

    n.tournaments=
      n.tournaments
        .filter(Boolean)
        .slice(-36);

    return tournament;
  }

  function simulateGoldCupScore(
    tournament,
    homeId,
    awayId,
    rng,
    knockout=false
  ){
    const home=
      tournament.participants.find(
        t=>t.id===homeId
      );

    const away=
      tournament.participants.find(
        t=>t.id===awayId
      );

    const hs=
      Number(
        home?.reputation||
        68
      );

    const as=
      Number(
        away?.reputation||
        68
      );

    const hg=
      Math.max(
        0,
        Math.round(
          1.3+
          (hs-as)/24+
          (rng.next()-.5)*2.2
        )
      );

    const ag=
      Math.max(
        0,
        Math.round(
          1.05+
          (as-hs)/24+
          (rng.next()-.5)*2.2
        )
      );

    if(
      !knockout ||
      hg!==ag
    ){
      return {
        hg,
        ag,
        hp:null,
        ap:null
      };
    }

    const homeWins=
      (
        (hs-as)/100+
        rng.next()
      )>.48;

    return {
      hg,
      ag,
      hp:homeWins ? 5 : 4,
      ap:homeWins ? 4 : 5
    };
  }

  function progressGoldCupBackground(
    s,
    n,
    rng
  ){
    const tournament=
      ensureGoldCup(
        s,
        n
      );

    if(
      !tournament ||
      tournament.status==="COMPLETED"
    )
      return tournament;

    const GC=
      goldCupApi();

    if(!GC)
      return tournament;

    const yearStart=
      (Number(tournament.year)-2026)*
      365;

    const relative=
      s.day-yearStart;

    // ----------------------------
    // FASE DE GRUPOS
    // ----------------------------

    if(
      tournament.status===
      "GROUP_STAGE"
    ){
      const roundDays={
        1:165,
        2:171,
        3:177
      };

      for(const round of [1,2,3]){
        if(
          relative<
          roundDays[round]
        )
          continue;

        for(
          const group of
          tournament.groups
        ){
          for(
            const match of
            group.matches
          ){
            if(
              match.round!==round ||
              match.played
            )
              continue;

            const result=
              simulateGoldCupScore(
                tournament,
                match.homeId,
                match.awayId,
                rng,
                false
              );

            GC.recordGroupResult(
              tournament,
              match.id,
              result.hg,
              result.ag
            );
          }
        }
      }

      const complete=
        tournament.groups.every(
          group=>
            group.matches.every(
              match=>match.played
            )
        );

      if(
        complete &&
        !tournament.knockout.length
      ){
        GC.buildQuarterfinals(
          tournament
        );
      }
    }

    // ----------------------------
    // QUARTAS
    // ----------------------------

    if(
      tournament.status===
        "QUARTERFINAL" &&
      relative>=183
    ){
      const matches=
        tournament.knockout.filter(
          match=>
            match.phase===
              "QUARTERFINAL" &&
            !match.played
        );

      for(const match of matches){
        const result=
          simulateGoldCupScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        GC.recordKnockoutResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }
    }

    // ----------------------------
    // SEMIFINAL
    // ----------------------------

    if(
      tournament.status===
        "SEMIFINAL" &&
      relative>=188
    ){
      const matches=
        tournament.knockout.filter(
          match=>
            match.phase===
              "SEMIFINAL" &&
            !match.played
        );

      for(const match of matches){
        const result=
          simulateGoldCupScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        GC.recordKnockoutResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }
    }

    // ----------------------------
    // FINAL
    // ----------------------------

    if(
      tournament.status===
        "FINAL" &&
      relative>=193
    ){
      const match=
        tournament.knockout.find(
          item=>
            item.phase==="FINAL" &&
            !item.played
        );

      if(match){
        const result=
          simulateGoldCupScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        GC.recordKnockoutResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }
    }

    return tournament;
  }

  function goldCupSummary(s){
    const n=init(s);

    const tournament=
      (n.tournaments||[])
        .filter(
          t=>
            t?.type==="GOLD_CUP"
        )
        .sort(
          (a,b)=>
            Number(b.year)-
            Number(a.year)
        )[0]||
        null;

    if(!tournament)
      return null;

    const GC=
      goldCupApi();

    return {
      year:
        Number(
          tournament.year
        ),

      name:
        tournament.name,

      status:
        tournament.status,

      phase:
        GC?.phaseLabel?.(
          tournament.status
        )||
        tournament.status,

      participants:
        tournament.participants||
        [],

      groups:
        tournament.groups||
        [],

      qualified8:
        tournament.qualified8||
        [],

      knockout:
        tournament.knockout||
        [],

      champion:
        tournament.champion||
        null,

      runnerUp:
        tournament.runnerUp||
        null,

      totalMatches:
        GC?.totalMatches?.()||
        31
    };
  }


  function asianCupApi(){
    return (
      root.ProLifeAsianCup ||
      (
        typeof require==="function"
          ? require("./asian-cup.js")
          : null
      )
    );
  }

  function isAsianCupYear(year){
    return (
      year>=2027 &&
      (year-2027)%4===0
    );
  }

  function ensureAsianCup(s,n){
    const year=
      2026+
      Math.floor(s.day/365);

    if(!isAsianCupYear(year))
      return null;

    if(!Array.isArray(n.tournaments))
      n.tournaments=[];

    let tournament=
      n.tournaments.find(
        t=>
          t &&
          t.type==="ASIAN_CUP" &&
          Number(t.year)===year
      );

    if(tournament)
      return tournament;

    const ASIA=
      asianCupApi();

    if(!ASIA?.createTournament)
      return null;

    tournament=
      ASIA.createTournament(
        year
      );

    n.tournaments.push(
      tournament
    );

    n.tournaments=
      n.tournaments
        .filter(Boolean)
        .slice(-32);

    return tournament;
  }

  function simulateAsianCupScore(
    tournament,
    homeId,
    awayId,
    rng,
    knockout=false
  ){
    const home=
      tournament.participants.find(
        t=>t.id===homeId
      );

    const away=
      tournament.participants.find(
        t=>t.id===awayId
      );

    const hs=
      Number(
        home?.reputation||
        68
      );

    const as=
      Number(
        away?.reputation||
        68
      );

    const hg=
      Math.max(
        0,
        Math.round(
          1.3+
          (hs-as)/24+
          (rng.next()-.5)*2.2
        )
      );

    const ag=
      Math.max(
        0,
        Math.round(
          1.05+
          (as-hs)/24+
          (rng.next()-.5)*2.2
        )
      );

    if(
      !knockout ||
      hg!==ag
    ){
      return {
        hg,
        ag,
        hp:null,
        ap:null
      };
    }

    const homeWins=
      (
        (hs-as)/100+
        rng.next()
      )>.48;

    return {
      hg,
      ag,
      hp:homeWins ? 5 : 4,
      ap:homeWins ? 4 : 5
    };
  }

  function progressAsianCupBackground(
    s,
    n,
    rng
  ){
    const tournament=
      ensureAsianCup(
        s,
        n
      );

    if(
      !tournament ||
      tournament.status==="COMPLETED"
    )
      return tournament;

    const ASIA=
      asianCupApi();

    if(!ASIA)
      return tournament;

    const yearStart=
      (Number(tournament.year)-2026)*
      365;

    const relative=
      s.day-yearStart;

    // ----------------------------
    // GRUPOS
    // ----------------------------

    if(
      tournament.status===
      "GROUP_STAGE"
    ){
      const roundDays={
        1:26,
        2:31,
        3:36
      };

      for(const round of [1,2,3]){
        if(
          relative<
          roundDays[round]
        )
          continue;

        for(
          const group of
          tournament.groups
        ){
          for(
            const match of
            group.matches
          ){
            if(
              match.round!==round ||
              match.played
            )
              continue;

            const result=
              simulateAsianCupScore(
                tournament,
                match.homeId,
                match.awayId,
                rng,
                false
              );

            ASIA.recordGroupResult(
              tournament,
              match.id,
              result.hg,
              result.ag
            );
          }
        }
      }

      const complete=
        tournament.groups.every(
          group=>
            group.matches.every(
              match=>match.played
            )
        );

      if(
        complete &&
        !tournament.knockout.length
      ){
        ASIA.buildRoundOf16(
          tournament
        );
      }
    }

    // ----------------------------
    // OITAVAS
    // ----------------------------

    if(
      tournament.status===
        "ROUND_OF_16" &&
      relative>=42
    ){
      const matches=
        tournament.knockout.filter(
          match=>
            match.phase===
              "ROUND_OF_16" &&
            !match.played
        );

      for(const match of matches){
        const result=
          simulateAsianCupScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        ASIA.recordKnockoutResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }
    }

    // ----------------------------
    // QUARTAS
    // ----------------------------

    if(
      tournament.status===
        "QUARTERFINAL" &&
      relative>=47
    ){
      const matches=
        tournament.knockout.filter(
          match=>
            match.phase===
              "QUARTERFINAL" &&
            !match.played
        );

      for(const match of matches){
        const result=
          simulateAsianCupScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        ASIA.recordKnockoutResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }
    }

    // ----------------------------
    // SEMIFINAIS
    // ----------------------------

    if(
      tournament.status===
        "SEMIFINAL" &&
      relative>=52
    ){
      const matches=
        tournament.knockout.filter(
          match=>
            match.phase===
              "SEMIFINAL" &&
            !match.played
        );

      for(const match of matches){
        const result=
          simulateAsianCupScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        ASIA.recordKnockoutResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }
    }

    // ----------------------------
    // FINAL
    // ----------------------------

    if(
      tournament.status===
        "FINAL" &&
      relative>=57
    ){
      const match=
        tournament.knockout.find(
          item=>
            item.phase==="FINAL" &&
            !item.played
        );

      if(match){
        const result=
          simulateAsianCupScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        ASIA.recordKnockoutResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }
    }

    return tournament;
  }

  function asianCupSummary(s){
    const n=init(s);

    const tournament=
      (n.tournaments||[])
        .filter(
          t=>
            t?.type==="ASIAN_CUP"
        )
        .sort(
          (a,b)=>
            Number(b.year)-
            Number(a.year)
        )[0]||
        null;

    if(!tournament)
      return null;

    const ASIA=
      asianCupApi();

    return {
      year:
        Number(
          tournament.year
        ),

      name:
        tournament.name,

      status:
        tournament.status,

      phase:
        ASIA?.phaseLabel?.(
          tournament.status
        )||
        tournament.status,

      participants:
        tournament.participants||
        [],

      groups:
        tournament.groups||
        [],

      qualified16:
        tournament.qualified16||
        [],

      bestThirds:
        tournament.status!=="GROUP_STAGE" &&
        ASIA?.bestThirds
          ? ASIA.bestThirds(
              tournament
            )
          : [],

      knockout:
        tournament.knockout||
        [],

      champion:
        tournament.champion||
        null,

      runnerUp:
        tournament.runnerUp||
        null,

      totalMatches:
        ASIA?.totalMatches?.()||
        51
    };
  }


  function afconApi(){
    return (
      root.ProLifeAfcon ||
      (
        typeof require==="function"
          ? require("./afcon.js")
          : null
      )
    );
  }

  function isAfconYear(year){
    return (
      year>=2027 &&
      (year-2027)%2===0
    );
  }

  function ensureAfcon(s,n){
    const year=
      2026+
      Math.floor(s.day/365);

    if(!isAfconYear(year))
      return null;

    if(!Array.isArray(n.tournaments))
      n.tournaments=[];

    let tournament=
      n.tournaments.find(
        t=>
          t &&
          t.type==="AFCON" &&
          Number(t.year)===year
      );

    if(tournament)
      return tournament;

    const AFCON=
      afconApi();

    if(!AFCON?.createTournament)
      return null;

    tournament=
      AFCON.createTournament(
        year
      );

    n.tournaments.push(
      tournament
    );

    n.tournaments=
      n.tournaments
        .filter(Boolean)
        .slice(-28);

    return tournament;
  }

  function simulateAfconScore(
    tournament,
    homeId,
    awayId,
    rng,
    knockout=false
  ){
    const home=
      tournament.participants.find(
        t=>t.id===homeId
      );

    const away=
      tournament.participants.find(
        t=>t.id===awayId
      );

    const hs=
      Number(
        home?.reputation||
        68
      );

    const as=
      Number(
        away?.reputation||
        68
      );

    const hg=
      Math.max(
        0,
        Math.round(
          1.25+
          (hs-as)/24+
          (rng.next()-.5)*2.2
        )
      );

    const ag=
      Math.max(
        0,
        Math.round(
          1.05+
          (as-hs)/24+
          (rng.next()-.5)*2.2
        )
      );

    if(
      !knockout ||
      hg!==ag
    ){
      return {
        hg,
        ag,
        hp:null,
        ap:null
      };
    }

    const homeWins=
      (
        (hs-as)/100+
        rng.next()
      )>.48;

    return {
      hg,
      ag,
      hp:homeWins ? 5 : 4,
      ap:homeWins ? 4 : 5
    };
  }

  function progressAfconBackground(
    s,
    n,
    rng
  ){
    const tournament=
      ensureAfcon(
        s,
        n
      );

    if(
      !tournament ||
      tournament.status==="COMPLETED"
    )
      return tournament;

    const AFCON=
      afconApi();

    if(!AFCON)
      return tournament;

    const yearStart=
      (Number(tournament.year)-2026)*
      365;

    const relative=
      s.day-yearStart;

    // ----------------------------
    // FASE DE GRUPOS
    // ----------------------------

    if(
      tournament.status===
      "GROUP_STAGE"
    ){
      const roundDays={
        1:18,
        2:23,
        3:28
      };

      for(const round of [1,2,3]){
        if(
          relative<
          roundDays[round]
        )
          continue;

        for(
          const group of
          tournament.groups
        ){
          for(
            const match of
            group.matches
          ){
            if(
              match.round!==round ||
              match.played
            )
              continue;

            const result=
              simulateAfconScore(
                tournament,
                match.homeId,
                match.awayId,
                rng,
                false
              );

            AFCON.recordGroupResult(
              tournament,
              match.id,
              result.hg,
              result.ag
            );
          }
        }
      }

      const complete=
        tournament.groups.every(
          group=>
            group.matches.every(
              match=>match.played
            )
        );

      if(
        complete &&
        !tournament.knockout.length
      ){
        AFCON.buildRoundOf16(
          tournament
        );
      }
    }

    // ----------------------------
    // OITAVAS
    // ----------------------------

    if(
      tournament.status===
        "ROUND_OF_16" &&
      relative>=34
    ){
      const matches=
        tournament.knockout.filter(
          match=>
            match.phase===
              "ROUND_OF_16" &&
            !match.played
        );

      for(const match of matches){
        const result=
          simulateAfconScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        AFCON.recordKnockoutResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }
    }

    // ----------------------------
    // QUARTAS
    // ----------------------------

    if(
      tournament.status===
        "QUARTERFINAL" &&
      relative>=39
    ){
      const matches=
        tournament.knockout.filter(
          match=>
            match.phase===
              "QUARTERFINAL" &&
            !match.played
        );

      for(const match of matches){
        const result=
          simulateAfconScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        AFCON.recordKnockoutResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }
    }

    // ----------------------------
    // SEMIFINAIS
    // ----------------------------

    if(
      tournament.status===
        "SEMIFINAL" &&
      relative>=44
    ){
      const matches=
        tournament.knockout.filter(
          match=>
            match.phase===
              "SEMIFINAL" &&
            !match.played
        );

      for(const match of matches){
        const result=
          simulateAfconScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        AFCON.recordKnockoutResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }
    }

    // ----------------------------
    // FINAL + 3o LUGAR
    // ----------------------------

    if(
      tournament.status===
        "FINAL" &&
      relative>=49
    ){
      const matches=
        tournament.knockout.filter(
          match=>
            (
              match.phase==="FINAL" ||
              match.phase==="THIRD_PLACE"
            ) &&
            !match.played
        );

      for(const match of matches){
        const result=
          simulateAfconScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        AFCON.recordKnockoutResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }
    }

    return tournament;
  }

  function afconSummary(s){
    const n=init(s);

    const tournament=
      (n.tournaments||[])
        .filter(
          t=>
            t?.type==="AFCON"
        )
        .sort(
          (a,b)=>
            Number(b.year)-
            Number(a.year)
        )[0]||
        null;

    if(!tournament)
      return null;

    const AFCON=
      afconApi();

    return {
      year:
        Number(
          tournament.year
        ),

      name:
        tournament.name,

      status:
        tournament.status,

      phase:
        AFCON?.phaseLabel?.(
          tournament.status
        )||
        tournament.status,

      participants:
        tournament.participants||
        [],

      groups:
        tournament.groups||
        [],

      qualified16:
        tournament.qualified16||
        [],

      bestThirds:
        tournament.status!=="GROUP_STAGE" &&
        AFCON?.bestThirds
          ? AFCON.bestThirds(
              tournament
            )
          : [],

      knockout:
        tournament.knockout||
        [],

      champion:
        tournament.champion||
        null,

      runnerUp:
        tournament.runnerUp||
        null,

      thirdPlace:
        tournament.thirdPlace||
        null,

      totalMatches:
        AFCON?.totalMatches?.()||
        52
    };
  }


  function nationsLeagueApi(){
    return (
      root.ProLifeUefaNationsLeague ||
      (
        typeof require==="function"
          ? require("./uefa-nations-league.js")
          : null
      )
    );
  }

  function isNationsLeagueYear(year){
    return year>=2026 && year%2===0;
  }

  function ensureNationsLeague(s,n){
    const year=
      2026+
      Math.floor(s.day/365);

    if(!isNationsLeagueYear(year))
      return null;

    if(!Array.isArray(n.tournaments))
      n.tournaments=[];

    let tournament=
      n.tournaments.find(
        t=>
          t &&
          t.type==="UEFA_NATIONS_LEAGUE" &&
          Number(t.year)===year
      );

    if(tournament)
      return tournament;

    const NL=
      nationsLeagueApi();

    if(!NL?.createTournament)
      return null;

    tournament=
      NL.createTournament(
        year
      );

    n.tournaments.push(
      tournament
    );

    n.tournaments=
      n.tournaments
        .filter(Boolean)
        .slice(-24);

    return tournament;
  }

  function simulateNationsLeagueScore(
    tournament,
    homeId,
    awayId,
    rng,
    knockout=false
  ){
    const NL=
      nationsLeagueApi();

    const home=
      NL?.teams?.find(
        t=>t.id===homeId
      );

    const away=
      NL?.teams?.find(
        t=>t.id===awayId
      );

    const hs=
      Number(
        home?.reputation||
        70
      );

    const as=
      Number(
        away?.reputation||
        70
      );

    const hg=
      Math.max(
        0,
        Math.round(
          1.25+
          (hs-as)/24+
          (rng.next()-.5)*2.2
        )
      );

    const ag=
      Math.max(
        0,
        Math.round(
          1.05+
          (as-hs)/24+
          (rng.next()-.5)*2.2
        )
      );

    if(
      !knockout ||
      hg!==ag
    ){
      return {
        hg,
        ag,
        hp:null,
        ap:null
      };
    }

    const homeWins=
      (
        (hs-as)/100+
        rng.next()
      )>.48;

    return {
      hg,
      ag,
      hp:homeWins ? 5 : 4,
      ap:homeWins ? 4 : 5
    };
  }

  function progressNationsLeagueBackground(
    s,
    n,
    rng
  ){
    const tournament=
      ensureNationsLeague(
        s,
        n
      );

    if(
      !tournament ||
      tournament.status==="COMPLETED"
    )
      return tournament;

    const NL=
      nationsLeagueApi();

    if(!NL)
      return tournament;

    const yearStart=
      (Number(tournament.year)-2026)*
      365;

    const relative=
      s.day-yearStart;

    if(
      tournament.status===
      "LEAGUE_PHASE"
    ){
      const dates=[
        55,
        59,
        92,
        96,
        125,
        129
      ];

      const allMatches=[];

      for(
        const league of
        Object.values(
          tournament.leagues
        )
      ){
        for(
          const group of
          league.groups
        ){
          for(
            const match of
            group.matches
          ){
            allMatches.push(match);
          }
        }
      }

      const rounds=
        Math.max(
          ...Object.values(
            tournament.leagues
          ).flatMap(
            league=>
              league.groups.map(
                group=>
                  group.matches.length
              )
          )
        );

      for(
        let index=0;
        index<dates.length;
        index++
      ){
        if(relative<dates[index])
          continue;

        for(
          const league of
          Object.values(
            tournament.leagues
          )
        ){
          for(
            const group of
            league.groups
          ){
            const batch=
              group.matches.filter(
                (_,i)=>
                  i%dates.length===
                  index
              );

            for(const match of batch){
              if(match.played)
                continue;

              const result=
                simulateNationsLeagueScore(
                  tournament,
                  match.homeId,
                  match.awayId,
                  rng,
                  false
                );

              NL.recordLeagueResult(
                tournament,
                match.id,
                result.hg,
                result.ag
              );
            }
          }
        }
      }

      if(
        NL.leaguePhaseComplete(
          tournament
        )
      ){
        NL.calculateMovement(
          tournament
        );

        NL.createFinals(
          tournament
        );
      }
    }

    if(
      tournament.status===
        "SEMIFINAL" &&
      relative>=160
    ){
      const matches=
        tournament.finals.filter(
          m=>
            m.phase===
            "SEMIFINAL" &&
            !m.played
        );

      for(const match of matches){
        const result=
          simulateNationsLeagueScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        NL.recordFinalResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }
    }

    if(
      tournament.status===
        "FINALS" &&
      relative>=164
    ){
      const matches=
        tournament.finals.filter(
          m=>
            (
              m.phase==="FINAL" ||
              m.phase==="THIRD_PLACE"
            ) &&
            !m.played
        );

      for(const match of matches){
        const result=
          simulateNationsLeagueScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        NL.recordFinalResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }
    }

    return tournament;
  }

  function nationsLeagueSummary(s){
    const n=init(s);

    const tournament=
      (n.tournaments||[])
        .filter(
          t=>
            t?.type===
            "UEFA_NATIONS_LEAGUE"
        )
        .sort(
          (a,b)=>
            Number(b.year)-
            Number(a.year)
        )[0]||
        null;

    if(!tournament)
      return null;

    const NL=
      nationsLeagueApi();

    return {
      year:
        Number(
          tournament.year
        ),

      name:
        tournament.name,

      status:
        tournament.status,

      phase:
        NL?.phaseLabel?.(
          tournament.status
        )||
        tournament.status,

      leagues:
        tournament.leagues,

      finals:
        tournament.finals||
        [],

      promotion:
        tournament.promotion||
        [],

      relegation:
        tournament.relegation||
        [],

      champion:
        tournament.champion||
        null,

      runnerUp:
        tournament.runnerUp||
        null,

      thirdPlace:
        tournament.thirdPlace||
        null
    };
  }


  function euroApi(){
    return (
      root.ProLifeEuro ||
      (
        typeof require==="function"
          ? require("./euro.js")
          : null
      )
    );
  }

  function euroYearFromDay(day){
    return 2026+Math.floor(day/365);
  }

  function isEuroYear(year){
    return (
      year>=2028 &&
      (year-2028)%4===0
    );
  }

  function ensureEuro(s,n){
    const year=
      euroYearFromDay(
        s.day
      );

    if(!isEuroYear(year))
      return null;

    if(!Array.isArray(n.tournaments))
      n.tournaments=[];

    let tournament=
      n.tournaments.find(
        t=>
          t &&
          t.type==="EURO" &&
          Number(t.year)===year
      );

    if(tournament)
      return tournament;

    const EURO=
      euroApi();

    if(!EURO?.createTournament)
      return null;

    tournament=
      EURO.createTournament(
        year
      );

    n.tournaments.push(
      tournament
    );

    n.tournaments=
      n.tournaments
        .filter(Boolean)
        .slice(-16);

    return tournament;
  }

  function simulateEuroScore(
    tournament,
    homeId,
    awayId,
    rng,
    knockout=false
  ){
    const home=
      tournament.participants.find(
        team=>team.id===homeId
      );

    const away=
      tournament.participants.find(
        team=>team.id===awayId
      );

    const homeStrength=
      Number(
        home?.reputation||
        72
      );

    const awayStrength=
      Number(
        away?.reputation||
        72
      );

    const hg=
      Math.max(
        0,
        Math.round(
          1.3+
          (homeStrength-awayStrength)/24+
          (rng.next()-.5)*2.2
        )
      );

    const ag=
      Math.max(
        0,
        Math.round(
          1.1+
          (awayStrength-homeStrength)/24+
          (rng.next()-.5)*2.2
        )
      );

    if(
      !knockout ||
      hg!==ag
    ){
      return {
        hg,
        ag,
        hp:null,
        ap:null
      };
    }

    const homeWins=
      (
        (homeStrength-awayStrength)/100+
        rng.next()
      )>.48;

    return {
      hg,
      ag,
      hp:homeWins ? 5 : 4,
      ap:homeWins ? 4 : 5
    };
  }

  function progressEuroBackground(
    s,
    n,
    rng
  ){
    const tournament=
      ensureEuro(
        s,
        n
      );

    if(
      !tournament ||
      tournament.status==="COMPLETED"
    )
      return tournament;

    const EURO=
      euroApi();

    if(!EURO)
      return tournament;

    const yearStart=
      (Number(tournament.year)-2026)*
      365;

    const relative=
      s.day-yearStart;

    // ----------------------------------
    // FASE DE GRUPOS
    // ----------------------------------

    if(
      tournament.status===
      "GROUP_STAGE"
    ){
      const roundDays={
        1:166,
        2:172,
        3:178
      };

      for(const round of [1,2,3]){
        if(
          relative<
          roundDays[round]
        )
          continue;

        for(
          const group of
          tournament.groups
        ){
          for(
            const match of
            group.matches
          ){
            if(
              match.round!==round ||
              match.played
            )
              continue;

            const result=
              simulateEuroScore(
                tournament,
                match.homeId,
                match.awayId,
                rng,
                false
              );

            EURO.recordGroupResult(
              tournament,
              match.id,
              result.hg,
              result.ag
            );
          }
        }
      }

      const complete=
        tournament.groups.every(
          group=>
            group.matches.every(
              match=>match.played
            )
        );

      if(
        complete &&
        !tournament.knockout.length
      ){
        EURO.buildRoundOf16(
          tournament
        );
      }
    }

    // ----------------------------------
    // OITAVAS
    // ----------------------------------

    if(
      tournament.status===
        "ROUND_OF_16" &&
      relative>=185
    ){
      const matches=
        tournament.knockout.filter(
          match=>
            match.phase===
            "ROUND_OF_16" &&
            !match.played
        );

      for(const match of matches){
        const result=
          simulateEuroScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        EURO.recordKnockoutResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }
    }

    // ----------------------------------
    // QUARTAS
    // ----------------------------------

    if(
      tournament.status===
        "QUARTERFINAL" &&
      relative>=190
    ){
      const matches=
        tournament.knockout.filter(
          match=>
            match.phase===
            "QUARTERFINAL" &&
            !match.played
        );

      for(const match of matches){
        const result=
          simulateEuroScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        EURO.recordKnockoutResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }
    }

    // ----------------------------------
    // SEMIFINAL
    // ----------------------------------

    if(
      tournament.status===
        "SEMIFINAL" &&
      relative>=195
    ){
      const matches=
        tournament.knockout.filter(
          match=>
            match.phase===
            "SEMIFINAL" &&
            !match.played
        );

      for(const match of matches){
        const result=
          simulateEuroScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        EURO.recordKnockoutResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }
    }

    // ----------------------------------
    // FINAL
    // ----------------------------------

    if(
      tournament.status===
        "FINAL" &&
      relative>=199
    ){
      const match=
        tournament.knockout.find(
          item=>
            item.phase==="FINAL" &&
            !item.played
        );

      if(match){
        const result=
          simulateEuroScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        EURO.recordKnockoutResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }
    }

    return tournament;
  }

  function progressFinalissimaBackground(
    s,
    n,
    rng
  ){
    const tournament=
      ensureFinalissima(
        s,
        n
      );

    if(
      !tournament ||
      tournament.status==="COMPLETED"
    )
      return tournament;

    const yearStart=
      (Number(tournament.year)-2026)*
      365;

    const relative=
      s.day-yearStart;

    if(relative<82)
      return tournament;

    const match=
      tournament.match;

    if(
      match.homeId==="BRA" ||
      match.awayId==="BRA"
    )
      return tournament;

    const F=
      finalissimaApi();

    if(!F?.simulate)
      return tournament;

    F.simulate(
      tournament,
      rng
    );

    return tournament;
  }

  function finalissimaSummary(s){
    const n=init(s);

    const tournament=
      (n.tournaments||[])
        .filter(
          t=>
            t?.type===
            "FINALISSIMA"
        )
        .sort(
          (a,b)=>
            Number(b.year)-
            Number(a.year)
        )[0]||
        null;

    if(!tournament)
      return null;

    const F=
      finalissimaApi();

    return (
      F?.summary
        ? F.summary(
            tournament
          )
        : {
            year:tournament.year,
            name:tournament.name,
            status:tournament.status,
            participants:
              tournament.participants||
              [],
            match:
              tournament.match||
              null,
            champion:
              tournament.champion||
              null,
            runnerUp:
              tournament.runnerUp||
              null
          }
    );
  }

  function euroSummary(s){
    const n=init(s);

    const tournaments=
      (n.tournaments||[])
        .filter(
          tournament=>
            tournament?.type===
            "EURO"
        )
        .sort(
          (a,b)=>
            Number(b.year)-
            Number(a.year)
        );

    const tournament=
      tournaments[0]||
      null;

    if(!tournament)
      return null;

    const EURO=
      euroApi();

    return {
      year:
        Number(
          tournament.year
        ),

      name:
        tournament.name||
        "UEFA EURO",

      status:
        tournament.status,

      phase:
        EURO?.phaseLabel?.(
          tournament.status
        )||
        tournament.status,

      participants:
        tournament.participants||
        [],

      groups:
        tournament.groups||
        [],

      qualified16:
        tournament.qualified16||
        [],

      bestThirds:
        tournament.status!=="GROUP_STAGE" &&
        EURO?.bestThirds
          ? EURO.bestThirds(
              tournament
            )
          : [],

      knockout:
        tournament.knockout||
        [],

      champion:
        tournament.champion||
        null,

      runnerUp:
        tournament.runnerUp||
        null,

      totalMatches:
        EURO?.totalMatches?.()||
        51
    };
  }


  function copaAmericaApi(){
    return (
      root.ProLifeCopaAmerica ||
      (
        typeof require==="function"
          ? require("./copa-america.js")
          : null
      )
    );
  }

  function copaAmericaYearFromDay(day){
    return 2026+Math.floor(day/365);
  }

  function isCopaAmericaYear(year){
    return (
      year>=2028 &&
      (year-2028)%4===0
    );
  }

  function ensureCopaAmerica(s,n){
    const year=
      copaAmericaYearFromDay(
        s.day
      );

    if(!isCopaAmericaYear(year))
      return null;

    if(!Array.isArray(n.tournaments))
      n.tournaments=[];

    let tournament=
      n.tournaments.find(
        t=>
          t &&
          t.type==="COPA_AMERICA" &&
          Number(t.year)===year
      );

    if(tournament)
      return tournament;

    const CA=
      copaAmericaApi();

    if(!CA?.createTournament)
      return null;

    tournament=
      CA.createTournament(
        year
      );

    n.tournaments.push(
      tournament
    );

    n.tournaments=
      n.tournaments
        .filter(Boolean)
        .slice(-10);

    return tournament;
  }

  function ensureCopaAmericaGroupSchedule(s,n){
    const tournament=
      ensureCopaAmerica(s,n);

    if(!tournament)
      return;

    const CA=
      copaAmericaApi();

    if(!CA?.brazilGroup)
      return;

    const brazilGroup=
      CA.brazilGroup(
        tournament
      );

    if(!brazilGroup)
      return;

    const yearStart=
      Math.floor(s.day/365)*365;

    const copaWindow=
      yearStart+168;

    const brazilMatches=
      brazilGroup.matches.filter(
        match=>
          match.homeId==="BRA" ||
          match.awayId==="BRA"
      );

    const validIds=
      new Set(
        brazilMatches.map(
          match=>
            "ca:"+
            tournament.year+
            ":"+
            match.id
        )
      );

    // Remove generic future fixtures that would collide
    // with the Copa America group stage.
    n.schedule=
      n.schedule.filter(
        match=>{
          if(match.played)
            return true;

          if(
            match.day<
              copaWindow-2 ||
            match.day>
              copaWindow+16
          )
            return true;

          if(
            match.tournamentType===
            "COPA_AMERICA"
          )
            return (
              validIds.has(
                match.id
              ) ||
              match.tournamentPhase!=="group"
            );

          return true;
        }
      );

    brazilMatches.forEach(
      (match,index)=>{
        const id=
          "ca:"+
          tournament.year+
          ":"+
          match.id;

        if(
          n.schedule.some(
            fixture=>
              fixture.id===id
          )
        )
          return;

        const opponent=
          match.homeId==="BRA"
            ? match.away
            : match.home;

        n.schedule.push({
          id,
          day:
            copaWindow+
            index*6,

          windowDay:
            copaWindow,

          opponent,

          competition:
            "Copa America",

          played:false,
          participated:false,

          brazil:null,
          other:null,

          tournamentType:
            "COPA_AMERICA",

          tournamentYear:
            tournament.year,

          tournamentMatchId:
            match.id,

          tournamentPhase:
            "group",

          tournamentGroup:
            brazilGroup.name
        });
      }
    );

    n.schedule.sort(
      (a,b)=>a.day-b.day
    );
  }

  function worldCupApi(){
    return (
      root.ProLifeWorldCup ||
      (
        typeof require==="function"
          ? require("./world-cup.js")
          : null
      )
    );
  }

  function worldQualifiersApi(){
    return (
      root.ProLifeWorldQualifiers ||
      (
        typeof require==="function"
          ? require("./world-qualifiers.js")
          : null
      )
    );
  }

  function copaAmericaSummary(s){
    const n=init(s);

    const tournaments=
      (n.tournaments||[])
        .filter(
          t=>
            t?.type===
            "COPA_AMERICA"
        )
        .sort(
          (a,b)=>
            Number(b.year)-
            Number(a.year)
        );

    const tournament=
      tournaments[0]||
      null;

    if(!tournament)
      return null;

    const CA=
      copaAmericaApi();

    const brazilGroup=
      CA?.brazilGroup
        ? CA.brazilGroup(
            tournament
          )
        : null;

    const groupTable=
      brazilGroup &&
      CA?.standings
        ? CA.standings(
            tournament,
            brazilGroup.name
          )
        : [];

    const fixtures=
      (n.schedule||[])
        .filter(
          fixture=>
            fixture.tournamentType===
              "COPA_AMERICA" &&
            Number(
              fixture.tournamentYear
            )===
            Number(
              tournament.year
            )
        )
        .sort(
          (a,b)=>a.day-b.day
        );

    const nextFixture=
      fixtures.find(
        fixture=>
          !fixture.played
      )||
      null;

    const playedFixtures=
      fixtures.filter(
        fixture=>
          fixture.played
      );

    return {
      year:
        Number(
          tournament.year
        ),

      name:
        tournament.name||
        "Copa America",

      status:
        tournament.status,

      phase:
        CA?.phaseLabel?.(
          tournament.status
        )||
        tournament.status,

      group:
        brazilGroup?.name||
        null,

      groupTable,

      groups:
        tournament.groups||
        [],

      participants:
        tournament.participants||
        [],

      results:
        playedFixtures,

      fixtures,

      nextFixture,

      knockout:
        tournament.knockout||
        [],

      champion:
        tournament.champion||
        null,

      runnerUp:
        tournament.runnerUp||
        null,

      thirdPlace:
        tournament.thirdPlace||
        null,

      totalMatches:
        CA?.totalMatches?.()||
        32
    };
  }

  function worldCupYearFromDay(day){
    return 2026+Math.floor(day/365);
  }

  function isWorldCupYear(year){
    return year>=2026 && (year-2026)%4===0;
  }

  function ensureWorldCup(s,n){
    const year=
      worldCupYearFromDay(s.day);

    if(!isWorldCupYear(year))
      return null;

    if(!Array.isArray(n.tournaments))
      n.tournaments=[];

    let tournament=
      n.tournaments.find(
        t=>
          t &&
          t.type==="WORLD_CUP" &&
          Number(t.year)===year
      );

    if(tournament)
      return tournament;

    const WC=
      worldCupApi();

    if(!WC?.createTournament)
      return null;

    // 2026 remains the initial fixed edition.
    if(year===2026){
      tournament=
        WC.createTournament(year);
    }
    else{
      // Future editions must come from the
      // qualification cycle of this career.
      ensureQualifiers(
        s,
        n,
        null
      );

      const q=
        n.qualifiers;

      if(
        !q ||
        q.version!==2 ||
        Number(q.worldCupYear)!==year ||
        q.complete!==true
      )
        return null;

      const WQ=
        worldQualifiersApi();

      if(!WQ?.qualify)
        return null;

      const qualification=
        WQ.qualify(
          year,
          q,
          null
        );

      tournament=
        WC.createTournament(
          year,
          qualification.participants
        );

      tournament.qualification={
        version:
          qualification.version,

        allocation:
          qualification.allocation,

        direct:
          qualification.direct,

        playoffCandidates:
          qualification.playoffCandidates,

        playoffWinners:
          qualification.playoffWinners
      };

      tournament.qualificationSource=
        "WORLD_QUALIFIERS";

      tournament.conmebol={
        qualified:
          q.qualified.slice(),

        playoff:
          q.playoff,

        table:
          q.table.map(team=>({
            id:team.id,
            name:team.name,
            played:team.played,
            w:team.w,
            d:team.d,
            l:team.l,
            gf:team.gf,
            ga:team.ga,
            gd:team.gd,
            points:team.points
          }))
      };
    }

    n.tournaments.push(
      tournament
    );

    n.tournaments=
      n.tournaments
        .filter(Boolean)
        .slice(-6);

    return tournament;
  }

  function ensureWorldCupGroupSchedule(s,n){
    const tournament=ensureWorldCup(s,n);

    if(!tournament)
      return;

    const WC=worldCupApi();

    if(!WC?.brazilGroup)
      return;

    const brazilGroup=WC.brazilGroup(
      tournament
    );

    if(!brazilGroup)
      return;

    const yearStart=
      Math.floor(s.day/365)*365;

    const worldCupWindow=
      yearStart+161;

    for(const group of tournament.groups||[])
      for(const match of group.matches||[])
        match.day=worldCupWindow+[0,6,12][Math.max(0,Number(match.round||1)-1)];

    const brazilMatches=
      brazilGroup.matches.filter(
        m=>
          m.homeId==="BRA" ||
          m.awayId==="BRA"
      );

    const validIds=new Set(
      brazilMatches.map(
        m=>"wc:"+tournament.year+":"+m.id
      )
    );

    n.schedule=n.schedule.filter(match=>{
      if(match.played)
        return true;

      if(match.day<worldCupWindow-2)
        return true;

      if(match.day>worldCupWindow+12)
        return true;

      if(match.competition!=="Copa Mundial")
        return true;

      // Never remove knockout fixtures created dynamically.
      if(
        match.tournamentType==="WORLD_CUP" &&
        match.tournamentPhase &&
        match.tournamentPhase!=="group"
      )
        return true;

      // Keep the three official Brazil group fixtures.
      if(validIds.has(match.id))
        return true;

      // Remove only legacy/generic World Cup-window fixtures.
      return false;
    });

    brazilMatches.forEach(
      (match,index)=>{
        const id=
          "wc:"+
          tournament.year+
          ":"+
          match.id;

        if(
          n.schedule.some(
            fixture=>fixture.id===id
          )
        )
          return;

        const opponent=
          match.homeId==="BRA"
            ? match.away
            : match.home;

        n.schedule.push({
          id,
          day:
            worldCupWindow+
            [0,6,12][index],
          windowDay:worldCupWindow,
          opponent,
          competition:"Copa Mundial",
          played:false,
          participated:false,
          brazil:null,
          other:null,
          tournamentType:"WORLD_CUP",
          tournamentYear:tournament.year,
          tournamentMatchId:match.id,
          tournamentPhase:"group",
          tournamentGroup:brazilGroup.name
        });
      }
    );

    n.schedule.sort(
      (a,b)=>a.day-b.day
    );
  }

  function recordWorldCupGroupFixture(
    n,
    fixture,
    brazil,
    other
  ){
    if(
      !fixture ||
      fixture.tournamentType!=="WORLD_CUP" ||
      !fixture.tournamentMatchId
    )
      return false;

    const WC=worldCupApi();

    const tournament=
      (n.tournaments||[]).find(
        t=>
          t.type==="WORLD_CUP" &&
          Number(t.year)===
            Number(fixture.tournamentYear)
      );

    if(
      !WC?.recordGroupResult ||
      !tournament
    )
      return false;

    const cupMatch=
      tournament.groups
        .flatMap(g=>g.matches)
        .find(
          m=>
            m.id===
            fixture.tournamentMatchId
        );

    if(
      !cupMatch ||
      cupMatch.played
    )
      return false;

    const hg=
      cupMatch.homeId==="BRA"
        ? brazil
        : other;

    const ag=
      cupMatch.awayId==="BRA"
        ? brazil
        : other;

    WC.recordGroupResult(
      tournament,
      cupMatch.id,
      hg,
      ag
    );

    return true;
  }

  function worldCupPhaseDay(tournament,phase){
    const yearStart=
      (Number(tournament.year)-2026)*365;

    const relative={
      ROUND_OF_32:178,
      ROUND_OF_16:184,
      QUARTERFINAL:189,
      SEMIFINAL:194,
      THIRD_PLACE:198,
      FINAL:199
    }[phase];

    return Number.isFinite(relative)
      ? yearStart+relative
      : null;
  }

  function brazilKnockoutMatch(tournament,phase){
    const WC=worldCupApi();

    if(!WC?.phaseMatches)
      return null;

    return WC.phaseMatches(
      tournament,
      phase
    ).find(
      m=>
        m.homeId==="BRA" ||
        m.awayId==="BRA"
    )||null;
  }

  function addBrazilKnockoutFixture(
    s,n,tournament,match
  ){
    if(!match || match.played)
      return null;

    const id=
      "wc:"+tournament.year+":"+match.id;

    const existing=n.schedule.find(
      f=>f.id===id
    );

    if(existing)
      return existing;

    const opponent=
      match.homeId==="BRA"
        ? match.away
        : match.home;

    const fixture={
      id,
      day:worldCupPhaseDay(
        tournament,
        match.phase
      ),
      windowDay:
        (Number(tournament.year)-2026)*365+
        161,
      opponent,
      competition:"Copa Mundial",
      played:false,
      participated:false,
      brazil:null,
      other:null,
      tournamentType:"WORLD_CUP",
      tournamentYear:tournament.year,
      tournamentMatchId:match.id,
      tournamentPhase:match.phase,
      tournamentGroup:null
    };

    n.schedule.push(fixture);

    n.schedule.sort(
      (a,b)=>a.day-b.day
    );

    return fixture;
  }

  function simulateOtherKnockoutMatches(
    tournament,
    phase,
    rng
  ){
    const WC=worldCupApi();

    if(!WC?.phaseMatches)
      return;

    for(
      const match of
      WC.phaseMatches(tournament,phase)
    ){
      if(match.played)
        continue;

      if(
        match.homeId==="BRA" ||
        match.awayId==="BRA"
      )
        continue;

      WC.simulateKnockoutMatch(
        tournament,
        match,
        rng
      );
    }
  }

  function worldCupStableRng(tournament,match){
    const source=`${tournament.year}:${match.id}`;
    let state=2166136261;
    for(let i=0;i<source.length;i++) state=Math.imul(state^source.charCodeAt(i),16777619)>>>0;
    return {next(){state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;}};
  }

  function progressWorldCupBackground(s,n){
    const tournament=ensureWorldCup(s,n),WC=worldCupApi();
    if(!tournament||!WC||tournament.status==="COMPLETED") return tournament;
    const yearStart=(Number(tournament.year)-2026)*365,groupDays=[161,167,173].map(x=>yearStart+x);
    for(const group of tournament.groups||[]){
      for(const match of group.matches||[]){
        match.day??=groupDays[Math.max(0,Number(match.round||1)-1)];
        if(match.played||match.day>s.day||match.homeId==="BRA"||match.awayId==="BRA") continue;
        WC.simulateGroupMatch(match,worldCupStableRng(tournament,match),tournament);
      }
    }
    if(!WC.groupStageComplete(tournament)) return tournament;
    if(!Array.isArray(tournament.qualified32)||tournament.qualified32.length!==32) WC.qualifyRoundOf32(tournament);
    if(!WC.phaseMatches(tournament,"ROUND_OF_32").length) WC.buildRoundOf32(tournament);
    const phases=["ROUND_OF_32","ROUND_OF_16","QUARTERFINAL","SEMIFINAL","THIRD_PLACE","FINAL"];
    for(const phase of phases){
      const matches=WC.phaseMatches(tournament,phase);
      if(!matches.length) continue;
      const due=worldCupPhaseDay(tournament,phase);
      for(const match of matches){
        match.day??=due;
        if(match.played||due>s.day||match.homeId==="BRA"||match.awayId==="BRA") continue;
        WC.simulateKnockoutMatch(tournament,match,worldCupStableRng(tournament,match));
      }
      const brazilMatch=matches.find(m=>m.homeId==="BRA"||m.awayId==="BRA");
      if(brazilMatch&&!brazilMatch.played) addBrazilKnockoutFixture(s,n,tournament,brazilMatch);
      if(!WC.phaseComplete(tournament,phase)) break;
      if(phase==="ROUND_OF_32"&&!WC.phaseMatches(tournament,"ROUND_OF_16").length) WC.createNextPhase(tournament,phase,"ROUND_OF_16");
      else if(phase==="ROUND_OF_16"&&!WC.phaseMatches(tournament,"QUARTERFINAL").length) WC.createNextPhase(tournament,phase,"QUARTERFINAL");
      else if(phase==="QUARTERFINAL"&&!WC.phaseMatches(tournament,"SEMIFINAL").length) WC.createNextPhase(tournament,phase,"SEMIFINAL");
      else if(phase==="SEMIFINAL"&&!WC.phaseMatches(tournament,"FINAL").length) WC.createFinals(tournament);
      else if(phase==="FINAL") WC.finalizeTournament(tournament);
    }
    return tournament;
  }

  function syncBrazilWorldCupKnockout(
    s,
    n,
    tournament,
    phase,
    rng
  ){
    const WC=worldCupApi();

    if(!WC || !tournament || !phase)
      return null;

    // Compatibility for callers that manually register a future fixture.
    // Normal daily progression never enters this branch.
    if(s.day<worldCupPhaseDay(tournament,phase)) simulateOtherKnockoutMatches(tournament,phase,rng);

    const match=
      brazilKnockoutMatch(
        tournament,
        phase
      );

    if(!match)
      return null;

    return addBrazilKnockoutFixture(
      s,
      n,
      tournament,
      match
    );
  }

  function finishWorldCupWithoutBrazil(
    n,
    tournament,
    rng,
    forceComplete=false
  ){
    const WC=worldCupApi();

    if(!WC)
      return;

    if(forceComplete&&WC.simulateTournament) WC.simulateTournament(tournament,rng);

    if(tournament.eliminationRecorded) return;
    tournament.eliminationRecorded=true;

    n.history.unshift({
      day:null,
      type:"world_cup_elimination",
      year:tournament.year,
      phase:
        tournament.brazilEliminationPhase||
        null,
      champion:
        tournament.champion?.name||
        null
    });

    n.history=n.history.slice(0,80);
  }

  function qualifyWorldCupGroups(
    s,
    n,
    tournament,
    rng
  ){
    const WC=worldCupApi();

    if(!WC)
      return null;

    const brazilGroup=
      WC.brazilGroup?.(
        tournament
      );

    if(!brazilGroup)
      return null;

    const brazilGames=
      brazilGroup.matches.filter(
        m=>
          m.homeId==="BRA" ||
          m.awayId==="BRA"
      );

    if(
      !brazilGames.every(
        m=>m.played
      )
    )
      return null;

    if(
      tournament.status==="GROUP_STAGE"
    ){
      WC.simulateGroupStage(
        tournament,
        rng
      );

      WC.buildRoundOf32(
        tournament
      );
    }

    const qualified=
      tournament.qualified32.some(
        t=>t.id==="BRA"
      );

    if(!qualified){
      tournament.brazilStatus=
        "ELIMINATED";

      tournament.brazilEliminationPhase=
        "GROUP_STAGE";

      finishWorldCupWithoutBrazil(
        n,
        tournament,
        rng,
        s.day<(Number(tournament.year)-2026)*365+173
      );

      n.calledUp=false;
      n.currentCallupWindow=null;

      return null;
    }

    tournament.brazilStatus=
      "QUALIFIED";

    return syncBrazilWorldCupKnockout(
      s,
      n,
      tournament,
      "ROUND_OF_32",
      rng
    );
  }

  function nextWorldCupPhase(phase){
    return {
      ROUND_OF_32:"ROUND_OF_16",
      ROUND_OF_16:"QUARTERFINAL",
      QUARTERFINAL:"SEMIFINAL"
    }[phase]||null;
  }

  function recordWorldCupKnockoutFixture(
    s,
    n,
    fixture,
    brazil,
    other,
    rng
  ){
    const WC=worldCupApi();

    const tournament=
      (n.tournaments||[]).find(
        t=>
          t.type==="WORLD_CUP" &&
          Number(t.year)===
            Number(fixture.tournamentYear)
      );

    if(!WC || !tournament)
      return false;

    const match=
      tournament.knockout.find(
        m=>
          m.id===
          fixture.tournamentMatchId
      );

    if(!match || match.played)
      return false;

    const hg=
      match.homeId==="BRA"
        ? brazil
        : other;

    const ag=
      match.awayId==="BRA"
        ? brazil
        : other;

    let penaltyWinnerId=null;

    if(hg===ag){
      const brazilWins=
        rng &&
        typeof rng.next==="function"
          ? rng.next()<.55
          : Math.random()<.55;

      penaltyWinnerId=
        brazilWins
          ? "BRA"
          : (
              match.homeId==="BRA"
                ? match.awayId
                : match.homeId
            );
    }

    WC.recordKnockoutResult(
      tournament,
      match.id,
      hg,
      ag,
      penaltyWinnerId
    );

    if(match.phase==="FINAL"){
      WC.finalizeTournament(tournament);
      tournament.brazilStatus=match.winnerId==="BRA"?"CHAMPION":"RUNNER_UP";
      n.calledUp=false;
      n.currentCallupWindow=null;
      if(match.winnerId!=="BRA") return true;
      const title="Copa Mundial "+tournament.year;
      if(!Array.isArray(n.titles)) n.titles=[];
      if(!n.titles.includes(title)) n.titles.push(title);
      if(!n.history.some(x=>x.type==="world_cup_title"&&Number(x.year)===Number(tournament.year))) n.history.unshift({day:s.day,type:"world_cup_title",year:tournament.year,title});
      n.history=n.history.slice(0,80);
      return true;
    }

    if(match.phase==="SEMIFINAL"&&match.winnerId!=="BRA"){
      tournament.brazilStatus="THIRD_PLACE";
      if(WC.phaseComplete(tournament,"SEMIFINAL")){
        if(!WC.phaseMatches(tournament,"FINAL").length) WC.createFinals(tournament);
        syncBrazilWorldCupKnockout(s,n,tournament,"THIRD_PLACE",rng);
      }
      return true;
    }

    if(match.phase==="THIRD_PLACE"){
      tournament.brazilStatus=match.winnerId==="BRA"?"THIRD_PLACE":"FOURTH_PLACE";
      n.calledUp=false;
      n.currentCallupWindow=null;
      return true;
    }

    if(match.winnerId!=="BRA"){
      tournament.brazilStatus=
        "ELIMINATED";

      tournament.brazilEliminationPhase=
        match.phase;

      finishWorldCupWithoutBrazil(
        n,
        tournament,
        rng,
        s.day<worldCupPhaseDay(tournament,match.phase)
      );

      n.calledUp=false;
      n.currentCallupWindow=null;

      return true;
    }

    if(match.phase==="SEMIFINAL"){
      if(
        WC.phaseComplete(
          tournament,
          "SEMIFINAL"
        )
      ){
        WC.createFinals(
          tournament
        );

        syncBrazilWorldCupKnockout(
          s,
          n,
          tournament,
          "FINAL",
          rng
        );
      }

      return true;
    }

    const next=
      nextWorldCupPhase(
        match.phase
      );

    if(
      next &&
      WC.phaseComplete(
        tournament,
        match.phase
      )
    ){
      WC.createNextPhase(
        tournament,
        match.phase,
        next
      );

      syncBrazilWorldCupKnockout(
        s,
        n,
        tournament,
        next,
        rng
      );
    }

    return true;
  }

  function recordWorldCupFixture(
    s,
    n,
    fixture,
    brazil,
    other,
    rng
  ){
    if(
      !fixture ||
      fixture.tournamentType!=="WORLD_CUP"
    )
      return false;

    if(
      fixture.tournamentPhase==="group"
    ){
      const recorded=
        recordWorldCupGroupFixture(
          n,
          fixture,
          brazil,
          other
        );

      if(!recorded)
        return false;

      const tournament=
        (n.tournaments||[]).find(
          t=>
            t.type==="WORLD_CUP" &&
            Number(t.year)===
              Number(fixture.tournamentYear)
        );

      if(tournament)
        qualifyWorldCupGroups(
          s,
          n,
          tournament,
          rng
        );

      return true;
    }

    return recordWorldCupKnockoutFixture(
      s,
      n,
      fixture,
      brazil,
      other,
      rng
    );
  }

  function ensureFinalissimaSchedule(s,n){
    const tournament=
      ensureFinalissima(
        s,
        n
      );

    if(
      !tournament ||
      tournament.status==="COMPLETED"
    )
      return null;

    const match=
      tournament.match;

    const brazilInvolved=
      match.homeId==="BRA" ||
      match.awayId==="BRA";

    if(!brazilInvolved)
      return null;

    const yearStart=
      (Number(tournament.year)-2026)*
      365;

    const matchDay=
      yearStart+82;

    const id=
      "finalissima:"+
      tournament.year;

    let fixture=
      n.schedule.find(
        x=>x.id===id
      );

    if(fixture)
      return fixture;

    const opponent=
      match.homeId==="BRA"
        ? match.away
        : match.home;

    fixture={
      id,
      day:matchDay,
      windowDay:matchDay,
      opponent,
      competition:"Finalissima",
      played:false,
      participated:false,
      brazil:null,
      other:null,
      tournamentType:"FINALISSIMA",
      tournamentYear:tournament.year,
      tournamentMatchId:match.id,
      tournamentPhase:"final"
    };

    n.schedule.push(
      fixture
    );

    n.schedule.sort(
      (a,b)=>a.day-b.day
    );

    return fixture;
  }

  function ensureSchedule(s, n) {
    if (!Array.isArray(n.schedule)) n.schedule = [];
    const yearStart = Math.floor(s.day / 365) * 365;
    for (let seasonOffset = 0; seasonOffset <= 1; seasonOffset++) for (let index = 0; index < windows.length; index++) {
      const windowDay = yearStart + seasonOffset * 365 + windows[index];
      windowOpponents[index].forEach((opponent, matchIndex) => {
        const day = windowDay + matchIndex * 3, id = `${day}:${opponent}`;
        if (!n.schedule.some((match) => match.id === id)) n.schedule.push({ id, day, windowDay, opponent, competition: competition(s, day), played: false, participated: false, brazil: null, other: null });
      });
    }
    ensureWorldCupGroupSchedule(s,n);
    ensureCopaAmericaGroupSchedule(s,n);
    ensureFinalissimaSchedule(s,n);

    n.schedule = n.schedule
      .filter(
        match=>
          match.day>=s.day-370 &&
          match.day<=s.day+730
      )
      .sort((a,b)=>a.day-b.day);
  }
  function nextWindowDay(s) {
    const yearStart = Math.floor(s.day / 365) * 365, day = s.day % 365;
    return yearStart + (windows.find((value) => value >= day) ?? 365 + windows[0]);
  }
  function init(s) {
    if (!s.nationalTeam || typeof s.nationalTeam !== "object") s.nationalTeam = defaults();
    const fallback = defaults();
    for (const [key, value] of Object.entries(fallback)) if (s.nationalTeam[key] === undefined) s.nationalTeam[key] = value;
    if (!Array.isArray(s.nationalTeam.matches)) s.nationalTeam.matches = [];
    if (!Array.isArray(s.nationalTeam.history)) s.nationalTeam.history = [];
    s.nationalTeam.matches = s.nationalTeam.matches.slice(0, 100);
    s.nationalTeam.history = s.nationalTeam.history.slice(0, 80);
    // Preserve played history exactly; normalize only future legacy fixtures.
    const yearStart = Math.floor(s.day / 365) * 365;
    for (const match of s.nationalTeam.schedule || []) {
      if (!match.played && match.opponent === "México") match.opponent = "Bolívia";
      // V1 saves did not persist the FIFA-window id on older future fixtures.
      if (!Number.isFinite(match.windowDay) && Number.isFinite(match.day)) {
        const matchYearStart = Math.floor(match.day / 365) * 365;
        const relative = match.day - matchYearStart;
        const base = windows.find(value => relative >= value && relative <= value + 4);
        if (base !== undefined) match.windowDay = matchYearStart + base;
      }
    }
    // Repair the legacy minutes counter without rewriting any match result.
    const recordedMinutes = s.nationalTeam.matches.reduce((sum, match) => sum + Math.max(0, Number(match.minutes) || 0), 0);
    s.nationalTeam.minutes = Math.max(Number(s.nationalTeam.minutes) || 0, recordedMinutes);
    ensureSchedule(s, s.nationalTeam);
    progressWorldCupBackground(s,s.nationalTeam);
    ensureWorldCupOfficialSquads(s,s.nationalTeam,root.ProLife||null,null);
    protectClubCalendar(s);
    s.nationalTeam.nextWindow = s.nationalTeam.schedule.find((match) => !match.played && match.day >= s.day)?.day ?? nextWindowDay(s);
    return s.nationalTeam;
  }
  function score(s, api) {
    const e = s.career?.playerCareer || s.playerCareer || {};
    const avg = e.played ? e.ratingTotal / e.played : 6.5;
    return api.overall(s.person) * 0.58 + s.reputation * 0.18 + avg * 2.1 + (s.person.morale || 50) * 0.05 + (e.squadRole === "Estrela" ? 5 : e.squadRole === "Importante" ? 3 : 0) + (root.ProLifeIdentity?.tacticalFit?.(s) || 0);
  }
  function threshold(s) { return s.person.age <= 21 ? 65 : 70; }
  function role(s, api) {
    const comp=positionCompetition(s,api), hero=comp.find(x=>x.id==="hero"), rank=hero?.rank||99;
    const value = rank<=2 ? "Titular" : rank<=4 ? "Rotação" : "Reserva";
    const n=s.nationalTeam;
    if(n?.calledUp){
      n.status=value;
      const decision=n.currentCallupWindow!=null ? n.callupDecisions?.[String(n.currentCallupWindow)] : null;
      if(decision?.calledUp) decision.status=value;
    }
    return value;
  }
  function competition(s, day) {
    const n=((day%365)+365)%365;
    const year=2026+Math.floor(day/365);

    if(
      isWorldCupYear(year) &&
      n>=161 &&
      n<=199
    )
      return "Copa Mundial";

    return "Eliminatórias";
  }
  function normalizedNationality(s){ const raw=String(s.person?.nationality||"Brasil").toLowerCase(); return raw==="brazil"?"Brasil":s.person?.nationality||"Brasil"; }
  function candidateScore(p, overall){
    const ov = Number(overall ?? p.ovr ?? p.overall ?? 70);
    const condition = Number(p.condition ?? 100);
    const morale = Number(p.morale ?? 50);
    const appearances = Number(p.appearances ?? p.games ?? 0);
    const availability = p.injury || Number(p.suspension || 0) > 0 || condition < 25 ? -999 : 0;
    return ov * .78 + condition * .06 + morale * .035 + Math.min(3, appearances * .04) - Math.max(0,(Number(p.age)||25)-32)*.35 + availability;
  }
  function internationalPool(s){
    const pool =
      root.ProLifeInternationalPool ||
      (typeof require==="function"
        ? require("./international-pool.js")
        : null);

    return pool?.init
      ? pool.init(s)
      : Array.isArray(s.internationalPlayers)
        ? s.internationalPlayers
        : [];
  }

  function globalFootballApi(){
    return root.ProLifeGlobalFootball||(typeof require==="function"?require("./global-football.js"):null);
  }
  function globalNationalPlayers(s){
    const globalFootball=globalFootballApi();
    return globalFootball?.activePlayers?globalFootball.activePlayers(s).filter(player=>player.id!=="hero"):[];
  }
  function globalPlayerClub(s,player){
    const club=globalFootballApi()?.clubById?.(s,player?.clubId);
    return club?.name||player?.externalClub||player?.club||"Exterior";
  }

  function buildSquad(s,api){
    const nationality=normalizedNationality(s);
    if(nationality!=="Brasil") return [];

    const candidates=[];
    const seenIds=new Set();
    const seenNames=new Set();

    function addCandidate(p,clubName){
      if(!p || p.id==="hero") return;

      const playerNationality=String(p.nationality||"Brasil").toLowerCase();

      if(!["brasil","brazil"].includes(playerNationality))
        return;

      const normalizedName=String(p.name||"")
        .trim()
        .toLowerCase();

      if(
        seenIds.has(p.id) ||
        (normalizedName && seenNames.has(normalizedName))
      )
        return;

      const overall=api.overall
        ? api.overall(p)
        : Number(p.ovr||p.overall||70);

      candidates.push({
        id:p.id,
        name:p.name,
        pos:p.pos,
        club:clubName||p.externalClub||"Exterior",
        age:p.age||25,
        overall,
        score:candidateScore(p,overall),
        external:Boolean(p.external),
        marketStatus:p.marketStatus||null
      });

      if(p.id) seenIds.add(p.id);
      if(normalizedName) seenNames.add(normalizedName);
    }

    for(const p of globalNationalPlayers(s))
      addCandidate(p,globalPlayerClub(s,p));

    for(const p of internationalPool(s))
      addCandidate(p,p.externalClub||"Exterior");

    for(const c of s.clubs||[])
      for(const p of c.roster||[])
        addCandidate(p,c.name);

    const hero={
      id:"hero",
      name:s.person.name,
      pos:s.person.pos,
      club:(s.clubs||[]).find(c=>c.id===s.clubId)?.name||"Sem clube",
      age:s.person.age,
      overall:api.overall(s.person),
      score:score(s,api)
    };

    candidates.push(hero);

    const limits={GOL:3,DEF:8,MEI:8,ATA:7};
    const out=[];

    for(const pos of Object.keys(limits))
      out.push(
        ...candidates
          .filter(x=>x.pos===pos)
          .sort((a,b)=>
            b.score-a.score ||
            b.overall-a.overall ||
            a.id.localeCompare(b.id)
          )
          .slice(0,limits[pos])
      );

    return out;
  }

  function worldCupLineup(squad){
    const sorted=(squad||[]).slice().sort((a,b)=>Number(b.score??b.overall??0)-Number(a.score??a.overall??0)||String(a.id).localeCompare(String(b.id)));
    const starters=[...sorted.filter(x=>x.pos==="GOL").slice(0,1),...sorted.filter(x=>x.pos==="DEF").slice(0,4),...sorted.filter(x=>x.pos==="MEI").slice(0,3),...sorted.filter(x=>x.pos==="ATA").slice(0,3)];
    const ids=new Set(starters.map(x=>x.id));
    for(const player of sorted) if(starters.length<11&&!ids.has(player.id)){starters.push(player);ids.add(player.id);}
    return {formation:"4-3-3",starters,bench:sorted.filter(x=>!ids.has(x.id)).slice(0,15)};
  }

  const worldCupNameRegions={
    brazil:{first:["Caio","Davi","Gabriel","Gustavo","Joao","Lucas","Matheus","Pedro"],last:["Almeida","Barbosa","Costa","Ferreira","Lima","Oliveira","Ribeiro","Santos"],clubs:["Belo Horizonte EC","Curitiba Athletic","Porto Alegre FC","Recife Nacional","Rio Metropolitano","Santos Litoral","Sao Paulo União"]},
    french:{first:["Adrien","Bastien","Enzo","Hugo","Ilyes","Lucas","Mathis","Theo"],last:["Bernard","Diallo","Dubois","Fofana","Laurent","Lefevre","Moreau","Traore"],clubs:["Bordeaux Girondins","Lille Métropole","Lyon Olympique","Marseille Athletic","Monaco Sporting","Paris Étoile","Rennes Union"]},
    hispanic:{first:["Alejandro","Diego","Emiliano","Facundo","Javier","Mateo","Nicolas","Santiago"],last:["Acosta","Benitez","Fernandez","Garcia","Gimenez","Martinez","Navarro","Romero"],clubs:["Capital Deportivo","Cordillera FC","Puerto Athletic","Real Central","Racing del Norte","Sporting Nacional","Union del Sur"]},
    latin:{first:["Andrea","Diogo","Lorenzo","Marco","Miguel","Nuno","Rafael","Tiago"],last:["Almeida","Bianchi","Cardoso","Conti","Moretti","Pereira","Ricci","Silva"],clubs:["Academia Calcio","Atletico Riviera","Lisboa Sporting","Lusitania FC","Milano Calcio","Porto Clube","Torino Athletic"]},
    germanic:{first:["Alexander","Emil","Felix","Florian","Jonas","Lars","Noah","Oliver"],last:["Bauer","Becker","Hoffmann","Jansen","Keller","Muller","Schmidt","Wagner"],clubs:["Berlin 04","Danube Athletic","Nordstadt FC","Rheinland 05","Royal Flanders","Rotterdam Sport","Zurich United"]},
    british:{first:["Callum","Ethan","Harry","Jack","James","Liam","Oliver","Ryan"],last:["Campbell","Davies","Evans","Foster","Hughes","Morgan","Taylor","Wilson"],clubs:["Birmingham Athletic","Edinburgh City","London Borough","Manchester Union","Northcastle FC","Seaside Rovers","Yorkshire Town"]},
    eastern:{first:["Aleksandar","Ivan","Jakub","Luka","Marek","Milan","Nikola","Tomas"],last:["Horvat","Kovac","Markovic","Novak","Petrovic","Popovic","Stojanovic","Vukovic"],clubs:["Adriatic Split","Balkan United","Bohemia Praha","Danube Bratislava","Sarajevo Athletic","Slavia Central","Zagreb 1912"]},
    westAfrica:{first:["Abdoulaye","Amadou","Emmanuel","Ibrahim","Issa","Kofi","Mamadou","Samuel"],last:["Ba","Diop","Kamara","Mensah","Ndiaye","Owusu","Sarr","Toure"],clubs:["Abidjan Athletic","Accra Stars","Dakar Olympique","Island Sporting","Kinshasa Union","Lagos Continental","Sahel FC"]},
    northAfrica:{first:["Adel","Amine","Hassan","Karim","Mehdi","Omar","Rayan","Youssef"],last:["Amrani","Bennani","Haddad","Mansouri","Rahmani","Saidi","Trabelsi","Ziani"],clubs:["Atlas Marrakesh","Cairo National","Casablanca Union","Oran Sporting","Rabat Athletic","Tunis Olympique","Zamalek City"]},
    asia:{first:["Haruto","Hiroki","Jihoon","Kaito","Minjun","Ren","Takumi","Yuto"],last:["Hayashi","Ito","Kim","Lee","Nakamura","Sato","Suzuki","Tanaka"],clubs:["Busan Athletic","Kansai United","Osaka Sakura","Seoul Metropolitan","Tokyo Phoenix","Ulsan Sporting","Yokohama Harbour"]},
    middleEast:{first:["Ali","Fahad","Hamza","Hussein","Khalid","Omar","Sami","Yasin"],last:["Abbas","Al-Hassan","Farouk","Hakimi","Kareem","Nasser","Rahman","Saleh"],clubs:["Amman Union","Ankara Sporting","Baghdad Athletic","Doha Stars","Jeddah National","Riyadh Crescent","Tehran United"]},
    northAmerica:{first:["Adrian","Daniel","Ethan","Julian","Kevin","Luis","Marcus","Noah"],last:["Brown","Campbell","Johnson","Lewis","Lopez","Martinez","Robinson","Williams"],clubs:["Atlantic City FC","California Athletic","Caribbean Stars","Great Lakes United","Mexico Capital","Pacific Rovers","Toronto Sporting"]},
    oceania:{first:["Aiden","Callum","Cooper","Jack","Lachlan","Noah","Oliver","William"],last:["Clarke","Harris","Martin","Mitchell","Smith","Taylor","Walker","Wilson"],clubs:["Auckland Harbour","Brisbane Athletic","Melbourne Cityside","Pacific United","Sydney Coast","Tasman Rovers","Wellington Sporting"]}
  };
  const worldCupRegionIds={
    brazil:["BRA"],french:["FRA"],latin:["ITA","POR"],british:["ENG","SCO"],
    hispanic:["ARG","CHI","COL","CRC","ECU","ESP","GUA","HON","MEX","PAN","PAR","URU"],
    germanic:["AUT","BEL","CAN","DEN","GER","NED","NOR","SUI","SWE"],
    eastern:["BIH","CRO","CZE","HUN","POL","SRB","UKR","UZB"],westAfrica:["BFA","CIV","CMR","COD","CPV","GHA","NGA","SEN"],
    northAfrica:["ALG","EGY","MAR","RSA","TUN"],asia:["JPN","KOR"],
    middleEast:["IRN","IRQ","JOR","KSA","QAT","TUR"],
    northAmerica:["CUW","HAI","USA"],oceania:["AUS","NZL"]
  };
  function worldCupHash(value){let h=2166136261;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function worldCupUnit(value){return worldCupHash(value)/4294967296;}
  function worldCupRegion(teamId){for(const [region,ids] of Object.entries(worldCupRegionIds))if(ids.includes(teamId))return worldCupNameRegions[region];return worldCupNameRegions.hispanic;}
  function worldCupNormalize(value){return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
  function worldCupTeamNames(team){const names=new Set([worldCupNormalize(team.id),worldCupNormalize(team.name)]);if(team.id==="BRA")for(const value of ["brasil","brazil"])names.add(value);return names;}
  function worldCupPlayerSnapshot(player,clubName,tournament,api){
    if(player.generatedInternational&&Number.isFinite(player.birthYear))player.age=Math.max(16,Number(tournament.year)-Number(player.birthYear));
    const overall=player.generatedInternational?Number(player.overall||player.ovr||70):(api.overall?api.overall(player):Number(player.overall||player.ovr||70));
    return {id:player.id,name:player.name,pos:player.pos,club:clubName||player.externalClub||player.club||"Exterior",age:Number(player.age||25),overall,score:candidateScore(player,overall),condition:Number(player.condition??100),morale:Number(player.morale??50),source:player.generatedInternational?"generated-persistent":"career"};
  }
  function worldCupAvailablePlayers(s,tournament,team,api){
    const teamNames=worldCupTeamNames(team),all=[];
    for(const player of globalNationalPlayers(s))all.push({player,club:null,resolveGlobalClub:true});
    for(const club of s.clubs||[])for(const player of club.roster||[])all.push({player,club:club.name});
    for(const player of internationalPool(s))all.push({player,club:player.externalClub||player.club||"Exterior"});
    if(team.id==="BRA")all.push({player:{...s.person,id:"hero",nationality:"Brasil"},club:(s.clubs||[]).find(c=>c.id===s.clubId)?.name||"Sem clube"});
    const seen=new Set();
    return all.filter(({player})=>{
      if(!player?.id||seen.has(player.id)||!teamNames.has(worldCupNormalize(player.nationality||(team.id==="BRA"?"Brasil":""))))return false;
      seen.add(player.id);return true;
    }).map(({player,club,resolveGlobalClub})=>worldCupPlayerSnapshot(player,resolveGlobalClub?globalPlayerClub(s,player):club,tournament,api)).filter(player=>player.age<=40);
  }
  function generatedWorldCupOverall(team,pos,slot,age,key,targetOverall){
    if(targetOverall!==null&&targetOverall!==undefined&&Number.isFinite(Number(targetOverall)))return Math.max(55,Math.min(94,Math.round(Number(targetOverall)+(worldCupUnit(`${key}|migration`)-.5)*2)));
    const offsets={GOL:[-2,-7,-11],DEF:[0,-2,-4,-5,-7,-8,-10,-12],MEI:[1,-1,-3,-5,-6,-8,-10,-12],ATA:[1,-1,-3,-5,-7,-9,-11]}[pos]||[-5];
    const ageEffect=age<=22?1:age>=34?-2:age>=31?-1:0,posEffect=pos==="GOL"?0:pos==="ATA"?1:0,jitter=Math.floor(worldCupUnit(`${key}|overall`)*3)-1;
    return Math.max(55,Math.min(94,Math.round(Number(team.reputation||70)+(offsets[slot%offsets.length]??-8)+ageEffect+posEffect+jitter)));
  }
  const worldCupPoolIndexes=new WeakMap();
  function worldCupPoolIndex(pool){
    let index=worldCupPoolIndexes.get(pool);
    if(!index||index.size!==pool.length||index.last!==pool[pool.length-1]){
      index={size:pool.length,last:pool[pool.length-1],names:new Set(),ids:new Set()};
      for(const p of pool){index.names.add(worldCupNormalize(p?.name));if(p?.id)index.ids.add(p.id);}
      worldCupPoolIndexes.set(pool,index);
    }
    return index;
  }
  function worldCupPoolIndexAdd(index,pool,player){index.names.add(worldCupNormalize(player.name));if(player.id)index.ids.add(player.id);index.size=pool.length;index.last=pool[pool.length-1];}
  function createPersistentWorldCupPlayer(s,tournament,team,pos,slot,targetOverall=null){
    const pool=Array.isArray(s.internationalPlayers)?s.internationalPlayers:internationalPool(s),region=worldCupRegion(team.id),poolIndex=worldCupPoolIndex(pool),usedNames=poolIndex.names;
    const key=`${team.id}|${tournament.year}|${pos}|${slot}`,base=worldCupHash(key);
    let name="";
    for(let attempt=0;attempt<region.first.length*region.last.length;attempt++){
      const first=region.first[(base+attempt)%region.first.length],last=region.last[(Math.floor(base/region.first.length)+Math.floor(attempt/region.first.length))%region.last.length];
      const candidate=`${first} ${last}`;if(!usedNames.has(worldCupNormalize(candidate))){name=candidate;break;}
    }
    if(!name){
      for(let attempt=0;attempt<region.first.length*region.last.length*region.last.length;attempt++){
        const first=region.first[(base+attempt)%region.first.length],lastA=region.last[(Math.floor(base/7)+attempt)%region.last.length],lastB=region.last[(Math.floor(base/13)+Math.floor(attempt/region.last.length))%region.last.length];
        const candidate=`${first} ${lastA} ${lastB}`;if(!usedNames.has(worldCupNormalize(candidate))){name=candidate;break;}
      }
    }
    const id=`intlgen_${team.id.toLowerCase()}_${worldCupHash(`${key}|${name}`).toString(36)}`;
    const existing=poolIndex.ids.has(id)?pool.find(player=>player.id===id):null;if(existing)return existing;
    const age=19+Math.floor(worldCupUnit(`${key}|age`)*16),overall=generatedWorldCupOverall(team,pos,slot,age,key,targetOverall),club=region.clubs[Math.floor(worldCupUnit(`${key}|club`)*region.clubs.length)];
    const potential=Math.max(overall,Math.min(96,overall+(age<=21?5:age<=24?3:age<=27?2:1)));
    const player={id,name,age,birthYear:Number(tournament.year)-age,pos,nationality:team.name,ovr:overall,overall,potential,external:true,externalClub:club,club,marketStatus:"external",generatedInternational:true,generatedYear:Number(tournament.year),condition:100,morale:50+Math.floor(worldCupUnit(`${key}|morale`)*21),injury:0,suspension:0,discipline:70,appearances:0,goals:0,minutes:0,attrs:{pace:overall,finish:overall,pass:overall,defense:overall,strength:overall,stamina:overall}};
    pool.push(player);worldCupPoolIndexAdd(poolIndex,pool,player);globalFootballApi()?.registerPlayer?.(s,player);return player;
  }
  function legacyWorldCupPlaceholder(player,team){return !!player&&(player.club==="Universo internacional"||String(player.id||"").startsWith("wc_")||new RegExp(`^${String(team.name).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")} (GOL|DEF|MEI|ATA) \\d+$`,"i").test(String(player.name||"")));}

  function worldCupDynamicSquad(s,tournament,team,api){
    const limits={GOL:3,DEF:8,MEI:8,ATA:7},available=worldCupAvailablePlayers(s,tournament,team,api);
    const squad=[];
    for(const [pos,count] of Object.entries(limits)){
      const byMerit=(a,b)=>b.score-a.score||b.overall-a.overall||String(a.id).localeCompare(String(b.id));
      // Jogadores reais sempre ocupam as vagas antes dos gerados.
      const real=available.filter(x=>x.pos===pos&&x.source!=="generated-persistent").sort(byMerit);
      const generated=available.filter(x=>x.pos===pos&&x.source==="generated-persistent").sort(byMerit);
      const selected=real.slice(0,count);
      if(selected.length<count)selected.push(...generated.slice(0,count-selected.length));
      squad.push(...selected);
      for(let i=selected.length;i<count;i++){
        const player=createPersistentWorldCupPlayer(s,tournament,team,pos,i),snapshot=worldCupPlayerSnapshot(player,player.externalClub,tournament,api);
        squad.push(snapshot);
      }
    }
    return squad;
  }

  function migrateWorldCupPlaceholders(s,tournament,api){
    if(Number(tournament.year)<=2026||!Array.isArray(tournament.squads))return false;
    let changed=false;
    for(const entry of tournament.squads){
      const team=(tournament.participants||[]).find(x=>x.id===entry.id)||entry;
      if(!Array.isArray(entry.squad)||!entry.squad.some(player=>legacyWorldCupPlaceholder(player,team)))continue;
      const keptIds=new Set(entry.squad.filter(player=>!legacyWorldCupPlaceholder(player,team)).map(player=>player.id));
      const available=worldCupAvailablePlayers(s,tournament,team,api).filter(player=>!keptIds.has(player.id));
      const positionSlots={GOL:0,DEF:0,MEI:0,ATA:0};
      entry.squad=entry.squad.map((old,index)=>{
        const pos=old.pos||"MEI";if(!legacyWorldCupPlaceholder(old,team)){positionSlots[pos]=(positionSlots[pos]||0)+1;return old;}
        const target=Number(old.overall||old.ovr||team.reputation||70);
        const existing=available.filter(player=>player.pos===pos&&!keptIds.has(player.id)).sort((a,b)=>Math.abs(a.overall-target)-Math.abs(b.overall-target)||b.score-a.score)[0];
        const player=existing||worldCupPlayerSnapshot(createPersistentWorldCupPlayer(s,tournament,team,pos,positionSlots[pos]||index,target),null,tournament,api);
        keptIds.add(player.id);positionSlots[pos]=(positionSlots[pos]||0)+1;changed=true;return player;
      });
      entry.lineup=worldCupLineup(entry.squad);
    }
    if(changed)tournament.squadMigrationVersion=2;
    return changed;
  }

  function worldCupPlayedAnyMatch(tournament){
    return [
      ...(tournament.groups||[]).flatMap(group=>group.matches||[]),
      ...(tournament.knockout||[])
    ].some(match=>match?.played);
  }

  function migrateGeneratedWorldCupPlayers(s,tournament,api){
    if(
      Number(tournament?.year)<=2026 ||
      !Array.isArray(tournament?.squads)
    ) return false;

    const revision=
      Number(globalFootballApi()?.packInfo?.().length||0);

    const cupAlreadyStarted=
      worldCupPlayedAnyMatch(tournament);

    const hasLegacyGeneratedSquad=
      (tournament.squads||[]).some(
        entry=>
          Array.isArray(entry?.squad) &&
          entry.squad.some(
            player=>
              player?.source==="generated-persistent"
          )
      );

    const migrationVersion=
      Number(tournament.realUniverseMigrationVersion||0);

    const needsLegacyMigration=
      hasLegacyGeneratedSquad &&
      migrationVersion<4;

    // Se o universo nao mudou e nao existe legado ficticio pendente,
    // nao ha nada para fazer.
    if(
      Number(tournament.realUniversePackRevision||0)>=revision &&
      !needsLegacyMigration
    ) return false;

    // Depois que a Copa comecou, o elenco fica congelado.
    // A unica excecao e um save legado ainda contendo jogadores
    // generated-persistent de antes da integracao do universo real.
    const legacyOngoingMigration=
      cupAlreadyStarted &&
      needsLegacyMigration;

    if(
      cupAlreadyStarted &&
      !legacyOngoingMigration
    ){
      tournament.realUniversePackRevision=revision;
      return false;
    }

    let changed=false;

    for(const entry of tournament.squads){
      const team=
        (tournament.participants||[]).find(
          item=>item.id===entry.id
        )||entry;

      if(!Array.isArray(entry.squad))continue;

      const generatedIndexes=
        entry.squad
          .map((player,index)=>
            player?.source==="generated-persistent"
              ? index
              : -1
          )
          .filter(index=>index>=0);

      if(!generatedIndexes.length)continue;

      const keptIds=new Set(
        entry.squad
          .filter(
            player=>
              player?.source!=="generated-persistent"
          )
          .map(player=>player.id)
      );

      const available=
        worldCupAvailablePlayers(
          s,
          tournament,
          team,
          api
        )
        .filter(
          player=>
            player.source!=="generated-persistent" &&
            !keptIds.has(player.id)
        )
        .sort(
          (a,b)=>
            b.score-a.score ||
            b.overall-a.overall ||
            String(a.id).localeCompare(String(b.id))
        );

      for(const index of generatedIndexes){
        const old=entry.squad[index];
        const candidateIndex=
          available.findIndex(
            player=>
              player.pos===old.pos &&
              !keptIds.has(player.id)
          );

        if(candidateIndex<0)continue;

        const replacement=
          available.splice(candidateIndex,1)[0];

        entry.squad[index]=replacement;
        keptIds.add(replacement.id);
        changed=true;
      }

      if(changed)
        entry.lineup=worldCupLineup(entry.squad);
    }

    tournament.realUniversePackRevision=revision;

    if(
      legacyOngoingMigration ||
      !worldCupPlayedAnyMatch(tournament)
    ){
      tournament.realUniverseMigrationVersion=4;
    }

    return changed;
  }

  function ensureWorldCupOfficialSquads(s,n,api,log){
    const tournament=ensureWorldCup(s,n);
    if(!tournament||s.day<(Number(tournament.year)-2026)*365+154) return tournament;
    const safeApi=api&&typeof api.overall==="function"?api:{overall:p=>Number(p?.overall||p?.ovr||70)};
    if(!Array.isArray(tournament.squads)||tournament.squads.length!==48){
      tournament.squads=(tournament.participants||[]).map(team=>{
        const squad=worldCupDynamicSquad(s,tournament,team,safeApi);
        return {id:team.id,name:team.name,reputation:team.reputation,squad,lineup:worldCupLineup(squad)};
      });
      tournament.squadsFrozenDay=s.day;
    }
    migrateWorldCupPlaceholders(s,tournament,safeApi);
    migrateGeneratedWorldCupPlayers(s,tournament,safeApi);
    const brazil=tournament.squads.find(x=>x.id==="BRA"),selected=!!brazil?.squad?.some(x=>x.id==="hero");
    if(!tournament.brazilCallup){
      const posRank=(brazil?.squad||[]).filter(x=>x.pos===s.person.pos).sort((a,b)=>Number(b.score||0)-Number(a.score||0)).findIndex(x=>x.id==="hero")+1;
      const status=selected?(posRank>0&&posRank<=2?"Titular":posRank<=4?"Rotação":"Reserva"):"Não convocado";
      tournament.brazilCallup={day:s.day,windowDay:(Number(tournament.year)-2026)*365+161,calledUp:selected,status,squadIds:(brazil?.squad||[]).map(x=>x.id)};
      if(selected){n.callups=(n.callups||0)+1;n.firstCallupDay??=s.day;n.lastCallupDay=s.day;n.history.unshift({day:s.day,type:"callup",status,competition:"Copa Mundial",year:tournament.year});n.history=n.history.slice(0,80);log?.(s,"Convocação para a Copa Mundial",`${s.person.name} está entre os 26 jogadores do Brasil.`);}
    }
    if(s.day>(Number(tournament.year)-2026)*365+199||tournament.status==="COMPLETED") return tournament;
    const active=!tournament.brazilEliminationPhase&&tournament.status!=="COMPLETED";
    n.squad=(brazil?.squad||[]).map(x=>({...x}));
    n.competition="Copa Mundial";
    n.currentCallupWindow=tournament.brazilCallup.windowDay;
    n.callupDecisions[String(tournament.brazilCallup.windowDay)]={...tournament.brazilCallup};
    n.calledUp=active&&tournament.brazilCallup.calledUp;
    n.status=n.calledUp?tournament.brazilCallup.status:"Não convocado";
    n.radarStatus=n.calledUp?"CONVOCADO":n.radarStatus;
    return tournament;
  }

  function activeWorldCupSquad(s,n){
    const year=worldCupYearFromDay(s.day),tournament=(n.tournaments||[]).find(t=>t?.type==="WORLD_CUP"&&Number(t.year)===year);
    if(!tournament||tournament.status==="COMPLETED"||tournament.brazilEliminationPhase||s.day>(year-2026)*365+199) return null;
    return tournament.squads?.find(x=>x.id==="BRA")?.squad||null;
  }

  function hydrateWorldCupSquad(s,squad,api){
    const current=new Map();
    for(const club of s.clubs||[]) for(const player of club.roster||[]) current.set(player.id,player);
    for(const player of internationalPool(s)) if(!current.has(player.id)) current.set(player.id,player);
    current.set("hero",s.person);
    return (squad||[]).map(snapshot=>{
      const player=current.get(snapshot.id);if(!player)return {...snapshot};
      const overall=api.overall?api.overall(player):Number(player.overall||player.ovr||snapshot.overall||70);
      return {...snapshot,overall,condition:Number(player.condition??snapshot.condition??100),morale:Number(player.morale??snapshot.morale??50),score:candidateScore(player,overall)};
    });
  }
  function positionCompetition(s,api){
    const frozen=activeWorldCupSquad(s,s.nationalTeam||{}),stored=frozen||(s.nationalTeam?.calledUp&&s.nationalTeam?.squad?.length?s.nationalTeam.squad:null);
    let squad=frozen?hydrateWorldCupSquad(s,frozen,api):(stored||buildSquad(s,api));
    if(stored){
      const players=new Map();

      for(const club of s.clubs||[])
        for(const p of club.roster||[])
          players.set(p.id,{p,club:club.name});

      for(const p of internationalPool(s))
        if(!players.has(p.id))
          players.set(
            p.id,
            {
              p,
              club:p.externalClub||"Exterior"
            }
          );

      squad=stored.map(x=>{
        if(x.id==="hero")
          return {
            ...x,
            overall:api.overall(s.person),
            score:score(s,api)
          };

        const found=players.get(x.id);

        if(!found)
          return {...x,unavailable:true};

        const overall=api.overall
          ? api.overall(found.p)
          : (found.p.ovr||x.overall||70);
        return {...x,club:found.club,age:found.p.age||x.age,overall,score:candidateScore(found.p,overall)};
      });
      squad=squad.filter(x=>!x.unavailable);
      if(!frozen)s.nationalTeam.squad=squad;
    }
    const pos=s.person.pos; return squad.filter(x=>x.pos===pos).sort((a,b)=>b.score-a.score||b.overall-a.overall||a.id.localeCompare(b.id)).map((x,i)=>({...x,rank:i+1}));
  }
  function matchLineup(s,api){
    const n=init(s);

    const frozen=activeWorldCupSquad(s,n);
    const squad=frozen
      ? hydrateWorldCupSquad(s,frozen,api)
      : n.calledUp && Array.isArray(n.squad) && n.squad.length
      ? n.squad.slice()
      : buildSquad(s,api);

    const scoreOf=(p)=>
      Number.isFinite(Number(p.score))
        ? Number(p.score)
        : candidateScore(p,p.overall);

    const sorted=squad
      .slice()
      .sort((a,b)=>
        scoreOf(b)-scoreOf(a) ||
        Number(b.overall||0)-Number(a.overall||0) ||
        String(a.id).localeCompare(String(b.id))
      );

    const take=(pos,count)=>
      sorted.filter(p=>p.pos===pos).slice(0,count);

    let starters=[
      ...take("GOL",1),
      ...take("DEF",4),
      ...take("MEI",3),
      ...take("ATA",3)
    ];

    const used=new Set(starters.map(p=>p.id));

    if(starters.length<11){
      for(const p of sorted){
        if(starters.length>=11) break;

        if(!used.has(p.id)){
          starters.push(p);
          used.add(p.id);
        }
      }
    }

    const hero=squad.find(p=>p.id==="hero");
    const status=n.calledUp ? role(s,api) : n.status;

    if(hero && n.calledUp){

      if(status==="Titular" && !starters.some(p=>p.id==="hero")){
        const samePosition=starters
          .filter(p=>p.pos===hero.pos && p.id!=="hero")
          .sort((a,b)=>scoreOf(a)-scoreOf(b))[0];

        if(samePosition){
          starters=starters.filter(p=>p.id!==samePosition.id);
          starters.push(hero);
        }else{
          starters=starters.slice(0,10);
          starters.push(hero);
        }
      }

      if(status!=="Titular"){
        starters=starters.filter(p=>p.id!=="hero");

        for(const p of sorted){
          if(starters.length>=11) break;

          if(
            p.id!=="hero" &&
            !starters.some(x=>x.id===p.id)
          ){
            starters.push(p);
          }
        }
      }
    }

    const starterIds=new Set(starters.map(p=>p.id));

    let bench=sorted
      .filter(p=>!starterIds.has(p.id))
      .slice(0,15);

    if(hero && n.calledUp && status!=="Titular"){
      bench=bench.filter(p=>p.id!=="hero");

      if(status==="Rota\u00e7\u00e3o" || status==="Reserva"){
        bench.unshift(hero);
      }

      bench=bench.slice(0,15);
    }

    return {
      formation:"4-3-3",
      starters,
      bench,
      status,
      calledUp:!!n.calledUp,
      heroInSquad:!!hero
    };
  }

  function windowDecision(n, windowDay){ return n.callupDecisions?.[String(windowDay)] || null; }
  function fixtureCallupStatus(n, match){
    const d=windowDecision(n,match.windowDay);
    if(!d) return "Convocação ainda não definida";
    return d.calledUp ? "Convocado" : "Não convocado";
  }
  function onDuty(s){ const n=s.nationalTeam; if(!n?.calledUp) return false; const next=(n.schedule||[]).find(m=>!m.played&&m.day>=s.day); return !!next && s.day>=next.windowDay-7 && s.day<=next.windowDay+4; }
  function nextWorldCupYear(year){
    if(year<=2026)
      return 2026;

    const delta=
      (year-2026)%4;

    return delta===0
      ? year
      : year+(4-delta);
  }

  function qualifierRoundDays(worldCupYear){
    const startYear=worldCupYear-3;

    const windowsByYear=[
      {
        year:startYear,
        days:[249,254,284,289,319,324]
      },
      {
        year:startYear+1,
        days:[249,254,284,289,319,324]
      },
      {
        year:startYear+2,
        days:[70,75,154,159,251,256]
      }
    ];

    return windowsByYear
      .flatMap(entry=>
        entry.days.map(relative=>({
          year:entry.year,
          relative,
          day:
            (entry.year-2026)*365+
            relative
        }))
      );
  }

  function conmebolTeams(){
    return nations
      .filter(n=>
        [
          "BRA","ARG","URU","COL","CHI",
          "ECU","PAR","PER","BOL","VEN"
        ].includes(n.id)
      )
      .map(team=>({
        id:team.id,
        name:team.name,
        played:0,
        w:0,
        d:0,
        l:0,
        gf:0,
        ga:0,
        gd:0,
        points:0,
        strength:Number(team.reputation||70)
      }));
  }

  function qualifierSchedule(teams,worldCupYear){
    const roundDays=
      qualifierRoundDays(worldCupYear);

    const ids=
      teams.map(t=>t.id);

    if(ids.length!==10)
      throw new Error(
        "CONMEBOL requires exactly 10 teams."
      );

    let rotation=
      ids.slice();

    const firstLeg=[];

    for(let round=0;round<9;round++){

      for(let i=0;i<5;i++){
        let home=
          rotation[i];

        let away=
          rotation[
            rotation.length-1-i
          ];

        if(round%2===1)
          [home,away]=[away,home];

        firstLeg.push({
          id:
            "conmebol:"+
            worldCupYear+
            ":"+
            (round+1)+
            ":"+
            i,

          round:
            round+1,

          day:
            roundDays[round]?.day ??
            null,

          homeId:home,
          awayId:away,

          played:false,
          hg:null,
          ag:null
        });
      }

      rotation=[
        rotation[0],
        rotation[rotation.length-1],
        ...rotation.slice(
          1,
          rotation.length-1
        )
      ];
    }

    const secondLeg=
      firstLeg.map(
        game=>({
          id:
            "conmebol:"+
            worldCupYear+
            ":"+
            (game.round+9)+
            ":"+
            game.id.split(":").pop(),

          round:
            game.round+9,

          day:
            roundDays[
              game.round+8
            ]?.day ??
            null,

          homeId:
            game.awayId,

          awayId:
            game.homeId,

          played:false,
          hg:null,
          ag:null
        })
      );

    return [
      ...firstLeg,
      ...secondLeg
    ];
  }

  function qualifierTableSort(a,b){
    return (
      b.points-a.points ||
      b.gd-a.gd ||
      b.gf-a.gf ||
      b.w-a.w ||
      b.strength-a.strength ||
      a.name.localeCompare(b.name)
    );
  }

  function playQualifierMatch(q,match,rng){
    if(match.played)
      return match;

    const home=q.table.find(
      x=>x.id===match.homeId
    );

    const away=q.table.find(
      x=>x.id===match.awayId
    );

    if(!home || !away)
      return null;

    const random=()=>
      rng && typeof rng.next==="function"
        ? rng.next()
        : Math.random();

    const hg=Math.max(
      0,
      Math.round(
        1.35+
        (home.strength-away.strength)/22+
        (random()-.5)*2.4
      )
    );

    const ag=Math.max(
      0,
      Math.round(
        1.05+
        (away.strength-home.strength)/22+
        (random()-.5)*2.2
      )
    );

    match.played=true;
    match.hg=hg;
    match.ag=ag;

    home.played++;
    away.played++;

    home.gf+=hg;
    home.ga+=ag;

    away.gf+=ag;
    away.ga+=hg;

    home.gd=home.gf-home.ga;
    away.gd=away.gf-away.ga;

    if(hg>ag){
      home.w++;
      away.l++;
      home.points+=3;
    }
    else if(ag>hg){
      away.w++;
      home.l++;
      away.points+=3;
    }
    else{
      home.d++;
      away.d++;
      home.points++;
      away.points++;
    }

    return match;
  }

  function ensureQualifiers(s,n,rng){
    const year=
      2026+
      Math.floor(s.day/365);

    const targetWorldCup=
      nextWorldCupYear(
        year===2026
          ? 2030
          : year
      );

    const existing=n.qualifiers;

    if(
      !existing ||
      existing.version!==2 ||
      Number(existing.worldCupYear)!==
        Number(targetWorldCup)
    ){
      const table=conmebolTeams();

      n.qualifiers={
        version:2,
        confederation:"CONMEBOL",
        worldCupYear:targetWorldCup,
        season:targetWorldCup,
        format:"10 equipes - turno e returno",
        rounds:18,
        directSpots:6,
        playoffSpot:7,
        table,
        fixtures:
          qualifierSchedule(
            table,
            targetWorldCup
          ),
        complete:false,
        qualified:[],
        playoff:null
      };
    }

    const q=n.qualifiers;

    for(const match of q.fixtures){
      if(
        !match.played &&
        Number.isFinite(match.day) &&
        match.day<=s.day
      ){
        playQualifierMatch(
          q,
          match,
          rng
        );
      }
    }

    q.table.sort(
      qualifierTableSort
    );

    q.complete=
      q.fixtures.length===90 &&
      q.fixtures.every(
        m=>m.played
      );

    if(q.complete){
      q.qualified=
        q.table
          .slice(0,6)
          .map(x=>x.id);

      q.playoff=
        q.table[6]?.id||
        null;
    }

    return q;
  }

  function tournamentStatus(s){
    const year=
      2026+
      Math.floor(s.day/365);

    return isWorldCupYear(year)
      ? "Copa Mundial"
      : "Ciclo de Eliminatórias";
  }
  function worldCupPhaseLabel(phase){
    return {
      GROUP_STAGE:"Fase de grupos",
      ROUND_OF_32:"Fase de 32",
      ROUND_OF_16:"Oitavas de final",
      QUARTERFINAL:"Quartas de final",
      SEMIFINAL:"Semifinal",
      THIRD_PLACE:"Disputa de terceiro lugar",
      FINAL:"Final",
      COMPLETED:"Encerrada"
    }[phase]||phase||"";
  }

  function worldCupSummary(s){
    const n=init(s);

    const tournaments=
      (n.tournaments||[])
        .filter(
          t=>t?.type==="WORLD_CUP"
        )
        .sort(
          (a,b)=>Number(b.year)-Number(a.year)
        );

    const tournament=
      tournaments[0]||null;

    if(!tournament)
      return null;

    const WC=worldCupApi();

    const group=
      WC?.brazilGroup
        ? WC.brazilGroup(tournament)
        : null;

    const groupTable=
      group && WC?.standings
        ? WC.standings(
            tournament,
            group.name
          )
        : [];

    const brazilRow=
      groupTable.find(
        x=>x.id==="BRA"
      )||null;

    const knockout=
      Array.isArray(tournament.knockout)
        ? tournament.knockout
        : [];

    const brazilKnockout=
      knockout
        .filter(
          m=>
            m.homeId==="BRA" ||
            m.awayId==="BRA"
        )
        .sort(
          (a,b)=>{
            const order={
              ROUND_OF_32:1,
              ROUND_OF_16:2,
              QUARTERFINAL:3,
              SEMIFINAL:4,
              FINAL:5
            };

            return (
              (order[a.phase]||99)-
              (order[b.phase]||99)
            );
          }
        );

    const nextFixture=
      (n.schedule||[])
        .filter(
          f=>
            f.tournamentType==="WORLD_CUP" &&
            Number(f.tournamentYear)===
              Number(tournament.year) &&
            !f.played
        )
        .sort(
          (a,b)=>a.day-b.day
        )[0]||null;

    const playedFixtures=
      (n.schedule||[])
        .filter(
          f=>
            f.tournamentType==="WORLD_CUP" &&
            Number(f.tournamentYear)===
              Number(tournament.year) &&
            f.played
        )
        .sort(
          (a,b)=>a.day-b.day
        );

    const brazilQualified=
      Array.isArray(tournament.qualified32)
        ? tournament.qualified32.some(
            t=>t.id==="BRA"
          )
        : false;

    const allGroups=
      (tournament.groups||[])
        .map(g=>({
          name:g.name,

          table:
            WC?.standings
              ? WC.standings(
                  tournament,
                  g.name
                )
              : (g.table||[]).slice(),

          matches:
            (g.matches||[]).map(
              m=>({
                id:m.id,
                round:m.round,
                homeId:m.homeId,
                awayId:m.awayId,
                home:m.home,
                away:m.away,
                played:!!m.played,
                homeGoals:m.hg,
                awayGoals:m.ag
              })
            )
        }));

    const phaseOrder={
      ROUND_OF_32:1,
      ROUND_OF_16:2,
      QUARTERFINAL:3,
      SEMIFINAL:4,
      THIRD_PLACE:5,
      FINAL:6
    };

    const allKnockout=
      knockout
        .slice()
        .sort(
          (a,b)=>
            (phaseOrder[a.phase]||99)-
            (phaseOrder[b.phase]||99) ||
            Number(a.index||0)-
            Number(b.index||0)
        )
        .map(
          m=>({
            id:m.id,
            phase:m.phase,
            phaseLabel:
              worldCupPhaseLabel(
                m.phase
              ),
            homeId:m.homeId,
            awayId:m.awayId,
            home:m.home,
            away:m.away,
            played:!!m.played,
            homeGoals:m.hg,
            awayGoals:m.ag,
            winnerId:m.winnerId||null
          })
        );

    const participants=
      (tournament.participants||[])
        .map(team=>{
          const g=
            allGroups.find(
              group=>
                group.table.some(
                  row=>row.id===team.id
                )
            );

          const row=
            g?.table.find(
              x=>x.id===team.id
            )||null;

          return {
            id:team.id,
            name:team.name,
            reputation:
              Number(
                team.reputation||70
              ),
            group:g?.name||null,
            played:row?.played||0,
            w:row?.w||0,
            d:row?.d||0,
            l:row?.l||0,
            gf:row?.gf||0,
            ga:row?.ga||0,
            gd:row?.gd||0,
            points:row?.points||0
          };
        });

    const groupMatches=
      allGroups.flatMap(
        g=>g.matches
      );

    const allMatches=[
      ...groupMatches,
      ...allKnockout
    ];

    const playedMatches=
      allMatches.filter(
        m=>m.played
      );

    const totalGoals=
      playedMatches.reduce(
        (sum,m)=>
          sum+
          Number(
            m.homeGoals||0
          )+
          Number(
            m.awayGoals||0
          ),
        0
      );

    const tournamentStats={
      teams:
        participants.length,

      groups:
        allGroups.length,

      matchesPlayed:
        playedMatches.length,

      totalMatches:
        104,

      goals:
        totalGoals,

      goalsPerMatch:
        playedMatches.length
          ? Number(
              (
                totalGoals/
                playedMatches.length
              ).toFixed(2)
            )
          : 0
    };

    const baseTitles=[
      {id:"BRA",name:"Brasil",titles:5},
      {id:"GER",name:"Alemanha",titles:4},
      {id:"ITA",name:"Italia",titles:4},
      {id:"ARG",name:"Argentina",titles:3},
      {id:"FRA",name:"Franca",titles:2},
      {id:"URU",name:"Uruguai",titles:2},
      {id:"ENG",name:"Inglaterra",titles:1},
      {id:"ESP",name:"Espanha",titles:1}
    ];

    const titleMap=
      new Map(
        baseTitles.map(
          x=>[
            x.id,
            {...x}
          ]
        )
      );

    for(const cup of tournaments){
      if(
        cup.status!=="COMPLETED" ||
        !cup.champion?.id
      )
        continue;

      const id=
        cup.champion.id;

      const current=
        titleMap.get(id)||
        {
          id,
          name:
            cup.champion.name||
            id,
          titles:0
        };

      current.titles++;

      titleMap.set(
        id,
        current
      );
    }

    const titleRanking=
      [...titleMap.values()]
        .sort(
          (a,b)=>
            b.titles-a.titles ||
            a.name.localeCompare(
              b.name
            )
        );

    const lineupApi=
      root.ProLife &&
      typeof root.ProLife.overall==="function"
        ? root.ProLife
        : {
            overall(player){
              if(
                Number.isFinite(
                  Number(player?.overall)
                )
              )
                return Number(
                  player.overall
                );

              if(
                Number.isFinite(
                  Number(player?.ovr)
                )
              )
                return Number(
                  player.ovr
                );

              const attrs=
                player?.attrs||{};

              const values=[
                attrs.pace,
                attrs.finish,
                attrs.pass,
                attrs.defense,
                attrs.strength,
                attrs.stamina
              ]
                .map(Number)
                .filter(Number.isFinite);

              if(!values.length)
                return 70;

              return Math.round(
                values.reduce(
                  (sum,value)=>sum+value,
                  0
                )/
                values.length
              );
            }
          };

    const brazilLineup=
      matchLineup(
        s,
        lineupApi
      );

    const brazilSquad=[
      ...(brazilLineup.starters||[]),
      ...(brazilLineup.bench||[])
    ];

    /*
      Antes da convocacao oficial a tela da Copa
      mostra uma PROJECAO do universo atual.

      O elenco so se torna persistente/congelado
      em ensureWorldCupOfficialSquads(), na data
      oficial da convocacao.
    */
    const projectionApi={
      overall(player){
        const explicit=
          Number(
            player?.overall ??
            player?.ovr
          );

        if(Number.isFinite(explicit))
          return explicit;

        const a=
          player?.attrs||{};

        const weights={
          GOL:{
            pace:.08,
            finish:.03,
            pass:.12,
            defense:.32,
            strength:.20,
            stamina:.25
          },
          DEF:{
            pace:.13,
            finish:.04,
            pass:.12,
            defense:.34,
            strength:.22,
            stamina:.15
          },
          MEI:{
            pace:.14,
            finish:.13,
            pass:.32,
            defense:.10,
            strength:.09,
            stamina:.22
          },
          ATA:{
            pace:.23,
            finish:.32,
            pass:.13,
            defense:.03,
            strength:.12,
            stamina:.17
          }
        }[player?.pos];

        if(!weights)
          return 70;

        const keys=[
          "pace",
          "finish",
          "pass",
          "defense",
          "strength",
          "stamina"
        ];

        return Math.round(
          keys.reduce(
            (sum,key)=>
              sum+
              Number(a[key]||0)*
              weights[key],
            0
          )
        );
      }
    };

    const worldCupSquads=
      Array.isArray(tournament.squads) &&
      tournament.squads.length
        ? tournament.squads.map(
            team=>({
              ...team,
              squad:
                (team.squad||[])
                  .map(
                    player=>({
                      ...player
                    })
                  ),
              lineup:
                team.id==="BRA"
                  ? brazilLineup
                  : (
                      team.lineup ||
                      worldCupLineup(
                        team.squad||[]
                      )
                    )
            })
          )
        : participants.map(
            team=>{
              const squad=
                worldCupDynamicSquad(
                  s,
                  tournament,
                  team,
                  projectionApi
                );

              return {
                ...team,
                projected:true,
                squad,
                lineup:
                  worldCupLineup(
                    squad
                  )
              };
            }
          );

    return {
      worldCupSquads,
      brazilLineup,
      brazilSquad,

      allGroups,
      allKnockout,
      participants,
      tournamentStats,
      titleRanking,

      year:Number(tournament.year),
      name:
        tournament.name||
        "Copa Mundial",

      status:
        tournament.status,

      phase:
        worldCupPhaseLabel(
          tournament.status
        ),

      brazilStatus:
        tournament.brazilStatus||
        (
          tournament.status==="GROUP_STAGE"
            ? "GROUP_STAGE"
            : null
        ),

      eliminationPhase:
        tournament.brazilEliminationPhase||
        null,

      eliminationPhaseLabel:
        tournament.brazilEliminationPhase
          ? worldCupPhaseLabel(
              tournament.brazilEliminationPhase
            )
          : null,

      champion:
        tournament.champion?.name||
        null,

      runnerUp:
        tournament.runnerUp?.name||
        null,

      group:
        group?.name||
        null,

      groupTable,

      brazilRow,

      qualified32:
        tournament.qualified32||
        [],

      brazilQualified,

      brazilKnockout,

      nextFixture:
        nextFixture
          ? {
              id:nextFixture.id,
              day:nextFixture.day,
              opponent:
                nextFixture.opponent,
              phase:
                nextFixture.tournamentPhase,
              phaseLabel:
                worldCupPhaseLabel(
                  nextFixture.tournamentPhase
                )
            }
          : null,

      matchesPlayed:
        playedFixtures.length,

      results:
        playedFixtures.map(
          f=>({
            id:f.id,
            day:f.day,
            opponent:f.opponent,
            phase:
              f.tournamentPhase,
            phaseLabel:
              worldCupPhaseLabel(
                f.tournamentPhase
              ),
            brazil:f.brazil,
            other:f.other,
            participated:
              Boolean(f.participated)
          })
        )
    };
  }

  function radar(s, api) {
    const value = score(s, api), target = threshold(s), unavailable = Boolean(s.person.injury);
    const label=unavailable ? "Indisponível por lesão" : value >= target + 7 ? "PRÉ-LISTA" : value >= target ? "OBSERVADO" : value >= target - 6 ? "OBSERVADO" : "FORA DO RADAR"; return { score: Math.round(value), target, gap: Math.max(0, Math.ceil(target - value)), label };
  }
  function upcoming(s) {
    const n = init(s);
    return n.schedule.filter((match) => !match.played && match.day >= s.day).slice(0, 4).map((match) => ({ ...match, calledUp: windowDecision(n,match.windowDay)?.calledUp ?? null, callupStatus:fixtureCallupStatus(n,match) }));
  }
  function callup(s, api, log) {
    const n = init(s); if (s.mode !== "player") return false;
    const value=score(s,api), target=threshold(s), eligible=normalizedNationality(s)==="Brasil";
    n.nationality=normalizedNationality(s); n.squad=buildSquad(s,api); n.positionCompetition=positionCompetition(s,api); const selected=n.squad.some(x=>x.id==="hero");
    const windowDay=nextWindowDay(s);
    if (!eligible || value < target || s.person.injury || !selected) { const was=n.calledUp; n.calledUp=false; n.currentCallupWindow=windowDay; n.status=s.person.injury?"Cortado por lesão":"Não convocado"; n.radarStatus=radar(s,api).label; n.callupDecisions[String(windowDay)]={day:s.day,windowDay,calledUp:false,status:n.status}; if(was) n.history.unshift({day:s.day,type:"cut",status:n.status,windowDay}); return false; }
    const first=!n.firstCallupDay; n.calledUp=true; n.currentCallupWindow=windowDay; n.callups=(n.callups||0)+1; n.status=role(s,api); n.radarStatus="CONVOCADO"; n.lastCallupDay=s.day; n.firstCallupDay??=s.day; n.competition=competition(s,windowDay); n.shirtNumber ||= ({GOL:1,DEF:4,MEI:8,ATA:9}[s.person.pos]||20); n.callupDecisions[String(windowDay)]={day:s.day,windowDay,calledUp:true,status:n.status};
    n.history.unshift({ day: s.day, type: "callup", status: n.status, competition: n.competition }); n.history = n.history.slice(0, 80);
    log(s, first ? "PRIMEIRA CONVOCAÇÃO" : "Convocação para a Seleção Brasileira", `${s.person.name} foi convocado para ${n.competition}. Situação no grupo: ${n.status}.`); return true;
  }
  function copaAmericaTeam(
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

  function simulateCopaAmericaScore(
    tournament,
    homeId,
    awayId,
    rng,
    knockout=false
  ){
    const home=
      copaAmericaTeam(
        tournament,
        homeId
      );

    const away=
      copaAmericaTeam(
        tournament,
        awayId
      );

    const homeStrength=
      Number(
        home?.reputation||
        72
      );

    const awayStrength=
      Number(
        away?.reputation||
        72
      );

    const homeGoals=
      Math.max(
        0,
        Math.round(
          1.25+
          (homeStrength-awayStrength)/24+
          (rng.next()-.5)*2.2
        )
      );

    const awayGoals=
      Math.max(
        0,
        Math.round(
          1.05+
          (awayStrength-homeStrength)/24+
          (rng.next()-.5)*2.2
        )
      );

    if(
      !knockout ||
      homeGoals!==awayGoals
    ){
      return {
        hg:homeGoals,
        ag:awayGoals,
        hp:null,
        ap:null
      };
    }

    const homeWins=
      (
        homeStrength-awayStrength
      )/100+
      rng.next()>
      .48;

    return {
      hg:homeGoals,
      ag:awayGoals,
      hp:homeWins ? 5 : 4,
      ap:homeWins ? 4 : 5
    };
  }

  function scheduleBrazilCopaAmericaKnockout(
    s,
    n,
    tournament
  ){
    if(
      !tournament ||
      tournament.status==="COMPLETED"
    )
      return null;

    const phaseOrder={
      QUARTERFINAL:188,
      SEMIFINAL:193,
      FINAL:198,
      THIRD_PLACE:198
    };

    const brazilMatch=
      (tournament.knockout||[])
        .find(
          match=>
            !match.played &&
            (
              match.homeId==="BRA" ||
              match.awayId==="BRA"
            )
        );

    if(!brazilMatch)
      return null;

    const id=
      "ca:"+
      tournament.year+
      ":"+
      brazilMatch.id;

    let fixture=
      n.schedule.find(
        item=>item.id===id
      );

    if(fixture)
      return fixture;

    const yearStart=
      (Number(tournament.year)-2026)*
      365;

    const opponent=
      brazilMatch.homeId==="BRA"
        ? brazilMatch.away
        : brazilMatch.home;

    const relativeDay=
      phaseOrder[
        brazilMatch.phase
      ]||
      198;

    fixture={
      id,
      day:
        yearStart+
        relativeDay,

      windowDay:
        yearStart+
        168,

      opponent,

      competition:
        "Copa America",

      played:false,
      participated:false,

      brazil:null,
      other:null,

      tournamentType:
        "COPA_AMERICA",

      tournamentYear:
        tournament.year,

      tournamentMatchId:
        brazilMatch.id,

      tournamentPhase:
        String(
          brazilMatch.phase||
          ""
        ).toLowerCase()
    };

    n.schedule.push(
      fixture
    );

    n.schedule.sort(
      (a,b)=>a.day-b.day
    );

    return fixture;
  }

  function progressCopaAmericaBackground(
    s,
    n,
    rng
  ){
    const year=
      2026+
      Math.floor(s.day/365);

    const tournament=
      (n.tournaments||[])
        .find(
          t=>
            t?.type===
              "COPA_AMERICA" &&
            Number(t.year)===
              year
        );

    if(
      !tournament ||
      tournament.status==="COMPLETED"
    )
      return false;

    const CA=
      copaAmericaApi();

    if(!CA)
      return false;

    const yearStart=
      (year-2026)*365;

    const relative=
      s.day-
      yearStart;

    // ----------------------------
    // FASE DE GRUPOS
    // ----------------------------

    if(
      tournament.status===
      "GROUP_STAGE"
    ){
      const roundDays={
        1:168,
        2:174,
        3:180
      };

      for(const round of [1,2,3]){

        if(
          relative<
          roundDays[round]
        )
          continue;

        for(
          const group of
          tournament.groups
        ){
          for(
            const match of
            group.matches
          ){
            if(
              match.round!==round ||
              match.played
            )
              continue;

            const brazilMatch=
              match.homeId==="BRA" ||
              match.awayId==="BRA";

            if(brazilMatch){
              const fixture=
                n.schedule.find(
                  item=>
                    item.tournamentType===
                      "COPA_AMERICA" &&
                    item.tournamentMatchId===
                      match.id
                );

              // O jogo do Brasil deve ser resolvido
              // pelo calendario da Selecao.
              if(
                fixture &&
                !fixture.played
              )
                continue;
            }

            const result=
              simulateCopaAmericaScore(
                tournament,
                match.homeId,
                match.awayId,
                rng,
                false
              );

            CA.recordGroupResult(
              tournament,
              match.id,
              result.hg,
              result.ag
            );
          }
        }
      }

      const groupComplete=
        tournament.groups.every(
          group=>
            group.matches.every(
              match=>match.played
            )
        );

      if(
        groupComplete &&
        !tournament.knockout.length
      ){
        CA.buildQuarterfinals(
          tournament
        );

        scheduleBrazilCopaAmericaKnockout(
          s,
          n,
          tournament
        );
      }

      return true;
    }

    // ----------------------------
    // QUARTAS
    // ----------------------------

    if(
      tournament.status===
        "QUARTERFINAL" &&
      relative>=188
    ){
      for(
        const match of
        tournament.knockout.filter(
          item=>
            item.phase===
            "QUARTERFINAL"
        )
      ){
        if(match.played)
          continue;

        const hasBrazil=
          match.homeId==="BRA" ||
          match.awayId==="BRA";

        if(hasBrazil){
          const fixture=
            n.schedule.find(
              item=>
                item.tournamentType===
                  "COPA_AMERICA" &&
                item.tournamentMatchId===
                  match.id
            );

          if(
            fixture &&
            !fixture.played
          )
            continue;
        }

        const result=
          simulateCopaAmericaScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        CA.recordKnockoutResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }

      scheduleBrazilCopaAmericaKnockout(
        s,
        n,
        tournament
      );

      return true;
    }

    // ----------------------------
    // SEMIFINAL
    // ----------------------------

    if(
      tournament.status===
        "SEMIFINAL" &&
      relative>=193
    ){
      for(
        const match of
        tournament.knockout.filter(
          item=>
            item.phase===
            "SEMIFINAL"
        )
      ){
        if(match.played)
          continue;

        const hasBrazil=
          match.homeId==="BRA" ||
          match.awayId==="BRA";

        if(hasBrazil){
          const fixture=
            n.schedule.find(
              item=>
                item.tournamentType===
                  "COPA_AMERICA" &&
                item.tournamentMatchId===
                  match.id
            );

          if(
            fixture &&
            !fixture.played
          )
            continue;
        }

        const result=
          simulateCopaAmericaScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        CA.recordKnockoutResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }

      scheduleBrazilCopaAmericaKnockout(
        s,
        n,
        tournament
      );

      return true;
    }

    // ----------------------------
    // FINAL + 3o LUGAR
    // ----------------------------

    if(
      tournament.status===
        "FINALS" &&
      relative>=198
    ){
      for(
        const match of
        tournament.knockout.filter(
          item=>
            item.phase==="FINAL" ||
            item.phase==="THIRD_PLACE"
        )
      ){
        if(match.played)
          continue;

        const hasBrazil=
          match.homeId==="BRA" ||
          match.awayId==="BRA";

        if(hasBrazil){
          const fixture=
            n.schedule.find(
              item=>
                item.tournamentType===
                  "COPA_AMERICA" &&
                item.tournamentMatchId===
                  match.id
            );

          if(
            fixture &&
            !fixture.played
          )
            continue;
        }

        const result=
          simulateCopaAmericaScore(
            tournament,
            match.homeId,
            match.awayId,
            rng,
            true
          );

        CA.recordKnockoutResult(
          tournament,
          match.id,
          result.hg,
          result.ag,
          result.hp,
          result.ap
        );
      }

      return true;
    }

    return false;
  }

  function recordCopaAmericaFixture(
    s,
    n,
    fixture,
    brazil,
    other,
    rng
  ){
    if(
      !fixture ||
      fixture.tournamentType!==
        "COPA_AMERICA" ||
      !fixture.tournamentMatchId
    )
      return false;

    const CA=
      copaAmericaApi();

    if(!CA)
      return false;

    const tournament=
      (n.tournaments||[])
        .find(
          t=>
            t?.type===
              "COPA_AMERICA" &&
            Number(t.year)===
              Number(
                fixture.tournamentYear
              )
        );

    if(!tournament)
      return false;

    if(
      fixture.tournamentPhase===
      "group"
    ){
      let cupMatch=null;

      for(
        const group of
        tournament.groups
      ){
        cupMatch=
          group.matches.find(
            match=>
              match.id===
              fixture.tournamentMatchId
          );

        if(cupMatch)
          break;
      }

      if(
        !cupMatch ||
        cupMatch.played
      )
        return false;

      const hg=
        cupMatch.homeId==="BRA"
          ? brazil
          : other;

      const ag=
        cupMatch.awayId==="BRA"
          ? brazil
          : other;

      CA.recordGroupResult(
        tournament,
        cupMatch.id,
        hg,
        ag
      );

      progressCopaAmericaBackground(
        s,
        n,
        rng
      );

      return true;
    }

    const cupMatch=
      (tournament.knockout||[])
        .find(
          match=>
            match.id===
            fixture.tournamentMatchId
        );

    if(
      !cupMatch ||
      cupMatch.played
    )
      return false;

    const hg=
      cupMatch.homeId==="BRA"
        ? brazil
        : other;

    const ag=
      cupMatch.awayId==="BRA"
        ? brazil
        : other;

    let hp=null;
    let ap=null;

    if(hg===ag){
      const brazilWins=
        rng.next()<.55;

      if(
        cupMatch.homeId==="BRA"
      ){
        hp=brazilWins ? 5 : 4;
        ap=brazilWins ? 4 : 5;
      }
      else{
        hp=brazilWins ? 4 : 5;
        ap=brazilWins ? 5 : 4;
      }
    }

    CA.recordKnockoutResult(
      tournament,
      cupMatch.id,
      hg,
      ag,
      hp,
      ap
    );

    progressCopaAmericaBackground(
      s,
      n,
      rng
    );

    scheduleBrazilCopaAmericaKnockout(
      s,
      n,
      tournament
    );

    return true;
  }

  function recordFinalissimaFixture(
    s,
    n,
    fixture,
    brazil,
    other,
    rng
  ){
    if(
      !fixture ||
      fixture.tournamentType!==
        "FINALISSIMA"
    )
      return false;

    const tournament=
      (n.tournaments||[])
        .find(
          t=>
            t?.type===
              "FINALISSIMA" &&
            Number(t.year)===
              Number(
                fixture.tournamentYear
              )
        );

    if(
      !tournament ||
      tournament.status===
        "COMPLETED"
    )
      return false;

    const F=
      finalissimaApi();

    if(!F?.recordResult)
      return false;

    const match=
      tournament.match;

    const hg=
      match.homeId==="BRA"
        ? brazil
        : other;

    const ag=
      match.awayId==="BRA"
        ? brazil
        : other;

    if(hg!==ag){
      F.recordResult(
        tournament,
        hg,
        ag
      );

      return true;
    }

    const brazilWins=
      rng.next()<.55;

    let hp;
    let ap;

    if(match.homeId==="BRA"){
      hp=brazilWins ? 5 : 4;
      ap=brazilWins ? 4 : 5;
    }
    else{
      hp=brazilWins ? 4 : 5;
      ap=brazilWins ? 5 : 4;
    }

    F.recordResult(
      tournament,
      hg,
      ag,
      hp,
      ap
    );

    return true;
  }

  function matchEventRecords(live,heroName){
    return (live?.events||[]).filter(e=>e.type==="goal").map(e=>{
      const scorerId=e.playerId||null,assistId=e.assistPlayerId||null;
      return {minute:Number(e.minute),side:e.side===1?1:0,scorerId,scorer:scorerId==="hero"?(heroName||e.player||null):(scorerId?(e.player||null):null),assistId,assist:assistId==="hero"?(heroName||null):(assistId?(e.assistPlayer||null):null)};
    });
  }
  // --- Stage 31.3.4: jogadores, assistencias e melhor da partida (deterministico por hash, sem consumir o RNG da simulacao) ---
  function liveUnit(key){return worldCupUnit(key);}
  function livePick(items,weight,key){
    let total=0;const w=items.map(x=>{const v=Math.max(0,Number(weight(x))||0);total+=v;return v;});
    if(total<=0)return null;
    let r=liveUnit(key)*total;
    for(let i=0;i<items.length;i++){r-=w[i];if(r<0)return items[i];}
    return items[items.length-1];
  }
  function livePlayerLookup(s){
    const map=new Map();
    for(const p of globalNationalPlayers(s))map.set(p.id,p);
    for(const club of s.clubs||[])for(const p of club.roster||[])map.set(p.id,p);
    for(const p of internationalPool(s))if(!map.has(p.id))map.set(p.id,p);
    return map;
  }
  function opponentLineup(s,api,fixture,opponent){
    const n=init(s),wanted=worldCupNormalize(opponent);
    if(fixture?.tournamentType==="WORLD_CUP"){
      const tournament=(n.tournaments||[]).find(x=>x?.type==="WORLD_CUP"&&Number(x.year)===Number(fixture.tournamentYear));
      const entry=(tournament?.squads||[]).find(x=>worldCupNormalize(x.name)===wanted||worldCupNormalize(x.id)===wanted);
      if(entry?.squad?.length)return entry.lineup||worldCupLineup(entry.squad);
    }
    const team=nations.find(x=>worldCupNormalize(x.name)===wanted)||{id:wanted,name:opponent,reputation:75};
    const year=Number(fixture?.tournamentYear)||2026+Math.floor(Number(s.day||0)/365);
    const available=worldCupAvailablePlayers(s,{year},team,api),limits={GOL:2,DEF:7,MEI:7,ATA:6},squad=[];
    for(const [pos,count] of Object.entries(limits))squad.push(...available.filter(x=>x.pos===pos).sort((a,b)=>b.score-a.score||b.overall-a.overall||String(a.id).localeCompare(String(b.id))).slice(0,count));
    return worldCupLineup(squad);
  }
  function liveSideRows(lineup,unavailable,key,side,hero){
    const mk=p=>({id:p.id,name:p.name,pos:p.pos,overall:Number(p.overall||p.ovr||70),score:Number(p.score??p.overall??70),side,start:0,end:90,starter:true});
    const ok=p=>p&&p.id!==undefined&&p.id!==null&&p.id!=="hero"&&!unavailable(p.id);
    const starters=(lineup?.starters||[]).filter(ok).map(mk),bench=(lineup?.bench||[]).filter(ok).map(mk);
    const take=(pos)=>{let i=bench.findIndex(b=>b.pos===pos);if(i<0)i=bench.findIndex(b=>b.pos!=="GOL");if(i<0)i=0;return i<bench.length?bench.splice(i,1)[0]:null;};
    const heroRow=hero?.participated?{id:"hero",name:hero.name,pos:hero.pos,overall:hero.overall,score:hero.overall,side,start:0,end:90,starter:true,hero:true}:null;
    const lowest=(list)=>list.slice().sort((a,b)=>a.score-b.score||String(a.id).localeCompare(String(b.id)))[0];
    if(heroRow&&hero.starter){
      const victim=lowest(starters.filter(x=>x.pos===heroRow.pos))||lowest(starters.filter(x=>x.pos!=="GOL"));
      if(victim)starters.splice(starters.indexOf(victim),1);
      starters.push(heroRow);
    }
    if(!starters.some(x=>x.pos==="GOL")){const g=take("GOL");if(g&&g.pos==="GOL")starters.push(g);else if(g)bench.unshift(g);}
    while(starters.length<11&&bench.length){const x=take(null);if(!x)break;starters.push(x);}
    const rows=starters.slice(),used=new Set();
    const swap=(out,minute,incoming)=>{out.end=minute;incoming.start=minute;incoming.end=90;incoming.starter=false;rows.push(incoming);used.add(out.id);};
    if(heroRow&&hero.starter){
      heroRow.end=Math.min(90,Math.max(1,Number(hero.minutes)||90));
      if(heroRow.end<90){const incoming=take(heroRow.pos);if(incoming){incoming.start=heroRow.end;incoming.end=90;incoming.starter=false;rows.push(incoming);}}
      used.add("hero");
    }else if(heroRow){
      const entry=Math.max(1,Number(hero.entryMinute)||60);
      const out=lowest(starters.filter(x=>x.pos===heroRow.pos&&!x.hero))||lowest(starters.filter(x=>x.pos!=="GOL"&&!x.hero));
      heroRow.start=entry;heroRow.end=Math.min(90,entry+Math.max(1,Number(hero.minutes)||1));heroRow.starter=false;
      if(out){out.end=entry;used.add(out.id);}
      rows.push(heroRow);
    }
    const count=1+Math.floor(liveUnit(`${key}|subs|${side}`)*3);
    for(let i=0;i<count;i++){
      const candidates=starters.filter(x=>!used.has(x.id)&&x.pos!=="GOL"&&!x.hero);
      if(!candidates.length||!bench.length)break;
      const out=candidates[Math.floor(liveUnit(`${key}|out|${side}|${i}`)*candidates.length)],incoming=take(out.pos);
      if(!incoming)break;
      swap(out,55+Math.floor(liveUnit(`${key}|min|${side}|${i}`)*33),incoming);
    }
    return rows;
  }
  function liveRatings(rows,sideGoals,conceded,importance,key){
    const factor=Number(importance?.factor)||1;
    for(const r of rows){
      if(r.hero)continue;
      const minutes=Math.max(0,r.end-r.start),goalsFor=sideGoals[r.side],against=conceded[r.side];
      let raw=6.4+(r.overall-70)/25*.9+Math.min(3,r.goals)*1+Math.min(2,r.assists)*.6+(goalsFor>against?.25:goalsFor<against?-.25:0);
      if(r.pos==="GOL"||r.pos==="DEF")raw+=against===0?(r.pos==="GOL"?.7:.5):against>=3?-.4:0;
      raw+=(liveUnit(`${key}|rate|${r.id}`)-.5)*.9;
      raw=6.4+(raw-6.4)*factor;
      if(minutes<45)raw=6.2+(raw-6.2)*(minutes/45);
      r.rating=+Math.max(4,Math.min(9.8,raw)).toFixed(1);
    }
  }
  function identifyMatchPlayers(s,api,fixture,ctx){
    const {opponent,participated,starter,entryMinute,minutes,rating,brazil,other,events,importance}=ctx;
    const key=`${s.season}|${s.day}|${fixture?.competition||"Seleção Brasileira"}|${opponent}`,lookup=livePlayerLookup(s);
    const unavailable=id=>{const p=lookup.get(id);return !!p&&(Number(p.injury)>0||Number(p.suspension)>0);};
    const heroInfo={participated,starter,entryMinute,minutes,name:s.person.name,pos:s.person.pos,overall:Number(api?.overall?api.overall(s.person):s.person.overall||70)};
    const rows=[...liveSideRows(matchLineup(s,api),unavailable,key,0,heroInfo),...liveSideRows(opponentLineup(s,api,fixture,opponent),unavailable,key,1,null)];
    const nameOf=new Map(rows.map(r=>[r.id,r.name]));
    for(const r of rows){r.goals=0;r.assists=0;}
    const onPitch=(side,minute,exclude)=>rows.filter(r=>r.side===side&&r.id!=="hero"&&r.id!==exclude&&r.start<=minute&&minute<=r.end);
    const scorerWeight=r=>({ATA:6,MEI:3,DEF:1.2,GOL:.02}[r.pos]||1)*Math.pow(r.overall/70,3);
    const assistWeight=r=>({MEI:5,ATA:4,DEF:2,GOL:.05}[r.pos]||1)*Math.pow(r.overall/70,3);
    events.forEach((e,i)=>{
      if(e.type!=="goal")return;
      const side=e.side===1?1:0;
      if(e.playerId!=="hero"){
        const scorer=livePick(onPitch(side,e.minute,null),scorerWeight,`${key}|scorer|${i}`);
        if(scorer){e.playerId=scorer.id;e.player=scorer.name;e.text=`Gol de ${scorer.name}${side===0?" pelo Brasil":` pela seleção de ${ctx.opponent}`}.`;}
      }
      if(!e.assistPlayerId&&e.playerId&&liveUnit(`${key}|hasassist|${i}`)<(e.playerId==="hero"?.55:.7)){
        const assistant=livePick(onPitch(side,e.minute,e.playerId),assistWeight,`${key}|assist|${i}`);
        if(assistant){e.assistPlayerId=assistant.id;e.assistPlayer=assistant.name;}
      }
      if(e.assistPlayerId==="hero")e.assistPlayer=s.person.name;
      const scorerRow=rows.find(r=>r.id===e.playerId&&r.side===side),assistRow=rows.find(r=>r.id===e.assistPlayerId&&r.side===side);
      if(scorerRow)scorerRow.goals++;
      if(assistRow)assistRow.assists++;
    });
    liveRatings(rows,[brazil,other],[other,brazil],importance,key);
    const hr=rows.find(r=>r.id==="hero");
    if(hr)hr.rating=+Number(rating).toFixed(1);
    const rated=rows.filter(r=>r.end>r.start&&Number.isFinite(r.rating)&&r.rating>=1&&r.rating<=10);
    const best=rated.slice().sort((a,b)=>b.rating-a.rating||(b.goals+b.assists)-(a.goals+a.assists)||String(a.id).localeCompare(String(b.id)))[0]||null;
    return {players:rated.map(r=>[r.id,r.name,r.side,r.pos,r.end-r.start,r.rating]),motm:best?{id:best.id,name:best.name,rating:best.rating,side:best.side}:null};
  }
  function nationalLiveMatch(s,api,fixture,{opponent,brazil,other,participated,starter,entryMinute,minutes,rating,goals,assists}){
    const importance=api?.matchImportance?.(s,fixture||{competition:"Seleção Brasileira"},{national:true})||{factor:1.1,label:"Jogo de Seleção"};
    const events=[],used=new Set(),unknown="Autor não identificado";
    const winStart=participated?Math.max(1,Number(entryMinute)||1):1,winEnd=participated?Math.min(90,Math.max(winStart,(Number(entryMinute)||0)+Number(minutes||0))):90;
    const pick=(base,start,end)=>{const span=Math.max(1,end-start+1);let m=start+(base%span),guard=0;while(used.has(m)&&guard++<span)m=m<end?m+1:start;used.add(m);return m;};
    const heroGoals=participated?Math.min(goals,brazil):0,heroAssists=participated?Math.min(assists,Math.max(0,brazil-heroGoals)):0;
    for(let i=0;i<brazil;i++){
      const heroGoal=i<heroGoals,heroAssist=!heroGoal&&i<heroGoals+heroAssists;
      const minute=heroGoal||heroAssist?pick(Number(s.day||0)*13+i*19,winStart,winEnd):pick(Number(s.day||0)*13+i*19,8,88);
      const event={minute,type:"goal",side:0,player:heroGoal?s.person.name:unknown,playerId:heroGoal?"hero":null,text:heroGoal?`Gol do Brasil com ${s.person.name}.`:`Gol do Brasil${heroAssist?` com assistência de ${s.person.name}`:""}.`};
      if(heroAssist)event.assistPlayerId="hero";
      events.push(event);
    }
    for(let i=0;i<other;i++){const minute=pick(Number(s.day||0)*17+i*23,11,88);events.push({minute,type:"goal",side:1,player:unknown,playerId:null,text:`Gol de ${opponent}.`});}
    events.sort((a,b)=>a.minute-b.minute);
    let identified={players:[],motm:null};
    try{identified=identifyMatchPlayers(s,api,fixture,{opponent,participated,starter,entryMinute,minutes,rating,brazil,other,events,importance});}catch(error){identified={players:[],motm:null};}
    return {national:true,home:"BRA",away:String(fixture?.opponentId||opponent),homeName:"Brasil",awayName:opponent,opponent,date:s.day,season:s.season,competitionId:"nationalTeam",competitionName:fixture?.competition||"Seleção Brasileira",stage:fixture?.stage||fixture?.phase||"Seleção Brasileira",hg:brazil,ag:other,events,shots:[Math.max(4,brazil*3+4),Math.max(4,other*3+3)],target:[Math.max(brazil,brazil*2+2),Math.max(other,other*2+1)],xg:[+(brazil*.72+.8).toFixed(2),+(other*.72+.65).toFixed(2)],possession:52,participants:participated?[["hero"],[]]:[[],[]],participation:participated?{hero:{side:0,starter,entryMinute,exitMinute:entryMinute+minutes,minutes}}:{},playerStats:participated?{hero:{minutes,starter,entryMinute,exitMinute:entryMinute+minutes,assists}}:{},ratings:participated?{hero:+rating.toFixed(1)}:{},offensiveStats:participated?{hero:{shots:Math.max(goals+1,2),onTarget:Math.max(goals,1),xg:+(goals*.55+.15).toFixed(2),goals}}:{},importance,players:identified.players,motm:identified.motm,summary:`Brasil ${brazil} × ${other} ${opponent}.`};
  }
  function play(s, rng, api, log, fixture = null) {
    const n = init(s); if (!n.calledUp) return null;
    const opponent = fixture?.opponent || opponents[rng.int(0, opponents.length - 1)], subPlan=api?.Squad?.substitutePlan?.(s,s.person)||{minute:68,chance:.65};
    const starter = n.status === "Titular" || (n.status === "Rotação" && rng.next() < 0.55), benchEligible=["Rotação","Reserva"].includes(n.status), participated = starter || (benchEligible&&rng.next()<subPlan.chance);
    const entryMinute=participated?(starter?0:Math.max(60,Math.min(75,Number(subPlan.minute||68)))):null;
    const minutes = participated ? (starter ? rng.int(65, 90) : 94-entryMinute) : 0, quality = score(s, api), rating = participated ? clamp(5.7 + (quality - 65) / 18 + (rng.next() - 0.5) * 1.8, 5.5, 9.8) : 0;
    const goals = participated && rng.next() < clamp((quality - 55) / 100, 0.05, 0.42) ? 1 : 0, assists = participated && rng.next() < clamp((quality - 58) / 120, 0.04, 0.3) ? 1 : 0;
    const brazil = Math.max(goals+assists, Math.round(1.4 + (quality - 68) / 22 + (rng.next() - 0.5) * 2),0), other = Math.max(0, Math.round(1.1 + (rng.next() - 0.5) * 2));
    const liveMatch=nationalLiveMatch(s,api,fixture,{opponent,brazil,other,participated,starter,entryMinute,minutes,rating,goals,assists});
    if (fixture) {
      Object.assign(
        fixture,
        {
          played:true,
          participated,
          brazil,
          other
        }
      );

      recordWorldCupFixture(
        s,
        n,
        fixture,
        brazil,
        other,
        rng
      );

      recordCopaAmericaFixture(
        s,
        n,
        fixture,
        brazil,
        other,
        rng
      );

      recordFinalissimaFixture(
        s,
        n,
        fixture,
        brazil,
        other,
        rng
      );
    }
    const reputationBefore=Number(s.reputation||0);
    const development=participated?api?.Training?.matchDevelopment?.(s,liveMatch,{overall:api.overall,clamp:api.clamp}):null;
    if (participated) {
      const beforeGoals=n.goals; n.caps++; if(starter)n.starts++; n.goals+=goals; n.assists+=assists; n.ratingTotal+=rating; n.minutes=(n.minutes||0)+minutes; if(rating>=8.6)n.motm++; n.debutDay??=s.day; if(goals&&beforeGoals===0)n.firstGoalDay??=s.day; s.person.condition=clamp((s.person.condition||100)-Math.round(minutes/10),0,100);
      const match = { day: s.day, season: s.season, competition: n.competition, opponent, brazil, other, starter, entryMinute, minutes, rating: +rating.toFixed(1), goals, assists, events: matchEventRecords(liveMatch, s.person.name), players: liveMatch.players, motm: liveMatch.motm };
      n.matches.unshift(match); n.matches = n.matches.slice(0, 100); for(let i=20;i<n.matches.length;i++)if(n.matches[i]?.players)delete n.matches[i].players;
      s.reputation = clamp(s.reputation + (rating >= 8 ? 2 : rating >= 7 ? 1 : 0)*Number(liveMatch.importance.factor||1), 0, 100); s.fans += Math.round(500 + rating * 120 + goals * 1000);
    }
    n.lastMatchday=liveMatch;
    const pc=api?.Career?.init?.(s)?.playerCareer;
    if(pc){pc.lastMatchReport={day:s.day,season:s.season,national:true,competition:liveMatch.competitionName,opponent,status:participated?(starter?"TITULAR":"ENTROU_DO_BANCO"):"NAO_UTILIZADO",entryMinute:participated&&!starter?entryMinute:null,minutes,rating:participated?+rating.toFixed(1):null,goals,assists,xp:+Number(development?.xp||0).toFixed(2),attributeChanges:development?.changes||[],coachTrustBefore:Number(pc.coachTrust||0),coachTrustAfter:Number(pc.coachTrust||0),squadRoleBefore:pc.squadRole,squadRoleAfter:pc.squadRole,reputationBefore,reputationAfter:Number(s.reputation||0),reputationDelta:+(Number(s.reputation||0)-reputationBefore).toFixed(2),importance:liveMatch.importance,nationalImpact:participated?`+1 jogo${starter?" e +1 titularidade":" pela Seleção"}`:"Permaneceu no banco da Seleção"};}
    if(participated){const extraPressure=(Number(liveMatch.importance?.factor||1)-1)*(rating>=8?-4:rating<6?8:2);if(extraPressure)api?.Career?.updateMediaProfile?.(s,{pressure:+extraPressure.toFixed(2)});}
    log(s, `Brasil ${brazil} × ${other} ${opponent}`, participated ? `${s.person.name}: ${minutes} min · nota ${rating.toFixed(1)}${goals ? ` · ${goals} gol(s)` : ""}${assists ? ` · ${assists} assistência(s)` : ""}.` : `${s.person.name} permaneceu no banco nesta partida.`);
    return liveMatch;
  }
  function daily(s, rng, api, log) {
    const n = init(s);

    archiveInternationalHistory(
      n
    ); if (s.mode !== "player") return; ensureQualifiers(s,n,rng);ensureWorldCupOfficialSquads(s,n,api,log);
    const relative = s.day % 365;
    const callWindow = windows.find((day) => relative === day - 7);
    if (callWindow !== undefined) callup(s, api, log);
    const fixture = n.schedule.find((match) => !match.played && match.day === s.day);
    if (fixture) {
      n.competition = fixture.competition;
      if (windowDecision(n,fixture.windowDay)?.calledUp) { n.calledUp=true; n.status=windowDecision(n,fixture.windowDay).status||n.status; play(s, rng, api, log, fixture); }
      else {
        const brazil = Math.max(0, Math.round(1.7 + (rng.next() - 0.5) * 2.4));
        const other = Math.max(0, Math.round(1.1 + (rng.next() - 0.5) * 2.2));
        Object.assign(
          fixture,
          {
            played:true,
            participated:false,
            status:"N\u00e3o convocado",
            brazil,
            other
          }
        );

        recordWorldCupFixture(
          s,
          n,
          fixture,
          brazil,
          other,
          rng
        );

        recordCopaAmericaFixture(
          s,
          n,
          fixture,
          brazil,
          other,
          rng
        );

        recordFinalissimaFixture(
          s,
          n,
          fixture,
          brazil,
          other,
          rng
        );
        log(s, `Brasil ${brazil} × ${other} ${fixture.opponent}`, `${fixture.competition} · partida da Seleção Brasileira.`);
      }
    }
    progressEuroBackground(
      s,
      n,
      rng
    );

    progressNationsLeagueBackground(
      s,
      n,
      rng
    );

    progressAfconBackground(
      s,
      n,
      rng
    );

    progressAsianCupBackground(
      s,
      n,
      rng
    );

    progressGoldCupBackground(
      s,
      n,
      rng
    );

    progressConcacafNationsLeagueBackground(
      s,
      n,
      rng
    );

    progressOfcNationsCupBackground(
      s,
      n,
      rng
    );

    progressFifaArabCupBackground(
      s,
      n,
      rng
    );

    progressFifaSeriesBackground(
      s,
      n,
      rng
    );

    progressFinalissimaBackground(
      s,
      n,
      rng
    );

    progressCopaAmericaBackground(
      s,
      n,
      rng
    );

    progressWorldCupBackground(s,n);
    const cup=(n.tournaments||[]).find(t=>t?.type==="WORLD_CUP"&&Number(t.year)===worldCupYearFromDay(s.day)),activeCup=cup&&cup.brazilCallup?.calledUp&&!cup.brazilEliminationPhase&&cup.status!=="COMPLETED";
    if (!activeCup&&windows.some((day) => relative === day + 4)) { n.calledUp = false; n.currentCallupWindow=null; n.status = "Aguardando próxima convocação"; }
    n.nextWindow = n.schedule.find((match) => !match.played && match.day >= s.day)?.day ?? nextWindowDay(s);
  }
  const api={windows,nations,init,score,threshold,radar,role,upcoming,nextWindowDay,protectedDay,protectClubCalendar,callup,play,daily,competition,buildSquad,positionCompetition,onDuty,ensureQualifiers,tournamentStatus,normalizedNationality,windowDecision,matchLineup,fixtureCallupStatus,ensureWorldCup,ensureWorldCupGroupSchedule,ensureWorldCupOfficialSquads,progressWorldCupBackground,recordWorldCupFixture,qualifyWorldCupGroups,syncBrazilWorldCupKnockout,worldCupSummary,worldCupPhaseLabel,copaAmericaSummary,ensureCopaAmerica,isCopaAmericaYear,recordCopaAmericaFixture,progressCopaAmericaBackground,scheduleBrazilCopaAmericaKnockout,ensureEuro,isEuroYear,progressEuroBackground,euroSummary,ensureFinalissima,isFinalissimaYear,ensureFinalissimaSchedule,recordFinalissimaFixture,progressFinalissimaBackground,finalissimaSummary,ensureNationsLeague,isNationsLeagueYear,progressNationsLeagueBackground,nationsLeagueSummary,ensureAfcon,isAfconYear,progressAfconBackground,afconSummary,ensureAsianCup,isAsianCupYear,progressAsianCupBackground,asianCupSummary,ensureGoldCup,isGoldCupYear,progressGoldCupBackground,goldCupSummary,ensureConcacafNationsLeague,isConcacafNationsLeagueYear,progressConcacafNationsLeagueBackground,concacafNationsLeagueSummary,ensureOfcNationsCup,isOfcNationsCupYear,progressOfcNationsCupBackground,ofcNationsCupSummary,ensureFifaArabCup,isFifaArabCupYear,progressFifaArabCupBackground,fifaArabCupSummary,ensureFifaSeries,isFifaSeriesYear,progressFifaSeriesBackground,fifaSeriesSummary,archiveInternationalHistory,internationalHistorySummary};
  root.ProLifeNationalTeam = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
