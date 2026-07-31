<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'

const { t } = useI18n()

const tabs = computed(() => [
  { to: '/', label: t('nav.lists'), icon: 'home' },
  { to: '/favorites', label: t('nav.favorites'), icon: 'star' },
  { to: '/settings', label: t('nav.settings'), icon: 'settings' },
])
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-surface/85 backdrop-blur-lg"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <div class="mx-auto flex max-w-md items-stretch justify-around px-2">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="tap-scale flex flex-1 flex-col items-center gap-0.5 py-2.5 text-content-subtle transition-colors"
        active-class="!text-primary-strong"
        exact-active-class="!text-primary-strong"
      >
        <AppIcon :name="tab.icon" :size="24" />
        <span class="text-[11px] font-medium">{{ tab.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>
