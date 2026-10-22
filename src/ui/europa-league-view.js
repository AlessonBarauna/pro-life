(function(root){
'use strict';
// UI-only. Does not modify season, fixtures or save. Hook via sync(state) in app render.
const API={sync,open,close,model,renderEmbedded,setTab,setRound};
let current=null, visible=false, tab='overview', round='all', scrollY=0;
function escape(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function club(s,id){const c=(s?.globalFootball?.clubs||[]).find(x=>x.id===id)||(s?.clubs||[]).find(x=>x.id===id);return c?.name||c?.shortName||id;}
function cr(id){const h=typeof ProLifeClubCrests!=='undefined'&&ProLifeClubCrests.inline?ProLifeClubCrests.inline(id,'sm'):'';return h;}
function crA(id){const h=cr(id);return h?' '+h.trim():'';}
function model(s){
 const ed=s?.continental?.editions?.['uel:'+s.season];
 if(!ed)return {available:false,season:s?.season,reason:'A Europa ainda nao foi inicializada nesta temporada.'};
 const games=ed.leagueSchedule?.matches||[];
 const knockout=ed.knockout||null;
 const rankings=knockout?.ranking||rankingsFrom(ed);
 return {available:true,ed,season:ed.season, games,knockout,rankings,played:games.filter(x=>x.played).length,hero:(ed.entrants||[]).some(x=>x[0]===s.clubId),scheduled:games.length===144,completed:knockout?.status==='completed'};
}
function rankingsFrom(ed){
 const rows=new Map((ed.entrants||[]).map(x=>[x[0],{id:x[0],p:0,gd:0,gf:0,ga:0,w:0,d:0,l:0,played:0,awayGoals:0}]));
 for(const m of (ed.leagueSchedule?.matches||[])){
  if(!m.played||!Number.isInteger(m.hg)||!Number.isInteger(m.ag))continue;
  const a=rows.get(m.homeId),b=rows.get(m.awayId);if(!a||!b)continue;
  a.played++;b.played++;a.gf+=m.hg;a.ga+=m.ag;a.gd+=m.hg-m.ag;
  b.gf+=m.ag;b.ga+=m.hg;b.gd+=m.ag-m.hg;b.awayGoals+=m.ag;
  if(m.hg>m.ag){a.p+=3;a.w++;b.l++;}else if(m.hg<m.ag){b.p+=3;b.w++;a.l++;}else{a.p++;b.p++;a.d++;b.d++;}
 }
 return [...rows.values()].sort((a,b)=>b.p-a.p||b.gd-a.gd||b.gf-a.gf||b.awayGoals-a.awayGoals||b.w-a.w||a.id.localeCompare(b.id)).map((x,i)=>({...x,position:i+1,status:i<8?'round16':i<24?'playoffs':'out'}));
}
function style(){return `<style id="pl-uel-css">


.pl-uel-embedded *{box-sizing:border-box}.pl-uel-embedded button,.pl-uel-embedded select{font:inherit;cursor:pointer}
.pl-uel-wrap{max-width:1260px;margin:32px auto;padding:0 22px 70px}
.pl-uel-header{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:24px 28px;background:linear-gradient(120deg,#11286a,#0a1232);border:1px solid #324a82;border-radius:18px}
.pl-uel-kicker{font-size:11px;letter-spacing:.22em;color:#9ec2ff;font-weight:800}.pl-uel-header h1{margin:6px 0;font-size:clamp(23px,3vw,37px);color:white}.pl-uel-muted{color:#aebddd}
.pl-uel-close{border:1px solid #6075aa;color:white;background:#101f49;padding:10px 14px;border-radius:9px}
.pl-uel-nav{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0}.pl-uel-nav button{border:1px solid #2f426e;padding:10px 15px;border-radius:9px;background:#111c3a;color:#c9d6f0}.pl-uel-nav button.active{background:#214ba5;color:white;border-color:#5089e9}
.pl-uel-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:12px;margin:20px 0}.pl-uel-stat,.pl-uel-card{background:#101b35;border:1px solid #2d3a59;border-radius:13px;padding:17px}.pl-uel-stat strong{display:block;font-size:29px;color:#fff;margin-top:6px}
.pl-uel-grid{display:grid;grid-template-columns:1.4fr 1fr;gap:16px}.pl-uel-card h2{margin:0 0 15px;color:#fff;font-size:19px}
.pl-uel-table{border-collapse:collapse;width:100%;font-size:12px}.pl-uel-table th{text-align:left;color:#9fb1d3;font-weight:600;border-bottom:1px solid #334464;padding:10px 6px}.pl-uel-table td{padding:9px 6px;border-bottom:1px solid #24324d}.pl-uel-table tr.hero{background:#243a68}.pl-uel-table td:nth-child(n+3),.pl-uel-table th:nth-child(n+3){text-align:right}.pl-uel-rank{display:inline-flex;width:22px;height:22px;align-items:center;justify-content:center;background:#25334c;border-radius:6px}.pl-uel-rank.direct{background:#176b54}.pl-uel-rank.playoff{background:#846021}
.pl-uel-fixture{display:grid;grid-template-columns:70px 1fr 35px 1fr 70px;gap:7px;align-items:center;padding:12px 6px;border-bottom:1px solid #293751}.pl-uel-fixture .home{text-align:right}.pl-uel-fixture .away{text-align:left}.pl-uel-fixture .score{text-align:center;font-weight:800;color:#fff}.pl-uel-hero{background:#213b69;border-radius:7px}.pl-uel-pill{font-size:11px;color:#b9cbeb}.pl-uel-filter{padding:9px 12px;border-radius:8px;background:#152b56;color:white;border:1px solid #3d5d95;max-width:100%}
.pl-uel-bracket{display:grid;grid-template-columns:repeat(5,minmax(165px,1fr));gap:12px;overflow-x:auto;padding-bottom:12px}.pl-uel-stage{min-width:165px}.pl-uel-pair{border:1px solid #2b3e64;background:#152343;border-radius:10px;padding:12px;margin:8px 0}.pl-uel-stage h3{font-size:14px;margin:0 0 12px;color:#a9c5ff}.pl-uel-pair div{padding:4px 0}.pl-uel-win{color:#8bf0c1;font-weight:700}.pl-uel-empty{padding:30px;color:#b3c3df;text-align:center}.pl-uel-badge{font-size:11px;padding:4px 8px;background:#20385e;border-radius:7px;color:#c8dcfa}
@media(max-width:800px){.pl-uel-grid{grid-template-columns:1fr}.pl-uel-wrap{margin:10px auto;padding:0 10px 65px}.pl-uel-header{padding:18px}.pl-uel-table{font-size:11px}.pl-uel-bracket{display:flex;overflow-x:auto}.pl-uel-stage{min-width:215px}}

.pl-uel-embedded{background:linear-gradient(155deg,#071522,#0c1420 75%);color:#e9f0fb;border:1px solid #26374b;border-radius:16px;min-height:540px;font:14px system-ui}
.pl-uel-embedded *{box-sizing:border-box}
.pl-uel-embedded button,.pl-uel-embedded select{font:inherit;cursor:pointer}
.pl-uel-embedded .pl-uel-wrap{max-width:1400px;margin:0 auto;padding:20px 24px 50px}
.pl-uel-embedded .pl-uel-header{background:linear-gradient(120deg,#112846,#091827);border-color:#27485c}
.pl-uel-embedded .pl-uel-nav button.active{background:#127d80;border-color:#3bd0d1;color:#fff}
.pl-uel-embedded .pl-uel-stat,.pl-uel-embedded .pl-uel-card{background:#0e1e2b;border-color:#29404c}
.pl-uel-embedded .pl-uel-fixture{grid-template-columns:65px minmax(0,1fr) 38px minmax(0,1fr) 64px}
@media(max-width:800px){.pl-uel-embedded .pl-uel-wrap{padding:12px}.pl-uel-embedded .pl-uel-fixture{font-size:11px;grid-template-columns:48px minmax(0,1fr) 28px minmax(0,1fr) 48px}}

/* PRO-LIFE Serie 27 x UEFA Europa League — visual only, scoped. */
.pl-uel-embedded{--uel-orange:#ff821e;--uel-orange-light:#ffb369;--uel-line:rgba(255,130,30,.25);background:radial-gradient(ellipse at 94% 0%,rgba(255,124,21,.11),transparent 40%),linear-gradient(140deg,#0b0e13,#111316 74%);color:#ebeff3;border:1px solid var(--uel-line);border-radius:var(--pl-r-lg,5px);font-family:var(--fc-body,system-ui)}
.pl-uel-embedded .pl-uel-wrap{max-width:1500px;margin:0 auto;padding:22px clamp(12px,2.5vw,32px) 54px}
.pl-uel-embedded .pl-uel-header{position:relative;isolation:isolate;overflow:hidden;min-height:180px;padding:32px clamp(20px,3vw,42px);border:1px solid var(--uel-line);border-radius:4px;background:linear-gradient(110deg,#0a0b0e 8%,#271508 69%,#100e0d);box-shadow:0 18px 55px rgba(0,0,0,.22)}
.pl-uel-embedded .pl-uel-header:after{content:"";position:absolute;right:-2%;top:-80%;width:43%;height:250%;transform:skewX(-31deg);z-index:-1;background:repeating-linear-gradient(90deg,transparent 0 22px,rgba(255,126,17,.075) 22px 26px,transparent 26px 56px),linear-gradient(90deg,transparent,rgba(255,125,17,.15))}
.pl-uel-embedded .pl-uel-kicker{font-family:var(--fc-display,system-ui);font-size:10px;font-weight:800;letter-spacing:.19em;color:var(--uel-orange-light)}
.pl-uel-embedded .pl-uel-header h1{font-family:var(--fc-display,system-ui);font-size:clamp(28px,3.1vw,48px);font-weight:900;letter-spacing:.045em;text-transform:uppercase;color:#fff;line-height:1.07;margin:9px 0 12px}
.pl-uel-embedded .pl-uel-muted{color:#aeb4be}
.pl-uel-embedded .pl-uel-header .pl-uel-muted{color:#dac5b7}
.pl-uel-embedded .pl-uel-badge{background:rgba(255,128,19,.12);border:1px solid rgba(255,128,19,.35);color:var(--uel-orange-light);font-family:var(--fc-display,system-ui);font-weight:900;letter-spacing:.1em;text-transform:uppercase;padding:12px 18px;border-radius:3px}
.pl-uel-embedded .pl-uel-nav{gap:0;margin:19px 0 22px;padding:0 8px;overflow-x:auto;border:1px solid rgba(255,255,255,.09);border-bottom:2px solid rgba(255,130,30,.38);background:#0d1218}
.pl-uel-embedded .pl-uel-nav button{flex-shrink:0;border:0;border-bottom:3px solid transparent;border-radius:0;background:transparent;color:#b2bbc5;font-family:var(--fc-display,system-ui);text-transform:uppercase;font-size:12px;font-weight:800;letter-spacing:.045em;padding:17px 19px;margin-bottom:-2px;transition:color .16s,background .16s}
.pl-uel-embedded .pl-uel-nav button:hover{color:#fff;background:rgba(255,130,30,.07)}
.pl-uel-embedded .pl-uel-nav button.active{background:rgba(255,130,30,.12);color:#fff;border:0;border-bottom:3px solid var(--uel-orange)}
.pl-uel-embedded .pl-uel-stats{gap:10px;margin:0 0 18px}
.pl-uel-embedded .pl-uel-stat,.pl-uel-embedded .pl-uel-card{background:linear-gradient(155deg,#151b22,#0d1218);border:1px solid rgba(255,255,255,.09);border-radius:4px;box-shadow:none}
.pl-uel-embedded .pl-uel-stat{position:relative;overflow:hidden;border-top:2px solid rgba(255,130,30,.6);padding:18px 20px}
.pl-uel-embedded .pl-uel-stat strong{font-family:var(--fc-display,system-ui);font-size:30px;color:#fff}
.pl-uel-embedded .pl-uel-card{padding:22px}
.pl-uel-embedded .pl-uel-card h2{font-family:var(--fc-display,system-ui);text-transform:uppercase;letter-spacing:.035em;font-size:19px;margin-bottom:18px}
.pl-uel-embedded .pl-uel-table th{font-family:var(--fc-display,system-ui);font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--uel-orange-light);border-bottom:1px solid var(--uel-line)}
.pl-uel-embedded .pl-uel-table td{border-bottom-color:rgba(255,255,255,.065)}
.pl-uel-embedded .pl-uel-table tr.hero{background:rgba(255,130,30,.10)}
.pl-uel-embedded .pl-uel-rank{background:#252c33;color:#eee;border-radius:2px}
.pl-uel-embedded .pl-uel-rank.direct{background:#176c4c;color:#fff}
.pl-uel-embedded .pl-uel-rank.playoff{background:#8a511c;color:#fff}
.pl-uel-embedded .pl-uel-fixture{border-bottom-color:rgba(255,255,255,.075);gap:10px}
.pl-uel-embedded .pl-uel-hero{background:rgba(255,130,30,.11);border-left:3px solid var(--uel-orange);border-radius:2px}
.pl-uel-embedded .pl-uel-fixture .score{color:var(--uel-orange-light)}
.pl-uel-embedded .pl-uel-pill{color:#b7bdc6}
.pl-uel-embedded .pl-uel-filter{background:#111820;color:#f7f7f7;border:1px solid var(--uel-line);border-radius:3px}
.pl-uel-embedded .pl-uel-pair{background:#141b21;border:1px solid var(--uel-line);border-radius:3px}
.pl-uel-embedded .pl-uel-stage h3{color:var(--uel-orange-light);font-family:var(--fc-display,system-ui);text-transform:uppercase}
.pl-uel-embedded .pl-uel-win{color:#74e0ab}
.pl-uel-embedded button:focus-visible,.pl-uel-embedded select:focus-visible{outline:3px solid var(--uel-orange);outline-offset:2px}
@media(max-width:800px){.pl-uel-embedded .pl-uel-header{min-height:150px;padding:24px 18px}.pl-uel-embedded .pl-uel-header h1{font-size:30px}.pl-uel-embedded .pl-uel-badge{padding:8px}.pl-uel-embedded .pl-uel-nav button{font-size:11px;padding:13px 12px}.pl-uel-embedded .pl-uel-card{padding:14px}}
</style>`;}
function fixture(s,m){const hero=[m.homeId,m.awayId].includes(s.clubId);return `<div class="pl-uel-fixture ${hero?'pl-uel-hero':''}"><span class="pl-uel-pill">${escape(new Date(Date.UTC(2026,0,1)+Number(m.day)*86400000).toLocaleDateString("pt-BR",{timeZone:"UTC",day:"2-digit",month:"2-digit",year:"numeric"}))}</span><span class="home">${escape(club(s,m.homeId))}${crA(m.homeId)}</span><span class="score">${m.played?escape(m.hg)+' – '+escape(m.ag):'×'}</span><span class="away">${cr(m.awayId)}${escape(club(s,m.awayId))}</span><span class="pl-uel-pill">${m.played?'Final':'Pendente'}</span></div>`;}
function table(s,m,limit=36){return `<div style="overflow-x:auto"><table class="pl-uel-table"><thead><tr><th>#</th><th>Clube</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th><th>PTS</th></tr></thead><tbody>${m.rankings.slice(0,limit).map((r,i)=>`<tr class="${r.id===s.clubId?'hero':''}"><td><span class="pl-uel-rank ${i<8?'direct':i<24?'playoff':''}">${i+1}</span></td><td>${cr(r.id)}${escape(club(s,r.id))}</td><td>${r.played??((r.w||0)+(r.d||0)+(r.l||0))}</td><td>${r.w||0}</td><td>${r.d||0}</td><td>${r.l||0}</td><td>${r.gd||0}</td><td><b>${r.p||0}</b></td></tr>`).join('')}</tbody></table></div>`;}
function allMatches(m){return [...m.games,...(m.knockout?.stages||[]).flatMap(x=>x.matches||[])];}
function stageView(s,m){const names={playoffs:'Playoffs',round16:'Oitavas de final',quarters:'Quartas de final',semis:'Semifinais',final:'Final'};const keys=['playoffs','round16','quarters','semis','final'];return `<div class="pl-uel-card"><h2>Chave eliminatória</h2><div class="pl-uel-bracket">${keys.map(k=>{const st=m.knockout?.stages?.find(x=>x.key===k);const pairs=new Map();for(const match of st?.matches||[]){if(!pairs.has(match.pair))pairs.set(match.pair,[]);pairs.get(match.pair).push(match)}return `<div class="pl-uel-stage"><h3>${names[k]}</h3>${st?Array.from(pairs.values()).map(ms=>{const first=ms[0],winner=st.winners?.find(id=>[first.homeId,first.awayId].includes(id));return `<div class="pl-uel-pair"><div class="${winner===first.homeId?'pl-uel-win':''}">${cr(first.homeId)}${escape(club(s,first.homeId))}</div><div class="${winner===first.awayId?'pl-uel-win':''}">${cr(first.awayId)}${escape(club(s,first.awayId))}</div><small class="pl-uel-muted">${ms.map(x=>x.played?`${x.hg}-${x.ag}`:'A disputar').join(' · ')}</small></div>`}).join(''):'<div class="pl-uel-empty">A definir</div>'}</div>`}).join('')}</div></div>`;}
function body(s,m){if(!m.available)return `<div class="pl-uel-card pl-uel-empty">${escape(m.reason)}</div>`;
 if(!m.scheduled)return `<div class="pl-uel-card"><h2>Temporada ${escape(s.calendarVersion==="european_v1"?`${m.season}/${String((Number(m.season)+1)%100).padStart(2,"0")}`:m.season)} · calendário não registrado</h2><p class="pl-uel-muted">Esta carreira foi carregada depois das primeiras datas da Europa. Para preservar a história, nenhum placar anterior será inventado. A próxima temporada terá seus 144 jogos preparados automaticamente na virada do ano, com base nos classificados.</p><p class="pl-uel-muted">A lista atual de inscritos é provisória; ainda não há jogos ou classificação válida nesta edição.</p><div class="pl-uel-stats"><div class="pl-uel-stat"><span>Clubes previstos</span><strong>${escape(m.ed.entrants?.length||0)}</strong></div><div class="pl-uel-stat"><span>Partidas efetivas</span><strong>0</strong></div></div></div>`;
 const matches=allMatches(m), own=matches.filter(x=>[x.homeId,x.awayId].includes(s.clubId)).sort((a,b)=>a.day-b.day); const next=own.find(x=>!x.played&&x.day>=s.day);
 const stats=`<div class="pl-uel-stats"><div class="pl-uel-stat"><span class="pl-uel-muted">Fase de liga</span><strong>${m.played}/144</strong></div><div class="pl-uel-stat"><span class="pl-uel-muted">Participantes</span><strong>36</strong></div><div class="pl-uel-stat"><span class="pl-uel-muted">Sua participação</span><strong style="font-size:20px">${m.hero?'Classificado':'Não classificado'}</strong></div><div class="pl-uel-stat"><span class="pl-uel-muted">Campeão</span><strong style="font-size:18px">${m.knockout?.championId?cr(m.knockout.championId)+escape(club(s,m.knockout.championId)):'A definir'}</strong></div></div>`;
 if(tab==='standings')return stats+`<div class="pl-uel-card"><h2>Classificação • 36 equipes</h2><p class="pl-uel-muted">1º–8º: oitavas diretas · 9º–24º: playoffs · 25º–36º: eliminados</p>${table(s,m)}</div>`;
 if(tab==='fixtures')return stats+`<div class="pl-uel-card"><h2>Jogos e resultados</h2><label for="pl-uel-round">Filtrar fase: </label> <select class="pl-uel-filter" id="pl-uel-round"><option value="all">Todas</option>${Array.from({length:8},(_,i)=>`<option value="${i+1}" ${round===String(i+1)?'selected':''}>Rodada ${i+1}</option>`).join('')}<option value="ko" ${round==='ko'?'selected':''}>Mata-mata</option></select><div>${matches.filter(x=>round==='all'||(round==='ko'?!!x.stage:String(x.round)===round)).sort((a,b)=>a.day-b.day).map(x=>fixture(s,x)).join('')||'<div class="pl-uel-empty">Nenhuma partida</div>'}</div></div>`;
 if(tab==='bracket')return stats+stageView(s,m);
 if(tab==='club')return stats+`<div class="pl-uel-card"><h2>Campanha de ${escape(club(s,s.clubId))}</h2>${!m.hero?'<p>Seu clube não se classificou nesta edição.</p>':own.map(x=>fixture(s,x)).join('')}</div>`;
 return stats+`<div class="pl-uel-grid"><div class="pl-uel-card"><h2>Classificação da fase de liga</h2>${table(s,m,12)}<p class="pl-uel-muted">Veja os 36 clubes na aba Classificação.</p></div><div><div class="pl-uel-card"><h2>Próximo compromisso</h2>${next?fixture(s,next):'<p class="pl-uel-muted">Nenhuma partida futura cadastrada.</p>'}</div><div class="pl-uel-card" style="margin-top:15px"><h2>Últimos resultados</h2>${matches.filter(x=>x.played).sort((a,b)=>b.day-a.day).slice(0,6).map(x=>fixture(s,x)).join('')||'<p class="pl-uel-muted">Ainda sem partidas.</p>'}</div></div></div>`;
}
function renderEmbedded(s){
 current=s;
 const m=model(s);
 const names={overview:'Visão geral',standings:'Classificação',fixtures:'Jogos',bracket:'Mata-mata',club:'Meu clube'};
 const heading=`<div class="pl-uel-header"><div><div class="pl-uel-kicker">TEMPORADA · COMPETIÇÕES UEFA</div><h1>UEFA EUROPA LEAGUE</h1><div class="pl-uel-muted">Temporada ${escape(s.calendarVersion==="european_v1"?`${m.season}/${String((Number(m.season)+1)%100).padStart(2,"0")}`:m.season)} · ${m.available&&m.scheduled?`${m.played}/144 jogos da fase de liga`:'Sem jogos registrados nesta edição'}</div></div><div class="pl-uel-badge">UEL · 2026</div></div>`;
 const navigation=`<nav class="pl-uel-nav" aria-label="Seções da Europa">${Object.entries(names).map(([k,n])=>`<button type="button" data-pl-uel-tab="${k}" class="${tab===k?'active':''}" aria-pressed="${tab===k}">${n}</button>`).join('')}</nav>`;
 return style()+`<section id="pl-uel-embedded" class="pl-uel-embedded"><div class="pl-uel-wrap">${heading}${navigation}${body(s,m)}</div></section>`;
}
function setTab(value){if(['overview','standings','fixtures','bracket','club'].includes(value))tab=value;}
function setRound(value){round=String(value||'all');}
function sync(s){current=s;}
function open(){ /* UI integrada: navegar por TEMPORADA > Europa League */ }
function close(){ /* nao ha sobreposicao para fechar */ }
root.ProLifeEuropaUI=API;
if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof globalThis!=='undefined'?globalThis:this);
