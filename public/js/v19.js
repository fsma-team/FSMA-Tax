/* v19: themes (10, mỗi người tự chọn), Hello ___ theo theme + món ruột + cung hoàng đạo, bầu trời theo giờ & thời tiết,
   Nhịp hôm nay (Kỷ lục mới, Bảng dán giấy, Trưa nay ăn gì, mood), Top producers theo tuần, Summary dời xuống,
   Appointment (nhìn như ghi chú, 7 ngày, ngày đã qua làm mờ, Business, số điện thoại trùng), tab nhân viên theo theme.
   Loaded after v18.js. Overrides some functions, then calls start(). */
var V19=(function(){
  var THEMES=[["simple","Simplistic"],["genz","Gen-Z"],["pro","Professional"],["autumn","Mùa thu"],["rain","Mùa mưa"],["amazon","Rừng Amazon"],["hawaii","Biển Hawaii"],["snack","Ăn vặt"],["chill","Chill"],["city","Đô thị"]];
  var ZOD={aries:["♈","Bạch Dương"],taurus:["♉","Kim Ngưu"],gemini:["♊","Song Tử"],cancer:["♋","Cự Giải"],leo:["♌","Sư Tử"],virgo:["♍","Xử Nữ"],libra:["♎","Thiên Bình"],scorpio:["♏","Bọ Cạp"],sagittarius:["♐","Nhân Mã"],capricorn:["♑","Ma Kết"],aquarius:["♒","Bảo Bình"],pisces:["♓","Song Ngư"]};
  var TAROT=[["THE STAR","hy vọng, mọi thứ sáng dần"],["THE SUN","năng lượng tốt, làm gì cũng suôn"],["THE MOON","chậm lại, kiểm tra kỹ SSN"],["WHEEL OF FORTUNE","may mắn bất ngờ"],["THE WORLD","hoàn thành, xong việc sớm"],["STRENGTH","bình tĩnh mà mạnh mẽ"],["THE MAGICIAN","khéo tay, file nào cũng gọn"],["TEMPERANCE","cân bằng, uống đủ nước"]];
  var MOODS=["😎","☕","🥱","🤯","🥳"];
  var OFFICE={lat:33.7592,lon:-117.9897,name:"Westminster"};
  function theme(){return (S.me&&S.me.theme)||"simple"}
  function reduced(){try{return matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){return false}}

  /* ---------- text measuring ---------- */
  var cv=document.createElement("canvas").getContext("2d");
  function tw(txt,sz){cv.font="800 "+sz+"px Nunito, 'Segoe UI', sans-serif";return Math.max(cv.measureText(txt).width,140)}
  function T(x,y,txt,fill,sz,ex){return '<text x="'+x+'" y="'+y+'" text-anchor="middle" dominant-baseline="central" font-family="Nunito, Segoe UI, sans-serif" font-weight="800" font-size="'+sz+'" style="fill:'+fill+'" '+(ex||'')+'>'+esc(txt)+'</text>'}
  function svgW(W,H,body,cls){return '<svg class="scene '+(cls||'')+'" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Hello">'+body+'</svg>'}
  function cloudPath(w,h){var b=h-8;
    return 'M'+(w*.1)+' '+b+' C'+(w*.01)+' '+b+' 0 '+(h*.6)+' '+(w*.05)+' '+(h*.46)+' C'+(w*.07)+' '+(h*.34)+' '+(w*.14)+' '+(h*.3)+' '+(w*.19)+' '+(h*.32)+
    ' C'+(w*.2)+' '+(h*.08)+' '+(w*.4)+' '+(h*.0)+' '+(w*.48)+' '+(h*.18)+' C'+(w*.55)+' '+(h*-.02)+' '+(w*.8)+' '+(h*.0)+' '+(w*.84)+' '+(h*.28)+
    ' C'+(w*.97)+' '+(h*.27)+' '+(w)+' '+(h*.5)+' '+(w*.96)+' '+(h*.64)+' C'+(w*.99)+' '+(h*.86)+' '+(w*.91)+' '+b+' '+(w*.85)+' '+b+
    ' C'+(w*.72)+' '+(h+3)+' '+(w*.57)+' '+(h-1)+' '+(w*.5)+' '+(b-4)+' C'+(w*.42)+' '+(h+1)+' '+(w*.22)+' '+(h+3)+' '+(w*.1)+' '+b+' Z'}

  /* ---------- món ruột (vẽ bằng code) ---------- */
  var OL='stroke="#4a3a2e" stroke-width="2" stroke-linejoin="round"';
  function cupBody(id,layers,lid){var cup='M15 20 L49 20 L45 58 Q44.6 61 41.5 61 L22.5 61 Q19.4 61 19 58 Z';
    return '<defs><clipPath id="'+id+'"><path d="'+cup+'"/></clipPath></defs><path d="'+cup+'" fill="#fffaf4"/><g clip-path="url(#'+id+')">'+layers.map(function(l){return '<rect x="0" y="'+l[0]+'" width="64" height="64" fill="'+l[1]+'"/>'}).join('')+'</g><path d="'+cup+'" fill="none" '+OL+'/><path d="M20 25 L22.5 54" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>'+(lid||'')}
  function pearls(){var s='';[[24,55],[30,56],[36,55],[42,54],[27,50],[33,51],[39,50]].forEach(function(p){s+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="2.8" fill="#3b2a20"/>'});return s}
  function ice(){return '<rect x="22" y="27" width="8" height="8" rx="2" fill="#fff" opacity=".75" transform="rotate(-12 26 31)"/><rect x="33" y="30" width="8" height="8" rx="2" fill="#fff" opacity=".7" transform="rotate(10 37 34)"/>'}
  function bowl(broth,inside){return '<rect x="22" y="55" width="20" height="5" rx="2" fill="#fff" '+OL+'/><path d="M7 30 Q8 54 32 56 Q56 54 57 30 Z" fill="#fff" '+OL+'/><path d="M14 44 Q32 50 50 44" stroke="#7fb2d9" stroke-width="2.2" fill="none"/><ellipse cx="32" cy="30" rx="25" ry="7" fill="'+broth+'" '+OL+'/>'+inside}
  var FOOD={
   boba:{n:"Trà sữa trân châu",s:function(){return cupBody('fb1',[[26,'#d8b08a']],'<path d="M13 21 Q32 4 51 21 Z" fill="#fff" opacity=".85" '+OL+'/><rect x="34" y="1" width="6" height="40" rx="3" fill="#ff8fab" '+OL+' transform="rotate(12 37 20)"/>')+pearls()}},
   trabb:{n:"Trà trái cây trân châu",s:function(){return cupBody('fb2',[[24,'#f5a54a'],[46,'#e8892c']],'<rect x="13" y="17" width="38" height="5" rx="2" fill="#fff" '+OL+'/><rect x="33" y="0" width="6" height="40" rx="3" fill="#7bc96f" '+OL+' transform="rotate(10 36 20)"/><circle cx="23" cy="33" r="6" fill="#fff36b" '+OL+'/><path d="M23 27v12M17 33h12" stroke="#d6c21f" stroke-width="1.4"/>')+pearls()}},
   che:{n:"Chè",s:function(){return cupBody('fb3',[[24,'#fff6e6'],[36,'#f6d264'],[47,'#7cc36a']],'<path d="M42 4 L36 34" stroke="#bdbdbd" stroke-width="3" stroke-linecap="round"/><ellipse cx="43" cy="5" rx="4" ry="2.5" fill="#d9d9d9" '+OL+'/>')+'<circle cx="26" cy="41" r="1.8" fill="#a23b3b"/><circle cx="33" cy="42" r="1.8" fill="#a23b3b"/><circle cx="39" cy="40" r="1.8" fill="#a23b3b"/><circle cx="29" cy="29" r="1.6" fill="#e8d9b5"/><circle cx="37" cy="28" r="1.6" fill="#e8d9b5"/>'}},
   cavien:{n:"Cá viên chiên",s:function(){var b='';[[20,44],[31,32],[42,20]].forEach(function(p){b+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="9" fill="#e9a23b" '+OL+'/><circle cx="'+(p[0]-3)+'" cy="'+(p[1]-3)+'" r="2.4" fill="#ffd27a"/>'});return '<path d="M10 56 L54 10" stroke="#a87a4a" stroke-width="3" stroke-linecap="round"/>'+b+'<path d="M16 40 q4 4 8 1 M27 28 q4 4 8 1" stroke="#d6362f" stroke-width="2.2" fill="none" stroke-linecap="round"/>'}},
   bovien:{n:"Bò viên",s:function(){return bowl('#c98b4b','<circle cx="24" cy="29" r="5" fill="#7a4b2a" '+OL+'/><circle cx="35" cy="27" r="5" fill="#7a4b2a" '+OL+'/><circle cx="42" cy="31" r="4.5" fill="#7a4b2a" '+OL+'/><ellipse cx="30" cy="32" rx="3" ry="1.4" fill="#5fae4b"/><ellipse cx="18" cy="31" rx="3" ry="1.4" fill="#5fae4b"/>')}},
   bttron:{n:"Bánh tráng trộn",s:function(){return '<path d="M12 22 Q10 58 32 60 Q54 58 52 22 Z" fill="#fff3e3" opacity=".95" '+OL+'/><path d="M17 34 q6-5 12 0 t12 0 M16 42 q6-5 12 0 t14 0 M19 50 q6-4 12 0 t10 0" stroke="#e8662c" stroke-width="2.6" fill="none" stroke-linecap="round"/><ellipse cx="38" cy="38" rx="5" ry="4" fill="#fff" '+OL+'/><circle cx="38" cy="38" r="2" fill="#f6c343"/><path d="M22 28l3-3M28 47l3-3" stroke="#4fa34a" stroke-width="2.4" stroke-linecap="round"/><path d="M24 22 Q32 12 40 22" fill="none" '+OL+'/><circle cx="32" cy="15" r="3" fill="#ff7a59" '+OL+'/>'}},
   btcuon:{n:"Bánh tráng cuốn",s:function(){var r=function(y,rot){return '<g transform="rotate('+rot+' 32 '+y+')"><rect x="10" y="'+(y-6)+'" width="44" height="12" rx="6" fill="#f7efe3" '+OL+'/><path d="M16 '+y+' h32" stroke="#ee7b3a" stroke-width="3" stroke-dasharray="5 3"/><path d="M18 '+(y+3)+' h26" stroke="#68b24e" stroke-width="1.6"/></g>'};return '<ellipse cx="32" cy="50" rx="28" ry="8" fill="#fff" '+OL+'/>'+r(36,-8)+r(46,6)+'<ellipse cx="50" cy="22" rx="7" ry="4" fill="#c0392b" '+OL+'/>'}},
   bunbo:{n:"Bún bò Huế",s:function(){return bowl('#e2562b','<path d="M14 30 q4-3 8 0 t8 0 t8 0 t8 0" stroke="#fff" stroke-width="2" fill="none"/><ellipse cx="25" cy="27" rx="6" ry="2.6" fill="#8a4b2f" '+OL+'/><ellipse cx="38" cy="29" rx="5" ry="2.4" fill="#8a4b2f" '+OL+'/><circle cx="46" cy="27" r="4" fill="#a6d65c" '+OL+'/><path d="M17 32l2-3" stroke="#3f8f3a" stroke-width="2"/><circle cx="31" cy="25" r="1.6" fill="#c0392b"/>')}},
   sbux:{n:"Starbucks",s:function(){return '<path d="M17 18 L47 18 L43 60 Q42.6 62 40 62 L24 62 Q21.4 62 21 60 Z" fill="#fff" '+OL+'/><path d="M19.6 34 L44.4 34 L43.3 46 L20.7 46 Z" fill="#b98457" '+OL+'/><circle cx="32" cy="27" r="5" fill="#00704a"/><circle cx="32" cy="27" r="2.6" fill="#fff"/><rect x="14" y="11" width="36" height="8" rx="3" fill="#fff" '+OL+'/><rect x="20" y="7" width="24" height="5" rx="2" fill="#fff" '+OL+'/>'}},
   matcha:{n:"Matcha latte",s:function(){return cupBody('fb4',[[24,'#8cc152'],[38,'#b9dc7d'],[46,'#f4f1e8']],'<rect x="35" y="0" width="5" height="44" rx="2.5" fill="#fff" '+OL+' transform="rotate(14 37 22)"/>')+ice()}},
   bacxiu:{n:"Bạc xỉu",s:function(){return cupBody('fb5',[[24,'#f5ead6'],[40,'#cfa47a'],[50,'#6b3e26']],'<rect x="34" y="0" width="5" height="44" rx="2.5" fill="#f2f2f2" '+OL+' transform="rotate(12 36 22)"/>')+ice()}}
  };
  function foodSvg(k,sz){return '<svg viewBox="0 0 64 64" width="'+sz+'" height="'+sz+'" aria-hidden="true">'+FOOD[k].s()+'</svg>'}
  function mini(k,x,y,s,c){return '<g class="'+c+'"><svg x="'+x+'" y="'+y+'" width="'+s+'" height="'+s+'" viewBox="0 0 64 64">'+FOOD[k].s()+'</svg></g>'}

  /* ---------- Hello ___ theo theme ---------- */
  function helloName(){var n=String((S.me&&S.me.display_name)||"").trim();if(/h[aả]i\s+anh/i.test(n.normalize("NFC")))return "Hari";return n.split(/\s+/)[0]||"Team"}
  var SCENE={
   simple:function(txt){var t=tw(txt,42),W=Math.round(t/0.72+24),H=Math.round(Math.max(140,W*.36));
     return svgW(W+6,H+6,'<g transform="translate(3 3)" class="cl"><path d="'+cloudPath(W,H)+'" style="fill:var(--cloud-fill);stroke:var(--cloud-line)" stroke-width="1.5"/>'+T(W/2,H*.56,txt,'var(--cloud-ink)',42)+'</g>')},
   rain:function(txt){var t=tw(txt,40),m=40,W=Math.round(t+60+2*m),H=210,n=Math.max(6,Math.round((W-2*m)/34)),sw=(W-2*m)/n,s='',sc='',r='',dp='';
     for(var i=0;i<n;i++){var c=i%2?'#eef3f8':'#5b8db8';s+='<rect x="'+(m+i*sw)+'" y="40" width="'+sw+'" height="44" fill="'+c+'"/>';sc+='<path d="M'+(m+i*sw)+' 84 a'+(sw/2)+' '+(sw/2)+' 0 0 0 '+sw+' 0Z" fill="'+c+'" stroke="#3f6d93" stroke-width="1.4"/>'}
     for(var k=0;k<34;k++){var x=(k*61+13)%W,y=(k*43+7)%H;if(x>m-6&&x<W-m+6&&y>34)continue;r+='<line class="rl" style="animation-delay:'+(-(k%7)*.12).toFixed(2)+'s" x1="'+x+'" y1="'+y+'" x2="'+(x-3)+'" y2="'+(y+11)+'" stroke="#7d9cc0" stroke-width="2" stroke-linecap="round"/>'}
     for(var j=0;j<n;j+=2)dp+='<circle class="dp" style="animation-delay:'+(-j*.3).toFixed(1)+'s" cx="'+(m+j*sw+sw/2)+'" cy="'+(84+sw/2+2)+'" r="2.4" fill="#7d9cc0"/>';
     return svgW(W,H,r+'<defs><clipPath id="awn19"><path d="M'+(m+16)+' 40 H'+(W-m-16)+' L'+(W-m)+' 84 H'+m+' Z"/></clipPath></defs><rect x="'+(m+8)+'" y="84" width="6" height="'+(H-96)+'" rx="2" fill="#6b7f93"/><rect x="'+(W-m-14)+'" y="84" width="6" height="'+(H-96)+'" rx="2" fill="#6b7f93"/>'+
       '<g clip-path="url(#awn19)">'+s+'</g>'+sc+'<path d="M'+(m+16)+' 40 H'+(W-m-16)+' L'+(W-m)+' 84 H'+m+' Z" fill="none" stroke="#3f6d93" stroke-width="2"/><rect x="'+(m+10)+'" y="34" width="'+(W-2*m-20)+'" height="7" rx="3.5" fill="#3f6d93"/>'+dp+
       '<ellipse cx="'+(W*.22)+'" cy="'+(H-6)+'" rx="34" ry="4.5" fill="#c9d8e6"/><ellipse cx="'+(W*.8)+'" cy="'+(H-5)+'" rx="44" ry="5" fill="#c9d8e6"/>'+T(W/2,150,txt,'#3d5a78',40))},
   amazon:function(txt){var t=tw(txt,40),x0=128,x1=Math.round(x0+t+56),W=x1+26,H=244,f='',v='',G=['#1f5f2a','#2f7d32','#3f9a45','#56b35c','#2a6e33'];
     for(var i=0,x=-10;x<W+20;x+=34,i++)f+='<circle cx="'+x+'" cy="'+(26+(i*17)%22)+'" r="'+(24+(i*7)%13)+'" fill="'+G[i%5]+'"/>';
     [[40,60,38],[78,40,34],[18,100,30],[96,96,26]].forEach(function(c,i){f+='<circle cx="'+c[0]+'" cy="'+c[1]+'" r="'+c[2]+'" fill="'+G[(i+1)%5]+'"/>'});
     [x0-12,Math.round((x0+x1)/2)+30,W-14].forEach(function(vx,i){var y2=150+i*28;v+='<path d="M'+vx+' 70 q8 '+((y2-70)/4)+' 0 '+((y2-70)/2)+' t0 '+((y2-70)/2)+'" stroke="#3f8f3a" stroke-width="3" fill="none"/>';for(var y=86;y<y2;y+=20)v+='<ellipse cx="'+(vx+((y/20)%2?6:-6))+'" cy="'+y+'" rx="6" ry="3.2" fill="#56b35c" transform="rotate('+((y/20)%2?30:-30)+' '+vx+' '+y+')"/>'});
     var cx=(x0+x1)/2,sign='<g class="sw" style="transform-origin:'+cx+'px 72px"><line x1="'+(x0+26)+'" y1="72" x2="'+(x0+26)+'" y2="110" stroke="#c9a46a" stroke-width="3"/><line x1="'+(x1-26)+'" y1="72" x2="'+(x1-26)+'" y2="110" stroke="#c9a46a" stroke-width="3"/>'+
       '<rect x="'+x0+'" y="106" width="'+(x1-x0)+'" height="62" rx="9" fill="#b07a45" stroke="#6e4523" stroke-width="3"/><path d="M'+(x0+12)+' 122 h'+(x1-x0-60)+' M'+(x0+40)+' 154 h'+(x1-x0-70)+'" stroke="#9a6638" stroke-width="2" stroke-linecap="round"/>'+
       '<ellipse cx="'+(x0+4)+'" cy="108" rx="16" ry="8" fill="#3f9a45" transform="rotate(-35 '+(x0+4)+' 108)"/><ellipse cx="'+(x1-2)+'" cy="166" rx="16" ry="8" fill="#2f7d32" transform="rotate(30 '+(x1-2)+' 166)"/>'+T(cx,137,txt,'#fff6e0',40,'style="paint-order:stroke" stroke="#6e4523" stroke-width="3"')+'</g>';
     return svgW(W,H,'<path d="M24 '+H+' C44 190 50 120 56 64 L94 62 C98 130 104 196 124 '+H+' Z" fill="#7a5230" stroke="#5a3a20" stroke-width="2"/><path d="M70 120 q6 30 0 60 M84 90 q-5 30 2 70" stroke="#5a3a20" stroke-width="2" fill="none"/>'+
       '<path d="M62 78 C150 58 '+(W-90)+' 70 '+(W-6)+' 62" stroke="#6e4523" stroke-width="14" stroke-linecap="round" fill="none"/><path d="M62 76 C150 56 '+(W-90)+' 68 '+(W-6)+' 60" stroke="#8a5a30" stroke-width="5" stroke-linecap="round" fill="none"/>'+f+v+sign+
       '<path d="M0 '+H+' q10 -22 18 0 q8 -26 16 0 q8 -18 14 0 Z" fill="#3f9a45"/><path d="M'+(W-60)+' '+H+' q12 -30 22 0 q10 -24 18 0 q8 -20 20 0Z" fill="#2f7d32"/>')},
   hawaii:function(txt){var t=tw(txt,36),bw=Math.round(t+120),W=bw+96,H=262,mx=bw/2,wv=function(y,c,o){var d='M-60 '+y;for(var x=-60;x<W+80;x+=40)d+=' q10 -8 20 0 t20 0';return '<path d="'+d+' V'+H+' H-60 Z" fill="'+c+'" opacity="'+o+'"/>'};
     var palm='<path d="M'+(W-46)+' '+(H-44)+' C'+(W-40)+' '+(H-100)+' '+(W-58)+' '+(H-140)+' '+(W-70)+' '+(H-160)+'" stroke="#8b5a2b" stroke-width="7" fill="none" stroke-linecap="round"/>'+[[-50,-6],[-30,-34],[10,-30],[34,-4],[-8,-44]].map(function(p){var bx=W-70,by=H-160;return '<path d="M'+bx+' '+by+' q'+(p[0]/2)+' '+(p[1]-14)+' '+p[0]+' '+(p[1]+18)+' q'+(-p[0]/3)+' -12 '+(-p[0])+' '+(-p[1]-18)+'Z" fill="#3aa25a"/>'}).join('')+'<circle cx="'+(W-66)+'" cy="'+(H-154)+'" r="4" fill="#7a4a1f"/><circle cx="'+(W-74)+'" cy="'+(H-152)+'" r="4" fill="#7a4a1f"/>';
     return svgW(W,H,'<circle cx="40" cy="36" r="22" fill="#ffd166"/><circle cx="40" cy="36" r="32" fill="#ffd166" opacity=".25"/><path d="M'+(W-150)+' '+(H-26)+' Q'+(W-80)+' '+(H-70)+' '+W+' '+(H-50)+' V'+H+' H'+(W-150)+'Z" fill="#f4dcae"/>'+palm+
       '<g class="bob2" style="transform-origin:'+mx+'px 210px"><line x1="'+mx+'" y1="14" x2="'+mx+'" y2="160" stroke="#8b5a2b" stroke-width="4"/><path d="M'+(mx+4)+' 22 L'+(mx+4)+' 146 L'+(mx+Math.min(bw*.42,170))+' 146 Z" fill="#fffdf5" stroke="#e2d3b5" stroke-width="2"/><path d="M'+(mx-4)+' 44 L'+(mx-4)+' 146 L'+(mx-Math.min(bw*.3,110))+' 146 Z" fill="#fff1de" stroke="#ecd8bb" stroke-width="2"/><path d="M'+mx+' 12 l24 6 l-24 6Z" fill="#e8505b"/>'+
       '<path d="M10 156 H'+(bw-10)+' L'+(bw-46)+' 214 H46 Z" fill="#ff7a59" stroke="#c4502f" stroke-width="3" stroke-linejoin="round"/><path d="M20 166 H'+(bw-20)+'" stroke="#fff" stroke-width="3" opacity=".8"/>'+T(mx,190,txt,'#fff',36)+'</g>'+
       '<g class="wv">'+wv(222,'#7fd6e6',.85)+wv(236,'#4fc3dc',.9)+wv(249,'#2aa6c4',1)+'</g>')},
   autumn:function(txt){var t=tw(txt,40),tx=Math.round(t+60),W=tx+150,H=236,f='',pile='',lf='',C=['#e8873a','#f2b632','#c8502b','#d9762b','#f4c95d'];
     for(var i=0,x=0;x<W+10;x+=32,i++)f+='<circle cx="'+x+'" cy="'+(30+(i*13)%22)+'" r="'+(22+(i*7)%12)+'" fill="'+C[i%5]+'"/>';
     [[W-80,60,40],[W-40,90,32],[W-120,84,28],[W-10,50,30]].forEach(function(c,i){f+='<circle cx="'+c[0]+'" cy="'+c[1]+'" r="'+c[2]+'" fill="'+C[(i+2)%5]+'"/>'});
     for(var p=0;p<34;p++){var px=(p*37)%W,py=H-10-((p*7)%9);pile+='<ellipse cx="'+px+'" cy="'+py+'" rx="7" ry="3.5" fill="'+C[p%5]+'" transform="rotate('+((p*47)%180)+' '+px+' '+py+')"/>'}
     for(var q=0;q<9;q++){var lx=20+(q*67)%(W-40),ly=60+(q*23)%40;lf+='<g transform="translate('+lx+' '+ly+')"><path class="lf" style="--t:'+(6+q%4)+'s;animation-delay:'+(-q*1.3).toFixed(1)+'s;--h1:'+(70+q*5)+'px;--h2:'+(150+q*4)+'px" d="M0 -8 C7 -4 7 4 0 9 C-7 4 -7 -4 0 -8Z" fill="'+C[q%5]+'"/></g>'}
     return svgW(W,H,'<path d="M0 '+(H-14)+' Q'+(W/2)+' '+(H-30)+' '+W+' '+(H-16)+' V'+H+' H0Z" fill="#ecd2a8"/>'+pile+
       '<path d="M'+(W-102)+' '+H+' C'+(W-88)+' 180 '+(W-86)+' 120 '+(W-92)+' 70 L'+(W-62)+' 66 C'+(W-60)+' 120 '+(W-58)+' 180 '+(W-44)+' '+H+' Z" fill="#6b4226"/><path d="M'+(W-80)+' 84 C'+(W-160)+' 60 120 52 20 60" stroke="#6b4226" stroke-width="10" stroke-linecap="round" fill="none"/><path d="M'+(W*.45)+' 62 l-14 -22 M'+(W*.25)+' 60 l10 -24" stroke="#6b4226" stroke-width="4" stroke-linecap="round"/>'+f+T(tx/2+10,160,txt,'#8a3b12',40)+lf)},
   snack:function(txt){var t=tw(txt,36),bw=Math.round(t+44),W=bw+200,H=222,R=bw+150;
     var wheel=function(cx){return '<g><circle cx="'+cx+'" cy="190" r="19" fill="#333"/><circle cx="'+cx+'" cy="190" r="8" fill="#ccc"/><g class="spin2" style="transform-origin:'+cx+'px 190px"><path d="M'+(cx-15)+' 190 H'+(cx+15)+' M'+cx+' 175 V205" stroke="#888" stroke-width="2"/></g></g>'};
     return svgW(W,H,'<path d="M0 212 H'+W+'" stroke="#e0cfc4" stroke-width="3" stroke-dasharray="18 12"/><g stroke="#ffb59a" stroke-width="3" stroke-linecap="round"><path d="M0 100 h14 M4 120 h12 M0 150 h10"/></g>'+
       '<g class="bump">'+wheel(54)+wheel(R)+
       '<path d="M30 170 Q40 150 '+(bw*0.6)+' 150 L'+(R-40)+' 150 Q'+(R-6)+' 150 '+(R+18)+' 176 L'+(R+24)+' 186 H'+(R-24)+' Q'+(R-30)+' 172 '+(R-60)+' 172 H80 Q70 186 34 186Z" fill="#ff6b57" stroke="#b8402f" stroke-width="2.5" stroke-linejoin="round"/>'+
       '<path d="M'+(R-10)+' 150 L'+(R+6)+' 104" stroke="#555" stroke-width="5" stroke-linecap="round"/><path d="M'+(R-4)+' 104 h22" stroke="#333" stroke-width="5" stroke-linecap="round"/><circle cx="'+(R+22)+'" cy="140" r="6" fill="#ffe27a" stroke="#c9a400" stroke-width="2"/>'+
       '<path d="M'+(bw+46)+' 150 Q'+(bw+52)+' 110 '+(bw+70)+' 98 L'+(bw+92)+' 98 Q'+(bw+100)+' 120 '+(R-2)+' 112" fill="none" stroke="#2d6a4f" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>'+
       '<path d="M'+(bw+58)+' 150 L'+(bw+80)+' 150 L'+(bw+96)+' 182" stroke="#264653" stroke-width="12" stroke-linecap="round" fill="none"/>'+
       '<circle cx="'+(bw+84)+'" cy="76" r="17" fill="#2d6a4f"/><path d="M'+(bw+84)+' 68 a14 12 0 0 1 16 10 h-12z" fill="#bde0fe" stroke="#1b4332" stroke-width="1.5"/>'+
       '<rect x="16" y="34" width="'+bw+'" height="104" rx="10" fill="#ff8a3d" stroke="#c45a14" stroke-width="3"/><rect x="16" y="34" width="'+bw+'" height="20" rx="10" fill="#ffb37a"/><path d="M16 120 H'+(16+bw)+'" stroke="#c45a14" stroke-width="2" stroke-dasharray="6 5"/>'+
       T(16+bw/2,90,txt,'#fff',36)+'<text x="'+(16+bw/2)+'" y="128" text-anchor="middle" font-size="11" font-weight="700" fill="#fff" opacity=".9" font-family="Segoe UI,sans-serif" letter-spacing="2">GIAO NHANH · FREESHIP</text>'+
       '<rect x="'+(bw-30)+'" y="140" width="40" height="12" rx="3" fill="#8a3b12"/></g>'+mini('boba',bw+120,6,40,'flo f1')+mini('cavien',bw+160,40,32,'flo f2')+mini('bttron',W-44,0,34,'flo f3'))},
   chill:function(txt){var t=tw(txt,40),W=Math.max(Math.round(t+190),400),H=230,bx=W-62,tx=(W-110)/2+10;
     return svgW(W,H,'<defs><linearGradient id="chs19" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8f1ee"/><stop offset="1" stop-color="#f7f3ea"/></linearGradient></defs><rect x="0" y="0" width="'+W+'" height="'+H+'" rx="22" fill="url(#chs19)"/>'+
       '<circle cx="'+(W*.62)+'" cy="62" r="26" fill="#fbe3c0" opacity=".9"/>'+
       '<path d="M0 170 L'+(W*.18)+' 96 L'+(W*.32)+' 138 L'+(W*.5)+' 84 L'+(W*.72)+' 150 L'+(W*.88)+' 110 L'+W+' 150 V'+H+' H0Z" fill="#b9d3c6"/>'+
       '<path d="M0 190 L'+(W*.12)+' 150 L'+(W*.3)+' 176 L'+(W*.46)+' 136 L'+(W*.66)+' 182 L'+(W*.84)+' 150 L'+W+' 176 V'+H+' H0Z" fill="#8fb5a3"/>'+
       '<path d="M0 214 Q'+(W*.3)+' 196 '+(W*.55)+' 210 T'+W+' 204 V'+H+' H0Z" fill="#6f9a87"/>'+
       '<g class="drift"><ellipse cx="40" cy="150" rx="60" ry="9" fill="#fff" opacity=".8"/><ellipse cx="300" cy="128" rx="80" ry="8" fill="#fff" opacity=".7"/></g>'+
       '<g class="drift d2"><ellipse cx="120" cy="40" rx="34" ry="11" fill="#fff" opacity=".9"/><ellipse cx="146" cy="34" rx="22" ry="10" fill="#fff" opacity=".9"/></g>'+
       T(tx,74,txt,'#3d5f52',40)+'<text x="'+tx+'" y="110" text-anchor="middle" font-size="13" fill="#6f8379" font-family="Segoe UI,sans-serif" letter-spacing="1.5">an nhiên · chữa lành · bình an</text>'+
       '<path d="M'+(bx-34)+' 26 H'+(bx+34)+'" stroke="#7a5230" stroke-width="7" stroke-linecap="round"/><path d="M'+(bx-30)+' 26 V44 M'+(bx+30)+' 26 V44" stroke="#7a5230" stroke-width="4"/>'+
       '<g id="bell19" class="bellg" style="transform-origin:'+bx+'px 30px;cursor:pointer"><line x1="'+bx+'" y1="28" x2="'+bx+'" y2="48" stroke="#8b6b3d" stroke-width="3"/>'+
         '<path d="M'+(bx-8)+' 50 Q'+bx+' 42 '+(bx+8)+' 50 L'+(bx+10)+' 56 H'+(bx-10)+'Z" fill="#a8792e"/><path d="M'+(bx-12)+' 56 H'+(bx+12)+' Q'+(bx+20)+' 60 '+(bx+22)+' 100 Q'+(bx+26)+' 112 '+(bx+28)+' 116 H'+(bx-28)+' Q'+(bx-26)+' 112 '+(bx-22)+' 100 Q'+(bx-20)+' 60 '+(bx-12)+' 56Z" fill="#c69a46" stroke="#8a6224" stroke-width="2"/>'+
         '<path d="M'+(bx-20)+' 78 H'+(bx+20)+' M'+(bx-23)+' 96 H'+(bx+23)+'" stroke="#8a6224" stroke-width="2"/><circle cx="'+bx+'" cy="87" r="5" fill="none" stroke="#8a6224" stroke-width="2"/><path d="M'+(bx-30)+' 116 H'+(bx+30)+'" stroke="#8a6224" stroke-width="3" stroke-linecap="round"/><rect x="'+(bx-34)+'" y="40" width="68" height="84" fill="transparent"/></g>'+
       '<g id="ring19" opacity="0"><path d="M'+(bx-40)+' 92 q-10 14 0 28 M'+(bx-50)+' 86 q-14 20 0 40 M'+(bx+40)+' 92 q10 14 0 28 M'+(bx+50)+' 86 q14 20 0 40" stroke="#c69a46" stroke-width="2.5" fill="none" stroke-linecap="round"/><text x="'+bx+'" y="140" text-anchor="middle" font-size="13" font-style="italic" fill="#8a6224" font-family="Georgia,serif">boong~</text></g>'+
       '<text x="'+bx+'" y="'+(H-10)+'" text-anchor="middle" font-size="11" fill="#fff" font-family="Segoe UI,sans-serif">bấm chuông 🔔</text>')},
   city:function(txt){var t=tw(txt,32),sw=Math.round(t+56),W=Math.max(sw+170,440),H=250,sx=Math.round((W-sw)/2)-30,b='',P=['#f4d35e','#ee964b','#9bc1bc','#e8a0bf','#c9d6df','#f6bd60','#84a59d'];
     for(var i=0,x=0;x<W;i++){var bw2=36+(i*13)%22,bh=110+(i*37)%70;b+='<rect x="'+x+'" y="'+(170-bh)+'" width="'+bw2+'" height="'+bh+'" fill="'+P[i%7]+'" opacity=".55"/>';for(var y=170-bh+10;y<160;y+=18)b+='<rect x="'+(x+7)+'" y="'+y+'" width="'+(bw2-14)+'" height="8" fill="#fff" opacity=".5"/>';x+=bw2+2}
     var bike=function(cls,col,hel){return '<g class="'+cls+'"><circle cx="0" cy="226" r="9" fill="#333"/><circle cx="40" cy="226" r="9" fill="#333"/><path d="M-4 222 Q10 206 30 210 L46 222Z" fill="'+col+'"/><path d="M14 210 L22 188" stroke="#3d405b" stroke-width="7" stroke-linecap="round"/><circle cx="23" cy="182" r="7" fill="'+hel+'"/><path d="M36 210 L40 196" stroke="#555" stroke-width="3"/></g>'};
     var ppl=function(x,c,cls){return '<g class="'+cls+'"><circle cx="'+x+'" cy="146" r="5" fill="#5a4a42"/><path d="M'+x+' 151 v16 M'+x+' 167 l-4 9 M'+x+' 167 l4 9 M'+x+' 155 l-5 7 M'+x+' 155 l5 7" stroke="'+c+'" stroke-width="3.5" stroke-linecap="round"/></g>'};
     return svgW(W,H,b+'<path d="M0 30 Q'+(W*.3)+' 60 '+(W*.55)+' 34 T'+W+' 44 M0 40 Q'+(W*.35)+' 70 '+(W*.6)+' 42 T'+W+' 56" stroke="#333" stroke-width="1.4" fill="none"/><circle cx="'+(W*.42)+'" cy="52" r="7" fill="none" stroke="#333" stroke-width="1.2"/>'+
       '<rect x="0" y="170" width="'+W+'" height="16" fill="#cfc8bd"/><path d="M0 172 H'+W+'" stroke="#b8b0a3" stroke-width="2"/><rect x="0" y="186" width="'+W+'" height="64" fill="#6b6b6b"/><path d="M0 220 H'+W+'" stroke="#f1f1f1" stroke-width="3" stroke-dasharray="20 16"/>'+
       '<rect x="'+(sx+10)+'" y="70" width="5" height="102" fill="#777"/><rect x="'+(sx+sw-15)+'" y="70" width="5" height="102" fill="#777"/>'+
       '<path d="M'+(sx-10)+' 78 H'+(sx+sw+10)+' L'+(sx+sw+24)+' 100 H'+(sx-24)+'Z" fill="#2a6f97"/><path d="M'+(sx+20)+' 78 L'+(sx+8)+' 100 M'+(sx+60)+' 78 L'+(sx+52)+' 100 M'+(sx+sw-60)+' 78 L'+(sx+sw-52)+' 100 M'+(sx+sw-20)+' 78 L'+(sx+sw-8)+' 100" stroke="#fff" stroke-width="5" opacity=".7"/>'+
       '<rect x="'+sx+'" y="16" width="'+sw+'" height="56" rx="4" fill="#d62828" stroke="#9d0208" stroke-width="3"/>'+T(sx+sw/2,40,txt,'#ffd60a',32)+'<text x="'+(sx+sw/2)+'" y="64" text-anchor="middle" font-size="10.5" font-weight="700" fill="#fff" font-family="Segoe UI,sans-serif" letter-spacing="1.5">QUÁN VỈA HÈ · NGON – BỔ – RẺ</text>'+
       '<rect x="'+(sx+14)+'" y="118" width="62" height="40" rx="3" fill="#e9ecef" stroke="#adb5bd" stroke-width="2"/><rect x="'+(sx+18)+'" y="122" width="54" height="16" fill="#cde7f0" opacity=".9"/><circle cx="'+(sx+30)+'" cy="164" r="6" fill="#555"/><circle cx="'+(sx+62)+'" cy="164" r="6" fill="#555"/>'+
       '<ellipse cx="'+(sx+46)+'" cy="114" rx="16" ry="5" fill="#999"/><path class="steam" d="M'+(sx+40)+' 108 q-5 -8 0 -14 t0 -14 M'+(sx+52)+' 108 q-5 -8 0 -14 t0 -14" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>'+
       '<rect x="'+(sx+sw-96)+'" y="146" width="56" height="6" fill="#4a7c59"/><path d="M'+(sx+sw-92)+' 152 v16 M'+(sx+sw-44)+' 152 v16" stroke="#4a7c59" stroke-width="3"/><ellipse cx="'+(sx+sw-78)+'" cy="143" rx="8" ry="3" fill="#fff" stroke="#999"/><ellipse cx="'+(sx+sw-58)+'" cy="143" rx="8" ry="3" fill="#fff" stroke="#999"/>'+
       '<rect x="'+(sx+sw-118)+'" y="158" width="14" height="12" rx="2" fill="#e63946"/><rect x="'+(sx+sw-34)+'" y="158" width="14" height="12" rx="2" fill="#1d70b8"/>'+
       ppl(14,'#e76f51','walk')+ppl(W-24,'#2a9d8f','walk w2')+bike('ride','#e63946','#ffbe0b')+bike('ride r2','#1d70b8','#fff')+
       '<g id="honk19" opacity="0"><rect x="'+(W-120)+'" y="190" width="70" height="24" rx="12" fill="#fff" stroke="#333" stroke-width="1.5"/><text x="'+(W-85)+'" y="206" text-anchor="middle" font-size="12" font-weight="800" fill="#d62828" font-family="Segoe UI,sans-serif">tin tin!</text></g>','city19')}
  };
  function greet(){var h=+new Date().toLocaleString("en-US",{timeZone:"America/Los_Angeles",hour:"numeric",hour12:false})%24;return h<12?"Chào buổi sáng":h<18?"Chào buổi chiều":"Chào buổi tối"}
  function tarotOfDay(){var d=todayISO(),n=0,s=d+(S.me?S.me.id:0);for(var i=0;i<s.length;i++)n=(n*31+s.charCodeAt(i))%9973;return TAROT[n%TAROT.length]}
  function tarot(){var z=ZOD[S.me&&S.me.zodiac]||["✦","Chọn cung trong 🎨 Theme"],c=tarotOfDay();
    return '<div class="tarot19" title="'+esc(z[1]+' · lá bài hôm nay: '+c[0]+' — '+c[1])+'"><svg viewBox="0 0 80 124" width="74" height="114" aria-hidden="true"><rect x="2" y="2" width="76" height="120" rx="10" fill="#fbf8ff" stroke="#c9b8f5" stroke-width="2"/><rect x="9" y="9" width="62" height="106" rx="6" fill="none" stroke="#e3d8fb" stroke-width="1.5" stroke-dasharray="3 3"/>'+
      '<path d="M48 26 a12 12 0 1 1 -10 -6 a9 9 0 1 0 10 6Z" fill="#f6d77a"/><text x="40" y="70" text-anchor="middle" font-size="30" fill="#7a5cc8" font-family="Segoe UI Symbol,Noto Sans Symbols,serif">'+z[0]+'︎</text>'+
      '<path d="M18 20 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2Z M62 88 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5Z" fill="#c9b8f5"/><text x="40" y="104" text-anchor="middle" font-size="'+(c[0].length>10?6.5:8.5)+'" letter-spacing="1.2" fill="#6b5d8a" font-family="Segoe UI,sans-serif" font-weight="700">'+c[0]+'</text></svg><small>'+esc(z[1])+'</small></div>'}
  function helloHtml(){var st=theme(),nm=helloName();
    if(st==="pro")return '<div class="hp19"><small>'+greet()+'</small><b>Hello, '+esc(nm)+'</b></div>';
    if(st==="genz")return '<div class="gzrow19"><div class="gz19"><div><b>hello '+esc(nm.toLowerCase())+'</b><small>vibe hôm nay: '+esc(tarotOfDay()[1])+'</small></div><i>✦</i></div>'+tarot()+'</div>';
    return (SCENE[st]||SCENE.simple)("Hello "+nm+"!")}
  function foodHtml(sz){var f=S.me&&S.me.food;return f&&FOOD[f]?'<span class="food19" title="'+esc(FOOD[f].n)+'">'+foodSvg(f,sz)+'<small>'+esc(FOOD[f].n)+'</small></span>':''}

  /* ---------- weather (National Weather Service, free) ---------- */
  var WX=null;
  try{WX=JSON.parse(localStorage.getItem("fs_wx19")||"null")}catch(e){}
  function wxIcon(t,day){t=(t||"").toLowerCase();if(/thunder/.test(t))return "⛈️";if(/rain|shower|drizzle/.test(t))return "🌧️";if(/snow/.test(t))return "🌨️";if(/fog|haze|smoke/.test(t))return "🌫️";if(/partly|mostly sunny|mostly clear/.test(t))return "🌤️";if(/cloud|overcast/.test(t))return "☁️";return day===false?"🌙":"☀️"}
  function wxRain(){return !!(WX&&/rain|shower|drizzle|thunder/i.test(WX.text||""))}
  function wxHtml(){return WX?wxIcon(WX.text,WX.day)+' <b>'+WX.temp+'°F</b> '+OFFICE.name:'<span class="muted">'+OFFICE.name+'</span>'}
  var _wxBusy=false;
  function loadWeather(){
    if(_wxBusy||(WX&&Date.now()-WX.at<30*60*1000))return;_wxBusy=true;
    var pts=null;try{pts=localStorage.getItem("fs_wxpts19")}catch(e){}
    (pts?Promise.resolve(pts):fetch("https://api.weather.gov/points/"+OFFICE.lat+","+OFFICE.lon,{headers:{Accept:"application/geo+json"}}).then(function(r){return r.json()}).then(function(j){var u=j.properties.forecastHourly;try{localStorage.setItem("fs_wxpts19",u)}catch(e){}return u}))
      .then(function(u){return fetch(u,{headers:{Accept:"application/geo+json"}})}).then(function(r){return r.json()}).then(function(j){var p=j.properties.periods[0];
        WX={temp:p.temperature,text:p.shortForecast,day:p.isDaytime,at:Date.now()};try{localStorage.setItem("fs_wx19",JSON.stringify(WX))}catch(e){}
        var el=$("#wx19");if(el)el.innerHTML=wxHtml();var sk=$("#sky19");if(sk)sk.innerHTML=skyHtml()})
      .catch(function(){}).then(function(){_wxBusy=false});
  }

  /* ---------- bầu trời theo giờ & thời tiết ---------- */
  var CL='<path d="M20 60 C10 60 4 52 8 44 C10 36 20 34 26 38 C28 24 46 18 58 26 C64 14 86 12 94 26 C108 22 120 32 116 44 C126 46 128 60 116 62 Z" fill="#fff"/>';
  function cloudG(x,y,s,o,cls){return '<g class="drift '+(cls||'')+'"><g transform="translate('+x+' '+y+') scale('+s+')" opacity="'+o+'">'+CL+'</g></g>'}
  function hills(c1,c2){return '<path d="M0 205 C120 178 220 218 330 194 C440 170 520 203 600 188 L600 240 L0 240Z" fill="'+c1+'"/><path d="M0 222 C140 204 260 232 380 214 C470 200 540 220 600 210 L600 240 L0 240Z" fill="'+c2+'"/>'}
  function bill(x,y,cls,r){return '<g transform="translate('+x+' '+y+')"><g class="bob '+cls+'"><g transform="rotate('+r+')"><rect x="-17" y="-9" width="34" height="18" rx="3" fill="#7fcf8f" stroke="#3f9a55" stroke-width="1.4"/><circle r="5.2" fill="#e9f8ec" stroke="#3f9a55"/><text y="3.6" text-anchor="middle" font-size="8" font-weight="800" fill="#2e7d44" font-family="Arial">$</text></g></g></g>'}
  function coin(x,y,cls){return '<g transform="translate('+x+' '+y+')"><g class="bob '+cls+'"><circle r="10" fill="#ffd34d" stroke="#d69e00" stroke-width="1.6"/><text y="4" text-anchor="middle" font-size="11" font-weight="800" fill="#a87400" font-family="Arial">$</text></g></g>'}
  function sun(x,y){var r='';for(var i=0;i<12;i++){var a=i*30*Math.PI/180;r+='<line x1="'+(x+Math.cos(a)*44)+'" y1="'+(y+Math.sin(a)*44)+'" x2="'+(x+Math.cos(a)*(i%2?58:66))+'" y2="'+(y+Math.sin(a)*(i%2?58:66))+'"/>'}
    return '<circle cx="'+x+'" cy="'+y+'" r="90" fill="url(#sk19glow)"/><g class="spin" stroke="#ffe08a" stroke-width="4" stroke-linecap="round">'+r+'</g><circle cx="'+x+'" cy="'+y+'" r="32" fill="#ffd84d"/>'}
  function skyDefs(top,bot){return '<defs><linearGradient id="sk19bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+top+'"/><stop offset="1" stop-color="'+bot+'"/></linearGradient><radialGradient id="sk19glow"><stop offset="0" stop-color="#fff6b8" stop-opacity=".9"/><stop offset="1" stop-color="#fff6b8" stop-opacity="0"/></radialGradient></defs><rect width="600" height="240" fill="url(#sk19bg)"/>'}
  function tod(){if(theme()==="rain"||wxRain())return "rain";var h=+new Date().toLocaleString("en-US",{timeZone:"America/Los_Angeles",hour:"numeric",hour12:false})%24;return h<10?"morning":h<16?"noon":h<19?"evening":"night"}
  var SKY={
    noon:function(){return skyDefs('#7cc4f2','#dff2fe')+sun(510,60)+cloudG(30,40,1.1,.95)+cloudG(-80,110,1.6,.9,'d2')+cloudG(150,140,.8,.85,'d3')+bill(120,70,'',-12)+bill(260,120,'b2',10)+bill(380,52,'b3',-6)+coin(320,165,'b4')+coin(190,175,'b3')+hills('rgba(255,255,255,.7)','rgba(255,255,255,.92)')},
    morning:function(){return skyDefs('#ffd3a5','#bfe5fb')+sun(120,160)+cloudG(200,40,1.1,.95)+cloudG(-60,90,1.3,.85,'d2')+bill(420,70,'b2',8)+coin(500,120,'')+hills('rgba(255,255,255,.65)','rgba(255,255,255,.9)')},
    evening:function(){return skyDefs('#ff9e6d','#7a5ca8')+'<circle cx="470" cy="150" r="40" fill="#ffcf6b" opacity=".95"/>'+cloudG(40,60,1.2,.55)+cloudG(250,100,1,.45,'d2')+bill(180,80,'b2',-8)+coin(330,60,'b3')+hills('rgba(60,40,90,.45)','rgba(50,30,80,.75)')},
    night:function(){var st='';for(var i=0;i<30;i++)st+='<circle class="twk" cx="'+((i*97)%600)+'" cy="'+((i*53)%170)+'" r="'+(i%3?1.2:1.8)+'" fill="#fff"/>';return skyDefs('#0f2244','#33557f')+st+'<circle cx="500" cy="60" r="26" fill="#f4f1d2"/><circle cx="512" cy="52" r="24" fill="#18305a"/>'+cloudG(60,120,1.2,.18,'d2')+hills('rgba(20,40,70,.6)','rgba(15,30,55,.9)')},
    rain:function(){var d='';for(var j=0;j<40;j++)d+='<line class="rl" style="animation-delay:-'+(j%6*.13).toFixed(2)+'s" x1="'+((j*41)%600)+'" y1="'+((j*29)%200)+'" x2="'+((j*41)%600-4)+'" y2="'+((j*29)%200+12)+'" stroke="#d6e6f5" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>';return skyDefs('#8aa3ba','#cfdce8')+cloudG(20,20,1.5,.95)+cloudG(250,10,1.8,.9,'d2')+cloudG(420,40,1.3,.9,'d3')+d+coin(470,180,'b2')+hills('rgba(255,255,255,.45)','rgba(255,255,255,.7)')}
  };
  var CAP={morning:"Chào buổi sáng ☀️",noon:"Trưa rồi, ăn gì chưa?",evening:"Gần về rồi, cố lên 🌇",night:"Làm khuya vậy? 🌙",rain:"Mưa rồi, khách hủy hẹn nhớ dời lịch ☔"};
  function skyHtml(){var t=tod();return '<svg viewBox="0 0 600 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'+SKY[t]()+'</svg><span class="cap">'+CAP[t]+'</span>'}

  /* ---------- trang trí quanh trang theo theme ---------- */
  function svgUri(s){return 'url("data:image/svg+xml,'+encodeURIComponent(s)+'")'}
  var VINE=svgUri('<svg xmlns="http://www.w3.org/2000/svg" width="140" height="20"><path d="M0 6 q35 12 70 0 t70 0" stroke="#3f8f3a" stroke-width="2.5" fill="none"/><ellipse cx="22" cy="11" rx="7" ry="3.5" fill="#56b35c" transform="rotate(25 22 11)"/><ellipse cx="50" cy="12" rx="7" ry="3.5" fill="#2f7d32" transform="rotate(-25 50 12)"/><ellipse cx="96" cy="3" rx="7" ry="3.5" fill="#3f9a45" transform="rotate(-20 96 3)"/><ellipse cx="122" cy="4" rx="7" ry="3.5" fill="#56b35c" transform="rotate(20 122 4)"/></svg>');
  var WAVE=svgUri('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="12"><path d="M0 6 q10 -6 20 0 t20 0 t20 0 t20 0" stroke="#2bb3c0" stroke-width="2.5" fill="none"/></svg>');
  function bush(flip){var G=['#1f5f2a','#2f7d32','#3f9a45','#56b35c'],s='';for(var i=0;i<9;i++){var x=20+(i*29)%150,y=170-(i*37)%120;s+='<ellipse cx="'+x+'" cy="'+y+'" rx="'+(30-i%3*5)+'" ry="13" fill="'+G[i%4]+'" transform="rotate('+(-60+i*17)+' '+x+' '+y+')"/>'}
    return '<svg class="bush'+(flip?' r':'')+'" viewBox="0 0 200 200">'+s+'<path d="M0 200 q40 -60 30 -140 M10 200 q60 -40 90 -110" stroke="#3f8f3a" stroke-width="3" fill="none"/></svg>'}
  function decorate(st){
    var d=$("#decor19");if(!d){d=document.createElement("div");d.id="decor19";d.setAttribute("aria-hidden","true");document.body.appendChild(d)}
    document.body.style.setProperty("--vine",VINE);document.body.style.setProperty("--wave",WAVE);
    var h='';
    if(st==="autumn")for(var i=0;i<14;i++)h+='<span class="fl" style="left:'+((i*73)%100)+'vw;font-size:'+(16+i%4*4)+'px;animation-duration:'+(11+i%5*3)+'s;animation-delay:'+(-i*1.7).toFixed(1)+'s">'+(i%3?'🍂':'🍁')+'</span>';
    if(st==="amazon")h=bush(0)+bush(1);
    if(st==="hawaii")h='<svg class="seab" viewBox="0 0 1200 40" preserveAspectRatio="none"><path d="M0 18 Q75 4 150 18 T300 18 T450 18 T600 18 T750 18 T900 18 T1050 18 T1200 18 V40 H0Z" fill="#7fd6e6" opacity=".7"/><path d="M0 26 Q75 14 150 26 T300 26 T450 26 T600 26 T750 26 T900 26 T1050 26 T1200 26 V40 H0Z" fill="#2aa6c4" opacity=".8"/></svg>';
    if(st==="snack")h=['boba','cavien','bttron','btcuon','che','bovien','bunbo','matcha'].map(function(k,i){var L=i%2===0;return '<span class="snk" style="'+(L?'left:':'right:')+(4+i%3*14)+'px;top:'+(18+i*11)+'vh;animation-delay:-'+i+'s">'+foodSvg(k,40)+'</span>'}).join('');
    if(st==="chill")h=[[46,90,7],[70,140,10],[88,110,13]].map(function(c,i){return '<span class="ccloud" style="top:'+c[0]+'vh;width:'+c[1]+'px;animation-duration:'+(60+i*25)+'s;animation-delay:-'+(i*20)+'s"></span>'}).join('');
    if(st==="city")h='<div class="street">'+['🛵','🏍️','🛵','🛺'].map(function(m,i){return '<span class="mb" style="animation-duration:'+(9+i*3)+'s;animation-delay:-'+(i*3)+'s">'+m+'</span>'}).join('')+'</div>';
    d.innerHTML=h;
  }
  function applyTheme(){var st=theme();if(document.body.getAttribute("data-style")!==st){document.body.setAttribute("data-style",st);decorate(st)}}

  /* ---------- banner tab nhân viên theo theme ---------- */
  function bannerDeco(st){var W=460,H=130,s='';
    if(st==="simple")s='<path d="'+cloudPath(150,60)+'" transform="translate(250 20)" fill="#eef6fd" stroke="#6c9fcf"/><path d="'+cloudPath(90,40)+'" transform="translate(140 60)" fill="#f3f8fd" stroke="#a9c7e3"/>';
    if(st==="genz")s='<text x="300" y="70" font-size="40" fill="#c9b8f5">✦</text><text x="380" y="40" font-size="22" fill="#f5b8d4">✦</text><text x="230" y="40" font-size="18" fill="#b8e986">✦</text><g transform="translate(400 20) rotate(8)"><rect width="44" height="70" rx="7" fill="#fbf8ff" stroke="#c9b8f5" stroke-width="2"/><path d="M28 18 a8 8 0 1 1 -7 -4 a6 6 0 1 0 7 4Z" fill="#f6d77a"/></g>';
    if(st==="pro")s='<path d="M300 110 H460" stroke="#c9a646" stroke-width="3"/>';
    if(st==="autumn"){var C=['#e8873a','#f2b632','#c8502b','#d9762b'];s='<path d="M460 10 C380 20 300 14 220 30" stroke="#6b4226" stroke-width="7" fill="none" stroke-linecap="round"/>';for(var i=0;i<12;i++)s+='<circle cx="'+(230+i*20)+'" cy="'+(20+(i*7)%16)+'" r="'+(14+(i*5)%8)+'" fill="'+C[i%4]+'"/>';for(var j=0;j<6;j++)s+='<g transform="translate('+(250+j*35)+' '+(60+(j*13)%40)+')"><path class="lf" style="--t:'+(6+j)+'s;animation-delay:-'+j+'s;--h1:30px;--h2:70px" d="M0 -6 C5 -3 5 3 0 7 C-5 3 -5 -3 0 -6Z" fill="'+C[j%4]+'"/></g>'}
    if(st==="rain"){for(var k=0;k<24;k++){var x=200+(k*37)%260,y=(k*29)%120;s+='<line class="rl" style="animation-delay:-'+(k%5*.15)+'s" x1="'+x+'" y1="'+y+'" x2="'+(x-3)+'" y2="'+(y+10)+'" stroke="#7d9cc0" stroke-width="2" stroke-linecap="round"/>'}s+='<path d="M360 70 a40 30 0 0 1 80 0 Z" fill="#5b8db8"/><path d="M400 70 v34 q0 8 -8 8" stroke="#3d5a78" stroke-width="3" fill="none"/>'}
    if(st==="amazon"){s='<path d="M180 4 H460" stroke="#6e4523" stroke-width="8" stroke-linecap="round"/>';[220,280,350,420].forEach(function(x,i){var y2=60+i*16;s+='<path d="M'+x+' 6 q8 '+(y2/4)+' 0 '+(y2/2)+' t0 '+(y2/2)+'" stroke="#3f8f3a" stroke-width="3" fill="none"/>';for(var y=16;y<y2;y+=16)s+='<ellipse cx="'+(x+((y/16)%2?6:-6))+'" cy="'+y+'" rx="7" ry="3.5" fill="#56b35c"/>'});for(var m=0;m<9;m++)s+='<circle cx="'+(200+m*32)+'" cy="'+(m%2?6:2)+'" r="'+(16+m%3*4)+'" fill="'+['#2f7d32','#3f9a45','#1f5f2a'][m%3]+'"/>'}
    if(st==="hawaii")s='<path d="M180 104 q10 -8 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 V130 H180Z" fill="#4fc3dc" opacity=".8"/><g class="bob2" style="transform-origin:330px 100px"><path d="M300 92 H360 L350 104 H310Z" fill="#ff7a59"/><path d="M330 92 V50 L352 88Z" fill="#fffdf5" stroke="#e2d3b5"/></g><path d="M430 104 C432 80 424 60 416 48" stroke="#8b5a2b" stroke-width="5" fill="none"/><path d="M416 48 q-20 -4 -26 12 M416 48 q18 -8 26 8 M416 48 q-4 -18 8 -24" stroke="#3aa25a" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="250" cy="34" r="14" fill="#ffd166"/>';
    if(st==="snack")['boba','cavien','bttron','btcuon','che','bunbo'].forEach(function(k,i){s+='<g class="flo f'+(i%3+1)+'"><svg x="'+(190+i*45)+'" y="'+(30+(i%2)*30)+'" width="44" height="44" viewBox="0 0 64 64">'+FOOD[k].s()+'</svg></g>'});
    if(st==="chill")s='<path d="M180 130 L250 70 L300 100 L360 52 L420 96 L460 80 V130Z" fill="#b9d3c6"/><path d="M180 130 L240 100 L320 118 L390 92 L460 116 V130Z" fill="#8fb5a3"/><g class="drift"><ellipse cx="260" cy="60" rx="40" ry="7" fill="#fff" opacity=".8"/></g><path d="M440 6 V24" stroke="#8b6b3d" stroke-width="2"/><path d="M432 26 H448 Q454 30 455 52 H425 Q426 30 432 26Z" fill="#c69a46" stroke="#8a6224" stroke-width="1.5"/>';
    if(st==="city"){var P=['#f4d35e','#ee964b','#9bc1bc','#e8a0bf','#c9d6df'];for(var q=0,x2=180;x2<460;q++){var w2=30+(q*11)%18,h2=60+(q*23)%50;s+='<rect x="'+x2+'" y="'+(110-h2)+'" width="'+w2+'" height="'+h2+'" fill="'+P[q%5]+'" opacity=".6"/>';x2+=w2+2}s+='<rect x="180" y="110" width="280" height="20" fill="#6b6b6b"/><g class="ride"><circle cx="0" cy="124" r="5" fill="#222"/><circle cx="22" cy="124" r="5" fill="#222"/><path d="M-2 121 Q8 112 18 114 L26 121Z" fill="#e63946"/><circle cx="12" cy="104" r="5" fill="#ffbe0b"/></g>'}
    return '<svg class="bdeco19" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMaxYMid meet" aria-hidden="true">'+s+'</svg>'}

  /* ---------- tiếng chuông chùa / kèn xe (Web Audio, không cần file) ---------- */
  var ac=null;function actx(){try{ac=ac||new (window.AudioContext||window.webkitAudioContext)()}catch(e){}return ac}
  function bellSound(){var a=actx();if(!a)return;var t=a.currentTime;[[1,.5],[2.76,.25],[5.4,.12],[8.93,.06]].forEach(function(p){var o=a.createOscillator(),g=a.createGain();o.frequency.value=196*p[0];g.gain.setValueAtTime(p[1]*.4,t);g.gain.exponentialRampToValueAtTime(.0001,t+4.5/p[0]*1.6);o.connect(g).connect(a.destination);o.start(t);o.stop(t+5)})}
  function honkSound(){var a=actx();if(!a)return;var t=a.currentTime;[0,.22].forEach(function(d){[440,554].forEach(function(f){var o=a.createOscillator(),g=a.createGain();o.type="square";o.frequency.value=f;g.gain.setValueAtTime(.05,t+d);g.gain.setValueAtTime(0,t+d+.14);o.connect(g).connect(a.destination);o.start(t+d);o.stop(t+d+.16)})})}
  function flash(id,ms){var e=$("#"+id);if(!e)return;e.style.transition="none";e.style.opacity=1;setTimeout(function(){e.style.transition="opacity "+(ms||800)+"ms";e.style.opacity=0},500)}
  document.addEventListener("click",function(e){
    if(!e.target.closest)return;
    if(e.target.closest("#bell19")){bellSound();var b=$("#bell19");b.classList.remove("ringing");void b.getBBox();b.classList.add("ringing");flash("ring19",2500)}
    else if(e.target.closest(".city19")){honkSound();flash("honk19")}
  });
  setInterval(function(){if(theme()==="city"&&S.page==="home"&&!document.hidden)flash("honk19")},6000);

  /* ---------- pop + pháo giấy ---------- */
  function pop(x,y,e){var s=document.createElement("span");s.className="pop19";s.textContent=e;s.style.left=(x-12)+"px";s.style.top=(y-20)+"px";document.body.appendChild(s);setTimeout(function(){s.remove()},1150)}
  function confetti(){if(reduced())return;var c=["#3d85c6","#e3a51a","#4cae4c","#e06666","#8e6bd1","#28a8a0"];for(var i=0;i<70;i++){var d=document.createElement("i");d.className="confetti19";d.style.left=Math.random()*100+"vw";d.style.background=c[i%6];d.style.animationDelay=Math.random()*.6+"s";document.body.appendChild(d);(function(d){setTimeout(function(){d.remove()},3200)})(d)}}

  return {THEMES:THEMES,ZOD:ZOD,MOODS:MOODS,FOOD:FOOD,foodSvg:foodSvg,helloHtml:helloHtml,foodHtml:foodHtml,wxHtml:wxHtml,loadWeather:loadWeather,skyHtml:skyHtml,
    applyTheme:applyTheme,decorate:decorate,bannerDeco:bannerDeco,pop:pop,confetti:confetti,theme:theme};
})();

/* ================= headings: floating instead of clouds ================= */
cloud=function(text,size){return size==="xl"?'<h1 class="fhh xl">'+esc(text)+'</h1>':'<h2 class="fhh">'+esc(text)+'</h2>'};
function fh19(title,right){return '<div class="fh19"><h2 class="fhh">'+title+'</h2>'+(right?'<span class="muted small">'+right+'</span>':'')+'</div>'}

/* ================= theme applies on every render ================= */
var _render18=render;
render=function(){if(S.me)V19.applyTheme();_render18()};

/* ================= home data (comes with /boot; refreshed with the 30 s rows poll while Home is open) ================= */
S.home=null;
var _api18=api;
api=function(method,path,body){
  var withHome=false;
  if(method==="GET"&&path.indexOf("/rows?since=")===0&&S.page==="home"){path+="&home=1";withHome=true}
  var pr=_api18(method,path,body);
  if(method==="GET"&&path==="/boot")pr=pr.then(function(b){S.home=b&&b.home||null;if(S.home)S.home.recAt=Date.now();return b});
  if(withHome)pr=pr.then(function(d){if(d&&d.home){mergeHome(d.home);if(S.page==="home"&&!homeBusy())refreshPulse()}return d});
  return pr;
};
function mergeHome(h){if(!h)return;var rec=S.home&&S.home.records;S.home=Object.assign({},S.home||{},h);if(!h.records&&rec)S.home.records=rec;S.home.recAt=h.records?Date.now():(S.home.recAt||0)}
function homeBusy(){var a=document.activeElement;return !!(a&&a.id==="note19"&&a.value)}
function homeAct(method,path,body){return api(method,path,body).then(function(h){mergeHome(h);refreshPulse()}).catch(fail)}

/* ---- Kỷ lục mới: số hôm nay tính ngay trên máy từ hồ sơ trong app ---- */
function nowCounts(){var td=todayISO(),wk=mondayISO(td),we=addDays(wk,6),o={c:0,inc:0,wc:0};
  allRows().forEach(function(x){var r=x.r;if(!r.date)return;var cl=r.status!=="Refund"&&r.name;if(r.date===td){if(cl)o.c++;o.inc+=amt(r)}if(r.date>=wk&&r.date<=we&&cl)o.wc++});return o}
var WDN=["Chủ nhật","Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7"];
function dayLbl(d){if(!d)return "";return WDN[new Date(d+"T12:00:00Z").getUTCDay()]+", "+mdy(d)}
function recList19(){
  var R=S.home&&S.home.records;if(!R)return null;var n=nowCounts(),td=todayISO(),wk=mondayISO(td);
  var L=[["👥","Khách nhiều nhất / ngày",R.dayClients,n.c,"Hôm nay",String,td],["📆","Khách nhiều nhất / tuần",R.weekClients,n.wc,"Tuần này",String,wk],["🗓️","Ngày có hẹn đông nhất",R.dayBookings,R.dayBookings.now,"Hôm nay",function(v){return v+" hẹn"},td],["💰","Ngày income cao nhất",R.dayIncome,n.inc,"Hôm nay",function(v){return money(Math.round(v))},td]];
  return L.map(function(x){var rec=x[2].rec,day=x[2].day,now=x[3];if(now>rec){rec=now;day=x[6]}
    var isNew=now>0&&now>=rec&&day===x[6],tie=now>0&&now>=rec&&!isNew;
    return {ic:x[0],t:x[1],rec:rec,day:day,now:now,nl:x[4],fmt:x[5],isNew:isNew,tie:tie,key:x[1]}})}
function recHtml(){var L=recList19();if(!L)return '<div class="muted small">Đang tải…</div>';
  return L.map(function(r){var p=r.rec>0?Math.min(1,r.now/r.rec):0;
    return '<div class="rrow19'+(r.isNew?' new':'')+'"><span class="ri">'+r.ic+'</span><div class="rt"><div class="rtt">'+r.t+(r.isNew?' <span class="badge19">🎉 Kỷ lục mới!</span>':r.tie?' <span class="badge19">🔥 Bằng kỷ lục!</span>':'')+'</div><div class="bar19"><i style="width:'+(p*100)+'%"></i></div>'+
      '<div class="sub19">'+r.nl+': <b>'+r.fmt(r.now)+'</b>'+(r.isNew||r.rec<=0?'':' · còn '+r.fmt(r.rec-r.now)+' nữa')+'</div></div><div class="rv"><b>'+(r.rec>0?r.fmt(r.rec):'—')+'</b><small>'+(r.isNew?(r.nl==="Tuần này"?"Tuần này":"Hôm nay"):dayLbl(r.day))+'</small></div></div>'}).join("")}
function recCheckNew(){var L=recList19();if(!L)return;var hit=false;L.forEach(function(r){if(!r.isNew)return;var k="rec19|"+r.key+"|"+todayISO()+"|"+r.now;try{if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,"1")}catch(e){}hit=true});if(hit)V19.confetti()}
/* ---- bảng dán giấy ---- */
function wallHtml(){var N=(S.home&&S.home.notes)||[];
  return N.slice(0,5).map(function(n){var r=((n.id*37)%5-2)*0.6;return '<div class="sticky19" style="--r:'+r.toFixed(1)+'deg"><div class="sb">'+esc(n.body)+'</div><div class="by"><span>— '+esc(n.by)+'</span><span><button class="hv'+(n.hearted?' on':'')+'" data-heart="'+n.id+'">♥ '+n.hearts+'</button>'+(n.mine||isAdmin()?'<button class="nx" data-unpin="'+n.id+'" title="Gỡ">×</button>':'')+'</span></div></div>'}).join("")+
    '<div class="sticky19 add"><textarea id="note19" maxlength="140" placeholder="Viết lời khen, nhắc việc, chuyện vui…"></textarea><button class="btn sm pri" id="pin19">Dán</button></div>'}
/* ---- Trưa nay ăn gì + mood ---- */
function lunchHtml(){var L=(S.home&&S.home.lunch)||{options:[],votes:{},mine:""},tot=0;L.options.forEach(function(o){tot+=L.votes[o]||0});
  return '<h3>Trưa nay ăn gì? <small>'+tot+' phiếu'+(isAdmin()?' · <a href="#" id="lunchEd">sửa món</a>':'')+'</small></h3><div class="poll19">'+(L.options.length?L.options.map(function(o){var v=L.votes[o]||0,sp=o.indexOf(" "),ic=sp>0&&sp<4?o.slice(0,sp):"🍽️",nm=sp>0&&sp<4?o.slice(sp+1):o;
    return '<button class="'+(L.mine===o?'me':'')+'" data-lunch="'+esc(o)+'"><i style="width:'+(tot?v/tot*100:0)+'%"></i><span>'+esc(ic)+'</span><b>'+esc(nm)+'</b><small>'+v+'</small></button>'}).join(""):'<div class="muted small">Chưa có món</div>')+'</div>'+
    '<div class="moods19"><span>Hôm nay mình:</span>'+V19.MOODS.map(function(m){return '<button class="'+((S.home&&S.home.mood)===m?'on':'')+'" data-mood="'+m+'">'+m+'</button>'}).join("")+'</div>'}
function pulseInner(){return '<div class="pc19 rec19"><h3>🏆 Kỷ lục mới <small>so với các mùa trước</small></h3>'+recHtml()+'</div><div class="pc19"><h3>Bảng dán giấy <small>tự ẩn sau 3 ngày</small></h3><div class="wall19">'+wallHtml()+'</div></div><div class="pc19">'+lunchHtml()+'</div>'}
function pulseHtml(){return fh19("Nhịp hôm nay","so với kỷ lục của văn phòng")+'<div class="pulse19" id="pulse19">'+pulseInner()+'</div>'}
function refreshPulse(){var p=$("#pulse19");if(!p)return;var draft=$("#note19")?$("#note19").value:"";p.innerHTML=pulseInner();if(draft&&$("#note19"))$("#note19").value=draft;bindPulse();recCheckNew()}
function bindPulse(){
  var p=$("#pulse19");if(!p)return;
  p.onclick=function(e){var b=e.target.closest("button,a");if(!b)return;
    if(b.hasAttribute("data-heart")){var on=!b.classList.contains("on");if(on)V19.pop(e.clientX,e.clientY,"💖");homeAct("POST","/home/notes/"+b.getAttribute("data-heart")+"/heart");return}
    if(b.hasAttribute("data-unpin")){if(confirm("Gỡ tờ giấy này?"))homeAct("DELETE","/home/notes/"+b.getAttribute("data-unpin"));return}
    if(b.id==="pin19"){var v=$("#note19").value.trim();if(!v)return;b.disabled=true;api("POST","/home/notes",{body:v}).then(function(h){$("#note19").value="";mergeHome(h);refreshPulse()}).catch(function(er){b.disabled=false;fail(er)});return}
    if(b.hasAttribute("data-lunch")){var o=b.getAttribute("data-lunch"),mine=S.home.lunch.mine===o;if(!mine)V19.pop(e.clientX,e.clientY,(o.split(" ")[0]||"🍽️"));homeAct("PUT","/home/vote",{kind:"lunch",choice:mine?"":o});return}
    if(b.hasAttribute("data-mood")){var m=b.getAttribute("data-mood"),same=S.home.mood===m;if(!same)V19.pop(e.clientX,e.clientY,m);homeAct("PUT","/home/vote",{kind:"mood",choice:same?"":m});return}
    if(b.id==="lunchEd"){e.preventDefault();var cur=(S.home.lunch.options||[]).join(", "),n=prompt("Các món (cách nhau bằng dấu phẩy, có thể thêm emoji ở đầu, VD: 🍜 Phở, 🥖 Bánh mì):",cur);if(n===null)return;
      var list=n.split(",").map(function(x){return x.trim()}).filter(Boolean).slice(0,8);api("PUT","/settings/lunch",{value:list}).then(function(d){S.home.lunch.options=d.value;refreshPulse()}).catch(fail)}};
  var ta=$("#note19");if(ta)ta.onkeydown=function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("#pin19").click()}};
}

/* ================= Top producers: theo tuần, hết mùa (sau 4/15) mới tính cả mùa ================= */
tpData=function(){
  var today=todayISO(),y=S.fy,s0=y+"-02-01",s1=y+"-04-15",mode,from,to;
  if(today>s1){mode="season";from=s0;to=s1}else{mode="week";from=mondayISO(today);to=addDays(from,6)}
  var per=S.staff.map(function(t){var v={name:shortOf(t),inc:0,n:0,tip:0,tab:t.id};
    live(t.id).forEach(function(r){if(!r.date||r.date<from||r.date>to)return;v.inc+=amt(r);if(r.status!=="Refund"&&r.name)v.n++;v.tip+=r.tip||0});return v});
  var cat=function(key,title,color,fmt){var rows=per.filter(function(v){return v[key]>0}).sort(function(a,b){return b[key]-a[key]}).slice(0,3);
    return {title:title,color:color,key:key,rows:rows.map(function(v){return {name:v.name,tab:v.tab,v:fmt(v[key]),rk:1+per.filter(function(x){return x[key]>v[key]}).length}})}};
  var cats=[cat("inc","Vua doanh thu","#c99a06",money),cat("n","Vua tốc độ","#1b6a9c",String),cat("tip","FS Idol","#c2185b",money)];
  return {mode:mode,from:from,to:to,cats:cats,empty:cats.every(function(c){return !c.rows.length})};
};
topProducersCard=function(){
  var D=tpData(),mine=myTab(),unit={inc:"Income",n:"Files",tip:"Tips"},wk=D.mode==="week"?" tuần":" cả mùa";
  return fh19("👑 Top producers",tpLabel(D))+'<div class="tp19">'+D.cats.map(function(c){
    return '<div><h4>'+crownSvg2(c.color,18)+c.title+'<small>'+unit[c.key]+wk+'</small></h4><ol>'+(c.rows.length?c.rows.map(function(r){var s=sById(r.tab);
      return '<li class="'+(r.tab===mine?'me':'')+(r.rk===1?' r1':'')+'"><span class="rk">'+r.rk+'</span>'+(s?avatarHtml(s,24):'<span></span>')+'<span class="nm">'+esc(r.name)+'</span><b>'+r.v+'</b><button class="cheer" title="Cổ vũ">👏</button></li>'}).join(""):'<li class="muted"><span></span><span></span><span class="nm">Chưa có hồ sơ</span><b></b><span></span></li>')+'</ol></div>'}).join("")+'</div>';
};

/* ================= Homepage (desktop) ================= */
function heroHtml(){var td=todayISO();
  return '<div class="hero19"><div class="hl"><div class="hellorow"><div id="hello19">'+V19.helloHtml()+'</div>'+V19.foodHtml(isPhone()?52:72)+'</div>'+quoteHtml("home")+
    '<div class="today19">Hôm nay là <b>'+dayLbl(td).replace("Thứ ","Thứ ")+'</b> <span class="wx19" id="wx19">'+V19.wxHtml()+'</span> <button class="chip19" id="th19" type="button">🎨 Theme</button></div></div>'+
    (isPhone()?'':'<div class="sky19" id="sky19">'+V19.skyHtml()+'</div>')+'</div>'}
pageHome=function(){
  var h=heroHtml();
  h+='<div class="notice"><b>Thông báo:</b> '+esc(S.notice)+(isAdmin()?' &nbsp;<a href="#" id="editNotice">sửa</a>':'')+'</div>';
  h+=pulseHtml();
  h+=topProducersCard();
  h+=homeCardHtml("Informations / Tips");
  if(isAdmin()){
    var wait=0,n=0,tc=0,tt=0,a=attn();allRows().forEach(function(x){if(bucket(x.r)==="wt"){wait+=x.r.amt;n++}if(x.r.status!=="Refund"&&x.r.name)tc++;tt+=amt(x.r)});
    h+=fh19("Summary","Chỉ Admin thấy · "+periodCtl());
    h+='<div class="stats19"><div><span class="ic">👥</span><b>'+tc+'</b><span>Total clients</span></div><div><span class="ic">💵</span><b>'+money(tt)+'</b><span>Total Income</span></div>'+
      '<div><span class="ic">⏳</span><b class="w">'+money(wait)+'</b><span>Still waiting for Online files · '+n+' files</span></div><div id="goAttn" class="att"><span class="ic">🚩</span><b class="r">'+a.total+' files</b><span>Attention · bấm để xem</span></div></div>';
    h+='<div class="card"><div class="wrap">'+summary()+'</div>'+othersPanel()+'</div>';
  }
  return h;
};
/* phone Home: hello (theo theme) → Thông báo → Nhịp hôm nay → (như v18) */
var _phoneHome18=phoneHome;
phoneHome=function(){
  var h=_phoneHome18(),a=h.indexOf('<div class="notice">'),b=a>=0?h.indexOf('</div>',a)+6:-1;
  if(a<0)return heroHtml()+pulseHtml()+h;
  return heroHtml()+h.slice(a,b)+pulseHtml()+h.slice(b);
};
function bindHome19(){
  if(!$("#hello19"))return;
  if($("#th19"))$("#th19").onclick=openTheme;
  bindPulse();recCheckNew();V19.loadWeather();
  $$(".tp19 .cheer").forEach(function(b){b.onclick=function(e){V19.pop(e.clientX,e.clientY,"👏")}});
  if(S.home&&Date.now()-(S.home.recAt||0)>15*60*1000&&!S._recLoading){S._recLoading=true;api("GET","/home?rec=1").then(function(h){mergeHome(h);refreshPulse()}).catch(function(){}).then(function(){S._recLoading=false})}
  if(!S.home&&!S._homeLoading){S._homeLoading=true;api("GET","/home?rec=1").then(function(h){mergeHome(h);refreshPulse()}).catch(function(){}).then(function(){S._homeLoading=false})}
}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){var e=$("#hello19");if(e)e.innerHTML=V19.helloHtml()});

/* ================= Theme / món ruột / cung hoàng đạo (mỗi người tự chọn) ================= */
function openTheme(){
  var m=$("#modalHost"),pick={theme:V19.theme(),food:S.me.food||"",zodiac:S.me.zodiac||""};
  function draw(){
    m.innerHTML='<div class="modal"><div class="box th19"><h3>🎨 Theme của bạn</h3><div class="muted small" style="margin-bottom:8px">Chỉ đổi giao diện của bạn. Người khác vẫn thấy theme của họ.</div>'+
      '<div class="thg19">'+V19.THEMES.map(function(t){return '<button type="button" class="thc19'+(pick.theme===t[0]?' on':'')+'" data-th="'+t[0]+'" data-style="'+t[0]+'"><span class="thp">'+V19.bannerDeco(t[0])+'</span><b>'+t[1]+'</b></button>'}).join("")+'</div>'+
      '<h4>Món ruột <small class="muted">· hiện kế bên Hello</small></h4><div class="fdg19">'+Object.keys(V19.FOOD).map(function(k){return '<button type="button" class="'+(pick.food===k?'on':'')+'" data-fd="'+k+'" title="'+esc(V19.FOOD[k].n)+'">'+V19.foodSvg(k,34)+'<small>'+esc(V19.FOOD[k].n)+'</small></button>'}).join("")+'<button type="button" class="none'+(pick.food?'':' on')+'" data-fd="">Không có</button></div>'+
      '<h4>Cung hoàng đạo <small class="muted">· dùng cho lá bài tarot ở theme Gen-Z</small></h4><div class="zdg19">'+Object.keys(V19.ZOD).map(function(k){return '<button type="button" class="'+(pick.zodiac===k?'on':'')+'" data-zd="'+k+'"><span>'+V19.ZOD[k][0]+'︎</span>'+V19.ZOD[k][1]+'</button>'}).join("")+'</div>'+
      '<div class="err" id="thErr"></div><div class="row-end"><button class="btn" id="thC">Hủy</button><button class="btn pri" id="thS">Lưu</button></div></div></div>';
    m.firstChild.onclick=function(e){if(e.target===m.firstChild){m.innerHTML="";return}var b=e.target.closest("[data-th],[data-fd],[data-zd]");if(!b)return;
      if(b.hasAttribute("data-th"))pick.theme=b.getAttribute("data-th");if(b.hasAttribute("data-fd"))pick.food=b.getAttribute("data-fd");if(b.hasAttribute("data-zd"))pick.zodiac=b.getAttribute("data-zd");draw()};
    $("#thC").onclick=function(){m.innerHTML=""};
    $("#thS").onclick=function(){var btn=this;btn.disabled=true;api("PUT","/prefs",pick).then(function(){S.me.theme=pick.theme;S.me.food=pick.food;S.me.zodiac=pick.zodiac;m.innerHTML="";render();toast("Đã lưu theme")}).catch(function(e){btn.disabled=false;$("#thErr").textContent=e.message})};
  }
  draw();
}
var _buildShell18=buildShell;
buildShell=function(){_buildShell18();if(isPhone())return;var o=$("#outLink");if(o&&!$("#themeLink")){o.insertAdjacentHTML("beforebegin",'<a href="#" id="themeLink">Theme</a> · ');$("#themeLink").onclick=function(e){e.preventDefault();openTheme()}}};
var _togglePMenu17=togglePMenu;
togglePMenu=function(force){_togglePMenu17(force);var m=$("#pmenu");if(!m||!m.innerHTML)return;var pw=m.querySelector('[data-pm="__pw"]');if(pw&&!m.querySelector('[data-pm="__th"]')){pw.insertAdjacentHTML("beforebegin",'<button class="mi" data-pm="__th">🎨 Theme</button>');
  m.querySelector('[data-pm="__th"]').addEventListener("click",function(e){e.stopPropagation();togglePMenu(false);openTheme()},true)}};

/* ================= staff tab: banner theo theme ================= */
var _pageStaff18=pageStaff;
pageStaff=function(id){var h=_pageStaff18(id);return h.replace('<div class="banner">','<div class="banner b19">'+V19.bannerDeco(V19.theme()))};

/* ================= Appointment ================= */
var _refreshWeek17=refreshWeek;
refreshWeek=function(wk){wk=wk||S.weekStart;var me1=_wkReq[wk]=(_wkReq[wk]||0)+1;
  return api("GET","/bookings?from="+wk+"&to="+addDays(wk,6)).then(function(list){if(me1!==_wkReq[wk])return;var first=!S.bkWeeks[wk];S.bkWeeks[wk]=true;
    var before=bkSnap(wk);
    Object.keys(S.bookings).forEach(function(k){var d=k.split("|")[1];if(d>=wk&&d<=addDays(wk,6))delete S.bookings[k]});
    list.forEach(function(b){S.bookings[b.cal+"|"+b.date+"|"+b.slot]={n:b.n,p:b.p,f:b.f,s:b.s,note:b.note,span:b.span,id:b.id,sms:b.sms,tk:b.tk,biz:!!b.biz}});
    if((first||bkSnap(wk)!==before)&&S.page==="appt"&&S.apptSub!=="Work Schedule"&&S.weekStart===wk&&!uiBusy()&&!S._dk)renderKeep();
  }).catch(function(){})};
apiSaveBooking=function(cal,day,slot,b,old){
  return api("POST","/bookings/save",{cal:cal,day:day,slot:slot,client:b.n,phone:b.p,files:b.f,preparer:b.s||"",note:b.note||"",span:b.span||1,sms:b.sms!==false,biz:!!b.biz,old:old||null});
};
wrapFont=function(h){return '<div class="appt19">'+h+'</div>'};
function bizAllowed(cal,prep){return cal==="Daniel"||(cal==="Office"&&/^hailey/i.test(prep||""))}
pageAppt=function(){
  var who=S.apptSub,names=["Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7","CN"],days=[],td=todayISO();for(var i=0;i<7;i++)days.push(addDays(S.weekStart,i));
  var h='<div class="page-head"><div><h1>Appointment</h1><div class="sub">'+smsStatusLine()+'</div></div></div>';
  h+='<div class="sub-tabs">'+["Office","Daniel","Peter","Work Schedule"].map(function(n){return '<button class="btn'+(who===n?' on':'')+'" data-sub="'+n+'">'+n+'</button>'}).join("");
  if(who!=="Work Schedule")h+='<span style="width:16px"></span><button class="btn" id="pw">‹ Tuần trước</button><b>'+md(S.weekStart)+' – '+md(days[6])+'/'+days[6].slice(0,4)+'</b><button class="btn" id="nw">Tuần sau ›</button>'+(S.bkWeeks[S.weekStart]?'':'<span class="muted small">đang tải…</span>');
  h+='</div>';
  if(who==="Work Schedule")return wrapFont(h+pageSchedule());
  h+='<div class="legend19">'+(who==="Office"?'(Preparer) Client (số files), phone ở dòng dưới · ':'')+'tên <u>gạch dưới</u> = có ghi chú (rê chuột để xem) · <span class="bizdot19"></span> Business · ngày đã qua bị làm mờ · ô xám = ngoài giờ · kéo hẹn sang ô khác để dời'+(who!=="Office"?' · <b>rê lên hẹn rồi kéo vạch ở cạnh dưới để kéo dài</b>':'')+'</div>';
  var slots=slotsFor(who),skip={};
  h+='<div class="wrap"><table class="week w19"><tr><th class="tcol"></th>'+days.map(function(d,i){var ci=colInfo(who,d);skip[d]=0;return '<th class="'+(ci?'blk':'')+(d<td?' past':'')+'">'+names[i]+'<small>'+md(d)+'</small></th>'}).join("")+'</tr>';
  slots.forEach(function(sl,si){h+='<tr data-si="'+si+'" class="'+(sl%60?'half':'')+'"><td class="t">'+hm(sl)+'</td>';
    days.forEach(function(d){var ci=colInfo(who,d),past=d<td;
      if(ci){if(si===0)h+='<td class="off'+(past?' past':'')+'" rowspan="'+slots.length+'"><span>'+esc(ci.label)+'</span></td>';return}
      if(skip[d]>0){skip[d]--;return}
      var key=who+"|"+d+"|"+hm(sl),bk=S.bookings[key],cl=isClosed(d,sl,who);
      var span=bk?Math.max(1,Math.min(bk.span||1,slots.length-si)):1;if(bk)skip[d]=span-1;
      var cls="c"+(bk?" bk":cl?" closed":"")+(bk&&cl?" extra":"")+(bk&&bk.biz?" biz":"")+(bk&&span>1?" multi":"")+(past?" past":"");
      var txt="";
      if(bk)txt='<span class="anm'+(bk.note?' hn':'')+'">'+(bk.s?'<span class="pre">('+esc(bk.s)+')</span> ':'')+esc(bk.n)+' ('+bk.f+')</span><span class="ph">'+esc(bk.p)+'</span>'+(span>1?'<span class="rg">'+hm(sl)+' – '+hm(sl+span*S.cal[who].step)+'</span>':'');
      h+='<td class="'+cls+'" data-k="'+key+'"'+(span>1?' rowspan="'+span+'"':'')+' title="'+(bk?esc((bk.s?bk.s+' · ':'')+bk.n+' '+bk.p+' · '+bk.f+' files'+(bk.biz?' · Business':'')+(bk.note?'\nGhi chú: '+bk.note:'')):'')+'">'+txt+(bk?'<button class="bx" data-bx="'+key+'" title="Xóa hẹn" draggable="false">×</button>':'')+(bk&&who!=="Office"?'<div class="rz" title="Kéo xuống để kéo dài"></div>':'')+'</td>'});
    h+='</tr>'});
  return wrapFont(h+'</table></div>');
};
/* booking pop-up: + Business? + cảnh báo số điện thoại đã có hẹn (từ hôm nay trở đi) */
openBooking=function(k,p){
  var ex=!!S.bookings[k],b=S.bookings[k]||{n:"",p:"",f:1,s:"",note:"",span:1},m=$("#modalHost"),off=p[0]==="Office",dupOk=false,dupFor="";
  m.innerHTML='<div class="modal"><div class="box"><h3>'+p[0]+' · '+mdy(p[1])+' · '+p[2]+'</h3><div class="f">'+
    '<label>Client name <span class="req">*</span></label><input type="text" id="bn" value="'+esc(b.n)+'">'+
    '<label>Phone <span class="req">*</span></label><input type="text" id="bp" value="'+esc(b.p)+'" placeholder="714-000-0000">'+
    '<label>Files <span class="req">*</span></label><input type="number" id="bf" min="1" value="'+esc(b.f)+'" placeholder="1">'+
    (off?'<label>Preparer</label><select id="bs"><option value="">(optional)</option>'+S.prep.map(function(o){var ok=availPrep(o,p[1],p[2]);return '<option value="'+esc(o)+'"'+(o===b.s?' selected':'')+(ok?'':' class="dim" style="color:#aaa"')+'>'+esc(o)+'</option>'}).join("")+'</select>':'')+
    '<label>Notes</label><input type="text" id="bnote" value="'+esc(b.note)+'" placeholder="(optional) · có ghi chú thì tên được gạch dưới">'+
    '<label class="bizl" id="bbizL"></label><label class="chk biz19" id="bbizR"><input type="checkbox" id="bbiz"'+(b.biz?' checked':'')+'> <b>Business?</b> <span class="muted small">ô hẹn sẽ màu vàng</span></label>'+
    (smsOn()?'<label></label><label class="chk"><input type="checkbox" id="bsms"'+(b.sms===false?'':' checked')+'> Text cho khách</label>':'')+
    (ex?'<label>Date</label><input type="date" id="bdt" value="'+p[1]+'"><label>Time</label><select id="btm">'+slotsFor(p[0]).map(function(x){return '<option'+(hm(x)===p[2]?' selected':'')+'>'+hm(x)+'</option>'}).join("")+'</select>':'')+
    '</div><div class="dup19" id="bdup" hidden></div>'+(ex&&b.tk?'<div class="smsh" id="bsmsh"></div>':'')+'<div class="err" id="berr"></div><div class="row-end">'+(ex?'<button class="btn del" id="bdel">Xóa hẹn</button><span style="flex:1"></span>':'')+'<button class="btn" id="bc">Hủy</button><button class="btn pri" id="bsv">Lưu</button></div></div></div>';
  if(ex&&b.tk)loadSmsHist(b.tk);
  function bizShow(){var on=bizAllowed(p[0],$("#bs")?$("#bs").value:"");$("#bbizL").style.display=$("#bbizR").style.display=on?"":"none";if(!on)$("#bbiz").checked=false}
  bizShow();
  $("#bc").onclick=function(){m.innerHTML=""};
  if($("#bs")){var dimSel=function(){var o=$("#bs").selectedOptions[0];$("#bs").style.color=o&&o.classList.contains("dim")?"#aaa":""};$("#bs").onchange=function(){dimSel();bizShow()};dimSel()}
  if($("#bdel"))$("#bdel").onclick=function(){askDeleteBooking(k,p,b,function(){m.innerHTML=""})};
  function digits(s){return String(s||"").replace(/\D/g,"").slice(-10)}
  function checkDup(){var dg=digits($("#bp").value);if(dg.length<10){$("#bdup").hidden=true;return Promise.resolve([])}
    if(dupFor===dg&&dupOk)return Promise.resolve(null);
    return api("GET","/bookings/phone?p="+dg+(ex?"&not="+encodeURIComponent(k):"")).then(function(list){dupFor=dg;
      if(!list.length){$("#bdup").hidden=true;dupOk=true;$("#bsv").textContent="Lưu";return list}
      $("#bdup").hidden=false;$("#bdup").innerHTML='⚠️ <b>Số này đã có hẹn:</b><ul>'+list.map(function(x){return '<li>'+dayLbl(x.date)+' · '+x.slot+' — '+esc(x.n)+' <span class="muted">('+esc(x.cal)+(x.cal==="Office"&&x.s?' · '+esc(x.s):'')+')</span></li>'}).join("")+'</ul>Bạn chắc chắn muốn đặt thêm hẹn này?';
      dupOk=true;$("#bsv").textContent="Vẫn đặt hẹn";return list}).catch(function(){dupOk=true;return []})}
  $("#bp").onblur=function(){if(digits(this.value)!==dupFor){dupOk=false;checkDup()}};
  $("#bp").oninput=function(){if(digits(this.value)!==dupFor){dupOk=false;$("#bdup").hidden=true;$("#bsv").textContent="Lưu"}};
  $("#bsv").onclick=function(){var n=$("#bn").value.trim(),ph=$("#bp").value.trim(),f=parseInt($("#bf").value,10);
    if(!n||!ph||!(f>0)){$("#berr").textContent="Cần điền Client name, Phone và Files.";return}
    var go=function(){
      var nd=$("#bdt")?$("#bdt").value:p[1],nt=$("#btm")?$("#btm").value:p[2],nk=p[0]+"|"+nd+"|"+nt,sp=$("#bs")?$("#bs").value:"";
      var nb={n:titleCase(n),p:ph,f:f,s:sp,note:$("#bnote").value.trim(),span:b.span||1,sms:$("#bsms")?$("#bsms").checked:(b.sms!==false),tk:b.tk||"",biz:$("#bbiz").checked&&bizAllowed(p[0],sp)};
      if(nk!==k){var er=canPlace(p[0],nd,nt,nb.span,k);if(er){$("#berr").textContent=er;return}}
      if(sp&&!availPrep(sp,nd,nt)&&!confirm(sp+" không có lịch đi làm vào giờ này. Vẫn đặt hẹn cho "+sp+"?"))return;
      var bsv=$("#bsv");bsv.disabled=true;
      apiSaveBooking(p[0],nd,nt,nb,ex?{cal:p[0],day:p[1],slot:p[2]}:null).then(function(r){m.innerHTML="";nb.id=r&&r.id;nb.tk=r&&r.tk;localMove(ex?k:null,nk,nb);smsToast(r&&r.smsRes);reloadWeek()}).catch(function(e){bsv.disabled=false;$("#berr").textContent=e.message})};
    var phoneChanged=!ex||digits(ph)!==digits(b.p);
    if(!phoneChanged||dupOk&&dupFor===digits(ph)){go();return}
    var bsv=$("#bsv");bsv.disabled=true;checkDup().then(function(list){bsv.disabled=false;if(list&&list.length)return;go()});
  };
};

/* ================= after render ================= */
var _afterRender18=afterRender;
afterRender=function(){
  _afterRender18();
  if(S.page==="home")bindHome19();
  /* phone Appt: Business = vàng, có ghi chú = gạch dưới */
  $$(".pbk[data-bk]").forEach(function(el){var b=S.bookings[el.getAttribute("data-bk")];if(!b)return;if(b.biz)el.classList.add("biz");if(b.note){var t=el.querySelector("b");if(t){t.classList.add("hn");t.innerHTML=t.innerHTML.replace(/ \*$/,"")}}});
};

/* ================= go ================= */
start();
