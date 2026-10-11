(function (root) {
  "use strict";
  // Stage 33A - assinatura de contrato e apresentacao oficial (UI pura: recebe um modelo ja formatado e devolve HTML).
  // Nao le nem altera o estado da carreira. Campos ausentes (null/undefined) simplesmente nao sao exibidos.
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const has = (v) => v !== null && v !== undefined && v !== "";
  const color = (c) => (/^#[0-9a-f]{3,8}$/i.test(c || "") ? c : null);
  const initials = (n) => String(n || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase() || "?";
  const STEPS = ["Reunião", "Contrato", "Confirmação"];
  const SIGN_PATH = "M6 46 C 18 6, 34 70, 50 32 S 78 8, 92 40 S 118 58, 132 22 S 160 18, 176 44 L 196 30";

  function rows(m) {
    const loan = m.type === "loan";
    return [
      ["Clube", m.clubName],
      ["Modalidade", has(m.type) ? (loan ? "Empréstimo" : "Contrato definitivo") : null],
      ["Salário", m.salary],
      ["Luvas de assinatura", m.bonus],
      ["Duração", m.duration],
      ["Papel no elenco", m.role],
      [m.future ? "Transferência prevista" : "Início", m.startText],
    ].filter(([, v]) => has(v));
  }
  function crest(m) {
    return `<span class="cine-crest" aria-hidden="true">${esc(initials(m.clubName))}</span>`;
  }
  // Documento do contrato. state: "draft" (sem assinatura), "signing" (assinatura animada) ou "signed" (assinatura fixa).
  function documentHtml(m, state) {
    const sig = state === "draft" ? `<span class="cine-sig-empty">Assinatura do atleta</span>`
      : `<svg class="cine-sig ${state === "signing" ? "draw" : "done"}" viewBox="0 0 204 76" role="img" aria-label="Assinatura do atleta"><path d="${SIGN_PATH}" pathLength="1"/></svg>`;
    const stamp = state !== "draft" ? `<div class="cine-stamp ${state === "signing" ? "pop" : ""}" aria-label="${m.future ? "Acordo registrado" : "Contrato oficial"}">${m.future ? "ACORDO REGISTRADO" : "CONTRATO OFICIAL"}</div>` : "";
    return `<article class="cine-doc ${state}" aria-label="Contrato">
<header>${crest(m)}<div><small>${m.type === "loan" ? "TERMO DE EMPRÉSTIMO" : "CONTRATO DE ATLETA PROFISSIONAL"}</small><h3>${esc(m.clubName)}</h3>${has(m.place) ? `<p>${esc(m.place)}</p>` : ""}</div></header>
<dl>${rows(m).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
${m.future && has(m.fromClub) ? `<p class="cine-note">Você continua no <b>${esc(m.fromClub)}</b> até a transferência. Nada muda no seu clube atual antes disso.</p>` : ""}
<footer><div class="cine-sigline">${sig}<small>${esc(m.athlete || "Atleta")}${has(m.signedOn) && state !== "draft" ? " · " + esc(m.signedOn) : ""}</small></div>${stamp}</footer></article>`;
  }
  function stepper(step) {
    return `<ol class="cine-steps" aria-label="Etapas">${STEPS.map((s, i) => `<li class="${i + 1 < step ? "done" : i + 1 === step ? "now" : ""}" ${i + 1 === step ? 'aria-current="step"' : ""}><i>${i + 1}</i>${s}</li>`).join("")}</ol>`;
  }
  function shell(kind, step, m, body, label) {
    const c = color(m.clubColor);
    return `<div class="cine" role="dialog" aria-modal="true" aria-label="${esc(label)}" data-kind="${esc(kind)}" data-step="${step}" ${c ? `style="--club:${c}"` : ""}>
<div class="cine-bg" aria-hidden="true"></div><div class="cine-bar top"></div><div class="cine-bar bottom"></div>
<div class="cine-top">${kind === "sign" ? stepper(step) : "<span></span>"}<div class="cine-tools">${kind === "sign" || kind === "present" ? `<button type="button" class="cine-skip" data-cine-skip>Pular animação</button>` : ""}<button type="button" class="cine-x" data-cine-close aria-label="Fechar">Fechar ✕</button></div></div>
<div class="cine-body">${body}</div></div>`;
  }
  function meeting(m) {
    const lines = [`Queremos você no ${esc(m.clubName)}.`];
    if (has(m.role)) lines.push(`Seu papel no elenco: <b>${esc(m.role)}</b>.`);
    if (has(m.salary)) lines.push(`Proposta salarial: <b>${esc(m.salary)}</b>${has(m.duration) ? ` por ${esc(m.duration)}` : ""}.`);
    lines.push(m.future ? `${has(m.fromClub) ? "A mudança só acontece" : "O contrato só começa"} na próxima janela${has(m.startText) ? ` (<b>${esc(m.startText)}</b>)` : ""}${has(m.fromClub) ? `; até lá você segue no ${esc(m.fromClub)}` : ""}.` : "Se estiver de acordo, vamos ao contrato.");
    return `<section class="cine-scene"><div class="cine-rep">${crest(m)}<small>Representante do clube</small></div><div class="cine-bubble"><b>${esc(m.clubName)}</b>${lines.map((l, i) => `<p style="--i:${i}">${l}</p>`).join("")}</div></section>
<div class="cine-actions"><button type="button" class="primary gold" data-cine-next>Ver o contrato</button><button type="button" data-cine-close>Agora não</button></div>`;
  }
  function review(m) {
    return `<h2 class="cine-title">Revise e assine</h2>${documentHtml(m, "draft")}
<div class="cine-actions"><button type="button" class="primary gold" data-cine-sign>Assinar contrato</button><button type="button" data-cine-back>Voltar</button></div>
<p class="cine-fine">${m.future ? "O acordo será registrado agora e a transferência ocorrerá na data prevista." : "A assinatura confirma a transferência imediatamente."} Salário e luvas são aplicados uma única vez.</p>`;
  }
  function confirmation(m) {
    const done = m.effective;
    return `<h2 class="cine-title">${done ? "Contrato assinado" : "Acordo registrado"}</h2>${documentHtml(m, "signing")}
<p class="cine-result">${done ? `Bem-vindo ao <b>${esc(m.clubName)}</b>.` : has(m.fromClub) ? `Você continua no <b>${esc(m.fromClub)}</b> até ${has(m.startText) ? `<b>${esc(m.startText)}</b>` : "a próxima janela"}. O clube só muda nessa data.` : `Seu contrato começa em ${has(m.startText) ? `<b>${esc(m.startText)}</b>` : "na próxima janela"}.`}</p>
<div class="cine-actions">${done ? `<button type="button" class="primary gold" data-cine-present>Apresentação oficial</button>` : `<button type="button" class="primary gold" data-cine-close>Concluir</button>`}${done ? `<button type="button" data-cine-close>Concluir</button>` : `<button type="button" data-cine-agreement>Visualizar acordo</button>`}</div>`;
  }
  function agreement(m) {
    const steps = [[m.signedOn, "Acordo assinado", true], [m.startText, m.future ? "Transferência prevista" : "Início do contrato", !m.future]];
    return `<h2 class="cine-title">${m.future ? "Acordo assinado" : "Contrato assinado"}</h2>${documentHtml(m, "signed")}
<ul class="cine-timeline">${steps.filter(([d]) => has(d)).map(([d, t, ok]) => `<li class="${ok ? "ok" : ""}"><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join("")}</ul>
<div class="cine-actions">${m.canReplay ? `<button type="button" class="primary gold" data-cine-present>Rever apresentação</button>` : ""}<button type="button" data-cine-close>Fechar</button></div>`;
  }
  function presentation(m) {
    const c = color(m.clubColor);
    return `<section class="cine-present"><div class="cine-shirt" ${c ? `style="--club:${c}"` : ""} role="img" aria-label="Camisa do ${esc(m.clubName)}"><span class="collar"></span><b>${esc(initials(m.clubName))}</b>${has(m.number) ? `<em>${esc(m.number)}</em>` : ""}</div>
<div class="cine-welcome"><small>APRESENTAÇÃO OFICIAL</small><h2>Bem-vindo ao ${esc(m.clubName)}</h2>${has(m.athlete) ? `<p class="who">${esc(m.athlete)}</p>` : ""}${has(m.place) ? `<p>${esc(m.place)}</p>` : ""}</div>
<dl class="cine-chal">${[["Novo desafio", has(m.role) ? "Papel de " + m.role : null], ["Competição", m.league], ["Estádio", m.stadium], ["Contrato", [m.duration, m.salary].filter(has).join(" · ") || null]].filter(([, v]) => has(v)).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl></section>
<div class="cine-actions"><button type="button" class="primary gold" data-cine-close>Entrar em campo</button></div>`;
  }

  function render(kind, step, m) {
    m = m || {};
    if (kind === "present") return shell("present", 1, m, presentation(m), "Apresentação oficial");
    if (kind === "agreement") return shell("agreement", 1, m, agreement(m), "Contrato assinado");
    const body = step <= 1 ? meeting(m) : step === 2 ? review(m) : confirmation(m);
    return shell("sign", step <= 1 ? 1 : step === 2 ? 2 : 3, m, body, "Assinatura de contrato");
  }
  const api = { render, documentHtml, STEPS };
  root.ProLifeContractSigning = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
