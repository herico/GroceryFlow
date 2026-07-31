<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BottomNav from '@/components/layout/BottomNav.vue'
import ToastHost from '@/components/layout/ToastHost.vue'
import { onStorageError } from '@/services/storage'
import { useNotificationsStore } from '@/stores/notifications'

const { t } = useI18n()
const notifications = useNotificationsStore()

onMounted(() => {
  let lastWarned = 0
  onStorageError(() => {
    // Throttle so a burst of failed writes shows only one warning.
    const nowMs = Date.now()
    if (nowMs - lastWarned < 5000) return
    lastWarned = nowMs
    notifications.notify({ type: 'warning', message: t('common.storageFull'), timeout: 6000 })
  })
})
</script>

<template>
  <div class="mx-auto min-h-dvh max-w-md">
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
    <BottomNav />
    <ToastHost />
  </div>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
