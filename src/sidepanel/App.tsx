import { useState } from 'react'
import { LanguagePicker } from './components/LanguagePicker'
import { ThemePicker } from './components/ThemePicker'
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
  const { state, connect, connectAs, canChooseAccount, disconnect, reset } = useGmailAuth()
  const [showSettings, setShowSettings] = useState(false)

  const connected = state.status === 'connected'

  return (
    <div className="flex h-full flex-col bg-surface text-ink">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold tracking-tight">{t('appName')}</h1>
          <p className="truncate text-[11px] text-subtle">
            {connected ? state.profile.emailAddress : t('tagline')}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {connected ? (
            <button
              type="button"
              className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                showSettings
                  ? 'border-accent bg-accent text-accent-ink'
                  : 'border-line text-muted hover:bg-hovered'
              }`}
              aria-expanded={showSettings}
              onClick={() => {
                setShowSettings((previous) => !previous)
              }}
            >
              {t('settings')}
            </button>
          ) : (
            // Both pickers live in settings once connected, but someone should
            // not have to sign in before they can read the panel comfortably.
            <>
              <ThemePicker />
              <LanguagePicker />
            </>
          )}
        </div>
      </header>

      {connected ? (
        <ConnectedPanel
          email={state.profile.emailAddress}
          token={state.token}
          scopes={state.grantedScopes.map(shortScope).join(', ')}
          showSettings={showSettings}
          canChooseAccount={canChooseAccount}
          onSwitchAccount={() => void connectAs()}
          onRevoke={() => void disconnect(state.token)}
        />
      ) : state.status === 'error' ? (
        <main className="flex flex-1 flex-col items-center justify-center gap-3 px-7 text-center">
          <p className="text-sm font-medium text-danger">{t('errorTitle')}</p>
          <p className="font-mono text-[11px] break-words text-subtle">{state.message}</p>
          <button
            type="button"
            className="rounded-md border border-line-strong px-3 py-1.5 text-xs font-medium hover:bg-hovered"
            onClick={reset}
          >
            {t('retry')}
          </button>
        </main>
      ) : (
        <ConnectView
          connecting={state.status === 'connecting'}
          canChooseAccount={canChooseAccount}
          onConnect={() => void connect()}
          onConnectAs={() => void connectAs()}
        />
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
  canChooseAccount,
  onSwitchAccount,
  onRevoke,
}: {
  email: string
  token: string
  scopes: string
  showSettings: boolean
  canChooseAccount: boolean
  onSwitchAccount: () => void
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
      scopes={scopes}
      store={store}
      showSettings={showSettings}
      canChooseAccount={canChooseAccount}
      onSwitchAccount={onSwitchAccount}
      onRevoke={onRevoke}
    />
  )
}
