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

export interface DeathwatchFrameResult {
  matched: boolean
  matchedKeyword: string | null
  textPreview: string
}
