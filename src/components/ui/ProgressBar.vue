<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    value: number
    tone?: 'primary' | 'success' | 'warning' | 'danger'
    label?: string
  }>(),
  { tone: 'primary' },
)

const toneClass: Record<string, string> = {
  primary: 'bg-primary-500',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}
</script>

<template>
  <div
    class="h-2.5 w-full overflow-hidden rounded-full bg-line/80"
    role="progressbar"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="Math.round(Math.min(100, Math.max(0, props.value)))"
    :aria-label="props.label"
  >
    <div
      class="h-full rounded-full transition-[width] duration-500 ease-out"
      :class="toneClass[props.tone]"
      :style="{ width: `${Math.min(100, Math.max(0, props.value))}%` }"
    />
  </div>
</template>
