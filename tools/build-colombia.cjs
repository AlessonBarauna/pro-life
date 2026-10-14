'use strict';
// Gera src/data/fc27/fc27-colombia-v1.js a partir de tools/colombia/espn-raw-part*.txt (elencos ESPN Brasil, Liga Colombia 2026).
// GER: ESTIMATIVA PROPRIA (o FC 27 nao traz estes clubes). Derivada da ordem de jogos disputados no clube; nao e dado oficial.
// Jogadores sem idade informada pela ESPN foram omitidos (nada e inventado).
const fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'colombia');
const CLUBS={
 2672:['Deportivo Cali',72],2690:['Independiente Medellín',74],2919:['Once Caldas',70],4815:['Atlético Junior',74],
 4928:['Fortaleza CEIF',68],5480:['Boyacá Chicó FC',68],5484:['Millonarios',75],5485:['Deportivo Pasto',70],
 5486:['Deportivo Pereira',70],5488:['Independiente Santa Fe',73],5489:['Deportes Tolima',73],6137:['Atlético Bucaramanga',71],
 7445:['Internacional de Bogotá',69],7915:['Llaneros FC',67],8109:['América de Cali',73],9761:['Alianza FC',69],9762:['Águilas Doradas',69]
};
const NAT={'Colômbia':'Colombia','Espanha':'Spain','USA':'United States','Uruguai':'Uruguay','México':'Mexico','Equador':'Ecuador','Paraguai':'Paraguay','Brasil':'Brazil','Armênia':'Armenia','Luxemburgo':'Luxembourg'};
const POS={G:'GOL',D:'DEF',M:'MEI',A:'ATA'};
const YEAR=2026;
const raw=fs.readdirSync(dir).filter(f=>/^espn-raw-part\d+\.txt$/.test(f)).sort().map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n');
const clubs=[],players=[];let omitted=0;
for(const block of raw.split(/^#/m).filter(Boolean)){
  const [head,...lines]=block.trim().split('\n');const espn=Number(head);const def=CLUBS[espn];if(!def)throw new Error('clube desconhecido '+espn);
  const clubId='gf_fc27_'+(9000000+espn);const rows=[];
  for(const line of lines){
    const [pid,name,pos,age,nat,j]=line.split('|');const a=Number(age);
    if(!/^\d+$/.test(age)||!POS[pos]){omitted++;continue;}
    rows.push({pid,name,pos:POS[pos],age:a,nat:NAT[nat]||nat,j:Number(j)||0});
  }
  const top=def[1];
  const ranked=rows.slice().sort((x,y)=>(y.j+(x.age>=22&&x.age<=33?0:0)) - (x.j) || Math.abs(x.age-27)-Math.abs(y.age-27) || String(x.pid).localeCompare(String(y.pid)));
  ranked.sort((x,y)=>y.j-x.j||Math.abs(x.age-27)-Math.abs(y.age-27)||String(x.pid).localeCompare(String(y.pid)));
  const n=ranked.length;const ids=[];
  ranked.forEach((r,i)=>{
    const pct=n>1?1-i/(n-1):1;
    const ovr=Math.max(40,Math.min(top,Math.round(top-20*Math.pow(1-pct,1.2))));
    const id='fc27_p_'+(9000000+Number(r.pid));ids.push(id);
    players.push({id,name:r.name,commonName:null,birthYear:YEAR-r.age,nationality:r.nat,clubId,positionFC27:null,pos:r.pos,secondaryPositions:[],overall:ovr,potential:null,ratingSource:'estimate-espn-appearances',espnId:Number(r.pid)});
  });
  clubs.push({id:clubId,eaId:null,name:def[0],espnId:espn,leagueId:'gf_fc27_liga_colombia',playerIds:ids});
}
const out={format:'PRO_LIFE_FC27_COLOMBIA_V1',source:'ESPN Brasil (elencos 2026); GER estimado pelo PRO-LIFE, nao oficial',clubs,players};
const body='(function(root){"use strict";root.ProLifeFC27Colombia='+JSON.stringify(out)+';if(typeof module!=="undefined"&&module.exports)module.exports=root.ProLifeFC27Colombia;})(typeof globalThis!=="undefined"?globalThis:this);\n';
fs.writeFileSync(path.join(__dirname,'..','src','data','fc27','fc27-colombia-v1.js'),body);
console.log('clubes',clubs.length,'jogadores',players.length,'omitidos',omitted,'bytes',body.length);
