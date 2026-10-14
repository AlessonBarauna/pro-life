(function(root){
  "use strict";
  // 34F.30A - Minha seleção: tela conduzida pela nacionalidade do protagonista.
  const TABS=[["geral","Visão geral"],["convocacao","Convocação"],["disputa","Disputa por posição"],["calendario","Calendário"],["competicoes","Competições"],["estatisticas","Estatísticas"],["historico","Histórico"]];
  const ui={tab:"geral",classic:false};
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const NI=()=>root.ProLifeNationalIdentity||(typeof require==="function"?require("../domain/national-identity.js"):null);
  const num=v=>Number.isFinite(Number(v))?Math.round(Number(v)):"—";
  const COMPS=[["Copa do Mundo","FIFA","worldCupSummary"],["Copa América","CONMEBOL","copaAmericaSummary"],["Eurocopa","UEFA","euroSummary"],["Liga das Nações UEFA","UEFA","nationsLeagueSummary"],["Copa Africana de Nações","CAF","afconSummary"],["Copa da Ásia","AFC","asianCupSummary"],["Copa Ouro","CONCACAF","goldCupSummary"],["Liga das Nações CONCACAF","CONCACAF","concacafNationsLeagueSummary"],["Copa das Nações da Oceania","OFC","ofcNationsCupSummary"],["Copa Árabe FIFA","FIFA","fifaArabCupSummary"],["FIFA Series","FIFA","fifaSeriesSummary"],["Finalíssima","FIFA","finalissimaSummary"]];
  function css(){return `<style>
.nh-dark{--nh-bg:#0e1318;--nh-card:#151c24;--nh-line:#232e3a;--nh-text:#e6ecf2;--nh-mut:#8a98a8;--nh-gold:#e0b84c;--nh-ok:#53c38b;background:var(--nh-bg);color:var(--nh-text);border-radius:14px;padding:22px}
.nh-dark h2{margin:0 0 4px}.nh-dark small{color:var(--nh-mut);letter-spacing:.08em;text-transform:uppercase;font-size:11px}
.nh-head{display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-bottom:14px}.nh-flag{width:64px;height:64px;border-radius:14px;background:var(--nh-card);border:1px solid var(--nh-line);display:grid;place-items:center;font-weight:800;font-size:20px;color:var(--nh-gold)}
.nh-tabs{display:flex;gap:6px;flex-wrap:wrap;border-bottom:1px solid var(--nh-line);margin:10px 0 16px}.nh-tabs button{background:transparent;border:0;color:var(--nh-mut);padding:9px 12px;cursor:pointer;border-bottom:2px solid transparent}.nh-tabs button.on{color:var(--nh-text);border-bottom-color:var(--nh-gold)}
.nh-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.nh-box{background:var(--nh-card);border:1px solid var(--nh-line);border-radius:12px;padding:12px 14px;margin-bottom:12px}.nh-box b{display:block;font-size:20px}
.nh-note{color:var(--nh-mut);font-size:13px;margin:6px 0}.nh-warn{border-color:var(--nh-gold)}
.nh-dark table{width:100%;border-collapse:collapse}.nh-dark th,.nh-dark td{text-align:left;padding:7px 8px;border-bottom:1px solid var(--nh-line);font-size:13px}.nh-dark tr.me td{color:var(--nh-gold);font-weight:700}
.nh-chip{display:inline-block;border:1px solid var(--nh-line);border-radius:999px;padding:2px 9px;font-size:11px;color:var(--nh-mut)}.nh-chip.ok{color:var(--nh-ok);border-color:var(--nh-ok)}
.nh-dark button.nh-act{background:transparent;border:1px solid var(--nh-line);color:var(--nh-text);border-radius:8px;padding:7px 12px;cursor:pointer}
.nh-pitch{display:grid;gap:8px}.nh-pitch div{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}.nh-pitch span{background:var(--nh-card);border:1px solid var(--nh-line);border-radius:8px;padding:5px 9px;font-size:12px}.nh-pitch span.me{border-color:var(--nh-gold)}
</style>`;}
  const tbl=(head,rows)=>`<div class="tablewrap"><table><thead><tr>${head.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
  function playerRow(p){return `<tr class="${p.hero?"me":""}"><td>${esc(p.name)}${p.hero?" · VOCÊ":""}</td><td>${esc(p.pos)}</td><td>${esc(p.club)}</td><td>${num(p.overall)}</td><td>${num(p.age)}</td></tr>`;}
  function matchLine(m,code){
    const home=m.homeId===code;const opp=home?m.away:m.home;
    let res="A disputar";
    if(m.played){res=`${num(m.homeGoals)} × ${num(m.awayGoals)}`;if(m.homeGoals===m.awayGoals&&m.winnerId)res+=` · ${esc(m.winnerId===code?"avançou":"eliminado")} nos pênaltis`;}
    return `<tr><td>${esc(m.round?`Rodada ${m.round}`:(m.phaseLabel||m.phase||"Mata-mata"))}</td><td>${(root.ProLifeNationalCrests?root.ProLifeNationalCrests.inline(m.homeId||m.home,"sm"):"")}${esc(m.home)} × ${(root.ProLifeNationalCrests?root.ProLifeNationalCrests.inline(m.awayId||m.away,"sm"):"")}${esc(m.away)}</td><td>${res}</td></tr>`;
  }
  function unavailable(P){
    return `<section class="nh-box nh-warn"><small>SELEÇÃO NÃO DISPONÍVEL</small><h2>${esc(P.team.name||"Nacionalidade não informada")}</h2><p>${esc(P.team.reason)}</p><p class="nh-note">Sua nacionalidade real foi preservada. O PRO-LIFE não substitui por outra seleção.</p></section>`;
  }
  function body(s,D,P,tab){
    const NIm=NI(),t=P.team,code=t.code;
    if(tab==="geral"){
      const wc=NIm.worldCupOf(s,D,t);
      const comp=P.competition;
      return `<div class="nh-grid"><div class="nh-box"><small>GER</small><b>${num(P.hero.overall)}</b></div><div class="nh-box"><small>Posição</small><b>${esc(P.hero.pos||"—")}</b></div><div class="nh-box"><small>Reputação</small><b>${num(P.hero.reputation)}</b></div><div class="nh-box"><small>Moral</small><b>${num(P.hero.morale)}</b></div></div>
      <div class="nh-box ${P.callupSimulated?"":"nh-warn"}"><small>CONVOCAÇÃO</small><b>${esc(P.callup)}</b>${P.callupSimulated?`<p class="nh-note">Próxima janela: dia ${esc(P.nextWindow==null?"a definir":P.nextWindow)}.</p>`:`<p class="nh-note">A convocação de ${esc(t.name)} é avaliada a cada Data FIFA (calendário de referência do PRO-LIFE) com GER, forma, lesões e concorrência. Nada é concedido automaticamente.</p>`}</div>
      <div class="nh-box"><small>DISPUTA NA SUA POSIÇÃO</small><b>${comp.rank?`${comp.rank}º de ${comp.total}`:"—"}</b><p class="nh-note">Ranking por GER entre os jogadores disponíveis de ${esc(t.name)} na sua posição.</p></div>
      <div class="nh-box"><small>COPA DO MUNDO ${esc(wc&&wc.year||"")}</small>${wc&&wc.qualified?`<b>Grupo ${esc(wc.group)} · ${esc(wc.phase)}</b><p class="nh-note">${esc(t.name)}: ${num(wc.row&&wc.row.played)} jogo(s), ${num(wc.row&&wc.row.points)} ponto(s).</p>`:`<p class="nh-note">${esc(wc&&wc.note||"Sem dados da Copa.")}</p>`}</div>`;
    }
    if(tab==="convocacao"){
      const q=NIm.squad(s,D,t);
      if(!q.squad.length)return `<div class="nh-box nh-warn"><small>SEM ATLETAS ELEGÍVEIS</small><p>${esc(q.note||`Nenhum atleta elegível de ${t.name} no catálogo.`)}</p></div>`;
      const line=pos=>`<div>${q.starters.filter(p=>p.pos===pos).map(p=>`<span class="${p.hero?"me":""}">${esc(p.name)} · ${num(p.overall)}</span>`).join("")}</div>`;
      const row=p=>`<tr class="${p.hero?"me":""}"><td>${esc(p.name)}${p.hero?" · VOCÊ":""}</td><td>${esc(p.pos)}</td><td>${esc(p.club)}</td><td>${num(p.overall)}</td><td>${num(p.age)}</td></tr>`;
      const head=["Jogador","Pos.","Clube","GER","Idade"];
      const CVp=root.ProLifeCallupView?root.ProLifeCallupView.panel(s,D):"";
      const CVo=root.ProLifeCallupView?root.ProLifeCallupView.official(s,D):"";
      return `${CVp?`<div class="nh-grid">${CVp}</div>`:""}${CVo}<div class="nh-grid"><div class="nh-box"><small>Elegíveis</small><b>${num(q.eligibleCount)}</b></div><div class="nh-box"><small>Disponíveis</small><b>${num(q.availableCount)}</b></div><div class="nh-box"><small>Pré-lista</small><b>${num(q.preList.length)}</b></div><div class="nh-box"><small>Elenco-base</small><b>${num(q.squad.length)}</b></div></div>
      ${q.note?`<div class="nh-box nh-warn"><p>${esc(q.note)}</p></div>`:""}
      <div class="nh-box"><small>ESCALAÇÃO DE REFERÊNCIA ${esc(q.formation)}</small><div class="nh-pitch">${["ATA","MEI","DEF","GOL"].map(line).join("")}</div><p class="nh-note"><b>${q.starters.length}</b> titulares · <b>${q.bench.length}</b> reservas${q.complete?"":" · escalação incompleta: faltam atletas reais na posição"}. ${esc(q.nationPool)}.</p>${P.callupSimulated?"":`<p class="nh-note">Elenco-base de referência; a convocação oficial de cada janela aparece no painel acima quando a lista é anunciada.</p>`}</div>
      <details class="nh-box"><summary>Pré-lista acompanhada pelo técnico (${q.preList.length})</summary>${tbl(head,q.preList.map(row))}</details>
      <details class="nh-box"><summary>Reservas do elenco-base (${q.bench.length})</summary>${tbl(head,q.bench.map(row))}</details>`;
    }
    if(tab==="disputa"){
      const c=P.competition;
      return `<p class="nh-note">Jogadores de ${esc(t.name)} na posição ${esc(c.pos||P.hero.pos)}, por GER. Você está em <b>${c.rank?c.rank+"º":"—"}</b> entre ${c.total}.</p>${tbl(["#","Jogador","Pos.","Clube","GER","Idade"],c.rows.map(r=>`<tr class="${r.hero?"me":""}"><td>${r.rank}</td><td>${esc(r.name)}${r.hero?" · VOCÊ":""}</td><td>${esc(r.pos)}</td><td>${esc(r.club)}</td><td>${num(r.overall)}</td><td>${num(r.age)}</td></tr>`))}`;
    }
    if(tab==="calendario"){
      const wc=NIm.worldCupOf(s,D,t);
      let out="";
      if(wc&&wc.qualified){
        out+=`<h3>Copa do Mundo ${esc(wc.year)} · Grupo ${esc(wc.group)}</h3>${tbl(["#","Seleção","J","V","E","D","SG","Pts"],wc.table.map((r,i)=>`<tr class="${r.id===code?"me":""}"><td>${i+1}</td><td>${(root.ProLifeNationalCrests?root.ProLifeNationalCrests.inline(r.id||r.name,"sm"):"")}${esc(r.name)}</td><td>${num(r.played)}</td><td>${num(r.w)}</td><td>${num(r.d)}</td><td>${num(r.l)}</td><td>${num(r.gd)}</td><td>${num(r.points)}</td></tr>`))}<h3>Jogos de ${esc(t.name)}</h3>${tbl(["Fase","Jogo","Resultado"],[...wc.matches,...wc.knockout].map(m=>matchLine(m,code)))}`;
      }else out+=`<p class="nh-note">${esc(wc&&wc.note||"Sem calendário da Copa para esta seleção.")}</p>`;
      out+=`<p class="nh-note">${(root.ProLifeCallupView&&root.ProLifeCallupView.calendar)?root.ProLifeCallupView.calendar(s,D):""}Confrontos de amistosos, eliminatórias e torneios de confederação de ${esc(t.name)} não são simulados; nenhuma partida foi inventada.</p>`;
      return out;
    }
    if(tab==="competicoes"){
      const rows=COMPS.map(([name,conf,fn])=>{let ed=null;try{const r=D.NationalTeam[fn]&&D.NationalTeam[fn](s);ed=r&&r.year||null;}catch(e){}
        const mine=conf===t.confederation||conf==="FIFA";
        return `<tr><td>${esc(name)}</td><td>${esc(conf)}</td><td><span class="nh-chip ok">Simulada pelo motor</span>${ed?` <span class="nh-chip">edição ${esc(ed)}</span>`:""}</td><td>${mine?"Sim":"Outra confederação"}</td></tr>`;});
      return `<p class="nh-note">Confederação de ${esc(t.name)}: <b>${esc(t.confederation||"—")}</b>. A lista de participantes por seleção em cada torneio será conectada na 34F.30C.</p>${tbl(["Competição","Entidade","Situação","Sua confederação"],rows)}<p class="nh-note">A Copa do Mundo de Clubes é uma competição diferente e não aparece aqui.</p>`;
    }
    if(tab==="estatisticas"){
      const h=P.history;
      return `<div class="nh-grid"><div class="nh-box"><small>Jogos</small><b>${num(h.caps)}</b></div><div class="nh-box"><small>Gols</small><b>${num(h.goals)}</b></div><div class="nh-box"><small>Assistências</small><b>${num(h.assists)}</b></div><div class="nh-box"><small>Convocações</small><b>${num(h.callups)}</b></div></div>${P.callupSimulated?"":`<p class="nh-note">Você ainda não tem jogos por ${esc(t.name)}. Partidas só são registradas quando existe competição internacional simulada para a seleção (hoje: Brasil e Copa do Mundo); as convocações já contam.</p>`}`;
    }
    if(tab==="historico"){
      let hs=null;try{hs=D.NationalTeam.internationalHistorySummary(s);}catch(e){}
      const titles=((hs&&hs.worldCupTitles)||[]).find(x=>x.id===code);
      const line=(hs&&hs.timeline||[]).filter(e=>JSON.stringify(e).includes(code));
      return `<div class="nh-box"><small>TÍTULOS MUNDIAIS DE ${esc(t.name).toUpperCase()}</small><b>${titles?titles.titles:0}</b></div>${line.length?tbl(["Edição"],line.map(e=>`<tr><td>${esc(e.name||e.title||e.year||"Edição")}</td></tr>`)):`<p class="nh-note">Nenhuma edição simulada envolvendo ${esc(t.name)} neste save.</p>`}`;
    }
    return "";
  }
  function render(s,D){
    const NIm=NI();
    if(!s||!NIm)return `<section class="card"><h2>Seleção</h2><p class="muted">Módulo indisponível.</p></section>`;
    if(s.mode!=="player"){
      const c=NIm.coachTeam(s);
      return `${css()}<section class="nh-dark" data-national-hub><small>SELEÇÕES</small><h2>Carreira de treinador</h2><p class="nh-note">${esc(c.reason)}</p></section>`;
    }
    const P=NIm.profile(s,D),t=P.team;
    const tab=TABS.some(x=>x[0]===ui.tab)?ui.tab:"geral";
    const head=`<div class="nh-head"><div class="nh-flag">${(()=>{const h=root.ProLifeNationalCrests?root.ProLifeNationalCrests.render(t.code||t.name,{size:"lg"}):"";return h||esc(t.code||"?");})()}</div><div><small>MINHA SELEÇÃO</small><h2>${esc(t.represented?`Seleção de ${t.name}`:(t.name||"Sem nacionalidade"))}</h2><span class="nh-chip">Nacionalidade: ${esc(t.raw||"—")}</span> ${t.confederation?`<span class="nh-chip">${esc(t.confederation)}</span>`:""}</div></div>`;
    const classicBtn=t.code==="BRA"?`<div style="margin-top:14px"><button type="button" class="nh-act" data-nh-classic="1">Abrir visão completa da Seleção Brasileira</button></div>`:"";
    if(!t.represented)return `${css()}<section class="nh-dark" data-national-hub>${head}${unavailable(P)}</section>`;
    return `${css()}<section class="nh-dark" data-national-hub>${head}<nav class="nh-tabs">${TABS.map(([id,l])=>`<button type="button" class="${id===tab?"on":""}" data-nh-tab="${id}">${l}</button>`).join("")}</nav>${body(s,D,P,tab)}${classicBtn}</section>`;
  }
  const api={render,state:ui,TABS,setTab(id){if(TABS.some(x=>x[0]===id))ui.tab=id;},setClassic(v){ui.classic=!!v;}};
  root.ProLifeNationalHub=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
