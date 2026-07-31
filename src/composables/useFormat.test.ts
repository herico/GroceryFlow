import { describe, expect, it } from 'vitest'
import {
  formatQuantity,
  sanitizePrice,
  sanitizeQuantity,
  singularizeUnit,
} from './useFormat'

describe('singularizeUnit', () => {
  it('drops a trailing "s" for count nouns', () => {
    expect(singularizeUnit('botellas')).toBe('botella')
    expect(singularizeUnit('bottles')).toBe('bottle')
    expect(singularizeUnit('bouteilles')).toBe('bouteille')
    expect(singularizeUnit('bolsas')).toBe('bolsa')
  })

  it('leaves measures and doubled endings untouched', () => {
    expect(singularizeUnit('kg')).toBe('kg')
    expect(singularizeUnit('ml')).toBe('ml')
    expect(singularizeUnit('glass')).toBe('glass')
  })
})

describe('formatQuantity', () => {
  it('singularizes the unit when quantity is 1', () => {
    expect(formatQuantity(1, 'botellas')).toBe('1 botella')
  })

  it('keeps the plural unit for quantities above 1', () => {
    expect(formatQuantity(3, 'bolsas')).toBe('3 bolsas')
  })

  it('omits the unit when none is given', () => {
    expect(formatQuantity(2)).toBe('2')
  })
})

describe('sanitizePrice', () => {
  it('accepts valid non-negative numbers', () => {
    expect(sanitizePrice(1.45)).toBe(1.45)
    expect(sanitizePrice(0)).toBe(0)
  })

  it('rejects NaN and negative values', () => {
    expect(sanitizePrice(NaN)).toBeUndefined()
    expect(sanitizePrice(-2)).toBeUndefined()
    expect(sanitizePrice('x')).toBeUndefined()
  })
})

describe('sanitizeQuantity', () => {
  it('defaults invalid values to 1', () => {
    expect(sanitizeQuantity(NaN)).toBe(1)
    expect(sanitizeQuantity(0)).toBe(1)
    expect(sanitizeQuantity(-3)).toBe(1)
  })

  it('keeps valid positive values', () => {
    expect(sanitizeQuantity(4)).toBe(4)
  })
})
