
"use strict";

const test=
  require("node:test");

const assert=
  require("node:assert/strict");

const D=
  require("../src/domain/engine.js");

const Save=
  require("../src/infrastructure/save.js");

const W=
  D.WorldClubCompetitions;

function state(seed=28100){
  return D.create(
    {
      mode:"player",
      clubId:"c0"
    },
    seed
  );
}

test(
  "28B: 34 ligas globais entram no motor de competicoes",
  ()=>{

    const s=state();

    const leagues=
      W.eligibleLeagues(s);

    assert.equal(
      leagues.length,
      34
    );

    const names=
      new Set(
        leagues.map(
          l=>l.name
        )
      );

    assert.ok(
      names.has(
        "Premier League"
      )
    );

    assert.ok(
      names.has(
        "MLS"
      )
    );

    assert.ok(
      names.has(
        "EFL Championship"
      )
    );

    assert.equal(
      W.integrity(s).ok,
      true
    );
  }
);


test(
  "28B: calendario e turno-returno sao completos e sem auto confronto",
  ()=>{

    const s=state(28101);

    const leagues=
      W.eligibleLeagues(s);

    for(const league of leagues){

      const calendar=
        W.calendar(
          s,
          league.id
        );

      const clubs=
        (
          s.globalFootball
            ?.clubs||
          []
        )
          .filter(
            c=>
              c.leagueId===
                league.id &&
              c.generated!==true
          );

      const appearances=
        Object.fromEntries(
          clubs.map(
            c=>[c.id,0]
          )
        );

      const directed=
        new Set();

      for(const round of calendar){

        for(
          const pair
          of round.pairs
        ){

          assert.notEqual(
            pair.home,
            pair.away
          );

          appearances[
            pair.home
          ]++;

          appearances[
            pair.away
          ]++;

          const key=
            pair.home+
            ">"+
            pair.away;

          assert.equal(
            directed.has(key),
            false,
            league.name+
            " duplicou "+
            key
          );

          directed.add(key);
        }
      }

      for(
        const [
          id,
          count
        ]
        of Object.entries(
          appearances
        )
      ){

        assert.equal(
          count,
          2*(
            clubs.length-1
          ),
          league.name+
          " / "+
          id
        );
      }
    }
  }
);


test(
  "28B: dias da carreira simulam automaticamente os campeonatos mundiais",
  ()=>{

    const s=state(28102);

    while(s.day<120)
      D.advance(
        s,
        Math.min(
          30,
          120-s.day
        )
      );

    const world=
      W.init(s);

    assert.equal(
      Object.keys(
        world.leagues
      ).length,
      34
    );

    let played=0;

    for(
      const league
      of W.eligibleLeagues(s)
    ){

      const table=
        W.standings(
          s,
          league.id
        );

      assert.equal(
        table.length,
        league.clubCount
      );

      assert.ok(
        table.some(
          row=>row.played>0
        ),
        league.name
      );

      played+=
        W.results(
          s,
          league.id
        ).length;
    }

    assert.ok(
      played>1000
    );

    assert.equal(
      W.integrity(s).ok,
      true
    );
  }
);


test(
  "28B: simulacao mundial e deterministica",
  ()=>{

    const a=state(28103);
    const b=state(99999);

    W.closeSeason(a);
    W.closeSeason(b);

    const ah=
      W.history(a)
        .map(
          h=>[
            h.leagueId,
            h.championId
          ]
        )
        .sort();

    const bh=
      W.history(b)
        .map(
          h=>[
            h.leagueId,
            h.championId
          ]
        )
        .sort();

    assert.deepEqual(
      ah,
      bh
    );
  }
);


test(
  "28B: fechamento registra campeao e historico de todas as ligas",
  ()=>{

    const s=state(28104);

    W.closeSeason(s);

    const world=
      W.init(s);

    assert.equal(
      W.history(s).length,
      34
    );

    for(
      const [
        leagueId,
        competition
      ]
      of Object.entries(
        world.leagues
      )
    ){

      assert.equal(
        competition.status,
        "finished",
        leagueId
      );

      assert.ok(
        competition.championId,
        leagueId
      );

      const order=
        W.standings(
          s,
          leagueId
        );

      assert.equal(
        order[0].id,
        competition.championId
      );

      for(const row of order){

        assert.equal(
          row.played,
          2*(
            order.length-1
          ),
          leagueId+
          " / "+
          row.name
        );
      }
    }

    assert.equal(
      W.integrity(s).ok,
      true
    );
  }
);


test(
  "28B: estado persiste no save e nao duplica resultados apos reload",
  ()=>{

    const s=state(28105);

    while(s.day<90)
      D.advance(
        s,
        Math.min(
          30,
          90-s.day
        )
      );

    const before=
      W.results(
        s,
        "gf_premier_league"
      ).length;

    assert.ok(
      before>0
    );

    const restored=
      Save.parse(
        JSON.stringify(s)
      );

    const after=
      W.results(
        restored,
        "gf_premier_league"
      ).length;

    assert.equal(
      after,
      before
    );

    W.daily(restored);

    assert.equal(
      W.results(
        restored,
        "gf_premier_league"
      ).length,
      before
    );

    assert.equal(
      W.integrity(
        restored
      ).ok,
      true
    );
  }
);
