import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GhostIcon, ActivityIcon, TitanIcon, HunterIcon, WarlockIcon } from './DestinyIcon'
import { useAuthStore } from '../store/authStore'
import {
  getDestinyMemberships,
  getProfile,
  setAccessToken,
  resolveBungieUrl,
  getActivityHistory,
  getManifestActivity,
  ACTIVITY_MODE_NAMES,
  CLASS_NAMES,
  type DestinyMembership,
  type DestinyCharacter,
  type DestinyHistoricalStatsPeriodGroup,
  type DestinyActivityDefinition,
} from '../services/bungie'

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

function statValue(vals: Record<string, any> | undefined, id: string): number | null {
  const entry = vals?.[id]
  if (!entry) return null
  return entry.basic?.value ?? null
}

function formatDuration(seconds: number, tSec: string, tMin: string): string {
  if (seconds < 60) return `${seconds}${tSec}`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? tMin.replace('{{m}}', String(m)).replace('{{s}}', String(s)) : `${m}${tSec}`
}

function formatKdr(v: number | null | undefined): string {
  if (v == null) return '—'
  return v.toFixed(2)
}

function timeAgo(dateStr: string, tMAgo: string, tHAgo: string, tDAgo: string): string {
  const d = new Date(dateStr)
  const now = Date.now()
  const diff = now - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return tMAgo.replace('{{m}}', String(mins))
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return tHAgo.replace('{{h}}', String(hrs))
  const days = Math.floor(hrs / 24)
  return tDAgo.replace('{{d}}', String(days))
}

export default function ActivitiesSection() {
  const { t, i18n } = useTranslation()
  const bungieLocale = i18n.language === 'zh' ? 'zh-chs' : 'en'
  const { membershipId, accessToken } = useAuthStore()
  const [phase, setPhase] = useState<'loading' | 'error' | 'ready'>('loading')
  const [error, setError] = useState('')
  const [membership, setMembership] = useState<DestinyMembership | null>(null)
  const [characters, setCharacters] = useState<DestinyCharacter[]>([])
  const [selectedChar, setSelectedChar] = useState<string>('')
  const [activities, setActivities] = useState<DestinyHistoricalStatsPeriodGroup[]>([])
  const [activityDefs, setActivityDefs] = useState<Record<number, DestinyActivityDefinition | null>>({})
  const [activitiesLoading, setActivitiesLoading] = useState(false)
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
          if (!cancelled) {
            setPhase('error')
            setError(t('guardian.noDestiny'))
          }
          return
        }

        const primary = memberships.destinyMemberships[0]
        const profile = await getProfile(primary.membershipType, primary.membershipId)

        const chars = profile.characters?.data
          ? Object.values(profile.characters.data).sort(
              (a, b) => new Date(b.dateLastPlayed).getTime() - new Date(a.dateLastPlayed).getTime()
            )
          : []

        if (!cancelled) {
          setMembership(primary)
          setCharacters(chars)
          if (chars.length > 0 && !selectedChar) {
            setSelectedChar(chars[0].characterId)
          }
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

  useEffect(() => {
    if (!membership || !selectedChar) return

    let cancelled = false
    const loadActivities = async () => {
      setActivitiesLoading(true)
      try {
        const result = await getActivityHistory(membership.membershipType, membership.membershipId, selectedChar, 50, 0)
        if (cancelled) return
        setActivities(result.activities || [])

        // Fetch activity definitions for names and banners (batched)
        const uniqueRefs = [...new Set((result.activities || []).map(a => a.activityDetails.referenceId))]
        const defs = await Promise.all(uniqueRefs.map(ref => getManifestActivity(ref, bungieLocale)))
        if (cancelled) return
        const defMap: Record<number, DestinyActivityDefinition | null> = {}
        uniqueRefs.forEach((ref, i) => { defMap[ref] = defs[i] })
        setActivityDefs(defMap)
        setActivitiesLoading(false)
      } catch {
        if (!cancelled) {
          setActivities([])
          setActivityDefs({})
          setActivitiesLoading(false)
        }
      }
    }

    loadActivities()
    return () => { cancelled = true }
  }, [membership, selectedChar, bungieLocale])

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
          <button
            onClick={() => setRetry(r => r + 1)}
            className="px-4 py-2 rounded-md text-xs font-medium bg-destiny-primary/60 hover:bg-destiny-primary text-white border border-destiny-primary-light/20 transition-all duration-200"
          >
            {t('guardian.retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 pt-4 pb-2">
        <div className="flex gap-2 flex-wrap">
          {characters.map(char => {
            const isActive = char.characterId === selectedChar
            const accent = CLASS_ACCENT[char.classType] || '#7C3AED'
            const emblemUrl = char.emblemBackgroundPath ? resolveBungieUrl(char.emblemBackgroundPath) : null
            return (
              <button
                key={char.characterId}
                onClick={() => setSelectedChar(char.characterId)}
                className={`relative flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 border
                  ${isActive
                    ? 'bg-white/[0.06] border-white/[0.1] text-white'
                    : 'bg-transparent border-transparent text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                  }`}
                style={isActive ? { borderColor: `${accent}40` } : undefined}
              >
                <div className="w-8 h-8 rounded-md bg-cover bg-center flex-shrink-0"
                  style={emblemUrl ? { backgroundImage: `url(${emblemUrl})` } : { backgroundColor: '#1A1A2E' }} />
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span style={{ color: isActive ? accent : undefined }}>{CLASS_ICONS[char.classType]}</span>
                    <span>{CLASS_NAMES[char.classType]}</span>
                    <span style={{ color: accent }} className="text-[10px] ml-0.5">✦{char.light}</span>
                  </div>
                </div>
                {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full" style={{ backgroundColor: accent }} />}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {activitiesLoading ? (
          <div className="flex items-center justify-center py-16">
            <GhostIcon className="w-8 h-8 text-destiny-primary-light/40 animate-pulse" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-white/25 text-sm">{t('activities.noHistory')}</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {activities.map((act, i) => {
              const vals = act.values
              const kills = statValue(vals, 'kills')
              const deaths = statValue(vals, 'deaths')
              const kd = statValue(vals, 'killsDeathsRatio')
              const kda = statValue(vals, 'killsDeathsAssists')
              const efficiency = statValue(vals, 'efficiency')
              const score = statValue(vals, 'score')
              const duration = statValue(vals, 'activityDurationSeconds')
              const standing = statValue(vals, 'standing')
              const completed = statValue(vals, 'completed')
              const mode = t(`activities.modes.${act.activityDetails.mode}` as string, {
                defaultValue: ACTIVITY_MODE_NAMES[act.activityDetails.mode] || `Mode ${act.activityDetails.mode}`,
              })
              const isWin = standing != null && standing === 0
              const isPvP = [5, 17, 25].includes(act.activityDetails.mode)
              const def = activityDefs[act.activityDetails.referenceId]
              const actName = def?.displayProperties?.name || mode
              const pgcr = def?.pgcrImage ? resolveBungieUrl(def.pgcrImage) : null

              return (
                <div
                  key={act.activityDetails.instanceId || `${act.period}-${i}`}
                  className="flex items-center gap-3.5 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/[0.03] hover:border-white/[0.06] transition-all duration-150"
                >
                  {/* Banner thumbnail */}
                  <div className="w-20 h-11 rounded-md bg-cover bg-center flex-shrink-0"
                    style={pgcr ? { backgroundImage: `url(${pgcr})` } : { backgroundColor: '#1A1A2E' }} />

                  {/* Activity name + chips */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-white/85 truncate">{actName}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0
                        ${isPvP ? 'bg-red-500/10 text-red-400/80' : 'bg-blue-500/10 text-blue-400/80'}`}>
                        {mode}
                      </span>
                      {isPvP ? (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0
                          ${isWin ? 'bg-green-500/10 text-green-400/80' : 'bg-red-500/10 text-red-400/80'}`}>
                          {isWin ? t('activities.win') : t('activities.loss')}
                        </span>
                      ) : completed != null ? (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0
                          ${completed === 1 ? 'bg-green-500/10 text-green-400/80' : 'bg-red-500/10 text-red-400/80'}`}>
                          {completed === 1 ? t('activities.completed') : t('activities.failed')}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {isPvP ? (
                      <>
                        <StatBadge label={t('activities.kd')} value={formatKdr(kd)} />
                        <StatBadge label={t('activities.kda')} value={formatKdr(kda)} />
                        <StatBadge label={t('activities.efficiency')} value={formatKdr(efficiency)} />
                      </>
                    ) : (
                      <>
                        <StatBadge label={t('activities.kills')} value={kills != null ? String(Math.floor(kills)) : '—'} />
                        <StatBadge label={t('activities.deaths')} value={deaths != null ? String(Math.floor(deaths)) : '—'} />
                        {score != null && <StatBadge label={t('activities.score')} value={String(Math.floor(score))} />}
                      </>
                    )}
                  </div>

                  {/* Duration + time */}
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    {duration != null && (
                      <span className="text-[10px] text-white/25">
                        {formatDuration(Math.floor(duration), t('activities.seconds'), t('activities.minutes'))}
                      </span>
                    )}
                    <span className="text-[10px] text-white/20">
                      {timeAgo(act.period, t('activities.mAgo'), t('activities.hAgo'), t('activities.dAgo'))}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-[10px] text-white/25">{label}</span>
      <span className="text-[13px] font-semibold text-white/80">{value}</span>
    </div>
  )
}
