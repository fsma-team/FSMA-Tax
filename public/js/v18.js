/* v18: light "cloud" design, quotes, tab pictures, phone Appt by day (drag to move), phone Home order.
   Loaded after app.js / acct.js / v17.js. Overrides some of their functions, then calls start(). */

/* ================= clouds ================= */
var _cv=document.createElement("canvas").getContext("2d");
var CLOUD_W=[0.9,1.4,1.1,1.25];
function cloud(text,size){
  var fs=size==="xl"?(isPhone()?30:40):size==="md"?(isPhone()?16.5:20):15,fw=size==="xl"?700:600;
  _cv.font=fw+" "+fs+"px 'Segoe UI', -apple-system, system-ui, Arial, sans-serif";
  var tw=_cv.measureText(text).width,tb=fs*1.55,er=tb*0.5,pad=fs*0.75;
  var w=Math.ceil(tw+pad*2+er*2),x0=2+er,x1=w-2-er,inner=x1-x0;
  var n=Math.max(2,Math.min(4,Math.round(inner/(fs*4.6)))),wts=CLOUD_W.slice(0,n),sw=wts.reduce(function(a,b){return a+b},0);
  var top=wts.map(function(v){return inner*v/sw}),bump=function(s){return Math.min(s*0.34,fs*0.8)};
  var maxB=Math.max.apply(null,top.map(bump)),topY=2+maxB,botY=topY+tb,bseg=inner/n,bb=Math.min(bseg*0.12,fs*0.3),h=Math.ceil(botY+bb+2);
  var d="M"+x0.toFixed(1)+" "+topY.toFixed(1),x=x0;
  top.forEach(function(s){x+=s;d+=" A"+(s/2).toFixed(1)+" "+bump(s).toFixed(1)+" 0 0 1 "+x.toFixed(1)+" "+topY.toFixed(1)});
  d+=" A"+er.toFixed(1)+" "+(tb/2).toFixed(1)+" 0 0 1 "+x1.toFixed(1)+" "+botY.toFixed(1);
  for(var j=0;j<n;j++)d+=" A"+(bseg/2).toFixed(1)+" "+bb.toFixed(1)+" 0 0 1 "+(x1-(j+1)*bseg).toFixed(1)+" "+botY.toFixed(1);
  d+=" A"+er.toFixed(1)+" "+(tb/2).toFixed(1)+" 0 0 1 "+x0.toFixed(1)+" "+topY.toFixed(1)+" Z";
  return '<h2 class="cloud '+size+'"><svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" aria-hidden="true"><path d="'+d+'"/></svg><span style="padding-top:'+((topY+botY)-h).toFixed(1)+'px">'+esc(text)+'</span></h2>';
}
function cloudDeco(w,x,y){var h=w*0.4,b=w/4;return '<svg class="cdeco" style="left:'+x+'px;top:'+y+'px" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" aria-hidden="true"><path d="M'+b*0.55+' '+h*0.62+' A'+b*0.45+' '+h*0.3+' 0 0 1 '+b*1.3+' '+h*0.38+' A'+b*0.85+' '+h*0.42+' 0 0 1 '+b*2.9+' '+h*0.34+' A'+b*0.55+' '+h*0.3+' 0 0 1 '+b*3.55+' '+h*0.66+' A'+b*0.3+' '+h*0.18+' 0 0 1 '+b*3.3+' '+h*0.92+' L'+b*0.75+' '+h*0.92+' A'+b*0.3+' '+h*0.17+' 0 0 1 '+b*0.55+' '+h*0.62+' Z"/></svg>'}
function helloCloud(){return '<div class="hello">'+(isPhone()?cloudDeco(140,190,0):cloudDeco(240,330,0)+cloudDeco(140,560,40))+cloud("Hello Team!","xl")+'</div>'}

/* ================= quotes (one per page visit, tap to change) ================= */
var QUOTES=[
 "Hôm nay tôi rất năng suất. Tôi đã mở laptop.",
 "Deadline không đáng sợ. Đáng sợ là nó tới đúng hẹn.",
 "Kế hoạch hôm nay: làm xong việc của hôm qua.",
 "Tôi không lười. Tôi đang ở chế độ tiết kiệm pin.",
 "Tiền không mua được hạnh phúc, nhưng mua được trà sữa. Gần giống nhau.",
 "Tiền không mọc trên cây. Trong ví tôi cũng không.",
 "Khách hỏi “nhanh không?” — nhanh như IRS bắt máy.",
 "Việc khó nhất trong ngày là bắt đầu. Việc khó thứ hai là chọn món ăn trưa.",
 "Bình tĩnh. Hít thở. Kiểm tra lại SSN.",
 "Hạnh phúc là khi khách mang đủ giấy tờ ngay lần đầu.",
 "Thứ Hai tới đều đặn hơn cả refund.",
 "Cuộc đời không có nút Undo. Nhưng có nút Save, nhớ bấm.",
 "Đừng so sánh chương 1 của mình với chương 20 của người khác.",
 "Mỗi ngày tốt hơn hôm qua 1% là đủ.",
 "Đi chậm cũng được, miễn đừng đi lùi.",
 "Người giỏi không phải người không sai, mà là người sửa nhanh.",
 "Uống miếng nước đi. Chuyện gì rồi cũng giải quyết được.",
 "Có những ngày mình là cây búa, có những ngày mình là cây đinh. Hôm nay cứ là cây búa.",
 "Ngủ đủ giấc là bí quyết. Tiếc là bí quyết này ít ai làm được.",
 "Làm việc chăm chỉ trong im lặng. Để W-2 lên tiếng."
];
S._q={};S._qPage=null;
function quoteFor(key){if(S._qPage!==S.page){S._qPage=S.page;S._q={}}
  if(!S._q[key]){var used=Object.keys(S._q).map(function(k){return S._q[k]}),pool=QUOTES.filter(function(q){return used.indexOf(q)<0});S._q[key]=pool[Math.floor(Math.random()*pool.length)]}
  return S._q[key]}
function quoteHtml(key){return '<div class="quote" data-qk="'+key+'" title="Bấm để đổi câu">“'+esc(quoteFor(key))+'”</div>'}
function afterRender(){
  $$("[data-qk]").forEach(function(q){q.onclick=function(){var k=q.getAttribute("data-qk"),old=S._q[k];do{S._q[k]=QUOTES[Math.floor(Math.random()*QUOTES.length)]}while(S._q[k]===old);q.textContent="“"+S._q[k]+"”"}});
}

/* ================= tab pictures ================= */
var AV_EMO=["😎","🦁","🐯","🌸","🍀","🔥","⭐","🐼","🦊","🐱","🐶","🌈","☕","🎯","💪","🥳","🦄","🐻","🌻","🍉","🚀","👑","😺","🤓"];
function avatarHtml(s,px){
  var c=PALETTE[s.theme.color]||"#3d85c6",a=s.av,st='style="--c:'+c+';width:'+px+'px;height:'+px+'px;font-size:'+Math.round(a&&a.t==="emo"?px*0.58:px*0.44)+'px"';
  if(a&&a.t==="img")return '<span class="av" '+st+'><img src="'+esc(a.u)+'" alt=""></span>';
  if(a&&a.t==="emo")return '<span class="av" '+st+'>'+esc(a.v)+'</span>';
  return '<span class="av" '+st+'>'+esc((s.name||"?").charAt(0).toUpperCase())+'</span>';
}

/* ================= desktop: menu + staff tabs ================= */
renderNav=function(){
  var items=[["home","Homepage"],["fees","Fees"],["appt","Appointment"],["attn","Attention"]];
  if(isAdmin()){items.push(["reports","Reports"],["acct","Accounting"],["records","Records"],["settings","Settings"])}
  if(isPhone()){renderPhoneNav();return}
  $("#nav").innerHTML=items.map(function(x){return '<button data-p="'+x[0]+'" class="'+(S.page===x[0]?'on':'')+'">'+x[1]+'</button>'}).join("");
  $("#sheets").innerHTML=S.staff.map(function(s){return '<button class="st'+(S.page===s.id?' on':'')+'" data-p="'+s.id+'" style="--c:'+(PALETTE[s.theme.color])+'">'+avatarHtml(s,22)+'<span>'+esc(s.name)+'</span></button>'}).join("")+(isAdmin()?'<button class="st add" data-p="__add" title="Chỉ Admin">+ Thêm tab</button>':'');
  $$("[data-p]").forEach(function(b){b.onclick=function(){var k=b.getAttribute("data-p");if(k==="__add"){addStaff();return}S.page=k;render()}});
  $("#welcome").textContent="Welcome, "+me();
};

/* ================= Home ================= */
function crownSvg2(c,sz){return '<svg viewBox="0 0 24 24" width="'+sz+'" height="'+sz+'" aria-hidden="true" class="crown"><path d="M3 7.5l4.6 4.2L12 4.5l4.4 7.2L21 7.5 19.2 17H4.8z" fill="'+c+'"/><rect x="4.8" y="17.6" width="14.4" height="2.6" rx="1.1" fill="'+c+'" opacity=".8"/></svg>'}
topProducersCard=function(){
  var D=tpData(),mine=myTab();
  return '<div class="card tp"><div class="tp-head">'+cloud("Top producers","md")+'<span class="muted small">'+tpLabel(D)+'</span></div><div class="tp-grid">'+D.cats.map(function(c){
    return '<div class="tp-cat"><div class="tp-h">'+crownSvg2(c.color,16)+c.title+'</div><ol>'+(c.rows.length?c.rows.map(function(r){return '<li class="'+(r.tab===mine?'me':'')+(r.rk===1?' r1':'')+'"><span class="rkn">'+r.rk+'</span><span class="nm">'+esc(r.name)+(r.rk===1?crownSvg2("#e3a51a",13):'')+'</span><b>'+r.v+'</b></li>'}).join(""):'<li class="muted"><span></span><span class="nm">Chưa có hồ sơ</span><b></b></li>')+'</ol></div>'}).join("")+'</div></div>';
};
var _pageHome17=pageHome;
pageHome=function(){
  var h=_pageHome17();
  h=h.replace('<div class="page-head"><div><h1>Hello Team!</h1>','<div class="page-head"><div>'+helloCloud()+quoteHtml("home"));
  h=h.replace(/<div class="card"><h2>([^<]+)<\/h2>/g,function(m,t){return '<div class="card">'+cloud(t,"md")});
  h=h.replace(/<div class="card-head"><h2>([^<]+)<\/h2>/g,function(m,t){return '<div class="card-head">'+cloud(t,"md")});
  return h;
};
/* pieces of the desktop Home reused on the phone (same rules, same buttons) */
function homeCardHtml(title){var h=_pageHome17(),a=h.indexOf('<div class="card"><h2>'+title+'</h2>');if(a<0)return "";
  var b=h.indexOf('<div class="card"',a+10);return h.slice(a,b<0?h.length:b).replace('<h2>'+title+'</h2>',cloud(title,"md"))}

/* ================= phone Home: Top producers → Info / Tips → Hẹn hôm nay → Work Schedule → Summary ================= */
var _phoneHome17=phoneHome;
phoneHome=function(){
  var old=_phoneHome17(),secs={};
  old.split('<div class="psec">').slice(1).forEach(function(p){var t=(p.match(/<b>([^<]+)<\/b>/)||[])[1]||"";secs[t]='<div class="psec">'+p.replace(/<div class="pl-top"><b>([^<]+)<\/b><span>([^<]*)<\/span><\/div>/,function(m,a,b){return '<div class="pl-top">'+cloud(a,"md")+'<span>'+b+'</span></div>'})});
  var td=todayISO(),days=["Chủ nhật","Thứ hai","Thứ ba","Thứ tư","Thứ năm","Thứ sáu","Thứ bảy"];
  var h='<div class="page-head"><div>'+helloCloud()+quoteHtml("home")+'<div class="sub">Hôm nay là '+days[new Date(td+"T12:00:00Z").getUTCDay()]+', '+mdy(td)+'</div></div></div>';
  h+='<div class="notice"><b>Thông báo:</b> '+esc(S.notice)+'</div>';
  h+=topProducersCard();
  h+=homeCardHtml("Informations / Tips");
  h+=(secs["Hẹn hôm nay của bạn"]||"")+(secs["Work Schedule"]||"")+(secs["Summary"]||"");
  return h;
};
var _bindPhoneHome17=bindPhoneHome;
bindPhoneHome=function(){_bindPhoneHome17();bindHomeTips()};

/* ================= staff tab banner (desktop) ================= */
var _pageStaff17=pageStaff;
pageStaff=function(id){
  var h=_pageStaff17(id),s=sById(id),th=s.theme,a=h.indexOf('<div class="banner">'),b=h.indexOf('<div class="statbar">');
  if(a<0||b<0)return h;
  var who='<div class="banner"><div class="who">'+avatarHtml(s,88)+'<div class="whot"><div class="nmrow"><h2 class="nm" style="font-family:\''+th.font+'\',cursive,sans-serif">'+esc(th.title)+'</h2><button class="lnk2" id="cust">Sửa banner</button></div>'+quoteHtml("tab")+(th.tag?'<div class="tg">'+esc(th.tag)+'</div>':'')+'</div></div>';
  return h.slice(0,a)+who+h.slice(b);
};

/* ================= Customize banner + picture ================= */
openCustomize=function(id){
  var s=sById(id),t=s.theme,m=$("#modalHost"),cur=s.av?Object.assign({},s.av):null,tab=cur?cur.t:"letter",pick=t.color,pending=null;
  function prev(){var tmp={name:s.name,theme:{color:pick},av:pending?(pending.t==="img"?{t:"img",u:pending.url}:pending):cur};return avatarHtml(tmp,64)}
  function draw(){
    m.innerHTML='<div class="modal"><div class="box cz"><h3>Sửa banner · '+esc(s.name)+'</h3>'+
      '<div class="czav"><div id="czPrev">'+prev()+'</div><div class="czr"><div class="seg2">'+[["emo","Mặt cười"],["img","Hình / GIF"],["letter","Chữ cái"]].map(function(x){return '<button type="button" data-avt="'+x[0]+'" class="'+(tab===x[0]?'on':'')+'">'+x[1]+'</button>'}).join("")+'</div>'+
      (tab==="emo"?'<div class="emog">'+AV_EMO.map(function(e){var on=(pending&&pending.t==="emo"&&pending.v===e)||(!pending&&cur&&cur.t==="emo"&&cur.v===e);return '<button type="button" data-emo="'+e+'" class="'+(on?'on':'')+'">'+e+'</button>'}).join("")+'</div>':'')+
      (tab==="img"?'<div class="czimg"><input type="file" id="czFile" accept="image/png,image/jpeg,image/webp,image/gif"><div class="muted small">Hình lớn cỡ nào cũng được, tự nén lại. GIF lớn hơn 2MB tự thu nhỏ, vẫn giữ chuyển động.</div><div class="small" id="czMsg"></div></div>':'')+
      (tab==="letter"?'<div class="muted small" style="margin-top:6px">Chữ cái đầu của tên trong vòng tròn màu của tab.</div>':'')+
      '</div></div><div class="f"><label>Tiêu đề</label><input type="text" id="ct" value="'+esc(t.title)+'">'+
      '<label>Lời nhắn</label><input type="text" id="cg" value="'+esc(t.tag)+'" placeholder="Tùy chọn · hiện dưới câu quote">'+
      '<label>Font tiêu đề</label><select id="cf">'+FONTS.map(function(f){return '<option'+(f===t.font?' selected':'')+' style="font-family:\''+f+'\'">'+f+'</option>'}).join("")+'</select>'+
      '<label>Màu</label><div id="csw">'+Object.keys(PALETTE).map(function(k){return '<span class="sw'+(k===pick?' on':'')+'" data-c="'+k+'" title="'+k+'" style="background:'+PALETTE[k]+'"></span>'}).join("")+'</div></div>'+
      '<div class="err" id="czErr"></div><div class="row-end"><button class="btn" id="cc">Hủy</button><button class="btn pri" id="cs">Lưu</button></div></div></div>';
    $$("[data-avt]").forEach(function(b){b.onclick=function(){tab=b.getAttribute("data-avt");if(tab==="letter")pending={t:"letter"};keep();draw()}});
    $$("[data-emo]").forEach(function(b){b.onclick=function(){pending={t:"emo",v:b.getAttribute("data-emo")};keep();draw()}});
    $$("#csw .sw").forEach(function(sw){sw.onclick=function(){pick=sw.getAttribute("data-c");keep();draw()}});
    if($("#czFile"))$("#czFile").onchange=function(){var f=this.files[0];if(!f)return;$("#czMsg").textContent="Đang xử lý…";
      prepAvatar(f).then(function(r){pending=r;keep();draw();$("#czMsg").textContent=r.note}).catch(function(e){$("#czMsg").textContent="";$("#czErr").textContent=e.message||"Không đọc được hình"})};
    $("#cc").onclick=function(){if(pending&&pending.url&&pending.url.indexOf("blob:")===0)URL.revokeObjectURL(pending.url);m.innerHTML=""};
    $("#cs").onclick=function(){var btn=this;btn.disabled=true;
      var p1=api("PATCH","/tabs/"+s.dbId,{title:$("#ct").value||s.name,tagline:$("#cg").value,font:$("#cf").value,color:pick}).then(function(o){t.title=o.title;t.tag=o.tagline;t.font=o.font;t.color=o.color});
      var p2=pending?api("PUT","/tabs/"+s.dbId+"/avatar",pending.t==="img"?{t:"img",mime:pending.mime,data:pending.data}:pending).then(function(o){s.av=o.avatar||null}):Promise.resolve();
      Promise.all([p1,p2]).then(function(){m.innerHTML="";render();toast("Đã lưu banner")}).catch(function(e){btn.disabled=false;$("#czErr").textContent=e.message})};
  }
  var vals={};function keep(){["ct","cg","cf"].forEach(function(k){var e=$("#"+k);if(e)vals[k]=e.value})}
  var _draw=draw;draw=function(){_draw();Object.keys(vals).forEach(function(k){var e=$("#"+k);if(e)e.value=vals[k]})};
  draw();
};
/* picture → {t:'img', mime, data(base64), url(preview), note} */
function fileToDataURL(f){return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(r.result)};r.onerror=function(){rej(new Error("Không đọc được hình"))};r.readAsDataURL(f)})}
function b64of(dataUrl){return dataUrl.slice(dataUrl.indexOf(",")+1)}
function kb(n){return n>=1048576?(n/1048576).toFixed(1)+"MB":Math.round(n/1024)+"KB"}
function prepAvatar(f){
  var MAX=2*1024*1024;
  if(f.type==="image/gif"){
    if(f.size<=MAX)return fileToDataURL(f).then(function(u){return {t:"img",mime:"image/gif",data:b64of(u),url:u,note:"GIF "+kb(f.size)+" · giữ nguyên"}});
    return shrinkGif(f).then(function(r){return {t:"img",mime:"image/gif",data:r.b64,url:"data:image/gif;base64,"+r.b64,note:"GIF "+kb(f.size)+" → "+kb(r.size)+", vẫn giữ chuyển động"}});
  }
  return fileToDataURL(f).then(function(u){return new Promise(function(res,rej){var im=new Image();im.onload=function(){
      var z=256,c=document.createElement("canvas"),sc=Math.max(z/im.width,z/im.height),x=c.getContext("2d");c.width=c.height=z;
      x.fillStyle="#fff";x.fillRect(0,0,z,z);x.drawImage(im,(z-im.width*sc)/2,(z-im.height*sc)/2,im.width*sc,im.height*sc);
      var out=c.toDataURL("image/jpeg",0.86);res({t:"img",mime:"image/jpeg",data:b64of(out),url:out,note:"Đã nén "+kb(f.size)+" → "+kb(out.length*0.75)})};
    im.onerror=function(){rej(new Error("Không đọc được hình này"))};im.src=u})});
}
var _gifLib=null;
function loadGifTools(){if(window.GifTools)return Promise.resolve();if(_gifLib)return _gifLib;
  _gifLib=new Promise(function(res,rej){var s=document.createElement("script");s.src="/js/vendor/gif-tools.js?v=1";s.onload=res;s.onerror=function(){_gifLib=null;rej(new Error("Không tải được công cụ GIF"))};document.head.appendChild(s)});return _gifLib}
/* animated GIF bigger than 2MB → smaller size and fewer frames until it fits */
function shrinkGif(f){
  return loadGifTools().then(function(){return f.arrayBuffer()}).then(function(buf){
    var G=window.GifTools,gif=G.parseGIF(buf),frames=G.decompressFrames(gif,true),W=gif.lsd.width,H=gif.lsd.height;
    if(!frames.length)throw new Error("GIF không có hình");
    var full=document.createElement("canvas");full.width=W;full.height=H;var fx=full.getContext("2d");
    var patch=document.createElement("canvas"),px=patch.getContext("2d"),snaps=[];
    frames.forEach(function(fr){var prevImg=fr.disposalType===3?fx.getImageData(0,0,W,H):null;
      patch.width=fr.dims.width;patch.height=fr.dims.height;var id=px.createImageData(fr.dims.width,fr.dims.height);id.data.set(fr.patch);px.putImageData(id,0,0);
      fx.drawImage(patch,fr.dims.left,fr.dims.top);
      var c=document.createElement("canvas");c.width=W;c.height=H;c.getContext("2d").drawImage(full,0,0);snaps.push({c:c,delay:fr.delay||100});
      if(fr.disposalType===2)fx.clearRect(fr.dims.left,fr.dims.top,fr.dims.width,fr.dims.height);else if(prevImg)fx.putImageData(prevImg,0,0)});
    var tries=[[256,1],[200,1],[160,2],[128,2],[112,3],[96,4]];
    for(var i=0;i<tries.length;i++){var sz=tries[i][0],step=tries[i][1],sc=Math.min(1,sz/Math.max(W,H)),w=Math.max(1,Math.round(W*sc)),h=Math.max(1,Math.round(H*sc));
      var enc=G.GIFEncoder(),cv=document.createElement("canvas");cv.width=w;cv.height=h;var cx=cv.getContext("2d",{willReadFrequently:true});
      for(var k=0;k<snaps.length;k+=step){var d=0;for(var j=k;j<Math.min(k+step,snaps.length);j++)d+=snaps[j].delay;
        cx.clearRect(0,0,w,h);cx.drawImage(snaps[k].c,0,0,w,h);var rgba=cx.getImageData(0,0,w,h).data,pal=G.quantize(rgba,256,{format:"rgba4444",oneBitAlpha:true}),idx=G.applyPalette(rgba,pal,"rgba4444");
        var ti=pal.findIndex(function(p){return p[3]===0});enc.writeFrame(idx,w,h,{palette:pal,delay:d,transparent:ti>=0,transparentIndex:ti>=0?ti:0})}
      enc.finish();var bytes=enc.bytes();
      if(bytes.length<=2*1024*1024){var bin="";for(var q=0;q<bytes.length;q+=32768)bin+=String.fromCharCode.apply(null,bytes.subarray(q,q+32768));return {b64:btoa(bin),size:bytes.length}}}
    throw new Error("GIF quá dài, thu nhỏ vẫn hơn 2MB. Chọn GIF ngắn hơn.");
  });
}

/* ================= phone: bottom bar shows my picture ================= */
var _renderPhoneNav17=renderPhoneNav;
renderPhoneNav=function(){_renderPhoneNav17();var mt=myTabObj();if(!mt)return;var b=$('[data-pb="'+mt.id+'"]');if(b)b.insertAdjacentHTML("afterbegin",avatarHtml(mt,18))};

/* ================= phone staff tab: one small line of totals ================= */
var _phoneTab17=phoneTab;
phoneTab=function(id){
  var h=_phoneTab17(id),t=sById(id),a=h.indexOf('<div class="tab-head"'),b=h.indexOf('</div>',a);if(a<0)return h;
  var cnt=0,tot=0,tip=0,wait=0,wn=0;(S.rows[id]||[]).forEach(function(r){if(r.deleted||isBlank(r))return;if(r.name&&r.status!=="Refund")cnt++;tot+=amt(r);tip+=r.tip||0;if(bucket(r)==="wt"){wait+=r.amt;wn++}});
  var head='<div class="ptabhead" style="'+themeVars(t.theme)+'">'+avatarHtml(t,46)+'<div class="pht"><div class="nmrow"><b class="nm" style="font-family:\''+t.theme.font+'\',cursive,sans-serif">'+esc(t.theme.title||t.name)+'</b>'+'<button class="lnk2" id="pcust">Sửa</button>'+'</div>'+quoteHtml("tab")+'</div></div>'+
    '<div class="pstat"><div><small>Clients</small><b>'+cnt+'</b></div><div><small>Income</small><b>'+money(tot)+'</b></div><div><small>Tips</small><b>'+money(tip)+'</b></div><div><small>Chờ Online</small><b class="w">'+money(wait)+'</b></div></div>';
  return h.slice(0,a)+head+h.slice(b+6);
};
var _bindPhoneTab17=bindPhoneTab;
bindPhoneTab=function(id){_bindPhoneTab17(id);if($("#pcust"))$("#pcust").onclick=function(){openCustomize(id)}};

/* ================= phone Appt: one day at a time, tap an empty slot to book, hold + drag to move ================= */
S.pday=null;
function pdayInit(){if(!S.pday)S.pday=todayISO();var wk=mondayISO(S.pday);if(S.weekStart!==wk)S.weekStart=wk}
function pdayList(){var t=todayISO(),start=addDays(mondayISO(t),-7),out=[];for(var i=0;i<70;i++)out.push(addDays(start,i));
  if(S.pday&&out.indexOf(S.pday)<0)out=[S.pday].concat(out);return out}
var DLBL=["CN","Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7"];
phoneAppt=function(){
  pdayInit();
  var who=S.apptSub==="Work Schedule"?(S.apptSub="Office"):S.apptSub,d=S.pday,td=todayISO(),slots=slotsFor(who),ci=colInfo(who,d),wd=new Date(d+"T12:00:00Z").getUTCDay();
  var h='<div class="pat"><div class="phtabs">'+["Office","Daniel","Peter"].map(function(n){return '<button class="'+(who===n?'on':'')+'" data-sub="'+n+'">'+n+'</button>'}).join("")+'</div><button class="btn pri" id="apAdd">+ Appt</button></div>';
  h+='<div class="dchips" id="dchips">'+pdayList().map(function(x){var w=new Date(x+"T12:00:00Z").getUTCDay(),closed=!S.hours[w];
    return '<button class="dc'+(x===d?' on':'')+(closed?' cl':'')+(x===td?' td':'')+'" data-d="'+x+'"><b>'+DLBL[w]+'</b><small>'+md(x)+'</small></button>'}).join("")+'</div>';
  if(!S.bkWeeks[S.weekStart])h+='<div class="muted small" style="padding:2px 2px 6px">đang tải…</div>';
  if(ci)return h+'<div class="dayoff">'+esc(ci.label)+'</div>';
  if(!S.hours[wd])h+='<div class="muted small" style="padding:0 2px 6px">Ngày này office đóng cửa (vẫn đặt được).</div>';
  var cov=coverMap(who,d);
  h+='<div class="slots">';
  slots.forEach(function(sl,si){var key=who+"|"+d+"|"+hm(sl),bk=S.bookings[key];
    if(!bk&&cov[si])return;
    var span=bk?Math.max(1,Math.min(bk.span||1,slots.length-si)):1,cl=isClosed(d,sl,who);
    h+='<div class="sl'+(cl?' x':'')+'" data-k="'+key+'"><div class="tm">'+hmAP(hm(sl)).replace(":00 "," ").replace(" AM","a").replace(" PM","p")+'</div>'+
      (bk?'<div class="pbk" data-bk="'+key+'"'+(span>1?' style="min-height:'+(span*44-8)+'px"':'')+'><b>'+(bk.s?'('+esc(bk.s)+') ':'')+esc(bk.n)+' ('+bk.f+')'+(bk.note?' *':'')+'</b><small>'+esc(bk.p)+(span>1?' · '+hm(sl)+' – '+hm(sl+span*S.cal[who].step):'')+(bk.note?' · '+esc(bk.note):'')+'</small></div>':'<button class="fr" data-new="'+key+'" aria-label="Đặt hẹn '+hm(sl)+'"></button>')+'</div>'});
  return h+'</div>';
};
bindPhoneAppt=function(){
  $$("[data-sub]").forEach(function(b){b.onclick=function(){S.apptSub=b.getAttribute("data-sub");render()}});
  var dc=$("#dchips");if(dc){var on=dc.querySelector(".dc.on");if(S._dcx!=null&&S._dcKeep){dc.scrollLeft=S._dcx}else if(on)dc.scrollLeft=on.offsetLeft-dc.offsetLeft-60;S._dcKeep=false;
    dc.onscroll=function(){S._dcx=dc.scrollLeft}}
  $$("[data-d]").forEach(function(b){b.onclick=function(){if(Date.now()-(S._drag||0)<400)return;S.pday=b.getAttribute("data-d");S._dcKeep=true;render();ensureWeeks()}});
  $$("[data-new]").forEach(function(b){b.onclick=function(){if(Date.now()-(S._drag||0)<400)return;var k=b.getAttribute("data-new");openBooking(k,k.split("|"))}});
  $$(".pbk").forEach(function(b){b.onclick=function(){if(Date.now()-(S._drag||0)<400)return;var k=b.getAttribute("data-bk");openBooking(k,k.split("|"))}});
  $("#apAdd").onclick=function(){var who=S.apptSub,d=S.pday,t=todayISO(),now=new Date().toLocaleTimeString("en-GB",{timeZone:"America/Los_Angeles",hour:"2-digit",minute:"2-digit"});
    if(colInfo(who,d)){toast("Ngày này đang nghỉ",true);return}
    var sl=slotsFor(who),cov=coverMap(who,d);for(var j=0;j<sl.length;j++){var hh=hm(sl[j]);if(d===t&&hh<now)continue;if(!cov[j]&&!isClosed(d,sl[j],who)){var k=who+"|"+d+"|"+hh;openBooking(k,k.split("|"));return}}
    toast("Ngày này hết chỗ trống",true)};
};
/* hold a booking ~0.45 s, then drag it to another time (or onto a day above) */
(function(){
  var D=null;
  function target(x,y){var el=document.elementFromPoint(x,y);return el&&el.closest(".sl[data-k],.dc[data-d]")}
  function clear(){$$(".drop").forEach(function(e){e.classList.remove("drop")})}
  function start(){D.on=true;S._dk=D.key;D.el.classList.add("lift");var r=D.el.getBoundingClientRect(),g=D.el.cloneNode(true);g.className="pbk ghost";g.style.width=r.width+"px";document.body.appendChild(g);D.g=g;D.ox=D.x-r.left;D.oy=D.y-r.top;move(D.x,D.y);try{navigator.vibrate&&navigator.vibrate(12)}catch(e){}}
  function move(x,y){D.g.style.left=(x-D.ox)+"px";D.g.style.top=(y-D.oy)+"px";clear();var t=target(x,y);if(t)t.classList.add("drop");
    var dc=$("#dchips");if(dc&&t&&t.classList.contains("dc")){var r=dc.getBoundingClientRect();if(x<r.left+30)dc.scrollLeft-=12;else if(x>r.right-30)dc.scrollLeft+=12}}
  function end(cancel,x,y){if(!D)return;clearTimeout(D.timer);var was=D.on,key=D.key,t=was&&!cancel?target(x,y):null;if(D.g)D.g.remove();if(D.el)D.el.classList.remove("lift");clear();D=null;S._dk=null;if(!was)return;S._drag=Date.now();
    if(!t)return;var o=key.split("|"),nk;
    if(t.classList.contains("dc"))nk=o[0]+"|"+t.getAttribute("data-d")+"|"+o[2];else nk=t.getAttribute("data-k");
    if(nk===key)return;var nd=nk.split("|")[1],wk=mondayISO(nd);
    (S.bkWeeks[wk]?Promise.resolve():refreshWeek(wk)).then(function(){if(nd!==S.pday){S.pday=nd;S._dcKeep=true}moveBooking(key,nk)})}
  document.addEventListener("touchstart",function(e){var b=e.target.closest&&e.target.closest(".pbk[data-bk]");if(!b||e.touches.length>1)return;var t=e.touches[0];
    D={el:b,key:b.getAttribute("data-bk"),x:t.clientX,y:t.clientY,on:false};D.timer=setTimeout(function(){if(D&&!D.on)start()},450)},{passive:true});
  document.addEventListener("touchmove",function(e){if(!D)return;var t=e.touches[0];
    if(!D.on){if(Math.abs(t.clientX-D.x)>8||Math.abs(t.clientY-D.y)>8){clearTimeout(D.timer);D=null}return}
    if(e.cancelable)e.preventDefault();D.x=t.clientX;D.y=t.clientY;move(D.x,D.y)},{passive:false});
  document.addEventListener("touchend",function(e){if(!D)return;if(D.on&&e.cancelable)e.preventDefault();end(false,D.x,D.y)});
  document.addEventListener("touchcancel",function(){end(true)});
  document.addEventListener("contextmenu",function(e){if(e.target.closest&&e.target.closest(".pbk"))e.preventDefault()});
})();

/* start() is called at the end of v19.js */
