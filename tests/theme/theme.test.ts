import { describe, expect, it } from 'vitest'
import { THEME_CHOICES, isThemeChoice, resolveTheme } from '@/theme/theme'

describe('resolveTheme', () => {
  it('follows the browser when set to system', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })

  it('overrides the browser when a theme is chosen', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
})

describe('isThemeChoice', () => {
  it('accepts every supported choice', () => {
    for (const choice of THEME_CHOICES) expect(isThemeChoice(choice)).toBe(true)
  })

  it('rejects anything else, including stored rubbish', () => {
    expect(isThemeChoice('sepia')).toBe(false)
    expect(isThemeChoice('')).toBe(false)
    expect(isThemeChoice(null)).toBe(false)
    expect(isThemeChoice(1)).toBe(false)
  })
})
