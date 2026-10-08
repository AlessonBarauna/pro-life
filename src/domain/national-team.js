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

    simulateOtherKnockoutMatches(
      tournament,
      phase,
      rng
    );

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
    rng
  ){
    const WC=worldCupApi();

    if(!WC?.simulateTournament)
      return;

    WC.simulateTournament(
      tournament,
      rng
    );

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
        rng
      );

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

    if(match.winnerId!=="BRA"){
      tournament.brazilStatus=
        "ELIMINATED";

      tournament.brazilEliminationPhase=
        match.phase;

      finishWorldCupWithoutBrazil(
        n,
        tournament,
        rng
      );

      return true;
    }

    if(match.phase==="FINAL"){
      WC.finalizeTournament(
        tournament
      );

      tournament.brazilStatus=
        "CHAMPION";

      const title=
        "Copa Mundial "+
        tournament.year;

      if(!Array.isArray(n.titles))
        n.titles=[];

      if(!n.titles.includes(title))
        n.titles.push(title);

      n.history.unshift({
        day:s.day,
        type:"world_cup_title",
        year:tournament.year,
        title
      });

      n.history=n.history.slice(0,80);

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

    return "Eliminat?rias";
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

    for(const c of s.clubs||[])
      for(const p of c.roster||[])
        addCandidate(p,c.name);

    for(const p of internationalPool(s))
      addCandidate(p,p.externalClub||"Exterior");

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
  function positionCompetition(s,api){
    const stored=s.nationalTeam?.calledUp && s.nationalTeam?.squad?.length ? s.nationalTeam.squad : null;
    let squad=stored||buildSquad(s,api);
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
      s.nationalTeam.squad=squad;
    }
    const pos=s.person.pos; return squad.filter(x=>x.pos===pos).sort((a,b)=>b.score-a.score||b.overall-a.overall||a.id.localeCompare(b.id)).map((x,i)=>({...x,rank:i+1}));
  }
  function matchLineup(s,api){
    const n=init(s);

    const squad=n.calledUp && Array.isArray(n.squad) && n.squad.length
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
      : "Ciclo de Eliminat?rias";
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

    const squads2026=
      root.ProLifeWorldCupSquads2026 ||
      (
        typeof require==="function"
          ? require("./world-cup-squads-2026.js")
          : null
      );

    const worldCupSquads=
      Number(tournament.year)===2026 &&
      squads2026
        ? participants.map(
            team=>({
              ...team,

              squad:
                squads2026.squad(
                  team.id
                ),

              lineup:
                squads2026.lineup(
                  team.id
                )
            })
          )
        : [];

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

  function play(s, rng, api, log, fixture = null) {
    const n = init(s); if (!n.calledUp) return;
    const opponent = fixture?.opponent || opponents[rng.int(0, opponents.length - 1)], starter = n.status === "Titular" || (n.status === "Rotação" && rng.next() < 0.55), participated = starter || rng.next() < 0.7;
    const minutes = participated ? (starter ? rng.int(65, 90) : rng.int(12, 35)) : 0, quality = score(s, api), rating = participated ? clamp(5.7 + (quality - 65) / 18 + (rng.next() - 0.5) * 1.8, 5.5, 9.8) : 0;
    const goals = participated && rng.next() < clamp((quality - 55) / 100, 0.05, 0.42) ? 1 : 0, assists = participated && rng.next() < clamp((quality - 58) / 120, 0.04, 0.3) ? 1 : 0;
    const brazil = Math.max(0, Math.round(1.4 + (quality - 68) / 22 + (rng.next() - 0.5) * 2)), other = Math.max(0, Math.round(1.1 + (rng.next() - 0.5) * 2));
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
    if (participated) {
      const beforeGoals=n.goals; n.caps++; if(starter)n.starts++; n.goals+=goals; n.assists+=assists; n.ratingTotal+=rating; n.minutes=(n.minutes||0)+minutes; if(rating>=8.6)n.motm++; n.debutDay??=s.day; if(goals&&beforeGoals===0)n.firstGoalDay??=s.day; s.person.condition=clamp((s.person.condition||100)-Math.round(minutes/10),0,100);
      const match = { day: s.day, season: s.season, competition: n.competition, opponent, brazil, other, starter, minutes, rating: +rating.toFixed(1), goals, assists };
      n.matches.unshift(match); n.matches = n.matches.slice(0, 100);
      s.reputation = clamp(s.reputation + (rating >= 8 ? 2 : rating >= 7 ? 1 : 0), 0, 100); s.fans += Math.round(500 + rating * 120 + goals * 1000);
    }
    log(s, `Brasil ${brazil} × ${other} ${opponent}`, participated ? `${s.person.name}: ${minutes} min · nota ${rating.toFixed(1)}${goals ? ` · ${goals} gol(s)` : ""}${assists ? ` · ${assists} assistência(s)` : ""}.` : `${s.person.name} permaneceu no banco nesta partida.`);
  }
  function daily(s, rng, api, log) {
    const n = init(s);

    archiveInternationalHistory(
      n
    ); if (s.mode !== "player") return; ensureQualifiers(s,n,rng);
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

    if (windows.some((day) => relative === day + 4)) { n.calledUp = false; n.currentCallupWindow=null; n.status = "Aguardando próxima convocação"; }
    n.nextWindow = n.schedule.find((match) => !match.played && match.day >= s.day)?.day ?? nextWindowDay(s);
  }
  const api={windows,nations,init,score,threshold,radar,role,upcoming,nextWindowDay,protectedDay,protectClubCalendar,callup,play,daily,competition,buildSquad,positionCompetition,onDuty,ensureQualifiers,tournamentStatus,normalizedNationality,windowDecision,matchLineup,fixtureCallupStatus,ensureWorldCup,ensureWorldCupGroupSchedule,recordWorldCupFixture,qualifyWorldCupGroups,syncBrazilWorldCupKnockout,worldCupSummary,worldCupPhaseLabel,copaAmericaSummary,ensureCopaAmerica,isCopaAmericaYear,recordCopaAmericaFixture,progressCopaAmericaBackground,scheduleBrazilCopaAmericaKnockout,ensureEuro,isEuroYear,progressEuroBackground,euroSummary,ensureFinalissima,isFinalissimaYear,ensureFinalissimaSchedule,recordFinalissimaFixture,progressFinalissimaBackground,finalissimaSummary,ensureNationsLeague,isNationsLeagueYear,progressNationsLeagueBackground,nationsLeagueSummary,ensureAfcon,isAfconYear,progressAfconBackground,afconSummary,ensureAsianCup,isAsianCupYear,progressAsianCupBackground,asianCupSummary,ensureGoldCup,isGoldCupYear,progressGoldCupBackground,goldCupSummary,ensureConcacafNationsLeague,isConcacafNationsLeagueYear,progressConcacafNationsLeagueBackground,concacafNationsLeagueSummary,ensureOfcNationsCup,isOfcNationsCupYear,progressOfcNationsCupBackground,ofcNationsCupSummary,ensureFifaArabCup,isFifaArabCupYear,progressFifaArabCupBackground,fifaArabCupSummary,ensureFifaSeries,isFifaSeriesYear,progressFifaSeriesBackground,fifaSeriesSummary,archiveInternationalHistory,internationalHistorySummary};
  root.ProLifeNationalTeam = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
