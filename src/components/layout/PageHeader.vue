<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'

withDefaults(defineProps<{ title: string; subtitle?: string; back?: boolean }>(), {
  back: false,
})

const router = useRouter()
const { t } = useI18n()

function goBack() {
  // Fall back to Home when the app was deep-linked (no in-app history to pop).
  if (window.history.state?.back) router.back()
  else router.push('/')
}
</script>

<template>
  <header class="mb-5 flex items-center gap-3 pt-2">
    <button
      v-if="back"
      class="touch-target tap-scale -ml-2 rounded-full p-2 text-content-muted hover:bg-surface-hover"
      :aria-label="t('common.back')"
      :title="t('common.back')"
      @click="goBack"
    >
      <AppIcon name="back" :size="22" />
    </button>
    <div class="min-w-0 flex-1">
      <h1 class="truncate text-2xl font-bold tracking-tight">{{ title }}</h1>
      <p v-if="subtitle" class="mt-0.5 truncate text-sm text-content-muted">{{ subtitle }}</p>
    </div>
    <slot name="actions" />
  </header>
</template>
