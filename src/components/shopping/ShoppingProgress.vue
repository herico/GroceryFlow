<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'
import { formatCurrency } from '@/composables/useFormat'
import ProgressBar from '@/components/ui/ProgressBar.vue'

const props = defineProps<{
  title?: string
  total: number
  checked: number
  progress: number
  estimatedTotal: number
  picked: number
  remainingCost: number
}>()

const { t } = useI18n()
const settings = useSettingsStore()
const currency = computed(() => settings.settings.currency)
const done = computed(() => props.total > 0 && props.checked === props.total)
const remaining = computed(() => props.total - props.checked)
</script>

<template>
  <div class="rounded-2xl border border-line bg-surface p-4 shadow-soft">
    <div class="mb-2 flex items-center justify-between gap-2">
      <div>
        <h2 class="text-sm font-semibold text-content-muted">{{ title ?? t('shopping.todaysShopping') }}</h2>
        <p class="mt-0.5 text-xl font-bold" :class="done ? 'text-success' : 'text-content'">
          {{ t('shopping.itemsLeft', { count: remaining }, remaining) }}
        </p>
      </div>
      <span class="text-sm font-semibold tabular-nums" :class="done ? 'text-success' : 'text-primary-strong'">
        {{ progress }}%
      </span>
    </div>

    <ProgressBar :value="progress" :tone="done ? 'success' : 'primary'" :label="t('shopping.todaysShopping')" />

    <div class="mt-2 flex items-center justify-between text-sm text-content-muted">
      <span>{{ t('shopping.itemsProgress', { checked, total }) }}</span>
      <span v-if="done" class="font-medium text-success">{{ t('shopping.allDone') }}</span>
    </div>

    <div v-if="estimatedTotal > 0" class="mt-4 grid grid-cols-3 gap-2 text-center">
      <div class="rounded-xl bg-surface-muted p-2">
        <div class="text-[11px] uppercase tracking-wide text-content-subtle">{{ t('shopping.picked') }}</div>
        <div class="mt-0.5 text-sm font-semibold text-success">
          {{ formatCurrency(picked, currency) }}
        </div>
      </div>
      <div class="rounded-xl bg-surface-muted p-2">
        <div class="text-[11px] uppercase tracking-wide text-content-subtle">{{ t('shopping.remaining') }}</div>
        <div class="mt-0.5 text-sm font-semibold text-warning">
          {{ formatCurrency(remainingCost, currency) }}
        </div>
      </div>
      <div class="rounded-xl bg-primary-soft p-2">
        <div class="text-[11px] uppercase tracking-wide text-primary-500/70">{{ t('shopping.total') }}</div>
        <div class="mt-0.5 text-sm font-semibold text-primary-strong">
          {{ formatCurrency(estimatedTotal, currency) }}
        </div>
      </div>
    </div>
  </div>
</template>
