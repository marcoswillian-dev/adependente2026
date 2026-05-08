import { readFileSync, writeFileSync, readdirSync } from 'fs';

const assets = readdirSync('dist/client/assets');
const mainJs = assets.find(f => f.startsWith('index-') && f.endsWith('.js') && !f.includes('CJid'));
const mainCss = assets.find(f => f.endsWith('.css'));

const html = `<!DOCTYPE html>
<html lang="pt-br">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Meu Time — Gestão do Clube</title>
    <link rel="stylesheet" href="/assets/${mainCss}" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/${mainJs}"></script>
  </body>
</html>`;

writeFileSync('dist/client/index.html', html);
console.log('Generated index.html with:', mainJs, mainCss);