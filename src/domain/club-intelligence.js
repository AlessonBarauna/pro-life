(function(root){
  "use strict";
  // Stage 34F.23 - inteligencia dos clubes do mundo FC 27: tecnicos com estilos, objetivos de temporada, pressao da diretoria,
  // demissoes e contratacoes de treinador, evolucao/regressao de orcamento e reputacao. Roda sem o protagonista envolvido.
  // So atua em clubes do catalogo FC 27 (club.fc27) e nunca no clube que o jogador treina. Nao altera jogadores.
  const GF=root.ProLifeGlobalFootball||(typeof require==="function"?require("./global-football.js"):null);
  const WCC=()=>root.ProLifeWorldClubCompetitions||(typeof require==="function"?require("./world-club-competitions.js"):null);
  const VERSION=1,EVENT_LIMIT=120,CHECK_EVERY=28,FIRST_CHECK=90,LAST_CHECK=335;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const hash=value=>{let h=2166136261;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
  const unit=key=>hash(key)/4294967296;

  const STYLES=Object.freeze({
    ofensivo:{label:"Ofensivo",weight:22},
    defensivo:{label:"Defensivo",weight:16},
    posse:{label:"Posse de bola",weight:20},
    contra_ataque:{label:"Contra-ataque",weight:16},
    equilibrado:{label:"Equilibrado",weight:20},
    formador:{label:"Formador de talentos",weight:8}
  });
  const STYLE_IDS=Object.keys(STYLES);
  const OBJECTIVES=Object.freeze({
    titulo:{label:"Brigar pelo título"},
    continental:{label:"Vaga em competição continental"},
    meio:{label:"Terminar no meio da tabela"},
    permanencia:{label:"Evitar o rebaixamento"}
  });

  const fc27=s=>s?.catalogVersion==="fc27_v1"&&Array.isArray(s?.globalFootball?.clubs);
  const clubsOf=s=>(s.globalFootball.clubs||[]).filter(c=>c&&c.fc27&&c.active!==false);
  const protectedClub=s=>(s.mode==="coach"&&s.clubId)?s.clubId:null;

  function state(s){
    const g=s.globalFootball;
    if(!g.intel||typeof g.intel!=="object"||g.intel.version!==VERSION)g.intel={version:VERSION,season:s.season,coaches:{},clubs:{},events:[],seeded:false};
    const i=g.intel;
    if(!i.coaches||typeof i.coaches!=="object")i.coaches={};
    if(!i.clubs||typeof i.clubs!=="object")i.clubs={};
    if(!Array.isArray(i.events))i.events=[];
    return i;
  }

  // ---------- nomes ----------
  const poolCache=new WeakMap();
  function namePools(s){
    const players=s.internationalPlayers;let c=poolCache.get(players);
    if(c&&c.n===players.length)return c.pools;
    const byLeague=new Map(),all={first:new Set(),last:new Set()};
    for(const p of players){
      if(!p||!p.name||String(p.id).startsWith("fc27_y_"))continue;
      const parts=String(p.name).trim().split(/\s+/);if(parts.length<2)continue;
      let l=byLeague.get(p.leagueId);if(!l){l={first:new Set(),last:new Set()};byLeague.set(p.leagueId,l);}
      l.first.add(parts[0]);l.last.add(parts.slice(1).join(" "));all.first.add(parts[0]);all.last.add(parts.slice(1).join(" "));
    }
    const arr=x=>({first:[...x.first].sort(),last:[...x.last].sort()});
    const pools={all:arr(all),byLeague:new Map([...byLeague].map(([k,v])=>[k,v.first.size>=8&&v.last.size>=8?arr(v):null]))};
    poolCache.set(players,{n:players.length,pools});return pools;
  }
  function coachName(s,club,key){
    const pools=namePools(s),p=pools.byLeague.get(club.leagueId)||pools.all;
    return `${p.first[Math.floor(unit(key+"|f")*p.first.length)]} ${p.last[Math.floor(unit(key+"|l")*p.last.length)]}`;
  }

  // ---------- tecnicos ----------
  const clubLevel=club=>clamp(Number.isFinite(Number(club.strength))?Number(club.strength):Number.isFinite(Number(club.reputation))?Number(club.reputation)*0.9:60,35,95);
  function pickStyle(key,level){
    const w=STYLE_IDS.map(id=>[id,STYLES[id].weight*(id==="formador"&&level<70?1.6:1)*(id==="defensivo"&&level<60?1.4:1)*(id==="posse"&&level>=78?1.5:1)]);
    let x=unit(key)*w.reduce((n,e)=>n+e[1],0);for(const [id,wt] of w){x-=wt;if(x<=0)return id;}return "equilibrado";
  }
  function newCoach(s,club,key,since){
    const level=clubLevel(club);
    return {name:coachName(s,club,key),style:pickStyle(key+"|style",level),rating:Math.round(clamp(level-6+(unit(key+"|r")-0.5)*24,38,92)),since,honeymoonUntil:null};
  }
  function bonusOf(s,coach,board){
    if(!coach)return 0;
    const honeymoon=coach.honeymoonUntil&&s.day<coach.honeymoonUntil?1.0:0;
    return Math.round(clamp((coach.rating-65)/12+honeymoon-(board<30?1:0),-3.5,3.5)*10)/10;
  }
  // Grava no objeto do clube os dois campos usados pela simulacao (estilo e bonus).
  function applyToClub(s,club){
    const i=state(s),coach=i.coaches[club.id],meta=i.clubs[club.id];
    club.coachStyle=coach?.style||null;club.coachBonus=coach?bonusOf(s,coach,meta?.board??60):0;
  }
  function pushEvent(s,ev,hooks){
    const i=state(s);i.events.unshift({day:s.day,season:s.season,...ev});i.events=i.events.slice(0,EVENT_LIMIT);
    if(hooks?.log&&ev.notable)hooks.log(ev.title,ev.text);
  }

  // ---------- objetivos ----------
  function assignObjectives(s){
    const i=state(s),byLeague=new Map();
    for(const c of clubsOf(s)){let l=byLeague.get(c.leagueId);if(!l){l=[];byLeague.set(c.leagueId,l);}l.push(c);}
    for(const list of byLeague.values()){
      list.sort((a,b)=>clubLevel(b)-clubLevel(a)||(a.id<b.id?-1:1));
      const n=list.length;
      list.forEach((c,idx)=>{
        const r=idx/Math.max(1,n-1),objective=idx<Math.max(1,Math.round(n*0.12))?"titulo":r<0.35?"continental":r<0.72?"meio":"permanencia";
        const meta=i.clubs[c.id]||(i.clubs[c.id]={board:60,finishes:[],objectiveHistory:[]});
        meta.objective=objective;meta.objectiveSeason=s.season;meta.expectedRank=idx+1;meta.leagueSize=n;
      });
    }
  }
  const limitFor=(objective,n)=>objective==="titulo"?Math.max(2,Math.round(n*0.12)):objective==="continental"?Math.round(n*0.35):objective==="meio"?Math.round(n*0.72):Math.max(1,n-3);

  // ---------- inicializacao ----------
  function init(s){
    if(!fc27(s))return null;
    const i=state(s);
    if(!i.seeded){
      for(const c of clubsOf(s)){
        const key=`coach|${c.id}|seed`;
        if(!i.coaches[c.id])i.coaches[c.id]=newCoach(s,c,key,s.season-Math.floor(unit(key+"|tenure")*4));
        if(!i.clubs[c.id])i.clubs[c.id]={board:Math.round(55+unit(key+"|b")*15),finishes:[],objectiveHistory:[]};
        if(!Number.isFinite(i.clubs[c.id].baseBudget))i.clubs[c.id].baseBudget=Number(c.budget)||0;
      }
      assignObjectives(s);i.seeded=true;
    }
    for(const c of clubsOf(s))applyToClub(s,c);
    return i;
  }

  function hireReplacement(s,club,why,hooks){
    const i=state(s),old=i.coaches[club.id],meta=i.clubs[club.id];
    const key=`coach|${club.id}|${s.season}|${s.day}`,next=newCoach(s,club,key,s.season);
    next.honeymoonUntil=s.day+70;
    i.coaches[club.id]=next;meta.board=60;meta.crisis=false;
    const league=(s.globalFootball.leagues||[]).find(l=>l.id===club.leagueId);
    const notable=Number(club.reputation)>=76;
    pushEvent(s,{type:"sacked",clubId:club.id,club:club.name,league:league?.name||"",title:`${club.name} demite ${old?.name||"o técnico"}`,text:`${why}. Novo treinador: ${next.name} (${STYLES[next.style].label}).`,notable,coach:old?.name||null,newCoach:next.name,style:next.style},hooks);
    applyToClub(s,club);
  }

  // ---------- avaliacao durante a temporada ----------
  function evaluateLeague(s,leagueId,hooks){
    const W=WCC();if(!W?.standings)return 0;
    const i=state(s),order=W.standings(s,leagueId),n=order.length;
    if(n<8||!order.some(r=>r.played>=8))return 0;
    const guard=protectedClub(s),catalog=new Map(clubsOf(s).map(c=>[c.id,c]));let sacked=0;
    order.forEach((row,pos)=>{
      const club=catalog.get(row.id),meta=i.clubs[row.id];if(!club||!meta||!meta.objective)return;
      const limit=limitFor(meta.objective,n),pressure=clamp((pos+1-limit)/Math.max(2,n*0.2),-1,2);
      const before=meta.board;
      meta.board=Math.round(clamp(meta.board-pressure*7+(pressure<=0?1.5:0),0,100));
      meta.crisis=meta.board<35;
      if(meta.board<before&&meta.crisis&&!meta.crisisReported){meta.crisisReported=true;pushEvent(s,{type:"crisis",clubId:club.id,club:club.name,title:`Crise no ${club.name}`,text:`A diretoria perde a paciência: ${pos+1}º lugar contra a meta "${OBJECTIVES[meta.objective].label}".`,notable:Number(club.reputation)>=80},hooks);}
      if(!meta.crisis)meta.crisisReported=false;
      if(club.id===guard)return;
      const coach=i.coaches[club.id];
      if(meta.board<22&&!(coach?.honeymoonUntil&&s.day<coach.honeymoonUntil)&&unit(`sack|${s.season}|${s.day}|${club.id}`)<0.4){hireReplacement(s,club,`Resultados abaixo da meta (${pos+1}º lugar)`,hooks);sacked++;}
      else applyToClub(s,club);
    });
    return sacked;
  }
  function daily(s,hooks){
    if(!fc27(s))return 0;
    const i=init(s),phase=s.day%365;
    if(s.day%7===0&&i.lastRefreshDay!==s.day){i.lastRefreshDay=s.day;for(const c of clubsOf(s))applyToClub(s,c);}
    if(phase<FIRST_CHECK||phase>LAST_CHECK||phase%CHECK_EVERY!==0||i.lastCheckDay===s.day)return 0;
    i.lastCheckDay=s.day;
    let total=0;for(const id of new Set(clubsOf(s).map(c=>c.leagueId)))total+=evaluateLeague(s,id,hooks);
    return total;
  }

  // ---------- fechamento da temporada ----------
  function closeSeason(s,hooks){
    if(!fc27(s))return null;
    const i=init(s),W=WCC(),guard=protectedClub(s),summary={season:s.season,achieved:0,failed:0,sacked:0,champions:[]};
    const catalog=new Map(clubsOf(s).map(c=>[c.id,c]));
    for(const leagueId of new Set(clubsOf(s).map(c=>c.leagueId))){
      const order=W?.standings?.(s,leagueId)||[],n=order.length;if(n<8)continue;
      order.forEach((row,pos)=>{
        const club=catalog.get(row.id),meta=i.clubs[row.id];if(!club||!meta||!meta.objective)return;
        const limit=limitFor(meta.objective,n),ok=pos+1<=limit,great=pos+1<=Math.max(1,Math.round(limit*0.5)),champion=pos===0;
        meta.finishes=[{season:s.season,pos:pos+1,of:n},...(meta.finishes||[])].slice(0,6);
        meta.objectiveHistory=[{season:s.season,objective:meta.objective,pos:pos+1,ok},...(meta.objectiveHistory||[])].slice(0,6);
        meta.board=Math.round(clamp(meta.board+(great?20:ok?10:-20),0,100));
        const coach=i.coaches[club.id];
        if(coach)coach.rating=Math.round(clamp(coach.rating+(great?2:ok?1:-2)+(unit(`drift|${s.season}|${club.id}`)-0.5)*2,35,95));
        // orcamento e reputacao: clubes evoluem ou regridem com o tempo, dentro de limites do orcamento original.
        const base=meta.baseBudget||Number(club.budget)||0;
        if(Number.isFinite(Number(club.budget))&&base>0)club.budget=Math.round(clamp(Number(club.budget)*(champion?1.12:great?1.06:ok?1.02:0.94),base*0.4,base*3));
        if(Number.isFinite(Number(club.reputation)))club.reputation=Math.round(clamp(Number(club.reputation)+(champion?1:great?0.5:ok?0:-0.5),30,96)*10)/10;
        if(ok)summary.achieved++;else summary.failed++;
        if(champion)summary.champions.push({clubId:club.id,club:club.name,leagueId});
        if(club.id!==guard&&meta.board<25&&unit(`sack-end|${s.season}|${club.id}`)<0.75){hireReplacement(s,club,`Meta "${OBJECTIVES[meta.objective].label}" não cumprida (${pos+1}º lugar)`,hooks);summary.sacked++;}
      });
    }
    i.lastSeason=summary;return summary;
  }
  // Depois da virada: novas metas conforme a forca atual do elenco; reaplica estilo/bonus aos clubes.
  function startSeason(s){
    if(!fc27(s))return null;
    const i=init(s);assignObjectives(s);i.season=s.season;
    for(const c of clubsOf(s)){const meta=i.clubs[c.id];if(meta)meta.crisisReported=false;applyToClub(s,c);}
    return i;
  }

  // ---------- consulta (UI/testes) ----------
  function snapshot(s,clubId){
    if(!fc27(s))return {enabled:false,events:[],clubs:[]};
    const i=state(s),club=(s.globalFootball.clubs||[]).find(c=>c.id===clubId);
    const view=id=>{const c=(s.globalFootball.clubs||[]).find(x=>x.id===id),coach=i.coaches[id],meta=i.clubs[id];if(!c||!coach||!meta)return null;
      return {clubId:id,club:c.name,coach:coach.name,style:coach.style,styleLabel:STYLES[coach.style].label,rating:coach.rating,since:coach.since,board:meta.board,crisis:!!meta.crisis,objective:meta.objective,objectiveLabel:OBJECTIVES[meta.objective]?.label||"",finishes:meta.finishes||[],bonus:bonusOf(s,coach,meta.board)};};
    return {enabled:true,season:s.season,club:club?view(clubId):null,events:i.events.slice(0,30),lastSeason:i.lastSeason||null,view};
  }
  function leagueCoaches(s,leagueId){
    const i=state(s);return clubsOf(s).filter(c=>c.leagueId===leagueId).map(c=>{const coach=i.coaches[c.id],meta=i.clubs[c.id];return coach&&meta?{clubId:c.id,club:c.name,coach:coach.name,style:coach.style,styleLabel:STYLES[coach.style].label,board:meta.board,crisis:!!meta.crisis,objective:meta.objective,objectiveLabel:OBJECTIVES[meta.objective]?.label||""}:null;}).filter(Boolean);
  }

  const api={VERSION,STYLES,OBJECTIVES,init,daily,closeSeason,startSeason,snapshot,leagueCoaches,hireReplacement:(s,club,why)=>hireReplacement(s,club,why||"Mudança de comando"),bonusOf};
  root.ProLifeClubIntelligence=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
