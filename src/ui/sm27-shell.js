(function (root) {
  "use strict";
  // PRO LIFE — Ajuda (Manual do Treinador) e Definições (Jogo/Dados).
  // Janelas independentes do render do jogo: ficam no <body> e sobrevivem às
  // re-renderizações. Abrem por [data-sm27-help] e [data-sm27-settings].

  const doc = root.document;
  if (!doc) return;
  const PREF_KEY = "prolife.v1.uiPrefs";
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- preferências de interface (só visuais; nunca tocam no save) ----------
  function readPrefs() {
    try { return JSON.parse(root.localStorage.getItem(PREF_KEY) || "{}") || {}; } catch { return {}; }
  }
  function writePrefs(next) {
    try { root.localStorage.setItem(PREF_KEY, JSON.stringify(next)); } catch { /* sem armazenamento */ }
  }
  function applyPrefs() {
    const prefs = readPrefs();
    doc.documentElement.classList.toggle("pl-reduce-motion", prefs.reduceMotion === true);
    doc.documentElement.classList.toggle("pl-large-text", prefs.largeText === true);
  }

  // ---------- conteúdo do manual (texto próprio do PRO LIFE) ----------
  const TOPICS = [
    ["inicio", "Início", "Perspetiva geral", [
      ["A Central", "É a tela principal da carreira. Mostra o próximo compromisso, a semana do calendário, a situação nas competições, o resumo da temporada e os alertas. Toque em qualquer bloco para abrir a área correspondente."],
      ["Avançar no tempo", "O botão \"Pular 1 dia\" fica sempre na barra superior. Para saltar mais, abra a Central: ali há \"Até o próximo jogo\", \"+30 dias\" e \"Até o fim da temporada\". A simulação para sozinha quando surge uma decisão que precisa de você."],
      ["Caixa de entrada", "Reúne mensagens, propostas e decisões pendentes. As mensagens têm botões que levam direto à tela certa, como negociação ou renovação."]
    ]],
    ["novo", "Nova carreira", "Como começar", [
      ["Escolha da carreira", "Você pode começar como jogador ou como treinador. No jogador, define perfil, posição e primeiro projeto. No treinador, escolhe o clube, a comissão e o cenário financeiro."],
      ["Importar e carregar", "Na tela inicial, \"Carregar jogo\" lista os saves guardados neste aparelho e \"Importar\" lê um arquivo exportado antes."]
    ]],
    ["plantel", "Plantel", "Elenco e jogadores", [
      ["Campo e banco", "O Elenco mostra o time titular no campo e o banco ao lado. Toque num jogador para ver a ficha completa: atributos, contrato, condição e moral."],
      ["Relatórios do plantel", "Acompanhe lesões, suspensões, moral, contratos e jovens em desenvolvimento para antecipar problemas antes da partida."]
    ]],
    ["taticas", "Táticas", "Formação e instruções", [
      ["Formação", "Escolha o esquema (4-4-2, 4-3-3, 3-5-2 e outros). A mudança reposiciona o time no campo."],
      ["Instruções e funções", "Defina o estilo de jogo e o papel de cada jogador. Funções diferentes pedem atributos diferentes; o jogo mostra o encaixe de cada atleta."]
    ]],
    ["calendario", "Calendário", "Agenda da temporada", [
      ["Mês a mês", "O calendário mostra todos os jogos da temporada. Toque em um dia para ver o compromisso e abrir o relatório de partidas anteriores."],
      ["Amistosos", "Em semanas sem jogo oficial é possível marcar amistosos para dar ritmo ao elenco."]
    ]],
    ["competicoes", "Competições", "Ligas e copas", [
      ["Tabelas", "Veja classificação, jogos e calendário de cada liga, separando competições nacionais, continentais e internacionais."],
      ["Estatísticas e prêmios", "Artilheiros, assistências, cartões e prêmios individuais de cada competição ficam em abas próprias."]
    ]],
    ["transferencias", "Transferências", "Mercado", [
      ["Buscar jogadores", "Use a busca por nome, clube, posição, idade e valor. Os resultados abrem o perfil, com relatório de observação e contrato."],
      ["Negociar", "Cada negociação tem etapas: sondagem, proposta, contraproposta e acordo. O jogador e o clube podem recusar."],
      ["Janelas", "Compras e vendas só acontecem com a janela de transferências aberta."]
    ]],
    ["treinador", "Treinador", "Carreira do técnico", [
      ["Perfil", "Mostra reputação, confiança da diretoria, histórico e contrato. Resultados ruins reduzem a confiança e podem levar à demissão."],
      ["Comissão técnica", "Auxiliares e preparadores influenciam treino, leitura de jogo e recuperação."]
    ]],
    ["treino", "Treino", "Evolução da equipe", [
      ["Plano de treino", "Escolha o foco da semana. O treino melhora atributos, mas aumenta o cansaço; equilibre com descanso."],
      ["Equipes e juventude", "A equipe principal, a reserva e a base têm treinos próprios."]
    ]],
    ["financas", "Finanças", "Dinheiro do clube", [
      ["Orçamento", "Há um orçamento de transferências e uma folha salarial. Gastar acima do limite bloqueia contratações."],
      ["Receitas", "Bilheteria, direitos de TV, patrocínio e prêmios compõem as receitas do clube."]
    ]],
    ["observar", "Observar", "Olheiros", [
      ["Relatórios", "Um jogador observado revela, aos poucos, faixas de overall e potencial. Quanto mais tempo de observação, mais precisa a estimativa."],
      ["Olheiros", "Cada olheiro tem especialidade e região. Um olheiro compatível aumenta a confiança do relatório."]
    ]],
    ["clube", "Zona do Clube", "Instalações", [
      ["Instalações", "Estádio, centro de treino e academia influenciam receitas, evolução e formação de jovens."]
    ]],
    ["juventude", "Juventude", "Base", [
      ["Categorias de base", "Jovens promissores aparecem na base. Acompanhe o desenvolvimento e promova quando estiverem prontos."]
    ]],
    ["dia", "Dia de jogo", "Partida", [
      ["Antes do jogo", "Confira escalação, condição física e instruções. Lesionados e suspensos ficam indisponíveis."],
      ["Durante o jogo", "Acompanhe a partida ao vivo e faça substituições. Também é possível simular até o fim."]
    ]],
    ["perfil", "Perfil", "Seu personagem", [
      ["Jogador", "Atributos, forma, contrato, personalidade e relação com o treinador definem sua evolução."]
    ]],
    ["glossario", "Glossário", "Termos", [
      ["GER", "Overall geral do jogador, de 0 a 99."],
      ["POT", "Potencial: o nível máximo estimado que o jogador pode alcançar."],
      ["Moral", "Estado de espírito do atleta. Moral baixa reduz o rendimento e pode causar pedidos de saída."],
      ["Condição", "Estado físico. Jogar cansado aumenta o risco de lesão."]
    ]]
  ];

  // ---------- janela ----------
  let layer = null;
  let lastFocus = null;

  function close() {
    if (!layer) return;
    layer.remove();
    layer = null;
    doc.body.classList.remove("sm27-dialog-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function open(kind, view) {
    if (!layer) {
      lastFocus = doc.activeElement;
      layer = doc.createElement("div");
      layer.className = "sm27-dialog-layer";
      doc.body.appendChild(layer);
      doc.body.classList.add("sm27-dialog-open");
      // fecha o menu lateral do celular, se estiver aberto
      doc.body.classList.remove("sm27-menu-open");
    }
    layer.dataset.kind = kind;
    if (kind === "help") renderHelp(view);
    else renderSettings(view);
    const first = layer.querySelector("[data-sm27-dialog-focus]") || layer.querySelector("button");
    if (first) first.focus({ preventScroll: true });
  }

  function frame(title, body, { back } = {}) {
    layer.innerHTML = `<div class="sm27-dialog-backdrop" data-sm27-close></div>` +
      `<section class="sm27-dialog" role="dialog" aria-modal="true" aria-label="${esc(title)}">` +
      `<header class="sm27-dialog-head">${back ? `<button type="button" class="sm27-dialog-back" data-sm27-dialog-back="${esc(back)}" aria-label="Voltar">‹</button>` : "<span></span>"}` +
      `<h2>${esc(title)}</h2><button type="button" class="sm27-dialog-x" data-sm27-close aria-label="Fechar">×</button></header>` +
      `<div class="sm27-dialog-body">${body}</div></section>`;
  }

  // ---------- Ajuda ----------
  function renderHelp(view) {
    if (view && view.startsWith("topic:")) {
      const t = TOPICS.find((x) => x[0] === view.slice(6));
      if (t) {
        frame("Ajuda", `<p class="shd-sub">${esc(t[1])}</p><div class="shd-help-text">${t[3].map(([h, p]) => `<section><h3>${esc(h)}</h3><p>${esc(p)}</p></section>`).join("")}</div>`, { back: "manual" });
        return;
      }
    }
    if (view === "manual") {
      frame("Ajuda", `<p class="shd-sub">Manual do Treinador</p><div class="shd-topic-grid">${TOPICS.map((t) => `<button type="button" data-sm27-help-topic="${t[0]}">${esc(t[1])}</button>`).join("")}</div>`, { back: "home" });
      return;
    }
    frame("Ajuda", `<div class="shd-help-home"><button type="button" class="shd-cta" data-sm27-dialog-focus data-sm27-help-view="bug">Relatório de erro</button><button type="button" class="shd-cta" data-sm27-help-view="manual">Manual do Treinador</button></div>`);
  }

  function bugReport() {
    const info = [
      "PRO LIFE — relatório de erro",
      "Data: " + new Date().toISOString(),
      "Tela: " + (root.innerWidth + "x" + root.innerHeight) + " @" + (root.devicePixelRatio || 1) + "x",
      "Navegador: " + (root.navigator?.userAgent || "?"),
      "Página: " + (doc.querySelector("[data-page-stage]")?.getAttribute("data-page-stage") || "inicial")
    ].join("\n");
    const done = (msg) => { const n = layer?.querySelector(".shd-note"); if (n) n.textContent = msg; };
    if (root.navigator?.clipboard?.writeText) root.navigator.clipboard.writeText(info).then(() => done("Informações copiadas. Cole na mensagem ao relatar o problema."), () => done(info));
    else done(info);
  }

  // ---------- Definições ----------
  function renderSettings(view) {
    const tab = view === "dados" ? "dados" : "jogo";
    const prefs = readPrefs();
    const toggle = (key, label, hint) => `<div class="shd-row"><span><b>${label}</b>${hint ? `<small>${hint}</small>` : ""}</span><button type="button" class="shd-switch${prefs[key] ? " on" : ""}" role="switch" aria-checked="${prefs[key] ? "true" : "false"}" data-sm27-pref="${key}"><i></i></button></div>`;
    const inGame = !!doc.querySelector(".game-shell");
    let body;
    if (tab === "jogo") {
      body = `<div class="shd-list">` +
        `<div class="shd-row"><span><b>Idioma</b></span><select disabled aria-label="Idioma"><option>Português</option></select></div>` +
        toggle("reduceMotion", "Reduzir animações", "Menos movimento nas transições") +
        toggle("largeText", "Texto maior", "Aumenta a fonte base da interface") +
        (inGame ? `<div class="shd-row"><span><b>Salvar agora</b><small>Grava a carreira neste aparelho</small></span><button type="button" class="shd-btn" data-action="export" data-sm27-close>Salvar</button></div>` : "") +
        (inGame ? `<div class="shd-row"><span><b>Configurações da carreira</b><small>Regras do modo treinador</small></span><button type="button" class="shd-btn" data-coach-settings-open data-sm27-close>Abrir</button></div>` : "") +
        `</div><footer class="sm27-dialog-foot">${inGame ? `<button type="button" class="shd-danger" data-action="careers" data-sm27-close>Sair do jogo</button>` : ""}<button type="button" class="shd-btn" data-sm27-help-open>Ajuda</button></footer>`;
    } else {
      body = `<div class="shd-list">` +
        `<div class="shd-row"><span><b>Saves e backup</b><small>Salvar, exportar, importar e trocar de carreira</small></span><button type="button" class="shd-btn" data-page="save" data-sm27-close>Abrir</button></div>` +
        `<div class="shd-row"><span><b>Importar carreira</b><small>Lê um arquivo exportado antes</small></span><button type="button" class="shd-btn" data-action="import" data-sm27-close>Importar</button></div>` +
        `<div class="shd-row"><span><b>Termos de uso</b></span><button type="button" class="shd-btn" data-sm27-settings-view="termos">Ver</button></div>` +
        `<div class="shd-row"><span><b>Política de privacidade</b></span><button type="button" class="shd-btn" data-sm27-settings-view="privacidade">Ver</button></div>` +
        `<div class="shd-row"><span><b>Apagar dados deste navegador</b><small>Remove saves e preferências do PRO LIFE aqui</small></span><button type="button" class="shd-danger" data-sm27-settings-view="apagar">Apagar</button></div>` +
        `</div>`;
    }
    const tabs = `<nav class="shd-tabs" role="tablist"><button type="button" role="tab" aria-selected="${tab === "jogo"}" data-sm27-settings-view="jogo">Jogo</button><button type="button" role="tab" aria-selected="${tab === "dados"}" data-sm27-settings-view="dados">Dados</button></nav>`;
    frame("Definições", tabs + body);
  }

  function renderInfo(kind) {
    if (kind === "termos") {
      frame("Termos de uso", `<div class="shd-help-text"><section><h3>Uso do jogo</h3><p>O PRO LIFE é um simulador de carreira de futebol offline, feito para diversão. Nomes, resultados e valores são fictícios ou estimados e não representam fatos reais.</p></section><section><h3>Responsabilidade</h3><p>O jogo é fornecido como está. Faça exportações regulares das suas carreiras.</p></section></div>`, { back: "settings:dados" });
    } else if (kind === "privacidade") {
      frame("Política de privacidade", `<div class="shd-help-text"><section><h3>Seus dados</h3><p>O PRO LIFE funciona offline. Saves e preferências ficam apenas neste navegador, no armazenamento local. Nada é enviado para servidores.</p></section><section><h3>Controle</h3><p>Você pode exportar suas carreiras ou apagar tudo em Definições › Dados.</p></section></div>`, { back: "settings:dados" });
    } else {
      frame("Apagar dados", `<div class="shd-help-text"><section><h3>Isto remove todos os saves deste navegador</h3><p>A ação não pode ser desfeita. Exporte suas carreiras antes se quiser guardá-las. Para confirmar, digite APAGAR.</p></section></div><div class="shd-list"><div class="shd-row"><input type="text" class="shd-input" data-sm27-confirm autocomplete="off" aria-label="Digite APAGAR para confirmar" placeholder="APAGAR"><button type="button" class="shd-danger" data-sm27-wipe disabled>Apagar tudo</button></div></div>`, { back: "settings:dados" });
    }
  }

  function wipe() {
    try {
      const keys = [];
      for (let i = 0; i < root.localStorage.length; i++) { const k = root.localStorage.key(i); if (k && k.startsWith("prolife.")) keys.push(k); }
      keys.forEach((k) => root.localStorage.removeItem(k));
    } catch { /* sem armazenamento */ }
    root.location.reload();
  }

  // ---------- eventos ----------
  doc.addEventListener("click", (ev) => {
    const t = ev.target instanceof Element ? ev.target : null;
    if (!t) return;
    const sc = t.closest("[data-sm27-scroll]");
    if (sc) { doc.getElementById(sc.dataset.sm27Scroll)?.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    if (t.closest("[data-sm27-goto='tactics']")) { setTimeout(() => doc.querySelector("[data-squad-tab='tactics']")?.click(), 80); }
    if (t.closest("[data-sm27-help]")) { ev.preventDefault(); open("help", "home"); return; }
    if (t.closest("[data-sm27-settings]")) { ev.preventDefault(); open("settings", "jogo"); return; }
    if (!layer) return;
    if (t.closest("[data-sm27-close]")) { setTimeout(close, 0); return; }
    const topic = t.closest("[data-sm27-help-topic]");
    if (topic) { open("help", "topic:" + topic.dataset.sm27HelpTopic); return; }
    const hv = t.closest("[data-sm27-help-view]");
    if (hv) {
      if (hv.dataset.sm27HelpView === "bug") {
        const body = layer.querySelector(".sm27-dialog-body");
        if (body && !body.querySelector(".shd-note")) body.insertAdjacentHTML("beforeend", `<p class="shd-note" role="status"></p>`);
        bugReport();
      } else open("help", hv.dataset.sm27HelpView);
      return;
    }
    if (t.closest("[data-sm27-help-open]")) { open("help", "home"); return; }
    const back = t.closest("[data-sm27-dialog-back]");
    if (back) { const to = back.dataset.sm27DialogBack; if (to.startsWith("settings:")) open("settings", to.slice(9)); else open("help", to); return; }
    const sv = t.closest("[data-sm27-settings-view]");
    if (sv) { const v = sv.dataset.sm27SettingsView; if (v === "jogo" || v === "dados") open("settings", v); else { renderInfo(v); const f = layer.querySelector("input,button"); if (f) f.focus(); } return; }
    const pref = t.closest("[data-sm27-pref]");
    if (pref) { const prefs = readPrefs(); prefs[pref.dataset.sm27Pref] = !prefs[pref.dataset.sm27Pref]; writePrefs(prefs); applyPrefs(); renderSettings(layer.querySelector("[data-sm27-settings-view][aria-selected='true']")?.dataset.sm27SettingsView || "jogo"); return; }
    if (t.closest("[data-sm27-wipe]")) { wipe(); }
  }, true);

  doc.addEventListener("input", (ev) => {
    const t = ev.target;
    if (!(t instanceof Element) || !t.matches("[data-sm27-confirm]")) return;
    const btn = layer?.querySelector("[data-sm27-wipe]");
    if (btn) btn.disabled = String(t.value).trim().toUpperCase() !== "APAGAR";
  });

  doc.addEventListener("keydown", (ev) => {
    if (!layer) return;
    if (ev.key === "Escape") { close(); return; }
    if (ev.key !== "Tab") return;
    const items = [...layer.querySelectorAll("button:not([disabled]),input,select:not([disabled])")];
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (ev.shiftKey && doc.activeElement === first) { ev.preventDefault(); last.focus(); }
    else if (!ev.shiftKey && doc.activeElement === last) { ev.preventDefault(); first.focus(); }
  });

  applyPrefs();
  root.ProLifeSM27Shell = { open, close, TOPICS: TOPICS.map((t) => t[0]), applyPrefs };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeSM27Shell;
})(typeof window !== "undefined" ? window : globalThis);
