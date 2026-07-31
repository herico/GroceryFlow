<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useListsStore } from '@/stores/lists'
import { useItemsStore } from '@/stores/items'
import { useFavoritesStore } from '@/stores/favorites'
import { useSettingsStore } from '@/stores/settings'
import { useNotificationsStore } from '@/stores/notifications'
import { useCategoriesStore } from '@/stores/categories'
import type { GroceryItem } from '@/types'
import { filterItems, groupByCategory, sortItems } from '@/composables/useItemSort'
import { OTHERS_CATEGORY_ID } from '@/services/categories.data'
import PageHeader from '@/components/layout/PageHeader.vue'
import QuickAdd from '@/components/grocery/QuickAdd.vue'
import type { QuickAddValue } from '@/components/grocery/QuickAdd.vue'
import ItemCard from '@/components/grocery/ItemCard.vue'
import CategoryGroup from '@/components/shopping/CategoryGroup.vue'
import BudgetBar from '@/components/grocery/BudgetBar.vue'
import ItemEditor from '@/components/grocery/ItemEditor.vue'
import type { ItemFormValue } from '@/components/grocery/ItemEditor.vue'
import BaseSheet from '@/components/ui/BaseSheet.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{ id: string }>()
const router = useRouter()
const { t } = useI18n()

const lists = useListsStore()
const items = useItemsStore()
const favorites = useFavoritesStore()
const settings = useSettingsStore()
const notifications = useNotificationsStore()
const categories = useCategoriesStore()

const list = computed(() => lists.getList(props.id))

const search = ref('')
const sortMode = computed({
  get: () => settings.settings.sortMode,
  set: (v) => settings.setSortMode(v),
})

const rawItems = computed(() => items.itemsForList(props.id))
const filtered = computed(() => filterItems(rawItems.value, search.value))
const stats = computed(() => items.stats(props.id))

const grouped = computed(() => groupByCategory(filtered.value, sortMode.value))
const flat = computed(() => sortItems(filtered.value, sortMode.value))
const reorderMode = computed(() => sortMode.value === 'manual' && !search.value && !selectionMode.value)
const budget = computed(() => settings.settings.weeklyBudget)

// --- Bulk selection ---------------------------------------------------------
const selectionMode = ref(false)
const selectedIds = ref<Set<string>>(new Set())
const bulkCatOpen = ref(false)
const selectedCount = computed(() => selectedIds.value.size)

function isSelected(id: string) {
  return selectedIds.value.has(id)
}

function toggleSelect(id: string) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

function enterSelection() {
  selectionMode.value = true
  selectedIds.value = new Set()
}

function exitSelection() {
  selectionMode.value = false
  selectedIds.value = new Set()
}

function selectAll() {
  selectedIds.value = new Set(filtered.value.map((i) => i.id))
}

function bulkMarkPicked() {
  items.setCheckedMany([...selectedIds.value], true)
  lists.touch(props.id)
  exitSelection()
}

function bulkDelete() {
  const ids = [...selectedIds.value]
  if (!ids.length) return
  const snapshots = items.removeItemsWithSnapshot(ids)
  lists.touch(props.id)
  notifications.notify({
    message: t('bulk.deleted', { count: snapshots.length }, snapshots.length),
    actionLabel: t('common.undo'),
    onAction: () => {
      items.restoreItems(snapshots)
      lists.touch(props.id)
    },
    timeout: 6000,
  })
  exitSelection()
}

function applyBulkCategory(categoryId: string) {
  items.setCategoryMany([...selectedIds.value], categoryId)
  lists.touch(props.id)
  bulkCatOpen.value = false
  exitSelection()
}

// Editor sheet state
const editorOpen = ref(false)
const editingItem = ref<GroceryItem | undefined>()
const initialName = ref('')
const initialCategoryId = ref(OTHERS_CATEGORY_ID)

function quickAdd(value: QuickAddValue) {
  const { merged } = items.addItem(props.id, value)
  lists.touch(props.id)
  if (merged) {
    notifications.notify({ type: 'success', message: t('common.merged', { name: value.name }) })
  }
}

function removeWithUndo(item: GroceryItem) {
  const snapshot = items.removeItemWithSnapshot(item.id)
  if (!snapshot) return
  lists.touch(props.id)
  notifications.notify({
    message: t('common.deleted', { name: item.name }),
    actionLabel: t('common.undo'),
    onAction: () => {
      items.restoreItem(snapshot)
      lists.touch(props.id)
    },
    timeout: 6000,
  })
}

function moveItem(item: GroceryItem, direction: 'up' | 'down') {
  const ordered = sortItems(rawItems.value, 'manual')
  const index = ordered.findIndex((i) => i.id === item.id)
  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= ordered.length) return
  const ids = ordered.map((i) => i.id)
  ;[ids[index], ids[target]] = [ids[target], ids[index]]
  items.reorder(props.id, ids)
  lists.touch(props.id)
}

function openNew(value: QuickAddValue | string = '') {
  editingItem.value = undefined
  if (typeof value === 'string') {
    initialName.value = value
    initialCategoryId.value = OTHERS_CATEGORY_ID
  } else {
    initialName.value = value.name
    initialCategoryId.value = value.categoryId
  }
  editorOpen.value = true
}

function openEdit(item: GroceryItem) {
  editingItem.value = item
  initialName.value = ''
  initialCategoryId.value = OTHERS_CATEGORY_ID
  editorOpen.value = true
}

function submitEditor(value: ItemFormValue) {
  if (editingItem.value) {
    items.updateItem(editingItem.value.id, {
      name: value.name.trim(),
      quantity: value.quantity > 0 ? value.quantity : 1,
      unit: value.unit.trim() || undefined,
      categoryId: value.categoryId,
      estimatedPrice: value.estimatedPrice ?? undefined,
      notes: value.notes.trim() || undefined,
      favorite: value.favorite,
    })
    if (value.favorite) favorites.registerFromItem(items.getItem(editingItem.value.id)!)
    else favorites.removeByName(value.name)
  } else {
    items.addItem(props.id, {
      name: value.name,
      quantity: value.quantity,
      unit: value.unit,
      categoryId: value.categoryId,
      estimatedPrice: value.estimatedPrice ?? undefined,
      notes: value.notes,
      favorite: value.favorite,
    })
  }
  lists.touch(props.id)
  editorOpen.value = false
}

function addFavorite(name: string, categoryId: string, unit?: string, price?: number) {
  items.addItem(props.id, { name, categoryId, unit, estimatedPrice: price, favorite: true })
  lists.touch(props.id)
}

const sortOptions = computed(
  () =>
    [
      { value: 'category', label: t('sort.category') },
      { value: 'added', label: t('sort.addedShort') },
      { value: 'alphabetical', label: t('sort.az') },
      { value: 'manual', label: t('sort.manual') },
    ] as const,
)
</script>

<template>
  <main v-if="list" class="px-4 pb-32 pt-4">
    <PageHeader :title="list.title" :subtitle="t('list.itemsCount', { count: stats.total }, stats.total)" back>
      <template #actions>
        <template v-if="!selectionMode">
          <BaseButton v-if="stats.total" size="sm" variant="ghost" @click="enterSelection">
            {{ t('bulk.select') }}
          </BaseButton>
          <BaseButton
            v-if="stats.total"
            size="sm"
            variant="soft"
            @click="router.push({ name: 'shopping', params: { id: list.id } })"
          >
            <AppIcon name="cart" :size="18" /> {{ t('list.shop') }}
          </BaseButton>
        </template>
        <BaseButton v-else size="sm" variant="ghost" @click="exitSelection">
          {{ t('common.cancel') }}
        </BaseButton>
      </template>
    </PageHeader>

    <div v-if="!selectionMode" class="sticky top-0 z-10 -mx-4 space-y-3 bg-canvas/90 px-4 pb-3 pt-1 backdrop-blur">
      <QuickAdd @add="quickAdd" @expand="openNew" />

      <div class="flex items-center gap-2">
        <div
          class="flex flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2"
        >
          <span class="text-content-subtle"><AppIcon name="search" :size="18" /></span>
          <input
            v-model="search"
            :placeholder="t('list.searchItems')"
            class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-content-subtle"
          />
          <button
            v-if="search"
            class="touch-target text-content-subtle"
            :aria-label="t('common.clear')"
            :title="t('common.clear')"
            @click="search = ''"
          >
            <AppIcon name="x" :size="16" />
          </button>
        </div>
        <select
          v-model="sortMode"
          class="rounded-xl border border-line bg-surface px-2.5 py-2 text-sm outline-none"
          :title="t('sort.label')"
        >
          <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Favorites quick-add row -->
    <section v-if="!selectionMode && favorites.sorted.length" class="mt-3">
      <p class="mb-2 text-xs font-medium text-content-subtle">{{ t('list.quickFavorites') }}</p>
      <div class="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="fav in favorites.sorted.slice(0, 12)"
          :key="fav.id"
          class="tap-scale shrink-0 rounded-full border border-line bg-surface px-3 py-1.5 text-sm shadow-soft hover:border-primary-300"
          @click="addFavorite(fav.name, fav.categoryId, fav.unit, fav.estimatedPrice)"
        >
          ⭐ {{ fav.name }}
        </button>
      </div>
    </section>

    <BudgetBar
      v-if="!selectionMode && budget && stats.estimatedTotal > 0"
      class="mt-3"
      :spent="stats.estimatedTotal"
      :budget="budget"
      :currency="settings.settings.currency"
    />

    <!-- Item list -->
    <div v-if="filtered.length" class="mt-4">
      <template v-if="sortMode === 'category'">
        <div class="space-y-3">
          <CategoryGroup
            v-for="group in grouped"
            :key="group.categoryId"
            :emoji="group.emoji"
            :name="group.name"
            :count="group.items.length"
          >
            <ItemCard
              v-for="item in group.items"
              :key="item.id"
              :item="item"
              :selection-mode="selectionMode"
              :selected="isSelected(item.id)"
              @toggle="items.toggleChecked(item.id)"
              @edit="openEdit(item)"
              @favorite="items.toggleFavorite(item.id)"
              @remove="removeWithUndo(item)"
              @select="toggleSelect(item.id)"
            />
          </CategoryGroup>
        </div>
      </template>
      <TransitionGroup v-else tag="div" name="list" class="relative space-y-2">
        <ItemCard
          v-for="(item, index) in flat"
          :key="item.id"
          :item="item"
          show-category
          :reorderable="reorderMode"
          :swipe="!reorderMode"
          :is-first="index === 0"
          :is-last="index === flat.length - 1"
          :selection-mode="selectionMode"
          :selected="isSelected(item.id)"
          @toggle="items.toggleChecked(item.id)"
          @edit="openEdit(item)"
          @favorite="items.toggleFavorite(item.id)"
          @remove="removeWithUndo(item)"
          @move-up="moveItem(item, 'up')"
          @move-down="moveItem(item, 'down')"
          @select="toggleSelect(item.id)"
        />
      </TransitionGroup>
    </div>

    <div v-else class="mt-16 text-center text-sm text-content-subtle">
      <template v-if="search">{{ t('list.noMatch', { query: search }) }}</template>
      <template v-else>{{ t('list.addFirst') }}</template>
    </div>

    <BaseSheet
      :open="editorOpen"
      :title="editingItem ? t('list.editItem') : t('list.addItem')"
      @close="editorOpen = false"
    >
      <ItemEditor
        :item="editingItem"
        :initial-name="initialName"
        :initial-category-id="initialCategoryId"
        @submit="submitEditor"
        @cancel="editorOpen = false"
      />
    </BaseSheet>

    <!-- Bulk action bar -->
    <Transition name="fade">
      <div
        v-if="selectionMode"
        class="fixed inset-x-0 bottom-16 z-40 mx-auto max-w-md px-4"
        style="margin-bottom: env(safe-area-inset-bottom)"
      >
        <div class="flex items-center gap-1 rounded-2xl border border-line bg-surface p-2 shadow-lift">
          <button
            class="tap-scale rounded-lg px-2 py-1.5 text-sm font-medium text-content-muted hover:bg-surface-hover"
            @click="selectAll"
          >
            {{ t('bulk.selectAll') }}
          </button>
          <span class="flex-1 text-center text-sm font-semibold">{{
            t('bulk.selected', { count: selectedCount })
          }}</span>
          <button
            class="touch-target tap-scale rounded-lg p-2 text-content-muted hover:bg-surface-hover disabled:opacity-40"
            :disabled="!selectedCount"
            :title="t('bulk.markPicked')"
            :aria-label="t('bulk.markPicked')"
            @click="bulkMarkPicked"
          >
            <AppIcon name="check" :size="18" />
          </button>
          <button
            class="touch-target tap-scale rounded-lg p-2 text-content-muted hover:bg-surface-hover disabled:opacity-40"
            :disabled="!selectedCount"
            :title="t('bulk.category')"
            :aria-label="t('bulk.category')"
            @click="bulkCatOpen = true"
          >
            <AppIcon name="tag" :size="18" />
          </button>
          <button
            class="touch-target tap-scale rounded-lg p-2 text-danger hover:bg-danger/10 disabled:opacity-40"
            :disabled="!selectedCount"
            :title="t('bulk.delete')"
            :aria-label="t('bulk.delete')"
            @click="bulkDelete"
          >
            <AppIcon name="trash" :size="18" />
          </button>
        </div>
      </div>
    </Transition>

    <BaseSheet :open="bulkCatOpen" :title="t('bulk.category')" @close="bulkCatOpen = false">
      <div class="grid max-h-[55vh] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
        <button
          v-for="c in categories.categories"
          :key="c.id"
          type="button"
          class="tap-scale flex flex-col items-center gap-1 rounded-xl border border-line px-2 py-3 text-center hover:bg-surface-hover"
          @click="applyBulkCategory(c.id)"
        >
          <span class="text-2xl">{{ c.emoji }}</span>
          <span class="w-full truncate text-xs font-medium">{{ c.name }}</span>
        </button>
      </div>
    </BaseSheet>
  </main>

  <main v-else class="px-4 pt-20 text-center text-content-subtle">
    <p>{{ t('common.listNoLongerExists') }}</p>
    <BaseButton class="mt-4" @click="router.push('/')">{{ t('common.backToLists') }}</BaseButton>
  </main>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
