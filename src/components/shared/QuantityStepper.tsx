import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuantityStepperProps {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
}

/** Pill-shaped − / + control. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = Number.POSITIVE_INFINITY,
  disabled,
  size = 'md',
  className,
}: QuantityStepperProps) {
  const btn = cn(
    'flex items-center justify-center rounded-full text-primary-deep transition-colors hover:bg-white disabled:pointer-events-none disabled:opacity-40',
    size === 'md' ? 'h-9 w-9' : 'h-7 w-7',
  )
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-primary-50 p-1 ring-1 ring-primary/10',
        className,
      )}
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className={size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
      </button>
      <span
        className={cn(
          'text-center font-bold text-primary-deep',
          size === 'md' ? 'min-w-[2.5rem] text-base' : 'min-w-[1.75rem] text-sm',
        )}
      >
        {value}
      </span>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <Plus className={size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
      </button>
    </div>
  )
}
