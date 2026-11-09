import type { ReactNode } from 'react'
import { CircleCheck, CircleX, Clock, Info, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tone = 'info' | 'warning' | 'success' | 'danger' | 'pending'

const TONES: Record<Tone, { box: string; icon: string; Icon: typeof Info }> = {
  info: {
    box: 'border-primary/15 bg-primary-50 text-primary-deep',
    icon: 'bg-white text-primary',
    Icon: Info,
  },
  warning: {
    box: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: 'bg-white text-amber-600',
    Icon: TriangleAlert,
  },
  pending: {
    box: 'border-gold/50 bg-gold-50 text-[#6b5200]',
    icon: 'bg-white text-[#a07800]',
    Icon: Clock,
  },
  success: {
    box: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    icon: 'bg-white text-emerald-600',
    Icon: CircleCheck,
  },
  danger: {
    box: 'border-red-200 bg-red-50 text-red-900',
    icon: 'bg-white text-red-600',
    Icon: CircleX,
  },
}

interface NoticeProps {
  tone?: Tone
  title?: string
  children?: ReactNode
  /** `panel` centres a larger icon — used for payment status screens. */
  layout?: 'inline' | 'panel'
  action?: ReactNode
  className?: string
}

export function Notice({
  tone = 'info',
  title,
  children,
  layout = 'inline',
  action,
  className,
}: NoticeProps) {
  const { box, icon, Icon } = TONES[tone]

  if (layout === 'panel') {
    return (
      <div
        className={cn(
          'flex flex-col items-center rounded-2xl border p-7 text-center',
          box,
          className,
        )}
      >
        <span
          className={cn(
            'mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm',
            icon,
          )}
        >
          <Icon className="h-7 w-7" />
        </span>
        {title ? <h2 className="text-lg font-bold">{title}</h2> : null}
        {children ? <div className="mt-2 text-sm opacity-90">{children}</div> : null}
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    )
  }

  return (
    <div className={cn('flex gap-3 rounded-2xl border p-4 text-sm', box, className)}>
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm',
          icon,
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1 self-center">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? (
          <div className={cn(title && 'mt-0.5', 'opacity-90')}>{children}</div>
        ) : null}
      </div>
      {action ? <div className="shrink-0 self-center">{action}</div> : null}
    </div>
  )
}
