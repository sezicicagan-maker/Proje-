// games/rbmk-sim/template.html + model.js + i18n.js -> games/rbmk-sim/index.html (tek dosya)
const fs = require('fs'), path = require('path'); const d = path.join(__dirname, '..', 'games', 'rbmk-sim');
const strip = f => fs.readFileSync(path.join(d, f), 'utf8').replace(/\/\*(MODEL|I18N)_(BEGIN|END)\*\//g, '').replace(/if \(typeof module[^\n]*\n?/, '');
const html = fs.readFileSync(path.join(d, 'template.html'), 'utf8').replace('/*MODEL*/', () => strip('model.js')).replace('/*I18N*/', () => strip('i18n.js'));
fs.writeFileSync(path.join(d, 'index.html'), html); console.log('games/rbmk-sim/index.html (' + Math.round(html.length / 1024) + ' KB)');
