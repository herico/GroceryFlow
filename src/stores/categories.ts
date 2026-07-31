import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { Category } from '@/types'
import { CollectionRepository } from '@/services/repository'
import { DEFAULT_CATEGORIES, OTHERS_CATEGORY_ID } from '@/services/categories.data'
import { uid } from '@/composables/useFormat'
import { i18n } from '@/i18n'
import { useSettingsStore } from './settings'

const repo = new CollectionRepository<Category>('categories')

export const useCategoriesStore = defineStore('categories', () => {
  const stored = repo.all()
  // Merge built-in defaults with any persisted custom categories.
  const custom = stored.filter((c) => !DEFAULT_CATEGORIES.some((d) => d.id === c.id))
  const source = ref<Category[]>([...DEFAULT_CATEGORIES, ...custom])

  watch(
    source,
    (val) => repo.saveAll(val.filter((c) => !c.builtIn)),
    { deep: true },
  )

  // Built-in category names are localized; custom categories keep their name.
  const categories = computed<Category[]>(() => {
    const { t, locale } = i18n.global
    void locale.value // track locale so names re-resolve on language change
    return source.value.map((c) =>
      c.builtIn ? { ...c, name: t(`categories.${c.id}`) } : c,
    )
  })

  // Categories in the user's custom aisle order (falls back to default order).
  const ordered = computed<Category[]>(() => {
    const settings = useSettingsStore()
    const order = settings.categoryOrder
    if (!order.length) return categories.value
    const rank = new Map(order.map((id, index) => [id, index]))
    return [...categories.value].sort(
      (a, b) =>
        (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER),
    )
  })

  const byId = computed(() => {
    const map = new Map<string, Category>()
    categories.value.forEach((c) => map.set(c.id, c))
    return map
  })

  function get(id: string): Category {
    return byId.value.get(id) ?? byId.value.get(OTHERS_CATEGORY_ID)!
  }

  function addCategory(name: string, emoji = '🛒', color?: string): Category {
    const category: Category = { id: uid(), name: name.trim(), emoji, color }
    source.value.push(category)
    return category
  }

  function updateCategory(id: string, patch: Partial<Category>) {
    const cat = source.value.find((c) => c.id === id)
    if (cat && !cat.builtIn) Object.assign(cat, patch)
  }

  function removeCategory(id: string) {
    const cat = source.value.find((c) => c.id === id)
    if (cat && !cat.builtIn) {
      source.value = source.value.filter((c) => c.id !== id)
    }
  }

  return { categories, ordered, byId, get, addCategory, updateCategory, removeCategory }
})
