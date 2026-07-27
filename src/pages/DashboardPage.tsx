import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { setAccessToken } from '../services/bungie'
import Sidebar from '../components/Sidebar'
import ContentArea from '../components/ContentArea'

export type NavSection = 'guardian' | 'inventory' | 'vault' | 'vendors' | 'settings'

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState<NavSection>('guardian')
  const { displayName, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    const token = useAuthStore.getState().accessToken
    if (token) setAccessToken(token)
  }, [])

  const handleLogout = async () => {
    await window.electronAPI.clearAuthTokens()
    setAccessToken(null)
    clearAuth()
    navigate('/', { replace: true })
  }

  return (
    <div className="h-full flex bg-destiny-bg">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        displayName={displayName || 'Guardian'}
        onLogout={handleLogout}
      />
      <ContentArea activeSection={activeSection} />
    </div>
  )
}
