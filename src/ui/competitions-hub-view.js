(function competitionsHubModule(root){
  "use strict";
  // Stage 34F.29A - Central mundial de competicoes: uma unica navegacao para ligas do mundo, competicoes brasileiras,
  // continentais, mundiais e selecoes. Comeca pelas competicoes do clube do protagonista.
  // So le o estado; nada aqui altera calendario, resultados ou historico.
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const ui={section:"minhas",continent:"ALL",country:"ALL",leagueId:null,tab:"geral",season:"atual",round:null,query:""};
  const SECTIONS=[["minhas","Minhas competições"],["ligas","Ligas nacionais"],["copas","Copas nacionais"],["continentais","Continentais"],["mundiais","Mundiais"],["selecoes","Seleções"],["historico","Histórico e estatísticas"]];
  const TABS=[["geral","Visão geral"],["tabela","Tabela"],["calendario","Calendário"],["stats","Estatísticas"],["historico","Histórico"],["clubes","Clubes"]];
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
  function nav(){
    return `<nav class="ch-nav" role="tablist" aria-label="Seções">${SECTIONS.map(([id,l])=>`<button type="button" role="tab" aria-selected="${ui.section===id}" class="${ui.section===id?"active":""}" data-ch-section="${id}">${l}</button>`).join("")}</nav>`;
  }
  function filters(s,cat){
    const conts=[...new Set(cat.map(c=>c.continent))].sort(),countries=[...new Set(cat.filter(c=>ui.continent==="ALL"||c.continent===ui.continent).map(c=>c.country).filter(Boolean))].sort();
    const seasons=[...new Set([s.season,...(W({})?.history?.(s)||[]).map(h=>h.season)])].sort((a,b)=>b-a);
    return `<div class="ch-filters"><label>Continente<select data-ch-continent><option value="ALL">Todos</option>${conts.map(c=>`<option ${ui.continent===c?"selected":""}>${esc(c)}</option>`).join("")}</select></label><label>País<select data-ch-country><option value="ALL">Todos</option>${countries.map(c=>`<option ${ui.country===c?"selected":""}>${esc(c)}</option>`).join("")}</select></label><label>Buscar<input type="search" data-ch-query value="${esc(ui.query||"")}" placeholder="Nome da liga ou país" /></label><label>Temporada<select data-ch-season><option value="atual" ${ui.season==="atual"?"selected":""}>Atual (${esc(s.season)})</option>${seasons.filter(y=>y!==s.season).map(y=>`<option value="${y}" ${String(ui.season)===String(y)?"selected":""}>${y}</option>`).join("")}</select></label></div>`;
  }
  function card(c,s,D){
    const open=c.status==="playable"||c.status==="regional_pool";
    return `<article class="ch-card ${open?"":"off"}"><div><small>${esc(c.country||c.continent)}</small><b>${esc(c.name)}</b></div>${chip(c.status)}<span>${c.clubCount?`${c.clubCount} clubes · `:""}${esc(phase(s,D,c))}</span>${open?`<button type="button" data-ch-open="${esc(c.id)}">Abrir</button>`:`<p>${esc(c.note||"Sem calendário simulado nesta carreira.")}</p>`}</article>`;
  }
  const empty=t=>`<p class="ch-note">${esc(t)}</p>`;

  // ---------- Minhas competicoes ----------
  function minhas(s,D,cat){
    const hc=heroClub(s),items=[];
    if(!hc)return `<section class="ch-box"><small>MINHAS COMPETIÇÕES</small>${empty("Você está sem clube. As competições do seu clube aparecem aqui assim que assinar com um.")}</section>`;
    const lg=cat.find(c=>c.id===hc.leagueId),api=W(D);
    let next="";
    if(lg?.world&&api?.nextFixture){const f=api.nextFixture(s,lg.id,hc.id);if(f)next=`<p class="ch-note">Próximo jogo: <b>${esc(club(s,f.home))} × ${esc(club(s,f.away))}</b> · ${dateOf(f.date)} · rodada ${f.round}</p>`;}
    const mine=[];
    if(lg)mine.push(`<article class="ch-main"><small>LIGA NACIONAL · ${esc(lg.country)}</small><h3>${esc(lg.name)}</h3>${pos(s,D,lg,hc)}${next}<button type="button" class="primary" data-ch-open="${esc(lg.id)}">Abrir competição</button></article>`);
    for(const cup of brazilCups(s)){
      const part=cup.id==="copaBrasil"?(s.competitionSchedule?.cup?.entrants||s.competitionSchedule?.cup?.participants||[]).some?.(x=>(x.id||x)===hc.id):cup.state?.entrants?.includes(hc.id);
      if(part)mine.push(`<article class="ch-main"><small>COPA NACIONAL</small><h3>${esc(cup.name)}</h3>${cup.champion?`<p class="ch-note">Campeão: ${esc(cup.champion?.name||cup.champion)}</p>`:`<p class="ch-note">Em disputa nesta temporada.</p>`}<button type="button" data-page="competitions" data-ch-section="copas">Ver copas</button></article>`);
    }
    const ce=(()=>{try{return CONTI()?.heroEntries?.(s)||[];}catch(e){return [];}})();
    if(ce.length)for(const e of ce)mine.push(`<article class="ch-main"><small>COMPETIÇÃO CONTINENTAL · ${esc(CONTI().COMPS[e.comp].conf)}</small><h3>${esc(e.name)}</h3><p class="ch-note">Seu clube está classificado por mérito (${esc(String(e.via).replace("liga:","posição ").replace(/^posição (\d+)$/,"$1º colocado na liga nacional"))}). ${e.status==="adapted"?"Edição adaptada.":""} Os jogos e resultados seguem o calendário registrado no PRO-LIFE.</p>${e.comp==="ucl"?`<button type="button" class="primary" data-ch-ucl-open="1">Abrir Champions League</button>`:`<button type="button" data-ch-section="continentais">Ver inscritos</button>`}</article>`);
    else mine.push(`<article class="ch-main off"><small>COMPETIÇÕES CONTINENTAIS</small><h3>Seu clube não está classificado</h3><p class="ch-note">As vagas continentais são definidas pela classificação nacional. Você não participa artificialmente.</p></article>`);
    return `<section class="ch-box"><small>MINHAS COMPETIÇÕES · ${esc(hc.name)}</small><div class="ch-mine">${mine.join("")}</div></section>`;
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
    const playable=list.filter(c=>c.status!=="catalog_only").length;
    return `${filters(s,cat)}<p class="ch-note">${list.length} competição(ões) · ${playable} com calendário simulado.</p><div class="ch-list">${list.map(c=>card(c,s,D)).join("")||empty("Nenhuma competição para os filtros escolhidos.")}</div>${info.length?`<section class="ch-box"><small>INFORMAÇÃO DO CATÁLOGO FC 27</small>${info.map(c=>`<p class="ch-note"><b>${esc(c.name)}</b> (${c.clubCount} clube${c.clubCount===1?"":"s"} no catálogo). Não é uma competição independente: o Brasil já é disputado no PRO-LIFE pelo Brasileirão Série A, B, C e D. Os clubes brasileiros do catálogo continuam ligados ao manifesto, sem fusão automática de jogadores.</p>`).join("")}</section>`:""}`;
  }
  // J12.3: chave real, derivada das rodadas ja registradas no save.
  function playerCupRounds(s){
    if(s?.mode!=="player")return "";
    const cup=s.competitionSchedule?.cup;
    const rounds=Array.isArray(cup?.rounds)?cup.rounds:[];
    if(!rounds.length)return "";
    const hero=String(s.clubId||"");
    const selected=rounds.find(r=>(r.pairs||[]).some(p=>String(p.home)===hero||String(p.away)===hero)&&!(r.pairs||[]).every(p=>p.played))||rounds.find(r=>(r.pairs||[]).some(p=>String(p.home)===hero||String(p.away)===hero))||rounds[rounds.length-1];
    const pair=(p)=>{
      const played=!!p.played;
      const a=club(s,p.home),b=club(s,p.away);
      const score=played&&Number.isFinite(Number(p.hg))&&Number.isFinite(Number(p.ag))?`${p.hg} – ${p.ag}`:"×";
      const winner=played&&p.winnerId?club(s,p.winnerId):null;
      const important=String(p.home)===hero||String(p.away)===hero;
      return `<li class="ch-cup-pair ${important?"hero":""}"><span>${esc(a)}</span><b>${esc(score)}</b><span>${esc(b)}</span>${winner?`<small>Classificado: ${esc(winner)}</small>`:""}</li>`;
    };
    const stages=rounds.map(r=>{
      const total=(r.pairs||[]).length,completed=(r.pairs||[]).filter(p=>p.played).length;
      const here=(r.pairs||[]).some(p=>String(p.home)===hero||String(p.away)===hero);
      return `<div class="ch-cup-stage ${r===selected?"current":""}"><b>${esc(r.name||"Fase "+(Number(r.index||0)+1))}</b><span>${completed}/${total} confronto(s) concluídos</span>${here?'<small>SEU CLUBE</small>':""}</div>`;
    }).join("");
    const matches=(selected.pairs||[]).map(pair).join("");
    return `<section class="ch-box ch-cup-path"><small>J12.3 · CAMINHO DO TÍTULO</small><h3>${esc(cup.name||"Copa do Brasil")}</h3><div class="ch-cup-stages">${stages}</div><h4>${esc(selected.name||"Confrontos da fase")} · ${dateOf(selected.date)}</h4><ul class="ch-cup-pairs">${matches||"<li>Sem confrontos registrados nesta fase.</li>"}</ul><p class="ch-note">Fases e classificados são lidos diretamente do save. Sem simulação adicional.</p></section>`;
  }
  function copas(s,D,cat){
    const cups=brazilCups(s);
    const rows=cups.map(c=>`<article class="ch-card ${c.status==="playable"?"":"off"}"><div><small>${esc(c.country)}</small><b>${esc(c.name)}</b></div>${chip(c.status)}<span>${c.entrants?`${c.entrants} clube(s)`:""}</span>${c.champion?`<p>Campeão: ${esc(c.champion.name||c.champion)}</p>`:c.status==="playable"?`<p>Em disputa.</p>`:`<p>Participantes insuficientes para um torneio competitivo.</p>`}</article>`).join("");
    return `${playerCupRounds(s)}<p class="ch-note">Copa do Brasil e estaduais são simulados. Copas nacionais de outros países ainda não existem no motor: nenhuma é exibida como jogável.</p><div class="ch-list">${rows||empty("Nenhuma copa nacional nesta carreira.")}</div><div class="ch-actions"><button type="button" data-page="league">Ver campeonatos e calendário do Brasil</button></div>`;
  }
  function continentais(s,D,cat){
    const C=CONTI();let eds=[];try{eds=C?C.editions(s,s.season):[];}catch(e){}
    const step={ucl:"32B",uel:"32C",uecl:"32C",lib:"32E",sud:"32F"};
    const chip2=e=>e.status==="unavailable"?'<span class="ch-chip off">Indisponível</span>':e.status==="adapted"?'<span class="ch-chip warn">Inscrições adaptadas</span>':'<span class="ch-chip ok">Inscrições definidas</span>';
    const cards=eds.map(e=>{const def=C.COMPS[e.comp],hero=s.clubId;
      const list=e.entrants.map(x=>`<li><span>${esc(club(s,x[0]))}${x[0]===hero?" · SEU CLUBE":""}</span><small>${esc(x[1])} · ${esc(String(x[2]).replace("liga:",""))}º colocado</small></li>`).join("");
      return `<article class="ch-card off"><div><small>${esc(def.conf)} · temporada ${esc(e.season)}</small><b>${esc(def.name)}</b></div>${chip2(e)}<p>${esc(def.note)}</p><p class="ch-note">${e.count} de ${e.required} participantes por mérito. ${e.comp==="ucl"?"Confrontos e resultados disponíveis na central da Champions.":"Edição em desenvolvimento."}</p>${e.reasons.length?`<details><summary>Limitações e regras desta edição</summary><ul class="ch-ul">${e.reasons.map(r=>`<li><small>${esc(r)}</small></li>`).join("")}</ul></details>`:""}<details><summary>Clubes inscritos (${e.count})</summary><ul class="ch-ul">${list||"<li><small>Nenhum clube identificável.</small></li>"}</ul></details></article>`;}).join("");
    const planned=(C?C.PLANNED:[]).map(p=>`<article class="ch-card off"><div><small>${esc(p.conf)}</small><b>${esc(p.name)}</b></div><span class="ch-chip off">Planejada</span><p>${esc(p.reason)} Etapa ${esc(p.step)}.</p></article>`).join("");
    return `<p class="ch-note">Vagas continentais por classificação nacional (distribuição adaptada do PRO-LIFE, não a tabela oficial de coeficientes). Sem clubes fictícios: quando faltam clubes reais no catálogo, a edição é marcada como adaptada.</p><div class="ch-list">${cards}${planned}</div>`;
  }
  function mundiais(){
    return `<div class="ch-list"><article class="ch-card off"><div><small>Mundo</small><b>Mundial de Clubes</b></div><span class="ch-chip off">Planejada</span><p>Depende dos torneios continentais de clubes. Ainda não é simulada.</p></article></div>`;
  }
  function selecoes(s){
    return `<p class="ch-note">As competições de seleções (Copa do Mundo, Eurocopa, Copa América e demais) já são simuladas pelo motor e acompanhadas na área da Seleção.</p><div class="ch-actions"><button type="button" class="primary" data-page="national">Abrir Seleção</button><button type="button" data-page="worldCompetitions">Competições mundiais de clubes (visão antiga)</button></div>`;
  }
  function historico(s,D){
    const api=W(D),h=api?.history?.(s)||[],ws=root.ProLifeWorldStats;
    const rows=h.slice(0,60).map(x=>`<li><span>${x.season}</span><b>${esc(x.league)}</b><small>${esc(x.champion||"—")}</small></li>`).join("");
    const aw=ws?ws.history(s).filter(a=>a.leagueId==="world").slice(0,3):[];
    return `<section class="ch-box"><small>CAMPEÕES DAS LIGAS MUNDIAIS</small>${rows?`<ul class="ch-ul">${rows}</ul>`:empty("O histórico começa quando a primeira temporada for encerrada. Nenhum campeão é inventado.")}</section>
    <section class="ch-box"><small>PRÊMIOS MUNDIAIS</small>${aw.length?aw.map(a=>`<p class="ch-note"><b>${a.season}</b>: ${a.awards.map(w=>`${esc(w.label)} — ${esc(w.name)}`).join(" · ")}</p>`).join(""):empty("Os prêmios mundiais são fechados no fim da temporada.")}</section><div class="ch-actions"><button type="button" data-page="awards">Abrir Prêmios & Rankings</button></div>`;
  }

  // ---------- detalhe de uma liga ----------
  function detail(s,D,cat){
    const lg=cat.find(c=>c.id===ui.leagueId);if(!lg)return empty("Competição não encontrada.");
    const tabs=`<nav class="ch-nav sub" role="tablist">${TABS.map(([id,l])=>`<button type="button" role="tab" aria-selected="${ui.tab===id}" class="${ui.tab===id?"active":""}" data-ch-tab="${id}">${l}</button>`).join("")}</nav>`;
    const head=`<div class="ch-head"><button type="button" data-ch-back>← Voltar</button><div><small>${esc(lg.country)} · ${esc(lg.continent)}</small><h3>${esc(lg.name)}</h3></div>${chip(lg.status)}</div>`;
    if(!lg.world)return `${head}${brazilBody(s,D,lg)}`;
    return `${head}${tabs}${worldBody(s,D,lg)}`;
  }
  function tableHtml(s,rows,hc){
    if(!rows.length)return empty("Classificação ainda indisponível.");
    return `<table class="ch-table"><thead><tr><th>#</th><th>Clube</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th><th>Pts</th></tr></thead><tbody>${rows.map((r,i)=>{const st=r.stats||r;return `<tr class="${hc&&r.id===hc.id?"hero":""}"><td>${i+1}</td><td><b>${cr(r.id)}${esc(club(s,r.id)||r.name)}</b></td><td>${st.played??0}</td><td>${st.w??0}</td><td>${st.d??0}</td><td>${st.l??0}</td><td>${st.gd??((st.gf||0)-(st.ga||0))}</td><td><b>${st.points??0}</b></td></tr>`;}).join("")}</tbody></table>`;
  }
  function brazilBody(s,D,lg){
    const rows=D.table?.(s,lg.id)||[];
    return `<section class="ch-box"><small>CLASSIFICAÇÃO · ${esc(s.season)}</small>${tableHtml(s,rows,heroClub(s))}</section><div class="ch-actions"><button type="button" data-page="calendar">Calendário e partidas</button><button type="button" data-page="league">Campeonatos</button><button type="button" data-page="awards">Prêmios & Rankings</button></div>`;
  }
  function worldBody(s,D,lg){
    const api=W(D),hc=heroClub(s),ws=root.ProLifeWorldStats;
    if(ui.season!=="atual")return pastSeason(s,D,lg);
    if(ui.tab==="tabela"){
      const rows=api.standings(s,lg.id);
      return `<section class="ch-box"><small>CLASSIFICAÇÃO · ${esc(s.season)}</small>${tableHtml(s,rows,hc)}<p class="ch-note">Vagas continentais e rebaixamento: esta liga não tem promoção, rebaixamento nem torneio continental simulados, então nenhuma zona é marcada.</p></section>`;
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
      return `${t("ARTILHARIA","goals","gols")}${t("ASSISTÊNCIAS","assists","assistencias")}${t("DESEMPENHO","rating","nota")}<div class="ch-actions"><button type="button" data-page="awards">Prêmios & Rankings desta liga</button></div>`;
    }
    if(ui.tab==="historico"){
      const h=(api.history(s)||[]).filter(x=>x.leagueId===lg.id);
      return `<section class="ch-box"><small>CAMPEÕES</small>${h.length?`<ul class="ch-ul">${h.map(x=>`<li><span>${x.season}</span><b>${esc(x.champion||"—")}</b></li>`).join("")}</ul>`:empty("Nenhuma temporada encerrada ainda.")}</section>`;
    }
    if(ui.tab==="clubes"){
      const st=s.globalFootball?.worldCompetitions?.leagues?.[lg.id],ids=st?.clubIds||[];
      return `<section class="ch-box"><small>PARTICIPANTES (${ids.length})</small><div class="ch-clubs">${ids.map(id=>`<button type="button" class="${hc&&id===hc.id?"hero":""}" data-ch-club="${esc(id)}" data-ch-league="${esc(lg.id)}">${cr(id)}${esc(club(s,id))}</button>`).join("")}</div><p class="ch-note">Escolha um clube para ver o elenco completo.</p></section>`;
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
.ch-player-focus{margin:16px 0;padding:20px;border:1px solid rgba(185,240,55,.35);background:linear-gradient(120deg,#172933,#101d28);border-radius:12px}.ch-player-focus header small{color:#b9f037}.ch-player-focus h3{font-size:25px;margin:8px 0 15px!important}.ch-player-focus-grid{display:grid;grid-template-columns:1fr 1.5fr 1.5fr;gap:9px}.ch-player-focus-grid article{min-width:0;display:flex;flex-direction:column;gap:8px;background:#0d1a25;border:1px solid var(--ch-line);padding:15px}.ch-player-focus-grid strong{font-size:27px;color:#fff}.ch-player-focus-grid article>b{font-size:17px}.ch-player-focus-grid span{font-size:12px;color:#c6d6db}.ch-player-focus-grid ul{list-style:none;padding:0;margin:0;display:grid;gap:8px}.ch-player-focus-grid li{display:grid;gap:4px}.ch-player-focus-grid li b{font-size:12px}.ch-player-focus-actions{display:flex;flex-wrap:wrap;gap:8px;margin:15px 0}.ch-player-focus-actions button{border:1px solid #739094;background:#233b46;padding:10px 14px;color:#f3f7f8;cursor:pointer}.ch-player-focus>p{font-size:11px;color:#9db2b9;margin:0}@media(max-width:850px){.ch-player-focus-grid{grid-template-columns:1fr}}
.ch-cup-stages{display:flex;gap:9px;overflow:auto;padding:12px 0}.ch-cup-stage{flex:1 0 145px;padding:12px;background:#182a34;border:1px solid var(--ch-line);display:grid;gap:6px}.ch-cup-stage.current{border-color:#b8f03c}.ch-cup-stage b{color:#fff}.ch-cup-stage span,.ch-cup-stage small{font-size:11px;color:#b8cbd0}.ch-cup-stage small{color:#b8f03c}.ch-cup-pairs{list-style:none;padding:0;display:grid;gap:8px}.ch-cup-pair{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;padding:12px;background:#10202b;border:1px solid var(--ch-line)}.ch-cup-pair.hero{border-color:#b8f03c}.ch-cup-pair>b{color:#fff}.ch-cup-pair>small{grid-column:1/-1;color:#b8f03c}.ch-cup-path h4{color:#fff}.ch-cup-path h3{color:#fff;font-size:23px;margin:8px 0}@media(max-width:600px){.ch-cup-pair{font-size:12px}}
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
@media(max-width:900px){.ch-dark{padding:16px}.ch-cols{grid-template-columns:1fr}}</style>`;
  }

  // J12.2: contexto do atleta derivado do motor existente, sem agenda paralela.
  function playerCompetitionFocus(s,D){
    if(s?.mode!=="player"||!s.clubId)return "";
    const hc=heroClub(s),next=D?.nextCommitment?.(s)||null;
    let standings=[];
    try { if(hc?.leagueId)standings=D?.table?.(s,hc.leagueId)||[]; }catch(e){}
    const ix=standings.findIndex(r=>String(r.id)===String(s.clubId));
    const league=(s.leagues||[]).find(l=>l.id===hc?.leagueId);
    const row=ix>=0?standings[ix]:null,st=row?.stats||row;
    const recent=(s.matches||[]).filter(m=>(String(m.home)===String(s.clubId)||String(m.away)===String(s.clubId))&&Number(m.date)<=Number(s.day)&&Number.isFinite(Number(m.hg))&&Number.isFinite(Number(m.ag)))
      .slice().sort((a,b)=>Number(b.date)-Number(a.date)).slice(0,3);
    const teamName=id=>esc(club(s,id));
    const lastHtml=recent.length?recent.map(m=>`<li><span>${esc(m.competitionName||"Competição")} · ${dateOf(m.date)}</span><b>${teamName(m.home)} ${Number(m.hg)} × ${Number(m.ag)} ${teamName(m.away)}</b></li>`).join(""):"<li><span>Ainda não existem partidas registradas.</span></li>";
    let stage="";
    try {stage=next?D?.Competitions?.fixtureStage?.(s,next)||"":"";}catch(e){}
    const nextLabel=next?`<b>${esc(next.home||club(s,next.homeId))} × ${esc(next.away||club(s,next.awayId))}</b><span>${esc(next.competitionName||"Competição")} · ${esc(stage||next.stage||"Fase não informada")} · ${dateOf(next.date)}</span>`:"<span>Nenhum compromisso agendado.</span>";
    return `<section class="ch-player-focus" aria-label="Minha temporada"><header><small>CARREIRA DE ATLETA · VISÃO DA TEMPORADA</small><h3>${esc(hc?.name||"Meu clube")}</h3></header><div class="ch-player-focus-grid"><article><small>SITUAÇÃO NA LIGA</small><strong>${ix>=0?ix+1+"º":"—"}</strong><span>${esc(league?.name||"Classificação indisponível")}${st&&Number.isFinite(Number(st.points))?" · "+st.points+" pts":""}</span></article><article><small>PRÓXIMA PARTIDA</small>${nextLabel}</article><article><small>RESULTADOS RECENTES</small><ul>${lastHtml}</ul></article></div><nav class="ch-player-focus-actions"><button type="button" data-page="calendar">Calendário completo</button><button type="button" data-page="matches">Pré-jogo e relatórios</button><button type="button" data-page="lineup">Escalação</button></nav><p>Dados obtidos da tabela e dos compromissos já simulados; os detalhes de cada torneio permanecem nas abas abaixo.</p></section>`;
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
    else if(ui.section==="selecoes")body=selecoes(s);
    else if(ui.section==="historico")body=historico(s,D);
    else body=minhas(s,D,cat);
    const playable=cat.filter(c=>c.status==="playable"||c.status==="regional_pool").length;
    return `${css()}<section class="ch-dark" data-competitions-hub><small>CENTRAL MUNDIAL</small><h2>Competições · Temporada ${esc(s.season)}</h2><p class="ch-note">${cat.length} ligas no catálogo · ${playable} com calendário simulado. Nenhum clube fictício foi criado para completar ligas.</p>${ui.section==="minhas"&&!ui.leagueId?playerCompetitionFocus(s,D):""}${nav()}${body}</section>`;
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
