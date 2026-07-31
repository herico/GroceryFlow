import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { GroceryItem, ShoppingList } from '@/types'
import { CollectionRepository, persistDebounced } from '@/services/repository'
import { uid, now } from '@/composables/useFormat'
import { i18n } from '@/i18n'
import { useItemsStore } from './items'

const repo = new CollectionRepository<ShoppingList>('lists')

function fallbackTitle(): string {
  return i18n.global.t('home.defaultListName')
}

export const useListsStore = defineStore('lists', () => {
  const lists = ref<ShoppingList[]>(repo.all())

  persistDebounced(lists, (val) => repo.saveAll(val))

  const activeLists = computed(() =>
    lists.value
      .filter((l) => !l.archived)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  )

  const archivedLists = computed(() =>
    lists.value
      .filter((l) => l.archived)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  )

  function getList(id: string): ShoppingList | undefined {
    return lists.value.find((l) => l.id === id)
  }

  function createList(title = ''): ShoppingList {
    const list: ShoppingList = {
      id: uid(),
      title: title.trim() || fallbackTitle(),
      createdAt: now(),
      updatedAt: now(),
      archived: false,
    }
    lists.value.unshift(list)
    return list
  }

  function renameList(id: string, title: string) {
    const list = getList(id)
    if (list) {
      list.title = title.trim() || list.title
      touch(id)
    }
  }

  function touch(id: string) {
    const list = getList(id)
    if (list) list.updatedAt = now()
  }

  function setArchived(id: string, archived: boolean) {
    const list = getList(id)
    if (list) {
      list.archived = archived
      list.updatedAt = now()
    }
  }

  function deleteList(id: string) {
    const items = useItemsStore()
    items.removeItemsForList(id)
    lists.value = lists.value.filter((l) => l.id !== id)
  }

  function restoreDeletedList(listSnapshot: ShoppingList, listItems: GroceryItem[]) {
    if (getList(listSnapshot.id)) return
    lists.value = [{ ...listSnapshot }, ...lists.value]
    const items = useItemsStore()
    items.restoreItemsForList(listSnapshot.id, listItems.map((item) => ({ ...item })))
  }

  function duplicateList(id: string): ShoppingList | undefined {
    const source = getList(id)
    if (!source) return undefined
    const copy = createList(`${source.title} (${i18n.global.t('common.copySuffix')})`)
    copy.archived = false
    const items = useItemsStore()
    items.duplicateItemsToList(id, copy.id)
    return copy
  }

  return {
    lists,
    activeLists,
    archivedLists,
    getList,
    createList,
    renameList,
    touch,
    setArchived,
    deleteList,
    restoreDeletedList,
    duplicateList,
  }
})
