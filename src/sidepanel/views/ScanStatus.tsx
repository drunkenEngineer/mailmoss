import type { ScanFailure, ScanPhase } from '../hooks/useScan'
import { useT } from '@/i18n'
import type { MessageKey } from '@/i18n'

const FAILURE_MESSAGES: Record<ScanFailure, MessageKey> = {
  auth: 'errorAuth',
  network: 'errorNetwork',
  rate: 'errorRate',
  unknown: 'errorTitle',
}

export function ScanStatus({
  phase,
  failure,
  processed,
  senders,
  rate,
  label,
  outOfOrder,
  canResume,
  onStart,
  onResume,
  onCancel,
}: {
  phase: ScanPhase
  failure: ScanFailure | null
  processed: number
  senders: number
  rate: number
  label: string
  outOfOrder: boolean
  canResume: boolean
  onStart: () => void
  onResume: () => void
  onCancel: () => void
}) {
  const t = useT()
  const scanning = phase === 'scanning'

  return (
    <div className="border-b border-line px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          {scanning ? (
            <>
              <p className="truncate text-xs font-medium tabular-nums">
                {t('scanProgress', { processed, senders })}
              </p>
              <p className="truncate text-[11px] text-subtle">
                {t('scanRate', { rate: rate.toFixed(0) })}
                {label !== '' && ` · ${t('scanCategory', { label })}`}
              </p>
            </>
          ) : (
            <p className={`truncate text-xs ${phase === 'error' ? 'text-danger' : 'text-muted'}`}>
              {phase === 'done' && t('scanFinished', { processed, senders })}
              {phase === 'cancelled' && t('scanCancelled')}
              {phase === 'error' && failure && t(FAILURE_MESSAGES[failure])}
            </p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
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
      </div>

      {scanning && (
        // No total is knowable up front, so this reads as motion rather than
        // a percentage it would have to invent.
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-meter-track">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-meter-fill" />
        </div>
      )}

      {outOfOrder && (
        <p className="mt-2.5 rounded-md bg-warn-soft px-2.5 py-1.5 text-[11px] text-warn">
          {t('scanOrderWarning')}
        </p>
      )}
    </div>
  )
}
