(function (root) {
  "use strict";
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const CATEGORY_LABELS={
    SPORTSWEAR:"Material esportivo",
    FINANCE:"Banco e serviços financeiros",
    FOOD:"Alimentos",
    BEVERAGE:"Bebidas",
    TECH:"Tecnologia",
    TELECOM:"Telecomunicações",
    AUTOMOTIVE:"Automóveis",
    RETAIL:"Varejo",
    HEALTH:"Saúde e farmácia",
    CONSTRUCTION:"Construção e imobiliário",
    ENERGY:"Energia e combustível",
    INSURANCE:"Seguros",
    TRAVEL:"Transporte e turismo",
    EDUCATION:"Educação",
    LIFESTYLE:"Moda e lifestyle"
  };

  const TIER_RULES={
    LOCAL:{rep:18,pop:15,sport:20,commercial:20000,base:2000,max:15000},
    REGIONAL:{rep:28,pop:25,sport:30,commercial:70000,base:10000,max:40000},
    NATIONAL:{rep:44,pop:40,sport:45,commercial:180000,base:25000,max:120000},
    PREMIUM:{rep:62,pop:58,sport:58,commercial:380000,base:70000,max:300000},
    GLOBAL:{rep:80,pop:78,sport:72,commercial:650000,base:150000,max:1150000}
  };

  const PROFILE_RULES={
    sporting:{
      w:{sporting:.42,reputation:.24,popularity:.16,commercial:.12,image:.06},
      adj:{sport:-10,rep:3}
    },
    social:{
      w:{sporting:.14,reputation:.16,popularity:.34,commercial:.24,image:.12},
      adj:{sport:-25,pop:5,commercial:20000}
    },
    image:{
      w:{sporting:.12,reputation:.18,popularity:.28,commercial:.28,image:.14},
      adj:{sport:-15,pop:3,commercial:30000}
    },
    professional:{
      w:{sporting:.18,reputation:.28,popularity:.18,commercial:.26,image:.10},
      adj:{sport:-12,rep:4,commercial:20000}
    },
    young:{
      w:{sporting:.22,reputation:.14,popularity:.30,commercial:.20,image:.14},
      adj:{rep:-4,sport:-8,pop:2}
    },
    mass:{
      w:{sporting:.14,reputation:.18,popularity:.32,commercial:.26,image:.10},
      adj:{sport:-18,pop:4}
    },
    performance:{
      w:{sporting:.36,reputation:.22,popularity:.18,commercial:.16,image:.08},
      adj:{sport:-6}
    },
    lifestyle:{
      w:{sporting:.10,reputation:.16,popularity:.30,commercial:.30,image:.14},
      adj:{sport:-10,pop:3,commercial:25000}
    },
    trust:{
      w:{sporting:.12,reputation:.34,popularity:.16,commercial:.28,image:.10},
      adj:{sport:-20,rep:6}
    },
    default:{
      w:{sporting:.22,reputation:.22,popularity:.22,commercial:.24,image:.10},
      adj:{sport:-10}
    }
  };

  function defaultContracts(category){
    if(category==="SPORTSWEAR")return ["SPORTSWEAR","FOOTWEAR","BONUS","CAMPAIGN"];
    if(["TECH","LIFESTYLE","RETAIL","FOOD","BEVERAGE"].includes(category))
      return ["FIXED","CAMPAIGN","BONUS"];
    return ["FIXED","BONUS"];
  }

  function brand(id,name,category,tier,prestige,profile="default",exclusivity="NONE",contractTypes){
    const t=TIER_RULES[tier],p=PROFILE_RULES[profile]||PROFILE_RULES.default;
    const delta=(prestige-70)/10,adj=p.adj||{};
    const age=profile==="young"?[16,27]:profile==="lifestyle"?[18,34]:[17,36];

    const base=Math.round(
      clamp(t.base*(.92+prestige/900),t.base,t.max*.45)/1000
    )*1000;

    const max=Math.round(
      clamp(
        t.max*(.88+prestige/700),
        base*1.8,
        t.max*(tier==="GLOBAL"?1.08:1)
      )/1000
    )*1000;

    return {
      id,
      name,
      category,
      tier,
      prestige,
      budget:max*12,
      minReputation:clamp(Math.round(t.rep+delta+(adj.rep||0)),0,100),
      minPopularity:clamp(Math.round(t.pop+delta+(adj.pop||0)),0,100),
      minSportingValue:clamp(Math.round(t.sport+delta+(adj.sport||0)),0,100),
      minCommercialValue:Math.max(
        20000,
        Math.round((t.commercial+(adj.commercial||0))/10000)*10000
      ),
      contractTypes:contractTypes||defaultContracts(category),
      exclusivity,
      preferredPlayerProfile:profile,
      baseContractValue:base,
      maxContractValue:max,
      bonusPotential:clamp(
        .25+prestige/180+(tier==="GLOBAL"?.18:tier==="PREMIUM"?.1:0),
        .25,.95
      ),
      age,
      regions:tier==="GLOBAL"?["Brasil","Global"]:["Brasil"],
      typicalDuration:
        tier==="GLOBAL"?730:
        tier==="PREMIUM"?540:
        tier==="NATIONAL"?365:
        tier==="REGIONAL"?270:180,
      profile,
      weights:p.w
    };
  }

  const brands = [
    // IDs legados preservados para saves existentes.
    brand("vertex","Volt Sport","SPORTSWEAR","REGIONAL",52,"young","CATEGORY"),
    brand("nova","Umbro","SPORTSWEAR","NATIONAL",72,"sporting","CATEGORY"),
    brand("pulse","Red Bull","BEVERAGE","GLOBAL",95,"social"),
    brand("orbe","Samsung","TECH","GLOBAL",94,"social"),
    brand("voltz","Fiat","AUTOMOTIVE","PREMIUM",82,"professional"),
    brand("linha","Reserva","LIFESTYLE","NATIONAL",66,"lifestyle","NONE",["CAMPAIGN"]),
    brand("aureo","Nike","SPORTSWEAR","GLOBAL",99,"sporting","CATEGORY"),
    brand("nexo","Itaú","FINANCE","PREMIUM",90,"trust"),

    brand("adidas","Adidas","SPORTSWEAR","GLOBAL",98,"sporting","CATEGORY"),
    brand("puma","Puma","SPORTSWEAR","GLOBAL",94,"sporting","CATEGORY"),
    brand("new_balance","New Balance","SPORTSWEAR","PREMIUM",86,"sporting","CATEGORY"),
    brand("reebok","Reebok","SPORTSWEAR","NATIONAL",72,"sporting","CATEGORY"),
    brand("kappa","Kappa","SPORTSWEAR","NATIONAL",68,"sporting","CATEGORY"),
    brand("diadora","Diadora","SPORTSWEAR","NATIONAL",64,"sporting","CATEGORY"),
    brand("athleta","Athleta","SPORTSWEAR","REGIONAL",55,"young","CATEGORY"),

    brand("bradesco","Bradesco","FINANCE","PREMIUM",84,"trust"),
    brand("banco_brasil","Banco do Brasil","FINANCE","PREMIUM",86,"trust"),
    brand("caixa","Caixa","FINANCE","PREMIUM",84,"mass"),
    brand("santander","Santander","FINANCE","PREMIUM",87,"trust"),
    brand("c6","C6 Bank","FINANCE","NATIONAL",76,"social"),
    brand("picpay","PicPay","FINANCE","NATIONAL",74,"young"),
    brand("mercado_pago","Mercado Pago","FINANCE","PREMIUM",82,"social"),
    brand("inter","Inter","FINANCE","NATIONAL",76,"young"),
    brand("pagbank","PagBank","FINANCE","NATIONAL",70,"mass"),
    brand("visa","Visa","FINANCE","GLOBAL",96,"trust"),
    brand("mastercard","Mastercard","FINANCE","GLOBAL",96,"trust"),

    brand("coca_cola","Coca-Cola","BEVERAGE","GLOBAL",98,"mass"),
    brand("guarana","Guaraná Antarctica","BEVERAGE","PREMIUM",84,"mass"),
    brand("gatorade","Gatorade","BEVERAGE","PREMIUM",90,"performance"),
    brand("brahma","Brahma","BEVERAGE","PREMIUM",84,"mass"),
    brand("sadia","Sadia","FOOD","NATIONAL",76,"mass"),
    brand("seara","Seara","FOOD","NATIONAL",76,"mass"),
    brand("mcdonalds","McDonald's","FOOD","GLOBAL",94,"mass"),
    brand("burger_king","Burger King","FOOD","PREMIUM",83,"social"),
    brand("ifood","iFood","FOOD","PREMIUM",88,"social"),
    brand("nestle","Nestlé","FOOD","GLOBAL",94,"trust"),

    brand("motorola","Motorola","TECH","PREMIUM",84,"social"),
    brand("tcl","TCL","TECH","NATIONAL",76,"young"),
    brand("lg","LG","TECH","PREMIUM",84,"social"),
    brand("intel","Intel","TECH","GLOBAL",91,"professional"),
    brand("lenovo","Lenovo","TECH","PREMIUM",82,"professional"),
    brand("dell","Dell","TECH","PREMIUM",81,"professional"),
    brand("amazon","Amazon","TECH","GLOBAL",97,"social"),
    brand("tiktok","TikTok","TECH","GLOBAL",96,"social"),
    brand("kwai","Kwai","TECH","NATIONAL",75,"social"),

    brand("vivo","Vivo","TELECOM","PREMIUM",89,"mass"),
    brand("claro","Claro","TELECOM","PREMIUM",88,"mass"),
    brand("tim","TIM","TELECOM","PREMIUM",86,"mass"),
    brand("algar","Algar Telecom","TELECOM","NATIONAL",68,"professional"),

    brand("chevrolet","Chevrolet","AUTOMOTIVE","PREMIUM",88,"professional"),
    brand("volkswagen","Volkswagen","AUTOMOTIVE","PREMIUM",89,"mass"),
    brand("jeep","Jeep","AUTOMOTIVE","PREMIUM",86,"lifestyle"),
    brand("toyota","Toyota","AUTOMOTIVE","GLOBAL",93,"trust"),
    brand("honda","Honda","AUTOMOTIVE","GLOBAL",92,"trust"),
    brand("byd","BYD","AUTOMOTIVE","PREMIUM",87,"social"),
    brand("gwm","GWM","AUTOMOTIVE","PREMIUM",82,"social"),
    brand("hyundai","Hyundai","AUTOMOTIVE","PREMIUM",87,"mass"),
    brand("nissan","Nissan","AUTOMOTIVE","PREMIUM",83,"professional"),

    brand("casas_bahia","Casas Bahia","RETAIL","NATIONAL",75,"mass"),
    brand("magalu","Magazine Luiza","RETAIL","NATIONAL",80,"social"),
    brand("havan","Havan","RETAIL","NATIONAL",72,"mass"),
    brand("carrefour","Carrefour","RETAIL","PREMIUM",83,"mass"),
    brand("assai","Assaí","RETAIL","NATIONAL",77,"mass"),
    brand("atacadao","Atacadão","RETAIL","NATIONAL",76,"mass"),
    brand("mercado_livre","Mercado Livre","RETAIL","PREMIUM",92,"social"),

    brand("ems","EMS","HEALTH","NATIONAL",76,"trust"),
    brand("neo_quimica","Neo Química","HEALTH","NATIONAL",74,"trust"),
    brand("cimed","Cimed","HEALTH","PREMIUM",84,"social"),
    brand("eurofarma","Eurofarma","HEALTH","NATIONAL",78,"trust"),
    brand("raia","Raia","HEALTH","NATIONAL",76,"mass"),
    brand("drogasil","Drogasil","HEALTH","NATIONAL",78,"mass"),
    brand("pague_menos","Pague Menos","HEALTH","NATIONAL",72,"mass"),

    brand("mrv","MRV","CONSTRUCTION","NATIONAL",76,"mass"),
    brand("direcional","Direcional","CONSTRUCTION","NATIONAL",70,"professional"),
    brand("tenda","Tenda","CONSTRUCTION","NATIONAL",68,"mass"),
    brand("ademicon","Ademicon","CONSTRUCTION","NATIONAL",74,"professional"),
    brand("quartzolit","Quartzolit","CONSTRUCTION","NATIONAL",70,"professional"),
    brand("vedacit","Vedacit","CONSTRUCTION","NATIONAL",68,"professional"),

    brand("shell","Shell","ENERGY","GLOBAL",95,"professional"),
    brand("petrobras","Petrobras","ENERGY","GLOBAL",96,"mass"),
    brand("ipiranga","Ipiranga","ENERGY","PREMIUM",84,"mass"),
    brand("raizen","Raízen","ENERGY","PREMIUM",82,"professional"),
    brand("texaco","Texaco","ENERGY","PREMIUM",80,"professional"),

    brand("porto","Porto","INSURANCE","PREMIUM",84,"trust"),
    brand("tokio_marine","Tokio Marine","INSURANCE","NATIONAL",76,"trust"),
    brand("mapfre","Mapfre","INSURANCE","PREMIUM",80,"trust"),
    brand("hdi","HDI","INSURANCE","NATIONAL",72,"trust"),

    brand("gol","GOL","TRAVEL","PREMIUM",82,"mass"),
    brand("azul","Azul","TRAVEL","PREMIUM",82,"mass"),
    brand("latam","LATAM","TRAVEL","GLOBAL",90,"mass"),
    brand("localiza","Localiza","TRAVEL","PREMIUM",86,"professional"),
    brand("movida","Movida","TRAVEL","NATIONAL",74,"social"),
    brand("uber","Uber","TRAVEL","GLOBAL",93,"social"),

    brand("estacio","Estácio","EDUCATION","NATIONAL",72,"mass"),
    brand("anhanguera","Anhanguera","EDUCATION","NATIONAL",70,"mass"),
    brand("cruzeiro_sul","Cruzeiro do Sul","EDUCATION","NATIONAL",70,"mass"),
    brand("uninassau","Uninassau","EDUCATION","NATIONAL",68,"mass"),

    brand("oakley","Oakley","LIFESTYLE","PREMIUM",88,"lifestyle"),
    brand("lacoste","Lacoste","LIFESTYLE","GLOBAL",92,"lifestyle"),
    brand("armani","Armani","LIFESTYLE","GLOBAL",96,"lifestyle"),
    brand("insider","Insider","LIFESTYLE","NATIONAL",74,"social"),
    brand("natura","Natura","LIFESTYLE","PREMIUM",84,"image")
  ];

  function categoryLabel(category){
    return CATEGORY_LABELS[category]||category||"Patrocínio";
  }

  function brandById(id){
    return brands.find(b=>b.id===id);
  }

  function syncBrandSnapshot(item){
    if(!item||!item.brandId)return item;
    const b=brandById(item.brandId);
    if(!b)return item;
    item.brand=b.name;
    item.category=b.category;
    item.tier=b.tier;
    if("exclusive" in item)item.exclusive=b.exclusivity==="CATEGORY";
    return item;
  }

  function sanitizeContracts(s,c){
    for(const p of c.proposals)syncBrandSnapshot(p);
    for(const x of c.contracts)syncBrandSnapshot(x);
    for(const h of c.history)syncBrandSnapshot(h);

    const groups=new Map();

    for(const x of c.contracts){
      if(
        !x?.brandId ||
        x.status!=="ATIVO" ||
        Number(x.endDay||-1)<s.day
      )continue;

      if(!groups.has(x.brandId))
        groups.set(x.brandId,[]);

      groups.get(x.brandId).push(x);
    }

    for(const list of groups.values()){
      if(list.length<=1)continue;

      list.sort((a,b)=>
        Number(a.signedDay||0)-Number(b.signedDay||0) ||
        Number(a.startDay||0)-Number(b.startDay||0)
      );

      const current=list[0];
      let currentEnd=Number(current.endDay||s.day);

      for(const x of list.slice(1)){
        const oldStart=Number(x.startDay||0);

        const duration=Math.max(
          30,
          Number(
            x.durationDays ||
            ((x.endDay||0)-(x.startDay||0)) ||
            365
          )
        );

        x.status="AGENDADO";
        x.startDay=Math.max(
          Number(x.startDay||s.day),
          currentEnd+1
        );
        x.endDay=x.startDay+duration;
        x.nextPaymentDay=x.startDay;

        currentEnd=x.endDay;

        const h=c.history.find(h=>
          h.brandId===x.brandId &&
          (
            Number(h.startDay||0)===oldStart ||
            h.proposalId===x.proposalId
          )
        );

        if(h){
          h.status="AGENDADO";
          h.startDay=x.startDay;
          h.endDay=x.endDay;
        }

        for(const e of c.events){
          if(
            e.contractId===x.id &&
            ["AGENDADO","REAGENDADO","CONFIRMADO"].includes(e.status)
          ){
            e.status="CANCELADO";
            e.completedDay=s.day;
          }
        }
      }
    }
  }

  function sportingValue(s,api){
    return clamp(
      quality(s,api)*.30+
      performance(s)*.20+
      Number(s.reputation||0)*.40+
      (hasNational(s)?10:0),
      0,100
    );
  }

  function commercialScore(s,api){
    const c=init(s,api);
    return clamp(Number(c.commercialValue||0)/10000,0,100);
  }

  function profileFit(s,b){
    const age=Number(s.person?.age||25);
    const social=Number(s.extras?.playerCareer?.mediaProfile?.sponsorAppeal||45);
    const image=imageScore(s);
    const perf=performance(s);

    switch(b.preferredPlayerProfile){
      case "sporting": return perf*.08+(hasNational(s)?3:0);
      case "performance": return perf*.09;
      case "social": return social*.07;
      case "image":
      case "lifestyle": return image*.07;
      case "young": return age<=24?7:age<=28?3:0;
      case "trust": return Number(s.reputation||0)*.06;
      case "mass": return Number(s.commercial?.popularity||0)*.05;
      default: return 2;
    }
  }

  function deterministicRoll(s,b,salt=""){
    const text=`${b.id}|${s.season}|${s.day}|${salt}`;
    let h=2166136261;
    for(const ch of text){
      h^=ch.charCodeAt(0);
      h=Math.imul(h,16777619);
    }
    return (h>>>0)/4294967295;
  }

  function exclusiveConflict(c,b,s){
    return c.contracts.find(x=>
      x.status==="ATIVO" &&
      Number(x.startDay||0)<=s.day &&
      Number(x.endDay||0)>=s.day &&
      x.brandId!==b.id &&
      x.category===b.category &&
      (x.exclusive||b.exclusivity==="CATEGORY")
    );
  }
  const stages = ["SEM INTERESSE","OBSERVANDO","INTERESSADA","CONTATO","NEGOCIAÇÃO","PROPOSTA","CONTRATO ATIVO","ENCERRADO"];
  function blank(s) {
    const initial = clamp(Math.round(8 + Number(s.reputation || 0) * .32 + Number(s.extras?.playerCareer?.mediaProfile?.sponsorAppeal || 45) * .12), 5, 55);
    return {version:1,popularity:initial,followers:Math.max(100,Number(s.fans||100)),commercialValue:0,exposure:initial,interests:[],proposals:[],negotiations:[],contracts:[],payments:{},relations:{},events:[],history:[],milestones:[],processed:{},lastTick:-9999,lastFansSnapshot:Number(s.fans||100),revenue:0,bonusRevenue:0};
  }
  function init(s, api) {
    if (!s.commercial || typeof s.commercial !== "object") s.commercial=blank(s);
    const c=s.commercial;

    for(const key of ["interests","proposals","negotiations","contracts","events","history","milestones"])
      if(!Array.isArray(c[key]))c[key]=[];

    for(const key of ["payments","relations","processed"])
      if(!c[key]||typeof c[key]!=="object")c[key]={};

    if(!Number.isFinite(c.popularity))c.popularity=10;
    if(!Number.isFinite(c.followers))c.followers=Math.max(100,Number(s.fans||100));
    if(!Number.isFinite(c.exposure))c.exposure=c.popularity;
    if(!Number.isFinite(c.lastFansSnapshot))c.lastFansSnapshot=Number(s.fans||100);
    if(!Number.isFinite(c.revenue))c.revenue=0;
    if(!Number.isFinite(c.bonusRevenue))c.bonusRevenue=0;

    sanitizeContracts(s,c);

    c.proposals=[
      ...c.proposals.filter(x=>x.status==="PROPOSTA"),
      ...c.proposals.filter(x=>x.status!=="PROPOSTA").slice(0,80)
    ].slice(0,100);

    c.negotiations=c.negotiations.slice(0,80);

    c.contracts=[
      ...c.contracts.filter(x=>["ATIVO","AGENDADO"].includes(x.status)),
      ...c.contracts.filter(x=>!["ATIVO","AGENDADO"].includes(x.status)).slice(0,80)
    ].slice(0,110);

    c.events=[
      ...c.events.filter(x=>["AGENDADO","REAGENDADO","CONFIRMADO"].includes(x.status)),
      ...c.events.filter(x=>!["AGENDADO","REAGENDADO","CONFIRMADO"].includes(x.status)).slice(-80)
    ].slice(0,110);

    c.history=c.history.slice(0,80);
    c.milestones=c.milestones.slice(-40);
    c.version=2;

    updateValue(s,api);
    return c;
  }
  function quality(s,api){return Number(api?.overall?.(s.person)||0);}
  function hasNational(s){return Number(s.nationalTeam?.caps||0)>0 || !!s.nationalTeam?.calledUp;}
  function performance(s){const r=s.statistics?.players?.hero;return r?.appearances?clamp((Number(r.ratingTotal||0)/r.appearances-5.5)*18+Number(r.goals||0)*.15+Number(r.assists||0)*.1,0,100):0;}
  function imageScore(s){const m=s.extras?.playerCareer?.mediaProfile;return clamp((Number(m?.fanSentiment||50)+Number(m?.sponsorAppeal||45)-Number(m?.controversies||0)*4)/2,0,100);}
  function updateValue(s,api){
    const c=s.commercial||blank(s), age=Number(s.person?.age||25), ageFactor=age<=24?1.08:age<=30?1:age<=34?.82:.58;
    const club=api?.club?.(s), clubFactor=club?clamp(Number(club.structure||50)/70,.55,1.35):.45;
    const selection=hasNational(s)?1.18:1, awards=(s.statistics?.awards||[]).filter(a=>a.winnerId==="hero"||a.winner===s.person?.name).length;
    const score=c.popularity*.43+Number(s.reputation||0)*.25+performance(s)*.12+imageScore(s)*.12+Math.min(8,awards*1.5)+(root.ProLifeIdentity?.commercialAppeal?.(s)||0);
    c.commercialValue=Math.max(20000,Math.round(score*score*210*ageFactor*clubFactor*selection/1000)*1000);
    return c.commercialValue;
  }
  function scoreBrand(s,brand,api){
    const c=init(s,api);
    const age=Number(s.person?.age||25);
    const agent=s.extras?.playerCareer?.agent;
    const weights=brand.weights||PROFILE_RULES.default.w;

    const sporting=sportingValue(s,api);
    const commercial=commercialScore(s,api);
    const popularity=Number(c.popularity||0);
    const reputation=Number(s.reputation||0);
    const image=imageScore(s);
    const personality=root.ProLifePlayerPersonality?.commercialModifier?.(s)||0;

    const ageFit=
      age>=brand.age[0]&&age<=brand.age[1]
        ? 4
        : -Math.min(
            15,
            Math.abs(age-clamp(age,brand.age[0],brand.age[1]))*3
          );

    const merit=
      sporting*weights.sporting+
      reputation*weights.reputation+
      popularity*weights.popularity+
      commercial*weights.commercial+
      image*weights.image+
      profileFit(s,brand)+
      personality+
      (hasNational(s)?4:0)+
      ageFit;

    const access=
      Math.min(5,Number(agent?.reputation||0)/25)+
      Math.min(3,Number(agent?.network?.includes("América")||0)*2);

    return Math.round(clamp(merit+access,0,110)*10)/10;
  }
  function eligible(s,b,api){
    const c=init(s,api);
    const age=Number(s.person?.age||25);

    return (
      c.popularity>=b.minPopularity &&
      Number(s.reputation||0)>=b.minReputation &&
      sportingValue(s,api)>=b.minSportingValue &&
      Number(c.commercialValue||0)>=b.minCommercialValue &&
      age>=b.age[0]-2 &&
      age<=b.age[1]+2
    );
  }
  function offerFor(s,b,api){
    const c=init(s,api);

    const score=scoreBrand(s,b,api);
    const sporting=sportingValue(s,api);
    const commercial=commercialScore(s,api);
    const recent=performance(s);
    const club=api?.club?.(s);
    const clubPower=clamp(Number(club?.structure||45),0,100);

    const awards=(s.statistics?.awards||[]).filter(a=>
      a.winnerId==="hero"||a.winner===s.person?.name
    ).length;

    const age=Number(s.person?.age||25);
    const ageFactor=
      age<=23?1.04:
      age<=30?1:
      age<=33?.92:.82;

    const composite=
      score*.38+
      sporting*.18+
      commercial*.16+
      recent*.12+
      clubPower*.08+
      Math.min(10,awards*2)+
      (hasNational(s)?5:0);

    const progress=clamp((composite-32)/72,0,1);

    const raw=
      b.baseContractValue+
      (b.maxContractValue-b.baseContractValue)*
      Math.pow(progress,1.7);

    const amount=Math.round(
      clamp(
        raw*ageFactor,
        b.baseContractValue,
        b.maxContractValue
      )/1000
    )*1000;

    const onlyCampaign=
      b.contractTypes.length===1 &&
      b.contractTypes[0]==="CAMPAIGN";

    const type=
      onlyCampaign
        ? "CAMPANHA PONTUAL"
        : b.category==="SPORTSWEAR" &&
          ["PREMIUM","GLOBAL"].includes(b.tier)
          ? "CONTRATO POR TEMPORADA"
          : b.contractTypes.includes("BONUS")
            ? "FIXO + BÔNUS"
            : "PAGAMENTO FIXO";

    const duration=b.typicalDuration||365;

    const bonusAmount=Math.round(
      amount*
      b.bonusPotential*
      (.45+progress*.45)/
      1000
    )*1000;

    return {
      id:`proposal:${b.id}:${s.season}:${s.day}`,
      brandId:b.id,
      brand:b.name,
      category:b.category,
      tier:b.tier,
      type,
      amount,
      durationDays:duration,
      bonus:{
        kind:hasNational(s)?"title":"callup",
        amount:bonusAmount,
        label:hasNational(s)?"Bônus por título":"Bônus por convocação"
      },
      requirements:[
        "Manter exposição profissional",
        "Comparecer aos eventos confirmados"
      ],
      exclusive:b.exclusivity==="CATEGORY",
      startDay:s.day+1,
      endDay:s.day+duration+1,
      expires:s.day+14,
      round:0,
      status:"PROPOSTA"
    };
  }
  function message(s,helpers,subject,body,priority="NORMAL",eventId){helpers?.addMessage?.(s,{category:"AGENTE",sender:"Agente",subject,body,priority,eventId});}
  function article(s,helpers,title,body,eventId){helpers?.addArticle?.(s,{category:"JOGADOR",title,body,eventId});}
  function progressInterests(s,rng,helpers,api){
    if(s.mode!=="player")return;

    const c=init(s,api);
    if(s.day-c.lastTick<14)return;
    c.lastTick=s.day;

    const openProposalCount=()=>
      c.proposals.filter(p=>p.status==="PROPOSTA").length;

    let lastFormalProposalDay=c.proposals.reduce((latest,p)=>{
      const inferredDay=Number.isFinite(p.startDay)
        ? p.startDay-1
        : -9999;

      return Math.max(latest,inferredDay);
    },-9999);

    let formalProposalCreated=false;

    for(const b of brands){
      const sameActive=c.contracts.some(x=>
        x.brandId===b.id &&
        x.status==="ATIVO" &&
        Number(x.startDay||0)<=s.day &&
        Number(x.endDay||0)>=s.day
      );

      if(sameActive)continue;
      if(exclusiveConflict(c,b,s))continue;

      let item=c.interests.find(x=>x.brandId===b.id);
      const score=scoreBrand(s,b,api);

      if(!item){
        const threshold=Math.max(
          30,
          b.minPopularity*.45+b.minReputation*.35+b.minSportingValue*.20
        );

        if(score<threshold)continue;

        const tierChance={
          LOCAL:.30,
          REGIONAL:.22,
          NATIONAL:.14,
          PREMIUM:.075,
          GLOBAL:.035
        }[b.tier]||.08;

        const chance=clamp(
          tierChance+
          score/700+
          (eligible(s,b,api)?.06:0),
          .02,
          .42
        );

        if(deterministicRoll(s,b,"interest")>chance)continue;

        item={
          brandId:b.id,
          stage:"OBSERVANDO",
          score,
          startedDay:s.day,
          updatedDay:s.day,
          ticks:0
        };

        c.interests.push(item);

        message(
          s,helpers,
          "Marca começou a observar",
          `${b.name} acompanha sua evolução, sem proposta formal.`,
          "NORMAL",
          `commercial:observe:${b.id}:${s.day}`
        );
      }

      if(!item||["CONTRATO ATIVO","ENCERRADO"].includes(item.stage))continue;

      item.score=score;
      item.updatedDay=s.day;
      item.ticks++;

      if(
        item.stage==="OBSERVANDO" &&
        item.ticks>=2 &&
        eligible(s,b,api)
      ){
        item.stage="INTERESSADA";
      }else if(
        item.stage==="INTERESSADA" &&
        item.ticks>=3
      ){
        item.stage="CONTATO";

        message(
          s,helpers,
          "Contato comercial",
          `${b.name} autorizou seu agente a iniciar conversas.`,
          "IMPORTANTE",
          `commercial:contact:${b.id}:${s.day}`
        );
      }else if(
        item.stage==="CONTATO" &&
        item.ticks>=4
      ){
        item.stage="NEGOCIAÇÃO";
      }else if(
        item.stage==="NEGOCIAÇÃO" &&
        item.ticks>=5 &&
        eligible(s,b,api) &&
        !c.proposals.some(p=>p.brandId===b.id&&p.status==="PROPOSTA") &&
        openProposalCount()<2 &&
        !formalProposalCreated &&
        s.day-lastFormalProposalDay>=28
      ){
        if(
          c.contracts.some(x=>
            x.brandId===b.id &&
            x.status==="ATIVO" &&
            x.endDay>=s.day
          )
        )continue;

        if(exclusiveConflict(c,b,s))continue;

        const p=offerFor(s,b,api);
        c.proposals.unshift(p);
        item.stage="PROPOSTA";

        formalProposalCreated=true;
        lastFormalProposalDay=s.day;

        message(
          s,helpers,
          "Proposta de patrocínio",
          `${b.name} enviou proposta de ${p.type.toLowerCase()} no valor de R$ ${p.amount.toLocaleString("pt-BR")}.`,
          "IMPORTANTE",
          p.id
        );
      }
    }

    c.interests=c.interests.slice(-Math.max(120,brands.length));
    updateValue(s,api);
  }
  function active(s){
    return init(s).contracts.filter(x=>
      x.status==="ATIVO" &&
      Number(x.endDay||0)>=s.day
    );
  }
  function accept(s,id,helpers,api){
    const c=init(s,api);

    const p=c.proposals.find(x=>
      x.id===id &&
      x.status==="PROPOSTA" &&
      x.expires>=s.day
    );

    if(!p)throw Error("Proposta comercial indisponível.");

    const sameBrand=active(s).find(x=>x.brandId===p.brandId);

    if(sameBrand&&!p.renewalOf){
      throw Error(`${p.brand} já possui contrato ativo com o jogador.`);
    }

    if(p.renewalOf){
      const current=c.contracts.find(x=>
        x.id===p.renewalOf &&
        x.brandId===p.brandId &&
        x.status==="ATIVO"
      );

      if(!current)
        throw Error("Contrato original da renovação não está mais ativo.");

      if(
        c.contracts.some(x=>
          x.brandId===p.brandId &&
          x.status==="AGENDADO" &&
          x.renewalOf===current.id
        )
      ){
        throw Error("Esta renovação já foi agendada.");
      }

      p.status="ACEITA";

      const startDay=current.endDay+1;

      const contract={
        ...p,
        id:`contract:${p.brandId}:${startDay}`,
        proposalId:p.id,
        renewalOf:current.id,
        status:"AGENDADO",
        signedDay:s.day,
        startDay,
        endDay:startDay+p.durationDays,
        nextPaymentDay:startDay,
        relationship:Math.max(70,Number(current.relationship||70)),
        warnings:0,
        paidBonuses:[]
      };

      c.contracts.unshift(contract);

      c.history.unshift({
        brandId:p.brandId,
        brand:p.brand,
        category:p.category,
        tier:p.tier,
        startDay:contract.startDay,
        endDay:contract.endDay,
        value:p.amount,
        status:"AGENDADO",
        proposalId:p.id
      });

      message(
        s,helpers,
        "Renovação assinada",
        `A renovação com ${p.brand} foi confirmada e começará após o encerramento do contrato atual.`,
        "IMPORTANTE",
        contract.id
      );

      article(
        s,helpers,
        `${s.person.name} renova parceria com ${p.brand}`,
        `${p.brand} e ${s.person.name} acertaram a continuidade da parceria comercial. O novo vinculo tera ${p.durationDays} dias e valor de R$ ${Number(p.amount||0).toLocaleString("pt-BR")}. O acordo comeca apos o termino do contrato atual.`,
        `commercial:renewal:article:${contract.id}`
      );

      return contract;
    }

    const conflict=active(s).find(x=>
      x.brandId!==p.brandId &&
      x.category===p.category &&
      (x.exclusive||p.exclusive)
    );

    if(conflict){
      conflict.status="ENCERRADO";
      conflict.endDay=s.day;
      conflict.replacedBy=p.brandId;
      conflict.replacedDay=s.day;

      const previousHistory=c.history.find(h=>
        h.brandId===conflict.brandId &&
        h.startDay===conflict.startDay &&
        h.status==="ATIVO"
      );

      if(previousHistory){
        previousHistory.status="SUBSTITUÍDO";
        previousHistory.endDay=s.day;
        previousHistory.replacedBy=p.brand;
      }

      const previousInterest=c.interests.find(i=>
        i.brandId===conflict.brandId
      );

      if(previousInterest)previousInterest.stage="ENCERRADO";

      for(const event of c.events){
        if(
          event.contractId===conflict.id &&
          ["AGENDADO","REAGENDADO","CONFIRMADO"].includes(event.status)
        ){
          event.status="CANCELADO";
          event.completedDay=s.day;
        }
      }

      message(
        s,helpers,
        "Mudança de patrocinador",
        `${conflict.brand} deixou de ser patrocinadora de ${categoryLabel(p.category).toLowerCase()} após o novo acordo com ${p.brand}.`,
        "IMPORTANTE",
        `commercial:replacement:${conflict.id}:${p.brandId}:${s.day}`
      );
    }

    p.status="ACEITA";

    const contract={
      ...p,
      id:`contract:${p.brandId}:${s.day}`,
      proposalId:p.id,
      status:"ATIVO",
      signedDay:s.day,
      startDay:Math.max(s.day,p.startDay),
      endDay:s.day+p.durationDays,
      nextPaymentDay:Math.max(s.day,p.startDay),
      relationship:70,
      warnings:0,
      paidBonuses:[]
    };

    c.contracts.unshift(contract);
    c.relations[p.brandId]=70;

    const interest=c.interests.find(x=>x.brandId===p.brandId);
    if(interest)interest.stage="CONTRATO ATIVO";

    c.history.unshift({
      brandId:p.brandId,
      brand:p.brand,
      category:p.category,
      tier:p.tier,
      startDay:contract.startDay,
      endDay:contract.endDay,
      value:p.amount,
      status:"ATIVO",
      proposalId:p.id
    });

    message(
      s,helpers,
      "Patrocínio assinado",
      `${p.brand} agora é patrocinadora. O contrato começa no dia ${contract.startDay}.`,
      "IMPORTANTE",
      contract.id
    );

    const majorDeal=["NATIONAL","PREMIUM","GLOBAL"].includes(p.tier);

    article(
      s,helpers,
      majorDeal
        ? `${s.person.name} anuncia novo acordo com ${p.brand}`
        : `${s.person.name} fecha parceria com ${p.brand}`,
      `${p.brand} passa a integrar o portfolio de patrocinadores de ${s.person.name}. O acordo de ${p.durationDays} dias foi fechado por R$ ${Number(p.amount||0).toLocaleString("pt-BR")} e reforca o crescimento comercial do atleta.${majorDeal?" A parceria ganha destaque nacional pela relevancia da marca e pelo momento da carreira.":""}`,
      `commercial:contract:article:${contract.id}`
    );

    c.popularity=clamp(c.popularity+2,0,100);
    c.followers+=Math.round(500+p.amount/20);

    scheduleEvent(s,contract,api);
    updateValue(s,api);

    return contract;
  }
  function reject(s,id,helpers,api){const c=init(s,api),p=c.proposals.find(x=>x.id===id&&x.status==="PROPOSTA");if(!p)throw Error("Proposta indisponível.");p.status="RECUSADA";const i=c.interests.find(x=>x.brandId===p.brandId);if(i)i.stage="ENCERRADO";message(s,helpers,"Proposta recusada",`Seu agente comunicou a recusa à ${p.brand}.`,"NORMAL",`commercial:reject:${p.id}`);}
  function hold(s,id,helpers,api){const p=init(s,api).proposals.find(x=>x.id===id&&x.status==="PROPOSTA");if(!p)throw Error("Proposta indisponível.");if(p.expires-s.day>=14)throw Error("A marca já aguarda sua resposta.");p.expires+=7;message(s,helpers,"Prazo comercial ampliado",`${p.brand} concedeu mais 7 dias para resposta.`,"NORMAL",`commercial:hold:${p.id}:${p.expires}`);return p;}
  function negotiate(s,id,terms,helpers,api){
    const c=init(s,api),p=c.proposals.find(x=>x.id===id&&x.status==="PROPOSTA");if(!p)throw Error("Proposta indisponível.");if(p.round>=2)throw Error("Limite de negociação atingido.");
    const wanted=Math.max(p.amount,Math.round(Number(terms.amount||p.amount))),duration=clamp(Math.round(Number(terms.durationDays||p.durationDays)),90,1095),bonus=Math.max(0,Math.round(Number(terms.bonus||p.bonus.amount)));
    p.round++;const b=brands.find(x=>x.id===p.brandId),agent=Number(s.extras?.playerCareer?.agent?.negotiation||50),ratio=wanted/Math.max(1,p.amount),power=scoreBrand(s,b,api)+agent*.16-p.round*4;
    if(ratio<=1.18&&power>=b.prestige*.72){p.amount=wanted;p.durationDays=duration;p.bonus.amount=bonus;p.startDay=s.day+1;p.endDay=p.startDay+duration;message(s,helpers,"Contraproposta aceita",`${p.brand} aceitou os novos termos.`,"IMPORTANTE",`commercial:negotiation:${p.id}:${p.round}`);return "ACEITA";}
    if(ratio<=1.45&&power>=45){p.amount=Math.round((p.amount+wanted*.45)/1000)*1000;p.durationDays=Math.round((p.durationDays+duration)/2);p.bonus.amount=Math.round((p.bonus.amount+bonus*.5)/1000)*1000;message(s,helpers,"Marca fez contraproposta",`${p.brand} ajustou valor, duração e bônus.`,"IMPORTANTE",`commercial:negotiation:${p.id}:${p.round}`);return "CONTRAPROPOSTA";}
    p.status="RETIRADA";const i=c.interests.find(x=>x.brandId===p.brandId);if(i)i.stage="ENCERRADO";message(s,helpers,"Oferta retirada",`${p.brand} encerrou as conversas após a contraproposta.`,"NORMAL",`commercial:withdraw:${p.id}`);return "RETIRADA";
  }
  function officialOnDay(s,day){
    const yearStart=(s.season-2026)*365;
    if((s.calendarDays||[]).some((d,i)=>yearStart+d===day&&i>=s.round))return true;
    const sch=s.competitionSchedule||{};if((sch.state?.fixtures||[]).some(x=>!x.played&&x.date===day))return true;
    if((sch.cup?.rounds||[]).some(r=>r.date===day&&(r.pairs||[]).some(x=>!x.played&&[x.home,x.away].includes(s.clubId))))return true;
    if((s.nationalTeam?.schedule||[]).some(x=>!x.played&&x.day===day&&(x.calledUp||s.nationalTeam?.calledUp)))return true;return false;
  }
  function scheduleEvent(s,contract,api,baseDay){const c=init(s,api),types=["SESSÃO DE FOTOS","EVENTO DA MARCA","CAMPANHA","ENTREVISTA PROMOCIONAL"],count=c.events.filter(x=>x.contractId===contract.id).length;let day=Math.max(Number(baseDay||s.day+5),contract.startDay+4);while(officialOnDay(s,day))day++;const id=`commercial-event:${contract.id}:${day}`;if(!c.events.some(x=>x.id===id))c.events.push({id,contractId:contract.id,brandId:contract.brandId,brand:contract.brand,day,type:types[count%types.length],status:"AGENDADO",mandatory:count%3===2,reschedules:0});}
  function endForWarnings(s,contract,c,helpers){if(contract.warnings<3||contract.relationship>=40)return false;contract.status="ENCERRADO";contract.endDay=s.day;const h=c.history.find(h=>h.brandId===contract.brandId&&h.startDay===contract.startDay);if(h){h.status="ENCERRADO";h.endDay=s.day;}message(s,helpers,"Contrato comercial encerrado",`${contract.brand} encerrou o acordo após obrigações comerciais ignoradas.`,"IMPORTANTE",`commercial:breach:${contract.id}`);return true;}
  function eventAction(s,id,choice,helpers,api){const c=init(s,api),e=c.events.find(x=>x.id===id&&["AGENDADO","REAGENDADO","CONFIRMADO"].includes(x.status));if(!e)throw Error("Evento comercial indisponível.");const x=c.contracts.find(x=>x.id===e.contractId&&x.status==="ATIVO");if(!x)throw Error("Contrato comercial não está ativo.");if(e.status==="CONFIRMADO")throw Error("Evento comercial já confirmado e aguardando realização.");if(choice==="participate"){e.status="CONFIRMADO";message(s,helpers,"Presença confirmada",`Você confirmou participação em ${e.type.toLowerCase()} da ${e.brand}.`,"NORMAL",`commercial:event:confirm:${e.id}`);return e;}if(choice==="reschedule"){if((e.reschedules||0)>=2)throw Error("Limite de reagendamentos atingido.");let day=Math.max(s.day+1,e.day+1);while(officialOnDay(s,day))day++;e.day=day;e.status="REAGENDADO";e.reschedules=(e.reschedules||0)+1;x.relationship=clamp(x.relationship-1,0,100);c.relations[x.brandId]=x.relationship;message(s,helpers,"Evento reagendado",`${e.brand} aceitou uma nova data para ${e.type.toLowerCase()}.`,"NORMAL",`commercial:event:reschedule:${e.id}:${e.reschedules}`);return e;}if(choice==="decline"){e.status="RECUSADO";e.completedDay=s.day;x.warnings=(x.warnings||0)+1;x.relationship=clamp(x.relationship-(e.mandatory?12:5),0,100);c.relations[x.brandId]=x.relationship;message(s,helpers,"Evento recusado",`${e.brand} registrou sua ausência${e.mandatory?" em uma obrigação importante":""}.`,e.mandatory?"IMPORTANTE":"NORMAL",`commercial:event:decline:${e.id}`);if(!endForWarnings(s,x,c,helpers)&&x.endDay>s.day+60)scheduleEvent(s,x,api,s.day+90);return e;}throw Error("Decisão comercial inválida.");}
  function pay(s,contract,amount,label,key,helpers){
    const c=init(s);

    if(c.payments[key])
      return false;

    c.payments[key]=s.day;

    helpers.transaction(
      s,
      amount,
      label
    );

    if(
      Number(amount)>0 &&
      typeof helpers.chargeAgentCommission==="function"
    ){
      helpers.chargeAgentCommission(
        s,
        amount,
        "commercial"
      );
    }

    c.revenue+=amount;

    if(label.includes("B\u00f4nus"))
      c.bonusRevenue+=amount;

    return true;
  }
  function processContracts(s,helpers,api){
    const c=init(s,api);

    for(const x of c.contracts){
      if(x.status==="AGENDADO"){
        if(s.day<x.startDay)continue;

        const duplicate=c.contracts.find(other=>
          other!==x &&
          other.brandId===x.brandId &&
          other.status==="ATIVO" &&
          other.endDay>=s.day
        );

        if(duplicate){
          x.startDay=duplicate.endDay+1;
          x.endDay=x.startDay+x.durationDays;
          x.nextPaymentDay=x.startDay;
          continue;
        }

        x.status="ATIVO";
        x.nextPaymentDay=Math.max(x.startDay,s.day);

        const h=c.history.find(h=>
          h.brandId===x.brandId &&
          h.proposalId===x.proposalId
        );

        if(h)h.status="ATIVO";

        const interest=c.interests.find(i=>i.brandId===x.brandId);
        if(interest)interest.stage="CONTRATO ATIVO";

        message(
          s,helpers,
          "Renovação iniciada",
          `O novo contrato com ${x.brand} entrou em vigor.`,
          "NORMAL",
          `commercial:renewal-start:${x.id}`
        );

        scheduleEvent(s,x,api);
      }

      if(x.status!=="ATIVO")continue;

      if(s.day>x.endDay){
        x.status="ENCERRADO";

        const h=c.history.find(h=>
          h.brandId===x.brandId &&
          h.startDay===x.startDay
        );

        if(h)h.status="ENCERRADO";

        const i=c.interests.find(i=>i.brandId===x.brandId);
        if(i)i.stage="ENCERRADO";

        message(
          s,helpers,
          "Contrato comercial encerrado",
          `O acordo com ${x.brand} chegou ao fim.`,
          "NORMAL",
          `commercial:end:${x.id}`
        );

        continue;
      }

      if(s.day>=x.nextPaymentDay){
        const key=`commercial:payment:${x.id}:${x.nextPaymentDay}`;
        pay(s,x,x.amount,`Patrocínio — ${x.brand}`,key,helpers);
        x.nextPaymentDay+=30;
      }

      const awards=(s.statistics?.awards||[]).filter(a=>
        (a.winnerId==="hero"||a.winner===s.person?.name) &&
        Number(a.season)===Number(s.season)
      );

      const bonusReady=
        x.bonus.kind==="callup"
          ? hasNational(s)
          : awards.length>0;

      if(bonusReady){
        const marker=
          x.bonus.kind==="callup"
            ? `callup:${s.nationalTeam?.firstCallupDay||s.day}`
            : `award:${awards[0]?.name||s.season}`;

        pay(
          s,x,x.bonus.amount,
          `Bônus de patrocínio — ${x.brand}`,
          `commercial:bonus:${x.id}:${marker}`,
          helpers
        );
      }

      const totalDuration=Math.max(
        30,
        Number(x.durationDays||x.endDay-x.startDay)
      );

      const renewalWindow=Math.max(
        14,
        Math.round(totalDuration*.15)
      );

      const remaining=x.endDay-s.day;

      if(
        remaining>=0 &&
        remaining<=renewalWindow &&
        c.proposals.filter(p=>p.status==="PROPOSTA").length<2 &&
        !c.proposals.some(p=>
          p.renewalOf===x.id &&
          p.status==="PROPOSTA"
        ) &&
        !c.contracts.some(contract=>
          contract.renewalOf===x.id &&
          contract.status==="AGENDADO"
        ) &&
        x.relationship>=55
      ){
        const b=brandById(x.brandId);

        if(b){
          const p=offerFor(s,b,api);

          p.id=`renewal:${x.id}:${s.day}`;
          p.renewalOf=x.id;
          p.startDay=x.endDay+1;
          p.endDay=p.startDay+p.durationDays;

          p.amount=Math.min(
            b.maxContractValue,
            Math.max(
              Math.round(Number(x.amount||0)*1.05/1000)*1000,
              Math.round(p.amount*(1+c.popularity/400)/1000)*1000
            )
          );

          p.bonus.amount=Math.max(
            Number(x.bonus?.amount||0),
            p.bonus.amount
          );

          c.proposals.unshift(p);

          message(
            s,helpers,
            "Renovação de patrocínio",
            `${x.brand} ofereceu renovar o acordo para o período seguinte.`,
            "IMPORTANTE",
            p.id
          );
        }
      }
    }

    for(const e of c.events.filter(e=>
      e.status==="CONFIRMADO" &&
      e.day<=s.day
    )){
      if(officialOnDay(s,e.day)){
        e.day++;
        e.status="CONFIRMADO";

        message(
          s,helpers,
          "Compromisso comercial reagendado",
          `${e.type} da ${e.brand} foi movida para o dia ${e.day} por conflito com compromisso esportivo.`,
          "NORMAL",
          `commercial:event:auto-reschedule:${e.id}:${e.day}`
        );

        continue;
      }

      const x=c.contracts.find(x=>x.id===e.contractId);
      const beforeRel=Number(x?.relationship||0);
      const beforePop=Number(c.popularity||0);
      const beforeFollowers=Number(c.followers||0);

      const signature=[...String(e.id)].reduce(
        (a,ch)=>((a*31)+ch.charCodeAt(0))>>>0,
        2166136261
      );

      const image=clamp(
        Number(s.reputation||0)*.45+
        c.popularity*.35+
        beforeRel*.20,
        0,100
      );

      const roll=signature%100;

      const tier=
        image+roll*.25>=88
          ? "EXCELENTE"
          : image+roll*.25>=63
            ? "POSITIVO"
            : "NORMAL";

      const relGain=tier==="EXCELENTE"?5:tier==="POSITIVO"?3:2;
      const popGain=tier==="EXCELENTE"?2:tier==="POSITIVO"?1:.5;

      const followerGain=Math.round(
        (tier==="EXCELENTE"?500:tier==="POSITIVO"?300:180)+
        c.popularity*(tier==="EXCELENTE"?18:12)
      );

      e.status="CONCLUÍDO";
      e.completedDay=s.day;

      e.result={
        tier,
        relationshipDelta:relGain,
        popularityDelta:popGain,
        followersDelta:followerGain
      };

      if(x){
        x.relationship=clamp(x.relationship+relGain,0,100);
        c.relations[x.brandId]=x.relationship;

        if(x.status==="ATIVO"&&x.endDay>s.day+60)
          scheduleEvent(s,x,api,s.day+90);
      }

      c.popularity=clamp(c.popularity+popGain,0,100);
      c.followers+=followerGain;

      s.person.condition=clamp(
        Number(s.person.condition||0)-2,
        0,100
      );

      if(s.life?.finance)
        s.life.finance.wellbeing=clamp(
          Number(s.life.finance.wellbeing||65)-1,
          0,100
        );

      const reception=
        tier==="EXCELENTE"
          ? "A ação teve excelente repercussão."
          : tier==="POSITIVO"
            ? "A ação teve boa repercussão."
            : "A atividade foi concluída conforme o planejado.";

      message(
        s,helpers,
        "Resultado do compromisso comercial",
        `${e.type} da ${e.brand} foi concluída. ${reception} Relação com a marca +${Math.round((Number(x?.relationship||beforeRel))-beforeRel)}, popularidade +${(c.popularity-beforePop).toFixed(1).replace(".0","")} e ${Math.max(0,c.followers-beforeFollowers).toLocaleString("pt-BR")} novos seguidores.`,
        "IMPORTANTE",
        `commercial:event:done:${e.id}`
      );

      article(
        s,helpers,
        `${s.person.name} participa de ${e.type.toLowerCase()} da ${e.brand}`,
        `${reception} O compromisso comercial foi cumprido sem substituir os compromissos esportivos.`,
        `commercial:event:article:${e.id}`
      );
    }
  }
  function syncAudience(s,api){const c=init(s,api),raw=Number(s.fans||0),delta=raw-c.lastFansSnapshot;if(delta){c.followers=Math.max(0,c.followers+delta);c.popularity=clamp(c.popularity+clamp(delta/1000,-.5,1.2),0,100);c.exposure=clamp(c.exposure+clamp(delta/800,-1,2),0,100);}c.lastFansSnapshot=raw;if(s.day%30===0&&performance(s)<25){c.popularity=clamp(c.popularity-.35,0,100);c.exposure=clamp(c.exposure-.5,0,100);}for(const mark of [100000,1000000,5000000,10000000])if(c.followers>=mark&&!c.milestones.some(x=>x.value===mark))c.milestones.push({day:s.day,season:s.season,value:mark,label:`${mark.toLocaleString("pt-BR")} seguidores`});updateValue(s,api);}
  function onMatch(s,m,helpers,api){if(s.mode!=="player"||!m.ratings?.hero)return;const c=init(s,api),rating=Number(m.ratings.hero||0),goals=(m.events||[]).filter(e=>e.type==="goal"&&e.playerId==="hero").length,boost=rating>=8?2:rating>=7?.7:rating<6?-.4:0;c.popularity=clamp(c.popularity+boost+goals*.8,0,100);c.exposure=clamp(c.exposure+Math.max(0,boost)+goals,0,100);c.followers=Math.max(0,c.followers+Math.round(Math.max(-80,boost*350+goals*700)));updateValue(s,api);}
  function daily(s,rng,helpers,api){if(s.mode!=="player")return;init(s,api);syncAudience(s,api);processContracts(s,helpers,api);if(s.day%14===0)progressInterests(s,rng,helpers,api);const c=s.commercial;for(const p of c.proposals)if(p.status==="PROPOSTA"&&p.expires<s.day)p.status="EXPIRADA";}
  function summary(s,api){const c=init(s,api);return {popularity:c.popularity,followers:c.followers,commercialValue:updateValue(s,api),active:active(s),revenue:c.revenue,bonusRevenue:c.bonusRevenue,nextEvent:c.events.filter(e=>["AGENDADO","REAGENDADO","CONFIRMADO"].includes(e.status)&&e.day>=s.day).sort((a,b)=>a.day-b.day)[0]||null};}
  const api={brands,stages,categoryLabel,sportingValue,init,summary,quality,updateValue,scoreBrand,eligible,progressInterests,active,accept,reject,hold,negotiate,eventAction,daily,onMatch,officialOnDay,scheduleEvent,processContracts};
  root.ProLifeCommercial=api;if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
