/// <reference types="vite/client" />

import type { DeathwatchConfig, DeathwatchEvent, DeathwatchFrameResult } from './types/deathwatch'

export interface ElectronAPI {
  openBungieAuth: () => Promise<void>
  getAuthTokens: () => Promise<AuthTokens | null>
  clearAuthTokens: () => Promise<void>
  getMembershipId: () => Promise<string | null>
  onAuthSuccess: (callback: () => void) => () => void
  processOAuthUrl: (url: string) => Promise<void>
  bungieGetMemberships: (membershipId: string) => Promise<any>
  bungieGetProfile: (membershipType: number, membershipId: string, components?: number[]) => Promise<any>
  bungieGetActivityHistory: (membershipType: number, membershipId: string, characterId: string, count?: number, mode?: number) => Promise<any>
  bungieGetManifestActivity: (hash: number, locale?: string) => Promise<any>
  bungieGetAccountStats: (membershipType: number, membershipId: string, modes?: number[]) => Promise<any>
  deathwatchGetConfig: () => Promise<DeathwatchConfig>
  deathwatchSetConfig: (patch: Partial<DeathwatchConfig>) => Promise<DeathwatchConfig>
  deathwatchPickMedia: () => Promise<{ path: string; kind: 'video' | 'audio' } | null>
  deathwatchFrame: (jpegBase64: string) => Promise<DeathwatchFrameResult | null>
  deathwatchTestPlay: () => Promise<boolean>
  deathwatchTestOcr: () => Promise<DeathwatchFrameResult>
  deathwatchReadMedia: (path: string) => Promise<string | null>
  deathwatchOnEvent: (callback: (evt: DeathwatchEvent) => void) => () => void
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  membershipId: string
  displayName: string
  expiresAt: number
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }

  namespace JSX {
    interface IntrinsicElements {
      webview: import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string
        partition?: string
      }
    }
  }
}
