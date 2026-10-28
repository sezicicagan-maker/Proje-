// prototype/evolute.html (tek dosya oyun) -> www/index.html (Capacitor web klasörü).
// Google Fonts bağlantıları kaldırılır, yazı tipi pakete gömülür (çevrimdışı çalışır).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'prototype', 'evolute.html'), 'utf8');
const fontCss = fs.readFileSync(path.join(root, 'app', 'fonts', 'fredoka.css'), 'utf8');

let body = src.replace(/<link[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>\s*/g, '');
if (/fonts\.(googleapis|gstatic)\.com/.test(body)) throw new Error('Google Fonts bağlantısı kaldırılamadı');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<meta name="theme-color" content="#0b1626">
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
console.log('www/index.html yazıldı (' + Math.round(html.length / 1024) + ' KB)');
