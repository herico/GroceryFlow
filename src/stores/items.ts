import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { GroceryItem } from '@/types'
import { CollectionRepository, persistDebounced } from '@/services/repository'
import { uid, now, sanitizePrice, sanitizeQuantity } from '@/composables/useFormat'
import { useFavoritesStore } from './favorites'

const repo = new CollectionRepository<GroceryItem>('items')

export interface NewItemInput {
  name: string
  quantity?: number
  unit?: string
  categoryId?: string
  estimatedPrice?: number
  notes?: string
  favorite?: boolean
}

export interface ListStats {
  total: number
  checked: number
  remaining: number
  progress: number
  estimatedTotal: number
  picked: number
  remainingCost: number
}

function emptyStats(): ListStats {
  return {
    total: 0,
    checked: 0,
    remaining: 0,
    progress: 0,
    estimatedTotal: 0,
    picked: 0,
    remainingCost: 0,
  }
}

export const useItemsStore = defineStore('items', () => {
  const items = ref<GroceryItem[]>(repo.all())

  persistDebounced(items, (val) => repo.saveAll(val))

  function itemsForList(listId: string): GroceryItem[] {
    return items.value.filter((i) => i.listId === listId)
  }

  function getItem(id: string): GroceryItem | undefined {
    return items.value.find((i) => i.id === id)
  }

  function nextOrder(listId: string): number {
    const list = itemsForList(listId)
    return list.length ? Math.max(...list.map((i) => i.order)) + 1 : 0
  }

  /**
   * Adds an item to a list. If an unchecked item with the same name already
   * exists there, quantities are merged instead of creating a duplicate row.
   * Returns the resulting item and whether a merge happened.
   */
  function addItem(listId: string, input: NewItemInput): { item: GroceryItem; merged: boolean } {
    const name = input.name.trim()
    const quantity = sanitizeQuantity(input.quantity)
    const categoryId = input.categoryId || 'others'
    const estimatedPrice = sanitizePrice(input.estimatedPrice)
    const favorite = input.favorite ?? false
    const favorites = useFavoritesStore()

    const existing = items.value.find(
      (i) => i.listId === listId && !i.checked && i.name.trim().toLowerCase() === name.toLowerCase(),
    )
    if (existing) {
      existing.quantity = sanitizeQuantity(existing.quantity + quantity)
      if (existing.estimatedPrice == null && estimatedPrice != null) {
        existing.estimatedPrice = estimatedPrice
      }
      if (!existing.unit && input.unit?.trim()) existing.unit = input.unit.trim()
      if (favorite) {
        existing.favorite = true
        favorites.registerFromItem(existing, { increment: true })
      }
      return { item: existing, merged: true }
    }

    const item: GroceryItem = {
      id: uid(),
      listId,
      name,
      quantity,
      unit: input.unit?.trim() || undefined,
      categoryId,
      estimatedPrice,
      checked: false,
      favorite,
      notes: input.notes?.trim() || undefined,
      order: nextOrder(listId),
      createdAt: now(),
    }
    items.value.push(item)
    if (favorite) favorites.registerFromItem(item, { increment: true })
    return { item, merged: false }
  }

  function updateItem(id: string, patch: Partial<GroceryItem>) {
    const item = getItem(id)
    if (!item) return
    const next: Partial<GroceryItem> = { ...patch }
    if ('estimatedPrice' in next) next.estimatedPrice = sanitizePrice(next.estimatedPrice)
    if ('quantity' in next) next.quantity = sanitizeQuantity(next.quantity)
    Object.assign(item, next)
  }

  function removeItem(id: string) {
    items.value = items.value.filter((i) => i.id !== id)
  }

  /** Remove an item and return a snapshot so callers can offer undo. */
  function removeItemWithSnapshot(id: string): GroceryItem | undefined {
    const item = getItem(id)
    if (!item) return undefined
    const snapshot = { ...item }
    removeItem(id)
    return snapshot
  }

  function restoreItem(snapshot: GroceryItem) {
    if (getItem(snapshot.id)) return
    items.value.push({ ...snapshot })
  }

  function toggleChecked(id: string) {
    const item = getItem(id)
    if (item) item.checked = !item.checked
  }

  function toggleFavorite(id: string) {
    const item = getItem(id)
    if (!item) return
    item.favorite = !item.favorite
    const favorites = useFavoritesStore()
    if (item.favorite) favorites.registerFromItem(item)
    else favorites.removeByName(item.name)
  }

  function clearChecked(listId: string) {
    items.value = items.value.filter((i) => !(i.listId === listId && i.checked))
  }

  function uncheckAll(listId: string) {
    itemsForList(listId).forEach((i) => (i.checked = false))
  }

  function removeItemsForList(listId: string) {
    items.value = items.value.filter((i) => i.listId !== listId)
  }

  function restoreItemsForList(listId: string, listItems: GroceryItem[]) {
    const existingIds = new Set(items.value.map((item) => item.id))
    listItems.forEach((item) => {
      if (item.listId !== listId || existingIds.has(item.id)) return
      items.value.push({ ...item })
      existingIds.add(item.id)
    })
  }

  function duplicateItemsToList(fromListId: string, toListId: string) {
    const source = itemsForList(fromListId)
    source.forEach((src, index) => {
      items.value.push({
        ...src,
        id: uid(),
        listId: toListId,
        checked: false,
        order: index,
        createdAt: now(),
      })
    })
  }

  /** Persist a manual drag & drop ordering for a list. */
  function reorder(listId: string, orderedIds: string[]) {
    orderedIds.forEach((id, index) => {
      const item = getItem(id)
      if (item && item.listId === listId) item.order = index
    })
  }

  /** Move every item in a category to another (used when a category is deleted). */
  function reassignCategory(fromId: string, toId: string) {
    items.value.forEach((i) => {
      if (i.categoryId === fromId) i.categoryId = toId
    })
  }

  // --- Bulk operations (selection mode) --------------------------------------
  function setCheckedMany(ids: string[], checked: boolean) {
    const set = new Set(ids)
    items.value.forEach((i) => {
      if (set.has(i.id)) i.checked = checked
    })
  }

  function setCategoryMany(ids: string[], categoryId: string) {
    const set = new Set(ids)
    items.value.forEach((i) => {
      if (set.has(i.id)) i.categoryId = categoryId
    })
  }

  /** Remove several items and return snapshots so callers can offer undo. */
  function removeItemsWithSnapshot(ids: string[]): GroceryItem[] {
    const set = new Set(ids)
    const snapshots = items.value.filter((i) => set.has(i.id)).map((i) => ({ ...i }))
    items.value = items.value.filter((i) => !set.has(i.id))
    return snapshots
  }

  function restoreItems(snapshots: GroceryItem[]) {
    const existing = new Set(items.value.map((i) => i.id))
    snapshots.forEach((snapshot) => {
      if (existing.has(snapshot.id)) return
      items.value.push({ ...snapshot })
      existing.add(snapshot.id)
    })
  }

  /** All items across every list (used by global search). */
  const allItems = computed(() => items.value)

  // One pass over all items builds per-list stats, so list cards read O(1)
  // instead of each re-filtering the whole collection.
  const statsByList = computed(() => {
    const map = new Map<string, ListStats>()
    for (const i of items.value) {
      let s = map.get(i.listId)
      if (!s) {
        s = emptyStats()
        map.set(i.listId, s)
      }
      const cost = (i.estimatedPrice ?? 0) * (i.quantity || 1)
      s.total += 1
      s.estimatedTotal += cost
      if (i.checked) {
        s.checked += 1
        s.picked += cost
      }
    }
    for (const s of map.values()) {
      s.remaining = s.total - s.checked
      s.progress = s.total ? Math.round((s.checked / s.total) * 100) : 0
      s.remainingCost = s.estimatedTotal - s.picked
    }
    return map
  })

  function stats(listId: string): ListStats {
    return statsByList.value.get(listId) ?? emptyStats()
  }

  const totalItems = computed(() => items.value.length)

  return {
    items,
    totalItems,
    allItems,
    itemsForList,
    getItem,
    addItem,
    updateItem,
    removeItem,
    removeItemWithSnapshot,
    restoreItem,
    toggleChecked,
    toggleFavorite,
    clearChecked,
    uncheckAll,
    removeItemsForList,
    restoreItemsForList,
    duplicateItemsToList,
    reorder,
    reassignCategory,
    setCheckedMany,
    setCategoryMany,
    removeItemsWithSnapshot,
    restoreItems,
    stats,
  }
})
