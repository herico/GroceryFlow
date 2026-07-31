import { i18n } from '@/i18n'

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function now(): string {
  return new Date().toISOString()
}

export function formatShortDate(date: Date = new Date()): string {
  const locale = i18n.global.locale.value
  try {
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(date)
  } catch {
    return date.toLocaleDateString()
  }
}

export function formatCurrency(value: number, currency = 'EUR'): string {
  const locale = i18n.global.locale.value
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${value.toFixed(2)} ${currency}`
  }
}

export function formatQuantity(quantity: number, unit?: string): string {
  const locale = i18n.global.locale.value
  const formattedQuantity = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(quantity)
  const normalizedUnit = unit?.trim()
  if (!normalizedUnit) return formattedQuantity
  const displayUnit = quantity === 1 ? singularizeUnit(normalizedUnit) : normalizedUnit
  return `${formattedQuantity} ${displayUnit}`
}

/**
 * Best-effort singularization so a quantity of 1 doesn't read "1 botellas".
 * Count nouns in en/es/fr commonly drop a trailing "s" in the singular
 * (bottles→bottle, botellas→botella, bouteilles→bouteille). Measures like
 * "kg"/"ml" have no trailing "s" so they're untouched, and doubled endings
 * such as "glass" are skipped.
 */
export function singularizeUnit(unit: string): string {
  if (unit.length >= 4 && /[^s]s$/i.test(unit)) return unit.slice(0, -1)
  return unit
}

/** Coerces a possibly-NaN price into a valid, non-negative number or undefined. */
export function sanitizePrice(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined
}

/** Coerces a possibly-NaN quantity into a positive number, defaulting to 1. */
export function sanitizeQuantity(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 1
}

/** Fire a short haptic tap on supported devices (no-op elsewhere). */
export function haptic(pattern: number | number[] = 8): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern)
    } catch {
      /* vibration not permitted — ignore */
    }
  }
}
