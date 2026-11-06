(function (root) {
  "use strict";
  // PRO LIFE — Academia (base): jovens da base, relatórios do olheiro e rede de olheiros da base.
  // Lê o estado por ProLifeSM27Ctx e altera por ProLifeSM27Cmd (comandos youth*).
  const doc = root.document;
  if (!doc) return;
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nat = (n) => { try { return root.ProLifeGlobalFootball?.nationName?.(n) || n; } catch (e) { return n; } };
  const POS = ["GOL", "DEF", "MEI", "ATA"];
  let layer = null, tab = "base", confirmId = null;
  const form = { country: "", positions: [], ageMin: 15, ageMax: 19, minStars: 2.5 };

  function money(v) {
    const n = Number(v) || 0, a = Math.abs(n), sign = n < 0 ? "-" : "";
    if (a >= 1e9) return sign + "R$ " + (a / 1e9).toFixed(2).replace(".", ",") + " bi";
    if (a >= 1e6) return sign + "R$ " + (a / 1e6).toFixed(1).replace(".", ",") + " mi";
    if (a >= 1e3) return sign + "R$ " + Math.round(a / 1e3) + " mil";
    return sign + "R$ " + Math.round(a);
  }
  const starText = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ","));
  const stars = (n) => `<span class="acad-stars" style="--v:${Number(n) || 0}" aria-label="${starText(n)} de 5 estrelas" title="${starText(n)} de 5 estrelas">★★★★★</span>`;
  function spark(h) {
    if (!h || h.length < 2) return "";
    const lo = Math.min(...h), hi = Math.max(...h), span = Math.max(1, hi - lo), W = 64, H = 20;
    const pts = h.map((v, i) => `${(i / (h.length - 1) * W).toFixed(1)},${(H - 2 - (v - lo) / span * (H - 4)).toFixed(1)}`).join(" ");
    return `<svg class="acad-spark" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  }
  const posClass = (p) => ({ GOL: "gol", DEF: "def", MEI: "mei", ATA: "ata" }[p] || "mei");

  function kidCard(k, v) {
    const trend = k.trend > 0 ? `<span class="acad-up">▲ +${k.trend}</span>` : k.developing ? `<span class="acad-dev">Em desenvolvimento</span>` : `<span class="acad-flat">Estável</span>`;
    const asking = confirmId === k.id;
    let actions;
    if (asking) {
      actions = `<div class="acad-ask"><span>Dispensar ${esc(k.name.split(" ").slice(-1)[0])}?</span><button type="button" class="acad-btn danger" data-acad-release="${esc(k.id)}">Sim, dispensar</button><button type="button" class="acad-btn" data-acad-ask="">Cancelar</button></div>`;
    } else if (k.loaned) {
      actions = `<div class="acad-actions two"><button type="button" class="acad-btn" data-acad-recall="${esc(k.id)}">Chamar de volta</button><button type="button" class="acad-btn danger" data-acad-ask="${esc(k.id)}">Dispensar</button></div>`;
    } else {
      actions = `<div class="acad-actions"><button type="button" class="acad-btn primary" data-acad-promote="${esc(k.id)}" ${k.canPromote ? "" : "disabled"} title="${esc(k.promoteReason || "Promover ao elenco principal")}">Subir</button><button type="button" class="acad-btn" data-acad-loan="${esc(k.id)}" ${k.age >= 17 ? "" : "disabled"} title="${k.age >= 17 ? "Emprestar até o fim da temporada" : "Só a partir dos 17 anos"}">Emprestar</button><button type="button" class="acad-btn danger" data-acad-ask="${esc(k.id)}">Dispensar</button></div>`;
    }
    return `<li class="acad-card${k.loaned ? " is-loan" : ""}"><div class="acad-card-top"><span class="acad-pos ${posClass(k.pos)}">${esc(k.pos)}</span><span class="acad-name"><b>${esc(k.name)}</b><small>${esc(nat(k.nationality))} · ${k.age} anos${k.loaned ? " · emprestado: " + esc(k.loanTo) : ""}</small></span><span class="acad-ovr"><b>${k.ovr}</b><small>GER</small></span></div>` +
      `<div class="acad-card-mid"><span class="acad-pot">${stars(k.stars)}<small>POT ${k.potLo}–${k.potHi}</small></span><span class="acad-trend">${trend}${spark(k.history)}</span></div>${actions}</li>`;
  }

  function baseTab(v) {
    const list = v.kids.length ? `<ul class="acad-grid">${v.kids.map((k) => kidCard(k, v)).join("")}</ul>` : `<p class="acad-empty">Sua base está vazia. A próxima admissão de jovens é em ${v.daysToIntake} dia(s); você também pode enviar olheiros.</p>`;
    return `<p class="acad-note">Lotação <b>${v.used}/${v.capacity}</b>${v.loanedCount ? ` · ${v.loanedCount} emprestado(s)` : ""} · próxima admissão em <b>${v.daysToIntake} dia(s)</b> · elenco principal <b>${v.squadSize}/${v.maxSquad}</b></p>${list}`;
  }

  function reportCard(r, v) {
    const full = v.free <= 0;
    const lock = r.state === "taken" ? "Já foi contratado por outro clube" : r.state === "gone" ? "Jogador indisponível" : r.state === "signed" ? "Já está na sua base" : full ? "Base lotada: promova ou dispense alguém" : v.budget < r.fee ? "Orçamento insuficiente" : "";
    return `<li class="acad-card"><div class="acad-card-top"><span class="acad-pos ${posClass(r.pos)}">${esc(r.pos)}</span><span class="acad-name"><b>${esc(r.name)}</b><small>${esc(nat(r.nationality))} · ${r.age} anos · ${esc(r.club)}</small></span><span class="acad-ovr"><b>${r.ovrLo}–${r.ovrHi}</b><small>GER</small></span></div>` +
      `<div class="acad-card-mid"><span class="acad-pot">${stars(r.stars)}<small>POT ${r.potLo}–${r.potHi}</small></span><span class="acad-fee">${money(r.fee)}</span></div>` +
      `<div class="acad-actions two"><button type="button" class="acad-btn primary" data-acad-sign="${esc(r.playerId)}" ${lock ? "disabled" : ""} title="${esc(lock || "Contratar para a base")}">Contratar</button><button type="button" class="acad-btn" data-acad-dismiss="${esc(r.id)}">Descartar</button></div>${lock ? `<small class="acad-lock">${esc(lock)}</small>` : ""}</li>`;
  }
  function reportsTab(v) {
    if (!v.reports.length) return `<p class="acad-empty">Nenhum relatório ainda. Envie um olheiro na aba Olheiros da base: os jovens que ele encontrar aparecem aqui.</p>`;
    return `<p class="acad-note">Relatórios recebidos: <b>${v.reports.length}</b> · vagas livres na base: <b>${v.free}</b> · orçamento <b>${money(v.budget)}</b></p><ul class="acad-grid">${v.reports.map((r) => reportCard(r, v)).join("")}</ul>`;
  }

  function scoutTab(v) {
    if (!form.country || !v.countries.some((c) => c.name === form.country)) form.country = v.countries[0]?.name || "";
    const r = v.rules, canSend = v.openSlots > 0 && v.budget >= r.missionCost && !!form.country;
    const why = !form.country ? "Escolha um país." : v.openSlots <= 0 ? "Todos os olheiros estão ocupados." : v.budget < r.missionCost ? "Orçamento insuficiente." : "";
    const ages = [15, 16, 17, 18, 19], starOpts = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
    const sel = (name, opts, cur, fmt) => `<select data-acad-f="${name}">${opts.map((o) => `<option value="${o}" ${Number(o) === Number(cur) ? "selected" : ""}>${fmt ? fmt(o) : o}</option>`).join("")}</select>`;
    const formHtml = `<div class="acad-form"><label>País<select data-acad-f="country">${v.countries.map((c) => `<option value="${esc(c.name)}" ${c.name === form.country ? "selected" : ""}>${esc(nat(c.name))} (${c.count})</option>`).join("")}</select></label>` +
      `<div class="acad-field"><span>Posições</span><div class="acad-chips">${POS.map((p) => `<button type="button" class="acad-chip${form.positions.includes(p) ? " on" : ""}" data-acad-pos="${p}" aria-pressed="${form.positions.includes(p)}">${p}</button>`).join("")}</div><small>${form.positions.length ? "" : "Qualquer posição"}</small></div>` +
      `<label>Idade mínima${sel("ageMin", ages, form.ageMin)}</label><label>Idade máxima${sel("ageMax", ages, form.ageMax)}</label>` +
      `<label>Potencial mínimo${sel("minStars", starOpts, form.minStars, (o) => starText(o) + " ★")}</label>` +
      `<div class="acad-send"><button type="button" class="acad-btn primary big" data-acad-mission ${canSend ? "" : "disabled"}>Enviar olheiro · ${money(r.missionCost)}</button><small>${why ? esc(why) : `Relatório em ${r.missionDays} dias, até ${r.missionResults} jovens.`}</small></div></div>`;
    const active = v.missions.filter((m) => m.status === "active"), done = v.missions.filter((m) => m.status === "complete").slice(0, 5);
    const mrow = (m) => `<li class="acad-mission"><span class="acad-mission-top"><b>${esc(nat(m.country))}</b><em>${m.status === "active" ? "Faltam " + m.remaining + " d" : m.results + " jovem(ns)"}</em></span><small>${m.positions.length ? esc(m.positions.join("/")) : "Qualquer posição"} · ${m.ageMin}–${m.ageMax} anos · ${starText(m.minStars)}★+</small>${m.status === "active" ? `<span class="acad-bar"><i style="width:${m.progress}%"></i></span><button type="button" class="acad-btn" data-acad-cancel="${m.id}">Cancelar</button>` : ""}</li>`;
    return `<p class="acad-note">Olheiros ocupados <b>${v.missions.filter((m) => m.status === "active").length}/${r.missionSlots}</b> · Rede de olheiros nível <b>${v.scoutLevel}</b></p>${formHtml}` +
      `<h3 class="acad-h">Em andamento</h3>${active.length ? `<ul class="acad-missions">${active.map(mrow).join("")}</ul>` : `<p class="acad-empty small">Nenhuma missão em andamento.</p>`}` +
      `<h3 class="acad-h">Concluídas</h3>${done.length ? `<ul class="acad-missions">${done.map(mrow).join("")}</ul>` : `<p class="acad-empty small">Nenhuma missão concluída.</p>`}`;
  }

  function aside(v) {
    const r = v.rules, n = v.nextRules, ns = v.nextScoutRules;
    const row = (label, cur, next, fmt = (x) => x) => `<li><span>${label}</span><b>${fmt(cur)}${next !== undefined && next !== cur ? `<em>→ ${fmt(next)}</em>` : ""}</b></li>`;
    const up = (id, lv, cost, label) => lv >= v.maxLevel ? `<span class="acad-max">${label}: nível máximo</span>` : `<button type="button" class="acad-btn primary full" data-acad-up="${id}" ${v.budget >= cost ? "" : "disabled"}>${label} nível ${lv + 1} · ${money(cost)}</button>${v.budget >= cost ? "" : `<small class="acad-lock">Orçamento insuficiente</small>`}`;
    return `<aside class="acad-aside" aria-label="Efeitos das instalações"><h3>Efeitos das instalações</h3>
      <p class="acad-asub">Academia · nível ${v.level}/${v.maxLevel}</p><ul class="acad-eff">${row("Lotação", r.capacity, n?.capacity)}${row("Jovens por admissão", r.intakeSize, n?.intakeSize)}${row("Admissão a cada", r.intakeEveryDays, n?.intakeEveryDays, (x) => x + " d")}${row("Chance de talentos", Math.round((r.qualityBoost - 1) * 100), n ? Math.round((n.qualityBoost - 1) * 100) : undefined, (x) => "+" + x + "%")}${row("Precisão do potencial", r.potentialSpread, n?.potentialSpread, (x) => "±" + x)}</ul>${up("academy", v.level, v.upgradeCost, "Academia")}
      <p class="acad-asub">Rede de olheiros · nível ${v.scoutLevel}/${v.maxLevel}</p><ul class="acad-eff">${row("Olheiros simultâneos", r.missionSlots, ns?.missionSlots)}${row("Prazo do relatório", r.missionDays, ns?.missionDays, (x) => x + " d")}${row("Jovens por relatório", r.missionResults, ns?.missionResults)}${row("Precisão do potencial", r.missionSpread, ns?.missionSpread, (x) => "±" + x)}</ul>${up("scouting", v.scoutLevel, v.scoutUpgradeCost, "Rede de olheiros")}</aside>`;
  }

  function html() {
    const ctx = root.ProLifeSM27Ctx?.();
    const Y = ctx?.D?.YouthAcademy;
    let body, v = null;
    if (!ctx?.s || ctx.s.mode !== "coach" || !Y) body = `<p class="acad-empty">A Academia fica disponível na carreira de treinador.</p>`;
    else if (!ctx.D.club(ctx.s)) body = `<p class="acad-empty">Assine com um clube para gerir a base.</p>`;
    else if (ctx.s.catalogVersion !== "fc27_v1") body = `<p class="acad-empty">A categoria de base está disponível nas carreiras FC 27.</p>`;
    else {
      v = Y.view(ctx.s, ctx.D);
      const tabs = [["base", "Jovens da base", v.kids.length], ["relatorios", "Relatórios", v.reports.length], ["olheiros", "Olheiros da base", 0]];
      const tabBar = `<nav class="acad-tabs" role="tablist">${tabs.map(([id, label, n]) => `<button type="button" role="tab" aria-selected="${tab === id}" class="${tab === id ? "on" : ""}" data-acad-tab="${id}">${label}${n ? ` <i>${n}</i>` : ""}</button>`).join("")}</nav>`;
      const main = tab === "base" ? baseTab(v) : tab === "relatorios" ? reportsTab(v) : scoutTab(v);
      body = `<div class="acad-layout"><div class="acad-main">${tabBar}${main}</div>${aside(v)}</div>`;
    }
    return `<div class="sm27-dialog-backdrop" data-acad-close></div><section class="sm27-dialog acad-dialog" role="dialog" aria-modal="true" aria-label="Academia"><header class="sm27-dialog-head"><span></span><h2>Academia</h2><button type="button" class="sm27-dialog-x" data-acad-close aria-label="Fechar">×</button></header><div class="sm27-dialog-body">${body}</div></section>`;
  }

  function open() {
    if (!layer) { layer = doc.createElement("div"); layer.className = "sm27-dialog-layer"; doc.body.appendChild(layer); doc.body.classList.remove("sm27-menu-open"); }
    const keep = layer.querySelector(".sm27-dialog-body")?.scrollTop || 0;
    layer.innerHTML = html();
    const b = layer.querySelector(".sm27-dialog-body");
    if (b) b.scrollTop = keep;
    if (!keep) layer.querySelector(".sm27-dialog-x")?.focus({ preventScroll: true });
  }
  function close() { if (layer) { layer.remove(); layer = null; } }
  const cmd = (action, data) => { const ok = root.ProLifeSM27Cmd?.(action, data); if (layer) open(); return ok; };

  doc.addEventListener("click", (ev) => {
    const t = ev.target instanceof Element ? ev.target : null;
    if (!t) return;
    if (t.closest("[data-sm27-academy]")) { ev.preventDefault(); tab = "base"; confirmId = null; open(); return; }
    if (!layer || !layer.contains(t)) return;
    if (t.closest("[data-acad-close]")) { close(); return; }
    const g = (a) => t.closest(`[${a}]`);
    let el;
    if ((el = g("data-acad-tab"))) { tab = el.dataset.acadTab; confirmId = null; const b = layer.querySelector(".sm27-dialog-body"); open(); if (b) layer.querySelector(".sm27-dialog-body").scrollTop = 0; return; }
    if ((el = g("data-acad-ask"))) { confirmId = el.dataset.acadAsk || null; open(); return; }
    if ((el = g("data-acad-promote")) && !el.disabled) { cmd("youthPromote", { id: el.dataset.acadPromote }); return; }
    if ((el = g("data-acad-release"))) { confirmId = null; cmd("youthRelease", { id: el.dataset.acadRelease }); return; }
    if ((el = g("data-acad-loan")) && !el.disabled) { cmd("youthLoan", { id: el.dataset.acadLoan }); return; }
    if ((el = g("data-acad-recall"))) { cmd("youthRecall", { id: el.dataset.acadRecall }); return; }
    if ((el = g("data-acad-sign")) && !el.disabled) { cmd("youthSign", { id: el.dataset.acadSign }); return; }
    if ((el = g("data-acad-dismiss"))) { cmd("youthDismissReport", { id: el.dataset.acadDismiss }); return; }
    if ((el = g("data-acad-cancel"))) { cmd("youthCancelMission", { id: Number(el.dataset.acadCancel) }); return; }
    if ((el = g("data-acad-up")) && !el.disabled) { cmd("upgradeFacility", { id: el.dataset.acadUp }); return; }
    if ((el = g("data-acad-pos"))) { const p = el.dataset.acadPos, i = form.positions.indexOf(p); if (i >= 0) form.positions.splice(i, 1); else form.positions.push(p); open(); return; }
    if ((el = g("data-acad-mission")) && !el.disabled) {
      if (cmd("youthStartMission", { country: form.country, positions: form.positions.slice(), ageMin: form.ageMin, ageMax: form.ageMax, minStars: form.minStars })) { /* permanece na aba para ver a missão */ }
    }
  }, true);
  doc.addEventListener("change", (ev) => {
    const t = ev.target instanceof Element ? ev.target : null;
    const f = t?.closest?.("[data-acad-f]");
    if (!layer || !f) return;
    const k = f.dataset.acadF, val = f.value;
    if (k === "country") form.country = val;
    else form[k] = Number(val);
    if (form.ageMin > form.ageMax) { if (k === "ageMin") form.ageMax = form.ageMin; else form.ageMin = form.ageMax; }
    open();
  });
  doc.addEventListener("keydown", (ev) => { if (layer && ev.key === "Escape") close(); });

  root.ProLifeSM27Academy = { open, close, html };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeSM27Academy;
})(typeof window !== "undefined" ? window : globalThis);
