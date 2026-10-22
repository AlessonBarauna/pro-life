(function(root){
  "use strict";
  // 34F.32A - Infraestrutura continental: associacoes, vagas por merito, edicoes persistidas e calendario sem conflito.
  // Nao simula partidas (isso entra nas subetapas B..G). Nenhum clube e inventado; o manifesto nao e alterado.
  const VERSION=1;
  const ADAPTED="Distribuição de vagas adaptada do PRO-LIFE (não é a tabela oficial de coeficientes).";
  const COMPS={
    ucl:{id:"ucl",name:"UEFA Champions League",conf:"UEFA",size:36,leaguePhaseMatches:8,tier:1,note:"36 clubes, fase de liga com 8 jogos, playoffs (9º–24º), oitavas a semifinais em ida e volta e final única."},
    uel:{id:"uel",name:"UEFA Europa League",conf:"UEFA",size:36,leaguePhaseMatches:8,tier:2,note:"36 clubes, 8 jogos na fase de liga, playoffs, mata-mata e final."},
    uecl:{id:"uecl",name:"UEFA Conference League",conf:"UEFA",size:36,leaguePhaseMatches:6,tier:3,note:"36 clubes, 6 jogos na fase de liga, playoffs, mata-mata e final."},
    lib:{id:"lib",name:"CONMEBOL Libertadores",conf:"CONMEBOL",size:32,groupMatches:6,tier:1,note:"32 clubes em 8 grupos de 4; 2 melhores avançam; oitavas a semifinal em ida e volta; final única."},
    sud:{id:"sud",name:"CONMEBOL Sudamericana",conf:"CONMEBOL",size:32,groupMatches:6,tier:2,note:"32 clubes em 8 grupos; líderes às oitavas, segundos nos playoffs com terceiros da Libertadores."}
  };
  const PLANNED=[
    {id:"usc",name:"Supercopa da UEFA",conf:"UEFA",step:"32D",reason:"Depende dos campeões da Champions e da Europa League."},
    {id:"recopa",name:"Recopa Sul-Americana",conf:"CONMEBOL",step:"32G",reason:"Depende dos campeões de Libertadores e Sul-Americana."},
    {id:"ylg",name:"UEFA Youth League",conf:"UEFA",step:"32H",reason:"Exige categorias de base elegíveis por idade; não será simulada com adultos."}
  ];
  const UEFA_ORDER="ENG ESP ITA GER FRA POR NED BEL TUR SCO AUT SUI GRE DEN NOR SWE CZE POL CRO SRB UKR ROU HUN IRL FIN ISL".split(" ");
  const CONMEBOL_ORDER="BRA ARG COL CHI ECU URU PAR PER BOL VEN".split(" ");
  const LIB_QUOTA={BRA:6,ARG:6,COL:3,CHI:3,ECU:3,URU:3,PAR:3,PER:2,BOL:2,VEN:1};
  const SUD_QUOTA={BRA:6,ARG:6,COL:3,CHI:3,ECU:3,URU:3,PAR:2,PER:2,BOL:2,VEN:1};
  const uefaQuota=(rank,comp)=>comp==="ucl"?(rank<=4?4:rank<=8?2:rank<=20?1:0):comp==="uel"?(rank<=8?3:rank<=20?1:0):(rank<=8?1:rank<=20?2:rank<=24?1:0);
  const MIN_ADAPTED=16,WINDOW_SPAN=3;
  const NI=()=>root.ProLifeNationalIdentity||(typeof require==="function"?require("./national-identity.js"):null);
  const GFb=()=>root.ProLifeGlobalFootball||(root.ProLife&&root.ProLife.GlobalFootball)||(typeof require==="function"?require("./global-football.js"):null);
  const WCC=()=>root.ProLifeWorldClubCompetitions||(root.ProLife&&root.ProLife.WorldClubCompetitions)||(typeof require==="function"?require("./world-club-competitions.js"):null);
  const EnglishCups=()=>root.ProLifeEnglishCups||(typeof require==="function"?require("./english-cups.js"):null);
  const FIRST=10,LAST=340;

  function state(s){
    if(!s.continental||typeof s.continental!=="object")s.continental={v:VERSION,finals:{},editions:{}};
    const c=s.continental;c.v=VERSION;if(!c.finals)c.finals={};if(!c.editions)c.editions={};return c;
  }
  const prestige=(s,id)=>{const g=GFb();try{return Number(g.clubPrestige(s,id))||0;}catch(e){return 0;}};
  const clubOf=(s,id)=>(s.clubs||[]).find(c=>c.id===id)||(s.globalFootball?.clubs||[]).find(c=>c.id===id)||null;

  // pais "de verdade" de um clube de grupo regional: moda da nacionalidade dos jogadores (o catalogo grava o pais da liga regional).
  const ccCache=new WeakMap();
  function clubCountry(s,clubId){
    let m=ccCache.get(s);if(!m){m=new Map();ccCache.set(s,m);}
    if(m.has(clubId))return m.get(clubId);
    const g=GFb(),ni=NI(),count={};
    try{for(const p of g.playersByClub(s,clubId)){const c=ni.codeOf(p.nationality);if(c)count[c]=(count[c]||0)+1;}}catch(e){}
    const best=Object.entries(count).sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1))[0];
    const code=best?best[0]:null;m.set(clubId,code);return code;
  }

  // Associacoes com liga nacional jogavel (ou, na CONMEBOL, clubes de grupo regional agrupados pelo pais real).
  function associations(s){
    const w=WCC(),ni=NI(),g=s.globalFootball?.leagues||[],cov=(w.coverage?w.coverage(s):[]);
    const playable=cov.filter(c=>c.status==="playable");
    const regional=cov.filter(c=>c.status==="regional_pool");
    const uefa=new Map(),conmebol=new Map();
    for(const c of playable){
      const lg=g.find(l=>l.id===c.leagueId),code=ni?ni.codeOf(lg&&lg.country):null;if(!code)continue;
      const conf=ni.confederationOf(code);
      const best=conf==="UEFA"?uefa:conf==="CONMEBOL"?conmebol:null;if(!best)continue;
      const prev=best.get(code);if(!prev||(lg.reputation||0)>(prev.reputation||0))best.set(code,{code,leagueId:lg.id,league:lg.name,reputation:lg.reputation||0,clubCount:c.clubCount,mode:"league"});
    }
    if((s.leagues||[]).some(l=>l.id==="serieA")){
      conmebol.set("BRA",{code:"BRA",leagueId:"serieA",league:"Brasileirão Série A",clubCount:(s.clubs||[]).filter(c=>c.leagueId==="serieA").length,mode:"local"});
    }
    const poolClubs=new Map();
    for(const r of regional){
      for(const c of s.globalFootball.clubs.filter(x=>x.leagueId===r.leagueId)){
        const code=clubCountry(s,c.id);if(!code||ni.confederationOf(code)!=="CONMEBOL")continue;
        if(conmebol.has(code)&&conmebol.get(code).mode!=="pool")continue;
        if(!poolClubs.has(code))poolClubs.set(code,{leagueId:r.leagueId,ids:[]});poolClubs.get(code).ids.push(c.id);
      }
    }
    for(const [code,v] of poolClubs)if(!conmebol.has(code))conmebol.set(code,{code,leagueId:v.leagueId,league:"Grupo regional FC 27",clubCount:v.ids.length,mode:"pool",ids:v.ids});
    const ordered=(map,order)=>order.filter(c=>map.has(c)).map((c,i)=>({...map.get(c),rank:i+1}));
    return {uefa:ordered(uefa,UEFA_ORDER),conmebol:ordered(conmebol,CONMEBOL_ORDER)};
  }
  function clubsOf(s,a){
    if(a.mode==="local")return (s.clubs||[]).filter(c=>c.leagueId===a.leagueId).map(c=>c.id);
    if(a.mode==="pool")return a.ids.slice();
    return (s.globalFootball.clubs||[]).filter(c=>c.leagueId===a.leagueId).map(c=>c.id);
  }
  // Classificacao da associacao: final da temporada anterior (registrada) ou, na edicao inicial, prestigio do catalogo (rotulado como adaptado).
  function ranking(s,a,season){
    // Historico finalizado tem prioridade para ligas que atravessam janeiro.
    // Nunca classificar por uma tabela ainda em andamento.
    if(a.mode==="league"){
      const calendar=root.ProLifeEuropeanCalendar||(typeof require==="function"?require("./european-calendar.js"):null);
      const policy=calendar?.leagueCountry?.((s.globalFootball?.leagues||[]).find(l=>l.id===a.leagueId));
      const history=(s.globalFootball?.worldCompetitions?.history||[]).find(
        h=>h.leagueId===a.leagueId&&h.season===season-1
      );
      if(policy&&history?.orderIds?.length)return {order:history.orderIds.slice(),source:"previous_season"};
      if(policy&&history?.top4?.length){
        const seen=new Set(history.top4);
        const all=(s.globalFootball?.clubs||[]).filter(c=>c.leagueId===a.leagueId).map(c=>c.id);
        return {order:[...history.top4,...all.filter(id=>!seen.has(id))],source:"previous_season_partial"};
      }
    }
    const st=state(s),fin=st.finals[String(season-1)]&&st.finals[String(season-1)][a.code];
    if(fin&&fin.length)return {order:fin.slice(),source:"previous_season"};
    const ids=clubsOf(s,a);
    ids.sort((x,y)=>prestige(s,y)-prestige(s,x)||(x<y?-1:1));
    return {order:ids,source:"bootstrap"};
  }
  // A Inglaterra distribui sete vagas totais: 4 UCL, 2 UEL (inclui FA Cup)
  // e 1 UECL (inclui EFL Cup). Se um campeão já estiver em nível superior,
  // a vaga volta à classificação da Premier League; nunca cria vaga adicional.
  function associationQuota(a,comp){
    if(a.code==="ENG")return comp==="ucl"?4:comp==="uel"?2:comp==="uecl"?1:0;
    return uefaQuota(a.rank,comp);
  }
  function englishEuropeanAllocation(order,cups={}){
    const available=Array.from(new Set(order||[])),used=new Set(),takeLeague=n=>{const out=[];if(n<=0)return out;for(const id of available)if(!used.has(id)){used.add(id);out.push(id);if(out.length===n)break;}return out;};
    const ucl=takeLeague(4),uel=[];
    if(cups.faCupWinner&&available.includes(cups.faCupWinner)&&!used.has(cups.faCupWinner)){used.add(cups.faCupWinner);uel.push(cups.faCupWinner);}
    uel.push(...takeLeague(2-uel.length));
    const uecl=[];
    if(cups.eflCupWinner&&available.includes(cups.eflCupWinner)&&!used.has(cups.eflCupWinner)){used.add(cups.eflCupWinner);uecl.push(cups.eflCupWinner);}
    uecl.push(...takeLeague(1-uecl.length));
    return {ucl,uel,uecl,all:[...ucl,...uel,...uecl]};
  }
  function build(s,comp,season){
    const as=associations(s),def=COMPS[comp],entrants=[],used=new Set(),reasons=[];let source="previous_season";
    const claimed=new Set();
    for(const k of Object.values(state(s).editions))if(k.season===season&&k.comp!==comp&&COMPS[k.comp].conf===def.conf&&COMPS[k.comp].tier<def.tier)for(const e of k.entrants)claimed.add(e[0]);
    const list=def.conf==="UEFA"?as.uefa:as.conmebol;
    for(const a of list){
      const rk=ranking(s,a,season);if(rk.source==="bootstrap")source="bootstrap";
      const q=def.conf==="UEFA"?associationQuota(a,comp):((comp==="lib"?LIB_QUOTA:SUD_QUOTA)[a.code]||0);
      // vagas das competicoes de nivel superior sao consumidas primeiro (a vaga desce para o proximo colocado)
      let skip=0;
      if(def.conf==="UEFA"){for(const hi of ["ucl","uel"]){if(COMPS[hi].tier<def.tier)skip+=associationQuota(a,hi);}}
      else if(comp==="sud")skip=LIB_QUOTA[a.code]||0;
      let taken=0,pos=0;
      if(def.conf==="UEFA"&&a.code==="ENG"&&(comp==="uel"||comp==="uecl")){
        const cups=EnglishCups()?.europeanQualifiers?.(s,season-1)||{};
        const cupId=comp==="uel"?cups.faCupWinner:cups.eflCupWinner;
        if(cupId&&rk.order.includes(cupId)&&!claimed.has(cupId)&&!used.has(cupId)){
          entrants.push([cupId,a.code,comp==="uel"?"campeão-fa-cup":"campeão-efl-cup",rk.order.indexOf(cupId)+1]);
          used.add(cupId);taken++;
        }
      }
      for(const id of rk.order){
        pos++;if(pos<=skip||claimed.has(id)||used.has(id))continue;
        if(taken>=q)break;
        entrants.push([id,a.code,"liga:"+pos,pos]);used.add(id);taken++;
      }
      if(taken<q)reasons.push(`${a.code}: ${taken} de ${q} vagas preenchidas (cobertura incompleta do catálogo).`);
    }
    const need=def.size,have=entrants.length;
    let status=have>=need?"ready":have>=MIN_ADAPTED?"adapted":"unavailable";
    if(!list.length)reasons.push("Nenhuma associação com liga jogável para esta competição.");
    if(have<need&&have>0)reasons.unshift(`Edição adaptada: ${have} de ${need} participantes possíveis com os clubes reais do catálogo. Nenhum clube foi inventado.`);
    if(status==="unavailable")reasons.unshift(`Indisponível: ${have} participantes identificáveis (mínimo ${MIN_ADAPTED}).`);
    if(source==="bootstrap")reasons.push("Edição inicial: sem classificação da temporada anterior, usa o prestígio dos clubes no catálogo (rotulado como adaptado).");
    reasons.push(ADAPTED);
    return {key:`${comp}:${season}`,comp,season,status,required:need,count:have,source,entrants,reasons,drawSeed:`${comp}|${season}`,drawn:false};
  }
  function ensureEdition(s,comp,season){
    const st=state(s),key=`${comp}:${season}`;
    if(st.editions[key])return st.editions[key];
    const ed=build(s,comp,season);
    if(s.calendarVersion==="european_v1"&&["ucl","uel","uecl"].includes(comp))
      ed.calendarMode="european_v1";
    st.editions[key]=ed;return ed;
  }
  // 34F.32B.0 - Preenche vagas UEFA restantes somente depois
  // de reservar os participantes das tres competicoes.
  // Adaptacao PRO-LIFE; nao representa coeficientes oficiais UEFA.
  function completeUefaParticipants(s,allEditions){
    const ids=["ucl","uel","uecl"];
    const selected=new Set(
      allEditions.flatMap(ed=>(ed.entrants||[]).map(x=>x[0]))
    );
    const countries=associations(s).uefa;

    for(const id of ids){
      const ed=allEditions.find(x=>x.comp===id);
      if(!ed||ed.drawn||ed.matches?.length)continue;

      const previous=ed.entrants.length;
      const limit=COMPS[id].size;

      while(ed.entrants.length<limit){
        let changed=false;

        for(const a of countries){
          if(ed.entrants.length>=limit)break;

          // A complementação do catálogo não pode criar vagas inglesas extras.
          const already=ed.entrants.filter(e=>e[1]===a.code).length;
          if(a.code==="ENG"&&already>=associationQuota(a,id))continue;

          const order=ranking(s,a,ed.season).order;
          const pos=order.findIndex(clubId=>!selected.has(clubId));
          if(pos<0)continue;

          const clubId=order[pos];
          ed.entrants.push([
            clubId,a.code,"vaga-complementar",pos+1
          ]);
          selected.add(clubId);
          changed=true;
        }

        if(!changed)break;
      }

      const added=ed.entrants.length-previous;
      ed.count=ed.entrants.length;
      ed.status=ed.count>=limit
        ?"ready"
        :ed.count>=16?"adapted":"unavailable";

      if(added){
        ed.reasons=(ed.reasons||[]).filter(r=>
          !r.startsWith("Edição adaptada:") &&
          !r.startsWith("Indisponível:")
        );
        ed.reasons.push(
          `${added} vaga(s) complementar(es) preenchida(s) `+
          "com clubes reais ainda livres; regra adaptada PRO-LIFE."
        );
      }
    }
  }
  function init(s){
    state(s);const out=[];
    // as edicoes de nivel superior primeiro: elas reservam clubes para as inferiores
    const dateCalendar=root.ProLifeEuropeanCalendar||(typeof require==="function"?require("./european-calendar.js"):null);
    const deferUefa=s.calendarVersion==="european_v1"&&s.season>2026&&
      s.day<dateCalendar.dateDay(s.season+"-07-01");
    for(const comp of ["ucl","uel","uecl","lib","sud"]){
      if(deferUefa&&["ucl","uel","uecl"].includes(comp))continue;
      out.push(ensureEdition(s,comp,s.season));
    }
    completeUefaParticipants(s,out);
    return out;
  }
  function edition(s,comp,season){return state(s).editions[`${comp}:${season==null?s.season:season}`]||null;}
  // Resolve a temporada UEFA que atravessa janeiro sem alterar saves legados.
  // Somente edicoes explicitamente marcadas participam da continuidade.
  function activeEdition(s,comp){
    const current=edition(s,comp,s.season);
    if(!["ucl","uel","uecl"].includes(comp))return current;
    const marked=Object.values(state(s).editions).filter(ed=>
      ed?.comp===comp&&ed.calendarMode==="european_v1"&&
      ed.season<=s.season&&ed.status!=="complete"&&ed.status!=="unavailable"
    ).sort((a,b)=>b.season-a.season);
    for(const ed of marked){
      const matches=[...(ed.leagueSchedule?.matches||[])];
      for(const stage of Object.values(ed.knockout?.stages||{}))matches.push(...(stage.matches||[]));
      const pending=matches.some(m=>!m.played);
      // Ao concluir a fase de liga em janeiro, os playoffs podem ainda nao
      // existir no save. Preservar a edicao ate a final programada.
      const cal=root.ProLifeEuropeanCalendar||(typeof require==="function"?require("./european-calendar.js"):null);
      const finalDay=cal?.uefaKnockoutDates?.(ed.season,comp,"final")?.[0];
      const awaitingKnockout=!!ed.leagueSchedule&&!ed.knockout&&
        ed.leagueSchedule.matches.every(m=>m.played)&&
        (!Number.isFinite(finalDay)||s.day<=finalDay);
      if(pending||awaitingKnockout)return ed;
    }
    return current;
  }
  function editions(s,season){init(s);return Object.values(state(s).editions).filter(e=>season==null||e.season===season);}

  // Registro das classificacoes finais (chamado no encerramento da temporada, antes de s.season++). Idempotente.
  function closeSeason(s,ctx){
    const st=state(s),key=String(s.season);if(st.finals[key])return st.finals[key];
    const as=associations(s),w=WCC(),fin={};
    for(const a of [...as.uefa,...as.conmebol]){
      let ids=null;
      if(a.mode==="local"){const t=ctx&&ctx.orders&&ctx.orders[a.leagueId];ids=t?t.map(c=>c.id):null;}
      else if(a.mode==="pool"){const o=(w.standings(s,a.leagueId)||[]).map(x=>x.id);ids=o.filter(id=>a.ids.includes(id));}
      else{ids=(w.standings(s,a.leagueId)||[]).map(x=>x.id);}
      if(ids&&ids.length&&ids.some(()=>true))fin[a.code]=ids.slice(0,16);
    }
    st.finals[key]=fin;return fin;
  }
  function startSeason(s){return init(s);}

  // ---- calendario ----
  const baseDay=season=>(Number(season)-2026)*365;
  function domesticDays(s,leagueId,season){
    const w=WCC(),cov=w.coverage(s).find(c=>c.leagueId===leagueId);if(!cov||!cov.rounds)return null;
    const out=new Set();for(let i=0;i<cov.rounds;i++)out.add(w.roundDate(season,i,cov.rounds));return out;
  }
  // Janelas continentais: 3 dias consecutivos (ter/qua/qui); cada clube joga no primeiro dia livre da sua janela.
  function windows(season,comp,editionForCalendar){
    if(editionForCalendar?.calendarMode==="european_v1"&&editionForCalendar.season===season&&["ucl","uel","uecl"].includes(comp)){
      const cal=root.ProLifeEuropeanCalendar||(typeof require==="function"?require("./european-calendar.js"):null);
      const dates=cal?.uefaLeagueWindows?.(season,comp);
      if(dates?.length){
        // A fase de liga e o mata-mata usam o mesmo ciclo anual; a
        // programacao de confrontos nao sobrescreve partidas persistidas.
        return [...dates,...["playoff","round16","quarterfinal","semifinal","final"].map(key=>
          cal.uefaKnockoutDates(season,comp,key)?.[0]
        )];
      }
    }
    const b=baseDay(season),def=COMPS[comp],n=def.conf==="UEFA"?8+5:6+5,out=[];
    const start=FIRST+30,end=LAST-20,gap=Math.floor((end-start)/(n-1));
    const shift={ucl:0,uel:1,uecl:2,lib:0,sud:1}[comp]||0;
    for(let i=0;i<n;i++)out.push(b+start+i*gap+shift);
    return out;
  }
  function slotFor(s,clubId,leagueId,windowStart,season){
    const days=leagueId&&leagueId!=="serieA"?domesticDays(s,leagueId,season):null;
    if(!days)return {day:windowStart,checked:false};
    for(let d=windowStart;d<windowStart+WINDOW_SPAN;d++){
      if(!days.has(d)&&!days.has(d-1)&&!days.has(d+1))return {day:d,checked:true,rest:true};
    }
    for(let d=windowStart;d<windowStart+WINDOW_SPAN;d++)if(!days.has(d))return {day:d,checked:true,rest:false};
    return {day:null,checked:true,conflict:true};
  }
  // Auditoria: nenhum clube com dois jogos obrigatorios no mesmo dia (calendarios domesticos ja existentes nao sao reescritos).
  function auditCalendar(s,ed){
    const as=associations(s),leagueOf=new Map();
    for(const a of [...as.uefa,...as.conmebol])for(const id of clubsOf(s,a))leagueOf.set(id,a);
    let conflicts=0,unchecked=0,checked=0,norest=0;
    for(const w of windows(ed.season,ed.comp)){
      for(const e of ed.entrants){
        const a=leagueOf.get(e[0]),r=slotFor(s,e[0],a&&a.mode==="league"?a.leagueId:null,w,ed.season);
        if(!r.checked){unchecked++;continue;}checked++;if(r.conflict)conflicts++;else if(!r.rest)norest++;
      }
    }
    return {conflicts,checked,unchecked,withoutRest:norest,windows:windows(ed.season,ed.comp).length};
  }
  // Participacao do protagonista: somente por merito (esta nas vagas). Nunca convida.
  function heroEntries(s){
    if(!s.clubId)return [];
    return editions(s,s.season).filter(e=>e.entrants.some(x=>x[0]===s.clubId)).map(e=>({comp:e.comp,name:COMPS[e.comp].name,status:e.status,via:e.entrants.find(x=>x[0]===s.clubId)[2]}));
  }
  const api={VERSION,COMPS,PLANNED,init,state,edition,activeEdition,editions,ensureEdition,closeSeason,startSeason,associations,clubCountry,windows,slotFor,auditCalendar,heroEntries,uefaQuota,associationQuota,englishEuropeanAllocation,LIB_QUOTA,SUD_QUOTA};
  root.ProLifeContinental=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
