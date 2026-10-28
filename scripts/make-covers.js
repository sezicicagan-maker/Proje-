// CrazyGames kapak görselleri: store/web/covers/*.png (16:9 1920x1080, 2:3 800x1200, 1:1 800x800). Gereken: playwright.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const root = path.join(__dirname, '..'), out = path.join(root, 'store', 'web', 'covers'); fs.mkdirSync(out, { recursive: true });
const body = fs.readFileSync(path.join(root, 'prototype', 'evolute.html'), 'utf8');
const BOT = fs.readFileSync(path.join(root, 'tests', 'test.js'), 'utf8').match(/const BOT = `([\s\S]*?)`;/)[1];
const tmp = path.join(out, '_wrapped.html');
fs.writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{color-scheme:light}body{margin:0}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
(async () => {
  const b = await chromium.launch();
  // 1) güncel oyun görüntüsü
  const ctx = await b.newContext({ viewport: { width: 360, height: 720 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  await ctx.addInitScript(() => { window.__EVO_TEST__ = true; });
  const p = await ctx.newPage(); await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await p.goto('file://' + tmp, { waitUntil: 'domcontentloaded' }); await p.evaluate(BOT);
  await p.evaluate(() => { const E = window.__evolute; E.save.tut = 1; E.save.up = { atk: 10, hp: 6, spawn: 6 }; E.save.era = 1; E.save.unlocked = 1; E.newGame(); let s = 0; while (s < 700) { E.step(0.05); s++; if (E.g.mode === 'pick') E.pickMut(E.g.pickOffer[0]); if (s % 5 === 0 && E.g.mode === 'play') window.__bot(E); } });
  await p.waitForTimeout(300);
  const shot = 'data:image/png;base64,' + (await p.locator('#stage').screenshot()).toString('base64');
  const icon = 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'store', 'icon-512.png')).toString('base64');
  const page = (W, H, layout) => `<html><body style="margin:0;width:${W}px;height:${H}px;overflow:hidden;font-family:'Trebuchet MS',Arial,sans-serif;background:radial-gradient(circle at 30% 20%,#27528f,#0c1a2e 70%);position:relative">
  ${layout(W, H)}</body></html>`;
  const title = (s, tag) => `<div style="font-weight:900;letter-spacing:.08em;font-size:${s}px;color:#fff;text-shadow:0 6px 0 #1d3556,0 0 40px #5fe3ff88">EVOLUTE</div><div style="font-weight:800;font-size:${s * .34}px;color:#ff9a4a;margin-top:${s * .08}px">Merge. Evolve. Conquer.</div>${tag ? `<div style="font-size:${s * .22}px;color:#9fb6d6;margin-top:${s * .1}px">6 eras · 4 modes · 144 species</div>` : ''}`;
  const phone = (h) => `<img src="${shot}" style="height:${h}px;border-radius:${h * .05}px;box-shadow:0 20px 60px #000a,0 0 0 ${h * .01}px #1d3556">`;
  const L = {
    'cover-16x9-1920x1080': [1920, 1080, (W, H) => `<div style="position:absolute;left:120px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center">${title(190, 1)}<img src="${icon}" style="width:200px;margin-top:60px;border-radius:44px"></div><div style="position:absolute;right:130px;top:50%;transform:translateY(-50%)">${phone(960)}</div>`],
    'cover-2x3-800x1200': [800, 1200, (W, H) => `<div style="position:absolute;top:60px;width:100%;text-align:center">${title(120, 0)}</div><div style="position:absolute;bottom:40px;width:100%;text-align:center">${phone(800)}</div>`],
    'cover-1x1-800x800': [800, 800, (W, H) => `<div style="position:absolute;left:50px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;width:420px">${title(86, 0)}<img src="${icon}" style="width:130px;margin-top:40px;border-radius:30px"></div><div style="position:absolute;right:40px;top:50%;transform:translateY(-50%)">${phone(640)}</div>`],
  };
  for (const [name, [W, H, fn]] of Object.entries(L)) {
    const c = await b.newContext({ viewport: { width: W, height: H } }); const q = await c.newPage(); await q.setContent(page(W, H, fn)); await q.waitForTimeout(200);
    await q.screenshot({ path: path.join(out, name + '.png') }); await c.close(); console.log(name);
  }
  fs.rmSync(tmp); await b.close();
})();
