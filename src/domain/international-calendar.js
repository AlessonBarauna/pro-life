(function(root){
  "use strict";

  const competitions={
    WORLD_CUP:{
      id:"WORLD_CUP",
      name:"Copa do Mundo",
      confederation:"FIFA",
      cycle:4,
      firstYear:2026,
      priority:100,
      window:{
        start:154,
        end:199
      }
    },

    WORLD_CUP_QUALIFIERS:{
      id:"WORLD_CUP_QUALIFIERS",
      name:"Eliminatorias da Copa",
      confederation:"FIFA",
      cycle:4,
      firstYear:2025,
      priority:90,
      collisionPolicy:"SHARED_WINDOW",
      window:{
        start:1,
        end:330
      }
    },

    COPA_AMERICA:{
      id:"COPA_AMERICA",
      name:"Copa America",
      confederation:"CONMEBOL",
      cycle:4,
      firstYear:2028,
      priority:80,
      window:{
        start:168,
        end:205
      }
    },

    EURO:{
      id:"EURO",
      name:"EURO",
      confederation:"UEFA",
      cycle:4,
      firstYear:2028,
      priority:80,
      window:{
        start:166,
        end:199
      }
    },

    UEFA_NATIONS_LEAGUE:{
      id:"UEFA_NATIONS_LEAGUE",
      name:"UEFA Nations League",
      confederation:"UEFA",
      cycle:2,
      firstYear:2026,
      priority:55,
      window:{
        start:55,
        end:164
      }
    },

    AFCON:{
      id:"AFCON",
      name:"AFCON",
      confederation:"CAF",
      cycle:2,
      firstYear:2027,
      priority:75,
      window:{
        start:18,
        end:49
      }
    },

    ASIAN_CUP:{
      id:"ASIAN_CUP",
      name:"AFC Asian Cup",
      confederation:"AFC",
      cycle:4,
      firstYear:2027,
      priority:75,
      window:{
        start:26,
        end:57
      }
    },

    GOLD_CUP:{
      id:"GOLD_CUP",
      name:"CONCACAF Gold Cup",
      confederation:"CONCACAF",
      cycle:2,
      firstYear:2027,
      priority:70,
      window:{
        start:165,
        end:193
      }
    },

    CONCACAF_NATIONS_LEAGUE:{
      id:"CONCACAF_NATIONS_LEAGUE",
      name:"CONCACAF Nations League",
      confederation:"CONCACAF",
      cycle:2,
      firstYear:2026,
      priority:55,
      window:{
        start:245,
        end:434
      },
      crossesYear:true
    },

    OFC_NATIONS_CUP:{
      id:"OFC_NATIONS_CUP",
      name:"OFC Nations Cup",
      confederation:"OFC",
      cycle:4,
      firstYear:2028,
      priority:70,
      window:{
        start:160,
        end:181
      }
    },

    FINALISSIMA:{
      id:"FINALISSIMA",
      name:"Finalissima",
      confederation:"FIFA",
      cycle:4,
      firstYear:2029,
      priority:65,
      window:{
        start:82,
        end:82
      }
    },

    FIFA_ARAB_CUP:{
      id:"FIFA_ARAB_CUP",
      name:"FIFA Arab Cup",
      confederation:"FIFA",
      cycle:4,
      firstYear:2029,
      priority:60,
      window:{
        start:330,
        end:351
      }
    },

    FIFA_SERIES:{
      id:"FIFA_SERIES",
      name:"FIFA Series",
      confederation:"FIFA",
      cycle:2,
      firstYear:2026,
      priority:25,
      window:{
        start:78,
        end:82
      }
    }
  };

  function get(id){
    return competitions[id]||null;
  }

  function isEditionYear(id,year){
    const item=get(id);

    if(!item)
      return false;

    year=Number(year);

    if(
      !Number.isFinite(year) ||
      year<item.firstYear
    )
      return false;

    return (
      (year-item.firstYear)%
      item.cycle===
      0
    );
  }

  function editionsForYear(year){
    return Object.values(
      competitions
    ).filter(
      item=>
        isEditionYear(
          item.id,
          year
        )
    );
  }

  function overlap(a,b){
    if(
      !a?.window ||
      !b?.window
    )
      return false;

    return (
      a.window.start<=b.window.end &&
      b.window.start<=a.window.end
    );
  }

  function classifyOverlap(a,b){
    if(!overlap(a,b))
      return "NONE";

    if(
      a.collisionPolicy==="SHARED_WINDOW" ||
      b.collisionPolicy==="SHARED_WINDOW"
    ){
      return "SHARED_WINDOW";
    }

    if(
      a.confederation!==
      b.confederation
    ){
      return "CROSS_CONFEDERATION";
    }

    if(
      a.id==="FIFA_SERIES" ||
      b.id==="FIFA_SERIES"
    ){
      return "FRIENDLY_WINDOW";
    }

    return "SAME_CONFEDERATION";
  }

  function collisionsForYear(year){
    const editions=
      editionsForYear(year);

    const collisions=[];

    for(
      let i=0;
      i<editions.length;
      i++
    ){
      for(
        let j=i+1;
        j<editions.length;
        j++
      ){
        const a=editions[i];
        const b=editions[j];

        if(!overlap(a,b))
          continue;

        collisions.push({
          year:Number(year),
          a:a.id,
          b:b.id,
          type:
            classifyOverlap(
              a,
              b
            ),
          start:
            Math.max(
              a.window.start,
              b.window.start
            ),
          end:
            Math.min(
              a.window.end,
              b.window.end
            )
        });
      }
    }

    return collisions;
  }

  function dangerousCollisions(year){
    return collisionsForYear(
      year
    ).filter(
      item=>
        item.type===
        "SAME_CONFEDERATION"
    );
  }

  function validateRange(
    startYear,
    endYear
  ){
    const report={
      startYear:Number(startYear),
      endYear:Number(endYear),
      years:[],
      dangerous:[]
    };

    for(
      let year=Number(startYear);
      year<=Number(endYear);
      year++
    ){
      const editions=
        editionsForYear(year)
          .map(
            item=>item.id
          );

      const collisions=
        collisionsForYear(year);

      const dangerous=
        collisions.filter(
          item=>
            item.type===
            "SAME_CONFEDERATION"
        );

      report.years.push({
        year,
        editions,
        collisions
      });

      report.dangerous.push(
        ...dangerous
      );
    }

    return report;
  }

  function worldCupCanonicalWindow(){
    return {
      clubStopStart:154,
      groupStart:161,
      brazilGroup:[161,167,173],
      roundOf32:178,
      roundOf16:184,
      quarterfinal:189,
      semifinal:194,
      thirdPlace:198,
      final:199
    };
  }

  const api={
    competitions,
    get,
    isEditionYear,
    editionsForYear,
    overlap,
    classifyOverlap,
    collisionsForYear,
    dangerousCollisions,
    validateRange,
    worldCupCanonicalWindow
  };

  root.ProLifeInternationalCalendar=
    api;

  if(
    typeof module!=="undefined" &&
    module.exports
  )
    module.exports=api;

})(
  typeof globalThis!=="undefined"
    ? globalThis
    : this
);
