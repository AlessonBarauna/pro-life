(function worldAwardsViewModule(root){
  "use strict";
  // Stage 34F.28 - Central mundial de premios e rankings (substitui a tela "Premios & Rankings").
  // Le somente: ProLifeWorldStats (ligas mundiais simuladas) e ProLifeStatistics (competicoes brasileiras / protagonista).
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const TABS=[["geral","Visão geral"],["competicoes","Competições"],["mundo","Mundo"],["carreira","Minha carreira"]];
  const ui={tab:"geral",league:null,season:"atual"};
  const WS=()=>root.ProLifeWorldStats;
  const POS_NAME={ATA:"Ataque",MEI:"Meio-campo",DEF:"Defesa",GOL:"Goleiro"};
  const val=(unit,v)=>WS().format(unit,v);

  function heroLeagueId(s){return (s.clubs||[]).find(c=>c.id===s.clubId)?.leagueId||null;}
  function brazilCompetitions(s){try{return root.ProLifeCompetitions?.statCompetitions?.(s)||[];}catch(e){return [];}}
  function isWorld(s,id){return WS().competitions(s).some(c=>c.id===id);}

  const tabs=()=>`<nav class="wa-tabs" role="tablist" aria-label="Seções">${TABS.map(([id,l])=>`<button type="button" role="tab" aria-selected="${ui.tab===id}" class="${ui.tab===id?"active":""}" data-wa-tab="${id}">${l}</button>`).join("")}</nav>`;
  function awardCard(a,extra){
    return `<article class="wa-award${a.hero||a.playerId==="hero"?" hero":""}"><small>${esc(a.label)}${extra?` · ${esc(extra)}`:""}</small><b>${esc(a.name)}</b><span>${esc(a.club||"—")}</span><em>${esc(val(a.unit,a.value))}</em></article>`;
  }
  function missingCards(list){return list.map(x=>`<article class="wa-award off"><small>${esc(x.label)}</small><b>Dados insuficientes</b><span>Sem vencedor definido</span></article>`).join("");}
  function table(title,rows,fmt,note){
    const body=rows.length?`<table class="wa-table"><thead><tr><th>#</th><th>Jogador</th><th>Clube</th><th>J</th><th></th></tr></thead><tbody>${rows.map((r,i)=>`<tr class="${r.hero?"hero":""}"><td>${i+1}</td><td><b>${esc(r.name)}</b><small>${esc(POS_NAME[r.pos]||r.pos||"")}${r.age?` · ${r.age}`:""}</small></td><td>${esc(r.club||"—")}</td><td>${r.apps??0}</td><td><b>${esc(fmt(r))}</b></td></tr>`).join("")}</tbody></table>`:`<p class="wa-note">Dados insuficientes: ainda não há partidas ou amostra mínima.</p>`;
    return `<section class="wa-card"><small>${esc(title)}</small>${note?`<p class="wa-note">${esc(note)}</p>`:""}${body}</section>`;
  }
  const fGoals=r=>val("gols",r.goals),fAssist=r=>val("assistencias",r.assists),fRating=r=>val("nota",r.avg),fSaves=r=>val("defesas",r.saves),fMotm=r=>val("motm",r.motm);

  function xiView(xi,complete){
    if(!xi.length)return `<p class="wa-note">Dados insuficientes para a seleção da temporada.</p>`;
    return `<div class="wa-xi">${["ATA","MEI","DEF","GOL"].map(pos=>`<div class="wa-xi-line"><small>${POS_NAME[pos]}</small><div>${xi.filter(x=>x.pos===pos).map(x=>`<span class="wa-xi-p"><b>${esc(x.name)}</b><em>${esc(x.club||"")}</em><i>Nota ${esc(String(x.avg).replace(".",","))}</i></span>`).join("")}</div></div>`).join("")}</div>${complete?"":`<p class="wa-note">Seleção incompleta: poucos jogadores atingiram a amostra mínima.</p>`}`;
  }

  // ---------- Visao geral ----------
  function geral(s){
    const hid=heroLeagueId(s),W=WS(),world=W.competitions(s),arch=W.history(s).slice(0,40);
    const latestSeason=arch.length?arch[0].season:null;
    const recent=latestSeason==null?[]:arch.filter(a=>a.season===latestSeason&&(a.leagueId==="world"||a.leagueId===hid)).flatMap(a=>a.awards.map(w=>({...w,_l:a.league})));
    const recentHtml=recent.length?`<div class="wa-awards">${recent.slice(0,9).map(a=>awardCard(a,a._l)).join("")}</div>`:`<p class="wa-note">Os primeiros prêmios saem ao fim da temporada em andamento. Nenhum vencedor é definido antes disso.</p>`;
    let live="";
    if(hid&&isWorld(s,hid)){
      const aw=W.leagueAwards(s,hid);
      live=aw.awards.length?`<div class="wa-awards">${aw.awards.slice(0,6).map(a=>awardCard(a)).join("")}</div>`:`<p class="wa-note">Dados insuficientes: a liga ainda não atingiu a amostra mínima (${aw.min} jogos).</p>`;
    }else if(world.length){
      const g=W.leaders(s,{stat:"goals",limit:1})[0],a=W.leaders(s,{stat:"assists",limit:1})[0];
      live=`<div class="wa-awards">${g?awardCard({label:"Artilheiro global",name:g.name,club:g.club,unit:"gols",value:g.goals}):""}${a?awardCard({label:"Líder global de assistências",name:a.name,club:a.club,unit:"assistencias",value:a.assists}):""}</div>`;
    }
    const st=hid&&isWorld(s,hid)?W.heroStanding(s,hid):null;
    const stand=st?`<div class="wa-strip"><div><b>${st.apps}</b><span>jogos</span></div><div><b>${st.goals}</b><span>gols</span></div><div><b>${st.assists}</b><span>assistências</span></div><div><b>${st.apps?String(st.avg).replace(".",","):"—"}</b><span>nota média</span></div></div><p class="wa-note">Posição nos rankings da liga: ${st.rankGoals?`${st.rankGoals}º em gols`:"fora do ranking de gols"} · ${st.rankAssists?`${st.rankAssists}º em assistências`:"fora do ranking de assistências"} · ${st.rankRating?`${st.rankRating}º em nota`:"sem amostra de nota"}.</p>`:`<p class="wa-note">${hid&&isWorld(s,hid)?"Você ainda não entrou em campo nesta liga na temporada.":"Seus números oficiais estão em Estatísticas e na aba Competições."}</p>`;
    const close=`Os prêmios são fechados no fim da temporada (dia ${365}); o histórico fica permanente.`;
    return `<div class="wa-grid"><section class="wa-card wide"><small>PRÊMIOS MAIS RECENTES</small>${recentHtml}</section><section class="wa-card wide"><small>DISPUTAS ATUAIS · TEMPORADA ${esc(s.season)}</small>${live}</section><section class="wa-card"><small>SITUAÇÃO DO PROTAGONISTA</small>${stand}</section><section class="wa-card"><small>PRÓXIMAS PREMIAÇÕES</small><p class="wa-note">${esc(close)} ${world.length} liga(s) do mundo geram estatísticas individuais nesta carreira.</p></section></div>`;
  }

  // ---------- Competicoes ----------
  function competicoes(s){
    const W=WS(),world=W.competitions(s),br=brazilCompetitions(s);
    if(ui.league&&!world.some(c=>c.id===ui.league)&&!br.some(c=>c.id===ui.league))ui.league=null;
    if(!ui.league)ui.league=(isWorld(s,heroLeagueId(s))?heroLeagueId(s):null)||world[0]?.id||br[0]?.id||null;
    const countries=[...new Set(world.map(c=>c.country).filter(Boolean))].sort();
    const options=`<optgroup label="Mundo">${world.map(c=>`<option value="${esc(c.id)}" ${c.id===ui.league?"selected":""}>${esc(c.country?`${c.country} · `:"")}${esc(c.name)}</option>`).join("")}</optgroup>${br.length?`<optgroup label="Brasil">${br.map(c=>`<option value="${esc(c.id)}" ${c.id===ui.league?"selected":""}>${esc(c.name)}</option>`).join("")}</optgroup>`:""}`;
    const archive=W.history(s,{leagueId:ui.league});
    const seasons=archive.map(a=>a.season);
    if(ui.season!=="atual"&&!seasons.includes(Number(ui.season)))ui.season="atual";
    const filters=`<div class="wa-filters"><label>Competição<select data-wa-league>${options}</select></label><label>Temporada<select data-wa-season><option value="atual" ${ui.season==="atual"?"selected":""}>Atual (${esc(s.season)})</option>${seasons.map(y=>`<option value="${y}" ${String(ui.season)===String(y)?"selected":""}>${y}</option>`).join("")}</select></label>${countries.length?`<small class="wa-note">${countries.length} países com ligas simuladas</small>`:""}</div>`;
    let body="";
    if(isWorld(s,ui.league)){
      if(ui.season!=="atual"){
        const a=archive.find(x=>x.season===Number(ui.season));
        body=a?`<section class="wa-card wide"><small>${esc(a.league)} · ${a.season}${a.champion?` · Campeão: ${esc(a.champion)}`:""}</small><div class="wa-awards">${a.awards.map(w=>awardCard(w)).join("")}${missingCards((a.insufficient||[]).map(c=>({label:c})))}</div></section><section class="wa-card wide"><small>SELEÇÃO DA TEMPORADA</small>${xiView(a.xi||[],(a.xi||[]).length===11)}</section>`:`<p class="wa-note">Sem registro para esta temporada.</p>`;
      }else{
        const aw=W.leagueAwards(s,ui.league);
        body=`<section class="wa-card wide"><small>PREMIAÇÕES · PARCIAL</small><p class="wa-note">Amostra mínima: ${aw.min} jogos. ${aw.played} rodada(s) disputada(s).</p><div class="wa-awards">${aw.awards.map(a=>awardCard(a)).join("")}${missingCards(aw.insufficient)}</div></section>
        <div class="wa-cols">${table("ARTILHARIA",W.leaders(s,{leagueId:ui.league,stat:"goals"}),fGoals)}${table("ASSISTÊNCIAS",W.leaders(s,{leagueId:ui.league,stat:"assists"}),fAssist)}${table("DESEMPENHO",W.leaders(s,{leagueId:ui.league,stat:"rating"}),fRating,`Mínimo de ${aw.min} jogos.`)}${table("MELHORES EM CAMPO",W.leaders(s,{leagueId:ui.league,stat:"motm"}),fMotm)}${table("GOLEIROS",W.leaders(s,{leagueId:ui.league,stat:"saves"}).filter(r=>r.pos==="GOL"),fSaves)}</div>
        <section class="wa-card wide"><small>SELEÇÃO DA TEMPORADA · 4-3-3</small>${xiView(aw.xi,aw.xiComplete)}</section>`;
      }
      const hist=archive.filter(a=>a.champion);
      body+=`<section class="wa-card wide"><small>CAMPEÕES E VENCEDORES</small>${hist.length?`<ul class="wa-list">${hist.map(a=>`<li><span>${a.season}</span><b>${esc(a.champion)}</b><small>${esc((a.awards.find(w=>w.cat==="craque")||{}).name||"")}</small></li>`).join("")}</ul>`:`<p class="wa-note">O histórico começa ao fim da primeira temporada.</p>`}</section>`;
    }else if(ui.league){
      const S=root.ProLifeStatistics,r=S.rankingDashboard(s,ui.league,10);
      const rows=(list,f)=>(list||[]).map(x=>({...x,apps:x.appearances,pos:x.position,hero:x.id==="hero",value:x.value,f}));
      body=`<div class="wa-cols">${table("ARTILHARIA",rows(r.goals),x=>val("gols",x.value))}${table("ASSISTÊNCIAS",rows(r.assists),x=>val("assistencias",x.value))}${table("DESEMPENHO",rows(r.performance),x=>val("nota",x.average??x.value))}</div>`;
      const stored=(S.init(s).root.awards||[]).filter(a=>a.leagueId===ui.league).slice(0,12);
      body+=`<section class="wa-card wide"><small>PRÊMIOS REGISTRADOS</small>${stored.length?`<div class="wa-awards">${stored.map(a=>`<article class="wa-award"><small>${esc(a.name)} · ${esc(a.season)}</small><b>${esc(a.winner)}</b><span>${esc(a.winnerClub||"Clube não registrado")}</span><em>${esc(WS().formatByName(a.name,a.value))}</em></article>`).join("")}</div>`:`<p class="wa-note">Nenhum prêmio encerrado nesta competição ainda.</p>`}</section>`;
    }else body=`<p class="wa-note">Nenhuma competição disponível.</p>`;
    return `${filters}${body}`;
  }

  // ---------- Mundo ----------
  function mundo(s){
    const W=WS();if(!W.competitions(s).length)return `<p class="wa-note">Nenhuma liga mundial simulada nesta carreira.</p>`;
    const w=W.worldAwards(s);
    const coaches=W.coachesTop(s,8);
    return `<section class="wa-card wide"><small>PRÊMIOS MUNDIAIS · PARCIAL</small><p class="wa-note">Prêmios internos do PRO-LIFE, calculados com os resultados simulados. Notas de ligas mais fortes pesam um pouco mais.</p><div class="wa-awards">${w.awards.map(a=>awardCard(a,a.leagueId?W.competitions(s).find(c=>c.id===a.leagueId)?.name:"")).join("")}${missingCards(w.insufficient)}</div></section>
    <div class="wa-cols">${table("ARTILHEIROS GLOBAIS",W.leaders(s,{stat:"goals",limit:10}),fGoals)}${table("ASSISTÊNCIAS GLOBAIS",W.leaders(s,{stat:"assists",limit:10}),fAssist)}${table("MELHOR DESEMPENHO",W.leaders(s,{stat:"rating",limit:10}),fRating,"Amostra mínima por liga.")}${table("JOVENS DESTAQUES (até 21 anos)",W.youngLeaders(s,10),fRating)}${table("GOLEIROS EM DESTAQUE",W.keepersTop(s,10),fSaves)}</div>
    <section class="wa-card wide"><small>TREINADORES EM DESTAQUE</small>${coaches.length?`<ul class="wa-list">${coaches.map((c,i)=>`<li><span>${i+1}</span><b>${esc(c.name)}</b><small>${esc(c.club)}</small><em>${esc(val("posicoes",c.value))}</em></li>`).join("")}</ul>`:`<p class="wa-note">Dados insuficientes: nenhum treinador superou o esperado até agora.</p>`}</section>`;
  }

  // ---------- Minha carreira ----------
  function carreira(s){
    const W=WS(),hid=heroLeagueId(s),mine=W.heroAwards(s);
    const old=(root.ProLifeStatistics?.init(s).root.awards||[]).filter(a=>a.winner===(s.person?.name));
    const all=[...mine.map(a=>({season:a.season,title:a.label,sub:a.league,club:a.club,txt:val(a.unit,a.value)})),...old.map(a=>({season:a.season,title:a.name,sub:a.league||"Geral",club:a.winnerClub,txt:W.formatByName(a.name,a.value)}))].sort((x,y)=>y.season-x.season);
    const trophies=all.length?`<div class="wa-awards">${all.map(a=>`<article class="wa-award hero"><small>${esc(a.title)} · ${esc(a.season)}</small><b>${esc(a.sub)}</b><span>${esc(a.club||"Clube não registrado")}</span><em>${esc(a.txt)}</em></article>`).join("")}</div>`:`<p class="wa-note">Sua sala de troféus será preenchida quando você vencer um prêmio. Nenhum prêmio é dado por fama ou por ser o protagonista.</p>`;
    const st=hid&&isWorld(s,hid)?W.heroStanding(s,hid):null;
    const bySeason=new Map();for(const a of all){if(!bySeason.has(a.season))bySeason.set(a.season,0);bySeason.set(a.season,bySeason.get(a.season)+1);}
    const nom=st?`<ul class="wa-list"><li><span>Gols</span><b>${st.rankGoals?`${st.rankGoals}º`:"—"}</b><small>${esc(val("gols",st.goals))}</small></li><li><span>Assistências</span><b>${st.rankAssists?`${st.rankAssists}º`:"—"}</b><small>${esc(val("assistencias",st.assists))}</small></li><li><span>Nota média</span><b>${st.rankRating?`${st.rankRating}º`:"—"}</b><small>${st.apps?esc(val("nota",st.avg)):"Dados insuficientes"}</small></li></ul>`:`<p class="wa-note">Posições detalhadas aparecem para ligas mundiais simuladas. Para competições brasileiras, veja a aba Competições.</p>`;
    const seasons=[...bySeason.entries()].sort((a,b)=>b[0]-a[0]);
    return `<section class="wa-card wide"><small>SALA DE TROFÉUS</small><div class="wa-strip"><div><b>${all.length}</b><span>prêmios</span></div><div><b>${bySeason.size}</b><span>temporadas premiadas</span></div></div>${trophies}</section>
    <div class="wa-grid"><section class="wa-card"><small>CLASSIFICAÇÃO NOS RANKINGS · TEMPORADA ${esc(s.season)}</small>${nom}</section><section class="wa-card"><small>PRÊMIOS POR TEMPORADA</small>${seasons.length?`<ul class="wa-list">${seasons.map(([y,n])=>`<li><span>${y}</span><b>${n} prêmio(s)</b></li>`).join("")}</ul>`:`<p class="wa-note">Sem prêmios registrados.</p>`}</section></div>`;
  }

  function css(){
    return `<style>.wa-dark{--wa-card:#111b26;--wa-line:rgba(255,255,255,.09);--wa-text:#f2f4f6;--wa-muted:#8b99a6;--wa-gold:#d8b45b;--wa-teal:#4cc3b0;padding:24px;border-radius:18px;background:#0a1119;color:var(--wa-text);border:1px solid var(--wa-line)}
.wa-dark h2{margin:0 0 4px}.wa-dark small{color:var(--wa-muted);letter-spacing:.1em;text-transform:uppercase;font-size:11px}.wa-note{color:var(--wa-muted);font-size:13px;margin:8px 0}
.wa-tabs{display:flex;gap:4px;border-bottom:1px solid var(--wa-line);margin:14px 0 18px;flex-wrap:wrap}.wa-tabs button{background:none;border:0;border-bottom:2px solid transparent;color:var(--wa-muted);padding:10px 16px;font:inherit;font-weight:600;cursor:pointer}.wa-tabs button.active{color:var(--wa-text);border-bottom-color:var(--wa-gold)}
.wa-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.wa-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px;margin:14px 0}.wa-card{background:var(--wa-card);border:1px solid var(--wa-line);border-radius:12px;padding:16px;margin-bottom:14px}.wa-grid .wa-card,.wa-cols .wa-card{margin:0}.wa-card.wide{grid-column:1/-1}
.wa-filters{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end;margin-bottom:14px}.wa-filters label{display:flex;flex-direction:column;gap:4px;font-size:11px;color:var(--wa-muted);text-transform:uppercase;letter-spacing:.1em}.wa-filters select{min-width:220px;max-width:100%}
.wa-awards{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;margin-top:10px}.wa-award{border:1px solid var(--wa-line);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:3px}.wa-award b{font-size:15px}.wa-award span{color:var(--wa-muted);font-size:12px}.wa-award em{font-style:normal;color:var(--wa-gold);font-weight:600}.wa-award.hero{border-color:var(--wa-gold);background:rgba(216,180,91,.07)}.wa-award.off{opacity:.55}
.wa-table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}.wa-table th,.wa-table td{text-align:left;padding:6px 6px;border-bottom:1px solid var(--wa-line)}.wa-table th{color:var(--wa-muted);font-weight:600}.wa-table td small{display:block;text-transform:none;letter-spacing:0}.wa-table tr.hero{background:rgba(216,180,91,.1)}
.wa-list{list-style:none;margin:8px 0 0;padding:0}.wa-list li{display:flex;gap:12px;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--wa-line)}.wa-list small{flex:1;text-transform:none;letter-spacing:0}.wa-list em{font-style:normal;color:var(--wa-gold)}
.wa-strip{display:flex;gap:26px;margin:10px 0}.wa-strip b{display:block;font-size:26px;font-variant-numeric:tabular-nums}.wa-strip span{color:var(--wa-muted);font-size:12px}
.wa-xi{display:flex;flex-direction:column;gap:10px;margin-top:10px}.wa-xi-line>div{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}.wa-xi-line>small{display:block;text-align:center;margin-bottom:4px}.wa-xi-p{border:1px solid var(--wa-line);border-radius:10px;padding:8px 10px;min-width:130px;display:flex;flex-direction:column;text-align:center;background:rgba(76,195,176,.06)}.wa-xi-p em,.wa-xi-p i{font-style:normal;color:var(--wa-muted);font-size:11px}
.wa-dark button:focus-visible,.wa-dark select:focus-visible{outline:2px solid var(--wa-gold);outline-offset:2px}
@media(max-width:900px){.wa-dark{padding:16px}.wa-grid{grid-template-columns:1fr}.wa-cols{grid-template-columns:1fr}}</style>`;
  }

  function render(s,D){
    if(!WS()||!s)return `<section class="card"><h2>Prêmios &amp; Rankings</h2><p class="muted">Módulo indisponível.</p></section>`;
    try{WS().init(s);}catch(e){}
    const body=ui.tab==="competicoes"?competicoes(s):ui.tab==="mundo"?mundo(s):ui.tab==="carreira"?carreira(s):geral(s);
    return `${css()}<section class="wa-dark"><small>PRÊMIOS &amp; RANKINGS</small><h2>Central mundial · Temporada ${esc(s.season)}</h2><p class="wa-note">Todos os dados vêm das partidas simuladas. Nenhum vencedor é escolhido por fama ou por ser o protagonista. Prêmios internos do PRO-LIFE.</p>${tabs()}${body}</section>`;
  }
  const api={render,state:ui,esc,setTab:id=>{if(TABS.some(t=>t[0]===id))ui.tab=id;},setLeague:id=>{ui.league=id||null;ui.season="atual";},setSeason:v=>{ui.season=v||"atual";}};
  root.ProLifeWorldAwardsView=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
