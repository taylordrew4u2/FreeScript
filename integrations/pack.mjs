import { mkdir, cp, copyFile, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const endpoint = process.env.FREESCRIPT_MCP_URL;
if (!endpoint || !/^https:\/\/[^\s]+\/mcp$/.test(endpoint)) throw new Error('Set FREESCRIPT_MCP_URL to the deployed HTTPS /mcp endpoint.');
const version = JSON.parse(await readFile('package.json', 'utf8')).version;
const base = resolve('bundles');
await mkdir(base, { recursive: true });
const claude = join(base, 'claude'), portable = join(base, 'plugin');
await rm(claude, { recursive: true, force: true }); await rm(portable, { recursive: true, force: true });
await mkdir(join(claude, 'server'), { recursive: true });
await cp('plugin', portable, { recursive: true }); await mkdir(join(portable, 'assets'), { recursive: true });
await copyFile('../build/icon-1024.png', join(portable, 'assets/icon.png'));
await copyFile('../build/icon-1024.png', join(claude, 'icon.png'));
await copyFile('claude/manifest.json', join(claude, 'manifest.json'));
await copyFile('dist/stdio.cjs', join(claude, 'server/stdio.cjs'));
for (const target of [claude, portable]) {
  await copyFile('../LICENSE', join(target, 'LICENSE'));
  await copyFile('README.md', join(target, 'README.md'));
}
await writeFile(join(portable, 'mcp.json'), JSON.stringify({ $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json', mcpServers: { freescript: { type: 'streamable-http', url: endpoint, extensions: { 'com.openai': { auth: { type: 'none' } } } } } }, null, 2));
await mkdir(join(portable, '.claude-plugin'), { recursive: true });
await writeFile(join(portable, '.claude-plugin/plugin.json'), JSON.stringify({ name: 'freescript', version, description: 'FreeScript screenplay tools and workflows.', author: { name: 'Taylor Drew' }, mcpServers: './.mcp.json' }, null, 2));
await writeFile(join(portable, '.mcp.json'), JSON.stringify({ mcpServers: { freescript: { type: 'http', url: endpoint } } }, null, 2));
// Bundle license notices along with the compiled server and browser SDK.
let notices = 'FreeScript third-party notices\n\n';
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const location = join(directory, entry.name);
    if (entry.name.startsWith('@')) { await collect(location); continue; }
    try {
      const meta = JSON.parse(await readFile(join(location, 'package.json'), 'utf8'));
      const files = await readdir(location);
      const license = files.find(name => /^licen[cs]e(?:\.|$)/i.test(name));
      if (license) notices += `\n--- ${meta.name}@${meta.version} (${meta.license || 'see notice'}) ---\n${await readFile(join(location, license), 'utf8')}\n`;
      if (files.includes('node_modules')) await collect(join(location, 'node_modules'));
    } catch { /* Non-package folders are excluded. */ }
  }
}
await collect('node_modules');
for (const target of [claude, portable]) await writeFile(join(target, 'THIRD_PARTY_NOTICES.txt'), notices);
for (const [directory, name] of [[claude, `FreeScript-Claude-${version}.mcpb`], [portable, `FreeScript-ChatGPT-Plugin-${version}.zip`]]) {
  const artifact = join(base, name);
  await rm(artifact, { force: true });
  execFileSync('/usr/bin/zip', ['-qr', artifact, '.'], { cwd: directory });
  console.log(artifact);
}
