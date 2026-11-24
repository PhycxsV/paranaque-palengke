export type CoordinateParseResult =
  | { ok: true; lat: number | null; lng: number | null }
  | { ok: false; message: string }

/** Formats a stored coordinate for a text input (empty when unset). */
export function formatCoordinate(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : ''
}

/** Map center from lat/lng text. Blank or 0,0 falls back so we don't open on the ocean. */
export function mapPinFromText(
  latText: string,
  lngText: string,
  fallback: { lat: number; lng: number },
): { lat: number; lng: number } {
  const latRaw = latText.trim()
  const lngRaw = lngText.trim()
  if (!latRaw || !lngRaw) return fallback
  const lat = Number(latRaw)
  const lng = Number(lngRaw)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return fallback
  if (lat === 0 && lng === 0) return fallback
  return { lat, lng }
}

/** Great-circle distance in kilometers (WGS84 sphere). */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180
  const earthKm = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2
  return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Parses lat/lng text inputs. Both blank → `null`/`null`; a single blank,
 * non-numeric or out-of-range value is rejected.
 */
export function parseDropoffCoordinates(
  latText: string,
  lngText: string,
): CoordinateParseResult {
  const latRaw = latText.trim()
  const lngRaw = lngText.trim()
  if (!latRaw && !lngRaw) return { ok: true, lat: null, lng: null }
  if (!latRaw || !lngRaw) {
    return { ok: false, message: 'Enter both latitude and longitude.' }
  }

  const lat = Number(latRaw)
  const lng = Number(lngRaw)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, message: 'Latitude and longitude must be numbers.' }
  }
  if (lat < -90 || lat > 90) {
    return { ok: false, message: 'Latitude must be between -90 and 90.' }
  }
  if (lng < -180 || lng > 180) {
    return { ok: false, message: 'Longitude must be between -180 and 180.' }
  }
  return { ok: true, lat, lng }
}
