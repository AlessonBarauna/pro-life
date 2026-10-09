(function targetClubSelectorModule(root){
  "use strict";

  const ClubBrowser=
    root.ProLifeClubBrowser ||
    (typeof require==="function"
      ? require("./club-browser.js")
      : null);

  const ui={country:"ALL",league:"ALL",query:""};
  let current=null;

  function esc(value){
    return String(value??"").replace(
      /[&<>"']/g,
      char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]
    );
  }

  function norm(value){
    return String(value||"")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .toLowerCase()
      .trim();
  }

  function catalog(s,D,Career){
    const seen=new Set();
    return (ClubBrowser?.collect?.(s,D)||[])
      .filter(club=>{
        if(!club?.id||club.id===s.clubId||seen.has(club.id)) return false;
        seen.add(club.id);
        return true;
      })
      .map(club=>{
        const raw=D.club(s,club.id)||club;
        const level=Number(Career?.clubLevel?.(raw,s) ?? club.reputation ?? 0);
        return {
          ...club,
          level:Number.isFinite(level)?Math.round(level):0
        };
      });
  }

  function filtersFor(clubs,country=ui.country){
    const countries=[...new Set(clubs.map(club=>club.country))]
      .sort((a,b)=>String(a).localeCompare(String(b),"pt-BR"));
    const leagues=[];
    const seen=new Set();
    for(const club of clubs){
      if(country!=="ALL"&&club.country!==country) continue;
      if(seen.has(club.leagueId)) continue;
      seen.add(club.leagueId);
      leagues.push({id:club.leagueId,name:club.leagueName,country:club.country});
    }
    leagues.sort((a,b)=>String(a.name).localeCompare(String(b.name),"pt-BR"));
    return {countries,leagues};
  }

  function snapshot(s,D,Career,options={}){
    const clubs=catalog(s,D,Career);
    const country=options.country??ui.country;
    const league=options.league??ui.league;
    const query=options.query??ui.query;
    const q=norm(query);
    const visible=clubs.filter(club=>
      (country==="ALL"||club.country===country)&&
      (league==="ALL"||club.leagueId===league)&&
      (!q||norm(`${club.name} ${club.shortName||""}`).includes(q))
    );
    const targetId=Career?.init?.(s)?.playerCareer?.targetClub?.clubId||null;
    const selected=clubs.find(club=>club.id===targetId)||null;
    return {
      clubs,
      visible,
      selected,
      assessment:selected?Career.targetClubAssessment(s,selected.id):null,
      ...filtersFor(clubs,country),
      filters:{country,league,query}
    };
  }

  function initializeFilters(s,D,Career){
    const clubs=catalog(s,D,Career);
    const targetId=Career.init(s).playerCareer?.targetClub?.clubId;
    const target=clubs.find(club=>club.id===targetId);
    const own=clubs.find(club=>club.id===s.clubId);
    const anchor=target||own||clubs[0];
    ui.country=anchor?.country||"ALL";
    ui.league=target?.leagueId||"ALL";
    ui.query="";
  }

  function render(s,D,Career){
    if(!current||current.s!==s){
      current={s,D,Career};
      initializeFilters(s,D,Career);
    }else current={s,D,Career};

    let data=snapshot(s,D,Career);
    if(ui.league!=="ALL"&&!data.leagues.some(league=>league.id===ui.league)){
      ui.league="ALL";
      data=snapshot(s,D,Career);
    }
    const shown=data.visible.slice(0,60);
    const target=data.selected;
    const assessment=data.assessment;
    const pipeline=target
      ? (Career.init(s).playerCareer.interests||[]).find(item=>item.clubId===target.id)?.stage||"Monitoramento"
      : null;

    return `<section class="card section target-club-world" data-target-club-root>
      ${styles()}
      <header class="target-club-head"><div><div class="tag">CLUBE-ALVO MUNDIAL</div><h2>Planeje sua próxima transferência</h2><p>Explore o futebol mundial por país e liga. Escolher um objetivo não garante proposta.</p></div><span>${data.clubs.length} clubes elegíveis</span></header>
      ${target?`<article class="target-club-current"><small>OBJETIVO ATUAL</small><div><b>${esc(target.name)}</b><span>${esc(target.country)} · ${esc(target.leagueName)}</span></div><strong>${esc(assessment?.label||"Em análise")}</strong><p>Nível ${target.level}/100 · OVR recomendado ${assessment?.required??"—"} · Pipeline: ${esc(pipeline)}</p><button data-action="clear-target-club">Remover alvo</button></article>`:""}
      <div class="target-club-filters">
        <label>País<select data-target-club-country><option value="ALL">Todos os países</option>${data.countries.map(country=>`<option value="${esc(country)}" ${country===ui.country?"selected":""}>${esc(country)}</option>`).join("")}</select></label>
        <label>Liga<select data-target-club-league><option value="ALL">Todas as ligas</option>${data.leagues.map(league=>`<option value="${esc(league.id)}" ${league.id===ui.league?"selected":""}>${esc(league.name)}</option>`).join("")}</select></label>
        <label class="target-club-search">Buscar clube<input type="search" value="${esc(ui.query)}" placeholder="Digite o nome do clube" data-target-club-search></label>
      </div>
      <div class="target-club-count">${data.visible.length} resultado${data.visible.length===1?"":"s"}${data.visible.length>shown.length?` · mostrando ${shown.length}; refine os filtros`:""}</div>
      <div class="target-club-list">${shown.map(club=>{
        const fit=Career.targetClubAssessment(s,club.id);
        const active=target?.id===club.id;
        return `<article class="target-club-row ${active?"active":""}"><span class="target-club-badge">${esc(String(club.shortName||club.name).slice(0,3).toUpperCase())}</span><div><b>${esc(club.name)}</b><small>${esc(club.country)} · ${esc(club.leagueName)}</small></div><span><small>NÍVEL</small><b>${club.level}</b></span><span class="target-club-fit ${fit?.realistic?"compatible":"ambitious"}">${esc(fit?.label||"Em análise")}</span><button type="button" data-target-club-select="${esc(club.id)}" ${active?"disabled":""}>${active?"Objetivo atual":"Definir objetivo"}</button></article>`;
      }).join("")||`<div class="target-club-empty">Nenhum clube encontrado. Ajuste os filtros ou a busca.</div>`}</div>
    </section>`;
  }

  function styles(){
    return `<style data-target-club-style>
      .target-club-world{grid-column:1/-1;background:linear-gradient(145deg,#111c25,#0b1219)!important;border-color:rgba(255,255,255,.08)!important}.target-club-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-end}.target-club-head p{margin-bottom:0;color:var(--muted)}.target-club-head>span{color:#d8b45b;font-weight:800}.target-club-current{display:grid;grid-template-columns:auto 1fr auto auto;gap:8px 16px;align-items:center;margin:18px 0;padding:16px;border:1px solid rgba(216,180,91,.28);border-radius:12px;background:rgba(216,180,91,.08)}.target-club-current>small{grid-column:1/-1;color:#d8b45b}.target-club-current div{display:grid}.target-club-current span,.target-club-current p{color:var(--muted);font-size:11px}.target-club-current strong{color:#d8b45b}.target-club-current p{margin:0}.target-club-filters{display:grid;grid-template-columns:1fr 1.25fr 1.5fr;gap:10px;margin:18px 0}.target-club-filters label{display:grid;gap:6px;color:var(--muted);font-size:10px}.target-club-count{margin-bottom:8px;color:var(--muted);font-size:11px}.target-club-list{display:grid;gap:6px;max-height:620px;overflow:auto}.target-club-row{display:grid;grid-template-columns:42px minmax(150px,1fr) 55px 145px auto;gap:12px;align-items:center;padding:10px 12px;border-radius:9px;background:rgba(255,255,255,.035)}.target-club-row.active{box-shadow:inset 3px 0 #d8b45b;background:rgba(216,180,91,.09)}.target-club-badge{width:38px;height:38px;display:grid;place-items:center;border-radius:50%;background:#192732;color:#d8b45b;font-size:10px;font-weight:900}.target-club-row>div{display:grid}.target-club-row small{color:var(--muted);font-size:9px}.target-club-row>span:nth-of-type(2){display:grid;text-align:center}.target-club-fit{font-size:10px;font-weight:800}.target-club-fit.compatible{color:#72d49a}.target-club-fit.ambitious{color:#e0ba61}.target-club-empty{padding:35px;text-align:center;color:var(--muted)}
      @media(max-width:760px){.target-club-head,.target-club-current{display:flex;flex-direction:column;align-items:flex-start}.target-club-filters{grid-template-columns:1fr}.target-club-row{grid-template-columns:38px 1fr auto}.target-club-row>span:nth-of-type(2),.target-club-fit{display:none}.target-club-row button{grid-column:2/-1}.target-club-list{max-height:none}}
    </style>`;
  }

  function refresh(options={}){
    if(!current||!root.document) return;
    const element=root.document.querySelector("[data-target-club-root]");
    if(!element) return;
    element.outerHTML=render(current.s,current.D,current.Career);
    if(options.focusSearch){
      const input=root.document.querySelector("[data-target-club-search]");
      input?.focus();
      try{input?.setSelectionRange(input.value.length,input.value.length);}catch{}
    }
  }

  function mount(s,D,Career){
    current={s,D,Career};
    if(!root.document) return false;
    const legacy=root.document.querySelector("#target-club")?.closest("section");
    if(!legacy) return false;
    legacy.outerHTML=render(s,D,Career);
    return true;
  }

  function setFilters(filters={}){
    if(filters.country!==undefined){ui.country=filters.country||"ALL";ui.league="ALL";}
    if(filters.league!==undefined) ui.league=filters.league||"ALL";
    if(filters.query!==undefined) ui.query=String(filters.query||"");
  }

  if(root.document&&!root.__proLifeTargetClubSelectorBound){
    root.__proLifeTargetClubSelectorBound=true;
    root.document.addEventListener("change",event=>{
      if(event.target.matches("[data-target-club-country]")){setFilters({country:event.target.value});refresh();}
      else if(event.target.matches("[data-target-club-league]")){setFilters({league:event.target.value});refresh();}
    });
    root.document.addEventListener("input",event=>{
      if(!event.target.matches("[data-target-club-search]")) return;
      setFilters({query:event.target.value});
      refresh({focusSearch:true});
    });
  }

  const api={catalog,snapshot,render,mount,setFilters,norm,reset(){ui.country="ALL";ui.league="ALL";ui.query="";current=null;}};
  root.ProLifeTargetClubSelector=api;
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
