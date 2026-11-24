(function squadFcModule(root){
  "use strict";
  // Tela "Elenco" do treinador: campo à esquerda, painel com 4 abas à direita
  // (Plantel, Formação, Instruções, Papéis) e barra lateral de áreas.
  const FORMATION_ROWS={"4-3-3":[3,3,4,1],"4-4-2":[2,4,4,1],"4-2-3-1":[1,3,2,4,1]};
  const STYLES=[
    ["balanced","Equilibrado","Mantém o equilíbrio entre defender e atacar.",50],
    ["possession","Posse e construção","Troca passes curtos para controlar o jogo.",62],
    ["counter","Bloco baixo e contra-ataque","Fecha os espaços e sai rápido na velocidade.",30],
    ["attack","Ataque e risco","Joga todo mundo à frente, aceitando risco atrás.",88]
  ];
  const PRESSING=[["low","Bloco baixo","Espera o rival perto da própria área.",25],["balanced","Pressão equilibrada","Pressiona em momentos escolhidos.",55],["high","Pressão alta","Sufoca a saída de bola do adversário.",90]];
  const BUILDUP=[["short","Passes curtos","Constrói desde a defesa, com paciência.",35],["balanced","Construção equilibrada","Alterna passe curto e bola longa.",55],["direct","Passe direto","Lança rápido para os atacantes.",85]];
  const WIDTH=[[35,"Estreita","Time compacto pelo meio.",35],[50,"Normal","Largura padrão do esquema.",50],[65,"Larga","Abre os pontas e laterais.",70]];
  const DEPTH=[[35,"Linha recuada","Defesa perto do goleiro.",30],[50,"Linha normal","Defesa na altura padrão.",50],[65,"Linha alta","Defesa adiantada, espaço pequeno.",80]];
  const SUBS=[["estilo","Estilo"],["pressao","Pressão"],["construcao","Construção"],["largura","Largura"],["profundidade","Profundidade"],["planos","Planos"]];
  const TABS=[["plantel","Plantel"],["formacao","Formação"],["instrucoes","Instruções"],["papeis","Papéis"]];
  const ico=d=>'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
  const RAIL=[
    ["lineup","Táticas",ico('<circle cx="6" cy="6" r="2.2"/><path d="M6 9v4c0 2 1.5 3 3.5 3H18"/><path d="m15.5 13.5 2.5 2.5-2.5 2.5"/>')],
    ["hierarchy","Hierarquia",ico('<circle cx="12" cy="7" r="3"/><path d="M5 20c0-4 3-6 7-6s7 2 7 6"/>')],
    ["reports","Relatórios",ico('<path d="M5 20V10M12 20V4M19 20v-7"/>')],
    ["roster","Lista",ico('<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r=".8"/><circle cx="4" cy="12" r=".8"/><circle cx="4" cy="18" r=".8"/>')],
    ["contracts","Contratos",ico('<path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4M10 13h6M10 17h6"/>')]
  ];

  function render(x){
    const {esc,D,state,c,rows,bench,selected,formation,swapSource,canUndo,fit,positionOf,shortName,isUnavailable,roleOptions,teamTactics,presets,fcTab,fcSub,detailAside,starters}=x;
    const group=pos=>/GOL/.test(pos)?"gk":/ZAG|LE|LD|DEF|ALE|ALD/.test(pos)?"df":/CA|ATA|PE|PD/.test(pos)?"at":"mc";
    const surname=n=>{const t=String(n||"Jogador").trim().split(/\s+/);return (t.length>1?t[t.length-1]:t[0]).toUpperCase();};
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    const card=(p,slotRole)=>{
      const o=D.overall(p),tier=o>=88?"elite":o>=80?"gold":o>=70?"ok":"low";
      const pos=slotRole||positionOf(p),f=slotRole?fit(slotRole,p):3;
      const cond=clamp(Math.round(p.condition??0),0,100);
      const flag=p.injury?"LESÃO":Number(p.suspension)>0?"SUSPENSO":"";
      const photo=root.ProLifePlayerCard?.portrait?root.ProLifePlayerCard.portrait(p):"";
      return '<article class="fcs-card'+(p.id===selected?.id?' on':'')+(p.id===swapSource?' swap':'')+(f===0?' oop':f===1?' adp':'')+(flag?' out':'')+'" data-squad-player="'+esc(p.id)+'" draggable="true" role="button" tabindex="0" aria-label="Selecionar '+esc(p.name)+'">'+
        '<span class="fcs-ger t-'+tier+'">'+o+'</span>'+
        (photo?'<img src="'+esc(photo)+'" alt="" draggable="false">':'<span class="fcs-noimg">'+esc(String(p.name||"?").charAt(0))+'</span>')+
        '<b>'+esc(surname(p.name))+'</b>'+
        '<span class="fcs-meta"><em class="g-'+group(pos)+'">'+esc(pos)+(f===0?' !':'')+'</em><i class="fcs-mood '+(Number(p.morale||0)>=55?'good':'low')+'" title="Moral '+Math.round(p.morale||0)+'"></i></span>'+
        '<s class="fcs-bar"><s style="width:'+cond+'%"></s></s>'+
        (flag?'<u class="fcs-flag">'+flag+'</u>':'')+
        '<input type="checkbox" class="lineup" value="'+esc(p.id)+'" '+(c.lineup.includes(p.id)?'checked':'')+' hidden>'+
      '</article>';
    };

    const pitch=rows.map((row,i)=>'<div class="fcs-row" data-row="'+esc(row.label)+'">'+row.players.map((p,k)=>card(p,row.roles?.[k])).join("")+'</div>').join("");
    const improvised=rows.flatMap(r=>r.players.map((p,i)=>({p,g:fit(r.roles?.[i],p)}))).filter(v=>v.g===0).length;
    const pitchBox='<section class="fcs-pitch" aria-label="Campo tático · formação '+esc(formation)+'"><i class="fcs-circle"></i><i class="fcs-half"></i>'+pitch+
      '<div class="fcs-info"><span>Formação<b>'+esc(formation)+'</b></span><span>Improvisados<b>'+improvised+'</b></span></div></section>';

    let body="";
    if(fcTab==="plantel"){
      const strip=selected?'<div class="fcs-strip"><span class="fcs-strip-who"><b>'+esc(selected.name)+'</b><small>'+esc(positionOf(selected))+' · GER '+D.overall(selected)+(isUnavailable(selected)?(selected.injury?' · lesionado':' · suspenso'):'')+'</small></span>'+
        (swapSource?'<button type="button" class="fcs-btn" data-squad-swap-cancel>Cancelar troca</button>':'<button type="button" class="fcs-btn" data-squad-swap-start="'+esc(selected.id)+'">Trocar jogador</button>')+
        '<button type="button" class="fcs-btn" data-fc-detail="open">Detalhes</button></div>':'';
      const hint=swapSource?'<p class="fcs-hint">Escolha o segundo jogador, no campo ou no banco, para trocar de lugar.</p>':'';
      body=strip+hint+'<h4 class="fcs-h">Banco e relacionados · '+bench.length+'</h4><div class="fcs-grid">'+(bench.map(p=>card(p)).join("")||'<p class="fcs-empty">Nenhum reserva disponível.</p>')+'</div>'+
        '<div class="fcs-foot"><button type="button" class="fcs-btn" data-squad-auto-ideal title="Escolhe agora os melhores pelo GER. Depois disso a escalação fica do jeito que você deixar; só lesionados e suspensos são trocados">Escolher os melhores</button><button type="button" class="fcs-btn" data-squad-ideal title="Escolher os maiores GER disponíveis para cada posição">Sugerir time ideal</button></div>';
    }else if(fcTab==="formacao"){
      const mini=f=>{const r=FORMATION_ROWS[f]||[],h=56,w=44;let dots="";r.forEach((n,ri)=>{const y=6+ri*((h-12)/Math.max(1,r.length-1));for(let k=0;k<n;k++){const xx=n===1?w/2:6+k*((w-12)/(n-1));dots+='<circle cx="'+xx.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="2.4"/>';}});
        return '<svg viewBox="0 0 '+w+' '+h+'" width="'+w+'" height="'+h+'" aria-hidden="true"><rect x=".5" y=".5" width="'+(w-1)+'" height="'+(h-1)+'" rx="3"/><path d="M.5 '+(h/2)+'H'+(w-.5)+'"/>'+dots+'</svg>';};
      body='<h4 class="fcs-h">Escolha a formação</h4><div class="fcs-forms">'+Object.keys(FORMATION_ROWS).map(f=>'<button type="button" class="fcs-form'+(f===formation?' on':'')+'" data-fc-formation="'+f+'" aria-pressed="'+(f===formation)+'">'+mini(f)+'<b>'+f+'</b></button>').join("")+'</div>'+
        '<p class="fcs-hint">Ao trocar a formação, o jogo redistribui os titulares pelas novas posições. Você pode desfazer logo em seguida.</p>';
    }else if(fcTab==="instrucoes"){
      const cur={style:teamTactics.style||c.tactic||"balanced",pressing:teamTactics.pressing||"balanced",buildup:teamTactics.buildup||"balanced",width:teamTactics.width??50,depth:teamTactics.depth??50};
      const opts={estilo:["style",STYLES],pressao:["pressing",PRESSING],construcao:["buildup",BUILDUP],largura:["width",WIDTH],profundidade:["depth",DEPTH]}[fcSub];
      let inner="";
      if(opts){
        const [key,list]=opts;
        inner='<div class="fcs-cards">'+list.map(([val,title,desc,lean])=>'<button type="button" class="fcs-opt'+(String(cur[key])===String(val)?' on':'')+'" data-fc-tactic="'+key+':'+val+'" aria-pressed="'+(String(cur[key])===String(val))+'"><b>'+esc(title)+'</b><span>'+esc(desc)+'</span><i class="fcs-lean" style="--p:'+(100-lean)+'%"></i><small><em>Defesa</em><em>Ataque</em></small></button>').join("")+'</div>';
      }else{
        inner='<div class="fcs-presets"><p class="fcs-hint">Salve ou aplique até três planos táticos para este clube.</p>'+[1,2,3].map(slot=>'<div class="fcs-preset"><span><b>Plano '+slot+'</b><small>'+esc(presets[slot]?.name||"Vazio")+'</small></span><button type="button" class="fcs-btn" data-coach-preset-save="'+slot+'">Salvar atual</button><button type="button" class="fcs-btn" data-coach-preset-load="'+slot+'" '+(presets[slot]?"":"disabled")+'>Aplicar</button></div>').join("")+'</div>';
      }
      body='<nav class="fcs-subs" aria-label="Instruções táticas">'+SUBS.map(([id,l])=>'<button type="button" class="'+(fcSub===id?'on':'')+'" data-fc-sub="'+id+'">'+l+'</button>').join("")+'</nav>'+inner;
    }else{
      const cr=state.coachCareer?.playerRoles||{};
      body='<div class="fcs-roles">'+rows.slice().reverse().flatMap(r=>r.players.map((p,i)=>{
        const pos=r.roles?.[i]||positionOf(p),list=roleOptions[pos]||roleOptions[p.pos]||[],now=cr[p.id];
        return '<div class="fcs-role"><i class="g-'+group(pos)+'"></i><b>'+esc(pos)+'</b><span>'+esc(p.name)+'</span>'+
          (list.length?'<select data-fc-role data-player-id="'+esc(p.id)+'" data-position="'+esc(pos)+'" aria-label="Papel de '+esc(p.name)+'">'+list.map(([id,label])=>'<option value="'+esc(id)+'"'+(now?.position===pos&&now?.role===id?' selected':'')+'>'+esc(label)+'</option>').join("")+'</select>':'<em>Sem opções</em>')+'</div>';
      })).join("")+'</div>';
    }

    const panel='<section class="fcs-panel"><nav class="fcs-tabs" aria-label="Painel do elenco">'+TABS.map(([id,l])=>'<button type="button" class="'+(fcTab===id?'on':'')+'" data-fc-tab="'+id+'" '+(fcTab===id?'aria-current="page"':'')+'>'+l+'</button>').join("")+'</nav><div class="fcs-box">'+body+'</div></section>';
    const bar='<header class="fcs-bar-top"><div class="fcs-title"><b>Elenco principal</b><small>XI definido '+starters.length+'/11</small></div><button type="button" class="fcs-top" data-page="home">Voltar</button><button type="button" class="fcs-top" data-squad-undo '+(canUndo?"":"disabled")+'>Desfazer</button><button type="button" class="fcs-top ok" data-action="lineup">Confirmar</button></header>';
    const rail='<nav class="fcs-rail" aria-label="Áreas do elenco">'+RAIL.map(([id,l,svg])=>id==="contracts"?'<button type="button" class="msg-action" data-page="market" data-msg-tab="elenco">'+svg+'<span>'+l+'</span></button>':'<button type="button" data-squad-tab="'+id+'" class="'+(id==="lineup"?'on':'')+'">'+svg+'<span>'+l+'</span></button>').join("")+'</nav>';
    const sheet=x.detailOpen&&detailAside?'<div class="fcs-sheet" role="dialog" aria-label="Detalhes do jogador"><div class="fcs-sheet-in"><button type="button" class="fcs-close" data-fc-detail="close" aria-label="Fechar detalhes">Fechar</button>'+detailAside+'</div></div>':'';
    return '<div class="pl-squad-screen fcs">'+bar+'<div class="fcs-main">'+pitchBox+panel+'</div>'+rail+sheet+'</div>';
  }

  root.ProLifeSquadFc=Object.freeze({render});
})(typeof window!=="undefined"?window:globalThis);
