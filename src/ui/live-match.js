(function(root){
  "use strict";
  let session=null,timer=null;
  const esc=(v)=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function scoreAt(m,min){let h=0,a=0;(m.events||[]).forEach(e=>{if(e.type==="goal"&&e.minute<=min)e.side===0?h++:a++;});return [h,a];}
  function dot(i,side,min){const row=Math.floor(i/3),col=i%3;const baseX=side?58:12;const x=baseX+col*8+Math.sin((min+i*7)*.17)*3;const y=10+row*21+Math.cos((min+i*5)*.13)*5;return `<i class="lm-player lm-${side?'away':'home'}" style="left:${x}%;top:${y}%">${i+1}</i>`;}
  function coachPitch(min,home,away){
    const frame=root.ProLifeMatchPitchV2?.frame?.(min,home,away);
    if(!frame)return null;
    const dots=(list,side)=>list.map(p=>'<i class="lm-player lm-'+(side===0?'home':'away')+'" title="'+esc(p.player?.name||"Jogador "+p.number)+'" style="left:'+p.x.toFixed(2)+'%;top:'+p.y.toFixed(2)+'%">'+esc(p.player?.number||p.number)+'</i>').join("");
    return dots(frame.home,0)+dots(frame.away,1)+'<span class="lm-ball" style="left:'+frame.ball.x.toFixed(2)+'%;top:'+frame.ball.y.toFixed(2)+'%"></span>';
  }
  function labPlayerSelectors(preview){
    const roster=(session.labSide===0?session.home:session.away)?.roster||[];
    const line=preview?.lineups?.[session.labSide];
    if(!line||!line.starters.length||!line.bench.length)return '<p class="lm-mc-note">Elenco com reservas indisponivel para troca nominal.</p>';
    const option=id=>{const p=roster.find(x=>String(x.id)===id);return '<option value="'+esc(id)+'">'+esc(p?.name||id)+' · GER '+esc(p?.ovr??p?.overall??"—")+'</option>';};
    return '<div class="lm-mc-swap"><label>Sai <select data-live-lab-out>'+line.starters.map(option).join("")+'</select></label>'+
      '<label>Entra <select data-live-lab-in>'+line.bench.map(option).join("")+'</select></label>'+
      '<button type="button" data-live-lab-swap>Confirmar troca experimental</button></div>';
  }
  function laboratory(){
    if(!session?.coach||!root.ProLifeCoachMatchLabV2)return "";
    const lab=root.ProLifeCoachMatchLabV2,preview=session.lab;
    const status=preview?lab.summary(preview):null;
    return '<section class="lm-mc-lab"><h3>LABORATORIO TATICO - EXPERIMENTAL</h3>'+
      '<p class="lm-mc-note">Simulacao independente. Nenhuma decisao altera esta partida oficial ou o save.</p>'+
      (!preview?'<button type="button" data-live-lab-start>Iniciar simulacao paralela</button>':
      '<p class="lm-mc-note">Minuto '+esc(status.minute)+' · Placar hipotetico '+esc(status.score.join(" - "))+' · Chutes '+esc(status.shots.join(" - "))+' · Substituicoes '+esc(status.substitutions[session.labSide])+'/5</p>'+
      '<label>Equipe <select data-live-lab-side><option value="0"'+(session.labSide===0?' selected':'')+'>'+esc(session.home?.name||"Mandante")+'</option><option value="1"'+(session.labSide===1?' selected':'')+'>'+esc(session.away?.name||"Visitante")+'</option></select></label>'+
      '<div class="lm-mc-lab-actions">'+["equilibrado","ofensivo","defensivo","pressao_alta"].map(t=>'<button type="button" data-live-lab-tactic="'+t+'">'+esc(t.replace("_"," "))+'</button>').join("")+
      '<button type="button" data-live-lab-next '+(status.minute>=90?'disabled':'')+'>Avancar 10 min</button></div>'+labPlayerSelectors(preview))+'</section>';
  }
  function paint(){if(!session)return;const {match:m,home,away}=session,min=session.minute,[hg,ag]=scoreAt(m,min),heroPart=m.participation?.hero,hero=heroPart?min>=Number(heroPart.entryMinute||0)&&min<=Number(heroPart.exitMinute??94):m.participants?.flat().includes("hero"),heroRating=m.ratings?.hero;const visible=(m.events||[]).filter(e=>e.minute<=min).slice().sort((a,b)=>b.minute-a.minute).slice(0,9);const el=document.getElementById("live-match-overlay");if(!el)return;
    el.innerHTML=`<div class="lm-shell"><header class="lm-header"><div><small>${esc(m.competitionName||"PARTIDA")}</small><b>${esc(home.name)} <strong>${hg} - ${ag}</strong> ${esc(away.name)}</b></div><div class="lm-clock">${min<46?"1º TEMPO":min<91?"2º TEMPO":"ACRÉSCIMOS"}<strong>${Math.min(min,94)}'</strong></div><button data-live-close ${min<94?'disabled':''}>${min<94?'EM JOGO':'CONTINUAR'}</button></header><main class="lm-layout"><section class="lm-pitch"><div class="lm-half"></div><div class="lm-circle"></div>${session.coach&&root.ProLifeMatchPitchV2?coachPitch(min,home,away):`${Array.from({length:11},(_,i)=>dot(i,0,min)).join("")}${Array.from({length:11},(_,i)=>dot(i,1,min)).join("")}<span class="lm-ball" style="left:${48+Math.sin(min*.41)*30}%;top:${48+Math.cos(min*.29)*31}%"></span>`}</section><aside class="lm-panel"><div class="lm-score"><span>${esc(home.name)}</span><strong>${hg} - ${ag}</strong><span>${esc(away.name)}</span></div>${hero?`<div class="lm-hero"><small>SEU JOGADOR</small><b>Nota ${heroRating||"—"}</b><span>${(m.offensiveStats?.hero?.goals||0)} gol(s) · ${(m.playerStats?.hero?.assists||0)} assist. · ${m.playerStats?.hero?.minutes||0} min</span></div>`:""}${session.coach&&root.ProLifeCoachMatchCenterV2?root.ProLifeCoachMatchCenterV2.tabs(session.tab)+root.ProLifeCoachMatchCenterV2.panel(m,min,session.tab,{home,away})+(session.tab==="taticas"?laboratory():""):`<h3>ACONTECIMENTOS</h3><div class="lm-feed">${visible.length?visible.map(e=>`<article class="${e.type}"><b>${e.minute}'</b><span>${esc(e.text)}</span></article>`).join(""):'<p>A partida começou. As equipes estudam os espaços.</p>'}</div>`}</aside></main><footer class="lm-controls"><button data-live-speed="1" class="${session.speed===1?'active':''}">1x</button><button data-live-speed="2" class="${session.speed===2?'active':''}">2x</button><button data-live-speed="4" class="${session.speed===4?'active':''}">4x</button><button data-live-finish>Simular restante</button>${session.coach?`<button data-live-pause aria-pressed="${session.paused}">${session.paused?"Retomar":"Pausar"}</button>`:""}<span>${min>=94?`Finalizações ${m.shots?.[0]||0} - ${m.shots?.[1]||0} · xG ${m.xg?.[0]||0} - ${m.xg?.[1]||0}`:"Estatísticas completas após o apito final"}</span></footer></div>`;
  }
  function tick(){if(session?.paused)return;if(!session||session.minute>=94){clearInterval(timer);timer=null;if(session)session.minute=94;paint();return;}session.minute=Math.min(94,session.minute+session.speed);paint();}
  function restart(){clearInterval(timer);timer=setInterval(tick,700);}
  function start(opts){close();session={...opts,minute:0,speed:1,paused:false,tab:"acontecimentos",coach:opts?.mode==="coach",lab:null,labSide:0};const el=document.createElement("div");el.id="live-match-overlay";el.className="live-match-overlay";document.body.appendChild(el);paint();restart();}
  function close(){clearInterval(timer);timer=null;document.getElementById("live-match-overlay")?.remove();session=null;}
  if (typeof document !== "undefined") document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b||!session)return;if(session.coach&&b.hasAttribute("data-live-lab-start")){
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
    if(b.hasAttribute("data-live-pause")&&session.coach){session.paused=!session.paused;paint();return;}if(b.dataset.liveTab&&session.coach){session.tab=b.dataset.liveTab;paint();return;}if(b.dataset.liveSpeed){session.speed=Number(b.dataset.liveSpeed);paint();return;}if(b.hasAttribute("data-live-finish")){session.minute=94;clearInterval(timer);timer=null;paint();return;}if(b.hasAttribute("data-live-close")&&session.minute>=94)close();});
  if(typeof document!=="undefined") document.addEventListener("change",e=>{if(!session?.coach||!session.lab||!e.target?.matches?.("[data-live-lab-side]"))return;session.labSide=e.target.value==="1"?1:0;paint();});
  const API={start,close,scoreAt};if(typeof module!=="undefined"&&module.exports)module.exports=API;root.ProLifeLiveMatch=API;
})(typeof globalThis!=="undefined"?globalThis:this);
