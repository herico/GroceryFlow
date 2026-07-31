import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { FavoriteItem, GroceryItem } from '@/types'
import { CollectionRepository, persistDebounced } from '@/services/repository'
import { uid } from '@/composables/useFormat'

const repo = new CollectionRepository<FavoriteItem>('favorites')

export const useFavoritesStore = defineStore('favorites', () => {
  const favorites = ref<FavoriteItem[]>(repo.all())

  persistDebounced(favorites, (val) => repo.saveAll(val))

  const sorted = computed(() =>
    [...favorites.value].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
  )

  function findByName(name: string): FavoriteItem | undefined {
    const key = name.trim().toLowerCase()
    return favorites.value.find((f) => f.name.toLowerCase() === key)
  }

  /**
   * Upsert a favorite from an item. `increment` bumps the "times added" count and
   * must only be true when the product is actually added to a list — never on a
   * plain edit/save (which previously inflated the count on every keystroke-save).
   */
  function registerFromItem(item: GroceryItem, options: { increment?: boolean } = {}) {
    const existing = findByName(item.name)
    if (existing) {
      if (options.increment) existing.count += 1
      existing.categoryId = item.categoryId
      if (item.unit) existing.unit = item.unit
      if (item.estimatedPrice != null) existing.estimatedPrice = item.estimatedPrice
      return
    }
    favorites.value.push({
      id: uid(),
      name: item.name,
      categoryId: item.categoryId,
      unit: item.unit,
      estimatedPrice: item.estimatedPrice,
      count: 1,
    })
  }

  function removeByName(name: string) {
    const key = name.trim().toLowerCase()
    favorites.value = favorites.value.filter((f) => f.name.toLowerCase() !== key)
  }

  function remove(id: string) {
    favorites.value = favorites.value.filter((f) => f.id !== id)
  }

  function isFavorite(name: string): boolean {
    return !!findByName(name)
  }

  return { favorites, sorted, findByName, registerFromItem, removeByName, remove, isFavorite }
})
