declare global {
  interface Window {
    google?: typeof google
    __palengkeMapsLoader?: Promise<typeof google>
    __palengkeMapsCallback?: () => void
  }
}

export function getGoogleMapsApiKey(): string {
  return (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() ?? ''
}

export function isGoogleMapsConfigured(): boolean {
  return Boolean(getGoogleMapsApiKey())
}

async function ensurePlaces(g: typeof google): Promise<typeof google> {
  if (g.maps.places?.Autocomplete) return g
  if (typeof g.maps.importLibrary === 'function') {
    await g.maps.importLibrary('places')
  }
  if (!g.maps.places?.Autocomplete) {
    throw new Error(
      'Places library is unavailable. Enable Places API for this key, then hard-refresh.',
    )
  }
  return g
}

/** Loads Maps JS (with Places) once. */
export function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only load in the browser.'))
  }
  if (window.google?.maps?.places?.Autocomplete) {
    return Promise.resolve(window.google)
  }
  if (window.google?.maps) {
    return ensurePlaces(window.google)
  }

  if (window.__palengkeMapsLoader) return window.__palengkeMapsLoader

  const key = getGoogleMapsApiKey()
  if (!key) {
    return Promise.reject(
      new Error('Set VITE_GOOGLE_MAPS_API_KEY in .env.local, then restart the dev server.'),
    )
  }

  window.__palengkeMapsLoader = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-palengke-google-maps]',
    )
    if (existing) {
      existing.addEventListener('load', () => {
        if (!window.google?.maps) {
          reject(new Error('Google Maps failed to initialize.'))
          return
        }
        void ensurePlaces(window.google).then(resolve).catch(reject)
      })
      existing.addEventListener('error', () =>
        reject(new Error('Failed to load the Google Maps script.')),
      )
      return
    }

    const callbackName = '__palengkeMapsCallback'
    window[callbackName] = () => {
      delete window[callbackName]
      if (!window.google?.maps) {
        reject(new Error('Google Maps failed to initialize.'))
        return
      }
      void ensurePlaces(window.google).then(resolve).catch(reject)
    }

    const script = document.createElement('script')
    script.dataset.palengkeGoogleMaps = 'true'
    script.async = true
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&libraries=places&loading=async&callback=${callbackName}`
    script.onerror = () => {
      delete window[callbackName]
      reject(new Error('Failed to load the Google Maps script.'))
    }
    document.head.appendChild(script)
  })

  return window.__palengkeMapsLoader
}
