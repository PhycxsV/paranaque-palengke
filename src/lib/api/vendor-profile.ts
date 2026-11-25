import { apiRequest } from './client'

export async function updateVendorProfile(input: {
  currentPassword?: string
  password?: string
  name?: string
  phone?: string
}): Promise<{ documentId: string; name?: string; email?: string; phone?: string }> {
  const body: Record<string, unknown> = {}
  if (input.name !== undefined) body.name = input.name.trim()
  if (input.phone !== undefined) body.phone = input.phone.trim()
  if (input.password !== undefined) {
    body.password = input.password
    body.currentPassword = input.currentPassword
  }

  const payload = await apiRequest<{
    data: {
      documentId: string
      name?: string
      email?: string
      phone?: string
    }
  }>('/vendor-profile/me', {
    method: 'PUT',
    body,
  })
  return payload.data
}
