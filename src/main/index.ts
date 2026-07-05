import { app, BrowserWindow, session } from 'electron'
import { join } from 'path'

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    title: 'First Song',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // マイク録音のパーミッションをElectronレベルで許可する
  // setPermissionRequestHandler: 非同期リクエスト（getUserMedia 等）
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    // 'media' = audio/video。このアプリではマイクのみ使用
    callback(permission === 'media')
  })
  // setPermissionCheckHandler: Chromium 内部の同期チェック（詳細権限ごと）
  session.defaultSession.setPermissionCheckHandler((_webContents, permission, _origin, details) => {
    if (permission === 'media') {
      // mediaType が指定されていれば audio のみ許可、未指定（unknown）も許可
      const mediaType = (details as { mediaType?: string }).mediaType
      return !mediaType || mediaType === 'audio' || mediaType === 'unknown'
    }
    return false
  })

  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
