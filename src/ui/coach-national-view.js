(function(root){
  "use strict";
  // Tela "Seleção" do modo treinador: convites, candidatura, convocação, formação, calendário e resultados.
  const ui={xiSel:null,swapIn:null,tab:null,page:{players:0,nations:0,fixtures:0,results:0,cup:0,tour:0,qtable:0,qgames:0,offers:0,add:0},pos:"TODOS",confirmLeave:false,nation:null,year:null,rel:"geral",addOpen:false,add:{text:"",pos:"TODOS",ageMin:"",ageMax:"",ovrMin:"",withCalled:false,run:false,page:0}};
  let ctx={s:null,D:null};
  const nolbl=v=>String(v==null?"":v).replace(/Amistoso internacional/gi,"Amistoso");
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const CN=()=>root.ProLifeCoachNational||(typeof require==="function"?require("../domain/coach-national.js"):null);
  const isPhone=()=>{try{return !!root.ProLifeMobileSM27?.isPhone?.();}catch(e){return false;}};
  const SIZE=()=>isPhone()?(()=>{const tall=(root.innerHeight||0)>=380;return {players:tall?12:8,nations:tall?4:3,fixtures:tall?4:3,results:tall?4:3};})():{players:12,nations:10,fixtures:8,results:8};
  const POS_LABEL={GOL:"Goleiros",DEF:"Defensores",MEI:"Meio-campistas",ATA:"Atacantes"};
  const flag=(code,name)=>{try{const h=root.ProLifeNationalCrests?.inline?.(code||name,"sm");if(h)return h;}catch(e){}return `<span class="cn-code">${esc(code||"?")}</span>`;};
  const crest=(code,name)=>{try{const h=root.ProLifeNationalCrests?.render?.(code||name,{size:"lg"});if(h&&String(h).startsWith("<"))return h;}catch(e){}return `<span class="cn-code big">${esc(code||"?")}</span>`;};

  function css(){return `<style>
.cn{--cn-bg:#0f1720;--cn-card:#16212d;--cn-line:#26364a;--cn-text:#e9eef5;--cn-mut:#92a3b8;--cn-grass:#3ec28f;--cn-gold:#e5b94e;--cn-red:#e5655a;color:var(--cn-text)}
.cn *{box-sizing:border-box}
.cn-head{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:14px;background:linear-gradient(120deg,#16303a,#101a26 62%);border:1px solid var(--cn-line);margin-bottom:10px}
.cn-head .big{width:54px;height:54px;display:grid;place-items:center;border-radius:12px;background:var(--cn-card);font-weight:800}
.cn-head h2{margin:0;font-size:20px;line-height:1.15}.cn-head p{margin:2px 0 0;color:var(--cn-mut);font-size:12.5px}
.cn-head .grow{flex:1;min-width:0}.cn-meter{min-width:96px;text-align:right}.cn-meter b{display:block;font-size:26px;line-height:1}.cn-meter small{color:var(--cn-mut);font-size:11px}
.cn-sub{display:flex;gap:6px;margin:0 0 10px;flex-wrap:wrap}
.cn-sub button{border:1px solid var(--cn-line);background:transparent;color:var(--cn-mut);border-radius:999px;padding:6px 14px;font:inherit;font-size:12.5px;font-weight:600;cursor:pointer}
.cn-sub button.on{background:var(--cn-grass);border-color:var(--cn-grass);color:#06231a}
.cn-xi-wrap{display:grid;grid-template-columns:1.4fr 1fr;gap:8px}.cn-pitch{position:relative;height:min(258px,calc(100vh - 170px));min-height:210px;padding:0;overflow:hidden;background:repeating-linear-gradient(0deg,#173d2c 0 32px,#1a4431 32px 64px)}.t-escalacao .cn-note{margin:2px 0 4px;font-size:11px}@media (max-height:480px){.t-escalacao .cn-head,.t-convocacao .cn-head,.t-taticas .cn-head{display:none}.t-convocacao .cn-list2>.cn-pager{grid-column:1/-1}.t-convocacao .cn-list2{display:grid;grid-template-columns:1fr 1fr;column-gap:12px}.cn-call{display:flex;align-items:center;gap:10px;padding:6px 10px!important}.cn-call p{margin:0;font-size:11px}.cn-call .cn-btn{white-space:nowrap}}.cn-field{position:absolute;inset:6px;border:1px solid rgba(255,255,255,.22);border-radius:4px;background:linear-gradient(rgba(255,255,255,.22),rgba(255,255,255,.22)) center/100% 1px no-repeat}.cn-field:before{content:'';position:absolute;left:50%;top:50%;width:54px;height:54px;margin:-27px;border:1px solid rgba(255,255,255,.22);border-radius:50%}.cn-at{position:absolute;transform:translate(-50%,-50%);min-width:50px;padding:2px 4px}.cn-at.off{border-color:#d9962b}.cn-at.off i{color:#f0b24a}
.cn-xi{display:grid;gap:0;justify-items:center;border:1px solid var(--cn-line);background:var(--cn-card);color:var(--cn-text);border-radius:9px;padding:3px 6px;min-width:56px;font:inherit;cursor:pointer}.cn-xi i{font-style:normal;font-weight:800;font-size:13px;color:var(--cn-gold)}.cn-xi b{font-size:11px;max-width:74px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cn-xi small{font-size:9px;color:var(--cn-mut)}.cn-xi.sel{outline:2px solid var(--cn-grass);background:#1d3a33}.cn-xi.out{opacity:.45}
.cn-xi-bench{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}.cn-form{display:grid;gap:6px;margin-top:6px}.cn-form label{display:grid;gap:2px;font-size:11px;color:var(--cn-mut)}.cn-form select{background:var(--cn-bg);color:var(--cn-text);border:1px solid var(--cn-line);border-radius:7px;padding:4px 6px;font:inherit}
.cn-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}
.cn-card{background:var(--cn-card);border:1px solid var(--cn-line);border-radius:12px;padding:12px 14px;min-width:0}
.cn-card>small{display:block;color:var(--cn-mut);font-size:11px;margin-bottom:6px;font-weight:600}
.cn-card h3{margin:0 0 4px;font-size:15px}.cn-card p{margin:4px 0;color:var(--cn-mut);font-size:12.5px;line-height:1.4}
.cn-rec{display:flex;gap:14px}.cn-rec div{text-align:center}.cn-rec b{display:block;font-size:22px}.cn-rec small{color:var(--cn-mut);font-size:11px}
.cn-bar{height:7px;border-radius:99px;background:#0b121a;overflow:hidden;margin-top:8px}.cn-bar i{display:block;height:100%;background:var(--cn-grass)}.cn-bar.warn i{background:var(--cn-gold)}.cn-bar.bad i{background:var(--cn-red)}
.cn-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:8px 2px;border-bottom:1px solid var(--cn-line)}
.cn-row:last-of-type{border-bottom:0}
.cn-line{display:flex;gap:10px;align-items:baseline;padding:6px 0;border-bottom:1px solid var(--cn-line)}.cn-line:last-child{border-bottom:0}.cn-line>small{flex:none;width:30px;color:var(--cn-mut);font-weight:700}.cn-ps{display:flex;flex-wrap:wrap;gap:4px 14px;min-width:0}.cn-ps span{white-space:nowrap;font-size:12.5px}.cn-ps small{color:var(--cn-mut)}
.cn-row .who{display:flex;align-items:center;gap:9px;min-width:0}.cn-row .who>span:last-child{min-width:0}
.cn-row b{display:block;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cn-row small{color:var(--cn-mut);font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
.cn-row .end{display:flex;align-items:center;gap:8px}
.cn-pl{display:grid;grid-template-columns:34px minmax(0,1fr) auto auto;gap:9px;align-items:center;padding:7px 2px;border-bottom:1px solid var(--cn-line)}
.cn-ovr{width:34px;height:30px;border-radius:7px;display:grid;place-items:center;font-weight:800;font-size:14px;background:#0b121a;border:1px solid var(--cn-line)}
.cn-ovr.hi{color:var(--cn-gold);border-color:#6b5a28}
.cn-tag{font-size:10.5px;border:1px solid var(--cn-line);border-radius:999px;padding:2px 8px;color:var(--cn-mut);white-space:nowrap}.cn-tag.ok{color:var(--cn-grass);border-color:var(--cn-grass)}.cn-tag.no{color:var(--cn-red);border-color:var(--cn-red)}.cn-tag.st{color:var(--cn-gold);border-color:#6b5a28}
.cn-btn{border:1px solid var(--cn-line);background:var(--cn-card);color:var(--cn-text);border-radius:9px;padding:6px 12px;font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;white-space:nowrap}
.cn-btn.go{background:var(--cn-grass);border-color:var(--cn-grass);color:#06231a}.cn-btn.danger{color:var(--cn-red);border-color:#6b2c28}.cn-btn:disabled{opacity:.4;cursor:default}
.cn-tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px}.cn-tools select{background:var(--cn-card);color:var(--cn-text);border:1px solid var(--cn-line);border-radius:9px;padding:6px 8px;font:inherit;font-size:12.5px}
.cn-chips{display:flex;gap:5px;flex-wrap:wrap}.cn-chips button{border:1px solid var(--cn-line);background:transparent;color:var(--cn-mut);border-radius:999px;padding:3px 10px;font:inherit;font-size:11.5px;cursor:pointer}.cn-chips button.on{color:var(--cn-text);border-color:var(--cn-grass)}
.cn-pager{display:flex;align-items:center;justify-content:center;gap:12px;margin:8px 0 0}.cn-pager span{color:var(--cn-mut);font-size:11.5px}.cn-pager button{border:1px solid var(--cn-line);background:var(--cn-card);color:var(--cn-text);border-radius:999px;min-width:34px;min-height:26px;font-size:15px;cursor:pointer}.cn-pager button:disabled{opacity:.35;cursor:default}
.cn-res{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:6px;font-weight:800;font-size:12px;color:#fff}.cn-res.V{background:#2c9b6e}.cn-res.E{background:#8a97a6}.cn-res.D{background:#c4544b}
.cn-code{display:inline-grid;place-items:center;min-width:26px;height:20px;padding:0 4px;border-radius:5px;background:#0b121a;border:1px solid var(--cn-line);font-size:10px;font-weight:800}
.cn-note{color:var(--cn-mut);font-size:12.5px;margin:8px 0}
.cn-empty{padding:18px 8px;text-align:center;color:var(--cn-mut);font-size:13px}
@media (orientation:landscape) and (min-width:568px) and (max-width:1024px) and (max-height:560px){
  #app .cn-head{padding:5px 9px!important;gap:8px!important;margin:0 0 4px!important;min-height:0!important}
  #app .cn-head .big,#app .cn-head img,#app .cn-head svg{width:30px!important;height:30px!important;font-size:11px!important}
  #app .cn-head h2{font-size:14px!important;margin:0!important}#app .cn-head h2:before{display:none!important}#app .cn-head p{font-size:10px!important;margin:0!important}#app .cn-meter{min-width:70px}#app .cn-meter b{font-size:17px!important}#app .cn-meter small{font-size:9px!important}
  #app .cn-sub{margin:0 0 4px!important;gap:3px!important;flex-wrap:nowrap!important;display:grid!important;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr)}
  #app .cn-sub button{padding:2px 6px!important;min-height:22px!important;height:22px!important;font-size:10px!important;min-width:0!important;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #app .cn-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:5px!important}
  #app .cn-card{padding:6px 8px!important;border-radius:9px!important}#app .cn-card>small{margin-bottom:2px!important;font-size:9px!important}#app .cn-card h3{font-size:12px!important;margin:0!important}#app .cn-card p{font-size:10px!important;margin:2px 0!important;line-height:1.3!important}
  #app .cn-rec b{font-size:15px!important}#app .cn-rec small{font-size:9px!important}#app .cn-bar{margin-top:4px!important;height:5px!important}
  #app .cn-pl{padding:2px 1px!important;gap:6px!important;grid-template-columns:26px minmax(0,1fr) auto auto!important}#app .cn-ovr{width:26px!important;height:22px!important;font-size:11px!important}
  #app .cn-pl b{font-size:11px!important}#app .cn-pl small{font-size:9px!important}
  #app .cn-row{padding:3px 1px!important}#app .cn-row b{font-size:11px!important}#app .cn-row small{font-size:9.5px!important}
  #app .cn-btn{padding:2px 8px!important;min-height:22px!important;height:22px!important;font-size:10px!important;border-radius:7px!important}
  #app .cn-tools{margin:0 0 3px!important;gap:5px!important}#app .cn-tools label{font-size:10px}#app .cn-tools select{padding:1px 4px!important;min-height:22px!important;height:22px!important;font-size:10px!important;width:auto!important}
  #app .cn-chips{gap:3px!important}#app .cn-chips button{padding:1px 8px!important;min-height:20px!important;height:20px!important;font-size:9.5px!important}
  #app .cn-pager{margin:2px 0 0!important;gap:8px!important}#app .cn-pager button{min-height:20px!important;height:20px!important;min-width:30px!important;font-size:13px!important;padding:0!important}#app .cn-pager span{font-size:10px!important}
  #app .cn-note{margin:2px 0!important;font-size:10px!important}#app .cn-tag{font-size:9px!important;padding:0 6px!important}#app .cn-empty{padding:8px 4px!important;font-size:10.5px!important}
  #app .cn-res{width:20px;height:20px;font-size:10px}
}

.cnv{display:grid;grid-template-columns:66px minmax(0,1fr);gap:8px;position:relative;min-height:0}
.cnv-rail{display:flex;flex-direction:column;gap:2px;padding:6px 3px;border:1px solid #1f3a4d;border-radius:12px;background:linear-gradient(180deg,#0f2130,#08121b);align-self:start}
.cnv-rail button{position:relative;display:grid;justify-items:center;gap:1px;padding:5px 1px 4px;border:0;border-radius:10px;background:none;color:#9fb4c6;font:inherit;font-size:8px;letter-spacing:-.3px;white-space:nowrap;font-weight:700;cursor:pointer;min-height:0!important}
.cnv-rail button.on{color:#0a1620;background:linear-gradient(135deg,#e6ff7a,#b4dc2a);box-shadow:0 0 14px rgba(201,242,58,.45)}
.cnv-ic svg{width:22px;height:22px;display:block}.cnv-rail button.on .cnv-ic{background:#0a1620;border-radius:9px;padding:2px}
.cnv-badge{position:absolute;top:2px;right:3px;min-width:15px;height:15px;padding:0 3px;border-radius:8px;background:#ff4d5e;color:#fff;font-style:normal;font-size:9px;font-weight:800;display:grid;place-items:center}
.cnv-main{min-width:0}.cnv-dim{color:var(--cn-mut);font-size:10.5px}
.cni-wave{transform-origin:9px 10px;animation:cniW 2.2s ease-in-out infinite}@keyframes cniW{50%{transform:skewY(-6deg) scaleX(.94)}}
.cni-pop,.cni-pop2{animation:cniP 2s ease-in-out infinite}.cni-pop2{animation-delay:.6s}@keyframes cniP{50%{transform:translateY(-2px)}}
.cni-check{stroke-dasharray:24;animation:cniC 2.4s ease-in-out infinite}@keyframes cniC{0%{stroke-dashoffset:24}45%,100%{stroke-dashoffset:0}}
.cni-b1,.cni-b2,.cni-b3{transform-box:fill-box;transform-origin:bottom;animation:cniB 2s ease-in-out infinite}.cni-b2{animation-delay:.25s}.cni-b3{animation-delay:.5s}@keyframes cniB{50%{transform:scaleY(.72)}}
.cni-aim{transform-origin:16px 15px;animation:cniA 4s linear infinite}@keyframes cniA{to{transform:rotate(360deg)}}
.cni-spin{transform-origin:16px 16px;animation:cniS 6s linear infinite}@keyframes cniS{to{transform:rotate(360deg)}}
.cni-flap{transform-origin:16px 10px;animation:cniF 2.4s ease-in-out infinite}@keyframes cniF{50%{transform:scaleY(.7)}}
.cni-ping{animation:cniG 1.4s infinite}@keyframes cniG{50%{opacity:.25}}
@media (prefers-reduced-motion:reduce){.cnv *{animation:none!important}}
.cnv-ring{--v:70;display:inline-grid;place-items:center;width:30px;height:30px;border-radius:50%;background:conic-gradient(#c9f23a calc(var(--v)*1%),rgba(255,255,255,.14) 0);flex:0 0 auto}
.cnv-ring b{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#0b1520;font-size:11px;font-style:normal}.cnv-ring.big{width:40px;height:40px}.cnv-ring.big b{width:33px;height:33px;font-size:14px}
.cnv-offers-head{display:flex;justify-content:space-between;align-items:center;margin:0 0 6px;font-size:13px}
.cnv-offers{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.cnv-offer{display:grid;gap:3px;align-content:start;text-align:center;padding:8px;border:1px solid var(--cn-line);border-radius:12px;background:var(--cn-card);min-width:0}
.cnv-offer.hot{border-color:#c9f23a}.cnv-offer.lock{border-color:#8a6a1a;background:rgba(217,162,26,.07)}
.cnv-offer>b{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cnv-offer-top{display:flex;align-items:center;justify-content:center;gap:8px;margin:2px 0}.cnv-offer-top img,.cnv-offer-top .big{width:46px;height:46px;object-fit:contain}
.cnv-tit{display:grid;gap:1px;font-size:10.5px}.cnv-offer p{margin:0;font-size:10px;color:var(--cn-mut);line-height:1.3}
.cnv-act{display:flex;align-items:center;justify-content:center;gap:5px;flex-wrap:wrap;margin-top:3px}.cnv-lock{font-size:11px;font-weight:700;color:#e0a21a}
.cnv-tabs{display:flex;border:1px solid var(--cn-line);border-radius:10px;overflow:hidden;margin:0 0 6px}
.cnv-tabs button{flex:1;padding:6px;border:0;border-bottom:3px solid transparent;background:none;color:var(--cn-mut);font:inherit;font-size:12px;font-weight:700;cursor:pointer;min-height:0!important}.cnv-tabs button.on{color:#c9f23a;border-bottom-color:#c9f23a}.cnv-tabs i{font-style:normal;background:#ff4d5e;color:#fff;border-radius:8px;padding:0 5px;font-size:10px}
.cnv-kpis{display:flex;justify-content:space-around;align-items:center;margin:4px 0 8px;text-align:center}.cnv-kpis small{display:block;color:var(--cn-mut);font-size:10px;margin-bottom:2px}.cnv-kpis b{font-size:16px}
.cnv-keys{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-bottom:8px}
.cnv-key{padding:7px 9px;border:1px solid #5b47c8;border-radius:10px;background:var(--cn-card);min-width:0}.cnv-key>b{display:block;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cnv-key>small{display:block;color:var(--cn-grass);font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cnv-key div{display:flex;align-items:center;justify-content:space-around;margin-top:4px}.cnv-key span{text-align:center;font-weight:800;font-size:13px}.cnv-key span small{display:block;font-size:8.5px;color:var(--cn-mut)}.cnv-key em{font-style:normal;color:#ff8a93}
.cnv-pc{display:grid;grid-template-columns:1fr 1fr;gap:14px}.cnv-li{display:flex;gap:8px;align-items:flex-start;padding:5px 0;border-bottom:1px solid var(--cn-line);font-size:11.5px}.cnv-li i{font-style:normal;font-weight:900;flex:0 0 14px}.cnv-li i.ok{color:#5fd68a}.cnv-li i.no{color:#ff5a67}
.cnv-opp{display:grid;grid-template-columns:150px minmax(0,1.2fr) minmax(0,1fr);gap:8px;align-items:start}
.cnv-opp aside:first-child{display:grid;gap:6px;justify-items:center;text-align:center}.cnv-opp aside:first-child img{width:60px;height:60px;object-fit:contain}.cnv-opp-r{display:grid;justify-items:center;gap:2px}.cnv-opp-r small{color:var(--cn-mut);font-size:10px}.cnv-opp-r2{display:grid;gap:6px}
.cnv-pitch{position:relative;height:min(300px,calc(100dvh - 120px));min-height:220px;border-radius:12px;border:2px solid #8fd48a;background:repeating-linear-gradient(0deg,#1f6b2c 0 34px,#247a32 34px 68px);overflow:hidden}
.cnv-dot{position:absolute;transform:translate(-50%,-50%);display:grid;justify-items:center;gap:1px}.cnv-dot em{font-style:normal;font-size:9px;font-weight:700;background:rgba(11,21,32,.85);padding:0 5px;border-radius:3px;white-space:nowrap}
.cnv-add{position:absolute;inset:0;z-index:20;display:grid;grid-template-rows:auto minmax(0,1fr);gap:6px;padding:8px;border:1px solid #284257;border-radius:14px;background:#0a141f;box-shadow:0 0 0 100vmax rgba(0,0,0,.55)}
.cnv-add header{display:flex;justify-content:space-between;align-items:center;font-weight:800;letter-spacing:.1em;font-size:12px}
.cnv-add-body{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.3fr);gap:8px;min-height:0}.cnv-add-body>section{overflow:auto;min-height:0}
.cnv-add-f{display:grid;gap:6px;align-content:start}.cnv-add label{display:grid;gap:2px;font-size:10px;color:var(--cn-mut)}
.cnv-add input[type=search],.cnv-add input[type=number]{min-height:0!important;height:28px;padding:0 6px;border:1px solid var(--cn-line);background:var(--cn-bg);color:var(--cn-text);border-radius:6px;font:inherit;font-size:12px;width:100%;box-sizing:border-box}
.cnv-add-n{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.cnv-chk{display:flex!important;align-items:center;gap:6px}
.cnv-add .cn-pl b,.cnv-add .cn-pl small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cnv-chk input{width:16px!important;height:16px!important;min-height:0!important;min-width:0!important;padding:0!important;flex:0 0 16px}
.cnv-add-b{display:grid;grid-template-columns:1fr 2fr;gap:6px}
@media (max-width:700px){.cnv-offers{grid-template-columns:repeat(2,minmax(0,1fr))}.cnv-opp{grid-template-columns:1fr}.cnv-keys{grid-template-columns:1fr}}
@media (max-height:430px){.cnv{grid-template-columns:56px minmax(0,1fr)}.cnv-rail button{padding:3px 2px 2px!important;font-size:9px!important}.cnv-ic svg{width:19px;height:19px}.cnv-offer{padding:5px 6px}.cnv-offer-top img,.cnv-offer-top .big{width:36px;height:36px}.cnv-pitch{height:calc(100dvh - 100px)}}
</style>`;}

  const pager=(key,total,size)=>{
    const pages=Math.max(1,Math.ceil(total/size));if(ui.page[key]>=pages)ui.page[key]=pages-1;if(ui.page[key]<0)ui.page[key]=0;
    if(pages<2)return "";
    const p=ui.page[key];
    return `<nav class="cn-pager" aria-label="Páginas"><button type="button" data-cn-page="${key}:${p-1}" ${p<=0?"disabled":""} aria-label="Página anterior">‹</button><span>${p+1} / ${pages}</span><button type="button" data-cn-page="${key}:${p+1}" ${p>=pages-1?"disabled":""} aria-label="Próxima página">›</button></nav>`;
  };
  const slice=(key,list,size)=>{const pages=Math.max(1,Math.ceil(list.length/size));if(ui.page[key]>=pages)ui.page[key]=pages-1;if(ui.page[key]<0)ui.page[key]=0;return list.slice(ui.page[key]*size,(ui.page[key]+1)*size);};

  function head(o){
    if(!o.team)return `<header class="cn-head"><div class="grow"><h2>Seleções</h2><p>Você não comanda nenhuma seleção. Candidate-se ou espere um convite da confederação.</p></div><div class="cn-meter"><b>${o.rep}</b><small>sua reputação</small></div></header>`;
    return `<header class="cn-head">${crest(o.team.code,o.team.name)}<div class="grow"><h2>Seleção de ${esc(o.team.name)}</h2><p>${esc(o.team.confederation||"")} · ${esc(o.formation)} · ${o.called}/${o.max} convocados${o.record&&o.record.p?` · ${o.record.v}V ${o.record.e}E ${o.record.d}D`:""}${(o.titles||[]).length?` · ${(o.titles||[]).length} título(s)`:""}</p></div><div class="cn-meter"><b>${o.board}%</b><small>confiança da confederação</small></div></header>`;
  }
  function tabsFor(o){return o.team?[["geral","Visão geral"],["escalacao","Escalação"],["convocacao","Convocação"],["taticas","Táticas"],["relat","Relatórios"],["oposicao","Oposição"],["elim","Eliminatórias"],["copa","Copa do Mundo"],["torneios","Torneios"],["calendario","Calendário"],["selecoes","Seleções"]]:[["convites","Convites"],["selecoes","Seleções"]];}

  function resultLine(m){
    return `<div class="cn-row"><div class="who"><span class="cn-res ${esc(m.result)}">${esc(m.result)}</span><span><b>${m.home?"":"@ "}${esc(m.opponent)} · ${m.gf} × ${m.ga}</b><small>Dia ${m.day} · ${esc(m.competition)}${m.scorers?.length?" · "+esc([...new Set(m.scorers.map(x=>x.name.split(" ").slice(-1)[0]))].join(", ")):""}</small></span></div></div>`;
  }
  function fixtureLine(m,day){
    const left=m.day-day;
    return `<div class="cn-row"><div class="who">${flag(m.opponentCode,m.opponent)}<span><b>${m.home?"":"@ "}${esc(m.opponent)}</b><small>${esc(m.competition)} · ${m.home?"em casa":"fora"}</small></span></div><div class="end"><span class="cn-tag">Dia ${m.day}${left>=0?` · em ${left}d`:""}</span></div></div>`;
  }

  function geral(o,S){
    const next=o.fixtures[0],r=o.record,boardTone=o.board<30?"bad":o.board<50?"warn":"";
    const scorers=(o.scorers||[]).map(x=>`<div class="cn-row"><div class="who"><span><b>${esc(x.name)}</b><small>${esc(x.pos)} · ${x.caps} jogos</small></span></div><div class="end"><span class="cn-tag ok">${x.goals} gols</span></div></div>`).join("")||'<p class="cn-note">Nenhum gol marcado ainda.</p>';
    const leave=ui.confirmLeave
      ?`<p class="cn-note">Deixar o cargo? Você só poderá assumir outra seleção depois de 60 dias.</p><button type="button" class="cn-btn danger" data-cn-act="resign">Confirmar saída</button> <button type="button" class="cn-btn" data-cn-act="leave-cancel">Cancelar</button>`
      :`<button type="button" class="cn-btn danger" data-cn-act="leave-ask">Deixar o cargo</button>`;
    return `<div class="cn-grid">
      <section class="cn-card"><small>PRÓXIMO JOGO</small>${next?`<h3>${next.home?"":"@ "}${esc(next.opponent)}</h3><p>${esc(nolbl(next.competition))} · dia ${next.day} (em ${Math.max(0,next.day-o.day)} dias)</p><p>Força do seu time ${o.power} · adversário ${o.nations.find(n=>n.code===next.opponentCode)?.strength??"—"}</p>`:'<p class="cn-note">Sem jogos marcados.</p>'}</section>
      <section class="cn-card"><small>CAMPANHA</small><div class="cn-rec"><div><b>${r.v}</b><small>V</small></div><div><b>${r.e}</b><small>E</small></div><div><b>${r.d}</b><small>D</small></div><div><b>${r.gf}–${r.ga}</b><small>gols</small></div></div><div class="cn-bar ${boardTone}"><i style="width:${o.board}%"></i></div><p>Confiança da confederação: ${o.board}%. Abaixo de 15% o contrato é encerrado.</p></section>
      <section class="cn-card"><small>ARTILHEIROS</small>${scorers}</section>
      <section class="cn-card"><small>CARGO</small><p>Você acumula a seleção com o clube. Os jogos acontecem nas datas FIFA e usam a convocação e a formação que você definiu.</p>${leave}</section>
    </div>`;
  }

  function callupBanner(o){
    const c=o.callup;if(!c)return "";
    if(c.status==="none")return `<section class="cn-card cn-call"><small>CONVOCAÇÃO</small><p>${esc(c.note)}</p></section>`;
    const d=c.daysLeft;
    const msg={
      waiting:`<b>Ainda não abriu.</b> Abre no dia ${c.opens}; jogos a partir do dia ${c.first}. A lista abaixo é a anterior e não pode ser alterada.`,
      open:`<b>Aberta.</b> ${esc(nolbl(c.label))}: confirme até o dia ${c.deadline} (${d} ${d===1?"dia":"dias"}); jogos a partir do dia ${c.first}.${c.firstList?" A primeira lista foi montada automaticamente.":" Sem confirmação no prazo, a confederação convoca o rascunho e a diretoria cobra."}`,
      confirmed:`<b>Confirmada.</b> ${esc(nolbl(c.label))}: ainda dá para ajustar até o dia ${c.deadline}; jogos a partir do dia ${c.first}.`,
      closed:`<b>Fechada.</b> ${esc(nolbl(c.label))}: só dá para substituir lesionados ou suspensos; jogos a partir do dia ${c.first}.`
    }[c.status]||"";
    const ok=(c.status==="open"||c.status==="confirmed")&&o.called>=c.min;
    const btn=(c.status==="open"||c.status==="confirmed")?`<button type="button" class="cn-btn go" data-cn-act="confirm" ${ok?"":"disabled"}>${c.status==="confirmed"?"Reconfirmar":"Confirmar lista"}</button>`:"";
    return `<section class="cn-card cn-call"><p>${msg}</p>${btn}</section>`;
  }
  const byId=o=>new Map(o.players.map(p=>[p.id,p]));
  const chip=(p,o,extra="")=>`<button type="button" class="cn-xi ${ui.xiSel===p.id?"sel":""} ${p.available?"":"out"}" data-cn-xi="${esc(p.id)}" title="${esc(p.name)} · ${esc(p.club)}"><i>${p.overall}</i><b>${esc(String(p.name).split(" ").slice(-1)[0])}</b><small>${esc(p.code||p.pos)}${o.captain===p.id?" · C":o.vice===p.id?" · V":""}${extra}</small></button>`;
  function escalacao(o){
    const m=byId(o),L=o.lineup,st=L.starters.map(id=>m.get(id)).filter(Boolean),bn=L.bench.map(id=>m.get(id)).filter(Boolean);
    const sl=new Map((L.slots||[]).map(x=>[x.id,x]));
    const rows=st.map(p=>{const x=sl.get(p.id)||{x:50,y:50,code:p.code,fit:1,ovr:p.overall};const off=x.fit<.99;
      return `<button type="button" class="cn-xi cn-at ${ui.xiSel===p.id?"sel":""} ${p.available?"":"out"} ${off?"off":""}" style="left:${x.x}%;top:${x.y}%" data-cn-xi="${esc(p.id)}" title="${esc(p.name)} · ${esc(p.club)}${off?" · fora de posição (natural: "+esc(p.code)+")":""}"><i>${x.ovr}</i><b>${esc(String(p.name).split(" ").slice(-1)[0])}</b><small>${esc(x.code)}${o.captain===p.id?" · C":o.vice===p.id?" · V":""}${off?" ·"+esc(p.code):""}</small></button>`;}).join("");
    const sel=ui.xiSel&&m.get(ui.xiSel);
    const hint=sel?(L.starters.includes(sel.id)?`<b>${esc(sel.name)}</b> selecionado. Toque em um reserva para ele entrar no lugar.`:`<b>${esc(sel.name)}</b> selecionado. Toque em um titular para trocar.`):"Toque em um titular e depois em um reserva para trocar.";
    const bench=bn.map(p=>chip(p,o)).join("");
    return `<div class="cn-tools"><label>Formação <select data-cn-formation>${o.formations.map(f=>`<option ${f===o.formation?"selected":""}>${esc(f)}</option>`).join("")}</select></label><button type="button" class="cn-btn" data-cn-act="autoxi" ${L.manual?"":"disabled"}>XI automático</button><span class="cn-tag ${L.manual?"st":"ok"}">${L.manual?"XI manual":"XI automático"}</span><span class="cn-tag">Força ${o.power}</span></div>
    <p class="cn-note">${hint}</p>
    <div class="cn-xi-wrap"><section class="cn-card cn-pitch" aria-label="Titulares"><div class="cn-field" aria-hidden="true"></div>${rows}</section><section class="cn-card"><small>RESERVAS · ${bn.length}</small><div class="cn-xi-bench">${bench||'<div class="cn-empty">Sem reservas.</div>'}</div></section></div>`;
  }
  function taticas(o){
    const T=o.tactics,m=byId(o),called=o.players.filter(p=>p.called).sort((a,b)=>b.overall-a.overall);
    const sel=(key,map,cur)=>`<label>${key[1]}<select data-cn-tactic="${key[0]}">${Object.entries(map).map(([k,v])=>`<option value="${k}" ${k===cur?"selected":""}>${esc(v)}</option>`).join("")}</select></label>`;
    const opts=sel=>called.filter(p=>p.pos!=="GOL"||false).map(p=>`<option value="${esc(p.id)}" ${p.id===sel?"selected":""}>${esc(p.name)} · ${esc(p.pos)} · ${p.overall}</option>`).join("");
    return `<div class="cn-grid"><section class="cn-card"><small>MODELO DE JOGO DA SELEÇÃO</small><div class="cn-form">${sel(["style","Estilo"],T.styles,T.style)}${sel(["pressing","Pressão"],T.pressings,T.pressing)}${sel(["buildup","Construção"],T.buildups,T.buildup)}</div><p class="cn-note">Ofensivo marca e sofre mais; contra-ataque e posse reduzem o risco. O efeito é moderado, como no clube.</p></section>
    <section class="cn-card"><small>HIERARQUIA</small><div class="cn-form"><label>Capitão<select data-cn-leader="captain">${opts(o.captain)}</select></label><label>Vice-capitão<select data-cn-leader="vice">${opts(o.vice)}</select></label></div><p class="cn-note">Capitão e vice entram na lista de convocados e aparecem como C e V na escalação.</p></section></div>`;
  }
  function relatOld(o){
    const r=o.record,pl=o.players.filter(p=>p.called);
    const top=(k,t)=>pl.filter(p=>p[k]>0).sort((a,b)=>b[k]-a[k]||b.overall-a.overall).slice(0,6).map(p=>`<div class="cn-row"><div class="who"><span><b>${esc(p.name)}</b><small>${esc(p.pos)} · ${esc(p.club)}</small></span></div><div class="end"><span class="cn-tag ok">${p[k]} ${t}</span></div></div>`).join("")||'<div class="cn-empty">Sem registros ainda.</div>';
    const byPos=["GOL","DEF","MEI","ATA"].map(g=>{const l=pl.filter(p=>p.pos===g);const avg=l.length?Math.round(l.reduce((a,p)=>a+p.overall,0)/l.length):0;return `<div class="cn-row"><span><b>${POS_LABEL[g]}</b><small>${l.length} convocados</small></span><span class="cn-tag">GER médio ${avg}</span></div>`;}).join("");
    return `<div class="cn-grid"><section class="cn-card"><small>CAMPANHA</small><div class="cn-rec"><div><b>${r.v}</b><small>V</small></div><div><b>${r.e}</b><small>E</small></div><div><b>${r.d}</b><small>D</small></div><div><b>${r.gf}–${r.ga}</b><small>gols</small></div></div></section><section class="cn-card"><small>MAIS JOGOS PELA SELEÇÃO</small>${top("caps","jogos")}</section><section class="cn-card"><small>ARTILHARIA</small>${top("goals","gols")}</section><section class="cn-card"><small>FORÇA POR SETOR</small>${byPos}</section></div>`;
  }
  function convocacao(o,S){
    const inP=ui.swapIn&&o.players.find(x=>x.id===ui.swapIn&&!x.called);
    if(inP){
      const called=o.players.filter(x=>x.called).sort((a,b)=>Number(b.pos===inP.pos)-Number(a.pos===inP.pos)||b.overall-a.overall);
      const rows=called.map(x=>`<div class="cn-pl"><span class="cn-ovr ${x.overall>=82?"hi":""}">${x.overall}</span><span><b style="display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(x.name)}</b><small style="color:var(--cn-mut);font-size:11px">${esc(x.pos)} · ${esc(x.club)} · ${x.age} anos${x.starter?" · titular":""}</small></span><span>${x.pos===inP.pos?'<span class="cn-tag ok">Mesma posição</span>':""}</span><button type="button" class="cn-btn go" data-cn-swap-out="${esc(x.id)}">Substituir</button></div>`).join("");
      return `<section class="cn-card"><div class="cn-tools"><span><b>${esc(inP.name)}</b> <small style="color:var(--cn-mut)">${esc(inP.code||inP.pos)} · GER ${inP.overall} · ${esc(inP.club)}</small></span><button type="button" class="cn-btn" data-cn-swap-cancel>Cancelar</button></div><p style="margin:6px 0">A lista está cheia. Escolha quem sai para ${esc(inP.name)} entrar.</p>${rows}</section>`;
    }
    const list=o.players.filter(p=>ui.pos==="TODOS"||p.pos===ui.pos).sort((a,b)=>Number(b.called)-Number(a.called)||b.overall-a.overall);
    const rows=slice("players",list,S.players).map(p=>`<div class="cn-pl"><span class="cn-ovr ${p.overall>=82?"hi":""}">${p.overall}</span><span><b style="display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.name)}</b><small style="color:var(--cn-mut);font-size:11px">${esc(p.code||p.pos)} · ${esc(p.club)} · ${p.age} anos${p.caps?` · ${p.caps} jogos`:""}</small></span><span>${p.starter?'<span class="cn-tag st">Titular</span>':p.called?'<span class="cn-tag ok">Convocado</span>':!p.available?'<span class="cn-tag no">Indisponível</span>':""}</span>${(!p.called&&o.players.filter(x=>x.called).length>=26)?`<button type="button" class="cn-btn go" data-cn-swap-in="${esc(p.id)}" ${p.available?"":"disabled"}>Trocar</button>`:`<button type="button" class="cn-btn ${p.called?"":"go"}" data-cn-toggle="${esc(p.id)}" ${!p.available&&!p.called?"disabled":""}>${p.called?"Dispensar":"Convocar"}</button>`}</div>`).join("")||'<div class="cn-empty">Nenhum jogador nesta posição.</div>';
    const cl=o.players.filter(p=>p.called),cntOf=g=>cl.filter(p=>p.pos===g).length,QT={GOL:[2,3],DEF:[0,9],MEI:[0,9],ATA:[0,8]};
    const chip=(k,lab)=>`<button type="button" class="${ui.pos===k?"on":""}" data-cn-pos="${k}">${lab}</button>`;
    return `${callupBanner(o)}<div class="cn-tools"><button type="button" class="cn-btn go" data-cn-addopen>+ Adicionar jogadores</button><button type="button" class="cn-btn" data-cn-act="auto" ${o.manual?"":"disabled"}>Convocação automática</button><span class="cn-tag ${o.manual?"st":"ok"}">${o.manual?"Lista manual":"Automática"}</span><span class="cn-tag ${o.called<18?"no":""}">${o.called}/${o.max}${o.called<18?" · mínimo 18":""}</span><span class="cn-chips" role="group" aria-label="Filtrar por posição" style="margin:0">${chip("TODOS","Todos")}${["GOL","DEF","MEI","ATA"].map(g=>chip(g,esc(POS_LABEL[g])+" "+cntOf(g))).join("")}</span></div>
      <section class="cn-card cn-list2" style="margin-top:8px;padding-top:4px">${rows}${pager("players",list.length,S.players)}</section>`;
  }

  function elim(o,S){
    const q=o.qual;
    if(!q||q.kind==="none")return `<section class="cn-card"><small>ELIMINATÓRIAS</small><div class="cn-empty">${esc(q?.note||"Sem eliminatórias em andamento.")}</div></section>`;
    if(q.kind==="allocation")return `<section class="cn-card"><small>ELIMINATÓRIAS · COPA ${q.year}</small><div class="cn-empty">${esc(q.note)}</div></section>`;
    const table=slice("qtable",q.table,(isPhone()?S.results:10)).map(r=>`<div class="cn-row" ${r.me?'style="color:var(--cn-gold)"':""}><div class="who"><span class="cn-code">${r.pos}</span><span><b>${esc(r.name)}</b><small>${r.j} jogos · saldo ${r.sg>0?"+":""}${r.sg}${r.zone?" · "+esc(r.zone):""}</small></span></div><div class="end"><span class="cn-tag ${r.me?"st":""}">${r.p} pts</span></div></div>`).join("");
    const status=q.complete?(q.qualified===true||(q.qualified&&!q.groupMode)?"Classificada para a Copa":q.groupMode?(q.qualified===false?"Eliminada das eliminatórias":q.playoff?"Na repescagem: o jogo decide a vaga":"Eliminada das eliminatórias"):q.playoff?"Na repescagem":"Eliminada"):`${q.directSpots} ${q.directSpots===1?"vaga direta":"vagas diretas"} + repescagem`;
    const games=slice("qgames",q.fixtures,S.results).map(m=>`<div class="cn-row"><div class="who"><span><b>${esc(m.home)} ${m.played?`${m.hg} × ${m.ag}`:"×"} ${esc(m.away)}</b><small>${typeof m.round==="number"?"Rodada "+m.round:esc(m.round)} · dia ${m.day}${m.played?"":" · a disputar"}</small></span></div></div>`).join("");
    return `<div class="cn-grid"><section class="cn-card"><small>${esc(q.title||"CLASSIFICAÇÃO")} · COPA ${q.year}</small>${table}${pager("qtable",q.table.length,(isPhone()?S.results:10))}<p class="cn-note">${esc(status)}</p></section><section class="cn-card"><small>SEUS JOGOS</small>${games}${pager("qgames",q.fixtures.length,S.results)}</section></div>`;
  }

  function torneios(o,S){
    const T=o.tours||{live:[],done:[]};
    const live=T.live.map(x=>`<div class="cn-row"><div class="who"><span><b>${esc(x.name)} ${x.year}</b><small>${x.playing?"Sua seleção participa":"Sua seleção não participa"}</small></span></div><div class="end"><span class="cn-tag ${x.playing?"st":""}">${x.playing?"Disputando":"Fora"}</span></div></div>`).join("")||'<div class="cn-empty">Nenhum torneio em andamento.</div>';
    const done=slice("tour",T.done,S.results).map(x=>`<div class="cn-row"><div class="who"><span><b>${esc(x.name)} ${x.year}</b><small>${esc(x.champion||"—")}${x.runnerUp?" · vice "+esc(x.runnerUp):""}</small></span></div>${x.mine?`<div class="end"><span class="cn-tag st">${esc(x.mine)}</span></div>`:""}</div>`).join("")||'<div class="cn-empty">Ainda sem edições encerradas.</div>';
    return `<div class="cn-grid"><section class="cn-card"><small>EM ANDAMENTO</small>${live}<p class="cn-note">Nestes torneios o resultado da sua seleção é simulado pelo mundo, sem convocação sua.</p></section><section class="cn-card"><small>CAMPEÕES</small>${done}${pager("tour",T.done.length,S.results)}</section></div>`;
  }

  function copa(o,S){
    const c=o.cup;
    if(!c||!c.available)return `<section class="cn-card"><small>COPA DO MUNDO</small><div class="cn-empty">${esc(c?.note||"Sem Copa do Mundo em andamento.")}</div></section>`;
    if(!c.qualified)return `<section class="cn-card"><small>COPA DO MUNDO ${c.year}</small><div class="cn-empty">${esc(c.note)}</div></section>`;
    const table=c.table.map(r=>`<div class="cn-row" ${r.me?'style="color:var(--cn-gold)"':""}><div class="who"><span class="cn-code">${r.pos}</span><span><b>${esc(r.name)}</b><small>${r.j} jogos · saldo ${r.sg>0?"+":""}${r.sg}</small></span></div><div class="end"><span class="cn-tag ${r.me?"st":""}">${r.p} pts</span></div></div>`).join("");
    const games=[...c.matches,...c.knockout];
    const rows=slice("cup",games,S.results).map(m=>`<div class="cn-row"><div class="who"><span><b>${esc(m.home)} ${m.played?`${m.hg} × ${m.ag}`:"×"} ${esc(m.away)}</b><small>${esc(m.phase)}${m.pens?" · "+esc(m.pens):""}${m.played?"":" · a disputar"}</small></span></div></div>`).join("")||'<div class="cn-empty">Sem jogos.</div>';
    return `<div class="cn-grid"><section class="cn-card"><small>GRUPO ${esc(c.group)} · COPA ${c.year}</small>${table}<p class="cn-note">${esc(c.phaseLabel||c.status)}</p></section><section class="cn-card"><small>JOGOS DA SUA SELEÇÃO</small>${rows}${pager("cup",games.length,S.results)}</section></div>`;
  }

  function calendario(o,S){
    const fx=slice("fixtures",o.fixtures,S.fixtures).map(m=>fixtureLine(m,o.day)).join("")||'<div class="cn-empty">Sem jogos marcados.</div>';
    const rs=slice("results",o.results,S.results).map(resultLine).join("")||'<div class="cn-empty">Nenhum jogo disputado ainda.</div>';
    return `<div class="cn-grid"><section class="cn-card"><small>PRÓXIMOS JOGOS</small>${fx}${pager("fixtures",o.fixtures.length,S.fixtures)}</section><section class="cn-card"><small>RESULTADOS</small>${rs}${pager("results",o.results.length,S.results)}</section></div>`;
  }

  // Ficha da seleção escolhida: títulos, histórico, escalação provável e competições por ano.
  function ficha(){
    if(!ui.nation||!ctx.s)return "";
    let f=null;try{f=CN().nationProfile(ctx.s,ctx.D,ui.nation,ui.year);}catch(e){f=null;}
    if(!f)return "";
    const titles=f.titles.length?f.titles.map(t=>`<div class="cn-row"><b>${esc(t.name)}</b><span class="cn-tag ok">${t.count}×</span></div>`).join(""):'<div class="cn-empty">Nenhum título registrado.</div>';
    const vice=f.finals.length?f.finals.map(t=>`<div class="cn-row"><span>${esc(t.name)} · finais perdidas</span><span class="cn-tag">${t.count}×</span></div>`).join(""):"";
    const hist=f.history.slice(0,6).map(h=>`<div class="cn-row"><span><b>${esc(h.name)}</b> <small>${h.year}</small></span><span class="cn-tag ${h.result==="Campeã"?"ok":""}">${esc(h.result)}</span></div>`).join("")||'<div class="cn-empty">A história no jogo começa em 2026. Os títulos mundiais acima já contam as conquistas reais.</div>';
    const lines=["ATA","MEI","DEF","GOL"].map(pos=>{const ps=f.starters.filter(p=>p.pos===pos);return ps.length?`<div class="cn-line"><small>${pos}</small><div class="cn-ps">${ps.map(p=>`<span><b>${esc(p.name)}</b> <small>${p.overall}</small></span>`).join("")}</div></div>`:"";}).join("");
    const yrs=f.years.slice(0,8).map(y=>`<button type="button" class="cn-btn ${y===f.year?"go":""}" data-cn-year="${y}">${y}</button>`).join(" ");
    const comps=f.comps.length?f.comps.map(c=>`<div class="cn-row"><span><b>${esc(c.name)}</b><small>${esc(c.status)}${c.champion?" · campeã: "+esc(c.champion):""}</small></span><span class="cn-tag ${c.mine==="Campeã"?"ok":""}">${esc(c.mine||"—")}</span></div>`).join(""):'<div class="cn-empty">Nenhuma competição de seleções registrada neste ano.</div>';
    return `<section class="cn-card" data-cn-ficha><small>FICHA DA SELEÇÃO</small><div class="cn-row"><div class="who">${flag(f.code,f.name)}<span><b>${esc(f.name)}</b><small>${esc(f.confederation||"")} · ${f.rank}º de ${f.total} em força (${f.strength}) · reputação ${f.need}+</small></span></div><div class="end"><button type="button" class="cn-btn" data-cn-nation="${esc(f.code)}">Fechar ficha</button></div></div>
<div class="cn-grid"><section class="cn-card"><small>TÍTULOS</small>${titles}${vice}</section><section class="cn-card"><small>HISTÓRIA</small>${hist}</section><section class="cn-card"><small>ESCALAÇÃO PROVÁVEL · ${esc(f.formation)}</small>${lines||'<div class="cn-empty">Elenco indisponível.</div>'}</section><section class="cn-card"><small>COMPETIÇÕES EM ${f.year}</small><div class="cn-sub">${yrs}</div>${comps}</section></div></section>`;
  }

  function selecoes(o,S){
    const rows=slice("nations",o.nations,S.nations).map(n=>{
      const act=n.current?'<span class="cn-tag ok">Seu cargo</span>':o.team?'<span class="cn-tag">—</span>':o.applications.some(a=>a.code===n.code)?'<span class="cn-tag">Em análise</span>':(o.rejected[n.code]>o.day)?`<span class="cn-tag no">Recusou · volte no dia ${o.rejected[n.code]}</span>`:n.eligible?`<button type="button" class="cn-btn go" data-cn-apply="${esc(n.code)}">Candidatar-se</button>`:`<span class="cn-tag no">Exige reputação ${n.need}</span>`;
      return `<div class="cn-row"><div class="who">${flag(n.code,n.name)}<span><b>${esc(n.name)}</b><small>${esc(n.confederation||"")} · força ${n.strength} · reputação ${n.need}+</small></span></div><div class="end">${act}<button type="button" class="cn-btn" data-cn-nation="${esc(n.code)}">${ui.nation===n.code?"Fechar ficha":"Ver ficha"}</button></div></div>`;
    }).join("");
    return `${ficha()}<section class="cn-card"><small>SELEÇÕES DISPONÍVEIS</small>${rows}${pager("nations",o.nations.length,S.nations)}${o.team?'<p class="cn-note">Para trocar de seleção, deixe o cargo atual na Visão geral.</p>':""}</section>`;
  }

  function convitesOld(o,S){
    const offers=o.offers.map(of=>`<div class="cn-row"><div class="who">${flag(of.code,of.name)}<span><b>${esc(of.name)}</b><small>Responder até o dia ${of.expires} (${Math.max(0,of.expires-o.day)} dias)</small></span></div><div class="end"><button type="button" class="cn-btn go" data-cn-accept="${esc(of.code)}">Aceitar</button><button type="button" class="cn-btn" data-cn-decline="${esc(of.code)}">Recusar</button></div></div>`).join("");
    const apps=o.applications.map(a=>`<div class="cn-row"><div class="who">${flag(a.code,a.name)}<span><b>${esc(a.name)}</b><small>Candidatura em análise · resposta até o dia ${a.decideDay} (${Math.max(0,a.decideDay-o.day)} dias)</small></span></div><div class="end"><span class="cn-tag">Em análise</span></div></div>`).join("");
    const wait=o.day<o.cooldownUntil?`<p class="cn-note">A confederação só aceita novos treinadores a partir do dia ${o.cooldownUntil}.</p>`:"";
    return `<div class="cn-grid"><section class="cn-card"><small>CONVITES RECEBIDOS</small>${offers||'<div class="cn-empty">Nenhum convite no momento.<br>Convites chegam a cada ~2 meses quando a sua reputação alcança a de alguma seleção.</div>'}${wait}</section>${apps?`<section class="cn-card"><small>CANDIDATURAS ENVIADAS</small>${apps}</section>`:""}<section class="cn-card"><small>COMO FUNCIONA</small><p>Ao se candidatar, a confederação analisa o seu currículo contra outros candidatos e responde em 1 a 2 semanas: você recebe um convite para aceitar ou a recusa. Cada seleção exige uma reputação mínima (você tem ${o.rep}). Ganhe jogos com o clube e com a seleção para subir.</p><p>Os jogos acontecem nas 4 janelas FIFA do ano. A confiança da confederação cai com derrotas; abaixo de 15% você é demitido.</p></section></div>`;
  }


  // ---------- Novo menu lateral (grupos de abas) ----------
  const ICON_DEFS='<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="cni1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6ff7a"/><stop offset="1" stop-color="#8fc01c"/></linearGradient><linearGradient id="cni2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bfe9ff"/><stop offset="1" stop-color="#4aa3ff"/></linearGradient><linearGradient id="cni3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe9a0"/><stop offset="1" stop-color="#e0a21a"/></linearGradient></defs></svg>';
  const ICONS={
    geral:'<svg viewBox="0 0 32 32"><path d="M7 3v26" stroke="url(#cni3)" stroke-width="3" stroke-linecap="round"/><path class="cni-wave" d="M9 5h16l-3 5 3 5H9z" fill="url(#cni1)"/></svg>',
    plantel:'<svg viewBox="0 0 32 32"><circle cx="16" cy="10" r="5" fill="url(#cni1)"/><path d="M6 27c0-6 4-10 10-10s10 4 10 10z" fill="url(#cni1)"/><circle class="cni-pop" cx="6" cy="12" r="3.2" fill="url(#cni2)"/><circle class="cni-pop2" cx="26" cy="12" r="3.2" fill="url(#cni2)"/></svg>',
    relat:'<svg viewBox="0 0 32 32"><rect x="6" y="4" width="20" height="25" rx="3" fill="url(#cni2)"/><rect x="11" y="2" width="10" height="5" rx="2" fill="url(#cni3)"/><path class="cni-check" d="M10 16l4 4 8-8" fill="none" stroke="#0a1620" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    stats:'<svg viewBox="0 0 32 32"><rect class="cni-b1" x="5" y="16" width="6" height="12" rx="1.5" fill="url(#cni2)"/><rect class="cni-b2" x="13" y="8" width="6" height="20" rx="1.5" fill="url(#cni1)"/><rect class="cni-b3" x="21" y="12" width="6" height="16" rx="1.5" fill="url(#cni3)"/></svg>',
    opo:'<svg viewBox="0 0 32 32"><path d="M16 3l11 4v8c0 7-5 11-11 14C10 26 5 22 5 15V7z" fill="url(#cni2)"/><g class="cni-aim" fill="none" stroke="#0a1620" stroke-width="2"><circle cx="16" cy="15" r="5"/><path d="M16 7v4M16 19v4M8 15h4M20 15h4"/></g></svg>',
    selecoes:'<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="url(#cni2)"/><g class="cni-spin" fill="none" stroke="#0a1620" stroke-opacity=".45" stroke-width="1.4"><ellipse cx="16" cy="16" rx="5" ry="12"/><path d="M4 16h24M6 10h20M6 22h20"/></g></svg>',
    ofertas:'<svg viewBox="0 0 32 32"><rect x="4" y="8" width="24" height="17" rx="3" fill="url(#cni1)"/><path class="cni-flap" d="M5 10l11 8 11-8" fill="none" stroke="#0a1620" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle class="cni-ping" cx="26" cy="8" r="3.4" fill="#ff4d5e"/></svg>'
  };
  const GROUPS_TEAM=[["geral","Seleção",["geral"]],["plantel","Plantel",["convocacao","escalacao","taticas"]],["relat","Relatórios",["relat"]],["stats","Estatísticas",["calendario","elim","copa","torneios"]],["opo","Oposição",["oposicao"]],["selecoes","Seleções",["selecoes"]]];
  const GROUPS_FREE=[["ofertas","Ofertas",["convites"]],["selecoes","Seleções",["selecoes"]]];
  const SUBNAME={convocacao:"Convocação",escalacao:"Escalação",taticas:"Táticas",calendario:"Calendário",elim:"Eliminatórias",copa:"Copa do Mundo",torneios:"Torneios"};
  const groupOf=(o,tab)=>(o.team?GROUPS_TEAM:GROUPS_FREE).find(g=>g[2].includes(tab));
  function rail(o){
    const groups=o.team?GROUPS_TEAM:GROUPS_FREE;
    const cur=groupOf(o,ui.tab);
    return `<nav class="cnv-rail" role="tablist" aria-label="Seleção">${groups.map(([id,l,tabs])=>{
      const badge=id==="ofertas"&&o.offers.length?`<i class="cnv-badge">${o.offers.length}</i>`:id==="plantel"&&o.callup&&o.callup.status==="open"?`<i class="cnv-badge">!</i>`:"";
      return `<button type="button" role="tab" class="${cur&&cur[0]===id?"on":""}" aria-selected="${cur&&cur[0]===id}" data-cn-tab="${tabs[0]}"><span class="cnv-ic">${ICONS[id]||""}</span><span class="cnv-lb">${l}</span>${badge}</button>`;}).join("")}</nav>`;
  }
  function subpills(o){
    const g=groupOf(o,ui.tab);if(!g||g[2].length<2)return "";
    return `<nav class="cn-sub" aria-label="Seções">${g[2].map(id=>`<button type="button" class="${ui.tab===id?"on":""}" data-cn-tab="${id}">${esc(SUBNAME[id]||id)}</button>`).join("")}</nav>`;
  }
  const ring=(v,big)=>`<i class="cnv-ring${big?" big":""}" style="--v:${Math.max(0,Math.min(99,Math.round(v)))}"><b>${Math.round(v)}</b></i>`;
  const GRP={GOL:"Goleiros",DEF:"Defesa",MEI:"Meio-campo",ATA:"Ataque"};
  const avg=l=>l.length?l.reduce((a,p)=>a+p.overall,0)/l.length:0;

  // ---------- Ofertas de seleções (cartões) ----------
  function convites(o,S){
    const day=o.day,per=isPhone()?4:4;
    const profile=(code)=>{try{return CN().nationProfile(ctx.s,ctx.D,code,null);}catch(e){return null;}};
    const offerCodes=new Set(o.offers.map(x=>x.code));
    const nat=o.nations.filter(n=>!n.current);
    const list=[...o.offers.map(of=>({kind:"offer",of,n:o.nations.find(n=>n.code===of.code)||{code:of.code,name:of.name,need:0,strength:0}})),
      ...nat.filter(n=>!offerCodes.has(n.code)&&n.eligible).sort((a,b)=>b.strength-a.strength).map(n=>({kind:"apply",n})),
      ...nat.filter(n=>!offerCodes.has(n.code)&&!n.eligible).sort((a,b)=>a.need-b.need).map(n=>({kind:"lock",n}))];
    const pages=Math.max(1,Math.ceil(list.length/per));if(ui.page.offers>=pages)ui.page.offers=pages-1;
    const view=list.slice(ui.page.offers*per,ui.page.offers*per+per);
    const cards=view.map(it=>{
      const n=it.n,f=profile(n.code),tit=(f?.titles||[]).slice(0,2);
      const trophy=tit.length?tit.map(t=>`<span>🏆 <b>${t.count}×</b> ${esc(t.name)}</span>`).join(""):'<span class="cnv-dim">Sem títulos registrados</span>';
      const rank=f?`${f.rank}º de ${f.total} em força`:`força ${n.strength}`;
      let act;
      if(it.kind==="offer")act=`<button type="button" class="cn-btn go" data-cn-accept="${esc(n.code)}">Aceitar proposta</button><button type="button" class="cn-btn" data-cn-decline="${esc(n.code)}" aria-label="Recusar">✕</button><small class="cnv-dim">até o dia ${it.of.expires}</small>`;
      else if(it.kind==="apply"){
        if(o.applications.some(a=>a.code===n.code))act='<span class="cn-tag">Em análise</span>';
        else if(o.rejected[n.code]>day)act=`<span class="cn-tag no">Volte no dia ${o.rejected[n.code]}</span>`;
        else act=`<button type="button" class="cn-btn go" data-cn-apply="${esc(n.code)}" ${day<o.cooldownUntil?"disabled":""}>Candidatar-se</button>`;
      }else act=`<span class="cnv-lock">🔒 Reputação ${n.need}+</span>`;
      return `<article class="cnv-offer ${it.kind==="lock"?"lock":""} ${it.kind==="offer"?"hot":""}"><b data-no-crest>${esc(n.name)}</b><div class="cnv-offer-top">${crest(n.code,n.name)}${ring(n.strength)}</div><small class="cnv-dim">Títulos</small><div class="cnv-tit">${trophy}</div><small class="cnv-dim">Exigência</small><p>${esc(n.confederation||"")} · ${rank} · reputação ${n.need}+</p><div class="cnv-act">${act}</div></article>`;
    }).join("");
    const wait=day<o.cooldownUntil?`<p class="cn-note">A confederação só aceita novos treinadores a partir do dia ${o.cooldownUntil}.</p>`:"";
    const apps=o.applications.length?`<p class="cn-note">${o.applications.map(a=>`${esc(a.name)}: candidatura em análise, resposta até o dia ${a.decideDay}`).join(" · ")}</p>`:"";
    return `<div class="cnv-offers-head"><b>Ofertas de seleções</b><span class="cnv-dim">Sua reputação: <b>${o.rep}</b>${o.offers.length?` · ${o.offers.length} convite(s)`:""}</span></div><div class="cnv-offers">${cards||'<div class="cn-empty">Nenhuma seleção disponível.</div>'}</div>${pager("offers",list.length,per)}${wait}${apps}`;
  }

  // ---------- Relatórios ----------
  function relat(o){
    const pl=o.players.filter(p=>p.called),all=o.players;
    const tabs=[["geral","Perspectiva geral"],["indisp","Indisponíveis"],["destaques","Destaques"]];
    if(!tabs.some(t=>t[0]===ui.rel))ui.rel="geral";
    const nav=`<nav class="cnv-tabs" role="tablist">${tabs.map(([k,l])=>`<button type="button" role="tab" class="${ui.rel===k?"on":""}" data-cn-rel="${k}">${l}${k==="indisp"&&all.filter(p=>!p.available).length?` <i>${all.filter(p=>!p.available).length}</i>`:""}</button>`).join("")}</nav>`;
    if(ui.rel==="indisp"){
      const out=all.filter(p=>!p.available).sort((a,b)=>b.overall-a.overall);
      const rows=out.map(p=>`<div class="cn-row"><div class="who">${ring(p.overall)}<span><b>${esc(p.name)}</b><small>${esc(p.pos)} · ${esc(p.club)} · ${p.age} anos</small></span></div><span class="cn-tag no">Indisponível</span></div>`).join("")||'<div class="cn-empty">Nenhum jogador do pool da seleção está indisponível agora.</div>';
      return nav+`<section class="cn-card">${rows}</section>`;
    }
    if(ui.rel==="destaques"){
      const top=(k,t)=>pl.filter(p=>p[k]>0).sort((a,b)=>b[k]-a[k]||b.overall-a.overall).slice(0,6).map(p=>`<div class="cn-row"><div class="who">${ring(p.overall)}<span><b>${esc(p.name)}</b><small>${esc(p.pos)} · ${esc(p.club)}</small></span></div><span class="cn-tag ok">${p[k]} ${t}</span></div>`).join("")||'<div class="cn-empty">Sem dados ainda.</div>';
      const r=o.record;
      return nav+`<div class="cn-grid"><section class="cn-card"><small>CAMPANHA</small><div class="cn-rec"><div><b>${r.v}</b><small>V</small></div><div><b>${r.e}</b><small>E</small></div><div><b>${r.d}</b><small>D</small></div><div><b>${r.gf}–${r.ga}</b><small>gols</small></div></div></section><section class="cn-card"><small>MAIS JOGOS</small>${top("caps","jogos")}</section><section class="cn-card"><small>ARTILHEIROS</small>${top("goals","gols")}</section></div>`;
    }
    const n=pl.length,m=avg(pl),age=n?pl.reduce((a,p)=>a+p.age,0)/n:0;
    const keys=pl.slice().sort((a,b)=>b.overall-a.overall).slice(0,3);
    const by=["GOL","DEF","MEI","ATA"].map(g=>[g,avg(pl.filter(p=>p.pos===g)),pl.filter(p=>p.pos===g).length]).filter(x=>x[2]>0);
    const best=by.slice().sort((a,b)=>b[1]-a[1])[0],worst=by.slice().sort((a,b)=>a[1]-b[1])[0];
    const good=[],bad=[];
    if(n>=23&&n<=26)good.push(`Lista de ${n} convocados, dentro do limite de ${o.max}.`);else if(n<23)bad.push(`Só ${n} convocados: complete a lista.`);
    if(best&&best[1]>=m)good.push(`${GRP[best[0]]} é o setor mais forte (GER médio ${Math.round(best[1])}).`);
    const gk=pl.filter(p=>p.pos==="GOL").sort((a,b)=>b.overall-a.overall)[0];if(gk&&gk.overall>=m+3)good.push(`O goleiro ${esc(gk.name)} está acima da média do grupo.`);
    if(age&&age<=28)good.push(`Grupo com idade média de ${age.toFixed(0)} anos.`);
    if(worst&&best&&worst[0]!==best[0]&&worst[1]<m-1)bad.push(`${GRP[worst[0]]} é o setor mais fraco (GER médio ${Math.round(worst[1])}).`);
    if(age>=31)bad.push(`Idade média de ${age.toFixed(0)} anos: cansaço e lesões podem pesar.`);
    const out=all.filter(p=>!p.available&&p.called).length;if(out)bad.push(`${out} convocado(s) indisponível(is).`);
    const dep=by.filter(x=>x[0]==="DEF"&&x[2]<6);if(dep.length)bad.push("Poucos defensores na lista.");
    const li=(c,mark,arr)=>arr.length?arr.map(x=>`<div class="cnv-li"><i class="${c}">${mark}</i><span>${x}</span></div>`).join(""):`<div class="cnv-li cnv-dim">—</div>`;
    return nav+`<div class="cnv-kpis"><span><small>GER médio</small>${ring(m,true)}</span><span><small>Convocados</small><b>${n}</b></span><span><small>Idade média</small><b>${age?age.toFixed(0):"—"}</b></span><span><small>Pool da seleção</small><b>${all.length}</b></span></div><div class="cnv-keys">${keys.map(p=>`<article class="cnv-key"><b>${esc(String(p.name).toUpperCase())}</b><small>${esc(p.club)}</small><div><span><small>IDADE</small>${p.age}</span>${ring(p.overall)}<span><small>POS</small><em>${esc(p.code||p.pos)}</em></span></div></article>`).join("")}</div><section class="cn-card cnv-pc"><div>${li("ok","✓",good)}</div><div>${li("no","✕",bad)}</div></section>`;
  }

  // ---------- Oposição ----------
  function oposicao(o){
    const nx=o.fixtures[0];
    if(!nx)return `<section class="cn-card"><div class="cn-empty">Sem jogo marcado: não há adversário para analisar.</div></section>`;
    let f=null;try{f=CN().nationProfile(ctx.s,ctx.D,nx.opponentCode,null);}catch(e){f=null;}
    if(!f||!f.starters.length)return `<section class="cn-card"><div class="cn-empty">Escalação de ${esc(nx.opponent)} indisponível.</div></section>`;
    const st=f.starters,lines={GOL:[],DEF:[],MEI:[],ATA:[]};st.forEach(p=>(lines[p.pos]||lines.MEI).push(p));
    const rowsY={ATA:18,MEI:42,DEF:68,GOL:90};
    const dots=Object.entries(lines).map(([g,ps])=>ps.map((p,i)=>`<span class="cnv-dot" style="left:${((i+1)/(ps.length+1))*100}%;top:${rowsY[g]}%">${ring(p.overall)}<em>${esc(String(p.name).split(" ").slice(-1)[0])}</em></span>`).join("")).join("");
    const key=st.slice().sort((a,b)=>b.overall-a.overall)[0];
    const mine=o.players.filter(p=>p.called),secs=["DEF","MEI","ATA"].map(g=>[g,avg(st.filter(p=>p.pos===g)),avg(mine.filter(p=>p.pos===g))]).filter(x=>x[1]>0);
    const tips=[];
    secs.forEach(([g,th,my])=>{if(!my)return;const d=th-my;if(d<=-2)tips.push(["ok",`${GRP[g]} deles (GER médio ${Math.round(th)}) fica abaixo do seu (${Math.round(my)}): ataque por aí.`]);else if(d>=2)tips.push(["no",`${GRP[g]} deles (GER médio ${Math.round(th)}) supera o seu (${Math.round(my)}): reforce esse setor.`]);});
    const best=secs.slice().sort((a,b)=>b[1]-a[1])[0];if(best)tips.push(["no",`Setor mais forte deles: ${GRP[best[0]]}.`]);
    tips.push([o.power>=f.strength?"ok":"no",`Força geral: você ${o.power} × ${f.strength} (${f.rank}º do mundo).`]);
    return `<div class="cnv-opp"><aside>${crest(f.code,f.name)}<b>${esc(f.name.toUpperCase())}</b><div class="cnv-opp-r">${ring(f.strength,true)}<small>Força</small></div><small class="cnv-dim">${esc(f.formation)} · ${/amistoso/i.test(nx.competition)?"Amistoso":esc(nx.competition)} · dia ${nx.day}</small></aside><div class="cnv-pitch" aria-label="Escalação provável de ${esc(f.name)}">${dots}</div><aside class="cnv-opp-r2"><section class="cn-card"><small>JOGADOR-CHAVE</small><div class="cn-row"><div class="who">${ring(key.overall)}<span><b>${esc(key.name)}</b><small>${esc(key.club)} · ${esc(key.pos)}</small></span></div></div></section><section class="cn-card"><small>COMO JOGAR CONTRA</small>${tips.map(([c,x])=>`<div class="cnv-li"><i class="${c}">${c==="ok"?"✓":"✕"}</i><span>${esc(x)}</span></div>`).join("")}</section></aside></div>`;
  }

  // ---------- Adicionar jogadores ----------
  function addPanel(o,S){
    const a=ui.add,full=o.players.filter(p=>p.called).length>=26;
    const codes=["TODOS","GOL","DEF","MEI","ATA"];
    const f=(k,l,ph)=>`<label>${l}<input type="number" inputmode="numeric" data-cn-addf="${k}" value="${esc(a[k]||"")}" placeholder="${ph}"></label>`;
    let res='<div class="cn-empty"><b>Sem dados</b><br>Defina os filtros e toque em Pesquisa.</div>',cnt=0;
    if(a.run){
      const t=a.text.trim().toLowerCase();
      let l=o.players.filter(p=>(a.withCalled||!p.called)&&(a.pos==="TODOS"||p.pos===a.pos)&&(!t||String(p.name).toLowerCase().includes(t)||String(p.club).toLowerCase().includes(t))&&(!a.ageMin||p.age>=Number(a.ageMin))&&(!a.ageMax||p.age<=Number(a.ageMax))&&(!a.ovrMin||p.overall>=Number(a.ovrMin))).sort((x,y)=>y.overall-x.overall);
      cnt=l.length;
      const per=isPhone()?5:6,pages=Math.max(1,Math.ceil(l.length/per));if(ui.page.add>=pages)ui.page.add=pages-1;
      res=l.slice(ui.page.add*per,ui.page.add*per+per).map(p=>`<div class="cn-pl"><span class="cn-ovr ${p.overall>=82?"hi":""}">${p.overall}</span><span><b>${esc(p.name)}</b><small>${esc(p.code||p.pos)} · ${esc(p.club)} · ${p.age} anos</small></span><span>${p.called?'<span class="cn-tag ok">Convocado</span>':!p.available?'<span class="cn-tag no">Indisponível</span>':""}</span>${p.called?`<button type="button" class="cn-btn" data-cn-toggle="${esc(p.id)}">Dispensar</button>`:full?`<button type="button" class="cn-btn go" data-cn-swap-in="${esc(p.id)}" ${p.available?"":"disabled"}>Trocar</button>`:`<button type="button" class="cn-btn go" data-cn-toggle="${esc(p.id)}" ${p.available?"":"disabled"}>Convocar</button>`}</div>`).join("")||'<div class="cn-empty"><b>Sem dados</b><br>Nenhum jogador com esses filtros.</div>';
      res+=pager("add",l.length,per);
    }
    return `<div class="cnv-add"><header><b>ADICIONAR JOGADORES</b><button type="button" class="cn-btn" data-cn-addclose aria-label="Fechar">✕</button></header><div class="cnv-add-body"><section class="cn-card cnv-add-f"><label class="cnv-search">Nome ou clube<input type="search" data-cn-addf="text" value="${esc(a.text)}" placeholder="Pesquisar"></label><div class="cn-chips">${codes.map(c=>`<button type="button" class="${a.pos===c?"on":""}" data-cn-addpos="${c}">${c==="TODOS"?"Qualquer":POS_LABEL[c]}</button>`).join("")}</div><div class="cnv-add-n">${f("ageMin","Idade mín.","17")}${f("ageMax","Idade máx.","40")}${f("ovrMin","GER mín.","70")}</div><label class="cnv-chk"><input type="checkbox" data-cn-addf="withCalled" ${a.withCalled?"checked":""}> Incluir já convocados</label><div class="cnv-add-b"><button type="button" class="cn-btn danger" data-cn-addclear>Apagar ⟲</button><button type="button" class="cn-btn go" data-cn-addrun>Pesquisa 🔍</button></div></section><section class="cn-card cnv-add-r"><small>RESULTADOS${a.run?` · ${cnt}`:""} · convocados ${o.players.filter(p=>p.called).length}/${o.max}</small>${res}</section></div></div>`;
  }

  function render(s,D){
    const C=CN();if(!s||!C)return `<section class="card"><h2>Seleção</h2><p class="muted">Módulo indisponível.</p></section>`;
    ctx={s,D};
    let o;try{o=C.overview(s,D);}catch(e){return `<section class="card"><h2>Seleção</h2><p class="muted">Não foi possível carregar: ${esc(e.message)}</p></section>`;}
    if(!o)return "";
    const tabs=tabsFor(o);
    if(!tabs.some(([id])=>id===ui.tab))ui.tab=tabs[0][0];
    const S=SIZE();
    const body=ui.tab==="geral"?geral(o,S):ui.tab==="convocacao"?convocacao(o,S):ui.tab==="escalacao"?escalacao(o):ui.tab==="taticas"?taticas(o):ui.tab==="relat"?relat(o):ui.tab==="oposicao"?oposicao(o):ui.tab==="calendario"?calendario(o,S):ui.tab==="copa"?copa(o,S):ui.tab==="torneios"?torneios(o,S):ui.tab==="elim"?elim(o,S):ui.tab==="selecoes"?selecoes(o,S):convites(o,S);
    const add=(o.team&&ui.addOpen)?addPanel(o,S):"";
    return `${css()}${ICON_DEFS}<section class="cn cnv t-${ui.tab}" data-coach-national>${rail(o)}<div class="cnv-main">${ui.tab==="geral"?head(o):""}${subpills(o)}${body}</div>${add}</section>`;
  }

  const api={render,state:ui,setRel(k){ui.rel=k;},openAdd(v){ui.addOpen=!!v;ui.page.add=0;},setAdd(k,v){if(k in ui.add){ui.add[k]=v;ui.page.add=0;}},runAdd(){ui.add.run=true;ui.page.add=0;},clearAdd(){ui.add={text:"",pos:"TODOS",ageMin:"",ageMax:"",ovrMin:"",withCalled:false,run:false};ui.page.add=0;},setTab(t){ui.tab=t;ui.confirmLeave=false;ui.swapIn=null;},setPage(key,n){if(key in ui.page)ui.page[key]=Math.max(0,Number(n)||0);},setPos(p){ui.pos=p;ui.page.players=0;},setXi(id){ui.xiSel=ui.xiSel===id?null:(id||null);},setSwapIn(id){ui.swapIn=id||null;},setConfirmLeave(v){ui.confirmLeave=!!v;},setNation(c){ui.nation=ui.nation===c?null:c;ui.year=null;},setYear(y){ui.year=Number(y)||null;}};
  root.ProLifeCoachNationalView=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
