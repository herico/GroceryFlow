import { watch, type Ref } from 'vue'
import type { StorageDriver } from './storage'
import { storage } from './storage'

/**
 * Generic collection repository backed by a StorageDriver. This is the seam a
 * future backend (REST / tRPC) plugs into: replace the driver or provide an
 * async repository with the same shape without touching the stores.
 */
export class CollectionRepository<T> {
  private readonly key: string
  private readonly driver: StorageDriver

  constructor(key: string, driver: StorageDriver = storage) {
    this.key = key
    this.driver = driver
  }

  all(): T[] {
    return this.driver.read<T[]>(this.key) ?? []
  }

  saveAll(items: T[]): boolean {
    return this.driver.write(this.key, items)
  }

  clear(): void {
    this.driver.remove(this.key)
  }
}

/**
 * Persists a reactive source whenever it changes, but debounced so rapid edits
 * (typing, dragging) don't re-serialize the whole collection on every tick.
 * A trailing flush on page hide guarantees the last change is never lost.
 */
export function persistDebounced<T>(
  source: Ref<T>,
  save: (value: T) => void,
  wait = 250,
) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending = false

  const flush = () => {
    if (!pending) return
    clearTimeout(timer)
    pending = false
    save(source.value)
  }

  watch(
    source,
    () => {
      pending = true
      clearTimeout(timer)
      timer = setTimeout(flush, wait)
    },
    { deep: true },
  )

  if (typeof window !== 'undefined') {
    // `pagehide` fires reliably on mobile tab switches/close where `unload` does not.
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush()
    })
  }

  return { flush }
}
