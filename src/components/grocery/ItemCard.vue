<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { GroceryItem } from '@/types'
import { useCategoriesStore } from '@/stores/categories'
import { useSettingsStore } from '@/stores/settings'
import { formatCurrency, formatQuantity, haptic } from '@/composables/useFormat'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = withDefaults(
  defineProps<{
    item: GroceryItem
    showCategory?: boolean
    /** Hide the delete action (used in shopping mode to avoid mid-shop mistakes). */
    hideDestructive?: boolean
    /** Enable swipe gestures (disabled in manual/reorder mode). */
    swipe?: boolean
    /** Show up/down reorder controls (manual sort mode). */
    reorderable?: boolean
    isFirst?: boolean
    isLast?: boolean
    /** Multi-select mode: the row toggles selection instead of editing. */
    selectionMode?: boolean
    selected?: boolean
  }>(),
  {
    showCategory: false,
    hideDestructive: false,
    swipe: true,
    reorderable: false,
    selectionMode: false,
    selected: false,
  },
)
const emit = defineEmits<{
  toggle: []
  edit: []
  remove: []
  favorite: []
  moveUp: []
  moveDown: []
  select: []
}>()

const { t } = useI18n()
const categories = useCategoriesStore()
const settings = useSettingsStore()

const category = computed(() => categories.get(props.item.categoryId))
const lineTotal = computed(() =>
  props.item.estimatedPrice != null
    ? props.item.estimatedPrice * (props.item.quantity || 1)
    : undefined,
)
const quantityLabel = computed(() => formatQuantity(props.item.quantity, props.item.unit))
const currency = computed(() => settings.settings.currency)

// Celebrate + buzz when the item becomes checked (covers taps and swipes).
const popping = ref(false)
watch(
  () => props.item.checked,
  (checked, was) => {
    if (checked && !was) {
      popping.value = true
      haptic(8)
      setTimeout(() => (popping.value = false), 300)
    }
  },
)

// --- Swipe gestures: right = toggle picked, left = delete ---------------------
const SWIPE_THRESHOLD = 72
const dx = ref(0)
const dragging = ref(false)
const canSwipe = computed(() => props.swipe && !props.reorderable && !props.selectionMode)
let startX = 0
let startY = 0
let decided = false
let horizontal = false

function onPointerDown(e: PointerEvent) {
  if (!canSwipe.value) return
  if (e.pointerType === 'mouse' && e.button !== 0) return
  startX = e.clientX
  startY = e.clientY
  decided = false
  horizontal = false
  dragging.value = true
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value) return
  const ddx = e.clientX - startX
  const ddy = e.clientY - startY
  if (!decided) {
    if (Math.abs(ddx) < 8 && Math.abs(ddy) < 8) return
    decided = true
    horizontal = Math.abs(ddx) > Math.abs(ddy)
    if (horizontal) (e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  if (!horizontal) {
    dragging.value = false
    dx.value = 0
    return
  }
  let next = ddx
  // No left-swipe delete when destructive actions are hidden (shopping mode).
  if (next < 0 && props.hideDestructive) next = 0
  dx.value = Math.max(-120, Math.min(120, next))
}

function onPointerEnd() {
  if (!dragging.value) return
  dragging.value = false
  const value = dx.value
  dx.value = 0
  if (value >= SWIPE_THRESHOLD) emit('toggle')
  else if (value <= -SWIPE_THRESHOLD && !props.hideDestructive) emit('remove')
}
</script>

<template>
  <div class="relative overflow-hidden rounded-2xl">
    <!-- Action revealed underneath while swiping -->
    <div
      v-if="dx !== 0"
      class="absolute inset-0 flex items-center rounded-2xl px-5"
      :class="dx > 0 ? 'justify-start bg-success/15 text-success' : 'justify-end bg-danger/15 text-danger'"
      aria-hidden="true"
    >
      <AppIcon :name="dx > 0 ? 'check' : 'trash'" :size="22" />
    </div>

    <div
      class="group flex items-center gap-3 rounded-2xl border bg-surface p-3 shadow-soft"
      :class="[
        item.checked ? 'opacity-60' : '',
        dragging ? '' : 'transition-transform',
        selectionMode && selected ? 'border-primary-400 ring-2 ring-primary-300' : 'border-line',
      ]"
      :style="{ transform: dx ? `translateX(${dx}px)` : undefined, touchAction: canSwipe ? 'pan-y' : undefined }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerEnd"
      @pointercancel="onPointerEnd"
    >
      <div v-if="reorderable && !selectionMode" class="flex shrink-0 flex-col text-content-subtle">
        <button
          class="tap-scale rounded p-0.5 disabled:opacity-30"
          :disabled="isFirst"
          :aria-label="t('common.moveUp')"
          :title="t('common.moveUp')"
          @click="emit('moveUp')"
        >
          <span class="block rotate-180"><AppIcon name="chevron" :size="16" /></span>
        </button>
        <button
          class="tap-scale rounded p-0.5 disabled:opacity-30"
          :disabled="isLast"
          :aria-label="t('common.moveDown')"
          :title="t('common.moveDown')"
          @click="emit('moveDown')"
        >
          <AppIcon name="chevron" :size="16" />
        </button>
      </div>

      <button
        v-if="selectionMode"
        class="touch-target tap-scale flex shrink-0 items-center justify-center rounded-lg border-2 transition-colors"
        :class="selected ? 'border-primary-500 bg-primary-500 text-white' : 'border-content-subtle text-transparent'"
        role="checkbox"
        :aria-checked="selected"
        :aria-label="item.name"
        @click="emit('select')"
      >
        <AppIcon name="check" :size="16" />
      </button>
      <button
        v-else
        class="touch-target tap-scale flex shrink-0 items-center justify-center rounded-full border-2 transition-colors"
        :class="[
          item.checked
            ? 'border-success bg-success text-white'
            : 'border-content-subtle text-transparent hover:border-primary-400',
          popping ? 'check-pop' : '',
        ]"
        :aria-pressed="item.checked"
        :aria-label="item.checked ? t('itemCard.markNotPicked') : t('itemCard.markPicked')"
        :title="item.checked ? t('itemCard.markNotPicked') : t('itemCard.markPicked')"
        @click="emit('toggle')"
      >
        <AppIcon name="check" :size="16" />
      </button>

      <button class="min-w-0 flex-1 text-left" @click="selectionMode ? emit('select') : emit('edit')">
        <div class="flex items-center gap-1.5">
          <span
            class="truncate text-[15px] font-medium"
            :class="item.checked ? 'text-content-subtle line-through' : 'text-content'"
            >{{ item.name }}</span
          >
          <span v-if="item.favorite" class="text-amber-500"><AppIcon name="star" :size="14" /></span>
        </div>
        <div class="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-content-muted">
          <span class="font-medium tabular-nums">{{ quantityLabel }}</span>
          <span v-if="showCategory" class="inline-flex items-center gap-1">
            <span aria-hidden="true">·</span>
            <span>{{ category.emoji }} {{ category.name }}</span>
          </span>
          <span v-if="item.notes" class="max-w-[14rem] truncate italic text-content-subtle">
            <span aria-hidden="true">· </span>{{ item.notes }}
          </span>
        </div>
      </button>

      <div class="flex shrink-0 flex-col items-end gap-1">
        <span v-if="lineTotal != null" class="text-sm font-semibold text-content">{{
          formatCurrency(lineTotal, currency)
        }}</span>
        <div v-if="!selectionMode" class="flex items-center gap-0.5 text-content-subtle">
          <button
            class="touch-target tap-scale rounded-lg p-1 hover:bg-amber-500/10 hover:text-amber-500"
            :class="item.favorite ? 'text-amber-500' : ''"
            :title="t('itemCard.toggleFavorite')"
            :aria-label="t('itemCard.toggleFavorite')"
            @click="emit('favorite')"
          >
            <AppIcon name="star" :size="16" />
          </button>
          <button
            v-if="!hideDestructive"
            class="touch-target tap-scale rounded-lg p-1 hover:bg-danger/10 hover:text-danger"
            :title="t('itemCard.delete')"
            :aria-label="t('itemCard.delete')"
            @click="emit('remove')"
          >
            <AppIcon name="trash" :size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
