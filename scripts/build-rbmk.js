// Reactor Lab derleyici: games/rbmk-sim/src/shell.html + model.js + i18n/*.json + src/js/*.js -> games/rbmk-sim/index.html (tek dosya)
const fs = require('fs'), path = require('path');
const d = path.join(__dirname, '..', 'games', 'rbmk-sim');
const model = fs.readFileSync(path.join(d, 'model.js'), 'utf8').replace(/\/\*MODEL_(BEGIN|END)\*\//g, '').replace(/if \(typeof module[^\n]*\n?/, '');
const meta = JSON.parse(fs.readFileSync(path.join(d, 'i18n', '_meta.json'), 'utf8'));
const T = {}, LANGS = {};
// --langs en,tr: yalnız bu dilleri dahil et (dil QA için)
const li = process.argv.indexOf('--langs'), onlyL = li > 0 ? process.argv[li + 1].split(',') : null;
for (const code of Object.keys(meta)) {
  if (onlyL && !onlyL.includes(code)) continue;
  const f = path.join(d, 'i18n', code + '.json');
  if (!fs.existsSync(f)) continue;
  T[code] = JSON.parse(fs.readFileSync(f, 'utf8')); LANGS[code] = meta[code];
}
if (!T.en) throw new Error('i18n/en.json yok');
const safe = o => JSON.stringify(o).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const i18n = `const LANGS = ${safe(LANGS)};\nconst T = ${safe(T)};\n`;
const jsDir = path.join(d, 'src', 'js');
// --plant <tür>: yalnız bu türün şema modülünü dahil et (paralel önizleme için)
const pi = process.argv.indexOf('--plant'), only = pi > 0 ? process.argv[pi + 1] : null;
const js = fs.readdirSync(jsDir).filter(f => f.endsWith('.js') && (!only || !/^04-plant-/.test(f) || f === `04-plant-${only}.js`)).sort().map(f => `/* ==== ${f} ==== */\n` + fs.readFileSync(path.join(jsDir, f), 'utf8')).join('\n');
const shell = fs.readFileSync(path.join(d, 'src', 'shell.html'), 'utf8');
const html = shell.replace('/*MODEL*/', () => model).replace('/*I18N*/', () => i18n).replace('/*JS*/', () => js);
const script = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
try { new Function(script); } catch (e) { console.error('SÖZDİZİMİ HATASI:', e.message); process.exit(1); }
// --out <dosya>: başka bir yere yaz (önizleme araçları için)
const oi = process.argv.indexOf('--out'), out = oi > 0 ? path.resolve(process.argv[oi + 1]) : path.join(d, 'index.html');
fs.writeFileSync(out, html);
console.log(`${path.relative(process.cwd(), out)} (${Math.round(html.length / 1024)} KB, ${Object.keys(T).length} dil, ${fs.readdirSync(jsDir).filter(f => f.endsWith('.js')).length} modül)`);
