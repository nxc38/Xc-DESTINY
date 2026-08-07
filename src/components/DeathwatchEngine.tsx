import { useEffect, useRef, useState } from 'react'
import type { DeathwatchConfig } from '../types/deathwatch'

const CAPTURE_WIDTH = 960
const FRAME_INTERVAL_MS = 500
// death text sits at the top-left corner; crop the top-left 1/3 x 1/3 and upscale
const CROP = { x: 0, y: 0, w: 1 / 3, h: 1 / 3 }

export default function DeathwatchEngine() {
  const [config, setConfig] = useState<DeathwatchConfig | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)
  const retryTimerRef = useRef<number | null>(null)
  const retryCountRef = useRef(0)
  const busyRef = useRef(false)
  const MAX_RETRIES = 3
  const RETRY_DELAY_MS = 5000

  // Initial config + keep in sync with settings-page changes (main broadcasts 'config' events)
  useEffect(() => {
    window.electronAPI.deathwatchGetConfig().then(setConfig)
    return window.electronAPI.deathwatchOnEvent((evt) => {
      if (evt.type === 'config' && evt.config) setConfig(evt.config)
    })
  }, [])

  useEffect(() => {
    if (!config?.enabled) {
      stopCapture()
      return
    }
    startCapture()
    return () => stopCapture()
  }, [config?.enabled])

  function scheduleRetry() {
    if (retryTimerRef.current !== null) return
    if (retryCountRef.current >= MAX_RETRIES) {
      console.warn(
        '[deathwatch] capture failed after ' + MAX_RETRIES + ' attempts — ' +
        'make sure the game window is not minimized and runs in windowed fullscreen, ' +
        'or set the source mode to 整个屏幕'
      )
      return
    }
    retryCountRef.current++
    console.warn('[deathwatch] capture failed, retrying in ' + RETRY_DELAY_MS / 1000 + 's...')
    retryTimerRef.current = window.setTimeout(() => {
      retryTimerRef.current = null
      startCapture()
    }, RETRY_DELAY_MS)
  }

  async function startCapture() {
    if (streamRef.current) return
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { max: 2 } },
        audio: false,
      })
      streamRef.current = stream
      retryCountRef.current = 0
      stream.getTracks().forEach((t) => {
        t.addEventListener('ended', () => {
          console.warn('[deathwatch] capture stream ended')
          stopCapture()
          scheduleRetry()
        })
      })
      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      await video.play().catch(() => {})
      timerRef.current = window.setInterval(captureFrame, FRAME_INTERVAL_MS)
      console.log('[deathwatch] capture started')
    } catch (err) {
      console.error('[deathwatch] capture start failed:', err)
      scheduleRetry()
    }
  }

  function stopCapture() {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    const video = videoRef.current
    if (video) video.srcObject = null
  }

  async function captureFrame() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2 || busyRef.current) return
    busyRef.current = true
    try {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const vw = video.videoWidth
      const vh = video.videoHeight
      const cropW = CROP.w * vw
      const cropH = CROP.h * vh
      canvas.width = CAPTURE_WIDTH
      canvas.height = Math.max(1, Math.round(CAPTURE_WIDTH * (cropH / cropW)))
      ctx.drawImage(
        video,
        CROP.x * vw, CROP.y * vh, cropW, cropH,
        0, 0, canvas.width, canvas.height
      )
      const dataUrl = canvas.toDataURL('image/jpeg', 0.55)
      await window.electronAPI.deathwatchFrame(dataUrl.split(',')[1])
    } catch (err) {
      // stream ended or window destroyed — capture loop stops on next effect run
      console.error('[deathwatch] frame error:', err)
    } finally {
      busyRef.current = false
    }
  }

  return (
    <div className="hidden">
      <video ref={videoRef} muted playsInline />
      <canvas ref={canvasRef} />
    </div>
  )
}
