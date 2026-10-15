(function(root){
  "use strict";
  // Stage 34F.24 - carreira de treinador: metas e confianca da diretoria, risco de demissao, vestiario, capitao, treino coletivo e historico.
  // Atua somente quando s.mode === "coach" (as regras do modo jogador ficam separadas). Estado em s.coachCareer.
  const VERSION=1,HISTORY_LIMIT=40,SEASON_ROWS=30;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const hash=value=>{let h=2166136261;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
  const unit=key=>hash(key)/4294967296;
  const isCoach=s=>s?.mode==="coach";

  const FOCI=Object.freeze({
    equilibrado:{label:"Equilibrado",note:"Rotina estável: pequena melhora de moral."},
    fisico:{label:"Preparação física",note:"Recupera a condição do grupo, mas cansa a cabeça: moral cai um pouco."},
    tecnico:{label:"Refino técnico",note:"Chance semanal de +1 atributo em jogadores de até 29 anos."},
    jovens:{label:"Foco nos jovens",note:"Jogadores de até 21 anos têm mais chance de evoluir; os veteranos ficam de lado."},
    recuperacao:{label:"Recuperação",note:"Grande ganho de condição; ninguém evolui."}
  });
  const TALKS=Object.freeze({
    reuniao:{label:"Reunião com o grupo",cooldown:14,note:"+3 de moral para todo o elenco."},
    individual:{label:"Conversa individual",cooldown:5,note:"+9 de moral para um jogador."},
    cobrar:{label:"Cobrar desempenho",cooldown:21,note:"Elenco mais focado, mas −2 de moral e +2 de disciplina."}
  });
  const RISK=[[65,"seguro","Seguro"],[45,"estavel","Estável"],[30,"pressao","Sob pressão"],[20,"critico","Crítico"],[-1,"iminente","Demissão iminente"]];
  const riskOf=board=>{const r=RISK.find(([min])=>board>=min)||RISK.at(-1);return {id:r[1],label:r[2]};};

  const ALTERNATIVES={
    GOL:[],ZAG:["DEF","VOL"],DEF:["ZAG","LE","LD"],LE:["LD","DEF","ME"],LD:["LE","DEF","MD"],
    VOL:["MC","ZAG","MEI"],MC:["VOL","MEI","ME","MD"],MEI:["MC","VOL","PE","PD"],
    ME:["MD","MC","PE"],MD:["ME","MC","PD"],PE:["PD","ME","ATA"],PD:["PE","MD","ATA"],
    CA:["ATA","PE","PD"],ATA:["CA","PE","PD"]
  };
  const NORMALIZE_POS={GK:"GOL",CB:"ZAG",LB:"LE",RB:"LD",CDM:"VOL",CM:"MC",CAM:"MEI",LM:"ME",RM:"MD",LW:"PE",RW:"PD",ST:"ATA",CF:"ATA",LWB:"LE",RWB:"LD"};
  const normalizePos=p=>NORMALIZE_POS[String(p||"").toUpperCase()]||String(p||"").toUpperCase();
  const FOCUS_ATTRIBUTES={equilibrado:["pace","finish","pass","defense","strength","stamina"],velocidade:["pace","stamina"],finalizacao:["finish","pace"],criacao:["pass","finish"],marcacao:["defense","strength"],fisico:["strength","stamina"]};
  function fillPlayerRecords(s){
    if(!isCoach(s))return;
    for(const club of (s.clubs||[])){
      for(const p of (club.roster||[])){
        if(!p||!p.id)continue;
        // Empty legacy arrays without provenance mean unknown, not confirmed "no alternatives".
        const primary=normalizePos(p.pos||p.position);
        const alternatives=Array.isArray(p.secondaryPositions)?p.secondaryPositions:[];
        const eaCatalog=root.ProLifeFC27Positions?.alt||{};
        const eaKey=String(p.eaId??(String(p.id||"").match(/^real_(\\d+)$/)?.[1]||""));
        const knownEntry=Object.prototype.hasOwnProperty.call(eaCatalog,eaKey);
        const eaAlternates=knownEntry?String(eaCatalog[eaKey]||"").split(",").map(normalizePos).filter(x=>x&&x!==primary).slice(0,6):null;
        const verified=p.secondaryPositionsSource==="ea_fc27"||p.secondaryPositionsSource==="verified";
        const normalized=[...new Set(alternatives.map(normalizePos).filter(x=>x&&x!==primary))].slice(0,6);
        if(knownEntry){
          p.secondaryPositions=[...new Set(eaAlternates)];
          p.secondaryPositionsSource="ea_fc27";
        }else if(normalized.length||verified){
          p.secondaryPositions=normalized;
        }else{
          p.secondaryPositions=(ALTERNATIVES[primary]||[]).filter(x=>x!==primary).slice(0,6);
          p.secondaryPositionsSource="suggested";
        }
        if(!Number.isFinite(Number(p.contractEndDay))||p.contractEndDay==null){
          const years=1+Math.floor(unit("contract|"+club.id+"|"+p.id)*4);
          p.contractEndDay=Number(s.day||0)+years*365;
          p.contractEndSource="generated_game";
        }
        if(!p.developmentPlan||typeof p.developmentPlan!=="object"){
          p.developmentPlan={focus:"equilibrado",startDay:Number(s.day)||0,source:"game_default"};
        }
      }
    }
  }
  function state(s){
    if(!isCoach(s))return null;
    let c=s.coachCareer;
    if(!c||typeof c!=="object"||c.version!==VERSION)c=s.coachCareer={version:VERSION,stints:[],goals:null,board:{history:[],breakdown:null,risk:null,warnedSeason:null},locker:{cooldowns:{},log:[]},captainId:null,focus:"equilibrado",lastEvalDay:-1,lastTrainDay:-1};
    if(!Array.isArray(c.stints))c.stints=[];
    if(!c.board||typeof c.board!=="object")c.board={history:[],breakdown:null,risk:null,warnedSeason:null};
    if(!Array.isArray(c.board.history))c.board.history=[];
    if(!c.locker||typeof c.locker!=="object")c.locker={cooldowns:{},log:[]};
    if(!c.locker.cooldowns)c.locker.cooldowns={};
    if(!Array.isArray(c.locker.log))c.locker.log=[];
    if(!FOCI[c.focus])c.focus="equilibrado";
    if(c.playerDataVersion!==3){fillPlayerRecords(s);c.playerDataVersion=3;}
    return c;
  }
  const clubOf=(s,api)=>api?.club?api.club(s):(s.clubs||[]).find(c=>c.id===s.clubId)||null;
  const tableOf=(s,api,club)=>club?(api?.table?api.table(s,club.leagueId):[]):[];

  // ---------- metas da diretoria ----------
  function limitFor(kind,n){return kind==="titulo"?Math.max(2,Math.round(n*0.12)):kind==="continental"?Math.round(n*0.35):kind==="meio"?Math.round(n*0.7):Math.max(1,n-3);}
  const OBJ_LABEL={titulo:"Brigar pelo título",continental:"Terminar na parte de cima (vaga continental)",meio:"Terminar no meio da tabela",permanencia:"Evitar o rebaixamento"};
  function buildGoals(s,api){
    const c=state(s),club=clubOf(s,api);if(!c||!club)return null;
    const peers=(s.clubs||[]).filter(x=>x.leagueId===club.leagueId&&x.active!==false).sort((a,b)=>Number(b.strength||0)-Number(a.strength||0)||(a.id<b.id?-1:1));
    const n=Math.max(1,peers.length),rank=Math.max(1,peers.findIndex(x=>x.id===club.id)+1),r=(rank-1)/Math.max(1,n-1);
    const kind=rank<=Math.max(1,Math.round(n*0.12))?"titulo":r<0.35?"continental":r<0.7?"meio":"permanencia";
    const limit=limitFor(kind,n);
    c.goals={season:s.season,clubId:club.id,startBudget:Number(club.budget)||0,leagueSize:n,expectedRank:rank,
      items:[
        {id:"posicao",label:OBJ_LABEL[kind],kind:"posicao",target:limit,status:"em_andamento",progress:null,weight:3},
        {id:"orcamento",label:"Fechar a temporada com orçamento positivo",kind:"orcamento",target:0,status:"em_andamento",progress:null,weight:1},
        {id:"vestiario",label:"Manter o vestiário saudável (moral média de 60 ou mais)",kind:"vestiario",target:60,status:"em_andamento",progress:null,weight:1}
      ]};
    return c.goals;
  }
  function moraleOf(club){const list=(club?.roster||[]).filter(p=>p.status!=="retired");return list.length?list.reduce((n,p)=>n+(Number(p.morale)||60),0)/list.length:60;}
  function refreshGoals(s,api){
    const c=state(s),club=clubOf(s,api);if(!c?.goals||!club)return;
    const order=tableOf(s,api,club),pos=order.findIndex(x=>x.id===club.id)+1;
    for(const g of c.goals.items){
      if(g.status!=="em_andamento")continue;
      if(g.kind==="posicao")g.progress=pos||null;
      if(g.kind==="orcamento")g.progress=Math.round(Number(club.budget)||0);
      if(g.kind==="vestiario")g.progress=Math.round(moraleOf(club));
    }
  }

  // ---------- estagios (historico profissional) ----------
  function openStint(s,club){
    const c=state(s);
    c.stints.unshift({clubId:club.id,club:club.name,fromSeason:s.season,fromDay:s.day,toSeason:null,toDay:null,exit:null,rows:[],titles:0});
    c.stints=c.stints.slice(0,SEASON_ROWS);
  }
  function currentStint(s){const c=state(s);return c?.stints.find(x=>x.exit===null)||null;}
  function closeStint(s,exit){const st=currentStint(s);if(st){st.exit=exit;st.toSeason=s.season;st.toDay=s.day;}return st;}
  // Mantem o estagio atual em sincronia com s.clubId (contratacao, convite aceito, demissao).
  function syncClub(s,api){
    const c=state(s);if(!c)return;
    const club=clubOf(s,api),st=currentStint(s);
    if(st&&(!club||st.clubId!==club.id)){closeStint(s,club?"troca de clube":st.exit||"saída");c.goals=null;c.captainId=null;}
    if(club&&!currentStint(s)){openStint(s,club);buildGoals(s,api);}
    if(club&&!c.goals)buildGoals(s,api);
  }

  // ---------- confianca da diretoria ----------
  function expectedPpg(rank,n){return 2.15-(rank-1)/Math.max(1,n-1)*1.25;}
  function evaluate(s,api,hooks){
    const c=state(s),club=clubOf(s,api);if(!c||!club)return null;
    syncClub(s,api);
    const order=tableOf(s,api,club),n=order.length||1,pos=Math.max(1,order.findIndex(x=>x.id===club.id)+1),stats=club.stats||{},played=Number(stats.played)||0;
    const ppg=played?Number(stats.points||0)/played:expectedPpg(c.goals?.expectedRank||pos,n);
    const exp=expectedPpg(c.goals?.expectedRank||pos,n);
    const limit=c.goals?.items?.[0]?.target||Math.round(n*0.7);
    const budget0=c.goals?.startBudget||0,budget=Number(club.budget)||0;
    const comp={
      resultados:Math.round(clamp(55+(ppg-exp)*38,0,100)),
      metas:Math.round(clamp(70-(pos-limit)/Math.max(1,n)*140,0,100)),
      financas:Math.round(clamp(budget<0?15:budget0>0?55+(budget-budget0)/budget0*120:55,0,100)),
      vestiario:Math.round(clamp((moraleOf(club)-30)*1.4,0,100))
    };
    const target=comp.resultados*0.45+comp.metas*0.25+comp.financas*0.15+comp.vestiario*0.15;
    const before=Number(s.board)||50;
    const next=Math.round(clamp(before+(target-before)*(played>=3?0.12:0.04),0,100));
    s.board=next;c.lastEvalDay=s.day;
    c.board.breakdown={...comp,target:Math.round(target),pos,of:n,ppg:Math.round(ppg*100)/100,expected:Math.round(exp*100)/100};
    const weak=Object.entries(comp).sort((a,b)=>a[1]-b[1]).slice(0,2).map(([k,v])=>({resultados:"resultados abaixo do esperado",metas:"posição distante da meta",financas:"orçamento em queda",vestiario:"vestiário insatisfeito"})[k]+` (${v})`);
    const risk=riskOf(next);c.board.risk={...risk,reasons:next<65?weak:[]};
    if(next!==before||!c.board.history.length||s.day%28===0)c.board.history=[{day:s.day,season:s.season,value:next,delta:next-before},...c.board.history].slice(0,HISTORY_LIMIT);
    refreshGoals(s,api);
    if(next<30&&c.board.warnedSeason!==s.season){c.board.warnedSeason=s.season;hooks?.log?.("Ultimato da diretoria",`A diretoria do ${club.name} perdeu a paciência: ${weak.join(" e ")}. Reaja ou o cargo estará em risco.`);}
    if(next>=45)c.board.warnedSeason=c.board.warnedSeason===s.season?null:c.board.warnedSeason;
    return c.board.risk;
  }

  function dismiss(s,api,reason){
    const c=state(s);if(!c)return null;
    const st=closeStint(s,"demissão");
    if(st)st.reason=reason||"Resultados abaixo do esperado";
    s.clubId=null;s.board=50;c.goals=null;c.captainId=null;
    return st;
  }

  // ---------- virada de temporada ----------
  function closeSeason(s,api,hooks){
    const c=state(s),club=clubOf(s,api);if(!c||!club||!c.goals)return null;
    refreshGoals(s,api);
    const order=tableOf(s,api,club),pos=Math.max(1,order.findIndex(x=>x.id===club.id)+1),stats=club.stats||{};
    let score=0,total=0;
    for(const g of c.goals.items){
      g.status=g.kind==="posicao"?(pos<=g.target?"cumprida":"falhou"):g.kind==="orcamento"?((Number(club.budget)||0)>=0?"cumprida":"falhou"):((moraleOf(club))>=g.target?"cumprida":"falhou");
      score+=g.status==="cumprida"?g.weight:0;total+=g.weight;
    }
    const ok=pos<=(c.goals.items[0]?.target||0);
    const row={season:s.season,pos,of:order.length,points:Number(stats.points)||0,w:Number(stats.w)||0,d:Number(stats.d)||0,l:Number(stats.l)||0,goals:c.goals.items.map(g=>({id:g.id,label:g.label,status:g.status})),score:Math.round(score/Math.max(1,total)*100)};
    const st=currentStint(s);
    if(st){st.rows=[row,...st.rows.filter(r=>r.season!==s.season)].slice(0,SEASON_ROWS);if(pos===1)st.titles=(st.titles||0)+1;}
    const delta=pos===1?18:ok?10:-14;
    s.board=Math.round(clamp((Number(s.board)||50)+delta,0,100));
    s.reputation=clamp((Number(s.reputation)||0)+(pos===1?3:ok?1:-1),0,100);
    hooks?.log?.(`Balanço da temporada ${s.season}`,`${club.name} terminou em ${pos}º (${row.points} pts). Metas cumpridas: ${c.goals.items.filter(g=>g.status==="cumprida").length} de ${c.goals.items.length}.`);
    let dismissed=false;
    if(!ok&&s.board<22&&unit(`coach-sack|${s.season}|${club.id}`)<0.7){dismiss(s,api,`Meta "${c.goals.items[0].label}" não cumprida (${pos}º lugar)`);hooks?.log?.("Demissão",`${club.name} encerrou seu contrato após a meta não cumprida. Você pode buscar uma nova oportunidade.`);dismissed=true;}
    return {row,dismissed};
  }
  function startSeason(s,api){
    const c=state(s);if(!c)return;
    c.board.warnedSeason=null;
    if(clubOf(s,api)){syncClub(s,api);buildGoals(s,api);}
  }

  // ---------- vestiario ----------
  function lockerRoom(s,api){
    const c=state(s),club=clubOf(s,api);if(!c||!club)return null;
    const roster=(club.roster||[]).filter(p=>p.status!=="retired");
    const ranked=roster.slice().sort((a,b)=>Number(b.ovr||b.overall||0)-Number(a.ovr||a.overall||0));
    const topIds=new Set(ranked.slice(0,14).map(p=>p.id));
    const unhappy=roster.filter(p=>Number(p.morale)<55).map(p=>({id:p.id,name:p.name,pos:p.pos,morale:Math.round(Number(p.morale)),reason:topIds.has(p.id)&&Number(p.minutes||0)<200?"Titular em potencial com poucos minutos":Number(p.discipline)<50?"Problemas de disciplina":"Moral baixa"})).sort((a,b)=>a.morale-b.morale).slice(0,8);
    const avg=Math.round(moraleOf(club)),spread=roster.length?Math.sqrt(roster.reduce((n,p)=>n+Math.pow((Number(p.morale)||60)-avg,2),0)/roster.length):0;
    const cohesion=Math.round(clamp(avg-spread*0.6,0,100));
    const now=s.day,cd=Object.fromEntries(Object.keys(TALKS).map(k=>[k,Math.max(0,(c.locker.cooldowns[k]??-999)+TALKS[k].cooldown-now)]));
    return {average:avg,cohesion,unhappy,cooldowns:cd,log:c.locker.log.slice(0,6),talks:TALKS};
  }
  function talk(s,api,kind,playerId){
    const c=state(s),club=clubOf(s,api);
    if(!c||!club)throw Error("Assine com um clube para falar com o elenco.");
    const t=TALKS[kind];if(!t)throw Error("Conversa inválida.");
    const left=(c.locker.cooldowns[kind]??-999)+t.cooldown-s.day;
    if(left>0)throw Error(`${t.label}: disponível em ${left} dia${left===1?"":"s"}.`);
    const roster=(club.roster||[]).filter(p=>p.status!=="retired");
    let touched=0,summary="";
    if(kind==="reuniao"){for(const p of roster){p.morale=clamp((Number(p.morale)||60)+3,0,100);touched++;}summary="O grupo saiu da reunião mais unido (+3 de moral).";}
    else if(kind==="individual"){const p=roster.find(x=>x.id===playerId);if(!p)throw Error("Escolha um jogador do seu elenco.");p.morale=clamp((Number(p.morale)||60)+9,0,100);touched=1;summary=`${p.name} se sentiu valorizado (+9 de moral).`;}
    else{for(const p of roster){p.morale=clamp((Number(p.morale)||60)-2,0,100);p.discipline=clamp((Number(p.discipline)||60)+2,0,100);touched++;}summary="Você cobrou o grupo: mais disciplina, moral um pouco menor.";}
    c.locker.cooldowns[kind]=s.day;
    c.locker.log=[{day:s.day,season:s.season,kind,label:t.label,summary,touched},...c.locker.log].slice(0,20);
    return {kind,summary,touched};
  }

  // ---------- capitao ----------
  function setCaptain(s,api,playerId){
    const c=state(s),club=clubOf(s,api);
    if(!c||!club)throw Error("Assine com um clube para escolher o capitão.");
    if(playerId===null||playerId===""){c.captainId=null;return null;}
    const p=(club.roster||[]).find(x=>x.id===playerId&&x.status!=="retired");
    if(!p)throw Error("O capitão precisa ser do seu elenco.");
    c.captainId=p.id;p.morale=clamp((Number(p.morale)||60)+4,0,100);
    return p;
  }
  // Usado pelo engine: devolve o capitao escolhido se ele ainda estiver no elenco e disponivel.
  function captainOverride(s,team){
    const id=s?.coachCareer?.captainId;if(!id||!isCoach(s))return null;
    return (team?.roster||[]).find(p=>p.id===id&&!p.injury&&p.status!=="retired")||null;
  }

  // ---------- treino coletivo ----------
  function setFocus(s,focus){
    const c=state(s);if(!c)throw Error("Disponível no modo treinador.");
    if(!FOCI[focus])throw Error("Foco de treino inválido.");
    c.focus=focus;return FOCI[focus];
  }
  function weeklyTraining(s,api){
    const c=state(s),club=clubOf(s,api);if(!c||!club||c.lastTrainDay===s.day)return null;
    c.lastTrainDay=s.day;
    const roster=(club.roster||[]).filter(p=>p.status!=="retired"),f=c.focus;let grown=0;
    const keys=["pace","finish","pass","defense","strength","stamina"];
    for(const p of roster){
      const age=Number(p.age)||25;
      if(f==="equilibrado")p.morale=clamp((Number(p.morale)||60)+0.3,0,100);
      if(f==="fisico"){p.condition=clamp((Number(p.condition)||90)+3,0,100);p.morale=clamp((Number(p.morale)||60)-0.6,0,100);}
      if(f==="recuperacao")p.condition=clamp((Number(p.condition)||90)+5,0,100);
      const chance=f==="tecnico"?(age<=29?0.02:0):f==="jovens"?(age<=21?0.05:0):0;
      if(chance&&unit(`train|${s.season}|${s.day}|${p.id}`)<chance&&p.attrs&&Number(p.ovr||p.overall)<Number(p.potential||99)){
        const options=FOCUS_ATTRIBUTES[p.developmentPlan?.focus]||keys;
        const key=options[Math.floor(unit(`trainkey|${s.day}|${p.id}`)*options.length)];
        if(Number(p.attrs[key])<99){p.attrs[key]=Number(p.attrs[key])+1;if(api?.overall){const o=api.overall(p);p.ovr=o;p.overall=o;}grown++;}
      }
    }
    return {focus:f,grown};
  }

  // ---------- agenda diaria ----------
  function daily(s,api,hooks){
    if(!isCoach(s))return null;
    state(s);
    root.ProLifeCoachScoutingV2?.advance?.(s);
    if(s.day%7===0&&s.clubId){
      weeklyTraining(s,api);
      return evaluate(s,api,hooks);
    }
    if(s.day%7===0)syncClub(s,api);
    return null;
  }

  // ---------- consulta ----------
  function snapshot(s,api){
    if(!isCoach(s))return {enabled:false};
    const c=state(s),club=clubOf(s,api);
    syncClub(s,api);
    if(club&&!c.board.breakdown)evaluate(s,api,null);
    refreshGoals(s,api);
    const roster=club?(club.roster||[]).filter(p=>p.status!=="retired").slice().sort((a,b)=>Number(b.ovr||b.overall||0)-Number(a.ovr||a.overall||0)):[];
    const totals={w:0,d:0,l:0,titles:0,seasons:0};
    for(const st of c.stints){for(const r of st.rows){totals.w+=r.w;totals.d+=r.d;totals.l+=r.l;totals.seasons++;}totals.titles+=st.titles||0;}
    return {enabled:true,nationality:String(s.person?.nationality||"Brasil"),hasClub:!!club,club:club?{id:club.id,name:club.name}:null,board:Number(s.board)||0,risk:riskOf(Number(s.board)||0),detail:c.board.risk,breakdown:c.board.breakdown,history:c.board.history.slice(0,12),
      goals:c.goals,locker:club?lockerRoom(s,api):null,captain:club?(roster.find(p=>p.id===c.captainId)||null):null,
      candidates:roster.slice(0,16).map(p=>({id:p.id,name:p.name,pos:p.pos,age:p.age,ovr:Number(p.ovr||p.overall)||0,morale:Math.round(Number(p.morale)||0)})),
      focus:c.focus,foci:FOCI,stints:c.stints,totals,license:s.license,reputation:s.reputation};
  }

  const api={VERSION,FOCI,TALKS,FOCUS_ATTRIBUTES,fillPlayerRecords,init:(s,a)=>{if(!isCoach(s))return null;state(s);syncClub(s,a);return s.coachCareer;},daily,evaluate,closeSeason,startSeason,dismiss,syncClub,lockerRoom,talk,setCaptain,captainOverride,setFocus,weeklyTraining,snapshot,riskOf};
  root.ProLifeCoachCareer=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
