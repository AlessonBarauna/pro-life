(function(root){
  "use strict";

  const competitions=[
    {
      id:"WORLD_CUP",
      name:"Copa Mundial",
      shortName:"Mundial",
      organizer:"FIFA",
      confederation:"GLOBAL",
      scope:"Mundial",
      type:"championship",
      active:true,
      participants:48,
      format:"12 grupos de 4, melhores 32 para o mata-mata",
      nextEdition:"2030",
      eligibility:"Classificacao pelas seis confederacoes",
      brazil:"eligible",
      priority:100
    },
    {
      id:"WORLD_CUP_QUALIFIERS",
      name:"Eliminatorias da Copa Mundial",
      shortName:"Eliminatorias",
      organizer:"FIFA + Confederacoes",
      confederation:"GLOBAL",
      scope:"Mundial",
      type:"qualifiers",
      active:true,
      participants:null,
      format:"Formato definido por cada confederacao",
      nextEdition:"Ciclo 2030",
      eligibility:"Selecoes filiadas a FIFA",
      brazil:"eligible",
      priority:95
    },
    {
      id:"COPA_AMERICA",
      name:"CONMEBOL Copa America",
      shortName:"Copa America",
      organizer:"CONMEBOL",
      confederation:"CONMEBOL",
      scope:"America do Sul",
      type:"championship",
      active:true,
      participants:null,
      format:"Fase de grupos e mata-mata",
      nextEdition:"2028",
      eligibility:"Selecoes CONMEBOL e eventuais convidadas",
      brazil:"eligible",
      priority:90
    },
    {
      id:"EURO",
      name:"UEFA EURO",
      shortName:"EURO",
      organizer:"UEFA",
      confederation:"UEFA",
      scope:"Europa",
      type:"championship",
      active:true,
      participants:24,
      format:"6 grupos de 4; 1o, 2o e quatro melhores terceiros avancam",
      nextEdition:"2028",
      eligibility:"Selecoes UEFA",
      brazil:"not-eligible",
      priority:88
    },
    {
      id:"UEFA_NATIONS_LEAGUE",
      name:"UEFA Nations League",
      shortName:"Nations League",
      organizer:"UEFA",
      confederation:"UEFA",
      scope:"Europa",
      type:"league",
      active:true,
      participants:null,
      format:"Ligas, grupos, promocao, rebaixamento e fase final",
      nextEdition:"2026/27",
      eligibility:"Selecoes UEFA",
      brazil:"not-eligible",
      priority:82
    },
    {
      id:"GOLD_CUP",
      name:"Concacaf Gold Cup",
      shortName:"Gold Cup",
      organizer:"Concacaf",
      confederation:"CONCACAF",
      scope:"America do Norte, Central e Caribe",
      type:"championship",
      active:true,
      participants:16,
      format:"Fase de grupos seguida de mata-mata",
      nextEdition:"2027",
      eligibility:"Selecoes classificadas pela Concacaf",
      brazil:"not-eligible",
      priority:80
    },
    {
      id:"CONCACAF_NATIONS_LEAGUE",
      name:"Concacaf Nations League",
      shortName:"Concacaf Nations",
      organizer:"Concacaf",
      confederation:"CONCACAF",
      scope:"America do Norte, Central e Caribe",
      type:"league",
      active:true,
      participants:41,
      format:"Ligas A, B e C com grupos, promocao e fase final",
      nextEdition:"2026/27",
      eligibility:"41 associacoes da Concacaf",
      brazil:"not-eligible",
      priority:78
    },
    {
      id:"AFCON",
      name:"CAF Africa Cup of Nations",
      shortName:"Copa Africana",
      organizer:"CAF",
      confederation:"CAF",
      scope:"Africa",
      type:"championship",
      active:true,
      participants:24,
      format:"Fase de grupos seguida de mata-mata",
      nextEdition:"2027",
      eligibility:"Selecoes CAF",
      brazil:"not-eligible",
      priority:86
    },
    {
      id:"ASIAN_CUP",
      name:"AFC Asian Cup",
      shortName:"Copa da Asia",
      organizer:"AFC",
      confederation:"AFC",
      scope:"Asia",
      type:"championship",
      active:true,
      participants:24,
      format:"6 grupos de 4 seguidos de mata-mata",
      nextEdition:"2027",
      eligibility:"Selecoes AFC",
      brazil:"not-eligible",
      priority:84
    },
    {
      id:"OFC_NATIONS_CUP",
      name:"OFC Men's Nations Cup",
      shortName:"OFC Nations Cup",
      organizer:"OFC",
      confederation:"OFC",
      scope:"Oceania",
      type:"championship",
      active:true,
      participants:null,
      format:"Fase de grupos seguida de mata-mata",
      nextEdition:"A definir",
      eligibility:"Selecoes OFC",
      brazil:"not-eligible",
      priority:70
    },
    {
      id:"FINALISSIMA",
      name:"Finalissima CONMEBOL-UEFA",
      shortName:"Finalissima",
      organizer:"CONMEBOL + UEFA",
      confederation:"INTERCONFED",
      scope:"Europa x America do Sul",
      type:"supercup",
      active:true,
      participants:2,
      format:"Final unica entre campeoes da EURO e Copa America",
      nextEdition:"Conforme campeoes continentais",
      eligibility:"Campeao da EURO x campeao da Copa America",
      brazil:"conditional",
      priority:76
    },
    {
      id:"FIFA_ARAB_CUP",
      name:"FIFA Arab Cup",
      shortName:"Copa Arabe",
      organizer:"FIFA",
      confederation:"ARAB",
      scope:"Selecoes arabes",
      type:"championship",
      active:true,
      participants:16,
      format:"4 grupos de 4 seguidos de mata-mata",
      nextEdition:"2029",
      eligibility:"Selecoes arabes convidadas/classificadas",
      brazil:"not-eligible",
      priority:68
    },
    {
      id:"FIFA_SERIES",
      name:"FIFA Series",
      shortName:"FIFA Series",
      organizer:"FIFA",
      confederation:"GLOBAL",
      scope:"Intercontinental",
      type:"series",
      active:true,
      participants:null,
      format:"Grupos internacionais sediados por associacoes membro",
      nextEdition:"Eventos FIFA",
      eligibility:"Participacao por convite/designacao FIFA",
      brazil:"conditional",
      priority:62
    },
    {
      id:"CONFEDERATIONS_CUP",
      name:"FIFA Confederations Cup",
      shortName:"Copa das Confederacoes",
      organizer:"FIFA",
      confederation:"GLOBAL",
      scope:"Historica",
      type:"historical",
      active:false,
      participants:8,
      format:"Competicao historica entre campeoes continentais",
      nextEdition:"Encerrada",
      eligibility:"Nao integra mais o calendario ativo",
      brazil:"historical",
      priority:20
    }
  ];

  function all(){
    return competitions.map(x=>({...x}));
  }

  function get(id){
    const x=competitions.find(c=>c.id===id);
    return x ? {...x} : null;
  }

  root.ProLifeInternationalCompetitions={
    version:1,
    competitions,
    all,
    get
  };

  if(typeof module!=="undefined" && module.exports)
    module.exports=root.ProLifeInternationalCompetitions;

})(typeof globalThis!=="undefined" ? globalThis : this);
