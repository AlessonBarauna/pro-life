/* Tela de Novidades: aparece uma vez depois de cada atualização e pode ser reaberta em Salvar. */
(function (root) {
  "use strict";
  const KEY = "prolife.changelog.seen";
  const LABEL = { novo: "Novo", ajuste: "Ajustado", correcao: "Corrigido" };
  const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const read = () => { try { return root.localStorage.getItem(KEY); } catch (e) { return null; } };
  const write = (id) => { try { root.localStorage.setItem(KEY, id); } catch (e) { /* sem armazenamento: mostra de novo na próxima vez */ } };
  const entries = () => (root.ProLifeChangelog && root.ProLifeChangelog.ENTRIES) || [];
  function fmtDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));
    const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    return m ? Number(m[3]) + " " + meses[Number(m[2]) - 1] + " " + m[1] : String(iso);
  }
  // Entradas que o jogador ainda não viu (mais novas que a última vista); sem registro, as 3 mais recentes.
  function unseen(all, seenId) {
    const at = all.findIndex((e) => e.id === seenId);
    if (at === 0) return [];
    return at > 0 ? all.slice(0, at) : all.slice(0, 3);
  }
  function css() {
    if (document.getElementById("changelog-css")) return;
    const st = document.createElement("style");
    st.id = "changelog-css";
    st.textContent = `
#changelog-layer{position:fixed;inset:0;z-index:99990;display:grid;place-items:center;padding:max(10px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left));background:rgba(3,10,16,.78)}
#changelog-layer .cl{width:min(760px,100%);max-height:100%;display:grid;grid-template-rows:auto minmax(0,1fr) auto;border-radius:16px;overflow:hidden;background:#0b1b29;border:1px solid #274256;color:#e8f1f6;font-family:inherit;box-shadow:0 18px 50px rgba(0,0,0,.55)}
#changelog-layer .cl-head{display:flex;align-items:baseline;gap:12px;padding:12px 18px;border-bottom:1px solid #1d3547;background:linear-gradient(100deg,#12303f,#0b1b29 70%)}
#changelog-layer .cl-head h2{margin:0;font-size:19px;letter-spacing:.2px;text-transform:none}#changelog-layer .cl-head small{color:#8fb0c2;font-size:12px}
#changelog-layer .cl-body{overflow:auto;padding:6px 18px 10px;-webkit-overflow-scrolling:touch}
#changelog-layer .cl-ver{padding:10px 0 4px;border-bottom:1px dashed #23404f}#changelog-layer .cl-ver:last-child{border-bottom:0}
#changelog-layer .cl-ver h3{display:flex;justify-content:space-between;gap:10px;margin:0 0 6px;font-size:14px}#changelog-layer .cl-ver h3 time{color:#8fb0c2;font-weight:400;font-size:11.5px;white-space:nowrap}
#changelog-layer ul{list-style:none;margin:0;padding:0;display:grid;gap:5px}
#changelog-layer li{display:grid;grid-template-columns:96px minmax(0,1fr);gap:9px;align-items:start;font-size:13px;line-height:1.35}
#changelog-layer .tag{justify-self:start;padding:1px 8px;border-radius:5px;font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;border:1px solid}
#changelog-layer .tag.novo{color:#c9ff3a;border-color:#6b8f1c;background:#1b2a10}#changelog-layer .tag.ajuste{color:#7fd0ff;border-color:#2c6a8c;background:#0f2431}#changelog-layer .tag.correcao{color:#ffb454;border-color:#8c5a1c;background:#2a1d0d}
#changelog-layer .cl-foot{display:flex;justify-content:flex-end;padding:9px 18px;border-top:1px solid #1d3547;background:#0a1823}
#changelog-layer .cl-foot button{min-height:38px;padding:0 22px;border-radius:10px;border:0;background:#c9ff3a;color:#10200a;font:inherit;font-weight:800;cursor:pointer}
@media (max-height:480px){#changelog-layer .cl-head{padding:8px 16px}#changelog-layer .cl-head h2{font-size:16px}#changelog-layer .cl-foot{padding:6px 16px}#changelog-layer .cl-foot button{min-height:34px}#changelog-layer li{font-size:12px}}`;
    document.head.appendChild(st);
  }
  function open(forceAll) {
    const all = entries();
    if (!all.length || document.getElementById("changelog-layer")) return false;
    const list = forceAll ? all.slice(0, 8) : unseen(all, read());
    if (!list.length) return false;
    css();
    const layer = document.createElement("div");
    layer.id = "changelog-layer";
    layer.setAttribute("role", "dialog");
    layer.setAttribute("aria-modal", "true");
    layer.setAttribute("aria-label", "Novidades do jogo");
    layer.innerHTML = '<section class="cl"><header class="cl-head"><h2>' + (forceAll ? "Histórico de novidades" : "O que mudou nesta atualização") + "</h2><small>" + esc(fmtDate(list[0].date)) + "</small></header><div class=\"cl-body\">" +
      list.map((e) => '<article class="cl-ver"><h3><span>' + esc(e.title) + "</span><time>" + esc(fmtDate(e.date)) + "</time></h3><ul>" +
        e.items.map((i) => '<li><span class="tag ' + esc(i.t) + '">' + esc(LABEL[i.t] || i.t) + "</span><span>" + esc(i.x) + "</span></li>").join("") + "</ul></article>").join("") +
      '</div><footer class="cl-foot"><button type="button" data-cl-close>Entendi</button></footer></section>';
    const close = () => { write(all[0].id); layer.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (ev) => { if (ev.key === "Escape") close(); };
    layer.querySelector("[data-cl-close]").addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    document.body.appendChild(layer);
    layer.querySelector("[data-cl-close]").focus();
    return true;
  }
  function boot() { setTimeout(() => open(false), 1500); }
  const api = { open, unseen, KEY };
  root.ProLifeChangelogView = api;
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  }
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
