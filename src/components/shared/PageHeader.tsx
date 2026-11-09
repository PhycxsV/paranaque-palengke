import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PAGE_WIDTH, type PageWidth } from '@/components/shared/page-width'

interface PageHeaderProps {
  title: string
  description?: ReactNode
  eyebrow?: string
  back?: { to: string; label: string }
  actions?: ReactNode
  width?: PageWidth
  /** Extra content under the title (search bar, step indicator...). */
  children?: ReactNode
}

/** Green branded band that opens every customer page. */
export function PageHeader({
  title,
  description,
  eyebrow,
  back,
  actions,
  width = 'default',
  children,
}: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary-deep via-primary-deep to-primary text-white">
      <span
        className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-lime/20 blur-3xl"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-bay/20 blur-3xl"
        aria-hidden
      />
      <span className="brand-ribbon absolute inset-x-0 bottom-0 h-1" aria-hidden />

      <div
        className={cn(
          'relative mx-auto px-4 pb-9 pt-7 sm:px-6 sm:pb-11 sm:pt-9',
          PAGE_WIDTH[width],
        )}
      >
        {back ? (
          <Link
            to={back.to}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white/75 transition hover:text-lime"
          >
            <ArrowLeft className="h-4 w-4" />
            {back.label}
          </Link>
        ) : null}

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-lime">
                <span className="brand-ribbon h-1 w-7 rounded-full" aria-hidden />
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
              {title}
            </h1>
            {description ? (
              <div className="mt-2 max-w-2xl text-sm text-white/80 sm:text-base">
                {description}
              </div>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>

        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </div>
  )
}
