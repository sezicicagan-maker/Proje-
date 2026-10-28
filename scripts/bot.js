// Mağaza görselleri ve denge testleri için basit otomatik oyuncu (sayfa içinde çalışır).
window.__bot = function (E) {
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
