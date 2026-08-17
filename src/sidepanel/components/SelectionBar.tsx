import { useT } from '@/i18n'

/** Past this many at once, the count alone stops registering and needs saying out loud. */
export const LARGE_SELECTION = 50

export function SelectionBar({
  count,
  selectableCount,
  onSelectAll,
  onUnsubscribe,
  onIgnore,
  onClear,
}: {
  count: number
  /** How many rows the current filter shows, which is what "all" means here. */
  selectableCount: number
  onSelectAll: () => void
  onUnsubscribe: () => void
  onIgnore: () => void
  onClear: () => void
}) {
  const t = useT()
  if (selectableCount === 0) return null

  const allSelected = count > 0 && count === selectableCount

  return (
    <div className="border-t border-line bg-raised px-4 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs">
          {count > 0 && <span className="font-medium">{t('selectionCount', { count })}</span>}

          {!allSelected && (
            <button
              type="button"
              className="text-muted underline-offset-2 hover:underline"
              onClick={onSelectAll}
            >
              {t('selectionAll')}
            </button>
          )}

          {count > 0 && (
            <button
              type="button"
              className="text-muted underline-offset-2 hover:underline"
              onClick={onClear}
            >
              {t('selectionClear')}
            </button>
          )}
        </span>

        {count > 0 && (
          <span className="flex gap-2">
            <button
              type="button"
              className="rounded-md border border-line-strong px-2.5 py-1.5 text-xs hover:bg-hovered"
              onClick={onIgnore}
            >
              {t('selectionIgnore')}
            </button>
            <button
              type="button"
              className="rounded-md bg-accent px-2.5 py-1.5 text-xs font-medium text-accent-ink hover:bg-accent-hover"
              onClick={onUnsubscribe}
            >
              {t('selectionUnsubscribe')}
            </button>
          </span>
        )}
      </div>
    </div>
  )
}
