(function(root){
  "use strict";

  function normalizeTeam(team){
    if(
      !team ||
      !team.id ||
      !team.name
    )
      throw new Error(
        "Selecao invalida para a Finalissima."
      );

    return {
      id:String(team.id),
      name:String(team.name),
      reputation:Number(
        team.reputation||75
      ),
      source:
        team.source||
        null
    };
  }

  function createTournament(
    year,
    copaAmericaChampion,
    euroChampion
  ){
    const southAmerica=
      normalizeTeam(
        copaAmericaChampion
      );

    const europe=
      normalizeTeam(
        euroChampion
      );

    if(
      southAmerica.id===
      europe.id
    )
      throw new Error(
        "Finalissima requires two different teams."
      );

    return {
      version:1,
      type:"FINALISSIMA",
      name:"Finalissima CONMEBOL-UEFA",
      year:Number(year),

      status:"SCHEDULED",

      participants:[
        {
          ...southAmerica,
          source:
            "COPA_AMERICA"
        },
        {
          ...europe,
          source:
            "EURO"
        }
      ],

      match:{
        id:
          "FINALISSIMA:"+
          Number(year),

        phase:"FINAL",

        homeId:
          southAmerica.id,

        awayId:
          europe.id,

        home:
          southAmerica.name,

        away:
          europe.name,

        played:false,

        hg:null,
        ag:null,

        hp:null,
        ap:null,

        winnerId:null
      },

      champion:null,
      runnerUp:null
    };
  }

  function participant(
    tournament,
    id
  ){
    return (
      tournament.participants.find(
        team=>team.id===id
      )||
      null
    );
  }

  function recordResult(
    tournament,
    hg,
    ag,
    hp=null,
    ap=null
  ){
    if(
      !tournament ||
      tournament.type!=="FINALISSIMA"
    )
      throw new Error(
        "Finalissima invalida."
      );

    const match=
      tournament.match;

    if(match.played)
      throw new Error(
        "Finalissima ja disputada."
      );

    hg=Math.max(
      0,
      Math.floor(
        Number(hg)||0
      )
    );

    ag=Math.max(
      0,
      Math.floor(
        Number(ag)||0
      )
    );

    if(hg===ag){
      hp=Math.max(
        0,
        Math.floor(
          Number(hp)||0
        )
      );

      ap=Math.max(
        0,
        Math.floor(
          Number(ap)||0
        )
      );

      if(hp===ap)
        throw new Error(
          "Empate exige vencedor nos penaltis."
        );
    }
    else{
      hp=null;
      ap=null;
    }

    let winnerId=null;

    if(hg>ag)
      winnerId=match.homeId;
    else if(ag>hg)
      winnerId=match.awayId;
    else if(hp>ap)
      winnerId=match.homeId;
    else
      winnerId=match.awayId;

    const loserId=
      winnerId===match.homeId
        ? match.awayId
        : match.homeId;

    match.played=true;
    match.hg=hg;
    match.ag=ag;
    match.hp=hp;
    match.ap=ap;
    match.winnerId=winnerId;

    tournament.champion=
      participant(
        tournament,
        winnerId
      );

    tournament.runnerUp=
      participant(
        tournament,
        loserId
      );

    tournament.status=
      "COMPLETED";

    return match;
  }

  function simulate(
    tournament,
    rng
  ){
    if(
      !rng ||
      typeof rng.next!=="function"
    )
      throw new Error(
        "RNG invalido."
      );

    const home=
      tournament.participants[0];

    const away=
      tournament.participants[1];

    const hg=Math.max(
      0,
      Math.round(
        1.25+
        (home.reputation-away.reputation)/24+
        (rng.next()-.5)*2
      )
    );

    const ag=Math.max(
      0,
      Math.round(
        1.15+
        (away.reputation-home.reputation)/24+
        (rng.next()-.5)*2
      )
    );

    if(hg!==ag)
      return recordResult(
        tournament,
        hg,
        ag
      );

    const homeWins=
      (
        home.reputation-
        away.reputation
      )/100+
      rng.next()>
      .48;

    return recordResult(
      tournament,
      hg,
      ag,
      homeWins?5:4,
      homeWins?4:5
    );
  }

  function summary(
    tournament
  ){
    if(!tournament)
      return null;

    return {
      year:
        tournament.year,

      name:
        tournament.name,

      status:
        tournament.status,

      participants:
        tournament.participants
          .map(
            team=>({...team})
          ),

      match:{
        ...tournament.match
      },

      champion:
        tournament.champion
          ? {
              ...tournament.champion
            }
          : null,

      runnerUp:
        tournament.runnerUp
          ? {
              ...tournament.runnerUp
            }
          : null
    };
  }

  const api={
    createTournament,
    recordResult,
    simulate,
    summary
  };

  root.ProLifeFinalissima=
    api;

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
