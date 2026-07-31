import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useItemsStore } from './items'
import { useFavoritesStore } from './favorites'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('items store', () => {
  it('merges duplicate names into one row and sums quantities', () => {
    const items = useItemsStore()
    const first = items.addItem('L1', { name: 'Milk', quantity: 1 })
    expect(first.merged).toBe(false)

    const second = items.addItem('L1', { name: 'milk', quantity: 2 })
    expect(second.merged).toBe(true)
    expect(second.item.id).toBe(first.item.id)
    expect(second.item.quantity).toBe(3)
    expect(items.itemsForList('L1')).toHaveLength(1)
  })

  it('does not merge into a checked item', () => {
    const items = useItemsStore()
    const first = items.addItem('L1', { name: 'Milk' })
    items.toggleChecked(first.item.id)
    const second = items.addItem('L1', { name: 'Milk' })
    expect(second.merged).toBe(false)
    expect(items.itemsForList('L1')).toHaveLength(2)
  })

  it('sanitizes NaN prices to undefined', () => {
    const items = useItemsStore()
    const { item } = items.addItem('L1', { name: 'Bread', estimatedPrice: Number.NaN })
    expect(item.estimatedPrice).toBeUndefined()
  })

  it('computes per-list stats', () => {
    const items = useItemsStore()
    items.addItem('L1', { name: 'A', quantity: 2, estimatedPrice: 1.5 })
    const b = items.addItem('L1', { name: 'B', quantity: 1, estimatedPrice: 2 })
    items.toggleChecked(b.item.id)

    const s = items.stats('L1')
    expect(s.total).toBe(2)
    expect(s.checked).toBe(1)
    expect(s.progress).toBe(50)
    expect(s.estimatedTotal).toBeCloseTo(5)
    expect(s.picked).toBeCloseTo(2)
    expect(s.remainingCost).toBeCloseTo(3)
  })

  it('reassigns items when a category is removed', () => {
    const items = useItemsStore()
    const { item } = items.addItem('L1', { name: 'Thing', categoryId: 'custom1' })
    items.reassignCategory('custom1', 'others')
    expect(items.getItem(item.id)?.categoryId).toBe('others')
  })

  it('supports bulk mark-picked, recategorize, delete and restore', () => {
    const items = useItemsStore()
    const a = items.addItem('L1', { name: 'A' }).item
    const b = items.addItem('L1', { name: 'B' }).item
    items.addItem('L1', { name: 'C' })

    items.setCheckedMany([a.id, b.id], true)
    expect(items.getItem(a.id)?.checked).toBe(true)
    expect(items.getItem(b.id)?.checked).toBe(true)

    items.setCategoryMany([a.id, b.id], 'dairy')
    expect(items.getItem(a.id)?.categoryId).toBe('dairy')

    const snapshots = items.removeItemsWithSnapshot([a.id, b.id])
    expect(snapshots).toHaveLength(2)
    expect(items.itemsForList('L1')).toHaveLength(1)

    items.restoreItems(snapshots)
    expect(items.itemsForList('L1')).toHaveLength(3)
    // restore is idempotent
    items.restoreItems(snapshots)
    expect(items.itemsForList('L1')).toHaveLength(3)
  })
})

describe('favorites counting', () => {
  it('increments count only when added, not when edited', () => {
    const items = useItemsStore()
    const favorites = useFavoritesStore()

    const { item } = items.addItem('L1', { name: 'Eggs', favorite: true })
    expect(favorites.findByName('Eggs')?.count).toBe(1)

    // Simulate saving an edit of the favorited item (no re-count).
    favorites.registerFromItem(item)
    favorites.registerFromItem(item)
    expect(favorites.findByName('Eggs')?.count).toBe(1)

    // Adding it again to a list does count.
    items.addItem('L2', { name: 'Eggs', favorite: true })
    expect(favorites.findByName('Eggs')?.count).toBe(2)
  })
})
