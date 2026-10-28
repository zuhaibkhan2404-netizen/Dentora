// Offline build used in the authoring sandbox (npm registry was unavailable there).
// In a normal environment use `npm run build` (Vite). Usage: node scripts/build-local.mjs [--single]
import { build } from '/opt/npm-tools/node_modules/esbuild/lib/main.js';
import fs from 'node:fs';
import path from 'node:path';

const single = process.argv.includes('--single');
const out = single ? 'dist-single' : 'dist-local';
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const res = await build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  format: 'esm',
  splitting: !single,
  outdir: out + '/assets',
  minify: true,
  sourcemap: false,
  target: ['es2020'],
  jsx: 'automatic',
  loader: { '.ts': 'ts', '.tsx': 'tsx' },
  define: { 'process.env.NODE_ENV': '"production"' },
  write: false,
  logLevel: 'warning',
  nodePaths: ['node_modules'],
  // The GSAP git checkout keeps ES modules under /esm (the npm package flattens them).
  alias: { 'gsap/ScrollTrigger': './node_modules/gsap/esm/ScrollTrigger.js', gsap: './node_modules/gsap/esm/index.js' },
});

let html = fs.readFileSync('index.html', 'utf8');
const files = res.outputFiles;
const js = files.filter((f) => f.path.endsWith('.js'));
const css = files.filter((f) => f.path.endsWith('.css')).map((f) => f.text).join('\n');

if (single) {
  let code = js.map((f) => f.text).join('\n');
  for (const img of fs.readdirSync('public')) {
    const b64 = fs.readFileSync(path.join('public', img)).toString('base64');
    code = code.split(JSON.stringify(img)).join(JSON.stringify(`data:image/jpeg;base64,${b64}`));
  }
  code = code.replace(/<\/script/g, '<\\/script');
  // Artifact fragment: the host adds doctype/html/head/body.
  const fonts = html.match(/<link href="https:\/\/fonts[^>]+>/)[0];
  const frag = `<title>Dentora Dental Studio</title>
<meta name="description" content="Dentora — a contemporary dental studio. Demonstration website.">
${fonts}
<style>${css}</style>
<div id="root"></div>
<script type="module">${code}</script>
`;
  fs.writeFileSync(path.join(out, 'index.html'), frag);
} else {
  for (const f of files) {
    fs.mkdirSync(path.dirname(f.path), { recursive: true });
    fs.writeFileSync(f.path, f.contents);
  }
  html = html
    .replace('<script type="module" src="/src/main.tsx"></script>', '<script type="module" src="./assets/main.js"></script>')
    .replace('</head>', '<link rel="stylesheet" href="./assets/main.css" />\n  </head>');
  fs.writeFileSync(path.join(out, 'index.html'), html);
  for (const img of fs.readdirSync('public')) fs.copyFileSync(path.join('public', img), path.join(out, img));
}
const size = fs.statSync(path.join(out, 'index.html')).size;
console.log(`built ${out}`, js.map((f) => `${path.basename(f.path)} ${(f.contents.length / 1024).toFixed(0)}kB`).join(', '), `html ${(size / 1024).toFixed(0)}kB`);
