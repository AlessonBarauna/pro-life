(function(root){
"use strict";
// 06B: dedicated coach creation. Player attributes are never collected here.
let currentStep=0;
const STEPS=["Identidade","Experiência","Primeiro clube","Configurações","Confirmar"];
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
  <nav class="coach-steps" aria-label="Etapas de criação">${STEPS.map((label,i)=>'<button type="button" data-coach-step="'+i+'" class="'+(i===currentStep?"on":"")+'" aria-current="'+(i===currentStep?"step":"false")+'">'+String(i+1).padStart(2,"0")+' · '+label+'</button>').join("")}</nav><form id="coach-creation-form"><div class="coach-creation-grid">
   <section class="coach-creation-card"><h2>Perfil do treinador</h2>
    <div class="coach-fields" data-coach-panel="0">
     <label class="coach-full">Nome completo<input name="name" required maxlength="60" autocomplete="name" value="" placeholder="Nome do treinador"></label>
     <label>Cidade natal<input name="city" required maxlength="60" value="" placeholder="Cidade"></label>
     <label>Idade inicial<input name="age" type="number" min="25" max="65" required value="35"></label>
     <label class="coach-full">Nacionalidade<input name="nationality" maxlength="60" value="Brasil" required></label><label>Cor da pele<input name="skin" type="color" value="#bc8660"></label><label>Cor do cabelo<input name="hairColor" type="color" value="#241e1a"></label><label>Cor dos olhos<input name="eyeColor" type="color" value="#694829"></label><label>Cabelo<select name="hair"><option value="lowfade">Cabelo original (Vitruvian)</option><option value="bald">Sem cabelo</option><option value="crew" disabled>Social curto — modelo pendente</option><option value="highfade" disabled>Degradê alto — modelo pendente</option><option value="buzz" disabled>Raspado — modelo pendente</option><option value="curly" disabled>Cacheado — modelo pendente</option><option value="afro" disabled>Black power — modelo pendente</option><option value="twists" disabled>Twists — modelo pendente</option><option value="braids" disabled>Tranças — modelo pendente</option><option value="mullet" disabled>Mullet — modelo pendente</option><option value="long" disabled>Longo — modelo pendente</option></select></label><label>Barba<select name="beard"><option value="none">Sem barba</option><option value="stubble">Por fazer</option><option value="short">Curta</option><option value="full">Cheia</option><option value="mustache">Bigode</option><option value="goatee">Cavanhaque</option></select></label><label>Óculos<select name="accessory"><option value="none">Sem óculos</option><option value="glasses">Óculos (armação 3D)</option></select></label><label>Biotipo<select name="body"><option value="normal">Normal</option><option value="slim" disabled>Magro</option><option value="strong" disabled>Forte</option></select></label><label>Cores da roupa (modelo unico)<select name="outfit"><option value="suit">Paleta formal (nao altera o corte)</option><option value="tracksuit">Paleta esportiva (nao altera o corte)</option><option value="polo">Paleta clara (nao altera o corte)</option></select></label>
    </div><div class="coach-fields" data-coach-panel="1"><div class="coach-full coach-section-note"><b>Licença inicial: C · reputação: 35</b><p>Esses valores são definidos pelo motor, e podem evoluir durante a carreira.</p></div><label class="coach-full">Foco inicial de treino coletivo<select name="focus"><option value="equilibrado">Equilibrado</option><option value="fisico">Preparação física</option><option value="tecnico">Refino técnico</option><option value="jovens">Desenvolvimento de jovens</option><option value="recuperacao">Recuperação</option></select></label></div>
    <div class="coach-fields" data-coach-panel="2"><label class="coach-full">Primeiro projeto<select name="clubId"><option value="">Receber propostas de clubes</option>${options}</select></label><div class="coach-full coach-club-analysis" id="coach-club-analysis" aria-live="polite"></div>
    </div><div class="coach-fields" data-coach-panel="3"><div class="coach-full coach-section-note"><b>Configurações</b><p>Base FC 27 · carreira tradicional · regras padrão. O foco de treino selecionado afeta o elenco semanalmente. Se você escolher um clube diretamente, o estilo tático inicial também será aplicado ao clube.</p></div><label class="coach-full">Plano tático inicial (clube escolhido)<select name="tactic"><option value="balanced">Equilibrado</option><option value="possession">Posse de bola</option><option value="attack">Ofensivo</option><option value="counter">Contra-ataque</option></select></label><label class="coach-full">Seed do mundo (opcional)<input name="seed" type="number" placeholder="Mesmo número = mesmo universo inicial"></label>
    </div><div class="coach-fields" data-coach-panel="4"><div class="coach-full coach-section-note"><b>Revisão do projeto</b><div class="coach-confirm-details" id="coach-confirm-details" aria-live="polite"></div><p>A carreira será salva em um slot separado.</p></div></div>
    <p class="coach-section-note">A carreira de treinador usa reputação, licenças, objetivos da diretoria, elenco e orçamento do motor atual. As opções de formação e estilo tático serão configuradas dentro do clube, onde já existem efeitos reais.</p>
    <p class="coach-section-note">Base FC 27 selecionada para a nova carreira. Os dados do mundo e dos atletas são simulados.</p>
   </section>
   <aside class="coach-creation-card">
    <h2>Seu projeto de carreira</h2>
    <div class="coach-appearance-notice" id="coach-appearance-notice" aria-live="polite">Visual 3D: pele, cabelo (cor e silhueta) e opção sem cabelo. Barba, óculos, roupas e biotipo aguardam modelos adicionais.</div><div class="coach-profile-art" id="coach-profile-preview" aria-label="Prévia do treinador"><div class="avatar-stage coach-3d-stage" id="coach-3d-stage"></div><svg viewBox="0 0 160 195" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="80" cy="47" r="26" fill="#C99B77"/><path d="M52 43c1-25 52-32 57-2l-4-16-17-10H70L56 25Z" fill="#242A2B"/><path d="M46 87c15-18 53-20 68 0l18 80H28l18-80Z" fill="#1B313E" stroke="#9DB4B7" stroke-width="2"/><path d="m65 88 15 24 15-24-15-13-15 13Z" fill="#EDF5F4"/><path d="m80 105-8 47h16l-8-47Z" fill="#B8F32E"/><path d="M24 166h112" stroke="#B8F32E" stroke-width="3"/><g id="coach-beard" fill="#241e1a" hidden><path d="M64 65Q80 84 96 65L94 77Q80 94 66 77Z"/></g><g id="coach-glasses" fill="none" stroke="#dce7e9" stroke-width="2" hidden><rect x="57" y="43" width="19" height="13" rx="5"/><rect x="84" y="43" width="19" height="13" rx="5"/><path d="M76 47h8"/></g><g id="coach-eyes" fill="#694829"><circle cx="68" cy="50" r="2.2"/><circle cx="92" cy="50" r="2.2"/></g></svg></div>
    <div class="coach-summary"><div><small>Modo</small><strong>Treinador</strong></div><div><small>Base</small><strong>FC 27</strong></div><div><small>Início</small><strong>Temporada 2026</strong></div><div><small>Carreira</small><strong>Gestão de clube</strong></div></div>
    <div class="coach-navigation"><button type="button" class="coach-return" data-coach-prev>← Anterior</button><button type="button" class="coach-start" data-coach-next>Próxima etapa →</button></div><button type="submit" class="coach-start" data-coach-finish>Iniciar carreira de treinador →</button>
    <p class="coach-helper">O jogo preserva o fluxo de saves existente. Nenhuma habilidade, posição ou ponto de atleta será solicitado.</p>
   </aside>
  </div></form></main>`;
 const panels=Array.from(app.querySelectorAll("[data-coach-panel]"));
 const next=app.querySelector("[data-coach-next]"),finish=app.querySelector("[data-coach-finish]"),prev=app.querySelector("[data-coach-prev]");
 const form=app.querySelector("#coach-creation-form");
 function selectedClub(){return clubs.find(c=>c.id===form.elements.clubId.value)||null;}
 function update3D(){
  const viewer=root.ProLifeCoachAvatar3D;
  if(!viewer)return;
  const configuration=viewer.configFromForm(form);
  const host=app.querySelector("#coach-3d-stage");
  if(host)viewer.render(host,configuration);
  const panel=app.querySelector("#coach-profile-preview");
  if(panel)panel.classList.add("has-3d");
 }
 function appearanceNotice(){
  const element=app.querySelector("#coach-appearance-notice");
  if(!element)return;
  const a=form.elements;
  const unsupported=[];
  // Beard variants are now modeled on the live Vitruvian preview.
  // Os oculos possuem uma armacao 3D independente e funcional.
  // As tres opcoes usam a mesma malha; a diferenca e apenas a paleta.
  if(a.body.value!=="normal")unsupported.push("biotipo");
  element.textContent=unsupported.length
   ? "Ainda sem modelos 3D para: "+unsupported.join(", ")+". Estas escolhas ficam no save, mas não mudam o personagem nesta versão."
   : "Prévia 3D disponível: pele, olhos, cabelo e cores da camisa/calça. Cortes de roupa e acessórios precisam de arquivos 3D próprios.";
 }
 function review(){appearanceNotice();
  const preview=app.querySelector("#coach-profile-preview");
  if(preview){const skin=form.elements.skin.value,hair=form.elements.hairColor.value,outfit=form.elements.outfit.value;
   const face=preview.querySelector("circle"),hairPath=preview.querySelector("path"),jacket=preview.querySelectorAll("path")[1];
   if(face)face.setAttribute("fill",skin);
   if(hairPath)hairPath.setAttribute("fill",form.elements.hair.value==="bald"?"transparent":hair);
   if(jacket)jacket.setAttribute("fill",outfit==="suit"?"#1b313e":outfit==="tracksuit"?"#254f42":"#355a62");
   const eyeglasses=preview.querySelector("#coach-glasses");if(eyeglasses)eyeglasses.hidden=form.elements.accessory.value!=="glasses";
   const beard=preview.querySelector("#coach-beard");if(beard){beard.hidden=form.elements.beard.value==="none";beard.setAttribute("fill",hair);}
   const ears=preview.querySelector("#coach-eyes");if(ears)ears.setAttribute("fill",form.elements.eyeColor.value);
  }
  const club=selectedClub(),target=app.querySelector("#coach-club-analysis");
  if(target)target.textContent=club
    ? "Clube: "+club.name+" · Liga: "+(club.leagueId||"Não informada")+" · Orçamento inicial: R$ "+Number(club.budget||0).toLocaleString("pt-BR")+"."
    : "Receber propostas: o motor da carreira selecionará oportunidades. Você ainda precisará escolher uma oferta.";
  const detail=app.querySelector("#coach-confirm-details");
  if(detail){
    detail.textContent="Treinador: "+(form.elements.name.value.trim()||"Não informado")+" · "+(form.elements.nationality.value.trim()||"Brasil")+" · Idade: "+form.elements.age.value+" · Projeto: "+(club?.name||"Propostas de clubes")+" · Aparência: "+form.elements.outfit.options[form.elements.outfit.selectedIndex].text+" · Treino: "+form.elements.focus.value+" · Tática: "+form.elements.tactic.value+" · Base FC 27 · Seed: "+(form.elements.seed.value||"automática");
  }
 }
 function validIdentity(){
  for(const key of ["name","city","age","nationality"]){
   const el=form.elements[key];
   if(!el.checkValidity() || !String(el.value).trim()){el.reportValidity();el.focus();return false;}
  }
  const age=Number(form.elements.age.value);
  if(!Number.isInteger(age)||age<25||age>65){ctx.toast("Idade entre 25 e 65 anos.");return false;}
  return true;
 }
 function showStep(index){currentStep=Math.max(0,Math.min(4,index));panels.forEach((p,i)=>{p.hidden=i!==currentStep;});app.querySelectorAll("[data-coach-step]").forEach((b,i)=>{b.classList.toggle("on",i===currentStep);b.setAttribute("aria-current",i===currentStep?"step":"false");});next.hidden=currentStep===4;finish.hidden=currentStep!==4;prev.hidden=currentStep===0;}
 app.querySelectorAll("[data-coach-step]").forEach(b=>b.addEventListener("click",()=>{const target=Number(b.dataset.coachStep);if(target>0&&!validIdentity())return;showStep(target);review();}));
 next.addEventListener("click",()=>{if(currentStep===0&&!validIdentity())return;showStep(currentStep+1);review();});prev.addEventListener("click",()=>showStep(currentStep-1));form.addEventListener("input",e=>{review();if(["skin","hairColor","eyeColor"].includes(e.target.name))update3D();});form.addEventListener("change",e=>{review();if(["skin","hairColor","eyeColor","hair","beard","body","accessory","outfit"].includes(e.target.name))update3D();});showStep(0);review();update3D();
 app.querySelector('[data-coach-back]').addEventListener("click",()=>{root.ProLifeCoachAvatar3D?.dispose();currentStep=0;ctx.onBack();});
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
  const config={mode:"coach",catalogVersion:"fc27_v1",name,city,age,nationality:String(f.get("nationality")||"Brasil").trim(),clubId:String(f.get("clubId")||""),appearance:{skin:String(f.get("skin")),hairColor:String(f.get("hairColor")),eyeColor:String(f.get("eyeColor")),hair:String(f.get("hair")),beard:String(f.get("beard")),body:String(f.get("body")),accessory:String(f.get("accessory"))}};
  ctx.busy("Criando carreira de treinador FC 27…",()=>{
   try{
    const fresh=D.create(config,seed);
    if(fresh.mode==="coach"){
     if(!fresh.coachCareer)fresh.coachCareer={version:1};
     fresh.coachCareer.presentation={outfit:String(f.get("outfit")||"suit")};
    }
    const focus=String(f.get("focus")||"equilibrado");
    if(D.CoachCareer?.setFocus)D.CoachCareer.setFocus(fresh,focus);
    else if(fresh.mode==="coach"&&fresh.coachCareer)fresh.coachCareer.focus=focus;
    const tactic=String(f.get("tactic")||"balanced");
    if(!["balanced","possession","attack","counter"].includes(tactic))throw Error("Estilo tático inválido.");
    const selected=fresh.clubs?.find(c=>c.id===fresh.clubId);
    if(selected)selected.tactic=tactic;
    return ctx.onStart(fresh);
   }
   catch(err){ctx.toast(err.message);return false;}
  });
 });
}
root.ProLifeCoachCreator={mount:render};
})(typeof globalThis!=="undefined"?globalThis:this);
