(function(root){
'use strict';
// UI-only. Does not modify season, fixtures or save. Hook via sync(state) in app render.
const API={sync,open,close,model,renderEmbedded,setTab,setRound};
let current=null, visible=false, tab='overview', round='all', scrollY=0;
function escape(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function club(s,id){const c=(s?.globalFootball?.clubs||[]).find(x=>x.id===id)||(s?.clubs||[]).find(x=>x.id===id);return c?.name||c?.shortName||id;}
function model(s){
 const ed=s?.continental?.editions?.['ucl:'+s.season];
 if(!ed)return {available:false,season:s?.season,reason:'A Champions ainda nao foi inicializada nesta temporada.'};
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
function style(){return `<style id="pl-ucl-css">


.pl-ucl-embedded *{box-sizing:border-box}.pl-ucl-embedded button,.pl-ucl-embedded select{font:inherit;cursor:pointer}
.pl-ucl-wrap{max-width:1260px;margin:32px auto;padding:0 22px 70px}
.pl-ucl-header{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:24px 28px;background:linear-gradient(120deg,#11286a,#0a1232);border:1px solid #324a82;border-radius:18px}
.pl-ucl-kicker{font-size:11px;letter-spacing:.22em;color:#9ec2ff;font-weight:800}.pl-ucl-header h1{margin:6px 0;font-size:clamp(23px,3vw,37px);color:white}.pl-ucl-muted{color:#aebddd}
.pl-ucl-close{border:1px solid #6075aa;color:white;background:#101f49;padding:10px 14px;border-radius:9px}
.pl-ucl-nav{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0}.pl-ucl-nav button{border:1px solid #2f426e;padding:10px 15px;border-radius:9px;background:#111c3a;color:#c9d6f0}.pl-ucl-nav button.active{background:#214ba5;color:white;border-color:#5089e9}
.pl-ucl-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:12px;margin:20px 0}.pl-ucl-stat,.pl-ucl-card{background:#101b35;border:1px solid #2d3a59;border-radius:13px;padding:17px}.pl-ucl-stat strong{display:block;font-size:29px;color:#fff;margin-top:6px}
.pl-ucl-grid{display:grid;grid-template-columns:1.4fr 1fr;gap:16px}.pl-ucl-card h2{margin:0 0 15px;color:#fff;font-size:19px}
.pl-ucl-table{border-collapse:collapse;width:100%;font-size:12px}.pl-ucl-table th{text-align:left;color:#9fb1d3;font-weight:600;border-bottom:1px solid #334464;padding:10px 6px}.pl-ucl-table td{padding:9px 6px;border-bottom:1px solid #24324d}.pl-ucl-table tr.hero{background:#243a68}.pl-ucl-table td:nth-child(n+3),.pl-ucl-table th:nth-child(n+3){text-align:right}.pl-ucl-rank{display:inline-flex;width:22px;height:22px;align-items:center;justify-content:center;background:#25334c;border-radius:6px}.pl-ucl-rank.direct{background:#176b54}.pl-ucl-rank.playoff{background:#846021}
.pl-ucl-fixture{display:grid;grid-template-columns:70px 1fr 35px 1fr 70px;gap:7px;align-items:center;padding:12px 6px;border-bottom:1px solid #293751}.pl-ucl-fixture .home{text-align:right}.pl-ucl-fixture .away{text-align:left}.pl-ucl-fixture .score{text-align:center;font-weight:800;color:#fff}.pl-ucl-hero{background:#213b69;border-radius:7px}.pl-ucl-pill{font-size:11px;color:#b9cbeb}.pl-ucl-filter{padding:9px 12px;border-radius:8px;background:#152b56;color:white;border:1px solid #3d5d95;max-width:100%}
.pl-ucl-bracket{display:grid;grid-template-columns:repeat(5,minmax(165px,1fr));gap:12px;overflow-x:auto;padding-bottom:12px}.pl-ucl-stage{min-width:165px}.pl-ucl-pair{border:1px solid #2b3e64;background:#152343;border-radius:10px;padding:12px;margin:8px 0}.pl-ucl-stage h3{font-size:14px;margin:0 0 12px;color:#a9c5ff}.pl-ucl-pair div{padding:4px 0}.pl-ucl-win{color:#8bf0c1;font-weight:700}.pl-ucl-empty{padding:30px;color:#b3c3df;text-align:center}.pl-ucl-badge{font-size:11px;padding:4px 8px;background:#20385e;border-radius:7px;color:#c8dcfa}
@media(max-width:800px){.pl-ucl-grid{grid-template-columns:1fr}.pl-ucl-wrap{margin:10px auto;padding:0 10px 65px}.pl-ucl-header{padding:18px}.pl-ucl-table{font-size:11px}.pl-ucl-bracket{display:flex;overflow-x:auto}.pl-ucl-stage{min-width:215px}}

.pl-ucl-embedded{background:linear-gradient(155deg,#071522,#0c1420 75%);color:#e9f0fb;border:1px solid #26374b;border-radius:16px;min-height:540px;font:14px system-ui}
.pl-ucl-embedded *{box-sizing:border-box}
.pl-ucl-embedded button,.pl-ucl-embedded select{font:inherit;cursor:pointer}
.pl-ucl-embedded .pl-ucl-wrap{max-width:1400px;margin:0 auto;padding:20px 24px 50px}
.pl-ucl-embedded .pl-ucl-header{background:linear-gradient(120deg,#112846,#091827);border-color:#27485c}
.pl-ucl-embedded .pl-ucl-nav button.active{background:#127d80;border-color:#3bd0d1;color:#fff}
.pl-ucl-embedded .pl-ucl-stat,.pl-ucl-embedded .pl-ucl-card{background:#0e1e2b;border-color:#29404c}
.pl-ucl-embedded .pl-ucl-fixture{grid-template-columns:65px minmax(0,1fr) 38px minmax(0,1fr) 64px}
@media(max-width:800px){.pl-ucl-embedded .pl-ucl-wrap{padding:12px}.pl-ucl-embedded .pl-ucl-fixture{font-size:11px;grid-template-columns:48px minmax(0,1fr) 28px minmax(0,1fr) 48px}}
</style>`;}
function tieNote(s,t){if(!t)return '';const n=id=>escape(club(s,id)),a=t.aggregate||[0,0],parts=[`Agregado ${a[0]}–${a[1]}`];if(t.extraTime)parts.push(`prorrogação ${t.extraTime[0]}–${t.extraTime[1]}`);if(t.penalties)parts.push(`pênaltis ${t.penalties.score[0]}–${t.penalties.score[1]}`);return `${parts.join(' · ')} · ${n(t.winnerId)} avança${t.decidedBy==='penalties'?' nos pênaltis':t.decidedBy==='extra_time'?' na prorrogação':''}`;}
function fixture(s,m){const hero=[m.homeId,m.awayId].includes(s.clubId);return `<div class="pl-ucl-fixture ${hero?'pl-ucl-hero':''}"><span class="pl-ucl-pill">Dia ${escape(m.day)}</span><span class="home">${escape(club(s,m.homeId))}</span><span class="score">${m.played?escape(m.hg)+' – '+escape(m.ag):'×'}</span><span class="away">${escape(club(s,m.awayId))}</span><span class="pl-ucl-pill">${m.played?'Final':'Pendente'}</span></div>`;}
function table(s,m,limit=36){return `<div style="overflow-x:auto"><table class="pl-ucl-table"><thead><tr><th>#</th><th>Clube</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th><th>PTS</th></tr></thead><tbody>${m.rankings.slice(0,limit).map((r,i)=>`<tr class="${r.id===s.clubId?'hero':''}"><td><span class="pl-ucl-rank ${i<8?'direct':i<24?'playoff':''}">${i+1}</span></td><td>${escape(club(s,r.id))}</td><td>${r.played??((r.w||0)+(r.d||0)+(r.l||0))}</td><td>${r.w||0}</td><td>${r.d||0}</td><td>${r.l||0}</td><td>${r.gd||0}</td><td><b>${r.p||0}</b></td></tr>`).join('')}</tbody></table></div>`;}
function allMatches(m){return [...m.games,...(m.knockout?.stages||[]).flatMap(x=>x.matches||[])];}
function stageView(s,m){const names={playoffs:'Playoffs',round16:'Oitavas de final',quarters:'Quartas de final',semis:'Semifinais',final:'Final'};const keys=['playoffs','round16','quarters','semis','final'];return `<div class="pl-ucl-card"><h2>Chave eliminatória</h2><div class="pl-ucl-bracket">${keys.map(k=>{const st=m.knockout?.stages?.find(x=>x.key===k);const pairs=new Map();for(const match of st?.matches||[]){if(!pairs.has(match.pair))pairs.set(match.pair,[]);pairs.get(match.pair).push(match)}return `<div class="pl-ucl-stage"><h3>${names[k]}</h3>${st?Array.from(pairs.values()).map(ms=>{const first=ms[0],winner=st.winners?.find(id=>[first.homeId,first.awayId].includes(id));return `<div class="pl-ucl-pair"><div class="${winner===first.homeId?'pl-ucl-win':''}">${escape(club(s,first.homeId))}</div><div class="${winner===first.awayId?'pl-ucl-win':''}">${escape(club(s,first.awayId))}</div><small class="pl-ucl-muted">${ms.map(x=>x.played?`${x.hg}-${x.ag}`:'A disputar').join(' · ')}</small>${first.tie&&first.tie.decidedBy!=='aggregate'?`<small class="pl-ucl-tie">${tieNote(s,first.tie)}</small>`:''}</div>`}).join(''):'<div class="pl-ucl-empty">A definir</div>'}</div>`}).join('')}</div></div>`;}
function body(s,m){if(!m.available)return `<div class="pl-ucl-card pl-ucl-empty">${escape(m.reason)}</div>`;
 if(!m.scheduled)return `<div class="pl-ucl-card"><h2>Temporada ${escape(m.season)} · calendário não registrado</h2><p class="pl-ucl-muted">Esta carreira foi carregada depois das primeiras datas da Champions. Para preservar a história, nenhum placar anterior será inventado. A próxima temporada terá seus 144 jogos preparados automaticamente na virada do ano, com base nos classificados.</p><p class="pl-ucl-muted">A lista atual de inscritos é provisória; ainda não há jogos ou classificação válida nesta edição.</p><div class="pl-ucl-stats"><div class="pl-ucl-stat"><span>Clubes previstos</span><strong>${escape(m.ed.entrants?.length||0)}</strong></div><div class="pl-ucl-stat"><span>Partidas efetivas</span><strong>0</strong></div></div></div>`;
 const matches=allMatches(m), own=matches.filter(x=>[x.homeId,x.awayId].includes(s.clubId)).sort((a,b)=>a.day-b.day); const next=own.find(x=>!x.played&&x.day>=s.day);
 const stats=`<div class="pl-ucl-stats"><div class="pl-ucl-stat"><span class="pl-ucl-muted">Fase de liga</span><strong>${m.played}/144</strong></div><div class="pl-ucl-stat"><span class="pl-ucl-muted">Participantes</span><strong>36</strong></div><div class="pl-ucl-stat"><span class="pl-ucl-muted">Sua participação</span><strong style="font-size:20px">${m.hero?'Classificado':'Não classificado'}</strong></div><div class="pl-ucl-stat"><span class="pl-ucl-muted">Campeão</span><strong style="font-size:18px">${m.knockout?.championId?escape(club(s,m.knockout.championId)):'A definir'}</strong></div></div>`;
 if(tab==='standings')return stats+`<div class="pl-ucl-card"><h2>Classificação • 36 equipes</h2><p class="pl-ucl-muted">1º–8º: oitavas diretas · 9º–24º: playoffs · 25º–36º: eliminados</p>${table(s,m)}</div>`;
 if(tab==='fixtures')return stats+`<div class="pl-ucl-card"><h2>Jogos e resultados</h2><label for="pl-ucl-round">Filtrar fase: </label> <select class="pl-ucl-filter" id="pl-ucl-round"><option value="all">Todas</option>${Array.from({length:8},(_,i)=>`<option value="${i+1}" ${round===String(i+1)?'selected':''}>Rodada ${i+1}</option>`).join('')}<option value="ko" ${round==='ko'?'selected':''}>Mata-mata</option></select><div>${matches.filter(x=>round==='all'||(round==='ko'?!!x.stage:String(x.round)===round)).sort((a,b)=>a.day-b.day).map(x=>fixture(s,x)).join('')||'<div class="pl-ucl-empty">Nenhuma partida</div>'}</div></div>`;
 if(tab==='bracket')return stats+stageView(s,m);
 if(tab==='club')return stats+`<div class="pl-ucl-card"><h2>Campanha de ${escape(club(s,s.clubId))}</h2>${!m.hero?'<p>Seu clube não se classificou nesta edição.</p>':own.map(x=>fixture(s,x)).join('')}</div>`;
 return stats+`<div class="pl-ucl-grid"><div class="pl-ucl-card"><h2>Classificação da fase de liga</h2>${table(s,m,12)}<p class="pl-ucl-muted">Veja os 36 clubes na aba Classificação.</p></div><div><div class="pl-ucl-card"><h2>Próximo compromisso</h2>${next?fixture(s,next):'<p class="pl-ucl-muted">Nenhuma partida futura cadastrada.</p>'}</div><div class="pl-ucl-card" style="margin-top:15px"><h2>Últimos resultados</h2>${matches.filter(x=>x.played).sort((a,b)=>b.day-a.day).slice(0,6).map(x=>fixture(s,x)).join('')||'<p class="pl-ucl-muted">Ainda sem partidas.</p>'}</div></div></div>`;
}
function renderEmbedded(s){
 current=s;
 const m=model(s);
 const names={overview:'Visão geral',standings:'Classificação',fixtures:'Jogos',bracket:'Mata-mata',club:'Meu clube'};
 const heading=`<div class="pl-ucl-header"><div><div class="pl-ucl-kicker">TEMPORADA · COMPETIÇÕES UEFA</div><h1>UEFA CHAMPIONS LEAGUE</h1><div class="pl-ucl-muted">Temporada ${escape(m.season)} · ${m.available&&m.scheduled?`${m.played}/144 jogos da fase de liga`:'Sem jogos registrados nesta edição'}</div></div><div class="pl-ucl-badge">PRO-LIFE</div></div>`;
 const navigation=`<nav class="pl-ucl-nav" aria-label="Seções da Champions">${Object.entries(names).map(([k,n])=>`<button type="button" data-pl-ucl-tab="${k}" class="${tab===k?'active':''}" aria-pressed="${tab===k}">${n}</button>`).join('')}</nav>`;
 return style()+`<section id="pl-ucl-embedded" class="pl-ucl-embedded"><div class="pl-ucl-wrap">${heading}${navigation}${body(s,m)}</div></section>`;
}
function setTab(value){if(['overview','standings','fixtures','bracket','club'].includes(value))tab=value;}
function setRound(value){round=String(value||'all');}
function sync(s){current=s;}
function open(){ /* UI integrada: navegar por TEMPORADA > Champions League */ }
function close(){ /* nao ha sobreposicao para fechar */ }
root.ProLifeChampionsUI=API;
if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof globalThis!=='undefined'?globalThis:this);
