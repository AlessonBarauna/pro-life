(function (root) {
  "use strict";
  const fields = ["appearances", "starts", "minutes", "goals", "assists", "motm", "ratingTotal", "saves", "tackles", "shots", "onTarget", "xg", "yellowCards", "redCards"];
  const blank = () => ({ appearances: 0, starts: 0, minutes: 0, goals: 0, assists: 0, motm: 0, ratingTotal: 0, saves: 0, tackles: 0, shots: 0, onTarget: 0, xg: 0, yellowCards: 0, redCards: 0, byCompetition: {}, byClub: {} });
  function normalize(row) {
    const value = row || blank();
    for (const key of fields) if (!Number.isFinite(value[key])) value[key] = 0;
    if (!value.byCompetition || typeof value.byCompetition !== "object") value.byCompetition = {};
    if (!value.byClub || typeof value.byClub !== "object") value.byClub = {};
    return value;
  }
  function competitionRow(row, id) {
    const normalized = normalize(row), key = id || "career";
    const value = normalized.byCompetition[key] || (normalized.byCompetition[key] = {});
    for (const field of fields) if (!Number.isFinite(value[field])) value[field] = 0;
    return value;
  }
  function heroSnapshotFromMatches(s, season) {
    const matches=(s.matches||[]).filter((m)=>m.season===season && Array.isArray(m.participants) && m.participants.flat().includes("hero"));
    let goals=0, assists=0, motm=0, ratingTotal=0, rated=0;
    for (const m of matches) {
      for (const event of m.events||[]) {
        if (event.type==="goal" && event.playerId==="hero") goals++;
        if (event.assistPlayerId==="hero") assists++;
      }
      const rating=Number(m.ratings?.hero);
      if (Number.isFinite(rating) && rating>0) { ratingTotal+=rating; rated++; }
      const best=Object.entries(m.ratings||{}).sort((a,b)=>Number(b[1]||0)-Number(a[1]||0))[0];
      if (best?.[0]==="hero" && Number(best[1])>=7.5) motm++;
    }
    return { appearances:matches.length, goals, assists, motm, averageRating:rated ? +(ratingTotal/rated).toFixed(2) : 0 };
  }
  function repairSeasonSnapshots(s) {
    if (!Array.isArray(s.statistics?.seasons)) return;
    for (const archived of s.statistics.seasons) {
      if (!archived || !Number.isFinite(archived.season)) continue;
      const player=archived.player || (archived.player={});
      const recovered=heroSnapshotFromMatches(s, archived.season);
      const history=(s.history||[]).filter((h)=>h.season===archived.season);
      const historyGoals=Math.max(0,...history.map((h)=>Number(h.goals)||0));
      const historyMinutes=Math.max(0,...history.map((h)=>Number(h.minutes)||0));
      if (!(player.appearances>0) && recovered.appearances>0) player.appearances=recovered.appearances;
      if (!(player.goals>0)) player.goals=recovered.goals || historyGoals || 0;
      if (!(player.assists>0) && recovered.assists>0) player.assists=recovered.assists;
      if (!(player.motm>0) && recovered.motm>0) player.motm=recovered.motm;
      if (!(player.averageRating>0) && recovered.averageRating>0) player.averageRating=recovered.averageRating;
      if (!(player.minutes>0) && historyMinutes>0) player.minutes=historyMinutes;
    }
  }
  function init(s) {
    if (!s.statistics) s.statistics = { players: {}, awards: [], seasons: [] };
    if (!s.statistics.players) s.statistics.players={};
    if (!Array.isArray(s.statistics.awards)) s.statistics.awards=[];
    if (!Array.isArray(s.statistics.seasons)) s.statistics.seasons=[];
    if (!Array.isArray(s.statistics.heroStints)) s.statistics.heroStints=[];
    if (!Array.isArray(s.statistics.processedMatches)) s.statistics.processedMatches=[];
    if (s.statistics.processedMatches.length) s.statistics.processedMatches=[];
    if (!Array.isArray(s.statistics.milestones)) s.statistics.milestones=[];
    if (!s.statistics.records || typeof s.statistics.records !== "object") s.statistics.records={};
    for (const [id, row] of Object.entries(s.statistics.players || {})) s.statistics.players[id] = normalize(row);
    repairSeasonSnapshots(s);
    const hero = s.statistics.players.hero || (s.statistics.players.hero = blank());
    return { root: s.statistics, hero };
  }
  function add(stats, id, competitionId, field, value = 1) {
    const row = stats.players[id] || (stats.players[id] = blank());
    if (!Number.isFinite(row[field])) row[field]=0;
    row[field] += value;
    const cr=competitionRow(row, competitionId); if (!Number.isFinite(cr[field])) cr[field]=0; cr[field] += value;
  }
  function ensureHeroStint(s, clubId = s.clubId) {
    const stats=init(s).root;
    if (!clubId || s.mode !== "player") return null;
    let stint=stats.heroStints.find((x)=>x.season===s.season && x.clubId===clubId && x.endDay==null);
    if (!stint) {
      const c=s.clubs.find((x)=>x.id===clubId);
      stint={ season:s.season, clubId, club:c?.name||clubId, startDay:s.day, endDay:null, transferType:"current" };
      for (const f of fields) stint[f]=0;
      stats.heroStints.push(stint);
    }
    return stint;
  }
  function closeHeroStint(s, clubId = s.clubId, transferType = "transfer") {
    const stats=init(s).root;
    const stint=stats.heroStints.find((x)=>x.season===s.season && x.clubId===clubId && x.endDay==null);
    if (stint) { stint.endDay=s.day; stint.transferType=transferType; }
    return stint||null;
  }
  function addToStint(stint, field, value=1) {
    if (!stint) return;
    if (!Number.isFinite(stint[field])) stint[field]=0;
    stint[field]+=value;
  }
  function migrateHeroTenureLedger(s) {
    const stats=init(s).root;
    if (s.mode !== "player") return stats.heroStints;
    const own=(s.extras?.transfers||[]).filter((t)=>t.player===s.person?.name && Number.isFinite(t.season)).slice().sort((a,b)=>a.season-b.season || Number(a.day||0)-Number(b.day||0));
    if (!own.length) { ensureHeroStint(s); return stats.heroStints; }
    const byName=(name)=>s.clubs.find((c)=>c.name===name)?.id || null;
    const first=own[0], firstFrom=byName(first.from);
    let clubId=firstFrom || byName(first.to) || s.clubId;
    let season=Math.min(2026, Number(first.season)||2026);
    let startDay=0;
    const wanted=[];
    const add=(yr,id,sd,ed,type)=>{ if(!id) return; const c=s.clubs.find((x)=>x.id===id); wanted.push({season:yr,clubId:id,club:c?.name||id,startDay:sd,endDay:ed,transferType:type}); };
    for(const tr of own){
      const trSeason=Number(tr.season), trDay=Number(tr.day||0), fromId=byName(tr.from)||clubId, toId=byName(tr.to);
      while(season<trSeason){ add(season,clubId,startDay,null,"season"); season++; startDay=0; }
      if(fromId && fromId!==clubId) clubId=fromId;
      add(trSeason,clubId,startDay,trDay,tr.transferType||"transfer");
      clubId=toId||clubId; season=trSeason; startDay=trDay;
    }
    while(season<s.season){ add(season,clubId,startDay,null,"season"); season++; startDay=0; }
    add(s.season,clubId||s.clubId,startDay,null,"current");
    for(const w of wanted){
      let row=stats.heroStints.find((x)=>x.season===w.season && x.clubId===w.clubId && Number(x.startDay||0)===Number(w.startDay||0));
      if(!row){ row={...w}; for(const f of fields) row[f]=0; stats.heroStints.push(row); }
      else { row.club=w.club; row.startDay=w.startDay; row.endDay=w.endDay; row.transferType=w.transferType; }
    }
    return stats.heroStints;
  }
  function heroStintHistory(s) {
    const stats=init(s).root;
    migrateHeroTenureLedger(s);
    const rows=stats.heroStints.slice();
    const grouped=new Map();
    for(const m of s.matches||[]) {
      if (!Number.isFinite(m?.season) || !Array.isArray(m.participants) || !m.participants.flat().includes("hero")) continue;
      const clubId=(m.participants?.[0]||[]).includes("hero") ? m.home : (m.participants?.[1]||[]).includes("hero") ? m.away : null;
      if (!clubId) continue;
      const key=`${m.season}:${clubId}`;
      let r=grouped.get(key);
      if (!r) { r={}; for(const f of fields) r[f]=0; grouped.set(key,r); }
      r.appearances++; r.starts+=m.playerStats?.hero?.starter===false?0:1; r.minutes+=Number(m.playerStats?.hero?.minutes||90);
      const rating=Number(m.ratings?.hero||0); if(rating>0) r.ratingTotal+=rating;
      r.goals+=(m.events||[]).filter(e=>e.type==="goal"&&e.playerId==="hero").length;
      r.assists+=(m.events||[]).filter(e=>e.assistPlayerId==="hero").length;
      const a=m.offensiveStats?.hero||{}; r.shots+=Number(a.shots||0); r.onTarget+=Number(a.onTarget||0); r.xg+=Number(a.xg||0);
      r.tackles+=Number(m.playerStats?.hero?.tackles||0); r.saves+=Number(m.playerStats?.hero?.saves||0);
      r.yellowCards+=(m.events||[]).filter(e=>e.type==="yellow"&&e.playerId==="hero").length;
      r.redCards+=(m.events||[]).filter(e=>e.type==="red"&&e.playerId==="hero").length;
    }
    for(const row of rows){
      const recovered=grouped.get(`${row.season}:${row.clubId}`);
      if(recovered) for(const f of fields) row[f]=recovered[f];
    }
    return rows.filter((r)=>r.clubId).sort((a,b)=>b.season-a.season || Number(a.startDay??-1)-Number(b.startDay??-1));
  }
  function matchKey(m) { if(!Number.isFinite(m?.season)||!Number.isFinite(m?.date)||!m?.home||!m?.away) return null; return [m.season,m.date,m.competitionId||m.leagueId||"career",m.round??"",m.home,m.away].join(":"); }
  function recordMatch(s, m) {
    const stats = init(s).root, key=matchKey(m);
    if (m._sr === 1) return false;
    if(key) m._sr=1;
    const competitionId = m.competitionId || m.leagueId || "career";
    for (const ids of m.participants || []) for (const id of new Set(ids)) {
      if (id === "hero" && !Number.isFinite(Number(m.ratings?.hero))) continue;
      add(stats, id, competitionId, "appearances");
      add(stats, id, competitionId, "ratingTotal", Number(m.ratings?.[id] || 0));
      if (id === "hero") {
        const perf=m.playerStats?.hero||{}, minutes=Number(perf.minutes||0);
        if(perf.starter!==false) add(stats,id,competitionId,"starts");
        add(stats,id,competitionId,"minutes",minutes||90);
      }
    }
    for (const e of m.events || []) {
      if (e.type === "goal" && e.playerId) add(stats, e.playerId, competitionId, "goals");
      if (e.assistPlayerId) add(stats, e.assistPlayerId, competitionId, "assists");
    }
    for (const [id, performance] of Object.entries(m.playerStats || {})) {
      if (Number.isFinite(performance.saves) && performance.saves > 0) add(stats, id, competitionId, "saves", performance.saves);
      if (Number.isFinite(performance.tackles) && performance.tackles > 0) add(stats, id, competitionId, "tackles", performance.tackles);
    }
    for (const [id, attack] of Object.entries(m.offensiveStats || {})) {
      if (Number.isFinite(attack.shots)) add(stats, id, competitionId, "shots", attack.shots);
      if (Number.isFinite(attack.onTarget)) add(stats, id, competitionId, "onTarget", attack.onTarget);
      if (Number.isFinite(attack.xg)) add(stats, id, competitionId, "xg", attack.xg);
    }
    for (const e of m.events || []) {
      if (e.playerId && e.type === "yellow") add(stats, e.playerId, competitionId, "yellowCards");
      if (e.playerId && e.type === "red") add(stats, e.playerId, competitionId, "redCards");
    }
    if (m.ratings?.hero) {
      const hero=stats.players.hero, clubId=(m.participants?.[0]||[]).includes("hero") ? m.home : (m.participants?.[1]||[]).includes("hero") ? m.away : s.clubId;
      const c=hero.byClub[clubId] || (hero.byClub[clubId]={});
      for (const f of fields) if (!Number.isFinite(c[f])) c[f]=0;
      c.appearances++; c.starts+=m.playerStats?.hero?.starter===false?0:1; c.minutes+=Number(m.playerStats?.hero?.minutes||90); c.ratingTotal+=Number(m.ratings.hero||0);
      c.goals+=(m.events||[]).filter(e=>e.type==="goal"&&e.playerId==="hero").length;
      c.assists+=(m.events||[]).filter(e=>e.assistPlayerId==="hero").length;
      const a=m.offensiveStats?.hero||{}; c.shots+=Number(a.shots||0); c.onTarget+=Number(a.onTarget||0); c.xg+=Number(a.xg||0);
      c.tackles+=Number(m.playerStats?.hero?.tackles||0); c.saves+=Number(m.playerStats?.hero?.saves||0);
      c.yellowCards+=(m.events||[]).filter(e=>e.type==="yellow"&&e.playerId==="hero").length; c.redCards+=(m.events||[]).filter(e=>e.type==="red"&&e.playerId==="hero").length;
      const stint=ensureHeroStint(s,clubId);
      addToStint(stint,"appearances"); if(m.playerStats?.hero?.starter!==false)addToStint(stint,"starts"); addToStint(stint,"minutes",Number(m.playerStats?.hero?.minutes||90)); addToStint(stint,"ratingTotal",Number(m.ratings.hero||0));
      addToStint(stint,"goals",(m.events||[]).filter(e=>e.type==="goal"&&e.playerId==="hero").length);
      addToStint(stint,"assists",(m.events||[]).filter(e=>e.assistPlayerId==="hero").length);
      addToStint(stint,"shots",Number(a.shots||0)); addToStint(stint,"onTarget",Number(a.onTarget||0)); addToStint(stint,"xg",Number(a.xg||0));
      addToStint(stint,"tackles",Number(m.playerStats?.hero?.tackles||0)); addToStint(stint,"saves",Number(m.playerStats?.hero?.saves||0));
      addToStint(stint,"yellowCards",(m.events||[]).filter(e=>e.type==="yellow"&&e.playerId==="hero").length); addToStint(stint,"redCards",(m.events||[]).filter(e=>e.type==="red"&&e.playerId==="hero").length);
    }
    const best = Object.entries(m.ratings || {}).sort((a, b) => b[1] - a[1])[0];
    if (best && best[1] >= 7.5) add(stats, best[0], competitionId, "motm");
    if (m.ratings?.hero) {
      const heroHome=(m.participants?.[0]||[]).includes("hero"), gf=heroHome?m.hg:m.ag, ga=heroHome?m.ag:m.hg;
      add(stats,"hero",competitionId,gf>ga?"wins":gf===ga?"draws":"losses");
      const heroGoals=(m.events||[]).filter(e=>e.type==="goal"&&e.playerId==="hero").length;
      if(heroGoals>=3) add(stats,"hero",competitionId,"hatTricks");
      if(ga===0 && ["GOL","DEF"].includes(s.person?.pos)) add(stats,"hero",competitionId,"cleanSheets");
      updateCareerMeta(s,m,heroGoals);
    }
    return true;
  }
  function playerAndClub(s, id) {
    if (id === "hero") return { player: s.person, club: s.clubs.find((c) => c.roster.some((x) => x.id === id)) };
    for (const club of s.clubs) {
      const player = club.roster.find((x) => x.id === id);
      if (player) return { player, club };
    }
    return {};
  }
  function leaders(s, field, limit = 10, competitionId = null) {
    return Object.entries(init(s).root.players).map(([id, row]) => {
      const source = competitionId ? normalize(row).byCompetition[competitionId] : row;
      const { player, club } = playerAndClub(s, id);
      return { id, name: player?.name || "Atleta", age: player?.age ?? 99, club: club?.name || "—", clubId: club?.id || null, value: source?.[field] || 0, appearances: source?.appearances || 0, ratingTotal: source?.ratingTotal || 0 };
    }).filter((x) => x.value > 0 || x.appearances > 0).sort((a, b) => b.value - a.value || b.appearances - a.appearances || a.name.localeCompare(b.name)).slice(0, limit);
  }
  function bestRated(s, competitionId = null, minimum = 5) {
    return Object.entries(init(s).root.players).map(([id, row]) => {
      const source = competitionId ? normalize(row).byCompetition[competitionId] : normalize(row), { player, club } = playerAndClub(s, id);
      return { id, name: player?.name || "Atleta", age: player?.age ?? 99, club: club?.name || "—", clubId: club?.id || null, value: source?.appearances ? +(source.ratingTotal / source.appearances).toFixed(2) : 0, appearances: source?.appearances || 0 };
    }).filter((x) => x.appearances >= minimum).sort((a, b) => b.value - a.value || b.appearances - a.appearances)[0] || null;
  }
  function bestYoung(s, competitionId = null) {
    return Object.entries(init(s).root.players).map(([id, row]) => {
      const { player, club } = playerAndClub(s, id), source = competitionId ? normalize(row).byCompetition[competitionId] : normalize(row);
      if (!source) return null;
      return { id, name: player?.name || "Atleta", age: player?.age ?? 99, club: club?.name || "—", clubId: club?.id || null, value: source.appearances ? +(source.ratingTotal / source.appearances).toFixed(2) : 0, appearances: source.appearances };
    }).filter(Boolean).filter((item) => item.age <= 21 && item.appearances >= (competitionId ? 2 : 5)).sort((a, b) => b.value - a.value || b.appearances - a.appearances)[0] || null;
  }
  function teamOfSeason(s, competitionId, minimum = 2) {
    const candidates = Object.entries(init(s).root.players).map(([id, row]) => {
      const source = competitionId ? normalize(row).byCompetition[competitionId] : normalize(row), { player, club } = playerAndClub(s, id);
      if (!source) return null;
      if (!player || source.appearances < minimum) return null;
      const average = source.appearances ? source.ratingTotal / source.appearances : 0, position = player.pos || "MEI",
        goals = source.goals || 0, assists = source.assists || 0, motm = source.motm || 0, saves = source.saves || 0, tackles = source.tackles || 0;
      const contribution = position === "GOL"
        ? saves * 0.7 + assists * 1.2 + motm * 2
        : position === "DEF"
          ? tackles * 0.34 + goals * 1.8 + assists * 1.2 + motm * 2
          : position === "MEI"
            ? assists * 2 + goals * 1.45 + tackles * 0.16 + motm * 2
            : goals * 2.2 + assists * 1.45 + motm * 2;
      return { id, name: player.name, club: club?.name || "—", clubId: club?.id || null, position, appearances: source.appearances, average: +average.toFixed(2), goals, assists, saves, tackles, score: +(average * 10 + contribution).toFixed(2) };
    }).filter(Boolean);
    const chosen = [], slots = { GOL: 1, DEF: 4, MEI: 3, ATA: 3 };
    for (const [position, amount] of Object.entries(slots)) chosen.push(...candidates.filter((player) => player.position === position).sort((a, b) => b.score - a.score || b.appearances - a.appearances || a.name.localeCompare(b.name)).slice(0, amount));
    if (chosen.length < 11) chosen.push(...candidates.filter((player) => !chosen.some((selected) => selected.id === player.id)).sort((a, b) => b.score - a.score).slice(0, 11 - chosen.length));
    return chosen;
  }
  function competitionName(s, id) {
    if (id === "overall") return "Melhores do ano";
    return root.ProLifeCompetitions?.statCompetitions?.(s).find((item) => item.id === id)?.name || root.ProLifeCompetitions?.leagueNames?.[id] || id;
  }
  function award(s, competitionId, name, winner) {
    return winner && { season: s.season, leagueId: competitionId, competitionId, league: competitionName(s, competitionId), name, winner: winner.name, winnerClub: winner.club, clubId: winner.clubId, value: Number.isFinite(winner.value) ? winner.value : null };
  }
  function compactWinner(item) {
    if (!item) return null;
    const result={};
    for (const key of ["id","name","club","clubId","value","position","average","goals","assists","saves","tackles"]) if (item[key] !== undefined) result[key]=item[key];
    if (Array.isArray(item.coWinners) && item.coWinners.length>1) result.coWinners=item.coWinners.slice(0,8);
    return result;
  }
  function compactArchivedSeason(season, heroName) {
    if (!season || season.compact) return season;
    season.awards=(season.awards||[]).filter((a)=>a.winner===heroName).map((a)=>({season:a.season,leagueId:a.leagueId,competitionId:a.competitionId,league:a.league,name:a.name,winner:a.winner,winnerClub:a.winnerClub,clubId:a.clubId,value:a.value}));
    season.panorama=(season.panorama||[]).map((p)=>({id:p.id,name:p.name,type:p.type,champion:p.champion,championId:p.championId,runnerUp:p.runnerUp,runnerUpId:p.runnerUpId,topScorer:compactWinner(p.topScorer),assistLeader:compactWinner(p.assistLeader),bestPlayer:compactWinner(p.bestPlayer),bestYoung:compactWinner(p.bestYoung),bestKeeper:compactWinner(p.bestKeeper),bestCoach:compactWinner(p.bestCoach),team:[]}));
    season.teams=[];
    season.compact=true;
    return season;
  }
  function competitionOutcome(s, competition) {
    if (competition.type === "league") {
      const order = s.clubs.filter((club) => club.leagueId === competition.id).slice().sort((a,b) => b.stats.points-a.stats.points || (b.stats.gf-b.stats.ga)-(a.stats.gf-a.stats.ga) || b.stats.gf-a.stats.gf);
      return { champion: order[0]?.name || null, championId: order[0]?.id || null, runnerUp: order[1]?.name || null, runnerUpId: order[1]?.id || null };
    }
    if (competition.id === "copaBrasil") {
      const cup=s.competitionSchedule?.cup || {};
      return { champion:cup.champion||null, championId:cup.championId||null, runnerUp:cup.runnerUp||null, runnerUpId:cup.runnerUpId||null };
    }
    const state=(root.ProLifeCompetitions?.allStates?.(s)||[]).find((item)=>item.id===competition.id) || {};
    return { champion:state.champion||null, championId:state.championId||null, runnerUp:state.runnerUp||null, runnerUpId:state.runnerUpId||null };
  }
  function bestCoach(s, competitionId = null) {
    const competition = competitionId && root.ProLifeCompetitions?.statCompetitions?.(s).find((item)=>item.id===competitionId);
    const outcome = competition ? competitionOutcome(s, competition) : null;
    const champions = new Set(outcome ? [outcome.championId].filter(Boolean) : [s.competitionSchedule?.cup?.championId, ...(root.ProLifeCompetitions?.allStates?.(s) || []).map((state) => state.championId)].filter(Boolean));
    let pool=s.clubs.slice();
    if (competition?.type === "league") pool=pool.filter((club)=>club.leagueId===competition.id);
    const club = pool.sort((a, b) => (champions.has(b.id) ? 40 : 0) + b.stats.points - ((champions.has(a.id) ? 40 : 0) + a.stats.points) || b.structure - a.structure)[0];
    return club && { name: s.mode === "coach" && club.id === s.clubId ? s.person.name : `Técnico do ${club.name}`, club: club.name, clubId: club.id, value: club.stats.points + (champions.has(club.id) ? 40 : 0) };
  }
  function heroSeasonSummary(s, competitions) {
    const hero=normalize(init(s).root.players.hero), rows=competitions.map((competition)=>hero.byCompetition[competition.id]).filter(Boolean);
    const sum=(field)=>rows.reduce((total,row)=>total+(row[field]||0),0), matchSnapshot=heroSnapshotFromMatches(s,s.season), appearances=sum("appearances") || matchSnapshot.appearances, ratingTotal=sum("ratingTotal");
    const dev=(s.development||[]).filter((entry)=>entry.season===s.season), start=dev[0], end=dev.at(-1);
    const pc=s.extras?.playerCareer || {};
    const goals=sum("goals") || matchSnapshot.goals, assists=sum("assists") || matchSnapshot.assists, motm=sum("motm") || matchSnapshot.motm;
    const averageRating=ratingTotal && appearances ? +(ratingTotal/appearances).toFixed(2) : matchSnapshot.averageRating;
    return { club:s.clubs.find((club)=>club.id===s.clubId)?.name || "Sem clube", clubs:heroStintHistory(s).filter(x=>x.season===s.season).map(x=>x.club), stints:heroStintHistory(s).filter(x=>x.season===s.season), age:s.person.age, overallStart:start?.overall ?? null, overallEnd:end?.overall ?? (root.ProLife?.overall ? root.ProLife.overall(s.person) : null), marketValueEnd:pc.marketValue||0, appearances, starts:Math.min(appearances, s.extras?.seasonStarts || appearances), minutes:s.person.minutes||0, goals, assists, motm, averageRating, reputation:Math.round(s.reputation||0), national:{ caps:s.nationalTeam?.caps||0, goals:s.nationalTeam?.goals||0, assists:s.nationalTeam?.assists||0 } };
  }

  function heroDashboard(s) {
    const hero=normalize(init(s).root.players.hero), currentClub=s.clubs.find(c=>c.id===s.clubId), seasonRows=Object.values(hero.byCompetition||{});
    const sum=(rows,f)=>rows.reduce((n,r)=>n+Number(r?.[f]||0),0), pack=(row)=>{ row=row||{}; const apps=Number(row.appearances||0), mins=Number(row.minutes||0), goals=Number(row.goals||0), assists=Number(row.assists||0), shots=Number(row.shots||0), on=Number(row.onTarget||0); return { appearances:apps, starts:Number(row.starts||apps), minutes:mins, goals, assists, motm:Number(row.motm||0), averageRating:apps ? +(Number(row.ratingTotal||0)/apps).toFixed(2):0, goals90:mins ? +(goals*90/mins).toFixed(2):0, assists90:mins ? +(assists*90/mins).toFixed(2):0, shots, onTarget:on, xg:+Number(row.xg||0).toFixed(2), conversion:shots ? +(goals*100/shots).toFixed(1):0, yellowCards:Number(row.yellowCards||0), redCards:Number(row.redCards||0), tackles:Number(row.tackles||0), saves:Number(row.saves||0), wins:Number(row.wins||0), draws:Number(row.draws||0), losses:Number(row.losses||0), hatTricks:Number(row.hatTricks||0), cleanSheets:Number(row.cleanSheets||0) }; };
    const season={}; for(const f of fields) season[f]=sum(seasonRows,f);
    const currentStints=heroStintHistory(s).filter(x=>x.season===s.season && x.clubId===s.clubId);
    const currentClubSeason={}; for(const f of fields) currentClubSeason[f]=sum(currentStints,f);
    return { season:pack(season), currentClubSeason:pack(currentClubSeason), career:pack(hero), byCompetition:Object.entries(hero.byCompetition||{}).map(([id,row])=>({id,name:competitionName(s,id),...pack(row)})), byClub:Object.entries(hero.byClub||{}).map(([id,row])=>({id,name:s.clubs.find(c=>c.id===id)?.name||id,...pack(row)})), currentClub:currentClub?.name||"Sem clube", national:s.nationalTeam||{}, stints:heroStintHistory(s), seasons:(s.statistics?.seasons||[]).map(x=>({season:x.season,...x.player,stints:x.player?.stints||[]})) };
  }
  function updateCareerMeta(s,m,heroGoals=0) {
    const stats=init(s).root, hero=normalize(stats.players.hero), apps=hero.appearances||0, goals=hero.goals||0, assists=hero.assists||0;
    const addMilestone=(id,label,value)=>{ if(!stats.milestones.some(x=>x.id===id)){ stats.milestones.push({id,label,value,season:s.season,day:s.day,clubId:s.clubId}); } };
    if(apps>=1) addMilestone("first-game","Primeiro jogo",1);
    if(goals>=1) addMilestone("first-goal","Primeiro gol",1);
    if(assists>=1) addMilestone("first-assist","Primeira assistência",1);
    for(const n of [10,50,100]) if(goals>=n) addMilestone(`goals-${n}`,`${n} gols`,n);
    for(const n of [50,100,200]) if(apps>=n) addMilestone(`games-${n}`,`${n} jogos`,n);
    if(assists>=100) addMilestone("assists-100","100 assistências",100);
    const r=stats.records, rating=Number(m.ratings?.hero||0), mv=Number(s.extras?.playerCareer?.marketValue||0), ovr=root.ProLife?.overall?root.ProLife.overall(s.person):0;
    r.mostGoalsMatch=Math.max(Number(r.mostGoalsMatch||0),heroGoals); r.highestRating=Math.max(Number(r.highestRating||0),rating); r.highestOverall=Math.max(Number(r.highestOverall||0),ovr); r.highestMarketValue=Math.max(Number(r.highestMarketValue||0),mv);
  }
  function careerInsights(s) {
    const stats=init(s).root, dash=heroDashboard(s), hero=normalize(stats.players.hero), current=heroSnapshotFromMatches(s,s.season);
    const archived=(stats.seasons||[]).map(x=>({season:x.season,...(x.player||{})}));
    const seasons=[{season:s.season,club:dash.currentClub,appearances:dash.season.appearances,goals:dash.season.goals,assists:dash.season.assists,averageRating:dash.season.averageRating,overallEnd:root.ProLife?.overall?root.ProLife.overall(s.person):null,marketValueEnd:s.extras?.playerCareer?.marketValue||0},...archived.filter(x=>x.season!==s.season)].sort((a,b)=>b.season-a.season);
    const recent=(s.matches||[]).filter(m=>Number(m.ratings?.hero)>0).slice(0,5).map(m=>({season:m.season,day:m.date,competition:m.competitionName||competitionName(s,m.competitionId||m.leagueId),rating:Number(m.ratings.hero),goals:(m.events||[]).filter(e=>e.type==="goal"&&e.playerId==="hero").length,assists:(m.events||[]).filter(e=>e.assistPlayerId==="hero").length,opponent:s.clubs.find(c=>c.id===(m.home===s.clubId?m.away:m.home))?.name||"Adversário"}));
    const recentAverage=recent.length?+(recent.reduce((n,x)=>n+x.rating,0)/recent.length).toFixed(2):0;
    const clubs=(dash.byClub||[]).map(x=>({...x,seasons:[...new Set((dash.stints||[]).filter(t=>t.clubId===x.id).map(t=>t.season))].sort()}));
    const seasonScore=x=>Number(x.goals||0)*4+Number(x.assists||0)*3+Number(x.averageRating||0)*5+Number(x.appearances||0)*0.2;
    const bestSeason=seasons.filter(x=>Number(x.appearances||0)>0).sort((a,b)=>seasonScore(b)-seasonScore(a))[0]||null;
    const timeline=[];
    for(const t of (dash.stints||[]).slice().sort((a,b)=>a.season-b.season||Number(a.startDay||0)-Number(b.startDay||0))) timeline.push({season:t.season,day:t.startDay||0,type:"club",label:t.transferType==="current"?"Passagem pelo clube":"Transferência / passagem",detail:t.club});
    for(const m of stats.milestones||[]) timeline.push({season:m.season,day:m.day,type:"milestone",label:m.label,detail:m.value});
    timeline.sort((a,b)=>a.season-b.season||a.day-b.day);
    return { season:dash.season, career:dash.career, competitions:dash.byCompetition, clubs, national:dash.national, seasons, recent, recentAverage, milestones:stats.milestones.slice(), records:{...stats.records,hatTricks:hero.hatTricks||0}, bestSeason, timeline, professional:{appearances:(dash.career.appearances||0)+Number(dash.national.caps||0),goals:(dash.career.goals||0)+Number(dash.national.goals||0),assists:(dash.career.assists||0)+Number(dash.national.assists||0)} };
  }
  function consistencyAudit(s) {
    const dash=heroDashboard(s), sum=(rows,f)=>rows.reduce((n,x)=>n+Number(x[f]||0),0), fieldsToCheck=["appearances","goals","assists","minutes"], issues=[];
    for(const f of fieldsToCheck){ const byComp=sum(dash.byCompetition,f); if(Number(dash.season[f]||0)!==byComp) issues.push(`temporada.${f}: ${dash.season[f]||0} != competicoes ${byComp}`); }
    return {ok:issues.length===0,issues};
  }
  function performanceScore(s, id, competitionId = null) {
    const row=init(s).root.players[id]; if(!row) return null;
    const source=competitionId ? normalize(row).byCompetition[competitionId] : normalize(row); if(!source?.appearances) return null;
    const {player,club}=playerAndClub(s,id); if(!player) return null;
    const apps=source.appearances, avg=source.ratingTotal/apps, pos=player.pos||"MEI";
    const role = pos==="GOL" ? source.saves*.18+(source.cleanSheets||0)*1.2+source.motm*1.6
      : pos==="DEF" ? source.tackles*.10+(source.cleanSheets||0)*.65+source.goals*1.3+source.assists*.9+source.motm*1.4
      : pos==="MEI" ? source.assists*1.55+source.goals*1.15+source.tackles*.045+source.motm*1.4
      : source.goals*1.55+source.assists*1.05+source.motm*1.4+source.onTarget*.08;
    return {id,name:player.name,club:club?.name||"—",clubId:club?.id||null,position:pos,age:player.age??99,appearances:apps,goals:source.goals||0,assists:source.assists||0,motm:source.motm||0,saves:source.saves||0,tackles:source.tackles||0,cleanSheets:source.cleanSheets||0,average:+avg.toFixed(2),score:+(avg*10+role).toFixed(2)};
  }
  function performanceRanking(s, competitionId=null, limit=20, minimum=2) {
    return Object.keys(init(s).root.players).map(id=>performanceScore(s,id,competitionId)).filter(x=>x&&x.appearances>=minimum).sort((a,b)=>b.score-a.score||b.average-a.average||b.appearances-a.appearances||a.name.localeCompare(b.name)).slice(0,limit);
  }
  function bestKeeper(s, competitionId=null, minimum=2) { return performanceRanking(s,competitionId,100,minimum).filter(x=>x.position==="GOL")[0]||null; }
  function rankingDashboard(s, competitionId=null, limit=10) {
    const goals=leaders(s,"goals",limit,competitionId), assists=leaders(s,"assists",limit,competitionId), motm=leaders(s,"motm",limit,competitionId), performance=performanceRanking(s,competitionId,limit,competitionId?2:5);
    return {competitionId:competitionId||"overall",goals,assists,motm,performance,bestKeeper:bestKeeper(s,competitionId,competitionId?2:5),team:competitionId?teamOfSeason(s,competitionId,2):[]};
  }
  function closeSeason(s) {
    const stats = init(s).root, awards = [];
    const competitions = root.ProLifeCompetitions?.statCompetitions?.(s) || s.leagues || [];
    const teams = competitions.map((competition) => ({ competitionId: competition.id, competition: competition.name, players: teamOfSeason(s, competition.id, competition.type === "league" ? 5 : 1) })).filter((team) => team.players.length);
    const panorama=[];
    for (const competition of competitions) {
      const minimum = competition.type === "league" ? 5 : 2, outcome=competitionOutcome(s,competition);
      const scorerList=leaders(s,"goals",100,competition.id), assistList=leaders(s,"assists",100,competition.id), scorers=scorerList[0], assists=assistList[0], best=performanceRanking(s,competition.id,100,minimum)[0]||bestRated(s,competition.id,minimum), young=bestYoung(s,competition.id), keeper=bestKeeper(s,competition.id,minimum), coach=bestCoach(s,competition.id), coScorers=scorers?scorerList.filter(x=>x.value===scorers.value).map(x=>x.name):[], coAssists=assists?assistList.filter(x=>x.value===assists.value).map(x=>x.name):[];
      awards.push(award(s, competition.id, "Artilheiro", scorers), award(s, competition.id, "Líder de assistências", assists), award(s, competition.id, "Mais vezes melhor em campo", leaders(s, "motm", 1, competition.id)[0]), award(s, competition.id, "Craque da competição", best), award(s, competition.id, "Revelação / melhor jovem", young), award(s, competition.id, "Melhor goleiro", keeper), award(s, competition.id, "Melhor técnico", coach));
      panorama.push({ id:competition.id, name:competition.name, type:competition.type, ...outcome, topScorer:scorers?{...scorers,coWinners:coScorers}:null, assistLeader:assists?{...assists,coWinners:coAssists}:null, bestPlayer:best||null, bestYoung:young||null, bestKeeper:keeper||null, bestCoach:coach||null, team:teams.find((entry)=>entry.competitionId===competition.id)?.players||[] });
    }
    awards.push(award(s, "overall", "Artilheiro do ano", leaders(s, "goals", 1)[0]), award(s, "overall", "Líder de assistências do ano", leaders(s, "assists", 1)[0]), award(s, "overall", "Melhor jogador do ano", bestRated(s)), award(s, "overall", "Revelação do ano", bestYoung(s)), award(s, "overall", "Melhor técnico", bestCoach(s)));
    const valid = awards.filter(Boolean), player=heroSeasonSummary(s,competitions);
    for (const stint of stats.heroStints) if (stint.season===s.season && stint.endDay==null) stint.endDay=s.day;
    stats.awards.unshift(...valid); stats.awards = stats.awards.slice(0, 500);
    stats.seasons.unshift({ season: s.season, awards: valid, teams, panorama, player, closedDay:s.day });
    stats.seasons=stats.seasons.slice(0,80);
    for (const archived of stats.seasons.slice(1)) compactArchivedSeason(archived,s.person?.name);
    for (const row of Object.values(stats.players)) for (const competition of competitions) delete normalize(row).byCompetition[competition.id];
    const hero=stats.players.hero;
    stats.players=hero ? {hero} : {};
    return valid;
  }
  const api = { init, recordMatch, leaders, bestRated, bestYoung, bestCoach, bestKeeper, performanceScore, performanceRanking, rankingDashboard, teamOfSeason, competitionOutcome, heroDashboard, careerInsights, consistencyAudit, heroStintHistory, migrateHeroTenureLedger, ensureHeroStint, closeHeroStint, closeSeason };
  root.ProLifeStatistics = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
