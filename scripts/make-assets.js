// Uygulama ikonu, açılış ekranı ve Google Play mağaza görsellerini üretir.
// Gereksinim: playwright (npm i -D playwright) ve prototype/evolute.html.
// Çalıştır: node scripts/make-assets.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const A = p => path.join(root, 'assets', p), S = p => path.join(root, 'store', p);

const creature = (size, extra) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="b" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#7cc8ff"/><stop offset="1" stop-color="#2b8ee0"/></radialGradient>
  </defs>
  ${extra || ''}
  <ellipse cx="512" cy="770" rx="250" ry="48" fill="#000" opacity=".28"/>
  <circle cx="512" cy="500" r="270" fill="url(#b)" stroke="#1d6fb8" stroke-width="26"/>
  <ellipse cx="420" cy="360" rx="95" ry="42" transform="rotate(-28 420 360)" fill="#fff" opacity=".32"/>
  <circle cx="430" cy="470" r="52" fill="#fff"/><circle cx="594" cy="470" r="52" fill="#fff"/>
  <circle cx="436" cy="486" r="26" fill="#10243f"/><circle cx="600" cy="486" r="26" fill="#10243f"/>
  <path d="M440 590 Q512 650 584 590" fill="none" stroke="#10243f" stroke-width="22" stroke-linecap="round"/>
  <text x="512" y="720" text-anchor="middle" font-family="Fredoka, Arial Rounded MT Bold, sans-serif" font-weight="700" font-size="120" fill="#10243f" opacity=".0">8</text>
</svg>`;
const helix = (x, flip) => {
  let a = '', b = '', r = '';
  for (let i = 0; i <= 40; i++) { const u = i / 40, y = 150 + u * 720, xa = x + Math.sin(u * 6.2832 * 2.2 + (flip ? 3.14 : 0)) * 46, xb = x - Math.sin(u * 6.2832 * 2.2 + (flip ? 3.14 : 0)) * 46; a += (i ? 'L' : 'M') + xa.toFixed(1) + ' ' + y.toFixed(1); b += (i ? 'L' : 'M') + xb.toFixed(1) + ' ' + y.toFixed(1); if (i % 4 === 2) r += `<line x1="${xa.toFixed(1)}" y1="${y.toFixed(1)}" x2="${xb.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#fff" stroke-opacity=".35" stroke-width="8"/>`; }
  return `<path d="${a}" fill="none" stroke="#5fe3ff" stroke-width="16" stroke-linecap="round" opacity=".55"/><path d="${b}" fill="none" stroke="#ff8ae2" stroke-width="16" stroke-linecap="round" opacity=".55"/>${r}`;
};
const sparks = `
  ${helix(150, false)}${helix(874, true)}
  <g opacity=".95">
    <polygon points="250,250 310,200 370,250 310,300" fill="#ffd23f" stroke="#c99a00" stroke-width="14"/>
    <polygon points="780,230 850,260 850,330 780,360 710,330 710,260" fill="#7bd34a" stroke="#4a9a24" stroke-width="14"/>
  </g>`;
const bg = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c3f73"/><stop offset="1" stop-color="#0b1626"/></linearGradient></defs><rect width="1024" height="1024" fill="url(#g)"/>`;

(async () => {
  const browser = await chromium.launch();
  const shot = async (html, w, h, out, opts) => {
    const pg = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await pg.setContent(`<style>html,body{margin:0;background:${(opts && opts.transparent) ? 'transparent' : '#0b1626'}}</style>${html}`);
    await pg.screenshot({ path: out, omitBackground: !!(opts && opts.transparent) });
    await pg.close();
  };
  // İkonlar
  await shot(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${bg}</svg>${''}`, 1024, 1024, A('icon-background.png'));
  await shot(`<div style="width:1024px;height:1024px;transform-origin:center;"><div style="transform:scale(.72);transform-origin:center;width:1024px;height:1024px">${creature(1024, sparks)}</div></div>`, 1024, 1024, A('icon-foreground.png'), { transparent: true });
  await shot(`<div style="position:relative;width:1024px;height:1024px"><svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" style="position:absolute">${bg}</svg><div style="position:absolute;inset:0;transform:scale(.9);transform-origin:center">${creature(1024, sparks)}</div></div>`, 1024, 1024, A('icon-only.png'));
  // Açılış ekranı
  const splash = `<div style="position:relative;width:2732px;height:2732px;background:#0b1626"><div style="position:absolute;left:866px;top:700px;width:1000px;height:1000px">${creature(1000)}</div>
    <div style="position:absolute;left:0;right:0;top:1750px;text-align:center;font:700 220px 'Fredoka','Arial Rounded MT Bold',Arial,sans-serif;letter-spacing:18px;color:#e9f2ff">EVOLUTE</div></div>`;
  await shot(splash, 2732, 2732, A('splash.png')); await shot(splash, 2732, 2732, A('splash-dark.png'));
  // Mağaza ikonu 512 ve öne çıkan görsel 1024x500
  const pg0 = await browser.newPage({ viewport: { width: 512, height: 512 } });
  await pg0.setContent(`<style>html,body{margin:0}</style><div style="position:relative;width:512px;height:512px"><svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 1024 1024" style="position:absolute">${bg}</svg><div style="position:absolute;inset:0;transform:scale(.9);transform-origin:center;width:512px;height:512px"><div style="transform:scale(.5);transform-origin:0 0">${creature(1024, sparks)}</div></div></div>`);
  await pg0.screenshot({ path: S('icon-512.png') }); await pg0.close();
  const feat = (title, sub) => `<div style="position:relative;width:1024px;height:500px;background:linear-gradient(135deg,#1c3f73,#0b1626);overflow:hidden;font-family:'Fredoka','Arial Rounded MT Bold',Arial,sans-serif">
    <div style="position:absolute;left:600px;top:20px;width:460px;height:460px"><div style="transform:scale(.45);transform-origin:0 0">${creature(1024, sparks)}</div></div>
    <div style="position:absolute;left:60px;top:150px;color:#e9f2ff;font-weight:700;font-size:96px;letter-spacing:8px">EVOLUTE</div>
    <div style="position:absolute;left:64px;top:270px;color:#ff8a3d;font-weight:700;font-size:42px">${title}</div>
    <div style="position:absolute;left:64px;top:330px;color:#92a9c8;font-size:28px">${sub}</div></div>`;
  await shot(feat('Merge. Evolve.', 'Lane-based merge roguelite · 3 eras · 72 species'), 1024, 500, S('feature-1024x500-en.png'));
  await shot(feat('Birleştir. Evrimleştir.', 'Şeritli merge roguelite · 3 çağ · 72 tür'), 1024, 500, S('feature-1024x500-tr.png'));

  // Oyun içi ekran görüntüleri (1080x1920), her dil için
  const cap = {
    en: ['Merge matching creatures', 'Fight in every lane', 'Pick a mutation', 'Beat the boss, unlock new eras', 'Fill the species codex'],
    tr: ['Aynı canlıları birleştir', 'Her şeritte savaş', 'Mutasyonunu seç', 'Boss\'u devir, yeni çağları aç', 'Tür kataloğunu doldur'],
  };
  const BOT = fs.readFileSync(path.join(__dirname, 'bot.js'), 'utf8');
  const src = fs.readFileSync(path.join(root, 'prototype', 'evolute.html'), 'utf8');
  const wrapped = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0}[hidden]{display:none!important}</style></head><body>${src}</body></html>`;
  const tmp = path.join(root, 'www-shot.html'); fs.writeFileSync(tmp, wrapped);
  for (const lang of ['en', 'tr']) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2.4, locale: lang === 'tr' ? 'tr-TR' : 'en-US', hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    await page.goto('file://' + tmp, { waitUntil: 'domcontentloaded' });
    await page.evaluate(BOT); await page.waitForTimeout(400);
    const grab = async name => { const b = await page.screenshot(); const f = S(`screenshots/raw-${lang}-${name}.png`); fs.writeFileSync(f, b); return b.toString('base64'); };
    const imgs = [];
    await page.evaluate(() => { const E = window.__evolute; E.save.tut = 1; E.save.up = { atk: 6, hp: 4, spawn: 4 }; E.save.dna = 140; E.newGame(); for (let i = 0; i < 70; i++) { E.step(0.05); if (i % 6 === 0) window.__bot(E); } });
    imgs.push(await grab('1'));
    await page.evaluate(() => { const E = window.__evolute; for (let i = 0; i < 420; i++) { E.step(0.05); if (E.g.mode === 'pick') E.pickMut(E.g.pickOffer[0]); if (i % 6 === 0 && E.g.mode === 'play') window.__bot(E); } });
    imgs.push(await grab('2'));
    await page.evaluate(() => { const E = window.__evolute; E.newGame(); let s = 0; while (E.g.mode !== 'pick' && s < 2000) { E.step(0.05); s++; if (s % 6 === 0 && E.g.mode === 'play') window.__bot(E); } });
    imgs.push(await grab('3'));
    await page.evaluate(() => { const E = window.__evolute; E.save.up = { atk: 14, hp: 9, spawn: 9 }; E.newGame(); let s = 0; while (!E.g.enemies.some(e => e.boss) && s < 8000) { E.step(0.05); s++; if (E.g.mode === 'pick') E.pickMut(E.g.pickOffer[s % 3]); if (s % 6 === 0 && E.g.mode === 'play') window.__bot(E); } for (let i = 0; i < 150; i++) { E.step(0.05); if (i % 6 === 0 && E.g.mode === 'play') window.__bot(E); } });
    imgs.push(await grab('4'));
    await page.evaluate(() => { const E = window.__evolute; E.save.era = 1; E.save.unlocked = 1; for (let e = 0; e < 2; e++) for (let el = 0; el < 3; el++) for (let t = 1; t <= 5 - el; t++) E.save.codex[e + ':' + el + ':' + t] = 1; E.showSettings(); });
    await page.evaluate(() => { document.querySelector('.ov').innerHTML = ''; });
    await page.evaluate(() => { const E = window.__evolute; E.save.dna = 0; });
    await page.evaluate(() => { document.getElementById('ov').hidden = true; });
    // katalog ekranı: menüden aç
    await page.evaluate(() => window.__evolute.showMenu());
    await page.click('[data-act="codex"]');
    imgs.push(await grab('5'));
    for (let i = 0; i < 5; i++) {
      const html = `<div style="width:1080px;height:1920px;position:relative;background:linear-gradient(180deg,#1c3f73,#0b1626);font-family:'Fredoka','Arial Rounded MT Bold',Arial,sans-serif;overflow:hidden">
        <div style="position:absolute;top:90px;left:0;right:0;text-align:center;color:#e9f2ff;font-weight:700;font-size:82px;padding:0 60px;line-height:1.1">${cap[lang][i]}</div>
        <img src="data:image/png;base64,${imgs[i]}" style="position:absolute;left:100px;top:330px;width:880px;border-radius:56px;box-shadow:0 30px 80px rgba(0,0,0,.5)"></div>`;
      await shot(html, 1080, 1920, S(`screenshots/${lang}-${i + 1}.png`));
    }
    await ctx.close();
  }
  fs.rmSync(tmp, { force: true });
  for (const f of fs.readdirSync(S('screenshots'))) if (f.startsWith('raw-')) fs.rmSync(S('screenshots/' + f));
  await browser.close();
  console.log('Görseller hazır: assets/ ve store/');
})();
