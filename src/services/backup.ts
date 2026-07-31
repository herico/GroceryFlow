import { storage } from './storage'
import { SCHEMA_VERSION } from './migrations'

const KEYS = ['lists', 'items', 'categories', 'favorites', 'settings'] as const

export interface Backup {
  app: 'groceryflow'
  version: number
  exportedAt: string
  data: Record<string, unknown>
}

/** Snapshot every persisted collection into a portable object. */
export function createBackup(): Backup {
  const data: Record<string, unknown> = {}
  for (const key of KEYS) {
    const value = storage.read<unknown>(key)
    if (value != null) data[key] = value
  }
  return {
    app: 'groceryflow',
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  }
}

/** Trigger a file download of the current backup. */
export function downloadBackup() {
  const backup = createBackup()
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `groceryflow-backup-${stamp}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Parse + validate a backup file's text. Returns null when it isn't ours. */
export function parseBackup(text: string): Backup | null {
  try {
    const parsed = JSON.parse(text) as Backup
    if (parsed && parsed.app === 'groceryflow' && parsed.data && typeof parsed.data === 'object') {
      return parsed
    }
  } catch {
    /* fall through */
  }
  return null
}

/**
 * Replace all stored collections with the backup's contents. Records the backup's
 * schema version so migrations run on reload, then reloads so every store
 * re-hydrates from the imported data.
 */
export function restoreBackup(backup: Backup) {
  for (const key of KEYS) {
    if (key in backup.data) storage.write(key, backup.data[key])
  }
  // Stamp the imported schema version so startup migrations bring it current.
  storage.write('schemaVersion', backup.version ?? 1)
  if (typeof window !== 'undefined') window.location.reload()
}
