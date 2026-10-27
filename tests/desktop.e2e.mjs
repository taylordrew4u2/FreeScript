import { _electron as electron, expect } from '@playwright/test';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const testData = await mkdtemp(path.join(tmpdir(), 'freescript-test-'));
const applicationPath = process.env.FREESCRIPT_APP || '.';
let app;
try {
  app = await electron.launch({ args: [applicationPath, `--user-data-dir=${testData}`] });
  const page = await app.firstWindow();
  page.setDefaultTimeout(7000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await expect(page.locator('#rename')).toHaveText('The way back');
  await expect(page.locator('.scene-item')).toHaveCount(3);
  await page.screenshot({ path: path.join(testData, 'workspace.png') });
  if (process.env.FREESCRIPT_SCREENSHOT) await page.screenshot({ path: process.env.FREESCRIPT_SCREENSHOT });

  // Create and edit a screenplay through the same controls a writer uses.
  await page.locator('#new-script').click();
  await page.locator('[name=title]').fill('Smoke test');
  await page.locator('[name=author]').fill('Test Writer');
  await page.locator('button[type=submit]').click();
  await expect(page.locator('#rename')).toHaveText('Smoke test');
  const scene = page.locator('.script-block.scene');
  await scene.fill('INT. TEST ROOM - DAY');
  await scene.press('End');
  await scene.press('Enter');
  await expect(page.locator('#block-type')).toHaveValue('action');
  await page.keyboard.type('A writer opens a new page.');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.locator('#block-type')).toHaveValue('character');
  await page.keyboard.type('JUNE');
  await page.keyboard.press('Enter');
  await expect(page.locator('#block-type')).toHaveValue('dialogue');
  await page.keyboard.type('This is our first line.');
  await page.waitForTimeout(700);
  await page.keyboard.type(' Another line.');
  await page.keyboard.press('Meta+z');
  await expect(page.locator('.script-block.dialogue')).toHaveText('This is our first line.');
  await page.keyboard.press('Meta+Shift+z');
  await expect(page.locator('.script-block.dialogue')).toHaveText('This is our first line. Another line.');
  console.log('PASS: Formatting, undo/redo, and saved text.');
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.locator('#rename')).toHaveText('Smoke test');
  await expect(page.locator('.script-block.dialogue')).toHaveText('This is our first line. Another line.');

  // Stub only the native file picker; exercise the real PDF-export bridge and renderer.
  await expect.poll(() => page.evaluate(() => typeof window.freeScript?.exportPDF)).toBe('function');
  const pdfPath = path.join(testData, 'export.pdf');
  await app.evaluate(({ dialog }, pdfPath) => { dialog.showSaveDialog = async () => ({ canceled: false, filePath: pdfPath }); }, pdfPath);
  await page.locator('#export').click();
  await page.locator('#export-pdf').click();
  await expect(page.locator('#toast')).toHaveText('PDF saved. Your story is ready to share.');
  const pdf = await readFile(pdfPath);
  if (process.env.FREESCRIPT_TEST_PDF) await writeFile(process.env.FREESCRIPT_TEST_PDF, pdf);
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  const exportPath = path.join(testData, 'export.fountain');
  await app.evaluate(({ session }, exportPath) => { session.defaultSession.once('will-download', (_event, item) => item.setSavePath(exportPath)); }, exportPath);
  await page.locator('#export').click();
  await page.locator('#export-fountain').click();
  await expect.poll(async () => { try { return await readFile(exportPath, 'utf8'); } catch { return ''; } }).toContain('@JUNE\nThis is our first line. Another line.');
  await page.locator('[data-close]').last().click();
  console.log('PASS: PDF creation.');

  const fountain = path.join(testData, 'import.fountain');
  await writeFile(fountain, 'Title: Imported story\nAuthor: Someone\n\nINT. CAFE - NIGHT\n\nA bell rings.\n\nJUNE\nHello there.');
  await page.locator('#file-input').setInputFiles(fountain);
  await expect(page.locator('#rename')).toHaveText('Imported story');
  await expect(page.locator('.script-block.dialogue')).toHaveText('Hello there.');
  await page.locator('#scene-search').fill('does not exist');
  await expect(page.locator('.empty-scenes')).toBeVisible();
  await page.locator('#scene-search').fill('cafe');
  await expect(page.locator('.scene-item')).toHaveCount(1);
  await page.locator('#focus').click();
  await expect(page.locator('#exit-focus')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.sidebar')).toBeVisible();
  await page.locator('#export').click();
  await expect(page.locator('#export-pdf')).toBeVisible();
  await page.locator('[data-close]').last().click();
  await page.locator('#library-toggle').click();
  await expect(page.locator('[data-doc]')).toHaveCount(3);
  await page.locator('[data-doc]').first().click();
  await expect(page.locator('#rename')).toHaveText('The way back');
  await expect(page.locator('.scene-item')).toHaveCount(3);
  expect(errors).toEqual([]);
  console.log('PASS: Desktop launch, editing, formatting, undo/redo, autosave reload, PDF, import, scene search, focus mode, export dialog, and script switching.');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  if (app && app.process().exitCode === null) {
    const child = app.process();
    const exited = new Promise(resolve => child.once('exit', resolve));
    child.kill('SIGTERM');
    await exited;
  }
  await rm(testData, { recursive: true, force: true });
}
