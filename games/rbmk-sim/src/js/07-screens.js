/* ---------- Ekranlar: menü, brifing, ayarlar, dil, yardım, duraklatma, rapor, ipucu ---------- */
const ov = E('ov'), tipEl = E('tip');
let OVH = {}, SCR = null, TIPHINT = false;
const BK = () => DIR === 'rtl' ? '›' : '‹', FW = () => DIR === 'rtl' ? '‹' : '›';
function show(html, dir, handlers, name) {
  ov.hidden = false; ov.className = dir || 'in'; ov.innerHTML = `<div class="scr">${html}</div>`; ov.scrollTop = 0; OVH = handlers || {}; SCR = name || null;
  ov.querySelectorAll('.stag').forEach(g => Array.from(g.children).forEach((c, i) => c.style.setProperty('--i', i)));
  const f = ov.querySelector('[data-focus]'); if (f && WIDE) try { f.focus({ preventScroll: true }); } catch (e) {}
}
function hide() { ov.hidden = true; ov.innerHTML = ''; OVH = {}; SCR = null; }
ov.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b || !ov.contains(b) || b.disabled) return; audioInit(); const fn = OVH[b.dataset.a]; if (fn) { e.preventDefault(); fn(b, e); } });
const topBar = (title, right) => `<div class="top"><button class="iconb" data-a="back" aria-label="${esc(t('back'))}">${BK()}</button><h2>${title}</h2>${right || '<span style="width:40px"></span>'}</div>`;
let enNames = null;
function enName(c) { try { if (!enNames) enNames = new Intl.DisplayNames(['en'], { type: 'language' }); return enNames.of(LANGS[c].locale || c); } catch (e) { return c; } }
function pc(x, d) {
  d = d || 0; const k = 'p' + d;
  if (!NF[k]) { try { NF[k] = new Intl.NumberFormat((META.locale || 'en') + '-u-nu-latn', { style: 'percent', minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { NF[k] = { format: v => (v * 100).toFixed(d) + '%' }; } }
  return NF[k].format(x / 100);
}
function relabel() { ctlLabels(); if (msgKey) msg = t(msgKey, msgArg); ctlSync(true); }

/* Görseller */
const hero = small => `<div class="hero"><svg viewBox="0 0 360 ${small ? 120 : 190}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1a30"/><stop offset=".6" stop-color="#1b3a5e"/><stop offset="1" stop-color="#e08a4a"/></linearGradient><radialGradient id="gl" cx=".5" cy="1" r=".6"><stop offset="0" stop-color="#7fe0ff" stop-opacity=".7"/><stop offset="1" stop-color="#7fe0ff" stop-opacity="0"/></radialGradient><linearGradient id="ct" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#16243a"/><stop offset=".5" stop-color="#2a3d5c"/><stop offset="1" stop-color="#121e31"/></linearGradient></defs><rect width="360" height="190" fill="url(#sk)"/><g fill="#fff">${[[20, 20, 1], [60, 40, 2], [120, 14, 1], [200, 30, 2], [260, 18, 1], [330, 44, 2], [345, 12, 1], [90, 60, 2], [160, 52, 1], [235, 64, 2]].map(p => `<circle class="st${p[2]}" cx="${p[0]}" cy="${p[1]}" r="1"/>`).join('')}</g><ellipse class="glow" cx="170" cy="168" rx="110" ry="40" fill="url(#gl)"/><path d="M12 190 C20 150 18 128 10 104 H58 C50 128 48 150 56 190 Z" fill="url(#ct)"/><g fill="#e6eef8">${[0, 1, 2].map(i => `<circle class="sm" cx="${30 + i * 6}" cy="100" r="${10 - i}"/>`).join('')}</g><g fill="#0a1220"><rect x="70" y="120" width="190" height="70"/><rect x="58" y="146" width="30" height="44"/><rect x="246" y="110" width="52" height="80"/><polygon points="70,120 130,96 200,96 260,120"/></g><g><rect x="306" y="52" width="14" height="138" fill="#0a1220"/><rect x="306" y="62" width="14" height="14" fill="#c9202f"/><rect x="306" y="90" width="14" height="14" fill="#c9202f"/><rect x="306" y="118" width="14" height="14" fill="#c9202f"/><rect x="306" y="76" width="14" height="14" fill="#e8eef7"/><rect x="306" y="104" width="14" height="14" fill="#e8eef7"/><circle class="glow" cx="313" cy="50" r="2.4" fill="#ff5468"/></g><g fill="#ffd877" opacity=".9">${Array.from({ length: 22 }, (_, i) => `<rect class="${i % 5 === 2 ? 'wn' : ''}" x="${82 + (i % 11) * 16}" y="${130 + Math.floor(i / 11) * 18}" width="6" height="8"/>`).join('')}</g><rect y="186" width="360" height="4" fill="#060b14"/></svg>${small ? '' : `${crPill('hp')}<button class="lgbtn" data-a="lang" aria-label="${esc(t('st_lang'))}">🌐 ${esc(META.name)}</button><h1>${t('title')}</h1><small>${t('sub')}</small>`}</div>`;
const ICON = {
  rbmk: '<svg viewBox="0 0 64 54" aria-hidden="true"><rect x="6" y="6" width="40" height="42" rx="3" fill="#1d2733" stroke="#4b607d"/><g fill="#5fd3ff">' + Array.from({ length: 16 }, (_, i) => `<circle class="${i % 3 ? '' : 'glow'}" cx="${14 + (i % 4) * 9}" cy="${14 + Math.floor(i / 4) * 9}" r="2.6"/>`).join('') + '</g><rect x="50" y="14" width="8" height="34" fill="#e8eef7"/><rect x="50" y="20" width="8" height="7" fill="#c9202f"/><rect x="50" y="34" width="8" height="7" fill="#c9202f"/></svg>',
  pwr: '<svg viewBox="0 0 64 54" aria-hidden="true"><path d="M18 10 Q32 -2 46 10 V44 Q32 52 18 44 Z" fill="#1d2733" stroke="#4b607d" stroke-width="2"/><rect class="glow" x="23" y="22" width="18" height="18" rx="1" fill="#6aa8ff" opacity=".8"/><g stroke="#0b0f17" stroke-width="2"><path d="M26 12 V28 M32 10 V28 M38 12 V28"/></g><rect x="8" y="26" width="10" height="6" fill="#4b607d"/><rect x="46" y="26" width="10" height="6" fill="#4b607d"/></svg>',
  bwr: '<svg viewBox="0 0 64 54" aria-hidden="true"><path d="M20 6 Q32 -2 44 6 V44 Q32 52 20 44 Z" fill="#1d2733" stroke="#4b607d" stroke-width="2"/><rect x="23" y="24" width="18" height="18" fill="#5fa8d8" opacity=".6"/><g fill="#e6f6ff" opacity=".85"><circle class="sm" cx="27" cy="34" r="2"/><circle class="sm" cx="35" cy="32" r="2.4"/><circle class="sm" cx="32" cy="36" r="1.8"/></g><path d="M20 38 H8 V16 H20" fill="none" stroke="#4b607d" stroke-width="2"/></svg>',
  candu: '<svg viewBox="0 0 64 54" aria-hidden="true"><rect x="8" y="12" width="48" height="30" rx="8" fill="#1d2733" stroke="#4b607d" stroke-width="2"/><g fill="#5fd3ff">' + Array.from({ length: 4 }, (_, r) => `<rect class="${r % 2 ? 'glow' : ''}" x="14" y="${18 + r * 6}" width="36" height="3"/>`).join('') + '</g><g fill="#0b0f17">' + [20, 32, 44].map(x => `<rect x="${x}" y="12" width="3" height="30"/>`).join('') + '</g></svg>'
};
const SCI = { train: '🎓', move: '📉', test: '☢', sand: '🎛' };
const maxStars = id => (SCENS(id).length - 1) * 3;

/* Ana menü */
function mainMenu(dir) {
  playing = false;
  show(`${hero()}<button class="btn go quick" data-a="quick">▶ ${t('quick')}</button><small class="d">🤖 ${t('k_title')}</small><p class="h3">🔬 ${t('k_expert')}</p>
  <div class="grid stag">${REACTORS.map(id => { const s = typeStars(id); return `<button class="tile" data-a="r" data-id="${id}">${ICON[id]}<b>${rname(id)}</b><span>${t('rn_' + id)}</span><span class="st">${s ? '★ ' + nf(s) + '/' + nf(maxStars(id)) : ''}</span></button>`; }).join('')}</div>
  <div class="mini stag"><button class="ghost" data-a="help">? ${t('how')}</button><button class="ghost" data-a="set">⚙ ${t('set')}</button></div>
  <small class="d">${t('edu')}<br>${t('read')}<br>${t('o_ver', VERSION)}</small>`, dir, {
    r: b => { SFX.open(); reactorMenu(b.dataset.id); },
    quick: () => { SFX.open(); kidsMenu(); },
    help: () => { SFX.open(); helpScreen(() => mainMenu('back')); },
    set: () => { SFX.open(); settingsScreen(() => mainMenu('back')); },
    lang: () => { SFX.open(); langPicker(() => mainMenu('back')); }
  }, 'main');
}
/* Reaktör menüsü */
const STATS = { rbmk: [['v_pos', 1, '#ff5468'], ['sp_slow', 0.15, '#ff5468'], ['stb_low', 0.2, '#ff5468'], ['d_hard', 1, '#ff5468']], pwr: [['v_none', 0.12, '#46e0a0'], ['sp_fast', 0.8, '#46e0a0'], ['stb_hi', 0.95, '#46e0a0'], ['d_easy', 0.3, '#46e0a0']], bwr: [['v_neg', 0.6, '#46e0a0'], ['sp_med', 0.6, '#ffc83d'], ['stb_mid', 0.6, '#ffc83d'], ['d_med', 0.55, '#ffc83d']], candu: [['v_small', 0.35, '#ffc83d'], ['sp_vfast', 1, '#46e0a0'], ['stb_mid', 0.55, '#ffc83d'], ['d_med', 0.6, '#ffc83d']] };
function reactorMenu(id, dir) {
  playing = false; typeId = id; const st = STATS[id], lab = ['st_void', 'st_trip', 'st_stab', 'st_diff'];
  show(`${topBar(rname(id), `<button class="iconb" data-a="help" aria-label="${esc(t('how'))}">?</button>`)}
  <div class="pad"><div class="rbig">${ICON[id]}</div><p>${t('rd_' + id)}</p></div>
  <div class="stats stag">${st.map((s, i) => `<div class="stat"><em>${t(lab[i])}</em><i><s data-w="${Math.round(s[1] * 100)}%" style="background:${s[2]}"></s></i><b style="color:${s[2]}">${t(s[0])}</b></div>`).join('')}</div>
  <p class="h3">${t('pick_s')}</p>
  <div class="cards stag"><button class="card upg" data-a="upg"><div class="ic">🔧</div><div class="tx"><b>${t('upg')}</b><span>${t('upg_sub')}</span></div><div class="st"><span class="upprog sm">${UPG[id].map(u => `<i class="${owned(id, u.id) ? 'on' : ''}"></i>`).join('')}</span><small>⚡ ${nf(save.cr)}</small></div></button></div>
  <div class="cards stag">${SCENS(id).map(k => { const s = starsOf(id, k), b = save.best[id + ':' + k]; return `<button class="card ${k === 'test' ? 'hard' : ''}" data-a="s" data-s="${k}"><div class="ic">${SCI[k]}</div><div class="tx"><b>${t('s_' + k)}</b><span>${t('s_' + k + 'd')}</span></div>${k !== 'sand' ? `<div class="st">${'★'.repeat(s)}${'☆'.repeat(3 - s)}${b ? `<small>${t('best', pc(b))}</small>` : ''}</div>` : ''}</button>`; }).join('')}</div>`, dir, {
    back: () => { SFX.back(); mainMenu('back'); },
    help: () => { SFX.open(); helpScreen(() => reactorMenu(id, 'back')); },
    s: b => { SFX.open(); startScenario(b.dataset.s); },
    upg: () => { SFX.open(); upgradesScreen(id, () => reactorMenu(id, 'back')); }
  }, 'reactor');
  setTimeout(() => ov.querySelectorAll('.stat s').forEach(s => { s.style.width = s.dataset.w; }), 60);
}
/* Brifing */
const goalFor = (id, sn) => sn === 'sand' ? t('goal_sand') : sn === 'test' ? t('goal_test') : id === 'pwr' ? t('goal_pwr') : t('goal_' + sn);
const protName = m => t('prot_' + m);
function startScenario(sn) { if (save.hints && !save.seen[typeId + ':' + sn]) briefing(sn); else go(sn); }
function briefing(sn, dir) {
  const id = typeId, tips = sn === 'test' ? ['br_test1', 'br_test2', 'br_test3'] : [1, 2, 3].map(i => 'br_' + id + i);
  let skip = false;
  show(`${topBar(t('s_' + sn))}
  <div class="brief stag">
   <div><h4>${rname(id)} · ${t('br_obj')}</h4><div class="obj">${goalFor(id, sn)}</div></div>
   ${sn === 'train' || sn === 'move' ? `<div><h4>${t('br_stars')}</h4><div class="tip"><i>★</i><span>${t('br_starsT')}</span></div></div>` : ''}
   <div><h4>${t('br_tips')}</h4>${tips.map((k, i) => `<div class="tip"><i>${nf(i + 1)}</i><span>${t(k)}</span></div>`).join('')}</div>
   <div><h4>${t('br_ctl')}</h4><div class="tip"><i>⇅</i><span>${t(id === 'pwr' ? 'br_ctl_pwr' : id === 'bwr' ? 'br_ctl_bwr' : 'br_ctl_gen')}</span></div><div class="tip"><i>🛡</i><span>${t('br_prot', protName(sn === 'test' ? 'full' : save.prot))}</span></div>${sn === 'test' ? `<div class="tip"><i>🔧</i><span>${t('upg_test')}</span></div>` : upCount(id) ? `<div class="tip"><i>🔧</i><span>${t('upg_on', upCount(id))}</span></div>` : ''}</div>
  </div>
  <button class="btn go" data-a="go" data-focus>${t('start')}</button>
  <button class="chk" data-a="skip"><span class="sw" aria-checked="false"><i></i></span><span>${t('br_skip')}</span></button>`, dir, {
    back: () => { SFX.back(); reactorMenu(id, 'back'); },
    skip: b => { skip = !skip; b.querySelector('.sw').setAttribute('aria-checked', String(skip)); SFX.toggle(skip); },
    go: () => { if (skip) { save.seen[id + ':' + sn] = 1; persist(); } go(sn); }
  }, 'brief');
}
function go(sn) {
  audioInit(); initScenario(sn, typeId); hide(); INTRO = performance.now(); playing = true; ended = false; SFX.start(); computeLayout(); ctlSync(true);
  if (save.hints && !TIPHINT) { TIPHINT = true; setTimeout(() => { if (playing) toast(t('m_tiphint'), 'info', 3800); }, 2200); }
}
function resumeGame() { if (!S || ended) { quitGame(); return; } hide(); playing = true; ctlSync(true); }
function quitGame() { playing = false; ended = true; S = null; E('toast').innerHTML = ''; tipEl.hidden = true; reactorMenu(typeId, 'back'); }
/* Duraklatma */
function pauseMenu(dir) {
  if (!S || ended) return; playing = false; tipEl.hidden = true;
  const pct = score.tot ? pc(Math.round(score.ok / score.tot * 100)) : null;
  show(`<div class="pad" style="margin-top:9vh"><div class="pz">II</div><h2>${t('paused')}</h2><p>${rname(TY.id)} · ${t('s_' + scen)} · ${fmtTime(scenT)}${pct ? ' · ' + t('k_pct') + ' ' + pct : ''}</p></div>
  <div class="pad stag"><button class="btn" data-a="resume" data-focus>▶ ${t('resume')}</button><button class="ghost w" data-a="restart">⟲ ${t('restart')}</button><button class="ghost w" data-a="help">? ${t('how')}</button><button class="ghost w" data-a="set">⚙ ${t('set')}</button><button class="ghost w" data-a="quit">⌂ ${t('menu')}</button></div>`, dir || 'up', {
    resume: () => { SFX.click(); resumeGame(); },
    restart: () => go(scen),
    help: () => { SFX.open(); helpScreen(() => pauseMenu('back')); },
    set: () => { SFX.open(); settingsScreen(() => pauseMenu('back')); },
    quit: () => { SFX.back(); quitGame(); }
  }, 'pause');
}
/* Ayarlar */
function settingsScreen(back, dir) {
  const sw = (k, on, lbl, sub) => `<div class="sr"><div class="lb"><b>${lbl}</b>${sub ? `<small>${sub}</small>` : ''}</div><button class="sw" role="switch" aria-checked="${on}" data-a="tg" data-k="${k}" aria-label="${esc(lbl)}"><i></i></button></div>`;
  const seg = (k, val, opts, lbl, sub, col) => `<div class="sr${col ? ' col' : ''}"><div class="lb"><b>${lbl}</b>${sub !== undefined ? `<small id="d_${k}">${sub}</small>` : ''}</div><div class="seg" role="radiogroup" aria-label="${esc(lbl)}">${opts.map(([v, l]) => `<button role="radio" aria-checked="${v === val}" data-a="seg" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div></div>`;
  const sec = (ic, title, body) => `<div class="sec"><h3><i>${ic}</i>${title}</h3>${body}</div>`;
  const hasVib = typeof navigator.vibrate === 'function';
  const resetRow = () => `<div class="sr" id="rsr"><div class="lb"><b>${t('o_reset')}</b><small>${t('o_resetD')}</small></div><button class="ghost" data-a="reset">⟲</button></div>`;
  show(`${topBar('⚙ ' + t('set'))}
  <div class="sets stag">
   ${sec('🌐', t('st_lang'), `<button class="langrow" data-a="lang"><div><b>${esc(META.name)}</b><br><span>${esc(enName(LANG))}</span></div><em>${FW()}</em></button>`)}
   ${sec('🔊', t('sec_sound'), sw('sound', !save.muted, t('o_sound')) + `<div class="sr"><div class="lb"><b>${t('o_vol')}</b><small id="volv">${pc(Math.round(save.vol * 100))}</small></div><input type="range" id="volr" min="0" max="100" value="${Math.round(save.vol * 100)}" aria-label="${esc(t('o_vol'))}"></div>` + sw('amb', save.amb, t('o_amb'), t('o_ambD')) + (hasVib ? sw('hap', save.hap, t('o_hap'), t('o_hapD')) : ''))}
   ${sec('🎮', t('sec_play'), seg('prot', save.prot, [['full', protName('full')], ['assist', protName('assist')], ['off', protName('off')]], t('o_prot'), t('prot_' + save.prot + '_d'), true) + sw('slow', save.slow, t('o_slow'), t('o_slowD')) + sw('hints', save.hints, t('o_hints'), t('o_hintsD')))}
   ${sec('👁', t('sec_view'), seg('pct', save.pct ? 'pct' : 'mw', [['mw', t('u_mw')], ['pct', t('u_pct')]], t('o_units')) + seg('big', save.big ? '1' : '0', [['0', t('t_norm')], ['1', t('t_big')]], t('o_text')) + seg('motion', save.motion, [['auto', t('m_auto')], ['reduce', t('m_red')], ['full', t('m_full')]], t('o_motion'), undefined, true) + sw('flash', save.flash, t('o_flash'), t('o_flashD')))}
   ${sec('💾', t('sec_data'), resetRow())}
   ${sec('ℹ', t('st_about'), `<div class="sr"><div class="lb"><b>Reactor Lab</b><small>${t('o_ver', VERSION)} · ${t('edu')}</small><small>${t('read')}</small></div></div>`)}
  </div>
  <button class="btn" data-a="back">${t('back')}</button>`, dir, {
    back: () => { SFX.back(); back(); },
    lang: () => { SFX.open(); langPicker(() => settingsScreen(back, 'back')); },
    tg: b => {
      const k = b.dataset.k; let on;
      if (k === 'sound') { save.muted = !save.muted; on = !save.muted; audioVol(); } else { save[k] = !save[k]; on = save[k]; }
      b.setAttribute('aria-checked', String(on)); persist(); SFX.toggle(on); if (k === 'hap' && on) buzz(40);
    },
    seg: b => {
      const k = b.dataset.k, v = b.dataset.v; b.parentNode.querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', String(x === b)));
      if (k === 'prot') { save.prot = v; const d = E('d_prot'); if (d) d.textContent = t('prot_' + v + '_d'); if (S && !ended && scen !== 'test') setProt(v, true); }
      else if (k === 'pct') save.pct = v === 'pct';
      else if (k === 'big') { save.big = v === '1'; applyPrefs(); }
      else if (k === 'motion') { save.motion = v; applyPrefs(); }
      persist(); SFX.click();
    },
    reset: () => { E('rsr').innerHTML = `<div class="lb"><b style="color:#ff9aa6">${t('o_resetQ')}</b></div><div class="seg"><button data-a="resetyes">${t('yes')}</button><button data-a="resetno" aria-checked="true">${t('no')}</button></div>`; SFX.warn(); },
    resetno: () => { E('rsr').outerHTML = resetRow(); SFX.back(); },
    resetyes: () => { save.stars = {}; save.best = {}; save.seen = {}; save.cr = 0; save.up = {}; save.kst = 0; save.klv = 1; save.kls = {}; save.hats = { party: 1 }; save.hat = 'party'; persist(); E('rsr').outerHTML = resetRow(); toast(t('o_resetDone'), 'ok', 1800); SFX.reset(); }
  }, 'settings');
  const v = E('volr');
  v.addEventListener('input', () => { save.vol = v.value / 100; E('volv').textContent = pc(+v.value); audioInit(); audioVol(); });
  v.addEventListener('change', () => { persist(); SFX.click(); });
}
/* Dil seçici */
function langPicker(back, dir) {
  const codes = Object.keys(LANGS).filter(c => c !== 'pseudo' || LANG === 'pseudo');
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  show(`${topBar('🌐 ' + t('st_lang'))}
  <div class="srch"><span aria-hidden="true">🔍</span><input type="search" id="lq" placeholder="${esc(t('search'))}" aria-label="${esc(t('search'))}" autocomplete="off" spellcheck="false"></div>
  <div class="llist stag">${codes.map(c => `<button class="lang ${c === LANG ? 'sel' : ''}" data-a="pick" data-c="${c}" data-q="${esc(norm(LANGS[c].name + ' ' + enName(c) + ' ' + c))}"><b lang="${c}" dir="${LANGS[c].dir || 'ltr'}" style="font-family:${fontFor(c).replace(/"/g, "'")}">${esc(LANGS[c].name)}</b><span>${esc(enName(c))}</span><code>${c}${c === LANG ? ' ✓' : ''}</code></button>`).join('')}</div>
  <small class="d">${t('lang_note')}</small>`, dir, {
    back: () => { SFX.back(); back(); },
    pick: b => { setLang(b.dataset.c, true); relabel(); SFX.toggle(true); back(); }
  }, 'lang');
  const q = E('lq'); q.addEventListener('input', () => { const s = norm(q.value.trim()); ov.querySelectorAll('.lang').forEach(b => { b.hidden = !!s && !b.dataset.q.includes(s); }); });
}
/* Yardım */
function helpScreen(back, dir) {
  const card = k => `<div class="hc"><b>${t(k)}${LANG !== 'en' ? `<small>${esc(tEn(k))}</small>` : ''}</b><span>${t(k + 'T')}</span></div>`;
  const ty = S && !ended ? TY.id : SCR === 'reactor' || SCR === 'brief' ? typeId : null;
  const types = ty ? [ty] : REACTORS, kb = [['↑ ↓ · W S', t('kb_pow')], ['← → · A D', t('kb_flow')], ['Shift', t('kb_big')], ['M', t('auto') + ' / ' + t('man')], ['X', t('kb_trip')], ['R', t('kb_reset')], ['Space · P · Esc', t('kb_pause')], ['1 · 2 · 4', t('kb_speed')], ['V', t('kb_view')], ['H · ?', t('how')]];
  show(`${topBar('? ' + t('how'))}
  <div class="help stag">${types.map(id => card('g_' + id)).join('')}${['g_prot', 'g_period', 'g_rho', 'g_orm', 'g_xe', 'g_void', 'g_rod'].map(card).join('')}
   <div class="hc"><b>⌨ ${t('kb_title')}</b><div class="kb">${kb.map(([k, l]) => `<kbd>${k}</kbd><span>${l}</span>`).join('')}</div></div></div>
  <button class="btn" data-a="back">${t('close')}</button>`, dir, { back: () => { SFX.back(); back(); } }, 'help');
}
/* İpucu kartı (panellerdeki ⓘ) */
const TIPH = { tip_core: 'hdr1', tip_plant: 'hdr_plant', tip_power: 'hdr2', tip_margin: () => TY.id === 'rbmk' ? 'orm_rbmk' : 'orm_o', tip_rho: 'rho', tip_trend: 'hdr3', tip_xe: 'hdr4', tip_rods: 'hdr5', tip_lamps: 'hdr6' };
function showTip(key) {
  if (!S || !TIPH[key]) return; if (tipEl.hidden) flags.tipWas = playing; playing = false;
  const hk = typeof TIPH[key] === 'function' ? TIPH[key]() : TIPH[key], bk = T.en[key + '_' + TY.id] !== undefined ? key + '_' + TY.id : key;
  tipEl.innerHTML = `<b>${esc(t(hk))}</b>${LANG !== 'en' ? `<small>${esc(tEn(hk))}</small>` : ''}<p>${esc(t(bk))}</p><button data-x>${t('gotit')}</button>`;
  tipEl.hidden = false; SFX.open(); try { tipEl.querySelector('button').focus({ preventScroll: true }); } catch (e) {}
}
function closeTip() { if (tipEl.hidden) return; tipEl.hidden = true; if (flags.tipWas && S && !ended && ov.hidden) playing = true; flags.tipWas = false; SFX.back(); }
tipEl.addEventListener('click', e => { if (e.target.closest('[data-x]')) closeTip(); });
/* Vardiya raporu */
function countUp(el, to, d, u, dur) {
  const f2 = v => (d < 0 ? fmtTime(v) : u === '%' ? pc(d ? v : Math.round(v), d) : nf(d ? v : Math.round(v), d) + u);
  if (RM()) { el.textContent = f2(to); return; }
  const t0 = performance.now(), st = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = f2(to * e); if (k < 1) requestAnimationFrame(st); }; requestAnimationFrame(st);
}
function burst(host) {
  if (RM()) return; const cols = ['#ffd23f', '#5fd3ff', '#46e0a0', '#ff7b8a', '#fff'];
  for (let i = 0; i < 28; i++) { const s = document.createElement('i'); s.className = 'bp'; const a = Math.random() * Math.PI * 2, r = 50 + Math.random() * 90; s.style.cssText = `--x:${Math.cos(a) * r}px;--y:${Math.sin(a) * r - 20}px;background:${cols[i % 5]};animation-delay:${Math.random() * 120}ms`; host.appendChild(s); setTimeout(() => s.remove(), 1300); }
}
function reportChart(cvs) {
  const r = cvs.getBoundingClientRect(), d2 = Math.min(2.5, window.devicePixelRatio || 1), W = Math.max(200, r.width), Hh = 130; cvs.width = W * d2; cvs.height = Hh * d2;
  const c = cvs.getContext('2d'); c.scale(d2, d2);
  const P = HIST.p.slice(), D = HIST.d.slice(), n = P.length; if (n < 2) return;
  const mx = Math.max(1, ...P, ...D.filter(v => v !== null)), mn = Math.max(1, Math.min(...P.filter(v => v > 0.5))), log = mx / mn > 60 || (S && S.destroyed);
  const fy = v => log ? Math.log10(Math.max(1, v)) / Math.log10(mx * 1.3) : v / (mx * 1.15), X0 = 8, Y0 = 8, w = W - 16, h = Hh - 26;
  const px = i => X0 + i / (n - 1) * w, py = v => Y0 + h - clamp(fy(v), 0, 1) * h;
  const drawTo = k => {
    c.clearRect(0, 0, W, Hh); c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 1; for (let i = 0; i <= 4; i++) { const y = Y0 + h * i / 4; c.beginPath(); c.moveTo(X0, y); c.lineTo(X0 + w, y); c.stroke(); }
    for (const e of EVENTS) if (e.trip && e.i < n) { const x = px(e.i); c.strokeStyle = 'rgba(255,84,104,.7)'; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(x, Y0); c.lineTo(x, Y0 + h); c.stroke(); c.setLineDash([]); }
    const m = Math.max(2, Math.floor(n * k));
    c.setLineDash([4, 4]); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.3; c.beginPath(); let on = false; for (let i = 0; i < m; i++) { if (D[i] === null) { on = false; continue; } on ? c.lineTo(px(i), py(D[i])) : c.moveTo(px(i), py(D[i])); on = true; } c.stroke(); c.setLineDash([]);
    const g = c.createLinearGradient(0, Y0, 0, Y0 + h); g.addColorStop(0, 'rgba(95,211,255,.35)'); g.addColorStop(1, 'rgba(95,211,255,0)');
    c.beginPath(); c.moveTo(px(0), Y0 + h); for (let i = 0; i < m; i++) c.lineTo(px(i), py(P[i])); c.lineTo(px(m - 1), Y0 + h); c.closePath(); c.fillStyle = g; c.fill();
    c.beginPath(); for (let i = 0; i < m; i++) i ? c.lineTo(px(i), py(P[i])) : c.moveTo(px(i), py(P[i])); c.strokeStyle = '#5fd3ff'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#6f89ab'; c.font = `700 10px ${FONT}`; c.textBaseline = 'alphabetic'; c.textAlign = 'left'; c.fillText('0:00', X0, Hh - 4); c.textAlign = 'right'; c.fillText(fmtTime(scenT), X0 + w, Hh - 4);
    c.textAlign = 'right'; c.fillText(fmtMW(mx) + ' MW' + (log ? ' (log)' : ''), X0 + w, Y0 + 9);
  };
  if (RM()) { drawTo(1); return; }
  const t0 = performance.now(), st = now => { const k = Math.min(1, (now - t0) / 1100); drawTo(1 - Math.pow(1 - k, 2)); if (k < 1 && cvs.isConnected) requestAnimationFrame(st); }; requestAnimationFrame(st);
}
function reportScreen(R) {
  const TT = { done: 'done', destroyed: 'destroyed', safe: 'safe', poisoned: 'poisoned' }, ic = R.title === 'destroyed' ? '☢' : R.title === 'poisoned' ? '☠' : R.stars >= 3 ? '🏆' : R.stars ? '✓' : '•';
  const list = SCENS(R.type), nx = list[list.indexOf(R.scen) + 1], cls = R.title === 'destroyed' || R.title === 'poisoned' ? 'bad' : R.stars ? 'ok' : '';
  show(`<div class="pad" style="margin-top:20px"><div class="rico ${cls}">${ic}</div><h2>${t(TT[R.title] || 'done')}</h2><p>${rname(R.type)} · ${t('s_' + R.scen)}</p></div>
  <div class="rep">
   ${R.scen !== 'sand' ? `<div class="stars" id="stars">${[0, 1, 2].map(() => '<i>★</i>').join('')}</div>${R.isNew ? `<div class="newb">${t('new_rec')}</div>` : ''}` : ''}
   ${R.earned ? `<div class="earn"><span class="plus">+${nf(R.earned)} ⚡</span>${crPill()}</div>` : ''}
   <div class="kpis stag">${R.kpis.map(([k, v, d, u]) => `<div class="kpi"><small>${t(k)}</small><b data-v="${v}" data-d="${d}" data-u="${u}">–</b></div>`).join('')}</div>
   <div class="chartw"><canvas id="rch"></canvas><div class="lg"><span class="l1">${t('lg_p')}</span><span class="l2">${t('lg_d')}</span><span class="l3">${t('lg_trip')}</span></div></div>
   ${R.why.length ? `<div class="why"><h4>${t('explain')}</h4><ul>${R.why.map(([k, c, a]) => `<li class="${c}">${esc(t(k, a))}</li>`).join('')}</ul></div>` : ''}
   <div class="why"><h4>${t('log')}</h4><div class="evl">${EVENTS.slice(-50).reverse().map(e => `<div class="${e.kind}"><code>${fmtTime(e.t)}</code><span>${esc(t(e.key, e.arg))}</span></div>`).join('')}</div></div>
   <div class="btnrow"><button class="btn" data-a="again" data-focus>⟲ ${t('again')}</button>${nx && (R.stars > 0 || R.scen === 'move') ? `<button class="ghost" data-a="next">${t('s_' + nx)} ${FW()}</button>` : ''}<button class="ghost" data-a="menu">${t('menu')}</button></div>
   <small class="d">${t('read')}</small>
  </div>`, 'up', {
    again: () => go(R.scen),
    next: () => { SFX.open(); startScenario(nx); },
    menu: () => { SFX.back(); quitGame(); }
  }, 'report');
  ov.querySelectorAll('.kpi b').forEach((b, i) => setTimeout(() => countUp(b, +b.dataset.v, +b.dataset.d, b.dataset.u, 900), 250 + i * 90));
  const ch = E('rch'); if (ch) setTimeout(() => reportChart(ch), 120);
  if (R.earned) { ov.querySelectorAll('.crv').forEach(e => { e.textContent = nf(R.crFrom); }); setTimeout(() => crAnim(R.crFrom, save.cr, 900), 650 + R.stars * 380); }
  const stars = E('stars');
  if (stars) for (let i = 0; i < R.stars; i++) setTimeout(() => { stars.children[i].classList.add('on'); SFX.star(i); buzz(15); if (i === 2) burst(stars); }, 550 + i * 380);
  setTimeout(() => (R.title === 'destroyed' || R.title === 'poisoned' || (R.stars === 0 && R.scen !== 'sand')) ? SFX.fail() : R.stars ? null : SFX.win(), 300);
  if (R.stars) setTimeout(() => SFX.win(), 650 + R.stars * 380);
}
