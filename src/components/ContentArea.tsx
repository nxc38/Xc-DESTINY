import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import { TitanIcon, HunterIcon, WarlockIcon, InventoryIcon, SettingsIcon, SwordIcon, GhostIcon, ActivityIcon, StatsIcon, DeathIcon } from './DestinyIcon'
import { useAuthStore } from '../store/authStore'
import {
  getDestinyMemberships,
  getProfile,
  resolveBungieUrl,
  setAccessToken,
  getAccessToken,
  CLASS_NAMES,
  type DestinyMembership,
  type DestinyCharacter,
} from '../services/bungie'
import type { NavSection } from '../pages/DashboardPage'
import ActivitiesSection from './ActivitiesSection'
import StatsSection from './StatsSection'
import DeathwatchSection from './DeathwatchSection'

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


function GuardianSection() {
  const { t } = useTranslation()
  const { membershipId, accessToken } = useAuthStore()
  const [data, setData] = useState<CharacterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!membershipId || !accessToken) {
      setLoading(false)
      setError(t('guardian.notAuth'))
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
            setError(t('guardian.noDestiny'))
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
          const msg = err?.message || t('guardian.failed')
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
          <p className="text-destiny-primary-light/50 text-sm tracking-wider">{t('guardian.loading')}</p>
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
          {t('guardian.retry')}
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
              {data?.membership.bungieGlobalDisplayName || t('sidebar.guardian')}
              <span className="text-destiny-primary-light/40 font-normal">
                #{data?.membership.bungieGlobalDisplayNameCode}
              </span>
            </h3>
            <p className="text-xs text-destiny-primary-light/50 mt-0.5">
              {data?.characters.length || 0} {t('guardian.characters')} ·{' '}
              {data?.membership.displayName}
            </p>
          </div>
        </div>
      </div>

      {/* Character cards */}
      {data && data.characters.length > 0 && (
        <div>
          <h4 className="text-[11px] text-destiny-primary-light/40 uppercase tracking-widest mb-3">
            {t('guardian.characters')}
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
          <p className="text-white/30 text-sm">{t('guardian.noCharacters')}</p>
        </div>
      )}
    </div>
  )
}

const RACE_HASHES: Record<number, string> = {
  3884724749: 'raceHuman',
  2809578934: 'raceAwoken',
  898834093: 'raceExo',
}

const GENDER_HASHES: Record<number, string> = {
  2204441813: 'male',
  3111576190: 'female',
}

function CharacterCard({ character }: { character: DestinyCharacter }) {
  const { t } = useTranslation()
  const classType = character.classType
  const accentColor = CLASS_ACCENT_COLORS[classType] || '#7C3AED'
  const className = CLASS_NAMES[classType] || 'Unknown'
  const emblemUrl = character.emblemBackgroundPath
    ? resolveBungieUrl(character.emblemBackgroundPath)
    : null
  const lastPlayed = new Date(character.dateLastPlayed)
  const daysAgo = Math.floor((Date.now() - lastPlayed.getTime()) / (1000 * 60 * 60 * 24))
  const hoursPlayed = Math.floor(Number(character.minutesPlayedTotal) / 60)
  const raceKey = RACE_HASHES[character.raceHash]
  const genderKey = GENDER_HASHES[character.genderHash]
  const raceGender = raceKey || genderKey
    ? [raceKey && t(`guardian.${raceKey}`), genderKey && t(`guardian.${genderKey}`)]
        .filter(Boolean)
        .join(' · ')
    : ''

  return (
    <div
      className="flex overflow-hidden border h-28 transition-all duration-200"
      style={{ borderColor: `${accentColor}35` }}
    >
      {/* Info block — solid dark background */}
      <div className="w-1/4 min-w-[270px] flex items-center gap-4 px-5 flex-shrink-0 bg-[#0E0E20]">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: `${accentColor}22`,
            border: `1px solid ${accentColor}45`,
            color: accentColor,
          }}
        >
          {CLASS_ICONS[classType]}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2.5 whitespace-nowrap">
            <h4 className="text-base font-bold text-white truncate">{className}</h4>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
              style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
            >
              ✦ {character.light} {t('guardian.power')}
            </span>
          </div>
          {raceGender && (
            <p className="text-[12px] text-white/60 mt-1">{raceGender}</p>
          )}
          <p className="text-[11px] text-white/40 mt-0.5">
            {daysAgo === 0 ? t('guardian.today') : daysAgo === 1 ? t('guardian.yesterday') : t('guardian.daysAgo', { days: daysAgo })}
            {' · '}
            {t('guardian.hoursPlayed', { hours: hoursPlayed })}
          </p>
        </div>
      </div>

      {/* Emblem art — full long-strip emblem flush against the right edge */}
      <div className="flex-1 relative bg-[#0E0E20]">
        {emblemUrl ? (
          <div
            className="absolute inset-0 bg-no-repeat"
            style={{
              backgroundImage: `url(${emblemUrl})`,
              backgroundSize: 'contain',
              backgroundPosition: 'right center',
            }}
          />
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: '#1A1A2E' }} />
        )}
      </div>
    </div>
  )
}

interface TokenInfo {
  accessToken: string
  refreshToken: string
  membershipId: string
  displayName: string
  expiresAt: number
}

function SettingsSection() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { displayName, membershipId, clearAuth } = useAuthStore()
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [clearMsg, setClearMsg] = useState('')
  const [expiryText, setExpiryText] = useState('')

  useEffect(() => {
    window.electronAPI.getAuthTokens().then(setTokenInfo)
  }, [])

  useEffect(() => {
    if (!tokenInfo) return
    const update = () => {
      const remaining = tokenInfo.expiresAt - Date.now()
      if (remaining <= 0) {
        setExpiryText(t('settings.expired'))
      } else if (remaining < 60000) {
        setExpiryText(t('settings.expiresInSeconds', { sec: Math.floor(remaining / 1000) }))
      } else {
        setExpiryText(t('settings.expiresIn', { time: `${Math.floor(remaining / 60000)}m` }))
      }
    }
    update()
    const interval = setInterval(update, 10000)
    return () => clearInterval(interval)
  }, [tokenInfo])

  const handleClearData = async () => {
    setClearMsg('')
    try {
      await window.electronAPI.clearAuthTokens()
      setAccessToken(null)
      clearAuth()
      setTokenInfo(null)
      setClearMsg(t('settings.cleared'))
      setTimeout(() => navigate('/', { replace: true }), 800)
    } catch {
      setClearMsg(t('settings.clearFailed'))
      setTimeout(() => setClearMsg(''), 3000)
    }
  }

  const handleSignOut = async () => {
    await window.electronAPI.clearAuthTokens()
    setAccessToken(null)
    clearAuth()
    navigate('/', { replace: true })
  }

  const isTokenValid = tokenInfo && Date.now() < tokenInfo.expiresAt - 60000
  const tokenExpiryDate = tokenInfo ? new Date(tokenInfo.expiresAt) : null

  return (
    <div className="p-6 space-y-5">
      {/* Account card */}
      <div className="rounded-xl bg-destiny-surface/60 border border-destiny-primary/10 overflow-hidden">
        <div className="px-5 py-3 border-b border-destiny-primary/8 flex items-center gap-2.5">
          <SettingsIcon className="w-4 h-4 text-destiny-primary-light/60" />
          <h3 className="text-[13px] font-semibold text-white tracking-wide">{t('settings.account')}</h3>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destiny-primary/15 border border-destiny-primary/20 flex items-center justify-center">
              <GhostIcon className="w-5 h-5 text-destiny-primary-light" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{displayName || t('sidebar.guardian')}</p>
              <p className="text-[11px] text-destiny-primary-light/40">
                {t('settings.membershipId')}: {membershipId || '—'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-[#0A0A16]/60 border border-white/[0.04]">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{t('settings.accessToken')}</p>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isTokenValid ? 'bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.4)]' : 'bg-red-400 shadow-[0_0_4px_rgba(248,113,113,0.4)]'}`} />
                <span className="text-xs text-white/60">{isTokenValid ? t('settings.active') : t('settings.expired')}</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#0A0A16]/60 border border-white/[0.04]">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{t('settings.expiry')}</p>
              <p className="text-xs text-white/60">
                {tokenExpiryDate
                  ? tokenExpiryDate.toLocaleTimeString()
                  : '—'}
              </p>
              <p className="text-[10px] text-white/25">{expiryText}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Session card */}
      <div className="rounded-xl bg-destiny-surface/60 border border-destiny-primary/10 overflow-hidden">
        <div className="px-5 py-3 border-b border-destiny-primary/8 flex items-center gap-2.5">
          <SwordIcon className="w-4 h-4 text-destiny-primary-light/60" />
          <h3 className="text-[13px] font-semibold text-white tracking-wide">{t('settings.session')}</h3>
        </div>
        <div className="p-5 space-y-3">
          <div className="space-y-2">
            {[
              { label: t('settings.displayName'), value: displayName || '—' },
              { label: t('settings.membershipId'), value: membershipId || '—' },
              { label: t('settings.refreshToken'), value: tokenInfo?.refreshToken ? t('settings.available') : t('settings.none') },
              { label: t('settings.apiEndpoint'), value: 'www.bungie.net/Platform' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-white/[0.03] last:border-0">
                <span className="text-[12px] text-white/40">{label}</span>
                <span className="text-[12px] text-white/70 font-mono text-right max-w-[55%] truncate">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-xl bg-destiny-surface/60 border border-destiny-primary/10 overflow-hidden">
        <div className="px-5 py-3 border-b border-destiny-primary/8 flex items-center gap-2.5">
          <SwordIcon className="w-4 h-4 text-destiny-primary-light/60" />
          <h3 className="text-[13px] font-semibold text-white tracking-wide">{t('settings.actions')}</h3>
        </div>
        <div className="p-5 space-y-3">
          <button
            onClick={handleClearData}
            className="w-full text-left px-4 py-3 rounded-lg bg-[#0A0A16]/60 border border-white/[0.04]
                       hover:border-yellow-500/20 transition-all duration-200 group"
          >
            <p className="text-[13px] text-white/80 group-hover:text-white">{t('settings.clearLoginData')}</p>
            <p className="text-[11px] text-white/30 mt-0.5">{t('settings.clearLoginDataDesc')}</p>
          </button>
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-3 rounded-lg bg-[#0A0A16]/60 border border-white/[0.04]
                       hover:border-red-500/20 transition-all duration-200 group"
          >
            <p className="text-[13px] text-white/80 group-hover:text-red-400">{t('settings.signOut')}</p>
            <p className="text-[11px] text-white/30 mt-0.5">{t('settings.signOutDesc')}</p>
          </button>
          {clearMsg && (
            <p className="text-center text-[11px] text-destiny-primary-light/50">{clearMsg}</p>
          )}
        </div>
      </div>

      {/* Language */}
      <div className="rounded-xl bg-destiny-surface/60 border border-destiny-primary/10 overflow-hidden">
        <div className="px-5 py-3 border-b border-destiny-primary/8 flex items-center gap-2.5">
          <SettingsIcon className="w-4 h-4 text-destiny-primary-light/60" />
          <h3 className="text-[13px] font-semibold text-white tracking-wide">{t('settings.language')}</h3>
        </div>
        <div className="p-5">
          <div className="flex gap-2">
            <button
              onClick={() => { i18n.changeLanguage('en'); localStorage.setItem('lang', 'en') }}
              className={`flex-1 px-4 py-2.5 rounded-lg text-[12px] font-medium transition-all duration-200 border
                ${i18n.language === 'en'
                  ? 'bg-destiny-primary/20 border-destiny-primary-light/30 text-white shadow-[0_0_12px_-3px_rgba(124,58,237,0.3)]'
                  : 'bg-[#0A0A16]/60 border-white/[0.04] text-white/50 hover:text-white/80 hover:border-white/[0.08]'
                }`}
            >
              {t('settings.english')}
            </button>
            <button
              onClick={() => { i18n.changeLanguage('zh'); localStorage.setItem('lang', 'zh') }}
              className={`flex-1 px-4 py-2.5 rounded-lg text-[12px] font-medium transition-all duration-200 border
                ${i18n.language === 'zh'
                  ? 'bg-destiny-primary/20 border-destiny-primary-light/30 text-white shadow-[0_0_12px_-3px_rgba(124,58,237,0.3)]'
                  : 'bg-[#0A0A16]/60 border-white/[0.04] text-white/50 hover:text-white/80 hover:border-white/[0.08]'
                }`}
            >
              {t('settings.chinese')}
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="rounded-xl bg-destiny-surface/60 border border-destiny-primary/10 overflow-hidden">
        <div className="px-5 py-3 border-b border-destiny-primary/8 flex items-center gap-2.5">
          <SettingsIcon className="w-4 h-4 text-destiny-primary-light/60" />
          <h3 className="text-[13px] font-semibold text-white tracking-wide">{t('settings.about')}</h3>
        </div>
        <div className="p-5 space-y-2">
          {[
            { label: t('settings.version'), value: '1.0.0' },
            { label: t('settings.electron'), value: '43.2.0' },
            { label: t('settings.react'), value: '19.2.8' },
            { label: t('settings.bungieApi'), value: 'v2' },
          ].map(({ label, value }) => (
            <div key={value} className="flex items-center justify-between py-1.5 border-b border-white/[0.03] last:border-0">
              <span className="text-[12px] text-white/40">{label}</span>
              <span className="text-[12px] text-white/50">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ContentHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <header className="h-14 border-b border-destiny-primary/10 flex items-center px-6 bg-[#0E0E20]/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <h2 className="text-[15px] font-semibold text-white leading-tight">{title}</h2>
          <p className="text-[10px] text-destiny-primary-light/40">{subtitle}</p>
        </div>
      </div>
    </header>
  )
}

function ContentFooter({ status }: { status: string }) {
  return (
    <footer className="h-7 border-t border-destiny-primary/10 bg-[#0E0E20]/80 flex items-center justify-between px-6">
      <div className="flex items-center gap-3 text-[10px] text-white/25">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500/50 shadow-[0_0_4px_rgba(34,197,94,0.3)]" />
          {status}
        </span>
      </div>
      <span className="text-[10px] text-white/15">v1.0.0</span>
    </footer>
  )
}

export default function ContentArea({ activeSection }: ContentAreaProps) {
  const { t } = useTranslation()
  const [dimVisited, setDimVisited] = useState(false)

  // Mount the DIM webview on first visit, then keep it alive (hidden) so its state survives tab switches
  useEffect(() => {
    if (activeSection === 'dim') setDimVisited(true)
  }, [activeSection])

  const showDim = dimVisited || activeSection === 'dim'

  const renderSection = (): React.ReactNode => {
    if (activeSection === 'guardian') {
      return (
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0A0A16]">
          <ContentHeader
            icon={<div className="text-destiny-gold/80"><SwordIcon className="w-4 h-4" /></div>}
            title={t('guardian.title')}
            subtitle={t('guardian.subtitle')}
          />
          <div className="flex-1 overflow-y-auto">
            <GuardianSection />
          </div>
          <ContentFooter status={t('common.apiConnected')} />
        </main>
      )
    }

    if (activeSection === 'settings') {
      return (
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0A0A16]">
          <ContentHeader
            icon={<div className="text-destiny-primary-light/80"><SettingsIcon className="w-4 h-4" /></div>}
            title={t('settings.title')}
            subtitle={t('settings.subtitle')}
          />
          <div className="flex-1 overflow-y-auto">
            <SettingsSection />
          </div>
          <ContentFooter status={t('common.apiReady')} />
        </main>
      )
    }

    if (activeSection === 'activities') {
      return (
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0A0A16]">
          <ContentHeader
            icon={<div className="text-destiny-gold/80"><ActivityIcon className="w-4 h-4" /></div>}
            title={t('activities.title')}
            subtitle={t('activities.subtitle')}
          />
          <ActivitiesSection />
          <ContentFooter status={t('common.apiConnected')} />
        </main>
      )
    }

    if (activeSection === 'stats') {
      return (
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0A0A16]">
          <ContentHeader
            icon={<div className="text-destiny-gold/80"><StatsIcon className="w-4 h-4" /></div>}
            title={t('stats.title')}
            subtitle={t('stats.subtitle')}
          />
          <StatsSection />
          <ContentFooter status={t('common.apiConnected')} />
        </main>
      )
    }

    if (activeSection === 'deathwatch') {
      return (
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0A0A16]">
          <ContentHeader
            icon={<div className="text-red-400/80"><DeathIcon className="w-4 h-4" /></div>}
            title={t('deathwatch.title')}
            subtitle={t('deathwatch.subtitle')}
          />
          <div className="flex-1 overflow-y-auto">
            <DeathwatchSection />
          </div>
          <ContentFooter status={t('common.apiConnected')} />
        </main>
      )
    }

    const sectionIcons: Record<string, React.ReactNode> = {
    }
    const sectionColors: Record<string, string> = {
    }
    const section = {
      title: t(`${activeSection as string}.title`),
      subtitle: t(`${activeSection as string}.subtitle`),
      description: t(`${activeSection as string}.description`),
      icon: <InventoryIcon className="w-12 h-12" />,
      accentColor: '#7C3AED',
    }

    return (
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0A0A16]">
        <ContentHeader
          icon={<div className="text-destiny-gold/80"><SwordIcon className="w-4 h-4" /></div>}
          title={section.title}
          subtitle={section.subtitle}
        />

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
                <span className="text-[11px] text-white/25">{t('common.comingSoon')}</span>
              </div>
            </div>
          </div>
        </div>

        <ContentFooter status={t('common.apiReady')} />
      </main>
    )
  }

  if (showDim) {
    return (
      <div className="flex-1 flex min-w-0 min-h-0">
        {activeSection !== 'dim' && renderSection()}
        <div className={`flex-1 min-w-0 min-h-0 ${activeSection === 'dim' ? 'flex' : 'hidden'}`}>
          <webview
            src="https://app.destinyitemmanager.com"
            partition="persist:dim"
            className="w-full h-full"
          />
        </div>
      </div>
    )
  }

  return renderSection()
}
