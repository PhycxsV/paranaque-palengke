import { ImageIcon } from 'lucide-react'
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
import { cn } from '@/lib/utils'

/** Opens Keri's proof-of-delivery photo when `podUrl` is present. */
export function ProofOfDeliveryButton({
  podUrl,
  className,
  size = 'sm',
}: {
  podUrl?: string | null
  className?: string
  size?: 'sm' | 'default'
}) {
  const url = podUrl?.trim()
  if (!url) return null

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={size}
          className={cn('gap-1.5', className)}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          View proof of delivery
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md" mobileSheet>
        <DialogHeader>
          <DialogTitle>Proof of delivery</DialogTitle>
          <DialogDescription>
            Photo from Keri when the order was marked delivered.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <ZoomableImage src={url} alt="Proof of delivery" />
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block truncate text-center text-xs font-medium text-primary underline"
          >
            Open full image
          </a>
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
  )
}
