import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductImageProps {
  src: string
  alt: string
  className?: string
  imgClassName?: string
}

export function ProductImage({
  src,
  alt,
  className,
  imgClassName,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false)

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-primary-50',
        className,
      )}
    >
      {failed ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted">
          <ImageOff className="h-8 w-8" />
          <span className="text-xs">Image unavailable</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className={cn('h-full w-full object-cover', imgClassName)}
        />
      )}
    </div>
  )
}
