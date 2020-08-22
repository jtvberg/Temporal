const {app, BrowserWindow, ipcMain} = require('electron')

// Enable Electron-Reload (dev only)
require('electron-reload')(__dirname)

let win
function createWindow () {
  win = new BrowserWindow({
    width: 400,
    height: 400,
    minWidth: 240,
    minHeight: 100,
    transparent: true,
    titleBarStyle: 'hidden',
    show: false,
    webPreferences: {
      nodeIntegration: true,
      worldSafeExecuteJavaScript: true
    }
  })

  win.loadFile('main.html')

  win.once('ready-to-show', () => {
    win.show()
  })

  win.setAlwaysOnTop(true, 'floating')

  // Open DevTools (dev only)
  win.webContents.openDevTools()
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

ipcMain.on('ontop-lock', function () {
  win.setAlwaysOnTop(true, 'floating')
})

ipcMain.on('ontop-unlock', function () {
  win.setAlwaysOnTop(false)
})
