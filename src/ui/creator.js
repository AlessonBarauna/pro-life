(function (root) {
  "use strict";
  // Etapa 14 — Assistente de criação de jogador (HISTÓRIA → JOGADOR → POSIÇÃO → IDENTIDADE → OPORTUNIDADES → CONFIRMAR).
  // A UI só coleta escolhas e exibe resultados. Todas as regras vêm de D.Creation (domínio) e de D.create.
  const STEPS = ["HISTÓRIA", "JOGADOR", "POSIÇÃO", "IDENTIDADE", "OPORTUNIDADES", "CONFIRMAR"];
  const STYLES = ["Técnico", "Velocista", "Organizador", "Combativo"];
  const COLORS = { skin: "#bc8660", hairColor: "#241e1a", eyeColor: "#4a3524" };
  let W = null;

  function freshSeed() { return (Date.now() >>> 0) || 1; }
  function birthDateForAge(age) {
    const y = 2026 - Number(age || 18);
    return `${y}-01-01`;
  }
  function ageFromBirthDate(value) {
    const m = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const y=Number(m[1]), mo=Number(m[2]), d=Number(m[3]);
    let age=2026-y;
    if (1<mo || (mo===1 && 1<d)) age--;
    return age;
  }
  function init(ctx, keepSeed) {
    const D = ctx.D, id = "blank", story = D.Training.origins[id].story;
    W = {
      step: 0, seed: keepSeed || freshSeed(), storyId: id, difficulty: "normal", personality: "balanced",
      cfg: { name: "Alesson Rodrigues", city: "Mogi das Cruzes", age: story.age, birthDate: birthDateForAge(story.age), pos: "ATA", foot: "right", height: 178, weight: 72, style: "Técnico", celebration: "Braços abertos", archetypeId: null, appearance: { ...ctx.C.normalize({}) } },
      points: {}, custom: { age: 18, overall: 64, reputation: 12, popularity: 5, wallet: 5000 },
      clubId: null, cache: null,
    };
    W.cfg.archetypeId = D.Training.defaultArchetypeId[W.cfg.pos];
  }
  // Configuração que alimenta o domínio. Mesma entrada + mesma seed ⇒ mesmo resultado.
  function config(withClub) {
    const c = { mode: "player", ...W.cfg, origin: W.storyId, points: { ...W.points }, creation: { difficulty: W.difficulty, personality: W.personality, custom: W.storyId === "custom" ? { ...W.custom } : undefined } };
    if (W.storyId === "custom") {
      c.age = W.custom.age;
      c.birthDate = W.cfg.birthDate || birthDateForAge(W.custom.age);
    }
    if (withClub && W.clubId) c.clubId = W.clubId;
    return c;
  }
  // Dependências que invalidam as oportunidades (nome/aparência/altura não entram).
  function depKey() {
    const c = config(false);
    return JSON.stringify([c.origin, c.pos, c.age, c.archetypeId, c.style, c.points, c.creation, W.seed]);
  }
  function draft(ctx) {
    const key = depKey();
    if (W.cache?.key !== key) {
      const s = ctx.D.create(config(false), W.seed);
      W.cache = { key, offers: s.offers, overall: ctx.D.overall(s.person), person: s.person, reputation: s.reputation, wallet: s.wallet, popularity: s.commercial?.popularity ?? 0, clubs: s.clubs };
      if (W.clubId && !s.offers.some((o) => o.clubId === W.clubId)) W.clubId = null;
    }
    return W.cache;
  }
  const money = (v) => "R$ " + Number(v).toLocaleString("pt-BR");

  function stepStory(ctx) {
    const { D, esc } = ctx, T = D.Training;
    const order = ["blank", "academy", "regional", "comeback", "hardRoad", "custom"];
    const cards = order.filter((id) => T.origins[id]?.story).map((id) => {
      const st = T.origins[id].story, on = W.storyId === id;
      return `<button type="button" class="story-card ${on ? "on" : ""}" data-w-story="${id}"><b>${esc(st.title)}</b><small>${esc(st.tagline)}</small><span class="story-meta"><i>Idade ${st.ages[0] === st.ages[1] ? st.ages[0] : st.ages[0] + "–" + st.ages[1]}</i><i>Nível ${esc(st.level)}</i><i>Reputação ${st.reputation ? (st.reputation[1] >= 26 ? "Alta" : st.reputation[1] >= 15 ? "Média" : "Baixa") : "Livre"}</i><i>Desafio ${esc(st.hint || "Livre")}</i></span></button>`;
    }).join("");
    const diffs = Object.entries(D.Creation.difficulties).map(([id, d]) => `<button type="button" class="chip ${W.difficulty === id ? "on" : ""}" data-w-diff="${id}" title="${esc(d.description)}">${esc(d.name)}</button>`).join("");
    let custom = "";
    if (W.storyId === "custom") {
      const s = D.Creation.sanitizeCustom(W.custom);
      custom = `<section class="card w-custom"><h3>HISTÓRIA PERSONALIZADA</h3><div class="formgrid">${[["age", "Idade", 14, 32], ["overall", "Overall", 45, 80], ["reputation", "Reputação", 0, 60], ["popularity", "Popularidade", 0, 45], ["wallet", "Patrimônio (R$)", 0, 40000]].map(([k, l, a, b]) => `<label>${l}<input type="number" min="${a}" max="${b}" data-w-custom="${k}" value="${W.custom[k]}"></label>`).join("")}</div><p class="muted">Aplicado: ${s.age} anos · overall ${s.overall} · reputação ${s.reputation} · popularidade ${s.popularity} · ${money(s.wallet)}</p>${s.notes.map((n) => `<div class="notice">${esc(n)}</div>`).join("")}</section>`;
    }
    return `<h2>Escolha sua história</h2><div class="story-grid">${cards}</div>${custom}<h3>Dificuldade</h3><div class="chips">${diffs}</div><p class="muted">${esc(D.Creation.difficulties[W.difficulty].description)} A dificuldade é separada da origem e nunca altera o resultado das partidas.</p>`;
  }
  function stepPlayer(ctx) {
    const { D, esc, opt, appearanceFields, C } = ctx, c = W.cfg, st = D.Training.origins[W.storyId].story;
    const [minA, maxA] = W.storyId === "custom" ? [14, 32] : [14, st.ages[1]];
    const minBirthDate=`${2026-maxA-1}-01-02`, maxBirthDate=`${2026-minA}-01-01`;
    const birthValue=c.birthDate||birthDateForAge(c.age);
    const ageField = `<label>Data de nascimento<input type="date" name="birthDate" min="${minBirthDate}" max="${maxBirthDate}" value="${birthValue}" required></label><label>Idade<input type="number" name="age" value="${c.age}" readonly tabindex="-1" aria-readonly="true"></label>`;
    return `<h2>Quem é você?</h2><div class="grid"><section class="card"><div class="formgrid"><label>Nome completo<input name="name" maxlength="60" value="${esc(c.name)}"></label><label>Cidade natal<input name="city" maxlength="60" value="${esc(c.city)}"></label>${ageField}<label>Pé dominante<select name="foot">${opt([["right", "Direito"], ["left", "Esquerdo"]], c.foot)}</select></label><label>Altura (cm)<input name="height" type="number" min="150" max="210" value="${c.height}"></label><label>Peso (kg)<input name="weight" type="number" min="45" max="120" value="${c.weight}"></label></div></section><section class="card"><div id="w-avatar"></div>${appearanceFields(c.appearance)}</section></div>`;
  }
  function stepPosition(ctx) {
    const { D, esc, Charts } = ctx, cr = D.Creation;
    const cards = Object.entries(cr.posLabels).map(([id, label]) => `<button type="button" class="story-card ${W.cfg.pos === id ? "on" : ""}" data-w-pos="${id}"><b>${label}</b><small>${esc(cr.compatibleArchetypes(id).map((a) => a.name).join(" · "))}</small></button>`).join("");
    const used = cr.CORE.reduce((n, k) => n + (W.points[k] || 0), 0);
    const pv = cr.preview(D, config(false), W.seed);
    const rows = cr.CORE.map((k) => `<label class="attribute">${esc(D.labels[k])}<span class="stepper"><button type="button" data-w-pt="${k}" data-d="-1">−</button><b>${W.points[k] || 0}</b><button type="button" data-w-pt="${k}" data-d="1">+</button></span><em>${Math.round(pv.attrs[k])}</em></label>`).join("");
    return `<h2>Posição e estilo</h2><div class="story-grid">${cards}</div><div class="grid"><section class="card"><h3>Estilo de jogo</h3><div class="chips">${STYLES.map((s) => `<button type="button" class="chip ${W.cfg.style === s ? "on" : ""}" data-w-style="${s}">${s}</button>`).join("")}</div><h3>Ajuste fino · ${used} / ${cr.POINT_BUDGET} pontos</h3><div id="points">${rows}</div><p class="muted">Cada atributo aceita até ${cr.POINT_MAX} pontos. A posição define a distribuição; dois jogadores com o mesmo overall não são iguais.</p></section><section class="card"><div class="tag">OVERALL INICIAL</div><div class="mega-rating">${pv.overall}<small>GER</small></div>${Charts.radar(Object.fromEntries(D.attrs.map((k) => [k, pv.attrs[k]])))}<p class="muted">Pontos fortes: ${pv.strengths.map((x) => esc(x.label) + " " + x.value).join(" · ")}</p></section></div>`;
  }
  function stepIdentity(ctx) {
    const { D, esc } = ctx, cr = D.Creation, pv = cr.preview(D, config(false), W.seed);
    const arch = cr.compatibleArchetypes(W.cfg.pos).map((a) => `<button type="button" class="story-card ${W.cfg.archetypeId === a.id ? "on" : ""}" data-w-arch="${a.id}"><b>${esc(a.name)}</b><small>${esc(a.description)}</small></button>`).join("");
    const pers = Object.entries(cr.personalities).map(([id, p]) => `<button type="button" class="story-card ${W.personality === id ? "on" : ""}" data-w-pers="${id}"><b>${esc(p.name)}</b><small>${esc(p.description)}</small></button>`).join("");
    return `<h2>Identidade</h2><h3>Arquétipo (compatível com ${esc(cr.posLabels[W.cfg.pos])})</h3><div class="story-grid">${arch}</div><h3>Personalidade</h3><div class="story-grid">${pers}</div><div class="grid"><section class="card"><label>Comemoração<select name="celebration">${ctx.opt(ctx.C.celebrations, W.cfg.celebration)}</select></label></section><section class="card"><div class="tag">PRÉVIA</div><b>${pv.overall} GER</b> · potencial estimado oculto<br><small class="muted">${esc(pv.story.title)} · ${pv.age} anos · reputação ${pv.reputation} · popularidade ${pv.popularity}</small></section></div>`;
  }
  const kindLabel = { showcase: "Vitrine", playing: "Espaço para jogar", development: "Projeto de desenvolvimento" };
  function stepOffers(ctx) {
    const { D, esc } = ctx, d = draft(ctx);
    const cards = d.offers.map((o) => {
      const c =
        d.clubs.find(
          (x) => x.id === o.clubId
        ) || {
          id:o.clubId,
          name:"Clube indisponivel",
          leagueId:"",
          structure:"?"
        };

      const on =
        W.clubId === o.clubId;

      const comp =
        o.competition || {
          rank:"?",
          count:"?",
          topOvr:0,
          need:0,
          structure:0,
          leagueId:c.leagueId
        };
      return `<button type="button" class="offer-card ${on ? "on" : ""}" data-w-club="${o.clubId}"><span class="tag">${esc(kindLabel[o.pitch.kind])}</span><b>${esc(c.name)}</b><small>${esc(D.leagues?.find?.((l) => l.id === c.leagueId)?.name || ({ serieA: "Série A", serieB: "Série B", serieC: "Série C", serieD: "Série D" })[c.leagueId])} · estrutura ${c.structure}</small><p>${esc(o.pitch.text)}</p><div class="story-meta"><i>${money(o.salary)}/mês</i><i>${Math.round(o.durationDays / 365 * 10) / 10} ano(s)</i><i>${comp.rank}º de ${comp.count} na posição</i><i>Luvas ${money(o.signingBonus)}</i></div><small class="muted">Nenhuma vaga de titular é prometida: o treinador decide por desempenho.</small></button>`;
    }).join("");
    return `<h2>Primeiras oportunidades</h2><p class="muted">Propostas geradas a partir de elencos reais, da sua posição e do seu nível. Escolha com calma — voltar às etapas anteriores recalcula só o necessário.</p><div class="offer-grid">${cards || '<div class="empty">Nenhuma proposta disponível.</div>'}</div>`;
  }
  function stepConfirm(ctx) {
    const { D, esc } = ctx, d = draft(ctx), o = d.offers.find((x) => x.clubId === W.clubId), cr = D.Creation, st = D.Training.origins[W.storyId].story;
    const c = o && d.clubs.find((x) => x.id === o.clubId);
    return `<h2>Confirmar carreira</h2><div class="grid"><section class="card"><div class="tag">${esc(st.title.toUpperCase())}</div><h3>${esc(W.cfg.name)}</h3><p>${W.storyId === "custom" ? cr.sanitizeCustom(W.custom).age : W.cfg.age} anos · ${esc(cr.posLabels[W.cfg.pos])} · ${esc(D.Training.archetypeCatalog[W.cfg.archetypeId].name)} · ${esc(cr.personalities[W.personality].name)}</p><p><b>${d.overall} GER</b> · reputação ${d.reputation} · popularidade ${d.popularity} · patrimônio ${money(d.wallet)}</p><p class="muted">Dificuldade: ${esc(cr.difficulties[W.difficulty].name)} · Seed ${W.seed}</p></section><section class="card"><div class="tag">PRIMEIRO CLUBE</div>${o ? `<h3>${esc(c.name)}</h3><p>${esc(kindLabel[o.pitch.kind])} · ${money(o.salary)}/mês · ${Math.round(o.durationDays / 365 * 10) / 10} ano(s)</p><p class="muted">O contrato segue as regras de mercado do jogo. Seu papel será definido pelo treinador.</p>` : '<div class="notice">Volte e escolha uma oportunidade.</div>'}</section></div><div class="notice">Ao confirmar, a carreira é criada e salva. O processo não altera nenhuma carreira anterior até você confirmar a substituição.</div>`;
  }
  function valid(ctx) {
    if (W.step === 1 && !String(W.cfg.name).trim()) return "Informe o nome do jogador.";
    if (W.step === 1) {
      const st=ctx.D.Training.origins[W.storyId].story;
      const [minA,maxA]=W.storyId === "custom" ? [14,32] : [14,st.ages[1]];
      const age=ageFromBirthDate(W.cfg.birthDate);
      if(age===null) return "Informe uma data de nascimento válida.";
      if(age<minA || age>maxA) return `A data de nascimento deve resultar em idade entre ${minA} e ${maxA} anos no início da carreira.`;
      W.cfg.age=age;
      if(W.storyId==="custom") W.custom.age=age;
    }
    if (W.step === 4 && !W.clubId) return "Escolha uma das oportunidades.";
    return "";
  }
  function render(ctx) {
    const { $, esc } = ctx;
    const body = [stepStory, stepPlayer, stepPosition, stepIdentity, stepOffers, stepConfirm][W.step](ctx);
    const nav = STEPS.map((s, i) => `<button type="button" class="w-step ${i === W.step ? "on" : ""} ${i < W.step ? "done" : ""}" data-w-go="${i}" ${i > W.step ? "disabled" : ""}><i>${i + 1}</i>${s}</button>`).join("");
    $("#app").innerHTML = `<div class="landing wizard"><header><div class="brand">PRO<span>LIFE</span></div><div class="tag">NOVA CARREIRA / 2026</div></header><div class="w-steps">${nav}</div><div id="wizard" class="setup">${body}</div><div class="w-actions"><button type="button" data-w-back ${W.step ? "" : "disabled"}>← Voltar</button>${ctx.hasSaved() ? '<button type="button" data-action="resume">Voltar à carreira atual</button>' : ""}<button type="button" data-w-coach>Criar treinador</button><button type="button" data-action="import">Importar save</button><button type="button" class="primary" data-w-next>${W.step === 5 ? "Confirmar e iniciar carreira →" : "Avançar →"}</button></div></div>`;
    if (W.step === 1) mountAvatar(ctx);
  }
  function mountAvatar(ctx) {
    const box = ctx.$("#w-avatar");
    if (!box) return;
    const team = W.clubId && W.cache ? W.cache.clubs.find((c) => c.id === W.clubId) : null;
    box.innerHTML = ctx.avatar({ appearance: W.cfg.appearance }, team);
    const stage = box.querySelector(".avatar-stage");
    if (stage) window.ProLifeAvatar3D?.show(stage, { ...W.cfg, number: 10 }, ctx.C.kit(team));
  }
  function onInput(ctx, e) {
    const t = e.target, n = t.name, c = W.cfg;
    if (t.dataset.wCustom) {
      W.custom[t.dataset.wCustom] = Number(t.value);
      if(t.dataset.wCustom==="age"){W.cfg.age=W.custom.age;W.cfg.birthDate=birthDateForAge(W.custom.age);}
      return;
    }
    if (!n) return;
    if (["name", "city", "foot", "celebration"].includes(n)) c[n] = t.value;
    else if (n === "birthDate") {
      const age=ageFromBirthDate(t.value);
      if(age!==null){
        c.birthDate=t.value; c.age=age; if(W.storyId==="custom") W.custom.age=age;
        const ageInput=ctx.$('.wizard input[name="age"]');
        if(ageInput) ageInput.value=String(age);
      }
    }
    else if (["height", "weight"].includes(n)) c[n] = Number(t.value);
    else if (["skin", "hairColor", "eyeColor", "hair", "beard", "body", "accessory", "tattoo"].includes(n)) { c.appearance[n] = t.value; mountAvatar(ctx); }
  }
  function onClick(ctx, e) {
    const b = e.target.closest("button");
    if (!b) return;
    const d = b.dataset, D = ctx.D;
    if (d.wStory) {
      W.storyId = d.wStory; const st = D.Training.origins[W.storyId].story; W.cfg.age = st.age; W.cfg.birthDate = birthDateForAge(st.age); W.clubId = null;
    } else if (d.wDiff) W.difficulty = d.wDiff;
    else if (d.wPos) { W.cfg.pos = d.wPos; W.cfg.archetypeId = D.Training.defaultArchetypeId[d.wPos]; W.points = {}; W.clubId = null; }
    else if (d.wStyle) W.cfg.style = d.wStyle;
    else if (d.wPt) {
      const k = d.wPt, v = (W.points[k] || 0) + Number(d.d), used = D.Creation.CORE.reduce((n, x) => n + (W.points[x] || 0), 0);
      if (v < 0 || v > D.Creation.POINT_MAX || (Number(d.d) > 0 && used >= D.Creation.POINT_BUDGET)) return;
      W.points[k] = v;
    } else if (d.wArch) W.cfg.archetypeId = d.wArch;
    else if (d.wPers) W.personality = d.wPers;
    else if (d.wClub) W.clubId = d.wClub;
    else if (d.wGo !== undefined) { if (Number(d.wGo) <= W.step) W.step = Number(d.wGo); }
    else if ("wBack" in d) W.step = Math.max(0, W.step - 1);
    else if ("wCoach" in d) { ctx.classic(); return; }
    else if ("wNext" in d) {
      const msg = valid(ctx);

      if (msg) {
        ctx.toast(msg);
        return;
      }

      if (W.step === 5) {
        finish(ctx);
        return;
      }

      const previousStep=
        W.step;

      W.step=
        Math.min(
          5,
          W.step+1
        );

      try {
        render(ctx);
        window.scrollTo(0,0);
      }
      catch(err) {
        W.step=
          previousStep;

        console.error(
          "Falha ao abrir etapa do criador:",
          err
        );

        ctx.toast(
          "Nao foi possivel abrir a proxima etapa: "+
          (
            err?.message ||
            "erro desconhecido"
          )
        );
      }

      return;
    }
    else return;

    render(ctx);
    window.scrollTo(0, 0);
  }
  function finish(ctx) {
    try {
      const fresh = ctx.D.create(config(true), W.seed);
      if (!fresh.creation?.started || fresh.clubId !== W.clubId) throw Error("Não foi possível concluir a criação. Revise as escolhas.");
      if (!ctx.confirmReplace()) return;
      W = null;
      ctx.onStart(fresh);
    } catch (err) { ctx.toast(err.message); }
  }
  function mount(ctx) {
    if (!W) init(ctx);
    render(ctx);
    const app = ctx.$("#app");
    if (app._wizardBound) app.removeEventListener("click", app._wizardBound), app.removeEventListener("change", app._wizardChange);
    app._wizardBound = (e) => { if (W && ctx.$(".wizard")) onClick(ctx, e); };
    app._wizardChange = (e) => { if (W && ctx.$(".wizard")) onInput(ctx, e); };
    app.addEventListener("click", app._wizardBound);
    app.addEventListener("change", app._wizardChange);
  }
  function reset() { W = null; }
  function state() { return W; }
  root.ProLifeCreator = { mount, reset, state, config: () => (W ? config(true) : null), STEPS };
})(typeof globalThis !== "undefined" ? globalThis : this);
