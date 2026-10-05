const D=require("../src/domain/engine.js");
const s=D.create({world:"brazil2026",clubId:"c0"},4488), season=s.season;
for(let i=0;i<364;i++) D.advance(s,1);
const leagueReport=s.leagues.map(l=>{const clubs=s.clubs.filter(c=>c.leagueId===l.id);return {league:l.name,clubs:clubs.length,played:[Math.min(...clubs.map(c=>c.stats.played)),Math.max(...clubs.map(c=>c.stats.played))],champion:D.table(s,l.id)[0]?.name};});
const matches=s.matches.filter(m=>m.season===season);
const keys=new Set(),dups=[];
for(const m of matches){const k=[m.competitionId,m.round,m.home,m.away].join(":");if(keys.has(k))dups.push(k);keys.add(k);}
const cup=s.competitionSchedule?.cup, states=D.Competitions.allStates(s);
console.log(JSON.stringify({season,day:s.day,leagueReport,storedMatches:matches.length,duplicates:dups.length,cupChampion:cup?.champion||null,stateChampion:s.competitionSchedule?.state?.champion||null,integrity:D.Competitions.integrity(s)},null,2));
D.advance(s,1);
console.log(JSON.stringify({newSeason:s.season,newDay:s.day,archived:Boolean(s.statistics?.seasons?.some(x=>x.season===season)),historyEntries:(s.history||[]).filter(x=>x.season===season).length},null,2));
