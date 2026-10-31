// Santral şeması önizleme: node tests/tools/plant-preview.js <rbmk|pwr|bwr|candu> <çıktı klasörü>
// Yalnız o türün 04-plant-<tür>.js modülüyle derler, 4 durumda (full, low, tripped, stress) şema panelini
// yüksek çözünürlükte kırpar, ayrıca telefonda gerçek boyutta bir ekran görüntüsü alır ve çizim süresini ölçer.
const { chromium } = require('playwright'); const path = require('path'); const { execFileSync } = require('child_process'); const fs = require('fs');
const type = process.argv[2], out = path.resolve(process.argv[3] || '.');
if (!['rbmk', 'pwr', 'bwr', 'candu'].includes(type)) { console.error('tür: rbmk|pwr|bwr|candu'); process.exit(1); }
fs.mkdirSync(out, { recursive: true });
const html = path.join(out, `game-${type}.html`);
execFileSync('node', [path.join(__dirname, '..', '..', 'scripts', 'build-rbmk.js'), '--plant', type, '--out', html], { stdio: 'inherit' });
const STATES = ['full', 'low', 'tripped', 'stress'];
function setup({ st, type }) {
  const R = window.__rb; R.initScenario('sand', type); R.playing = false; const S = R.S, run = s => { for (let i = 0; i < s * 20; i++) R.tick(); };
  if (st === 'full') run(40);
  if (st === 'low') { if (type === 'pwr') S.Dset = 0.4; else S.nSet = 0.4; run(120); }
  if (st === 'tripped') { run(20); R.trip(false, 'm_trip_man'); run(15); }
  if (st === 'stress') {
    if (type === 'rbmk') { S.flowTarget = 0.6; run(30); }
    else if (type === 'pwr') { S.Dset = 1; S.boronTarget = 700; run(30); }
    else if (type === 'bwr') { S.auto = false; S.flowTarget = 0.6; run(30); }
    else { S.nSet = 0.08; run(90); }
  }
  R.VIEW = 'plant';
  return { n: +S.n.toFixed(3), flow: +S.flow.toFixed(2), void: +S.v.toFixed(3), Tm: +S.Tm.toFixed(1), boron: Math.round(S.boron), az: S.az, p: +S.p.toFixed(2) };
}
(async () => {
  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(() => { window.__RB_TEST__ = true; });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + html + '?lang=en'); await p.waitForTimeout(400);
  await p.evaluate(() => { document.getElementById('ov').hidden = true; });
  for (const st of STATES) {
    const info = await p.evaluate(setup, { st, type }).catch(e => ({ error: e.message }));
    await p.waitForTimeout(350);
    const clip = await p.evaluate(() => { const R = window.__rb, r = document.getElementById('c').getBoundingClientRect(), L = R.LAYOUT, k = r.width / L.W, q = L.r.plant; return { x: r.left + q.x * k, y: r.top + q.y * k, width: q.w * k, height: q.h * k }; });
    await p.screenshot({ path: path.join(out, `${type}-${st}.png`), clip });
    console.log(st, JSON.stringify(info));
  }
  const perf = await p.evaluate(() => { const R = window.__rb; const t0 = performance.now(); for (let i = 0; i < 120; i++) R.draw(performance.now() + i * 16); return (performance.now() - t0) / 120; });
  const err = await p.evaluate(() => String(window.__rb.PLANT_ERR));
  // telefon, gerçek boyut
  const c2 = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); await c2.addInitScript(() => { window.__RB_TEST__ = true; });
  const p2 = await c2.newPage(); p2.on('pageerror', e => errs.push(e.message)); await p2.goto('file://' + html + '?lang=en'); await p2.waitForTimeout(400);
  await p2.evaluate(() => { document.getElementById('ov').hidden = true; }); await p2.evaluate(setup, { st: 'full', type }); await p2.waitForTimeout(350);
  await p2.screenshot({ path: path.join(out, `${type}-phone.png`) });
  console.log(`draw() ortalama ${perf.toFixed(2)} ms/kare (tüm panel) · PLANT_ERR ${err} · sayfa hataları ${JSON.stringify(errs)}`);
  console.log('çıktılar:', STATES.map(s => `${type}-${s}.png`).join(', '), `${type}-phone.png`);
  await b.close();
})();
