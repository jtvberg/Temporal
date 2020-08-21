const {app, BrowserWindow} = require('electron')

// Enable Electron-Reload (dev only)
require('electron-reload')(__dirname)

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 400,
    height: 400,
    minWidth: 240,
    minHeight: 100,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
      worldSafeExecuteJavaScript: true
    }
  })

  mainWindow.loadFile('main.html')

  // Open DevTools (dev only)
  // mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})