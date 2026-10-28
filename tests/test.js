const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const path = require('path'); const SCR = path.join(__dirname, 'out');
const SRC = path.join(__dirname, '..', 'prototype', 'evolute.html');

// Artifact iskeletini taklit eden sarmalayıcı (publish sırasında platform ekler).
const body = fs.readFileSync(SRC, 'utf8');
const wrapped = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui}[hidden]{display:none!important}</style></head><body>${body}</body></html>`;
const FILE = path.join(SCR, 'wrapped.html');
fs.writeFileSync(FILE, wrapped);

const BOT = `
window.__bot = function(E){
  const g = E.g; let acted = true, guard = 0;
  while (acted && guard++ < 30) {
    acted = false;
    const p = E.findPair();
    if (p) {
      const [i, j] = p;
      const threat = c => { let m = -1; for (const e of g.enemies) if (e.lane === c && !e.dead) m = Math.max(m, e.y); return m; };
      const to = threat(i % E.COLS) >= threat(j % E.COLS) ? i : j;
      const from = to === i ? j : i;
      E.drop(from, to); acted = true;
    }
  }
  while (E.spawnManual()) {}
};
window.__sim = function(runs, up, forceMut, era){
  const E = window.__evolute; const keep = JSON.stringify(E.save);
  const out = { wins: 0, wave: 0, tier: 0, kills: 0, t: 0, firstMerge: 0, crashes: 0 };
  for (let n = 0; n < runs; n++) {
    E.save.up = Object.assign({atk:0,hp:0,spawn:0}, up || {}); E.save.era = era || 0;
    E.newGame();
    if (forceMut) E.g.muts[forceMut] = 1;
    let steps = 0;
    try {
      while (E.g.mode !== 'over' && steps < 12000) {
        E.step(0.05); steps++;
        if (E.g.mode === 'pick') {
          const offer = E.g.pickOffer; E.pickMut(offer[Math.floor(Math.random() * offer.length)]);
        }
        if (steps % 6 === 0 && E.g.mode === 'play') window.__bot(E);
      }
    } catch (e) { out.crashes++; out.err = String(e && e.stack || e); }
    const g = E.g;
    if (g.win) out.wins++;
    out.wave += g.waveReached; out.tier += g.maxTier; out.kills += g.kills; out.t += g.t; out.firstMerge += (g.firstMerge ?? 99);
  }
  for (const k of ['wave','tier','kills','t','firstMerge']) out[k] = +(out[k] / runs).toFixed(2);
  out.winRate = +(out.wins / runs).toFixed(2);
  Object.assign(E.save, JSON.parse(keep));
  return out;
};
`;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await ctx.addInitScript(() => { window.__EVO_TEST__ = true; }); const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_FAILED|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto('file://' + FILE, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ content: BOT });
  await page.waitForTimeout(400);
  await page.screenshot({ path: SCR + '/01-menu.png' });

  // 1) Başla -> oyun modu
  await page.click('[data-act="start"]');
  const mode1 = await page.evaluate(() => window.__evolute.mode);
  console.log('mode after start:', mode1);

  // 2) Gerçek sürükle-bırak: (4,0) -> (4,1) iki Su tier-1
  const info = await page.evaluate(() => {
    const E = window.__evolute; const r = document.getElementById('c').getBoundingClientRect();
    const pt = (row, col) => { const [x, y] = E.cellXY(row, col); return [r.left + (x / 360) * r.width, r.top + (y / 720) * r.height]; };
    return { a: pt(4, 0), b: pt(4, 1), board: E.g.board.map(u => u && [u.el, u.tier]) };
  });
  await page.waitForTimeout(300);
  await page.mouse.move(info.a[0], info.a[1]);
  await page.mouse.down();
  await page.mouse.move((info.a[0] + info.b[0]) / 2, info.a[1] - 10, { steps: 4 });
  await page.screenshot({ path: SCR + '/02-dragging.png' });
  await page.mouse.move(info.b[0], info.b[1], { steps: 4 });
  await page.mouse.up();
  const after = await page.evaluate(() => { const g = window.__evolute.g; return { merges: g.merges, maxTier: g.maxTier, first: g.firstMerge, cell: g.board[4 * 5 + 1] && [g.board[4 * 5 + 1].el, g.board[4 * 5 + 1].tier], from: g.board[4 * 5] }; });
  console.log('drag merge ->', JSON.stringify(after));

  // 3) Manuel üretim düğmesi (gerçek tıklama)
  const btn = await page.evaluate(() => { const r = document.getElementById('c').getBoundingClientRect(); return [r.left + (180 / 360) * r.width, r.top + (696 / 720) * r.height]; });
  const before = await page.evaluate(() => ({ n: window.__evolute.g.board.filter(Boolean).length, gold: window.__evolute.g.gold }));
  await page.mouse.click(btn[0], btn[1]);
  const afterBtn = await page.evaluate(() => ({ n: window.__evolute.g.board.filter(Boolean).length, gold: window.__evolute.g.gold }));
  console.log('spawn button:', JSON.stringify(before), '->', JSON.stringify(afterBtn));

  // 4) Hızlandırılmış oyun: ekran görüntüleri için 25 sn oyna
  await page.evaluate(() => { const E = window.__evolute; for (let i = 0; i < 700; i++) { E.step(0.05); if (E.g.mode === 'pick') E.pickMut(E.g.pickOffer[0]); if (i % 6 === 0 && E.g.mode === 'play') window.__bot(E); } });
  await page.screenshot({ path: SCR + '/03-play.png' });
  // pick ekranı: 2. dalga zaten geçildi; yeni oyunda zorla
  await page.evaluate(() => { const E = window.__evolute; E.newGame(); for (let i = 0; i < 400 && E.g.mode !== 'pick'; i++) { E.step(0.05); if (i % 6 === 0 && E.g.mode === 'play') window.__bot(E); } });
  console.log('pick mode reached:', await page.evaluate(() => window.__evolute.mode));
  await page.screenshot({ path: SCR + '/04-pick.png' });
  await page.click('[data-pick]');
  console.log('mode after pick:', await page.evaluate(() => window.__evolute.mode));
  // boss ve sonuç ekranı
  await page.evaluate(() => { const E = window.__evolute; let s = 0; while (E.g.waveStarted < 10 && s < 5000) { E.step(0.05); s++; if (E.g.mode === 'pick') E.pickMut(E.g.pickOffer[0]); if (s % 6 === 0 && E.g.mode === 'play') window.__bot(E); } for (let i = 0; i < 80; i++) { E.step(0.05); if (i % 6 === 0 && E.g.mode === 'play') window.__bot(E); } });
  await page.screenshot({ path: SCR + '/05-boss.png' });
  await page.evaluate(() => { const E = window.__evolute; E.endRun(false); for (let i = 0; i < 40; i++) E.step(0.05); });
  console.log('mode at end:', await page.evaluate(() => window.__evolute.mode));
  await page.screenshot({ path: SCR + '/06-result.png' });

  // 5) Denge simülasyonu
  const base = await page.evaluate(() => window.__sim(150, {}));
  console.log('SIM yükseltmesiz  :', JSON.stringify(base));
  const mid = await page.evaluate(() => window.__sim(150, { atk: 4, hp: 3, spawn: 3 }));
  console.log('SIM orta yükseltme:', JSON.stringify(mid));
  const high = await page.evaluate(() => window.__sim(150, { atk: 10, hp: 6, spawn: 6 }));
  console.log('SIM yüksek        :', JSON.stringify(high));
  for (const m of ['boom', 'fast', 'syn', 'crit', 'slow', 'tox', 'volt']) {
    const r = await page.evaluate(m => window.__sim(100, {}, m), m);
    console.log(`SIM mutasyon ${m.padEnd(5)}:`, JSON.stringify(r));
  }

  console.log('ERRORS:', errors.length ? errors : 'yok');
  await browser.close();
})();
