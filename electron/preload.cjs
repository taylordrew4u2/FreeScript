const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('freeScript', {
  exportPDF: title => ipcRenderer.invoke('export-pdf', title),
  onMenuAction: callback => ipcRenderer.on('menu-action', (_event, action) => callback(action)),
});
