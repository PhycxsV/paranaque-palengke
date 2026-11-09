import { cn } from '@/lib/utils'

export interface FilterTabItem<T extends string> {
  value: T
  label: string
  count?: number
}

interface FilterTabsProps<T extends string> {
  items: FilterTabItem<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

/** Pill-style segmented filter with optional counts. Scrolls sideways on small screens. */
export function FilterTabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: FilterTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        '-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0',
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200',
              active
                ? 'border-primary bg-primary text-white shadow-sm shadow-primary/25'
                : 'border-border bg-surface text-ink hover:border-primary/40 hover:bg-primary-50',
            )}
          >
            {item.label}
            {item.count !== undefined ? (
              <span
                className={cn(
                  'min-w-5 rounded-full px-1.5 text-center text-[11px] font-bold leading-5',
                  active ? 'bg-white/20 text-white' : 'bg-primary-50 text-primary-deep',
                )}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
