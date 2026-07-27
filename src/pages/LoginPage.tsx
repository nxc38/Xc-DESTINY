import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { setAccessToken, getAccessToken } from '../services/bungie'
import { DestinyTricorn, GhostIcon } from '../components/DestinyIcon'

const LOGIN_TIMEOUT_MS = 90_000 // reset button if no callback after 90s

function FloatingParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Large blurred orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-destiny-primary/6 blur-[120px] animate-pulse-slow" />
      <div className="absolute top-[50%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-destiny-gold/4 blur-[100px] animate-pulse-slower" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-[-15%] left-[30%] w-[45vw] h-[45vw] rounded-full bg-destiny-primary/4 blur-[130px] animate-pulse-slow" style={{ animationDelay: '2s' }} />

      {/* Orbit rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-[420px] h-[420px] rounded-full border border-destiny-primary/10
                      animate-orbit-slow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-[340px] h-[340px] rounded-full border border-destiny-primary-light/8
                      animate-orbit-mid" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-[260px] h-[260px] rounded-full border border-destiny-gold/6
                      animate-orbit-fast" />

      {/* Glowing dots on orbit rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-[420px] h-[420px] rounded-full animate-orbit-slow">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-2 h-2 rounded-full bg-destiny-primary-light/60 shadow-[0_0_8px_#A78BFA]" />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-[340px] h-[340px] rounded-full animate-orbit-mid">
        <div className="absolute bottom-[18%] right-[18%]
                        w-1.5 h-1.5 rounded-full bg-destiny-gold/50 shadow-[0_0_6px_#F59E0B]" />
      </div>

      {/* Twinkling stars */}
      {[
        [8, 12], [18, 5], [85, 8], [92, 15], [75, 88],
        [12, 82], [22, 25], [88, 42], [6, 55], [80, 65],
        [45, 92], [55, 8], [35, 15], [65, 85], [28, 72],
      ].map(([x, y], i) => (
        <div
          key={i}
          className="absolute w-[2px] h-[2px] rounded-full bg-white/30 animate-star-twinkle"
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.3}s` }}
        />
      ))}
    </div>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, setAuth } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [error, setError] = useState('')
  const [fadeIn, setFadeIn] = useState(false)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualUrl, setManualUrl] = useState('')
  const [manualSubmitting, setManualSubmitting] = useState(false)
  const [clearMsg, setClearMsg] = useState('')
  const loginTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
      return
    }
    window.electronAPI.getAuthTokens().then((tokens) => {
      if (tokens) {
        setAccessToken(tokens.accessToken)
        setAuth({
          membershipId: tokens.membershipId,
          displayName: tokens.displayName,
          accessToken: tokens.accessToken,
        })
        navigate('/dashboard', { replace: true })
      }
      setIsChecking(false)
      requestAnimationFrame(() => setFadeIn(true))
    })
  }, [])

  useEffect(() => {
    const unsubscribe = window.electronAPI.onAuthSuccess(() => {
      if (loginTimerRef.current) {
        clearTimeout(loginTimerRef.current)
        loginTimerRef.current = null
      }
      window.electronAPI.getAuthTokens().then((tokens) => {
        if (tokens) {
          setAccessToken(tokens.accessToken)
          setAuth({
            membershipId: tokens.membershipId,
            displayName: tokens.displayName,
            accessToken: tokens.accessToken,
          })
          navigate('/dashboard', { replace: true })
        }
      })
      setIsLoggingIn(false)
      setManualSubmitting(false)
      setManualUrl('')
    })
    return () => {
      unsubscribe()
      if (loginTimerRef.current) {
        clearTimeout(loginTimerRef.current)
      }
    }
  }, [])

  const handleLogin = async () => {
    setIsLoggingIn(true)
    setError('')
    // Reset button if browser is closed before completing OAuth
    loginTimerRef.current = setTimeout(() => {
      setIsLoggingIn(false)
      loginTimerRef.current = null
    }, LOGIN_TIMEOUT_MS)
    try {
      await window.electronAPI.openBungieAuth()
    } catch {
      setError('Failed to open login page. Please try again.')
      setIsLoggingIn(false)
      if (loginTimerRef.current) {
        clearTimeout(loginTimerRef.current)
        loginTimerRef.current = null
      }
    }
  }

  const handleClearData = async () => {
    setClearMsg('')
    try {
      await window.electronAPI.clearAuthTokens()
      setAccessToken(null)
      useAuthStore.getState().clearAuth()
      setClearMsg('Login data cleared.')
      setTimeout(() => setClearMsg(''), 3000)
    } catch {
      setClearMsg('Failed to clear data.')
      setTimeout(() => setClearMsg(''), 3000)
    }
  }

  const handleManualSubmit = async () => {
    const trimmed = manualUrl.trim()
    if (!trimmed) {
      setError('Please paste the OAuth callback URL from your browser.')
      return
    }
    if (!trimmed.startsWith('neavendestiny://')) {
      setError('Invalid URL. Must start with neavendestiny://')
      return
    }
    setManualSubmitting(true)
    setError('')
    try {
      await window.electronAPI.processOAuthUrl(trimmed)
      // onAuthSuccess handler will navigate to dashboard
    } catch (err: any) {
      setError(err?.message || 'Failed to process OAuth URL. Please try again.')
      setManualSubmitting(false)
    }
  }

  if (isChecking) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0A0A16]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-destiny-primary/20 blur-xl animate-pulse" />
            <GhostIcon className="relative w-12 h-12 text-destiny-primary-light animate-pulse" />
          </div>
          <p className="text-destiny-primary-light/60 text-sm tracking-widest uppercase">
            Initializing
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex items-center justify-center bg-[#0A0A16] relative overflow-hidden">
      <FloatingParticles />

      {/* Main card — centered, symmetrical */}
      <div className={`relative z-10 w-full max-w-[420px] mx-6
                      transition-all duration-1000 ease-out
                      ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

        {/* Card glow effect */}
        <div className="absolute inset-[-2px] rounded-2xl bg-gradient-to-b from-destiny-primary/30 via-destiny-primary/10 to-transparent blur-sm" />

        {/* Card */}
        <div className="relative bg-[#12122A]/90 backdrop-blur-xl rounded-2xl
                        border border-destiny-primary/15
                        shadow-[0_0_80px_-15px_rgba(124,58,237,0.15)]">

          {/* Inner top highlight bar */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px
                          bg-gradient-to-r from-transparent via-destiny-primary-light/30 to-transparent" />

          <div className="px-10 py-12">
            {/* === Logo Section === */}
            <div className="flex flex-col items-center">
              {/* Tricorn with glow ring */}
              <div className="relative mb-8">
                <div className="absolute inset-0 rounded-full bg-destiny-gold/20 blur-2xl animate-glow-pulse" />
                <div className="relative text-destiny-gold
                                drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                  <DestinyTricorn className="w-[72px] h-[72px]" />
                </div>
              </div>

              {/* App name */}
              <div className="text-center mb-3">
                <h1 className="text-[32px] font-bold tracking-[0.15em] text-white leading-tight">
                  Neaven<span className="text-destiny-primary-light">-DESTINY</span>
                </h1>
              </div>

              {/* Decorative divider */}
              <div className="flex items-center gap-3 w-full mb-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-destiny-primary/30 to-transparent" />
                <div className="w-1 h-1 rounded-full bg-destiny-gold/60 shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-destiny-primary/30 to-transparent" />
              </div>

              {/* Subtitle */}
              <p className="text-destiny-primary-light/50 text-[13px] tracking-[0.2em] uppercase mb-8">
                Destiny 2 Companion
              </p>
            </div>

            {/* === Login Button === */}
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="relative w-full group
                         disabled:opacity-60 disabled:cursor-wait"
            >
              {/* Button glow */}
              <div className="absolute inset-[-1px] rounded-lg bg-gradient-to-r
                              from-destiny-primary via-destiny-primary-dark to-destiny-primary
                              opacity-60 blur-[2px] group-hover:opacity-100
                              transition-opacity duration-300" />
              {/* Button body */}
              <div className="relative flex items-center justify-center gap-3
                              py-3.5 px-6 rounded-lg
                              bg-destiny-primary group-hover:bg-destiny-primary/90
                              border border-destiny-primary-light/20
                              text-white font-semibold text-[15px] tracking-wide
                              transition-all duration-200 ease-out
                              shadow-[0_4px_24px_-4px_rgba(124,58,237,0.4)]
                              group-hover:shadow-[0_6px_32px_-4px_rgba(124,58,237,0.6)]">
                {isLoggingIn ? (
                  <>
                    <GhostIcon className="w-5 h-5 animate-spin" />
                    <span>Opening Bungie.net...</span>
                  </>
                ) : (
                  <>
                    <DestinyTricorn className="w-[18px] h-[18px]" />
                    <span>Login with Bungie.net</span>
                  </>
                )}
              </div>
            </button>

            {error && (
              <p className="mt-4 text-red-400/90 text-[13px] text-center">{error}</p>
            )}

            {/* Manual URL paste — permanent fallback */}
            <div className="mt-5 pt-4 border-t border-destiny-primary/10">
              <button
                onClick={() => setShowManualEntry(!showManualEntry)}
                className="text-destiny-primary-light/40 text-[12px] tracking-wider
                           hover:text-destiny-primary-light/70 transition-colors
                           w-full text-center"
              >
                {showManualEntry ? 'Hide manual entry' : 'Trouble logging in? Manual entry'}
              </button>
              {showManualEntry && (
                <div className="mt-3 space-y-2">
                  <p className="text-destiny-primary-light/30 text-[11px] leading-relaxed">
                    If the browser redirect doesn't open the app, copy the full URL<br />
                    (<code className="text-destiny-primary-light/50 text-[10px]">neavendestiny://oauth/callback?code=...</code>)
                    from your browser's address bar and paste it below.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualUrl}
                      onChange={(e) => setManualUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                      placeholder="neavendestiny://oauth/callback?code=..."
                      disabled={manualSubmitting}
                      className="flex-1 bg-[#0A0A16] border border-destiny-primary/20 rounded-md
                                 px-3 py-2 text-white text-[12px]
                                 placeholder:text-destiny-primary-light/20
                                 focus:outline-none focus:border-destiny-primary-light/50
                                 disabled:opacity-40"
                    />
                    <button
                      onClick={handleManualSubmit}
                      disabled={manualSubmitting || !manualUrl.trim()}
                      className="px-4 py-2 rounded-md text-[12px] font-medium
                                 bg-destiny-primary/80 hover:bg-destiny-primary
                                 text-white border border-destiny-primary-light/20
                                 disabled:opacity-30 disabled:cursor-not-allowed
                                 transition-all duration-200"
                    >
                      {manualSubmitting ? '...' : 'Submit'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Clear login data */}
            <div className="mt-5 pt-3 border-t border-destiny-primary/10 text-center">
              <button
                onClick={handleClearData}
                className="text-destiny-primary-light/25 text-[11px] tracking-wider
                           hover:text-red-400/60 transition-colors duration-200"
              >
                Clear login data
              </button>
              {clearMsg && (
                <p className="mt-1 text-destiny-primary-light/40 text-[10px]">{clearMsg}</p>
              )}
            </div>

            {/* Footer hint */}
            <p className="mt-6 text-destiny-primary-light/30 text-[12px] text-center leading-relaxed">
              You will be redirected to Bungie.net<br />to authorize this application
            </p>
          </div>
        </div>

        {/* Version below card */}
        <p className="text-center text-destiny-primary-light/20 text-[11px] mt-5 tracking-wider">
          v1.0.0
        </p>
      </div>
    </div>
  )
}
