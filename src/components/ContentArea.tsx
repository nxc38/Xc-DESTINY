import { useEffect, useState } from 'react'
import { TitanIcon, HunterIcon, WarlockIcon, InventoryIcon, VaultIcon, VendorIcon, SettingsIcon, SwordIcon, GhostIcon } from './DestinyIcon'
import { useAuthStore } from '../store/authStore'
import {
  getDestinyMemberships,
  getProfile,
  resolveBungieUrl,
  setAccessToken,
  CLASS_NAMES,
  type DestinyMembership,
  type DestinyCharacter,
} from '../services/bungie'
import type { NavSection } from '../pages/DashboardPage'

interface ContentAreaProps {
  activeSection: NavSection
}

interface CharacterData {
  membership: DestinyMembership
  characters: DestinyCharacter[]
  primaryMembershipId: string
}

const CLASS_ACCENT_COLORS: Record<number, string> = {
  0: '#C73E3A',
  1: '#3466B1',
  2: '#E8C83C',
}

const CLASS_ICONS: Record<number, React.ReactNode> = {
  0: <TitanIcon className="w-6 h-6" />,
  1: <HunterIcon className="w-6 h-6" />,
  2: <WarlockIcon className="w-6 h-6" />,
}

const sectionConfig: Record<NavSection, {
  title: string
  subtitle: string
  icon: React.ReactNode
  accentColor: string
  description: string
}> = {
  guardian: {
    title: 'Guardian',
    subtitle: 'Characters & Loadouts',
    icon: <TitanIcon className="w-12 h-12" />,
    accentColor: '#C73E3A',
    description: 'Select your character and manage equipment loadouts.',
  },
  inventory: {
    title: 'Inventory',
    subtitle: 'Character Inventory',
    icon: <InventoryIcon className="w-12 h-12" />,
    accentColor: '#7C3AED',
    description: 'Browse and manage your character inventory and equipped gear.',
  },
  vault: {
    title: 'Vault',
    subtitle: 'Item Storage',
    icon: <VaultIcon className="w-12 h-12" />,
    accentColor: '#7C3AED',
    description: 'Access your vault to store and retrieve items across all characters.',
  },
  vendors: {
    title: 'Vendors',
    subtitle: 'Tower & Beyond',
    icon: <VendorIcon className="w-12 h-12" />,
    accentColor: '#F59E0B',
    description: 'Check vendor inventories, bounties, and reputation progress.',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Configuration',
    icon: <SettingsIcon className="w-12 h-12" />,
    accentColor: '#A78BFA',
    description: 'Configure application preferences and account settings.',
  },
}

function GuardianSection() {
  const { membershipId, accessToken } = useAuthStore()
  const [data, setData] = useState<CharacterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!membershipId || !accessToken) {
      setLoading(false)
      setError('Not authenticated. Please log in again.')
      return
    }

    let cancelled = false

    async function load() {
      // Ensure the axios instance has the current token (survives HMR resets)
      setAccessToken(accessToken)

      try {
        // Step 1: Get platform memberships linked to this Bungie account
        console.log('[API] Fetching memberships for:', membershipId)
        let memberships
        try {
          memberships = await getDestinyMemberships(membershipId!)
          console.log('[API] Memberships response:', JSON.stringify(memberships, null, 2))
        } catch (err: any) {
          const status = err?.response?.status
          const detail = err?.response?.data?.Message || err?.response?.data?.ErrorStatus || ''
          console.error('[API] GetMembershipsById failed:', status, detail, err?.response?.data)
          throw new Error(`GetMembershipsById failed [${status}]: ${detail || err.message}`)
        }

        if (!memberships.destinyMemberships?.length) {
          if (!cancelled) {
            setError('No Destiny 2 characters found on this account. Have you played Destiny 2?')
            setLoading(false)
          }
          return
        }

        // Use the first (primary) Destiny membership
        const primary = memberships.destinyMemberships[0]
        console.log('[API] Fetching profile for:', primary.membershipType, primary.membershipId)

        // Step 2: Get profile with character data
        let profile
        try {
          profile = await getProfile(primary.membershipType, primary.membershipId)
          console.log('[API] Profile response received, character count:',
            Object.keys(profile?.characters?.data || {}).length)
        } catch (err: any) {
          const status = err?.response?.status
          const detail = err?.response?.data?.Message || err?.response?.data?.ErrorStatus || ''
          console.error('[API] GetProfile failed:', status, detail, err?.response?.data)
          throw new Error(`GetProfile failed [${status}]: ${detail || err.message}`)
        }

        const characters = profile.characters?.data
          ? Object.values(profile.characters.data).sort(
              (a, b) => new Date(b.dateLastPlayed).getTime() - new Date(a.dateLastPlayed).getTime()
            )
          : []

        if (!cancelled) {
          setData({
            membership: primary,
            characters,
            primaryMembershipId: primary.membershipId,
          })
          setLoading(false)
        }
      } catch (err: any) {
        if (!cancelled) {
          const msg = err?.message || 'Failed to load character data'
          setError(msg)
          setLoading(false)
        }
      }
    }

    setLoading(true)
    setError('')
    load()
    return () => { cancelled = true }
  }, [membershipId, accessToken, retry])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-destiny-primary/20 blur-xl animate-pulse" />
            <GhostIcon className="relative w-10 h-10 text-destiny-primary-light animate-pulse" />
          </div>
          <p className="text-destiny-primary-light/50 text-sm tracking-wider">Loading character data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="m-6 p-5 rounded-xl bg-red-500/5 border border-red-500/15">
        <p className="text-red-400/80 text-sm mb-3">{error}</p>
        <button
          onClick={() => setRetry(r => r + 1)}
          className="px-4 py-2 rounded-md text-xs font-medium
                     bg-destiny-primary/60 hover:bg-destiny-primary
                     text-white border border-destiny-primary-light/20
                     transition-all duration-200"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5">
      {/* Welcome banner */}
      <div className="p-5 rounded-xl bg-destiny-surface/60 border border-destiny-primary/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-destiny-primary/5 blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-destiny-primary/15 border border-destiny-primary/20 flex items-center justify-center">
            <GhostIcon className="w-5 h-5 text-destiny-primary-light" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {data?.membership.bungieGlobalDisplayName || 'Guardian'}
              <span className="text-destiny-primary-light/40 font-normal">
                #{data?.membership.bungieGlobalDisplayNameCode}
              </span>
            </h3>
            <p className="text-xs text-destiny-primary-light/50 mt-0.5">
              {data?.characters.length || 0} character{(data?.characters.length || 0) !== 1 ? 's' : ''} ·{' '}
              {data?.membership.displayName}
            </p>
          </div>
        </div>
      </div>

      {/* Character cards */}
      {data && data.characters.length > 0 && (
        <div>
          <h4 className="text-[11px] text-destiny-primary-light/40 uppercase tracking-widest mb-3">
            Characters
          </h4>
          <div className="grid gap-3">
            {data.characters.map((char) => (
              <CharacterCard key={char.characterId} character={char} />
            ))}
          </div>
        </div>
      )}

      {data && data.characters.length === 0 && (
        <div className="text-center py-10">
          <p className="text-white/30 text-sm">No characters found</p>
        </div>
      )}
    </div>
  )
}

function CharacterCard({ character }: { character: DestinyCharacter }) {
  const classType = character.classType
  const accentColor = CLASS_ACCENT_COLORS[classType] || '#7C3AED'
  const className = CLASS_NAMES[classType] || 'Unknown'
  const emblemUrl = character.emblemBackgroundPath
    ? resolveBungieUrl(character.emblemBackgroundPath)
    : null
  const lastPlayed = new Date(character.dateLastPlayed)
  const daysAgo = Math.floor((Date.now() - lastPlayed.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-xl bg-destiny-surface/40 border border-white/[0.04]
                 hover:border-white/[0.08] transition-all duration-200"
    >
      {/* Emblem */}
      <div
        className="w-14 h-14 rounded-lg flex-shrink-0 bg-cover bg-center relative overflow-hidden"
        style={emblemUrl ? { backgroundImage: `url(${emblemUrl})` } : { backgroundColor: '#1A1A2E' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {/* Class icon overlay */}
        <div className="absolute bottom-0.5 right-0.5 text-white/80">
          {CLASS_ICONS[classType]}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-white">{className}</h4>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
          >
            {character.light}
          </span>
        </div>
        <p className="text-[11px] text-white/30 mt-0.5">
          {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`}
          {' · '}
          {Math.floor(Number(character.minutesPlayedTotal) / 60)}h played
        </p>
      </div>

      {/* Select arrow */}
      <div className="text-white/15 text-lg">→</div>
    </div>
  )
}

export default function ContentArea({ activeSection }: ContentAreaProps) {
  if (activeSection === 'guardian') {
    return (
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0A0A16]">
        <header className="h-14 border-b border-destiny-primary/10 flex items-center px-6 bg-[#0E0E20]/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="text-destiny-gold/80">
              <SwordIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-white leading-tight">Guardian</h2>
              <p className="text-[10px] text-destiny-primary-light/40">Characters & Loadouts</p>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <GuardianSection />
        </div>
        <footer className="h-7 border-t border-destiny-primary/10 bg-[#0E0E20]/80 flex items-center justify-between px-6">
          <div className="flex items-center gap-3 text-[10px] text-white/25">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500/50 shadow-[0_0_4px_rgba(34,197,94,0.3)]" />
              API Connected
            </span>
          </div>
          <span className="text-[10px] text-white/15">v1.0.0</span>
        </footer>
      </main>
    )
  }

  const section = sectionConfig[activeSection]

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-[#0A0A16]">
      <header className="h-14 border-b border-destiny-primary/10 flex items-center px-6 bg-[#0E0E20]/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="text-destiny-gold/80">
            <SwordIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-white leading-tight">{section.title}</h2>
            <p className="text-[10px] text-destiny-primary-light/40">{section.subtitle}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-5 max-w-xs text-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-xl opacity-20"
                   style={{ backgroundColor: section.accentColor }} />
              <div className="relative text-white/15">
                {section.icon}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white/60 mb-1.5">
                {section.title}
              </h3>
              <p className="text-[13px] text-white/25 leading-relaxed">
                {section.description}
              </p>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full
                            bg-white/[0.02] border border-white/[0.04]">
              <div className="w-1.5 h-1.5 rounded-full bg-destiny-gold/70 animate-glow-pulse" />
              <span className="text-[11px] text-white/25">Coming soon</span>
            </div>
          </div>
        </div>
      </div>

      <footer className="h-7 border-t border-destiny-primary/10 bg-[#0E0E20]/80
                         flex items-center justify-between px-6">
        <div className="flex items-center gap-3 text-[10px] text-white/25">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500/50 shadow-[0_0_4px_rgba(34,197,94,0.3)]" />
            API Ready
          </span>
        </div>
        <span className="text-[10px] text-white/15">v1.0.0</span>
      </footer>
    </main>
  )
}
