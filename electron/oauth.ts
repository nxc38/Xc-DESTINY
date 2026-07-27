import axios from 'axios'
import crypto from 'crypto'

const BUNGIE_AUTH_URL = 'https://www.bungie.net/en/OAuth/Authorize'
const BUNGIE_TOKEN_URL = 'https://www.bungie.net/Platform/App/OAuth/Token/'
const CLIENT_ID = '54020'
const REDIRECT_URI = 'neavendestiny://oauth/callback'

let tokenStore: {
  accessToken: string
  refreshToken: string
  membershipId: string
  displayName: string
  expiresAt: number
} | null = null

let pendingState: string | null = null

export function buildAuthUrl(): string {
  // No 'state' param — the & in callback?code=xxx&state=yyy breaks
  // Windows ShellExecute which interprets & as a command separator.
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
  })
  return `${BUNGIE_AUTH_URL}?${params.toString()}`
}

function verifyState(state: string): boolean {
  if (!pendingState) return true
  return state === pendingState
}

export async function handleOAuthCallback(url: string): Promise<void> {
  const urlObj = new URL(url)
  const code = urlObj.searchParams.get('code')
  const state = urlObj.searchParams.get('state')

  if (!code) {
    console.error('No authorization code in callback URL')
    return
  }

  if (state && !verifyState(state)) {
    console.error('OAuth state mismatch')
    return
  }

  const response = await axios.post(
    BUNGIE_TOKEN_URL,
    new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
    }).toString(),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  )

  const data = response.data

  tokenStore = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    membershipId: data.membership_id,
    displayName: data.display_name || 'Guardian',
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  }
}

export function getStoredTokens() {
  return tokenStore
}

export function clearTokens() {
  tokenStore = null
  pendingState = null
}

export function getAccessToken(): string | null {
  if (!tokenStore) return null
  if (Date.now() > tokenStore.expiresAt - 60000) return null
  return tokenStore.accessToken
}

export async function refreshAccessToken(): Promise<string | null> {
  if (!tokenStore?.refreshToken) return null
  try {
    const response = await axios.post(
      BUNGIE_TOKEN_URL,
      new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: tokenStore.refreshToken,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    )
    const data = response.data
    tokenStore = {
      ...tokenStore,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    }
    return tokenStore.accessToken
  } catch {
    tokenStore = null
    return null
  }
}
