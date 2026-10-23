(function playerStatsModule(root){
  "use strict";
  // Estatisticas do JOGADOR (estilo FC 27): avatar, escudos de clubes/selecoes e logos de competicoes.
  // Somente leitura: nao altera o estado.
  const FESC=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const num=(v,d=0)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
  const fmt1=v=>{const n=Number(v);return n>0?n.toFixed(1).replace(".",","):"—";};
  const pct=(a,b)=>b>0?Math.round(a/b*100):0;
  const tier=o=>o>=85?"elite":o>=75?"gold":o>=65?"silver":"bronze";
  const ratingCls=r=>r>=7.5?"hi":r>=6.5?"mid":r>0?"lo":"";

  function render(s,D,u){
    const esc=(u&&u.esc)||FESC,crest=(u&&u.crest)||(()=>""),S=root.ProLifeStatistics,N=root.ProLifeNames;
    const cname=(id,stored)=>N&&N.club?N.club(s,id,stored):(stored||id||"—");
    const lname=(id,stored)=>N&&N.league?N.league(s,id,stored):(stored||id||"—");
    if(!S) return "";
    const dash=S.heroDashboard(s),insight=S.careerInsights(s),h=dash.currentClubSeason||dash.season||{},p=s.person||{};
    const ovr=num(D&&D.overall?D.overall(p):p.overall,num(p.overall));
    const NI=root.ProLifeNationalIdentity;let team=null;try{team=NI&&NI.heroTeam&&NI.heroTeam(s,D);}catch(e){}
    const club=(s.clubs||[]).find(c=>c.id===s.clubId)||null;
    const portrait=root.ProLifePlayerCard&&root.ProLifePlayerCard.portrait?root.ProLifePlayerCard.portrait(p):"";
    const clubCrest=club?crest(s,club.id,club.name):"";
    const natCrest=n=>root.ProLifeNationalCrests?root.ProLifeNationalCrests.render(n,{size:"sm"}):"";
    const natBig=team&&team.represented&&root.ProLifeNationalCrests?root.ProLifeNationalCrests.render(team.code||team.name,{size:"md"}):"";
    const initials=String(p.name||"?").split(/\s+/).slice(0,2).map(w=>w[0]).join("").toUpperCase();

    const hero=`<section class="ps-hero" data-tier="${tier(ovr)}"><div class="ps-who">${portrait?`<img class="ps-portrait" src="${portrait}" alt="">`:`<span class="ps-portrait ps-initials" aria-hidden="true">${esc(initials)}</span>`}<div><span class="ps-eyebrow">ESTATÍSTICAS · TEMPORADA ${esc(s.season)}</span><h1>${esc(p.name||"Jogador")}</h1><p>${clubCrest}<span>${esc(dash.currentClub||"Sem clube")}</span>${natBig?`<i class="ps-sep"></i>${natBig}<span>${esc(team.name)}</span>`:""}</p><div class="ps-chips"><b>${ovr}</b><span>${esc(p.pos||"—")}</span><span>${num(p.age)} anos</span></div></div></div>
      <div class="ps-herorside"><div class="ps-kpis"><div><b>${num(h.appearances)}</b><small>Jogos</small></div><div><b>${num(h.goals)}</b><small>Gols</small></div><div><b>${num(h.assists)}</b><small>Assistências</small></div><div class="ps-rate ${ratingCls(num(h.averageRating))}"><b>${fmt1(h.averageRating)}</b><small>Nota média</small></div><div><b>${num(h.minutes).toLocaleString("pt-BR")}</b><small>Minutos</small></div></div><p class="ps-career">Carreira em clubes: <b>${num(dash.career.appearances)}</b> jogos · <b>${num(dash.career.goals)}</b> gols · <b>${num(dash.career.assists)}</b> assist. · nota <b>${fmt1(dash.career.averageRating)}</b></p></div></section>`;

    // detalhes da temporada com barras
    const apps=num(h.appearances),w=num(h.wins),d=num(h.draws),l=num(h.losses),tot=Math.max(1,w+d+l);
    const bar=(label,value,extra,ratio)=>`<div class="ps-bar"><div><span>${label}</span><b>${value}</b></div><i style="--v:${Math.max(0,Math.min(100,ratio))}%"></i>${extra?`<small>${extra}</small>`:""}</div>`;
    const detail=`<section class="ps-panel"><h3>Desempenho na temporada</h3>
      <div class="ps-wdl" title="Vitórias, empates e derrotas"><span class="w" style="flex:${w}">${w?`${w}V`:""}</span><span class="d" style="flex:${d}">${d?`${d}E`:""}</span><span class="l" style="flex:${l}">${l?`${l}D`:""}</span>${w+d+l?"":"<em>Sem jogos ainda</em>"}</div>
      ${bar("Participações em gol",num(h.goals)+num(h.assists),apps?`${((num(h.goals)+num(h.assists))/apps).toFixed(2).replace(".",",")} por jogo`:"",Math.min(100,(num(h.goals)+num(h.assists))/Math.max(1,apps)*60))}
      ${bar("Finalizações no alvo",`${num(h.onTarget)}/${num(h.shots)}`,num(h.shots)?`${pct(num(h.onTarget),num(h.shots))}% de precisão`:"",pct(num(h.onTarget),num(h.shots)))}
      ${bar("Titularidade",`${num(h.starts)}/${apps}`,"",pct(num(h.starts),apps))}
      ${bar("xG acumulado",num(h.xg).toFixed(1).replace(".",","),`Gols: ${num(h.goals)}`,Math.min(100,num(h.xg)*10))}
      <div class="ps-mini"><span>Craque do jogo <b>${num(h.motm)}</b></span><span>Amarelos <b>${num(h.yellowCards)}</b></span><span>Vermelhos <b>${num(h.redCards)}</b></span><span>Gols/90 <b>${String(h.goals90??0).replace(".",",")}</b></span></div></section>`;

    // forma recente com escudos
    let recent="";
    try{
      const HD=root.ProLifeHomeDashboard,list=HD&&HD.recentEntries?HD.recentEntries(s):[];
      recent=list.map(({kind,match:m})=>{
        if(kind==="national"){
          const b=num(m.brazil,NaN),o=num(m.other,NaN),has=Number.isFinite(b)&&Number.isFinite(o),r=has?(b>o?"V":b<o?"D":"E"):"";
          const me=m.team||(team&&team.name)||"Seleção";
          return `<div class="ps-game"><b class="r-${r}">${r||"—"}</b><div class="ps-teams"><span>${natCrest(me)}${esc(me)}</span><em>${has?`${b}–${o}`:"—"}</em><span>${natCrest(m.opponent)}${esc(m.opponent||"")}</span></div><small>${esc(m.competition||"Seleção")}</small><i class="ps-nota ${m.bench?"":ratingCls(num(m.rating))}">${m.bench?"Não jogou":fmt1(m.rating)}</i></div>`;
        }
        const hn=cname(m.home),an=cname(m.away);
        const own=m.home===s.clubId?num(m.hg):num(m.ag),opp=m.home===s.clubId?num(m.ag):num(m.hg),r=own>opp?"V":own<opp?"D":"E",rate=num(m.ratings&&m.ratings.hero);
        return `<div class="ps-game"><b class="r-${r}">${r}</b><div class="ps-teams"><span>${crest(s,m.home,hn)}${esc(hn)}</span><em>${num(m.hg)}–${num(m.ag)}</em><span>${crest(s,m.away,an)}${esc(an)}</span></div><small>${esc(m.competitionName||lname(m.competitionId||m.leagueId,"Partida"))}</small><i class="ps-nota ${ratingCls(rate)}">${fmt1(rate)}</i></div>`;
      }).join("");
    }catch(e){recent="";}
    const form=`<section class="ps-panel"><h3>Forma recente</h3>${recent||'<div class="ps-empty">Suas últimas atuações aparecem aqui.</div>'}</section>`;

    // por competicao (logos)
    const LL=root.ProLifeLeagueLogos;
    const logo=(id,name)=>LL&&LL.render?LL.render(id,name,{size:30}):"";
    const agg=new Map(),addC=(id,row)=>{if(!id)return;const a=agg.get(id)||{id,appearances:0,goals:0,assists:0,minutes:0,ratingTotal:0};a.appearances+=num(row.appearances);a.goals+=num(row.goals);a.assists+=num(row.assists);a.minutes+=num(row.minutes);a.ratingTotal+=num(row.ratingTotal)||num(row.averageRating)*num(row.appearances);agg.set(id,a);};
    try{for(const se of (S.init(s).root.seasons||[]))for(const c of ((se.player&&se.player.competitions)||[]))addC(c.id,c);}catch(e){}
    for(const c of dash.byCompetition||[])addC(c.id,c);
    const compRows=[...agg.values()].filter(x=>x.appearances>0).sort((a,b)=>b.appearances-a.appearances);
    const comps=compRows.length?`<div class="ps-rows">${compRows.map(x=>{const nm=lname(x.id);const av=x.appearances?x.ratingTotal/x.appearances:0;return `<div class="ps-row"><span class="ps-lead">${logo(x.id,nm)}<b>${esc(nm)}</b></span><span><b>${x.appearances}</b><small>J</small></span><span><b>${x.goals}</b><small>G</small></span><span><b>${x.assists}</b><small>A</small></span><span><b>${x.minutes.toLocaleString("pt-BR")}</b><small>Min</small></span><span class="${ratingCls(av)}"><b>${fmt1(av)}</b><small>Nota</small></span></div>`}).join("")}</div>`:'<div class="ps-empty">Sem partidas registradas.</div>';
    const byComp=`<section class="ps-panel ps-wide"><h3>Por competição · carreira</h3>${comps}</section>`;

    // temporadas (escudos de clubes)
    const seasons=(insight.seasons||[]).length?`<div class="ps-rows">${insight.seasons.slice().reverse().map(x=>`<div class="ps-row"><span class="ps-lead">${crest(s,x.clubId,cname(x.clubId,x.club))}<b>${esc(cname(x.clubId,x.club))}</b><small>${esc(x.season)}</small></span><span><b>${num(x.appearances)}</b><small>J</small></span><span><b>${num(x.goals)}</b><small>G</small></span><span><b>${num(x.assists)}</b><small>A</small></span><span class="${ratingCls(num(x.averageRating))}"><b>${fmt1(x.averageRating)}</b><small>Nota</small></span><span><b>${x.overallEnd??"—"}</b><small>GER</small></span></div>`).join("")}</div>`:'<div class="ps-empty">Sem temporadas registradas.</div>';
    const seasonsHtml=`<section class="ps-panel ps-wide"><h3>Trajetória por temporada</h3>${seasons}</section>`;

    // carreira em clubes
    const cl=insight.clubs||[];
    const clubs=cl.length?`<div class="ps-clubs">${cl.map(x=>`<article>${crest(s,x.id,cname(x.id,x.name))}<div><b>${esc(cname(x.id,x.name))}</b><small>${x.seasons&&x.seasons.length?`${Math.min(...x.seasons)}${Math.max(...x.seasons)!==Math.min(...x.seasons)?`–${Math.max(...x.seasons)}`:""}`:"Carreira"}</small></div><span>${num(x.appearances)}J · ${num(x.goals)}G · ${num(x.assists)}A</span></article>`).join("")}</div>`:'<div class="ps-empty">Nenhum clube anterior.</div>';
    const prof=insight.professional||{};
    const clubsHtml=`<section class="ps-panel"><h3>Carreira em clubes</h3>${clubs}<p class="ps-total">Total profissional: <b>${num(prof.appearances)}</b> jogos · <b>${num(prof.goals)}</b> gols · <b>${num(prof.assists)}</b> assistências</p></section>`;

    // selecao
    const nt=dash.national||{},caps=num(nt.caps);
    const natHtml=`<section class="ps-panel ps-nat"><h3>${esc((team&&team.represented&&team.name)||"Seleção")}</h3><div class="ps-nat-top">${natBig?`<span class="ps-nat-crest">${natBig}</span>`:""}<div class="ps-natnums"><div><b>${caps}</b><small>Jogos</small></div><div><b>${num(nt.goals)}</b><small>Gols</small></div><div><b>${num(nt.assists)}</b><small>Assist.</small></div><div><b>${num(nt.starts)}</b><small>Titular</small></div></div></div>${caps?"":'<p class="ps-empty">Você ainda não estreou pela seleção.</p>'}</section>`;

    // recordes e marcos
    const rec=insight.records||{},ms=(insight.milestones||[]).slice(-6).reverse();
    const records=`<section class="ps-panel"><h3>Recordes pessoais</h3><div class="ps-recs"><div><b>${num(rec.mostGoalsMatch)}</b><small>Gols em um jogo</small></div><div><b>${num(rec.hatTricks)}</b><small>Hat-tricks</small></div><div><b>${rec.highestRating?fmt1(rec.highestRating):"—"}</b><small>Maior nota</small></div><div><b>${num(rec.highestOverall,ovr)}</b><small>Maior GER</small></div></div>${ms.length?`<ul class="ps-ms">${ms.map(x=>`<li><span>${esc(x.season)}</span>${esc(x.label)}</li>`).join("")}</ul>`:""}</section>`;

    return `<div class="ps-screen">${hero}<div class="ps-grid">${detail}${form}</div>${byComp}${seasonsHtml}<div class="ps-grid">${clubsHtml}<div class="ps-stack">${natHtml}${records}</div></div></div>`;
  }
  root.ProLifePlayerStats={render};
  if(typeof module!=="undefined"&&module.exports)module.exports={render};
})(typeof globalThis!=="undefined"?globalThis:this);
