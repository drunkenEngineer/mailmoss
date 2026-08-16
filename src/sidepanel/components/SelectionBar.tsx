import { useT } from '@/i18n'

/** Past this many at once, the count alone stops registering and needs saying out loud. */
export const LARGE_SELECTION = 50

export function SelectionBar({
  count,
  onIgnore,
  onClear,
}: {
  count: number
  onIgnore: () => void
  onClear: () => void
}) {
  const t = useT()
  if (count === 0) return null

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-2">
      {count >= LARGE_SELECTION && (
        <p className="mb-2 rounded bg-amber-50 px-2 py-1 text-[11px] text-amber-800">
          {t('selectionLarge', { count })}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium">{t('selectionCount', { count })}</span>

        <span className="flex gap-2">
          <button
            type="button"
            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
            onClick={onClear}
          >
            {t('selectionClear')}
          </button>
          <button
            type="button"
            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
            onClick={onIgnore}
          >
            {t('selectionIgnore')}
          </button>
          <button
            type="button"
            className="rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white disabled:opacity-40"
            disabled
            title={t('unsubscribeNotReady')}
          >
            {t('selectionUnsubscribe')}
          </button>
        </span>
      </div>
    </div>
  )
}
