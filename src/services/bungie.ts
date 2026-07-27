// All Bungie API calls now go through the Electron main process via IPC.
// This avoids browser Origin header checks that would reject localhost requests.

export interface DestinyMembership {
  membershipId: string
  membershipType: number
  displayName: string
  bungieGlobalDisplayName: string
  bungieGlobalDisplayNameCode: number
  crossSaveOverride: number
  applicableMembershipTypes: number[]
}

export interface UserMembershipsResponse {
  destinyMemberships: DestinyMembership[]
  bungieNetUser: { membershipId: string; displayName: string }
}

export interface DestinyCharacter {
  characterId: string
  classType: number
  classHash: number
  light: number
  emblemBackgroundPath: string
  emblemPath: string
  dateLastPlayed: string
  minutesPlayedTotal: string
  raceHash: number
  genderHash: number
}

export interface DestinyProfile {
  profile: {
    data: {
      userInfo: { membershipType: number; membershipId: string; displayName: string }
      characterIds: string[]
      dateLastPlayed: string
    }
  }
  characters: {
    data: Record<string, DestinyCharacter>
  }
}

export const CLASS_NAMES: Record<number, string> = {
  0: 'Titan',
  1: 'Hunter',
  2: 'Warlock',
}

export function resolveBungieUrl(path: string): string {
  if (!path) return ''
  return `https://www.bungie.net${path}`
}

// Token management (used by login/logout to sync with main process token)
let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

// ---- API Functions (routed through Electron main process) ----

export async function getDestinyMemberships(
  membershipId: string
): Promise<UserMembershipsResponse> {
  return window.electronAPI.bungieGetMemberships(membershipId)
}

export async function getProfile(
  membershipType: number,
  membershipId: string,
  components: number[] = [100, 200]
): Promise<DestinyProfile> {
  return window.electronAPI.bungieGetProfile(membershipType, membershipId, components)
}
