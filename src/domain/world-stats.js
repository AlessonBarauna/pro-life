(function(root){
  "use strict";
  // Stage 34F.28 - estatisticas individuais e premiacoes das ligas mundiais (FC 27).
  // Fonte: o resultado canonico de cada partida processada por WorldClubCompetitions (playRound chama record() uma unica vez
  // por partida). Gols/assistencias/notas sao distribuidos de forma deterministica entre o onze do clube NAQUELE momento.
  // Rankings e premios sao derivados; so os acumuladores e o arquivo de vencedores ficam no save (compactos).
  const VERSION=1,ARCHIVE_LIMIT=60;
  // Indices do acumulador por jogador: [jogos, gols, assistencias, notaX10, jogosSemSofrer, defesas, melhorEmCampo, minutos, clube]
  const A=0,G=1,AS=2,R=3,CS=4,SV=5,MV=6,MIN=7,CL=8;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const hash=value=>{let h=2166136261;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
  const unit=key=>hash(key)/4294967296;
  const Names=()=>root.ProLifeNames||(typeof require==="function"?require("./display-names.js"):null);
  const POS_SCORE={GOL:0,DEF:0.6,MEI:2.2,ATA:5}, POS_ASSIST={GOL:0,DEF:1.2,MEI:4,ATA:3};
  const FORMATION={GOL:1,DEF:4,MEI:3,ATA:3};
  const UNITS={gols:["gol","gols"],assistencias:["assistência","assistências"],jogos:["jogo","jogos"],defesas:["defesa","defesas"],motm:["prêmio de melhor em campo","prêmios de melhor em campo"],pontos:["ponto","pontos"],posicoes:["posição acima do esperado","posições acima do esperado"],cs:["jogo sem sofrer gols","jogos sem sofrer gols"]};

  // ---------- estado ----------
  function state(s){
    const g=s?.globalFootball;if(!g)return null;
    let ws=g.worldStats;
    if(!ws||typeof ws!=="object"||ws.version!==VERSION||(Number(ws.season)!==Number(s.season))){
      const archive=Array.isArray(ws?.archive)?ws.archive:[];
      ws=g.worldStats={version:VERSION,season:s.season,leagues:{},archive,matches:0};
    }
    if(!ws.leagues||typeof ws.leagues!=="object")ws.leagues={};
    if(!Array.isArray(ws.archive))ws.archive=[];
    return ws;
  }

  // ---------- elencos (indice reconstruido uma vez por dia) ----------
  const cache={day:null,ref:null,len:-1,clubs:null,byId:null};
  function index(s){
    const list=s.internationalPlayers||[];
    if(cache.day===s.day&&cache.ref===list&&cache.len===list.length&&cache.clubs)return cache;
    const clubs=new Map(),byId=new Map();
    for(const p of list){
      if(!p||!p.id)continue;byId.set(p.id,p);
      if(!p.clubId||p.status==="retired"||p.active===false||p.academy)continue;
      let l=clubs.get(p.clubId);if(!l){l=[];clubs.set(p.clubId,l);}l.push(p);
    }
    for(const l of clubs.values())l.sort((a,b)=>(Number(b.ovr??b.overall)||0)-(Number(a.ovr??a.overall)||0)||(a.id<b.id?-1:1));
    cache.day=s.day;cache.ref=list;cache.len=list.length;cache.clubs=clubs;cache.byId=byId;return cache;
  }
  const ovrOf=p=>Number(p.ovr??p.overall)||50;
  const available=p=>!p.injury&&!(p.suspension&&(p.suspension.games>0||p.suspension>0));
  function lineup(list,key){
    const need={...FORMATION},out=[],used=new Set();
    const take=(pos,count,tag)=>{
      const pool=list.filter(p=>p.pos===pos&&available(p)&&!used.has(p.id));
      for(let i=0;i<count&&pool.length;i++){
        // rotacao leve e deterministica: 10% de chance de o proximo da fila jogar no lugar do titular
        let k=0;if(pool.length>1&&unit(`${key}|${tag}|${i}`)<0.10)k=1;
        const p=pool.splice(k,1)[0];used.add(p.id);out.push(p);need[pos]--;
      }
    };
    for(const pos of ["GOL","DEF","MEI","ATA"])take(pos,FORMATION[pos],pos);
    if(out.length<11){const rest=list.filter(p=>p.pos!=="GOL"&&available(p)&&!used.has(p.id));for(const p of rest){if(out.length>=11)break;used.add(p.id);out.push(p);}}
    return out;
  }
  function pickWeighted(players,weightFn,key,exclude){
    let total=0;const ws=players.map(p=>{const w=p.id===exclude?0:Math.max(0,weightFn(p));total+=w;return w;});
    if(total<=0)return null;
    let r=unit(key)*total;
    for(let i=0;i<players.length;i++){r-=ws[i];if(r<=0&&ws[i]>0)return players[i];}
    return players[players.length-1];
  }
    // Armazenamento compacto: L.ids (ids sem o prefixo) + L.v (vetor plano, STRIDE numeros por jogador). Indice em memoria nao serializado.
  const STRIDE=9,PFX="fc27_p_",CPFX="gf_fc27_";
  const shortId=id=>String(id).startsWith(PFX)?String(id).slice(PFX.length):"~"+id;
  const longId=sid=>sid[0]==="~"?sid.slice(1):PFX+sid;
  function slot(L,id){
    if(!Array.isArray(L.ids)){L.ids=[];L.v=[];}
    let ix=L._ix;
    if(!ix||ix.size!==L.ids.length){ix=new Map();L.ids.forEach((x,i)=>ix.set(x,i));Object.defineProperty(L,"_ix",{value:ix,writable:true,configurable:true,enumerable:false});}
    const sid=shortId(id);let i=ix.get(sid);
    if(i===undefined){i=L.ids.length;L.ids.push(sid);for(let k=0;k<STRIDE;k++)L.v.push(0);ix.set(sid,i);}
    return i*STRIDE;
  }
  const clubOut=n=>n>=0?CPFX+n:null,clubIn=cid=>{const m=/^gf_fc27_(\d+)$/.exec(String(cid));return m?Number(m[1]):-1;};

  // ---------- registro de partida ----------
  function record(s,leagueId,home,away,hg,ag,round,pair,heroFixture){
    const ws=state(s);if(!ws)return false;
    const idx=index(s),L=ws.leagues[leagueId]||(ws.leagues[leagueId]={ids:[],v:[],n:0,r:-1});
    // protecao contra reprocessamento: rodadas e partidas chegam em ordem crescente
    if(round<L.r||(round===L.r&&pair<=(L.pr??-1)))return false;
    L.r=round;L.pr=pair;L.n++;ws.matches++;
    const sides=[[home,away,hg,ag],[away,home,ag,hg]],rated=[];
    for(const [cid,oid,gf,ga] of sides){
      // Partida do protagonista: os lances do clube dele ja estao nas estatisticas canonicas do motor; nao distribuimos de novo.
      if(heroFixture&&cid===s.clubId)continue;
      const base=`${s.season}|${leagueId}|${round}|${pair}|${cid}`,roster=idx.clubs.get(cid)||[];
      const xi=lineup(roster,base);if(!xi.length)continue;
      const avg=xi.reduce((n,p)=>n+ovrOf(p),0)/xi.length;
      const res=gf>ga?0.35:gf===ga?0.05:-0.25;
      const goals=new Map(),assists=new Map();
      for(let i=0;i<gf;i++){
        const sc=pickWeighted(xi,p=>POS_SCORE[p.pos]*Math.pow(ovrOf(p)/70,3),`${base}|g${i}`,null);
        if(!sc)continue;goals.set(sc.id,(goals.get(sc.id)||0)+1);
        if(unit(`${base}|a?${i}`)<0.62){const as=pickWeighted(xi,p=>POS_ASSIST[p.pos]*Math.pow(ovrOf(p)/70,2),`${base}|a${i}`,sc.id);if(as)assists.set(as.id,(assists.get(as.id)||0)+1);}
      }
      const shots=ga+1+Math.floor(unit(`${base}|sot`)*5);
      for(const p of xi){
        const g=goals.get(p.id)||0,a=assists.get(p.id)||0,isGk=p.pos==="GOL";
        let r=6.1+res+(ovrOf(p)-avg)*0.012+(unit(`${base}|r|${p.id}`)-0.5)*1.1+g*0.9+a*0.5;
        if(ga===0&&(isGk||p.pos==="DEF"))r+=0.4;
        const saves=isGk?Math.max(0,shots-ga):0;
        if(isGk)r+=Math.min(1,saves*0.12)-ga*0.15;
        r=clamp(r,4.5,10);
        const o=slot(L,p.id),v=L.v;
        v[o+A]++;v[o+G]+=g;v[o+AS]+=a;v[o+R]+=Math.round(r*10);v[o+MIN]+=90;v[o+CL]=clubIn(cid);
        if(ga===0&&(isGk||p.pos==="DEF"))v[o+CS]++;
        if(isGk)v[o+SV]+=saves;
        rated.push([r+unit(`${base}|t|${p.id}`)*0.001,L,o]);
      }
    }
    if(rated.length){rated.sort((x,y)=>y[0]-x[0]);rated[0][1].v[rated[0][2]+MV]++;}
    return true;
  }

  // ---------- linhas de ranking ----------
  const rowKey=new WeakMap();
  function heroRow(s,leagueId){
    const h=s.statistics?.players?.hero,c=h?.byCompetition?.[leagueId];
    if(!c||!(Number(c.appearances)>0))return null;
    return {id:"hero",name:s.person?.name||"Protagonista",pos:s.person?.pos||"MEI",age:Number(s.person?.age)||0,clubId:s.clubId,leagueId,hero:true,
      apps:Number(c.appearances)||0,goals:Number(c.goals)||0,assists:Number(c.assists)||0,avg:Number(c.appearances)?Number(c.ratingTotal||0)/Number(c.appearances):0,
      cs:0,saves:Number(c.saves)||0,motm:Number(c.motm)||0};
  }
  function rowsOf(s,leagueId){
    const ws=state(s),L=ws?.leagues[leagueId];if(!L)return [];
    const idx=index(s),N=Names(),sig=`${ws.matches}|${s.day}`,hit=rowKey.get(L);
    if(hit&&hit.sig===sig)return hit.rows;
    const rows=[];
    const ids=L.ids||[],v=L.v||[];
    for(let i=0;i<ids.length;i++){
      const id=longId(ids[i]),o=i*STRIDE,p=idx.byId.get(id);if(!p)continue;
      rows.push({id,name:p.name,pos:p.pos,age:Number(p.age)||(s.season-Number(p.birthYear||s.season-25)),clubId:clubOut(v[o+CL])||p.clubId,leagueId,apps:v[o+A],goals:v[o+G],assists:v[o+AS],avg:v[o+A]?v[o+R]/v[o+A]/10:0,cs:v[o+CS],saves:v[o+SV],motm:v[o+MV]});
    }
    const hr=heroRow(s,leagueId);if(hr)rows.push(hr);
    for(const r of rows)r.club=N?N.club(s,r.clubId):String(r.clubId||"—");
    rowKey.set(L,{sig,rows});return rows;
  }
  function minApps(s,leagueId){
    const L=state(s)?.leagues[leagueId];const rounds=Math.max(0,(L?.r??-1)+1);
    return Math.max(2,Math.floor(rounds*0.5));
  }
  function tableRank(s,leagueId){
    const t=s.globalFootball?.worldCompetitions?.leagues?.[leagueId]?.table||{},ids=Object.keys(t);
    const sorted=ids.sort((a,b)=>t[b][6]-t[a][6]||(t[b][4]-t[b][5])-(t[a][4]-t[a][5])||t[b][4]-t[a][4]||(a<b?-1:1));
    const rank=new Map(sorted.map((id,i)=>[id,i+1]));return {rank,n:ids.length,table:t};
  }
  function score(s,r,leagueId,tr){
    const rk=tr.rank.get(r.clubId)||Math.ceil(tr.n/2),team=tr.n>1?(0.5-(rk-1)/(tr.n-1))*3:0;
    let v=r.avg*10+r.goals*0.55+r.assists*0.35+r.motm*0.4+team;
    if(r.pos==="GOL")v+=r.cs*0.4+r.saves*0.02;else if(r.pos==="DEF")v+=r.cs*0.2;
    return v;
  }
  function leagueStrength(s,leagueId){
    const ids=s.globalFootball?.worldCompetitions?.leagues?.[leagueId]?.clubIds||[];
    const map=new Map((s.globalFootball?.clubs||[]).map(c=>[c.id,c]));
    let sum=0,n=0;for(const id of ids){const c=map.get(id);if(c&&Number.isFinite(Number(c.strength))){sum+=Number(c.strength);n++;}}
    return n?sum/n:60;
  }
  const qualityFactor=(s,leagueId)=>0.85+0.3*clamp((leagueStrength(s,leagueId)-55)/35,0,1);

  // ---------- premios ----------
  const award=(cat,label,row,value,unitKey,extra)=>({cat,label,playerId:row.id,name:row.name,clubId:row.clubId,club:row.club,pos:row.pos,value,unit:unitKey,...(extra||{})});
  function best(rows,cmp){let b=null;for(const r of rows)if(!b||cmp(r,b)<0)b=r;return b;}
  function leagueAwards(s,leagueId,opts={}){
    const rows=rowsOf(s,leagueId),min=opts.min??minApps(s,leagueId),tr=tableRank(s,leagueId);
    const eligible=rows.filter(r=>r.apps>=min).map(r=>({...r,score:score(s,r,leagueId,tr)}));
    const out=[];const insufficient=[];
    const push=(cat,label,w,value,u,extra)=>{if(w){if(value==="@goals")value=w.goals;else if(value==="@assists")value=w.assists;out.push(award(cat,label,w,value,u,extra));}else insufficient.push({cat,label});};
    const goalsRows=rows.filter(r=>r.goals>0),assistRows=rows.filter(r=>r.assists>0);
    push("artilheiro","Artilheiro",best(goalsRows,(a,b)=>b.goals-a.goals||b.assists-a.assists||a.apps-b.apps||b.avg-a.avg||(a.id<b.id?-1:1)),"@goals","gols");
    push("assistencias","Líder de assistências",best(assistRows,(a,b)=>b.assists-a.assists||b.goals-a.goals||a.apps-b.apps||b.avg-a.avg||(a.id<b.id?-1:1)),"@assists","assistencias");
    const star=best(eligible,(a,b)=>b.score-a.score||(a.id<b.id?-1:1));
    push("craque","Craque da competição",star,star&&+star.avg.toFixed(2),"nota");
    const rev=best(eligible.filter(r=>r.age<=21),(a,b)=>b.score-a.score||(a.id<b.id?-1:1));
    push("revelacao","Revelação",rev,rev&&+rev.avg.toFixed(2),"nota");
    const gk=best(eligible.filter(r=>r.pos==="GOL"),(a,b)=>b.score-a.score||(a.id<b.id?-1:1));
    push("goleiro","Melhor goleiro",gk,gk&&gk.saves,"defesas",gk?{cs:gk.cs}:null);
    const mv=best(rows.filter(r=>r.motm>0),(a,b)=>b.motm-a.motm||b.avg-a.avg||(a.id<b.id?-1:1));
    push("melhorEmCampo","Mais vezes melhor em campo",mv,mv&&mv.motm,"motm");
    const coach=bestCoach(s,leagueId);
    if(coach)out.push(coach);else insufficient.push({cat:"treinador",label:"Melhor treinador"});
    // Selecao da temporada 4-3-3, sem repetir jogadores
    const xi=[];const used=new Set();
    for(const pos of ["GOL","DEF","MEI","ATA"]){
      const pool=eligible.filter(r=>r.pos===pos).sort((a,b)=>b.score-a.score||(a.id<b.id?-1:1));
      for(const r of pool){if(xi.filter(x=>x.pos===pos).length>=FORMATION[pos])break;if(used.has(r.id))continue;used.add(r.id);xi.push({pos,playerId:r.id,name:r.name,clubId:r.clubId,club:r.club,score:+r.score.toFixed(1),avg:+r.avg.toFixed(2),goals:r.goals,assists:r.assists});}
    }
    const complete=xi.length===11;
    return {leagueId,min,played:rowsPlayed(s,leagueId),awards:out,insufficient,xi,xiComplete:complete,pool:eligible.length};
  }
  function rowsPlayed(s,leagueId){return Math.max(0,(state(s)?.leagues[leagueId]?.r??-1)+1);}
  function bestCoach(s,leagueId){
    const intel=s.globalFootball?.intel?.coaches;if(!intel)return null;
    const w=s.globalFootball?.worldCompetitions?.leagues?.[leagueId];if(!w||rowsPlayed(s,leagueId)<Math.max(3,Math.floor((w.clubIds.length-1)*0.5)))return null;
    const clubs=new Map((s.globalFootball.clubs||[]).map(c=>[c.id,c])),tr=tableRank(s,leagueId);
    const byStrength=w.clubIds.slice().sort((a,b)=>(Number(clubs.get(b)?.strength)||0)-(Number(clubs.get(a)?.strength)||0)||(a<b?-1:1));
    const exp=new Map(byStrength.map((id,i)=>[id,i+1]));
    let pick=null;
    for(const id of w.clubIds){
      const c=intel[id];if(!c)continue;const over=exp.get(id)-(tr.rank.get(id)||exp.get(id)),pts=tr.table[id]?.[6]||0;
      const cand={id,over,pts,coach:c.name};
      if(!pick||cand.over>pick.over||(cand.over===pick.over&&cand.pts>pick.pts)||(cand.over===pick.over&&cand.pts===pick.pts&&cand.id<pick.id))pick=cand;
    }
    if(!pick||pick.over<=0)return null; // sem superacao do esperado nao ha vencedor
    const N=Names();
    return {cat:"treinador",label:"Melhor treinador",playerId:null,name:pick.coach,clubId:pick.id,club:N?N.club(s,pick.id):pick.id,pos:"TEC",value:pick.over,unit:"posicoes",extra:{points:pick.pts}};
  }

  // ---------- mundo ----------
  function leagueIds(s){return Object.keys(state(s)?.leagues||{});}
  function worldRows(s){
    const out=[];
    for(const id of leagueIds(s)){
      const q=qualityFactor(s,id),min=minApps(s,id),tr=tableRank(s,id);
      for(const r of rowsOf(s,id)){const sc=score(s,r,id,tr);out.push({...r,min,score:sc,wscore:sc*q,eligible:r.apps>=min});}
    }
    return out;
  }
  function worldAwards(s){
    const rows=worldRows(s),el=rows.filter(r=>r.eligible),out=[],insufficient=[];
    const push=(cat,label,w,value,u)=>{if(w)out.push({...award(cat,label,w,value,u),leagueId:w.leagueId});else insufficient.push({cat,label});};
    const tie=(a,b)=>a.id<b.id?-1:1;
    const star=best(el,(a,b)=>b.wscore-a.wscore||tie(a,b));push("melhorMundo","Melhor jogador do mundo",star,star&&+star.avg.toFixed(2),"nota");
    const young=best(el.filter(r=>r.age<=21),(a,b)=>b.wscore-a.wscore||tie(a,b));push("jovemMundo","Melhor jovem do mundo",young,young&&+young.avg.toFixed(2),"nota");
    const gk=best(el.filter(r=>r.pos==="GOL"),(a,b)=>b.wscore-a.wscore||tie(a,b));push("goleiroMundo","Melhor goleiro do mundo",gk,gk&&gk.saves,"defesas");
    const gs=best(rows.filter(r=>r.goals>0),(a,b)=>b.goals-a.goals||b.assists-a.assists||a.apps-b.apps||tie(a,b));push("artilheiroMundo","Artilheiro global",gs,gs&&gs.goals,"gols");
    const as=best(rows.filter(r=>r.assists>0),(a,b)=>b.assists-a.assists||b.goals-a.goals||a.apps-b.apps||tie(a,b));push("assistenciasMundo","Líder global de assistências",as,as&&as.assists,"assistencias");
    let coach=null;
    for(const id of leagueIds(s)){const c=bestCoach(s,id);if(c&&(!coach||c.value>coach.value||(c.value===coach.value&&c.extra.points>coach.extra.points)))coach={...c,leagueId:id};}
    if(coach)out.push(coach);else insufficient.push({cat:"treinadorMundo",label:"Melhor treinador"});
    return {awards:out,insufficient};
  }
  function leaders(s,{leagueId=null,stat="goals",limit=10,min=0}={}){
    const rows=leagueId?rowsOf(s,leagueId):worldRows(s);
    const key={goals:r=>r.goals,assists:r=>r.assists,rating:r=>r.avg,saves:r=>r.saves,motm:r=>r.motm,apps:r=>r.apps}[stat]||(r=>r.goals);
    const floor=stat==="rating"?(min||(leagueId?minApps(s,leagueId):3)):min;
    return rows.filter(r=>r.apps>=floor&&(stat==="rating"||key(r)>0)).sort((a,b)=>key(b)-key(a)||b.goals-a.goals||b.assists-a.assists||a.apps-b.apps||(a.id<b.id?-1:1)).slice(0,limit).map(r=>({...r,value:key(r)}));
  }
  function youngLeaders(s,limit=10){return worldRows(s).filter(r=>r.eligible&&r.age<=21).sort((a,b)=>b.wscore-a.wscore||(a.id<b.id?-1:1)).slice(0,limit).map(r=>({...r,value:r.avg}));}
  function keepersTop(s,limit=10){return worldRows(s).filter(r=>r.eligible&&r.pos==="GOL").sort((a,b)=>b.wscore-a.wscore||(a.id<b.id?-1:1)).slice(0,limit).map(r=>({...r,value:r.saves}));}
  function coachesTop(s,limit=10){
    const out=[];for(const id of leagueIds(s)){const c=bestCoach(s,id);if(c)out.push({...c,leagueId:id});}
    return out.sort((a,b)=>b.value-a.value||b.extra.points-a.extra.points||(a.clubId<b.clubId?-1:1)).slice(0,limit);
  }

  // ---------- fechamento e historico ----------
  function leagueName(s,id){const N=Names();return N?N.league(s,id):id;}
  function closeSeason(s){
    const ws=state(s);if(!ws)return 0;let added=0;
    const has=(season,leagueId)=>ws.archive.some(a=>a.season===season&&a.leagueId===leagueId);
    for(const id of leagueIds(s)){
      if(has(s.season,id)||!ws.leagues[id].n)continue;
      const r=leagueAwards(s,id,{min:minApps(s,id)});
      const champId=s.globalFootball?.worldCompetitions?.leagues?.[id]?.championId||null,N=Names();
      ws.archive.unshift({season:s.season,leagueId:id,league:leagueName(s,id),champion:champId?(N?N.club(s,champId):champId):null,championId:champId,awards:r.awards,xi:r.xi,insufficient:r.insufficient.map(x=>x.cat),matches:ws.leagues[id].n});
      added++;
    }
    if(!has(s.season,"world")&&ws.matches>0){
      const w=worldAwards(s);ws.archive.unshift({season:s.season,leagueId:"world",league:"Prêmios mundiais",awards:w.awards,xi:[],insufficient:w.insufficient.map(x=>x.cat),matches:ws.matches});added++;
    }
    if(ws.archive.length>ARCHIVE_LIMIT*6)ws.archive=ws.archive.slice(0,ARCHIVE_LIMIT*6);
    return added;
  }
  function history(s,{leagueId=null,season=null}={}){
    const ws=state(s);return (ws?.archive||[]).filter(a=>(!leagueId||a.leagueId===leagueId)&&(season==null||a.season===season));
  }
  function heroAwards(s){
    const out=[];for(const a of state(s)?.archive||[])for(const w of a.awards||[])if(w.playerId==="hero")out.push({season:a.season,leagueId:a.leagueId,league:a.league,...w});
    return out;
  }
  function competitions(s){
    const ws=state(s);if(!ws)return [];
    const gl=new Map((s.globalFootball?.leagues||[]).map(l=>[l.id,l]));
    return Object.keys(ws.leagues).map(id=>({id,name:leagueName(s,id),country:gl.get(id)?.country||"",rounds:rowsPlayed(s,id),matches:ws.leagues[id].n})).sort((a,b)=>a.country.localeCompare(b.country)||a.name.localeCompare(b.name));
  }
  // posicao do protagonista nas listas da liga (evolucao nos rankings)
  function heroStanding(s,leagueId){
    const h=heroRow(s,leagueId);if(!h)return null;
    const pos=stat=>{const l=leaders(s,{leagueId,stat,limit:9999,min:0});const i=l.findIndex(x=>x.id==="hero");return i<0?null:i+1;};
    return {goals:h.goals,assists:h.assists,apps:h.apps,avg:+h.avg.toFixed(2),rankGoals:pos("goals"),rankAssists:pos("assists"),rankRating:pos("rating")};
  }

  // ---------- formatacao ----------
  const pt=n=>String(n).replace(".",",");
  function format(unitKey,value){
    if(value==null||value===""||(typeof value==="number"&&!Number.isFinite(value)))return "Dados insuficientes";
    if(unitKey==="nota")return `Nota ${pt(Number(value).toFixed(2))}`;
    const u=UNITS[unitKey];
    if(!u)return pt(String(value));
    const n=Number(value);return `${pt(String(n))} ${Math.abs(n)===1?u[0]:u[1]}`;
  }
  const UNIT_BY_NAME=[[/artilheiro/i,"gols"],[/assist/i,"assistencias"],[/melhor em campo/i,"motm"],[/goleiro/i,"defesas"],[/craque|melhor jogador|revela|jovem|desempenho|m[eé]dia/i,"nota"],[/t[eé]cnico|treinador/i,"pontos"]];
  // Para premios gravados pelo sistema antigo (so tem nome e valor).
  function formatByName(name,value){const hit=UNIT_BY_NAME.find(([re])=>re.test(String(name||"")));return format(hit?hit[1]:"jogos",value);}
  function formatAward(a){return format(a.unit,a.value);}

  const api={VERSION,init:state,record,rowsOf,minApps,leagueAwards,worldAwards,leaders,youngLeaders,keepersTop,coachesTop,closeSeason,history,heroAwards,heroStanding,competitions,format,formatByName,formatAward,UNITS};
  root.ProLifeWorldStats=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
