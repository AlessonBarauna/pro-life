(function offFieldViewModule(root){
  "use strict";
  // Stage 34F.25 - tela "Vida profissional e pessoal": imagem publica, redes, relacionamentos, familia e despesas.
  const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const money=v=>"R$ "+Math.round(Number(v)||0).toLocaleString("pt-BR");
  const ui={tab:"imagem"};
  const TABS=[["imagem","Imagem e redes"],["rede","Relacionamentos"],["familia","Família"],["despesas","Despesas"]];
  const bar=(v,tone)=>`<span class="of-bar ${tone||""}"><i style="width:${Math.max(0,Math.min(100,Math.round(v)))}%"></i></span>`;

  function imagem(sn){
    const im=sn.image;
    const tone=im.value>=65?"ok":im.value>=40?"warn":"bad";
    const posts=sn.social?`<section class="of-card wide"><small>PUBLICAR NAS REDES</small><div class="of-posts">${sn.posts.map(p=>`<button type="button" class="of-post" data-offfield-post="${p.id}" ${p.wait>0?"disabled":""}><b>${esc(p.label)}</b><span>${esc(p.note)}</span><em>${p.wait>0?`Em ${p.wait} dia(s)`:p.risk>=0.3?"Risco alto":p.risk>0?"Risco baixo":"Sem risco"}</em></button>`).join("")}</div>
      ${sn.recentPosts.length?`<ul class="of-list">${sn.recentPosts.map(r=>`<li class="${r.backfired?"bad":""}"><span>Dia ${r.day} · ${esc(r.label)}</span><small>${esc(r.text)}</small><b>${r.followers>0?"+":""}${r.followers}</b></li>`).join("")}</ul>`:'<p class="of-note">Nenhuma publicação ainda.</p>'}</section>`
      :`<section class="of-card wide"><p class="of-note">Redes sociais simuladas estão disponíveis na carreira de jogador.</p></section>`;
    return `<div class="of-grid"><section class="of-card"><small>IMAGEM PÚBLICA</small><div class="of-big ${tone}"><b>${im.value}</b><span>${esc(im.label)}</span></div>${bar(im.value,tone)}
      <p class="of-note">Torcida ${im.fans} · Pressão ${im.pressure} · Reputação ${im.reputation} · Polêmicas ativas ${im.controversy}</p></section>
      <section class="of-card"><small>ALCANCE</small><div class="of-big"><b>${Number(sn.reach).toLocaleString("pt-BR")}</b><span>seguidores ganhos por publicações</span></div><p class="of-note">Um jornalista de confiança amplia o alcance e reduz o risco de polêmica.</p></section>${posts}</div>`;
  }
  function rede(sn){
    return `<div class="of-grid">${sn.contacts.map(c=>`<section class="of-card"><small>${esc(c.label)}</small><div class="of-row">${bar(c.level,c.active?"ok":"")}<b>${c.level}</b></div><p class="of-note">${esc(c.benefit)} ${c.active?"<em>Benefício ativo.</em>":""}</p>
      <button type="button" class="primary" data-offfield-contact="${c.id}" ${c.wait>0?"disabled":""}>${c.wait>0?`Em ${c.wait} dia(s)`:`Cultivar (${money(sn.contactCost)})`}</button></section>`).join("")}
      ${sn.networkLog.length?`<section class="of-card wide"><small>ÚLTIMOS CONTATOS</small><ul class="of-list">${sn.networkLog.map(l=>`<li><span>Dia ${l.day} · ${esc(l.label)}</span><b>+${l.gain}</b></li>`).join("")}</ul></section>`:""}</div>`;
  }
  function familia(sn){
    const p=sn.pending;
    const pend=p?`<section class="of-card wide of-pending"><small>DECISÃO FAMILIAR · ${p.daysLeft} DIA(S)</small><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p><div class="of-choices">${p.choices.map((c,i)=>`<button type="button" data-offfield-family="${i}"><b>${esc(c.label)}</b>${c.cost?`<span>Custo ${money(c.cost)}</span>`:""}</button>`).join("")}</div></section>`:`<section class="of-card wide"><p class="of-note">Nenhuma decisão familiar pendente. Eventos surgem a cada algumas semanas quando você tem clube.</p></section>`;
    return `<div class="of-grid"><section class="of-card"><small>VIDA FAMILIAR</small><div class="of-big"><b>${Math.round(sn.family)}</b><span>de 100</span></div>${bar(sn.family,sn.family>=50?"ok":"bad")}</section>
      <section class="of-card"><small>ESTRESSE</small><div class="of-big"><b>${Math.round(sn.stress)}</b><span>de 100</span></div>${bar(sn.stress,sn.stress<50?"ok":"bad")}</section>${pend}
      ${sn.familyHistory.length?`<section class="of-card wide"><small>HISTÓRICO</small><ul class="of-list">${sn.familyHistory.map(h=>`<li><span>Dia ${h.day} · ${esc(h.title)}</span><small>${esc(h.choice)}${h.auto?" (sem resposta)":""}</small></li>`).join("")}</ul></section>`:""}</div>`;
  }
  function despesas(sn){
    const e=sn.expenses;
    const rows=e.rows.length?`<table class="of-table"><thead><tr><th>Categoria</th><th>Entradas</th><th>Saídas</th></tr></thead><tbody>${e.rows.map(r=>`<tr><td>${esc(r.label)}</td><td>${money(r.income)}</td><td>${money(r.expense)}</td></tr>`).join("")}</tbody></table>`:'<p class="of-note">Sem movimentações nos últimos 30 dias.</p>';
    return `<div class="of-grid"><section class="of-card"><small>ÚLTIMOS 30 DIAS</small><div class="of-big ${e.net>=0?"ok":"bad"}"><b>${money(e.net)}</b><span>saldo do período</span></div><p class="of-note">Entradas ${money(e.income)} · Saídas ${money(e.expense)}</p></section>
      <section class="of-card"><small>MESES FECHADOS</small>${sn.months.length?`<ul class="of-list">${sn.months.slice(0,6).map(m=>`<li><span>T${m.season} · dia ${m.day}</span><b>${money(m.net)}</b></li>`).join("")}</ul>`:'<p class="of-note">O primeiro fechamento acontece em até 30 dias.</p>'}</section>
      <section class="of-card wide"><small>POR CATEGORIA</small>${rows}</section></div>`;
  }
  function css(){
    return `<style>
      .of-dark{--of-bg:#0a1119;--of-card:#111b26;--of-line:rgba(255,255,255,.09);--of-text:#f2f4f6;--of-muted:#8b99a6;--of-gold:#d8b45b;--of-ok:#4cc3b0;--of-bad:#d9695f;padding:24px;border-radius:18px;background:var(--of-bg);color:var(--of-text);border:1px solid var(--of-line)}
      .of-dark h2,.of-dark h3{margin:0 0 4px}.of-dark small{color:var(--of-muted);letter-spacing:.12em;text-transform:uppercase;font-size:11px}
      .of-tabs{display:flex;gap:4px;border-bottom:1px solid var(--of-line);margin:14px 0 18px;flex-wrap:wrap}.of-tabs button{background:none;border:0;border-bottom:2px solid transparent;color:var(--of-muted);padding:10px 16px;font:inherit;font-weight:600;cursor:pointer}.of-tabs button.active{color:var(--of-text);border-bottom-color:var(--of-gold)}
      .of-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.of-card{background:var(--of-card);border:1px solid var(--of-line);border-radius:12px;padding:16px}.of-card.wide{grid-column:1/-1}
      .of-big{display:flex;align-items:baseline;gap:12px;margin:8px 0}.of-big b{font-size:38px;font-variant-numeric:tabular-nums;line-height:1}.of-big.ok b{color:var(--of-ok)}.of-big.warn b{color:var(--of-gold)}.of-big.bad b{color:var(--of-bad)}.of-big span{color:var(--of-muted);font-size:13px}
      .of-bar{display:block;height:6px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden;flex:1}.of-bar i{display:block;height:100%;background:var(--of-gold)}.of-bar.ok i{background:var(--of-ok)}.of-bar.bad i{background:var(--of-bad)}
      .of-row{display:flex;align-items:center;gap:10px;margin:10px 0}.of-note{color:var(--of-muted);font-size:13px;margin:8px 0}
      .of-posts,.of-choices{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin:10px 0}.of-post,.of-choices button{display:flex;flex-direction:column;gap:6px;text-align:left;background:transparent;border:1px solid var(--of-line);border-radius:10px;padding:12px;color:var(--of-text);cursor:pointer}.of-post span,.of-choices span{color:var(--of-muted);font-size:12px}.of-post em{color:var(--of-gold);font-size:11px;font-style:normal}.of-post:disabled,.of-card button:disabled{opacity:.5;cursor:not-allowed}.of-post:hover:not(:disabled),.of-choices button:hover{border-color:var(--of-gold)}
      .of-list{list-style:none;margin:8px 0 0;padding:0}.of-list li{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--of-line)}.of-list li.bad b{color:var(--of-bad)}.of-list small{flex:1;text-transform:none;letter-spacing:0}
      .of-table{width:100%;border-collapse:collapse;font-size:13px}.of-table th,.of-table td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--of-line)}.of-table th{color:var(--of-muted);font-weight:600}
      .of-pending{border-color:var(--of-gold)}.of-dark button:focus-visible{outline:2px solid var(--of-gold);outline-offset:2px}
      @media(max-width:900px){.of-dark{padding:16px}.of-grid{grid-template-columns:1fr}}
    </style>`;
  }
  function render(s,D){
    const O=D?.OffField||root.ProLifeOffField;
    if(!O)return `<section class="card"><h2>Vida profissional e pessoal</h2><p class="muted">Módulo indisponível.</p></section>`;
    const sn=O.snapshot(s,D);
    const body=ui.tab==="rede"?rede(sn):ui.tab==="familia"?familia(sn):ui.tab==="despesas"?despesas(sn):imagem(sn);
    const pend=sn.pending?` · decisão familiar pendente`:"";
    return `${css()}<section class="of-dark"><h2>Vida profissional e pessoal</h2><small>Imagem ${sn.image.value} (${esc(sn.image.label)})${pend}</small><nav class="of-tabs" role="tablist" aria-label="Seções">${TABS.map(([id,l])=>`<button type="button" role="tab" aria-selected="${ui.tab===id}" class="${ui.tab===id?"active":""}" data-offfield-tab="${id}">${l}</button>`).join("")}</nav>${body}</section>`;
  }
  const api={render,state:ui,esc,setTab:id=>{if(TABS.some(t=>t[0]===id))ui.tab=id;}};
  root.ProLifeOffFieldView=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
