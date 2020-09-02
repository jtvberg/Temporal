// Imports and variable declarations
const { app, BrowserWindow, ipcMain, Tray } = require('electron')

// Enable Electron-Reload (dev only)
require('electron-reload')(__dirname)

// Main window
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
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      worldSafeExecuteJavaScript: true
    }
  })

  // HTML file to load into window
  win.loadFile('main.html')

  // Show window when ready
  win.once('ready-to-show', () => {
    win.show()
  })

  // Set initial state of always on top
  win.setAlwaysOnTop(true, 'floating')

  // Open DevTools (dev only)
  win.webContents.openDevTools()
}

// Tray icon
let tray = null
const createTray = () => {
  tray = new Tray('icon.png')
  tray.setToolTip('Temporal')
  tray.on('click', () => {
    win.isVisible() ? win.hide() : win.show()
  })
}

// Remove app from dock
app.dock.hide()

// Instantiate window and tray on app ready
app.whenReady().then(() => {
  createWindow()
  createTray()
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// CLose app if all windows are closed (not Mac)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// IPC channel for locking app on top
ipcMain.on('ontop-lock', function () {
  win.setAlwaysOnTop(true, 'floating')
})

// IPC channel for unlocking app on top
ipcMain.on('ontop-unlock', function () {
  win.setAlwaysOnTop(false)
})

// IPC channel for maximizing window
ipcMain.on('win-max', () => {
  win.maximize()
})

// IPC channel for restoring window
ipcMain.on('win-restore', () => {
  win.unmaximize()
})
