import { createI18n } from 'vue-i18n'
import en from './en'
import es from './es'
import fr from './fr'
import { storage } from '@/services/storage'
import type { Settings } from '@/types'

export const SUPPORTED_LOCALES = ['en', 'es', 'fr'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: AppLocale = 'en'

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
}

function isSupported(value: string | undefined | null): value is AppLocale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

function detectInitialLocale(): AppLocale {
  const stored = storage.read<Settings>('settings')
  if (isSupported(stored?.locale)) return stored!.locale as AppLocale

  const nav = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : ''
  if (isSupported(nav)) return nav

  return DEFAULT_LOCALE
}

export const i18n = createI18n({
  legacy: false,
  locale: detectInitialLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: { en, es, fr },
})

export function setLocale(locale: AppLocale) {
  i18n.global.locale.value = locale
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }
}
