# European calendar migration — integration status

Branch: `fix/english-cups-calendar-2026`  
Base development branch: `feature/fc27-next-development`  
**Do not merge until tests, save/reload and real career simulations pass.**

## Implemented on this branch (pending execution tests)

- Calendar policy by UEFA association, including calendar-year leagues (Sweden, Norway, Ireland, Finland, etc.)
- Official 2026/27 reference dates for selected competitions, projected dates (explicitly non-official) in future seasons
- New FC27 saves opt into `calendarVersion: "european_v1"`, legacy saves retain the original behavior
- League-local persisted state, January continuity, close-on-scheduled-finish and new-season creation
- English FA Cup and EFL Cup cross January; Community Shield uses past league and FA Cup winners
- UEFA UCL/UEL/UECL phase and knockout routing across January with saved match protection
- Deferred new-year UEFA entrants until domestic standings finish
- Recorded full league ranking for qualification; transfer windows configurable per country
- Civil-year rollover honors leap years for opted-in careers

## Required before claiming complete fidelity

- Obtain and validate **official matchdays / fixture calendars**, not just season start/end or uniformly distributed rounds, for each supported league and season. Do not label projected rounds official.
- Resolve unavoidable same-club clashes and recovery time involving domestic leagues, domestic cups, UEFA, and international windows. Existing heuristics are not a formally conflict-free scheduler.
- Validate every country's promotion/relegation and cup/continental qualification rules and market dates against authoritative national league rules. Generic market windows are planning values.
- End-to-end verify Conference participation, user coach live matches, future-year UEFA draws and saves through at least 2028/29 (leap year).
- Check save validation and historical saves before rollout; do not migrate existing saves in place.
- Check web/GitHub Pages browser script ordering, mobile and desktop UI.
- Run syntax checks, all existing tests, new calendar integration tests, `npm run test:ui`, `npm run build`, and real career simulation with Chelsea and at least one calendar-year league.
- Audit failure logs before committing a merge to `feature/fc27-next-development`. Never touch `main` without user approval.

## Explicit caveats

The European dates for years after 2026/27 and many country-level season windows **are projections, not official fixtures**. The new system has not passed a full runtime validation yet.
