(function playerCentralModule(root){
  "use strict";
  // Central do JOGADOR: o foco e a carreira do atleta (card, forma, contrato, numeros, evolucao), nao a gestao do clube.
  // So le o estado e o snapshot ja calculado pela Central; nao altera nada.
  const FALLBACK_ESC=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const GROUPS=[["RIT",["pace","acceleration","sprint"]],["FIN",["finish","powerShot","finesseShot","longShot","positioning"]],["PAS",["pass","longPass","vision","crossing"]],["DRI",["dribbling","ballControl","agility","technique"]],["DEF",["defense","tackling","interception"]],["FÍS",["strength","stamina","jumping","balance"]]];
  const avg=(p,keys)=>{const a=p?.attrs||{},v=keys.map(k=>Number(a[k])).filter(n=>Number.isFinite(n));return v.length?Math.round(v.reduce((s,n)=>s+n,0)/v.length):null;};
  const tier=o=>o>=85?"elite":o>=75?"gold":o>=65?"silver":"bronze";
  const num=(v,d=0)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
  const duration=days=>{const d=Math.max(0,Math.round(num(days)));if(d<31)return `${d} dia${d===1?"":"s"}`;const m=Math.round(d/30.4),y=Math.floor(m/12),r=m%12;return [y?`${y} ano${y>1?"s":""}`:"",r?`${r} ${r>1?"meses":"mês"}`:""].filter(Boolean).join(" e ")||"—";};
  const meter=(label,value,hint)=>{const none=value==null;const v=Math.max(0,Math.min(100,num(value)));return `<div class="pc-meter ${none?"mid":v>=75?"good":v>=50?"mid":"low"}"><div><span>${label}</span><b>${none?"—":Math.round(v)}</b></div><i style="--v:${v}%"></i>${hint?`<small>${hint}</small>`:""}</div>`;};

  function render(state,D,H,u){
    const esc=u.esc||FALLBACK_ESC,money=u.money||(v=>String(v)),dayDate=u.dayDate||(d=>String(d));
    const p=state.person||{},c=H.c,next=H.next,pc=H.career?.playerCareer||{},ct=pc.contract||{};
    const ovr=num(H.player.overall,num(p.overall)),pot=Math.max(ovr,num(p.potential,ovr));
    const st=H.stats?.season||{},cs=H.stats?.currentClubSeason||st;
    const club=c?.name||"Sem clube";
    const crestBig=c?.id&&root.ProLifeClubCrests?root.ProLifeClubCrests.render(c.id,{size:"md"}):"";
    const portrait=root.ProLifePlayerCard?.portrait?root.ProLifePlayerCard.portrait(p):"";
    const arch=D.Archetypes?.get?.(p.archetypeId)?.name||D.Archetypes?.byId?.(p.archetypeId)?.name||(p.archetypeId?String(p.archetypeId).replace(/^./,x=>x.toUpperCase()):"");
    const statsHtml=GROUPS.map(([n,k])=>`<span><small>${n}</small><b>${avg(p,k)??"—"}</b></span>`).join("");
    const hero=`<aside class="pc-card" data-tier="${tier(ovr)}"><div class="pc-card-top"><div class="pc-ovr"><b>${ovr}</b><small>${esc(p.pos||"—")}</small>${crestBig?`<span class="pc-card-crest">${crestBig}</span>`:""}</div>${portrait?`<img class="pc-portrait" src="${portrait}" alt="" />`:""}</div><h2>${esc(p.name||"Jogador")}</h2><p class="pc-sub">${num(p.age)} anos · ${esc(club)}${pc.number||H.career?.number?` · Nº ${esc(pc.number||H.career.number)}`:""}</p><div class="pc-attrs">${statsHtml}</div><div class="pc-pot"><div><span>Evolução</span><b>${ovr} <em>/ potencial ${pot}</em></b></div><i style="--v:${pot?Math.round(ovr/pot*100):0}%"></i></div>${arch?`<p class="pc-arch">${esc(arch)}</p>`:""}<div class="pc-links"><button data-page="profile">Perfil e carreira</button><button data-page="training">Treino</button></div></aside>`;

    // proximo jogo + papel do jogador
    const role=H.lineup?.heroRole||H.player.squadRole||"A definir";
    const daysTo=next?Math.max(0,num(next.date,state.day)-state.day):null;
    const mini=(id,name,nat)=>u.crest?u.crest(id,name,nat,"lg"):"";
    const matchBox=next?`<section class="pc-match"><small>PRÓXIMA PARTIDA</small><div class="pc-match-teams"><span>${mini(next.homeClubId,next.home,next.national)}<b>${esc(next.home)}</b></span><em>${daysTo===0?"HOJE":`EM ${daysTo} DIA${daysTo===1?"":"S"}`}</em><span>${mini(next.awayClubId,next.away,next.national)}<b>${esc(next.away)}</b></span></div><p>${esc(next.competitionName||"Partida")} · ${esc(next.stage||"")} · ${dayDate(next.date)}</p><div class="pc-role"><div><small>SEU PAPEL</small><b>${esc(role)}</b></div><div><small>OBJETIVO</small><b>${esc(H.objectives?.[0]?.label||"Boa atuação")}</b></div>${p.injury?`<div class="bad"><small>LESÃO</small><b>${num(p.injury)} dia(s)</b></div>`:""}</div><div class="pc-actions"><button class="primary" data-live-match>Acompanhar partida</button><button data-simulate="nextCommitment">Simular até o jogo</button><button data-advance="1">Avançar 1 dia</button><button data-page="lineup">Ver escalação</button></div></section>`:`<section class="pc-match"><small>PRÓXIMA PARTIDA</small><p class="pc-empty">Nenhum compromisso oficial agendado. Use o treino e avance o calendário.</p><div class="pc-actions"><button data-advance="1">Avançar 1 dia</button><button data-simulate="30days">+30 dias</button></div></section>`;

    // condicao
    const form=H.player.form;
    const cond=`<section class="pc-panel pc-cond"><h3>Como você está</h3>${meter("Condição física",p.condition??100)}${meter("Moral",p.morale??70)}${meter("Forma recente",form==null?null:form*10,form==null?"Sem jogos ainda":`Nota média ${String(form).replace(".",",")} nos últimos jogos`)}${p.injury?`<p class="pc-warn">Lesionado: ${num(p.injury)} dia(s) de recuperação.</p>`:""}</section>`;

    // numeros da temporada
    const rows=[["Jogos",num(st.appearances)],["Gols",num(st.goals)],["Assistências",num(st.assists)],["Nota média",num(st.averageRating)?String(Number(st.averageRating).toFixed(1)).replace(".",","):"—"],["Minutos",num(st.minutes)],["Craque do jogo",num(st.motm)]];
    const nt=H.stats?.national||state.nationalTeam||{},caps=num(nt.caps);
    const natLine=caps?`<p class="pc-nat">Pela Seleção: <b>${caps}</b> jogo${caps>1?"s":""} · <b>${num(nt.goals)}</b> gol${num(nt.goals)===1?"":"s"} · <b>${num(nt.assists)}</b> assistência${num(nt.assists)===1?"":"s"}</p>`:"";
    const season=`<section class="pc-panel pc-season"><div class="pc-head"><h3>Sua temporada ${esc(state.season)}</h3><button data-page="statistics">Estatísticas ›</button></div><div class="pc-nums">${rows.map(([l,v])=>`<div><b>${v}</b><small>${l}</small></div>`).join("")}</div>${natLine}</section>`;

    // contrato
    const left=ct.endDay!=null?Math.max(0,num(ct.endDay)-state.day):null;
    const contract=`<section class="pc-panel pc-contract"><div class="pc-head"><h3>Contrato</h3><button data-page="contract">Abrir ›</button></div><dl><div><dt>Clube</dt><dd>${esc(club)}</dd></div><div><dt>Salário</dt><dd>${money(num(ct.salary,state.salary))}/mês</dd></div><div><dt>Termina em</dt><dd>${left==null?"—":duration(left)}</dd></div><div><dt>Papel no elenco</dt><dd>${esc(pc.squadRole||ct.role||"—")}</dd></div><div><dt>Valor de mercado</dt><dd>${money(num(H.player.marketValue,pc.marketValue))}</dd></div></dl>${(state.offers||[]).length?`<button class="pc-urgent" data-page="proposals">${state.offers.length} proposta${state.offers.length>1?"s":""} aguardando resposta ›</button>`:""}</section>`;

    // ultimos jogos do jogador
    const recent=(H.recent||[]).slice(0,5).map(x=>{const h=x.hero||{},line=h.played?[h.goals?`${h.goals} gol${h.goals>1?"s":""}`:"",h.assists?`${h.assists} assist.`:"",`${h.minutes||0}'`].filter(Boolean).join(" · "):"Não jogou";return `<div class="pc-game"><b class="r-${esc(x.result||"")}">${esc(x.result||"–")}</b><div><span>${esc(x.home)} ${esc(x.score)} ${esc(x.away)}</span><small>${x.national?`${esc(x.competition||"Seleção")} · `:""}${esc(line)}</small></div><em>${x.rating!=null?String(Number(x.rating).toFixed(1)).replace(".",","):"—"}</em></div>`;}).join("");
    const games=`<section class="pc-panel pc-games"><div class="pc-head"><h3>Suas últimas atuações</h3><button data-page="matches">Partidas ›</button></div>${recent||'<p class="pc-empty">Suas atuações aparecem aqui depois do primeiro jogo.</p>'}</section>`;

    // objetivos + evolucao
    const objs=(H.objectives||[]).map(o=>`<li>${esc(o.label)}</li>`).join("");
    const dev=`<section class="pc-panel pc-dev"><div class="pc-head"><h3>Evolução e objetivos</h3><button data-page="training">Treino ›</button></div><div class="pc-dev-row"><div><small>FOCO DE TREINO</small><b>${esc(H.training?.focus||"Equilíbrio")}</b><span>${esc(H.training?.intensity||"Normal")} · ${num(H.training?.improvements)} melhoria(s)</span></div></div>${objs?`<div class="pc-obj"><small>OBJETIVOS PARA O PRÓXIMO JOGO</small><ul>${objs}</ul></div>`:""}</section>`;

    // agenda
    const agenda=(H.events||[]).slice(0,4).map(e=>`<div class="pc-ag"><span>${dayDate(e.day)}</span><div><b>${esc(e.title||"Compromisso")}</b><small>${esc(e.detail||"")}</small></div></div>`).join("");
    const cal=`<section class="pc-panel pc-agenda"><div class="pc-head"><h3>Agenda</h3><button data-page="calendar">Calendário ›</button></div>${agenda||'<p class="pc-empty">Sem compromissos próximos.</p>'}</section>`;

    // carreira / alertas
    const al=[];
    if(state.decision)al.push(["Decisão pendente",state.decision.title||"Ação necessária","life"]);
    if(pc.coachTrust!=null)al.push(["Confiança do treinador",`${Math.round(num(pc.coachTrust))}%`,"profile"]);
    al.push(["Seu legado","Marcos, títulos e trajetória","legacy"],["Empresário e agência","Contratos, propostas e imagem","agency"]);
    const alerts=`<section class="pc-panel pc-alerts"><div class="pc-head"><h3>Sua carreira</h3><button data-page="inbox">Mensagens ›</button></div>${al.slice(0,4).map(([l,d,pg])=>`<button class="pc-link" data-page="${pg}"><b>${esc(l)}</b><small>${esc(d)}</small><span>›</span></button>`).join("")}</section>`;

    return `<div class="career-dashboard pc-central"><header class="pc-header"><div><span>TEMPORADA ${esc(state.season)} · ${dayDate(state.day)}</span><h1>Minha carreira</h1></div><p>${esc(club)} · ${esc(H.table?.league||"")}${H.table?.position?` · ${H.table.position}º lugar`:""}</p></header><div class="pc-layout">${hero}<div class="pc-main">${matchBox}<div class="pc-row">${cond}${season}</div></div></div><div class="pc-grid">${contract}${games}${dev}${cal}${alerts}</div></div>`;
  }
  root.ProLifePlayerCentral={render};
  if(typeof module!=="undefined"&&module.exports)module.exports=root.ProLifePlayerCentral;
})(typeof globalThis!=="undefined"?globalThis:this);
