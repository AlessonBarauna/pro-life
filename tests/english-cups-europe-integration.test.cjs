const test=require('node:test');
const assert=require('node:assert/strict');

const LEAGUES={premier:'gf_fc27_premier_league',championship:'gf_fc27_efl_championship',leagueOne:'gf_fc27_efl_league_one',leagueTwo:'gf_fc27_efl_league_two'};
global.ProLifeWorldClubCompetitions={
  coverage(s){return Object.values(LEAGUES).map(id=>({leagueId:id,status:'playable',rounds:id===LEAGUES.premier?38:46,clubCount:s.globalFootball.clubs.filter(c=>c.leagueId===id).length}));},
  roundDate(season,index,rounds){return (season-2026)*365+10+Math.floor(index*(330/Math.max(1,rounds-1)));},
  standings(s,id){return s.globalFootball.clubs.filter(c=>c.leagueId===id).map((c,i)=>({...c,points:100-i}));}
};
const EnglishCups=require('../src/domain/english-cups.js');
const Continental=require('../src/domain/continental.js');

function career(){
  const clubs=[];
  for(const [league,count] of [[LEAGUES.premier,20],[LEAGUES.championship,24],[LEAGUES.leagueOne,24],[LEAGUES.leagueTwo,24]])for(let i=0;i<count;i++)clubs.push({id:`${league}_${i+1}`,name:`Club ${clubs.length+1}`,leagueId:league,active:true,generated:false,level:55+(clubs.length%35)});
  const premier=clubs.filter(c=>c.leagueId===LEAGUES.premier).map(c=>c.id);
  const entrants={ucl:premier.slice(0,4),uel:premier.slice(4,6),uecl:premier.slice(6,7)};
  const editions={};for(const [comp,ids] of Object.entries(entrants))editions[`${comp}:2026`]={comp,season:2026,entrants:ids.map(id=>[id,'ENG','test',1])};
  return {catalogVersion:'fc27_v1',season:2026,day:0,initialSeed:741,clubId:premier[0],globalFootball:{clubs,leagues:Object.values(LEAGUES).map(id=>({id,country:'England'}))},continental:{editions,finals:{'2025':{ENG:premier}}}};
}

test('cria FA Cup e EFL Cup com 92 clubes únicos e entradas escalonadas',()=>{
  const s=career();EnglishCups.init(s);
  const fa=EnglishCups.edition(s,'fa_cup'),efl=EnglishCups.edition(s,'efl_cup');
  assert.equal(fa.participantIds.length,92);assert.equal(new Set(fa.participantIds).size,92);
  assert.equal(efl.participantIds.length,92);assert.equal(fa.rounds[0].matches.length,24);
  assert.equal(efl.rounds[0].matches.length,36);
  assert.equal(EnglishCups.edition(s,'community_shield').status,'not_eligible');
});

test('conclui as copas, persiste campeões e não duplica partidas',()=>{
  const s=career();EnglishCups.init(s);
  for(let d=1;d<=364;d++){s.day=d;EnglishCups.daily(s);}
  for(const comp of ['fa_cup','efl_cup']){const ed=EnglishCups.edition(s,comp);assert.equal(ed.status,'complete');assert.ok(ed.championId);assert.ok(s.englishCups.history.some(h=>h.comp===comp&&h.championId===ed.championId));}
  assert.deepEqual(EnglishCups.audit(s).duplicates,[]);
});

test('distribui UCL, UEL e UECL sem inscrição simultânea e redistribui campeões já classificados',()=>{
  const order=Array.from({length:20},(_,i)=>`club_${i+1}`);
  const cases=[
    [{faCupWinner:'club_10',eflCupWinner:'club_11'},['club_10'],['club_11']],
    [{faCupWinner:'club_1',eflCupWinner:'club_5'},['club_5','club_6'],['club_7']],
    [{faCupWinner:'club_1',eflCupWinner:'club_5'},['club_5','club_6'],['club_7']],
    [{faCupWinner:'club_1',eflCupWinner:'club_2'},['club_5','club_6'],['club_7']]
  ];
  for(const [cups] of cases){const a=Continental.englishEuropeanAllocation(order,cups);assert.equal(a.ucl.length,4);assert.equal(a.uel.length,2);assert.equal(a.uecl.length,1);assert.equal(new Set(a.all).size,7);}
  const direct=Continental.englishEuropeanAllocation(order,{faCupWinner:'club_10',eflCupWinner:'club_11'});
  assert.equal(direct.uel[0],'club_10');assert.equal(direct.uecl[0],'club_11');
  const redistributed=Continental.englishEuropeanAllocation(order,{faCupWinner:'club_1',eflCupWinner:'club_2'});
  assert.deepEqual(redistributed.ucl,order.slice(0,4));assert.deepEqual(redistributed.uel,order.slice(4,6));assert.deepEqual(redistributed.uecl,order.slice(6,7));
});

test('nextFixture expõe a copa no calendário integrado somente para clube participante',()=>{
  const s=career();EnglishCups.init(s);const first=EnglishCups.edition(s,'efl_cup').rounds[0].matches[0];s.clubId=first.homeId;
  const next=EnglishCups.nextFixture(s);assert.equal(next.id,first.id);assert.equal(next.competitionId,'efl_cup');assert.ok(next.day>s.day);
});
