(function(root){"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function snapshot(s,D){
 if(s?.mode!=="player")return null;
 const next=D.nextCommitment?.(s)||null,stage=next&&D.Competitions?.fixtureStage?.(s,next);
 const played=(s.matches||[]).filter(m=>(m.home===s.clubId||m.away===s.clubId)&&Number(m.date)<=Number(s.day)).slice().sort((a,b)=>(Number(b.date)||0)-(Number(a.date)||0)).slice(0,4);
 const person=s.person||{};
 return {next,stage,played,day:s.day,injury:Number(person.injury)||0,condition:Number(person.condition??0),clubId:s.clubId};
}
function render(s,D,dayDate){
 const x=snapshot(s,D);if(!x)return "";
 const n=x.next,days=n?Math.max(0,Number(n.date)-Number(s.day)):null;
 const fixture=n?'<div class="j12-match"><div><small>PRÓXIMO COMPROMISSO</small><h3>'+esc(n.home||"Mandante")+' <em>VS</em> '+esc(n.away||"Visitante")+'</h3><p>'+esc(n.competitionName||"Competição")+' · '+esc(x.stage||n.stage||"Fase não informada")+' · '+esc(dayDate(n.date))+'</p></div><strong>'+esc(days===0?"HOJE":"EM "+days+" DIA"+(days===1?"":"S"))+'</strong></div>':'<p class="j12-empty">Nenhum compromisso oficial agendado.</p>';
 const recent=x.played.length?x.played.map(m=>'<li><small>'+esc(dayDate(m.date))+' · '+esc(m.competitionName||"Competição")+'</small><b>'+esc(m.home)+' '+esc(m.hg)+' × '+esc(m.ag)+' '+esc(m.away)+'</b></li>').join(""):'<li>Nenhum resultado recente do clube.</li>';
 return '<section class="j12-hub" aria-label="Painel de temporada e compromissos"><header><small>J12 · TEMPORADA / CALENDÁRIO</small><h2>Agenda da carreira</h2><p>Compromissos oficiais e resultados reais do calendário atual.</p></header>'+fixture+'<div class="j12-info"><article><small>CONDIÇÃO PARA O PRÓXIMO JOGO</small><h3>'+esc(x.injury>0?"Em recuperação":"Disponibilidade física")+'</h3><p>'+esc(x.injury>0?x.injury+" dia(s) de lesão registrados":Math.round(x.condition)+"% de condição física")+'</p><p>A situação final de escalação é calculada pela comissão técnica.</p></article><article><small>RESULTADOS RECENTES</small><ul>'+recent+'</ul></article></div><nav class="j12-shortcuts" aria-label="Ações da temporada"><button type="button" data-page="matches">Pré-jogo e relatórios</button><button type="button" data-page="lineup">Escalação</button><button type="button" data-page="competitions">Competições e fases</button><button type="button" data-page="training">Preparação e recuperação</button></nav><footer>As datas e fases vêm do calendário original. Esta tela não agenda, simula ou duplica partidas.</footer></section>';
}
const api={snapshot,render};if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ProLifeJ12=api;
})(typeof globalThis!=="undefined"?globalThis:this);
