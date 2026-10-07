(function(root){
  "use strict";

  const clamp=(value,min=0,max=100)=>Math.max(min,Math.min(max,Number(value)||0));

  function careerApi(){
    return root.ProLifeCareer ||
      (typeof require==="function" ? require("./career.js") : null);
  }

  function squadApi(){
    return root.ProLifeSquad ||
      (typeof require==="function" ? require("./squad.js") : null);
  }

  function commercialApi(){
    return root.ProLifeCommercial ||
      (typeof require==="function" ? require("./commercial.js") : null);
  }

  function unexpectedApi(){
    return root.ProLifeUnexpectedEvents ||
      (typeof require==="function" ? require("./unexpected-events.js") : null);
  }

  function engineApi(){
    return root.ProLife || null;
  }

  function safeArray(value){
    return Array.isArray(value) ? value : [];
  }

  function daysLeft(s,deadline){
    return Number.isFinite(deadline) ? Math.max(0,deadline-Number(s.day||0)) : null;
  }

  function priorityRank(value){
    return value==="URGENTE" ? 0 : value==="IMPORTANTE" ? 1 : 2;
  }

  function normalizeObjective(spec){
    return {
      id:String(spec.id||""),
      source:String(spec.source||"career"),
      category:String(spec.category||"CARREIRA"),
      title:String(spec.title||"Objetivo"),
      description:String(spec.description||""),
      current:Number.isFinite(spec.current) ? spec.current : null,
      target:Number.isFinite(spec.target) ? spec.target : null,
      progress:Number.isFinite(spec.progress) ? clamp(spec.progress) : null,
      deadline:Number.isFinite(spec.deadline) ? spec.deadline : null,
      status:String(spec.status||"ATIVO"),
      priority:String(spec.priority||"NORMAL"),
      page:spec.page||null,
      anchor:spec.anchor||null,
      actionable:!!spec.actionable
    };
  }

  function matchObjectives(s){
    const Career=careerApi();
    if(s?.mode!=="player" || !s?.clubId || !Career?.matchObjectives) return [];
    return safeArray(Career.matchObjectives(s)).map((o,index)=>normalizeObjective({
      id:"match:"+String(o.id||index),
      source:"coach",
      category:"PARTIDA",
      title:o.label||"Objetivo da partida",
      description:"Objetivo definido pela comissão técnica para a próxima atuação.",
      target:Number.isFinite(o.target)?Number(o.target):null,
      status:"ATIVO",
      priority:"IMPORTANTE",
      page:"lineup"
    }));
  }

  function agencyObjectives(s){
    const Career=careerApi();
    if(s?.mode!=="player" || !Career?.init) return [];
    const pc=Career.init(s).playerCareer;
    const state=Career.agencyState ? Career.agencyState(s) : pc?.agencyState;
    return safeArray(state?.objectives).map((o)=> {
      let current=null;
      const stats=s.statistics?.players?.hero||{};
      if(o.kind==="REPUTATION") current=Number(s.reputation||0);
      else if(o.kind==="OVERALL") {
        const api=engineApi();
        current=api?.overall ? api.overall(s.person) : null;
      }
      else if(o.kind==="SALARY") current=Number(s.salary||0);
      else if(o.kind==="PLAYTIME") current=Number(stats.appearances||0);
      else if(o.kind==="TRANSFER") current=pc?.marketState?.signedAgreement ? 1 : 0;

      const baseline=Number(o.baseline||0);
      const target=Number(o.target||0);
      const progress=target>baseline && Number.isFinite(current)
        ? clamp(((current-baseline)/(target-baseline))*100)
        : target>0 && Number.isFinite(current)
          ? clamp((current/target)*100)
          : null;

      return normalizeObjective({
        id:o.id,
        source:"agency",
        category:"AGÊNCIA",
        title:o.title,
        description:"Objetivo definido pela estratégia atual da sua agência.",
        current,
        target,
        progress,
        deadline:o.deadline,
        status:o.status,
        priority:o.status==="ATIVO" ? "IMPORTANTE" : "NORMAL",
        page:"agency"
      });
    });
  }

  function pendingObjectives(s){
    const api=engineApi();
    const pending=typeof api?.pendingActions==="function" ? api.pendingActions(s) : [];
    return safeArray(pending).map((p)=>normalizeObjective({
      id:"pending:"+p.id,
      source:"pending",
      category:"PENDÊNCIA",
      title:p.title,
      description:Number.isFinite(p.deadline)
        ? "Requer resposta em "+daysLeft(s,p.deadline)+" dia(s)."
        : "Ação aguardando sua resposta.",
      deadline:p.deadline,
      status:"PENDENTE",
      priority:p.priority||"URGENTE",
      page:p.page,
      anchor:p.anchor,
      actionable:true
    }));
  }

  function coachObjectives(s){
    const Squad=squadApi();
    const out=[];
    if(s?.mode!=="player" || !Squad) return out;

    const promise=Squad.coachPromiseStatus?.(s);
    if(promise?.active || promise?.status==="ATIVO"){
      out.push(normalizeObjective({
        id:"coach-promise:"+String(promise.id||promise.createdDay||"active"),
        source:"coach",
        category:"TREINADOR",
        title:promise.title||"Promessa ao treinador",
        description:promise.description||promise.summary||"Compromisso assumido com a comissão técnica.",
        current:Number.isFinite(promise.current)?promise.current:null,
        target:Number.isFinite(promise.target)?promise.target:null,
        deadline:promise.deadline,
        status:"ATIVO",
        priority:"IMPORTANTE",
        page:"squad"
      }));
    }

    const conversation=Squad.coachConversationStatus?.(s);
    if(conversation?.available || conversation?.pending){
      out.push(normalizeObjective({
        id:"coach-conversation:"+String(conversation.id||"available"),
        source:"coach",
        category:"TREINADOR",
        title:"Conversa com o treinador disponível",
        description:conversation.reason||conversation.summary||"Há uma conversa de carreira disponível com o treinador.",
        status:"PENDENTE",
        priority:"NORMAL",
        page:"squad",
        actionable:true
      }));
    }

    return out;
  }

  function careerObjectives(s){
    if(s?.mode!=="player") return [];
    const Career=careerApi();
    const pc=Career?.init?.(s)?.playerCareer;
    const out=[];

    if(pc?.targetClub){
      const club=engineApi()?.club?.(s,pc.targetClub.clubId);
      out.push(normalizeObjective({
        id:"career:target-club:"+pc.targetClub.clubId,
        source:"career",
        category:"CARREIRA",
        title:"Clube-alvo: "+(club?.name||pc.targetClub.clubId),
        description:pc.targetClub.assessment?.label||"Objetivo definido com seu agente.",
        status:"ATIVO",
        priority:"NORMAL",
        page:"market"
      }));
    }

    if(pc?.contract && Number.isFinite(pc.contract.endDay)){
      const remaining=Math.max(0,pc.contract.endDay-Number(s.day||0));
      if(remaining<=365){
        out.push(normalizeObjective({
          id:"career:contract:"+pc.contract.endDay,
          source:"career",
          category:"CONTRATO",
          title:remaining<=180 ? "Definir futuro contratual" : "Contrato entra no último ano",
          description:"Restam "+remaining+" dia(s) do vínculo atual.",
          deadline:pc.contract.endDay,
          status:"ATIVO",
          priority:remaining<=180 ? "IMPORTANTE" : "NORMAL",
          page:"proposals"
        }));
      }
    }

    return out;
  }

  function objectives(s){
    if(s?.mode!=="player") return [];
    const all=[
      ...pendingObjectives(s),
      ...coachObjectives(s),
      ...matchObjectives(s),
      ...agencyObjectives(s),
      ...careerObjectives(s)
    ];

    const seen=new Set();
    return all
      .filter((item)=>{
        if(!item.id || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .sort((a,b)=>{
        const priority=priorityRank(a.priority)-priorityRank(b.priority);
        if(priority) return priority;
        const ad=Number.isFinite(a.deadline)?a.deadline:Infinity;
        const bd=Number.isFinite(b.deadline)?b.deadline:Infinity;
        return ad-bd;
      });
  }

  function timeline(s,limit=40){
    if(s?.mode!=="player") return [];
    const Career=careerApi();
    const career=Career?.init?.(s)||{};
    const rows=[];
    const add=(spec)=>{
      if(!spec || !Number.isFinite(Number(spec.day))) return;
      rows.push({
        id:String(spec.id||[spec.type,spec.day,spec.title].join(":")),
        day:Number(spec.day),
        season:Number(spec.season||s.season||0),
        type:String(spec.type||"career"),
        category:String(spec.category||"CARREIRA"),
        title:String(spec.title||"Registro da carreira"),
        detail:String(spec.detail||""),
        importance:String(spec.importance||"NORMAL")
      });
    };

    for(const ev of safeArray(career.communications?.events)){
      add({
        id:"event:"+ev.id,
        day:ev.day,
        season:ev.season,
        type:"event",
        category:ev.type||"EVENTO",
        title:(ev.data?.title||ev.type||"Evento de carreira").replaceAll("_"," "),
        detail:ev.data?.summary||"",
        importance:"NORMAL"
      });
    }

    for(const article of safeArray(career.communications?.articles)){
      add({
        id:"article:"+article.id,
        day:article.day,
        season:article.season,
        type:"news",
        category:article.category,
        title:article.title,
        detail:article.body,
        importance:"NORMAL"
      });
    }

    for(const row of safeArray(career.transfers).filter(t=>t.player===s.person?.name)){
      add({
        id:"transfer:"+String(row.day||0)+":"+String(row.to||""),
        day:Number(row.day||0),
        type:"transfer",
        category:"TRANSFERÊNCIA",
        title:"Transferência para "+String(row.to||"novo clube"),
        detail:(row.from ? String(row.from)+" → " : "")+String(row.to||""),
        importance:"IMPORTANTE"
      });
    }

    for(const row of safeArray(career.legacy?.milestones)){
      add({
        id:"milestone:"+String(row.id||row.day||row.title||rows.length),
        day:Number(row.day||0),
        season:row.season,
        type:"milestone",
        category:"MARCO",
        title:row.title||row.label||"Marco da carreira",
        detail:row.detail||row.description||"",
        importance:"IMPORTANTE"
      });
    }

    for(const row of safeArray(s.decisionConsequences)){
      add({
        id:"decision:"+String(row.id||row.day||rows.length),
        day:Number(row.day||0),
        season:row.season,
        type:"decision",
        category:"DECISÃO",
        title:row.title||"Escolha de carreira",
        detail:row.summary||"",
        importance:"NORMAL"
      });
    }

    const unexpected=unexpectedApi()?.recent?.(s,20)||[];
    for(const row of safeArray(unexpected)){
      add({
        id:"unexpected:"+String(row.id||row.eventId||row.day||rows.length),
        day:Number(row.day||row.resolvedDay||0),
        season:row.season,
        type:"unexpected",
        category:row.category||"FORA DE CAMPO",
        title:row.title||"Acontecimento fora de campo",
        detail:row.choiceLabel||row.choice||row.summary||"",
        importance:"NORMAL"
      });
    }

    const personality=s.extras?.playerCareer?.personality;
    for(const row of safeArray(personality?.history).slice(0,20)){
      add({
        id:"personality:"+String(row.eventId||row.day)+":"+row.choice,
        day:row.day,
        season:row.season,
        type:"personality",
        category:"PERSONALIDADE",
        title:row.label||row.choice||"Escolha registrada",
        detail:row.profileAfter!==row.profileBefore
          ? "Perfil: "+row.profileBefore+" → "+row.profileAfter
          : "",
        importance:"NORMAL"
      });
    }

    const dedupe=new Map();
    for(const row of rows){
      const key=[row.day,row.category,row.title,row.detail].join("|");
      if(!dedupe.has(key)) dedupe.set(key,row);
    }

    return [...dedupe.values()]
      .sort((a,b)=>b.day-a.day)
      .slice(0,Math.max(1,Number(limit)||40));
  }

  function milestones(s){
    if(s?.mode!=="player") return [];
    const Career=careerApi();
    const legacy=Career?.legacySnapshot?.(s);
    if(!legacy) return [];

    const items=[
      {id:"games",label:"Jogos na carreira",value:Number(legacy.games||0)},
      {id:"goals",label:"Gols na carreira",value:Number(legacy.goals||0)},
      {id:"assists",label:"Assistências na carreira",value:Number(legacy.assists||0)},
      {id:"titles",label:"Títulos",value:Number(legacy.titles||0)},
      {id:"awards",label:"Prêmios individuais",value:Number(legacy.awards||0)},
      {id:"caps",label:"Jogos pela Seleção",value:Number(legacy.national?.caps||0)},
      {id:"nationalGoals",label:"Gols pela Seleção",value:Number(legacy.national?.goals||0)}
    ];

    return {
      tier:legacy.tier,
      score:legacy.score,
      items,
      clubs:safeArray(legacy.clubs),
      biggestTransfer:legacy.biggestTransfer||null,
      records:safeArray(legacy.milestones)
    };
  }

  function snapshot(s){
    if(s?.mode!=="player"){
      return {
        available:false,
        objectives:[],
        urgent:[],
        active:[],
        completed:[],
        timeline:[],
        milestones:null
      };
    }

    const list=objectives(s);
    return {
      available:true,
      objectives:list,
      urgent:list.filter(x=>x.priority==="URGENTE"),
      active:list.filter(x=>["ATIVO","PENDENTE"].includes(x.status)),
      completed:list.filter(x=>["CONCLUÍDO","CONCLUIDO"].includes(x.status)),
      timeline:timeline(s,40),
      milestones:milestones(s)
    };
  }

  const api={
    snapshot,
    objectives,
    timeline,
    milestones,
    matchObjectives,
    agencyObjectives,
    pendingObjectives,
    coachObjectives,
    careerObjectives
  };

  root.ProLifeStoryHub=api;
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
