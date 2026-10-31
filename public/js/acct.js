/* ================= Accounting (Admin): Cash cuối ngày + Lương; Reports > Nhân viên ================= */
/* Uses globals from app.js: S, $, $$, esc, money, api, fail, toast, todayISO, mdy, md, addDays, live, later, isAdmin */
var OT_LIMIT=80,OT_RATE=1.5;
S.acctSub="cash";S.cashDay=todayISO();S.payPer=null;S.payEdit=null;S.repSub="office";S.repPer="all";S.acct=null;S.acctLoading=false;

function loadAcct(){
  if(S.acctLoading)return;S.acctLoading=true;
  api("GET","/acct").then(function(d){S.acct=d;S.acctLoading=false;if(S.page==="acct"||(S.page==="reports"&&S.repSub==="staff"))render()})
    .catch(function(e){S.acctLoading=false;fail(e);var pg=$("#page");if(pg&&(S.page==="acct"))pg.innerHTML='<div class="err">Không tải được Accounting: '+esc(e.message)+'. Đã chạy file sql/06-accounting.sql trong Supabase chưa?</div>'});
}
function n0(v){return v==null||v===""?0:+v}
function fmt2(n){return "$"+(+n).toFixed(2)}
function numOrBlank(v){return v==null?"":String(+v)}

/* ---------- Cash cuối ngày ---------- */
/* Ngày tiền vào: hồ sơ thường = Date; hồ sơ Online = ngày tick Paid (chưa Paid thì chưa tính) */
function payDay(r){if(r.status==="Refund")return null;if(r.online)return r.paid?(r.paidDate||null):null;return r.date||null}
function cashMap(){var m={};
  S.staff.forEach(function(t){live(t.id).forEach(function(r){var d=payDay(r);if(!d||!r.amt)return;
    var x=((m[d]=m[d]||{})[t.dbId]=m[d][t.dbId]||{n:0,cash:0,check:0,zl:0});x.n++;
    if(r.method==="Cash")x.cash+=r.amt;else if(r.method==="Check")x.check+=r.amt;else x.zl+=r.amt})});
  return m}
function cashRec(day,tab){return (S.acct.cash||[]).filter(function(c){return c.day===day&&c.tab_id===tab})[0]}
function diffHtml(rec,exp){if(!rec||rec.received==null)return exp?'<span class="muted">chưa nhận</span>':'';var d=Math.round((rec.received-exp)*100)/100;return d===0?'<span class="ok">0</span>':'<span class="bad">'+(d>0?"+":"")+money(d)+'</span>'}
function pageCash(){
  var day=S.cashDay,cm=cashMap(),today=cm[day]||{},T={n:0,cash:0,check:0,zl:0,rec:0};
  var h='<div class="ctl-row"><button class="btn sm" id="cdPrev">‹</button><input type="date" id="cashDay" value="'+day+'"><button class="btn sm" id="cdNext">›</button><button class="btn sm" id="cdToday">Hôm nay</button>'+
    '<span class="muted small">Cash / Check / Zelle / Venmo lấy từ tab hồ sơ (Online chỉ tính khi đã tick Paid, theo ngày Paid). Check và Zelle / Venmo chỉ để đối chiếu.</span></div>';
  h+='<div class="wrap"><table class="t2 acct" id="cashT"><tr><th>Preparer</th><th class="n">Hồ sơ</th><th class="n">Cash (theo hồ sơ)</th><th class="n">Check</th><th class="n">Zelle / Venmo</th><th class="n">Cash thực nhận</th><th class="n">Chênh lệch</th><th>Đã nhận</th><th>Note</th><th>Người nhận</th></tr>';
  S.staff.forEach(function(t){var x=today[t.dbId]||{n:0,cash:0,check:0,zl:0},rec=cashRec(day,t.dbId);
    T.n+=x.n;T.cash+=x.cash;T.check+=x.check;T.zl+=x.zl;if(rec&&rec.received!=null)T.rec+=rec.received;
    h+='<tr data-tab="'+t.dbId+'" data-exp="'+x.cash+'"'+(x.n||rec?'':' class="dim"')+'><td>'+esc(t.name)+'</td><td class="n">'+(x.n||"")+'</td><td class="n">'+(x.cash?money(x.cash):"–")+'</td><td class="n">'+(x.check?money(x.check):"–")+'</td><td class="n">'+(x.zl?money(x.zl):"–")+'</td>'+
      '<td class="n"><input type="number" step="0.01" class="cin" data-c="received" value="'+(rec&&rec.received!=null?rec.received:"")+'"></td><td class="n cdiff">'+diffHtml(rec,x.cash)+'</td>'+
      '<td class="c"><input type="checkbox" data-c="done"'+(rec&&rec.done?' checked':'')+'></td><td><input type="text" class="cnote" data-c="note" value="'+esc(rec?rec.note:"")+'"></td><td class="muted small cby">'+(rec&&rec.by?esc(rec.by)+' · '+fmtTs(rec.at):"")+'</td></tr>'});
  var dt=Math.round((T.rec-T.cash)*100)/100;
  h+='<tr class="tot" id="cashTot"><td>Tổng</td><td class="n">'+T.n+'</td><td class="n">'+money(T.cash)+'</td><td class="n">'+money(T.check)+'</td><td class="n">'+money(T.zl)+'</td><td class="n">'+money(T.rec)+'</td><td class="n">'+(dt===0?'<span class="ok">0</span>':'<span class="bad">'+money(dt)+'</span>')+'</td><td colspan="3"></td></tr></table></div>';
  // history
  var days={};Object.keys(cm).forEach(function(d){days[d]=1});(S.acct.cash||[]).forEach(function(c){days[c.day]=1});
  var list=Object.keys(days).filter(function(d){return d!==day}).sort().reverse().slice(0,60);
  h+='<h3 style="margin-top:22px">Các ngày khác</h3>';
  if(!list.length)h+='<div class="muted">Chưa có ngày nào.</div>';
  else h+='<div class="wrap"><table class="t2 acct"><tr><th>Ngày</th><th class="n">Cash theo hồ sơ</th><th class="n">Cash thực nhận</th><th class="n">Check</th><th class="n">Zelle / Venmo</th><th>Trạng thái</th><th>Người nhận</th></tr>'+list.map(function(d){
      var e={cash:0,check:0,zl:0},got=0,pend=0,by={};Object.keys(cm[d]||{}).forEach(function(k){var x=cm[d][k];e.cash+=x.cash;e.check+=x.check;e.zl+=x.zl;var r=cashRec(d,+k);if(x.cash&&!(r&&r.received!=null))pend++});
      (S.acct.cash||[]).forEach(function(c){if(c.day===d){if(c.received!=null)got+=c.received;if(c.by)by[c.by]=1}});
      var df=Math.round((got-e.cash)*100)/100,st=pend?'<span class="pill r">Chưa nhận '+pend+' người</span>':df===0?'<span class="pill g">Đủ</span>':'<span class="pill r">'+(df<0?"Thiếu ":"Dư ")+money(Math.abs(df))+'</span>';
      return '<tr><td><a href="#" data-cday="'+d+'">'+mdy(d)+'</a></td><td class="n">'+money(e.cash)+'</td><td class="n">'+money(got)+'</td><td class="n">'+money(e.check)+'</td><td class="n">'+money(e.zl)+'</td><td>'+st+'</td><td class="muted small">'+esc(Object.keys(by).join(", "))+'</td></tr>'}).join("")+'</table></div>';
  return h;
}
function bindCash(){
  var go=function(d){S.cashDay=d;render()};
  $("#cashDay").onchange=function(){if(this.value)go(this.value)};
  $("#cdPrev").onclick=function(){go(addDays(S.cashDay,-1))};$("#cdNext").onclick=function(){go(addDays(S.cashDay,1))};$("#cdToday").onclick=function(){go(todayISO())};
  $$("[data-cday]").forEach(function(a){a.onclick=function(e){e.preventDefault();go(a.getAttribute("data-cday"));window.scrollTo(0,0)}});
  var tbl=$("#cashT");
  tbl.onchange=function(e){var el=e.target,f=el.getAttribute("data-c");if(!f)return;var tr=el.closest("tr"),tab=+tr.getAttribute("data-tab"),exp=+tr.getAttribute("data-exp");
    var rec=cashRec(S.cashDay,tab)||{day:S.cashDay,tab_id:tab,received:null,done:false,note:""};
    var body={day:S.cashDay,tab_id:tab,received:rec.received,done:rec.done,note:rec.note};
    if(f==="received"){body.received=el.value===""?null:+el.value;if(el.value!==""&&!body.done){body.done=true;tr.querySelector('[data-c="done"]').checked=true}}
    if(f==="done")body.done=el.checked;if(f==="note")body.note=el.value;
    api("PUT","/cash",body).then(function(r){var a=S.acct.cash,i=a.indexOf(cashRec(S.cashDay,tab));if(i>=0)a[i]=r;else a.push(r);
      tr.querySelector(".cdiff").innerHTML=diffHtml(r,exp);tr.querySelector(".cby").textContent=r.by?r.by+" · "+fmtTs(r.at):"";tr.classList.remove("dim");cashTotals()}).catch(fail)};
}
function cashTotals(){if(!$("#cashTot"))return;var exp=0,got=0;$$("#cashT tr[data-tab]").forEach(function(tr){exp+=+tr.getAttribute("data-exp");var v=tr.querySelector('[data-c="received"]').value;if(v!=="")got+=+v});
  var c=$("#cashTot").children,dt=Math.round((got-exp)*100)/100;c[5].textContent=money(got);c[6].innerHTML=dt===0?'<span class="ok">0</span>':'<span class="bad">'+money(dt)+'</span>'}

/* ---------- Lương ---------- */
function calcWages(h,rate){h=+h||0;if(!rate||!h)return null;var reg=Math.min(h,OT_LIMIT),ot=Math.max(h-OT_LIMIT,0);return Math.round((reg*rate+ot*rate*OT_RATE)*100)/100}
function payRow(pid,sid){return (S.acct.rows||[]).filter(function(r){return r.period_id===pid&&r.staff_id===sid})[0]}
function perLabel(p){return md(p.start)+" – "+md(p.end)+"/"+p.end.slice(0,4)}
function curPeriod(){var ps=S.acct.periods;if(!ps.length)return null;var p=ps.filter(function(x){return x.id===S.payPer})[0];if(!p){p=ps[ps.length-1];S.payPer=p.id}return p}
function nextPeriod(){var ps=S.acct.periods,base;
  if(ps.length)base=addDays(ps[ps.length-1].end,1);else{var t=todayISO();base=t.slice(0,8)+(+t.slice(8)<=15?"01":"16")}
  var y=+base.slice(0,4),m=+base.slice(5,7),d=+base.slice(8),end;
  if(d<=15)end=base.slice(0,8)+"15";else end=base.slice(0,8)+("0"+new Date(Date.UTC(y,m,0)).getUTCDate()).slice(-2);
  return {start:base,end:end}}
function staffOf(id){return S.acct.staff.filter(function(x){return x.id===id})[0]}
function pagePay(){
  var A=S.acct,p=curPeriod();
  var h='<div class="ctl-row"><span class="muted">Period:</span><span class="plist">'+A.periods.map(function(x){return '<button class="btn sm'+(p&&x.id===p.id?' on':'')+'" data-per="'+x.id+'">'+perLabel(x)+'</button>'}).join("")+'</span><button class="btn pri sm" id="newPer">+ Period mới</button></div>';
  if(!p)return h+'<div class="muted">Chưa có period nào. Bấm <b>+ Period mới</b> để bắt đầu.</div>';
  h+='<div class="ctl-row small"><label>Từ <input type="date" id="perS" value="'+p.start+'"></label><label>Đến <input type="date" id="perE" value="'+p.end+'"></label><button class="btn sm del" id="perDel">Xóa period</button></div>';
  var list=A.staff.filter(function(st){return st.active||payRow(p.id,st.id)});
  var H=0,W=0,B=0;
  h+='<div class="wrap"><table class="t2 acct pay" id="payT"><tr><th>Nhân viên</th><th class="n">Hours</th><th class="n">Wages</th><th class="n">Bonus</th><th class="n">Total paid</th><th>Note</th></tr>';
  list.forEach(function(st){var r=payRow(p.id,st.id)||{};H+=n0(r.hours);W+=n0(r.wages);B+=n0(r.bonus);var tot=n0(r.wages)+n0(r.bonus),ot=Math.max(n0(r.hours)-OT_LIMIT,0);
    h+='<tr data-sid="'+st.id+'"><td><button class="linkbtn" data-emp="'+st.id+'">'+esc(st.name)+'</button>'+(st.active?'':' <span class="muted small">(nghỉ)</span>')+'</td>'+
      '<td class="n"><span class="otn">'+(ot?'OT '+ot+'h':'')+'</span><input type="number" step="0.25" min="0" data-pf="hours" value="'+numOrBlank(r.hours)+'"></td>'+
      '<td class="n"><input type="number" step="0.01" min="0" data-pf="wages" value="'+numOrBlank(r.wages)+'"></td>'+
      '<td class="n"><input type="number" step="0.01" min="0" data-pf="bonus" value="'+numOrBlank(r.bonus)+'"></td>'+
      '<td class="n ptot">'+(tot?money(tot):"")+'</td><td><input type="text" data-pf="note" value="'+esc(r.note||"")+'"></td></tr>'});
  h+='<tr class="tot" id="payTot"><td>Tổng</td><td class="n">'+H+'</td><td class="n">'+money(W)+'</td><td class="n">'+money(B)+'</td><td class="n">'+money(W+B)+'</td><td></td></tr></table></div>';
  h+='<div class="muted small" style="margin-top:6px">Gõ Hours thì Wages tự tính = Rate × 80 giờ đầu + Rate × 1.5 × giờ trên 80 (OT); sửa tay được. Bấm tên nhân viên để sửa Rate.</div>';
  h+='<div id="empBox">'+(S.payEdit?empBox(S.payEdit):'')+'</div><p><button class="btn sm" id="addEmp">+ Thêm nhân viên</button></p>';
  return h;
}
function empBox(id){var st=staffOf(id);if(!st)return "";var hh=0,pp=0;(S.acct.rows||[]).forEach(function(r){if(r.staff_id===id){hh+=n0(r.hours);pp+=n0(r.wages)+n0(r.bonus)}});
  return '<div class="empbox"><div class="ttl"><b>Nhân viên: '+esc(st.name)+'</b><button class="btn sm" id="empClose">Đóng</button></div>'+
    '<label>Tên<input type="text" data-ef="name" value="'+esc(st.name)+'"></label>'+
    '<label>Rate ($/giờ)<input type="number" step="0.01" min="0" data-ef="rate" value="'+st.rate+'"></label>'+
    '<label>Tab hồ sơ (cho Reports)<select data-ef="tab_id"><option value="">(không có)</option>'+S.staff.map(function(t){return '<option value="'+t.dbId+'"'+(t.dbId===st.tab_id?' selected':'')+'>'+esc(t.name)+'</option>'}).join("")+'</select></label>'+
    '<label>Đang làm<span><input type="checkbox" data-ef="active"'+(st.active?' checked':'')+'> có</span></label>'+
    '<div class="est"><span>Cả mùa: <b>'+hh+' giờ</b> · Total paid <b>'+money(pp)+'</b> · $ / giờ thực tế (gồm bonus) <b>'+(hh&&pp?fmt2(pp/hh):"–")+'</b></span></div></div>'}
function bindPay(){
  var A=S.acct,p=curPeriod();
  $$("[data-per]").forEach(function(b){b.onclick=function(){S.payPer=+b.getAttribute("data-per");render()}});
  $("#newPer").onclick=function(){var np=nextPeriod();api("POST","/pay/periods",np).then(function(r){A.periods.push(r);A.periods.sort(function(a,b){return a.start<b.start?-1:1});S.payPer=r.id;render()}).catch(fail)};
  if($("#addEmp"))$("#addEmp").onclick=function(){var n=prompt("Tên nhân viên mới");if(!n)return;api("POST","/pay/staff",{name:n.trim()}).then(function(r){A.staff.push(r);S.payEdit=r.id;render()}).catch(fail)};
  if(!p)return;
  var savePer=function(){var a=$("#perS").value,b=$("#perE").value;if(!a||!b)return;api("PATCH","/pay/periods/"+p.id,{start:a,end:b}).then(function(r){p.start=r.start;p.end=r.end;A.periods.sort(function(x,y){return x.start<y.start?-1:1});render()}).catch(function(e){fail(e);render()})};
  $("#perS").onchange=savePer;$("#perE").onchange=savePer;
  $("#perDel").onclick=function(){if(!confirm("Xóa period "+perLabel(p)+" và toàn bộ số giờ / lương trong period này?"))return;api("DELETE","/pay/periods/"+p.id).then(function(){A.periods=A.periods.filter(function(x){return x.id!==p.id});A.rows=A.rows.filter(function(r){return r.period_id!==p.id});S.payPer=null;render()}).catch(fail)};
  var tbl=$("#payT");
  var totals=function(){var H=0,W=0,B=0;$$("#payT tr[data-sid]").forEach(function(tr){var g=function(f){return n0(tr.querySelector('[data-pf="'+f+'"]').value)},h=g("hours"),w=g("wages"),b=g("bonus");H+=h;W+=w;B+=b;tr.querySelector(".ptot").textContent=(w+b)?money(w+b):"";var ot=Math.max(h-OT_LIMIT,0);tr.querySelector(".otn").textContent=ot?"OT "+ot+"h":""});
    var pt=$("#payTot");if(!pt)return;var c=pt.children;c[1].textContent=Math.round(H*100)/100;c[2].textContent=money(W);c[3].textContent=money(B);c[4].textContent=money(W+B)};
  tbl.oninput=function(e){var el=e.target;if(el.getAttribute("data-pf")==="hours"){var tr=el.closest("tr"),st=staffOf(+tr.getAttribute("data-sid")),w=calcWages(el.value,st.rate);if(w!=null||el.value==="")tr.querySelector('[data-pf="wages"]').value=w==null?"":w}totals()};
  tbl.onchange=function(e){var el=e.target;if(!el.getAttribute("data-pf"))return;var tr=el.closest("tr"),sid=+tr.getAttribute("data-sid");
    var g=function(f){var v=tr.querySelector('[data-pf="'+f+'"]').value;return f==="note"?v:(v===""?null:+v)};
    var body={period_id:p.id,staff_id:sid,hours:g("hours"),wages:g("wages"),bonus:g("bonus"),note:g("note")};
    later("pay"+sid,function(){api("PUT","/pay/rows",body).then(function(r){var a=A.rows,old=payRow(p.id,sid),i=a.indexOf(old);if(i>=0)a[i]=r;else a.push(r)}).catch(fail)},150)};
  $$("[data-emp]").forEach(function(b){b.onclick=function(){S.payEdit=+b.getAttribute("data-emp");$("#empBox").innerHTML=empBox(S.payEdit);bindEmp();$("#empBox").scrollIntoView({block:"nearest"})}});
  bindEmp();
}
function bindEmp(){var box=$("#empBox .empbox");if(!box)return;var id=S.payEdit,st=staffOf(id);
  $("#empClose").onclick=function(){S.payEdit=null;$("#empBox").innerHTML=""};
  box.onchange=function(e){var el=e.target,f=el.getAttribute("data-ef");if(!f)return;var body={};body[f]=f==="active"?el.checked:f==="rate"?(+el.value||0):f==="tab_id"?(el.value?+el.value:null):el.value.trim();
    api("PATCH","/pay/staff/"+id,body).then(function(r){Object.assign(st,r);toast("Đã lưu");if(f!=="rate")render()}).catch(fail)}}

function pageAcct(){
  var h='<div class="page-head"><div><h1>Accounting</h1><div class="sub">Chỉ Admin thấy</div></div></div>';
  h+='<div class="sub-tabs"><button class="btn'+(S.acctSub==="cash"?' on':'')+'" data-asub="cash">Cash cuối ngày</button><button class="btn'+(S.acctSub==="pay"?' on':'')+'" data-asub="pay">Lương</button></div>';
  if(!S.acct){loadAcct();return h+'<div class="muted">Đang tải…</div>'}
  return h+(S.acctSub==="cash"?pageCash():pagePay());
}
function bindAcct(){
  $$("[data-asub]").forEach(function(b){b.onclick=function(){S.acctSub=b.getAttribute("data-asub");render()}});
  if(!S.acct)return;
  if(S.acctSub==="cash")bindCash();else bindPay();
}

/* ---------- Reports > Nhân viên ---------- */
function daysBetween(a,b){return Math.round((new Date(b+"T00:00:00Z")-new Date(a+"T00:00:00Z"))/864e5)+1}
function pageRepStaff(){
  if(!S.acct){loadAcct();return '<div class="muted">Đang tải…</div>'}
  var A=S.acct,ps=S.repPer==="all"?A.periods:A.periods.filter(function(p){return String(p.id)===String(S.repPer)});
  var h='<div class="ctl-row"><label>Period <select id="repPer"><option value="all"'+(S.repPer==="all"?' selected':'')+'>Cả mùa (tất cả period)</option>'+A.periods.slice().reverse().map(function(p){return '<option value="'+p.id+'"'+(String(p.id)===String(S.repPer)?' selected':'')+'>'+perLabel(p)+'</option>'}).join("")+'</select></label>'+
    '<span class="muted small">Giờ làm lấy từ Accounting &gt; Lương; Clients / Income lấy từ tab hồ sơ trong các ngày của period.</span></div>';
  if(!ps.length)return h+'<div class="muted">Chưa có period nào trong Accounting &gt; Lương.</div>';
  var weeks=ps.reduce(function(a,p){return a+daysBetween(p.start,p.end)},0)/7;
  var inP=function(d){return ps.some(function(p){return d>=p.start&&d<=p.end})};
  var groups=[],gi={};
  A.staff.forEach(function(st){var hrs=0,paid=0;ps.forEach(function(p){var r=payRow(p.id,st.id);if(r){hrs+=n0(r.hours);paid+=n0(r.wages)+n0(r.bonus)}});
    if(!hrs&&!paid)return;var k=st.tab_id?"t"+st.tab_id:"s"+st.id;
    if(!(k in gi)){gi[k]=groups.length;groups.push({names:[],tab:st.tab_id,hrs:0,paid:0})}var g=groups[gi[k]];g.names.push(st.name);g.hrs+=hrs;g.paid+=paid});
  groups.forEach(function(g){g.cl=null;g.inc=null;if(!g.tab)return;var t=S.staff.filter(function(x){return x.dbId===g.tab})[0];if(!t)return;g.cl=0;g.inc=0;
    live(t.id).forEach(function(r){if(!r.date||!inP(r.date))return;if(r.status!=="Refund"&&r.name)g.cl++;g.inc+=amt(r)})});
  var mx=Math.max.apply(null,groups.map(function(g){return g.inc!=null&&g.hrs?g.inc/g.hrs:0}).concat([1]));
  var T={hrs:0,cl:0,inc:0,paid:0};
  h+='<div class="wrap"><table class="t2 acct"><tr><th>Nhân viên</th><th class="n">Giờ làm</th><th class="n">Giờ / tuần</th><th class="n">Clients</th><th class="n">Clients / giờ</th><th class="n">Income</th><th class="n">Income / giờ</th><th style="width:18%"></th><th class="n">Total paid</th><th class="n">Lương % income</th></tr>'+
    groups.map(function(g){T.hrs+=g.hrs;T.paid+=g.paid;if(g.cl!=null){T.cl+=g.cl;T.inc+=g.inc}var ip=g.inc!=null&&g.hrs?g.inc/g.hrs:null;
      return '<tr><td>'+esc(g.names.join(" + "))+'</td><td class="n">'+g.hrs+'</td><td class="n">'+(weeks?(g.hrs/weeks).toFixed(1):"–")+'</td><td class="n">'+(g.cl==null?"–":g.cl)+'</td><td class="n">'+(g.cl==null||!g.hrs?"–":(g.cl/g.hrs).toFixed(2))+'</td><td class="n">'+(g.inc==null?"–":money(g.inc))+'</td><td class="n"><b>'+(ip==null?"–":fmt2(ip))+'</b></td><td>'+(ip==null?"":'<div class="bar" style="width:'+Math.max(0,Math.round(ip/mx*100))+'%"></div>')+'</td><td class="n">'+money(g.paid)+'</td><td class="n">'+(g.inc&&g.paid?Math.round(g.paid/g.inc*100)+"%":"–")+'</td></tr>'}).join("")+
    '<tr class="tot"><td>Office</td><td class="n">'+T.hrs+'</td><td class="n">'+(weeks?(T.hrs/weeks).toFixed(1):"–")+'</td><td class="n">'+T.cl+'</td><td class="n">'+(T.hrs?(T.cl/T.hrs).toFixed(2):"–")+'</td><td class="n">'+money(T.inc)+'</td><td class="n"><b>'+(T.hrs?fmt2(T.inc/T.hrs):"–")+'</b></td><td></td><td class="n">'+money(T.paid)+'</td><td class="n">'+(T.inc?Math.round(T.paid/T.inc*100)+"%":"–")+'</td></tr></table></div>';
  h+='<div class="muted small" style="margin-top:6px">Người dùng chung 1 tab (ví dụ Ngọc + Nina) được gộp 1 dòng. Người không có tab hồ sơ (Nhi, Trang) chỉ có giờ và lương. Đổi tab cho từng người ở Accounting &gt; Lương (bấm tên). Giờ / tuần = Giờ làm ÷ số tuần của period. Office Income chỉ tính các tab có người làm trong bảng này.</div>';
  return h;
}
function bindRepStaff(){var s=$("#repPer");if(s)s.onchange=function(){S.repPer=this.value;render()}}
