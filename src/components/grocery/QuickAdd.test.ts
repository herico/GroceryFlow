// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import QuickAdd from './QuickAdd.vue'
import { i18n, setLocale } from '@/i18n'
import { useCategoriesStore } from '@/stores/categories'
import { useFavoritesStore } from '@/stores/favorites'

function mountQuickAdd() {
  const pinia = createPinia()
  setActivePinia(pinia)
  useCategoriesStore()
  useFavoritesStore()
  return mount(QuickAdd, {
    global: {
      plugins: [pinia, i18n],
    },
  })
}

beforeEach(() => {
  localStorage.clear()
  setLocale('en')
})

describe('QuickAdd details action', () => {
  it('keeps Add details disabled until an item name is entered', async () => {
    const wrapper = mountQuickAdd()
    const detailsButton = wrapper.get('[data-testid="quickadd-details-button"]')

    expect((detailsButton.element as HTMLButtonElement).disabled).toBe(true)

    await wrapper.get('input[type="text"]').setValue('Milk')

    expect((detailsButton.element as HTMLButtonElement).disabled).toBe(false)
  })

  it('emits expand with the typed name when Add details is clicked', async () => {
    const wrapper = mountQuickAdd()

    await wrapper.get('input[type="text"]').setValue('Milk')
    await wrapper.get('[data-testid="quickadd-details-button"]').trigger('click')

    const event = wrapper.emitted('expand')
    expect(event).toHaveLength(1)
    expect(event?.[0]?.[0]).toMatchObject({ name: 'Milk' })
    expect(event?.[0]?.[0].categoryId).toEqual(expect.any(String))
  })
})
