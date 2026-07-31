<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue'

withDefaults(defineProps<{ label?: string; icon?: string }>(), { icon: 'plus' })
defineEmits<{ click: [] }>()
</script>

<template>
  <Teleport to="body">
    <button
      class="fab-in tap-scale fixed bottom-20 right-4 z-30 flex h-14 items-center gap-2 rounded-2xl bg-primary-500 px-5 text-white shadow-lift transition-colors hover:bg-primary-600"
      style="margin-bottom: env(safe-area-inset-bottom)"
      :aria-label="label"
      :title="label"
      @click="$emit('click')"
    >
      <AppIcon :name="icon" :size="24" />
      <span v-if="label" class="pr-1 font-semibold">{{ label }}</span>
    </button>
  </Teleport>
</template>

<style scoped>
/* Gentle entrance so the (teleported) button appears smoothly with the page
   instead of popping in. Runs once each time the Lists page mounts. */
@keyframes fab-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.fab-in {
  animation: fab-in 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}
@media (prefers-reduced-motion: reduce) {
  .fab-in {
    animation: none;
  }
}
</style>
