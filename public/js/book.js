/* Customer booking page: tax.fsma.team/b/<code> (no login). Data: /api/public/b/<code> */
(function(){
  var app=document.getElementById("app");
  var token=(location.pathname.match(/\/b\/([A-Za-z0-9]+)/)||[])[1]||"";
  var esc=function(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
  var logo='<svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true"><path d="M16 3.2 28 10.6V27a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 27V10.6Z" fill="none" stroke="#1b6a9c" stroke-width="2.6" stroke-linejoin="round"/><path d="M11.6 28.8V19.4a4.4 4.4 0 0 1 8.8 0v9.4" fill="none" stroke="#1b6a9c" stroke-width="2.6"/></svg>';
  var D=null,open="";
  function tel(p){return String(p||"").replace(/[^\d+]/g,"")}
  function contact(){return '<div class="det"><div class="row"><span>Call</span><a href="tel:'+esc(tel(D.phone))+'">'+esc(D.phone)+'</a></div><div class="row"><span>Email</span><a href="mailto:'+esc(D.email)+'">'+esc(D.email)+'</a></div>'+
    (D.hours&&D.hours.length?'<div class="row"><span>Hours</span><span>'+D.hours.map(esc).join("<br>")+'</span></div>':'')+'<span class="muted small">To change or cancel, please call or email us.</span></div>'}
  function address(){var q=encodeURIComponent(D.address);return '<div class="det"><b>'+esc(D.business)+'</b><span>'+esc(D.address)+'</span><a href="https://www.google.com/maps/search/?api=1&query='+q+'" target="_blank" rel="noopener">Open in Google Maps ›</a><a href="https://maps.apple.com/?q='+q+'" target="_blank" rel="noopener">Open in Apple Maps ›</a></div>'}
  function draw(){
    var h='<div class="biz">'+logo+esc(D.business)+'</div>';
    if(D.expired){app.innerHTML=h+'<div class="card"><b>This link has expired.</b><span class="muted">Please call '+esc(D.phone)+' or email '+esc(D.email)+'.</span></div>';return}
    var cx=D.status==="cancelled";
    h+='<div class="card"><span class="pill '+(cx?'cx':D.status==="updated"?'up':'ok')+'">'+(cx?'Cancelled':D.status==="updated"?'Updated':'Confirmed')+'</span>';
    if(cx)h+='<span class="when cx">'+esc(D.date)+' · '+esc(D.hour)+'</span><span>Hope to see you another day.</span>';
    else h+='<span class="lbl">Your booking</span><span class="when">'+esc(D.date)+'</span><span class="when h">'+esc(D.hour)+'</span>'+
      '<div class="kv"><span>Name</span><span>'+esc(D.name)+'</span></div>'+(D["with"]?'<div class="kv"><span>With</span><span>'+esc(D["with"])+'</span></div>':'')+
      '<div class="kv"><span>Service</span><span>Tax return · '+D.files+' file'+(D.files>1?'s':'')+'</span></div>';
    h+='</div><div class="acts"><button data-o="addr" class="'+(open==="addr"?'on':'')+'">View address</button><button data-o="ct" class="'+(open==="ct"?'on':'')+'">Contact details</button>'+
      (cx?'':'<a href="/api/public/b/'+esc(token)+'/ics">Add to calendar</a><button data-o="br" class="'+(open==="br"?'on':'')+'">What to bring</button>')+'</div>';
    if(open==="addr")h+=address();
    if(open==="ct")h+=contact();
    if(open==="br")h+='<div class="det"><span>'+esc(D.bring)+'</span></div>';
    if(!cx&&!open)h+='<span class="muted small">To change or cancel, please call or email us.</span>';
    h+='<div class="foot">'+esc(D.business)+' · '+esc(D.address)+'</div>';
    app.innerHTML=h;
    [].forEach.call(app.querySelectorAll("[data-o]"),function(b){b.onclick=function(){var o=b.getAttribute("data-o");open=open===o?"":o;draw()}});
  }
  if(!token){app.innerHTML='<div class="card">Link not found.</div>';return}
  fetch("/api/public/b/"+encodeURIComponent(token)).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()}).then(function(d){D=d;draw()})
    .catch(function(){app.innerHTML='<div class="biz">'+logo+'First Source</div><div class="card"><b>Link not found.</b><span class="muted">Please call 714-640-6654 or email contact@fsma.team.</span></div>'});
})();
