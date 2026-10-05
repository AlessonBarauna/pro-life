/* PRO LIFE — selectors for the Career Central. No football rules live here. */
(function (root) {
  "use strict";
  function sortedOwnMatches(s) {
    return (s.matches || []).filter((m) => m.home === s.clubId || m.away === s.clubId)
      .slice().sort((a,b)=>(b.date ?? b.day ?? 0)-(a.date ?? a.day ?? 0));
  }
  function resultFor(s, match) {
    if (!match || !s.clubId) return null;
    const own = match.home === s.clubId ? match.hg : match.ag;
    const other = match.home === s.clubId ? match.ag : match.hg;
    return own > other ? "V" : own < other ? "D" : "E";
  }
  function tableWindow(s, D) {
    const c = D.club(s); if (!c) return { rows: [], position: 0, league: "" };
    const table = D.table(s), index = table.findIndex((x)=>x.id===c.id);
    if (index < 0) return { rows: [], position: 0, league: "" };
    const start = Math.max(0, Math.min(index - 2, table.length - 5));
    return { rows: table.slice(start, start + 5).map((row,i)=>({...row, position:start+i+1})), position:index+1, league:s.leagues.find((l)=>l.id===c.leagueId)?.name || c.leagueId };
  }
  function nextInfo(s, D) {
    const fixture = D.nextCommitment(s); if (!fixture) return null;
    const national = fixture.competitionId === "nationalTeam";
    const c = D.club(s);
    const home = national ? fixture.homeName : D.club(s, fixture.home)?.name;
    const away = national ? fixture.awayName : D.club(s, fixture.away)?.name;
    const opponent = national ? fixture.opponent : D.club(s, fixture.home === s.clubId ? fixture.away : fixture.home)?.name;
    return { ...fixture, national, home:home || "—", away:away || "—", opponent:opponent || "—", stage:D.Competitions?.fixtureStage?.(s,fixture) || fixture.stage || (fixture.round ? `Rodada ${fixture.round}` : "Próximo compromisso") };
  }
  function snapshot(s, D, Calendar) {
    const c=D.club(s), career=D.Career.init(s), stats=D.Statistics?.heroDashboard?.(s), current=stats?.currentClubSeason || stats?.season || {}, plan=D.Training.init(s), next=nextInfo(s,D), table=tableWindow(s,D), matches=sortedOwnMatches(s), pc=career.playerCareer || {};
    const recent=matches.slice(0,5).map((m)=>{
      const home=D.club(s,m.home), away=D.club(s,m.away);
      const goals=(m.events||[]).filter(e=>e.type==="goal").map(e=>{
        const scorer=(e.player || (home?.roster||[]).concat(away?.roster||[]).find(p=>p.id===e.playerId)?.name || "Jogador");
        const assist=e.assistPlayerId ? ((home?.roster||[]).concat(away?.roster||[]).find(p=>p.id===e.assistPlayerId)?.name || null) : null;
        return {minute:e.minute, scorer, assist, side:e.side};
      });
      const rated=Object.entries(m.ratings||{}).sort((a,b)=>Number(b[1])-Number(a[1]));
      const motm=rated.length ? (()=>{
        const [id,rating]=rated[0], player=(home?.roster||[]).concat(away?.roster||[]).find(p=>p.id===id);
        return {name:player?.name || (id==="hero"?s.person.name:"Jogador"),rating:Number(rating)};
      })() : null;
      const heroStats=m.playerStats?.hero, heroGoals=goals.filter(g=>(m.events||[]).some(e=>e.type==="goal"&&e.playerId==="hero"&&e.minute===g.minute)).length;
      const heroAssists=(m.events||[]).filter(e=>e.type==="goal"&&e.assistPlayerId==="hero").length;
      return { match:m, result:resultFor(s,m), rating:Number(m.ratings?.hero || 0) || null,
        opponent:D.club(s,m.home===s.clubId?m.away:m.home)?.name || "Adversário",
        home:home?.name||"Mandante", away:away?.name||"Visitante", score:`${m.hg}–${m.ag}`,
        competition:m.competitionName||m.leagueName||"Partida", date:m.date, goals, motm,
        hero:heroStats?{played:true,starter:heroStats.starter!==false,entryMinute:heroStats.entryMinute||0,minutes:heroStats.minutes||0,goals:heroGoals,assists:heroAssists,rating:Number(m.ratings?.hero||0)||null}:{played:false}
      };
    });
    const events=(Calendar?.events?.(s,D)||[]).filter((e)=>e.day>=s.day && ["club","state","cup","national","event"].includes(e.type)).slice(0,5);
    const objectives=s.mode==="player" && s.clubId ? D.Career.matchObjectives(s) : [];
    const news=(s.news||[]).slice().sort((a,b)=>(b.day||0)-(a.day||0)).slice(0,4);
    const messages=[...(s.decision?[{day:s.day,title:s.decision.title,body:s.decision.body,kind:"decision"}]:[]), ...news].slice(0,4);
    const active=plan.activeMultiplier && plan.activeMultiplier.expiresDay>=s.day ? plan.activeMultiplier : null;
    let lineup=s.mode==="player" && s.clubId && !next?.national && D.Squad?.competition ? D.Squad.competition(s) : null;
    if(lineup && !s.person.injury && !(s.person.suspension>0) && s.person.condition>35){
      const hierarchy=pc.squadRole||"Fora dos planos", selection=lineup.selection;
      const inXI=selection.starters.some(p=>p.id==="hero"), inBench=selection.bench.some(p=>p.id==="hero");
      if(["Titular","Importante","Estrela"].includes(hierarchy) && !inXI){
        const oldBench=selection.bench.filter(p=>p.id!=="hero");
        let candidates=selection.starters.map((p,i)=>({p,i})).filter(x=>x.p.pos===s.person.pos);
        if(!candidates.length) candidates=selection.starters.map((p,i)=>({p,i}));
        candidates.sort((a,b)=>D.overall(a.p)-D.overall(b.p));
        const idx=candidates[0]?.i ?? selection.starters.length-1, displaced=selection.starters[idx];
        selection.starters=[...selection.starters];
        selection.starters[idx]=s.person;
        selection.bench=oldBench;
        if(displaced) selection.bench=[displaced,...selection.bench].slice(0,7);
      } else if(["Reserva","Rotação"].includes(hierarchy) && !inXI && !inBench){
        selection.bench=[...selection.bench.filter(p=>p.id!=="hero"),s.person].slice(-7);
      }
      lineup={...lineup,heroRole:D.Squad.roleForHero(s,selection),selection,hierarchyApplied:true};
    }
    const subPlan=lineup?.heroRole==="Banco" && D.Squad?.substitutePlan ? D.Squad.substitutePlan(s,s.person) : null;
    const leadership=D.captaincy?.(s,c) || null;
    return { c, career, stats, current, plan, next, table, recent, events, objectives, news, messages, active, lineup, subPlan, leadership,
      player:{ name:s.person.name, pos:s.person.pos, age:s.person.age, overall:D.overall(s.person), condition:s.person.condition, morale:s.person.morale, form:recent.filter(x=>x.rating).length ? +(recent.filter(x=>x.rating).reduce((n,x)=>n+x.rating,0)/recent.filter(x=>x.rating).length).toFixed(1) : null, marketValue:pc.marketValue||0, squadRole:pc.squadRole||null },
      unread:s.decision?1:0,
      training:{ focus:D.Training.skills[s.training] || (s.training==="balanced"?"Equilibrado":s.training), intensity:{rest:"Recuperação",normal:"Normal",hard:"Intensa"}[s.intensity]||s.intensity, sessions:plan.sessions||0, improvements:plan.improvements||0, recent:active ? `${D.Training.trainingCategories[active.category]?.name || "Treino"} · nota ${active.grade}` : "Sem bônus temporário ativo", next:s.person.injury ? `Após ${s.person.injury} dia(s) de recuperação` : "Disponível na rotina diária" }
    };
  }
  root.ProLifeHomeDashboard={ snapshot, tableWindow, sortedOwnMatches, resultFor };
  if(typeof module!=="undefined"&&module.exports) module.exports=root.ProLifeHomeDashboard;
})(typeof globalThis!=="undefined"?globalThis:this);
