(function(root){
  "use strict";
  // Datas de inicio/fim por liga. Datas confirmadas para 2026/27 quando
  // explicitadas; valores restantes sao JANELAS de planejamento, nao tabelas oficiais.
  const EPOCH=Date.UTC(2026,0,1),DAY=86400000;
  const dateDay=iso=>Math.round((Date.parse(iso+"T00:00:00Z")-EPOCH)/DAY);
  const toDate=day=>new Date(EPOCH+Number(day)*DAY).toISOString().slice(0,10);
  const SEASON_POLICIES={
    ENG:{type:"cross_year",start:"08-21",end:"05-30",verified2026:true},
    ESP:{type:"cross_year",start:"08-14",end:"05-31"},
    ITA:{type:"cross_year",start:"08-22",end:"05-30"},
    GER:{type:"cross_year",start:"08-28",end:"05-22"},
    FRA:{type:"cross_year",start:"08-21",end:"05-29"},
    POR:{type:"cross_year",start:"08-01",end:"05-31"},
    NED:{type:"cross_year",start:"08-01",end:"05-31"},
    BEL:{type:"cross_year",start:"07-15",end:"05-31"},
    AUT:{type:"cross_year",start:"07-15",end:"05-31"},
    SUI:{type:"cross_year",start:"07-15",end:"05-31"},
    SCO:{type:"cross_year",start:"08-01",end:"05-31"},
    DEN:{type:"cross_year",start:"07-01",end:"05-31"},
    POL:{type:"cross_year",start:"07-01",end:"05-31"},
    ROU:{type:"cross_year",start:"07-01",end:"05-31"},
    GER3:{type:"cross_year",start:"08-01",end:"05-31"},
    SWE:{type:"calendar_year",start:"04-04",end:"11-29",verified2026:true},
    NOR:{type:"calendar_year",start:"03-15",end:"12-06",verified2026:true},
    IRL:{type:"calendar_year",start:"02-06",end:"10-30",verified2026:true}
  };
  // Confirmadas: apenas ligas, datas e temporadas indicadas.
  const CONFIRMED_2026={
    ENG:["2026-08-21","2027-05-30"],
    ESP:["2026-08-14",null],
    ITA:["2026-08-22",null],
    GER:["2026-08-28","2027-05-22"],
    FRA:["2026-08-21","2027-05-29"],
    SWE:["2026-04-04","2026-11-29"],
    NOR:["2026-03-15","2026-12-06"],
    IRL:["2026-02-06","2026-10-30"]
  };
  const UEFA_2026_27={
    ucl:{league:["2026-09-08","2026-10-13","2026-10-20","2026-11-03","2026-11-24","2026-12-08","2027-01-19","2027-01-27"],playoff:["2027-02-16","2027-02-23"],round16:["2027-03-09","2027-03-16"],quarterfinal:["2027-04-06","2027-04-13"],semifinal:["2027-04-27","2027-05-04"],final:"2027-06-05"}
  };
  // Datas-base oficiais UEFA 2026/27. As datas por confronto podem variar
  // dentro da rodada (ter/qua/qui); o jogo usa janela e resolve conflitos.
  UEFA_2026_27.uel={
    league:["2026-09-16","2026-10-15","2026-10-22","2026-11-05","2026-11-26","2026-12-10","2027-01-21","2027-01-28"],
    playoff:["2027-02-18","2027-02-25"],round16:["2027-03-11","2027-03-18"],
    quarterfinal:["2027-04-08","2027-04-15"],semifinal:["2027-04-29","2027-05-06"],final:"2027-05-26"
  };
  UEFA_2026_27.uecl={
    league:["2026-10-15","2026-10-22","2026-11-05","2026-11-26","2026-12-10","2026-12-17"],
    playoff:["2027-02-18","2027-02-25"],round16:["2027-03-11","2027-03-18"],
    quarterfinal:["2027-04-08","2027-04-15"],semifinal:["2027-04-29","2027-05-06"],final:"2027-06-02"
  };
  function uefaLeagueWindows(startYear,comp){
    if(startYear!==2026||!UEFA_2026_27[comp])return null;
    return UEFA_2026_27[comp].league.map(dateDay);
  }
  function seasonWindow(country,startYear){
    const p=SEASON_POLICIES[country];if(!p)return null;
    const endYear=startYear+(p.type==="cross_year"?1:0);
    const dates=CONFIRMED_2026[country];
    const start=startYear===2026&&dates?.[0]?dates[0]:startYear+"-"+p.start;
    const end=startYear===2026&&dates?.[1]?dates[1]:endYear+"-"+p.end;
    return {country,type:p.type,seasonLabel:p.type==="cross_year"?startYear+"/"+String(endYear).slice(-2):String(startYear),start,end,startDay:dateDay(start),endDay:dateDay(end),source:startYear===2026&&dates?.[0]&&dates?.[1]?"confirmed":"planning_window"};
  }
  function roundDays(country,startYear,totalRounds){
    const w=seasonWindow(country,startYear);
    if(!w||!Number.isInteger(totalRounds)||totalRounds<1)return [];
    if(totalRounds===1)return [w.startDay];
    return Array.from({length:totalRounds},(_,i)=>w.startDay+Math.round(i*(w.endDay-w.startDay)/(totalRounds-1)));
  }
  function currentSeason(country,day){
    const y=Number(toDate(day).slice(0,4));
    for(const startYear of [y,y-1,y+1]){
      const w=seasonWindow(country,startYear);
      if(w&&day>=w.startDay&&day<=w.endDay)return w;
    }
    return null;
  }
  const COUNTRY_NAMES={
    England:"ENG",Spain:"ESP",Italy:"ITA",Germany:"GER",France:"FRA",
    Portugal:"POR",Netherlands:"NED",Belgium:"BEL",Austria:"AUT",Switzerland:"SUI",
    Scotland:"SCO",Denmark:"DEN",Poland:"POL",Romania:"ROU",
    Sweden:"SWE",Norway:"NOR",Ireland:"IRL",
    Inglaterra:"ENG",Espanha:"ESP",Italia:"ITA",Alemanha:"GER",Franca:"FRA",
    Suecia:"SWE",Noruega:"NOR",Irlanda:"IRL"
  };
  // Janelas de mercado para a simulacao: parametros nacionais editaveis.
  // Sao janelas de planejamento, nao prazos oficiais fixos para todos os anos.
  const MARKET_WINDOWS={
    cross_year:[["01-01","02-02","Inverno"],["07-01","09-01","Verao"]],
    calendar_year:[["01-01","03-31","Pre-temporada"],["07-01","08-31","Meio da temporada"]]
  };
  function transferWindows(country,year){
    const policy=SEASON_POLICIES[country];
    if(!policy)return [];
    return MARKET_WINDOWS[policy.type].map(([start,end,name])=>({
      name,start:dateDay(year+"-"+start),end:dateDay(year+"-"+end),source:"planning_window"
    }));
  }
  function leagueCountry(league){
    const raw=String(league?.country||league?.countryCode||"").trim();
    if(SEASON_POLICIES[raw])return raw;
    return COUNTRY_NAMES[raw]||null;
  }
  // Dados oficiais de cada rodada devem substituir a distribuicao uniforme
  // quando disponiveis. Nao se deve agendar jogos sem saber a data confirmada.
  function resolvedRoundDay(league,season,roundIndex,totalRounds){
    const dates=league?.officialRoundDates?.[season]||league?.officialRoundDates;
    if(Array.isArray(dates)&&typeof dates[roundIndex]==="string")return dateDay(dates[roundIndex]);
    const country=leagueCountry(league);
    return country?roundDays(country,season,totalRounds)[roundIndex]??null:null;
  }
  const api={EPOCH,SEASON_POLICIES,CONFIRMED_2026,UEFA_2026_27,dateDay,toDate,seasonWindow,roundDays,currentSeason,leagueCountry,resolvedRoundDay,uefaLeagueWindows,transferWindows};
  root.ProLifeEuropeanCalendar=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
