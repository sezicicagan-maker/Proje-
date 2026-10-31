// Çeviri denetimi: node scripts/i18n-check.js [dil ...]
// Hata (çıkış kodu 1): eksik/fazla anahtar, boş metin, {0} yer tutucu farkı, eksik çoğul kategorisi, bozuk JSON.
// Uyarı: İngilizceyle aynı kalmış metinler, alfabe uyumsuzluğu (ör. Japonca dosyada Japonca karakter yok), dar alanlarda aşırı uzunluk.
const fs = require('fs'), path = require('path');
const D = path.join(__dirname, '..', 'games', 'rbmk-sim', 'i18n'), META = JSON.parse(fs.readFileSync(path.join(D, '_meta.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(D, 'en.json'), 'utf8')), keys = Object.keys(en);
const only = process.argv.slice(2); let errors = 0, warns = 0;
const ph = v => (String(v).match(/\{0\}/g) || []).length;
const SAME_OK = /^(AZ-5|SCRAM|MW|ORM|PWR|BWR|CANDU|RBMK-1000|Tavg|\$|OK|%|STOP|Xe|Reactor Lab|REACTOR LAB|Normal|Total|Version \{0\}|Start)$/i;
const TIGHT = /^(a[A-Z]|lim_|prot_.*_s$|reset_trip|auto$|man$|test$|trip_|conf$|hdr|pl_|k_|lg_|t_|m_auto|m_red|m_full|u_|prot_(full|assist|off)$|tgt|slow|mw$)/;
const SCRIPT = { cjk: /[぀-ヿ㐀-鿿가-힯]/, arabic: /[؀-ۿ]/, devanagari: /[ऀ-ॿ]/, cyrillic: /[Ѐ-ӿ]/ };
const vals = v => typeof v === 'object' ? Object.values(v) : [v];
for (const code of Object.keys(META)) {
  if (code === 'en' || (only.length && !only.includes(code))) continue;
  const f = path.join(D, code + '.json'), m = META[code], E = [], W = [];
  if (!fs.existsSync(f)) { console.log(`${code}: DOSYA YOK`); errors++; continue; }
  let o; try { o = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.log(`${code}: JSON HATASI ${e.message}`); errors++; continue; }
  let cats = ['other']; try { cats = new Intl.PluralRules(m.locale || code).resolvedOptions().pluralCategories; } catch (e) {}
  const miss = keys.filter(k => !(k in o)), extra = Object.keys(o).filter(k => !(k in en));
  if (miss.length) E.push(`eksik ${miss.length}: ${miss.slice(0, 12).join(' ')}${miss.length > 12 ? ' …' : ''}`);
  if (extra.length) E.push(`fazla: ${extra.join(' ')}`);
  let same = [], script = 0, total = 0, long = [];
  for (const k of keys) {
    if (!(k in o)) continue; const a = en[k], b = o[k];
    if (typeof a === 'object') {
      if (typeof b !== 'object' || !b) { E.push(`${k}: çoğul nesne olmalı`); continue; }
      for (const c of cats) if (b[c] === undefined) E.push(`${k}: çoğul kategorisi "${c}" eksik (${m.locale})`);
      for (const [c, v] of Object.entries(b)) if (ph(v) !== ph(a.other) && !(c === 'one' && ph(v) === 0)) E.push(`${k}.${c}: {0} sayısı farklı`);
    } else {
      if (typeof b !== 'string' || !b.trim()) { E.push(`${k}: boş`); continue; }
      if (ph(a) !== ph(b)) E.push(`${k}: {0} sayısı farklı (${ph(a)} ≠ ${ph(b)})`);
      if (a === b && !SAME_OK.test(a) && a.length > 3) same.push(k);
      if (TIGHT.test(k)) { const ra = [...a].length, rb = [...b].length * (m.script === 'cjk' ? 1.8 : 1); if (rb > ra * 1.7 + 3) long.push(`${k}(${[...b].length}/${ra})`); }
    }
    for (const v of vals(b)) { total++; if (SCRIPT[m.script] && SCRIPT[m.script].test(v)) script++; }
  }
  if (same.length) W.push(`İngilizceyle aynı ${same.length}: ${same.slice(0, 15).join(' ')}`);
  if (SCRIPT[m.script] && script < total * 0.6) W.push(`alfabe: metinlerin yalnız %${Math.round(script / total * 100)}'i ${m.script}`);
  if (long.length) W.push(`dar alanda uzun: ${long.slice(0, 12).join(' ')}`);
  errors += E.length; warns += W.length;
  console.log(`${code.padEnd(3)} ${E.length ? 'HATA ' + E.length : 'tamam'}${W.length ? ' · uyarı ' + W.length : ''}`);
  for (const e of E) console.log('   ✗ ' + e); for (const w of W) console.log('   ! ' + w);
}
console.log(errors ? `\n${errors} hata, ${warns} uyarı` : `\nhata yok, ${warns} uyarı`); process.exit(errors ? 1 : 0);
