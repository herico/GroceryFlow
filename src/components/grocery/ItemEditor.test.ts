// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ItemEditor from './ItemEditor.vue'
import { i18n, setLocale } from '@/i18n'
import type { GroceryItem } from '@/types'

function mountItemEditor(props: Partial<{ item: GroceryItem; initialName: string; initialCategoryId: string }> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)

  return mount(ItemEditor, {
    props,
    global: {
      plugins: [pinia, i18n],
    },
  })
}

beforeEach(() => {
  localStorage.clear()
  setLocale('en')
})

describe('ItemEditor progressive disclosure', () => {
  it('keeps category picker collapsed by default and opens it on demand', async () => {
    const wrapper = mountItemEditor()

    expect(wrapper.find('input[aria-label="Search category"]').exists()).toBe(false)

    await wrapper.get('[data-testid="item-editor-category-button"]').trigger('click')

    expect(document.body.querySelector('[data-testid="item-editor-category-picker"]')).not.toBeNull()
  })

  it('starts with advanced options collapsed in create mode', () => {
    const wrapper = mountItemEditor()
    const toggle = wrapper.get('[data-testid="item-editor-advanced-toggle"]')

    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(wrapper.get('[data-testid="item-editor-advanced"]').isVisible()).toBe(false)
  })

  it('starts with advanced options expanded in edit mode', () => {
    const item: GroceryItem = {
      id: 'item-1',
      listId: 'list-1',
      name: 'Milk',
      quantity: 2,
      unit: 'bottle',
      categoryId: 'dairy',
      estimatedPrice: 1.99,
      checked: false,
      favorite: true,
      notes: 'Skim',
      order: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
    }

    const wrapper = mountItemEditor({ item })
    const toggle = wrapper.get('[data-testid="item-editor-advanced-toggle"]')

    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('[data-testid="item-editor-advanced"]').isVisible()).toBe(true)
  })

  it('submits unchanged payload shape when advanced options remain collapsed', async () => {
    const wrapper = mountItemEditor()

    await wrapper.get('input[autofocus]').setValue('Tomato')
    await wrapper.get('form').trigger('submit.prevent')

    const submitted = wrapper.emitted('submit')
    expect(submitted).toHaveLength(1)
    expect(submitted?.[0]?.[0]).toMatchObject({
      name: 'Tomato',
      quantity: 1,
      unit: '',
      notes: '',
      favorite: false,
    })
    expect(submitted?.[0]?.[0].estimatedPrice).toBeNull()
  })
})
