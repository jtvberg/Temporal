const {app, BrowserWindow, ipcMain, Tray } = require('electron')

// Enable Electron-Reload (dev only)
// require('electron-reload')(__dirname)

let win = null
const createWindow = () => {
  win = new BrowserWindow({
    width: 300,
    height: 400,
    minWidth: 180,
    minHeight: 100,
    transparent: true,
    frame: false,
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
  // win.webContents.openDevTools()
}

let tray = null
const createTray = () => {
  tray = new Tray('icon.png')
  tray.setToolTip('Temporal')
  tray.on('click', () => {
    win.isVisible() ? win.hide() : win.show()
  })
}

app.dock.hide()

app.whenReady().then(() => {
  createWindow()
  createTray()
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
