<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseSheet from '@/components/ui/BaseSheet.vue'
import { CATEGORY_ICON_GROUPS } from '@/services/categoryIcons.data'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const { t } = useI18n()
const open = ref(false)

function select(icon: string) {
  emit('update:modelValue', icon)
  open.value = false
}
</script>

<template>
  <button
    type="button"
    class="tap-scale flex w-14 items-center justify-center rounded-xl border border-line px-2 py-2 text-xl outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
    :aria-label="t('iconPicker.choose')"
    @click="open = true"
  >
    {{ props.modelValue }}
  </button>

  <BaseSheet :open="open" :title="t('iconPicker.title')" @close="open = false">
    <div class="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
      <section v-for="group in CATEGORY_ICON_GROUPS" :key="group.id">
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-content-subtle">
          {{ t(`iconPicker.groups.${group.id}`) }}
        </h3>
        <div class="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
          <button
            v-for="icon in group.icons"
            :key="group.id + icon"
            type="button"
            class="tap-scale flex aspect-square items-center justify-center rounded-xl border text-xl transition-colors"
            :class="
              props.modelValue === icon
                ? 'border-primary-300 bg-primary-soft'
                : 'border-transparent hover:bg-surface-hover'
            "
            :aria-label="icon"
            :aria-pressed="props.modelValue === icon"
            @click="select(icon)"
          >
            {{ icon }}
          </button>
        </div>
      </section>
    </div>
  </BaseSheet>
</template>
