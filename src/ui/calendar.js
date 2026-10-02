/* PRO LIFE — unified monthly career calendar. */
(function (root) {
  "use strict";
  const epoch = Date.UTC(2026, 0, 1);
  const dateForDay = (day) => new Date(epoch + day * 86400000);
  const dayForDate = (date) => Math.round((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - epoch) / 86400000);
  const key = (day) => dateForDay(day).toISOString().slice(0, 10);
  function events(s, D) {
    const result = [], own = s.clubId;
    const clubName = (id) => D.club(s, id)?.name || "Clube";
    for (const match of s.matches || []) if (match.home === own || match.away === own) result.push({ day: match.date ?? match.day, type: "played", title: `${clubName(match.home)} ${match.hg} × ${match.ag} ${clubName(match.away)}`, detail: match.competitionName || "Partida", destination: "matches" });
    (s.fixtures || []).forEach((round, index) => {
      const pair = round.find((fixture) => fixture.includes(own));
      if (!pair || index < s.round) return;
      const day = (s.season - 2026) * 365 + (s.calendarDays?.[index] ?? 7 + index * 21);
      result.push({ day, type: "club", title: `${clubName(pair[0])} × ${clubName(pair[1])}`, detail: s.leagues.find((league) => league.id === D.club(s)?.leagueId)?.name || "Liga", destination: "matches" });
    });
    const schedule = s.competitionSchedule || {};
    for (const fixture of schedule.state?.fixtures || []) if (!fixture.played) result.push({ day: fixture.date, type: "state", title: `${clubName(fixture.home)} × ${clubName(fixture.away)}`, detail: schedule.state.name, destination: "competitions" });
    for (const round of schedule.cup?.rounds || []) for (const pair of round.pairs || []) if (!pair.played && (pair.home === own || pair.away === own)) result.push({ day: round.date, type: "cup", title: `${clubName(pair.home)} × ${clubName(pair.away)}`, detail: `${schedule.cup.name} · ${round.name}`, destination: "competitions" });
    if (s.mode === "player" && D.NationalTeam?.init) {
      const national = D.NationalTeam.init(s);
      for (const match of national.schedule || []) result.push({ day: match.day, type: "national", title: match.played && match.brazil !== null ? `Brasil ${match.brazil} × ${match.other} ${match.opponent}` : `Brasil × ${match.opponent}`, detail: match.played && !match.participated ? `${match.competition} · sem participação` : match.calledUp || national.calledUp ? match.competition : `Data FIFA · ${match.competition}`, destination: "national" });
    }
    for (let year = Math.max(2026, s.season - 1); year <= s.season + 1; year++) for (const window of D.Career.windows || []) {
      const base = (year - 2026) * 365;
      result.push({ day: base + window.start, type: "window", title: `Abertura: ${window.name}`, detail: "Janela de transferências", destination: "market" });
      result.push({ day: base + window.end, type: "window", title: `Encerramento: ${window.name}`, detail: "Janela de transferências", destination: "market" });
    }
    if (s.decision) result.push({ day: s.day, type: "event", title: s.decision.title, detail: "Decisão pendente", destination: "life" });
    return result.filter((event) => Number.isInteger(event.day) && event.day >= 0).sort((a, b) => a.day - b.day || a.title.localeCompare(b.title));
  }
  function monthId(s) { return dateForDay(s.day).toISOString().slice(0, 7); }
  function shift(month, amount) { const [year, value] = month.split("-").map(Number), date = new Date(Date.UTC(year, value - 1 + amount, 1)); return date.toISOString().slice(0, 7); }
  function render(s, D, options) {
    const esc = options.esc, dayDate = options.dayDate, selected = /^\d{4}-\d{2}$/.test(options.month || "") ? options.month : monthId(s);
    const [year, month] = selected.split("-").map(Number), first = new Date(Date.UTC(year, month - 1, 1)), startOffset = (first.getUTCDay() + 6) % 7;
    const gridStart = dayForDate(first) - startOffset, list = events(s, D), grouped = new Map();
    for (const event of list) { const id = key(event.day); if (!grouped.has(id)) grouped.set(id, []); grouped.get(id).push(event); }
    const cells = Array.from({ length: 42 }, (_, index) => {
      const day = gridStart + index, date = dateForDay(day), currentMonth = date.getUTCMonth() === month - 1, today = day === s.day, items = grouped.get(key(day)) || [];
      return `<div class="calendar-day ${currentMonth ? "" : "outside"} ${today ? "today" : ""}" data-calendar-day="${day}"><span class="calendar-number">${date.getUTCDate()}</span>${items.slice(0, 3).map((event) => `<button class="calendar-event ${event.type}" data-page="${event.destination}" title="${esc(event.detail)}">${esc(event.title)}</button>`).join("")}${items.length > 3 ? `<small>+${items.length - 3} evento(s)</small>` : ""}</div>`;
    }).join("");
    const upcoming = list.filter((event) => event.day >= s.day).slice(0, 10), title = first.toLocaleDateString("pt-BR", { timeZone: "UTC", month: "long", year: "numeric" });
    return `<section class="card career-calendar"><div class="calendar-toolbar"><div><div class="tag">AGENDA INTEGRADA</div><h2>${esc(title.charAt(0).toUpperCase() + title.slice(1))}</h2></div><div class="actions"><button data-calendar="prev" aria-label="Mês anterior">←</button><button data-calendar="today">Hoje</button><button data-calendar="next" aria-label="Próximo mês">→</button></div></div><div class="calendar-legend"><span class="club">Clube</span><span class="state">Estadual</span><span class="cup">Copa do Brasil</span>${s.mode === "player" ? '<span class="national">Seleção</span>' : ""}<span class="window">Mercado</span><span class="event">Eventos</span></div><div class="calendar-weekdays">${["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"].map((name) => `<b>${name}</b>`).join("")}</div><div class="calendar-grid">${cells}</div></section><section class="card section"><div class="tag">PRÓXIMOS COMPROMISSOS</div><h2>Agenda rápida</h2>${upcoming.length ? `<div class="calendar-upcoming">${upcoming.map((event) => `<button data-page="${event.destination}"><time>${dayDate(event.day)}</time><span><b>${esc(event.title)}</b><small>${esc(event.detail)}</small></span></button>`).join("")}</div>` : '<p class="muted">Nenhum compromisso futuro registrado.</p>'}</section>`;
  }
  root.ProLifeCalendar = { events, monthId, shift, render };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeCalendar;
})(typeof globalThis !== "undefined" ? globalThis : this);
