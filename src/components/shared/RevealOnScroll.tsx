import type { ReactNode } from 'react'
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll'
import { cn } from '@/lib/utils'

export function RevealOnScroll({
  children,
  className,
  delayMs = 0,
}: {
  children: ReactNode
  className?: string
  /** Extra stagger after the section enters view. */
  delayMs?: number
}) {
  const { ref, visible } = useRevealOnScroll<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={cn('reveal-motion', visible && 'is-visible', className)}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  )
}
