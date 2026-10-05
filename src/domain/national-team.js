/* PRO LIFE — Brazil national team career simulation. */
(function (root) {
  "use strict";
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const windows = [74, 149, 224, 299];
  const opponents = ["Argentina", "Uruguai", "Colômbia", "Chile", "Equador", "Paraguai", "Peru", "Bolívia"];
  const nations = [{id:"BRA",name:"Brasil",reputation:92,formation:"4-3-3"},{id:"ARG",name:"Argentina",reputation:93,formation:"4-3-3"},{id:"URU",name:"Uruguai",reputation:86,formation:"4-2-3-1"},{id:"COL",name:"Colômbia",reputation:84,formation:"4-3-3"},{id:"CHI",name:"Chile",reputation:78,formation:"4-2-3-1"},{id:"ECU",name:"Equador",reputation:80,formation:"4-3-3"},{id:"PAR",name:"Paraguai",reputation:76,formation:"4-4-2"},{id:"PER",name:"Peru",reputation:74,formation:"4-2-3-1"},{id:"BOL",name:"Bolívia",reputation:70,formation:"4-4-2"},{id:"USA",name:"Estados Unidos",reputation:81,formation:"4-3-3"},{id:"ESP",name:"Espanha",reputation:94,formation:"4-3-3"},{id:"FRA",name:"França",reputation:94,formation:"4-2-3-1"}];
  const windowOpponents = [["Chile", "Paraguai"], ["Argentina", "Uruguai"], ["Colômbia", "Equador"], ["Peru", "Bolívia"]];
  const defaults = () => ({
    country: "Brasil", calledUp: false, status: "Fora da convocação", caps: 0,
    starts: 0, goals: 0, assists: 0, ratingTotal: 0, motm: 0,
    lastCallupDay: null, nextWindow: windows[0], matches: [], history: [],
    competition: "Seleção Brasileira", schedule: [], nationality: "Brasil", radarStatus:"FORA DO RADAR", shirtNumber:null, captain:false, callups:0, firstCallupDay:null, debutDay:null, firstGoalDay:null, minutes:0, cards:0, cleanSheets:0, saves:0, titles:[], squad:[], positionCompetition:[], qualifiers:{season:null,table:[]}, tournaments:[], milestones:[], currentCallupWindow:null, callupDecisions:{},
  });
  function protectedDay(day) { const relative = ((day % 365) + 365) % 365; return windows.some((value) => relative >= value - 7 && relative <= value + 4); }
  function protectClubCalendar(s) {
    let previous = -10;
    if (Array.isArray(s.calendarDays)) s.calendarDays = s.calendarDays.map((original) => {
      let day = Math.max(original, previous + 5);
      while (protectedDay(day)) day++;
      previous = day; return day;
    });
    for (const round of s.competitionSchedule?.cup?.rounds || []) while (protectedDay(round.date)) round.date++;
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
    n.schedule = n.schedule.filter((match) => match.day >= s.day - 370 && match.day <= s.day + 730).sort((a, b) => a.day - b.day);
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
  function competition(s, day) { const n=day%365, year=2026+Math.floor(day/365); if(year%4===2 && n>=205&&n<=245) return "Copa Mundial"; if(year%4===0 && n>=205&&n<=245) return "Copa Continental"; return n>=120 ? "Eliminatórias" : "Amistoso internacional"; }
  function normalizedNationality(s){ const raw=String(s.person?.nationality||"Brasil").toLowerCase(); return raw==="brazil"?"Brasil":s.person?.nationality||"Brasil"; }
  function candidateScore(p, overall){
    const ov = Number(overall ?? p.ovr ?? p.overall ?? 70);
    const condition = Number(p.condition ?? 100);
    const morale = Number(p.morale ?? 50);
    const appearances = Number(p.appearances ?? p.games ?? 0);
    const availability = p.injury || Number(p.suspension || 0) > 0 || condition < 25 ? -999 : 0;
    return ov * .78 + condition * .06 + morale * .035 + Math.min(3, appearances * .04) - Math.max(0,(Number(p.age)||25)-32)*.35 + availability;
  }
  function buildSquad(s,api){
    const nationality=normalizedNationality(s); if(nationality!=="Brasil") return [];
    const candidates=[]; for(const c of s.clubs||[]) for(const p of c.roster||[]) if(p.id!=="hero" && ["Brasil","Brazil"].includes(p.nationality||"Brasil")) { const overall=api.overall?api.overall(p):(p.ovr||70); candidates.push({id:p.id,name:p.name,pos:p.pos,club:c.name,age:p.age||25,overall,score:candidateScore(p,overall)}); }
    const hero={id:"hero",name:s.person.name,pos:s.person.pos,club:(s.clubs||[]).find(c=>c.id===s.clubId)?.name||"Sem clube",age:s.person.age,overall:api.overall(s.person),score:score(s,api)}; candidates.push(hero);
    const limits={GOL:3,DEF:8,MEI:7,ATA:5}, out=[]; for(const pos of Object.keys(limits)) out.push(...candidates.filter(x=>x.pos===pos).sort((a,b)=>b.score-a.score||b.overall-a.overall||a.id.localeCompare(b.id)).slice(0,limits[pos])); return out;
  }
  function positionCompetition(s,api){
    const stored=s.nationalTeam?.calledUp && s.nationalTeam?.squad?.length ? s.nationalTeam.squad : null;
    let squad=stored||buildSquad(s,api);
    if(stored){
      const players=new Map();
      for(const club of s.clubs||[]) for(const p of club.roster||[]) players.set(p.id,{p,club:club.name});
      squad=stored.map(x=>{
        if(x.id==="hero") return {...x,overall:api.overall(s.person),score:score(s,api)};
        const found=players.get(x.id); if(!found) return {...x,unavailable:true};
        const overall=api.overall?api.overall(found.p):(found.p.ovr||x.overall||70);
        return {...x,club:found.club,age:found.p.age||x.age,overall,score:candidateScore(found.p,overall)};
      });
      squad=squad.filter(x=>!x.unavailable);
      s.nationalTeam.squad=squad;
    }
    const pos=s.person.pos; return squad.filter(x=>x.pos===pos).sort((a,b)=>b.score-a.score||b.overall-a.overall||a.id.localeCompare(b.id)).map((x,i)=>({...x,rank:i+1}));
  }
  function windowDecision(n, windowDay){ return n.callupDecisions?.[String(windowDay)] || null; }
  function fixtureCallupStatus(n, match){
    const d=windowDecision(n,match.windowDay);
    if(!d) return "Convocação ainda não definida";
    return d.calledUp ? "Convocado" : "Não convocado";
  }
  function onDuty(s){ const n=s.nationalTeam; if(!n?.calledUp) return false; const next=(n.schedule||[]).find(m=>!m.played&&m.day>=s.day); return !!next && s.day>=next.windowDay-7 && s.day<=next.windowDay+4; }
  function ensureQualifiers(s,n,rng){ const year=2026+Math.floor(s.day/365); if(n.qualifiers?.season===year) return; const teams=nations.slice(0,8).map(x=>({id:x.id,name:x.name,played:0,w:0,d:0,l:0,gf:0,ga:0,points:0,strength:x.reputation})); if(rng){ for(let i=0;i<teams.length;i++)for(let j=i+1;j<teams.length;j++){const a=teams[i],b=teams[j],ag=Math.max(0,Math.round(1.3+(a.strength-b.strength)/20+(rng.next()-.5)*2)),bg=Math.max(0,Math.round(1.1+(b.strength-a.strength)/20+(rng.next()-.5)*2)); a.played++;b.played++;a.gf+=ag;a.ga+=bg;b.gf+=bg;b.ga+=ag;if(ag>bg){a.w++;b.l++;a.points+=3}else if(bg>ag){b.w++;a.l++;b.points+=3}else{a.d++;b.d++;a.points++;b.points++}} } n.qualifiers={season:year,table:teams.sort((a,b)=>b.points-a.points||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf)}; }
  function tournamentStatus(s){ const year=2026+Math.floor(s.day/365); return year%4===2?"Copa Mundial":year%4===0?"Copa Continental":"Ciclo de Eliminatórias"; }
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
  function play(s, rng, api, log, fixture = null) {
    const n = init(s); if (!n.calledUp) return;
    const opponent = fixture?.opponent || opponents[rng.int(0, opponents.length - 1)], starter = n.status === "Titular" || (n.status === "Rotação" && rng.next() < 0.55), participated = starter || rng.next() < 0.7;
    const minutes = participated ? (starter ? rng.int(65, 90) : rng.int(12, 35)) : 0, quality = score(s, api), rating = participated ? clamp(5.7 + (quality - 65) / 18 + (rng.next() - 0.5) * 1.8, 5.5, 9.8) : 0;
    const goals = participated && rng.next() < clamp((quality - 55) / 100, 0.05, 0.42) ? 1 : 0, assists = participated && rng.next() < clamp((quality - 58) / 120, 0.04, 0.3) ? 1 : 0;
    const brazil = Math.max(0, Math.round(1.4 + (quality - 68) / 22 + (rng.next() - 0.5) * 2)), other = Math.max(0, Math.round(1.1 + (rng.next() - 0.5) * 2));
    if (fixture) Object.assign(fixture, { played: true, participated, brazil, other });
    if (participated) {
      const beforeGoals=n.goals; n.caps++; if(starter)n.starts++; n.goals+=goals; n.assists+=assists; n.ratingTotal+=rating; n.minutes=(n.minutes||0)+minutes; if(rating>=8.6)n.motm++; n.debutDay??=s.day; if(goals&&beforeGoals===0)n.firstGoalDay??=s.day; s.person.condition=clamp((s.person.condition||100)-Math.round(minutes/10),0,100);
      const match = { day: s.day, season: s.season, competition: n.competition, opponent, brazil, other, starter, minutes, rating: +rating.toFixed(1), goals, assists };
      n.matches.unshift(match); n.matches = n.matches.slice(0, 100);
      s.reputation = clamp(s.reputation + (rating >= 8 ? 2 : rating >= 7 ? 1 : 0), 0, 100); s.fans += Math.round(500 + rating * 120 + goals * 1000);
    }
    log(s, `Brasil ${brazil} × ${other} ${opponent}`, participated ? `${s.person.name}: ${minutes} min · nota ${rating.toFixed(1)}${goals ? ` · ${goals} gol(s)` : ""}${assists ? ` · ${assists} assistência(s)` : ""}.` : `${s.person.name} permaneceu no banco nesta partida.`);
  }
  function daily(s, rng, api, log) {
    const n = init(s); if (s.mode !== "player") return; ensureQualifiers(s,n,rng);
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
        Object.assign(fixture, { played: true, participated: false, status: "Não convocado", brazil, other });
        log(s, `Brasil ${brazil} × ${other} ${fixture.opponent}`, `${fixture.competition} · partida da Seleção Brasileira.`);
      }
    }
    if (windows.some((day) => relative === day + 4)) { n.calledUp = false; n.currentCallupWindow=null; n.status = "Aguardando próxima convocação"; }
    n.nextWindow = n.schedule.find((match) => !match.played && match.day >= s.day)?.day ?? nextWindowDay(s);
  }
  const api={windows,nations,init,score,threshold,radar,role,upcoming,nextWindowDay,protectedDay,protectClubCalendar,callup,play,daily,competition,buildSquad,positionCompetition,onDuty,ensureQualifiers,tournamentStatus,normalizedNationality,windowDecision,fixtureCallupStatus};
  root.ProLifeNationalTeam = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
