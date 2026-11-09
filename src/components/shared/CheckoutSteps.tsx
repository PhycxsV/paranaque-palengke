import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = ['Cart', 'Checkout', 'Payment', 'Delivery'] as const

/** Four-step progress indicator, styled for the dark green page header. */
export function CheckoutSteps({ current }: { current: 0 | 1 | 2 | 3 }) {
  return (
    <ol className="flex items-center">
      {STEPS.map((label, index) => {
        const done = index < current
        const active = index === current
        return (
          <li key={label} className="flex items-center">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  done && 'bg-lime text-primary-deep',
                  active && 'bg-white text-primary-deep ring-4 ring-white/25',
                  !done && !active && 'bg-white/15 text-white/70',
                )}
              >
                {done ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  'hidden text-xs font-semibold sm:inline',
                  active ? 'text-white' : done ? 'text-lime' : 'text-white/60',
                )}
              >
                {label}
              </span>
            </div>
            {index < STEPS.length - 1 ? (
              <span
                className={cn(
                  'mx-2 h-0.5 w-6 rounded-full sm:mx-3 sm:w-12',
                  done ? 'bg-lime' : 'bg-white/20',
                )}
                aria-hidden
              />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
