<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useNotificationsStore } from '@/stores/notifications'
import AppIcon from '@/components/ui/AppIcon.vue'

const { t } = useI18n()
const notifications = useNotificationsStore()

const toneClass: Record<string, string> = {
  info: 'border-line bg-surface text-content',
  success: 'border-success/30 bg-surface text-content',
  warning: 'border-warning/40 bg-surface text-content',
  error: 'border-danger/40 bg-surface text-content',
}

const accentClass: Record<string, string> = {
  info: 'text-primary-strong',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-danger',
}
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed inset-x-0 bottom-24 z-50 mx-auto flex max-w-md flex-col gap-2 px-4"
      style="margin-bottom: env(safe-area-inset-bottom)"
      role="status"
      aria-live="polite"
      aria-atomic="false"
    >
      <TransitionGroup name="toast">
        <div
          v-for="n in notifications.items"
          :key="n.id"
          class="pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5 shadow-lift backdrop-blur"
          :class="toneClass[n.type]"
        >
          <p class="min-w-0 flex-1 text-sm" :class="accentClass[n.type]">{{ n.message }}</p>
          <button
            v-if="n.actionLabel"
            class="tap-scale shrink-0 rounded-lg bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary-strong hover:bg-primary-soft-hover"
            @click="notifications.runAction(n.id)"
          >
            {{ n.actionLabel }}
          </button>
          <button
            class="tap-scale shrink-0 rounded-lg p-1 text-content-subtle hover:text-content"
            :aria-label="t('common.close')"
            :title="t('common.close')"
            @click="notifications.dismiss(n.id)"
          >
            <AppIcon name="x" :size="16" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
.toast-move {
  transition: transform 0.22s ease;
}
</style>
