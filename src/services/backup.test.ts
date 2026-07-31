import { describe, expect, it } from 'vitest'
import { parseBackup, type Backup } from './backup'

describe('parseBackup', () => {
  it('accepts a valid GroceryFlow backup', () => {
    const backup: Backup = {
      app: 'groceryflow',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: { lists: [], items: [] },
    }
    const parsed = parseBackup(JSON.stringify(backup))
    expect(parsed).not.toBeNull()
    expect(parsed?.data).toHaveProperty('lists')
  })

  it('rejects unrelated or malformed JSON', () => {
    expect(parseBackup('{"app":"other","data":{}}')).toBeNull()
    expect(parseBackup('not json')).toBeNull()
    expect(parseBackup('{"app":"groceryflow"}')).toBeNull()
  })
})
