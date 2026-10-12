(function(root){
  "use strict";
  // 34F.31A - Resolvedor central de contexto da carreira.
  // Clube, pais de atuacao, liga, nacionalidade e selecao sao dimensoes independentes.
  // Somente leitura: nada e gravado no save e nenhum vinculo contratual e alterado.
  const NAMES=()=>root.ProLifeNames||(typeof require==="function"?(()=>{try{return require("./display-names.js");}catch(e){return null;}})():null);
  const NI=()=>root.ProLifeNationalIdentity||(typeof require==="function"?(()=>{try{return require("./national-identity.js");}catch(e){return null;}})():null);
  const DEMONYM={ESP:"Espanhola",BRA:"Brasileira",ARG:"Argentina",FRA:"Francesa",POR:"Portuguesa",ENG:"Inglesa",GER:"Alemã",ITA:"Italiana",NED:"Holandesa",BEL:"Belga",URU:"Uruguaia",COL:"Colombiana",CHI:"Chilena",ECU:"Equatoriana",PAR:"Paraguaia",PER:"Peruana",VEN:"Venezuelana",BOL:"Boliviana",MEX:"Mexicana",USA:"Americana",CAN:"Canadense",JPN:"Japonesa",KOR:"Sul-Coreana",CRO:"Croata",SUI:"Suíça",AUT:"Austríaca",DEN:"Dinamarquesa",NOR:"Norueguesa",SWE:"Sueca",POL:"Polonesa",TUR:"Turca",MAR:"Marroquina",SEN:"Senegalesa",EGY:"Egípcia",AUS:"Australiana",SCO:"Escocesa",WAL:"Galesa",IRL:"Irlandesa"};
  function teamLabel(team){
    if(!team||!team.code)return team&&team.name?`Seleção de ${team.name}`:"Seleção indisponível";
    return DEMONYM[team.code]?`Seleção ${DEMONYM[team.code]}`:`Seleção de ${team.name}`;
  }
  function clubOf(s,D){
    D=D||root.ProLife;
    let c=null;
    try{c=s&&s.clubId?((D&&D.club&&D.club(s,s.clubId))||(s.clubs||[]).find(x=>x.id===s.clubId)||null):null;}catch(e){c=null;}
    return c;
  }
  function clubName(s,D){
    const c=clubOf(s,D);if(!c)return null;
    const N=NAMES();return (N&&N.club?N.club(s,c.id,c.name):c.name)||c.name||null;
  }
  function leagueOf(s,D,club){
    D=D||root.ProLife;if(!club||!club.leagueId)return null;
    const local=(s.leagues||[]).find(l=>l.id===club.leagueId);
    let l=local||null;
    if(!l){try{l=D&&D.GlobalFootball&&D.GlobalFootball.leagueById(s,club.leagueId);}catch(e){l=null;}}
    if(!l)return {id:club.leagueId,name:null,country:club.country||null};
    const N=NAMES();return {id:l.id,name:(N&&N.league?N.league(s,l.id,l.name):l.name)||l.name||null,country:l.country||club.country||null,local:!!local};
  }
  // Competicao principal do clube: a disputa em que ele esta inscrito (estaduais/copas nao entram) ou a liga vinculada.
  function mainCompetitionId(s,D,club){
    if(!club)return null;
    if((s.leagues||[]).some(l=>l.id===club.leagueId))return club.leagueId;
    return club.leagueId||null;
  }
  function resolve(s,D){
    D=D||root.ProLife;
    const club=clubOf(s,D),N=NI();
    const league=leagueOf(s,D,club);
    const team=(s&&s.mode==="player"&&N)?N.heroTeam(s,D):null;
    return {
      season:s&&s.season,
      available:!!club,
      club:club?{id:club.id,name:clubName(s,D),country:club.country||(league&&league.country)||null,leagueId:club.leagueId||null,source:(s.clubs||[]).some(x=>x.id===club.id)?"local":"catalogo"}:null,
      league,
      playCountry:(club&&club.country)||(league&&league.country)||null,
      mainCompetitionId:mainCompetitionId(s,D,club),
      nationality:s&&s.person?(s.person.nationality||null):null,
      nationalTeam:team?{code:team.code,name:team.name,represented:team.represented,label:teamLabel(team),reason:team.reason}:null,
      reason:club?null:(s&&s.clubId?"O clube atual não foi encontrado no catálogo.":"Sem clube no momento.")
    };
  }
  const api={resolve,clubOf,clubName,leagueOf,teamLabel,mainCompetitionId};
  root.ProLifeCareerContext=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
