(function (root) {
  "use strict";
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const brands = [
    {id:"vertex",name:"Vertex Sports",category:"MATERIAL ESPORTIVO",prestige:58,budget:1800000,regions:["Brasil"],minPopularity:24,minReputation:28,age:[16,30],profile:"Jovens em evolução",type:"emerging",typicalDuration:365},
    {id:"nova",name:"Nova Athletics",category:"MATERIAL ESPORTIVO",prestige:88,budget:9000000,regions:["Brasil","Global"],minPopularity:68,minReputation:72,age:[18,33],profile:"Referências esportivas",type:"premium",typicalDuration:730},
    {id:"pulse",name:"Pulse Energy",category:"BEBIDA",prestige:52,budget:1400000,regions:["Brasil"],minPopularity:30,minReputation:22,age:[16,28],profile:"Atletas carismáticos",type:"young",typicalDuration:180},
    {id:"orbe",name:"Orbe Tech",category:"TECNOLOGIA",prestige:70,budget:3600000,regions:["Brasil","América do Sul"],minPopularity:45,minReputation:42,age:[17,32],profile:"Imagem moderna",type:"modern",typicalDuration:365},
    {id:"voltz",name:"Voltz Motors",category:"AUTOMOTIVO",prestige:82,budget:6500000,regions:["Brasil"],minPopularity:58,minReputation:62,age:[21,35],profile:"Atletas consolidados",type:"premium",typicalDuration:730},
    {id:"linha",name:"Linha Onze",category:"MODA",prestige:47,budget:1100000,regions:["Brasil"],minPopularity:35,minReputation:25,age:[17,29],profile:"Personalidade e estilo",type:"campaign",typicalDuration:60},
    {id:"aureo",name:"Áureo Chronos",category:"RELÓGIOS",prestige:94,budget:12000000,regions:["Global"],minPopularity:78,minReputation:82,age:[22,36],profile:"Campeões e ícones",type:"premium",typicalDuration:730},
    {id:"nexo",name:"Nexo Bank",category:"BANCO/FINTECH",prestige:64,budget:2800000,regions:["Brasil"],minPopularity:42,minReputation:48,age:[19,35],profile:"Confiança e profissionalismo",type:"professional",typicalDuration:365},
  ];
  const stages = ["SEM INTERESSE","OBSERVANDO","INTERESSADA","CONTATO","NEGOCIAÇÃO","PROPOSTA","CONTRATO ATIVO","ENCERRADO"];
  function blank(s) {
    const initial = clamp(Math.round(8 + Number(s.reputation || 0) * .32 + Number(s.extras?.playerCareer?.mediaProfile?.sponsorAppeal || 45) * .12), 5, 55);
    return {version:1,popularity:initial,followers:Math.max(100,Number(s.fans||100)),commercialValue:0,exposure:initial,interests:[],proposals:[],negotiations:[],contracts:[],payments:{},relations:{},events:[],history:[],milestones:[],processed:{},lastTick:-9999,lastFansSnapshot:Number(s.fans||100),revenue:0,bonusRevenue:0};
  }
  function init(s, api) {
    if (!s.commercial || typeof s.commercial !== "object") s.commercial=blank(s);
    const c=s.commercial;
    for(const key of ["interests","proposals","negotiations","contracts","events","history","milestones"]) if(!Array.isArray(c[key])) c[key]=[];
    for(const key of ["payments","relations","processed"]) if(!c[key]||typeof c[key]!=="object") c[key]={};
    if(!Number.isFinite(c.popularity)) c.popularity=10;
    if(!Number.isFinite(c.followers)) c.followers=Math.max(100,Number(s.fans||100));
    if(!Number.isFinite(c.exposure)) c.exposure=c.popularity;
    if(!Number.isFinite(c.lastFansSnapshot)) c.lastFansSnapshot=Number(s.fans||100);
    if(!Number.isFinite(c.revenue)) c.revenue=0;
    if(!Number.isFinite(c.bonusRevenue)) c.bonusRevenue=0;
    c.proposals=[...c.proposals.filter((x)=>x.status==="PROPOSTA"),...c.proposals.filter((x)=>x.status!=="PROPOSTA").slice(0,80)].slice(0,100);
    c.negotiations=c.negotiations.slice(0,80);
    c.contracts=[...c.contracts.filter((x)=>x.status==="ATIVO"),...c.contracts.filter((x)=>x.status!=="ATIVO").slice(0,80)].slice(0,100);
    c.events=[...c.events.filter((x)=>["AGENDADO","REAGENDADO"].includes(x.status)),...c.events.filter((x)=>!["AGENDADO","REAGENDADO"].includes(x.status)).slice(-80)].slice(0,100);
    c.history=c.history.slice(0,80);
    c.milestones=c.milestones.slice(-40);
    c.version=1;
    updateValue(s,api);
    return c;
  }
  function quality(s,api){return Number(api?.overall?.(s.person)||0);}
  function hasNational(s){return Number(s.nationalTeam?.caps||0)>0 || !!s.nationalTeam?.calledUp;}
  function performance(s){const r=s.statistics?.players?.hero;return r?.appearances?clamp((Number(r.ratingTotal||0)/r.appearances-5.5)*18+Number(r.goals||0)*.15+Number(r.assists||0)*.1,0,100):0;}
  function imageScore(s){const m=s.extras?.playerCareer?.mediaProfile;return clamp((Number(m?.fanSentiment||50)+Number(m?.sponsorAppeal||45)-Number(m?.controversies||0)*4)/2,0,100);}
  function updateValue(s,api){
    const c=s.commercial||blank(s), age=Number(s.person?.age||25), ageFactor=age<=24?1.08:age<=30?1:age<=34?.82:.58;
    const club=api?.club?.(s), clubFactor=club?clamp(Number(club.structure||50)/70,.55,1.35):.45;
    const selection=hasNational(s)?1.18:1, awards=(s.statistics?.awards||[]).filter(a=>a.winnerId==="hero"||a.winner===s.person?.name).length;
    const score=c.popularity*.43+Number(s.reputation||0)*.25+performance(s)*.12+imageScore(s)*.12+Math.min(8,awards*1.5)+(root.ProLifeIdentity?.commercialAppeal?.(s)||0);
    c.commercialValue=Math.max(20000,Math.round(score*score*210*ageFactor*clubFactor*selection/1000)*1000);
    return c.commercialValue;
  }
  function scoreBrand(s,brand,api){
    const c=init(s,api), age=Number(s.person?.age||25), agent=s.extras?.playerCareer?.agent, m=s.extras?.playerCareer?.mediaProfile;
    const ageFit=age>=brand.age[0]&&age<=brand.age[1]?10:-Math.min(20,Math.abs(age-clamp(age,brand.age[0],brand.age[1]))*4);
    const merit=c.popularity*.42+Number(s.reputation||0)*.30+quality(s,api)*.12+imageScore(s)*.10+(hasNational(s)?8:0)+ageFit;
    const access=Math.min(5,Number(agent?.reputation||0)/25)+Math.min(3,Number(agent?.network?.includes("América")||0)*2);
    return Math.round((merit+access)*10)/10;
  }
  function eligible(s,b,api){const c=init(s,api),age=Number(s.person?.age||25);return c.popularity>=b.minPopularity&&Number(s.reputation||0)>=b.minReputation&&age>=b.age[0]-2&&age<=b.age[1]+2;}
  function offerFor(s,b,api){
    const c=init(s,api), score=scoreBrand(s,b,api), premium=clamp((score+b.prestige)/180,.25,1.15), duration=b.typicalDuration||365;
    const amount=Math.max(1000,Math.round((b.budget/120)*premium/1000)*1000), type=b.type==="campaign"?"CAMPANHA PONTUAL":b.type==="young"?"FIXO + BÔNUS":b.type==="premium"?"CONTRATO POR TEMPORADA":"PAGAMENTO FIXO";
    return {id:`proposal:${b.id}:${s.season}:${s.day}`,brandId:b.id,brand:b.name,category:b.category,type,amount,durationDays:duration,bonus:{kind:hasNational(s)?"title":"callup",amount:Math.round(amount*.75/1000)*1000,label:hasNational(s)?"Bônus por título":"Bônus por convocação"},requirements:["Manter exposição profissional","Comparecer aos eventos confirmados"],exclusive:b.category==="MATERIAL ESPORTIVO"||b.type==="premium",startDay:s.day+1,endDay:s.day+duration+1,expires:s.day+14,round:0,status:"PROPOSTA"};
  }
  function message(s,helpers,subject,body,priority="NORMAL",eventId){helpers?.addMessage?.(s,{category:"AGENTE",sender:"Agente",subject,body,priority,eventId});}
  function article(s,helpers,title,body,eventId){helpers?.addArticle?.(s,{category:"JOGADOR",title,body,eventId});}
  function progressInterests(s,rng,helpers,api){
    if(s.mode!=="player") return;
    const c=init(s,api); if(s.day-c.lastTick<14)return;c.lastTick=s.day;
    for(const b of brands){
      let item=c.interests.find(x=>x.brandId===b.id);const score=scoreBrand(s,b,api);
      if(!item&&score>=Math.max(35,b.minPopularity*.65+b.minReputation*.35)){item={brandId:b.id,stage:"OBSERVANDO",score,startedDay:s.day,updatedDay:s.day,ticks:0};c.interests.push(item);message(s,helpers,"Marca começou a observar",`${b.name} acompanha sua evolução, sem proposta formal.`,"NORMAL",`commercial:observe:${b.id}:${s.day}`);}
      if(!item||["CONTRATO ATIVO","ENCERRADO"].includes(item.stage))continue;
      item.score=score;item.updatedDay=s.day;item.ticks++;
      if(item.stage==="OBSERVANDO"&&item.ticks>=2&&eligible(s,b,api))item.stage="INTERESSADA";
      else if(item.stage==="INTERESSADA"&&item.ticks>=3){item.stage="CONTATO";message(s,helpers,"Contato comercial",`${b.name} autorizou seu agente a iniciar conversas.`,"IMPORTANTE",`commercial:contact:${b.id}:${s.day}`);}
      else if(item.stage==="CONTATO"&&item.ticks>=4){item.stage="NEGOCIAÇÃO";}
      else if(item.stage==="NEGOCIAÇÃO"&&item.ticks>=5&&!c.proposals.some(p=>p.brandId===b.id&&p.status==="PROPOSTA")){const p=offerFor(s,b,api);c.proposals.unshift(p);item.stage="PROPOSTA";message(s,helpers,"Proposta de patrocínio",`${b.name} enviou proposta de ${p.type.toLowerCase()} no valor de R$ ${p.amount.toLocaleString("pt-BR")}.`,"IMPORTANTE",p.id);}
    }
    c.interests=c.interests.slice(-brands.length);updateValue(s,api);
  }
  function active(s){return init(s).contracts.filter(x=>x.status==="ATIVO"&&x.endDay>=s.day);}
  function accept(s,id,helpers,api){
    const c=init(s,api),p=c.proposals.find(x=>x.id===id&&x.status==="PROPOSTA"&&x.expires>=s.day);if(!p)throw Error("Proposta comercial indisponível.");
    const conflict=active(s).find(x=>x.category===p.category&&(x.exclusive||p.exclusive));if(conflict)throw Error(`Exclusividade incompatível com ${conflict.brand}.`);
    p.status="ACEITA";const contract={...p,id:`contract:${p.brandId}:${s.day}`,proposalId:p.id,status:"ATIVO",signedDay:s.day,startDay:Math.max(s.day,p.startDay),endDay:s.day+p.durationDays,nextPaymentDay:Math.max(s.day,p.startDay),relationship:70,warnings:0,paidBonuses:[]};c.contracts.unshift(contract);c.relations[p.brandId]=70;
    const interest=c.interests.find(x=>x.brandId===p.brandId);if(interest)interest.stage="CONTRATO ATIVO";
    c.history.unshift({brandId:p.brandId,brand:p.brand,category:p.category,startDay:contract.startDay,endDay:contract.endDay,value:p.amount,status:"ATIVO"});
    message(s,helpers,"Patrocínio assinado",`${p.brand} agora é patrocinadora. O contrato começa no dia ${contract.startDay}.`,"IMPORTANTE",contract.id);article(s,helpers,`${s.person.name} fecha acordo com ${p.brand}`,`O contrato comercial foi confirmado após a evolução esportiva e pública do atleta.`,contract.id);
    c.popularity=clamp(c.popularity+2,0,100);c.followers+=Math.round(500+p.amount/20);scheduleEvent(s,contract,api);updateValue(s,api);return contract;
  }
  function reject(s,id,helpers,api){const c=init(s,api),p=c.proposals.find(x=>x.id===id&&x.status==="PROPOSTA");if(!p)throw Error("Proposta indisponível.");p.status="RECUSADA";const i=c.interests.find(x=>x.brandId===p.brandId);if(i)i.stage="ENCERRADO";message(s,helpers,"Proposta recusada",`Seu agente comunicou a recusa à ${p.brand}.`,"NORMAL",`commercial:reject:${p.id}`);}
  function hold(s,id,helpers,api){const p=init(s,api).proposals.find(x=>x.id===id&&x.status==="PROPOSTA");if(!p)throw Error("Proposta indisponível.");if(p.expires-s.day>=14)throw Error("A marca já aguarda sua resposta.");p.expires+=7;message(s,helpers,"Prazo comercial ampliado",`${p.brand} concedeu mais 7 dias para resposta.`,"NORMAL",`commercial:hold:${p.id}:${p.expires}`);return p;}
  function negotiate(s,id,terms,helpers,api){
    const c=init(s,api),p=c.proposals.find(x=>x.id===id&&x.status==="PROPOSTA");if(!p)throw Error("Proposta indisponível.");if(p.round>=2)throw Error("Limite de negociação atingido.");
    const wanted=Math.max(p.amount,Math.round(Number(terms.amount||p.amount))),duration=clamp(Math.round(Number(terms.durationDays||p.durationDays)),90,1095),bonus=Math.max(0,Math.round(Number(terms.bonus||p.bonus.amount)));
    p.round++;const b=brands.find(x=>x.id===p.brandId),agent=Number(s.extras?.playerCareer?.agent?.negotiation||50),ratio=wanted/Math.max(1,p.amount),power=scoreBrand(s,b,api)+agent*.16-p.round*4;
    if(ratio<=1.18&&power>=b.prestige*.72){p.amount=wanted;p.durationDays=duration;p.bonus.amount=bonus;p.startDay=s.day+1;p.endDay=p.startDay+duration;message(s,helpers,"Contraproposta aceita",`${p.brand} aceitou os novos termos.`,"IMPORTANTE",`commercial:negotiation:${p.id}:${p.round}`);return "ACEITA";}
    if(ratio<=1.45&&power>=45){p.amount=Math.round((p.amount+wanted*.45)/1000)*1000;p.durationDays=Math.round((p.durationDays+duration)/2);p.bonus.amount=Math.round((p.bonus.amount+bonus*.5)/1000)*1000;message(s,helpers,"Marca fez contraproposta",`${p.brand} ajustou valor, duração e bônus.`,"IMPORTANTE",`commercial:negotiation:${p.id}:${p.round}`);return "CONTRAPROPOSTA";}
    p.status="RETIRADA";const i=c.interests.find(x=>x.brandId===p.brandId);if(i)i.stage="ENCERRADO";message(s,helpers,"Oferta retirada",`${p.brand} encerrou as conversas após a contraproposta.`,"NORMAL",`commercial:withdraw:${p.id}`);return "RETIRADA";
  }
  function officialOnDay(s,day){
    const yearStart=(s.season-2026)*365;
    if((s.calendarDays||[]).some((d,i)=>yearStart+d===day&&i>=s.round))return true;
    const sch=s.competitionSchedule||{};if((sch.state?.fixtures||[]).some(x=>!x.played&&x.date===day))return true;
    if((sch.cup?.rounds||[]).some(r=>r.date===day&&(r.pairs||[]).some(x=>!x.played&&[x.home,x.away].includes(s.clubId))))return true;
    if((s.nationalTeam?.schedule||[]).some(x=>!x.played&&x.day===day&&(x.calledUp||s.nationalTeam?.calledUp)))return true;return false;
  }
  function scheduleEvent(s,contract,api,baseDay){const c=init(s,api),types=["SESSÃO DE FOTOS","EVENTO DA MARCA","CAMPANHA","ENTREVISTA PROMOCIONAL"],count=c.events.filter(x=>x.contractId===contract.id).length;let day=Math.max(Number(baseDay||s.day+5),contract.startDay+4);while(officialOnDay(s,day))day++;const id=`commercial-event:${contract.id}:${day}`;if(!c.events.some(x=>x.id===id))c.events.push({id,contractId:contract.id,brandId:contract.brandId,brand:contract.brand,day,type:types[count%types.length],status:"AGENDADO",mandatory:count%3===2,reschedules:0});}
  function endForWarnings(s,contract,c,helpers){if(contract.warnings<3||contract.relationship>=40)return false;contract.status="ENCERRADO";contract.endDay=s.day;const h=c.history.find(h=>h.brandId===contract.brandId&&h.startDay===contract.startDay);if(h){h.status="ENCERRADO";h.endDay=s.day;}message(s,helpers,"Contrato comercial encerrado",`${contract.brand} encerrou o acordo após obrigações comerciais ignoradas.`,"IMPORTANTE",`commercial:breach:${contract.id}`);return true;}
  function eventAction(s,id,choice,helpers,api){const c=init(s,api),e=c.events.find(x=>x.id===id&&["AGENDADO","REAGENDADO","CONFIRMADO"].includes(x.status));if(!e)throw Error("Evento comercial indisponível.");const x=c.contracts.find(x=>x.id===e.contractId&&x.status==="ATIVO");if(!x)throw Error("Contrato comercial não está ativo.");if(choice==="participate"){e.status="CONFIRMADO";message(s,helpers,"Presença confirmada",`Você confirmou participação em ${e.type.toLowerCase()} da ${e.brand}.`,"NORMAL",`commercial:event:confirm:${e.id}`);return e;}if(choice==="reschedule"){if((e.reschedules||0)>=2)throw Error("Limite de reagendamentos atingido.");let day=Math.max(s.day+1,e.day+1);while(officialOnDay(s,day))day++;e.day=day;e.status="REAGENDADO";e.reschedules=(e.reschedules||0)+1;x.relationship=clamp(x.relationship-1,0,100);c.relations[x.brandId]=x.relationship;message(s,helpers,"Evento reagendado",`${e.brand} aceitou uma nova data para ${e.type.toLowerCase()}.`,"NORMAL",`commercial:event:reschedule:${e.id}:${e.reschedules}`);return e;}if(choice==="decline"){e.status="RECUSADO";e.completedDay=s.day;x.warnings=(x.warnings||0)+1;x.relationship=clamp(x.relationship-(e.mandatory?12:5),0,100);c.relations[x.brandId]=x.relationship;message(s,helpers,"Evento recusado",`${e.brand} registrou sua ausência${e.mandatory?" em uma obrigação importante":""}.`,e.mandatory?"IMPORTANTE":"NORMAL",`commercial:event:decline:${e.id}`);if(!endForWarnings(s,x,c,helpers)&&x.endDay>s.day+60)scheduleEvent(s,x,api,s.day+90);return e;}throw Error("Decisão comercial inválida.");}
  function pay(s,contract,amount,label,key,helpers){const c=init(s);if(c.payments[key])return false;c.payments[key]=s.day;helpers.transaction(s,amount,label);c.revenue+=amount;if(label.includes("Bônus"))c.bonusRevenue+=amount;return true;}
  function processContracts(s,helpers,api){
    const c=init(s,api);
    for(const x of c.contracts){
      if(x.status!=="ATIVO")continue;
      if(s.day>x.endDay){x.status="ENCERRADO";const h=c.history.find(h=>h.brandId===x.brandId&&h.startDay===x.startDay);if(h)h.status="ENCERRADO";const i=c.interests.find(i=>i.brandId===x.brandId);if(i)i.stage="ENCERRADO";message(s,helpers,"Contrato comercial encerrado",`O acordo com ${x.brand} chegou ao fim.`,"NORMAL",`commercial:end:${x.id}`);continue;}
      if(s.day>=x.nextPaymentDay){const key=`commercial:payment:${x.id}:${x.nextPaymentDay}`;pay(s,x,x.amount,`Patrocínio — ${x.brand}`,key,helpers);x.nextPaymentDay+=30;}
      const awards=(s.statistics?.awards||[]).filter(a=>(a.winnerId==="hero"||a.winner===s.person?.name)&&Number(a.season)===Number(s.season));
      const bonusReady=x.bonus.kind==="callup"?hasNational(s):awards.length>0;
      if(bonusReady){const marker=x.bonus.kind==="callup"?`callup:${s.nationalTeam?.firstCallupDay||s.day}`:`award:${awards[0]?.name||s.season}`;pay(s,x,x.bonus.amount,`Bônus de patrocínio — ${x.brand}`,`commercial:bonus:${x.id}:${marker}`,helpers);}
      if(x.endDay-s.day===30&&!c.proposals.some(p=>p.renewalOf===x.id&&p.status==="PROPOSTA")&&x.relationship>=55){const b=brands.find(b=>b.id===x.brandId),p=offerFor(s,b,api);p.id=`renewal:${x.id}:${s.day}`;p.renewalOf=x.id;p.amount=Math.round(p.amount*(1+c.popularity/300)/1000)*1000;c.proposals.unshift(p);message(s,helpers,"Renovação de patrocínio",`${x.brand} ofereceu renovar o acordo.`,"IMPORTANTE",p.id);}
    }
    for(const e of c.events.filter(e=>["AGENDADO","REAGENDADO","CONFIRMADO"].includes(e.status)&&e.day<=s.day)){if(officialOnDay(s,e.day)){e.day++;e.status="REAGENDADO";continue;}e.status="CONCLUÍDO";e.completedDay=s.day;const x=c.contracts.find(x=>x.id===e.contractId);if(x){x.relationship=clamp(x.relationship+3,0,100);c.relations[x.brandId]=x.relationship;if(x.status==="ATIVO"&&x.endDay>s.day+60)scheduleEvent(s,x,api,s.day+90);}c.popularity=clamp(c.popularity+1,0,100);c.followers+=Math.round(250+c.popularity*12);s.person.condition=clamp(Number(s.person.condition||0)-2,0,100);if(s.life?.finance)s.life.finance.wellbeing=clamp(Number(s.life.finance.wellbeing||65)-1,0,100);message(s,helpers,"Evento comercial concluído",`${e.type} da ${e.brand} foi realizada sem conflito esportivo.`,"NORMAL",`commercial:event:done:${e.id}`);}
  }
  function syncAudience(s,api){const c=init(s,api),raw=Number(s.fans||0),delta=raw-c.lastFansSnapshot;if(delta){c.followers=Math.max(0,c.followers+delta);c.popularity=clamp(c.popularity+clamp(delta/1000,-.5,1.2),0,100);c.exposure=clamp(c.exposure+clamp(delta/800,-1,2),0,100);}c.lastFansSnapshot=raw;if(s.day%30===0&&performance(s)<25){c.popularity=clamp(c.popularity-.35,0,100);c.exposure=clamp(c.exposure-.5,0,100);}for(const mark of [100000,1000000,5000000,10000000])if(c.followers>=mark&&!c.milestones.some(x=>x.value===mark))c.milestones.push({day:s.day,season:s.season,value:mark,label:`${mark.toLocaleString("pt-BR")} seguidores`});updateValue(s,api);}
  function onMatch(s,m,helpers,api){if(s.mode!=="player"||!m.ratings?.hero)return;const c=init(s,api),rating=Number(m.ratings.hero||0),goals=(m.events||[]).filter(e=>e.type==="goal"&&e.playerId==="hero").length,boost=rating>=8?2:rating>=7?.7:rating<6?-.4:0;c.popularity=clamp(c.popularity+boost+goals*.8,0,100);c.exposure=clamp(c.exposure+Math.max(0,boost)+goals,0,100);c.followers=Math.max(0,c.followers+Math.round(Math.max(-80,boost*350+goals*700)));updateValue(s,api);}
  function daily(s,rng,helpers,api){if(s.mode!=="player")return;init(s,api);syncAudience(s,api);processContracts(s,helpers,api);if(s.day%14===0)progressInterests(s,rng,helpers,api);const c=s.commercial;for(const p of c.proposals)if(p.status==="PROPOSTA"&&p.expires<s.day)p.status="EXPIRADA";}
  function summary(s,api){const c=init(s,api);return {popularity:c.popularity,followers:c.followers,commercialValue:updateValue(s,api),active:active(s),revenue:c.revenue,bonusRevenue:c.bonusRevenue,nextEvent:c.events.filter(e=>["AGENDADO","REAGENDADO","CONFIRMADO"].includes(e.status)&&e.day>=s.day).sort((a,b)=>a.day-b.day)[0]||null};}
  const api={brands,stages,init,summary,quality,updateValue,scoreBrand,eligible,progressInterests,active,accept,reject,hold,negotiate,eventAction,daily,onMatch,officialOnDay,scheduleEvent,processContracts};
  root.ProLifeCommercial=api;if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
