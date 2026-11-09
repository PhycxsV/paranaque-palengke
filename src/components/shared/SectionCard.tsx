import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectionCardProps {
  title?: string
  icon?: LucideIcon
  action?: ReactNode
  className?: string
  bodyClassName?: string
  children: ReactNode
}

/** Content panel with an optional icon-tile heading. */
export function SectionCard({
  title,
  icon: Icon,
  action,
  className,
  bodyClassName,
  children,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)]',
        className,
      )}
    >
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-primary-50/70 to-transparent px-5 py-3.5 sm:px-6">
          <h2 className="flex min-w-0 items-center gap-2.5 text-base font-bold text-primary-deep">
            {Icon ? (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm ring-1 ring-primary/10">
                <Icon className="h-4 w-4" />
              </span>
            ) : null}
            <span className="truncate">{title}</span>
          </h2>
          {action}
        </header>
      ) : null}
      <div className={cn('p-5 sm:p-6', bodyClassName)}>{children}</div>
    </section>
  )
}
