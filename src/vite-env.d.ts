/// <reference types="vite/client" />

export interface ElectronAPI {
  openBungieAuth: () => Promise<void>
  getAuthTokens: () => Promise<AuthTokens | null>
  clearAuthTokens: () => Promise<void>
  getMembershipId: () => Promise<string | null>
  onAuthSuccess: (callback: () => void) => () => void
  processOAuthUrl: (url: string) => Promise<void>
  bungieGetMemberships: (membershipId: string) => Promise<any>
  bungieGetProfile: (membershipType: number, membershipId: string, components?: number[]) => Promise<any>
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
}
