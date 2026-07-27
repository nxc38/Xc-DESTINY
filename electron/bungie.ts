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
