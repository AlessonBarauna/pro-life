(function coachSquadHubModule(root){
  "use strict";

  const state={selectedPlayerId:null,query:"",position:"all",status:"all",sort:"overall",direction:"desc",renewingPlayerId:null};
  const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
  const text=value=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR");
  const money=value=>"R$ "+Math.max(0,Math.round(Number(value)||0)).toLocaleString("pt-BR");
  const overall=(D,p)=>Math.round(Number(p?.overall??p?.ovr??D?.overall?.(p))||0);
  const potential=(D,p)=>Math.max(overall(D,p),Math.min(99,Math.round(Number(p?.potential)||overall(D,p))));
  const salary=p=>Math.max(0,Math.round(Number(p?.salary??p?.monthlySalary??p?.wage)||0));
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
  const activeOffer=(s,p)=>((s.coachCareer?.saleOffers)||[]).find(o=>o.playerId===p.id&&(o.status==="pending"||o.status==="awaiting_window"));
  const activeLoan=(s,p)=>((s.coachCareer?.loans)||[]).find(l=>l.playerId===p.id&&!l.returned);

  function filteredRoster(s,D){
    const club=D?.club?.(s,s.clubId),prefs=s.coachCareer?.offerPreferences||{};
    let rows=(club?.roster||[]).filter(p=>p&&p.id!=="hero");
    const needle=text(state.query.trim());
    if(needle)rows=rows.filter(p=>text(p.name).includes(needle));
    if(state.position!=="all")rows=rows.filter(p=>String(p.primaryPosition||p.pos||p.position||"").toUpperCase()===state.position);
    if(state.status!=="all")rows=rows.filter(p=>statusOf(prefs,p)===state.status);
    const value=p=>state.sort==="potential"?potential(D,p):state.sort==="age"?Number(p.age)||0:state.sort==="value"?Number(root.ProLifeApp?.valuation?.(p))||0:state.sort==="contract"?(remaining(s,p)??9999):overall(D,p);
    rows=rows.slice().sort((a,b)=>{const delta=value(a)-value(b);return (state.direction==="asc"?delta:-delta)||String(a.name||"").localeCompare(String(b.name||""),"pt-BR");});
    return rows;
  }

  function playerRow(s,D,p,prefs,selected){
    const status=statusOf(prefs,p),photo=portrait(p),offer=activeOffer(s,p),loan=activeLoan(s,p);
    return '<button type="button" class="csh-player-row'+(selected?' is-selected':'')+'" data-coach-squad-player="'+esc(p.id)+'" aria-pressed="'+selected+'">'+
      '<span class="csh-player-person">'+(photo?'<img src="'+esc(photo)+'" alt="">':'<i>'+esc(String(p.name||"?").charAt(0))+'</i>')+'<span><b>'+esc(p.name||"Jogador")+'</b><small>'+esc(p.primaryPosition||p.pos||p.position||"—")+' · '+esc(p.age??"—")+' anos</small></span></span>'+
      '<span class="csh-rating"><b>'+esc(overall(D,p))+'</b><small>GER</small></span><span class="csh-rating"><b>'+esc(potential(D,p))+'</b><small>POT</small></span>'+
      '<span><b>'+esc(money(root.ProLifeApp?.valuation?.(p)))+'</b><small>Valor</small></span><span><b>'+esc(remaining(s,p)===null?"Não informado":remaining(s,p)+" meses")+'</b><small>Contrato</small></span>'+
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

  function detail(s,D,p,prefs){
    if(!p)return '<aside class="csh-detail"><p>Selecione um jogador do elenco.</p></aside>';
    const photo=portrait(p),status=statusOf(prefs,p),offer=activeOffer(s,p),loan=activeLoan(s,p),months=remaining(s,p),cost=releaseCost(s,p);
    const stats=p.seasonStats||p.stats||{};
    return '<aside class="csh-detail"><header>'+(photo?'<img src="'+esc(photo)+'" alt="Retrato de '+esc(p.name)+'">':'<i>'+esc(String(p.name||"?").charAt(0))+'</i>')+'<div><small>GESTÃO DO ATLETA</small><h3>'+esc(p.name||"Jogador")+'</h3><p>'+esc(p.primaryPosition||p.pos||p.position||"—")+' · '+esc(p.age??"—")+' anos · '+esc(p.nationality||p.nation||"Nacionalidade não informada")+'</p></div><strong>'+esc(overall(D,p))+'<small>GER</small></strong></header>'+
      '<div class="csh-detail-kpis"><span><small>Potencial</small><b>'+esc(potential(D,p))+'</b></span><span><small>Valor</small><b>'+esc(money(root.ProLifeApp?.valuation?.(p)))+'</b></span><span><small>Salário</small><b>'+esc(salary(p)?money(salary(p))+"/mês":"Estimado")+'</b></span><span><small>Contrato</small><b>'+esc(months===null?"Não informado":months+" meses")+'</b></span></div>'+
      '<div class="csh-detail-grid"><span><small>Papel</small><b>'+esc(roleLabel(p.squadRole||p.contract?.role))+'</b></span><span><small>Forma</small><b>'+esc(p.form??"—")+'</b></span><span><small>Moral</small><b>'+esc(Math.round(Number(p.morale)||0))+'</b></span><span><small>Condição</small><b>'+esc(Math.round(Number(p.condition??p.fitness)||0))+'%</b></span><span><small>Jogos</small><b>'+esc(stats.appearances??p.appearances??"—")+'</b></span><span><small>Gols / assist.</small><b>'+esc(stats.goals??p.goals??0)+' / '+esc(stats.assists??p.assists??0)+'</b></span></div>'+
      '<div class="csh-current-status"><small>STATUS NO MERCADO</small><b>'+esc(statusLabel[status])+'</b>'+(offer?'<span>'+esc(offer.dealType==="loan"?"Há proposta de empréstimo ativa.":"Há proposta de compra ativa.")+'</span>':'')+(loan?'<span>Empréstimo ativo até o dia '+esc(loan.dueDay)+'.</span>':'')+'</div>'+
      '<div class="csh-actions"><button type="button" data-coach-player-status="'+(status==="listed"?'available':'listed')+'" data-player="'+esc(p.id)+'">'+(status==="listed"?'Retirar da lista de transferências':'Colocar na lista de transferências')+'</button><button type="button" data-coach-player-status="'+(status==="loan_listed"?'available':'loan_listed')+'" data-player="'+esc(p.id)+'">'+(status==="loan_listed"?'Retirar da lista de empréstimos':'Colocar na lista de empréstimos')+'</button><button type="button" data-coach-player-status="'+(status==="blocked"?'available':'blocked')+'" data-player="'+esc(p.id)+'">'+(status==="blocked"?'Liberar ofertas':'Bloquear ofertas')+'</button><button type="button" data-coach-renew-open="'+esc(p.id)+'">Renovar contrato</button><button type="button" data-coach-player-offers="'+esc(p.id)+'"'+(offer?'':' disabled')+'>Abrir propostas</button><button type="button" data-coach-squad-lineup="'+esc(p.id)+'">Abrir elenco e tática</button><button type="button" class="danger" data-coach-player-release="'+esc(p.id)+'" data-cost="'+esc(cost)+'">Liberar jogador'+(cost?' · '+esc(money(cost)):'')+'</button></div>'+renewalForm(s,p)+'</aside>';
  }

  function filters(rows){
    const positions=[...new Set(rows.map(p=>String(p.primaryPosition||p.pos||p.position||"").toUpperCase()).filter(Boolean))].sort();
    const opt=(v,label,current)=>'<option value="'+esc(v)+'"'+(String(v)===String(current)?' selected':'')+'>'+esc(label)+'</option>';
    return '<div class="csh-filters"><label>Buscar<input type="search" data-coach-squad-query value="'+esc(state.query)+'" placeholder="Nome do jogador"></label><label>Posição<select data-coach-squad-position>'+opt("all","Todas",state.position)+positions.map(v=>opt(v,v,state.position)).join("")+'</select></label><label>Status<select data-coach-squad-status>'+opt("all","Todos",state.status)+Object.entries(statusLabel).map(([v,l])=>opt(v,l,state.status)).join("")+'</select></label><label>Ordenar<select data-coach-squad-sort>'+[["overall","GER"],["potential","Potencial"],["age","Idade"],["value","Valor"],["contract","Fim do contrato"]].map(([v,l])=>opt(v,l,state.sort)).join("")+'</select></label><label>Ordem<select data-coach-squad-direction>'+opt("desc","Maior para menor",state.direction)+opt("asc","Menor para maior",state.direction)+'</select></label><button type="button" data-coach-squad-apply>Aplicar filtros</button></div>';
  }

  function render(s,D){
    const club=D?.club?.(s,s.clubId),all=(club?.roster||[]).filter(p=>p&&p.id!=="hero"),prefs=s.coachCareer?.offerPreferences||{};
    const rows=filteredRoster(s,D);
    let selected=all.find(p=>p.id===state.selectedPlayerId)||rows[0]||all[0]||null;
    state.selectedPlayerId=selected?.id||null;
    const listed=all.filter(p=>statusOf(prefs,p)==="listed").length,loanListed=all.filter(p=>statusOf(prefs,p)==="loan_listed").length,blocked=all.filter(p=>statusOf(prefs,p)==="blocked").length,expiring=all.filter(p=>(remaining(s,p)??999)>0&&(remaining(s,p)??999)<=12).length;
    return '<section class="csh-shell"><div class="csh-heading"><div><small>TRANSFER HUB · GESTÃO DO PLANTEL</small><h2>Meu elenco</h2><p>Selecione um atleta para administrar mercado, contrato e planejamento.</p></div><div class="csh-summary"><span><b>'+all.length+'</b> atletas</span><span><b>'+listed+'</b> à venda</span><span><b>'+loanListed+'</b> para empréstimo</span><span><b>'+expiring+'</b> contratos até 12 meses</span></div></div>'+filters(all)+'<div class="csh-layout"><div class="csh-list"><div class="csh-list-head"><b>'+rows.length+' jogadores</b><span>'+blocked+' com ofertas bloqueadas</span></div>'+(rows.length?rows.map(p=>playerRow(s,D,p,prefs,p.id===selected?.id)).join(""):'<p class="csh-empty">Nenhum jogador corresponde aos filtros.</p>')+'</div>'+detail(s,D,selected,prefs)+'</div></section>';
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
    const club=D?.club?.(s,s.clubId),players=(club?.roster||[]).filter(p=>p&&p.id!=="hero"),prefs=s.coachCareer?.offerPreferences||{},offers=(s.coachCareer?.saleOffers||[]).filter(o=>o.status==="pending"||o.status==="awaiting_window"),renewals=(s.coachCareer?.contractRenewals||[]).slice(-3).reverse();
    const listed=players.filter(p=>statusOf(prefs,p)==="listed").length,loanListed=players.filter(p=>statusOf(prefs,p)==="loan_listed").length;
    return '<section class="csh-shell"><div class="csh-heading"><div><small>PAINEL DO DIRETOR ESPORTIVO</small><h2>Visão geral do mercado</h2><p>Contratos, saídas e negociações do seu clube em um único lugar.</p></div></div><div class="csh-overview"><button data-coach-market-area="squad"><b>'+players.length+'</b><span>Meu elenco</span><small>Administrar jogadores e contratos</small></button><button data-coach-market-area="transferencias"><b>'+offers.length+'</b><span>Propostas recebidas</span><small>Responder negociações pendentes</small></button><button data-coach-market-area="lists"><b>'+listed+'</b><span>Lista de transferências</span><small>'+loanListed+' atleta(s) para empréstimo</small></button><button data-coach-market-area="observacao"><b>'+((s.coachCareer?.shortlist)||[]).length+'</b><span>Lista de alvos</span><small>Observar e contratar jogadores</small></button></div><section class="csh-list-card"><header><div><small>CONTRATOS</small><h3>Renovações recentes</h3></div></header>'+(renewals.length?renewals.map(r=>'<p><b>'+esc(r.playerName)+'</b> · '+esc(r.years)+' ano(s) · '+esc(money(r.salary))+'/mês</p>').join(""):'<p class="csh-empty">Nenhuma renovação registrada nesta carreira.</p>')+'</section></section>';
  }

  const api={state,render,renderLists,renderOverview,select:id=>{state.selectedPlayerId=String(id);state.renewingPlayerId=null;},openRenewal:id=>{state.selectedPlayerId=String(id);state.renewingPlayerId=String(id);},closeRenewal:()=>{state.renewingPlayerId=null;},setFilters:filters=>{state.query=String(filters.query||"").slice(0,80);state.position=String(filters.position||"all");state.status=["all","available","listed","loan_listed","blocked"].includes(filters.status)?filters.status:"all";state.sort=["overall","potential","age","value","contract"].includes(filters.sort)?filters.sort:"overall";state.direction=filters.direction==="asc"?"asc":"desc";}};
  root.ProLifeCoachSquadHub=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
