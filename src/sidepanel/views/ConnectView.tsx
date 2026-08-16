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
    <main className="flex flex-1 flex-col items-center justify-center gap-5 px-7 text-center">
      <p className="text-sm leading-relaxed text-muted">{t('connectIntro')}</p>

      <button
        type="button"
        className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover disabled:opacity-50"
        disabled={connecting}
        onClick={onConnect}
      >
        {connecting ? t('connecting') : t('connect')}
      </button>

      <p className="text-[11px] leading-relaxed text-subtle">{t('connectPrivacy')}</p>
    </main>
  )
}
