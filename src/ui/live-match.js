(function(root){
  "use strict";
  let session=null,timer=null;
  const esc=(v)=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function scoreAt(m,min){let h=0,a=0;(m.events||[]).forEach(e=>{if(e.type==="goal"&&e.minute<=min)e.side===0?h++:a++;});return [h,a];}
  function dot(i,side,min){const row=Math.floor(i/3),col=i%3;const baseX=side?58:12;const x=baseX+col*8+Math.sin((min+i*7)*.17)*3;const y=10+row*21+Math.cos((min+i*5)*.13)*5;return `<i class="lm-player lm-${side?'away':'home'}" style="left:${x}%;top:${y}%">${i+1}</i>`;}
  function coachPitch(min,home,away){
    const frame=root.ProLifeMatchPitchV2?.frame?.(min,home,away,session?.officialControl?.actions||[]);
    if(!frame)return null;
    const dots=(list,side)=>list.map(p=>{
      const id=root.ProLifeMatchIdentityV2?.identify?.(p.player?.id,home,away);
      const display=id?.name&&id.player?id.name:(p.player?.name||"");
      const short=display?root.ProLifeMatchIdentityV2?.short?.(display)||display:"";
      const number=p.player?.number??p.player?.shirtNumber??p.number;
      return '<span class="lm-player-wrap lm-'+(side===0?'home':'away')+'" style="left:'+p.x.toFixed(2)+'%;top:'+p.y.toFixed(2)+'%" title="'+esc(display||"Jogador")+'"><i class="lm-player">'+esc(number)+'</i>'+(short?'<small class="lm-player-name">'+esc(short)+'</small>':"")+'</span>';
    }).join("");
    return dots(frame.home,0)+dots(frame.away,1)+'<span class="lm-ball" style="left:'+frame.ball.x.toFixed(2)+'%;top:'+frame.ball.y.toFixed(2)+'%"></span>';
  }
  function labPlayerSelectors(preview){
    const roster=(session.labSide===0?session.home:session.away)?.roster||[];
    const line=preview?.lineups?.[session.labSide];
    if(!line||!line.starters.length||!line.bench.length)return '<p class="lm-mc-note">Elenco com reservas indisponivel para troca nominal.</p>';
    const option=id=>{const p=roster.find(x=>String(x.id)===id);return '<option value="'+esc(id)+'">'+esc(p?.name||id)+' · GER '+esc(p?.ovr??p?.overall??"—")+'</option>';};
    return '<div class="lm-mc-swap"><h4>SUBSTITUIÇÕES · PRÉVIA TÁTICA</h4><label>Jogador que sai <select data-live-lab-out>'+line.starters.map(option).join("")+'</select></label>'+
      '<label>Reserva que entra <select data-live-lab-in>'+line.bench.map(option).join("")+'</select></label>'+
      '<button type="button" data-live-lab-swap>Confirmar substituição na prévia</button></div>';
  }
  function laboratory(){
    if(!session?.coach||!root.ProLifeCoachMatchLabV2)return "";
    const lab=root.ProLifeCoachMatchLabV2,preview=session.lab;
    const status=preview?lab.summary(preview):null;
    return '<section class="lm-mc-lab"><h3>LABORATORIO TATICO - EXPERIMENTAL</h3>'+
      '<p class="lm-mc-note">Substituições e instruções são testadas numa prévia independente: não alteram o placar oficial nem o save.</p>'+
      (!preview?'<button type="button" data-live-lab-start>Iniciar simulacao paralela</button>':
      '<p class="lm-mc-note">Minuto '+esc(status.minute)+' · Placar hipotetico '+esc(status.score.join(" - "))+' · Chutes '+esc(status.shots.join(" - "))+' · Substituicoes '+esc(status.substitutions[session.labSide])+'/5 · Janelas '+esc(lab.substitutionsStatus(preview,session.labSide).windowsUsed)+'/3</p>'+
      '<label>Equipe <select data-live-lab-side><option value="0"'+(session.labSide===0?' selected':'')+'>'+esc(session.home?.name||"Mandante")+'</option><option value="1"'+(session.labSide===1?' selected':'')+'>'+esc(session.away?.name||"Visitante")+'</option></select></label>'+
      '<div class="lm-mc-lab-actions">'+["equilibrado","ofensivo","defensivo","pressao_alta"].map(t=>'<button type="button" data-live-lab-tactic="'+t+'">'+esc(t.replace("_"," "))+'</button>').join("")+
      '<button type="button" data-live-lab-next '+(status.minute>=90?'disabled':'')+'>Avancar 10 min</button></div>'+labPlayerSelectors(preview))+'<div class="lm-mc-note"><b>Histórico da prévia:</b> '+(lab.substitutionsStatus(preview,session.labSide).history.map(h=>h.minute+"\u0027 "+(session.labSide===0?session.home:session.away)?.roster?.find(p=>String(p.id)===h.outId)?.name+" → "+(session.labSide===0?session.home:session.away)?.roster?.find(p=>String(p.id)===h.inId)?.name).join(" · ")||"Nenhuma troca")+'</div>'+
      '<div class="lm-mc-note"><b>Sugestões:</b> '+(lab.suggestedSubstitutions(preview,session.labSide,(session.labSide===0?session.home:session.away)?.roster||[]).map(x=>esc(x.reason)).join(" · ")||"Nenhuma no momento")+'</div></section>';
  }
  // Manager-only live decision session. Does not write a match or save on its own.
  function interactiveControls(){
    const live=session?.officialControl;
    if(!live)return "";
    const side=session.officialSide,snap=live.snapshot(side);
    if(!snap)return "";
    const status=snap.substitutions+"/5 mudanças · "+snap.windows+"/3 janelas";
    const canChange=snap.minute>0&&snap.minute<90&&snap.substitutions<5&&snap.bench.length>0;
    const entry=(p,kind)=>{
      const selectable=canChange&&(kind==="bench"||snap.bench.some(x=>(x.pos==="GOL")===(p.pos==="GOL")));
      return '<button type="button" class="lm-squad-chip '+kind+'" data-coach-squad="'+kind+'" data-coach-player="'+esc(p.id)+'" draggable="'+selectable+'" '+(!selectable?'disabled':'')+'><b>'+esc(p.name)+'</b><small>'+esc(p.pos)+' · Condição '+esc(p.condition)+'%'+(p.rating?' · Nota '+esc(p.rating):'')+'</small></button>';
    };
    return '<section class="lm-mc-lab lm-coach-squad" aria-label="Substituições da partida"><h3>ESCALAÇÃO AO VIVO · '+esc(status)+'</h3>'+
      '<p class="lm-mc-note">Pause e arraste um reserva sobre o titular que deseja retirar. No celular, toque primeiro no reserva e depois no titular.</p>'+
      '<p class="lm-mc-note" data-coach-swap-status>'+(session.selectedBench?'Reserva selecionado: '+esc(snap.bench.find(p=>p.id===session.selectedBench)?.name||session.selectedBench):'Nenhum reserva selecionado')+'</p>'+
      (session.swapMessage?'<p class="lm-mc-note">'+esc(session.swapMessage)+'</p>':'')+'<h4>EM CAMPO</h4><div class="lm-squad-list">'+snap.players.map(p=>entry(p,"field")).join("")+'</div>'+
      '<h4>RESERVAS</h4><div class="lm-squad-list">'+snap.bench.map(p=>entry(p,"bench")).join("")+'</div>'+
      (!canChange?'<p class="lm-mc-note">Trocas indisponíveis neste minuto ou limite de janelas atingido.</p>':'')+
      '<p class="lm-mc-note">'+(snap.history.map(a=>esc(a.minute)+"\u0027 "+esc(a.outId)+" → "+esc(a.inId)).join(" · ")||"Nenhuma troca registrada")+'</p></section>';
  }
  function officialSwap(outId,inId){
    if(!session?.officialControl||!outId||!inId)return;
    const ok=session.officialControl.substitute(session.officialSide,outId,inId);
    session.paused=true;
    session.selectedBench=null;
    session.swapMessage=ok?"Troca confirmada para o próximo minuto.":"Troca recusada: confira posição, condição, banco e janelas disponíveis.";
    paint();
  }
  function tacticalControls(){
    if(!session?.officialControl)return "";
    const live=session.officialControl,snap=live.snapshot(session.officialSide);
    if(!snap)return "";
    return '<section class="lm-mc-lab"><h3>POSTURA EM CAMPO</h3>'+
      '<p class="lm-mc-note">Postura atual: '+esc(snap.tactic)+'. Alterações passam a valer no próximo minuto oficial.</p>'+
      '<div class="lm-mc-lab-actions">'+["equilibrado","ofensivo","defensivo"].map(t=>
        '<button type="button" data-official-tactic="'+t+'" '+(snap.minute>=90?'disabled':'')+' aria-pressed="'+(snap.tactic===t)+'">'+esc(t)+'</button>').join("")+'</div></section>';
  }
  function paint(){if(!session)return;if(session.officialControl){const current=session.officialControl.match;if(current)session.match={...current,competitionName:session.match.competitionName};}const {match:m,home,away}=session,min=session.minute,[hg,ag]=session.officialControl?.snapshot(session.officialSide)?.score||scoreAt(m,min),heroPart=m.participation?.hero,hero=heroPart?min>=Number(heroPart.entryMinute||0)&&min<=Number(heroPart.exitMinute??94):m.participants?.flat().includes("hero"),heroRating=m.ratings?.hero;const visible=(m.events||[]).filter(e=>e.minute<=min).slice().sort((a,b)=>b.minute-a.minute).slice(0,9);const el=document.getElementById("live-match-overlay");if(!el)return;
    el.innerHTML=`<div class="lm-shell"><header class="lm-header"><div><small>${esc(m.competitionName||"PARTIDA")}</small><b>${esc(home.name)} <strong>${hg} - ${ag}</strong> ${esc(away.name)}</b></div><div class="lm-clock">${min<46?"1º TEMPO":min<91?"2º TEMPO":"ACRÉSCIMOS"}<strong>${Math.min(min,94)}'</strong></div><button data-live-close ${min<94?'disabled':''}>${min<94?'EM JOGO':'CONTINUAR'}</button></header><main class="lm-layout"><section class="lm-pitch"><div class="lm-half"></div><div class="lm-circle"></div>${session.coach&&root.ProLifeMatchPitchV2?coachPitch(min,home,away):`${Array.from({length:11},(_,i)=>dot(i,0,min)).join("")}${Array.from({length:11},(_,i)=>dot(i,1,min)).join("")}<span class="lm-ball" style="left:${48+Math.sin(min*.41)*30}%;top:${48+Math.cos(min*.29)*31}%"></span>`}</section><aside class="lm-panel"><div class="lm-score"><span>${esc(home.name)}</span><strong>${hg} - ${ag}</strong><span>${esc(away.name)}</span></div>${hero?`<div class="lm-hero"><small>SEU JOGADOR</small><b>Nota ${heroRating||"—"}</b><span>${(m.offensiveStats?.hero?.goals||0)} gol(s) · ${(m.playerStats?.hero?.assists||0)} assist. · ${m.playerStats?.hero?.minutes||0} min</span></div>`:""}${session.finishError?`<div role="alert" class="lm-finish-error">${esc(session.finishError)}</div>`:""}${session.coach&&root.ProLifeCoachMatchCenterV2?root.ProLifeCoachMatchCenterV2.tabs(session.tab)+root.ProLifeCoachMatchCenterV2.panel(m,min,session.tab,{home,away})+(session.tab==="taticas"?tacticalControls():"")+(session.officialControl?interactiveControls():(session.tab==="taticas"?laboratory():"")):`<h3>ACONTECIMENTOS</h3><div class="lm-feed">${visible.length?visible.map(e=>`<article class="${e.type}"><b>${e.minute}'</b><span>${esc(e.text)}</span></article>`).join(""):'<p>A partida começou. As equipes estudam os espaços.</p>'}</div>`}</aside></main><footer class="lm-controls"><button data-live-speed="1" class="${session.speed===1?'active':''}">1x</button><button data-live-speed="2" class="${session.speed===2?'active':''}">2x</button><button data-live-speed="4" class="${session.speed===4?'active':''}">4x</button><button data-live-finish>Simular restante</button>${session.coach?`<button data-live-pause aria-pressed="${session.paused}">${session.paused?"Retomar":"Pausar"}</button>`:""}<span>${min>=94?`Finalizações ${m.shots?.[0]||0} - ${m.shots?.[1]||0} · xG ${m.xg?.[0]||0} - ${m.xg?.[1]||0}`:"Estatísticas completas após o apito final"}</span></footer></div>`;
  }
  function tick(){
    if(session?.paused)return;
    if(!session||session.minute>=94){clearInterval(timer);timer=null;if(session)session.minute=94;paint();return;}
    if(session.officialControl){
      const next=session.officialControl.advanceTo(Math.min(94,session.minute+session.speed));
      if(!next){session.paused=true;paint();return;}
      session.minute=next.minute;
      if(session.minute>=94){clearInterval(timer);timer=null;session.paused=true;}
    }else session.minute=Math.min(94,session.minute+session.speed);
    paint();
  }
  function restart(){clearInterval(timer);timer=setInterval(tick,700);}
  function start(opts){close();session={...opts,minute:0,speed:1,paused:false,selectedBench:null,swapMessage:"",tab:"acontecimentos",coach:opts?.mode==="coach",lab:null,labSide:0,
    officialControl:opts?.officialControl||null,officialSide:opts?.officialSide??0,onOfficialFinish:opts?.onOfficialFinish||null};const el=document.createElement("div");el.id="live-match-overlay";el.className="live-match-overlay";document.body.appendChild(el);paint();restart();}
  function close(){clearInterval(timer);timer=null;document.getElementById("live-match-overlay")?.remove();session=null;}
  if (typeof document !== "undefined") document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b||!session)return;if(session.officialControl&&b.hasAttribute("data-official-tactic")){
      const ok=session.officialControl.setTactic(session.officialSide,b.dataset.officialTactic);
      if(ok)session.paused=true;
      paint();return;
    }
    if(session.officialControl&&b.hasAttribute("data-official-live-sub")){
      const out=document.querySelector("[data-official-live-out]")?.value;
      const incoming=document.querySelector("[data-official-live-in]")?.value;
      const ok=session.officialControl.substitute(session.officialSide,out,incoming);
      if(ok)session.paused=true;
      paint();return;
    }
    if(session.coach&&b.hasAttribute("data-live-lab-start")){
      const lab=root.ProLifeCoachMatchLabV2;
      if(!session.lab&&lab){session.lab=lab.createPreview(session.home,session.away,1);session.labSide=0;}
      paint();return;
    }
    if(session.coach&&session.lab){
      const lab=root.ProLifeCoachMatchLabV2;
      if(b.hasAttribute("data-live-lab-next")){lab.advance(session.lab,Math.min(90,session.lab.match.minute+10));paint();return;}
      if(b.hasAttribute("data-live-lab-sub")){lab.decision(session.lab,{side:session.labSide,incomingStrength:75});paint();return;}
      if(b.hasAttribute("data-live-lab-swap")){
        const out=document.querySelector?.("[data-live-lab-out]")?.value;
        const incoming=document.querySelector?.("[data-live-lab-in]")?.value;
        lab.swapPlayer(session.lab,session.labSide,out,incoming,(session.labSide===0?session.home:session.away)?.roster||[]);
        paint();return;
      }
      if(b.dataset.liveLabTactic){lab.decision(session.lab,{side:session.labSide,tactic:b.dataset.liveLabTactic});paint();return;}
    }
    if(b.hasAttribute("data-live-pause")&&session.coach){session.paused=!session.paused;paint();return;}if(b.dataset.liveTab&&session.coach){session.tab=b.dataset.liveTab;if(session.tab==="taticas"&&!session.lab&&root.ProLifeCoachMatchLabV2){session.lab=root.ProLifeCoachMatchLabV2.createPreview(session.home,session.away,1);session.labSide=0;}paint();return;}if(b.dataset.liveSpeed){session.speed=Number(b.dataset.liveSpeed);paint();return;}if(b.hasAttribute("data-live-finish")){if(session.officialControl){session.officialControl.advanceTo(94);}session.minute=94;clearInterval(timer);timer=null;paint();return;}if(b.hasAttribute("data-live-close")&&session.minute>=94){
      if(session.officialControl&&session.onOfficialFinish){
        try {
          if(!session.officialControl.finished){
            session.officialControl.advanceTo(94);
          }
          if(!session.officialControl.finished||!session.officialControl.result){
            session.finishError="A partida ainda nao foi concluida pelo motor oficial. Tente Simular restante.";
            paint();return;
          }
          const done=session.onOfficialFinish(session.officialControl.actions);
          if(done===false||typeof done==="string"){
            session.finishError=typeof done==="string"?done:"Nao foi possivel registrar o resultado oficial. Confira a mensagem de erro e tente novamente.";
            paint();return;
          }
        }catch(error){
          session.finishError="Falha ao continuar: "+String(error?.message||error);
          paint();return;
        }
      }
      close();
    }});
  if(typeof document!=="undefined"){
    document.addEventListener("dragstart",e=>{
      const chip=e.target?.closest?.("[data-coach-squad=bench]");
      if(!chip||!session?.officialControl)return;
      session.paused=true;session.selectedBench=chip.dataset.coachPlayer;
      e.dataTransfer?.setData("text/plain",session.selectedBench);
      if(e.dataTransfer)e.dataTransfer.effectAllowed="move";
    });
    document.addEventListener("dragover",e=>{
      if(session?.selectedBench&&e.target?.closest?.("[data-coach-squad=field]"))e.preventDefault();
    });
    document.addEventListener("drop",e=>{
      const target=e.target?.closest?.("[data-coach-squad=field]");
      if(!target||!session?.selectedBench)return;
      e.preventDefault();officialSwap(target.dataset.coachPlayer,session.selectedBench);
    });
    document.addEventListener("click",e=>{
      const chip=e.target?.closest?.("[data-coach-squad]");
      if(!chip||!session?.officialControl)return;
      session.paused=true;
      if(chip.dataset.coachSquad==="bench"){
        session.selectedBench=chip.dataset.coachPlayer;paint();return;
      }
      if(session.selectedBench)officialSwap(chip.dataset.coachPlayer,session.selectedBench);
    });
  }
  if(typeof document!=="undefined") document.addEventListener("change",e=>{if(!session?.coach||!session.lab||!e.target?.matches?.("[data-live-lab-side]"))return;session.labSide=e.target.value==="1"?1:0;paint();});
  const API={start,close,scoreAt};if(typeof module!=="undefined"&&module.exports)module.exports=API;root.ProLifeLiveMatch=API;
})(typeof globalThis!=="undefined"?globalThis:this);
