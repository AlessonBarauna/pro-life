(function youthAcademyViewModule(root){
  "use strict";
  // Stage 34F.22c - tela da Base (categoria de base) e dos Craques do Ano no mundo FC 27.
  // Somente leitura: nao altera o estado. Estado de interface (aba, clube, filtro) fica neste modulo.

  const ui={tab:"base",clubId:null,filter:"all",league:"ALL"};
  let ctx=null;

  const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
  const num=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const POS_LABEL={GOL:"GOL",DEF:"DEF",MEI:"MEI",ATA:"ATA"};
  const TIER_LABEL={craque:"Craque",promessa:"Promessa",normal:"Base"};

  // Potencial -> estrelas (0,5 a 5), em passos de meia estrela.
  function stars(potential){
    return Math.max(0.5,Math.min(5,Math.round(((num(potential)-45)/10)*2)/2));
  }
  const tierOf=p=>p.talent==="craque"||p.talent==="promessa"?p.talent:"normal";

  function isFc27(s){return s?.catalogVersion==="fc27_v1"&&Array.isArray(s.internationalPlayers);}

  function myClubId(s){
    const clubs=new Set((s?.globalFootball?.clubs||[]).map(club=>club.id));
    for(const id of [s?.person?.clubId,s?.clubId])if(id&&clubs.has(id))return id;
    return null;
  }

  function row(p,clubs,leagues){
    const club=clubs.get(p.clubId);
    return {
      id:p.id,name:p.name,pos:p.pos,age:num(p.age),nationality:p.nationality||"",
      ovr:num(p.ovr??p.overall),potential:num(p.potential),tier:tierOf(p),
      clubId:p.clubId||null,club:club?.name||"Sem clube",leagueId:club?.leagueId||null,
      league:leagues.get(club?.leagueId)||"",academy:!!p.academy,free:!p.clubId,stars:stars(p.potential),
      yearsToFirstTeam:p.academy?Math.max(0,20-num(p.age)):null
    };
  }
  const byPotential=(a,b)=>b.potential-a.potential||b.ovr-a.ovr||(a.id<b.id?-1:1);

  function snapshot(s,options={}){
    const enabled=isFc27(s);
    const base={enabled,season:num(s?.season),tab:options.tab||ui.tab};
    if(!enabled)return {...base,clubs:[],academy:[],stars:[],free:[],summary:null,intake:null,myClubId:null,clubId:null};
    const clubList=(s.globalFootball?.clubs||[]).filter(c=>c.fc27&&c.active!==false);
    const clubs=new Map((s.globalFootball?.clubs||[]).map(c=>[c.id,c])),leagues=new Map((s.globalFootball?.leagues||[]).map(l=>[l.id,l.name||l.id]));
    const mine=myClubId(s),clubId=options.clubId||ui.clubId||mine||clubList[0]?.id||null;
    const active=(s.internationalPlayers||[]).filter(p=>p&&p.status!=="retired"&&p.active!==false);
    const academy=active.filter(p=>p.academy&&p.clubId===clubId).map(p=>row(p,clubs,leagues)).sort(byPotential);
    const prospects=active.filter(p=>p.generated&&num(p.age)<=19&&(p.academy||!p.clubId)).map(p=>row(p,clubs,leagues));
    const filter=options.filter||ui.filter,league=options.league||ui.league;
    const starsList=prospects.filter(r=>(filter==="all"||r.tier===filter)&&(league==="ALL"||r.leagueId===league)).sort(byPotential).slice(0,24);
    const free=active.filter(p=>p.generated&&!p.clubId).map(p=>row(p,clubs,leagues)).sort(byPotential).slice(0,40);
    const avg=academy.length?Math.round(academy.reduce((n,r)=>n+r.potential,0)/academy.length):0;
    const leagueIds=[...new Set(clubList.map(c=>c.leagueId).filter(Boolean))];
    return {
      ...base,enabled,myClubId:mine,clubId,clubName:clubs.get(clubId)?.name||"",clubs:clubList.map(c=>({id:c.id,name:c.name,leagueId:c.leagueId,league:leagues.get(c.leagueId)||""})),
      leagues:leagueIds.map(id=>({id,name:leagues.get(id)||id})).sort((a,b)=>a.name<b.name?-1:1),
      academy,stars:starsList,free,filter,league,
      summary:{count:academy.length,avgPotential:avg,craques:academy.filter(r=>r.tier==="craque").length,promessas:academy.filter(r=>r.tier==="promessa").length,prospects:prospects.length},
      intake:s.globalFootball?.lastIntake||null
    };
  }

  function starsHtml(count){
    const pct=Math.round((count/5)*100);
    return `<span class="ya-stars" role="img" aria-label="Potencial ${count} de 5 estrelas"><span class="ya-stars-fill" style="width:${pct}%"></span></span>`;
  }
  function growthBar(r){
    const ovr=Math.max(0,Math.min(100,r.ovr)),pot=Math.max(ovr,Math.min(100,r.potential));
    return `<div class="ya-range" title="GER ${r.ovr} · potencial ${r.potential}"><i class="ya-range-now" style="width:${ovr}%"></i><i class="ya-range-gap" style="left:${ovr}%;width:${pot-ovr}%"></i></div>`;
  }
  function tierTag(r){return `<span class="ya-tier ya-tier-${r.tier}">${esc(TIER_LABEL[r.tier])}</span>`;}

  function card(r,options={}){
    const sub=options.showClub?`${esc(r.club)}${r.league?` · ${esc(r.league)}`:""}`:`${esc(r.nationality)}`;
    const note=r.academy&&r.yearsToFirstTeam!==null?(r.yearsToFirstTeam===0?"Decide o futuro neste ano":`Elenco principal em ${r.yearsToFirstTeam} ano${r.yearsToFirstTeam===1?"":"s"}`):(r.free?"Livre no mercado":"");
    return `<article class="ya-card ya-card-${r.tier}" data-youth-player="${esc(r.id)}">
      <div class="ya-ovr"><b>${r.ovr}</b><small>GER</small></div>
      <div class="ya-main">
        <header><h4>${esc(r.name)}</h4>${tierTag(r)}</header>
        <p><span class="ya-pos ya-pos-${esc(r.pos)}">${esc(POS_LABEL[r.pos]||r.pos)}</span> ${r.age} anos · ${sub}</p>
        ${growthBar(r)}
        <footer><span>${starsHtml(r.stars)}</span><span class="ya-pot">POT <b>${r.potential}</b></span><em>${esc(note)}</em></footer>
      </div>
    </article>`;
  }

  function podium(list){
    if(!list.length)return "";
    return `<div class="ya-podium">${list.slice(0,3).map((r,i)=>`<article class="ya-pod ya-pod-${i+1}">
      <span class="ya-rank">${i+1}</span>
      <div class="ya-pod-ovr"><b>${r.potential}</b><small>POTENCIAL</small></div>
      <h4>${esc(r.name)}</h4>
      <p>${esc(POS_LABEL[r.pos]||r.pos)} · ${r.age} anos · ${esc(r.nationality)}</p>
      <p class="ya-pod-club">${esc(r.club)}</p>
      ${growthBar(r)}
      <footer>${starsHtml(r.stars)} <span>GER ${r.ovr}</span> ${tierTag(r)}</footer>
    </article>`).join("")}</div>`;
  }

  function tabs(data){
    const items=[["base","Minha base"],["stars","Craques do ano"],["free","Jovens livres"]];
    return `<nav class="ya-tabs" role="tablist" aria-label="Seções da base">${items.map(([id,label])=>`<button type="button" role="tab" aria-selected="${data.tab===id}" data-youth-tab="${id}" class="${data.tab===id?"active":""}">${label}</button>`).join("")}</nav>`;
  }

  function clubSelect(data){
    const groups=new Map();
    for(const c of data.clubs){const key=c.league||"Outras";if(!groups.has(key))groups.set(key,[]);groups.get(key).push(c);}
    const options=[...groups.entries()].sort((a,b)=>a[0]<b[0]?-1:1).map(([league,list])=>`<optgroup label="${esc(league)}">${list.sort((a,b)=>a.name<b.name?-1:1).map(c=>`<option value="${esc(c.id)}"${c.id===data.clubId?" selected":""}>${esc(c.name)}${c.id===data.myClubId?" (meu clube)":""}</option>`).join("")}</optgroup>`).join("");
    return `<label class="ya-select"><span>Clube</span><select data-youth-club>${options}</select></label>`;
  }

  function intakeStrip(intake){
    if(!intake)return `<p class="ya-note">A primeira turma completa chega na virada de temporada. A base já está montada com no mínimo 6 jovens por clube.</p>`;
    return `<div class="ya-strip" aria-label="Resumo da última virada"><div><b>${num(intake.created)}</b><small>jovens na turma ${num(intake.season)}</small></div><div><b>${num(intake.free)}</b><small>livres no mercado</small></div><div><b>${num(intake.promoted)}</b><small>subiram ao profissional</small></div><div><b>${num(intake.released)}</b><small>dispensados da base</small></div></div>`;
  }

  function body(data){
    if(data.tab==="stars"){
      const chips=[["all","Todos"],["craque","Craques"],["promessa","Promessas"]].map(([id,label])=>`<button type="button" data-youth-filter="${id}" class="${data.filter===id?"active":""}" aria-pressed="${data.filter===id}">${label}</button>`).join("");
      const leagueSel=`<label class="ya-select"><span>Liga</span><select data-youth-league><option value="ALL">Todas as ligas</option>${data.leagues.map(l=>`<option value="${esc(l.id)}"${l.id===data.league?" selected":""}>${esc(l.name)}</option>`).join("")}</select></label>`;
      return `<div class="ya-toolbar"><div class="ya-chips">${chips}</div>${leagueSel}</div>
        ${data.stars.length?`${podium(data.stars)}<div class="ya-grid">${data.stars.slice(3).map(r=>card(r,{showClub:true})).join("")}</div>`:`<p class="ya-empty">Nenhuma promessa encontrada com este filtro.</p>`}`;
    }
    if(data.tab==="free"){
      return data.free.length
        ?`<p class="ya-note">Jovens sem clube. Assinam com um clube na próxima virada de temporada; quem não for contratado encerra a carreira.</p><div class="ya-grid">${data.free.map(r=>card(r,{showClub:false})).join("")}</div>`
        :`<p class="ya-empty">Nenhum jovem livre no momento.</p>`;
    }
    const sum=data.summary;
    return `<div class="ya-toolbar">${clubSelect(data)}<div class="ya-facts"><span><b>${sum.count}</b> na base</span><span><b>${sum.avgPotential||"–"}</b> potencial médio</span><span><b>${sum.craques}</b> craque${sum.craques===1?"":"s"}</span><span><b>${sum.promessas}</b> promessa${sum.promessas===1?"":"s"}</span></div></div>
      ${data.academy.length?`<div class="ya-grid">${data.academy.map(r=>card(r)).join("")}</div>`:`<p class="ya-empty">A base deste clube ainda será formada. Avance o calendário para completar a categoria de base.</p>`}`;
  }

  function render(s,D,options={}){
    ctx={s,D};
    const data=snapshot(s,options);
    if(!data.enabled){
      return `<section class="youth-academy ya-dark" data-youth-root>${styles()}<div class="ya-empty-main"><small>BASE E CRAQUES</small><h2>Disponível nas carreiras FC 27</h2><p>Esta carreira usa o mundo clássico, sem categorias de base por clube. Crie uma carreira com o catálogo FC 27 para acompanhar as promessas.</p></div></section>`;
    }
    return `<section class="youth-academy ya-dark" data-youth-root>${styles()}
      <header class="ya-head"><div><small>BASE E CRAQUES · ${data.season}</small><h2>${data.tab==="stars"?"Craques do ano":data.tab==="free"?"Jovens livres":esc(data.clubName||"Categoria de base")}</h2></div><div class="ya-head-count"><b>${data.summary.prospects}</b><small>promessas até 19 anos no mundo</small></div></header>
      ${intakeStrip(data.intake)}
      ${tabs(data)}
      ${body(data)}
    </section>`;
  }

  function refresh(){
    if(!ctx)return;
    const element=root.document?.querySelector("[data-youth-root]");
    if(element)element.outerHTML=render(ctx.s,ctx.D);
  }

  function styles(){
    return `<style data-youth-academy-style>
      .ya-dark{--ya-bg:#0a1119;--ya-card:#111b26;--ya-line:rgba(255,255,255,.09);--ya-text:#f2f4f6;--ya-muted:#8b99a6;--ya-gold:#d8b45b;--ya-teal:#4cc3b0;--ya-grey:#6f7f8c;display:block;padding:24px;border-radius:18px;background:var(--ya-bg);color:var(--ya-text);border:1px solid var(--ya-line)}
      .ya-dark h2,.ya-dark h4{margin:0}.ya-dark small{color:var(--ya-muted);letter-spacing:.12em;text-transform:uppercase;font-size:11px}
      .ya-head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-bottom:16px}.ya-head h2{font-size:30px;line-height:1.1;margin-top:6px}
      .ya-head-count{text-align:right}.ya-head-count b{display:block;font-size:34px;font-variant-numeric:tabular-nums;color:var(--ya-gold);line-height:1}
      .ya-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--ya-line);border:1px solid var(--ya-line);border-radius:12px;overflow:hidden;margin-bottom:18px}
      .ya-strip div{background:var(--ya-card);padding:12px 14px}.ya-strip b{display:block;font-size:22px;font-variant-numeric:tabular-nums}.ya-strip small{text-transform:none;letter-spacing:0;font-size:12px}
      .ya-note{color:var(--ya-muted);margin:0 0 16px}
      .ya-tabs{display:flex;gap:4px;border-bottom:1px solid var(--ya-line);margin-bottom:18px}.ya-tabs button{background:none;border:0;border-bottom:2px solid transparent;color:var(--ya-muted);padding:10px 16px;font:inherit;font-weight:600;cursor:pointer}.ya-tabs button.active{color:var(--ya-text);border-bottom-color:var(--ya-gold)}.ya-tabs button:focus-visible,.ya-chips button:focus-visible{outline:2px solid var(--ya-gold);outline-offset:2px}
      .ya-toolbar{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:14px;margin-bottom:16px}
      .ya-select{display:grid;gap:4px;font-size:12px;color:var(--ya-muted)}.ya-select select{background:var(--ya-card);color:var(--ya-text);border:1px solid var(--ya-line);border-radius:10px;padding:9px 12px;font:inherit;min-width:230px;max-width:100%}
      .ya-facts{display:flex;flex-wrap:wrap;gap:18px;color:var(--ya-muted)}.ya-facts b{color:var(--ya-text);font-variant-numeric:tabular-nums;font-size:18px}
      .ya-chips{display:flex;gap:6px;flex-wrap:wrap}.ya-chips button{background:var(--ya-card);color:var(--ya-muted);border:1px solid var(--ya-line);border-radius:999px;padding:7px 14px;font:inherit;cursor:pointer}.ya-chips button.active{color:#0a1119;background:var(--ya-gold);border-color:var(--ya-gold);font-weight:700}
      .ya-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:12px}
      .ya-card{display:grid;grid-template-columns:64px 1fr;gap:14px;background:var(--ya-card);border:1px solid var(--ya-line);border-left:4px solid var(--ya-grey);border-radius:12px;padding:14px}.ya-card-craque{border-left-color:var(--ya-gold)}.ya-card-promessa{border-left-color:var(--ya-teal)}
      .ya-ovr{display:grid;align-content:center;justify-items:center;border-right:1px solid var(--ya-line);padding-right:10px}.ya-ovr b{font-size:34px;line-height:1;font-variant-numeric:tabular-nums}.ya-ovr small{font-size:10px}
      .ya-main header{display:flex;justify-content:space-between;align-items:center;gap:8px}.ya-main h4{font-size:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ya-main p{margin:4px 0 8px;color:var(--ya-muted);font-size:13px}
      .ya-pos{display:inline-block;min-width:34px;text-align:center;border-radius:5px;padding:1px 6px;font-size:11px;font-weight:700;color:#0a1119;background:#9aa7b2}.ya-pos-GOL{background:#e3b85c}.ya-pos-DEF{background:#6aa7e0}.ya-pos-MEI{background:#58c28b}.ya-pos-ATA{background:#e0705f}
      .ya-tier{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:2px 7px;border-radius:5px;border:1px solid var(--ya-line);color:var(--ya-muted);white-space:nowrap}.ya-tier-craque{color:var(--ya-gold);border-color:var(--ya-gold)}.ya-tier-promessa{color:var(--ya-teal);border-color:var(--ya-teal)}
      .ya-range{position:relative;height:7px;background:rgba(255,255,255,.07);border-radius:4px;overflow:hidden}.ya-range-now{position:absolute;left:0;top:0;bottom:0;background:var(--ya-text);opacity:.85;border-radius:4px 0 0 4px}.ya-range-gap{position:absolute;top:0;bottom:0;background:repeating-linear-gradient(90deg,var(--ya-gold) 0 4px,transparent 4px 7px)}
      .ya-card-promessa .ya-range-gap{background:repeating-linear-gradient(90deg,var(--ya-teal) 0 4px,transparent 4px 7px)}
      .ya-main footer{display:flex;align-items:center;gap:12px;margin-top:9px;font-size:12px;flex-wrap:wrap}.ya-main footer em{color:var(--ya-muted);font-style:normal;margin-left:auto}.ya-pot b{font-variant-numeric:tabular-nums;font-size:15px}
      .ya-stars{position:relative;display:inline-block;width:72px;height:14px;background:linear-gradient(90deg,rgba(255,255,255,.14) 0 0);-webkit-mask:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='72' height='14' viewBox='0 0 72 14'><g fill='black'><path id='s' d='M7 .8l1.9 4.3 4.6.4-3.5 3.1 1.1 4.6L7 10.8l-4.1 2.4 1.1-4.6L.5 5.5l4.6-.4z'/><use href='%23s' x='14.4'/><use href='%23s' x='28.8'/><use href='%23s' x='43.2'/><use href='%23s' x='57.6'/></g></svg>") center/100% 100% no-repeat;mask:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='72' height='14' viewBox='0 0 72 14'><g fill='black'><path id='s' d='M7 .8l1.9 4.3 4.6.4-3.5 3.1 1.1 4.6L7 10.8l-4.1 2.4 1.1-4.6L.5 5.5l4.6-.4z'/><use href='%23s' x='14.4'/><use href='%23s' x='28.8'/><use href='%23s' x='43.2'/><use href='%23s' x='57.6'/></g></svg>") center/100% 100% no-repeat}
      .ya-stars-fill{position:absolute;left:0;top:0;bottom:0;background:var(--ya-gold)}
      .ya-podium{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px}
      .ya-pod{position:relative;background:var(--ya-card);border:1px solid var(--ya-line);border-top:3px solid var(--ya-gold);border-radius:14px;padding:18px}.ya-pod-2{border-top-color:#b8c2cc}.ya-pod-3{border-top-color:#b07a4a}
      .ya-rank{position:absolute;right:14px;top:8px;font-size:44px;font-weight:800;opacity:.12;line-height:1}
      .ya-pod-ovr b{font-size:46px;line-height:1;color:var(--ya-gold);font-variant-numeric:tabular-nums}.ya-pod-ovr{margin-bottom:6px}.ya-pod h4{font-size:19px}.ya-pod p{margin:4px 0;color:var(--ya-muted);font-size:13px}.ya-pod-club{color:var(--ya-text)!important}
      .ya-pod footer{display:flex;align-items:center;gap:10px;margin-top:10px;font-size:12px;flex-wrap:wrap}
      .ya-empty,.ya-empty-main p{color:var(--ya-muted)}.ya-empty{padding:28px 0;text-align:center}.ya-empty-main{padding:20px 4px}.ya-empty-main h2{margin:6px 0 10px}
      @media(max-width:900px){.ya-dark{padding:16px}.ya-podium{grid-template-columns:1fr}.ya-strip{grid-template-columns:repeat(2,1fr)}.ya-head{flex-direction:column;align-items:flex-start}.ya-head-count{text-align:left}.ya-toolbar{align-items:stretch}.ya-select select{min-width:0;width:100%}.ya-main footer em{margin-left:0;width:100%}}
    </style>`;
  }

  if(root.document&&!root.__proLifeYouthAcademyBound){
    root.__proLifeYouthAcademyBound=true;
    root.document.addEventListener("click",event=>{
      const tab=event.target.closest?.("[data-youth-tab]");
      if(tab){ui.tab=tab.getAttribute("data-youth-tab")||"base";refresh();return;}
      const chip=event.target.closest?.("[data-youth-filter]");
      if(chip){ui.filter=chip.getAttribute("data-youth-filter")||"all";refresh();}
    });
    root.document.addEventListener("change",event=>{
      const club=event.target.closest?.("[data-youth-club]");
      if(club){ui.clubId=club.value||null;refresh();return;}
      const league=event.target.closest?.("[data-youth-league]");
      if(league){ui.league=league.value||"ALL";refresh();}
    });
  }

  const api={snapshot,render,stars,esc,state:ui};
  root.ProLifeYouthAcademyView=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
