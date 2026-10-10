
(function(root){
  "use strict";

  const GF=
    root.ProLifeGlobalFootball ||
    (
      typeof require==="function"
        ? require("./global-football.js")
        : null
    );

  const VERSION=1;
  const FIRST_MATCH_DAY=10;
  const LAST_MATCH_DAY=340;
  const HISTORY_LIMIT=400;

  const clamp=(v,a,b)=>
    Math.max(a,Math.min(b,v));

  function hash(value){
    let h=2166136261;

    for(const ch of String(value)){
      h^=ch.charCodeAt(0);
      h=Math.imul(h,16777619);
    }

    return h>>>0;
  }

  function random(seed){
    let a=seed>>>0;

    return function(){
      a=(a+0x6D2B79F5)>>>0;

      let t=a;

      t=Math.imul(
        t^(t>>>15),
        t|1
      );

      t^=
        t+
        Math.imul(
          t^(t>>>7),
          t|61
        );

      return (
        (
          t^(t>>>14)
        )>>>0
      )/4294967296;
    };
  }

  function poisson(lambda,rnd){
    const limit=Math.exp(-lambda);

    let product=1;
    let k=0;

    do{
      k++;
      product*=rnd();
    }while(
      product>limit &&
      k<10
    );

    return Math.max(0,k-1);
  }

  function baseDay(season){
    return (
      Number(season)-2026
    )*365;
  }

  function blank(){
    return [0,0,0,0,0,0,0];
  }

  function clubGroups(s){
    GF?.init?.(s);

    const g=
      s.globalFootball;

    const byLeague=
      new Map();

    for(const club of g?.clubs||[]){

      if(
        !club ||
        club.generated===true ||
        club.active===false ||
        !club.leagueId
      )
        continue;

      if(!byLeague.has(club.leagueId))
        byLeague.set(
          club.leagueId,
          []
        );

      byLeague
        .get(club.leagueId)
        .push(club);
    }

    return byLeague;
  }

  function eligibleLeagueData(s){
    GF?.init?.(s);

    const groups=
      clubGroups(s);

    return (s.globalFootball?.leagues||[])
      .filter(
        league=>
          league &&
          league.active!==false &&
          league.competitionEligible!==false
      )
      .map(league=>{

        const clubs=
          (groups.get(league.id)||[])
            .slice()
            .sort(
              (a,b)=>
                String(a.id)
                  .localeCompare(
                    String(b.id)
                  )
            );

        return {
          league,
          clubs
        };
      })
      .filter(
        item=>
          item.clubs.length>=10
      );
  }

  function makeSchedule(ids){

    const teams=
      ids.slice();

    if(teams.length%2)
      teams.push(null);

    const n=
      teams.length;

    const first=
      teams[0];

    let rotating=
      teams.slice(1);

    const rounds=[];

    for(
      let round=0;
      round<n-1;
      round++
    ){

      const order=[
        first,
        ...rotating
      ];

      const pairs=[];

      for(
        let i=0;
        i<n/2;
        i++
      ){

        const a=
          order[i];

        const b=
          order[n-1-i];

        if(
          a!==null &&
          b!==null
        ){

          pairs.push(
            round%2===0
              ? [a,b]
              : [b,a]
          );
        }
      }

      rounds.push(pairs);

      rotating=[
        rotating.at(-1),
        ...rotating.slice(
          0,
          -1
        )
      ];
    }

    const second=
      rounds.map(
        round=>
          round.map(
            ([home,away])=>
              [away,home]
          )
      );

    return [
      ...rounds,
      ...second
    ];
  }

  function roundDate(
    season,
    roundIndex,
    totalRounds
  ){

    const base=
      baseDay(season);

    if(totalRounds<=1)
      return base+
        FIRST_MATCH_DAY;

    return (
      base+
      FIRST_MATCH_DAY+
      Math.round(
        roundIndex*
        (
          LAST_MATCH_DAY-
          FIRST_MATCH_DAY
        )/
        (
          totalRounds-1
        )
      )
    );
  }

  function createLeagueState(
    season,
    clubs
  ){

    const clubIds=
      clubs
        .map(c=>c.id)
        .sort();

    const table={};

    for(const id of clubIds)
      table[id]=blank();

    return {
      season,
      clubIds,
      round:0,
      table,
      scores:[],
      championId:null,
      status:"active"
    };
  }

  function rootState(s){

    GF?.init?.(s);

    const g=
      s.globalFootball;

    if(
      !g.worldCompetitions ||
      typeof g.worldCompetitions!=="object" ||
      Number(
        g.worldCompetitions.version
      )!==VERSION
    ){

      g.worldCompetitions={
        version:VERSION,
        season:s.season,
        leagues:{},
        history:[]
      };
    }

    const w=
      g.worldCompetitions;

    if(!Array.isArray(w.history))
      w.history=[];

    if(
      !w.leagues ||
      typeof w.leagues!=="object" ||
      Array.isArray(w.leagues)
    )
      w.leagues={};

    return w;
  }

  function ensureSeason(s){

    const w=
      rootState(s);

    if(
      Number(w.season)!==
      Number(s.season)
    ){

      w.season=s.season;
      w.leagues={};
    }

    for(
      const item
      of eligibleLeagueData(s)
    ){

      const id=
        item.league.id;

      const current=
        w.leagues[id];

      if(
        !current ||
        Number(current.season)!==
          Number(s.season)
      ){

        w.leagues[id]=
          createLeagueState(
            s.season,
            item.clubs
          );
      }
    }

    return w;
  }

  function init(s){
    return ensureSeason(s);
  }

  function clubCatalog(s){

    GF?.init?.(s);

    return new Map(
      (s.globalFootball?.clubs||[])
        .filter(
          c=>
            c &&
            c.generated!==true
        )
        .map(
          c=>[c.id,c]
        )
    );
  }

  function strength(club){

    if(!club)
      return 60;

    const direct=
      Number(
        club.strength
      );

    if(Number.isFinite(direct))
      return clamp(
        direct,
        35,
        100
      );

    const reputation=
      Number(
        club.reputation
      );

    if(Number.isFinite(reputation))
      return clamp(
        reputation,
        35,
        100
      );

    return 60;
  }

  function resultFor(
    season,
    leagueId,
    roundIndex,
    pairIndex,
    home,
    away,
    catalog
  ){

    const hc=
      catalog.get(home);

    const ac=
      catalog.get(away);

    const hs=
      strength(hc);

    const as=
      strength(ac);

    const diff=
      hs-as;

    const homeLambda=
      clamp(
        1.35+
        diff*0.032,
        0.25,
        3.6
      );

    const awayLambda=
      clamp(
        1.08-
        diff*0.026,
        0.20,
        3.2
      );

    const rnd=
      random(
        hash(
          season+
          "|"+
          leagueId+
          "|"+
          roundIndex+
          "|"+
          pairIndex+
          "|"+
          home+
          "|"+
          away
        )
      );

    return [
      clamp(
        poisson(
          homeLambda,
          rnd
        ),
        0,
        8
      ),
      clamp(
        poisson(
          awayLambda,
          rnd
        ),
        0,
        8
      )
    ];
  }

  function updateRow(
    row,
    gf,
    ga
  ){

    row[0]++;
    row[4]+=gf;
    row[5]+=ga;

    if(gf>ga){
      row[1]++;
      row[6]+=3;
    }else if(gf===ga){
      row[2]++;
      row[6]++;
    }else{
      row[3]++;
    }
  }

  function playRound(
    s,
    leagueId,
    state,
    roundIndex,
    schedule,
    catalog
  ){

    const pairs=
      schedule[roundIndex]||[];

    for(
      let pairIndex=0;
      pairIndex<pairs.length;
      pairIndex++
    ){

      const [
        home,
        away
      ]=
        pairs[pairIndex];

      let [
        hg,
        ag
      ]=
        resultFor(
          state.season,
          leagueId,
          roundIndex,
          pairIndex,
          home,
          away,
          catalog
        );

      // Stage 31.4.2: partida do protagonista usa o pipeline completo do motor.
      const official=
        activeHooks?.heroFixture?.(
          leagueId,
          roundIndex,
          pairIndex,
          home,
          away,
          roundDate(
            state.season,
            roundIndex,
            schedule.length
          )
        );

      if(
        Array.isArray(official)
      ){
        hg=official[0];
        ag=official[1];
      }

      updateRow(
        state.table[home],
        hg,
        ag
      );

      updateRow(
        state.table[away],
        ag,
        hg
      );

      state.scores.push([
        roundIndex,
        pairIndex,
        hg,
        ag
      ]);
    }

    state.round=
      roundIndex+1;
  }

  function processUntil(
    s,
    leagueId,
    state,
    targetRound,
    catalog
  ){

    const schedule=
      makeSchedule(
        state.clubIds
      );

    const target=
      Math.min(
        schedule.length,
        Math.max(
          state.round,
          targetRound
        )
      );

    while(
      state.round<target
    ){

      playRound(
        s,
        leagueId,
        state,
        state.round,
        schedule,
        catalog
      );
    }
  }

  function dueRoundCount(
    state,
    day
  ){

    const schedule=
      makeSchedule(
        state.clubIds
      );

    let count=0;

    for(
      let i=0;
      i<schedule.length;
      i++
    ){

      if(
        roundDate(
          state.season,
          i,
          schedule.length
        )<=day
      )
        count++;
      else
        break;
    }

    return count;
  }

  let activeHooks=null;

  function daily(s,hooks){

    const w=
      ensureSeason(s);

    if(
      s.day>0 &&
      s.day%365===0
    )
      return w;

    const catalog=
      clubCatalog(s);

    activeHooks=
      hooks||null;

    try{
      for(
        const [
          leagueId,
          state
        ]
        of Object.entries(
          w.leagues
        )
      ){

        if(state.status!=="active")
          continue;

        processUntil(
          s,
          leagueId,
          state,
          dueRoundCount(
            state,
            s.day
          ),
          catalog
        );
      }
    }finally{
      activeHooks=null;
    }

    return w;
  }

  function standings(
    s,
    leagueId
  ){

    const w=
      ensureSeason(s);

    const state=
      w.leagues[leagueId];

    if(!state)
      return [];

    const catalog=
      clubCatalog(s);

    return state.clubIds
      .map(id=>{

        const row=
          state.table[id]||
          blank();

        const club=
          catalog.get(id);

        return {
          id,
          name:
            club?.name||
            id,

          played:row[0],
          w:row[1],
          d:row[2],
          l:row[3],
          gf:row[4],
          ga:row[5],
          gd:
            row[4]-
            row[5],
          points:row[6],
          strength:
            strength(club)
        };
      })
      .sort(
        (a,b)=>
          b.points-a.points ||
          b.w-a.w ||
          b.gd-a.gd ||
          b.gf-a.gf ||
          b.strength-a.strength ||
          a.name.localeCompare(
            b.name
          )
      );
  }

  function results(
    s,
    leagueId,
    limit
  ){

    const w=
      ensureSeason(s);

    const state=
      w.leagues[leagueId];

    if(!state)
      return [];

    const schedule=
      makeSchedule(
        state.clubIds
      );

    const catalog=
      clubCatalog(s);

    let rows=
      state.scores.map(score=>{

        const [
          roundIndex,
          pairIndex,
          hg,
          ag
        ]=score;

        const pair=
          schedule[roundIndex]?.[
            pairIndex
          ];

        if(!pair)
          return null;

        const [
          home,
          away
        ]=pair;

        return {
          season:state.season,
          leagueId,
          round:
            roundIndex+1,

          date:
            roundDate(
              state.season,
              roundIndex,
              schedule.length
            ),

          home,
          away,

          homeName:
            catalog.get(home)?.name||
            home,

          awayName:
            catalog.get(away)?.name||
            away,

          hg,
          ag
        };
      })
      .filter(Boolean);

    if(
      Number.isInteger(limit) &&
      limit>=0
    )
      rows=rows.slice(-limit);

    return rows;
  }

  function calendar(
    s,
    leagueId
  ){

    const w=
      ensureSeason(s);

    const state=
      w.leagues[leagueId];

    if(!state)
      return [];

    const schedule=
      makeSchedule(
        state.clubIds
      );

    const scoreMap=
      new Map(
        state.scores.map(
          score=>[
            score[0]+":"+score[1],
            score
          ]
        )
      );

    return schedule.map(
      (pairs,roundIndex)=>({

        season:state.season,

        round:
          roundIndex+1,

        date:
          roundDate(
            state.season,
            roundIndex,
            schedule.length
          ),

        played:
          roundIndex<
          state.round,

        pairs:
          pairs.map(
            ([home,away],pairIndex)=>{

              const score=
                scoreMap.get(
                  roundIndex+
                  ":"+
                  pairIndex
                );

              return {
                home,
                away,
                hg:
                  score
                    ? score[2]
                    : null,

                ag:
                  score
                    ? score[3]
                    : null,

                played:
                  !!score
              };
            }
          )
      })
    );
  }

  function nextFixture(
    s,
    leagueId,
    clubId
  ){

    const w=
      ensureSeason(s);

    const state=
      w.leagues[leagueId];

    if(!state)
      return null;

    const schedule=
      makeSchedule(
        state.clubIds
      );

    for(
      let ri=state.round;
      ri<schedule.length;
      ri++
    ){

      for(
        const [
          home,
          away
        ]
        of schedule[ri]
      ){

        if(
          clubId &&
          home!==clubId &&
          away!==clubId
        )
          continue;

        return {
          season:state.season,
          leagueId,
          round:ri+1,
          date:
            roundDate(
              state.season,
              ri,
              schedule.length
            ),
          home,
          away
        };
      }
    }

    return null;
  }

  function closeSeason(s){

    const w=
      ensureSeason(s);

    const catalog=
      clubCatalog(s);

    const leagueCatalog=
      new Map(
        (s.globalFootball?.leagues||[])
          .map(
            l=>[l.id,l]
          )
      );

    for(
      const [
        leagueId,
        state
      ]
      of Object.entries(
        w.leagues
      )
    ){

      if(state.status==="finished")
        continue;

      const schedule=
        makeSchedule(
          state.clubIds
        );

      processUntil(
        s,
        leagueId,
        state,
        schedule.length,
        catalog
      );

      const order=
        standings(
          s,
          leagueId
        );

      const champion=
        order[0]||
        null;

      state.championId=
        champion?.id||
        null;

      state.status=
        "finished";

      const key=
        state.season+
        ":"+
        leagueId;

      if(
        !w.history.some(
          h=>h.key===key
        )
      ){

        w.history.unshift({
          key,
          season:
            state.season,

          leagueId,

          league:
            leagueCatalog
              .get(leagueId)
              ?.name||
            leagueId,

          championId:
            champion?.id||
            null,

          champion:
            champion?.name||
            null,

          top4:
            order
              .slice(0,4)
              .map(x=>x.id),

          bottom3:
            order
              .slice(-3)
              .map(x=>x.id)
        });
      }
    }

    w.history=
      w.history.slice(
        0,
        HISTORY_LIMIT
      );

    return w;
  }

  function nextSeason(s){

    const w=
      rootState(s);

    w.season=
      s.season;

    w.leagues={};

    ensureSeason(s);

    return w;
  }

  function history(
    s,
    leagueId
  ){

    const w=
      rootState(s);

    return w.history.filter(
      row=>
        !leagueId ||
        row.leagueId===
          leagueId
    );
  }

  function eligibleLeagues(s){

    return eligibleLeagueData(s)
      .map(item=>({
        ...item.league,
        clubCount:
          item.clubs.length
      }));
  }

  function integrity(s){

    const w=
      ensureSeason(s);

    const issues=[];

    for(
      const [
        leagueId,
        state
      ]
      of Object.entries(
        w.leagues
      )
    ){

      if(
        state.clubIds.length<10
      )
        issues.push(
          leagueId+
          ": fewer than 10 clubs"
        );

      if(
        new Set(
          state.clubIds
        ).size!==
        state.clubIds.length
      )
        issues.push(
          leagueId+
          ": duplicate clubs"
        );

      const schedule=
        makeSchedule(
          state.clubIds
        );

      if(
        state.round<0 ||
        state.round>
          schedule.length
      )
        issues.push(
          leagueId+
          ": invalid round"
        );

      for(
        const id
        of state.clubIds
      ){

        const row=
          state.table[id];

        if(
          !Array.isArray(row) ||
          row.length!==7
        )
          issues.push(
            leagueId+
            ": invalid table row "+
            id
          );
      }

      const seen=
        new Set();

      for(const score of state.scores){

        const key=
          score[0]+
          ":"+
          score[1];

        if(seen.has(key))
          issues.push(
            leagueId+
            ": duplicate result "+
            key
          );

        seen.add(key);
      }
    }

    return {
      ok:issues.length===0,
      issues,
      season:w.season,
      leagues:
        Object.keys(
          w.leagues
        ).length
    };
  }

  const api={
    VERSION,
    init,
    daily,
    closeSeason,
    nextSeason,
    eligibleLeagues,
    standings,
    results,
    calendar,
    nextFixture,
    history,
    integrity,
    makeSchedule,
    roundDate
  };

  root.ProLifeWorldClubCompetitions=
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
