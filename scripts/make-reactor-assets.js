// Reactor Lab tanıtım paketi (Poki vb.): store/poki/ altına ekran görüntüleri, kapaklar ve oynanış videoları.
// Gereken: playwright + ffmpeg. Kullanım: node scripts/make-reactor-assets.js
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..'), out = path.join(root, 'store', 'poki'), game = path.join(root, 'games', 'rbmk-sim', 'index.html');
fs.mkdirSync(out, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));
async function page(b, vp, dsf, video) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: dsf, locale: 'en-US', ...(video ? { recordVideo: { dir: video, size: vp } } : {}) });
  await ctx.addInitScript(() => { window.__RB_TEST__ = true; try { localStorage.setItem('reactorlab_v2', JSON.stringify({ lang: 'en', hints: false, cr: 420, up: { 'rbmk:fastaz': 1 }, stars: { 'rbmk:train': 3, 'pwr:train': 2, 'bwr:train': 1 } })); } catch (e) {} });
  const p = await ctx.newPage(); await p.goto('file://' + game + '?lang=en'); await p.waitForTimeout(600); return { ctx, p };
}
const S = {
  run: (ty, sn, sec, extra) => `(() => { const R = window.__rb; R.initScenario('${sn}', '${ty}'); document.getElementById('ov').hidden = true; R.playing = false; ${extra || ''}; for (let i = 0; i < 20 * ${sec}; i++) R.tick(); R.playing = true; })()`,
  excursion: `(() => { const R = window.__rb, S = R.S; R.setBypass(true); S.auto = false; S.pTarget = 0; for (let i = 0; i < 20 * 400 && R.ts > 0.5; i++) R.tick(); for (let i = 0; i < 6; i++) R.tick(); R.playing = true; })()`
};
(async () => {
  const b = await chromium.launch();
  /* 1) Yatay ekran görüntüleri 1920x1080 */
  { const { ctx, p } = await page(b, { width: 1280, height: 720 }, 1.5);
    const shot = async n => { await p.waitForTimeout(700); await p.screenshot({ path: path.join(out, `screenshot-${n}-1920x1080.png`) }); console.log(n); };
    await shot('1-menu');
    await p.evaluate(() => { const R = window.__rb; R.save.hats = Object.assign({ party: 1 }, R.save.hats, { crown: 1 }); R.save.hat = 'crown'; R.kidsStart(3); }); await p.fill('#klev', '45'); await p.waitForTimeout(5000); await shot('0-kids');
    await p.evaluate(S.run('pwr', 'train', 45)); await shot('2-pwr-plant');
    await p.evaluate(S.run('rbmk', 'sand', 20)); await p.evaluate(S.excursion); await shot('3-rbmk-excursion');
    { const r = await p.evaluate(() => { const R = window.__rb, L = R.LAYOUT, c = document.getElementById('c').getBoundingClientRect(), k = c.width / L.W, q = L.r.core; return { x: c.left + q.x * k, y: c.top + q.y * k, width: q.w * k, height: q.h * k }; });
      await p.evaluate(() => { document.getElementById('toast').innerHTML = ''; }); await p.screenshot({ path: path.join(out, '_core.png'), clip: r }); }
    await p.evaluate(() => { const R = window.__rb; R.playing = false; for (let i = 0; i < 20 * 120 && !R.S.destroyed; i++) R.tick(); R.playing = true; document.getElementById('toast').innerHTML = ''; }); await p.waitForTimeout(450); await p.screenshot({ path: path.join(out, 'screenshot-4-explosion-1920x1080.png') }); console.log('4');
    await p.evaluate(S.run('bwr', 'train', 150)); await p.waitForTimeout(3200); await p.screenshot({ path: path.join(out, 'screenshot-5-report-1920x1080.png') }); console.log('5');
    await p.evaluate(() => { const R = window.__rb; R.upgradesScreen('rbmk', () => R.mainMenu()); }); await shot('6-upgrades');
    await ctx.close(); }
  /* 2) Dikey ekran görüntüleri 1080x1920 */
  { const { ctx, p } = await page(b, { width: 405, height: 720 }, 1080 / 405);
    await p.waitForTimeout(700); await p.screenshot({ path: path.join(out, 'portrait-1-menu-1080x1920.png') });
    await p.evaluate(() => { const R = window.__rb; R.kidsStart(2); }); await p.fill('#klev', '50'); await p.waitForTimeout(5000); await p.screenshot({ path: path.join(out, 'portrait-0-kids-1080x1920.png') });
    await p.evaluate(() => { const R = window.__rb; R.save.hats = Object.assign({ party: 1 }, R.save.hats, { wizard: 1 }); R.save.hat = 'wizard'; R.kidsStart(5); }); await p.fill('#klev', '100'); await p.waitForTimeout(7000); await p.screenshot({ path: path.join(out, 'portrait-0b-kids-hot-1080x1920.png') });
    { const r = await p.evaluate(() => { const c = document.getElementById('kc').getBoundingClientRect(); return { x: c.left, y: c.top, width: c.width, height: c.height }; }); await p.evaluate(() => { const R = window.__rb; R.save.hat = 'crown'; R.kidsStart(4); }); await p.fill('#klev', '40'); await p.waitForTimeout(4000); await p.screenshot({ path: path.join(out, '_kids.png'), clip: r }); }
    await p.evaluate(() => { const R = window.__rb; R.mainMenu(); });
    await p.evaluate(S.run('rbmk', 'sand', 20)); await p.evaluate(S.excursion); await p.waitForTimeout(600); await p.screenshot({ path: path.join(out, 'portrait-2-excursion-1080x1920.png') });
    await p.evaluate(S.run('candu', 'train', 40, 'R.VIEW = "plant"')); await p.evaluate(() => { window.__rb.VIEW = 'plant'; }); await p.waitForTimeout(700); await p.screenshot({ path: path.join(out, 'portrait-3-candu-plant-1080x1920.png') });
    console.log('portrait'); await ctx.close(); }
  /* 3) Kapaklar: oyun görüntüsü + başlık */
  { const bg = fs.readFileSync(path.join(out, '_kids.png')).toString('base64'), core = bg;
    const html = (w, h, size) => `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;width:${w}px;height:${h}px;overflow:hidden;background:#060b14;font-family:Inter,'Trebuchet MS',sans-serif}
      .bg{position:absolute;inset:-4%;background:url(data:image/png;base64,${bg}) center/cover;filter:saturate(1.2);transform:scale(1)}
      .vg{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 55%,rgba(10,20,50,.75) 100%)}
      .t{position:absolute;left:0;right:0;bottom:${Math.round(h * 0.07)}px;text-align:center;color:#fff}
      h1{margin:0;font-size:${size}px;font-weight:900;letter-spacing:.06em;line-height:1;background:linear-gradient(180deg,#fff,#ffd27a 55%,#ff7b3d);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 6px 18px rgba(0,0,0,.9)) drop-shadow(0 0 30px rgba(255,120,40,.6))}
      p{margin:${Math.round(size * 0.2)}px 0 0;font-size:${Math.round(size * 0.24)}px;font-weight:800;letter-spacing:.18em;color:#bfe6ff;text-shadow:0 2px 10px #000}
      ._core{position:absolute;left:50%;top:${Math.round(h * 0.42)}px;width:${Math.round(Math.min(w, h) * 0.62)}px;height:${Math.round(Math.min(w, h) * 0.62)}px;transform:translate(-50%,-50%);border-radius:50%;background:url(data:image/png;base64,${core}) 50% 47%/150% auto no-repeat;box-shadow:0 0 0 6px rgba(255,140,60,.55),0 0 80px 20px rgba(255,110,40,.55),0 0 200px 60px rgba(255,60,30,.3)}</style></head>
      <body><div class="bg"></div><div class="vg"></div><div class="t"><h1>REACTOR BUDDY</h1><p>POWER THE CITY!</p></div></body></html>`;
    for (const [n, w, h, size] of [['1x1-1024', 1024, 1024, 130], ['16x9-1920x1080', 1920, 1080, 170], ['2x3-800x1200', 800, 1200, 104]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage(); await p.setContent(html(w, h, size)); await p.waitForTimeout(300);
      await p.screenshot({ path: path.join(out, `cover-${n}.png`) }); await ctx.close(); console.log('cover', n);
    } }
  /* 4) Videolar ~25 sn: menü -> PWR -> RBMK sıçrama -> patlama -> rapor */
  for (const [name, vp, W, H] of [['landscape', { width: 1280, height: 720 }, 1920, 1080], ['portrait', { width: 405, height: 720 }, 1080, 1920]]) {
    const vdir = path.join(out, '_rec_' + name); fs.rmSync(vdir, { recursive: true, force: true });
    const { ctx, p } = await page(b, vp, 1, vdir);
    await wait(1500);
    await p.evaluate(() => { const R = window.__rb; R.save.hats = Object.assign({ party: 1 }, R.save.hats, { crown: 1 }); R.save.hat = 'crown'; R.kidsStart(3); }); await p.fill('#klev', '45'); await wait(3500); await p.fill('#klev', '95'); await wait(3500); await p.click('#kwater'); await wait(1500); await p.fill('#klev', '50'); await wait(2500);
    await p.evaluate(() => { const R = window.__rb; const K = R.K; K.t = K.dur - 0.1; K.green = K.tot * 0.95; }); await wait(3500);
    await p.evaluate(() => { const R = window.__rb; document.getElementById('kids').hidden = true; R.go('train'); }); await wait(500);
    await p.evaluate(() => { const R = window.__rb; R.playing = false; for (let i = 0; i < 20 * 25; i++) R.tick(); R.playing = true; }); await wait(3000);
    await p.evaluate(() => { const R = window.__rb; R.initScenario('train', 'pwr'); R.playing = false; for (let i = 0; i < 20 * 40; i++) R.tick(); R.playing = true; if (R.WIDE === false) R.VIEW = 'plant'; }); await wait(3500);
    await p.evaluate(() => { const R = window.__rb; R.initScenario('sand', 'rbmk'); R.playing = false; for (let i = 0; i < 20 * 15; i++) R.tick(); R.setBypass(true); R.S.auto = false; R.S.pTarget = 0; R.playing = true; });
    for (let i = 0; i < 60; i++) { const ok = await p.evaluate(() => window.__rb.ts < 0.5); if (ok) break; await p.evaluate(() => { const R = window.__rb; R.playing = false; for (let j = 0; j < 20; j++) R.tick(); R.playing = true; }); await wait(60); }
    await wait(3000);
    for (let i = 0; i < 40; i++) { const d = await p.evaluate(() => window.__rb.S.destroyed); if (d) break; await p.evaluate(() => { const R = window.__rb; R.playing = false; for (let j = 0; j < 4; j++) R.tick(); R.playing = true; }); await wait(70); }
    await p.evaluate(() => { const R = window.__rb; if (!R.S.destroyed) { R.playing = false; for (let i = 0; i < 20 * 60 && !R.S.destroyed; i++) R.tick(); R.playing = true; } }); await wait(6000);
    await ctx.close();
    const webm = fs.readdirSync(vdir).find(f => f.endsWith('.webm'));
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(vdir, webm), '-ss', '0.6', '-t', '38', '-vf', `scale=${W}:${H}:flags=lanczos,fps=30`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-an', path.join(out, `gameplay-${name}-${W}x${H}.mp4`)]);
    fs.rmSync(vdir, { recursive: true, force: true }); console.log('video', name);
  }
  fs.rmSync(path.join(out, '_core.png'), { force: true }); fs.rmSync(path.join(out, '_kids.png'), { force: true }); await b.close();
})();
