(function(root){
  "use strict";

  const worldCupBaseline={
    BRA:5,
    GER:4,
    ITA:4,
    ARG:3,
    FRA:2,
    URU:2,
    ENG:1,
    ESP:1
  };

  function nameOf(value){
    if(!value)
      return null;

    if(typeof value==="string")
      return value;

    return (
      value.name||
      value.teamName||
      value.id||
      null
    );
  }

  function idOf(value){
    if(!value)
      return null;

    if(typeof value==="string")
      return value;

    return (
      value.id||
      value.teamId||
      null
    );
  }

  function recordKey(record){
    return [
      record.type,
      record.year
    ].join(":");
  }

  function compactTournament(tournament){
    if(
      !tournament ||
      tournament.status!=="COMPLETED" ||
      !tournament.type
    )
      return null;

    const record={
      key:
        [
          tournament.type,
          Number(tournament.year)
        ].join(":"),

      type:
        tournament.type,

      name:
        tournament.name||
        tournament.type,

      year:
        Number(tournament.year),

      championId:
        idOf(
          tournament.champion||
          tournament.winner
        ),

      champion:
        nameOf(
          tournament.champion||
          tournament.winner
        ),

      runnerUpId:
        idOf(
          tournament.runnerUp
        ),

      runnerUp:
        nameOf(
          tournament.runnerUp
        ),

      thirdPlaceId:
        idOf(
          tournament.thirdPlace
        ),

      thirdPlace:
        nameOf(
          tournament.thirdPlace
        )
    };

    if(
      tournament.type==="FIFA_SERIES"
    ){
      record.series=
        (tournament.series||[])
          .filter(
            item=>
              item?.status==="COMPLETED"
          )
          .map(
            item=>({
              id:item.id,
              host:item.host,
              victorId:
                idOf(item.victor),
              victor:
                nameOf(item.victor),
              runnerUpId:
                idOf(item.runnerUp),
              runnerUp:
                nameOf(item.runnerUp)
            })
          );
    }

    return record;
  }

  function ensureArchive(n){
    if(!n || typeof n!=="object")
      return [];

    if(
      !Array.isArray(
        n.internationalArchive
      )
    ){
      n.internationalArchive=[];
    }

    return n.internationalArchive;
  }

  function archiveFromNationalState(n){
    const archive=
      ensureArchive(n);

    const known=
      new Set(
        archive.map(
          item=>
            item.key||
            recordKey(item)
        )
      );

    for(
      const tournament of
      n?.tournaments||[]
    ){
      const record=
        compactTournament(
          tournament
        );

      if(!record)
        continue;

      if(
        known.has(
          record.key
        )
      )
        continue;

      archive.push(record);
      known.add(record.key);
    }

    archive.sort(
      (a,b)=>
        Number(a.year)-
        Number(b.year) ||
        String(a.type)
          .localeCompare(
            String(b.type)
          )
    );

    return archive;
  }

  function timeline(n){
    archiveFromNationalState(n);

    return (
      n.internationalArchive||
      []
    )
      .slice()
      .sort(
        (a,b)=>
          Number(b.year)-
          Number(a.year) ||
          String(a.type)
            .localeCompare(
              String(b.type)
            )
      );
  }

  function competitionHistory(
    n,
    type
  ){
    return timeline(n)
      .filter(
        item=>
          item.type===type
      );
  }

  function worldCupTitleTable(n){
    const titles={
      ...worldCupBaseline
    };

    for(
      const edition of
      competitionHistory(
        n,
        "WORLD_CUP"
      )
    ){
      if(!edition.championId)
        continue;

      titles[
        edition.championId
      ]=
        (
          titles[
            edition.championId
          ]||
          0
        )+
        1;
    }

    return Object.entries(titles)
      .map(
        ([id,total])=>({
          id,
          titles:total
        })
      )
      .sort(
        (a,b)=>
          b.titles-a.titles ||
          a.id.localeCompare(b.id)
      );
  }

  function titleTable(n,type){
    if(type==="WORLD_CUP")
      return worldCupTitleTable(n);

    const map=
      new Map();

    for(
      const edition of
      competitionHistory(
        n,
        type
      )
    ){
      if(!edition.champion)
        continue;

      const key=
        edition.championId||
        edition.champion;

      const current=
        map.get(key)||
        {
          id:
            edition.championId||
            null,
          name:
            edition.champion,
          titles:0
        };

      current.titles++;

      map.set(
        key,
        current
      );
    }

    return [
      ...map.values()
    ].sort(
      (a,b)=>
        b.titles-a.titles ||
        String(a.name)
          .localeCompare(
            String(b.name)
          )
    );
  }

  function fifaSeriesVictors(n){
    return competitionHistory(
      n,
      "FIFA_SERIES"
    ).flatMap(
      edition=>
        (edition.series||[])
          .map(
            item=>({
              year:edition.year,
              seriesId:item.id,
              host:item.host,
              victorId:item.victorId,
              victor:item.victor,
              runnerUpId:item.runnerUpId,
              runnerUp:item.runnerUp
            })
          )
    );
  }

  function summary(n){
    const items=
      timeline(n);

    const byCompetition={};

    for(const item of items){
      if(!byCompetition[item.type])
        byCompetition[item.type]=[];

      byCompetition[item.type]
        .push(item);
    }

    return {
      editions:
        items.length,

      timeline:
        items,

      byCompetition,

      worldCupTitles:
        worldCupTitleTable(n),

      fifaSeriesVictors:
        fifaSeriesVictors(n)
    };
  }

  const api={
    worldCupBaseline,
    compactTournament,
    ensureArchive,
    archiveFromNationalState,
    timeline,
    competitionHistory,
    titleTable,
    worldCupTitleTable,
    fifaSeriesVictors,
    summary
  };

  root.ProLifeInternationalHistory=
    api;

  if(
    typeof module!=="undefined" &&
    module.exports
  ){
    module.exports=api;
  }

})(
  typeof globalThis!=="undefined"
    ? globalThis
    : this
);
