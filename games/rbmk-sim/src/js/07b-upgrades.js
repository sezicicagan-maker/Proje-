/* ---------- Yükseltmeler: gerçek santral iyileştirmeleri, kredi ekonomisi, yükseltme ekranı ----------
   Her reaktörde 3 yükseltme. Etkisi model parametrelerinde (türün kopyası üzerinde) uygulanır; 1986 Testi her zaman özgün tasarımla oynanır. */
const UPG = {
  rbmk: [
    { id: 'fastaz', cost: 60, ic: '⚡', mod: T => { T.vAz = 0.6; }, fx: [['fx_scram', T => nf(T.stroke / T.vAz, 0) + '\u00a0s']] },
    { id: 'rods', cost: 120, ic: '🧪', mod: T => { T.ps0 = 1.2; }, fx: [['fx_ps', T => '+' + nf(T.ps0, 1) + '\u00a0β']] },
    { id: 'absorb', cost: 200, ic: '🛡', mod: T => { T.av0 = 2.5; T.cV = 1; }, fx: [['fx_void', T => '+' + nf(T.av0, 1) + '\u00a0β']] }
  ],
  pwr: [
    { id: 'boron', cost: 60, ic: '💧', mod: T => { T.bRate = 10; }, fx: [['fx_bor', T => nf(T.bRate) + '\u00a0ppm/s']] },
    { id: 'rodctl', cost: 120, ic: '🎛', mod: T => { T.vRod = 0.09; T.autoGain = 1.5; }, fx: [['fx_rod', T => nf(T.vRod * 100, 0) + '\u00a0cm/s']] },
    { id: 'grey', cost: 200, ic: '◐', mod: T => { T.wRod = 0.5; }, fx: [['fx_worth', T => nf(T.N * T.wRod, 0) + '\u00a0β']] }
  ],
  bwr: [
    { id: 'recirc', cost: 60, ic: '🌀', mod: T => { T.fRate = 0.14; T.flowMin = 0.45; }, fx: [['fx_flowr', T => `${pc(T.flowMin * 100)}–${pc(T.flowMax * 100)}`]] },
    { id: 'fmcrd', cost: 120, ic: '⚙', mod: T => { T.vRod = 0.08; }, fx: [['fx_rod', T => nf(T.vRod * 100, 0) + '\u00a0cm/s']] },
    { id: 'icf', cost: 200, ic: '📈', mod: T => { T.flowMax = 1.15; }, fx: [['fx_flowr', T => `${pc(T.flowMin * 100)}–${pc(T.flowMax * 100)}`]] }
  ],
  candu: [
    { id: 'boost', cost: 60, ic: '🔋', mod: T => { T.minM = 1; T.warn = 5; }, fx: [['fx_min', T => nf(T.minM)]] },
    { id: 'fastadj', cost: 120, ic: '⚙', mod: T => { T.vRod = 0.16; }, fx: [['fx_rod', T => nf(T.vRod * 100, 0) + '\u00a0cm/s']] },
    { id: 'lzc', cost: 200, ic: '🌊', mod: T => { T.autoPer = 28; T.autoIns = 16; }, fx: [['fx_auto', T => nf(T.autoPer || 40) + '\u00a0s']] }
  ]
};
const owned = (id, u) => save.up[id + ':' + u] === 1;
const upCount = id => UPG[id].filter(u => owned(id, u.id)).length;
/* Yükseltmeleri uygulanmış tür kopyası (test senaryosu özgün tasarım) */
function typeFor(id, sn) {
  const T = JSON.parse(JSON.stringify(M.TYPES[id]));
  if (sn !== 'test') for (const u of UPG[id]) if (owned(id, u.id)) u.mod(T);
  return T;
}
function fxText(id, u) { // önce/sonra değerleri, sahip olunan diğer yükseltmeler dahil
  const a = JSON.parse(JSON.stringify(M.TYPES[id])); for (const v of UPG[id]) if (v !== u && owned(id, v.id)) v.mod(a);
  const b = JSON.parse(JSON.stringify(a)); u.mod(b); return u.fx.map(([k, f]) => `${t(k)}: ${f(a)} → ${f(b)}`).join(' · ');
}
/* Vardiya sonunda kazanılan kredi */
function creditsFor(R, prevStars) {
  if (R.scen === 'sand') return 0;
  if (R.title === 'destroyed' || R.title === 'poisoned') return 5;
  if (R.scen === 'test') return 10 + R.stars * 30 + Math.max(0, R.stars - prevStars) * 20;
  return 10 + Math.round((R.pct || 0) / 5) + R.stars * 10 + Math.max(0, R.stars - prevStars) * 15;
}
const crPill = cls => `<span class="crp ${cls || ''}" aria-label="${esc(t('cr'))}"><i>⚡</i><b class="crv">${nf(save.cr)}</b></span>`;
function crAnim(from, to, ms) { // ekrandaki tüm kredi sayaçlarını akıt
  const els = ov.querySelectorAll('.crv'); if (RM()) { els.forEach(e => { e.textContent = nf(to); }); return; }
  const t0 = performance.now(); let i = 0, lastK = -1;
  const st = now => { const k = Math.min(1, (now - t0) / ms), v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))); els.forEach(e => { e.textContent = nf(v); });
    const step = Math.floor(k * 10); if (step !== lastK && k < 1) { lastK = step; SFX.coin(i++); } if (k < 1) requestAnimationFrame(st); };
  requestAnimationFrame(st); els.forEach(e => { const p = e.parentNode; p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); });
}
/* Yükseltme ekranı */
function upgradesScreen(id, back, dir) {
  const card = (u, i) => {
    const own = owned(id, u.id), can = save.cr >= u.cost;
    return `<div class="upc ${own ? 'own' : can ? 'can' : 'lock'}" data-u="${u.id}">
      <div class="upi">${u.ic}</div>
      <div class="upt"><b>${t('u_' + id + '_' + u.id)}</b><span>${t('u_' + id + '_' + u.id + '_d')}</span><em>${esc(fxText(id, u))}</em></div>
      <div class="upb">${own ? `<span class="stamp">${t('inst')}</span>` : `<button class="buy" data-a="buy" data-u="${u.id}" ${can ? '' : 'disabled'}><i class="bar"></i><span>⚡ ${nf(u.cost)}</span></button>${can ? '' : `<small>${t('need', nf(u.cost - save.cr))}</small>`}`}</div>
    </div>`;
  };
  const n = upCount(id);
  show(`${topBar('🔧 ' + t('upg'), crPill())}
  <div class="pad"><div class="rbig">${ICON[id]}</div><h2>${rname(id)}</h2><p>${t('upg_sub')}</p>
   <div class="upprog" aria-label="${n}/3">${UPG[id].map(u => `<i class="${owned(id, u.id) ? 'on' : ''}"></i>`).join('')}</div></div>
  <div class="cards stag">${UPG[id].map(card).join('')}</div>
  ${id === 'rbmk' ? `<small class="d">${t('upg_test')}</small>` : ''}`, dir, {
    back: () => { SFX.back(); back(); },
    buy: b => buyUpgrade(id, b.dataset.u, b, back)
  }, 'upgrades');
}
let BUYING = false;
function buyUpgrade(id, uid, btn, back) {
  const u = UPG[id].find(x => x.id === uid); if (!u || owned(id, uid) || save.cr < u.cost || BUYING) return;
  BUYING = true; audioInit(); const card = btn.closest('.upc'), from = save.cr;
  save.cr -= u.cost; save.up[id + ':' + uid] = 1; persist();
  ov.querySelectorAll('.buy').forEach(b => { b.disabled = true; });
  btn.classList.add('going'); btn.querySelector('span').textContent = t('installing');
  const dur = RM() ? 0 : 1100; let k = 0; const ticks = RM() ? 0 : 8;
  const iv = ticks ? setInterval(() => { SFX.tick(k++); buzz(8); if (k >= ticks) clearInterval(iv); }, dur / ticks) : 0;
  crAnim(from, save.cr, 700);
  setTimeout(() => {
    BUYING = false; SFX.buy(); buzz([20, 30, 60]);
    card.classList.remove('can', 'lock'); card.classList.add('own', 'just');
    card.querySelector('.upb').innerHTML = `<span class="stamp">${t('inst')}</span>`; burst(card.querySelector('.upi'));
    const dots = ov.querySelectorAll('.upprog i'); const ix = UPG[id].indexOf(u); if (dots[ix]) dots[ix].classList.add('on');
    toast(t('upg_new'), 'ok', 1800);
    ov.querySelectorAll('.upc').forEach(c => { // diğer kartların durumunu tazele
      const v = UPG[id].find(x => x.id === c.dataset.u); if (!v || owned(id, v.id)) return; const can = save.cr >= v.cost, b = c.querySelector('.buy');
      c.classList.toggle('can', can); c.classList.toggle('lock', !can); if (b) b.disabled = !can;
      const sm = c.querySelector('.upb small'); if (sm) sm.textContent = can ? '' : t('need', nf(v.cost - save.cr));
    });
  }, dur);
}
