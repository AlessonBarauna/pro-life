
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
  const worldStats=()=> root.ProLifeWorldStats || (typeof require==="function" ? require("./world-stats.js") : null);
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

  // Calendario europeu por liga: opt-in para novas edicoes, sem
  // substituir as datas de saves que ainda usam o calendario legado.
  const EuropeanCalendar=()=>root.ProLifeEuropeanCalendar||
    (typeof require==="function"?require("./european-calendar.js"):null);
  function leagueRoundDate(s,leagueId,season,roundIndex,totalRounds){
    const st=s?.globalFootball?.worldCompetitions?.leagues?.[leagueId];
    if(st?.calendarMode==="european_v1"){
      const league=(s.globalFootball?.leagues||[]).find(l=>l.id===leagueId);
      const calculated=EuropeanCalendar()?.resolvedRoundDay?.(league,season,roundIndex,totalRounds);
      if(Number.isFinite(calculated))return calculated;
    }
    return roundDate(season,roundIndex,totalRounds);
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
      // Ligas europeias explicitamente opt-in atravessam 1 de janeiro.
      w.leagues=Object.fromEntries(Object.entries(w.leagues).filter(
        ([,league])=>league?.calendarMode==="european_v1"
      ));
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
        (Number(current.season)!==Number(s.season)&&
         !(current.calendarMode==="european_v1"))
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

  // 34F.21: a forca dos clubes da IA acompanha o elenco atual (mesma formula da criacao do catalogo FC 27: media dos 16 melhores,
  // limitada a 30..99). No inicio da carreira o resultado e identico ao valor original; depois muda com transferencias,
  // aposentadorias e evolucao dos atletas. Somente mundo FC 27; demais mundos mantem a forca original.
  function refreshStrengths(s){
    if(s?.catalogVersion!=="fc27_v1")
      return 0;
    const byClub=new Map();
    for(const player of s.internationalPlayers||[]){
      if(!player || !player.clubId || player.status==="retired" || player.active===false)
        continue;
      const value=Number(player.ovr??player.overall);
      if(!Number.isFinite(value))
        continue;
      let list=byClub.get(player.clubId);
      if(!list){
        list=[];
        byClub.set(player.clubId,list);
      }
      list.push(value);
    }
    let changed=0;
    for(const club of s.globalFootball?.clubs||[]){
      const list=club && byClub.get(club.id);
      // so clubes do catalogo, que ja tinham forca definida (clubes "externos" criados por jogadores soltos ficam como estao)
      if(!list || club.generated===true || !Number.isFinite(Number(club.strength)))
        continue;
      list.sort((a,b)=>b-a);
      const top=list.slice(0,16);
      const next=clamp(
        Math.round(top.reduce((sum,v)=>sum+v,0)/top.length),
        30,
        99
      );
      if(club.strength!==next){
        club.strength=next;
        changed++;
      }
    }
    return changed;
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
        direct+(Number(club.coachBonus)||0),
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

  // 34F.21: sensibilidade a diferenca de forca recalibrada (era 0.032/0.026: um favorito com 14+ pontos de vantagem vencia so ~51%).
  // Medido: gols por jogo, mandante/empate/visitante e demais proporcoes ficam iguais; favorito com 8+ pontos vence ~55% e com 14+ ~65%.
  // 34F.23: estilo do treinador [gols marcados, gols sofridos]; sem treinador definido o fator e 1.
  const STYLE_FACTOR={ofensivo:[1.06,1.06],defensivo:[0.94,0.93],posse:[1.02,0.97],contra_ataque:[0.98,1]};
  const styleFactor=club=>STYLE_FACTOR[club?.coachStyle]||[1,1];
  const HOME_SLOPE=0.045;
  const AWAY_SLOPE=0.038;
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
        diff*HOME_SLOPE,
        0.25,
        3.6
      );

    const awayLambda=
      clamp(
        1.08-
        diff*AWAY_SLOPE,
        0.20,
        3.2
      );

    const hf=styleFactor(hc),af=styleFactor(ac);
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
          clamp(homeLambda*hf[0]*af[1],0.25,3.6),
          rnd
        ),
        0,
        8
      ),
      clamp(
        poisson(
          clamp(awayLambda*af[0]*hf[1],0.20,3.2),
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
          leagueRoundDate(s,leagueId,state.season,roundIndex,schedule.length)
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

      worldStats()?.record?.(s,leagueId,home,away,hg,ag,roundIndex,pairIndex,Array.isArray(official));

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
    s,
    leagueId,
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
        leagueRoundDate(s,leagueId,state.season,i,schedule.length)<=day
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

    progressEuropeanSeasons(s);

    const catalog=
      clubCatalog(s);

    activeHooks=
      hooks||null;
    let refreshed=false;

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

        const due=
          dueRoundCount(
            s,
            leagueId,
            state,
            s.day
          );
        if(!refreshed && due>state.round){
          refreshStrengths(s);
          refreshed=true;
        }
        processUntil(
          s,
          leagueId,
          state,
          due,
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
            leagueRoundDate(s,leagueId,state.season,roundIndex,schedule.length),

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
          leagueRoundDate(s,leagueId,state.season,roundIndex,schedule.length),

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
            leagueRoundDate(s,leagueId,state.season,ri,schedule.length),
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

    refreshStrengths(s);

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

      if(state.status==="finished"||state.calendarMode==="european_v1")
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

  // Finaliza somente a liga cujo calendario terminou. Outras ligas e saves legados
  // continuam independentes; o registro de campeao e idempotente.
  function closeEuropeanLeague(s,leagueId,leagueState){
    if(leagueState.status!=="active"||leagueState.calendarMode!=="european_v1")return false;
    const calendar=EuropeanCalendar();
    const meta=(s.globalFootball?.leagues||[]).find(l=>l.id===leagueId);
    const country=calendar?.leagueCountry?.(meta);
    const window=country&&calendar.seasonWindow(country,leagueState.season);
    if(!window||s.day<window.endDay)return false;
    const schedule=makeSchedule(leagueState.clubIds);
    if(leagueState.round<schedule.length)return false;
    const order=standings(s,leagueId);
    const champion=order[0]||null;
    leagueState.championId=champion?.id||null;
    leagueState.status="finished";
    const w=rootState(s),key=leagueState.season+":"+leagueId;
    if(!w.history.some(h=>h.key===key))w.history.unshift({
      key,season:leagueState.season,leagueId,league:meta?.name||leagueId,
      championId:champion?.id||null,champion:champion?.name||null,
      orderIds:order.map(c=>c.id),top4:order.slice(0,4).map(c=>c.id),bottom3:order.slice(-3).map(c=>c.id)
    });
    w.history=w.history.slice(0,HISTORY_LIMIT);
    return true;
  }
  function progressEuropeanSeasons(s){
    const w=ensureSeason(s),calendar=EuropeanCalendar();
    if(!calendar)return 0;
    let changes=0;
    for(const [leagueId,leagueState] of Object.entries(w.leagues)){
      if(leagueState.calendarMode!=="european_v1")continue;
      if(closeEuropeanLeague(s,leagueId,leagueState))changes++;
      if(leagueState.status!=="finished")continue;
      const meta=(s.globalFootball?.leagues||[]).find(l=>l.id===leagueId);
      const country=calendar.leagueCountry(meta);
      if(!country)continue;
      const next=calendar.seasonWindow(country,leagueState.season+1);
      if(!next||s.day<next.startDay)continue;
      const eligible=eligibleLeagueData(s).find(item=>item.league.id===leagueId);
      if(!eligible)continue;
      const replacement=createLeagueState(leagueState.season+1,eligible.clubs);
      replacement.calendarMode="european_v1";
      w.leagues[leagueId]=replacement;
      changes++;
    }
    return changes;
  }
  function nextSeason(s){

    const w=
      rootState(s);

    w.season=
      s.season;

    w.leagues=Object.fromEntries(Object.entries(w.leagues||{}).filter(
      ([,league])=>league?.calendarMode==="european_v1"
    ));

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

  // 34F.18: cobertura de competicoes por liga. Somente leitura (nao grava no save). Nenhum clube e inventado:
  // ligas com menos de MIN_LEAGUE_CLUBS clubes no catalogo ficam "somente catalogo" e dizem isso explicitamente.
  const MIN_LEAGUE_CLUBS=10;
  const REGIONAL_POOLS=new Set(["gf_fc27_conmebol_libertadores","gf_fc27_conmebol_sudamericana"]);
  const OVERSIZED_LEAGUE=24;

  function coverage(s){
    const groups=clubGroups(s);

    return (s.globalFootball?.leagues||[])
      .filter(league=>league && league.active!==false)
      .map(league=>{
        const count=(groups.get(league.id)||[]).length;
        const eligible=league.competitionEligible!==false;
        const row={
          leagueId:league.id,
          name:league.name||league.id,
          country:league.country||null,
          clubCount:count,
          status:"playable",
          format:"double-round-robin",
          rounds:0,
          note:""
        };

        if(!eligible || count<MIN_LEAGUE_CLUBS){
          row.status="catalog_only";
          row.format=null;
          row.note=!eligible
            ? "Competicao desativada para esta carreira."
            : `Somente catalogo: o FC 27 traz apenas ${count} clube${count===1?"":"s"} desta liga (minimo ${MIN_LEAGUE_CLUBS} para um campeonato). Nenhum clube ficticio foi criado; os jogadores continuam no mercado.`;
          return row;
        }

        row.rounds=2*(count%2?count:count-1);

        if(REGIONAL_POOLS.has(league.id)){
          row.status="regional_pool";
          row.note="Grupo regional de clubes de varios paises (nao e uma liga nacional); disputado em pontos corridos.";
        }else if(count>=OVERSIZED_LEAGUE+6){
          row.note=`Formato simplificado: tabela unica com ${count} clubes (sem conferencias ou fase final).`;
        }

        return row;
      })
      .sort((a,b)=>String(a.name).localeCompare(String(b.name),"pt-BR"));
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
    coverage,
    refreshStrengths,
    standings,
    results,
    calendar,
    nextFixture,
    history,
    integrity,
    makeSchedule,
    roundDate,
    leagueRoundDate,
    progressEuropeanSeasons
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
