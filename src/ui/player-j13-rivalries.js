(function(root){"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>c==="&"?"&amp;":c==="<"?"&lt;":c===">"?"&gt;":c.charCodeAt(0)===34?"&quot;":"&#39;");
function render(s){
 if(s?.mode!=="player")return "";
 const R=root.ProLifePlayerRivalries;if(!R)return "";
 const q=R.ensureCareer(s);if(!q)return '<section class="j13-panel"><small>RIVALIDADES · FC 27</small><h2>Sem rival compatível</h2><p>É necessário haver outro atleta da sua posição na mesma liga.</p></section>';
 const objective=R.OBJECTIVES[q.objectiveId];
 const rival=s.clubs?.flatMap(c=>c.roster||[]).find(p=>String(p.id)===q.rivalId);
 const title=q.rivalName||rival?.name||"Rival da liga";
 const result={active:"EM DISPUTA",win:"VITÓRIA",loss:"DERROTA",draw:"EMPATE",unfinished:"INCONCLUSIVA"}[q.result]||"A DEFINIR";
 const completed=q.result!=="active",points=completed?R.reward(q):null;
 const feed=completed?(q.result==="win"?"A torcida destaca o seu desempenho diante do rival.":q.result==="draw"?"As torcidas consideraram a disputa equilibrada.":q.result==="loss"?"O rival levou a melhor nesta disputa.":"A comparação foi encerrada sem vencedor definido."):"Torcedores acompanham a disputa por desempenho na liga.";
 return '<section class="j13-panel" aria-label="Rivalidade da carreira"><header><small>J13 · CARREIRA DE ATLETA</small><h2>Rivalidades</h2><strong>'+esc(result)+'</strong></header><div class="j13-details"><article><small>SEU RIVAL</small><h3>'+esc(title)+'</h3><p>'+esc(q.rivalPosition||s.person?.pos||"")+' · '+esc(s.clubs?.find(c=>String(c.id)===q.rivalClubId)?.name||"Clube rival")+'</p></article><article><small>DESAFIO DOS TORCEDORES</small><h3>'+esc(objective?.label||"Objetivo de desempenho")+'</h3><p>Somente partidas com estatísticas reais de ambos os atletas são computadas.</p></article></div><div class="j13-stats"><span><small>VOCÊ</small><b>'+esc(q.hero)+'</b></span><span><small>JOGOS COMPARADOS</small><b>'+esc(q.progress)+'/'+esc(q.targetMatches)+'</b></span><span><small>RIVAL</small><b>'+esc(q.rival)+'</b></span></div><div class="j13-social"><small>REAÇÃO DOS TORCEDORES</small><p>'+esc(feed)+'</p></div><p class="j13-caution">'+(points===null?"Objetivo em andamento.":'Referência FC 27: recompensa calculada de '+points+' pontos, ainda não lançada na progressão até integrar a carteira de personalidade.')+' Esta adaptação não inventa estatísticas ou comentários de pessoas reais.</p></section>';
}
const api={render};if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ProLifeJ13View=api;
})(typeof globalThis!=="undefined"?globalThis:this);
