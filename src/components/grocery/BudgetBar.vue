<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatCurrency } from '@/composables/useFormat'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{ spent: number; budget: number; currency: string }>()

const { t } = useI18n()

const percent = computed(() => (props.budget > 0 ? (props.spent / props.budget) * 100 : 0))
const over = computed(() => props.spent > props.budget)
const remaining = computed(() => props.budget - props.spent)

const tone = computed<'primary' | 'success' | 'warning' | 'danger'>(() => {
  if (over.value) return 'danger'
  if (percent.value >= 80) return 'warning'
  return 'success'
})

const statusClass = computed(() =>
  over.value ? 'text-danger' : percent.value >= 80 ? 'text-warning' : 'text-success',
)
</script>

<template>
  <div class="rounded-2xl border border-line bg-surface p-4 shadow-soft">
    <div class="mb-2 flex items-baseline justify-between gap-2">
      <h2 class="text-sm font-semibold text-content-muted">{{ t('budget.label') }}</h2>
      <span class="text-sm font-medium tabular-nums text-content-muted">
        {{ t('budget.ofBudget', { budget: formatCurrency(budget, currency) }) }}
      </span>
    </div>

    <ProgressBar :value="percent" :tone="tone" :label="t('budget.label')" />

    <div class="mt-2 flex items-center gap-1.5 text-sm font-medium" :class="statusClass">
      <AppIcon :name="over ? 'x' : 'check'" :size="16" />
      <span v-if="over">{{ t('budget.over', { amount: formatCurrency(-remaining, currency) }) }}</span>
      <span v-else>{{ t('budget.left', { amount: formatCurrency(remaining, currency) }) }}</span>
    </div>
  </div>
</template>
