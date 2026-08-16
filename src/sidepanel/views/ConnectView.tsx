import { useT } from '@/i18n'

export function ConnectView({
  connecting,
  onConnect,
}: {
  connecting: boolean
  onConnect: () => void
}) {
  const t = useT()

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm text-slate-600">{t('connectIntro')}</p>

      <button
        type="button"
        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        disabled={connecting}
        onClick={onConnect}
      >
        {connecting ? t('connecting') : t('connect')}
      </button>

      <p className="text-[11px] text-slate-500">{t('connectPrivacy')}</p>
    </main>
  )
}
