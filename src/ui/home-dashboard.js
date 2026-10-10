/* PRO LIFE — selectors for the Career Central. No football rules live here. */
(function (root) {
  "use strict";
  function sortedOwnMatches(s) {
    return (s.matches || []).filter((m) => m.home === s.clubId || m.away === s.clubId)
      .slice().sort((a,b)=>(b.date ?? b.day ?? 0)-(a.date ?? a.day ?? 0));
  }
  function validRating(value) {
    const rating=Number(value);
    return Number.isFinite(rating) && rating>=1 && rating<=10 ? rating : null;
  }
  function recentEntries(s) {
    const entries=sortedOwnMatches(s).map((match,index)=>({ kind:"club", match, day:Number(match.date ?? match.day ?? 0)||0, index }));
    if (s.mode === "player" && Array.isArray(s.nationalTeam?.matches)) {
      entries.push(...s.nationalTeam.matches.map((match,index)=>({ kind:"national", match, day:Number(match.day ?? 0)||0, index })));
    }
    const seen=new Set();
    return entries.sort((a,b)=>b.day-a.day || (a.kind===b.kind ? a.index-b.index : a.kind.localeCompare(b.kind))).filter((entry)=>{
      const m=entry.match;
      const key=entry.kind==="national"
        ? `national:${m.season??""}:${m.day??""}:${m.competition??""}:${m.opponent??""}:${m.brazil??""}:${m.other??""}`
        : `club:${m.id??`${m.season??""}:${m.date??m.day??""}:${m.home??""}:${m.away??""}:${m.competitionId??m.leagueId??""}`}`;
      if(seen.has(key)) return false;
      seen.add(key); return true;
    }).slice(0,5);
  }
  function nationalGoals(m) {
    if(!Array.isArray(m?.events)) return null;
    return m.events.filter((e)=>e&&Number.isFinite(Number(e.minute))).map((e)=>({minute:Number(e.minute),scorer:e.scorer||null,assist:e.assist||null,side:e.side===1?1:0})).sort((a,b)=>a.minute-b.minute);
  }
  function nationalMotm(m) {
    const k=m?.motm;
    if(!k||k.id===undefined||k.id===null||!k.name||validRating(k.rating)===null) return null;
    if(Array.isArray(m.players)) {
      const rated=m.players.filter((r)=>Array.isArray(r)&&Number(r[4])>0&&validRating(r[5])!==null);
      const row=rated.find((r)=>r[0]===k.id);
      if(rated.length<2||!row||Number(row[5])!==Number(k.rating)||Number(k.rating)<Math.max(...rated.map((r)=>Number(r[5])))) return null;
    }
    return {name:k.name,rating:Number(k.rating),side:k.side===1?1:0};
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
    const c=D.club(s), career=D.Career.init(s), stats=D.Statistics?.heroDashboard?.(s), current=stats?.currentClubSeason || stats?.season || {}, plan=D.Training.init(s), next=nextInfo(s,D), table=tableWindow(s,D), pc=career.playerCareer || {};
    const recent=recentEntries(s).map(({kind,match:m})=>{
      if(kind==="national") {
        const rating=validRating(m.rating), starter=!!m.starter, brazil=Number(m.brazil), other=Number(m.other), hasScore=Number.isFinite(brazil)&&Number.isFinite(other);
        return { match:m, national:true, result:hasScore?(brazil>other?"V":brazil<other?"D":"E"):null, rating,
          opponent:m.opponent||"Adversário", home:"Brasil", away:m.opponent||"Adversário", score:hasScore?`${brazil}–${other}`:"—",
          competition:m.competition||"Seleção Brasileira", date:m.day, goals:nationalGoals(m), motm:nationalMotm(m),
          hero:{played:true,starter,entryMinute:starter?0:(m.entryMinute!==null&&m.entryMinute!==undefined&&Number.isFinite(Number(m.entryMinute))?Number(m.entryMinute):null),minutes:Math.max(0,Number(m.minutes)||0),goals:Math.max(0,Number(m.goals)||0),assists:Math.max(0,Number(m.assists)||0),rating}
        };
      }
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
      const rating=validRating(m.ratings?.hero);
      return { match:m, national:false, result:resultFor(s,m), rating,
        opponent:D.club(s,m.home===s.clubId?m.away:m.home)?.name || "Adversário",
        home:home?.name||"Mandante", away:away?.name||"Visitante", score:`${m.hg}–${m.ag}`,
        competition:m.competitionName||m.leagueName||"Partida", date:m.date, goals, motm,
        hero:heroStats?{played:true,starter:heroStats.starter!==false,entryMinute:heroStats.entryMinute||0,minutes:heroStats.minutes||0,goals:heroGoals,assists:heroAssists,rating}:{played:false}
      };
    });
    const events=(Calendar?.events?.(s,D)||[]).filter((e)=>e.day>=s.day && ["club","state","cup","national","event"].includes(e.type)).slice(0,5);
    const objectives=s.mode==="player" && s.clubId ? D.Career.matchObjectives(s) : [];
    const news=(s.news||[]).slice().sort((a,b)=>(b.day||0)-(a.day||0)).slice(0,4);
    const messages=[...(s.decision?[{day:s.day,title:s.decision.title,body:s.decision.body,kind:"decision"}]:[]), ...news].slice(0,4);
    const active=plan.activeMultiplier && plan.activeMultiplier.expiresDay>=s.day ? plan.activeMultiplier : null;
    const lineup=s.mode==="player" && s.clubId && !next?.national && D.Squad?.competition ? D.Squad.competition(s) : null;
    const subPlan=lineup?.heroRole==="Banco" && D.Squad?.substitutePlan ? D.Squad.substitutePlan(s,s.person) : null;
    const leadership=D.captaincy?.(s,c) || null;
    return { c, career, stats, current, plan, next, table, recent, events, objectives, news, messages, active, lineup, subPlan, leadership,
      player:{ name:s.person.name, pos:s.person.pos, age:s.person.age, overall:D.overall(s.person), condition:s.person.condition, morale:s.person.morale, form:(()=>{const ratings=recent.map(x=>validRating(x.rating)).filter(x=>x!==null);return ratings.length?+(ratings.reduce((n,x)=>n+x,0)/ratings.length).toFixed(1):null;})(), marketValue:pc.marketValue||0, squadRole:pc.squadRole||null },
      unread:s.decision?1:0,
      training:{ focus:D.Training.skills[s.training] || (s.training==="balanced"?"Equilibrado":s.training), intensity:{rest:"Recuperação",normal:"Normal",hard:"Intensa"}[s.intensity]||s.intensity, sessions:plan.sessions||0, improvements:plan.improvements||0, recent:active ? `${D.Training.trainingCategories[active.category]?.name || "Treino"} · nota ${active.grade}` : "Sem bônus temporário ativo", next:s.person.injury ? `Após ${s.person.injury} dia(s) de recuperação` : "Disponível na rotina diária" }
    };
  }
  root.ProLifeHomeDashboard={ snapshot, tableWindow, sortedOwnMatches, recentEntries, resultFor };
  if(typeof module!=="undefined"&&module.exports) module.exports=root.ProLifeHomeDashboard;
})(typeof globalThis!=="undefined"?globalThis:this);
