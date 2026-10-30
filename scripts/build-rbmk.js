// games/rbmk-sim/template.html + model.js -> games/rbmk-sim/index.html (tek dosya)
const fs = require('fs'), path = require('path'); const d = path.join(__dirname, '..', 'games', 'rbmk-sim');
const model = fs.readFileSync(path.join(d, 'model.js'), 'utf8').replace(/\/\*MODEL_BEGIN\*\/|\/\*MODEL_END\*\//g, '').replace(/if \(typeof module[^\n]*\n?/, '');
const html = fs.readFileSync(path.join(d, 'template.html'), 'utf8').replace('/*MODEL*/', () => model);
fs.writeFileSync(path.join(d, 'index.html'), html); console.log('games/rbmk-sim/index.html (' + Math.round(html.length / 1024) + ' KB)');
