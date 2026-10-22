"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const D = require("../src/domain/engine.js");

global.ProLife = D;
global.ProLifeGlobalFootball = D.GlobalFootball;
global.ProLifeWorldStats = D.WorldStats;
global.ProLifeStatistics = D.Statistics;
global.ProLifeCompetitions = D.Competitions;
global.ProLifeCoachCareer = D.CoachCareer;
global.ProLifeNames = require("../src/domain/display-names.js");
global.ProLifeCareerContext = require("../src/domain/career-context.js");

const E = require("../src/ui/expansion.js");

function fixture() {
  const s = D.create({
    mode: "coach",
    clubId: "c0",
    catalogVersion: "fc27_v1"
  }, 5);

  D.CoachCareer.init(s, D);

  const club = s.clubs.find(c => c.id === s.clubId);

  s.season = 2029;

  s.coachCareer.stints = [{
    clubId: club.id,
    club: club.name,
    fromSeason: 2026,
    fromDay: 0,
    toSeason: null,
    toDay: null,
    exit: null,
    titles: 0,
    rows: [
      {season: 2028, w: 17, d: 11, l: 10, pos: 2},
      {season: 2027, w: 17, d: 12, l: 9, pos: 3},
      {season: 2026, w: 18, d: 9, l: 11, pos: 4}
    ]
  }];

  return s;
}

test("coach: historico separa tres temporadas no mesmo clube", () => {
  const s = fixture();
  const html = E.statistics(s, "");

  assert.match(html, /<td>2026<\/td><td>38<\/td><td>18<\/td><td>9<\/td><td>11<\/td>/);
  assert.match(html, /<td>2027<\/td><td>38<\/td><td>17<\/td><td>12<\/td><td>9<\/td>/);
  assert.match(html, /<td>2028<\/td><td>38<\/td><td>17<\/td><td>11<\/td><td>10<\/td>/);

  const years = [...html.matchAll(/<td>(2026|2027|2028)<\/td>/g)]
    .map(m => m[1]);

  assert.deepEqual(years, ["2026", "2027", "2028"]);
});

test("coach: temporadas registradas conta balancos, nao passagens", () => {
  const s = fixture();
  const html = E.statistics(s, "");

  assert.match(
    html,
    /Temporadas registradas\s*<b>3<\/b>/
  );
});

test("coach: mostrar historico nao modifica os registros", () => {
  const s = fixture();

  const before = JSON.stringify(s.coachCareer.stints);

  E.statistics(s, "");
  E.statistics(s, "");

  assert.equal(JSON.stringify(s.coachCareer.stints), before);
});

test("coach: temporada atual sem fechamento nao gera linha ficticia", () => {
  const s = fixture();
  const html = E.statistics(s, "");

  const historical = html.split("Histórico da carreira")[1]
    .split("</table>")[0];

  assert.ok(!historical.includes("<td>2029</td>"));
});