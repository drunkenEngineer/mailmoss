import { useMemo, useState } from 'react'
import { filterCounts, selectView } from '@/core/aggregate/filter'
import type { SenderFilter, SortKey } from '@/core/aggregate/filter'
import { useT } from '@/i18n'
import { FilterBar } from '../components/FilterBar'
import { SelectionBar } from '../components/SelectionBar'
import { SenderList } from '../components/SenderList'
import { SettingsPanel } from '../components/SettingsPanel'
import { Diagnostics } from '../diagnostics/Diagnostics'
import { useScan } from '../hooks/useScan'
import type { useScanStore } from '../hooks/useScanStore'
import { ScanStatus } from './ScanStatus'

/**
 * Captured once when the panel loads rather than read during render. Dormancy
 * is measured in months, so a clock that does not tick within a session makes
 * no difference to any filter.
 */
const PANEL_OPENED_AT = Date.now()

export function Dashboard({
  token,
  email,
  scopes,
  store,
  showSettings,
  onRevoke,
}: {
  token: string
  email: string
  scopes: string
  store: ReturnType<typeof useScanStore>
  showSettings: boolean
  onRevoke: () => void
}) {
  const t = useT()
  const scan = useScan(token, store)

  const [filter, setFilter] = useState<SenderFilter>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('ignored')
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [allTime, setAllTime] = useState(false)
  const [showHandled, setShowHandled] = useState(false)
  const [diagnostics, setDiagnostics] = useState(false)

  // Recomputed only when the inputs move, so typing in the search box does not
  // resort several hundred rows on every keystroke.
  const now = PANEL_OPENED_AT
  const visible = useMemo(
    () => selectView(scan.senders, { filter, query, sort, now, includeHandled: showHandled }),
    [scan.senders, filter, query, sort, now, showHandled],
  )
  const counts = useMemo(() => filterCounts(scan.senders, now), [scan.senders, now])

  const handled = scan.senders.filter((sender) => sender.status !== 'pending').length

  function toggle(key: string) {
    setSelected((previous) => {
      const next = new Set(previous)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {showSettings && (
        <SettingsPanel
          scopes={scopes}
          allTime={allTime}
          showHandled={showHandled}
          diagnostics={diagnostics}
          storageLabel={`${(store.usage.bytes / 1024).toFixed(1)} KB`}
          onAllTime={setAllTime}
          onShowHandled={setShowHandled}
          onDiagnostics={setDiagnostics}
          onWipe={onRevoke}
        />
      )}

      <ScanStatus
        phase={scan.phase}
        failure={scan.failure}
        processed={scan.processed}
        senders={scan.senders.length}
        rate={scan.rate}
        label={scan.label}
        outOfOrder={scan.outOfOrder}
        canResume={scan.canResume}
        onStart={() => void scan.start(allTime)}
        onResume={() => void scan.resume(allTime)}
        onCancel={scan.cancel}
      />

      {scan.senders.length === 0 ? (
        <main className="flex flex-1 items-center justify-center px-6 text-center">
          <p className="text-sm text-slate-500">{t('resultsEmpty')}</p>
        </main>
      ) : (
        <>
          <FilterBar
            filter={filter}
            counts={counts}
            query={query}
            sort={sort}
            onFilter={setFilter}
            onQuery={setQuery}
            onSort={setSort}
          />

          <p className="px-4 py-1 text-[11px] text-slate-500">
            {t('resultsCount', { count: visible.length })}
            {handled > 0 && ` · ${t('resultsHandled', { count: handled })}`}
          </p>

          {visible.length === 0 ? (
            <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
              <p className="text-sm text-slate-500">{t('resultsNoMatches')}</p>
              <button
                type="button"
                className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                onClick={() => {
                  setFilter('all')
                  setQuery('')
                }}
              >
                {t('resultsClearFilters')}
              </button>
            </main>
          ) : (
            <SenderList senders={visible} selected={selected} onToggle={toggle} />
          )}

          <SelectionBar
            count={selected.size}
            onClear={() => {
              setSelected(new Set())
            }}
            onIgnore={() => {
              void scan.markStatus([...selected], 'ignored')
              setSelected(new Set())
            }}
          />
        </>
      )}

      {diagnostics && (
        <div className="max-h-64 overflow-y-auto border-t border-slate-200">
          <Diagnostics token={token} email={email} />
        </div>
      )}
    </div>
  )
}
