/* ---------- Temel: yardımcılar, kayıt, dil, biçimlendirme ---------- */
const VERSION = '4.0';
const KEY = 'reactorlab_v2', OLDKEY = 'reactorlab_v1';
const REACTORS = ['rbmk', 'pwr', 'bwr', 'candu'];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;
const E = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const URLQ = (() => { try { return new URLSearchParams(location.search); } catch (e) { return { get: () => null }; } })();

const DEF = () => ({ lang: null, muted: false, vol: 0.8, amb: true, hap: true, prot: 'assist', slow: true, flash: true, pct: false, big: false, hints: true, motion: 'auto', stars: {}, best: {}, seen: {}, cr: 0, up: {} });
let save = DEF();
function loadSave() {
  const read = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const o = read(KEY) || read(OLDKEY), d = DEF();
  if (o && typeof o === 'object') {
    if (typeof o.lang === 'string' && LANGS[o.lang]) d.lang = o.lang;
    for (const b of ['muted', 'amb', 'hap', 'slow', 'flash', 'pct', 'big', 'hints']) if (typeof o[b] === 'boolean') d[b] = o[b];
    if (o.vol !== undefined && Number.isFinite(+o.vol)) d.vol = clamp(+o.vol, 0, 1);
    if (['full', 'assist', 'off'].includes(o.prot)) d.prot = o.prot;
    if (['auto', 'reduce', 'full'].includes(o.motion)) d.motion = o.motion;
    const ok = k => /^(rbmk|pwr|bwr|candu):(train|move|test)$/.test(k);
    if (o.stars && typeof o.stars === 'object') for (const k of Object.keys(o.stars).slice(0, 40)) { const s = Math.floor(+o.stars[k]); if (ok(k) && s >= 0 && s <= 3) d.stars[k] = s; }
    if (o.best && typeof o.best === 'object') for (const k of Object.keys(o.best).slice(0, 40)) { const s = Math.round(+o.best[k]); if (ok(k) && s >= 0 && s <= 100) d.best[k] = s; }
    if (Number.isFinite(+o.cr)) d.cr = clamp(Math.floor(+o.cr), 0, 999999);
    if (o.up && typeof o.up === 'object') for (const k of Object.keys(o.up).slice(0, 40)) if (/^(rbmk|pwr|bwr|candu):[a-z]{2,10}$/.test(k) && o.up[k] === 1) d.up[k] = 1;
    if (Number.isFinite(+o.kst)) d.kst = clamp(Math.floor(+o.kst), 0, 999999);
    if (Number.isFinite(+o.klv)) d.klv = clamp(Math.floor(+o.klv), 1, 12);
    if (o.kls && typeof o.kls === 'object') { d.kls = {}; for (let i = 1; i <= 12; i++) { const v = Math.floor(+o.kls[i]); if (v >= 1 && v <= 3) d.kls[i] = v; } }
    if (o.hats && typeof o.hats === 'object') { d.hats = { party: 1 }; for (const h of ['cap', 'glasses', 'chef', 'crown', 'wizard']) if (o.hats[h] === 1) d.hats[h] = 1; }
    if (typeof o.hat === 'string' && d.hats && d.hats[o.hat]) d.hat = o.hat;
    if (o.seen && typeof o.seen === 'object') for (const k of Object.keys(o.seen).slice(0, 40)) if (/^(rbmk|pwr|bwr|candu):(train|move|test|sand)$/.test(k)) d.seen[k] = 1;
  }
  save = d;
}
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {} };
const starsOf = (id, sc) => save.stars[id + ':' + sc] || 0;
const typeStars = id => ['train', 'move', 'test'].reduce((a, s) => a + starsOf(id, s), 0);

/* ---------- Dil ---------- */
const SCRIPT_FONT = {
  latin: "'Trebuchet MS','Segoe UI',Inter,Roboto,system-ui,sans-serif",
  cyrillic: "'Trebuchet MS','Segoe UI',Inter,Roboto,system-ui,sans-serif",
  arabic: "'Segoe UI','Noto Sans Arabic','Geeza Pro',Tahoma,'DejaVu Sans',system-ui,sans-serif",
  devanagari: "'Nirmala UI','Noto Sans Devanagari','Kohinoor Devanagari',Mangal,FreeSans,system-ui,sans-serif"
};
const CJK_FONT = {
  ja: "'Hiragino Sans','Yu Gothic UI','Meiryo','Noto Sans CJK JP','Noto Sans JP','WenQuanYi Zen Hei',system-ui,sans-serif",
  ko: "'Apple SD Gothic Neo','Malgun Gothic','Noto Sans CJK KR','Noto Sans KR','WenQuanYi Zen Hei',system-ui,sans-serif",
  zh: "'PingFang SC','Microsoft YaHei','Noto Sans CJK SC','Noto Sans SC','WenQuanYi Zen Hei',system-ui,sans-serif"
};
let LANG = 'en', META = LANGS.en, PR = null, NF = {}, FONT = SCRIPT_FONT.latin, DIR = 'ltr', CJK = false;
function normLang(tag) {
  const s = String(tag || '').toLowerCase().replace('_', '-'), base = s.split('-')[0];
  if (base === 'in') return LANGS.id ? 'id' : null;
  return LANGS[base] ? base : null;
}
function pickLang() {
  const q = URLQ.get('lang');
  if (q === 'pseudo' || (q && LANGS[q])) return q;
  if (save.lang && LANGS[save.lang]) return save.lang;
  const list = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || 'en'];
  for (const tag of list) { const c = normLang(tag); if (c) return c; }
  return 'en';
}
function pseudoize(s) {
  const map = { a: 'á', e: 'é', i: 'î', o: 'ö', u: 'ü', A: 'Å', E: 'É', I: 'Î', O: 'Ö', U: 'Ü', c: 'ç', n: 'ñ', s: 'š', y: 'ý', g: 'ğ' };
  let out = ''; for (let i = 0; i < s.length; i++) { if (s.startsWith('{0}', i)) { out += '{0}'; i += 2; continue; } out += map[s[i]] || s[i]; }
  return '[' + out + '~'.repeat(Math.ceil(s.length * 0.35)) + ']';
}
function ensurePseudo() {
  if (T.pseudo) return; const o = {};
  for (const k of Object.keys(T.en)) { const v = T.en[k]; o[k] = typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([c, x]) => [c, pseudoize(x)])) : pseudoize(v); }
  T.pseudo = o; LANGS.pseudo = { name: 'Pseudo', locale: 'en-US', dir: 'ltr', script: 'latin' };
}
function fontFor(code) { const m = LANGS[code] || {}; return m.script === 'cjk' ? (CJK_FONT[code] || CJK_FONT.zh) : (SCRIPT_FONT[m.script] || SCRIPT_FONT.latin); }
function setLang(code, remember) {
  if (code === 'pseudo') ensurePseudo();
  if (!LANGS[code]) code = 'en';
  LANG = code; META = LANGS[code]; DIR = META.dir || 'ltr'; CJK = META.script === 'cjk';
  try { PR = new Intl.PluralRules(META.locale || code); } catch (e) { PR = null; }
  NF = {}; FONT = fontFor(code);
  const de = document.documentElement; de.lang = code === 'pseudo' ? 'en' : code; de.dir = DIR; de.style.setProperty('--font', FONT);
  document.title = t('doc_title');
  if (remember) { save.lang = code === 'pseudo' ? save.lang : code; persist(); }
}
function nf(x, d) {
  d = d || 0; const k = 'f' + d;
  if (!NF[k]) { try { NF[k] = new Intl.NumberFormat((META.locale || 'en') + '-u-nu-latn', { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { NF[k] = { format: v => Number(v).toFixed(d) }; } }
  return NF[k].format(x);
}
const MISSING = new Set();
function t(k, a) {
  let v = T[LANG] && T[LANG][k] !== undefined ? T[LANG][k] : T.en[k];
  if (v === undefined) { MISSING.add(k); return k; }
  if (T[LANG] && T[LANG][k] === undefined && LANG !== 'en') MISSING.add(LANG + ':' + k);
  if (typeof v === 'object') { const n = typeof a === 'number' ? a : parseFloat(a); const cat = PR && Number.isFinite(n) ? PR.select(n) : 'other'; v = v[cat] !== undefined ? v[cat] : v.other; }
  if (a !== undefined) v = v.split('{0}').join(typeof a === 'number' ? nf(a, Number.isInteger(a) ? 0 : 1) : String(a));
  return v;
}
const tEn = k => { const v = T.en[k]; return typeof v === 'object' ? v.other : v; };
const rname = id => ({ rbmk: 'RBMK-1000', pwr: 'PWR', bwr: 'BWR', candu: 'CANDU' })[id] || id;
const fmtMW = mw => mw >= 1000 ? nf(Math.round(mw)) : nf(mw, mw < 10 ? 1 : 0);
const fmtTime = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

/* ---------- Hareket tercihi ---------- */
const prefersRM = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
const RM = () => save.motion === 'reduce' || (save.motion === 'auto' && prefersRM());
function applyPrefs() {
  document.documentElement.classList.toggle('rm', RM());
  document.documentElement.style.setProperty('--fs', save.big ? 1.12 : 1);
  FS = save.big ? 1.12 : 1;
  if (typeof fitCtl === 'function') { FIT.clear(); requestAnimationFrame(fitCtl); } // yazı boyutu değişince düğmeleri yeniden sığdır
}
