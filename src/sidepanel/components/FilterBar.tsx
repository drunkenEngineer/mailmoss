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
    <div className="space-y-2 border-b border-slate-200 px-4 py-2">
      <input
        type="search"
        className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
        placeholder={t('searchPlaceholder')}
        value={query}
        onChange={(event) => {
          onQuery(event.target.value)
        }}
      />

      <div className="flex flex-wrap gap-1">
        {FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            className={`rounded-full px-2 py-0.5 text-[11px] ${
              filter === option
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            onClick={() => {
              onFilter(option)
            }}
          >
            {t(FILTER_LABELS[option])} {counts[option]}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-1 text-[11px] text-slate-500">
        {t('sortLabel')}
        <select
          className="rounded border border-slate-200 px-1 py-0.5 text-[11px]"
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
      </label>
    </div>
  )
}
