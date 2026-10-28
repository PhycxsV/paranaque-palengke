import { describe, expect, it } from 'vitest'
import {
  formatVendorTime,
  isPastCutoff,
  isVendorAcceptingOrders,
  parseTimeToMinutes,
} from './vendor-hours'

describe('vendor-hours', () => {
  it('parses HH:mm', () => {
    expect(parseTimeToMinutes('09:30')).toBe(9 * 60 + 30)
    expect(parseTimeToMinutes('17:00')).toBe(17 * 60)
    expect(parseTimeToMinutes('bad')).toBeNull()
  })

  it('formats display time', () => {
    expect(formatVendorTime('17:00')).toBe('5:00 PM')
    expect(formatVendorTime('09:05')).toBe('9:05 AM')
  })

  it('detects past cut-off', () => {
    const vendor = { cutoffTime: '14:00' }
    expect(isPastCutoff(vendor, new Date(2026, 0, 1, 13, 59))).toBe(false)
    expect(isPastCutoff(vendor, new Date(2026, 0, 1, 14, 0))).toBe(true)
  })

  it('requires open flag and hours window', () => {
    const vendor = {
      isAvailable: true,
      opensAt: '06:00',
      cutoffTime: '17:00',
    }
    expect(isVendorAcceptingOrders(vendor, new Date(2026, 0, 1, 10, 0))).toBe(true)
    expect(isVendorAcceptingOrders(vendor, new Date(2026, 0, 1, 5, 0))).toBe(false)
    expect(isVendorAcceptingOrders(vendor, new Date(2026, 0, 1, 17, 0))).toBe(false)
    expect(
      isVendorAcceptingOrders(
        { ...vendor, isAvailable: false },
        new Date(2026, 0, 1, 10, 0),
      ),
    ).toBe(false)
  })
})
