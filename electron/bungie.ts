import axios from 'axios'
import { getAccessToken } from './oauth'

const API_KEY = '179f73bc2b6d4514a72de7dabecd2271'
const BASE_URL = 'https://www.bungie.net/Platform'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
  },
})

// Add Bearer token from oauth module
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  // No Origin header in Node.js — avoids Bungie API key origin check
  return config
})

// ---- Types ----

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

// ---- API Functions ----

export async function getDestinyMemberships(
  membershipId: string
): Promise<UserMembershipsResponse> {
  // membershipType 254 = BungieNext (Bungie.net membership ID)
  const res = await api.get(`/User/GetMembershipsById/${membershipId}/254/`)
  return res.data.Response
}

export async function getProfile(
  membershipType: number,
  membershipId: string,
  components: number[] = [100, 200]
): Promise<DestinyProfile> {
  const res = await api.get(
    `/Destiny2/${membershipType}/Profile/${membershipId}/`,
    { params: { components: components.join(',') } }
  )
  return res.data.Response
}

// ---- Activity History ----

export interface DestinyHistoricalStatsValue {
  statId: string
  basic: {
    value: number
    displayValue: string
  }
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

export async function getActivityHistory(
  membershipType: number,
  membershipId: string,
  characterId: string,
  count: number = 20,
  mode: number = 0
): Promise<DestinyActivityHistoryResults> {
  const res = await api.get(
    `/Destiny2/${membershipType}/Account/${membershipId}/Character/${characterId}/Stats/Activities/`,
    { params: { count, mode } }
  )
  return res.data.Response
}

// ---- Activity Definition Manifest ----

export interface DestinyActivityDefinition {
  displayProperties: {
    name: string
    description: string
    icon: string
    hasIcon: boolean
  }
  pgcrImage: string
  activityTypeHash: number
  activityModeTypes: number[]
  isPvP: boolean
  placeHash: number
  destinationHash: number
}

const activityManifestCache = new Map<string, DestinyActivityDefinition>()

export async function getManifestActivity(
  hash: number,
  locale: string = 'en'
): Promise<DestinyActivityDefinition | null> {
  const cacheKey = `${locale}:${hash}`
  if (activityManifestCache.has(cacheKey)) {
    return activityManifestCache.get(cacheKey)!
  }
  try {
    const res = await api.get(
      `/Destiny2/Manifest/DestinyActivityDefinition/${hash}/`,
      { params: { lc: locale } }
    )
    const def = res.data.Response as DestinyActivityDefinition
    activityManifestCache.set(cacheKey, def)
    return def
  } catch (err) {
    console.error(`[Manifest] Failed to fetch activity ${hash}:`, err)
    return null
  }
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
  const params: Record<string, string> = {}
  if (modes && modes.length > 0) {
    params.modes = modes.join(',')
  }
  const res = await api.get(
    `/Destiny2/${membershipType}/Account/${membershipId}/Stats/`,
    { params }
  )
  return res.data.Response
}

