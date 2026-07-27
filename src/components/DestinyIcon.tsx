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

export function VaultIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="6" width="16" height="13" rx="2"/>
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 9V12H14.5" strokeLinecap="round"/>
    </svg>
  )
}

export function VendorIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="8" r="4"/>
      <path d="M6 14L8 20H16L18 14"/>
      <path d="M9 14L10 20M15 14L14 20"/>
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
