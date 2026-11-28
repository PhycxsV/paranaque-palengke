import { useEffect, useId, useState, type ChangeEvent } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Notice } from '@/components/shared/Notice'

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

/** Returns an error message for a file that the API would reject, or null. */
export function validatePaymentProof(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Upload a PNG, JPEG, or WebP photo.'
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return 'The photo must be between 1 byte and 5 MB.'
  }
  return null
}

/**
 * Required photo of the customer's payment (receipt or screenshot) that is
 * sent with the payment and shown to the vendor.
 */
export function PaymentProofField({
  file,
  onChange,
  disabled,
}: {
  file: File | null
  onChange: (file: File | null) => void
  disabled?: boolean
}) {
  const inputId = useId()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null
    event.target.value = ''
    if (!selected) return
    const problem = validatePaymentProof(selected)
    if (problem) {
      setError(problem)
      onChange(null)
      return
    }
    setError(null)
    onChange(selected)
  }

  return (
    <div className="space-y-3">
      <Notice tone="warning" title="Please make sure you upload the correct photo">
        Upload a clear screenshot or photo of your payment receipt that shows
        the amount and reference number. The vendor will check this photo before
        confirming your payment.
      </Notice>

      {previewUrl ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-warm-white p-3">
          <img
            src={previewUrl}
            alt="Selected proof of payment"
            className="mx-auto max-h-64 w-full object-contain"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="truncate text-xs text-muted">{file?.name}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => onChange(null)}
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary-50/40 px-4 py-8 text-center text-sm font-medium text-primary-deep hover:bg-primary-50/70"
        >
          <ImagePlus className="h-6 w-6" />
          Upload proof of payment
          <span className="text-xs font-normal text-muted">
            PNG, JPEG, or WebP up to 5 MB
          </span>
        </label>
      )}

      <input
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        disabled={disabled}
        onChange={handleChange}
      />

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
