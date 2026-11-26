// tax.fsma.team v20 - 4 themes (Mùa thu · Cruising · Mùa hoa nở · Professional), Homepage, Records, Accounting, Tools, theme picker.
// Loaded after v19.js; overrides Tax globals (render, renderNav, pageHome, pageRecords, pageAcct, openTheme ...) by assignment.
window.V20 = (function () {
const rnd = (seed) => { let x = seed * 9301 + 49297; return () => (x = (x * 9301 + 49297) % 233280) / 233280; };
const greet20 = () => { const h = +new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', hour12: false }) % 24; return h < 11 ? 'Chào buổi sáng' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'; };
// ---------- Themes (v6: back to the v4 look - header scene + light falling things; each theme has its own icon used on headings, counts, charts) ----------
const THEMES = [['autumn', 'Mùa thu'], ['cruise', 'Cruising'], ['bloom', 'Mùa hoa nở'], ['pro', 'Professional']];
let THEME = 'autumn', MOTION = true, PHONE = false;
try { MOTION = localStorage.getItem('tax_motion20') !== '0'; } catch (e) { /* private mode */ }
// maple leaf with veins
const MAPLE = 'M12 1.6l1.7 4 3-1.4-.7 3.6 3.6-1-1.7 3.2 3.4 1.3-3.2 2 1.4 1.6-4.2.3.4 3.5-3-1.8L12 21.4l-.7-5.5-3 1.8.4-3.5-4.2-.3 1.4-1.6-3.2-2 3.4-1.3-1.7-3.2 3.6 1-.7-3.6 3 1.4z';
const leafSvg = (a, b, id) => `<svg viewBox="0 0 24 24"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><path d="${MAPLE}" fill="url(#${id})"/><path d="M12 21.4V6.5M12 12.5l-4.2-3.4M12 12.5l4.2-3.4M12 16l-3.4 1.2M12 16l3.4 1.2" stroke="rgba(120,50,10,.45)" stroke-width=".7" fill="none" stroke-linecap="round"/><path d="M12 21.4v2" stroke="#8a4b20" stroke-width="1"/></svg>`;
const FLOWER = (c = '#f49ab3') => `<svg viewBox="0 0 24 24">${[0, 72, 144, 216, 288].map((r) => `<ellipse cx="12" cy="6.2" rx="3.6" ry="5.2" fill="${c}" transform="rotate(${r} 12 12)"/>`).join('')}<circle cx="12" cy="12" r="3" fill="#ffd36b"/><circle cx="11" cy="11" r="1" fill="#fff" opacity=".7"/></svg>`;
const BOBA = '<svg viewBox="0 0 24 24"><path d="M6 7h12l-1.6 14a1.6 1.6 0 01-1.6 1.4H9.2a1.6 1.6 0 01-1.6-1.4z" fill="#e9cfae" stroke="#7a4a30" stroke-width="1.1"/><path d="M6.7 12h10.6l-1 9.2a1.4 1.4 0 01-1.4 1.2H9.1a1.4 1.4 0 01-1.4-1.2z" fill="#d9a877"/><path d="M5 7h14" stroke="#7a4a30" stroke-width="1.6" stroke-linecap="round"/><path d="M13 7l2.4-6" stroke="#e06b8b" stroke-width="2" stroke-linecap="round"/><circle cx="9.5" cy="19.5" r="1.3" fill="#3b2a20"/><circle cx="12.3" cy="20.2" r="1.3" fill="#3b2a20"/><circle cx="15" cy="19.3" r="1.3" fill="#3b2a20"/><circle cx="11" cy="17.4" r="1.3" fill="#3b2a20"/><circle cx="13.9" cy="17.2" r="1.3" fill="#3b2a20"/></svg>';
const ICECREAM = '<svg viewBox="0 0 24 24"><path d="M7.5 11.5L12 23l4.5-11.5z" fill="#f2c27b" stroke="#b97a2e" stroke-width=".9" stroke-linejoin="round"/><path d="M9 13l5.5 4M10.2 16.6l3.3-2.6M8.6 12.6l6.2 1.2" stroke="#d39a4c" stroke-width=".7"/><circle cx="9.3" cy="9.6" r="3.6" fill="#ffb3c7"/><circle cx="14.7" cy="9.6" r="3.6" fill="#9fd8f0"/><circle cx="12" cy="5.8" r="3.8" fill="#fff4d6"/><circle cx="12" cy="1.9" r="1.4" fill="#e0475b"/><path d="M10.4 5l.4.6M13 4.4l.5.4M11.6 7l.6-.2" stroke="#e06b8b" stroke-width=".8" stroke-linecap="round"/></svg>';
const ANCHOR = '<svg viewBox="0 0 24 24"><g fill="none" stroke="#1f6fa3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4.4" r="2.1" stroke-width="1.8"/><path d="M12 6.6V21" stroke-width="2"/><path d="M7.6 10h8.8" stroke-width="2"/><path d="M4.2 14.6c.7 3.9 3.9 6.4 7.8 6.4s7.1-2.5 7.8-6.4" stroke-width="2"/><path d="M2.8 16.2 4.2 13.8l2.2 1.6M21.2 16.2 19.8 13.8l-2.2 1.6" stroke-width="1.8"/></g></svg>';
const LIFEBUOY = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.2" fill="none" stroke="#fff" stroke-width="4.6"/><circle cx="12" cy="12" r="8.2" fill="none" stroke="#e5534b" stroke-width="4.6" stroke-dasharray="6.44 6.44" transform="rotate(-22 12 12)"/><circle cx="12" cy="12" r="10.5" fill="none" stroke="#c9dbe8" stroke-width=".8"/><circle cx="12" cy="12" r="5.9" fill="none" stroke="#c9dbe8" stroke-width=".8"/></svg>';
const PROICON = '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" fill="#17375e" transform="rotate(45 12 12)"/></svg>';
const TICON = { pro: PROICON, bloom: FLOWER('#e58fc0'), autumn: leafSvg('#f6c945', '#e0662a', 'tig').replace('url(#tig)', '#ec8a2c'), boba: BOBA, cruise: ICECREAM };
const ti = (cls = '') => `<i class="ti ${cls}" aria-hidden="true"></i>`;
const svgUri = (s) => `url("data:image/svg+xml,${encodeURIComponent(s.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '))}")`;
const LEAVES = [['#f6c945', '#e8862a'], ['#f2b01e', '#c8502b'], ['#ffd36b', '#f2a23c'], ['#e8862a', '#b7411f'], ['#f6d365', '#e0662a']];
const SCENE = {
  autumn: `<svg viewBox="0 0 520 90" preserveAspectRatio="xMaxYMax meet">
    <path d="M140 88 Q330 70 520 82 V90 H140z" fill="#f6e2c2"/>
    <path d="M520 6 C470 10 430 18 392 34 C372 42 356 52 344 60" stroke="#7a4a24" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M430 18 C424 30 426 40 432 48 M392 34 C384 22 372 18 362 18" stroke="#7a4a24" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${[[350, 60, 38, -20], [368, 22, 34, 30], [400, 44, 36, 10], [436, 56, 32, -25], [448, 16, 36, 15], [484, 34, 32, -10], [508, 10, 30, 25], [418, 6, 28, -35], [330, 46, 26, 40]].map(([x, y, s, r], i) => `<g class="sway" style="animation-delay:-${i * .6}s"><svg x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" viewBox="0 0 24 24" overflow="visible"><g transform="rotate(${r} 12 12)">${leafSvg(...LEAVES[i % 5], 'sl' + i).replace(/^<svg viewBox="0 0 24 24">|<\/svg>$/g, '')}</g></svg></g>`).join('')}
    ${[[262, 84, 16, 20], [276, 86, 14, -30], [290, 83, 15, 60], [172, 85, 13, -10], [186, 86, 15, 35]].map(([x, y, s, r], i) => `<svg x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" viewBox="0 0 24 24" overflow="visible"><g transform="rotate(${r} 12 12)">${leafSvg(...LEAVES[(i + 1) % 5], 'gp' + i).replace(/^<svg viewBox="0 0 24 24">|<\/svg>$/g, '')}</g></svg>`).join('')}
    <g transform="translate(200 54)"><rect x="0" y="12" width="44" height="5" rx="2" fill="#a0673a"/><rect x="4" y="17" width="4" height="15" fill="#7a4a24"/><rect x="36" y="17" width="4" height="15" fill="#7a4a24"/><rect x="0" y="2" width="44" height="4" rx="2" fill="#a0673a"/>
      <rect x="54" y="14" width="13" height="12" rx="2" fill="#fff" stroke="#c98b5a"/><path d="M67 17h3a3 3 0 010 6h-3" fill="none" stroke="#c98b5a"/><path class="steam" d="M58 10q-3-5 0-10M63 10q-3-5 0-10" stroke="#c9b8a6" fill="none" stroke-width="1.5"/></g>
    ${[0, 1, 2].map((i) => `<g class="lfall" style="animation-delay:-${i * 2.3}s"><svg x="${370 + i * 40}" y="40" width="20" height="20" viewBox="0 0 24 24">${leafSvg(...LEAVES[(i + 2) % 5], 'fl' + i).replace(/^<svg viewBox="0 0 24 24">|<\/svg>$/g, '')}</svg></g>`).join('')}</svg>`,
  boba: `<svg viewBox="0 0 520 90" preserveAspectRatio="xMaxYMax meet">
    <path d="M100 84 H520" stroke="#e8d4c0" stroke-width="3" stroke-dasharray="14 10"/>
    <g class="cup"><path d="M430 22 h44 l-6 62 h-32z" fill="#e9cfae" stroke="#7a4a30" stroke-width="1.6"/><path d="M432 44 h40 l-4 40 h-32z" fill="#d9b48a"/><ellipse cx="452" cy="22" rx="24" ry="6" fill="#fff" stroke="#c9a885"/>
      <rect x="456" y="0" width="5" height="30" rx="2" fill="#e06b8b" transform="rotate(12 458 15)"/>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<circle cx="${440 + (i % 4) * 8 + (i > 3 ? 4 : 0)}" cy="${78 - (i > 3 ? 7 : 0)}" r="3.6" fill="#3b2a20"/>`).join('')}</g>
    <g class="cup" style="animation-delay:-1.5s"><svg x="370" y="40" width="44" height="44" viewBox="0 0 24 24">${BOBA.replace(/^<svg viewBox="0 0 24 24">|<\/svg>$/g, '')}</svg></g>
    <g class="ship-r"><g transform="translate(0 46)"><circle cx="12" cy="34" r="6" fill="#3d4d5c"/><circle cx="52" cy="34" r="6" fill="#3d4d5c"/><path d="M8 28 h48 l-6 -10 h-26z" fill="#ef8354"/>
      <rect x="0" y="4" width="22" height="20" rx="3" fill="#f7d08a"/><circle cx="11" cy="14" r="5" fill="#3b2a20"/><circle cx="40" cy="2" r="7" fill="#f2c9a0"/><path d="M33 0 a7 7 0 0114 0z" fill="#e06b8b"/><path d="M38 9 l6 12" stroke="#3d4d5c" stroke-width="5" stroke-linecap="round"/><path d="M46 14 l8 4" stroke="#3d4d5c" stroke-width="3"/></g></g></svg>`,
  cruise: `<svg viewBox="0 0 520 90" preserveAspectRatio="xMaxYMax meet">
    <g class="ship"><path d="M290 58 h120 l-14 18 h-96z" fill="#1d4f80"/><rect x="308" y="42" width="84" height="16" rx="3" fill="#fff" stroke="#cfe2f3"/><rect x="322" y="30" width="56" height="12" rx="3" fill="#fff" stroke="#cfe2f3"/>
      ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<circle cx="${316 + i * 11}" cy="50" r="2.4" fill="#7cc3e6"/>`).join('')}<rect x="362" y="16" width="10" height="14" fill="#e85d5d"/><path class="steam" d="M367 12 q4 -6 0 -10" stroke="#c9d6e2" fill="none" stroke-width="2"/></g>
    <path class="wave" d="M60 78 q15 -6 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 V90 H60z" fill="#9fd3ec"/>
    <path class="wave w2" d="M60 82 q15 -5 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 V90 H60z" fill="#6fb8de"/>
    <g class="bump"><line x1="462" y1="18" x2="462" y2="42" stroke="#999"/><ellipse cx="462" cy="52" rx="16" ry="9" fill="#f4b43c"/><rect x="452" y="40" width="20" height="10" rx="5" fill="#ffd36b"/><circle cx="462" cy="36" r="5" fill="#f2c9a0"/></g>
    <g class="bump b2"><line x1="496" y1="18" x2="496" y2="42" stroke="#999"/><ellipse cx="496" cy="52" rx="16" ry="9" fill="#e85d5d"/><rect x="486" y="40" width="20" height="10" rx="5" fill="#f79a9a"/><circle cx="496" cy="36" r="5" fill="#f2c9a0"/></g>
    <g class="cup"><svg x="236" y="28" width="40" height="40" viewBox="0 0 24 24">${LIFEBUOY.replace(/^<svg viewBox="0 0 24 24">|<\/svg>$/g, '')}</svg></g></svg>`,
  bloom: `<svg viewBox="0 0 520 90" preserveAspectRatio="xMaxYMax meet">
    <path d="M250 90 q40 -26 80 -8 q30 -22 70 -6 q40 -20 120 -6 V90z" fill="#e7f3e2"/>
    <g class="sway"><path d="M380 90 V46" stroke="#6aa86a" stroke-width="3"/><path d="M380 70 q-14 -4 -18 -14 q12 0 18 10" fill="#8cc58c"/>
      ${[0, 60, 120, 180, 240, 300].map((r) => `<path d="M380 40 q5 -14 0 -24 q-5 10 0 24z" fill="#fff" stroke="#f2c4d2" transform="rotate(${r} 380 40)"/>`).join('')}<circle cx="380" cy="40" r="3" fill="#f4b43c"/></g>
    <g class="sway s2"><path d="M440 90 V52" stroke="#5f9a5f" stroke-width="3"/><path d="M440 72 q12 -6 18 -16 q-12 2 -18 12" fill="#8cc58c"/><circle cx="440" cy="44" r="12" fill="#f27a9a"/><path d="M440 44 m-7 0 a7 7 0 1 0 14 0 a5 5 0 1 0 -10 0 a3 3 0 1 0 6 0" fill="none" stroke="#c2456a" stroke-width="1.6"/></g>
    <g class="sway"><path d="M492 90 V58" stroke="#6aa86a" stroke-width="3"/><circle cx="492" cy="52" r="9" fill="#f7b6c8"/><path d="M492 52 m-5 0 a5 5 0 1 0 10 0 a3.5 3.5 0 1 0 -7 0" fill="none" stroke="#d76d8f" stroke-width="1.4"/></g>
    <g class="sway s2">${[0, 72, 144, 216, 288].map((r) => `<ellipse cx="335" cy="56" rx="4" ry="8" fill="#fbd3de" transform="rotate(${r} 335 64)"/>`).join('')}<circle cx="335" cy="64" r="3" fill="#f4b43c"/><path d="M335 90 V68" stroke="#6aa86a" stroke-width="2.5"/></g>
    <g class="sway"><svg x="286" y="58" width="22" height="22" viewBox="0 0 24 24">${FLOWER('#f7b6c8').replace(/^<svg viewBox="0 0 24 24">|<\/svg>$/g, '')}</svg><path d="M297 80 V90" stroke="#6aa86a" stroke-width="2"/></g></svg>`,
};
const _cv = document.createElement('canvas').getContext('2d');
const tw = (txt, sz) => { _cv.font = `800 ${sz}px Nunito, 'Segoe UI', sans-serif`; return Math.max(_cv.measureText(txt).width, 140); };
const TX = (x, y, txt, fill, sz) => `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-family="Nunito, Segoe UI, sans-serif" font-weight="800" font-size="${sz}" fill="${fill}">${esc(txt)}</text>`;
const svgS = (W, H, body) => `<svg class="hscene" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Hello">${body}</svg>`;
function cloudPath(w, h) { const b = h - 8;
  return `M${w * .1} ${b} C${w * .01} ${b} 0 ${h * .6} ${w * .05} ${h * .46} C${w * .07} ${h * .34} ${w * .14} ${h * .3} ${w * .19} ${h * .32} C${w * .2} ${h * .08} ${w * .4} ${h * 0} ${w * .48} ${h * .18} C${w * .55} ${h * -.02} ${w * .8} ${h * 0} ${w * .84} ${h * .28} C${w * .97} ${h * .27} ${w} ${h * .5} ${w * .96} ${h * .64} C${w * .99} ${h * .86} ${w * .91} ${b} ${w * .85} ${b} C${w * .72} ${h + 3} ${w * .57} ${h - 1} ${w * .5} ${b - 4} C${w * .42} ${h + 1} ${w * .22} ${h + 3} ${w * .1} ${b} Z`; }
const OLs = 'stroke="#4a3a2e" stroke-width="2" stroke-linejoin="round"';
let _cupN = 0;
function bobaCup(x, y, s, tea = '#d8b08a', straw = '#ff8fab') { const id = 'cup' + (_cupN++); const cup = 'M15 20 L49 20 L45 58 Q44.6 61 41.5 61 L22.5 61 Q19.4 61 19 58 Z';
  let p = ''; [[24, 55], [30, 56], [36, 55], [42, 54], [27, 50], [33, 51], [39, 50]].forEach(([a, b]) => { p += `<circle cx="${a}" cy="${b}" r="2.8" fill="#3b2a20"/>`; });
  return `<svg x="${x}" y="${y}" width="${s}" height="${s}" viewBox="0 0 64 64"><defs><clipPath id="${id}"><path d="${cup}"/></clipPath></defs><path d="${cup}" fill="#fffaf4"/><g clip-path="url(#${id})"><rect x="0" y="26" width="64" height="64" fill="${tea}"/></g><path d="${cup}" fill="none" ${OLs}/><path d="M13 21 Q32 4 51 21 Z" fill="#fff" opacity=".85" ${OLs}/><rect x="34" y="1" width="6" height="40" rx="3" fill="${straw}" ${OLs} transform="rotate(12 37 20)"/>${p}</svg>`; }
function scooter(x, y) { return `<g transform="translate(${x} ${y})"><circle cx="8" cy="30" r="6" fill="#3d4d5c"/><circle cx="46" cy="30" r="6" fill="#3d4d5c"/><circle cx="8" cy="30" r="2.4" fill="#c9d3dd"/><circle cx="46" cy="30" r="2.4" fill="#c9d3dd"/>
  <path d="M4 24 h44 l-6 -10 h-24z" fill="#ff8a5c" ${OLs}/><rect x="-6" y="0" width="22" height="18" rx="3" fill="#ffd36b" ${OLs}/><text x="5" y="12" text-anchor="middle" font-size="8" font-weight="800" fill="#8b5a3c" font-family="Nunito">BOBA</text>
  <circle cx="34" cy="-4" r="7" fill="#f2c9a0" ${OLs}/><path d="M27 -6 a7 7 0 0114 0z" fill="#e06b8b" ${OLs}/><path d="M32 4 l6 12" stroke="#3d4d5c" stroke-width="5" stroke-linecap="round"/><path d="M40 8 l8 4" stroke="#3d4d5c" stroke-width="3"/></g>`; }
const HELLO = {
  pro(txt) { return `<div class="hp19"><small>${greet20()}</small><b>${esc(txt.replace('Hello ', 'Hello, ').replace('!', ''))}</b></div>`; },
  simple(txt) { const t = tw(txt, 42), W = Math.round(t / 0.72 + 24), H = Math.round(Math.max(140, W * .36));
    return svgS(W + 6, H + 6, `<g transform="translate(3 3)" class="cl"><path d="${cloudPath(W, H)}" fill="#f3f8fd" stroke="#6c9fcf" stroke-width="1.5"/>${TX(W / 2, H * .56, txt, '#1d5d92', 42)}</g>`); },
  autumn(txt) { const t = tw(txt, 38), W = Math.round(t + 150), H = 230, C = ['#e8873a', '#f2b632', '#c8502b', '#d9762b']; let s = `<path d="M0 22 C${W * .3} 40 ${W * .6} 10 ${W} 30" stroke="#6b4226" stroke-width="9" fill="none" stroke-linecap="round"/>`;
    for (let i = 0; i < 18; i++) { const s0 = 26 + (i * 7) % 14; s += `<svg x="${i * W / 17 - s0 / 2}" y="${8 + (i * 11) % 24 - s0 / 3}" width="${s0}" height="${s0}" viewBox="0 0 24 24" overflow="visible"><g transform="rotate(${(i * 47) % 360 - 180} 12 12)"><path d="${MAPLE}" fill="${LEAVES[i % 5][i % 2]}"/><path d="M12 21.4V6.5M12 12.5l-4.2-3.4M12 12.5l4.2-3.4" stroke="rgba(120,50,10,.4)" stroke-width=".7" fill="none"/></g></svg>`; }
    const sx = 50, sw = W - 100; s += `<line x1="${sx + 26}" y1="34" x2="${sx + 26}" y2="104" stroke="#8a6a4a" stroke-width="2"/><line x1="${sx + sw - 26}" y1="34" x2="${sx + sw - 26}" y2="104" stroke="#8a6a4a" stroke-width="2"/>`;
    s += `<g class="sway19"><rect x="${sx}" y="100" width="${sw}" height="80" rx="12" fill="#c98b5a" stroke="#8a5a2b" stroke-width="3"/><rect x="${sx + 8}" y="108" width="${sw - 16}" height="64" rx="8" fill="#fbe8cf"/>${TX(W / 2, 141, txt, '#a4471b', 38)}</g>`;
    for (let j = 0; j < 8; j++) s += `<g transform="translate(${30 + j * (W - 60) / 7} ${44 + (j * 13) % 30})"><g class="lf" style="--t:${6 + j}s;animation-delay:-${j}s;--h1:70px;--h2:170px"><path d="${MAPLE}" transform="translate(-8 -8) scale(.66)" fill="${C[j % 4]}"/></g></g>`;
    return svgS(W, H, s); },
  boba(txt) { const t = tw(txt, 38), m = 70, W = Math.round(t + 70 + 2 * m), H = 232; const n = Math.max(6, Math.round((W - 2 * m) / 34)), sw = (W - 2 * m) / n; let aw = '', sc = '';
    for (let i = 0; i < n; i++) { const c = i % 2 ? '#fff4ea' : '#e98aa5'; aw += `<rect x="${m + i * sw}" y="26" width="${sw}" height="40" fill="${c}"/>`; sc += `<path d="M${m + i * sw} 66 a${sw / 2} ${sw / 2} 0 0 0 ${sw} 0Z" fill="${c}" stroke="#b5577a" stroke-width="1.4"/>`; }
    return svgS(W, H, `<defs><clipPath id="awb"><path d="M${m + 14} 26 H${W - m - 14} L${W - m} 66 H${m} Z"/></clipPath></defs><g clip-path="url(#awb)">${aw}</g>${sc}<rect x="${m + 8}" y="20" width="${W - 2 * m - 16}" height="7" rx="3.5" fill="#8b5a3c"/>
      <rect x="${m + 4}" y="92" width="${W - 2 * m - 8}" height="70" rx="14" fill="#fff8f0" stroke="#e0c3a6" stroke-width="2"/>${TX(W / 2, 127, txt, '#8b4a5f', 38)}
      <g class="bob19">${bobaCup(6, 86, 62)}</g><g class="bob19 b2">${bobaCup(W - 66, 92, 58, '#b9dc7d', '#7bc96f')}</g>
      <path d="M0 ${H - 14} H${W}" stroke="#e8d4c0" stroke-width="3" stroke-dasharray="14 10"/><g class="ride19">${scooter(0, H - 52)}</g>`); },
  cruise(txt) { const t = tw(txt, 36), W = Math.round(t + 170), H = 232, hx = 30, hw = W - 60; let win = '';
    for (let i = 0; i < Math.floor((hw - 120) / 18); i++) win += `<circle cx="${hx + 80 + i * 18}" cy="108" r="3.6" fill="#7cc3e6"/>`;
    return svgS(W, H, `<g class="bob2-19"><rect x="${hx + 70}" y="54" width="${hw - 150}" height="26" rx="5" fill="#fff" stroke="#9cc0dc" stroke-width="2"/><rect x="${hx + 60}" y="78" width="${hw - 110}" height="40" rx="6" fill="#fff" stroke="#9cc0dc" stroke-width="2"/>${win}
      <rect x="${hx + hw - 150}" y="24" width="20" height="32" rx="3" fill="#e85d5d" stroke="#a63a3a" stroke-width="2"/><rect x="${hx + hw - 120}" y="30" width="18" height="26" rx="3" fill="#e85d5d" stroke="#a63a3a" stroke-width="2"/><path class="smoke19" d="M${hx + hw - 140} 18 q8 -10 0 -18" stroke="#c9d6e2" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M${hx} 118 H${hx + hw} L${hx + hw - 34} 182 H${hx + 26} Z" fill="#1d4f80" stroke="#123a60" stroke-width="2"/>${TX(W / 2, 150, txt, '#ffffff', 36)}</g>
      <path class="wv19" d="M-40 186 q20 -9 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 V${H} H-40z" fill="#9fd3ec"/>
      <path class="wv19 w2" d="M-40 198 q20 -8 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 V${H} H-40z" fill="#5fb0da"/>`); },
  bloom(txt) { // v8: flower garland arch over a soft card
    const t = tw(txt, 40), W = Math.round(t + 210), H = 236, cx = W / 2;
    const f5 = (x, y, s, c, ctr = '#ffd36b') => `<g transform="translate(${x} ${y}) scale(${s / 24})">${[0, 72, 144, 216, 288].map((r) => `<ellipse cx="0" cy="-6.2" rx="3.9" ry="5.6" fill="${c}" stroke="rgba(150,80,130,.25)" stroke-width=".5" transform="rotate(${r})"/>`).join('')}<circle r="3" fill="${ctr}"/><circle cx="-1" cy="-1" r="1" fill="#fff" opacity=".8"/></g>`;
    const rose = (x, y, s, c, d) => `<g transform="translate(${x} ${y}) scale(${s / 24})"><circle r="11" fill="${c}"/><path d="M-6 1 a6 6 0 1 0 12 0 a4.2 4.2 0 1 0 -8.4 0 a2.6 2.6 0 1 0 5.2 0" fill="none" stroke="${d}" stroke-width="1.6" stroke-linecap="round"/></g>`;
    const leaf = (x, y, r, c = '#8cc58c') => `<ellipse cx="${x}" cy="${y}" rx="9" ry="4" fill="${c}" transform="rotate(${r} ${x} ${y})"/>`;
    const P = (u) => { const x0 = 26, x1 = W - 26, y0 = 112, yc = -6; const x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1, y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * yc + u * u * y0; return [x, y]; };
    const C = [['#f7a8c8', '#ffd36b'], ['#c9a7f0', '#fff3b0'], ['#fff', '#f4b43c'], ['#ffc2a8', '#ffd36b'], ['#f49ab3', '#fff3b0']];
    let g = `<path d="M26 112 Q${cx} -6 ${W - 26} 112" stroke="#7fb87f" stroke-width="2.5" fill="none"/>`;
    for (let i = 0; i <= 16; i++) { const [x, y] = P(i / 16); g += leaf(x - 8, y + 4, i * 37 % 180, i % 2 ? '#8cc58c' : '#a7d6a0'); }
    for (let i = 0; i <= 12; i++) { const [x, y] = P(i / 12); const s = i % 3 === 1 ? 30 : i % 3 === 2 ? 22 : 26;
      g += `<g class="sway19" style="animation-delay:-${i * .4}s">${i % 4 === 2 ? rose(x, y, s + 4, '#f27a9a', '#c2456a') : f5(x, y, s, C[i % 5][0], C[i % 5][1])}</g>`; }
    const corner = (x, flip) => `<g transform="translate(${x} 182) scale(${flip ? -1 : 1} 1)">${leaf(-14, 6, -30)}${leaf(20, 10, 30)}${leaf(4, 18, 80, '#a7d6a0')}${rose(0, 0, 32, '#f7a8c8', '#d76d8f')}${f5(-20, 14, 22, '#c9a7f0', '#fff3b0')}${f5(22, 18, 20, '#fff', '#f4b43c')}${f5(6, -18, 16, '#ffc2a8')}</g>`;
    return svgS(W, H, `<rect x="44" y="96" width="${W - 88}" height="92" rx="46" fill="#fff" stroke="#e7c6ef" stroke-width="2"/><rect x="52" y="104" width="${W - 104}" height="76" rx="38" fill="none" stroke="#f3dcef" stroke-width="1.5" stroke-dasharray="3 5"/>
      ${TX(cx, 142, txt, '#b0459a', 40)}${g}${corner(52, false)}${corner(W - 52, true)}
      ${butterfly(cx - t / 2 - 10, 60, '#f7a8c8', 0)}${butterfly(cx + t / 2 - 30, 40, '#c9a7f0', -3)}
      ${[0, 1, 2, 3, 4].map((i) => `<ellipse class="pet19" style="animation-delay:-${i * 1.3}s" cx="${60 + i * (W - 120) / 4}" cy="20" rx="3.5" ry="6" fill="${['#f7b6c8', '#e3cff7', '#f49ab3'][i % 3]}"/>`).join('')}`);
  }
};

// right side of the Home hero: a themed picture (no weather)
const PDEF = (a, b) => `<defs><linearGradient id="pbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="600" height="240" fill="url(#pbg)"/>`;
const leafAt = (x, y, s, r, i, cls = '') => `<svg class="${cls}" x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" viewBox="0 0 24 24" overflow="visible"><g transform="rotate(${r} 12 12)"><path d="${MAPLE}" fill="${LEAVES[i % 5][i % 2]}"/><path d="M12 21.4V6.5M12 12.5l-4.2-3.4M12 12.5l4.2-3.4" stroke="rgba(120,50,10,.4)" stroke-width=".7" fill="none"/></g></svg>`;
const tree = (x, base, w) => { let s = `<path d="M${x} ${base} V${base - 70}" stroke="#7a4a24" stroke-width="${w / 9}" stroke-linecap="round"/><path d="M${x} ${base - 50} l-${w / 4} -22 M${x} ${base - 58} l${w / 4} -20" stroke="#7a4a24" stroke-width="${w / 16}" stroke-linecap="round"/>`;
  for (let i = 0; i < 22; i++) { const a = i * 2.4, r = (i % 7) * w / 14; s += leafAt(x + Math.cos(a) * r, base - 92 + Math.sin(a) * r * .7, 20 + (i * 5) % 12, (i * 53) % 360, i); } return s; };
const butterfly = (x, y, c, d) => `<g class="bfly" style="animation-delay:${d}s"><g transform="translate(${x} ${y})"><ellipse class="wgl" cx="-6" cy="-3" rx="7" ry="9" fill="${c}"/><ellipse class="wgr" cx="6" cy="-3" rx="7" ry="9" fill="${c}"/><ellipse cx="-5" cy="7" rx="4.5" ry="5" fill="${c}" opacity=".8"/><ellipse cx="5" cy="7" rx="4.5" ry="5" fill="${c}" opacity=".8"/><rect x="-1" y="-8" width="2" height="18" rx="1" fill="#5a3a4a"/></g></g>`;
const PANEL = {
  bloom: () => { let f = ''; for (let i = 0; i < 26; i++) { const x = 10 + i * 23 + (i % 2) * 8, y = 200 + (i % 3) * 12, c = ['#f27a9a', '#f7b6c8', '#fff', '#ffd36b', '#f49ab3'][i % 5];
      f += `<g class="sway" style="animation-delay:-${i % 5}s"><path d="M${x} 240 V${y}" stroke="#6aa86a" stroke-width="2"/><svg x="${x - 9}" y="${y - 9}" width="18" height="18" viewBox="0 0 24 24">${FLOWER(c).replace(/^<svg viewBox="0 0 24 24">|<\/svg>$/g, '')}</svg></g>`; }
    return PDEF('#fff3f7', '#fde3ec') + '<path d="M0 190 C120 160 220 200 330 176 C440 152 520 188 600 170 V240 H0Z" fill="#dcefd6"/><path d="M0 214 C140 196 260 226 380 206 C470 194 540 212 600 204 V240 H0Z" fill="#c7e6bf"/>' +
      SCENE.bloom.replace('<svg viewBox="0 0 520 90" preserveAspectRatio="xMaxYMax meet">', '<g transform="translate(40 60) scale(1.3)">').replace(/<\/svg>$/, '</g>') + f +
      butterfly(150, 70, '#f7b6c8', 0) + butterfly(420, 50, '#b8d8f5', -2) + butterfly(300, 110, '#ffd36b', -4) +
      [0, 1, 2, 3, 4].map((i) => `<ellipse class="pet19" style="animation-delay:-${i * 1.4}s" cx="${80 + i * 110}" cy="20" rx="4" ry="7" fill="${['#f7b6c8', '#fbd3de', '#f49ab3'][i % 3]}"/>`).join(''); },
  autumn: () => PDEF('#fff6e8', '#fde7c8') + '<path d="M0 196 C140 176 260 206 380 188 C470 176 540 196 600 186 V240 H0Z" fill="#f3d9b0"/><path d="M220 240 C250 210 300 200 360 196" stroke="#e9c79a" stroke-width="18" fill="none" opacity=".7"/>' +
    tree(110, 205, 120) + tree(470, 200, 140) + tree(300, 190, 80) +
    '<g transform="translate(330 186)"><rect x="0" y="12" width="60" height="6" rx="2" fill="#a0673a"/><rect x="5" y="18" width="5" height="16" fill="#7a4a24"/><rect x="50" y="18" width="5" height="16" fill="#7a4a24"/><rect x="0" y="0" width="60" height="5" rx="2" fill="#a0673a"/></g>' +
    '<g transform="translate(410 214)"><ellipse cx="0" cy="0" rx="16" ry="12" fill="#f28b2c" stroke="#c4621a"/><path d="M-6 -11 q6 6 0 22 M6 -11 q-6 6 0 22" stroke="#c4621a" fill="none"/><path d="M0 -12 q2 -6 6 -7" stroke="#5f7d2f" stroke-width="3" fill="none"/></g>' +
    [[60, 228, 18], [180, 232, 16], [250, 224, 20], [520, 230, 18], [560, 222, 16]].map(([x, y, s], i) => leafAt(x, y, s, i * 70, i + 1)).join('') +
    [0, 1, 2, 3, 4, 5].map((i) => `<g class="lfall2" style="animation-delay:-${i * 1.6}s;animation-duration:${8 + i}s">${leafAt(80 + i * 90, 20, 18, i * 40, i + 2)}</g>`).join(''),
  boba: () => PDEF('#fff8f1', '#f9e6d6') +
    `<rect x="0" y="0" width="600" height="46" fill="#fff4ea"/>${[...Array(12)].map((_, i) => `<path d="M${i * 50} 30 h50 v16 a25 14 0 0 1 -50 0z" fill="${i % 2 ? '#fff4ea' : '#e98aa5'}" stroke="#b5577a" stroke-width="1.2"/>`).join('')}<rect x="0" y="24" width="600" height="7" fill="#8b5a3c"/>
    <rect x="360" y="70" width="200" height="86" rx="10" fill="#4a3a32"/><text x="460" y="94" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="15" fill="#ffd36b">MENU</text>
    ${[['Milk tea', '$5.5'], ['Taro', '$6'], ['Matcha', '$6'], ['Thai tea', '$5.5']].map(([n, pr], i) => `<text x="380" y="${114 + i * 12}" font-family="Nunito" font-size="10.5" fill="#fff">${n}</text><text x="540" y="${114 + i * 12}" text-anchor="end" font-family="Nunito" font-size="10.5" fill="#f7b6c8">${pr}</text>`).join('')}
    <rect x="0" y="176" width="600" height="20" fill="#c98b5a"/><rect x="0" y="196" width="600" height="44" fill="#a86c3f"/>
    <g class="bob19">${bobaCup(40, 110, 70)}</g><g class="bob19 b2">${bobaCup(120, 116, 64, '#b9dc7d', '#7bc96f')}</g><g class="bob19 b3">${bobaCup(196, 112, 68, '#c9a7e8', '#ffd36b')}</g><g class="bob19 b4">${bobaCup(272, 118, 62, '#f5a54a', '#ff8fab')}</g>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<circle class="pearl" style="animation-delay:-${i * .4}s" cx="${70 + i * 32}" cy="70" r="5" fill="#3b2a20"/>`).join('')}
    <g class="ride19">${scooter(0, 206)}</g>`,
  cruise: () => PDEF('#e6f6fd', '#bfe5f6') +
    '<g class="drift19"><ellipse cx="120" cy="40" rx="46" ry="12" fill="#fff" opacity=".9"/><ellipse cx="150" cy="32" rx="30" ry="12" fill="#fff" opacity=".9"/></g><g class="drift19 d2"><ellipse cx="420" cy="30" rx="40" ry="10" fill="#fff" opacity=".8"/></g>' +
    '<path d="M470 150 q40 -24 110 -8 v20 h-110z" fill="#f3e0b0"/><path d="M540 146 C542 120 536 100 528 90" stroke="#8b5a2b" stroke-width="5" fill="none"/><path d="M528 90 q-22 -4 -28 12 M528 90 q20 -8 28 8 M528 90 q-4 -20 8 -26" stroke="#3aa25a" stroke-width="6" fill="none" stroke-linecap="round"/>' +
    '<g class="bob2-19"><path d="M120 150 h250 l-26 38 h-200z" fill="#1d4f80"/><rect x="150" y="116" width="190" height="34" rx="5" fill="#fff" stroke="#9cc0dc" stroke-width="2"/><rect x="180" y="92" width="130" height="24" rx="5" fill="#fff" stroke="#9cc0dc" stroke-width="2"/>' +
    [...Array(12)].map((_, i) => `<circle cx="${162 + i * 15}" cy="133" r="3.6" fill="#7cc3e6"/>`).join('') + '<rect x="276" y="66" width="18" height="26" rx="3" fill="#e85d5d"/><rect x="300" y="72" width="16" height="20" rx="3" fill="#e85d5d"/><path class="smoke19" d="M285 60 q8 -10 0 -18" stroke="#dbe6ef" stroke-width="4" fill="none" stroke-linecap="round"/>' +
    '<g class="bump"><ellipse cx="200" cy="112" rx="14" ry="7" fill="#f4b43c"/><circle cx="200" cy="102" r="4" fill="#f2c9a0"/></g><g class="bump b2"><ellipse cx="236" cy="112" rx="14" ry="7" fill="#e85d5d"/><circle cx="236" cy="102" r="4" fill="#f2c9a0"/></g></g>' +
    '<path class="wv19" d="M-40 186 q25 -10 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 V240 H-40z" fill="#7fc4e4"/><path class="wv19 w2" d="M-40 204 q25 -8 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 V240 H-40z" fill="#3f98c9"/>' +
    `<g class="bob19"><svg x="40" y="120" width="56" height="56" viewBox="0 0 24 24">${LIFEBUOY.replace(/^<svg viewBox="0 0 24 24">|<\/svg>$/g, '')}</svg></g>` +
    '<g class="drift19 d2"><path d="M380 60 q6 -6 12 0 q6 -6 12 0" stroke="#55707f" stroke-width="2" fill="none"/></g><g class="drift19"><path d="M80 80 q5 -5 10 0 q5 -5 10 0" stroke="#55707f" stroke-width="2" fill="none"/></g>',
};

const PARTS = {
  autumn: () => LEAVES.map((c, i) => leafSvg(c[0], c[1], 'pl' + i)),
  boba: () => ['<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="#3b2a20"/><circle cx="9.5" cy="9.5" r="2" fill="#7a5a48"/></svg>', BOBA, '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="3" fill="#a8d86e" opacity=".85"/></svg>'],
  bloom: () => [FLOWER('#f7b6c8'), '<svg viewBox="0 0 24 24"><path fill="#fbd3de" stroke="#f2b8cb" d="M12 3c4 3 6 7 4 12-1.5 3.5-6.5 3.5-8 0-2-5 0-9 4-12z"/></svg>', '<svg viewBox="0 0 24 24"><path fill="#f49ab3" d="M12 3c4 3 6 7 4 12-1.5 3.5-6.5 3.5-8 0-2-5 0-9 4-12z"/></svg>'],
  cruise: () => ['<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="none" stroke="#7cc3e6" stroke-width="1.5"/><circle cx="9.5" cy="9.5" r="1.5" fill="#bfe3f4"/></svg>'],
};
const VINEF = svgUri('<svg width="160" height="22"><path d="M0 8 q40 12 80 0 t80 0" stroke="#6aa86a" stroke-width="2" fill="none"/><ellipse cx="24" cy="13" rx="6" ry="3" fill="#8cc58c" transform="rotate(25 24 13)"/><circle cx="52" cy="12" r="5" fill="#f27a9a"/><circle cx="52" cy="12" r="2" fill="#b03a5f"/><ellipse cx="104" cy="4" rx="6" ry="3" fill="#8cc58c" transform="rotate(-20 104 4)"/><g transform="translate(132 6)"><circle r="2" fill="#f4b43c"/><ellipse cx="0" cy="-5" rx="2" ry="4" fill="#fff" stroke="#f2b8cb"/><ellipse cx="5" cy="0" rx="4" ry="2" fill="#fff" stroke="#f2b8cb"/><ellipse cx="0" cy="5" rx="2" ry="4" fill="#fff" stroke="#f2b8cb"/><ellipse cx="-5" cy="0" rx="4" ry="2" fill="#fff" stroke="#f2b8cb"/></g></svg>');
const LEAFROW = svgUri('<svg width="120" height="18"><path d="M0 4 q30 10 60 0 t60 0" stroke="#8a5a2b" stroke-width="2" fill="none"/><path d="M18 2l1.5 3.5 2.6-1.2-.6 3.2 3.2-.9-1.4 2.8 2.9 1.1-2.8 1.7 1.2 1.4-3.7.3.3 3-2.6-1.6-.6 3.3-.7-4.9-2.6 1.6.3-3-3.7-.3 1.2-1.4-2.8-1.7 2.9-1.1-1.4-2.8 3.2.9-.6-3.2 2.6 1.2z" fill="#f2b01e" transform="scale(.55) translate(10 6)"/><circle cx="44" cy="10" r="4" fill="#e8862a"/><circle cx="80" cy="4" r="4" fill="#d9622b"/><circle cx="104" cy="6" r="3.5" fill="#f6c945"/></svg>');
const PEARLROW = svgUri('<svg width="60" height="12"><circle cx="8" cy="6" r="4" fill="#3b2a20"/><circle cx="24" cy="6" r="4" fill="#d9a877"/><circle cx="40" cy="6" r="4" fill="#3b2a20"/><rect x="50" y="3" width="7" height="6" rx="2" fill="#a8d86e"/></svg>');
const WAVE = svgUri('<svg width="80" height="12"><path d="M0 6 q10 -6 20 0 t20 0 t20 0 t20 0" stroke="#2b9fd0" stroke-width="2.5" fill="none"/></svg>');
function setTheme(k) {
  THEME = k; PHONE = isPhone(); document.body.dataset.style = k;
  let L = $('#decor'); if (!L) { L = document.createElement('div'); L.id = 'decor'; L.setAttribute('aria-hidden', 'true'); document.body.appendChild(L); }
  document.body.style.setProperty('--ti', svgUri(TICON[k])); document.body.style.setProperty('--vinef', VINEF); document.body.style.setProperty('--wave', WAVE); document.body.style.setProperty('--leafrow', LEAFROW); document.body.style.setProperty('--pearlrow', PEARLROW);
  L.innerHTML = '';
  if (MOTION && PARTS[k] && !PHONE) { const P0 = PARTS[k](); const up = k === 'cruise';
    for (let i = 0; i < (up ? 6 : 9); i++) { const s = document.createElement('span'); s.className = up ? 'pt up' : 'pt'; s.innerHTML = P0[i % P0.length];
      s.style.left = ((i * 37 + 11) % 100) + 'vw'; const sz = (k === 'autumn' ? 16 : 12) + (i * 5) % 12; s.style.width = s.style.height = sz + 'px';
      s.style.animationDuration = (16 + (i * 7) % 12) + 's'; s.style.animationDelay = (-(i * 2.7) % 20) + 's'; s.style.setProperty('--dx', ((i % 2 ? 1 : -1) * (30 + i * 7)) + 'px'); L.appendChild(s); } }
  if (MOTION && !PHONE) { let h = ''; // v7: more theme around the page (like v5)
    if (k === 'boba') h = [0, 1, 2, 3, 4, 5].map((i) => `<span class="snk" style="${i % 2 ? 'right' : 'left'}:${6 + i % 3 * 10}px;top:${26 + i * 11}vh;animation-delay:-${i}s"><svg width="40" height="40" viewBox="0 0 64 64">${bobaCup(0, 0, 64, ['#d8b08a', '#b9dc7d', '#f5a54a'][i % 3], ['#ff8fab', '#7bc96f', '#ffd36b'][i % 3])}</svg></span>`).join('');
    if (k === 'cruise') h = `<svg class="seab" viewBox="0 0 1200 40" preserveAspectRatio="none"><path d="M0 18 Q75 4 150 18 T300 18 T450 18 T600 18 T750 18 T900 18 T1050 18 T1200 18 V40 H0Z" fill="#9fd3ec" opacity=".75"/><path d="M0 26 Q75 14 150 26 T300 26 T450 26 T600 26 T750 26 T900 26 T1050 26 T1200 26 V40 H0Z" fill="#3f98c9" opacity=".85"/></svg><span class="shipb"><svg width="46" height="28" viewBox="0 0 46 28"><path d="M2 16 h40 l-6 10 h-28z" fill="#1d4f80"/><rect x="8" y="8" width="28" height="8" rx="2" fill="#fff" stroke="#9cc0dc"/><rect x="26" y="1" width="6" height="7" fill="#e85d5d"/></svg></span>` + [0, 1].map((i) => `<span class="snk" style="${i ? 'right' : 'left'}:8px;top:${40 + i * 25}vh;animation-delay:-${i * 2}s"><svg width="34" height="34" viewBox="0 0 24 24">${LIFEBUOY.replace(/^<svg viewBox="0 0 24 24">|<\/svg>$/g, '')}</svg></span>`).join('');
    if (k === 'bloom' || k === 'autumn') h = [0, 1].map((i) => `<span class="bush ${i ? 'r' : ''}"><svg viewBox="0 0 140 120">${k === 'bloom' ? [...Array(9)].map((_, j) => `<path d="M${20 + j * 13} 120 V${60 + (j * 17) % 40}" stroke="#6aa86a" stroke-width="2.5"/><svg x="${10 + j * 13}" y="${50 + (j * 17) % 40}" width="22" height="22" viewBox="0 0 24 24">${FLOWER(['#f27a9a', '#f7b6c8', '#fff', '#ffd36b'][j % 4]).replace(/^<svg viewBox="0 0 24 24">|<\/svg>$/g, '')}</svg>`).join('') : [...Array(12)].map((_, j) => leafAt(15 + (j * 23) % 120, 70 + (j * 13) % 50, 24 + (j % 3) * 6, j * 37, j)).join('')}</svg></span>`).join('');
    L.insertAdjacentHTML('beforeend', h); }
}
const themeHtml = () => `<div class="rules-top"><h2>Theme</h2><label class="small"><input type="checkbox" id="motion" ${MOTION ? 'checked' : ''}> Animation</label></div>
  <div class="thgrid">${THEMES.map(([k, n]) => `<button class="thcard th-${k} ${THEME === k ? 'on' : ''}" data-theme="${k}"><span class="thprev">${SCENE[k]}</span><b><span class="thic">${TICON[k]}</span>${n}</b></button>`).join('')}</div>`;


const WV1 = svgUri('<svg width="80" height="20"><path d="M0 9 C10 4 30 4 40 9 S70 14 80 9 V20 H0Z" fill="#a9dcf2"/><path d="M8 7.2 q6 -2.4 12 -.6" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".9"/></svg>');
const WV2 = svgUri('<svg width="120" height="14"><path d="M0 6 C15 2 45 2 60 6 S105 10 120 6 V14 H0Z" fill="#4fa6d6"/><path d="M70 7.5 q8 1.8 16 .4" stroke="#d9f1fb" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>');
const LV20 = svgUri(`<svg width="160" height="26">${[[10, 12, 15, 20, 0], [34, 6, 12, -40, 1], [56, 13, 17, 65, 2], [82, 5, 11, 140, 3], [100, 12, 16, -15, 4], [126, 7, 13, 95, 0], [146, 13, 12, -70, 2]].map(([x, y, s, r, i]) => `<svg x="${x - s / 2}" y="${y - s / 2 + 6}" width="${s}" height="${s}" viewBox="0 0 24 24" overflow="visible"><g transform="rotate(${r} 12 12)"><path d="${MAPLE}" fill="${LEAVES[i][i % 2]}"/><path d="M12 21.4V6.5M12 12.5l-4.2-3.4M12 12.5l4.2-3.4" stroke="rgba(120,50,10,.35)" stroke-width=".8" fill="none"/></g></svg>`).join('')}<circle cx="70" cy="22" r="2" fill="#c98a4b"/><circle cx="116" cy="21" r="1.6" fill="#d9a066"/></svg>`);
const fl20 = (x, y, s, c, ctr = '#ffd36b') => `<g transform="translate(${x} ${y}) scale(${s / 24})">${[0, 72, 144, 216, 288].map((r) => `<ellipse cx="0" cy="-6" rx="3.9" ry="5.4" fill="${c}" transform="rotate(${r})"/>`).join('')}<circle r="2.8" fill="${ctr}"/></g>`;
const BL20 = svgUri(`<svg width="150" height="26"><path d="M0 26 ${Array.from({ length: 30 }, (_, i) => `L${i * 5 + 2.5} ${17 + (i * 7) % 5} L${i * 5 + 5} 26`).join(' ')}Z" fill="#9fd08f"/><path d="M0 26 ${Array.from({ length: 25 }, (_, i) => `L${i * 6 + 3} ${20 + (i * 3) % 4} L${i * 6 + 6} 26`).join(' ')}Z" fill="#78b86c"/>
  <path d="M18 24 V12 M52 24 V9 M88 24 V13 M118 24 V10 M138 24 V14" stroke="#5f9c57" stroke-width="1.3"/>${fl20(18, 10, 13, '#f7a8c8')}${fl20(52, 8, 15, '#ffffff', '#f4b43c')}${fl20(88, 11, 12, '#c9a7f0', '#fff3b0')}${fl20(138, 12, 11, '#ffc2a8')}
  <circle cx="118" cy="9" r="5.2" fill="#f27a9a"/><path d="M115.2 9.4 a2.8 2.8 0 1 0 5.6 0 a1.9 1.9 0 1 0 -3.8 0" fill="none" stroke="#c2456a" stroke-width="1.1" stroke-linecap="round"/><ellipse cx="114" cy="15" rx="3" ry="1.4" fill="#78b86c" transform="rotate(-30 114 15)"/></svg>`);
document.body.style.setProperty('--wv1', WV1); document.body.style.setProperty('--wv2', WV2); document.body.style.setProperty('--lv20', LV20); document.body.style.setProperty('--bl20', BL20);
const MCOL = ['#b8322a', '#d9452b', '#e8642c', '#f08a2c', '#f4ab32', '#c93f2a'];
function mapleCrown(cx, cy, rx, ry, n = 26, seed = 1) {
  const r = rnd(seed); let s = '';
  const pts = Array.from({ length: n }, (_, i) => { const a = i * 2.39996, d = Math.sqrt((i + .5) / n); return [cx + Math.cos(a) * d * rx * .82, cy + Math.sin(a) * d * ry * .8, (1 - d) ]; }).sort((a, b) => a[1] - b[1]);
  pts.forEach(([x, y], i) => { const rr = (rx * .19) * (0.8 + r() * .5); s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(1)}" fill="${MCOL[Math.floor(r() * MCOL.length)]}" opacity="${(.82 + r() * .18).toFixed(2)}"/>`; });
  for (let i = 0; i < n * 1.6; i++) { const a = r() * 6.283, d = Math.sqrt(r()); const x = cx + Math.cos(a) * d * rx, y = cy + Math.sin(a) * d * ry, sz = 10 + r() * 9;
    s += `<svg x="${(x - sz / 2).toFixed(1)}" y="${(y - sz / 2).toFixed(1)}" width="${sz.toFixed(1)}" height="${sz.toFixed(1)}" viewBox="0 0 24 24" overflow="visible"><path d="${MAPLE}" fill="${LEAVES[i % 5][i % 2]}" transform="rotate(${Math.round(r() * 360)} 12 12)"/></svg>`; }
  return s;
}
function mapleTree(x, base, h, seed = 3) { // Canada (sugar) maple: thick trunk, broad oval crown
  const ty = base - h * .45, cw = h * .62;
  return `<path d="M${x - h * .06} ${base} C${x - h * .04} ${base - h * .2} ${x - h * .03} ${ty + 10} ${x - h * .015} ${ty} L${x + h * .015} ${ty} C${x + h * .03} ${ty + 10} ${x + h * .04} ${base - h * .2} ${x + h * .07} ${base} Z" fill="#6b4226"/>
    <path d="M${x} ${ty + 14} q${-cw * .35} ${-h * .12} ${-cw * .55} ${-h * .25} M${x} ${ty + 6} q${cw * .3} ${-h * .14} ${cw * .5} ${-h * .26} M${x} ${ty} V${ty - h * .3}" stroke="#6b4226" stroke-width="${(h * .028).toFixed(1)}" fill="none" stroke-linecap="round"/>
    ${mapleCrown(x, ty - h * .2, cw, h * .3, 46, seed)}`;
}
function bigFlower(x, y, s, i = 0) {
  const P = [['#ff7aa2', '#ffc2d4'], ['#ffb347', '#ffe0a3'], ['#c48cf2', '#ead7ff'], ['#ffffff', '#fff3c4'], ['#ff6f61', '#ffc1b8'], ['#f7a8c8', '#fff0f6']][i % 6]; const k = s / 24, ctr = i % 6 === 3 ? '#f4b43c' : '#ffd84d';
  return `<g transform="translate(${x} ${y}) scale(${k.toFixed(2)})">${[0, 45, 90, 135, 180, 225, 270, 315].map((r) => `<ellipse cx="0" cy="-7.5" rx="4.6" ry="7.6" fill="${P[0]}" stroke="rgba(120,60,90,.18)" stroke-width=".5" transform="rotate(${r + 22})"/>`).join('')}${[0, 60, 120, 180, 240, 300].map((r) => `<ellipse cx="0" cy="-5" rx="3" ry="5" fill="${P[1]}" transform="rotate(${r})"/>`).join('')}<circle r="3.6" fill="${ctr}"/><circle r="3.6" fill="none" stroke="#e09a1c" stroke-width=".6" stroke-dasharray="1 1.2"/></g>`;
}
function bee20(x, y, d) {
  return `<g class="bee20" style="animation-delay:${d}s"><g transform="translate(${x} ${y})"><ellipse class="wg" cx="-3" cy="-7" rx="5" ry="3.4" fill="#e8f6ff" stroke="#a9cbe0" stroke-width=".6" opacity=".9"/><ellipse class="wg" cx="4" cy="-7" rx="5" ry="3.4" fill="#e8f6ff" stroke="#a9cbe0" stroke-width=".6" opacity=".9"/>
    <ellipse cx="0" cy="0" rx="9" ry="6" fill="#ffcf33"/><path d="M-3 -5.6 v11.2 M2 -5.8 v11.6" stroke="#3a2a1a" stroke-width="2.2"/><circle cx="8.6" cy="-1" r="3.4" fill="#3a2a1a"/><path d="M-9 0 l-3 1" stroke="#3a2a1a" stroke-width="1.2"/></g></g>`;
}
// white lily bouquet in a glass vase (drawn after the reference photo)
function band20(k) {
  const mb = $('.menubar'); if (!mb) return; let b = mb.querySelector('.band20'); if (b) b.remove();
  if (k !== 'autumn' && k !== 'bloom') return;
  b = document.createElement('div'); b.className = 'band20 b-' + k; b.setAttribute('aria-hidden', 'true'); let h = ''; const r = rnd(k === 'autumn' ? 17 : 29);
  if (k === 'autumn') for (let i = 0; i < 70; i++) { const s = 16 + r() * 16; h += `<span class="bl20" style="left:${(i / 70 * 100 + r() * 1.2).toFixed(2)}%;bottom:${(r() * 16 - 4).toFixed(0)}px;width:${s.toFixed(0)}px;height:${s.toFixed(0)}px;--r:${Math.round(r() * 360)}deg;animation-duration:${(2.6 + r() * 2.4).toFixed(1)}s;animation-delay:-${(r() * 4).toFixed(1)}s"><svg viewBox="0 0 24 24"><path d="${MAPLE}" fill="${MCOL[i % 6]}"/><path d="M12 21.4V6.5M12 12.5l-4.2-3.4M12 12.5l4.2-3.4" stroke="rgba(110,40,10,.35)" stroke-width=".8" fill="none"/></svg></span>`; }
  else for (let i = 0; i < 34; i++) { const s = 30 + r() * 16, lf = (i / 34 * 100 + r() * 1.5).toFixed(2); h += `<span class="bf20" style="left:${lf}%;width:${s.toFixed(0)}px;height:${(s + 14).toFixed(0)}px;animation-duration:${(3.5 + r() * 2.5).toFixed(1)}s;animation-delay:-${(r() * 4).toFixed(1)}s"><svg viewBox="-14 -14 28 40" overflow="visible"><path d="M0 26 V4" stroke="#4f9a4a" stroke-width="1.8"/><ellipse cx="-5" cy="18" rx="6" ry="2.4" fill="#6cb562" transform="rotate(-30 -5 18)"/><ellipse cx="5" cy="21" rx="6" ry="2.4" fill="#5ea956" transform="rotate(28 5 21)"/>${bigFlower(0, 0, 22, i)}</svg></span>`; }
  b.innerHTML = h; mb.appendChild(b);
}
// ---------- decor around the page for Mùa hoa: big flower bushes + bees + butterflies ----------
function decor20(k) {
  $$('.dc20').forEach((e) => e.remove()); if (!MOTION || PHONE) return; const L = $('#decor'); if (!L) return;
  if (k === 'bloom') { $$('#decor .bush').forEach((e) => e.remove());
    const bush = (cls) => { let s = ''; for (let j = 0; j < 9; j++) { const x = 20 + (j * 37) % 190, y = 70 + (j * 29) % 110; s += `<path d="M${x} 240 Q${x + 6} ${(y + 240) / 2} ${x} ${y}" stroke="#4f9a4a" stroke-width="3" fill="none"/><ellipse cx="${x - 10}" cy="${y + 40}" rx="13" ry="5" fill="#6cb562" transform="rotate(-30 ${x - 10} ${y + 40})"/>`; }
      for (let j = 0; j < 9; j++) { const x = 20 + (j * 37) % 190, y = 70 + (j * 29) % 110; s += `<g class="sway19" style="animation-delay:-${j * .6}s">${bigFlower(x, y, 40 + (j % 3) * 12, j)}</g>`; }
      return `<span class="dc20 bush20 ${cls}"><svg viewBox="0 0 230 240" overflow="visible">${s}</svg></span>`; };
    document.body.insertAdjacentHTML('beforeend', bush('') + bush('r')); L.insertAdjacentHTML('beforeend',  [0, 1, 2].map((i) => `<span class="dc20 fly20 bee f${i}"><svg viewBox="-16 -16 32 32" width="34" height="34" overflow="visible">${bee20(0, 0, -i)}</svg></span>`).join('') +
      [0, 1, 2].map((i) => `<span class="dc20 fly20 bf f${i + 3}"><svg viewBox="-20 -20 40 40" width="40" height="40" overflow="visible">${butterfly(0, 0, ['#f7a8c8', '#c9a7f0', '#ffd36b'][i], -i * 2)}</svg></span>`).join('')); }
  if (k === 'autumn') { $$('#decor .bush').forEach((e) => e.remove());
    document.body.insertAdjacentHTML('beforeend', [0, 1].map((i) => `<span class="dc20 tree20 ${i ? 'r' : ''}"><svg viewBox="0 0 260 300" overflow="visible">${mapleTree(130, 300, 290, 21 + i)}</svg></span>`).join('')); }
}
const _setTheme20 = setTheme;
setTheme = function (k) { _setTheme20(k); band20(k); decor20(k); document.body.classList.toggle('nomo20', !MOTION); };

// ---------- preparer tabs: 6 styles, chosen per theme ----------
const TSTYLES = [['pill', 'Pill'], ['icon', 'Icon theme'], ['bub', 'Bong bóng'], ['face', 'Mặt cười'], ['tag', 'Thẻ tên'], ['dot', 'Gạch dưới']];
const TSTYLE = { autumn: 'icon', bloom: 'face', cruise: 'tag', pro: 'dot' };
const HAIR = ['M3 12 C3 4 21 4 21 12 C19 8 5 8 3 12Z', 'M3 13 C2 3 22 3 21 13 C20 9 14 6 12 9 C10 6 4 9 3 13Z', 'M2.5 15 C1 2 23 2 21.5 15 L20 11 C18 7 6 7 4 11Z', 'M4 11 C5 3 19 3 20 11 L18 9 L16 10 L14 8 L12 10 L10 8 L8 10 L6 9Z', 'M3 12 C3 5 21 5 21 12 C18 9 6 9 3 12Z M17 5 a3 3 0 1 1 4 4Z', 'M3 14 C1 4 23 4 21 14 C20 18 22 20 20 21 C21 15 19 10 12 9 C5 10 3 15 4 21 C2 20 4 18 3 14Z'];
const face20 = (c, i) => `<svg viewBox="0 0 24 24" class="fc20"><circle cx="12" cy="13" r="9" fill="#ffe2c6"/><path d="${HAIR[i % 6]}" fill="${c}"/><circle cx="8.8" cy="13.5" r="1.1" fill="#3a2a22"/><circle cx="15.2" cy="13.5" r="1.1" fill="#3a2a22"/><path d="M9.2 16.6 q2.8 2.4 5.6 0" stroke="#c0574a" stroke-width="1.2" fill="none" stroke-linecap="round"/><circle cx="7" cy="16" r="1.3" fill="#ffb3b3" opacity=".7"/><circle cx="17" cy="16" r="1.3" fill="#ffb3b3" opacity=".7"/></svg>`;
HELLO.autumn = (txt) => {
  const fs = 34; _cv.font = `600 ${fs}px Nunito, 'Segoe UI', sans-serif`; const t = Math.max(_cv.measureText(txt).width, 140);
  const tx = 158, sx = tx + 86, sw = Math.round(t + 70), W = sx + sw + 26, H = 240;
  const bx0 = tx + 14, by0 = 104, bx1 = W - 14, by1 = 70, bcx = (bx0 + bx1) / 2, bcy = 46;
  const by = (x) => { let best = 0, bd = 1e9; for (let u = 0; u <= 1; u += .01) { const X = (1 - u) * (1 - u) * bx0 + 2 * u * (1 - u) * bcx + u * u * bx1; if (Math.abs(X - x) < bd) { bd = Math.abs(X - x); best = (1 - u) * (1 - u) * by0 + 2 * u * (1 - u) * bcy + u * u * by1; } } return best; };
  const r1 = sx + 28, r2 = sx + sw - 28;
  let tw = ''; for (let i = 0; i < 9; i++) { const x = bx0 + 140 + i * (bx1 - bx0 - 150) / 8; tw += `<svg x="${x - 8}" y="${by(x) - 12}" width="${14 + i % 3 * 3}" height="${14 + i % 3 * 3}" viewBox="0 0 24 24" overflow="visible"><g class="lflt20" style="animation-delay:-${i * .7}s"><path d="${MAPLE}" fill="${LEAVES[i % 5][(i + 1) % 2]}" transform="rotate(${i * 41} 12 12)"/></g></svg>`; }
  let fall = ''; for (let j = 0; j < 7; j++) fall += `<g transform="translate(${sx + j * (sw - 20) / 6} ${30 + (j * 17) % 40})"><g class="lf" style="--t:${6 + j}s;animation-delay:-${j}s;--h1:80px;--h2:180px"><path d="${MAPLE}" transform="translate(-8 -8) scale(.62)" fill="${MCOL[j % 6]}"/></g></g>`;
  let pile = ''; for (let k = 0; k < 16; k++) pile += `<svg x="${tx - 110 + k * 14}" y="${H - 18 - (k % 3) * 3}" width="16" height="16" viewBox="0 0 24 24"><path d="${MAPLE}" fill="${LEAVES[k % 5][k % 2]}" transform="rotate(${k * 53} 12 12)"/></svg>`;
  return svgS(W, H, `<ellipse cx="${tx}" cy="${H - 6}" rx="96" ry="7" fill="#e9c79a" opacity=".6"/>${pile}
    <path d="M${bx0} ${by0} Q${bcx} ${bcy} ${bx1} ${by1}" stroke="#6b4226" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M${bx0 + 40} ${by(bx0 + 40) - 2} Q${bcx} ${bcy - 4} ${bx1 - 6} ${by1 - 1}" stroke="#8a5a34" stroke-width="2" fill="none" opacity=".6"/>${tw}
    ${mapleTree(tx, H - 6, 230, 5)}
    <line x1="${r1}" y1="${by(r1)}" x2="${r1}" y2="122" stroke="#8a6a4a" stroke-width="2"/><line x1="${r2}" y1="${by(r2)}" x2="${r2}" y2="122" stroke="#8a6a4a" stroke-width="2"/>
    <g class="sway19"><rect x="${sx}" y="118" width="${sw}" height="74" rx="12" fill="#c98b5a" stroke="#8a5a2b" stroke-width="2.5"/><rect x="${sx + 7}" y="125" width="${sw - 14}" height="60" rx="8" fill="#fdf0dc"/>
      <text x="${sx + sw / 2}" y="156" text-anchor="middle" dominant-baseline="central" font-family="Nunito, 'Segoe UI', sans-serif" font-weight="600" font-size="${fs}" letter-spacing=".5" fill="#a4471b">${esc(txt)}</text></g>${fall}`);
};

function lilyBouquet(x, y) {
  const pet = (a, k) => `<g transform="rotate(${a}) scale(${k})"><path d="M0 0 C9 -5 11 -20 4 -34 Q2 -38 -1 -40 C-2 -36 -9 -26 -9 -14 C-9 -6 -4 -1 0 0Z" fill="url(#lp20)" stroke="#dde5d3" stroke-width=".7"/><path d="M0 -2 Q1 -20 0 -34" stroke="#d8e6c9" stroke-width="1.1" fill="none"/><path d="M-3 -10 q1 -8 -1 -16 M3 -10 q-1 -8 1 -14" stroke="#eef3e6" stroke-width=".7" fill="none"/>${[[-2, -16], [2, -19], [-1, -22], [3, -13]].map(([px, py]) => `<circle cx="${px}" cy="${py}" r=".6" fill="#e3b7b7" opacity=".55"/>`).join('')}</g>`;
  const lily = (cx, cy, s, r) => `<g transform="translate(${cx} ${cy}) rotate(${r}) scale(${s} ${(s * .84).toFixed(2)})">${[30, 150, 270].map((a) => pet(a, .94)).join('')}${[90, 210, 330].map((a) => pet(a, 1)).join('')}
      <circle r="5.5" fill="#d6e8b6"/><circle r="2.6" fill="#c3dc98"/>${[0, 60, 120, 180, 240, 300].map((a) => `<g transform="rotate(${a + 15})"><path d="M0 0 Q1 -9 0 -17" stroke="#d9e8b9" stroke-width=".9" fill="none"/><ellipse cx="0" cy="-18" rx="1.5" ry="3.2" fill="#a8602d"/></g>`).join('')}<path d="M0 0 Q2 -10 2 -20" stroke="#c6dc9b" stroke-width="1.5" fill="none"/><circle cx="2" cy="-21" r="1.9" fill="#a9cf72"/></g>`;
  const bud = (cx, cy, r, s = 1) => `<g transform="translate(${cx} ${cy}) rotate(${r}) scale(${s})"><path d="M0 0 C6 -8 6 -26 0 -36 C-6 -26 -6 -8 0 0Z" fill="url(#lb20)"/><path d="M0 -2 V-32" stroke="#d3e4bb" stroke-width=".8"/><path d="M-2 -4 Q-3 -18 -1 -30" stroke="#e8f0dc" stroke-width=".6" fill="none"/></g>`;
  const leaf = (cx, cy, r, l = 44) => `<path d="M0 0 C7 -${l * .3} 6 -${l * .75} 0 -${l} C-6 -${l * .75} -7 -${l * .3} 0 0Z" fill="url(#lf20)" transform="translate(${cx} ${cy}) rotate(${r})"/><path d="M0 -2 L0 -${l - 4}" stroke="#86ad6e" stroke-width=".6" transform="translate(${cx} ${cy}) rotate(${r})" opacity=".7"/>`;
  const vx = 40, vy = 150, top = [[-20, 62], [30, 50], [8, 96], [58, 100], [-34, 30], [16, 18], [62, 36], [-6, 40], [44, 70]];
  return `<g transform="translate(${x} ${y})"><defs><radialGradient id="lp20" cx=".5" cy=".95" r="1"><stop offset="0" stop-color="#dcebc0"/><stop offset=".3" stop-color="#fbfdf6"/><stop offset=".85" stop-color="#ffffff"/><stop offset="1" stop-color="#f3f1ee"/></radialGradient>
    <linearGradient id="lb20" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#9fbf7c"/><stop offset="1" stop-color="#f1f5e6"/></linearGradient><linearGradient id="lf20" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#4f7c48"/><stop offset="1" stop-color="#7ea867"/></linearGradient>
    <linearGradient id="gv20" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e6f1f4" stop-opacity=".7"/><stop offset=".25" stop-color="#ffffff" stop-opacity=".25"/><stop offset=".8" stop-color="#d9e9ee" stop-opacity=".35"/><stop offset="1" stop-color="#c6dbe2" stop-opacity=".7"/></linearGradient></defs>
    ${top.map(([tx2, ty2]) => `<path d="M${vx + 6} ${vy + 4} Q${vx + 4 + tx2 * .3} ${(vy + ty2) / 2} ${vx + tx2} ${ty2}" stroke="#6f9a58" stroke-width="2" fill="none"/>`).join('')}
    ${[[-4, 132, -72, 56], [16, 130, 70, 54], [-2, 118, -48, 60], [14, 116, 44, 62], [2, 108, -22, 58], [10, 106, 24, 56], [-6, 140, -86, 44], [18, 138, 84, 46], [6, 124, -8, 50], [8, 112, 6, 64]].map(([dx, yy, r, l]) => leaf(vx + 6 + dx, yy, r, l)).join('')}
    ${bud(vx - 34, 30, -20)}${bud(vx + 16, 18, 4, 1.1)}${bud(vx + 62, 36, 24)}${bud(vx - 6, 40, -6, .9)}${bud(vx + 44, 70, 16, .85)}
    ${lily(vx - 20, 62, 1, -18)}${lily(vx + 30, 52, 1.05, 12)}${lily(vx + 8, 98, .9, -4)}${lily(vx + 58, 100, .82, 30)}
    <rect x="${vx - 22}" y="${vy}" width="56" height="88" rx="5" fill="url(#gv20)" stroke="rgba(140,170,185,.65)" stroke-width="1.3"/><rect x="${vx - 20}" y="${vy + 34}" width="52" height="52" rx="4" fill="rgba(186,220,232,.35)"/><ellipse cx="${vx + 6}" cy="${vy + 34}" rx="26" ry="2.4" fill="rgba(220,240,246,.8)"/>
    ${[-12, -4, 4, 12, 20].map((d) => `<path d="M${vx + 6 + d * .3} ${vy + 2} L${vx + 6 + d} ${vy + 34} L${vx + 6 + d * 1.15} ${vy + 84}" stroke="#86ad6a" stroke-width="2" fill="none" opacity=".85"/>`).join('')}<path d="M${vx - 16} ${vy + 6} v76" stroke="rgba(255,255,255,.85)" stroke-width="2.5" stroke-linecap="round"/><path d="M${vx + 28} ${vy + 10} v60" stroke="rgba(255,255,255,.45)" stroke-width="1.5" stroke-linecap="round"/></g>`;
}
HELLO.bloom = (txt) => {
  const fs = 38; _cv.font = `italic 500 ${fs}px Georgia, 'Times New Roman', serif`; const t = Math.max(_cv.measureText(txt).width, 140);
  const W = Math.round(t + 270), H = 300, ty = 266, vs = 1, vxp = W - 150;
  const grain = [0, 1, 2, 3].map((i) => `<path d="M0 ${ty + 3 + i * 3} q${W * .3} ${i % 2 ? 1.5 : -1.5} ${W * .6} 0 t${W * .6} 0" stroke="#c9a57c" stroke-width=".6" fill="none" opacity=".45"/>`).join('');
  return svgS(W, H, `<defs><linearGradient id="tb20" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ecd9bd"/><stop offset="1" stop-color="#dcc19b"/></linearGradient><linearGradient id="te20" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c39d73"/><stop offset="1" stop-color="#a98157"/></linearGradient>
      <linearGradient id="tf20" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".08" stop-color="#fff"/><stop offset=".92" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="tm20"><rect width="${W}" height="${H}" fill="url(#tf20)"/></mask></defs>
    <g mask="url(#tm20)"><rect x="0" y="${ty}" width="${W}" height="16" fill="url(#tb20)"/>${grain}<rect x="0" y="${ty + 16}" width="${W}" height="10" fill="url(#te20)"/><rect x="0" y="${ty + 26}" width="${W}" height="6" fill="#000" opacity=".05"/></g>
    <text x="${24 + t / 2}" y="${ty - 92}" text-anchor="middle" dominant-baseline="central" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-weight="500" font-size="${fs}" fill="#7d5866">${esc(txt)}</text>
    <path d="M${24 + t * .18} ${ty - 62} q${t * .32} 10 ${t * .64} 0" stroke="#c9a3ae" stroke-width="1.2" fill="none" stroke-linecap="round"/><circle cx="${24 + t * .5}" cy="${ty - 57.5}" r="2" fill="#d8b4bd"/>
    <ellipse cx="${vxp + 6 * vs}" cy="${ty + 3}" rx="40" ry="4" fill="#8a6a4a" opacity=".18"/>
    <g transform="translate(${vxp - 40 * vs} ${ty - 238 * vs}) scale(${vs})">${lilyBouquet(0, 0)}</g>
    <g transform="translate(${vxp - 118} ${ty - 22})"><ellipse cx="18" cy="22" rx="24" ry="4" fill="#f4ede4" stroke="#e1d4c4"/><path d="M4 4 h28 q0 18 -14 18 q-14 0 -14 -18z" fill="#fbf7f1" stroke="#e1d4c4"/><path d="M32 8 q8 0 7 6 q-1 5 -8 4" stroke="#e1d4c4" stroke-width="2" fill="none"/><ellipse cx="18" cy="4.5" rx="14" ry="2.2" fill="#d9b991"/>
      <path class="stm20" d="M14 -2 q-4 -8 1 -14 q4 -6 0 -12" stroke="#d9cfc6" stroke-width="1.6" fill="none" stroke-linecap="round"/><path class="stm20 s2" d="M22 -2 q4 -8 -1 -14" stroke="#e2d9d1" stroke-width="1.3" fill="none" stroke-linecap="round"/></g>
    <g transform="translate(${vxp - 210} ${ty - 9})"><path d="M0 9 L60 9 L58 4 L2 4Z" fill="#c9b8a4"/><path d="M2 4 Q16 -2 30 3 Q44 -2 58 4 L58 7 Q44 2 30 6 Q16 2 2 7Z" fill="#fbf7f0" stroke="#e3d8c8" stroke-width=".8"/><path d="M30 3 V7" stroke="#e3d8c8" stroke-width=".8"/></g>
    <g transform="translate(${vxp - 150} ${ty + 4}) rotate(-18)"><path d="M0 0 C4 -2 7 -6 6 -10 C3 -8 0 -5 0 0Z" fill="#fbfaf5" stroke="#e3e6dc" stroke-width=".6"/></g>`);
};
const BLV20 = svgUri(`<svg width="220" height="26"><path d="M0 16 C40 6 70 24 110 14 S180 6 220 16" stroke="#9db58c" stroke-width="1.3" fill="none"/>${[[18, 13, -30], [46, 12, 30], [74, 17, -20], [100, 15, 25], [128, 11, -35], [156, 10, 20], [184, 12, -25], [206, 15, 30]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="2.6" fill="#b3c9a3" transform="rotate(${r} ${x} ${y})"/>`).join('')}
  ${[[34, 10, '#fffdf8'], [88, 18, '#f3e3e6'], [140, 12, '#fffdf8'], [196, 14, '#efdfe4']].map(([x, y, c]) => `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-3.4" rx="2.4" ry="3.6" fill="${c}" stroke="#e2d2d6" stroke-width=".5" transform="rotate(${a})"/>`).join('')}<circle r="1.4" fill="#e6cf8f"/></g>`).join('')}</svg>`);
document.body.style.setProperty('--blv20', BLV20);
TICON.bloom = '<svg viewBox="0 0 24 24"><g fill="#efe3e6" stroke="#b98b98" stroke-width="1">' + [0, 60, 120, 180, 240, 300].map((a) => `<path d="M12 12 C14.5 9.5 14.5 5 12 2.5 C9.5 5 9.5 9.5 12 12Z" transform="rotate(${a} 12 12)"/>`).join('') + '</g><circle cx="12" cy="12" r="1.8" fill="#c9a96a"/></svg>';
// band/decor: Mùa hoa now uses only the soft CSS sprig line (no big flowers, no bees)
const _band20o = band20; band20 = function (k) { _band20o(k === 'bloom' ? 'none' : k); };
const _decor20o = decor20; decor20 = function (k) { _decor20o(k === 'bloom' ? 'none' : k); if (k === 'bloom') $$('#decor .bush').forEach((e) => e.remove()); };
HELLO.cruise = (txt) => {
  const fs = 38; _cv.font = `italic 500 ${fs}px Georgia, 'Times New Roman', serif`; const t = Math.max(_cv.measureText(txt).width, 140);
  const W = Math.round(t + 290), H = 262, hz = 196, dk = 262, sx = W - 118, cx = W - 190;
  const n = Math.ceil((W + 120) / 30);
  let glint = ''; for (let i = 0; i < 7; i++) { const w = 46 - i * 5; glint += `<rect class="gli20" style="animation-delay:-${i * .5}s" x="${sx - w / 2 + (i % 2 ? 6 : -5)}" y="${hz + 4 + i * 4.5}" width="${w}" height="1.6" rx=".8" fill="#fbe7cf" opacity="${(.9 - i * .1).toFixed(2)}"/>`; }
  let ripples = ''; for (let i = 0; i < 6; i++) ripples += `<path class="rip20" style="animation-delay:-${i * 1.3}s" d="M${(i * 97) % (W - 60) + 10} ${hz + 10 + (i * 7) % 26} q8 -2.5 16 0" stroke="#eef5f7" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".8"/>`;
  let posts = ''; for (let x = 30; x < W - 10; x += 64) posts += `<rect x="${x}" y="228" width="3.2" height="${dk - 228}" fill="#f4f1ec" stroke="#d9d3ca" stroke-width=".5"/>`;
  let planks = ''; for (let i = 0; i < 4; i++) planks += `<path d="M0 ${dk + 4 + i * 6} H${W}" stroke="#b88e62" stroke-width=".6" opacity=".5"/>`; for (let x = 40; x < W; x += 92) planks += `<path d="M${x} ${dk + 1} v6 M${x + 46} ${dk + 7} v6 M${x + 20} ${dk + 13} v6" stroke="#b88e62" stroke-width=".6" opacity=".5"/>`;
  const chair = `<g transform="translate(${cx} 0)">
      <path d="M8 ${dk} L20 238 M62 ${dk} L54 238 M20 238 L54 238 M54 238 L86 186 M70 ${dk} L60 228" stroke="#8a6646" stroke-width="2.6" stroke-linecap="round" fill="none"/>
      <path d="M18 234 Q40 244 56 234 L84 190" stroke="#f3ede2" stroke-width="13" fill="none" stroke-linejoin="round"/><path d="M18 234 Q40 244 56 234 L84 190" stroke="#3f6280" stroke-width="13" stroke-dasharray="5 6" fill="none" stroke-linejoin="round" opacity=".85"/>
      <g transform="translate(30 224)"><ellipse cx="0" cy="4" rx="17" ry="4.2" fill="#e9d3a6" stroke="#cdb284" stroke-width=".6"/><path d="M-9 4 Q-9 -7 0 -7 Q9 -7 9 4Z" fill="#efdcb2" stroke="#cdb284" stroke-width=".6"/><path d="M-9 1.5 Q0 4 9 1.5 L9 -1 Q0 1.5 -9 -1Z" fill="#3f6280"/></g></g>`;
  const table = `<g transform="translate(${cx - 34} 0)"><ellipse cx="0" cy="234" rx="17" ry="3.4" fill="#d2b08a" stroke="#b08a62" stroke-width=".6"/><path d="M0 237 V${dk} M-8 ${dk} H8" stroke="#a07c56" stroke-width="2"/>
      <path d="M-5 206 L-4 232 Q0 234 4 232 L5 206Z" fill="rgba(240,224,190,.55)" stroke="rgba(160,140,110,.6)" stroke-width=".7"/><path d="M-4.6 214 L-4 232 Q0 234 4 232 L4.6 214Z" fill="#f2d39a" opacity=".85"/><rect x="-3" y="216" width="3" height="3" rx=".6" fill="#fff" opacity=".7"/><rect x="0.6" y="221" width="2.6" height="2.6" rx=".5" fill="#fff" opacity=".6"/>
      <circle cx="5" cy="207" r="4" fill="#f4e27a" stroke="#d9c25a" stroke-width=".6"/><path d="M5 207 l0 -3.6 M5 207 l3 2 M5 207 l-3 2" stroke="#e7cf55" stroke-width=".5"/><path d="M1 210 L7 194" stroke="#e7a0a8" stroke-width="1.4" stroke-linecap="round"/></g>`;
  return svgS(W, H, `<g transform="translate(0 -38)"><defs><linearGradient id="sk21" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf6f0" stop-opacity="0"/><stop offset="1" stop-color="#f7e6d6"/></linearGradient>
      <linearGradient id="se21" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfdfe4"/><stop offset="1" stop-color="#a7c3cd"/></linearGradient>
      <radialGradient id="sn21"><stop offset="0" stop-color="#fdf0dc"/><stop offset=".4" stop-color="#f8dcb8" stop-opacity=".85"/><stop offset="1" stop-color="#f6d2ae" stop-opacity="0"/></radialGradient>
      <linearGradient id="dk21" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dcb990"/><stop offset="1" stop-color="#c79d70"/></linearGradient>
      <linearGradient id="ff21" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".08" stop-color="#fff"/><stop offset=".92" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="fm21" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H + 40}"><rect width="${W}" height="${H + 40}" fill="url(#ff21)"/></mask></defs>
    <g mask="url(#fm21)"><rect x="0" y="${hz - 70}" width="${W}" height="70" fill="url(#sk21)"/>
      <circle cx="${sx}" cy="${hz - 6}" r="62" fill="url(#sn21)"/><circle cx="${sx}" cy="${hz - 4}" r="17" fill="#fbe1bf"/>
      <rect x="0" y="${hz}" width="${W}" height="${dk - hz}" fill="url(#se21)"/><rect x="0" y="${hz}" width="${W}" height="1" fill="#e9eef0" opacity=".9"/>
      <g class="sh21"><g transform="translate(${W * .3} ${hz})"><path d="M0 0 L4 -7 L58 -7 L62 -3 L64 0Z" fill="#6d8597"/><rect x="10" y="-12" width="38" height="5" rx="1" fill="#8197a7"/><rect x="18" y="-16" width="20" height="4" rx="1" fill="#93a7b5"/><rect x="34" y="-21" width="5" height="6" fill="#9aaebb"/>${[14, 20, 26, 32, 38, 44, 50].map((x, i) => `<circle cx="${x}" cy="-3.6" r=".9" fill="${i % 3 ? '#fbe3b6' : '#c9d4dc'}"/>`).join('')}<path d="M0 1 H64" stroke="#8fa9b6" stroke-width=".8" opacity=".6"/></g></g>
      ${glint}${ripples}
      <g fill="none" stroke="#8a9aa6" stroke-width="1.1" stroke-linecap="round" opacity=".7"><g class="drift19"><path d="M${sx - 44} ${hz - 70} q3.5 -3.5 7 0 q3.5 -3.5 7 0"/></g><g class="drift19 d2"><path d="M${sx - 16} ${hz - 86} q3 -3 6 0 q3 -3 6 0"/></g></g>
      <path d="M0 228 H${W}" stroke="#f4f1ec" stroke-width="3.4"/><path d="M0 228 H${W}" stroke="#d9d3ca" stroke-width=".6" transform="translate(0 1.6)"/><path d="M0 246 H${W}" stroke="#ece7df" stroke-width="1.6"/>${posts}
      <rect x="0" y="${dk}" width="${W}" height="22" fill="url(#dk21)"/>${planks}<rect x="0" y="${dk + 22}" width="${W}" height="6" fill="#000" opacity=".05"/>
      <ellipse cx="${cx + 40}" cy="${dk + 2}" rx="54" ry="3.5" fill="#7a5a3a" opacity=".16"/></g>
    ${table}${chair}
    <text x="${26 + t / 2}" y="${hz - 92}" text-anchor="middle" dominant-baseline="central" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-weight="500" font-size="${fs}" fill="#3f5a6e">${esc(txt)}</text>
    <path d="M${26 + t * .18} ${hz - 62} q${t * .32} 9 ${t * .64} 0" stroke="#a9bcc8" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <g transform="translate(${26 + t * .5} ${hz - 55}) scale(.42)" fill="none" stroke="#8fa6b4" stroke-width="2" stroke-linecap="round"><circle cx="0" cy="-8" r="3"/><path d="M0 -5 V9 M-5 -1 H5 M-9 4 c1 4 5 6 9 6 s8 -2 9 -6"/></g>`);
};
// calmer cruise page: muted water strip, no lifebuoys / bottom sea / ship
const WV1b = svgUri('<svg width="80" height="20"><path d="M0 10 C10 6 30 6 40 10 S70 14 80 10 V20 H0Z" fill="#d6e6ec"/></svg>');
const WV2b = svgUri('<svg width="120" height="14"><path d="M0 7 C15 4 45 4 60 7 S105 10 120 7 V14 H0Z" fill="#b5ced8"/><path d="M70 8.5 q8 1.4 16 .3" stroke="#eef5f7" stroke-width="1" fill="none" stroke-linecap="round"/></svg>');
document.body.style.setProperty('--wv1', WV1b); document.body.style.setProperty('--wv2', WV2b);
TICON.cruise = ANCHOR.replace(/#1f6fa3/g, '#5b7d93');
const _decor21 = decor20; decor20 = function (k) { _decor21(k); if (k === 'cruise') $$('#decor .snk, #decor .seab, #decor .shipb').forEach((e) => e.remove()); };
// ===== v20.1: Tools (Tax menu, after Attention, everyone sees it) =====
const TOOLS = [
  ['IRS', [
    ['Where’s My Refund?', 'Refund status · 1040', 'https://www.irs.gov/wheres-my-refund'],
    ['Where’s My Amended Return?', '1040-X status', 'https://www.irs.gov/filing/wheres-my-amended-return'],
    ['Direct Pay · Individual', 'Guest payment, no login', 'https://www.irs.gov/payments/direct-pay-with-bank-account'],
    ['Business payment', 'Business Tax Account', 'https://www.irs.gov/businesses/business-tax-account'],
    ['EFTPS', 'Federal tax deposits (enrolled)', 'https://www.eftps.gov/eftps/'],
    ['Get Transcript', 'Return / account / wage & income', 'https://www.irs.gov/individuals/get-transcript'],
    ['Mailing addresses', 'Where to file paper returns', 'https://www.irs.gov/filing/where-to-file-paper-tax-returns-with-or-without-a-payment'],
  ]],
  ['CA FTB', [
    ['Where’s My Refund? (CA)', 'CA refund status', 'https://www.ftb.ca.gov/refund/index.asp'],
    ['Web Pay · Individual', 'Personal / sole prop', 'https://www.ftb.ca.gov/pay/bank-account/index.asp'],
    ['Web Pay · Business', 'LLC, S corp, C corp, partnership', 'https://www.ftb.ca.gov/pay/bank-account/index.asp'],
    ['Mailing addresses', 'Where to mail CA returns & payments', 'https://www.ftb.ca.gov/help/contact/mailing-addresses.html'],
  ]],
];
const LLCFEE = [[0, 249999, 0], [250000, 499999, 900], [500000, 999999, 2500], [1000000, 4999999, 6000], [5000000, Infinity, 11790]];
const TC = { e: 'llc', inc: '', first: false };
function tcCalc() {
  const v = +String(TC.inc).replace(/[^\d.]/g, '') || 0; const corp = TC.e !== 'llc';
  if (!corp) { const fee = LLCFEE.find(([a, b]) => v >= a && v <= b)[2]; return `<b>${usd(800 + fee)}</b> = $800 annual tax (FTB 3522, 4/15)${fee ? ` + ${usd(fee)} LLC fee (FTB 3536, 6/15)` : ' · không có LLC fee (dưới $250,000)'}`; }
  const rate = { scorp: .015, ccorp: .0884, sfin: .035, cfin: .1084 }[TC.e]; const t = v * rate; const min = TC.first ? 0 : 800; const tax = Math.max(min, t);
  return `<b>${usd(tax)}</b> = ${t >= min ? `${(rate * 100).toFixed(2).replace(/\.?0+$/, '')}% × ${usd(v)}` : TC.first ? `${(rate * 100).toFixed(2).replace(/\.?0+$/, '')}% × ${usd(v)} (năm đầu, không có $800)` : `minimum $800 (${(rate * 100).toFixed(2).replace(/\.?0+$/, '')}% × ${usd(v)} = ${usd(t)} thấp hơn)`}`;
}
function taxTools20() {
  return `<div class="pay19 tools20"><div class="page-head"><h1>Tools</h1></div>
  ${TOOLS.map(([g, L]) => `<h2 class="bd-h">${g}</h2><div class="tlg20">${L.map(([t, s, u]) => `<a class="tlb20" href="${u}" target="_blank" rel="noopener"><b>${t}</b><span>${s}</span><i>↗</i></a>`).join('')}</div>`).join('')}

  <h2 class="bd-h" style="margin-top:34px">CA FTB annual tax · 2026</h2>
  <div class="fee20">
    <div class="card"><div class="card-head"><h2>LLC</h2><span class="pill20">single / multi-member</span></div>
      <table class="t ycmp"><tbody><tr><td>Annual tax <span class="muted small">FTB 3522</span></td><td class="right num"><b>$800</b></td><td class="right muted small nowrap">due 4/15</td></tr></tbody></table>
      <div class="lbl20">+ LLC fee theo total CA income <span class="muted small">FTB 3536 · 6/15</span></div>
      <table class="t ycmp"><thead><tr><th>Total CA income</th><th class="right">LLC fee</th><th class="right">Total / year</th></tr></thead><tbody>
      ${LLCFEE.map(([a, b, f]) => `<tr><td>${b === Infinity ? usd(a) + ' +' : a ? `${usd(a)} – ${usd(b)}` : 'Under $250,000'}</td><td class="right num">${f ? usd(f) : '<span class="faint">–</span>'}</td><td class="right num"><b>${usd(800 + f)}</b></td></tr>`).join('')}</tbody></table>
      <ul class="nt20"><li>Không còn miễn $800 năm đầu (chỉ áp dụng tax years 2021–2023).</li><li>Fee tính trên <b>total income (gross)</b>, không phải lợi nhuận.</li><li>Form 568: multi-member 3/15 · single-member 4/15.</li><li>Federal: single-member → Schedule C · multi-member → 1065 / K-1.</li><li>LLC chọn đóng thuế như S / C corp → theo bảng S corp / C corp, không có LLC fee.</li></ul></div>

    <div class="card"><div class="card-head"><h2>S corp</h2><span class="pill20">Form 100S · 1120-S · 3/15</span></div>
      <div class="sec20">California</div><table class="t ycmp"><tbody><tr><td>Rate</td><td class="right num"><b>1.5%</b> net income</td></tr><tr><td>Minimum</td><td class="right num"><b>$800</b></td></tr><tr><td>Financial S corp</td><td class="right num">3.5%</td></tr></tbody></table>
      <div class="sec20">Federal</div><table class="t ycmp"><tbody><tr><td>Corporate tax</td><td class="right num"><b>0%</b> pass-through</td></tr><tr><td>Shareholder</td><td class="right num">K-1 → 1040 · <b>10% – 37%</b></td></tr><tr><td>Built-in gains / passive income</td><td class="right num">21%</td></tr></tbody></table></div>

    <div class="card"><div class="card-head"><h2>C corp</h2><span class="pill20">Form 100 · 1120 · 4/15</span></div>
      <div class="sec20">California</div><table class="t ycmp"><tbody><tr><td>Rate</td><td class="right num"><b>8.84%</b> net income</td></tr><tr><td>Minimum</td><td class="right num"><b>$800</b></td></tr><tr><td>Bank / financial</td><td class="right num">10.84%</td></tr></tbody></table>
      <div class="sec20">Federal</div><table class="t ycmp"><tbody><tr><td>Corporate tax</td><td class="right num"><b>21%</b> flat</td></tr><tr><td>Dividends to owner</td><td class="right num">0% / 15% / 20%</td></tr></tbody></table></div>
  </div>

  <div class="card tcalc20"><div class="card-head"><h2>Tính nhanh</h2></div>
    <div class="btnrow"><select id="tcE">${[['llc', 'LLC'], ['scorp', 'S corp'], ['ccorp', 'C corp'], ['sfin', 'S corp · financial'], ['cfin', 'C corp · bank / financial']].map(([k, t]) => `<option value="${k}" ${TC.e === k ? 'selected' : ''}>${t}</option>`).join('')}</select>
      <input type="text" id="tcI" placeholder="${TC.e === 'llc' ? 'Total CA income' : 'Net income'}" value="${esc(TC.inc)}" style="width:170px">
      ${TC.e === 'llc' ? '' : `<label class="small"><input type="checkbox" id="tcF" ${TC.first ? 'checked' : ''}> Năm đầu thành lập</label>`}
      <span id="tcR" class="tcr20">${tcCalc()}</span></div></div>

  <div class="card nb20"><div class="card-head"><h2>Corporation · ghi nhớ</h2></div>
    <ul class="nt20"><li>Corp mới thành lập / mới đăng ký: <b>năm đầu không trả $800 minimum</b>, vẫn trả % trên net income.</li>
    <li>Estimated tax corp (FTB 3539 / 100-ES): <b>30% · 40% · 0% · 30%</b> vào 4/15 · 6/15 · 9/15 · 12/15.</li>
    <li>15-day rule: năm đầu ≤ 15 ngày và không làm ăn ở CA → không phải file / trả $800 cho năm đó.</li>
    <li>Extension: S corp tự động 6 tháng, C corp 7 tháng. Gia hạn file, không gia hạn trả.</li></ul>
    <div class="src20">Nguồn: <a href="https://www.ftb.ca.gov/file/business/types/limited-liability-company" target="_blank" rel="noopener">FTB · LLC</a> · <a href="https://www.ftb.ca.gov/file/business/types/corporations/index.html" target="_blank" rel="noopener">FTB · Corporations</a> · <a href="https://www.ftb.ca.gov/about-ftb/newsroom/tax-news/index.html#article4" target="_blank" rel="noopener">FTB Tax News 11/2026 · 15-day rule</a></div></div>
  </div>`;
}


// =====================================================================
// Tax pages v20: nav, Homepage, Records, Accounting, Tools, theme picker
// =====================================================================
const usd = (n) => (n == null || n === '' ? '' : (n < 0 ? '-$' : '$') + Math.round(Math.abs(Number(n))).toLocaleString('en-US'));
const statStrip = (list) => `<div class="sstrip">${list.map(([l, v, sub, cls = '']) => `<div class="ss ${cls}"><div class="ssl">${/class="dot"/.test(l) ? '' : ti()}${l}</div><div class="ssv">${v}</div>${sub ? `<div class="sss">${sub}</div>` : ''}</div>`).join('')}</div>`;
const MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MON3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const keepY = (fn) => { const y = scrollY; fn(); scrollTo(0, y); };
function tabStyle() { const o = (S.me && S.me.tab_styles) || {}; return o[THEME] || 'tag'; }
function helloText() { return 'Hello ' + ((S.me && S.me.display_name) || '') + '!'; }
function helloSvg() { return THEME === 'pro' ? _helloV19() : `<div class="pay19 hello-in">${(HELLO[THEME] || HELLO.autumn)(helloText())}</div>`; }
const _helloV19 = V19.helloHtml;

// ---------- theme: 4 themes, applied on every render ----------
V19.THEMES = THEMES;
V19.applyTheme = function () {
  const k = THEMES.some((x) => x[0] === (S.me && S.me.theme)) ? S.me.theme : 'autumn';
  if (document.body.getAttribute('data-style') !== k || !$('#decor')) setTheme(k);
  if ($('.menubar') && !$('.menubar .band20') && (k === 'autumn')) band20(k);
};
V19.helloHtml = function () { return helloSvg(); };

// theme picker (modal): 4 themes + name-tag style + animation
openTheme = function () {
  const m = $('#modalHost'); const pick = { theme: THEME, tab: tabStyle(), motion: MOTION };
  const draw = () => {
    m.innerHTML = `<div class="modal"><div class="box th20"><h3>Theme</h3>
      <div class="pay19"><div class="thgrid">${THEMES.map(([k, n]) => `<button type="button" class="thcard th-${k} ${pick.theme === k ? 'on' : ''}" data-th="${k}"><span class="thprev">${SCENE[k] || ''}</span><b><span class="thic">${TICON[k]}</span>${n}</b></button>`).join('')}</div></div>
      <h4>Tab tên</h4><div class="tsg20">${TSTYLES.map(([k, n]) => `<button type="button" class="${pick.tab === k ? 'on' : ''}" data-ts="${k}">${n}</button>`).join('')}</div>
      <label class="small" style="display:flex;gap:6px;align-items:center;margin-top:10px"><input type="checkbox" id="th20m" ${pick.motion ? 'checked' : ''} style="width:auto"> Animation</label>
      <div class="err" id="thErr"></div><div class="row-end"><button class="btn" id="thC">Hủy</button><button class="btn pri" id="thS">Lưu</button></div></div></div>`;
    m.firstChild.onclick = (e) => { if (e.target === m.firstChild) { m.innerHTML = ''; return; } const b = e.target.closest('[data-th],[data-ts]'); if (!b) return;
      if (b.dataset.th) pick.theme = b.dataset.th; if (b.dataset.ts) pick.tab = b.dataset.ts; draw(); };
    $('#th20m').onchange = (e) => { pick.motion = e.target.checked; };
    $('#thC').onclick = () => { m.innerHTML = ''; };
    $('#thS').onclick = function () { this.disabled = true; const ts = Object.assign({}, S.me.tab_styles || {}); ts[pick.theme] = pick.tab;
      api('PUT', '/prefs', { theme: pick.theme, tab_styles: ts }).then(() => {
        S.me.theme = pick.theme; S.me.tab_styles = ts; MOTION = pick.motion; try { localStorage.setItem('tax_motion20', MOTION ? '1' : '0'); } catch (e) { /* ignore */ }
        m.innerHTML = ''; setTheme(pick.theme); render(); toast('Đã lưu theme'); }).catch((e) => { this.disabled = false; $('#thErr').textContent = e.message; }); };
  };
  draw();
};

// ---------- staff tabs (name tags, 6 styles) ----------
function sheetsHtml20() {
  const st = tabStyle();
  return `<div class="tabs20 ts-${st}">${S.staff.map((p, i) => { const c = PALETTE[p.theme.color] || '#3d85c6'; const ini = (p.name || '?').charAt(0).toUpperCase();
    const lead = st === 'icon' ? `<i class="tsi" style="--c:${c}"></i>` : st === 'bub' ? `<span class="tbub" style="--c:${c}">${esc(ini)}</span>` : st === 'face' ? face20(c, i) : st === 'dot' ? `<i class="tdot" style="--c:${c}"></i>` : st === 'tag' ? '<i class="thole"></i>' : '';
    return `<button class="st20 ${S.page === p.id ? 'on' : ''}" data-p="${p.id}" style="--c:${c}">${lead}<span>${esc(p.name)}</span></button>`; }).join('')}${isAdmin() ? '<button class="st20 add" data-p="__add">+ Thêm tab</button>' : ''}</div>`;
}

// ---------- nav: Homepage · Fees · Appointment · Attention · Tools · Accounting · Records · ● Payroll & Service · Settings ----------
const NAV20 = () => [['home', 'Homepage'], ['fees', 'Fees'], ['appt', 'Appointment'], ['attn', 'Attention'], ['tools', 'Tools']].concat(isAdmin() ? [['acct', 'Accounting'], ['records', 'Records'], ['pay', 'Payroll & Service'], ['settings', 'Settings']] : []);
const _renderNav19 = renderNav;
renderNav = function () {
  if (isPhone()) { _renderNav19(); return; }
  $('#nav').innerHTML = NAV20().map(([k, t]) => `<button data-p="${k}" class="${S.page === k ? 'on' : ''}${k === 'pay' ? ' paytab19' : ''}">${t}</button>`).join('');
  if (S.page === 'pay') PAY20.shell(); else $('#sheets').innerHTML = sheetsHtml20();
  $$('#nav [data-p], #sheets [data-p]').forEach((b) => { b.onclick = () => { const k = b.getAttribute('data-p'); if (k === '__add') { addStaff(); return; } if (k === 'pay') PAY20.go('home', true); S.page = k; render(); window.scrollTo(0, 0); }; });
  $('#welcome').textContent = 'Welcome, ' + me();
  if (!$('.menubar .band20')) band20(THEME);
};
const _togglePMenu20 = togglePMenu;
togglePMenu = function (force) {
  _togglePMenu20(force); const m = $('#pmenu'); if (!m || !m.innerHTML) return;
  const rep = m.querySelector('[data-pm="reports"]'); if (rep) rep.outerHTML = isAdmin() ? '<button class="mi a" data-pm="pay">Payroll &amp; Service</button>' : '';
  const at = m.querySelector('[data-pm="attn"]'); if (at && !m.querySelector('[data-pm="tools"]')) at.insertAdjacentHTML('afterend', '<button class="mi" data-pm="tools">Tools</button>');
};

// ---------- render: Tools + Payroll & Service pages (Reports removed) ----------
const _render19 = render;
render = function () {
  if (!S.me) return;
  if (S.page === 'reports') S.page = 'records';
  if (!isAdmin() && ['pay', 'acct', 'records', 'settings', 'reports'].includes(S.page)) S.page = 'home'; // Admin-only tabs
  if (S.page === 'tools' || S.page === 'pay') {
    V19.applyTheme();
    document.body.classList.toggle('nodecor19', !(S.page === 'pay' && PAY20.sub() === 'home'));
    renderNav();
    const pg = $('#page'); pg.className = 'page' + (isPhone() ? ' phone' : '');
    if (S.page === 'tools') { pg.innerHTML = taxTools20(); }
    else { pg.innerHTML = '<div class="pay19" id="paypage"></div>'; PAY20.render(); }
    afterRender();
    return;
  }
  _render19();
  if (S.page === 'home' && !isPhone()) bindHome20();
  if (S.page === 'records') bindRecords20();
  if (S.page === 'acct') bindAcct20();
};

// ---------- Homepage ----------
const NEWS20 = { tax: null, loading: false };
function loadNews20() {
  if (NEWS20.loading || NEWS20.tax) return; NEWS20.loading = true;
  api('GET', '/news?feed=tax').then((d) => { NEWS20.tax = d; NEWS20.loading = false; const h = $('#taxnews20'); if (h) h.innerHTML = newsInner20(); }).catch(() => { NEWS20.loading = false; });
}
const newsDate20 = (d) => (d ? new Date(d).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', month: '2-digit', day: '2-digit', year: 'numeric' }) : '');
function newsInner20() {
  const L = (NEWS20.tax && NEWS20.tax.items) || []; if (!L.length) return '';
  return `<div class="news"><div class="news-h">Income tax news <span class="nw-auto">${newsDate20(NEWS20.tax.last)}</span></div><div class="news-g">${L.map((n) => `<a class="nw" href="${esc(n.url)}" target="_blank" rel="noopener"><span class="nw-s">${ti()}${esc(n.src)}${n.date ? ' · ' + esc(n.date) : ''}</span><b>${esc(n.title)}</b><span class="nw-t">${esc(n.txt)}</span><span class="nw-go">Read ↗</span></a>`).join('')}</div></div>`;
}
function taxDay20() { const t = todayISO(); const y = +t.slice(0, 4); const d = t <= y + '-04-15' ? y + '-04-15' : (y + 1) + '-04-15'; return { d, n: Math.round((new Date(d + 'T12:00:00') - new Date(t + 'T12:00:00')) / 864e5) }; }
function heroHtml20() {
  const td = todayISO(); const T = taxDay20();
  const right = statStrip([
    ['Thông báo', `<span class="txt20">${esc(S.notice || '—')}</span>`, isAdmin() ? '<a href="#" id="editNotice">sửa</a>' : ''],
    ['Quote', `<span class="txt20 q20" data-qk="home" title="Bấm để đổi câu">“${esc(quoteFor('home'))}”</span>`, ''],
    ['Tax day ' + T.d.slice(0, 4), `${T.n} <span class="u20">ngày</span>`, mdy(T.d)]]);
  return `<div class="hero19 tx21"><div class="hl"><div class="hellorow"><div id="hello19">${helloSvg()}</div></div>
    <div class="today19">Hôm nay là <b>${dayLbl20(td)}</b> <button class="chip19" id="th19" type="button">🎨 Theme</button>${window.MECHIPS21 ? MECHIPS21() : ''}</div></div>
    <div class="pay19 tright20"><div class="herostats">${right}</div></div></div>`;
}
const WDN20 = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const dayLbl20 = (d) => WDN20[new Date(d + 'T12:00:00Z').getUTCDay()] + ', ' + mdy(d);
// headings without the small descriptions
const _pulseHtml19 = pulseHtml; pulseHtml = function () { return _pulseHtml19().replace(/<span class="muted small">so với kỷ lục của văn phòng<\/span>/, ''); };
const _pulseInner19 = pulseInner; pulseInner = function () { return _pulseInner19().replace(' <small>so với các mùa trước</small>', '').replace(' <small>tự ẩn sau 3 ngày</small>', ''); };
const _tpCard19 = topProducersCard; topProducersCard = function () { return _tpCard19().replace(/<small>(Income|Files|Tips)( tuần| cả mùa)<\/small>/g, ''); };
function taxSummary20() {
  const C = ['#7fb2e0', '#8fc9a8', '#f0c27b', '#e8a0a0']; const rows = []; const T = { cc: 0, zl: 0, wt: 0, rf: 0, all: 0, cl: 0, ef: 0, ac: 0, ot: 0, wn: 0 };
  S.staff.forEach((s) => { const v = { n: s.name, cc: 0, zl: 0, wt: 0, rf: 0, all: 0, cl: 0, ef: 0, ac: 0, ot: 0, wn: 0 };
    live(s.id).filter((r) => r.date >= S.from && r.date <= S.to).forEach((r) => { const b = bucket(r); v[b] += amt(r); v.all += amt(r); if (b === 'wt') v.wn++; if (r.status !== 'Refund') v.cl++;
      if (r.status === 'E-file') v.ef++; if (r.status === 'Accepted') v.ac++; if (r.status === 'Rejected' || r.status === 'Hold' || r.status === 'Paper Mailed') v.ot++; });
    Object.keys(T).forEach((k) => { T[k] += v[k]; }); rows.push(v); });
  const mx = Math.max(1, ...rows.map((s) => Math.abs(s.cc) + Math.abs(s.zl) + Math.abs(s.wt) + Math.abs(s.rf))); const A = attn();
  return `<div class="fh19"><h2 class="fhh">Summary</h2><span class="tsel20">${periodCtl()}</span></div><div class="pay19 tsum20">
    ${statStrip([['Total clients', T.cl.toLocaleString(), `${S.staff.length} preparers`], ['Total income', usd(T.all), T.cl ? `TB ${usd(T.all / T.cl)} / hồ sơ` : ''], ['Still waiting · online', `<span class="soon">${usd(T.wt)}</span>`, `${T.wn} files chưa Paid`], ['Attention', `<span class="late">${A.total} files</span>`, '<a href="#" id="goAttn">Xem danh sách →</a>']])}
    <table class="t ycmp sumt20"><thead><tr><th>Preparer</th><th class="right">Cash / Check</th><th class="right">Zelle / Venmo</th><th class="right">Wait</th><th class="right">Refund</th><th class="right">Total income</th><th class="right">Clients</th><th class="right">EF</th><th class="right">Accepted</th><th class="right">Others</th><th style="width:15%"></th></tr></thead><tbody>
    ${rows.map((s) => `<tr><td><b>${esc(s.n)}</b></td><td class="right num">${usd(s.cc)}</td><td class="right num">${usd(s.zl)}</td><td class="right num">${usd(s.wt)}</td><td class="right num">${usd(s.rf)}</td><td class="right num"><b>${usd(s.all)}</b></td><td class="right num">${s.cl}</td><td class="right num">${s.ef || '<span class="faint">–</span>'}</td><td class="right num">${s.ac}</td><td class="right num"><span class="late oth" style="cursor:pointer">${s.ot}</span></td>
      <td><span class="ybar">${[s.cc, s.zl, s.wt, s.rf].map((v, k) => `<i style="width:${Math.abs(v) / mx * 100}%;background:${C[k]}"></i>`).join('')}</span></td></tr>`).join('')}
    <tr class="tot"><td>Total</td><td class="right num">${usd(T.cc)}</td><td class="right num">${usd(T.zl)}</td><td class="right num">${usd(T.wt)}</td><td class="right num">${usd(T.rf)}</td><td class="right num">${usd(T.all)}</td><td class="right num">${T.cl}</td><td class="right num">${T.ef}</td><td class="right num">${T.ac}</td><td class="right num">${T.ot}</td><td></td></tr></tbody></table>
    <div class="legend"><span><i style="background:${C[0]}"></i>Cash / Check</span><span><i style="background:${C[1]}"></i>Zelle / Venmo</span><span><i style="background:${C[2]}"></i>Wait</span><span><i style="background:${C[3]}"></i>Refund</span></div></div>${othersPanel()}`;
}
pageHome = function () {
  loadNews20();
  let h = heroHtml20();
  h += `<div class="pay19 taxnews19" id="taxnews20">${newsInner20()}</div>`;
  h += pulseHtml();
  h += topProducersCard();
  h += homeCardHtml('Informations / Tips');
  if (isAdmin()) h += taxSummary20();
  return h;
};
function bindHome20() {
  if ($('#th19')) $('#th19').onclick = openTheme;
  if ($('#goAttn')) $('#goAttn').onclick = (e) => { e.preventDefault(); S.page = 'attn'; render(); };
}

// ---------- Records ----------
const RYEARS = ['2025', '2024', '2023', '2022', '2021'];
const RV = { view: 'sum', dys: ['2025'], multi: false, metric: 'all', from: '', to: '', fromT: '', toT: '', q: '', prep: '', sort: 'd', dir: -1, ay: '2025', n: 150, all: null, busy: false };
const RVIEWS = [['sum', 'Summary'], ['avg', 'Average'], ['daily', 'Daily income'], ['all', 'All details']];
const RSORTS = [['d:-1', 'Date · mới → cũ'], ['d:1', 'Date · cũ → mới'], ['p:1', 'Preparer · A → Z'], ['p:-1', 'Preparer · Z → A'], ['n:1', 'Name · A → Z'], ['a:-1', 'Amount · cao → thấp'], ['a:1', 'Amount · thấp → cao'], ['s:1', 'Status · A → Z']];
const RDEF = { d: -1, a: -1, p: 1, n: 1, s: 1 };
let DLY = null; // DLY[year]['MM-DD'][preparer] = [clients, income, ef, accepted, others]
function dly() {
  if (DLY) return DLY; DLY = {};
  Object.keys(REC).forEach((y) => { Object.keys(REC[y]).forEach((p) => { REC[y][p].forEach((a) => { const md = String(a[0]).slice(5, 10); const o = ((DLY[y] ||= {})[md] ||= {}); o[p] = [a[1], a[2], a[7] || 0, a[8] || 0, a[9] || 0]; }); }); });
  return DLY;
}
const inRange = (md) => (!RV.from || md >= RV.from) && (!RV.to || md <= RV.to);
const mmdd = (t) => { const m = String(t || '').match(/^\s*(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*$/); return m ? m[1].padStart(2, '0') + '-' + m[2].padStart(2, '0') : ''; };
function recAgg(y) {
  const P = {}; Object.entries(dly()[y] || {}).forEach(([md, o]) => { if (!inRange(md)) return; Object.entries(o).forEach(([p, v]) => { const a = (P[p] ||= { c: 0, i: 0, ef: 0, acc: 0, oth: 0 }); a.c += v[0]; a.i += v[1]; a.ef += v[2]; a.acc += v[3]; a.oth += v[4]; }); });
  return Object.entries(P).map(([n, a]) => ({ n, ...a })).sort((a, b) => b.i - a.i);
}
function recSum() {
  return RYEARS.map((y) => { const L = recAgg(y); if (!L.length) return ''; const T = L.reduce((a, s) => ({ c: a.c + s.c, i: a.i + s.i, ef: a.ef + s.ef, acc: a.acc + s.acc, oth: a.oth + s.oth }), { c: 0, i: 0, ef: 0, acc: 0, oth: 0 }); const mx = Math.max(1, ...L.map((s) => s.i));
    return `<div class="ryear20"><div class="fyh"><h2>${y}</h2><b>${usd(T.i)}</b></div>
      ${statStrip([['Total clients', T.c.toLocaleString(), ''], ['Total income', usd(T.i), ''], ['Average / return', '$' + (T.i / Math.max(T.c, 1)).toFixed(2), ''], ['Accepted', T.acc.toLocaleString(), `${T.oth} others`]])}
      <table class="t ycmp"><thead><tr><th>Preparer</th><th class="right">Total income</th><th class="right">Clients</th><th class="right">EF</th><th class="right">Accepted</th><th class="right">Others</th><th style="width:30%"></th></tr></thead><tbody>
      ${L.map((s) => `<tr><td><b>${esc(s.n)}</b></td><td class="right num"><b>${usd(s.i)}</b></td><td class="right num">${s.c}</td><td class="right num">${s.ef || '<span class="faint">–</span>'}</td><td class="right num">${s.acc}</td><td class="right num">${s.oth}</td><td><span class="ybar"><i style="width:${s.i / mx * 100}%;background:#7fb2e0"></i></span></td></tr>`).join('')}
      <tr class="tot"><td>Total</td><td class="right num">${usd(T.i)}</td><td class="right num">${T.c}</td><td class="right num">${T.ef}</td><td class="right num">${T.acc}</td><td class="right num">${T.oth}</td><td></td></tr></tbody></table></div>`; }).join('');
}
const PCOL = ['#3d85c6', '#e06666', '#46a657', '#f2a400', '#8e63c9', '#ec7fa9', '#2bb3c0', '#a0673a', '#7f8c8d', '#c0392b'];
function avgChart() {
  const ys = RYEARS.slice().reverse(); const by = {}; const office = [];
  ys.forEach((y) => { const L = recAgg(y); let c = 0, i = 0; L.forEach((s) => { c += s.c; i += s.i; if (s.c >= 30) (by[s.n] ||= {})[y] = s.i / s.c; }); office.push(c ? i / c : null); });
  const names = Object.keys(by).filter((n) => Object.keys(by[n]).length >= 2).sort((a, b) => Object.keys(by[b]).length - Object.keys(by[a]).length || a.localeCompare(b));
  const all = names.flatMap((n) => Object.values(by[n])).concat(office.filter(Boolean)); if (!all.length) return '';
  const lo = Math.floor(Math.min(...all) / 10) * 10 - 5, hi = Math.ceil(Math.max(...all) / 10) * 10 + 5;
  const Wd = 1000, Hd = 280, L = 56, R = 120, Tp = 16, Bm = 34; const X = (k) => L + k * (Wd - L - R) / (ys.length - 1), Yv = (v) => Tp + (hi - v) / (hi - lo) * (Hd - Tp - Bm);
  let grid = ''; const st = (hi - lo) > 80 ? 20 : 10; for (let v = Math.ceil(lo / st) * st; v <= hi; v += st) grid += `<line x1="${L}" x2="${Wd - R}" y1="${Yv(v)}" y2="${Yv(v)}" stroke="#ece7de"/><text x="${L - 8}" y="${Yv(v)}" text-anchor="end" dominant-baseline="central" class="ax">$${v}</text>`;
  ys.forEach((y, k) => { grid += `<text x="${X(k)}" y="${Hd - 12}" text-anchor="middle" class="ax">${y}</text>`; });
  const ends = []; const series = names.map((n, j) => { const c = PCOL[j % PCOL.length]; const pts = ys.map((y, k) => by[n][y] != null ? [X(k), Yv(by[n][y]), by[n][y], y] : null).filter(Boolean);
    const last = pts[pts.length - 1]; if (last[3] === ys[ys.length - 1]) ends.push({ n, c, x: last[0], y: last[1] });
    return `<g class="s"><path d="M${pts.map((p) => p[0] + ' ' + p[1]).join(' L')}" fill="none" stroke="${c}" stroke-width="2.4" stroke-linejoin="round"/>${pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#fff" stroke="${c}" stroke-width="2"><title>${esc(n)} ${p[3]}: $${p[2].toFixed(2)}</title></circle>`).join('')}</g>`; }).join('');
  const op = ys.map((y, k) => office[k] != null ? [X(k), Yv(office[k]), office[k], y] : null).filter(Boolean); if (op.length) ends.push({ n: 'Office', c: '#2c3e50', x: op[op.length - 1][0], y: op[op.length - 1][1] });
  ends.sort((a, b) => a.y - b.y); for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 13) ends[i].y = ends[i - 1].y + 13;
  return `<div class="avgc20"><div class="fyh"><h2>Average / return theo năm</h2></div><svg viewBox="0 0 ${Wd} ${Hd}" class="avgsvg20">${grid}${series}
    <g class="s off20"><path d="M${op.map((p) => p[0] + ' ' + p[1]).join(' L')}" fill="none" stroke="#2c3e50" stroke-width="3" stroke-dasharray="7 5"/>${op.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="4.5" fill="#2c3e50"><title>Office ${p[3]}: $${p[2].toFixed(2)}</title></circle>`).join('')}</g>
    ${ends.map((e) => `<text x="${e.x + 10}" y="${e.y}" dominant-baseline="central" class="lb" fill="${e.c}">${esc(e.n)}</text>`).join('')}</svg>
    <div class="legend avgl20">${names.map((n, j) => `<span><i style="background:${PCOL[j % PCOL.length]}"></i>${esc(n)}</span>`).join('')}<span><i style="background:#2c3e50"></i>Office</span></div></div>`;
}
function recAvg() {
  return avgChart() + RYEARS.map((y) => { const L = recAgg(y); if (!L.length) return ''; const T = L.reduce((a, s) => ({ c: a.c + s.c, i: a.i + s.i }), { c: 0, i: 0 }); const mx = Math.max(1, ...L.map((s) => s.i / Math.max(s.c, 1)));
    const M = {}; Object.entries(dly()[y] || {}).forEach(([md, o]) => { if (!inRange(md)) return; const m = +md.slice(0, 2); Object.values(o).forEach((v) => { const a = (M[m] ||= { c: 0, i: 0 }); a.c += v[0]; a.i += v[1]; }); });
    return `<div class="ryear20"><div class="fyh"><h2>${y}</h2><b>$${(T.i / Math.max(T.c, 1)).toFixed(2)} <span class="muted small">/ return</span></b></div>
      <div class="grid73"><div><h3 class="rh20">By preparer</h3><table class="t ycmp"><thead><tr><th>Preparer</th><th class="right">Clients</th><th class="right">Total income</th><th class="right">Average / return</th><th style="width:28%"></th></tr></thead><tbody>
      ${L.map((s) => { const a = s.i / Math.max(s.c, 1); return `<tr><td><b>${esc(s.n)}</b></td><td class="right num">${s.c}</td><td class="right num">${usd(s.i)}</td><td class="right num"><b>$${a.toFixed(2)}</b></td><td><span class="ybar"><i style="width:${a / mx * 100}%;background:#8fc9a8"></i></span></td></tr>`; }).join('')}</tbody></table></div>
      <div><h3 class="rh20">By month</h3><table class="t ycmp"><thead><tr><th>Month</th><th class="right">Clients</th><th class="right">Income</th><th class="right">Average</th></tr></thead><tbody>
      ${Object.entries(M).sort((a, b) => a[0] - b[0]).map(([m, a]) => `<tr><td>${MON3[m - 1]}</td><td class="right num">${a.c}</td><td class="right num">${usd(a.i)}</td><td class="right num"><b>$${(a.i / Math.max(a.c, 1)).toFixed(2)}</b></td></tr>`).join('')}</tbody></table></div></div></div>`; }).join('');
}
function recDaily() {
  const M = RV.metric, both = M === 'all';
  return RV.dys.map((y) => { const D = dly()[y] || {}; const days = Object.keys(D).filter(inRange).sort(); const preps = recAgg(y).map((s) => s.n);
    const tot = (md) => Object.values(D[md]).reduce((a, v) => [a[0] + v[0], a[1] + v[1]], [0, 0]);
    const top = days.map((d) => [d, tot(d)[M === 'c' ? 0 : 1]]).sort((a, b) => b[1] - a[1]).slice(0, 3).map((x) => x[0]);
    const dow = (md) => new Date(`${+y + 1}-${md}T12:00:00`).getDay(); const T = days.reduce((a, d) => { const t = tot(d); return [a[0] + t[0], a[1] + t[1]]; }, [0, 0]);
    const cell = (v) => (M === 'c' ? `<td>${v[0]}</td>` : M === 'i' ? `<td>${usd(v[1])}</td>` : `<td>${v[0]}</td><td>${usd(v[1])}</td>`);
    const empty = both ? '<td class="z">–</td><td class="z">–</td>' : '<td class="z">–</td>';
    const tcell = (t) => (M === 'c' ? `<td class="tday"><b>${t[0]}</b>` : M === 'i' ? `<td class="tday"><b>${usd(t[1])}</b>` : `<td class="tday"><b>${t[0]}</b></td><td class="tday"><b>${usd(t[1])}</b>`);
    return `<div class="ryear20"><div class="fyh"><h2>${y}</h2><b>${M === 'c' ? T[0].toLocaleString() + ' <span class="muted small">clients</span>' : usd(T[1])}</b></div><div style="overflow-x:auto"><table class="t ft dly20 ${both ? '' : 'one20'}"><thead><tr><th>Date</th><th>Day</th>${preps.map((p) => `<th ${both ? 'colspan="2"' : ''} class="c">${esc(p)}</th>`).join('')}<th ${both ? 'colspan="2"' : ''} class="c tday">Total / day</th></tr>
      ${both ? `<tr class="sub"><th></th><th></th>${preps.map(() => '<th>Clients</th><th>$</th>').join('')}<th class="tday">Clients</th><th class="tday">Income</th></tr>` : ''}</thead><tbody>
      ${days.map((d) => { const o = D[d]; const t = tot(d); const w = dow(d); return `<tr><td><b>${+d.slice(0, 2)}/${+d.slice(3)}</b></td><td class="${w === 0 || w === 6 ? 'we20' : 'muted'}">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][w]}</td>${preps.map((p) => (o[p] ? cell(o[p]) : empty)).join('')}${tcell(t)}${top.includes(d) ? ' <span class="top20">●</span>' : ''}</td></tr>`; }).join('')}
      </tbody></table></div></div>`; }).join('');
}
function loadAll20(more) {
  if (!more) RV.n = 150; RV.busy = true;
  const q = new URLSearchParams({ years: RV.ay, limit: String(RV.n), order: RV.sort, dir: RV.dir > 0 ? 'asc' : 'desc' });
  if (RV.prep) q.set('prep', RV.prep); if (RV.q.trim()) q.set('q', RV.q.trim()); if (RV.from) q.set('from', RV.from); if (RV.to) q.set('to', RV.to);
  const key = q.toString(); RV.key = key;
  api('GET', '/records/clients?' + key).then((d) => { if (RV.key !== key) return; RV.all = d; RV.busy = false; const b = $('#rall20'); if (b) b.innerHTML = recAllTable(); }).catch((e) => { RV.busy = false; fail(e); });
}
function recAllTable() {
  const d = RV.all; if (!d) return '<div class="muted">Đang tải…</div>';
  const th = (k, t, cls = '') => `<th class="sort ${cls} ${RV.sort === k ? 'on' : ''}" data-rs="${k}">${t}<i class="ar20">${RV.sort === k ? (RV.dir < 0 ? '▼' : '▲') : '↕'}</i></th>`;
  return `<div class="muted small" style="margin:4px 0 8px">${d.total.toLocaleString()} files · showing ${Math.min(d.total, d.rows.length)}</div>
    <table class="t rall20"><thead><tr>${th('d', 'Date')}${th('p', 'Preparer')}${th('n', 'Name')}<th>SSN</th>${th('a', 'Amount', 'right')}${th('s', 'Status')}<th>Note</th></tr></thead><tbody>
    ${d.rows.map((r) => `<tr><td class="nowrap">${r.date ? mdy(r.date) : '<span class="faint">–</span>'}</td><td class="nowrap">${esc(r.preparer)}</td><td>${esc(r.name)}</td><td class="num">${esc(r.ssn)}</td><td class="right num">${usd(r.amt)}</td><td class="${/reject|hold/i.test(r.status) ? 'late' : /accept/i.test(r.status) ? 'ok' : ''}">${esc(r.status)}</td><td class="muted small">${esc(r.note)}</td></tr>`).join('')}</tbody></table>
    ${d.rows.length < d.total ? '<p><button class="btn sm" data-act="rmore">Xem thêm</button></p>' : ''}`;
}
function recAll() {
  const preps = Object.keys(REC[RV.ay] || {}).sort();
  if (!RV.all && !RV.busy) loadAll20();
  return `<div class="searchbar"><input type="search" id="rq20" placeholder="Search name or last 4 SSN" value="${esc(RV.q)}" style="width:240px"><select id="rp20"><option value="">All preparers</option>${preps.map((p) => `<option ${RV.prep === p ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select>
    <select id="rso20">${RSORTS.map(([k, t]) => `<option value="${k}" ${k === RV.sort + ':' + RV.dir ? 'selected' : ''}>Sort: ${t}</option>`).join('')}</select></div><div id="rall20">${recAllTable()}</div>`;
}
pageRecords = function () {
  const yr = RV.view === 'daily' ? `<span class="rl20">Year</span><div class="tabs plain">${RYEARS.map((y) => `<button data-ry="${y}" class="${RV.dys.includes(y) ? 'on' : ''}" title="Ctrl + click để chọn thêm năm">${y}</button>`).join('')}<button data-ry="all" class="${RV.dys.length === RYEARS.length ? 'on' : ''}">All</button></div><label class="small rmulti20"><input type="checkbox" data-act="rmulti" ${RV.multi ? 'checked' : ''}> Nhiều năm</label><span class="rsep20"></span>
      <span class="rl20">Show</span><div class="tabs plain">${[['c', 'Clients'], ['i', 'Income'], ['all', 'All']].map(([k, t]) => `<button data-rm="${k}" class="${RV.metric === k ? 'on' : ''}">${t}</button>`).join('')}</div><span class="rsep20"></span>`
    : RV.view === 'all' ? `<span class="rl20">Year</span><div class="tabs plain">${RYEARS.map((y) => `<button data-ray="${y}" class="${RV.ay === y ? 'on' : ''}">${y}</button>`).join('')}</div><span class="rsep20"></span>` : '';
  return `<div class="pay19 rec20"><div class="page-head"><h1>Records</h1></div>
    <div class="tabs">${RVIEWS.map(([k, t]) => `<button data-rv="${k}" class="${RV.view === k ? 'on' : ''}">${t}</button>`).join('')}</div>
    <div class="ropt20"><div class="btnrow">${yr}<span class="rl20">Request date</span> from <input type="text" id="rf20" placeholder="mm/dd" value="${esc(RV.fromT)}" style="width:76px"> to <input type="text" id="rt20" placeholder="mm/dd" value="${esc(RV.toT)}" style="width:76px"> <button class="btn small primary" data-act="rflt">Filter</button>${RV.from || RV.to ? ' <button class="link" data-act="rclr">Clear</button>' : ''}</div></div>
    <div id="rbody20">${RV.view === 'sum' ? recSum() : RV.view === 'avg' ? recAvg() : RV.view === 'daily' ? recDaily() : recAll()}</div></div>`;
};
bindRecords = function () { /* v20: events are delegated (bindRecords20) */ };
function bindRecords20() {
  const host = $('#page .rec20'); if (!host || host._b20) return; host._b20 = 1;
  host.onclick = (e) => {
    const t = e.target; const rv = t.closest('[data-rv]'), ry = t.closest('[data-ry]'), rs = t.closest('[data-rs]'), rm = t.closest('[data-rm]'), ay = t.closest('[data-ray]'), a = t.closest('[data-act]');
    if (rv) RV.view = rv.dataset.rv;
    else if (ry) { const y = ry.dataset.ry; const add = RV.multi || e.ctrlKey || e.metaKey || e.shiftKey;
      if (y === 'all') { RV.dys = RYEARS.slice(); RV.multi = true; }
      else if (add) RV.dys = RV.dys.includes(y) ? (RV.dys.length > 1 ? RV.dys.filter((x) => x !== y) : RV.dys) : RYEARS.filter((x) => RV.dys.includes(x) || x === y);
      else RV.dys = [y]; }
    else if (rm) RV.metric = rm.dataset.rm;
    else if (ay) { RV.ay = ay.dataset.ray; RV.prep = ''; RV.all = null; }
    else if (rs) { const k = rs.dataset.rs; if (RV.sort === k) RV.dir *= -1; else { RV.sort = k; RV.dir = RDEF[k]; } RV.all = null; }
    else if (a && a.dataset.act === 'rmulti') { RV.multi = a.checked; if (!RV.multi) RV.dys = RV.dys.slice(0, 1); }
    else if (a && a.dataset.act === 'rflt') { RV.fromT = $('#rf20').value; RV.toT = $('#rt20').value; RV.from = mmdd(RV.fromT); RV.to = mmdd(RV.toT); RV.all = null; }
    else if (a && a.dataset.act === 'rclr') { RV.from = RV.to = RV.fromT = RV.toT = ''; RV.all = null; }
    else if (a && a.dataset.act === 'rmore') { RV.n += 150; loadAll20(true); return; }
    else return;
    keepY(render);
  };
  host.oninput = (e) => { if (e.target.id === 'rq20') { RV.q = e.target.value; clearTimeout(RV.t); RV.t = setTimeout(() => loadAll20(), 300); } };
  host.onchange = (e) => {
    if (e.target.id === 'rp20') { RV.prep = e.target.value; loadAll20(); }
    if (e.target.id === 'rso20') { const [k, d] = e.target.value.split(':'); RV.sort = k; RV.dir = +d; RV.all = null; keepY(render); }
  };
}

// ---------- Accounting: Lương (double-click edit, compact History) + Cash (season history) ----------
const _diffHtml19 = diffHtml;
diffHtml = function (rec, exp) { const h = _diffHtml19(rec, exp); return h.replace('<span class="ok">0</span>', '<span class="ok tick20">✓</span>').replace('chưa nhận', '–'); };
const AC = { grp: 'period', cg: 'week', cy: '' };
const seasonOf = (d) => { const md = d.slice(5); return md >= '01-15' && md <= '04-15'; };
function cashHist20() {
  const M = cashModel(); const days = {};
  Object.keys(M.recs).forEach((d) => { days[d] = 1; }); (S.acct.cash || []).forEach((c) => { days[c.day] = 1; }); Object.keys(M.lm).forEach((d) => { days[d] = 1; });
  const list = Object.keys(days).filter((d) => seasonOf(d) && d <= todayISO()).sort();
  const years = [...new Set(list.map((d) => d.slice(0, 4)))].sort().reverse();
  if (!years.length) return '';
  if (!AC.cy || !years.includes(AC.cy)) AC.cy = years[0];
  const rows = list.filter((d) => AC.cg === 'year' || d.startsWith(AC.cy)).map((d) => { const E = M.exp(d); const o = { d, f: 0, c: 0, k: 0, z: 0, g: 0 };
    S.staff.forEach((t) => { if (selfKeep(t)) return; const x = E[t.dbId]; if (x) { o.f += x.n; o.c += x.cash; o.k += x.check; o.z += x.zl; } const r = cashRec(d, t.dbId); if (r && r.received != null) o.g += r.received; });
    return o; }).filter((o) => o.f || o.c || o.g);
  const key = (d) => (AC.cg === 'day' ? d : AC.cg === 'week' ? mondayISO(d) : AC.cg === 'month' ? d.slice(0, 7) : d.slice(0, 4));
  const G = []; rows.forEach((o) => { const k = key(o.d); let g = G.find((x) => x.k === k); if (!g) { g = { k, f: 0, c: 0, k2: 0, z: 0, g: 0, first: o.d, last: o.d }; G.push(g); } g.f += o.f; g.c += o.c; g.k2 += o.k; g.z += o.z; g.g += o.g; g.last = o.d; });
  const lab = (g) => (AC.cg === 'day' ? `${md(g.k)} <span class="muted">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(g.k + 'T12:00:00').getDay()]}</span>` : AC.cg === 'week' ? `${md(g.first)} – ${md(g.last)}` : AC.cg === 'month' ? MONL[+g.k.slice(5) - 1] : `${g.k} <span class="muted small">1/15 – 4/15</span>`);
  const dif = (v) => { v = Math.round(v * 100) / 100; return v === 0 ? '<span class="ok tick20">✓</span>' : `<span class="late">${v < 0 ? '−' : '+'}${money(Math.abs(v))}</span>`; };
  const T = G.reduce((a, g) => ({ f: a.f + g.f, c: a.c + g.c, k2: a.k2 + g.k2, z: a.z + g.z, g: a.g + g.g }), { f: 0, c: 0, k2: 0, z: 0, g: 0 });
  return `<div class="pay19"><div class="card ch20"><div class="card-head"><h2>History</h2><span class="btnrow"><div class="tabs plain">${[['day', 'Day'], ['week', 'Week'], ['month', 'Month'], ['year', 'Year']].map(([k, t]) => `<button data-chg="${k}" class="${AC.cg === k ? 'on' : ''}">${t}</button>`).join('')}</div>
    ${AC.cg === 'year' ? '' : `<div class="tabs plain">${years.map((y) => `<button data-chy="${y}" class="${AC.cy === y ? 'on' : ''}">${y}</button>`).join('')}</div>`}</span></div>
    <div class="chwrap20"><table class="t ycmp hist20"><thead><tr><th>${{ day: 'Day', week: 'Week', month: 'Month', year: 'Season' }[AC.cg]}</th><th class="right">Files</th><th class="right">Cash on records</th><th class="right">Check</th><th class="right">Zelle / Venmo</th><th class="right">Cash received</th><th class="right">Difference</th></tr></thead><tbody>
    ${G.slice().reverse().map((g) => `<tr><td class="nowrap"><b>${AC.cg === 'day' ? `<a href="#" data-cday="${g.k}">${lab(g)}</a>` : lab(g)}</b></td><td class="right num">${g.f.toLocaleString()}</td><td class="right num">${money(g.c)}</td><td class="right num">${money(g.k2)}</td><td class="right num">${money(g.z)}</td><td class="right num"><b>${money(g.g)}</b></td><td class="right num">${dif(g.g - g.c)}</td></tr>`).join('')}
    <tr class="tot"><td>Total</td><td class="right">${T.f.toLocaleString()}</td><td class="right">${money(T.c)}</td><td class="right">${money(T.k2)}</td><td class="right">${money(T.z)}</td><td class="right">${money(T.g)}</td><td class="right">${dif(T.g - T.c)}</td></tr></tbody></table></div></div></div>`;
}
// v21: Cash received + Note are plain text, double-click to edit (no input boxes, column widths never move)
function editCash21(td) {
  const tr = td.closest('[data-tab]'); const tab = +tr.dataset.tab; const f = td.dataset.c; const rec = cashRec(S.cashDay, tab) || { received: null, done: false, note: '' };
  const cur = f === 'received' ? (rec.received == null ? '' : rec.received) : rec.note || '';
  const i = cellEdit21(td, cur, { num: f === 'received', left: f === 'note' }); let done = false;
  const fin = (save) => { if (done) return; done = true; if (!save || i.value.trim() === String(cur)) { keepY(render); return; }
    const body = { day: S.cashDay, tab_id: tab, received: rec.received, done: rec.done, note: rec.note || '' };
    if (f === 'received') { const v = i.value.replace(/[$,\s]/g, ''); body.received = v === '' ? null : +v; if (v !== '' && !Number.isFinite(body.received)) { toast('Số không đúng', true); keepY(render); return; } body.done = body.received != null; } else body.note = i.value.trim();
    api('PUT', '/cash', body).then((r) => { const a = S.acct.cash; const k = a.indexOf(cashRec(S.cashDay, tab)); if (k >= 0) a[k] = r; else a.push(r); keepY(render); }).catch((er) => { keepY(render); fail(er); }); };
  i.onkeydown = (k) => { if (k.key === 'Enter') fin(true); if (k.key === 'Escape') { k.stopPropagation(); fin(false); } }; i.onblur = () => fin(true);
}
function pageCash20() {
  let h = pageCash();
  h = h.replace(/<td class="n"><input type="number" step="0\.01" class="cin" data-c="received" value="([^"]*)"( disabled)?><\/td>/g, (m, v, dis) => `<td class="n ${dis ? 'lk21' : 'cv21td ed20'}" data-c="received">${v !== '' ? money(+v) : `<span class="ph21">${dis ? '–' : 'double-click'}</span>`}</td>`)
    .replace(/<td><input type="text" class="cnote" data-c="note" value="([^"]*)"( disabled)?><\/td>/g, (m, v, dis) => `<td class="${dis ? 'lk21' : 'cv21td ed20'} nt21" data-c="note">${v || ''}</td>`);
  const cut = h.indexOf('<h3 style="margin-top:22px">Các ngày khác</h3>'); if (cut >= 0) h = h.slice(0, cut);
  h = h.replace('<th class="n">Cash (theo hồ sơ)</th>', '<th class="n">Cash on records</th>').replace('<th class="n">Cash thực nhận</th>', '<th class="n">Cash received</th>').replace('<th class="n">Chênh lệch</th>', '<th class="n">Difference</th>')
    .replace('<th class="n">Hồ sơ</th>', '<th class="n">Files</th>').replace(/<div class="muted small" style="margin-top:6px">Gõ số vào Cash thực nhận[\s\S]*?<\/div>/, '')
    .replace('<td class="n"><span class="ok">0</span></td><td colspan="2">', '<td class="n"><span class="ok tick20">✓</span></td><td colspan="2">')
    .replace(/<span class="muted small">(Thêm \/ sửa \/ xóa hồ sơ|[^<]*Lock xong)[^<]*<\/span>/, '');
  return h + cashHist20();
}
// Lương
const calcW = (h, rate) => calcWages(h, rate) || 0;
function payGroups20(periods) {
  const key = (p) => (AC.grp === 'period' ? p.start : AC.grp === 'month' ? p.end.slice(0, 7) : AC.grp === 'quarter' ? p.end.slice(0, 4) + ' Q' + Math.ceil(+p.end.slice(5, 7) / 3) : p.end.slice(0, 4));
  const lab = (k, p) => (AC.grp === 'period' ? `${md(p.start)} – ${mdy(p.end)}` : AC.grp === 'month' ? MONL[+k.slice(5) - 1] + ' ' + k.slice(0, 4) : k);
  const G = [];
  periods.forEach((p) => { const k = key(p); let g = G.find((x) => x.k === k); if (!g) { g = { k, lab: lab(k, p), n: 0, by: {} }; G.push(g); } g.n++;
    (S.acct.rows || []).filter((r) => r.period_id === p.id).forEach((r) => { const a = (g.by[r.staff_id] ||= { h: 0, w: 0, b: 0 }); a.h += n0(r.hours); a.w += n0(r.wages); a.b += n0(r.bonus); }); });
  return G.reverse();
}
const ed20 = (key, html, al = 'right') => `<td class="${al} ed20" data-ed="${key}" title="Double-click để sửa">${html}</td>`;
function pagePay20() {
  const A = S.acct; const ps = A.periods.slice().sort((a, b) => (a.start < b.start ? -1 : 1)); const p = curPeriod();
  const yr = todayISO().slice(0, 4); const yp = ps.filter((x) => x.end.startsWith(yr)); const ids = new Set(yp.map((x) => x.id));
  const Y = { h: 0, w: 0, b: 0 }; const people = new Set(); (A.rows || []).forEach((r) => { if (ids.has(r.period_id)) { Y.h += n0(r.hours); Y.w += n0(r.wages); Y.b += n0(r.bonus); if (n0(r.hours) || n0(r.wages)) people.add(r.staff_id); } });
  let h = statStrip([[`Paid ${yr} YTD`, usd(Y.w + Y.b), `${yp.length} pay periods`], ['Hours', Math.round(Y.h).toLocaleString(), `${people.size} người`],
    ['Last period', p ? usd((A.rows || []).filter((r) => r.period_id === p.id).reduce((s, r) => s + n0(r.wages) + n0(r.bonus), 0)) : '–', p ? `${md(p.start)} – ${mdy(p.end)}` : ''], ['Bonus', usd(Y.b), '']]);
  h += `<div class="flt20"><div class="card-head"><h2>Pay period</h2><span class="btnrow"><button class="btn small" data-act="pprev">‹</button><b>${p ? md(p.start) + ' – ' + mdy(p.end) : '—'}</b><button class="btn small" data-act="pnext">›</button><button class="btn small primary" id="newPer">+ New period</button></span></div>`;
  if (!p) return h + '<div class="muted">Chưa có period nào. Bấm <b>+ New period</b>.</div></div>';
  const list = A.staff.filter((st) => st.active || payRow(p.id, st.id)); const PT = { h: 0, w: 0, b: 0 };
  h += `<table class="t ycmp pp20"><thead><tr><th>Staff</th><th class="right">Rate</th><th class="right">Hours</th><th class="right">Wages</th><th class="right">Bonus</th><th class="right">Total</th><th>Note</th></tr></thead><tbody>
    ${list.map((st) => { const r = payRow(p.id, st.id) || {}; const hh = n0(r.hours), w = n0(r.wages), b = n0(r.bonus); PT.h += hh; PT.w += w; PT.b += b; const ot = Math.max(hh - OT_LIMIT, 0);
      return `<tr><td><button class="linkbtn" data-emp="${st.id}"><b>${esc(st.name)}</b></button>${st.active ? '' : ' <span class="muted small">(nghỉ)</span>'}</td><td class="right num">$${st.rate}</td>
        ${ed20(`${p.id}|${st.id}|hours`, `${hh || '<span class="faint">–</span>'}${ot ? ` <span class="soon small">OT ${ot}h</span>` : ''}`)}${ed20(`${p.id}|${st.id}|wages`, `${r.wages_manual ? '<span class="man20" title="Sửa tay">✎</span>' : ''}${w ? usd(w) : '<span class="faint">–</span>'}`)}${ed20(`${p.id}|${st.id}|bonus`, b ? usd(b) : '<span class="faint">–</span>')}
        <td class="right num"><b>${w + b ? usd(w + b) : ''}</b></td>${ed20(`${p.id}|${st.id}|note`, esc(r.note || ''), 'left nt')}</tr>`; }).join('')}
    <tr class="tot"><td>Total</td><td></td><td class="right">${PT.h}</td><td class="right">${usd(PT.w)}</td><td class="right">${PT.b ? usd(PT.b) : ''}</td><td class="right">${usd(PT.w + PT.b)}</td><td></td></tr></tbody></table>
    <div class="ctl-row small per20"><label>Từ <input type="date" id="perS" value="${p.start}"></label><label>Đến <input type="date" id="perE" value="${p.end}"></label><button class="btn sm del" id="perDel">Xóa period</button><button class="btn sm" id="addEmp">+ Thêm nhân viên</button></div>
    <div id="empBox">${S.payEdit ? empBox(S.payEdit) : ''}</div></div>`;
  const G = payGroups20(ps); const staff = A.staff.filter((st) => (A.rows || []).some((r) => r.staff_id === st.id && (n0(r.hours) || n0(r.wages))));
  const tot = (o) => Object.values(o).reduce((a, x) => ({ h: a.h + x.h, w: a.w + x.w, b: a.b + x.b }), { h: 0, w: 0, b: 0 });
  h += `<div class="flt20"><div class="card-head"><h2>History</h2><div class="tabs plain">${[['period', 'Pay period'], ['month', 'Month'], ['quarter', 'Quarter'], ['year', 'Annual']].map(([k, t]) => `<button data-ag="${k}" class="${AC.grp === k ? 'on' : ''}">${t}</button>`).join('')}</div></div>
    <div style="overflow-x:auto"><table class="t ycmp hist20"><thead><tr><th>${{ period: 'Pay period', month: 'Month', quarter: 'Quarter', year: 'Year' }[AC.grp]}</th>${staff.map((st) => `<th class="right">${esc(st.name)}</th>`).join('')}<th class="right">Hours</th><th class="right">Bonus</th><th class="right">Total paid</th></tr></thead><tbody>
    ${G.map((g) => { const T = tot(g.by); return `<tr><td class="nowrap"><b>${g.lab}</b>${AC.grp !== 'period' ? ` <span class="muted small">${g.n} periods</span>` : ''}</td>${staff.map((st) => (g.by[st.id] && (g.by[st.id].w || g.by[st.id].h) ? `<td class="right num">${usd(g.by[st.id].w + g.by[st.id].b)}<span class="hh20">${Math.round(g.by[st.id].h)}h</span></td>` : '<td class="right faint">–</td>')).join('')}<td class="right num">${Math.round(T.h)}</td><td class="right num">${T.b ? usd(T.b) : '<span class="faint">–</span>'}</td><td class="right num"><b>${usd(T.w + T.b)}</b></td></tr>`; }).join('')}
    </tbody></table></div></div>`;
  return h;
}
pageAcct = function () {
  if (!S.acctSub20) S.acctSub20 = todayISO().slice(5) <= '04-15' ? 'cash' : 'pay';
  let h = `<div class="pay19 acct20"><div class="page-head"><h1>Accounting</h1></div><div class="tabs">${[['pay', 'Lương'], ['cash', 'Cash']].map(([k, t]) => `<button data-as="${k}" class="${S.acctSub20 === k ? 'on' : ''}">${t}</button>`).join('')}</div>`;
  if (!S.acct) { loadAcct(); return h + '<div class="muted">Đang tải…</div></div>'; }
  S.acctSub = S.acctSub20;
  return h + (S.acctSub20 === 'cash' ? pageCash20() : pagePay20()) + '</div>';
};
bindAcct = function () { /* v20: see bindAcct20 */ };
function savePayCell(pid, sid, f, raw) {
  const A = S.acct; const st = staffOf(sid); const r = Object.assign({ period_id: pid, staff_id: sid, hours: null, wages: null, bonus: null, note: '', wages_manual: false }, payRow(pid, sid) || {});
  const v = String(raw).trim(); const nv = v === '' ? null : +v.replace(/[$,]/g, '');
  if (f !== 'note' && v !== '' && !Number.isFinite(nv)) { toast('Số không hợp lệ', true); return; }
  if (f === 'hours') { r.hours = nv; if (!r.wages_manual) r.wages = nv ? calcW(nv, st.rate) : null; }
  else if (f === 'wages') { if (v === '') { r.wages_manual = false; r.wages = r.hours ? calcW(r.hours, st.rate) : null; } else { r.wages = Math.round(nv * 100) / 100; r.wages_manual = r.wages !== calcW(r.hours, st.rate); } }
  else if (f === 'bonus') r.bonus = nv; else r.note = v;
  api('PUT', '/pay/rows', r).then((x) => { const i = A.rows.indexOf(payRow(pid, sid)); if (i >= 0) A.rows[i] = x; else A.rows.push(x); keepY(render); }).catch(fail);
}
function bindAcct20() {
  const host = $('#page .acct20'); if (!host) return;
  host.onclick = (e) => {
    const t = e.target; const as = t.closest('[data-as]'), ag = t.closest('[data-ag]'), a = t.closest('[data-act]'), cg = t.closest('[data-chg]'), cy = t.closest('[data-chy]');
    if (as) { S.acctSub20 = as.dataset.as; keepY(render); return; }
    if (ag) { AC.grp = ag.dataset.ag; keepY(render); return; }
    if (cg) { AC.cg = cg.dataset.chg; keepY(render); return; }
    if (cy) { AC.cy = cy.dataset.chy; keepY(render); return; }
    if (a && (a.dataset.act === 'pprev' || a.dataset.act === 'pnext')) { const ps = S.acct.periods.slice().sort((x, y) => (x.start < y.start ? -1 : 1)); const i = ps.findIndex((x) => x.id === S.payPer); const j = Math.min(Math.max(i + (a.dataset.act === 'pprev' ? -1 : 1), 0), ps.length - 1); if (ps[j]) S.payPer = ps[j].id; keepY(render); }
  };
  host.ondblclick = (e) => {
    const cv = e.target.closest('td.cv21td'); if (cv && !cv.querySelector('input')) { editCash21(cv); return; } // v21: Cash received / Note = double-click
    const td = e.target.closest('[data-ed]'); if (!td || td.querySelector('input')) return;
    const [pid, sid, f] = td.dataset.ed.split('|'); const r = payRow(+pid, +sid) || {};
    const i = cellEdit21(td, r[f] == null ? '' : r[f], { left: f === 'note', num: f !== 'note' }); let done = false; // v21: editor floats over the cell
    const fin = (save) => { if (done) return; done = true; if (save && i.value !== String(r[f] == null ? '' : r[f])) savePayCell(+pid, +sid, f, i.value); else keepY(render); };
    i.onkeydown = (k) => { if (k.key === 'Enter') fin(true); if (k.key === 'Escape') { k.stopPropagation(); fin(false); } }; i.onblur = () => fin(true);
  };
  if (S.acctSub20 === 'cash') { if ($('#cashDay')) bindCash(); return; } // v21: page may still be loading
  if (!S.acct || !curPeriod()) { if ($('#newPer')) $('#newPer').onclick = newPer20; return; }
  $('#newPer').onclick = newPer20;
  const p = curPeriod();
  const savePer = () => { const a = $('#perS').value, b = $('#perE').value; if (!a || !b) return; api('PATCH', '/pay/periods/' + p.id, { start: a, end: b }).then((r) => { p.start = r.start; p.end = r.end; keepY(render); }).catch(fail); };
  $('#perS').onchange = savePer; $('#perE').onchange = savePer;
  $('#perDel').onclick = () => { if (!confirm('Xóa period ' + perLabel(p) + ' và toàn bộ số giờ / lương trong period này?')) return; api('DELETE', '/pay/periods/' + p.id).then(() => { S.acct.periods = S.acct.periods.filter((x) => x.id !== p.id); S.acct.rows = S.acct.rows.filter((r) => r.period_id !== p.id); S.payPer = null; render(); }).catch(fail); };
  $('#addEmp').onclick = () => { const n = prompt('Tên nhân viên mới'); if (!n) return; api('POST', '/pay/staff', { name: n.trim() }).then((r) => { S.acct.staff.push(r); S.payEdit = r.id; render(); }).catch(fail); };
  $$('[data-emp]').forEach((b) => { b.onclick = () => { S.payEdit = +b.getAttribute('data-emp'); $('#empBox').innerHTML = empBox(S.payEdit); bindEmp(); }; });
  if (S.payEdit) bindEmp();
}
function newPer20() { const np = nextPeriod(); api('POST', '/pay/periods', np).then((r) => { S.acct.periods.push(r); S.payPer = r.id; render(); }).catch(fail); }

// ---------- Tools ----------
document.addEventListener('input', (e) => { if (e.target.id === 'tcI') { TC.inc = e.target.value; $('#tcR').innerHTML = tcCalc(); } });
document.addEventListener('change', (e) => {
  if (e.target.id === 'tcE') { TC.e = e.target.value; keepY(render); }
  if (e.target.id === 'tcF') { TC.first = e.target.checked; $('#tcR').innerHTML = tcCalc(); }
});

// =====================================================================
// v21.2: Gen Z (trẻ trung, sticker, neo-brutal) · (Đô thị đã bỏ ở v21.7)
// =====================================================================
THEMES.push(['genz', 'Gen Z']);
TSTYLE.genz = 'tag';
const SPARK = (c, s = 1) => `<path transform="scale(${s})" d="M12 0 C13 7 17 11 24 12 C17 13 13 17 12 24 C11 17 7 13 0 12 C7 11 11 7 12 0Z" fill="${c}"/>`;
TICON.genz = `<svg viewBox="0 0 24 24">${SPARK('#7c5cff')}</svg>`;
PARTS.genz = () => [`<svg viewBox="0 0 24 24">${SPARK('#7c5cff')}</svg>`, `<svg viewBox="0 0 24 24">${SPARK('#ff5fa2')}</svg>`, `<svg viewBox="0 0 24 24">${SPARK('#39d0ff')}</svg>`, '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="#d4ff3a" stroke="#1b1340" stroke-width="1.5"/></svg>'];

// ---------- Gen Z pieces ----------
const INK = '#1b1340';
const smiley = (x, y, r, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot})"><circle r="${r}" fill="#ffd84d" stroke="${INK}" stroke-width="2.4"/><circle cx="${-r * .33}" cy="${-r * .2}" r="${r * .11}" fill="${INK}"/><circle cx="${r * .33}" cy="${-r * .2}" r="${r * .11}" fill="${INK}"/><path d="M${-r * .45} ${r * .18} Q0 ${r * .65} ${r * .45} ${r * .18}" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`;
const heart = (x, y, s, c = '#ff5fa2', rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0 6 C-10 -2 -8 -12 0 -7 C8 -12 10 -2 0 6Z" fill="${c}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/></g>`;
const bolt = (x, y, s, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M2 -14 L-8 2 H0 L-3 14 L9 -3 H1Z" fill="#39d0ff" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/></g>`;
const bubble = (x, y, txt, c, rot = 0) => { const w = txt.length * 8.4 + 22; return `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="3" y="3" width="${w}" height="30" rx="15" fill="${INK}"/><rect width="${w}" height="30" rx="15" fill="${c}" stroke="${INK}" stroke-width="2"/><path d="M14 28 L10 38 L24 29" fill="${c}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><text x="${w / 2}" y="16" text-anchor="middle" dominant-baseline="central" font-family="'Bricolage Grotesque', 'Segoe UI', sans-serif" font-weight="800" font-size="14" fill="${INK}">${txt}</text></g>`; };
HELLO.genz = (txt) => {
  const fs = 40; _cv.font = `800 ${fs}px 'Bricolage Grotesque', 'Segoe UI', sans-serif`; const t = Math.max(_cv.measureText(txt).width, 150);
  const W = Math.round(t + 300), H = 270, bx = 34, by = 92, bw = t + 56, bh = 74;
  let checks = ''; for (let i = 0; i < Math.ceil(W / 14); i++) checks += `<rect x="${i * 14}" y="${H - 22 + (i % 2) * 7}" width="7" height="7" fill="${INK}"/><rect x="${i * 14 + 7}" y="${H - 22 + ((i + 1) % 2) * 7}" width="7" height="7" fill="${INK}"/>`;
  return svgS(W, H, `<defs><pattern id="gz21d" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="#cfc6ef"/></pattern></defs>
    <rect x="6" y="10" width="${W - 12}" height="${H - 40}" rx="28" fill="url(#gz21d)"/>
    <path d="M${W - 250} 40 c20 -18 40 18 60 0 s40 18 60 0 s40 18 60 0" stroke="#ff5fa2" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="${W - 70}" cy="182" r="34" fill="#c9b8ff" stroke="${INK}" stroke-width="2.4"/><circle cx="${W - 70}" cy="182" r="34" fill="url(#gz21d)"/>
    <g class="bob21" style="animation-delay:-.4s">${smiley(W - 76, 92, 32, -12)}</g>
    <g class="bob21" style="animation-delay:-1.4s">${bubble(W - 196, 150, 'no cap', '#d4ff3a', -6)}</g>
    <g class="bob21" style="animation-delay:-2.1s">${heart(W - 150, 66, 1.5, '#ff5fa2', 14)}</g>
    <g class="bob21" style="animation-delay:-.9s">${bolt(W - 30, 186, 1.6, 16)}</g>
    <g class="spk21">${['#7c5cff', '#ff5fa2', '#39d0ff', '#7c5cff'].map((c, i) => `<g transform="translate(${[bx - 18, bx + bw - 6, W - 120, bx + bw * .55][i]} ${[70, 186, 214, 30][i]}) scale(${[.9, .7, .8, .55][i]})" class="tw21" style="animation-delay:-${i * .5}s"><g transform="translate(-12 -12)">${SPARK(c)}</g></g>`).join('')}</g>
    <g transform="rotate(-3 ${bx + bw / 2} ${by + bh / 2})"><rect x="${bx + 7}" y="${by + 7}" width="${bw}" height="${bh}" rx="18" fill="${INK}"/><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="18" fill="#d4ff3a" stroke="${INK}" stroke-width="3"/>
      <text x="${bx + bw / 2}" y="${by + bh / 2 + 1}" text-anchor="middle" dominant-baseline="central" font-family="'Bricolage Grotesque', 'Segoe UI', sans-serif" font-weight="800" font-size="${fs}" fill="${INK}" letter-spacing="-1">${esc(txt)}</text></g>
    <g transform="translate(${bx + 10} ${by + bh + 26}) rotate(4)"><rect x="3" y="3" width="150" height="28" rx="6" fill="${INK}"/><rect width="150" height="28" rx="6" fill="#fff" stroke="${INK}" stroke-width="2"/><text x="75" y="15" text-anchor="middle" dominant-baseline="central" font-family="'Bricolage Grotesque', 'Segoe UI', sans-serif" font-weight="700" font-size="13" fill="#7c5cff">tax season era ✦</text></g>
    ${checks}`);
};
SCENE.genz = `<svg viewBox="0 0 520 90" preserveAspectRatio="xMaxYMax meet"><rect x="250" y="22" width="190" height="46" rx="14" fill="${INK}" transform="translate(5 5)"/><rect x="250" y="22" width="190" height="46" rx="14" fill="#d4ff3a" stroke="${INK}" stroke-width="2.5"/><text x="345" y="46" text-anchor="middle" dominant-baseline="central" font-family="'Bricolage Grotesque', sans-serif" font-weight="800" font-size="22" fill="${INK}">hello bestie</text>${smiley(478, 40, 22, -10)}${heart(215, 30, 1.3)}<g transform="translate(206 62) scale(.8)">${SPARK('#7c5cff')}</g></svg>`;

// ---------- menu band + page decor for the 2 new themes ----------
const _band21 = band20;
band20 = function (k) {
  _band21(k); const mb = $('.menubar'); if (!mb || k !== 'genz') return;
  const b = document.createElement('div'); b.className = 'band20 b-' + k; b.setAttribute('aria-hidden', 'true');
  if (k === 'genz') { const s = ['tax season era', 'no cap', 'W-2 check', 'slay the paperwork', 'main character energy', 'refund loading…', 'it’s giving organized', 'bestie, sign here'];
    const one = s.map((w) => `<span>${w}</span><i>${TICON.genz}</i>`).join(''); b.innerHTML = `<div class="mq21"><div class="mqin21">${one}${one}</div></div>`; }
  mb.appendChild(b);
};
const _applyTheme21 = V19.applyTheme;
V19.applyTheme = function () { _applyTheme21(); const k = THEME; if (k === 'genz' && $('.menubar') && !$('.menubar .band20')) band20(k); };
const _decor212 = decor20;
decor20 = function (k) {
  _decor212(k); if (!MOTION || PHONE) return;
  if (k === 'genz') document.body.insertAdjacentHTML('beforeend', [[2, 30, 'smile'], [3, 64, 'heart'], [96, 40, 'bolt'], [95, 76, 'spark']].map(([l, tp, w], i) => `<span class="dc20 stk21" style="left:${l}vw;top:${tp}vh;animation-delay:-${i * 1.3}s"><svg viewBox="-40 -40 80 80" width="64" height="64" overflow="visible">${w === 'smile' ? smiley(0, 0, 26, -12) : w === 'heart' ? heart(0, 0, 2.4, '#ff5fa2', 12) : w === 'bolt' ? bolt(0, 0, 2.2, 14) : `<g transform="translate(-24 -24) scale(2)">${SPARK('#7c5cff')}</g>`}</svg></span>`).join(''));
};

// =====================================================================
// v21.4/5: 10 theme (bỏ Y2K / Road Trip / Chinese / Aquarium) · thêm Thần đồng toán học + Universe · Zodiac + Aquarium vẽ lại
//        Quick reading (cung hoàng đạo / tuổi con giáp) thay "Bảng dán giấy" + "Trưa nay ăn gì"
//        Theme picker: bỏ chọn tab tên (mỗi theme 1 kiểu) + bỏ món ăn vặt
// =====================================================================
THEMES.length = 0;
[['autumn', 'Mùa thu'], ['cruise', 'Cruising'], ['bloom', 'Flowers'], ['pro', 'Professional'], ['genz', 'Gen-Z 1'], ['groovy', 'Gen-Z 2'], ['zodiac', 'Zodiac'], ['math', 'Thần đồng toán học'], ['universe', 'Universe']].forEach((t) => THEMES.push(t));
tabStyle = () => 'tag'; // v21.4: name tags always follow the theme
const tw21 = (txt, font) => { _cv.font = font; return Math.max(_cv.measureText(txt).width, 150); };
const S4 = (x, y, s, c, cls = '') => `<g class="${cls}"><g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -12 C1 -4 4 -1 12 0 C4 1 1 4 0 12 C-1 4 -4 1 -12 0 C-4 -1 -1 -4 0 -12Z" fill="${c}"/></g></g>`; // animation class on the outer <g>, SVG transform on the inner one
const fadeMask = (id, W, H) => `<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".05" stop-color="#fff"/><stop offset=".95" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="${id}" maskUnits="userSpaceOnUse"><rect width="${W}" height="${H}" fill="url(#${id}g)"/></mask>`;

// ---------- cung hoàng đạo ----------
const ZOD21 = { aries: ['♈', 'Bạch Dương', '21/3–19/4'], taurus: ['♉', 'Kim Ngưu', '20/4–20/5'], gemini: ['♊', 'Song Tử', '21/5–20/6'], cancer: ['♋', 'Cự Giải', '21/6–22/7'], leo: ['♌', 'Sư Tử', '23/7–22/8'], virgo: ['♍', 'Xử Nữ', '23/8–22/9'],
  libra: ['♎', 'Thiên Bình', '23/9–22/10'], scorpio: ['♏', 'Bọ Cạp', '23/10–21/11'], sagittarius: ['♐', 'Nhân Mã', '22/11–21/12'], capricorn: ['♑', 'Ma Kết', '22/12–19/1'], aquarius: ['♒', 'Bảo Bình', '20/1–18/2'], pisces: ['♓', 'Song Ngư', '19/2–20/3'] };
const CONST21 = { // constellation lines (0..100 box)
  aries: [[[5, 45], [35, 30], [60, 34], [85, 55]]], taurus: [[[5, 15], [30, 40], [50, 50], [70, 40], [92, 12]], [[50, 50], [58, 72], [75, 88]]],
  gemini: [[[20, 10], [22, 50], [25, 90]], [[60, 8], [62, 48], [66, 88]], [[22, 30], [62, 28]]], cancer: [[[50, 10], [50, 45], [20, 85]], [[50, 45], [82, 80]]],
  leo: [[[85, 22], [70, 10], [55, 18], [58, 35], [75, 40], [60, 60], [30, 62], [10, 80]], [[60, 60], [40, 86]]], virgo: [[[8, 20], [30, 35], [50, 30], [70, 45], [92, 40]], [[50, 30], [55, 60], [40, 86]], [[70, 45], [78, 75]]],
  libra: [[[50, 10], [20, 40], [80, 40], [50, 10]], [[20, 40], [15, 78]], [[80, 40], [85, 78]]], scorpio: [[[5, 20], [20, 30], [35, 35], [50, 45], [60, 60], [62, 78], [75, 88], [90, 80]]],
  sagittarius: [[[10, 86], [35, 60], [55, 50], [75, 30], [90, 14]], [[55, 50], [50, 25], [75, 30]], [[35, 60], [55, 76]]], capricorn: [[[10, 20], [40, 30], [88, 25], [70, 70], [40, 80], [10, 20]]],
  aquarius: [[[5, 30], [25, 45], [45, 30], [65, 45], [85, 30]], [[15, 65], [35, 80], [55, 65], [75, 80], [95, 65]]], pisces: [[[10, 80], [30, 55], [50, 45], [70, 20], [85, 10]], [[50, 45], [75, 60], [95, 70]]] };
window.MECHIPS21 = () => { const z = ZOD21[S.me && S.me.zodiac];
  return `<span class="mec21">${z ? `<span class="zc21" data-mec21 title="${z[2]}"><b>${z[0]}︎</b>${z[1]}</span>` : '<span class="zc21 em" data-mec21>✦ chọn cung</span>'}</span>`; };

// ---------- Quick reading (thay Bảng dán giấy + Trưa nay ăn gì) ----------
// v21.6: chỉ cung hoàng đạo, tử vi thật tiếng Anh (Free Horoscope API, server lấy mỗi sáng, cache DB). Không link, chỉ đọc.
const HORO21 = {};
function horo21(key) {
  const c = HORO21[key]; if (c && c.day === todayISO()) return c.v; if (c && c.loading) return null;
  const done = (v) => { HORO21[key] = { day: todayISO(), v }; const p = $('#pulse19'); if (p) { p.innerHTML = pulseInner(); bindPulse(); } };
  HORO21[key] = { loading: true }; api('GET', '/horoscope?sign=' + key).then(done).catch(() => done({ text: '' }));
  return null;
}
function readingCard21() {
  const z = S.me && S.me.zodiac;
  if (!z || !ZOD21[z]) return `<div class="pc19 rd21"><h3>Quick reading hôm nay</h3><div class="rde21"><div class="rdi21">${Object.values(ZOD21).slice(0, 6).map((x) => `<b>${x[0]}︎</b>`).join('')}</div><p>Chọn cung hoàng đạo để xem tử vi mỗi ngày.</p><button class="btn pri" data-mec21>Chọn cung hoàng đạo</button></div></div>`;
  const d = new Date(todayISO() + 'T12:00:00Z'), dl = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getUTCDay()] + ', ' + md(todayISO());
  const R = horo21(z);
  const body = !R ? '<div class="rdq21 ld">Đang lấy tử vi hôm nay…</div>' : R.text ? `<blockquote class="rdq21">${esc(R.text)}</blockquote>` : '<div class="rdq21 ld">Chưa lấy được tử vi hôm nay, lát nữa mở lại nhé.</div>';
  return `<div class="pc19 rd21"><h3>Quick reading hôm nay</h3><div class="rdh21"><span class="rdg21">${ZOD21[z][0]}︎</span><div><b>${ZOD21[z][1]}</b><small>${ZOD21[z][2]} · ${dl}</small></div></div>${body}<div class="rdf21"><span class="src">Free Horoscope API</span></div></div>`;
}
const _pulseInner214 = pulseInner;
pulseInner = function () { const h = _pulseInner214(); const i = h.indexOf('<div class="pc19">'); return (i > 0 ? h.slice(0, i) : h) + readingCard21(); };
const _pulseHtml214 = pulseHtml;
pulseHtml = function () { return _pulseHtml214().replace('class="pulse19"', 'class="pulse19 r21"'); };
document.addEventListener('click', (e) => { if (e.target.closest('[data-mec21]')) openTheme(); });

// ---------- Gen-Z 2 · Groovy (70s) ----------
const daisy21 = (x, y, s, face = true, cls = '') => `<g class="${cls}"><g transform="translate(${x} ${y}) scale(${s})">${[0, 40, 80, 120, 160, 200, 240, 280, 320].map((a) => `<ellipse cx="0" cy="-13" rx="6" ry="10" fill="#fff4e0" stroke="#7a4a2a" stroke-width="2" transform="rotate(${a})"/>`).join('')}<circle r="10" fill="#f2b134" stroke="#7a4a2a" stroke-width="2"/>${face ? '<circle cx="-3.5" cy="-2" r="1.4" fill="#7a4a2a"/><circle cx="3.5" cy="-2" r="1.4" fill="#7a4a2a"/><path d="M-4 3 q4 4 8 0" stroke="#7a4a2a" stroke-width="1.6" fill="none" stroke-linecap="round"/>' : ''}</g></g>`;
HELLO.groovy = (txt) => {
  const fs = 44, t = tw21(txt, `400 ${fs}px Pacifico, cursive`), R = t / 2 + 70, cx = R + 14, W = Math.round(cx + R + 150), H = 270, cy = 224;
  const arcs = ['#7a4a2a', '#c4532f', '#ef6f3c', '#f2b134', '#9bb07a'].map((c, i) => { const r = R - i * 20; return `<path d="M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}" stroke="${c}" stroke-width="20" fill="none"/>`; }).join('');
  return svgS(W, H, `${arcs}<rect x="0" y="${cy}" width="${W}" height="${H - cy}" fill="#fff4e0"/><path d="M0 ${cy + 2} ${Array.from({ length: Math.ceil(W / 40) + 1 }, () => 'q10 -8 20 0 t20 0').join(' ')}" stroke="#ef6f3c" stroke-width="3" fill="none"/>
    <text x="${cx}" y="${cy - 60}" text-anchor="middle" dominant-baseline="central" font-family="Pacifico, cursive" font-size="${fs}" fill="#fff4e0" stroke="#7a4a2a" stroke-width="6" paint-order="stroke">${esc(txt)}</text>
    ${daisy21(W - 70, 80, 1.6, true, 'bob21')}${daisy21(W - 150, 190, 1, true, 'bob21')}${daisy21(W - 40, 200, .8, false, 'bob21')}${daisy21(26, 50, .8, false, 'bob21')}
    <text x="${cx}" y="${cy + 22}" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="800" font-size="13" fill="#7a4a2a" letter-spacing="3">PEACE · LOVE · REFUNDS</text>`);
};
SCENE.groovy = `<svg viewBox="0 0 520 90" preserveAspectRatio="xMaxYMax meet">${['#7a4a2a', '#c4532f', '#ef6f3c', '#f2b134', '#9bb07a'].map((c, i) => `<path d="M${250 + i * 12} 90 A${110 - i * 12} ${110 - i * 12} 0 0 1 ${470 - i * 12} 90" stroke="${c}" stroke-width="11" fill="none"/>`).join('')}<text x="360" y="72" text-anchor="middle" font-family="Pacifico, cursive" font-size="22" fill="#fff4e0" stroke="#7a4a2a" stroke-width="4" paint-order="stroke">groovy</text>${daisy21(214, 40, .9)}${daisy21(496, 30, .7)}</svg>`;
TICON.groovy = `<svg viewBox="-24 -24 48 48">${daisy21(0, 0, 1, false)}</svg>`;
PARTS.groovy = () => [`<svg viewBox="-24 -24 48 48">${daisy21(0, 0, 1, false)}</svg>`];

// ---------- Zodiac (vẽ lại: tinh vân, vòng 12 cung, chòm sao của bạn, sao băng) ----------
function constellation21(k, x, y, s, gold = '#ffe08a') {
  const L = CONST21[k] || CONST21.leo; const pts = new Map();
  const lines = L.map((pl) => { pl.forEach((p) => pts.set(p.join(','), p)); return `<polyline points="${pl.map(([a, b]) => `${(a * s).toFixed(1)},${(b * s).toFixed(1)}`).join(' ')}" fill="none" stroke="${gold}" stroke-width="1.2" opacity=".75"/>`; }).join('');
  const stars = [...pts.values()].map(([a, b], i) => `<circle class="${i % 2 ? 'tw21' : ''}" style="animation-delay:-${i * .4}s" cx="${(a * s).toFixed(1)}" cy="${(b * s).toFixed(1)}" r="${i % 3 ? 2.4 : 3.4}" fill="#fff8e1" filter="url(#zgl21)"/>`).join('');
  return `<g transform="translate(${x} ${y})">${lines}${stars}</g>`;
}
HELLO.zodiac = (txt) => {
  const fs = 40, t = tw21(txt, `italic 600 ${fs}px Georgia, serif`), W = Math.round(t + 330), H = 280, z = (S.me && S.me.zodiac) || '', Z = ZOD21[z], wx = W - 132, wy = 140;
  let stars = ''; const r = rnd(7); for (let i = 0; i < 70; i++) stars += `<circle class="${i % 3 ? '' : 'tw21'}" style="animation-delay:-${(r() * 3).toFixed(1)}s" cx="${(r() * W).toFixed(0)}" cy="${(r() * H).toFixed(0)}" r="${(r() * 1.3 + .3).toFixed(1)}" fill="#fff6d8" opacity="${(.35 + r() * .65).toFixed(2)}"/>`;
  const keys = Object.keys(ZOD21);
  const ticks = Array.from({ length: 72 }, (_, i) => { const a = i * 5 * Math.PI / 180, r1 = i % 6 ? 104 : 100; return `<path d="M${(Math.cos(a) * r1).toFixed(1)} ${(Math.sin(a) * r1).toFixed(1)} L${(Math.cos(a) * 108).toFixed(1)} ${(Math.sin(a) * 108).toFixed(1)}" stroke="#e8c46a" stroke-width=".8" opacity=".6"/>`; }).join('');
  const wheel = keys.map((k, i) => { const a = (i * 30 - 90) * Math.PI / 180, on = z === k; return `<text x="${(Math.cos(a) * 86).toFixed(1)}" y="${(Math.sin(a) * 86).toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="${on ? 21 : 14}" fill="${on ? '#ffe08a' : '#a99cf0'}" ${on ? 'filter="url(#zgl21)"' : ''}>${ZOD21[k][0]}︎</text>`; }).join('');
  return svgS(W, H, `<defs><radialGradient id="zd21" cx=".75" cy=".35" r="1"><stop offset="0" stop-color="#363d8f"/><stop offset=".6" stop-color="#1b2152"/><stop offset="1" stop-color="#11153a"/></radialGradient>
      <radialGradient id="zn21a"><stop offset="0" stop-color="#c77dff" stop-opacity=".55"/><stop offset="1" stop-color="#c77dff" stop-opacity="0"/></radialGradient><radialGradient id="zn21b"><stop offset="0" stop-color="#4cc9f0" stop-opacity=".4"/><stop offset="1" stop-color="#4cc9f0" stop-opacity="0"/></radialGradient>
      <filter id="zgl21" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <clipPath id="zc21"><rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="28"/></clipPath></defs>
    <g clip-path="url(#zc21)"><rect width="${W}" height="${H}" fill="url(#zd21)"/><ellipse cx="${W * .3}" cy="${H * .8}" rx="${W * .35}" ry="90" fill="url(#zn21a)"/><ellipse cx="${W * .75}" cy="${H * .2}" rx="170" ry="80" fill="url(#zn21b)"/>${stars}
      <g class="shoot21"><path d="M0 0 L-70 -24" stroke="url(#zsh21)" stroke-width="2" stroke-linecap="round"/><circle r="2.2" fill="#fff"/></g>
      <linearGradient id="zsh21" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <g transform="translate(${wx} ${wy})"><circle r="112" fill="#0f1336" opacity=".35"/>${ticks}<circle r="98" fill="none" stroke="#e8c46a" stroke-width="1" opacity=".55"/><circle r="70" fill="none" stroke="#e8c46a" stroke-width="1" opacity=".45"/>
        <g class="spin21">${keys.map((_, i) => { const a = (i * 30 - 75) * Math.PI / 180; return `<path d="M${(Math.cos(a) * 70).toFixed(1)} ${(Math.sin(a) * 70).toFixed(1)} L${(Math.cos(a) * 98).toFixed(1)} ${(Math.sin(a) * 98).toFixed(1)}" stroke="#e8c46a" stroke-width=".8" opacity=".45"/>`; }).join('')}${wheel}</g>
        <circle r="62" fill="#161b46" stroke="#e8c46a" stroke-width="1.4"/>${constellation21(z || 'leo', -40, -40, .8)}</g>
      <g transform="translate(${W - 34} 34)"><circle r="18" fill="#ffe08a" opacity=".15"/><circle r="12" fill="#ffe08a"/><circle cx="5" cy="-4" r="11" fill="#1b2152"/></g></g>
    <text x="${44 + t / 2}" y="100" text-anchor="middle" dominant-baseline="central" font-family="Georgia, serif" font-style="italic" font-weight="600" font-size="${fs}" fill="#ffe08a" filter="url(#zgl21)">${esc(txt)}</text>
    <path d="M${44 + t * .15} 130 H${44 + t * .85}" stroke="#e8c46a" stroke-width="1" opacity=".55"/><g transform="translate(${44 + t / 2} 130)">${S4(0, 0, .45, '#ffe08a')}</g>
    <text x="${44 + t / 2}" y="160" text-anchor="middle" dominant-baseline="central" font-family="Georgia, serif" font-size="19" fill="#e4dbff">${Z ? `${Z[0]}︎ ${Z[1]}` : '✦ chọn cung trong Theme ✦'}</text>
    <text x="${44 + t / 2}" y="186" text-anchor="middle" dominant-baseline="central" font-family="Nunito, sans-serif" font-size="12" fill="#a99cf0" letter-spacing="2">${Z ? Z[2] : ''}</text>`);
};
SCENE.zodiac = `<svg viewBox="0 0 520 90" preserveAspectRatio="xMaxYMax meet"><defs><filter id="zgl21" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.2"/></filter></defs><rect x="180" y="4" width="336" height="82" rx="18" fill="#1b2152"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => `<text x="${206 + i * 26}" y="58" text-anchor="middle" font-size="15" fill="${i === 4 ? '#ffe08a' : '#a99cf0'}">${Object.values(ZOD21)[i][0]}︎</text>`).join('')}<polyline points="220,30 240,20 262,26 284,16" stroke="#ffe08a" fill="none" stroke-width="1"/><circle cx="490" cy="24" r="9" fill="#ffe08a"/><circle cx="495" cy="20" r="8.5" fill="#1b2152"/></svg>`;
TICON.zodiac = '<svg viewBox="0 0 24 24"><path d="M15 3 A9 9 0 1 0 21 15 A7 7 0 1 1 15 3Z" fill="#e8c46a"/><path d="M8 6 l.6 1.4 1.4.6-1.4.6L8 10l-.6-1.4L6 8l1.4-.6Z" fill="#7a6cf0"/></svg>';
PARTS.zodiac = () => [`<svg viewBox="-12 -12 24 24">${S4(0, 0, 1, '#e8c46a')}</svg>`, `<svg viewBox="-12 -12 24 24">${S4(0, 0, .7, '#b9a8ff')}</svg>`];

// ---------- Thần đồng toán học (bảng đen, phấn, công thức, thước, compa) ----------
const MSYM = ['π', '∑', '√', '∞', '∫', '%', 'Δ', 'x²', '÷', '≈'];
HELLO.math = (txt) => {
  const fs = 40, t = tw21(txt, `400 ${fs}px 'Gloria Hallelujah', cursive`), W = Math.round(t + 330), H = 280, bw = W - 20;
  const chalk = (x, y, rot, txt2, o = .8, sz = 16) => `<text x="${x}" y="${y}" transform="rotate(${rot} ${x} ${y})" font-family="'Gloria Hallelujah', cursive" font-size="${sz}" fill="#f4f1e6" opacity="${o}">${txt2}</text>`;
  return svgS(W, H, `<defs><linearGradient id="mb21" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f5d50"/><stop offset="1" stop-color="#244a40"/></linearGradient><pattern id="md21" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r=".6" fill="#fff" opacity=".07"/></pattern></defs>
    <rect x="6" y="8" width="${bw}" height="222" rx="6" fill="#9a6b43"/><rect x="18" y="20" width="${bw - 24}" height="198" rx="3" fill="url(#mb21)"/><rect x="18" y="20" width="${bw - 24}" height="198" fill="url(#md21)"/>
    <path d="M40 200 q${bw * .2} -8 ${bw * .4} -2" stroke="#f4f1e6" stroke-width="10" opacity=".05" stroke-linecap="round"/>
    <text x="${40 + t / 2}" y="98" text-anchor="middle" dominant-baseline="central" font-family="'Gloria Hallelujah', cursive" font-size="${fs}" fill="#fbfaf3">${esc(txt)}</text>
    <path d="M${40} 128 q${t * .5} 8 ${t} -2" stroke="#f2c94c" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9"/>
    ${chalk(44, 60, -3, '∫ W-2 dx = refund ✓', .85, 15)}${chalk(46, 172, 2, 'e<tspan baseline-shift="super" font-size="11">iπ</tspan> + 1 = 0', .8, 17)}${chalk(44 + t * .55, 182, -2, 'a² + b² = c²', .75, 15)}
    ${chalk(W - 210, 56, 4, '1040 + 1099', .8, 15)}${chalk(W - 206, 78, 4, '≈ $$$', .8, 15)}
    <g transform="translate(${W - 130} 140)" stroke="#f4f1e6" stroke-width="1.8" fill="none" opacity=".85"><path d="M-50 40 L30 40 L-50 -26Z"/><path d="M-40 40 v-10 h10"/>${chalk(-70, 10, 0, 'a', .8, 13)}${chalk(-14, 58, 0, 'b', .8, 13)}${chalk(-2, 0, 0, 'c', .8, 13)}<circle cx="70" cy="-10" r="24"/><path d="M70 -10 L92 -18"/>${chalk(74, -20, 0, 'r', .8, 12)}</g>
    <g class="bob21" style="animation-delay:-1.5s"><g transform="translate(${W - 60} 44) rotate(18)"><path d="M0 0 L-12 52 M0 0 L12 52" stroke="#c9cfd6" stroke-width="3" stroke-linecap="round"/><circle r="5" fill="#e5484d"/><path d="M12 52 l-2 8" stroke="#555" stroke-width="2"/></g></g>
    <rect x="10" y="230" width="${bw - 8}" height="10" rx="2" fill="#7a5233"/>
    <rect x="${W * .3}" y="223" width="34" height="9" rx="2" fill="#f4f1e6"/><rect x="${W * .3 + 44}" y="225" width="22" height="7" rx="2" fill="#f2c94c"/><rect x="${W * .3 + 76}" y="225" width="18" height="7" rx="2" fill="#ec7fa9"/>
    <g transform="translate(${W * .62} 214)"><rect width="46" height="16" rx="3" fill="#3d85c6"/><rect y="11" width="46" height="5" rx="2" fill="#2b2b2b"/></g>
    <g transform="translate(30 250)">${Array.from({ length: Math.floor((W - 60) / 10) }, (_, i) => `<path d="M${i * 10} 0 v${i % 5 ? 6 : 11}" stroke="#7a6a3a" stroke-width="1"/>`).join('')}<rect x="-6" y="-4" width="${W - 48}" height="20" rx="3" fill="#f2d478" opacity=".55"/></g>`);
};
SCENE.math = `<svg viewBox="0 0 520 90" preserveAspectRatio="xMaxYMax meet"><rect x="190" y="6" width="320" height="76" rx="4" fill="#9a6b43"/><rect x="198" y="12" width="304" height="62" fill="#2f5d50"/><text x="350" y="40" text-anchor="middle" dominant-baseline="central" font-family="'Gloria Hallelujah', cursive" font-size="20" fill="#fbfaf3">π ≈ 3.14 ✓</text><text x="230" y="64" font-family="'Gloria Hallelujah', cursive" font-size="12" fill="#f4f1e6" opacity=".8">a²+b²=c²</text><text x="420" y="64" font-family="'Gloria Hallelujah', cursive" font-size="12" fill="#f2c94c">∑ refund</text></svg>`;
TICON.math = '<svg viewBox="0 0 24 24"><text x="12" y="13" text-anchor="middle" dominant-baseline="central" font-family="Georgia, serif" font-size="20" font-weight="700" fill="#2f5d50">π</text></svg>';
PARTS.math = () => MSYM.map((c, i) => `<svg viewBox="0 0 24 24"><text x="12" y="13" text-anchor="middle" dominant-baseline="central" font-family="Georgia, serif" font-size="18" font-weight="700" fill="${['#2f5d50', '#3d85c6', '#e5484d', '#c9a227'][i % 4]}">${c}</text></svg>`);

// ---------- Universe (vũ trụ: tinh vân, hành tinh có vành, tên lửa, sao chổi) ----------
const planet21 = (x, y, r, a, b, ring = false, cls = '') => `<g class="${cls}"><g transform="translate(${x} ${y})">${ring ? `<ellipse rx="${r * 1.9}" ry="${r * .45}" fill="none" stroke="#f3d7a1" stroke-width="${r * .18}" opacity=".85" transform="rotate(-18)" stroke-dasharray="${r * 3} ${r * 9}" stroke-dashoffset="${r * 3}"/>` : ''}<defs><radialGradient id="pl${x | 0}${y | 0}" cx=".35" cy=".35"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs><circle r="${r}" fill="url(#pl${x | 0}${y | 0})"/><path d="M${-r * .8} ${-r * .2} q${r * .8} ${r * .25} ${r * 1.6} 0" stroke="#fff" stroke-width="${r * .08}" fill="none" opacity=".25"/>${ring ? `<ellipse rx="${r * 1.9}" ry="${r * .45}" fill="none" stroke="#f3d7a1" stroke-width="${r * .18}" opacity=".85" transform="rotate(-18)" stroke-dasharray="${r * 6} ${r * 6}"/>` : ''}</g></g>`;
const rocket21 = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s}) rotate(45)"><path d="M0 -26 C10 -16 10 8 6 16 H-6 C-10 8 -10 -16 0 -26Z" fill="#f4f6fb" stroke="#3b3f6b" stroke-width="1.6"/><circle cy="-8" r="4.6" fill="#4cc9f0" stroke="#3b3f6b" stroke-width="1.4"/><path d="M-6 6 L-14 18 L-6 15Z M6 6 L14 18 L6 15Z" fill="#ff5d73" stroke="#3b3f6b" stroke-width="1.4"/><path class="flm21" d="M-4 16 Q0 32 4 16Z" fill="#ffb84d"/></g>`;
HELLO.universe = (txt) => {
  const fs = 42, t = tw21(txt, `800 ${fs}px Montserrat, sans-serif`), W = Math.round(t + 330), H = 280;
  let stars = ''; const r = rnd(11); for (let i = 0; i < 90; i++) stars += `<circle class="${i % 4 ? '' : 'tw21'}" style="animation-delay:-${(r() * 3).toFixed(1)}s" cx="${(r() * W).toFixed(0)}" cy="${(r() * H).toFixed(0)}" r="${(r() * 1.3 + .3).toFixed(1)}" fill="${i % 7 ? '#fff' : '#9fe8ff'}" opacity="${(.4 + r() * .6).toFixed(2)}"/>`;
  return svgS(W, H, `<defs><linearGradient id="un21" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b0f2e"/><stop offset=".6" stop-color="#1c1150"/><stop offset="1" stop-color="#3a1260"/></linearGradient>
      <radialGradient id="unb21"><stop offset="0" stop-color="#ff5fa2" stop-opacity=".5"/><stop offset="1" stop-color="#ff5fa2" stop-opacity="0"/></radialGradient><radialGradient id="unc21"><stop offset="0" stop-color="#4cc9f0" stop-opacity=".45"/><stop offset="1" stop-color="#4cc9f0" stop-opacity="0"/></radialGradient>
      <linearGradient id="unt21" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#9fe8ff"/><stop offset="1" stop-color="#d7b8ff"/></linearGradient>
      <filter id="ungl21" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><clipPath id="unk21"><rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="28"/></clipPath>
      <linearGradient id="unsh21" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#9fe8ff" stop-opacity="0"/></linearGradient></defs>
    <g clip-path="url(#unk21)"><rect width="${W}" height="${H}" fill="url(#un21)"/><ellipse cx="${W * .25}" cy="${H * .75}" rx="${W * .3}" ry="90" fill="url(#unb21)"/><ellipse cx="${W * .7}" cy="${H * .3}" rx="200" ry="100" fill="url(#unc21)"/>${stars}
      <g transform="translate(${W * .55} ${H * .78})" opacity=".55">${[0, 1, 2, 3].map((i) => `<path d="M0 0 C${30 + i * 18} ${-10 - i * 6} ${50 + i * 20} ${20 + i * 10} 0 ${40 + i * 12}" stroke="#d7b8ff" stroke-width="1" fill="none" transform="rotate(${i * 90})"/>`).join('')}<circle r="4" fill="#fff"/></g>
      ${planet21(W - 110, 92, 38, '#ffd59e', '#e0884a', true, 'bob21')}${planet21(W - 40, 210, 18, '#9fe8ff', '#3a6fd8', false, 'bob21')}${planet21(54, 230, 12, '#d7b8ff', '#7b4ee0')}
      <g class="shoot21"><path d="M0 0 L-80 -26" stroke="url(#unsh21)" stroke-width="2.4" stroke-linecap="round"/><circle r="2.6" fill="#fff"/></g>
      <g class="fly21">${rocket21(0, 0, 1)}</g></g>
    <text x="${40 + t / 2}" y="112" text-anchor="middle" dominant-baseline="central" font-family="Montserrat, sans-serif" font-weight="800" font-size="${fs}" fill="url(#unt21)" filter="url(#ungl21)" letter-spacing="-.5">${esc(txt)}</text>
    <text x="${40 + t / 2}" y="152" text-anchor="middle" dominant-baseline="central" font-family="Montserrat, sans-serif" font-weight="600" font-size="12" fill="#b9c2ff" letter-spacing="4">TO TAX DAY AND BEYOND</text>`);
};
SCENE.universe = `<svg viewBox="0 0 520 90" preserveAspectRatio="xMaxYMax meet"><rect x="170" y="4" width="346" height="82" rx="18" fill="#1c1150"/>${[...Array(30)].map((_, i) => `<circle cx="${180 + (i * 53) % 330}" cy="${10 + (i * 29) % 70}" r="${.6 + (i % 3) * .5}" fill="#fff"/>`).join('')}${planet21(440, 44, 20, '#ffd59e', '#e0884a', true)}${planet21(250, 60, 10, '#9fe8ff', '#3a6fd8')}${rocket21(340, 40, .8)}</svg>`;
TICON.universe = '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="11" ry="3.4" fill="none" stroke="#e0a75e" stroke-width="1.6" transform="rotate(-18 12 12)"/><circle cx="12" cy="12" r="6" fill="#7b4ee0"/><circle cx="10" cy="10" r="2" fill="#d7b8ff"/></svg>';
PARTS.universe = () => [`<svg viewBox="-12 -12 24 24">${S4(0, 0, 1, '#9fe8ff')}</svg>`, `<svg viewBox="-12 -12 24 24">${S4(0, 0, .8, '#d7b8ff')}</svg>`, '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="#ffd59e"/></svg>'];

// ---------- Universe v21.5 (ma mị: tinh vân turbulence, lỗ đen, hành tinh khí khổng lồ có vành, hành tinh đỏ, trái đất + mặt trăng) ----------
const UDEF = (W, H) => `<linearGradient id="u5bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#05061a"/><stop offset=".55" stop-color="#120a33"/><stop offset="1" stop-color="#25083d"/></linearGradient>
  <filter id="u5neb" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".008 .014" numOctaves="5" seed="8"/><feColorMatrix type="matrix" values="0 0 0 0 .78  0 0 0 0 .22  0 0 0 0 .95  0 0 0 2.6 -1.25"/><feGaussianBlur stdDeviation="2"/></filter>
  <filter id="u5neb2" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".011 .007" numOctaves="4" seed="21"/><feColorMatrix type="matrix" values="0 0 0 0 .18  0 0 0 0 .78  0 0 0 0 1  0 0 0 2.4 -1.3"/><feGaussianBlur stdDeviation="2"/></filter>
  <filter id="u5glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="u5soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>
  <linearGradient id="u5band" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6d7a8"/><stop offset=".12" stop-color="#d99b5b"/><stop offset=".22" stop-color="#f3c98e"/><stop offset=".34" stop-color="#b8743f"/><stop offset=".45" stop-color="#eab57c"/><stop offset=".56" stop-color="#c98550"/><stop offset=".63" stop-color="#f7dcb3"/><stop offset=".75" stop-color="#a9653a"/><stop offset=".86" stop-color="#e2a86d"/><stop offset="1" stop-color="#8e4f2c"/></linearGradient>
  <radialGradient id="u5shade" cx=".3" cy=".28" r=".85"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#05061a" stop-opacity=".85"/></radialGradient>
  <linearGradient id="u5ring" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9d2ff" stop-opacity="0"/><stop offset=".2" stop-color="#f6e3c6"/><stop offset=".5" stop-color="#fff4dc"/><stop offset=".8" stop-color="#c9a6ff"/><stop offset="1" stop-color="#e9d2ff" stop-opacity="0"/></linearGradient>
  <radialGradient id="u5mars" cx=".35" cy=".3"><stop offset="0" stop-color="#ffb08a"/><stop offset=".6" stop-color="#d4532e"/><stop offset="1" stop-color="#5e1a14"/></radialGradient>
  <radialGradient id="u5earth" cx=".35" cy=".3"><stop offset="0" stop-color="#9fe8ff"/><stop offset=".55" stop-color="#2f7fd6"/><stop offset="1" stop-color="#0b2257"/></radialGradient>
  <radialGradient id="u5disk"><stop offset=".42" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#fff1c9"/><stop offset=".62" stop-color="#ff9f43"/><stop offset=".8" stop-color="#c2185b" stop-opacity=".55"/><stop offset="1" stop-color="#7b1fa2" stop-opacity="0"/></radialGradient>
  <linearGradient id="u5txt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#bff3ff"/><stop offset=".75" stop-color="#e3c4ff"/><stop offset="1" stop-color="#ffc6ea"/></linearGradient>
  <linearGradient id="u5sh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#9fe8ff" stop-opacity="0"/></linearGradient>
  <clipPath id="u5clip"><rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="30"/></clipPath><clipPath id="u5gc"><circle r="54"/></clipPath>
  <clipPath id="u5back"><rect x="-200" y="-200" width="400" height="200"/></clipPath><clipPath id="u5front"><rect x="-200" y="0" width="400" height="200"/></clipPath>`;
const ustars = (W, H, n, seed) => { const r = rnd(seed); let s = ''; for (let i = 0; i < n; i++) { const big = i % 17 === 0; const x = (r() * W).toFixed(0), y = (r() * H).toFixed(0);
  s += big ? `<g class="tw21" style="animation-delay:-${(r() * 3).toFixed(1)}s"><circle cx="${x}" cy="${y}" r="1.8" fill="#fff" filter="url(#u5glow)"/><path d="M${x} ${y - 7} V${+y + 7} M${x - 7} ${y} H${+x + 7}" stroke="#fff" stroke-width=".6" opacity=".8"/></g>`
    : `<circle class="${i % 5 ? '' : 'tw21'}" style="animation-delay:-${(r() * 3).toFixed(1)}s" cx="${x}" cy="${y}" r="${(r() * 1.1 + .25).toFixed(2)}" fill="${['#fff', '#cfe9ff', '#ffe0f5', '#fff'][i % 4]}" opacity="${(.35 + r() * .65).toFixed(2)}"/>`; } return s; };
const gasGiant = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <g transform="rotate(-16)"><ellipse rx="112" ry="26" fill="none" stroke="url(#u5ring)" stroke-width="13" opacity=".9" clip-path="url(#u5back)"/><ellipse rx="96" ry="21" fill="none" stroke="#fff3da" stroke-width="2" opacity=".5" clip-path="url(#u5back)"/></g>
  <circle r="62" fill="#ffb86b" opacity=".35" filter="url(#u5soft)"/>
  <g clip-path="url(#u5gc)"><rect x="-60" y="-60" width="120" height="120" fill="url(#u5band)" transform="rotate(-16)"/><ellipse cx="18" cy="16" rx="13" ry="7" fill="#b3542e" opacity=".85" transform="rotate(-16)"/><ellipse cx="18" cy="16" rx="7" ry="3.5" fill="#e2875a" transform="rotate(-16)"/><circle r="54" fill="url(#u5shade)"/></g>
  <circle r="54" fill="none" stroke="#ffe3bd" stroke-width="1.5" opacity=".6"/>
  <g transform="rotate(-16)"><ellipse rx="112" ry="26" fill="none" stroke="url(#u5ring)" stroke-width="13" opacity=".95" clip-path="url(#u5front)"/><ellipse rx="96" ry="21" fill="none" stroke="#fff3da" stroke-width="2" opacity=".6" clip-path="url(#u5front)"/><ellipse rx="124" ry="29" fill="none" stroke="#d9b8ff" stroke-width="1.2" opacity=".5" clip-path="url(#u5front)"/></g></g>`;
const blackHole = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><circle r="70" fill="url(#u5disk)" opacity=".55" filter="url(#u5soft)"/>
  <g class="spin21"><ellipse rx="64" ry="14" fill="none" stroke="#ffcf7a" stroke-width="6" opacity=".9" filter="url(#u5glow)"/><ellipse rx="52" ry="10" fill="none" stroke="#fff6dc" stroke-width="2" opacity=".9"/></g>
  <path d="M-30 -2 A30 30 0 0 1 30 -2" fill="none" stroke="#ffcf7a" stroke-width="5" opacity=".85" filter="url(#u5glow)"/><circle r="24" fill="#000"/><circle r="25" fill="none" stroke="#ffe7b3" stroke-width="1.6" opacity=".9"/>
  <path d="M-64 2 A64 14 0 0 0 64 2" fill="none" stroke="#ffd98f" stroke-width="5" opacity=".95" filter="url(#u5glow)"/></g>`;
const mars = (x, y, r) => `<g transform="translate(${x} ${y})"><circle r="${r + 6}" fill="#ff7b54" opacity=".25" filter="url(#u5soft)"/><circle r="${r}" fill="url(#u5mars)"/><circle cx="${-r * .3}" cy="${r * .1}" r="${r * .16}" fill="#8e2c1d" opacity=".55"/><circle cx="${r * .25}" cy="${-r * .3}" r="${r * .1}" fill="#8e2c1d" opacity=".5"/><circle cx="${r * .2}" cy="${r * .4}" r="${r * .08}" fill="#8e2c1d" opacity=".45"/></g>`;
const earth = (x, y, r) => `<g transform="translate(${x} ${y})"><circle r="${r + 5}" fill="#5ec8ff" opacity=".35" filter="url(#u5soft)"/><circle r="${r}" fill="url(#u5earth)"/><path d="M${-r * .5} ${-r * .3} q${r * .3} ${-r * .3} ${r * .6} 0 q${-r * .1} ${r * .4} ${-r * .6} 0Z M${r * .1} ${r * .2} q${r * .3} 0 ${r * .45} ${r * .3} q${-r * .4} ${r * .1} ${-r * .45} ${-r * .3}Z" fill="#5fc27a" opacity=".85"/><path d="M${-r * .8} ${r * .1} q${r * .8} ${-r * .3} ${r * 1.5} 0" stroke="#fff" stroke-width="${r * .12}" fill="none" opacity=".55" stroke-linecap="round"/><circle r="${r}" fill="none" stroke="#bff3ff" stroke-width="1.2" opacity=".7"/>
  <g class="orb21"><circle cx="${r * 1.9}" cy="0" r="${r * .27}" fill="#d9dde6"/></g></g>`;
HELLO.universe = (txt) => {
  const fs = 46, t = tw21(txt, `800 ${fs}px Montserrat, sans-serif`), W = Math.round(t + 400), H = 300, tx = 44 + t / 2;
  return svgS(W, H, `<defs>${UDEF(W, H)}</defs><g clip-path="url(#u5clip)">
      <rect width="${W}" height="${H}" fill="url(#u5bg)"/>
      <rect width="${W}" height="${H}" filter="url(#u5neb)" opacity=".75"/><rect width="${W}" height="${H}" filter="url(#u5neb2)" opacity=".55"/>
      <ellipse cx="${W * .3}" cy="${H * .85}" rx="${W * .4}" ry="90" fill="#ff3fa4" opacity=".18" filter="url(#u5soft)"/><ellipse cx="${W * .72}" cy="${H * .2}" rx="220" ry="110" fill="#38d6ff" opacity=".12" filter="url(#u5soft)"/>
      ${ustars(W, H, 170, 11)}
      ${blackHole(W * .44, H * .8, .85)}
      ${mars(56, 60, 15)}
      <g class="bob21" style="animation-duration:7s">${gasGiant(W - 150, 120, 1)}</g>
      ${earth(W - 44, H - 52, 20)}
      <g class="shoot21"><path d="M0 0 L-90 -28" stroke="url(#u5sh)" stroke-width="2.6" stroke-linecap="round"/><circle r="2.8" fill="#fff" filter="url(#u5glow)"/></g>
      <g class="fly21" style="animation-duration:16s">${rocket21(0, 0, .9)}</g></g>
    <rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="30" fill="none" stroke="#7b4ee0" stroke-width="1.5" opacity=".6"/>
    <text x="${tx}" y="118" text-anchor="middle" dominant-baseline="central" font-family="Montserrat, sans-serif" font-weight="800" font-size="${fs}" fill="#bff3ff" opacity=".55" filter="url(#u5soft)">${esc(txt)}</text>
    <text x="${tx}" y="118" text-anchor="middle" dominant-baseline="central" font-family="Montserrat, sans-serif" font-weight="800" font-size="${fs}" fill="url(#u5txt)" letter-spacing="-.5">${esc(txt)}</text>
    <text x="${tx}" y="160" text-anchor="middle" dominant-baseline="central" font-family="Montserrat, sans-serif" font-weight="600" font-size="12" fill="#c9c2ff" letter-spacing="5">TO TAX DAY AND BEYOND</text>`);
};
SCENE.universe = `<svg viewBox="0 0 520 90" preserveAspectRatio="xMaxYMax meet"><defs>${UDEF(520, 90).replace('<clipPath id="u5clip"><rect x="4" y="4" width="512" height="82" rx="30"/></clipPath>', '')}</defs><rect x="150" y="2" width="366" height="86" rx="16" fill="url(#u5bg)"/><rect x="150" y="2" width="366" height="86" rx="16" filter="url(#u5neb)" opacity=".7"/>${[...Array(40)].map((_, i) => `<circle cx="${160 + (i * 53) % 350}" cy="${8 + (i * 29) % 76}" r="${.5 + (i % 3) * .45}" fill="#fff"/>`).join('')}<g transform="translate(445 46) scale(.42)">${gasGiant(0, 0, 1)}</g>${blackHole(260, 60, .3)}</svg>`;

// ---------- menu bands for groovy / zodiac / math / universe ----------
const _band214 = band20;
band20 = function (k) {
  _band214(k); const mb = $('.menubar'); if (!mb || !['groovy', 'zodiac', 'math', 'universe'].includes(k)) return;
  const b = document.createElement('div'); b.className = 'band20 b-' + k; b.setAttribute('aria-hidden', 'true'); const r = rnd(5); let h = '';
  if (k === 'groovy') h = '<div class="gv21"></div>';
  if (k === 'zodiac') { const g = Object.values(ZOD21).map((z) => z[0]); for (let i = 0; i < 40; i++) h += `<span class="tw21b" style="left:${(i / 40 * 100 + r() * 1.5).toFixed(1)}%;top:${(3 + r() * 20).toFixed(0)}px;animation-delay:-${(r() * 3).toFixed(1)}s;color:${i % 4 ? '#fff6d8' : '#e8c46a'};font-size:${i % 4 ? 6 + r() * 4 : 13}px">${i % 4 ? '●' : g[i % 12] + '︎'}</span>`; h += '<span class="shb21"></span>'; }
  if (k === 'math') { const eq = ['π ≈ 3.14159', 'a² + b² = c²', '∑ refunds', 'e^iπ + 1 = 0', '1040 ✓', '√144 = 12', '∞ coffee', 'Δ = b² − 4ac', 'W-2 + 1099', '7 × 8 = 56'];
    h = `<div class="rul21"></div><div class="mq21m"><div class="mqin21m">${[...eq, ...eq].map((e) => `<span>${e}</span>`).join('')}</div></div>`; }
  if (k === 'universe') { for (let i = 0; i < 46; i++) h += `<span class="tw21b" style="left:${(i / 46 * 100 + r() * 1.5).toFixed(1)}%;top:${(3 + r() * 24).toFixed(0)}px;animation-delay:-${(r() * 3).toFixed(1)}s;color:${i % 5 ? '#fff' : '#9fe8ff'};font-size:${4 + r() * 5}px">●</span>`;
    h += `<span class="pl21b" style="left:18%"><svg viewBox="-30 -20 60 40" width="34">${planet21(0, 0, 9, '#ffd59e', '#e0884a', true)}</svg></span><span class="pl21b" style="left:71%;top:4px"><svg viewBox="-12 -12 24 24" width="14">${planet21(0, 0, 8, '#9fe8ff', '#3a6fd8')}</svg></span><span class="rk21"><svg viewBox="-20 -30 40 60" width="26">${rocket21(0, 0, .8)}</svg></span>`; }
  b.innerHTML = h; mb.appendChild(b);
};
const _applyTheme214 = V19.applyTheme;
V19.applyTheme = function () { _applyTheme214(); const k = THEME; if (['groovy', 'zodiac', 'math', 'universe'].includes(k) && $('.menubar') && !$('.menubar .band20')) band20(k); };

// ---------- theme picker: theme + cung hoàng đạo (v21.6: bỏ tab tên, món ăn vặt, tuổi) ----------
openTheme = function () {
  const m = $('#modalHost'); const pick = { theme: THEME, motion: MOTION, zodiac: (S.me && S.me.zodiac) || '' };
  const draw = () => {
    m.innerHTML = `<div class="modal"><div class="box th20 th21"><h3>Theme</h3>
      <div class="pay19"><div class="thgrid">${THEMES.map(([k, n]) => `<button type="button" class="thcard th-${k} ${pick.theme === k ? 'on' : ''}" data-th="${k}"><span class="thprev">${SCENE[k] || ''}</span><b><span class="thic">${TICON[k]}</span>${n}</b></button>`).join('')}</div></div>
      <h4>Cung hoàng đạo</h4><div class="zdg21">${Object.entries(ZOD21).map(([k, z]) => `<button type="button" class="${pick.zodiac === k ? 'on' : ''}" data-zd="${k}"><b>${z[0]}︎</b><span>${z[1]}</span><small>${z[2]}</small></button>`).join('')}</div>
      <label class="small" style="display:flex;gap:6px;align-items:center;margin-top:12px"><input type="checkbox" id="th20m" ${pick.motion ? 'checked' : ''} style="width:auto"> Animation</label>
      <div class="err" id="thErr"></div><div class="row-end"><button class="btn" id="thC">Hủy</button><button class="btn pri" id="thS">Lưu</button></div></div></div>`;
    m.firstChild.onclick = (e) => { if (e.target === m.firstChild) { m.innerHTML = ''; return; } const b = e.target.closest('[data-th],[data-zd]'); if (!b) return;
      if (b.dataset.th) pick.theme = b.dataset.th; if (b.dataset.zd) pick.zodiac = pick.zodiac === b.dataset.zd ? '' : b.dataset.zd;
      const y = m.querySelector('.box').scrollTop; draw(); m.querySelector('.box').scrollTop = y; };
    $('#th20m').onchange = (e) => { pick.motion = e.target.checked; };
    $('#thC').onclick = () => { m.innerHTML = ''; };
    $('#thS').onclick = function () { this.disabled = true;
      api('PUT', '/prefs', { theme: pick.theme, zodiac: pick.zodiac }).then(() => {
        Object.assign(S.me, { theme: pick.theme, zodiac: pick.zodiac }); MOTION = pick.motion; try { localStorage.setItem('tax_motion20', MOTION ? '1' : '0'); } catch (e) { /* ignore */ }
        m.innerHTML = ''; setTheme(pick.theme); render(); toast('Đã lưu theme'); }).catch((e) => { this.disabled = false; $('#thErr').textContent = e.message; }); };
  };
  draw();
};

// ---------- v21.6: dải chạy dưới menu cho Cruising / Pro / Zodiac / Universe ----------
const _band216 = band20;
band20 = function (k) {
  _band216(k); const mb = $('.menubar'); if (!mb) return;
  if (k === 'cruise' || k === 'pro') {
    const b = document.createElement('div'); b.className = 'band20 b-' + k; b.setAttribute('aria-hidden', 'true');
    if (k === 'cruise') {
      const sail = (c, w) => `<svg viewBox="0 0 40 34" width="${w}"><path d="M20 2 V26 M20 4 L34 24 H20Z" fill="${c}" stroke="#3f5a6e" stroke-width="1.2" stroke-linejoin="round"/><path d="M20 8 L9 24 H20Z" fill="#fff" stroke="#3f5a6e" stroke-width="1.2" stroke-linejoin="round"/><path d="M5 26 H36 L32 32 H9Z" fill="#3f5a6e"/></svg>`;
      const ship = '<svg viewBox="0 0 60 30" width="54"><path d="M4 20 H56 L50 28 H10Z" fill="#3f5a6e"/><rect x="14" y="12" width="32" height="8" rx="1.5" fill="#f4f1ec" stroke="#8fa9b8"/><rect x="20" y="6" width="18" height="6" rx="1" fill="#f4f1ec" stroke="#8fa9b8"/><rect x="38" y="2" width="5" height="9" fill="#c9575b"/>' + [0, 1, 2, 3, 4].map((i) => `<circle cx="${18 + i * 6}" cy="16" r="1.3" fill="#8fa9b8"/>`).join('') + '</svg>';
      const gull = '<svg viewBox="0 0 24 10" width="18"><path d="M1 7 q5 -6 11 0 q5 -6 11 0" stroke="#5b7d93" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
      b.innerHTML = `<div class="flg6"></div><span class="sail6">${sail('#f4f1ec', 36)}</span><span class="sail6 s3" style="animation-delay:-14s">${sail('#f6d2b8', 28)}</span><span class="sail6 s2">${ship}</span><span class="gull6">${gull}</span><span class="gull6" style="animation-delay:-11s;top:22px">${gull}</span>`;
    } else {
      const T = taxDay20(); const items = [`<b>Tax day</b> ${mdy(T.d)}`, `<b>${T.n}</b> days to go`, '1040 · W-2 · 1099 · Schedule C', 'First Source Multi Agency', `<b>E-file</b> · <b>Refund</b> · <b>Accepted</b>`, 'Precision · Discretion · Service', 'Westminster, California'];
      const one = items.map((x) => `<span>${x}</span><i>◆</i>`).join(''); b.innerHTML = `<div class="mq6"><div>${one}${one}${one}</div></div>`;
    }
    mb.appendChild(b); return;
  }
  const b = mb.querySelector('.band20.b-' + k); if (!b) return;
  if (k === 'zodiac' && !b.querySelector('.ss6')) { // v21.7: sao băng liên tục + ký hiệu 12 cung bay lên lấp lánh
    const g = Object.values(ZOD21).map((z) => z[0]); let h = '';
    for (let i = 0; i < 6; i++) h += `<span class="ss6" style="left:${12 + i * 16}%;animation-delay:-${(i * 1.15).toFixed(2)}s;animation-duration:${(3.4 + (i % 3) * .6).toFixed(1)}s"></span>`;
    for (let i = 0; i < 16; i++) h += `<span class="zg6" style="left:${(i * 6.3 + 2).toFixed(1)}%;animation-delay:-${(i * .55).toFixed(2)}s;animation-duration:${(4 + (i % 4) * .7).toFixed(1)}s">${g[i % 12]}︎</span>`;
    b.insertAdjacentHTML('beforeend', h); }
  if (k === 'universe' && !b.querySelector('.sf6')) b.insertAdjacentHTML('afterbegin', `<div class="sf6 a"></div><div class="sf6 b"></div><span class="pl6"><svg viewBox="-30 -20 60 40" width="40">${planet21(0, 0, 9, '#ffd59e', '#e0884a', true)}</svg></span><span class="pl6 p2"><svg viewBox="-12 -12 24 24" width="16">${planet21(0, 0, 8, '#9fe8ff', '#3a6fd8')}</svg></span>`);
};
const _applyTheme216 = V19.applyTheme;
V19.applyTheme = function () { _applyTheme216(); const k = THEME; if ((k === 'cruise' || k === 'pro') && $('.menubar') && !$('.menubar .band20')) band20(k); };

return { ti, hello: (txt) => (HELLO[THEME] || HELLO.autumn)(txt), setTheme: (k) => setTheme(k), openTheme: () => openTheme(), theme: () => THEME };
})();
