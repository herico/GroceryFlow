import { afterEach, describe, expect, it, vi } from 'vitest'

type Listener = () => void

function setupThemeEnv({
  systemDark,
  legacyOnly = false,
}: {
  systemDark: boolean
  legacyOnly?: boolean
}) {
  const attributes = new Map<string, string>()
  const documentListeners = new Map<string, Listener[]>()
  let visibilityState: 'visible' | 'hidden' = 'visible'
  let mediaChangeListener: Listener | null = null

  const mediaQuery: {
    matches: boolean
    addEventListener?: (event: string, listener: Listener) => void
    addListener?: (listener: Listener) => void
  } = {
    matches: systemDark,
    addListener: vi.fn((listener: Listener) => {
      mediaChangeListener = listener
    }),
  }

  if (!legacyOnly) {
    mediaQuery.addEventListener = vi.fn((event: string, listener: Listener) => {
      if (event === 'change') mediaChangeListener = listener
    })
  }

  const documentStub = {
    documentElement: {
      setAttribute: (name: string, value: string) => {
        attributes.set(name, value)
      },
    },
    addEventListener: vi.fn((event: string, listener: Listener) => {
      documentListeners.set(event, [...(documentListeners.get(event) ?? []), listener])
    }),
    get visibilityState() {
      return visibilityState
    },
  }

  const windowStub = {
    matchMedia: vi.fn(() => mediaQuery),
    addEventListener: vi.fn(),
  }

  ;(globalThis as { window: unknown }).window = windowStub
  ;(globalThis as { document: unknown }).document = documentStub

  return {
    mediaQuery,
    getMode: () => attributes.get('data-mode'),
    setSystemDark(next: boolean) {
      mediaQuery.matches = next
    },
    emitSystemChange() {
      mediaChangeListener?.()
    },
    setVisibility(next: 'visible' | 'hidden') {
      visibilityState = next
    },
    emitVisibilityChange() {
      documentListeners.get('visibilitychange')?.forEach((listener) => listener())
    },
  }
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'window')
  Reflect.deleteProperty(globalThis, 'document')
  vi.restoreAllMocks()
  vi.resetModules()
})

describe('theme mode resolution', () => {
  it('maps explicit modes without inversion', async () => {
    const env = setupThemeEnv({ systemDark: false })
    const theme = await import('./theme')

    theme.applyMode('light')
    expect(env.getMode()).toBe('light')

    theme.applyMode('dark')
    expect(env.getMode()).toBe('dark')
  })

  it('resolves system mode from the current OS preference', async () => {
    const env = setupThemeEnv({ systemDark: false })
    const theme = await import('./theme')

    theme.applyMode('system')
    expect(env.getMode()).toBe('light')

    env.setSystemDark(true)
    theme.applyMode('system')
    expect(env.getMode()).toBe('dark')
  })

  it('syncs system mode changes with legacy matchMedia listeners', async () => {
    const env = setupThemeEnv({ systemDark: false, legacyOnly: true })
    const theme = await import('./theme')

    theme.initTheme()
    expect(env.getMode()).toBe('light')
    expect(env.mediaQuery.addListener!).toHaveBeenCalledTimes(1)

    env.setSystemDark(true)
    env.emitSystemChange()
    expect(env.getMode()).toBe('dark')
  })

  it('re-syncs system mode when the app becomes visible again', async () => {
    const env = setupThemeEnv({ systemDark: true })
    const theme = await import('./theme')

    theme.initTheme()
    expect(env.getMode()).toBe('dark')

    env.setSystemDark(false)
    env.setVisibility('hidden')
    env.emitVisibilityChange()
    expect(env.getMode()).toBe('dark')

    env.setVisibility('visible')
    env.emitVisibilityChange()
    expect(env.getMode()).toBe('light')
  })
})
