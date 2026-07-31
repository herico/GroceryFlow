<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { uid } from '@/composables/useFormat'
import AppIcon from './AppIcon.vue'

const props = defineProps<{ open: boolean; title?: string }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()

const dialogRef = ref<HTMLElement | null>(null)
const keyboardOffset = ref(0)
const titleId = `sheet-${uid()}`
let previouslyFocused: HTMLElement | null = null

function updateKeyboardOffset() {
  const viewport = window.visualViewport
  if (!viewport) {
    keyboardOffset.value = 0
    return
  }
  const overlap = window.innerHeight - (viewport.height + viewport.offsetTop)
  keyboardOffset.value = overlap > 0 ? overlap : 0
}

function addViewportListeners() {
  const viewport = window.visualViewport
  if (!viewport) return
  updateKeyboardOffset()
  viewport.addEventListener('resize', updateKeyboardOffset)
  viewport.addEventListener('scroll', updateKeyboardOffset)
}

function removeViewportListeners() {
  const viewport = window.visualViewport
  if (!viewport) return
  viewport.removeEventListener('resize', updateKeyboardOffset)
  viewport.removeEventListener('scroll', updateKeyboardOffset)
}

function focusables(): HTMLElement[] {
  if (!dialogRef.value) return []
  return Array.from(
    dialogRef.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => el.offsetParent !== null)
}

function onKeydown(e: KeyboardEvent) {
  if (!props.open) return
  if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
    return
  }
  if (e.key === 'Tab') {
    const list = focusables()
    if (!list.length) return
    const first = list[0]
    const last = list[list.length - 1]
    const active = document.activeElement as HTMLElement | null
    if (e.shiftKey && active === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

watch(
  () => props.open,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) {
      previouslyFocused = document.activeElement as HTMLElement | null
      document.addEventListener('keydown', onKeydown)
      addViewportListeners()
      nextTick(() => {
        const el = dialogRef.value
        const preferred =
          el?.querySelector<HTMLElement>('[autofocus]') ??
          el?.querySelector<HTMLElement>('input, textarea, select') ??
          focusables()[0] ??
          el
        preferred?.focus()
      })
    } else {
      document.removeEventListener('keydown', onKeydown)
      removeViewportListeners()
      keyboardOffset.value = 0
      previouslyFocused?.focus?.()
      previouslyFocused = null
    }
  },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  removeViewportListeners()
  keyboardOffset.value = 0
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/40 backdrop-blur-sm sm:items-center"
        :style="{ paddingBottom: keyboardOffset ? `${keyboardOffset}px` : undefined }"
        @click.self="emit('close')"
      >
        <Transition name="sheet" appear>
          <div
            ref="dialogRef"
            class="max-h-[calc(100dvh-0.5rem)] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-lift outline-none sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="title ? titleId : undefined"
            tabindex="-1"
          >
            <div class="mb-4 flex items-center justify-between">
              <h2 :id="titleId" class="text-lg font-semibold">{{ title }}</h2>
              <button
                class="touch-target tap-scale rounded-full p-1.5 text-content-subtle hover:bg-surface-hover"
                :aria-label="t('common.close')"
                :title="t('common.close')"
                @click="emit('close')"
              >
                <AppIcon name="x" :size="20" />
              </button>
            </div>
            <slot />
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.sheet-enter-active {
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}
.sheet-enter-from {
  transform: translateY(24px);
}
</style>
