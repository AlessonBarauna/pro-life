(function(root){
  "use strict";
  // Treinador de seleção (FC27): ofertas/candidatura, convocação, formação e jogos nas datas FIFA.
  // Vive ao lado do clube: o treinador mantém o clube e acumula o cargo. Estado em s.coachNational.
  // Escopo desta etapa: amistosos internacionais nas 4 janelas FIFA do ano (sem Copa/eliminatórias do treinador).
  const VERSION=1,WINDOWS=[74,149,224,299],MATCH_GAP=3,SQUAD_MAX=26,SQUAD_MIN=18,HISTORY_LIMIT=80,OFFER_EVERY=60,OFFER_TTL=45,COOLDOWN=60;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const hash=value=>{let h=2166136261;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}h^=h>>>16;h=Math.imul(h,2246822507);h^=h>>>13;h=Math.imul(h,3266489909);h^=h>>>16;return h>>>0;};
  const unit=key=>hash(key)/4294967296;
  const NI=()=>root.ProLifeNationalIdentity||(typeof require==="function"?require("./national-identity.js"):null);
  const CODES="BRA ARG URU COL ECU PAR CHI PER ESP ENG ITA GER FRA POR NED BEL CRO SUI AUT DEN NOR SWE POL TUR SCO SRB UKR USA MEX CAN JPN KOR AUS MAR SEN NGA EGY CIV GHA".split(" ");
  const FORMATIONS=Object.freeze({"4-3-3":{GOL:1,DEF:4,MEI:3,ATA:3},"4-4-2":{GOL:1,DEF:4,MEI:4,ATA:2},"3-5-2":{GOL:1,DEF:3,MEI:5,ATA:2},"4-2-3-1":{GOL:1,DEF:4,MEI:5,ATA:1},"5-3-2":{GOL:1,DEF:5,MEI:3,ATA:2}});
  const POS=["GOL","DEF","MEI","ATA"],QUOTA={GOL:3,DEF:8,MEI:8,ATA:7};
  const isCoach=s=>s?.mode==="coach";

  function blank(){
    return {version:VERSION,teamId:null,since:null,board:60,formation:"4-3-3",manual:false,called:[],matches:[],schedule:[],offers:[],history:[],stats:{},cooldownUntil:0,lastOfferDay:-999};
  }
  function init(s){
    if(!isCoach(s))return null;
    const cn=s.coachNational&&typeof s.coachNational==="object"?s.coachNational:(s.coachNational=blank());
    for(const [k,v] of Object.entries(blank()))if(cn[k]===undefined)cn[k]=v;
    if(!FORMATIONS[cn.formation])cn.formation="4-3-3";
    s.coach=s.coach&&typeof s.coach==="object"?s.coach:{};
    s.coach.nationalTeamId=cn.teamId||null;
    return cn;
  }

  // ---- força das seleções (calculada a partir do catálogo real) ----
  const strengthCache=new WeakMap();
  function teamOf(s,D,code){const t=NI().resolve(code,s,D);return t&&t.represented?t:null;}
  function strengthTable(s,D){
    const key=`${s.season}|${Math.floor((s.day||0)/180)}`;
    const hit=strengthCache.get(s);if(hit&&hit.key===key)return hit.value;
    const value={};
    for(const code of CODES){
      const t=teamOf(s,D,code);if(!t)continue;
      const sq=NI().squad(s,D,t),top=sq.squad.slice(0,14);
      if(sq.eligibleCount<18||!top.length)continue;
      const strength=top.reduce((a,p)=>a+p.overall,0)/top.length;
      value[code]={code,name:t.name,confederation:t.confederation,strength:+strength.toFixed(1)};
    }
    strengthCache.set(s,{key,value});return value;
  }
  function requiredReputation(s,D,code){
    const row=strengthTable(s,D)[code];if(!row)return 100;
    let need=clamp(Math.round((row.strength-70)*4.5+10),10,80);
    const mine=NI().codeOf(s.person?.nationality);
    if(mine&&mine===code)need=Math.max(5,need-10);
    return need;
  }
  const reputationOf=s=>Math.round(Number(s.reputation)||0);

  // ---- elenco, convocação e escalação ----
  const byMerit=(a,b)=>b.overall-a.overall||a.age-b.age||String(a.id).localeCompare(String(b.id));
  function poolOf(s,D,code){const t=teamOf(s,D,code);return t?NI().pool(s,D,t).sort(byMerit):[];}
  function autoList(pool){
    const avail=pool.filter(p=>p.available),used=new Set(),out=[];
    for(const pos of POS)for(const p of avail.filter(x=>x.pos===pos).slice(0,QUOTA[pos])){used.add(p.id);out.push(p);}
    for(const p of avail){if(out.length>=SQUAD_MAX)break;if(!used.has(p.id)&&p.pos!=="GOL"){used.add(p.id);out.push(p);}}
    return out.sort(byMerit);
  }
  function effectiveSquad(s,D){
    const cn=init(s),pool=poolOf(s,D,cn.teamId),byId=new Map(pool.map(p=>[p.id,p]));
    let squad;
    if(!cn.manual)squad=autoList(pool);
    else{
      squad=cn.called.map(id=>byId.get(id)).filter(p=>p&&p.available);
      const used=new Set(squad.map(p=>p.id));
      for(const pos of POS){
        const need=pos==="GOL"?2:0;let have=squad.filter(p=>p.pos===pos).length;
        for(const p of pool){if(have>=need)break;if(p.pos===pos&&p.available&&!used.has(p.id)){squad.push(p);used.add(p.id);have++;}}
      }
      for(const p of pool){if(squad.length>=SQUAD_MIN)break;if(p.available&&!used.has(p.id)){squad.push(p);used.add(p.id);}}
      squad.sort(byMerit);
    }
    return {pool,squad,lineup:lineup(squad,cn.formation)};
  }
  function lineup(squad,formation){
    const shape=FORMATIONS[formation]||FORMATIONS["4-3-3"],used=new Set(),starters=[];
    for(const pos of POS)for(const p of squad.filter(x=>x.pos===pos).sort(byMerit).slice(0,shape[pos])){used.add(p.id);starters.push(p);}
    if(starters.length<11)for(const p of squad.filter(x=>!used.has(x.id)&&x.pos!=="GOL").sort(byMerit)){if(starters.length>=11)break;used.add(p.id);starters.push(p);}
    return {formation,starters,bench:squad.filter(p=>!used.has(p.id))};
  }
  function teamPower(starters){
    if(!starters.length)return 60;
    const base=starters.reduce((a,p)=>a+p.overall,0)/starters.length;
    return base-(11-Math.min(11,starters.length))*2.5;
  }

  // ---- cargo: candidatura, oferta, aceitar, deixar ----
  function message(s,D,subject,body){
    try{(D.Career||root.ProLifeCareer)?.addMessage?.(s,{category:"CARREIRA",sender:"Confederação",subject,body});}catch(e){}
  }
  function takeJob(s,D,code,how){
    const cn=init(s),t=teamOf(s,D,code);
    if(cn.teamId)throw Error("Você já comanda uma seleção. Deixe o cargo antes de aceitar outro.");
    if(!t)throw Error("Esta seleção não está disponível no PRO-LIFE.");
    if(s.day<cn.cooldownUntil)throw Error(`A confederação só aceita novos treinadores a partir do dia ${cn.cooldownUntil}.`);
    Object.assign(cn,{teamId:code,since:s.day,board:60,manual:false,called:[],schedule:[],offers:[]});
    cn.history.unshift({code,name:t.name,from:s.day,to:null,how});
    cn.history.length=Math.min(cn.history.length,30);
    init(s);ensureSchedule(s,D);
    try{(D.NationalTeam||root.ProLifeNationalTeam)?.coachRetrack?.(s,code);}catch(e){}
    message(s,D,`Você é o novo treinador de ${t.name}`,`A confederação confirmou o seu nome. A primeira convocação já foi montada automaticamente; ajuste a lista e a formação na aba Seleção.`);
    return cn;
  }
  function apply(s,D,code){
    const cn=init(s);code=String(code||"").toUpperCase();
    if(cn.teamId)throw Error("Você já comanda uma seleção.");
    const row=strengthTable(s,D)[code];if(!row)throw Error("Seleção indisponível.");
    const need=requiredReputation(s,D,code);
    if(reputationOf(s)<need)throw Error(`${row.name} exige reputação ${need}. A sua é ${reputationOf(s)}.`);
    return takeJob(s,D,code,"candidatura");
  }
  function acceptOffer(s,D,code){
    const cn=init(s);code=String(code||"").toUpperCase();
    const offer=cn.offers.find(o=>o.code===code&&o.expires>=s.day);
    if(!offer)throw Error("Esta oferta não está mais disponível.");
    return takeJob(s,D,code,"convite");
  }
  function declineOffer(s,D,code){
    const cn=init(s);code=String(code||"").toUpperCase();
    cn.offers=cn.offers.filter(o=>o.code!==code);
  }
  function leave(s,D,reason){
    const cn=init(s);if(!cn.teamId)throw Error("Você não comanda uma seleção.");
    const t=teamOf(s,D,cn.teamId),h=cn.history.find(x=>x.to===null);
    if(h){h.to=s.day;h.reason=reason||"pedido";}
    message(s,D,reason==="demissão"?`Demissão da seleção de ${t?.name||cn.teamId}`:`Saída da seleção de ${t?.name||cn.teamId}`,reason==="demissão"?"A confederação encerrou o seu contrato após a sequência de resultados.":"Você deixou o cargo de treinador da seleção.");
    Object.assign(cn,{teamId:null,since:null,manual:false,called:[],schedule:cn.schedule.filter(m=>m.played),cooldownUntil:s.day+COOLDOWN});
    init(s);
    try{(D.NationalTeam||root.ProLifeNationalTeam)?.coachRetrack?.(s,null);}catch(e){}
  }

  // ---- convocação ----
  function setFormation(s,D,formation){
    const cn=init(s);if(!cn.teamId)throw Error("Você não comanda uma seleção.");
    if(!FORMATIONS[formation])throw Error("Formação inválida.");
    cn.formation=formation;
  }
  function autoCallup(s,D){
    const cn=init(s);if(!cn.teamId)throw Error("Você não comanda uma seleção.");
    cn.manual=false;cn.called=[];
  }
  function toggleCall(s,D,playerId){
    const cn=init(s);if(!cn.teamId)throw Error("Você não comanda uma seleção.");
    const pool=poolOf(s,D,cn.teamId),p=pool.find(x=>x.id===playerId);
    if(!p)throw Error("Jogador não encontrado entre os elegíveis.");
    if(!cn.manual){cn.called=effectiveSquad(s,D).squad.map(x=>x.id);cn.manual=true;}
    const has=cn.called.includes(playerId);
    if(has){
      const gks=cn.called.filter(id=>pool.find(x=>x.id===id)?.pos==="GOL").length;
      if(p.pos==="GOL"&&gks<=2)throw Error("A convocação precisa de pelo menos 2 goleiros.");
      cn.called=cn.called.filter(id=>id!==playerId);
    }else{
      if(!p.available)throw Error(`${p.name} está lesionado ou suspenso.`);
      if(cn.called.length>=SQUAD_MAX)throw Error(`A lista já tem ${SQUAD_MAX} jogadores. Dispense alguém antes.`);
      cn.called.push(playerId);
    }
  }

  // ---- calendário e jogos ----
  function ensureSchedule(s,D){
    const cn=init(s);if(!cn.teamId)return;
    const table=strengthTable(s,D),others=CODES.filter(c=>c!==cn.teamId&&table[c]);
    cn.schedule=cn.schedule.filter(m=>m.played||m.day>=s.day);
    const yearStart=Math.floor((s.day||0)/365)*365;
    for(let y=0;y<=1;y++)for(const w of WINDOWS){
      const base=yearStart+y*365+w;
      for(let i=0;i<2;i++){
        const day=base+i*MATCH_GAP;
        if(day<s.day||day<cn.since)continue;
        const id=`${day}:${cn.teamId}`;
        if(cn.schedule.some(m=>m.id===id))continue;
        const me=table[cn.teamId]?.strength??75;
        const ranked=others.slice().sort((a,b)=>Math.abs(table[a].strength-me)-Math.abs(table[b].strength-me)).slice(0,14);
        const opp=ranked[hash(`${id}|opp`)%ranked.length];
        cn.schedule.push({id,day,season:s.season,opponentCode:opp,opponent:table[opp].name,home:unit(`${id}|home`)<.5,competition:"Amistoso internacional",played:false});
      }
    }
    cn.schedule.sort((a,b)=>a.day-b.day);
  }
  function poisson(lam,key){
    let L=Math.exp(-lam),k=0,p=1;
    do{k++;p*=unit(`${key}|${k}`);}while(p>L&&k<9);
    return k-1;
  }
  const PHASE={group:"Fase de grupos",ROUND_OF_32:"16 avos de final",ROUND_OF_16:"Oitavas de final",QUARTERFINAL:"Quartas de final",SEMIFINAL:"Semifinal",THIRD_PLACE:"Disputa do 3º lugar",FINAL:"Final"};
  // Simula uma partida da seleção com a convocação/formação atuais e registra elenco, placar e confiança.
  function simulate(s,D,fx){
    const cn=init(s),table=strengthTable(s,D),opp=table[fx.opponentCode];
    const {lineup:lu}=effectiveSquad(s,D),own=teamPower(lu.starters),other=opp?.strength??72;
    const lamOwn=clamp(1.35*Math.exp((own-other)/14)*(fx.home?1.08:1),.25,4.5),lamOpp=clamp(1.1*Math.exp((other-own)/14)*(fx.home?1:1.08),.25,4.5);
    const gf=poisson(lamOwn,`${fx.id}|gf`),ga=poisson(lamOpp,`${fx.id}|ga`);
    const weights={GOL:0,DEF:.8,MEI:3,ATA:6},scorers=[];
    for(let g=0;g<gf;g++){
      const pool=lu.starters.filter(p=>weights[p.pos]>0),total=pool.reduce((a,p)=>a+weights[p.pos],0);
      let r=unit(`${fx.id}|sc|${g}`)*total,pick=pool[0];
      for(const p of pool){r-=weights[p.pos];if(r<=0){pick=p;break;}}
      if(pick)scorers.push({id:pick.id,name:pick.name,minute:Math.floor(unit(`${fx.id}|min|${g}`)*88)+2});
    }
    scorers.sort((a,b)=>a.minute-b.minute);
    for(const p of lu.starters){const st=cn.stats[p.id]||(cn.stats[p.id]={name:p.name,pos:p.pos,caps:0,goals:0});st.caps++;st.name=p.name;}
    for(const sc of scorers)cn.stats[sc.id].goals++;
    return {gf,ga,scorers,power:+own.toFixed(1)};
  }
  function record(s,D,fx,sim,extra={}){
    const cn=init(s),result=sim.gf>sim.ga?"V":sim.gf<sim.ga?"D":"E";
    const entry={...fx,played:true,gf:sim.gf,ga:sim.ga,result,scorers:sim.scorers,power:sim.power,formation:cn.formation,...extra};
    Object.assign(fx,entry);
    cn.matches.unshift({...entry});cn.matches.length=Math.min(cn.matches.length,HISTORY_LIMIT);
    const big=extra.cup?1.5:extra.qualifier?1.25:1;
    cn.board=clamp(cn.board+(result==="V"?(sim.gf-sim.ga>=3?6:4):result==="D"?(sim.ga-sim.gf>=3?-8:-5):-1)*big,0,100);
    s.reputation=clamp((Number(s.reputation)||0)+(result==="V"?1:result==="D"?-1:0)*(extra.cup?2:1),0,100);
    message(s,D,`${cn.teamId} ${sim.gf} × ${sim.ga} ${fx.opponent}`,`${fx.competition}: ${result==="V"?"vitória":result==="D"?"derrota":"empate"} da sua seleção${extra.pens?` (${extra.pens==="win"?"classificada":"eliminada"} nos pênaltis)`:""}. Confiança da confederação: ${Math.round(cn.board)}%.`);
    const recent=cn.matches.filter(m=>m.day>=cn.since);
    if(cn.board<15&&recent.length>=3&&!extra.cup)leave(s,D,"demissão");
  }
  function playFixture(s,D,fx){record(s,D,fx,simulate(s,D,fx));}
  // Copa do Mundo: o motor de torneios chama este simulador para os jogos da seleção do treinador.
  function playWorldCup(s,D){
    const NT=D.NationalTeam||(root.ProLifeNationalTeam);
    if(!NT?.coachResolveWorldCup)return 0;
    const cn=init(s);
    return NT.coachResolveWorldCup(s,({fixture,opponentId,opponentName,home,phase,year})=>{
      const fx={id:fixture.id,day:fixture.day,season:s.season,opponentCode:opponentId,opponent:opponentName||opponentId,home,competition:`Copa do Mundo ${year} · ${PHASE[phase]||"Mata-mata"}`,cup:true};
      const sim=simulate(s,D,fx);
      let pens=null;
      record(s,D,fx,sim,{cup:true});
      return {gf:sim.gf,ga:sim.ga,after:({match})=>{
        if(match&&sim.gf===sim.ga&&match.winnerId){pens=match.winnerId===cn.teamId?"win":"lose";const e=cn.matches[0];if(e&&e.id===fx.id){e.pens=pens;e.result=pens==="win"?"V":"D";}}
        if(match&&phase!=="group"&&match.winnerId&&match.winnerId!==cn.teamId&&!(match.phase==="THIRD_PLACE"))message(s,D,"Fim da Copa para a sua seleção",`${cn.teamId} foi eliminada: ${PHASE[phase]||"mata-mata"}.`);
        if(match&&match.phase==="FINAL"&&match.winnerId===cn.teamId)message(s,D,"CAMPEÃ DO MUNDO!",`A seleção de ${cn.teamId} conquistou a Copa do Mundo ${year} sob o seu comando.`);
      }};
    });
  }
  // Eliminatórias (CONMEBOL): jogos da seleção do treinador no ciclo da Copa seguinte.
  function playQualifiers(s,D){
    const NT=D.NationalTeam||root.ProLifeNationalTeam;
    if(!NT?.coachResolveQualifiers)return 0;
    return NT.coachResolveQualifiers(s,({match,opponentId,opponentName,home,round,year})=>{
      const fx={id:`q:${year}:${match.id||match.day+":"+match.homeId}`,day:match.day,season:s.season,opponentCode:opponentId,opponent:opponentName||opponentId,home,competition:`Eliminatórias ${year} · Rodada ${round}`,qualifier:true};
      const sim=simulate(s,D,fx);
      record(s,D,fx,sim,{qualifier:true});
      return {gf:sim.gf,ga:sim.ga};
    });
  }
  function maybeOffers(s,D){
    const cn=init(s);
    cn.offers=cn.offers.filter(o=>o.expires>=s.day);
    if(cn.teamId||s.day<cn.cooldownUntil||s.day-cn.lastOfferDay<OFFER_EVERY||reputationOf(s)<20)return;
    cn.lastOfferDay=s.day;
    const table=strengthTable(s,D),rep=reputationOf(s);
    const fit=CODES.filter(c=>table[c]&&requiredReputation(s,D,c)<=rep&&!cn.offers.some(o=>o.code===c));
    if(!fit.length)return;
    fit.sort((a,b)=>unit(`${s.day}|${a}`)-unit(`${s.day}|${b}`));
    for(const code of fit.slice(0,unit(`${s.day}|n`)<.4?2:1)){
      cn.offers.push({code,name:table[code].name,received:s.day,expires:s.day+OFFER_TTL});
      message(s,D,`Convite: seleção de ${table[code].name}`,`A confederação quer você como treinador. Responda na aba Seleção até o dia ${s.day+OFFER_TTL}.`);
    }
  }
  function daily(s,D){
    if(!isCoach(s))return;
    const cn=init(s);
    if(cn.teamId){
      ensureSchedule(s,D);
      for(const fx of cn.schedule.filter(m=>!m.played&&m.day<=s.day)){
        if(!cn.teamId)break;
        if(fx.day<s.day-1){cn.schedule=cn.schedule.filter(m=>m!==fx);continue;}
        playFixture(s,D,fx);
      }
      if(cn.teamId)playQualifiers(s,D);
      if(cn.teamId)playWorldCup(s,D);
    }else maybeOffers(s,D);
  }

  // ---- visão para a tela ----
  function overview(s,D){
    const cn=init(s);if(!cn)return null;
    const table=strengthTable(s,D),rep=reputationOf(s),team=cn.teamId?teamOf(s,D,cn.teamId):null;
    const nations=CODES.filter(c=>table[c]).map(c=>{const need=requiredReputation(s,D,c);return {code:c,name:table[c].name,confederation:table[c].confederation,strength:table[c].strength,need,eligible:rep>=need,current:c===cn.teamId};}).sort((a,b)=>Number(b.current)-Number(a.current)||Number(b.eligible)-Number(a.eligible)||(a.eligible?b.strength-a.strength:a.need-b.need)||b.strength-a.strength);
    const out={rep,teamId:cn.teamId,team:team?{code:cn.teamId,name:team.name,confederation:team.confederation}:null,board:Math.round(cn.board),formation:cn.formation,formations:Object.keys(FORMATIONS),manual:cn.manual,offers:cn.offers.filter(o=>o.expires>=s.day),cooldownUntil:cn.cooldownUntil,day:s.day,nations,history:cn.history,
      results:cn.matches.filter(m=>m.day>=(cn.since??0)).slice(0,30),fixtures:cn.schedule.filter(m=>!m.played).slice(0,12)};
    const w=out.results;out.record={p:w.length,v:w.filter(m=>m.result==="V").length,e:w.filter(m=>m.result==="E").length,d:w.filter(m=>m.result==="D").length,gf:w.reduce((a,m)=>a+m.gf,0),ga:w.reduce((a,m)=>a+m.ga,0)};
    if(cn.teamId){
      const eff=effectiveSquad(s,D),calledIds=new Set(eff.squad.map(p=>p.id)),starters=new Set(eff.lineup.starters.map(p=>p.id));
      out.strength=table[cn.teamId]?.strength??null;out.power=+teamPower(eff.lineup.starters).toFixed(1);out.called=eff.squad.length;out.max=SQUAD_MAX;
      out.players=eff.pool.map(p=>({id:p.id,name:p.name,pos:p.pos,club:p.club,age:p.age,overall:Math.round(p.overall),available:p.available,called:calledIds.has(p.id),starter:starters.has(p.id),caps:cn.stats[p.id]?.caps||0,goals:cn.stats[p.id]?.goals||0}));
      out.cup=cupView(s,D,out.team);out.qual=qualView(s,D,out.team);
      out.scorers=Object.entries(cn.stats).filter(([,v])=>v.goals>0).map(([id,v])=>({id,...v})).sort((a,b)=>b.goals-a.goals).slice(0,5);
    }
    return out;
  }

  function qualView(s,D,team){
    const NT=D.NationalTeam||root.ProLifeNationalTeam;
    let q=null;try{q=NT?.coachQualifiersView?.(s)||null;}catch(e){}
    if(!q)return {kind:"none",note:"Ciclo de eliminatórias ainda não iniciado."};
    const inTable=q.table.some(r=>r.id===team.code);
    if(!inTable)return {kind:"allocation",year:q.worldCupYear,note:`${team.name} não faz parte das eliminatórias sul-americanas simuladas. A vaga para a Copa ${q.worldCupYear} é definida pelo ranking das seleções ao fim do ciclo.`};
    const mine=q.fixtures.filter(m=>m.homeId===team.code||m.awayId===team.code).sort((a,b)=>a.day-b.day);
    const name=id=>(q.table.find(r=>r.id===id)||{}).name||id;
    const row=m=>({id:m.id,round:m.round,day:m.day,home:name(m.homeId),away:name(m.awayId),played:!!m.played,hg:m.hg??null,ag:m.ag??null,mine:true});
    return {kind:"conmebol",year:q.worldCupYear,complete:!!q.complete,directSpots:q.directSpots,playoffSpot:q.playoffSpot,
      table:q.table.map((r,i)=>({pos:i+1,id:r.id,name:r.name,j:r.played,p:r.points,sg:r.gd,me:r.id===team.code,zone:i<q.directSpots?"direta":i===q.directSpots?"repescagem":""})),
      fixtures:mine.map(row),
      qualified:q.complete?q.qualified.includes(team.code):null,playoff:q.complete?q.playoff===team.code:null};
  }

  function cupView(s,D,team){
    let w=null;try{w=NI().worldCupOf(s,D,{code:team.code,name:team.name});}catch(e){}
    if(!w)return {available:false,note:"Nenhuma Copa do Mundo em andamento nesta temporada."};
    if(!w.qualified)return {available:true,year:w.year,qualified:false,status:w.status,note:w.note||`${team.name} não disputa a Copa do Mundo ${w.year}.`};
    const mk=m=>{const hg=m.homeGoals??m.hg??null,ag=m.awayGoals??m.ag??null,pens=!!(m.played&&hg!==null&&hg===ag&&m.winnerId);
      return {id:m.id,phase:PHASE[m.phase]||(m.round?`Rodada ${m.round}`:"Mata-mata"),home:m.home||m.homeId,away:m.away||m.awayId,played:!!m.played,hg,ag,winner:m.winnerId||null,pens:pens?(m.winnerId===team.code?"avançou nos pênaltis":"eliminada nos pênaltis"):null};};
    const ko=(w.knockout||[]).map(mk),lost=(w.knockout||[]).find(m=>m.played&&m.winnerId&&m.winnerId!==team.code&&m.phase!=="THIRD_PLACE");
    const won=(w.knockout||[]).find(m=>m.phase==="FINAL"&&m.played&&m.winnerId===team.code);
    const phaseLabel=won?"Campeã do mundo":lost?`Eliminada: ${PHASE[lost.phase]||"mata-mata"}`:w.phase;
    return {available:true,year:w.year,qualified:true,status:w.status,phaseLabel,group:w.group,
      table:(w.table||[]).map((r,i)=>({pos:i+1,id:r.id,name:r.name,p:r.points,j:r.played,sg:r.gd,me:r.id===team.code})),
      matches:(w.matches||[]).map(mk),knockout:ko};
  }

  const api={VERSION,WINDOWS,FORMATIONS,CODES,SQUAD_MAX,init,daily,overview,apply,acceptOffer,declineOffer,leave,setFormation,autoCallup,toggleCall,strengthTable,requiredReputation,effectiveSquad,ensureSchedule};
  root.ProLifeCoachNational=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
