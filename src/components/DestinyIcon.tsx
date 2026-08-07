import React from 'react'

// Destiny 2 class icons as SVG components
export function DestinyTricorn({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 4L6 20L14 36H34L42 20L24 4Z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M24 14L14 24L18 32H30L34 24L24 14Z" fill="currentColor" opacity="0.4" stroke="currentColor" strokeWidth="1"/>
      <path d="M24 20L20 26H28L24 20Z" fill="currentColor" opacity="0.6"/>
    </svg>
  )
}

export function TitanIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L3 7L5 17H19L21 7L12 2ZM12 7L8 13H16L12 7ZM10 14H14L13 17H11L10 14Z"/>
    </svg>
  )
}

export function HunterIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L4 10L8 20H16L20 10L12 2ZM12 8L16 13H8L12 8ZM9 14H15L14 17H10L9 14Z"/>
    </svg>
  )
}

export function WarlockIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C10 2 8 4 7 7C5.5 8.5 4 10 4 12C4 15 8 18 12 20C16 18 20 15 20 12C20 10 18.5 8.5 17 7C16 4 14 2 12 2ZM12 6L14 10H17L14.5 13L15.5 17L12 14.5L8.5 17L9.5 13L7 10H10L12 6Z"/>
    </svg>
  )
}

export function InventoryIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )
}

export function SettingsIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2V4M12 20V22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M2 12H4M20 12H22M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93"/>
    </svg>
  )
}

export function SwordIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 2L6 6L10 10L14 2H8Z"/>
      <path d="M16 2L18 8L14 14L10 8L12 2H16Z"/>
      <path d="M10 10L7 18L9 22H15L17 18L14 14" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function GhostIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="10" r="6"/>
      <circle cx="10" cy="9" r="1.5" fill="currentColor"/>
      <circle cx="14" cy="9" r="1.5" fill="currentColor"/>
      <path d="M8 18L10 14H14L16 18" strokeLinecap="round"/>
      <path d="M9 22L12 18L15 22" strokeLinecap="round"/>
    </svg>
  )
}

// ---- Weapon Slot Icons ----

export function KineticIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="8"/>
      <circle cx="12" cy="12" r="3"/>
      <line x1="12" y1="4" x2="12" y2="8" strokeLinecap="round"/>
      <line x1="12" y1="16" x2="12" y2="20" strokeLinecap="round"/>
      <line x1="4" y1="12" x2="8" y2="12" strokeLinecap="round"/>
      <line x1="16" y1="12" x2="20" y2="12" strokeLinecap="round"/>
    </svg>
  )
}

export function EnergyIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L4 12L11 13L10 22L20 12L13 11L12 2Z" strokeLinejoin="round"/>
    </svg>
  )
}

export function PowerIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 2L6 10H10L9 16L16 6H12L14 2H8Z" strokeLinejoin="round"/>
      <circle cx="12" cy="18" r="3"/>
      <line x1="12" y1="15" x2="12" y2="21" strokeLinecap="round"/>
    </svg>
  )
}

// ---- Armor Slot Icons ----

export function HelmetIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 17V10C5 6 7 3 12 3C17 3 19 6 19 10V17" strokeLinecap="round"/>
      <rect x="6" y="14" width="12" height="6" rx="1"/>
      <path d="M9 14V12C9 10 10 9 12 9C14 9 15 10 15 12V14" strokeLinecap="round"/>
    </svg>
  )
}

export function GauntletsIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 8L6 16H18L20 8" strokeLinecap="round"/>
      <rect x="2" y="4" width="7" height="5" rx="1"/>
      <rect x="15" y="4" width="7" height="5" rx="1"/>
      <path d="M9 9H15" strokeLinecap="round"/>
    </svg>
  )
}

export function ChestIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 6L8 16H16L18 6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 6V16" strokeLinecap="round"/>
      <path d="M8 10H16" strokeLinecap="round" opacity="0.5"/>
    </svg>
  )
}

export function LegsIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="7" y="3" width="10" height="5" rx="1"/>
      <path d="M9 8L10 16L7 21" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 8L14 16L17 21" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function ClassItemIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3L8 9H16L12 3Z" strokeLinejoin="round"/>
      <path d="M8 9V17C8 19 10 21 12 21C14 21 16 19 16 17V9" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.3"/>
    </svg>
  )
}

// ---- Equipment Icons ----

export function ShipIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 14L7 8L12 6L17 8L21 14L12 16L3 14Z" strokeLinejoin="round"/>
      <path d="M10 12V20H14V12" strokeLinecap="round"/>
      <path d="M7 17L10 17M14 17L17 17" strokeLinecap="round" opacity="0.4"/>
    </svg>
  )
}

export function SparrowIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 14L8 8L12 7L16 8L20 14L12 16L4 14Z" strokeLinejoin="round"/>
      <circle cx="6" cy="15" r="2"/>
      <circle cx="18" cy="15" r="2"/>
      <path d="M12 7V4L14 2H10L12 4V7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ---- New Module Icons ----

export function ActivityIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 17L7 9L11 13L15 5L19 11L21 9" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="7" cy="9" r="1.5" fill="currentColor"/>
      <circle cx="11" cy="13" r="1.5" fill="currentColor"/>
      <circle cx="15" cy="5" r="1.5" fill="currentColor"/>
      <circle cx="19" cy="11" r="1.5" fill="currentColor"/>
    </svg>
  )
}

export function StatsIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="14" width="4" height="7" rx="1"/>
      <rect x="10" y="9" width="4" height="12" rx="1"/>
      <rect x="17" y="4" width="4" height="17" rx="1"/>
    </svg>
  )
}

export function DeathIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3C7 3 4 6.5 4 10.5C4 14 6 16 6 19V21H18V19C18 16 20 14 20 10.5C20 6.5 17 3 12 3Z" strokeLinejoin="round"/>
      <circle cx="9" cy="10" r="1.4" fill="currentColor"/>
      <circle cx="15" cy="10" r="1.4" fill="currentColor"/>
      <path d="M10 14.5C10.8 15.2 13.2 15.2 14 14.5" strokeLinecap="round"/>
    </svg>
  )
}

export function DIMIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" strokeLinejoin="round"/>
      <path d="M4 7.5L12 12L20 7.5" strokeLinejoin="round"/>
      <path d="M12 12V21" strokeLinejoin="round"/>
    </svg>
  )
}

// ---- Lock Icon ----

export function LockIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="11" width="14" height="10" rx="2"/>
      <path d="M8 11V7C8 5 10 3 12 3C14 3 16 5 16 7V11" strokeLinecap="round"/>
    </svg>
  )
}

// ---- Slot Icon Map ----

export const SLOT_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  kinetic: KineticIcon,
  energy: EnergyIcon,
  power: PowerIcon,
  helmet: HelmetIcon,
  gauntlets: GauntletsIcon,
  chest: ChestIcon,
  legs: LegsIcon,
  classItem: ClassItemIcon,
  ghost: GhostIcon,
  ship: ShipIcon,
  sparrow: SparrowIcon,
}
