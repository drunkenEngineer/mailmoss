import { useState } from 'react'
import { createGmailFetch } from '@/core/gmail/client'
import { probeMetadataScope } from '@/core/gmail/scopeProbe'
import type { ProbeReport } from '@/core/gmail/scopeProbe'
import { useT } from '@/i18n'

type Status = 'idle' | 'running' | 'done' | 'failed'

export function ScopeProbe({ token }: { token: string }) {
  const t = useT()
  const [status, setStatus] = useState<Status>('idle')
  const [report, setReport] = useState<ProbeReport | null>(null)
  const [error, setError] = useState('')

  async function run() {
    setStatus('running')
    setError('')
    try {
      setReport(await probeMetadataScope(createGmailFetch(token)))
      setStatus('done')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unexpected failure')
      setStatus('failed')
    }
  }

  return (
    <section className="border-t border-slate-200 px-4 py-3">
      <h2 className="text-xs font-semibold tracking-wide text-slate-700 uppercase">
        {t('probeTitle')}
      </h2>
      <p className="mt-1 text-xs text-slate-500">{t('probeIntro')}</p>

      <button
        type="button"
        className="mt-2 rounded border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-50 disabled:opacity-50"
        disabled={status === 'running'}
        onClick={() => void run()}
      >
        {status === 'running' ? t('probeRunning') : t('probeRun')}
      </button>

      {status === 'failed' && <p className="mt-2 text-xs text-red-600">{error}</p>}

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
              <p className="mt-1 font-mono text-[11px] break-words text-slate-500">
                {outcome.detail}
              </p>
            </div>
          ))}

          <div className="rounded bg-slate-50 p-2">
            <p className="text-xs font-semibold">
              {t('probeVerdict')}: {report.strategy}
            </p>
            <p className="mt-1 text-xs text-slate-600">{report.verdict}</p>
          </div>
        </div>
      )}
    </section>
  )
}
