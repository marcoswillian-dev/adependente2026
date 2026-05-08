const fs = require('fs');
const a = fs.readdirSync('dist/client/assets');
const js = a.filter(f => f.startsWith('index-') && f.endsWith('.js'))
  .sort((a, b) => fs.statSync('dist/client/assets/' + b).size - fs.statSync('dist/client/assets/' + a).size)[0];
const css = a.find(f => f.endsWith('.css'));
fs.writeFileSync('dist/client/index.html', 
  `<!DOCTYPE html><html lang=pt-br><head><meta charset=UTF-8><meta name=viewport content=width=device-width,initial-scale=1><title>Meu Time</title><link rel=stylesheet href=/assets/${css}></head><body><div id=root></div><script type=module src=/assets/${js}></script></body></html>`
);
console.log('Generated index.html with:', js, css);