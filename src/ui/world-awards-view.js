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
  const initials=name=>String(name||"?").split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join("").toUpperCase();

  function playerOf(s,id,name){
    if(id==="hero")return s.person||{id,name};
    return (s.internationalPlayers||[]).find(p=>p.id===id)||(s.clubs||[]).flatMap(c=>c.roster||[]).find(p=>p.id===id)||{id:id||name,name};
  }
  function clubIdOf(s,id,name){
    if(id)return id;
    const club=[...(s.clubs||[]),...(s.globalFootball?.clubs||[])].find(c=>c.name===name||c.shortName===name);
    return club?.id||null;
  }
  function crest(s,id,name,size="sm"){
    const clubId=clubIdOf(s,id,name),C=root.ProLifeClubCrests;
    const image=clubId&&(C?.inline?.(clubId,size)||C?.render?.(clubId,{size}))||"";
    return String(image).startsWith("<img")?`<span class="wa-crest has-image">${image}</span>`:`<span class="wa-crest" aria-label="Clube ${esc(name||"não informado")}">${esc(initials(name))}</span>`;
  }
  function face(s,item,size="md"){
    const coach=item.pos==="TEC"||(!item.playerId&&/treinador/i.test(item.label||""));
    if(coach)return `<span class="wa-face wa-face-${size} coach" aria-label="Treinador ${esc(item.name)}">${esc(initials(item.name))}</span>`;
    const player=playerOf(s,item.playerId||item.id,item.name),src=root.ProLifePlayerCard?.portrait?.(player);
    return src?`<span class="wa-face wa-face-${size}"><img src="${src}" alt="Retrato ilustrado de ${esc(item.name)}" loading="lazy" decoding="async"></span>`:`<span class="wa-face wa-face-${size}" aria-label="Jogador ${esc(item.name)}">${esc(initials(item.name))}</span>`;
  }

  function heroLeagueId(s){return (s.clubs||[]).find(c=>c.id===s.clubId)?.leagueId||null;}
  function brazilCompetitions(s){try{return root.ProLifeCompetitions?.statCompetitions?.(s)||[];}catch(e){return [];}}
  function isWorld(s,id){return WS().competitions(s).some(c=>c.id===id);}

  const tabs=()=>`<nav class="wa-tabs" role="tablist" aria-label="Seções">${TABS.map(([id,l])=>`<button type="button" role="tab" aria-selected="${ui.tab===id}" class="${ui.tab===id?"active":""}" data-wa-tab="${id}">${l}</button>`).join("")}</nav>`;
  function awardCard(s,a,extra){
    return `<article class="wa-award${a.hero||a.playerId==="hero"?" hero":""}"><div class="wa-award-visual">${face(s,a,"lg")}<i class="wa-award-rank" aria-hidden="true">${a.cat==="melhorMundo"?"★":"◆"}</i></div><div class="wa-award-copy"><small>${esc(a.label)}${extra?` · ${esc(extra)}`:""}</small><b>${esc(a.name)}</b><span>${crest(s,a.clubId,a.club)}${esc(a.club||"—")}</span><em>${esc(val(a.unit,a.value))}</em></div></article>`;
  }
  function missingCards(list){return list.map(x=>`<article class="wa-award off"><small>${esc(x.label)}</small><b>Dados insuficientes</b><span>Sem vencedor definido</span></article>`).join("");}
  function table(s,title,rows,fmt,note){
    const metric=/ARTILHARIA|ARTILHEIROS/.test(title)?"Gols":/ASSIST/.test(title)?"Assist.":/GOLEIR/.test(title)?"Defesas":/CAMPO/.test(title)?"Prêmios":"Nota";
    const body=rows.length?`<table class="wa-table"><thead><tr><th class="wa-rank-col">#</th><th>Jogador</th><th>Clube</th><th class="wa-apps-col">J</th><th class="wa-metric-col">${metric}</th></tr></thead><tbody>${rows.map((r,i)=>`<tr class="${r.hero?"hero":""}"><td><b class="wa-position">${i+1}</b></td><td><div class="wa-player-cell">${face(s,{...r,playerId:r.playerId||r.id},"sm")}<span><b title="${esc(r.name)}">${esc(r.name)}</b><small>${esc(POS_NAME[r.pos]||r.pos||"")}${r.age?` · ${r.age} anos`:""}</small></span></div></td><td><span class="wa-club-cell">${crest(s,r.clubId,r.club)}<span title="${esc(r.club||"—")}">${esc(r.club||"—")}</span></span></td><td class="wa-apps-col">${r.apps??0}</td><td class="wa-metric-col"><b>${esc(fmt(r))}</b></td></tr>`).join("")}</tbody></table>`:`<p class="wa-note">Dados insuficientes: ainda não há partidas ou amostra mínima.</p>`;
    return `<section class="wa-card wa-ranking"><header class="wa-card-head"><div><small>RANKING</small><h3>${esc(title)}</h3></div>${rows.length?`<span>TOP ${rows.length}</span>`:""}</header>${note?`<p class="wa-note">${esc(note)}</p>`:""}${body}</section>`;
  }
  const fGoals=r=>val("gols",r.goals),fAssist=r=>val("assistencias",r.assists),fRating=r=>val("nota",r.avg),fSaves=r=>val("defesas",r.saves),fMotm=r=>val("motm",r.motm);

  function xiView(s,xi,complete){
    if(!xi.length)return `<p class="wa-note">Dados insuficientes para a seleção da temporada.</p>`;
    return `<div class="wa-xi">${["ATA","MEI","DEF","GOL"].map(pos=>`<div class="wa-xi-line"><small>${POS_NAME[pos]}</small><div>${xi.filter(x=>x.pos===pos).map(x=>`<span class="wa-xi-p">${face(s,x,"sm")}<span><b>${esc(x.name)}</b><em>${crest(s,x.clubId,x.club)}${esc(x.club||"")}</em><i>Nota ${esc(String(x.avg).replace(".",","))}</i></span></span>`).join("")}</div></div>`).join("")}</div>${complete?"":`<p class="wa-note">Seleção incompleta: poucos jogadores atingiram a amostra mínima.</p>`}`;
  }

  // ---------- Visao geral ----------
  function geral(s){
    const hid=heroLeagueId(s),W=WS(),world=W.competitions(s),arch=W.history(s).slice(0,40);
    const latestSeason=arch.length?arch[0].season:null;
    const recent=latestSeason==null?[]:arch.filter(a=>a.season===latestSeason&&(a.leagueId==="world"||a.leagueId===hid)).flatMap(a=>a.awards.map(w=>({...w,_l:a.league})));
    const recentHtml=recent.length?`<div class="wa-awards">${recent.slice(0,9).map(a=>awardCard(s,a,a._l)).join("")}</div>`:`<p class="wa-note">Os primeiros prêmios saem ao fim da temporada em andamento. Nenhum vencedor é definido antes disso.</p>`;
    let live="";
    if(hid&&isWorld(s,hid)){
      const aw=W.leagueAwards(s,hid);
      live=aw.awards.length?`<div class="wa-awards">${aw.awards.slice(0,6).map(a=>awardCard(s,a)).join("")}</div>`:`<p class="wa-note">Dados insuficientes: a liga ainda não atingiu a amostra mínima (${aw.min} jogos).</p>`;
    }else if(world.length){
      const g=W.leaders(s,{stat:"goals",limit:1})[0],a=W.leaders(s,{stat:"assists",limit:1})[0];
      live=`<div class="wa-awards">${g?awardCard(s,{label:"Artilheiro global",playerId:g.id,clubId:g.clubId,name:g.name,club:g.club,pos:g.pos,unit:"gols",value:g.goals}):""}${a?awardCard(s,{label:"Líder global de assistências",playerId:a.id,clubId:a.clubId,name:a.name,club:a.club,pos:a.pos,unit:"assistencias",value:a.assists}):""}</div>`;
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
        body=a?`<section class="wa-card wide"><small>${esc(a.league)} · ${a.season}${a.champion?` · Campeão: ${esc(a.champion)}`:""}</small><div class="wa-awards">${a.awards.map(w=>awardCard(s,w)).join("")}${missingCards((a.insufficient||[]).map(c=>({label:c})))}</div></section><section class="wa-card wide"><small>SELEÇÃO DA TEMPORADA</small>${xiView(s,a.xi||[],(a.xi||[]).length===11)}</section>`:`<p class="wa-note">Sem registro para esta temporada.</p>`;
      }else{
        const aw=W.leagueAwards(s,ui.league);
        body=`<section class="wa-card wide"><small>PREMIAÇÕES · PARCIAL</small><p class="wa-note">Amostra mínima: ${aw.min} jogos. ${aw.played} rodada(s) disputada(s).</p><div class="wa-awards">${aw.awards.map(a=>awardCard(s,a)).join("")}${missingCards(aw.insufficient)}</div></section>
        <div class="wa-cols">${table(s,"ARTILHARIA",W.leaders(s,{leagueId:ui.league,stat:"goals"}),fGoals)}${table(s,"ASSISTÊNCIAS",W.leaders(s,{leagueId:ui.league,stat:"assists"}),fAssist)}${table(s,"DESEMPENHO",W.leaders(s,{leagueId:ui.league,stat:"rating"}),fRating,`Mínimo de ${aw.min} jogos.`)}${table(s,"MELHORES EM CAMPO",W.leaders(s,{leagueId:ui.league,stat:"motm"}),fMotm)}${table(s,"GOLEIROS",W.leaders(s,{leagueId:ui.league,stat:"saves"}).filter(r=>r.pos==="GOL"),fSaves)}</div>
        <section class="wa-card wide"><small>SELEÇÃO DA TEMPORADA · 4-3-3</small>${xiView(s,aw.xi,aw.xiComplete)}</section>`;
      }
      const hist=archive.filter(a=>a.champion);
      body+=`<section class="wa-card wide"><small>CAMPEÕES E VENCEDORES</small>${hist.length?`<ul class="wa-list">${hist.map(a=>`<li><span>${a.season}</span><b>${esc(a.champion)}</b><small>${esc((a.awards.find(w=>w.cat==="craque")||{}).name||"")}</small></li>`).join("")}</ul>`:`<p class="wa-note">O histórico começa ao fim da primeira temporada.</p>`}</section>`;
    }else if(ui.league){
      const S=root.ProLifeStatistics,r=S.rankingDashboard(s,ui.league,10);
      const rows=(list,f)=>(list||[]).map(x=>({...x,apps:x.appearances,pos:x.position,hero:x.id==="hero",value:x.value,f}));
      body=`<div class="wa-cols">${table(s,"ARTILHARIA",rows(r.goals),x=>val("gols",x.value))}${table(s,"ASSISTÊNCIAS",rows(r.assists),x=>val("assistencias",x.value))}${table(s,"DESEMPENHO",rows(r.performance),x=>val("nota",x.average??x.value))}</div>`;
      const stored=(S.init(s).root.awards||[]).filter(a=>a.leagueId===ui.league).slice(0,12);
      body+=`<section class="wa-card wide"><small>PRÊMIOS REGISTRADOS</small>${stored.length?`<div class="wa-awards">${stored.map(a=>awardCard(s,{label:`${a.name} · ${a.season}`,playerId:a.winnerId,name:a.winner,clubId:a.winnerClubId,club:a.winnerClub||"Clube não registrado",unit:"texto",value:WS().formatByName(a.name,a.value)})).join("")}</div>`:`<p class="wa-note">Nenhum prêmio encerrado nesta competição ainda.</p>`}</section>`;
    }else body=`<p class="wa-note">Nenhuma competição disponível.</p>`;
    return `${filters}${body}`;
  }

  // ---------- Mundo ----------
  function mundo(s){
    const W=WS();if(!W.competitions(s).length)return `<p class="wa-note">Nenhuma liga mundial simulada nesta carreira.</p>`;
    const w=W.worldAwards(s);
    const coaches=W.coachesTop(s,8);
    return `<section class="wa-card wide wa-awards-panel"><header class="wa-section-head"><div><small>PRÊMIOS MUNDIAIS · PARCIAL</small><h3>Destaques da temporada</h3></div><p>Jogadores e treinadores são avaliados com todos os campeonatos registrados na temporada. Jogos, gols, assistências, notas, defesas, prêmios em campo, pontos e títulos são consolidados sem duplicar partidas.</p></header><div class="wa-awards">${w.awards.map(a=>awardCard(s,a,a.leagueId?W.competitions(s).find(c=>c.id===a.leagueId)?.name:"")).join("")}${missingCards(w.insufficient)}</div></section>
    <div class="wa-cols">${table(s,"ARTILHEIROS GLOBAIS",W.leaders(s,{stat:"goals",limit:10}),fGoals,"Total consolidado por jogador em todas as competições registradas.")}${table(s,"ASSISTÊNCIAS GLOBAIS",W.leaders(s,{stat:"assists",limit:10}),fAssist,"Total consolidado por jogador em todas as competições registradas.")}${table(s,"MELHOR DESEMPENHO",W.leaders(s,{stat:"rating",limit:10}),fRating,"Média ponderada por jogos em todas as competições registradas.")}${table(s,"JOVENS DESTAQUES (até 21 anos)",W.youngLeaders(s,10),fRating)}${table(s,"GOLEIROS EM DESTAQUE",W.keepersTop(s,10),fSaves)}</div>
    <section class="wa-card wide"><small>TREINADORES EM DESTAQUE · TODAS AS COMPETIÇÕES</small>${coaches.length?`<ul class="wa-list">${coaches.map((c,i)=>`<li><span>${i+1}</span><b>${esc(c.name)}</b><small>${esc(c.club)} · ${c.competitionCount} competição(ões)${c.games?` · ${c.wins}V ${c.draws}E ${c.losses}D`:""}${c.titles?` · ${c.titles} título(s)`:""}</small><em>${esc(val("pontos",c.value))}</em></li>`).join("")}</ul>`:`<p class="wa-note">Dados insuficientes: ainda não há desempenho técnico registrado.</p>`}</section>`;
  }

  // ---------- Minha carreira ----------
  function carreira(s){
    const W=WS(),hid=heroLeagueId(s),mine=W.heroAwards(s);
    const old=(root.ProLifeStatistics?.init(s).root.awards||[]).filter(a=>a.winner===(s.person?.name));
    const all=[...mine.map(a=>({season:a.season,title:a.label,sub:a.league,club:a.club,txt:val(a.unit,a.value)})),...old.map(a=>({season:a.season,title:a.name,sub:a.league||"Geral",club:a.winnerClub,txt:W.formatByName(a.name,a.value)}))].sort((x,y)=>y.season-x.season);
    const trophies=all.length?`<div class="wa-awards">${all.map(a=>awardCard(s,{label:`${a.title} · ${a.season}`,playerId:"hero",name:s.person?.name||"Protagonista",club:a.club||"Clube não registrado",unit:"texto",value:a.txt,hero:true},a.sub)).join("")}</div>`:`<p class="wa-note">Sua sala de troféus será preenchida quando você vencer um prêmio. Nenhum prêmio é dado por fama ou por ser o protagonista.</p>`;
    const st=hid&&isWorld(s,hid)?W.heroStanding(s,hid):null;
    const bySeason=new Map();for(const a of all){if(!bySeason.has(a.season))bySeason.set(a.season,0);bySeason.set(a.season,bySeason.get(a.season)+1);}
    const nom=st?`<ul class="wa-list"><li><span>Gols</span><b>${st.rankGoals?`${st.rankGoals}º`:"—"}</b><small>${esc(val("gols",st.goals))}</small></li><li><span>Assistências</span><b>${st.rankAssists?`${st.rankAssists}º`:"—"}</b><small>${esc(val("assistencias",st.assists))}</small></li><li><span>Nota média</span><b>${st.rankRating?`${st.rankRating}º`:"—"}</b><small>${st.apps?esc(val("nota",st.avg)):"Dados insuficientes"}</small></li></ul>`:`<p class="wa-note">Posições detalhadas aparecem para ligas mundiais simuladas. Para competições brasileiras, veja a aba Competições.</p>`;
    const seasons=[...bySeason.entries()].sort((a,b)=>b[0]-a[0]);
    return `<section class="wa-card wide"><small>SALA DE TROFÉUS</small><div class="wa-strip"><div><b>${all.length}</b><span>prêmios</span></div><div><b>${bySeason.size}</b><span>temporadas premiadas</span></div></div>${trophies}</section>
    <div class="wa-grid"><section class="wa-card"><small>CLASSIFICAÇÃO NOS RANKINGS · TEMPORADA ${esc(s.season)}</small>${nom}</section><section class="wa-card"><small>PRÊMIOS POR TEMPORADA</small>${seasons.length?`<ul class="wa-list">${seasons.map(([y,n])=>`<li><span>${y}</span><b>${n} prêmio(s)</b></li>`).join("")}</ul>`:`<p class="wa-note">Sem prêmios registrados.</p>`}</section></div>`;
  }

  function css(){
    return `<style>.wa-dark{--wa-card:#101c27;--wa-deep:#071018;--wa-line:rgba(187,211,225,.15);--wa-text:#f5f7f8;--wa-muted:#91a0ab;--wa-gold:#caff27;--wa-teal:#25e69a;padding:26px;border-radius:4px;background:radial-gradient(circle at 86% 4%,rgba(55,111,116,.18),transparent 26%),linear-gradient(145deg,#09131c,#071018 58%,#0b171f);color:var(--wa-text);border:1px solid var(--wa-line);box-shadow:0 24px 70px #0008}
.wa-dark>h2{margin:4px 0 5px;font-size:clamp(25px,3vw,38px);font-style:italic;text-transform:uppercase;letter-spacing:-.035em}.wa-dark>h2:before{content:"";display:inline-block;width:22px;height:4px;margin:0 10px 8px 0;background:var(--wa-gold);transform:skewX(-25deg)}.wa-dark small{color:var(--wa-muted);letter-spacing:.1em;text-transform:uppercase;font-size:10px}.wa-note{color:var(--wa-muted);font-size:12px;margin:8px 0;line-height:1.55}
.wa-tabs{display:flex;gap:5px;border-bottom:1px solid var(--wa-line);margin:17px 0 20px;flex-wrap:wrap}.wa-tabs button{position:relative;background:none;border:0;color:var(--wa-muted);padding:11px 17px;font:inherit;font-size:11px;font-weight:800;text-transform:uppercase;cursor:pointer}.wa-tabs button.active{color:var(--wa-text)}.wa-tabs button.active:after{content:"";position:absolute;left:8px;right:8px;bottom:-1px;height:3px;background:var(--wa-gold);transform:skewX(-22deg)}
.wa-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.wa-cols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:16px 0}.wa-cols>.wa-ranking:last-child:nth-child(odd){grid-column:1/-1;width:calc(50% - 8px);justify-self:center}.wa-card{min-width:0;background:linear-gradient(145deg,rgba(17,31,43,.98),rgba(11,24,34,.98));border:1px solid var(--wa-line);border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:inset 0 1px rgba(255,255,255,.025),0 12px 28px rgba(0,0,0,.16)}.wa-grid .wa-card,.wa-cols .wa-card{margin:0}.wa-card.wide{grid-column:1/-1}.wa-section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:16px}.wa-section-head h3,.wa-card-head h3{margin:4px 0 0;color:var(--wa-text);font-size:18px;line-height:1.15;text-transform:uppercase;letter-spacing:.025em}.wa-section-head p{max-width:580px;margin:0;color:var(--wa-muted);font-size:12px;line-height:1.55;text-align:right}.wa-card-head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--wa-line)}.wa-card-head>span{display:inline-flex;align-items:center;height:25px;padding:0 9px;border:1px solid rgba(202,255,39,.28);border-radius:4px;color:var(--wa-gold);font-size:9px;font-weight:900;letter-spacing:.08em}.wa-ranking{padding:18px}
.wa-filters{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end;margin-bottom:14px}.wa-filters label{display:flex;flex-direction:column;gap:4px;font-size:11px;color:var(--wa-muted);text-transform:uppercase;letter-spacing:.1em}.wa-filters select{min-width:220px;max-width:100%}
.wa-awards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:0}.wa-award{position:relative;min-height:146px;overflow:hidden;border:1px solid var(--wa-line);border-radius:10px;padding:0 16px 0 0;display:grid;grid-template-columns:112px minmax(0,1fr);align-items:center;background:linear-gradient(125deg,rgba(27,47,61,.98),rgba(11,23,33,.98));transition:border-color .18s ease,transform .18s ease}.wa-award:hover{transform:translateY(-2px);border-color:rgba(202,255,39,.34)}.wa-award:after{content:"";position:absolute;right:-30px;top:-55px;width:115px;height:190px;background:linear-gradient(150deg,transparent,rgba(202,255,39,.065));transform:rotate(18deg);pointer-events:none}.wa-award-visual{position:relative;align-self:stretch;display:flex;align-items:flex-end;justify-content:center;background:linear-gradient(145deg,rgba(202,255,39,.12),transparent 68%);border-right:1px solid var(--wa-line)}.wa-award-rank{position:absolute;left:10px;top:9px;z-index:2;color:var(--wa-gold);font-size:17px;font-style:normal}.wa-award-copy{position:relative;z-index:1;min-width:0;display:flex;flex-direction:column;gap:6px;padding-left:15px}.wa-award-copy>small{line-height:1.35}.wa-award-copy>b{font-size:18px;line-height:1.08;overflow-wrap:anywhere}.wa-award-copy>span{display:flex;align-items:center;gap:8px;color:var(--wa-muted);font-size:11px;min-width:0}.wa-award-copy>em{font-style:normal;color:var(--wa-gold);font-size:13px;font-weight:900;text-transform:uppercase}.wa-award.hero{border-color:rgba(202,255,39,.75);box-shadow:inset 0 0 24px rgba(202,255,39,.07)}.wa-award.off{display:flex;min-height:110px;padding:18px;opacity:.55;flex-direction:column;align-items:flex-start;justify-content:center;gap:6px}.wa-award.off>b{font-size:16px}.wa-award.off>span{color:var(--wa-muted);font-size:11px}.wa-awards>.wa-award:last-child:nth-child(3n+1){grid-column:2}
.wa-face{position:relative;display:grid;place-items:center;overflow:hidden;flex:none;border:1px solid rgba(202,255,39,.28);border-radius:7px;background:linear-gradient(145deg,#243849,#0b1924);color:var(--wa-gold);font-weight:900}.wa-face img{width:100%;height:100%;display:block;object-fit:cover}.wa-face-lg{width:92px;height:116px;border-width:0;border-radius:0;background:transparent}.wa-face-sm{width:38px;height:42px}.wa-face.coach{width:70px;height:70px;margin:auto;border-radius:50%;font-size:20px;background:linear-gradient(145deg,#304553,#111d27)}.wa-crest{display:inline-grid;place-items:center;width:23px;height:23px;flex:none;border-radius:50%;background:#263641;color:#dfe8ec;font-size:8px;font-weight:900}.wa-crest.has-image{background:transparent}.wa-crest img,.wa-club-cell img,.wa-xi-p img{width:100%;height:100%;object-fit:contain}
.wa-table{width:100%;border-collapse:separate;border-spacing:0;font-size:12px;table-layout:fixed}.wa-table th,.wa-table td{text-align:left;padding:9px 7px;border-bottom:1px solid var(--wa-line);vertical-align:middle}.wa-table th{color:var(--wa-muted);font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.1em}.wa-table th:nth-child(1),.wa-table td:nth-child(1){width:38px}.wa-table th:nth-child(2),.wa-table td:nth-child(2){width:34%}.wa-table th:nth-child(3),.wa-table td:nth-child(3){width:auto}.wa-table .wa-apps-col{width:34px;text-align:center}.wa-table .wa-metric-col{width:90px;text-align:right;white-space:nowrap}.wa-table td small{display:block;text-transform:none;letter-spacing:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.wa-table tr.hero{background:rgba(202,255,39,.075)}.wa-table tbody tr:hover{background:rgba(255,255,255,.04)}.wa-table tbody tr:last-child td{border-bottom:0}.wa-position{display:grid;place-items:center;width:27px;height:27px;border-radius:5px;background:#1a2b37;color:var(--wa-gold);font-size:11px}.wa-player-cell,.wa-club-cell{display:flex;align-items:center;gap:9px;min-width:0}.wa-player-cell>span,.wa-club-cell>span{min-width:0;overflow:hidden}.wa-player-cell b,.wa-club-cell>span{display:block;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.wa-club-cell{white-space:normal}.wa-ranking>.wa-note{margin:-4px 0 10px}
.wa-list{list-style:none;margin:8px 0 0;padding:0}.wa-list li{display:flex;gap:12px;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--wa-line)}.wa-list small{flex:1;text-transform:none;letter-spacing:0}.wa-list em{font-style:normal;color:var(--wa-gold)}
.wa-strip{display:flex;gap:26px;margin:10px 0}.wa-strip b{display:block;font-size:26px;font-variant-numeric:tabular-nums}.wa-strip span{color:var(--wa-muted);font-size:12px}
.wa-xi{display:flex;flex-direction:column;gap:10px;margin-top:12px;padding:18px;background:linear-gradient(180deg,rgba(14,74,55,.38),rgba(5,39,31,.5));border:1px solid rgba(60,168,120,.2);border-radius:9px}.wa-xi-line>div{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}.wa-xi-line>small{display:block;text-align:center;margin-bottom:5px;color:#a7cfbf}.wa-xi-p{border:1px solid var(--wa-line);border-radius:7px;padding:7px;min-width:165px;display:flex;align-items:center;gap:8px;text-align:left;background:rgba(7,22,28,.82)}.wa-xi-p>span{display:flex;min-width:0;flex-direction:column}.wa-xi-p em,.wa-xi-p i{display:flex;align-items:center;gap:5px;font-style:normal;color:var(--wa-muted);font-size:10px}.wa-xi-p .wa-crest{width:18px;height:18px}
.wa-dark button:focus-visible,.wa-dark select:focus-visible{outline:2px solid var(--wa-gold);outline-offset:2px}
@media(max-width:1180px){.wa-awards{grid-template-columns:repeat(2,minmax(0,1fr))}.wa-awards>.wa-award:last-child:nth-child(3n+1){grid-column:auto}.wa-awards>.wa-award:last-child:nth-child(odd){grid-column:1/-1;max-width:calc(50% - 6px);width:100%;justify-self:center}.wa-cols{grid-template-columns:1fr}.wa-cols>.wa-ranking:last-child:nth-child(odd){grid-column:auto;width:auto}}@media(max-width:900px){.wa-dark{padding:16px}.wa-grid{grid-template-columns:1fr}.wa-section-head{align-items:flex-start;flex-direction:column;gap:7px}.wa-section-head p{text-align:left}.wa-awards{grid-template-columns:1fr}.wa-awards>.wa-award:last-child:nth-child(odd){grid-column:auto;max-width:none}.wa-card{padding:16px}}@media(max-width:620px){.wa-dark{padding:12px}.wa-table{min-width:620px}.wa-ranking{overflow:auto}.wa-ranking .wa-card-head,.wa-ranking>.wa-note{position:sticky;left:0}.wa-award{grid-template-columns:92px minmax(0,1fr)}.wa-face-lg{width:80px;height:108px}}</style>`;
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
