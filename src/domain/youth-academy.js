(function(root){
  "use strict";
  // PRO LIFE — Academia (categoria de base) do modo treinador, no estilo do FC 27:
  // admissão periódica de jovens, lotação por nível, evolução, promover/dispensar/emprestar
  // e rede de olheiros da base (missões por país e requisitos, relatórios, contratação).
  // Estado em s.coachCareer.youth. Os jovens são jogadores reais do universo global (academy:true, clubId do clube).
  const GFm=()=>root.ProLifeGlobalFootball||(typeof require==="function"?require("./global-football.js"):null);
  const FACm=()=>root.ProLifeFacilities||(typeof require==="function"?require("./facilities.js"):null);
  const CFm=()=>root.ProLifeClubFinance||(typeof require==="function"?require("./club-finance.js"):null);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const hash=str=>{let h=2166136261;for(const c of String(str)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
  const unit=str=>hash(str)/4294967296;
  const POSITIONS=["GOL","DEF","MEI","ATA"];
  const MAX_SQUAD=36,MIN_PROMOTE_AGE=16,LOG_LIMIT=40,REPORT_LIMIT=60,HIST_LIMIT=24;
  const MISSION_COST=40000;

  function ensure(s){
    if(!s||s.mode!=="coach"||!s.coachCareer||!s.clubId)return null;
    let y=s.coachCareer.youth;
    if(!y||y.version!==1||y.clubId!==s.clubId){
      y=s.coachCareer.youth={version:1,clubId:s.clubId,nextIntakeDay:num(s.day)+45,nextMissionId:1,missions:[],reports:[],history:{},loans:{},log:[]};
    }
    return y;
  }
  const level=s=>FACm()?.levelOf(s,"academy")||0;
  const scoutLevel=s=>FACm()?.levelOf(s,"scouting")||0;
  const rules=s=>{
    const a=level(s),sc=scoutLevel(s);
    return {
      level:a,scoutLevel:sc,
      capacity:6+2*a,                         // lotação da base
      intakeSize:2+Math.floor(a/2),            // jovens por admissão
      intakeEveryDays:182-14*a,               // frequência da admissão
      qualityBoost:1+0.25*a,                  // chance de talentos
      potentialSpread:Math.max(2,12-2*a),     // margem de erro do potencial dos jovens da casa
      growthChance:0.10+0.02*a,               // evolução mensal
      missionSlots:1+sc,                      // tarefas de olheiro simultâneas
      missionResults:2+Math.floor(sc/2),     // jogadores por relatório
      missionDays:Math.max(10,21-2*sc),       // prazo do relatório
      missionSpread:Math.max(2,12-2*sc),      // margem de erro do potencial dos observados
      missionCost:MISSION_COST
    };
  };
  const ovrOf=p=>num(p?.ovr??p?.overall);
  const ageOf=p=>num(p?.age,17);
  const starsOf=pot=>clamp(Math.round(((num(pot)-45)/10)*2)/2,0.5,5);
  const activeKid=p=>p&&p.academy&&p.status!=="retired"&&p.active!==false;

  function ownKids(s){
    const GF=GFm();if(!GF)return [];
    return GF.playersByClub(s,s.clubId).filter(activeKid);
  }
  function potentialRange(p,spread,salt){
    const n=(unit(`${p.id}|pot|${salt}`)*2-1)*spread*0.5,mid=clamp(num(p.potential)+n,40,99);
    return {lo:Math.round(clamp(mid-spread,40,99)),hi:Math.round(clamp(mid+spread,40,99)),mid:Math.round(mid)};
  }
  const trendOf=(y,p)=>{const h=y.history[p.id]||[];if(h.length<2)return 0;return h[h.length-1][1]-h[Math.max(0,h.length-4)][1];};

  function kidRow(s,y,p,r){
    const loan=y.loans[p.id]||null,pr=potentialRange(p,r.potentialSpread,r.level);
    const tr=trendOf(y,p);
    let promoteReason="";
    if(ageOf(p)<MIN_PROMOTE_AGE)promoteReason=`Só pode subir a partir dos ${MIN_PROMOTE_AGE} anos.`;
    else if(loan)promoteReason="Está emprestado: chame de volta primeiro.";
    return {
      id:p.id,name:p.name,age:ageOf(p),pos:p.pos,nationality:p.nationality||"",ovr:ovrOf(p),
      potLo:pr.lo,potHi:pr.hi,potMid:pr.mid,stars:starsOf(pr.mid),trend:tr,
      developing:ovrOf(p)<num(p.potential)-2,loaned:!!loan,loanTo:loan?.to||"",
      canPromote:!promoteReason,promoteReason,
      history:(y.history[p.id]||[]).map(x=>x[1])
    };
  }

  function reportRow(s,x){
    const GF=GFm(),p=GF?.playerById?.(s,x.playerId)||null;
    const mine=p&&p.clubId===s.clubId;
    return {id:x.id,type:x.type,day:x.day,playerId:x.playerId,name:x.name,age:x.age,pos:x.pos,nationality:x.nationality,club:x.club||"Sem clube",
      ovrLo:x.ovrLo,ovrHi:x.ovrHi,potLo:x.potLo,potHi:x.potHi,stars:x.stars,fee:x.fee,
      state:!p?"gone":mine?"signed":((p.clubId||null)!==(x.clubId||null)||(p.clubId&&!p.academy))?"taken":"open"};
  }
  function prospectFee(p){
    if(!p.clubId)return Math.round((12000+Math.max(0,num(p.potential)-55)*1800)/1000)*1000;
    const pot=Math.max(0,num(p.potential)-50);
    return Math.round((pot*pot*1500+ovrOf(p)*2500)/1000)*1000;
  }

  function countries(s){
    const GF=GFm(),map=new Map();
    for(const p of GF?.activePlayers?.(s)||[]){
      if(ageOf(p)>19||p.clubId===s.clubId||!(p.academy||!p.clubId)||!p.nationality)continue;
      map.set(p.nationality,(map.get(p.nationality)||0)+1);
    }
    return [...map.entries()].filter(([,n])=>n>=3).sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1)).map(([name,count])=>({name,count}));
  }

  function view(s,api){
    const y=ensure(s);if(!y)return null;
    const r=rules(s),kids=ownKids(s),club=api?.club?.(s)||null;
    const rows=kids.map(p=>kidRow(s,y,p,r)).sort((a,b)=>b.potMid-a.potMid||b.ovr-a.ovr||(a.id<b.id?-1:1));
    const used=rows.filter(k=>!k.loaned).length;
    const fac=FACm();
    const upCost=fac?.upgradeCost?.(s,club,"academy")??null;
    const rulesAt=(acad,scout)=>{const f=s.coachCareer.facilities||{};return rules({...s,coachCareer:{...s.coachCareer,facilities:{...f,version:1,clubId:s.clubId,levels:{...(f.levels||{}),academy:acad,scouting:scout}}}});};
    const nextRules=r.level<5?rulesAt(r.level+1,r.scoutLevel):null;
    const nextScoutRules=r.scoutLevel<5?rulesAt(r.level,r.scoutLevel+1):null;
    const scoutUpgradeCost=fac?.upgradeCost?.(s,club,"scouting")??null;
    const missions=y.missions.slice().reverse().map(m=>({...m,remaining:Math.max(0,Math.ceil(m.startDay+m.duration-num(s.day))),progress:m.status==="complete"?100:Math.round(clamp((num(s.day)-m.startDay)/Math.max(1,m.duration),0,1)*100)}));
    return {
      rules:r,nextRules,nextScoutRules,scoutUpgradeCost,level:r.level,scoutLevel:r.scoutLevel,maxLevel:5,upgradeCost:upCost,budget:num(club?.budget),
      capacity:r.capacity,used,loanedCount:rows.length-used,free:Math.max(0,r.capacity-used),
      nextIntakeDay:y.nextIntakeDay,daysToIntake:Math.max(0,y.nextIntakeDay-num(s.day)),
      kids:rows.map(k=>(k.canPromote&&(club?.roster||[]).filter(p=>p&&p.id!=="hero").length>=MAX_SQUAD)?{...k,canPromote:false,promoteReason:`Elenco principal cheio (${MAX_SQUAD}). Libere vagas vendendo ou dispensando jogadores.`}:k),reports:y.reports.map(x=>reportRow(s,x)),
      missions,openSlots:Math.max(0,r.missionSlots-y.missions.filter(m=>m.status==="active").length),countries:countries(s),
      log:y.log.slice(0,12),squadSize:(club?.roster||[]).filter(p=>p&&p.id!=="hero").length,maxSquad:MAX_SQUAD
    };
  }

  function pushLog(y,s,text){y.log.unshift({day:num(s.day),text});y.log=y.log.slice(0,LOG_LIMIT);}

  // ===== ações =====
  function kidById(s,id){const p=ownKids(s).find(k=>k.id===id);if(!p)throw Error("Jogador não está na sua base.");return p;}

  function promote(s,api,id,ctx={}){
    const y=ensure(s);if(!y)throw Error("Disponível apenas ao treinador.");
    const p=kidById(s,id);
    if(y.loans[id])throw Error("Está emprestado: chame de volta antes de promover.");
    if(ageOf(p)<MIN_PROMOTE_AGE)throw Error(`Só pode subir a partir dos ${MIN_PROMOTE_AGE} anos.`);
    const club=api.club(s);
    if((club.roster||[]).filter(x=>x&&x.id!=="hero").length>=MAX_SQUAD)throw Error(`Elenco cheio (${MAX_SQUAD}). Libere uma vaga antes de promover.`);
    delete p.academy;
    const added=api.adoptIntoOwnRoster(s,p);
    if(!added){p.academy=true;throw Error("Não foi possível integrar o jogador ao elenco.");}
    delete y.history[id];
    pushLog(y,s,`${p.name} foi promovido ao elenco principal.`);
    ctx.log?.("Base: promoção",`${p.name} (${ageOf(p)} anos, ${p.pos}, GER ${ovrOf(p)}) subiu para o elenco principal.`);
    return added;
  }
  function release(s,api,id,ctx={}){
    const y=ensure(s);if(!y)throw Error("Disponível apenas ao treinador.");
    const p=kidById(s,id);
    p.clubHistory=(p.clubHistory||[]).concat({season:s.season,fromClubId:s.clubId,toClubId:null}).slice(-30);
    p.clubId=null;p.leagueId=null;delete p.academy;delete p.externalClub;delete p.club;
    delete y.history[id];delete y.loans[id];
    pushLog(y,s,`${p.name} foi dispensado da base.`);
    ctx.log?.("Base: dispensa",`${p.name} foi dispensado da base e está livre no mercado.`);
    return p;
  }
  function loan(s,api,id,ctx={}){
    const y=ensure(s);if(!y)throw Error("Disponível apenas ao treinador.");
    const p=kidById(s,id);
    if(y.loans[id])throw Error("Jogador já está emprestado.");
    if(ageOf(p)<17)throw Error("Só jogadores a partir dos 17 anos podem ser emprestados.");
    const peers=(s.globalFootball?.clubs||[]).filter(c=>c&&c.active!==false&&c.id!==s.clubId&&c.leagueId===api.club(s).leagueId);
    const pick=peers.length?peers[Math.floor(unit(`${id}|loan|${s.season}`)*peers.length)]:null;
    y.loans[id]={season:s.season,to:pick?.name||"clube parceiro",toId:pick?.id||null,day:num(s.day)};
    pushLog(y,s,`${p.name} foi emprestado ao ${y.loans[id].to} até o fim da temporada.`);
    ctx.log?.("Base: empréstimo",`${p.name} foi emprestado ao ${y.loans[id].to} para ganhar minutos e volta no fim da temporada.`);
  }
  function recall(s,api,id,ctx={}){
    const y=ensure(s);if(!y)throw Error("Disponível apenas ao treinador.");
    const p=kidById(s,id);
    if(!y.loans[id])throw Error("Jogador não está emprestado.");
    if(ownKids(s).filter(k=>!y.loans[k.id]).length>=rules(s).capacity)throw Error("Base lotada: libere uma vaga antes de chamar de volta.");
    const to=y.loans[id].to;delete y.loans[id];
    pushLog(y,s,`${p.name} voltou do empréstimo (${to}).`);
    ctx.log?.("Base: retorno",`${p.name} voltou do empréstimo no ${to}.`);
  }

  // ===== olheiros da base =====
  function startMission(s,api,opts={}){
    const y=ensure(s);if(!y)throw Error("Disponível apenas ao treinador.");
    const r=rules(s),club=api.club(s);
    if(y.missions.filter(m=>m.status==="active").length>=r.missionSlots)throw Error("Todos os olheiros estão ocupados. Aguarde um relatório ou evolua a Rede de olheiros.");
    const country=String(opts.country||"").trim();
    if(!country||!countries(s).some(c=>c.name===country))throw Error("Escolha um país para a busca.");
    const positions=(Array.isArray(opts.positions)?opts.positions:[]).filter(p=>POSITIONS.includes(p));
    const ageMin=clamp(Math.round(num(opts.ageMin,15)),15,19),ageMax=clamp(Math.round(num(opts.ageMax,19)),ageMin,19);
    const minStars=clamp(Math.round(num(opts.minStars,2.5)*2)/2,0.5,5);
    const cost=r.missionCost;
    if(num(club.budget)<cost)throw Error("Orçamento insuficiente para enviar o olheiro.");
    const CF=CFm();
    if(CF)CF.expense(s,club,"operacao",cost,`Olheiro da base: ${country}`);else club.budget-=cost;
    const m={id:y.nextMissionId++,country,positions,ageMin,ageMax,minStars,startDay:num(s.day),duration:r.missionDays,status:"active",results:0,cost};
    y.missions.push(m);
    pushLog(y,s,`Olheiro enviado a ${country} (${positions.length?positions.join("/"):"qualquer posição"}, ${ageMin}–${ageMax} anos, ${minStars}★+).`);
    return m;
  }
  function cancelMission(s,id){
    const y=ensure(s);if(!y)throw Error("Disponível apenas ao treinador.");
    const m=y.missions.find(x=>x.id===id&&x.status==="active");
    if(!m)throw Error("Missão não encontrada.");
    y.missions=y.missions.filter(x=>x!==m);
  }
  function finishMission(s,y,m,ctx){
    const r=rules(s),GF=GFm();
    const minPot=45+10*m.minStars,seen=new Set(y.reports.map(x=>x.playerId));
    const cands=(GF?.activePlayers?.(s)||[]).filter(p=>p&&p.id!=="hero"&&p.nationality===m.country&&ageOf(p)>=m.ageMin&&ageOf(p)<=m.ageMax&&p.clubId!==s.clubId&&(p.academy||!p.clubId)&&num(p.potential)>=minPot&&(!m.positions.length||m.positions.includes(p.pos))&&!seen.has(p.id));
    const scored=cands.map(p=>({p,score:num(p.potential)+unit(`${m.id}|${p.id}|${s.season}`)*r.missionSpread*2})).sort((a,b)=>b.score-a.score||(a.p.id<b.p.id?-1:1)).slice(0,r.missionResults);
    const clubName=id=>(s.globalFootball?.clubs||[]).find(c=>c.id===id)?.name||"";
    for(const {p} of scored){
      const pr=potentialRange(p,r.missionSpread,`m${m.id}`),o=ovrOf(p),sp=Math.max(1,Math.round(r.missionSpread/3));
      y.reports.unshift({id:`${m.id}-${p.id}`,type:"olheiro",missionId:m.id,playerId:p.id,day:num(s.day),name:p.name,age:ageOf(p),pos:p.pos,nationality:p.nationality||"",
        clubId:p.clubId||null,club:p.clubId?clubName(p.clubId):"Sem clube",ovrLo:o-sp,ovrHi:o+sp,potLo:pr.lo,potHi:pr.hi,stars:starsOf(pr.mid),fee:prospectFee(p)});
    }
    y.reports=y.reports.slice(0,REPORT_LIMIT);
    m.status="complete";m.results=scored.length;m.endDay=num(s.day);
    const txt=scored.length?`O olheiro voltou de ${m.country} com ${scored.length} jovem(ns) observado(s).`:`O olheiro voltou de ${m.country} sem encontrar ninguém com esses requisitos.`;
    pushLog(y,s,txt);ctx.log?.("Base: relatório do olheiro",txt);
  }
  function signProspect(s,api,playerId,ctx={}){
    const y=ensure(s);if(!y)throw Error("Disponível apenas ao treinador.");
    const GF=GFm(),p=GF?.playerById?.(s,playerId),rep=y.reports.find(x=>x.playerId===playerId);
    if(!rep)throw Error("Só dá para contratar jovens que constam em relatórios do olheiro.");
    if(!p||p.status==="retired"||p.active===false)throw Error("Jogador indisponível.");
    if(p.clubId===s.clubId)throw Error("Jogador já está no seu clube.");
    if(p.clubId&&!p.academy)throw Error("Jogador já subiu para o elenco principal de outro clube.");
    if(ageOf(p)>19)throw Error("Jogador passou da idade da base.");
    const r=rules(s);
    if(ownKids(s).filter(k=>!y.loans[k.id]).length>=r.capacity)throw Error(`Base lotada (${r.capacity}). Promova ou dispense alguém.`);
    const club=api.club(s),fee=prospectFee(p);
    if(num(club.budget)<fee)throw Error("Orçamento insuficiente para esta contratação.");
    const CF=CFm();
    if(CF)CF.expense(s,club,"operacao",fee,`Contratação para a base: ${p.name}`);else club.budget-=fee;
    p.clubHistory=(p.clubHistory||[]).concat({season:s.season,fromClubId:p.clubId||null,toClubId:s.clubId}).slice(-30);
    p.clubId=s.clubId;p.leagueId=club.leagueId||null;p.academy=true;p.externalClub=club.name;delete p.club;
    y.reports=y.reports.filter(x=>x.playerId!==playerId);
    pushLog(y,s,`${p.name} foi contratado para a base por R$ ${fee.toLocaleString("pt-BR")}.`);
    ctx.log?.("Base: contratação",`${p.name} (${ageOf(p)} anos, ${p.pos}) chegou à base por R$ ${fee.toLocaleString("pt-BR")}.`);
    return {player:p,fee};
  }
  function dismissReport(s,id){
    const y=ensure(s);if(!y)throw Error("Disponível apenas ao treinador.");
    y.reports=y.reports.filter(x=>x.id!==id);
  }

  // ===== passagem do tempo =====
  function intake(s,api,y,ctx){
    const GF=GFm(),r=rules(s);
    const kids=ownKids(s).filter(k=>!y.loans[k.id]);
    let free=Math.max(0,r.capacity-kids.length),made=0;
    const have={};for(const k of kids)have[k.pos]=(have[k.pos]||0)+1;
    for(let i=0;i<r.intakeSize&&free>0;i++){
      const x=unit(`${s.clubId}|${s.day}|pos|${i}`);
      const pos=!have.GOL?"GOL":x<0.35?"DEF":x<0.75?"MEI":"ATA";
      const age=15+Math.floor(unit(`${s.clubId}|${s.day}|age|${i}`)*3);
      const p=GF.generateYouth(s,{clubId:s.clubId,age,pos,boost:r.qualityBoost,tag:`acad${s.day}`});
      if(!p)continue;
      have[pos]=(have[pos]||0)+1;free--;made++;
      y.history[p.id]=[[num(s.day),ovrOf(p)]];
    }
    const skipped=r.intakeSize-made;
    const txt=made?`Nova turma na base: ${made} jovem(ns) admitido(s)${skipped>0?`; ${skipped} ficaram de fora por falta de vagas`:""}.`:`Admissão de jovens sem vagas: a base está lotada (${r.capacity}).`;
    pushLog(y,s,txt);ctx.log?.("Base: nova turma",txt);
  }
  function monthlyDevelopment(s,y){
    const r=rules(s);
    for(const p of ownKids(s)){
      const loan=y.loans[p.id],o=ovrOf(p),pot=num(p.potential);
      const h=(y.history[p.id]||(y.history[p.id]=[]));
      if(o<pot-2){
        const chance=r.growthChance*(ageOf(p)<=17?1.3:1)*(loan?1.6:1);
        if(unit(`${p.id}|dev|${s.day}`)<chance){p.ovr=o+1;p.overall=o+1;if(p.attrs)for(const k of Object.keys(p.attrs))p.attrs[k]=clamp(num(p.attrs[k])+1,20,99);}
      }
      h.push([num(s.day),ovrOf(p)]);if(h.length>HIST_LIMIT)h.splice(0,h.length-HIST_LIMIT);
    }
  }
  function completeMissions(s,y,ctx){
    for(const m of y.missions)if(m.status==="active"&&num(s.day)>=m.startDay+m.duration)finishMission(s,y,m,ctx);
    if(y.missions.length>12)y.missions=y.missions.filter(m=>m.status==="active").concat(y.missions.filter(m=>m.status!=="active").slice(-8));
  }
  function daily(s,api,ctx={}){
    const y=ensure(s);if(!y||!GFm()||s.catalogVersion!=="fc27_v1")return;
    const day=num(s.day);
    if(day>=y.nextIntakeDay){
      intake(s,api,y,ctx);
      const every=rules(s).intakeEveryDays;
      while(y.nextIntakeDay<=day)y.nextIntakeDay+=every;
    }
    if(day%30===0)monthlyDevelopment(s,y);
    completeMissions(s,y,ctx);
  }
  // Fim da temporada: quem completa 20 anos sobe ou é dispensado; empréstimos voltam.
  function closeSeason(s,api,ctx={}){
    const y=ensure(s);if(!y||!GFm())return null;
    const club=api.club(s),level=num(club?.strength,num(club?.reputation,60)*0.9);
    let promoted=0,released=0;
    y.loans={};
    for(const p of ownKids(s).filter(k=>ageOf(k)>=20)){
      const roomy=(club.roster||[]).filter(x=>x&&x.id!=="hero").length<MAX_SQUAD;
      if(roomy&&(ovrOf(p)>=level-14||num(p.potential)>=level+2)){try{promote(s,api,p.id,{});promoted++;}catch(e){release(s,api,p.id,{});released++;}}
      else{release(s,api,p.id,{});released++;}
    }
    if(promoted||released){const txt=`Limite de idade da base: ${promoted} promovido(s) e ${released} dispensado(s).`;pushLog(y,s,txt);ctx.log?.("Base: fim de temporada",txt);}
    return {promoted,released};
  }
  // Avisos para a Central.
  function alerts(s){
    const y=ensure(s);if(!y)return [];
    const out=[],r=rules(s),kids=ownKids(s);
    const old=kids.filter(k=>ageOf(k)>=19);
    if(old.length)out.push({kind:"idade",text:`${old.length} jovem(ns) da base chegam ao limite de idade no fim da temporada: promova ou dispense.`});
    const fresh=y.reports.filter(x=>num(s.day)-x.day<=7);
    if(fresh.length)out.push({kind:"relatorio",text:`${fresh.length} novo(s) jovem(ns) em relatórios do olheiro da base.`});
    if(kids.filter(k=>!y.loans[k.id]).length>=r.capacity)out.push({kind:"lotacao",text:"A base está lotada: novas admissões ficam de fora."});
    return out;
  }

  const api={ensure,rules,view,promote,release,loan,recall,startMission,cancelMission,signProspect,dismissReport,daily,closeSeason,alerts,ownKids,countries,prospectFee,starsOf,MAX_SQUAD};
  root.ProLifeYouthAcademy=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
