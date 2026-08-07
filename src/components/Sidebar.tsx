import { useTranslation } from 'react-i18next'
import { DestinyTricorn, InventoryIcon, SettingsIcon, GhostIcon, ActivityIcon, StatsIcon, DIMIcon, DeathIcon } from './DestinyIcon'
import type { NavSection } from '../pages/DashboardPage'

interface SidebarProps {
  activeSection: NavSection
  onSelectSection: (section: NavSection) => void
  displayName: string
  onLogout: () => void
}

interface NavItem {
  id: NavSection
  label: string
  icon: React.ReactNode
}

export default function Sidebar({ activeSection, onSelectSection, displayName, onLogout }: SidebarProps) {
  const { t } = useTranslation()

  const navItems: NavItem[] = [
    { id: 'guardian', label: t('sidebar.guardian'), icon: <InventoryIcon className="w-[18px] h-[18px]" /> },
    { id: 'activities', label: t('sidebar.activities'), icon: <ActivityIcon className="w-[18px] h-[18px]" /> },
    { id: 'stats', label: t('sidebar.stats'), icon: <StatsIcon className="w-[18px] h-[18px]" /> },
    { id: 'dim', label: t('sidebar.dim'), icon: <DIMIcon className="w-[18px] h-[18px]" /> },
    { id: 'deathwatch', label: t('sidebar.deathwatch'), icon: <DeathIcon className="w-[18px] h-[18px]" /> },
    { id: 'settings', label: t('sidebar.settings'), icon: <SettingsIcon className="w-[18px] h-[18px]" /> },
  ]

  return (
    <aside className="w-60 h-full bg-[#0E0E20] border-r border-destiny-primary/10 flex flex-col select-none">
      {/* App brand */}
      <div className="px-5 py-4 border-b border-destiny-primary/10">
        <div className="flex items-center gap-2.5">
          <div className="text-destiny-gold">
            <DestinyTricorn className="w-6 h-6" />
          </div>
          <span className="text-[13px] font-bold text-white tracking-wider">
            Neaven<span className="text-destiny-primary-light">-DESTINY</span>
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
        {navItems.map((item, i) => {
          const isActive = activeSection === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium
                         transition-all duration-200 ease-out
                         ${isActive
                           ? 'bg-destiny-primary/15 text-white border border-destiny-primary/25 shadow-[inset_0_1px_0_rgba(167,139,250,0.1)]'
                           : 'text-white/45 hover:text-white/85 hover:bg-white/[0.04] border border-transparent'
                         }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className={isActive ? 'text-destiny-primary-light' : 'text-white/30'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1 h-1 rounded-full bg-destiny-primary-light shadow-[0_0_6px_rgba(167,139,250,0.6)]" />
              )}
            </button>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-destiny-primary/10 mx-3" />
      <div className="px-3 py-3">
        <div className="flex items-center gap-2.5 px-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-destiny-primary/20 border border-destiny-primary/20
                          flex items-center justify-center">
            <GhostIcon className="w-3.5 h-3.5 text-destiny-primary-light" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-white/90 truncate leading-tight">{displayName}</p>
            <p className="text-[10px] text-destiny-primary-light/40">{t('sidebar.guardian')}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full text-[11px] text-white/25 hover:text-red-400/80
                     transition-colors duration-200 py-1.5 rounded-md hover:bg-red-400/5"
        >
          {t('sidebar.signOut')}
        </button>
      </div>
    </aside>
  )
}
