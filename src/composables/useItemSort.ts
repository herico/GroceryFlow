import type { GroceryItem, SortMode } from '@/types'
import { useCategoriesStore } from '@/stores/categories'

/** Orders items within a single list/group according to the active sort mode. */
function compareByMode(mode: SortMode) {
  return (a: GroceryItem, b: GroceryItem): number => {
    switch (mode) {
      case 'added':
        return a.createdAt.localeCompare(b.createdAt)
      case 'manual':
        return a.order - b.order
      case 'alphabetical':
      case 'category':
      default:
        return a.name.localeCompare(b.name)
    }
  }
}

export function sortItems(items: GroceryItem[], mode: SortMode): GroceryItem[] {
  return [...items].sort(compareByMode(mode))
}

export function filterItems(items: GroceryItem[], query: string): GroceryItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return items
  const categories = useCategoriesStore()
  return items.filter((i) => {
    const cat = categories.get(i.categoryId)
    return i.name.toLowerCase().includes(q) || cat.name.toLowerCase().includes(q)
  })
}

export interface CategoryGroup {
  categoryId: string
  emoji: string
  name: string
  items: GroceryItem[]
}

/**
 * Group items by category, ordering the groups by the user's custom aisle order
 * (falling back to the default) and ordering items inside each group by the
 * active sort mode.
 */
export function groupByCategory(
  items: GroceryItem[],
  mode: SortMode = 'alphabetical',
): CategoryGroup[] {
  const categories = useCategoriesStore()
  const order = categories.ordered.map((c) => c.id)
  const groups = new Map<string, GroceryItem[]>()
  items.forEach((i) => {
    const arr = groups.get(i.categoryId) ?? []
    arr.push(i)
    groups.set(i.categoryId, arr)
  })
  const withinGroup = compareByMode(mode)
  return [...groups.entries()]
    .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
    .map(([categoryId, groupItems]) => {
      const cat = categories.get(categoryId)
      return {
        categoryId,
        emoji: cat.emoji,
        name: cat.name,
        items: [...groupItems].sort(withinGroup),
      }
    })
}
