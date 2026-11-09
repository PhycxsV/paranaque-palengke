import { QrCode } from 'lucide-react'

interface DemoQrPlaceholderProps {
  label: string
  amountLabel?: string
}

const FILLED = [0, 1, 2, 4, 5, 6, 8, 10, 12, 14, 16, 18, 19, 20, 22, 23, 24]

export function DemoQrPlaceholder({ label, amountLabel }: DemoQrPlaceholderProps) {
  return (
    <div className="mx-auto flex w-full max-w-xs flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-gold bg-gradient-to-b from-gold-50 to-surface p-5 text-center">
      <p className="rounded-full bg-gold px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-primary-deep shadow-sm">
        DEMO ONLY — DO NOT SEND REAL MONEY
      </p>
      <div className="relative flex h-44 w-44 items-center justify-center rounded-2xl bg-white shadow-[var(--shadow-soft)] ring-1 ring-primary/10">
        <span className="absolute left-3 top-3 h-5 w-5 rounded-tl-lg border-l-4 border-t-4 border-primary" aria-hidden />
        <span className="absolute right-3 top-3 h-5 w-5 rounded-tr-lg border-r-4 border-t-4 border-primary" aria-hidden />
        <span className="absolute bottom-3 left-3 h-5 w-5 rounded-bl-lg border-b-4 border-l-4 border-primary" aria-hidden />
        <span className="absolute bottom-3 right-3 h-5 w-5 rounded-br-lg border-b-4 border-r-4 border-primary" aria-hidden />
        <div className="grid grid-cols-5 gap-1 opacity-35">
          {Array.from({ length: 25 }).map((_, index) => (
            <span
              key={index}
              className={`h-3 w-3 rounded-[3px] ${
                FILLED.includes(index) ? 'bg-primary-deep' : 'bg-transparent'
              }`}
            />
          ))}
        </div>
        <span className="absolute flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-primary/15">
          <QrCode className="h-7 w-7 text-primary" />
        </span>
      </div>
      <div>
        <p className="font-display text-base font-bold text-primary-deep">{label}</p>
        {amountLabel ? (
          <p className="mt-1 text-sm text-muted">
            Amount due:{' '}
            <span className="font-bold text-primary">{amountLabel}</span>
          </p>
        ) : null}
      </div>
    </div>
  )
}
