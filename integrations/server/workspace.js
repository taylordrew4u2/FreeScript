import { mkdir, readdir, open, rename, unlink, link } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

const digest = text => createHash('sha256').update(text).digest('hex');
export class Workspace {
  constructor(directory) { this.directory = resolve(directory); }
  path(filename) {
    if (!/^[A-Za-z0-9][A-Za-z0-9 _().-]{0,119}\.fountain$/.test(filename)) throw new Error('Use a plain .fountain filename without folders.');
    return join(this.directory, filename);
  }
  async list() {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    return (await readdir(this.directory, { withFileTypes: true })).filter(e => e.isFile() && /^[A-Za-z0-9][A-Za-z0-9 _().-]{0,119}\.fountain$/.test(e.name)).map(e => e.name).sort();
  }
  async read(filename) {
    const file = await open(this.path(filename), constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const stat = await file.stat();
      if (!stat.isFile() || stat.size > 1_000_000) throw new Error('Choose a regular screenplay file smaller than 1 MB.');
      const fountain = await file.readFile('utf8');
      return { filename, fountain, revision: digest(fountain) };
    } finally { await file.close(); }
  }
  async save(filename, fountain, expectedRevision) {
    const target = this.path(filename);
    if (Buffer.byteLength(fountain) > 1_000_000) throw new Error('The screenplay exceeds the 1 MB file limit.');
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const lockPath = target + '.freescript-lock';
    let lock;
    try { lock = await open(lockPath, 'wx', 0o600); }
    catch { throw new Error('This screenplay is being saved by another process. Retry shortly.'); }
    const temporary = join(this.directory, `.freescript-${randomUUID()}.tmp`);
    try {
      let previous;
      try { previous = await this.read(filename); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (previous && (!expectedRevision || previous.revision !== expectedRevision)) throw new Error('Revision conflict: read the screenplay again, then supply its latest revision before overwriting.');
      if (!previous && expectedRevision) throw new Error('The screenplay no longer exists. Read the workspace again.');
      const file = await open(temporary, 'wx', 0o600);
      try { await file.writeFile(fountain, 'utf8'); await file.sync(); } finally { await file.close(); }
      if (previous) {
        const latest = await this.read(filename);
        if (latest.revision !== previous.revision) throw new Error('Revision conflict: the screenplay changed during save. Read it again.');
        await rename(temporary, target);
      } else {
        // Atomic creation: an externally created file must never be overwritten.
        await link(temporary, target);
      }
      return { filename, revision: digest(fountain), saved: true };
    } finally {
      await unlink(temporary).catch(() => {});
      await lock.close();
      await unlink(lockPath);
    }
  }
}
