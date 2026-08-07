import { contextBridge, ipcRenderer } from 'electron'
import type { DeathwatchConfig, DeathwatchEvent, DeathwatchFrameResult } from '../src/types/deathwatch'

export interface ElectronAPI {
  openBungieAuth: () => Promise<void>
  getAuthTokens: () => Promise<{
    accessToken: string
    refreshToken: string
    membershipId: string
    displayName: string
    expiresAt: number
  } | null>
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

contextBridge.exposeInMainWorld('electronAPI', {
  openBungieAuth: () => ipcRenderer.invoke('open-bungie-auth'),
  getAuthTokens: () => ipcRenderer.invoke('get-auth-tokens'),
  clearAuthTokens: () => ipcRenderer.invoke('clear-auth-tokens'),
  getMembershipId: () => ipcRenderer.invoke('get-membership-id'),
  onAuthSuccess: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('auth-success', handler)
    return () => ipcRenderer.removeListener('auth-success', handler)
  },
  processOAuthUrl: (url: string) => ipcRenderer.invoke('process-oauth-url', url),
  bungieGetMemberships: (membershipId: string) =>
    ipcRenderer.invoke('bungie:get-memberships', membershipId),
  bungieGetProfile: (membershipType: number, membershipId: string, components?: number[]) =>
    ipcRenderer.invoke('bungie:get-profile', membershipType, membershipId, components),
  bungieGetActivityHistory: (membershipType: number, membershipId: string, characterId: string, count?: number, mode?: number) =>
    ipcRenderer.invoke('bungie:get-activity-history', membershipType, membershipId, characterId, count, mode),
  bungieGetManifestActivity: (hash: number, locale?: string) =>
    ipcRenderer.invoke('bungie:get-manifest-activity', hash, locale),
  bungieGetAccountStats: (membershipType: number, membershipId: string, modes?: number[]) =>
    ipcRenderer.invoke('bungie:get-account-stats', membershipType, membershipId, modes),
  deathwatchGetConfig: () => ipcRenderer.invoke('deathwatch:get-config'),
  deathwatchSetConfig: (patch: Partial<DeathwatchConfig>) =>
    ipcRenderer.invoke('deathwatch:set-config', patch),
  deathwatchPickMedia: () => ipcRenderer.invoke('deathwatch:pick-media'),
  deathwatchFrame: (jpegBase64: string) => ipcRenderer.invoke('deathwatch:frame', jpegBase64),
  deathwatchTestPlay: () => ipcRenderer.invoke('deathwatch:test-play'),
  deathwatchTestOcr: () => ipcRenderer.invoke('deathwatch:test-ocr'),
  deathwatchReadMedia: (path: string) => ipcRenderer.invoke('deathwatch:read-media', path),
  deathwatchOnEvent: (callback: (evt: DeathwatchEvent) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, evt: DeathwatchEvent) => callback(evt)
    ipcRenderer.on('deathwatch:event', handler)
    return () => ipcRenderer.removeListener('deathwatch:event', handler)
  },
} satisfies ElectronAPI)
