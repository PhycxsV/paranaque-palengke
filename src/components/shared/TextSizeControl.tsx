import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, ALargeSmall } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TEXT_SIZE_OPTIONS, useTextSizeStore } from '@/stores/text-size-store'

interface TextSizeControlProps {
  /** `menu` = icon button with a dropdown; `inline` = segmented buttons (for sheets). */
  variant?: 'menu' | 'inline'
  /** Style the trigger for dark backgrounds (hero / sidebar). */
  onDark?: boolean
  className?: string
}

const SAMPLE_SCALE = ['text-xs', 'text-sm', 'text-base', 'text-lg']

/** Lets anyone pick the text size they are comfortable reading. */
export function TextSizeControl({
  variant = 'menu',
  onDark,
  className,
}: TextSizeControlProps) {
  const size = useTextSizeStore((s) => s.size)
  const setSize = useTextSizeStore((s) => s.setSize)

  if (variant === 'inline') {
    return (
      <div
        role="radiogroup"
        aria-label="Text size"
        className={cn('grid grid-cols-4 gap-2', className)}
      >
        {TEXT_SIZE_OPTIONS.map((option, i) => {
          const active = option.value === size
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSize(option.value)}
              className={cn(
                'flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl border font-bold transition',
                active
                  ? 'border-primary bg-primary text-white shadow-sm shadow-primary/25'
                  : 'border-border bg-surface text-primary-deep hover:border-primary/40 hover:bg-primary-50',
              )}
            >
              <span className={cn('leading-none', SAMPLE_SCALE[i])}>Aa</span>
              <span className="text-[10px] font-semibold opacity-80">
                {option.label}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Text size"
          title="Text size"
          className={cn(
            'inline-flex h-10 w-10 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
            onDark
              ? 'text-white/85 hover:bg-white/15 hover:text-white'
              : 'text-ink hover:bg-primary-50',
            className,
          )}
        >
          <ALargeSmall className="h-5 w-5" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="dialog-content z-[60] w-52 rounded-2xl border border-border bg-surface p-1.5 shadow-[var(--shadow-lift)]"
        >
          <DropdownMenu.Label className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-muted">
            Text size
          </DropdownMenu.Label>
          {TEXT_SIZE_OPTIONS.map((option, i) => (
            <DropdownMenu.Item
              key={option.value}
              onSelect={() => setSize(option.value)}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-ink outline-none transition data-[highlighted]:bg-primary-50',
                option.value === size && 'bg-primary-50 text-primary-deep',
              )}
            >
              <span className="flex items-baseline gap-2.5">
                <span className={cn('w-7 font-bold text-primary', SAMPLE_SCALE[i])}>
                  Aa
                </span>
                {option.label}
              </span>
              {option.value === size ? (
                <Check className="h-4 w-4 text-primary" />
              ) : null}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
