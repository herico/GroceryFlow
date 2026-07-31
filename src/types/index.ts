export interface ShoppingList {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  archived: boolean
}

export interface GroceryItem {
  id: string
  listId: string
  name: string
  quantity: number
  unit?: string
  categoryId: string
  estimatedPrice?: number
  checked: boolean
  favorite: boolean
  notes?: string
  /** manual sort position within the list */
  order: number
  createdAt: string
}

export interface Category {
  id: string
  name: string
  emoji: string
  color?: string
  /** built-in categories cannot be deleted */
  builtIn?: boolean
}

export interface FavoriteItem {
  id: string
  name: string
  categoryId: string
  unit?: string
  estimatedPrice?: number
  /** how many times this product has been added */
  count: number
}

export type SortMode = 'category' | 'added' | 'alphabetical' | 'manual'

export type AppLocale = 'en' | 'es' | 'fr'

export type AppTheme = 'emerald' | 'blue' | 'violet' | 'rose'

/** Light/dark appearance. `system` follows the OS setting. */
export type AppThemeMode = 'system' | 'light' | 'dark'

export interface Settings {
  sortMode: SortMode
  weeklyBudget?: number
  currency: string
  locale: AppLocale
  theme: AppTheme
  mode: AppThemeMode
  /** Custom category display order (category ids). Empty = default order. */
  categoryOrder: string[]
  /** User dismissed the install education prompt and should not be auto-reminded. */
  installPromptDismissed: boolean
}
