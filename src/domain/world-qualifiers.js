/* PRO LIFE - World Cup qualification system. */
(function(root){
  "use strict";

  const teams=[
    // CONMEBOL
    {id:"BRA",name:"Brasil",confed:"CONMEBOL",reputation:92},
    {id:"ARG",name:"Argentina",confed:"CONMEBOL",reputation:93},
    {id:"URU",name:"Uruguai",confed:"CONMEBOL",reputation:86},
    {id:"COL",name:"Colombia",confed:"CONMEBOL",reputation:84},
    {id:"ECU",name:"Equador",confed:"CONMEBOL",reputation:80},
    {id:"PAR",name:"Paraguai",confed:"CONMEBOL",reputation:76},
    {id:"CHI",name:"Chile",confed:"CONMEBOL",reputation:78},
    {id:"PER",name:"Peru",confed:"CONMEBOL",reputation:74},
    {id:"BOL",name:"Bolivia",confed:"CONMEBOL",reputation:70},
    {id:"VEN",name:"Venezuela",confed:"CONMEBOL",reputation:77},

    // UEFA
    {id:"FRA",name:"Franca",confed:"UEFA",reputation:94},
    {id:"ESP",name:"Espanha",confed:"UEFA",reputation:94},
    {id:"ENG",name:"Inglaterra",confed:"UEFA",reputation:91},
    {id:"POR",name:"Portugal",confed:"UEFA",reputation:90},
    {id:"GER",name:"Alemanha",confed:"UEFA",reputation:90},
    {id:"NED",name:"Holanda",confed:"UEFA",reputation:89},
    {id:"ITA",name:"Italia",confed:"UEFA",reputation:88},
    {id:"BEL",name:"Belgica",confed:"UEFA",reputation:87},
    {id:"CRO",name:"Croacia",confed:"UEFA",reputation:85},
    {id:"SUI",name:"Suica",confed:"UEFA",reputation:83},
    {id:"DEN",name:"Dinamarca",confed:"UEFA",reputation:82},
    {id:"AUT",name:"Austria",confed:"UEFA",reputation:81},
    {id:"NOR",name:"Noruega",confed:"UEFA",reputation:82},
    {id:"SWE",name:"Suecia",confed:"UEFA",reputation:79},
    {id:"POL",name:"Polonia",confed:"UEFA",reputation:79},
    {id:"TUR",name:"Turquia",confed:"UEFA",reputation:80},
    {id:"UKR",name:"Ucrania",confed:"UEFA",reputation:79},
    {id:"SCO",name:"Escocia",confed:"UEFA",reputation:77},
    {id:"WAL",name:"Pais de Gales",confed:"UEFA",reputation:76},
    {id:"SRB",name:"Servia",confed:"UEFA",reputation:79},
    {id:"CZE",name:"Tchequia",confed:"UEFA",reputation:77},
    {id:"ROU",name:"Romenia",confed:"UEFA",reputation:75},
    {id:"GRE",name:"Grecia",confed:"UEFA",reputation:75},
    {id:"HUN",name:"Hungria",confed:"UEFA",reputation:76},
    {id:"IRL",name:"Irlanda",confed:"UEFA",reputation:73},
    {id:"SVN",name:"Eslovenia",confed:"UEFA",reputation:75},
    {id:"SVK",name:"Eslovaquia",confed:"UEFA",reputation:74},
    {id:"GEO",name:"Georgia",confed:"UEFA",reputation:74},

    // CAF
    {id:"MAR",name:"Marrocos",confed:"CAF",reputation:84},
    {id:"SEN",name:"Senegal",confed:"CAF",reputation:82},
    {id:"CIV",name:"Costa do Marfim",confed:"CAF",reputation:80},
    {id:"NGA",name:"Nigeria",confed:"CAF",reputation:79},
    {id:"ALG",name:"Argelia",confed:"CAF",reputation:77},
    {id:"EGY",name:"Egito",confed:"CAF",reputation:78},
    {id:"CMR",name:"Camaroes",confed:"CAF",reputation:78},
    {id:"GHA",name:"Gana",confed:"CAF",reputation:76},
    {id:"TUN",name:"Tunisia",confed:"CAF",reputation:76},
    {id:"MLI",name:"Mali",confed:"CAF",reputation:75},
    {id:"COD",name:"RD Congo",confed:"CAF",reputation:75},
    {id:"RSA",name:"Africa do Sul",confed:"CAF",reputation:73},
    {id:"BFA",name:"Burkina Faso",confed:"CAF",reputation:74},
    {id:"CPV",name:"Cabo Verde",confed:"CAF",reputation:73},
    {id:"GUI",name:"Guine",confed:"CAF",reputation:72},
    {id:"GAB",name:"Gabao",confed:"CAF",reputation:71},
    {id:"ANG",name:"Angola",confed:"CAF",reputation:70},
    {id:"UGA",name:"Uganda",confed:"CAF",reputation:69},

    // AFC
    {id:"JPN",name:"Japao",confed:"AFC",reputation:82},
    {id:"KOR",name:"Coreia do Sul",confed:"AFC",reputation:80},
    {id:"IRN",name:"Ira",confed:"AFC",reputation:78},
    {id:"AUS",name:"Australia",confed:"AFC",reputation:76},
    {id:"KSA",name:"Arabia Saudita",confed:"AFC",reputation:74},
    {id:"QAT",name:"Catar",confed:"AFC",reputation:72},
    {id:"IRQ",name:"Iraque",confed:"AFC",reputation:72},
    {id:"UZB",name:"Uzbequistao",confed:"AFC",reputation:73},
    {id:"UAE",name:"Emirados Arabes",confed:"AFC",reputation:71},
    {id:"JOR",name:"Jordania",confed:"AFC",reputation:70},
    {id:"CHN",name:"China",confed:"AFC",reputation:69},
    {id:"OMA",name:"Oma",confed:"AFC",reputation:69},
    {id:"BHR",name:"Bahrein",confed:"AFC",reputation:68},
    {id:"SYR",name:"Siria",confed:"AFC",reputation:67},
    {id:"IDN",name:"Indonesia",confed:"AFC",reputation:65},
    {id:"THA",name:"Tailandia",confed:"AFC",reputation:65},

    // CONCACAF
    {id:"USA",name:"Estados Unidos",confed:"CONCACAF",reputation:81},
    {id:"MEX",name:"Mexico",confed:"CONCACAF",reputation:81},
    {id:"CAN",name:"Canada",confed:"CONCACAF",reputation:78},
    {id:"CRC",name:"Costa Rica",confed:"CONCACAF",reputation:73},
    {id:"PAN",name:"Panama",confed:"CONCACAF",reputation:73},
    {id:"JAM",name:"Jamaica",confed:"CONCACAF",reputation:72},
    {id:"HON",name:"Honduras",confed:"CONCACAF",reputation:69},
    {id:"SLV",name:"El Salvador",confed:"CONCACAF",reputation:66},
    {id:"GUA",name:"Guatemala",confed:"CONCACAF",reputation:68},
    {id:"HAI",name:"Haiti",confed:"CONCACAF",reputation:67},
    {id:"TRI",name:"Trinidad e Tobago",confed:"CONCACAF",reputation:67},
    {id:"CUR",name:"Curacao",confed:"CONCACAF",reputation:68},

    // OFC
    {id:"NZL",name:"Nova Zelandia",confed:"OFC",reputation:70},
    {id:"NCL",name:"Nova Caledonia",confed:"OFC",reputation:60},
    {id:"SOL",name:"Ilhas Salomao",confed:"OFC",reputation:59},
    {id:"FIJ",name:"Fiji",confed:"OFC",reputation:58},
    {id:"TAH",name:"Taiti",confed:"OFC",reputation:58},
    {id:"VAN",name:"Vanuatu",confed:"OFC",reputation:56}
  ];

  const allocation={
    UEFA:{direct:16,playoff:0},
    CAF:{direct:9,playoff:1},
    AFC:{direct:8,playoff:1},
    CONCACAF:{direct:6,playoff:2},
    CONMEBOL:{direct:6,playoff:1},
    OFC:{direct:1,playoff:1}
  };

  function clone(team){
    return {
      id:team.id,
      name:team.name,
      confed:team.confed,
      reputation:Number(team.reputation||70)
    };
  }

  function find(id){
    return teams.find(
      team=>team.id===id
    )||null;
  }

  function randomValue(rng){
    return (
      rng &&
      typeof rng.next==="function"
    )
      ? rng.next()
      : Math.random();
  }

  function ranked(confed,rng){
    return teams
      .filter(team=>team.confed===confed)
      .map(team=>({
        team,
        score:
          Number(team.reputation||70)+
          (randomValue(rng)-0.5)*10
      }))
      .sort(
        (a,b)=>
          b.score-a.score ||
          b.team.reputation-a.team.reputation ||
          a.team.id.localeCompare(b.team.id)
      )
      .map(entry=>entry.team);
  }

  function qualify(
    year,
    conmebolQualifiers,
    rng
  ){
    if(
      !conmebolQualifiers ||
      conmebolQualifiers.complete!==true ||
      !Array.isArray(
        conmebolQualifiers.qualified
      ) ||
      conmebolQualifiers.qualified.length!==6 ||
      !conmebolQualifiers.playoff
    )
      throw new Error(
        "Completed CONMEBOL qualifiers are required."
      );

    const direct=[];
    const playoffCandidates=[];

    function addDirect(team,source){
      if(!team)
        throw new Error(
          "Invalid direct qualifier."
        );

      direct.push({
        ...clone(team),
        qualificationSource:source
      });
    }

    function addPlayoff(team,source){
      if(!team)
        throw new Error(
          "Invalid playoff qualifier."
        );

      playoffCandidates.push({
        ...clone(team),
        qualificationSource:source
      });
    }

    // CONMEBOL comes from the career's real
    // progressive qualification table.
    for(
      const id of
      conmebolQualifiers.qualified
    ){
      const team=find(id);

      if(!team || team.confed!=="CONMEBOL")
        throw new Error(
          "Invalid CONMEBOL direct qualifier: "+id
        );

      addDirect(
        team,
        "CONMEBOL_DIRECT"
      );
    }

    const conmebolPlayoff=
      find(conmebolQualifiers.playoff);

    if(
      !conmebolPlayoff ||
      conmebolPlayoff.confed!=="CONMEBOL"
    )
      throw new Error(
        "Invalid CONMEBOL playoff team."
      );

    addPlayoff(
      conmebolPlayoff,
      "CONMEBOL_PLAYOFF"
    );

    // Other confederations are simulated from
    // their candidate pools and project strength.
    for(const confed of [
      "UEFA",
      "CAF",
      "AFC",
      "CONCACAF",
      "OFC"
    ]){
      const list=
        ranked(confed,rng);

      const rule=
        allocation[confed];

      if(
        list.length<
        rule.direct+rule.playoff
      )
        throw new Error(
          "Not enough candidates for "+confed
        );

      for(
        const team of
        list.slice(0,rule.direct)
      )
        addDirect(
          team,
          confed+"_DIRECT"
        );

      for(
        const team of
        list.slice(
          rule.direct,
          rule.direct+rule.playoff
        )
      )
        addPlayoff(
          team,
          confed+"_PLAYOFF"
        );
    }

    if(direct.length!==46)
      throw new Error(
        "Expected 46 direct qualifiers."
      );

    if(playoffCandidates.length!==6)
      throw new Error(
        "Expected 6 interconfederation playoff teams."
      );

    const playoffRanked=
      playoffCandidates
        .map(team=>({
          team,
          score:
            team.reputation+
            (randomValue(rng)-0.5)*14
        }))
        .sort(
          (a,b)=>
            b.score-a.score ||
            b.team.reputation-a.team.reputation ||
            a.team.id.localeCompare(b.team.id)
        );

    const playoffWinners=
      playoffRanked
        .slice(0,2)
        .map(entry=>({
          ...entry.team,
          qualificationSource:
            "INTERCONFED_PLAYOFF"
        }));

    const participants=[
      ...direct,
      ...playoffWinners
    ];

    const ids=
      new Set(
        participants.map(
          team=>team.id
        )
      );

    if(
      participants.length!==48 ||
      ids.size!==48
    )
      throw new Error(
        "World Cup qualification must produce 48 unique teams."
      );

    return {
      version:1,
      year:Number(year),
      allocation:{
        UEFA:{...allocation.UEFA},
        CAF:{...allocation.CAF},
        AFC:{...allocation.AFC},
        CONCACAF:{...allocation.CONCACAF},
        CONMEBOL:{...allocation.CONMEBOL},
        OFC:{...allocation.OFC}
      },
      direct,
      playoffCandidates,
      playoffWinners,
      participants
    };
  }

  const api={
    teams,
    allocation,
    find,
    ranked,
    qualify
  };

  root.ProLifeWorldQualifiers=api;

  if(
    typeof module!=="undefined" &&
    module.exports
  )
    module.exports=api;

})(
  typeof globalThis!=="undefined"
    ? globalThis
    : this
);
