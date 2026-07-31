import type { AppTheme, AppThemeMode, Settings } from '@/types'
import { storage } from '@/services/storage'

export const THEMES: AppTheme[] = ['emerald', 'blue', 'violet', 'rose']
export const DEFAULT_THEME: AppTheme = 'emerald'

export const THEME_MODES: AppThemeMode[] = ['system', 'light', 'dark']
export const DEFAULT_THEME_MODE: AppThemeMode = 'system'

/** Representative swatch color (primary-500) for each theme, used by the picker. */
export const THEME_SWATCHES: Record<AppTheme, string> = {
  emerald: '#10b981',
  blue: '#3b82f6',
  violet: '#8b5cf6',
  rose: '#f43f5e',
}

export function isSupportedTheme(value: string | undefined | null): value is AppTheme {
  return !!value && (THEMES as readonly string[]).includes(value)
}

export function isSupportedMode(value: string | undefined | null): value is AppThemeMode {
  return !!value && (THEME_MODES as readonly string[]).includes(value)
}

/** Selects the active primary-color palette via a `data-theme` attribute on <html>. */
export function applyTheme(theme: AppTheme) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)'

type LegacyMediaQueryList = MediaQueryList & {
  addListener?: (listener: (this: MediaQueryList, event: MediaQueryListEvent) => void) => void
}

function getSystemMediaQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null
  return window.matchMedia(SYSTEM_DARK_QUERY)
}

function prefersDark(): boolean {
  return getSystemMediaQuery()?.matches ?? false
}

/** Resolves `system` to the concrete light/dark value and sets `data-mode`. */
export function applyMode(mode: AppThemeMode) {
  if (typeof document === 'undefined') return
  const dark = mode === 'dark' || (mode === 'system' && prefersDark())
  document.documentElement.setAttribute('data-mode', dark ? 'dark' : 'light')
}

let currentMode: AppThemeMode = DEFAULT_THEME_MODE
let systemListenerBound = false

/** Keeps the resolved mode in sync with the OS while the user is on `system`. */
function bindSystemListener() {
  if (systemListenerBound || typeof window === 'undefined') return
  const mediaQuery = getSystemMediaQuery()
  if (!mediaQuery) return

  const syncSystemMode = () => {
    if (currentMode === 'system') applyMode('system')
  }

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', syncSystemMode)
  } else {
    ;(mediaQuery as LegacyMediaQueryList).addListener?.(syncSystemMode)
  }
  window.addEventListener('pageshow', syncSystemMode)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') syncSystemMode()
    })
  }

  systemListenerBound = true
}

export function setMode(mode: AppThemeMode) {
  currentMode = mode
  applyMode(mode)
}

/** Applies the persisted theme + mode as early as possible to avoid a color flash on load. */
export function initTheme() {
  const stored = storage.read<Settings>('settings')
  applyTheme(isSupportedTheme(stored?.theme) ? stored!.theme : DEFAULT_THEME)
  currentMode = isSupportedMode(stored?.mode) ? stored!.mode : DEFAULT_THEME_MODE
  applyMode(currentMode)
  bindSystemListener()
}
