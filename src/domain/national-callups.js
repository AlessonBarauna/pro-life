(function(root){
  "use strict";
  // 34F.30D - Convocacoes da selecao como evento da carreira (todas as selecoes representadas).
  // Calendario de referencia do PRO-LIFE (NAO e o calendario oficial da FIFA): janelas calculadas por temporada a partir do dia da semana.
  // Partidas so existem onde ha competicao internacional simulada (Brasil pelo fluxo existente; demais selecoes: Copa do Mundo).
  // Estado persistido em s.nationalCallups (aditivo; saves antigos ganham o objeto sob demanda). Nada do save existente e reescrito.
  const NIM=()=>root.ProLifeNationalIdentity||(typeof require==="function"?(()=>{try{return require("./national-identity.js");}catch(e){return null;}})():null);
  const MONTH_START=[0,31,59,90,120,151,181,212,243,273,304,334,365];
  const MONTHS=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  const QUOTA={GOL:3,DEF:8,MEI:8,ATA:7},SHAPE={GOL:1,DEF:4,MEI:3,ATA:3};
  // [tipo, mes(0-11), dia nominal, rotulo]; a janela comeca na primeira segunda-feira a partir da data nominal.
  const NOMINAL=[["MAR",2,22,"Data FIFA de março"],["JUN",5,3,"Data FIFA de junho"],["SEP",8,21,"Data FIFA de setembro"],["OCT",9,5,"Data FIFA de outubro"],["NOV",10,9,"Data FIFA de novembro"]];
  const WC_OPEN_DOY=161; // abertura da Copa (11/06), igual ao fluxo existente da Copa
  const weekday=d=>(((d+3)%7)+7)%7; // 0=segunda; dia 0 da carreira = 01/01/2026 (quinta)
  const isWorldCupYear=season=>season>=2026&&(season-2026)%4===0;
  function dateOf(day){
    const y=2026+Math.floor(day/365),doy=((day%365)+365)%365;let m=0;while(m<11&&doy>=MONTH_START[m+1])m++;
    return {year:y,month:m,dom:doy-MONTH_START[m]+1};
  }
  function fmt(day){if(!Number.isFinite(day))return "—";const d=dateOf(day);return `${String(d.dom).padStart(2,"0")}/${String(d.month+1).padStart(2,"0")}/${d.year}`;}
  function window(season,kind,label,start,extra){
    return Object.assign({id:`${season}:${kind}`,season,kind,label,announceDay:start-7,preDay:start-11,presentationDay:start,matchDays:[start+3,start+6],endDay:start+7,returnDay:start+8,source:"referencia-pro-life"},extra||{});
  }
  // Janelas fixas do calendario de referencia da temporada (nao dependem da selecao).
  function referenceWindows(season){
    const base=(season-2026)*365,out=[];
    for(const [kind,m,dom,label] of NOMINAL){
      if(kind==="JUN"&&isWorldCupYear(season))continue; // ano de Copa: junho pertence ao torneio
      const nominal=base+MONTH_START[m]+dom-1,start=nominal+((7-weekday(nominal))%7);
      out.push(window(season,kind,label,start));
    }
    return out;
  }
  function init(s,create){
    if(s.nationalCallups&&typeof s.nationalCallups==="object"){
      const c=s.nationalCallups;if(!c.records)c.records={};if(!Array.isArray(c.order))c.order=[];if(!c.pre)c.pre={};return c;
    }
    if(!create)return {version:1,startedDay:s.day,records:{},order:[],pre:{},duty:null,virtual:true};
    s.nationalCallups={version:1,startedDay:s.day,records:{},order:[],pre:{},duty:null};return s.nationalCallups;
  }
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  // worldCupOf custa ~1,5 s: so e consultado perto da Copa e o resultado fica em cache (por estado) para nao pesar no dia a dia.
  const wcCache=new WeakMap();
  function ntTournament(s,year){
    const list=(s&&s.nationalTeam&&s.nationalTeam.tournaments)||[];
    return list.find(t=>t&&t.type==="WORLD_CUP"&&Number(t.year)===Number(year))||null;
  }
  function trackedOf(t){const id=t&&t.trackedTeamId;return id===undefined||id===null?"BRA":String(id);}
  function worldCupWindow(s,D,team){
    if(!isWorldCupYear(s.season)||!team||team.code==="BRA")return null;
    // 34F.30E: se a Copa do fluxo oficial (NationalTeam) acompanha esta selecao, a convocacao vem de la (braDecisions).
    const ntCup=ntTournament(s,s.season);
    if(ntCup&&trackedOf(ntCup)===team.code)return null;
    if(!ntCup&&s.season>2026)return null;
    const open=(s.season-2026)*365+WC_OPEN_DOY;
    if(s.day<open-60||s.day>open+90)return null;
    const key=`${s.season}|${team.code}`;let m=wcCache.get(s);if(!m){m=new Map();wcCache.set(s,m);}
    const hit=m.get(key);if(hit&&(hit.value||s.day-hit.day<10))return hit.value;
    const NI=NIM();let wc=null;try{wc=NI.worldCupOf(s,D,team);}catch(e){}
    const value=wc&&wc.qualified?buildWc(s,wc,open):null;
    m.set(key,{value,day:s.day});return value;
  }
  function buildWc(s,wc,open){
    const days=[].concat(wc.matches||[],wc.knockout||[]).map(m=>Number(m&&m.day)).filter(Number.isFinite);
    const last=days.length?Math.max(...days):open+24;
    return {id:`${s.season}:COPA`,season:s.season,kind:"COPA",label:"Copa do Mundo",announceDay:open-14,preDay:open-19,presentationDay:open-8,matchDays:days.slice(),endDay:last,returnDay:last+1,source:"copa-simulada",competition:`Copa do Mundo ${s.season}`};
  }
  function windowsFor(s,D,team){
    const list=referenceWindows(s.season).map(w=>Object.assign(w,{competition:`${w.label}${team&&team.confederation?` · ${team.confederation}`:""}`}));
    const wc=worldCupWindow(s,D,team);if(wc)list.push(wc);
    return list.sort((a,b)=>a.announceDay-b.announceDay);
  }
  // ---- avaliacao esportiva (mecanismo global; GER canonico da 34F.30C) ----
  function formOf(s){
    const e=(s.career&&s.career.playerCareer)||s.playerCareer||{};const played=Number(e.played||0);
    if(played<3)return 0;return +clamp((Number(e.ratingTotal||0)/played-6.6)*2,-3,3).toFixed(1);
  }
  const prior=(c,code)=>Object.values(c.records).filter(r=>r.teamCode===code&&r.called&&r.stage!=="cancelled").length;
  function evaluate(s,D,team,opts){
    const NI=NIM(),c=init(s),hero=s.person,pos=hero.pos;
    const ger=NI.gerOf(hero,D),form=formOf(s),prev=prior(c,team.code),exp=Math.min(3,prev)*0.5;
    const total=+(ger+form+exp).toFixed(1);
    const injured=Number(hero.injury||0)>0,suspended=!!(hero.suspension&&(hero.suspension.games>0||hero.suspension>0));
    const pool=NI.pool(s,D,team).filter(p=>p.id!=="hero"&&p.available);
    const same=pool.filter(p=>p.pos===pos);
    const better=same.filter(p=>p.overall>total||(p.overall===total&&(p.age<Number(hero.age||0)||(p.age===Number(hero.age||0)&&String(p.id)<"hero")))).length;
    const rank=better+1,quota=QUOTA[pos]||7;
    const reasons=[];
    if(injured)reasons.push("lesionado");if(suspended)reasons.push("suspenso");
    const hs=(s.statistics&&s.statistics.players&&s.statistics.players.hero)||{},natApps=Number(hs.byCompetition&&hs.byCompetition.nationalTeam&&hs.byCompetition.nationalTeam.appearances)||0;
    const debuted=(Number(hs.appearances)||0)-natApps>0;   // so e convocado quem ja estreou como profissional
    if(!debuted)reasons.push("ainda sem jogos oficiais pelo clube");
    const called=debuted&&!injured&&!suspended&&rank<=quota;
    if(debuted&&!injured&&!suspended)reasons.push(called?`${rank}º entre ${same.length+1} em ${pos} (${quota} vagas)`:`${rank}º entre ${same.length+1} em ${pos} (${quota} vagas)`);
    const role=!called?null:rank<=SHAPE[pos]?"Titular provável":rank<=SHAPE[pos]+2?"Disputa por posição":"Reserva";
    // lista de convocados: demais atletas reais disponiveis + o protagonista se escolhido, por posicao
    const list=[];
    for(const p of ["GOL","DEF","MEI","ATA"]){
      const rows=pool.filter(x=>x.pos===p).map(x=>({id:x.id,name:x.name,pos:x.pos,club:x.club,age:x.age,ger:x.overall,hero:false}));
      if(p===pos&&called)rows.push({id:"hero",name:hero.name,pos,club:null,age:Number(hero.age||0),ger:ger,hero:true,_s:total});
      rows.sort((a,b)=>(b._s!=null?b._s:b.ger)-(a._s!=null?a._s:a.ger)||a.age-b.age||String(a.id).localeCompare(String(b.id)));
      list.push(...rows.slice(0,QUOTA[p]).map(r=>{const o=Object.assign({},r);delete o._s;return o;}));
    }
    return {ger,form,experience:exp,total,injured,suspended,rank,quota,positionTotal:same.length+1,called,role,reasons,list,eligible:pool.length,prior:prev};
  }
  // Escalacao de referencia da lista oficial (titulares/reservas); o protagonista entra pela nota composta (GER + forma + experiencia).
  function lineupOf(ev){
    const NI=NIM();if(!ev.list.length)return {formation:"4-3-3",starters:[],bench:[],heroStatus:"nao_relacionado"};
    const items=ev.list.map(p=>Object.assign({},p,{overall:p.hero?ev.total:p.ger}));
    const lu=NI.lineupFrom(items,"4-3-3");
    const starters=lu.starters.map(p=>p.id),bench=lu.bench.map(p=>p.id);
    return {formation:lu.formation,starters,bench,heroStatus:!ev.called?"nao_relacionado":starters.includes("hero")?"titular":"reserva"};
  }
  const preview=(s,D)=>{
    const NI=NIM(),team=NI.heroTeam(s,D);if(!team.represented)return null;
    const win=nextWindow(s,D,team);return {window:win,evaluation:evaluate(s,D,team)};
  };
  function nextWindow(s,D,team){
    const t=team||NIM().heroTeam(s,D);if(!t.represented)return null;
    const all=windowsFor(s,D,t).concat(t.code==="BRA"?[]:referenceWindows(s.season+1).map(w=>Object.assign(w,{competition:w.label})));
    return all.find(w=>w.returnDay>=s.day)||null;
  }
  // ---- eventos ----
  function clubNameOf(s,D){try{const C=root.ProLifeCareerContext;return C?C.clubName(s,D):null;}catch(e){return null;}}
  function newRecord(s,win,team,ev,extra){
    return Object.assign({id:`NC:${win.id}:${team.code}`,windowId:win.id,season:win.season,kind:win.kind,label:win.label,competition:win.competition,teamCode:team.code,teamName:team.name,
      announceDay:win.announceDay,presentationDay:win.presentationDay,matchDays:win.matchDays,endDay:win.endDay,returnDay:win.returnDay,source:win.source,
      announcedDay:null,stage:"announced",called:false,first:false,priorCallups:0,rank:null,quota:null,score:null,role:null,reasons:[],list:[],
      clubAtAnnounce:null,interrupt:false,ack:true,ackDay:null,withdrawn:null,matches:[],
      note:win.source==="copa-simulada"?"Partidas da Copa conforme o torneio simulado.":"Sem partidas simuladas nesta janela: o PRO-LIFE não inventa confrontos fora de uma competição internacional simulada."},extra||{});
  }
  function announce(s,D,win,team,log){
    const c=init(s,true),id=`NC:${win.id}:${team.code}`;if(c.records[id])return null;
    const ev=evaluate(s,D,team);
    const important=win.kind==="COPA"&&!ev.called&&!ev.injured&&!ev.suspended&&(ev.prior>0||ev.rank<=ev.quota+3);
    const rec=newRecord(s,win,team,ev,{announcedDay:s.day,called:ev.called,first:ev.called&&ev.prior===0,priorCallups:ev.prior,rank:ev.rank,quota:ev.quota,
      score:{ger:ev.ger,form:ev.form,experience:ev.experience,total:ev.total},role:ev.role,reasons:ev.reasons,list:ev.list.map(p=>p.hero?Object.assign({},p,{club:clubNameOf(s,D)}):p),
      clubAtAnnounce:s.clubId||null,positionTotal:ev.positionTotal,eligible:ev.eligible,lineup:lineupOf(ev)});
    rec.interrupt=ev.called||important;rec.ack=!rec.interrupt;
    c.records[id]=rec;c.order.push(id);
    const who=`${s.person.name} · ${team.name}`;
    if(ev.called)log&&log(s,rec.first?"PRIMEIRA CONVOCAÇÃO":`Convocação · ${team.name}`,`${who}: convocado para ${win.competition}. Apresentação em ${fmt(win.presentationDay)}.`);
    else log&&log(s,`Convocação · ${team.name}`,`${who}: fora da lista para ${win.competition} (${ev.injured?"lesionado":ev.suspended?"suspenso":`${ev.rank}º em ${s.person.pos}, ${ev.quota} vagas`}).`);
    return rec;
  }
  // Selecao do Brasil: a decisao vem do fluxo existente (national-team.js); aqui ela vira evento persistido, sem recalcular.
  function braDecisions(s,D,team,log){
    const n=s.nationalTeam;if(!n||!n.callupDecisions||!team.code)return;
    const c=init(s,true);
    for(const key of Object.keys(n.callupDecisions)){
      const d=n.callupDecisions[key];if(!d||!Number.isFinite(Number(d.windowDay)))continue;
      const wd=Number(d.windowDay),dayD=Number(d.day);
      if(!(dayD>=c.startedDay)||dayD>s.day||s.day>wd+6)continue;
      const season=2026+Math.floor(wd/365),isWc=(wd%365)===WC_OPEN_DOY;
      if(team.code!=="BRA"){const t=ntTournament(s,season);if(!isWc||!t||trackedOf(t)!==team.code)continue;}
      const id=`NC:${team.code}:${wd}:${team.code}`;if(c.records[id])continue;
      const matches=(n.schedule||[]).filter(m=>m.windowDay===wd).map(m=>({day:m.day,opponent:m.opponent||m.away||m.home||null,competition:m.competition||null,played:!!m.played}));
      const win={id:`${season}:${team.code}:${wd}`,season,kind:isWc?"COPA":"BRA",label:isWc?"Copa do Mundo":"Data FIFA",competition:n.competition||(isWc?"Copa do Mundo":"Data FIFA"),
        announceDay:dayD,presentationDay:wd-2,matchDays:matches.map(m=>m.day),endDay:wd+4,returnDay:wd+5,source:"national-team"};
      const ev=d.calledUp?evaluate(s,D,team):null;
      const rec=newRecord(s,win,team,ev,{id,announcedDay:dayD,called:!!d.calledUp,first:!!d.calledUp&&(n.callups||0)<=1,priorCallups:Math.max(0,(n.callups||0)-(d.calledUp?1:0)),
        role:d.calledUp?String(d.status||""):null,reasons:[d.status||""],list:ev?ev.list:[],lineup:ev?lineupOf(ev):{formation:"4-3-3",starters:[],bench:[],heroStatus:"nao_relacionado"},clubAtAnnounce:s.clubId||null,matches,
        note:`Decisão e partidas de ${team.name} seguem o fluxo oficial da Copa do Mundo e da seleção.`});
      rec.interrupt=!!d.calledUp;rec.ack=!rec.interrupt;
      c.records[id]=rec;c.order.push(id);
      log&&log(s,d.calledUp?`Convocação · ${team.name}`:`Fora da convocação · ${team.name}`,`${s.person.name}: ${d.calledUp?"convocado":"não convocado"} (${d.status||""}).`);
    }
  }
  function advanceStages(s,D,log){
    const c=init(s);
    for(const id of c.order){
      const r=c.records[id];if(!r||!r.called)continue;
      if(r.stage==="announced"){
        if(s.day>r.returnDay){r.stage="returned";}
        else if(s.day>=r.presentationDay){
          if(Number(s.person.injury||0)>0&&r.source!=="national-team"){r.stage="cancelled";r.withdrawn={day:s.day,reason:"Cortado por lesão"};log&&log(s,`Cortado da seleção · ${r.teamName}`,`${s.person.name} se lesionou antes da apresentação e foi cortado da lista.`);}
          else{r.stage="duty";r.dutyFrom=s.day;c.duty=r.id;log&&log(s,`Apresentação · ${r.teamName}`,`${s.person.name} se apresentou à seleção: a serviço da seleção até ${fmt(r.endDay)}. Contrato e vínculo com o clube mantidos.`);}
        }
      }
      if(r.stage==="duty"&&s.day>=r.returnDay){r.stage="returned";if(c.duty===r.id)c.duty=null;r.returnedDay=s.day;log&&log(s,`Retorno ao clube · ${r.teamName}`,`${s.person.name} encerrou a janela e voltou ao clube.`);}
    }
    if(c.duty&&!(c.records[c.duty]&&c.records[c.duty].stage==="duty"))c.duty=null;
  }
  const PRE_TEXT=(first,name,comp)=>first?`A imprensa especula sobre uma possível primeira convocação de ${name} para ${comp}.`:`O técnico acompanha as atuações de ${name} antes da lista para ${comp}.`;
  function daily(s,D,log){
    if(!s||s.mode!=="player"||!s.person)return;
    const NI=NIM();if(!NI)return;
    const team=NI.heroTeam(s,D);if(!team||!team.represented||!team.code)return;
    const c=init(s,true);
    if(c.startedDay===s.day&&!c.records_seen){c.startedDay=s.day-1;c.records_seen=true;}
    braDecisions(s,D,team,log);
    if(team.code!=="BRA")for(const w of windowsFor(s,D,team)){
      const id=`NC:${w.id}:${team.code}`;
      if(c.records[id])continue;
      if(w.announceDay<c.startedDay||s.day>w.returnDay)continue;
      if(s.day>=w.announceDay)announce(s,D,w,team,log);
      else if(s.day>=w.preDay&&!c.pre[w.id]){
        const ev=evaluate(s,D,team);c.pre[w.id]=s.day;
        if(!ev.injured&&(ev.rank<=ev.quota+4||ev.prior>0))log&&log(s,`Convocação se aproxima · ${team.name}`,PRE_TEXT(ev.prior===0,s.person.name,w.competition)+" Isso não garante vaga.");
      }
    }
    advanceStages(s,D,log);
  }
  // ---- consulta/controle ----
  function pending(s){const c=init(s);return c.order.map(i=>c.records[i]).filter(r=>r&&r.interrupt&&!r.ack);}
  function blocker(s){
    const r=pending(s)[0];if(!r)return null;
    return {type:"callup",id:r.id,recordId:r.id,called:r.called,title:r.called?"Convocação para a seleção":"Fora da lista da seleção",page:"national",anchor:"",
      message:r.called?`Simulação interrompida: ${s.person.name} foi convocado para ${r.competition}.`:`Simulação interrompida: ${s.person.name} ficou fora da lista para ${r.competition}.`};
  }
  function acknowledge(s,id){
    const c=init(s,false);const r=c.records[id];if(!r)return false;
    if(!r.ack){r.ack=true;r.ackDay=s.day;}return true;
  }
  const current=s=>{const c=init(s);const id=c.order[c.order.length-1];return id?c.records[id]:null;};
  const onDuty=s=>{const c=init(s);return c.duty?c.records[c.duty]||null:null;};
  const status=s=>{const d=onDuty(s);return d?"A serviço da seleção":null;};
  const history=s=>{const c=init(s);return c.order.map(i=>c.records[i]).filter(Boolean);};
  const calledCount=(s,code)=>history(s).filter(r=>r.called&&r.stage!=="cancelled"&&(!code||r.teamCode===code)).length;
  const api={history,calledCount,lineupOf,windows:referenceWindows,windowsFor,nextWindow,evaluate,preview,daily,announce,pending,blocker,acknowledge,current,onDuty,status,init,fmt,dateOf,isWorldCupYear,QUOTA,SHAPE};
  root.ProLifeNationalCallups=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
