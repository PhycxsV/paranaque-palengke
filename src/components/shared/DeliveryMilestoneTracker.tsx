import { Check, Package, Truck } from 'lucide-react'
import { DELIVERY_MILESTONES } from '@/constants'
import { cn } from '@/lib/utils'
import type { DeliveryStatus } from '@/types'

const ICONS = {
  awaiting_pickup: Package,
  out_for_delivery: Truck,
  delivered: Check,
} as const

const ORDER: DeliveryStatus[] = [
  'awaiting_pickup',
  'out_for_delivery',
  'delivered',
]

function stepIndex(status: DeliveryStatus): number {
  return ORDER.indexOf(status)
}

interface DeliveryMilestoneTrackerProps {
  deliveryStatus: DeliveryStatus
  className?: string
}

export function DeliveryMilestoneTracker({
  deliveryStatus,
  className,
}: DeliveryMilestoneTrackerProps) {
  const current = stepIndex(deliveryStatus)

  return (
    <section
      className={cn(
        'rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]',
        className,
      )}
    >
      <div className="mb-1 flex items-center gap-2">
        <Truck className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold text-primary-deep">Keri delivery</h2>
      </div>
      <p className="mb-5 text-xs text-muted">
        Track your order after payment confirmation.
      </p>

      <ol className="relative space-y-0">
        {DELIVERY_MILESTONES.map((milestone, index) => {
          const Icon = ICONS[milestone.id]
          const done = index < current
          const active = index === current
          const upcoming = index > current

          return (
            <li key={milestone.id} className="relative flex gap-3 pb-6 last:pb-0">
              {index < DELIVERY_MILESTONES.length - 1 ? (
                <span
                  className={cn(
                    'absolute left-[15px] top-8 h-[calc(100%-1.25rem)] w-0.5',
                    done || active ? 'bg-primary' : 'bg-border',
                  )}
                  aria-hidden
                />
              ) : null}
              <div
                className={cn(
                  'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                  done && 'border-primary bg-primary text-white',
                  active && 'border-primary bg-primary-50 text-primary',
                  upcoming && 'border-border bg-surface text-muted',
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 pt-0.5">
                <p
                  className={cn(
                    'text-sm',
                    active || done
                      ? 'font-bold text-primary-deep'
                      : 'font-medium text-muted',
                  )}
                >
                  {milestone.label}
                  {active ? (
                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Current
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-xs text-muted">{milestone.description}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
