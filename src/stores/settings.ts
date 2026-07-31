import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { AppLocale, AppTheme, AppThemeMode, Settings, SortMode } from '@/types'
import { storage } from '@/services/storage'
import { DEFAULT_LOCALE, setLocale as applyLocale } from '@/i18n'
import { DEFAULT_THEME, DEFAULT_THEME_MODE, applyTheme, setMode as applyMode } from '@/services/theme'

const KEY = 'settings'

const defaults: Settings = {
  sortMode: 'category',
  currency: 'EUR',
  weeklyBudget: undefined,
  locale: DEFAULT_LOCALE,
  theme: DEFAULT_THEME,
  mode: DEFAULT_THEME_MODE,
  categoryOrder: [],
  installPromptDismissed: false,
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>({ ...defaults, ...(storage.read<Settings>(KEY) ?? {}) })

  // Keep the active i18n locale in sync with the persisted preference.
  applyLocale(settings.value.locale)
  // Keep the active color theme + light/dark mode in sync with the preference.
  applyTheme(settings.value.theme)
  applyMode(settings.value.mode)

  watch(settings, (val) => storage.write(KEY, val), { deep: true })

  const categoryOrder = computed(() => settings.value.categoryOrder)

  function setSortMode(mode: SortMode) {
    settings.value.sortMode = mode
  }

  function setWeeklyBudget(value?: number) {
    settings.value.weeklyBudget = value != null && Number.isFinite(value) && value > 0 ? value : undefined
  }

  function setCurrency(currency: string) {
    settings.value.currency = currency
  }

  function setLocale(locale: AppLocale) {
    settings.value.locale = locale
    applyLocale(locale)
  }

  function setTheme(theme: AppTheme) {
    settings.value.theme = theme
    applyTheme(theme)
  }

  function setMode(mode: AppThemeMode) {
    settings.value.mode = mode
    applyMode(mode)
  }

  function setCategoryOrder(order: string[]) {
    settings.value.categoryOrder = [...order]
  }

  function setInstallPromptDismissed(value: boolean) {
    settings.value.installPromptDismissed = value
  }

  /** Replace the whole settings object (used by data import). */
  function replaceAll(next: Partial<Settings>) {
    settings.value = { ...defaults, ...next }
    applyLocale(settings.value.locale)
    applyTheme(settings.value.theme)
    applyMode(settings.value.mode)
  }

  return {
    settings,
    categoryOrder,
    setSortMode,
    setWeeklyBudget,
    setCurrency,
    setLocale,
    setTheme,
    setMode,
    setCategoryOrder,
    setInstallPromptDismissed,
    replaceAll,
  }
})
