export interface BungieMembership {
  membershipId: string
  membershipType: number
  displayName: string
  bungieGlobalDisplayName: string
  bungieGlobalDisplayNameCode: number
}

export interface DestinyCharacter {
  characterId: string
  classType: number
  classHash: number
  light: number
  emblemBackgroundPath: string
  emblemPath: string
  dateLastPlayed: string
}

export interface DestinyProfileResponse {
  profile: {
    data: {
      userInfo: {
        membershipType: number
        membershipId: string
        displayName: string
      }
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

export const CLASS_COLORS: Record<number, string> = {
  0: '#C73E3A', // Titan - Red
  1: '#3466B1', // Hunter - Blue
  2: '#E8C83C', // Warlock - Yellow
}
