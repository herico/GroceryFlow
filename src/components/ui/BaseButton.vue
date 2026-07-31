<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'ghost' | 'soft' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    block?: boolean
    type?: 'button' | 'submit'
  }>(),
  { variant: 'primary', size: 'md', block: false, type: 'button' },
)

const variants: Record<string, string> = {
  primary: 'bg-primary-500 text-white shadow-soft hover:bg-primary-600 active:bg-primary-700',
  ghost: 'bg-transparent text-content-muted hover:bg-surface-hover',
  soft: 'bg-primary-soft text-primary-strong hover:bg-primary-soft-hover',
  danger: 'bg-danger/10 text-danger hover:bg-danger/20',
}

const sizes: Record<string, string> = {
  sm: 'text-sm px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
  lg: 'text-base px-5 py-3 gap-2',
}
</script>

<template>
  <button
    :type="type"
    class="tap-scale inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
    :class="[variants[variant], sizes[size], block ? 'w-full' : '']"
  >
    <slot />
  </button>
</template>
