import { LOCALES, isLocale, localeNames, useLocale, useT } from '@/i18n'

export function LanguagePicker() {
  const { locale, setLocale } = useLocale()
  const t = useT()

  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="sr-only">{t('languageLabel')}</span>
      <select
        className="rounded border border-line bg-raised px-1.5 py-1 text-xs text-ink"
        value={locale}
        onChange={(event) => {
          if (isLocale(event.target.value)) setLocale(event.target.value)
        }}
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {localeNames[code]}
          </option>
        ))}
      </select>
    </label>
  )
}
