import { LanguagePicker } from './components/LanguagePicker'
import { Diagnostics } from './diagnostics/Diagnostics'
import { useGmailAuth } from './hooks/useGmailAuth'
import { useT } from '@/i18n'

export function App() {
  const t = useT()
  const { state, connect, disconnect, reset } = useGmailAuth()

  return (
    <div className="flex h-full flex-col bg-white text-slate-900">
      <header className="flex items-start justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div>
          <h1 className="text-sm font-semibold">{t('appName')}</h1>
          <p className="text-xs text-slate-500">{t('tagline')}</p>
        </div>
        <LanguagePicker />
      </header>

      {state.status === 'connected' ? (
        <div className="flex-1 overflow-y-auto">
          <section className="px-4 py-3">
            <p className="text-sm font-medium">
              {t('signedInAs', { email: state.profile.emailAddress })}
            </p>
            <p className="text-xs text-slate-500">
              {t('messagesTotal', { count: state.profile.messagesTotal.toLocaleString() })}
            </p>
            <p className="mt-1 font-mono text-[11px] break-words text-slate-400">
              {t('grantedScopes', {
                scopes: state.grantedScopes.map((s) => s.split('/').pop() ?? s).join(', '),
              })}
            </p>
            <button
              type="button"
              className="mt-2 rounded border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-50"
              onClick={() => void disconnect(state.token)}
            >
              {t('revoke')}
            </button>
          </section>

          <Diagnostics token={state.token} email={state.profile.emailAddress} />
        </div>
      ) : (
        <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          {state.status === 'error' ? (
            <>
              <p className="text-sm font-medium text-red-600">{t('errorTitle')}</p>
              <p className="font-mono text-[11px] break-words text-slate-500">{state.message}</p>
              <button
                type="button"
                className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                onClick={reset}
              >
                {t('retry')}
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-slate-500">{t('connectIntro')}</p>
              <button
                type="button"
                className="rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                disabled={state.status !== 'disconnected'}
                onClick={() => void connect()}
              >
                {state.status === 'connecting' ? t('connecting') : t('connect')}
              </button>
            </>
          )}
        </main>
      )}
    </div>
  )
}
