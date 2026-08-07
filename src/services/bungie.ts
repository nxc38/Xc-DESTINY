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

// ---- Token management ----

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

// ---- Activity History ----

export interface DestinyHistoricalStatsValue {
  statId: string
  basic: { value: number; displayValue: string }
}

export interface DestinyHistoricalStatsPeriodGroup {
  period: string
  activityDetails: {
    referenceId: number
    instanceId: string
    mode: number
    modes: number[]
    directorActivityHash: number
    isPrivate: boolean
    membershipType: number
  }
  values: Record<string, DestinyHistoricalStatsValue>
}

export interface DestinyActivityHistoryResults {
  activities: DestinyHistoricalStatsPeriodGroup[]
}

export interface DestinyActivityDefinition {
  displayProperties: { name: string; description: string; icon: string; hasIcon: boolean }
  pgcrImage: string
  activityTypeHash: number
  activityModeTypes: number[]
  isPvP: boolean
}

export async function getActivityHistory(
  membershipType: number,
  membershipId: string,
  characterId: string,
  count: number = 20,
  mode: number = 0
): Promise<DestinyActivityHistoryResults> {
  return window.electronAPI.bungieGetActivityHistory(membershipType, membershipId, characterId, count, mode)
}

export async function getManifestActivity(
  hash: number,
  locale: string = 'en'
): Promise<DestinyActivityDefinition | null> {
  return window.electronAPI.bungieGetManifestActivity(hash, locale)
}

// ---- Account/Character Stats ----

export interface DestinyStatsPeriodGroup {
  allTime: Record<string, DestinyHistoricalStatsValue>
  allTimeScore: Record<string, DestinyHistoricalStatsValue>
  results: Record<string, Record<string, DestinyHistoricalStatsValue>>
}

export interface DestinyAccountStats {
  mergedAllCharacters: {
    merged: DestinyStatsPeriodGroup
    results: { allTime: Record<string, DestinyHistoricalStatsValue> }
  }
  characters: {
    characterId: string
    merged: DestinyStatsPeriodGroup
    results: { allTime: Record<string, DestinyHistoricalStatsValue> }
  }[]
}

export async function getAccountStats(
  membershipType: number,
  membershipId: string,
  modes?: number[]
): Promise<DestinyAccountStats> {
  return window.electronAPI.bungieGetAccountStats(membershipType, membershipId, modes)
}

// ---- Game Mode Names ----

export const ACTIVITY_MODE_NAMES: Record<number, string> = {
  2: 'Story',
  3: 'Strike',
  4: 'Raid',
  5: 'Crucible',
  6: 'Patrol',
  7: 'PvE',
  12: 'Arena',
  16: 'Nightfall',
  17: 'Iron Banner',
  18: 'Gambit',
  25: 'Trials of Osiris',
  31: 'Dungeon',
  32: 'Offensive',
  37: 'Onslaught',
  39: 'Episode',
  40: 'Vanguard Ops',
  41: 'Seasonal',
  43: 'Excision',
  46: 'Grandmaster',
  47: 'Pantheon',
  48: 'Rushdown',
  50: 'Court of Blades',
}
