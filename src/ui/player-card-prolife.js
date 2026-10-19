(function(root){
'use strict';
// Retrato procedural, estavel por ID, sem persistencia e sem suposicoes sobre identidade real.
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=n=>Math.max(0,Math.min(100,Math.round(Number(n)||0)));
function hash(s){let h=2166136261;for(const c of String(s)){h=Math.imul(h^c.charCodeAt(0),16777619);}return h>>>0;}
function portrait(player){
 const key=String(player?.id??player?.eaId??player?.name??'anonymous');
 const h=hash(key);
 const pick=(a,s)=>a[(h>>>s)%a.length];

 const skins=['#bc8660','#8c5d43','#d5a77d','#704833','#e4b18c','#ac7453','#634234','#d69b72','#c99475','#9b694e','#eac19b','#80503c'];
 const hairs=['#141b22','#372720','#231c1b','#50362b','#654532','#1d252a','#302a2a','#463124'];
 const shirts=['#233b56','#27605e','#593e66','#37506c','#4e5563','#245a78','#4d3640','#28526b'];
 const skin=pick(skins,0),hair=pick(hairs,5),shirt=pick(shirts,10);
 const faceWidth=pick([26,28,30,32,29,27],14);
 const eyeY=pick([65,67,69,71],18);
 const hairStyle=pick([0,1,2,3,4,5,6,7],21);
 const beard=(h>>>17)%4===0;
 const moustache=(h>>>24)%5===0;
 const smile=(h>>>27)%3===0;
 const eyeGap=pick([11,12,13,14],9);

 const styles=[
 '<path d="M48 45Q43 15 79 14q34-2 35 31-11-15-34-13-22-3-32 13Z"/>',
 '<path d="M48 46Q36 10 69 15q28-16 43 14l2 16-12-13-15-3-24 8Z"/>',
 '<path d="M48 42Q47 11 80 11t33 31q-12-13-32-10-20-3-33 10Z"/>',
 '<path d="M47 46Q41 21 59 16q9-12 23-8 29-1 32 37l-10-13-13 3-15-10-14 11Z"/>',
 '<path d="M47 47Q40 19 63 17q21-18 41 2 14 9 10 28l-8-12-14-4-13 7-14-6Z"/>',
 '<path d="M50 39Q48 21 63 16q24-11 40 4l8 21q-23-13-61-2Z"/>',
 '<path d="M47 44q-4-33 32-35 35-1 35 35l-10-13-9 4-13-8-12 8-9-3Z"/>',
 '<path d="M49 42Q43 13 79 16q34-4 33 27-15-11-31-11-19-1-32 10Z"/>'
 ];
 const ear='<ellipse cx="49" cy="78" rx="5" ry="9" fill="'+skin+'"/><ellipse cx="111" cy="78" rx="5" ry="9" fill="'+skin+'"/>';
 const jaw='<path d="M80 23C'+(80-faceWidth)+' 23 '+(80-faceWidth-6)+' 53 '+(80-faceWidth)+' 83Q'+(80-faceWidth+1)+' 110 80 117Q'+(80+faceWidth-1)+' 110 '+(80+faceWidth)+' 83C'+(80+faceWidth+6)+' 53 '+(80+faceWidth)+' 23 80 23Z" fill="'+skin+'"/>';
 const brows='<g stroke="'+hair+'" stroke-width="3.3" stroke-linecap="round"><path d="M'+(80-eyeGap-8)+' '+(eyeY-9)+'q7-3 14 0"/><path d="M'+(80+eyeGap-6)+' '+(eyeY-9)+'q7-3 14 0"/></g>';
 const eyes='<g fill="#202128"><ellipse cx="'+(80-eyeGap)+'" cy="'+eyeY+'" rx="2.4" ry="2.2"/><ellipse cx="'+(80+eyeGap)+'" cy="'+eyeY+'" rx="2.4" ry="2.2"/></g>';
 const mouth=smile?'<path d="M69 96q11 10 22 0" stroke="#713b3a" stroke-width="2" fill="none" stroke-linecap="round"/>':'<path d="M71 97q9 3 18 0" stroke="#713b3a" stroke-width="2" fill="none" stroke-linecap="round"/>';
 const facial=(beard?'<path d="M54 88q2 25 26 28 24-3 26-28-10 21-26 20-16 1-26-20Z" fill="'+hair+'" opacity=".78"/>':'')+(moustache?'<path d="M68 92q7-5 12 0 5-5 12 0-12 4-24 0Z" fill="'+hair+'" opacity=".8"/>':'');
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 170" role="img" aria-label="Retrato ilustrado"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#274961"/><stop offset="1" stop-color="#081823"/></linearGradient><linearGradient id="light" x1="0" x2="1"><stop stop-color="#ffffff" stop-opacity=".1"/><stop offset="1" stop-color="#000000" stop-opacity=".16"/></linearGradient></defs><rect width="160" height="170" rx="14" fill="url(#bg)"/><circle cx="128" cy="34" r="52" fill="#cce94c" opacity=".055"/><path d="M0 170Q5 127 54 121h52q49 5 54 49Z" fill="'+shirt+'"/><path d="M52 123l28 25 28-25" stroke="#ceeb43" stroke-width="3" fill="none"/><rect x="67" y="107" width="26" height="25" rx="9" fill="'+skin+'"/>'+ear+jaw+'<g fill="'+hair+'">'+styles[hairStyle]+'</g>'+brows+eyes+'<path d="M80 70l-4 15q4 4 9 0" stroke="#784c3c" stroke-width="1.6" fill="none" stroke-linecap="round"/>'+mouth+facial+'<path d="M0 0h160v170H0Z" fill="url(#light)" opacity=".45"/></svg>';
 return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
}
function stat(player,keys){const a=player?.attrs||{};const values=keys.map(k=>Number(a[k])).filter(n=>Number.isFinite(n)&&n>=0&&n<=100);return values.length?clamp(values.reduce((s,n)=>s+n,0)/values.length):null;}
const definitions=[['RIT',['pace','acceleration','sprint']],['FIN',['finish','powerShot','longShot','positioning']],['PAS',['pass','longPass','vision']],['CON',['dribbling','ballControl','agility','balance']],['DEF',['defense','tackling','interception']],['FIS',['strength','stamina','jumping']]];
function render(player,opts={}){
 const visible=opts.showStats===true,ger=visible?Number(opts.overall):NaN;
 const overall=visible&&Number.isFinite(ger)?clamp(ger):'—';
 const club=opts.club||'Sem clube';const crest=opts.crest||'';
 const statHtml=definitions.map(([name,keys])=>'<span><small>'+name+'</small><b>'+(visible?(stat(player,keys)??'—'):'—')+'</b></span>').join('');
 return '<div class="pl-pro-card" aria-label="Card de '+esc(player?.name||'Atleta')+'"><div class="pl-pro-rating"><b>'+overall+'</b><small>'+esc(player?.primaryPosition||player?.pos||player?.position||'—')+'</small></div><img class="pl-pro-face" src="'+portrait(player)+'" alt="Retrato ilustrado de '+esc(player?.name||'atleta')+'"><strong class="pl-pro-name">'+esc(player?.name||'Atleta')+'</strong><div class="pl-pro-meta"><span>'+esc(player?.nationality||player?.nation||'Nacionalidade não informada')+'</span><span class="pl-pro-club">'+crest+' '+esc(club)+'</span></div><div class="pl-pro-stats">'+statHtml+'</div></div>';
}
root.ProLifePlayerCard=Object.freeze({portrait,render,stat});
if(typeof module!=='undefined'&&module.exports)module.exports=root.ProLifePlayerCard;
})(typeof globalThis!=='undefined'?globalThis:this);
