import { useState } from 'react'
import { createGmailFetch } from '@/core/gmail/client'
import { probeMetadataScope } from '@/core/gmail/scopeProbe'
import type { ProbeReport } from '@/core/gmail/scopeProbe'
import { Mono, ProbeButton, ProbeCard } from './ProbeCard'

export function ScopeProbePanel({ token }: { token: string }) {
  const [running, setRunning] = useState(false)
  const [report, setReport] = useState<ProbeReport | null>(null)
  const [error, setError] = useState('')

  async function run() {
    setRunning(true)
    setError('')
    try {
      setReport(await probeMetadataScope(createGmailFetch(token)))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unexpected failure')
    } finally {
      setRunning(false)
    }
  }

  return (
    <ProbeCard
      title="S-1 · Scope"
      summary="What the header-only scope allows. Settled: labels work, search queries do not."
    >
      <ProbeButton disabled={running} onClick={() => void run()}>
        {running ? 'Running…' : 'Re-run probe'}
      </ProbeButton>

      {error !== '' && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {report && (
        <div className="mt-3 space-y-2">
          {report.outcomes.map((outcome) => (
            <div key={outcome.id} className="rounded border border-slate-200 p-2">
              <p className="flex items-start gap-1.5 text-xs font-medium">
                <span className={outcome.ok ? 'text-green-600' : 'text-red-600'}>
                  {outcome.ok ? 'PASS' : 'FAIL'}
                </span>
                <span>{outcome.question}</span>
              </p>
              <Mono>{outcome.detail}</Mono>
            </div>
          ))}
          <div className="rounded bg-slate-50 p-2">
            <p className="text-xs font-semibold">Verdict: {report.strategy}</p>
            <p className="mt-1 text-xs text-slate-600">{report.verdict}</p>
          </div>
        </div>
      )}
    </ProbeCard>
  )
}
