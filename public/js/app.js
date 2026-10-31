/* tax.fsma.team - front end (vanilla JS). Data comes from /api/*; all permissions are enforced on the server. */
var PALETTE={"Rose":"#e06666","Blue":"#3d85c6","Sunshine":"#f2b400","Green":"#46a657","Orange":"#ff8e18","Purple":"#8e63c9","Teal":"#20a4a4","Pink":"#ec7fa9"};
var FONTS=["Pacifico","Lobster","Comfortaa","Montserrat","Nunito","Oswald","Gloria Hallelujah","Quicksand"];
var STATUS=["","E-file","Accepted","Rejected","Hold","Paper Mailed","Refund"];
var METHODS=["Cash","Check","Zelle","Venmo"];
function mondayOf(d){var x=new Date(d.getTime());var wd=(x.getDay()+6)%7;x.setDate(x.getDate()-wd);return x.getFullYear()+"-"+("0"+(x.getMonth()+1)).slice(-2)+"-"+("0"+x.getDate()).slice(-2)}
var S={me:null,page:"home",apptSub:"Office",setSub:"users",weekStart:mondayOf(new Date()),from:"",to:"",othersOpen:false,feeQ:"",
  staff:[],users:[],rows:{},idx:{},blackouts:[],hours:{},cal:{},prep:[],notice:"",sched:[],fees:[],feeTiers:[],bookings:{},bkWeek:null,
  log:[],logLoaded:false,retire:[],emailFormats:{},fy:new Date().getFullYear()+1,season:new Date().getFullYear(),now:null,
  pYear:0,pFrom:1,pTo:12,rec:null,recLoading:false};
var REC={};

/* ---------- helpers ---------- */
var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function money(n){var neg=n<0;n=Math.abs(n);return (neg?"-":"")+"$"+n.toLocaleString("en-US")}
function mdy(d){if(!d)return "";var p=d.split("-");return p[1]+"/"+p[2]+"/"+p[0]}
function mdyShort(d){if(!d)return "";var p=d.split("-");return p[1]+"/"+p[2]+"/"+p[0].slice(2)}
function parseMDY(v){v=String(v||"").trim();if(!v)return "";var m,mo,da,yr,cy=+todayISO().slice(0,4);
  if(/[\/\-\.\s]/.test(v)){m=v.split(/[\/\-\.\s]+/);if(m.length<2)return null;mo=+m[0];da=+m[1];yr=m[2]?+m[2]:cy}
  else{if(!/^\d+$/.test(v))return null;if(v.length===4){mo=+v.slice(0,2);da=+v.slice(2);yr=cy}else if(v.length===6){mo=+v.slice(0,2);da=+v.slice(2,4);yr=+v.slice(4)}else if(v.length===8){mo=+v.slice(0,2);da=+v.slice(2,4);yr=+v.slice(4)}else return null}
  if(yr<100)yr+=2000;var d=new Date(Date.UTC(yr,mo-1,da));if(!mo||!da||d.getUTCMonth()!==mo-1||d.getUTCDate()!==da)return null;
  return d.toISOString().slice(0,10)}
function md(d){var p=d.split("-");return p[1]+"/"+p[2]}
function todayISO(){return new Date().toLocaleDateString("en-CA",{timeZone:"America/Los_Angeles"})}
function daysSince(d){return Math.floor((new Date(todayISO()+"T00:00:00")-new Date(d+"T00:00:00"))/864e5)}
function fmtTs(ts){return new Date(ts).toLocaleString("en-US",{timeZone:"America/Los_Angeles",month:"2-digit",day:"2-digit",year:"numeric",hour:"numeric",minute:"2-digit"})}
function titleCase(s){return s.toLowerCase().replace(/(^|[\s\-\.&(])(\p{L})/gu,function(m,a,b){return a+b.toUpperCase()}).replace(/\s+/g," ").trim()}
function norm(x){return String(x||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d")}
function tk(id){return "t"+id}
function toast(msg,bad){var t=document.createElement("div");t.className="toast"+(bad?" bad":"");t.textContent=msg;document.body.appendChild(t);setTimeout(function(){t.remove()},bad?5000:2200)}
function ApiErr(status,msg){this.status=status;this.message=msg}
function api(method,path,body){
  var opt={method:method,headers:{"x-tax":"1"},credentials:"same-origin"};
  if(body!==undefined){opt.headers["content-type"]="application/json";opt.body=JSON.stringify(body)}
  return fetch("/api"+path,opt).then(function(r){
    return r.json().catch(function(){return {}}).then(function(d){
      if(r.status===401&&path!=="/login"&&path!=="/me"){showLogin("Phiên đăng nhập đã hết, vui lòng đăng nhập lại.");throw new ApiErr(401,d.error)}
      if(!r.ok){var e=new ApiErr(r.status,d.error||"Có lỗi xảy ra");e.data=d;throw e}
      return d})
  },function(){throw new ApiErr(0,"Không có kết nối, thử lại sau")});
}
function fail(e){if(e&&e.status===401)return;toast((e&&e.message)||"Có lỗi xảy ra",true)}

/* ---------- current user ---------- */
function me(){return S.me.display_name}
function isAdmin(){return !!S.me&&S.me.role==="admin"}
function myTab(){return S.me&&S.me.tab_id?tk(S.me.tab_id):""}
function canEditTab(id){return isAdmin()||myTab()===id}
function canBook(){return true}
function sById(id){return S.staff.filter(function(x){return x.id===id})[0]}
function mapTab(t){return {id:tk(t.id),dbId:t.id,name:t.name,sheetLen:t.sheet_len,theme:{color:t.color,font:t.font,title:t.title,tag:t.tagline}}}

/* ---------- client rows ---------- */
function blank(i){return {id:null,pos:i,date:"",status:"",name:"",ssn:"",amt:0,method:"Cash",online:false,esign:false,paid:false,paidDate:"",note:"",tip:0,deleted:false}}
function isBlank(r){return !r.name&&!r.status&&!r.amt&&!r.note&&!r.tip&&!r.ssn}
function mapRow(o){return {id:o.id,pos:o.pos,date:o.date,status:o.status,name:o.name,ssn:o.ssn,amt:o.amt,method:o.method,online:o.online,esign:o.esign,paid:o.paid,paidDate:o.paidDate,note:o.note,tip:o.tip,deleted:false}}
function buildRows(list){
  S.rows={};S.idx={};var by={};list.forEach(function(o){(by[tk(o.tab)]=by[tk(o.tab)]||[]).push(o)});
  S.staff.forEach(function(t){var l=by[t.id]||[],mx=-1;l.forEach(function(o){if(o.pos>mx)mx=o.pos});var n=Math.max(t.sheetLen,mx+1),a=[];for(var i=0;i<n;i++)a.push(blank(i));l.forEach(function(o){a[o.pos]=mapRow(o);S.idx[o.id]=[t.id,o.pos]});S.rows[t.id]=a});
}
function applyChanges(list){
  list.forEach(function(o){
    var loc=S.idx[o.id];
    if(loc){var arr=S.rows[loc[0]];if(arr&&arr[loc[1]]&&arr[loc[1]].id===o.id)arr[loc[1]]=blank(loc[1]);delete S.idx[o.id]}
    if(o.deleted)return;
    var key=tk(o.tab),arr2=S.rows[key];if(!arr2)return;
    while(arr2.length<=o.pos)arr2.push(blank(arr2.length));
    arr2[o.pos]=mapRow(o);S.idx[o.id]=[key,o.pos];
  });
}
function amt(r){return r.status==="Refund"?-Math.abs(r.amt):r.amt}
function bucket(r){if(r.status==="Refund")return "rf";if(r.online&&!r.paid)return "wt";return (r.method==="Zelle"||r.method==="Venmo")?"zl":"cc"}
function live(id){return (S.rows[id]||[]).filter(function(r){return !r.deleted&&!isBlank(r)})}
function allRows(){var o=[];S.staff.forEach(function(s){live(s.id).forEach(function(r){o.push({s:s,r:r})})});return o}
function themeVars(t){var c=PALETTE[t.color]||"#3d85c6";var h=c.replace("#","");var l=(0.299*parseInt(h.substr(0,2),16)+0.587*parseInt(h.substr(2,2),16)+0.114*parseInt(h.substr(4,2),16))/255;return "--acc:"+c+";--acc-ink:"+(l>0.68?"#4a3400":"#fff")}

/* save one row (blank row -> create, existing -> patch); calls for the same row run one after another */
function rowFields(r){return {date:r.date,status:r.status,name:r.name,ssn:r.ssn,amt:r.amt,method:r.method,online:r.online,esign:r.esign,paid:r.paid,note:r.note,tip:r.tip}}
function saveRow(tabKey,i,fields){
  var r=S.rows[tabKey][i],t=sById(tabKey);
  r._q=(r._q||Promise.resolve()).then(function(){
    if(r.id)return api("PATCH","/rows/"+r.id,{fields:fields}).then(function(o){r.paidDate=o.paidDate;if(!o.online){r.esign=false;r.paid=false}});
    return api("POST","/rows",{tab_id:t.dbId,pos:i,fields:rowFields(r)}).then(function(o){r.id=o.id;r.paidDate=o.paidDate;S.idx[o.id]=[tabKey,i]});
  }).catch(function(e){fail(e);if(e&&e.status===409)reloadRows()});
}
function reloadRows(){return api("GET","/rows").then(function(d){S.now=d.now;buildRows(d.rows);if(!uiBusy())render()}).catch(fail)}
function uiBusy(){var ae=document.activeElement;return !!($("#modalHost")&&$("#modalHost").children.length)||!!(ae&&ae.closest&&ae.closest("table.sheet"))||!!(ae&&ae.id==="gq")||!!(ae&&ae.closest&&ae.closest("#page")&&/^(INPUT|SELECT|TEXTAREA)$/.test(ae.tagName))}

/* ---------- login / password / boot ---------- */
function showLogin(msg){
  S.me=null;
  $("#root").innerHTML='<div class="login"><div class="login-box"><div class="brand" style="margin-bottom:16px">FSMA Tax<span>Tax season</span></div><h2>Đăng nhập</h2>'+(msg?'<div class="notice">'+esc(msg)+'</div>':'')+
    '<form id="lf"><label>Username</label><input type="text" id="lu" autocomplete="username" autocapitalize="none" required><label>Password</label><input type="password" id="lp" autocomplete="current-password" required><div class="err" id="le"></div><button class="btn pri" type="submit" style="width:100%;justify-content:center;padding:8px">Đăng nhập</button></form></div></div>';
  $("#lu").focus();
  $("#lf").onsubmit=function(e){e.preventDefault();$("#le").textContent="";
    api("POST","/login",{username:$("#lu").value,password:$("#lp").value}).then(start).catch(function(er){$("#le").textContent=er.message})};
}
function showChangePw(forced){
  $("#root").innerHTML='<div class="login"><div class="login-box"><h2>Đổi mật khẩu</h2>'+(forced?'<div class="notice">Đây là lần đăng nhập đầu tiên (hoặc mật khẩu vừa được đặt lại). Vui lòng đặt mật khẩu mới, ít nhất 8 ký tự.</div>':'')+
    '<form id="cf"><label>Mật khẩu hiện tại</label><input type="password" id="cp0" autocomplete="current-password" required><label>Mật khẩu mới</label><input type="password" id="cp1" autocomplete="new-password" required minlength="8"><label>Nhập lại mật khẩu mới</label><input type="password" id="cp2" autocomplete="new-password" required><div class="err" id="ce"></div>'+
    '<button class="btn pri" type="submit" style="width:100%;justify-content:center;padding:8px">Lưu mật khẩu mới</button>'+(forced?'':'<p style="text-align:center"><a href="#" id="cback">Quay lại</a></p>')+'</form></div></div>';
  $("#cp0").focus();
  if($("#cback"))$("#cback").onclick=function(e){e.preventDefault();loadBoot()};
  $("#cf").onsubmit=function(e){e.preventDefault();$("#ce").textContent="";
    if($("#cp1").value!==$("#cp2").value){$("#ce").textContent="Hai mật khẩu mới không giống nhau";return}
    api("POST","/password",{old:$("#cp0").value,new:$("#cp1").value}).then(function(){toast("Đã đổi mật khẩu");loadBoot()}).catch(function(er){$("#ce").textContent=er.message})};
}
function start(){
  api("GET","/me").then(function(d){S.me=d.user;if(d.user.must_change)showChangePw(true);else loadBoot()}).catch(function(){showLogin()});
}
function loadBoot(){
  api("GET","/boot").then(function(b){
    S.me=b.me;S.staff=b.tabs.map(mapTab);S.users=(b.users||[]).map(mapUser);
    var st=b.settings||{};S.notice=st.notice||"";S.hours=st.hours||{};S.cal=st.cal||{};S.prep=st.prep_list||[];S.season=st.season_year||S.season;S.fy=S.season+1;
    S.retire=st.retirement||[["IRA","—"],["IRA 50+","—"],["401k / 403b / 457","—"],["Catch-up 50+","—"],["SIMPLE","—"]];S.emailFormats=st.email_formats||{};
    S.blackouts=b.blackouts.map(function(x){return {id:x.id,date:x.date,who:x.who,note:x.note}});
    S.sched=b.sched;S.fees=b.fees;S.feeTiers=b.tiers.map(function(t){return [t[0],t[1],tierRows(t)]});S.now=b.now;buildRows(b.rows);
    S.bookings={};S.bkWeeks={};S.logLoaded=false;S.rec=null;
    if(!S.pYear){S.pYear=S.fy;applyPeriod()}
    if(sById(S.page)===undefined&&["home","fees","appt","attn","reports","acct","records","settings","search"].indexOf(S.page)<0)S.page="home";
    buildShell();render();startPolling();
  }).catch(function(e){if(e&&e.data&&e.data.must_change)showChangePw(true);else if(e.status!==401){$("#root").innerHTML='<div class="login"><div class="login-box"><h2>Không tải được dữ liệu</h2><div class="err">'+esc(e.message)+'</div><button class="btn" id="retry">Thử lại</button></div></div>';$("#retry").onclick=function(){location.reload()}}});
}
function mapUser(u){return {id:u.id,u:u.username,full:u.full_name,n:u.display_name,role:u.role==="admin"?"Admin":"Preparer",tab:u.tab_id?tk(u.tab_id):"",tmp:u.must_change,locked:u.locked,active:u.active}}
function logout(){api("POST","/logout").catch(function(){}).then(function(){showLogin()})}
function buildShell(){
  $("#root").innerHTML='<div class="topbar"><div class="inner"><div class="brand">FSMA Tax<span>Tax season '+S.fy+'</span></div>'+
    '<div class="gsearch"><input type="text" id="gq" placeholder="Tìm 4 số cuối SSN hoặc tên khách" autocomplete="off"><button class="btn pri" id="gbtn">Search</button></div>'+
    '<div class="userbox"><div class="welcome" id="welcome"></div><div><a href="#" id="pwLink">Đổi mật khẩu</a> · <a href="#" id="outLink" class="logout">Đăng xuất</a></div></div></div></div>'+
    '<div class="menubar"><div class="nav" id="nav"></div></div><div class="sheets"><div class="in" id="sheets"></div></div><div class="page" id="page"></div><div id="modalHost"></div>';
  $("#pwLink").onclick=function(e){e.preventDefault();showChangePw(false)};
  $("#outLink").onclick=function(e){e.preventDefault();logout()};
  $("#gbtn").onclick=runSearch;
  $("#gq").onkeydown=function(e){if(e.key==="Enter")runSearch()};
  $("#gq").oninput=function(){if(/^\d{4}$/.test(this.value.trim()))runSearch()};
}

/* ---------- live sync (every 30 s while the tab is visible) ---------- */
var _poll=null;
S.lastAct=Date.now();
["mousemove","keydown","click","touchstart","scroll"].forEach(function(ev){document.addEventListener(ev,function(){S.lastAct=Date.now()},{passive:true})});
function startPolling(){
  if(_poll)return;
  _poll=setInterval(function(){
    if(!S.me||document.hidden||Date.now()-S.lastAct>30*60*1000)return;
    var ae=document.activeElement,since=new Date(new Date(S.now).getTime()-5000).toISOString(),skip=null;
    if(ae&&ae.closest&&ae.closest("table.sheet")){var tr=ae.closest("tr"),i=tr?+tr.getAttribute("data-i"):-1;var arr=S.rows[S.page];if(arr&&i>=0&&arr[i])skip=arr[i].id}
    api("GET","/rows?since="+encodeURIComponent(since)).then(function(d){
      S.now=d.now;var list=d.rows.filter(function(o){return o.id!==skip});
      var changed=list.some(function(o){var loc=S.idx[o.id];if(o.deleted)return !!loc;var r=loc&&S.rows[loc[0]][loc[1]];return !r||JSON.stringify(mapRow(o))!==JSON.stringify(Object.assign({},r,{_q:undefined}))});
      if(changed){applyChanges(list);if(!uiBusy()&&S.page!=="appt")renderKeep()}
    }).catch(function(){});
  },30000);
  setInterval(function(){if(S.me&&!document.hidden&&Date.now()-S.lastAct<30*60*1000&&S.page==="appt"&&S.apptSub!=="Work Schedule")refreshWeek()},APPT_POLL);
  document.addEventListener("visibilitychange",function(){if(!document.hidden&&S.me&&S.page==="appt"&&S.apptSub!=="Work Schedule")refreshWeek()});
}
var APPT_POLL=10000;

/* ================= nav ================= */
function renderNav(){
  var items=[["home","Homepage"],["fees","Fees"],["appt","Appointment"],["attn","Attention"]];
  if(isAdmin()){items.push(["reports","Reports"]);items.push(["acct","Accounting"]);items.push(["records","Records"]);items.push(["settings","Settings"])}
  $("#nav").innerHTML=items.map(function(x){return '<button data-p="'+x[0]+'" class="'+(S.page===x[0]?'on':'')+'">'+x[1]+'</button>'}).join("");
  $("#sheets").innerHTML=S.staff.map(function(s){return '<button class="st'+(S.page===s.id?' on':'')+'" data-p="'+s.id+'" style="--c:'+(PALETTE[s.theme.color])+'">'+esc(s.name)+'</button>'}).join("")+(isAdmin()?'<button class="st add" data-p="__add" title="Chỉ Admin">+ Thêm tab</button>':'');
  $$("[data-p]").forEach(function(b){b.onclick=function(){var k=b.getAttribute("data-p");if(k==="__add"){addStaff();return}S.page=k;render()}});
  $("#welcome").textContent="Welcome, "+me();
}
function addStaff(){
  var n=prompt("Tên tab nhân viên mới:");if(!n||!n.trim())return;
  api("POST","/tabs",{name:n.trim()}).then(function(t){var m=mapTab(t);S.staff.push(m);var a=[];for(var i=0;i<m.sheetLen;i++)a.push(blank(i));S.rows[m.id]=a;S.page=m.id;render()}).catch(fail);
}

/* ================= Homepage helpers (editable tips) ================= */
var EMAIL_NAMES=["E-sign","Refund (vn)","Payment (vn)","Draft","Refund (eng)","Payment (eng)"];
function emailBlock(){
  return '<div><h3>Formats email e-sign</h3><table class="t2">'+EMAIL_NAMES.map(function(x,i){var has=!!S.emailFormats[x];
    return '<tr><td>'+x+(has?'':' <span class="muted small">(chưa có nội dung)</span>')+'</td><td class="n"><button class="btn sm" data-ecopy="'+i+'"'+(has?'':' disabled')+'>Copy</button>'+(isAdmin()?' <button class="btn sm" data-eedit="'+i+'">Sửa</button>':'')+'</td></tr>'}).join("")+'</table></div>';
}
function kvEdit(title,rows){return '<div><h3>'+title+(isAdmin()?' <a href="#" id="retEdit" class="small" style="font-weight:400">sửa</a>':'')+'</h3><table class="t2 kv">'+rows.map(function(r){return '<tr><td>'+esc(r[0])+'</td><td class="n">'+esc(r[1])+'</td></tr>'}).join("")+'</table></div>'}
function bindHomeTips(){
  $$("[data-ecopy]").forEach(function(b){b.onclick=function(){var t=S.emailFormats[EMAIL_NAMES[+b.getAttribute("data-ecopy")]]||"";
    (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){toast("Đã copy")}).catch(function(){var ta=document.createElement("textarea");ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");toast("Đã copy")}catch(e){toast("Không copy được",true)}ta.remove()})}});
  $$("[data-eedit]").forEach(function(b){b.onclick=function(){var nm=EMAIL_NAMES[+b.getAttribute("data-eedit")],m=$("#modalHost");
    m.innerHTML='<div class="modal"><div class="box" style="width:560px"><h3>'+esc(nm)+'</h3><textarea id="etx" rows="12" style="width:100%">'+esc(S.emailFormats[nm]||"")+'</textarea><div class="row-end" style="margin-top:12px"><button class="btn" id="ec">Hủy</button><button class="btn pri" id="es">Lưu</button></div></div></div>';
    $("#ec").onclick=function(){m.innerHTML=""};
    $("#es").onclick=function(){var f=Object.assign({},S.emailFormats);f[nm]=$("#etx").value;api("PUT","/settings/email_formats",{value:f}).then(function(d){S.emailFormats=d.value;m.innerHTML="";render()}).catch(fail)}}});
  if($("#retEdit"))$("#retEdit").onclick=function(e){e.preventDefault();var m=$("#modalHost");
    m.innerHTML='<div class="modal"><div class="box"><h3>Retirement contribution</h3><div class="f">'+S.retire.map(function(r,i){return '<label>'+esc(r[0])+'</label><input type="text" id="rt'+i+'" value="'+esc(r[1])+'">'}).join("")+'</div><div class="row-end"><button class="btn" id="rc">Hủy</button><button class="btn pri" id="rs">Lưu</button></div></div></div>';
    $("#rc").onclick=function(){m.innerHTML=""};
    $("#rs").onclick=function(){var v=S.retire.map(function(r,i){return [r[0],$("#rt"+i).value]});api("PUT","/settings/retirement",{value:v}).then(function(d){S.retire=d.value;m.innerHTML="";render()}).catch(fail)}};
  if($("#editNotice"))$("#editNotice").onclick=function(e){e.preventDefault();var n=prompt("Thông báo:",S.notice);if(n!==null)api("PUT","/settings/notice",{value:n}).then(function(d){S.notice=d.value;render()}).catch(fail)};
}

/* ================= Global search (everyone) ================= */
S.q="";S.prev="home";S.searchRes=null;
function pageSearch(){
  var res=S.searchRes||{total:0,rows:[]};
  var h='<div class="page-head"><div><h1>Search</h1><div class="sub">“'+esc(S.q)+'” · '+res.total+' hồ sơ'+(res.total>res.rows.length?' (hiện '+res.rows.length+' đầu)':'')+'</div></div><button class="btn" id="sBack">← Quay lại</button></div>';
  h+='<div class="wrap"><table class="t2"><tr><th>Year</th><th>Date</th><th>Preparer</th><th>Name</th><th>SSN</th><th class="n">Tiền</th><th>Status</th><th>Note</th></tr>'+
    (res.rows.length?res.rows.map(function(r){return '<tr><td>'+r.year+'</td><td>'+mdy(r.date)+'</td><td>'+(r.tabId?'<a href="#" data-go="'+tk(r.tabId)+'">'+esc(r.preparer)+'</a>':esc(r.preparer))+'</td><td>'+esc(r.name)+'</td><td>'+esc(r.ssn)+'</td><td class="n">'+money(r.amt)+'</td><td>'+esc(r.status||"—")+'</td><td>'+esc(r.note)+'</td></tr>'}).join(""):'<tr><td colspan="8" class="muted">Không thấy hồ sơ nào</td></tr>')+'</table></div>';
  h+='<div class="muted small" style="margin-top:10px">Gõ đủ 4 số cuối SSN để ra đúng khách, hoặc gõ tên · Tìm trong tất cả tab nhân viên và các năm 2021–2025, ai đăng nhập cũng dùng được.</div>';
  return h;
}
function runSearch(){
  var q=$("#gq").value.trim();if(!q)return;
  var mine=++S._sq;
  api("GET","/search?q="+encodeURIComponent(q)).then(function(d){if(mine!==S._sq)return;S.q=q;S.searchRes=d;if(S.page!=="search")S.prev=S.page;S.page="search";render()}).catch(fail);
}
S._sq=0;

/* ================= Records: client list (Admin) ================= */
S.rcQ="";S.rcP="";S.rcN=100;S.rcRows=[];S.rcTotal=0;S.rcKey="";S.rcLoading=false;
function recClientsTable(){
  var n=S.rcRows.length;
  var h='<div class="wrap"><table class="t2"><tr><th>Year</th><th>Date</th><th>Preparer</th><th>Name</th><th>SSN</th><th class="n">Tiền</th><th>Status</th><th>Note</th></tr>'+(n?S.rcRows.map(function(r){return '<tr><td>'+r.year+'</td><td>'+mdy(r.date)+'</td><td>'+esc(r.preparer)+'</td><td>'+esc(r.name)+'</td><td>'+esc(r.ssn)+'</td><td class="n">'+money(r.amt)+'</td><td>'+esc(r.status||"—")+'</td><td>'+esc(r.note)+'</td></tr>'}).join(""):'<tr><td colspan="8" class="muted">'+(S.rcLoading?'Đang tải…':'Không thấy hồ sơ nào')+'</td></tr>')+'</table></div>';
  if(S.rcTotal>n)h+='<p><button class="btn" id="rcMore">Xem thêm 100 dòng</button></p>';
  h+='<div class="muted small" style="margin-top:8px">Chỉ giữ 4 số SSN cuối · số điện thoại và số tài khoản trong Note đã được che ***</div>';
  return h;
}
function loadRecClients(ys){
  var key=ys.join(",")+"|"+S.rcP+"|"+S.rcQ+"|"+S.rcN;S.rcKey=key;S.rcLoading=true;
  api("GET","/records/clients?years="+ys.join(",")+"&prep="+encodeURIComponent(S.rcP)+"&q="+encodeURIComponent(S.rcQ)+"&limit="+S.rcN).then(function(d){
    if(S.rcKey!==key)return;S.rcRows=d.rows;S.rcTotal=d.total;S.rcLoading=false;
    var host=$("#rcTable");if(host){host.innerHTML=recClientsTable();var c=$("#rcCount");if(c)c.textContent=d.total+" hồ sơ · đang hiện "+d.rows.length;bindRcMore(ys)}
  }).catch(function(e){S.rcLoading=false;fail(e)});
}
function bindRcMore(ys){if($("#rcMore"))$("#rcMore").onclick=function(){S.rcN+=100;loadRecClients(ys)}}
function recClients(ys){
  var ps={};Object.keys(REC).forEach(function(y){if(ys.indexOf(+y)>=0)Object.keys(REC[y]).forEach(function(k){ps[k]=1})});
  var h='<div style="margin-bottom:12px"><input type="text" id="rcQ" placeholder="Tên hoặc 4 số SSN" value="'+esc(S.rcQ)+'" style="width:260px"> <select id="rcP"><option value="">Tất cả preparer</option>'+Object.keys(ps).sort().map(function(k){return '<option'+(k===S.rcP?' selected':'')+'>'+esc(k)+'</option>'}).join("")+'</select> <span class="muted small" id="rcCount">'+S.rcTotal+' hồ sơ · đang hiện '+S.rcRows.length+'</span></div><div id="rcTable">'+recClientsTable()+'</div>';
  return h;
}
function bindRecords(){
  var ys=S.recYears.slice().sort(function(a,b){return b-a});
  $$("[data-ry]").forEach(function(b){b.onclick=function(){S.recYears=[+b.getAttribute("data-ry")];S.rcN=100;render()}});
  $("#ryAll").onclick=function(){S.recYears=REC_YEARS.slice();S.rcN=100;render()};
  $$("[data-rs]").forEach(function(b){b.onclick=function(){S.recSub=b.getAttribute("data-rs");render()}});
  $$("[data-rp]").forEach(function(a){a.onclick=function(e){e.preventDefault();S.recPrep=a.getAttribute("data-rp");S.recSub="prep";render()}});
  if($("#rpSel"))$("#rpSel").onchange=function(){S.recPrep=this.value;render()};
  if($("#rcQ")){
    var key=ys.join(",")+"|"+S.rcP+"|"+S.rcQ+"|"+S.rcN;if(key!==S.rcKey)loadRecClients(ys);else bindRcMore(ys);
    var tmr=null;$("#rcQ").oninput=function(){S.rcQ=this.value;S.rcN=100;clearTimeout(tmr);tmr=setTimeout(function(){loadRecClients(ys)},300)};
    $("#rcP").onchange=function(){S.rcP=this.value;S.rcN=100;loadRecClients(ys)};
  }
}

/* ================= Homepage ================= */
function pageHome(){
  var d=new Date(),days=["Chủ nhật","Thứ hai","Thứ ba","Thứ tư","Thứ năm","Thứ sáu","Thứ bảy"];
  var h='<div class="page-head"><div><h1>Hello Team!</h1><div class="sub">Hôm nay là '+days[d.getDay()]+', '+("0"+(d.getMonth()+1)).slice(-2)+'/'+("0"+d.getDate()).slice(-2)+'/'+d.getFullYear()+'</div></div></div>';
  h+='<div class="notice"><b>Thông báo:</b> '+esc(S.notice)+(isAdmin()?' &nbsp;<a href="#" id="editNotice">sửa</a>':'')+'</div>';
  var wait=0,n=0,tc=0,tt=0;allRows().forEach(function(x){if(bucket(x.r)==="wt"){wait+=x.r.amt;n++}if(x.r.status!=="Refund"&&x.r.name)tc++;tt+=amt(x.r)});
  var a=attn();
  h+='<div class="statbar" style="margin-bottom:28px"><div class="c"><b>'+tc+'</b><span>Total clients</span></div><div class="c"><b>'+money(tt)+'</b><span>Total Income</span></div><div class="c k-wait"><b>'+money(wait)+'</b><span>Still waiting for Online files · '+n+' files</span></div><div class="c k-att" id="goAttn"><b>'+a.total+' files</b><span>Attention · bấm để xem</span></div></div>';
  h+='<div class="card"><h2>Informations / Tips</h2><div class="grid3" style="margin-top:6px">';
  h+=kv("Schedule C – NAICS",[["Food delivery","492000"],["Taxi / Rideshare","485300"],["Nail tech","812113"],["Hair / Barber","812112"],["Online selling","455000"],["Janitorial","561720"],["Babysitting","624410"],["Handyman","812990"],["Truck · long distance","484121"]]);
  h+='<div><h3>Tax brackets</h3><table class="t2"><tr><th></th><th class="n">Single</th><th class="n">MFJ</th><th class="n">HoH</th></tr>'+
    [["10%","12,400","24,800","17,700"],["12%","50,400","100,800","67,450"],["22%","105,700","211,400","105,700"],["24%","201,775","403,550","201,775"],["32%","256,225","512,450","256,200"],["35%","640,600","768,700","640,600"],["37%","640.6k+","768.7k+","640.6k+"]].map(function(r){return '<tr><td>'+r[0]+'</td><td class="n">'+r[1]+'</td><td class="n">'+r[2]+'</td><td class="n">'+r[3]+'</td></tr>'}).join("")+'</table></div>';
  h+=kv("Others",[["Mileage business","72.5 – 76 ¢"],["1 credit SS","$1,890"],["4 credits SS","$7,560"],["Gift exclusion","$19,000"],["Estate / lifetime","$15M"],["Foreign income (FEIE)","$132,900"],["Truck driver per diem","$80 / ngày"]]);
  h+='<div><h3>Long-term capital gains</h3><table class="t2"><tr><th></th><th class="n">0% đến</th><th class="n">20% từ</th></tr><tr><td>Single</td><td class="n">49,450</td><td class="n">545,500</td></tr><tr><td>MFJ</td><td class="n">98,900</td><td class="n">613,700</td></tr><tr><td>HoH</td><td class="n">66,200</td><td class="n">579,600</td></tr></table></div>';
  h+=kvEdit("Retirement contribution",S.retire);
  h+=emailBlock();
  h+='</div></div>';
  h+='<div class="card"><div class="card-head"><h2>Summary</h2><div class="small">'+periodCtl()+'</div></div><div class="wrap">'+summary()+'</div>'+othersPanel()+'</div>';
  return h;
}
function kv(t,rows){return '<div><h3>'+t+'</h3><table class="t2 kv">'+rows.map(function(r){return '<tr><td>'+r[0]+'</td><td class="n">'+r[1]+'</td></tr>'}).join("")+'</table></div>'}
function summary(){
  var tot={cc:0,zl:0,wt:0,rf:0,all:0,cl:0,ef:0,ac:0,ot:0};
  var body=S.staff.map(function(s){
    var v={cc:0,zl:0,wt:0,rf:0,all:0,cl:0,ef:0,ac:0,ot:0};
    live(s.id).filter(function(r){return r.date>=S.from&&r.date<=S.to}).forEach(function(r){
      v[bucket(r)]+=amt(r);v.all+=amt(r);if(r.status!=="Refund")v.cl++;
      if(r.status==="E-file")v.ef++;if(r.status==="Accepted")v.ac++;if(r.status==="Rejected"||r.status==="Hold"||r.status==="Paper Mailed")v.ot++;
    });
    Object.keys(v).forEach(function(k){tot[k]+=v[k]});
    return row(s.name,v,false);
  }).join("");
  function row(nm,v,t){return '<tr'+(t?' class="tot"':'')+'><td>'+nm+'</td><td class="n cc">'+money(v.cc)+'</td><td class="n zl">'+money(v.zl)+'</td><td class="n wt">'+money(v.wt)+'</td><td class="n rf">'+money(v.rf)+'</td><td class="n tt">'+money(v.all)+'</td><td class="gap"></td><td class="n">'+v.cl+'</td><td class="n">'+v.ef+'</td><td class="n">'+v.ac+'</td><td class="n"><span class="oth">'+v.ot+'</span></td></tr>'}
  return '<table class="sum"><tr><th>Preparer</th><th class="n cc">Cash / Check</th><th class="n zl">Zelle / Venmo</th><th class="n wt">Wait</th><th class="n rf">Refund</th><th class="n tt">Total Income</th><th class="gap"></th><th class="n">Total clients</th><th class="n">EF</th><th class="n">Accepted</th><th class="n">Others</th></tr>'+body+row("Total",tot,true)+'</table>'+
   '<div class="muted small" style="margin-top:6px">Total Income = Cash / Check + Zelle/Venmo + Wait + Refund · Wait = online chưa Paid · Others = Rejected + Hold + Paper Mailed (bấm số để xem danh sách) · Tip không tính vào Summary</div>';
}
function othersPanel(){
  if(!S.othersOpen)return "";
  var out=[];S.staff.forEach(function(s){live(s.id).forEach(function(r){if(r.date>=S.from&&r.date<=S.to&&(r.status==="Rejected"||r.status==="Hold"||r.status==="Paper Mailed"))out.push([s.name,r])})});
  return '<div class="notice" style="margin-top:12px"><b>Others</b> · '+out.length+' hồ sơ<table class="t2" style="margin-top:6px"><tr><th>Preparer</th><th>Name</th><th>Status</th><th>Date</th><th>Notes</th></tr>'+out.map(function(x){return '<tr><td>'+esc(x[0])+'</td><td>'+esc(x[1].name)+'</td><td>'+x[1].status+'</td><td>'+md(x[1].date)+'</td><td>'+esc(x[1].note)+'</td></tr>'}).join("")+'</table></div>';
}


/* ================= Reports ================= */
function pageReports(){
  var per=[],mon={},T={cl:0,inc:0,tip:0};
  S.staff.forEach(function(s){var v={n:s.name,cl:0,inc:0,tip:0};
    live(s.id).filter(function(r){return r.date>=S.from&&r.date<=S.to}).forEach(function(r){
      var c=(r.status!=="Refund"&&r.name)?1:0;v.cl+=c;v.inc+=amt(r);v.tip+=r.tip;
      var m=r.date.slice(0,7);mon[m]=mon[m]||{cl:0,inc:0};mon[m].cl+=c;mon[m].inc+=amt(r)});
    T.cl+=v.cl;T.inc+=v.inc;T.tip+=v.tip;per.push(v)});
  var avg=function(a,b){return b?a/b:0},m2=function(n){return "$"+n.toFixed(2)};
  var mx=Math.max.apply(null,per.map(function(v){return avg(v.inc,v.cl)}).concat([1]));
  var rsub='<div class="sub-tabs"><button class="btn'+(S.repSub!=="staff"?' on':'')+'" data-rsub="office">Office</button><button class="btn'+(S.repSub==="staff"?' on':'')+'" data-rsub="staff">Nhân viên</button></div>';
  if(S.repSub==="staff")return '<div class="page-head"><div><h1>Reports</h1><div class="sub">Chỉ Admin thấy · mỗi người làm ra bao nhiêu mỗi giờ</div></div></div>'+rsub+pageRepStaff();
  var h='<div class="page-head"><div><h1>Reports</h1><div class="sub">Chỉ Admin thấy · trung bình mỗi hồ sơ (return)</div></div><div class="small">'+periodCtl()+'</div></div>'+rsub;
  var np=per.filter(function(v){return v.cl>0}).length;
  h+='<div class="statbar" style="margin-bottom:26px"><div class="c"><b>'+T.cl+'</b><span>Total clients</span></div><div class="c"><b>'+money(T.inc)+'</b><span>Total Income</span></div><div class="c"><b>'+m2(avg(T.inc,T.cl))+'</b><span>Average per return (cả office)</span></div><div class="c"><b>'+Math.round(avg(T.cl,np))+'</b><span>Avg clients per preparer</span></div><div class="c"><b>'+money(Math.round(avg(T.inc,np)))+'</b><span>Avg income per preparer</span></div><div class="c"><b>'+m2(avg(T.tip,T.cl))+'</b><span>Average tip per client</span></div></div>';
  h+='<div class="card"><div class="card-head"><h2>Average per return – theo Preparer</h2></div><div class="wrap"><table class="t2"><tr><th>Preparer</th><th class="n">Clients</th><th class="n">Total Income</th><th class="n">Average per return</th><th style="width:30%"></th><th class="n">Tips</th><th class="n">Avg tip / client</th></tr>'+
    per.map(function(v){var a=avg(v.inc,v.cl);return '<tr><td>'+esc(v.n)+'</td><td class="n">'+v.cl+'</td><td class="n">'+money(v.inc)+'</td><td class="n"><b>'+m2(a)+'</b></td><td><div class="bar" style="width:'+Math.round(a/mx*100)+'%"></div></td><td class="n">'+money(v.tip)+'</td><td class="n">'+m2(avg(v.tip,v.cl))+'</td></tr>'}).join("")+
    '<tr style="font-weight:700"><td>All</td><td class="n">'+T.cl+'</td><td class="n">'+money(T.inc)+'</td><td class="n">'+m2(avg(T.inc,T.cl))+'</td><td></td><td class="n">'+money(T.tip)+'</td><td class="n">'+m2(avg(T.tip,T.cl))+'</td></tr></table></div></div>';
  h+='<div class="card"><div class="card-head"><h2>Average per return – theo tháng</h2></div><div class="wrap"><table class="t2"><tr><th>Month</th><th class="n">Clients</th><th class="n">Total Income</th><th class="n">Average per return</th></tr>'+
    Object.keys(mon).sort().map(function(k){var v=mon[k];return '<tr><td>'+k.slice(5)+'/'+k.slice(0,4)+'</td><td class="n">'+v.cl+'</td><td class="n">'+money(v.inc)+'</td><td class="n"><b>'+m2(avg(v.inc,v.cl))+'</b></td></tr>'}).join("")+'</table></div></div>';
  h+='<div class="muted small">Average per return = Total Income ÷ Clients · Refund trừ vào Total Income, không tính là client · Tips không nằm trong Total Income.</div>';
  return h;
}

/* ================= Records ================= */
var REC_YEARS=[2025,2024,2023,2022,2021];
function applyPeriod(){var ld=new Date(S.pYear,S.pTo,0).getDate();S.from=S.pYear+"-"+("0"+S.pFrom).slice(-2)+"-01";S.to=S.pYear+"-"+("0"+S.pTo).slice(-2)+"-"+("0"+ld).slice(-2)}
var MON12=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function monOpts(sel){return MON12.map(function(m,i){return '<option value="'+(i+1)+'"'+(i+1===sel?' selected':'')+'>'+m+'</option>'}).join("")}
function periodCtl(){return '<select id="pYear">'+[S.fy-1,S.fy,S.fy+1].map(function(y){return '<option'+(y===S.pYear?' selected':'')+'>'+y+'</option>'}).join("")+'</select> <span class="muted">từ</span> <select id="pFrom">'+monOpts(S.pFrom)+'</select> <span class="muted">đến</span> <select id="pTo">'+monOpts(S.pTo)+'</select> <button class="btn sm" id="pAll">Cả năm</button>'}
function bindPeriod(){$("#pYear").onchange=function(){S.pYear=+this.value;applyPeriod();render()};$("#pFrom").onchange=function(){S.pFrom=+this.value;if(S.pTo<S.pFrom)S.pTo=S.pFrom;applyPeriod();render()};$("#pTo").onchange=function(){S.pTo=+this.value;if(S.pFrom>S.pTo)S.pFrom=S.pTo;applyPeriod();render()};$("#pAll").onclick=function(){S.pFrom=1;S.pTo=12;applyPeriod();render()}}
S.recYears=[2025];S.recSub="summary";S.recMode="year";
S.recAsOf=(function(){var d=new Date();return ("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2)})();
var MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Later"];
function recRows(y){var o=[],d=REC[String(y)]||{};Object.keys(d).forEach(function(p){d[p].forEach(function(r){o.push({p:p,d:r[0],a:r.slice(1)})})});
  if(S.recMode==="ytd"){var cut=(y+1)+"-"+S.recAsOf;o=o.filter(function(r){return r.d<=cut})}return o}
function aggBy(rows,fn){var m={};rows.forEach(function(r){var k=fn(r),o=m[k]=m[k]||[0,0,0,0,0,0,0,0,0];for(var i=0;i<9;i++)o[i]+=r.a[i]});return m}
function sumArr(m){var t=[0,0,0,0,0,0,0,0,0];Object.keys(m).forEach(function(k){for(var i=0;i<9;i++)t[i]+=m[k][i]});return t}
function inc(a){return a[1]+a[2]+a[3]+a[4]}
function avgOf(a){return a[0]?inc(a)/a[0]:0}
function m2(n){return "$"+n.toFixed(2)}
function recSumTable(m){
  var names=Object.keys(m).sort(function(a,b){return inc(m[b])-inc(m[a])}),tot=sumArr(m);
  function st(a,i){return (a[6]+a[7]+a[8])?a[i]:'<span class="muted">–</span>'}
  function row(nm,a,t){return '<tr'+(t?' class="tot"':'')+'><td>'+(t?esc(nm):'<a href="#" data-rp="'+esc(nm)+'">'+esc(nm)+'</a>')+'</td><td class="n tt">'+money(inc(a))+'</td><td class="gap"></td><td class="n">'+a[0]+'</td><td class="n">'+st(a,6)+'</td><td class="n">'+st(a,7)+'</td><td class="n">'+st(a,8)+'</td></tr>'}
  return '<div class="wrap"><table class="sum" style="max-width:760px"><tr><th>Preparer</th><th class="n tt">Total Income</th><th class="gap"></th><th class="n">Total clients</th><th class="n">EF</th><th class="n">Accepted</th><th class="n">Others</th></tr>'+names.map(function(n){return row(n,m[n],false)}).join("")+row("Total",tot,true)+'</table></div>';
}
function ytdLabel(){return ""}
function pageRecords(){
  var ys=S.recYears.slice().sort(function(a,b){return b-a}),h='';
  h+='<div class="page-head"><div><h1>Records</h1><div class="sub">Các mùa thuế cũ · chỉ Admin thấy</div></div></div>';
  h+='<div class="rec-bar"><div><span class="lbl">Năm</span>'+REC_YEARS.map(function(y){return '<button class="btn'+(ys.length===1&&ys[0]===y?' on':'')+'" data-ry="'+y+'">'+y+'</button> '}).join("")+'<button class="btn'+(ys.length>1?' on':'')+'" id="ryAll">Chọn hết</button></div></div>';
  h+='<div class="sub-tabs">'+[["summary","Summary"],["report","Report"],["prep","Preparers"],["clients","Clients"]].map(function(x){return '<button class="btn'+(S.recSub===x[0]?' on':'')+'" data-rs="'+x[0]+'">'+x[1]+'</button>'}).join("")+'<span class="muted small" style="margin-left:10px">'+(ys.length>1?'Tất cả '+ys.slice().sort().join(", "):ys[0]+' · nộp trong '+(ys[0]+1))+'</span></div>';
  h+=S.recSub==="summary"?recSummary(ys):S.recSub==="report"?recReport(ys):S.recSub==="prep"?recPrep(ys):recClients(ys);
  h+='<div class="muted small" style="margin-top:6px">Năm 2025 = khai thuế năm 2025, nộp trong 2026 (tương tự các năm khác) · Records chỉ có số tổng theo ngày và preparer · Năm nào tab không ghi Status thì EF, Accepted, Others hiện –.</div>';
  return h;
}
function recSummary(ys){
  var h='';
  if(ys.length>1){var all=[];ys.forEach(function(y){all=all.concat(recRows(y))});h+='<div class="card"><div class="card-head"><h2>Tất cả năm đã chọn <span class="muted small">'+ys.slice().sort().join(" + ")+'</span></h2></div>'+recSumTable(aggBy(all,function(r){return r.p}))+'</div>'}
  ys.forEach(function(y){h+='<div class="card"><div class="card-head"><h2>'+y+' <span class="muted small">nộp trong '+(y+1)+ytdLabel()+'</span></h2></div>'+recSumTable(aggBy(recRows(y),function(r){return r.p}))+'</div>'});
  return h;
}
function recReport(ys){
  var asc=ys.slice().sort(),multi=ys.length>1;
  var all=[];asc.forEach(function(y){all=all.concat(recRows(y))});
  var T=sumArr(aggBy(all,function(){return 1}));
  var mx=1,yt={},yp={};asc.forEach(function(y){var t=sumArr(aggBy(recRows(y),function(){return 1}));yt[y]=t;mx=Math.max(mx,avgOf(t));yp[y]=Object.keys(aggBy(recRows(y),function(r){return r.p})).length});
  var npy=0;asc.forEach(function(y){var m=aggBy(recRows(y),function(r){return r.p});Object.keys(m).forEach(function(k){if(m[k][0]>0)npy++})});
  var h='<div class="statbar" style="margin-bottom:24px"><div class="c"><b>'+T[0]+'</b><span>Total clients</span></div><div class="c"><b>'+money(inc(T))+'</b><span>Total Income</span></div><div class="c"><b>'+m2(avgOf(T))+'</b><span>Average per return (cả office)</span></div><div class="c"><b>'+Math.round(npy?T[0]/npy:0)+'</b><span>Avg clients per preparer'+(multi?' (mỗi năm)':'')+'</span></div><div class="c"><b>'+money(Math.round(npy?inc(T)/npy:0))+'</b><span>Avg income per preparer'+(multi?' (mỗi năm)':'')+'</span></div><div class="c"><b>'+m2(T[0]?T[5]/T[0]:0)+'</b><span>Average tip per client</span></div></div>';
  // by year
  var prevOf=function(y){var d=REC[String(y-1)];if(!d)return null;var cut=S.recMode==="ytd"?(y)+"-"+S.recAsOf:null,o=[];Object.keys(d).forEach(function(p){d[p].forEach(function(r){if(!cut||r[0]<=cut)o.push({p:p,d:r[0],a:r.slice(1)})})});return sumArr(aggBy(o,function(){return 1}))};
  if(multi){
    h+='<div class="card"><div class="card-head"><h2>Theo năm</h2></div><div class="wrap"><table class="t2"><tr><th>Năm</th><th class="n">Clients</th><th class="n">Total Income</th><th class="n">Average per return</th><th style="width:22%"></th><th class="n">Preparers</th><th class="n">Clients / preparer</th><th class="n">Tips</th><th class="n">So với năm trước</th></tr>'+
    asc.map(function(y){var t=yt[y],pv=prevOf(y),yo="<span class=\"muted\">–</span>";
      if(pv&&inc(pv)){var c=(inc(t)-inc(pv))/inc(pv)*100;yo='<span class="'+(c>=0?'up':'dn')+'">'+(c>=0?'+':'')+c.toFixed(1)+'%</span> <span class="muted small">income</span>'}
      return '<tr><td><b>'+y+'</b></td><td class="n">'+t[0]+'</td><td class="n">'+money(inc(t))+'</td><td class="n"><b>'+m2(avgOf(t))+'</b></td><td><div class="bar" style="width:'+Math.round(avgOf(t)/mx*100)+'%"></div></td><td class="n">'+yp[y]+'</td><td class="n">'+Math.round(t[0]/yp[y])+'</td><td class="n">'+money(t[5])+'</td><td class="n">'+yo+'</td></tr>'}).join("")+'</table></div></div>';
  }
  // preparer x year
  var pm={};asc.forEach(function(y){pm[y]=aggBy(recRows(y),function(r){return r.p})});
  var allp=aggBy(all,function(r){return r.p}),names=Object.keys(allp).sort(function(a,b){return inc(allp[b])-inc(allp[a])});
  h+='<div class="card"><div class="card-head"><h2>Average per return – theo Preparer</h2></div><div class="wrap"><table class="t2 mx"><tr><th>Preparer</th>'+(multi?asc.map(function(y){return '<th class="n">'+y+'</th>'}).join("")+'<th class="n">Tất cả</th>':'<th class="n">Clients</th><th class="n">Total Income</th><th class="n">Average per return</th><th style="width:26%"></th><th class="n">Tips</th><th class="n">Avg tip / client</th>')+'</tr>'+
    names.map(function(n){
      if(!multi){var a=allp[n];return '<tr><td>'+esc(n)+'</td><td class="n">'+a[0]+'</td><td class="n">'+money(inc(a))+'</td><td class="n"><b>'+m2(avgOf(a))+'</b></td><td><div class="bar" style="width:'+Math.round(avgOf(a)/Math.max(1,Math.max.apply(null,names.map(function(k){return avgOf(allp[k])})))*100)+'%"></div></td><td class="n">'+money(a[5])+'</td><td class="n">'+m2(a[0]?a[5]/a[0]:0)+'</td></tr>'}
      return '<tr><td>'+esc(n)+'</td>'+asc.map(function(y){var a=pm[y][n];return '<td class="n">'+(a?'<b>'+m2(avgOf(a))+'</b><small>'+a[0]+' clients</small>':'<span class="muted">–</span>')+'</td>'}).join("")+'<td class="n"><b>'+m2(avgOf(allp[n]))+'</b><small>'+allp[n][0]+' clients</small></td></tr>'}).join("")+
    (multi?'<tr style="font-weight:700"><td>All</td>'+asc.map(function(y){return '<td class="n">'+m2(avgOf(yt[y]))+'<small>'+yt[y][0]+' clients</small></td>'}).join("")+'<td class="n">'+m2(avgOf(T))+'<small>'+T[0]+' clients</small></td></tr>':'')+'</table></div></div>';
  // by month
  var mm={};asc.forEach(function(y){mm[y]=aggBy(recRows(y),function(r){var yr=+r.d.slice(0,4),m=+r.d.slice(5,7);return yr>y+1?13:m})});
  var months=[];for(var i=1;i<=13;i++){if(asc.some(function(y){return mm[y][i]}))months.push(i)}
  h+='<div class="card"><div class="card-head"><h2>Theo tháng nộp</h2></div><div class="wrap"><table class="t2 mx"><tr><th>Tháng</th>'+(multi?asc.map(function(y){return '<th class="n">'+y+'<small>income · clients · avg</small></th>'}).join(""):'<th class="n">Clients</th><th class="n">Total Income</th><th class="n">Average per return</th><th class="n">Tips</th>')+'</tr>'+
    months.map(function(i){return '<tr><td>'+MON[i-1]+'</td>'+(multi?asc.map(function(y){var a=mm[y][i];return '<td class="n">'+(a?money(inc(a))+'<small>'+a[0]+' · '+m2(avgOf(a))+'</small>':'<span class="muted">–</span>')+'</td>'}).join(""):(function(){var a=mm[asc[0]][i];return a?'<td class="n">'+a[0]+'</td><td class="n">'+money(inc(a))+'</td><td class="n"><b>'+m2(avgOf(a))+'</b></td><td class="n">'+money(a[5])+'</td>':'<td></td><td></td><td></td><td></td>'})())+'</tr>'}).join("")+'</table></div></div>';
  h+='<div class="muted small">Average per return = Total Income ÷ Clients · Refund trừ vào Total Income, không tính là client · Tips không nằm trong Total Income.</div>';
  return h;
}
function recPrep(ys){
  var asc=ys.slice().sort(),tot={};asc.forEach(function(y){recRows(y).forEach(function(r){tot[r.p]=(tot[r.p]||0)+r.a[1]+r.a[2]+r.a[3]+r.a[4]})});
  var names=Object.keys(tot).sort(function(a,b){return tot[b]-tot[a]});
  if(names.indexOf(S.recPrep)<0)S.recPrep=names[0];
  var P=S.recPrep,h='<div style="margin-bottom:16px"><span class="muted">Preparer</span> <select id="rpSel">'+names.map(function(n){return '<option'+(n===P?' selected':'')+'>'+esc(n)+'</option>'}).join("")+'</select> <span class="muted small">Bấm tên preparer ở tab Summary cũng mở thẳng tab này</span></div>';
  var per={},all=[];asc.forEach(function(y){var r=recRows(y).filter(function(x){return x.p===P});per[y]=sumArr(aggBy(r,function(){return 1}));all=all.concat(r)});
  var T=sumArr(aggBy(all,function(){return 1}));
  h+='<div class="statbar" style="margin-bottom:22px"><div class="c"><b>'+T[0]+'</b><span>Total clients</span></div><div class="c"><b>'+money(inc(T))+'</b><span>Total Income</span></div><div class="c"><b>'+m2(avgOf(T))+'</b><span>Average per return</span></div><div class="c"><b>'+m2(T[0]?T[5]/T[0]:0)+'</b><span>Average tip per client</span></div></div>';
  var mxa=Math.max.apply(null,asc.map(function(y){return avgOf(per[y])}).concat([1]));
  h+='<div class="card"><div class="card-head"><h2>'+esc(P)+' – theo năm</h2></div><div class="wrap"><table class="t2"><tr><th>Năm</th><th class="n">Clients</th><th class="n">Total Income</th><th class="n">Average per return</th><th style="width:24%"></th><th class="n">EF</th><th class="n">Accepted</th><th class="n">Others</th><th class="n">Tips</th></tr>'+
    asc.map(function(y){var a=per[y],k=(a[6]+a[7]+a[8])>0,d=function(i){return k?a[i]:'<span class="muted">–</span>'};
      return a[0]?'<tr><td><b>'+y+'</b></td><td class="n">'+a[0]+'</td><td class="n">'+money(inc(a))+'</td><td class="n"><b>'+m2(avgOf(a))+'</b></td><td><div class="bar" style="width:'+Math.round(avgOf(a)/mxa*100)+'%"></div></td><td class="n">'+d(6)+'</td><td class="n">'+d(7)+'</td><td class="n">'+d(8)+'</td><td class="n">'+money(a[5])+'</td></tr>':'<tr><td><b>'+y+'</b></td><td colspan="8" class="muted">Không có hồ sơ trong năm này</td></tr>'}).join("")+'</table></div></div>';
  var mm={};asc.forEach(function(y){mm[y]=aggBy(recRows(y).filter(function(x){return x.p===P}),function(r){var yr=+r.d.slice(0,4),m=+r.d.slice(5,7);return yr>y+1?13:m})});
  var months=[];for(var i=1;i<=13;i++){if(asc.some(function(y){return mm[y][i]}))months.push(i)}
  var multi=asc.length>1;
  h+='<div class="card"><div class="card-head"><h2>'+esc(P)+' – theo tháng nộp</h2></div><div class="wrap"><table class="t2 mx"><tr><th>Tháng</th>'+(multi?asc.map(function(y){return '<th class="n">'+y+'<small>income · clients · avg</small></th>'}).join(""):'<th class="n">Clients</th><th class="n">Total Income</th><th class="n">Average per return</th>')+'</tr>'+
    months.map(function(i){return '<tr><td>'+MON[i-1]+'</td>'+(multi?asc.map(function(y){var a=mm[y][i];return '<td class="n">'+(a?money(inc(a))+'<small>'+a[0]+' · '+m2(avgOf(a))+'</small>':'<span class="muted">–</span>')+'</td>'}).join(""):(function(){var a=mm[asc[0]][i];return '<td class="n">'+a[0]+'</td><td class="n">'+money(inc(a))+'</td><td class="n"><b>'+m2(avgOf(a))+'</b></td>'})())+'</tr>'}).join("")+'</table></div></div>';
  return h;
}

/* ================= Attention ================= */
function attn(){
  var L={a:[],b:[],c:[],d:[],e:[]};
  allRows().forEach(function(x){var r=x.r,n=daysSince(r.date);
    var o={name:r.name,who:x.s.name,date:r.date,days:n,esign:r.esign,amt:r.amt,status:r.status};
    if(!r.status&&r.name&&n>4)L.a.push(o);
    if(r.status==="Rejected")L.b.push(o);
    if(r.status==="Hold"&&n>30)L.c.push(o);
    if(r.online&&!r.paid)L.d.push(o);
    if(r.status==="Refund")L.e.push(o);
  });
  ["a","b","c"].forEach(function(k){L[k].sort(function(p,q){return q.days-p.days})});
  L.total=L.a.length+L.b.length+L.c.length+L.d.length;return L;
}
function pageAttn(){
  var L=attn();
  function box(t,arr,cols,fn){return '<div class="card"><div class="card-head"><h2>'+t+' <span class="pill">'+arr.length+'</span></h2></div><div class="wrap"><table class="t2"><tr>'+cols.map(function(c,i){return '<th'+(c==="Amount"||c==="Days"?' class="n"':'')+'>'+c+'</th>'}).join("")+'</tr>'+(arr.length?arr.slice(0,15).map(fn).join(""):'<tr><td colspan="'+cols.length+'" class="muted">Không có hồ sơ nào</td></tr>')+'</table></div></div>'}
  var std=function(o){return '<tr><td>'+esc(o.name)+'</td><td>'+esc(o.who)+'</td><td>'+md(o.date)+'</td><td class="n red">'+o.days+'</td></tr>'};
  var h='<div class="page-head"><div><h1>Attention</h1><div class="sub">Hồ sơ cần xử lý · tính từ ngày làm hồ sơ · mỗi mục hiện 15 hồ sơ lâu nhất</div></div></div><div class="grid2">';
  h+=box("Chưa e-file · quá 4 ngày",L.a,["Name","Preparer","Date","Days"],std);
  h+=box("Rejected",L.b,["Name","Preparer","Date","Days"],std);
  h+=box("Hold · quá 30 ngày",L.c,["Name","Preparer","Date","Days"],std);
  h+=box("Still waiting for Online files",L.d,["Name","Preparer","E-sign","Amount"],function(o){return '<tr><td>'+esc(o.name)+'</td><td>'+esc(o.who)+'</td><td>'+(o.esign?"Đã ký":'<span class="red">Chưa ký</span>')+'</td><td class="n">'+money(o.amt)+'</td></tr>'});
  h+=box("Refunds",L.e,["Name","Preparer","Date","Amount"],function(o){return '<tr><td>'+esc(o.name)+'</td><td>'+esc(o.who)+'</td><td>'+md(o.date)+'</td><td class="n">'+money(-Math.abs(o.amt))+'</td></tr>'});
  return h+'</div>';
}

/* ================= Fees ================= */
function tierRows(t){var v=t[2]||[];return (v.length&&Array.isArray(v[0]))?v:[["Fees",v]]}
function groupByFee(items){var g=[],idx={};items.forEach(function(r){if(!(r[1] in idx)){idx[r[1]]=g.length;g.push({fee:r[1],items:[]})}g[idx[r[1]]].items.push(r)});return g}
S.feeSub="fees";
function feeLookup(name){var out=null;S.fees.forEach(function(g){g[1].forEach(function(r){if(r[0]===name)out=r[1]})});return out}
function pageFees(){
  var subs='<div class="sub-tabs"><button class="btn'+(S.feeSub==="fees"?' on':'')+'" data-fsub="fees">Fees</button><button class="btn'+(S.feeSub==="eic"?' on':'')+'" data-fsub="eic">EIC fee estimate</button></div>';
  if(S.feeSub==="eic")return '<div class="page-head"><div><h1>Fees</h1><div class="sub">Ước tính EIC liên bang và California, rồi tính phí EIC theo bảng Fees</div></div></div>'+subs+'<div id="eicHost"></div>';
  var q=S.feeQ.toLowerCase();
  var h='<div class="page-head"><div><h1>Fees</h1><div class="sub">Phí khai thuế, gom theo mức phí · n = số lượng của mục đó · Admin sửa từng mục ở Settings &gt; Fees</div></div><input type="text" id="feeQ" placeholder="Gõ tên form (VD: HSA, rentals, EIC…)" value="'+esc(S.feeQ)+'" style="width:290px"></div>';
  h+=subs;
  if(q){var hits=[];S.fees.forEach(function(g){g[1].forEach(function(r){if((r[0]+" "+r[2]).toLowerCase().indexOf(q)>=0)hits.push(r)})});
    h+='<div class="notice">'+(hits.length?hits.map(function(r){return '<b>'+esc(r[0])+'</b> → <b>'+esc(r[1])+'</b>'+(r[2]?' <span class="muted">('+esc(r[2])+')</span>':'')}).join('<br>'):'Không thấy mục nào khớp')+'</div>'}
  var hit=function(r){return q&&(r[0]+" "+r[2]).toLowerCase().indexOf(q)>=0};
  var item=function(r){return '<span class="fi'+(hit(r)?' hit':'')+'">'+esc(r[0])+(r[2]?' <small>· '+esc(r[2])+'</small>':'')+(/disclaimer/i.test(r[2])?' <a href="#" data-disc>Click here to view disclaimer</a>':'')+'</span>'};
  var horiz=[];
  S.fees.forEach(function(g){
    if(g[0]==="EIC & CTC"){
      var by={};g[1].forEach(function(r){by[r[0]]=r[1]});var v=function(n){return esc(by[n]||"—")};
      horiz.push('<div class="fsec"><h3>EIC &amp; CTC</h3><div class="wrap"><table class="xl"><tr><th></th><th>Không con</th><th>1 con</th><th>2 con trở lên</th><th>+ CTC (bé dưới 17 tuổi)</th></tr><tr><td>EIC</td><td>'+v("EIC – không con")+'</td><td>'+v("EIC – 1 con")+'</td><td>'+v("EIC – 2 con trở lên")+'</td><td>'+v("CTC – bé dưới 17 tuổi")+'</td></tr></table></div></div>');
      return;
    }
    if(/^amendment/i.test(g[0])){
      horiz.push('<div class="fsec"><h3>'+esc(g[0])+'</h3><div class="wrap"><table class="xl"><tr><th></th>'+g[1].map(function(r){return '<th'+(hit(r)?' class="hit"':'')+'>'+esc(r[0])+'</th>'}).join("")+'</tr><tr><td>Fees</td>'+g[1].map(function(r){return '<td>'+esc(r[1])+'</td>'}).join("")+'</tr></table></div></div>');
      return;
    }
    h+='<div class="fsec"><h3>'+esc(g[0])+'</h3><table class="ft"><tr><th class="fee">Fees</th><th>Áp dụng cho</th></tr>'+groupByFee(g[1]).map(function(x){
      return '<tr><td class="fee">'+esc(x.fee)+'</td><td>'+x.items.map(item).join('<span class="sep">, </span>')+'</td></tr>'}).join("")+'</table></div>'});
  if(horiz.length)h+='<div class="fpair">'+horiz.join("")+'</div>';
  S.feeTiers.forEach(function(t){var rows=tierRows(t),n=t[1].length,note="";
    h+='<div class="fsec"><h3>'+esc(t[0])+'</h3><div class="wrap"><table class="xl"><tr><th>Income</th>'+t[1].map(function(c){return '<th>'+esc(c)+'</th>'}).join("")+'</tr>'+rows.map(function(r){
      if(!r[1].length){note+='<div class="fnote">'+esc(r[0])+'</div>';return ''}
      return '<tr><td>'+esc(r[0])+'</td>'+r[1].map(function(c){return '<td>'+esc(c)+'</td>'}).join("")+'</tr>'}).join("")+'</table></div>'+note+'</div>'});
  return h;
}

/* ================= Staff tab ================= */
function onlineInner(r,dis){var d=dis?' disabled':'';return '<div class="onl"><label><input type="checkbox" data-f="online"'+(r.online?' checked':'')+d+' style="width:auto"> Online</label>'+(r.online?'<div class="sub"><label><input type="checkbox" data-f="esign"'+(r.esign?' checked':'')+d+' style="width:auto"> E-sign</label><label><input type="checkbox" data-f="paid"'+(r.paid?' checked':'')+d+' style="width:auto"> Paid'+(r.paid&&r.paidDate?' <span class="muted">'+md(r.paidDate)+'</span>':'')+'</label></div>':'')+'</div>'}
function actInner(i,r,can){if(!can||isBlank(r))return '';return (r.status==="Accepted"?'<span class="lock" title="Đã Accepted: mọi thay đổi được ghi log cho Admin">🔒</span> ':'')+'<button class="btn sm del" data-del="'+i+'" title="'+(r.status==="Accepted"?'Xóa dòng (có ghi log)':'Xóa dòng')+'">×</button>'}
function decorate(id){
  var rows=S.rows[id],trs=$$("table.sheet tr[data-i]"),prev=null,grp=0,sums={};
  trs.forEach(function(tr){var r=rows[+tr.getAttribute("data-i")];if(r.date)sums[r.date]=(sums[r.date]||0)+amt(r)});
  trs.forEach(function(tr){var r=rows[+tr.getAttribute("data-i")],rep=prev&&prev.date===r.date;if(!rep)grp++;
    tr.className=(r.date&&grp%2?"g1 ":"")+(rep?"rep ":"")+"s-"+r.status.replace(" ","");
    tr.querySelector("td.sumc").textContent=(!rep&&r.date)?money(sums[r.date]):"";prev=r});
  var cnt=0,tip=0,tot=0,wait=0,wn=0;
  rows.forEach(function(r){if(r.deleted)return;if(r.name&&r.status!=="Refund")cnt++;tip+=r.tip;tot+=amt(r);if(bucket(r)==="wt"&&!isBlank(r)){wait+=r.amt;wn++}});
  var set=function(k,v){var e=$("#"+k);if(e)e.textContent=v};
  set("st-cnt",cnt);set("st-tot",money(tot));set("st-tip",money(tip));set("st-wait",money(wait));set("st-wl","Still waiting for Online files · "+wn+" files");
}
function pageStaff(id){
  var s=sById(id),th=s.theme,can=canEditTab(id),rows=S.rows[id];
  var dis=can?'':' disabled';
  var h='<div style="'+themeVars(th)+'">';
  h+='<div class="banner"><div><h2 class="nm" style="font-family:\''+th.font+'\',cursive,sans-serif">'+esc(th.title)+'</h2><div class="tg">'+(th.tag?esc(th.tag):'<span class="muted">Chưa có lời nhắn · bấm Sửa banner để thêm</span>')+'</div><div style="margin-top:8px"><button class="btn sm" id="cust">Sửa banner</button></div></div>'+
    '<div class="statbar"><div class="c"><b id="st-cnt">0</b><span>Clients</span></div><div class="c"><b id="st-tot">$0</b><span>Total Income</span></div><div class="c"><b id="st-tip">$0</b><span>Tips</span></div><div class="c k-wait"><b id="st-wait">$0</b><span id="st-wl">Still waiting for Online files</span></div></div></div>';
  if(!can)h+='<div class="ro">Chỉ xem – bạn không có quyền sửa tab này</div>';
  h+='<div class="wrap"><table class="sheet"><tr><th class="w1">Date</th><th class="n w1">Sum</th><th>Name</th><th class="w1">SSN</th><th class="w1">Status</th><th class="n w1">Tiền</th><th class="w1">Method</th><th class="w1">Online</th><th>Notes</th><th class="n w1">Tips</th>'+(can?'<th></th>':'')+'</tr>';
  rows.forEach(function(r,i){
    if(r.deleted)return;
    h+='<tr data-i="'+i+'">'+
    '<td class="dt"><input type="text" data-f="date" inputmode="numeric" maxlength="10" placeholder="mmddyy" value="'+mdyShort(r.date)+'"'+dis+'></td><td class="sumc"></td>'+
    '<td><input type="text" data-f="name" value="'+esc(r.name)+'"'+dis+'></td>'+
    '<td><input type="text" data-f="ssn" maxlength="4" inputmode="numeric" value="'+esc(r.ssn)+'" placeholder="4 số"'+dis+'></td>'+
    '<td class="st2"><select data-f="status"'+dis+'>'+STATUS.map(function(o){return '<option value="'+o+'"'+(o===r.status?' selected':'')+'>'+(o||'—')+'</option>'}).join("")+'</select></td>'+
    '<td class="n"><input type="number" data-f="amt" value="'+(r.amt||'')+'" style="text-align:right"'+dis+'></td>'+
    '<td><select data-f="method"'+dis+'>'+METHODS.map(function(o){return '<option'+(o===r.method?' selected':'')+'>'+o+'</option>'}).join("")+'</select></td>'+
    '<td class="onc">'+onlineInner(r,!can)+'</td>'+
    '<td><input type="text" data-f="note" value="'+esc(r.note)+'"'+dis+'></td>'+
    '<td class="n"><input type="number" data-f="tip" value="'+(r.tip||'')+'" style="text-align:right"'+dis+'></td>'+
    (can?'<td class="act" style="white-space:nowrap">'+actInner(i,r,true)+'</td>':'')+'</tr>';
  });
  h+='</table></div>';
  if(can)h+='<p style="margin-top:14px"><button class="btn" id="addRows">+ 50 dòng</button> <span class="muted small">Gõ thẳng vào dòng trống, hết dòng thì bấm thêm</span></p>';
  h+='<div class="legend">Date gõ mmddyy (021527 = 02/15/27, gõ 4 số 0215 = năm nay) · Dòng trống tự nhận ngày của dòng trên khi bạn gõ · Method mặc định Cash · tick Online để hiện E-sign và Paid · Online mà chưa Paid → tính vào Still waiting for Online files · SSN chỉ nhập 4 số cuối · 🔒 Accepted: mọi thay đổi và mọi lần xóa sau khi Accepted đều được ghi log cho Admin · hồ sơ chưa Accepted xóa luôn, không hỏi</div></div>';
  return h;
}
var FIELD_LABEL={date:"Date",status:"Status",name:"Name",ssn:"SSN",amt:"Tiền",method:"Method",online:"Online",esign:"E-sign",paid:"Paid",note:"Notes",tip:"Tips"};

/* ================= Staff tab: editing ================= */
function bindStaff(id){
  var rows=S.rows[id],t=sById(id),tbl=$("table.sheet");
  decorate(id);
  tbl.onchange=function(e){
    var el=e.target,f=el.getAttribute("data-f");if(!f)return;
    var tr=el.closest("tr"),i=+tr.getAttribute("data-i"),r=rows[i],old=r[f],v;
    if(el.type==="checkbox")v=el.checked;else if(el.type==="number")v=parseFloat(el.value)||0;else v=el.value;
    if(f==="date"){v=parseMDY(v);if(v===null){toast("Date gõ mmddyy, ví dụ 021527 = 02/15/27",true);el.value=mdyShort(old);return}el.value=mdyShort(v)}
    if(f==="name")v=titleCase(v);
    if(f==="ssn"&&!/^\d{0,4}$/.test(v)){toast("SSN chỉ nhập đúng 4 số cuối.",true);el.value=old;return}
    if(old===v)return;
    var fields={};fields[f]=v;
    r[f]=v;
    if(f==="paid")r.paidDate=v?todayISO():"";
    if(f==="online"&&!v){r.esign=false;r.paid=false;r.paidDate="";fields.esign=false;fields.paid=false}
    if(!r.date&&v&&(f==="name"||f==="amt"||f==="status")){var d="";for(var k=i-1;k>=0;k--){if(rows[k].date){d=rows[k].date;break}}r.date=d||todayISO();fields.date=r.date}
    tr.querySelector('[data-f="date"]').value=mdyShort(r.date);
    if(f==="name")el.value=r.name;
    if(f==="online"||f==="esign"||f==="paid"){tr.querySelector("td.onc").innerHTML=onlineInner(r,false);var again=tr.querySelector('td.onc [data-f="'+f+'"]');if(again)again.focus()}
    var ac=tr.querySelector("td.act");if(ac)ac.innerHTML=actInner(i,r,true);
    decorate(id);
    saveRow(id,i,fields);
  };
  tbl.onclick=function(e){var b=e.target.closest("[data-del]");if(!b)return;
    var i=+b.getAttribute("data-del"),r=rows[i];
    if(r.status==="Accepted"&&!confirm("Hồ sơ “"+(r.name||"(trống)")+"” đã Accepted. Xóa? Việc xóa sẽ được ghi log cho Admin (Admin có thể khôi phục)."))return;
    (r._q||Promise.resolve()).then(function(){return r.id?api("DELETE","/rows/"+r.id):null}).then(function(){if(r.id)delete S.idx[r.id];rows[i]=blank(i);render()}).catch(fail)};
  var ar=$("#addRows");if(ar)ar.onclick=function(){api("POST","/tabs/"+t.dbId+"/extend").then(function(d){t.sheetLen=d.sheet_len;while(rows.length<t.sheetLen)rows.push(blank(rows.length));render()}).catch(fail)};
  if($("#cust"))$("#cust").onclick=function(){openCustomize(id)};
}
function openCustomize(id){
  var s=sById(id),t=s.theme,m=$("#modalHost");
  m.innerHTML='<div class="modal"><div class="box"><h3>Customize tab “'+esc(s.name)+'”</h3><div class="f"><label>Tiêu đề</label><input type="text" id="ct" value="'+esc(t.title)+'">'+
    '<label>Lời nhắn</label><input type="text" id="cg" value="'+esc(t.tag)+'" placeholder="Tùy chọn">'+
    '<label>Font tiêu đề</label><select id="cf">'+FONTS.map(function(f){return '<option'+(f===t.font?' selected':'')+' style="font-family:\''+f+'\'">'+f+'</option>'}).join("")+'</select>'+
    '<label>Màu</label><div id="csw">'+Object.keys(PALETTE).map(function(k){return '<span class="sw'+(k===t.color?' on':'')+'" data-c="'+k+'" title="'+k+'" style="background:'+PALETTE[k]+'"></span>'}).join("")+'</div></div>'+
    '<div class="muted small" style="margin-bottom:12px">Chỉ đổi phần banner và màu tab. Ai cũng sửa được. Bảng dữ liệu giữ chung một font cho đều.</div>'+
    '<div class="row-end"><button class="btn" id="cc">Hủy</button><button class="btn pri" id="cs">Lưu</button></div></div></div>';
  var pick=t.color;
  $$("#csw .sw").forEach(function(sw){sw.onclick=function(){pick=sw.getAttribute("data-c");$$("#csw .sw").forEach(function(x){x.classList.remove("on")});sw.classList.add("on")}});
  $("#cc").onclick=function(){m.innerHTML=""};
  $("#cs").onclick=function(){
    api("PATCH","/tabs/"+s.dbId,{title:$("#ct").value||s.name,tagline:$("#cg").value,font:$("#cf").value,color:pick}).then(function(o){t.title=o.title;t.tag=o.tagline;t.font=o.font;t.color=o.color;m.innerHTML="";render()}).catch(fail)};
}

/* ================= Appointment: actions ================= */
function coverMap(who,d,except){var slots=slotsFor(who),cov={};Object.keys(S.bookings).forEach(function(k){var p=k.split("|");if(p[0]!==who||p[1]!==d||k===except)return;var si=slots.indexOf(toMin(p[2]));if(si<0)return;var sp=Math.max(1,S.bookings[k].span||1);for(var i=si;i<si+sp&&i<slots.length;i++)cov[i]=k});return cov}
function canPlace(who,d,time,span,except){if(colInfo(who,d))return "Ngày đó đang nghỉ.";var slots=slotsFor(who),si=slots.indexOf(toMin(time));if(si<0)return "Giờ đó không có trong lịch.";if(si+span>slots.length)return "Không đủ chỗ ở khung giờ đó.";var cov=coverMap(who,d,except);for(var i=si;i<si+span;i++)if(cov[i])return "Không đủ chỗ ở khung giờ đó.";return ""}
function renderKeep(){var y=window.scrollY,x=window.scrollX,w=$(".week")&&$(".week").parentNode,wl=w?w.scrollLeft:0;render();window.scrollTo(x,y);var w2=$(".week")&&$(".week").parentNode;if(w2)w2.scrollLeft=wl}
function bkSnap(wk){var o={};Object.keys(S.bookings).forEach(function(k){var d=k.split("|")[1];if(d>=wk&&d<=addDays(wk,6))o[k]=S.bookings[k]});return JSON.stringify(o)}
var _wkReq={};S.bkWeeks={};
function refreshWeek(wk){wk=wk||S.weekStart;var me=_wkReq[wk]=(_wkReq[wk]||0)+1;
  return api("GET","/bookings?from="+wk+"&to="+addDays(wk,6)).then(function(list){if(me!==_wkReq[wk])return;var first=!S.bkWeeks[wk];S.bkWeeks[wk]=true;
    var before=bkSnap(wk);
    Object.keys(S.bookings).forEach(function(k){var d=k.split("|")[1];if(d>=wk&&d<=addDays(wk,6))delete S.bookings[k]});
    list.forEach(function(b){S.bookings[b.cal+"|"+b.date+"|"+b.slot]={n:b.n,p:b.p,f:b.f,s:b.s,note:b.note,span:b.span,id:b.id}});
    if((first||bkSnap(wk)!==before)&&S.page==="appt"&&S.apptSub!=="Work Schedule"&&S.weekStart===wk&&!uiBusy()&&!S._dk)renderKeep();
  }).catch(function(){})}
/* load this week, then the weeks around it so ‹ › open instantly */
function ensureWeeks(){var wk=S.weekStart;
  (S.bkWeeks[wk]?Promise.resolve():refreshWeek(wk)).then(function(){[addDays(wk,7),addDays(wk,-7)].forEach(function(w){if(!S.bkWeeks[w])refreshWeek(w)})})}
function reloadWeek(){return refreshWeek()}
/* optimistic: show the change now, save in the background, re-sync on error */
function localMove(ok,nk,nb){if(ok&&ok!==nk)delete S.bookings[ok];S.bookings[nk]=nb;renderKeep()}
function apiSaveBooking(cal,day,slot,b,old){
  return api("POST","/bookings/save",{cal:cal,day:day,slot:slot,client:b.n,phone:b.p,files:b.f,preparer:b.s||"",note:b.note||"",span:b.span||1,old:old||null});
}
function moveBooking(ok,nk){
  var bk=S.bookings[ok],o=ok.split("|"),n=nk.split("|");if(!bk||o[0]!==n[0])return;
  var er=canPlace(n[0],n[1],n[2],Math.max(1,bk.span||1),ok);if(er){toast(er,true);return}
  if(bk.s&&!availPrep(bk.s,n[1],n[2])&&!confirm(bk.s+" không có lịch đi làm vào giờ này. Vẫn chuyển hẹn sang giờ này?"))return;
  localMove(ok,nk,Object.assign({},bk));
  apiSaveBooking(n[0],n[1],n[2],bk,{cal:o[0],day:o[1],slot:o[2]}).then(reloadWeek).catch(function(e){fail(e);reloadWeek()});
}
function bindAppt(){
  $$("[data-sub]").forEach(function(b){b.onclick=function(){S.apptSub=b.getAttribute("data-sub");render()}});
  if($("#pw")){$("#pw").onclick=function(){S.weekStart=addDays(S.weekStart,-7);render();refreshWeek()};$("#nw").onclick=function(){S.weekStart=addDays(S.weekStart,7);render();refreshWeek()}}
  if($("#apFont"))$("#apFont").onchange=function(){var v=this.value;api("PUT","/prefs",{appt_font:v}).then(function(){S.me.appt_font=v;render()}).catch(fail)};
  var clr=function(){$$("td.pre").forEach(function(x){x.classList.remove("pre")})};
  $$("td.c").forEach(function(td){
    td.onclick=function(){if(Date.now()-(S._drag||0)<400)return;var k=td.getAttribute("data-k");openBooking(k,k.split("|"))};
    td.ondragover=function(e){if(S._dk){e.preventDefault();clr();td.classList.add("pre")}};
    td.ondrop=function(e){e.preventDefault();var ok=S._dk;S._dk=null;clr();if(!ok)return;var nk=td.getAttribute("data-k");if(nk===ok)return;S._drag=Date.now();moveBooking(ok,nk)};
  });
  $$("td.bk").forEach(function(td){td.draggable=true;
    td.ondragstart=function(e){S._dk=td.getAttribute("data-k");e.dataTransfer.setData("text/plain",S._dk);e.dataTransfer.effectAllowed="move"};
    td.ondragend=function(){S._dk=null;clr()}});
  $$("[data-bx]").forEach(function(x){
    x.onmousedown=function(e){e.stopPropagation()};
    x.onclick=function(e){e.stopPropagation();e.preventDefault();var k=x.getAttribute("data-bx"),p=k.split("|"),bk=S.bookings[k];if(!bk)return;
      if(!confirm("Xóa hẹn "+bk.n+" ("+p[0]+" · "+mdy(p[1])+" · "+p[2]+")?"))return;
      delete S.bookings[k];renderKeep();
      api("DELETE","/bookings?cal="+p[0]+"&day="+p[1]+"&slot="+p[2]).then(reloadWeek).catch(function(er){fail(er);reloadWeek()})}});
  $$(".rz").forEach(function(z){
    z.onclick=function(e){e.stopPropagation()};
    z.onpointerdown=function(e){e.stopPropagation();e.preventDefault();
      var td=z.parentNode;td.draggable=false;
      var key=td.getAttribute("data-k"),p=key.split("|"),who=p[0],d=p[1],si0=+td.parentNode.getAttribute("data-si"),bk=S.bookings[key],slots=slotsFor(who);
      var rows=$$("table.week tr[data-si]"),target=si0+(bk.span||1)-1;
      try{z.setPointerCapture(e.pointerId)}catch(x){}
      function idxAt(y){var best=target;rows.forEach(function(r,i){var b=r.getBoundingClientRect();if(y>=b.top&&y<b.bottom)best=i});if(y>=rows[rows.length-1].getBoundingClientRect().bottom)best=rows.length-1;return Math.max(si0,best)}
      z.onpointermove=function(ev){target=idxAt(ev.clientY);clr();
        for(var i=si0+1;i<=target;i++){var c=rows[i].querySelector('td[data-k="'+who+'|'+d+'|'+hm(slots[i])+'"]');if(c)c.classList.add("pre")}};
      z.onpointerup=function(){S._drag=Date.now();var last=si0;
        for(var i=si0+1;i<=target;i++){if(S.bookings[who+"|"+d+"|"+hm(slots[i])])break;last=i}
        var nb=Object.assign({},bk,{span:last-si0+1});clr();
        if((bk.span||1)===nb.span){td.draggable=true;return}
        localMove(key,key,nb);
        apiSaveBooking(who,d,p[2],nb,{cal:who,day:d,slot:p[2]}).then(reloadWeek).catch(function(e2){fail(e2);reloadWeek()})};
      z.onpointercancel=function(){clr();td.draggable=true};
    }});
}
function openBooking(k,p){
  var ex=!!S.bookings[k],b=S.bookings[k]||{n:"",p:"",f:"",s:"",note:"",span:1},m=$("#modalHost"),off=p[0]==="Office";
  m.innerHTML='<div class="modal"><div class="box"><h3>'+p[0]+' · '+mdy(p[1])+' · '+p[2]+'</h3><div class="f">'+
    '<label>Client name <span class="req">*</span></label><input type="text" id="bn" value="'+esc(b.n)+'">'+
    '<label>Phone <span class="req">*</span></label><input type="text" id="bp" value="'+esc(b.p)+'" placeholder="714-000-0000">'+
    '<label>Files <span class="req">*</span></label><input type="number" id="bf" min="1" value="'+esc(b.f)+'" placeholder="1">'+
    (off?'<label>Preparer</label><select id="bs"><option value="">(optional)</option>'+S.prep.map(function(o){var ok=availPrep(o,p[1],p[2]);return '<option value="'+esc(o)+'"'+(o===b.s?' selected':'')+(ok?'':' class="dim" style="color:#aaa"')+'>'+esc(o)+'</option>'}).join("")+'</select>':'')+
    '<label>Notes</label><input type="text" id="bnote" value="'+esc(b.note)+'" placeholder="(optional)">'+
    (ex?'<label>Date</label><input type="date" id="bdt" value="'+p[1]+'"><label>Time</label><select id="btm">'+slotsFor(p[0]).map(function(x){return '<option'+(hm(x)===p[2]?' selected':'')+'>'+hm(x)+'</option>'}).join("")+'</select>':'')+
    '</div><div class="err" id="berr"></div><div class="row-end">'+(ex?'<button class="btn del" id="bdel">Xóa hẹn</button>':'')+'<button class="btn" id="bc">Hủy</button><button class="btn pri" id="bsv">Lưu</button></div></div></div>';
  $("#bc").onclick=function(){m.innerHTML=""};
  if($("#bs")){var dimSel=function(){var o=$("#bs").selectedOptions[0];$("#bs").style.color=o&&o.classList.contains("dim")?"#aaa":""};$("#bs").onchange=dimSel;dimSel()}
  if($("#bdel"))$("#bdel").onclick=function(){api("DELETE","/bookings?cal="+p[0]+"&day="+p[1]+"&slot="+p[2]).then(function(){m.innerHTML="";delete S.bookings[k];renderKeep();reloadWeek()}).catch(fail)};
  $("#bsv").onclick=function(){var n=$("#bn").value.trim(),ph=$("#bp").value.trim(),f=parseInt($("#bf").value,10);
    if(!n||!ph||!(f>0)){$("#berr").textContent="Cần điền Client name, Phone và Files.";return}
    var nd=$("#bdt")?$("#bdt").value:p[1],nt=$("#btm")?$("#btm").value:p[2],nk=p[0]+"|"+nd+"|"+nt,sp=$("#bs")?$("#bs").value:"";
    var nb={n:titleCase(n),p:ph,f:f,s:sp,note:$("#bnote").value.trim(),span:b.span||1};
    if(nk!==k){var er=canPlace(p[0],nd,nt,nb.span,k);if(er){$("#berr").textContent=er;return}}
    if(sp&&!availPrep(sp,nd,nt)&&!confirm(sp+" không có lịch đi làm vào giờ này. Vẫn đặt hẹn cho "+sp+"?"))return;
    var bsv=$("#bsv");bsv.disabled=true;
    apiSaveBooking(p[0],nd,nt,nb,ex?{cal:p[0],day:p[1],slot:p[2]}:null).then(function(b){m.innerHTML="";nb.id=b&&b.id;localMove(ex?k:null,nk,nb);reloadWeek()}).catch(function(e){bsv.disabled=false;$("#berr").textContent=e.message})};
}


function hm(m){return ("0"+Math.floor(m/60)).slice(-2)+":"+("0"+(m%60)).slice(-2)}
function toMin(t){var p=t.split(":");return +p[0]*60+ +p[1]}
function addDays(d,n){var x=new Date(d+"T00:00:00");x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)}
function slotsFor(who){var c=S.cal[who],a=[];for(var m=toMin(c.start);m<=toMin(c.last);m+=c.step)a.push(m);return a}
function isClosed(date,slot,who){var h=S.hours[new Date(date+"T00:00:00").getDay()];if(!h)return true;if(who!=="Office")return false;return slot<toMin(h[0])||slot>toMin(h[1])}
function blackoutFor(d,who){return S.blackouts.filter(function(b){return b.date===d&&(b.who==="all"||b.who===who)})[0]}
function dayKey(d){return ["sun","mon","tue","wed","thu","fri","sat"][new Date(d+"T00:00:00").getDay()]}
function findPeriod(d){return S.sched.filter(function(p){return d>=p.start&&d<=p.end})[0]}
function worksOn(name,d){var p=findPeriod(d);if(!p)return true;var r=p.rows.filter(function(x){return x.n===name})[0];if(!r)return true;return dayKey(d) in r.days}
function parseHrs(str){var m=/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\s*[–-]\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i.exec(str||"");if(!m)return null;
  function cv(h,mi,ap,isEnd,st){h=+h;mi=+(mi||0);if(ap){ap=ap.toUpperCase();if(ap==="PM"&&h<12)h+=12;if(ap==="AM"&&h===12)h=0}else{if(h<7)h+=12;if(isEnd&&h*60+mi<=st)h+=12}return h*60+mi}
  var a=cv(m[1],m[2],m[3],false,0),b=cv(m[4],m[5],m[6],true,a);return [a,b]}
function availPrep(name,d,time){var p=findPeriod(d);if(!p)return true;var r=p.rows.filter(function(x){return x.n===name})[0];if(!r)return false;var k=dayKey(d);if(!(k in r.days))return false;
  var hrs=r.days[k]?parseHrs(r.days[k]):(r.hrs?parseHrs(r.hrs):parseHrs(k==="sat"?p.sat:k==="sun"?(p.sun||""):p.week));if(!hrs)return true;var t=toMin(time);return t>=hrs[0]&&t<hrs[1]}
function colInfo(who,d){var b=blackoutFor(d,who);if(b)return {label:b.note||"Nghỉ"};
  if(!S.hours[new Date(d+"T00:00:00").getDay()])return {label:"Closed"};
  if((who==="Daniel"||who==="Peter")&&!worksOn(who,d))return {label:"Off"};return null}
var APPT_FONTS=[["Default","'Segoe UI',Arial,sans-serif"],["Nunito","Nunito,sans-serif"],["Quicksand","Quicksand,sans-serif"],["Montserrat","Montserrat,sans-serif"],["Comfortaa","Comfortaa,sans-serif"]];
function apFontName(){return (S.me&&S.me.appt_font)||"Default"}
function apFontName2(){return apFontName()}
function wrapFont(h){var f=APPT_FONTS.filter(function(x){return x[0]===apFontName()})[0]||APPT_FONTS[0];return '<div style="font-family:'+f[1]+'">'+h+'</div>'}
function pageAppt(){
  var who=S.apptSub,names=["Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7","CN"],days=[];for(var i=0;i<7;i++)days.push(addDays(S.weekStart,i));
  var h='<div class="page-head"><div><h1>Appointment</h1><div class="sub">Không gửi tin nhắn nhắc khách</div></div></div>';
  h+='<div class="sub-tabs">'+["Office","Daniel","Peter","Work Schedule"].map(function(n){return '<button class="btn'+(who===n?' on':'')+'" data-sub="'+n+'">'+n+'</button>'}).join("");
  if(who!=="Work Schedule")h+='<span style="width:16px"></span><button class="btn" id="pw">‹ Tuần trước</button><b>'+md(S.weekStart)+' – '+md(days[6])+'/'+days[6].slice(0,4)+'</b><button class="btn" id="nw">Tuần sau ›</button>'+(S.bkWeeks[S.weekStart]?'':'<span class="muted small">đang tải…</span>');
  h+='<span style="flex:1"></span><label class="small muted">Font <select id="apFont">'+APPT_FONTS.map(function(f){return '<option value="'+f[0]+'"'+(f[0]===apFontName()?' selected':'')+' style="font-family:'+f[1]+'">'+f[0]+'</option>'}).join("")+'</select></label></div>';
  if(who==="Work Schedule")return wrapFont(h+pageSchedule());
  h+='<div class="muted small" style="margin-bottom:8px">'+(who==="Office"?'Hiển thị: (Preparer) Client (số files), phone ở dòng dưới · ':'')+'* = có ghi chú (rê chuột để xem) · ô xám = ngoài giờ (vẫn đặt được) · cột đen = nghỉ cả ngày · kéo ô hẹn thả sang khung giờ khác (hoặc mở ô hẹn rồi đổi Date / Time)'+(who!=="Office"?' · <b>kéo thanh xanh ở cạnh dưới ô hẹn để kéo dài thêm slot</b>':'')+'</div>';
  var slots=slotsFor(who),skip={};
  h+='<div class="wrap"><table class="week"><tr><th></th>'+days.map(function(d,i){var ci=colInfo(who,d);skip[d]=0;return '<th class="'+(ci?'blk':'')+'">'+names[i]+'<small>'+md(d)+'</small></th>'}).join("")+'</tr>';
  slots.forEach(function(sl,si){h+='<tr data-si="'+si+'"><td class="t">'+hm(sl)+'</td>';
    days.forEach(function(d){var ci=colInfo(who,d);
      if(ci){if(si===0)h+='<td class="off" rowspan="'+slots.length+'"><span>'+esc(ci.label)+'</span></td>';return}
      if(skip[d]>0){skip[d]--;return}
      var key=who+"|"+d+"|"+hm(sl),bk=S.bookings[key],cl=isClosed(d,sl,who);
      var span=bk?Math.max(1,Math.min(bk.span||1,slots.length-si)):1;if(bk)skip[d]=span-1;
      var cls="c"+(bk?" bk":cl?" closed":"")+(bk&&cl?" extra":"");
      var star=bk&&bk.note?'<span class="star">*</span>':'',txt="";
      if(bk)txt=(bk.s?'('+esc(bk.s)+') ':'')+esc(bk.n)+' ('+bk.f+')'+star+'<br><span class="ph">'+esc(bk.p)+'</span>'+(span>1?'<span class="rg">'+hm(sl)+' – '+hm(sl+span*S.cal[who].step)+'</span>':'');
      h+='<td class="'+cls+'" data-k="'+key+'"'+(span>1?' rowspan="'+span+'"':'')+' title="'+(bk?esc((bk.s?bk.s+' · ':'')+bk.n+' '+bk.p+' · '+bk.f+' files'+(bk.note?' · '+bk.note:'')):'')+'">'+txt+(bk?'<button class="bx" data-bx="'+key+'" title="Xóa hẹn" draggable="false">×</button>':'')+(bk&&who!=="Office"?'<div class="rz" title="Kéo xuống để kéo dài"></div>':'')+'</td>'});
    h+='</tr>'});
  return wrapFont(h+'</table></div>');
}
function pageSchedule(){
  var dk=["mon","tue","wed","thu","fri","sat","sun"],dn=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],today=new Date().toISOString().slice(0,10);
  var h='<div class="sync"><span class="pill">Lịch đi làm của tax</span><span class="muted small">'+(isAdmin()?'Admin sửa ở Settings &gt; Work Schedule':'Chỉ xem · Admin sửa ở Settings')+'</span></div>';
  var nextDone=false;
  S.sched.slice().sort(function(a,b){return a.start<b.start?-1:1}).forEach(function(p){
    var tag="";if(today>=p.start&&today<=p.end)tag="This period";else if(p.start>today&&!nextDone){tag="Next period";nextDone=true}
    h+='<div class="card"><div class="card-head" style="display:block"><div><b>'+md(p.start)+' – '+mdy(p.end)+'</b> <span class="muted small">'+tag+'</span></div><div class="muted small">Mon–Fri '+esc(p.week)+' · Sat '+esc(p.sat)+(p.sun?' · Sun '+esc(p.sun):'')+'</div></div><div class="wrap"><table class="t2 sch"><tr><th></th>'+dn.map(function(d){return '<th>'+d+'</th>'}).join("")+'</tr>'+
    p.rows.map(function(r){return '<tr><td><b>'+esc(r.n)+'</b>'+(r.hrs?' <span class="muted small">'+esc(r.hrs)+'</span>':'')+(r.note?' <span class="muted small">'+esc(r.note)+'</span>':'')+'</td>'+dk.map(function(k,ki){return k in r.days?'<td class="on">'+dn[ki]+(r.days[k]?'<small>'+esc(r.days[k])+'</small>':'')+'</td>':'<td></td>'}).join("")+'</tr>'}).join("")+'</table></div></div>'});
  return h;
}

/* ================= Settings (Admin) ================= */
var saveTimers={};
function later(key,fn,ms){clearTimeout(saveTimers[key]);saveTimers[key]=setTimeout(fn,ms||500)}
function saveSched(){later("sched",function(){api("PUT","/sched",{periods:S.sched}).catch(fail)},400)}
function saveFees(){later("fees",function(){api("PUT","/fees",{fees:S.fees,tiers:S.feeTiers}).catch(fail)},600)}
function putSetting(key,value){return api("PUT","/settings/"+key,{value:value}).catch(fail)}
function pageSettings(){
  var subs=[["users","Users & quyền"],["tabs","Tab nhân viên"],["appt","Appointment & Blackout"],["sched","Work Schedule"],["fees","Fees"],["log","Activity log"],["backup","Backup"]];
  var h='<div class="page-head"><div><h1>Settings</h1><div class="sub">Chỉ Admin thấy mục này</div></div></div><div class="card" style="margin-bottom:20px"><h3 style="margin-bottom:6px">Thông báo trên Homepage</h3><input type="text" id="nt" value="'+esc(S.notice)+'" style="width:min(640px,100%)"> <button class="btn pri" id="nsv">Lưu</button></div><div class="sub-tabs">'+subs.map(function(x){return '<button class="btn'+(S.setSub===x[0]?' on':'')+'" data-ss="'+x[0]+'">'+x[1]+'</button>'}).join("")+'</div>';
  if(S.setSub==="users"){
    h+='<p class="muted small">Mỗi người có username riêng của tax.fsma.team. Mật khẩu tạm là 12345, mỗi người phải đổi ở lần đăng nhập đầu. Ngọc và Nina dùng chung tab Ngọc.</p><div class="wrap"><table class="t2"><tr><th>Username</th><th>Tên đầy đủ</th><th>Tên hiển thị</th><th>Quyền</th><th>Tab hồ sơ</th><th>Trạng thái</th><th></th></tr>'+
    S.users.map(function(u){return '<tr'+(u.active?'':' class="muted"')+'><td>'+esc(u.u)+'</td><td class="muted">'+esc(u.full)+'</td><td><input type="text" data-un="'+u.id+'" value="'+esc(u.n)+'" style="width:110px"></td><td><select data-ur="'+u.id+'">'+["Admin","Preparer"].map(function(r){return '<option'+(r===u.role?' selected':'')+'>'+r+'</option>'}).join("")+'</select></td><td><select data-ut="'+u.id+'"><option value="">(không có)</option>'+S.staff.map(function(x){return '<option value="'+x.id+'"'+(x.id===u.tab?' selected':'')+'>'+esc(x.name)+'</option>'}).join("")+'</select></td><td>'+(u.locked?'<span class="pill" style="background:var(--yellow)">Bị khóa</span> ':'')+(u.tmp?'<span class="pill" style="background:var(--yellow)">Mật khẩu tạm 12345</span>':'<span class="muted small">Đã đổi mật khẩu</span>')+(u.active?'':' <span class="pill">Đã tắt</span>')+'</td><td style="white-space:nowrap">'+(u.locked?'<button class="btn sm" data-unl="'+u.id+'">Mở khóa</button> ':'')+'<button class="btn sm" data-rpw="'+u.id+'">Reset password</button> <button class="btn sm" data-act="'+u.id+'">'+(u.active?'Tắt':'Bật')+'</button></td></tr>'}).join("")+'</table></div>'+
    '<h3 style="margin:20px 0 8px">Thêm user</h3><div class="rec-bar"><input type="text" id="nuu" placeholder="Username" style="width:130px"><input type="text" id="nuf" placeholder="Tên đầy đủ" style="width:190px"><input type="text" id="nud" placeholder="Tên hiển thị ngắn" style="width:140px"><select id="nur"><option>Preparer</option><option>Admin</option></select><select id="nut"><option value="">(không có tab)</option>'+S.staff.map(function(x){return '<option value="'+x.id+'">'+esc(x.name)+'</option>'}).join("")+'</select><button class="btn pri" id="nuadd">Thêm</button></div>'+
    '<p class="muted small">Admin: Settings, đổi tên/thêm/xóa tab, xem log và Records, sửa mọi tab · Preparer: sửa tab của mình, đặt hẹn, tìm khách. Ai cũng sửa được banner (tiêu đề, màu, font) của mọi tab. 5 lần nhập sai mật khẩu thì khóa 15 phút (tăng dần), Admin mở khóa ở đây.</p>';
  }
  if(S.setSub==="tabs"){
    h+='<p class="muted small">Chỉ Admin được đổi tên, thêm, xóa, sắp xếp tab. Nhân viên tự chỉnh màu/font/tiêu đề tab của mình bằng nút Sửa banner.</p><div class="wrap"><table class="t2"><tr><th>Thứ tự</th><th>Tên tab</th><th>Màu</th><th>Tiêu đề banner</th><th class="n">Hồ sơ</th><th></th></tr>'+
    S.staff.map(function(s,i){return '<tr><td><button class="btn sm" data-up="'+i+'">↑</button> <button class="btn sm" data-dn="'+i+'">↓</button></td><td><input type="text" data-sn="'+i+'" value="'+esc(s.name)+'" style="width:130px"></td><td><span class="sw" style="background:'+PALETTE[s.theme.color]+';cursor:default"></span> '+s.theme.color+'</td><td>'+esc(s.theme.title)+'</td><td class="n">'+live(s.id).length+'</td><td><button class="btn sm del" data-sx="'+i+'">Xóa tab</button></td></tr>'}).join("")+'</table></div><p><button class="btn pri" id="addS">+ Thêm tab nhân viên</button> <span class="muted small">Xóa tab = ẩn tab, dữ liệu vẫn còn trong database.</span></p>';
  }
  if(S.setSub==="appt"){
    h+='<div class="grid2"><div><h3>Giờ nhận hẹn Office</h3><table class="t2"><tr><th>Ngày</th><th>Từ</th><th>Hẹn cuối</th><th>Nghỉ</th></tr>'+
    [[1,"Thứ 2"],[2,"Thứ 3"],[3,"Thứ 4"],[4,"Thứ 5"],[5,"Thứ 6"],[6,"Thứ 7"],[0,"Chủ nhật"]].map(function(d){var x=S.hours[d[0]];return '<tr><td>'+d[1]+'</td><td><input type="time" data-ho="'+d[0]+'" value="'+(x?x[0]:"09:00")+'"'+(x?'':' disabled')+'></td><td><input type="time" data-hc="'+d[0]+'" value="'+(x?x[1]:"18:00")+'"'+(x?'':' disabled')+'></td><td><input type="checkbox" data-hx="'+d[0]+'"'+(x?'':' checked')+'></td></tr>'}).join("")+'</table></div>'+
    '<div><h3>Blackout</h3><table class="t2"><tr><th>Ngày</th><th>Áp dụng</th><th>Ghi chú</th><th></th></tr>'+S.blackouts.map(function(b){return '<tr><td>'+mdy(b.date)+'</td><td>'+(b.who==="all"?"Tất cả":b.who)+'</td><td>'+esc(b.note)+'</td><td><button class="btn sm del" data-bx="'+b.id+'">×</button></td></tr>'}).join("")+'</table><p><input type="date" id="bd"> <select id="bw"><option value="all">Tất cả</option><option>Office</option><option>Daniel</option><option>Peter</option></select> <input type="text" id="bnt" placeholder="Ghi chú" style="width:130px"> <button class="btn pri" id="bad">Thêm</button></p></div></div>'+
    '<h3 style="margin-top:22px">Giờ từng lịch</h3><table class="t2" style="max-width:560px"><tr><th>Lịch</th><th>Slot đầu</th><th>Hẹn cuối</th><th>Mỗi slot</th></tr>'+["Office","Daniel","Peter"].map(function(w){var c=S.cal[w];return '<tr><td>'+w+'</td><td><input type="time" data-cs="'+w+'" value="'+c.start+'"></td><td><input type="time" data-ce="'+w+'" value="'+c.last+'"></td><td><select data-cl="'+w+'"><option value="30"'+(c.step===30?' selected':'')+'>30 phút</option><option value="60"'+(c.step===60?' selected':'')+'>1 giờ</option></select></td></tr>'}).join("")+'</table>'+
    '<h3 style="margin-top:22px">Danh sách Preparer khi đặt hẹn Office</h3><input type="text" id="prl" value="'+esc(S.prep.join(", "))+'" style="width:min(420px,100%)"> <button class="btn" id="prs">Lưu</button> <span class="muted small">Cách nhau bằng dấu phẩy</span>'+
    '<p class="muted small">Appointment không có nhắc khách bằng tin nhắn nên không có mục Text.</p>';
  }
  var a=h.length;
  return h+SETTINGS_REST();
}
function SETTINGS_REST(){
  var h="";
  if(S.setSub==="sched"){h+=schedSettings()}
  if(S.setSub==="fees"){h+=feesSettings()}
  if(S.setSub==="log"){
    h+='<p class="muted small">Ghi lại: mọi thay đổi trên hồ sơ đã Accepted và mọi lần xóa hồ sơ (ai, lúc nào, trước → sau). Chỉ Admin xem được.</p>'+(S.logLoaded?'<div class="wrap"><table class="t2 log"><tr><th>Thời gian</th><th>Ai</th><th>Tab</th><th>Nội dung</th><th></th></tr>'+
    S.log.map(function(e){return '<tr><td style="white-space:nowrap">'+fmtTs(e.at)+'</td><td>'+esc(e.user)+'</td><td>'+esc(e.tab)+'</td><td>'+(e.kind==="delete"?'<span class="red">Xóa</span> ':'')+esc(e.text.replace(/^Xóa: /,""))+'</td><td>'+(e.kind==="delete"?(e.restored?'<span class="muted small">đã khôi phục</span>':'<button class="btn sm" data-rs="'+e.id+'">Khôi phục</button>'):'')+'</td></tr>'}).join("")+'</table></div>':'<div class="muted">Đang tải…</div>');
  }
  if(S.setSub==="backup")h+='<p>Tải file JSON của tất cả tab nhân viên, hẹn, blackout, settings, lịch làm việc, fees và log (không có mật khẩu). Có tên khách và 4 số SSN: giữ kín. Các năm cũ (Records) đã nằm sẵn trong database, không nằm trong file này.</p><button class="btn pri" id="bkdl">Download backup file</button><p class="muted small">Supabase Free không có backup tự động → tải mỗi tuần trong mùa thuế, hoặc lên Supabase Pro ($25/tháng).</p>';
  return h;
}
function schedSettings(){
  var dk=["mon","tue","wed","thu","fri","sat","sun"],dl=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],h="";
  h+='<div class="notice">Bấm ô để bật/tắt <b>ngày đi làm</b>. Bấm “Sửa” ở mỗi người để nhập <b>giờ</b> mặc định (VD 10-6:30) hoặc giờ riêng cho từng ngày (VD 11-5). Khi đặt hẹn Office, Preparer không có lịch ngày hoặc giờ đó sẽ bị mờ.</div>';
  S.sched.forEach(function(p,pi){
    h+='<div class="card"><div class="phead"><b>Period</b><label>Từ <input type="date" data-sp="'+pi+',start" value="'+p.start+'"></label><label>Đến <input type="date" data-sp="'+pi+',end" value="'+p.end+'"></label><label>Mon–Fri <input type="text" data-sp="'+pi+',week" value="'+esc(p.week)+'" style="width:112px"></label><label>Sat <input type="text" data-sp="'+pi+',sat" value="'+esc(p.sat)+'" style="width:112px"></label><label>Sun <input type="text" data-sp="'+pi+',sun" value="'+esc(p.sun||"")+'" placeholder="closed" style="width:112px"></label><span style="flex:1"></span><button class="btn sm del" data-spx="'+pi+'">Xóa period</button></div>'+
    '<div class="wrap"><table class="t2 sch"><tr><th style="min-width:200px">Name</th>'+dl.map(function(d){return '<th>'+d+'</th>'}).join("")+'<th></th></tr>'+
    p.rows.map(function(r,ri){return '<tr><td><b>'+esc(r.n)+'</b><div class="muted small">'+(r.hrs?'Giờ: '+esc(r.hrs):'')+(r.note?' · '+esc(r.note):'')+'</div></td>'+dk.map(function(k){var on=k in r.days;return '<td><button class="chipd'+(on?' on':'')+'" data-chip="'+pi+','+ri+','+k+'">'+(on?dl[dk.indexOf(k)]:'–')+(on&&r.days[k]?'<small>'+esc(r.days[k])+'</small>':'')+'</button></td>'}).join("")+'<td><button class="btn sm" data-pe="'+pi+','+ri+'">Sửa</button></td></tr>'}).join("")+'</table></div><button class="btn sm" data-sra="'+pi+'" style="margin-top:8px">+ Thêm người</button></div>'});
  h+='<button class="btn pri" id="addPeriod">+ New period</button>';
  return h;
}
function feesSettings(){
  var h='<p class="muted small">Sửa từng mục ở đây. Trang Fees tự gom các mục cùng mức phí thành bảng tóm tắt.</p>';
  S.fees.forEach(function(g,gi){h+='<h3 style="margin:16px 0 6px">'+esc(g[0])+'</h3><div class="wrap"><table class="t2"><tr><th>Mục</th><th style="width:170px">Fees</th><th>Ghi chú</th><th></th></tr>'+g[1].map(function(r,ri){return '<tr>'+[0,1,2].map(function(c){return '<td><input type="text" data-fi="'+gi+','+ri+','+c+'" value="'+esc(r[c])+'" style="width:100%"></td>'}).join("")+'<td><button class="btn sm del" data-fx="'+gi+','+ri+'">×</button></td></tr>'}).join("")+'</table></div><button class="btn sm" data-fa="'+gi+'" style="margin-top:6px">+ Thêm mục</button>'});
  S.feeTiers.forEach(function(t,ti){h+='<h3 style="margin:22px 0 6px">'+esc(t[0])+'</h3><div class="wrap"><table class="t2"><tr><th>Income</th>'+t[1].map(function(c){return '<th class="n">'+esc(c)+'</th>'}).join("")+'</tr>'+tierRows(t).map(function(r,ri){return '<tr><td style="white-space:nowrap">'+esc(r[0])+'</td>'+r[1].map(function(c,ci){return '<td><input type="text" data-ft="'+ti+','+ri+','+ci+'" value="'+esc(c)+'" style="width:84px;text-align:right"></td>'}).join("")+'</tr>'}).join("")+'</table></div>'});
  return h;
}
function openSched(pi,ri){
  var r=S.sched[pi].rows[ri],m=$("#modalHost"),dk=["mon","tue","wed","thu","fri","sat","sun"],dl=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  m.innerHTML='<div class="modal"><div class="box"><h3>Sửa lịch: '+esc(r.n)+'</h3><div class="f"><label>Name</label><input type="text" id="spn" value="'+esc(r.n)+'"><label>Note</label><input type="text" id="spnote" value="'+esc(r.note)+'"><label>Giờ mặc định</label><input type="text" id="sph" value="'+esc(r.hrs||"")+'" placeholder="VD 10-6:30 (trống = giờ period)"></div>'+
    '<table class="t2"><tr><th>Ngày</th><th>Đi làm</th><th>Giờ riêng ngày đó</th></tr>'+dk.map(function(k,i){return '<tr><td>'+dl[i]+'</td><td><input type="checkbox" id="spd-'+k+'"'+(k in r.days?' checked':'')+'></td><td><input type="text" id="sph-'+k+'" value="'+esc(r.days[k]||"")+'" placeholder="VD 11-5" style="width:110px"></td></tr>'}).join("")+'</table>'+
    '<div class="row-end" style="margin-top:14px"><button class="btn del" id="spdel">Xóa người này</button><span style="flex:1"></span><button class="btn" id="spc">Hủy</button><button class="btn pri" id="sps">Lưu</button></div></div></div>';
  $("#spc").onclick=function(){m.innerHTML=""};
  $("#spdel").onclick=function(){S.sched[pi].rows.splice(ri,1);m.innerHTML="";saveSched();render()};
  $("#sps").onclick=function(){r.n=$("#spn").value.trim()||r.n;r.note=$("#spnote").value.trim();r.hrs=$("#sph").value.trim();r.days={};
    dk.forEach(function(k){if($("#spd-"+k).checked)r.days[k]=$("#sph-"+k).value.trim()});m.innerHTML="";saveSched();render()};
}
function bindSettings(){
  $$("[data-ss]").forEach(function(b){b.onclick=function(){S.setSub=b.getAttribute("data-ss");if(S.setSub==="log")loadLog();render()}});
  if($("#nsv"))$("#nsv").onclick=function(){api("PUT","/settings/notice",{value:$("#nt").value}).then(function(d){S.notice=d.value;toast("Đã lưu thông báo")}).catch(fail)};
  var uById=function(id){return S.users.filter(function(u){return u.id===+id})[0]};
  var patchUser=function(id,body){api("PATCH","/users/"+id,body).then(function(o){var i=S.users.indexOf(uById(id));S.users[i]=mapUser(o);render()}).catch(function(e){fail(e);render()})};
  $$("[data-ur]").forEach(function(e){e.onchange=function(){patchUser(e.getAttribute("data-ur"),{role:e.value==="Admin"?"admin":"preparer"})}});
  $$("[data-un]").forEach(function(e){e.onchange=function(){if(e.value.trim())patchUser(e.getAttribute("data-un"),{display_name:e.value.trim()})}});
  $$("[data-ut]").forEach(function(e){e.onchange=function(){patchUser(e.getAttribute("data-ut"),{tab_id:e.value?+e.value.slice(1):null})}});
  $$("[data-act]").forEach(function(e){e.onclick=function(){var u=uById(e.getAttribute("data-act"));patchUser(u.id,{active:!u.active})}});
  $$("[data-rpw]").forEach(function(e){e.onclick=function(){var u=uById(e.getAttribute("data-rpw"));if(!confirm("Đặt lại mật khẩu của "+u.n+" về 12345?"))return;api("POST","/users/"+u.id+"/reset").then(function(o){S.users[S.users.indexOf(u)]=mapUser(o);toast(u.n+": mật khẩu đã đặt lại về 12345");render()}).catch(fail)}});
  $$("[data-unl]").forEach(function(e){e.onclick=function(){var u=uById(e.getAttribute("data-unl"));api("POST","/users/"+u.id+"/unlock").then(function(o){S.users[S.users.indexOf(u)]=mapUser(o);render()}).catch(fail)}});
  if($("#nuadd"))$("#nuadd").onclick=function(){var body={username:$("#nuu").value.trim(),full_name:$("#nuf").value.trim(),display_name:$("#nud").value.trim(),role:$("#nur").value==="Admin"?"admin":"preparer",tab_id:$("#nut").value?+$("#nut").value.slice(1):null};
    api("POST","/users",body).then(function(o){S.users.push(mapUser(o));toast("Đã thêm "+o.display_name+" (mật khẩu tạm 12345)");render()}).catch(fail)};
  $$("[data-sn]").forEach(function(e){e.onchange=function(){var s=S.staff[+e.getAttribute("data-sn")];if(!e.value.trim())return;api("PATCH","/tabs/"+s.dbId,{name:e.value.trim()}).then(function(o){s.name=o.name;render()}).catch(function(er){fail(er);render()})}});
  $$("[data-sx]").forEach(function(e){e.onclick=function(){var i=+e.getAttribute("data-sx"),s=S.staff[i];if(!confirm("Ẩn tab "+s.name+"? Dữ liệu vẫn còn trong database."))return;api("DELETE","/tabs/"+s.dbId).then(function(){S.staff.splice(i,1);delete S.rows[s.id];render()}).catch(fail)}});
  var reorder=function(i,j){var t=S.staff[i];S.staff[i]=S.staff[j];S.staff[j]=t;api("POST","/tabs/order",{ids:S.staff.map(function(x){return x.dbId})}).catch(fail);render()};
  $$("[data-up]").forEach(function(e){e.onclick=function(){var i=+e.getAttribute("data-up");if(i>0)reorder(i,i-1)}});
  $$("[data-dn]").forEach(function(e){e.onclick=function(){var i=+e.getAttribute("data-dn");if(i<S.staff.length-1)reorder(i,i+1)}});
  if($("#addS"))$("#addS").onclick=addStaff;
  /* appointment settings */
  var saveHours=function(){putSetting("hours",S.hours)};
  $$("[data-hx]").forEach(function(e){e.onchange=function(){S.hours[e.getAttribute("data-hx")]=e.checked?null:["09:00","18:00"];saveHours();render()}});
  $$("[data-ho]").forEach(function(e){e.onchange=function(){S.hours[e.getAttribute("data-ho")][0]=e.value;saveHours()}});
  $$("[data-hc]").forEach(function(e){e.onchange=function(){S.hours[e.getAttribute("data-hc")][1]=e.value;saveHours()}});
  var saveCal=function(){putSetting("cal",S.cal)};
  $$("[data-cs]").forEach(function(e){e.onchange=function(){S.cal[e.getAttribute("data-cs")].start=e.value;saveCal()}});
  $$("[data-ce]").forEach(function(e){e.onchange=function(){S.cal[e.getAttribute("data-ce")].last=e.value;saveCal()}});
  $$("[data-cl]").forEach(function(e){e.onchange=function(){S.cal[e.getAttribute("data-cl")].step=+e.value;saveCal()}});
  if($("#prs"))$("#prs").onclick=function(){var v=$("#prl").value.split(",").map(function(x){return x.trim()}).filter(Boolean);api("PUT","/settings/prep_list",{value:v}).then(function(d){S.prep=d.value;toast("Đã lưu");render()}).catch(fail)};
  $$("[data-bx]").forEach(function(e){e.onclick=function(){api("DELETE","/blackouts/"+e.getAttribute("data-bx")).then(function(){S.blackouts=S.blackouts.filter(function(b){return b.id!==+e.getAttribute("data-bx")});render()}).catch(fail)}});
  if($("#bad"))$("#bad").onclick=function(){if(!$("#bd").value)return;api("POST","/blackouts",{day:$("#bd").value,who:$("#bw").value,note:$("#bnt").value||"Nghỉ"}).then(function(b){S.blackouts.push(b);S.blackouts.sort(function(x,y){return x.date<y.date?-1:1});render()}).catch(fail)};
  /* schedule */
  $$("[data-sp]").forEach(function(e){e.onchange=function(){var a=e.getAttribute("data-sp").split(",");S.sched[+a[0]][a[1]]=e.value;saveSched()}});
  $$("[data-chip]").forEach(function(e){e.onclick=function(){var a=e.getAttribute("data-chip").split(","),r=S.sched[+a[0]].rows[+a[1]];if(a[2] in r.days)delete r.days[a[2]];else r.days[a[2]]="";saveSched();render()}});
  $$("[data-pe]").forEach(function(e){e.onclick=function(){var a=e.getAttribute("data-pe").split(",");openSched(+a[0],+a[1])}});
  $$("[data-sra]").forEach(function(e){e.onclick=function(){var pi=+e.getAttribute("data-sra"),rs=S.sched[pi].rows;rs.push({n:"Name",note:"",hrs:"",days:{}});render();openSched(pi,rs.length-1)}});
  $$("[data-spx]").forEach(function(e){e.onclick=function(){if(confirm("Xóa period này?")){S.sched.splice(+e.getAttribute("data-spx"),1);saveSched();render()}}});
  if($("#addPeriod"))$("#addPeriod").onclick=function(){var l=S.sched[S.sched.length-1]||{end:todayISO(),week:"9AM – 6PM",sat:"9AM – 4PM",sun:"",rows:[]};S.sched.push({start:addDays(l.end,1),end:addDays(l.end,30),week:l.week,sat:l.sat,sun:l.sun||"",rows:l.rows.map(function(r){return {n:r.n,note:r.note,hrs:r.hrs||"",days:JSON.parse(JSON.stringify(r.days))}})});saveSched();render()};
  /* fees */
  $$("[data-fi]").forEach(function(e){e.onchange=function(){var a=e.getAttribute("data-fi").split(",");S.fees[+a[0]][1][+a[1]][+a[2]]=e.value;saveFees()}});
  $$("[data-ft]").forEach(function(e){e.onchange=function(){var a=e.getAttribute("data-ft").split(",");S.feeTiers[+a[0]][2][+a[1]][1][+a[2]]=e.value;saveFees()}});
  $$("[data-fx]").forEach(function(e){e.onclick=function(){var a=e.getAttribute("data-fx").split(",");S.fees[+a[0]][1].splice(+a[1],1);saveFees();render()}});
  $$("[data-fa]").forEach(function(e){e.onclick=function(){S.fees[+e.getAttribute("data-fa")][1].push(["Mục mới","$0",""]);saveFees();render()}});
  /* log + backup */
  $$("[data-rs]").forEach(function(e){e.onclick=function(){api("POST","/log/"+e.getAttribute("data-rs")+"/restore").then(function(){return reloadRows()}).then(loadLog).catch(fail)}});
  if($("#bkdl"))$("#bkdl").onclick=function(){fetch("/api/backup",{credentials:"same-origin"}).then(function(r){if(!r.ok)throw new Error("Không tải được backup");return r.blob()}).then(function(b){var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="tax-backup-"+todayISO()+".json";document.body.appendChild(a);a.click();a.remove()}).catch(function(e){toast(e.message,true)})};
}
function loadLog(){api("GET","/log").then(function(l){S.log=l;S.logLoaded=true;if(S.page==="settings"&&S.setSub==="log")render()}).catch(fail)}

/* ================= render ================= */
function render(){
  if(!S.me)return;
  if(!isAdmin()&&(S.page==="settings"||S.page==="reports"||S.page==="records"||S.page==="acct"))S.page="home";
  if(!sById(S.page)&&["home","fees","appt","attn","reports","acct","records","settings","search"].indexOf(S.page)<0)S.page="home";
  renderNav();
  var p=S.page,pg=$("#page"),h;
  pg.className="page"+((p==="appt"||sById(p)||p==="attn"||p==="records"||p==="search")?" wide":"");
  if(p==="appt"&&S.apptSub!=="Work Schedule")ensureWeeks();
  if(p==="records"&&!S.rec){
    pg.innerHTML='<div class="muted">Đang tải Records…</div>';
    if(!S.recLoading){S.recLoading=true;api("GET","/records/daily").then(function(d){
      REC={};d.rows.forEach(function(r){var y=String(r[0]),pr=r[1];REC[y]=REC[y]||{};(REC[y][pr]=REC[y][pr]||[]).push([r[2],r[3],r[4],0,0,0,r[5],r[6],r[7],r[8]])});
      S.rec=true;S.recLoading=false;if(S.page==="records")render();
    }).catch(function(e){S.recLoading=false;fail(e)})}
    return;
  }
  if(p==="settings"&&S.setSub==="log"&&!S.logLoaded)loadLog();
  if(p==="home")h=pageHome();else if(p==="fees")h=pageFees();else if(p==="appt")h=pageAppt();else if(p==="attn")h=pageAttn();else if(p==="reports")h=pageReports();else if(p==="acct")h=pageAcct();else if(p==="records")h=pageRecords();else if(p==="search")h=pageSearch();else if(p==="settings")h=pageSettings();else h=pageStaff(p);
  pg.innerHTML=h;
  if(p==="appt")bindAppt();
  if(p==="settings")bindSettings();
  if(p==="records")bindRecords();
  if(p==="search"){$("#sBack").onclick=function(){S.page=S.prev||"home";$("#gq").value="";render()};$$("[data-go]").forEach(function(a){a.onclick=function(e){e.preventDefault();S.page=a.getAttribute("data-go");render()}})}
  if(p==="reports"){$$("[data-rsub]").forEach(function(b){b.onclick=function(){S.repSub=b.getAttribute("data-rsub");render()}});if(S.repSub==="staff")bindRepStaff();else bindPeriod()}
  if(p==="acct")bindAcct();
  if(sById(p))bindStaff(p);
  if(p==="fees"){
    $$("[data-fsub]").forEach(function(b){b.onclick=function(){S.feeSub=b.getAttribute("data-fsub");render()}});
    $$("[data-disc]").forEach(function(a){a.onclick=function(e){e.preventDefault();toast("File disclaimer sẽ được upload sau")}});
    if(S.feeSub==="eic")EicUI.mount($("#eicHost"),feeLookup);
    else $("#feeQ").oninput=function(){S.feeQ=this.value;var pos=this.selectionStart;render();var el=$("#feeQ");el.focus();el.setSelectionRange(pos,pos)};
  }
  if(p==="home"){
    $("#goAttn").onclick=function(){S.page="attn";render()};
    bindPeriod();bindHomeTips();
    $$(".oth").forEach(function(e){e.onclick=function(){S.othersOpen=!S.othersOpen;render()}});
  }
}
start();
