<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'
import { useCategoriesStore } from '@/stores/categories'
import { useItemsStore } from '@/stores/items'
import { useNotificationsStore } from '@/stores/notifications'
import type { AppLocale, AppThemeMode, Category, SortMode } from '@/types'
import { SUPPORTED_LOCALES, LOCALE_LABELS } from '@/i18n'
import { THEMES, THEME_MODES, THEME_SWATCHES } from '@/services/theme'
import { OTHERS_CATEGORY_ID } from '@/services/categories.data'
import { downloadBackup, parseBackup, restoreBackup } from '@/services/backup'
import PageHeader from '@/components/layout/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSheet from '@/components/ui/BaseSheet.vue'
import IconPicker from '@/components/ui/IconPicker.vue'

const { t } = useI18n()
const settings = useSettingsStore()
const categories = useCategoriesStore()
const items = useItemsStore()
const notifications = useNotificationsStore()

const sortOptions = computed<{ value: SortMode; label: string }[]>(() => [
  { value: 'category', label: t('sort.category') },
  { value: 'added', label: t('sort.added') },
  { value: 'alphabetical', label: t('sort.alphabetical') },
  { value: 'manual', label: t('sort.manual') },
])

const languages: { value: AppLocale; label: string }[] = SUPPORTED_LOCALES.map((value) => ({
  value,
  label: LOCALE_LABELS[value],
}))

const themes = computed(() =>
  THEMES.map((value) => ({
    value,
    label: t(`themes.${value}`),
    swatch: THEME_SWATCHES[value],
  })),
)

const modeIcons: Record<AppThemeMode, string> = { system: 'settings', light: 'sun', dark: 'star' }
const modes = computed(() =>
  THEME_MODES.map((value) => ({ value, label: t(`modes.${value}`), icon: modeIcons[value] })),
)

const currencies = ['EUR', 'USD', 'GBP', 'CHF', 'SEK']

const newCatName = ref('')
const newCatEmoji = ref('🛒')

function addCategory() {
  const name = newCatName.value.trim()
  if (!name) return
  categories.addCategory(name, newCatEmoji.value.trim() || '🛒')
  newCatName.value = ''
  newCatEmoji.value = '🛒'
}

function moveCategory(index: number, direction: 'up' | 'down') {
  const ids = categories.ordered.map((c) => c.id)
  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= ids.length) return
  ;[ids[index], ids[target]] = [ids[target], ids[index]]
  settings.setCategoryOrder(ids)
}

function deleteCategory(category: Category) {
  if (!confirm(t('settings.deleteCategoryConfirm'))) return
  items.reassignCategory(category.id, OTHERS_CATEGORY_ID)
  settings.setCategoryOrder(
    categories.ordered.map((c) => c.id).filter((id) => id !== category.id),
  )
  categories.removeCategory(category.id)
}

const editingId = ref<string | null>(null)
const editName = ref('')
const editEmoji = ref('🛒')

function startEdit(category: Category) {
  editingId.value = category.id
  editName.value = category.name
  editEmoji.value = category.emoji
}

function cancelEdit() {
  editingId.value = null
  editName.value = ''
  editEmoji.value = '🛒'
}

function saveEdit() {
  const name = editName.value.trim()
  if (!editingId.value || !name) return
  categories.updateCategory(editingId.value, {
    name,
    emoji: editEmoji.value.trim() || '🛒',
  })
  cancelEdit()
}

// --- Data backup -------------------------------------------------------------
const fileInput = ref<HTMLInputElement | null>(null)

function exportData() {
  downloadBackup()
  notifications.notify({ type: 'success', message: t('settings.exportDone') })
}

function chooseImportFile() {
  fileInput.value?.click()
}

async function onImportFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const backup = parseBackup(await file.text())
  if (!backup) {
    notifications.notify({ type: 'error', message: t('settings.importInvalid') })
    return
  }
  if (!confirm(t('settings.importConfirm'))) return
  restoreBackup(backup)
}
</script>

<template>
  <main class="px-4 pb-32 pt-4">
    <PageHeader :title="t('settings.title')" :subtitle="t('settings.subtitle')" />

    <div class="space-y-6">
      <section class="rounded-2xl border border-line bg-surface p-4 shadow-soft">
        <h2 class="mb-3 text-sm font-semibold text-content-muted">{{ t('settings.appearance') }}</h2>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="m in modes"
            :key="m.value"
            class="tap-scale flex flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors"
            :class="
              settings.settings.mode === m.value
                ? 'border-primary-300 bg-primary-soft text-primary-strong'
                : 'border-line text-content-muted'
            "
            :aria-pressed="settings.settings.mode === m.value"
            @click="settings.setMode(m.value)"
          >
            <AppIcon :name="m.icon" :size="18" />
            {{ m.label }}
          </button>
        </div>
      </section>

      <section class="rounded-2xl border border-line bg-surface p-4 shadow-soft">
        <h2 class="mb-3 text-sm font-semibold text-content-muted">{{ t('settings.language') }}</h2>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="lang in languages"
            :key="lang.value"
            class="tap-scale rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors"
            :class="
              settings.settings.locale === lang.value
                ? 'border-primary-300 bg-primary-soft text-primary-strong'
                : 'border-line text-content-muted'
            "
            @click="settings.setLocale(lang.value)"
          >
            {{ lang.label }}
          </button>
        </div>
      </section>

      <section class="rounded-2xl border border-line bg-surface p-4 shadow-soft">
        <h2 class="mb-3 text-sm font-semibold text-content-muted">{{ t('settings.themeColor') }}</h2>
        <div class="flex flex-wrap gap-4">
          <button
            v-for="th in themes"
            :key="th.value"
            type="button"
            class="tap-scale flex flex-col items-center gap-1.5"
            :aria-label="th.label"
            :aria-pressed="settings.settings.theme === th.value"
            @click="settings.setTheme(th.value)"
          >
            <span
              class="flex h-11 w-11 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-surface transition-all"
              :class="settings.settings.theme === th.value ? 'ring-content' : 'ring-transparent'"
              :style="{ backgroundColor: th.swatch }"
            >
              <AppIcon
                v-if="settings.settings.theme === th.value"
                name="check"
                :size="20"
                class="text-white"
              />
            </span>
            <span
              class="text-xs font-medium"
              :class="settings.settings.theme === th.value ? 'text-content' : 'text-content-muted'"
              >{{ th.label }}</span
            >
          </button>
        </div>
      </section>

      <section class="rounded-2xl border border-line bg-surface p-4 shadow-soft">
        <h2 class="mb-3 text-sm font-semibold text-content-muted">{{ t('settings.defaultSorting') }}</h2>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="opt in sortOptions"
            :key="opt.value"
            class="tap-scale rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors"
            :class="
              settings.settings.sortMode === opt.value
                ? 'border-primary-300 bg-primary-soft text-primary-strong'
                : 'border-line text-content-muted'
            "
            @click="settings.setSortMode(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </section>

      <section class="rounded-2xl border border-line bg-surface p-4 shadow-soft">
        <h2 class="mb-3 text-sm font-semibold text-content-muted">{{ t('settings.budgetCurrency') }}</h2>
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <label class="text-sm text-content-muted">{{ t('settings.currency') }}</label>
            <select
              :value="settings.settings.currency"
              class="rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none"
              @change="settings.setCurrency(($event.target as HTMLSelectElement).value)"
            >
              <option v-for="c in currencies" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="flex items-center justify-between gap-3">
            <label class="text-sm text-content-muted">{{ t('settings.weeklyBudget') }}</label>
            <input
              :value="settings.settings.weeklyBudget ?? ''"
              type="number"
              min="0"
              step="1"
              inputmode="decimal"
              placeholder="—"
              class="w-28 rounded-xl border border-line px-3 py-2 text-right text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              @input="
                settings.setWeeklyBudget(
                  ($event.target as HTMLInputElement).value
                    ? Number(($event.target as HTMLInputElement).value)
                    : undefined,
                )
              "
            />
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-line bg-surface p-4 shadow-soft">
        <h2 class="text-sm font-semibold text-content-muted">{{ t('settings.categories') }}</h2>
        <p class="mb-3 mt-0.5 text-xs text-content-subtle">{{ t('settings.aisleOrderHint') }}</p>
        <ul class="space-y-1.5">
          <li
            v-for="(c, index) in categories.ordered"
            :key="c.id"
            class="flex items-center gap-2 rounded-xl border border-line px-2.5 py-2"
          >
            <div class="flex flex-col text-content-subtle">
              <button
                class="tap-scale rounded p-0.5 disabled:opacity-30"
                :disabled="index === 0"
                :aria-label="t('common.moveUp')"
                :title="t('common.moveUp')"
                @click="moveCategory(index, 'up')"
              >
                <span class="block rotate-180"><AppIcon name="chevron" :size="16" /></span>
              </button>
              <button
                class="tap-scale rounded p-0.5 disabled:opacity-30"
                :disabled="index === categories.ordered.length - 1"
                :aria-label="t('common.moveDown')"
                :title="t('common.moveDown')"
                @click="moveCategory(index, 'down')"
              >
                <AppIcon name="chevron" :size="16" />
              </button>
            </div>
            <span class="text-lg">{{ c.emoji }}</span>
            <span class="flex-1 truncate text-sm font-medium">{{ c.name }}</span>
            <template v-if="!c.builtIn">
              <button
                class="touch-target tap-scale rounded-lg p-1.5 text-content-subtle hover:text-primary-strong"
                :aria-label="t('settings.editCategory')"
                :title="t('settings.editCategory')"
                @click="startEdit(c)"
              >
                <AppIcon name="edit" :size="16" />
              </button>
              <button
                class="touch-target tap-scale rounded-lg p-1.5 text-content-subtle hover:text-danger"
                :aria-label="t('common.delete')"
                :title="t('common.delete')"
                @click="deleteCategory(c)"
              >
                <AppIcon name="trash" :size="16" />
              </button>
            </template>
          </li>
        </ul>

        <form class="mt-4 flex items-center gap-2" @submit.prevent="addCategory">
          <IconPicker v-model="newCatEmoji" />
          <input
            v-model="newCatName"
            :placeholder="t('settings.newCategoryName')"
            class="min-w-0 flex-1 rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
          />
          <BaseButton size="sm" type="submit">{{ t('common.add') }}</BaseButton>
        </form>
      </section>

      <section class="rounded-2xl border border-line bg-surface p-4 shadow-soft">
        <h2 class="text-sm font-semibold text-content-muted">{{ t('settings.data') }}</h2>
        <p class="mb-3 mt-0.5 text-xs text-content-subtle">{{ t('settings.dataHint') }}</p>
        <div class="flex gap-2">
          <BaseButton variant="soft" block @click="exportData">
            <AppIcon name="download" :size="18" /> {{ t('settings.exportData') }}
          </BaseButton>
          <BaseButton variant="ghost" block @click="chooseImportFile">
            <AppIcon name="upload" :size="18" /> {{ t('settings.importData') }}
          </BaseButton>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="application/json,.json"
          class="hidden"
          @change="onImportFile"
        />
      </section>

      <BaseSheet :open="!!editingId" :title="t('settings.editCategory')" @close="cancelEdit">
        <form class="space-y-4" @submit.prevent="saveEdit">
          <div class="flex items-center gap-2">
            <IconPicker v-model="editEmoji" />
            <input
              v-model="editName"
              :placeholder="t('settings.newCategoryName')"
              class="min-w-0 flex-1 rounded-xl border border-line px-3 py-2.5 text-[15px] outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div class="flex gap-2 pt-1">
            <BaseButton variant="ghost" block type="button" @click="cancelEdit">{{
              t('common.cancel')
            }}</BaseButton>
            <BaseButton block type="submit">{{ t('common.save') }}</BaseButton>
          </div>
        </form>
      </BaseSheet>

      <p class="pt-2 text-center text-xs text-content-subtle">
        {{ t('settings.footer') }}
      </p>
    </div>
  </main>
</template>
