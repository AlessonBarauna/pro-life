(function(root){
  "use strict";
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const slots={"4-3-3":{GOL:1,DEF:4,MEI:3,ATA:3},"4-4-2":{GOL:1,DEF:4,MEI:4,ATA:2},"4-2-3-1":{GOL:1,DEF:4,MEI:5,ATA:1}};
  function init(s){
    const pc=root.ProLifeCareer?.init(s)?.playerCareer;
    if(!pc) return null;
    if(!pc.squadCompetition) pc.squadCompetition={formation:"4-3-3",history:[],lastDecision:null,formRatings:[],trainingTrend:0,version:1};
    const q=pc.squadCompetition;
    if(!slots[q.formation]) q.formation="4-3-3";
    if(!Array.isArray(q.history)) q.history=[];
    if(!Array.isArray(q.formRatings)) q.formRatings=[];
    if(!Number.isFinite(q.trainingTrend)) q.trainingTrend=0;
    if(!Array.isArray(q.trustHistory)) q.trustHistory=[];
    if(q.lastTrustEvent===undefined) q.lastTrustEvent=null;
    if(!Number.isFinite(q.version)||q.version<2) q.version=2;
    if(!Array.isArray(q.coachConversations)) q.coachConversations=[];
    if(!Number.isFinite(q.lastCoachConversationDay)) q.lastCoachConversationDay=-9999;
    if(q.activeCoachConversation===undefined) q.activeCoachConversation=null;
    if(q.version<3) q.version=3;
    if(!Array.isArray(q.coachPromiseHistory)) q.coachPromiseHistory=[];
    if(q.activeCoachPromise===undefined) q.activeCoachPromise=null;
    if(!Number.isFinite(q.promiseVersion)) q.promiseVersion=1;
    if(!Number.isFinite(q.managerGeneration)) q.managerGeneration=0;
    if(q.lastManagerChangeKey===undefined) q.lastManagerChangeKey=null;
    return q;
  }
  function recentRatings(s,id="hero",limit=5){return (s.matches||[]).filter(m=>Number.isFinite(Number(m.ratings?.[id]))).slice(0,limit).map(m=>Number(m.ratings[id]));}
  function formValue(s,p){const rs=recentRatings(s,p.id);return rs.length?rs.reduce((a,b)=>a+b,0)/rs.length:6.5;}
  const Physical=root.ProLifePhysical||(typeof require==="function"?require("./physical.js"):null);
  function score(s,p){
    const ov=root.ProLife?.overall?root.ProLife.overall(p):50, form=formValue(s,p), cond=Number(p.condition??100), morale=Number(p.morale??50);
    let v=ov*.64+form*2.6+cond*.075+morale*.045;
    if(p.id==="hero"){const pc=root.ProLifeCareer.init(s).playerCareer,q=init(s);v+=(pc.coachTrust-50)*.105+clamp(q.trainingTrend,-5,5)*.35;}
    if(!(Physical?.canPlay?.(p) ?? (!p.injury&&cond>=25))||p.suspension>0) v=-999;
    return v;
  }
  function formationFor(c){return c?.formation&&slots[c.formation]?c.formation:"4-3-3";}
  function choose(s,c){
    const formation=formationFor(c), need=slots[formation], active=c.roster.filter(p=>(Physical?.canPlay?.(p) ?? (!p.injury&&Number(p.condition??100)>=25))&&!(p.suspension>0));
    const starters=[];
    for(const [pos,count] of Object.entries(need)){
      const pool=active.filter(p=>p.pos===pos&&!starters.includes(p)).sort((a,b)=>score(s,b)-score(s,a));
      starters.push(...pool.slice(0,count));
    }
    for(const p of active.slice().sort((a,b)=>score(s,b)-score(s,a))) if(starters.length<11&&!starters.includes(p)) starters.push(p);
    const bench=active.filter(p=>!starters.includes(p)).sort((a,b)=>score(s,b)-score(s,a)).slice(0,7);
    const out=c.roster.filter(p=>!starters.includes(p)&&!bench.includes(p));
    return {formation,starters,bench,out};
  }
  function roleForHero(s,selection){const pc=root.ProLifeCareer.init(s).playerCareer;if(selection.starters.some(p=>p.id==="hero"))return "Titular";if(selection.bench.some(p=>p.id==="hero"))return "Banco";return "Fora da relação";}
  function competition(s){
    const c=root.ProLife?.club(s);if(!c)return null;const selection=choose(s,c),hero=s.person,rivals=c.roster.filter(p=>p.pos===hero.pos&&!p.injury&&!(p.suspension>0)).slice().sort((a,b)=>score(s,b)-score(s,a));
    return {formation:selection.formation,selection,heroRole:roleForHero(s,selection),rivals:rivals.map((p,i)=>({id:p.id,name:p.name,pos:p.pos,age:p.age,overall:root.ProLife.overall(p),form:+formValue(s,p).toFixed(2),condition:Math.round(p.condition),score:+score(s,p).toFixed(2),rank:i+1,status:selection.starters.includes(p)?"Titular":selection.bench.includes(p)?"Banco":"Fora"})),heroRank:Math.max(1,rivals.findIndex(p=>p.id==="hero")+1)};
  }
  function recordDecision(s,role,reason){const q=init(s),pc=root.ProLifeCareer.init(s).playerCareer;const row={day:s.day,season:s.season,role,trust:Math.round(pc.coachTrust),reason};if(!q.lastDecision||q.lastDecision.day!==s.day||q.lastDecision.role!==role){q.history.unshift(row);q.history=q.history.slice(0,40);q.lastDecision=row;}return row;}
  function trustReason(source,delta,meta={}){
    const up=delta>0;
    if(source==="training_manual") return up ? "Bom treino aumentou a confian\u00e7a da comiss\u00e3o." : "O treino ficou abaixo do esperado pela comiss\u00e3o.";
    if(source==="training_auto") return up ? "A rotina de treino contribuiu para sua avalia\u00e7\u00e3o." : "A rotina de treino teve impacto negativo na avalia\u00e7\u00e3o.";
    if(source==="match"){
      if(meta.status==="NAO_UTILIZADO") return "Voc\u00ea ficou no banco e n\u00e3o entrou na partida.";
      if(meta.status==="NAO_RELACIONADO") return "Voc\u00ea ficou fora da rela\u00e7\u00e3o para a partida.";
      if(Number(meta.rating)>=7.5) return "Boa atua\u00e7\u00e3o fortaleceu sua posi\u00e7\u00e3o com o treinador.";
      if(Number(meta.rating)>0&&Number(meta.rating)<6) return "A atua\u00e7\u00e3o ficou abaixo do esperado pelo treinador.";
      if(Number(meta.objectivesMet)>0) return "Objetivos da partida contribu\u00edram para a confian\u00e7a do treinador.";
      return up ? "Seu desempenho na partida aumentou a confian\u00e7a do treinador." : "A partida reduziu sua avalia\u00e7\u00e3o com o treinador.";
    }
    if(source==="conversation") return meta.reason||"Uma conversa individual alterou sua rela\u00e7\u00e3o com o treinador.";
    if(source==="manager_change") return meta.reason||"A troca de treinador recalibrou sua posi\u00e7\u00e3o dentro do elenco.";
    if(source==="transfer") return "A chegada a um novo clube recalibrou sua rela\u00e7\u00e3o com a comiss\u00e3o t\u00e9cnica.";
    return up ? "Sua rela\u00e7\u00e3o com o treinador melhorou." : "Sua rela\u00e7\u00e3o com o treinador piorou.";
  }

  function recordTrustChange(s,source,before,after,meta={}){
    if(s?.mode!=="player") return null;
    const q=init(s);
    if(!q) return null;
    before=Number(before);
    after=Number(after);
    if(!Number.isFinite(before)||!Number.isFinite(after)) return null;
    before=clamp(before,0,100);
    after=clamp(after,0,100);
    const delta=+(after-before).toFixed(2);
    if(Math.abs(delta)<.001) return null;
    const eventId=meta.eventId||null;
    if(eventId){
      const existing=q.trustHistory.find(x=>x.eventId===eventId);
      if(existing) return existing;
    }
    const row={
      day:Number(s.day||0),
      season:Number(s.season||0),
      source:String(source||"other"),
      before:+before.toFixed(2),
      after:+after.toFixed(2),
      delta,
      reason:String(meta.reason||trustReason(source,delta,meta)),
      eventId,
      details:{
        grade:meta.grade||null,
        automatic:meta.automatic===true,
        status:meta.status||null,
        rating:Number.isFinite(Number(meta.rating))?Number(meta.rating):null,
        objectivesMet:Number.isFinite(Number(meta.objectivesMet))?Number(meta.objectivesMet):null,
        objectivesTotal:Number.isFinite(Number(meta.objectivesTotal))?Number(meta.objectivesTotal):null
      }
    };
    q.trustHistory.unshift(row);
    q.trustHistory=q.trustHistory.slice(0,80);
    q.lastTrustEvent=row;
    return row;
  }

  function trustSummary(s,limit=8){
    if(s?.mode!=="player") return null;
    const q=init(s);
    const pc=root.ProLifeCareer?.init(s)?.playerCareer;
    if(!q||!pc) return null;
    const history=q.trustHistory.slice(0,Math.max(1,Number(limit)||8));
    const recent=q.trustHistory.slice(0,5);
    const trend=+recent.reduce((n,x)=>n+Number(x.delta||0),0).toFixed(2);
    return {
      current:+Number(pc.coachTrust||0).toFixed(2),
      role:pc.squadRole,
      trend,
      direction:trend>.5?"SUBINDO":trend<-.5?"CAINDO":"ESTAVEL",
      last:q.lastTrustEvent||history[0]||null,
      history
    };
  }
  function trainingResult(s,result){
    if(!result?.available)return;
    const pc=root.ProLifeCareer.init(s).playerCareer,q=init(s);
    const before=Number(pc.coachTrust||0);
    const base={A:1.2,B:.7,C:.25,D:-.2}[result.grade]||0;
    // FC 26: treino alimenta a avaliacao do manager. Na rotina automatica o ganho e menor
    // para que minutos e objetivos de partida continuem decisivos na disputa por posicao.
    const d=result.automatic?base*.24:base;
    pc.coachTrust=clamp(pc.coachTrust+d,0,100);
    q.trainingTrend=clamp(q.trainingTrend*.72+d,-5,5);
    recordTrustChange(
      s,
      result.automatic?"training_auto":"training_manual",
      before,
      pc.coachTrust,
      {
        grade:result.grade,
        automatic:!!result.automatic
      }
    );
    root.ProLifeCareer.updatePlayerRole(s);
  }
  function coachConversationStatus(s){
    if(s?.mode!=="player") return null;
    const q=init(s),pc=root.ProLifeCareer?.init(s)?.playerCareer;
    if(!q||!pc) return null;
    const cooldown=14;
    const elapsed=Number(s.day??0)-Number(q.lastCoachConversationDay??-9999);
    return {
      available:!q.activeCoachConversation&&elapsed>=cooldown,
      cooldown,
      daysRemaining:q.activeCoachConversation?0:Math.max(0,cooldown-elapsed),
      active:q.activeCoachConversation||null,
      last:q.coachConversations[0]||null,
      trust:Number(pc.coachTrust||0),
      role:pc.squadRole
    };
  }

  function coachConversationChoices(s){
    if(s?.mode!=="player") return [];
    const pc=root.ProLifeCareer?.init(s)?.playerCareer;
    if(!pc) return [];
    const struggling=["Reserva","Fora dos planos"].includes(pc.squadRole);
    return struggling ? [
      {id:"work",label:"Vou trabalhar para conquistar meu espa\u00e7o.",trust:1.2,morale:1},
      {id:"patience",label:"Entendo a decis\u00e3o e vou esperar minha oportunidade.",trust:.6,morale:1},
      {id:"demand",label:"Acho que mere\u00e7o mais minutos.",trust:-1.4,morale:2}
    ] : [
      {id:"focus",label:"Quero manter o foco e ajudar a equipe.",trust:1,morale:1},
      {id:"ambition",label:"Quero assumir ainda mais responsabilidade.",trust:.4,morale:2},
      {id:"minutes",label:"Quero conversar sobre meu tempo de jogo.",trust:-.8,morale:1}
    ];
  }

  function startCoachConversation(s){
    if(s?.mode!=="player") throw Error("Dispon\u00edvel apenas para carreira de jogador.");
    const q=init(s),pc=root.ProLifeCareer?.init(s)?.playerCareer;
    const status=coachConversationStatus(s);
    if(!q||!pc||!status) throw Error("Rela\u00e7\u00e3o com treinador indispon\u00edvel.");
    if(q.activeCoachConversation) return q.activeCoachConversation;
    if(!status.available) throw Error(`Nova conversa dispon\u00edvel em ${status.daysRemaining} dia(s).`);
    const id=`coach-talk:${s.season}:${s.day}:${q.coachConversations.length+1}`;
    const struggling=["Reserva","Fora dos planos"].includes(pc.squadRole);
    const conversation={
      id,
      day:Number(s.day||0),
      season:Number(s.season||0),
      roleBefore:pc.squadRole,
      trustBefore:+Number(pc.coachTrust||0).toFixed(2),
      question:struggling
        ? "Quero entender como voc\u00ea est\u00e1 lidando com a disputa por espa\u00e7o."
        : "Como voc\u00ea avalia seu momento e sua fun\u00e7\u00e3o no elenco?",
      choices:coachConversationChoices(s),
      answered:false,
      response:null
    };
    q.activeCoachConversation=conversation;
    root.ProLifeCareer?.addMessage?.(s,{
      category:"TREINADOR",
      sender:"Treinador",
      subject:"Conversa individual",
      body:conversation.question,
      priority:"IMPORTANTE",
      eventId:id
    });
    return conversation;
  }

  function respondCoachConversation(s,choiceId){
    if(s?.mode!=="player") throw Error("Dispon\u00edvel apenas para carreira de jogador.");
    const q=init(s),pc=root.ProLifeCareer?.init(s)?.playerCareer;
    const conversation=q?.activeCoachConversation;
    if(!conversation||conversation.answered) throw Error("Conversa com treinador indispon\u00edvel.");
    const choice=conversation.choices.find(x=>x.id===choiceId);
    if(!choice) throw Error("Resposta inv\u00e1lida.");
    const before=Number(pc.coachTrust||0);
    pc.coachTrust=clamp(before+Number(choice.trust||0),0,100);
    s.person.morale=clamp(Number(s.person.morale||50)+Number(choice.morale||0),0,100);
    root.ProLifeCareer?.updatePlayerRole?.(s);
    const trustEvent=recordTrustChange(s,"conversation",before,pc.coachTrust,{
      eventId:conversation.id,
      reason:`Conversa com o treinador: ${choice.label}`
    });
    conversation.answered=true;
    conversation.response=choice.id;
    conversation.responseLabel=choice.label;
    conversation.answeredDay=Number(s.day||0);
    conversation.trustAfter=+Number(pc.coachTrust||0).toFixed(2);
    conversation.moraleAfter=+Number(s.person.morale||0).toFixed(2);
    conversation.trustDelta=trustEvent?.delta||0;
    const requestedPromise=["minutes","demand"].includes(choice.id)
      ? requestCoachPromise(s,choice.id)
      : null;
    conversation.promiseId=requestedPromise?.id||null;
    q.coachConversations.unshift(conversation);
    q.coachConversations=q.coachConversations.slice(0,40);
    q.lastCoachConversationDay=Number(s.day||0);
    q.activeCoachConversation=null;
    root.ProLifeCareer?.addMessage?.(s,{
      category:"TREINADOR",
      sender:"Treinador",
      subject:"Conversa conclu\u00edda",
      body:`Voc\u00ea respondeu: ${choice.label} Confian\u00e7a ${conversation.trustDelta>=0?"+":""}${conversation.trustDelta}.`,
      eventId:`${conversation.id}:response`
    });
    return conversation;
  }
  function coachPromisePlan(s){
    if(s?.mode!=="player"||!s.clubId) return null;
    const pc=root.ProLifeCareer?.init(s)?.playerCareer;
    if(!pc) return null;
    const role=pc.squadRole||"Fora dos planos";
    if(["Fora dos planos","Reserva"].includes(role)){
      return {
        type:"opportunity",
        metric:"appearances",
        target:1,
        maxGames:3,
        minTrust:28,
        label:"Receber uma oportunidade em at\u00e9 3 jogos eleg\u00edveis"
      };
    }
    if(role==="Rota\u00e7\u00e3o"){
      return {
        type:"minutes",
        metric:"minutes",
        target:30,
        maxGames:3,
        minTrust:40,
        label:"Somar pelo menos 30 minutos em at\u00e9 3 jogos eleg\u00edveis"
      };
    }
    return {
      type:"starter",
      metric:"starts",
      target:2,
      maxGames:3,
      minTrust:55,
      label:"Come\u00e7ar como titular em pelo menos 2 dos pr\u00f3ximos 3 jogos eleg\u00edveis"
    };
  }

  function coachPromiseStatus(s){
    if(s?.mode!=="player") return null;
    const q=init(s);
    if(!q) return null;
    return {
      active:q.activeCoachPromise||null,
      last:q.coachPromiseHistory[0]||null,
      history:q.coachPromiseHistory.slice(0,10)
    };
  }

  function requestCoachPromise(s,requestSource="conversation"){
    if(s?.mode!=="player") return null;
    const q=init(s),pc=root.ProLifeCareer?.init(s)?.playerCareer;
    if(!q||!pc||!s.clubId) return null;
    if(q.activeCoachPromise) return q.activeCoachPromise;

    const plan=coachPromisePlan(s);
    if(!plan) return null;

    if(Number(pc.coachTrust||0)<plan.minTrust){
      root.ProLifeCareer?.addMessage?.(s,{
        category:"TREINADOR",
        sender:"Treinador",
        subject:"Sem promessa de minutos",
        body:"Neste momento n\u00e3o vou prometer minutos. Continue mostrando evolu\u00e7\u00e3o nos treinos e aproveitando as oportunidades.",
        eventId:`coach-promise-denied:${s.season}:${s.day}:${requestSource}`
      });
      return null;
    }

    const promise={
      id:`coach-promise:${s.season}:${s.day}:${q.coachPromiseHistory.length+1}`,
      clubId:s.clubId,
      createdDay:Number(s.day||0),
      season:Number(s.season||0),
      requestSource:String(requestSource||"conversation"),
      roleAtStart:pc.squadRole,
      trustAtStart:+Number(pc.coachTrust||0).toFixed(2),
      type:plan.type,
      metric:plan.metric,
      target:plan.target,
      maxGames:plan.maxGames,
      label:plan.label,
      eligibleGames:0,
      appearances:0,
      starts:0,
      minutes:0,
      processedGames:[],
      status:"ATIVA",
      resolvedDay:null,
      resolution:null
    };

    q.activeCoachPromise=promise;

    root.ProLifeCareer?.addMessage?.(s,{
      category:"TREINADOR",
      sender:"Treinador",
      subject:"Compromisso de minutos",
      body:`Meu compromisso: ${plan.label}. A promessa depende de voc\u00ea estar dispon\u00edvel para os jogos.`,
      priority:"IMPORTANTE",
      eventId:promise.id
    });

    return promise;
  }

  function resolveCoachPromise(s,promise,status,resolution){
    const q=init(s);
    if(!q||!promise||promise.status!=="ATIVA") return promise||null;

    promise.status=status;
    promise.resolvedDay=Number(s.day||0);
    promise.resolution=resolution;

    if(status==="CUMPRIDA"){
      s.person.morale=clamp(Number(s.person.morale||50)+2,0,100);
    }else if(status==="QUEBRADA"){
      s.person.morale=clamp(Number(s.person.morale||50)-4,0,100);
    }

    q.coachPromiseHistory.unshift({...promise});
    q.coachPromiseHistory=q.coachPromiseHistory.slice(0,30);
    q.activeCoachPromise=null;

    root.ProLifeCareer?.addMessage?.(s,{
      category:"TREINADOR",
      sender:"Treinador",
      subject:status==="CUMPRIDA" ? "Promessa cumprida" : status==="QUEBRADA" ? "Promessa n\u00e3o cumprida" : "Promessa encerrada",
      body:resolution,
      priority:status==="QUEBRADA" ? "IMPORTANTE" : "NORMAL",
      eventId:`${promise.id}:resolution`
    });

    return promise;
  }

  function evaluateCoachPromise(s,report){
    if(s?.mode!=="player"||!report) return null;
    const q=init(s),promise=q?.activeCoachPromise;
    if(!promise) return null;

    if(promise.clubId!==s.clubId){
      return resolveCoachPromise(
        s,
        promise,
        "CANCELADA",
        "A promessa foi encerrada porque o jogador mudou de clube."
      );
    }

    const gameKey=[
      report.season,
      report.day,
      report.competition,
      report.opponent
    ].join(":");

    if(promise.processedGames.includes(gameKey)) return promise;

    promise.processedGames.push(gameKey);
    promise.processedGames=promise.processedGames.slice(-6);

    if(report.status==="INDISPONIVEL"){
      return promise;
    }

    promise.eligibleGames++;

    if(report.status==="TITULAR"){
      promise.starts++;
      promise.appearances++;
    }else if(report.status==="ENTROU_DO_BANCO"){
      promise.appearances++;
    }

    promise.minutes+=Math.max(0,Number(report.minutes||0));

    const value=Number(promise[promise.metric]||0);

    if(value>=promise.target){
      return resolveCoachPromise(
        s,
        promise,
        "CUMPRIDA",
        `O treinador cumpriu o compromisso: ${promise.label}.`
      );
    }

    if(promise.eligibleGames>=promise.maxGames){
      return resolveCoachPromise(
        s,
        promise,
        "QUEBRADA",
        `O prazo terminou sem que o compromisso fosse cumprido: ${promise.label}.`
      );
    }

    return promise;
  }
  function handleManagerChange(s,change){
    if(s?.mode!=="player"||!s.clubId||!change) return null;
    if(String(change.clubId)!==String(s.clubId)) return null;

    const q=init(s),pc=root.ProLifeCareer?.init(s)?.playerCareer;
    if(!q||!pc) return null;

    const key=`manager-change:${change.season??s.season}:${change.day??s.day}:${change.clubId}`;
    if(q.lastManagerChangeKey===key) return null;

    const before=Number(pc.coachTrust||50);

    if(q.activeCoachPromise){
      resolveCoachPromise(
        s,
        q.activeCoachPromise,
        "CANCELADA",
        "A promessa foi encerrada porque houve uma mudan\u00e7a no comando t\u00e9cnico."
      );
    }

    if(q.activeCoachConversation){
      q.activeCoachConversation.cancelled=true;
      q.activeCoachConversation.cancelledDay=Number(s.day||0);
      q.activeCoachConversation.cancelReason="Mudanca de treinador";
      q.coachConversations.unshift(q.activeCoachConversation);
      q.coachConversations=q.coachConversations.slice(0,40);
      q.activeCoachConversation=null;
    }

    const neutralized=50+(before-50)*0.35;
    pc.coachTrust=clamp(neutralized,42,62);
    root.ProLifeCareer?.updatePlayerRole?.(s);

    q.managerGeneration=Number(q.managerGeneration||0)+1;
    q.lastManagerChangeKey=key;

    recordTrustChange(
      s,
      "manager_change",
      before,
      pc.coachTrust,
      {
        eventId:key,
        reason:"Novo treinador: a hierarquia e a rela\u00e7\u00e3o com a comiss\u00e3o foram recalibradas."
      }
    );

    root.ProLifeCareer?.addMessage?.(s,{
      category:"TREINADOR",
      sender:"Diretoria",
      subject:"Mudan\u00e7a no comando t\u00e9cnico",
      body:"O clube mudou a comiss\u00e3o t\u00e9cnica. A nova equipe vai reavaliar a hierarquia, a disputa por posi\u00e7\u00e3o e sua utiliza\u00e7\u00e3o.",
      priority:"IMPORTANTE",
      eventId:key
    });

    return {
      key,
      before,
      after:Number(pc.coachTrust),
      role:pc.squadRole,
      generation:q.managerGeneration
    };
  }
  function substitutePlan(s,p){
    const pc=root.ProLifeCareer.init(s).playerCareer,q=init(s),physical=Physical?.init?.(p,s.day);
    const trust=clamp(Number(pc.coachTrust??50),0,100), morale=clamp(Number(p.morale??50),0,100);
    const fitness=clamp(Number(physical?.fitness??p.condition??100),0,100), fatigue=clamp(Number(physical?.fatigue??0),0,100);
    const form=clamp((formValue(s,p)-6)*18,0,40), training=clamp(q.trainingTrend,-5,5);
    const readiness=trust*.52+morale*.12+fitness*.12+form+training*1.6-fatigue*.08;
    const minute=readiness>=78?58:readiness>=66?64:readiness>=54?70:readiness>=42?76:82;
    const chance=clamp(.18+(trust/100)*.46+(morale/100)*.10+(fitness/100)*.10+Math.max(0,training)*.025-fatigue*.0025,.12,.92);
    return {minute,chance:+chance.toFixed(3),readiness:+readiness.toFixed(2)};
  }
  const api={init,slots,recentRatings,formValue,score,formationFor,choose,competition,roleForHero,recordDecision,recordTrustChange,trustSummary,coachConversationStatus,coachConversationChoices,startCoachConversation,respondCoachConversation,coachPromisePlan,coachPromiseStatus,requestCoachPromise,resolveCoachPromise,evaluateCoachPromise,handleManagerChange,trainingResult,substitutePlan};
  root.ProLifeSquad=api;if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
