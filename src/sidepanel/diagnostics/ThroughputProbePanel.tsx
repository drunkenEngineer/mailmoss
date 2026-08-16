import { useState } from 'react'
import { createGmailFetch } from '@/core/gmail/client'
import { SCAN_LABELS, listMessageIds } from '@/core/gmail/collect'
import {
  CONCURRENCY_LEVELS,
  probeThroughput,
  recommendConcurrency,
} from '@/core/gmail/throughputProbe'
import type { ThroughputSample } from '@/core/gmail/throughputProbe'
import { Mono, ProbeButton, ProbeCard } from './ProbeCard'

const PER_LEVEL = 60

export function ThroughputProbePanel({ token }: { token: string }) {
  const [status, setStatus] = useState('')
  const [running, setRunning] = useState(false)
  const [samples, setSamples] = useState<ThroughputSample[]>([])
  const [error, setError] = useState('')

  async function run() {
    setRunning(true)
    setError('')
    setSamples([])

    try {
      const gmailFetch = createGmailFetch(token)
      const wanted = PER_LEVEL * CONCURRENCY_LEVELS.length
      const ids: string[] = []

      // Pull from each category in turn until there are enough identifiers.
      for (const label of SCAN_LABELS) {
        if (ids.length >= wanted) break
        setStatus(`Collecting ids from ${label}…`)
        const refs = await listMessageIds(gmailFetch, {
          labelId: label,
          limit: wanted - ids.length,
        })
        ids.push(...refs.map((ref) => ref.id))
      }

      if (ids.length < CONCURRENCY_LEVELS.length) {
        setError(`Only ${String(ids.length)} messages available. Not enough to measure.`)
        return
      }

      setStatus(
        `Timing ${String(ids.length)} fetches across ${String(CONCURRENCY_LEVELS.length)} levels…`,
      )
      setSamples(await probeThroughput(gmailFetch, ids))
      setStatus('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unexpected failure')
    } finally {
      setRunning(false)
    }
  }

  const recommendation = samples.length > 0 ? recommendConcurrency(samples) : null

  return (
    <ProbeCard
      title="S-2 · Throughput"
      summary="Times messages.get at rising concurrency to find where Gmail starts throttling. Retries are off on purpose, so pushback shows up instead of being hidden."
    >
      <ProbeButton disabled={running} onClick={() => void run()}>
        {running ? 'Running…' : 'Measure throughput'}
      </ProbeButton>

      {status !== '' && <Mono>{status}</Mono>}
      {error !== '' && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {samples.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead className="text-slate-500">
              <tr>
                <th className="pr-2 font-medium">Conc.</th>
                <th className="pr-2 font-medium">OK</th>
                <th className="pr-2 font-medium">429</th>
                <th className="pr-2 font-medium">Err</th>
                <th className="pr-2 font-medium">ms</th>
                <th className="font-medium">msg/s</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {samples.map((sample) => (
                <tr
                  key={sample.concurrency}
                  className={sample.rateLimited > 0 ? 'text-red-600' : ''}
                >
                  <td className="pr-2">{sample.concurrency}</td>
                  <td className="pr-2">{sample.succeeded}</td>
                  <td className="pr-2">{sample.rateLimited}</td>
                  <td className="pr-2">{sample.otherErrors}</td>
                  <td className="pr-2">{sample.elapsedMs}</td>
                  <td>{sample.perSecond}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {recommendation && (
            <div className="mt-2 rounded bg-slate-50 p-2">
              <p className="text-xs font-semibold">
                Recommended concurrency: {recommendation.concurrency}
              </p>
              <p className="mt-1 text-xs text-slate-600">{recommendation.note}</p>
            </div>
          )}
        </div>
      )}
    </ProbeCard>
  )
}
