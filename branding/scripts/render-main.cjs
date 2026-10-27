const {app,BrowserWindow}=require('electron');
app.whenReady().then(()=>{const w=new BrowserWindow({width:1600,height:1200,show:false,webPreferences:{nodeIntegration:false,contextIsolation:true}});w.loadURL('about:blank');});
