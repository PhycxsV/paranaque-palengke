import { apiRequest } from './client'
import type { CustomerProfile } from '@/stores/customer-profile-store'

/** Profile fields the customer can read from and send to the API (photo stays local). */
export type CustomerProfileRemote = Omit<CustomerProfile, 'photoUrl'>

export type CustomerProfileUpdateInput = Pick<
  CustomerProfile,
  'deliveryAddress' | 'dropoffLat' | 'dropoffLng' | 'dropoffLandmark' | 'notes'
>

interface ApiCustomerProfile {
  name?: string | null
  phone?: string | null
  dropoffAddress?: string | null
  dropoffLat?: number | string | null
  dropoffLng?: number | string | null
  dropoffLandmark?: string | null
  defaultNotes?: string | null
}

function toCoordinate(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

export function mapCustomerProfile(raw: ApiCustomerProfile): CustomerProfileRemote {
  return {
    name: raw.name?.trim() ?? '',
    contactNumber: raw.phone?.trim() ?? '',
    deliveryAddress: raw.dropoffAddress?.trim() ?? '',
    dropoffLat: toCoordinate(raw.dropoffLat),
    dropoffLng: toCoordinate(raw.dropoffLng),
    dropoffLandmark: raw.dropoffLandmark?.trim() ?? '',
    notes: raw.defaultNotes?.trim() ?? '',
  }
}

export async function fetchCustomerProfile(): Promise<CustomerProfileRemote> {
  const payload = await apiRequest<{ data: ApiCustomerProfile }>(
    '/customer-profile/me',
  )
  return mapCustomerProfile(payload.data ?? {})
}

/**
 * Saves drop-off details and default notes. Name and phone belong to the
 * account and are not accepted by this endpoint. Lat/lng are sent together.
 */
export async function updateCustomerProfile(
  input: CustomerProfileUpdateInput,
): Promise<CustomerProfileRemote> {
  const hasCoordinates =
    input.dropoffLat !== null &&
    input.dropoffLng !== null &&
    Number.isFinite(input.dropoffLat) &&
    Number.isFinite(input.dropoffLng)

  const payload = await apiRequest<{ data: ApiCustomerProfile }>(
    '/customer-profile/me',
    {
      method: 'PUT',
      body: {
        dropoffAddress: input.deliveryAddress.trim(),
        dropoffLandmark: input.dropoffLandmark.trim(),
        defaultNotes: input.notes.trim(),
        ...(hasCoordinates
          ? { dropoffLat: input.dropoffLat, dropoffLng: input.dropoffLng }
          : {}),
      },
    },
  )
  return mapCustomerProfile(payload.data ?? {})
}
