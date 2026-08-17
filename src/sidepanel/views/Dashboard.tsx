import { useMemo, useState } from 'react'
import { filterCounts, selectView } from '@/core/aggregate/filter'
import type { SenderFilter, SortKey } from '@/core/aggregate/filter'
import type { SenderAggregate } from '@/core/aggregate/senders'
import { useT } from '@/i18n'
import { ConfirmUnsubscribe } from '../components/ConfirmUnsubscribe'
import { FilterBar } from '../components/FilterBar'
import { SelectionBar } from '../components/SelectionBar'
import { SenderList } from '../components/SenderList'
import { SettingsPanel } from '../components/SettingsPanel'
import { UnsubscribeReport } from '../components/UnsubscribeReport'
import { useScan } from '../hooks/useScan'
import type { useScanStore } from '../hooks/useScanStore'
import { useUnsubscribeRun } from '../hooks/useUnsubscribeRun'
import { ScanStatus } from './ScanStatus'

/**
 * Captured once when the panel loads rather than read during render. Dormancy
 * is measured in months, so a clock that does not tick within a session makes
 * no difference to any filter.
 */
const PANEL_OPENED_AT = Date.now()

export function Dashboard({
  token,
  scopes,
  store,
  showSettings,
  canChooseAccount,
  onSwitchAccount,
  onRevoke,
}: {
  token: string
  scopes: string
  store: ReturnType<typeof useScanStore>
  showSettings: boolean
  canChooseAccount: boolean
  onSwitchAccount: () => void
  onRevoke: () => void
}) {
  const t = useT()
  const scan = useScan(token, store)
  const run = useUnsubscribeRun()

  const [filter, setFilter] = useState<SenderFilter>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('ignored')
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [pending, setPending] = useState<SenderAggregate[] | null>(null)
  const [allTime, setAllTime] = useState(false)
  const [showHandled, setShowHandled] = useState(false)

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

  function byKeys(keys: readonly string[]): SenderAggregate[] {
    const wanted = new Set(keys)
    return scan.senders.filter((sender) => wanted.has(sender.key))
  }

  async function finish() {
    // Only a confirmed one-click counts as unsubscribed. Opening a page means
    // the user still has to finish, and claiming otherwise would be a lie the
    // list then repeats back to them.
    const succeeded = run.results.filter((result) => result.status === 'done').map((r) => r.key)
    const failed = run.results.filter((result) => result.status === 'failed').map((r) => r.key)

    if (succeeded.length > 0) await scan.markStatus(succeeded, 'unsubscribed')
    if (failed.length > 0) await scan.markStatus(failed, 'failed')

    setSelected(new Set())
    run.dismiss()
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {showSettings && (
        <SettingsPanel
          scopes={scopes}
          allTime={allTime}
          showHandled={showHandled}
          storageLabel={`${(store.usage.bytes / 1024).toFixed(1)} KB`}
          onAllTime={setAllTime}
          onShowHandled={setShowHandled}
          canChooseAccount={canChooseAccount}
          onSwitchAccount={onSwitchAccount}
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
        capped={scan.capped}
        notice={scan.notice}
        canResume={scan.canResume}
        canRefresh={scan.canRefresh}
        onStart={() => void scan.start(allTime)}
        onResume={() => void scan.resume(allTime)}
        onRefresh={() => void scan.refresh()}
        onCancel={scan.cancel}
      />

      {scan.senders.length === 0 ? (
        <main className="flex flex-1 items-center justify-center px-7 text-center">
          <p className="text-sm text-subtle">{t('resultsEmpty')}</p>
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

          <p className="px-4 py-1.5 text-[11px] tabular-nums text-subtle">
            {t('resultsCount', { count: visible.length })}
            {handled > 0 && ` · ${t('resultsHandled', { count: handled })}`}
          </p>

          {visible.length === 0 ? (
            <main className="flex flex-1 flex-col items-center justify-center gap-3 px-7 text-center">
              <p className="text-sm text-subtle">{t('resultsNoMatches')}</p>
              <button
                type="button"
                className="rounded-md border border-line-strong px-2.5 py-1.5 text-xs hover:bg-hovered"
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
            selectableCount={visible.length}
            onSelectAll={() => {
              // "All" means what the filter currently shows, never the whole
              // list, so a narrowed view cannot select rows off screen.
              setSelected(new Set(visible.map((sender) => sender.key)))
            }}
            onClear={() => {
              setSelected(new Set())
            }}
            onIgnore={() => {
              void scan.markStatus([...selected], 'ignored')
              setSelected(new Set())
            }}
            onUnsubscribe={() => {
              setPending(byKeys([...selected]))
            }}
          />
        </>
      )}

      {pending && run.phase === 'idle' && (
        <ConfirmUnsubscribe
          senders={pending}
          onCancel={() => {
            setPending(null)
          }}
          onConfirm={(hostAccess) => {
            const senders = pending
            setPending(null)
            void run.run(senders, hostAccess)
          }}
        />
      )}

      {run.phase === 'running' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-surface px-7 text-center">
          <p className="text-sm tabular-nums">
            {t('runProgress', { index: run.progress.index, total: run.progress.total })}
          </p>
          <div className="h-1 w-40 overflow-hidden rounded-full bg-meter-track">
            <div
              className="h-full rounded-full bg-meter-fill transition-all"
              style={{
                width: `${String(Math.round((run.progress.index / Math.max(1, run.progress.total)) * 100))}%`,
              }}
            />
          </div>
          <button
            type="button"
            className="rounded-md border border-line-strong px-2.5 py-1.5 text-xs hover:bg-hovered"
            onClick={run.cancel}
          >
            {t('runCancel')}
          </button>
        </div>
      )}

      {run.phase === 'report' && (
        <UnsubscribeReport
          results={run.results}
          cancelled={run.cancelled}
          onRetry={(keys) => {
            const senders = byKeys(keys)
            run.dismiss()
            void run.run(senders, true)
          }}
          onClose={() => void finish()}
        />
      )}
    </div>
  )
}
