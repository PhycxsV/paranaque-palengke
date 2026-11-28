import { useEffect, useRef, useState } from 'react'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MIN_ZOOM = 1
const MAX_ZOOM = 4
const ZOOM_STEP = 0.5
const DOUBLE_CLICK_ZOOM = 2.5

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
}

/**
 * Photo viewer with zoom controls. Zoom with the buttons, double-click, or
 * pinch / Ctrl+scroll. A zoomed photo can be moved around by scrolling.
 */
export function ZoomableImage({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  const [zoom, setZoom] = useState(MIN_ZOOM)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setZoom(MIN_ZOOM)
  }, [src])

  // Trackpad pinch and Ctrl+scroll arrive as wheel events with ctrlKey set.
  // React's onWheel is passive, so attach the listener directly.
  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      setZoom((current) => clampZoom(current - event.deltaY * 0.01))
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [])

  const zoomed = zoom > MIN_ZOOM

  return (
    <div className={cn('space-y-2', className)}>
      <div
        ref={containerRef}
        className="max-h-[min(70vh,560px)] overflow-auto rounded-xl border border-border bg-warm-white"
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          onDoubleClick={() =>
            setZoom((current) =>
              current > MIN_ZOOM ? MIN_ZOOM : DOUBLE_CLICK_ZOOM,
            )
          }
          className={cn(
            'block select-none',
            zoomed
              ? 'max-w-none cursor-zoom-out'
              : 'mx-auto max-h-[min(70vh,560px)] w-full cursor-zoom-in object-contain',
          )}
          style={zoomed ? { width: `${zoom * 100}%` } : undefined}
        />
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setZoom((current) => clampZoom(current - ZOOM_STEP))}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-12 text-center text-xs font-medium tabular-nums text-muted">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setZoom((current) => clampZoom(current + ZOOM_STEP))}
          disabled={zoom >= MAX_ZOOM}
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setZoom(MIN_ZOOM)}
          disabled={!zoomed}
          aria-label="Reset zoom"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
