<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { GroceryItem } from '@/types'
import { useCategoriesStore } from '@/stores/categories'
import { useFavoritesStore } from '@/stores/favorites'
import { useSettingsStore } from '@/stores/settings'
import { OTHERS_CATEGORY_ID } from '@/services/categories.data'
import { guessCategoryId } from '@/services/categoryKeywords.data'
import BaseButton from '@/components/ui/BaseButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

export interface ItemFormValue {
  name: string
  quantity: number
  unit: string
  categoryId: string
  estimatedPrice: number | null
  notes: string
  favorite: boolean
}

const props = defineProps<{ item?: GroceryItem; initialName?: string; initialCategoryId?: string }>()
const emit = defineEmits<{ submit: [value: ItemFormValue]; cancel: [] }>()

const { t } = useI18n()
const categories = useCategoriesStore()
const favorites = useFavoritesStore()
const settings = useSettingsStore()

const form = reactive<ItemFormValue>({
  name: '',
  quantity: 1,
  unit: '',
  categoryId: OTHERS_CATEGORY_ID,
  estimatedPrice: null,
  notes: '',
  favorite: false,
})
const categorySearch = ref('')
const filteredCategories = computed(() => {
  const query = categorySearch.value.trim().toLocaleLowerCase()
  if (!query) return categories.categories
  return categories.categories.filter((category) =>
    category.name.toLocaleLowerCase().includes(query),
  )
})
const PRICE_STEP = 0.1
const canDecreaseQuantity = computed(() => normalizeQuantity(form.quantity) > 1)
const canDecreasePrice = computed(() => normalizePrice(form.estimatedPrice) > 0)

function normalizeQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.max(1, Math.trunc(value))
}

function decreaseQuantity() {
  form.quantity = Math.max(1, normalizeQuantity(form.quantity) - 1)
}

function increaseQuantity() {
  form.quantity = normalizeQuantity(form.quantity) + 1
}

function clampQuantity() {
  form.quantity = normalizeQuantity(form.quantity)
}

function roundPrice(value: number): number {
  return Math.round(value * 100) / 100
}

function normalizePrice(value: number | null): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, roundPrice(numeric))
}

function decreasePrice() {
  form.estimatedPrice = roundPrice(Math.max(0, normalizePrice(form.estimatedPrice) - PRICE_STEP))
}

function increasePrice() {
  form.estimatedPrice = roundPrice(normalizePrice(form.estimatedPrice) + PRICE_STEP)
}

/** Prefill empty price/unit from what we remember about this product. */
function applyMemory(name: string) {
  if (props.item) return
  const fav = favorites.findByName(name)
  if (!fav) return
  if (form.estimatedPrice == null && fav.estimatedPrice != null) form.estimatedPrice = fav.estimatedPrice
  if (!form.unit && fav.unit) form.unit = fav.unit
  if (form.categoryId === OTHERS_CATEGORY_ID) form.categoryId = fav.categoryId
}

function hydrate() {
  if (props.item) {
    form.name = props.item.name
    form.quantity = props.item.quantity
    form.unit = props.item.unit ?? ''
    form.categoryId = props.item.categoryId
    form.estimatedPrice = props.item.estimatedPrice ?? null
    form.notes = props.item.notes ?? ''
    form.favorite = props.item.favorite
  } else {
    form.name = props.initialName ?? ''
    form.quantity = 1
    form.unit = ''
    form.categoryId =
      props.initialCategoryId && props.initialCategoryId !== OTHERS_CATEGORY_ID
        ? props.initialCategoryId
        : guessCategoryId(form.name) ?? props.initialCategoryId ?? OTHERS_CATEGORY_ID
    form.estimatedPrice = null
    form.notes = ''
    form.favorite = false
    applyMemory(form.name)
  }
  categorySearch.value = ''
}
watch(() => [props.item, props.initialName, props.initialCategoryId], hydrate, { immediate: true })
// Fill remembered price/unit as the user types a known product name (new items).
watch(
  () => form.name,
  (name) => applyMemory(name),
)

function submit() {
  if (!form.name.trim()) return
  emit('submit', { ...form })
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="submit">
    <div>
      <label class="mb-1 block text-xs font-medium text-content-muted">{{ t('itemEditor.name') }}</label>
      <input
        v-model="form.name"
        autofocus
        :placeholder="t('itemEditor.namePlaceholder')"
        class="w-full rounded-xl border border-line px-3 py-2.5 text-[15px] outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
      />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="mb-1 block text-xs font-medium text-content-muted">{{ t('itemEditor.quantity') }}</label>
        <div
          class="flex items-center overflow-hidden rounded-xl border border-line bg-surface focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100"
        >
          <button
            type="button"
            class="stepper-button touch-target tap-scale flex w-11 shrink-0 items-center justify-center self-stretch rounded-none border-r border-line text-content-subtle hover:bg-surface-hover active:bg-primary-soft active:text-primary-strong disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="!canDecreaseQuantity"
            :aria-label="t('itemEditor.decreaseQuantity')"
            :title="t('itemEditor.decreaseQuantity')"
            @click="decreaseQuantity"
          >
            <AppIcon name="minus" :size="16" />
          </button>
          <input
            v-model.number="form.quantity"
            type="number"
            min="1"
            step="1"
            inputmode="numeric"
            class="quantity-input min-w-0 flex-1 bg-transparent py-2.5 text-center text-[15px] outline-none"
            @blur="clampQuantity"
          />
          <button
            type="button"
            class="stepper-button touch-target tap-scale flex w-11 shrink-0 items-center justify-center self-stretch rounded-none border-l border-line text-content-subtle hover:bg-surface-hover active:bg-primary-soft active:text-primary-strong"
            :aria-label="t('itemEditor.increaseQuantity')"
            :title="t('itemEditor.increaseQuantity')"
            @click="increaseQuantity"
          >
            <AppIcon name="plus" :size="16" />
          </button>
        </div>
      </div>
      <div>
        <label class="mb-1 block text-xs font-medium text-content-muted">{{ t('itemEditor.unit') }}</label>
        <input
          v-model="form.unit"
          :placeholder="t('itemEditor.unitPlaceholder')"
          class="w-full rounded-xl border border-line px-3 py-2.5 text-[15px] outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
        />
      </div>
    </div>

    <div>
      <label class="mb-1 block text-xs font-medium text-content-muted"
        >{{ t('itemEditor.price', { currency: settings.settings.currency }) }}</label
      >
      <div
        class="flex items-center overflow-hidden rounded-xl border border-line bg-surface focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100"
      >
        <button
          type="button"
          class="stepper-button touch-target tap-scale flex w-11 shrink-0 items-center justify-center self-stretch rounded-none border-r border-line text-content-subtle hover:bg-surface-hover active:bg-primary-soft active:text-primary-strong disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!canDecreasePrice"
          :aria-label="t('itemEditor.decreasePrice')"
          :title="t('itemEditor.decreasePrice')"
          @click="decreasePrice"
        >
          <AppIcon name="minus" :size="16" />
        </button>
        <input
          v-model.number="form.estimatedPrice"
          type="number"
          min="0"
          step="0.01"
          inputmode="decimal"
          placeholder="0.00"
          class="price-input min-w-0 flex-1 bg-transparent py-2.5 text-center text-[15px] outline-none"
        />
        <button
          type="button"
          class="stepper-button touch-target tap-scale flex w-11 shrink-0 items-center justify-center self-stretch rounded-none border-l border-line text-content-subtle hover:bg-surface-hover active:bg-primary-soft active:text-primary-strong"
          :aria-label="t('itemEditor.increasePrice')"
          :title="t('itemEditor.increasePrice')"
          @click="increasePrice"
        >
          <AppIcon name="plus" :size="16" />
        </button>
      </div>
    </div>

    <div>
      <label class="mb-1 block text-xs font-medium text-content-muted">{{ t('itemEditor.category') }}</label>
      <input
        v-model="categorySearch"
        :aria-label="t('itemEditor.searchCategory')"
        :placeholder="t('itemEditor.searchCategory')"
        class="w-full rounded-xl border border-line px-3 py-2 text-[15px] outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
      />
      <div class="mt-2 flex max-h-36 flex-wrap gap-1.5 overflow-y-auto pr-1">
        <button
          v-for="c in filteredCategories"
          :key="c.id"
          type="button"
          class="tap-scale inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors"
          :class="
            form.categoryId === c.id
              ? 'border-primary-300 bg-primary-soft text-primary-strong'
              : 'border-line text-content-muted hover:bg-surface-hover'
          "
          :aria-pressed="form.categoryId === c.id"
          @click="form.categoryId = c.id"
        >
          <span>{{ c.emoji }}</span>{{ c.name }}
        </button>
      </div>
      <p v-if="filteredCategories.length === 0" class="mt-1 text-xs text-content-subtle">
        {{ t('itemEditor.noCategoryMatch', { query: categorySearch }) }}
      </p>
    </div>

    <div>
      <label class="mb-1 block text-xs font-medium text-content-muted">{{ t('itemEditor.notes') }}</label>
      <input
        v-model="form.notes"
        :placeholder="t('itemEditor.notesPlaceholder')"
        class="w-full rounded-xl border border-line px-3 py-2.5 text-[15px] outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
      />
    </div>

    <label class="flex items-center gap-2 text-sm text-content-muted">
      <input v-model="form.favorite" type="checkbox" class="h-4 w-4 accent-primary-500" />
      {{ t('itemEditor.markFavorite') }}
    </label>

    <div class="flex gap-2 pt-1">
      <BaseButton variant="ghost" block type="button" @click="emit('cancel')">{{ t('common.cancel') }}</BaseButton>
      <BaseButton block type="submit">{{ item ? t('common.save') : t('list.addItem') }}</BaseButton>
    </div>
  </form>
</template>

<style scoped>
.quantity-input::-webkit-outer-spin-button,
.quantity-input::-webkit-inner-spin-button,
.price-input::-webkit-outer-spin-button,
.price-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.quantity-input,
.price-input {
  -moz-appearance: textfield;
}

.stepper-button {
  transition:
    transform 0.22s ease,
    background-color 0.22s ease,
    color 0.22s ease;
}
</style>
