import { cn } from '@/lib/utils'

/** Shared dark-green sidebar surface used by the vendor and LGU admin portals. */
export const SIDEBAR_SURFACE =
  'relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-primary-deep via-primary-deep to-[#0d2a1c] text-white'

export function sidebarLinkClass(isActive: boolean) {
  return cn(
    'relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200',
    isActive
      ? 'bg-white/12 text-white shadow-inner before:absolute before:-left-3 before:bottom-2 before:top-2 before:w-1 before:rounded-full before:bg-lime'
      : 'text-white/70 hover:bg-white/8 hover:text-white',
  )
}
