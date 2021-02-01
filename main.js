// Imports and variable declarations
const { app, BrowserWindow, ipcMain, Tray } = require('electron')
const path = require('path')
const updater = require('./updater')
let allowQuit = false

// Enable Electron-Reload (dev only)
// require('electron-reload')(__dirname)

// Main window
let win = null
const createWindow = () => {
  // Check for updates after 3 seconds
  setTimeout(updater, 3000)

  // Create main window
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

  // Redraw canvas on resize
  win.on('resize', () => {
    win.webContents.send('redraw')
  })

  // Open DevTools (dev only)
  // win.webContents.openDevTools()
}

// Tray icon
let tray = null
const createTray = () => {
  tray = new Tray(path.join(__dirname, 'icon.png'))
  tray.setToolTip('Temporal')
  tray.on('click', () => {
    win.isVisible() ? win.hide() : win.show()
  })
  tray.on('right-click', () => {
    app.quit()
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

// When closing set window size and location
app.on('before-quit', (e) => {
  if (!allowQuit) {
    e.preventDefault()
    wb = win.getBounds()
    const data = {
      windowSizeLocation: { x: wb.x, y: wb.y, height: wb.height, width: wb.width }
    }
    win.webContents.send('save-settings', data)
    allowQuit = true
    app.quit()
  }
})

// CLose app if all windows are closed (not Mac)
app.on('window-all-closed', function () {
  app.quit()
})

// IPC channel to update window size and location from settings
ipcMain.on('set-window', (e, data) => {
  win.setBounds({ x: data.x, y: data.y, height: data.height, width: data.width })
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
  win.isMaximized() ? win.unmaximize() : win.maximize()
})

// IPC channel for hiding window
ipcMain.on('win-hide', () => {
  win.hide()
})
