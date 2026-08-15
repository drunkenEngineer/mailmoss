import { LanguagePicker } from './components/LanguagePicker'
import { useT } from '@/i18n'

export function App() {
  const t = useT()

  return (
    <div className="flex h-full flex-col bg-white text-slate-900">
      <header className="flex items-start justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div>
          <h1 className="text-sm font-semibold">{t('appName')}</h1>
          <p className="text-xs text-slate-500">{t('tagline')}</p>
        </div>
        <LanguagePicker />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 text-center">
        <p className="text-sm text-slate-500">{t('notConnected')}</p>
      </main>
    </div>
  )
}
