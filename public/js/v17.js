/* v17: Top producers, Chat (Pub Club), text messages to customers, phone layout.
   Uses globals from app.js / acct.js. start() is called at the very end of this file. */
var BRAND_SVG='<svg class="logo" viewBox="0 0 32 32" width="22" height="22" aria-hidden="true"><path d="M16 3.2 28 10.6V27a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 27V10.6Z" fill="none" stroke="#1b6a9c" stroke-width="2.6" stroke-linejoin="round"/><path d="M11.6 28.8V19.4a4.4 4.4 0 0 1 8.8 0v9.4" fill="none" stroke="#1b6a9c" stroke-width="2.6"/></svg>';
var PHONE_MQ=window.matchMedia("(max-width: 760px)");
function isPhone(){return PHONE_MQ.matches}
(function(){var was=isPhone();var on=function(){if(isPhone()===was)return;was=isPhone();if(S.me&&$("#page")){$("#modalHost")&&($("#modalHost").innerHTML="");buildShell();render()}};
  if(PHONE_MQ.addEventListener)PHONE_MQ.addEventListener("change",on);else if(PHONE_MQ.addListener)PHONE_MQ.addListener(on)})();
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){}}
function shortName(n){var w=String(n||"").trim().split(/\s+/).filter(Boolean);if(!w.length)return "";return w.length===1?w[0]:w[0]+" "+w[w.length-1].charAt(0)+"."}

/* ================= in-page dialog (confirm() does not work well on phones) ================= */
function ask(o){return new Promise(function(res){
  var host=document.createElement("div");host.className="modal dlgm";
  host.innerHTML='<div class="box dlg"><h3>'+o.title+'</h3>'+(o.html||"")+'<div class="row-end" style="margin-top:12px"><button class="btn" data-no>'+(o.no||"Không")+'</button><button class="btn '+(o.danger?'dangerb':'pri')+'" data-yes>'+(o.yes||"OK")+'</button></div></div>';
  document.body.appendChild(host);
  var done=function(v){host.remove();res(v)};
  host.querySelector("[data-no]").onclick=function(){done(false)};
  host.querySelector("[data-yes]").onclick=function(){done(host)};
  host.onclick=function(e){if(e.target===host)done(false)};
})}

/* ================= Top producers ================= */
function tpData(){
  var today=todayISO(),y=S.fy,s0=y+"-02-01",s1=y+"-04-15",mode,from,to;
  if(today>=s0&&today<=s1){mode="week";from=mondayISO(today);to=addDays(from,6)}else{mode="season";from=s0;to=s1}
  var per=S.staff.map(function(t){var v={name:shortOf(t),inc:0,n:0,tip:0,tab:t.id};
    live(t.id).forEach(function(r){if(!r.date||r.date<from||r.date>to)return;v.inc+=amt(r);if(r.status!=="Refund"&&r.name)v.n++;v.tip+=r.tip||0});return v});
  var cat=function(key,title,color,fmt){var rows=per.filter(function(v){return v[key]>0}).sort(function(a,b){return b[key]-a[key]}).slice(0,3);
    return {title:title,color:color,rows:rows.map(function(v){return {name:v.name,tab:v.tab,v:fmt(v[key]),rk:1+per.filter(function(x){return x[key]>v[key]}).length}})}};
  var cats=[cat("inc","Vua doanh thu","#c99a06",money),cat("n","Vua tốc độ","#1b6a9c",String),cat("tip","FS Idol","#c2185b",money)];
  return {mode:mode,from:from,to:to,cats:cats,empty:cats.every(function(c){return !c.rows.length})};
}
function crownSvg(c,sz){return '<svg viewBox="0 0 24 24" width="'+sz+'" height="'+sz+'" aria-hidden="true"><path d="M3 7.5l4.6 4.2L12 4.5l4.4 7.2L21 7.5 19.2 17H4.8z" fill="'+c+'"/><rect x="4.8" y="17.6" width="14.4" height="2.6" rx="1.1" fill="'+c+'" opacity=".8"/></svg>'}
function tpLabel(D){return D.mode==="week"?'Tuần này '+md(D.from)+' – '+md(D.to):'Cả mùa '+mdy(D.from).slice(0,5)+' – '+mdy(D.to)}
function topProducersCard(){
  var D=tpData();if(D.empty)return "";var me=myTab();
  return '<div class="card tp"><div class="tp-head"><h2>Top producers</h2><span class="muted small">'+tpLabel(D)+'</span></div><div class="tp-grid">'+D.cats.map(function(c){
    return '<div class="tp-cat"><div class="tp-h">'+crownSvg(c.color,18)+c.title+'</div><ol>'+(c.rows.length?c.rows.map(function(r){return '<li class="'+(r.tab===me?'me':'')+'"><span class="rk r'+r.rk+'">'+r.rk+'</span><span class="nm">'+esc(r.name)+'</span><b>'+r.v+'</b></li>'}).join(""):'<li class="muted">—</li>')+'</ol></div>'}).join("")+'</div></div>';
}
function bindTopProducers(){}

/* ================= Chat (Pub Club Chat inside Tax) ================= */
var CHAT_URL=lsGet("taxChatUrl")||"https://pb.fsma.team/chat-tax.html";
var CHAT_ORIGIN=(function(){try{return new URL(CHAT_URL).origin}catch(e){return ""}})();
S.chatUnread=0;S.chatOpen=false;
function chatSignOut(){
  lsSet("taxChatReset","1");
  var f=$("#chatFrame");if(f){try{f.contentWindow.postMessage({pbtax:1,t:"logout"},CHAT_ORIGIN)}catch(e){}setTimeout(function(){var h=$("#chatHost");if(h)h.innerHTML=""},300)}
  S.chatOpen=false;setUnread(0);
}
function setUnread(n){S.chatUnread=n;$$(".cbadge").forEach(function(b){b.textContent=n||"";b.hidden=!n})}
window.addEventListener("message",function(e){if(e.origin!==CHAT_ORIGIN||!e.data||!e.data.pbtax)return;
  if(e.data.t==="unread")setUnread(+e.data.n||0);
  if(e.data.t==="ready")lsSet("taxChatReset",null)});
function openChat(){
  var host=$("#chatHost");if(!host)return;
  if(!$("#chatFrame")){
    var reset=lsGet("taxChatReset")==="1";
    host.innerHTML='<div class="cdock" id="cdock"><div class="cdock-h"><b>Chat</b><span class="muted small">tài khoản Pub Club</span><span style="flex:1"></span><button class="btn sm" id="cdMin" title="Thu nhỏ">–</button><button class="btn sm" id="cdX" title="Đóng">×</button></div>'+
      '<iframe id="chatFrame" title="Chat" src="'+esc(CHAT_URL+(reset?"?reset=1":""))+'" allow="clipboard-write"></iframe></div>';
    $("#cdMin").onclick=closeChat;$("#cdX").onclick=closeChat;
  }
  $("#cdock").hidden=false;S.chatOpen=true;document.body.classList.add("chat-open");
  if(isPhone())renderPhoneNav();
}
function closeChat(){var d=$("#cdock");if(d)d.hidden=true;S.chatOpen=false;document.body.classList.remove("chat-open");if(isPhone())renderPhoneNav()}

/* ================= Text messages (Settings > Customer messages) ================= */
var SMS_EV=[["created","Booking created","Hẹn mới · gửi khi lưu hẹn mới"],["reminder","Booking reminder","Nhắc hẹn · gửi trước giờ hẹn"],["updated","Booking updated","Đổi hẹn · gửi khi đổi ngày / giờ"],["cancelled","Booking cancelled","Hủy hẹn · gửi khi xóa hẹn"]];
var SMS_DEF={created:"Your booking at {{ business }} is scheduled for {{ date }} at {{ hour }}. Manage it at {{ link }}",updated:"Your booking at {{ business }} was updated: {{ link }}",cancelled:"Your {{ business }} booking was cancelled. Hope to see you another day.",reminder:"Just a reminder that your {{ business }} booking is on {{ date }} at {{ hour }}. Manage it at {{ link }}"};
var SMS_VARS=["business","date","hour","link","name","preparer"];
function smsConf(){var v=S.sms||{},o={on:!!v.on,from:v.from||"02-01",to:v.to||"04-15",quiet:v.quiet||["08:00","21:00"],business:v.business||"First Source",phone:v.phone||"714-640-6654",email:v.email||"contact@fsma.team",address:v.address||"9741 Bolsa Avenue Suite 217, Westminster CA 92683",bring:v.bring==null?"Photo ID, Social Security cards, W-2 / 1099 forms, last year's tax return.":v.bring};
  SMS_EV.forEach(function(e){var x=v[e[0]]||{};o[e[0]]={on:x.on!==false,text:x.text||SMS_DEF[e[0]]};if(e[0]==="reminder")o.reminder.before=x.before||[1440,60]});return o}
function smsOn(){return !!(S.sms&&S.sms.on)}
function smsStatusLine(){var c=smsConf();return c.on?'Text cho khách: BẬT ('+c.from.replace("-","/")+' – '+c.to.replace("-","/")+')':'Text cho khách: tắt · Admin bật ở Settings &gt; Customer messages'}
function smsToast(r,w){w=w||"Đã lưu";if(r==="sent")toast(w+" · đã text cho khách");else if(r==="demo")toast(w+" · text (demo, chưa nối Twilio)");else if(r==="queued")toast(w+" · text sẽ gửi lúc 8:00 sáng");else if(r==="failed")toast(w+" · gửi text bị lỗi (xem Settings > Customer messages)",true);else if(r==="skipped")toast(w+" · không text được: số điện thoại không đúng",true);else if(w!=="Đã lưu")toast(w)}
var SMS_KIND={created:"Hẹn mới",updated:"Đổi hẹn",cancelled:"Hủy hẹn",reminder:"Nhắc hẹn",test:"Gửi thử"};
var SMS_ST={sent:"✓",demo:"✓ demo",queued:"chờ",sending:"đang gửi",failed:"✗ lỗi",skipped:"✗ bỏ qua"};
function loadSmsHist(tk){api("GET","/sms/log?token="+encodeURIComponent(tk)).then(function(l){var h=$("#bsmsh");if(!h)return;
  h.innerHTML=l.length?l.map(function(x){return '<span class="'+(x.status==="failed"||x.status==="skipped"?'red':'')+'">'+(SMS_ST[x.status]||x.status)+' '+SMS_KIND[x.kind]+' '+fmtTs(x.at)+(x.error?' ('+esc(x.error)+')':'')+'</span>'}).join(" · "):'<span class="muted">Chưa gửi text nào cho hẹn này</span>'}).catch(function(){})}
function askDeleteBooking(k,p,bk,after){
  var c=smsConf(),txt=c.cancelled.text.replace(/\{\{\s*business\s*\}\}/g,c.business);
  var can=smsOn()&&c.cancelled.on&&bk.sms!==false&&bk.tk;
  ask({title:"Xóa hẹn này?",danger:true,yes:"Xóa hẹn",html:'<p><b>'+esc(bk.n)+'</b> · '+p[0]+' · '+mdy(p[1])+' · '+hmAP(p[2])+(bk.s?' · '+esc(bk.s):'')+'</p>'+
    (can?'<label class="chk"><input type="checkbox" id="dsms" checked> Text cho khách</label><div class="tpl">'+esc(txt)+'</div>':'')}).then(function(box){
    if(!box)return;var send=box.querySelector("#dsms")?box.querySelector("#dsms").checked:false;
    if(after)after();delete S.bookings[k];renderKeep();
    api("DELETE","/bookings?cal="+p[0]+"&day="+p[1]+"&slot="+p[2]+(send?"":"&sms=0")).then(function(r){smsToast(r&&r.smsRes,"Đã xóa hẹn");reloadWeek()}).catch(function(er){fail(er);reloadWeek()})});
}
function hmAP(t){var a=t.split(":"),h=+a[0];return ((h+11)%12+1)+":"+a[1]+(h<12?" AM":" PM")}
function fmtBefore(m){return m%1440===0?(m/1440)+" day":m%60===0?(m/60)+" hours":m+" min"}
function smsSegs(t){var uni=/[^\x00-\x7F]/.test(t),n=t.length,per=uni?70:160;return {n:n,seg:n<=per?1:Math.ceil(n/(uni?67:153)),uni:uni}}
function smsPreview(t,c){var day=addDays(todayISO(),1);return t.replace(/\{\{\s*(\w+)\s*\}\}/g,function(m,k){return {business:c.business,date:fmtDayEN(day),hour:"10:00 AM",link:"tax.fsma.team/b/k3P9xQw2Ab",name:"Minh T.",preparer:"Daniel"}[k]||m})}
function fmtDayEN(d){var x=new Date(d+"T12:00:00Z");return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][x.getUTCDay()]+", "+["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][x.getUTCMonth()]+" "+x.getUTCDate()}
S.smsDraft=null;S.smsLog=null;
function smsSettings(){
  var c=S.smsDraft||(S.smsDraft=JSON.parse(JSON.stringify(smsConf())));
  if(!S.smsLog){S.smsLog={loading:true};api("GET","/sms/log").then(function(d){S.smsLog=d;if(S.page==="settings"&&S.setSub==="sms")render()}).catch(function(e){S.smsLog={rows:[],err:e.message}})}
  var L=S.smsLog||{};
  var h='<div class="smsset">';
  h+='<div class="sset"><div class="k"><b>Trạng thái</b><span>Bật / tắt toàn bộ</span></div><div><label class="chk"><input type="checkbox" data-sm="on"'+(c.on?' checked':'')+'> Gửi text cho khách</label>'+
    '<div class="srow">Chỉ gửi từ <input type="text" data-sm="from" value="'+esc(c.from.replace("-","/"))+'" maxlength="5" style="width:58px"> đến <input type="text" data-sm="to" value="'+esc(c.to.replace("-","/"))+'" maxlength="5" style="width:58px"> <span class="muted">(mm/dd mỗi năm)</span></div>'+
    '<div class="srow">Không gửi từ <input type="time" data-sm="q1" value="'+c.quiet[1]+'"> tới <input type="time" data-sm="q0" value="'+c.quiet[0]+'"> <span class="muted">(tin lúc đó chờ tới sáng)</span></div>'+
    '<div class="srow muted">'+(L.loading?'Đang tải…':(L.demo?'<span class="pill r">Chưa nối Twilio: tin chỉ ghi "demo", không gửi thật</span>':'<span class="pill g">Twilio đã nối</span>')+(L.counts?' · Tháng này '+L.counts.month+' tin · tổng '+L.counts.total+' tin':''))+'</div></div></div>';
  h+='<div class="sset"><div class="k"><b>Trang khách</b><span>Link {{ link }} mở trang này</span></div><div class="sgrid">'+
    [["business","Tên"],["phone","Phone"],["email","Email"],["address","Địa chỉ"],["bring","Mang theo"]].map(function(x){return '<label>'+x[1]+'<input type="text" data-sm="'+x[0]+'" value="'+esc(c[x[0]])+'"></label>'}).join("")+'<span class="muted small">Giờ mở cửa lấy từ Work Schedule (Mon–Fri / Sat / Sun của period có ngày hẹn).</span></div></div>';
  SMS_EV.forEach(function(e){var k=e[0],x=c[k],sg=smsSegs(x.text);
    h+='<div class="sset"><div class="k"><b>'+e[1]+'</b><span>'+e[2]+'</span></div><div>'+
      '<label class="chk"><input type="checkbox" data-sm="'+k+'.on"'+(x.on?' checked':'')+'> Activate SMS</label>'+
      (k==="reminder"?'<div class="srow">Gửi trước: '+x.before.map(function(b,i){var u=b%1440===0?1440:60;return '<span class="bef"><input type="number" min="1" data-bv="'+i+'" value="'+(b/u)+'" style="width:52px"><select data-bu="'+i+'"><option value="60"'+(u===60?' selected':'')+'>Hours</option><option value="1440"'+(u===1440?' selected':'')+'>Day</option></select><button class="btn sm" data-bx2="'+i+'" title="Bỏ">×</button></span>'}).join("")+(x.before.length<4?'<button class="btn sm" id="befAdd">+ Add reminder</button>':'')+'</div>':'')+
      '<textarea data-sm="'+k+'.text" rows="3">'+esc(x.text)+'</textarea>'+
      '<div class="srow small"><span class="vars">'+SMS_VARS.map(function(v){return '<button class="btn sm" data-ins="'+k+'" data-v="'+v+'">{{ '+v+' }}</button>'}).join("")+'</span><button class="btn sm" data-rst="'+k+'">↺ Reset</button><span class="muted" data-cnt="'+k+'">'+sg.n+' ký tự · '+sg.seg+' tin'+(sg.uni?' · có dấu: tốn hơn':'')+'</span></div>'+
      '<div class="pv" data-pv="'+k+'">'+esc(smsPreview(x.text,c))+'</div></div></div>'});
  h+='<div class="srow"><button class="btn pri" id="smsSave">Lưu cài đặt tin nhắn</button><span class="muted small" id="smsDirty"></span></div>';
  h+='<div class="sset"><div class="k"><b>Gửi thử</b><span>Tới số của bạn</span></div><div class="srow"><input type="text" id="stPh" placeholder="714-000-0000" style="width:140px"><select id="stK">'+SMS_EV.map(function(e){return '<option value="'+e[0]+'">'+e[1]+'</option>'}).join("")+'</select><button class="btn" id="stGo">Gửi thử</button><span id="stRes" class="small"></span></div></div>';
  h+='<h3 style="margin:18px 0 6px">Tin đã gửi</h3>'+(L.rows&&L.rows.length?'<div class="wrap"><table class="t2 acct"><tr><th>Lúc</th><th>Loại</th><th>Khách</th><th>Số</th><th>Trạng thái</th><th>Ai</th><th>Nội dung</th></tr>'+L.rows.map(function(r){return '<tr><td>'+fmtTs(r.at)+'</td><td>'+SMS_KIND[r.kind]+'</td><td>'+esc(r.name)+'</td><td>'+esc(r.to)+'</td><td class="'+(r.status==="failed"||r.status==="skipped"?'red':'')+'">'+(SMS_ST[r.status]||r.status)+(r.error?' <span class="small">'+esc(r.error)+'</span>':'')+'</td><td>'+esc(r.by||"")+'</td><td class="small" style="white-space:normal;min-width:260px">'+esc(r.body)+'</td></tr>'}).join("")+'</table></div>':'<div class="muted">'+(L.loading?'Đang tải…':'Chưa có tin nào.')+'</div>');
  return h+'</div>';
}
function bindSmsSettings(){
  var c=S.smsDraft,box=$(".smsset");if(!box||!c)return;
  var dirty=function(){var d=$("#smsDirty");if(d)d.textContent="Chưa lưu"};
  var md2=function(v){var m=/^(\d{1,2})\/(\d{1,2})$/.exec(v.trim());return m?("0"+m[1]).slice(-2)+"-"+("0"+m[2]).slice(-2):null};
  var upd=function(k){var x=c[k],sg=smsSegs(x.text),n=$('[data-cnt="'+k+'"]');if(n)n.textContent=sg.n+' ký tự · '+sg.seg+' tin'+(sg.uni?' · có dấu: tốn hơn':'');var p=$('[data-pv="'+k+'"]');if(p)p.textContent=smsPreview(x.text,c)};
  box.oninput=function(e){var el=e.target,f=el.getAttribute("data-sm");if(!f)return;var a=f.split(".");
    if(a[1]==="text"){c[a[0]].text=el.value;upd(a[0])}dirty()};
  box.onchange=function(e){var el=e.target,f=el.getAttribute("data-sm");
    if(el.hasAttribute("data-bv")||el.hasAttribute("data-bu")){var i=+(el.getAttribute("data-bv")||el.getAttribute("data-bu")),v=+$('[data-bv="'+i+'"]').value||1,u=+$('[data-bu="'+i+'"]').value;c.reminder.before[i]=v*u;dirty();return}
    if(!f)return;var a=f.split(".");
    if(a[1]==="on"){c[a[0]].on=el.checked}else if(f==="on")c.on=el.checked;
    else if(f==="from"||f==="to"){var v=md2(el.value);if(!v){toast("Gõ mm/dd, ví dụ 02/01",true);el.value=c[f].replace("-","/");return}c[f]=v}
    else if(f==="q0")c.quiet[0]=el.value;else if(f==="q1")c.quiet[1]=el.value;
    else if(a.length===1)c[f]=el.value;
    SMS_EV.forEach(function(x){upd(x[0])});dirty()};
  box.onclick=function(e){var b=e.target.closest("button");if(!b)return;
    if(b.hasAttribute("data-ins")){var k=b.getAttribute("data-ins"),ta=$('[data-sm="'+k+'.text"]'),v="{{ "+b.getAttribute("data-v")+" }}",s0=ta.selectionStart||ta.value.length;ta.value=ta.value.slice(0,s0)+v+ta.value.slice(ta.selectionEnd||s0);c[k].text=ta.value;ta.focus();ta.setSelectionRange(s0+v.length,s0+v.length);upd(k);dirty()}
    if(b.hasAttribute("data-rst")){var k2=b.getAttribute("data-rst");c[k2].text=SMS_DEF[k2];$('[data-sm="'+k2+'.text"]').value=SMS_DEF[k2];upd(k2);dirty()}
    if(b.hasAttribute("data-bx2")){c.reminder.before.splice(+b.getAttribute("data-bx2"),1);dirty();render()}
    if(b.id==="befAdd"){c.reminder.before.push(120);dirty();render()}
    if(b.id==="smsSave"){api("PUT","/settings/sms",{value:c}).then(function(d){S.sms=d.value;S.smsDraft=null;toast("Đã lưu cài đặt tin nhắn");render()}).catch(fail)}
    if(b.id==="stGo"){var r=$("#stRes");r.textContent="Đang gửi…";api("POST","/sms/test",{phone:$("#stPh").value,kind:$("#stK").value}).then(function(d){r.textContent=d.status==="sent"?"✓ Đã gửi":d.status==="demo"?"✓ demo (chưa nối Twilio)":"✗ "+(d.error||d.status);S.smsLog=null;render()}).catch(function(e){r.textContent="✗ "+e.message})}};
}

/* ================= Phone layout ================= */
S.pSet=null;S.todayBk=null;
function myTabObj(){return sById(myTab())}
function buildPhoneShell(){
  $("#root").innerHTML='<div class="ptop"><div class="brand">'+BRAND_SVG+'First Source<span>'+S.season+'</span></div><span class="pwho" id="welcome"></span><button class="burger" id="burger" aria-label="Menu">☰</button></div>'+
    '<div class="page phone" id="page"></div><div class="pbar" id="pbar"></div><div id="pmenu"></div><div id="modalHost"></div><div id="chatHost"></div><span id="nav" hidden></span><span id="sheets" hidden></span>';
  $("#burger").onclick=function(){togglePMenu()};
}
function togglePMenu(force){var m=$("#pmenu");var open=force!==undefined?force:!m.innerHTML;
  $("#burger").classList.toggle("on",open);
  if(!open){m.innerHTML="";return}
  var it=[["attn","Attention",""]];
  if(isAdmin()){S.staff.forEach(function(t){if(t.id!==myTab())it.push([t.id,shortOf(t),"t"])});it.push(["reports","Reports","a"],["acct","Accounting","a"],["records","Records","a"],["settings","Settings","a"])}
  it.push(["psearch","Search",""],["__pw","Đổi mật khẩu",""],["__out","Sign out","dg"]);
  m.innerHTML='<div class="psheet"><div class="psheet-in">'+it.map(function(x){return '<button class="mi '+x[2]+(S.page===x[0]?' on':'')+'" data-pm="'+x[0]+'">'+esc(x[1])+'</button>'}).join("")+'</div></div>';
  m.firstChild.onclick=function(e){var b=e.target.closest("[data-pm]");if(!b){togglePMenu(false);return}var k=b.getAttribute("data-pm");togglePMenu(false);
    if(k==="__pw"){showChangePw(false);return}if(k==="__out"){logout();return}
    closeChat();if(k==="settings")S.pSet=null;S.page=k;render();window.scrollTo(0,0)};
}
function renderPhoneNav(){
  var mt=myTabObj(),items=[["home","Home"],["fees","Fees"],["appt","Appt"]];
  if(mt)items.push([mt.id,shortOf(mt)]);items.push(["__chat","Chat"]);
  var cur=S.chatOpen?"__chat":S.page;
  $("#pbar").innerHTML=items.map(function(x){return '<button data-pb="'+x[0]+'" class="'+(cur===x[0]?'on':'')+'"><span>'+esc(x[1])+'</span>'+(x[0]==="__chat"?'<i class="cbadge"'+(S.chatUnread?'':' hidden')+'>'+(S.chatUnread||"")+'</i>':'')+'</button>'}).join("");
  $$("[data-pb]").forEach(function(b){b.onclick=function(){var k=b.getAttribute("data-pb");togglePMenu(false);if(k==="__chat"){if(S.chatOpen)closeChat();else openChat();return}closeChat();S.page=k;render();window.scrollTo(0,0)}});
  $("#welcome").textContent=me();
}
function phoneRender(p,pg){
  pg.className="page phone";
  if(!isAdmin()&&sById(p)&&p!==myTab()){S.page=p="home"}
  if(p==="home"){pg.innerHTML=phoneHome();bindPhoneHome();return true}
  if(p==="appt"){ensureWeeks();pg.innerHTML=phoneAppt();bindPhoneAppt();return true}
  if(sById(p)){pg.innerHTML=phoneTab(p);bindPhoneTab(p);return true}
  if(p==="psearch"){pg.innerHTML='<div class="psrch"><input type="text" id="gq" placeholder="4 số cuối SSN hoặc tên khách" autocomplete="off"><button class="btn pri" id="gbtn">Search</button></div>';$("#gbtn").onclick=runSearch;$("#gq").onkeydown=function(e){if(e.key==="Enter")runSearch()};$("#gq").focus();return true}
  if(p==="settings"){
    if(!S.pSet){var subs=[["users","Users & quyền"],["tabs","Tab nhân viên"],["appt","Appointment & Blackout"],["sched","Work Schedule"],["fees","Fees"],["sms","Customer messages"],["log","Activity log"],["backup","Backup"]];
      pg.innerHTML='<div class="phd"><b>Settings</b></div><div class="fl"><span>Thông báo trên Homepage</span><div class="srow"><input type="text" id="nt" value="'+esc(S.notice)+'" style="flex:1"><button class="btn pri sm" id="nsv">Lưu</button></div></div><div class="slist">'+subs.map(function(x){return '<button data-ps="'+x[0]+'">'+x[1]+'<span>'+(x[0]==="sms"?(smsOn()?"bật":"tắt")+" ":"")+'›</span></button>'}).join("")+'</div><p class="muted small">Fees và Work Schedule sửa được trên phone nhưng bảng rộng, dễ hơn trên máy tính.</p>';
      $("#nsv").onclick=function(){api("PUT","/settings/notice",{value:$("#nt").value}).then(function(d){S.notice=d.value;toast("Đã lưu thông báo")}).catch(fail)};
      $$("[data-ps]").forEach(function(b){b.onclick=function(){S.pSet=S.setSub=b.getAttribute("data-ps");if(S.setSub==="log")loadLog();render();window.scrollTo(0,0)}});
      return true}
    S.setSub=S.pSet;
    pg.innerHTML='<div class="phd"><button class="btn sm" id="psBack">‹ Settings</button></div><div class="pset">'+pageSettings()+'</div>';
    var ps=$(".pset");[".page-head",".card",".sub-tabs"].forEach(function(q){var e=ps.querySelector(q);if(e&&e.parentNode===ps)e.remove()});
    $("#psBack").onclick=function(){S.pSet=null;render()};bindSettings();return true}
  return false;
}
/* ---- phone Home ---- */
function wsWeek(){var mon=mondayISO(todayISO()),days=[],names={},order=[];for(var i=0;i<6;i++)days.push(addDays(mon,i));
  var sun=addDays(mon,6),p7=findPeriod(sun);if(p7&&p7.sun)days.push(sun);
  days.forEach(function(d){var p=findPeriod(d);if(!p)return;p.rows.forEach(function(r){if(!(r.n in names)){names[r.n]={};order.push(r.n)}if(dayKey(d) in r.days)names[r.n][d]=1})});
  return {days:days,names:names,order:order}}
function myBookingsToday(){var t=todayISO(),me1=norm(me()),tabN=myTabObj()?norm(myTabObj().name):"",out=[];
  (S.todayBk||[]).forEach(function(b){var mine=(b.cal!=="Office"&&(norm(b.cal)===me1||norm(b.cal)===tabN))||(b.cal==="Office"&&b.s&&(norm(b.s)===me1||norm(b.s)===tabN));if(mine)out.push(b)});
  return out.sort(function(a,b){return a.slot<b.slot?-1:1})}
function phoneHome(){
  var D=tpData(),me1=myTab(),h='';
  if(!D.empty)h+='<div class="psec"><div class="pl-top"><b>Top producers</b><span>'+tpLabel(D)+'</span></div><div class="pl">'+D.cats.map(function(c){return '<div class="pl-row"><span class="pl-h">'+crownSvg(c.color,14)+c.title+'</span>'+(c.rows.length?c.rows.map(function(r){return '<span class="pl-p'+(r.tab===me1?' me':'')+'"><span class="rk r'+r.rk+'">'+r.rk+'</span><span class="nm">'+esc(r.name)+'</span><b>'+r.v+'</b></span>'}).join(""):'<span class="muted small">—</span>')+'</div>'}).join("")+'</div></div>';
  var W=wsWeek(),dn=["T2","T3","T4","T5","T6","T7","CN"],td=todayISO();
  if(W.order.length)h+='<div class="psec"><div class="pl-top"><b>Work Schedule</b><span>Tuần này</span></div><table class="ws"><tr><th></th>'+W.days.map(function(d,i){return '<th class="'+(d===td?'td':'')+'">'+dn[i]+'</th>'}).join("")+'</tr>'+W.order.map(function(n){return '<tr><td>'+esc(n)+'</td>'+W.days.map(function(d){return '<td class="'+(d===td?'td':'')+'">'+(W.names[n][d]?'<span class="dot"></span>':'')+'</td>'}).join("")+'</tr>'}).join("")+'</table></div>';
  var bk=myBookingsToday();
  h+='<div class="psec"><div class="pl-top"><b>Hẹn hôm nay của bạn</b><span>'+mdy(td).slice(0,5)+(S.todayBk?' · '+bk.length:'')+'</span></div>'+(S.todayBk?(bk.length?bk.map(function(b){return '<div class="ap"><span>'+hmAP(b.slot).replace(" ","&nbsp;")+'</span><span>'+esc(b.n)+(b.cal==="Office"?'':' <span class="muted">· '+esc(b.cal)+'</span>')+'</span><span class="muted">'+b.f+' file'+(b.f>1?'s':'')+'</span></div>'}).join(""):'<div class="muted small">Không có hẹn nào.</div>'):'<div class="muted small">Đang tải…</div>')+'</div>';
  if(isAdmin()){var tc=0,tt=0,wait=0,a=attn();allRows().forEach(function(x){if(x.r.status!=="Refund"&&x.r.name)tc++;tt+=amt(x.r);if(bucket(x.r)==="wt")wait+=x.r.amt});
    h+='<div class="psec"><div class="pl-top"><b>Summary</b><span>Admin</span></div><div class="pstats"><div><small>Clients</small><b>'+tc+'</b></div><div><small>Income</small><b>'+money(tt)+'</b></div><div><small>Still waiting</small><b>'+money(wait)+'</b></div><div id="goAttn"><small>Attention</small><b>'+a.total+'</b></div></div>'+
      '<table class="sumt"><tr><th>Tab</th><th>Clients</th><th>Income</th><th>Tips</th></tr>'+S.staff.map(function(s){var c=0,i=0,tp=0;live(s.id).forEach(function(r){if(r.status!=="Refund"&&r.name)c++;i+=amt(r);tp+=r.tip||0});return '<tr><td>'+esc(shortOf(s))+'</td><td>'+c+'</td><td>'+money(i)+'</td><td>'+money(tp)+'</td></tr>'}).join("")+'</table></div>'}
  return h;
}
function bindPhoneHome(){
  if($("#goAttn"))$("#goAttn").onclick=function(){S.page="attn";render()};
  var t=todayISO();if(!S.todayBk||S._tbkAt<Date.now()-60000){S._tbkAt=Date.now();api("GET","/bookings?from="+t+"&to="+t).then(function(l){S.todayBk=l;if(S.page==="home"&&isPhone())render()}).catch(function(){})}
}
/* ---- phone Appt: the whole week ---- */
function phoneAppt(){
  var who=S.apptSub==="Work Schedule"?(S.apptSub="Office"):S.apptSub,dn=["T2","T3","T4","T5","T6","T7","CN"],days=[];
  for(var i=0;i<7;i++){var d=addDays(S.weekStart,i);if(i===6&&!S.hours[0])continue;days.push(d)}
  var td=todayISO(),slots=slotsFor(who),skip={};
  var h='<div class="phtabs">'+["Office","Daniel","Peter"].map(function(n){return '<button class="'+(who===n?'on':'')+'" data-sub="'+n+'">'+n+'</button>'}).join("")+'</div>';
  h+='<div class="wk-nav"><button class="btn sm" id="pw">‹</button><b>'+md(S.weekStart)+' – '+mdy(addDays(S.weekStart,6))+'</b><button class="btn sm" id="nw">›</button></div>'+(S.bkWeeks[S.weekStart]?'':'<div class="muted small" style="padding:0 2px">đang tải…</div>');
  h+='<div class="wk-wrap"><table class="wk"><tr><th></th>'+days.map(function(d){var ci=colInfo(who,d);return '<th class="'+(d===td?'td':'')+(ci?' blk':'')+'">'+dn[(new Date(d+"T12:00:00Z").getUTCDay()+6)%7]+'<br>'+(+d.slice(5,7))+'/'+(+d.slice(8))+'</th>'}).join("")+'</tr>';
  slots.forEach(function(sl,si){h+='<tr><td class="t">'+(sl%60?hmAP(hm(sl)).replace(/ [AP]M/,""):hmAP(hm(sl)).replace(/:00 /,"").replace("AM","a").replace("PM","p"))+'</td>';
    days.forEach(function(d){var ci=colInfo(who,d);
      if(ci){if(si===0)h+='<td class="cl" rowspan="'+slots.length+'"><span>'+esc(ci.label)+'</span></td>';return}
      if(skip[d]>0){skip[d]--;return}
      var key=who+"|"+d+"|"+hm(sl),bk=S.bookings[key],cl=isClosed(d,sl,who),span=bk?Math.max(1,Math.min(bk.span||1,slots.length-si)):1;if(bk)skip[d]=span-1;
      h+='<td class="'+(bk?'b':cl?'x':'')+(d===td?' td':'')+'" data-k="'+key+'"'+(span>1?' rowspan="'+span+'"':'')+'>'+(bk?esc(shortName(bk.n))+(bk.s?'<i>'+esc(bk.s)+'</i>':''):'')+'</td>'});
    h+='</tr>'});
  return h+'</table></div><button class="fab" id="apAdd">+ Hẹn</button>';
}
function bindPhoneAppt(){
  $$("[data-sub]").forEach(function(b){b.onclick=function(){S.apptSub=b.getAttribute("data-sub");render()}});
  $("#pw").onclick=function(){S.weekStart=addDays(S.weekStart,-7);render();refreshWeek()};$("#nw").onclick=function(){S.weekStart=addDays(S.weekStart,7);render();refreshWeek()};
  $$(".wk td[data-k]").forEach(function(td){td.onclick=function(){var k=td.getAttribute("data-k");openBooking(k,k.split("|"))}});
  $("#apAdd").onclick=function(){var who=S.apptSub,t=todayISO(),d0=t>=S.weekStart&&t<=addDays(S.weekStart,6)?t:S.weekStart,now=new Date().toLocaleTimeString("en-GB",{timeZone:"America/Los_Angeles",hour:"2-digit",minute:"2-digit"});
    for(var i=0;i<7;i++){var d=addDays(d0,i);if(d>addDays(S.weekStart,6))break;if(colInfo(who,d))continue;var sl=slotsFor(who);
      for(var j=0;j<sl.length;j++){var hh=hm(sl[j]);if(d===t&&hh<now)continue;var k=who+"|"+d+"|"+hh;if(!coverMap(who,d)[j]&&!isClosed(d,sl[j],who)){openBooking(k,k.split("|"));return}}}
    toast("Tuần này hết chỗ trống",true)};
}
/* ---- phone staff tab: low rows + full-screen form ---- */
var ST_SHORT={"":"—","E-file":"EF","Accepted":"Acc","Rejected":"Rej","Hold":"Hold","Paper Mailed":"Mail","Refund":"Ref"};
var M_SHORT={Cash:"C",Check:"K",Zelle:"Z",Venmo:"V"};
function phoneTab(id){
  var t=sById(id),rows=S.rows[id],can=canEditTab(id),cnt=0,tot=0;
  rows.forEach(function(r){if(r.deleted||isBlank(r))return;if(r.name&&r.status!=="Refund")cnt++;tot+=amt(r)});
  var list=[];rows.forEach(function(r,i){if(!r.deleted&&!isBlank(r))list.push(i)});
  list.sort(function(a,b){var x=rows[a],y=rows[b];return x.date===y.date?b-a:(x.date<y.date?1:-1)});
  var h='<div class="tab-head" style="'+themeVars(t.theme)+'"><b>'+esc(t.theme.title||t.name)+'</b><span class="muted">'+cnt+' hồ sơ · '+money(tot)+'</span></div>';
  h+='<table class="rt"><tr><th>Date</th><th>Name</th><th>St</th><th class="n">$</th><th>M</th><th class="n">Tip</th></tr>'+list.map(function(i){var r=rows[i];
    return '<tr data-ri="'+i+'"><td>'+(r.date?md(r.date):"")+'</td><td class="nm">'+esc(r.name)+'</td><td><span class="stc s-'+(r.status||"none").replace(" ","")+'">'+(r.online&&!r.status?'Onl':ST_SHORT[r.status])+'</span></td><td class="n">'+(r.amt?(r.status==="Refund"?"-":"")+r.amt:"")+'</td><td>'+(r.online?(r.paid?'P':'<span class="red">W</span>'):M_SHORT[r.method])+'</td><td class="n">'+(r.tip||"")+'</td></tr>'}).join("")+'</table>';
  if(!list.length)h+='<div class="muted small" style="padding:10px">Chưa có hồ sơ nào.</div>';
  h+='<div class="muted small" style="padding:6px 2px">M: C Cash · K Check · Z Zelle · V Venmo · P Online đã Paid · W Online chưa Paid</div>';
  if(can)h+='<button class="fab" id="recAdd">+ Hồ sơ</button>';
  return h;
}
function bindPhoneTab(id){
  var can=canEditTab(id);
  $$("tr[data-ri]").forEach(function(tr){tr.onclick=function(){openRecForm(id,+tr.getAttribute("data-ri"),!can)}});
  if($("#recAdd"))$("#recAdd").onclick=function(){var rows=S.rows[id],i=-1;for(var k=0;k<rows.length;k++){if(!rows[k].deleted&&isBlank(rows[k])&&!rows[k].id){i=k;break}}
    if(i<0){api("POST","/tabs/"+sById(id).dbId+"/extend").then(function(d){var t=sById(id);t.sheetLen=d.sheet_len;var n=rows.length;while(rows.length<t.sheetLen)rows.push(blank(rows.length));openRecForm(id,n,false)}).catch(fail);return}
    openRecForm(id,i,false)};
}
function openRecForm(id,i,ro){
  var r=S.rows[id][i],isNew=isBlank(r)&&!r.id,m=$("#modalHost"),t=sById(id);
  var v={date:r.date||(isNew?todayISO():""),name:r.name,ssn:r.ssn,status:r.status,amt:r.amt||"",tip:r.tip||"",method:r.method||"Cash",online:r.online,esign:r.esign,paid:r.paid,note:r.note};
  var seg=function(f,opts,cur){return '<div class="seg" data-seg="'+f+'">'+opts.map(function(o){return '<button type="button" class="'+(o[0]===cur?'on':'')+'" data-o="'+esc(o[0])+'"'+(ro?' disabled':'')+'>'+o[1]+'</button>'}).join("")+'</div>'};
  var dis=ro?' disabled':'';
  m.innerHTML='<div class="modal full"><div class="box fbox"><div class="fh"><button class="lnk" id="rfX">Hủy</button><b>'+(isNew?'Hồ sơ mới':'Hồ sơ')+' · '+esc(shortOf(t))+'</b><span></span></div><div class="fb">'+
    '<div class="f2"><label class="fl"><span>Date</span><input type="text" id="rfD" inputmode="numeric" value="'+mdyShort(v.date)+'" placeholder="mmddyy"'+dis+'></label><label class="fl"><span>Name <b class="req">*</b></span><input type="text" id="rfN" value="'+esc(v.name)+'"'+dis+'></label></div>'+
    '<label class="fl"><span>SSN (4 số cuối)</span><input type="text" id="rfS" inputmode="numeric" maxlength="4" value="'+esc(v.ssn)+'"'+dis+'></label>'+
    '<div class="fl"><span>Status</span>'+seg("status",STATUS.map(function(s){return [s,s||"—"]}),v.status)+'</div>'+
    '<div class="f2"><label class="fl"><span>Tiền</span><input type="text" id="rfA" inputmode="decimal" value="'+esc(v.amt)+'"'+dis+'></label><label class="fl"><span>Tips</span><input type="text" id="rfT" inputmode="decimal" value="'+esc(v.tip)+'"'+dis+'></label></div>'+
    '<div class="fl"><span>Method</span>'+seg("method",METHODS.map(function(s){return [s,s]}),v.method)+'</div>'+
    '<div class="fl"><span>Online</span><div class="seg" data-tg>'+[["online","Online"],["esign","E-sign"],["paid","Paid"]].map(function(x){return '<button type="button" data-t="'+x[0]+'" class="'+(v[x[0]]?'on':'')+'"'+(ro||(x[0]!=="online"&&!v.online)?' disabled':'')+'>'+x[1]+'</button>'}).join("")+'</div></div>'+
    '<label class="fl"><span>Notes</span><input type="text" id="rfO" value="'+esc(v.note)+'" placeholder="(optional)"'+dis+'></label>'+
    (r.status==="Accepted"?'<div class="muted small">🔒 Accepted: mọi thay đổi được ghi log cho Admin</div>':'')+
    '<div class="err" id="rfE"></div></div><div class="ff">'+(!ro&&!isNew?'<button class="btn del" id="rfDel">Xóa</button>':'')+'<button class="btn" id="rfC">'+(ro?'Đóng':'Hủy')+'</button>'+(ro?'':'<button class="btn pri" id="rfOk">Lưu</button>')+'</div></div></div>';
  var close=function(){m.innerHTML=""};
  $("#rfX").onclick=close;$("#rfC").onclick=close;if(ro)return;
  $$("[data-seg]").forEach(function(g){g.onclick=function(e){var b=e.target.closest("[data-o]");if(!b)return;v[g.getAttribute("data-seg")]=b.getAttribute("data-o");$$("button",g).forEach(function(x){x.classList.toggle("on",x===b)})}});
  $("[data-tg]").onclick=function(e){var b=e.target.closest("[data-t]");if(!b||b.disabled)return;var f=b.getAttribute("data-t");v[f]=!v[f];if(f==="online"&&!v.online){v.esign=false;v.paid=false}
    $$("[data-t]").forEach(function(x){var k=x.getAttribute("data-t");x.classList.toggle("on",!!v[k]);if(k!=="online")x.disabled=!v.online})};
  if($("#rfDel"))$("#rfDel").onclick=function(){var go=function(){(r._q||Promise.resolve()).then(function(){return r.id?api("DELETE","/rows/"+r.id):null}).then(function(){if(r.id)delete S.idx[r.id];S.rows[id][i]=blank(i);close();render()}).catch(fail)};
    if(r.status==="Accepted")ask({title:"Xóa hồ sơ đã Accepted?",danger:true,yes:"Xóa",html:'<p>“'+esc(r.name)+'” sẽ được ghi log cho Admin (Admin khôi phục được).</p>'}).then(function(ok){if(ok)go()});else go()};
  $("#rfOk").onclick=function(){
    var d=parseMDY($("#rfD").value),n=titleCase($("#rfN").value.trim()),ss=$("#rfS").value.trim(),a=parseFloat($("#rfA").value.replace(/[$,]/g,""))||0,tp=parseFloat($("#rfT").value.replace(/[$,]/g,""))||0;
    if(d===null){$("#rfE").textContent="Date gõ mmddyy, ví dụ 021527";return}
    if(!/^\d{0,4}$/.test(ss)){$("#rfE").textContent="SSN chỉ nhập đúng 4 số cuối";return}
    if(!n&&!a&&!v.status){$("#rfE").textContent="Cần điền Name";return}
    var nv={date:d||todayISO(),name:n,ssn:ss,status:v.status,amt:a,tip:tp,method:v.method,online:!!v.online,esign:!!(v.online&&v.esign),paid:!!(v.online&&v.paid),note:$("#rfO").value};
    var fields={};Object.keys(nv).forEach(function(k){if(nv[k]!==r[k])fields[k]=nv[k]});
    if(!Object.keys(fields).length){close();return}
    if("paid" in fields)r.paidDate=nv.paid?todayISO():"";
    Object.keys(fields).forEach(function(k){r[k]=fields[k]});
    saveRow(id,i,fields);close();render();toast("Đã lưu")};
}

/* ================= go ================= */
start();
