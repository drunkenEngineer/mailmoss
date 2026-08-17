import { useEffect, useState } from 'react'
import { hasBroadHostAccess, requestBroadHostAccess } from '@/auth/permissions'
import type { SenderAggregate } from '@/core/aggregate/senders'
import { useT } from '@/i18n'
import { LARGE_SELECTION } from './SelectionBar'

export function ConfirmUnsubscribe({
  senders,
  onCancel,
  onConfirm,
}: {
  senders: readonly SenderAggregate[]
  onCancel: () => void
  onConfirm: (hostAccess: boolean) => void
}) {
  const t = useT()
  const [hostAccess, setHostAccess] = useState<boolean | null>(null)

  const oneClick = senders.filter((sender) => sender.unsubscribe.method === 'one-click').length
  const manual = senders.length - oneClick
  const needsAccess = oneClick > 0 && hostAccess === false

  useEffect(() => {
    hasBroadHostAccess()
      .then(setHostAccess)
      .catch(() => {
        setHostAccess(false)
      })
  }, [])

  async function confirm() {
    // Requested from inside the click, which is the only place Chrome allows it.
    if (needsAccess) {
      const granted = await requestBroadHostAccess().catch(() => false)
      onConfirm(granted)
      return
    }
    onConfirm(hostAccess ?? false)
  }

  return (
    // A dialog in the accessibility tree as well as visually: it covers the
    // list rather than replacing it, so assistive tech needs telling.
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="absolute inset-0 z-10 flex flex-col bg-surface"
    >
      <header className="border-b border-line px-4 py-3">
        <h2 id="confirm-title" className="text-sm font-semibold">
          {t('confirmTitle', { count: senders.length })}
        </h2>
        <p className="mt-1 text-xs text-muted">{t('confirmIntro')}</p>
        <p className="mt-1 text-[11px] text-subtle">
          {t('confirmMethodSummary', { oneClick, manual })}
        </p>
      </header>

      {senders.length >= LARGE_SELECTION && (
        <p className="bg-warn-soft px-4 py-2 text-[11px] text-warn">
          {t('selectionLarge', { count: senders.length })}
        </p>
      )}

      {needsAccess && (
        <div className="border-b border-line bg-sunken px-4 py-3">
          <p className="text-xs font-medium">{t('hostAccessTitle')}</p>
          <p className="mt-1 text-[11px] text-muted">{t('hostAccessExplain')}</p>
        </div>
      )}

      {/* Never truncated: the whole point is seeing exactly what is about to happen. */}
      <ul className="flex-1 overflow-y-auto px-4 py-2">
        {senders.map((sender) => (
          <li key={sender.key} className="border-b border-line py-1.5 last:border-0">
            <p className="truncate text-xs">{sender.displayName || sender.key}</p>
            <p className="truncate font-mono text-[10px] text-subtle">{sender.key}</p>
          </li>
        ))}
      </ul>

      <footer className="flex gap-2 border-t border-line px-4 py-3">
        <button
          type="button"
          className="flex-1 rounded border border-line-strong px-3 py-2 text-xs font-medium hover:bg-hovered"
          onClick={onCancel}
        >
          {t('confirmCancel')}
        </button>
        <button
          type="button"
          className="flex-1 rounded bg-accent px-3 py-2 text-xs font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-50"
          disabled={hostAccess === null}
          onClick={() => void confirm()}
        >
          {t('confirmGo')}
        </button>
      </footer>
    </div>
  )
}
