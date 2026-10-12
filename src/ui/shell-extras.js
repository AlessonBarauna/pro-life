(function shellExtrasModule(root){
  "use strict";
  // Stage 34F.26 - extras de interface: central de pendencias (sino), indicador de carregamento e transicao discreta de pagina.
  // Todos os itens da central apontam para paginas reais (data-page/data-target tratados pelo app.js).
  const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const money=v=>"R$ "+Math.round(Number(v)||0).toLocaleString("pt-BR");
  const TONE_ORDER={urgent:0,warn:1,info:2};

  function pending(s,D){
    const out=[];if(!s)return out;
    const add=(id,tone,label,detail,page,target)=>out.push({id,tone,label,detail,page,target:target||""});
    const day=Number(s.day)||0;
    if(s.decision)add("decision","urgent","Decisão pendente",s.decision.title||"Escolha necessária","life","current-decision");
    const pend=s.offField?.family?.pending;
    if(pend){const left=Math.max(0,Number(pend.deadline)-day);add("family","urgent","Decisão familiar",`Prazo: ${left} dia(s)`,"offField");}
    const offers=(s.offers||[]).filter(o=>o.expires>=day);
    if(offers.length)add("offers","warn",`${offers.length} proposta(s) de clube`,"Responda antes de expirar","proposals");
    let unread=0;try{unread=Number(D?.Career?.unreadCount?.(s))||0;}catch(e){unread=0;}
    if(unread)add("inbox","info",`${unread} mensagem(ns) não lida(s)`,"Caixa de entrada","inbox");
    if(s.mode==="coach"){
      const b=Number(s.board);
      if(s.clubId&&b<30)add("board","urgent","Diretoria sem paciência",`Confiança em ${Math.round(b)}`,"coachCareer");
      else if(s.clubId&&b<45)add("board","warn","Diretoria pressionando",`Confiança em ${Math.round(b)}`,"coachCareer");
      if(!s.clubId)add("nojob","warn","Sem clube","Aceite uma proposta para voltar","proposals");
    }else{
      const left=Number(s.contract);
      if(s.clubId&&Number.isFinite(left)&&left>0&&left<=60)add("contract",left<=30?"urgent":"warn","Contrato perto do fim",`${left} dia(s) restantes`,"contract");
      if(!s.clubId)add("nojob","warn","Sem clube","Procure uma proposta no mercado","market");
      if(s.person?.injury)add("injury","warn","Jogador lesionado","Veja o departamento médico","profile");
    }
    return out.sort((a,b)=>TONE_ORDER[a.tone]-TONE_ORDER[b.tone]);
  }
  function chipLine(s){
    if(!s?.clubId)return "Sem contrato";
    if(s.mode==="coach")return `Confiança ${Math.round(Number(s.board)||0)} · ${Math.max(0,Number(s.contract)||0)} dia(s) de contrato`;
    return `${Math.max(0,Number(s.contract)||0)} dia(s) · ${money(s.salary)}/mês`;
  }
  function bell(list){
    const n=list.length,urgent=list.some(x=>x.tone==="urgent");
    const items=n?list.map(x=>`<button type="button" class="sx-item ${x.tone}" data-page="${esc(x.page)}"${x.target?` data-target="${esc(x.target)}"`:""}><b>${esc(x.label)}</b><span>${esc(x.detail)}</span></button>`).join(""):`<p class="sx-empty">Tudo em dia. Nenhuma pendência.</p>`;
    return `<div class="sx-bell"><button type="button" class="sx-bell-btn ${urgent?"urgent":""}" data-bell-toggle aria-haspopup="true" aria-expanded="false" aria-label="Pendências: ${n}">Pendências${n?`<i>${n}</i>`:""}</button><div class="sx-panel" data-bell-panel hidden role="menu"><small>CENTRAL DE PENDÊNCIAS</small>${items}</div></div>`;
  }

  // ---------- carregamento ----------
  function busyEl(){
    let el=root.document?.getElementById("sx-busy");
    if(!el&&root.document){el=root.document.createElement("div");el.id="sx-busy";el.className="sx-busy";el.hidden=true;el.setAttribute("role","status");el.innerHTML='<div><i></i><span data-sx-busy-label>Processando…</span></div>';root.document.body.appendChild(el);}
    return el;
  }
  function run(label,fn){
    const el=busyEl();if(!el)return fn();
    el.querySelector("[data-sx-busy-label]").textContent=label||"Processando…";el.hidden=false;
    // da um quadro para o navegador pintar o indicador antes do trabalho sincrono.
    const done=()=>{el.hidden=true;};
    const go=()=>{try{fn();}finally{done();}};
    if(typeof root.requestAnimationFrame==="function")root.requestAnimationFrame(()=>root.setTimeout(go,20));else root.setTimeout(go,20);
  }
  function pageEnter(){
    const main=root.document?.querySelector(".game-shell .main");if(!main)return;
    main.classList.remove("sx-enter");void main.offsetWidth;main.classList.add("sx-enter");
  }

  function css(){
    return `.sx-bell{position:relative}.sx-bell-btn{background:transparent;border:1px solid rgba(255,255,255,.14);color:inherit;padding:8px 12px;border-radius:8px;cursor:pointer;font:inherit;display:inline-flex;gap:8px;align-items:center}.sx-bell-btn i{font-style:normal;background:#d8b45b;color:#10161d;border-radius:10px;padding:0 7px;font-size:12px;font-weight:700}.sx-bell-btn.urgent i{background:#d9695f;color:#fff}
.sx-panel{position:absolute;right:0;top:calc(100% + 8px);z-index:60;width:min(340px,92vw);background:#111b26;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px;box-shadow:0 18px 40px rgba(0,0,0,.45)}.sx-panel[hidden]{display:none}.sx-panel small{color:#8b99a6;letter-spacing:.12em;font-size:11px}
.sx-item{display:flex;flex-direction:column;gap:2px;width:100%;text-align:left;background:transparent;border:0;border-left:3px solid #4cc3b0;color:inherit;padding:9px 10px;margin-top:6px;cursor:pointer;border-radius:0 8px 8px 0}.sx-item span{color:#8b99a6;font-size:12px}.sx-item:hover{background:rgba(255,255,255,.05)}.sx-item.urgent{border-left-color:#d9695f}.sx-item.warn{border-left-color:#d8b45b}.sx-empty{color:#8b99a6;margin:10px 0 0;font-size:13px}
.sx-bell-btn:focus-visible,.sx-item:focus-visible{outline:2px solid #d8b45b;outline-offset:2px}.club-chip .sx-line{display:block;color:#8b99a6;font-size:11px;margin-top:2px}
.sx-busy{position:fixed;inset:0;z-index:200;background:rgba(6,10,15,.72);display:flex;align-items:center;justify-content:center}.sx-busy[hidden]{display:none}.sx-busy>div{display:flex;gap:14px;align-items:center;background:#111b26;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:18px 24px}.sx-busy i{width:20px;height:20px;border-radius:50%;border:3px solid rgba(255,255,255,.15);border-top-color:#d8b45b;animation:sx-spin .8s linear infinite}
.sx-enter{animation:sx-in .18s ease-out}@keyframes sx-in{from{opacity:.0;transform:translateY(6px)}to{opacity:1;transform:none}}@keyframes sx-spin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.sx-enter{animation:none}.sx-busy i{animation-duration:3s}}`;
  }
  function installStyle(){
    if(!root.document||root.document.getElementById("sx-style"))return;
    const st=root.document.createElement("style");st.id="sx-style";st.textContent=css();root.document.head.appendChild(st);
  }

  if(root.document&&!root.__proLifeShellExtrasBound){
    root.__proLifeShellExtrasBound=true;installStyle();
    const close=()=>{root.document.querySelectorAll("[data-bell-panel]").forEach(p=>{p.hidden=true;});root.document.querySelectorAll("[data-bell-toggle]").forEach(b=>b.setAttribute("aria-expanded","false"));};
    root.document.addEventListener("click",event=>{
      const t=event.target.closest?.("[data-bell-toggle]");
      if(t){const panel=t.parentElement.querySelector("[data-bell-panel]"),open=panel.hidden;close();if(open){panel.hidden=false;t.setAttribute("aria-expanded","true");}return;}
      if(!event.target.closest?.("[data-bell-panel]"))close();else if(event.target.closest?.(".sx-item"))setTimeout(close,0);
    });
    root.document.addEventListener("keydown",event=>{if(event.key==="Escape")close();});
  }

  const api={pending,chipLine,bell,run,pageEnter,css,esc};
  root.ProLifeShellExtras=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
