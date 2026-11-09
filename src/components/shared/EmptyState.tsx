import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-primary/25 bg-gradient-to-b from-surface to-primary-50/50 px-6 py-14 text-center">
      <span
        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-lime/20 blur-2xl"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-bay/15 blur-2xl"
        aria-hidden
      />
      <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary ring-8 ring-lime/20">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="relative text-xl font-bold text-primary-deep">{title}</h3>
      <p className="relative mt-2 max-w-md text-sm text-muted">{description}</p>
      {actionLabel && onAction ? (
        <Button className="relative mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
