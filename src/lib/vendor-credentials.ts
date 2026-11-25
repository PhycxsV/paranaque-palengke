export function validateVendorCredentials(input: {
  email: string
  phone: string
  password: string
}): string | null {
  if (!input.email.includes('@')) {
    return 'Enter a valid email address.'
  }
  if (input.phone.replace(/\D/g, '').length < 10) {
    return 'Enter a valid phone number (at least 10 digits).'
  }
  if (input.password.length < 8) {
    return 'Password must be at least 8 characters.'
  }
  return null
}
