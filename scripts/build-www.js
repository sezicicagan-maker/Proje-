// prototype/evolute.html (tek dosya oyun) -> www/index.html (Capacitor web klasörü).
// Üretim derlemesi: test kancaları ÇIKARILIR, JS küçültülüp isimleri karıştırılır, sıkı CSP eklenir,
// Google Fonts bağlantıları kaldırılıp yazı tipi pakete gömülür (çevrimdışı çalışır).
const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

(async () => {
  const root = path.join(__dirname, '..');
  const src = fs.readFileSync(path.join(root, 'prototype', 'evolute.html'), 'utf8');
  const fontCss = fs.readFileSync(path.join(root, 'app', 'fonts', 'fredoka.css'), 'utf8');

  let body = src.replace(/<link[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>\s*/g, '');
  if (/fonts\.(googleapis|gstatic)\.com/.test(body)) throw new Error('Google Fonts bağlantısı kaldırılamadı');

  // 1) test kancalarını sil
  const hooks = /\/\*TEST_HOOKS_BEGIN\*\/[\s\S]*?\/\*TEST_HOOKS_END\*\//;
  if (!hooks.test(body)) throw new Error('Test kancası işaretleri bulunamadı');
  body = body.replace(hooks, '');
  if (/__evolute|__EVO_TEST__/.test(body)) throw new Error('Test kancası kalıntısı var');

  // 2) JS küçült ve karıştır
  const m = body.match(/<script>([\s\S]*)<\/script>/);
  if (!m) throw new Error('Oyun betiği bulunamadı');
  const min = await minify(m[1], { compress: { passes: 2, drop_debugger: true }, mangle: { toplevel: false }, format: { comments: false } });
  if (!min.code) throw new Error('Küçültme başarısız');
  body = body.replace(m[0], () => '<script>' + min.code + '</script>');

  // 3) CSP: yalnızca kendi içeriğimiz; dışarıya bağlantı yok (reklam eklenince ilgili alan adları buraya eklenecek)
  const csp = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<meta name="theme-color" content="#0b1626">
<title>Evolute</title>
<style>${fontCss}
:root{color-scheme:dark;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
html{height:100%}body{margin:0}[hidden]{display:none!important}</style>
</head>
<body>
${body}
</body>
</html>
`;

  const out = path.join(root, 'www');
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(path.join(out, 'fonts'), { recursive: true });
  fs.writeFileSync(path.join(out, 'index.html'), html);
  for (const f of fs.readdirSync(path.join(root, 'app', 'fonts'))) {
    if (f.endsWith('.woff2')) fs.copyFileSync(path.join(root, 'app', 'fonts', f), path.join(out, 'fonts', f));
  }
  console.log('www/index.html yazıldı (' + Math.round(html.length / 1024) + ' KB, kaynak ' + Math.round(src.length / 1024) + ' KB)');
})().catch(e => { console.error(e.message); process.exit(1); });
