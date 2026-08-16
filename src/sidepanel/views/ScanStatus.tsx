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
    <div className="border-b border-slate-200 px-4 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          {scanning ? (
            <>
              <p className="truncate text-xs font-medium">
                {t('scanProgress', { processed, senders })}
              </p>
              <p className="truncate text-[11px] text-slate-500">
                {t('scanRate', { rate: rate.toFixed(0) })}
                {label !== '' && ` · ${t('scanCategory', { label })}`}
              </p>
            </>
          ) : (
            <p className="truncate text-xs text-slate-600">
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
              className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
              onClick={onCancel}
            >
              {t('scanCancel')}
            </button>
          ) : (
            <>
              {canResume && (
                <button
                  type="button"
                  className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                  onClick={onResume}
                >
                  {t('scanResume')}
                </button>
              )}
              <button
                type="button"
                className="rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700"
                onClick={onStart}
              >
                {processed > 0 ? t('scanAgain') : t('scanStart')}
              </button>
            </>
          )}
        </div>
      </div>

      {outOfOrder && (
        <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-[11px] text-amber-800">
          {t('scanOrderWarning')}
        </p>
      )}
    </div>
  )
}
