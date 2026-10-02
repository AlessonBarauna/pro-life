/* Partial 2026 Serie C/D coverage. Names are reference data; ratings and careers are simulated. */
(function (root) {
  "use strict";
  const serieC = [
    ["ABC", "Natal"], ["Amazonas", "Manaus"], ["América-RN", "Natal"],
    ["Anápolis", "Anápolis"], ["Botafogo-PB", "João Pessoa"], ["Brusque", "Brusque"],
    ["Caxias", "Caxias do Sul"], ["Confiança", "Aracaju"], ["CSA", "Maceió"],
    ["Figueirense", "Florianópolis"], ["Floresta", "Fortaleza"], ["Guarani", "Campinas"],
    ["Itabaiana", "Itabaiana"], ["Londrina", "Londrina"], ["Maringá", "Maringá"],
    ["Náutico", "Recife"], ["Ponte Preta", "Campinas"], ["São Bernardo", "São Bernardo do Campo"],
    ["Ypiranga-RS", "Erechim"], ["Volta Redonda", "Volta Redonda"],
  ];
  const serieD = [
    ["Água Santa", "Diadema"], ["Altos", "Altos"], ["ASA", "Arapiraca"],
    ["Brasil de Pelotas", "Pelotas"], ["Caldense", "Poços de Caldas"], ["Ceilândia", "Brasília"],
    ["Cianorte", "Cianorte"], ["Ferroviária", "Araraquara"], ["Gama", "Brasília"],
    ["Inter de Limeira", "Limeira"], ["Joinville", "Joinville"], ["Juazeirense", "Juazeiro"],
    ["Manaus", "Manaus"], ["Mixto", "Cuiabá"], ["Nova Iguaçu", "Nova Iguaçu"],
    ["Portuguesa-RJ", "Rio de Janeiro"], ["Santa Cruz", "Recife"], ["Sousa", "Sousa"],
    ["Tocantinópolis", "Tocantinópolis"], ["Treze", "Campina Grande"],
  ];
  const colors = ["#1E5AA8", "#B91C1C", "#166534", "#7C3AED", "#B45309", "#0F766E"];
  const first = ["Arthur", "Breno", "Caio", "Daniel", "Eduardo", "Felipe", "Gabriel", "Igor", "João", "Lucas", "Matheus", "Rafael"];
  const last = ["Almeida", "Barbosa", "Costa", "Ferreira", "Lima", "Oliveira", "Pereira", "Rocha", "Santos", "Silva", "Souza"];
  function partialPlayers(prefix, level, offset) {
    return Array.from({ length: 14 }, (_, i) => ({
      id: prefix + "_" + i,
      name: first[(i + offset) % first.length] + " " + last[(i * 3 + offset) % last.length],
      age: 18 + ((i * 5 + offset) % 18),
      pos: i < 2 ? "GOL" : i < 7 ? "DEF" : i < 11 ? "MEI" : "ATA",
      number: i + 1,
      nationality: "Brasil",
      level,
      partial: true,
    }));
  }
  const clubs = [...serieC.map((x) => [...x, "serieC", 62]), ...serieD.map((x) => [...x, "serieD", 56])].map(
    ([name, city, leagueId, level], i) => ({
      name,
      city,
      leagueId,
      level: level + (i % 5),
      color: colors[i % colors.length],
      players: partialPlayers("br_" + (40 + i), level, i),
      coverage: "partial",
    }),
  );
  const api = { clubs, serieC, serieD, coverage: "partial", edition: 2026 };
  root.ProLifeBrazilData = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
