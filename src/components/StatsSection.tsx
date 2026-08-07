import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GhostIcon, TitanIcon, HunterIcon, WarlockIcon } from './DestinyIcon'
import { useAuthStore } from '../store/authStore'
import {
  getDestinyMemberships,
  getProfile,
  setAccessToken,
  resolveBungieUrl,
  getAccountStats,
  CLASS_NAMES,
  ACTIVITY_MODE_NAMES,
  type DestinyCharacter,
  type DestinyAccountStats,
  type DestinyHistoricalStatsValue,
} from '../services/bungie'

// Modes to request per-mode breakdown for (5 = All PvP)
const PER_MODE_LIST = [5, 17, 25, 18, 7, 40, 16, 46, 4, 31, 3, 2, 6, 37]

type ModeStats = {
  allTime?: Record<string, DestinyHistoricalStatsValue>
  allTimeScore?: Record<string, DestinyHistoricalStatsValue>
}

const CLASS_ICONS: Record<number, React.ReactNode> = {
  0: <TitanIcon className="w-4 h-4" />,
  1: <HunterIcon className="w-4 h-4" />,
  2: <WarlockIcon className="w-4 h-4" />,
}

const CLASS_ACCENT: Record<number, string> = {
  0: '#C73E3A',
  1: '#3466B1',
  2: '#E8C83C',
}

interface StatCard {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}

function formatTime(seconds: number): string {
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}时${m}分`
}

function kdr(v: number): string {
  return v > 0 ? v.toFixed(2) : '0.00'
}

function pct(v: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((v / total) * 100)}%`
}

export default function StatsSection() {
  const { t } = useTranslation()
  const { membershipId, accessToken } = useAuthStore()
  const [phase, setPhase] = useState<'loading' | 'error' | 'ready'>('loading')
  const [error, setError] = useState('')
  const [characters, setCharacters] = useState<DestinyCharacter[]>([])
  const [stats, setStats] = useState<DestinyAccountStats | null>(null)
  const [modeStats, setModeStats] = useState<Record<string, ModeStats> | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!membershipId || !accessToken) {
      setPhase('error')
      setError(t('guardian.notAuth'))
      return
    }

    let cancelled = false

    async function load() {
      setAccessToken(accessToken)

      try {
        const memberships = await getDestinyMemberships(membershipId!)
        if (!memberships.destinyMemberships?.length) {
          if (!cancelled) { setPhase('error'); setError(t('guardian.noDestiny')) }
          return
        }

        const primary = memberships.destinyMemberships[0]
        const [profile, accountStats, modeStatsData] = await Promise.all([
          getProfile(primary.membershipType, primary.membershipId),
          getAccountStats(primary.membershipType, primary.membershipId),
          getAccountStats(primary.membershipType, primary.membershipId, PER_MODE_LIST),
        ])

        const chars = profile.characters?.data
          ? Object.values(profile.characters.data).sort(
              (a, b) => new Date(b.dateLastPlayed).getTime() - new Date(a.dateLastPlayed).getTime()
            )
          : []

        if (!cancelled) {
          setCharacters(chars)
          setStats(accountStats)
          setModeStats(modeStatsData.mergedAllCharacters.results as unknown as Record<string, ModeStats>)
          setPhase('ready')
        }
      } catch (err: any) {
        if (!cancelled) {
          setPhase('error')
          setError(err?.message || t('guardian.failed'))
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [membershipId, accessToken, retry])

  if (phase === 'loading') {
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

  if (phase === 'error') {
    return (
      <div className="flex-1 p-6">
        <div className="p-5 rounded-xl bg-red-500/5 border border-red-500/15">
          <p className="text-red-400/80 text-sm mb-3">{error}</p>
          <button onClick={() => setRetry(r => r + 1)}
            className="px-4 py-2 rounded-md text-xs font-medium bg-destiny-primary/60 hover:bg-destiny-primary text-white border border-destiny-primary-light/20 transition-all duration-200">
            {t('guardian.retry')}
          </button>
        </div>
      </div>
    )
  }

  // Merge all stat sources — Bungie splits data across allTime / allTimeScore / results
  const mergedStats = {
    ...(stats?.mergedAllCharacters?.results?.allTime || {}),
    ...(stats?.mergedAllCharacters?.merged?.allTime || {}),
    ...(stats?.mergedAllCharacters?.merged?.allTimeScore || {}),
  }

  function gs(id: string, fallbackIds: string[] = []): number {
    const direct = mergedStats[id]?.basic?.value
    if (direct != null) return direct
    for (const fid of fallbackIds) {
      const fv = mergedStats[fid]?.basic?.value
      if (fv != null) return fv
    }
    return 0
  }
  function gsDisplay(id: string): string {
    return mergedStats[id]?.basic?.displayValue || '—'
  }

  const kills = gs('kills', ['totalKillCount'])
  const deaths = gs('deaths', ['totalDeathCount'])
  const assists = gs('assists')
  const timePlayed = gs('secondsPlayed', ['totalActivityDurationSeconds'])
  const activitiesEntered = gs('activitiesEntered')
  const activitiesWon = gs('activitiesWon')
  const precisionKills = gs('precisionKills')
  const orbsDropped = gs('orbsDropped')
  const longestSpree = gs('longestKillSpree')
  const resurrections = gs('resurrectionsPerformed')
  const combatRating = gs('combatRating')
  const avgLifespan = gs('averageLifespan')
  const efficiency = gs('efficiency')
  const bestSingleGameKills = gs('bestSingleGameKills')
  const score = gs('score')
  const winLossRatio = gs('winLossRatio')
  const bestWeapon = gsDisplay('weaponBestType')

  // Per-mode breakdown (mode-keyed results from the `modes` param request)
  const modeCards = Object.entries(modeStats || {})
    .filter(([modeKey]) => modeKey !== 'allTime' && modeKey !== 'allTimeScore')
    .map(([modeKey, pg]) => {
      const all = { ...(pg?.allTimeScore || {}), ...(pg?.allTime || {}) }
      const get = (id: string) => all[id]?.basic?.value ?? 0
      const mKills = get('kills')
      const mDeaths = get('deaths')
      const mTime = get('secondsPlayed')
      const mAct = get('activitiesEntered')
      const mWon = get('activitiesWon')
      const mEff = get('efficiency')
      const name = t(`activities.modes.${modeKey}` as string, {
        defaultValue: ACTIVITY_MODE_NAMES[Number(modeKey)] || `Mode ${modeKey}`,
      })
      return { modeKey, name, mKills, mDeaths, mTime, mAct, mWon, mEff }
    })
    .filter(c => c.mAct > 0 || c.mKills > 0)

  const topCards: StatCard[] = [
    { label: t('stats.kills'), value: kills.toLocaleString(), highlight: true },
    { label: t('stats.deaths'), value: deaths.toLocaleString() },
    { label: t('stats.kd'), value: kdr(deaths > 0 ? kills / deaths : kills), sub: `${assists.toLocaleString()} ${t('stats.assists')}`, highlight: true },
    { label: t('stats.timePlayed'), value: formatTime(timePlayed), sub: `${activitiesEntered} ${t('stats.activities')}` },
    { label: t('stats.winRate'), value: pct(activitiesWon, activitiesEntered), sub: `${activitiesWon} ${t('stats.wins')}` },
    { label: t('stats.winLossRatio'), value: Number(winLossRatio).toFixed(2) },
    { label: t('stats.combatRating'), value: Number(combatRating).toFixed(1) },
    { label: t('stats.efficiency'), value: Number(efficiency).toFixed(2) },
    { label: t('stats.score'), value: score.toLocaleString() },
    { label: t('stats.precisionKills'), value: precisionKills.toLocaleString() },
    { label: t('stats.longestSpree'), value: `${longestSpree}` },
    { label: t('stats.bestSingleGameKills'), value: bestSingleGameKills.toLocaleString() },
    { label: t('stats.orbsGenerated'), value: orbsDropped.toLocaleString() },
    { label: t('stats.revives'), value: resurrections.toLocaleString() },
    { label: t('stats.bestWeapon'), value: bestWeapon },
    { label: t('stats.avgLifespan'), value: formatTime(Math.floor(avgLifespan)) },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      <div>
        <h4 className="text-[11px] text-destiny-primary-light/40 uppercase tracking-widest mb-3">{t('stats.accountOverview')}</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {topCards.map(card => (
            <div key={card.label}
              className={`p-3.5 rounded-xl border transition-all duration-150
                ${card.highlight
                  ? 'bg-destiny-primary/5 border-destiny-primary/15'
                  : 'bg-white/[0.02] border-white/[0.04] hover:border-white/[0.08]'
                }`}>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{card.label}</p>
              <p className={`text-lg font-bold ${card.highlight ? 'text-destiny-primary-light' : 'text-white/80'}`}>{card.value}</p>
              {card.sub && <p className="text-[10px] text-white/25 mt-0.5">{card.sub}</p>}
            </div>
          ))}
        </div>
      </div>

      {modeCards.length > 0 && (
        <div>
          <h4 className="text-[11px] text-destiny-primary-light/40 uppercase tracking-widest mb-3">{t('stats.perMode')}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {modeCards.map(card => (
              <div key={card.modeKey}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-150">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[12px] font-semibold text-white/85">{card.name}</span>
                  <span className="text-[10px] text-white/30">{card.mAct.toLocaleString()} {t('stats.activities')}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <MiniStat label={t('stats.kd')} value={kdr(card.mDeaths > 0 ? card.mKills / card.mDeaths : card.mKills)} />
                  <MiniStat label={t('stats.winRate')} value={pct(card.mWon, card.mAct)} />
                  <MiniStat label={t('stats.efficiency')} value={Number(card.mEff).toFixed(2)} />
                  <MiniStat label={t('stats.kills')} value={card.mKills.toLocaleString()} />
                  <MiniStat label={t('stats.deaths')} value={card.mDeaths.toLocaleString()} />
                  <MiniStat label={t('stats.timePlayed')} value={formatTime(Math.floor(card.mTime))} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats?.characters && stats.characters.length > 0 && (
        <div>
          <h4 className="text-[11px] text-destiny-primary-light/40 uppercase tracking-widest mb-3">{t('stats.perCharacter')}</h4>
          <div className="space-y-3">
            {stats.characters.map(cs => {
              const char = characters.find(c => c.characterId === cs.characterId)
              const charMerged = {
                ...(cs.results?.allTime || {}),
                ...(cs.merged?.allTime || {}),
                ...(cs.merged?.allTimeScore || {}),
              }
              const cgs = (id: string) => charMerged[id]?.basic?.value ?? 0
              const charKills = cgs('kills')
              const charDeaths = cgs('deaths')
              const charTime = cgs('secondsPlayed')
              const charActivities = cgs('activitiesEntered')
              const charWins = cgs('activitiesWon')
              const accent = CLASS_ACCENT[char?.classType ?? 0] || '#7C3AED'
              const emblemUrl = char?.emblemBackgroundPath ? resolveBungieUrl(char.emblemBackgroundPath) : null

              return (
                <div key={cs.characterId}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-150">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-cover bg-center flex-shrink-0"
                      style={emblemUrl ? { backgroundImage: `url(${emblemUrl})` } : { backgroundColor: '#1A1A2E' }} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span style={{ color: accent }}>{CLASS_ICONS[char?.classType ?? 0]}</span>
                        <span className="text-sm font-semibold text-white">{CLASS_NAMES[char?.classType ?? 0] || t('common.unknown')}</span>
                        <span className="text-[10px] text-white/30">{char?.light ? `✦${char.light}` : ''}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    <MiniStat label={t('stats.kills')} value={charKills.toLocaleString()} />
                    <MiniStat label={t('stats.deaths')} value={charDeaths.toLocaleString()} />
                    <MiniStat label={t('stats.kd')} value={kdr(charDeaths > 0 ? charKills / charDeaths : charKills)} />
                    <MiniStat label={t('stats.timePlayed')} value={formatTime(Math.floor(charTime))} />
                    <MiniStat label={t('stats.activities')} value={charActivities.toLocaleString()} />
                    <MiniStat label={t('stats.winRate')} value={pct(charWins, charActivities)} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded-lg bg-[#0A0A16]/60 border border-white/[0.02]">
      <p className="text-[9px] text-white/25 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-white/70 mt-0.5">{value}</p>
    </div>
  )
}
