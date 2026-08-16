import type { UnsubscribeMethod } from '@/core/parse/unsubscribe'
import { useT } from '@/i18n'
import type { MessageKey } from '@/i18n'

const STYLES: Record<UnsubscribeMethod, { key: MessageKey; className: string }> = {
  'one-click': { key: 'methodOneClick', className: 'bg-ok-soft text-ok' },
  http: { key: 'methodLink', className: 'bg-info-soft text-info' },
  mailto: { key: 'methodEmail', className: 'bg-sunken text-muted' },
  none: { key: 'methodNone', className: 'bg-sunken text-subtle' },
}

export function MethodBadge({ method }: { method: UnsubscribeMethod }) {
  const t = useT()
  const style = STYLES[method]

  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${style.className}`}>
      {t(style.key)}
    </span>
  )
}
