<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ShoppingList } from '@/types'
import { useItemsStore } from '@/stores/items'
import { useSettingsStore } from '@/stores/settings'
import { formatCurrency } from '@/composables/useFormat'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseSheet from '@/components/ui/BaseSheet.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps<{ list: ShoppingList }>()
const emit = defineEmits<{
  open: []
  shop: []
  rename: []
  duplicate: []
  archive: []
  restore: []
  remove: []
}>()

const { t } = useI18n()
const items = useItemsStore()
const settings = useSettingsStore()
const stats = computed(() => items.stats(props.list.id))
const actionsOpen = ref(false)

function openActions() {
  actionsOpen.value = true
}

function closeActions() {
  actionsOpen.value = false
}

function emitAndClose(action: 'archive' | 'restore' | 'remove') {
  if (action === 'archive') emit('archive')
  if (action === 'restore') emit('restore')
  if (action === 'remove') emit('remove')
  closeActions()
}
</script>

<template>
  <div class="rounded-2xl border border-line bg-surface p-4 shadow-soft">
    <button class="w-full text-left" @click="emit('open')">
      <div class="flex items-start justify-between gap-2">
        <h3 class="truncate text-lg font-semibold text-content">{{ list.title }}</h3>
        <span v-if="stats.estimatedTotal > 0" class="shrink-0 text-sm font-semibold text-primary-strong">
          {{ formatCurrency(stats.estimatedTotal, settings.settings.currency) }}
        </span>
      </div>
      <p class="mt-0.5 text-xs text-content-subtle">
        {{ t('listCard.itemsCount', { count: stats.total }, stats.total) }}
        <template v-if="stats.total"> · {{ t('listCard.pickedPercent', { percent: stats.progress }) }}</template>
      </p>
      <div v-if="stats.total" class="mt-3" aria-hidden="true">
        <ProgressBar :value="stats.progress" :tone="stats.progress === 100 ? 'success' : 'primary'" />
      </div>
    </button>

    <div class="mt-3 flex items-center gap-1 border-t border-line pt-2 text-content-subtle">
      <button
        class="touch-target tap-scale rounded-lg p-1.5 hover:bg-surface-hover hover:text-content"
        :title="t('common.rename')"
        :aria-label="t('common.rename')"
        @click="emit('rename')"
      >
        <AppIcon name="edit" :size="18" />
      </button>
      <button
        class="touch-target tap-scale rounded-lg p-1.5 hover:bg-surface-hover hover:text-content"
        :title="t('common.duplicate')"
        :aria-label="t('common.duplicate')"
        @click="emit('duplicate')"
      >
        <AppIcon name="copy" :size="18" />
      </button>
      <div class="flex-1" />
      <button
        v-if="stats.total > 0"
        class="tap-scale inline-flex items-center gap-1.5 rounded-lg bg-primary-soft px-2.5 py-1.5 text-sm font-medium text-primary-strong hover:bg-primary-soft-hover"
        :title="t('list.shop')"
        :aria-label="t('list.shop')"
        @click="emit('shop')"
      >
        <AppIcon name="cart" :size="16" /> {{ t('list.shop') }}
      </button>
      <button
        class="touch-target tap-scale rounded-lg p-1.5 hover:bg-surface-hover hover:text-content"
        :title="t('common.moreActions')"
        :aria-label="t('common.moreActions')"
        @click="openActions"
      >
        <AppIcon name="more" :size="18" />
      </button>
    </div>

    <BaseSheet :open="actionsOpen" :title="list.title" @close="closeActions">
      <div class="space-y-2">
        <BaseButton
          v-if="!list.archived"
          variant="ghost"
          block
          class="justify-start"
          @click="emitAndClose('archive')"
        >
          {{ t('common.archive') }}
        </BaseButton>
        <BaseButton
          v-else
          variant="ghost"
          block
          class="justify-start"
          @click="emitAndClose('restore')"
        >
          {{ t('common.restore') }}
        </BaseButton>
        <BaseButton variant="danger" block class="justify-start" @click="emitAndClose('remove')">
          {{ t('common.delete') }}
        </BaseButton>
        <BaseButton variant="ghost" block @click="closeActions">{{ t('common.cancel') }}</BaseButton>
      </div>
    </BaseSheet>
  </div>
</template>
