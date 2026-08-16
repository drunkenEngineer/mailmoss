import { useT } from '@/i18n'

/** Past this many at once, the count alone stops registering and needs saying out loud. */
export const LARGE_SELECTION = 50

export function SelectionBar({
  count,
  onUnsubscribe,
  onIgnore,
  onClear,
}: {
  count: number
  onUnsubscribe: () => void
  onIgnore: () => void
  onClear: () => void
}) {
  const t = useT()
  if (count === 0) return null

  return (
    <div className="border-t border-line bg-raised px-4 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="text-xs text-muted underline-offset-2 hover:underline"
          onClick={onClear}
        >
          {t('selectionCount', { count })}
        </button>

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
      </div>
    </div>
  )
}
