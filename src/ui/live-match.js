(function liveModule(root){
 "use strict";
 let session=null,timer=null;
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const safeMinute=e=>Math.max(0,Math.min(120,Math.floor(Number(e?.minute)||0)));
 const events=m=>(Array.isArray(m?.events)?m.events:[]).filter(e=>Number.isFinite(Number(e?.minute))).map((e,i)=>({...e,_index:i,_minute:safeMinute(e)})).sort((a,b)=>a._minute-b._minute||a._index-b._index);
 const finalMinute=m=>Math.max(90,Math.min(120,Number(m?.duration)||94),...events(m).map(e=>e._minute));
 const scoreAt=(m,min)=>{
   let h=0,a=0;
   for(const e of events(m)){if(e._minute>min)break;if(e.type==="goal"){if(e.side===0||e.side==="home")h++;if(e.side===1||e.side==="away")a++;}}
   const final=finalMinute(m);
   if(min>=final&&Number.isFinite(Number(m?.hg))&&Number.isFinite(Number(m?.ag)))return [Number(m.hg),Number(m.ag)];
   return [h,a];
 };
 const heroSnapshot=(m,min)=>{
   const p=m?.participation?.hero;
   const stats=m?.playerStats?.hero||{};
   if(!p)return {label:"Participação não informada",entry:null,exit:null,played:false};
   const entry=Number.isFinite(Number(p.entryMinute))?Number(p.entryMinute):null;
   const exit=Number.isFinite(Number(p.exitMinute))?Number(p.exitMinute):null;
   const status=String(p.status||p.role||"").toLowerCase();
   if(status.includes("not")||status.includes("fora")||status.includes("unused")||status.includes("não utilizado"))return {label:"Não utilizado / fora da relação",entry,exit,played:false};
   if(entry===null)return {label:"Situação não informada",entry,exit,played:false};
   if(min<entry)return {label:entry===0?"Titular · início programado":"Banco de reservas",entry,exit,played:false};
   if(exit!==null&&min>exit)return {label:"Substituído aos "+exit+"'",entry,exit,played:true};
   return {label:entry===0?"Titular · em campo":"Entrou aos "+entry+"'",entry,exit,played:true};
 };
 function clearTimer(){if(timer!==null)clearInterval(timer);timer=null;}
 function stop(){clearTimer();if(session){session.playing=false;}}
 function jump(min){if(!session)return;session.minute=Math.max(0,Math.min(session.final,Math.floor(min)));if(session.minute>=session.final)stop();paint();}
 function eventClass(e){const t=String(e.type||"").toLowerCase();return ["goal","yellow","red","substitution","injury"].includes(t)?t:"other";}
 function paint(){
   if(!session)return;
   const {match:m,home,away}=session,min=session.minute,final=session.final;
   const [hg,ag]=scoreAt(m,min);
   const records=session.events.filter(e=>e._minute<=min).slice().reverse();
   const hero=heroSnapshot(m,min);
   const finished=min>=final;
   const host=document.getElementById("live-match-overlay");if(!host)return;
   const team=(c,id)=>{const mark=id&&root.ProLifeClubCrests?.inline?root.ProLifeClubCrests.inline(id,"md"):"";return `<span class="j08-team-mark">${mark}</span><b>${esc(c?.name||"Equipe")}</b>`;};
   const homeId=m.home||home?.id,awayId=m.away||away?.id;
   const line=records.length?records.map(e=>`<article class="j08-event ${eventClass(e)}"><span class="j08-event-minute">${e._minute}'</span><span class="j08-event-body">${esc(e.text||e.label||e.type||"Evento registrado")}</span><span class="j08-event-type">${esc(({goal:"GOL",yellow:"AMARELO",red:"VERMELHO",substitution:"SUBSTITUIÇÃO",injury:"LESÃO"})[eventClass(e)]||"EVENTO")}</span></article>`).join(""):'<p class="j08-waiting">Nenhum acontecimento registrado até este minuto.</p>';
   const resultStats=finished?`<section class="j08-result"><b>APITO FINAL</b><span>Placar registrado: ${hg} × ${ag}</span><span>Minutos do atleta: ${esc(m.playerStats?.hero?.minutes??"Não informado")} · Nota: ${esc(m.ratings?.hero??"—")}</span></section>`:"";
   host.innerHTML=`<div class="j08-shell" role="dialog" aria-modal="true" aria-label="Acompanhamento de partida"><header class="j08-head"><small>${esc(m.competitionName||"PARTIDA")}</small><div class="j08-scoreboard"><div>${team(home,homeId)}</div><strong>${hg} : ${ag}</strong><div>${team(away,awayId)}</div></div><div class="j08-clock">${min>=final?"FIM DE JOGO":min===45?"INTERVALO":"ACOMPANHAMENTO"} · ${min}'</div></header><main class="j08-content"><section class="j08-timeline"><h2>ACONTECIMENTOS DA PARTIDA</h2><div class="j08-timeline-scroll" aria-live="polite">${line}</div>${resultStats}</section><aside class="j08-aside"><small>SUA SITUAÇÃO</small><h3>${esc(hero.label)}</h3><p>${hero.entry!==null&&hero.entry>min?"Entrada registrada aos "+hero.entry+"'":hero.played?"Participação registrada na partida.":"Aguardando registro de participação."}</p><div class="j08-progress"><span>Tempo acompanhado</span><strong>${min}' / ${final}'</strong><i><em style="width:${Math.round(min/final*100)}%"></em></i></div><p class="j08-disclaimer">Esta é a reprodução dos eventos registrados pelo motor. Não é uma partida jogável nem gera novas estatísticas.</p></aside></main><footer class="j08-actions"><button type="button" data-j08-toggle>${session.playing?"Pausar":"Reproduzir"}</button><button type="button" data-j08-next ${finished?"disabled":""}>Próximo evento</button><button type="button" data-j08-half ${min>=45?"disabled":""}>Até intervalo</button><button type="button" data-j08-entry ${hero.entry===null||hero.entry<=min?"disabled":""}>Até entrar em campo</button><button type="button" class="primary" data-j08-finish ${finished?"disabled":""}>Pular para resultado</button><button type="button" data-j08-close ${finished?"":"disabled"}>Fechar</button></footer></div>`;
 }
 function tick(){if(!session||!session.playing)return;if(session.minute>=session.final){stop();paint();return;}session.minute=Math.min(session.final,session.minute+session.speed);if(session.minute>=session.final)stop();paint();}
 function resume(){if(!session)return;clearTimer();session.playing=true;timer=setInterval(tick,700);paint();}
 function start(opts){close();if(!opts?.match) return;session={...opts,events:events(opts.match),final:finalMinute(opts.match),minute:0,speed:1,playing:false};const el=document.createElement("div");el.id="live-match-overlay";el.className="live-match-overlay j08-overlay";document.body.appendChild(el);paint();}
 function close(){stop();document.getElementById("live-match-overlay")?.remove();session=null;}
 if(typeof document!=="undefined")document.addEventListener("click",e=>{
   const b=e.target.closest?.("button");if(!session||!b||!b.closest("#live-match-overlay"))return;
   if(b.hasAttribute("data-j08-toggle")){if(session.playing){stop();paint();}else resume();return;}
   if(b.hasAttribute("data-j08-next")){stop();const next=session.events.find(ev=>ev._minute>session.minute);jump(next?next._minute:session.final);return;}
   if(b.hasAttribute("data-j08-half")){stop();jump(45);return;}
   if(b.hasAttribute("data-j08-entry")){stop();const entry=heroSnapshot(session.match,session.minute).entry;if(entry!==null&&entry>session.minute)jump(entry);return;}
   if(b.hasAttribute("data-j08-finish")){stop();jump(session.final);return;}
   if(b.hasAttribute("data-j08-close")&&session.minute>=session.final)close();
 });
 const API={start,close,scoreAt,events,heroSnapshot,finalMinute};if(typeof module!=="undefined"&&module.exports)module.exports=API;root.ProLifeLiveMatch=API;
})(typeof globalThis!=="undefined"?globalThis:this);
