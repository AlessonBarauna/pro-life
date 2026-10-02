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
    return `<svg class="radar-chart" viewBox="0 0 370 270" role="img" aria-label="Distribuição dos seis atributos de futebol"><g fill="none" stroke="#3a4c5e" stroke-width="1">${[0.25, 0.5, 0.75, 1].map((v) => `<polygon points="${points(v * 97)}"/>`).join("")}${keys.map((k, i) => `<path d="M185 135L${xy(i, 97).join(" ")}"/>`).join("")}</g><polygon points="${keys.map((k, i) => xy(i, (97 * Math.max(0, Math.min(100, Number(attrs[k]) || 0))) / 100).join(",")).join(" ")}" fill="#79b8ff" fill-opacity=".2" stroke="#79b8ff" stroke-width="2"/>${keys
      .map((k, i) => {
        const [x, y] = xy(i, 122);
        return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" fill="#c4d1dc" font-size="11" font-weight="700">${names[i]} ${Math.round(Number(attrs[k]) || 0)}</text>`;
      })
      .join("")}</svg>`;
  }
  function evolution(entries, key = "overall") {
    const list = (entries || []).slice(-260);
    if (!list.length) return "<p>Nenhum registro disponível.</p>";
    const series =
        key === "all" ? keys : [keys.includes(key) ? key : "overall"],
      colors = [
        "#72b3ff",
        "#e5b04e",
        "#89d9b5",
        "#b8a0eb",
        "#f18e9a",
        "#7cd5dc",
      ];
    const value = (e, k) =>
        Math.max(
          0,
          Math.min(
            100,
            Number(k === "overall" ? e.overall : e.attrs?.[k]) || 0,
          ),
        ),
      all = series.flatMap((k) => list.map((e) => value(e, k))),
      min = Math.max(0, Math.min(...all) - 2),
      max = Math.min(100, Math.max(...all) + 2),
      span = Math.max(1, max - min),
      start = list[0].day,
      end = list.at(-1).day,
      range = Math.max(1, end - start),
      namesFull = {
        pace: "Velocidade",
        finish: "Finalização",
        pass: "Passe",
        defense: "Marcação",
        strength: "Força",
        stamina: "Resistência",
        overall: "Nível geral",
      };
    const x = (e) => 46 + ((e.day - start) / range) * 574,
      y = (v) => 186 - ((v - min) / span) * 138;
    return `<svg class="evolution-chart" viewBox="0 0 660 238" role="img" aria-label="Histórico detalhado de evolução"><g stroke="#344858" stroke-width="1">${[0, 1, 2, 3].map((i) => `<path d="M46 ${186 - i * 46}H620"/><text x="32" y="${190 - i * 46}" text-anchor="end" fill="#a4b4c1" stroke="none" font-size="11">${Math.round(min + (i * span) / 3)}</text>`).join("")}</g>${series.map((k, j) => `<path d="${list.map((e, i) => (i ? "L" : "M") + x(e) + " " + y(value(e, k))).join(" ")}" fill="none" stroke="${colors[j]}" stroke-width="2.5"/>${list.map((e) => `<circle cx="${x(e)}" cy="${y(value(e, k))}" r="3" fill="${colors[j]}"><title>Dia ${e.day} · ${namesFull[k]}: ${value(e, k)}</title></circle>`).join("")}`).join("")}<text x="46" y="215" fill="#a4b4c1" font-size="11">Dia ${start}</text><text x="620" y="215" text-anchor="end" fill="#a4b4c1" font-size="11">Dia ${end}</text>${series.length === 1 ? `<text x="620" y="30" text-anchor="end" fill="${colors[0]}" font-size="13" font-weight="700">${value(list.at(-1), series[0])} / 100</text>` : ""}</svg><div class="chart-legend">${series.map((k, i) => `<span style="color:${colors[i]}">${namesFull[k]} · ${value(list.at(-1), k)}</span>`).join("")}</div><div class="chart-note">${list.length === 1 ? "Primeiro registro. O gráfico cresce conforme você avança a carreira." : `Passe o mouse nos pontos para ver os valores. ${list.length} registros neste período; sem previsão ou crescimento garantido.`}</div>`;
  }
  root.ProLifeCharts = { radar, evolution };
  if (typeof module !== "undefined" && module.exports)
    module.exports = root.ProLifeCharts;
})(typeof globalThis !== "undefined" ? globalThis : this);
