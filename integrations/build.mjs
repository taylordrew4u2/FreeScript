import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
await mkdir('generated', { recursive: true });
const widget = await build({ entryPoints: ['widget/main.js'], bundle: true, write: false, format: 'iife', platform: 'browser', target: 'es2020', minify: true, drop: ['console', 'debugger'] });
const html = (await readFile('widget/index.html', 'utf8')).replace('__SCRIPT__', () => widget.outputFiles[0].text.replace(/<\/script/gi, '<\\/script'));
await writeFile('generated/widget.html', html);
for (const entry of ['stdio', 'http']) await build({ entryPoints: [`server/${entry}.js`], outfile: `dist/${entry}.cjs`, bundle: true, platform: 'node', format: 'cjs', target: 'node22', loader: { '.html': 'text' }, minify: false, legalComments: 'eof' });
console.log('Built FreeScript MCP servers and screenplay preview.');
