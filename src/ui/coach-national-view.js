(function(root){
  "use strict";
  // Tela "Seleção" do modo treinador: convites, candidatura, convocação, formação, calendário e resultados.
  const ui={tab:null,page:{players:0,nations:0,fixtures:0,results:0,cup:0,tour:0,qtable:0,qgames:0},pos:"TODOS",confirmLeave:false};
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const CN=()=>root.ProLifeCoachNational||(typeof require==="function"?require("../domain/coach-national.js"):null);
  const isPhone=()=>{try{return !!root.ProLifeMobileSM27?.isPhone?.();}catch(e){return false;}};
  const SIZE=()=>isPhone()?(()=>{const tall=(root.innerHeight||0)>=380;return {players:tall?4:3,nations:tall?4:3,fixtures:tall?4:3,results:tall?4:3};})():{players:12,nations:10,fixtures:8,results:8};
  const POS_LABEL={GOL:"Goleiros",DEF:"Defensores",MEI:"Meio-campistas",ATA:"Atacantes"};
  const flag=(code,name)=>{try{const h=root.ProLifeNationalCrests?.inline?.(code||name,"sm");if(h)return h;}catch(e){}return `<span class="cn-code">${esc(code||"?")}</span>`;};
  const crest=(code,name)=>{try{const h=root.ProLifeNationalCrests?.render?.(code||name,{size:"lg"});if(h&&String(h).startsWith("<"))return h;}catch(e){}return `<span class="cn-code big">${esc(code||"?")}</span>`;};

  function css(){return `<style>
.cn{--cn-bg:#0f1720;--cn-card:#16212d;--cn-line:#26364a;--cn-text:#e9eef5;--cn-mut:#92a3b8;--cn-grass:#3ec28f;--cn-gold:#e5b94e;--cn-red:#e5655a;color:var(--cn-text)}
.cn *{box-sizing:border-box}
.cn-head{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:14px;background:linear-gradient(120deg,#16303a,#101a26 62%);border:1px solid var(--cn-line);margin-bottom:10px}
.cn-head .big{width:54px;height:54px;display:grid;place-items:center;border-radius:12px;background:var(--cn-card);font-weight:800}
.cn-head h2{margin:0;font-size:20px;line-height:1.15}.cn-head p{margin:2px 0 0;color:var(--cn-mut);font-size:12.5px}
.cn-head .grow{flex:1;min-width:0}.cn-meter{min-width:96px;text-align:right}.cn-meter b{display:block;font-size:26px;line-height:1}.cn-meter small{color:var(--cn-mut);font-size:11px}
.cn-sub{display:flex;gap:6px;margin:0 0 10px;flex-wrap:wrap}
.cn-sub button{border:1px solid var(--cn-line);background:transparent;color:var(--cn-mut);border-radius:999px;padding:6px 14px;font:inherit;font-size:12.5px;font-weight:600;cursor:pointer}
.cn-sub button.on{background:var(--cn-grass);border-color:var(--cn-grass);color:#06231a}
.cn-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}
.cn-card{background:var(--cn-card);border:1px solid var(--cn-line);border-radius:12px;padding:12px 14px;min-width:0}
.cn-card>small{display:block;color:var(--cn-mut);font-size:11px;margin-bottom:6px;font-weight:600}
.cn-card h3{margin:0 0 4px;font-size:15px}.cn-card p{margin:4px 0;color:var(--cn-mut);font-size:12.5px;line-height:1.4}
.cn-rec{display:flex;gap:14px}.cn-rec div{text-align:center}.cn-rec b{display:block;font-size:22px}.cn-rec small{color:var(--cn-mut);font-size:11px}
.cn-bar{height:7px;border-radius:99px;background:#0b121a;overflow:hidden;margin-top:8px}.cn-bar i{display:block;height:100%;background:var(--cn-grass)}.cn-bar.warn i{background:var(--cn-gold)}.cn-bar.bad i{background:var(--cn-red)}
.cn-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:8px 2px;border-bottom:1px solid var(--cn-line)}
.cn-row:last-of-type{border-bottom:0}
.cn-row .who{display:flex;align-items:center;gap:9px;min-width:0}.cn-row .who>span:last-child{min-width:0}
.cn-row b{display:block;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cn-row small{color:var(--cn-mut);font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
.cn-row .end{display:flex;align-items:center;gap:8px}
.cn-pl{display:grid;grid-template-columns:34px minmax(0,1fr) auto auto;gap:9px;align-items:center;padding:7px 2px;border-bottom:1px solid var(--cn-line)}
.cn-ovr{width:34px;height:30px;border-radius:7px;display:grid;place-items:center;font-weight:800;font-size:14px;background:#0b121a;border:1px solid var(--cn-line)}
.cn-ovr.hi{color:var(--cn-gold);border-color:#6b5a28}
.cn-tag{font-size:10.5px;border:1px solid var(--cn-line);border-radius:999px;padding:2px 8px;color:var(--cn-mut);white-space:nowrap}.cn-tag.ok{color:var(--cn-grass);border-color:var(--cn-grass)}.cn-tag.no{color:var(--cn-red);border-color:var(--cn-red)}.cn-tag.st{color:var(--cn-gold);border-color:#6b5a28}
.cn-btn{border:1px solid var(--cn-line);background:var(--cn-card);color:var(--cn-text);border-radius:9px;padding:6px 12px;font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;white-space:nowrap}
.cn-btn.go{background:var(--cn-grass);border-color:var(--cn-grass);color:#06231a}.cn-btn.danger{color:var(--cn-red);border-color:#6b2c28}.cn-btn:disabled{opacity:.4;cursor:default}
.cn-tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px}.cn-tools select{background:var(--cn-card);color:var(--cn-text);border:1px solid var(--cn-line);border-radius:9px;padding:6px 8px;font:inherit;font-size:12.5px}
.cn-chips{display:flex;gap:5px;flex-wrap:wrap}.cn-chips button{border:1px solid var(--cn-line);background:transparent;color:var(--cn-mut);border-radius:999px;padding:3px 10px;font:inherit;font-size:11.5px;cursor:pointer}.cn-chips button.on{color:var(--cn-text);border-color:var(--cn-grass)}
.cn-pager{display:flex;align-items:center;justify-content:center;gap:12px;margin:8px 0 0}.cn-pager span{color:var(--cn-mut);font-size:11.5px}.cn-pager button{border:1px solid var(--cn-line);background:var(--cn-card);color:var(--cn-text);border-radius:999px;min-width:34px;min-height:26px;font-size:15px;cursor:pointer}.cn-pager button:disabled{opacity:.35;cursor:default}
.cn-res{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:6px;font-weight:800;font-size:12px;color:#fff}.cn-res.V{background:#2c9b6e}.cn-res.E{background:#8a97a6}.cn-res.D{background:#c4544b}
.cn-code{display:inline-grid;place-items:center;min-width:26px;height:20px;padding:0 4px;border-radius:5px;background:#0b121a;border:1px solid var(--cn-line);font-size:10px;font-weight:800}
.cn-note{color:var(--cn-mut);font-size:12.5px;margin:8px 0}
.cn-empty{padding:18px 8px;text-align:center;color:var(--cn-mut);font-size:13px}
@media (orientation:landscape) and (min-width:568px) and (max-width:1024px) and (max-height:560px){
  #app .cn-head{padding:5px 9px!important;gap:8px!important;margin:0 0 4px!important;min-height:0!important}
  #app .cn-head .big,#app .cn-head img,#app .cn-head svg{width:30px!important;height:30px!important;font-size:11px!important}
  #app .cn-head h2{font-size:14px!important;margin:0!important}#app .cn-head h2:before{display:none!important}#app .cn-head p{font-size:10px!important;margin:0!important}#app .cn-meter{min-width:70px}#app .cn-meter b{font-size:17px!important}#app .cn-meter small{font-size:9px!important}
  #app .cn-sub{margin:0 0 4px!important;gap:3px!important;flex-wrap:nowrap!important;display:grid!important;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr)}
  #app .cn-sub button{padding:2px 6px!important;min-height:22px!important;height:22px!important;font-size:10px!important;min-width:0!important;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #app .cn-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:5px!important}
  #app .cn-card{padding:6px 8px!important;border-radius:9px!important}#app .cn-card>small{margin-bottom:2px!important;font-size:9px!important}#app .cn-card h3{font-size:12px!important;margin:0!important}#app .cn-card p{font-size:10px!important;margin:2px 0!important;line-height:1.3!important}
  #app .cn-rec b{font-size:15px!important}#app .cn-rec small{font-size:9px!important}#app .cn-bar{margin-top:4px!important;height:5px!important}
  #app .cn-pl{padding:2px 1px!important;gap:6px!important;grid-template-columns:26px minmax(0,1fr) auto auto!important}#app .cn-ovr{width:26px!important;height:22px!important;font-size:11px!important}
  #app .cn-pl b{font-size:11px!important}#app .cn-pl small{font-size:9px!important}
  #app .cn-row{padding:3px 1px!important}#app .cn-row b{font-size:11px!important}#app .cn-row small{font-size:9.5px!important}
  #app .cn-btn{padding:2px 8px!important;min-height:22px!important;height:22px!important;font-size:10px!important;border-radius:7px!important}
  #app .cn-tools{margin:0 0 3px!important;gap:5px!important}#app .cn-tools label{font-size:10px}#app .cn-tools select{padding:1px 4px!important;min-height:22px!important;height:22px!important;font-size:10px!important;width:auto!important}
  #app .cn-chips{gap:3px!important}#app .cn-chips button{padding:1px 8px!important;min-height:20px!important;height:20px!important;font-size:9.5px!important}
  #app .cn-pager{margin:2px 0 0!important;gap:8px!important}#app .cn-pager button{min-height:20px!important;height:20px!important;min-width:30px!important;font-size:13px!important;padding:0!important}#app .cn-pager span{font-size:10px!important}
  #app .cn-note{margin:2px 0!important;font-size:10px!important}#app .cn-tag{font-size:9px!important;padding:0 6px!important}#app .cn-empty{padding:8px 4px!important;font-size:10.5px!important}
  #app .cn-res{width:20px;height:20px;font-size:10px}
}
</style>`;}

  const pager=(key,total,size)=>{
    const pages=Math.max(1,Math.ceil(total/size));if(ui.page[key]>=pages)ui.page[key]=pages-1;if(ui.page[key]<0)ui.page[key]=0;
    if(pages<2)return "";
    const p=ui.page[key];
    return `<nav class="cn-pager" aria-label="Páginas"><button type="button" data-cn-page="${key}:${p-1}" ${p<=0?"disabled":""} aria-label="Página anterior">‹</button><span>${p+1} / ${pages}</span><button type="button" data-cn-page="${key}:${p+1}" ${p>=pages-1?"disabled":""} aria-label="Próxima página">›</button></nav>`;
  };
  const slice=(key,list,size)=>{const pages=Math.max(1,Math.ceil(list.length/size));if(ui.page[key]>=pages)ui.page[key]=pages-1;if(ui.page[key]<0)ui.page[key]=0;return list.slice(ui.page[key]*size,(ui.page[key]+1)*size);};

  function head(o){
    if(!o.team)return `<header class="cn-head"><div class="grow"><h2>Seleções</h2><p>Você não comanda nenhuma seleção. Candidate-se ou espere um convite da confederação.</p></div><div class="cn-meter"><b>${o.rep}</b><small>sua reputação</small></div></header>`;
    return `<header class="cn-head">${crest(o.team.code,o.team.name)}<div class="grow"><h2>Seleção de ${esc(o.team.name)}</h2><p>${esc(o.team.confederation||"")} · ${esc(o.formation)} · ${o.called}/${o.max} convocados</p></div><div class="cn-meter"><b>${o.board}%</b><small>confiança da confederação</small></div></header>`;
  }
  function tabsFor(o){return o.team?[["geral","Visão geral"],["convocacao","Convocação"],["elim","Eliminatórias"],["copa","Copa do Mundo"],["torneios","Torneios"],["calendario","Calendário"],["selecoes","Seleções"]]:[["convites","Convites"],["selecoes","Seleções"]];}

  function resultLine(m){
    return `<div class="cn-row"><div class="who"><span class="cn-res ${esc(m.result)}">${esc(m.result)}</span><span><b>${m.home?"":"@ "}${esc(m.opponent)} · ${m.gf} × ${m.ga}</b><small>Dia ${m.day} · ${esc(m.competition)}${m.scorers?.length?" · "+esc([...new Set(m.scorers.map(x=>x.name.split(" ").slice(-1)[0]))].join(", ")):""}</small></span></div></div>`;
  }
  function fixtureLine(m,day){
    const left=m.day-day;
    return `<div class="cn-row"><div class="who">${flag(m.opponentCode,m.opponent)}<span><b>${m.home?"":"@ "}${esc(m.opponent)}</b><small>${esc(m.competition)} · ${m.home?"em casa":"fora"}</small></span></div><div class="end"><span class="cn-tag">Dia ${m.day}${left>=0?` · em ${left}d`:""}</span></div></div>`;
  }

  function geral(o,S){
    const next=o.fixtures[0],r=o.record,boardTone=o.board<30?"bad":o.board<50?"warn":"";
    const scorers=(o.scorers||[]).map(x=>`<div class="cn-row"><div class="who"><span><b>${esc(x.name)}</b><small>${esc(x.pos)} · ${x.caps} jogos</small></span></div><div class="end"><span class="cn-tag ok">${x.goals} gols</span></div></div>`).join("")||'<p class="cn-note">Nenhum gol marcado ainda.</p>';
    const leave=ui.confirmLeave
      ?`<p class="cn-note">Deixar o cargo? Você só poderá assumir outra seleção depois de 60 dias.</p><button type="button" class="cn-btn danger" data-cn-act="resign">Confirmar saída</button> <button type="button" class="cn-btn" data-cn-act="leave-cancel">Cancelar</button>`
      :`<button type="button" class="cn-btn danger" data-cn-act="leave-ask">Deixar o cargo</button>`;
    return `<div class="cn-grid">
      <section class="cn-card"><small>PRÓXIMO JOGO</small>${next?`<h3>${next.home?"":"@ "}${esc(next.opponent)}</h3><p>${esc(next.competition)} · dia ${next.day} (em ${Math.max(0,next.day-o.day)} dias)</p><p>Força do seu time ${o.power} · adversário ${o.nations.find(n=>n.code===next.opponentCode)?.strength??"—"}</p>`:'<p class="cn-note">Sem jogos marcados.</p>'}</section>
      <section class="cn-card"><small>CAMPANHA</small><div class="cn-rec"><div><b>${r.v}</b><small>V</small></div><div><b>${r.e}</b><small>E</small></div><div><b>${r.d}</b><small>D</small></div><div><b>${r.gf}–${r.ga}</b><small>gols</small></div></div><div class="cn-bar ${boardTone}"><i style="width:${o.board}%"></i></div><p>Confiança da confederação: ${o.board}%. Abaixo de 15% o contrato é encerrado.</p></section>
      <section class="cn-card"><small>ARTILHEIROS</small>${scorers}</section>
      <section class="cn-card"><small>CARGO</small><p>Você acumula a seleção com o clube. Os jogos acontecem nas datas FIFA e usam a convocação e a formação que você definiu.</p>${leave}</section>
    </div>`;
  }

  function convocacao(o,S){
    const list=o.players.filter(p=>ui.pos==="TODOS"||p.pos===ui.pos).sort((a,b)=>Number(b.called)-Number(a.called)||b.overall-a.overall);
    const rows=slice("players",list,S.players).map(p=>`<div class="cn-pl"><span class="cn-ovr ${p.overall>=82?"hi":""}">${p.overall}</span><span><b style="display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.name)}</b><small style="color:var(--cn-mut);font-size:11px">${esc(p.pos)} · ${esc(p.club)} · ${p.age} anos${p.caps?` · ${p.caps} jogos`:""}</small></span><span>${p.starter?'<span class="cn-tag st">Titular</span>':p.called?'<span class="cn-tag ok">Convocado</span>':!p.available?'<span class="cn-tag no">Indisponível</span>':""}</span><button type="button" class="cn-btn ${p.called?"":"go"}" data-cn-toggle="${esc(p.id)}" ${!p.available&&!p.called?"disabled":""}>${p.called?"Dispensar":"Convocar"}</button></div>`).join("")||'<div class="cn-empty">Nenhum jogador nesta posição.</div>';
    return `<div class="cn-tools"><label>Formação <select data-cn-formation>${o.formations.map(f=>`<option ${f===o.formation?"selected":""}>${esc(f)}</option>`).join("")}</select></label><button type="button" class="cn-btn" data-cn-act="auto" ${o.manual?"":"disabled"}>Convocação automática</button><span class="cn-tag ${o.manual?"st":"ok"}">${o.manual?"Lista manual":"Automática"}</span><span class="cn-tag">${o.called}/${o.max}</span></div>
      <div class="cn-chips" role="group" aria-label="Filtrar por posição">${["TODOS","GOL","DEF","MEI","ATA"].map(p=>`<button type="button" class="${ui.pos===p?"on":""}" data-cn-pos="${p}">${p==="TODOS"?"Todos":esc(POS_LABEL[p])}</button>`).join("")}</div>
      <section class="cn-card" style="margin-top:8px;padding-top:4px">${rows}${pager("players",list.length,S.players)}</section>`;
  }

  function elim(o,S){
    const q=o.qual;
    if(!q||q.kind==="none")return `<section class="cn-card"><small>ELIMINATÓRIAS</small><div class="cn-empty">${esc(q?.note||"Sem eliminatórias em andamento.")}</div></section>`;
    if(q.kind==="allocation")return `<section class="cn-card"><small>ELIMINATÓRIAS · COPA ${q.year}</small><div class="cn-empty">${esc(q.note)}</div></section>`;
    const table=slice("qtable",q.table,(isPhone()?S.results:10)).map(r=>`<div class="cn-row" ${r.me?'style="color:var(--cn-gold)"':""}><div class="who"><span class="cn-code">${r.pos}</span><span><b>${esc(r.name)}</b><small>${r.j} jogos · saldo ${r.sg>0?"+":""}${r.sg}${r.zone?" · "+esc(r.zone):""}</small></span></div><div class="end"><span class="cn-tag ${r.me?"st":""}">${r.p} pts</span></div></div>`).join("");
    const status=q.complete?(q.qualified===true||(q.qualified&&!q.groupMode)?"Classificada para a Copa":q.groupMode?(q.qualified===false?"Eliminada das eliminatórias":q.playoff?"Na repescagem: o jogo decide a vaga":"Eliminada das eliminatórias"):q.playoff?"Na repescagem":"Eliminada"):`${q.directSpots} ${q.directSpots===1?"vaga direta":"vagas diretas"} + repescagem`;
    const games=slice("qgames",q.fixtures,S.results).map(m=>`<div class="cn-row"><div class="who"><span><b>${esc(m.home)} ${m.played?`${m.hg} × ${m.ag}`:"×"} ${esc(m.away)}</b><small>${typeof m.round==="number"?"Rodada "+m.round:esc(m.round)} · dia ${m.day}${m.played?"":" · a disputar"}</small></span></div></div>`).join("");
    return `<div class="cn-grid"><section class="cn-card"><small>${esc(q.title||"CLASSIFICAÇÃO")} · COPA ${q.year}</small>${table}${pager("qtable",q.table.length,(isPhone()?S.results:10))}<p class="cn-note">${esc(status)}</p></section><section class="cn-card"><small>SEUS JOGOS</small>${games}${pager("qgames",q.fixtures.length,S.results)}</section></div>`;
  }

  function torneios(o,S){
    const T=o.tours||{live:[],done:[]};
    const live=T.live.map(x=>`<div class="cn-row"><div class="who"><span><b>${esc(x.name)} ${x.year}</b><small>${x.playing?"Sua seleção participa":"Sua seleção não participa"}</small></span></div><div class="end"><span class="cn-tag ${x.playing?"st":""}">${x.playing?"Disputando":"Fora"}</span></div></div>`).join("")||'<div class="cn-empty">Nenhum torneio em andamento.</div>';
    const done=slice("tour",T.done,S.results).map(x=>`<div class="cn-row"><div class="who"><span><b>${esc(x.name)} ${x.year}</b><small>${esc(x.champion||"—")}${x.runnerUp?" · vice "+esc(x.runnerUp):""}</small></span></div>${x.mine?`<div class="end"><span class="cn-tag st">${esc(x.mine)}</span></div>`:""}</div>`).join("")||'<div class="cn-empty">Ainda sem edições encerradas.</div>';
    return `<div class="cn-grid"><section class="cn-card"><small>EM ANDAMENTO</small>${live}<p class="cn-note">Nestes torneios o resultado da sua seleção é simulado pelo mundo, sem convocação sua.</p></section><section class="cn-card"><small>CAMPEÕES</small>${done}${pager("tour",T.done.length,S.results)}</section></div>`;
  }

  function copa(o,S){
    const c=o.cup;
    if(!c||!c.available)return `<section class="cn-card"><small>COPA DO MUNDO</small><div class="cn-empty">${esc(c?.note||"Sem Copa do Mundo em andamento.")}</div></section>`;
    if(!c.qualified)return `<section class="cn-card"><small>COPA DO MUNDO ${c.year}</small><div class="cn-empty">${esc(c.note)}</div></section>`;
    const table=c.table.map(r=>`<div class="cn-row" ${r.me?'style="color:var(--cn-gold)"':""}><div class="who"><span class="cn-code">${r.pos}</span><span><b>${esc(r.name)}</b><small>${r.j} jogos · saldo ${r.sg>0?"+":""}${r.sg}</small></span></div><div class="end"><span class="cn-tag ${r.me?"st":""}">${r.p} pts</span></div></div>`).join("");
    const games=[...c.matches,...c.knockout];
    const rows=slice("cup",games,S.results).map(m=>`<div class="cn-row"><div class="who"><span><b>${esc(m.home)} ${m.played?`${m.hg} × ${m.ag}`:"×"} ${esc(m.away)}</b><small>${esc(m.phase)}${m.pens?" · "+esc(m.pens):""}${m.played?"":" · a disputar"}</small></span></div></div>`).join("")||'<div class="cn-empty">Sem jogos.</div>';
    return `<div class="cn-grid"><section class="cn-card"><small>GRUPO ${esc(c.group)} · COPA ${c.year}</small>${table}<p class="cn-note">${esc(c.phaseLabel||c.status)}</p></section><section class="cn-card"><small>JOGOS DA SUA SELEÇÃO</small>${rows}${pager("cup",games.length,S.results)}</section></div>`;
  }

  function calendario(o,S){
    const fx=slice("fixtures",o.fixtures,S.fixtures).map(m=>fixtureLine(m,o.day)).join("")||'<div class="cn-empty">Sem jogos marcados.</div>';
    const rs=slice("results",o.results,S.results).map(resultLine).join("")||'<div class="cn-empty">Nenhum jogo disputado ainda.</div>';
    return `<div class="cn-grid"><section class="cn-card"><small>PRÓXIMOS JOGOS</small>${fx}${pager("fixtures",o.fixtures.length,S.fixtures)}</section><section class="cn-card"><small>RESULTADOS</small>${rs}${pager("results",o.results.length,S.results)}</section></div>`;
  }

  function selecoes(o,S){
    const rows=slice("nations",o.nations,S.nations).map(n=>{
      const act=n.current?'<span class="cn-tag ok">Seu cargo</span>':o.team?'<span class="cn-tag">—</span>':n.eligible?`<button type="button" class="cn-btn go" data-cn-apply="${esc(n.code)}">Candidatar-se</button>`:`<span class="cn-tag no">Exige reputação ${n.need}</span>`;
      return `<div class="cn-row"><div class="who">${flag(n.code,n.name)}<span><b>${esc(n.name)}</b><small>${esc(n.confederation||"")} · força ${n.strength} · reputação ${n.need}+</small></span></div><div class="end">${act}</div></div>`;
    }).join("");
    return `<section class="cn-card"><small>SELEÇÕES DISPONÍVEIS</small>${rows}${pager("nations",o.nations.length,S.nations)}${o.team?'<p class="cn-note">Para trocar de seleção, deixe o cargo atual na Visão geral.</p>':""}</section>`;
  }

  function convites(o,S){
    const offers=o.offers.map(of=>`<div class="cn-row"><div class="who">${flag(of.code,of.name)}<span><b>${esc(of.name)}</b><small>Responder até o dia ${of.expires} (${Math.max(0,of.expires-o.day)} dias)</small></span></div><div class="end"><button type="button" class="cn-btn go" data-cn-accept="${esc(of.code)}">Aceitar</button><button type="button" class="cn-btn" data-cn-decline="${esc(of.code)}">Recusar</button></div></div>`).join("");
    const wait=o.day<o.cooldownUntil?`<p class="cn-note">A confederação só aceita novos treinadores a partir do dia ${o.cooldownUntil}.</p>`:"";
    return `<div class="cn-grid"><section class="cn-card"><small>CONVITES RECEBIDOS</small>${offers||'<div class="cn-empty">Nenhum convite no momento.<br>Convites chegam a cada ~2 meses quando a sua reputação alcança a de alguma seleção.</div>'}${wait}</section><section class="cn-card"><small>COMO FUNCIONA</small><p>Cada seleção exige uma reputação mínima (você tem ${o.rep}). Ganhe jogos com o clube e com a seleção para subir.</p><p>Os jogos acontecem nas 4 janelas FIFA do ano. A confiança da confederação cai com derrotas; abaixo de 15% você é demitido.</p></section></div>`;
  }

  function render(s,D){
    const C=CN();if(!s||!C)return `<section class="card"><h2>Seleção</h2><p class="muted">Módulo indisponível.</p></section>`;
    let o;try{o=C.overview(s,D);}catch(e){return `<section class="card"><h2>Seleção</h2><p class="muted">Não foi possível carregar: ${esc(e.message)}</p></section>`;}
    if(!o)return "";
    const tabs=tabsFor(o);
    if(!tabs.some(([id])=>id===ui.tab))ui.tab=tabs[0][0];
    const S=SIZE();
    const body=ui.tab==="geral"?geral(o,S):ui.tab==="convocacao"?convocacao(o,S):ui.tab==="calendario"?calendario(o,S):ui.tab==="copa"?copa(o,S):ui.tab==="torneios"?torneios(o,S):ui.tab==="elim"?elim(o,S):ui.tab==="selecoes"?selecoes(o,S):convites(o,S);
    const badge=!o.team&&o.offers.length?` <i>${o.offers.length}</i>`:"";
    return `${css()}<section class="cn" data-coach-national>${head(o)}<nav class="cn-sub" aria-label="Seções da seleção">${tabs.map(([id,l])=>`<button type="button" class="${ui.tab===id?"on":""}" data-cn-tab="${id}">${esc(l)}${id==="convites"?badge:""}</button>`).join("")}</nav>${body}</section>`;
  }

  const api={render,state:ui,setTab(t){ui.tab=t;ui.confirmLeave=false;},setPage(key,n){if(key in ui.page)ui.page[key]=Math.max(0,Number(n)||0);},setPos(p){ui.pos=p;ui.page.players=0;},setConfirmLeave(v){ui.confirmLeave=!!v;}};
  root.ProLifeCoachNationalView=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
