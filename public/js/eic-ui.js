/* EIC fee estimate: Client + Income -> Federal EIC, CalEITC and our fee (EIC + CTC).
   EicUI.mount(hostElement, getFee) ; getFee(itemName) returns a fee string like "$30" or "+$20" (from the Fees tab) or null. */
var EicUI=(function(){
  function usd(n){return '$'+Math.round(n).toLocaleString('en-US')}
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  var FEE_NAMES=['EIC – không con','EIC – 1 con','EIC – 2 con trở lên'],CTC_NAME='CTC – bé dưới 17 tuổi';
  function amountOf(raw){var m=raw?String(raw).match(/\d[\d,]*/):null;return m?+m[0].replace(/,/g,''):null}
  function mount(host,getFee){
    var inf0=EIC.info(0,'single');
    function row(label,ctl,hint,cls,id){return '<div class="r'+(cls?' '+cls:'')+'"'+(id?' id="'+id+'"':'')+'><label>'+label+'</label><div class="ctl">'+ctl+(hint?'<div class="hint">'+hint+'</div>':'')+'</div></div>'}
    host.innerHTML=
      '<div class="eic-form">'+
        '<div class="eic-card"><div class="eic-sec">Client</div>'+
          row('Filing status','<select id="eStatus"><option value="single">Single</option><option value="hoh">Head of Household</option><option value="mfj">Married Filing Jointly</option><option value="mfs">Married Filing Separately</option></select>','')+
          row('Qualifying children','<select id="eKids"><option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3 trở lên</option></select>','Dưới 19 tuổi (dưới 24 nếu full-time student, khuyết tật thì không giới hạn) · sống cùng khách <b>hơn nửa năm (183+ ngày)</b>')+
          row('Age','<select id="eAge"><option value="25-64">25 – 64</option><option value="18-24">18 – 24</option><option value="65+">65 trở lên</option><option value="u18">Dưới 18</option></select>','<span id="eAgeHint"></span>')+
          row('ITIN','<label class="chk"><input type="checkbox" id="eItin"> Khách dùng ITIN, không có SSN</label>','Federal EIC: <b>không được</b> · CalEITC: <b>vẫn được</b>')+
          row('CTC','<label class="chk"><input type="checkbox" id="eCtc"> Có bé dưới 17 tuổi</label>','<span id="eCtcHint"></span>','ctcrow')+
        '</div>'+
        '<div class="eic-card"><div class="eic-sec">Income</div>'+
          row('W-2 wages','<input type="text" id="eWages" inputmode="decimal" placeholder="0">','')+
          row('Self-employed net (Sch C)','<input type="text" id="eSE" inputmode="decimal" placeholder="0">','')+
          row('Investment income','<input type="text" id="eInv" inputmode="decimal" placeholder="0">','Tối đa: Federal <b>'+usd(inf0.fedInv)+'</b> · CalEITC <b>'+usd(inf0.caInv)+'</b>')+
        '</div>'+
      '</div><div id="eOut"></div>';
    var $=function(id){return host.querySelector('#'+id)};
    function num(id){var v=parseFloat(String($(id).value).replace(/[$,\s]/g,''));return isFinite(v)?v:0}
    function chip(c,t){return '<span class="chip '+c+'">'+esc(t)+'</span>'}
    function update(){
      var kids=+$('eKids').value,age=$('eAge').value,ctcFee=amountOf(getFee&&getFee(CTC_NAME));
      $('eAge').disabled=kids>0;
      $('eAgeHint').innerHTML=kids>0?'Có con: không giới hạn tuổi':'Không con: Federal <b>25–64</b> (dưới 25 hoặc 65+ không được) · CalEITC từ <b>18</b>, không giới hạn trên';
      [].forEach.call(host.querySelectorAll('.ctcrow'),function(e){e.style.display=kids>0?'':'none'});
      $('eCtcHint').innerHTML=ctcFee?'+'+usd(ctcFee)+' phí CTC':'';
      var ctc=kids>0&&$('eCtc').checked;
      var p={status:$('eStatus').value,kids:kids,wages:num('eWages'),se:num('eSE'),inv:num('eInv'),other:0,age:kids>0?'25-64':age,noSSN:$('eItin').checked};
      var r=EIC.calc(p),has=r.fed>0||r.ca>0,typed=p.wages>0||p.se!==0;
      var eicName=FEE_NAMES[Math.min(kids,2)],eicFee=amountOf(getFee&&getFee(eicName));
      var parts=[],total=0;
      if(has&&eicFee!=null){parts.push('EIC '+usd(eicFee));total+=eicFee}
      if(ctc&&ctcFee!=null){parts.push('CTC '+usd(ctcFee));total+=ctcFee}
      var feeTxt=(!typed&&!ctc)?'—':usd(total),feeSub=parts.length?parts.join(' + '):((typed&&!has)?'Không có EIC':'');
      var why=r.fedReasons.map(function(x){return ['Federal',x]}).concat(r.caReasons.map(function(x){return ['CalEITC',x]}))
        .filter(function(x){return x[1][0]==='no'||x[1][0]==='warn'}).map(function(x){return chip(x[1][0],x[0]+' · '+x[1][1])});
      $('eOut').innerHTML=
        '<div class="statbar eic-stats"><div class="c k-fed"><b>'+usd(r.fed)+'</b><span>Federal EIC</span></div>'+
        '<div class="c k-ca"><b>'+usd(r.ca)+'</b><span>CalEITC</span></div>'+
        '<div class="c k-fee"><b>'+feeTxt+'</b><span>Fee'+(feeSub?' · '+esc(feeSub):'')+'</span></div></div>'+
        (typed&&why.length?'<div class="eic-why">'+why.join('')+'</div>':'');
    }
    host.addEventListener('input',update);host.addEventListener('change',update);
    update();
  }
  return {mount:mount,FEE_NAMES:FEE_NAMES,CTC_NAME:CTC_NAME};
})();
