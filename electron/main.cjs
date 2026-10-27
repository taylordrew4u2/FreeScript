const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');

let mainWindow;
const send = action => mainWindow?.webContents.send('menu-action', action);

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'FreeScript', width: 1440, height: 1000, minWidth: 760, minHeight: 620,
    backgroundColor: '#f0f2eb', titleBarStyle: 'default',
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: true },
    show: false,
  });
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', event => event.preventDefault());
  mainWindow.webContents.session.on('will-download', (_event, item) => {
    item.setSaveDialogOptions({ title: 'Save screenplay', defaultPath: path.join(app.getPath('documents'), path.basename(item.getFilename())) });
  });
  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  mainWindow.on('closed', () => { mainWindow = null; });
}

ipcMain.handle('export-pdf', async (event, title) => {
  if (!mainWindow || event.sender !== mainWindow.webContents) throw new Error('Invalid sender');
  const safeTitle = typeof title === 'string' ? title.replace(/[^a-z0-9 _-]/gi, '').slice(0, 120).trim() : 'Screenplay';
  const result = await dialog.showSaveDialog(mainWindow, { title: 'Export screenplay as PDF', defaultPath: path.join(app.getPath('documents'), `${safeTitle || 'Screenplay'}.pdf`), filters: [{ name: 'PDF document', extensions: ['pdf'] }] });
  if (result.canceled || !result.filePath) return false;
  const pdf = await mainWindow.webContents.printToPDF({ printBackground: false, preferCSSPageSize: true, pageSize: 'Letter' });
  await fs.writeFile(result.filePath, pdf);
  return true;
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'FreeScript', submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'services' }, { type: 'separator' }, { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' }, { type: 'separator' }, { role: 'quit' }] },
    { label: 'File', submenu: [
      { label: 'New Screenplay', accelerator: 'CmdOrCtrl+N', click: () => send('new') },
      { label: 'Import Screenplay…', accelerator: 'CmdOrCtrl+O', click: () => send('open') },
      { label: 'Export / Save Backup…', accelerator: 'CmdOrCtrl+S', click: () => send('save') },
      { label: 'Export PDF…', accelerator: 'CmdOrCtrl+P', click: () => send('pdf') },
      { type: 'separator' }, { role: 'close' },
    ] },
    { label: 'Edit', submenu: [{ label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: () => send('undo') }, { label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z', click: () => send('redo') }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: 'View', submenu: [{ label: 'Focus Mode', accelerator: 'CmdOrCtrl+Shift+F', click: () => send('focus') }, { type: 'separator' }, { role: 'togglefullscreen' }] },
    { role: 'windowMenu' },
    { label: 'Help', submenu: [{ label: 'Writing with FreeScript', accelerator: 'CmdOrCtrl+/', click: () => send('help') }] },
  ]));
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
