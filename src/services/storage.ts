/**
 * Storage abstraction. The rest of the app depends on this interface, not on
 * localStorage / IndexedDB / a REST API directly. Swapping the implementation
 * (e.g. for a backend-backed repository) requires no changes to the Pinia stores.
 */
export interface StorageDriver {
  read<T>(key: string): T | null
  /** Returns true on success, false if the value could not be persisted. */
  write<T>(key: string, value: T): boolean
  remove(key: string): void
}

export interface StorageErrorInfo {
  key: string
  error: unknown
}

type StorageErrorListener = (info: StorageErrorInfo) => void

const errorListeners = new Set<StorageErrorListener>()

/** Subscribe to persistence failures (e.g. quota exceeded). Returns an unsubscribe fn. */
export function onStorageError(listener: StorageErrorListener): () => void {
  errorListeners.add(listener)
  return () => errorListeners.delete(listener)
}

function emitStorageError(info: StorageErrorInfo) {
  errorListeners.forEach((listener) => listener(info))
}

export class LocalStorageDriver implements StorageDriver {
  private readonly namespace: string

  constructor(namespace = 'groceryflow') {
    this.namespace = namespace
  }

  private scoped(key: string) {
    return `${this.namespace}:${key}`
  }

  read<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(this.scoped(key))
      return raw ? (JSON.parse(raw) as T) : null
    } catch {
      return null
    }
  }

  write<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(this.scoped(key), JSON.stringify(value))
      return true
    } catch (error) {
      // Quota exceeded or serialization failure — tell the app so it can warn
      // the user instead of silently dropping their data.
      emitStorageError({ key, error })
      return false
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.scoped(key))
  }
}

export const storage: StorageDriver = new LocalStorageDriver()
