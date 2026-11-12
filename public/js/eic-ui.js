/* EIC fee estimate (v19): Client + Income -> Federal EIC, CalEITC and our fee (EIC + CTC).
   Light "floating" layout, no Age (assume the client qualifies), CTC tick, table of maximums, chart you can hover.
   EicUI.mount(hostElement, getFee) ; getFee(itemName) returns a fee string like "$30" or "+$20" (from the Fees tab) or null. */
var EicUI=(function(){
  function usd(n){return '$'+Math.round(n).toLocaleString('en-US')}
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  var FEE_NAMES=['EIC – không con','EIC – 1 con','EIC – 2 con trở lên'],CTC_NAME='CTC – bé dưới 17 tuổi';
  function amountOf(raw){var m=raw?String(raw).match(/\d[\d,]*/):null;return m?+m[0].replace(/,/g,''):null}
  function mount(host,getFee){
    var KIDS=0,CH={W:520,H:190,X:72000,Y:8600};
    function row(label,ctl,hint,id){return '<div class="er"'+(id?' id="'+id+'"':'')+'><label class="el">'+label+'</label><div>'+ctl+(hint?'<div class="eh">'+hint+'</div>':'')+'</div></div>'}
    var ctcFee0=amountOf(getFee&&getFee(CTC_NAME));
    host.innerHTML=
      '<div class="eic2">'+
        '<div><div class="esec">Client<small>Giả định khách đủ tuổi (không con: 25–64) và có SSN hợp lệ, trừ khi tick ITIN</small></div>'+
          row('Filing status','<select id="eStatus"><option value="single">Single</option><option value="hoh">Head of Household</option><option value="mfj">Married Filing Jointly</option><option value="mfs">Married Filing Separately</option></select>','')+
          row('Qualifying children','<span class="segk" id="eKids">'+[0,1,2,3].map(function(k){return '<button type="button" data-k="'+k+'" class="'+(k===0?'on':'')+'">'+(k===3?'3+':k)+'</button>'}).join('')+'</span>','Dưới 19 (24 nếu full-time student, khuyết tật thì không giới hạn) · sống cùng hơn nửa năm')+
          row('CTC','<label class="chk"><input type="checkbox" id="eCtc"> Có bé dưới 17 tuổi'+(ctcFee0?' <span class="muted small">· +'+usd(ctcFee0)+' phí CTC</span>':'')+'</label>','','eCtcRow')+
          row('ITIN','<label class="chk"><input type="checkbox" id="eItin"> Khách dùng ITIN <span class="muted small">· Federal không được, CalEITC vẫn được</span></label>','')+
        '</div>'+
        '<div><div class="esec">Income<small>&nbsp;</small></div>'+
          row('W-2 wages','<input type="text" id="eWages" inputmode="decimal" placeholder="0">','')+
          row('Self-employed net','<input type="text" id="eSE" inputmode="decimal" placeholder="0">','Sch C · tự trừ ½ SE tax')+
          row('Investment income','<input type="text" id="eInv" inputmode="decimal" placeholder="0">','Giới hạn: Federal '+usd(EIC.FED.inv)+' · CalEITC '+usd(EIC.CA.inv)+' (đây là giới hạn tiền lời / cổ tức, không phải số EIC)')+
        '</div>'+
      '</div>'+
      '<div class="estats2"><div class="c k-fed"><b id="oF">$0</b><span>Federal EIC</span><div class="of" id="oFm"></div></div>'+
        '<div class="c k-ca"><b id="oC">$0</b><span>CalEITC</span><div class="of" id="oCm"></div></div>'+
        '<div class="c k-fee"><b id="oFee">—</b><span id="oFs">Fee</span><div class="of">lấy từ bảng Fees</div></div></div>'+
      '<div class="eic-why" id="eWhy"></div>'+
      '<div class="emax">'+
        '<div><div class="esec">Mức tối đa · tax year '+EIC.YEAR+'<small id="mxSt"></small></div><table class="emxt"><thead><tr><th>Con</th><th>Federal max</th><th>Earned income ra max</th><th>Hết từ</th><th></th></tr></thead><tbody id="mxT"></tbody></table>'+
          '<div class="eh" style="margin-top:6px">CalEITC đang dùng bảng '+EIC.CA_YEAR+' (FTB chưa ra bảng '+EIC.YEAR+'), hết từ '+usd(EIC.CA.cap-1)+'.</div></div>'+
        '<div class="echart" id="eChartBox"><div class="esec">EIC theo earned income<small>Rê chuột (hoặc chạm) lên biểu đồ để xem số · bấm để điền · <span style="color:#1a5fb4">━ Federal</span> <span style="color:#6a3fb5">━ CalEITC</span> · ● khách này</small></div><div id="eChart"></div><div class="etip" id="eTip"></div></div>'+
      '</div>';
    var $=function(id){return host.querySelector('#'+id)};
    function num(id){var v=parseFloat(String($(id).value).replace(/[$,\s]/g,''));return isFinite(v)?v:0}
    function chip(c,t){return '<span class="chip '+c+'">'+esc(t)+'</span>'}
    function setKids(k){KIDS=k;[].forEach.call(host.querySelectorAll('#eKids button'),function(b){b.classList.toggle('on',+b.getAttribute('data-k')===k)})}
    function px(x){return 34+x/CH.X*(CH.W-46)}function py(y){return CH.H-24-y/CH.Y*(CH.H-36)}
    function update(){
      var kids=KIDS,i=Math.min(kids,3),ctcFee=amountOf(getFee&&getFee(CTC_NAME));
      $('eCtcRow').style.display=kids>0?'':'none';
      var ctc=kids>0&&$('eCtc').checked;
      var p={status:$('eStatus').value,kids:kids,wages:num('eWages'),se:num('eSE'),inv:num('eInv'),other:0,age:'25-64',noSSN:$('eItin').checked};
      var r=EIC.calc(p),has=r.fed>0||r.ca>0,typed=p.wages>0||p.se!==0,fmax=EIC.FED.max[i],cmax=EIC.calTable(EIC.CA.pe[i],i);
      $('oF').textContent=usd(r.fed);$('oC').textContent=usd(r.ca);
      $('oFm').textContent=typed&&r.fed>=fmax?'✓ Đã đạt tối đa '+usd(fmax):'Tối đa '+usd(fmax);$('oFm').className='of'+(typed&&r.fed>=fmax?' max':'');
      $('oCm').textContent='Tối đa '+usd(cmax);
      var eicName=FEE_NAMES[Math.min(kids,2)],eicFee=amountOf(getFee&&getFee(eicName)),parts=[],total=0;
      if(typed&&has&&eicFee!=null){parts.push('EIC '+usd(eicFee));total+=eicFee}
      if(ctc&&ctcFee!=null){parts.push('CTC '+usd(ctcFee));total+=ctcFee}
      $('oFee').textContent=(!typed&&!ctc)?'—':usd(total);$('oFs').textContent='Fee'+(parts.length?' · '+parts.join(' + '):((typed&&!has)?' · Không có EIC':''));
      var why=r.fedReasons.map(function(x){return ['Federal',x]}).concat(r.caReasons.map(function(x){return ['CalEITC',x]}))
        .filter(function(x){return x[1][0]==='no'||x[1][0]==='warn'}).map(function(x){return chip(x[1][0],x[0]+' · '+x[1][1])});
      $('eWhy').innerHTML=typed&&why.length?why.join(''):'';
      // maximum table
      var mfj=p.status==='mfj';$('mxSt').textContent=mfj?'Married Filing Jointly':'Single / HOH / MFS';
      $('mxT').innerHTML=[0,1,2,3].map(function(j){var full=Math.round(EIC.FED.max[j]/EIC.FED.rate[j]/10)*10,st=(mfj?EIC.FED.startMFJ:EIC.FED.start)[j],end=Math.round(st+EIC.FED.max[j]/EIC.FED.out[j]);
        return '<tr class="'+(j===i?'cur':'')+'"><td>'+(j===3?'3+':j)+'</td><td><b>'+usd(EIC.FED.max[j])+'</b></td><td>'+usd(full)+' – '+usd(st)+'</td><td>'+usd(end)+'</td><td><button type="button" data-try="'+j+'" data-w="'+(Math.round((full+st)/2/100)*100)+'">Thử</button></td></tr>'}).join('');
      // chart
      CH.Y=Math.max(fmax,cmax)*1.18;
      var pf='',pc='',g='';for(var x=0;x<=CH.X;x+=200){pf+=(x?'L':'M')+px(x).toFixed(1)+' '+py(EIC.eicFed(x,kids,p.status)).toFixed(1);pc+=(x?'L':'M')+px(x).toFixed(1)+' '+py(EIC.calTable(x,kids)).toFixed(1)}
      [0,10000,20000,30000,40000,50000,60000,70000].forEach(function(t){g+='<line x1="'+px(t)+'" x2="'+px(t)+'" y1="8" y2="'+(CH.H-24)+'" stroke="#edf1f5"/><text x="'+px(t)+'" y="'+(CH.H-8)+'" font-size="10" fill="#8a96a3" text-anchor="middle">'+(t/1000)+'k</text>'});
      var stp=CH.Y>3000?2000:CH.Y>1500?1000:200;for(var t=0;t<CH.Y;t+=stp)g+='<text x="28" y="'+(py(t)+3)+'" font-size="10" fill="#8a96a3" text-anchor="end">'+(t>=1000?(t/1000)+'k':t)+'</text>';
      var dot=r.earned>0?'<circle cx="'+px(Math.min(r.earned,CH.X))+'" cy="'+py(r.fed)+'" r="5" fill="#1a5fb4" stroke="#fff" stroke-width="2"/>':'';
      $('eChart').innerHTML='<svg id="eSvg" viewBox="0 0 '+CH.W+' '+CH.H+'">'+g+'<line x1="34" x2="'+(CH.W-12)+'" y1="'+(CH.H-24)+'" y2="'+(CH.H-24)+'" stroke="#dde3ea"/><path d="'+pc+'" fill="none" stroke="#6a3fb5" stroke-width="2"/><path d="'+pf+'" fill="none" stroke="#1a5fb4" stroke-width="2.5"/>'+dot+
        '<g id="eHov" style="display:none"><line id="eHl" y1="8" y2="'+(CH.H-24)+'" stroke="#8a96a3" stroke-dasharray="3 3"/><circle id="eHf" r="4.5" fill="#1a5fb4"/><circle id="eHc" r="4" fill="#6a3fb5"/></g>'+
        '<rect id="eHit" x="34" y="0" width="'+(CH.W-46)+'" height="'+(CH.H-20)+'" fill="transparent"/></svg>';
      var svg=$('eSvg'),hit=$('eHit');
      function incAt(cx){var bb=svg.getBoundingClientRect(),sx=(cx-bb.left)/bb.width*CH.W;return Math.round(Math.max(0,Math.min(CH.X,(sx-34)/(CH.W-46)*CH.X))/100)*100}
      function move(ev){var pt=ev.touches?ev.touches[0]:ev,inc=incAt(pt.clientX),f=EIC.eicFed(inc,kids,p.status),c=EIC.calTable(inc,kids),xx=px(inc);
        $('eHov').style.display='';$('eHl').setAttribute('x1',xx);$('eHl').setAttribute('x2',xx);$('eHf').setAttribute('cx',xx);$('eHf').setAttribute('cy',py(f));$('eHc').setAttribute('cx',xx);$('eHc').setAttribute('cy',py(c));
        var tp=$('eTip'),box=$('eChartBox').getBoundingClientRect();tp.style.display='block';tp.innerHTML='Earned <b>'+usd(inc)+'</b><br><span style="color:#1a5fb4">Federal <b>'+usd(f)+'</b></span> · <span style="color:#6a3fb5">CalEITC <b>'+usd(c)+'</b></span>';
        var lx=pt.clientX-box.left+12;if(lx+tp.offsetWidth>box.width-6)lx=pt.clientX-box.left-tp.offsetWidth-12;tp.style.left=lx+'px';tp.style.top=(pt.clientY-box.top-50)+'px'}
      function out(){$('eHov').style.display='none';$('eTip').style.display='none'}
      hit.addEventListener('mousemove',move);hit.addEventListener('mouseleave',out);
      hit.addEventListener('touchstart',move,{passive:true});hit.addEventListener('touchmove',function(e){e.preventDefault();move(e)},{passive:false});hit.addEventListener('touchend',out);
      hit.addEventListener('click',function(ev){$('eWages').value=incAt(ev.clientX).toLocaleString('en-US');$('eSE').value='';update()});
    }
    host.addEventListener('click',function(e){
      var kb=e.target.closest('#eKids button');if(kb){setKids(+kb.getAttribute('data-k'));update();return}
      var tb=e.target.closest('[data-try]');if(tb){setKids(+tb.getAttribute('data-try'));$('eWages').value=(+tb.getAttribute('data-w')).toLocaleString('en-US');$('eSE').value='';$('eInv').value='';$('eItin').checked=false;update()}});
    host.addEventListener('input',function(e){if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT')update()});
    host.addEventListener('change',function(e){if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT')update()});
    update();
  }
  return {mount:mount,FEE_NAMES:FEE_NAMES,CTC_NAME:CTC_NAME};
})();
