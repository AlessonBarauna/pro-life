(function(root){
"use strict";
// 06B: dedicated coach creation. Player attributes are never collected here.
function render(ctx){
 const {D,esc}=ctx;
 // Reuse canonical available club catalog; no separate world or generated league list.
 let clubs=[];
 try{clubs=D.create({mode:"coach",catalogVersion:"fc27_v1"},1).clubs||[];}catch(e){console.warn("Club selection unavailable",e);}
 const options=clubs.filter(c=>c&&c.id&&c.active!==false).map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join("");
 const app=document.getElementById("app");
 if(!app)return;
 app.innerHTML=`<main class="coach-creation" data-coach-creator="1">
  <header class="coach-creation-header"><div><span class="coach-kicker">PRO LIFE · FC 27 · MODO TREINADOR</span><h1>Construir carreira</h1><p class="coach-subtitle">Escolha sua identidade e seu primeiro projeto. Comande um clube, gerencie o elenco e responda à diretoria.</p></div><button type="button" class="coach-return" data-coach-back="1">← Voltar</button></header>
  <form id="coach-creation-form"><div class="coach-creation-grid">
   <section class="coach-creation-card"><h2>Perfil do treinador</h2>
    <div class="coach-fields">
     <label class="coach-full">Nome completo<input name="name" required maxlength="60" autocomplete="name" value="" placeholder="Nome do treinador"></label>
     <label>Cidade natal<input name="city" required maxlength="60" value="" placeholder="Cidade"></label>
     <label>Idade inicial<input name="age" type="number" min="25" max="65" required value="35"></label>
     <label class="coach-full">Primeiro projeto<select name="clubId"><option value="">Receber propostas de clubes</option>${options}</select></label>
     <label class="coach-full">Seed do mundo (opcional)<input name="seed" type="number" placeholder="Mesmo número = mesmo universo inicial"></label>
    </div>
    <p class="coach-section-note">A carreira de treinador usa reputação, licenças, objetivos da diretoria, elenco e orçamento do motor atual. As opções de formação e estilo tático serão configuradas dentro do clube, onde já existem efeitos reais.</p>
    <p class="coach-section-note">Base FC 27 selecionada para a nova carreira. Os dados do mundo e dos atletas são simulados.</p>
   </section>
   <aside class="coach-creation-card">
    <h2>Seu projeto de carreira</h2>
    <div class="coach-profile-art" aria-hidden="true"><svg viewBox="0 0 160 195" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="80" cy="47" r="26" fill="#C99B77"/><path d="M52 43c1-25 52-32 57-2l-4-16-17-10H70L56 25Z" fill="#242A2B"/><path d="M46 87c15-18 53-20 68 0l18 80H28l18-80Z" fill="#1B313E" stroke="#9DB4B7" stroke-width="2"/><path d="m65 88 15 24 15-24-15-13-15 13Z" fill="#EDF5F4"/><path d="m80 105-8 47h16l-8-47Z" fill="#B8F32E"/><path d="M24 166h112" stroke="#B8F32E" stroke-width="3"/></svg></div>
    <div class="coach-summary"><div><small>Modo</small><strong>Treinador</strong></div><div><small>Base</small><strong>FC 27</strong></div><div><small>Início</small><strong>Temporada 2026</strong></div><div><small>Carreira</small><strong>Gestão de clube</strong></div></div>
    <button type="submit" class="coach-start">Iniciar carreira de treinador →</button>
    <p class="coach-helper">O jogo preserva o fluxo de saves existente. Nenhuma habilidade, posição ou ponto de atleta será solicitado.</p>
   </aside>
  </div></form></main>`;
 app.querySelector('[data-coach-back]').addEventListener("click",()=>ctx.onBack());
 app.querySelector("#coach-creation-form").addEventListener("submit",event=>{
  event.preventDefault();
  const f=new FormData(event.currentTarget);
  const age=Number(f.get("age"));
  if(!Number.isInteger(age)||age<25||age>65){ctx.toast("A idade do treinador deve estar entre 25 e 65 anos.");return;}
  const name=String(f.get("name")||"").trim(),city=String(f.get("city")||"").trim();
  if(!name||!city){ctx.toast("Informe nome e cidade natal.");return;}
  const seedRaw=String(f.get("seed")||"").trim();
  const seed=seedRaw!==""?Number(seedRaw):Date.now();
  if(!Number.isFinite(seed)){ctx.toast("Seed invalida.");return;}
  const config={mode:"coach",catalogVersion:"fc27_v1",name,city,age,clubId:String(f.get("clubId")||"")};
  ctx.busy("Criando carreira de treinador FC 27…",()=>{
   try{const fresh=D.create(config,seed);return ctx.onStart(fresh);}
   catch(err){ctx.toast(err.message);return false;}
  });
 });
}
root.ProLifeCoachCreator={mount:render};
})(typeof globalThis!=="undefined"?globalThis:this);
