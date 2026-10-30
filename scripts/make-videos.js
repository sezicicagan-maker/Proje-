// CrazyGames önizleme videoları: store/web/videos/preview-landscape.mp4 (1920x1080) ve preview-portrait.mp4 (1080x1620, 2:3), ~18 sn. Gereken: playwright + ffmpeg.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..'), out = path.join(root, 'store', 'web', 'videos'); fs.mkdirSync(out, { recursive: true });
const body = fs.readFileSync(path.join(root, 'prototype', 'evolute.html'), 'utf8');
const BOT = fs.readFileSync(path.join(root, 'tests', 'test.js'), 'utf8').match(/const BOT = `([\s\S]*?)`;/)[1];
const tmp = path.join(out, '_wrapped.html');
fs.writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{color-scheme:dark}body{margin:0;background:#07101d}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
(async () => {
  const b = await chromium.launch();
  for (const [name, w, h, W, H] of [['landscape', 1280, 720, 1920, 1080], ['portrait', 720, 1080, 1080, 1620]]) {
    const vdir = path.join(out, '_rec_' + name); fs.rmSync(vdir, { recursive: true, force: true });
    const ctx = await b.newContext({ viewport: { width: w, height: h }, recordVideo: { dir: vdir, size: { width: w, height: h } }, locale: 'en-US' });
    await ctx.addInitScript(() => { window.__EVO_TEST__ = true; });
    const p = await ctx.newPage(); await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await p.goto('file://' + tmp, { waitUntil: 'domcontentloaded' }); await p.evaluate(BOT);
    await p.evaluate(() => { const E = window.__evolute; E.setLang('en'); E.save.tut = 1; E.save.up = { atk: 9, hp: 7, spawn: 7 }; E.save.era = 1; E.save.unlocked = 1; E.save.speed = 2; E.showMenu(); });
    await p.waitForTimeout(2500);
    await p.evaluate(() => { const E = window.__evolute; E.newGame(); window.__vid = setInterval(() => { if (E.g && E.g.mode === 'pick') E.pickMut(E.g.pickOffer[0]); else if (E.g && E.g.mode === 'play') window.__bot(E); }, 140); });
    await p.waitForTimeout(16000); await ctx.close();
    const webm = fs.readdirSync(vdir).find(f => f.endsWith('.webm'));
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(vdir, webm), '-t', '18', '-vf', `scale=${W}:${H}:flags=lanczos,fps=30`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-an', path.join(out, `preview-${name}.mp4`)]);
    fs.rmSync(vdir, { recursive: true, force: true }); console.log(name);
  }
  fs.rmSync(tmp); await b.close();
})();
