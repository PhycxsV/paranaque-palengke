import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PortalHeaderProps {
  title: string
  description?: ReactNode
  eyebrow?: string
  back?: { to: string; label: string }
  /** Buttons / badges aligned to the right on wide screens. */
  actions?: ReactNode
  className?: string
}

/** Page heading for the vendor and admin portals (the light counterpart of `PageHeader`). */
export function PortalHeader({
  title,
  description,
  eyebrow,
  back,
  actions,
  className,
}: PortalHeaderProps) {
  return (
    <header className={cn('space-y-3', className)}>
      {back ? (
        <Link
          to={back.to}
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
          {back.label}
        </Link>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              <span className="brand-ribbon h-1 w-7 rounded-full" aria-hidden />
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-2xl font-extrabold leading-tight text-primary-deep sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <div className="mt-1.5 max-w-2xl text-sm text-muted sm:text-[15px]">
              {description}
            </div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  )
}
