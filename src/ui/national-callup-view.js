(function(root){
  "use strict";
  // 34F.30D - Tela de convocacao (modal cinematografico original do PRO-LIFE) e painel do hub. Somente leitura do estado.
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const NC=()=>root.ProLifeNationalCallups||(typeof require==="function"?require("../domain/national-callups.js"):null);
  const num=v=>Number.isFinite(Number(v))?Math.round(Number(v)):"—";
  const POS={GOL:"Goleiros",DEF:"Defensores",MEI:"Meias",ATA:"Atacantes"};
  const CSS=`<style id="callup-modal-style">
.cu-back{position:fixed;inset:0;z-index:140;background:radial-gradient(120% 90% at 50% 0,#12202c 0,#05090d 70%);display:grid;place-items:center;padding:20px;overflow:auto}
.cu-card{position:relative;width:min(760px,96vw);background:#0d151c;border:1px solid #2b3d4b;border-radius:6px;overflow:hidden;color:#eef3f7;box-shadow:0 30px 90px #000c}
.cu-card:before{content:"";position:absolute;inset:0 auto 0 0;width:8px;background:linear-gradient(#e0b84c,#b8372d)}
.cu-card.first:after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(115deg,transparent 0 22px,#e0b84c0d 22px 24px);pointer-events:none}
.cu-in{position:relative;padding:28px 30px 24px 38px;z-index:1}
.cu-kick{letter-spacing:.22em;font-size:11px;color:#e0b84c;text-transform:uppercase}
.cu-head{display:flex;gap:18px;align-items:center;margin:10px 0 6px}
.cu-crest{width:74px;height:84px;flex:none;display:grid;place-items:center;font-weight:800;font-size:24px;letter-spacing:.04em;color:#0d151c;background:#e0b84c;clip-path:polygon(0 0,100% 0,100% 62%,50% 100%,0 62%)}
.cu-card.out .cu-crest{background:#5c6b78}
.cu-h{margin:0;font-size:30px;line-height:1.1;text-transform:uppercase;letter-spacing:.01em}.cu-sub{color:#9fb0bd;margin:4px 0 0;font-size:14px}
.cu-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:16px 0}
.cu-grid div{background:#121d26;border:1px solid #243441;padding:9px 11px}.cu-grid small{display:block;color:#8a9bab;font-size:10px;letter-spacing:.1em;text-transform:uppercase}.cu-grid b{font-size:15px}
.cu-note{color:#9fb0bd;font-size:13px;line-height:1.5;margin:8px 0}
.cu-list{margin-top:10px;border-top:1px solid #243441;padding-top:10px;max-height:240px;overflow:auto}.cu-list h4{margin:8px 0 4px;color:#e0b84c;font-size:12px;letter-spacing:.12em;text-transform:uppercase}
.cu-list span{display:inline-block;margin:2px 4px 2px 0;padding:3px 8px;background:#121d26;border:1px solid #243441;font-size:12px}.cu-list span.me{border-color:#e0b84c;color:#e0b84c}
.cu-act{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.cu-act button{padding:10px 16px;border:1px solid #365264;background:transparent;color:#eef3f7;cursor:pointer;border-radius:3px}.cu-act button.p{background:#e0b84c;border-color:#e0b84c;color:#0d151c;font-weight:700}
</style>`;
  function listHtml(rec){
    const by={GOL:[],DEF:[],MEI:[],ATA:[]};for(const p of rec.list||[])(by[p.pos]||(by[p.pos]=[])).push(p);
    return Object.keys(POS).filter(k=>(by[k]||[]).length).map(k=>`<h4>${POS[k]}</h4>${by[k].map(p=>`<span class="${p.hero?"me":""}">${esc(p.name)}${p.hero?" · VOCÊ":""} · ${num(p.ger)}</span>`).join("")}`).join("");
  }
  function modal(s,D,rec){
    const N=NC();if(!rec)return "";
    const first=rec.called&&rec.first,hero=s.person||{};
    const prevText=rec.called?(rec.first?"Primeira convocação da carreira":`${num(rec.priorCallups)} convocaç${rec.priorCallups===1?"ão anterior":"ões anteriores"}`):"Fora da lista";
    const matches=(rec.matches||[]).length?rec.matches.map(m=>`${N.fmt(m.day)}${m.opponent?` · ${esc(m.opponent)}`:""}`).join("; "):(rec.note||"Sem partidas confirmadas.");
    const role=rec.called?(rec.role||"A definir"):"—";
    const title=rec.called?(first?"Primeira convocação":"Convocado"):"Fora da lista";
    return `${CSS}<div class="cu-back" id="callup-modal" role="dialog" aria-modal="true"><section class="cu-card ${first?"first":""} ${rec.called?"":"out"}"><div class="cu-in">
<div class="cu-kick">${rec.called?"Chamada da seleção":"Lista divulgada"} · ${esc(rec.competition)}</div>
<div class="cu-head"><div class="cu-crest">${(()=>{const h=root.ProLifeNationalCrests?root.ProLifeNationalCrests.render(rec.teamCode||rec.teamName,{size:"lg"}):"";return h||esc(rec.teamCode);})()}</div><div><h2 class="cu-h">${esc(title)}</h2><p class="cu-sub">${esc(hero.name)} · ${esc(rec.teamName)}</p></div></div>
<div class="cu-grid"><div><small>Histórico</small><b>${esc(prevText)}</b></div><div><small>Apresentação</small><b>${esc(N.fmt(rec.presentationDay))}</b></div><div><small>Janela até</small><b>${esc(N.fmt(rec.endDay))}</b></div><div><small>Papel inicial</small><b>${esc(role)}</b></div><div><small>GER considerado</small><b>${num(rec.score&&rec.score.ger)}</b></div><div><small>Disputa em ${esc(hero.pos||"")}</small><b>${rec.rank?num(rec.rank)+"º · "+num(rec.quota)+" vagas":"—"}</b></div></div>
<p class="cu-note"><b>Partidas:</b> ${matches}</p>
${rec.called?`<p class="cu-note">A ida à seleção não é uma transferência: contrato e vínculo com o clube permanecem.</p>`:`<p class="cu-note">${esc((rec.reasons||[]).join(" · "))}</p>`}
<div class="cu-list" id="cu-list" hidden>${listHtml(rec)}</div>
<div class="cu-act"><button data-cu-view>Ver convocação</button><button class="p" data-cu-go="${esc(rec.id)}">Ir para minha seleção</button><button data-cu-continue="${esc(rec.id)}">Continuar</button></div>
</div></section></div>`;
  }
  // Painel do hub: situacao atual da convocacao e proxima janela.
  function panel(s,D){
    const N=NC();if(!N)return "";
    const cur=N.current(s),duty=N.onDuty(s),next=N.nextWindow(s,D);
    const bits=[];
    if(duty)bits.push(`<div class="nh-box nh-warn"><small>A serviço da seleção</small><b>${esc(duty.competition)}</b><p class="nh-note">Até ${esc(N.fmt(duty.endDay))}. Retorno ao clube em ${esc(N.fmt(duty.returnDay))}.</p></div>`);
    if(cur)bits.push(`<div class="nh-box"><small>Última lista (${esc(cur.competition)})</small><b>${cur.called?(cur.first?"Primeira convocação":"Convocado"):"Fora da lista"}</b><p class="nh-note">Anunciada em ${esc(N.fmt(cur.announcedDay))}. ${cur.called?`Papel inicial: ${esc(cur.role||"—")}.`:esc((cur.reasons||[]).join(" · "))}</p></div>`);
    if(next)bits.push(`<div class="nh-box"><small>Próxima janela</small><b>${esc(next.competition||next.label)}</b><p class="nh-note">Lista em ${esc(N.fmt(next.announceDay))} · apresentação em ${esc(N.fmt(next.presentationDay))}. Calendário de referência do PRO-LIFE (não oficial).</p></div>`);
    return bits.join("");
  }
  // Lista oficial da ultima janela (separada do elenco-base) com status esportivo de cada atleta + historico.
  function official(s,D){
    const N=NC();if(!N)return "";const cur=N.current(s);if(!cur)return "";
    const st=new Set((cur.lineup&&cur.lineup.starters)||[]);
    const rows=(cur.list||[]).map(p=>`<tr class="${p.hero?"me":""}"><td>${esc(p.name)}${p.hero?" · VOCÊ":""}</td><td>${esc(p.pos)}</td><td>${num(p.ger)}</td><td>${st.has(p.id)?"Titular":"Reserva"}</td></tr>`).join("");
    const hs={titular:"Titular",reserva:"Reserva",nao_relacionado:"Não relacionado"}[cur.lineup&&cur.lineup.heroStatus]||"—";
    const hist=N.history(s).slice().reverse().map(r=>`<tr><td>${esc(r.competition)}</td><td>${esc(N.fmt(r.announcedDay))}</td><td>${r.called?(r.first?"Primeira convocação":"Convocado"):"Fora da lista"}</td><td>${esc(r.stage==="cancelled"?"Cortado":r.stage==="returned"?"Encerrada":r.stage==="duty"?"Em andamento":"Anunciada")}</td></tr>`).join("");
    return `<details class="nh-box" open><summary>Convocação oficial · ${esc(cur.competition)} · você: ${esc(hs)}</summary><p class="nh-note">Lista anunciada em ${esc(N.fmt(cur.announcedDay))}, distinta do elenco-base de referência. ${cur.called?"":esc((cur.reasons||[]).join(" · "))}</p>${cur.list&&cur.list.length?`<div class="tablewrap"><table><thead><tr><th>Jogador</th><th>Pos.</th><th>GER</th><th>Situação</th></tr></thead><tbody>${rows}</tbody></table></div>`:""}</details>
<details class="nh-box"><summary>Histórico de convocações (${N.history(s).length})</summary><div class="tablewrap"><table><thead><tr><th>Janela</th><th>Anúncio</th><th>Resultado</th><th>Estado</th></tr></thead><tbody>${hist}</tbody></table></div></details>`;
  }
  function calendar(s,D){
    const N=NC();if(!N)return "";const w=N.nextWindow(s,D);if(!w)return "";
    return `<p class="nh-note"><b>Próxima janela:</b> ${esc(w.competition||w.label)} · lista ${esc(N.fmt(w.announceDay))} · apresentação ${esc(N.fmt(w.presentationDay))} · retorno ${esc(N.fmt(w.returnDay))} (calendário de referência do PRO-LIFE).</p>`;
  }
  const api={modal,panel,listHtml,official,calendar};
  root.ProLifeCallupView=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
