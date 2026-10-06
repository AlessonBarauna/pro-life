(function(root){
  "use strict";

  const VERSION=1,HISTORY_LIMIT=100;
  const traitKeys=["professionalism","ambition","loyalty","humility","leadership","discipline","mediaPresence","teamOrientation"];
  const reputationKeys=["public","dressingRoom","coach","commercial"];
  const profiles=["PROFISSIONAL","LÍDER","AMBICIOSO","HUMILDE","MIDIÁTICO","LEAL","COMPETITIVO","DISCIPLINADO","COLETIVO","CONTROVERSO","EQUILIBRADO"];
  const clamp=(value,min=0,max=100)=>Math.max(min,Math.min(max,Number(value)||0));
  const blank=(keys,value=50)=>Object.fromEntries(keys.map(key=>[key,value]));

  function deriveProfile(state,media={}){
    const t=state?.traits||blank(traitKeys),r=state?.reputation||blank(reputationKeys),controversies=Number(media.controversies||0);
    if((controversies>=3&&t.mediaPresence>=58)||(r.public<=34&&t.mediaPresence>=65)) return "CONTROVERSO";
    if(t.leadership>=68&&t.teamOrientation>=65) return "LÍDER";
    if(t.professionalism>=70&&t.discipline>=65) return "PROFISSIONAL";
    if(t.ambition>=70&&t.humility<=48) return "AMBICIOSO";
    if(t.humility>=72) return "HUMILDE";
    if(t.mediaPresence>=72) return "MIDIÁTICO";
    if(t.loyalty>=72) return "LEAL";
    if(t.discipline>=75) return "DISCIPLINADO";
    if(t.teamOrientation>=72) return "COLETIVO";
    if(t.ambition>=65&&t.discipline>=60) return "COMPETITIVO";
    return "EQUILIBRADO";
  }

  function init(s){
    if(s?.mode!=="player") return null;
    const pc=s.extras?.playerCareer;
    if(!pc) return null;
    if(!pc.personality||typeof pc.personality!=="object") pc.personality={version:VERSION,traits:blank(traitKeys),reputation:blank(reputationKeys),history:[],lastUpdatedDay:null,dominantProfile:"EQUILIBRADO",processed:{}};
    const state=pc.personality;
    if(!state.traits||typeof state.traits!=="object") state.traits=blank(traitKeys);
    if(!state.reputation||typeof state.reputation!=="object") state.reputation=blank(reputationKeys);
    for(const key of traitKeys) state.traits[key]=clamp(Number.isFinite(Number(state.traits[key]))?Number(state.traits[key]):50);
    for(const key of reputationKeys) state.reputation[key]=clamp(Number.isFinite(Number(state.reputation[key]))?Number(state.reputation[key]):50);
    if(!Array.isArray(state.history)) state.history=[];
    state.history=state.history.filter(row=>row&&typeof row==="object").slice(0,HISTORY_LIMIT);
    if(!state.processed||typeof state.processed!=="object"||Array.isArray(state.processed)) state.processed={};
    if(state.lastUpdatedDay!==null&&!Number.isFinite(Number(state.lastUpdatedDay))) state.lastUpdatedDay=null;
    state.version=VERSION;
    state.dominantProfile=deriveProfile(state,pc.mediaProfile);
    return state;
  }

  const choiceEffects={
    team:{traits:{teamOrientation:3,humility:2,leadership:1},reputation:{public:2,dressingRoom:2,commercial:1}},
    moment:{traits:{ambition:3,mediaPresence:2,humility:-1},reputation:{public:1,commercial:1}},
    work:{traits:{professionalism:3,discipline:2,humility:1},reputation:{coach:2,commercial:2}},
    humble:{traits:{humility:3,professionalism:2,teamOrientation:2},reputation:{public:2,commercial:2}},
    bold:{traits:{ambition:3,mediaPresence:3,humility:-2},reputation:{public:-1,commercial:-1}},
    patience:{traits:{professionalism:2,loyalty:2,teamOrientation:1},reputation:{coach:2,dressingRoom:1}},
    demand:{traits:{ambition:3,humility:-2},reputation:{coach:-2}},
    focus:{traits:{discipline:2,professionalism:2},reputation:{coach:1}},
    ambition:{traits:{ambition:3,leadership:1},reputation:{coach:1}},
    minutes:{traits:{ambition:2,professionalism:1},reputation:{coach:-1}},
    attend:{traits:{loyalty:3,humility:2,teamOrientation:1},reputation:{public:1}},
    balance:{traits:{loyalty:2,professionalism:1},reputation:{public:1}},
    career:{traits:{professionalism:2,ambition:2,loyalty:-2},reputation:{coach:1}},
    visit_family:{traits:{loyalty:3,humility:1},reputation:{}},
    call:{traits:{loyalty:2},reputation:{}},
    postpone:{traits:{ambition:1,loyalty:-2},reputation:{}},
    private_talk:{traits:{leadership:2,professionalism:2,teamOrientation:1},reputation:{dressingRoom:2}},
    firm_reply:{traits:{ambition:2,discipline:1,humility:-1},reputation:{dressingRoom:-2}},
    staff_help:{traits:{professionalism:2,leadership:-1},reputation:{coach:1}},
    accept_support:{traits:{teamOrientation:2,humility:2},reputation:{dressingRoom:2}},
    solo_focus:{traits:{ambition:1,teamOrientation:-2},reputation:{dressingRoom:-1}},
    team_motivation:{traits:{leadership:3,teamOrientation:3},reputation:{dressingRoom:3}},
    clarify:{traits:{professionalism:2,humility:1},reputation:{public:2,commercial:1}},
    ignore_press:{traits:{discipline:1,professionalism:1},reputation:{public:-1}},
    public_reply:{traits:{mediaPresence:3,ambition:2,humility:-2},reputation:{public:-2,commercial:-2}},
    deny_rumor:{traits:{loyalty:2,professionalism:1},reputation:{coach:1,public:1}},
    open_doors:{traits:{ambition:2,loyalty:-2,mediaPresence:1},reputation:{coach:-1}},
    ask_space:{traits:{ambition:3,humility:-1},reputation:{coach:-2}},
    humble_reply:{traits:{humility:3,teamOrientation:1},reputation:{public:3,commercial:1}},
    stay_silent:{traits:{discipline:1},reputation:{public:-1}},
    confident_reply:{traits:{ambition:3,mediaPresence:2},reputation:{public:1}},
    share_moment:{traits:{mediaPresence:3,ambition:1},reputation:{public:2,commercial:2}},
    thank_team:{traits:{teamOrientation:3,humility:2,leadership:1},reputation:{public:2,dressingRoom:2}},
    keep_focus:{traits:{discipline:2,professionalism:2},reputation:{coach:1}},
    participate:{traits:{professionalism:2,teamOrientation:2},reputation:{public:2,commercial:2}},
    rest_instead:{traits:{professionalism:-1,discipline:-1},reputation:{coach:-1,commercial:-1}},
    partial_presence:{traits:{professionalism:1},reputation:{commercial:1}},
    reorganize:{traits:{professionalism:2,discipline:2},reputation:{coach:1}},
    take_rest:{traits:{discipline:1},reputation:{}},
    normal_routine:{traits:{discipline:2,professionalism:1},reputation:{}},
    join_charity:{traits:{humility:4,teamOrientation:2},reputation:{public:4,commercial:2}},
    remote_support:{traits:{humility:2},reputation:{public:2,commercial:1}},
    decline_charity:{traits:{humility:-1},reputation:{public:-1,commercial:-1}},
    share_recovery:{traits:{mediaPresence:2,humility:1},reputation:{public:1}},
    gradual_return:{traits:{professionalism:2,discipline:2},reputation:{coach:1}},
    extra_work:{traits:{ambition:2,discipline:1},reputation:{coach:1}}
  };

  function effectsFor(source,choice){
    const base=choiceEffects[String(choice||"")];
    if(!base) return {traits:{},reputation:{}};
    return {traits:{...base.traits},reputation:{...base.reputation}};
  }

  function applyChoice(s,source,choice,spec={}){
    const state=init(s);
    if(!state) return null;
    const eventId=spec.eventId?String(spec.eventId):null;
    if(eventId&&state.processed[eventId]) return state.history.find(row=>row.eventId===eventId)||null;
    const effects=spec.effects||effectsFor(source,choice),traitDelta={},reputationDelta={};
    const beforeProfile=state.dominantProfile;
    for(const key of traitKeys){const delta=clamp(Number(effects.traits?.[key]||0),-5,5);if(!delta)continue;const before=state.traits[key],after=clamp(before+delta);if(after!==before){state.traits[key]=after;traitDelta[key]=+(after-before).toFixed(2);}}
    for(const key of reputationKeys){const delta=clamp(Number(effects.reputation?.[key]||0),-5,5);if(!delta)continue;const before=state.reputation[key],after=clamp(before+delta);if(after!==before){state.reputation[key]=after;reputationDelta[key]=+(after-before).toFixed(2);}}
    if(!Object.keys(traitDelta).length&&!Object.keys(reputationDelta).length) return null;
    state.dominantProfile=deriveProfile(state,s.extras?.playerCareer?.mediaProfile);
    const row={day:Number(s.day||0),season:Number(s.season||0),source:String(source||"choice"),choice:String(choice||"choice"),label:String(spec.label||choice||"Escolha"),eventId,deltas:{traits:traitDelta,reputation:reputationDelta},profileBefore:beforeProfile,profileAfter:state.dominantProfile};
    state.history.unshift(row);state.history=state.history.slice(0,HISTORY_LIMIT);state.lastUpdatedDay=Number(s.day||0);if(eventId)state.processed[eventId]=true;
    return row;
  }

  function commercialModifier(s){const p=init(s);if(!p)return 0;const media=s.extras?.playerCareer?.mediaProfile||{};return +clamp((p.reputation.commercial-50)*.06+(p.reputation.public-50)*.025+(p.traits.professionalism-50)*.02+(p.traits.mediaPresence-50)*.015-Number(media.controversies||0)*.35,-5,5).toFixed(2);}
  function marketModifier(s){const p=init(s);if(!p)return 0;return +clamp((p.traits.professionalism-50)*.035+(p.traits.ambition-50)*.025+(p.reputation.public-50)*.018,-4,4).toFixed(2);}
  function coachModifier(s){const p=init(s);return p?Math.round(clamp((p.reputation.coach-50)/25,-2,2)):0;}
  function unexpectedEventWeight(s,eventType){const p=init(s);if(!p)return 1;const room=p.reputation.dressingRoom;if(eventType==="training_conflict")return +clamp(1+(50-room)/500,.9,1.1).toFixed(3);if(eventType==="teammate_support")return +clamp(1+(room-50)/500,.9,1.1).toFixed(3);return 1;}
  function topTraits(s,limit=6){const p=init(s);if(!p)return[];const labels={professionalism:"Profissionalismo",ambition:"Ambição",loyalty:"Lealdade",humility:"Humildade",leadership:"Liderança",discipline:"Disciplina",mediaPresence:"Presença na mídia",teamOrientation:"Espírito de equipe"};return Object.entries(p.traits).sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([id,value])=>({id,label:labels[id],value}));}
  function valueLabel(value){return Number(value)>=67?"Alto":Number(value)<=33?"Baixo":"Médio";}

  const api={VERSION,HISTORY_LIMIT,traitKeys,reputationKeys,profiles,init,deriveProfile,effectsFor,applyChoice,commercialModifier,marketModifier,coachModifier,unexpectedEventWeight,topTraits,valueLabel};
  root.ProLifePlayerPersonality=api;
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
