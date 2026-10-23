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
      // Jogos da seleção em que o protagonista não entrou (banco/não convocado) só existem no calendário: entram como "sem participação".
      const done=new Set(s.nationalTeam.matches.map((m)=>`${Number(m.day)}:${m.opponent}`));
      (s.nationalTeam.schedule||[]).forEach((f,index)=>{
        if(!f||!f.played||f.participated||!Number.isFinite(Number(f.brazil))||!Number.isFinite(Number(f.other))) return;
        if(done.has(`${Number(f.day)}:${f.opponent}`)) return;
        entries.push({ kind:"national", day:Number(f.day)||0, index:1000+index, match:{ day:f.day, competition:f.competition, opponent:f.opponent, brazil:f.brazil, other:f.other, season:2026+Math.floor((Number(f.day)||0)/365), starter:false, minutes:0, goals:0, assists:0, rating:null, bench:true, status:f.status||"Sem participação" } });
      });
    }
    // Sem nenhum jogo do protagonista (clube ou seleção) não há "últimas atuações": o calendário geral não entra aqui.
    const hs=(s.statistics&&s.statistics.players&&s.statistics.players.hero)||{};
    if (s.mode === "player" && !(Number(hs.appearances)>0) && !(Number(s.nationalTeam?.caps)>0)) return [];
    const startDay=Number(s.careerStartDay)||0;   // nada anterior a abertura da carreira entra no historico do protagonista
    const seen=new Set();
    return entries.filter((entry)=>entry.day>=startDay).sort((a,b)=>b.day-a.day || (a.kind===b.kind ? a.index-b.index : a.kind.localeCompare(b.kind))).filter((entry)=>{
      const m=entry.match;
      const key=entry.kind==="national"
        ? `national:${m.day??""}:${m.opponent??""}`
        : `club:${m.id??`${m.season??""}:${m.date??m.day??""}:${m.home??""}:${m.away??""}:${m.competitionId??m.leagueId??""}`}`;
      if(seen.has(key)) return false;
      seen.add(key); return true;
    }).slice(0,5);
  }
  // Nome da seleção do registro: novo (m.team) -> selecao acompanhada da Copa daquele ano -> selecao do protagonista -> Brasil (legado).
  function nationalTeamName(s,m) {
    if(m&&m.team) return m.team;
    try {
      const year=Number(m&&m.season)||2026+Math.floor((Number(m&&m.day)||0)/365), cups=(s.nationalTeam&&s.nationalTeam.tournaments)||[];
      const cup=cups.find(t=>t&&t.type==="WORLD_CUP"&&Number(t.year)===year);
      if(cup&&/Copa/i.test(String(m&&m.competition||""))){
        const id=cup.trackedTeamId===undefined||cup.trackedTeamId===null?"BRA":String(cup.trackedTeamId);
        const team=(cup.groups||[]).flatMap(g=>g.teams||[]).find(t=>t.id===id);
        if(team&&team.name) return team.name;
      }
      const NI=root.ProLifeNationalIdentity; const t=NI&&NI.heroTeam&&NI.heroTeam(s,root.ProLifeData||root.D);
      if(t&&t.represented&&t.name) return t.name;
    } catch(e) {}
    return "Brasil";
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
  // Clubes do mundo global (La Liga, Premier...) guardam a tabela em ProLifeWorldClubCompetitions, nao em s.clubs.
  function worldTableWindow(s, c) {
    const empty = { rows: [], position: 0, league: "" };
    try {
      const W = root.ProLifeWorldClubCompetitions;
      if (!W || !W.standings || !c.leagueId) return empty;
      const table = W.standings(s, c.leagueId).map((r)=>({ id:r.id, name:r.name, stats:{ played:r.played, w:r.w, d:r.d, l:r.l, gf:r.gf, ga:r.ga, points:r.points } }));
      const index = table.findIndex((x)=>x.id===c.id);
      if (index < 0) return empty;
      const start = Math.max(0, Math.min(index - 2, table.length - 5));
      const league = root.ProLifeGlobalFootball?.leagueById?.(s, c.leagueId)?.name || c.leagueId;
      return { rows: table.slice(start, start + 5).map((row,i)=>({ ...row, position:start+i+1 })), position:index+1, league };
    } catch (e) { return empty; }
  }
  function tableWindow(s, D) {
    const c = D.club(s); if (!c) return { rows: [], position: 0, league: "" };
    // Use the same authoritative standings as the full Competitions screen.
    // D.table(s) may contain older cumulative league statistics in migrated saves.
    const overview=D.seasonCompetitionOverview?.(s,c.leagueId);
    const official=Array.isArray(overview?.standings)?overview.standings:[];
    const table=official.length?official.map(row=>({
      id:row.clubId,name:row.clubName,
      stats:{played:row.played,w:row.wins,d:row.draws,l:row.losses,gf:row.goalsFor,ga:row.goalsAgainst,points:row.points}
    })):D.table(s);
    const index = table.findIndex((x)=>x.id===c.id);
    if (index < 0) return worldTableWindow(s, c);
    const start = Math.max(0, Math.min(index - 2, table.length - 5));
    return { rows: table.slice(start, start + 5).map((row,i)=>({...row, position:start+i+1})), position:index+1, league:s.leagues.find((l)=>l.id===c.leagueId)?.name || (root.ProLifeNames?root.ProLifeNames.league(s,c.leagueId):c.leagueId) };
  }
  function competitionClubName(s,D,id) {
    return D.club(s,id)?.name || (s.globalFootball?.clubs||[]).find(c=>c.id===id)?.name || id || "Clube";
  }
  function officialFixtureRows(s,D,matches) {
    return (Array.isArray(matches)?matches:[]).map(m=>({
      id:m.id,homeId:m.homeId,awayId:m.awayId,
      home:competitionClubName(s,D,m.homeId),away:competitionClubName(s,D,m.awayId),
      day:m.day,played:!!m.played,score:m.played&&Number.isInteger(m.hg)&&Number.isInteger(m.ag)?`${m.hg}–${m.ag}`:null,
      leg:Number(m.leg)||1,aggregate:Array.isArray(m.tie?.aggregate)?m.tie.aggregate:null,winnerId:m.winnerId||m.tie?.winnerId||null
    }));
  }
  function englishRoundQualified(round) {
    const qualified=new Set(round?.byes||[]),groups=new Map();
    for(const match of round?.matches||[]){const key=match.tieId||`pair:${match.pair}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(match);}
    for(const matches of groups.values()){
      if(matches.some(m=>!m.played))continue;
      const teams=[matches[0].homeId,matches[0].awayId],goals=teams.map(id=>matches.reduce((sum,m)=>sum+(m.homeId===id?Number(m.hg)||0:Number(m.ag)||0),0));
      let winner=null;
      if(goals[0]!==goals[1])winner=teams[goals[0]>goals[1]?0:1];
      else {const last=matches.slice().sort((a,b)=>(a.leg||1)-(b.leg||1)).at(-1),pens=last?.penalties;if(pens)winner=pens.home>pens.away?last.homeId:last.awayId;}
      if(winner)qualified.add(winner);
    }
    return [...qualified];
  }
  function knockoutContext(s,D,base,stage,matches,qualifiedIds=[],extra={}) {
    return {...base,kind:"knockout",stage:stage||"Mata-mata",rows:[],position:0,
      fixtures:officialFixtureRows(s,D,matches),qualified:(qualifiedIds||[]).map(id=>({id,name:competitionClubName(s,D,id)})),...extra};
  }
  function centralCompetitionTable(s, D, next, leagueTable) {
    const id = String(next?.competitionId || "");
    if (["fa_cup","efl_cup","community_shield"].includes(id)) {
      const names={fa_cup:"Emirates FA Cup",efl_cup:"EFL Cup",community_shield:"FA Community Shield"};
      const base={competitionId:id,league:names[id],page:"englishCups",actionLabel:id==="community_shield"?"Ver competição":"Ver chaveamento",rows:[],position:0};
      const edition=s.englishCups?.editions?.[`${id}:${s.season}`];
      if(!edition)return {...base,kind:"unavailable",message:"A edição desta copa ainda não está disponível."};
      const round=(edition.rounds||[]).find(r=>(r.matches||[]).some(m=>m.id===next?.id)) || edition.rounds?.[edition.currentRound] || edition.rounds?.at(-1);
      if(!round)return {...base,kind:"unavailable",message:edition.reason||"Sorteio ainda não disponível."};
      const championId=edition.championId||null;
      return knockoutContext(s,D,base,round.name||next?.stage,round.matches,englishRoundQualified(round),{
        champion:championId?{id:championId,name:competitionClubName(s,D,championId)}:null,
        status:edition.status,final:id==="community_shield"||round.key==="final"
      });
    }
    if (id.startsWith("state-")) {
      const competition = D.Competitions || root.ProLifeCompetitions;
      const tournament = [
        s.competitionSchedule?.state,
        ...(s.competitionSchedule?.otherStates || [])
      ].find(x => x?.id === id && Number(x.season) === Number(s.season));

      const empty = {
        league: next?.competitionName || "Campeonato estadual",
        page: "league",
        kind: "unavailable",
        rows: [],
        position: 0
      };

      if (!tournament) return empty;

      const group = (tournament.groups || []).find(
        g => Array.isArray(g.clubIds) && g.clubIds.includes(s.clubId)
      );

      const stage = String(next?.stage || "");
      const isGroup = /grupo/i.test(stage);

      if (!isGroup) {
        return {
          ...empty,
          kind: "knockout",
          stage: stage || "Mata-mata",
          league: tournament.name
        };
      }

      if (!group || !competition?.stateTable) return empty;

      const records = competition.stateTable(tournament, group.id);

      const rows = records.map((r, index) => ({
        id: r.id,
        name: D.club(s, r.id)?.name || r.id,
        position: index + 1,
        stats: {
          points: r.points,
          played: r.played,
          w: r.w,
          d: r.d,
          l: r.l,
          gf: r.gf,
          ga: r.ga
        }
      }));

      const current = rows.find(r => r.id === s.clubId);

      return {
        league: tournament.name + " - Grupo " + group.id,
        page: "league",
        kind: "group",
        rows,
        position: current?.position || 0
      };
    }
    if (["ucl", "uel", "uecl"].includes(id)) {
      const names = {
        ucl: "UEFA Champions League",
        uel: "UEFA Europa League",
        uecl: "UEFA Conference League"
      };
      const pages = {ucl:"champions",uel:"europa",uecl:"conference"};
      const base = {
        competitionId:id,
        league: names[id],
        page: pages[id],
        actionLabel:"Ver competição",
        kind: "unavailable",
        rows: [],
        position: 0
      };
      const ed = root.ProLifeContinental?.edition?.(s, id, s.season)
        || s.continental?.editions?.[`${id}:${s.season}`]
        || null;
      if (!ed) {
        console.warn("[PRO-LIFE CENTRAL] Edicao europeia nao encontrada:", id, s.season);
        return base;
      }

      const stage = String(next?.stage || "");
      if (stage && !/fase de liga/i.test(stage)) {
        const labels={playoffs:"Playoffs",round16:"Oitavas de final",quarters:"Quartas de final",semis:"Semifinais",final:"Final"};
        const current=(ed.knockout?.stages||[]).find(x=>x.key===stage)||(ed.knockout?.stages||[]).at(-1);
        return knockoutContext(s,D,base,current?.name||labels[stage]||stage,current?.matches,current?.winners||[],{
          champion:ed.knockout?.championId?{id:ed.knockout.championId,name:competitionClubName(s,D,ed.knockout.championId)}:null,
          final:stage==="final"
        });
      }

      const api = root.ProLifeChampionsStandings;
      if (!api?.standings || !Array.isArray(ed.leagueSchedule?.matches)) {
        return base;
      }

      let records;
      try {
        records = api.standings(ed);
      } catch (error) {
        console.warn("[PRO-LIFE CENTRAL] Falha na classificacao europeia:", id, error);
        return base;
      }

      const index = records.findIndex(x => x.id === s.clubId);
      if (index < 0) return base;

      const start = Math.max(0, Math.min(index - 2, records.length - 5));
      return {
        ...base,
        kind: "league",
        position: index + 1,
        rows: records.slice(start, start + 5).map(r => ({
          id: r.id,
          name: D.club(s, r.id)?.name ||
            (s.globalFootball?.clubs || []).find(c => c.id === r.id)?.name ||
            r.id,
          position: r.position,
          stats: {
            points: r.points,
            played: r.played,
            w: r.wins,
            d: r.draws,
            l: r.losses,
            gf: r.gf,
            ga: r.ga
          }
        }))
      };
    }

    if (id === "copaBrasil") {
      return {
        league: next?.competitionName || "Copa do Brasil",
        page: "league",
        kind: "knockout",
        stage: next?.stage || "Fase eliminatoria",
        opponent: next?.opponent || "",
        rows: [],
        position: 0
      };
    }
    if (id !== "lib" && id !== "sud") return leagueTable;

    const name = id === "lib" ? "CONMEBOL Libertadores" : "CONMEBOL Sul-Americana";
    const page = id === "lib" ? "libertadores" : "sudamericana";
    const empty = { competitionId:id,rows: [], position: 0, league: name, page, actionLabel:"Ver competição",kind: "unavailable" };

    const ed = Object.values(s.continental?.editions || {}).find(
      x => x?.comp === id && Number(x.season) === Number(s.season)
    );

    if (!ed) return empty;

    const engine = D.ConmebolTournaments || root.ProLifeConmebolTournaments;
    const group = (ed.groups || []).find(
      g => Array.isArray(g.clubIds) && g.clubIds.includes(s.clubId)
    );

    const stageText=String(next?.stage||"");
    if(stageText&&!/grupo/i.test(stageText)){
      const current=(ed.knockout?.stages||[]).find(x=>x.key===next?.stage)||(ed.knockout?.stages||[]).at(-1);
      return knockoutContext(s,D,empty,current?.name||next?.stage||"Mata-mata",current?.matches,current?.winners||[],{
        champion:ed.knockout?.championId?{id:ed.knockout.championId,name:competitionClubName(s,D,ed.knockout.championId)}:null,
        final:(current?.key||next?.stage)==="final"
      });
    }
    if (!group || !engine?.standings) {
      return empty;
    }

    const rows = engine.standings(ed, group.id);
    if (!Array.isArray(rows) || !rows.length) return empty;

    const index = rows.findIndex(r => r.id === s.clubId);

    return {
      league: name + " - Grupo " + group.id,
      page,
      kind: "group",
      position: index >= 0 ? index + 1 : 0,
      rows: rows.map(r => ({
        id: r.id,
        name: D.club(s, r.id)?.name ||
          (s.globalFootball?.clubs || []).find(c => c.id === r.id)?.name ||
          r.id,
        position: r.position,
        stats: {
          points: r.points,
          played: r.played,
          w: r.wins,
          d: r.draws,
          l: r.losses,
          gf: r.gf,
          ga: r.ga
        }
      }))
    };
  }
  function nextInfo(s, D) {
    const fixture = D.nextCommitment(s); if (!fixture) return null;
    const national = fixture.competitionId === "nationalTeam";
    const c = D.club(s);
    const home = national ? fixture.homeName : D.club(s, fixture.home)?.name;
    const away = national ? fixture.awayName : D.club(s, fixture.away)?.name;
    const opponent = national ? fixture.opponent : D.club(s, fixture.home === s.clubId ? fixture.away : fixture.home)?.name;
    const competitionId=String(fixture.competitionId||""),explicitStage=fixture.knockout||["fa_cup","efl_cup","community_shield","lib","sud","ucl","uel","uecl"].includes(competitionId);
    const rawStage=explicitStage
      ? (fixture.stage || (fixture.round ? `Rodada ${fixture.round}` : "Próximo compromisso"))
      : (D.Competitions?.fixtureStage?.(s,fixture) || fixture.stage || (fixture.round ? `Rodada ${fixture.round}` : "Próximo compromisso"));
    const stageLabels={playoffs:"Playoffs",round16:"Oitavas de final",quarters:"Quartas de final",semis:"Semifinais",quarterfinal:"Quartas de final",semifinal:"Semifinal",final:"Final"};
    const stage=stageLabels[rawStage]||rawStage;
    return { ...fixture, national, homeClubId:national?null:fixture.home, awayClubId:national?null:fixture.away, home:home || "—", away:away || "—", opponent:opponent || "—", stage };
  }
  // FC27: agenda da Central ordenada, sem compromissos repetidos e ancorada no motor.
  // Apenas consulta: não simula jogos, não avança dias e não altera o save.
  function upcomingAgenda(s,D,Calendar,next=null) {
    const allowed=new Set(["club","state","cup","national","event"]);
    const rows=(Calendar?.events?.(s,D)||[]).filter(e=>
      e&&allowed.has(e.type)&&Number.isFinite(Number(e.day))&&Number(e.day)>=Number(s.day)
    ).slice().sort((a,b)=>Number(a.day)-Number(b.day)||String(a.title||"").localeCompare(String(b.title||""),"pt-BR"));
    const seen=new Set(),out=[];
    const key=e=>e.type==="event"
      ? `event:${e.day}:${e.title||""}`
      : `match:${e.day}:${[...(e.clubs||[])].sort().join(":")||e.title||""}`;
    // O próximo jogo do motor tem prioridade sobre aproximações do calendário visual.
    if(next&&Number.isFinite(Number(next.date))&&Number(next.date)>=Number(s.day)){
      const clubs=next.national?[]:[next.homeClubId??next.home,next.awayClubId??next.away].filter(Boolean);
      const first={day:Number(next.date),type:next.national?"national":"club",title:`${next.home||"A definir"} × ${next.away||"A definir"}`,detail:next.competitionName||"Próximo jogo",destination:next.national?"national":"matches",clubs,officialNext:true,competitionId:next.competitionId};
      seen.add(key(first));out.push(first);
    }
    for(const e of rows){const id=key(e);if(seen.has(id))continue;seen.add(id);out.push(e);}
    return out.sort((a,b)=>a.day-b.day||(b.officialNext?1:0)-(a.officialNext?1:0)).slice(0,5);
  }
  function snapshot(s, D, Calendar) {
    const c=D.club(s), career=D.Career.init(s), stats=D.Statistics?.heroDashboard?.(s), current=stats?.currentClubSeason || stats?.season || {}, plan=D.Training.init(s), next=nextInfo(s,D), table=tableWindow(s,D), competitionTable=centralCompetitionTable(s,D,next,table), pc=career.playerCareer || {};
    const recent=recentEntries(s).map(({kind,match:m})=>{
      if(kind==="national") {
        const rating=validRating(m.rating), starter=!!m.starter, brazil=Number(m.brazil), other=Number(m.other), hasScore=Number.isFinite(brazil)&&Number.isFinite(other);
        return { match:m, national:true, result:hasScore?(brazil>other?"V":brazil<other?"D":"E"):null, rating,
          opponent:m.opponent||"Adversário", home:nationalTeamName(s,m), teamName:nationalTeamName(s,m), away:m.opponent||"Adversário", score:hasScore?`${brazil}–${other}`:"—",
          competition:m.competition||"Seleção", date:m.day, goals:nationalGoals(m), motm:nationalMotm(m),
          hero:{played:!m.bench,bench:!!m.bench,starter,entryMinute:starter?0:(m.entryMinute!==null&&m.entryMinute!==undefined&&Number.isFinite(Number(m.entryMinute))?Number(m.entryMinute):null),minutes:Math.max(0,Number(m.minutes)||0),goals:Math.max(0,Number(m.goals)||0),assists:Math.max(0,Number(m.assists)||0),rating}
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
      return { match:m, national:false, homeClubId:m.home, awayClubId:m.away, result:resultFor(s,m), rating,
        opponent:D.club(s,m.home===s.clubId?m.away:m.home)?.name || "Adversário",
        home:home?.name||"Mandante", away:away?.name||"Visitante", score:`${m.hg}–${m.ag}`,
        competition:m.competitionName||m.leagueName||"Partida", date:m.date, goals, motm, tie:m.tie||null,
        hero:heroStats?{played:true,starter:heroStats.starter!==false,entryMinute:heroStats.entryMinute||0,minutes:heroStats.minutes||0,goals:heroGoals,assists:heroAssists,rating}:{played:false}
      };
    });
    const events=upcomingAgenda(s,D,Calendar,next);
    const objectives=s.mode==="player" && s.clubId ? D.Career.matchObjectives(s) : [];
    const news=(s.news||[]).slice().sort((a,b)=>(b.day||0)-(a.day||0)).slice(0,4);
    const messages=[...(s.decision?[{day:s.day,title:s.decision.title,body:s.decision.body,kind:"decision"}]:[]), ...news].slice(0,4);
    const active=plan.activeMultiplier && plan.activeMultiplier.expiresDay>=s.day ? plan.activeMultiplier : null;
    const lineup=s.mode==="player" && s.clubId && !next?.national && D.Squad?.competition ? D.Squad.competition(s) : null;
    const subPlan=lineup?.heroRole==="Banco" && D.Squad?.substitutePlan ? D.Squad.substitutePlan(s,s.person) : null;
    const leadership=D.captaincy?.(s,c) || null;
    return { c, career, stats, current, plan, next, table, competitionTable, recent, events, objectives, news, messages, active, lineup, subPlan, leadership,
      player:{ name:s.person.name, pos:s.person.pos, age:s.person.age, overall:D.overall(s.person), condition:s.person.condition, morale:s.person.morale, form:(()=>{const ratings=recent.map(x=>validRating(x.rating)).filter(x=>x!==null);return ratings.length?+(ratings.reduce((n,x)=>n+x,0)/ratings.length).toFixed(1):null;})(), marketValue:pc.marketValue||0, squadRole:pc.squadRole||null },
      unread:s.decision?1:0,
      training:{ focus:D.Training.skills[s.training] || (s.training==="balanced"?"Equilibrado":s.training), intensity:{rest:"Recuperação",normal:"Normal",hard:"Intensa"}[s.intensity]||s.intensity, sessions:plan.sessions||0, improvements:plan.improvements||0, recent:active ? `${D.Training.trainingCategories[active.category]?.name || "Treino"} · nota ${active.grade}` : "Sem bônus temporário ativo", next:s.person.injury ? `Após ${s.person.injury} dia(s) de recuperação` : "Disponível na rotina diária" }
    };
  }
  root.ProLifeHomeDashboard={ snapshot, tableWindow, competitionContext:centralCompetitionTable, nextInfo, upcomingAgenda, sortedOwnMatches, recentEntries, resultFor };
  if(typeof module!=="undefined"&&module.exports) module.exports=root.ProLifeHomeDashboard;
})(typeof globalThis!=="undefined"?globalThis:this);
