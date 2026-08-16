import type { SenderAggregate } from '../aggregate/senders'
import { sendOneClick } from './oneClick'
import type { UnsubscribeExecutor, UnsubscribeOutcome } from './queue'
import { buildComposeUrl, buildSenderSearchUrl } from './targets'

export type ExecutorEnvironment = {
  /** Whether broad host access was granted; without it a POST cannot leave the panel. */
  hostAccess: boolean
  openTab: (url: string) => Promise<void>
  post?: typeof sendOneClick
}

/**
 * Every path other than a confirmed one-click ends with the user finishing the
 * job in a tab. That is deliberate: a silent request is only ever sent to a
 * sender that has declared it supports one, and refusing host access degrades
 * the feature rather than removing it.
 */
export function createExecutor(environment: ExecutorEnvironment): UnsubscribeExecutor {
  const { hostAccess, openTab, post = sendOneClick } = environment

  return async function execute(sender: SenderAggregate): Promise<UnsubscribeOutcome> {
    const { method, target } = sender.unsubscribe

    if (method === 'none') {
      await openTab(buildSenderSearchUrl(sender.key))
      return { status: 'needs-confirmation', detail: 'Opened a Gmail search for this sender' }
    }

    if (target === undefined) {
      return { status: 'failed', detail: 'No unsubscribe target was recorded' }
    }

    if (method === 'mailto') {
      const compose = buildComposeUrl(target)
      if (compose === null) return { status: 'failed', detail: 'Unreadable mailto target' }

      await openTab(compose)
      return { status: 'needs-confirmation', detail: 'Opened a pre-filled email to send' }
    }

    if (method === 'http' || !hostAccess) {
      await openTab(target)
      return {
        status: 'needs-confirmation',
        detail: hostAccess
          ? 'Opened the unsubscribe page'
          : 'Opened the unsubscribe page, since host access was not granted',
      }
    }

    const result = await post(target)
    if (result.ok) return { status: 'done', detail: `Unsubscribed (${String(result.status)})` }

    // A refused one-click is not the end of the road; the page usually still works.
    await openTab(target)
    return {
      status: 'needs-confirmation',
      detail: `One-click did not go through (${result.detail}), so the page was opened instead`,
    }
  }
}
