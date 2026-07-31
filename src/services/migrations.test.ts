import { describe, expect, it } from 'vitest'
import type { StorageDriver } from './storage'
import { SCHEMA_VERSION, getStoredVersion, runMigrations } from './migrations'

class MemDriver implements StorageDriver {
  store = new Map<string, string>()
  read<T>(key: string): T | null {
    const v = this.store.get(key)
    return v ? (JSON.parse(v) as T) : null
  }
  write<T>(key: string, value: T): boolean {
    this.store.set(key, JSON.stringify(value))
    return true
  }
  remove(key: string): void {
    this.store.delete(key)
  }
}

describe('migrations', () => {
  it('treats a fresh install as already current', () => {
    const driver = new MemDriver()
    expect(getStoredVersion(driver)).toBe(SCHEMA_VERSION)
    expect(runMigrations(driver)).toBe(SCHEMA_VERSION)
    expect(driver.read('schemaVersion')).toBe(SCHEMA_VERSION)
  })

  it('treats unversioned existing data as legacy v1 then stamps the current version', () => {
    const driver = new MemDriver()
    driver.write('items', [{ id: 'x' }])
    expect(getStoredVersion(driver)).toBe(1)
    runMigrations(driver)
    expect(driver.read('schemaVersion')).toBe(SCHEMA_VERSION)
  })

  it('is idempotent', () => {
    const driver = new MemDriver()
    driver.write('lists', [{ id: 'l' }])
    runMigrations(driver)
    runMigrations(driver)
    expect(driver.read('schemaVersion')).toBe(SCHEMA_VERSION)
  })
})
