import type { Pinia } from 'pinia'
import { readonly, ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'

interface BeforeInstallPromptChoice {
  outcome: 'accepted' | 'dismissed'
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<BeforeInstallPromptChoice>
}

type InstallPromptResult = 'accepted' | 'dismissed' | 'unavailable'

const sheetOpen = ref(false)
const helpAvailable = ref(false)
const canInstallNatively = ref(false)
const showIosInstructions = ref(false)

let deferredPrompt: BeforeInstallPromptEvent | null = null
let settingsStore: ReturnType<typeof useSettingsStore> | null = null
let initialized = false
let hasAutoOpened = false

function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false
  const mediaStandalone =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone =
    typeof navigator !== 'undefined' &&
    'standalone' in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  return mediaStandalone || iosStandalone
}

function isIosFamily(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const classic = /iphone|ipad|ipod/i.test(ua)
  const ipadOsLike = /macintosh/i.test(ua) && navigator.maxTouchPoints > 1
  return classic || ipadOsLike
}

function isLikelyPhoneOrTablet(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false
  const ua = navigator.userAgent
  if (/android|iphone|ipad|ipod|mobile/i.test(ua)) return true
  const coarse =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches
  const narrow =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(max-width: 1024px)').matches
  return coarse && narrow
}

function updateSupportState() {
  const installed = isStandaloneMode()
  const mobile = isLikelyPhoneOrTablet()
  showIosInstructions.value = isIosFamily() && !installed
  canInstallNatively.value = !installed && deferredPrompt != null
  helpAvailable.value = mobile && !installed
  if (installed) sheetOpen.value = false
}

function markPromptDismissed() {
  if (!settingsStore) return
  if (!settingsStore.settings.installPromptDismissed) {
    settingsStore.setInstallPromptDismissed(true)
  }
}

function maybeAutoOpen() {
  if (hasAutoOpened) return
  if (!settingsStore || settingsStore.settings.installPromptDismissed) return
  updateSupportState()
  if (!helpAvailable.value) return
  hasAutoOpened = true
  sheetOpen.value = true
}

function onBeforeInstallPrompt(event: Event) {
  const installEvent = event as BeforeInstallPromptEvent
  installEvent.preventDefault()
  deferredPrompt = installEvent
  updateSupportState()
  maybeAutoOpen()
}

function onAppInstalled() {
  deferredPrompt = null
  sheetOpen.value = false
  markPromptDismissed()
  updateSupportState()
}

export function initInstallPrompt(pinia: Pinia) {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  settingsStore = useSettingsStore(pinia)

  updateSupportState()
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener)
  window.addEventListener('appinstalled', onAppInstalled)

  // Delay the first educational nudge so it never competes with first paint.
  window.setTimeout(() => {
    maybeAutoOpen()
  }, 900)
}

export function useInstallPrompt() {
  async function requestInstall(): Promise<InstallPromptResult> {
    if (!deferredPrompt) return 'unavailable'

    const prompt = deferredPrompt
    deferredPrompt = null
    updateSupportState()

    try {
      await prompt.prompt()
      const result = await prompt.userChoice
      sheetOpen.value = false
      markPromptDismissed()
      updateSupportState()
      return result.outcome === 'accepted' ? 'accepted' : 'dismissed'
    } catch {
      sheetOpen.value = false
      markPromptDismissed()
      updateSupportState()
      return 'dismissed'
    }
  }

  function openSheet() {
    updateSupportState()
    if (!helpAvailable.value) return false
    sheetOpen.value = true
    return true
  }

  function dismissSheet() {
    sheetOpen.value = false
    hasAutoOpened = true
    markPromptDismissed()
  }

  return {
    open: readonly(sheetOpen),
    helpAvailable: readonly(helpAvailable),
    canInstallNatively: readonly(canInstallNatively),
    showIosInstructions: readonly(showIosInstructions),
    requestInstall,
    openSheet,
    dismissSheet,
  }
}
