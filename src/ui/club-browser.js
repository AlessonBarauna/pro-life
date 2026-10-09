(function clubBrowserModule(root){
  "use strict";

  const ui={
    country:"ALL",
    league:"ALL",
    query:"",
    selectedClubId:null
  };

  let currentContext=null;


  function clamp(value,min,max){
    return Math.max(
      min,
      Math.min(max,value)
    );
  }


  function esc(value){
    return String(
      value??""
    ).replace(
      /[&<>"']/g,
      char=>({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#39;"
      })[char]
    );
  }


  function norm(value){
    return String(value||"")
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toLowerCase()
      .trim();
  }


  function rating(D,player){

    if(!player)
      return 0;

    try{
      if(
        D?.overall &&
        player.attrs &&
        player.pos
      ){
        const value=
          Number(
            D.overall(player)
          );

        if(Number.isFinite(value))
          return Math.round(value);
      }
    }catch{}

    const value=
      Number(
        player.overall ??
        player.ovr ??
        0
      );

    return Number.isFinite(value)
      ? Math.round(value)
      : 0;
  }


  function potential(player,D){

    const value=
      Number(
        player?.potential ??
        player?.pot ??
        rating(D,player)
      );

    return Number.isFinite(value)
      ? Math.round(value)
      : rating(D,player);
  }


  function ageOf(s,player){

    const explicit=
      Number(player?.age);

    if(Number.isFinite(explicit))
      return explicit;

    const birth=
      Number(player?.birthYear);

    if(Number.isFinite(birth))
      return Number(s?.season||2026)-birth;

    return null;
  }


  function positionLabel(pos){

    return {
      GOL:"GOL",
      DEF:"DEF",
      MEI:"MEI",
      ATA:"ATA"
    }[pos]||String(pos||"-");
  }


  function playerCountry(player){

    return (
      player?.nationality ||
      player?.nation ||
      "-"
    );
  }

  function normalizeCountry(value){

    const key=
      norm(value);

    if(
      key==="brazil" ||
      key==="brasil"
    )
      return "Brasil";

    return String(
      value||
      "Exterior"
    );
  }


  function stateFootball(s,D){

    const GF=
      D?.GlobalFootball ||
      root.ProLifeGlobalFootball;

    GF?.init?.(s);

    return GF;
  }


  function collect(s,D){

    const GF=
      stateFootball(s,D);

    const output=[];
    const seen=new Set();

    const localLeagues=
      new Map(
        (s.leagues||[])
          .map(
            league=>[
              league.id,
              league
            ]
          )
      );


    /*
      CLUBES BRASILEIROS / LOCAIS
    */
    for(const club of s.clubs||[]){

      if(!club?.id || seen.has(club.id))
        continue;

      seen.add(club.id);

      const league=
        localLeagues.get(
          club.leagueId
        );

      const players=
        (club.roster||[])
          .filter(
            player=>
              player &&
              player.status!=="retired"
          );

      output.push({
        id:club.id,
        name:club.name||club.shortName||club.id,
        shortName:club.shortName||club.name||club.id,
        leagueId:club.leagueId||"brasil",
        leagueName:
          league?.name ||
          club.leagueName ||
          "Brasil",
        country:
          normalizeCountry(
            league?.country ||
            club.country ||
            "Brasil"
          ),
        reputation:
          Number(
            club.reputation ??
            club.level ??
            0
          ),
        source:"local",
        players
      });
    }


    /*
      CLUBES DO UNIVERSO GLOBAL
    */
    const globalState=
      s.globalFootball||{};

    const globalClubs=
      Array.isArray(globalState.clubs)
        ? globalState.clubs
        : [];

    for(const club of globalClubs){

      if(!club?.id || seen.has(club.id))
        continue;

      /*
        Clubes generated sao cascas criadas para
        jogadores internacionais cujo clube ainda
        nao pertence aos packs oficiais do universo.

        Ex.: um unico jogador ligado a Al-Hilal.
        Eles nao devem aparecer como se fossem
        elencos completos na Central de Clubes.
      */
      if(club.generated===true)
        continue;

      seen.add(club.id);

      const league=
        GF?.leagueById?.(
          s,
          club.leagueId
        ) ||
        (globalState.leagues||[])
          .find(
            item=>
              item.id===club.leagueId
          );

      const players=
        (
          GF?.playersByClub?.(
            s,
            club.id
          )||[]
        )
        .filter(
          player=>
            player &&
            player.status!=="retired"
        );

      output.push({
        id:club.id,
        name:club.name||club.shortName||club.id,
        shortName:club.shortName||club.name||club.id,
        leagueId:club.leagueId||"global",
        leagueName:
          league?.name ||
          club.leagueName ||
          "Liga internacional",
        country:
          normalizeCountry(
            league?.country ||
            league?.nation ||
            club.country ||
            club.nation ||
            "Exterior"
          ),
        reputation:
          Number(
            club.reputation ??
            club.strength ??
            club.level ??
            0
          ),
        source:"global",
        players
      });
    }


    output.sort(
      (a,b)=>
        String(a.country)
          .localeCompare(
            String(b.country),
            "pt-BR"
          ) ||
        String(a.leagueName)
          .localeCompare(
            String(b.leagueName),
            "pt-BR"
          ) ||
        String(a.name)
          .localeCompare(
            String(b.name),
            "pt-BR"
          )
    );

    return output;
  }


  function clubStrength(club,D){

    const values=
      (club.players||[])
        .map(
          player=>rating(D,player)
        )
        .filter(
          Number.isFinite
        )
        .sort(
          (a,b)=>b-a
        )
        .slice(0,18);

    if(!values.length)
      return 0;

    return Math.round(
      values.reduce(
        (sum,value)=>sum+value,
        0
      )/values.length
    );
  }


  function averageAge(s,club){

    const ages=
      (club.players||[])
        .map(
          player=>ageOf(s,player)
        )
        .filter(
          value=>
            Number.isFinite(value)
        );

    if(!ages.length)
      return 0;

    return (
      ages.reduce(
        (sum,value)=>sum+value,
        0
      )/ages.length
    );
  }


  function formationFor(club,D){

    const roster=
      [...(club?.players||[])]
        .sort(
          (a,b)=>
            rating(D,b)-rating(D,a) ||
            String(a.name)
              .localeCompare(
                String(b.name),
                "pt-BR"
              )
        );

    const selected=[];
    const selectedIds=
      new Set();

    const limits={
      GOL:1,
      DEF:4,
      MEI:3,
      ATA:3
    };


    for(const [pos,count] of Object.entries(limits)){

      const candidates=
        roster
          .filter(
            player=>
              player.pos===pos &&
              !selectedIds.has(player.id)
          )
          .slice(0,count);

      for(const player of candidates){

        selected.push(player);

        if(player.id)
          selectedIds.add(player.id);
      }
    }


    /*
      Caso um elenco nao tenha a distribuicao 4-3-3,
      completa o XI pelos melhores jogadores restantes.
    */
    for(const player of roster){

      if(selected.length>=11)
        break;

      if(
        player.id &&
        selectedIds.has(player.id)
      )
        continue;

      selected.push(player);

      if(player.id)
        selectedIds.add(player.id);
    }


    const bench=
      roster.filter(
        player=>
          !player.id ||
          !selectedIds.has(player.id)
      );

    return {
      starters:selected.slice(0,11),
      bench,
      roster
    };
  }


  function snapshot(s,D){

    const clubs=
      collect(s,D);

    const countries=
      [...new Set(
        clubs.map(
          club=>club.country
        )
      )]
      .sort(
        (a,b)=>
          String(a)
            .localeCompare(
              String(b),
              "pt-BR"
            )
      );

    const leagues=
      [];

    const leagueSeen=
      new Set();

    for(const club of clubs){

      const key=
        String(club.leagueId);

      if(leagueSeen.has(key))
        continue;

      leagueSeen.add(key);

      leagues.push({
        id:club.leagueId,
        name:club.leagueName,
        country:club.country
      });
    }

    leagues.sort(
      (a,b)=>
        String(a.country)
          .localeCompare(
            String(b.country),
            "pt-BR"
          ) ||
        String(a.name)
          .localeCompare(
            String(b.name),
            "pt-BR"
          )
    );

    return {
      clubs,
      countries,
      leagues,
      totalClubs:clubs.length,
      totalPlayers:
        clubs.reduce(
          (sum,club)=>
            sum+(club.players?.length||0),
          0
        )
    };
  }


  function filteredSnapshot(s,D){

    const snap=
      snapshot(s,D);

    let clubs=
      snap.clubs;


    if(ui.country!=="ALL"){

      clubs=
        clubs.filter(
          club=>
            String(club.country)===
            String(ui.country)
        );
    }


    if(ui.league!=="ALL"){

      clubs=
        clubs.filter(
          club=>
            String(club.leagueId)===
            String(ui.league)
        );
    }


    const q=
      norm(ui.query);

    if(q){

      clubs=
        clubs.filter(
          club=>
            norm(
              [
                club.name,
                club.shortName,
                club.leagueName,
                club.country
              ].join(" ")
            ).includes(q)
        );
    }


    return {
      ...snap,
      filteredClubs:clubs
    };
  }


  function renderPitchPlayer(player,D){

    return `
      <div class="club-pitch-player">
        <strong>${rating(D,player)}</strong>
        <span>${esc(player.name)}</span>
        <small>${positionLabel(player.pos)}</small>
      </div>
    `;
  }


  function renderPitchRow(label,players,D){

    return `
      <div class="club-pitch-row">
        <small>${esc(label)}</small>
        <div>
          ${
            players.length
              ? players
                  .map(
                    player=>
                      renderPitchPlayer(
                        player,
                        D
                      )
                  )
                  .join("")
              : `<span class="muted">-</span>`
          }
        </div>
      </div>
    `;
  }


  function renderTablePlayer(
    s,
    D,
    player,
    starter
  ){

    const age=
      ageOf(s,player);

    const condition=
      Number(
        player.condition
      );

    const status=
      player.status==="retired"
        ? "Aposentado"
        : starter
          ? "Titular"
          : "Elenco";

    return `
      <tr>
        <td class="club-player-name">
          <b>${esc(player.name)}</b>
          <small>${esc(playerCountry(player))}</small>
        </td>
        <td>${positionLabel(player.pos)}</td>
        <td><b>${rating(D,player)}</b></td>
        <td>${potential(player,D)}</td>
        <td>${age??"-"}</td>
        <td>${
          Number.isFinite(condition)
            ? clamp(
                Math.round(condition),
                0,
                100
              )+"%"
            : "-"
        }</td>
        <td>${status}</td>
      </tr>
    `;
  }


  function render(s,D){

    const enteringNewState=
      !currentContext ||
      currentContext.s!==s;

    currentContext={s,D};

    if(enteringNewState){

      ui.country="ALL";
      ui.league="ALL";
      ui.query="";
      ui.selectedClubId=null;
    }

    const snap=
      filteredSnapshot(s,D);

    const availableLeagues=
      snap.leagues.filter(
        league=>
          ui.country==="ALL" ||
          String(league.country)===
          String(ui.country)
      );


    if(
      ui.league!=="ALL" &&
      !availableLeagues.some(
        league=>
          String(league.id)===
          String(ui.league)
      )
    ){
      ui.league="ALL";

      return render(s,D);
    }


    const visible=
      snap.filteredClubs;


    if(
      !ui.selectedClubId ||
      !visible.some(
        club=>
          club.id===ui.selectedClubId
      )
    ){
      ui.selectedClubId=
        visible[0]?.id||null;
    }


    const club=
      visible.find(
        item=>
          item.id===ui.selectedClubId
      )||null;


    const formation=
      club
        ? formationFor(club,D)
        : {
            starters:[],
            bench:[],
            roster:[]
          };


    const starterIds=
      new Set(
        formation.starters
          .map(
            player=>player.id
          )
          .filter(Boolean)
      );


    const pitchGroups={
      ATA:
        formation.starters
          .filter(
            player=>player.pos==="ATA"
          ),
      MEI:
        formation.starters
          .filter(
            player=>player.pos==="MEI"
          ),
      DEF:
        formation.starters
          .filter(
            player=>player.pos==="DEF"
          ),
      GOL:
        formation.starters
          .filter(
            player=>player.pos==="GOL"
          )
    };


    /*
      Qualquer atleta usado para completar o XI,
      mesmo fora da distribuicao esperada,
      aparece no setor correspondente.
    */
    const assigned=
      new Set(
        Object.values(pitchGroups)
          .flat()
          .map(
            player=>player.id
          )
      );

    const extraStarters=
      formation.starters.filter(
        player=>
          !assigned.has(player.id)
      );

    if(extraStarters.length)
      pitchGroups.MEI.push(
        ...extraStarters
      );


    const strength=
      club
        ? clubStrength(club,D)
        : 0;

    const avgAge=
      club
        ? averageAge(s,club)
        : 0;


    const countryOptions=
      [
        `<option value="ALL">Todos os paises</option>`,
        ...snap.countries.map(
          country=>
            `<option value="${esc(country)}" ${
              String(ui.country)===String(country)
                ? "selected"
                : ""
            }>${esc(country)}</option>`
        )
      ].join("");


    const leagueOptions=
      [
        `<option value="ALL">Todas as ligas</option>`,
        ...availableLeagues.map(
          league=>
            `<option value="${esc(league.id)}" ${
              String(ui.league)===String(league.id)
                ? "selected"
                : ""
            }>${esc(league.name)}</option>`
        )
      ].join("");


    const list=
      visible.length
        ? visible
            .map(
              item=>`
                <button
                  type="button"
                  data-club-browser-team="${esc(item.id)}"
                  class="${
                    item.id===ui.selectedClubId
                      ? "active"
                      : ""
                  }"
                >
                  <span class="club-browser-badge">
                    ${esc(
                      String(
                        item.shortName||
                        item.name
                      )
                      .slice(0,3)
                      .toUpperCase()
                    )}
                  </span>

                  <span>
                    <b>${esc(item.name)}</b>
                    <small>
                      ${esc(item.leagueName)}
                    </small>
                  </span>

                  <strong>
                    ${clubStrength(item,D)}
                  </strong>
                </button>
              `
            )
            .join("")
        : `
            <div class="club-browser-empty">
              Nenhum clube encontrado.
            </div>
          `;


    const content=
      !club
        ? `
            <section class="club-browser-empty-main">
              <h2>Nenhum clube encontrado</h2>
              <p>
                Ajuste os filtros para visualizar
                os elencos do universo.
              </p>
            </section>
          `
        : `
          <section class="club-browser-detail">

            <header class="club-browser-hero">

              <div class="club-browser-crest">
                ${esc(
                  String(
                    club.shortName||
                    club.name
                  )
                  .slice(0,3)
                  .toUpperCase()
                )}
              </div>

              <div>
                <div class="tag">
                  ${esc(club.country)}
                  &middot;
                  ${esc(club.leagueName)}
                </div>

                <h2>${esc(club.name)}</h2>

                <p>
                  ${
                    club.source==="local"
                      ? "Clube do universo brasileiro"
                      : "Clube do universo internacional"
                  }
                </p>
              </div>

              <div class="club-browser-overall">
                <strong>${strength}</strong>
                <span>GER</span>
              </div>

            </header>


            <div class="club-browser-kpis">

              <div>
                <small>ELENCO</small>
                <b>${club.players.length}</b>
                <span>jogadores</span>
              </div>

              <div>
                <small>MEDIA DE IDADE</small>
                <b>${
                  avgAge
                    ? avgAge.toFixed(1)
                    : "-"
                }</b>
                <span>anos</span>
              </div>

              <div>
                <small>TITULARES</small>
                <b>${formation.starters.length}</b>
                <span>projecao 4-3-3</span>
              </div>

              <div>
                <small>FORCA DO ELENCO</small>
                <b>${strength}</b>
                <span>top 18</span>
              </div>

            </div>


            <div class="club-browser-main-grid">

              <section class="club-lineup-card">

                <div class="club-section-heading">
                  <div>
                    <small>ESCALACAO</small>
                    <h3>Time titular</h3>
                  </div>

                  <span>4-3-3 base</span>
                </div>

                <div class="club-pitch">

                  ${renderPitchRow(
                    "ATAQUE",
                    pitchGroups.ATA,
                    D
                  )}

                  ${renderPitchRow(
                    "MEIO",
                    pitchGroups.MEI,
                    D
                  )}

                  ${renderPitchRow(
                    "DEFESA",
                    pitchGroups.DEF,
                    D
                  )}

                  ${renderPitchRow(
                    "GOLEIRO",
                    pitchGroups.GOL,
                    D
                  )}

                </div>

              </section>


              <section class="club-bench-card">

                <div class="club-section-heading">
                  <div>
                    <small>BANCO / ELENCO</small>
                    <h3>Opcoes</h3>
                  </div>

                  <span>
                    ${formation.bench.length}
                    jogadores
                  </span>
                </div>

                <div class="club-bench-list">

                  ${
                    formation.bench
                      .slice(0,12)
                      .map(
                        player=>`
                          <div>
                            <strong>
                              ${rating(D,player)}
                            </strong>

                            <span>
                              <b>${esc(player.name)}</b>
                              <small>
                                ${positionLabel(player.pos)}
                                &middot;
                                ${
                                  ageOf(s,player)??"-"
                                }
                                anos
                              </small>
                            </span>
                          </div>
                        `
                      )
                      .join("") ||
                    `<p class="muted">Sem reservas cadastrados.</p>`
                  }

                </div>

              </section>

            </div>


            <section class="club-roster-card">

              <div class="club-section-heading">

                <div>
                  <small>ELENCO COMPLETO</small>
                  <h3>
                    ${esc(club.name)}
                  </h3>
                </div>

                <span>
                  ${formation.roster.length}
                  atletas
                </span>

              </div>

              <div class="club-roster-table-wrap">

                <table class="club-roster-table">

                  <thead>
                    <tr>
                      <th>Jogador</th>
                      <th>Pos.</th>
                      <th>GER</th>
                      <th>POT</th>
                      <th>Idade</th>
                      <th>Cond.</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    ${
                      formation.roster
                        .map(
                          player=>
                            renderTablePlayer(
                              s,
                              D,
                              player,
                              starterIds.has(player.id)
                            )
                        )
                        .join("")
                    }
                  </tbody>

                </table>

              </div>

            </section>

          </section>
        `;


    return `
      <div
        class="club-browser-root"
        data-club-browser-root
      >

        <section class="club-browser-toolbar">

          <div>

            <div class="tag">
              CENTRAL DE CLUBES
            </div>

            <h2>
              Elencos do mundo
            </h2>

            <p>
              ${
                visible.length
              } de ${
                snap.totalClubs
              } clubes
              &middot;
              ${
                snap.totalPlayers
              } jogadores no universo
            </p>

          </div>


          <div class="club-browser-filters">

            <label>
              <span>Pais</span>

              <select data-club-browser-country>
                ${countryOptions}
              </select>
            </label>


            <label>
              <span>Liga</span>

              <select data-club-browser-league>
                ${leagueOptions}
              </select>
            </label>


            <label class="club-browser-search">
              <span>Buscar clube</span>

              <input
                type="search"
                value="${esc(ui.query)}"
                placeholder="Ex.: Flamengo, Barcelona..."
                data-club-browser-search
              >
            </label>

          </div>

        </section>


        <div class="club-browser-layout">

          <aside class="club-browser-sidebar">

            <div class="club-browser-side-title">

              <span>
                CLUBES
              </span>

              <b>
                ${visible.length}
              </b>

            </div>

            <div class="club-browser-team-list">
              ${list}
            </div>

          </aside>

          ${content}

        </div>

      </div>
    `;
  }


  function refresh(options={}){

    if(!currentContext)
      return;

    const element=
      root.document
        ?.querySelector(
          "[data-club-browser-root]"
        );

    if(!element)
      return;

    element.outerHTML=
      render(
        currentContext.s,
        currentContext.D
      );

    if(options.focusSearch){

      const input=
        root.document
          ?.querySelector(
            "[data-club-browser-search]"
          );

      if(input){

        input.focus();

        const end=
          input.value.length;

        try{
          input.setSelectionRange(
            end,
            end
          );
        }catch{}
      }
    }
  }


  if(
    root.document &&
    !root.__proLifeClubBrowserBound
  ){

    root.__proLifeClubBrowserBound=true;


    root.document.addEventListener(
      "click",
      event=>{

        const button=
          event.target.closest(
            "[data-club-browser-team]"
          );

        if(!button)
          return;

        ui.selectedClubId=
          button.getAttribute(
            "data-club-browser-team"
          );

        refresh();
      }
    );


    root.document.addEventListener(
      "change",
      event=>{

        if(
          event.target.matches(
            "[data-club-browser-country]"
          )
        ){

          ui.country=
            event.target.value||"ALL";

          ui.league="ALL";
          ui.selectedClubId=null;

          refresh();
          return;
        }


        if(
          event.target.matches(
            "[data-club-browser-league]"
          )
        ){

          ui.league=
            event.target.value||"ALL";

          ui.selectedClubId=null;

          refresh();
        }
      }
    );


    root.document.addEventListener(
      "input",
      event=>{

        if(
          !event.target.matches(
            "[data-club-browser-search]"
          )
        )
          return;

        ui.query=
          event.target.value||"";

        ui.selectedClubId=null;

        refresh({
          focusSearch:true
        });
      }
    );
  }


  const api={
    snapshot,
    collect,
    formationFor,
    render,
    reset(){
      ui.country="ALL";
      ui.league="ALL";
      ui.query="";
      ui.selectedClubId=null;
    }
  };


  root.ProLifeClubBrowser=api;

  if(
    typeof module!=="undefined" &&
    module.exports
  ){
    module.exports=api;
  }
})(typeof globalThis!=="undefined"?globalThis:this);
