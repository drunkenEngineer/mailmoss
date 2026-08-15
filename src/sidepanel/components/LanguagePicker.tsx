import { LOCALES, isLocale, localeNames, useLocale, useT } from '@/i18n'

export function LanguagePicker() {
  const { locale, setLocale } = useLocale()
  const t = useT()

  return (
    <label className="flex items-center gap-1 text-xs text-slate-500">
      <span className="sr-only">{t('languageLabel')}</span>
      <select
        className="rounded border border-slate-200 bg-white px-1 py-0.5 text-xs"
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
