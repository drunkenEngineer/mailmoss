import type { RefreshNotice, ScanFailure, ScanPhase } from '../hooks/useScan'
import { useT } from '@/i18n'
import type { MessageKey } from '@/i18n'

const FAILURE_MESSAGES: Record<ScanFailure, MessageKey> = {
  auth: 'errorAuth',
  network: 'errorNetwork',
  rate: 'errorRate',
  unknown: 'errorTitle',
}

const NOTICE_MESSAGES: Record<RefreshNotice['kind'], MessageKey> = {
  updated: 'refreshUpdated',
  'up-to-date': 'refreshUpToDate',
  'too-old': 'refreshTooOld',
  baseline: 'refreshBaseline',
}

export function ScanStatus({
  phase,
  failure,
  processed,
  senders,
  rate,
  label,
  outOfOrder,
  notice,
  canResume,
  canRefresh,
  onStart,
  onResume,
  onRefresh,
  onCancel,
}: {
  phase: ScanPhase
  failure: ScanFailure | null
  processed: number
  senders: number
  rate: number
  label: string
  outOfOrder: boolean
  notice: RefreshNotice | null
  canResume: boolean
  canRefresh: boolean
  onStart: () => void
  onResume: () => void
  onRefresh: () => void
  onCancel: () => void
}) {
  const t = useT()
  const scanning = phase === 'scanning'
  const refreshing = phase === 'refreshing'

  return (
    <div className="border-b border-line px-4 py-3">
      {/* The panel is narrow, so a full sentence cannot share a line with two
          buttons without being cut off. Status gets its own width and wraps. */}
      <div className="min-w-0">
        {scanning ? (
          <>
            <p className="text-xs font-medium tabular-nums">
              {t('scanProgress', { processed, senders })}
            </p>
            <p className="text-[11px] text-subtle">
              {t('scanRate', { rate: rate.toFixed(0) })}
              {label !== '' && ` · ${t('scanCategory', { label })}`}
            </p>
          </>
        ) : (
          <p
            className={`text-xs leading-relaxed ${phase === 'error' ? 'text-danger' : 'text-muted'}`}
          >
            {refreshing && t('scanRefreshing')}
            {phase === 'done' && t('scanFinished', { processed, senders })}
            {phase === 'cancelled' && t('scanCancelled')}
            {phase === 'error' && failure && t(FAILURE_MESSAGES[failure])}
          </p>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap justify-end gap-2">
        {scanning ? (
          <button
            type="button"
            className="rounded-md border border-line-strong px-2.5 py-1.5 text-xs hover:bg-hovered"
            onClick={onCancel}
          >
            {t('scanCancel')}
          </button>
        ) : (
          <>
            {canResume && (
              <button
                type="button"
                className="rounded-md border border-line-strong px-2.5 py-1.5 text-xs hover:bg-hovered"
                onClick={onResume}
              >
                {t('scanResume')}
              </button>
            )}
            {canRefresh && (
              <button
                type="button"
                className="rounded-md border border-line-strong px-2.5 py-1.5 text-xs hover:bg-hovered disabled:opacity-50"
                disabled={refreshing}
                onClick={onRefresh}
              >
                {refreshing ? t('scanRefreshing') : t('scanRefresh')}
              </button>
            )}
            <button
              type="button"
              className="rounded-md bg-accent px-2.5 py-1.5 text-xs font-medium text-accent-ink hover:bg-accent-hover"
              onClick={onStart}
            >
              {processed > 0 ? t('scanAgain') : t('scanStart')}
            </button>
          </>
        )}
      </div>

      {scanning && (
        // No total is knowable up front, so this reads as motion rather than
        // a percentage it would have to invent.
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-meter-track">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-meter-fill" />
        </div>
      )}

      {notice && (
        <p
          className={`mt-2.5 rounded-md px-2.5 py-1.5 text-[11px] ${
            notice.kind === 'too-old' ? 'bg-warn-soft text-warn' : 'bg-sunken text-muted'
          }`}
        >
          {t(
            NOTICE_MESSAGES[notice.kind],
            notice.kind === 'updated' ? { count: notice.count } : {},
          )}
        </p>
      )}

      {outOfOrder && (
        <p className="mt-2.5 rounded-md bg-warn-soft px-2.5 py-1.5 text-[11px] text-warn">
          {t('scanOrderWarning')}
        </p>
      )}
    </div>
  )
}
