// Çeviri yerleşim QA'sı: node scripts/i18n-qa.js <dil> [çıktı klasörü] [--with-plants]
// Yalnız en + <dil> ile derler, telefon (360x640) ve masaüstü (1280x800) için tüm ekranları gezer:
// DOM taşmaları (metin kutusundan taşan/kesilen öğeler, yatay kaydırma), canvas'ta 7 px altına küçülen ya da "…" ile kesilen metinler.
// Ekran görüntüleri <çıktı>/<dil>/*.png, rapor <çıktı>/<dil>/qa.json. Sorun yoksa çıkış kodu 0.
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs'); const { execFileSync } = require('child_process');
const code = process.argv[2], outRoot = path.resolve(process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : path.join(__dirname, '..', 'tests', 'out', 'i18n'));
if (!code) { console.error('kullanım: node scripts/i18n-qa.js <dil> [çıktı]'); process.exit(2); }
const out = path.join(outRoot, code); fs.mkdirSync(out, { recursive: true });
const html = path.join(out, 'game.html');
execFileSync('node', [path.join(__dirname, 'build-rbmk.js'), '--langs', code === 'en' ? 'en' : 'en,' + code, ...(process.argv.includes('--with-plants') ? [] : ['--plant', 'none']), '--out', html], { stdio: 'ignore' });
const DOMSEL = '.rl,.rv,.chip,.b,#az span,#rst span,#cover span,#bProt,.tile b,.tile span,.card b,.card .st small,.seg button,.ghost,.btn,.kpi small,.kpi b,.stat em,.stat b,.lang b,.lang span,.h3,.top h2,.sr .lb b,.langrow b,.chk span,.brief h4,.lg span,.newb,#sdT,#sdTm,#sdK,.pad h2,.hero h1,.hero small,.lgbtn';
function domCheck({ screen, sel }) {
  const issues = [], vw = window.innerWidth;
  for (const el of document.querySelectorAll(sel)) {
    if (!el.offsetParent || el.closest('[hidden]')) continue; const r = el.getBoundingClientRect(); if (!r.width) continue;
    const txt = (el.textContent || '').trim().slice(0, 60); if (!txt) continue;
    if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible') issues.push({ screen, kind: 'clipped', sel: el.className || el.id || el.tagName, text: txt, over: el.scrollWidth - el.clientWidth });
    else if (r.right > vw + 1 || r.left < -1) issues.push({ screen, kind: 'offscreen', sel: el.className || el.id || el.tagName, text: txt });
    else { const p = el.parentElement.getBoundingClientRect(); if (r.right > p.right + 2 || r.left < p.left - 2) issues.push({ screen, kind: 'spills', sel: el.className || el.id || el.tagName, text: txt }); }
  }
  const ov = document.getElementById('ov'); if (!ov.hidden && ov.scrollWidth > ov.clientWidth + 1) issues.push({ screen, kind: 'hscroll', text: 'overlay ' + (ov.scrollWidth - ov.clientWidth) + 'px' });
  if (document.documentElement.scrollWidth > vw + 1) issues.push({ screen, kind: 'hscroll', text: 'page' });
  return issues;
}
(async () => {
  const b = await chromium.launch(), all = [];
  for (const [vpn, vp] of [['phone', { width: 360, height: 640 }], ['desk', { width: 1280, height: 800 }]]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1 }); await ctx.addInitScript(() => { window.__RB_TEST__ = true; });
    const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + html + '?lang=' + code); await p.waitForTimeout(500);
    const shot = async (name) => { await p.waitForTimeout(650); await p.screenshot({ path: path.join(out, `${vpn}-${name}.png`) }); all.push(...(await p.evaluate(domCheck, { screen: `${vpn}:${name}`, sel: DOMSEL }))); };
    const canvasCheck = async (name, setup) => {
      const r = await p.evaluate(({ setup, name }) => { const R = window.__rb; R.QA.on = true; R.QA.fit.length = 0; R.QA.wrap.length = 0; (new Function('R', setup))(R); R.draw(performance.now()); R.draw(performance.now() + 400); const o = { fit: R.QA.fit.slice(), wrap: R.QA.wrap.slice() }; R.QA.on = false; return o; }, { setup, name });
      for (const f of r.fit) all.push({ screen: `${vpn}:${name}`, kind: 'canvas-small', text: f.s, detail: `${f.sz}px (tasarım ${f.size})` });
      for (const w of r.wrap) all.push({ screen: `${vpn}:${name}`, kind: 'canvas-cut', text: w.s, detail: `${w.sz}px` });
    };
    await shot('main');
    await p.click('[data-a="r"][data-id="rbmk"]'); await shot('reactor');
    await p.click('[data-s="test"]'); await shot('brief');
    await p.click('[data-a="go"]'); await p.waitForTimeout(300);
    const states = {
      run: "R.playing=false; for (let i=0;i<20*12;i++) R.tick(); R.playing=true;",
      alarm: "R.playing=false; const S=R.S; S.stepback=true; S.interlock=false; S.prot='off'; S.v=0.5; R.flags.trips=1; for (let i=0;i<3;i++) R.tick(); S.stepback=true; R.playing=true;",
      trip: "R.playing=false; R.trip(false,'m_trip_man'); for (let i=0;i<20*2;i++) R.tick(); R.playing=true;"
    };
    for (const ty of ['rbmk', 'pwr', 'bwr', 'candu']) {
      await p.evaluate(ty => { const R = window.__rb; R.initScenario(ty === 'rbmk' ? 'test' : 'train', ty); R.playing = true; document.getElementById('ov').hidden = true; }, ty);
      for (const [sn, setup] of Object.entries(states)) { await p.evaluate(s => (new Function('R', s))(window.__rb), setup); await canvasCheck(`${ty}-${sn}`, ''); if (ty === 'rbmk' || sn === 'run') await shot(`game-${ty}-${sn}`); }
      if (vpn === 'phone') { await p.evaluate(() => { window.__rb.VIEW = 'plant'; }); await canvasCheck(`${ty}-plant`, ''); await p.evaluate(() => { window.__rb.VIEW = 'core'; }); }
    }
    await p.evaluate(() => window.__rb.showTip('tip_margin')); await shot('tip'); await p.evaluate(() => window.__rb.closeTip());
    await p.evaluate(() => window.__rb.pauseMenu()); await shot('pause');
    await p.click('[data-a="set"]'); await shot('settings'); await p.evaluate(() => { document.getElementById('ov').scrollTop = 9999; }); await shot('settings2');
    await p.click('[data-a="back"]'); await p.click('[data-a="help"]'); await shot('help'); await p.evaluate(() => { document.getElementById('ov').scrollTop = 9999; }); await shot('help2');
    await p.click('[data-a="back"]'); await p.evaluate(() => { const R = window.__rb; R.initScenario('move', 'bwr'); R.playing = false; R.flags.trips = 2; R.flags.stepbacks = 1; R.flags.bypassUsed = true; for (let i = 0; i < 20 * 30; i++) R.tick(); R.trip(false, 'm_trip_man'); R.finish('done'); });
    await p.waitForTimeout(2600); await shot('report'); await p.evaluate(() => { document.getElementById('ov').scrollTop = 9999; }); await shot('report2');
    await p.evaluate(() => window.__rb.langPicker(() => window.__rb.mainMenu())); await shot('lang');
    for (const e of errs) all.push({ screen: vpn, kind: 'js-error', text: e });
    const miss = await p.evaluate(() => [...window.__rb.MISSING]); for (const k of miss) all.push({ screen: vpn, kind: 'missing-key', text: k });
    await ctx.close();
  }
  await b.close();
  const seen = new Set(), uniq = all.filter(i => { const k = i.kind + '|' + i.text + '|' + i.screen.split(':')[0]; if (seen.has(k)) return false; seen.add(k); return true; });
  fs.writeFileSync(path.join(out, 'qa.json'), JSON.stringify(uniq, null, 1));
  const by = {}; for (const i of uniq) by[i.kind] = (by[i.kind] || 0) + 1;
  console.log(`${code}: ${uniq.length ? uniq.length + ' sorun ' + JSON.stringify(by) : 'sorun yok'} · ekranlar ${out}`);
  for (const i of uniq.slice(0, 40)) console.log(`  [${i.kind}] ${i.screen} ${i.sel ? '(' + i.sel + ') ' : ''}"${i.text}"${i.detail ? ' ' + i.detail : ''}${i.over ? ' +' + i.over + 'px' : ''}`);
  if (uniq.length > 40) console.log(`  … +${uniq.length - 40} (qa.json)`);
  process.exit(uniq.length ? 1 : 0);
})();
