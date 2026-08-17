import { useT } from '@/i18n'

export function ConnectView({
  connecting,
  canChooseAccount,
  onConnect,
  onConnectAs,
}: {
  connecting: boolean
  canChooseAccount: boolean
  onConnect: () => void
  onConnectAs: () => void
}) {
  const t = useT()

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-7 text-center">
      <p className="text-sm leading-relaxed text-muted">{t('connectIntro')}</p>

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover disabled:opacity-50"
          disabled={connecting}
          onClick={onConnect}
        >
          {connecting ? t('connecting') : t('connect')}
        </button>

        {/* Chrome's own sign-in has no account picker, so this is the way to
            reach a mailbox other than the profile's default. */}
        {canChooseAccount && (
          <button
            type="button"
            className="text-xs text-muted underline underline-offset-2 hover:text-ink disabled:opacity-50"
            disabled={connecting}
            onClick={onConnectAs}
          >
            {t('connectOther')}
          </button>
        )}
      </div>

      <p className="text-[11px] leading-relaxed text-subtle">{t('connectPrivacy')}</p>
    </main>
  )
}
