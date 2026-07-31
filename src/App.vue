<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BottomNav from '@/components/layout/BottomNav.vue'
import ToastHost from '@/components/layout/ToastHost.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSheet from '@/components/ui/BaseSheet.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { onStorageError } from '@/services/storage'
import { useInstallPrompt } from '@/services/installPrompt'
import { useNotificationsStore } from '@/stores/notifications'

const { t } = useI18n()
const notifications = useNotificationsStore()
const {
  open: installPromptOpen,
  helpAvailable,
  canInstallNatively,
  showIosInstructions,
  requestInstall,
  dismissSheet,
} = useInstallPrompt()

const showGenericInstructions = computed(
  () => helpAvailable.value && !showIosInstructions.value && !canInstallNatively.value,
)

async function installApp() {
  await requestInstall()
}

function closeInstallPrompt() {
  dismissSheet()
}

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

    <BaseSheet :open="installPromptOpen" :title="t('installPrompt.title')" @close="closeInstallPrompt">
      <div class="space-y-4">
        <p class="text-sm text-content-muted">
          {{ t('installPrompt.subtitle') }}
        </p>

        <div v-if="showIosInstructions" class="rounded-xl bg-surface-muted p-3 text-sm text-content-muted">
          <p class="mb-2 font-medium text-content">{{ t('installPrompt.iosTitle') }}</p>
          <ol class="list-decimal space-y-1 pl-5">
            <li>{{ t('installPrompt.iosStep1') }}</li>
            <li>{{ t('installPrompt.iosStep2') }}</li>
            <li>{{ t('installPrompt.iosStep3') }}</li>
          </ol>
        </div>

        <div v-else-if="showGenericInstructions" class="rounded-xl bg-surface-muted p-3 text-sm text-content-muted">
          <p class="mb-2 font-medium text-content">{{ t('installPrompt.menuTitle') }}</p>
          <ol class="list-decimal space-y-1 pl-5">
            <li>{{ t('installPrompt.menuStep1') }}</li>
            <li>{{ t('installPrompt.menuStep2') }}</li>
          </ol>
        </div>

        <div class="flex gap-2 pt-1">
          <BaseButton v-if="canInstallNatively" block @click="installApp">
            <AppIcon name="download" :size="18" /> {{ t('installPrompt.installButton') }}
          </BaseButton>
          <BaseButton :variant="canInstallNatively ? 'ghost' : 'soft'" block @click="closeInstallPrompt">
            {{ t('installPrompt.notNow') }}
          </BaseButton>
        </div>
      </div>
    </BaseSheet>
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
