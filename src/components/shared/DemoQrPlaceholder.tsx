import { QrCode } from 'lucide-react'

interface DemoQrPlaceholderProps {
  label: string
  amountLabel?: string
}

export function DemoQrPlaceholder({ label, amountLabel }: DemoQrPlaceholderProps) {
  return (
    <div className="mx-auto flex w-full max-w-xs flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gold bg-gold-50 p-5 text-center">
      <p className="rounded-md bg-gold px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-deep">
        DEMO ONLY — DO NOT SEND REAL MONEY
      </p>
      <div className="relative flex h-44 w-44 items-center justify-center rounded-lg border border-gold/40 bg-white">
        <div className="grid grid-cols-5 gap-1 opacity-40">
          {Array.from({ length: 25 }).map((_, index) => (
            <span
              key={index}
              className={`h-3 w-3 rounded-[2px] ${
                [0, 1, 2, 4, 5, 6, 8, 10, 12, 14, 16, 18, 19, 20, 22, 23, 24].includes(
                  index,
                )
                  ? 'bg-primary-deep'
                  : 'bg-transparent'
              }`}
            />
          ))}
        </div>
        <QrCode className="absolute h-10 w-10 text-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold text-primary-deep">{label}</p>
        {amountLabel ? (
          <p className="mt-1 text-sm text-muted">Amount due: {amountLabel}</p>
        ) : null}
      </div>
    </div>
  )
}
