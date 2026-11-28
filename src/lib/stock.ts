import type { Product } from '@/types'

/** Units currently locked in other customers' unconfirmed checkouts. */
export function getReservedStock(product: Pick<Product, 'reservedStock'>): number {
  return Math.max(0, Math.trunc(Number(product.reservedStock) || 0))
}

/** Units available for a new customer to buy right now (`stock - reservedStock`). */
export function getSellableStock(product: Pick<Product, 'stock' | 'reservedStock'>): number {
  const physical = Math.max(0, Math.trunc(Number(product.stock) || 0))
  return Math.max(0, physical - getReservedStock(product))
}

/** True when physical stock exists (`> 0`), but every unit is currently locked in checkouts. */
export function isAllStockReserved(product: Pick<Product, 'stock' | 'reservedStock'>): boolean {
  const physical = Math.max(0, Math.trunc(Number(product.stock) || 0))
  return physical > 0 && getSellableStock(product) <= 0
}
