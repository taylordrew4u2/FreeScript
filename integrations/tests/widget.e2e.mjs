import { _electron, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const directory = await mkdtemp(join(tmpdir(), 'freescript-widget-'));
const html = await readFile('generated/widget.html', 'utf8');
const fixture = { structuredContent: { document: { title: 'The last train', author: 'A Writer', blocks: [{ type: 'scene', text: 'INT. STATION - NIGHT' }, { type: 'action', text: '<img src=x onerror=alert(1)> A clock ticks.' }, { type: 'character', text: 'JUNE' }, { type: 'dialogue', text: 'We still have time.' }] }, fountain: '.INT. STATION - NIGHT\n\nA clock ticks.', analysis: { words: 14, estimatedPages: 1 } } };
const scriptData = value => JSON.stringify(value).replace(/</g, String.fromCharCode(92) + 'u003c');
const host = `<!doctype html><html><body style="margin:0"><iframe id="app" style="width:100%;height:900px;border:0" title="FreeScript preview"></iframe><script>const frame=document.querySelector('iframe');window.addEventListener('message',event=>{const m=event.data;if(m.method==='ui/initialize'){frame.contentWindow.postMessage({jsonrpc:'2.0',id:m.id,result:{protocolVersion:m.params.protocolVersion,hostInfo:{name:'Test MCP host',version:'1.0.0'},hostCapabilities:{},hostContext:{theme:'light'}}},'*');}if(m.method==='ui/notifications/initialized'){frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-result',params:${scriptData(fixture)}},'*');}});frame.srcdoc=${scriptData(html)};</script></body></html>`;
const listener = createServer((_req, res) => res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(host)).listen(0, '127.0.0.1');
await new Promise(resolve => listener.once('listening', resolve));
await writeFile(join(directory, 'main.cjs'), `const {app,BrowserWindow}=require('electron'); app.whenReady().then(()=>{const w=new BrowserWindow({width:900,height:1000,show:false,webPreferences:{contextIsolation:true,nodeIntegration:false}});w.loadURL('http://127.0.0.1:${listener.address().port}');});`);
let application;
try {
  application = await _electron.launch({ args: [join(directory, 'main.cjs'), `--user-data-dir=${join(directory, 'profile')}`] });
  const page = await application.firstWindow();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const frame = page.frameLocator('#app');
  await expect(frame.locator('h1')).toHaveText('The last train');
  await expect(frame.locator('.scene')).toHaveText('INT. STATION - NIGHT');
  await expect(frame.locator('.action')).toContainText('<img src=x onerror=alert(1)>');
  await expect(frame.locator('#paper img')).toHaveCount(0);
  await frame.locator('#outline-button').click();
  await expect(frame.locator('#outline a')).toHaveText('1. INT. STATION - NIGHT');
  await expect(frame.locator('#stats')).toContainText('14 words');
  expect(errors).toEqual([]);
  if (process.env.FREESCRIPT_WIDGET_SCREENSHOT) {
    await frame.locator('.action').evaluate(el => { el.textContent = 'A clock ticks. June watches the empty platform.'; });
    await page.screenshot({ path: process.env.FREESCRIPT_WIDGET_SCREENSHOT });
  }
  console.log('PASS: MCP Apps initialize/result handshake, screenplay preview, scene navigation, metrics, and safe text rendering.');
} finally {
  if (application && application.process().exitCode === null) { const process = application.process(); const done = new Promise(resolve => process.once('exit', resolve)); process.kill('SIGTERM'); await done; }
  listener.closeAllConnections(); await new Promise(resolve => listener.close(resolve));
  await rm(directory, { recursive: true, force: true });
}
