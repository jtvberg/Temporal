// Imports and variable declarations
const { app, BrowserWindow, ipcMain, Tray, nativeTheme } = require('electron')
const path = require('path')
const updater = require('./updater')
let allowQuit = false
let vibrancyOn = true

// Enable Electron-Reload (dev only)
// require('electron-reload')(__dirname)

// Main window
let win = null
const createWindow = () => {
  // Create main window
  win = new BrowserWindow({
    width: 300,
    height: 400,
    minWidth: 180,
    minHeight: 150,
    transparent: true,
    frame: false,
    show: false,
    hasShadow: false,
    visualEffectState: 'active',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      worldSafeExecuteJavaScript: true
    }
  })

  // HTML file to load into window
  // win.loadFile('main.html')

  // Show window when ready
  win.once('ready-to-show', () => {
    win.show()
  })

  // Open DevTools (dev only)
  win.webContents.openDevTools('detach')

  // Set vibrancy to match theme on update
  nativeTheme.themeSource = 'system'
  nativeTheme.on('updated', () => {
    vibrancySet()
  })
}

// Tray icon
let tray = null
const createTray = () => {
  tray = new Tray(path.join(__dirname, 'iconTemplate@2x.png'))
  tray.setToolTip('Temporal')
  tray.on('click', () => {
    win.isVisible() ? win.hide() : win.show()
  })
  tray.on('right-click', () => {
    app.quit()
  })
}

// Set vibrancy
function vibrancySet() {
  if (nativeTheme.shouldUseDarkColors) {
    win.setVibrancy('dark')
  } else {
    win.setVibrancy('light')
  }
  if (!vibrancyOn) {
    win.setVibrancy(null)
  }
}

// Remove app from dock
app.dock.hide()

// Instantiate window and tray on app ready
app.whenReady().then(() => {
  try {
    createWindow()
    createTray()
    // Check for updates after 3 seconds
    setTimeout(updater, 3000)
  } catch (err) { console.error(err) }
})

// Create window if one doesn't exist
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// When closing set window size and location
app.on('before-quit', (e) => {
  if (!allowQuit) {
    e.preventDefault()
    let wb = win.getBounds()
    const data = {
      windowSizeLocation: { x: wb.x, y: wb.y, height: wb.height, width: wb.width }
    }
    win.webContents.send('save-settings', data)
    allowQuit = true
    app.quit()
  }
})

// CLose app if all windows are closed (not Mac)
app.on('window-all-closed', () => {
  app.quit()
})

// IPC channel to update window size and location from settings
ipcMain.on('set-window', (e, data) => {
  win.setBounds({ x: data.x, y: data.y, height: data.height, width: data.width })
})

// IPC channel for locking app on top
ipcMain.on('ontop-lock', () => {
  win.setAlwaysOnTop(true, 'floating')
})

// IPC channel for unlocking app on top
ipcMain.on('ontop-unlock', () => {
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

// IPC channel for setting vibrancy
ipcMain.on('trans-set', (e, bool) => {
  vibrancyOn = bool
  vibrancySet()
})