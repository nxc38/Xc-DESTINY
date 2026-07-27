import { contextBridge, ipcRenderer } from 'electron'

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
} satisfies ElectronAPI)
