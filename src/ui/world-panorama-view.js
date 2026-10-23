(function(root){
  "use strict";
  // 34F.31E - Panorama mundial: moldura de temporada + central de competicoes (hub 34F.29A) + arquivo sob demanda.
  // Nenhum dado novo e criado: tudo vem do catalogo FC 27, do contexto da carreira e dos registros canonicos.
  const ui={archive:false};
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const HUB=()=>root.ProLifeCompetitionsHub||(typeof require==="function"?(()=>{try{return require("./competitions-hub-view.js");}catch(e){return null;}})():null);
  const CTX=()=>root.ProLifeCareerContext||(typeof require==="function"?(()=>{try{return require("../domain/career-context.js");}catch(e){return null;}})():null);
  const dateOf=day=>{const d=new Date(Date.UTC(2026,0,1+Number(day||0)));return d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",timeZone:"UTC"});};
  // Ano civil (data do calendario), temporada esportiva do PRO-LIFE (id usado pelas competicoes) e ultima temporada encerrada.
  function seasonInfo(s){
    const civil=new Date(Date.UTC(2026,0,1+Number(s.day||0))).getUTCFullYear(); // ano da data exibida (calendario real, com bissextos)
    const closed=((s.statistics&&s.statistics.seasons)||[]).map(x=>x.season).filter(Number.isFinite).sort((a,b)=>b-a)[0]||null;
    return {civilYear:civil,seasonId:s.season,lastClosed:closed,date:dateOf(s.day),
      note:"Todas as competições simuladas usam o ciclo anual do PRO-LIFE: a temporada leva o mesmo ano do calendário. O PRO-LIFE não divide as ligas europeias em 2029/30."};
  }
  // Totais da central (derivados do catalogo; usados na interface e nos testes).
  function summary(s,D){
    const H=HUB();if(!H)return null;const cat=H.catalog(s,D),by={};
    for(const c of cat)by[c.status]=(by[c.status]||0)+1;
    const fc27=cat.filter(c=>c.world);
    return {total:cat.length,fc27:fc27.length,fc27Playable:fc27.filter(c=>c.status==="playable"||c.status==="regional_pool"||c.status==="partial").length,
      catalogOnly:fc27.filter(c=>c.status==="catalog_only").map(c=>c.id),byStatus:by,
      withResults:fc27.filter(c=>{try{return !!((s.globalFootball&&s.globalFootball.worldCompetitions&&s.globalFootball.worldCompetitions.leagues||{})[c.id]);}catch(e){return false;}}).length};
  }
  function header(s,D){
    const info=seasonInfo(s),C=CTX(),ctx=C?C.resolve(s,D):null,sum=summary(s,D);
    const club=ctx&&ctx.club?ctx.club.name:"Sem clube",lg=ctx&&ctx.league&&ctx.league.name?ctx.league.name:"—";
    return `<section class="wp-head"><small>PANORAMA MUNDIAL</small><h2>Temporada ${esc(info.seasonId)}</h2>
<div class="wp-strip"><div><small>Data</small><b>${esc(info.date)}</b></div><div><small>Ano civil</small><b>${esc(info.civilYear)}</b></div><div><small>Temporada PRO-LIFE</small><b>${esc(info.seasonId)}</b></div><div><small>Última encerrada</small><b>${info.lastClosed?esc(info.lastClosed):"—"}</b></div><div><small>Seu clube</small><b>${esc(club)}</b></div><div><small>Competição principal</small><b>${esc(lg)}</b></div></div>
<p class="wp-note">${esc(info.note)} O resumo do seu último ano refere-se à última temporada encerrada${info.lastClosed?` (${esc(info.lastClosed)})`:""}, não à temporada em andamento.</p>
${sum?`<p class="wp-note">${sum.fc27} ligas do catálogo FC 27 · ${sum.fc27Playable} com calendário simulado · ${sum.catalogOnly.length} somente catálogo (sem clubes ou calendário inventados).</p>`:""}</section>`;
  }
  function css(){return `<style>
.wp-head{background:#0e1318;color:#e6ecf2;border:1px solid #232e3a;border-radius:12px;padding:16px 18px;margin-bottom:12px}
.wp-head h2{margin:2px 0 10px}.wp-head small{color:#8a98a8;letter-spacing:.08em;text-transform:uppercase;font-size:11px}
.wp-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px}.wp-strip div{background:#151c24;border:1px solid #232e3a;border-radius:10px;padding:8px 10px}.wp-strip b{display:block;font-size:15px}
.wp-note{color:#8a98a8;font-size:13px;margin:8px 0 0}.wp-arch{margin-top:14px}.wp-arch button{background:transparent;border:1px solid #365264;color:inherit;padding:8px 14px;border-radius:8px;cursor:pointer}
</style>`;}
  // `legacy` e uma funcao que devolve o HTML do panorama arquivado (so executada quando o usuario pede).
  function render(s,D,opts){
    const H=HUB();if(!s||!H)return `<section class="card"><h2>Panorama</h2><p class="muted">Módulo indisponível.</p></section>`;
    const legacy=opts&&opts.legacy;
    const arch=legacy?`<div class="wp-arch"><button type="button" data-wp-archive>${ui.archive?"Ocultar panorama arquivado":"Ver panorama arquivado da última temporada encerrada"}</button>${ui.archive?legacy():""}</div>`:"";
    return `${css()}${header(s,D)}${H.render(s,D)}${arch}`;
  }
  function renderSummary(s,D){
    if(!s)return "";
    return `${css()}${header(s,D)}`;
  }
  const api={render,renderSummary,seasonInfo,summary,header,state:ui,toggleArchive(){ui.archive=!ui.archive;}};
  root.ProLifeWorldPanorama=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
