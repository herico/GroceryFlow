<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { GroceryItem } from '@/types'
import { useCategoriesStore } from '@/stores/categories'
import { useFavoritesStore } from '@/stores/favorites'
import { useSettingsStore } from '@/stores/settings'
import { OTHERS_CATEGORY_ID } from '@/services/categories.data'
import { guessCategoryId } from '@/services/categoryKeywords.data'
import { uid } from '@/composables/useFormat'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSheet from '@/components/ui/BaseSheet.vue'
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
const advancedSectionId = `item-editor-advanced-${uid()}`
const advancedOpen = ref(false)
const categorySearch = ref('')
const categoryPickerOpen = ref(false)
const selectedCategory = computed(() => categories.get(form.categoryId))
const hasAdvancedDetails = computed(
  () => !!form.unit.trim() || form.estimatedPrice != null || !!form.notes.trim() || form.favorite,
)
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

function openCategoryPicker() {
  categorySearch.value = ''
  categoryPickerOpen.value = true
}

function pickCategory(id: string) {
  form.categoryId = id
  categoryPickerOpen.value = false
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
  categoryPickerOpen.value = false
  advancedOpen.value = !!props.item
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
      <label class="mb-1 block text-xs font-medium text-content-muted">{{ t('itemEditor.category') }}</label>
      <button
        type="button"
        data-testid="item-editor-category-button"
        class="tap-scale flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 text-left transition-colors hover:bg-surface-hover"
        :aria-label="t('itemEditor.changeCategory')"
        @click="openCategoryPicker"
      >
        <span class="text-xl">{{ selectedCategory.emoji }}</span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-content">{{ selectedCategory.name }}</p>
          <p class="text-xs text-content-subtle">{{ t('itemEditor.changeCategory') }}</p>
        </div>
        <span class="text-content-subtle">
          <AppIcon name="chevron" :size="18" />
        </span>
      </button>
    </div>

    <BaseSheet
      :open="categoryPickerOpen"
      :title="t('itemEditor.category')"
      @close="
        () => {
          categoryPickerOpen = false
          categorySearch = ''
        }
      "
    >
      <div data-testid="item-editor-category-picker" class="space-y-3">
        <input
          v-model="categorySearch"
          :aria-label="t('itemEditor.searchCategory')"
          :placeholder="t('itemEditor.searchCategory')"
          class="w-full rounded-xl border border-line px-3 py-2 text-[15px] outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
        />

        <div class="grid max-h-[55vh] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
          <button
            v-for="c in filteredCategories"
            :key="c.id"
            type="button"
            class="tap-scale flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition-colors"
            :class="
              form.categoryId === c.id
                ? 'border-primary-300 bg-primary-soft text-primary-strong'
                : 'border-line hover:bg-surface-hover'
            "
            :aria-pressed="form.categoryId === c.id"
            @click="pickCategory(c.id)"
          >
            <span class="text-2xl">{{ c.emoji }}</span>
            <span class="w-full truncate text-xs font-medium">{{ c.name }}</span>
          </button>
        </div>

        <p v-if="filteredCategories.length === 0" class="mt-1 text-xs text-content-subtle">
          {{ t('itemEditor.noCategoryMatch', { query: categorySearch }) }}
        </p>
      </div>
    </BaseSheet>

    <section class="overflow-hidden rounded-2xl border border-line bg-surface/60 shadow-soft">
      <button
        type="button"
        data-testid="item-editor-advanced-toggle"
        class="tap-scale flex w-full items-start gap-2 px-4 py-3 text-left"
        :aria-expanded="advancedOpen"
        :aria-controls="advancedSectionId"
        :aria-label="advancedOpen ? t('itemEditor.hideMoreOptions') : t('itemEditor.showMoreOptions')"
        @click="advancedOpen = !advancedOpen"
      >
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-content">{{ t('itemEditor.moreOptions') }}</p>
          <p class="mt-0.5 text-xs text-content-subtle">{{ t('itemEditor.moreOptionsHint') }}</p>
          <div v-if="!advancedOpen" class="mt-2 flex flex-wrap gap-1.5">
            <span
              class="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-0.5 text-xs text-content-muted"
            >
              {{ selectedCategory.emoji }} {{ selectedCategory.name }}
            </span>
            <span
              v-if="form.unit.trim()"
              class="rounded-full border border-line bg-surface px-2 py-0.5 text-xs text-content-muted"
            >
              {{ t('itemEditor.summaryUnit') }}
            </span>
            <span
              v-if="form.estimatedPrice != null"
              class="rounded-full border border-line bg-surface px-2 py-0.5 text-xs text-content-muted"
            >
              {{ t('itemEditor.summaryPrice') }}
            </span>
            <span
              v-if="form.notes.trim()"
              class="rounded-full border border-line bg-surface px-2 py-0.5 text-xs text-content-muted"
            >
              {{ t('itemEditor.summaryNotes') }}
            </span>
            <span
              v-if="form.favorite"
              class="rounded-full border border-line bg-surface px-2 py-0.5 text-xs text-content-muted"
            >
              {{ t('itemEditor.summaryFavorite') }}
            </span>
            <span
              v-if="!hasAdvancedDetails"
              class="rounded-full border border-line bg-surface px-2 py-0.5 text-xs text-content-subtle"
            >
              {{ t('itemEditor.summaryNone') }}
            </span>
          </div>
        </div>
        <span
          class="mt-1 text-content-subtle transition-transform duration-200"
          :class="advancedOpen ? '' : '-rotate-90'"
        >
          <AppIcon name="chevron" :size="18" />
        </span>
      </button>

      <Transition name="collapse">
        <div
          v-show="advancedOpen"
          :id="advancedSectionId"
          data-testid="item-editor-advanced"
          class="space-y-4 border-t border-line px-4 pb-4 pt-3"
        >
          <div>
            <label class="mb-1 block text-xs font-medium text-content-muted">{{ t('itemEditor.unit') }}</label>
            <input
              v-model="form.unit"
              :placeholder="t('itemEditor.unitPlaceholder')"
              class="w-full rounded-xl border border-line px-3 py-2.5 text-[15px] outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            />
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
        </div>
      </Transition>
    </section>

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

.collapse-enter-active,
.collapse-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
