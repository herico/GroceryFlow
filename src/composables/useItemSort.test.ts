import { describe, expect, it } from 'vitest'
import type { GroceryItem } from '@/types'
import { sortItems } from './useItemSort'

function item(partial: Partial<GroceryItem>): GroceryItem {
  return {
    id: partial.id ?? 'x',
    listId: 'L1',
    name: partial.name ?? 'Item',
    quantity: 1,
    categoryId: 'others',
    checked: false,
    favorite: false,
    order: partial.order ?? 0,
    createdAt: partial.createdAt ?? '2020-01-01T00:00:00.000Z',
    ...partial,
  }
}

describe('sortItems', () => {
  const a = item({ id: 'a', name: 'Banana', order: 2, createdAt: '2020-01-03T00:00:00Z' })
  const b = item({ id: 'b', name: 'Apple', order: 0, createdAt: '2020-01-01T00:00:00Z' })
  const c = item({ id: 'c', name: 'Cherry', order: 1, createdAt: '2020-01-02T00:00:00Z' })

  it('sorts alphabetically', () => {
    expect(sortItems([a, b, c], 'alphabetical').map((i) => i.id)).toEqual(['b', 'a', 'c'])
  })

  it('sorts by added (createdAt)', () => {
    expect(sortItems([a, b, c], 'added').map((i) => i.id)).toEqual(['b', 'c', 'a'])
  })

  it('sorts by manual order', () => {
    expect(sortItems([a, b, c], 'manual').map((i) => i.id)).toEqual(['b', 'c', 'a'])
  })

  it('does not mutate the input array', () => {
    const input = [a, b, c]
    sortItems(input, 'alphabetical')
    expect(input.map((i) => i.id)).toEqual(['a', 'b', 'c'])
  })
})
