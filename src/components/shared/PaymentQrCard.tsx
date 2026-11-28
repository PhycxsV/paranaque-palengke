import { QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ZoomableImage } from '@/components/shared/ZoomableImage'

interface PaymentQrCardProps {
  label: string
  amountLabel?: string
  /** Vendor-uploaded QR from the API. Falls back to the placeholder pattern. */
  imageUrl?: string
}

const FILLED = [0, 1, 2, 4, 5, 6, 8, 10, 12, 14, 16, 18, 19, 20, 22, 23, 24]

// seed / old local cache still has "DEMO QR — …"; never show that word
function displayQrLabel(label: string): string {
  const cleaned = label.replace(/\bDEMO\s+/gi, '').trim()
  return cleaned || 'Payment QR'
}

export function PaymentQrCard({
  label,
  amountLabel,
  imageUrl,
}: PaymentQrCardProps) {
  const hasUploadedQr = Boolean(imageUrl?.trim())
  const title = displayQrLabel(label)

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-gold bg-gradient-to-b from-gold-50 to-surface p-4 text-center sm:p-5">
      <div className="relative flex aspect-square w-full max-w-sm items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-soft)] ring-1 ring-primary/10">
        {hasUploadedQr ? (
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="h-full w-full cursor-zoom-in"
                aria-label="Zoom QR code"
              >
                <img
                  src={imageUrl}
                  alt={title}
                  className="h-full w-full object-contain p-1 sm:p-2"
                />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md" mobileSheet>
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>
                  Zoom in to check or scan the QR code.
                </DialogDescription>
              </DialogHeader>
              <DialogBody>
                <ZoomableImage src={imageUrl ?? ''} alt={title} />
              </DialogBody>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <>
            <span
              className="absolute left-3 top-3 h-5 w-5 rounded-tl-lg border-l-4 border-t-4 border-primary"
              aria-hidden
            />
            <span
              className="absolute right-3 top-3 h-5 w-5 rounded-tr-lg border-r-4 border-t-4 border-primary"
              aria-hidden
            />
            <span
              className="absolute bottom-3 left-3 h-5 w-5 rounded-bl-lg border-b-4 border-l-4 border-primary"
              aria-hidden
            />
            <span
              className="absolute bottom-3 right-3 h-5 w-5 rounded-br-lg border-b-4 border-r-4 border-primary"
              aria-hidden
            />
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
          </>
        )}
      </div>
      <div>
        <p className="font-display text-base font-bold text-primary-deep">
          {title}
        </p>
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
