(function(root){
  "use strict";

  const Dev=root.ProLifePlayerDevelopment||(typeof require==="function"?require("../domain/player-development.js"):null);
  const Potential=root.ProLifeDynamicPotential||(typeof require==="function"?require("../domain/dynamic-potential.js"):null);
  const Current=root.ProLifeCurrentOverall||(typeof require==="function"?require("../domain/current-overall.js"):null);
  const esc=(value)=>String(value??"").replace(/[&<>"']/g,(char)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
  const finite=(value)=>Number.isFinite(Number(value));
  const signed=(value)=>`${Number(value)>0?"+":""}${Number(value)}`;
  const phaseLabels={growth:"Crescimento",peak:"Auge",decline:"Declínio"};

  function recentForm(state,player){
    const club=(state?.matches||[]).filter(match=>finite(match?.ratings?.[player.id])).map(match=>({day:Number(match.day??match.date??-1),rating:Number(match.ratings[player.id])}));
    const national=player.id==="hero"?(state?.nationalTeam?.matches||[]).filter(match=>finite(match?.rating)&&Number(match.minutes)>0).map(match=>({day:Number(match.day??-1),rating:Number(match.rating)})):[];
    const ratings=[...club,...national].sort((a,b)=>b.day-a.day).slice(0,5).map(row=>row.rating);
    if(ratings.length)return +(ratings.reduce((sum,value)=>sum+value,0)/ratings.length).toFixed(1);
    if(finite(player.form))return +Number(player.form).toFixed(1);
    return null;
  }

  function developmentHistory(state){
    return (Array.isArray(state?.development)?state.development:[]).filter(row=>row&&finite(row.day)&&row.attrs&&typeof row.attrs==="object").slice();
  }

  function render(state,D){
    if(state?.mode!=="player")return '<section class="card section development-center-empty"><h2>Desenvolvimento do jogador</h2><p class="muted">Esta central é exclusiva da carreira de jogador.</p></section>';
    if(!state?.person||!D||typeof D.overall!=="function"||!Dev||!Potential||!Current)return '<section id="player-development" class="card section development-center-empty"><h2>Desenvolvimento indisponível</h2><p class="muted">Os módulos de desenvolvimento ainda não estão disponíveis nesta execução.</p></section>';

    const player=state.person,base=D.overall(player),context={seed:state.initialSeed??state.seed,season:state.season};
    const model={...player,overall:base,ovr:base};
    const current=typeof D.currentOverall==="function"?D.currentOverall(state,player):Current.currentOverall(state,player,{overall:D.overall});
    const profile=Dev.resolveProfile(model,context),definition=Dev.PROFILES[profile.id]||{};
    const params=Dev.parametersFor(profile.id,model,context),trajectory=Dev.expectedAnnualChange(model,context);
    const outlook=Potential.potentialOutlook(model,context),history=developmentHistory(state);
    const firstSeason=history.find(row=>Number(row.season)===Number(state.season))||history[0]||null;
    const latest=history.at(-1)||null,form=recentForm(state,player);
    const fitness=finite(player.physical?.fitness)?Number(player.physical.fitness):finite(player.condition)?Number(player.condition):null;
    const morale=finite(player.morale)?Number(player.morale):null,fatigue=finite(player.physical?.fatigue)?Number(player.physical.fatigue):null;
    const attrs=(D.attrs||[]).slice(0,6).map(key=>{
      const value=Number(player.attrs?.[key]),previous=firstSeason&&finite(firstSeason.attrs?.[key])?Number(firstSeason.attrs[key]):null;
      const delta=previous===null?null:value-previous,label=D.labels?.[key]||D.Training?.skills?.[key]||key;
      return `<article class="dev32-attribute"><header><span>${esc(label)}</span><b>${finite(value)?Math.round(value):"—"}</b></header><i><em style="width:${finite(value)?Math.max(0,Math.min(100,value)):0}%"></em></i><small>${delta===null?"Sem histórico comparável":`${signed(delta)} desde o primeiro registro da temporada`}</small></article>`;
    }).join("");
    const rows=history.slice(-8).reverse().map(row=>{
      const ovr=finite(row.overall)?Math.round(Number(row.overall)):"—";
      return `<tr><td>${esc(`Dia ${row.day}`)}</td><td>${esc(row.season??"—")}</td><td>${ovr}</td><td>${finite(row.condition)?Math.round(Number(row.condition))+"%":"—"}</td><td>${finite(row.morale)?Math.round(Number(row.morale)):"—"}</td></tr>`;
    }).join("");
    const historyBlock=rows?`<div class="tablewrap"><table><thead><tr><th>Registro</th><th>Temporada</th><th>GER</th><th>Condição</th><th>Moral</th></tr></thead><tbody>${rows}</tbody></table></div>`:'<p class="muted">Ainda não há variações persistidas para exibir.</p>';
    const potentialLabel=outlook.estimated?"Estimado por dados disponíveis":"Potencial atual";
    const expectedMin=Math.round(trajectory.min*10)/10,expectedMax=Math.round(trajectory.max*10)/10;

    return `<section id="player-development" class="development-center32" aria-label="Central de desenvolvimento do jogador">
      <header class="dev32-hero card"><div><div class="tag">CENTRAL DE DESENVOLVIMENTO</div><h2>${esc(player.name||"Jogador")}</h2><p>${esc(definition.description||"Perfil de evolução em acompanhamento.")}</p></div><div class="dev32-ratings"><span><small>GER BASE</small><strong>${base}</strong></span><span class="current"><small>GER ATUAL</small><strong>${current}</strong><em>Momento de jogo</em></span></div></header>
      <div class="dev32-grid">
        <article class="card dev32-card dev32-trajectory"><div class="tag">TRAJETÓRIA</div><h3>${esc(definition.label||profile.id)}</h3><p>${esc(profile.source==="stored"?"Perfil registrado na carreira":"Perfil determinado pelos dados atuais; será persistido pelo fluxo de desenvolvimento.")}</p><div class="dev32-phase ${esc(trajectory.phase)}"><small>FASE DA CARREIRA</small><b>${esc(phaseLabels[trajectory.phase]||"Indisponível")}</b></div><dl><div><dt>Idade atual</dt><dd>${finite(player.age)?Math.round(player.age):"—"}</dd></div><div><dt>Auge projetado</dt><dd>${params.peakAge} anos</dd></div><div><dt>Janela de auge</dt><dd>${params.peakStart}–${params.peakEnd} anos</dd></div></dl></article>
        <article class="card dev32-card"><div class="tag">POTENCIAL E TETO</div><div class="dev32-potential"><span><small>${esc(potentialLabel)}</small><b>${Math.round(outlook.potential)}</b></span><span><small>Teto de desenvolvimento</small><b>${Math.round(outlook.ceiling)}</b></span></div><p class="dev32-disclaimer">O teto e a projeção são cenários, não uma promessa de GER futuro. Desempenho, minutos, treinos, idade e lesões podem alterar a trajetória.</p><div class="dev32-projection"><small>CENÁRIO ATÉ O AUGE</small><b>GER ${Math.round(outlook.projectedPeak)}</b><span>Variação anual estimada: ${signed(expectedMin)} a ${signed(expectedMax)}</span></div></article>
        <article class="card dev32-card"><div class="tag">MOMENTO</div><div class="dev32-vitals"><span><small>Forma recente</small><b>${form===null?"—":form}</b></span><span><small>Moral</small><b>${morale===null?"—":Math.round(morale)}</b></span><span><small>Condicionamento</small><b>${fitness===null?"—":Math.round(fitness)+"%"}</b></span><span><small>Fadiga</small><b>${fatigue===null?"—":Math.round(fatigue)+"%"}</b></span></div><p class="muted">O GER atual considera o momento disponível sem alterar o GER base nem os atributos.</p></article>
      </div>
      <section class="card dev32-attributes"><div class="split"><div><div class="tag">SEIS ATRIBUTOS PRINCIPAIS</div><h3>Evolução registrada</h3></div><span class="pill">${latest?`Último registro: dia ${latest.day}`:"Sem histórico"}</span></div><div class="dev32-attribute-grid">${attrs}</div></section>
      <section class="card dev32-history"><details><summary><b>Histórico de variações disponível</b></summary>${historyBlock}<p class="muted">Somente registros já persistidos pela carreira são exibidos; alterações sem snapshot histórico não são reconstruídas.</p></details></section>
    </section>`;
  }

  const api={render,recentForm,developmentHistory};
  root.ProLifePlayerDevelopmentView=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
