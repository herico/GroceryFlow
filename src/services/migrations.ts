import type { StorageDriver } from './storage'
import { storage } from './storage'

/**
 * Persisted-data schema version. Bump this whenever the shape of anything in
 * localStorage changes, and add a matching entry to `migrations` that upgrades
 * data from the previous version to the new one.
 */
export const SCHEMA_VERSION = 1

const VERSION_KEY = 'schemaVersion'
const DATA_KEYS = ['lists', 'items', 'categories', 'favorites', 'settings']

/**
 * Registry of migrations keyed by the version they upgrade **to**. Each runs
 * against the raw `StorageDriver` (stores aren't initialized yet at migration time).
 *
 * Example (future):
 *   2: (driver) => {
 *     const items = driver.read<any[]>('items') ?? []
 *     driver.write('items', items.map((i) => ({ ...i, newField: null })))
 *   },
 */
const migrations: Record<number, (driver: StorageDriver) => void> = {}

function detectInitialVersion(driver: StorageDriver): number {
  // Existing data with no version marker is legacy v1 (the first shipped shape).
  // A fresh install with no data is already at the latest version.
  const hasData = DATA_KEYS.some((key) => driver.read(key) != null)
  return hasData ? 1 : SCHEMA_VERSION
}

export function getStoredVersion(driver: StorageDriver = storage): number {
  const stored = driver.read<number>(VERSION_KEY)
  return typeof stored === 'number' ? stored : detectInitialVersion(driver)
}

/**
 * Upgrade persisted data to the current SCHEMA_VERSION by running each pending
 * migration in order. Safe to call on every startup — it's a no-op once current.
 */
export function runMigrations(driver: StorageDriver = storage): number {
  let current = getStoredVersion(driver)
  for (let version = current + 1; version <= SCHEMA_VERSION; version += 1) {
    migrations[version]?.(driver)
    current = version
  }
  driver.write(VERSION_KEY, SCHEMA_VERSION)
  return SCHEMA_VERSION
}
