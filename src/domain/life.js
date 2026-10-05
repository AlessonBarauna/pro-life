(function (root) {
  "use strict";
  const decisions = [
    { id: "family", title: "Um fim de semana em família", body: "Uma pausa pode aliviar a pressão, mas reduz o foco no treino.", choices: [["visit", "Visitar a família"], ["work", "Priorizar o trabalho"]] },
    { id: "media", title: "Convite para uma entrevista", body: "Sua opinião pode aproximar a torcida e aumentar a cobrança.", choices: [["humble", "Falar com equilíbrio"], ["bold", "Prometer grandes resultados"]] },
    { id: "agent", title: "Assessoria de carreira", body: "Uma agência oferece representação contínua e novas oportunidades.", choices: [["hire", "Contratar a agência"], ["decline", "Seguir por conta própria"]] },
    { id: "community", title: "Projeto social do bairro", body: "Sua presença inspira jovens, mas ocupa um dia de recuperação.", choices: [["support", "Participar do projeto"], ["skip", "Preservar a rotina"]] },
    { id: "sponsor", title: "Campanha de patrocinador", body: "Uma campanha curta paga cachê e amplia sua exposição.", choices: [["campaign", "Aceitar a campanha"], ["protect", "Proteger a imagem"]] },
    { id: "criticism", title: "Crítica após uma atuação", body: "Um comentarista questionou seu momento. Sua resposta pode mudar a pressão e a percepção pública.", choices: [["respond_calm", "Responder com serenidade"], ["respond_fire", "Rebater publicamente"]] },
    { id: "fans", title: "Encontro inesperado com torcedores", body: "Torcedores pedem sua atenção depois do treino, em uma semana de agenda cheia.", choices: [["meet_fans", "Atender os torcedores"], ["leave_fans", "Preservar a recuperação"]] },
    { id: "social", title: "Publicação viral", body: "Uma postagem sua ganhou grande repercussão. Você pode aproveitar o alcance ou reduzir a exposição.", choices: [["embrace_social", "Aproveitar a repercussão"], ["quiet_social", "Diminuir a exposição"]] },
  ];
  function init(s) {
    if (!s.life) s.life = { agency: null, events: [], lastDecisionDay: 0 };
    const life=s.life;
    if(!life.finance) life.finance={version:2,currency:"BRL",startedDay:s.day,wellbeing:65,lifestyle:"SIMPLES",housing:{type:"Casa da família",mode:"family",value:0,monthly:0,acquiredDay:s.day},vehicles:[],possessions:[],investments:[],processed:{},activityCooldowns:{},milestones:[]};
    const f=life.finance;
    if(!f.processed||typeof f.processed!=="object") f.processed={};
    if(!Array.isArray(f.vehicles)) f.vehicles=[];
    if(!Array.isArray(f.investments)) f.investments=[];
    if(!Array.isArray(f.possessions)) f.possessions=[];
    f.version=Math.max(2,Number(f.version||1));
    if(!f.activityCooldowns) f.activityCooldowns={};
    if(!Array.isArray(f.milestones)) f.milestones=[];
    if(!Number.isFinite(f.wellbeing)) f.wellbeing=65;
    if(!f.lifestyle) f.lifestyle="SIMPLES";
    return life;
  }
  const housing=[
    {id:"rent-simple",name:"Apartamento compacto",mode:"rent",price:6500,monthly:2200,value:0,tier:0},
    {id:"rent-modern",name:"Apartamento moderno",mode:"rent",price:14000,monthly:4800,value:0,tier:1},
    {id:"buy-modern",name:"Apartamento moderno",mode:"buy",price:420000,monthly:900,value:420000,tier:1},
    {id:"buy-house",name:"Casa em condomínio",mode:"buy",price:950000,monthly:2400,value:950000,tier:2},
    {id:"buy-luxury",name:"Apartamento de luxo",mode:"buy",price:1850000,monthly:4800,value:1850000,tier:3},
    {id:"buy-mansion",name:"Mansão de alto padrão",mode:"buy",price:4800000,monthly:12500,value:4800000,tier:4}
  ];
  const vehicles=[
    {id:"popular",name:"Hatch compacto",category:"Popular",price:82000,value:69700,monthly:650,tier:0},
    {id:"sedan",name:"Sedan médio",category:"Sedan",price:155000,value:131750,monthly:1050,tier:1},
    {id:"suv",name:"SUV médio",category:"SUV",price:235000,value:199750,monthly:1550,tier:1},
    {id:"premium",name:"Sedan premium",category:"Premium",price:390000,value:331500,monthly:2600,tier:2},
    {id:"sport",name:"Esportivo premium",category:"Esportivo",price:780000,value:663000,monthly:5200,tier:3},
    {id:"lux-suv",name:"SUV de luxo",category:"Luxo",price:1150000,value:977500,monthly:7200,tier:3},
    {id:"super",name:"Superesportivo",category:"Supercarro",price:3200000,value:2720000,monthly:18000,tier:4}
  ];
  const purchases=[
    {id:"gym",name:"Academia particular",category:"Performance",price:18000,monthly:450,value:9000,benefit:"Recuperação física",wellbeing:2,condition:5},
    {id:"recovery",name:"Espaço de recuperação",category:"Performance",price:45000,monthly:900,value:27000,benefit:"Condicionamento e recuperação",wellbeing:3,condition:8},
    {id:"nutrition",name:"Nutricionista particular",category:"Equipe pessoal",price:6000,monthly:1800,value:0,benefit:"Rotina profissional",wellbeing:4,condition:4},
    {id:"physio",name:"Fisioterapia preventiva",category:"Equipe pessoal",price:9000,monthly:2500,value:0,benefit:"Recuperação preventiva",wellbeing:3,condition:6},
    {id:"gaming",name:"Setup gamer premium",category:"Lazer",price:28000,monthly:0,value:14000,benefit:"Bem-estar e lazer",wellbeing:6,condition:0},
    {id:"wardrobe",name:"Guarda-roupa premium",category:"Estilo",price:35000,monthly:0,value:17500,benefit:"Imagem e estilo de vida",wellbeing:4,condition:0},
    {id:"security",name:"Segurança residencial",category:"Conforto",price:25000,monthly:3200,value:10000,benefit:"Conforto e tranquilidade",wellbeing:5,condition:0},
    {id:"home-studio",name:"Estúdio e escritório pessoal",category:"Conforto",price:65000,monthly:500,value:39000,benefit:"Conforto fora dos gramados",wellbeing:5,condition:0}
  ];
  const investmentTypes=[
    {id:"conservative",name:"Reserva conservadora",category:"Renda fixa",minimum:5000,months:6,rate:0.05,risk:0,lossChance:0},
    {id:"cdb",name:"Renda fixa bancária",category:"Renda fixa",minimum:5000,months:6,rate:0.055,risk:0,lossChance:0},
    {id:"treasury",name:"Títulos de longo prazo",category:"Renda fixa",minimum:10000,months:12,rate:0.105,risk:0,lossChance:0},
    {id:"fund",name:"Fundo multimercado",category:"Fundos",minimum:15000,months:9,rate:0.11,risk:1,lossChance:0.03},
    {id:"reit",name:"Fundo imobiliário",category:"Imóveis",minimum:20000,months:12,rate:0.13,risk:1,lossChance:0.025},
    {id:"franchise",name:"Franquia regional",category:"Negócios",minimum:60000,months:18,rate:0.22,risk:1,lossChance:0.04},
    {id:"agribusiness",name:"Projeto de agronegócio",category:"Agronegócio",minimum:50000,months:15,rate:0.19,risk:1,lossChance:0.035},
    {id:"solar",name:"Projeto de energia solar",category:"Energia",minimum:80000,months:18,rate:0.24,risk:1,lossChance:0.04},
    {id:"property",name:"Participação imobiliária",category:"Imóveis",minimum:120000,months:24,rate:0.30,risk:1,lossChance:0.03},
    {id:"business",name:"Participação em empresa",category:"Negócios",minimum:75000,months:18,rate:0.32,risk:2,lossChance:0.07},
    {id:"startup",name:"Startup de tecnologia",category:"Tecnologia",minimum:40000,months:24,rate:0.48,risk:2,lossChance:0.10},
    {id:"sports",name:"Negócio esportivo",category:"Esporte",minimum:50000,months:18,rate:0.36,risk:2,lossChance:0.08},
    {id:"venture",name:"Fundo de inovação",category:"Tecnologia",minimum:100000,months:30,rate:0.58,risk:2,lossChance:0.11}
  ];
  function once(s,key,fn){const f=init(s).finance;if(f.processed[key]) return false;fn();f.processed[key]=s.day;return true;}
  function contractSalary(s){return Number(s.extras?.playerCareer?.contract?.salary ?? s.salary ?? 0);}
  function netWorth(s){const f=init(s).finance;return Number(s.wallet||0)+Number(f.housing?.value||0)+f.vehicles.reduce((n,x)=>n+Number(x.value||0),0)+f.possessions.reduce((n,x)=>n+Number(x.value||0),0)+f.investments.reduce((n,x)=>n+Number(x.principal||0),0);}
  function deterministicRoll(s,key){let h=(Number(s.seed||s.rng||1)>>>0)||1;for(const ch of String(key)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return (h%10000)/10000;}
  function lifestyleTier(s){const salary=contractSalary(s),worth=netWorth(s);return salary>=250000||worth>=5000000?4:salary>=100000||worth>=1800000?3:salary>=40000||worth>=700000?2:salary>=12000||worth>=180000?1:0;}
  function settleMatureInvestments(s,helpers){
    const f=init(s).finance;
    for(const inv of f.investments.slice()) if(s.day>=inv.maturesDay && !inv.closed){
      const settlementKey=`investment:${inv.outcomeKey||inv.id}:settled`;
      once(s,settlementKey,()=>{
        const roll=deterministicRoll(s,inv.outcomeKey||inv.id), lost=roll<Number(inv.lossChance||0);
        let realized=inv.rate;
        if(inv.risk===1) realized += (deterministicRoll(s,(inv.outcomeKey||inv.id)+":yield")-.35)*.08;
        if(inv.risk===2) realized += (deterministicRoll(s,(inv.outcomeKey||inv.id)+":yield")-.30)*.18;
        if(lost) realized=inv.risk===2?-(.12+deterministicRoll(s,inv.id+":loss")*.20):-(.03+deterministicRoll(s,inv.id+":loss")*.07);
        const value=Math.max(0,Math.round(inv.principal*(1+realized)));
        inv.closed=true; inv.returnValue=value; inv.realizedRate=realized; inv.settledDay=s.day;
        helpers.transaction(s,value,`Retorno: ${inv.name}`);
      });
    }
    f.investments=f.investments.filter(x=>!x.closed);
  }
  function dailyFinance(s,helpers){ settleMatureInvestments(s,helpers); }
  function monthlyFinance(s,helpers){
    const f=init(s).finance, key=`month:${s.season}:${Math.floor(s.day/30)}`;
    return once(s,key,()=>{
      const salary=s.clubId?contractSalary(s):0;
      if(salary>0) helpers.transaction(s,salary,"Salário mensal");
      const commission=Math.round(salary*Number(s.extras?.playerCareer?.agent?.commission||0)/100);
      if(commission>0) helpers.transaction(s,-commission,"Comissão da agência");
      const base=s.mode==="coach"?2000:650, lifestyle={SIMPLES:0,CONFORTÁVEL:1200,"ALTO PADRÃO":4500,LUXO:15000}[f.lifestyle]||0;
      const recurring=base+lifestyle+Number(f.housing?.monthly||0)+f.vehicles.reduce((n,x)=>n+Number(x.monthly||0),0)+f.possessions.reduce((n,x)=>n+Number(x.monthly||0),0);
      if(recurring>0) helpers.transaction(s,-recurring,"Despesas pessoais e estilo de vida");
      settleMatureInvestments(s,helpers);
      f.wellbeing=Math.max(0,Math.min(100,f.wellbeing+(f.lifestyle==="SIMPLES"?0:1)));
    });
  }
  function setLifestyle(s,value){const f=init(s).finance;if(!["SIMPLES","CONFORTÁVEL","ALTO PADRÃO","LUXO"].includes(value)) throw Error("Estilo inválido.");f.lifestyle=value;}
  function buyHousing(s,id,helpers){const f=init(s).finance,x=housing.find(x=>x.id===id);if(!x) throw Error("Moradia inválida.");if((x.tier||0)>lifestyleTier(s)) throw Error("Moradia ainda não disponível para seu momento de carreira.");if(s.wallet<x.price) throw Error("Saldo insuficiente.");helpers.transaction(s,-x.price,"Moradia: "+x.name);f.housing={type:x.name,mode:x.mode,value:x.value,monthly:x.monthly,acquiredDay:s.day};f.wellbeing=Math.min(100,f.wellbeing+3);}
  function buyVehicle(s,id,helpers){const f=init(s).finance,x=vehicles.find(x=>x.id===id);if(!x) throw Error("Veículo inválido.");if((x.tier||0)>lifestyleTier(s)) throw Error("Veículo ainda não disponível para seu momento de carreira.");if(f.vehicles.some(v=>v.id===id)) throw Error("Veículo já adquirido.");if(s.wallet<x.price) throw Error("Saldo insuficiente.");helpers.transaction(s,-x.price,"Veículo: "+x.name);f.vehicles.push({...x,acquiredDay:s.day});}
  function sellVehicle(s,id,helpers){const f=init(s).finance,i=f.vehicles.findIndex(x=>x.id===id);if(i<0) throw Error("Veículo não encontrado.");const x=f.vehicles.splice(i,1)[0];helpers.transaction(s,x.value,"Venda de veículo: "+x.name);}
  function invest(s,id,amount,helpers){const f=init(s).finance,x=investmentTypes.find(x=>x.id===id),v=Math.round(Number(amount));if(!x||v<x.minimum) throw Error("Investimento abaixo do mínimo.");if(s.wallet<v) throw Error("Saldo insuficiente.");helpers.transaction(s,-v,"Investimento: "+x.name);const uid=`${id}:${s.day}:${f.investments.length}`;f.investments.push({id:uid,type:id,name:x.name,category:x.category,principal:v,rate:x.rate,risk:x.risk,lossChance:x.lossChance||0,startDay:s.day,maturesDay:s.day+x.months*30,outcomeKey:uid,closed:false});}
  function buyPurchase(s,id,helpers){const f=init(s).finance,x=purchases.find(x=>x.id===id);if(!x) throw Error("Compra inválida.");if(f.possessions.some(v=>v.id===id)) throw Error("Item já adquirido.");if(s.wallet<x.price) throw Error("Saldo insuficiente.");helpers.transaction(s,-x.price,"Aquisição: "+x.name);f.possessions.push({...x,acquiredDay:s.day});f.wellbeing=Math.min(100,f.wellbeing+Number(x.wellbeing||0));if(x.condition) s.person.condition=Math.min(100,s.person.condition+x.condition);}
  function activity(s,id,helpers){const f=init(s).finance,last=f.activityCooldowns[id]??-9999;if(s.day-last<7) throw Error("Atividade ainda em cooldown.");if(id==="family"){if(s.wallet<150) throw Error("Saldo insuficiente.");helpers.transaction(s,-150,"Visita à família");s.family=Math.min(100,s.family+8);s.stress=Math.max(0,s.stress-6);f.wellbeing=Math.min(100,f.wellbeing+8);} else if(id==="rest"){s.person.condition=Math.min(100,s.person.condition+5);f.wellbeing=Math.min(100,f.wellbeing+4);} else if(id==="friends"){if(s.wallet<250) throw Error("Saldo insuficiente.");helpers.transaction(s,-250,"Lazer com amigos");f.wellbeing=Math.min(100,f.wellbeing+5);} else throw Error("Atividade inválida.");f.activityCooldowns[id]=s.day;}
  function snapshot(s){const f=init(s).finance;return {balance:s.wallet,salary:contractSalary(s),wellbeing:f.wellbeing,lifestyle:f.lifestyle,housing:f.housing,vehicles:f.vehicles,possessions:f.possessions,investments:f.investments,netWorth:netWorth(s),tier:lifestyleTier(s)};}

  function next(s, rng) {
    const life = init(s), pool = life.agency ? decisions.filter((d) => d.id !== "agent") : decisions;
    life.lastDecisionDay = s.day;
    return JSON.parse(JSON.stringify(rng.pick(pool)));
  }
  function decide(s, choice, helpers) {
    const life = init(s);
    if (choice === "hire") {
      if (s.wallet < 900) throw Error("Saldo insuficiente.");
      helpers.transaction(s, -900, "Contratação de assessoria");
      life.agency = { name: "Pro Carreiras", hiredDay: s.day, monthlyCost: 250, level: 1 };
      s.reputation = Math.min(100, s.reputation + 4);
    }
    if (choice === "support") { s.family = Math.min(100, s.family + 5); s.reputation = Math.min(100, s.reputation + 3); s.fans += 150; }
    if (choice === "campaign") { helpers.transaction(s, 1800, "Campanha de patrocinador"); s.fans += 250; s.stress = Math.min(100, s.stress + 5); }
    if (choice === "protect") s.reputation = Math.min(100, s.reputation + 1);
    if (choice === "respond_calm") { s.reputation = Math.min(100, s.reputation + 2); s.stress = Math.max(0, s.stress - 2); helpers.updateMediaProfile?.(s,{pressure:-4,fans:3,sponsor:2}); }
    if (choice === "respond_fire") { s.fans += 180; s.stress = Math.min(100,s.stress+8); helpers.updateMediaProfile?.(s,{pressure:10,fans:-4,sponsor:-4,controversy:1}); }
    if (choice === "meet_fans") { s.fans += 300; s.reputation = Math.min(100,s.reputation+2); s.person.condition=Math.max(0,s.person.condition-3); helpers.updateMediaProfile?.(s,{fans:8,sponsor:3}); }
    if (choice === "leave_fans") { s.person.condition=Math.min(100,s.person.condition+2); helpers.updateMediaProfile?.(s,{fans:-3,pressure:-1}); }
    if (choice === "embrace_social") { s.fans += 500; s.stress=Math.min(100,s.stress+5); helpers.updateMediaProfile?.(s,{fans:5,sponsor:5,pressure:4}); }
    if (choice === "quiet_social") { s.stress=Math.max(0,s.stress-6); helpers.updateMediaProfile?.(s,{pressure:-5,sponsor:-1}); }
    life.events.unshift({ day: s.day, season: s.season, choice });
    life.events = life.events.slice(0, 80);
  }
  function monthly(s, helpers) {
    const life = init(s);
    if (!life.agency) return;
    helpers.transaction(s, -life.agency.monthlyCost, "Mensalidade da assessoria");
    s.fans += 80 * life.agency.level;
  }
  const api = { decisions, init, next, decide, monthly, housing, vehicles, purchases, investmentTypes, monthlyFinance, dailyFinance, contractSalary, netWorth, lifestyleTier, setLifestyle, buyHousing, buyVehicle, sellVehicle, buyPurchase, invest, activity, snapshot };
  root.ProLifeLife = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
