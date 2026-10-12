(function(root){
  "use strict";
  // Stage 34F.25 - vida profissional e pessoal: redes sociais simuladas, relacionamentos profissionais,
  // eventos familiares e despesas por categoria. Complementa Life/Commercial/Career (nao os substitui).
  // Estado persistente em s.offField. Tudo deterministico (hash por temporada/dia/acao).
  const VERSION=1,POST_CD=3,CONTACT_CD=14,CONTACT_COST=400,FAMILY_GAP=40,FAMILY_WINDOW=10,MONTHS_KEPT=24,LOG_KEPT=20;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const hash=value=>{let h=2166136261;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
  const unit=key=>hash(key)/4294967296;

  const CONTACTS=Object.freeze({
    jornalista:{label:"Jornalista de confiança",benefit:"Reduz o risco de polêmica nas redes e amplia o alcance das publicações.",modes:["player","coach"]},
    mentor:{label:"Mentor da carreira",benefit:"Com relação forte (50+), dá +2 de moral e −2 de estresse todo mês.",modes:["player","coach"]},
    fisio:{label:"Fisioterapeuta de confiança",benefit:"Com relação forte (50+), recupera +2 de condição física por mês.",modes:["player"]},
    agente:{label:"Contato no mercado",benefit:"Com relação forte (60+), melhora o apelo comercial todo mês.",modes:["player"]},
    presidente:{label:"Diretoria e presidência",benefit:"Com relação forte (60+), adiciona +1 de confiança da diretoria todo mês (treinador) ou +1 de reputação por temporada (jogador).",modes:["player","coach"]}
  });
  const POSTS=Object.freeze({
    treino:{label:"Bastidores do treino",note:"Seguro: ganho pequeno de seguidores e torcida.",risk:0},
    familia:{label:"Momento em família",note:"+3 de vida familiar e −2 de estresse.",risk:0},
    patrocinio:{label:"Publi de patrocinador",note:"Melhora o apelo comercial; a torcida reclama se for demais.",risk:0.04},
    solidario:{label:"Ação solidária",note:"Reputação +1 e boa repercussão.",risk:0},
    opiniao:{label:"Opinião forte",note:"Alto alcance, mas pode virar polêmica.",risk:0.45}
  });
  const FAMILY_EVENTS=[
    {id:"aniversario",title:"Aniversário na semana de jogo",body:"A família faz aniversário na véspera de um compromisso importante.",choices:[
      {label:"Ir à festa e voltar a tempo",effects:{family:8,stress:-4,condition:-2}},{label:"Ficar concentrado",effects:{family:-6,stress:3,morale:1}}]},
    {id:"mudanca",title:"Mudança de casa",body:"Seu parceiro(a) quer mudar para um bairro mais perto do centro de treinamento.",choices:[
      {label:"Apoiar e pagar a mudança",effects:{family:7,stress:-3},cost:6000},{label:"Adiar para o fim da temporada",effects:{family:-4,stress:2}}]},
    {id:"saude",title:"Familiar precisa de apoio",body:"Um parente próximo precisa da sua presença por alguns dias.",choices:[
      {label:"Dar atenção e ajudar",effects:{family:10,stress:-2,morale:-1,condition:-3}},{label:"Mandar ajuda financeira",effects:{family:3,stress:1},cost:2500}]},
    {id:"viagem",title:"Folga rara no calendário",body:"Há uma semana livre. A família sugere uma viagem.",choices:[
      {label:"Viajar com a família",effects:{family:9,stress:-8,condition:2},cost:3500},{label:"Aproveitar para treinar mais",effects:{family:-3,stress:3,morale:2}}]},
    {id:"escola",title:"Reunião na escola",body:"Há uma reunião importante marcada num horário de treino.",choices:[
      {label:"Pedir liberação ao clube",effects:{family:6,stress:-1,morale:-1}},{label:"Pedir que outro familiar vá",effects:{family:-3,stress:1}}]}
  ];
  const CATS=[["salario",/sal[aá]rio|pagamento de contrato|premia[cç][aã]o|bônus|bonus/i,"Salário e prêmios"],["agencia",/comiss/i,"Agência"],["patrocinio",/patroc|publi|marca|comercial/i,"Patrocínios"],["moradia",/moradia|aluguel/i,"Moradia"],["veiculos",/ve[ií]culo/i,"Veículos"],["investimento",/invest/i,"Investimentos"],["compras",/aquisi|compra/i,"Compras"],["vida",/despesas pessoais|estilo|lazer|fam[ií]lia|visita/i,"Estilo de vida e lazer"]];
  const catOf=label=>{const c=CATS.find(([,re])=>re.test(String(label||"")));return c?c[0]:"outros";};
  const catLabel=id=>(CATS.find(c=>c[0]===id)||[0,0,"Outros"])[2];

  function blank(){return {version:VERSION,social:{posts:[],cooldowns:{},controversy:0,reach:0},network:{contacts:{},log:[]},family:{pending:null,history:[],lastEventDay:-999},expenses:{months:[]},processed:{}};}
  function state(s){
    if(!s)return null;
    let o=s.offField;
    if(!o||typeof o!=="object"||o.version!==VERSION)o=s.offField=blank();
    if(!o.social)o.social=blank().social;if(!Array.isArray(o.social.posts))o.social.posts=[];if(!o.social.cooldowns)o.social.cooldowns={};
    if(!o.network)o.network=blank().network;if(!o.network.contacts)o.network.contacts={};if(!Array.isArray(o.network.log))o.network.log=[];
    if(!o.family)o.family=blank().family;if(!Array.isArray(o.family.history))o.family.history=[];
    if(!o.expenses||!Array.isArray(o.expenses.months))o.expenses=blank().expenses;
    if(!o.processed)o.processed={};
    for(const [id,def] of Object.entries(CONTACTS)){
      if(!def.modes.includes(s.mode))continue;
      if(!o.network.contacts[id])o.network.contacts[id]={level:id==="presidente"?30:20,lastDay:s.day-60,history:0};
    }
    return o;
  }
  const isPlayer=s=>s?.mode==="player";
  const level=(s,id)=>Number(state(s)?.network.contacts[id]?.level)||0;
  function addTo(obj,key,delta,min=0,max=100){if(obj&&Number.isFinite(Number(obj[key])))obj[key]=clamp(Number(obj[key])+delta,min,max);}
  function applyEffects(s,fx={}){
    if(fx.family&&Number.isFinite(Number(s.family)))s.family=clamp(Number(s.family)+fx.family,0,100);
    if(fx.stress&&Number.isFinite(Number(s.stress)))s.stress=clamp(Number(s.stress)+fx.stress,0,100);
    if(s.person){if(fx.morale)addTo(s.person,"morale",fx.morale);if(fx.condition)addTo(s.person,"condition",fx.condition);}
  }
  function charge(s,api,amount,label){
    if(!amount)return;
    if(Number(s.wallet)<amount)throw Error("Saldo insuficiente.");
    api.Career.transaction(s,-amount,label);
  }

  // ---------- imagem publica ----------
  function publicImage(s,api){
    const o=state(s),m=isPlayer(s)?api?.Career?.mediaProfile?.(s):null;
    const fans=m?Number(m.fanSentiment):55,pressure=m?Number(m.pressure):30;
    const rep=Number(s.reputation)||40,press=level(s,"jornalista");
    const value=Math.round(clamp(fans*0.4+rep*0.3+(100-pressure)*0.1+press*0.1+clamp(100-o.social.controversy*12,0,100)*0.1,0,100));
    const label=value>=80?"Ídolo":value>=65?"Em alta":value>=45?"Estável":value>=30?"Desgastada":"Em crise";
    return {value,label,fans:Math.round(fans),pressure:Math.round(pressure),reputation:Math.round(rep),controversy:o.social.controversy};
  }

  // ---------- redes sociais ----------
  function post(s,api,kind){
    if(!isPlayer(s))throw Error("Redes sociais estão disponíveis na carreira de jogador.");
    const def=POSTS[kind];if(!def)throw Error("Publicação inválida.");
    const o=state(s),left=(o.social.cooldowns[kind]??-999)+POST_CD-s.day;
    if(left>0)throw Error(`${def.label}: disponível em ${left} dia${left===1?"":"s"}.`);
    const reach=1+level(s,"jornalista")/200;
    const risk=clamp(def.risk-level(s,"jornalista")/400,0,0.9);
    const bad=risk>0&&unit(`post|${s.season}|${s.day}|${kind}|${o.social.posts.length}`)<risk;
    let followers=0,fans=0,sponsor=0,pressure=0,text="";
    if(kind==="treino"){followers=120;fans=1;text="Os bastidores agradaram a torcida.";}
    else if(kind==="familia"){followers=90;fans=1;applyEffects(s,{family:3,stress:-2});text="A vida em família humanizou sua imagem.";}
    else if(kind==="solidario"){followers=220;fans=3;s.reputation=clamp((Number(s.reputation)||0)+1,0,100);text="A ação solidária teve ótima repercussão.";}
    else if(kind==="patrocinio"){followers=60;sponsor=3;fans=bad?-3:0;text=bad?"A torcida achou publicidade demais.":"A marca gostou da entrega.";}
    else{followers=bad?-150:700;fans=bad?-6:3;pressure=bad?8:2;text=bad?"A opinião virou polêmica e rendeu críticas.":"A opinião repercutiu e rendeu engajamento.";}
    if(bad&&kind!=="patrocinio"){o.social.controversy+=1;api.Career.updateMediaProfile(s,{controversy:1});}
    followers=Math.round(followers*(followers>0?reach:1));
    api.Career.updateMediaProfile(s,{fans,sponsor,pressure});
    s.fans=clamp(Number(s.fans||0)+followers,0,1e9);
    const com=s.extras?.playerCareer?.commercial||s.commercial;if(com&&Number.isFinite(Number(com.followers)))com.followers=Math.max(0,Number(com.followers)+followers);
    o.social.reach+=Math.max(0,followers);
    o.social.cooldowns[kind]=s.day;
    const row={day:s.day,season:s.season,kind,label:def.label,backfired:bad,followers,text};
    o.social.posts=[row,...o.social.posts].slice(0,LOG_KEPT);
    return row;
  }

  // ---------- relacionamentos ----------
  function cultivate(s,api,id){
    const def=CONTACTS[id],o=state(s);
    if(!def||!def.modes.includes(s.mode))throw Error("Contato indisponível neste modo.");
    const c=o.network.contacts[id],left=c.lastDay+CONTACT_CD-s.day;
    if(left>0)throw Error(`${def.label}: nova conversa em ${left} dia${left===1?"":"s"}.`);
    charge(s,api,CONTACT_COST,"Relacionamento: "+def.label);
    const gain=c.level>=70?4:8;
    c.level=clamp(c.level+gain,0,100);c.lastDay=s.day;c.history++;
    o.network.log=[{day:s.day,season:s.season,id,label:def.label,gain,level:c.level},...o.network.log].slice(0,LOG_KEPT);
    return c;
  }

  // ---------- familia ----------
  function eventFor(s){return FAMILY_EVENTS[hash(`family|${s.seed||s.rng||0}|${s.season}|${s.day}`)%FAMILY_EVENTS.length];}
  function resolve(s,api,choiceIdx,auto){
    const o=state(s),p=o.family.pending;if(!p)throw Error("Não há decisão familiar pendente.");
    const ev=FAMILY_EVENTS.find(e=>e.id===p.id),ch=ev?.choices[choiceIdx];if(!ch)throw Error("Escolha inválida.");
    if(ch.cost)charge(s,api,ch.cost,"Família: "+ev.title);
    applyEffects(s,ch.effects);
    o.family.history=[{day:s.day,season:s.season,id:ev.id,title:ev.title,choice:ch.label,auto:!!auto},...o.family.history].slice(0,LOG_KEPT);
    o.family.pending=null;
    return ch;
  }
  function familyDaily(s,api,hooks){
    const o=state(s),f=o.family;
    if(f.pending&&s.day>f.pending.deadline){
      try{resolve(s,api,1,true);}catch(e){f.pending=null;}
      hooks?.log?.("Família","Você deixou a decisão familiar sem resposta e o assunto foi resolvido sem sua presença.");
    }
    if(!f.pending&&s.clubId&&s.day-f.lastEventDay>=FAMILY_GAP&&unit(`famroll|${s.season}|${s.day}`)<0.12){
      const ev=eventFor(s);f.pending={id:ev.id,createdDay:s.day,deadline:s.day+FAMILY_WINDOW};f.lastEventDay=s.day;
      hooks?.log?.("Decisão familiar",ev.title);
    }
  }

  // ---------- despesas ----------
  function breakdown(s,api,days=30){
    const led=api?.Career?.init?.(s)?.ledger||[],from=s.day-days,cats={};let income=0,expense=0;
    for(const e of led){if(e.day<from)continue;const a=Number(e.amount)||0,k=catOf(e.label);cats[k]=cats[k]||{id:k,label:catLabel(k),income:0,expense:0};
      if(a>=0){income+=a;cats[k].income+=a;}else{expense-=a;cats[k].expense-=a;}}
    return {days,income,expense,net:income-expense,rows:Object.values(cats).sort((a,b)=>b.expense-a.expense||b.income-a.income)};
  }

  // ---------- rotina ----------
  function monthly(s,api,hooks){
    const o=state(s),key=`m:${s.season}:${Math.floor(s.day/30)}`;
    if(o.processed[key])return;o.processed={[key]:s.day};
    for(const [id,c] of Object.entries(o.network.contacts)){
      if(s.day-c.lastDay>60&&c.level>20)c.level=Math.max(20,c.level-2);
      if(id==="mentor"&&c.level>=50){applyEffects(s,{morale:2,stress:-2});}
      else if(id==="fisio"&&c.level>=50){applyEffects(s,{condition:2});}
      else if(id==="agente"&&c.level>=60&&isPlayer(s)){api.Career.updateMediaProfile(s,{sponsor:1});}
      else if(id==="presidente"&&c.level>=60){
        if(s.mode==="coach"){s.board=clamp((Number(s.board)||50)+1,0,100);}
      }
    }
    const b=breakdown(s,api,30);
    o.expenses.months=[{season:s.season,day:s.day,income:b.income,expense:b.expense,net:b.net,top:b.rows.slice(0,3).map(r=>({id:r.id,label:r.label,expense:r.expense}))},...o.expenses.months].slice(0,MONTHS_KEPT);
    if(o.social.controversy>0&&s.day%90<30)o.social.controversy=Math.max(0,o.social.controversy-1);
  }
  function seasonal(s){
    const o=state(s),key=`y:${s.season}`;
    if(o.processed[key]||s.day%365>5)return;o.processed[key]=s.day;
    if(isPlayer(s)&&level(s,"presidente")>=60)s.reputation=clamp((Number(s.reputation)||0)+1,0,100);
  }
  function daily(s,api,hooks){
    if(!s||!api)return;
    state(s);familyDaily(s,api,hooks);
    if(s.day%30===0)monthly(s,api,hooks);
    seasonal(s);
  }

  function snapshot(s,api){
    const o=state(s),now=s.day;
    const contacts=Object.entries(CONTACTS).filter(([,d])=>d.modes.includes(s.mode)).map(([id,d])=>{const c=o.network.contacts[id];return {id,label:d.label,benefit:d.benefit,level:Math.round(c.level),wait:Math.max(0,c.lastDay+CONTACT_CD-now),active:c.level>=(id==="mentor"||id==="fisio"?50:id==="jornalista"?1:60)};});
    const pending=o.family.pending?(()=>{const ev=FAMILY_EVENTS.find(e=>e.id===o.family.pending.id);return ev?{...o.family.pending,title:ev.title,body:ev.body,choices:ev.choices.map(c=>({label:c.label,cost:c.cost||0,effects:c.effects})),daysLeft:Math.max(0,o.family.pending.deadline-now)}:null;})():null;
    return {mode:s.mode,social:isPlayer(s),posts:Object.entries(POSTS).map(([id,p])=>({id,...p,wait:Math.max(0,(o.social.cooldowns[id]??-999)+POST_CD-now)})),recentPosts:o.social.posts.slice(0,8),reach:o.social.reach,
      image:publicImage(s,api),contacts,contactCost:CONTACT_COST,networkLog:o.network.log.slice(0,6),family:Number(s.family),stress:Number(s.stress),pending,familyHistory:o.family.history.slice(0,6),
      expenses:breakdown(s,api,30),months:o.expenses.months.slice(0,12)};
  }

  const api={VERSION,CONTACTS,POSTS,FAMILY_EVENTS,init:state,daily,post,cultivate,resolve,publicImage,breakdown,snapshot,catOf};
  root.ProLifeOffField=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
