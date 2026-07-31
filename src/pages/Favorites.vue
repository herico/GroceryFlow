<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFavoritesStore } from '@/stores/favorites'
import { useListsStore } from '@/stores/lists'
import { useItemsStore } from '@/stores/items'
import { useCategoriesStore } from '@/stores/categories'
import { useSettingsStore } from '@/stores/settings'
import { useNotificationsStore } from '@/stores/notifications'
import { formatCurrency } from '@/composables/useFormat'
import type { FavoriteItem } from '@/types'
import PageHeader from '@/components/layout/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseSheet from '@/components/ui/BaseSheet.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const { t } = useI18n()
const favorites = useFavoritesStore()
const lists = useListsStore()
const items = useItemsStore()
const categories = useCategoriesStore()
const settings = useSettingsStore()
const notifications = useNotificationsStore()

const pickerOpen = ref(false)
const pending = ref<FavoriteItem | null>(null)
const removeOpen = ref(false)
const pendingRemoval = ref<FavoriteItem | null>(null)

const currency = computed(() => settings.settings.currency)

function startAdd(fav: FavoriteItem) {
  const active = lists.activeLists
  if (active.length === 0) {
    notifications.notify({ type: 'warning', message: t('favorites.createListFirst') })
    return
  }
  if (active.length === 1) {
    addTo(fav, active[0].id)
    return
  }
  pending.value = fav
  pickerOpen.value = true
}

function addTo(fav: FavoriteItem, listId: string) {
  items.addItem(listId, {
    name: fav.name,
    categoryId: fav.categoryId,
    unit: fav.unit,
    estimatedPrice: fav.estimatedPrice,
    favorite: true,
  })
  lists.touch(listId)
  const listName = lists.getList(listId)?.title ?? t('favorites.fallbackListName')
  notifications.notify({
    type: 'success',
    message: t('favorites.addedTo', { name: fav.name, list: listName }),
  })
  pickerOpen.value = false
  pending.value = null
}

function openRemoveConfirm(fav: FavoriteItem) {
  pendingRemoval.value = fav
  removeOpen.value = true
}

function closeRemoveConfirm() {
  removeOpen.value = false
  pendingRemoval.value = null
}

function confirmRemoveFavorite() {
  const fav = pendingRemoval.value
  if (!fav) return
  favorites.remove(fav.id)
  closeRemoveConfirm()
}
</script>

<template>
  <main class="px-4 pb-32 pt-4">
    <PageHeader :title="t('favorites.title')" :subtitle="t('favorites.subtitle')" />

    <section v-if="favorites.sorted.length" class="space-y-2">
      <div
        v-for="fav in favorites.sorted"
        :key="fav.id"
        class="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-soft"
      >
        <span class="text-xl">{{ categories.get(fav.categoryId).emoji }}</span>
        <div class="min-w-0 flex-1">
          <p class="truncate font-medium text-content">{{ fav.name }}</p>
          <p class="text-xs text-content-subtle">
            {{ categories.get(fav.categoryId).name }}
            <template v-if="fav.estimatedPrice != null">
              · {{ formatCurrency(fav.estimatedPrice, currency) }}</template
            >
            · {{ t('favorites.addedCount', { count: fav.count }) }}
          </p>
        </div>
        <button
          class="touch-target tap-scale rounded-xl bg-primary-soft p-2 text-primary-strong hover:bg-primary-soft-hover"
          :title="t('favorites.addToList')"
          :aria-label="t('favorites.addToList')"
          @click="startAdd(fav)"
        >
          <AppIcon name="plus" :size="20" />
        </button>
        <button
          class="touch-target tap-scale rounded-xl p-2 text-content-subtle hover:bg-danger/10 hover:text-danger"
          :title="t('favorites.removeFavorite')"
          :aria-label="t('favorites.removeFavorite')"
          @click="openRemoveConfirm(fav)"
        >
          <AppIcon name="trash" :size="18" />
        </button>
      </div>
    </section>

    <div v-else class="mt-16 flex flex-col items-center gap-3 text-center text-content-subtle">
      <div class="rounded-2xl bg-amber-500/10 p-4 text-amber-500">
        <AppIcon name="star" :size="40" />
      </div>
      <p class="max-w-[16rem] text-sm">
        {{ t('favorites.emptyText') }}
      </p>
    </div>

    <BaseSheet :open="pickerOpen" :title="t('favorites.addToWhichList')" @close="pickerOpen = false">
      <div class="space-y-2">
        <button
          v-for="l in lists.activeLists"
          :key="l.id"
          class="tap-scale flex w-full items-center justify-between rounded-xl border border-line px-4 py-3 text-left hover:border-primary-300"
          @click="pending && addTo(pending, l.id)"
        >
          <span class="font-medium">{{ l.title }}</span>
          <AppIcon name="plus" :size="18" />
        </button>
        <BaseButton variant="ghost" block @click="pickerOpen = false">{{ t('common.cancel') }}</BaseButton>
      </div>
    </BaseSheet>

    <BaseSheet :open="removeOpen" :title="t('favorites.removeFavorite')" @close="closeRemoveConfirm">
      <div class="space-y-2">
        <p v-if="pendingRemoval" class="text-sm text-content-muted">
          {{ t('favorites.deleteConfirm', { name: pendingRemoval.name }) }}
        </p>
        <BaseButton variant="danger" block @click="confirmRemoveFavorite">
          {{ t('common.delete') }}
        </BaseButton>
        <BaseButton variant="ghost" block @click="closeRemoveConfirm">{{ t('common.cancel') }}</BaseButton>
      </div>
    </BaseSheet>
  </main>
</template>
