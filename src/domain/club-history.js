(function(root){
  "use strict";
  // 34F.31D - Clube DA EPOCA de cada temporada arquivada.
  // Somente leitura: nada e gravado nem reescrito. Prioridade: evidencia explicita (passagens registradas, partidas do protagonista
  // com clube e temporada, ids arquivados) > linha do tempo de transferencias > chegada ao primeiro clube.
  // Sem evidencia suficiente: "Clube não identificado". O clube atual nunca e usado para preencher o passado.
  const NAMES=()=>root.ProLifeNames||(typeof require==="function"?(()=>{try{return require("./display-names.js");}catch(e){return null;}})():null);
  const GF=D=>(D&&D.GlobalFootball)||root.ProLifeGlobalFootball||null;
  const UNKNOWN="Clube não identificado";
  const plain=v=>String(v==null?"":v).normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().trim();
  const base=season=>(season-2026)*365;
  function allClubs(s,D){
    const out=[...(s.clubs||[])];
    try{const g=GF(D);const list=(s.globalFootball&&s.globalFootball.clubs)||(g&&g.clubs&&g.clubs(s))||[];out.push(...list);}catch(e){}
    return out;
  }
  function clubName(s,D,id,fallback){
    if(!id)return fallback||null;
    let c=null;try{c=(D&&D.club&&D.club(s,id))||(s.clubs||[]).find(x=>x.id===id)||null;}catch(e){}
    if(!c){try{const g=GF(D);c=g&&g.clubById?g.clubById(s,id):null;}catch(e){}}
    const N=NAMES();
    const raw=(c&&c.name)||fallback||null;
    if(!raw)return null;
    return (N&&N.club?N.club(s,id,raw):raw)||raw;
  }
  function nameToId(s,D,name){
    const k=plain(name);if(!k||k==="sem clube")return null;
    const hit=allClubs(s,D).filter(c=>c&&plain(c.name)===k);
    const ids=[...new Set(hit.map(c=>c.id))];
    return ids.length===1?ids[0]:null;
  }
  // Linha do tempo de vinculos a partir das transferencias do proprio protagonista (nomes -> ids quando unico no catalogo).
  function timeline(s,D){
    const own=((s.extras&&s.extras.transfers)||[]).filter(t=>t&&t.player===(s.person&&s.person.name)&&Number.isFinite(Number(t.day))).slice().sort((a,b)=>Number(a.day)-Number(b.day));
    const arrival=s.extras&&s.extras.playerCareer&&s.extras.playerCareer.firstClubArrival;
    const segs=[];
    const mk=(name,id,from,to,source)=>({clubId:id||nameToId(s,D,name),name:name||null,fromDay:from,toDay:to,source});
    const firstDay=own.length?Number(own[0].day):null;
    const arrId=arrival&&arrival.clubId?arrival.clubId:null;
    const firstFrom=own.length&&own[0].from&&plain(own[0].from)!=="sem clube"?own[0].from:null;
    // clube anterior a primeira transferencia registrada
    if(own.length){
      if(arrId&&Number.isFinite(Number(arrival.day))&&(!firstFrom||nameToId(s,D,firstFrom)===arrId||plain(clubName(s,D,arrId))===plain(firstFrom)))segs.push(mk(clubName(s,D,arrId),arrId,Number(arrival.day),firstDay,"chegada ao primeiro clube"));
      else if(firstFrom)segs.push(mk(firstFrom,null,Math.floor(firstDay/365)*365,firstDay,"origem da primeira transferência"));
    }else if(arrId&&Number.isFinite(Number(arrival.day))){
      segs.push(mk(clubName(s,D,arrId),arrId,Number(arrival.day),null,"chegada ao primeiro clube"));
    }
    own.forEach((t,i)=>{
      const next=own[i+1];const to=t.to&&plain(t.to)!=="sem clube"?t.to:null;
      if(to)segs.push(mk(to,null,Number(t.day),next?Number(next.day):null,"transferência registrada"));
    });
    return segs.map(x=>({...x,name:x.clubId?(clubName(s,D,x.clubId,x.name)||x.name):x.name}));
  }
  // Partidas do protagonista com clube e temporada (evidencia explicita).
  function matchGroups(s,season){
    const g=new Map();
    for(const m of s.matches||[]){
      if(m.season!==season||!Array.isArray(m.participants)||!m.participants.flat().includes("hero"))continue;
      const id=(m.participants[0]||[]).includes("hero")?m.home:(m.participants[1]||[]).includes("hero")?m.away:null;if(!id)continue;
      let r=g.get(id);if(!r){r={clubId:id,appearances:0,goals:0,assists:0,ratingTotal:0,rated:0,minutes:0};g.set(id,r);}
      r.appearances++;r.minutes+=Number((m.playerStats&&m.playerStats.hero&&m.playerStats.hero.minutes)||90);
      r.goals+=(m.events||[]).filter(e=>e.type==="goal"&&e.playerId==="hero").length;
      r.assists+=(m.events||[]).filter(e=>e.assistPlayerId==="hero").length;
      const rt=Number(m.ratings&&m.ratings.hero);if(rt>0){r.ratingTotal+=rt;r.rated++;}
    }
    return g;
  }
  // Resolve os clubes de uma temporada arquivada. `archived` e o resumo guardado (pode ter club "Sem clube" de saves antigos).
  function resolveSeason(s,D,season,archived){
    const found=new Map(); // clubId|name -> {clubId,name,source,...}
    const put=(key,row)=>{if(!found.has(key))found.set(key,row);};
    const stints=(s.statistics&&s.statistics.heroStints)||[];
    for(const st of stints)if(st&&st.season===season&&st.clubId)put(st.clubId,{clubId:st.clubId,name:clubName(s,D,st.clubId,st.club),source:"passagem registrada",startDay:st.startDay,endDay:st.endDay});
    const mg=matchGroups(s,season);
    for(const [id,r] of mg)put(id,{clubId:id,name:clubName(s,D,id),source:"partidas da temporada",startDay:null,endDay:null,stats:r});
    const ids=(archived&&Array.isArray(archived.clubIds))?archived.clubIds:[];
    for(const id of ids)put(id,{clubId:id,name:clubName(s,D,id),source:"id arquivado",startDay:null,endDay:null});
    if(archived&&archived.clubId&&!found.size)put(archived.clubId,{clubId:archived.clubId,name:clubName(s,D,archived.clubId,archived.club),source:"id arquivado"});
    if(!found.size){
      const lo=base(season),hi=lo+364;
      for(const seg of timeline(s,D)){
        const a=Math.max(lo,seg.fromDay),b=Math.min(hi,seg.toDay==null?hi:seg.toDay);
        if(a<=b&&seg.name)put(seg.clubId||seg.name,{clubId:seg.clubId,name:seg.name,source:seg.source,startDay:a,endDay:seg.toDay==null?null:b});
      }
    }
    if(!found.size&&archived&&archived.club&&plain(archived.club)!=="sem clube"&&plain(archived.club)!==plain(UNKNOWN)){
      put(archived.club,{clubId:nameToId(s,D,archived.club),name:archived.club,source:"nome arquivado"});
    }
    const clubs=[...found.values()].filter(c=>c.name);
    return {season,clubs,status:clubs.length===0?"nao_identificado":clubs.length===1?"identificado":"multiplo",matchGroups:mg};
  }
  // Linhas de historico: nunca duplica o total da temporada em cada clube.
  function rowsForArchived(s,D,archivedRow){
    const season=archivedRow.season;
    const r=resolveSeason(s,D,season,archivedRow);
    const mkRow=(extra)=>Object.assign({},archivedRow,extra);
    if(r.status==="nao_identificado")return [mkRow({club:UNKNOWN,clubId:null,clubSource:"sem evidência"})];
    if(r.status==="identificado"){const c=r.clubs[0];return [mkRow({club:c.name,clubId:c.clubId||null,clubSource:c.source})];}
    // varios clubes: separa apenas se as partidas explicam integralmente o total arquivado
    const sum=[...r.matchGroups.values()].reduce((n,x)=>n+x.appearances,0);
    const allWithMatches=r.clubs.every(c=>c.stats);
    if(allWithMatches&&sum===Number(archivedRow.appearances||0)){
      return r.clubs.map(c=>mkRow({club:c.name,clubId:c.clubId,clubSource:c.source,appearances:c.stats.appearances,goals:c.stats.goals,assists:c.stats.assists,minutes:c.stats.minutes,
        averageRating:c.stats.rated?+(c.stats.ratingTotal/c.stats.rated).toFixed(2):0,starts:undefined,split:true}));
    }
    return [mkRow({club:r.clubs.map(c=>c.name).join(" / "),clubId:null,clubs:r.clubs.map(c=>c.name),clubSource:"vários vínculos",statsNote:"Estatísticas da temporada não separáveis por clube."})];
  }
  const api={UNKNOWN,timeline,matchGroups,resolveSeason,rowsForArchived,nameToId,clubName};
  root.ProLifeClubHistory=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
