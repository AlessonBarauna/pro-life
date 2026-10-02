(function (root) {
  "use strict";
  const keys = ["pace", "finish", "pass", "defense", "strength", "stamina"],
    names = ["VEL", "FIN", "PAS", "DEF", "FOR", "RES"];
  function radar(attrs) {
    const xy = (i, r) => [
      185 + Math.sin((i * Math.PI) / 3) * r,
      135 - Math.cos((i * Math.PI) / 3) * r,
    ];
    const points = (r) => keys.map((k, i) => xy(i, r).join(",")).join(" ");
    return `<svg class="radar-chart" viewBox="0 0 370 270" role="img" aria-label="Distribuição dos seis atributos de futebol"><g fill="none" stroke="#cad0d4" stroke-width="1">${[0.25, 0.5, 0.75, 1].map((v) => `<polygon points="${points(v * 97)}"/>`).join("")}${keys.map((k, i) => `<path d="M185 135L${xy(i, 97).join(" ")}"/>`).join("")}</g><polygon points="${keys.map((k, i) => xy(i, (97 * Math.max(0, Math.min(100, Number(attrs[k]) || 0))) / 100).join(",")).join(" ")}" fill="#236bcc" fill-opacity=".2" stroke="#236bcc" stroke-width="2"/>${keys
      .map((k, i) => {
        const [x, y] = xy(i, 122);
        return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" fill="#38424a" font-size="11" font-weight="700">${names[i]} ${Math.round(Number(attrs[k]) || 0)}</text>`;
      })
      .join("")}</svg>`;
  }
  function evolution(entries, key = "overall") {
    const list = (entries || []).slice(-26);
    if (!list.length) return "<p>Nenhum registro disponível.</p>";
    const values = list.map((e) => (key === "overall" ? e.overall : e.attrs[key])),
      min = Math.max(0, Math.min(...values) - 2),
      max = Math.min(100, Math.max(...values) + 2),
      start = list[0].day,
      end = list.at(-1).day,
      range = Math.max(1, end - start),
      span = Math.max(1, max - min);
    const coords = list.map((e, i) => [
      46 + ((e.day - start) / range) * 574,
      186 - ((values[i] - min) / span) * 138,
    ]);
    return `<svg class="evolution-chart" viewBox="0 0 660 238" role="img" aria-label="Evolução real do atributo registrado no save"><g stroke="#d8dde0" stroke-width="1">${[
      0, 1, 2, 3,
    ]
      .map((i) => {
        const y = 186 - i * 46;
        return `<path d="M46 ${y}H620"/><text x="32" y="${y + 4}" text-anchor="end" fill="#7b848c" stroke="none" font-size="11">${Math.round(min + (i * span) / 3)}</text>`;
      })
      .join(
        "",
      )}</g><path d="${coords.map((p, i) => (i ? "L" : "M") + p.join(" ")).join(" ")}" fill="none" stroke="#2469c4" stroke-width="2.5"/>${coords.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="#2469c4"/>`).join("")}<text x="46" y="215" fill="#7b848c" font-size="11">Dia ${start}</text><text x="620" y="215" text-anchor="end" fill="#7b848c" font-size="11">Dia ${end}</text><text x="620" y="30" text-anchor="end" fill="#2469c4" font-size="13" font-weight="700">${values.at(-1)} / 100</text></svg><div class="chart-note">${list.length === 1 ? "Primeiro registro. O gráfico cresce conforme você avança a carreira." : `Registro desde o dia ${entries[0].day}. Pontos semanais; sem previsão ou crescimento garantido.`}</div>`;
  }
  root.ProLifeCharts = { radar, evolution };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeCharts;
})(typeof globalThis !== "undefined" ? globalThis : this);
