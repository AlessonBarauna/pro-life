(function worldHonorsModule(root){
  "use strict";
  // Premiações mundiais de temporada: Bola de Ouro, Troféu Kopa, Troféu Yashin, Troféu Gerd Müller, Troféu Cruyff e The Best.
  // Calculadas no fechamento da temporada (antes de WorldStats arquivar/zerar as ligas) e REVELADAS na cerimônia, em outubro.
  // Determinístico (mesmo save => mesmo resultado), idempotente por temporada, sem viés a favor ou contra o protagonista.
  const VERSION=1,EPOCH=Date.UTC(2026,0,1),DAY=86400000;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),num=(v,d=0)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
  const plain=v=>String(v==null?"":v).normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().trim();
  const WS=()=>root.ProLifeWorldStats||(typeof require==="function"?(()=>{try{return require("./world-stats.js");}catch(e){return null;}})():null);
  const GF=()=>root.ProLifeGlobalFootball||(typeof require==="function"?(()=>{try{return require("./global-football.js");}catch(e){return null;}})():null);
  const NI=()=>root.ProLifeNationalIdentity||(typeof require==="function"?(()=>{try{return require("./national-identity.js");}catch(e){return null;}})():null);
  function hash(v){let h=2166136261;for(const ch of String(v)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  const unit=v=>hash(v)/4294967296;
  const gauss=v=>(unit(v+"|a")+unit(v+"|b")+unit(v+"|c")-1.5)*2;      // ~ -3..3, média 0
  const seedOf=s=>String(s.universe?.seed??s.seed??s.rng??"0");
  // ---------- calendário ----------
  const dayOfDate=(y,m,d)=>Math.round((Date.UTC(y,m,d)-EPOCH)/DAY);
  const yearOfDay=day=>new Date(EPOCH+day*DAY).getUTCFullYear();
  // Cerimônia: 20/10 do ano do fechamento (ou do ano seguinte se o fechamento já passou dessa data).
  function ceremonyDay(closeDay){const y=yearOfDay(closeDay),d=dayOfDate(y,9,20);return closeDay<d?d:dayOfDate(y+1,9,20);}
  // ---------- peso de ligas ----------
  const TOP5=new Set(["Inglaterra","Espanha","Alemanha","Itália","França"].map(plain));
  const TIER2=new Set(["Portugal","Países Baixos","Bélgica","Turquia","Brasil","Argentina","Escócia","Áustria","Suíça"].map(plain));
  const UEFA_EXTRA=new Set(["Portugal","Países Baixos","Bélgica","Turquia","Escócia","Áustria","Suíça"].map(plain));
  function leagueMeta(s,id){return (s.globalFootball?.leagues||[]).find(l=>l.id===id)||null;}
  function leagueWeight(s,id){
    const m=leagueMeta(s,id);
    if(m){const c=plain(m.country),rep=num(m.reputation,50);
      if(TOP5.has(c))return rep>=60?1:.4;
      if(TIER2.has(c))return rep>=45?.8:.4;
      return rep>=48?.62:.4;}
    if(/^serie[a]$/.test(id||""))return .8;if(/^serie[bcd]$/.test(id||""))return .45;
    if(/^state-/.test(id||""))return .4;if(id==="lib"||id==="sud"||id==="ucl"||id==="uel"||id==="uecl")return 1;
    return .5;
  }
  // ---------- conquistas coletivas ----------
  function championOf(s,id){const l=s.globalFootball?.worldCompetitions?.leagues?.[id];return l?.championId||null;}
  function strengthOf(s,clubId){const c=(s.globalFootball?.clubs||[]).find(x=>x.id===clubId)||(s.clubs||[]).find(x=>x.id===clubId);return num(c?.strength,num(c?.reputation,55)*.9);}
  function tablePoints(row){return Array.isArray(row)?num(row[6]):num(row?.points);}
  // Champions League: usa o resultado REAL da edição concluída mais recente (a final cai em maio; a cerimônia, em outubro).
  // Só recorre a um mata-mata determinístico quando nenhuma edição foi disputada ainda (primeira cerimônia de um save novo).
  const UCL_POINTS={league:4,playoffs:8,round16:12,quarters:22,semis:36,final:50,champion:70};
  function realUcl(s,season){
    const eds=Object.values(s.continental?.editions||{}).filter(e=>e?.comp==="ucl"&&e.knockout?.championId&&num(e.season)>=season-1&&num(e.season)<=season)
      .sort((a,b)=>num(b.season)-num(a.season));
    const ed=eds[0];if(!ed)return null;
    const out=new Map();
    for(const r of ed.knockout.ranking||[])out.set(r.id,UCL_POINTS.league);
    for(const st of Object.values(ed.leagueSchedule?.matches?{}:{}))void st;
    const stages=ed.knockout.stages||[];
    const key=["playoffs","round16","quarters","semis","final"];
    stages.forEach((st,i)=>{
      const pts=UCL_POINTS[key[i]]||UCL_POINTS.league;
      for(const m of st.matches||[])for(const id of [m.homeId,m.awayId])if(id)out.set(id,Math.max(out.get(id)||0,pts));
    });
    out.set(ed.knockout.championId,UCL_POINTS.champion);
    return {results:out,champion:ed.knockout.championId,simulated:false,edition:num(ed.season)};
  }
  function uclResults(s,season){
    const real=realUcl(s,season);if(real)return real;
    const out=new Map(),field=[],champ=null;
    for(const l of s.globalFootball?.leagues||[]){
      if(l.active===false||num(l.level,1)!==1)continue;const c=plain(l.country);
      const quota=TOP5.has(c)?4:UEFA_EXTRA.has(c)?2:0;if(!quota)continue;
      const st=s.globalFootball?.worldCompetitions?.leagues?.[l.id];if(!st?.table)continue;
      const order=Object.entries(st.table).map(([id,r])=>[id,tablePoints(r)]).sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1)).slice(0,quota).map(x=>x[0]);
      for(const id of order)field.push(id);
    }
    if(!field.length)return {results:out,champion:champ||null,simulated:false};
    let alive=field.map(id=>({id,p:strengthOf(s,id)+gauss(`${seedOf(s)}|ucl|${season}|${id}`)*4})).sort((a,b)=>b.p-a.p).slice(0,16).map(x=>x.id);
    const stages=[["r16",4],["quarter",10],["semi",20],["final",35]];
    for(const id of field)out.set(id,0);
    for(const id of alive)out.set(id,12);
    let round=0;
    while(alive.length>1){
      const next=[];
      for(let i=0;i<alive.length;i+=2){
        const a=alive[i],b=alive[alive.length-1-i>i?alive.length-1-i:i+1];if(i>=alive.length/2)break;
        const pa=Math.pow(strengthOf(s,a),9),pb=Math.pow(strengthOf(s,b),9),w=unit(`${seedOf(s)}|uclm|${season}|${round}|${a}|${b}`)<pa/(pa+pb)?a:b,l=w===a?b:a;
        out.set(l,Math.max(out.get(l)||0,[12,22,36,50][Math.min(3,round)]));next.push(w);
      }
      alive=next;round++;
      if(alive.length===1)out.set(alive[0],70);
    }
    const winner=champ||alive[0];
        return {results:out,champion:winner,simulated:!champ};
  }
  function continentalChampions(s,season){
    const out=[];for(const e of Object.values(s.continental?.editions||{})){
      if(!e||num(e.season)!==season||!["lib","sud"].includes(e.comp))continue;
      const id=e.championId||e.champion?.id||e.champion;if(id&&typeof id==="string")out.push({comp:e.comp,clubId:id});}
    return out;
  }
  const NAT_WEIGHT={WORLD_CUP:1,EURO:.6,COPA_AMERICA:.6,AFCON:.5,ASIAN_CUP:.5,GOLD_CUP:.35,UEFA_NATIONS_LEAGUE:.25,FINALISSIMA:.2};
  function nationalResults(s,season){
    const out=[];for(const t of s.nationalTeam?.tournaments||[]){
      if(num(t.year)!==season||!t.champion||typeof t.champion!=="object")continue;
      const w=NAT_WEIGHT[t.type];if(!w)continue;
      out.push({type:t.type,champion:t.champion.id||null,runnerUp:t.runnerUp?.id||null,w});}
    return out;
  }
  // ---------- candidatos ----------
  function playerOf(s,id){if(id==="hero")return s.person;return GF()?.playerById?.(s,id)||null;}
  function codeOf(v){try{return NI()?.codeOf?.(v)||null;}catch(e){return null;}}
  function build(s,opts={}){
    const W=WS();if(!W)return null;
    const season=num(opts.season,s.season);
    let rows=W.globalRows(s);
    // Temporada europeia que acabou em maio: ja foi arquivada, entao o resumo guardado no fechamento substitui o parcial da nova edicao.
    const poolRows=s.globalFootball?.worldStats?.pool?.[String(season-1)]||[];
    if(poolRows.length){
      const euro=r=>s.globalFootball?.worldCompetitions?.leagues?.[r.leagueId]?.calendarMode==="european_v1";
      const byId=new Map();
      for(const r of rows)if(!euro(r))byId.set(r.id,r);
      for(const r of poolRows){const prior=byId.get(r.id);if(!prior||r.apps>prior.apps)byId.set(r.id,{...r,eligible:true});}
      rows=[...byId.values()];
    }
    const ucl=uclResults(s,season),lib=continentalChampions(s,season),nat=nationalResults(s,season);
    let natTop=null;   // codigo -> Set(ids) dos 26 melhores, calculado uma unica vez e so se houver torneio de selecoes
    const codeCache=new Map(),codeFast=nat=>{if(!codeCache.has(nat))codeCache.set(nat,codeOf(nat));return codeCache.get(nat);};
    const natSet=code=>{
      if(!natTop){natTop=new Map();const by=new Map();
        for(const p of (GF()?.activePlayers?.(s)||[])){const c=codeFast(p.nationality);if(!c)continue;let a=by.get(c);if(!a)by.set(c,a=[]);a.push(p);}
        for(const [c,list] of by)natTop.set(c,new Set(list.sort((x,y)=>num(y.ovr||y.overall)-num(x.ovr||x.overall)).slice(0,26).map(p=>p.id)));}
      return natTop.get(code)||new Set();
    };
    const leagueTitles=new Map();
    for(const l of s.globalFootball?.leagues||[]){const c=championOf(s,l.id);if(c)leagueTitles.set(c,l.id);}
    const cands=[];
    for(const r of rows){
      if(!r.eligible||r.apps<8)continue;
      const lw=leagueWeight(s,r.leagueId);
      if(lw<.5&&r.id!=="hero"&&r.apps<10)continue;
      const p=playerOf(s,r.id)||{};
      const ovr=r.id==="hero"?num(opts.heroOvr,num(p.overall,num(p.ovr,60))):num(p.ovr||p.overall,60);
      const code=codeFast(p.nationality)||null;
      // desempenho ponderado pelo nível da competição
      const perf=num(r.globalScore)*lw;
      // conquistas: so contam proporcionalmente a participacao
      const share=clamp(r.apps/28,.35,1);
      let t=0;const reasons=[];
      const u=ucl.results.get(r.clubId);if(u){t+=u*share;if(u>=50)reasons.push(u>=70?"Campeão da Champions":"Finalista da Champions");else if(u>=36)reasons.push("Semifinal da Champions");}
      for(const c of lib)if(c.clubId===r.clubId){t+=(c.comp==="lib"?45:18)*share;reasons.push(c.comp==="lib"?"Campeão da Libertadores":"Campeão da Sul-Americana");}
      if(leagueTitles.has(r.clubId)){const lg=leagueTitles.get(r.clubId);t+=24*leagueWeight(s,lg)*share;reasons.push("Campeão nacional");}
      for(const n of nat){const inSquad=code&&natSet(code).has(r.id)||(r.id==="hero"&&code&&true);
        if(!inSquad)continue;
        if(code===n.champion){t+=70*n.w;reasons.push(n.type==="WORLD_CUP"?"Campeão mundial":"Campeão com a seleção");}
        else if(code===n.runnerUp){t+=40*n.w;reasons.push("Vice com a seleção");}}
      cands.push({id:r.id,name:r.name,pos:r.pos,age:num(r.age,num(p.age,25)),clubId:r.clubId,club:r.club,leagueId:r.leagueId,nat:code,natName:p.nationality||null,hero:!!r.hero,ovr,
        apps:r.apps,goals:r.goals,assists:r.assists,avg:+num(r.avg).toFixed(2),motm:r.motm,cs:r.cs,saves:r.saves,lw,perf,titles:Math.min(100,t),reasons});
    }
    if(!cands.length)return {cands:[],ucl:{champion:ucl.champion,simulated:ucl.simulated}};
    const maxPerf=Math.max(...cands.map(c=>c.perf),1);
    for(const c of cands){
      c.perfN=100*c.perf/maxPerf*(c.pos==="GOL"?.72:c.pos==="DEF"?.86:c.pos==="ATA"?1.06:1);
      c.classN=100*clamp((c.ovr-68)/24,0,1);
    }
    return {cands,ucl:{champion:ucl.champion,simulated:ucl.simulated},season};
  }
  // ---------- votação ----------
  const POINTS=[15,12,10,8,6,5,4,3,2,1];
  const VOTER_COUNTRIES=["BRA","ARG","ESP","ENG","GER","FRA","ITA","POR","NED","BEL","URU","COL","MEX","USA","JPN","KOR","MAR","SEN","NGA","EGY","CRO","TUR","SUI","DEN","SWE","POL","AUT","SCO","AUS","KSA"];
  function vote(s,pool,weights,tag,voters=100,prev={}){
    const season=num(pool.season,s.season),sc=new Map();
    for(const c of pool.list){
      const momentum=prev[c.id]?clamp(prev[c.id]/5,0,100):0;
      c.score=weights.perf*c.perfN+weights.titles*c.titles+weights.cls*c.classN+weights.imp*clamp(momentum*.6+gauss(`${seedOf(s)}|imp|${tag}|${season}|${c.id}`)*10+50,0,100);
      sc.set(c.id,0);
    }
    const ranked=pool.list.slice().sort((a,b)=>b.score-a.score);
    const top=ranked.slice(0,40);
    for(let v=0;v<voters;v++){
      const vc=VOTER_COUNTRIES[v%VOTER_COUNTRIES.length],bias=gauss(`${seedOf(s)}|vb|${tag}|${season}|${v}`);
      const ballot=top.map(c=>({id:c.id,x:c.score+gauss(`${seedOf(s)}|v|${tag}|${season}|${v}|${c.id}`)*4+(c.nat&&c.nat===vc?3:0)+bias*(c.titles>40?1.5:-0.5)})).sort((a,b)=>b.x-a.x).slice(0,10);
      ballot.forEach((b,i)=>sc.set(b.id,sc.get(b.id)+POINTS[i]));
    }
    return ranked.map(c=>({...c,points:sc.get(c.id)||0})).sort((a,b)=>b.points-a.points||b.score-a.score||(a.id<b.id?-1:1));
  }
  const compact=(c,rank)=>({rank,id:c.id,name:c.name,pos:c.pos,age:c.age,clubId:c.clubId,club:c.club,leagueId:c.leagueId,nat:c.nat,natName:c.natName,hero:c.hero||undefined,points:c.points,score:+c.score.toFixed(1),apps:c.apps,goals:c.goals,assists:c.assists,avg:c.avg,saves:c.saves||undefined,cs:c.cs||undefined,reasons:c.reasons});
  function prevRanking(s,season){const h=s.honors?.seasons?.[String(season-1)];const m={};for(const r of h?.ballon||[])m[r.id]=r.points;return m;}
  function compute(s,api,opts={}){
    const hs=opts.preview?{version:VERSION,seasons:{}}:(s.honors=s.honors&&typeof s.honors==="object"?s.honors:{version:VERSION,seasons:{}});
    if(!hs.seasons)hs.seasons={};
    const season=num(opts.season,s.season);
    if(hs.seasons[String(season)]&&!opts.force)return hs.seasons[String(season)];
    const base=build(s,{season,heroOvr:api?.overall?.(s.person)});if(!base)return null;
    const prev=prevRanking(s,season),ps=base.cands;
    const mk=(list)=>({list,season});
    const big=ps.filter(c=>c.lw>=.8||c.hero);
    const ballon=vote(s,mk(big),{perf:.45,titles:.30,cls:.15,imp:.10},"bd",100,prev);
    const best=vote(s,mk(big),{perf:.38,titles:.32,cls:.12,imp:.18},"tb",60,prev);
    const kopa=vote(s,mk(ps.filter(c=>c.age<=21&&(c.lw>=.8||c.hero))),{perf:.5,titles:.2,cls:.2,imp:.1},"kp",60,prev);
    const yashin=vote(s,mk(ps.filter(c=>c.pos==="GOL"&&(c.lw>=.8||c.hero))),{perf:.5,titles:.3,cls:.12,imp:.08},"ys",60,prev);
    const gerd=ps.filter(c=>c.pos!=="GOL").map(c=>({...c,points:+(c.goals*c.lw*c.lw).toFixed(1),score:c.goals*c.lw*c.lw})).sort((a,b)=>b.points-a.points||b.assists-a.assists||(a.id<b.id?-1:1));
    let cruyff=[];try{cruyff=(WS()?.coachesTop?.(s,60)||[]).filter(c=>leagueWeight(s,(c.competitionIds||[])[0])>=.8).sort((a,b)=>num(b.points)-num(a.points)).slice(0,5).map((c,i)=>({rank:i+1,name:c.name,club:c.club,clubId:c.clubId,points:Math.round(num(c.points)),titles:num(c.titles)}));}catch(e){}
    const rec={season,closeDay:s.day,revealDay:dayOfDate(season,9,20),revealed:false,
      ballon:ballon.slice(0,30).map((c,i)=>compact(c,i+1)),theBest:best.slice(0,10).map((c,i)=>compact(c,i+1)),kopa:kopa.slice(0,10).map((c,i)=>compact(c,i+1)),yashin:yashin.slice(0,10).map((c,i)=>compact(c,i+1)),gerd:gerd.slice(0,10).map((c,i)=>compact(c,i+1)),cruyff,
      candidates:ps.length,ucl:base.ucl};
    const hero=ballon.findIndex(c=>c.id==="hero");if(hero>=0)rec.hero={rank:hero+1,points:ballon[hero].points,score:+ballon[hero].score.toFixed(1),of:ballon.length};
    hs.seasons[String(season)]=rec;
    // finalistas ficam marcados (aposentadoria notavel)
    if(!opts.preview)try{for(const c of rec.ballon){const p=c.id==="hero"?null:GF()?.playerById?.(s,c.id);if(p)p.honorNominee=season;}}catch(e){}
    // armazenamento compacto: temporadas antigas guardam so o pódio e o top-5
    const keys=Object.keys(hs.seasons).map(Number).sort((a,b)=>b-a);
    for(const k of keys.slice(12)){const r=hs.seasons[k];if(r&&!r.compact){for(const f of ["ballon","theBest","kopa","yashin","gerd"])r[f]=(r[f]||[]).slice(0,5).map(x=>({rank:x.rank,id:x.id,name:x.name,club:x.club,clubId:x.clubId,nat:x.nat,points:x.points,hero:x.hero}));r.compact=true;}}
    return rec;
  }
  // ---------- cerimônia ----------
  function daily(s,api,hooks={}){
    if(s.day>=dayOfDate(s.season,8,25)&&!s.honors?.seasons?.[String(s.season)]){try{compute(s,api);}catch(e){}}
    const cur=s.honors?.seasons?.[String(s.season)];
    if(cur&&!cur.nomsAnnounced&&!cur.revealed&&s.day>=dayOfDate(s.season,8,25)){
      cur.nomsAnnounced=true;
      try{api?.Career?.addArticle?.(s,{category:"MUNDO",title:`Bola de Ouro ${cur.season}: indicados divulgados`,body:`Os 30 indicados à Bola de Ouro ${cur.season} foram anunciados. O vencedor será revelado em 20 de outubro.${cur.hero?` Você está entre os indicados.`:""}`,eventId:`honors:noms:${cur.season}`});}catch(e){}
      try{if(s.mode==="player"&&cur.hero)api?.Career?.addMessage?.(s,{category:"PREMIOS",sender:"Prêmios mundiais",subject:`Você é indicado à Bola de Ouro ${cur.season}`,body:"Seu nome está na lista dos 30 indicados. O resultado sai em 20 de outubro.",priority:"ALTA",eventId:`honors:noms:${cur.season}:hero`});}catch(e){}
    }
    const hs=s.honors;if(!hs?.seasons)return 0;let n=0;
    for(const rec of Object.values(hs.seasons)){
      if(!rec||rec.revealed||s.day<num(rec.revealDay,Infinity))continue;
      rec.revealed=true;rec.revealedDay=s.day;n++;
      const w=rec.ballon?.[0];if(!w)continue;
      const p2=rec.ballon[1],p3=rec.ballon[2];
      const text=`${w.name} (${w.club}) vence a Bola de Ouro ${rec.season} com ${w.points} pontos. Em seguida: ${p2?p2.name:"—"} e ${p3?p3.name:"—"}.`;
      try{api?.Career?.addArticle?.(s,{category:"MUNDO",title:`Bola de Ouro ${rec.season}: ${w.name}`,body:text,eventId:`honors:${rec.season}`});}catch(e){}
      try{hooks.log?.(`Bola de Ouro ${rec.season}`,text);}catch(e){}
      if(s.mode==="player"&&rec.hero){
        const r=rec.hero.rank;
        try{api?.Career?.addMessage?.(s,{category:"PREMIOS",sender:"Prêmios mundiais",subject:`Bola de Ouro ${rec.season}: você ficou em ${r}º`,body:r<=30?`Você foi um dos 30 finalistas da Bola de Ouro ${rec.season} e terminou em ${r}º lugar com ${rec.hero.points} pontos.`:`Você terminou em ${r}º na votação da Bola de Ouro ${rec.season}.`,priority:r<=3?"ALTA":"NORMAL",eventId:`honors:${rec.season}:hero`});}catch(e){}
      }
    }
    return n;
  }
  const latest=(s,revealedOnly=true)=>{const ks=Object.keys(s.honors?.seasons||{}).map(Number).sort((a,b)=>b-a);for(const k of ks){const r=s.honors.seasons[k];if(!revealedOnly||r.revealed)return r;}return null;};
  const winners=(s)=>Object.values(s.honors?.seasons||{}).filter(r=>r.revealed).sort((a,b)=>b.season-a.season);
  // prévia da temporada em andamento (não persistida; cache por assinatura)
  let previewCache=null;
  function preview(s,api){
    const W=WS();if(!W)return null;const sig=`${s.season}|${Math.floor(s.day/7)}`;
    if(previewCache&&previewCache.s===s&&previewCache.sig===sig)return previewCache.v;
    let v=null;try{v=compute(s,api,{force:true,preview:true});}catch(e){v=null;}
    previewCache={s,sig,v};return v;
  }
  // Cartões de prêmio mundial para a Central (mesmos dados da votação). Com cerimônia feita = vencedores; antes = líderes da corrida.
  function awardsFor(s,api,season){
    let rec=s.honors?.seasons?.[String(season??s.season)],partial=false;
    if(!rec||!(rec.revealed||s.day>=num(rec.revealDay,Infinity)))return null;
    if(!rec)return null;
    const mk=(cat,label,r,unit,value)=>r?{cat,label:partial?`Líder · ${label}`:label,playerId:r.id,name:r.name,clubId:r.clubId,club:r.club,pos:r.pos,value,unit,honors:true,partial}:null;
    const out=[
      mk("melhorMundo","Bola de Ouro",rec.ballon?.[0],"pontos",rec.ballon?.[0]?.points),
      mk("melhorMundoTB","The Best",rec.theBest?.[0],"pontos",rec.theBest?.[0]?.points),
      mk("jovemMundo","Troféu Kopa",rec.kopa?.[0],"pontos",rec.kopa?.[0]?.points),
      mk("goleiroMundo","Troféu Yashin",rec.yashin?.[0],"pontos",rec.yashin?.[0]?.points),
      mk("artilheiroMundo","Troféu Gerd Müller",rec.gerd?.[0],"gols",rec.gerd?.[0]?.goals)
    ].filter(Boolean);
    const c=rec.cruyff?.[0];
    if(c)out.push({cat:"treinadorMundo",label:partial?"Líder · Troféu Cruyff":"Troféu Cruyff",playerId:null,name:c.name,clubId:c.clubId,club:c.club,pos:"TEC",value:c.points,unit:"pontos",honors:true,partial});
    return {awards:out,partial,revealed:!!rec.revealed};
  }
  const api={VERSION,realUcl,awardsFor,compute,daily,latest,winners,preview,ceremonyDay,leagueWeight,build,vote};
  root.ProLifeWorldHonors=api;if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
