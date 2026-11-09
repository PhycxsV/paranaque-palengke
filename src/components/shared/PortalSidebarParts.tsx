import type { ReactNode } from 'react'
import { BrandMark } from '@/components/shared/BrandLogo'

export function SidebarBackdrop() {
  return (
    <>
      <span
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-lime/10 blur-3xl"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-bay/10 blur-3xl"
        aria-hidden
      />
    </>
  )
}

interface SidebarBrandProps {
  portalLabel: string
  children?: ReactNode
}

export function SidebarBrand({ portalLabel, children }: SidebarBrandProps) {
  return (
    <div className="relative border-b border-white/10 px-5 pb-5 pt-6">
      <BrandMark tone="onDark" subtitle={portalLabel} />
      {children}
    </div>
  )
}
