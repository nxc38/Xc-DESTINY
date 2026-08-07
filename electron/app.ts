import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join, resolve } from 'path'
import {
  handleOAuthCallback,
  getStoredTokens,
  clearTokens,
  buildAuthUrl,
} from './oauth'
import { getDestinyMemberships, getProfile, getActivityHistory, getManifestActivity, getAccountStats } from './bungie'
import { initDeathwatch, registerDeathwatchIpc } from './deathwatch'
import { existsSync } from 'fs'

const PROTOCOL = 'neavendestiny'
const isDev = !app.isPackaged

// Read pending protocol URL that was stripped from argv before Electron loaded
const pendingProtocolUrl: string | null =
  (globalThis as any).__pendingProtocolUrl || null

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0A0A16',
    title: 'Neaven-DESTINY',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Enable <webview> tag for the embedded DIM web app
      webviewTag: true,
      // Keep timers alive while minimized so the deathwatch capture loop keeps running
      backgroundThrottling: false,
    },
  })

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
}

// Register protocol so neavendestiny:// links open this app.
if (isDev) {
  const projectRoot = resolve(__dirname, '..')
  if (existsSync(join(projectRoot, 'package.json'))) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [projectRoot])
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL)
}

// Prevent multiple instances — pass the protocol URL to the existing one
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }

    const url = argv.find(arg => arg.startsWith(`${PROTOCOL}://`))
    if (url) {
      handleOAuthCallback(url).then(() => {
        mainWindow?.webContents.send('auth-success')
      }).catch(err => {
        console.error('OAuth callback error:', err)
      })
    }
  })
}

// macOS: app is already running and receives a protocol URL
app.on('open-url', (_event, url) => {
  handleOAuthCallback(url).then(() => {
    mainWindow?.webContents.send('auth-success')
  }).catch(err => {
    console.error('OAuth callback error:', err)
  })
})

app.whenReady().then(() => {
  createWindow()
  initDeathwatch()
  registerDeathwatchIpc()

  // Process protocol URL that was in argv at cold-start (app was NOT running)
  if (pendingProtocolUrl) {
    handleOAuthCallback(pendingProtocolUrl).then(() => {
      mainWindow?.webContents.send('auth-success')
    }).catch(err => {
      console.error('OAuth callback error:', err)
    })
  }

  ipcMain.handle('open-bungie-auth', async () => {
    const url = buildAuthUrl()
    await shell.openExternal(url)
  })

  ipcMain.handle('get-auth-tokens', async () => {
    return getStoredTokens()
  })

  ipcMain.handle('clear-auth-tokens', async () => {
    clearTokens()
  })

  ipcMain.handle('get-membership-id', async () => {
    const tokens = getStoredTokens()
    return tokens?.membershipId || null
  })

  ipcMain.handle('process-oauth-url', async (_event, url: string) => {
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid OAuth callback URL')
    }
    if (!url.includes(`${PROTOCOL}://`)) {
      throw new Error('URL does not match expected protocol')
    }
    await handleOAuthCallback(url)
    mainWindow?.webContents.send('auth-success')
  })

  ipcMain.handle('bungie:get-memberships', async (_event, membershipId: string) => {
    return getDestinyMemberships(membershipId)
  })

  ipcMain.handle('bungie:get-profile', async (
    _event, membershipType: number, membershipId: string, components?: number[]
  ) => {
    return getProfile(membershipType, membershipId, components)
  })

  ipcMain.handle('bungie:get-activity-history', async (
    _event, membershipType: number, membershipId: string, characterId: string, count?: number, mode?: number
  ) => {
    return getActivityHistory(membershipType, membershipId, characterId, count, mode)
  })

  ipcMain.handle('bungie:get-manifest-activity', async (_event, hash: number, locale?: string) => {
    return getManifestActivity(hash, locale)
  })

  ipcMain.handle('bungie:get-account-stats', async (
    _event, membershipType: number, membershipId: string, modes?: number[]
  ) => {
    return getAccountStats(membershipType, membershipId, modes)
  })

})

app.on('window-all-closed', () => {
  app.quit()
})
