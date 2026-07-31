import type { Category } from '@/types'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'vegetables', name: 'Vegetables', emoji: '🥦', color: '#22c55e', builtIn: true },
  { id: 'fruits', name: 'Fruits', emoji: '🍎', color: '#ef4444', builtIn: true },
  { id: 'meat', name: 'Meat', emoji: '🥩', color: '#f43f5e', builtIn: true },
  { id: 'fish', name: 'Fish', emoji: '🐟', color: '#0ea5e9', builtIn: true },
  { id: 'dairy', name: 'Dairy', emoji: '🥛', color: '#60a5fa', builtIn: true },
  { id: 'bakery', name: 'Bakery', emoji: '🍞', color: '#d97706', builtIn: true },
  { id: 'pasta', name: 'Pasta', emoji: '🍝', color: '#f59e0b', builtIn: true },
  { id: 'pantry', name: 'Pantry', emoji: '🥫', color: '#a16207', builtIn: true },
  { id: 'drinks', name: 'Drinks', emoji: '🥤', color: '#8b5cf6', builtIn: true },
  { id: 'frozen', name: 'Frozen', emoji: '🧊', color: '#38bdf8', builtIn: true },
  { id: 'cleaning', name: 'Cleaning', emoji: '🧼', color: '#14b8a6', builtIn: true },
  { id: 'household', name: 'Household', emoji: '🧻', color: '#94a3b8', builtIn: true },
  { id: 'pharmacy', name: 'Pharmacy', emoji: '💊', color: '#ec4899', builtIn: true },
  { id: 'pets', name: 'Pets', emoji: '🐶', color: '#a3763d', builtIn: true },
  { id: 'others', name: 'Others', emoji: '🛒', color: '#9ca3af', builtIn: true },
]

export const OTHERS_CATEGORY_ID = 'others'
