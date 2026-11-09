export type PageWidth = 'narrow' | 'default' | 'medium' | 'wide'

/** Shared max-width classes so page header and page body always line up. */
export const PAGE_WIDTH: Record<PageWidth, string> = {
  narrow: 'max-w-2xl',
  default: 'max-w-3xl',
  medium: 'max-w-5xl',
  wide: 'max-w-7xl',
}
