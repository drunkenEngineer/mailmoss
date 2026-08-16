import { ScanPanel } from './ScanPanel'
import { ScopeProbePanel } from './ScopeProbePanel'
import { ThroughputProbePanel } from './ThroughputProbePanel'
import { UnsubscribeProbePanel } from './UnsubscribeProbePanel'

/**
 * Phase 0 instrumentation. Deleted before release, and deliberately untranslated
 * because it is not product UI.
 */
export function Diagnostics({ token, email }: { token: string; email: string }) {
  return (
    <div>
      <p className="bg-amber-50 px-4 py-2 text-[11px] text-amber-800">
        Diagnostics — development only, removed before release.
      </p>
      <ScanPanel token={token} email={email} />
      <ScopeProbePanel token={token} />
      <ThroughputProbePanel token={token} />
      <UnsubscribeProbePanel token={token} />
    </div>
  )
}
