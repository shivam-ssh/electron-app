import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import path, { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { autoUpdater } from 'electron-updater'
import cron from 'node-cron'
import { DebUpdater } from 'electron-updater'
// Or MacUpdater, AppImageUpdater

export default class AppUpdater {
  constructor() {
    const options = {
      provider: 'generic',
      url: 'http://localhost:3300/update',
      useMultipleRangeRequest: true
    }

    const autoUpdater = new DebUpdater(options)
    autoUpdater.checkForUpdatesAndNotify()
  }
}

let downloadProgress = 0

const checkUpdate = cron.schedule('* * * * *', () => {
  try {
    // autoUpdater.checkForUpdatesAndNotify()
    new AppUpdater()
  } catch (error) {
    console.error('Error checking for updates:', error)
  }
})

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // autoUpdater.setFeedURL({
  //   provider: 'generic',
  //   url: 'http://localhost:3300/update',
  //   useMultipleRangeRequest: true
  // })

  mainWindow.on('ready-to-show', () => {
    try {
      mainWindow.show()
      // autoUpdater.checkForUpdatesAndNotify()
      new AppUpdater()
    } catch (error) {
      console.error('Error during the update process:', error)
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = 'Download speed: ' + progressObj.bytesPerSecond
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%'
  log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')'
  console.log(log_message)
  downloadProgress = log_message
  if (BrowserWindow.getAllWindows().length > 0) {
    BrowserWindow.getAllWindows()[0].webContents.send('update-download-progress', progressObj)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

autoUpdater.on('update-downloaded', (info) => {
  checkUpdate.stop()
  const dialogOpts = {
    type: 'info',
    buttons: ['Restart', 'Update'],
    title: 'Application Update',
    detail: 'A new version has been downloaded. Restart the application to apply the updates.'
  }
  dialog.showMessageBox(dialogOpts, (response) => {
    if (response === 0) {
      autoUpdater.quitAndInstall()
    }
  })
})

export { downloadProgress }
