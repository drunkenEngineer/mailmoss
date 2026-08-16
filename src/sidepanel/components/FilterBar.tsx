import { FILTERS, SORTS } from '@/core/aggregate/filter'
import type { SenderFilter, SortKey } from '@/core/aggregate/filter'
import { useT } from '@/i18n'
import type { MessageKey } from '@/i18n'

const FILTER_LABELS: Record<SenderFilter, MessageKey> = {
  all: 'filterAll',
  'never-opened': 'filterNeverOpened',
  'mostly-unread': 'filterMostlyUnread',
  dormant: 'filterDormant',
}

const SORT_LABELS: Record<SortKey, MessageKey> = {
  ignored: 'sortIgnored',
  volume: 'sortVolume',
  recent: 'sortRecent',
}

export function FilterBar({
  filter,
  counts,
  query,
  sort,
  onFilter,
  onQuery,
  onSort,
}: {
  filter: SenderFilter
  counts: Record<SenderFilter, number>
  query: string
  sort: SortKey
  onFilter: (filter: SenderFilter) => void
  onQuery: (query: string) => void
  onSort: (sort: SortKey) => void
}) {
  const t = useT()

  return (
    <div className="space-y-2 border-b border-line px-4 py-3">
      <div className="flex gap-2">
        <input
          type="search"
          className="min-w-0 flex-1 rounded-md border border-line bg-raised px-2.5 py-1.5 text-xs text-ink placeholder:text-subtle"
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={(event) => {
            onQuery(event.target.value)
          }}
        />
        <select
          className="shrink-0 rounded-md border border-line bg-raised px-1.5 py-1.5 text-[11px] text-ink"
          aria-label={t('sortLabel')}
          value={sort}
          onChange={(event) => {
            onSort(event.target.value as SortKey)
          }}
        >
          {SORTS.map((option) => (
            <option key={option} value={option}>
              {t(SORT_LABELS[option])}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={filter === option}
            className={`rounded-full px-2.5 py-1 text-[11px] transition-colors ${
              filter === option
                ? 'bg-accent text-accent-ink'
                : 'bg-sunken text-muted hover:bg-hovered'
            }`}
            onClick={() => {
              onFilter(option)
            }}
          >
            {t(FILTER_LABELS[option])}
            <span className="ml-1 tabular-nums opacity-70">{counts[option]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
