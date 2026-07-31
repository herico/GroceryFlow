<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCategoriesStore } from '@/stores/categories'
import { useFavoritesStore } from '@/stores/favorites'
import { OTHERS_CATEGORY_ID } from '@/services/categories.data'
import { guessCategoryId } from '@/services/categoryKeywords.data'
import BaseSheet from '@/components/ui/BaseSheet.vue'

export interface QuickAddValue {
  name: string
  categoryId: string
}

const emit = defineEmits<{ add: [value: QuickAddValue]; expand: [value: QuickAddValue] }>()

const { t } = useI18n()
const value = ref('')
const justAdded = ref(false)
const selectedCategoryId = ref(OTHERS_CATEGORY_ID)
const manualCategory = ref(false)
const pickerOpen = ref(false)
const categories = useCategoriesStore()
const favorites = useFavoritesStore()
let timer: ReturnType<typeof setTimeout> | undefined

const selectedCategory = () => categories.get(selectedCategoryId.value)

// Auto-pick a category from what the user types (favorites history first, then
// a keyword guess) until they choose one manually.
watch(value, (name) => {
  if (manualCategory.value) return
  const fav = favorites.findByName(name)
  selectedCategoryId.value = fav?.categoryId ?? guessCategoryId(name) ?? OTHERS_CATEGORY_ID
})

function pickCategory(id: string) {
  selectedCategoryId.value = id
  manualCategory.value = true
  pickerOpen.value = false
}

function reset() {
  value.value = ''
  selectedCategoryId.value = OTHERS_CATEGORY_ID
  manualCategory.value = false
}

function submit() {
  const name = value.value.trim()
  if (!name) return
  emit('add', { name, categoryId: selectedCategoryId.value })
  reset()
  justAdded.value = true
  clearTimeout(timer)
  timer = setTimeout(() => (justAdded.value = false), 900)
}

function expand() {
  const name = value.value.trim()
  if (!name) return
  emit('expand', { name, categoryId: selectedCategoryId.value })
}
</script>

<template>
  <form
    class="flex items-center gap-2 rounded-2xl border border-line bg-surface px-2 py-1.5 shadow-soft focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100"
    @submit.prevent="submit"
  >
    <button
      type="button"
      class="tap-scale flex h-9 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-muted text-lg"
      :aria-label="`${t('quickAdd.category')}: ${selectedCategory().name}`"
      :title="`${t('quickAdd.category')}: ${selectedCategory().name}`"
      @click="pickerOpen = true"
    >
      {{ selectedCategory().emoji }}
    </button>
    <input
      v-model="value"
      type="text"
      inputmode="text"
      :placeholder="t('quickAdd.placeholder')"
      class="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-content-subtle"
      @keydown.enter.prevent="submit"
    />
    <Transition name="fade">
      <span
        v-if="justAdded"
        class="shrink-0 rounded-lg bg-primary-soft px-2 py-1 text-xs font-semibold text-primary-strong"
        >{{ t('quickAdd.added') }}</span
      >
    </Transition>
    <button
      v-if="value.trim()"
      type="button"
      class="tap-scale shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-content-subtle hover:bg-surface-hover"
      :title="t('quickAdd.detailsTitle')"
      @click="expand"
    >
      {{ t('quickAdd.details') }}
    </button>
    <button
      type="submit"
      class="tap-scale shrink-0 rounded-lg bg-primary-soft px-2.5 py-1.5 text-xs font-semibold text-primary-strong enabled:hover:bg-primary-soft-hover disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="!value.trim()"
    >
      {{ t('common.add') }}
    </button>
  </form>

  <BaseSheet :open="pickerOpen" :title="t('quickAdd.category')" @close="pickerOpen = false">
    <div class="grid max-h-[55vh] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
      <button
        v-for="c in categories.categories"
        :key="c.id"
        type="button"
        class="tap-scale flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition-colors"
        :class="
          selectedCategoryId === c.id
            ? 'border-primary-300 bg-primary-soft text-primary-strong'
            : 'border-line hover:bg-surface-hover'
        "
        :aria-pressed="selectedCategoryId === c.id"
        @click="pickCategory(c.id)"
      >
        <span class="text-2xl">{{ c.emoji }}</span>
        <span class="w-full truncate text-xs font-medium">{{ c.name }}</span>
      </button>
    </div>
  </BaseSheet>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
