import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  align?: 'left' | 'center'
  as?: 'h1' | 'h2'
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = 'left',
  as: Heading = 'h2',
  className,
}: SectionHeadingProps) {
  const centered = align === 'center'
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        centered
          ? 'items-center text-center'
          : 'sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow ? (
          <p
            className={cn(
              'mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary',
              centered && 'justify-center',
            )}
          >
            <span className="brand-ribbon h-1 w-8 rounded-full" aria-hidden />
            {eyebrow}
          </p>
        ) : null}
        <Heading className="text-2xl font-extrabold text-primary-deep sm:text-3xl">
          {title}
        </Heading>
        {description ? (
          <p className="mt-2 text-sm text-muted sm:text-base">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
