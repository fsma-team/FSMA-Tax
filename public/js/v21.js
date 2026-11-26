/* tax.fsma.team v21
   - cellEdit21: double-click editor that floats OVER the cell (cell / column width never changes, other cells never move)
   - Appointment + staff tabs: theme look (header, day cards, booking cards, stat tiles) */
(function () {
  // ---------- inline editor that does not change the layout ----------
  window.cellEdit21 = function (td, val, o) {
    o = o || {};
    td.classList.add('ce21');
    td.innerHTML = '<span class="ce21g">' + (td.innerHTML || '&nbsp;') + '</span><input class="ce21i' + (o.left ? ' l' : '') + '"' + (o.num ? ' inputmode="decimal"' : '') +
      (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + ' value="' + esc(val == null ? '' : val) + '">';
    var i = td.lastChild; i.focus(); i.select(); return i;
  };

  var MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var ti = function (c) { return window.V20 && V20.ti ? V20.ti(c) : ''; };
  var prepColor = function (n) { n = String(n || '').toLowerCase(); var s = S.staff.filter(function (x) { return (x.short || '').toLowerCase() === n || x.name.toLowerCase() === n; })[0]; return s ? PALETTE[s.theme.color] : ''; };

  // ---------- Appointment ----------
  var _appt20 = pageAppt;
  pageAppt = function () {
    var h = _appt20(), who = S.apptSub;
    // header: title with theme icon, sms status as a small chip on the right
    h = h.replace(/<div class="page-head"><div><h1>Appointment<\/h1><div class="sub">([\s\S]*?)<\/div><\/div><\/div>/, function (m, sub) {
      var on = /BẬT/.test(sub);
      return '<div class="page-head ah21"><div><h1>' + ti() + 'Appointment</h1></div><span class="smschip21 ' + (on ? 'on' : '') + '" title="' + esc(sub.replace(/<[^>]+>/g, '')) + '"><i></i>' + (on ? 'Text cho khách: bật' : 'Text cho khách: tắt') + '</span></div>';
    });
    // sub tabs + week navigation in one themed bar
    h = h.replace('<div class="sub-tabs">', '<div class="sub-tabs abar21">')
      .replace(/<button class="btn" id="pw">‹ Tuần trước<\/button><b>([^<]*)<\/b><button class="btn" id="nw">Tuần sau ›<\/button>/, function (m, w) {
        var cur = S.weekStart === mondayISO(todayISO());
        return '<span class="wk21"><button class="btn" id="pw" title="Tuần trước">‹</button><b>' + w + '</b><button class="btn" id="nw" title="Tuần sau">›</button>' + (cur ? '<span class="tw21">Tuần này</span>' : '<button class="btn sm" id="tw21">Về tuần này</button>') + '</span>';
      });
    // legend as small chips
    h = h.replace(/<div class="legend19">[\s\S]*?<\/div>/, '<div class="leg21">' + (who === 'Office' ? '<span><i class="lp"></i>(Preparer) Client (files)</span>' : '') +
      '<span><u>gạch dưới</u> = có ghi chú</span><span><i class="lb"></i>Business</span><span><i class="lo"></i>ngoài giờ</span><span>kéo hẹn để dời' + (who !== 'Office' ? ' · kéo cạnh dưới để kéo dài' : '') + '</span></div>');
    return '<div class="appt21 apx apv-4 pst-1">' + h + '</div>';
  };

  // after each render: day header cards, today column, preparer colors on bookings
  function post21() {
    var tb = document.querySelector('.appt21 table.week');
    if (tb) {
      var td = todayISO(), names = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
      var ths = [].slice.call(tb.rows[0].cells, 1), tc = -1;
      ths.forEach(function (th, i) {
        var d = addDays(S.weekStart, i); if (d === td) { th.classList.add('today21'); tc = i + 1; }
        th.innerHTML = '<span class="dn21">' + names[i] + '</span><span class="dd21">' + (+d.slice(8)) + '</span><span class="dm21">' + MONS[+d.slice(5, 7) - 1] + '</span>';
      });
      if (tc > 0) {
        var col = 0; // mark today's cells (rowspans make indexes shift, so use the cell's left edge)
        var r0 = ths[tc - 1].getBoundingClientRect();
        [].slice.call(tb.querySelectorAll('td')).forEach(function (c) { var r = c.getBoundingClientRect(); if (Math.abs(r.left - r0.left) < 2) c.classList.add('tcol21'); });
      }
      [].slice.call(tb.querySelectorAll('tr[data-si]')).forEach(function (tr) { var t = tr.querySelector('td.t'); var hh = t ? +t.textContent.split(':')[0] : 0; tr.classList.toggle('hb3', hh % 2 === 1); });
      [].slice.call(tb.querySelectorAll('td.bk')).forEach(function (c) {
        var an = c.querySelector('.anm'); if (an) an.setAttribute('data-t', (c.getAttribute('data-k') || '').split('|')[2] || '');
        var b = S.bookings[c.getAttribute('data-k')]; var col = b && b.s ? prepColor(b.s) : '';
        if (col) c.style.setProperty('--pc', col);
      });
      nowLine21(tb); pastToday21(tb);
      var tw = document.getElementById('tw21'); if (tw) tw.onclick = function () { S.weekStart = mondayISO(todayISO()); render(); };
    }
  }

  // v21.4: today's slots that already ended count as "past" too
  function pastToday21(tb) {
    var n = new Date(), mins = n.getHours() * 60 + n.getMinutes(), sl = slotsFor(S.apptSub), step = S.cal[S.apptSub].step;
    [].slice.call(tb.querySelectorAll('tr[data-si]')).forEach(function (tr) { var i = +tr.getAttribute('data-si'); if (sl[i] + step > mins) return;
      [].slice.call(tr.querySelectorAll('td.tcol21')).forEach(function (c) { c.classList.add('past'); }); });
  }
  // v21.2: red line = now (today column only)
  function nowLine21(tb) {
    var w = tb.parentNode, old = w.querySelector('.now21'); if (old) old.remove();
    var th = tb.querySelector('th.today21'); if (!th) return;
    var n = new Date(), mins = n.getHours() * 60 + n.getMinutes(), sl = slotsFor(S.apptSub), step = S.cal[S.apptSub].step, rows = tb.querySelectorAll('tr[data-si]');
    for (var i = 0; i < sl.length; i++) { if (mins >= sl[i] && mins < sl[i] + step) { var r = rows[i]; var top = r.offsetTop + (mins - sl[i]) / step * r.offsetHeight;
      w.style.position = 'relative'; w.insertAdjacentHTML('beforeend', '<div class="now21" style="top:' + top + 'px;left:' + th.offsetLeft + 'px;width:' + th.offsetWidth + 'px"></div>'); return; } }
  }
  // ---------- staff tab ----------
  var DECO = {
    autumn: '<svg viewBox="0 0 260 120" class="bd21"><g opacity=".9">' + [[200, 30, 22, '#d9531e', 20], [232, 64, 16, '#f0a030', -25], [168, 74, 13, '#e07a2a', 40], [216, 96, 11, '#c0392b', 10], [140, 40, 9, '#f2c14e', -40], [246, 20, 9, '#e8892c', 60]].map(function (l) {
      return '<path transform="translate(' + l[0] + ',' + l[1] + ') rotate(' + l[4] + ') scale(' + l[2] / 20 + ')" fill="' + l[3] + '" d="M0,-20 L4,-9 L13,-13 L10,-3 L20,0 L10,4 L13,13 L4,9 L0,20 L-4,9 L-13,13 L-10,4 L-20,0 L-10,-3 L-13,-13 L-4,-9Z"/>';
    }).join('') + '</g></svg>',
    cruise: '<svg viewBox="0 0 260 120" class="bd21"><circle cx="205" cy="52" r="22" fill="#f6d2b8" opacity=".75"/><path d="M60 82 Q95 74 130 82 T200 82 T270 82" stroke="#8fa9b8" stroke-width="2" fill="none" opacity=".7"/><path d="M40 96 Q80 88 120 96 T200 96 T280 96" stroke="#a9bfcb" stroke-width="2" fill="none" opacity=".55"/><g transform="translate(150,64)" fill="#5b7d93" opacity=".8"><path d="M0 10 L36 10 L31 16 L5 16Z"/><rect x="10" y="4" width="16" height="6" rx="1"/><rect x="20" y="0" width="3" height="5"/></g><path d="M226 30 q4 -4 8 0 q4 -4 8 0" stroke="#7d93a2" fill="none" stroke-width="1.4"/></svg>',
    bloom: '<svg viewBox="0 0 260 120" class="bd21"><g stroke="#9db59a" stroke-width="1.6" fill="none"><path d="M210 120 C205 90 200 70 186 46"/><path d="M210 120 C214 92 226 70 240 54"/><path d="M196 80 q-18 -6 -26 -20" /></g>' +
      [[186, 42, 1], [240, 50, .85], [170, 58, .7]].map(function (f) { return '<g transform="translate(' + f[0] + ',' + f[1] + ') scale(' + f[2] + ')">' + [0, 60, 120, 180, 240, 300].map(function (a) { return '<ellipse rx="5" ry="13" cy="-11" transform="rotate(' + a + ')" fill="#fff" stroke="#d9bcc5" stroke-width=".8"/>'; }).join('') + '<circle r="3" fill="#e7a35b"/></g>'; }).join('') + '</svg>',
    zodiac: '<svg viewBox="0 0 260 120" class="bd21"><path d="M215 30 A26 26 0 1 0 236 72 A20 20 0 1 1 215 30Z" fill="#e8c46a"/><g fill="#6a5acd"><circle cx="140" cy="40" r="2"/><circle cx="160" cy="62" r="2.4"/><circle cx="182" cy="52" r="1.8"/><circle cx="170" cy="90" r="2"/></g><path d="M140 40 L160 62 L182 52 M160 62 L170 90" stroke="#b9a8ff" stroke-width="1"/></svg>',
    math: '<svg viewBox="0 0 260 120" class="bd21"><g font-family="Georgia, serif" font-weight="700"><text x="150" y="50" font-size="30" fill="#2f5d50" opacity=".55">π</text><text x="190" y="84" font-size="22" fill="#3d85c6" opacity=".5">∑</text><text x="226" y="44" font-size="20" fill="#e5484d" opacity=".5">√</text><text x="120" y="96" font-size="16" fill="#c9a227" opacity=".6">a²+b²</text></g></svg>',
    universe: '<svg viewBox="0 0 260 120" class="bd21"><ellipse cx="200" cy="56" rx="40" ry="9" fill="none" stroke="#e0a75e" stroke-width="3" transform="rotate(-18 200 56)"/><circle cx="200" cy="56" r="20" fill="#7b4ee0"/><circle cx="194" cy="50" r="6" fill="#d7b8ff" opacity=".7"/><circle cx="140" cy="86" r="8" fill="#4cc9f0"/><g fill="#9fa8ff"><circle cx="120" cy="30" r="1.6"/><circle cx="245" cy="20" r="1.4"/><circle cx="160" cy="20" r="1.2"/></g></svg>',
    gzaura: '<svg viewBox="0 0 260 120" class="bd21"><defs><filter id="bd22" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter></defs><g filter="url(#bd22)"><circle cx="170" cy="60" r="34" fill="#ffa3d7"/><circle cx="215" cy="45" r="30" fill="#8fe3ff"/><circle cx="205" cy="88" r="28" fill="#b79bff"/></g><path transform="translate(240 26) scale(.8)" d="M0 -12 C1 -4 4 -1 12 0 C4 1 1 4 0 12 C-1 4 -4 1 -12 0 C-4 -1 -1 -4 0 -12Z" fill="#fff"/></svg>',
    pro: '<svg viewBox="0 0 260 120" class="bd21"><path d="M120 100 H250" stroke="#c9a227" stroke-width="2"/><path d="M150 108 H250" stroke="#14365d" stroke-width="1" opacity=".4"/></svg>'
  };
  var _staff20 = pageStaff;
  pageStaff = function (id) {
    var h = _staff20(id), st = (window.V20 && V20.theme && V20.theme()) || 'autumn';
    h = h.replace('<div class="banner', '<div class="banner b21').replace(/<div class="statbar">/, '<div class="statbar sb21">');
    // remove the old decoration, put the theme one
    h = h.replace(/<svg[^>]*class="bdeco19"[\s\S]*?<\/svg>/, '');
    h = h.replace(/(<div class="banner b21[^>]*>)/, '$1' + (DECO[st] || ''));
    // stat tiles with theme icon
    h = h.replace(/<div class="c( k-wait)?"><b id="(st-[a-z]+)">/g, function (m, kw, sid) { return '<div class="c' + (kw || '') + '"><i class="si21">' + ti() + '</i><b id="' + sid + '">'; });
    return '<div class="stab21">' + h + '</div>';
  };

  var _render = render;
  render = function () { _render.apply(this, arguments); try { post21(); } catch (e) { console.warn(e); } };
  window.addEventListener('resize', function () { if (S && S.page === 'appt') { try { post21(); } catch (e) {} } });
})();
