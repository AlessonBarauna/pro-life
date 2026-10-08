(function(root){
  "use strict";
  const leagues=[
    {id:"gf_la_liga",name:"Liga Espanhola",shortName:"La Liga",country:"Espanha",level:1,clubCount:20,reputation:92,continent:"Europa",confederation:"UEFA",active:true},
    {id:"gf_ligue_1",name:"Liga Francesa",shortName:"Ligue 1",country:"Franca",level:1,clubCount:18,reputation:89,continent:"Europa",confederation:"UEFA",active:true},
    {id:"gf_liga_portugal",name:"Liga Portuguesa",shortName:"Liga Portugal",country:"Portugal",level:1,clubCount:18,reputation:84,continent:"Europa",confederation:"UEFA",active:true},
    {id:"gf_serie_a_italy",name:"Liga Italiana",shortName:"Serie A",country:"Italia",level:1,clubCount:20,reputation:90,continent:"Europa",confederation:"UEFA",active:true},
    {id:"gf_bundesliga",name:"Liga Alema",shortName:"Bundesliga",country:"Alemanha",level:1,clubCount:18,reputation:91,continent:"Europa",confederation:"UEFA",active:true},
    {id:"gf_eredivisie",name:"Liga Holandesa",shortName:"Eredivisie",country:"Holanda",level:1,clubCount:18,reputation:83,continent:"Europa",confederation:"UEFA",active:true}
  ];
  const clubs=[
    {id:"gf_madrid_capital",name:"Madrid Capital",shortName:"Madrid",country:"Espanha",leagueId:"gf_la_liga",division:1,reputation:92,strength:91,budget:180000000,active:true},
    {id:"gf_paris_etoile",name:"Paris Etoile",shortName:"Paris",country:"Franca",leagueId:"gf_ligue_1",division:1,reputation:90,strength:90,budget:175000000,active:true},
    {id:"gf_lisboa_atletico",name:"Lisboa Atletico",shortName:"Lisboa",country:"Portugal",leagueId:"gf_liga_portugal",division:1,reputation:84,strength:83,budget:85000000,active:true},
    {id:"gf_milano_rossonero",name:"Milano Rossonero",shortName:"Milano",country:"Italia",leagueId:"gf_serie_a_italy",division:1,reputation:89,strength:88,budget:130000000,active:true},
    {id:"gf_munich_athletic",name:"Munich Athletic",shortName:"Munich",country:"Alemanha",leagueId:"gf_bundesliga",division:1,reputation:91,strength:90,budget:160000000,active:true},
    {id:"gf_amsterdam_union",name:"Amsterdam Union",shortName:"Amsterdam",country:"Holanda",leagueId:"gf_eredivisie",division:1,reputation:84,strength:83,budget:90000000,active:true}
  ];
  const definitions={
    ESP:["Espanha","gf_madrid_capital","gf_la_liga",[["Iker Salas","I. Salas",2003,"GOL",82,87],["Hugo Navarro","H. Navarro",2002,"DEF",84,88],["Mateo Rios","M. Rios",2004,"MEI",85,91],["Adrian Vega","A. Vega",2001,"ATA",86,90]]],
    FRA:["Franca","gf_paris_etoile","gf_ligue_1",[["Theo Laurent","T. Laurent",2002,"GOL",83,88],["Ilyes Fofana","I. Fofana",2003,"DEF",85,91],["Mathis Moreau","M. Moreau",2001,"MEI",86,90],["Enzo Diallo","E. Diallo",2004,"ATA",87,93]]],
    POR:["Portugal","gf_lisboa_atletico","gf_liga_portugal",[["Diogo Matos","D. Matos",2003,"GOL",79,85],["Ruben Cardoso","R. Cardoso",2002,"DEF",81,86],["Tomas Pires","T. Pires",2004,"MEI",83,90],["Nuno Figueiredo","N. Figueiredo",2001,"ATA",82,87]]],
    ITA:["Italia","gf_milano_rossonero","gf_serie_a_italy",[["Marco Bianchi","M. Bianchi",2002,"GOL",82,86],["Lorenzo Ricci","L. Ricci",2003,"DEF",84,89],["Andrea Moretti","A. Moretti",2001,"MEI",85,88],["Matteo Conti","M. Conti",2004,"ATA",86,92]]],
    GER:["Alemanha","gf_munich_athletic","gf_bundesliga",[["Jonas Keller","J. Keller",2003,"GOL",83,88],["Felix Wagner","F. Wagner",2002,"DEF",85,89],["Florian Becker","F. Becker",2001,"MEI",86,89],["Noah Hoffmann","N. Hoffmann",2004,"ATA",87,93]]],
    NED:["Holanda","gf_amsterdam_union","gf_eredivisie",[["Daan Jansen","D. Jansen",2003,"GOL",79,85],["Sem de Boer","S. de Boer",2002,"DEF",81,87],["Milan Visser","M. Visser",2004,"MEI",83,90],["Luuk Smit","L. Smit",2001,"ATA",82,87]]]
  };
  const players=[];
  for(const [code,[nationality,clubId,leagueId,rows]] of Object.entries(definitions))rows.forEach((row,index)=>{
    const [name,shortName,birthYear,pos,overall,potential]=row;
    players.push({id:`gf_${code.toLowerCase()}_${index+1}`,name,shortName,nationality,birthYear,pos,secondaryPositions:[],ovr:overall,overall,potential,clubId,leagueId,status:"active",active:true,reputation:Math.max(40,overall-12),external:true,marketStatus:"external",attrs:{pace:overall,finish:overall,pass:overall,defense:overall,strength:overall,stamina:overall}});
  });
  const seed={version:1,baseYear:2026,leagues,clubs,players};
  root.ProLifeGlobalFootballSeed=seed;
  if(typeof module!=="undefined"&&module.exports)module.exports=seed;
})(typeof globalThis!=="undefined"?globalThis:this);
