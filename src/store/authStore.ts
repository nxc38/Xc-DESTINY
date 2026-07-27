import { create } from 'zustand'

interface AuthState {
  isAuthenticated: boolean
  membershipId: string | null
  displayName: string | null
  accessToken: string | null
  setAuth: (data: {
    membershipId: string
    displayName: string
    accessToken: string
  }) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  membershipId: null,
  displayName: null,
  accessToken: null,
  setAuth: (data) =>
    set({
      isAuthenticated: true,
      membershipId: data.membershipId,
      displayName: data.displayName,
      accessToken: data.accessToken,
    }),
  clearAuth: () =>
    set({
      isAuthenticated: false,
      membershipId: null,
      displayName: null,
      accessToken: null,
    }),
}))
