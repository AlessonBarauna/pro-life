(function worldLiveMarketViewModule(root){
  "use strict";

  const TABS=[
    {id:"rumors",label:"Rumores",states:["rumor","scouting"]},
    {id:"negotiations",label:"Negociações",states:["negotiating"]},
    {id:"offers",label:"Propostas",states:["offer"]},
    {id:"completed",label:"Concluídas",states:["completed"]},
    {id:"history",label:"Histórico",states:["completed","rejected","cancelled"]},
  ];
  const ACTIVE=new Set(["rumor","scouting","negotiating","offer"]);

  function esc(value){
    return String(value??"").replace(/[&<>"']/g,char=>({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    })[char]);
  }

  function finite(value){
    const number=Number(value);
    return Number.isFinite(number)?number:null;
  }

  function money(value){
    const number=finite(value);
    return number===null?"—":`R$ ${Math.round(number).toLocaleString("pt-BR")}`;
  }

  function catalogs(s){
    const leagues=new Map();
    for(const league of [...(s?.leagues||[]),...(s?.globalFootball?.leagues||[])]){
      if(league?.id&&!leagues.has(league.id)) leagues.set(league.id,league);
    }
    const clubs=new Map();
    for(const club of [...(s?.clubs||[]),...(s?.globalFootball?.clubs||[])]){
      if(!club?.id||clubs.has(club.id)) continue;
      const league=leagues.get(club.leagueId);
      clubs.set(club.id,{
        id:club.id,
        name:club.name||club.shortName||club.id,
        country:club.country||league?.country||(String(club.id).startsWith("c")?"Brasil":"—"),
        leagueId:club.leagueId||"",
        leagueName:league?.name||club.leagueName||club.leagueId||"—",
      });
    }
    const players=new Map();
    const add=player=>{
      if(player?.id&&!players.has(player.id)) players.set(player.id,player);
    };
    for(const club of s?.clubs||[]) for(const player of club.roster||[]) add(player);
    for(const player of s?.internationalPlayers||[]) add(player);
    add(s?.person);
    return {clubs,players};
  }

  function statusOf(deal){
    if(deal.executionStatus==="executed") return {label:"Transferência efetivada",kind:"executed"};
    if(deal.executionStatus==="cancelled") return {label:"Acordo cancelado",kind:"cancelled"};
    return ({
      rumor:{label:"Rumor",kind:"rumor"},
      scouting:{label:"Observação",kind:"scouting"},
      negotiating:{label:"Negociação",kind:"negotiating"},
      offer:{label:"Proposta",kind:"offer"},
      completed:{label:"Acordo concluído",kind:"agreement"},
      rejected:{label:"Rejeitada",kind:"rejected"},
      cancelled:{label:"Cancelada",kind:"cancelled"},
    })[deal.state]||{label:String(deal.state||"Sem status"),kind:"unknown"};
  }

  function playerOverall(player){
    const direct=finite(player?.ovr??player?.overall);
    if(direct!==null) return Math.round(direct);
    const values=Object.values(player?.attrs||{}).map(finite).filter(value=>value!==null);
    return values.length?Math.round(values.reduce((sum,value)=>sum+value,0)/values.length):null;
  }

  function snapshot(s,D,options={}){
    void D;
    const market=s?.worldLiveMarket;
    const source=Array.isArray(market?.deals)?market.deals:[];
    const {clubs,players}=catalogs(s);
    const tab=TABS.find(item=>item.id===options.tab)||TABS[0];
    const country=String(options.country||"ALL");
    const league=String(options.league||"ALL");
    const club=String(options.club||"ALL");
    const period=String(options.period||"ALL");
    const periodDays=period==="ALL"?null:finite(period);
    const currentDay=finite(s?.day)??0;
    const legacyItems=(Array.isArray(s?.universe?.transfers)?s.universe.transfers:[])
      .filter(row=>row&&row.type!=="release")
      .map(row=>{
        const from=clubs.get(row.fromId)||{id:row.fromId||"free",name:row.from||"Sem clube",country:"Brasil",leagueId:"",leagueName:"?"};
        const to=clubs.get(row.toId)||{id:row.toId||"",name:row.to||"?",country:"Brasil",leagueId:"",leagueName:"?"};
        const day=Number(row.day)||0;
        const deal={
          id:"world2:"+[row.season,day,row.id,row.toId].join(":"),
          playerId:row.id,fromClubId:row.fromId,toClubId:row.toId,
          value:Number(row.fee)||0,salary:null,
          state:"completed",executionStatus:"executed",
          startDay:day,updatedDay:day,executedDay:day,source:"world2"
        };
        return {deal,player:{name:row.name,pos:row.pos,age:row.age,ovr:row.ovr},
          from,to,overall:Number(row.ovr)||null,
          status:{label:row.type==="free"?"Contrata\u00e7\u00e3o de jogador livre":"Transfer\u00eancia efetivada",kind:"executed"}};
      });
    const enriched=source.map(deal=>{
      const player=players.get(deal.playerId)||null;
      const from=clubs.get(deal.fromClubId)||{id:deal.fromClubId,name:deal.fromClubId||"—",country:"—",leagueId:"",leagueName:"—"};
      const to=clubs.get(deal.toClubId)||{id:deal.toClubId,name:deal.toClubId||"—",country:"—",leagueId:"",leagueName:"—"};
      return {
        deal,
        player,
        from,
        to,
        overall:playerOverall(player),
        status:statusOf(deal),
      };
    });
    enriched.push(...legacyItems);
    const countries=[...new Set(enriched.map(item=>item.to.country).filter(value=>value&&value!=="—"))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
    const leagueOptions=[];
    const seenLeagues=new Set();
    for(const item of enriched){
      if(!item.to.leagueId||seenLeagues.has(item.to.leagueId)) continue;
      seenLeagues.add(item.to.leagueId);
      leagueOptions.push({id:item.to.leagueId,name:item.to.leagueName,country:item.to.country});
    }
    const clubOptions=[...new Map(enriched.flatMap(item=>[[item.from.id,item.from],[item.to.id,item.to]]).filter(([id])=>id)).values()]
      .sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
    const visible=enriched.filter(item=>
      (tab.states.includes(item.deal.state)||(tab.id==="history"&&item.deal.state==="completed"))&&
      (tab.id!=="completed"||item.deal.executionStatus==="executed")&&
      (country==="ALL"||item.to.country===country)&&
      (league==="ALL"||item.to.leagueId===league)&&
      (club==="ALL"||item.from.id===club||item.to.id===club)&&
      (periodDays===null||periodDays<0||currentDay-Number(item.deal.startDay||0)<=periodDays)
    ).sort((a,b)=>Number(b.deal.updatedDay||b.deal.startDay||0)-Number(a.deal.updatedDay||a.deal.startDay||0));
    const visibleIds=new Set(visible.map(item=>item.deal.id));
    const events=(Array.isArray(market?.events)?market.events:[])
      .filter(event=>!visibleIds.size||visibleIds.has(event.dealId))
      .slice()
      .sort((a,b)=>Number(b.day||0)-Number(a.day||0))
      .slice(0,20);
    return {
      tab,
      tabs:TABS,
      deals:enriched,
      visible,
      events,
      countries,
      leagues:leagueOptions,
      clubs:clubOptions,
      filters:{country,league,club,period},
      indicators:{
        active:source.filter(deal=>ACTIVE.has(deal.state)).length,
        agreements:source.filter(deal=>deal.state==="completed").length,
        executed:source.filter(deal=>deal.executionStatus==="executed").length+legacyItems.length,
      },
    };
  }

  function renderCard(item){
    const {deal,player,from,to,status}=item;
    const age=finite(player?.age);
    return `<article class="world-market-deal status-${esc(status.kind)}" data-world-market-deal="${esc(deal.id)}">
      <header><div><small>${esc(status.label)}</small><h3>${esc(player?.name||"Jogador indisponível")}</h3><p>${esc(player?.pos||"—")} · ${age===null?"—":Math.round(age)+" anos"}</p></div><span class="world-market-ovr"><small>GER</small><b>${item.overall===null?"—":item.overall}</b></span></header>
      <div class="world-market-route"><span><small>ORIGEM</small><b>${esc(from.name)}</b><em>${esc(from.country)} · ${esc(from.leagueName)}</em></span><i>→</i><span><small>DESTINO</small><b>${esc(to.name)}</b><em>${esc(to.country)} · ${esc(to.leagueName)}</em></span></div>
      <footer><span><small>VALOR</small><b>${esc(money(deal.value))}</b></span><span><small>SALÁRIO</small><b>${esc(money(deal.salary))}</b></span><span><small>ATUALIZAÇÃO</small><b>Dia ${finite(deal.updatedDay)??finite(deal.startDay)??0}</b></span></footer>
      ${deal.state==="completed"?`<div class="world-market-resolution ${deal.executionStatus==="executed"?"executed":"agreement"}">${deal.executionStatus==="executed"?`Transferência efetivada no dia ${finite(deal.executedDay)??"—"}`:deal.executionStatus==="cancelled"?`Execução cancelada no dia ${finite(deal.cancelledDay)??"—"}`:"Acordo fechado; transferência ainda não efetivada."}</div>`:""}
    </article>`;
  }

  function renderTimeline(data){
    if(!data.events.length) return `<div class="world-market-empty">Ainda não há eventos para estas negociações.</div>`;
    const deals=new Map(data.deals.map(item=>[item.deal.id,item]));
    return `<div class="world-market-timeline">${data.events.map(event=>{
      const item=deals.get(event.dealId);
      const label=event.type==="transfer-executed"?"Transferência efetivada":event.type==="transfer-cancelled"?"Execução cancelada":statusOf({state:event.state}).label;
      return `<article><span>Dia ${finite(event.day)??0}</span><div><b>${esc(label)}</b><small>${esc(item?.player?.name||event.playerId||event.dealId||"Negociação")}${item?` · ${esc(item.from.name)} → ${esc(item.to.name)}`:""}</small></div></article>`;
    }).join("")}</div>`;
  }

  function render(s,D,options={}){
    const data=snapshot(s,D,options);
    return `<section class="world-live-market-view world-live-market-dark" data-world-live-market-view>
      ${styles()}
      <header class="world-market-head"><div><small>CENTRAL DO MERCADO MUNDIAL</small><h2>Transferências globais</h2><p>Rumores, acordos e operações registrados pelo universo da carreira.</p></div><div class="world-market-indicators"><span><b>${data.indicators.active}</b><small>ATIVAS</small></span><span><b>${data.indicators.agreements}</b><small>ACORDOS</small></span><span><b>${data.indicators.executed}</b><small>EFETIVADAS</small></span></div></header>
      <nav class="world-market-tabs" aria-label="Etapas do mercado">${data.tabs.map(tab=>`<button type="button" data-world-market-tab="${esc(tab.id)}" class="${tab.id===data.tab.id?"active":""}">${esc(tab.label)}</button>`).join("")}</nav>
      <div class="world-market-filters">
        <label>País<select data-world-market-country><option value="ALL">Todos</option>${data.countries.map(value=>`<option value="${esc(value)}" ${value===data.filters.country?"selected":""}>${esc(value)}</option>`).join("")}</select></label>
        <label>Liga<select data-world-market-league><option value="ALL">Todas</option>${data.leagues.map(item=>`<option value="${esc(item.id)}" ${item.id===data.filters.league?"selected":""}>${esc(item.name)}</option>`).join("")}</select></label>
        <label>Clube<select data-world-market-club><option value="ALL">Todos</option>${data.clubs.map(item=>`<option value="${esc(item.id)}" ${item.id===data.filters.club?"selected":""}>${esc(item.name)}</option>`).join("")}</select></label>
        <label>Período<select data-world-market-period>${[["ALL","Todo o período"],["30","30 dias"],["90","90 dias"],["365","1 temporada"]].map(([value,label])=>`<option value="${value}" ${value===data.filters.period?"selected":""}>${label}</option>`).join("")}</select></label>
      </div>
      <div class="world-market-layout"><main><div class="world-market-section-title"><div><small>${esc(data.tab.label.toUpperCase())}</small><h3>${data.visible.length} ${data.visible.length===1?"negociação":"negociações"}</h3></div></div><div class="world-market-cards">${data.visible.map(renderCard).join("")||`<div class="world-market-empty"><b>Nenhuma negociação nesta etapa</b><span>Os dados aparecerão quando o mercado mundial registrar movimentações reais.</span></div>`}</div></main><aside><div class="world-market-section-title"><div><small>LINHA DO TEMPO</small><h3>Eventos recentes</h3></div></div>${renderTimeline(data)}</aside></div>
    </section>`;
  }

  function styles(){
    return `<style data-world-live-market-style>
      .world-live-market-dark{--wm-bg:#081119;--wm-card:#111d27;--wm-line:rgba(255,255,255,.08);--wm-text:#f4f6f7;--wm-muted:#8e9ba5;--wm-gold:#d6b25b;display:block;padding:24px;border-radius:18px;background:radial-gradient(circle at 5% 0,rgba(214,178,91,.12),transparent 30%),var(--wm-bg);color:var(--wm-text)}.world-market-head{display:flex;justify-content:space-between;align-items:flex-end;gap:18px}.world-market-head h2{margin:5px 0;font-size:clamp(28px,4vw,46px)}.world-market-head p,.world-market-head small,.world-market-section-title small{color:var(--wm-muted)}.world-market-indicators{display:flex;gap:8px}.world-market-indicators span{min-width:74px;padding:10px;border:1px solid var(--wm-line);border-radius:10px;background:rgba(255,255,255,.03);text-align:center}.world-market-indicators b,.world-market-indicators small{display:block}.world-market-indicators b{font-size:22px;color:var(--wm-gold)}.world-market-tabs{display:flex;gap:6px;overflow:auto;padding:18px 0}.world-market-tabs button{white-space:nowrap;border:1px solid var(--wm-line);border-radius:999px;padding:9px 14px;background:#0d1720;color:var(--wm-muted)}.world-market-tabs button.active{background:var(--wm-gold);border-color:var(--wm-gold);color:#111;font-weight:900}.world-market-filters{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px}.world-market-filters label{display:grid;gap:5px;color:var(--wm-muted);font-size:10px}.world-market-filters select{min-width:0;padding:9px;border:1px solid var(--wm-line);border-radius:8px;background:#111d27;color:var(--wm-text)}.world-market-layout{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(280px,.75fr);gap:14px}.world-market-layout>main,.world-market-layout>aside{padding:18px;border:1px solid var(--wm-line);border-radius:14px;background:rgba(17,29,39,.92)}.world-market-section-title h3{margin:4px 0 14px}.world-market-cards{display:grid;gap:8px}.world-market-deal{padding:14px;border:1px solid var(--wm-line);border-radius:11px;background:rgba(255,255,255,.025)}.world-market-deal>header{display:flex;justify-content:space-between;gap:12px}.world-market-deal h3{margin:3px 0}.world-market-deal p,.world-market-deal small,.world-market-route em{color:var(--wm-muted);font-size:10px;font-style:normal}.world-market-deal>header>div>small{color:var(--wm-gold);font-weight:900}.world-market-ovr{display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:#1b2a35}.world-market-ovr b{font-size:19px}.world-market-route{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;margin:12px 0;padding:11px;background:rgba(255,255,255,.025);border-radius:8px}.world-market-route span{display:grid}.world-market-route span:last-child{text-align:right}.world-market-route i{color:var(--wm-gold)}.world-market-deal footer{display:flex;gap:18px;flex-wrap:wrap}.world-market-deal footer span{display:grid}.world-market-resolution{margin-top:10px;padding:8px;border-radius:7px;background:rgba(214,178,91,.09);color:var(--wm-gold);font-size:10px}.world-market-resolution.executed{background:rgba(85,198,137,.1);color:#72d49a}.world-market-timeline{display:grid;gap:4px}.world-market-timeline article{display:grid;grid-template-columns:55px 1fr;gap:9px;padding:9px;border-left:2px solid var(--wm-gold);background:rgba(255,255,255,.025)}.world-market-timeline article>span,.world-market-timeline small{color:var(--wm-muted);font-size:9px}.world-market-timeline div{display:grid}.world-market-empty{display:grid;gap:5px;padding:35px 12px;text-align:center;color:var(--wm-muted)}
      @media(max-width:900px){.world-market-head{align-items:flex-start;flex-direction:column}.world-market-layout{grid-template-columns:1fr}.world-market-filters{grid-template-columns:1fr 1fr}}@media(max-width:560px){.world-live-market-dark{padding:14px}.world-market-filters{grid-template-columns:1fr}.world-market-indicators{width:100%;overflow:auto}.world-market-route{grid-template-columns:1fr}.world-market-route i{transform:rotate(90deg);text-align:center}.world-market-route span:last-child{text-align:left}}
    </style>`;
  }

  const api={snapshot,render,esc};
  root.ProLifeWorldLiveMarketView=api;
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
