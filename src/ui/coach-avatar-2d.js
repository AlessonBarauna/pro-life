(function(root){
"use strict";
// Retrato 2D do treinador: SVG gerado por código, sem imagens externas e sem WebGL.
// A configuração é um objeto simples e serializável, salvo junto da carreira.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const HEX=/^#[0-9a-f]{6}$/i;
const hex=(v,f)=>HEX.test(v||"")?String(v).toLowerCase():f;
function mix(a,b,t){const ex=h=>/^#[0-9a-f]{3}$/i.test(h)?"#"+h.slice(1).split("").map(x=>x+x).join(""):h;a=ex(a);b=ex(b);const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));const A=p(a),B=p(b);return "#"+A.map((v,i)=>Math.round(v+(B[i]-v)*clamp(t,0,1)).toString(16).padStart(2,"0")).join("");}
const f=n=>Math.round(n*10)/10;

const CATALOG={
 face:[["oval","Oval"],["round","Redondo"],["square","Quadrado"],["long","Alongado"]],
 nose:[["straight","Reto"],["wide","Largo"],["small","Pequeno"],["long","Alongado"]],
 mouth:[["normal","Normal"],["full","Lábios grossos"],["thin","Lábios finos"]],
 brows:[["thick","Grossas"],["thin","Finas"],["angled","Anguladas"],["straight","Retas"]],
 eyes:[["almond","Amendoados"],["round","Redondos"],["narrow","Estreitos"],["hooded","Caídos"]],
 expression:[["neutral","Neutra"],["smile","Sorriso"],["grin","Sorriso aberto"],["serious","Séria"]],
 hair:[["bald","Sem cabelo"],["buzz","Raspado"],["crew","Social curto"],["lowfade","Degradê baixo"],["highfade","Degradê alto"],["curly","Cacheado"],["afro","Black power"],["twists","Twists"],["braids","Tranças"],["mullet","Mullet"],["long","Longo"]],
 beard:[["none","Sem barba"],["stubble","Por fazer"],["short","Curta"],["full","Cheia"],["mustache","Bigode"],["goatee","Cavanhaque"]],
 glasses:[["none","Sem óculos"],["round","Redondo"],["square","Retangular"],["sun","Escuros"]],
 body:[["slim","Magro"],["normal","Normal"],["strong","Forte"]],
 outfit:[["suit","Terno e gravata"],["classic","Blazer casual"],["shirt","Camisa social"],["vest","Colete"],["polo","Polo do clube"],["tracksuit","Agasalho do clube"],["jacket","Jaqueta"]]
};
const SKINS=["#f6d9c3","#efc6a6","#e2b48f","#c99a74","#a8744f","#7d5238","#5a3826","#3d2519"];
const HAIRS=["#0f0c0a","#241e1a","#4a3224","#7a5236","#a67c4e","#c9a66b","#8a8a8e","#d9d9dc"];
const EYES=["#2a1a10","#5a3b22","#7a5a30","#4f7d54","#3f7fb0","#6b7f8c"];
const OUTFIT_DEFAULT={suit:["#1d2a3c","#8a2230"],classic:["#2c3a4c","#e8ecef"],shirt:["#e9eef2","#2f4a6b"],vest:["#2a3340","#e9eef2"],polo:["#1a5a4a","#f0f3f2"],tracksuit:["#20384a","#b8f32e"],jacket:["#3a4a3c","#d8dfe2"]};

const DEFAULTS={skin:"#c99a74",hairColor:"#241e1a",eyeColor:"#5a3b22",hair:"crew",beard:"none",glasses:"none",body:"normal",
 face:"oval",nose:"straight",mouth:"normal",brows:"thick",eyes:"almond",expression:"neutral",age:30,grey:0,outfit:"suit",outfitColor:"#1d2a3c",accentColor:"#8a2230"};

function pick(list,v,fb){return list.some(x=>x[0]===v)?v:fb;}
function normalize(c){
 c=c&&typeof c==="object"?c:{};
 const outfit=pick(CATALOG.outfit,c.outfit,DEFAULTS.outfit);
 const od=OUTFIT_DEFAULT[outfit];
 let glasses=c.glasses;if(glasses===undefined&&c.accessory)glasses=c.accessory==="glasses"?"round":"none";
 return {
  skin:hex(c.skin,DEFAULTS.skin),hairColor:hex(c.hairColor,DEFAULTS.hairColor),eyeColor:hex(c.eyeColor,DEFAULTS.eyeColor),
  hair:pick(CATALOG.hair,c.hair==="short"?"crew":c.hair,DEFAULTS.hair),beard:pick(CATALOG.beard,c.beard,DEFAULTS.beard),
  glasses:pick(CATALOG.glasses,glasses,"none"),body:pick(CATALOG.body,c.body,DEFAULTS.body),
  face:pick(CATALOG.face,c.face,DEFAULTS.face),nose:pick(CATALOG.nose,c.nose,DEFAULTS.nose),mouth:pick(CATALOG.mouth,c.mouth,DEFAULTS.mouth),
  brows:pick(CATALOG.brows,c.brows,DEFAULTS.brows),eyes:pick(CATALOG.eyes,c.eyes,DEFAULTS.eyes),expression:pick(CATALOG.expression,c.expression,DEFAULTS.expression),
  age:clamp(Math.round(Number(c.age)||0),0,100),grey:clamp(Math.round(Number(c.grey)||0),0,100),
  outfit,outfitColor:hex(c.outfitColor,od[0]),accentColor:hex(c.accentColor,od[1])};
}
// ----- geometria do rosto -----
const FACES={oval:{cw:89,c1:.5,jw:52,chin:338},round:{cw:94,c1:.42,jw:72,chin:329},square:{cw:92,c1:.78,jw:80,chin:334},long:{cw:84,c1:.5,jw:46,chin:352}};
function facePath(k){const F=FACES[k]||FACES.oval,R=200+F.cw,L=200-F.cw,y1=206,cy=F.chin,c1y=y1+(cy-y1)*F.c1;
 return `M200 104 C${f(200+F.cw*.72)} 104 ${R} 148 ${R} ${y1} C${R-1} ${f(c1y)} ${f(200+F.jw)} ${cy-3} 200 ${cy} C${f(200-F.jw)} ${cy-3} ${L+1} ${f(c1y)} ${L} ${y1} C${L} 148 ${f(200-F.cw*.72)} 104 200 104Z`;}
// ----- cabelo -----
function hairLayers(h,c,col,grey){
 const base=mix(col,"#d6d7da",grey/100*.85),dark=mix(base,"#000",.35),lite=mix(base,"#fff",.22);
 const back=[],front=[];
 const cap=(top,line,alpha)=>`<path d="M${108} 216 C96 ${top+40} 148 ${top} 202 ${top} C258 ${top} 304 ${top+42} 292 216 C288 ${line+30} 274 ${line+8} 252 ${line} C226 ${line-6} 176 ${line-6} 148 ${line} C126 ${line+8} 112 ${line+30} 108 216Z" fill="${base}" opacity="${alpha||1}"/>`;
 const sheen=(y)=>`<path d="M146 ${y+14} C176 ${y} 232 ${y} 262 ${y+16}" fill="none" stroke="${lite}" stroke-width="5" stroke-linecap="round" opacity=".38"/>`;
 const shade=(y)=>`<path d="M146 ${y} C176 ${y-8} 232 ${y-8} 258 ${y+2} C236 ${y-6} 176 ${y-6} 146 ${y}Z" fill="${dark}" opacity=".5"/>`;
 switch(h){
  case"bald":front.push(`<path d="M111 216 C108 192 116 174 124 162 C122 186 124 202 130 216Z M289 216 C292 192 284 174 276 162 C278 186 276 202 270 216Z" fill="${base}" opacity=".9"/>`);break;
  case"buzz":front.push(cap(96,128,.5),`<path d="M111 216 C108 192 116 174 124 162 C122 186 124 202 130 216Z M289 216 C292 192 284 174 276 162 C278 186 276 202 270 216Z" fill="${base}" opacity=".6"/>`);break;
  case"crew":front.push(cap(84,134),sheen(98),shade(134));break;
  case"lowfade":front.push(cap(78,130,.4),`<path d="M124 152 C116 104 156 78 204 78 C254 78 288 106 276 152 C270 122 244 108 204 108 C164 108 138 122 124 152Z" fill="${base}"/><path d="M144 112 C176 84 232 84 262 112" fill="none" stroke="${lite}" stroke-width="6" stroke-linecap="round" opacity=".35"/>`);break;
  case"highfade":front.push(cap(82,124,.36),`<path d="M138 146 C130 94 166 66 204 66 C244 66 278 94 266 146 C260 114 238 100 204 100 C170 100 144 114 138 146Z" fill="${base}"/><path d="M158 92 C182 72 226 72 248 92" fill="none" stroke="${lite}" stroke-width="6" stroke-linecap="round" opacity=".35"/>`);break;
  case"curly":{let d="";const pts=[[130,120,22],[158,96,24],[192,86,26],[226,88,26],[256,100,24],[276,124,20],[140,146,16],[262,148,16],[205,112,22],[170,116,20],[240,116,20]];
   front.push(`<g fill="${base}">${pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="${p[2]}"/>`).join("")}</g><g fill="none" stroke="${dark}" stroke-width="2" opacity=".5">${pts.slice(0,8).map(p=>`<path d="M${p[0]-8} ${p[1]} a8 8 0 0 1 12 -6"/>`).join("")}</g>`);
   front.push(`<path d="M111 216 C106 190 112 168 120 150 C120 178 122 198 130 216Z M289 216 C294 190 288 168 280 150 C280 178 278 198 270 216Z" fill="${base}"/>`);break;}
  case"afro":back.push(`<ellipse cx="200" cy="126" rx="112" ry="90" fill="${base}"/>`);
   front.push(`<path d="M104 200 C90 130 130 92 200 92 C270 92 312 132 296 200 C288 166 272 146 250 138 C226 128 174 128 150 138 C128 146 112 166 104 200Z" fill="${base}"/><g fill="none" stroke="${dark}" stroke-width="2" opacity=".35"><path d="M150 100 q10 14 0 28 M190 92 q10 14 0 26 M232 94 q10 14 0 28 M270 112 q8 12 -2 22"/></g>`);break;
  case"twists":front.push(cap(88,134),`<g fill="${base}" stroke="${dark}" stroke-width="1.4">${Array.from({length:13},(_,i)=>{const x=134+i*11.5,y=90+Math.abs(i-6)*3.4,hgt=34+((i*7)%3)*6;return `<rect x="${f(x)}" y="${f(y)}" width="9" height="${hgt}" rx="4.5"/>`;}).join("")}</g>`);break;
  case"braids":front.push(cap(90,134),`<g fill="none" stroke="${lite}" stroke-width="2.4" opacity=".7">${Array.from({length:7},(_,i)=>{const x=148+i*17;return `<path d="M${x} 134 C${x-4} 116 ${x+2} 100 ${200+(x-200)*.8} 88"/>`;}).join("")}</g><path d="M111 216 C106 192 112 170 122 150 C120 180 124 200 130 216Z M289 216 C294 192 288 170 278 150 C280 180 276 200 270 216Z" fill="${base}"/>`);break;
  case"mullet":back.push(`<path d="M108 210 C92 270 104 330 132 352 C150 330 140 280 150 230Z M292 210 C308 270 296 330 268 352 C250 330 260 280 250 230Z" fill="${dark}"/>`);front.push(cap(82,132),sheen(96),shade(132));break;
  case"long":back.push(`<path d="M104 200 C84 280 96 350 128 384 L166 340 L166 230Z M296 200 C316 280 304 350 272 384 L234 340 L234 230Z" fill="${dark}"/>`);
   front.push(`<path d="M104 232 C86 130 148 76 204 78 C262 78 314 128 296 232 C292 182 280 152 258 140 C232 124 176 124 146 140 C124 156 112 190 104 232Z" fill="${base}"/><path d="M148 138 C190 104 244 112 264 146 C238 122 190 124 148 138Z" fill="${dark}" opacity=".55"/>`);break;
 }
 return {back:back.join(""),front:front.join(""),color:base};
}
function ageGrey(c){return clamp(Math.max(c.grey, (c.age-40)*0.9),0,100);}
// ----- óculos -----
function glassesSVG(g){
 if(g==="none")return "";
 const lens=g==="sun"?"#0b0e13":"#ffffff",op=g==="sun"?".88":".07";
 const shape=g==="round"?(x)=>`<circle cx="${x}" cy="210" r="24"/>`:(x)=>`<rect x="${x-29}" y="190" width="58" height="40" rx="${g==="sun"?10:14}"/>`;
 return `<g fill="${lens}" fill-opacity="${op}" stroke="#14171c" stroke-width="3.6">${shape(158)}${shape(242)}</g><path d="M${g==="round"?182:187} 208 Q200 200 ${g==="round"?218:213} 208 M${g==="round"?134:129} 208 L111 204 M${g==="round"?266:271} 208 L289 204" fill="none" stroke="#14171c" stroke-width="3.2"/>`;
}
// ----- roupa -----
function outfitSVG(c,id,shoulder){
 const m=c.outfitColor,a=c.accentColor,dm=mix(m,"#000",.28),lm=mix(m,"#fff",.14),W=shoulder;
 const torso=`M${f(200-W)} 480 C${f(212-W)} 404 124 376 200 376 C276 376 ${f(188+W)} 404 ${f(200+W)} 480Z`;
 let s=`<path d="${torso}" fill="url(#${id}t)"/>`;
 const collarShirt="#eef1f3";
 if(c.outfit==="suit"||c.outfit==="classic"||c.outfit==="vest"){
  const jacket=c.outfit!=="vest";
  const under=c.outfit==="classic"?a:collarShirt;
  s+=`<path d="M158 380 L200 452 L242 380 L222 372 L200 400 L178 372Z" fill="${under}"/>`;
  if(c.outfit==="suit"||c.outfit==="vest")s+=`<path d="M190 392 L210 392 L206 410 L213 468 L200 480 L187 468 L194 410Z" fill="${a}"/><path d="M190 392 L210 392 L207 402 L193 402Z" fill="${mix(a,'#000',.25)}"/>`;
  if(jacket)s+=`<path d="M158 380 L${f(124-W/4)} 480 L${f(200-W)} 480 C${f(212-W)} 404 100 384 158 380Z M242 380 L${f(276+W/4)} 480 L${f(200+W)} 480 C${f(188+W)} 404 300 384 242 380Z" fill="${m}"/><path d="M158 380 L196 462 L172 480 L124 480Z M242 380 L204 462 L228 480 L276 480Z" fill="${dm}" opacity=".6"/><path d="M158 380 L180 420 M242 380 L220 420" stroke="${lm}" stroke-width="2" opacity=".6"/>`;
  else s+=`<path d="M154 384 L200 470 L246 384 L252 480 L148 480Z" fill="${m}"/><path d="M200 470 V480" stroke="${dm}" stroke-width="2"/>`;
 }else if(c.outfit==="shirt"){
  s+=`<path d="M160 376 L200 430 L240 376 L224 368 L200 396 L176 368Z" fill="${mix(m,'#fff',.2)}"/><path d="M200 396 V480" stroke="${dm}" stroke-width="2.4" opacity=".6"/><g fill="${dm}" opacity=".55"><circle cx="200" cy="420" r="2.6"/><circle cx="200" cy="448" r="2.6"/></g><path d="M160 376 L200 430 L240 376" fill="none" stroke="${a}" stroke-width="3"/>`;
 }else if(c.outfit==="polo"){
  s+=`<path d="M160 376 L200 424 L240 376 L224 366 L200 392 L176 366Z" fill="${a}"/><path d="M200 392 V438" stroke="${dm}" stroke-width="3"/><circle cx="200" cy="408" r="3" fill="#0007"/><circle cx="200" cy="426" r="3" fill="#0007"/>`;
 }else if(c.outfit==="tracksuit"){
  s+=`<path d="M156 372 C168 396 232 396 244 372 L252 392 C230 412 170 412 148 392Z" fill="${lm}"/><path d="M200 400 V480" stroke="${a}" stroke-width="3.4"/><path d="M${f(200-W+24)} 430 C${f(200-W+34)} 450 ${f(200-W+40)} 466 ${f(200-W+44)} 480" stroke="${a}" stroke-width="5" fill="none" opacity=".9"/><path d="M${f(200+W-24)} 430 C${f(200+W-34)} 450 ${f(200+W-40)} 466 ${f(200+W-44)} 480" stroke="${a}" stroke-width="5" fill="none" opacity=".9"/><rect x="266" y="420" width="30" height="8" rx="4" fill="#ffffff44"/>`;
 }else if(c.outfit==="jacket"){
  s+=`<path d="M150 392 C150 364 170 346 200 346 C230 346 250 364 250 392 L236 396 C236 376 224 366 200 366 C176 366 164 376 164 396Z" fill="${lm}"/><path d="M200 396 V480" stroke="${a}" stroke-width="3" opacity=".8"/><path d="M148 392 L136 480 M252 392 L264 480" stroke="${dm}" stroke-width="3" opacity=".5"/>`;
 }
 return s;
}
// ----- retrato -----
function svg(input,opts){
 opts=opts||{};
 const c=normalize(input),id="ca"+(opts.uid||Math.random().toString(36).slice(2,7));
 const sk=c.skin,shade=mix(sk,"#3a1d12",.28),deep=mix(sk,"#2a120a",.45),hi=mix(sk,"#ffffff",.22),lip=mix(sk,"#8e2f3a",.38);
 const grey=ageGrey(c),hl=hairLayers(c.hair,c,c.hairColor,grey),hc=hl.color,hcd=mix(hc,"#000",.35);
 const age=clamp(c.age/100,0,1),shoulder={slim:132,normal:150,strong:168}[c.body]||150;
 const face=facePath(c.face);
 const F=FACES[c.face]||FACES.oval,earX=F.cw+0;
 const eyeShape={almond:{rx:22,up:12,dn:9,ir:10.5},round:{rx:20,up:13,dn:12,ir:11.5},narrow:{rx:23,up:9,dn:7,ir:9.5},hooded:{rx:22,up:8,dn:9,ir:10}}[c.eyes];
 let g=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 480" role="img" aria-label="Retrato do treinador"><defs>
 <radialGradient id="${id}f" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="${hi}"/><stop offset=".55" stop-color="${sk}"/><stop offset="1" stop-color="${shade}"/></radialGradient>
 <linearGradient id="${id}n" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${deep}"/><stop offset="1" stop-color="${shade}"/></linearGradient>
 <linearGradient id="${id}t" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${mix(c.outfitColor,'#fff',.1)}"/><stop offset="1" stop-color="${mix(c.outfitColor,'#000',.16)}"/></linearGradient>
 <clipPath id="${id}c"><path d="${face}"/></clipPath>
 <filter id="${id}s" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>`;
 g+=outfitSVG(c,id,shoulder);
 g+=`<path d="M164 296 C166 340 160 366 150 384 C170 404 230 404 250 384 C240 366 234 340 236 296Z" fill="url(#${id}n)"/><path d="M164 330 C186 352 214 352 236 330 L236 296 L164 296Z" fill="#0004"/>`;
 g+=hl.back;
 for(const s of [-1,1]){const x=200+s*(F.cw);g+=`<ellipse cx="${x}" cy="216" rx="15" ry="26" fill="${sk}"/><path d="M${x+s*3} 204 C${x+s*10} 216 ${x+s*6} 232 ${x} 236" fill="none" stroke="${shade}" stroke-width="3" stroke-linecap="round"/>`;}
 g+=`<path d="${face}" fill="url(#${id}f)"/><g clip-path="url(#${id}c)"><path d="M111 240 C140 330 170 340 200 338 L111 340Z M289 240 C260 330 230 340 200 338 L289 340Z" fill="${shade}" opacity=".35"/><ellipse cx="200" cy="130" rx="86" ry="28" fill="${deep}" opacity=".22" filter="url(#${id}s)"/><ellipse cx="146" cy="262" rx="26" ry="16" fill="#c0556a" opacity=".10" filter="url(#${id}s)"/><ellipse cx="254" cy="262" rx="26" ry="16" fill="#c0556a" opacity=".10" filter="url(#${id}s)"/></g>`;
 if(age>.08){const a=age;
  g+=`<g fill="none" stroke="${deep}" stroke-linecap="round" opacity="${f(.15+.45*a)}" stroke-width="${f(1.1+a)}"><path d="M150 148 Q200 140 250 148"/><path d="M156 160 Q200 153 244 160" opacity=".7"/>${a>.35?'<path d="M168 138 Q200 132 232 138" opacity=".6"/>':''}<path d="M${200-F.cw+12} 207 q-10 -3 -14 -9 M${200-F.cw+12} 214 q-11 0 -15 -3"/><path d="M${200+F.cw-12} 207 q10 -3 14 -9 M${200+F.cw-12} 214 q11 0 15 -3"/><path d="M164 262 C158 280 158 292 164 304"/><path d="M236 262 C242 280 242 292 236 304"/>${a>.5?'<path d="M176 232 q-6 10 0 18 M224 232 q6 10 0 18" opacity=".6"/>':''}</g>`;}
 // olhos
 const E=eyeShape;
 for(const s of [-1,1]){const cx=200+s*42,cy=208,p=`M${cx-E.rx} ${cy} C${cx-10} ${cy-E.up} ${cx+10} ${cy-E.up} ${cx+E.rx} ${cy} C${cx+10} ${cy+E.dn} ${cx-10} ${cy+E.dn} ${cx-E.rx} ${cy}Z`;
  g+=`<path d="${p}" fill="#f3efe9"/><clipPath id="${id}e${s>0?1:0}"><path d="${p}"/></clipPath><g clip-path="url(#${id}e${s>0?1:0})"><circle cx="${cx+s}" cy="${cy-.5}" r="${E.ir}" fill="${c.eyeColor}"/><circle cx="${cx+s}" cy="${cy-.5}" r="${E.ir}" fill="none" stroke="${mix(c.eyeColor,'#000',.5)}" stroke-width="1.6"/><circle cx="${cx+s}" cy="${cy-.5}" r="${f(E.ir*.48)}" fill="#0b0b0e"/><circle cx="${cx+s-3.5}" cy="${cy-4}" r="2.6" fill="#fff" opacity=".9"/><rect x="${cx-26}" y="${cy-16}" width="52" height="${c.eyes==="hooded"?12:8}" fill="#000" opacity="${c.eyes==="hooded"?.28:.16}"/></g>`;
  g+=`<path d="M${cx-E.rx-2} ${cy+1} C${cx-10} ${cy-E.up-2} ${cx+10} ${cy-E.up-2} ${cx+E.rx+2} ${cy+1}" fill="none" stroke="${mix(deep,'#000',.4)}" stroke-width="${c.eyes==="hooded"?3.6:3}" stroke-linecap="round"/><path d="M${cx-E.rx+2} ${cy+8} C${cx-8} ${cy+E.dn+5} ${cx+8} ${cy+E.dn+5} ${cx+E.rx-2} ${cy+8}" fill="none" stroke="${shade}" stroke-width="1.6" opacity=".6"/>`;
  const bw={thick:8,thin:4.2,angled:6.5,straight:6.5}[c.brows],by=cy-(c.brows==="angled"?22:20),lift=c.brows==="angled"?-9:-10,inner=c.brows==="angled"?6:(c.expression==="serious"?5:0),outer=c.brows==="angled"?-6:(c.expression==="serious"?-2:0);
  const ix=cx-s*26,ox=cx+s*28;
  g+=`<path d="M${ix} ${by+inner} C${cx-s*12} ${by+lift+inner/2} ${cx+s*12} ${by+lift+(c.brows==="straight"?inner:0)} ${ox} ${by+1+outer}" fill="none" stroke="${grey>40?mix(hc,"#fff",.1):hc}" stroke-width="${bw+(age>.5?1.5:0)}" stroke-linecap="round" opacity=".95"/>`;}
 // nariz
 const nw={straight:16,wide:23,small:13,long:17}[c.nose],nl={straight:258,wide:260,small:252,long:268}[c.nose];
 g+=`<path d="M200 206 C195 236 ${200-nw/2-4} ${nl-10} ${200-nw} ${nl+4} C192 ${nl+14} 208 ${nl+14} ${200+nw} ${nl+4} C${200+nw/2+4} ${nl-10} 205 236 200 206Z" fill="${shade}" opacity=".32"/><path d="M${200-nw+2} ${nl+4} C${200-nw/2} ${nl+12} ${200+nw/2} ${nl+12} ${200+nw-2} ${nl+4}" fill="none" stroke="${deep}" stroke-width="2.4" stroke-linecap="round" opacity=".8"/><ellipse cx="${200-nw/2-1}" cy="${nl+8}" rx="${f(nw/5)}" ry="2.2" fill="${deep}" opacity=".7"/><ellipse cx="${200+nw/2+1}" cy="${nl+8}" rx="${f(nw/5)}" ry="2.2" fill="${deep}" opacity=".7"/><path d="M196 218 C194 240 192 250 ${200-nw/2-3} ${nl-4}" stroke="${hi}" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/>`;
 // barba (atrás da boca)
 const bd=c.beard,bcol=mix(hc,"#000",.1);
 if(bd==="stubble"||bd==="short"||bd==="full"){
  const op=bd==="stubble"?.34:.97,cw=F.cw,my=bd==="full"?238:244;
  g+=`<g opacity="${op}"><path d="M${200-cw} ${my} C${200-cw+2} 296 154 ${F.chin+16} 200 ${F.chin+16} C246 ${F.chin+16} ${200+cw-2} 296 ${200+cw} ${my} C${200+cw-6} 262 ${200+cw-20} 276 248 284 C232 282 216 284 200 284 C184 284 168 282 152 284 C${200-cw+20} 276 ${200-cw+6} 262 ${200-cw} ${my}Z" fill="${bcol}"/>${bd==="full"?`<path d="M158 298 C176 314 224 314 242 298 C232 322 216 336 200 336 C184 336 168 322 158 298Z" fill="${bcol}"/>`:""}</g>`;
 }
 if(bd==="goatee")g+=`<path d="M168 302 C176 322 190 336 200 340 C210 336 224 322 232 302 C220 312 180 312 168 302Z" fill="${bcol}"/>`;
 // boca
 const lt={normal:1,full:1.35,thin:.7}[c.mouth],ex=c.expression;
 const corner=ex==="smile"?-5:ex==="grin"?-8:ex==="serious"?3:0, open=ex==="grin";
 const my=298;
 if(open){g+=`<path d="M164 ${my-2} C180 ${my+2+corner} 220 ${my+2+corner} 236 ${my-2} C228 ${my+22} 172 ${my+22} 164 ${my-2}Z" fill="#5a1d24"/><path d="M170 ${my+1} C186 ${my+5} 214 ${my+5} 230 ${my+1} L228 ${my+8} C212 ${my+12} 188 ${my+12} 172 ${my+8}Z" fill="#f6f2ec"/>`;}
 else g+=`<path d="M${166} ${my+corner} C182 ${my-7*lt} 194 ${my-6*lt} 200 ${my-3*lt} C206 ${my-6*lt} 218 ${my-7*lt} ${234} ${my+corner} C220 ${my+11*lt} 180 ${my+11*lt} ${166} ${my+corner}Z" fill="${lip}"/><path d="M${168} ${my+corner} C184 ${my+3} 216 ${my+3} ${232} ${my+corner}" fill="none" stroke="${mix(lip,'#000',.5)}" stroke-width="2.2" stroke-linecap="round"/><path d="M180 ${my+10*lt} C192 ${my+14*lt} 208 ${my+14*lt} 220 ${my+10*lt}" fill="none" stroke="${hi}" stroke-width="2.4" opacity=".35" stroke-linecap="round"/>`;
 if(ex==="smile"||ex==="grin")g+=`<path d="M160 ${my-6+corner*-1} q-4 6 0 12 M240 ${my-6+corner*-1} q4 6 0 12" fill="none" stroke="${deep}" stroke-width="1.8" opacity=".4" stroke-linecap="round"/>`;
 if(bd==="short"||bd==="full"||bd==="mustache"||bd==="goatee")g+=`<path d="M164 286 C180 274 194 280 200 284 C206 280 220 274 236 286 C222 293 208 288 200 290 C192 288 178 293 164 286Z" fill="${bcol}" opacity=".97"/>`;
 g+=hl.front+glassesSVG(c.glasses)+`</svg>`;
 return g;
}
// ----- modelos prontos -----
const PRESETS=[
 {id:"mentor",name:"O Mentor",age:58,cfg:{skin:"#efc6a6",hairColor:"#8a8a8e",eyeColor:"#4f7d54",hair:"crew",beard:"short",glasses:"round",face:"square",nose:"straight",mouth:"thin",brows:"thick",eyes:"hooded",expression:"serious",age:62,grey:80,body:"normal",outfit:"classic",outfitColor:"#2c3a4c",accentColor:"#d9dde0"}},
 {id:"jovem",name:"Promessa",age:33,cfg:{skin:"#e2b48f",hairColor:"#241e1a",eyeColor:"#5a3b22",hair:"lowfade",beard:"stubble",glasses:"none",face:"oval",nose:"straight",mouth:"normal",brows:"angled",eyes:"almond",expression:"smile",age:8,grey:0,body:"normal",outfit:"polo",outfitColor:"#1a5a4a",accentColor:"#f0f3f2"}},
 {id:"estrategista",name:"Estrategista",age:46,cfg:{skin:"#c99a74",hairColor:"#0f0c0a",eyeColor:"#2a1a10",hair:"crew",beard:"full",glasses:"none",face:"oval",nose:"long",mouth:"normal",brows:"thick",eyes:"almond",expression:"serious",age:35,grey:15,body:"normal",outfit:"suit",outfitColor:"#1d2a3c",accentColor:"#8a2230"}},
 {id:"veterano",name:"Veterano",age:63,cfg:{skin:"#7d5238",hairColor:"#d9d9dc",eyeColor:"#2a1a10",hair:"bald",beard:"full",glasses:"none",face:"round",nose:"wide",mouth:"full",brows:"thick",eyes:"hooded",expression:"smile",age:75,grey:100,body:"strong",outfit:"tracksuit",outfitColor:"#20384a",accentColor:"#b8f32e"}},
 {id:"professor",name:"Professor",age:41,cfg:{skin:"#f6d9c3",hairColor:"#7a5236",eyeColor:"#3f7fb0",hair:"lowfade",beard:"goatee",glasses:"square",face:"long",nose:"small",mouth:"thin",brows:"thin",eyes:"narrow",expression:"neutral",age:28,grey:10,body:"slim",outfit:"vest",outfitColor:"#2a3340",accentColor:"#e9eef2"}},
 {id:"carisma",name:"Carismático",age:39,cfg:{skin:"#5a3826",hairColor:"#0f0c0a",eyeColor:"#2a1a10",hair:"curly",beard:"short",glasses:"none",face:"round",nose:"wide",mouth:"full",brows:"thick",eyes:"round",expression:"grin",age:18,grey:0,body:"strong",outfit:"shirt",outfitColor:"#e9eef2",accentColor:"#2f4a6b"}},
 {id:"classico",name:"Clássico",age:52,cfg:{skin:"#efc6a6",hairColor:"#c9a66b",eyeColor:"#6b7f8c",hair:"highfade",beard:"mustache",glasses:"none",face:"square",nose:"straight",mouth:"normal",brows:"straight",eyes:"almond",expression:"neutral",age:45,grey:40,body:"normal",outfit:"jacket",outfitColor:"#3a4a3c",accentColor:"#d8dfe2"}},
 {id:"tecnico",name:"Linha dura",age:48,cfg:{skin:"#a8744f",hairColor:"#241e1a",eyeColor:"#5a3b22",hair:"buzz",beard:"stubble",glasses:"sun",face:"square",nose:"straight",mouth:"thin",brows:"angled",eyes:"narrow",expression:"serious",age:40,grey:20,body:"strong",outfit:"tracksuit",outfitColor:"#262a34",accentColor:"#ff7a1a"}},
 {id:"jovem2",name:"Visual moderno",age:35,cfg:{skin:"#c99a74",hairColor:"#4a3224",eyeColor:"#7a5a30",hair:"crew",beard:"none",glasses:"none",face:"oval",nose:"small",mouth:"full",brows:"thin",eyes:"round",expression:"smile",age:5,grey:0,body:"slim",outfit:"polo",outfitColor:"#7a1f2b",accentColor:"#f0f3f2"}},
 {id:"sabio",name:"Sábio",age:60,cfg:{skin:"#3d2519",hairColor:"#d9d9dc",eyeColor:"#2a1a10",hair:"afro",beard:"full",glasses:"round",face:"oval",nose:"wide",mouth:"normal",brows:"thick",eyes:"hooded",expression:"smile",age:70,grey:90,body:"normal",outfit:"suit",outfitColor:"#2a2f36",accentColor:"#2f4a6b"}}
];
// ----- sorteio determinístico -----
function seeded(seed){let s=(Number(seed)||1)>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
function randomize(seed){
 const r=seeded(seed||Date.now()),p=l=>l[Math.floor(r()*l.length)][0],pc=l=>l[Math.floor(r()*l.length)];
 const age=Math.round(r()*85),outfit=p(CATALOG.outfit),od=OUTFIT_DEFAULT[outfit];
 return normalize({skin:pc(SKINS.map(x=>[x]))[0],hairColor:pc(HAIRS.map(x=>[x]))[0],eyeColor:pc(EYES.map(x=>[x]))[0],hair:p(CATALOG.hair),beard:r()<.45?"none":p(CATALOG.beard),glasses:r()<.75?"none":p(CATALOG.glasses),body:p(CATALOG.body),face:p(CATALOG.face),nose:p(CATALOG.nose),mouth:p(CATALOG.mouth),brows:p(CATALOG.brows),eyes:p(CATALOG.eyes),expression:p(CATALOG.expression),age,grey:Math.max(0,Math.round((age-35)*r()*1.5)),outfit,outfitColor:od[0],accentColor:od[1]});
}
// Compatibilidade com campos antigos do formulário (hair/beard/accessory/body continuam válidos para o motor).
function toAppearance(c){c=normalize(c);return {skin:c.skin,hairColor:c.hairColor,eyeColor:c.eyeColor,hair:c.hair,beard:c.beard,body:c.body,accessory:c.glasses==="none"?"none":"glasses"};}
const FIELDS=["skin","hairColor","eyeColor","hair","beard","glasses","body","face","nose","mouth","brows","eyes","expression","age","grey","outfit","outfitColor","accentColor"];
// "age" colide com a idade do treinador no formulário; o campo de rugas chama-se ageLook.
const FORM_NAME={age:"ageLook"};
const FORM_FIELDS=FIELDS.map(k=>FORM_NAME[k]||k);
function configFromForm(form){const o={};for(const k of FIELDS){const el=form.elements[FORM_NAME[k]||k];if(el)o[k]=el.value;}return normalize(o);}
function applyToForm(form,cfg){const c=normalize(cfg);for(const k of FIELDS){const el=form.elements[FORM_NAME[k]||k];if(el)el.value=String(c[k]);}return c;}
function render(host,cfg,opts){if(!host)return false;host.innerHTML=svg(cfg,opts);host.dataset.avatarState="2d";host.dataset.avatar=JSON.stringify(normalize(cfg));return true;}
const api={CATALOG,SKINS,HAIRS,EYES,OUTFIT_DEFAULT,DEFAULTS,PRESETS,normalize,svg,render,randomize,toAppearance,configFromForm,applyToForm,FIELDS,FORM_FIELDS,version:1};
root.ProLifeCoachAvatar2D=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
