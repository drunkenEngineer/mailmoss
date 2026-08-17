import { summarise } from '@/core/unsubscribe/queue'
import type { UnsubscribeResult, UnsubscribeStatus } from '@/core/unsubscribe/queue'
import { useT } from '@/i18n'
import type { MessageKey } from '@/i18n'

const STATUS_LABEL: Record<UnsubscribeStatus, MessageKey> = {
  done: 'statusDone',
  'needs-confirmation': 'statusManual',
  failed: 'statusFailed',
}

const STATUS_COLOR: Record<UnsubscribeStatus, string> = {
  done: 'text-ok',
  'needs-confirmation': 'text-info',
  failed: 'text-danger',
}

export function UnsubscribeReport({
  results,
  cancelled,
  onRetry,
  onClose,
}: {
  results: readonly UnsubscribeResult[]
  cancelled: boolean
  onRetry: (keys: string[]) => void
  onClose: () => void
}) {
  const t = useT()
  const summary = summarise(results)
  const failedKeys = results.filter((result) => result.status === 'failed').map((r) => r.key)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-title"
      className="absolute inset-0 z-10 flex flex-col bg-surface"
    >
      <header className="border-b border-line px-4 py-3">
        <h2 id="report-title" className="text-sm font-semibold">
          {t('reportTitle')}
        </h2>
        <ul className="mt-1 space-y-0.5 text-xs">
          {summary.done > 0 && (
            <li className="text-ok">{t('reportDone', { count: summary.done })}</li>
          )}
          {summary['needs-confirmation'] > 0 && (
            <li className="text-info">
              {t('reportManual', { count: summary['needs-confirmation'] })}
            </li>
          )}
          {summary.failed > 0 && (
            <li className="text-danger">{t('reportFailed', { count: summary.failed })}</li>
          )}
        </ul>
        {cancelled && <p className="mt-1 text-[11px] text-muted">{t('reportCancelled')}</p>}
      </header>

      <ul className="flex-1 overflow-y-auto px-4 py-2">
        {results.map((result) => (
          <li key={result.key} className="border-b border-line py-1.5 last:border-0">
            <p className="flex items-baseline justify-between gap-2">
              <span className="truncate font-mono text-[11px]">{result.key}</span>
              <span className={`shrink-0 text-[10px] font-medium ${STATUS_COLOR[result.status]}`}>
                {t(STATUS_LABEL[result.status])}
              </span>
            </p>
            <p className="text-[10px] text-subtle">{result.detail}</p>
          </li>
        ))}
      </ul>

      <footer className="flex gap-2 border-t border-line px-4 py-3">
        {failedKeys.length > 0 && (
          <button
            type="button"
            className="flex-1 rounded border border-line-strong px-3 py-2 text-xs font-medium hover:bg-hovered"
            onClick={() => {
              onRetry(failedKeys)
            }}
          >
            {t('reportRetry')}
          </button>
        )}
        <button
          type="button"
          className="flex-1 rounded bg-accent px-3 py-2 text-xs font-medium text-accent-ink hover:bg-accent-hover"
          onClick={onClose}
        >
          {t('reportClose')}
        </button>
      </footer>
    </div>
  )
}
