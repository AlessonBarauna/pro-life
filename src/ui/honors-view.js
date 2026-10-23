(function honorsViewModule(root){
  "use strict";
  // Bola de Ouro, Kopa, Yashin, Gerd Müller, Cruyff, The Best e "Lendas e aposentadorias".
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const ui={season:null};
  const H=()=>root.ProLifeWorldHonors;
  const POS={ATA:"Atacante",MEI:"Meio-campista",DEF:"Defensor",GOL:"Goleiro"};
  const initials=n=>String(n||"?").split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase();
  function playerOf(s,id,name){
    if(id==="hero")return s.person||{id,name};
    return (s.internationalPlayers||[]).find(p=>p.id===id)||{id:id||name,name};
  }
  function face(s,r,cls=""){
    const src=root.ProLifePlayerCard?.portrait?.(playerOf(s,r.id,r.name));
    return src?`<span class="hn-face ${cls}"><img src="${src}" alt="Retrato de ${esc(r.name)}" loading="lazy" decoding="async"></span>`:`<span class="hn-face ${cls}" aria-label="${esc(r.name)}">${esc(initials(r.name))}</span>`;
  }
  function crest(r){
    const C=root.ProLifeClubCrests,img=r.clubId&&(C?.inline?.(r.clubId,"sm")||C?.render?.(r.clubId,{size:"sm"}))||"";
    return String(img).startsWith("<img")?`<span class="hn-crest">${img}</span>`:`<span class="hn-crest">${esc(initials(r.club))}</span>`;
  }
  function flag(r){try{return r.nat&&root.ProLifeNationalCrests?.render?.(r.nat)||"";}catch(e){return"";}}
  const stat=r=>r.pos==="GOL"?`${r.apps} j · nota ${Number(r.avg).toFixed(2)}${r.cs?` · ${r.cs} jogos sem sofrer`:""}`:`${r.apps} j · ${r.goals} g · ${r.assists} a · nota ${Number(r.avg).toFixed(2)}`;
  function winner(s,title,sub,r){
    if(!r)return `<article class="hn-card hn-win empty"><h3>${esc(title)}</h3><p>Sem vencedor nesta edição: jogadores insuficientes.</p></article>`;
    return `<article class="hn-card hn-win ${r.hero?"hero":""}"><div class="hn-win-top"><h3>${esc(title)}</h3><small>${esc(sub)}</small></div><div class="hn-win-body">${face(s,r,"lg")}<div><b class="hn-name">${esc(r.name)}</b><span class="hn-meta">${crest(r)}${esc(r.club||"Sem clube")}${flag(r)}</span><span class="hn-meta">${esc(POS[r.pos]||"")}${r.age?` · ${r.age} anos`:""}</span><span class="hn-stat">${esc(stat(r))}</span></div></div>${(r.reasons||[]).length?`<p class="hn-why">${esc(r.reasons.slice(0,3).join(" · "))}</p>`:""}</article>`;
  }
  function list(s,rows,unit="pts",max=30){
    if(!rows?.length)return `<p class="hn-note">Sem dados.</p>`;
    return `<ol class="hn-list">${rows.slice(0,max).map(r=>`<li class="${r.hero?"hero":""}"><b class="hn-rank">${r.rank}</b>${face(s,r,"sm")}<span class="hn-who"><b>${esc(r.name)}</b><small>${crest(r)}${esc(r.club||"")}</small></span><span class="hn-sline">${esc(stat(r))}</span><b class="hn-pts">${esc(r.points)} <small>${unit}</small></b></li>`).join("")}</ol>`;
  }
  function honras(s){
    const Hn=H(),all=Hn?Hn.winners(s):[];
    const sel=all.find(r=>r.season===ui.season)||all[0];
    const pending=s.honors?.seasons?.[String(s.season)];
    const next=Hn?Hn.ceremonyDay(0):0;
    const nom=pending&&!pending.revealed&&pending.nomsAnnounced?[...pending.ballon].sort((a,b)=>String(a.name).localeCompare(String(b.name),"pt-BR")):null;
    if(!sel&&nom){
      return `<section class="hn-card"><h3>Indicados à Bola de Ouro ${esc(pending.season)}</h3><p class="hn-note">Lista em ordem alfabética. O vencedor e a votação saem na cerimônia de 20 de outubro.</p><ul class="hn-nom">${nom.map(r=>`<li class="${r.hero?"hero":""}">${face(s,r,"sm")}<span class="hn-who"><b>${esc(r.name)}</b><small>${crest(r)}${esc(r.club||"")}</small></span></li>`).join("")}</ul></section>`;
    }
    if(!sel){
      return `<section class="hn-empty"><h3>A cerimônia de ${esc(s.season)} ainda não aconteceu</h3><p>A Bola de Ouro e os troféus Kopa, Yashin, Gerd Müller, Cruyff e The Best são entregues em 20 de outubro. A votação usa o desempenho em campo, os títulos e o nível das competições.</p></section>`;
    }
    const opts=all.map(r=>`<option value="${r.season}" ${r.season===sel.season?"selected":""}>${r.season}</option>`).join("");
    const hero=sel.hero?`<section class="hn-hero"><b>Sua posição na Bola de Ouro ${sel.season}: ${sel.hero.rank}º</b><span>${sel.hero.points} pontos entre ${sel.hero.of} jogadores elegíveis.</span></section>`:"";
    const cr=sel.cruyff?.[0];
    const wallet=all.filter(r=>r.ballon?.[0]).slice(0,10).map(r=>`<li><b>${r.season}</b><span>${esc(r.ballon[0].name)}</span><small>${esc(r.ballon[0].club||"")}</small></li>`).join("");
    return `<div class="hn-bar"><label>Edição <select data-hn-season>${opts}</select></label><small>${esc(sel.candidates)} jogadores avaliados · ${sel.ucl?.simulated?"Champions apurada por simulação do ranking de clubes":"Champions com resultado real"}</small></div>${hero}
    <div class="hn-wins">${winner(s,"Bola de Ouro",`Edição ${sel.season}`,sel.ballon?.[0])}${winner(s,"The Best",`Melhor do ano`,sel.theBest?.[0])}${winner(s,"Troféu Kopa","Melhor jovem (até 21 anos)",sel.kopa?.[0])}${winner(s,"Troféu Yashin","Melhor goleiro",sel.yashin?.[0])}${winner(s,"Troféu Gerd Müller","Artilheiro do ano",sel.gerd?.[0])}${cr?`<article class="hn-card hn-win"><div class="hn-win-top"><h3>Troféu Cruyff</h3><small>Melhor treinador</small></div><div class="hn-win-body"><span class="hn-face lg">${esc(initials(cr.name))}</span><div><b class="hn-name">${esc(cr.name)}</b><span class="hn-meta">${esc(cr.club||"")}</span></div></div></article>`:""}</div>
    <div class="hn-cols"><section class="hn-card"><h3>Votação · Top 30</h3>${list(s,sel.ballon)}</section><section class="hn-card"><h3>Kopa · Top 10</h3>${list(s,sel.kopa,"pts",10)}<h3>Yashin · Top 10</h3>${list(s,sel.yashin,"pts",10)}<h3>Gerd Müller · Top 10</h3>${list(s,sel.gerd,"gols",10)}</section></div>
    <section class="hn-card"><h3>Campeões da Bola de Ouro</h3><ul class="hn-hist">${wallet}</ul></section>`;
  }
  function lendas(s){
    const g=s.globalFootball||{},rets=(g.retirements||[]).filter(r=>r.peak!=null||r.ovr!=null);
    const seasons=[...new Set(rets.map(r=>r.season))].sort((a,b)=>b-a);
    const rows=rets.slice().sort((a,b)=>b.season-a.season||(b.peak||0)-(a.peak||0)).slice(0,40);
    const stats=g.retireStats||{},cur=seasons[0],st=stats[cur]||{};
    const fw=[];for(const p of (g.farewells||[]))fw.push(p);
    const hall=rets.filter(r=>(r.peak||0)>=84).sort((a,b)=>(b.peak||0)-(a.peak||0)).slice(0,12);
    const h=s.person;
    const heroLine=s.mode==="player"&&h?`<section class="hn-hero"><b>${esc(h.name)} · ${esc(h.age)} anos</b><span>${h.age>=38?"Sua carreira entra na reta final. A aposentadoria é forçada aos 42 anos (45 para goleiros) ou após duas temporadas sem clube.":h.age>=34?"A partir dos 34 anos você pode começar a pensar na despedida.":"Faltam anos para a fase de despedida."}</span></section>`:"";
    const row=r=>`<li><b>${esc(r.season)}</b><span class="hn-who"><b>${esc(r.name)}</b><small>${esc(r.club||"Sem clube")} · ${esc(POS[r.pos]||r.pos||"")}</small></span><span>${esc(r.age)} anos</span><span>pico ${esc(r.peak??"—")}</span><small>${esc(r.reason||"")}</small></li>`;
    return `${heroLine}<div class="hn-cols"><section class="hn-card"><h3>Aposentadorias de destaque</h3>${rows.length?`<ul class="hn-ret">${rows.map(row).join("")}</ul>`:`<p class="hn-note">Nenhum jogador de destaque se aposentou ainda.</p>`}</section><section class="hn-card"><h3>Salão de lendas</h3>${hall.length?`<ul class="hn-ret">${hall.map(row).join("")}</ul>`:`<p class="hn-note">Aparecem aqui os aposentados que chegaram a 84 de overall.</p>`}<h3>Temporada ${esc(cur??s.season)}</h3><p class="hn-note">${esc(st.total??0)} aposentadorias registradas, ${esc(st.notable??0)} de destaque.</p></section></div>`;
  }
  const api={honras,lendas,state:ui,setSeason:v=>{ui.season=Number(v)||null;}};
  root.ProLifeHonorsView=api;if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
