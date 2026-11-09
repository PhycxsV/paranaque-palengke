import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StatTone = 'primary' | 'gold' | 'bay' | 'lime' | 'danger' | 'neutral'

const TONES: Record<StatTone, { tile: string; glow: string; bar: string }> = {
  primary: { tile: 'bg-primary text-white', glow: 'bg-primary/10', bar: 'bg-primary' },
  gold: { tile: 'bg-gold text-primary-deep', glow: 'bg-gold/20', bar: 'bg-gold' },
  bay: { tile: 'bg-bay text-white', glow: 'bg-bay/15', bar: 'bg-bay' },
  lime: { tile: 'bg-lime text-primary-deep', glow: 'bg-lime/25', bar: 'bg-lime' },
  danger: { tile: 'bg-red-500 text-white', glow: 'bg-red-500/10', bar: 'bg-red-500' },
  neutral: { tile: 'bg-primary-deep text-white', glow: 'bg-primary-deep/10', bar: 'bg-primary-deep' },
}

interface StatCardProps {
  label: string
  value: ReactNode
  icon: LucideIcon
  tone?: StatTone
  hint?: ReactNode
  /** Makes the whole card a link. */
  to?: string
  className?: string
}

/** Compact KPI tile for portal dashboards. */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'primary',
  hint,
  to,
  className,
}: StatCardProps) {
  const t = TONES[tone]
  const body = (
    <>
      <span
        className={cn(
          'pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl transition-opacity group-hover:opacity-100',
          t.glow,
        )}
        aria-hidden
      />
      <span
        className={cn(
          'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm',
          t.tile,
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="relative min-w-0">
        <p className="mb-1.5 truncate text-xs font-semibold text-muted">{label}</p>
        <p className="font-display text-3xl font-extrabold leading-none text-primary-deep">
          {value}
        </p>
        {hint ? <p className="mt-1.5 truncate text-xs text-muted">{hint}</p> : null}
      </div>
    </>
  )

  const shell = cn(
    'group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)] sm:p-5',
    to && 'hover-lift',
    className,
  )

  return to ? (
    <Link to={to} className={shell}>
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  )
}
