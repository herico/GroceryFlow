import { onScopeDispose, ref } from 'vue'

/**
 * Keeps the screen awake (Screen Wake Lock API) while shopping, re-acquiring the
 * lock when the tab becomes visible again. No-ops on unsupported browsers.
 */
export function useWakeLock() {
  const supported =
    typeof navigator !== 'undefined' && 'wakeLock' in navigator
  const active = ref(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sentinel: any = null

  async function enable() {
    if (!supported) return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sentinel = await (navigator as any).wakeLock.request('screen')
      active.value = true
      sentinel.addEventListener?.('release', () => {
        active.value = false
        sentinel = null
      })
    } catch {
      active.value = false
    }
  }

  async function disable() {
    try {
      await sentinel?.release?.()
    } catch {
      /* ignore */
    }
    sentinel = null
    active.value = false
  }

  async function toggle() {
    if (active.value) await disable()
    else await enable()
  }

  function onVisibility() {
    if (document.visibilityState === 'visible' && active.value && !sentinel) {
      enable()
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibility)
  }

  onScopeDispose(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibility)
    }
    disable()
  })

  return { supported, active, enable, disable, toggle }
}
