import { describe, expect, it } from 'vitest'
import { guessCategoryId } from './categoryKeywords.data'

describe('guessCategoryId', () => {
  it('maps common English products', () => {
    expect(guessCategoryId('milk')).toBe('dairy')
    expect(guessCategoryId('Tomato')).toBe('vegetables')
    expect(guessCategoryId('chicken breast')).toBe('meat')
    expect(guessCategoryId('sparkling water')).toBe('drinks')
  })

  it('maps Spanish and French products', () => {
    expect(guessCategoryId('leche')).toBe('dairy')
    expect(guessCategoryId('pomme')).toBe('fruits')
    expect(guessCategoryId('poisson')).toBe('fish')
  })

  it('matches simple plurals', () => {
    expect(guessCategoryId('tomatoes')).toBe('vegetables')
    expect(guessCategoryId('bananas')).toBe('fruits')
  })

  it('returns undefined when nothing matches', () => {
    expect(guessCategoryId('widget')).toBeUndefined()
    expect(guessCategoryId('')).toBeUndefined()
  })
})
