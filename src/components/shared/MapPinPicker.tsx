import { useEffect, useRef, useState, type FormEvent } from 'react'
import { MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isGoogleMapsConfigured, loadGoogleMaps } from '@/lib/google-maps'
import { cn } from '@/lib/utils'

type LatLng = { lat: number; lng: number }

/** Search bias around Parañaque / Metro Manila. */
const GEOCODE_BOUNDS = {
  north: 14.56,
  south: 14.42,
  east: 121.08,
  west: 120.96,
}

/** Default map center when the customer has no saved pin yet. */
export const DEFAULT_DROPOFF_PIN = { lat: 14.4793, lng: 121.0198 }

export function MapPinPicker({
  lat,
  lng,
  onChange,
  onPlaceSelected,
  initialSearch = '',
  className,
  markerTitle = 'Drop-off pin',
}: {
  lat: number
  lng: number
  onChange: (next: LatLng) => void
  /** Fills the address field when search finds a place. */
  onPlaceSelected?: (place: { address: string; lat: number; lng: number }) => void
  /** Previously picked place, shown in the search box when it's still empty. */
  initialSearch?: string
  className?: string
  markerTitle?: string
}) {
  const mapHostRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [searchBusy, setSearchBusy] = useState(false)
  const [searchHint, setSearchHint] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    isGoogleMapsConfigured() ? 'loading' : 'error',
  )
  const [error, setError] = useState(
    isGoogleMapsConfigured()
      ? ''
      : 'Add VITE_GOOGLE_MAPS_API_KEY to .env.local and restart npm run dev.',
  )

  const onChangeRef = useRef(onChange)
  const onPlaceSelectedRef = useRef(onPlaceSelected)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])
  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected
  }, [onPlaceSelected])

  // the saved profile loads after the picker mounts, so fill the box once it
  // arrives. skip it if the customer already typed something
  useEffect(() => {
    const input = searchInputRef.current
    if (input && initialSearch && !input.value) input.value = initialSearch
  }, [initialSearch])

  function applyPlace(coords: LatLng, address: string) {
    if (!mapRef.current || !markerRef.current) return
    mapRef.current.panTo(coords)
    mapRef.current.setZoom(16)
    markerRef.current.setPosition(coords)
    onChangeRef.current(coords)
    onPlaceSelectedRef.current?.({ address, ...coords })
    setSearchHint(address)
    if (searchInputRef.current) searchInputRef.current.value = address
  }

  useEffect(() => {
    if (!isGoogleMapsConfigured()) return
    let cancelled = false
    let placeListener: google.maps.MapsEventListener | null = null

    async function boot() {
      setStatus('loading')
      setError('')
      try {
        const g = await loadGoogleMaps()
        if (cancelled || !mapHostRef.current) return
        if (!g.maps.places?.Autocomplete) {
          throw new Error(
            'Places library failed to load. Confirm Places API is enabled for this key, then hard-refresh.',
          )
        }

        const center = { lat, lng }
        const map = new g.maps.Map(mapHostRef.current, {
          center,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        })
        const marker = new g.maps.Marker({
          map,
          position: center,
          draggable: true,
          title: markerTitle,
        })
        geocoderRef.current = new g.maps.Geocoder()

        map.addListener('click', (event: google.maps.MapMouseEvent) => {
          const next = event.latLng
          if (!next) return
          const coords = { lat: next.lat(), lng: next.lng() }
          marker.setPosition(coords)
          onChangeRef.current(coords)
        })

        marker.addListener('dragend', () => {
          const pos = marker.getPosition()
          if (!pos) return
          onChangeRef.current({ lat: pos.lat(), lng: pos.lng() })
        })

        mapRef.current = map
        markerRef.current = marker

        if (searchInputRef.current) {
          const bounds = new g.maps.LatLngBounds(
            { lat: GEOCODE_BOUNDS.south, lng: GEOCODE_BOUNDS.west },
            { lat: GEOCODE_BOUNDS.north, lng: GEOCODE_BOUNDS.east },
          )
          const autocomplete = new g.maps.places.Autocomplete(
            searchInputRef.current,
            {
              fields: ['formatted_address', 'geometry', 'name'],
              componentRestrictions: { country: 'ph' },
              bounds,
              strictBounds: false,
            },
          )
          autocomplete.bindTo('bounds', map)
          placeListener = autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()
            const location = place.geometry?.location
            if (!location) {
              // happens when Enter is pressed on plain text with no suggestion
              // picked. don't leave them hanging, just search what they typed
              void runSearch()
              return
            }
            const coords = { lat: location.lat(), lng: location.lng() }
            const address =
              place.formatted_address?.trim() ||
              place.name?.trim() ||
              searchInputRef.current?.value.trim() ||
              ''
            applyPlace(coords, address)
          })
          autocompleteRef.current = autocomplete
        }

        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        setStatus('error')
        setError(
          err instanceof Error ? err.message : 'Unable to load Google Maps.',
        )
      }
    }

    void boot()
    return () => {
      cancelled = true
      if (placeListener) placeListener.remove()
      autocompleteRef.current = null
      markerRef.current?.setMap(null)
      markerRef.current = null
      mapRef.current = null
      geocoderRef.current = null
    }
    // Mount once per picker instance; lat/lng sync is handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    const current = markerRef.current.getPosition()
    if (
      current &&
      Math.abs(current.lat() - lat) < 1e-7 &&
      Math.abs(current.lng() - lng) < 1e-7
    ) {
      return
    }
    const next = { lat, lng }
    markerRef.current.setPosition(next)
    mapRef.current.panTo(next)
  }, [lat, lng])

  async function runSearch(event?: FormEvent) {
    event?.preventDefault()
    const q = searchInputRef.current?.value.trim() ?? ''
    if (!q || !geocoderRef.current || !mapRef.current || !markerRef.current) return

    setSearchBusy(true)
    setSearchHint('')
    try {
      const response = await geocoderRef.current.geocode({
        address: q,
        componentRestrictions: { country: 'PH' },
        bounds: GEOCODE_BOUNDS,
      })
      const best = response.results[0]
      const location = best?.geometry?.location
      if (!location) {
        setSearchHint('No match found. Try a fuller address or click the map.')
        return
      }
      const coords = { lat: location.lat(), lng: location.lng() }
      const address = best.formatted_address?.trim() || q
      applyPlace(coords, address)
    } catch {
      setSearchHint(
        'Search failed. Check that Geocoding API is enabled for this key, then try again.',
      )
    } finally {
      setSearchBusy(false)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <form className="space-y-1.5" onSubmit={runSearch}>
        <Label htmlFor="map-pin-search" className="flex items-center gap-1.5">
          <Search className="h-3.5 w-3.5" />
          Find place
        </Label>
        <div className="flex gap-2">
          <Input
            id="map-pin-search"
            ref={searchInputRef}
            onKeyDown={(e) => {
              // Enter also submits the form, and that geocodes the text again
              // right after a suggestion was picked, which can move the pin to
              // a different spot. Google still handles Enter for the pick, and
              // place_changed falls back to a search if nothing was picked
              if (e.key === 'Enter') e.preventDefault()
            }}
            placeholder="e.g. San Dionisio, Parañaque"
            disabled={status !== 'ready' || searchBusy}
            autoComplete="off"
          />
          <Button
            type="submit"
            variant="outline"
            disabled={status !== 'ready' || searchBusy}
            className="shrink-0"
          >
            {searchBusy ? '…' : 'Search'}
          </Button>
        </div>
        {searchHint ? (
          <p className="text-[11px] text-muted">{searchHint}</p>
        ) : (
          <p className="text-[11px] text-muted">
            Start typing for place suggestions, or press Search. Then drag the
            pin to the exact drop-off.
          </p>
        )}
      </form>

      <div
        className={cn(
          'relative overflow-hidden rounded-xl border border-border bg-surface',
          status === 'error' ? 'min-h-40' : 'min-h-56',
        )}
      >
        <div ref={mapHostRef} className="h-56 w-full sm:h-64" />
        {status !== 'ready' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-warm-white/90 px-4 text-center text-sm text-muted">
            {status === 'loading' ? 'Loading Google Maps…' : error}
          </div>
        ) : null}
      </div>

      <p className="flex items-start gap-1.5 text-[11px] text-muted">
        <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
        Click the map or drag the pin. Lat/lng update automatically.
      </p>
    </div>
  )
}
