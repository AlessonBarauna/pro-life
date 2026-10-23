(function competitionsHubModule(root){
  "use strict";
  // Stage 34F.29A - Central mundial de competicoes: uma unica navegacao para ligas do mundo, competicoes brasileiras,
  // continentais, mundiais e selecoes. Comeca pelas competicoes do clube do protagonista.
  // So le o estado; nada aqui altera calendario, resultados ou historico.
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const ui={section:"minhas",continent:"ALL",country:"ALL",leagueId:null,tab:"geral",season:"atual",round:null,query:""};
  const SECTIONS=[["minhas","Minhas competições"],["ligas","Ligas nacionais"],["copas","Copas nacionais"],["continentais","Continentais"],["mundiais","Mundiais"],["selecoes","Seleções"],["historico","Histórico e estatísticas"]];
  const TABS=[["geral","Resumo"],["tabela","Tabela"],["calendario","Jogos"],["stats","Estatísticas"],["clubes","Clubes"],["historico","Campeões"]];
  const STATUS={playable:["Jogável","ok"],regional_pool:["Grupo regional","warn"],catalog_only:["Somente consulta","off"],partial:["Cobertura parcial","warn"],catalog_info:["Informação do catálogo","off"]};
  // Continente por pais (nomes em portugues do catalogo). Pais desconhecido cai em "Outros".
  const CONT={Europa:["Espanha","Inglaterra","Alemanha","França","Itália","Turquia","Portugal","Bélgica","Grécia","Países Baixos","Tchéquia","Noruega","Escócia","Dinamarca","Ucrânia","Croácia","Hungria","Suíça","Áustria","Polônia","Chipre","Bulgaria","Bulgária","Azerbaijão","Romênia","Suécia","Finlândia","Irlanda","País de Gales","Sérvia","Eslováquia","Eslovênia","Israel"],
    "América do Sul":["Brasil","Argentina","Uruguai","Colômbia","Chile","Paraguai","Equador","Peru"],"América do Norte":["Estados Unidos","México","Canadá"],
    Ásia:["Arábia Saudita","Emirados Árabes Unidos","Coreia do Sul","China","Índia","Japão","Tailândia","Catar"],Oceania:["Australia","Austrália","Nova Zelândia"],África:["África do Sul","Egito","Marrocos"]};
  const CONT_OF=new Map();for(const [c,list] of Object.entries(CONT))for(const n of list)CONT_OF.set(n,c);
  // 34F.31E: o catalogo traz alguns paises em ingles; derivam para o mesmo continente.
  for(const [n,c] of [["Republic of Ireland","Europa"],["Ireland","Europa"],["Thailand","Ásia"],["Saudi Arabia","Ásia"],["South Korea","Ásia"],["Japan","Ásia"],["China PR","Ásia"],["United States","América do Norte"],["Mexico","América do Norte"],["Australia","Oceania"],["Egypt","África"],["Morocco","África"],["South Africa","África"]])if(!CONT_OF.has(n))CONT_OF.set(n,c);
  const plain=v=>String(v==null?"":v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  // Fase da liga na temporada atual, derivada dos jogos realmente disputados (nunca de data).
  function phase(s,D,c){
    if(c.status==="catalog_only")return "Somente catálogo · ainda sem integração de calendário";
    if(c.status==="catalog_info")return "Informação do catálogo";
    const api=W(D);let rows=[];
    try{rows=c.world?(api?.standings?.(s,c.id)||[]):(D.table?.(s,c.id)||[]);}catch(e){rows=[];}
    if(!rows.length)return "Próxima temporada";
    const played=Math.max(0,...rows.map(r=>Number((r.stats||r).played||0)));
    const n=rows.length,rounds=c.world?(2*(n%2?n:n-1)):(2*(n-1));
    if(played>=rounds&&rounds>0)return "Encerrada";
    if(played>0)return `Em andamento · rodada ${played}/${rounds}`;
    return "Próxima temporada";
  }
  const continentOf=(country,id)=>/conmebol/i.test(id||"")?"América do Sul":CONT_OF.get(country)||"Outros";
  // Competicoes ainda NAO simuladas: aparecem apenas como roteiro, claramente marcadas.
  const PLANNED=[["UEFA Champions League","Europa"],["UEFA Europa League","Europa"],["UEFA Conference League","Europa"],["CONMEBOL Libertadores","América do Sul"],["CONMEBOL Sudamericana","América do Sul"],["Mundial de Clubes","Mundo"]];

  const W=D=>D?.WorldClubCompetitions||root.ProLifeWorldClubCompetitions;
  const N=()=>root.ProLifeNames;
  const club=(s,id)=>N()?N().club(s,id):String(id);
  const cr=id=>{const c=root.ProLifeClubCrests;return c&&c.inline?c.inline(id,'sm'):'';};
  const dateOf=d=>new Date(2026,0,1+Number(d||0)).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"});
  const heroClub=s=>(root.ProLifeCareerContext?.clubOf?.(s))||(s.clubs||[]).find(c=>c.id===s.clubId)||null;
  const CONTI=()=>root.ProLifeContinental||(root.ProLife&&root.ProLife.Continental)||null;

  // ---------- catalogo de competicoes ----------
  function catalog(s,D){
    const out=[],api=W(D);
    const cov=api?.coverage?.(s)||[],played=new Set(Object.keys(s.globalFootball?.worldCompetitions?.leagues||{}));
    for(const c of cov){
      const continental=/conmebol|uefa|concacaf|afc_|caf_/i.test(c.leagueId);
      const status=c.status==="catalog_only"?"catalog_only":c.status==="regional_pool"?"regional_pool":played.has(c.leagueId)?"playable":"partial";
      // Liga FC27 de um pais que ja tem sistema nacional jogavel proprio (Brasil): vira so informacao do catalogo, nunca uma 2a competicao.
      const dupNational=(c.country==="Brasil")&&(s.leagues||[]).length>0&&!(s.leagues||[]).some(l=>l.id===c.leagueId);
      out.push({id:c.leagueId,name:c.name,country:c.country||"",continent:continentOf(c.country,c.leagueId),kind:dupNational?"catalogo":continental?"continental":"liga",status:dupNational?"catalog_info":status,clubCount:c.clubCount,note:c.note||"",world:true});
    }
    for(const l of s.leagues||[])out.push({id:l.id,name:l.name,country:"Brasil",continent:"América do Sul",kind:"liga",status:"playable",clubCount:(s.clubs||[]).filter(c=>c.leagueId===l.id).length,note:"",world:false,brazil:true});
    return out;
  }
  function brazilCups(s){
    const out=[],C=root.ProLifeCompetitions;
    try{C?.init?.(s);}catch(e){}
    const cup=s.competitionSchedule?.cup;
    if(cup)out.push({id:"copaBrasil",name:"Copa do Brasil",country:"Brasil",continent:"América do Sul",kind:"copa",status:"playable",champion:cup.champion||null});
    for(const st of (C?.allStates?.(s)||[]))out.push({id:st.id,name:st.name,country:"Brasil",continent:"América do Sul",kind:"copa",status:st.entrants?.length>=2?"playable":"partial",champion:st.champion||null,entrants:st.entrants?.length||0,state:st});
    return out;
  }

  // ---------- componentes ----------
  const chip=(status)=>{const [l,t]=STATUS[status]||[status,"off"];return `<span class="ch-chip ${t}">${esc(l)}</span>`;};
  const NAV=[["minhas","Minhas competições"],["ligas","Ligas"],["copas","Copas"],["continentais","Continentais"],["mundiais","Mundo"],["historico","Histórico"]];
  function nav(){
    const cur=ui.section==="selecoes"?"mundiais":ui.section;
    return `<nav class="ch-nav" role="tablist" aria-label="Seções">${NAV.map(([id,l])=>`<button type="button" role="tab" aria-selected="${cur===id}" class="${cur===id?"active":""}" data-ch-section="${id}">${l}</button>`).join("")}</nav>`;
  }
  function filters(s,cat){
    const conts=[...new Set(cat.map(c=>c.continent))].sort(),countries=[...new Set(cat.filter(c=>ui.continent==="ALL"||c.continent===ui.continent).map(c=>c.country).filter(Boolean))].sort();
    const seasons=[...new Set([s.season,...(W({})?.history?.(s)||[]).map(h=>h.season)])].sort((a,b)=>b-a);
    return `<div class="ch-filters"><label>Continente<select data-ch-continent><option value="ALL">Todos</option>${conts.map(c=>`<option ${ui.continent===c?"selected":""}>${esc(c)}</option>`).join("")}</select></label><label>Buscar<input type="search" data-ch-query value="${esc(ui.query||"")}" placeholder="Buscar liga ou país" /></label><label>Temporada<select data-ch-season><option value="atual" ${ui.season==="atual"?"selected":""}>Atual (${esc(s.season)})</option>${seasons.filter(y=>y!==s.season).map(y=>`<option value="${y}" ${String(ui.season)===String(y)?"selected":""}>${y}</option>`).join("")}</select></label></div>`;
  }
  const logo=(c,size)=>root.ProLifeLeagueLogos?root.ProLifeLeagueLogos.render(c.id,c.name,{size:size||44}):"";
  function card(c,s,D){
    const open=c.status==="playable"||c.status==="regional_pool",hc=heroClub(s),mine=!!hc&&c.id===hc.leagueId;
    const ph=phase(s,D,c);
    return `<article class="ch-lg ${open?"":"off"} ${mine?"mine":""}"><span class="ch-lg-logo">${logo(c)}</span><div class="ch-lg-t"><b>${esc(c.name)}</b><small>${esc(c.country||c.continent)}${c.clubCount?` · ${c.clubCount} clubes`:""}</small>${open?`<span class="ch-lg-s">${mine?"Sua liga · ":""}${esc(ph)}</span>`:`${chip(c.status)}<span class="ch-lg-s off">${esc(ph)}</span>`}</div>${open?`<button type="button" data-ch-open="${esc(c.id)}">Abrir</button>`:""}</article>`;
  }
  const empty=t=>`<p class="ch-note">${esc(t)}</p>`;

  // ---------- Minhas competicoes ----------
  function minhas(s,D,cat){
    const hc=heroClub(s),items=[];
    if(!hc)return `<section class="ch-box"><small>MINHAS COMPETIÇÕES</small>${empty("Você está sem clube. As competições do seu clube aparecem aqui assim que assinar com um.")}</section>`;
    const lg=cat.find(c=>c.id===hc.leagueId),api=W(D);
    let next="";
    if(false&&lg?.world&&api?.nextFixture){const f=api.nextFixture(s,lg.id,hc.id);if(f)next=`<p class="ch-note">Próximo jogo: <b>${esc(club(s,f.home))} × ${esc(club(s,f.away))}</b> · ${dateOf(f.date)} · rodada ${f.round}</p>`;}
    const mine=[];
    let nc=null;try{nc=D.nextCommitment?.(s);}catch(e){}
    const banner=nc&&nc.home&&nc.away?`<div class="ch-next"><small>PRÓXIMO JOGO</small><div class="ch-next-m"><span>${cr(nc.home)}<b>${esc(club(s,nc.home))}</b></span><em>×</em><span><b>${esc(club(s,nc.away))}</b>${cr(nc.away)}</span></div><span class="ch-next-i">${esc(nc.competitionName||"")}${nc.round?` · rodada ${nc.round}`:""} · ${dateOf(nc.date)}</span></div>`:"";
    if(lg)mine.push(`<article class="ch-main"><span class="ch-lg-logo big">${logo(lg,52)}</span><small>${esc(lg.country)} · liga</small><h3>${esc(lg.name)}</h3>${pos(s,D,lg,hc)}<button type="button" class="primary" data-ch-open="${esc(lg.id)}">Abrir</button></article>`);
    for(const cup of brazilCups(s)){
      const part=cup.id==="copaBrasil"?(s.competitionSchedule?.cup?.entrants||s.competitionSchedule?.cup?.participants||[]).some?.(x=>(x.id||x)===hc.id):cup.state?.entrants?.includes(hc.id);
      if(part)mine.push(`<article class="ch-main"><small>Copa nacional</small><h3>${esc(cup.name)}</h3>${cup.champion?`<p class="ch-note">Campeão: ${esc(cup.champion?.name||cup.champion)}</p>`:`<p class="ch-note">Em disputa</p>`}<button type="button" data-ch-section="copas">Ver</button></article>`);
    }
    const ce=(()=>{try{return CONTI()?.heroEntries?.(s)||[];}catch(e){return [];}})();
    if(ce.length)for(const e of ce){const route={ucl:"champions",uel:"europa",uecl:"conference",lib:"libertadores",sud:"sudamericana"}[e.comp],live=!!CONTI().edition?.(s,e.comp)?.leagueSchedule;mine.push(`<article class="ch-main"><span class="ch-lg-logo big">${logo({id:e.comp,name:e.name},52)}</span><small>${esc(CONTI().COMPS[e.comp].conf)} · continental</small><h3>${esc(e.name)}</h3><p class="ch-note">${esc(String(e.via).replace("liga:","").replace(/^(\d+)$/,"Classificado em $1º na liga"))}${e.status==="adapted"?" · edição adaptada":""}</p>${route&&live?`<button type="button" class="primary" data-page="${route}">Abrir</button>`:`<button type="button" data-ch-section="continentais">Ver inscritos</button>`}</article>`);}
    else mine.push(`<article class="ch-main off"><small>Continentais</small><h3>Sem vaga continental</h3><p class="ch-note">Termine bem na liga para se classificar.</p></article>`);
    return `${banner}<section class="ch-box"><small>MINHAS COMPETIÇÕES · ${esc(hc.name)}</small><div class="ch-mine">${mine.join("")}</div></section>`;
  }
  function pos(s,D,lg,hc){
    let rows=[];
    if(lg.world)rows=W(D)?.standings?.(s,lg.id)||[];else rows=D.table?.(s,lg.id)||[];
    const i=rows.findIndex(r=>r.id===hc.id);if(i<0)return "";
    const r=rows[i],st=r.stats||r;
    return `<div class="ch-strip"><div><b>${i+1}º</b><span>de ${rows.length}</span></div><div><b>${st.points??0}</b><span>pontos</span></div><div><b>${st.played??0}</b><span>jogos</span></div><div><b>${st.gd??((st.gf||0)-(st.ga||0))}</b><span>saldo</span></div></div>`;
  }

  // ---------- listas ----------
  function listSection(s,D,cat,kind){
    const info=kind==="liga"?cat.filter(c=>c.kind==="catalogo"):[];
    let list=cat.filter(c=>c.kind===kind);
    if(ui.continent!=="ALL")list=list.filter(c=>c.continent===ui.continent);
    if(ui.country!=="ALL")list=list.filter(c=>c.country===ui.country);
    if(ui.query){const q=plain(ui.query);list=list.filter(c=>plain(c.name).includes(q)||plain(c.country).includes(q));}
    const hc=heroClub(s),rank=c=>(hc&&c.id===hc.leagueId?0:hc&&c.country===(cat.find(x=>x.id===hc.leagueId)||{}).country?1:2);
    const open=list.filter(c=>c.status!=="catalog_only").sort((a,b)=>rank(a)-rank(b)||String(a.name).localeCompare(String(b.name)));
    const only=list.filter(c=>c.status==="catalog_only");
    return `${filters(s,cat)}<div class="ch-list ch-lgs">${open.map(c=>card(c,s,D)).join("")||empty("Nenhuma competição para os filtros escolhidos.")}</div>${only.length?`<details class="ch-more"><summary>Somente consulta (${only.length}) · sem calendário simulado</summary><div class="ch-list ch-lgs">${only.map(c=>card(c,s,D)).join("")}</div></details>`:""}${info.length?`<p class="ch-note"><small>INFORMAÇÃO DO CATÁLOGO FC 27</small><br>${info.map(c=>`<b>${esc(c.name)}</b>: não é uma competição independente. O Brasil já é disputado aqui pelo Brasileirão Séries A, B, C e D.`).join(" ")}</p>`:""}`;
  }
  function copas(s,D,cat){
    const cups=brazilCups(s),row=(id,name,sub,btn,off)=>`<article class="ch-lg ${off?"off":""}"><span class="ch-lg-logo">${logo({id,name},44)}</span><div class="ch-lg-t"><b>${esc(name)}</b><small>${esc(sub)}</small></div>${btn||""}</article>`;
    const sub=c=>c.champion?`Campeão: ${c.champion.name||c.champion}`:c.status==="playable"?"Em disputa":"Poucos clubes para disputar";
    const nat=cups.filter(c=>c.id==="copaBrasil").map(c=>row(c.id,c.name,`Brasil · ${sub(c)}`,`<button type="button" data-page="league">Abrir</button>`));
    const eng=[["fa_cup","FA Cup"],["efl_cup","EFL Cup"],["community_shield","Community Shield"]].map(([id,n])=>row(id,n,"Inglaterra",`<button type="button" data-page="englishCups">Abrir</button>`));
    const st=cups.filter(c=>c.id!=="copaBrasil").map(c=>row(c.id,c.name,`${c.entrants?`${c.entrants} clubes · `:""}${sub(c)}`,"",c.status!=="playable"));
    return `<div class="ch-sec"><small>COPAS</small><div class="ch-list ch-lgs">${nat.concat(eng).join("")}</div></div><div class="ch-sec"><small>CAMPEONATOS ESTADUAIS</small><div class="ch-list ch-lgs">${st.join("")||empty("Nenhum estadual nesta carreira.")}</div></div>`;
  }
  function continentais(s,D,cat){
    const C=CONTI();let eds=[];try{eds=C?C.editions(s,s.season):[];}catch(e){}
    const step={ucl:"32B",uel:"32C",uecl:"32C",lib:"32E",sud:"32F"};
    const chip2=e=>e.status==="unavailable"?'<span class="ch-chip off">Indisponível</span>':e.status==="adapted"?'<span class="ch-chip warn">Inscrições adaptadas</span>':'<span class="ch-chip ok">Inscrições definidas</span>';
    const cards=eds.map(e=>{const def=C.COMPS[e.comp],hero=s.clubId,route={ucl:"champions",uel:"europa",uecl:"conference",lib:"libertadores",sud:"sudamericana"}[e.comp],live=!!e.leagueSchedule;
      const list=e.entrants.map(x=>`<li><span>${esc(club(s,x[0]))}${x[0]===hero?" · SEU CLUBE":""}</span><small>${esc(x[1])} · ${esc(String(x[2]).replace("liga:",""))}º colocado</small></li>`).join("");
      return `<article class="ch-card ${live?"":"off"}"><span class="ch-lg-logo">${logo({id:e.comp,name:def.name},48)}</span><div><small>${esc(def.conf)} · temporada ${esc(e.season)}</small><b>${esc(def.name)}</b></div>${chip2(e)}<p>${esc(def.note)}</p><p class="ch-note">${e.count} de ${e.required} participantes por mérito. ${live?"Calendário, classificação, mata-mata e resultados são simulados nesta edição.":"Somente inscrições e critérios de vaga estão implementados; ainda não há partidas, classificação de grupos, campeão, estatísticas ou premiações oficiais nesta edição."}</p>${route&&live?`<button type="button" data-page="${route}">Abrir competição</button>`:""}${e.reasons.length?`<details><summary>Limitações e regras desta edição</summary><ul class="ch-ul">${e.reasons.map(r=>`<li><small>${esc(r)}</small></li>`).join("")}</ul></details>`:""}<details><summary>Clubes inscritos (${e.count})</summary><ul class="ch-ul">${list||"<li><small>Nenhum clube identificável.</small></li>"}</ul></details></article>`;}).join("");
    const planned=(C?C.PLANNED:[]).map(p=>`<article class="ch-card off"><div><small>${esc(p.conf)}</small><b>${esc(p.name)}</b></div><span class="ch-chip off">Planejada</span><p>${esc(p.reason)} Etapa ${esc(p.step)}.</p></article>`).join("");
    return `<p class="ch-note">Vagas continentais por classificação nacional (distribuição adaptada do PRO-LIFE, não a tabela oficial de coeficientes). Sem clubes fictícios: quando faltam clubes reais no catálogo, a edição é marcada como adaptada.</p><div class="ch-list">${cards}${planned}</div>`;
  }
  function mundiais(){
    return `${selecoes()}<div class="ch-list"><article class="ch-card off"><span class="ch-lg-logo">${logo({id:"mundial",name:"Mundial de Clubes"},48)}</span><div><small>Mundo</small><b>Mundial de Clubes</b></div><span class="ch-chip off">Planejada</span><p>Depende dos torneios continentais de clubes. Ainda não é simulada.</p></article></div>`;
  }
  function selecoes(){
    return `<article class="ch-main" style="margin-bottom:12px"><small>Seleções</small><h3>Copa do Mundo, Eurocopa, Copa América</h3><div class="ch-actions"><button type="button" class="primary" data-page="national">Abrir Seleção</button></div></article>`;
  }
  // "Minha trajetoria": o que o meu clube disputou em cada temporada encerrada e quem foi campeao.
  function minhaTrajetoria(s,D,cat,hc){
    const rows=[];
    for(const h of s.history||[]){
      if(h.event||h.season==null)continue;
      if(h.position&&h.leagueId){const comp=cat.find(c=>c.id===h.leagueId)||{id:h.leagueId,name:h.league};rows.push({season:h.season,comp,name:h.league||comp.name,pos:h.position,champion:h.champion,title:h.position===1});}
      else if(h.trophy&&hc&&h.championId===hc.id)rows.push({season:h.season,comp:{id:h.competitionId,name:h.league},name:h.league,pos:1,champion:h.champion||hc.name,title:true});
    }
    for(const h of (s.englishCups?.history||[])){
      if(hc&&(h.championId===hc.id||h.runnerUpId===hc.id))rows.push({season:h.season,comp:{id:h.comp,name:h.name},name:h.name,pos:h.championId===hc.id?1:2,champion:club(s,h.championId),title:h.championId===hc.id,final:true});
    }
    if(!rows.length)return `<section class="ch-box ch-mytraj"><small>MINHA TRAJETÓRIA</small><h3>Suas competições, temporada a temporada</h3>${empty("Quando uma temporada terminar, aparecem aqui as competições que seu clube disputou, sua posição e o campeão de cada uma.")}</section>`;
    const by=new Map();for(const r of rows){const k=String(r.season);if(!by.has(k))by.set(k,[]);by.get(k).push(r);}
    const seasons=[...by.entries()].sort((a,b)=>Number(b[0])-Number(a[0]));
    const titles=rows.filter(r=>r.title).length;
    return `<section class="ch-box ch-mytraj"><div class="ch-mytraj-h"><div><small>MINHA TRAJETÓRIA</small><h3>Suas competições, temporada a temporada</h3></div><div class="ch-strip"><div><b>${seasons.length}</b><span>temporada(s)</span></div><div><b>${titles}</b><span>título(s)</span></div></div></div>${seasons.map(([season,list])=>`<div class="ch-mytraj-s"><b>${esc(season)}</b><div class="ch-list ch-lgs">${list.map(r=>`<article class="ch-lg ${r.title?"mine":""}"><span class="ch-lg-logo">${logo(r.comp,44)}</span><div class="ch-lg-t"><b>${esc(r.name)}</b><small>${r.title?"Você foi campeão":r.final?"Você foi vice-campeão":`Você terminou em ${r.pos}º`}</small>${r.title?"":`<span class="ch-lg-s">Campeão: ${esc(r.champion||"—")}</span>`}</div></article>`).join("")}</div></div>`).join("")}</section>`;
  }
  function historico(s,D){
    const api=W(D),h=(api?.history?.(s)||[]).slice(0,60),ws=root.ProLifeWorldStats,cat=catalog(s,D),hc=heroClub(s);
    const groups=new Map();
    for(const x of h){const season=String(x.season??"—");if(!groups.has(season))groups.set(season,[]);groups.get(season).push(x);}
    const seasons=[...groups.entries()].sort((a,b)=>Number(b[0])-Number(a[0]));
    const latest=seasons[0]?.[0]||"—",champions=new Set(h.map(x=>x.championId||x.champion).filter(Boolean)).size;
    const card=x=>{const comp=cat.find(c=>c.id===x.leagueId)||{id:x.leagueId,name:x.league||"Competição",country:"Mundo",continent:"Mundo"};
      const champion=x.champion||(x.championId?club(s,x.championId):"")||"Campeão não registrado",mine=!!hc&&x.championId===hc.id;
      return `<article class="ch-history-card ${mine?"mine":""}"><span class="ch-history-league-logo">${logo(comp,42)}</span><div class="ch-history-meta"><small>${esc(comp.country||comp.continent||"Mundo")}</small><b>${esc(x.league||comp.name)}</b></div><div class="ch-history-winner"><span class="ch-history-crest">${x.championId?cr(x.championId):'<span class="ch-history-fallback">★</span>'}</span><div><small>${mine?"SEU CLUBE CAMPEÃO":"CAMPEÃO"}</small><strong>${esc(champion)}</strong></div></div></article>`;};
    const archive=seasons.map(([season,items],i)=>`<details class="ch-history-season" ${i===0?"open":""}><summary><span><small>TEMPORADA</small><b>${esc(season)}</b></span><span class="ch-history-count">${items.length} ${items.length===1?"competição":"competições"}</span><i aria-hidden="true">⌄</i></summary><div class="ch-history-grid">${items.map(card).join("")}</div></details>`).join("");
    const aw=ws?ws.history(s).filter(a=>a.leagueId==="world").slice(0,3):[];
    const mineSec=minhaTrajetoria(s,D,cat,hc);
    return `${mineSec}<header class="ch-history-hero"><div><small>TODAS AS LIGAS DO MUNDO · CAMPEÕES</small><h3>Hall dos Campeões</h3><p>Reviva cada temporada encerrada, com as competições e os clubes que levantaram a taça.</p></div><div class="ch-history-kpis"><span><small>Temporadas</small><b>${seasons.length}</b></span><span><small>Última edição</small><b>${esc(latest)}</b></span><span><small>Clubes campeões</small><b>${champions}</b></span></div></header>
    ${archive?`<section class="ch-history-archive" aria-label="Histórico de campeões">${archive}</section>`:`<section class="ch-box ch-history-empty"><span aria-hidden="true">◇</span><div><b>O Hall dos Campeões ainda está vazio</b>${empty("O histórico começa quando a primeira temporada for encerrada. Nenhum campeão é inventado.")}</div></section>`}
    <section class="ch-history-awards"><div class="ch-history-awards-head"><div><small>PRÊMIOS MUNDIAIS</small><h3>Protagonistas de cada temporada</h3></div><button type="button" data-page="awards">Abrir Prêmios & Rankings →</button></div>${aw.length?`<div class="ch-history-awards-grid">${aw.map(a=>`<article><span>${esc(a.season)}</span><div>${(a.awards||[]).slice(0,4).map(w=>`<p><small>${esc(w.label)}</small><b>${esc(w.name)}</b></p>`).join("")}</div></article>`).join("")}</div>`:empty("Os prêmios mundiais são fechados no fim da temporada.")}</section>`;
  }

  // ---------- detalhe de uma liga ----------
  function detail(s,D,cat){
    const lg=cat.find(c=>c.id===ui.leagueId);if(!lg)return empty("Competição não encontrada.");
    const tabs=`<nav class="ch-nav sub" role="tablist">${TABS.map(([id,l])=>`<button type="button" role="tab" aria-selected="${ui.tab===id}" class="${ui.tab===id?"active":""}" data-ch-tab="${id}">${l}</button>`).join("")}</nav>`;
    const head=`<div class="ch-head"><button type="button" data-ch-back>← Voltar</button><span class="ch-lg-logo big">${logo(lg,56)}</span><div><small>${esc(lg.country)} · ${esc(lg.continent)}</small><h3>${esc(lg.name)}</h3></div>${lg.status==="playable"?"":chip(lg.status)}</div>`;
    if(!lg.world)return `${head}${brazilBody(s,D,lg)}`;
    return `${head}${tabs}${worldBody(s,D,lg)}`;
  }
  function tableHtml(s,rows,hc){
    if(!rows.length)return empty("Classificação ainda indisponível.");
    return `<table class="ch-table"><thead><tr><th>#</th><th>Clube</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th><th>Pts</th></tr></thead><tbody>${rows.map((r,i)=>{const st=r.stats||r;return `<tr class="${hc&&r.id===hc.id?"hero":""}"><td>${i+1}</td><td><b>${cr(r.id)}${esc(club(s,r.id)||r.name)}</b></td><td>${st.played??0}</td><td>${st.w??0}</td><td>${st.d??0}</td><td>${st.l??0}</td><td>${st.gd??((st.gf||0)-(st.ga||0))}</td><td><b>${st.points??0}</b></td></tr>`;}).join("")}</tbody></table>`;
  }
  function brazilBody(s,D,lg){
    const rows=D.table?.(s,lg.id)||[];
    return `<section class="ch-box"><small>CLASSIFICAÇÃO · ${esc(s.season)}</small>${tableHtml(s,rows,heroClub(s))}</section><div class="ch-actions"><button type="button" data-page="calendar">Ver jogos e calendário</button></div>`;
  }
  function worldBody(s,D,lg){
    const api=W(D),hc=heroClub(s),ws=root.ProLifeWorldStats;
    if(ui.season!=="atual")return pastSeason(s,D,lg);
    if(ui.tab==="tabela"){
      const rows=api.standings(s,lg.id);
      return `<section class="ch-box"><small>CLASSIFICAÇÃO · ${esc(s.season)}</small>${tableHtml(s,rows,hc)}</section>`;
    }
    if(ui.tab==="calendario"){
      const cal=api.calendar(s,lg.id)||[];
      const cur=Math.max(0,cal.findIndex(r=>!r.played));const idx=ui.round!=null?Math.min(cal.length-1,Math.max(0,ui.round)):(cur<0?cal.length-1:cur);
      const r=cal[idx];
      return `<section class="ch-box"><div class="ch-roundbar"><button type="button" data-ch-round="${idx-1}" ${idx<=0?"disabled":""}>‹</button><b>Rodada ${r?r.round:"—"} de ${cal.length}${r?` · ${dateOf(r.date)}`:""}</b><button type="button" data-ch-round="${idx+1}" ${idx>=cal.length-1?"disabled":""}>›</button></div>${r?`<div class="ch-games">${r.pairs.map(p=>`<article class="${hc&&(p.home===hc.id||p.away===hc.id)?"hero":""}"><span>${cr(p.home)}${esc(club(s,p.home))}</span><b>${p.played?`${p.hg} – ${p.ag}`:"×"}</b><span>${cr(p.away)}${esc(club(s,p.away))}</span></article>`).join("")}</div>`:empty("Sem rodadas.")}</section>`;
    }
    if(ui.tab==="stats"){
      if(!ws)return empty("Estatísticas indisponíveis.");
      const t=(title,stat,f)=>{const rows=ws.leaders(s,{leagueId:lg.id,stat,limit:10});return `<section class="ch-box"><small>${title}</small>${rows.length?`<table class="ch-table"><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td><b>${esc(r.name)}</b></td><td>${esc(r.club)}</td><td>${esc(ws.format(f,stat==="rating"?r.avg:r[stat==="goals"?"goals":"assists"]))}</td></tr>`).join("")}</tbody></table>`:empty("Dados insuficientes.")}</section>`;};
      return `${t("ARTILHARIA","goals","gols")}${t("ASSISTÊNCIAS","assists","assistencias")}${t("DESEMPENHO","rating","nota")}`;
    }
    if(ui.tab==="historico"){
      const h=(api.history(s)||[]).filter(x=>x.leagueId===lg.id);
      return `<section class="ch-box"><small>CAMPEÕES</small>${h.length?`<ul class="ch-ul">${h.map(x=>`<li><span>${x.season}</span><b>${esc(x.champion||"—")}</b></li>`).join("")}</ul>`:empty("Nenhuma temporada encerrada ainda.")}</section>`;
    }
    if(ui.tab==="clubes"){
      const st=s.globalFootball?.worldCompetitions?.leagues?.[lg.id],ids=st?.clubIds||[];
      return `<section class="ch-box"><small>PARTICIPANTES (${ids.length})</small><div class="ch-clubs">${ids.map(id=>`<button type="button" class="${hc&&id===hc.id?"hero":""}" data-ch-club="${esc(id)}" data-ch-league="${esc(lg.id)}">${cr(id)}${esc(club(s,id))}</button>`).join("")}</div></section>`;
    }
    // visao geral
    const rows=api.standings(s,lg.id),cal=api.calendar(s,lg.id)||[],cur=cal.find(r=>!r.played);
    const next=hc?api.nextFixture(s,lg.id,hc.id):null;
    const top=ws?["goals","assists"].map(k=>ws.leaders(s,{leagueId:lg.id,stat:k,limit:1})[0]):[];
    return `<div class="ch-cols"><section class="ch-box"><small>CLASSIFICAÇÃO (TOP 5)</small>${tableHtml(s,rows.slice(0,5),hc)}</section><section class="ch-box"><small>PRÓXIMA RODADA${cur?` · ${cur.round}`:""}</small>${cur?`<div class="ch-games">${cur.pairs.slice(0,6).map(p=>`<article class="${hc&&(p.home===hc.id||p.away===hc.id)?"hero":""}"><span>${cr(p.home)}${esc(club(s,p.home))}</span><b>×</b><span>${cr(p.away)}${esc(club(s,p.away))}</span></article>`).join("")}</div>`:empty("Temporada concluída.")}${next?`<p class="ch-note">Seu próximo jogo: ${esc(club(s,next.home))} × ${esc(club(s,next.away))} · ${dateOf(next.date)}</p>`:""}</section></div><section class="ch-box"><small>DESTAQUES</small>${top[0]&&top[1]?`<p class="ch-note"><b>${esc(top[0].name)}</b> (${esc(top[0].club)}) lidera a artilharia com ${esc(ws.format("gols",top[0].goals))}; <b>${esc(top[1].name)}</b> (${esc(top[1].club)}) lidera com ${esc(ws.format("assistencias",top[1].assists))}.</p>`:empty("Destaques aparecem após as primeiras rodadas.")}</section>`;
  }
  function pastSeason(s,D,lg){
    const h=(W(D)?.history?.(s)||[]).find(x=>x.leagueId===lg.id&&String(x.season)===String(ui.season));
    const arch=root.ProLifeWorldStats?.history(s,{leagueId:lg.id,season:Number(ui.season)})[0];
    return `<section class="ch-box"><small>TEMPORADA ${esc(ui.season)}</small>${h?`<p class="ch-note">Campeão: <b>${esc(h.champion||"—")}</b></p>`:empty("Sem registro desta temporada para a competição.")}${arch?`<div class="ch-list">${arch.awards.map(w=>`<article class="ch-card"><div><small>${esc(w.label)}</small><b>${esc(w.name)}</b></div><span>${esc(w.club||"")}</span><p>${esc(root.ProLifeWorldStats.formatAward(w))}</p></article>`).join("")}</div>`:""}</section>`;
  }

  function css(){
    return `<style>.ch-dark{--ch-card:#111b26;--ch-line:rgba(255,255,255,.09);--ch-text:#f2f4f6;--ch-muted:#8b99a6;--ch-gold:#d8b45b;--ch-ok:#4cc3b0;padding:24px;border-radius:18px;background:#0a1119;color:var(--ch-text);border:1px solid var(--ch-line)}
.ch-dark h2,.ch-dark h3{margin:0 0 4px}.ch-dark small{color:var(--ch-muted);letter-spacing:.1em;text-transform:uppercase;font-size:11px}.ch-note{color:var(--ch-muted);font-size:13px;margin:8px 0}
.ch-nav{display:flex;gap:2px;flex-wrap:wrap;border-bottom:1px solid var(--ch-line);margin:14px 0 16px}.ch-nav button{background:none;border:0;border-bottom:2px solid transparent;color:var(--ch-muted);padding:9px 14px;font:inherit;font-weight:600;cursor:pointer}.ch-nav button.active{color:var(--ch-text);border-bottom-color:var(--ch-gold)}.ch-nav.sub button{padding:7px 12px;font-size:13px}
.ch-filters{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:12px}.ch-filters label{display:flex;flex-direction:column;gap:4px;font-size:11px;color:var(--ch-muted);text-transform:uppercase;letter-spacing:.1em}.ch-filters select{min-width:170px;max-width:100%}
.ch-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}.ch-card{background:var(--ch-card);border:1px solid var(--ch-line);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:6px}.ch-card.off{opacity:.7}.ch-card b{font-size:15px}.ch-card p{margin:0;color:var(--ch-muted);font-size:12px}.ch-card span{color:var(--ch-muted);font-size:12px}
.ch-chip{align-self:flex-start;font-size:11px;padding:2px 8px;border-radius:10px;border:1px solid var(--ch-line)}.ch-chip.ok{color:var(--ch-ok);border-color:var(--ch-ok)}.ch-chip.warn{color:var(--ch-gold);border-color:var(--ch-gold)}.ch-chip.off{color:var(--ch-muted)}
.ch-box{background:var(--ch-card);border:1px solid var(--ch-line);border-radius:12px;padding:16px;margin-bottom:14px}.ch-cols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.ch-cols .ch-box{margin:0}
.ch-mine{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;margin-top:10px}.ch-main{border:1px solid var(--ch-line);border-radius:12px;padding:16px}.ch-main.off{opacity:.65}.ch-main:first-child{border-color:var(--ch-gold);background:rgba(216,180,91,.06)}
.ch-strip{display:flex;gap:22px;margin:10px 0}.ch-strip b{display:block;font-size:24px}.ch-strip span{color:var(--ch-muted);font-size:12px}
.ch-table{width:100%;border-collapse:collapse;font-size:13px}.ch-table th,.ch-table td{text-align:left;padding:6px;border-bottom:1px solid var(--ch-line)}.ch-table th{color:var(--ch-muted);font-weight:600}.ch-table tr.hero{background:rgba(216,180,91,.12)}
.ch-games{display:grid;gap:6px}.ch-games article{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;padding:8px 10px;border:1px solid var(--ch-line);border-radius:8px;font-size:13px}.ch-games article.hero{border-color:var(--ch-gold);background:rgba(216,180,91,.08)}.ch-games article span:last-child{text-align:right}
.ch-roundbar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.ch-head{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:6px}
.ch-ul{list-style:none;margin:8px 0 0;padding:0}.ch-ul li{display:flex;gap:12px;padding:7px 0;border-bottom:1px solid var(--ch-line)}.ch-ul small{flex:1;text-transform:none;letter-spacing:0}
.ch-clubs{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}.ch-clubs button{background:transparent;border:1px solid var(--ch-line);border-radius:8px;color:var(--ch-text);padding:7px 10px;cursor:pointer}.ch-clubs button.hero{border-color:var(--ch-gold)}
.ch-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}.ch-dark button:disabled{opacity:.4;cursor:not-allowed}.ch-dark button:focus-visible,.ch-dark select:focus-visible{outline:2px solid var(--ch-gold);outline-offset:2px}
.ch-dark{padding:20px 22px}.ch-dark>h2{font-size:22px;margin:0}.ch-nav{margin:12px 0 16px}.ch-nav button{padding:10px 16px;font-size:14px}
.ch-next{display:flex;align-items:center;gap:20px;flex-wrap:wrap;padding:14px 18px;border-radius:14px;border:1px solid var(--ch-gold);background:linear-gradient(90deg,rgba(216,180,91,.14),rgba(216,180,91,.02));margin-bottom:14px}.ch-next-m{display:flex;align-items:center;gap:14px;font-size:17px}.ch-next-m span{display:inline-flex;align-items:center;gap:8px}.ch-next-m em{color:var(--ch-muted);font-style:normal}.ch-next-i{margin-left:auto;color:var(--ch-muted);font-size:13px}
.ch-main{display:flex;flex-direction:column;gap:6px}.ch-main h3{font-size:19px}.ch-main .ch-strip{margin:6px 0}.ch-main button{align-self:flex-start;margin-top:auto}.ch-main .ch-strip b{font-size:28px}
.ch-lgs{grid-template-columns:repeat(auto-fill,minmax(300px,1fr))!important;gap:10px}.ch-lg{display:flex;align-items:center;gap:14px;padding:12px 14px;border:1px solid var(--ch-line);border-radius:12px;background:var(--ch-card)}.ch-lg.mine{border-color:var(--ch-gold);background:rgba(216,180,91,.07)}.ch-lg.off{opacity:.7}.ch-lg-logo{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px}.ch-lg-logo.big{width:56px;height:56px}.ch-lg-logo img,.ch-lg-logo svg{max-width:100%;max-height:100%;object-fit:contain}
.ch-lg-t{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}.ch-lg-t b{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ch-lg-t small{text-transform:none;letter-spacing:0;font-size:12px}.ch-lg-s{font-size:12px;color:var(--ch-ok)}.ch-lg-s.off{color:var(--ch-muted)}.ch-lg button{flex:0 0 auto}
.ch-mytraj{margin-bottom:16px}.ch-mytraj-h{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:12px}.ch-mytraj-s{margin-top:12px}.ch-mytraj-s>b{display:block;font-size:15px;margin-bottom:6px;color:var(--ch-gold)}.ch-sec{margin-bottom:18px}.ch-sec>small{display:block;margin-bottom:8px}.ch-more{margin-top:14px}.ch-more>summary{cursor:pointer;color:var(--ch-muted);font-weight:600;padding:8px 0}.ch-more[open]>summary{margin-bottom:8px}.ch-head .ch-lg-logo{margin-right:2px}
.ch-history-hero{position:relative;overflow:hidden;display:flex;align-items:flex-end;justify-content:space-between;gap:28px;padding:24px;margin-bottom:14px;border:1px solid rgba(216,180,91,.35);border-radius:14px;background:radial-gradient(circle at 86% 10%,rgba(216,180,91,.18),transparent 32%),linear-gradient(120deg,#152231,#0d1721 70%)}.ch-history-hero:after{content:"";position:absolute;right:-34px;bottom:-74px;width:210px;height:210px;border:1px solid rgba(216,180,91,.12);border-radius:50%}.ch-history-hero h3{font-size:27px;margin:5px 0}.ch-history-hero p{max-width:620px;margin:0;color:var(--ch-muted);font-size:13px}.ch-history-kpis{display:flex;gap:8px;position:relative;z-index:1}.ch-history-kpis>span{min-width:104px;padding:11px 13px;border:1px solid var(--ch-line);border-radius:10px;background:rgba(5,12,19,.55)}.ch-history-kpis small,.ch-history-kpis b{display:block}.ch-history-kpis small{font-size:9px}.ch-history-kpis b{font-size:21px;margin-top:3px}
.ch-history-archive{display:grid;gap:10px}.ch-history-season{border:1px solid var(--ch-line);border-radius:13px;background:#0d1721;overflow:hidden}.ch-history-season[open]{border-color:rgba(216,180,91,.32)}.ch-history-season>summary{list-style:none;display:flex;align-items:center;gap:14px;padding:13px 16px;cursor:pointer;background:rgba(255,255,255,.015)}.ch-history-season>summary::-webkit-details-marker{display:none}.ch-history-season>summary>span:first-child{display:flex;align-items:baseline;gap:10px}.ch-history-season>summary b{font-size:19px}.ch-history-season>summary i{margin-left:2px;color:var(--ch-gold);font-style:normal;font-size:20px;transition:transform .18s}.ch-history-season[open]>summary i{transform:rotate(180deg)}.ch-history-count{margin-left:auto;color:var(--ch-muted);font-size:12px}.ch-history-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:9px;padding:0 12px 12px}.ch-history-card{min-width:0;display:grid;grid-template-columns:48px minmax(0,1fr);gap:10px 12px;padding:13px;border:1px solid var(--ch-line);border-radius:11px;background:linear-gradient(135deg,#14212d,#101a24)}.ch-history-card.mine{border-color:var(--ch-gold);box-shadow:inset 3px 0 var(--ch-gold)}.ch-history-league-logo{grid-row:1;display:flex;align-items:center;justify-content:center;width:42px;height:42px}.ch-history-league-logo img,.ch-history-league-logo svg{max-width:100%;max-height:100%;object-fit:contain}.ch-history-meta{display:flex;min-width:0;flex-direction:column;justify-content:center}.ch-history-meta b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}.ch-history-meta small{font-size:9px}.ch-history-winner{grid-column:1/-1;display:flex;align-items:center;gap:9px;padding-top:10px;border-top:1px solid var(--ch-line)}.ch-history-winner>div{display:flex;min-width:0;flex-direction:column}.ch-history-winner strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px}.ch-history-winner small{font-size:9px;color:var(--ch-gold)}.ch-history-crest{display:flex;align-items:center;justify-content:center;width:28px;height:28px;flex:0 0 28px}.ch-history-crest img,.ch-history-crest svg{max-width:100%;max-height:100%;object-fit:contain}.ch-history-fallback{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:rgba(216,180,91,.12);color:var(--ch-gold)}
.ch-history-awards{margin-top:14px;padding:18px;border:1px solid var(--ch-line);border-radius:13px;background:var(--ch-card)}.ch-history-awards-head{display:flex;align-items:center;justify-content:space-between;gap:16px}.ch-history-awards-head h3{font-size:18px;margin-top:3px}.ch-history-awards-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:9px;margin-top:14px}.ch-history-awards-grid>article{display:flex;gap:14px;padding:12px;border:1px solid var(--ch-line);border-radius:10px;background:#0d1721}.ch-history-awards-grid>article>span{font-size:18px;font-weight:800;color:var(--ch-gold)}.ch-history-awards-grid p{margin:0 0 7px}.ch-history-awards-grid p:last-child{margin-bottom:0}.ch-history-awards-grid p small,.ch-history-awards-grid p b{display:block}.ch-history-awards-grid p small{font-size:9px}.ch-history-awards-grid p b{font-size:12px}.ch-history-empty{display:flex;align-items:center;gap:14px}.ch-history-empty>span{font-size:28px;color:var(--ch-gold)}
@media(max-width:900px){.ch-dark{padding:16px}.ch-cols{grid-template-columns:1fr}.ch-history-hero{align-items:stretch;flex-direction:column}.ch-history-kpis{width:100%}.ch-history-kpis>span{flex:1;min-width:0}}@media(max-width:560px){.ch-history-hero{padding:18px}.ch-history-kpis{display:grid;grid-template-columns:repeat(3,1fr)}.ch-history-kpis>span{padding:9px}.ch-history-kpis b{font-size:17px}.ch-history-grid{grid-template-columns:1fr}.ch-history-awards-head{align-items:flex-start;flex-direction:column}.ch-history-count{display:none}}</style>`;
  }

  function render(s,D){
    if(!s||!W(D))return `<section class="card"><h2>Competições</h2><p class="muted">Módulo indisponível.</p></section>`;
    try{W(D).init?.(s);}catch(e){}
    const cat=catalog(s,D);
    if(ui.leagueId&&!cat.some(c=>c.id===ui.leagueId))ui.leagueId=null;
    let body;
    if(ui.leagueId)body=detail(s,D,cat);
    else if(ui.section==="ligas")body=listSection(s,D,cat,"liga");
    else if(ui.section==="copas")body=copas(s,D,cat);
    else if(ui.section==="continentais")body=continentais(s,D,cat);
    else if(ui.section==="mundiais")body=mundiais();
    else if(ui.section==="selecoes")body=selecoes();
    else if(ui.section==="historico")body=historico(s,D);
    else body=minhas(s,D,cat);
    return `${css()}<section class="ch-dark" data-competitions-hub><h2>Competições · Temporada ${esc(s.season)}</h2>${ui.leagueId?"":nav()}${body}</section>`;
  }
  const api={render,state:ui,catalog,continentOf,
    setSection(id){if(SECTIONS.some(x=>x[0]===id)){ui.section=id;ui.leagueId=null;ui.tab="geral";ui.round=null;}},
    open(id){ui.leagueId=id;ui.tab="geral";ui.round=null;},
    back(){ui.leagueId=null;},
    setTab(id){if(TABS.some(x=>x[0]===id)){ui.tab=id;ui.round=null;}},
    setRound(n){ui.round=Number.isFinite(Number(n))?Number(n):null;},
    setFilter(k,v){if(k==="query"){ui.query=String(v||"").slice(0,60);return;}if(k in ui)ui[k]=v||"ALL";if(k==="continent")ui.country="ALL";},phase};
  root.ProLifeCompetitionsHub=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
