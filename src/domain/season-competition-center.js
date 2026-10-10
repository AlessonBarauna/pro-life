(function(root){
  "use strict";
  const plain=value=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  const slug=value=>plain(value).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"competition";
  const num=value=>Number.isFinite(Number(value))?Number(value):0;
  // Query helpers must not initialize catalogs or otherwise mutate the save.
  const club=(s,id)=>(s.clubs||[]).find(x=>x.id===id)||(s.globalFootball?.clubs||[]).find(x=>x.id===id)||null;
  const clubName=(s,id,fallback)=>club(s,id)?.name||fallback||id||"A definir";
  const baseDay=s=>(Number(s.season||2026)-2026)*365;
  function addUnique(out,seen,item){
    if(!item?.id||seen.ids.has(item.id))return;
    const equivalent=`${plain(item.name)}:${item.season}`;
    if(seen.names.has(equivalent))return;
    seen.ids.add(item.id);seen.names.add(equivalent);out.push(item);
  }
  function catalog(s,api={}){
    const out=[],seen={ids:new Set(),names:new Set()},configs=api.Competitions?.competitionConfigs||{};
    for(const item of s.competitions||[]){
      const state=String(item.id).startsWith("state-");
      addUnique(out,seen,{id:item.id,name:item.name,country:"Brasil",type:state?"state":item.type||"competition",format:configs[item.id]?.format||(state?"groups-and-knockout":item.type==="league"?"double-round-robin":"single-leg-knockout"),season:item.season||s.season,available:true,status:item.status||"Sem dados"});
    }
    const world=s.globalFootball?.worldCompetitions,worldStates=world?.leagues||{};
    for(const league of s.globalFootball?.leagues||[]){
      if(league.active===false||league.competitionEligible===false)continue;
      const state=worldStates[league.id],current=!!state&&Number(state.season)===Number(s.season);
      addUnique(out,seen,{id:league.id,name:league.name,country:league.country||"Internacional",type:"world-league",format:"double-round-robin",season:state?.season||s.season,available:current,status:current?(state.status||"Em andamento"):"Sem calendário processado"});
    }
    const n=s.nationalTeam||{},q=n.qualifiers;
    if(Array.isArray(q?.fixtures)&&q.fixtures.length)addUnique(out,seen,{id:"national-qualifiers",name:"Eliminatórias",country:"Internacional",type:"national-league",format:q.format||"league",season:q.worldCupYear||q.season||s.season,available:true,status:q.complete?"Finalizada":"Em andamento"});
    for(const t of n.tournaments||[]){
      if(!t?.type&&!t?.name)continue;
      addUnique(out,seen,{id:`national-${slug(t.type||t.name)}-${t.year||s.season}`,name:t.name||t.type,country:"Internacional",type:"national-tournament",format:Array.isArray(t.groups)&&t.groups.length?"groups-and-knockout":"knockout",season:t.year||s.season,available:true,status:t.status||"Agendada"});
    }
    for(const name of new Set((n.schedule||[]).map(x=>x.competition).filter(Boolean))){
      if(plain(name).includes("eliminat")&&out.some(x=>x.id==="national-qualifiers"))continue;
      if(out.some(x=>plain(x.name)===plain(name)))continue;
      addUnique(out,seen,{id:`national-schedule-${slug(name)}`,name,country:"Internacional",type:"national-schedule",format:"scheduled-matches",season:s.season,available:true,status:"Agendada"});
    }
    return out.sort((a,b)=>a.type.localeCompare(b.type)||a.name.localeCompare(b.name,"pt-BR"));
  }
  function formFor(rows,id){
    return rows.filter(x=>x.played&&(x.homeId===id||x.awayId===id)).sort((a,b)=>b.day-a.day).slice(0,5).map(x=>{const own=x.homeId===id?x.homeScore:x.awayScore,opp=x.homeId===id?x.awayScore:x.homeScore;return own>opp?"V":own===opp?"E":"D";}).reverse();
  }
  function standingsFromFixtures(s,fixtures,ids=[]){
    const map=new Map(ids.map(id=>[id,{clubId:id,clubName:clubName(s,id),points:0,played:0,wins:0,draws:0,losses:0,goalsFor:0,goalsAgainst:0}]));
    for(const match of fixtures.filter(x=>x.played)){
      for(const [id,gf,ga] of [[match.homeId,match.homeScore,match.awayScore],[match.awayId,match.awayScore,match.homeScore]]){
        if(!id)continue;const row=map.get(id)||{clubId:id,clubName:clubName(s,id),points:0,played:0,wins:0,draws:0,losses:0,goalsFor:0,goalsAgainst:0};map.set(id,row);
        row.played++;row.goalsFor+=num(gf);row.goalsAgainst+=num(ga);if(gf>ga){row.wins++;row.points+=3;}else if(gf===ga){row.draws++;row.points++;}else row.losses++;
      }
    }
    const rows=[...map.values()].map(row=>({...row,goalDifference:row.goalsFor-row.goalsAgainst,recentForm:formFor(fixtures,row.clubId)}));
    rows.sort((a,b)=>b.points-a.points||b.wins-a.wins||b.goalDifference-a.goalDifference||b.goalsFor-a.goalsFor||a.clubName.localeCompare(b.clubName,"pt-BR"));
    return rows.map((row,index)=>({rank:index+1,...row}));
  }
  function fixture(s,data,meta={}){
    const homeId=data.homeId??data.home,awayId=data.awayId??data.away,hg=data.homeScore??data.hg,ag=data.awayScore??data.ag,played=data.played===true||(Number.isFinite(hg)&&Number.isFinite(ag));
    return {id:data.id||`${meta.competitionId}:${data.day??data.date}:${homeId}:${awayId}`,day:num(data.day??data.date),round:data.round??meta.round??null,stage:data.stage||data.phase||meta.stage||null,competitionId:meta.competitionId,homeId,awayId,home:clubName(s,homeId,data.homeName||(/^([A-Z]{3})$/.test(String(homeId||""))?data.home:null)),away:clubName(s,awayId,data.awayName||(/^([A-Z]{3})$/.test(String(awayId||""))?data.away:null)),status:played?"PLAYED":"SCHEDULED",played,homeScore:played?num(hg):null,awayScore:played?num(ag):null,score:played?`${num(hg)} x ${num(ag)}`:null,winnerId:data.winnerId||null,penalties:data.penalties||null,aggregate:data.aggregate||null,qualifiedId:data.qualifiedId||data.winnerId||null};
  }
  function finish(meta,standings,fixtures,rounds){
    fixtures.sort((a,b)=>a.day-b.day||String(a.id).localeCompare(String(b.id)));
    const nextFixtures=fixtures.filter(x=>!x.played).slice(0,12),recentResults=fixtures.filter(x=>x.played).sort((a,b)=>b.day-a.day).slice(0,12);
    const current=rounds.find(r=>r.fixtures.some(x=>!x.played))||rounds.at(-1)||null;
    return {competition:meta,standings,fixtures,rounds,currentRound:current?{id:current.id,name:current.name,day:current.day}:null,nextFixtures,recentResults};
  }
  function localLeague(s,meta){
    const ids=(s.clubs||[]).filter(c=>c.leagueId===meta.id).map(c=>c.id),allowed=new Set(ids),base=baseDay(s),results=s.matches||[],rounds=[];
    for(let i=0;i<(s.fixtures||[]).length;i++){
      const day=base+num(s.calendarDays?.[i]??7+i*21),matches=[];
      for(const pair of s.fixtures[i]||[]){if(!allowed.has(pair[0])||!allowed.has(pair[1]))continue;const result=results.find(m=>m.date===day&&m.home===pair[0]&&m.away===pair[1]&&(!m.competitionId||m.competitionId===meta.id||m.leagueId===meta.id));matches.push(fixture(s,result||{home:pair[0],away:pair[1],date:day,round:i+1},{competitionId:meta.id,round:i+1,stage:`Rodada ${i+1}`}));}
      if(matches.length)rounds.push({id:`round-${i+1}`,name:`Rodada ${i+1}`,day,fixtures:matches});
    }
    const fixtures=rounds.flatMap(r=>r.fixtures);return finish(meta,standingsFromFixtures(s,fixtures,ids),fixtures,rounds);
  }
  function knockoutOrState(s,meta,source){
    const rounds=(source?.rounds||[]).map((r,index)=>{const matches=(r.pairs||[]).map(p=>fixture(s,{...p,day:r.date,round:r.index+1,stage:r.name},{competitionId:meta.id,round:r.index+1,stage:r.name}));return{id:String(r.index??index),name:r.name||`Fase ${index+1}`,day:num(r.date),kind:r.kind||"knockout",fixtures:matches};});
    const fixtures=rounds.flatMap(r=>r.fixtures),hasTable=rounds.some(r=>r.kind==="group"),ids=source?.entrants?.map(x=>x.clubId||x)||[];
    return finish(meta,hasTable?standingsFromFixtures(s,fixtures.filter(x=>rounds.find(r=>r.fixtures.includes(x))?.kind==="group"),ids):[],fixtures,rounds);
  }
  function worldLeague(s,meta,api){
    const state=s.globalFootball?.worldCompetitions?.leagues?.[meta.id];if(!state||Number(state.season)!==Number(s.season))return finish(meta,[],[],[]);
    const rawStandings=api.WorldClubCompetitions.standings(s,meta.id),rawResults=api.WorldClubCompetitions.results(s,meta.id),rawCalendar=api.WorldClubCompetitions.calendar(s,meta.id),resultMap=new Map(rawResults.map(x=>[`${x.round}:${x.home}:${x.away}`,x]));
    const rounds=rawCalendar.map(r=>{const matches=r.pairs.map(p=>{const result=resultMap.get(`${r.round}:${p.home}:${p.away}`);return fixture(s,result||{...p,date:r.date,round:r.round},{competitionId:meta.id,round:r.round,stage:`Rodada ${r.round}`});});return{id:`round-${r.round}`,name:`Rodada ${r.round}`,day:r.date,fixtures:matches};});
    const fixtures=rounds.flatMap(r=>r.fixtures),standings=rawStandings.map((row,index)=>({rank:index+1,clubId:row.id,clubName:row.name,points:row.points,played:row.played,wins:row.w,draws:row.d,losses:row.l,goalsFor:row.gf,goalsAgainst:row.ga,goalDifference:row.gd,recentForm:formFor(fixtures,row.id)}));
    return finish(meta,standings,fixtures,rounds);
  }
  function nationalQualifiers(s,meta){
    const q=s.nationalTeam?.qualifiers||{},fixtures=(q.fixtures||[]).map(x=>fixture(s,x,{competitionId:meta.id,round:x.round,stage:`Rodada ${x.round}`})),groups=new Map();for(const f of fixtures){const key=f.round||0;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(f);}const rounds=[...groups].map(([id,list])=>({id:`round-${id}`,name:`Rodada ${id}`,day:Math.min(...list.map(x=>x.day)),fixtures:list}));
    const standings=(q.table||[]).map((r,index)=>({rank:index+1,clubId:r.id,clubName:r.name||r.id,points:num(r.points),played:num(r.played),wins:num(r.w),draws:num(r.d),losses:num(r.l),goalsFor:num(r.gf),goalsAgainst:num(r.ga),goalDifference:num(r.gd??r.gf-r.ga),recentForm:formFor(fixtures,r.id)}));return finish(meta,standings,fixtures,rounds);
  }
  function tournamentMatches(t){
    const out=[];for(const g of t.groups||[])for(const m of g.matches||[])out.push({...m,stage:m.stage||`Grupo ${g.name}`});for(const m of t.fixtures||t.matches||[])out.push(m);
    const walk=(value,stage)=>{if(Array.isArray(value))for(const x of value){if(x&&(x.homeId||x.home)&&(x.awayId||x.away))out.push({...x,stage:x.stage||x.phase||stage});else walk(x,stage);}else if(value&&typeof value==="object")for(const [key,x] of Object.entries(value))walk(x,key);};walk(t.knockout,"Mata-mata");
    return out.filter((x,index,list)=>list.findIndex(y=>(y.id&&x.id===y.id)||(!x.id&&!y.id&&x.day===y.day&&(x.homeId||x.home)===(y.homeId||y.home)&&(x.awayId||x.away)===(y.awayId||y.away)))===index);
  }
  function nationalTournament(s,meta){
    const t=(s.nationalTeam?.tournaments||[]).find(x=>`national-${slug(x.type||x.name)}-${x.year||s.season}`===meta.id);if(!t)return finish(meta,[],[],[]);
    const fixtures=tournamentMatches(t).map(x=>fixture(s,x,{competitionId:meta.id,round:x.round,stage:x.stage||x.phase})),grouped=new Map();for(const f of fixtures){const key=f.stage||`Rodada ${f.round||1}`;if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(f);}const rounds=[...grouped].map(([name,list],index)=>({id:slug(name)||String(index),name,day:Math.min(...list.map(x=>x.day)),fixtures:list}));
    const table=(t.groups||[]).flatMap(g=>g.table||[]),standings=table.map((r,index)=>({rank:index+1,clubId:r.id,clubName:r.name||r.id,group:(t.groups||[]).find(g=>(g.table||[]).includes(r))?.name,points:num(r.points),played:num(r.played),wins:num(r.w),draws:num(r.d),losses:num(r.l),goalsFor:num(r.gf),goalsAgainst:num(r.ga),goalDifference:num(r.gd??r.gf-r.ga),recentForm:formFor(fixtures,r.id)}));return finish(meta,standings,fixtures,rounds);
  }
  function overview(s,id,api={}){
    const meta=catalog(s,api).find(x=>x.id===id);if(!meta)return null;
    if((s.leagues||[]).some(x=>x.id===id))return localLeague(s,meta);
    if(id==="copaBrasil")return knockoutOrState(s,meta,s.competitionSchedule?.cup);
    if(String(id).startsWith("state-")){const states=[s.competitionSchedule?.state,...(s.competitionSchedule?.otherStates||[])];return knockoutOrState(s,meta,states.find(x=>x?.id===id));}
    if(meta.type==="world-league")return worldLeague(s,meta,api);
    if(id==="national-qualifiers")return nationalQualifiers(s,meta);
    if(meta.type==="national-tournament")return nationalTournament(s,meta);
    const fixtures=(s.nationalTeam?.schedule||[]).filter(x=>plain(x.competition)===plain(meta.name)).map(x=>fixture(s,{...x,homeId:x.homeId||"BRA",awayId:x.awayId||x.opponent,home:x.home||"Brasil",away:x.away||x.opponent},{competitionId:id,round:x.round,stage:x.competition}));return finish(meta,[],fixtures,[]);
  }
  function calendarEvents(s,fromDay,toDay,filters={},api={}){
    const from=Number(fromDay),to=Number(toDay);if(!Number.isInteger(from)||!Number.isInteger(to)||from>to)throw Error("Intervalo de calendário inválido.");
    const events=[],seen=new Set(),push=e=>{if(!Number.isInteger(e.day)||e.day<from||e.day>to)return;const key=e.id||`${e.category}:${e.competitionId||""}:${e.day}:${e.home||""}:${e.away||""}:${e.title}`;if(seen.has(key))return;seen.add(key);events.push({...e,id:key});};
    for(const meta of catalog(s,api)){const data=overview(s,meta.id,api);for(const f of data?.fixtures||[])push({id:`match:${meta.id}:${f.day}:${f.homeId}:${f.awayId}`,day:f.day,category:"match",title:`${f.home} x ${f.away}`,competitionId:meta.id,home:f.home,away:f.away,status:f.status,score:f.score,isHeroEvent:[f.homeId,f.awayId].includes(s.clubId)||([f.homeId,f.awayId].includes("BRA")&&!!s.nationalTeam?.calledUp)});}
    for(const row of s.life?.events||[])push({id:`life:${row.season}:${row.day}:${row.choice}`,day:num(row.day),category:"personal",title:`Decisão pessoal: ${row.choice}`,competitionId:null,home:null,away:null,status:"RECORDED",score:null,isHeroEvent:true});
    for(const row of s.commercial?.events||[])push({id:`commercial:${row.id}`,day:num(row.day),category:"commercial",title:`${row.brand||"Compromisso comercial"}: ${row.type||"evento"}`,competitionId:null,home:null,away:null,status:row.status||"SCHEDULED",score:null,isHeroEvent:true});
    for(const row of s.extras?.communications?.messages||[])push({id:`message:${row.id||row.eventId||row.day+":"+row.subject}`,day:num(row.day),category:"career",title:row.subject||"Mensagem da carreira",competitionId:null,home:null,away:null,status:"RECORDED",score:null,isHeroEvent:true});
    for(const offer of s.offers||[])push({id:`offer:${offer.clubId}:${offer.expires}`,day:num(offer.expires),category:"market",title:`Prazo de proposta: ${clubName(s,offer.clubId)}`,competitionId:null,home:null,away:null,status:"DEADLINE",score:null,isHeroEvent:true});
    let filtered=events;if(filters.competitionId)filtered=filtered.filter(x=>x.competitionId===filters.competitionId);if(filters.category)filtered=filtered.filter(x=>x.category===filters.category);if(filters.isHeroEvent!==undefined)filtered=filtered.filter(x=>x.isHeroEvent===!!filters.isHeroEvent);return filtered.sort((a,b)=>a.day-b.day||a.id.localeCompare(b.id));
  }
  const api={catalog,overview,calendarEvents};root.ProLifeSeasonCompetitionCenter=api;if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
