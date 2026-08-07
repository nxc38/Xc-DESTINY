import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DeathIcon } from './DestinyIcon'
import type { DeathwatchConfig } from '../types/deathwatch'

interface TriggerLogEntry {
  time: number
  keyword: string
}

export default function DeathwatchSection() {
  const { t } = useTranslation()
  const [config, setConfig] = useState<DeathwatchConfig | null>(null)
  const [keywordsText, setKeywordsText] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState('')
  const [langpack, setLangpack] = useState<{ status?: string; progress?: number } | null>(null)
  const [lastTrigger, setLastTrigger] = useState<string | null>(null)
  const [log, setLog] = useState<TriggerLogEntry[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [testResult, setTestResult] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    window.electronAPI.deathwatchGetConfig().then((c) => {
      setConfig(c)
      setKeywordsText(c.keywords.join('\n'))
    })
    return window.electronAPI.deathwatchOnEvent((evt) => {
      if (evt.type === 'langpack') {
        if (evt.progress != null && evt.progress >= 1) setLangpack(null)
        else setLangpack({ status: evt.status, progress: evt.progress })
      } else if (evt.type === 'trigger') {
        const time = new Date().toLocaleTimeString()
        setLastTrigger(`${time} · ${evt.keyword || ''}`)
        setLog((l) => [{ time: Date.now(), keyword: evt.keyword || '' }, ...l].slice(0, 5))
        setErrorMsg('')
      } else if (evt.type === 'error') {
        setErrorMsg(evt.message || t('deathwatch.unknownError'))
      }
    })
  }, [])

  async function applyPatch(patch: Partial<DeathwatchConfig>) {
    const updated = await window.electronAPI.deathwatchSetConfig(patch)
    setConfig(updated)
    return updated
  }

  async function handlePickMedia() {
    const res = await window.electronAPI.deathwatchPickMedia()
    if (!res || !config) return
    const paths = config.mediaPaths.includes(res.path)
      ? config.mediaPaths
      : [...config.mediaPaths, res.path]
    await applyPatch({ mediaPaths: paths })
    const url = await window.electronAPI.deathwatchReadMedia(res.path)
    setPreviewUrl(url)
  }

  async function handleRemoveMedia(path: string) {
    if (!config) return
    await applyPatch({ mediaPaths: config.mediaPaths.filter((p) => p !== path) })
    setPreviewUrl(null)
  }

  async function handlePreviewMedia(path: string) {
    const url = await window.electronAPI.deathwatchReadMedia(path)
    if (url) setPreviewUrl(url)
  }

  async function handleSaveDetection() {
    if (!config) return
    const updated = await applyPatch({
      keywords: keywordsText.split('\n').map((k) => k.trim()).filter(Boolean),
      sensitivity: config.sensitivity,
      cooldownSec: config.cooldownSec,
      sourceMode: config.sourceMode,
    })
    setConfig(updated)
    setSavedMsg(t('deathwatch.saved'))
    setTimeout(() => setSavedMsg(''), 2000)
  }

  async function handleTestOcr() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await window.electronAPI.deathwatchTestOcr()
      const matched = res.matched
        ? t('deathwatch.matchedKeyword', { keyword: res.matchedKeyword || '?' })
        : t('deathwatch.noMatch')
      const text = res.textPreview ? `\n${t('deathwatch.ocrText')}: ${res.textPreview}` : ''
      setTestResult(matched + text)
    } catch (err: any) {
      setTestResult(`${t('deathwatch.unknownError')}: ${err?.message || ''}`)
    } finally {
      setTesting(false)
    }
  }

  if (!config) {
    return <div className="p-6 text-white/40 text-sm">{t('guardian.loading')}</div>
  }

  const card = 'rounded-xl bg-destiny-surface/60 border border-destiny-primary/10 overflow-hidden'
  const cardHead = 'px-5 py-3 border-b border-destiny-primary/8 flex items-center gap-2.5'
  const cardTitle = 'text-[13px] font-semibold text-white tracking-wide'

  return (
    <div className="p-6 space-y-5">
      {/* Status */}
      <div className={card}>
        <div className={cardHead}>
          <DeathIcon className="w-4 h-4 text-red-400/70" />
          <h3 className={cardTitle}>{t('deathwatch.status')}</h3>
        </div>
        <div className="p-5 space-y-4">
          <button
            onClick={() => applyPatch({ enabled: !config.enabled })}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all duration-200
              ${config.enabled
                ? 'bg-red-500/10 border-red-500/25'
                : 'bg-[#0A0A16]/60 border-white/[0.04] hover:border-white/[0.08]'
              }`}
          >
            <span className="text-[13px] text-white/85">{t('deathwatch.enable')}</span>
            <span className="flex items-center gap-2">
              <span className={`text-[11px] ${config.enabled ? 'text-red-400/80' : 'text-white/30'}`}>
                {config.enabled ? t('deathwatch.listening') : t('deathwatch.stopped')}
              </span>
              <span className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${config.enabled ? 'bg-red-500/60' : 'bg-white/10'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${config.enabled ? 'left-[18px]' : 'left-0.5'}`} />
              </span>
            </span>
          </button>

          {langpack && (
            <div className="px-4 py-3 rounded-lg bg-destiny-primary/10 border border-destiny-primary/15">
              <p className="text-[12px] text-destiny-primary-light/80 mb-1.5">{t('deathwatch.langpackDownloading', { progress: Math.round((langpack.progress ?? 0) * 100) })}</p>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-destiny-primary-light transition-all duration-300"
                     style={{ width: `${Math.round((langpack.progress ?? 0) * 100)}%` }} />
              </div>
              <p className="text-[10px] text-white/35 mt-1.5">{t('deathwatch.langpackHint')}</p>
            </div>
          )}

          {errorMsg && (
            <div className="px-4 py-3 rounded-lg bg-red-500/5 border border-red-500/15">
              <p className="text-[12px] text-red-400/80">{errorMsg}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-[#0A0A16]/60 border border-white/[0.04]">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{t('deathwatch.lastTrigger')}</p>
              <p className="text-xs text-white/70 truncate">{lastTrigger || t('deathwatch.never')}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#0A0A16]/60 border border-white/[0.04]">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{t('deathwatch.source')}</p>
              <p className="text-xs text-white/70 truncate">
                {config.sourceMode === 'destiny-window'
                  ? t('deathwatch.sourceDestiny')
                  : config.sourceMode === 'screen'
                    ? t('deathwatch.sourceScreen')
                    : t('deathwatch.sourceAuto')}
              </p>
            </div>
          </div>

          {log.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-white/30 uppercase tracking-wider">{t('deathwatch.triggerLog')}</p>
              {log.map((entry, i) => (
                <div key={entry.time + i} className="flex items-center justify-between px-3 py-1.5 rounded-md bg-white/[0.02] border border-white/[0.03]">
                  <span className="text-[11px] text-red-400/70">{entry.keyword}</span>
                  <span className="text-[10px] text-white/25">{new Date(entry.time).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Media */}
      <div className={card}>
        <div className={cardHead}>
          <DeathIcon className="w-4 h-4 text-red-400/70" />
          <h3 className={cardTitle}>{t('deathwatch.media')}</h3>
        </div>
        <div className="p-5 space-y-3">
          <button
            onClick={handlePickMedia}
            className="px-4 py-2 rounded-md text-xs font-medium bg-destiny-primary/60 hover:bg-destiny-primary text-white border border-destiny-primary-light/20 transition-all duration-200"
          >
            {t('deathwatch.selectMedia')}
          </button>
          <p className="text-[11px] text-white/35">{t('deathwatch.selectMediaDesc')}</p>
          {config.mediaPaths.length > 0 && (
            <div className="space-y-1.5">
              {config.mediaPaths.map((p, i) => (
                <div key={p + i} className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#0A0A16]/60 border border-white/[0.04]">
                  <button onClick={() => handlePreviewMedia(p)} className="flex-1 min-w-0 text-left">
                    <span className="text-[11px] text-white/50 font-mono truncate block">{p}</span>
                  </button>
                  <button
                    onClick={() => handleRemoveMedia(p)}
                    className="shrink-0 text-[10px] text-white/40 hover:text-red-400 transition-colors duration-200"
                  >
                    {t('deathwatch.removeMedia')}
                  </button>
                </div>
              ))}
            </div>
          )}
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">{t('deathwatch.playDuration')}</p>
            <input
              type="number"
              min={0}
              max={600}
              value={config.playDurationSec}
              onChange={(e) => applyPatch({ playDurationSec: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-[#0A0A16]/60 border border-white/[0.06] text-xs text-white/70 outline-none focus:border-destiny-primary-light/40"
            />
            <p className="text-[10px] text-white/25 mt-1">{t('deathwatch.playDurationHint')}</p>
          </div>
          {previewUrl && (
            <div className="rounded-lg overflow-hidden bg-black border border-white/[0.06]">
              {previewUrl.startsWith('data:video') ? (
                <video src={previewUrl} controls className="w-full max-h-64" />
              ) : (
                <audio src={previewUrl} controls className="w-full" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detection */}
      <div className={card}>
        <div className={cardHead}>
          <DeathIcon className="w-4 h-4 text-red-400/70" />
          <h3 className={cardTitle}>{t('deathwatch.detection')}</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">{t('deathwatch.sourceMode')}</p>
              <select
                value={config.sourceMode}
                onChange={(e) => applyPatch({ sourceMode: e.target.value as DeathwatchConfig['sourceMode'] })}
                className="w-full px-3 py-2 rounded-lg bg-[#0A0A16]/60 border border-white/[0.06] text-xs text-white/70 outline-none focus:border-destiny-primary-light/40"
              >
                <option value="auto">{t('deathwatch.sourceAuto')}</option>
                <option value="destiny-window">{t('deathwatch.sourceDestiny')}</option>
                <option value="screen">{t('deathwatch.sourceScreen')}</option>
              </select>
            </div>
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">{t('deathwatch.sensitivity')}</p>
              <select
                value={config.sensitivity}
                onChange={(e) => setConfig({ ...config, sensitivity: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-[#0A0A16]/60 border border-white/[0.06] text-xs text-white/70 outline-none focus:border-destiny-primary-light/40"
              >
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">{t('deathwatch.cooldown')}</p>
              <input
                type="number"
                min={1}
                max={120}
                value={config.cooldownSec}
                onChange={(e) => setConfig({ ...config, cooldownSec: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-[#0A0A16]/60 border border-white/[0.06] text-xs text-white/70 outline-none focus:border-destiny-primary-light/40"
              />
            </div>
          </div>

          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">{t('deathwatch.keywords')}</p>
            <textarea
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 rounded-lg bg-[#0A0A16]/60 border border-white/[0.06] text-xs text-white/70 outline-none focus:border-destiny-primary-light/40 resize-y font-mono"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDetection}
              className="px-4 py-2 rounded-md text-xs font-medium bg-destiny-primary/60 hover:bg-destiny-primary text-white border border-destiny-primary-light/20 transition-all duration-200"
            >
              {t('deathwatch.save')}
            </button>
            {savedMsg && <span className="text-[11px] text-green-400/70">{savedMsg}</span>}
          </div>
        </div>
      </div>

      {/* Test */}
      <div className={card}>
        <div className={cardHead}>
          <DeathIcon className="w-4 h-4 text-red-400/70" />
          <h3 className={cardTitle}>{t('deathwatch.test')}</h3>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => window.electronAPI.deathwatchTestPlay()}
              className="px-4 py-2 rounded-md text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-white/80 border border-white/[0.06] transition-all duration-200"
            >
              {t('deathwatch.testPlay')}
            </button>
            <button
              onClick={handleTestOcr}
              disabled={testing}
              className="px-4 py-2 rounded-md text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-white/80 border border-white/[0.06] transition-all duration-200 disabled:opacity-50"
            >
              {testing ? '...' : t('deathwatch.testOcr')}
            </button>
          </div>
          <p className="text-[11px] text-white/35">{t('deathwatch.testOcrHint')}</p>
          {testResult && (
            <div className="px-4 py-3 rounded-lg bg-[#0A0A16]/60 border border-white/[0.04]">
              <p className="text-[12px] text-white/70 whitespace-pre-wrap break-all">{testResult}</p>
            </div>
          )}
        </div>
      </div>

      {/* Hints */}
      <div className="space-y-2">
        <p className="text-[11px] text-yellow-500/50 leading-relaxed">{t('deathwatch.fullscreenHint')}</p>
        <p className="text-[11px] text-white/25 leading-relaxed">{t('deathwatch.pveHint')}</p>
      </div>
    </div>
  )
}
