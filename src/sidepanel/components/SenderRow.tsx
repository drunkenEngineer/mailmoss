import { isEngaged, unreadRate } from '@/core/aggregate/senders'
import type { SenderAggregate } from '@/core/aggregate/senders'
import { useT } from '@/i18n'
import { MethodBadge } from './MethodBadge'

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

  return (
    <label className="flex cursor-pointer items-start gap-2 border-b border-slate-100 px-4 py-2.5 hover:bg-slate-50">
      <input
        type="checkbox"
        className="mt-0.5 shrink-0"
        checked={selected}
        onChange={() => {
          onToggle(sender.key)
        }}
      />

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium">{sender.displayName || sender.key}</span>
          <span className="shrink-0 text-xs text-slate-500">{sender.totalCount}</span>
        </span>

        {/* Display names collide across senders, so the address is not optional detail. */}
        <span className="block truncate text-[11px] text-slate-400">{sender.key}</span>

        <span className="mt-1 flex items-center gap-2">
          <span className="h-1 flex-1 rounded bg-slate-100">
            <span
              className="block h-1 rounded bg-slate-400"
              style={{ width: `${String(percent)}%` }}
            />
          </span>
          <span className="shrink-0 text-[10px] text-slate-500">{t('rowUnread', { percent })}</span>
          <MethodBadge method={sender.unsubscribe.method} />
        </span>

        {isEngaged(sender) && (
          <span className="mt-1 block text-[10px] text-amber-700">{t('rowEngaged')}</span>
        )}
      </span>
    </label>
  )
}
