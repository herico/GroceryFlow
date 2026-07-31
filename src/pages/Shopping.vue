<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useListsStore } from '@/stores/lists'
import { useItemsStore } from '@/stores/items'
import { useSettingsStore } from '@/stores/settings'
import { useNotificationsStore } from '@/stores/notifications'
import { useWakeLock } from '@/composables/useWakeLock'
import { groupByCategory } from '@/composables/useItemSort'
import type { GroceryItem } from '@/types'
import PageHeader from '@/components/layout/PageHeader.vue'
import ShoppingProgress from '@/components/shopping/ShoppingProgress.vue'
import BudgetBar from '@/components/grocery/BudgetBar.vue'
import CategoryGroup from '@/components/shopping/CategoryGroup.vue'
import ItemCard from '@/components/grocery/ItemCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSheet from '@/components/ui/BaseSheet.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{ id: string }>()
const router = useRouter()
const { t } = useI18n()

const lists = useListsStore()
const items = useItemsStore()
const settings = useSettingsStore()
const notifications = useNotificationsStore()
const wakeLock = useWakeLock()
const completeSheetOpen = ref(false)

const list = computed(() => lists.getList(props.id))
const stats = computed(() => items.stats(props.id))
const budget = computed(() => settings.settings.weeklyBudget)

// Checked items sink to the bottom of each category group.
function orderInGroup(groupItems: GroceryItem[]): GroceryItem[] {
  return [...groupItems].sort((a, b) => {
    if (a.checked !== b.checked) return a.checked ? 1 : -1
    return a.name.localeCompare(b.name)
  })
}

const groups = computed(() =>
  groupByCategory(items.itemsForList(props.id)).map((g) => ({
    ...g,
    items: orderInGroup(g.items),
    checkedCount: g.items.filter((i) => i.checked).length,
  })),
)

function removeWithUndo(item: GroceryItem) {
  const snapshot = items.removeItemWithSnapshot(item.id)
  if (!snapshot) return
  notifications.notify({
    message: t('common.deleted', { name: item.name }),
    actionLabel: t('common.undo'),
    onAction: () => items.restoreItem(snapshot),
    timeout: 6000,
  })
}

function openCompleteSheet() {
  completeSheetOpen.value = true
}

function closeCompleteSheet() {
  completeSheetOpen.value = false
}

function completeAndArchive() {
  lists.setArchived(props.id, true)
  closeCompleteSheet()
  router.push('/')
}

function completeWithoutArchiving() {
  closeCompleteSheet()
  router.push({ name: 'list', params: { id: props.id } })
}
</script>

<template>
  <main v-if="list" class="px-4 pb-32 pt-4">
    <PageHeader :title="list.title" :subtitle="t('shopping.mode')" back>
      <template #actions>
        <button
          v-if="wakeLock.supported"
          class="touch-target tap-scale rounded-xl px-2.5 py-2 text-sm font-medium transition-colors"
          :class="wakeLock.active.value
            ? 'bg-primary-soft text-primary-strong'
            : 'text-content-muted hover:bg-surface-hover'"
          :aria-pressed="wakeLock.active.value"
          :aria-label="t('shopping.keepScreenOn')"
          :title="t('shopping.keepScreenOn')"
          @click="wakeLock.toggle()"
        >
          <AppIcon name="sun" :size="20" />
        </button>
      </template>
    </PageHeader>

    <div class="sticky top-0 z-10 -mx-4 space-y-3 bg-canvas/90 px-4 pb-3 pt-1 backdrop-blur">
      <ShoppingProgress
        :title="t('shopping.todaysShopping')"
        :total="stats.total"
        :checked="stats.checked"
        :progress="stats.progress"
        :estimated-total="stats.estimatedTotal"
        :picked="stats.picked"
        :remaining-cost="stats.remainingCost"
      />
      <BudgetBar
        v-if="budget && stats.estimatedTotal > 0"
        :spent="stats.estimatedTotal"
        :budget="budget"
        :currency="settings.settings.currency"
      />
    </div>

    <div v-if="stats.total" class="mt-3 space-y-3">
      <CategoryGroup
        v-for="group in groups"
        :key="group.categoryId"
        :emoji="group.emoji"
        :name="group.name"
        :count="group.items.length"
        :checked-count="group.checkedCount"
      >
        <TransitionGroup tag="div" name="list" class="relative space-y-2">
          <ItemCard
            v-for="item in group.items"
            :key="item.id"
            :item="item"
            hide-destructive
            @toggle="items.toggleChecked(item.id)"
            @edit="items.toggleChecked(item.id)"
            @favorite="items.toggleFavorite(item.id)"
            @remove="removeWithUndo(item)"
          />
        </TransitionGroup>
      </CategoryGroup>

      <div class="flex gap-2 pt-2">
        <BaseButton variant="ghost" block @click="items.uncheckAll(list.id)">{{ t('shopping.reset') }}</BaseButton>
        <BaseButton block @click="openCompleteSheet">{{ t('shopping.complete') }}</BaseButton>
      </div>

      <BaseSheet :open="completeSheetOpen" :title="t('shopping.finishTitle')" @close="closeCompleteSheet">
        <div class="space-y-3">
          <p class="text-sm text-content-muted">{{ t('shopping.completeConfirm') }}</p>
          <BaseButton block @click="completeAndArchive">{{ t('shopping.complete') }}</BaseButton>
          <BaseButton variant="ghost" block @click="completeWithoutArchiving">{{
            t('shopping.completeOnly')
          }}</BaseButton>
          <BaseButton variant="ghost" block @click="closeCompleteSheet">{{ t('common.cancel') }}</BaseButton>
        </div>
      </BaseSheet>
    </div>

    <div v-else class="mt-16 text-center text-sm text-content-subtle">
      {{ t('shopping.empty') }}
    </div>
  </main>

  <main v-else class="px-4 pt-20 text-center text-content-subtle">
    <p>{{ t('common.listNoLongerExists') }}</p>
    <BaseButton class="mt-4" @click="router.push('/')">{{ t('common.backToLists') }}</BaseButton>
  </main>
</template>
