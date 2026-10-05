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
    const recent=matches.slice(0,5).map((m)=>({ match:m, result:resultFor(s,m), rating:Number(m.ratings?.hero || 0) || null, opponent:D.club(s,m.home===s.clubId?m.away:m.home)?.name || "Adversário" }));
    const events=(Calendar?.events?.(s,D)||[]).filter((e)=>e.day>=s.day && ["club","state","cup","national","event"].includes(e.type)).slice(0,5);
    const objectives=s.mode==="player" && s.clubId ? D.Career.matchObjectives(s) : [];
    const news=(s.news||[]).slice().sort((a,b)=>(b.day||0)-(a.day||0)).slice(0,4);
    const messages=[...(s.decision?[{day:s.day,title:s.decision.title,body:s.decision.body,kind:"decision"}]:[]), ...news].slice(0,4);
    const active=plan.activeMultiplier && plan.activeMultiplier.expiresDay>=s.day ? plan.activeMultiplier : null;
    return { c, career, stats, current, plan, next, table, recent, events, objectives, news, messages, active,
      player:{ name:s.person.name, pos:s.person.pos, age:s.person.age, overall:D.overall(s.person), condition:s.person.condition, morale:s.person.morale, form:recent.filter(x=>x.rating).length ? +(recent.filter(x=>x.rating).reduce((n,x)=>n+x.rating,0)/recent.filter(x=>x.rating).length).toFixed(1) : null, marketValue:pc.marketValue||0, squadRole:pc.squadRole||null },
      unread:s.decision?1:0,
      training:{ focus:D.Training.skills[s.training] || (s.training==="balanced"?"Equilibrado":s.training), intensity:{rest:"Recuperação",normal:"Normal",hard:"Intensa"}[s.intensity]||s.intensity, sessions:plan.sessions||0, improvements:plan.improvements||0, recent:active ? `${D.Training.trainingCategories[active.category]?.name || "Treino"} · nota ${active.grade}` : "Sem bônus temporário ativo", next:s.person.injury ? `Após ${s.person.injury} dia(s) de recuperação` : "Disponível na rotina diária" }
    };
  }
  root.ProLifeHomeDashboard={ snapshot, tableWindow, sortedOwnMatches, resultFor };
  if(typeof module!=="undefined"&&module.exports) module.exports=root.ProLifeHomeDashboard;
})(typeof globalThis!=="undefined"?globalThis:this);
