<script setup lang="ts">
import { ref, watch } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  emoji: string
  name: string
  count: number
  checkedCount?: number
}>()

// In shopping mode (checkedCount provided) a category folds up once everything
// in it is picked, keeping attention on what's left.
const isAllPicked = () =>
  props.checkedCount != null && props.count > 0 && props.checkedCount === props.count

const open = ref(!isAllPicked())

watch(isAllPicked, (allPicked) => {
  if (props.checkedCount != null) open.value = !allPicked
})
</script>

<template>
  <section class="overflow-hidden rounded-2xl border border-line bg-surface/60 shadow-soft">
    <button
      class="tap-scale flex w-full items-center gap-2 px-4 py-3 text-left"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="text-lg">{{ emoji }}</span>
      <span class="flex-1 font-semibold text-content">{{ name }}</span>
      <span class="text-xs font-medium text-content-subtle">
        <template v-if="checkedCount != null">{{ checkedCount }}/</template>{{ count }}
      </span>
      <span
        class="text-content-subtle transition-transform duration-200"
        :class="open ? '' : '-rotate-90'"
      >
        <AppIcon name="chevron" :size="18" />
      </span>
    </button>
    <Transition name="collapse">
      <div v-show="open" class="space-y-2 px-3 pb-3">
        <slot />
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.collapse-enter-active,
.collapse-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
