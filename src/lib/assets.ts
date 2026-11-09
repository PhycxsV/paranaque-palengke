/** Resolve a file in /public, respecting the Vite base path (GitHub Pages sub-path). */
export function asset(file: string): string {
  return `${import.meta.env.BASE_URL}${file}`
}

/** Official marks supplied for the system. File names are case-sensitive on GitHub Pages. */
export const LOGOS = {
  citySeal: asset('CityLogo.png'),
  bagongParanaque: asset('mo.png'),
  megaCity: asset('MEGA.png'),
  helpCard: asset('Helpcard.png'),
} as const
