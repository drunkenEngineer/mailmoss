import { useState } from 'react'
import { LanguagePicker } from './components/LanguagePicker'
import { useGmailAuth } from './hooks/useGmailAuth'
import { useScanStore } from './hooks/useScanStore'
import { ConnectView } from './views/ConnectView'
import { Dashboard } from './views/Dashboard'
import { useT } from '@/i18n'

function shortScope(scope: string): string {
  return scope.split('/').pop() ?? scope
}

export function App() {
  const t = useT()
  const { state, connect, disconnect, reset } = useGmailAuth()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="flex h-full flex-col bg-white text-slate-900">
      <header className="flex items-start justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold">{t('appName')}</h1>
          <p className="truncate text-xs text-slate-500">
            {state.status === 'connected'
              ? t('signedInAs', { email: state.profile.emailAddress })
              : t('tagline')}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {state.status === 'connected' && (
            <button
              type="button"
              className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-50"
              aria-expanded={showSettings}
              onClick={() => {
                setShowSettings((previous) => !previous)
              }}
            >
              {t('settings')}
            </button>
          )}
          <LanguagePicker />
        </div>
      </header>

      {state.status === 'connected' ? (
        <ConnectedPanel
          email={state.profile.emailAddress}
          token={state.token}
          scopes={state.grantedScopes.map(shortScope).join(', ')}
          showSettings={showSettings}
          onRevoke={() => void disconnect(state.token)}
        />
      ) : state.status === 'error' ? (
        <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm font-medium text-red-600">{t('errorTitle')}</p>
          <p className="font-mono text-[11px] break-words text-slate-500">{state.message}</p>
          <button
            type="button"
            className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
            onClick={reset}
          >
            {t('retry')}
          </button>
        </main>
      ) : (
        <ConnectView connecting={state.status === 'connecting'} onConnect={() => void connect()} />
      )}
    </div>
  )
}

/**
 * Splitting here lets the dashboard read a restored scan straight into its
 * initial state once storage has been consulted, rather than syncing it in
 * afterwards through an effect.
 */
function ConnectedPanel({
  email,
  token,
  scopes,
  showSettings,
  onRevoke,
}: {
  email: string
  token: string
  scopes: string
  showSettings: boolean
  onRevoke: () => void
}) {
  const store = useScanStore(email)

  if (!store.ready) {
    return <div className="flex-1" />
  }

  return (
    <Dashboard
      key={store.accountHash}
      token={token}
      email={email}
      scopes={scopes}
      store={store}
      showSettings={showSettings}
      onRevoke={onRevoke}
    />
  )
}
