import { mkdtemp, mkdir, copyFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

if (process.platform !== 'darwin') throw new Error('Build the Mac DMG on macOS.');
const require = createRequire(import.meta.url);
// Build outside Documents/iCloud/File Provider folders: Finder metadata can
// otherwise reappear during codesigning and invalidate the application bundle.
const temporaryOutput = await mkdtemp(join(tmpdir(), 'freescript-build-'));
try {
  const child = spawn(process.execPath, [require.resolve('electron-builder/cli.js'), '--mac', 'dmg', '--universal', `--config.directories.output=${temporaryOutput}`], {
    stdio: 'inherit', env: { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: 'false' },
  });
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
  if (code !== 0) throw new Error(`Mac packaging failed with exit code ${code}.`);
  await mkdir('release', { recursive: true });
  for (const file of await readdir(temporaryOutput)) {
    if (file.endsWith('.dmg') || file.endsWith('.blockmap')) {
      await copyFile(join(temporaryOutput, file), join('release', file));
      console.log(`Created ${resolve('release', file)}`);
    }
  }
} finally {
  await rm(temporaryOutput, { recursive: true, force: true });
}
