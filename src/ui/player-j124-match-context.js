(function(root){"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function describe(next,s){
 if(!next)return null;
 const phase=String(next.stage||""),competition=String(next.competitionName||"Competição");
 const text=(phase+" "+competition).toLowerCase();
 const final=/\bfinal\b|decis[aã]o/.test(text)&&!/semifinal|semi-final|quartas|oitavas/.test(text);
 const semi=/semi.?final/.test(text),quarters=/quartas/.test(text),round16=/oitavas/.test(text);
 const knockout=final||semi||quarters||round16||/mata.?mata|eliminat/.test(text);
 const tag=final?"FINAL":semi?"SEMIFINAL":quarters?"QUARTAS DE FINAL":round16?"OITAVAS DE FINAL":knockout?"MATA-MATA":"COMPROMISSO OFICIAL";
 const detail=final?"Uma decisão de título.":semi?"Disputa por vaga na final.":quarters||round16?"Confronto de fase eliminatória.":knockout?"O resultado pode influenciar a permanência no torneio.":"O resultado contribui para a campanha do clube.";
 const home=next.homeId||next.homeClubId||next.homeTeamId,away=next.awayId||next.awayClubId||next.awayTeamId;
 const own=String(s?.clubId||"");
 const isHome=home!=null?String(home)===own:null;
 return {tag,detail,competition,phase,knockout,isHome,opponent:isHome===true?next.away:isHome===false?next.home:null};
}
function render(next,s){
 const d=describe(next,s);if(!d)return "";
 const fitness=Number(s?.person?.condition??0),injury=Number(s?.person?.injury||0);
 return '<section class="j124-brief" aria-label="Contexto do confronto"><div class="j124-header"><small>J12.4 · CONTEXTO DA PARTIDA</small><strong>'+esc(d.tag)+'</strong></div><p>'+esc(d.detail)+'</p><div class="j124-facts"><span><b>Competição</b>'+esc(d.competition)+'</span><span><b>Etapa registrada</b>'+esc(d.phase||"Não informada")+'</span><span><b>Condição do atleta</b>'+esc(injury>0?"Lesionado · "+injury+" dia(s)":Math.round(fitness)+"%")+'</span></div><p class="j124-foot">Importância numérica, classificação e consequências individuais são calculadas pelo motor quando a partida é disputada. Este resumo não atribui bônus nem garante classificação.</p></section>';
}
const api={describe,render};if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ProLifeJ124=api;
})(typeof globalThis!=="undefined"?globalThis:this);
