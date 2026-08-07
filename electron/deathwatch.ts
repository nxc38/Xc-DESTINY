import { app, BrowserWindow, desktopCapturer, dialog, ipcMain, screen, session } from 'electron'
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import { open, readFile } from 'fs/promises'
import { createServer, type Server } from 'http'
import { join } from 'path'
import { gunzipSync } from 'zlib'

export interface DeathwatchConfig {
  enabled: boolean
  mediaPaths: string[]
  playDurationSec: number
  keywords: string[]
  sensitivity: number
  cooldownSec: number
  sourceMode: 'auto' | 'destiny-window' | 'screen'
}

export interface DeathwatchEvent {
  type: 'langpack' | 'trigger' | 'error' | 'config'
  status?: string
  progress?: number
  keyword?: string
  message?: string
  config?: DeathwatchConfig
}

const DEFAULT_KEYWORDS = ['守护者倒下', '等待复活']

const DEFAULT_CONFIG: DeathwatchConfig = {
  enabled: false,
  mediaPaths: [],
  playDurationSec: 0,
  keywords: DEFAULT_KEYWORDS,
  sensitivity: 2,
  cooldownSec: 8,
  sourceMode: 'auto',
}

const CONFIG_FILE = () => join(app.getPath('userData'), 'deathwatch.json')

function loadConfig(): DeathwatchConfig {
  try {
    if (existsSync(CONFIG_FILE())) {
      const raw = JSON.parse(readFileSync(CONFIG_FILE(), 'utf-8'))
      const merged = { ...DEFAULT_CONFIG, ...raw }
      // migrate old single-file config
      if (!merged.mediaPaths?.length && raw.mediaPath) merged.mediaPaths = [raw.mediaPath]
      return merged
    }
  } catch { /* corrupted config — fall back to defaults */ }
  return { ...DEFAULT_CONFIG }
}

function saveConfig() {
  try {
    writeFileSync(CONFIG_FILE(), JSON.stringify(config, null, 2), 'utf-8')
  } catch { /* ignore */ }
}

let config: DeathwatchConfig = loadConfig()

let workerBusy = false
let workerErrorReported = false
let hitStreak = 0
let lastTriggerAt = 0

let playerWin: BrowserWindow | null = null
let hidePollTimer: NodeJS.Timeout | null = null
let hideForceTimer: NodeJS.Timeout | null = null

function sendEvent(evt: DeathwatchEvent) {
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) w.webContents.send('deathwatch:event', evt)
  }
}

// ---- local media server ----
// protocol.handle custom schemes mishandle sequential Range requests for the same
// URL (the second request gets cancelled together with the in-flight first one),
// which makes Chromium reject mp4s that need a tail (moov) read with code 4.
// A loopback HTTP server gives Chromium the exact request/response semantics it
// expects — verified: the same file + range logic plays over http but not media://

let mediaServer: Server | null = null
let mediaPort = 0

export function initDeathwatch() {
  if (mediaServer) return
  mediaServer = createServer((req, res) => {
    const m = /^\/media\/([A-Za-z0-9_-]+)$/.exec(req.url || '')
    if (!m) {
      res.writeHead(404)
      res.end()
      return
    }
    try {
      // the file path travels as a base64url token — opaque to any URL parsing
      const filePath = Buffer.from(m[1], 'base64url').toString('utf8')
      if (!existsSync(filePath)) {
        sendEvent({ type: 'error', message: 'media file not found: ' + filePath })
        res.writeHead(404)
        res.end()
        return
      }
      const ext = filePath.split('.').pop()?.toLowerCase() || ''
      const mime = MIME[ext] || 'application/octet-stream'
      const size = statSync(filePath).size
      const range = req.headers.range
      console.log('[media]', req.url.slice(0, 26) + '…', 'range:', range ?? '-', 'size:', size)
      if (range) {
        const rm = /^bytes=(\d*)-(\d*)$/.exec(range)
        if (rm) {
          const start = rm[1] ? Number(rm[1]) : 0
          const end = rm[2] ? Math.min(Number(rm[2]), size - 1) : size - 1
          if (start > end || start >= size) {
            res.writeHead(416, { 'Content-Range': `bytes */${size}` })
            res.end()
            return
          }
          res.writeHead(206, {
            'Content-Type': mime,
            'Content-Length': end - start + 1,
            'Content-Range': `bytes ${start}-${end}/${size}`,
            'Accept-Ranges': 'bytes',
          })
          createReadStream(filePath, { start, end }).pipe(res)
          return
        }
      }
      res.writeHead(200, {
        'Content-Type': mime,
        'Content-Length': size,
        'Accept-Ranges': 'bytes',
      })
      createReadStream(filePath).pipe(res)
    } catch (err: any) {
      sendEvent({ type: 'error', message: 'media load failed: ' + String(err?.message || err) })
      res.writeHead(500)
      res.end()
    }
  })
  mediaServer.on('error', (err) => console.error('[media server]', err))
  mediaServer.listen(0, '127.0.0.1', () => {
    const addr = mediaServer!.address()
    if (addr && typeof addr === 'object') mediaPort = addr.port
  })

  session.defaultSession.setDisplayMediaRequestHandler((_request, callback) => {
    desktopCapturer.getSources({ types: ['window', 'screen'] }).then((sources) => {
      // minimized windows report empty thumbnails and cannot be captured by WGC
      const capturable = (s: Electron.DesktopCapturerSource) => {
        const { width, height } = s.thumbnail.getSize()
        return width > 4 && height > 4
      }
      const destinyWin = sources.find(
        (s) => s.id.startsWith('window:') && /destiny|命运2/i.test(s.name) && capturable(s)
      )
      const primaryScreen = sources.find((s) => s.id.startsWith('screen:') && capturable(s))
        ?? sources[0] ?? null
      let chosen = primaryScreen
      if (config.sourceMode === 'destiny-window') chosen = destinyWin ?? null
      else if (config.sourceMode === 'auto') chosen = destinyWin ?? primaryScreen
      if (chosen) callback({ video: chosen })
      else callback({})
    }).catch(() => callback({}))
  })
}

// ---- OCR ----
// tesseract.js-core is loaded directly in the main process (no worker thread).
// The wasm build bundles JPEG decoding, so raw frames can be recognized as-is.

const LANGS = ['eng', 'chi_sim']
const OEM_LSTM_ONLY = 1
const TESSDATA_URL = (lang: string) =>
  `https://cdn.jsdelivr.net/npm/@tesseract.js-data/${lang}/4.0.0_best_int/${lang}.traineddata.gz`
const TESSDATA_DIR = () => join(app.getPath('userData'), 'tessdata')

interface TessBaseApi {
  Init(datapath: string | null, langs: string, oem: number, configFile: string | null): number
  SetImageFile(exif: number, angle: number): number
  Recognize(monitor: null): void
  GetUTF8Text(): string
  End(): void
}

interface TessModule {
  FS: { writeFile(path: string, data: Uint8Array): void }
  TessBaseAPI: new () => TessBaseApi
}

let tessModule: TessModule | null = null
let tessApi: TessBaseApi | null = null
let ocrInitPromise: Promise<void> | null = null

async function loadCore(): Promise<TessModule> {
  const variants = [
    'tesseract-core-relaxedsimd-lstm',
    'tesseract-core-simd-lstm',
    'tesseract-core-lstm',
  ]
  let lastErr: unknown = null
  for (const v of variants) {
    try {
      const factory = require(`tesseract.js-core/${v}`)
      return await factory({
        // silence tesseract's benign stderr noise ("read_params_file: Can't open",
        // "Warning: Parameter not found" for LSTM-only configs)
        printErr: (msg: string) => {
          if (!/read_params_file: Can't open|Parameter not found/.test(msg)) {
            console.error('[tesseract]', msg)
          }
        },
      })
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr ?? new Error('Failed to load tesseract core')
}

async function ensureLangData(lang: string, onProgress: (p: number) => void): Promise<Uint8Array> {
  const dest = join(TESSDATA_DIR(), `${lang}.traineddata`)
  if (existsSync(dest)) return readFileSync(dest)
  const res = await fetch(TESSDATA_URL(lang))
  if (!res.ok) throw new Error(`Failed to download ${lang} language data (HTTP ${res.status})`)
  const total = Number(res.headers.get('content-length') || 0)
  const reader = res.body!.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.length
    if (total > 0) onProgress(received / total)
  }
  const gz = Buffer.concat(chunks)
  const isGzip = gz.length > 2 && gz[0] === 0x1f && gz[1] === 0x8b
  const data = isGzip ? gunzipSync(gz) : gz
  mkdirSync(TESSDATA_DIR(), { recursive: true })
  writeFileSync(dest, data)
  return data
}

async function initOcr(): Promise<void> {
  tessModule = await loadCore()
  const perLang = 0.9 / LANGS.length
  for (let i = 0; i < LANGS.length; i++) {
    const lang = LANGS[i]
    const data = await ensureLangData(lang, (p) =>
      sendEvent({ type: 'langpack', status: 'downloading', progress: i * perLang + p * perLang })
    )
    tessModule.FS.writeFile(`/${lang}.traineddata`, data)
  }
  sendEvent({ type: 'langpack', status: 'initializing', progress: 0.95 })
  const api = new tessModule.TessBaseAPI()
  const status = api.Init(null, LANGS.join('+'), OEM_LSTM_ONLY, null)
  if (status === -1) throw new Error('Tesseract initialization failed')
  tessApi = api
  sendEvent({ type: 'langpack', status: 'ready', progress: 1 })
}

function ensureOcr(): Promise<void> {
  if (tessApi) return Promise.resolve()
  if (!ocrInitPromise) {
    ocrInitPromise = initOcr().catch((err) => {
      ocrInitPromise = null
      throw err
    })
  }
  return ocrInitPromise
}

function normalizeKeywords(): string[] {
  return config.keywords.map((k) => k.toLowerCase().trim()).filter(Boolean)
}

async function recognizeAndMatch(jpegBase64: string): Promise<{
  matched: boolean
  matchedKeyword: string | null
  textPreview: string
}> {
  await ensureOcr()
  const jpeg = Buffer.from(jpegBase64, 'base64')
  tessModule!.FS.writeFile('/input', new Uint8Array(jpeg))
  if (tessApi!.SetImageFile(1, 0) === 1) throw new Error('Failed to read frame image')
  tessApi!.Recognize(null)
  const text = (tessApi!.GetUTF8Text() || '').toLowerCase().replace(/\s+/g, ' ').trim()
  const keywords = normalizeKeywords()
  for (const kw of keywords) {
    if (text.includes(kw)) {
      return { matched: true, matchedKeyword: kw, textPreview: text.slice(0, 150) }
    }
  }
  return { matched: false, matchedKeyword: null, textPreview: text.slice(0, 150) }
}

// ---- trigger & playback ----

function mediaKind(path: string): 'video' | 'audio' {
  const ext = path.split('.').pop()?.toLowerCase() || ''
  return ['mp4', 'webm', 'mov'].includes(ext) ? 'video' : 'audio'
}

const PROBE_READ = 16 * 1024 * 1024

// scans head+tail for track codec boxes (avcC/hvcC/mp4a live in moov, which sits
// at the start on faststart files and at the end on recorded files). Explains
// "no supported source" failures: unsupported audio (AC-3/DTS) or 10-bit H.264
// makes Chromium reject the whole file even when the video track is fine
async function probeMediaTracks(path: string): Promise<string> {
  try {
    const fh = await open(path, 'r')
    try {
      const size = (await fh.stat()).size
      const head = Buffer.alloc(Math.min(size, PROBE_READ))
      await fh.read(head, 0, head.length, 0)
      let tail = Buffer.alloc(0)
      if (size > PROBE_READ) {
        tail = Buffer.alloc(PROBE_READ)
        await fh.read(tail, 0, PROBE_READ, size - PROBE_READ)
      }
      const buf = Buffer.concat([head, tail])
      const has = (tag: string) => buf.includes(Buffer.from(tag, 'latin1'))
      const parts: string[] = []
      const avc = buf.indexOf(Buffer.from('avcC'))
      if (avc >= 0) {
        // avcC box: [size:4][type:'avcC'][version:1][profile_idc:1]...
        const profile = buf[avc + 5]
        const name: Record<number, string> = {
          66: 'Baseline', 77: 'Main', 88: 'Extended', 100: 'High',
          110: 'High10', 122: 'High422', 244: 'High444',
        }
        parts.push(`video: H.264 ${name[profile] ?? 'profile ' + profile}`)
      }
      if (has('hvcC')) parts.push('video: HEVC')
      if (has('av01')) parts.push('video: AV1')
      if (has('vp09')) parts.push('video: VP9')
      for (const [tag, name] of [
        ['ac-3', 'AC-3'], ['ec-3', 'E-AC-3'], ['dtsc', 'DTS'], ['dtsh', 'DTS-HD'],
        ['dtsl', 'DTS-LBR'], ['alac', 'ALAC'], ['mp4a', 'AAC'], ['Opus', 'Opus'], ['fLaC', 'FLAC'],
      ]) {
        if (has(tag)) parts.push(`audio: ${name}`)
      }
      return parts.length > 0 ? parts.join(' | ') : 'unknown'
    } finally {
      await fh.close()
    }
  } catch {
    return 'unknown'
  }
}

function randomMediaPath(): string | null {
  const paths = config.mediaPaths.filter(Boolean)
  if (paths.length === 0) return null
  return paths[Math.floor(Math.random() * paths.length)]
}

function trigger(keyword: string) {
  const path = randomMediaPath()
  if (!path) {
    sendEvent({ type: 'error', message: 'no media selected' })
    return
  }
  lastTriggerAt = Date.now()
  playMedia(path)
  sendEvent({ type: 'trigger', keyword })
}

const PLAYER_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;overflow:hidden;background:#000;width:100%;height:100%}
video{width:100%;height:100%;object-fit:contain}
</style></head><body><video id="player" autoplay playsinline></video></body></html>`

function getPlayerWindow(): BrowserWindow {
  if (playerWin && !playerWin.isDestroyed()) return playerWin
  playerWin = new BrowserWindow({
    frame: false,
    show: false,
    backgroundColor: '#000000',
    alwaysOnTop: true,
    focusable: false,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    movable: false,
    webPreferences: {
      backgroundThrottling: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  playerWin.setAlwaysOnTop(true, 'screen-saver')
  playerWin.setVisibleOnAllWorkspaces(true)
  playerWin.webContents.on('before-input-event', (_e, input) => {
    if (input.type === 'mouseDown') hidePlayer()
  })
  playerWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(PLAYER_HTML))
  return playerWin
}

function mediaUrl(path: string): string {
  if (mediaPort === 0) throw new Error('media server not ready')
  return `http://127.0.0.1:${mediaPort}/media/${Buffer.from(path, 'utf8').toString('base64url')}`
}

function playMedia(path: string) {
  const win = getPlayerWindow()
  const isVideo = mediaKind(path) === 'video'
  const src = mediaUrl(path)

  const run = () => {
    win.webContents.executeJavaScript(
      `(() => { const v = document.getElementById('player'); if (!v) return Promise.resolve({ ok: false, code: null, message: 'player not ready' }); v.src = ${JSON.stringify(src)}; return v.play().then(() => ({ ok: true, code: null, message: '' }), () => { const e = v.error || {}; return { ok: false, code: e.code ?? null, message: e.message || '' }; }); })()`
    ).then(async (res) => {
      if (!res?.ok) {
        let message = 'playback failed: ' + (res?.message || 'cannot load media file')
        if (res?.code) message += ` (code ${res.code})`
        if (isVideo && /\.(mp4|mov)$/i.test(path)) {
          const codec = await probeMediaTracks(path)
          if (codec !== 'unknown') message += ` [${codec}]`
        }
        sendEvent({ type: 'error', message })
        return
      }
      if (isVideo) {
        win.setBounds(screen.getPrimaryDisplay().bounds)
        win.show()
      }
      startHidePolling(win)
    }).catch(() => { /* window was destroyed mid-play */ })
  }

  if (win.webContents.isLoading()) win.webContents.once('did-finish-load', run)
  else run()
}

function startHidePolling(win: BrowserWindow) {
  stopHidePolling()
  hidePollTimer = setInterval(() => {
    if (win.isDestroyed()) {
      stopHidePolling()
      return
    }
    win.webContents.executeJavaScript(
      `(() => { const v = document.getElementById('player'); if (!v) return { done: true, error: null }; if (v.error) return { done: true, error: 'code ' + v.error.code + ' ' + (v.error.message || '') }; return { done: !!(v.ended || v.error), error: null }; })()`
    ).then((res) => {
      if (res?.error) {
        sendEvent({ type: 'error', message: 'playback failed: ' + res.error })
        hidePlayer()
      } else if (res?.done) {
        hidePlayer()
      }
    }).catch(() => hidePlayer())
  }, 500)
  // configured duration stops playback immediately; 0 = play until the end (120s safety cap)
  const forceSec = config.playDurationSec > 0 ? config.playDurationSec : 120
  hideForceTimer = setTimeout(() => hidePlayer(), forceSec * 1000)
}

function stopHidePolling() {
  if (hidePollTimer) clearInterval(hidePollTimer)
  if (hideForceTimer) clearTimeout(hideForceTimer)
  hidePollTimer = null
  hideForceTimer = null
}

function hidePlayer() {
  stopHidePolling()
  if (playerWin && !playerWin.isDestroyed()) {
    // pause + clear src so audio stops immediately, not just the window hiding
    playerWin.webContents.executeJavaScript(
      `(() => { const v = document.getElementById('player'); if (v) { v.pause(); v.removeAttribute('src'); } })()`
    ).catch(() => {})
    playerWin.hide()
  }
}

// ---- frame pipeline ----

async function handleFrame(jpegBase64: string) {
  if (!config.enabled || workerBusy) return null
  workerBusy = true
  try {
    const res = await recognizeAndMatch(jpegBase64)
    workerErrorReported = false
    if (res.matched) {
      hitStreak++
      if (hitStreak >= config.sensitivity && Date.now() - lastTriggerAt > config.cooldownSec * 1000) {
        trigger(res.matchedKeyword!)
      }
    } else {
      hitStreak = 0
    }
    return res
  } catch (err: any) {
    if (!workerErrorReported) {
      workerErrorReported = true
      sendEvent({ type: 'error', message: String(err?.message || err) })
    }
    return null
  } finally {
    workerBusy = false
  }
}

// ---- IPC ----

const MIME: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  flac: 'audio/flac',
}

export function registerDeathwatchIpc() {
  ipcMain.handle('deathwatch:get-config', () => config)

  ipcMain.handle('deathwatch:set-config', (_e, patch: Partial<DeathwatchConfig>) => {
    config = { ...config, ...patch }
    saveConfig()
    if (config.enabled) void ensureOcr().catch(() => { /* errors surface via deathwatch:frame */ })
    sendEvent({ type: 'config', config })
    return config
  })

  ipcMain.handle('deathwatch:pick-media', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Select media file',
      properties: ['openFile'],
      filters: [
        { name: 'Media', extensions: ['mp4', 'webm', 'mov', 'mp3', 'wav', 'ogg', 'm4a', 'flac'] },
      ],
    })
    if (canceled || !filePaths[0]) return null
    const path = filePaths[0]
    return { path, kind: mediaKind(path) }
  })

  ipcMain.handle('deathwatch:frame', (_e, jpegBase64: string) => handleFrame(jpegBase64))

  ipcMain.handle('deathwatch:test-play', () => {
    const path = randomMediaPath()
    if (!path) return false
    playMedia(path)
    return true
  })

  ipcMain.handle('deathwatch:test-ocr', async () => {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1280, height: 720 },
    })
    const src = sources[0]
    if (!src) return { text: '', matched: false, matchedKeyword: null, textPreview: '' }
    const { width, height } = src.thumbnail.getSize()
    // same top-left 1/3 crop as the capture engine
    const cropW = Math.round(width / 3)
    const cropH = Math.round(height / 3)
    const cropped = src.thumbnail.crop({ x: 0, y: 0, width: cropW, height: cropH })
    const img = cropped.resize({ width: 960, height: Math.max(1, Math.round(960 * (cropH / cropW))) })
    return recognizeAndMatch(img.toJPEG(60).toString('base64'))
  })

  ipcMain.handle('deathwatch:read-media', async (_e, path: string) => {
    try {
      const buf = await readFile(path)
      if (buf.length > 200 * 1024 * 1024) return null
      const ext = path.split('.').pop()?.toLowerCase() || ''
      return `data:${MIME[ext] || 'application/octet-stream'};base64,${buf.toString('base64')}`
    } catch {
      return null
    }
  })
}
