(function(root){
"use strict";
// 06B: dedicated coach creation. Player attributes are never collected here.
let currentStep=0;
const STEPS=["Tipo de carreira","Treinador","Identidade","Aparência","Clube","Configurações e início"];
const FUNDING_STEP=100000000;
const FUNDING_MAX=10000000000;
// Values from older saves remain valid even though the new control advances in R$ 100 million steps.
const LEGACY_FUNDING=new Set([0,10000000,50000000]);
function validFunding(value){return Number.isSafeInteger(value)&&(LEGACY_FUNDING.has(value)||(value>=FUNDING_STEP&&value<=FUNDING_MAX&&value%FUNDING_STEP===0));}
// FC 27 career database nationalities; selection is independent of national teams.
const NATIONALITIES=["África do Sul","Albania","Alemanha","Andorra","Angola","Antigua and Barbuda","Arábia Saudita","Argélia","Argentina","Armenia","Austrália","Áustria","Azerbaijan","Belarus","Belgium","Benin","Bermuda","Bolivia","Bosnia Herzegovina","Brasil","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Camarões","Canada","CAR","Chad","Chile","China","Chinese Taipei","Colômbia","Comoros","Congo","Coreia do Norte","Coreia do Sul","Costa do Marfim","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic","Denmark","Dominican Republic","DR Congo","Egito","El Salvador","Equador","Equatorial Guinea","Escócia","Espanha","Estados Unidos","Estonia","Faroe Islands","Fiji","Finland","França","FYR Macedonia","Gabon","Gambia","Georgia","Ghana","Gibraltar","Grécia","Grenada","Guatemala","Guinea","Guinea Bissau","Guyana","Haiti","Honduras","Hong Kong","Hungary","Iceland","India","Indonesia","Inglaterra","Iran","Iraq","Irlanda","Irlanda do Norte","Israel","Itália","Jamaica","Japão","Jordan","Kazakhstan","Kenya","Kosovo","Latvia","Lebanon","Liberia","Libya","Liechtenstein","Lithuania","Luxemburg","Madagascar","Malawi","Mali","Malta","Marrocos","Mauritania","Mauritius","México","Moldova","Montenegro","Montserrat","Mozambique","Namibia","Netherlands Antilles","Nigéria","Norway","Nova Zelândia","País de Gales","Países Baixos","Pakistan","Palestinian Authority","Panama","Paraguay","Peru","Philippines","Polônia","Portugal","Puerto Rico","Romania","Rússia","Senegal","Serbia","Sierra Leone","Slovakia","Slovenia","South Sudan","Sri Lanka","St Kitts Nevis","St Lucia","Sudan","Suécia","Suíça","Suriname","Syria","Tanzania","Thailand","Togo","Trinidad and Tobago","Tunisia","Turquia","Ucrânia","Uganda","United Arab Emirates","Uruguay","Uzbekistan","Vanuatu","Venezuela","Zambia","Zimbabwe"];

const esc2=v=>String(v).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function lookSelect(name,label,list,value){return `<label>${label}<select name="${name}">${list.map(([v,t])=>`<option value="${v}" ${v===value?"selected":""}>${esc2(t)}</option>`).join("")}</select></label>`;}
function lookSwatches(name,list){return `<div class="look-swatches" role="group" aria-label="Cores">${list.map(c=>`<button type="button" class="look-swatch" data-swatch="${name}" data-value="${c}" style="--sw:${c}" aria-label="${c}"></button>`).join("")}</div>`;}
function lookRange(name,label,value,hint){return `<label class="coach-full look-range">${label}<span class="look-range-row"><input type="range" name="${name}" min="0" max="100" step="1" value="${value}"><output ${hint?`data-looks-${hint}`:""}></output></span></label>`;}
function appearancePanel(){
 const A=root.ProLifeCoachAvatar2D;
 if(!A)return '<div class="coach-full coach-section-note"><b>Aparência</b><p>O editor de aparência não foi carregado.</p></div>';
 const D=A.DEFAULTS,C=A.CATALOG;
 const presets=A.PRESETS.map(p=>`<button type="button" class="look-preset" data-coach-preset="${p.id}" title="${esc2(p.name)}"><span class="look-thumb">${A.svg(p.cfg,{uid:"p"+p.id})}</span><b>${esc2(p.name)}</b></button>`).join("");
 return `<div class="coach-full coach-section-note"><b>Modelos prontos</b><p>Escolha um ponto de partida e ajuste cada detalhe abaixo.</p></div>
 <div class="coach-full look-presets">${presets}</div>
 <div class="coach-full look-tools"><button type="button" class="coach-return" data-coach-random>Sortear aparência</button><button type="button" class="coach-return" data-coach-reset>Restaurar padrão</button></div>
 <fieldset class="coach-full look-group"><legend>Rosto</legend>${lookSelect("face","Formato",C.face,D.face)}${lookSelect("eyes","Olhos",C.eyes,D.eyes)}${lookSelect("brows","Sobrancelhas",C.brows,D.brows)}${lookSelect("nose","Nariz",C.nose,D.nose)}${lookSelect("mouth","Boca",C.mouth,D.mouth)}${lookSelect("expression","Expressão",C.expression,D.expression)}</fieldset>
 <fieldset class="coach-full look-group"><legend>Pele e olhos</legend><div class="coach-full">${lookSwatches("skin",A.SKINS)}</div><label>Cor da pele<input name="skin" type="color" value="${D.skin}"></label><div class="coach-full">${lookSwatches("eyeColor",A.EYES)}</div><label>Cor dos olhos<input name="eyeColor" type="color" value="${D.eyeColor}"></label></fieldset>
 <fieldset class="coach-full look-group"><legend>Cabelo e barba</legend>${lookSelect("hair","Cabelo",C.hair,D.hair)}<div class="coach-full">${lookSwatches("hairColor",A.HAIRS)}</div><label>Cor do cabelo<input name="hairColor" type="color" value="${D.hairColor}"></label>${lookRange("grey","Fios brancos",D.grey)}${lookSelect("beard","Barba",C.beard,D.beard)}${lookSelect("glasses","Óculos",C.glasses,D.glasses)}</fieldset>
 <fieldset class="coach-full look-group"><legend>Corpo e idade</legend>${lookSelect("body","Porte",C.body,D.body)}${lookRange("ageLook","Marcas de idade (rugas)",D.age,"age")}</fieldset>
 <fieldset class="coach-full look-group"><legend>Roupa</legend>${lookSelect("outfit","Peça",C.outfit,D.outfit)}<label>Cor principal<input name="outfitColor" type="color" value="${D.outfitColor}"></label><label>Cor de detalhe (gravata, faixas)<input name="accentColor" type="color" value="${D.accentColor}"></label></fieldset>`;
}
function render(ctx){
 const {D,esc}=ctx;
 // Reuse canonical available club catalog; no separate world or generated league list.
 let clubs=[],previewState=null;
 try{previewState=D.create({mode:"coach",catalogVersion:"fc27_v1"},1);clubs=previewState.clubs||[];
   const browser=root.ProLifeClubBrowser;
   if(browser?.collect){const shared=browser.collect(previewState,D);if(shared.length)clubs=shared.map(c=>({...c,active:true,strength:Number(c.reputation)||60,budget:Number(previewState.clubs?.find(x=>x.id===c.id)?.budget??previewState.globalFootball?.clubs?.find(x=>x.id===c.id)?.budget)||0,roster:c.players||[],country:c.country,leagueName:c.leagueName,source:c.source}));}
 }catch(e){console.warn("Club selection unavailable",e);}
 const options=clubs.filter(c=>c&&c.id&&c.active!==false).map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join("");
 const app=document.getElementById("app");
 if(!app)return;
 app.innerHTML=`<main class="coach-creation" data-coach-creator="1">
  <header class="coach-creation-header"><div><span class="coach-kicker">PRO LIFE · FC 27 · MODO TREINADOR</span><h1>Construir carreira</h1><p class="coach-subtitle">Escolha sua identidade e seu primeiro projeto. Comande um clube, gerencie o elenco e responda à diretoria.</p></div><button type="button" class="coach-return" data-coach-back="1">← Voltar</button></header>
  <nav class="coach-steps" aria-label="Etapas de criação">${STEPS.map((label,i)=>'<button type="button" data-coach-step="'+i+'" class="'+(i===currentStep?"on":"")+'" aria-current="'+(i===currentStep?"step":"false")+'">'+String(i+1).padStart(2,"0")+' · '+label+'</button>').join("")}</nav><form id="coach-creation-form"><div class="coach-creation-grid">
   <section class="coach-creation-card"><h2>Perfil do treinador</h2>
    <div class="coach-fields" data-coach-panel="0"><div class="coach-full coach-section-note"><b>Tipo de carreira</b><p>Carreira Original começa um novo universo no motor atual. Carreira Ao Vivo exige dados e calendário reais e ainda não está disponível.</p></div><label class="coach-full">Experiência de carreira<select name="careerType"><option value="original">Carreira Original</option><option value="live" disabled>Carreira Ao Vivo (em desenvolvimento)</option></select></label></div>
    <div class="coach-fields" data-coach-panel="1"><div class="coach-full coach-section-note"><b>Escolher treinador</b><p>Crie seu próprio treinador. Treinadores reais exigem perfis e licenças próprios e ainda não estão disponíveis.</p></div><label class="coach-full">Perfil<select name="coachType"><option value="custom">Criar novo treinador</option><option value="real" disabled>Utilizar treinador real (em desenvolvimento)</option></select></label></div>
    <div class="coach-fields" data-coach-panel="2">
     <label class="coach-full">Nome completo<input name="name" required maxlength="60" autocomplete="name" value="" placeholder="Nome do treinador"></label>
     <label>Cidade natal<input name="city" required maxlength="60" value="" placeholder="Cidade"></label>
     <label>Idade inicial<input name="age" type="number" min="25" max="65" required value="35"></label>
     <label class="coach-full">Nacionalidade<select name="nationality" required>${NATIONALITIES.map(n=>`<option value="${esc(n)}" ${n==="Brasil"?"selected":""}>${esc(n)}</option>`).join("")}</select></label>
    </div><div class="coach-fields coach-looks" data-coach-panel="3">${appearancePanel()}</div>
    <div class="coach-fields" data-coach-panel="4"><label>Buscar clube<input type="search" name="clubSearch" placeholder="Nome do clube" autocomplete="off"></label><label>País<select name="countryFilter"><option value="">Todos os países</option></select></label><label>Filtrar competição<select name="leagueFilter"><option value="">Todas as competições</option></select></label><label class="coach-full">Primeiro projeto<select name="clubId"><option value="">Receber propostas de clubes</option>${options}</select></label><div class="coach-full coach-club-results" id="coach-club-results" aria-label="Escolha visual dos clubes"></div><div class="coach-full coach-club-analysis" id="coach-club-analysis" aria-live="polite"></div>
    </div><div class="coach-fields" data-coach-panel="5"><div class="coach-full coach-section-note"><b>Configurações finais — PRO-LIFE</b><p>Predefinições com efeitos reais. Abas adicionais indicam o que ainda será desenvolvido, sem alterar regras de simulação.</p></div>
    <label class="coach-full">Predefinição<select name="preset"><option value="balanced">Equilibrado (padrão)</option><option value="realistic">Realista</option><option value="custom">Personalizado</option></select></label>
    <nav class="coach-settings-tabs coach-full" aria-label="Categorias de configuração"><button type="button" data-settings-tab="general">Geral</button><button type="button" data-settings-tab="finance">Finanças</button><button type="button" data-settings-tab="market">Transferências</button><button type="button" data-settings-tab="management">Gestão</button><button type="button" data-settings-tab="development">Elenco</button><button type="button" data-settings-tab="world">Mundo</button></nav>
    <div class="coach-full coach-settings-pane" data-settings-panel="general"><p>O modo treinador usa o motor de simulação atual; dificuldade e velocidade personalizadas ainda não estão disponíveis.</p></div>
    <div class="coach-full coach-settings-pane" data-settings-panel="finance"><label>Cenário financeiro inicial<select name="financialScenario"><option value="legacy">Original do clube</option><option value="conservative">Conservador (70%)</option><option value="standard">Padrão (100%)</option><option value="ambitious">Ambicioso (150%)</option></select></label><div class="coach-full coach-section-note" id="coach-finance-preview" aria-live="polite"></div><div class="coach-funding-field"><span>Orçamento adicional inicial</span><div class="coach-funding-stepper" role="group" aria-label="Ajustar orçamento adicional inicial"><button type="button" data-funding-decrease aria-label="Diminuir aporte em R$ 100 milhões">−</button><output id="coach-funding-value" for="coach-funding-input" aria-live="polite">Sem aporte</output><button type="button" data-funding-increase aria-label="Aumentar aporte em R$ 100 milhões">+</button><input id="coach-funding-input" type="hidden" name="funding" value="0"></div><input type="range" class="coach-funding-range" name="fundingRange" min="0" max="100" step="1" value="0" aria-label="Orçamento adicional inicial: arraste para ajustar"><div class="coach-funding-marks"><span>Sem aporte</span><span>R$ 5 bi</span><span>R$ 10 bi</span></div><small>Arraste a barra ou segure + / − para subir ou descer rápido. De R$ 100 milhões a R$ 10 bilhões, em passos de R$ 100 milhões.</small></div><p>Aplicado uma única vez ao clube escolhido quando a carreira é criada. Sem clube, não há aporte.</p></div>
    <div class="coach-full coach-settings-pane" data-settings-panel="market"><label>Rigor nas contratações<select name="marketStrictness"><option value="flexible">Flexível — negociações mais fáceis</option><option value="normal" selected>Normal — avaliação atual</option><option value="strict">Rigoroso — maior exigência financeira e esportiva</option></select></label><label>Primeira janela de transferências<select name="firstWindow"><option value="on">Ativada</option><option value="off">Desativada — contratações bloqueadas na primeira janela</option></select></label><label>Pagamento parcelado<select name="installments"><option value="off">Desativado — pagamento à vista</option><option value="on">Ativado — permitir entrada e parcela futura</option></select></label><label>Empréstimos de jogadores<select name="loans"><option value="off">Desativados</option><option value="on">Ativados — 180 ou 365 dias</option></select></label><p>Estas escolhas afetam o comando de contratação do treinador; não alteram o mercado do modo jogador.</p></div>
    <div class="coach-full coach-settings-pane" data-settings-panel="management"><p>Metas da diretoria, confiança e demissão continuam seguindo as regras reais já implementadas no modo treinador.</p></div>
    <div class="coach-full coach-settings-pane" data-settings-panel="development"><p>Foco de treino coletivo aplicado ao motor existente:</p></div>
    <div class="coach-full coach-settings-pane" data-settings-panel="world"><p>Competições e calendário seguem o catálogo ativo. A seed opcional permite reproduzir o mesmo início de universo.</p></div>
    <div class="coach-full coach-settings-core"><div class="coach-full coach-section-note"><b>Configurações básicas</b><p>Base FC 27 · carreira tradicional · regras padrão. O foco de treino selecionado afeta o elenco semanalmente. Se você escolher um clube diretamente, o estilo tático inicial também será aplicado ao clube.</p></div><label class="coach-full">Plano tático inicial (clube escolhido)<select name="tactic"><option value="balanced">Equilibrado</option><option value="possession">Posse de bola</option><option value="attack">Ofensivo</option><option value="counter">Contra-ataque</option></select></label><label class="coach-full">Foco inicial de treino coletivo<select name="focus"><option value="equilibrado">Equilibrado</option><option value="fisico">Preparação física</option><option value="tecnico">Refino técnico</option><option value="jovens">Desenvolvimento de jovens</option><option value="recuperacao">Recuperação</option></select></label><label class="coach-full">Seed do mundo (opcional)<input name="seed" type="number" placeholder="Mesmo número = mesmo universo inicial"></label>
    </div><div class="coach-full coach-section-note"><b>Revisão do projeto</b><div class="coach-confirm-details" id="coach-confirm-details" aria-live="polite"></div><p>A carreira será salva em um slot separado.</p></div></div>
    <p class="coach-section-note">A carreira de treinador usa reputação, licenças, objetivos da diretoria, elenco e orçamento do motor atual. As opções de formação e estilo tático serão configuradas dentro do clube, onde já existem efeitos reais.</p>
    <p class="coach-section-note">Base FC 27 selecionada para a nova carreira. Os dados do mundo e dos atletas são simulados.</p>
   </section>
   <aside class="coach-creation-card">
    <h2>Seu projeto de carreira</h2>
    <div class="coach-profile-art" id="coach-profile-preview" aria-label="Prévia do treinador"><div class="coach-2d-stage" id="coach-2d-stage"></div></div>
    <div class="coach-summary"><div><small>Modo</small><strong>Treinador</strong></div><div><small>Base</small><strong>FC 27</strong></div><div><small>Início</small><strong>Temporada 2026</strong></div><div><small>Carreira</small><strong>Gestão de clube</strong></div></div>
    <div class="coach-navigation"><button type="button" class="coach-return" data-coach-prev>← Anterior</button><button type="button" class="coach-start" data-coach-next>Próxima etapa →</button></div><button type="submit" class="coach-start" data-coach-finish>Iniciar carreira de treinador →</button>
    <p class="coach-helper">O jogo preserva o fluxo de saves existente. Nenhuma habilidade, posição ou ponto de atleta será solicitado.</p>
   </aside>
  </div></form></main>`;
 const settingsButtons=[...app.querySelectorAll("[data-settings-tab]")];
 function settingsTab(name){app.querySelectorAll("[data-settings-panel]").forEach(p=>p.hidden=p.dataset.settingsPanel!==name);settingsButtons.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.settingsTab===name)));}
 settingsButtons.forEach(b=>b.addEventListener("click",()=>settingsTab(b.dataset.settingsTab)));
 settingsTab("general");
 const panels=Array.from(app.querySelectorAll("[data-coach-panel]"));
 const next=app.querySelector("[data-coach-next]"),finish=app.querySelector("[data-coach-finish]"),prev=app.querySelector("[data-coach-prev]");
 const form=app.querySelector("#coach-creation-form");
 const looksFields=new Set(root.ProLifeCoachAvatar2D?root.ProLifeCoachAvatar2D.FORM_FIELDS:[]);
 let randomSeed=(Date.now()>>>0)||7;
 const fundingInput=form.elements.funding;
 const fundingOutput=app.querySelector("#coach-funding-value");
 const fundingDecrease=app.querySelector("[data-funding-decrease]");
 const fundingIncrease=app.querySelector("[data-funding-increase]");
 function fundingLabel(value){return value===0?"Sem aporte":"+ R$ "+value.toLocaleString("pt-BR");}
 function renderFunding(){
   const value=Number(fundingInput.value)||0;
   fundingOutput.textContent=fundingLabel(value);
   fundingDecrease.disabled=value<=0;
   fundingIncrease.disabled=value>=FUNDING_MAX;
   if(fundingRange&&Number(fundingRange.value)!==Math.round(value/FUNDING_STEP))fundingRange.value=String(Math.round(value/FUNDING_STEP));
 }
 function setFunding(value,{custom=true}={}){
   const nextValue=Math.max(0,Math.min(FUNDING_MAX,Number(value)||0));
   fundingInput.value=String(nextValue);
   if(custom&&nextValue!==0)form.elements.preset.value="custom";
   renderFunding();
   review();
 }
 const fundingRange=form.elements.fundingRange;
 function holdRepeat(button,direction){
  let timer=null,delay=null,held=false,ticks=0;
  const stop=()=>{clearTimeout(delay);clearInterval(timer);timer=delay=null;};
  const step=()=>{ticks++;const jump=ticks>40?25:ticks>20?10:ticks>8?4:1;held=true;setFunding(Number(fundingInput.value)+direction*FUNDING_STEP*jump);if((direction>0&&Number(fundingInput.value)>=FUNDING_MAX)||(direction<0&&Number(fundingInput.value)<=0))stop();};
  button.addEventListener("pointerdown",e=>{if(button.disabled||(e.button&&e.button!==0))return;held=false;ticks=0;delay=setTimeout(()=>{timer=setInterval(step,70);step();},380);});
  for(const type of ["pointerup","pointerleave","pointercancel","blur"])button.addEventListener(type,stop);
  button.addEventListener("click",()=>{if(held){held=false;return;}setFunding(Number(fundingInput.value)+direction*FUNDING_STEP);});
 }
 holdRepeat(fundingDecrease,-1);holdRepeat(fundingIncrease,1);
 fundingRange?.addEventListener("input",()=>setFunding(Number(fundingRange.value)*FUNDING_STEP));
 form.elements.preset.addEventListener("change",()=>{
   if(form.elements.preset.value==="realistic"||form.elements.preset.value==="balanced")setFunding(0,{custom:false});
 });
 fundingInput.addEventListener("change",()=>{if(fundingInput.value!=="0")form.elements.preset.value="custom";renderFunding();});
 renderFunding();
 for(const key of ["marketStrictness","firstWindow","installments","loans"]){form.elements[key].addEventListener("change",()=>{form.elements.preset.value="custom";});}

 function selectedClub(){return clubs.find(c=>c.id===form.elements.clubId.value)||null;}
 // Filter only the canonical club catalog. No duplicate league database or random entries.
 const leagueSelect=form.elements.leagueFilter;
 const countrySelect=form.elements.countryFilter;
 for(const country of [...new Set(clubs.map(c=>String(c.country||"Brasil")))].sort((a,b)=>a.localeCompare(b,"pt-BR"))){const option=document.createElement("option");option.value=country;option.textContent=country;countrySelect.appendChild(option);}
 const leagueLabels=new Map(clubs.map(c=>[String(c.leagueId||""),String(c.leagueName||c.leagueId||"Liga não informada")]));
 const originalClubOptions=[...form.elements.clubId.options].map(option=>({value:option.value,text:option.textContent}));
 function normalize(value){return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR");}
 function rebuildLeagueOptions(){
   const old=leagueSelect.value,country=countrySelect.value;
   const options=[...new Set(clubs.filter(c=>c.active!==false&&(!country||String(c.country||"Brasil")===country))
     .map(c=>String(c.leagueId||"Não informada")))]
     .sort((x,y)=>(leagueLabels.get(x)||x).localeCompare(leagueLabels.get(y)||y,"pt-BR"));
   leagueSelect.replaceChildren();
   const all=document.createElement("option");all.value="";all.textContent="Todas as competições";leagueSelect.appendChild(all);
   for(const id of options){const node=document.createElement("option");node.value=id;node.textContent=leagueLabels.get(id)||id;leagueSelect.appendChild(node);}
   leagueSelect.value=options.includes(old)?old:"";
 }
 function filterClubs(){
   const term=normalize(form.elements.clubSearch.value),league=leagueSelect.value,country=countrySelect.value;
   const selector=form.elements.clubId,selected=selector.value;
   selector.replaceChildren();
   for(const option of originalClubOptions){
     if(option.value){
       const club=clubs.find(c=>c.id===option.value);
       if(!club||(country&&String(club.country||"Brasil")!==country)||(league&&String(club.leagueId||"Não informada")!==league)||!normalize(club.name).includes(term))continue;
     }
     const node=document.createElement("option");node.value=option.value;node.textContent=option.text;selector.appendChild(node);
   }
   selector.value=[...selector.options].some(option=>option.value===selected)?selected:"";
   const results=app.querySelector("#coach-club-results");
   if(results){
     results.replaceChildren();
     const visible=[...selector.options].filter(option=>option.value).slice(0,36);
     for(const option of visible){
       const club=clubs.find(c=>c.id===option.value);
       if(!club)continue;
       const button=document.createElement("button");button.type="button";button.className="coach-club-option";
       button.dataset.clubChoice=club.id;button.setAttribute("aria-pressed",String(selector.value===club.id));
       const label=document.createElement("span");label.textContent=club.name;
       const meta=document.createElement("small");meta.textContent=[club.country||"Brasil",club.leagueName||leagueLabels.get(String(club.leagueId))||club.leagueId].filter(Boolean).join(" · ");
       const info=document.createElement("span");info.className="coach-club-option-info";info.append(label,meta);
       if(root.ProLifeClubCrests?.render){
         const crest=root.ProLifeClubCrests.render(club.id,{size:"sm"});
         if(crest&&/^<(?:img|svg|span)\b/i.test(crest)){
           const emblem=document.createElement("span");emblem.className="coach-club-option-crest";
           emblem.innerHTML=crest;button.appendChild(emblem);
         }
       }       button.appendChild(info);
       button.addEventListener("click",()=>{selector.value=club.id;results.querySelectorAll("[data-club-choice]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.clubChoice===club.id)));review();});
       results.appendChild(button);
     }
     if(!visible.length){const empty=document.createElement("p");empty.textContent="Nenhum clube encontrado. Limpe os filtros para ver outras equipes.";results.appendChild(empty);}
   }
   review();
 }
 // The club-country default follows the coach nationality, without restricting choice.
 function syncCoachCountry(){
   const nationality=String(form.elements.nationality.value||"");
   const known=[...countrySelect.options].map(o=>o.value).filter(Boolean);
   const aliases={"Escócia":"Scotland","País de Gales":"Wales","Estados Unidos":"United States","Países Baixos":"Netherlands","Alemanha":"Germany","Espanha":"Spain","Itália":"Italy","França":"France","Portugal":"Portugal","Brasil":"Brasil","Inglaterra":"Inglaterra"};
   const normalized=normalize(nationality);
   const wanted=known.find(c=>normalize(c)===normalized)||known.find(c=>normalize(c)===normalize(aliases[nationality]));
   countrySelect.value=wanted||"";
   leagueSelect.value="";
   rebuildLeagueOptions();
   filterClubs();
 }
 syncCoachCountry();
 form.elements.nationality.addEventListener("change",syncCoachCountry);
 form.elements.clubSearch.addEventListener("input",()=>{
   // Name search is global; reset geographic filters so international clubs can be discovered.
   if(form.elements.clubSearch.value.trim()){countrySelect.value="";rebuildLeagueOptions();leagueSelect.value="";}
   filterClubs();
 });
 leagueSelect.addEventListener("change",filterClubs);
 countrySelect.addEventListener("change",()=>{rebuildLeagueOptions();filterClubs();});
 form.elements.clubId.addEventListener("change",filterClubs);
 filterClubs();
  function update2D(){
  const A=root.ProLifeCoachAvatar2D;
  const host=app.querySelector("#coach-2d-stage");
  if(!A||!host)return;
  const cfg=A.configFromForm(form);
  A.render(host,cfg,{uid:"creator"});
  host.dataset.looks=JSON.stringify(cfg);
  const label=app.querySelector("[data-looks-age]");if(label)label.textContent=cfg.age<20?"Jovem":cfg.age<50?"Meia-idade":cfg.age<75?"Experiente":"Veterano";
  app.querySelectorAll("[data-swatch]").forEach(b=>b.classList.toggle("on",(form.elements[b.dataset.swatch]?.value||"").toLowerCase()===b.dataset.value));
  app.querySelectorAll("[data-coach-preset]").forEach(b=>b.classList.toggle("on",!!b.dataset.active));
  return cfg;
 }
 function applyLooks(cfg){const A=root.ProLifeCoachAvatar2D;if(!A)return;A.applyToForm(form,cfg);update2D();review();}
 app.querySelectorAll("[data-coach-preset]").forEach(b=>b.addEventListener("click",()=>{const A=root.ProLifeCoachAvatar2D;const p=A.PRESETS.find(x=>x.id===b.dataset.coachPreset);if(p){applyLooks(p.cfg);app.querySelectorAll("[data-coach-preset]").forEach(x=>{delete x.dataset.active;});b.dataset.active="1";update2D();}}));
 app.querySelector("[data-coach-random]")?.addEventListener("click",()=>{randomSeed=(randomSeed*1664525+1013904223)>>>0;applyLooks(root.ProLifeCoachAvatar2D.randomize(randomSeed));});
 app.querySelector("[data-coach-reset]")?.addEventListener("click",()=>applyLooks(root.ProLifeCoachAvatar2D.DEFAULTS));
 app.querySelectorAll("[data-swatch]").forEach(b=>b.addEventListener("click",()=>{const el=form.elements[b.dataset.swatch];if(!el)return;el.value=b.dataset.value;el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));}));
 function clubBriefing(club){
   if(!club)return "Receber propostas: você começa sem clube e poderá avaliar oportunidades na carreira.";
   const peers=clubs.filter(c=>c.leagueId===club.leagueId&&c.active!==false)
     .sort((a,b)=>Number(b.strength||0)-Number(a.strength||0)||String(a.id).localeCompare(String(b.id)));
   const n=Math.max(1,peers.length),rank=Math.max(1,peers.findIndex(c=>c.id===club.id)+1);
   const relative=(rank-1)/Math.max(1,n-1);
   const kind=rank<=Math.max(1,Math.round(n*.12))?"Título":relative<.35?"Parte de cima da tabela":relative<.7?"Meio de tabela":"Permanência";
   const roster=Array.isArray(club.roster)?club.roster.filter(p=>p.status!=="retired"):[];
   const avg=roster.length?Math.round(roster.reduce((total,p)=>total+(Number(p.morale)||60),0)/roster.length):null;
   const money=(scenarioBudget(club,form.elements.financialScenario.value)+(Number(form.elements.funding.value)||0)).toLocaleString("pt-BR");
   const entries=[
     "Clube: "+club.name,
     "Competição: "+(club.leagueId||"Não informada"),
     "Orçamento disponível: R$ "+money,
     "Jogadores no elenco: "+roster.length,
     "Moral média: "+(avg===null?"Sem dados":avg+"/100"),
     "Expectativa esportiva estimada: "+kind,
     "Objetivos adicionais: orçamento positivo e moral do elenco acima de 60"
   ];
   if(club.country)entries.splice(1,0,"País: "+club.country);
   if(club.leagueName)entries[2]="Competição: "+club.leagueName;
   return entries.join(" · ");
 }
 function scenarioBudget(club,scenario){
  if(!club)return null;
  const original=Number(club.budget)||0;
  const found=(root.ProLifeClubEconomy?.scenarios?.(club)||[]).find(x=>x.id===scenario);
  return found?found.proposedTransferBudget:original;
 }
 const money=v=>"R$ "+Math.round(v).toLocaleString("pt-BR");
 function refreshScenarioLabels(){
  const club=selectedClub(),select=form.elements.financialScenario;
  if(!select)return;
  const names={legacy:"Original do clube",conservative:"Conservador (70%)",standard:"Padrão (100%)",ambitious:"Ambicioso (150%)"};
  for(const option of select.options)option.textContent=names[option.value]+(club?" — "+money(scenarioBudget(club,option.value)):"");
 }
 function financePreview(){
  const club=selectedClub(),scenario=form.elements.financialScenario.value;
  const funding=Number(form.elements.funding.value)||0;
  if(!club)return "Sem clube escolhido: orçamento inicial será definido quando você assumir um clube. Selecione Original para começar recebendo propostas.";
  const choices=root.ProLifeClubEconomy?.scenarios?.(club)||[];
  const found=choices.find(x=>x.id===scenario);
  const original=Number(club.budget)||0;
  const selected=found?found.proposedTransferBudget:original;
  return "Orçamento base: R$ "+selected.toLocaleString("pt-BR")+
    " · Aporte: R$ "+funding.toLocaleString("pt-BR")+
    " · Total previsto: R$ "+(selected+funding).toLocaleString("pt-BR")+
    (found?" · Cenário "+found.label:" · Orçamento original");
 }
 function review(){
  refreshScenarioLabels();
  const club=selectedClub(),target=app.querySelector("#coach-club-analysis");
  if(target){
    target.textContent=clubBriefing(club);
    if(club&&root.ProLifeClubCrests?.render){
      const crest=root.ProLifeClubCrests.render(club.id,{size:"sm"});
      if(crest&&/^<(?:img|svg|span)\b/i.test(crest)){
        const node=document.createElement("span");
        node.className="coach-club-crest";
        node.innerHTML=crest;
        target.prepend(node);
      }
    }
  }
  const financial=app.querySelector("#coach-finance-preview");if(financial)financial.textContent=financePreview();
  const detail=app.querySelector("#coach-confirm-details");
  if(detail){
    detail.textContent="Treinador: "+(form.elements.name.value.trim()||"Não informado")+" · "+(form.elements.nationality.value.trim()||"Brasil")+" · Idade: "+form.elements.age.value+" · Projeto: "+(club?.name||"Propostas de clubes")+" · Aparência: "+(form.elements.outfit?.selectedOptions?.[0]?.text||"Padrão")+" · Treino: "+form.elements.focus.value+" · Tática: "+form.elements.tactic.value+" · "+financePreview()+" · Base FC 27 · Seed: "+(form.elements.seed.value||"automática");
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
 function showStep(index){currentStep=Math.max(0,Math.min(STEPS.length-1,index));panels.forEach((p,i)=>{p.hidden=i!==currentStep;});app.querySelectorAll("[data-coach-step]").forEach((b,i)=>{b.classList.toggle("on",i===currentStep);b.setAttribute("aria-current",i===currentStep?"step":"false");});next.hidden=currentStep===STEPS.length-1;finish.hidden=currentStep!==STEPS.length-1;prev.hidden=currentStep===0;}
 app.querySelectorAll("[data-coach-step]").forEach(b=>b.addEventListener("click",()=>{const target=Number(b.dataset.coachStep);if(target>2&&!validIdentity())return;showStep(target);review();}));
 next.addEventListener("click",()=>{if(currentStep===2&&!validIdentity())return;showStep(currentStep+1);review();});prev.addEventListener("click",()=>showStep(currentStep-1));form.addEventListener("input",e=>{review();if(looksFields.has(e.target.name))update2D();});form.addEventListener("change",e=>{review();if(looksFields.has(e.target.name)){if(e.target.name==="outfit"){const od=root.ProLifeCoachAvatar2D?.OUTFIT_DEFAULT[e.target.value];if(od){form.elements.outfitColor.value=od[0];form.elements.accentColor.value=od[1];}}update2D();}});showStep(0);review();update2D();
 app.querySelector('[data-coach-back]').addEventListener("click",()=>{currentStep=0;ctx.onBack();});
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
  if(f.get("careerType")!=="original"||f.get("coachType")!=="custom"){ctx.toast("Este modo ainda não está disponível.");return;}
  const looksConfig=root.ProLifeCoachAvatar2D?root.ProLifeCoachAvatar2D.configFromForm(event.currentTarget):null;
  const config={mode:"coach",catalogVersion:"fc27_v1",name,city,age,nationality:String(f.get("nationality")||"Brasil").trim(),clubId:String(f.get("clubId")||""),financialScenario:String(f.get("clubId")||"")?String(f.get("financialScenario")||"legacy"):"legacy",appearance:looksConfig?root.ProLifeCoachAvatar2D.toAppearance(looksConfig):{}};
  ctx.busy("Criando carreira de treinador FC 27…",()=>{
   try{
    const fresh=D.create(config,seed);
    if(fresh.mode==="coach"){
     if(!fresh.coachCareer)fresh.coachCareer={version:1};
     fresh.coachCareer.presentation={outfit:String(f.get("outfit")||"suit"),careerType:"original",coachType:"custom",avatar2d:looksConfig||null};
    }
    const focus=String(f.get("focus")||"equilibrado");
    if(D.CoachCareer?.setFocus)D.CoachCareer.setFocus(fresh,focus);
    else if(fresh.mode==="coach"&&fresh.coachCareer)fresh.coachCareer.focus=focus;
    const tactic=String(f.get("tactic")||"balanced");
    if(!["balanced","possession","attack","counter"].includes(tactic))throw Error("Estilo tático inválido.");
    const selected=D.club?.(fresh,fresh.clubId)||fresh.clubs?.find(c=>c.id===fresh.clubId);
    if(selected)selected.tactic=tactic;
    const funding=Number(f.get("funding")||0);
    if(!validFunding(funding))throw Error("Aporte financeiro inválido.");
    if(fresh.mode==="coach"){fresh.coachCareer.settings={preset:String(f.get("preset")||"balanced"),funding,marketStrictness:String(f.get("marketStrictness")||"normal"),firstWindow:String(f.get("firstWindow")||"on"),firstWindowStartDay:Number(fresh.day)||0,installments:String(f.get("installments")||"off"),loans:String(f.get("loans")||"off")};const baseBudget=selected?Number(selected.budget)||0:0;if(selected)fresh.coachCareer.settings.initialBudget={clubId:selected.id,scenario:String(f.get("financialScenario")||"legacy"),base:baseBudget,funding,total:baseBudget+funding};if(selected&&funding){selected.budget=baseBudget+funding;fresh.coachCareer.settings.fundingApplied=true;}else fresh.coachCareer.settings.fundingApplied=false;}
    return ctx.onStart(fresh);
   }
   catch(err){ctx.toast(err.message);return false;}
  });
 });
}
root.ProLifeCoachCreator={mount:render};
})(typeof globalThis!=="undefined"?globalThis:this);
