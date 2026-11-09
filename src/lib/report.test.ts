import { describe, expect, it } from 'vitest'
import { unzipSync, strFromU8 } from 'fflate'
import {
  buildReport,
  computeTotals,
  endOfDay,
  isWithinRange,
  startOfDay,
  type ReportInput,
} from './report'
import { buildCsv, buildXlsx } from './report-export'
import type { Order, Vendor, VendorFeedback } from '@/types'

function makeOrder(overrides: Partial<Order> & Pick<Order, 'id'>): Order {
  return {
    bookingGroupId: 'BOOK-1',
    vendorId: 'v1',
    vendorName: 'Aling Nena',
    customerName: 'Ana',
    contactNumber: '0917',
    items: [
      {
        productId: 'p1',
        name: 'Kamatis',
        unit: 'kg',
        unitPrice: 80,
        standardUnitPrice: 80,
        quantity: 2,
        lineTotal: 160,
        imageUrl: '',
        pricingSource: 'standard',
      },
    ],
    subtotal: 160,
    deliveryFee: 100,
    total: 260,
    status: 'confirmed',
    deliveryStatus: 'delivered',
    branchId: 'b1',
    branchName: 'Baclaran',
    pickupLat: 14.5,
    pickupLng: 121,
    createdAt: new Date(2026, 10, 9, 9, 30).toISOString(),
    updatedAt: new Date(2026, 10, 9, 9, 30).toISOString(),
    ...overrides,
  }
}

const vendors = [
  { id: 'v1', name: 'Aling Nena', branchId: 'b1' },
] as unknown as Vendor[]

const feedback: VendorFeedback[] = [
  {
    id: 'f1',
    vendorId: 'v1',
    customerName: 'Ana',
    rating: 4,
    comment: 'Good',
    createdAt: new Date(2026, 10, 9, 12).toISOString(),
  },
  {
    id: 'f2',
    vendorId: 'v1',
    customerName: 'Ben',
    rating: 5,
    comment: 'Great',
    createdAt: new Date(2026, 10, 9, 13).toISOString(),
  },
]

const orders: Order[] = [
  makeOrder({ id: 'O1' }),
  makeOrder({ id: 'O2', status: 'awaiting_vendor_confirmation', deliveryStatus: undefined }),
  makeOrder({ id: 'O3', status: 'payment_rejected', deliveryStatus: undefined }),
]

const input: ReportInput = {
  orders,
  vendors,
  feedback,
  from: startOfDay(new Date(2026, 10, 9)),
  to: endOfDay(new Date(2026, 10, 9)),
  generatedAt: new Date(2026, 10, 9, 18),
  filtersLabel: 'All vendors',
}

describe('report totals', () => {
  it('counts statuses and sums only confirmed sales', () => {
    const t = computeTotals(orders)
    expect(t.orders).toBe(3)
    expect(t.confirmed).toBe(1)
    expect(t.awaitingConfirmation).toBe(1)
    expect(t.rejected).toBe(1)
    expect(t.confirmedGross).toBe(260)
    expect(t.confirmedSubtotal).toBe(160)
    expect(t.confirmedDeliveryFees).toBe(100)
    expect(t.delivered).toBe(1)
  })

  it('checks inclusive date ranges', () => {
    const from = startOfDay(new Date(2026, 10, 9))
    const to = endOfDay(new Date(2026, 10, 9))
    expect(isWithinRange(new Date(2026, 10, 9, 0, 0).toISOString(), from, to)).toBe(true)
    expect(isWithinRange(new Date(2026, 10, 10, 0, 1).toISOString(), from, to)).toBe(false)
  })
})

describe('report build', () => {
  const report = buildReport(input)

  it('creates the four sheets', () => {
    expect(report.sheets.map((s) => s.name)).toEqual([
      'Summary',
      'Orders',
      'Line items',
      'Feedback',
    ])
  })

  it('includes one row per order and per line item', () => {
    expect(report.ordersTable.rows).toHaveLength(3)
    // header + 3 items
    expect(report.sheets[2].rows).toHaveLength(4)
  })

  it('includes feedback inside the range', () => {
    expect(report.sheets[3].rows).toHaveLength(3)
  })
})

describe('csv export', () => {
  it('adds a BOM and quotes commas / quotes', () => {
    const csv = buildCsv(['a', 'b'], [['x,y', 'say "hi"']])
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('"x,y","say ""hi"""')
  })

  it('neutralises formula injection', () => {
    const csv = buildCsv(['a'], [['=SUM(A1)'], ['+1'], ['@cmd']])
    expect(csv).toContain("'=SUM(A1)")
    expect(csv).toContain("'+1")
    expect(csv).toContain("'@cmd")
  })

  it('keeps money to two decimals', () => {
    expect(buildCsv(['a'], [[80.5]])).toContain('80.50')
  })
})

describe('xlsx export', () => {
  it('produces a valid zip with every sheet', () => {
    const bytes = buildXlsx(buildReport(input).sheets)
    const files = unzipSync(bytes)
    expect(Object.keys(files)).toEqual(
      expect.arrayContaining([
        '[Content_Types].xml',
        'xl/workbook.xml',
        'xl/styles.xml',
        'xl/worksheets/sheet1.xml',
        'xl/worksheets/sheet4.xml',
      ]),
    )
    const sheet2 = strFromU8(files['xl/worksheets/sheet2.xml'])
    expect(sheet2).toContain('O1')
    expect(sheet2).toContain('<v>260</v>')
  })

  it('escapes xml characters', () => {
    const bytes = buildXlsx([{ name: 'T', rows: [['<a & "b">']] }])
    const xml = strFromU8(unzipSync(bytes)['xl/worksheets/sheet1.xml'])
    expect(xml).toContain('&lt;a &amp; &quot;b&quot;&gt;')
  })
})
