import { useT } from '@/i18n'
import type { MessageKey } from '@/i18n'
import { THEME_CHOICES, isThemeChoice, useTheme } from '@/theme'
import type { ThemeChoice } from '@/theme'

const LABELS: Record<ThemeChoice, MessageKey> = {
  system: 'themeSystem',
  light: 'themeLight',
  dark: 'themeDark',
}

export function ThemePicker() {
  const { choice, setChoice } = useTheme()
  const t = useT()

  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="text-muted">{t('themeLabel')}</span>
      <select
        className="rounded border border-line bg-raised px-1.5 py-1 text-xs text-ink"
        value={choice}
        onChange={(event) => {
          if (isThemeChoice(event.target.value)) setChoice(event.target.value)
        }}
      >
        {THEME_CHOICES.map((option) => (
          <option key={option} value={option}>
            {t(LABELS[option])}
          </option>
        ))}
      </select>
    </label>
  )
}
