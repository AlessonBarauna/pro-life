(function coachSquadHubModule(root){
  "use strict";

  const state={cols:{name:"",pos:"all",age:"",ovr:"",pot:"",value:"",salary:"",contract:"",status:"all"},sortKey:"ovr",sortDir:"desc",selectedPlayerId:null,query:"",position:"all",status:"all",sort:"overall",direction:"desc",renewingPlayerId:null,detailOpen:false};
  const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
  const text=value=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR");
  const money=value=>"R$ "+Math.max(0,Math.round(Number(value)||0)).toLocaleString("pt-BR");
  const overall=(D,p)=>Math.round(Number(p?.overall??p?.ovr??D?.overall?.(p))||0);
  const potential=(D,p)=>Math.max(overall(D,p),Math.min(99,Math.round(Number(p?.potential)||overall(D,p))));
  const salary=p=>Math.max(0,Math.round(Number(p?.salary??p?.monthlySalary??p?.wage)||0));
  const marketValue=p=>Number(root.ProLifePlayerEconomy?.marketValue?.(p))||Number(root.ProLifeApp?.valuation?.(p))||0;
  const endDay=p=>[p?.contractEndDay,p?.contract?.endDay,p?.contract?.expiresDay].map(Number).find(Number.isFinite);
  const portrait=p=>root.ProLifePlayerCard?.portrait?.(p)||"";
  const statusOf=(prefs,p)=>{
    if((prefs.blockedIds||[]).includes(p.id))return "blocked";
    if((prefs.loanListedIds||[]).includes(p.id))return "loan_listed";
    if((prefs.listedIds||[]).includes(p.id))return "listed";
    return "available";
  };
  const statusLabel={available:"Disponível",listed:"Lista de transferências",loan_listed:"Lista de empréstimos",blocked:"Ofertas bloqueadas"};
  const roleLabel=value=>({rotation:"Rotação",important:"Importante",starter:"Titular",star:"Estrela"})[value]||value||"Não definido";
  const remaining=(s,p)=>{const end=endDay(p);return Number.isFinite(end)?Math.max(0,Math.ceil((end-Number(s.day||0))/30)):null;};
  const releaseCost=(s,p)=>salary(p)*Math.min(12,remaining(s,p)||0);
  const activeOffer=(s,p)=>((s.coachCareer?.saleOffers)||[]).find(o=>o.playerId===p.id&&(o.status==="awaiting_window"||(o.status==="pending"&&(!Number.isFinite(Number(o.expiresDay))||Number(o.expiresDay)>=Number(s.day)))));
  const activeLoan=(s,p)=>((s.coachCareer?.loans)||[]).find(l=>l.playerId===p.id&&!l.returned);

  function filteredRoster(s,D){
    const club=D?.club?.(s,s.clubId),prefs=s.coachCareer?.offerPreferences||{};
    let rows=(club?.roster||[]).filter(p=>p&&p.id!=="hero");
    const needle=text(state.query.trim());
    if(needle)rows=rows.filter(p=>text(p.name).includes(needle));
    if(state.position!=="all")rows=rows.filter(p=>String(p.primaryPosition||p.pos||p.position||"").toUpperCase()===state.position);
    if(state.status!=="all")rows=rows.filter(p=>statusOf(prefs,p)===state.status);
    const value=p=>state.sort==="potential"?potential(D,p):state.sort==="age"?Number(p.age)||0:state.sort==="value"?marketValue(p):state.sort==="contract"?(remaining(s,p)??9999):overall(D,p);
    rows=rows.slice().sort((a,b)=>{const delta=value(a)-value(b);return (state.direction==="asc"?delta:-delta)||String(a.name||"").localeCompare(String(b.name||""),"pt-BR");});
    return rows;
  }

  function playerRow(s,D,p,prefs,selected){
    const status=statusOf(prefs,p),photo=portrait(p),offer=activeOffer(s,p),loan=activeLoan(s,p);
    return '<button type="button" class="csh-player-row'+(selected?' is-selected':'')+'" data-coach-squad-player="'+esc(p.id)+'" aria-pressed="'+selected+'">'+
      '<span class="csh-player-person">'+(photo?'<img src="'+esc(photo)+'" alt="">':'<i>'+esc(String(p.name||"?").charAt(0))+'</i>')+'<span><b>'+esc(p.name||"Jogador")+'</b><small>'+esc(p.primaryPosition||p.pos||p.position||"—")+' · '+esc(p.age??"—")+' anos</small></span></span>'+
      '<span class="csh-rating"><b>'+esc(overall(D,p))+'</b><small>GER</small></span><span class="csh-rating"><b>'+esc(potential(D,p))+'</b><small>POT</small></span>'+
      '<span><b>'+esc(money(marketValue(p)))+'</b><small>Valor</small></span><span><b>'+esc(remaining(s,p)===null?"Não informado":remaining(s,p)+" meses")+'</b><small>Contrato</small></span>'+
      '<span class="csh-status" data-status="'+esc(status)+'">'+esc(loan&&loan.fromClubId===s.clubId?"Emprestado":offer?(offer.dealType==="loan"?"Proposta de empréstimo":"Proposta recebida"):statusLabel[status])+'</span></button>';
  }

  function renewalForm(s,p){
    if(state.renewingPlayerId!==p.id)return "";
    const base=Math.max(1000,salary(p)||Number(root.ProLifeApp?.minimumMarketSalaryMonthly?.(p))||1000);
    return '<form class="csh-renewal" data-coach-renew-form="'+esc(p.id)+'"><div><small>RENOVAÇÃO DE CONTRATO</small><h4>Defina os novos termos</h4></div>'+
      '<label>Salário mensal<input type="number" min="1000" max="1000000000" step="1000" data-coach-renew-salary value="'+esc(base)+'"></label>'+
      '<label>Duração<select data-coach-renew-years>'+[1,2,3,4,5].map(y=>'<option value="'+y+'"'+(y===3?' selected':'')+'>'+y+' ano(s)</option>').join("")+'</select></label>'+
      '<label>Luvas<input type="number" min="0" max="10000000000" step="10000" data-coach-renew-bonus value="0"></label>'+
      '<label>Papel<select data-coach-renew-role>'+["Rotação","Importante","Titular","Estrela"].map(r=>'<option'+(r===roleLabel(p.squadRole)?' selected':'')+'>'+r+'</option>').join("")+'</select></label>'+
      '<div class="csh-renew-actions"><button type="button" data-coach-renew-confirm="'+esc(p.id)+'">Confirmar renovação</button><button type="button" data-coach-renew-cancel>Cancelar</button></div></form>';
  }

  // GER dinâmico: o GER base ajustado por forma, moral e condição física, como no FC 27.
  function dynamicOvr(D,p){
    const base=overall(D,p),n=v=>Number.isFinite(Number(v))?Number(v):null;
    const form=n(p.form),morale=n(p.morale),cond=n(p.condition??p.fitness);
    const fx=form==null?0:Math.max(-2,Math.min(2,(form-50)/25)),mx=morale==null?0:Math.max(-3,Math.min(2,(morale-60)/20)),cx=cond==null?0:Math.max(-5,Math.min(0,(cond-85)/10));
    const total=Math.round((fx+mx+cx)*10)/10;
    return {base,value:Math.max(1,Math.round(base+total)),delta:Math.round(total),parts:[["Forma",Math.round(fx*10)/10],["Moral",Math.round(mx*10)/10],["Condição",Math.round(cx*10)/10]]};
  }
  function dynamicPanel(D,p){
    const d=dynamicOvr(D,p),sign=v=>(v>0?"+":"")+v;
    const injury=p.injury?'<p class="csh-injury">Lesão: '+esc(p.injury.name||p.injury.type||"em recuperação")+(p.injury.daysLeft!=null?' · '+esc(p.injury.daysLeft)+' dia(s)':'')+'. Escalar o jogador lesionado aumenta o risco de piora.</p>':'';
    return '<section class="csh-dynamic"><small>GER DINÂMICO</small><div class="csh-dynamic-top"><b>'+esc(d.value)+'</b><span>base '+esc(d.base)+' · '+esc(sign(d.delta))+'</span></div><div class="csh-dynamic-parts">'+d.parts.map(([l,v])=>'<span class="'+(v<0?'is-neg':v>0?'is-pos':'')+'"><small>'+esc(l)+'</small><b>'+esc(sign(v))+'</b></span>').join("")+'</div>'+injury+'</section>';
  }

  function detail(s,D,p,prefs){
    if(!p)return '<aside class="csh-detail"><p>Selecione um jogador do elenco.</p></aside>';
    const photo=portrait(p),status=statusOf(prefs,p),offer=activeOffer(s,p),loan=activeLoan(s,p),months=remaining(s,p),cost=releaseCost(s,p);
    const stats=p.seasonStats||p.stats||{};
    return '<aside class="csh-detail'+(state.detailOpen?' is-open':'')+'"><button type="button" class="csh-detail-close" data-coach-squad-close aria-label="Fechar menu do jogador">Fechar</button><header>'+(photo?'<img src="'+esc(photo)+'" alt="Retrato de '+esc(p.name)+'">':'<i>'+esc(String(p.name||"?").charAt(0))+'</i>')+'<div><small>GESTÃO DO ATLETA</small><h3>'+esc(p.name||"Jogador")+'</h3><p>'+esc(p.primaryPosition||p.pos||p.position||"—")+' · '+esc(p.age??"—")+' anos · '+esc(p.nationality||p.nation||"Nacionalidade não informada")+'</p></div><strong>'+esc(overall(D,p))+'<small>GER</small></strong></header>'+
      '<div class="csh-detail-kpis"><span><small>Potencial</small><b>'+esc(potential(D,p))+'</b></span><span><small>Valor</small><b>'+esc(money(marketValue(p)))+'</b></span><span><small>Salário mensal</small><b>'+esc(money(salary(p)))+'</b><small>'+esc(money(root.ProLifePlayerEconomy?.weeklySalary?.(salary(p))||0))+'/semana</small></span><span><small>Contrato</small><b>'+esc(months===null?"Não informado":months+" meses")+'</b></span></div>'+
      '<div class="csh-detail-grid"><span><small>Papel</small><b>'+esc(roleLabel(p.squadRole||p.contract?.role))+'</b></span><span><small>Forma</small><b>'+esc(p.form??"—")+'</b></span><span><small>Moral</small><b>'+esc(Math.round(Number(p.morale)||0))+'</b></span><span><small>Condição</small><b>'+esc(Math.round(Number(p.condition??p.fitness)||0))+'%</b></span><span><small>Jogos</small><b>'+esc(stats.appearances??p.appearances??"—")+'</b></span><span><small>Gols / assist.</small><b>'+esc(stats.goals??p.goals??0)+' / '+esc(stats.assists??p.assists??0)+'</b></span></div>'+
      dynamicPanel(D,p)+'<div class="csh-current-status"><small>STATUS NO MERCADO</small><b>'+esc(statusLabel[status])+'</b>'+(offer?'<span>'+esc(offer.dealType==="loan"?"Há proposta de empréstimo ativa.":"Há proposta de compra ativa.")+'</span>':'')+(loan?'<span>Empréstimo ativo até o dia '+esc(loan.dueDay)+'.</span>':'')+'</div>'+
      '<div class="csh-actions"><button type="button" data-coach-player-status="'+(status==="listed"?'available':'listed')+'" data-player="'+esc(p.id)+'">'+(status==="listed"?'Retirar da lista de transferências':'Colocar na lista de transferências')+'</button><button type="button" data-coach-player-status="'+(status==="loan_listed"?'available':'loan_listed')+'" data-player="'+esc(p.id)+'">'+(status==="loan_listed"?'Retirar da lista de empréstimos':'Colocar na lista de empréstimos')+'</button><button type="button" data-coach-player-status="'+(status==="blocked"?'available':'blocked')+'" data-player="'+esc(p.id)+'">'+(status==="blocked"?'Liberar ofertas':'Bloquear ofertas')+'</button><button type="button" data-coach-renew-open="'+esc(p.id)+'">Renovar contrato</button><button type="button" data-coach-player-offers="'+esc(p.id)+'"'+(offer?'':' disabled')+'>Abrir propostas</button><button type="button" data-coach-squad-lineup="'+esc(p.id)+'">Abrir elenco e tática</button><button type="button" class="danger" data-coach-player-release="'+esc(p.id)+'" data-cost="'+esc(cost)+'">Liberar jogador'+(cost?' · '+esc(money(cost)):'')+'</button></div>'+renewalForm(s,p)+'</aside>';
  }

  function filters(rows){
    const positions=[...new Set(rows.map(p=>String(p.primaryPosition||p.pos||p.position||"").toUpperCase()).filter(Boolean))].sort();
    const opt=(v,label,current)=>'<option value="'+esc(v)+'"'+(String(v)===String(current)?' selected':'')+'>'+esc(label)+'</option>';
    return '<div class="csh-filters"><label>Buscar<input type="search" data-coach-squad-query value="'+esc(state.query)+'" placeholder="Nome do jogador"></label><label>Posição<select data-coach-squad-position>'+opt("all","Todas",state.position)+positions.map(v=>opt(v,v,state.position)).join("")+'</select></label><label>Status<select data-coach-squad-status>'+opt("all","Todos",state.status)+Object.entries(statusLabel).map(([v,l])=>opt(v,l,state.status)).join("")+'</select></label><label>Ordenar<select data-coach-squad-sort>'+[["overall","GER"],["potential","Potencial"],["age","Idade"],["value","Valor"],["contract","Fim do contrato"]].map(([v,l])=>opt(v,l,state.sort)).join("")+'</select></label><label>Ordem<select data-coach-squad-direction>'+opt("desc","Maior para menor",state.direction)+opt("asc","Menor para maior",state.direction)+'</select></label><button type="button" data-coach-squad-apply>Aplicar filtros</button></div>';
  }


  // ===== Planilha do elenco: ordenar pelo cabeçalho e filtrar por coluna, sem botão de aplicar =====
  let lastCtx=null;
  const short=v=>{v=Number(v)||0;return v>=1e9?"R$ "+(v/1e9).toFixed(2).replace(".",",")+" bi":v>=1e6?"R$ "+(v/1e6).toFixed(1).replace(".",",")+" mi":v>=1e3?"R$ "+Math.round(v/1e3)+" mil":"R$ "+Math.round(v);};
  function num(str){
    const m=String(str).trim().toLowerCase().replace(/\s+/g,"").replace(",",".").match(/^(-?\d+(?:\.\d+)?)(bi|mi|m|mil|k)?$/);
    if(!m)return null;
    const mult={bi:1e9,mi:1e6,m:1e6,mil:1e3,k:1e3}[m[2]]||1;
    return Number(m[1])*mult;
  }
  // ">80", ">=80", "<23", "<=23", "=85", "85", "80-90", "80..90", "!85"; para valores aceita 10mi, 500mil.
  function numTest(expr){
    const e=String(expr||"").trim().toLowerCase();
    if(!e)return null;
    let m=e.match(/^(>=|<=|>|<|=|!=|!)\s*(.+)$/);
    if(m){const n=num(m[2]);if(n===null)return ()=>true;return v=>v!==null&&({">=":v>=n,"<=":v<=n,">":v>n,"<":v<n,"=":v===n,"!=":v!==n,"!":v!==n})[m[1]];}
    m=e.match(/^(.+?)(?:\.\.|-|–| a )(.+)$/);
    if(m){const a=num(m[1]),b=num(m[2]);if(a!==null&&b!==null)return v=>v!==null&&v>=Math.min(a,b)&&v<=Math.max(a,b);}
    const n=num(e);
    return n===null?()=>true:v=>v!==null&&v===n;
  }
  const COLS=[
    {k:"name",l:"Jogador",type:"text"},{k:"pos",l:"Pos.",type:"pos"},{k:"age",l:"Idade",type:"num"},{k:"ovr",l:"GER",type:"num"},{k:"pot",l:"POT",type:"num"},
    {k:"value",l:"Valor",type:"num"},{k:"salary",l:"Salário/mês",type:"num"},{k:"contract",l:"Contrato (meses)",type:"num"},{k:"status",l:"Status",type:"status"}
  ];
  function cells(s,D,p,prefs){
    const status=statusOf(prefs,p),offer=activeOffer(s,p),loan=activeLoan(s,p),months=remaining(s,p);
    const label=loan&&loan.fromClubId===s.clubId?"Emprestado":offer?(offer.dealType==="loan"?"Proposta de empréstimo":"Proposta recebida"):statusLabel[status];
    return {id:p.id,name:String(p.name||"Jogador"),pos:String(p.primaryPosition||p.pos||p.position||"—").toUpperCase(),age:Number.isFinite(Number(p.age))?Number(p.age):null,ovr:overall(D,p),pot:potential(D,p),
      value:marketValue(p),salary:salary(p),contract:months,status,label,photo:portrait(p)};
  }
  function sheetRows(s,D){
    const club=D?.club?.(s,s.clubId),prefs=s.coachCareer?.offerPreferences||{};
    const all=(club?.roster||[]).filter(p=>p&&p.id!=="hero").map(p=>cells(s,D,p,prefs));
    const f=state.cols,needle=text(String(f.name||"").trim());
    const tests={};["age","ovr","pot","value","salary","contract"].forEach(k=>{tests[k]=numTest(f[k]);});
    let rows=all.filter(r=>(!needle||text(r.name).includes(needle))&&(f.pos==="all"||r.pos===f.pos)&&(f.status==="all"||r.status===f.status)&&
      ["age","ovr","pot","value","salary","contract"].every(k=>!tests[k]||tests[k](r[k])));
    const k=state.sortKey,dir=state.sortDir==="asc"?1:-1;
    rows=rows.slice().sort((a,b)=>{
      if(k==="name"||k==="pos"||k==="status")return dir*String(k==="status"?a.label:a[k]).localeCompare(String(k==="status"?b.label:b[k]),"pt-BR");
      const av=a[k]===null?(dir===1?Infinity:-Infinity):a[k],bv=b[k]===null?(dir===1?Infinity:-Infinity):b[k];
      return (av-bv)*dir||a.name.localeCompare(b.name,"pt-BR");
    });
    return {all,rows};
  }
  function bodyHtml(rows,selectedId){
    if(!rows.length)return '<tr><td class="csh-sheet-empty" colspan="'+COLS.length+'">Nenhum jogador corresponde aos filtros. Limpe algum filtro acima.</td></tr>';
    return rows.map(r=>'<tr class="csh-sheet-row'+(r.id===selectedId?' is-selected':'')+'" data-coach-squad-player="'+esc(r.id)+'" tabindex="0">'+
      '<td class="csh-c-name">'+(r.photo?'<img src="'+esc(r.photo)+'" alt="">':'<i>'+esc(r.name.charAt(0))+'</i>')+'<b>'+esc(r.name)+'</b></td>'+
      '<td>'+esc(r.pos)+'</td><td class="n">'+esc(r.age??"—")+'</td><td class="n"><b>'+esc(r.ovr)+'</b></td><td class="n">'+esc(r.pot)+'</td>'+
      '<td class="n">'+esc(short(r.value))+'</td><td class="n">'+esc(short(r.salary))+'</td><td class="n">'+esc(r.contract===null?"—":r.contract)+'</td>'+
      '<td><span class="csh-status" data-status="'+esc(r.status)+'">'+esc(r.label)+'</span></td></tr>').join("");
  }
  function headHtml(all){
    const poss=[...new Set(all.map(r=>r.pos))].sort(),f=state.cols;
    const opt=(v,l,c)=>'<option value="'+esc(v)+'"'+(String(v)===String(c)?' selected':'')+'>'+esc(l)+'</option>';
    const sortRow='<tr class="csh-sheet-sort">'+COLS.map(c=>'<th scope="col"><button type="button" data-csh-sort="'+c.k+'" class="'+(state.sortKey===c.k?'is-sorted':'')+'">'+esc(c.l)+'<i aria-hidden="true">'+(state.sortKey===c.k?(state.sortDir==="asc"?"▲":"▼"):"⇅")+'</i></button></th>').join("")+'</tr>';
    const filterRow='<tr class="csh-sheet-filter">'+COLS.map(c=>{
      if(c.type==="pos")return '<th><select data-csh-f="pos" aria-label="Filtrar posição">'+opt("all","Todas",f.pos)+poss.map(v=>opt(v,v,f.pos)).join("")+'</select></th>';
      if(c.type==="status")return '<th><select data-csh-f="status" aria-label="Filtrar status">'+opt("all","Todos",f.status)+Object.entries(statusLabel).map(([v,l])=>opt(v,l,f.status)).join("")+'</select></th>';
      return '<th><input type="text" inputmode="'+(c.type==="num"?"text":"search")+'" data-csh-f="'+c.k+'" value="'+esc(f[c.k])+'" placeholder="'+(c.type==="num"?(c.k==="value"||c.k==="salary"?">10mi":c.k==="age"?"<23":c.k==="contract"?"<=12":">80"):"Buscar")+'" autocomplete="off" aria-label="Filtrar '+esc(c.l)+'"></th>';
    }).join("")+'</tr>';
    return '<thead>'+sortRow+filterRow+'</thead>';
  }
  function activeCount(){const f=state.cols;return Object.keys(f).filter(k=>f[k]&&f[k]!=="all").length;}
  function refreshSheet(){
    const w=typeof document!=="undefined"?document.querySelector(".csh-sheet-wrap"):null;
    if(!w||!lastCtx)return;
    const {s,D}=lastCtx,{all,rows}=sheetRows(s,D),tb=w.querySelector("tbody");
    if(tb)tb.innerHTML=bodyHtml(rows,state.selectedPlayerId);
    const c=document.querySelector("[data-csh-count]");if(c)c.textContent=rows.length+" de "+all.length+" jogadores";
    const clr=document.querySelector("[data-csh-clear]");if(clr)clr.hidden=!activeCount();
    w.querySelectorAll("[data-csh-sort]").forEach(b=>{const on=b.dataset.cshSort===state.sortKey;b.classList.toggle("is-sorted",on);const i=b.querySelector("i");if(i)i.textContent=on?(state.sortDir==="asc"?"▲":"▼"):"⇅";});
  }
  if(typeof document!=="undefined"&&!root.__cshSheetBound){
    root.__cshSheetBound=true;
    const onField=ev=>{const el=ev.target instanceof Element?ev.target.closest("[data-csh-f]"):null;if(!el)return;state.cols[el.dataset.cshF]=el.value;refreshSheet();};
    document.addEventListener("input",onField);document.addEventListener("change",onField);
    document.addEventListener("click",ev=>{
      const t=ev.target instanceof Element?ev.target:null;if(!t)return;
      const sb=t.closest("[data-csh-sort]");
      if(sb){const k=sb.dataset.cshSort;if(state.sortKey===k)state.sortDir=state.sortDir==="asc"?"desc":"asc";else{state.sortKey=k;state.sortDir=(k==="name"||k==="pos"||k==="status"||k==="age"||k==="contract")?"asc":"desc";}refreshSheet();return;}
      if(t.closest("[data-csh-clear]")){state.cols={name:"",pos:"all",age:"",ovr:"",pot:"",value:"",salary:"",contract:"",status:"all"};document.querySelectorAll(".csh-sheet [data-csh-f]").forEach(el=>{el.value=el.tagName==="SELECT"?"all":"";});refreshSheet();}
    });
    document.addEventListener("keydown",ev=>{if((ev.key==="Enter"||ev.key===" ")&&ev.target instanceof Element&&ev.target.matches(".csh-sheet-row")){ev.preventDefault();ev.target.click();}});
  }

  function render(s,D){
    const club=D?.club?.(s,s.clubId),all=(club?.roster||[]).filter(p=>p&&p.id!=="hero"),prefs=s.coachCareer?.offerPreferences||{};
    lastCtx={s,D};
    const {all:sheetAll,rows:sheetRowsList}=sheetRows(s,D);
    const rows=sheetRowsList.map(r=>all.find(p=>p.id===r.id)).filter(Boolean);
    let selected=all.find(p=>p.id===state.selectedPlayerId)||rows[0]||all[0]||null;
    state.selectedPlayerId=selected?.id||null;
    const listed=all.filter(p=>statusOf(prefs,p)==="listed").length,loanListed=all.filter(p=>statusOf(prefs,p)==="loan_listed").length,blocked=all.filter(p=>statusOf(prefs,p)==="blocked").length,expiring=all.filter(p=>(remaining(s,p)??999)>0&&(remaining(s,p)??999)<=12).length;
    return '<section class="csh-shell"><div class="csh-heading"><div><small>TRANSFER HUB · GESTÃO DO PLANTEL</small><h2>Meu elenco</h2><p>Selecione um atleta para administrar mercado, contrato e planejamento.</p></div><div class="csh-summary"><span><b>'+all.length+'</b> atletas</span><span><b>'+listed+'</b> à venda</span><span><b>'+loanListed+'</b> para empréstimo</span><span><b>'+expiring+'</b> contratos até 12 meses</span></div></div>'+'<div class="csh-layout"><div class="csh-list csh-sheet"><div class="csh-list-head"><b data-csh-count>'+sheetRowsList.length+' de '+sheetAll.length+' jogadores</b><span>'+blocked+' com ofertas bloqueadas <button type="button" class="csh-clear" data-csh-clear'+(activeCount()?'':' hidden')+'>Limpar filtros</button></span></div><div class="csh-sheet-wrap"><table class="csh-sheet-table">'+headHtml(sheetAll)+'<tbody>'+bodyHtml(sheetRowsList,selected?.id)+'</tbody></table></div></div>'+detail(s,D,selected,prefs)+'</div></section>';
  }

  function listSection(title,note,players,s,D,prefs){
    return '<section class="csh-list-card"><header><div><small>LISTA</small><h3>'+esc(title)+'</h3></div><b>'+players.length+'</b></header><p>'+esc(note)+'</p><div>'+ (players.length?players.map(p=>playerRow(s,D,p,prefs,false)).join(""):'<p class="csh-empty">Nenhum jogador nesta lista.</p>')+'</div></section>';
  }
  function renderLists(s,D){
    const club=D?.club?.(s,s.clubId),players=(club?.roster||[]).filter(p=>p&&p.id!=="hero"),prefs=s.coachCareer?.offerPreferences||{};
    const shortlist=(s.coachCareer?.shortlist||[]).length;
    return '<section class="csh-shell"><div class="csh-heading"><div><small>TRANSFER HUB</small><h2>Listas do mercado</h2><p>Visualize alvos e controle quais atletas podem sair do clube.</p></div><div class="csh-summary"><span><b>'+shortlist+'</b> alvos observados</span><button type="button" data-coach-market-area="observacao">Abrir lista de alvos</button></div></div><div class="csh-lists">'+listSection("Lista de transferências","Atletas disponibilizados para venda.",players.filter(p=>statusOf(prefs,p)==="listed"),s,D,prefs)+listSection("Lista de empréstimos","Atletas disponibilizados temporariamente.",players.filter(p=>statusOf(prefs,p)==="loan_listed"),s,D,prefs)+listSection("Ofertas bloqueadas","Atletas que não podem receber novas propostas.",players.filter(p=>statusOf(prefs,p)==="blocked"),s,D,prefs)+'</div></section>';
  }

  function renderOverview(s,D){
    const club=D?.club?.(s,s.clubId),players=(club?.roster||[]).filter(p=>p&&p.id!=="hero"),prefs=s.coachCareer?.offerPreferences||{},offers=(s.coachCareer?.saleOffers||[]).filter(o=>o.status==="awaiting_window"||(o.status==="pending"&&(!Number.isFinite(Number(o.expiresDay))||Number(o.expiresDay)>=Number(s.day)))),renewals=(s.coachCareer?.contractRenewals||[]).slice(-3).reverse();
    const listed=players.filter(p=>statusOf(prefs,p)==="listed").length,loanListed=players.filter(p=>statusOf(prefs,p)==="loan_listed").length;
    return '<section class="csh-shell"><div class="csh-heading"><div><small>PAINEL DO DIRETOR ESPORTIVO</small><h2>Visão geral do mercado</h2><p>Contratos, saídas e negociações do seu clube em um único lugar.</p></div></div><div class="csh-overview"><button data-coach-market-area="squad"><b>'+players.length+'</b><span>Meu elenco</span><small>Administrar jogadores e contratos</small></button><button data-coach-market-area="transferencias"><b>'+offers.length+'</b><span>Propostas recebidas</span><small>Responder negociações pendentes</small></button><button data-coach-market-area="lists"><b>'+listed+'</b><span>Lista de transferências</span><small>'+loanListed+' atleta(s) para empréstimo</small></button><button data-coach-market-area="observacao"><b>'+((s.coachCareer?.shortlist)||[]).length+'</b><span>Lista de alvos</span><small>Observar e contratar jogadores</small></button></div><section class="csh-list-card"><header><div><small>CONTRATOS</small><h3>Renovações recentes</h3></div></header>'+(renewals.length?renewals.map(r=>'<p><b>'+esc(r.playerName)+'</b> · '+esc(r.years)+' ano(s) · '+esc(money(r.salary))+'/mês</p>').join(""):'<p class="csh-empty">Nenhuma renovação registrada nesta carreira.</p>')+'</section></section>';
  }

  const api={state,render,renderLists,renderOverview,select:id=>{state.selectedPlayerId=String(id);state.renewingPlayerId=null;state.detailOpen=true;},closeDetail:()=>{state.detailOpen=false;},openRenewal:id=>{state.selectedPlayerId=String(id);state.renewingPlayerId=String(id);state.detailOpen=true;},closeRenewal:()=>{state.renewingPlayerId=null;},setFilters:filters=>{state.query=String(filters.query||"").slice(0,80);state.position=String(filters.position||"all");state.status=["all","available","listed","loan_listed","blocked"].includes(filters.status)?filters.status:"all";state.sort=["overall","potential","age","value","contract"].includes(filters.sort)?filters.sort:"overall";state.direction=filters.direction==="asc"?"asc":"desc";}};
  root.ProLifeCoachSquadHub=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
