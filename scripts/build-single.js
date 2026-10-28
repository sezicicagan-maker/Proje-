// www/index.html -> store/web/index.html: yazı tipleri base64 olarak gömülü TEK dosya (oyun sitelerine tek dosya yüklemek için).
// Önce `npm run build:www` çalıştırılmış olmalı.
const fs = require('fs'); const path = require('path');
const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'www', 'index.html'), 'utf8');
html = html.replace(/url\((?:'|")?(?:\.\/)?fonts\/([\w.-]+\.woff2)(?:'|")?\)/g, (m, f) => 'url(data:font/woff2;base64,' + fs.readFileSync(path.join(root, 'www', 'fonts', f)).toString('base64') + ')');
if (/url\([^d)]*fonts\//.test(html)) throw new Error('Yazı tipi gömülemedi');
html = html.replace("font-src 'self'", "font-src 'self' data:");
fs.mkdirSync(path.join(root, 'store', 'web'), { recursive: true });
fs.writeFileSync(path.join(root, 'store', 'web', 'index.html'), html);
console.log('store/web/index.html (' + Math.round(html.length / 1024) + ' KB, tek dosya)');
