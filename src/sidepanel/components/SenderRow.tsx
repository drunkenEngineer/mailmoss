import { isEngaged, unreadRate } from '@/core/aggregate/senders'
import type { SenderAggregate, SenderStatus } from '@/core/aggregate/senders'
import { useT } from '@/i18n'
import type { MessageKey } from '@/i18n'
import { MethodBadge } from './MethodBadge'

const HANDLED: Record<Exclude<SenderStatus, 'pending'>, { key: MessageKey; className: string }> = {
  unsubscribed: { key: 'statusDone', className: 'bg-ok-soft text-ok' },
  ignored: { key: 'statusIgnored', className: 'bg-sunken text-muted' },
  failed: { key: 'statusFailed', className: 'bg-danger-soft text-danger' },
}

export function SenderRow({
  sender,
  selected,
  onToggle,
}: {
  sender: SenderAggregate
  selected: boolean
  onToggle: (key: string) => void
}) {
  const t = useT()
  const percent = Math.round(unreadRate(sender) * 100)
  const handled = sender.status === 'pending' ? null : HANDLED[sender.status]

  return (
    <label
      className={`flex cursor-pointer items-start gap-3 border-b border-line px-4 py-3 transition-colors ${
        selected ? 'bg-sunken' : 'hover:bg-hovered'
      }`}
    >
      <input
        type="checkbox"
        className="mt-1 shrink-0 accent-current"
        checked={selected}
        onChange={() => {
          onToggle(sender.key)
        }}
      />

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="truncate text-sm font-medium">{sender.displayName || sender.key}</span>
          <span className="shrink-0 text-xs tabular-nums text-muted">
            {t('rowMessages', { count: sender.totalCount })}
          </span>
        </span>

        {/* Display names collide across senders, so the address is not optional detail. */}
        <span className="mt-0.5 block truncate font-mono text-[10px] text-subtle">
          {sender.key}
        </span>

        <span className="mt-2 flex items-center gap-2">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-meter-track">
            <span
              className="block h-full rounded-full bg-meter-fill"
              style={{ width: `${String(percent)}%` }}
            />
          </span>
          <span className="shrink-0 text-[10px] tabular-nums text-muted">
            {t('rowUnread', { percent })}
          </span>
          <MethodBadge method={sender.unsubscribe.method} />
          {handled && (
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${handled.className}`}>
              {t(handled.key)}
            </span>
          )}
        </span>

        {isEngaged(sender) && (
          <span className="mt-1.5 block text-[10px] text-warn">{t('rowEngaged')}</span>
        )}
      </span>
    </label>
  )
}
