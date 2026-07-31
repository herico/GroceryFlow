<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useListsStore } from '@/stores/lists'
import { useItemsStore } from '@/stores/items'
import { useCategoriesStore } from '@/stores/categories'
import { useNotificationsStore } from '@/stores/notifications'
import { formatShortDate, formatQuantity } from '@/composables/useFormat'
import { filterItems } from '@/composables/useItemSort'
import PageHeader from '@/components/layout/PageHeader.vue'
import ListCard from '@/components/grocery/ListCard.vue'
import FloatingActionButton from '@/components/layout/FloatingActionButton.vue'
import BaseSheet from '@/components/ui/BaseSheet.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const { t } = useI18n()
const router = useRouter()
const lists = useListsStore()
const items = useItemsStore()
const categories = useCategoriesStore()
const notifications = useNotificationsStore()

const showArchived = ref(false)

const promptOpen = ref(false)
const promptTitle = ref('')
const editingId = ref<string | null>(null)
const draft = ref('')

// --- Global search across all lists -----------------------------------------
const search = ref('')
const query = computed(() => search.value.trim())

const listResults = computed(() => {
  const q = query.value.toLowerCase()
  if (!q) return []
  return lists.activeLists.filter((l) => l.title.toLowerCase().includes(q))
})

const itemResults = computed(() => {
  if (!query.value) return []
  const activeIds = new Set(lists.activeLists.map((l) => l.id))
  const matches = filterItems(items.allItems, query.value).filter((i) => activeIds.has(i.listId))
  const byList = new Map<string, typeof matches>()
  matches.forEach((i) => {
    const arr = byList.get(i.listId) ?? []
    arr.push(i)
    byList.set(i.listId, arr)
  })
  return lists.activeLists
    .filter((l) => byList.has(l.id))
    .map((l) => ({ list: l, items: byList.get(l.id)! }))
})

const hasResults = computed(() => listResults.value.length > 0 || itemResults.value.length > 0)

function openList(id: string) {
  router.push({ name: 'list', params: { id } })
}

const subtitle = computed(() => {
  const n = lists.activeLists.length
  return n ? t('home.subtitleActive', { count: n }, n) : t('home.subtitleEmpty')
})

function openCreate() {
  editingId.value = null
  promptTitle.value = t('home.newList')
  draft.value = t('home.datedListName', { date: formatShortDate() })
  promptOpen.value = true
}

function openRename(id: string) {
  const list = lists.getList(id)
  if (!list) return
  editingId.value = id
  promptTitle.value = t('home.renameList')
  draft.value = list.title
  promptOpen.value = true
}

function confirmPrompt() {
  const value = draft.value.trim()
  if (editingId.value) {
    if (value) lists.renameList(editingId.value, value)
  } else {
    const list = lists.createList(value)
    promptOpen.value = false
    router.push({ name: 'list', params: { id: list.id } })
    return
  }
  promptOpen.value = false
}

function duplicate(id: string) {
  lists.duplicateList(id)
}

function archive(id: string) {
  const list = lists.getList(id)
  if (!list) return
  const title = list.title
  lists.setArchived(id, true)
  notifications.notify({
    message: t('home.archivedNotice', { title }),
    actionLabel: t('common.undo'),
    onAction: () => lists.setArchived(id, false),
    timeout: 8000,
  })
}

function remove(id: string) {
  const list = lists.getList(id)
  if (!list) return
  if (!confirm(t('home.deleteConfirm'))) return
  const listSnapshot = { ...list }
  const itemSnapshots = items.itemsForList(id).map((item) => ({ ...item }))
  lists.deleteList(id)
  notifications.notify({
    message: t('home.deletedNotice', { title: listSnapshot.title }),
    actionLabel: t('common.undo'),
    onAction: () => lists.restoreDeletedList(listSnapshot, itemSnapshots),
    timeout: 8000,
  })
}
</script>

<template>
  <main class="px-4 pb-32 pt-4">
    <PageHeader title="GroceryFlow" :subtitle="subtitle" />

    <div
      v-if="lists.activeLists.length || query"
      class="mb-3 flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2"
    >
      <span class="text-content-subtle"><AppIcon name="search" :size="18" /></span>
      <input
        v-model="search"
        :placeholder="t('home.searchAll')"
        class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-content-subtle"
      />
      <button
        v-if="query"
        class="touch-target text-content-subtle"
        :aria-label="t('common.clear')"
        :title="t('common.clear')"
        @click="search = ''"
      >
        <AppIcon name="x" :size="16" />
      </button>
    </div>

    <!-- Search results -->
    <template v-if="query">
      <div v-if="hasResults" class="space-y-5">
        <section v-if="listResults.length">
          <h2 class="mb-2 text-xs font-semibold uppercase tracking-wide text-content-subtle">
            {{ t('home.resultsLists') }}
          </h2>
          <div class="space-y-2">
            <button
              v-for="l in listResults"
              :key="l.id"
              class="tap-scale flex w-full items-center justify-between rounded-2xl border border-line bg-surface p-3 text-left shadow-soft hover:border-primary-300"
              @click="openList(l.id)"
            >
              <span class="truncate font-medium text-content">{{ l.title }}</span>
              <AppIcon name="back" :size="18" class="shrink-0 rotate-180 text-content-subtle" />
            </button>
          </div>
        </section>

        <section v-if="itemResults.length">
          <h2 class="mb-2 text-xs font-semibold uppercase tracking-wide text-content-subtle">
            {{ t('home.resultsItems') }}
          </h2>
          <div class="space-y-2">
            <template v-for="grp in itemResults" :key="grp.list.id">
              <button
                v-for="it in grp.items"
                :key="it.id"
                class="tap-scale flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-left shadow-soft hover:border-primary-300"
                @click="openList(grp.list.id)"
              >
                <span class="text-xl">{{ categories.get(it.categoryId).emoji }}</span>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-medium text-content">{{ it.name }}</p>
                  <p class="truncate text-xs text-content-subtle">
                    {{ formatQuantity(it.quantity, it.unit) }} · {{ t('home.inList', { list: grp.list.title }) }}
                  </p>
                </div>
              </button>
            </template>
          </div>
        </section>
      </div>
      <div v-else class="mt-16 text-center text-sm text-content-subtle">
        {{ t('home.noResults', { query }) }}
      </div>
    </template>

    <template v-else>
      <section v-if="lists.activeLists.length" class="space-y-3">
        <ListCard
          v-for="list in lists.activeLists"
          :key="list.id"
          :list="list"
          @open="router.push({ name: 'list', params: { id: list.id } })"
          @shop="router.push({ name: 'shopping', params: { id: list.id } })"
          @rename="openRename(list.id)"
          @duplicate="duplicate(list.id)"
          @archive="archive(list.id)"
          @remove="remove(list.id)"
        />
      </section>

      <div
        v-else
        class="mt-16 flex flex-col items-center gap-3 text-center text-content-subtle"
      >
        <div class="text-5xl">🛒</div>
        <p class="max-w-[16rem] text-sm">
          {{ t('home.emptyText') }}
        </p>
        <BaseButton class="mt-1" @click="openCreate">{{ t('home.createList') }}</BaseButton>
      </div>

      <section v-if="lists.archivedLists.length" class="mt-8">
        <button
          class="mb-3 flex w-full items-center justify-between text-sm font-medium text-content-muted"
          @click="showArchived = !showArchived"
        >
          <span>{{ t('home.archived', { count: lists.archivedLists.length }) }}</span>
          <span class="text-xs text-primary-strong">{{ showArchived ? t('home.hide') : t('home.show') }}</span>
        </button>
        <div v-if="showArchived" class="space-y-3 opacity-80">
          <ListCard
            v-for="list in lists.archivedLists"
            :key="list.id"
            :list="list"
            @open="router.push({ name: 'list', params: { id: list.id } })"
            @shop="router.push({ name: 'shopping', params: { id: list.id } })"
            @rename="openRename(list.id)"
            @duplicate="duplicate(list.id)"
            @restore="lists.setArchived(list.id, false)"
            @remove="remove(list.id)"
          />
        </div>
      </section>
    </template>

    <FloatingActionButton
      v-if="lists.activeLists.length || query"
      :label="t('home.newList')"
      @click="openCreate"
    />

    <BaseSheet :open="promptOpen" :title="promptTitle" @close="promptOpen = false">
      <form class="space-y-4" @submit.prevent="confirmPrompt">
        <input
          v-model="draft"
          autofocus
          :placeholder="t('home.listNamePlaceholder')"
          class="w-full rounded-xl border border-line px-3 py-2.5 text-[15px] outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
        />
        <div class="flex gap-2">
          <BaseButton variant="ghost" block type="button" @click="promptOpen = false">{{ t('common.cancel') }}</BaseButton>
          <BaseButton block type="submit">{{ editingId ? t('common.save') : t('common.create') }}</BaseButton>
        </div>
      </form>
    </BaseSheet>
  </main>
</template>
